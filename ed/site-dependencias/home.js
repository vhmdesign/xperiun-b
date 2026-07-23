(function () {
    var inner = document.querySelector('.hero-inner');
    var h1    = document.querySelector('.hero-h1');
    var p     = document.querySelector('.hero-p');
    var items = Array.from(document.querySelectorAll('.hero-list li'));
    var btn   = document.getElementById('btn-conhecer');

    /* Mobile: cancela o blur passando 'none' em vez de 'blur(Npx)' — JS
       continua setando filter em todas as etapas (a animação completa
       normalmente), só que com valor neutro. Evita o caso de o JS pular
       um set e deixar o elemento preso no blur do CSS default. */
    var IS_MOBILE = window.matchMedia('(hover: none) and (pointer: coarse)').matches
                 || window.innerWidth < 865;
    function blur(px) { return IS_MOBILE ? 'none' : 'blur(' + px + 'px)'; }

    var animQueue = [];
    function later(fn, ms) { animQueue.push(setTimeout(fn, ms)); }

    /* reveal simples: translateY/X + blur + opacity, 0.5s */
    var T = IS_MOBILE
        ? 'opacity 0.5s ease, transform 0.5s ease'
        : 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';
    function reveal(el, axis, clearAfter) {
        el.style.transition = T;
        el.style.opacity    = '1';
        el.style.filter     = blur(0);
        el.style.transform  = axis === 'x' ? 'translateX(0)' : 'translateY(0)';
        if (clearAfter) setTimeout(function () { el.style.transition = ''; }, 500);
    }

    /* word-by-char — máscara de gradiente fica no h1, spans só animam opacity/filter/transform */
    function revealCharsEntry(el, stagger) {
        var ms = stagger || 10;
        var spans = [];
        function walk(node) {
            if (node.nodeType === 3) {
                var text = node.textContent;
                if (!text) return;
                var frag = document.createDocumentFragment();
                var i = 0;
                while (i < text.length) {
                    if (/\s/.test(text[i])) {
                        frag.appendChild(document.createTextNode(text[i]));
                        i++;
                    } else {
                        var j = i;
                        while (j < text.length && !/\s/.test(text[j])) j++;
                        var word = document.createElement('span');
                        word.className = 'word-nowrap';
                        for (var k = i; k < j; k++) {
                            var sp = document.createElement('span');
                            sp.textContent = text[k];
                            word.appendChild(sp);
                            spans.push(sp);
                        }
                        frag.appendChild(word);
                        i = j;
                    }
                }
                node.parentNode.replaceChild(frag, node);
            } else if (node.nodeType === 1) {
                Array.from(node.childNodes).forEach(walk);
            }
        }
        Array.from(el.childNodes).forEach(walk);
        spans.forEach(function (sp) {
            sp.style.display    = 'inline-block';
            sp.style.opacity    = '0';
            sp.style.filter     = blur(8);
            sp.style.transform  = 'translateY(32px)';
            sp.style.transition = T;
        });
        spans.forEach(function (sp, idx) {
            later(function () {
                sp.style.opacity   = '1';
                sp.style.filter    = blur(0);
                sp.style.transform = 'translateY(0)';
            }, idx * ms);
        });
        return spans.length;
    }

    /* inner: blur → limpa. Em mobile blur(N) vira 'none' (canceled). */
    inner.style.transition = 'none';
    inner.style.opacity    = '0';
    inner.style.filter     = blur(64);
    void inner.offsetWidth;
    later(function () {
        inner.style.transition = IS_MOBILE
            ? 'opacity 1s ease'
            : 'opacity 1s ease, filter 1s ease';
        inner.style.opacity    = '1';
        inner.style.filter     = blur(0);
    }, 0);

    /* Sequência: h1 (char-by-char, 0.5s/char) → +250ms → p (0.5s) → +250ms → btn + li */
    later(function () {
        revealCharsEntry(h1, 10);
        h1.style.opacity = '1'; /* h1 visível; spans ainda opacity:0 */

        /* p: 250ms após h1 começar */
        later(function () {
            reveal(p, 'y');

            /* btn e li: 250ms após p começar */
            var AFTER_P = 250;
            later(function () { reveal(btn, 'y', true); }, AFTER_P);
            items.forEach(function (li, i) {
                later(function () { reveal(li, 'x'); }, AFTER_P + i * 250);
            });
        }, 250);
    }, 600);
})();

