const fs = require('fs/promises');
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const { upload, UPLOAD_DIR, DRAWING_DIR } = require('../middleware/upload');
const { withImages } = require('../services/products');
const { visitStats } = require('../services/visits');

const router = express.Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email.trim().toLowerCase()]);
  const admin = rows[0];
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

router.use(requireAdmin);

router.post('/password', loginLimiter, async (req, res) => {
  const { current, next } = req.body || {};
  if (typeof current !== 'string' || typeof next !== 'string') {
    return res.status(400).json({ error: 'შეავსეთ ორივე ველი' });
  }
  if (next.length < 10) return res.status(400).json({ error: 'ახალი პაროლი მინიმუმ 10 სიმბოლო უნდა იყოს' });
  const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [req.admin.id]);
  const admin = rows[0];
  if (!admin || !(await bcrypt.compare(current, admin.password_hash))) {
    return res.status(400).json({ error: 'ძველი პაროლი არასწორია' });
  }
  await db.query('UPDATE admins SET password_hash = ? WHERE id = ?', [await bcrypt.hash(next, 12), admin.id]);
  res.status(204).end();
});

// ---- Products ----

const nullable = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

function productFields(body) {
  return {
    category_id: nullable(body.category_id) === null ? null : Number(body.category_id),
    code: nullable(body.code),
    name_ka: nullable(body.name_ka),
    name_en: nullable(body.name_en),
    name_ru: nullable(body.name_ru),
    description_ka: nullable(body.description_ka),
    description_en: nullable(body.description_en),
    description_ru: nullable(body.description_ru),
    price: nullable(body.price) === null ? null : Number(body.price),
    in_stock: body.in_stock === undefined ? 1 : ['1', 'true', true, 1].includes(body.in_stock) ? 1 : 0,
    is_active: body.is_active === undefined ? 1 : ['1', 'true', true, 1].includes(body.is_active) ? 1 : 0,
  };
}

function validate(fields) {
  if (!fields.code || !fields.name_ka) return 'code and name_ka are required';
  if (fields.price !== null && !(fields.price >= 0)) return 'invalid price';
  return null;
}

async function removeFiles(fileNames) {
  await Promise.all(fileNames.map((f) => fs.unlink(path.join(UPLOAD_DIR, f)).catch(() => {})));
}

async function addImages(productId, files) {
  if (!files?.length) return;
  const [[{ next }]] = await db.query(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM product_images WHERE product_id = ?',
    [productId]
  );
  await db.query('INSERT INTO product_images (product_id, file_name, sort_order) VALUES ?', [
    files.map((f, i) => [productId, f.filename, next + i]),
  ]);
}

router.get('/products', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM products ORDER BY created_at DESC, id DESC');
  res.json(await withImages(rows));
});

router.post('/products', upload.array('images', 10), async (req, res) => {
  const fields = productFields(req.body);
  const error = validate(fields);
  if (error) {
    await removeFiles((req.files || []).map((f) => f.filename));
    return res.status(400).json({ error });
  }
  try {
    const [result] = await db.query('INSERT INTO products SET ?', [fields]);
    await addImages(result.insertId, req.files);
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json((await withImages(rows))[0]);
  } catch (err) {
    await removeFiles((req.files || []).map((f) => f.filename));
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'product code already exists' });
    throw err;
  }
});

router.put('/products/:id', upload.array('images', 10), async (req, res) => {
  const id = Number(req.params.id);
  const fields = productFields(req.body);
  const error = validate(fields);
  if (error) {
    await removeFiles((req.files || []).map((f) => f.filename));
    return res.status(400).json({ error });
  }
  try {
    const [result] = await db.query('UPDATE products SET ? WHERE id = ?', [fields, id]);
    if (!result.affectedRows) {
      await removeFiles((req.files || []).map((f) => f.filename));
      return res.status(404).json({ error: 'Not found' });
    }
    await addImages(id, req.files);
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json((await withImages(rows))[0]);
  } catch (err) {
    await removeFiles((req.files || []).map((f) => f.filename));
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'product code already exists' });
    throw err;
  }
});

router.delete('/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  const [images] = await db.query('SELECT file_name FROM product_images WHERE product_id = ?', [id]);
  const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
  await removeFiles(images.map((i) => i.file_name));
  res.status(204).end();
});

