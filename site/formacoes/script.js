
/* ── Helper: em viewport ≤576px (mobile portrait), neutraliza blurs de
   animação. Devolve 'none' quando estreito; senão devolve 'blur(Xpx)'.
   Animações de opacity/transform continuam funcionando — só o blur some. */
var IS_NARROW = window.matchMedia && window.matchMedia('(max-width: 576px)').matches;
function bf(px) {
    if (IS_NARROW) return 'none';
    return px === 0 ? 'blur(0)' : 'blur(' + px + 'px)';
}
/* Atualiza dinamicamente se viewport mudar */
if (window.matchMedia) {
    window.matchMedia('(max-width: 576px)').addEventListener('change', function (e) {
        IS_NARROW = e.matches;
    });
}

/* ── sec-depos: avatares aleatórios ── */
(function () {
    var thumbs = [
        '../media/depoimento-video-thumb/depoimento-video-thumb-claudio.webp',
        '../media/depoimento-video-thumb/depoimento-video-thumb-cleiton.webp',
        '../media/depoimento-video-thumb/depoimento-video-thumb-daniel.webp',
        '../media/depoimento-video-thumb/depoimento-video-thumb-edson.webp',
        '../media/depoimento-video-thumb/depoimento-video-thumb-eduardo.webp',
        '../media/depoimento-video-thumb/depoimento-video-thumb-ezequiel.webp',
        '../media/depoimento-video-thumb/depoimento-video-thumb-gabriel.webp',
        '../media/depoimento-video-thumb/depoimento-video-thumb-louiz.webp',
        '../media/depoimento-video-thumb/depoimento-video-thumb-pedro.webp',
        '../media/depoimento-video-thumb/depoimento-video-thumb-vinicius.webp',
        '../media/depoimento-video-thumb/depoimento-video-thumb-vitoria.webp'
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

/* ── sec-depos: rotação dos logos ── */
(function () {
    var logos = [
        { src: '../media/logos/logo-3m.webp',          alt: '3M' },
        { src: '../media/logos/logo-airliquide.webp',  alt: 'Air Liquide' },
        { src: '../media/logos/logo-ambev.webp',       alt: 'Ambev' },
        { src: '../media/logos/logo-bradesco.webp',    alt: 'Bradesco' },
        { src: '../media/logos/logo-cbf.webp',         alt: 'CBF' },
        { src: '../media/logos/logo-cielo.webp',       alt: 'Cielo' },
        { src: '../media/logos/logo-claro.webp',       alt: 'Claro' },
        { src: '../media/logos/logo-cpfl.webp',        alt: 'CPFL' },
        { src: '../media/logos/logo-globo.webp',       alt: 'Globo' },
        { src: '../media/logos/logo-google.webp',      alt: 'Google' },
        { src: '../media/logos/logo-inter.webp',       alt: 'Inter' },
        { src: '../media/logos/logo-magalu.webp',      alt: 'Magalu' },
        { src: '../media/logos/logo-mercedes.webp',    alt: 'Mercedes-Benz' },
        { src: '../media/logos/logo-natura.webp',      alt: 'Natura' },
        { src: '../media/logos/logo-neoway.webp',      alt: 'Neoway' },
        { src: '../media/logos/logo-piracanjuba.webp', alt: 'Piracanjuba' },
        { src: '../media/logos/logo-santander.webp',   alt: 'Santander' },
        { src: '../media/logos/logo-suzano.webp',      alt: 'Suzano' },
        { src: '../media/logos/logo-vale.webp',        alt: 'Vale' },
        { src: '../media/logos/sicoob.webp',           alt: 'Sicoob' }
    ];
    var grid = document.getElementById('depos-logos-grid');
    if (!grid) return;
    var imgs = Array.from(grid.querySelectorAll('.depos-logo-card img'));
    var imgToLogo = new Map();  // rastreia qual logo está em cada slot — garante unicidade
    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }
    function visibleImgs() {
        return imgs.filter(function(img) { return img.closest('.depos-logo-card').offsetHeight > 0; });
    }
    function displayedLogos() {
        var arr = [];
        visibleImgs().forEach(function(img) {
            var l = imgToLogo.get(img);
            if (l) arr.push(l);
        });
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

        /* Pool: todos os logos que NÃO estão atualmente em algum slot visível.
           Garante que nunca haverá logos repetidos ao mesmo tempo. */
        var displayed = displayedLogos();
        var pool = logos.filter(function(l) { return displayed.indexOf(l) === -1; });
        if (!pool.length) return;
        var next = pool[Math.floor(Math.random() * pool.length)];

        imgToLogo.set(img, next);  /* atualiza ANTES do preload pra próximos ticks já enxergarem */
        img.style.opacity = '0';
        /* Swap só dispara quando AMBOS aconteceram:
           1. fade-out terminou (600ms, casando com transition CSS)
           2. próximo logo carregou (preload via new Image)
           Evita flicker e mantém transição lenta e suave. */
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

/* ── sec-depos: carrossel (loop infinito) + facade de vídeo ── */
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
        return c ? c.offsetWidth + g : 0;
    }
    function setInstant(pos) {
        track.style.scrollBehavior = 'auto';
        track.scrollLeft = pos;
        void track.offsetWidth;
        track.style.scrollBehavior = '';
    }
    function gridOffset() {
        if (!window.matchMedia('(min-width: 1440px)').matches) return 0;
        return Math.max(0, (window.innerWidth - 1408) / 2);
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

/* ── sec-perfis: accordion (clique em todo o .perfis-row) ── */
(function () {
    document.querySelectorAll('.sec-perfis .perfis-row').forEach(function (details) {
        var grid = details.querySelector('.perfis-a-grid');
        var icon = details.querySelector('.perfis-q-icon');
        details.addEventListener('click', function (e) {
            e.preventDefault();
            if (!details.open) {
                details.open = true;
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        grid.classList.add('is-open');
                        icon.classList.add('is-open');
                    });
                });
            } else {
                grid.classList.remove('is-open');
                icon.classList.remove('is-open');
                grid.addEventListener('transitionend', function () {
                    details.open = false;
                }, { once: true });
            }
        });
    });
})();

/* ── sec-faq: accordion (clique em todo o .faq-row) ── */
(function () {
    document.querySelectorAll('.sec-faq .faq-row').forEach(function (details) {
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

(function () {
    var modal = document.getElementById('courseModal');
    if (!modal) return;
    var mediaEl     = document.getElementById('courseModalMedia');
    var titleEl     = document.getElementById('courseModalTitle');
    var duracaoEl   = document.getElementById('courseModalDuracao');
    var aulasEl     = document.getElementById('courseModalAulas');
    var professorEl = document.getElementById('courseModalProfessor');
    var descEl      = document.getElementById('courseModalDesc');

    function openModal(card) {
        var bg    = card.querySelector('.course-card-bg');
        var tags  = card.querySelectorAll('.course-card-tags .tag-status');
        var title = card.querySelector('.course-card-title');
        var desc  = card.querySelector('.course-card-desc');

        mediaEl.style.backgroundImage = bg ? getComputedStyle(bg).backgroundImage : '';
        titleEl.textContent     = title ? title.textContent : '';
        duracaoEl.textContent   = card.dataset.duracao   || (tags[0] ? tags[0].textContent : '');
        aulasEl.textContent     = card.dataset.aulas     || '-';
        professorEl.textContent = card.dataset.professor || (tags[1] ? tags[1].textContent : '');
        descEl.textContent      = desc ? desc.textContent : '';

        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.course-card').forEach(function (card) {
        card.addEventListener('click', function () { openModal(card); });
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(card);
            }
        });
    });
    modal.querySelectorAll('[data-close]').forEach(function (el) {
        el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
})();

/* ── Mini-carrossel da sec-oferta (apenas ativo abaixo de 864px via CSS) ── */
(function () {
    var grid = document.querySelector('.oferta-grid');
    var prev = document.getElementById('oferta-prev');
    var next = document.getElementById('oferta-next');
    if (!grid || !prev || !next) return;

    var cards = Array.from(grid.querySelectorAll('.oferta-card'));
    if (cards.length < 2) return;

    function pad() {
        return parseFloat(getComputedStyle(grid).scrollPaddingLeft) || 0;
    }

    function currentIndex() {
        var max = grid.scrollWidth - grid.clientWidth;
        if (grid.scrollLeft <= 1) return 0;
        if (grid.scrollLeft >= max - 1) return cards.length - 1;
        var p = pad();
        var closest = 0;
        var minDist = Infinity;
        cards.forEach(function (c, i) {
            var dist = Math.abs(c.offsetLeft - grid.scrollLeft - p);
            if (dist < minDist) { minDist = dist; closest = i; }
        });
        return closest;
    }

    function scrollToCard(idx) {
        var card = cards[idx];
        if (!card) return;
        var target = Math.max(0, card.offsetLeft - pad());
        grid.scrollTo({ left: target, behavior: 'smooth' });
    }

    function updateButtons() {
        var idx = currentIndex();
        prev.disabled = idx <= 0;
        next.disabled = idx >= cards.length - 1;
    }

    prev.addEventListener('click', function () {
        var idx = currentIndex();
        if (idx > 0) scrollToCard(idx - 1);
    });
    next.addEventListener('click', function () {
        var idx = currentIndex();
        if (idx < cards.length - 1) scrollToCard(idx + 1);
    });
    grid.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
    updateButtons();
})();

/* ── Transição sec-oferta → sec-anuidade → sec-faq.
   Padrão portado de transicao.html:
     state 0 = sec-oferta (e tudo acima dela em flow)
     state 1 = sec-anuidade (popup, overlay fixo)
     state 2 = sec-faq (e tudo abaixo dela em flow)
   Trigger = bottom de sec-oferta toca bottom do viewport (= sec-faq.offsetTop - vh). */
(function () {
    var FADE       = 600;
    var EXIT_THR   = 200;   // px de "resistência" no edge antes do auto-trigger
    var secOferta  = document.querySelector('.sec-oferta');
    var secOverlay = document.querySelector('.sec-anuidade');
    var secFaq     = document.querySelector('.sec-faq');
    if (!secOferta || !secOverlay || !secFaq) return;

    var state    = 0;
    var exitAcc  = 0;
    var fading   = false;

    /* Inicia sec-faq escondido (state < 2). syncOverlayForState2 vai retoggla
       conforme transições. Evita peek antes do JS reagir a qualquer scroll. */
    secFaq.classList.add('peek-hidden');

    /* Lerp inline */
    var EASE = 0.12, THR = 0.4;
    var lCur = 0, lTgt = 0, lRun = false;
    var lEndedAt = 0;

    function trigger() {
        var vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
        return secFaq.offsetTop - vh;
    }
    function docMax()  { return document.documentElement.scrollHeight - window.innerHeight; }

    function lockFade() {
        fading = true;
        setTimeout(function () { fading = false; }, FADE);
    }
    function lockFadeHard() {
        fading = true;
        document.body.style.overflow = 'hidden';
        setTimeout(function () {
            fading = false;
            document.body.style.overflow = '';
        }, FADE);
    }

    function lTick() {
        var diff = lTgt - lCur;
        if (Math.abs(diff) < THR) {
            lCur = lTgt;
            window.scrollTo(0, lCur);
            lRun = false;
            lEndedAt = Date.now();
            return;
        }
        lCur += diff * EASE;
        window.scrollTo(0, lCur);
        requestAnimationFrame(lTick);
    }
    function startLerp() {
        if (!lRun) {
            lRun = true;
            lCur = window.scrollY || 0;
            requestAnimationFrame(lTick);
        }
    }

    function setOverlay(active) {
        secOferta.classList.toggle('is-out', active);
        secOverlay.classList.toggle('is-active', active);
    }

    /* Em state 2, depois que sec-faq cobre o viewport (y >= secFaq.offsetTop),
       toggla .is-hidden (visibility:hidden) em sec-anuidade. visibility não
       transiciona, então NÃO há slide-down/slide-up visível ao cruzar a
       fronteira. .is-active fica preservado (transform stays translateY 0). */
    function syncOverlayForState2() {
        var hide = (state === 2) && ((window.scrollY || 0) >= secFaq.offsetTop);
        secOverlay.classList.toggle('is-hidden', hide);
        /* sec-faq tem z-index 6 (acima do popup z:5) pra slidar por cima.
           Em mobile com momentum scroll, scrollY pode passar do trigger antes
           do state machine reagir, expondo o topo de sec-faq no fundo do
           viewport. Hidar sec-faq enquanto state < 2 elimina esse peek. */
        secFaq.classList.toggle('peek-hidden', state < 2);
    }

    /* Reveal anuidade: eyebrow + title char-by-char + lede.
       Dispara só quando vem de state 0 (sec-oferta → popup). */
    var titleSpans = null;
    var revealQueue = [];

    function setupTitleSplit() {
        if (titleSpans !== null) return;
        var title = secOverlay.querySelector('.anuidade-title');
        if (!title) return;
        titleSpans = [];
        function walk(node) {
            if (node.nodeType === 3) {
                var words = node.textContent.split(/(\s+)/);
                var frag = document.createDocumentFragment();
                words.forEach(function (part) {
                    if (/^\s+$/.test(part)) {
                        frag.appendChild(document.createTextNode(part));
                    } else if (part.length) {
                        var wordWrap = document.createElement('span');
                        wordWrap.style.display    = 'inline-block';
                        wordWrap.style.whiteSpace = 'nowrap';
                        part.split('').forEach(function (ch) {
                            var sp = document.createElement('span');
                            sp.textContent   = ch;
                            sp.style.display = 'inline-block';
                            wordWrap.appendChild(sp);
                            titleSpans.push(sp);
                        });
                        frag.appendChild(wordWrap);
                    }
                });
                node.parentNode.replaceChild(frag, node);
            } else if (node.nodeType === 1) {
                Array.from(node.childNodes).forEach(walk);
            }
        }
        Array.from(title.childNodes).forEach(walk);
    }

    function revealSec2() {
        setupTitleSplit();
        var eyebrow = secOverlay.querySelector('.anuidade-eyebrow');
        var title   = secOverlay.querySelector('.anuidade-title');
        var desc    = secOverlay.querySelector('.anuidade-desc');
        var actions = secOverlay.querySelector('.anuidade-actions');
        var T       = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';

        revealQueue.forEach(function (id) { clearTimeout(id); });
        revealQueue = [];

        if (eyebrow) {
            eyebrow.style.transition = 'none';
            eyebrow.style.opacity    = '0';
            eyebrow.style.filter     = bf(16);
            eyebrow.style.transform  = 'translateY(-16px)';
        }
        if (title) title.style.opacity = '0';
        if (desc) {
            desc.style.transition = 'none';
            desc.style.opacity    = '0';
            desc.style.filter     = bf(16);
            desc.style.transform  = 'translateY(16px)';
        }
        if (actions) {
            actions.style.transition = 'none';
            actions.style.opacity    = '0';
            actions.style.filter     = bf(16);
            actions.style.transform  = 'translateY(16px)';
        }
        if (titleSpans) {
            titleSpans.forEach(function (sp) {
                sp.style.transition = 'none';
                sp.style.opacity    = '0';
                sp.style.filter     = bf(8);
                sp.style.transform  = 'translateY(32px)';
            });
        }

        void secOverlay.offsetWidth;

        /* Delay = FADE: anim só dispara quando sec-anuidade está 100% no viewport */
        revealQueue.push(setTimeout(function () {
            if (eyebrow) {
                eyebrow.style.transition = T;
                eyebrow.style.opacity    = '1';
                eyebrow.style.filter     = bf(0);
                eyebrow.style.transform  = 'translateY(0)';
            }
            if (actions) {
                actions.style.transition = T;
                actions.style.opacity    = '1';
                actions.style.filter     = bf(0);
                actions.style.transform  = 'translateY(0)';
            }
            if (title) title.style.opacity = '1';
            if (titleSpans) {
                titleSpans.forEach(function (sp) { sp.style.transition = T; });
                void secOverlay.offsetWidth;
                titleSpans.forEach(function (sp, idx) {
                    revealQueue.push(setTimeout(function () {
                        sp.style.opacity   = '1';
                        sp.style.filter    = bf(0);
                        sp.style.transform = 'translateY(0)';
                    }, idx * 10));
                });
            }
            revealQueue.push(setTimeout(function () {
                if (desc) {
                    desc.style.transition = T;
                    desc.style.opacity    = '1';
                    desc.style.filter     = bf(0);
                    desc.style.transform  = 'translateY(0)';
                }
            }, 150));
        }, FADE));
    }

    window.addEventListener('wheel', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (fading) return;

        var dy = e.deltaY;
        if (e.deltaMode === 1) dy *= 40;
        if (e.deltaMode === 2) dy *= window.innerHeight;
        var t = trigger();

        if (state === 0) {
            if (dy > 0) {
                if (lTgt >= t - 1) {
                    /* Já no edge — acumula */
                    exitAcc += dy;
                    if (exitAcc >= EXIT_THR) {
                        exitAcc = 0;
                        state = 1;
                        setOverlay(true);
                        revealSec2();
                        lockFade();
                    }
                    return;
                }
                lTgt = Math.min(lTgt + dy, t);
                startLerp();
            } else if (dy < 0) {
                /* Dreno do acumulador antes de mover pra cima */
                if (exitAcc > 0) {
                    exitAcc = Math.max(0, exitAcc + dy);
                    return;
                }
                lTgt = Math.max(0, lTgt + dy);
                startLerp();
            }
        } else if (state === 1) {
            if (dy > 0) {
                /* popup → sec-faq: 1 wheel já avança body proporcional ao dy */
                state = 2;
                lCur = Math.max(window.scrollY || 0, t);
                lTgt = Math.min(t + 1 + dy, docMax());
                lRun = false;
                startLerp();
                lockFade();
            } else if (dy < 0) {
                /* popup → sec-oferta: auto slide-down + sec-oferta restaura */
                state = 0;
                setOverlay(false);
                lockFade();
            }
        } else if (state === 2) {
            /* Wheel up cruzando o trigger: snap exato + state 1 (popup volta) */
            if (dy < 0 && lTgt + dy <= t) {
                state = 1;
                window.scrollTo(0, t);
                lCur = t; lTgt = t; lRun = false;
                lockFade();
                return;
            }
            lTgt = Math.max(0, Math.min(lTgt + dy, docMax()));
            startLerp();
            syncOverlayForState2();
        }
    }, { passive: false });

    window.addEventListener('scroll', function () {
        /* syncOverlayForState2 SEMPRE roda — precisa atualizar mesmo durante o
           lerp (senão atravessar secFaq.offsetTop com wheel não esconde a popup). */
        syncOverlayForState2();

        if (fading) return;
        if (lRun || Date.now() - lEndedAt < 150) return;

        var y = window.scrollY || 0;
        var t = trigger();

        if (!lRun) {
            lCur = y;
            lTgt = y;
        }

        var newState = (y < t - 0.5) ? 0 : (y > t + 0.5) ? 2 : 1;
        if (newState !== state) {
            var prevState = state;

            /* Mobile/touch transitions — snap exato pro trigger e trava body
               com overflow:hidden, absorvendo o momentum do swipe. */

            if (prevState === 0 && newState !== 0) {
                /* Mobile: momentum nativo passou do trigger. Snapa de volta
                   SEM transicionar — a transição pra popup é responsabilidade
                   do touchend handler (gesto deliberado). */
                window.scrollTo(0, t);
                lCur = t; lTgt = t; lRun = false;
                return;
            }

            if (prevState === 2 && newState !== 2) {
                state = 1;
                window.scrollTo(0, t);
                lCur = t; lTgt = t; lRun = false;
                setOverlay(true);
                lockFadeHard();
                return;
            }

            if (prevState === 1 && newState === 0) {
                state = 0;
                window.scrollTo(0, t);
                lCur = t; lTgt = t; lRun = false;
                setOverlay(false);
                lockFadeHard();
                return;
            }

            state = newState;
            setOverlay(newState === 1 || newState === 2);
            exitAcc = 0;
        }

        /* Em state 2 (qualquer mudança de scrollY): sec-anuidade some quando
           sec-faq já está completamente cobrindo, evitando sobrepor as seções
           que vêm abaixo de sec-faq. */
        syncOverlayForState2();
    }, { passive: true });

    /* Init: define lTgt/lCur com scrollY atual */
    lCur = window.scrollY || 0;
    lTgt = lCur;

    /* Estado inicial sincronizado caso a página carregue já após o trigger */
    window.addEventListener('load', function () {
        var y = window.scrollY || 0;
        var t = trigger();
        if (y >= t + 0.5) {
            state = 2;
            setOverlay(true);
        } else if (y >= t - 0.5) {
            state = 1;
            setOverlay(true);
        }
        syncOverlayForState2();
    });

    /* Resize: secFaq.offsetTop muda → re-avalia state + .is-hidden de sec-anuidade.
       Senão sec-anuidade reaparece sobre seções abaixo de sec-faq ao redimensionar. */
    window.addEventListener('resize', function () {
        var y = window.scrollY || 0;
        var t = trigger();
        var newState = (y < t - 0.5) ? 0 : (y > t + 0.5) ? 2 : 1;
        if (newState !== state) {
            state = newState;
            setOverlay(newState === 1 || newState === 2);
        }
        syncOverlayForState2();
    });

    /* Mobile: visual viewport muda quando a URL bar colapsa/aparece.
       Sem isso, trigger() recalcula só em wheel/scroll e a popup pode
       ficar fora de sync entre frames de redimensionamento. */
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', function () {
            var y = window.scrollY || 0;
            var t = trigger();
            var newState = (y < t - 0.5) ? 0 : (y > t + 0.5) ? 2 : 1;
            if (newState !== state) {
                state = newState;
                setOverlay(newState === 1 || newState === 2);
            }
            syncOverlayForState2();
        });
    }
})();