(function () {
    /* layer management */
    var reduced   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var touchOnly = 'ontouchstart' in window && !window.matchMedia('(pointer: fine)').matches;

    var layerHero    = document.getElementById('layer-hero');
    var layerContent = document.getElementById('layer-content');
    var layerTrocas  = document.getElementById('layer-trocas');

    var inHero = true, fading = false;
    var FADE   = 700;
    var EASE = 0.12, THR = 0.5;

    /* ── Lerp layer-content scroll ──────────────────────────── */
    var lCur = 0, lTgt = 0, lRaf = null;

    function lerpTick() {
        var diff = lTgt - lCur;
        if (Math.abs(diff) < THR) {
            lCur = lTgt; layerContent.scrollTop = lCur; lRaf = null; return;
        }
        lCur += diff * EASE;
        layerContent.scrollTop = lCur;
        lRaf = requestAnimationFrame(lerpTick);
    }

    function moveContent(dy) {
        var max = layerContent.scrollHeight - layerContent.clientHeight;
        lTgt = Math.max(0, Math.min(lTgt + dy, max));
        if (!lRaf) { lCur = layerContent.scrollTop; lRaf = requestAnimationFrame(lerpTick); }
    }

    /* ── Trocas reveal: scroll-driven com lerp visual ──────────── */
    /* tTgt: alvo acumulado pelo scroll do usuário   [0, innerHeight] */
    /* tCur: posição visual que lerpa suavemente até tTgt            */
    var tCur = 0, tTgt = 0, tRaf = null;
    var trocasTitleFired = false;

    function applyTrocasPos() {
        var p = tCur / window.innerHeight;
        layerTrocas.style.transform = 'translateY(' + ((1 - p) * 100) + '%)';
        layerTrocas.style.pointerEvents = p >= 1 ? 'auto' : 'none';
        if (tTgt >= window.innerHeight && !trocasTitleFired) {
            trocasTitleFired = true;
            if (window._startTrocasTitleAnim) window._startTrocasTitleAnim();
            var grid = document.querySelector('.trocas-grid');
            if (grid) grid.classList.add('is-entered');
        }
        if (window._updateDots) window._updateDots();
        if (window._updateManifestoScale) window._updateManifestoScale();
    }

    function tLerpTick() {
        var diff = tTgt - tCur;
        if (Math.abs(diff) < 0.5) {
            tCur = tTgt; applyTrocasPos(); tRaf = null; return;
        }
        tCur += diff * EASE;
        applyTrocasPos();
        tRaf = requestAnimationFrame(tLerpTick);
    }

    /* acumula delta do scroll no alvo; visual lerpa até lá */
    function addTOver(delta) {
        tTgt = Math.max(0, Math.min(window.innerHeight, tTgt + delta));
        if (!tRaf) tRaf = requestAnimationFrame(tLerpTick);
    }

    /* Versão pra touch: tCur acompanha tTgt em 1:1 (sem lerp). Necessária
       porque o lerp (EASE 0.12) atrasa o visual ~88% por frame, fazendo o
       gesto parecer pesado/resistente. No touchend o snap volta a usar
       lerp pra animar suavemente até 0 ou innerHeight. */
    function addTOverImmediate(delta) {
        tTgt = Math.max(0, Math.min(window.innerHeight, tTgt + delta));
        tCur = tTgt;
        if (tRaf) { cancelAnimationFrame(tRaf); tRaf = null; }
        applyTrocasPos();
    }

    function getTProgress() { return tCur / window.innerHeight; } /* 0=hidden, 1=shown, visual */
    function getTIntent()   { return tTgt / window.innerHeight; } /* intenção atual do scroll  */

    /* ── Resistência de saída do content ───────────────────────── */
    /* trocas só inicia depois de EXIT_THR px acumulados no fundo  */
    var EXIT_THR  = 320;
    var exitAccum = 0;
    var secExitCount = 0, SEC_EXIT_EVENTS = 4;

    function showTrocas() { tTgt = window.innerHeight; if (!tRaf) tRaf = requestAnimationFrame(tLerpTick); }
    function hideTrocas() {
        tTgt = 0; tCur = 0;
        if (tRaf) { cancelAnimationFrame(tRaf); tRaf = null; }
        ltTgt = 0; ltCur = 0;
        if (ltRaf) { cancelAnimationFrame(ltRaf); ltRaf = null; }
        layerTrocas.scrollTop = 0;
        exitAccum = 0;
        secExitCount = 0;
        applyTrocasPos();
    }

    /* ── Lerp scroll interno de layer-trocas ─────────────────── */
    var ltCur = 0, ltTgt = 0, ltRaf = null;

    function ltLerpTick() {
        var diff = ltTgt - ltCur;
        if (Math.abs(diff) < THR) {
            ltCur = ltTgt; layerTrocas.scrollTop = ltCur; ltRaf = null; return;
        }
        ltCur += diff * EASE;
        layerTrocas.scrollTop = ltCur;
        ltRaf = requestAnimationFrame(ltLerpTick);
    }

    function moveTrocasContent(dy) {
        /* max = scroll total do layer (inclui sec-cinco); a posição visual dos cards
           é clampeada separadamente em applyTranslate() no máximo dos cards */
        var max = Math.max(0, layerTrocas.scrollHeight - layerTrocas.clientHeight);
        ltTgt = Math.max(0, Math.min(ltTgt + dy, max));
        if (!ltRaf) { ltCur = layerTrocas.scrollTop; ltRaf = requestAnimationFrame(ltLerpTick); }
    }

    /* ── Transições hero / content ──────────────────────────── */
    function goToContent() {
        if (fading || !inHero) return;
        fading = true; inHero = false;
        layerHero.classList.add('is-out');
        layerContent.classList.add('is-in');
        setTimeout(function () { fading = false; }, FADE);
    }

    function goToHero() {
        if (fading || inHero) return;
        fading = true; inHero = true;
        lTgt = 0; lCur = 0; layerContent.scrollTop = 0;
        exitAccum = 0;
        layerHero.classList.remove('is-out');
        layerContent.classList.remove('is-in');
        setTimeout(function () { fading = false; }, FADE);
    }

    function scrollToTop(top) {
        if (inHero) return;
        lTgt = top;
        if (!lRaf) { lCur = layerContent.scrollTop; lRaf = requestAnimationFrame(lerpTick); }
    }

    function scrollTrocasTo(top) {
        var max = Math.max(0, layerTrocas.scrollHeight - layerTrocas.clientHeight);
        ltTgt = Math.max(0, Math.min(top, max));
        if (!ltRaf) { ltCur = layerTrocas.scrollTop; ltRaf = requestAnimationFrame(ltLerpTick); }
    }

    /* ── API pública ────────────────────────────────────────── */
    window._home = {
        goToContent: goToContent, goToHero: goToHero, scrollToTop: scrollToTop,
        scrollTrocasTo: scrollTrocasTo,
        showTrocas: showTrocas, hideTrocas: hideTrocas,
        getInHero:  function () { return inHero;        },
        getFading:  function () { return fading;        },
        getTCur:    function () { return getTProgress(); }, /* 0=hidden, 1=shown */
        FADE: FADE
    };

    /* ── Botão hero ─────────────────────────────────────────── */
    var btnConhecer = document.getElementById('btn-conhecer');
    if (btnConhecer) btnConhecer.addEventListener('click', goToContent);

    /* ── Wheel ──────────────────────────────────────────────── */
    if (!touchOnly) {
        window.addEventListener('wheel', function (e) {
            var dy = e.deltaY;
            if (e.deltaMode === 1) dy *= 40;
            if (e.deltaMode === 2) dy *= window.innerHeight;
            e.preventDefault();

            /* roteamento usa a intenção (tTgt), não o visual (tCur) */
            var pi = getTIntent();

            /* trocas alvo totalmente visível — aguarda reveal completar antes de mover cards */
            if (pi >= 1) {
                if (getTProgress() < 1) return;
                if (dy < 0) {
                    secExitCount = 0;
                    if (layerTrocas.scrollTop <= 1) { addTOver(dy); return; }
                    moveTrocasContent(dy);
                    return;
                }
                /* dy > 0: cap card scroll at maxTranslate; requer N eventos para liberar sec-cinco */
                var cardMax = window._trocasMax ? window._trocasMax() : 0;
                if (ltTgt < cardMax) {
                    moveTrocasContent(Math.min(dy, cardMax - ltTgt));
                    return;
                }
                if (ltTgt - cardMax < 1) {
                    secExitCount++;
                    if (secExitCount < SEC_EXIT_EVENTS) return;
                }
                moveTrocasContent(dy);
                return;
            }

            /* trocas em transição */
            if (pi > 0) { addTOver(dy); return; }

            /* trocas oculta: lógica normal hero / content */
            if (inHero) {
                if (dy > 0 && !fading) goToContent();
                return;
            }

            /* bloqueia scroll de conteúdo durante transição hero ↔ content */
            if (fading) return;

            if (dy < 0 && lTgt <= 1 && layerContent.scrollTop <= 1) { goToHero(); return; }

            var cMax = layerContent.scrollHeight - layerContent.clientHeight;
            if (dy > 0 && lTgt >= cMax - 1) {
                exitAccum += dy;
                if (exitAccum >= EXIT_THR) addTOver(dy);
                return;
            }
            /* scroll para cima drena o acumulador antes de mover o content */
            if (dy < 0 && exitAccum > 0) { exitAccum = Math.max(0, exitAccum + dy); return; }

            moveContent(dy);
        }, { passive: false });
    }

    /* ── Teclado ────────────────────────────────────────────── */
    window.addEventListener('keydown', function (e) {
        var tag = document.activeElement && document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        var LINE = 120, PAGE = window.innerHeight * 0.88;
        var pi = getTIntent();

        if (pi >= 1) {
            switch (e.key) {
                case 'ArrowDown': e.preventDefault(); moveTrocasContent(LINE); break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (layerTrocas.scrollTop <= 1) addTOver(-LINE); else moveTrocasContent(-LINE);
                    break;
                case 'PageDown': e.preventDefault(); moveTrocasContent(PAGE); break;
                case 'PageUp':
                    e.preventDefault();
                    if (layerTrocas.scrollTop <= 1) addTOver(-PAGE); else moveTrocasContent(-PAGE);
                    break;
                case ' ':
                    e.preventDefault();
                    if (e.shiftKey) { if (layerTrocas.scrollTop <= 1) addTOver(-PAGE); else moveTrocasContent(-PAGE); }
                    else moveTrocasContent(PAGE);
                    break;
            }
            return;
        }

        if (pi > 0) {
            switch (e.key) {
                case 'ArrowDown': case 'PageDown': e.preventDefault(); addTOver(LINE); break;
                case 'ArrowUp':   case 'PageUp':   e.preventDefault(); addTOver(-LINE); break;
                case ' ':
                    e.preventDefault();
                    addTOver(e.shiftKey ? -PAGE : PAGE);
                    break;
            }
            return;
        }

        if (inHero) {
            if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
                e.preventDefault(); goToContent();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); moveContent(LINE);  break;
            case 'ArrowUp':
                e.preventDefault();
                if (lTgt <= 1) goToHero(); else moveContent(-LINE);
                break;
            case 'PageDown': e.preventDefault(); moveContent(PAGE);   break;
            case 'PageUp':
                e.preventDefault();
                if (lTgt <= 1) goToHero(); else moveContent(-PAGE);
                break;
            case ' ':
                e.preventDefault();
                if (e.shiftKey) { if (lTgt <= 1) goToHero(); else moveContent(-PAGE); }
                else moveContent(PAGE);
                break;
            case 'Home':
                e.preventDefault();
                lTgt = 0;
                if (!lRaf) { lCur = layerContent.scrollTop; lRaf = requestAnimationFrame(lerpTick); }
                break;
            case 'End':
                e.preventDefault();
                lTgt = layerContent.scrollHeight - layerContent.clientHeight;
                if (!lRaf) { lCur = layerContent.scrollTop; lRaf = requestAnimationFrame(lerpTick); }
                break;
        }
    });

    /* ── Touch ──────────────────────────────────────────────── */
    var tY0 = 0, tY1 = 0;
    window.addEventListener('touchstart', function (e) {
        tY0 = e.touches[0].clientY; tY1 = tY0;
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
        var y = e.touches[0].clientY;
        var dy = tY1 - y;
        tY1 = y;
        var pi = getTIntent();
        if (pi > 0 && pi < 1) { addTOverImmediate(dy); return; }
        if (pi >= 1) {
            if (dy < 0 && layerTrocas.scrollTop <= 0) { addTOverImmediate(dy); return; }
            /* scroll para trás / frente nos cards: nativo no touch */
            return;
        }
        /* pi === 0: dentro do content. Se user puxa pra baixo no topo,
           dispara goToHero IMEDIATAMENTE (sem threshold / sem esperar
           touchend). totalDy = tY0 - y < 0 significa dedo desceu. */
        if (!inHero && !fading && layerContent.scrollTop <= 0 && (tY0 - y) < 0) {
            goToHero();
            return;
        }
    }, { passive: true });

    window.addEventListener('touchend', function (e) {
        var totalDy = tY0 - e.changedTouches[0].clientY;
        var pi = getTIntent();

        /* Snap se parou no meio da transição: usa DIREÇÃO do gesto, não
           threshold de progresso. Pull-down (totalDy < 0) commita pra
           esconder trocas; pull-up commita pra mostrar. Antes era
           `pi >= 0.5 ? innerHeight : 0` que exigia >50% de pull-down pra
           sair — sensação de resistência alta no mobile. */
        if (pi > 0 && pi < 1) {
            tTgt = totalDy < 0 ? 0 : window.innerHeight;
            if (!tRaf) tRaf = requestAnimationFrame(tLerpTick);
            return;
        }

        if (pi === 0) {
            if (totalDy > 40  && inHero  && !fading) { goToContent(); return; }
            /* fallback caso o touchmove não tenha pego (ex: dedo levantado
               muito rápido). Sem threshold de 40px — qualquer pull-down no
               topo volta pro hero. */
            if (totalDy < 0 && !inHero && layerContent.scrollTop <= 0 && !fading) { goToHero(); return; }
            var cMax = layerContent.scrollHeight - layerContent.clientHeight;
            if (totalDy > 40 && !inHero && lTgt >= cMax - 1) showTrocas();
        }
    }, { passive: true });

    layerContent.addEventListener('scroll', function () {
        if (!lRaf) { lTgt = layerContent.scrollTop; lCur = layerContent.scrollTop; }
    }, { passive: true });

    layerTrocas.addEventListener('scroll', function () {
        if (!ltRaf) { ltTgt = layerTrocas.scrollTop; ltCur = layerTrocas.scrollTop; }
    }, { passive: true });

})();

