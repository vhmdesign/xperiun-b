// Tracker do site: grava a sessao com rrweb + captura cliques/scroll para o heatmap.
// Empacotado pelo esbuild em public/tracker.js (1 arquivo para colar no site).
import { record } from 'rrweb';

// Endpoint da API. Em producao trocar para a URL publica do backend.
const API = (window.__XP_ANALYTICS_API__ || 'http://localhost:3000') + '/ingest';
const FLUSH_MS = 5000;

// --- identidade da sessao ---
function sessionId() {
  const KEY = '__xp_sid__';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) ||
      'sid-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

const SID = sessionId();
const pageUrl = () => location.pathname + location.search;
const docWidth = () => document.documentElement.scrollWidth || document.documentElement.clientWidth;
const docHeight = () => document.documentElement.scrollHeight || document.documentElement.clientHeight;

// --- buffers ---
let rrwebEvents = [];
let clicks = [];
let maxScrollPct = 0;

// rrweb: maskAllInputs protege dados digitados (LGPD). recordCanvas off por performance.
record({
  emit(event) { rrwebEvents.push(event); },
  maskAllInputs: true,
  maskInputOptions: { password: true, email: true, tel: true },
  sampling: { mousemove: 50, scroll: 150 },
});

// --- heatmap: cliques (coords normalizadas pela largura do documento) ---
addEventListener('click', (e) => {
  const dw = docWidth();
  clicks.push({
    pageUrl: pageUrl(),
    xNorm: dw ? (e.pageX / dw) : 0,
    yAbs: Math.round(e.pageY),
    docWidth: dw,
    viewportW: window.innerWidth,
    t: Date.now(),
  });
}, { capture: true, passive: true });

// --- heatmap: profundidade maxima de scroll (% do documento) ---
addEventListener('scroll', () => {
  const scrolled = window.scrollY + window.innerHeight;
  const pct = Math.min(100, (scrolled / docHeight()) * 100);
  if (pct > maxScrollPct) maxScrollPct = pct;
}, { passive: true });

// --- envio em lotes ---
function buildPayload() {
  const payload = {
    sessionId: SID,
    meta: {
      pageUrl: pageUrl(),
      userAgent: navigator.userAgent,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
    },
    rrwebEvents,
    clicks,
    scroll: maxScrollPct > 0
      ? [{ pageUrl: pageUrl(), viewportW: window.innerWidth, maxDepthPct: maxScrollPct }]
      : [],
  };
  rrwebEvents = [];
  clicks = [];
  return payload;
}

function flush(useBeacon) {
  if (!rrwebEvents.length && !clicks.length && maxScrollPct === 0) return;
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
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(true); });
addEventListener('pagehide', () => flush(true));
