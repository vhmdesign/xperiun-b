/* data-squads.js
   1) conectores do bloco .ds-squad (cargos → hub)
   2) fases: scroll vertical → translateX horizontal nos cards
      (2b header inline no trilho, 2c altura pro reveal de Oportunidades)
   3) cometa de partículas nos conectores do card Ecossistema
   4) fichas escapando da pasta (composição do squad)
   5) player dos cases via IFrame API do YouTube (play/pause no card) */

/* ── 1) conectores dos cargos ───────────────────────────────────────────
   Um path SVG por cargo, medido a partir do layout real (o grid é que
   posiciona os cards): uma bézier cúbica única (sem trechos retos) que sai pra
   baixo do centro da borda inferior do cargo e chega por cima no centro do hub,
   que cobre a ponta. Recalcula no resize e quando as fontes carregam. */
(function () {
    var stage = document.querySelector('.ds-squad-stage');
    if (!stage) return;
    var svg = stage.querySelector('.ds-conn-svg');
    var hub = stage.querySelector('.ds-hub');
    /* :not(.ds-ghost) exclui as cópias decorativas do fundo — sem isso cada
       clone ganharia conector e partícula próprios. */
    var cargos = Array.prototype.slice.call(stage.querySelectorAll('.ds-cargos:not(.ds-ghost) .ds-cargo'));
    if (!svg || !hub || !cargos.length) return;

    var NS = 'http://www.w3.org/2000/svg';
    var MIN_K = 64;  /* alça mínima das tangentes (mantém a saída/chegada vertical) */
    var PER_CONN = 3;  /* partículas por conector */

    var paths = new Map();  /* cargo → <path> do conector */
    var dots = new Map();   /* cargo → [.ds-particle] que percorrem esse conector */

    /* camada das partículas logo depois do SVG: fica atrás dos cards e do hub */
    var layer = document.createElement('div');
    layer.className = 'ds-particles';
    layer.setAttribute('aria-hidden', 'true');
    svg.parentNode.insertBefore(layer, svg.nextSibling);

    cargos.forEach(function (el) {
        var path = document.createElementNS(NS, 'path');
        svg.appendChild(path);
        paths.set(el, path);

        /* duração e atraso sorteados por partícula: cada uma sai no seu tempo,
           então o fluxo fica irregular em vez de virar uma fila cadenciada. */
        var list = [];
        for (var i = 0; i < PER_CONN; i++) {
            var dot = document.createElement('span');
            dot.className = 'ds-particle';
            dot.style.setProperty('--dur', (2.5 + Math.random() * 3.5).toFixed(2) + 's');
            dot.style.setProperty('--delay', (Math.random() * -8).toFixed(2) + 's');
            layer.appendChild(dot);
            list.push(dot);
        }
        dots.set(el, list);
    });

    function n(v) { return Math.round(v * 100) / 100; }

    /* curva de (x0,y0) [centro de uma das bordas horizontais do cargo] até
       (x1,y1) [centro do hub]. Bézier cúbica com as duas alças na vertical: o
       traço sai do card, faz o S e entra no hub pelo lado oposto, sem canto nem
       trecho reto. A alça acompanha metade da distância vertical (mínimo 64) —
       assim a curva continua suave tanto colada no hub quanto longe dele.
       O sinal vem da própria geometria, então serve pro hub embaixo (desktop)
       e pro hub em cima (≤864) sem nenhuma bifurcação. */
    function route(x0, y0, x1, y1) {
        var s = y1 > y0 ? 1 : -1;
        var k = Math.max(MIN_K, Math.abs(y1 - y0) * 0.5) * s;
        return 'M' + n(x0) + ' ' + n(y0) +
            ' C' + n(x0) + ' ' + n(y0 + k) +
            ', ' + n(x1) + ' ' + n(y1 - k) +
            ', ' + n(x1) + ' ' + n(y1);
    }

    function draw() {
        var s = stage.getBoundingClientRect();
        svg.setAttribute('width', s.width);
        svg.setAttribute('height', s.height);
        svg.setAttribute('viewBox', '0 0 ' + s.width + ' ' + s.height);
        var h = hub.getBoundingClientRect();
        var hx = h.left - s.left + h.width / 2;
        var hTop = h.top - s.top, hBottom = h.bottom - s.top;
        var hMid = (hTop + hBottom) / 2;
        cargos.forEach(function (el) {
            var r = el.getBoundingClientRect();
            var top = r.top - s.top, bottom = r.bottom - s.top;
            /* cada ponta encosta na borda virada pro outro lado: sai da base do
               card e chega no topo do hub quando o hub está embaixo (desktop),
               e o contrário quando o bloco inverte (≤864). */
            var abaixo = hMid > (top + bottom) / 2;
            var y0 = abaixo ? bottom : top;
            var y1 = abaixo ? hTop : hBottom;
            var d = route(r.left - s.left + r.width / 2, y0, hx, y1);
            paths.get(el).setAttribute('d', d);
            /* as partículas correm exatamente por cima do traço */
            var op = 'path("' + d + '")';
            dots.get(el).forEach(function (dot) { dot.style.offsetPath = op; });
        });
    }

    draw();
    if (window.ResizeObserver) {
        var ro = new ResizeObserver(draw);
        ro.observe(stage);
        cargos.forEach(function (el) { ro.observe(el); });
    } else {
        window.addEventListener('resize', draw);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);

    /* partículas param quando o bloco sai da viewport — custo zero fora de vista */
    var squad = stage.closest('.ds-squad') || stage;
    if (window.IntersectionObserver) {
        new IntersectionObserver(function (entries) {
            squad.classList.toggle('is-paused', !entries[0].isIntersecting);
        }, { rootMargin: '128px' }).observe(squad);
    }
})();

