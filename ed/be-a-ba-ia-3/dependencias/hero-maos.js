/* ══════════════════════════════════════════════════════════════════════════
   Efeito de scroll das mãos do hero, medido na página antiga (o transform lá
   é inline, aplicado por JS, e a curva é exatamente esta):

     mão humana → translateX(-min(scrollY / 6, 128)px)
     mão robô   → translateX(+min(scrollY / 6, 128)px)

   Ou seja: as duas se afastam na horizontal, 1px por cada 6px de scroll, com
   teto de 128px pra cada lado (o mesmo 128px do offset em relação ao centro no
   CSS). Batido ponto a ponto: 60→10, 300→50, 600→100, 700→116.67, 768→128 e
   estável daí em diante.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
    var maos = document.querySelectorAll('.hero-hand');
    if (!maos.length) return;

    /* Quem pede menos movimento não recebe o efeito (mãos ficam na origem). */
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var FATOR = 6;      /* px de scroll por px de deslocamento */
    var TETO = 128;     /* deslocamento máximo de cada mão */
    var agendado = false;

    function aplicar() {
        agendado = false;
        var d = Math.min((window.pageYOffset || 0) / FATOR, TETO);
        var i, m;
        for (i = 0; i < maos.length; i++) {
            m = maos[i];
            m.style.transform = 'translateX(' +
                (m.classList.contains('hero-hand--ai') ? d : -d) + 'px)';
        }
    }

    function agendar() {
        if (agendado) return;
        agendado = true;
        window.requestAnimationFrame(aplicar);
    }

    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    aplicar();
})();
