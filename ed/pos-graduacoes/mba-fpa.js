/* Recolhe .mba-sticky-cta quando .mba-hero OU .mba-offer estão
   visíveis na viewport (qualquer pixel). IntersectionObserver com
   threshold 0 — mantém set das sections atualmente intersecting;
   se >0 estão visíveis, adiciona .is-collapsed (transform translateY
   100%, recolhe pra baixo); se zero, remove. */
(function () {
    var sticky = document.querySelector('.mba-sticky-cta');
    var sections = document.querySelectorAll('.mba-hero, .mba-offer');
    if (!sticky || !sections.length || typeof IntersectionObserver === 'undefined') return;

    var visible = new Set();
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) visible.add(entry.target);
            else visible.delete(entry.target);
        });
        sticky.classList.toggle('is-collapsed', visible.size > 0);
    }, { threshold: 0 });

    sections.forEach(function (sec) { observer.observe(sec); });
})();

/* Gera partículas (4x4 e 2x2) que sobem infinitamente atrás da
   elipse do .mba-curriculum-stage. Cada partícula tem posição
   horizontal, duração, delay e opacidade aleatórios. */
(function () {
    var container = document.querySelector('.mba-curriculum-particles');
    if (!container) return;
    var COUNT_4 = 30;
    var COUNT_2 = 30;

    function spawn(size) {
        var p = document.createElement('span');
        p.className = 'mba-particle mba-particle--' + size;
        p.style.left = (Math.random() * 100) + '%';
        p.style.animationDuration = (10 + Math.random() * 15) + 's';
        p.style.animationDelay = (-Math.random() * 25) + 's';
        p.style.opacity = (0.2 + Math.random() * 0.6).toFixed(2);
        container.appendChild(p);
    }

    for (var i = 0; i < COUNT_4; i++) spawn(4);
    for (var j = 0; j < COUNT_2; j++) spawn(2);
})();

/* ── .mba-curriculum: scroll vertical → translateX horizontal nos cards
   Padrão idêntico ao sec-trocas da home (ed/site-dependencias/home.js:976-1020),
   adaptado pra usar window scroll em vez de #layer-trocas.
   .mba-curriculum tem altura = 100vh + maxTranslate; o .mba-curriculum-stage
   é sticky top: 0; quando o user scrolla pela section, o stage permanece
   visível e o grid de cards desliza horizontalmente. */
(function () {
    var sec  = document.querySelector('.mba-curriculum');
    var grid = document.querySelector('.mba-curriculum-grid');
    if (!sec || !grid) return;

    /* Apenas largura — touch detection (hover: none + pointer: coarse)
       foi removida porque DevTools Responsive Design Mode emula touch
       por default e quebrava o horizontal scroll em viewports desktop
       emuladas. O CSS @media já faz o switch visual por largura. */
    function isSmall() {
        return window.innerWidth < 865;
    }

    function maxTranslate() {
        if (isSmall()) return 0;
        /* Usa sec.clientWidth (não window.innerWidth) — clientWidth
           exclui scrollbar e bate com o que o CSS vê via 100vw/100%
           depois do overflow-x: clip no html. Sem isso, gap calculado
           ficava ligeiramente menor que o padding CSS real e o último
           card colava na direita. */
        var width = sec.clientWidth;
        var cards = grid.querySelectorAll('.mba-curriculum-card');
        if (!cards.length) return Math.max(0, grid.scrollWidth - width);
        var last = cards[cards.length - 1];
        var gap = Math.max(16, width / 2 - 688);
        return Math.max(0, last.offsetLeft + last.offsetWidth - (width - gap));
    }

    function updateHeight() {
        if (isSmall()) {
            sec.style.height = '';
            return;
        }
        sec.style.height = 'calc(100dvh + ' + maxTranslate() + 'px)';
    }

    function applyTranslate() {
        if (isSmall()) {
            grid.style.transform = '';
            return;
        }
        var rect = sec.getBoundingClientRect();
        /* progress = quanto já scrollou dentro da section */
        var progress = Math.max(0, -rect.top);
        var pos = Math.min(progress, maxTranslate());
        grid.style.transform = 'translateX(' + (-pos) + 'px)';
    }

    window.addEventListener('scroll', applyTranslate, { passive: true });
    window.addEventListener('resize', function () { updateHeight(); applyTranslate(); });
    /* Expõe pra IIFE de relocate-header forçar recalc após mover o
       header pra dentro do grid (muda offsetLeft do último card). */
    window._mbaCurriculumRecalc = function () { updateHeight(); applyTranslate(); };
    updateHeight();
    applyTranslate();
})();