/* ── 1b) flecha fantasma no fundo do bloco ──────────────────────────────
   Uma cópia da própria formação, ampliada e desfocada atrás dela. Clonar (em
   vez de duplicar marcação) garante que qualquer mudança na flecha real
   apareça no fantasma de graça. O transform mora no CSS, não aqui: ele muda
   por breakpoint, e estilo inline venceria a media query. */
(function () {
    var stage = document.querySelector('.ds-squad-stage');
    var cargos = stage && stage.querySelector('.ds-cargos');
    if (!cargos) return;

    var layer = document.createElement('div');
    layer.className = 'ds-ghosts';
    layer.setAttribute('aria-hidden', 'true');

    var g = cargos.cloneNode(true);
    g.classList.add('ds-ghost');
    layer.appendChild(g);
    stage.insertBefore(layer, stage.firstChild);
})();

/* ── 1c) chacoalhada dos avatares da órbita, partindo do centro ─────────
   O keyframe fica parado 92% do ciclo e só então dá o tranco. Aqui todos
   compartilham a MESMA duração e o atraso vem da distância de cada avatar até
   o centro da órbita: o tranco nasce no meio e se espalha pra borda, como uma
   onda. Duração compartilhada é o que faz a onda existir; com durações
   sorteadas (como era antes) as fases se descolam e o efeito volta a parecer
   aleatório. Uma pitada de sorteio no atraso evita que os avatares do mesmo
   raio disparem em bloco. */
(function () {
    var orbit = document.querySelector('.ganhos-orbit');
    var imgs = orbit && orbit.querySelectorAll('.ganhos-orbit-img');
    if (!imgs || !imgs.length) return;

    var DUR = 9;        /* s, igual pra todos: e o que sincroniza a onda */
    var ESPALHA = 1.6;  /* s entre o tranco do centro e o da borda */
    var RUIDO = 0.15;   /* s de folga sorteada, pro anel nao disparar em bloco */

    var o = orbit.getBoundingClientRect();
    var cx = o.left + o.width / 2, cy = o.top + o.height / 2;

    var dists = [], max = 0;
    Array.prototype.forEach.call(imgs, function (img, i) {
        var r = img.getBoundingClientRect();
        var dx = (r.left + r.width / 2) - cx, dy = (r.top + r.height / 2) - cy;
        dists[i] = Math.sqrt(dx * dx + dy * dy);
        if (dists[i] > max) max = dists[i];
    });

    Array.prototype.forEach.call(imgs, function (img, i) {
        var atraso = (max ? dists[i] / max : 0) * ESPALHA + (Math.random() * 2 - 1) * RUIDO;
        img.style.setProperty('--sh-dur', DUR + 's');
        img.style.setProperty('--sh-delay', atraso.toFixed(2) + 's');
    });
})();

/* ── 2) fases: scroll vertical → translateX horizontal ──────────────────
   Mesmo padrão do .mba-curriculum (ed/pos-graduacoes/mba-fpa.js): a seção
   ganha altura = 100dvh + o curso horizontal do trilho, o .fases-stage é
   sticky top: 0 e, enquanto o usuário rola por dentro da seção, o palco fica
   parado e o trilho de cards desliza pro lado.
   Abaixo de 865 desliga tudo (altura e transform zerados) e o CSS empilha. */
