/* ═══════════════════════════════════════════════════════════════════════
   Área de Membros | Imersão Claude & IA para Negócios
   Lógica exclusiva da home da área de membros (/ed/evento/ician/membros/).
   Antes ficava inline no index.html; externalizado aqui.
   Três blocos: (1) popup Certificado, (2) carrossel + min-height do bg,
   (3) popup ao clicar num card.
   ═══════════════════════════════════════════════════════════════════════ */

/* ── (1) Popup Certificado ──────────────────────────────────────────────
   O menu-topo.js abre (#aula-modal-certificado); aqui preenchemos o
   progresso a partir do localStorage e fechamos no botão/backdrop. */
(function () {
    var cert = document.getElementById('aula-modal-certificado');
    if (!cert) return;
    var TOTAL = 4;
    var conc = [];
    try { conc = JSON.parse(localStorage.getItem('xp-imersao-concluidas') || '[]') || []; } catch (_) {}
    var feitas = conc.filter(function (n) { return n >= 0 && n < TOTAL; }).length;
    var pct = TOTAL ? Math.round(feitas / TOTAL * 100) : 0;
    var elCount = cert.querySelector('[data-progress-count]'); if (elCount) elCount.textContent = feitas + '/' + TOTAL;
    var elPct = cert.querySelector('[data-progress-pct]'); if (elPct) elPct.textContent = pct + '%';
    var elRing = cert.querySelector('[data-progress-ring]'); if (elRing) elRing.style.strokeDashoffset = (100 - pct);
    var elProg = cert.querySelector('.aula-progress'); if (elProg) elProg.classList.toggle('is-complete', pct === 100);
    var fechar = cert.querySelector('[data-cert-fechar]');
    if (fechar) fechar.addEventListener('click', function () { cert.classList.remove('is-open'); });
    cert.addEventListener('click', function (e) { if (e.target === cert) cert.classList.remove('is-open'); });
})();

/* ── (2) Carrossel de cards + min-height do bg ──────────────────────── */
(function () {
    /* Carrossel de cards: botões navegam um card (largura + gap) por clique. */
    var track = document.querySelector('.plat-cards-track');
    var prev = document.querySelector('.plat-cards [data-prev]');
    var next = document.querySelector('.plat-cards [data-next]');
    if (track && prev && next) {
        function passo() {
            var card = track.querySelector('.plat-card');
            if (!card) return track.clientWidth;
            var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
            return card.offsetWidth + gap;
        }
        /* desativa prev/next quando não há anterior/próximo */
        function atualizar() {
            var max = track.scrollWidth - track.clientWidth;
            prev.disabled = track.scrollLeft <= 1;
            next.disabled = track.scrollLeft >= max - 1;
        }
        prev.addEventListener('click', function () { track.scrollBy({ left: -passo(), behavior: 'smooth' }); });
        next.addEventListener('click', function () { track.scrollBy({ left:  passo(), behavior: 'smooth' }); });
        track.addEventListener('scroll', atualizar, { passive: true });
        window.addEventListener('resize', atualizar);
        atualizar();
    }

    /* min-height do bg = altura do menu-topo + do hero (altura do hero é dinâmica).
       O menu-topo carrega assíncrono (externo), então medimos por dentro com fallback 72px. */
    var platBg = document.querySelector('.plat-bg');
    var platHero = document.querySelector('.plat-hero');
    if (platBg && platHero) {
        function ajustarBg() {
            if (window.matchMedia('(max-width: 864px)').matches) {
                platBg.style.minHeight = '';   /* abaixo de 864: volta ao 16:9 puro */
            } else {
                var menu = document.querySelector('.menu-topo');
                var menuH = menu ? menu.offsetHeight : 72;
                platBg.style.minHeight = (menuH + platHero.offsetHeight) + 'px';
            }
        }
        window.addEventListener('resize', ajustarBg);
        window.addEventListener('load', ajustarBg);
        /* recalcula quando o menu externo terminar de injetar */
        document.addEventListener('menu-topo:ready', ajustarBg);
        ajustarBg();
    }
})();

