/* HUB Aprenda por Área — interações da página.
   Espelha a lógica do HUB de Formações (../formacoes/index.js), adaptada
   pras 4 áreas. Reaproveita o CSS/script.js de Formações. */

/* Ícones (Material Symbols) das áreas, na ordem do marquee. */
const AREA_ICONS = ['local_shipping', 'account_balance', 'trending_up', 'groups'];

/* Páginas de cada área, pro dropdown da oferta. */
const areaLinks = {
    a1: '/ed/areas/logistica/',
    a2: '/ed/areas/financeiro/',
    a3: '/ed/areas/vendas/',
    a4: '/ed/areas/rh/'
};

/* ── Hero: monta os marquees a partir dos 4 ícones de área ──
   Mesma estrutura do HUB de Formações: 6 faixas alternando sentido,
   cada track com o conjunto + um clone aria-hidden (display:contents)
   pro loop de translateX(-50%) emendar sem corte. */
(function buildMarquees() {
    const host = document.getElementById('hero-marquees');
    if (!host) return;

    function box(icon) {
        const b = document.createElement('div');
        b.className = 'marquee-box';
        const i = document.createElement('span');
        i.className = 'material-symbols-outlined';
        i.textContent = icon;
        b.appendChild(i);
        return b;
    }

    const PER_ROW = 12; /* repetições do ciclo de 4 ícones por faixa */
    for (let row = 0; row < 6; row++) {
        const marquee = document.createElement('div');
        marquee.className = 'marquee ' + (row % 2 === 0 ? 'marquee--rtl' : 'marquee--ltr');
        const track = document.createElement('div');
        track.className = 'marquee-track';

        const real = document.createElement('div');
        real.style.display = 'contents';
        const clone = document.createElement('div');
        clone.style.display = 'contents';
        clone.setAttribute('aria-hidden', 'true');

        for (let n = 0; n < PER_ROW; n++) {
            const icon = AREA_ICONS[(row + n) % AREA_ICONS.length];
            real.appendChild(box(icon));
            clone.appendChild(box(icon));
        }
        track.appendChild(real);
        track.appendChild(clone);
        marquee.appendChild(track);
        host.appendChild(marquee);
    }
})();

/* ── Entrada animada do hero-deck ── */
(function () {
    const boxes = document.querySelectorAll('.hero-deck .marquee-box');
    const heroBox = document.querySelector('.hero-box');
    const maxDelay = 1500;
    boxes.forEach(function (box) {
        const delay = Math.random() * maxDelay;
        setTimeout(function () { box.classList.add('is-visible'); }, delay);
    });
    if (heroBox) setTimeout(function () { heroBox.classList.add('is-visible'); }, 400);
})();

/* ── Navegação lateral: clique rola até o card, scroll marca o ativo ── */
const navItems = document.querySelectorAll('.formacoes-nav-item');
const cards    = document.querySelectorAll('.area-card');

navItems.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navItems.forEach(b => b.classList.remove('is-active'));
            const active = document.querySelector(`[data-target="${entry.target.id}"]`);
            if (active) active.classList.add('is-active');
        }
    });
}, { rootMargin: '-20% 0px -60% 0px' });

cards.forEach(card => observer.observe(card));

/* ── Dropdown da oferta: escolher área → atualiza label + destino do CTA ── */
document.querySelectorAll('.dropdown-group').forEach(group => {
    const trigger = group.querySelector('.dropdown');
    const opts    = group.querySelector('.dropdown-options');
    const label   = trigger.querySelector('.dropdown-placeholder, .dropdown-value');
    const icon    = trigger.querySelector('.dropdown-icon');
    const gap     = 8;

    function getClipContainer() {
        let el = group.parentElement;
        while (el && el !== document.body) {
            const s = getComputedStyle(el);
            if (s.overflow === 'hidden' || s.overflowY === 'hidden') return el;
            el = el.parentElement;
        }
        return document.documentElement;
    }

    function openDropdown() {
        const container = getClipContainer();
        const cRect = container.getBoundingClientRect();
        const gRect = group.getBoundingClientRect();
        opts.style.maxHeight  = '';
        opts.style.visibility = 'hidden';
        opts.style.display    = 'block';
        const optH = opts.offsetHeight;
        opts.style.display    = '';
        opts.style.visibility = '';
        const spaceBelow = cRect.bottom - gRect.bottom - gap;
        const spaceAbove = gRect.top - cRect.top - gap;
        if (spaceBelow >= optH) {
            group.classList.remove('is-open-up');
            opts.style.maxHeight = '';
        } else if (spaceAbove >= optH) {
            group.classList.add('is-open-up');
            opts.style.maxHeight = '';
        } else {
            group.classList.remove('is-open-up');
            opts.style.maxHeight = Math.max(spaceBelow, 40) + 'px';
        }
        group.classList.add('is-open');
        if (icon) icon.textContent = 'expand_less';
    }

    function closeDropdown() {
        group.classList.remove('is-open', 'is-open-up');
        opts.style.maxHeight = '';
        if (icon) icon.textContent = 'expand_more';
    }

    trigger.addEventListener('click', e => {
        e.stopPropagation();
        group.classList.contains('is-open') ? closeDropdown() : openDropdown();
    });

    group.querySelectorAll('.dropdown-option').forEach(opt => {
        opt.addEventListener('click', e => {
            e.stopPropagation();
            label.textContent = opt.textContent;
            label.className   = 'dropdown-value';
            closeDropdown();

            const card = group.closest('.oferta-card');
            if (!card) return;
            const href = areaLinks[opt.dataset.target];

            /* Card "Pack da área": CTA principal aponta pra área escolhida. */
            const packCta = card.querySelector('.oferta-pack-cta');
            if (packCta && href) packCta.href = href;

            /* Card "Curso avulso": revela o botão "Garantir curso" apontando pra área. */
            const buyBtn = card.querySelector('.oferta-btn-group [data-emphasis="neutral"]');
            if (buyBtn && href) {
                buyBtn.href = href;
                buyBtn.style.display = '';
            }
        });
    });

    document.addEventListener('click', closeDropdown);
});

/* ── Alinha o topo dos cards com a nav-list (offset = header + gap da nav) ──
   O padding fixo do CSS não bate porque o título da nav tem altura variável. */
(function () {
    function alignCards() {
        const nav     = document.querySelector('.formacoes-nav');
        const navList = document.querySelector('.formacoes-nav-list');
        const cards   = document.querySelector('.formacoes-cards');
        if (!nav || !navList || !cards) return;
        if (window.matchMedia('(max-width: 864px)').matches) {
            cards.style.paddingTop = '';   /* empilhado: deixa o CSS (0) valer */
            return;
        }
        const offset = navList.getBoundingClientRect().top - nav.getBoundingClientRect().top;
        cards.style.paddingTop = Math.max(0, Math.round(offset)) + 'px';
    }
    window.addEventListener('load', alignCards);
    window.addEventListener('resize', alignCards);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignCards);
    alignCards();
})();
