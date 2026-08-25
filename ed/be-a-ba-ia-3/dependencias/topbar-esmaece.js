/* ═══════════════════════════════════════════════════════════════════════════
   A faixa do topo esmaece quando a oferta entra na tela: os dois botões dela
   levam pra lá, então depois que a pessoa chega a faixa vira ruído em cima do
   card.

   IntersectionObserver em vez de listener de scroll: o browser avisa nas duas
   viradas e nada roda enquanto a página rola.

   O rootMargin encolhe a área de observação por cima e por baixo: 48px em cima
   é a altura da própria faixa, e -50% embaixo faz a virada acontecer quando o
   topo da oferta passa da METADE da tela. Sem isso ela sumiria já no primeiro
   pixel da seção aparecendo no rodapé, uns 750px antes de a pessoa chegar lá.
   A transição de opacity mora no CSS.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
    var faixa = document.querySelector('.cert-topbar');
    var oferta = document.getElementById('oferta');
    if (!faixa || !oferta || !('IntersectionObserver' in window)) return;

    var ALTURA_FAIXA = 48;

    var observador = new IntersectionObserver(function (entradas) {
        faixa.classList.toggle('is-esmaecida', entradas[0].isIntersecting);
    }, { rootMargin: '-' + ALTURA_FAIXA + 'px 0px -50% 0px', threshold: 0 });

    observador.observe(oferta);
})();