(function () {
    var sec = document.querySelector('.sec-fases');
    if (!sec) return;
    var track = sec.querySelector('.fases-track');
    if (!track) return;

    /* só largura, sem detectar touch: o Responsive Design Mode do DevTools
       emula toque por padrão e derrubaria o efeito em viewport desktop. */
    function isSmall() { return window.innerWidth < 865; }

    function maxTranslate() {
        if (isSmall()) return 0;
        var cards = track.querySelectorAll('.fase-card');
        if (!cards.length) return 0;
        var last = cards[cards.length - 1];
        /* clientWidth (e não innerWidth) exclui a scrollbar, batendo com o que
           o CSS enxerga. O padding direito do trilho entra na conta pro último
           card parar na mesma margem em que o primeiro começou. */
        var padRight = parseFloat(getComputedStyle(track).paddingRight) || 0;
        return Math.max(0, last.offsetLeft + last.offsetWidth + padRight - sec.clientWidth);
    }

    function updateHeight() {
        sec.style.height = isSmall() ? '' : 'calc(100dvh + ' + maxTranslate() + 'px)';
    }

    function applyTranslate() {
        if (isSmall()) { track.style.transform = ''; return; }
        /* progresso = quanto já rolou por dentro da seção */
        var progress = Math.max(0, -sec.getBoundingClientRect().top);
        track.style.transform = 'translateX(' + -Math.min(progress, maxTranslate()) + 'px)';
    }

    window.addEventListener('scroll', applyTranslate, { passive: true });
    window.addEventListener('resize', function () { updateHeight(); applyTranslate(); });
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { updateHeight(); applyTranslate(); });
    }
    /* exposto pro relocate do header forçar recálculo depois de mexer no DOM
       (mover o header muda o offsetLeft do último card). */
    window._dsFasesRecalc = function () { updateHeight(); applyTranslate(); };
    updateHeight();
    applyTranslate();

    /* entrada do trilho (opacity 0 + blur no CSS), como o .trocas-grid da home */
    if (window.IntersectionObserver) {
        new IntersectionObserver(function (entries, obs) {
            if (!entries[0].isIntersecting) return;
            track.classList.add('is-entered');
            obs.disconnect();
        }, { rootMargin: '0px 0px -15% 0px' }).observe(track);
    } else {
        track.classList.add('is-entered');
    }
})();

/* ── 2b) header inline no trilho ────────────────────────────────────────
   Mesma mecânica do .trocas-header/.mba-curriculum-header, mas valendo em todo
   desktop (>864 de largura), não só em altura baixa: o header sai do topo do
   palco e vira o "primeiro card" do trilho, liberando os 100dvh inteiros pros
   cards e dando ao próprio header um tempo na narrativa do scroll horizontal.
   No mobile, ele volta pro topo do palco. */
(function () {
    var stage = document.querySelector('.fases-stage');
    if (!stage) return;
    var track = stage.querySelector('.fases-track');
    var header = stage.querySelector('.fases-header') || document.querySelector('.fases-header');
    if (!track || !header) return;

    var mq = window.matchMedia('(min-width: 865px)');

    function relocate() {
        if (mq.matches) {
            if (header.parentNode !== track) {
                track.insertBefore(header, track.firstChild);
                header.classList.add('fases-header--inline');
            }
        } else if (header.parentNode !== stage) {
            stage.insertBefore(header, track);
            header.classList.remove('fases-header--inline');
        }
        if (typeof window._dsFasesRecalc === 'function') window._dsFasesRecalc();
    }

    relocate();
    if (mq.addEventListener) mq.addEventListener('change', relocate);
    else mq.addListener(relocate);
    window.addEventListener('orientationchange', relocate);
})();

/* ── 2c) reveal: --sec-fases-height pro sticky de offset negativo ────────
   Porte do IIFE de --sec-projetos-height do /ed/formacoes/script.js. O CSS
   (.fases-oport-track .sec-fases) precisa da altura REAL da seção em pixels pra
   montar top: calc(100dvh - altura). Aqui a altura é dupla-dinâmica: o próprio
   efeito horizontal a reescreve inline (100dvh + curso do trilho) a cada
   resize/font-load, e o curso muda com a largura. O ResizeObserver cobre isso
   sozinho; os listeners de viewport garantem atualização quando só o dvh muda
   (barra de endereço no mobile, rotação). */
(function () {
    var sec = document.querySelector('.fases-oport-track .sec-fases');
    if (!sec) return;

    function update() {
        sec.style.setProperty('--sec-fases-height', sec.offsetHeight + 'px');
    }

    update();

    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(update).observe(sec);
    }
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', update);
    }
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
})();

/* ── 3) cometa de partículas nos conectores do card Ecossistema.
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

/* ── 4) bagunca do hover nas fichas (composicao do squad) ─────────────────
   O deslocamento de base de cada ficha (--x/--y/--r) NAO mora mais aqui: ele foi
   sorteado uma vez e gravado literal no style de cada .time-stack-item no HTML,
   entao a bagunca e sempre a mesma e o layout nao se realoca a cada load. Cada
   uma das seis pastas ganhou o seu proprio conjunto de valores, entao elas
   continuam sem repetir a mesma bagunca lado a lado.
   O que sobrou pro JS e a parcela do hover, que por definicao muda a cada
   passada do mouse. */
