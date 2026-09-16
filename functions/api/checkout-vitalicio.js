/**
 * Cloudflare Pages Function · GET /api/checkout-vitalicio?email=...
 *
 * Decide pra qual checkout do Ultra Vitalício a pessoa vai depois de enviar
 * o form 518 (popup da /ed/infinite-pass/oferta/): quem já está na lista
 * "TODOS ALUNOS" da ActiveCampaign vai pro link de aluno, o resto vai pro
 * link de novo. A consulta é feita AQUI, server-side, porque a chave da AC
 * não pode existir no navegador.
 *
 * Quem chama: /ed/infinite-pass/checkout/ (página de passagem que a AC abre
 * como redirect do form). Ela manda o email e obedece o `destino`.
 *
 * AUTOSSUFICIENTE: este arquivo não importa nada e não depende de nenhuma
 * outra function. O único externo são as 2 env vars do AC, que são config do
 * painel do Cloudflare, não código.
 *
 * Contrato:
 *   GET ?email=...        → { ok, aluno, destino, motivo }
 *   GET ?email=...&go=1   → 302 direto pro destino (caminho sem JS), levando
 *                           junto os outros parâmetros da URL (nome,
 *                           telefone, UTMs) pro checkout
 *   GET ?status           → diagnóstico sem PII (env presente? lista achada?)
 *
 * FAIL-OPEN PRO LINK DE NOVOS: qualquer erro (AC fora, env faltando, lista
 * não encontrada, email inválido) manda pro link público. Ninguém trava na
 * frente do checkout. O custo é um aluno pagar o preço cheio num dia de AC
 * fora, e isso o suporte resolve; travar a compra não tem conserto.
 *
 * Env vars (Settings → Environment variables do projeto no CF Pages, em
 * Production E Preview):
 *   AC_API_URL            ex: https://karpinskileonardo.api-us1.com
 *   AC_API_KEY            api key do AC
 *   AC_LISTA_ALUNOS_ID    opcional, pula a busca por nome e usa este id
 *   AC_LISTA_ALUNOS_NOME  opcional, troca o nome procurado (default abaixo)
 */

const DESTINOS = {
  aluno: 'https://go.xperiun.com/pay/ultra-vitalicio-alunos',
  novos: 'https://go.xperiun.com/pay/ultra-vitalicio-novos',
};

/* Nome da lista na AC. A busca é por nome (e não por id fixo) pra esta
   function não quebrar se a lista for recriada, e pra ninguém precisar
   caçar id no painel. Achou uma vez, fica em cache no isolate. */
const LISTA_ALUNOS = 'TODOS ALUNOS';

/* false = estar na lista basta, mesmo descadastrado do email (status 2) ou
   com email que voltou (3). Quem saiu da newsletter não deixou de ser aluno.
   true = só quem está ativo (status 1) na lista conta. */
const SO_ATIVOS = false;

const TIMEOUT_MS = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Parâmetros desta API, que não têm o que fazer no checkout. */
const CONTROLE = ['go', 'status'];

/* Tag da AC que não foi substituído (%EMAIL%, %firstname%...). Chega assim
   quando o campo está vazio no contato. Não repassa: encheria o checkout de
   "%firstname%" no lugar do nome. */
const TAG_CRU_RE = /%[A-Za-z0-9_]+%/g;

/* Tira os tags não substituídos e devolve o que sobrou. Tira em vez de
   descartar o valor inteiro porque o `fullname` é montado com dois tags:
   com sobrenome vazio, "Vitor %lastname%" vira "Vitor", melhor que nada.
   Sobrou só tag, vira vazio e o parâmetro não é repassado. */
function saneia(valor) {
  return String(valor || '').replace(TAG_CRU_RE, ' ').replace(/\s+/g, ' ').trim();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/* no-store em tudo: a resposta depende do email, nunca pode ser cacheada
   pelo CF nem pelo navegador e servida pra outra pessoa. */
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders,
    },
  });
}

function redirect(destino) {
  return new Response(null, {
    status: 302,
    headers: { Location: destino, 'Cache-Control': 'no-store' },
  });
}

/* Repassa pro checkout o que veio na URL (nome, telefone, UTMs), tirando o
   que é controle desta API, o que veio vazio e o tag que a AC não resolveu.
   Vale só pro caminho ?go=1: quando quem chama é a página, é ela que monta
   o destino final, porque o email pode ter vindo do sessionStorage. */
function paramsRepassados(url) {
  const saida = new URLSearchParams();
  url.searchParams.forEach((valor, chave) => {
    if (CONTROLE.includes(chave)) return;
    const v = saneia(valor);
    if (!v) return;   // campo vazio no contato, ou só tag não substituído
    saida.set(chave, v);
  });
  return saida;
}

/* URLSearchParams serializa espaço como "+", que nem toda plataforma de
   checkout decodifica. %20 funciona em todas. */
