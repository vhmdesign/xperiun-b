/* ═══════════════════════════════════════════════════════════════
   OBRIGADO, /ed/ped/obrigado/ (este arquivo em /ed/ped/dependencias/)

   Os CTAs entram depois de um atraso (data-atraso, em ms; 30s como na
   original), pra pessoa assistir antes de sair da página. Eles começam
   escondidos por aqui, e não pelo HTML, então sem JS ficam visíveis.
   ═══════════════════════════════════════════════════════════════ */
(function () {
    var acoes = document.querySelector('.ped-ob-acoes[data-atraso]');
    if (!acoes) return;

    var atraso = parseInt(acoes.dataset.atraso, 10) || 0;
    if (atraso <= 0) return;

    acoes.hidden = true;
    setTimeout(function () {
        acoes.hidden = false;
    }, atraso);
})();