/* ── (3) Popup ao clicar num card (visual = .course-modal .lb-modal do /ed/areas/) ── */
(function () {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.plat-card'));
    if (!cards.length) return;

    /* progresso salvo pela página de aulas (mesma origem): concluídas + fração assistida por vídeo */
    var CONCLUIDAS = [];
    try { CONCLUIDAS = JSON.parse(localStorage.getItem('xp-imersao-concluidas') || '[]') || []; } catch (_) {}
    /* ?cert=full → simula todas as aulas concluídas (barras dos cards cheias) pra testar. */
    if (new URLSearchParams(location.search).get('cert') === 'full') { CONCLUIDAS = [0, 1, 2, 3]; }
    var VIDEO_PROG = {};
    try { VIDEO_PROG = JSON.parse(localStorage.getItem('xp-imersao-video-progresso') || '{}') || {}; } catch (_) {}

    /* dados das aulas (imagem + título vêm do DOM; data/horário/professor/desc daqui) */
    var DADOS = [
        {
            data: '', horario: '', professor: '',
            desc: [
                'Logo, alguém na sua empresa será a referência quando o assunto for IA.',
                'A pergunta é: Quem?',
                'Há uma diferença enorme entre usar IA para escrever um texto e usar Claude como camada de trabalho para automatizar processos e apoiar decisões.',
                'Aprenda a usar Claude, Claude Code e Cowork na prática na Imersão Claude & IA para Negócios.'
            ]
        },
        {
            data: '21/07', horario: '19h30', professor: 'Leonardo Karpinski e Sayuri Valente',
            desc: [
                'Você ainda acha que o Claude é só um chatbot?',
                'Nesta primeira aula, conheça o ecossistema da Anthropic e quando usar Claude Chat, Cowork e Code.',
                'Também apresentamos o Panorama de Dados & IA 2026 e como a IA transforma áreas de negócio como Finanças, RH, Comercial e BI.'
            ]
        },
        {
            data: '22/07', horario: '19h30', professor: 'Iago Braz e Leonardo Karpinski',
            desc: [
                'Descubra como usar Claude Cowork para automatizar tarefas do dia a dia, organizar informações e ganhar produtividade com IA.',
                'Iago Braz e Leonardo Karpinski mostram aplicações práticas para trabalhar de forma mais inteligente, sem soluções complexas.'
            ]
        },
        {
            data: '23/07', horario: '19h30', professor: 'Leonardo Karpinski',
            desc: [
                'Já imaginou transformar uma ideia em um aplicativo funcionando com IA?',
                'Leonardo Karpinski abre os bastidores dos projetos que a Xperiun criou com Claude Code.',
                'Veja como usamos IA para acelerar o desenvolvimento e reduzir o tempo entre a ideia e a execução.'
            ]
        }
    ];
    /* vídeos por card (0,1,3 têm; o 2/aula02 só tem imagem) */
    var CARD_VIDEOS = [
        '/ed/evento/ician/membros/dependencias/plat-card-img-aula00.mp4',
        '/ed/evento/ician/membros/dependencias/plat-card-img-aula01.mp4',
        '',
        '/ed/evento/ician/membros/dependencias/plat-card-img-aula03.mp4'
    ];
    var projects = cards.map(function (c, i) {
        var img = c.querySelector('.plat-card-img');
        var title = c.querySelector('.plat-card-title');
        var d = DADOS[i] || {};
        return {
            image: img ? (img.currentSrc || img.src) : '',
            video: CARD_VIDEOS[i] || '',
            title: title ? title.textContent : '',
            data: d.data || '', horario: d.horario || '', professor: d.professor || '',
            desc: d.desc || [],
            assistirHref: '/ed/evento/ician/membros/aulas/?aula=' + i
        };
    });

    var modal, backdrop, card, media, mediaVideo, titleEl, descEl, statsEl, val = {}, navPrev, navNext, assistirBtn, dotsEl;
    var index = 0, isOpen = false, built = false;

    function ce(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
    function mkStat(label) {
        var el = ce('div', 'course-modal-stat');
        var text = ce('div', 'course-modal-stat-text');
        var l = ce('span', 'course-modal-stat-label'); l.textContent = label;
        var v = ce('span', 'course-modal-stat-value');
        text.appendChild(l); text.appendChild(v); el.appendChild(text);
        return { el: el, value: v };
    }
    function mkNav(icon, label) {
        var b = ce('button', 'btn lb-nav'); b.type = 'button';
        b.setAttribute('data-size', 'm'); b.setAttribute('data-icon', ''); b.setAttribute('data-emphasis', 'subtle');
        b.setAttribute('aria-label', label);
        b.innerHTML = '<span class="material-symbols-outlined">' + icon + '</span>';
        return b;
    }
    function build() {
        modal = ce('div', 'course-modal lb-modal');
        backdrop = ce('div', 'course-modal-backdrop');
        card = ce('div', 'course-modal-card lb-card');
        card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true');

        var closeBtn = ce('button', 'btn course-modal-close'); closeBtn.type = 'button';
        closeBtn.setAttribute('data-size', 's'); closeBtn.setAttribute('data-emphasis', 'subtle'); closeBtn.textContent = 'Sair';

        media = ce('div', 'course-modal-media');
        mediaVideo = ce('video', 'course-modal-media-video');
        mediaVideo.muted = true; mediaVideo.loop = true; mediaVideo.setAttribute('playsinline', ''); mediaVideo.preload = 'metadata';
        media.appendChild(mediaVideo);
        titleEl = ce('h3', 'course-modal-title'); media.appendChild(titleEl);

        var body = ce('div', 'course-modal-body');
        statsEl = ce('div', 'course-modal-stats');
        [['Data', 'data'], ['Horário', 'horario'], ['Professor', 'professor']].forEach(function (pair) {
            var m = mkStat(pair[0]); val[pair[1]] = m; statsEl.appendChild(m.el);
        });
        descEl = ce('div', 'course-modal-desc');

        var foot = ce('div', 'lb-foot');
        dotsEl = ce('div', 'lb-dots');
        assistirBtn = ce('a', 'btn'); assistirBtn.setAttribute('data-size', 's-ico'); assistirBtn.setAttribute('data-emphasis', 'high');
        assistirBtn.href = '#'; assistirBtn.innerHTML = '<span class="material-symbols-outlined is-filled">play_arrow</span>Assistir agora';
        foot.appendChild(dotsEl); foot.appendChild(assistirBtn);

        navPrev = mkNav('chevron_left', 'Anterior');
        navNext = mkNav('chevron_right', 'Próximo');
        var navRow = ce('div', 'lb-nav-row'); navRow.appendChild(navPrev); navRow.appendChild(navNext);

        body.appendChild(statsEl); body.appendChild(descEl); body.appendChild(foot); body.appendChild(navRow);
        card.appendChild(closeBtn); card.appendChild(media); card.appendChild(body);
        modal.appendChild(backdrop); modal.appendChild(card);
        document.body.appendChild(modal);

        backdrop.addEventListener('click', fechar);
        closeBtn.addEventListener('click', function (e) { e.stopPropagation(); fechar(); });
        navPrev.addEventListener('click', function (e) { e.stopPropagation(); ir(index - 1); });
        navNext.addEventListener('click', function (e) { e.stopPropagation(); ir(index + 1); });
        card.addEventListener('click', function (e) { e.stopPropagation(); });
        document.addEventListener('keydown', function (e) {
            if (!isOpen) return;
            if (e.key === 'Escape') fechar();
            else if (e.key === 'ArrowRight') ir(index + 1);
            else if (e.key === 'ArrowLeft') ir(index - 1);
        });
        built = true;
    }
    function renderDots() {
        dotsEl.innerHTML = '';
        projects.forEach(function (_, i) {
            var d = ce('button', 'lb-dot'); d.type = 'button'; d.setAttribute('aria-label', 'Ir para ' + (i + 1));
            d.addEventListener('click', function (e) { e.stopPropagation(); ir(i); });
            dotsEl.appendChild(d);
        });
    }
    function render() {
        var pr = projects[index] || {};
        media.style.backgroundImage = 'url("' + pr.image + '")';   /* imagem estática = holder/fallback */
        if (pr.video) {
            mediaVideo.poster = pr.image;
            if (mediaVideo.getAttribute('src') !== pr.video) { mediaVideo.src = pr.video; }
            mediaVideo.style.display = '';
            if (isOpen) mediaVideo.play().catch(function () {});
        } else {
            mediaVideo.pause(); mediaVideo.removeAttribute('src'); mediaVideo.style.display = 'none';
        }
        titleEl.textContent = pr.title || '';
        [['data', pr.data], ['horario', pr.horario], ['professor', pr.professor]].forEach(function (pair) {
            var s = val[pair[0]];
            s.value.textContent = pair[1] || '';
            s.el.style.display = pair[1] ? '' : 'none';   /* esconde o stat sem valor */
        });
        statsEl.style.display = (pr.data || pr.horario || pr.professor) ? '' : 'none';   /* aula sem stats (ex.: intro) esconde a linha */
        descEl.innerHTML = '';
        (pr.desc || []).forEach(function (para) {
            var pEl = document.createElement('p');
            pEl.textContent = para;
            descEl.appendChild(pEl);
        });
        if (pr.assistirHref) assistirBtn.href = pr.assistirHref;
        Array.prototype.forEach.call(dotsEl.children, function (d, i) { d.classList.toggle('is-active', i === index); });
    }
    function ir(i) {
        var n = projects.length; if (!n) return;
        index = (i % n + n) % n;   /* navega em loop, mantém os navs */
        render();
    }
    function abrir(i) {
        if (!built) build();
        index = i; isOpen = true;
        document.body.style.overflow = 'hidden';
        renderDots(); render();
        modal.classList.add('is-open');
    }
    function fechar() {
        if (!isOpen) return;
        isOpen = false;
        if (mediaVideo) mediaVideo.pause();
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
    }
    cards.forEach(function (c, i) {
        c.style.cursor = 'pointer';
        /* barra de progresso do card: fração assistida; concluída = cheia em sg500 */
        var fill = c.querySelector('.plat-card-progress-fill');
        var bar = c.querySelector('.plat-card-progress');
        if (fill) {
            var done = CONCLUIDAS.indexOf(i) > -1;
            var frac = done ? 1 : (VIDEO_PROG[i] || 0);
            fill.style.width = Math.round(Math.max(0, Math.min(1, frac)) * 100) + '%';
            if (bar) bar.classList.toggle('is-done', done);
        }
        /* vídeo do card (0,1,3): toca no hover, imagem estática por baixo */
        var vsrc = CARD_VIDEOS[i];
        if (vsrc) {
            var cimg = c.querySelector('.plat-card-img');
            var cvid = document.createElement('video');
            cvid.className = 'plat-card-video';
            cvid.muted = true; cvid.loop = true; cvid.setAttribute('playsinline', ''); cvid.preload = 'none';
            cvid.src = vsrc;
            if (cimg) { cvid.poster = cimg.currentSrc || cimg.src; cimg.insertAdjacentElement('afterend', cvid); }
            c.addEventListener('mouseenter', function () { cvid.play().catch(function () {}); });
            c.addEventListener('mouseleave', function () { cvid.pause(); try { cvid.currentTime = 0; } catch (_) {} });
        }
        c.addEventListener('click', function (e) {
            if (e.target.closest('.plat-card-play')) { location.href = projects[i].assistirHref; return; }   /* play → direto pra aula */
            abrir(i);   /* resto do card → popup */
        });
    });
})();
