// Camada de acesso ao SQLite via node:sqlite (embutido no Node 22+, sem compilacao nativa).
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'analytics.db');

mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));

// --- migracao idempotente: adiciona colunas novas em bancos ja existentes ---
function ensureColumns(table, cols) {
  const have = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((r) => r.name));
  for (const [name, def] of Object.entries(cols)) {
    if (!have.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`);
  }
}
ensureColumns('sessions', {
  visitor_id: 'TEXT', referrer: 'TEXT',
  utm_source: 'TEXT', utm_medium: 'TEXT', utm_campaign: 'TEXT', utm_term: 'TEXT', utm_content: 'TEXT',
  country: 'TEXT', city: 'TEXT', device_type: 'TEXT', browser: 'TEXT', os: 'TEXT',
  page_count: 'INTEGER NOT NULL DEFAULT 0', click_count: 'INTEGER NOT NULL DEFAULT 0',
  error_count: 'INTEGER NOT NULL DEFAULT 0', duration_ms: 'INTEGER NOT NULL DEFAULT 0',
  max_scroll_pct: 'REAL NOT NULL DEFAULT 0',
  has_rage: 'INTEGER NOT NULL DEFAULT 0', has_dead: 'INTEGER NOT NULL DEFAULT 0',
  has_error: 'INTEGER NOT NULL DEFAULT 0', is_quick_back: 'INTEGER NOT NULL DEFAULT 0',
  excessive_scroll: 'INTEGER NOT NULL DEFAULT 0',
});
ensureColumns('clicks', {
  element_selector: 'TEXT', element_text: 'TEXT',
  is_rage: 'INTEGER NOT NULL DEFAULT 0', is_dead: 'INTEGER NOT NULL DEFAULT 0',
});

const QUICK_BACK_MS = 10000; // pagina vista por menos que isso conta como saida rapida

// --- statements preparados (parametros posicionais) ---
const upsertUser = db.prepare(`
  INSERT INTO users (visitor_id, first_seen, last_seen, session_count)
  VALUES (?, ?, ?, 0)
  ON CONFLICT(visitor_id) DO UPDATE SET
    first_seen = MIN(first_seen, excluded.first_seen),
    last_seen  = MAX(last_seen, excluded.last_seen)
`);
const recountUserSessions = db.prepare(`
  UPDATE users SET session_count = (SELECT COUNT(*) FROM sessions WHERE visitor_id = ?)
  WHERE visitor_id = ?
`);

const upsertSession = db.prepare(`
  INSERT INTO sessions (
    id, visitor_id, started_at, ended_at, page_url, user_agent, viewport_w, viewport_h,
    referrer, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    country, city, device_type, browser, os
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET ended_at = MAX(ended_at, excluded.ended_at)
`);

const maxSeqForSession = db.prepare(`SELECT COALESCE(MAX(seq), -1) AS m FROM events WHERE session_id = ?`);
const insertEvent = db.prepare(`INSERT INTO events (session_id, seq, timestamp, data) VALUES (?, ?, ?, ?)`);

const insertPageview = db.prepare(`
  INSERT INTO pageviews (session_id, visitor_id, page_url, entered_at, left_at, referrer)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertClick = db.prepare(`
  INSERT INTO clicks (session_id, page_url, x_norm, y_abs, doc_width, viewport_w, created_at,
                      element_selector, element_text, is_rage, is_dead)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const upsertScroll = db.prepare(`
  INSERT INTO scroll (session_id, page_url, viewport_w, max_depth_pct)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(session_id, page_url) DO UPDATE SET max_depth_pct = MAX(max_depth_pct, excluded.max_depth_pct)
`);

const insertError = db.prepare(`
  INSERT INTO errors (session_id, page_url, message, source, line, col, stack, ts)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertPerf = db.prepare(`
  INSERT INTO perf (session_id, page_url, ttfb, fcp, lcp, dom_load, load, ts)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertSmart = db.prepare(`
  INSERT INTO smart_events (session_id, name, page_url, ts) VALUES (?, ?, ?, ?)
`);

// Recalcula os agregados/flags da sessao a partir das tabelas filhas (batches sao incrementais).
const recomputeSession = db.prepare(`
  UPDATE sessions SET
    page_count  = (SELECT COUNT(*) FROM pageviews WHERE session_id = :id),
    click_count = (SELECT COUNT(*) FROM clicks WHERE session_id = :id),
    error_count = (SELECT COUNT(*) FROM errors WHERE session_id = :id),
    duration_ms = ended_at - started_at,
    max_scroll_pct = COALESCE((SELECT MAX(max_depth_pct) FROM scroll WHERE session_id = :id), 0),
    has_rage  = (SELECT EXISTS(SELECT 1 FROM clicks WHERE session_id = :id AND is_rage = 1)),
    has_dead  = (SELECT EXISTS(SELECT 1 FROM clicks WHERE session_id = :id AND is_dead = 1)),
    has_error = (SELECT EXISTS(SELECT 1 FROM errors WHERE session_id = :id)),
    is_quick_back = (
      SELECT EXISTS(
        SELECT 1 FROM pageviews
        WHERE session_id = :id AND left_at IS NOT NULL AND (left_at - entered_at) < :qb
      ) AND (SELECT COUNT(*) FROM pageviews WHERE session_id = :id) > 1
    )
  WHERE id = :id
`);
const setExcessiveScroll = db.prepare(`UPDATE sessions SET excessive_scroll = 1 WHERE id = ?`);

// Recebe um lote do tracker e grava tudo numa transacao manual.
export function ingestBatch(payload) {
  const {
    sessionId, visitorId = null, meta = {},
    rrwebEvents = [], clicks = [], scroll = [], pageviews = [], errors = [], perf = [], smartEvents = [],
    excessiveScroll = false,
  } = payload;
  const now = Date.now();
  const timestamps = rrwebEvents.map((e) => e.timestamp).filter(Boolean);
  const started = timestamps.length ? Math.min(...timestamps) : now;
  const ended = timestamps.length ? Math.max(...timestamps) : now;

  db.exec('BEGIN');
  try {
    if (visitorId) upsertUser.run(visitorId, started, ended);

    upsertSession.run(
      sessionId, visitorId, started, ended, meta.pageUrl,
      meta.userAgent || null, meta.viewportW || null, meta.viewportH || null,
      meta.referrer || null,
      meta.utm?.source || null, meta.utm?.medium || null, meta.utm?.campaign || null,
      meta.utm?.term || null, meta.utm?.content || null,
      meta.country || null, meta.city || null,
      meta.device_type || null, meta.browser || null, meta.os || null,
    );

    let seq = maxSeqForSession.get(sessionId).m;
    for (const ev of rrwebEvents) {
      seq += 1;
      insertEvent.run(sessionId, seq, ev.timestamp || now, JSON.stringify(ev));
    }

    for (const p of pageviews) {
      insertPageview.run(sessionId, visitorId, p.pageUrl, p.enteredAt || now, p.leftAt || null, p.referrer || null);
    }

    for (const c of clicks) {
      insertClick.run(
        sessionId, c.pageUrl, c.xNorm, c.yAbs, c.docWidth, c.viewportW, c.t || now,
        c.selector || null, c.text || null, c.isRage ? 1 : 0, c.isDead ? 1 : 0,
      );
    }

    for (const s of scroll) {
      upsertScroll.run(sessionId, s.pageUrl, s.viewportW, s.maxDepthPct);
    }

    for (const e of errors) {
      insertError.run(sessionId, e.pageUrl, e.message, e.source || null, e.line || null, e.col || null, e.stack || null, e.t || now);
    }

    for (const pf of perf) {
      insertPerf.run(sessionId, pf.pageUrl, pf.ttfb ?? null, pf.fcp ?? null, pf.lcp ?? null, pf.domLoad ?? null, pf.load ?? null, pf.t || now);
    }

    for (const ev of smartEvents) {
      insertSmart.run(sessionId, ev.name, ev.pageUrl, ev.t || now);
    }

    recomputeSession.run({ id: sessionId, qb: QUICK_BACK_MS });
    if (excessiveScroll) setExcessiveScroll.run(sessionId);
    if (visitorId) recountUserSessions.run(visitorId, visitorId);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return { events: rrwebEvents.length, clicks: clicks.length, pageviews: pageviews.length, errors: errors.length };
}

// --- filtros compartilhados (sessoes / insights) ---
// Aceita: { from, to, device, browser, os, country, page, filter, q }
const FLAG_BY_FILTER = {
  rage: 'has_rage', dead: 'has_dead', error: 'has_error',
  quickback: 'is_quick_back', 'excessive-scroll': 'excessive_scroll',
};
function buildWhere(f = {}) {
  const where = [];
  const params = [];
  if (f.from) { where.push('s.started_at >= ?'); params.push(Number(f.from)); }
  if (f.to) { where.push('s.started_at <= ?'); params.push(Number(f.to)); }
  if (f.device) { where.push('s.device_type = ?'); params.push(f.device); }
  if (f.browser) { where.push('s.browser = ?'); params.push(f.browser); }
  if (f.os) { where.push('s.os = ?'); params.push(f.os); }
  if (f.country) { where.push('s.country = ?'); params.push(f.country); }
  if (f.page) { where.push('s.page_url = ?'); params.push(f.page); }
  if (f.filter && FLAG_BY_FILTER[f.filter]) where.push(`s.${FLAG_BY_FILTER[f.filter]} = 1`);
  if (f.event) { where.push('EXISTS(SELECT 1 FROM smart_events se WHERE se.session_id = s.id AND se.name = ?)'); params.push(f.event); }
  if (f.q) { where.push('(s.page_url LIKE ? OR s.referrer LIKE ? OR s.browser LIKE ? OR s.country LIKE ?)');
    const like = `%${f.q}%`; params.push(like, like, like, like); }
  return { clause: where.length ? 'WHERE ' + where.join(' AND ') : '', params };
}

// --- consultas de leitura ---
export function listSessions(f = {}) {
  const { clause, params } = buildWhere(f);
  const rows = db.prepare(`
    SELECT s.id, s.visitor_id, s.started_at, s.ended_at, s.page_url, s.user_agent,
           s.viewport_w, s.viewport_h, s.country, s.city, s.device_type, s.browser, s.os,
           s.referrer, s.page_count, s.click_count, s.error_count, s.duration_ms, s.max_scroll_pct,
           s.has_rage, s.has_dead, s.has_error, s.is_quick_back, s.excessive_scroll,
           (SELECT COUNT(*) FROM events e WHERE e.session_id = s.id) AS event_count
    FROM sessions s
    ${clause}
    ORDER BY s.started_at DESC
    LIMIT 300
  `).all(...params);
  return rows;
}

const sessionEventsStmt = db.prepare(`SELECT data FROM events WHERE session_id = ? ORDER BY seq ASC`);
export const sessionEvents = (id) => sessionEventsStmt.all(id).map((r) => JSON.parse(r.data));

// Metadados de uma sessao (sidebar do player) + paginas visitadas + erros.
export function sessionMeta(id) {
  const s = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id);
  if (!s) return null;
  const pages = db.prepare(`SELECT page_url, entered_at, left_at FROM pageviews WHERE session_id = ? ORDER BY entered_at ASC`).all(id);
  const errs = db.prepare(`SELECT message, page_url, ts FROM errors WHERE session_id = ? ORDER BY ts ASC`).all(id);
  return { ...s, pages, errors: errs };
}

// --- heatmap ---
const heatmapPagesStmt = db.prepare(`
  SELECT page_url, viewport_w, COUNT(*) AS clicks
  FROM clicks GROUP BY page_url, viewport_w ORDER BY clicks DESC
`);
export const heatmapPages = () => heatmapPagesStmt.all();

export function heatmapData(pageUrl, viewport, tolerance = 120) {
  const lo = viewport - tolerance;
  const hi = viewport + tolerance;
  const clicks = db.prepare(`
    SELECT x_norm, y_abs, doc_width, viewport_w, is_rage, is_dead, element_selector, element_text
    FROM clicks WHERE page_url = ? AND viewport_w BETWEEN ? AND ?
  `).all(pageUrl, lo, hi);
  const scrolls = db.prepare(`
    SELECT max_depth_pct FROM scroll WHERE page_url = ? AND viewport_w BETWEEN ? AND ?
  `).all(pageUrl, lo, hi).map((r) => r.max_depth_pct);
  const avgScroll = scrolls.length ? scrolls.reduce((a, b) => a + b, 0) / scrolls.length : 0;
  // distribuicao de alcance de scroll (faixas de 10%) para o scroll heatmap
  const buckets = new Array(10).fill(0);
  for (const d of scrolls) {
    const reached = Math.min(10, Math.ceil(d / 10));
    for (let i = 0; i < reached; i++) buckets[i] += 1;
  }
  const scrollReach = buckets.map((c, i) => ({
    pct: (i + 1) * 10,
    reachedPct: scrolls.length ? (c / scrolls.length) * 100 : 0,
  }));
  // elementos mais clicados (Fase 3)
  const topElements = db.prepare(`
    SELECT element_selector AS selector, element_text AS text, COUNT(*) AS clicks
    FROM clicks WHERE page_url = ? AND viewport_w BETWEEN ? AND ? AND element_selector IS NOT NULL
    GROUP BY element_selector ORDER BY clicks DESC LIMIT 15
  `).all(pageUrl, lo, hi);
  return { clicks, sessions: scrolls.length, avgScrollPct: avgScroll, scrollReach, topElements };
}

// --- insights / overview ---
export function insights(f = {}) {
  const { clause, params } = buildWhere(f);
  const row = db.prepare(`
    SELECT COUNT(*) AS sessions,
           COUNT(DISTINCT s.visitor_id) AS users,
           COALESCE(SUM(s.page_count), 0) AS pageviews,
           COALESCE(AVG(s.page_count), 0) AS avg_pages,
           COALESCE(AVG(s.duration_ms), 0) AS avg_duration_ms,
           COALESCE(AVG(s.max_scroll_pct), 0) AS avg_scroll_pct,
           COALESCE(SUM(CASE WHEN s.visitor_id IN
             (SELECT visitor_id FROM sessions GROUP BY visitor_id HAVING COUNT(*) > 1)
             THEN 1 ELSE 0 END), 0) AS returning_sessions
    FROM sessions s ${clause}
  `).get(...params);
  row.new_sessions = row.sessions - row.returning_sessions;
  return row;
}

// Serie temporal: sessoes e usuarios por dia (para o grafico de tendencia).
export function timeseries(f = {}) {
  const { clause, params } = buildWhere(f);
  return db.prepare(`
    SELECT date(s.started_at / 1000, 'unixepoch', 'localtime') AS day,
           COUNT(*) AS sessions,
           COUNT(DISTINCT s.visitor_id) AS users
    FROM sessions s ${clause}
    GROUP BY day ORDER BY day ASC
  `).all(...params);
}

// Performance: media de Web Vitals + score (baseado na distribuicao de LCP, estilo Clarity).
export function performance(f = {}) {
  const { clause, params } = buildWhere(f);
  const join = clause ? `JOIN sessions s ON s.id = p.session_id ${clause}` : '';
  const r = db.prepare(`
    SELECT COUNT(*) AS samples,
           AVG(p.lcp) AS lcp, AVG(p.fcp) AS fcp, AVG(p.ttfb) AS ttfb, AVG(p.load) AS load,
           SUM(CASE WHEN p.lcp < 2500 THEN 1 ELSE 0 END) AS good,
           SUM(CASE WHEN p.lcp >= 2500 AND p.lcp < 4000 THEN 1 ELSE 0 END) AS ni,
           SUM(CASE WHEN p.lcp >= 4000 THEN 1 ELSE 0 END) AS poor
    FROM perf p ${join}
  `).get(...params);
  const n = r.samples || 0;
  const score = n ? Math.round(((r.good + 0.5 * r.ni) / n) * 100) : 0;
  return { ...r, score };
}

// Performance por URL (a aba "URL performance" do Clarity).
export function pagePerformance(f = {}) {
  const { clause, params } = buildWhere(f);
  const join = clause ? `JOIN sessions s ON s.id = p.session_id ${clause}` : '';
  const rows = db.prepare(`
    SELECT p.page_url AS label, COUNT(*) AS samples, AVG(p.lcp) AS lcp,
           SUM(CASE WHEN p.lcp < 2500 THEN 1 ELSE 0 END) AS good,
           SUM(CASE WHEN p.lcp >= 2500 AND p.lcp < 4000 THEN 1 ELSE 0 END) AS ni
    FROM perf p ${join}
    GROUP BY p.page_url ORDER BY samples DESC LIMIT 15
  `).all(...params);
  return rows.map((r) => ({ ...r, score: r.samples ? Math.round(((r.good + 0.5 * r.ni) / r.samples) * 100) : 0 }));
}

// Paginas: top (mais vistas), entry (paginas de entrada) e inactive (menos interacao).
export function pages(kind = 'top', f = {}) {
  if (kind === 'entry') {
    const { clause, params } = buildWhere(f);
    return db.prepare(`
      SELECT s.page_url AS label, COUNT(*) AS count
      FROM sessions s ${clause}
      GROUP BY s.page_url ORDER BY count DESC LIMIT 15
    `).all(...params);
  }
  if (kind === 'inactive') {
    // paginas com mais visitas e menos cliques por visita (engajamento baixo)
    return db.prepare(`
      SELECT pv.page_url AS label, COUNT(*) AS count,
             (SELECT COUNT(*) FROM clicks c WHERE c.page_url = pv.page_url) AS clicks
      FROM pageviews pv
      GROUP BY pv.page_url HAVING count >= 3
      ORDER BY (clicks * 1.0 / count) ASC, count DESC LIMIT 15
    `).all();
  }
  // top
  return db.prepare(`
    SELECT page_url AS label, COUNT(*) AS count FROM pageviews
    GROUP BY page_url ORDER BY count DESC LIMIT 15
  `).all();
}

export function behaviors(f = {}) {
  const { clause, params } = buildWhere(f);
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(s.has_rage), 0)        AS rage,
      COALESCE(SUM(s.has_dead), 0)        AS dead,
      COALESCE(SUM(s.is_quick_back), 0)   AS quickback,
      COALESCE(SUM(s.excessive_scroll),0) AS excessive_scroll,
      COALESCE(SUM(s.has_error), 0)       AS error,
      COUNT(*)                            AS total
    FROM sessions s ${clause}
  `).get(...params);
  return row;
}

// Breakdown generico por coluna de sessions (top N por contagem de sessoes).
const BREAKDOWN_COLS = {
  device: 's.device_type', browser: 's.browser', os: 's.os',
  country: 's.country', referrer: 's.referrer',
  source: 's.utm_source', medium: 's.utm_medium', campaign: 's.utm_campaign',
};
export function breakdown(dim, f = {}) {
  const { clause, params } = buildWhere(f);
  if (dim === 'page') {
    // paginas mais vistas (a partir de pageviews, nao da pagina de entrada da sessao)
    return db.prepare(`
      SELECT page_url AS label, COUNT(*) AS count FROM pageviews
      GROUP BY page_url ORDER BY count DESC LIMIT 15
    `).all();
  }
  const col = BREAKDOWN_COLS[dim];
  if (!col) return [];
  return db.prepare(`
    SELECT COALESCE(${col}, '(desconhecido)') AS label, COUNT(*) AS count
    FROM sessions s ${clause}
    GROUP BY ${col} ORDER BY count DESC LIMIT 15
  `).all(...params);
}

// Lista de erros JS agregada por mensagem.
export function errorList(f = {}) {
  const { clause, params } = buildWhere(f);
  const join = clause ? `JOIN sessions s ON s.id = er.session_id ${clause}` : '';
  return db.prepare(`
    SELECT er.message, COUNT(*) AS count, MAX(er.ts) AS last_seen,
           COUNT(DISTINCT er.session_id) AS sessions
    FROM errors er ${join}
    GROUP BY er.message ORDER BY count DESC LIMIT 50
  `).all(...params);
}

// --- smart events (conversoes) ---
export function smartEvents(f = {}) {
  const { clause, params } = buildWhere(f);
  const join = clause ? `JOIN sessions s ON s.id = se.session_id ${clause}` : '';
  return db.prepare(`
    SELECT se.name, COUNT(DISTINCT se.session_id) AS sessions, COUNT(*) AS count
    FROM smart_events se ${join}
    GROUP BY se.name ORDER BY sessions DESC LIMIT 50
  `).all(...params);
}

// nomes de eventos e paginas disponiveis (para montar funnels no front)
export function funnelOptions() {
  const events = db.prepare(`SELECT DISTINCT name FROM smart_events ORDER BY name`).all().map((r) => r.name);
  const pages = db.prepare(`SELECT page_url, COUNT(*) c FROM pageviews GROUP BY page_url ORDER BY c DESC LIMIT 40`)
    .all().map((r) => r.page_url);
  return { events, pages };
}

// ids de sessao que batem nos filtros (sem limite), para calculos como funnel
function sessionIds(f = {}) {
  const { clause, params } = buildWhere(f);
  return db.prepare(`SELECT id FROM sessions s ${clause}`).all(...params).map((r) => r.id);
}

// linha do tempo de uma sessao: pageviews + smart events, ordenada por tempo
const tlPages = db.prepare(`SELECT page_url, entered_at AS ts FROM pageviews WHERE session_id = ?`);
const tlEvents = db.prepare(`SELECT name, ts FROM smart_events WHERE session_id = ?`);
function timeline(id) {
  const items = [];
  for (const p of tlPages.all(id)) items.push({ ts: p.ts, page: p.page_url });
  for (const e of tlEvents.all(id)) items.push({ ts: e.ts, event: e.name });
  return items.sort((a, b) => a.ts - b.ts);
}

// Funnel: passos ordenados ({ type:'page'|'event', value }). Conta sessoes que atingem
// cada passo na ordem (cumulativo). Page casa por substring; event casa por nome exato.
export function funnel(steps = [], f = {}) {
  if (!steps.length) return { steps: [], total: 0 };
  const ids = sessionIds(f);
  const counts = new Array(steps.length).fill(0);
  const match = (step, item) =>
    step.type === 'event' ? item.event === step.value : (item.page && item.page.includes(step.value));
  for (const id of ids) {
    const tl = timeline(id);
    let idx = 0;
    for (const item of tl) {
      if (match(steps[idx], item)) { counts[idx] += 1; idx += 1; if (idx >= steps.length) break; }
    }
  }
  return {
    total: ids.length,
    steps: steps.map((st, i) => ({
      ...st,
      count: counts[i],
      pct: ids.length ? (counts[i] / ids.length) * 100 : 0,
      stepPct: i === 0 ? 100 : (counts[i - 1] ? (counts[i] / counts[i - 1]) * 100 : 0),
    })),
  };
}

export default db;