/* ── Animações: typing de código + chart de barras ─────────────────── */
(function () {
    var lc = document.getElementById('layer-content');
    if (!lc) return;

    /* ── Typing do código ──────────────────────────────────────────── */
    function startCodeTyping() {
        var pre = document.querySelector('.tese-codeblock-body');
        if (!pre) return;

        var cb = document.querySelector('.tese-codeblock');
        if (cb) { cb.style.opacity = '1'; cb.style.transform = 'translateY(0)'; }

        /* Congela a altura do block-wrap ANTES de limpar o pre,
           para que o flex não redimensione durante a digitação */
        var wrap = document.querySelector('.tese-card--code .tese-block-wrap');
        if (wrap) {
            wrap.style.height = wrap.offsetHeight + 'px';
            wrap.style.flex   = 'none';
        }

        /* Achata o DOM em [{ch, cls}], preservando classes dos spans */
        var tokens = [];
        (function walk(node, cls) {
            if (node.nodeType === 3) {
                for (var i = 0; i < node.textContent.length; i++) {
                    tokens.push({ ch: node.textContent[i], cls: cls });
                }
            } else if (node.nodeType === 1) {
                var c = node.className || null;
                node.childNodes.forEach(function (n) { walk(n, c); });
            }
        })(pre, null);

        pre.innerHTML = '';
        var idx = 0, lastCls = null, lastSpan = null;

        function tick() {
            if (idx >= tokens.length) return;
            var tok = tokens[idx++];
            var ch = tok.ch, cls = tok.cls;

            /* Quebra o span corrente ao mudar de classe ou na newline */
            if (ch === '\n' || cls !== lastCls) { lastSpan = null; lastCls = null; }

            if (ch === '\n') {
                pre.appendChild(document.createTextNode('\n'));
            } else {
                if (!lastSpan && cls) {
                    lastSpan = document.createElement('span');
                    lastSpan.className = cls;
                    pre.appendChild(lastSpan);
                    lastCls = cls;
                }
                (lastSpan || pre).appendChild(document.createTextNode(ch));
            }

            /* Line numbers: rápido. Espaços: instantâneo. Código: deliberado */
            var delay = cls === 'tese-ln' ? 6 : /\s/.test(ch) ? 3 : 18;
            setTimeout(tick, delay);
        }

        tick();
    }

    /* ── Animação das barras do chart ─────────────────────────────── */
    function startChartAnim() {
        var bars    = Array.from(document.querySelectorAll('.tese-bizblock-chart > span'));
        var caption = document.querySelector('.tese-bizblock-caption');
        if (!bars.length) return;

        var bb = document.querySelector('.tese-bizblock');
        if (bb) { bb.style.opacity = '1'; bb.style.transform = 'translateY(0)'; }

        /* Estado inicial: zero altura e invisível */
        bars.forEach(function (b) { b.style.height = '0'; b.style.opacity = '0'; });
        if (caption) { caption.style.opacity = '0'; caption.style.transform = 'translateY(-32px)'; }

        /* Enche cada barra sequencialmente */
        var INTERVAL = 120; /* ms entre o início de cada barra */
        bars.forEach(function (b, i) {
            setTimeout(function () {
                b.style.height  = 'var(--h)';
                b.style.opacity = '1';
            }, i * INTERVAL);
        });

        /* Caption entra após a última barra completar a transição */
        setTimeout(function () {
            if (caption) { caption.style.opacity = '1'; caption.style.transform = 'translateY(0)'; }
        }, (bars.length - 1) * INTERVAL + 600);
    }

    /* ── Animação char-by-char do título ──────────────────────────────── */
    function startTitleAnim() {
        var el = document.querySelector('.tese-title');
        if (!el) return;
        var T = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';
        var spans = [];
        function walk(node) {
            if (node.nodeType === 3) {
                var text = node.textContent;
                if (!text) return;
                var frag = document.createDocumentFragment();
                var i = 0;
                while (i < text.length) {
                    if (/\s/.test(text[i])) {
                        frag.appendChild(document.createTextNode(text[i]));
                        i++;
                    } else {
                        var j = i;
                        while (j < text.length && !/\s/.test(text[j])) j++;
                        var word = document.createElement('span');
                        word.className = 'word-nowrap';
                        for (var k = i; k < j; k++) {
                            var sp = document.createElement('span');
                            sp.textContent = text[k];
                            word.appendChild(sp);
                            spans.push(sp);
                        }
                        frag.appendChild(word);
                        i = j;
                    }
                }
                node.parentNode.replaceChild(frag, node);
            } else if (node.nodeType === 1) {
                Array.from(node.childNodes).forEach(walk);
            }
        }
        Array.from(el.childNodes).forEach(walk);
        spans.forEach(function (sp) {
            sp.style.display    = 'inline-block';
            sp.style.opacity    = '0';
            sp.style.filter     = 'blur(8px)';
            sp.style.transform  = 'translateY(32px)';
            sp.style.transition = T;
        });
        var eyebrow = document.querySelector('.tese-eyebrow');
        if (eyebrow) { eyebrow.style.opacity = '1'; eyebrow.style.filter = 'blur(0)'; eyebrow.style.transform = 'translateY(0)'; }
        el.style.opacity = '1';
        spans.forEach(function (sp, idx) {
            setTimeout(function () {
                sp.style.opacity   = '1';
                sp.style.filter    = 'blur(0)';
                sp.style.transform = 'translateY(0)';
            }, idx * 10);
        });
    }

    function startTrocasTitleAnim() {
        var el = document.querySelector('.trocas-title');
        if (!el) return;
        var T = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';
        var spans = [];
        function walk(node) {
            if (node.nodeType === 3) {
                var text = node.textContent;
                if (!text) return;
                var frag = document.createDocumentFragment();
                var i = 0;
                while (i < text.length) {
                    if (/\s/.test(text[i])) {
                        frag.appendChild(document.createTextNode(text[i]));
                        i++;
                    } else {
                        var j = i;
                        while (j < text.length && !/\s/.test(text[j])) j++;
                        var word = document.createElement('span');
                        word.className = 'word-nowrap';
                        for (var k = i; k < j; k++) {
                            var sp = document.createElement('span');
                            sp.textContent = text[k];
                            word.appendChild(sp);
                            spans.push(sp);
                        }
                        frag.appendChild(word);
                        i = j;
                    }
                }
                node.parentNode.replaceChild(frag, node);
            } else if (node.nodeType === 1) {
                Array.from(node.childNodes).forEach(walk);
            }
        }
        Array.from(el.childNodes).forEach(walk);
        spans.forEach(function (sp) {
            sp.style.display    = 'inline-block';
            sp.style.opacity    = '0';
            sp.style.filter     = 'blur(8px)';
            sp.style.transform  = 'translateY(32px)';
            sp.style.transition = T;
        });
        var trocasEyebrow = document.querySelector('.trocas-eyebrow');
        if (trocasEyebrow) { trocasEyebrow.style.opacity = '1'; trocasEyebrow.style.filter = 'blur(0)'; trocasEyebrow.style.transform = 'translateY(0)'; }
        el.style.opacity = '1';
        spans.forEach(function (sp, idx) {
            setTimeout(function () {
                sp.style.opacity   = '1';
                sp.style.filter    = 'blur(0)';
                sp.style.transform = 'translateY(0)';
            }, idx * 10);
        });
        var trocasLede = document.querySelector('.trocas-lede');
        if (trocasLede) {
            setTimeout(function () {
                trocasLede.style.opacity   = '1';
                trocasLede.style.filter    = 'blur(0)';
                trocasLede.style.transform = 'translateY(0)';
            }, 150);
        }
    }

    var OPT = { rootMargin: '0px 0px -25% 0px', threshold: 0 };

    /* Título: dispara quando o primeiro block-wrap entra na metade da tela */
    var wrapCode = document.querySelector('.tese-card--code .tese-block-wrap');
    if (wrapCode) {
        new IntersectionObserver(function (entries, obs) {
            if (!entries[0].isIntersecting) return;
            obs.disconnect();
            startTitleAnim();
            startCodeTyping();
        }, OPT).observe(wrapCode);
    }

    /* Chart: observer independente para o segundo card */
    var wrapBiz = document.querySelector('.tese-card--biz .tese-block-wrap');
    if (wrapBiz) {
        new IntersectionObserver(function (entries, obs) {
            if (!entries[0].isIntersecting) return;
            obs.disconnect();
            startChartAnim();
        }, OPT).observe(wrapBiz);
    }

    window._startTrocasTitleAnim = startTrocasTitleAnim;
})();

/* ── Manifesto: reveal letra por letra com scroll ──────────────────── */
(function () {
    var section = document.querySelector('.sec-manifesto');
    var lines   = Array.from(document.querySelectorAll('.manifesto-line'));
    if (!section || !lines.length) return;

    var lc    = document.getElementById('layer-content');
    var fulls = lines.map(function (el) { return el.textContent.trim(); });
    var n = lines.length;

    /* Injeta spans por letra agrupados por palavra (evita quebra no meio da palavra) */
    var allChars = [];
    lines.forEach(function (el, i) {
        var text = fulls[i];
        el.innerHTML = '';
        var lineChars = [];
        var k = 0;
        while (k < text.length) {
            if (text[k] === ' ') {
                el.appendChild(document.createTextNode(' '));
                lineChars.push(null);
                k++;
            } else {
                var j = k;
                while (j < text.length && text[j] !== ' ') j++;
                var word = document.createElement('span');
                word.className = 'manifesto-word';
                if (text.slice(k, j) === 'Xperiun') word.classList.add('manifesto-word--xperiun');
                for (var m = k; m < j; m++) {
                    var sp = document.createElement('span');
                    sp.className = 'manifesto-char';
                    sp.textContent = text[m];
                    word.appendChild(sp);
                    lineChars.push(sp);
                }
                el.appendChild(word);
                k = j;
            }
        }
        allChars.push(lineChars);
    });

    var prevCounts = lines.map(function () { return 0; });

    function update() {
        var scrolled = lc.scrollTop - section.offsetTop;
        var range    = section.offsetHeight - lc.clientHeight;
        var p = Math.max(0, Math.min(1, scrolled / range));
        lines.forEach(function (el, i) {
            var lp = Math.max(0, Math.min(1, p * n - i));
            var count = Math.round(lp * fulls[i].length);
            if (count === prevCounts[i]) return;
            var prev  = prevCounts[i];
            prevCounts[i] = count;
            var chars = allChars[i];
            var lo = Math.min(prev, count), hi = Math.max(prev, count);
            for (var k = lo; k < hi; k++) {
                var sp = chars[k];
                if (!sp) continue;
                if (k < count) sp.classList.add('is-visible');
                else            sp.classList.remove('is-visible');
            }
        });
    }

    lc.addEventListener('scroll', update, { passive: true });
    update();
})();

