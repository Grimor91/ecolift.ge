const db = require('../config/db');

// The site assistant. It runs entirely on this server, with no outside AI
// service: it reads the visitor's message, finds the best matching answer the
// admin wrote (assistant_answers) and searches the parts catalog. Words are
// compared loosely, so different endings ("ლიფტი"/"ლიფტის"), small typos and
// Georgian typed in Latin letters ("lifti gafuchda") still match.

const LANGS = ['ka', 'en', 'ru'];
const KEEP_DAYS = 180;
const CACHE_MS = 2 * 60 * 1000;

// Georgian letters written the way people type them in Latin. Letters that
// sound alike (თ/ტ, კ/ქ/ყ, პ/ფ, ც/წ, ჩ/ჭ) become the same, because people
// type both as one Latin letter.
const GEO = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i', კ: 'k', ლ: 'l', მ: 'm', ნ: 'n',
  ო: 'o', პ: 'p', ჟ: 'zh', რ: 'r', ს: 's', ტ: 't', უ: 'u', ფ: 'p', ქ: 'k', ღ: 'gh', ყ: 'k', შ: 'sh', ჩ: 'ch',
  ც: 'ts', ძ: 'dz', წ: 'ts', ჭ: 'ch', ხ: 'kh', ჯ: 'j', ჰ: 'h',
};

/** One spelling for a word, whichever alphabet or Latin style it was typed in. */
function canonical(word) {
  let w = word.toLowerCase().replace(/ё/g, 'е');
  if (/[ა-ჰ]/.test(w)) return w.replace(/[ა-ჰ]/g, (c) => GEO[c] || c);
  if (/[а-я]/.test(w)) return w;
  return w
    .replace(/tch/g, 'ch')
    .replace(/th/g, 't')
    .replace(/ph/g, 'p')
    .replace(/dj/g, 'j')
    .replace(/ch/g, '\u0001')
    .replace(/c/g, 'ts')
    .replace(/\u0001/g, 'ch')
    .replace(/x/g, 'kh')
    .replace(/w/g, 'ts')
    .replace(/q/g, 'k')
    .replace(/y/g, 'k')
    .replace(/f/g, 'p');
}

// Words that say nothing about what the visitor wants.
const STOP = new Set(
  [
    // ka
    'და', 'რომ', 'არის', 'ვარ', 'მაქვს', 'გაქვთ', 'გაქვს', 'მინდა', 'მჭირდება', 'გჭირდებათ', 'თუ', 'ან', 'ეს', 'ის',
    'რა', 'რომელი', 'როგორ', 'მე', 'ჩვენ', 'თქვენ', 'მისი', 'არა', 'კი', 'დიახ', 'ძალიან', 'ერთი', 'უნდა', 'შეიძლება',
    'შეგიძლიათ', 'მითხარით', 'მითხარი', 'გთხოვთ', 'ხომ', 'რამე', 'ყველა', 'იქნება', 'ჩემი', 'ჩვენი', 'თქვენი', 'ზე',
    // en
    'the', 'a', 'an', 'i', 'we', 'you', 'is', 'are', 'am', 'do', 'does', 'have', 'has', 'need', 'want', 'for', 'to',
    'of', 'in', 'on', 'my', 'our', 'your', 'it', 'this', 'that', 'can', 'could', 'please', 'me', 'and', 'or', 'with',
    'what', 'which', 'any', 'some', 'there', 'be', 'looking',
    // ru
    'и', 'в', 'на', 'у', 'с', 'к', 'по', 'для', 'мне', 'нам', 'вас', 'вы', 'я', 'мы', 'есть', 'нужен', 'нужна',
    'нужно', 'нужны', 'хочу', 'это', 'как', 'что', 'какой', 'какая', 'или', 'а', 'не', 'да', 'нет', 'пожалуйста',
    'подскажите', 'скажите', 'можно', 'ли', 'мой', 'наш', 'ваш',
  ].map(canonical)
);

// Words that help pick an answer ("ახალი ლიფტი", "ნაწილი მჭირდება") but are
// in so many part names that they say nothing in a part search.
const GENERIC = new Set(
  [
    'ლიფტი', 'ლიფტის', 'ლიფტს', 'ლიფტში', 'ლიფტზე', 'ლიფტისთვის', 'ლიფტები', 'ლიფტების', 'ლიფტებისთვის',
    'ნაწილი', 'ნაწილის', 'ნაწილს', 'ნაწილები', 'ნაწილების', 'სათადარიგო', 'დეტალი', 'დეტალები',
    'elevator', 'elevators', 'lift', 'lifts', 'part', 'parts', 'spare', 'spares',
    'лифт', 'лифта', 'лифте', 'лифтов', 'лифты', 'лифтовой', 'деталь', 'детали', 'запчасть', 'запчасти',
  ].map(canonical)
);

