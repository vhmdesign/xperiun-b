
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
        '../site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-claudio.webp',
        '../site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-cleiton.webp',
        '../site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-daniel.webp',
        '../site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-edson.webp',
        '../site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-eduardo.webp',
        '../site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-ezequiel.webp',
        '../site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-gabriel.webp',
        '../site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-louiz.webp',
        '../site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-pedro.webp',
        '../site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-vinicius.webp',
        '../site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-vitoria.webp'
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
        { src: '../site-dependencias/site-media/logos/logo-3m.webp',          alt: '3M' },
        { src: '../site-dependencias/site-media/logos/logo-airliquide.webp',  alt: 'Air Liquide' },
        { src: '../site-dependencias/site-media/logos/logo-ambev.webp',       alt: 'Ambev' },
        { src: '../site-dependencias/site-media/logos/logo-bradesco.webp',    alt: 'Bradesco' },
        { src: '../site-dependencias/site-media/logos/logo-cbf.webp',         alt: 'CBF' },
        { src: '../site-dependencias/site-media/logos/logo-cielo.webp',       alt: 'Cielo' },
        { src: '../site-dependencias/site-media/logos/logo-claro.webp',       alt: 'Claro' },
        { src: '../site-dependencias/site-media/logos/logo-cpfl.webp',        alt: 'CPFL' },
        { src: '../site-dependencias/site-media/logos/logo-globo.webp',       alt: 'Globo' },
        { src: '../site-dependencias/site-media/logos/logo-google.webp',      alt: 'Google' },
        { src: '../site-dependencias/site-media/logos/logo-inter.webp',       alt: 'Inter' },
        { src: '../site-dependencias/site-media/logos/logo-magalu.webp',      alt: 'Magalu' },
        { src: '../site-dependencias/site-media/logos/logo-mercedes.webp',    alt: 'Mercedes-Benz' },
        { src: '../site-dependencias/site-media/logos/logo-natura.webp',      alt: 'Natura' },
        { src: '../site-dependencias/site-media/logos/logo-neoway.webp',      alt: 'Neoway' },
        { src: '../site-dependencias/site-media/logos/logo-piracanjuba.webp', alt: 'Piracanjuba' },
        { src: '../site-dependencias/site-media/logos/logo-santander.webp',   alt: 'Santander' },
        { src: '../site-dependencias/site-media/logos/logo-suzano.webp',      alt: 'Suzano' },
        { src: '../site-dependencias/site-media/logos/logo-vale.webp',        alt: 'Vale' },
        { src: '../site-dependencias/site-media/logos/sicoob.webp',           alt: 'Sicoob' }
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

/* sec-oferta / sec-anuidade / sec-faq: comportamento UNIFICADO entre
   desktop e mobile via position: sticky puro em CSS (style.css).
   O antigo state machine + scroll-driven animation foi removido pra
   evitar a seção sumir ao alternar viewport e pra eliminar a animação
   de translate. Tudo é controlado por CSS sticky + z-index agora. */

/* ── --anuidade-vh: 1% do viewport visível REAL em pixels ──
   Atualizado em tempo real via visualViewport.resize (sem o delay do `dvh`
   no Chrome Android quando a barra de endereço aparece/some). Usado pelo CSS
   pra calcular position/height de sec-oferta/sec-anuidade/anuidade-sticky-wrap
   sem depender do `vh` "large viewport" estático do browser.
   Roda em DESKTOP e MOBILE — desktop também pode ter mudanças de viewport
   (resize de janela, pinch zoom, dev tools, etc.). */
(function () {
    function update() {
        var vv = window.visualViewport;
        var vh = vv ? vv.height : window.innerHeight;
        document.documentElement.style.setProperty('--anuidade-vh', (vh / 100) + 'px');
    }
    update();
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', update);
        window.visualViewport.addEventListener('scroll', update);
    }
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
})();

/* ── Animação scroll-driven dos elementos de sec-anuidade ──
   sec-anuidade fica sticky por 300vh (anuidade-sticky-wrap.height = 400vh).
   Fases (scrolled = -wrap.getBoundingClientRect().top, normalizada por vh):
     · 0    → 100vh : fade-in   (opacity 0 → 1, blur 16 → 0, translate → 0)
     · 100  → 200vh : hold      (estável)
     · 200  → 300vh : fade-out  (reverte tudo)
   Title é animado char-by-char com stagger: cada letra tem sua janela de
   animação dentro da fase de fade-in/out. Eyebrow/desc/actions usam
   translateY tradicional. */