/* ── Home dots — auto-detecta seções e gera dots ────────────────── */
(function () {
    var lc  = document.getElementById('layer-content');
    var lt  = document.getElementById('layer-trocas');
    var nav = document.getElementById('homeDots');
    if (!lc || !lt || !nav) return;

    /* getOffsetIn(el, container) — soma offsetTop subindo pela chain de
       offsetParent até encontrar o container. Necessário porque seções
       dentro de .dn-stack (position: relative) têm offsetTop relativo ao
       .dn-stack, não ao layer-trocas — usar el.offsetTop direto retorna
       um número pequeno e o updateActive escolhe a seção errada. */
    function getOffsetIn(el, container) {
        var top = 0;
        var node = el;
        while (node) {
            top += node.offsetTop;
            if (node.offsetParent === container) return top;
            node = node.offsetParent;
            if (!node) break;
        }
        return top;
    }

    /* Monta lista ordenada de targets: hero + todas section[id] no DOM */
    var targets = [{ el: null, id: 'hero', layer: 'hero', offsetTop: 0 }];
    document.querySelectorAll('section[id]').forEach(function (sec) {
        targets.push({
            el: sec,
            id: sec.id,
            layer: lc.contains(sec) ? 'content' : 'trocas',
            offsetTop: 0
        });
    });

    function recomputeOffsets() {
        targets.forEach(function (t) {
            if (!t.el) return;
            var container = t.layer === 'trocas' ? lt : lc;
            t.offsetTop = getOffsetIn(t.el, container);
        });
    }
    recomputeOffsets();
    window.addEventListener('resize', recomputeOffsets);

    /* sec-trocas tem altura definida por outro script (calc(100vh + maxTranslate))
       que roda depois desse. Sem reagir a mudanças de tamanho das seções, as
       posições cacheadas no init ficam erradas pra todas as seções pós-trocas.
       ResizeObserver em cada section: qualquer mudança de altura recomputa. */
    if (typeof ResizeObserver !== 'undefined') {
        var ro = new ResizeObserver(recomputeOffsets);
        targets.forEach(function (t) { if (t.el) ro.observe(t.el); });
    }
    /* Fallback: força 2 recomputes após o load — pra navegadores sem
       ResizeObserver e pra pegar qualquer layout assíncrono que ainda
       não tenha settled. */
    requestAnimationFrame(function () {
        requestAnimationFrame(recomputeOffsets);
    });
    window.addEventListener('load', recomputeOffsets);

    /* Gera botões dinamicamente */
    nav.innerHTML = '';
    targets.forEach(function (t, i) {
        var btn = document.createElement('button');
        btn.className = 'home-dot' + (i === 0 ? ' is-active' : '');
        btn.setAttribute('data-target', t.id);
        btn.setAttribute('aria-label', 'Seção ' + (i + 1));
        nav.appendChild(btn);
    });

    var dots = Array.from(nav.querySelectorAll('.home-dot'));

    function setActive(idx) {
        dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
    }

    /* Primeiro índice de cada layer (para fallback) */
    function firstOf(layer) {
        for (var i = 0; i < targets.length; i++) {
            if (targets[i].layer === layer) return i;
        }
        return 0;
    }

    function updateActive() {
        var h = window._home;
        if (h && h.getTCur() >= 0.5) {
            /* Dentro do layer-trocas: acha a seção mais profunda visível */
            var mid  = lt.scrollTop + lt.clientHeight * 0.5;
            var best = firstOf('trocas');
            for (var i = 0; i < targets.length; i++) {
                if (targets[i].layer === 'trocas' && targets[i].el &&
                    targets[i].offsetTop <= mid) best = i;
            }
            setActive(best);
            return;
        }
        if (!lc.classList.contains('is-in')) { setActive(0); return; }
        /* Dentro do layer-content */
        var mid  = lc.scrollTop + lc.clientHeight * 0.5;
        var best = firstOf('content');
        for (var i = 0; i < targets.length; i++) {
            if (targets[i].layer === 'content' && targets[i].el &&
                targets[i].offsetTop <= mid) best = i;
        }
        setActive(best);
    }

    window._updateDots = updateActive;
    lc.addEventListener('scroll', updateActive, { passive: true });
    lt.addEventListener('scroll', updateActive, { passive: true });
    new MutationObserver(updateActive).observe(lc, { attributes: true, attributeFilter: ['class'] });

    dots.forEach(function (dot, idx) {
        dot.addEventListener('click', function () {
            var h = window._home;
            if (!h) return;
            var t = targets[idx];
            if (!t) return;

            /* Recomputa offsets antes do click — garante que destinos
               estão atualizados mesmo se algum layout dinâmico mudou. */
            recomputeOffsets();

            if (t.layer === 'hero') {
                h.hideTrocas();
                h.goToHero();
                return;
            }

            if (t.layer === 'trocas') {
                var dest = t.offsetTop;
                var go   = function () { h.scrollTrocasTo(dest); };
                if (h.getInHero()) {
                    h.goToContent();
                    setTimeout(function () {
                        h.showTrocas();
                        setTimeout(go, 400);
                    }, h.FADE + 200);
                } else if (h.getTCur() >= 0.5) {
                    go();
                } else {
                    h.showTrocas();
                    setTimeout(go, 400);
                }
                return;
            }

            /* content layer */
            if (h.getTCur() > 0) h.hideTrocas();
            var dest = t.offsetTop;
            if (h.getInHero()) {
                h.goToContent();
                setTimeout(function () { h.scrollToTop(dest); }, h.FADE);
            } else {
                h.scrollToTop(dest);
            }
        });
    });
})();

/* ── Manifesto: crescimento da imagem com scroll ────────────────────── */
(function () {
    var section = document.querySelector('.sec-manifesto');
    var lc      = document.getElementById('layer-content');
    var dotsNav = document.getElementById('homeDots');
    if (!section || !lc) return;

    function update() {
        var trigger = section.offsetTop - window.innerHeight * 0.5;
        var range   = window.innerHeight * 0.5;
        var p = Math.max(0, Math.min(1, (lc.scrollTop - trigger) / range));
        section.style.setProperty('--img-scale', 1 + p);
        /* is-light só ativo quando manifesto image está visível E trocas não cobre */
        var h = window._home;
        var trocasCovering = h && h.getTCur() >= 0.25;
        if (dotsNav) dotsNav.classList.toggle('is-light', p > 0 && !trocasCovering);
    }

    window._updateManifestoScale = update;
    lc.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
})();

/* ── Sec-trocas: scroll vertical → translateX horizontal nos cards ─── */
(function () {
    var lt   = document.getElementById('layer-trocas');
    var grid = document.querySelector('.trocas-grid');
    var sec  = document.querySelector('.sec-trocas');
    if (!lt || !grid || !sec) return;

    /* Apenas largura — touch detection (hover: none + pointer: coarse)
       foi removida porque DevTools Responsive Design Mode emula touch
       por default e quebrava o horizontal scroll em viewports desktop
       emuladas. O CSS @media já faz o switch visual por largura. */
    function isSmall() {
        return window.innerWidth < 865;
    }

    function maxTranslate() {
        if (isSmall()) return 0;
        var cards = grid.querySelectorAll('.troca-card');
        if (!cards.length) return Math.max(0, grid.scrollWidth - lt.clientWidth);
        var last = cards[cards.length - 1];
        var gap = Math.max(16, lt.clientWidth / 2 - 688);
        return Math.max(0, last.offsetLeft + last.offsetWidth - (lt.clientWidth - gap));
    }

    function updateHeight() {
        if (isSmall()) {
            /* ≤864px: layout em coluna — sec-trocas cresce livremente
               com o conteúdo, sem sticky nem translate horizontal. */
            sec.style.height = '';
            return;
        }
        /* sec-trocas gera espaço de scroll para o stage sticky mover os cards */
        sec.style.height = 'calc(100dvh + ' + maxTranslate() + 'px)';
    }

    function applyTranslate() {
        /* clamp: depois de ver todos os cards o stage sai do sticky normalmente */
        var pos = Math.min(lt.scrollTop, maxTranslate());
        grid.style.transform = 'translateX(' + (-pos) + 'px)';
    }

    lt.addEventListener('scroll', applyTranslate, { passive: true });
    window.addEventListener('resize', function () { updateHeight(); applyTranslate(); });
    window._trocasMax = maxTranslate;
    /* Expõe pra IIFE de relocate-header forçar recalc após mover o
       header pra dentro do grid (muda offsetLeft do último card). */
    window._trocasRecalc = function () { updateHeight(); applyTranslate(); };
    updateHeight();
    applyTranslate();
})();

/* Relocate .trocas-header pra dentro de .trocas-grid em viewport
   wide-short (vw > 864 + vh < 864) — vira "primeiro card" no scroll
   horizontal, libera a altura completa do stage pros cards reais.
   Em qualquer outro caso, header volta pro topo do stage. */