/* ── Reveal: pilares-profs passa por cima de sec-projetos ──
   Mimica position:sticky bottom:0, mas via translateY pra funcionar em qualquer
   altura de sec-projetos (inclusive quando maior que o viewport). Quando o
   BOTTOM natural de sec-projetos atinge o rodapé do viewport, sec-projetos é
   "pinado" ali via transform; pilares-profs (sibling, z-index 1, bg escuro)
   continua na flow natural e sobe por cima cobrindo. Cap de 1 viewport: depois
   do reveal completo, sec-projetos rola normalmente pra fora. */
(function () {
    var track = document.querySelector('.projetos-pilares-track');
    if (!track) return;
    var sec = track.querySelector('.sec-projetos');
    var pilares = track.querySelector('.pilares-profs');
    if (!sec || !pilares) return;

    var raf = null;

    /* offsetTop traversal: posição natural sem incluir transforms aplicados */
    function getNaturalTop(el) {
        var y = 0;
        var cur = el;
        while (cur) {
            y += cur.offsetTop;
            cur = cur.offsetParent;
        }
        return y;
    }

    function update() {
        raf = null;
        var secBottomDoc = getNaturalTop(sec) + sec.offsetHeight;
        var secBottomVp = secBottomDoc - (window.scrollY || 0);
        var vh = window.innerHeight;
        var overshoot = vh - secBottomVp;

        if (overshoot <= 0) {
            if (sec.style.transform) sec.style.transform = '';
        } else {
            /* Cap em vh: depois disso, pilares-profs já cobriu totalmente,
               sec pode rolar pra fora naturalmente */
            var pin = overshoot < vh ? overshoot : vh;
            sec.style.transform = 'translateY(' + pin + 'px)';
        }
    }

    function schedule() {
        if (raf) return;
        raf = requestAnimationFrame(update);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
})();

/* ── Reveal animation: sec-eyebrow + sec-title (char-by-char) + sec-lede ──
   Imita o padrão de home.html. CSS já define o estado inicial (opacity 0 +
   blur + translate). JS prepara o título quebrado em chars (cada char em
   span com initial state) e dispara via IntersectionObserver: eyebrow imediato,
   title char-by-char com 10ms de stagger, lede com 150ms de atraso. */
(function () {
    var T = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';

    function prepareTitle(title) {
        if (title.dataset.animPrepared) return title._animSpans || [];
        title.dataset.animPrepared = '1';
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
        Array.from(title.childNodes).forEach(walk);
        spans.forEach(function (sp) {
            sp.style.display = 'inline-block';
            sp.style.opacity = '0';
            sp.style.filter = bf(8);
            sp.style.transform = 'translateY(32px)';
            sp.style.transition = T;
        });
        title._animSpans = spans;
        return spans;
    }

    function animateHeader(eyebrow, title, lede) {
        if (eyebrow) {
            eyebrow.style.opacity = '1';
            eyebrow.style.filter = bf(0);
            eyebrow.style.transform = 'translateY(0)';
        }
        if (title) {
            var spans = prepareTitle(title);
            title.style.opacity = '1';
            spans.forEach(function (sp, idx) {
                setTimeout(function () {
                    sp.style.opacity = '1';
                    sp.style.filter = bf(0);
                    sp.style.transform = 'translateY(0)';
                }, idx * 10);
            });
        }
        if (lede) {
            setTimeout(function () {
                lede.style.opacity = '1';
                lede.style.filter = bf(0);
                lede.style.transform = 'translateY(0)';
            }, 150);
        }
    }

    /* Prepara todos os títulos no load pra evitar flash de texto sem spans
       Inclui hero-h1 (animado separadamente no load, não via observer). */
    document.querySelectorAll('.sec-title, .hero-h1').forEach(prepareTitle);

    /* ── Hero entry: dispara imediatamente no load (above the fold) ── */
    function animateHero() {
        var topTagBody = document.querySelector('.hero-top-tag-body');
        var tagStatuses = document.querySelectorAll('.hero-tags .tag-status');
        var h1 = document.querySelector('.hero-h1');
        var p = document.querySelector('.hero-p');

        if (topTagBody) {
            topTagBody.style.opacity = '1';
            topTagBody.style.transform = 'translateY(0)';
        }
        tagStatuses.forEach(function (tag) {
            tag.style.opacity = '1';
            tag.style.filter = bf(0);
            tag.style.transform = 'translateY(0)';
        });
        if (h1) {
            var spans = prepareTitle(h1);
            h1.style.opacity = '1';
            spans.forEach(function (sp, idx) {
                setTimeout(function () {
                    sp.style.opacity = '1';
                    sp.style.filter = bf(0);
                    sp.style.transform = 'translateY(0)';
                }, idx * 10);
            });
        }
        if (p) {
            setTimeout(function () {
                p.style.opacity = '1';
                p.style.filter = bf(0);
                p.style.transform = 'translateY(0)';
            }, 150);
        }
        /* hero-actions buttons: mesma animação de .completa-tile em home.html
           (cta-card-enter, 0.6s). Stagger de 100ms entre eles, após o lede. */
        document.querySelectorAll('.hero-actions .btn').forEach(function (btn, i) {
            setTimeout(function () {
                btn.classList.add('is-entered');
            }, 250 + i * 100);
        });
    }
    /* Espera 2 frames pra garantir que o estado inicial CSS foi pintado antes
       de aplicar os estilos finais (caso contrário, transição não dispara). */
    requestAnimationFrame(function () {
        requestAnimationFrame(animateHero);
    });

    /* Observer: dispara quando o título entra na viewport (com margem -25% bottom
       pra esperar o usuário rolar até a área visível antes da animação) */
    var OPT = { rootMargin: '0px 0px -25% 0px', threshold: 0 };

    document.querySelectorAll('.sec-title').forEach(function (title) {
        var parent = title.parentNode;
        if (!parent) return;
        var eyebrow = parent.querySelector('.sec-eyebrow');
        /* lede pode estar fora do parent imediato (ex: .cta-sub é irmão do .cta-header).
           Procura no parent primeiro; se não achar, sobe um nível. */
        var lede = parent.querySelector('.sec-lede, .cta-sub');
        if (!lede && parent.parentNode) {
            lede = parent.parentNode.querySelector('.sec-lede, .cta-sub');
        }

        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                obs.unobserve(title);
                animateHeader(eyebrow, title, lede);
            });
        }, OPT);
        obs.observe(title);
    });

    /* meta-card: entrada com fade/blur/translate + glow contínuo. Dispara
       na carga da página (não no scroll/intersection), porque o card vive
       no fold do hero — esperar scroll não fazia sentido. Stagger de 80ms
       entre múltiplos cards. Dois rAFs garantem que o estado inicial CSS
       foi pintado antes do .is-entered (sem isso, transition não dispara). */
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            document.querySelectorAll('.meta-card').forEach(function (card, i) {
                setTimeout(function () {
                    card.classList.add('is-entered');
                }, i * 80);
            });
        });
    });

    /* skill-tile, course-card, etc: mesma animação de .completa-tile em home.html
       (cta-card-enter, 0.6s). Stagger de 40ms entre elementos.
       Stagger usa ordem de intersecção (não DOM) — assim cards fora do viewport
       inicial (ex: clones do depos-carousel) não consomem delay dos visíveis. */
    function observeWithStagger(selector) {
        var staggerIdx = 0;
        document.querySelectorAll(selector).forEach(function (el) {
            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    obs.unobserve(el);
                    var delay = staggerIdx * 40;
                    staggerIdx++;
                    setTimeout(function () {
                        el.classList.add('is-entered');
                    }, delay);
                });
            }, OPT);
            obs.observe(el);
        });
    }
    /* Observer único pra containers (animam como um bloco) */
    function observeSingle(selector) {
        document.querySelectorAll(selector).forEach(function (el) {
            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    obs.unobserve(el);
                    el.classList.add('is-entered');
                });
            }, OPT);
            obs.observe(el);
        });
    }
    observeSingle('.skills-grid');
    observeSingle('.courses-grid');
    observeSingle('.projetos-grid');
    observeSingle('.extras-grid');
    observeSingle('.faq-grid');
    observeSingle('.depos-nav');
    observeSingle('.conta-grid');

    /* sec-stats: dispara na carga (não no scroll), mesmo padrão do .meta-card
       — vive no fold do hub e não fazia sentido esperar intersection. */
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            document.querySelectorAll('.sec-stats').forEach(function (el) {
                el.classList.add('is-entered');
            });
        });
    });

    observeWithStagger('.pilar-item');
    observeWithStagger('.prof-card');
    observeWithStagger('.depos-card');
    observeWithStagger('.perfis-row');
    observeWithStagger('.oferta-card');
    observeWithStagger('.cta-right .tag-status, .cta-right .btn');
    observeWithStagger('.why-card');

    /* depos-header: anima depos-social-proof (vindo de cima) e depos-stars
       (vindo de baixo) quando o header entra no viewport. Observer separado
       porque esses elementos não são cobertos por animateHeader. */
    var depHeader = document.querySelector('.depos-header');
    if (depHeader) {
        var depSocialProof = depHeader.querySelector('.depos-social-proof');
        var depStars = depHeader.querySelector('.depos-stars');
        var depObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                depObs.unobserve(depHeader);
                if (depSocialProof) {
                    depSocialProof.style.opacity = '1';
                    depSocialProof.style.filter = bf(0);
                    depSocialProof.style.transform = 'translateY(0)';
                }
                if (depStars) {
                    depStars.style.opacity = '1';
                    depStars.style.filter = bf(0);
                    depStars.style.transform = 'translateY(0)';
                }
            });
        }, OPT);
        depObs.observe(depHeader);
    }
})();
