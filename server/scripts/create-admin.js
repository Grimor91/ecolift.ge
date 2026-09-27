// Usage: npm run create-admin -- admin@ecolift.ge 'StrongPassword'
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/db');

(async () => {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 10) {
    console.error('Usage: npm run create-admin -- <email> <password (min 10 chars)>');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  await db.query(
    'INSERT INTO admins (email, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
    [email.trim().toLowerCase(), hash]
  );
  console.log(`Admin ${email} saved.`);
  await db.end();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
