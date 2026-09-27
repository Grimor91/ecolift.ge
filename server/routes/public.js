const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const { withImages } = require('../services/products');
const { sendOrderEmails } = require('../services/mailer');

const router = express.Router();

router.get('/categories', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY sort_order, name_ka');
  res.json(rows);
});

router.get('/products', async (req, res) => {
  const where = ['is_active = 1'];
  const params = [];
  if (req.query.category) {
    where.push('category_id = ?');
    params.push(Number(req.query.category));
  }
  if (req.query.search) {
    const q = `%${String(req.query.search).slice(0, 100)}%`;
    where.push('(code LIKE ? OR name_ka LIKE ? OR name_en LIKE ? OR name_ru LIKE ?)');
    params.push(q, q, q, q);
  }
  const limit = Math.min(Number(req.query.limit) || 24, 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const whereSql = where.join(' AND ');

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM products WHERE ${whereSql}`, params);
  const [rows] = await db.query(
    `SELECT * FROM products WHERE ${whereSql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );
  res.json({ items: await withImages(rows), total, page, limit });
});

router.get('/products/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM products WHERE id = ? AND is_active = 1', [Number(req.params.id)]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json((await withImages(rows))[0]);
});

const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

router.post('/orders', orderLimiter, async (req, res) => {
  const body = req.body || {};
  const customer = {
    name: str(body.name, 190),
    phone: str(body.phone, 50),
    email: str(body.email, 190),
    company: str(body.company, 190),
    comment: str(body.comment, 2000),
  };
  if (!customer.name || !customer.phone) {
    return res.status(400).json({ error: 'name and phone are required' });
  }
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return res.status(400).json({ error: 'invalid email' });
  }

  const requested = Array.isArray(body.items) ? body.items.slice(0, 100) : [];
  const qtyById = new Map();
  for (const i of requested) {
    const id = Number(i?.productId);
    const qty = Math.floor(Number(i?.quantity));
    if (id > 0 && qty > 0 && qty <= 10000) qtyById.set(id, (qtyById.get(id) || 0) + qty);
  }
  if (!qtyById.size) return res.status(400).json({ error: 'items are required' });

  const [products] = await db.query(
    'SELECT id, code, name_ka FROM products WHERE id IN (?) AND is_active = 1',
    [[...qtyById.keys()]]
  );
  if (products.length !== qtyById.size) {
    return res.status(400).json({ error: 'some products are unavailable' });
  }
  const items = products.map((p) => ({ productId: p.id, code: p.code, name: p.name_ka, quantity: qtyById.get(p.id) }));

  const conn = await db.getConnection();
  let orderId;
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO orders (customer_name, phone, email, company, comment) VALUES (?, ?, ?, ?, ?)',
      [customer.name, customer.phone, customer.email || null, customer.company || null, customer.comment || null]
    );
    orderId = result.insertId;
    await conn.query(
      'INSERT INTO order_items (order_id, product_id, product_code, product_name, quantity) VALUES ?',
      [items.map((i) => [orderId, i.productId, i.code, i.name, i.quantity])]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // The order is already saved; a mail failure must not fail the request.
  try {
    await sendOrderEmails(orderId, customer, items);
    await db.query('UPDATE orders SET email_sent = 1 WHERE id = ?', [orderId]);
  } catch (err) {
    console.error(`Order #${orderId} email failed:`, err.message);
  }

  res.status(201).json({ id: orderId });
});

module.exports = router;
