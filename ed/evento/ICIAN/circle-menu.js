/* ============================================================
   ICIAN · Menu circular de aulas, trocado pelo scroll.
   .ic-circle (sticky 100dvh) dentro de .ic-circle-scroll (300vh).
   O progresso do scroll seleciona a aula: gira o arco de seleção
   pra opção ativa e atualiza o conteúdo (tags, título, texto).
   ============================================================ */
(function () {
    'use strict';

    var scroll = document.querySelector('.ic-circle-scroll');
    var section = document.querySelector('.ic-circle');
    if (!scroll || !section) return;

    var options = section.querySelectorAll('.ic-circle-option');
    var rings   = section.querySelectorAll('.ic-circle-select, .ic-circle-select-outer');
    var tags    = section.querySelectorAll('.ic-circle-tags .ic-circle-tag');
    var titleEl = section.querySelector('.ic-circle-title');
    var textEl  = section.querySelector('.ic-circle-text');
    var profsEl = section.querySelector('.ic-circle-profs');
    var PROF = '/ed/site-dependencias/site-media/professores/';

    var AULAS = [
        {
            num: 'Aula 01', date: '21/07', time: '19:30',
            title: 'A nova era da Xperiun começa aqui',
            text: 'Abertura da Imersão e panorama de mercado. Leonardo mostra, na prática, o papel de cada ferramenta do ecossistema Claude: Claude Web, Claude Cowork e Claude Code.',
            profs: [{ name: 'Leonardo Karpinski', img: PROF + 'prof_leo.webp' }]
        },
        {
            num: 'Aula 02', date: '22/07', time: '19:30',
            title: 'IA aplicada a dados e cenários de negócio',
            text: 'Aplicações práticas com dados e dashboards. Você vai ver como a IA entra em cada etapa, requisitos, modelagem, medidas e design dos relatórios e qual caminho é o mais seguro para dados de empresa.',
            profs: [{ name: 'Sayuri Valente', img: PROF + 'prof_say.webp' }]
        },
        {
            num: 'Aula 03', date: '23/07', time: '19:30',
            title: 'Automação, produtividade e próximos passos',
            text: 'Aplicações práticas com Claude Cowork para automação, organização de tarefas e ganhos reais de produtividade no dia a dia do negócio.',
            profs: [
                { name: 'Iago Braz', img: PROF + 'prof_iago.webp' },
                { name: 'Leonardo Karpinski', img: PROF + 'prof_leo.webp' }
            ]
        }
    ];

    /* espaçamento angular entre as opções (30°) */
    var STEP_DEG = 30;
    var current = -1;

    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

    function apply(i) {
        if (i === current) return;
        current = i;

        /* gira o arco de seleção pra alinhar com a opção ativa */
        var rot = (i * STEP_DEG) + 'deg';
        rings.forEach(function (r) { r.style.setProperty('--sel-rot', rot); });

        /* marca a opção ativa (glow + cor) */
        options.forEach(function (o, idx) { o.classList.toggle('is-selected', idx === i); });

        /* atualiza o conteúdo */
        var a = AULAS[i];
        if (tags[0]) tags[0].textContent = a.num;
        if (tags[1]) tags[1].textContent = a.date;
        if (tags[2]) tags[2].textContent = a.time;
        if (textEl)  textEl.textContent  = a.text;
        if (titleEl) {
            titleEl.textContent = a.title;
            /* força repaint: alguns engines não atualizam texto com
               background-clip:text (gradiente) ao trocar o textContent */
            titleEl.style.display = 'none';
            void titleEl.offsetHeight;
            titleEl.style.display = '';
        }
        if (profsEl) {
            var html = '<div class="ic-circle-prof-avatars">';
            a.profs.forEach(function (pr) {
                html += '<img class="ic-circle-prof-img" src="' + pr.img + '" alt="' + pr.name + '">';
            });
            html += '</div><span class="ic-circle-prof-names">com ' +
                    a.profs.map(function (pr) { return pr.name; }).join(' e ') + '</span>';
            profsEl.innerHTML = html;
        }
    }

    function onScroll() {
        var rect = scroll.getBoundingClientRect();
        var total = scroll.offsetHeight - window.innerHeight;
        var p = total > 0 ? clamp01(-rect.top / total) : 0;
        var i = Math.floor(p * AULAS.length);
        if (i > AULAS.length - 1) i = AULAS.length - 1;
        if (i < 0) i = 0;
        apply(i);
    }

    /* clique numa opção: rola até a posição da aula no wrapper (sticky),
       e o onScroll cuida de ativar/atualizar. */
    function scrollToAula(i) {
        var total = scroll.offsetHeight - window.innerHeight;
        var wrapperTop = scroll.getBoundingClientRect().top + window.scrollY;
        var targetP = (i + 0.5) / AULAS.length;   /* meio da faixa da aula i */
        window.scrollTo({ top: wrapperTop + targetP * total, behavior: 'smooth' });
    }
    options.forEach(function (o, i) {
        o.addEventListener('click', function () { scrollToAula(i); });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    apply(0);
    onScroll();

    /* ===== glow das opções: glifos VARIANDO (máscara dinâmica, estilo ascii) =====
       Gera uma SVG de glifos monospace aleatórios e injeta em --glyph-mask;
       a cada tick troca uma fração dos glifos (cintila). Só roda com o
       círculo visível. */
    /* mesmos glifos do ascii (ascii-stage.js) */
    var GLYPHS = (
        "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍｦｲｸｺｿﾁﾄﾉﾌﾔﾙﾚﾛﾝ" +
        "0123456789" +
        "ABCDEFGHIJKLMNPQRSTUVWXYZ" +
        ":=*+<>|/"
    ).split('');
    var GCELL = 1080 / 128;                 /* mesma célula do ascii (~8.44px) */
    var GN = 48, GW = (GN * GCELL) | 0;      /* 405px */
    var GFONT = (GCELL * 1.05) + "px 'Cascadia Code', 'Consolas', 'Menlo', monospace";
    var GAMB = 0.28;                         /* mesmo AMBIENT do ascii */
    var GREDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    /* tabela de cores (sem alocar string rgb por glifo) */
    var GLUT = [[], []], GBRIGHT = 'rgb(245,245,255)';
    for (var _s = 0; _s < 2; _s++) for (var _l = 0; _l < 32; _l++) {
        var _v = _l / 31;
        GLUT[_s][_l] = _s
            ? 'rgb(' + ((140 + 90*_v)|0) + ',' + ((140 + 90*_v)|0) + ',' + ((235 + 20*_v)|0) + ')'
            : 'rgb(' + (( 60 + 80*_v)|0) + ',' + (( 60 + 80*_v)|0) + ',' + ((190 + 65*_v)|0) + ')';
    }
    /* estado por célula: caractere, brilho (0.28..1) e lado (0 face / 1 parede) */
    var gC = [], gV = [], gS = [];
    function newV() { return GAMB + (1 - GAMB) * Math.random(); }
    function newS() { return Math.random() < 0.35 ? 1 : 0; }
    for (var gg = 0; gg < GN * GN; gg++) { gC.push((Math.random() * GLYPHS.length) | 0); gV.push(newV()); gS.push(newS()); }

    var glyphCtxs = [];
    options.forEach(function (o) {
        var cv = document.createElement('canvas');
        cv.width = GW; cv.height = GW;
        cv.className = 'ic-circle-glyphs';
        cv.setAttribute('aria-hidden', 'true');
        var ctx = cv.getContext('2d');
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        o.appendChild(cv);
        glyphCtxs.push(ctx);
    });
    /* mesmas cores do ascii: faces (azul) / paredes (azul claro) + sparkle */
    function renderGlyphs(ctx) {
        ctx.clearRect(0, 0, GW, GW);
        ctx.font = GFONT;
        for (var r = 0; r < GN; r++) for (var c = 0; c < GN; c++) {
            var idx = c + r * GN;
            if (Math.random() < 0.004) {
                ctx.fillStyle = GBRIGHT;
            } else {
                var li = (gV[idx] * 31) | 0; if (li > 31) li = 31; else if (li < 0) li = 0;
                ctx.fillStyle = GLUT[gS[idx]][li];
            }
            ctx.fillText(GLYPHS[gC[idx]], c * GCELL + GCELL / 2, r * GCELL + GCELL / 2);
        }
    }
    var glyphRAF = null, glyphLast = 0, GFRAME_MS = 42;   /* ~24fps */
    function glyphFrame(t) {
        glyphRAF = requestAnimationFrame(glyphFrame);
        if (t - glyphLast < GFRAME_MS) return;
        glyphLast = t;
        var n = gC.length, ch = (n * 0.05) | 0, k, j;   /* flicker ~5% */
        for (k = 0; k < ch; k++) { j = (Math.random() * n) | 0; gC[j] = (Math.random() * GLYPHS.length) | 0; gV[j] = newV(); gS[j] = newS(); }
        if (current >= 0 && glyphCtxs[current]) renderGlyphs(glyphCtxs[current]);
    }
    function startGlyphs() { if (!glyphRAF) { glyphLast = 0; glyphRAF = requestAnimationFrame(glyphFrame); } }
    function stopGlyphs() { if (glyphRAF) { cancelAnimationFrame(glyphRAF); glyphRAF = null; } }
    if (GREDUCED) {
        /* sem flicker: rende o selecionado uma vez e a cada troca (scroll) */
        var renderSel = function () { if (current >= 0 && glyphCtxs[current]) renderGlyphs(glyphCtxs[current]); };
        renderSel();
        window.addEventListener('scroll', renderSel, { passive: true });
    } else if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { if (es[0].isIntersecting) startGlyphs(); else stopGlyphs(); }).observe(scroll);
    } else {
        startGlyphs();
    }
})();
