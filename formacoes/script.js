
/* ── sec-depos: avatares aleatórios ── */
(function () {
    var thumbs = [
        '../media/depoimento-video-thumb-claudio.webp',
        '../media/depoimento-video-thumb-cleiton.webp',
        '../media/depoimento-video-thumb-daniel.webp',
        '../media/depoimento-video-thumb-edson.webp',
        '../media/depoimento-video-thumb-eduardo.webp',
        '../media/depoimento-video-thumb-ezequiel.webp',
        '../media/depoimento-video-thumb-gabriel.webp',
        '../media/depoimento-video-thumb-louiz.webp',
        '../media/depoimento-video-thumb-pedro.webp',
        '../media/depoimento-video-thumb-vinicius.webp',
        '../media/depoimento-video-thumb-vitoria.webp'
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
        { src: '../media/logos/vale.svg',          alt: 'Vale' },
        { src: '../media/logos/mercedes-benz.svg', alt: 'Mercedes-Benz' },
        { src: '../media/logos/bradesco.svg',       alt: 'Bradesco' },
        { src: '../media/logos/santander.svg',      alt: 'Santander' },
        { src: '../media/logos/cpfl.svg',           alt: 'CPFL' },
        { src: '../media/logos/ambev.svg',          alt: 'Ambev' },
        { src: '../media/logos/magalu.svg',         alt: 'Magalu' },
        { src: '../media/logos/nestle.svg',         alt: 'Nestlé' },
        { src: '../media/logos/inter.svg',          alt: 'Inter' },
        { src: '../media/logos/google-brasil.svg',  alt: 'Google Brasil' },
        { src: '../media/logos/localiza.svg',       alt: 'Localiza' },
        { src: '../media/logos/porto-seguro.svg',   alt: 'Porto Seguro' },
        { src: '../media/logos/klabin.svg',         alt: 'Klabin' },
        { src: '../media/logos/suzano.svg',         alt: 'Suzano' },
        { src: '../media/logos/sicoob.svg',         alt: 'Sicoob' },
        { src: '../media/logos/cbf.svg',            alt: 'CBF' },
        { src: '../media/logos/air-liquide.svg',    alt: 'Air Liquide' },
        { src: '../media/logos/3m.svg',             alt: '3M' },
        { src: '../media/logos/cielo.svg',          alt: 'Cielo' },
        { src: '../media/logos/globo.svg',          alt: 'Globo' },
        { src: '../media/logos/neoway.svg',         alt: 'Neoway' },
        { src: '../media/logos/natura.svg',         alt: 'Natura' },
        { src: '../media/logos/claro.svg',          alt: 'Claro' }
    ];
    var grid = document.getElementById('depos-logos-grid');
    if (!grid) return;
    var imgs = Array.from(grid.querySelectorAll('.depos-logo-card img'));
    var queue = [];
    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }
    function refillQueue(exclude) {
        var pool = logos.filter(function(l) { return exclude.indexOf(l) === -1; });
        queue = queue.concat(shuffle(pool.length ? pool : logos));
    }
    function visibleImgs() {
        return imgs.filter(function(img) { return img.closest('.depos-logo-card').offsetHeight > 0; });
    }
    function init() {
        var visible = visibleImgs();
        var initial = shuffle(logos).slice(0, visible.length);
        visible.forEach(function(img, i) {
            img.src = initial[i].src;
            img.alt = initial[i].alt;
            img.style.opacity = '0.5';
        });
        refillQueue(initial);
    }
    var lastImg = null;
    function tick() {
        var visible = visibleImgs();
        if (!visible.length) return;
        if (!queue.length) refillQueue([]);
        var candidates = visible.length > 1 ? visible.filter(function(i) { return i !== lastImg; }) : visible;
        var img = candidates[Math.floor(Math.random() * candidates.length)];
        lastImg = img;
        var next = queue.shift();
        img.style.opacity = '0';
        img.style.filter  = 'blur(16px)';
        setTimeout(function () {
            img.src = next.src;
            img.alt = next.alt;
            img.style.opacity = '0.5';
            img.style.filter  = 'blur(0px)';
        }, 600);
    }
    init();
    setInterval(tick, 1400);
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

/* ── sec-perfis: accordion ── */
(function () {
    document.querySelectorAll('.sec-perfis .perfis-row').forEach(function (details) {
        var summary = details.querySelector('.perfis-q');
        var grid    = details.querySelector('.perfis-a-grid');
        var icon    = details.querySelector('.perfis-q-icon');
        summary.addEventListener('click', function (e) {
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

/* ── sec-faq: accordion ── */
(function () {
    document.querySelectorAll('.sec-faq .faq-row').forEach(function (details) {
        var summary = details.querySelector('.faq-q');
        var grid    = details.querySelector('.faq-a-grid');
        var icon    = details.querySelector('.faq-q-icon');
        summary.addEventListener('click', function (e) {
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
