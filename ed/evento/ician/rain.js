/* Chuva "matrix" CONTRÁRIA (sobe) atrás de .ic-usos + .ic-circle-scroll.
   Glifos do ascii; cabeça branca, rastro azul esmaecendo. Canvas transparente
   (sem tint); a máscara CSS (to top) faz o fade em direção ao topo da usos.
   Pausa fora da tela; ~24fps; respeita prefers-reduced-motion. */
(function () {
    var wrap = document.querySelector('.ic-rain-wrap');
    var cv = document.querySelector('.ic-rain');
    if (!wrap || !cv) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ctx = cv.getContext('2d');
    var GLYPHS = (
        "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍｦｲｸｺｿﾁﾄﾉﾌﾔﾙﾚﾛﾝ" +
        "0123456789" +
        "ABCDEFGHIJKLMNPQRSTUVWXYZ" +
        ":=*+<>|/"
    ).split('');
    var CELL = 16, FONT = CELL + "px 'Cascadia Code', 'Consolas', 'Menlo', monospace", TRAIL = 16;
    var W = 0, H = 0, cols = 0, rows = 0, grid = [], heads = [], speeds = [];

    function resize() {
        W = cv.offsetWidth; H = cv.offsetHeight;   /* canvas: max 1440 x 100% do wrap */
        if (!W || !H) return;
        cv.width = W; cv.height = H;
        cols = Math.ceil(W / CELL);
        rows = Math.ceil(H / CELL);
        grid = new Array(cols * rows);
        for (var k = 0; k < grid.length; k++) grid[k] = (Math.random() * GLYPHS.length) | 0;
        heads = new Array(cols); speeds = new Array(cols);
        for (var i = 0; i < cols; i++) { heads[i] = Math.random() * H; speeds[i] = CELL * (0.4 + Math.random() * 0.5); }
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    }
    resize();

    function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.font = FONT;
        /* cintila alguns glifos do grid */
        var fl = (grid.length * 0.01) | 0;
        for (var f = 0; f < fl; f++) grid[(Math.random() * grid.length) | 0] = (Math.random() * GLYPHS.length) | 0;
        for (var i = 0; i < cols; i++) {
            var hrow = Math.floor(heads[i] / CELL), x = i * CELL + CELL / 2;
            for (var t = 0; t <= TRAIL; t++) {
                var row = hrow + t;              /* rastro abaixo da cabeça */
                if (row < 0 || row >= rows) continue;
                if (t === 0) { ctx.globalAlpha = 1; ctx.fillStyle = 'rgb(245,245,255)'; }
                else { ctx.globalAlpha = (1 - t / TRAIL) * 0.8; ctx.fillStyle = 'rgb(110,130,255)'; }
                ctx.fillText(GLYPHS[grid[row * cols + i]], x, row * CELL + CELL / 2);
            }
            heads[i] -= speeds[i];               /* sobe */
            if (heads[i] + TRAIL * CELL < 0) { heads[i] = H + Math.random() * CELL * 24; speeds[i] = CELL * (0.4 + Math.random() * 0.5); }
        }
        ctx.globalAlpha = 1;
    }

    var raf = null, lastT = 0, FRAME_MS = 42;   /* ~24fps */
    function frame(t) {
        raf = requestAnimationFrame(frame);
        if (t - lastT < FRAME_MS) return;
        lastT = t;
        draw();
    }
    function start() { if (!raf) { lastT = 0; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    if ('ResizeObserver' in window) { new ResizeObserver(resize).observe(wrap); }
    else { window.addEventListener('resize', resize); }

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { if (es[0].isIntersecting) start(); else stop(); }).observe(wrap);
    } else {
        start();
    }
})();
