// Gera dados fake para testar o dashboard sem um site real coletando.
// Uso: npm run seed   (limpa e repopula o banco)
import { ingestBatch } from './db.js';
import db from './db.js';

// --- limpa tabelas (recomeca do zero a cada seed) ---
for (const t of ['events', 'pageviews', 'clicks', 'scroll', 'errors', 'perf', 'sessions', 'users']) {
  db.exec(`DELETE FROM ${t}`);
}

// --- helpers de aleatoriedade ---
const rnd = (a, b) => a + Math.random() * (b - a);
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (arr) => arr[rndInt(0, arr.length - 1)];
const chance = (p) => Math.random() < p;

// --- catalogos ---
const PAGES = ['/', '/precos', '/sobre', '/contato', '/blog/como-investir', '/checkout'];
const DEVICES = [
  { device_type: 'desktop', browser: 'Chrome 120', os: 'Windows 10', w: 1440, h: 900, weight: 5 },
  { device_type: 'desktop', browser: 'Edge 120', os: 'Windows 11', w: 1536, h: 864, weight: 2 },
  { device_type: 'desktop', browser: 'Safari 17', os: 'macOS 14', w: 1680, h: 1050, weight: 2 },
  { device_type: 'mobile', browser: 'Mobile Safari 16', os: 'iOS 16.0', w: 390, h: 844, weight: 4 },
  { device_type: 'mobile', browser: 'Chrome 120', os: 'Android 13', w: 412, h: 915, weight: 4 },
  { device_type: 'tablet', browser: 'Mobile Safari 17', os: 'iPadOS 17', w: 820, h: 1180, weight: 1 },
];
const GEO = [
  { country: 'BR', city: 'Sao Paulo', weight: 6 },
  { country: 'BR', city: 'Rio de Janeiro', weight: 3 },
  { country: 'BR', city: 'Belo Horizonte', weight: 2 },
  { country: 'PT', city: 'Lisboa', weight: 1 },
  { country: 'US', city: 'Miami', weight: 1 },
];
const SOURCES = [
  { referrer: 'https://www.google.com/', utm: {}, weight: 5 },
  { referrer: 'https://www.google.com/', utm: { source: 'google', medium: 'cpc', campaign: 'lancamento' }, weight: 3 },
  { referrer: 'https://www.instagram.com/', utm: { source: 'instagram', medium: 'social', campaign: 'organico' }, weight: 3 },
  { referrer: 'https://l.facebook.com/', utm: { source: 'facebook', medium: 'paid', campaign: 'remarketing' }, weight: 2 },
  { referrer: null, utm: {}, weight: 4 }, // direto
];
const CLICK_TARGETS = [
  { selector: 'button.cta', text: 'Quero comecar' },
  { selector: 'a.menu-precos', text: 'Precos' },
  { selector: 'a.menu-sobre', text: 'Sobre' },
  { selector: 'div.banner', text: 'Banner promocional' },
  { selector: 'img.logo', text: '' },
  { selector: 'input.email', text: '' },
  { selector: 'a.whatsapp', text: 'Fale conosco' },
];
const ERRORS = [
  'TypeError: Cannot read properties of undefined (reading "map")',
  'ReferenceError: gtag is not defined',
  'TypeError: fbq is not a function',
  'Uncaught (in promise) NetworkError: Failed to fetch',
];

function weighted(arr) {
  const total = arr.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const x of arr) { r -= x.weight; if (r <= 0) return x; }
  return arr[0];
}

// rrweb minimo valido: Meta + FullSnapshot (renderiza um frame estatico) + Custom (marca o fim).
function rrwebFor(start, duration, url, dev) {
  const meta = { type: 4, data: { href: 'http://localhost:8080' + url, width: dev.w, height: dev.h }, timestamp: start };
  const full = {
    type: 2,
    data: {
      node: {
        type: 0, id: 1, childNodes: [
          { type: 1, name: 'html', publicId: '', systemId: '', id: 2 },
          {
            type: 2, tagName: 'html', attributes: {}, id: 3, childNodes: [
              { type: 2, tagName: 'head', attributes: {}, id: 4, childNodes: [] },
              {
                type: 2, tagName: 'body',
                attributes: { style: 'margin:0;font-family:system-ui,sans-serif;background:#0d1017;color:#e6ebf2;padding:48px' },
                id: 5, childNodes: [
                  { type: 2, tagName: 'h1', attributes: {}, id: 6, childNodes: [{ type: 3, textContent: 'Pagina de teste: ' + url, id: 7 }] },
                  { type: 2, tagName: 'p', attributes: { style: 'color:#8a94a6' }, id: 8, childNodes: [{ type: 3, textContent: 'Sessao de exemplo gerada pelo seed (dados fake).', id: 9 }] },
                ],
              },
            ],
          },
        ],
      },
      initialOffset: { top: 0, left: 0 },
    },
    timestamp: start,
  };
  const end = { type: 5, data: { tag: 'seed-end', payload: {} }, timestamp: start + duration };
  return [meta, full, end];
}

// --- gera as sessoes ---
const NOW = Date.now();
const DAYS = 30;
const VISITORS = Array.from({ length: 28 }, (_, i) => 'vid-seed-' + (i + 1));
const N_SESSIONS = 60;

