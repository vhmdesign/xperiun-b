(function () {
    const MAP = {
        'mmm-opcao-logos': 'container-mm-logo',
        'mmm-opcao-assets': 'container-mm-assets',
        'mmm-opcao-cores': 'container-mm-cores',
        'mmm-opcao-tipos': 'container-mm-tipografia',
        'mmm-opcao-icones': 'container-mm-iconografia',
        'mmm-opcao-components': 'container-mm-components',
        'mmm-opcao-patterns': 'container-mm-patterns',
        'mmm-opcao-layouts': 'container-mm-layouts',
        'mmm-opcao-guidelines': 'container-mm-guidelines'
    };

    const SECTIONS = Object.values(MAP);

    function injectStyles() {
        const style = document.createElement('style');
        const hideSelector = SECTIONS
            .map(c => `.${c}:not(.mm-ativo)`)
            .join(', ');
        style.textContent = `
            .mmm-opcao { cursor: pointer; }
            ${hideSelector} { display: none !important; }
        `;
        document.head.appendChild(style);
    }

    function getTargetClass(li) {
        for (const cls of li.classList) {
            if (MAP[cls]) return MAP[cls];
        }
        return null;
    }

    function activate(li) {
        if (!li) return;
        const targetClass = getTargetClass(li);
        if (!targetClass) return;

        document
            .querySelectorAll('.mm-ativo')
            .forEach(el => el.classList.remove('mm-ativo'));
        const targetEl = document.querySelector('.' + targetClass);
        if (targetEl) targetEl.classList.add('mm-ativo');

        document
            .querySelectorAll('.mmm-opcao-ativo')
            .forEach(el => el.classList.remove('mmm-opcao-ativo'));
        li.classList.add('mmm-opcao-ativo');
    }

    function init() {
        injectStyles();
        const activeInit = document.querySelector('.mmm-opcao.mmm-opcao-ativo');
        if (activeInit) activate(activeInit);
    }

    // Menu mobile: abre/fecha por toque (hover não existe em touch).
    const MOBILE = () => window.matchMedia('(max-width: 864px)').matches;

    function setMenu(open) {
        const container = document.querySelector('.mmm-container');
        const toggle = document.querySelector('.mmm-toggle');
        if (!container) return;
        container.classList.toggle('is-open', open);
        if (toggle) {
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        }
    }

    document.addEventListener('click', (e) => {
        const toggle = e.target.closest('.mmm-toggle');
        if (toggle) {
            const container = document.querySelector('.mmm-container');
            setMenu(!(container && container.classList.contains('is-open')));
            return;
        }
        const li = e.target.closest('.mmm-opcao');
        if (li) {
            activate(li);
            if (MOBILE()) setMenu(false); // fecha o menu ao escolher a seção no mobile
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
