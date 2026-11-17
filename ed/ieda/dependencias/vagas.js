/*
 * IEDA, oferta (/ed/ieda/): lote atual, "Lote 01 - 00 de 30 vagas preenchidas" + quadrados,
 * e o preço do lote.
 *
 * A contagem vem de /api/ieda-vagas (functions/api/ieda-vagas.js), que conta quem está na
 * lista 367 da ActiveCampaign (quem comprou): entrou na lista, ocupa uma vaga.
 *
 * Os lotes vêm do data-lotes do HTML, em ordem (nome, vagas, parcela, vista). A contagem
 * enche um lote de cada vez: Lote 01 tem 30 vagas; a 31ª compra já é o Lote 02, que
 * recomeça em "01 de 30" e troca o preço (12x de 97 ou R$ 997). O último lote, cheio, fica
 * cheio. O HTML já vem com o Lote 01 escrito, então sem JS (ou com a API fora) é ele que
 * aparece.
 *
 * Cada quadrado ganha --p (0 no 1º, 1 no último), que o CSS usa pra misturar --sc500 com
 * --er500: quanto mais perto do último, mais vermelho. Preenchido = .is-cheia.
 *
 * Atualiza ao carregar e a cada 60s enquanto a aba estiver visível (a function guarda a
 * resposta em cache por 60s, então isso não bate na AC a cada visitante). Se a API falhar,
 * fica o que já estava na tela.
 *
 * Teste: ?vagas=N na URL simula N compras, sem chamar a API (ex.: /ed/ieda/?vagas=42 =
 * Lote 02 com 12 de 30). Vale em produção também, mas só muda a tela de quem abriu esse
 * link: não grava nada nem altera o que os outros veem.
 */
(function () {
    var lote = document.querySelector('.ieda-lote');
    if (!lote) return;
    var lotes;
    try {
        lotes = JSON.parse(lote.getAttribute('data-lotes'));
    } catch (e) {
        return;
    }
    if (!lotes || !lotes.length) return;

    var api = lote.getAttribute('data-vagas-api');
    var oferta = lote.closest('.ieda-oferta-compra');
    var nome = lote.querySelector('.ieda-lote-nome');
    var numero = lote.querySelector('.ieda-lote-preenchidas');
    var totalTxt = lote.querySelector('.ieda-lote-total');
    var barra = lote.querySelector('.ieda-lote-vagas');
    var valor = oferta && oferta.querySelector('.ieda-oferta-valor');
    var vista = oferta && oferta.querySelector('.ieda-oferta-vista');

    function dois(n) {
        return n < 10 ? '0' + n : String(n);
    }

    /* quadrados recriados só se o número de vagas do lote mudar */
    function montaQuadrados(qtd) {
        if (barra.children.length === qtd) return;
        barra.innerHTML = '';
        for (var i = 0; i < qtd; i++) {
            var q = document.createElement('span');
            q.style.setProperty('--p', qtd > 1 ? (i / (qtd - 1)).toFixed(4) : '0');
            barra.appendChild(q);
        }
    }

    function mostra(compras) {
        var resto = Math.max(0, Math.floor(compras) || 0);
        var i = 0;
        while (i < lotes.length - 1 && resto >= lotes[i].vagas) {
            resto -= lotes[i].vagas;
            i++;
        }
        var l = lotes[i];
        var n = Math.min(resto, l.vagas);

        nome.textContent = l.nome;
        numero.textContent = dois(n);
        totalTxt.textContent = String(l.vagas);
        if (valor) valor.textContent = l.parcela;
        if (vista) vista.textContent = 'ou R$ ' + l.vista + ' à vista';

        montaQuadrados(l.vagas);
        barra.setAttribute('aria-label', 'Vagas preenchidas no ' + l.nome);
        barra.setAttribute('aria-valuemax', String(l.vagas));
        barra.setAttribute('aria-valuenow', String(n));
        Array.prototype.forEach.call(barra.children, function (q, k) {
            q.classList.toggle('is-cheia', k < n);
        });
    }

    montaQuadrados(lotes[0].vagas);
    Array.prototype.forEach.call(barra.children, function (q, k, todos) {
        q.style.setProperty('--p', todos.length > 1 ? (k / (todos.length - 1)).toFixed(4) : '0');
    });

    var simulado = new URLSearchParams(location.search).get('vagas');
    if (simulado !== null && /^\d+$/.test(simulado)) {
        mostra(parseInt(simulado, 10));
        return;
    }
    if (!api || !window.fetch) return;

    function busca() {
        fetch(api, { headers: { Accept: 'application/json' } })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) {
                if (d && d.ok && typeof d.preenchidas === 'number') mostra(d.preenchidas);
            })
            .catch(function () {});
    }

    busca();
    setInterval(function () {
        if (document.visibilityState === 'visible') busca();
    }, 60000);
})();
