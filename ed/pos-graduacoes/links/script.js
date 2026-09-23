/* ═══════════════════════════════════════════════════════════════
   /ed/pos-graduacoes/links/ — entrada da sec-posgrad.

   Porte do bloco "sec-posgrad: entrance animation" de
   ed/site-dependencias/home.js. Única diferença: lá o
   IntersectionObserver observa dentro de #layer-trocas (o scroll
   customizado da home); aqui o root é a viewport, porque a página
   usa o scroll normal do documento.
   ═══════════════════════════════════════════════════════════════ */
(function () {
    var section = document.querySelector('.sec-posgrad');
    if (!section) return;

    /* Sem .posgrad-eyebrow aqui: esta página não usa o eyebrow da home. */
    var title = section.querySelector('.posgrad-title');
    var lede  = section.querySelector('.posgrad-lede');
    var cards = Array.from(section.querySelectorAll('.posgrad-card'));

    function reveal() {
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
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(section);

    cards.forEach(function (card, i) {
        new IntersectionObserver(function (entries, obs) {
            if (!entries[0].isIntersecting) return;
            obs.disconnect();
            setTimeout(function () { card.classList.add('is-entered'); }, i * 100);
        }, { rootMargin: '0px 0px -15% 0px', threshold: 0 }).observe(card);
    });
})();

/* ═══════════════════════════════════════════════════════════
   Foil holográfico no card e-Mec/MEC (tilt 3D + overlay iridescente).
   Porte literal do bloco equivalente de ed/pos-graduacoes/mba-fpa.js.
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