(function () {
    var wrap    = document.querySelector('.anuidade-sticky-wrap');
    if (!wrap) return;
    var section = wrap.querySelector('.sec-anuidade');
    if (!section) return;

    var eyebrow = section.querySelector('.anuidade-eyebrow');
    var title   = section.querySelector('.anuidade-title');
    var desc    = section.querySelector('.anuidade-desc');
    var actions = section.querySelector('.anuidade-actions');

    /* Split do título em char-spans. Estrutura criada:
         <h2 class="anuidade-title">            ← recebe filter:blur (sem mask)
           <span class="anuidade-title-mask">   ← tem mask-image (sem filter)
             [wordWraps com char spans dentro]
           </span>
         </h2>
       A separação evita que a mask clippe o halo do blur. char spans só animam
       opacity + transform (o blur uniforme vem do .anuidade-title parent). */
    var titleSpans = [];
    if (title && !title.dataset.split) {
        title.dataset.split = '1';

        /* Move todos os children do title pra dentro de um novo wrapper de mask */
        var maskLayer = document.createElement('span');
        maskLayer.className = 'anuidade-title-mask';
        while (title.firstChild) {
            maskLayer.appendChild(title.firstChild);
        }
        title.appendChild(maskLayer);

        (function walk(node) {
            if (node.nodeType === 3) {
                var text = node.textContent;
                if (!text) return;
                var words = text.split(/(\s+)/);
                var frag = document.createDocumentFragment();
                words.forEach(function (word) {
                    if (/^\s+$/.test(word)) {
                        frag.appendChild(document.createTextNode(word));
                        return;
                    }
                    var wordWrap = document.createElement('span');
                    wordWrap.style.cssText = 'display:inline-block;white-space:nowrap;';
                    for (var c = 0; c < word.length; c++) {
                        var charSpan = document.createElement('span');
                        charSpan.textContent = word[c];
                        charSpan.style.cssText = 'display:inline-block;will-change:opacity,transform;opacity:0;transform:translateY(32px);';
                        wordWrap.appendChild(charSpan);
                        titleSpans.push(charSpan);
                    }
                    frag.appendChild(wordWrap);
                });
                node.parentNode.replaceChild(frag, node);
            } else if (node.nodeType === 1) {
                /* Recursão em element nodes (ex: <span style="font-weight:700">,
                   ou o nosso .anuidade-title-mask wrapper) */
                var children = Array.prototype.slice.call(node.childNodes);
                children.forEach(walk);
            }
        })(title);
    }

    /* Stagger config: cada char começa 10ms "após" o anterior (em tempo
       fictício). Char anima por 300ms. Total = (N-1)*10 + 300. A fração
       de cada char no total = 300/total. */
    var STAGGER_MS = 10;
    var ANIM_MS = 300;
    var totalChars = titleSpans.length;
    var totalMs = totalChars ? (totalChars - 1) * STAGGER_MS + ANIM_MS : ANIM_MS;
    var ANIM_FRACTION = ANIM_MS / totalMs;

    var rafId = null;
    function tick() {
        rafId = null;
        var rect = wrap.getBoundingClientRect();
        var scrolled = -rect.top;
        var vh = section.offsetHeight || window.innerHeight;

        var p;
        if      (scrolled <= 0)        p = 0;
        else if (scrolled <= vh)       p = scrolled / vh;
        else if (scrolled <= 2 * vh)   p = 1;
        else if (scrolled <= 3 * vh)   p = 1 - (scrolled - 2 * vh) / vh;
        else                           p = 0;

        /* Toggle .is-active no section enquanto sticky está engajado
           (fade-in + hold + fade-out). menu.js observa essa classe
           e recolhe o nav. Guard idempotente pra não disparar
           MutationObserver toda frame. */
        var shouldBeActive = scrolled > 0 && scrolled < 3 * vh;
        if (shouldBeActive !== section.classList.contains('is-active')) {
            section.classList.toggle('is-active', shouldBeActive);
        }

        var blur = 16 * (1 - p);
        var blurStr = 'blur(' + blur + 'px)';
        var slide = 16 * (1 - p);

        if (eyebrow) {
            eyebrow.style.opacity = p;
            eyebrow.style.filter = blurStr;
            eyebrow.style.transform = 'translateY(' + (-slide) + 'px)';
        }
        if (desc) {
            desc.style.opacity = p;
            desc.style.filter = blurStr;
            desc.style.transform = 'translateY(' + slide + 'px)';
        }
        if (actions) {
            actions.style.opacity = p;
            actions.style.filter = blurStr;
            actions.style.transform = 'translateY(' + slide + 'px)';
        }

        /* Title: filter uniforme no elemento externo (pra não ser clippado
           pela mask que vive no .anuidade-title-mask interno). Char spans
           só animam opacity + translate. */
        if (title) {
            title.style.filter = 'blur(' + (8 * (1 - p)) + 'px)';
        }
        if (totalChars) {
            for (var i = 0; i < totalChars; i++) {
                var startN = (i * STAGGER_MS) / totalMs;
                var pChar  = (p - startN) / ANIM_FRACTION;
                if      (pChar < 0) pChar = 0;
                else if (pChar > 1) pChar = 1;
                var sp = titleSpans[i];
                sp.style.opacity   = pChar;
                sp.style.transform = 'translateY(' + (32 * (1 - pChar)) + 'px)';
            }
        }
    }
    function schedule() {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(tick);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', schedule);
        window.visualViewport.addEventListener('scroll', schedule);
    }
    tick();
})();

