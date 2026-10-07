const db = require('../config/db');

// Country lookup works offline from a bundled database. If the package was not
// installed on the host yet, visits are still logged, just without a country.
let geoip = null;
try {
  geoip = require('geoip-country');
} catch {
  console.warn('geoip-country is not installed: visits are logged without country');
}

const KEEP_DAYS = 180;
const GEORGIA_OFFSET = 4 * 3600; // days in the admin panel run on Tbilisi time

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor/i;

function clientIp(req) {
  let ip = req.ip || '';
  // Behind the host's proxy req.ip can be the proxy itself; then the real
  // address is in the headers it adds.
  if (/^(::1|127\.|::ffff:127\.)/.test(ip)) {
    ip = req.get('x-real-ip') || (req.get('x-forwarded-for') || '').split(',')[0].trim() || ip;
  }
  return ip.replace(/^::ffff:/, '').slice(0, 45);
}

function deviceOf(ua) {
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Saves one page view. Returns false when it was not worth saving. */
async function recordVisit(req) {
  const ua = str(req.get('user-agent'), 255);
  const path = str(req.body?.path, 255);
  if (!ua || BOT.test(ua) || !path.startsWith('/') || path.startsWith('/admin')) return false;

  let referrer = str(req.body?.referrer, 255) || null;
  // Moving between pages of the site itself is not a referral.
  if (referrer && /^https?:\/\/(www\.)?ecolift\.ge(\/|$)/i.test(referrer)) referrer = null;

  const ip = clientIp(req);
  const country = geoip?.lookup(ip)?.country || null;
  await db.query('INSERT INTO visits (ip, country, path, referrer, device, user_agent) VALUES (?, ?, ?, ?, ?, ?)', [
    ip,
    country,
    path,
    referrer,
    deviceOf(ua),
    ua,
  ]);
  return true;
}

function countryName(code) {
  if (!code) return 'უცნობი';
  try {
    return new Intl.DisplayNames(['ka'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

/** Numbers for the admin "visitors" tab, for the last `days` days. */
async function visitStats(days) {
  await db.query('DELETE FROM visits WHERE created_at < NOW() - INTERVAL ? DAY', [KEEP_DAYS]);

  const now = Math.floor(Date.now() / 1000);
  const todayStart = Math.floor((now + GEORGIA_OFFSET) / 86400) * 86400 - GEORGIA_OFFSET;
  const since = todayStart - (days - 1) * 86400;
  const range = 'created_at >= FROM_UNIXTIME(?)';

  const summary = async (from) => {
    const [[row]] = await db.query(`SELECT COUNT(*) AS views, COUNT(DISTINCT ip) AS visitors FROM visits WHERE ${range}`, [from]);
    return { views: Number(row.views), visitors: Number(row.visitors) };
  };

  const [daily] = await db.query(
    `SELECT FLOOR((UNIX_TIMESTAMP(created_at) + ?) / 86400) AS day, COUNT(*) AS views, COUNT(DISTINCT ip) AS visitors
     FROM visits WHERE ${range} GROUP BY day ORDER BY day`,
    [GEORGIA_OFFSET, since]
  );
  const byDay = new Map(daily.map((d) => [Number(d.day), d]));
  const firstDay = Math.floor((since + GEORGIA_OFFSET) / 86400);
  const perDay = [];
  for (let i = 0; i < days; i++) {
    const d = byDay.get(firstDay + i);
    perDay.push({
      date: new Date((firstDay + i) * 86400 * 1000).toISOString().slice(0, 10),
      views: d ? Number(d.views) : 0,
      visitors: d ? Number(d.visitors) : 0,
    });
  }

  const [countries] = await db.query(
    `SELECT country, COUNT(DISTINCT ip) AS visitors, COUNT(*) AS views FROM visits WHERE ${range}
     GROUP BY country ORDER BY visitors DESC, views DESC LIMIT 30`,
    [since]
  );
  const [pages] = await db.query(
    `SELECT path, COUNT(*) AS views, COUNT(DISTINCT ip) AS visitors FROM visits WHERE ${range}
     GROUP BY path ORDER BY views DESC LIMIT 20`,
    [since]
  );
  const [referrers] = await db.query(
    `SELECT referrer, COUNT(DISTINCT ip) AS visitors FROM visits WHERE ${range} AND referrer IS NOT NULL
     GROUP BY referrer ORDER BY visitors DESC LIMIT 20`,
    [since]
  );
  const [recent] = await db.query(
    'SELECT id, ip, country, path, referrer, device, created_at FROM visits ORDER BY id DESC LIMIT 200'
  );

  return {
    days,
    today: await summary(todayStart),
    week: await summary(todayStart - 6 * 86400),
    period: await summary(since),
    perDay,
    countries: countries.map((c) => ({ ...c, name: countryName(c.country), visitors: Number(c.visitors), views: Number(c.views) })),
    pages: pages.map((p) => ({ ...p, views: Number(p.views), visitors: Number(p.visitors) })),
    referrers: referrers.map((r) => ({ ...r, visitors: Number(r.visitors) })),
    recent: recent.map((v) => ({ ...v, country_name: v.country ? countryName(v.country) : null })),
  };
}

module.exports = { recordVisit, visitStats, clientIp };
