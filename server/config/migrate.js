const fs = require('fs');
const path = require('path');
const db = require('./db');
const { UPLOAD_DIR } = require('../middleware/upload');

// Tables added after the first deploy are created here on startup, so an
// update needs no manual SQL step in phpMyAdmin.
const TABLES = ['service_requests', 'quote_requests', 'news_posts', 'visits', 'articles', 'assistant_answers', 'assistant_questions'];

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
  const [present] = await db.query(
    'SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()'
  );
  const hadArticles = present.some((t) => t.name === 'articles');
  const hadAnswers = present.some((t) => t.name === 'assistant_answers');
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

  // The first articles arrive with the update itself, only when the table is new,
  // so an article deleted in the admin panel does not come back.
  if (!hadArticles) await seedArticles();
  // Same for the assistant's first answers.
  if (!hadAnswers) await seedAssistantAnswers();
}

async function seedAssistantAnswers() {
  const file = path.join(__dirname, '..', 'seed', 'assistant-answers.json');
  if (!fs.existsSync(file)) return;
  const answers = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [i, a] of answers.entries()) {
    await db.query(
      `INSERT INTO assistant_answers (title, keywords, answer_ka, answer_en, answer_ru, action, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [a.title, a.keywords, a.answer_ka, a.answer_en, a.answer_ru, a.action || null, i + 1]
    );
  }
}

async function seedArticles() {
  const dir = path.join(__dirname, '..', 'seed', 'articles');
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const a = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const body = (lang) => {
      const p = path.join(dir, `${a.slug}.${lang}.md`);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    };
    for (const image of a.images || []) {
      const target = path.join(UPLOAD_DIR, image);
      if (!fs.existsSync(target)) fs.copyFileSync(path.join(dir, image), target);
    }
    await db.query(
      `INSERT IGNORE INTO articles (slug, title_ka, title_en, title_ru, summary_ka, summary_en, summary_ru,
         body_ka, body_en, body_ru, cover_image, author) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.slug, a.title_ka, a.title_en, a.title_ru, a.summary_ka, a.summary_en, a.summary_ru,
        body('ka'), body('en'), body('ru'), a.cover_image || null, a.author || null]
    );
  }
}

module.exports = migrate;