(function () {
    var stage  = document.querySelector('.trocas-stage');
    var grid   = document.querySelector('.trocas-grid');
    var header = document.querySelector('.trocas-header');
    if (!stage || !grid || !header) return;

    var mq = window.matchMedia('(min-width: 865px) and (max-height: 864px)');

    function relocate() {
        if (mq.matches) {
            if (header.parentNode !== grid) {
                grid.insertBefore(header, grid.firstChild);
                header.classList.add('trocas-header--inline');
            }
        } else {
            if (header.parentNode !== stage) {
                stage.insertBefore(header, grid);
                header.classList.remove('trocas-header--inline');
            }
        }
        if (typeof window._trocasRecalc === 'function') {
            window._trocasRecalc();
        }
    }

    relocate();
    if (mq.addEventListener) mq.addEventListener('change', relocate);
    else mq.addListener(relocate);
    window.addEventListener('orientationchange', relocate);
})();

/* ── Formações: timeline lines, sweep, entrance animations ── */
(function () {
    var lt       = document.getElementById('layer-trocas');
    var section  = document.querySelector('.sec-formacoes');
    var timeline = document.querySelector('.formacoes-timeline');
    if (!lt || !section || !timeline) return;

    var header  = section.querySelector('.formacoes-header');
    var eyebrow = section.querySelector('.formacoes-eyebrow');
    var title   = section.querySelector('.formacoes-title');
    var lede    = section.querySelector('.formacoes-lede');
    var items   = Array.from(timeline.querySelectorAll(':scope > .formacoes-item'));

    /* ── Row management ──────────────────────────────────────── */
    var rowData  = [];
    var lastCols = 0;

    function getColCount() {
        var w = window.innerWidth;
        if (w > 1152) return 4;
        if (w > 864)  return 3;
        if (w > 576)  return 2;
        return 1;
    }

    function buildRows() {
        var cols = getColCount();
        if (cols === lastCols) return;
        lastCols = cols;

        Array.from(timeline.querySelectorAll('.formacoes-row')).forEach(function (row) {
            Array.from(row.querySelectorAll('.formacoes-item')).forEach(function (item) {
                timeline.insertBefore(item, row);
            });
            row.parentNode.removeChild(row);
        });
        rowData = [];

        if (cols === 1) return;

        var numRows = Math.ceil(items.length / cols);
        for (var r = 0; r < numRows; r++) {
            var rowItems = items.slice(r * cols, (r + 1) * cols);

            var rowEl = document.createElement('div');
            rowEl.className = 'formacoes-row';
            rowEl.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';

            rowItems.forEach(function (item) { rowEl.appendChild(item); });

            var line  = document.createElement('div');
            line.className = 'formacoes-line';
            rowEl.appendChild(line);

            var sweep = document.createElement('div');
            sweep.className = 'formacoes-sweep';
            sweep.style.opacity = '0';
            rowEl.appendChild(sweep);

            timeline.appendChild(rowEl);

            rowData.push({
                items:  rowItems,
                line:   line,
                sweep:  sweep,
                colors: rowItems.map(function (item) {
                    return getComputedStyle(item.querySelector('.formacoes-dot'))
                           .getPropertyValue('--dot-color').trim();
                }),
                xCache:    [],
                pinged:    rowItems.map(function () { return false; }),
                resetDone: false
            });
        }

        positionAndCache();
    }

    function positionAndCache() {
        rowData.forEach(function (rd) {
            rd.xCache = rd.items.map(function (item) {
                return item.querySelector('.formacoes-dot').getBoundingClientRect().left;
            });
        });
    }

    var rbTimer       = null;
    var mobileHandler = null;
    var vsweepEl      = null;

    function teardownMobile() {
        if (mobileHandler) {
            lt.removeEventListener('scroll', mobileHandler);
            mobileHandler = null;
        }
        if (vsweepEl && vsweepEl.parentNode) {
            vsweepEl.parentNode.removeChild(vsweepEl);
            vsweepEl = null;
        }
    }

    /* ── Row entrance observers ─────────────────────────────── */
    var rowObservers = [];

    function setupRowObservers() {
        rowObservers.forEach(function (o) { o.disconnect(); });
        rowObservers = [];

        if (rowData.length === 0) {
            items.forEach(function (item) {
                var o = new IntersectionObserver(function (entries, obs) {
                    if (!entries[0].isIntersecting) return;
                    obs.disconnect();
                    item.classList.add('is-entered');
                }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 });
                o.observe(item);
                rowObservers.push(o);
            });
            return;
        }

        rowData.forEach(function (rd) {
            var o = new IntersectionObserver(function (entries, obs) {
                if (!entries[0].isIntersecting) return;
                obs.disconnect();
                rd.items.forEach(function (item, i) {
                    setTimeout(function () { item.classList.add('is-entered'); }, i * 100);
                });
            }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 });
            o.observe(rd.items[0]);
            rowObservers.push(o);
        });
    }

    window.addEventListener('resize', function () {
        if (rbTimer) cancelAnimationFrame(rbTimer);
        rbTimer = requestAnimationFrame(function () {
            rbTimer = null;
            teardownMobile();
            lastCols = 0;
            buildRows();
            setupRowObservers();
            if (window.matchMedia('(max-width: 576px)').matches) {
                setupMobileLine();
            }
        });
    });
    buildRows();
    setupRowObservers();

    /* ── Entrance animation ──────────────────────────────────── */
    function reveal() {
        if (eyebrow) { eyebrow.style.opacity = '1'; eyebrow.style.filter = 'blur(0)'; eyebrow.style.transform = 'translateY(0)'; }

        if (title) {
            var T = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';
            var spans = [];
            function walk(node) {
                if (node.nodeType === 3) {
                    var words = node.textContent.split(/(\s+)/);
                    words.forEach(function (part) {
                        if (/^\s+$/.test(part)) {
                            node.parentNode.insertBefore(document.createTextNode(part), node);
                        } else if (part.length) {
                            var wordWrap = document.createElement('span');
                            wordWrap.style.display    = 'inline-block';
                            wordWrap.style.whiteSpace = 'nowrap';
                            part.split('').forEach(function (ch) {
                                var sp = document.createElement('span');
                                sp.textContent = ch;
                                wordWrap.appendChild(sp);
                                spans.push(sp);
                            });
                            node.parentNode.insertBefore(wordWrap, node);
                        }
                    });
                    node.parentNode.removeChild(node);
                } else {
                    Array.from(node.childNodes).forEach(walk);
                }
            }
            Array.from(title.childNodes).forEach(walk);
            spans.forEach(function (sp) {
                sp.style.display    = 'inline-block';
                sp.style.opacity    = '0';
                sp.style.filter     = 'blur(8px)';
                sp.style.transform  = 'translateY(32px)';
                sp.style.transition = T;
            });
            title.style.opacity = '1';
            spans.forEach(function (sp, idx) {
                setTimeout(function () {
                    sp.style.opacity   = '1';
                    sp.style.filter    = 'blur(0)';
                    sp.style.transform = 'translateY(0)';
                }, idx * 10);
            });
        }

        if (lede) {
            setTimeout(function () {
                lede.style.opacity   = '1';
                lede.style.filter    = 'blur(0)';
                lede.style.transform = 'translateY(0)';
            }, 150);
        }
    }

    new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        reveal();
    }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(header || section);

    /* ── Mobile: vertical scroll line ───────────────────────── */
    function setupMobileLine() {
        vsweepEl = document.createElement('div');
        vsweepEl.style.cssText = 'position:absolute;top:0;left:0;width:4px;height:128px;pointer-events:none;z-index:1;opacity:0;transition:opacity 0.4s ease;';
        timeline.appendChild(vsweepEl);

        var colors = items.map(function (item) {
            return getComputedStyle(item.querySelector('.formacoes-dot'))
                   .getPropertyValue('--dot-color').trim() || '#9696FF';
        });

        var pinged      = items.map(function () { return false; });
        var activeColor = colors[0] || '#9696FF';
        var dotYs       = [];
        var tlOffsetTop = 0;
        var lastStickyY = -Infinity;
        var initialized = false;

        function computePositions() {
            var tlRect  = timeline.getBoundingClientRect();
            tlOffsetTop = tlRect.top + lt.scrollTop;
            dotYs = items.map(function (item) {
                var d = item.querySelector('.formacoes-dot');
                var r = d.getBoundingClientRect();
                return Math.round(r.top + r.height / 2 - tlRect.top);
            });
        }

        function onScroll() {
            if (!initialized) { computePositions(); initialized = true; }

            var stickyY  = lt.scrollTop + window.innerHeight * 0.5 - tlOffsetTop;
            var tlHeight = timeline.offsetHeight;
            var goingDown = stickyY >= lastStickyY;
            lastStickyY   = stickyY;

            if (goingDown) {
                for (var i = 0; i < dotYs.length; i++) {
                    if (stickyY >= dotYs[i] && !pinged[i]) {
                        pinged[i]   = true;
                        activeColor = colors[i];
                        var dot = items[i].querySelector('.formacoes-dot');
                        dot.classList.remove('is-pinging');
                        void dot.offsetWidth;
                        dot.classList.add('is-pinging');
                    }
                }
            } else {
                for (var i = dotYs.length - 1; i >= 0; i--) {
                    if (stickyY < dotYs[i] && pinged[i]) { pinged[i] = false; }
                }
                activeColor = colors[0];
                for (var i = 0; i < dotYs.length; i++) {
                    if (pinged[i]) activeColor = colors[i];
                }
            }

            var ty      = stickyY - 64;
            var opacity = (stickyY >= 0 && stickyY <= tlHeight) ? 1 : 0;
            vsweepEl.style.transform  = 'translateY(' + ty + 'px)';
            vsweepEl.style.opacity    = opacity;
            vsweepEl.style.background = 'linear-gradient(to bottom, transparent 0%, ' + activeColor + ' 75%, transparent 100%)';
        }

        mobileHandler = onScroll;
        lt.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ── Sweep rAF loop ──────────────────────────────────────── */
    if (window.matchMedia('(max-width: 576px)').matches) {
        setupMobileLine();
    }

    var PASS  = 3;
    var PAUSE = 0.3;
    var TOTAL = PASS + PAUSE;
    var last  = null;
    var globalT = 0;

    function tick(ts) {
        if (!last) last = ts;
        var dt = Math.min((ts - last) / 1000, 0.05);
        last = ts;
        var vw = window.innerWidth;
        var numRows = rowData.length;
        if (!numRows) { requestAnimationFrame(tick); return; }

        globalT += dt;
        var cycle     = globalT % (numRows * TOTAL);
        var activeIdx = Math.floor(cycle / TOTAL);
        var rowCycle  = cycle - activeIdx * TOTAL;

        rowData.forEach(function (rd, idx) {
            if (idx !== activeIdx) {
                if (!rd.resetDone) {
                    rd.pinged    = rd.items.map(function () { return false; });
                    rd.resetDone = true;
                }
                rd.sweep.style.opacity = '0';
                return;
            }

            if (rowCycle < PASS) {
                rd.resetDone = false;
                var p   = rowCycle / PASS;
                var tx  = -128 + p * (vw + 256);
                var tip = tx + 128;
                var color = rd.colors[0];
                for (var i = 0; i < rd.xCache.length; i++) {
                    if (tip >= rd.xCache[i]) color = rd.colors[i];
                    if (tip >= rd.xCache[i] && !rd.pinged[i]) {
                        rd.pinged[i] = true;
                        var dot = rd.items[i].querySelector('.formacoes-dot');
                        dot.classList.remove('is-pinging');
                        void dot.offsetWidth;
                        dot.classList.add('is-pinging');
                    }
                }
                rd.sweep.style.opacity    = Math.min(p / 0.04, 1);
                rd.sweep.style.transform  = 'translateX(' + tx + 'px)';
                rd.sweep.style.background = 'linear-gradient(to right, transparent 0%, ' + color + ' 75%, transparent 100%)';
            } else {
                if (!rd.resetDone) {
                    rd.pinged    = rd.items.map(function () { return false; });
                    rd.resetDone = true;
                }
                rd.sweep.style.opacity = '0';
            }
        });

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
})();

