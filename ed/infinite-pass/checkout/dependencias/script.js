/* script.js — página de passagem do checkout do Ultra Vitalício.

   Pega o email de quem acabou de enviar o form 518, pergunta pra
   /api/checkout-vitalicio se ele está na lista "TODOS ALUNOS" da AC,
   redireciona pro link de pagamento que a Function devolver e REPASSA os
   parâmetros que vieram na URL (nome, telefone, UTMs) pra ele.

   O redirect do form na AC está configurado assim:
     /ed/infinite-pass/checkout/?email=%EMAIL%&fullname=%firstname%%20%lastname%
       &phone=%phone%&utm_campaign=%UTM_CAMPAIGN%&utm_source=%UTM_SOURCE%
       &utm_medium=%UTM_MEDIUM%&utm_content=%UTM_CONTENT%

   DE ONDE VEM O EMAIL: por dois caminhos, nesta ordem.
     1. `?email=` na URL, se a AC substituir o tag %EMAIL%. Só vale se o
        valor PARECER email: quando a AC não substitui, chega o literal
        "%EMAIL%", e aceitar isso mandaria todo mundo (aluno incluído) pro
        link de novos. Lixo na URL é descartado sem barulho.
     2. sessionStorage (chave xp_lead_email), gravado pelo form.js logo
        antes do envio. É o caminho que funciona independente do painel da
        AC, já que o redirect dela não carrega os campos do form.
   O valor NÃO é apagado depois: se a pessoa voltar pra cá, a verificação
   precisa acontecer de novo. Ele morre junto com a aba.

   FAIL-OPEN: sem email, sem resposta ou com erro, vai pro link público. O
   mesmo critério da Function. Ninguém fica preso nesta tela. */
(function () {
    var API = '/api/checkout-vitalicio';
    var PADRAO = 'https://go.xperiun.com/pay/ultra-vitalicio-novos';
    var CHAVE = 'xp_lead_email';
    var LIMITE_MS = 6000;   // teto do lado do cliente; a Function tem o dela
    var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;   // a mesma da Function

    /* Tag da AC que não foi substituído (%EMAIL%, %firstname%...). Chega
       assim quando o campo está vazio no contato ou quando a AC não resolve
       aquele tag naquele contexto. Vai fora: repassar isso encheria o
       checkout de "%firstname%" no lugar do nome. */
    var RE_TAG_CRU = /%[A-Za-z0-9_]+%/g;

    /* Parâmetros que são desta página e não têm o que fazer no checkout. */
    var CONTROLE = ['go', 'status'];

    /* PII que não precisa ficar na barra de endereço depois de lida (o
       checkout recebe por parâmetro do mesmo jeito). As UTMs ficam, pra não
       estragar a atribuição de quem lê a URL da página. */
    var PII = ['email', 'fullname', 'phone'];

    var entrada = new URLSearchParams(location.search);
    var fallback = document.querySelector('[data-fallback]');

    function limpa(valor) {
        return String(valor || '').trim();
    }

    /* Tira os tags que a AC não substituiu e devolve o que sobrou. Tira em
       vez de descartar o valor inteiro porque o `fullname` é montado com
       dois tags: com sobrenome vazio, "Vitor %lastname%" vira "Vitor", que
       ainda é melhor que nada no checkout. Sobrou só tag, vira vazio e o
       parâmetro não é repassado. */
    function saneia(valor) {
        return limpa(String(valor || '').replace(RE_TAG_CRU, ' ').replace(/\s+/g, ' '));
    }

    /* Tudo que veio na URL e vale a pena repassar, com o email resolvido por
       cima (que pode ter vindo do sessionStorage, e aí nem estava na URL). */
    function paramsDeSaida(email) {
        var saida = new URLSearchParams();
        entrada.forEach(function (valor, chave) {
            if (CONTROLE.indexOf(chave) !== -1) return;
            var v = saneia(valor);
            if (!v) return;   // campo vazio no contato, ou só tag não substituído
            saida.set(chave, v);
        });
        if (email) saida.set('email', email);
        return saida;
    }

    /* URLSearchParams serializa espaço como "+", que nem toda plataforma de
       checkout decodifica. %20 funciona em todas. */
    function comParams(url, params) {
        var q = params.toString().replace(/\+/g, '%20');
        if (!q) return url;
        return url + (url.indexOf('?') === -1 ? '?' : '&') + q;
    }

    function lerEmail() {
        var daUrl = limpa(entrada.get('email')).toLowerCase();
        if (RE_EMAIL.test(daUrl)) return daUrl;

        // Safari em aba privada pode negar o storage: se negar, segue sem.
        try {
            var doStorage = limpa(sessionStorage.getItem(CHAVE)).toLowerCase();
            if (RE_EMAIL.test(doStorage)) return doStorage;
        } catch (e) { /* storage bloqueado */ }

        return '';
    }

    /* Tira email/telefone/nome da barra de endereço depois de lidos. Não é
       blindagem (o GTM pode já ter disparado com a URL cheia), é reduzir
       exposição: histórico do navegador, screenshot, ombro do lado. */
    function limpaUrl() {
        if (!history.replaceState) return;
        var visivel = new URLSearchParams(entrada.toString());
        var mexeu = false;
        PII.forEach(function (chave) {
            if (visivel.has(chave)) { visivel.delete(chave); mexeu = true; }
        });
        if (!mexeu) return;
        var q = visivel.toString();
        history.replaceState(null, '', location.pathname + (q ? '?' + q : ''));
    }

    var email = lerEmail();
    var saida = paramsDeSaida(email);

    // O link de saída manual já nasce com os parâmetros: quem clicar antes
    // da verificação responder não perde nome, telefone nem UTM.
    if (fallback) fallback.href = comParams(PADRAO, saida);

    limpaUrl();

    function vai(destino, aluno) {
        var url = comParams(destino, saida);
        if (fallback) fallback.href = url;
        // Melhor esforço: o GTM pode não dar conta de disparar antes da
        // navegação. Segurar o redirect pra garantir o evento custaria
        // tempo do usuário no meio de uma compra, e aí o evento é que sai
        // mais caro que a medição.
        if (window.dataLayer) {
            window.dataLayer.push({ event: 'checkout_vitalicio', aluno_xperiun: !!aluno });
        }
        // replace e não href: esta tela não entra no histórico, então o
        // Voltar do navegador devolve pra oferta, não pra cá.
        location.replace(url);
    }

    if (!email) {
        vai(PADRAO, false);
        return;
    }

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, LIMITE_MS);

    fetch(API + '?email=' + encodeURIComponent(email), {
        headers: { Accept: 'application/json' },
        signal: ctrl.signal
    })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
            clearTimeout(timer);
            vai((d && d.destino) || PADRAO, d && d.aluno);
        })
        .catch(function () {
            clearTimeout(timer);
            vai(PADRAO, false);
        });
})();