(function () {
    var stacks = document.querySelectorAll('.time-stack');
    if (!stacks.length) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* parcela do hover: menor que a folga de fuga (a grade comeca 32px abaixo do
       topo do inner, que clipa), pra ficha nao ser decepada ao subir. */
    var H_X = 10, H_Y = 10, H_R = 8;

    /* sorteia a parcela de hover de todas as fichas da pasta, inclusive as das
       linhas alinhadas: no hover a bagunca vale pra grade inteira. */
    function sorteiaHover(stack) {
        Array.prototype.forEach.call(stack.children, function (el) {
            el.style.setProperty('--hx', ((Math.random() * 2 - 1) * H_X).toFixed(1) + 'px');
            el.style.setProperty('--hy', ((Math.random() * 2 - 1) * H_Y).toFixed(1) + 'px');
            el.style.setProperty('--hr', ((Math.random() * 2 - 1) * H_R).toFixed(1) + 'deg');
        });
    }

    Array.prototype.forEach.call(stacks, function (stack) {
        sorteiaHover(stack);
        var card = stack.closest('.time-card');
        if (card) card.addEventListener('mouseenter', function () { sorteiaHover(stack); });
    });
})();

/* ── 5) player dos cases ("O que falam sobre nós") ───────────────────────
   Player do YouTube com TODA a interface própria: play/pause e barra de
   reprodução vivem no .case-body, fora do vídeo, e o iframe sobe com controls: 0
   + pointer-events: none (ver data-squads.css). Quem manda no player é a IFrame
   API.

   Como funciona:
    - lazy: nada do YouTube carrega até o primeiro clique. Aí o script da API
      entra na página (uma vez só) e o .case-player de CADA card é substituído
      pelo seu iframe na hora em que ele é usado pela primeira vez. Clicar na
      barra antes disso também cria o player, guardando a fração pedida pra
      aplicar no onReady.
    - o ícone e o rótulo do botão saem do onStateChange, ou seja, do estado real
      do player, não de um boolean nosso. Assim continuam certos se o vídeo
      acabar, travar em buffering ou for pausado por fora.
    - a barra é currentTime/duration lido a 4Hz, e só enquanto ALGUM card toca: o
      intervalo nasce no primeiro play e morre quando nenhum está tocando.
    - dois players nunca tocam juntos: ao dar play num card, os outros pausam.
   O onYouTubeIframeAPIReady é global e único por página. Encadeio o handler que
   já existir (a página de aulas do ICIAN usa o mesmo callback) em vez de
   sobrescrever, e guardo os pedidos numa fila enquanto a API não respondeu. */
