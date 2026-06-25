/* ============================================================
   ICIAN · ASCII Stage 3D (scroll-driven), dois canvases separados
   #ic-ascii-robo    -> robô do Claude, desmonta por dissolve (0 a 25%)
   #ic-ascii-xperiun -> símbolo Xperiun, monta por dissolve (25 a 50%)
   Canvases transparentes (clearRect) pra poderem se sobrepor.
   ============================================================ */
(function () {
    'use strict';

    var roboCanvas = document.getElementById('ic-ascii-robo');
    var xperiunCanvas = document.getElementById('ic-ascii-xperiun');
    if (!roboCanvas || !xperiunCanvas) return;
    var roboCtx = roboCanvas.getContext('2d');
    var xperiunCtx = xperiunCanvas.getContext('2d');

    /* ===== Grade (células quadradas) =====
       Mesma célula/fonte nos dois. O robô usa grid 128 / canvas 1080.
       O xperiun usa um grid maior (171 / canvas 1440) só pra dar margem
       e a rotação 3D não cortar. O fit do buildModel usa COLS=128 nos dois,
       então o símbolo fica do mesmo tamanho, só centrado num grid maior. */
    var COLS = 128, ROWS = 128;   /* referência de fit do buildModel */
    var CHAR_ASPECT = 1;
    var DIST = 26, ooz0 = 1 / DIST;

    var RC = 128, RS = 1080;   /* robô:    grid x canvas (px) */
    var XC = 171, XS = 1440;   /* xperiun: grid maior x canvas (margem) */

    /* ===== Glifos estilo Matrix ===== */
    var GLYPHS = (
        "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍｦｲｸｺｿﾁﾄﾉﾌﾔﾙﾚﾛﾝ" +
        "0123456789" +
        "ABCDEFGHIJKLMNPQRSTUVWXYZ" +
        ":=*+<>|/"
    ).split('');

    /* ===== Silhueta A: robô do Claude (SVG viewBox 0 0 110 80) ===== */
    var BODY = [
        [100,20],[100,0],[10,0],[10,20],[0,20],[0,40],[10,40],[10,80],
        [20,80],[20,60],[30,60],[30,80],[40,80],[40,60],[70,60],[70,80],
        [80,80],[80,60],[90,60],[90,80],[100,80],[100,40],[110,40],[110,20]
    ];
    var EYES = [
        { x0: 20, x1: 30, y0: 20, y1: 30 },
        { x0: 80, x1: 90, y0: 20, y1: 30 }
    ];
    function inPoly(px, py, poly) {
        var inside = false, j = poly.length - 1;
        for (var i = 0; i < poly.length; i++) {
            var xi = poly[i][0], yi = poly[i][1];
            var xj = poly[j][0], yj = poly[j][1];
            if (((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
            j = i;
        }
        return inside;
    }
    function inEye(px, py) {
        for (var e = 0; e < EYES.length; e++) {
            var E = EYES[e];
            if (px >= E.x0 && px <= E.x1 && py >= E.y0 && py <= E.y1) return true;
        }
        return false;
    }
    function inRobot(x, y) { return inPoly(x, y, BODY) && !inEye(x, y); }

    /* ===== Silhueta B: símbolo Xperiun (SVG viewBox 0 0 800 800) ===== */
    var XPATH = "M208.7 139.14c-38.41 38.42-22.84 116.28 34.79 173.9l34.77 34.78c32.6 32.6 71.16 48.74 93.84 41.15l-59.05-75.93 75.93 59.06c7.59-22.67-8.55-61.24-41.15-93.84L208.71 139.14zm180.34 288.939c7.44 22.7-8.71 61.14-41.21 93.65L243.48 626.07C147.44 722.13 38.43 768.84.01 730.43H0l278.26-278.25c32.51-32.51 70.95-48.65 93.65-41.21L243.48 556.53 389.04 428.1zm63.14 93.661c-32.6-32.6-48.74-71.16-41.15-93.84l75.93 59.06-59.05-75.93c22.67-7.59 61.24 8.55 93.84 41.15l34.77 34.78c57.63 57.63 73.2 135.479 34.79 173.899L452.19 521.74zm-41.22-149.82c-7.44-22.7 8.71-61.141 41.21-93.65l104.35-104.341c96.05-96.05 205.05-142.77 243.47-104.35h.01L521.74 347.83c-32.51 32.51-70.95 48.651-93.65 41.211l128.43-145.56-145.56 128.43z";
    var _off = document.createElement('canvas'); _off.width = 800; _off.height = 800;
    var _octx = _off.getContext('2d');
    var _xpath = new Path2D(XPATH);
    function inIcon(x, y) { return _octx.isPointInPath(_xpath, x, y); }

    /* ===== Construtor de modelo 3D extrudado (faces + paredes) + auto-fit ===== */
    function buildModel(VW, VH, STEP, inside) {
        var GNX = Math.ceil(VW / STEP) + 1, GNY = Math.ceil(VH / STEP) + 1;
        var solid = new Uint8Array(GNX * GNY);
        function S(i, j) { return (i < 0 || j < 0 || i >= GNX || j >= GNY) ? 0 : solid[i * GNY + j]; }
        var i, j;
        for (i = 0; i < GNX; i++)
            for (j = 0; j < GNY; j++)
                solid[i * GNY + j] = inside(i * STEP, j * STEP) ? 1 : 0;

        var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
        for (i = 0; i < GNX; i++)
            for (j = 0; j < GNY; j++)
                if (solid[i * GNY + j]) {
                    var bx = i * STEP, by = j * STEP;
                    if (bx < minX) minX = bx; if (bx > maxX) maxX = bx;
                    if (by < minY) minY = by; if (by > maxY) maxY = by;
                }
        var CX = (minX + maxX) / 2, CY = (minY + maxY) / 2;
        var halfExtent = Math.max(maxX - CX, maxY - CY);
        var HD = (9 / 55) * halfExtent, ZSTEPS = 14;

        var P = [];
        function push(x, y, z, nx, ny, nz, sd) {
            var l = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
            P.push([x - CX, CY - y, z, nx/l, ny/l, nz/l, sd]);
        }
        for (i = 0; i < GNX; i++)
            for (j = 0; j < GNY; j++) {
                if (!S(i, j)) continue;
                var sx = i * STEP, sy = j * STEP;
                push(sx, sy,  HD, 0, 0,  1, 0);
                push(sx, sy, -HD, 0, 0, -1, 0);
                var rE = !S(i+1,j), lE = !S(i-1,j), dE = !S(i,j+1), uE = !S(i,j-1);
                if (rE || lE || dE || uE) {
                    var nx = (rE?1:0) - (lE?1:0);
                    var ny = (uE?1:0) - (dE?1:0);
                    if (nx !== 0 || ny !== 0)
                        for (var k = 0; k < ZSTEPS; k++)
                            push(sx, sy, -HD + (2*HD) * k / (ZSTEPS - 1), nx, ny, 0, 1);
                }
            }

        var nmx = 0, nmy = 0;
        for (i = 0; i < P.length; i++) {
            if (Math.abs(P[i][0]) > nmx) nmx = Math.abs(P[i][0]);
            if (Math.abs(P[i][1]) > nmy) nmy = Math.abs(P[i][1]);
        }
        var nf = 12 / Math.max(nmx, nmy);
        var mfx = 0, mfy = 0;
        for (i = 0; i < P.length; i++) {
            P[i][0]*=nf; P[i][1]*=nf; P[i][2]*=nf;
            if (Math.abs(P[i][0]) > mfx) mfx = Math.abs(P[i][0]);
            if (Math.abs(P[i][1]) > mfy) mfy = Math.abs(P[i][1]);
        }
        var colFit = (COLS/2 * 0.84) / (ooz0 * mfx);
        var rowFit = (ROWS/2 * 0.84) / (ooz0 * mfy);
        var xK = Math.min(colFit, rowFit / CHAR_ASPECT);
        return { P: P, xK: xK, yK: xK * CHAR_ASPECT };
    }

    var MA = buildModel(110, 80, 0.55, inRobot);   /* robô */
    var MB = buildModel(800, 800, 4, inIcon);      /* símbolo Xperiun (800x800) */

    /* ===== Luz ===== */
    var LX = -0.4, LY = 0.55, LZ = 0.73;
    (function () { var l = Math.sqrt(LX*LX+LY*LY+LZ*LZ); LX/=l; LY/=l; LZ/=l; })();
    var AMBIENT = 0.28;

    /* Tabela de cores (32 níveis x lado) pra não alocar string rgb por glifo/frame */
    var CLUT = [[], []], CBRIGHT = 'rgb(245,245,255)';
    for (var _cs = 0; _cs < 2; _cs++) for (var _cl = 0; _cl < 32; _cl++) {
        var _cv = _cl / 31;
        CLUT[_cs][_cl] = _cs
            ? 'rgb(' + ((140 + 90*_cv)|0) + ',' + ((140 + 90*_cv)|0) + ',' + ((235 + 20*_cv)|0) + ')'
            : 'rgb(' + (( 60 + 80*_cv)|0) + ',' + (( 60 + 80*_cv)|0) + ',' + ((190 + 65*_cv)|0) + ')';
    }

    /* ===== Buffers de célula (scratch p/ o maior grid, reutilizados) ===== */
    var MAXN = XC * XC;
    var zbuf = new Float32Array(MAXN);
    var lum  = new Float32Array(MAXN);
    var occ  = new Uint8Array(MAXN);
    var side = new Uint8Array(MAXN);
    var glyphA = new Int16Array(RC * RC);   /* glifos do robô   */
    var glyphB = new Int16Array(XC * XC);   /* glifos do Xperiun (independentes) */
    for (var gi = 0; gi < glyphA.length; gi++) glyphA[gi] = (Math.random() * GLYPHS.length) | 0;
    for (var gj = 0; gj < glyphB.length; gj++) glyphB[gj] = (Math.random() * GLYPHS.length) | 0;

    var FONT = "px 'Cascadia Code', 'Consolas', 'Menlo', monospace";
    [roboCtx, xperiunCtx].forEach(function (c) {
        c.textAlign = 'center';
        c.textBaseline = 'middle';
    });

    /* ===== Gatilhos de scroll (independentes por canvas) =====
       robô    -> desaparece entre 25vh e 50vh de scroll
       xperiun -> monta enquanto o topo de .ic-sec2 vai de 75vh a 50vh
       Desmontagem/montagem em pedaços por dissolve (transparência). */
    var BLK = 2;           /* tamanho do pedaço (em células) que solta junto */
    var FADE_W = 0.18;     /* janela curta de fade por pedaço (transição nítida) */
    var SCROLL_EASE = 0.12;
    var smoothRobot = 0, smoothXp = 0;
    var sec2 = document.querySelector('.ic-sec2');
    function hash(a, b) { var n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); }
    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

    /* Desenha um modelo num canvas. dz = quanto está desmontado (0 inteiro, 1 sumido).
       Desmontagem/montagem em PEDAÇOS: cada bloco BLKxBLK some/aparece junto, por
       transparência, com janela curta e limiar aleatório escalonado. O `seed`
       deixa os dois canvases com padrões independentes. */
    function drawModel(ctx, M, dz, time, glyph, seed, cols, size) {
        var rows = cols, cell = size / cols, n = cols * cols;
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, size, size);
        if (dz >= 1) return;                 /* totalmente desmontado: nada a desenhar */

        var P = M.P, xK = M.xK, yK = M.yK;
        var A = Math.sin(time * 0.7) * 0.22;
        var B = Math.sin(time * 0.5) * 0.5;
        var bob = Math.sin(time * 1.1) * (rows * 0.04);
        var breath = 1 + Math.sin(time * 1.5) * 0.03;
        var sA = Math.sin(A), cA = Math.cos(A), sB = Math.sin(B), cB = Math.cos(B);

        var p;
        for (p = 0; p < n; p++) { occ[p] = 0; zbuf[p] = 0; }

        var cx = cols/2, cy = rows/2 + bob;
        for (p = 0; p < P.length; p++) {
            var pt = P[p];
            var px = pt[0]*breath, py = pt[1]*breath, pz = pt[2]*breath;
            var nx = pt[3], ny = pt[4], nz = pt[5];
            var y1 = py*cA - pz*sA, z1 = py*sA + pz*cA;
            var ny1 = ny*cA - nz*sA, nz1 = ny*sA + nz*cA;
            var x2 = px*cB + z1*sB, z2 = -px*sB + z1*cB;
            var nx2 = nx*cB + nz1*sB, nz2 = -nx*sB + nz1*cB;
            var ooz = 1 / (z2 + DIST);
            var scol = (cx + xK*ooz*x2) | 0;
            var srow = (cy - yK*ooz*y1) | 0;
            if (scol < 0 || scol >= cols || srow < 0 || srow >= rows) continue;
            var idx = scol + srow*cols;
            if (ooz > zbuf[idx]) {
                zbuf[idx] = ooz;
                var L = nx2*LX + ny1*LY + nz2*LZ;
                if (L < 0) L = 0;
                lum[idx] = AMBIENT + (1 - AMBIENT) * L;
                occ[idx] = 1;
                side[idx] = pt[6];
            }
        }

        ctx.font = (cell * 1.05) + FONT;

        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var c = col + row*cols;
                if (!occ[c]) continue;

                var a = 1;
                if (dz > 0) {
                    var bx = (col / BLK) | 0, by = (row / BLK) | 0;
                    var thr = hash(bx + seed, by + seed) * (1 - FADE_W);  /* quando o pedaço solta */
                    if (dz > thr) {
                        var u = (dz - thr) / FADE_W;   /* janela curta: o pedaço some rápido */
                        if (u > 1) u = 1;
                        a = 1 - u;                     /* só transparência, sem mover */
                    }
                }
                if (a <= 0) continue;

                var v = lum[c];
                var gx = col*cell + cell/2;
                var gy = row*cell + cell/2;

                ctx.globalAlpha = a;
                if (Math.random() < 0.004) {
                    ctx.fillStyle = CBRIGHT;
                } else {
                    var li = (v * 31) | 0; if (li > 31) li = 31; else if (li < 0) li = 0;
                    ctx.fillStyle = CLUT[side[c]][li];
                }
                ctx.fillText(GLYPHS[glyph[c]], gx, gy);
            }
        }
        ctx.globalAlpha = 1;
    }

    var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var FRAME_MS = 33;                  /* ~30fps */
    var visible = true, raf = null, lastT = 0;

    /* snap=true: crava o progresso (sem lerp); time congelado tira a animação idle */
    function renderFrame(time, snap) {
        var vh = window.innerHeight;
        var y = window.scrollY || window.pageYOffset || 0;
        var robotRaw = clamp01((y - 0.10 * vh) / (0.35 * vh));
        var sec2Top = sec2 ? sec2.getBoundingClientRect().top : vh;
        var xpRaw = clamp01((0.75 * vh - sec2Top) / (0.25 * vh));

        if (snap) { smoothRobot = robotRaw; smoothXp = xpRaw; }
        else {
            smoothRobot += (robotRaw - smoothRobot) * SCROLL_EASE;
            smoothXp    += (xpRaw    - smoothXp)    * SCROLL_EASE;
        }

        if (!REDUCED) {   /* cintila glifos só com movimento ligado */
            var ra = (glyphA.length * 0.05) | 0, rb = (glyphB.length * 0.05) | 0, r;
            for (r = 0; r < ra; r++) glyphA[(Math.random() * glyphA.length) | 0] = (Math.random() * GLYPHS.length) | 0;
            for (r = 0; r < rb; r++) glyphB[(Math.random() * glyphB.length) | 0] = (Math.random() * GLYPHS.length) | 0;
        }

        drawModel(roboCtx, MA, smoothRobot, time, glyphA, 0, RC, RS);
        drawModel(xperiunCtx, MB, 1 - smoothXp, time, glyphB, 37, XC, XS);

        roboCanvas.style.transform    = 'translateY(' + (-50 * smoothRobot)   + '%) scale(' + (1 + 0.25 * smoothRobot) + ')';
        xperiunCanvas.style.transform = 'translateY(' + (50 * (1 - smoothXp)) + '%) scale(' + (1 + 0.25 * (1 - smoothXp)) + ')';
    }

    function frame(t) {
        if (!visible) { raf = null; return; }
        raf = requestAnimationFrame(frame);
        if (t - lastT < FRAME_MS) return;
        lastT = t;
        renderFrame(t * 0.001, false);
    }
    function start() { if (!raf && visible && !REDUCED) { lastT = 0; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    roboCtx.clearRect(0, 0, RS, RS);
    xperiunCtx.clearRect(0, 0, XS, XS);
    renderFrame(0, true);               /* primeiro desenho imediato */

    if (REDUCED) {
        /* sem RAF contínuo: redesenha no scroll com tempo congelado (sem idle/flicker) */
        var rerender = function () { if (visible) renderFrame(0, true); };
        window.addEventListener('scroll', rerender, { passive: true });
        window.addEventListener('resize', rerender);
    } else {
        start();
    }

    /* pausa quando os dois stages (robô + xperiun) saem da tela */
    var watch = [roboCanvas.parentNode, xperiunCanvas.parentNode];
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) entries[i].target._ascVis = entries[i].isIntersecting;
            visible = watch.some(function (el) { return el._ascVis; });
            if (REDUCED) { if (visible) renderFrame(0, true); }
            else if (visible) start(); else stop();
        }, { rootMargin: '100px' });
        watch.forEach(function (el) { io.observe(el); });
    }
})();
