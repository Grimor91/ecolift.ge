// Ready-made HTML copies of the pages built from database data: the parts
// catalog, each part, the articles list and each article, in ka/en/ru.
//
// Without them every such address returned the same empty index.html, so
// Google saw hundreds of identical pages and picked its own canonical
// ("Duplicate, Google chose different canonical than user"). Each copy is the
// site's index.html with the page's own title, description, canonical and
// language links, plus its text inside <app-root>. Angular starts on top of it
// for visitors, exactly like the fixed pages in prerender/ (scripts/prerender.mjs).
//
// The copies are written to <public_html>/pages/<lang>/ and .htaccess serves
// them. They are rebuilt on start, after every change in the admin panel, when
// a new site upload replaces index.html (the copies must load its new scripts),
// and every few hours for changes made straight in the database.
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const db = require('../config/db');

const LANGS = ['ka', 'en', 'ru'];
const PUBLIC_DIR = process.env.PUBLIC_HTML_DIR || path.join(os.homedir(), 'public_html');
const SITE = (process.env.SITE_URL || 'https://ecolift.ge').replace(/\/$/, '');

const TEXT = {
  ka: { catalog: 'სათადარიგო ნაწილების კატალოგი', code: 'კოდი', price: 'ფასი შეთანხმებით', currency: '₾', category: 'კატეგორია', other: 'სხვა', articles: 'ტექნიკური სტატიები' },
  en: { catalog: 'Spare parts catalog', code: 'Code', price: 'Price on request', currency: 'GEL', category: 'Category', other: 'Other', articles: 'Technical articles' },
  ru: { catalog: 'Каталог запчастей', code: 'Код', price: 'Цена по запросу', currency: '₾', category: 'Категория', other: 'Другое', articles: 'Технические статьи' },
};

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Georgian pages have the plain address; English and Russian add ?lang=. */
const langUrl = (loc, lang) => `${SITE}/${loc}${lang === 'ka' ? '' : `?lang=${lang}`}`;

/** The languages a row really has text in (Georgian is always there). */
const langsOf = (row, field) => LANGS.filter((l) => l === 'ka' || (row[`${field}_${l}`] || '').trim());

const pick = (row, field, lang) => row[`${field}_${lang}`] || row[`${field}_ka`] || '';

/**
 * Just enough Markdown for Google to read an article: headings, paragraphs,
 * lists and photos. Visitors see the full rendering by the Angular app.
 */
function markdownToHtml(md) {
  const inline = (s) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\s][^*]*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  return String(md || '')
    .replace(/\r/g, '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const img = block.match(/^!\[([^\]]*)\]\(uploads\/([A-Za-z0-9._-]+)\)$/);
      if (img) return `<figure><img src="/api/uploads/${img[2]}" alt="${esc(img[1])}"></figure>`;
      const h = block.match(/^(#{1,4})\s+(.+)$/);
      if (h) return `<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`;
      const lines = block.split('\n');
      if (lines.every((l) => /^\s*([-*]|\d+\.)\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*([-*]|\d+\.)\s+/, ''))}</li>`).join('')}</ul>`;
      }
      // Tables and anything else: plain text, one line per row.
      return `<p>${lines.map((l) => inline(l.replace(/^\||\|$/g, '').replace(/\|/g, ' · '))).filter((l) => !/^[\s·:-]*$/.test(l)).join('<br>')}</p>`;
    })
    .join('\n');
}

/**
 * The site's index.html with this page's head tags and text.
 * `langs` are the languages the page exists in; the others aren't listed,
 * so Google never sees an "English" page that shows Georgian text.
 */