(function () {
    var sec = document.querySelector('.sec-cases');
    if (!sec) return;

    var PASSO = 5;             /* s por seta do teclado */
    var players = new Map();   /* box → YT.Player */
    var fila = [];             /* pedidos que chegaram antes da API */
    var pronta = false;
    var pedida = false;
    var relogio = null;        /* setInterval que pinta as barras */

    /* um registro por card: guarda os nós de uma vez, em vez de consultar o DOM
       a cada batida do relógio. */
    var regs = Array.prototype.map.call(
        sec.querySelectorAll('.case-video[data-vid]'),
        function (box) {
            var card = box.closest('.case-card');
            return {
                box: box,
                card: card,
                bar: card && card.querySelector('.case-bar'),
                fill: card && card.querySelector('.case-bar-fill'),
                cur: card && card.querySelector('.case-time-cur'),
                dur: card && card.querySelector('.case-time-dur'),
                botao: card && card.querySelector('.case-play'),
                arrastando: false,
                fracInicial: 0
            };
        }
    ).filter(function (r) { return r.card && r.bar && r.fill; });
    if (!regs.length) return;

    var porBox = new Map();
    regs.forEach(function (r) { porBox.set(r.box, r); });

    function carregaApi() {
        if (window.YT && window.YT.Player) { pronta = true; return; }
        if (pedida) return;
        pedida = true;
        var anterior = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
            if (typeof anterior === 'function') anterior();
            pronta = true;
            fila.forEach(function (fn) { fn(); });
            fila = [];
        };
        var script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
    }

    function tocando(estado) {
        return estado === YT.PlayerState.PLAYING || estado === YT.PlayerState.BUFFERING;
    }

    /* m:ss, virando h:mm:ss só quando passa da hora */
    function fmt(seg) {
        if (!isFinite(seg) || seg < 0) seg = 0;
        seg = Math.floor(seg);
        var h = Math.floor(seg / 3600);
        var m = Math.floor((seg % 3600) / 60);
        var s = seg % 60;
        var mm = h && m < 10 ? '0' + m : String(m);
        return (h ? h + ':' : '') + mm + ':' + (s < 10 ? '0' + s : s);
    }

    /* fracForcada existe pro seek pintar na hora, antes do player confirmar a
       nova posição (senão a barra volta pra posição antiga por um quadro). */
    function pinta(reg, fracForcada) {
        var player = players.get(reg.box);
        var duracao = player && player.getDuration ? player.getDuration() : 0;
        var atual = player && player.getCurrentTime ? player.getCurrentTime() : 0;
        var frac = typeof fracForcada === 'number' ? fracForcada
                 : (duracao > 0 ? atual / duracao : 0);
        frac = Math.min(1, Math.max(0, frac));
        /* scaleX via custom property: transform não dispara layout, então as 4
           atualizações por segundo custam só composição. */
        reg.fill.style.setProperty('--progresso', frac.toFixed(4));
        if (reg.cur) {
            reg.cur.textContent = fmt(typeof fracForcada === 'number' ? frac * duracao : atual);
        }
        if (reg.dur) reg.dur.textContent = fmt(duracao);
        reg.bar.setAttribute('aria-valuenow', Math.round(frac * 100));
    }

    function algumTocando() {
        return regs.some(function (r) {
            var p = players.get(r.box);
            return p && p.getPlayerState && tocando(p.getPlayerState());
        });
    }

    /* o relógio só existe enquanto tem vídeo rodando */
    function ajustaRelogio() {
        var ativo = algumTocando();
        if (ativo && !relogio) {
            relogio = setInterval(function () {
                regs.forEach(function (r) { if (!r.arrastando) pinta(r); });
            }, 250);
        } else if (!ativo && relogio) {
            clearInterval(relogio);
            relogio = null;
        }
    }

    function pausaOutros(atual) {
        players.forEach(function (player, box) {
            if (box === atual) return;
            if (player.pauseVideo) player.pauseVideo();
        });
    }

    function cria(reg) {
        var host = reg.box.querySelector('.case-player');
        if (!host || players.has(reg.box)) return;
        players.set(reg.box, new YT.Player(host, {
            /* 100% nos dois: o construtor grava esses valores como atributo
               width/height do iframe. Sem eles ele nasce 640x390 e não preenche
               a caixa, por mais que o CSS mande. */
            width: '100%',
            height: '100%',
            videoId: reg.box.dataset.vid,
            /* tudo desligado do que o YouTube desenha por conta própria:
               controls 0 (barra), modestbranding 1 (logo), rel 0 (sugeridos),
               fs 0 (tela cheia), disablekb 1 (teclado), iv_load_policy 3
               (anotações), cc_load_policy 0 (legenda automática). O resto da
               chrome (título, "assistir no YouTube") só aparece em hover, e o
               pointer-events: none do CSS impede o hover de existir. */
            playerVars: {
                controls: 0, modestbranding: 1, rel: 0, playsinline: 1,
                disablekb: 1, fs: 0, iv_load_policy: 3, cc_load_policy: 0,
                origin: location.origin
            },
            events: {
                onReady: function (e) {
                    pausaOutros(reg.box);
                    /* se o primeiro toque foi na barra, começa de onde pediram */
                    if (reg.fracInicial > 0) {
                        var d = e.target.getDuration();
                        if (d > 0) e.target.seekTo(d * reg.fracInicial, true);
                        reg.fracInicial = 0;
                    }
                    e.target.playVideo();
                    pinta(reg);
                },
                onStateChange: function (e) {
                    var ativo = tocando(e.data);
                    reg.card.classList.toggle('is-playing', ativo);
                    /* is-started tira o véu e NÃO volta no pause, só no fim:
                       pausar tem que deixar o frame à vista. */
                    if (e.data === YT.PlayerState.PLAYING) reg.card.classList.add('is-started');
                    if (reg.botao) reg.botao.setAttribute('aria-label', ativo ? 'Pausar' : 'Reproduzir');
                    if (ativo) pausaOutros(reg.box);
                    /* fim do vídeo: volta pro começo e repõe o véu antes que a
                       grade de vídeos sugeridos do YouTube apareça. */
                    if (e.data === YT.PlayerState.ENDED) {
                        e.target.seekTo(0, true);
                        e.target.pauseVideo();
                        reg.card.classList.remove('is-started');
                    }
                    pinta(reg);
                    ajustaRelogio();
                }
            }
        }));
    }

    /* cria o player se ainda não existe: na hora, se a API já respondeu, senão
       enfileira pro onYouTubeIframeAPIReady. */
    function garante(reg) {
        if (players.has(reg.box)) return;
        carregaApi();
        if (pronta) cria(reg);
        else fila.push(function () { cria(reg); });
    }

    function alterna(reg) {
        var player = players.get(reg.box);
        if (!player) { garante(reg); return; }
        /* getPlayerState só existe depois do onReady; antes dele o clique é ruído */
        if (!player.getPlayerState) return;
        if (tocando(player.getPlayerState())) player.pauseVideo();
        else { pausaOutros(reg.box); player.playVideo(); }
    }

    function fracDoPonteiro(reg, clientX) {
        var r = reg.bar.getBoundingClientRect();
        if (!r.width) return 0;
        return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    }

    function busca(reg, frac) {
        var player = players.get(reg.box);
        if (!player || !player.getDuration) {
            /* ainda sem player: guarda a fração, pinta otimista e deixa o
               onReady aplicar o seek. */
            reg.fracInicial = frac;
            pinta(reg, frac);
            garante(reg);
            return;
        }
        var d = player.getDuration();
        if (d > 0) player.seekTo(d * frac, true);
        pinta(reg, frac);
    }

    /* clique no botão OU na área do vídeo alterna. O vídeo funciona porque o
       iframe tem pointer-events: none e o clique atravessa pro .case-video. */
    sec.addEventListener('click', function (e) {
        var card = e.target.closest('.case-card');
        if (!card) return;
        if (!e.target.closest('.case-play') && !e.target.closest('.case-video')) return;
        var box = card.querySelector('.case-video[data-vid]');
        var reg = box && porBox.get(box);
        if (reg) alterna(reg);
    });

    /* barra: clique, arraste e teclado. Pointer Events cobre mouse e toque num
       caminho só, e o setPointerCapture mantém o arraste vivo mesmo com o cursor
       saindo da barra. */
    regs.forEach(function (reg) {
        reg.bar.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            reg.arrastando = true;
            if (reg.bar.setPointerCapture) {
                try { reg.bar.setPointerCapture(e.pointerId); } catch (err) {}
            }
            busca(reg, fracDoPonteiro(reg, e.clientX));
        });
        reg.bar.addEventListener('pointermove', function (e) {
            if (!reg.arrastando) return;
            busca(reg, fracDoPonteiro(reg, e.clientX));
        });
        function solta(e) {
            if (!reg.arrastando) return;
            reg.arrastando = false;
            if (reg.bar.releasePointerCapture && e.pointerId != null) {
                try { reg.bar.releasePointerCapture(e.pointerId); } catch (err) {}
            }
        }
        reg.bar.addEventListener('pointerup', solta);
        reg.bar.addEventListener('pointercancel', solta);

        reg.bar.addEventListener('keydown', function (e) {
            var player = players.get(reg.box);
            var d = player && player.getDuration ? player.getDuration() : 0;
            var t = player && player.getCurrentTime ? player.getCurrentTime() : 0;
            var frac = null;
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') frac = d > 0 ? (t + PASSO) / d : 0;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') frac = d > 0 ? (t - PASSO) / d : 0;
            else if (e.key === 'Home') frac = 0;
            else if (e.key === 'End') frac = 1;
            else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); alterna(reg); return; }
            if (frac === null) return;
            e.preventDefault();
            busca(reg, Math.min(1, Math.max(0, frac)));
        });
    });
})();

