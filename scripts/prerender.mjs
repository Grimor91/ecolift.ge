// Saves a ready-made HTML copy of each public page, so Google sees the text
// without having to run Angular first. Run after `ng build`:
//
//   npm run prerender            (or: node scripts/prerender.mjs [distDir])
//
// The copies go to <dist>/prerender/<route>.html and .htaccess serves them for
// those addresses. Visitors still get the normal Angular app: it starts on top
// of the copy and replaces it. Pages built from database data (parts, news)
// are not copied, so they never show outdated content.
//
// Needs Chromium: set CHROMIUM_PATH, or install it with `npx playwright install chromium`.
import { createServer } from 'node:http';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const ROUTES = ['', 'lifts', 'cardpassenger', 'panoramic', 'Dumbwaiters', 'tailormade', 'escolator', 'service', 'quote', 'aboutus', 'resources'];

const dist = path.resolve(process.argv[2] || 'dist/ecoliftplus');
const outDir = path.join(dist, 'prerender');
const shell = await readFile(path.join(dist, 'index.html'), 'utf8');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

// Serves the build like the host does: real files as-is, every route as index.html.
// There is no API here, so the pages render only their own fixed text.
const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (urlPath.startsWith('/api/')) return res.writeHead(404).end();
  const file = path.join(dist, urlPath);
  try {
    if (file.startsWith(dist) && (await stat(file)).isFile()) {
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      return res.end(await readFile(file));
    }
  } catch {}
  res.writeHead(200, { 'Content-Type': 'text/html' }).end(shell);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

// Scripts the page added while running (e.g. the Google Maps loader) would load
// twice once Angular starts again in the visitor's browser, so only the
// build's own scripts are kept.
const keptScripts = new Set([...shell.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
// A normal browser name, so the site treats the visit like a real one.
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 ecolift-prerender',
});
// Outside requests (maps, fonts, video) don't change the page text.
await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

let failed = 0;
for (const route of ROUTES) {
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/${route}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('app-root')?.children.length && document.title, null, { timeout: 15000 });
    await page.evaluate((kept) => {
      document.querySelectorAll('script').forEach((s) => {
        if (!s.src || !kept.includes(s.getAttribute('src'))) s.remove();
      });
    }, [...keptScripts]);
    const html = '<!DOCTYPE html>\n' + (await page.evaluate(() => document.documentElement.outerHTML));
    const text = await page.evaluate(() => document.querySelector('app-root').innerText.trim().length);
    if (text < 200) throw new Error(`only ${text} characters of text rendered`);
    await writeFile(path.join(outDir, `${route || 'index'}.html`), html);
    console.log(`/${route}: ${Math.round(html.length / 1024)} KB, ${text} characters of text`);
  } catch (err) {
    failed++;
    console.error(`/${route}: FAILED - ${err.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
server.close();
if (failed) process.exit(1);