/* ── Enter animations: cta-card, trocas-grid ────────────────────────── */
(function () {
    var lt = document.getElementById('layer-trocas');
    [
        { sel: '.formacoes-cta-card', thr: 0.2 }
    ].forEach(function (cfg) {
        var el = document.querySelector(cfg.sel);
        if (!el) return;
        new IntersectionObserver(function (entries, o) {
            if (!entries[0].isIntersecting) return;
            el.classList.add('is-entered');
            o.disconnect();
        }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(el);
    });
})();

/* ── tese-method-content entrance ─────────────────────────────────── */
(function () {
    var lt = document.getElementById('layer-content');
    var el = document.querySelector('.tese-method-card');
    if (!el) return;
    new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        el.classList.add('is-entered');
    }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(el);
})();

/* ── sec-completa entrance animations ─────────────────────────────── */
(function () {
    var lt      = document.getElementById('layer-trocas');
    var section = document.querySelector('.sec-completa');
    if (!section) return;

    var h2     = section.querySelector('.completa-h2');
    var sub    = section.querySelector('.completa-sub');
    var tiles  = Array.from(section.querySelectorAll('.completa-tile'));
    var card   = section.querySelector('.completa-card');
    var header = section.querySelector('.completa-header');

    function reveal() {
        if (h2) {
            var T = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';
            var spans = [];
            function walk(node) {
                if (node.nodeType === 3) {
                    node.textContent.split(/(\s+)/).forEach(function (part) {
                        if (/^\s+$/.test(part)) {
                            node.parentNode.insertBefore(document.createTextNode(part), node);
                        } else if (part.length) {
                            var ww = document.createElement('span');
                            ww.style.display    = 'inline-block';
                            ww.style.whiteSpace = 'nowrap';
                            part.split('').forEach(function (ch) {
                                var sp = document.createElement('span');
                                sp.textContent = ch;
                                ww.appendChild(sp);
                                spans.push(sp);
                            });
                            node.parentNode.insertBefore(ww, node);
                        }
                    });
                    node.parentNode.removeChild(node);
                } else {
                    Array.from(node.childNodes).forEach(walk);
                }
            }
            Array.from(h2.childNodes).forEach(walk);
            spans.forEach(function (sp) {
                sp.style.display    = 'inline-block';
                sp.style.opacity    = '0';
                sp.style.filter     = 'blur(8px)';
                sp.style.transform  = 'translateY(32px)';
                sp.style.transition = T;
            });
            h2.style.opacity = '1';
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    spans.forEach(function (sp, idx) {
                        setTimeout(function () {
                            sp.style.opacity   = '1';
                            sp.style.filter    = 'blur(0)';
                            sp.style.transform = 'translateY(0)';
                        }, idx * 10);
                    });
                });
            });
        }

        if (sub) {
            setTimeout(function () {
                sub.style.opacity   = '1';
                sub.style.filter    = 'blur(0)';
                sub.style.transform = 'translateY(0)';
            }, 150);
        }

    }

    new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        reveal();
    }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(header || section);

    tiles.forEach(function (tile, i) {
        new IntersectionObserver(function (entries, obs) {
            if (!entries[0].isIntersecting) return;
            obs.disconnect();
            setTimeout(function () { tile.classList.add('is-entered'); }, i * 40);
        }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(tile);
    });

    if (card) {
        new IntersectionObserver(function (entries, obs) {
            if (!entries[0].isIntersecting) return;
            obs.disconnect();
            card.classList.add('is-entered');
        }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(card);
    }
})();

/* ── depos-avatar random thumbs ────────────────────────────────────── */
(function () {
    var thumbs = [
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-claudio.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-cleiton.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-daniel.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-edson.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-eduardo.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-ezequiel.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-gabriel.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-louiz.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-pedro.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-vinicius.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-vitoria.webp'
    ];
    for (var i = thumbs.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = thumbs[i]; thumbs[i] = thumbs[j]; thumbs[j] = t;
    }
    document.querySelectorAll('.depos-avatar').forEach(function (el, i) {
        el.style.backgroundImage    = 'url(' + thumbs[i] + ')';
        el.style.backgroundSize     = 'cover';
        el.style.backgroundPosition = 'center';
    });
})();

/* ── sec-depos entrance animation ─────────────────────────────────── */
(function () {
    var lt          = document.getElementById('layer-trocas');
    var section     = document.querySelector('.sec-depos');
    if (!section) return;

    var header      = section.querySelector('.depos-header');
    var socialProof = section.querySelector('.depos-social-proof');
    var title       = section.querySelector('.depos-title');
    var stars       = section.querySelector('.depos-stars');

    function reveal() {
        if (socialProof) {
            socialProof.style.opacity   = '1';
            socialProof.style.filter    = 'blur(0)';
            socialProof.style.transform = 'translateY(0)';
        }

        if (title) {
            var T = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';
            var spans = [];
            function walk(node) {
                if (node.nodeType === 3) {
                    var words = node.textContent.split(/(\s+)/);
                    words.forEach(function (part) {
                        if (/^\s+$/.test(part)) {
                            node.parentNode.insertBefore(document.createTextNode(part), node);
                        } else if (part.length) {
                            var wordWrap = document.createElement('span');
                            wordWrap.style.display    = 'inline-block';
                            wordWrap.style.whiteSpace = 'nowrap';
                            part.split('').forEach(function (ch) {
                                var sp = document.createElement('span');
                                sp.textContent = ch;
                                wordWrap.appendChild(sp);
                                spans.push(sp);
                            });
                            node.parentNode.insertBefore(wordWrap, node);
                        }
                    });
                    node.parentNode.removeChild(node);
                } else {
                    Array.from(node.childNodes).forEach(walk);
                }
            }
            Array.from(title.childNodes).forEach(walk);
            spans.forEach(function (sp) {
                sp.style.display    = 'inline-block';
                sp.style.opacity    = '0';
                sp.style.filter     = 'blur(8px)';
                sp.style.transform  = 'translateY(32px)';
                sp.style.transition = T;
            });
            title.style.opacity = '1';
            spans.forEach(function (sp, idx) {
                setTimeout(function () {
                    sp.style.opacity   = '1';
                    sp.style.filter    = 'blur(0)';
                    sp.style.transform = 'translateY(0)';
                }, idx * 10);
            });
        }

        if (stars) {
            setTimeout(function () {
                stars.style.opacity   = '1';
                stars.style.filter    = 'blur(0)';
                stars.style.transform = 'translateY(0)';
            }, 150);
        }
    }

    new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        reveal();
    }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(header || section);
})();

