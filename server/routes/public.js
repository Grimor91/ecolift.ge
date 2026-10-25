const fs = require('fs/promises');
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const { withImages } = require('../services/products');
const { drawingUpload } = require('../middleware/upload');
const { recordVisit } = require('../services/visits');
const assistant = require('../services/assistant');
const {
  sendOrderEmails,
  sendServiceRequestEmail,
  sendQuoteRequestEmail,
  EQUIPMENT,
  ISSUES,
  PRODUCTS,
  BUILDINGS,
} = require('../services/mailer');

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

// Every public page, so Google can find the part pages too. robots.txt points here.
const STATIC_PAGES = ['', 'lifts', 'cardpassenger', 'panoramic', 'Dumbwaiters', 'tailormade', 'escolator', 'parts', 'service', 'quote', 'news', 'articles', 'aboutus', 'resources'];

// Each page is listed in Georgian (plain address) with its English and Russian
// versions (?lang=en, ?lang=ru) as alternates, so Google shows the right one.
router.get('/sitemap.xml', async (req, res) => {
  const site = (process.env.SITE_URL || 'https://ecolift.ge').replace(/\/$/, '');
  const [products] = await db.query('SELECT id, name_en, name_ru, updated_at FROM products WHERE is_active = 1 ORDER BY id');
  const [articles] = await db.query(
    'SELECT slug, title_en, title_ru, body_en, body_ru, updated_at FROM articles WHERE is_published = 1 ORDER BY id'
  );
  const href = (loc, lang) => `${site}/${loc}${lang === 'ka' ? '' : `?lang=${lang}`}`;
  // Only the languages a part or article is translated into; an untranslated
  // one shows Georgian text, and its ?lang= address points Google to the Georgian one.
  const url = (loc, lastmod, langs = ['ka', 'en', 'ru']) => {
    const alternates = langs.length < 2 ? '' : langs
      .map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${href(loc, l)}"/>`)
      .join('') + `<xhtml:link rel="alternate" hreflang="x-default" href="${href(loc, 'ka')}"/>`;
    const mod = lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : '';
    return langs.map((l) => `<url><loc>${href(loc, l)}</loc>${mod}${alternates}</url>`).join('');
  };
  const has = (row, ...fields) => (l) => l === 'ka' || fields.every((f) => (row[`${f}_${l}`] || '').trim());
  const body = [
    ...STATIC_PAGES.map((p) => url(p)),
    ...articles.map((a) => url(`articles/${a.slug}`, a.updated_at, ['ka', 'en', 'ru'].filter(has(a, 'title', 'body')))),
    ...products.map((p) => url(`parts/${p.id}`, p.updated_at, ['ka', 'en', 'ru'].filter(has(p, 'name')))),
  ].join('');
  res.type('application/xml').send(
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
      `xmlns:xhtml="http://www.w3.org/1999/xhtml">${body}</urlset>`
  );
});

const ARTICLE_LIST = `id, slug, title_ka, title_en, title_ru, summary_ka, summary_en, summary_ru,
  cover_image, author, created_at, updated_at`;

router.get('/articles', async (req, res) => {
  const [rows] = await db.query(`SELECT ${ARTICLE_LIST} FROM articles WHERE is_published = 1 ORDER BY created_at DESC, id DESC`);
  res.json(rows);
});

router.get('/articles/:slug', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM articles WHERE slug = ? AND is_published = 1', [String(req.params.slug)]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// The site reports every page a visitor opens (see VisitService in the Angular app).
const visitLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false });

router.post('/visit', visitLimiter, async (req, res) => {
  await recordVisit(req);
  res.status(204).end();
});

// The chat window on the site. Answers come from this server only (see services/assistant.js).
const assistantLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false });

router.post('/assistant', assistantLimiter, async (req, res) => {
  const message = str(req.body?.message, 500);
  if (!message) return res.status(400).json({ error: 'message is required' });
  const result = await assistant.reply(message, req.body?.lang);
  try {
    await assistant.logQuestion(message, result);
  } catch (err) {
    console.error('Assistant log failed:', err.message);
  }
  res.json({
    lang: result.lang,
    text: result.text,
    extraText: result.extraText || null,
    products: result.products,
    actions: result.actions,
    searchQuery: result.searchQuery || null,
  });
});

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

