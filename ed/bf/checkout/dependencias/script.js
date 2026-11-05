/* script.js: página de passagem do checkout da Black Friday.

   Baseado no da /ed/infinite-pass/checkout/, sem a consulta de aluno: a BF
   tem um link de pagamento só. Pega o email de quem acabou de enviar o
   form 522 (popup da /ed/bf/oferta/), REPASSA os parâmetros que vieram na
   URL (nome, telefone, UTMs) e redireciona pro checkout.

   O redirect do form na AC deve apontar pra cá assim:
     /ed/bf/checkout/?email=%EMAIL%&fullname=%firstname%%20%lastname%
       &phone=%phone%&utm_campaign=%UTM_CAMPAIGN%&utm_source=%UTM_SOURCE%
       &utm_medium=%UTM_MEDIUM%&utm_content=%UTM_CONTENT%

   DE ONDE VEM O EMAIL: por dois caminhos, nesta ordem.
     1. `?email=` na URL, se a AC substituir o tag %EMAIL%. Só vale se o
        valor PARECER email: quando a AC não substitui, chega o literal
        "%EMAIL%", que é descartado.
     2. sessionStorage (chave xp_lead_email), gravado pelo form.js logo
        antes do envio.
   Sem email nenhum a pessoa vai pro checkout do mesmo jeito, só sem o
   campo preenchido. Ninguém fica preso nesta tela. */
(function () {
    var DESTINO = 'https://go.xperiun.com/subscribe/app-ultra-oferta-novos-bf26';
    var CHAVE = 'xp_lead_email';
    var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    /* Tag da AC que não foi substituído (%EMAIL%, %firstname%...): vai fora,
       senão o checkout abriria com "%firstname%" no lugar do nome. */
    var RE_TAG_CRU = /%[A-Za-z0-9_]+%/g;

    /* Parâmetros que são desta página e não têm o que fazer no checkout. */
    var CONTROLE = ['go', 'status'];

    /* PII que sai da barra de endereço depois de lida. As UTMs ficam. */
    var PII = ['email', 'fullname', 'phone'];

    var entrada = new URLSearchParams(location.search);
    var fallback = document.querySelector('[data-fallback]');

    function limpa(valor) {
        return String(valor || '').trim();
    }

    /* Tira os tags não substituídos e devolve o que sobrou: com sobrenome
       vazio, "Vitor %lastname%" vira "Vitor". */
    function saneia(valor) {
        return limpa(String(valor || '').replace(RE_TAG_CRU, ' ').replace(/\s+/g, ' '));
    }

    function paramsDeSaida(email) {
        var saida = new URLSearchParams();
        entrada.forEach(function (valor, chave) {
            if (CONTROLE.indexOf(chave) !== -1) return;
            var v = saneia(valor);
            if (!v) return;
            saida.set(chave, v);
        });
        if (email) saida.set('email', email);
        else saida.delete('email');   // "%EMAIL%" ou lixo: não repassa
        return saida;
    }

    /* URLSearchParams serializa espaço como "+"; %20 funciona em qualquer
       checkout. */
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
    var url = comParams(DESTINO, paramsDeSaida(email));

    if (fallback) fallback.href = url;
    limpaUrl();

    // Melhor esforço, sem segurar o redirect esperando o GTM.
    if (window.dataLayer) {
        window.dataLayer.push({ event: 'checkout_bf' });
    }

    // replace: esta tela não entra no histórico, então o Voltar do
    // navegador devolve pra oferta, não pra cá.
    location.replace(url);
})();
