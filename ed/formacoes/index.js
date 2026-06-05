/* Entrada do hero-deck: marquee-boxes fadeiam em ordem aleatória ao carregar.
   Hero-box entra em paralelo, no meio do fade dos marquees. */
(function () {
    var boxes = document.querySelectorAll('.hero-deck .marquee-box');
    var heroBox = document.querySelector('.hero-box');
    var maxDelay = 1500; /* janela de fade-in dos marquees */
    boxes.forEach(function (box) {
        var delay = Math.random() * maxDelay;
        setTimeout(function () { box.classList.add('is-visible'); }, delay);
    });
    if (heroBox) {
        setTimeout(function () { heroBox.classList.add('is-visible'); }, 400);
    }
})();

const navItems = document.querySelectorAll('.formacoes-nav-item');
const cards    = document.querySelectorAll('.formacao-card');

navItems.forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById(btn.dataset.target).scrollIntoView({ behavior: 'smooth', block: 'start' });
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

const accentColors = {
    f1: '#E19632', f2: '#E16432', f3: '#32C896',
    f4: '#32C8C8', f5: '#64C832', f6: '#3264FF', f7: '#E13232'
};

const iconFiles = {
    f1: '../site-dependencias/site-media/formacoes/icones/Power BI Básico.svg',
    f2: '../site-dependencias/site-media/formacoes/icones/Power BI Intermediário.svg',
    f3: '../site-dependencias/site-media/formacoes/icones/Microsoft Fabric.svg',
    f4: '../site-dependencias/site-media/formacoes/icones/Banco de Dados & SQL.svg',
    f5: '../site-dependencias/site-media/formacoes/icones/Python & Data Science.svg',
    f6: '../site-dependencias/site-media/formacoes/icones/Automação & IA.svg',
    f7: '../site-dependencias/site-media/formacoes/icones/Carreira & Negócios.svg'
};

const webpFiles = {
    f1: '../site-dependencias/site-media/formacoes/bg/formacao-pbi.webp',
    f2: '../site-dependencias/site-media/formacoes/bg/formacao-pbia.webp',
    f3: '../site-dependencias/site-media/formacoes/bg/formacao-fabric.webp',
    f4: '../site-dependencias/site-media/formacoes/bg/formacao-bdsql.webp',
    f5: '../site-dependencias/site-media/formacoes/bg/formacao-dspython.webp',
    f6: '../site-dependencias/site-media/formacoes/bg/formacao-autoia.webp',
    f7: '../site-dependencias/site-media/formacoes/bg/formacao-negocios.webp'
};

const btnLinks = {
    f1: { saberMais: 'f1-power-bi-basico-intermediario', adquirir: '#' },
    f2: { saberMais: 'f2-power-bi-intermediario-avancado', adquirir: '#' },
    f3: { saberMais: 'f3-microsoft-fabric', adquirir: '#' },
    f4: { saberMais: 'f4-banco-de-dados-sql', adquirir: '#' },
    f5: { saberMais: 'f5-python-data-science', adquirir: '#' },
    f6: { saberMais: 'f6-automacao-ia', adquirir: '#' },
    f7: { saberMais: 'f7-carreira-negocios', adquirir: '#' }
};

const cardDescs = {
    f1: 'Você é analista administrativo e quer parar de fazer relatório no Excel, Formação 1 resolve.',
    f2: 'Você já cria dashboards, mas quer dominar DAX, modelagem e governança para entregar análises de nível corporativo, Formação 2 resolve.',
    f3: 'Você quer se antecipar ao mercado e dominar Microsoft Fabric antes que vire exigência nas empresas, Formação 3 resolve.',
    f4: 'Você é coordenador comercial e quer autonomia em SQL pro CRM, Formação 4 resolve.',
    f5: 'Você quer automatizar análises, conectar APIs e aplicar Python em problemas reais de dados, Formação 5 resolve.',
    f6: 'Você quer sair das tarefas repetitivas e usar IA, N8N, Power Automate e Power Apps para ganhar produtividade, Formação 6 resolve.',
    f7: 'Você já sabe que técnica sozinha não basta e quer se posicionar melhor na carreira, vender projetos e falar a língua do negócio, Formação 7 resolve.'
};

function hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
}

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
            const color = accentColors[opt.dataset.target];
            if (card && color) {
                /* Remove qualquer oferta-card--fN anterior e aplica o novo,
                   pra que .oferta-completa-icons destaque só o ícone da formação escolhida. */
                card.classList.remove('oferta-card--f1','oferta-card--f2','oferta-card--f3','oferta-card--f4','oferta-card--f5','oferta-card--f6','oferta-card--f7');
                card.classList.add('oferta-card--' + opt.dataset.target);
                card.style.setProperty('--card-accent', hexToRgba(color, 0.15));
                const desc = card.querySelector('.oferta-card-desc');
                if (desc && cardDescs[opt.dataset.target]) desc.textContent = cardDescs[opt.dataset.target];
                const cardLabel = card.querySelector('.oferta-card-label');
                if (cardLabel) cardLabel.textContent = 'Leve a formação ' + opt.dataset.target.replace('f', '') + ' se…';
                const links = btnLinks[opt.dataset.target];
                if (links) {
                    const btnSaber    = card.querySelector('[data-emphasis="subtle"]');
                    const btnAdquirir = card.querySelector('[data-emphasis="neutral"]');
                    if (btnSaber)    btnSaber.href = links.saberMais;
                    if (btnAdquirir) {
                        btnAdquirir.href = links.adquirir;
                        btnAdquirir.style.display = '';
                        btnAdquirir.onclick = (e) => {
                            if (typeof window.openPopup !== 'function') return;
                            e.preventDefault();
                            window.openPopup('popup-form-' + opt.dataset.target);
                        };
                    }
                }
                const iconBox = card.querySelector('.oferta-icon-box');
                if (iconBox) {
                    let iconImg = iconBox.querySelector('.oferta-icon');
                    if (!iconImg) {
                        iconImg = document.createElement('img');
                        iconImg.className = 'oferta-icon';
                        iconImg.alt = '';
                        iconBox.appendChild(iconImg);
                    }
                    iconImg.src = iconFiles[opt.dataset.target];
                    iconBox.style.background = hexToRgba(color, 0.1);
                }
                let cardBgImg = card.querySelector('.oferta-card-img');
                if (!cardBgImg) {
                    cardBgImg = document.createElement('img');
                    cardBgImg.className = 'oferta-card-img';
                    cardBgImg.alt = '';
                    card.insertBefore(cardBgImg, card.firstChild);
                }
                cardBgImg.src = webpFiles[opt.dataset.target];
            }
        });
    });

    document.addEventListener('click', closeDropdown);
});
