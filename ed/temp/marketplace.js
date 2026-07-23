/* marketplace.js — cometa de partículas nos conectores do card Ecossistema.
   Setup apenas (sem loop por frame): injeta N partículas por conector e monta
   o offset-path de cada canto (degrau + reta até o centro do hub) a partir da
   largura medida do stage, reaplicando no resize. A animação é 100% CSS
   (@keyframes mk-comet + --ramp/animation-delay por partícula). */
(function () {
    var stage = document.querySelector('.mk-eco-stage');
    if (!stage) return;

    var N = 10;
    var corners = ['tl', 'tr', 'bl', 'br', 'r', 'l'];

    /* camada + partículas (cabeça = i 0, opacidade 1; cauda = i N-1, ~0) */
    var layer = document.createElement('div');
    layer.className = 'mk-eco-comets';
    corners.forEach(function (c) {
        for (var i = 0; i < N; i++) {
            var dot = document.createElement('span');
            dot.className = 'mk-eco-comet-dot mk-eco-comet-dot--' + c;
            dot.style.setProperty('--ramp', (1 - i / (N - 1)).toFixed(3));
            dot.style.animationDelay = (i * 0.03).toFixed(3) + 's';
            layer.appendChild(dot);
        }
    });
    stage.appendChild(layer);

    /* offset-path por canto, em coordenadas de px do stage. cx = centro do hub.
       degrau: node (borda interna, centro vertical) → reto 32 → curva 32r →
       desce/sobe 32 → curva 32r → reto até cx. topo y=128, base y=192. Todos os
       x deslocados +32 (nodes afastados das laterais, no lugar do antigo padding).
       r/l: retas horizontais do centro do hub (cx,160) até as extremas W / 0. */
    var styleEl = document.createElement('style');
    document.head.appendChild(styleEl);

    function build() {
        var W = stage.clientWidth;
        var cx = W / 2;
        var p = {
            tl: 'M96 32 H128 A32 32 0 0 1 160 64 V96 A32 32 0 0 0 192 128 H' + cx,
            tr: 'M' + (W - 96) + ' 32 H' + (W - 128) + ' A32 32 0 0 0 ' + (W - 160) + ' 64 V96 A32 32 0 0 1 ' + (W - 192) + ' 128 H' + cx,
            bl: 'M96 288 H128 A32 32 0 0 0 160 256 V224 A32 32 0 0 1 192 192 H' + cx,
            br: 'M' + (W - 96) + ' 288 H' + (W - 128) + ' A32 32 0 0 1 ' + (W - 160) + ' 256 V224 A32 32 0 0 0 ' + (W - 192) + ' 192 H' + cx,
            r: 'M' + cx + ' 160 H' + W,
            l: 'M' + cx + ' 160 H0'
        };
        styleEl.textContent = corners.map(function (c) {
            return '.mk-eco-comet-dot--' + c + '{offset-path:path("' + p[c] + '");}';
        }).join('');
    }

    build();
    if (window.ResizeObserver) {
        new ResizeObserver(build).observe(stage);
    } else {
        window.addEventListener('resize', build);
    }

    /* pausa as animações (cometas + órbita) quando o card sai da viewport —
       custo zero fora de vista. */
    var mkEco = stage.closest('.mk-eco') || stage;
    if (window.IntersectionObserver) {
        new IntersectionObserver(function (entries) {
            mkEco.classList.toggle('is-paused', !entries[0].isIntersecting);
        }, { rootMargin: '128px' }).observe(mkEco);
    }
})();