/* Relocate .mba-curriculum-header pra dentro de .mba-curriculum-grid
   em viewport wide-short (vw > 864 + vh < 864) — vira "primeiro card"
   no scroll horizontal, libera a altura completa do stage pros cards
   reais. Em qualquer outro caso, header volta pro topo do stage. */
(function () {
    var stage  = document.querySelector('.mba-curriculum-stage');
    var grid   = document.querySelector('.mba-curriculum-grid');
    var header = document.querySelector('.mba-curriculum-header');
    if (!stage || !grid || !header) return;

    var mq = window.matchMedia('(min-width: 865px) and (max-height: 864px)');

    function relocate() {
        if (mq.matches) {
            if (header.parentNode !== grid) {
                grid.insertBefore(header, grid.firstChild);
                header.classList.add('mba-curriculum-header--inline');
                /* Spacer invisível ANTES do header — só existe
                   nessa viewport, removido quando sair do match. */
                var spacer = document.createElement('div');
                spacer.className = 'mba-curriculum-spacer';
                spacer.setAttribute('aria-hidden', 'true');
                grid.insertBefore(spacer, header);
            }
        } else {
            if (header.parentNode !== stage) {
                stage.insertBefore(header, grid);
                header.classList.remove('mba-curriculum-header--inline');
                var spacer = grid.querySelector('.mba-curriculum-spacer');
                if (spacer) spacer.parentNode.removeChild(spacer);
            }
        }
        if (typeof window._mbaCurriculumRecalc === 'function') {
            window._mbaCurriculumRecalc();
        }
    }

    relocate();
    if (mq.addEventListener) mq.addEventListener('change', relocate);
    else mq.addListener(relocate);
    window.addEventListener('orientationchange', relocate);
})();

/* Mede a altura do .mba-target-card:nth-child(4) e expõe via
   `--mba-card-4-h` em :root. Consumida na fórmula do sticky top
   do .mba-light-how-track .mba-light em viewports >576. */
(function () {
    var card4 = document.querySelector('.mba-target-card:nth-child(4)');
    if (!card4) return;
    function update() {
        document.documentElement.style.setProperty('--mba-card-4-h', card4.offsetHeight + 'px');
    }
    update();
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(update).observe(card4);
    }
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
})();

/* ── Reveal: .mba-how sobe sobre .mba-light ──
   Clone do padrão de ed/formacoes/script.js:600-619 (pilares-profs
   sobe sobre sec-projetos no f6), com ajuste na fórmula do top em
   >576: ver bloco CSS de `.mba-light-how-track .mba-light`. Esse
   IIFE atualiza --mba-light-height em tempo real. */
(function () {
    var sec = document.querySelector('.mba-light-how-track .mba-light');
    if (!sec) return;

    function update() {
        sec.style.setProperty('--mba-light-height', sec.offsetHeight + 'px');
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

/* Toggle entre faixas no .mba-gains: clique numa .mba-gains-tag
   (botão acima) OU numa .mba-gains-card-tag (top tag 01/02/03 dentro
   do card) ativa o card correspondente por índice. */
(function () {
    var tags  = document.querySelectorAll('.mba-gains-tag');
    var cards = document.querySelectorAll('.mba-gains-cards .mba-gains-card');
    if (!tags.length || !cards.length) return;

    function activate(idx) {
        tags.forEach(function (t) { t.classList.remove('is-active'); });
        cards.forEach(function (c) { c.classList.remove('is-active'); });
        if (tags[idx]) tags[idx].classList.add('is-active');
        if (cards[idx]) cards[idx].classList.add('is-active');
        /* Marca a top-tag correspondente dentro de CADA card como
           is-active (mantém visualmente sincronizado entre cards). */
        cards.forEach(function (card) {
            var topTags = card.querySelectorAll('.mba-gains-card-tag');
            topTags.forEach(function (tt, i) {
                tt.classList.toggle('is-active', i === idx);
            });
        });
    }

    tags.forEach(function (tag, idx) {
        tag.addEventListener('click', function () { activate(idx); });
    });

    /* Top tags (01/02/03 dentro do card) — clica → ativa faixa N. */
    document.querySelectorAll('.mba-gains-card-tag').forEach(function (topTag) {
        topTag.addEventListener('click', function () {
            var parent = topTag.parentNode;
            var idx = Array.prototype.indexOf.call(parent.children, topTag);
            if (idx >= 0) activate(idx);
        });
    });
})();

/* ── FAQ accordion (clone de formacoes/script.js:249-273) ──
   Clique em todo o .faq-row toggle de open + classe is-open no
   .faq-a-grid pra animação CSS via grid-template-rows. */
(function () {
    document.querySelectorAll('.mba-faq .faq-row').forEach(function (details) {
        var grid = details.querySelector('.faq-a-grid');
        var icon = details.querySelector('.faq-q-icon');
        details.addEventListener('click', function (e) {
            e.preventDefault();
            if (!details.open) {
                details.open = true;
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        grid.classList.add('is-open');
                        icon.textContent = 'remove';
                    });
                });
            } else {
                grid.classList.remove('is-open');
                icon.textContent = 'add';
                grid.addEventListener('transitionend', function () {
                    details.open = false;
                }, { once: true });
            }
        });
    });
})();