function comParams(url, params) {
  const q = params.toString().replace(/\+/g, '%20');
  if (!q) return url;
  return url + (url.includes('?') ? '&' : '?') + q;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const querRedirect = url.searchParams.has('go');

  const ac = env.AC_API_URL && env.AC_API_KEY
    ? {
        base: env.AC_API_URL.replace(/\/+$/, ''),
        headers: { 'Api-Token': env.AC_API_KEY, Accept: 'application/json' },
      }
    : null;

  if (url.searchParams.has('status')) {
    return json({
      ok: true,
      env: { api_url: !!env.AC_API_URL, api_key: !!env.AC_API_KEY },
      lista: {
        nome: env.AC_LISTA_ALUNOS_NOME || LISTA_ALUNOS,
        id: ac ? await resolveListaId(ac, env) : null,
        id_fixo: (env.AC_LISTA_ALUNOS_ID || '').trim() || null,
      },
      so_ativos: SO_ATIVOS,
      destinos: DESTINOS,
    });
  }

  const email = (url.searchParams.get('email') || '').trim().toLowerCase();

  const responde = (aluno, motivo) => {
    const destino = aluno ? DESTINOS.aluno : DESTINOS.novos;
    return querRedirect
      ? redirect(comParams(destino, paramsRepassados(url)))
      : json({ ok: true, aluno, destino, motivo });
  };

  if (!EMAIL_RE.test(email)) return responde(false, 'email_invalido');

  if (!ac) {
    console.error('checkout-vitalicio · env do AC ausente, fail-open novos');
    return responde(false, 'config_ausente');
  }

  try {
    const listaId = await resolveListaId(ac, env);
    if (!listaId) {
      // Pode ser lista renomeada/apagada OU a AC fora do ar: daqui não dá
      // pra separar os dois. `?status` responde qual é quando a AC voltar.
      console.error('checkout-vitalicio · lista não resolvida (renomeada? AC fora?)', {
        nome: env.AC_LISTA_ALUNOS_NOME || LISTA_ALUNOS,
      });
      return responde(false, 'lista_indisponivel');
    }

    const naLista = await estaNaLista(ac, email, listaId);
    // null = a AC não respondeu direito; não dá pra afirmar que não é aluno.
    if (naLista === null) return responde(false, 'ac_indisponivel');

    return responde(naLista, 'ok');
  } catch (err) {
    console.error('checkout-vitalicio · erro, fail-open novos', err);
    return responde(false, 'erro');
  }
}

/* GET na AC com timeout. Devolve o JSON ou null (qualquer falha), porque
   quem chama já trata null como "não sei" e cai no fail-open. */
async function acGet(ac, path) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ac.base + path, { headers: ac.headers, signal: ctrl.signal });
    if (!res.ok) {
      console.error('checkout-vitalicio · AC respondeu', res.status, path.split('?')[0]);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('checkout-vitalicio · AC inacessível', err, path.split('?')[0]);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* Cache do id da lista no escopo do módulo: vive enquanto o isolate viver,
   então a maioria das requisições gasta só as 2 chamadas do contato. */
let listaIdCache = null;

/* Acento, caixa e espaço sobrando não podem decidir quem paga quanto.
   \u0300-\u036f é a faixa dos acentos que o NFD separa das letras. */
function normaliza(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function acharPorNome(body, alvo) {
  const achada = (body?.lists || []).find((l) => normaliza(l.name) === alvo);
  return achada?.id ? String(achada.id) : null;
}

async function resolveListaId(ac, env) {
  const fixo = (env.AC_LISTA_ALUNOS_ID || '').trim();
  if (fixo) return fixo;
  if (listaIdCache) return listaIdCache;

  const nome = env.AC_LISTA_ALUNOS_NOME || LISTA_ALUNOS;
  const alvo = normaliza(nome);

  // 1ª tentativa: o filtro por nome da própria AC.
  const busca = await acGet(ac, `/api/3/lists?limit=100&filters[name]=${encodeURIComponent(nome)}`);
  const doFiltro = acharPorNome(busca, alvo);
  if (doFiltro) return (listaIdCache = doFiltro);

  // 2ª: varre as listas e compara nome normalizado. Cap de 500 listas.
  for (let offset = 0; offset < 500; offset += 100) {
    const pagina = await acGet(ac, `/api/3/lists?limit=100&offset=${offset}`);
    if (!pagina?.lists?.length) break;
    const achada = acharPorNome(pagina, alvo);
    if (achada) return (listaIdCache = achada);
    if (offset + 100 >= Number(pagina?.meta?.total || 0)) break;
  }

  return null;
}

/* true/false = respondido pela AC. null = não deu pra saber (erro/timeout). */
async function estaNaLista(ac, email, listaId) {
  const contatos = await acGet(ac, `/api/3/contacts?email=${encodeURIComponent(email)}`);
  if (!contatos) return null;

  const contatoId = (contatos.contacts || [])[0]?.id;
  if (!contatoId) return false; // não existe na AC, então não está na lista

  const vinculos = await acGet(ac, `/api/3/contacts/${contatoId}/contactLists?limit=100`);
  if (!vinculos) return null;

  return (vinculos.contactLists || []).some(
    (v) => String(v.list) === String(listaId) && (!SO_ATIVOS || String(v.status) === '1')
  );
}