router.post('/service-requests', orderLimiter, async (req, res) => {
  const body = req.body || {};
  const r = {
    name: str(body.name, 190),
    phone: str(body.phone, 50),
    address: str(body.address, 255),
    equipment: str(body.equipment, 30),
    issue: str(body.issue, 30),
    urgent: body.urgent === true,
    comment: str(body.comment, 2000),
    lang: ['ka', 'en', 'ru'].includes(body.lang) ? body.lang : null,
  };
  if (!r.name || !r.phone || !r.address) {
    return res.status(400).json({ error: 'name, phone and address are required' });
  }
  if (!(r.equipment in EQUIPMENT) || !(r.issue in ISSUES)) {
    return res.status(400).json({ error: 'invalid equipment or issue' });
  }

  const [result] = await db.query(
    'INSERT INTO service_requests (customer_name, phone, address, equipment, issue, urgent, comment, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [r.name, r.phone, r.address, r.equipment, r.issue, r.urgent ? 1 : 0, r.comment || null, r.lang]
  );
  const id = result.insertId;

  // The request is already saved; a mail failure must not fail the request.
  try {
    await sendServiceRequestEmail(id, r);
    await db.query('UPDATE service_requests SET email_sent = 1 WHERE id = ?', [id]);
  } catch (err) {
    console.error(`Service request #${id} email failed:`, err.message);
  }

  res.status(201).json({ id });
});

// Shaft and floor sizes are entered in millimetres.
const mm = (v) => {
  const n = Math.round(Number(v));
  return n > 0 && n <= 30000 ? n : null;
};

router.post('/quote-requests', orderLimiter, drawingUpload.single('drawing'), async (req, res) => {
  const body = req.body || {};
  const floors = Math.floor(Number(body.floors));
  const drawing = req.file;
  const q = {
    name: str(body.name, 190),
    phone: str(body.phone, 50),
    email: str(body.email, 190),
    company: str(body.company, 190),
    city: str(body.city, 190),
    product: str(body.product, 30),
    building: str(body.building, 30),
    floors: floors > 0 && floors <= 200 ? floors : null,
    shaft_width: mm(body.shaft_width),
    shaft_depth: mm(body.shaft_depth),
    pit_depth: mm(body.pit_depth),
    last_floor_height: mm(body.last_floor_height),
    floor_height: mm(body.floor_height),
    drawing_file: drawing ? drawing.filename : null,
    drawing_name: drawing ? Buffer.from(drawing.originalname, 'latin1').toString('utf8').slice(0, 255) : null,
    drawing_path: drawing ? drawing.path : null,
    comment: str(body.comment, 2000),
    lang: ['ka', 'en', 'ru'].includes(body.lang) ? body.lang : null,
  };
  const reject = async (error) => {
    if (drawing) await fs.unlink(drawing.path).catch(() => {});
    res.status(400).json({ error });
  };
  if (!q.name || !q.phone) return reject('name and phone are required');
  if (q.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.email)) return reject('invalid email');
  if (!(q.product in PRODUCTS) || !(q.building in BUILDINGS)) return reject('invalid product or building');

  const [result] = await db.query(
    `INSERT INTO quote_requests (customer_name, phone, email, company, city, product, building, floors,
       shaft_width, shaft_depth, pit_depth, last_floor_height, floor_height, drawing_file, drawing_name, comment, lang)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [q.name, q.phone, q.email || null, q.company || null, q.city || null, q.product, q.building, q.floors,
      q.shaft_width, q.shaft_depth, q.pit_depth, q.last_floor_height, q.floor_height, q.drawing_file, q.drawing_name,
      q.comment || null, q.lang]
  );
  const id = result.insertId;

  // The request is already saved; a mail failure must not fail the request.
  try {
    await sendQuoteRequestEmail(id, q);
    await db.query('UPDATE quote_requests SET email_sent = 1 WHERE id = ?', [id]);
  } catch (err) {
    console.error(`Quote request #${id} email failed:`, err.message);
  }

  res.status(201).json({ id });
});

module.exports = router;
