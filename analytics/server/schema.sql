-- Schema do app de analytics (SQLite). Single-tenant, uso local.

-- Visitantes: identidade persistente (cookie/localStorage). Um visitante tem N sessoes.
CREATE TABLE IF NOT EXISTS users (
  visitor_id     TEXT PRIMARY KEY,
  first_seen     INTEGER NOT NULL,         -- epoch ms (primeira vez visto)
  last_seen      INTEGER NOT NULL,         -- epoch ms (ultima vez visto)
  session_count  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  visitor_id  TEXT,                        -- FK logico para users
  started_at  INTEGER NOT NULL,            -- epoch ms (primeiro evento recebido)
  ended_at    INTEGER NOT NULL,            -- epoch ms (ultimo evento recebido)
  page_url    TEXT NOT NULL,               -- url da primeira pagina da sessao
  user_agent  TEXT,
  viewport_w  INTEGER,
  viewport_h  INTEGER,
  -- origem / atribuicao
  referrer      TEXT,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_term      TEXT,
  utm_content   TEXT,
  -- geo (resolvido por IP no servidor)
  country     TEXT,
  city        TEXT,
  -- dispositivo (parseado do user agent no servidor)
  device_type TEXT,                        -- mobile | tablet | desktop
  browser     TEXT,
  os          TEXT,
  -- agregados (recalculados a cada ingest)
  page_count    INTEGER NOT NULL DEFAULT 0,
  click_count   INTEGER NOT NULL DEFAULT 0,
  error_count   INTEGER NOT NULL DEFAULT 0,
  duration_ms   INTEGER NOT NULL DEFAULT 0,
  max_scroll_pct REAL   NOT NULL DEFAULT 0,
  -- flags comportamentais (Fase 2) para filtrar recordings
  has_rage        INTEGER NOT NULL DEFAULT 0,
  has_dead        INTEGER NOT NULL DEFAULT 0,
  has_error       INTEGER NOT NULL DEFAULT 0,
  is_quick_back   INTEGER NOT NULL DEFAULT 0,
  excessive_scroll INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);

-- Eventos rrweb: uma linha por evento, replay = SELECT por session ordenado por seq.
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  seq         INTEGER NOT NULL,            -- ordem de chegada dentro da sessao
  timestamp   INTEGER NOT NULL,            -- epoch ms do evento (vem do rrweb)
  data        TEXT NOT NULL,               -- evento rrweb serializado (JSON)
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id, seq);

-- Page views: uma linha por pagina visitada (incl. navegacao SPA). Paginas por sessao.
CREATE TABLE IF NOT EXISTS pageviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  visitor_id  TEXT,
  page_url    TEXT NOT NULL,
  entered_at  INTEGER NOT NULL,            -- epoch ms
  left_at     INTEGER,                     -- epoch ms (null enquanto na pagina)
  referrer    TEXT
);
CREATE INDEX IF NOT EXISTS idx_pageviews_session ON pageviews(session_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_page ON pageviews(page_url);

-- Cliques para o heatmap. x_norm = x / docWidth (0..1); y_abs = pixel relativo ao topo do documento.
CREATE TABLE IF NOT EXISTS clicks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  page_url    TEXT NOT NULL,
  x_norm      REAL NOT NULL,
  y_abs       INTEGER NOT NULL,
  doc_width   INTEGER NOT NULL,
  viewport_w  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  -- alvo do clique (Fase 2): filtro "clique em X" e deteccao de dead click
  element_selector TEXT,
  element_text     TEXT,
  is_rage     INTEGER NOT NULL DEFAULT 0,
  is_dead     INTEGER NOT NULL DEFAULT 0
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

-- Erros de JavaScript capturados na pagina (Fase 2).
CREATE TABLE IF NOT EXISTS errors (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  page_url    TEXT NOT NULL,
  message     TEXT NOT NULL,
  source      TEXT,
  line        INTEGER,
  col         INTEGER,
  stack       TEXT,
  ts          INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_errors_session ON errors(session_id);
CREATE INDEX IF NOT EXISTS idx_errors_message ON errors(message);

-- Smart events: conversoes autodetectadas (submit form, outbound, download) ou custom (xpTrack).
CREATE TABLE IF NOT EXISTS smart_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  name        TEXT NOT NULL,
  page_url    TEXT NOT NULL,
  ts          INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_smart_session ON smart_events(session_id);
CREATE INDEX IF NOT EXISTS idx_smart_name ON smart_events(name);

-- Performance / page speed (Fase 5). Navigation Timing + PerformanceObserver.
CREATE TABLE IF NOT EXISTS perf (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  page_url    TEXT NOT NULL,
  ttfb        REAL,
  fcp         REAL,
  lcp         REAL,
  dom_load    REAL,
  load        REAL,
  ts          INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_perf_page ON perf(page_url);