/* -- rotacao dos logos da faixa "Empresas que confiam na Xperiun" ---------
   Porte do bloco de rotacao do home.js / areas/script.js, mesma logica: 20 logos
   pra 12 slots, sorteio inicial e depois um swap a cada 700ms num slot aleatorio.
   O que o codigo protege:
   - imgToLogo rastreia qual logo esta em cada slot, e o pool de candidatos exclui
     todos os que ja estao na tela. Nunca aparecem dois logos iguais ao mesmo
     tempo.
   - visibleImgs() filtra por offsetHeight: nos tiers estreitos a grade achata as
     linhas que sobram (grid-auto-rows: 0px no CSS) e esses slots ficam de fora do
     sorteio, em vez de rodar invisiveis.
   - lastImg evita dois swaps seguidos no mesmo slot.
   - o swap so acontece quando o fade-out terminou (600ms, casando com a
     transition do CSS) E o proximo logo ja carregou (preload num new Image).
     Sem as duas condicoes o logo novo pisca antes de estar pronto. */
(function () {
    var logos = [
        { src: '/ed/site-dependencias/site-media/logos/logo-3m.webp',          alt: '3M' },
        { src: '/ed/site-dependencias/site-media/logos/logo-airliquide.webp',  alt: 'Air Liquide' },
        { src: '/ed/site-dependencias/site-media/logos/logo-ambev.webp',       alt: 'Ambev' },
        { src: '/ed/site-dependencias/site-media/logos/logo-bradesco.webp',    alt: 'Bradesco' },
        { src: '/ed/site-dependencias/site-media/logos/logo-cbf.webp',         alt: 'CBF' },
        { src: '/ed/site-dependencias/site-media/logos/logo-cielo.webp',       alt: 'Cielo' },
        { src: '/ed/site-dependencias/site-media/logos/logo-claro.webp',       alt: 'Claro' },
        { src: '/ed/site-dependencias/site-media/logos/logo-cpfl.webp',        alt: 'CPFL' },
        { src: '/ed/site-dependencias/site-media/logos/logo-globo.webp',       alt: 'Globo' },
        { src: '/ed/site-dependencias/site-media/logos/logo-google.webp',      alt: 'Google' },
        { src: '/ed/site-dependencias/site-media/logos/logo-inter.webp',       alt: 'Inter' },
        { src: '/ed/site-dependencias/site-media/logos/logo-magalu.webp',      alt: 'Magalu' },
        { src: '/ed/site-dependencias/site-media/logos/logo-mercedes.webp',    alt: 'Mercedes-Benz' },
        { src: '/ed/site-dependencias/site-media/logos/logo-natura.webp',      alt: 'Natura' },
        { src: '/ed/site-dependencias/site-media/logos/logo-neoway.webp',      alt: 'Neoway' },
        { src: '/ed/site-dependencias/site-media/logos/logo-piracanjuba.webp', alt: 'Piracanjuba' },
        { src: '/ed/site-dependencias/site-media/logos/logo-santander.webp',   alt: 'Santander' },
        { src: '/ed/site-dependencias/site-media/logos/logo-suzano.webp',      alt: 'Suzano' },
        { src: '/ed/site-dependencias/site-media/logos/logo-vale.webp',        alt: 'Vale' },
        { src: '/ed/site-dependencias/site-media/logos/sicoob.webp',           alt: 'Sicoob' }
    ];

    var grid = document.getElementById('depos-logos-grid');
    if (!grid) return;

    var imgs = Array.prototype.slice.call(grid.querySelectorAll('.depos-logo-card img'));
    var imgToLogo = new Map();

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    /* slot valendo = celula com altura. As linhas que a grade achata em 0px nos
       tiers estreitos caem fora daqui. */
    function visibleImgs() {
        return imgs.filter(function (img) {
            return img.closest('.depos-logo-card').offsetHeight > 0;
        });
    }

    function displayedLogos() {
        var arr = [];
        visibleImgs().forEach(function (img) {
            var l = imgToLogo.get(img);
            if (l) arr.push(l);
        });
        return arr;
    }

    function init() {
        var visible = visibleImgs();
        var inicial = shuffle(logos).slice(0, visible.length);
        visible.forEach(function (img, i) {
            img.src = inicial[i].src;
            img.alt = inicial[i].alt;
            img.style.opacity = '0.5';
            imgToLogo.set(img, inicial[i]);
        });
    }

    var lastImg = null;

    function tick() {
        var visible = visibleImgs();
        if (!visible.length) return;

        var candidatos = visible.length > 1
            ? visible.filter(function (i) { return i !== lastImg; })
            : visible;
        var img = candidatos[Math.floor(Math.random() * candidatos.length)];
        lastImg = img;

        var naTela = displayedLogos();
        var pool = logos.filter(function (l) { return naTela.indexOf(l) === -1; });
        if (!pool.length) return;
        var next = pool[Math.floor(Math.random() * pool.length)];

        /* marca antes do preload pros ticks seguintes ja enxergarem o destino e
           nao sortearem o mesmo logo pra outro slot. */
        imgToLogo.set(img, next);
        img.style.opacity = '0';

        var carregou = false, esperou = false;
        function conclui() {
            if (!carregou || !esperou) return;
            img.src = next.src;
            img.alt = next.alt;
            img.style.opacity = '0.5';
        }
        setTimeout(function () { esperou = true; conclui(); }, 600);
        var pre = new Image();
        pre.onload = pre.onerror = function () { carregou = true; conclui(); };
        pre.src = next.src;
    }

    init();
    setInterval(tick, 700);
})();

