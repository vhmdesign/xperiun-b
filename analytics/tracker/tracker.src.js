// Tracker do site: grava a sessao com rrweb + captura sinais para heatmap, insights e replay.
// Empacotado pelo esbuild em public/tracker.js (1 arquivo para colar no site).
import { record } from 'rrweb';

// Endpoint da API. Em producao trocar para a URL publica do backend.
const API = (window.__XP_ANALYTICS_API__ || 'http://localhost:3000') + '/ingest';
const FLUSH_MS = 5000;

// limiares de comportamento (estilo Clarity)
const RAGE_WINDOW = 1000;   // janela para agrupar cliques (ms)
const RAGE_RADIUS = 30;     // raio em px para considerar "mesma area"
const RAGE_COUNT = 3;       // cliques na janela/area para ser rage
const DEAD_WINDOW = 700;    // ms para ver se o clique causou mudanca (dead click)
const SCROLL_REVERSALS = 5; // reversoes de direcao para "scroll excessivo"
const SCROLL_REV_WINDOW = 3000;

// --- identidade: sessao (por aba) + visitante (persistente) ---
function sessionId() {
  const KEY = '__xp_sid__';
  let id = sessionStorage.getItem(KEY);
  if (!id) { id = uid('sid'); sessionStorage.setItem(KEY, id); }
  return id;
}
function visitorId() {
  const KEY = '__xp_vid__';
  let id = null;
  try { id = localStorage.getItem(KEY); } catch (_) {}
  if (!id) id = readCookie(KEY);
  if (!id) {
    id = uid('vid');
    try { localStorage.setItem(KEY, id); } catch (_) {}
    writeCookie(KEY, id, 365);
  }
  return id;
}
function uid(p) {
  return (crypto.randomUUID ? p + '-' + crypto.randomUUID()
    : p + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
}
function readCookie(name) {
  const m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
  return m ? decodeURIComponent(m[1]) : null;
}
function writeCookie(name, val, days) {
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(val)}; expires=${exp}; path=/; SameSite=Lax`;
}

const SID = sessionId();
const VID = visitorId();
const pageUrl = () => location.pathname + location.search;
const docWidth = () => document.documentElement.scrollWidth || document.documentElement.clientWidth;
const docHeight = () => document.documentElement.scrollHeight || document.documentElement.clientHeight;

// --- origem / UTM ---
function utm() {
  const q = new URLSearchParams(location.search);
  const get = (k) => q.get('utm_' + k) || undefined;
  return { source: get('source'), medium: get('medium'), campaign: get('campaign'), term: get('term'), content: get('content') };
}

// --- buffers ---
let rrwebEvents = [];
let clicks = [];
let pageviews = [];
let errors = [];
let perf = [];
let smartEvents = [];
let maxScrollPct = 0;
let excessiveScroll = false;
let recentClicks = [];
let mutationCount = 0;

// --- smart events (conversoes autodetectadas, estilo Clarity) ---
function smart(name) {
  if (!name) return;
  smartEvents.push({ name: String(name).slice(0, 60), pageUrl: pageUrl(), t: Date.now() });
}
window.xpTrack = smart; // API publica: xpTrack('Nome do evento')
const DOWNLOAD_RE = /\.(pdf|zip|rar|7z|docx?|xlsx?|pptx?|csv|txt|mp4|mp3|wav|dmg|exe|apk|pkg)(\?|#|$)/i;
addEventListener('submit', () => smart('Submit form'), { capture: true, passive: true });

// rrweb: maskAllInputs protege dados digitados (LGPD). recordCanvas off por performance.
record({
  emit(event) { rrwebEvents.push(event); },
  maskAllInputs: true,
  maskInputOptions: { password: true, email: true, tel: true },
  sampling: { mousemove: 50, scroll: 150 },
});

// Conta mutacoes do DOM para detectar dead clicks (clique que nao muda nada).
new MutationObserver((muts) => { mutationCount += muts.length; })
  .observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });

// --- seletor/texto do alvo do clique ---
function selectorFor(el) {
  if (!el || el === document || el === document.documentElement) return 'html';
  if (el.id) return el.tagName.toLowerCase() + '#' + el.id;
  let sel = el.tagName.toLowerCase();
  if (el.classList && el.classList.length) sel += '.' + [...el.classList].slice(0, 2).join('.');
  const parent = el.parentElement;
  if (parent) {
    const idx = [...parent.children].filter((c) => c.tagName === el.tagName).indexOf(el);
    if (idx > 0) sel += `:nth-of-type(${idx + 1})`;
  }
  return sel;
}
function isInteractive(el) {
  return !!(el.closest && el.closest('a,button,input,select,textarea,label,summary,[role=button],[onclick],[tabindex]'));
}

// --- heatmap + comportamento: cliques ---
addEventListener('click', (e) => {
  const dw = docWidth();
  const t = Date.now();
  const el = e.target;
  const rec = {
    pageUrl: pageUrl(),
    xNorm: dw ? (e.pageX / dw) : 0,
    yAbs: Math.round(e.pageY),
    docWidth: dw,
    viewportW: window.innerWidth,
    t,
    selector: selectorFor(el),
    text: (el.textContent || '').trim().slice(0, 60) || null,
    isRage: false,
    isDead: false,
  };
  clicks.push(rec);

  // smart events a partir do clique: link externo, download e eventos custom (data-xp-event)
  const a = el.closest && el.closest('a[href]');
  if (a) {
    try {
      const u = new URL(a.href, location.href);
      if (/^https?:/.test(u.protocol) && u.origin !== location.origin) smart('Outbound click');
      if (DOWNLOAD_RE.test(u.pathname)) smart('Download');
    } catch (_) {}
  }
  const named = el.closest && el.closest('[data-xp-event]');
  if (named) smart(named.getAttribute('data-xp-event'));

  // rage: N cliques na mesma area dentro da janela
  recentClicks = recentClicks.filter((c) => t - c.t <= RAGE_WINDOW);
  recentClicks.push({ x: e.pageX, y: e.pageY, t, rec });
  const cluster = recentClicks.filter((c) => Math.hypot(c.x - e.pageX, c.y - e.pageY) <= RAGE_RADIUS);
  if (cluster.length >= RAGE_COUNT) cluster.forEach((c) => { c.rec.isRage = true; });

  // dead: sem mutacao de DOM nem navegacao apos o clique, e alvo nao interativo
  const mAtClick = mutationCount;
  const urlAtClick = pageUrl();
  const interactive = isInteractive(el);
  setTimeout(() => {
    if (!interactive && mutationCount === mAtClick && pageUrl() === urlAtClick) rec.isDead = true;
  }, DEAD_WINDOW);
}, { capture: true, passive: true });

// --- heatmap: profundidade de scroll + scroll excessivo ---
let lastScrollY = window.scrollY;
let lastDir = 0;
let reversals = [];
addEventListener('scroll', () => {
  const y = window.scrollY;
  const scrolled = y + window.innerHeight;
  const pct = Math.min(100, (scrolled / docHeight()) * 100);
  if (pct > maxScrollPct) maxScrollPct = pct;

  const dir = Math.sign(y - lastScrollY);
  if (dir !== 0 && dir !== lastDir) {
    const now = Date.now();
    reversals = reversals.filter((t) => now - t <= SCROLL_REV_WINDOW);
    reversals.push(now);
    if (reversals.length >= SCROLL_REVERSALS) excessiveScroll = true;
    lastDir = dir;
  }
  lastScrollY = y;
}, { passive: true });

// --- erros de JavaScript ---
addEventListener('error', (e) => {
  errors.push({
    pageUrl: pageUrl(),
    message: (e.message || 'Erro').slice(0, 500),
    source: e.filename || null,
    line: e.lineno || null,
    col: e.colno || null,
    stack: e.error && e.error.stack ? String(e.error.stack).slice(0, 2000) : null,
    t: Date.now(),
  });
});
addEventListener('unhandledrejection', (e) => {
  const r = e.reason;
  errors.push({
    pageUrl: pageUrl(),
    message: ('Unhandled rejection: ' + (r && r.message ? r.message : String(r))).slice(0, 500),
    source: null, line: null, col: null,
    stack: r && r.stack ? String(r.stack).slice(0, 2000) : null,
    t: Date.now(),
  });
});

// --- page views (multi-pagina + SPA via pushState/popstate) ---
let currentPV = null;
function startPageview(referrer) {
  currentPV = { pageUrl: pageUrl(), enteredAt: Date.now(), leftAt: null, referrer: referrer || null };
}
function endPageview() {
  if (currentPV && !currentPV.leftAt) {
    currentPV.leftAt = Date.now();
    pageviews.push(currentPV);
  }
}
function onNavigate() {
  const prev = currentPV ? currentPV.pageUrl : document.referrer;
  endPageview();
  startPageview(prev);
}
startPageview(document.referrer || null);
['pushState', 'replaceState'].forEach((m) => {
  const orig = history[m];
  history[m] = function () { const r = orig.apply(this, arguments); onNavigate(); return r; };
});
addEventListener('popstate', onNavigate);

// --- performance / page speed ---
let lcpValue = 0;
try {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) lcpValue = entry.startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
} catch (_) {}
addEventListener('load', () => {
  setTimeout(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    if (nav) {
      perf.push({
        pageUrl: pageUrl(),
        ttfb: nav.responseStart,
        fcp: fcp ? fcp.startTime : null,
        lcp: lcpValue || null,
        domLoad: nav.domContentLoadedEventEnd,
        load: nav.loadEventEnd,
        t: Date.now(),
      });
    }
  }, 0);
});

// --- envio em lotes ---
function buildPayload() {
  // Envia apenas pageviews ja finalizados (o aberto e finalizado no pagehide/visibilitychange).
  // Assim cada pagina vira exatamente 1 linha, sem duplicar a cada flush.
  const payload = {
    sessionId: SID,
    visitorId: VID,
    meta: {
      pageUrl: pageUrl(),
      userAgent: navigator.userAgent,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
      referrer: document.referrer || null,
      utm: utm(),
    },
    rrwebEvents,
    clicks,
    pageviews,
    scroll: maxScrollPct > 0
      ? [{ pageUrl: pageUrl(), viewportW: window.innerWidth, maxDepthPct: maxScrollPct }]
      : [],
    errors,
    perf,
    smartEvents,
    excessiveScroll,
  };
  rrwebEvents = [];
  clicks = [];
  pageviews = [];
  errors = [];
  perf = [];
  smartEvents = [];
  return payload;
}

function hasData() {
  return rrwebEvents.length || clicks.length || pageviews.length || errors.length
    || perf.length || smartEvents.length || maxScrollPct > 0;
}

function flush(useBeacon) {
  if (!hasData()) return;
  const payload = buildPayload();
  const json = JSON.stringify(payload);
  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon(API, new Blob([json], { type: 'application/json' }));
  } else {
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json, keepalive: true })
      .catch(() => {});
  }
}

setInterval(() => flush(false), FLUSH_MS);
// sendBeacon nao perde os ultimos eventos quando a aba fecha/troca.
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { endPageview(); flush(true); } });
addEventListener('pagehide', () => { endPageview(); flush(true); });
