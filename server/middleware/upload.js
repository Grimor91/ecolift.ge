const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + ALLOWED[file.mimetype]),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED[file.mimetype]) cb(null, true);
    else cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
  },
});

// Drawings customers attach to a quote request. They are kept outside the public
// uploads folder and only reach the admin panel and the notification email.
const DRAWING_DIR = path.join(__dirname, '..', 'private', 'drawings');
fs.mkdirSync(DRAWING_DIR, { recursive: true });
const DRAWING_EXT = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.dwg', '.dxf'];

const drawingUpload = multer({
  storage: multer.diskStorage({
    destination: DRAWING_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (DRAWING_EXT.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
  },
});

module.exports = { upload, UPLOAD_DIR, drawingUpload, DRAWING_DIR };
