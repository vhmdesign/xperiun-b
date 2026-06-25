/* HUB Aprenda por Área — interações da página.
   Espelha a lógica do HUB de Formações (../formacoes/index.js), adaptada
   pras 4 áreas. Reaproveita o CSS/script.js de Formações. */

/* Ícones (Material Symbols) das áreas, na ordem do marquee. */
const AREA_ICONS = ['local_shipping', 'account_balance', 'trending_up', 'groups'];

/* Páginas de cada área, pro dropdown da oferta. */
const areaLinks = {
    al: '/ed/areas/logistica/',
    af: '/ed/areas/financeiro/',
    av: '/ed/areas/vendas/',
    arh: '/ed/areas/rh/'
};

/* Ícone (Material Symbols) de cada área, pro oferta-icon-box do card avulso. */
const areaIcons = {
    al: 'local_shipping',
    af: 'account_balance_wallet',
    av: 'shopping_cart',
    arh: 'group'
};

/* Business Cases (tópicos) de cada área — listados no card de oferta avulso
   ao escolher a área no dropdown. */
const areaTopics = {
    al: [
        'Desempenho Logístico',
        'Gestão de Frotas para Logística',
        'Indicadores de Desempenho Logístico',
        'Logística com Cálculo de OTIF',
        'Imersão Power BI para Negócios do Zero'
    ],
    af: [
        'Análises Financeiras para Grandes Corporações',
        'DRE Avançada',
        'Dashboard Financeiro da Xperia Automotive v1',
        'Dashboard Financeiro da Xperia Automotive v2',
        'Demonstrativo Financeiro da Ambev',
        'Controle Financeiro',
        'Análise Financeira com Fluxo de Caixa',
        'Análise Financeira',
        'Demonstrativo de Resultados e Análise de Títulos',
        'Fluxo de Caixa com Simulador Financeiro',
        'Imersão Power BI para Negócios do Zero'
    ],
    av: [
        'Dashboard de Vendas da PBIDist',
        'Vendas x Meta Conectando em SQL Server',
        'Varejo com Análises Avançadas da Loja Pinski',
        'Realizado vs Meta',
        'Performance de Vendas',
        'Desafio Toy & Play',
        'Desafio MR Bolos',
        'Desafio Bitrix24',
        'Carpinski - Infográfico Comercial',
        'Análise Comercial com Simulador de Metas',
        'Análises Comerciais com Storytelling',
        'Imersão Avançada: BI de Ponta a Ponta',
        'Imersão Avançada: Análise de Dados na Prática',
        'Imersão Power BI para Negócios do Zero',
        'Sistema de Recomendação',
        'Imersão Avançada de Power BI para Negócios',
        'Imersão Power BI + IA'
    ],
    arh: [
        'Dashboard de RH da Klog',
        'People Analytics com Análises Avançadas',
        'Recursos Humanos com Análise de Turnover',
        'Análise de Dados para Recursos Humanos',
        'KPIs de Recursos Humanos (RH)',
        'Linkedin Champion'
    ]
};
function escHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/* Nome da área no label do combo ("…em Logística se…") e descrição por área
   (cobre quem já trabalha E quem quer começar). */
const areaComboName = { al: 'Logística', af: 'Finanças', av: 'Vendas', arh: 'RH' };
/* Preço do combo por área: parcela 12× e equivalente à vista. */
const areaPrices = { al: '9', af: '19', av: '29', arh: '9' };
const areaAvista = { al: '97', af: '197', av: '297', arh: '97' };

/* Colapsa a lista de tópicos da oferta (>7 itens) e adiciona um botão
   "Ver todos" que expande/recolhe com fade. Mesma lógica do
   formacoes/script.js, mas aplicável a uma lista populada dinamicamente. */