/* ── sec-depos: employers title + carousel + logos entrance ─────────── */
(function () {
    var lt = document.getElementById('layer-trocas');

    function letterReveal(el) {
        var T = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';
        var spans = [];
        function walk(node) {
            if (node.nodeType === 3) {
                var words = node.textContent.split(/(\s+)/);
                words.forEach(function (part) {
                    if (/^\s+$/.test(part)) {
                        node.parentNode.insertBefore(document.createTextNode(part), node);
                    } else if (part.length) {
                        var wordWrap = document.createElement('span');
                        wordWrap.style.display    = 'inline-block';
                        wordWrap.style.whiteSpace = 'nowrap';
                        part.split('').forEach(function (ch) {
                            var sp = document.createElement('span');
                            sp.textContent = ch;
                            wordWrap.appendChild(sp);
                            spans.push(sp);
                        });
                        node.parentNode.insertBefore(wordWrap, node);
                    }
                });
                node.parentNode.removeChild(node);
            } else {
                Array.from(node.childNodes).forEach(walk);
            }
        }
        Array.from(el.childNodes).forEach(walk);
        spans.forEach(function (sp) {
            sp.style.display    = 'inline-block';
            sp.style.opacity    = '0';
            sp.style.filter     = 'blur(8px)';
            sp.style.transform  = 'translateY(32px)';
            sp.style.transition = T;
        });
        el.style.opacity = '1';
        spans.forEach(function (sp, idx) {
            setTimeout(function () {
                sp.style.opacity   = '1';
                sp.style.filter    = 'blur(0)';
                sp.style.transform = 'translateY(0)';
            }, idx * 10);
        });
    }

    function observe(el, fn) {
        if (!el) return;
        new IntersectionObserver(function (entries, obs) {
            if (!entries[0].isIntersecting) return;
            obs.disconnect();
            fn(el);
        }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(el);
    }

    observe(document.querySelector('.depos-employers-title'), letterReveal);
    observe(document.querySelector('.depos-carousel-wrap'),   function (el) { el.classList.add('is-entered'); });
    observe(document.querySelector('.depos-logos-section'),   function (el) { el.classList.add('is-entered'); });
})();

/* ── Logo grid rotation ────────────────────────────────────────────── */
(function () {
    var logos = [
        { src: '/ed/site-dependencias/site-media/logos/logo-vale.webp',        alt: 'Vale' },
        { src: '/ed/site-dependencias/site-media/logos/logo-mercedes.webp',    alt: 'Mercedes-Benz' },
        { src: '/ed/site-dependencias/site-media/logos/logo-bradesco.webp',    alt: 'Bradesco' },
        { src: '/ed/site-dependencias/site-media/logos/logo-santander.webp',   alt: 'Santander' },
        { src: '/ed/site-dependencias/site-media/logos/logo-cpfl.webp',        alt: 'CPFL' },
        { src: '/ed/site-dependencias/site-media/logos/logo-ambev.webp',       alt: 'Ambev' },
        { src: '/ed/site-dependencias/site-media/logos/logo-magalu.webp',      alt: 'Magalu' },
        { src: '/ed/site-dependencias/site-media/logos/logo-inter.webp',       alt: 'Inter' },
        { src: '/ed/site-dependencias/site-media/logos/logo-google.webp',      alt: 'Google' },
        { src: '/ed/site-dependencias/site-media/logos/logo-suzano.webp',      alt: 'Suzano' },
        { src: '/ed/site-dependencias/site-media/logos/sicoob.webp',           alt: 'Sicoob' },
        { src: '/ed/site-dependencias/site-media/logos/logo-cbf.webp',         alt: 'CBF' },
        { src: '/ed/site-dependencias/site-media/logos/logo-airliquide.webp',  alt: 'Air Liquide' },
        { src: '/ed/site-dependencias/site-media/logos/logo-3m.webp',          alt: '3M' },
        { src: '/ed/site-dependencias/site-media/logos/logo-cielo.webp',       alt: 'Cielo' },
        { src: '/ed/site-dependencias/site-media/logos/logo-globo.webp',       alt: 'Globo' },
        { src: '/ed/site-dependencias/site-media/logos/logo-neoway.webp',      alt: 'Neoway' },
        { src: '/ed/site-dependencias/site-media/logos/logo-natura.webp',      alt: 'Natura' },
        { src: '/ed/site-dependencias/site-media/logos/logo-claro.webp',       alt: 'Claro' },
        { src: '/ed/site-dependencias/site-media/logos/logo-piracanjuba.webp', alt: 'Piracanjuba' }
    ];

    var grid = document.getElementById('depos-logos-grid');
    if (!grid) return;

    var imgs = Array.from(grid.querySelectorAll('.depos-logo-card img'));
    /* Mapa img → logo atual: usado pra computar "displayedLogos" e
       garantir que nenhum logo apareça em 2 slots ao mesmo tempo. */
    var imgToLogo = new Map();

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function visibleImgs() {
        return imgs.filter(function(img) {
            return img.closest('.depos-logo-card').offsetHeight > 0;
        });
    }

    function displayedLogos() {
        var arr = [];
        imgToLogo.forEach(function (l) { if (l) arr.push(l); });
        return arr;
    }

    function init() {
        var visible = visibleImgs();
        var initial = shuffle(logos).slice(0, visible.length);
        visible.forEach(function(img, i) {
            img.src = initial[i].src;
            img.alt = initial[i].alt;
            img.style.opacity = '0.5';
            imgToLogo.set(img, initial[i]);
        });
    }

    var lastImg = null;

    function tick() {
        var visible = visibleImgs();
        if (!visible.length) return;

        var candidates = visible.length > 1 ? visible.filter(function(i) { return i !== lastImg; }) : visible;
        var img = candidates[Math.floor(Math.random() * candidates.length)];
        lastImg = img;

        /* Pool: todos os logos que NÃO estão atualmente em algum slot
           visível. Garante zero duplicatas simultâneas. */
        var displayed = displayedLogos();
        var pool = logos.filter(function(l) { return displayed.indexOf(l) === -1; });
        if (!pool.length) return;
        var next = pool[Math.floor(Math.random() * pool.length)];

        imgToLogo.set(img, next);  /* atualiza ANTES do timeout pra próximos ticks já enxergarem */
        img.style.opacity = '0';
        /* Swap dispara quando AMBOS: fade-out terminou (600ms) +
           próximo logo carregou (preload). Evita flicker. */
        var loaded = false, delayed = false;
        function tryComplete() {
            if (!loaded || !delayed) return;
            img.src = next.src;
            img.alt = next.alt;
            img.style.opacity = '0.5';
        }
        setTimeout(function () { delayed = true; tryComplete(); }, 600);
        var preloader = new Image();
        preloader.onload = preloader.onerror = function () { loaded = true; tryComplete(); };
        preloader.src = next.src;
    }

    init();
    setInterval(tick, 700);
})();

    // ── Carrossel de depoimentos — loop infinito ──────────────────────────
    (function () {
        const track   = document.getElementById('depos-track');
        const btnPrev = document.getElementById('depos-prev');
        const btnNext = document.getElementById('depos-next');
        if (!track) return;

        const origCards = Array.from(track.children);
        const N = origCards.length;

        origCards.forEach(c => {
            const cl = c.cloneNode(true);
            cl.setAttribute('aria-hidden', 'true');
            track.appendChild(cl);
        });
        origCards.slice().reverse().forEach(c => {
            const cl = c.cloneNode(true);
            cl.setAttribute('aria-hidden', 'true');
            track.insertBefore(cl, track.firstChild);
        });

        document.addEventListener('click', function (e) {
            const video = e.target.closest('.depos-video[data-vid]');
            if (!video) return;
            const vid   = video.dataset.vid;
            const start = video.dataset.start || 0;
            delete video.dataset.vid;
            const iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube.com/embed/' + vid + '?start=' + start + '&autoplay=1';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            video.innerHTML = '';
            video.appendChild(iframe);
        });

        function step() {
            const c = track.querySelector('.depos-card');
            const g = parseFloat(getComputedStyle(track).columnGap) || 24;
            return c ? c.getBoundingClientRect().width + g : 0;
        }

        function setInstant(pos) {
            track.style.scrollBehavior = 'auto';
            track.scrollLeft = pos;
            void track.offsetWidth;
            track.style.scrollBehavior = '';
        }

        function gridOffset() {
            if (!window.matchMedia('(min-width: 1440px)').matches) return 0;
            return Math.max(0, (document.documentElement.clientWidth - 1408) / 2);
        }

        function loopCorrect() {
            const W  = N * step();
            const pl = gridOffset();
            if (!W) return;
            if (track.scrollLeft < W - pl)           setInstant(track.scrollLeft + W);
            else if (track.scrollLeft >= 2 * W - pl) setInstant(track.scrollLeft - W);
        }

        function init() {
            const s = step();
            if (!s) { requestAnimationFrame(init); return; }
            setInstant(N * s - gridOffset());
        }
        requestAnimationFrame(() => requestAnimationFrame(init));
        window.addEventListener('resize', init);

        let scrollTimer;
        function move(dir) {
            const s = step();
            if (!s) return;
            track.scrollBy({ left: s * dir, behavior: 'smooth' });
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(loopCorrect, 500);
        }

        btnPrev.addEventListener('click', () => move(-1));
        btnNext.addEventListener('click', () => move(1));

        let nativeTimer;
        track.addEventListener('scroll', () => {
            clearTimeout(nativeTimer);
            nativeTimer = setTimeout(loopCorrect, 150);
        }, { passive: true });

        btnPrev.disabled = false;
        btnNext.disabled = false;
    })();

/* ── sec-posgrad: entrance animation ── */
(function () {
    var lt      = document.getElementById('layer-trocas');
    var section = document.querySelector('.sec-posgrad');
    if (!lt || !section) return;

    var eyebrow = section.querySelector('.posgrad-eyebrow');
    var title   = section.querySelector('.posgrad-title');
    var lede    = section.querySelector('.posgrad-lede');
    var cards   = Array.from(section.querySelectorAll('.posgrad-card'));

    function reveal() {
        if (eyebrow) {
            eyebrow.style.opacity   = '1';
            eyebrow.style.filter    = 'blur(0)';
            eyebrow.style.transform = 'translateY(0)';
        }
        if (lede) {
            setTimeout(function () {
                lede.style.opacity   = '1';
                lede.style.filter    = 'blur(0)';
                lede.style.transform = 'translateY(0)';
            }, 150);
        }
        if (title) {
            var T = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';
            var spans = [];
            function walk(node) {
                if (node.nodeType === 3) {
                    var words = node.textContent.split(/(\s+)/);
                    words.forEach(function (part) {
                        if (/^\s+$/.test(part)) {
                            node.parentNode.insertBefore(document.createTextNode(part), node);
                        } else if (part.length) {
                            var ww = document.createElement('span');
                            ww.style.display    = 'inline-block';
                            ww.style.whiteSpace = 'nowrap';
                            part.split('').forEach(function (ch) {
                                var sp = document.createElement('span');
                                sp.textContent = ch;
                                ww.appendChild(sp);
                                spans.push(sp);
                            });
                            node.parentNode.insertBefore(ww, node);
                        }
                    });
                    node.parentNode.removeChild(node);
                } else {
                    Array.from(node.childNodes).forEach(walk);
                }
            }
            Array.from(title.childNodes).forEach(walk);
            spans.forEach(function (sp) {
                sp.style.display    = 'inline-block';
                sp.style.opacity    = '0';
                sp.style.filter     = 'blur(8px)';
                sp.style.transform  = 'translateY(32px)';
                sp.style.transition = T;
            });
            title.style.opacity = '1';
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    spans.forEach(function (sp, idx) {
                        setTimeout(function () {
                            sp.style.opacity   = '1';
                            sp.style.filter    = 'blur(0)';
                            sp.style.transform = 'translateY(0)';
                        }, idx * 10);
                    });
                });
            });
        }
    }

    new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        reveal();
    }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(section);

    cards.forEach(function (card, i) {
        new IntersectionObserver(function (entries, obs) {
            if (!entries[0].isIntersecting) return;
            obs.disconnect();
            setTimeout(function () { card.classList.add('is-entered'); }, i * 100);
        }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(card);
    });
})();