router.delete('/products/:id/images/:imageId', async (req, res) => {
  const [rows] = await db.query('SELECT file_name FROM product_images WHERE id = ? AND product_id = ?', [
    Number(req.params.imageId),
    Number(req.params.id),
  ]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  await db.query('DELETE FROM product_images WHERE id = ?', [Number(req.params.imageId)]);
  await removeFiles([rows[0].file_name]);
  res.status(204).end();
});

// ---- Categories ----

router.post('/categories', async (req, res) => {
  const name_ka = nullable(req.body?.name_ka);
  if (!name_ka) return res.status(400).json({ error: 'name_ka is required' });
  const [result] = await db.query('INSERT INTO categories (name_ka, name_en, name_ru, sort_order) VALUES (?, ?, ?, ?)', [
    name_ka,
    nullable(req.body.name_en),
    nullable(req.body.name_ru),
    Number(req.body.sort_order) || 0,
  ]);
  res.status(201).json({ id: result.insertId });
});

router.delete('/categories/:id', async (req, res) => {
  await db.query('DELETE FROM categories WHERE id = ?', [Number(req.params.id)]);
  res.status(204).end();
});

// ---- Orders ----

router.get('/orders', async (req, res) => {
  const [orders] = await db.query('SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT 200');
  if (!orders.length) return res.json([]);
  const [items] = await db.query('SELECT * FROM order_items WHERE order_id IN (?)', [orders.map((o) => o.id)]);
  res.json(orders.map((o) => ({ ...o, email_sent: !!o.email_sent, items: items.filter((i) => i.order_id === o.id) })));
});

const STATUSES = ['new', 'in_progress', 'done', 'cancelled'];

router.patch('/orders/:id', async (req, res) => {
  const status = req.body?.status;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'invalid status' });
  const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

// ---- Service requests ----

router.get('/service-requests', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM service_requests ORDER BY created_at DESC, id DESC LIMIT 200');
  res.json(rows.map((r) => ({ ...r, urgent: !!r.urgent, email_sent: !!r.email_sent })));
});

