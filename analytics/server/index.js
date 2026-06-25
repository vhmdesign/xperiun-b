// Servidor Fastify: ingestao de eventos + API de leitura + serve dashboard e tracker.
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ingestBatch, listSessions, sessionEvents, heatmapPages, heatmapData } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;

const app = Fastify({
  // Lotes de eventos rrweb podem ser grandes (snapshot inicial do DOM).
  bodyLimit: 25 * 1024 * 1024,
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

// --- Ingestao ---
app.post('/ingest', async (req, reply) => {
  const body = req.body || {};
  if (!body.sessionId || !body.meta?.pageUrl) {
    return reply.code(400).send({ error: 'sessionId e meta.pageUrl sao obrigatorios' });
  }
  const result = ingestBatch(body);
  return reply.send({ ok: true, ...result });
});

// --- Leitura ---
app.get('/api/sessions', async () => ({ sessions: listSessions() }));

app.get('/api/session/:id', async (req, reply) => {
  const events = sessionEvents(req.params.id);
  if (!events.length) return reply.code(404).send({ error: 'sessao sem eventos' });
  return { id: req.params.id, events };
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