/* ── sec-entrada: entrance animation ── */
(function () {
    var lt      = document.getElementById('layer-trocas');
    var section = document.querySelector('.sec-entrada');
    if (!lt || !section) return;

    var eyebrow = section.querySelector('.entrada-eyebrow');
    var title   = section.querySelector('.entrada-h2');
    var card    = section.querySelector('.entrada-card');

    function reveal() {
        if (eyebrow) {
            eyebrow.style.opacity   = '1';
            eyebrow.style.filter    = 'blur(0)';
            eyebrow.style.transform = 'translateY(0)';
        }
        if (title) {
            var T = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';
            var spans = [];
            function walk(node) {
                if (node.nodeType === 3) {
                    var words = node.textContent.split(/(\s+)/);
                    words.forEach(function (part) {
                        if (/^\s+$/.test(part)) {
                            node.parentNode.insertBefore(document.createTextNode(part), node);
                        } else if (part.length) {
                            var wordWrap = document.createElement('span');
                            wordWrap.style.display    = 'inline-block';
                            wordWrap.style.whiteSpace = 'nowrap';
                            part.split('').forEach(function (ch) {
                                var sp = document.createElement('span');
                                sp.textContent = ch;
                                wordWrap.appendChild(sp);
                                spans.push(sp);
                            });
                            node.parentNode.insertBefore(wordWrap, node);
                        }
                    });
                    node.parentNode.removeChild(node);
                } else {
                    Array.from(node.childNodes).forEach(walk);
                }
            }
            Array.from(title.childNodes).forEach(walk);
            spans.forEach(function (sp) {
                sp.style.display    = 'inline-block';
                sp.style.opacity    = '0';
                sp.style.filter     = 'blur(8px)';
                sp.style.transform  = 'translateY(32px)';
                sp.style.transition = T;
            });
            title.style.opacity = '1';
            spans.forEach(function (sp, idx) {
                setTimeout(function () {
                    sp.style.opacity   = '1';
                    sp.style.filter    = 'blur(0)';
                    sp.style.transform = 'translateY(0)';
                }, idx * 10);
            });
        }
    }

    new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        reveal();
    }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(section);

    if (card) {
        new IntersectionObserver(function (entries, obs) {
            if (!entries[0].isIntersecting) return;
            obs.disconnect();
            card.classList.add('is-entered');
        }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(card);
    }
})();

/* ── sec-faq: entrance animation + accordion ── */
(function () {
    var lt      = document.getElementById('layer-trocas');
    var section = document.querySelector('.sec-faq');
    if (!lt || !section) return;

    var eyebrow = section.querySelector('.faq-eyebrow');
    var title   = section.querySelector('.faq-title');
    var grid    = section.querySelector('.faq-grid');

    function reveal() {
        if (eyebrow) {
            eyebrow.style.opacity   = '1';
            eyebrow.style.filter    = 'blur(0)';
            eyebrow.style.transform = 'translateY(0)';
        }
        if (title) {
            var T = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';
            var spans = [];
            function walk(node) {
                if (node.nodeType === 3) {
                    var words = node.textContent.split(/(\s+)/);
                    words.forEach(function (part) {
                        if (/^\s+$/.test(part)) {
                            node.parentNode.insertBefore(document.createTextNode(part), node);
                        } else if (part.length) {
                            var wordWrap = document.createElement('span');
                            wordWrap.style.display    = 'inline-block';
                            wordWrap.style.whiteSpace = 'nowrap';
                            part.split('').forEach(function (ch) {
                                var sp = document.createElement('span');
                                sp.textContent = ch;
                                wordWrap.appendChild(sp);
                                spans.push(sp);
                            });
                            node.parentNode.insertBefore(wordWrap, node);
                        }
                    });
                    node.parentNode.removeChild(node);
                } else {
                    Array.from(node.childNodes).forEach(walk);
                }
            }
            Array.from(title.childNodes).forEach(walk);
            spans.forEach(function (sp) {
                sp.style.display    = 'inline-block';
                sp.style.opacity    = '0';
                sp.style.filter     = 'blur(8px)';
                sp.style.transform  = 'translateY(32px)';
                sp.style.transition = T;
            });
            title.style.opacity = '1';
            spans.forEach(function (sp, idx) {
                setTimeout(function () {
                    sp.style.opacity   = '1';
                    sp.style.filter    = 'blur(0)';
                    sp.style.transform = 'translateY(0)';
                }, idx * 10);
            });
        }
    }

    new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        reveal();
    }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(section);

    if (grid) {
        new IntersectionObserver(function (entries, obs) {
            if (!entries[0].isIntersecting) return;
            obs.disconnect();
            grid.classList.add('is-entered');
        }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(grid);
    }

    /* Accordion */
    section.querySelectorAll('.faq-row').forEach(function (details) {
        var summary = details.querySelector('.faq-q');
        var grid    = details.querySelector('.faq-a-grid');
        var icon    = details.querySelector('.faq-q-icon');

        summary.addEventListener('click', function (e) {
            e.preventDefault();
            if (!details.open) {
                details.open = true;
                requestAnimationFrame(function () {
                    grid.classList.add('is-open');
                    icon.textContent = 'remove';
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

/* ── sec-cta: entrance animation ── */
(function () {
    var lt      = document.getElementById('layer-trocas');
    var section = document.querySelector('.sec-cta');
    if (!lt || !section) return;

    var eyebrow = section.querySelector('.cta-eyebrow');
    var title   = section.querySelector('.cta-title');
    var sub     = section.querySelector('.cta-sub');
    var rightItems = section.querySelectorAll('.cta-right .tag-status, .cta-right .btn');

    function reveal() {
        if (eyebrow) {
            eyebrow.style.opacity   = '1';
            eyebrow.style.filter    = 'blur(0)';
            eyebrow.style.transform = 'translateY(0)';
        }
        if (title) {
            var T = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';
            var spans = [];
            function walk(node) {
                if (node.nodeType === 3) {
                    var words = node.textContent.split(/(\s+)/);
                    words.forEach(function (part) {
                        if (/^\s+$/.test(part)) {
                            node.parentNode.insertBefore(document.createTextNode(part), node);
                        } else if (part.length) {
                            var wordWrap = document.createElement('span');
                            wordWrap.style.display    = 'inline-block';
                            wordWrap.style.whiteSpace = 'nowrap';
                            part.split('').forEach(function (ch) {
                                var sp = document.createElement('span');
                                sp.textContent = ch;
                                wordWrap.appendChild(sp);
                                spans.push(sp);
                            });
                            node.parentNode.insertBefore(wordWrap, node);
                        }
                    });
                    node.parentNode.removeChild(node);
                } else {
                    Array.from(node.childNodes).forEach(walk);
                }
            }
            Array.from(title.childNodes).forEach(walk);
            spans.forEach(function (sp) {
                sp.style.display    = 'inline-block';
                sp.style.opacity    = '0';
                sp.style.filter     = 'blur(8px)';
                sp.style.transform  = 'translateY(32px)';
                sp.style.transition = T;
            });
            title.style.opacity = '1';
            spans.forEach(function (sp, idx) {
                setTimeout(function () {
                    sp.style.opacity   = '1';
                    sp.style.filter    = 'blur(0)';
                    sp.style.transform = 'translateY(0)';
                }, idx * 10);
            });
        }
        if (sub) {
            setTimeout(function () {
                sub.style.opacity   = '1';
                sub.style.filter    = 'blur(0)';
                sub.style.transform = 'translateY(0)';
            }, 150);
        }
        rightItems.forEach(function (el, idx) {
            setTimeout(function () {
                el.classList.add('is-entered');
            }, 250 + idx * 40);
        });
    }

    new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        reveal();
    }, { root: lt, rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(section);
})();