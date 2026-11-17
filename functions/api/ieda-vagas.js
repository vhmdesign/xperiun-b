/**
 * Cloudflare Pages Function · GET /api/ieda-vagas
 *
 * Quantas vagas da IEDA (/ed/ieda/) já foram preenchidas (somando os lotes): conta os contatos
 * da lista 367 da ActiveCampaign. Entrou na lista, ocupa uma vaga. A consulta é feita
 * AQUI, server-side, porque a chave da AC não pode existir no navegador.
 *
 * Quem chama: /ed/ieda/dependencias/vagas.js, ao carregar a página e a cada 60s.
 *
 * AUTOSSUFICIENTE: não importa nada. Usa as mesmas 2 env vars do AC que o
 * checkout-vitalicio.js já usa (Settings → Environment variables do projeto no CF Pages):
 *   AC_API_URL         ex: https://karpinskileonardo.api-us1.com
 *   AC_API_KEY         api key do AC
 *   IEDA_LISTA_ID      opcional, troca a lista contada (default 367)
 *
 * Contrato:
 *   GET            → { ok: true, preenchidas: N }   (N = contatos na lista)
 *                    { ok: false, motivo }          (env ausente / AC fora)
 *   GET ?status    → diagnóstico sem PII (env presente? contagem por status)
 *
 * Contagem: soma os status 1 (ativo), 2 (descadastrado) e 3 (bounce) da lista. Quem
 * comprou e depois saiu dos emails continua ocupando a vaga. Pra contar só ativos, trocar
 * STATUS_CONTADOS pra [1].
 *
 * CACHE: a resposta boa fica 60s no cache do CF (Cache API, por data center), então mil
 * visitantes por minuto viram ~1 chamada à AC por minuto por data center. Erro não é
 * cacheado.
 */

const LISTA_PADRAO = '367';
const STATUS_CONTADOS = [1, 2, 3];
const CACHE_S = 60;
const TIMEOUT_MS = 5000;

function json(body, status = 200, cacheS = 0) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cacheS ? `public, max-age=${cacheS}` : 'no-store',
    },
  });
}

/* meta.total dos contatos da lista num status; null se a AC não respondeu direito */
async function contaStatus(ac, lista, status) {
  const url = `${ac.base}/api/3/contacts?listid=${encodeURIComponent(lista)}&status=${status}&limit=1`;
  try {
    const r = await fetch(url, { headers: ac.headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!r.ok) {
      console.error('ieda-vagas · AC respondeu', r.status, 'status', status);
      return null;
    }
    const d = await r.json();
    const n = parseInt(d && d.meta && d.meta.total, 10);
    return Number.isFinite(n) ? n : null;
  } catch (e) {
    console.error('ieda-vagas · AC falhou', String(e));
    return null;
  }
}

async function conta(ac, lista) {
  const partes = await Promise.all(STATUS_CONTADOS.map((s) => contaStatus(ac, lista, s)));
  if (partes.some((n) => n === null)) return { total: null, partes };
  return { total: partes.reduce((a, b) => a + b, 0), partes };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const lista = String(env.IEDA_LISTA_ID || LISTA_PADRAO).trim();

  const ac = env.AC_API_URL && env.AC_API_KEY
    ? {
        base: env.AC_API_URL.replace(/\/+$/, ''),
        headers: { 'Api-Token': env.AC_API_KEY, Accept: 'application/json' },
      }
    : null;

  if (url.searchParams.has('status')) {
    const c = ac ? await conta(ac, lista) : null;
    return json({
      ok: true,
      env: { api_url: !!env.AC_API_URL, api_key: !!env.AC_API_KEY },
      lista,
      status_contados: STATUS_CONTADOS,
      por_status: c ? Object.fromEntries(STATUS_CONTADOS.map((s, i) => [s, c.partes[i]])) : null,
      preenchidas: c ? c.total : null,
    });
  }

  if (!ac) {
    console.error('ieda-vagas · env do AC ausente');
    return json({ ok: false, motivo: 'config_ausente' }, 503);
  }

  // cache por data center; a chave ignora query string (ex.: ?nc=) pra não furar o cache
  const cache = caches.default;
  const chave = new Request(`${url.origin}/api/ieda-vagas?lista=${encodeURIComponent(lista)}`);
  const guardada = await cache.match(chave);
  if (guardada) return guardada;

  const { total } = await conta(ac, lista);
  if (total === null) return json({ ok: false, motivo: 'ac_indisponivel' }, 502);

  const resposta = json({ ok: true, preenchidas: total }, 200, CACHE_S);
  context.waitUntil(cache.put(chave, resposta.clone()));
  return resposta;
}