/* -- CTAs que abrem o popup do form -------------------------------------------
   Handler delegado em [data-open-popup]. O openPopup mora no form.js, que o
   form-include.js só injeta DEPOIS de buscar o HTML dos popups por fetch. Com o
   onclick inline no padrao `window.openPopup && window.openPopup(...)`, um clique
   antes disso encontra a funcao ainda undefined e nao faz nada, sem erro nenhum
   no console: o botao parece morto. Por isso aqui a gente espera a funcao existir
   em vez de testar uma vez so, e avisa no console se ela nunca aparecer. */
(function () {
    var PASSO = 100, TENTATIVAS = 50;   /* 5s de teto */

    function abrir(id, resta) {
        if (window.openPopup) { window.openPopup(id); return; }
        if (resta > 0) { setTimeout(function () { abrir(id, resta - 1); }, PASSO); return; }
        console.warn('[data-squads] openPopup nao carregou; ' + id + ' nao abriu. ' +
                     'Conferir se o form-include.js buscou o form-data-squads.html.');
    }

    document.addEventListener('click', function (e) {
        var alvo = e.target && e.target.closest ? e.target.closest('[data-open-popup]') : null;
        if (!alvo) return;
        e.preventDefault();
        abrir(alvo.getAttribute('data-open-popup'), TENTATIVAS);
    });
})();