function setupOfertaToggle(ul) {
    var LIMIT = 7;
    var items = Array.prototype.slice.call(ul.querySelectorAll('.oferta-check'));
    if (items.length <= LIMIT) return;
    var hasDisabled = !!ul.querySelector('.oferta-check.is-disabled');

    function render(open) {
        var visible = [];
        items.forEach(function (it, i) {
            var keepActive = hasDisabled && !it.classList.contains('is-disabled');
            var hide = !open && i >= LIMIT && !keepActive;
            it.classList.toggle('is-hidden', hide);
            it.classList.remove('is-fade-1', 'is-fade-2');
            if (!hide) visible.push(it);
        });
        if (!open && visible.length < items.length) {
            var last = visible[visible.length - 1];
            var penult = visible[visible.length - 2];
            if (last) last.classList.add('is-fade-2');
            if (penult) penult.classList.add('is-fade-1');
        }
    }

    var li = document.createElement('li');
    li.className = 'oferta-checks-toggle-row';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'oferta-checks-toggle';
    btn.setAttribute('aria-expanded', 'false');
    var label = document.createElement('span');
    label.textContent = 'Ver todos';
    var icon = document.createElement('span');
    icon.className = 'material-symbols-outlined';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'expand_more';
    btn.appendChild(label);
    btn.appendChild(icon);
    li.appendChild(btn);
    ul.appendChild(li);

    render(false);

    function overflowItems() {
        return items.filter(function (it, i) {
            var keepActive = hasDisabled && !it.classList.contains('is-disabled');
            return i >= LIMIT && !keepActive;
        });
    }
    var hideTimer = null;

    btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        label.textContent = open ? 'Ver menos' : 'Ver todos';

        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        var overflow = overflowItems();
        overflow.forEach(function (it) {
            it.classList.remove('is-hiding', 'is-revealing');
            it.style.animationDelay = '';
        });

        if (open) {
            render(true);
            overflow.forEach(function (it, k) {
                it.style.animationDelay = (k * 0.03) + 's';
                it.classList.add('is-revealing');
            });
        } else {
            overflow.forEach(function (it) { it.classList.add('is-hiding'); });
            hideTimer = setTimeout(function () {
                hideTimer = null;
                overflow.forEach(function (it) {
                    it.classList.remove('is-hiding');
                    it.style.animationDelay = '';
                });
                render(false);
            }, 260);
        }
    });
}
/* Id do popup-form de cada área (form-<id>.html). O id da AC dentro de cada
   form ainda é placeholder '00' — completar com o id real depois. */
const areaForms = { al: 'al', af: 'af', av: 'av', arh: 'arh' };
const areaDesc = {
    al: 'Você já trabalha com logística e quer destravar OTIF, ruptura e custo , ou quer entrar na área montando seu primeiro painel logístico com dados reais.',
    af: 'Você já atua em finanças e precisa de um painel de DRE, fluxo de caixa e resultados , ou quer começar na área financeira com casos reais.',
    av: 'Você já trabalha com vendas e quer acompanhar meta, performance e funil , ou quer entrar no comercial montando análises com dados reais.',
    arh: 'Você já atua em RH e quer medir turnover, headcount e absenteísmo , ou quer começar em People Analytics com dados reais.'
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
const navItems = document.querySelectorAll('.areas-nav-item');
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

            /* Card "Curso avulso": revela o "Garantir curso" e abre o form da área. */
            const buyBtn = card.querySelector('.oferta-btn-group [data-emphasis="neutral"]');
            if (buyBtn) {
                buyBtn.style.display = '';
                buyBtn.onclick = function (e) {
                    e.preventDefault();
                    var fid = areaForms[opt.dataset.target];
                    if (window.openPopup && fid) window.openPopup('popup-form-' + fid);
                };
            }

            /* Mídia 16:9 no topo (card esquerdo): troca a imagem pela da área. */
            const ofImgs = card.querySelectorAll('.oferta-card-img[data-area]');
            if (ofImgs.length) {
                ofImgs.forEach(img => {
                    img.classList.toggle('is-active', img.dataset.area === opt.dataset.target);
                });
                /* Ícone do oferta-icon-box reflete a área escolhida. */
                const iconEl = card.querySelector('.oferta-icon-box .area-icon');
                if (iconEl && areaIcons[opt.dataset.target]) iconEl.textContent = areaIcons[opt.dataset.target];
                /* Label + descrição refletem a área escolhida. */
                const labelEl = card.querySelector('.oferta-card-label');
                if (labelEl && areaComboName[opt.dataset.target]) {
                    labelEl.textContent = 'Leve o combo de casos reais em ' + areaComboName[opt.dataset.target] + ' se…';
                }
                const descEl = card.querySelector('.oferta-card-desc');
                if (descEl && areaDesc[opt.dataset.target]) descEl.textContent = areaDesc[opt.dataset.target];
                const priceEl = card.querySelector('.oferta-price .value');
                if (priceEl && areaPrices[opt.dataset.target]) priceEl.textContent = areaPrices[opt.dataset.target];
                const detailEl = card.querySelector('.oferta-price-detail');
                if (detailEl && areaAvista[opt.dataset.target]) detailEl.textContent = 'ou R$ ' + areaAvista[opt.dataset.target] + ' à vista';
                /* Tópicos: lista os Business Cases da área escolhida. */
                const topicsEl = card.querySelector('.oferta-topics');
                if (topicsEl && areaTopics[opt.dataset.target]) {
                    topicsEl.innerHTML = areaTopics[opt.dataset.target]
                        .map(t => '<li class="oferta-check">' + escHtml(t) + '</li>').join('');
                    setupOfertaToggle(topicsEl);
                }
                card.classList.add('is-chosen');   /* revela imagem + ícone */
            }
        });
    });

    document.addEventListener('click', closeDropdown);
});

/* ── Alinha o topo dos cards com a nav-list (offset = header + gap da nav) ──
   O padding fixo do CSS não bate porque o título da nav tem altura variável. */
(function () {
    function alignCards() {
        const nav     = document.querySelector('.areas-nav');
        const navList = document.querySelector('.areas-nav-list');
        const cards   = document.querySelector('.areas-cards');
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
