const fs = require('fs');
const path = require('path');
const db = require('./db');

// Tables added after the first deploy are created here on startup, so an
// update needs no manual SQL step in phpMyAdmin.
const TABLES = ['service_requests', 'quote_requests', 'news_posts'];

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  for (const table of TABLES) {
    const match = sql.match(new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\([\\s\\S]*?\\) ENGINE=[^;]+;`));
    if (match) await db.query(match[0]);
  }
}

module.exports = migrate;