// \b only knows Latin letters, so the end of the word is spelled out.
const GREETING = /^(გამარჯობა|გაგიმარჯოს|სალამი|hello|hi|hey|good (morning|afternoon|evening)|привет|здравствуйте|добрый (день|вечер)|gamarjoba|gagimarjos|salami)(?=$|[\s!,.?])/i;
const THANKS = /(მადლობ|გმადლობ|thank|thanks|thx|спасибо|благодар|madlob|gmadlob)/i;
const PART_CODE = /\bEL[-\s]?(\d{1,4})\b/i;

function tokens(text) {
  return String(text)
    .toLowerCase()
    .split(/[^0-9a-zа-яёა-ჰ*\/.-]+/i)
    .map((t) => t.replace(/^[-.\/*]+|[-.\/*]+$/g, ''))
    .filter((t) => t.length >= 2)
    .map(canonical)
    .filter((t) => !STOP.has(t));
}

function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * How well a typed word matches a known word: 1 the same, 0.8 the same word
 * with another ending, 0.6 a small typo, 0 no match.
 */
function wordMatch(q, w) {
  if (q === w) return 1;
  const digits = /\d/.test(q) || /\d/.test(w);
  if (digits) {
    // Model numbers must match exactly, or be the start of a longer one.
    return q.length >= 3 && w.startsWith(q) ? 0.8 : 0;
  }
  const short = Math.min(q.length, w.length);
  if (short >= 4) {
    let common = 0;
    while (common < short && q[common] === w[common]) common++;
    if (common >= Math.max(4, short - 2)) return 0.8;
  }
  if (short >= 5) {
    const max = short >= 8 ? 2 : 1;
    if (editDistance(q, w, max) <= max) return 0.6;
  }
  return 0;
}

let cache = null;

async function loadData() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;
  const [answers] = await db.query('SELECT * FROM assistant_answers WHERE is_active = 1 ORDER BY sort_order, id');
  const [products] = await db.query(
    `SELECT p.id, p.code, p.name_ka, p.name_en, p.name_ru, c.name_ka AS cat_ka, c.name_en AS cat_en, c.name_ru AS cat_ru,
       (SELECT file_name FROM product_images i WHERE i.product_id = p.id ORDER BY sort_order, id LIMIT 1) AS image
     FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.is_active = 1`
  );

  const docs = products.map((p) => {
    const words = new Set(tokens([p.code, p.name_ka, p.name_en, p.name_ru, p.cat_ka, p.cat_en, p.cat_ru].join(' ')).filter((w) => !GENERIC.has(w)));
    return { product: p, words: [...words] };
  });
  // Rare words (a brand, a model number) say more than words most parts share.
  const df = new Map();
  for (const d of docs) for (const w of d.words) df.set(w, (df.get(w) || 0) + 1);
  const idf = (w) => Math.log(1 + docs.length / (df.get(w) || 1));

  const parsedAnswers = answers.map((a) => ({
    ...a,
    phrases: String(a.keywords)
      .split(/[,;\n]+/)
      .map((k) => tokens(k))
      .filter((k) => k.length),
  }));

  cache = { at: Date.now(), answers: parsedAnswers, docs, idf, vocabulary: [...df.keys()] };
  return cache;
}

function clearCache() {
  cache = null;
}

function bestMatch(q, words) {
  let best = 0;
  for (const w of words) {
    const m = wordMatch(q, w);
    if (m > best) best = m;
    if (best === 1) break;
  }
  return best;
}

/**
 * The admin's answer that fits the message best, or null. Lift and part words
 * ("ლიფტის ფასი") only add to a phrase; alone they make a weak match, so
 * "Hitachi ნაწილები" lists parts rather than explaining how to order.
 */
function findAnswer(qTokens, answers) {
  let best = null;
  for (const a of answers) {
    let score = 0;
    for (const phrase of a.phrases) {
      const hits = phrase.map((w) => bestMatch(w, qTokens));
      const needed = phrase.map((w, i) => (GENERIC.has(w) ? 1 : hits[i])).every((h) => h > 0);
      const any = hits.some((h) => h > 0);
      if (!needed || !any) continue;
      const strong = phrase.filter((w, i) => !GENERIC.has(w) && hits[i] > 0);
      const sum = hits.reduce((s, h) => s + h, 0);
      const found = hits.filter((h) => h > 0).length;
      // A whole phrase ("ახალი ლიფტი") beats one of its words ("ახალი").
      // A phrase missing its lift word fits a bit less than a phrase without one.
      const missing = phrase.length - found;
      score = Math.max(score, strong.length ? sum + (found - 1) * 0.5 - missing * 0.1 : 0.3 * sum);
    }
    if (score > 0 && (!best || score > best.score)) best = { answer: a, score };
  }
  return best;
}

/** Parts whose name, brand or code match the message, best first. */
function findProducts(qTokens, data, limit = 5) {
  if (!qTokens.length) return [];
  const scored = [];
  for (const d of data.docs) {
    let score = 0;
    let quality = 0;
    let matched = 0;
    for (const q of qTokens) {
      let best = 0;
      let bestWord = null;
      for (const w of d.words) {
        const m = wordMatch(q, w);
        if (m > best) {
          best = m;
          bestWord = w;
          if (m === 1) break;
        }
      }
      if (best) {
        score += best * data.idf(bestWord);
        quality += best;
        matched++;
      }
    }
    if (matched) scored.push({ d, score, quality, matched });
  }
  // Most words found first, then exact spellings over typo matches, then rare words.
  scored.sort((a, b) => b.matched - a.matched || b.quality - a.quality || b.score - a.score);
  if (!scored.length) return [];
  // Keep only parts about as good as the best one, so "Otis door motor" does
  // not also list every other Otis part.
  const top = scored[0];
  return scored
    .filter((s) => s.matched === top.matched && s.quality === top.quality && s.score >= top.score * 0.6)
    .slice(0, limit)
    .map((s) => ({ ...s.d.product, score: s.score, matchedAll: s.matched === qTokens.length }));
}

/** The language to answer in: the alphabet of the message, else the site's. */
function replyLang(message, siteLang) {
  if (/[ა-ჰ]/.test(message)) return 'ka';
  if (/[а-яё]/i.test(message)) return 'ru';
  if (/[a-z]/i.test(message)) {
    const english = /\b(the|i|you|we|need|have|how|what|where|when|which|price|cost|elevator|lift|door|part|parts|hello|hi|do|is|are|can|my|want|repair|broken|phone|address|contact|new|order|delivery|warranty|payment|thanks|thank|and|for|with)\b/i;
    if (english.test(message) || siteLang === 'en') return 'en';
  }
  return LANGS.includes(siteLang) ? siteLang : 'ka';
}

const TEXT = {
  greeting: {
    ka: 'გამარჯობა! მე Ecolift-ის ასისტენტი ვარ. შემიძლია მოგიძებნოთ ნაწილი (დამიწერეთ სახელი, მარკა ან კოდი), გაგიწიოთ დახმარება სერვისში ან ახალი ლიფტის ფასის მოთხოვნაში. რით დაგეხმაროთ?',
    en: 'Hello! I am the Ecolift assistant. I can find a part for you (type its name, brand or code), help with a service request or a price request for a new lift. How can I help?',
    ru: 'Здравствуйте! Я ассистент Ecolift. Могу найти деталь (напишите название, марку или код), помочь с заявкой на сервис или запросом цены нового лифта. Чем помочь?',
  },
  thanks: {
    ka: 'არაფრის! თუ კიდევ რამე დაგჭირდებათ, აქ ვარ.',
    en: 'You are welcome! I am here if you need anything else.',
    ru: 'Пожалуйста! Если понадобится что-то еще, я здесь.',
  },
  products: {
    ka: 'კატალოგში ეს ნაწილები ვიპოვე:',
    en: 'I found these parts in our catalog:',
    ru: 'В каталоге я нашел эти детали:',
  },
  productsMaybe: {
    ka: 'ზუსტად ეს ვერ ვიპოვე, მაგრამ შეიძლება ესენი გამოგადგეთ:',
    en: 'I could not find exactly that, but these may help:',
    ru: 'Точно такого не нашел, но, возможно, подойдут эти:',
  },
  productsMore: {
    ka: 'ნაწილები ასევე ვიპოვე:',
    en: 'I also found these parts:',
    ru: 'Также нашел детали:',
  },
  code: {
    ka: 'აი ნაწილი ამ კოდით:',
    en: 'Here is the part with this code:',
    ru: 'Вот деталь с этим кодом:',
  },
  codeMissing: {
    ka: 'ამ კოდით ნაწილი ვერ ვიპოვე. შეამოწმეთ კოდი ან დამიწერეთ ნაწილის სახელი.',
    en: 'I could not find a part with this code. Check the code or type the part name.',
    ru: 'Детали с таким кодом не нашел. Проверьте код или напишите название детали.',
  },
  fallback: {
    ka: 'სამწუხაროდ, ეს ვერ გავიგე. სცადეთ სხვანაირად დაწერა, მაგალითად ნაწილის სახელი და მარკა ("Otis კარის ძრავა"), ან აირჩიეთ ქვემოთ. ჩვენი ტექნიკოსი ყველაფერს გიპასუხებთ: +995 598 75 00 06.',
    en: 'Sorry, I did not understand that. Try other words, for example a part name and brand ("Otis door motor"), or choose below. Our team will answer anything: +995 598 75 00 06.',
    ru: 'К сожалению, не понял. Попробуйте написать иначе, например название детали и марку ("Otis двигатель двери"), или выберите ниже. Наши специалисты ответят на любой вопрос: +995 598 75 00 06.',
  },
};

function productView(p, lang) {
  return {
    id: p.id,
    code: p.code,
    name: p[`name_${lang}`] || p.name_ka,
    image: p.image ? `/uploads/${p.image}` : null,
  };
}

/**
 * The catalog page searches for the typed text as a whole, so a "see all"
 * link only makes sense when the message comes down to one word ("Otis").
 */
function catalogSearch(text) {
  const words = text.split(/\s+/).filter((w) => {
    const t = tokens(w);
    return t.length && !GENERIC.has(t[0]);
  });
  return words.length === 1 ? words[0].replace(/[?!.,]+$/, '').slice(0, 100) : null;
}

/**
 * Answers one visitor message. Returns
 * { lang, text, products: [...], actions: [...], searchQuery? }.
 */
async function reply(message, siteLang) {
  const text = String(message || '').trim().slice(0, 500);
  const lang = replyLang(text, siteLang);
  const data = await loadData();
  const out = { lang, text: '', products: [], actions: [], answerId: null };

  const code = text.match(PART_CODE);
  if (code) {
    const wanted = `EL-${code[1].padStart(4, '0')}`;
    const doc = data.docs.find((d) => d.product.code.toUpperCase() === wanted);
    if (doc) {
      out.text = TEXT.code[lang];
      out.products = [productView(doc.product, lang)];
    } else {
      out.text = TEXT.codeMissing[lang];
      out.actions = ['parts'];
    }
    return out;
  }

  const qTokens = tokens(text);
  const answer = findAnswer(qTokens, data.answers);
  const searchTokens = qTokens.filter((q) => !GENERIC.has(q));
  const products = findProducts(searchTokens, data);

  // Words the answer explained ("ფასი", "შეკვეთა") are not part names; a part
  // search only counts when some other word matched a part too.
  const answerWords = answer ? answer.answer.phrases.flat() : [];
  const partWords = searchTokens.filter((q) => !answerWords.some((w) => wordMatch(q, w)));
  const partResults = answer ? findProducts(partWords, data) : products;

  // A weak answer (only lift or part words matched) gives way to found parts.
  if (answer && answer.score < 1 && products.length && products[0].matchedAll) {
    out.text = TEXT.products[lang];
    out.products = products.map((p) => productView(p, lang));
    out.searchQuery = catalogSearch(text);
    out.actions = ['parts'];
    return out;
  }

  if (answer) {
    out.answerId = answer.answer.id;
    out.text = answer.answer[`answer_${lang}`] || answer.answer.answer_ka;
    if (answer.answer.action) out.actions = [answer.answer.action];
    if (partResults.length && partResults[0].matchedAll) {
      out.extraText = TEXT.productsMore[lang];
      out.products = partResults.map((p) => productView(p, lang));
    }
    return out;
  }

  if (products.length) {
    const exact = products[0].matchedAll;
    out.text = exact ? TEXT.products[lang] : TEXT.productsMaybe[lang];
    out.products = products.map((p) => productView(p, lang));
    out.searchQuery = catalogSearch(text);
    out.actions = ['parts'];
    return out;
  }

  if (GREETING.test(text)) {
    out.text = TEXT.greeting[lang];
    out.actions = ['parts', 'service', 'quote'];
    out.answered = true;
    return out;
  }
  if (THANKS.test(text)) {
    out.text = TEXT.thanks[lang];
    out.answered = true;
    return out;
  }

  out.text = TEXT.fallback[lang];
  out.actions = ['parts', 'service', 'quote', 'call'];
  out.unanswered = true;
  return out;
}

async function logQuestion(message, result) {
  const answered = !result.unanswered;
  await db.query(
    'INSERT INTO assistant_questions (message, lang, answer_id, products_found, answered) VALUES (?, ?, ?, ?, ?)',
    [String(message).trim().slice(0, 500), result.lang, result.answerId, result.products.length, answered ? 1 : 0]
  );
  if (Math.random() < 0.02) {
    await db.query('DELETE FROM assistant_questions WHERE created_at < NOW() - INTERVAL ? DAY', [KEEP_DAYS]);
  }
}

module.exports = { reply, logQuestion, clearCache, tokens, canonical, wordMatch, replyLang };
