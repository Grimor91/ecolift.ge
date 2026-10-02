const fs = require('fs');
const path = require('path');
const db = require('./db');

// Tables added after the first deploy are created here on startup, so an
// update needs no manual SQL step in phpMyAdmin.
const TABLES = ['service_requests', 'quote_requests', 'news_posts'];

// Columns added to tables that may already exist on the live database.
const COLUMNS = {
  quote_requests: {
    shaft_width: 'SMALLINT UNSIGNED NULL',
    shaft_depth: 'SMALLINT UNSIGNED NULL',
    pit_depth: 'SMALLINT UNSIGNED NULL',
    last_floor_height: 'SMALLINT UNSIGNED NULL',
    floor_height: 'SMALLINT UNSIGNED NULL',
    drawing_file: 'VARCHAR(100) NULL',
    drawing_name: 'VARCHAR(255) NULL',
  },
};

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  for (const table of TABLES) {
    const match = sql.match(new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\([\\s\\S]*?\\) ENGINE=[^;]+;`));
    if (match) await db.query(match[0]);
  }

  for (const [table, columns] of Object.entries(COLUMNS)) {
    const [existing] = await db.query(
      'SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
      [table]
    );
    const have = new Set(existing.map((c) => c.name));
    for (const [column, type] of Object.entries(columns)) {
      if (!have.has(column)) await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  }

  // The quote form no longer asks for capacity.
  await db.query('ALTER TABLE quote_requests MODIFY capacity VARCHAR(20) NULL');
}

module.exports = migrate;
