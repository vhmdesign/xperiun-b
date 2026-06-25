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

// --- statements preparados (parametros posicionais) ---
const upsertSession = db.prepare(`
  INSERT INTO sessions (id, started_at, ended_at, page_url, user_agent, viewport_w, viewport_h)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET ended_at = MAX(ended_at, excluded.ended_at)
`);

const maxSeqForSession = db.prepare(`SELECT COALESCE(MAX(seq), -1) AS m FROM events WHERE session_id = ?`);
const insertEvent = db.prepare(`INSERT INTO events (session_id, seq, timestamp, data) VALUES (?, ?, ?, ?)`);

const insertClick = db.prepare(`
  INSERT INTO clicks (session_id, page_url, x_norm, y_abs, doc_width, viewport_w, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const upsertScroll = db.prepare(`
  INSERT INTO scroll (session_id, page_url, viewport_w, max_depth_pct)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(session_id, page_url) DO UPDATE SET max_depth_pct = MAX(max_depth_pct, excluded.max_depth_pct)
`);

// Recebe um lote do tracker e grava tudo numa transacao manual.
export function ingestBatch(payload) {
  const { sessionId, meta, rrwebEvents = [], clicks = [], scroll = [] } = payload;
  const now = Date.now();
  const timestamps = rrwebEvents.map((e) => e.timestamp).filter(Boolean);
  const started = timestamps.length ? Math.min(...timestamps) : now;
  const ended = timestamps.length ? Math.max(...timestamps) : now;

  db.exec('BEGIN');
  try {
    upsertSession.run(
      sessionId, started, ended, meta.pageUrl,
      meta.userAgent || null, meta.viewportW || null, meta.viewportH || null,
    );

    let seq = maxSeqForSession.get(sessionId).m;
    for (const ev of rrwebEvents) {
      seq += 1;
      insertEvent.run(sessionId, seq, ev.timestamp || now, JSON.stringify(ev));
    }

    for (const c of clicks) {
      insertClick.run(sessionId, c.pageUrl, c.xNorm, c.yAbs, c.docWidth, c.viewportW, c.t || now);
    }

    for (const s of scroll) {
      upsertScroll.run(sessionId, s.pageUrl, s.viewportW, s.maxDepthPct);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return { events: rrwebEvents.length, clicks: clicks.length };
}

// --- consultas de leitura ---
const listSessionsStmt = db.prepare(`
  SELECT s.id, s.started_at, s.ended_at, s.page_url, s.user_agent, s.viewport_w, s.viewport_h,
         (SELECT COUNT(*) FROM events e WHERE e.session_id = s.id) AS event_count
  FROM sessions s
  ORDER BY s.started_at DESC
  LIMIT 200
`);
export const listSessions = () => listSessionsStmt.all();

const sessionEventsStmt = db.prepare(`SELECT data FROM events WHERE session_id = ? ORDER BY seq ASC`);
export const sessionEvents = (id) => sessionEventsStmt.all(id).map((r) => JSON.parse(r.data));

const heatmapPagesStmt = db.prepare(`
  SELECT page_url, viewport_w, COUNT(*) AS clicks
  FROM clicks GROUP BY page_url, viewport_w ORDER BY clicks DESC
`);
export const heatmapPages = () => heatmapPagesStmt.all();

const clicksForPageStmt = db.prepare(`
  SELECT x_norm, y_abs, doc_width, viewport_w FROM clicks
  WHERE page_url = ? AND viewport_w BETWEEN ? AND ?
`);
const scrollForPageStmt = db.prepare(`
  SELECT max_depth_pct FROM scroll WHERE page_url = ? AND viewport_w BETWEEN ? AND ?
`);
export function heatmapData(pageUrl, viewport, tolerance = 120) {
  const lo = viewport - tolerance;
  const hi = viewport + tolerance;
  const clicks = clicksForPageStmt.all(pageUrl, lo, hi);
  const scrolls = scrollForPageStmt.all(pageUrl, lo, hi).map((r) => r.max_depth_pct);
  const avgScroll = scrolls.length ? scrolls.reduce((a, b) => a + b, 0) / scrolls.length : 0;
  return { clicks, sessions: scrolls.length, avgScrollPct: avgScroll };
}

export default db;