/* ── Reveal: sec-anuidade sobe sobre sec-oferta (mobile ≤864px) ──
   sec-oferta é position: sticky; top: calc(100vh - var(--sec-oferta-height)),
   mesmo padrão de sec-projetos. CSS faz o pin. Esse IIFE só mantém
   --sec-oferta-height atualizada em tempo real. */
(function () {
    var oferta = document.querySelector('.oferta-anuidade-track .sec-oferta');
    if (!oferta) return;

    function update() {
        oferta.style.setProperty('--sec-oferta-height', oferta.offsetHeight + 'px');
    }

    update();

    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(update).observe(oferta);
    }
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', update);
    }
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
})();

/* ── Click handler especial: a[href="#sec-oferta"] (botão "Garantir minha vaga") ──
   scroll-suave.js scrolla pra el.offsetTop, que pousa no TOPO natural de
   sec-oferta — mostra o intro, não os cards de oferta. Como sec-oferta tem
   sticky-top NEGATIVO (calc(100vh - height)), os cards só ficam visíveis
   quando o sticky engata, em:
     scrollY = track.offsetTop + sec-oferta.height - viewport.height
   Esse handler roda em CAPTURE PHASE pra preceder o listener bubble-phase
   do scroll-suave em document, e chama stopPropagation pra impedir o
   scroll padrão. */
(function () {
    document.addEventListener('click', function (e) {
        var a = e.target.closest('a[href="#sec-oferta"]');
        if (!a) return;
        var track = document.querySelector('.oferta-anuidade-track');
        var sec = track && track.querySelector('.sec-oferta');
        if (!track || !sec) return;

        e.preventDefault();
        e.stopPropagation();

        var trackTop = track.getBoundingClientRect().top + window.scrollY;
        var dest = trackTop + sec.offsetHeight - window.innerHeight;
        if (dest < 0) dest = 0;

        window.scrollTo({ top: dest, behavior: 'smooth' });
    }, true);
})();

/* ── Reveal: pilares-profs sobe sobre sec-projetos ──
   sec-projetos é position: sticky; top: calc(100vh - var(--sec-projetos-height)).
   O CSS precisa saber a altura REAL de sec-projetos em pixels pra calcular o
   offset negativo. Esse IIFE atualiza --sec-projetos-height em tempo real:
    - ResizeObserver: dispara quando sec-projetos muda de tamanho (mudança de
      conteúdo, font load, breakpoint, etc.)
    - visualViewport.resize / window.resize: pra mudanças de vh (barra de
      endereço no mobile, rotação, redimensionamento de janela) — quando o vh
      muda, elementos dentro de sec-projetos que usam vh recalculam altura, o
      RO pega automaticamente, mas escutar aqui também garante atualização
      mesmo se a altura de sec não mudar (caso raro). */
(function () {
    var sec = document.querySelector('.projetos-pilares-track .sec-projetos');
    if (!sec) return;

    function update() {
        sec.style.setProperty('--sec-projetos-height', sec.offsetHeight + 'px');
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