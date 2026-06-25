/* Claude Run (runner ascii) trazido de /ed/temp/joguinho/jogo.html.
   Ajustes p/ rodar dentro da LP: teclado (espaço/setas) e loop só agem com o
   jogo visível (IntersectionObserver), pra não sequestrar o scroll da página. */
(function () {
    var FONT_REM = 1, LINE = 1.15, SS = 3;
    var FONT = 'px Consolas, "Cascadia Mono", "DejaVu Sans Mono", monospace';

    var canvas = document.getElementById('scene');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var hudEl = document.getElementById('hud');
    var msgEl = document.getElementById('msg');
    var duckEl = document.getElementById('duck');
    var gameVisible = false, rafId = null;
    function pad(n) { n = String(Math.floor(n)); while (n.length < 5) n = '0' + n; return n; }

    function tok(name) {
        var p = document.createElement('span'); p.style.color = 'var(' + name + ')';
        document.body.appendChild(p); var c = getComputedStyle(p).color; p.remove(); return c;
    }
    var COL_BASE = tok('--bw-25'), COL_ROBOT = tok('--pc300'), COL_BW = tok('--bw');

    /* ---- assets ---- */
    var lua = null, cenario = null, RUN = null, JUMP = null, DUCK = null;
    var ROBO_ROWS = 4, DUCK_ROWS = 3;

    var BUGS = [
        ['█ █', '███', ' █ '],
        ['█ █ █', '█████'],
        [' █ ', '███', '█ █'],
        ['██ ██', '█████', '  █  ']
    ];
    var FLYER = ['█   █', '█████', ' █ █ '];

    var FRAME_ROWS = 15;
    var cellW = 28, cellH = 55, frameCols = 80, border = '';
    var FONTPX = 48, glyphW = {};
    var skyLayer = null, staticLayer = null;

    function gridW(g) { var m = 0; for (var i = 0; i < g.length; i++) if (g[i].length > m) m = g[i].length; return m; }
    function leftTrim(g) {
        var r = g.slice();
        while (r.length && r[r.length - 1].trim() === '') r.pop();
        var m = Infinity; r.forEach(function (l) { if (l.trim() !== '') m = Math.min(m, l.match(/^ */)[0].length); });
        if (!isFinite(m)) m = 0;
        return r.map(function (l) { return l.slice(m).replace(/\s+$/, ''); });
    }

    function drawGrid(g, lines, pxX, pxY, color) {
        g.fillStyle = color;
        for (var r = 0; r < lines.length; r++) {
            var line = lines[r], y = pxY + r * cellH + cellH / 2;
            for (var c = 0; c < line.length; c++) {
                var ch = line.charAt(c); if (ch === ' ') continue;
                var w = glyphW[ch]; if (w === undefined) { w = g.measureText(ch).width; glyphW[ch] = w; }
                g.save(); g.translate(pxX + c * cellW, y);
                if (w > cellW) g.scale(cellW / w, 1);
                g.fillText(ch, 0, 0); g.restore();
            }
        }
    }
    function setFont(g) { g.font = FONTPX + FONT; g.textAlign = 'left'; g.textBaseline = 'middle'; }

    function buildLayers() {
        if (!cenario || !lua) return;
        var skyW = Math.ceil(gridW(cenario) * cellW), skyH = Math.ceil(cenario.length * cellH);
        skyLayer = document.createElement('canvas'); skyLayer.width = skyW; skyLayer.height = skyH;
        var sc = skyLayer.getContext('2d'); setFont(sc);
        drawGrid(sc, cenario, 0, 0, COL_BASE);

        staticLayer = document.createElement('canvas'); staticLayer.width = canvas.width; staticLayer.height = canvas.height;
        var st = staticLayer.getContext('2d'); setFont(st);
        drawGrid(st, [border], 0, 0, COL_BASE);
        drawGrid(st, [border], 0, GROUND_ROW * cellH, COL_BASE);
        drawGrid(st, lua, (frameCols - gridW(lua) - 6) * cellW, 0, COL_BASE);
    }

    function layout() {
        var remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        FONTPX = FONT_REM * remPx * SS;
        ctx.font = FONTPX + FONT;
        cellW = ctx.measureText('█').width;
        cellH = FONTPX * LINE;
        var vw = window.innerWidth;
        var scale = vw < 864 ? 0.75 : 1;
        var dispW = (cellW / SS) * scale, dispH = (cellH / SS) * scale;
        frameCols = Math.max(40, Math.ceil(vw / dispW) + 1);
        canvas.width = Math.ceil(frameCols * cellW);
        canvas.height = Math.ceil(FRAME_ROWS * cellH);
        canvas.style.width = (frameCols * dispW) + 'px';
        canvas.style.height = (FRAME_ROWS * dispH) + 'px';
        border = new Array(frameCols + 1).join('…');
        glyphW = {};
        buildLayers();
    }
    window.addEventListener('resize', layout);

    var GROUND_ROW = 14, BASE_ROW = 14, SCENE_TOP = 2, ROBOT_COL = 6;
    var G = 42, JUMPV = 26;

    var state = 'ready', speed, score, hi, jy, vy, grounded, downHeld, runT, frame, obs, spawnTimer, spawned, skyX, t0;
    hi = parseInt(localStorage.getItem('xperiun-claude-run') || '0', 10);
    function reset() { speed = 30; score = 0; jy = 0; vy = 0; grounded = true; downHeld = false; runT = 0; frame = 0; obs = []; spawnTimer = 0.6; spawned = 0; skyX = 0; }
    reset();

    function ducking() { return downHeld && grounded; }
    function jump() {
        if (state === 'ready') { state = 'run'; return; }
        if (state === 'over') { reset(); state = 'run'; return; }
        if (grounded) { vy = JUMPV; grounded = false; }
    }
    var isTouch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    var HINT = isTouch ? 'Toque para pular e ↓ para abaixar!'
                       : 'Aperte espaço para pular e ↓ para abaixar!';
    if (isTouch) duckEl.style.display = 'flex';
    window.addEventListener('keydown', function (e) {
        if (!gameVisible) return;   /* só captura teclado com o jogo na tela */
        if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
        else if (e.code === 'ArrowDown') { e.preventDefault(); downHeld = true; }
    });
    window.addEventListener('keyup', function (e) { if (e.code === 'ArrowDown') downHeld = false; });
    canvas.addEventListener('pointerdown', function (e) { e.preventDefault(); jump(); }, { passive: false });
    function duckOn(e) { e.preventDefault(); e.stopPropagation(); downHeld = true; }
    function duckOff() { downHeld = false; }
    duckEl.addEventListener('pointerdown', duckOn, { passive: false });
    duckEl.addEventListener('pointerup', duckOff);
    duckEl.addEventListener('pointerleave', duckOff);
    duckEl.addEventListener('pointercancel', duckOff);
    window.addEventListener('pointerup', duckOff);

    function spawn() {
        spawned++;
        var fly = spawned > 3 && Math.random() < 0.30;
        if (fly) obs.push({ sp: FLYER, col: frameCols + 1, w: gridW(FLYER), h: FLYER.length, bottom: 11, fly: true });
        else { var b = BUGS[(Math.random() * BUGS.length) | 0]; obs.push({ sp: b, col: frameCols + 1, w: gridW(b), h: b.length, bottom: BASE_ROW, fly: false }); }
    }

    function update(dt) {
        skyX += (state === 'run' ? speed : 4) * 0.25 * cellW * dt;
        if (state !== 'run') return;

        score += dt * 12;
        var CROSS = Math.max(1.4, 2.2 - score * 0.0010);
        speed = frameCols / CROSS;

        jy += vy * dt; vy -= G * dt;
        if (jy <= 0) { jy = 0; vy = 0; grounded = true; }
        if (!grounded && downHeld) vy -= 40 * dt;

        runT += dt; if (runT > 0.10) { runT = 0; frame ^= 1; }

        for (var i = obs.length - 1; i >= 0; i--) { obs[i].col -= speed * dt; if (obs[i].col + obs[i].w < -1) obs.splice(i, 1); }

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
            spawn();
            var gMin = Math.max(1.4, 1.6 - score * 0.0004);
            var gMax = Math.max(2.1, 2.6 - score * 0.0004);
            spawnTimer = gMin + Math.random() * (gMax - gMin);
        }

        var duck = ducking();
        var rRows = duck ? DUCK_ROWS : ROBO_ROWS;
        var rTop = (BASE_ROW - (rRows - 1)) - jy + (duck ? 0.35 : 0.5);
        var rBot = (BASE_ROW + 1) - jy;
        var rL = ROBOT_COL + 1, rR = ROBOT_COL + 9;
        for (var j = 0; j < obs.length; j++) {
            var o = obs[j];
            var oL = o.col + 0.3, oR = o.col + o.w - 0.3;
            var oTop = (o.bottom + 1) - o.h + 0.4, oBot = (o.bottom + 1);
            if (rL < oR && rR > oL && rTop < oBot && rBot > oTop) {
                state = 'over'; hi = Math.max(hi, Math.floor(score));
                localStorage.setItem('xperiun-claude-run', String(hi));
            }
        }
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (skyLayer) {
            var cW = skyLayer.width, x0 = -(skyX % cW);
            ctx.drawImage(skyLayer, x0, SCENE_TOP * cellH);
            ctx.drawImage(skyLayer, x0 + cW, SCENE_TOP * cellH);
        }
        if (staticLayer) ctx.drawImage(staticLayer, 0, 0);

        for (var i = 0; i < obs.length; i++) {
            var o = obs[i];
            drawGrid(ctx, o.sp, o.col * cellW, (o.bottom - (o.h - 1)) * cellH, COL_BW);
        }

        var duck = ducking();
        var sp = !grounded ? JUMP
               : duck ? DUCK[frame]
               : state === 'run' ? RUN[frame]
               : JUMP;
        var rRows = duck ? DUCK_ROWS : ROBO_ROWS;
        drawGrid(ctx, sp, ROBOT_COL * cellW, ((BASE_ROW - (rRows - 1)) - jy) * cellH, COL_ROBOT);

        hudEl.textContent = Math.floor(score);
        if (state === 'run') {
            msgEl.style.display = 'none';
        } else if (state === 'ready') {
            msgEl.style.display = 'block';
            msgEl.textContent = HINT;
        } else {
            msgEl.style.display = 'block';
            msgEl.innerHTML = '<span class="over">Game Over!</span><br>Recorde ' + Math.floor(hi)
                + ', ' + (isTouch ? 'toque' : 'espaço') + ' para recomeçar!';
        }
    }

    function loop(t) {
        if (!gameVisible) { rafId = null; t0 = 0; return; }
        if (!t0) t0 = t; var dt = Math.min(0.05, (t - t0) / 1000); t0 = t;
        ctx.font = FONTPX + FONT; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        update(dt); render();
        rafId = requestAnimationFrame(loop);
    }
    function startGame() { if (!rafId && gameVisible) { t0 = 0; rafId = requestAnimationFrame(loop); } }

    var DATA = {
        cenario: "    *                                                                                     * *                                                                                                                         *          *\n                                *                                           *                                                  ░░░░░                                                                     *                                    ░░░░                     *                                                                  ░░░░\n           ░░░░░░                                                             *                                            ░░░░░░░░░░              *                                                                                       ░░░░░░░                                                    *                                ░░░░░░░░\n   ░░░   ░░░░░░░░░░                                                                      ░░░░░                            ░░░░░░░░░░░░░░░░   *                                                                                            ░░░░░░░░░░░░                       ░░░░                                                     ░░░░░░░░░░░░░\n  ░░░░░░░░░░░░░░░░░░░    *                                                           ░░░░░░░░░░                                        ░░░░░             *     *                                                                                                          ░░░░░░░░\n                                                                                    ░░░░░░░░░░░░░░░░                                ░░░░░░░░        *                                                                                                                    ░░░░░░░░░░░░░                     *       ░░░░  *\n*                                 ░░░░                                             ░░░░░░                                          ░░░░░░░░░░░░░░                                                      *                                                                                                        ░░░░░░░░\n                                ░░░░░░░░                                     * ░░░░░░░░░░░                                                 *                                              ░░░░               ░░░░░░                                                                *      *                    ░░░░░░░░░░░░░\n                              ░░░░░░░░░░░░░░░░                               ░░░░░░░░░░░░░░░░░░░                                                                                       ░░░░░░░░          ░░░░░░░░░░░                      *\n                                                       *                                    *                                                                                         ░░░░░░░░░░░░░    ░░░░░░░░░░░░░░░░░░                                                                                                                    *   *\n                                        *                                                                   *                                             *                                                *         *                                                                     *\n                     *                                                                                                                                                                                                                                                           *                          *\n",
        lua: "\n\n                                             █████▓▓░\n                                           ███▓░     ░░\n                                          ███▓░\n                                          ███▓░\n                                           ██▓░░      ▓\n                                             ░▓▓███▓▓░\n",
        robo: " █████████\n██▄█████▄██\n █████████\n █ █   █ █\n",
        run1: " █████████\n██▄█████▄██\n █████████\n █ ▀   █ ▀\n",
        run2: " █████████\n██▄█████▄██\n █████████\n ▀ █   ▀ █\n",
        duck1: " █████████ \n▀█▄█████▄█▀\n ▀    ▀    ",
        duck2: " █████████ \n▀█▄█████▄█▀\n   ▀     ▀ "
    };
    function lines(s) { return s.replace(/\n+$/, '').split('\n'); }
    cenario = lines(DATA.cenario);
    lua = leftTrim(lines(DATA.lua));
    RUN = [lines(DATA.run1), lines(DATA.run2)];
    JUMP = lines(DATA.robo); ROBO_ROWS = JUMP.length;
    DUCK = [lines(DATA.duck1), lines(DATA.duck2)]; DUCK_ROWS = DUCK[0].length;
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
        layout();
        var stage = document.getElementById('stage');
        if ('IntersectionObserver' in window && stage) {
            new IntersectionObserver(function (es) { gameVisible = es[0].isIntersecting; if (gameVisible) startGame(); }).observe(stage);
        } else { gameVisible = true; startGame(); }
    });
})();
