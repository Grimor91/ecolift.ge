require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const multer = require('multer');
const { UPLOAD_DIR } = require('./middleware/upload');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1); // cPanel (Passenger) sits behind a proxy

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (process.env.CORS_ORIGIN || '').split(',').filter(Boolean) }));
app.use(express.json({ limit: '100kb' }));

const api = express.Router();
api.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }));
// API answers change with every edit in the admin panel, so neither the browser
// nor the host's LiteSpeed cache may keep them (it kept serving stale lists).
api.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-LiteSpeed-Cache-Control', 'no-cache');
  next();
});
api.get('/health', (req, res) => res.json({ ok: true }));
api.use('/', require('./routes/public'));
api.use('/admin', require('./routes/admin'));

// cPanel mounts the app under its "Application URL" (e.g. /api) and forwards the full path.
app.use(process.env.BASE_PATH || '/', api);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'file too large' : 'invalid upload' });
  }
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const port = Number(process.env.PORT) || 3000;
require('./config/migrate')()
  .catch((err) => console.error('Schema migration failed:', err.message))
  .finally(() => app.listen(port, () => console.log(`ecolift API listening on ${port}`)));