function render(shell, { loc, lang, langs, title, description, body }) {
  const desc = description.replace(/\s+/g, ' ').trim().slice(0, 300);
  const links = [
    `<link rel="canonical" href="${esc(langUrl(loc, lang))}">`,
    ...(langs.length > 1
      ? [...langs.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(langUrl(loc, l))}">`),
         `<link rel="alternate" hreflang="x-default" href="${esc(langUrl(loc, 'ka'))}">`]
      : []),
  ].join('\n  ');
  return shell
    .replace(/<html[^>]*>/, `<html lang="${lang}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}">`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}">`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc)}">`)
    .replace(/<link rel="(canonical|alternate)"[^>]*>\s*/g, '')
    .replace('</head>', `  ${links}\n</head>`)
    .replace(/<app-root>[\s\S]*?<\/app-root>/, `<app-root>\n${body}\n</app-root>`);
}

/** Every page's file name (under pages/<lang>/) and its HTML. Pure, for tests. */
function buildPages(shell, i18n, { categories, products, images, articles }) {
  const out = [];
  const catById = new Map(categories.map((c) => [c.id, c]));
  const firstImage = new Map();
  for (const img of images) if (!firstImage.has(img.product_id)) firstImage.set(img.product_id, img.file_name);

  for (const lang of LANGS) {
    const t = TEXT[lang];
    const seo = (key) => i18n[lang]?.seo?.[key] || i18n.ka?.seo?.[key] || {};

    // The catalog: every part grouped by category, so Google finds each part's page.
    const groups = [...categories.map((c) => ({ name: pick(c, 'name', lang), items: products.filter((p) => p.category_id === c.id) })),
      { name: t.other, items: products.filter((p) => !catById.has(p.category_id)) }].filter((g) => g.items.length);
    out.push({
      file: `${lang}/parts.html`,
      html: render(shell, {
        loc: 'parts', lang, langs: LANGS,
        title: seo('parts').title || `${t.catalog} | Ecolift`,
        description: seo('parts').description || t.catalog,
        body: `<main><h1>${esc(t.catalog)}</h1>\n` + groups.map((g) =>
          `<section><h2>${esc(g.name)}</h2><ul>` +
          g.items.map((p) => {
            const l = langsOf(p, 'name').includes(lang) ? lang : 'ka';
            return `<li><a href="/parts/${p.id}${l === 'ka' ? '' : `?lang=${l}`}">${esc(pick(p, 'name', l))}</a> (${esc(p.code)})</li>`;
          }).join('') +
          '</ul></section>').join('\n') + '</main>',
      }),
    });

    for (const p of products) {
      const langs = langsOf(p, 'name');
      const shown = langs.includes(lang) ? lang : 'ka';
      const name = pick(p, 'name', shown);
      const description = pick(p, 'description', shown);
      const category = catById.get(p.category_id);
      const price = p.price === null || p.price === undefined ? t.price : `${Number(p.price)} ${t.currency}`;
      const img = firstImage.get(p.id);
      out.push({
        file: `${lang}/parts/${p.id}.html`,
        html: render(shell, {
          loc: `parts/${p.id}`, lang: shown, langs,
          title: `${name} (${p.code}) | Ecolift`,
          description: `${name}. ${category ? `${pick(category, 'name', shown)}. ` : ''}${description}`,
          body: `<main><h1>${esc(name)}</h1>\n` +
            (img ? `<img src="/api/uploads/${esc(img)}" alt="${esc(name)}">\n` : '') +
            `<p>${esc(TEXT[shown].code)}: ${esc(p.code)}</p>\n` +
            (category ? `<p>${esc(TEXT[shown].category)}: <a href="/parts">${esc(pick(category, 'name', shown))}</a></p>\n` : '') +
            (description ? `<p>${esc(description)}</p>\n` : '') +
            `<p>${esc(price)}</p></main>`,
        }),
      });
    }

    out.push({
      file: `${lang}/articles.html`,
      html: render(shell, {
        loc: 'articles', lang, langs: LANGS,
        title: seo('articles').title || `${t.articles} | Ecolift`,
        description: seo('articles').description || t.articles,
        body: `<main><h1>${esc(t.articles)}</h1>\n` + articles.map((a) => {
          const l = langsOf(a, 'title').includes(lang) ? lang : 'ka';
          return `<article><h2><a href="/articles/${esc(a.slug)}${l === 'ka' ? '' : `?lang=${l}`}">${esc(pick(a, 'title', l))}</a></h2><p>${esc(pick(a, 'summary', l))}</p></article>`;
        }).join('\n') + '</main>',
      }),
    });

    for (const a of articles) {
      // An article counts as translated only when its text is, not just its title.
      const langs = LANGS.filter((l) => l === 'ka' || ((a[`title_${l}`] || '').trim() && (a[`body_${l}`] || '').trim()));
      const shown = langs.includes(lang) ? lang : 'ka';
      const title = pick(a, 'title', shown);
      out.push({
        file: `${lang}/articles/${a.slug}.html`,
        html: render(shell, {
          loc: `articles/${a.slug}`, lang: shown, langs,
          title: `${title} | Ecolift`,
          description: pick(a, 'summary', shown) || title,
          body: `<main><article><h1>${esc(title)}</h1>\n` +
            (a.cover_image ? `<img src="/api/uploads/${esc(a.cover_image)}" alt="${esc(title)}">\n` : '') +
            `${markdownToHtml(pick(a, 'body', shown))}</article></main>`,
        }),
      });
    }
  }
  return out;
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return {};
  }
}

let lastShell = null;
let running = null;
let again = false;

/** Writes all copies into pages.new/ and then swaps it in for pages/. */
async function generate() {
  const indexFile = path.join(PUBLIC_DIR, 'index.html');
  let shell;
  try {
    shell = await fs.readFile(indexFile, 'utf8');
  } catch {
    console.warn(`Page copies skipped: ${indexFile} not found (set PUBLIC_HTML_DIR)`);
    return;
  }
  lastShell = shell;
  const i18n = {};
  for (const l of LANGS) i18n[l] = await readJson(path.join(PUBLIC_DIR, 'assets', 'i18n-v2', `${l}.json`));
  const [categories] = await db.query('SELECT id, name_ka, name_en, name_ru FROM categories ORDER BY sort_order, id');
  const [products] = await db.query(
    `SELECT id, category_id, code, name_ka, name_en, name_ru, description_ka, description_en, description_ru, price
     FROM products WHERE is_active = 1 ORDER BY id`
  );
  const [images] = await db.query('SELECT product_id, file_name FROM product_images ORDER BY sort_order, id');
  const [articles] = await db.query('SELECT * FROM articles WHERE is_published = 1 ORDER BY created_at DESC, id DESC');

  const pages = buildPages(shell, i18n, { categories, products, images, articles });
  const target = path.join(PUBLIC_DIR, 'pages');
  const temp = path.join(PUBLIC_DIR, 'pages.new');
  const old = path.join(PUBLIC_DIR, 'pages.old');
  await fs.rm(temp, { recursive: true, force: true });
  for (const p of pages) {
    const file = path.join(temp, p.file);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, p.html);
  }
  await fs.rm(old, { recursive: true, force: true });
  await fs.rename(target, old).catch(() => {});
  await fs.rename(temp, target);
  await fs.rm(old, { recursive: true, force: true });
  console.log(`Page copies: ${pages.length} files written to ${target}`);
}

/** Runs generate(), one at a time; a request during a run starts one more after it. */
function refresh() {
  if (running) {
    again = true;
    return running;
  }
  running = generate()
    .catch((err) => console.error('Page copies failed:', err.message))
    .finally(() => {
      running = null;
      if (again) {
        again = false;
        refresh();
      }
    });
  return running;
}

let timer = null;
/** Many admin edits in a row (e.g. a bulk import) cause one rebuild. */
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(refresh, 5000);
}

/** Rebuilds after a new site upload changed index.html. */
async function checkShell() {
  try {
    const shell = await fs.readFile(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
    if (shell !== lastShell) refresh();
  } catch {}
}

function start() {
  refresh();
  setInterval(checkShell, 60 * 1000).unref();
  setInterval(refresh, 6 * 60 * 60 * 1000).unref();
}

module.exports = { start, schedule, refresh, buildPages, markdownToHtml };
