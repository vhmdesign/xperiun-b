// Servidor Fastify: ingestao de eventos + API de leitura + serve dashboard e tracker.
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ingestBatch, listSessions, sessionEvents, sessionMeta,
  heatmapPages, heatmapData, insights, behaviors, breakdown, errorList,
  smartEvents, funnel, funnelOptions, timeseries, performance, pagePerformance, pages,
} from './db.js';
import { parseUserAgent, clientIp, geoFromIp } from './enrich.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;

const app = Fastify({
  // Lotes de eventos rrweb podem ser grandes (snapshot inicial do DOM).
  bodyLimit: 25 * 1024 * 1024,
  trustProxy: true, // respeita x-forwarded-for para pegar o IP real do visitante
  logger: true,
});

// Site roda em :8080 (preview) e posta aqui em :3000. Libera tudo (uso local).
await app.register(cors, { origin: true });

// Serve o dashboard em / e o tracker.js (build) na raiz publica.
await app.register(fastifyStatic, { root: join(ROOT, 'dashboard'), prefix: '/' });
await app.register(fastifyStatic, {
  root: join(ROOT, 'public'),
  prefix: '/static/',
  decorateReply: false,
});

// Atalho: /tracker.js aponta pro bundle gerado pelo esbuild.
app.get('/tracker.js', (req, reply) => reply.sendFile('tracker.js', join(ROOT, 'public')));

// Extrai os filtros aceitos pelas queries a partir da query string.
function filtersFrom(query = {}) {
  const f = {};
  for (const k of ['from', 'to', 'device', 'browser', 'os', 'country', 'page', 'filter', 'event', 'q']) {
    if (query[k] !== undefined && query[k] !== '') f[k] = query[k];
  }
  return f;
}

// --- Ingestao ---
app.post('/ingest', async (req, reply) => {
  const body = req.body || {};
  if (!body.sessionId || !body.meta?.pageUrl) {
    return reply.code(400).send({ error: 'sessionId e meta.pageUrl sao obrigatorios' });
  }
  // Enriquecimento server-side: dispositivo (UA) + geo (IP).
  const ua = parseUserAgent(body.meta.userAgent);
  const geo = geoFromIp(clientIp(req));
  body.meta = { ...body.meta, ...ua, ...geo };

  const result = ingestBatch(body);
  return reply.send({ ok: true, ...result });
});

// --- Leitura ---
app.get('/api/sessions', async (req) => ({ sessions: listSessions(filtersFrom(req.query)) }));

app.get('/api/session/:id', async (req, reply) => {
  const events = sessionEvents(req.params.id);
  if (!events.length) return reply.code(404).send({ error: 'sessao sem eventos' });
  return { id: req.params.id, events, meta: sessionMeta(req.params.id) };
});

app.get('/api/insights', async (req) => ({
  summary: insights(filtersFrom(req.query)),
  behaviors: behaviors(filtersFrom(req.query)),
}));

app.get('/api/insights/breakdown', async (req) => {
  const f = filtersFrom(req.query);
  const dims = ['page', 'referrer', 'device', 'browser', 'os', 'country', 'source', 'medium', 'campaign'];
  const out = {};
  for (const d of dims) out[d] = breakdown(d, f);
  return out;
});

app.get('/api/errors', async (req) => ({ errors: errorList(filtersFrom(req.query)) }));

app.get('/api/insights/smart-events', async (req) => ({ events: smartEvents(filtersFrom(req.query)) }));

app.get('/api/insights/timeseries', async (req) => ({ series: timeseries(filtersFrom(req.query)) }));

app.get('/api/insights/performance', async (req) => {
  const f = filtersFrom(req.query);
  return { overview: performance(f), urls: pagePerformance(f) };
});

app.get('/api/insights/pages', async (req) => {
  const f = filtersFrom(req.query);
  return { top: pages('top', f), entry: pages('entry', f), inactive: pages('inactive', f) };
});

app.get('/api/funnel/options', async () => funnelOptions());

// steps vem como JSON na query (?steps=[{type,value}]) + filtros normais
app.get('/api/funnel', async (req, reply) => {
  let steps = [];
  try { steps = JSON.parse(req.query.steps || '[]'); } catch { return reply.code(400).send({ error: 'steps invalido' }); }
  return funnel(steps, filtersFrom(req.query));
});

app.get('/api/heatmap/pages', async () => ({ pages: heatmapPages() }));

app.get('/api/heatmap', async (req, reply) => {
  const { page, viewport } = req.query;
  if (!page || !viewport) return reply.code(400).send({ error: 'page e viewport sao obrigatorios' });
  return heatmapData(page, Number(viewport));
});

app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => app.log.info(`Analytics rodando em http://localhost:${PORT}`))
  .catch((err) => { app.log.error(err); process.exit(1); });