/* ── Reveal: .mba-offer sobe sobre .mba-gains ──
   Mesmo padrão dos outros sticky reveals. Mede .mba-gains.offsetHeight
   e expõe via --mba-gains-height. */
(function () {
    var sec = document.querySelector('.mba-gains-offer-track .mba-gains');
    if (!sec) return;

    function update() {
        sec.style.setProperty('--mba-gains-height', sec.offsetHeight + 'px');
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

/* ── Reveal: .mba-gains sobe sobre .mba-curriculum ──
   Mesmo padrão acima, medindo .mba-curriculum (altura dinâmica:
   o IIFE de horizontal scroll define sec.style.height = '100dvh +
   maxTranslate'). ResizeObserver capta essa mudança e expõe via
   --mba-curriculum-height. */
(function () {
    var sec = document.querySelector('.mba-curriculum-gains-track .mba-curriculum');
    if (!sec) return;

    function update() {
        sec.style.setProperty('--mba-curriculum-height', sec.offsetHeight + 'px');
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

/* Mouse parallax nas .mba-orb — desktop only. Mapeia posição do
   cursor relativa ao centro do hero pro range ±192px em cada eixo.
   CSS variables --mx/--my no .mba-hero são lidas pelas orbs no
   transform: translate(var(--mx), var(--my)) rotate(...). */
(function () {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var hero = document.querySelector('.mba-hero');
    if (!hero) return;

    var MAX = 192;
    var rafId = null;
    var targetX = 0, targetY = 0;

    function apply() {
        rafId = null;
        hero.style.setProperty('--mx', targetX + 'px');
        hero.style.setProperty('--my', targetY + 'px');
    }

    hero.addEventListener('mousemove', function (e) {
        var rect = hero.getBoundingClientRect();
        var halfW = rect.width / 2;
        var halfH = rect.height / 2;
        var dx = (e.clientX - rect.left - halfW) / halfW;  // -1 a 1
        var dy = (e.clientY - rect.top  - halfH) / halfH;  // -1 a 1
        /* Clamp e multiplica pelo MAX. dx/dy podem passar de ±1
           se mouse sair do bbox antes do mouseleave disparar. */
        targetX = Math.max(-1, Math.min(1, dx)) * MAX;
        targetY = Math.max(-1, Math.min(1, dy)) * MAX;
        if (rafId === null) rafId = requestAnimationFrame(apply);
    });

    hero.addEventListener('mouseleave', function () {
        targetX = 0;
        targetY = 0;
        if (rafId === null) rafId = requestAnimationFrame(apply);
    });
})();

/* Stripes dinâmicos no .mba-hero-stripes. flex:1 1 0 distribui width
   igualmente entre filhos, então só precisamos escolher a contagem
   certa pra cada stripe ficar entre MIN e MAX px. ResizeObserver
   re-roda em resize do hero (window resize, viewportvh changes etc). */
(function () {
    var stripes = document.querySelector('.mba-hero-stripes');
    if (!stripes) return;

    var MIN = 96;
    var MAX = 128;
    var TARGET = (MIN + MAX) / 2;
    var currentCount = -1;

    function pickCount(W) {
        if (W <= 0) return 0;
        /* Range válido: ceil(W/MAX) ≤ count ≤ floor(W/MIN). */
        var minCount = Math.ceil(W / MAX);
        var maxCount = Math.floor(W / MIN);
        if (maxCount >= minCount) {
            /* Meio do range → transição estável entre breakpoints. */
            return Math.floor((minCount + maxCount) / 2);
        }
        /* Range vazio (W em faixas tipo 129–191 onde 1 stripe > MAX
           mas 2 stripes < MIN). Fallback: o que chega mais perto. */
        return Math.max(1, Math.round(W / TARGET));
    }

    function update() {
        var W = stripes.clientWidth;
        var count = pickCount(W);
        if (count === currentCount) return;

        if (count > currentCount) {
            var frag = document.createDocumentFragment();
            for (var i = stripes.children.length; i < count; i++) {
                frag.appendChild(document.createElement('div'));
            }
            stripes.appendChild(frag);
        } else {
            while (stripes.children.length > count) {
                stripes.removeChild(stripes.lastChild);
            }
        }
        currentCount = count;
    }

    update();
    if (window.ResizeObserver) {
        new ResizeObserver(update).observe(stripes);
    } else {
        window.addEventListener('resize', update);
    }
})();

/* ═══════════════════════════════════════════════════════════
   Foil holográfico no card e-Mec/MEC (tilt 3D + overlay iridescente).
   Tilt via matrix3d (matemática portada de um componente de outra
   autoria); overlay = camada SVG sobre o card, cores nos tokens da
   marca. Card decorativo (aria-hidden) — efeito puramente visual.
   ═══════════════════════════════════════════════════════════ */
(function () {
    var host = document.querySelector('.mba-bridge-card');
    var fx = host && host.querySelector('.mba-bridge-fx');
    if (!host || !fx) return;

    var BLUR = 'mbaBridgeBlur';
    var ovGroups = '';
    for (var k = 0; k < 10; k++) {
        ovGroups += '<g class="mba-ov mba-ov-' + (k + 1) + '">'
            + '<polygon points="0,0 176,208 176,0 0,208" filter="url(#' + BLUR + ')" opacity="0.5"/>'
            + '</g>';
    }
    var ov = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ov.setAttribute('class', 'mba-bridge-overlay');
    ov.setAttribute('viewBox', '0 0 176 208');
    ov.setAttribute('preserveAspectRatio', 'none');
    ov.innerHTML = '<defs><filter id="' + BLUR + '"><feGaussianBlur in="SourceGraphic" stdDeviation="5"/></filter></defs>' + ovGroups;
    fx.appendChild(ov);

    var ovs = fx.querySelectorAll('.mba-ov');

    var identityMatrix = "1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1";
    var maxRotate = 0.25, minRotate = -0.25, maxScale = 1, minScale = 0.97;

    var matrix = identityMatrix, currentMatrix = identityMatrix, firstOverlayPosition = 0;
    var disableInOutOverlayAnimation = true, disableOverlayAnimation = false, isTimeoutFinished = false;
    var enterTimeout = null, leaveTimeout1 = null, leaveTimeout2 = null, leaveTimeout3 = null;

    function dims() {
        var r = host.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    }

    function getMatrix(clientX, clientY) {
        var d = dims(), left = d.left, right = d.right, top = d.top, bottom = d.bottom;
        var xCenter = (left + right) / 2, yCenter = (top + bottom) / 2;
        var scale = [
            maxScale - (maxScale - minScale) * Math.abs(xCenter - clientX) / (xCenter - left),
            maxScale - (maxScale - minScale) * Math.abs(yCenter - clientY) / (yCenter - top),
            maxScale - (maxScale - minScale) * (Math.abs(xCenter - clientX) + Math.abs(yCenter - clientY)) / (xCenter - left + yCenter - top)
        ];
        var rotate = {
            x1: 0.25 * ((yCenter - clientY) / yCenter - (xCenter - clientX) / xCenter),
            x2: maxRotate - (maxRotate - minRotate) * Math.abs(right - clientX) / (right - left),
            x3: 0, y0: 0,
            y2: maxRotate - (maxRotate - minRotate) * (top - clientY) / (top - bottom),
            y3: 0,
            z0: -(maxRotate - (maxRotate - minRotate) * Math.abs(right - clientX) / (right - left)),
            z1: (0.2 - (0.2 + 0.6) * (top - clientY) / (top - bottom)),
            z3: 0
        };
        return scale[0] + ", " + rotate.y0 + ", " + rotate.z0 + ", 0, "
            + rotate.x1 + ", " + scale[1] + ", " + rotate.z1 + ", 0, "
            + rotate.x2 + ", " + rotate.y2 + ", " + scale[2] + ", 0, "
            + rotate.x3 + ", " + rotate.y3 + ", " + rotate.z3 + ", 1";
    }

    function getOppositeMatrix(_matrix, clientY, onMouseEnter) {
        var d = dims(), top = d.top, bottom = d.bottom;
        var oppositeY = bottom - clientY + top;
        var weakening = onMouseEnter ? 0.7 : 4;
        var multiplier = onMouseEnter ? -1 : 1;
        return _matrix.split(", ").map(function (item, index) {
            if (index === 2 || index === 4 || index === 8) {
                return -parseFloat(item) * multiplier / weakening;
            } else if (index === 0 || index === 5 || index === 10) {
                return "1";
            } else if (index === 6) {
                return multiplier * (maxRotate - (maxRotate - minRotate) * (top - oppositeY) / (top - bottom)) / weakening;
            } else if (index === 9) {
                return (maxRotate - (maxRotate - minRotate) * (top - oppositeY) / (top - bottom)) / weakening;
            }
            return item;
        }).join(", ");
    }

    function applyMatrix() { fx.style.transform = 'perspective(700px) matrix3d(' + matrix + ')'; }
    function applyOverlay() {
        for (var i = 0; i < ovs.length; i++) {
            ovs[i].style.transform = 'rotate(' + (firstOverlayPosition + i * 10) + 'deg)';
            ovs[i].style.animation = disableOverlayAnimation ? 'none' : '';
            ovs[i].style.transition = disableInOutOverlayAnimation ? 'none' : 'transform 200ms ease-out';
        }
    }
    function setMatrix(m) { matrix = m; applyMatrix(); }
    function setCurrentMatrix(m) { currentMatrix = m; if (isTimeoutFinished) setMatrix(m); }
    function setFirstOverlayPosition(v) { firstOverlayPosition = v; applyOverlay(); }
    function setDisableOverlayAnimation(v) { disableOverlayAnimation = v; applyOverlay(); }
    function setDisableInOutOverlayAnimation(v) { disableInOutOverlayAnimation = v; applyOverlay(); }

    host.addEventListener('mouseenter', function (e) {
        clearTimeout(leaveTimeout1); clearTimeout(leaveTimeout2); clearTimeout(leaveTimeout3);
        setDisableOverlayAnimation(true);
        var d = dims(), xCenter = (d.left + d.right) / 2, yCenter = (d.top + d.bottom) / 2;
        var cx = e.clientX, cy = e.clientY;
        setDisableInOutOverlayAnimation(false);
        enterTimeout = setTimeout(function () { setDisableInOutOverlayAnimation(true); }, 350);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                setFirstOverlayPosition((Math.abs(xCenter - cx) + Math.abs(yCenter - cy)) / 1.5);
            });
        });
        setMatrix(getOppositeMatrix(getMatrix(cx, cy), cy, true));
        isTimeoutFinished = false;
        setTimeout(function () { isTimeoutFinished = true; setMatrix(currentMatrix); }, 200);
    });

    host.addEventListener('mousemove', function (e) {
        var d = dims(), xCenter = (d.left + d.right) / 2, yCenter = (d.top + d.bottom) / 2;
        var cx = e.clientX, cy = e.clientY;
        setTimeout(function () { setFirstOverlayPosition((Math.abs(xCenter - cx) + Math.abs(yCenter - cy)) / 1.5); }, 150);
        if (isTimeoutFinished) setCurrentMatrix(getMatrix(cx, cy));
    });

    host.addEventListener('mouseleave', function (e) {
        clearTimeout(enterTimeout);
        setCurrentMatrix(getOppositeMatrix(matrix, e.clientY, false));
        setTimeout(function () { setCurrentMatrix(identityMatrix); }, 200);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                setDisableInOutOverlayAnimation(false);
                leaveTimeout1 = setTimeout(function () { setFirstOverlayPosition(-firstOverlayPosition / 4); }, 150);
                leaveTimeout2 = setTimeout(function () { setFirstOverlayPosition(0); }, 300);
                leaveTimeout3 = setTimeout(function () {
                    setDisableOverlayAnimation(false);
                    setDisableInOutOverlayAnimation(true);
                }, 500);
            });
        });
    });

    applyOverlay();
})();
