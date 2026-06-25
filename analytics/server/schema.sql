-- Schema do app de analytics (SQLite). Single-tenant, uso local.

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  started_at  INTEGER NOT NULL,          -- epoch ms (primeiro evento recebido)
  ended_at    INTEGER NOT NULL,          -- epoch ms (ultimo evento recebido)
  page_url    TEXT NOT NULL,             -- url da primeira pagina da sessao
  user_agent  TEXT,
  viewport_w  INTEGER,
  viewport_h  INTEGER
);

-- Eventos rrweb: uma linha por evento, replay = SELECT por session ordenado por seq.
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  seq         INTEGER NOT NULL,          -- ordem de chegada dentro da sessao
  timestamp   INTEGER NOT NULL,          -- epoch ms do evento (vem do rrweb)
  data        TEXT NOT NULL,             -- evento rrweb serializado (JSON)
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id, seq);

-- Cliques para o heatmap. x_norm = x / docWidth (0..1); y_abs = pixel relativo ao topo do documento.
CREATE TABLE IF NOT EXISTS clicks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  page_url    TEXT NOT NULL,
  x_norm      REAL NOT NULL,
  y_abs       INTEGER NOT NULL,
  doc_width   INTEGER NOT NULL,
  viewport_w  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_clicks_page ON clicks(page_url, viewport_w);

-- Profundidade maxima de scroll por sessao+pagina (upsert: guarda o maior valor).
CREATE TABLE IF NOT EXISTS scroll (
  session_id     TEXT NOT NULL,
  page_url       TEXT NOT NULL,
  viewport_w     INTEGER NOT NULL,
  max_depth_pct  REAL NOT NULL,
  PRIMARY KEY (session_id, page_url)
);