let created = 0;
for (let i = 0; i < N_SESSIONS; i++) {
  const visitorId = pick(VISITORS); // alguns visitantes repetem (usuarios < sessoes)
  const dev = weighted(DEVICES);
  const geo = weighted(GEO);
  const src = weighted(SOURCES);
  const start = NOW - rnd(0, DAYS * 864e5);
  const duration = rndInt(8000, 360000); // 8s a 6min
  const sessionId = 'sid-seed-' + (i + 1) + '-' + rndInt(1000, 9999);

  // paginas visitadas
  const nPages = rndInt(1, 4);
  const visited = Array.from({ length: nPages }, () => pick(PAGES));
  const pageviews = [];
  let cursor = start;
  visited.forEach((url, idx) => {
    const isLast = idx === visited.length - 1;
    const dwell = isLast ? Math.max(1500, start + duration - cursor) : rndInt(1500, 60000);
    pageviews.push({ pageUrl: url, enteredAt: Math.round(cursor), leftAt: Math.round(cursor + dwell), referrer: idx === 0 ? src.referrer : visited[idx - 1] });
    cursor += dwell;
  });
  // quick back: forca uma pagina curta seguida de retorno (quando ha 2+ paginas)
  if (nPages > 1 && chance(0.3)) {
    pageviews[0].leftAt = pageviews[0].enteredAt + rndInt(1500, 8000);
  }

  const firstPage = visited[0];

  // cliques (com clusters de rage e alguns dead)
  const clicks = [];
  const nClicks = rndInt(0, 12);
  for (let c = 0; c < nClicks; c++) {
    const tgt = pick(CLICK_TARGETS);
    clicks.push({
      pageUrl: pick(visited),
      xNorm: rnd(0.05, 0.95),
      yAbs: rndInt(80, 2400),
      docWidth: dev.w,
      viewportW: dev.w,
      t: Math.round(rnd(start, start + duration)),
      selector: tgt.selector,
      text: tgt.text || null,
      isRage: false,
      isDead: chance(0.12) && tgt.selector === 'img.logo', // clique morto na logo
    });
  }
  // rage: cluster de 3-5 cliques no mesmo ponto
  let hasRage = false;
  if (chance(0.25)) {
    hasRage = true;
    const x = rnd(0.4, 0.6), y = rndInt(150, 600), t0 = Math.round(rnd(start, start + duration - 1000));
    for (let r = 0; r < rndInt(3, 5); r++) {
      clicks.push({ pageUrl: firstPage, xNorm: x + rnd(-0.01, 0.01), yAbs: y + rndInt(-8, 8), docWidth: dev.w, viewportW: dev.w, t: t0 + r * 200, selector: 'button.cta', text: 'Quero comecar', isRage: true, isDead: false });
    }
  }

  const scroll = [{ pageUrl: firstPage, viewportW: dev.w, maxDepthPct: Math.round(rnd(15, 100)) }];
  const excessiveScroll = chance(0.18);

  const errors = chance(0.22)
    ? [{ pageUrl: pick(visited), message: pick(ERRORS), source: 'app.js', line: rndInt(1, 400), col: rndInt(1, 80), stack: null, t: Math.round(rnd(start, start + duration)) }]
    : [];

  const perf = [{
    pageUrl: firstPage,
    ttfb: Math.round(rnd(40, 400)),
    fcp: Math.round(rnd(500, 2500)),
    lcp: Math.round(rnd(900, 4000)),
    domLoad: Math.round(rnd(700, 3000)),
    load: Math.round(rnd(1000, 5000)),
    t: start,
  }];

  // smart events (conversoes) coerentes com as paginas da sessao
  const smartEvents = [];
  const tEv = () => Math.round(rnd(start, start + duration));
  if (visited.some((u) => u.includes('obrigado'))) smartEvents.push({ name: 'Submit form', pageUrl: visited.find((u) => u.includes('obrigado')), t: tEv() });
  if (visited.some((u) => u.includes('checkout')) && chance(0.5)) smartEvents.push({ name: 'Sign up', pageUrl: '/checkout', t: tEv() });
  if (visited.some((u) => u.includes('contato')) && chance(0.6)) smartEvents.push({ name: 'Contact us', pageUrl: '/contato', t: tEv() });
  if (chance(0.18)) smartEvents.push({ name: 'Outbound click', pageUrl: firstPage, t: tEv() });
  if (chance(0.08)) smartEvents.push({ name: 'Download', pageUrl: firstPage, t: tEv() });

  ingestBatch({
    sessionId,
    visitorId,
    smartEvents,
    meta: {
      pageUrl: firstPage,
      userAgent: `seed/${dev.device_type}`,
      viewportW: dev.w,
      viewportH: dev.h,
      referrer: src.referrer,
      utm: src.utm,
      // campos que normalmente o servidor enriquece (UA/geo): aqui ja vem prontos
      device_type: dev.device_type,
      browser: dev.browser,
      os: dev.os,
      country: geo.country,
      city: geo.city,
    },
    rrwebEvents: rrwebFor(Math.round(start), duration, firstPage, dev),
    clicks,
    scroll,
    pageviews,
    errors,
    perf,
    excessiveScroll,
  });
  created++;
}

const totals = {
  sessoes: db.prepare('SELECT COUNT(*) n FROM sessions').get().n,
  usuarios: db.prepare('SELECT COUNT(*) n FROM users').get().n,
  pageviews: db.prepare('SELECT COUNT(*) n FROM pageviews').get().n,
  clicks: db.prepare('SELECT COUNT(*) n FROM clicks').get().n,
  erros: db.prepare('SELECT COUNT(*) n FROM errors').get().n,
  rage: db.prepare('SELECT COUNT(*) n FROM sessions WHERE has_rage=1').get().n,
  dead: db.prepare('SELECT COUNT(*) n FROM sessions WHERE has_dead=1').get().n,
  quickback: db.prepare('SELECT COUNT(*) n FROM sessions WHERE is_quick_back=1').get().n,
};
console.log(`Seed concluido: ${created} sessoes geradas.`);
console.log(totals);