router.patch('/service-requests/:id', async (req, res) => {
  const status = req.body?.status;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'invalid status' });
  const [result] = await db.query('UPDATE service_requests SET status = ? WHERE id = ?', [status, Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

// ---- Quote requests ----

router.get('/quote-requests', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM quote_requests ORDER BY created_at DESC, id DESC LIMIT 200');
  res.json(rows.map((r) => ({ ...r, email_sent: !!r.email_sent })));
});

router.patch('/quote-requests/:id', async (req, res) => {
  const status = req.body?.status;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'invalid status' });
  const [result] = await db.query('UPDATE quote_requests SET status = ? WHERE id = ?', [status, Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

router.get('/quote-requests/:id/drawing', async (req, res) => {
  const [rows] = await db.query('SELECT drawing_file, drawing_name FROM quote_requests WHERE id = ?', [Number(req.params.id)]);
  const row = rows[0];
  if (!row?.drawing_file) return res.status(404).json({ error: 'Not found' });
  res.download(path.join(DRAWING_DIR, path.basename(row.drawing_file)), row.drawing_name || row.drawing_file);
});

// ---- News (LinkedIn posts) ----

// Accepts a LinkedIn post link (".../posts/...-activity-123...", ".../feed/update/urn:li:activity:123")
// or the code from the post's "Embed this post" menu, and keeps only the post id.
function parseLinkedInPost(input) {
  const text = String(input || '');
  let match = text.match(/urn(?::|%3A)li(?::|%3A)(share|activity|ugcPost)(?::|%3A)(\d{10,25})/i);
  let urn = null;
  if (match) {
    const kind = match[1].toLowerCase() === 'ugcpost' ? 'ugcPost' : match[1].toLowerCase();
    urn = `urn:li:${kind}:${match[2]}`;
  } else if ((match = text.match(/linkedin\.com\/posts\/[^\s"]*?-(?:activity|share|ugcPost)-(\d{10,25})/i))) {
    urn = `urn:li:activity:${match[1]}`;
  }
  if (!urn) return null;
  const h = Number((text.match(/height=["']?(\d{3,4})/i) || [])[1]);
  const height = h >= 300 && h <= 1500 ? h : 600;
  return { urn, height };
}

router.get('/news', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM news_posts ORDER BY created_at DESC, id DESC');
  res.json(rows);
});

router.post('/news', async (req, res) => {
  const post = parseLinkedInPost(req.body?.link);
  if (!post) return res.status(400).json({ error: 'LinkedIn-ის პოსტის ბმული ვერ ამოვიცანი' });
  try {
    const [result] = await db.query('INSERT INTO news_posts (urn, height) VALUES (?, ?)', [post.urn, post.height]);
    res.status(201).json({ id: result.insertId, ...post });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'ეს პოსტი უკვე დამატებულია' });
    throw err;
  }
});

// Also reachable as POST, because some hosting setups block the DELETE method.
async function deleteNews(req, res) {
  const [result] = await db.query('DELETE FROM news_posts WHERE id = ?', [Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
}
router.delete('/news/:id', deleteNews);
router.post('/news/:id/delete', deleteNews);

// ---- Articles ----

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_NAME = /^[A-Za-z0-9-]+\.(jpg|png|webp)$/;

// Latin letters for the address; Georgian titles are spelled out.
const GEO = 'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ';
const GEO_LAT = ['a', 'b', 'g', 'd', 'e', 'v', 'z', 't', 'i', 'k', 'l', 'm', 'n', 'o', 'p', 'zh', 'r', 's', 't', 'u', 'p', 'k', 'gh', 'q', 'sh', 'ch', 'ts', 'dz', 'ts', 'ch', 'kh', 'j', 'h'];
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/./g, (c) => (GEO.includes(c) ? GEO_LAT[GEO.indexOf(c)] : c))
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/, '');
}

function articleFields(body) {
  const f = {
    slug: slugify(body.slug || body.title_en || body.title_ka),
    author: nullable(body.author),
    cover_image: nullable(body.cover_image),
    is_published: [false, 0, '0', 'false'].includes(body.is_published) ? 0 : 1,
  };
  for (const lang of ['ka', 'en', 'ru']) {
    f[`title_${lang}`] = nullable(body[`title_${lang}`]);
    f[`summary_${lang}`] = nullable(body[`summary_${lang}`]);
    f[`body_${lang}`] = nullable(body[`body_${lang}`]);
  }
  return f;
}

function validateArticle(f) {
  if (!f.title_ka) return 'შეავსეთ სათაური ქართულად';
  if (!f.slug || !SLUG.test(f.slug)) return 'მისამართი (slug) არასწორია: მხოლოდ ლათინური ასოები, ციფრები და ტირე';
  if (f.cover_image && !IMAGE_NAME.test(f.cover_image)) return 'გარეკანის სურათი არასწორია';
  return null;
}

router.get('/articles', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM articles ORDER BY created_at DESC, id DESC');
  res.json(rows);
});

async function saveArticle(req, res) {
  const f = articleFields(req.body || {});
  const error = validateArticle(f);
  if (error) return res.status(400).json({ error });
  const id = req.params.id ? Number(req.params.id) : null;
  try {
    if (id) {
      const [result] = await db.query('UPDATE articles SET ? WHERE id = ?', [f, id]);
      if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
      return res.json({ id, slug: f.slug });
    }
    const [result] = await db.query('INSERT INTO articles SET ?', [f]);
    res.status(201).json({ id: result.insertId, slug: f.slug });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'ასეთი მისამართით სტატია უკვე არსებობს, შეცვალეთ slug' });
    throw err;
  }
}
router.post('/articles', saveArticle);
router.put('/articles/:id', saveArticle);
router.post('/articles/:id', saveArticle);

router.post('/articles/:id/delete', async (req, res) => {
  const [result] = await db.query('DELETE FROM articles WHERE id = ?', [Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

// A photo for an article: saved in uploads/, and the editor puts its name into the text.
router.post('/article-images', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'აირჩიეთ სურათი (jpg, png ან webp)' });
  res.status(201).json({ file: req.file.filename, url: `/uploads/${req.file.filename}` });
});

router.get('/visits', async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 180);
  res.json(await visitStats(days));
});

module.exports = router;
module.exports.parseLinkedInPost = parseLinkedInPost;