/* -- barra fixa de CTA: recolhe no hero e na ultima secao ---------------------
   Mesma logica do bottom-cta.js do ICIAN: a barra fica escondida enquanto a
   primeira ou a ultima secao estao na tela, e aparece no meio da pagina, onde o
   usuario esta lendo conteudo e o CTA da secao nao esta a vista. */
(function () {
    var bar     = document.querySelector('.bottom-cta');
    var primeira = document.querySelector('.hero');
    var ultima   = document.querySelector('.sec-auto');
    if (!bar) return;

    /* sem IntersectionObserver a barra fica visivel, que e o estado util:
       melhor um CTA sempre a mao do que um que nunca aparece. */
    if (!('IntersectionObserver' in window) || (!primeira && !ultima)) {
        bar.classList.remove('is-hidden');
        return;
    }

    var vis = { primeira: false, ultima: false };
    function atualiza() { bar.classList.toggle('is-hidden', vis.primeira || vis.ultima); }

    var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].target === primeira)    vis.primeira = entries[i].isIntersecting;
            else if (entries[i].target === ultima) vis.ultima   = entries[i].isIntersecting;
        }
        atualiza();
    });
    if (primeira) io.observe(primeira);
    if (ultima)   io.observe(ultima);
})();

/* -- entrada de secao: mk-pilares, cards do time e elementos da sec-cases ------
   Mesmo padrao dos reveals que a pagina ja tem (.fases-track e .comp-grid): o CSS
   deixa o alvo em opacity 0 e o .is-entered dispara a keyframe. Aqui a marcacao
   vem deste bloco em vez do formacoes/script.js, que so observa uma lista fixa de
   seletores (.skills-grid, .conta-grid e afins) e nao inclui nenhum destes.

   Duas formas, como no script compartilhado:
   - bloco: o container inteiro entra de uma vez;
   - stagger: cada irmao entra com um atraso, na ordem em que CRUZA a viewport e
     nao na ordem do DOM, senao um card que entra na tela depois herda o atraso
     acumulado dos que ja passaram e demora demais pra aparecer.

   O rootMargin de -15% no fundo espera o elemento subir um pouco antes de
   disparar, senao a animacao acontece na borda da tela e o usuario nao a ve.
   Sob prefers-reduced-motion o bloco nem roda: quem devolve a visibilidade e o
   CSS, que zera a animacao e forca opacity 1 nesse modo. */
(function () {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var OPT = { rootMargin: '0px 0px -15% 0px' };

    function entra(el) { el.classList.add('is-entered'); }

    function bloco(seletor) {
        document.querySelectorAll(seletor).forEach(function (el) {
            if (!window.IntersectionObserver) { entra(el); return; }
            var obs = new IntersectionObserver(function (entries) {
                if (!entries[0].isIntersecting) return;
                obs.disconnect();
                entra(el);
            }, OPT);
            obs.observe(el);
        });
    }

    function stagger(seletor, passo) {
        var alvos = document.querySelectorAll(seletor);
        if (!window.IntersectionObserver) {
            Array.prototype.forEach.call(alvos, entra);
            return;
        }
        var i = 0;
        Array.prototype.forEach.call(alvos, function (el) {
            var obs = new IntersectionObserver(function (entries) {
                if (!entries[0].isIntersecting) return;
                obs.disconnect();
                var atraso = i * (passo || 80);
                i++;
                setTimeout(function () { entra(el); }, atraso);
            }, OPT);
            obs.observe(el);
        });
    }

    /* mk-pilares: o alvo e o .ds-squad, e nao a section. A section carrega o
       margin-top: -208px que a sobrepoe ao hero e o z-index: 2 que resolve a
       ordem: animar transform/filter nela mexeria nessa geometria durante a
       entrada. O .ds-squad e o conteudo, e o efeito visual e o mesmo. */
    bloco('.mk-pilares .ds-squad');

    /* 6 cards da composicao do squad (1 do Gestor + 5 modulos) */
    stagger('.sec-time .time-card-inner', 80);

    /* sec-cases: os 4 cards de video, os 2 cases de sucesso e a faixa de logos.
       Um seletor por grupo, com stagger dentro de cada um, pra faixa de logos nao
       herdar o atraso acumulado dos 6 cards acima dela. */
    stagger('.sec-cases .case-card', 80);
    stagger('.sec-cases .caso-card', 80);
    bloco('.sec-cases .depos-logos-section');

    /* autoqualificacao: o header (eyebrow + title + lede) ja e animado pelo
       formacoes/script.js, que observa esses tres seletores em qualquer pagina.
       O checklist e o fecho nao, porque sao classes proprias desta secao.
       A lista entra como bloco, e nao item por item: os cinco cenarios sao uma
       leitura unica ("se algum destes for familiar"), e escalonar faz o leitor
       comecar a ler antes do ultimo aparecer. */
    bloco('.sec-auto .auto-list');
    bloco('.sec-auto .auto-cta');
})();
