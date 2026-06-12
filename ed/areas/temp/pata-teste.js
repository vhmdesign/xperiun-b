/* ═══════════════════════════════════════════════════════════
   Pasta 3D + Lightbox — protótipo (JS puro · cores Xperiun)
   - Abertura da pasta no hover: 100% CSS (:hover).
   - Clique no card → modal no estilo .course-modal (reusa o visual
     do style.css de Formações), com a animação de ENTRADA em FLIP
     (zoom a partir da posição do card).
   ═══════════════════════════════════════════════════════════ */
(function () {
    "use strict";

    /* Geometria dos 3 cards ao saírem da pasta */
    const CARD_X = ['-55px', '0px', '55px'];
    const CARD_R = ['-12deg', '0deg', '12deg'];
    const CARD_DELAY = ['0ms', '80ms', '160ms'];

    /* ── Modal (singleton, visual = .course-modal) ─────────── */
    const Lightbox = (function () {
        let modal, backdrop, card, media, titleEl, descEl,
            nivelVal, durVal, aulasVal, profVal, navPrev, navNext, allBtn, dotsEl;
        let projects = [], index = 0, isOpen = false, sourceCard = null, built = false;

        function build() {
            modal = document.createElement('div');
            modal.className = 'course-modal lb-modal';

            backdrop = document.createElement('div');
            backdrop.className = 'course-modal-backdrop';

            card = document.createElement('div');
            card.className = 'course-modal-card lb-card';
            card.setAttribute('role', 'dialog');
            card.setAttribute('aria-modal', 'true');

            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn course-modal-close';
            closeBtn.type = 'button';
            closeBtn.setAttribute('data-size', 's');
            closeBtn.setAttribute('data-emphasis', 'subtle');
            closeBtn.textContent = 'Sair';

            /* Mídia (imagem de fundo 16/9 + título sobreposto) */
            media = document.createElement('div');
            media.className = 'course-modal-media';
            titleEl = document.createElement('h3');
            titleEl.className = 'course-modal-title';
            media.appendChild(titleEl);

            /* Corpo: stats + descrição + rodapé com CTA */
            const body = document.createElement('div');
            body.className = 'course-modal-body';

            const stats = document.createElement('div');
            stats.className = 'course-modal-stats';
            const s0 = mkStat('Nível'); nivelVal = s0.value;
            const s1 = mkStat('Duração'); durVal = s1.value;
            const s2 = mkStat('Aulas'); aulasVal = s2.value;
            const s3 = mkStat('Professor'); profVal = s3.value;
            stats.appendChild(s0.el);
            stats.appendChild(s1.el);
            stats.appendChild(s2.el);
            stats.appendChild(s3.el);

            descEl = document.createElement('p');
            descEl.className = 'course-modal-desc';

            const foot = document.createElement('div');
            foot.className = 'lb-foot';
            dotsEl = document.createElement('div');
            dotsEl.className = 'lb-dots';
            allBtn = document.createElement('a');
            allBtn.className = 'btn';
            allBtn.setAttribute('data-size', 's');
            allBtn.setAttribute('data-emphasis', 'subtle');
            allBtn.href = '#';
            allBtn.textContent = 'Conhecer todos';
            foot.appendChild(dotsEl);
            foot.appendChild(allBtn);

            /* Navegação (estilo depos-nav: btn icon subtle), dentro do popup,
               logo abaixo do rodapé */
            navPrev = mkNav('chevron_left', 'Anterior');
            navNext = mkNav('chevron_right', 'Próximo');
            const navRow = document.createElement('div');
            navRow.className = 'lb-nav-row';
            navRow.appendChild(navPrev);
            navRow.appendChild(navNext);

            body.appendChild(stats);
            body.appendChild(descEl);
            body.appendChild(foot);
            body.appendChild(navRow);

            card.appendChild(closeBtn);
            card.appendChild(media);
            card.appendChild(body);

            modal.appendChild(backdrop);
            modal.appendChild(card);
            document.body.appendChild(modal);

            backdrop.addEventListener('click', close);
            closeBtn.addEventListener('click', function (e) { e.stopPropagation(); close(); });
            navPrev.addEventListener('click', function (e) { e.stopPropagation(); go(index - 1); });
            navNext.addEventListener('click', function (e) { e.stopPropagation(); go(index + 1); });
            card.addEventListener('click', function (e) { e.stopPropagation(); });
            document.addEventListener('keydown', onKey);

            built = true;
        }

        function mkStat(label) {
            const el = document.createElement('div');
            el.className = 'course-modal-stat';
            const text = document.createElement('div');
            text.className = 'course-modal-stat-text';
            const l = document.createElement('span');
            l.className = 'course-modal-stat-label';
            l.textContent = label;
            const v = document.createElement('span');
            v.className = 'course-modal-stat-value';
            text.appendChild(l);
            text.appendChild(v);
            el.appendChild(text);
            return { el: el, value: v };
        }

        function mkNav(icon, label) {
            const b = document.createElement('button');
            b.className = 'btn lb-nav';
            b.type = 'button';
            b.setAttribute('data-size', 'm');
            b.setAttribute('data-icon', '');
            b.setAttribute('data-emphasis', 'subtle');
            b.setAttribute('aria-label', label);
            b.innerHTML = '<span class="material-symbols-outlined">' + icon + '</span>';
            return b;
        }

        function onKey(e) {
            if (!isOpen) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowRight') go(index + 1);
            else if (e.key === 'ArrowLeft') go(index - 1);
        }

        function render() {
            const p = projects[index] || {};
            media.style.backgroundImage = 'url("' + p.image + '")';
            titleEl.textContent = p.title || '';
            nivelVal.textContent = p.nivel || '';
            nivelVal.style.color = p.nivel === 'Iniciante' ? 'var(--sc300)'
                : p.nivel === 'Intermediário' ? 'var(--wr300)'
                : p.nivel === 'Avançado' ? 'var(--er300)' : '';
            durVal.textContent = p.duracao || ',';
            aulasVal.textContent = p.aulas || ',';
            profVal.textContent = p.professor || ',';
            descEl.textContent = p.desc || '';
            if (p.allHref) allBtn.href = p.allHref;
            Array.prototype.forEach.call(dotsEl.children, function (d, i) {
                d.classList.toggle('is-active', i === index);
            });
        }

        function renderDots() {
            dotsEl.innerHTML = '';
            projects.forEach(function (_, i) {
                const d = document.createElement('button');
                d.type = 'button';
                d.className = 'lb-dot';
                d.setAttribute('aria-label', 'Ir para ' + (i + 1));
                d.addEventListener('click', function (e) { e.stopPropagation(); go(i); });
                dotsEl.appendChild(d);
            });
        }

        function go(i) {
            const n = projects.length;
            if (n === 0) return;
            index = (i % n + n) % n; /* dá a volta: infinito nos dois sentidos */
            render();
        }

        function open(items, startIndex, cardEl) {
            if (!built) build();
            projects = items;
            index = startIndex;
            sourceCard = cardEl;
            isOpen = true;
            document.body.style.overflow = 'hidden';

            renderDots();
            render();
            modal.classList.add('is-open'); /* visibilidade + fade do backdrop (do DS) */

            /* FLIP: mede o card no destino, encolhe sobre o card de origem e anima de volta */
            card.style.transition = 'none';
            card.style.opacity = '1';
            card.style.transform = 'none';
            const src = cardEl.getBoundingClientRect();
            const tgt = card.getBoundingClientRect();
            const scale = Math.max(src.width / tgt.width, src.height / tgt.height);
            const tx = (src.left + src.width / 2) - (tgt.left + tgt.width / 2);
            const ty = (src.top + src.height / 2) - (tgt.top + tgt.height / 2);
            card.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
            if (sourceCard) sourceCard.classList.add('is-hidden');

            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    card.style.transition = 'transform 0.4s ease-out';
                    card.style.transform = 'none';
                });
            });
        }

        function close() {
            if (!isOpen) return;
            isOpen = false;
            modal.classList.remove('is-open');
            card.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            card.style.transform = 'translateY(16px) scale(0.98)';
            card.style.opacity = '0';
            document.body.style.overflow = '';
            setTimeout(function () {
                if (sourceCard) { sourceCard.classList.remove('is-hidden'); sourceCard = null; }
                card.style.transition = 'none';
                card.style.transform = '';
                card.style.opacity = '';
            }, 320);
        }

        return { open: open };
    })();

    /* ── Fábrica de pasta ──────────────────────────────────── */
    function createFolder(data) {
        const root = document.createElement('div');
        root.className = 'folder3d';

        const glow = el('folder3d-glow');
        const stage = el('folder3d-stage');
        const back = el('folder3d-back');
        const tab = el('folder3d-tab');
        const front = el('folder3d-front');
        const shine = el('folder3d-shine');

        const cardsWrap = el('folder3d-cards');

        /* A pasta mostra só 3 cards (leque 3D), mas o popup navega a lista
           inteira (pode ter 4+). */
        let firstCard = null;
        const shown = data.projects.slice(0, 3);
        shown.forEach(function (p, i) {
            const c = document.createElement('button');
            c.className = 'folder3d-card';
            c.type = 'button';
            c.style.setProperty('--card-x', CARD_X[i]);
            c.style.setProperty('--card-r', CARD_R[i]);
            c.style.setProperty('--card-delay', CARD_DELAY[i]);
            c.style.zIndex = String(10 - i);

            const img = document.createElement('img');
            img.src = p.image; img.alt = p.title || ''; img.draggable = false;
            const grad = el('folder3d-card-grad');
            const t = document.createElement('span');
            t.className = 'folder3d-card-title';
            t.textContent = p.title || '';

            c.appendChild(img);
            c.appendChild(grad);
            c.appendChild(t);
            c.addEventListener('click', function (e) {
                e.stopPropagation();
                Lightbox.open(data.projects, i, c);
            });
            if (i === 0) firstCard = c;
            cardsWrap.appendChild(c);
        });

        /* Clicar na pasta (fora dos 3 cards) abre o popup no primeiro item */
        root.addEventListener('click', function () {
            Lightbox.open(data.projects, 0, firstCard || root);
        });

        stage.appendChild(back);
        stage.appendChild(tab);
        stage.appendChild(cardsWrap);
        stage.appendChild(front);
        stage.appendChild(shine);

        const count = document.createElement('p');
        count.className = 'folder3d-count';
        count.textContent = data.projects.length + ' ' + (data.unit || 'Itens');

        root.appendChild(glow);
        root.appendChild(stage);
        root.appendChild(count);
        return root;
    }

    function el(cls) { const d = document.createElement('div'); d.className = cls; return d; }

    /* ── Demo: uma "área" com seus business cases ──────────────
       (info de duração/aulas/professor/desc é placeholder — troca
        quando você me passar o conteúdo real) */
    const BG = '/ed/site-dependencias/site-media/formacoes/bg/';
    const demo = {
        title: 'Logística',
        unit: 'Business Cases',
        projects: [
            { id: 'l1', image: BG + 'formacao-fabric.webp',  title: 'Ruptura & OTIF',
              duracao: ',', aulas: ',', professor: ',',
              desc: 'Descrição do business case (placeholder).', allHref: '#' },
            { id: 'l2', image: BG + 'formacao-bdsql.webp',    title: 'Custo logístico',
              duracao: ',', aulas: ',', professor: ',',
              desc: 'Descrição do business case (placeholder).', allHref: '#' },
            { id: 'l3', image: BG + 'formacao-negocios.webp', title: 'Nível de serviço',
              duracao: ',', aulas: ',', professor: ',',
              desc: 'Descrição do business case (placeholder).', allHref: '#' },
            { id: 'l4', image: BG + 'formacao-pbi.webp',      title: 'Custo por rota',
              duracao: ',', aulas: ',', professor: ',',
              desc: 'Descrição do business case (placeholder).', allHref: '#' }
        ]
    };

    /* API pública: monta uma pasta em qualquer container (reuso no index de áreas) */
    window.XpFolder = {
        mount: function (el, data) {
            if (!el) return;
            el.innerHTML = '';
            el.appendChild(createFolder(data));
        }
    };

    /* Demo da própria página de teste (só roda se existir #pt-stage) */
    function initDemo() {
        const stage = document.getElementById('pt-stage');
        if (!stage) return;
        window.XpFolder.mount(stage, demo);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDemo);
    } else {
        initDemo();
    }
})();
