/* ═══════════════════════════════════════════════════════════════
   PROFISSÃO ENGENHEIRO DE DADOS
   /ed/ped/ (este arquivo em dependencias/)
   ═══════════════════════════════════════════════════════════════ */

/* CTAs: abrir o popup de inscrição.
   Mesmo padrão do /ed/pre-mba-fpa/: os botões declaram o alvo em
   data-abre-popup e um listener só no documento abre. O openPopup é do
   form.js, injetado pelo form-include.js; sem ele, o clique não faz nada
   de errado (href="#"). */
(function () {
    document.addEventListener('click', function (e) {
        var alvo = e.target.closest('[data-abre-popup]');
        if (!alvo) return;

        e.preventDefault();

        var id = alvo.dataset.abrePopup;
        if (!id || typeof window.openPopup !== 'function') return;
        window.openPopup(id);
    });
})();

/* Vídeos de fundo (hero e Pós Tech).
   Com movimento reduzido ficam parados no poster. Fora disso, cada vídeo
   só toca enquanto está na tela, pra não gastar CPU nem banda com o que
   ninguém vê. */
(function () {
    var videos = document.querySelectorAll('.ped-stage-media video');
    if (!videos.length) return;

    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduz.matches) {
        videos.forEach(function (v) {
            v.removeAttribute('autoplay');
            v.pause();
        });
        return;
    }

    if (typeof IntersectionObserver === 'undefined') return;

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            var v = en.target;
            if (en.isIntersecting) {
                var p = v.play();
                if (p && p.catch) p.catch(function () {});
            } else {
                v.pause();
            }
        });
    }, { rootMargin: '200px 0px' });

    videos.forEach(function (v) { io.observe(v); });
})();
