/* menu.js — interações do menu fixo (nav pill + dropdowns + mobile drawer).
   Escopado pra rodar apenas dentro de #site-menu (evita pegar elementos
   homônimos da página hospedeira). */
(function () {
    var root = document.getElementById('site-menu');
    if (!root) return;

    var isMobile = function () { return window.innerWidth <= 896; };
    var isMobileSm = function () { return window.innerWidth <= 576; };

    /* Link externo (WordPress / app) = href absoluto http(s). Links internos
       do site estático (formações) são relativos ou começam com '/'. Todos
       os externos abrem em nova aba. */
    var isExternal = function (href) { return /^https?:\/\//i.test(href || ''); };

    root.querySelectorAll('a[href]').forEach(function (a) {
        if (isExternal(a.getAttribute('href'))) {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener');
        }
    });

    /* ── Painel dinâmico — muda ao hover/click ────────────────────── */
    function activatePanel(dropdown, panelId) {
        dropdown.querySelectorAll('.dm-item').forEach(function (i) {
            i.classList.remove('active');
        });
        dropdown.querySelectorAll('.dm-panel').forEach(function (p) {
            p.classList.remove('show');
        });
        var item  = dropdown.querySelector('.dm-item[data-panel="' + panelId + '"]');
        var panel = dropdown.querySelector('.dm-panel[data-id="' + panelId + '"]');
        if (item)  item.classList.add('active');
        if (panel) panel.classList.add('show');
    }

    /* Deriva href de cada dm-item a partir do CTA do seu painel — usado
       no modo mobile (≤576px) onde dm-panels some e o próprio dm-item
       vira link navegável. */
    root.querySelectorAll('.dm-item[data-panel]').forEach(function (item) {
        var dropdown = item.closest('.dropdown');
        if (!dropdown) return;
        var panel = dropdown.querySelector('.dm-panel[data-id="' + item.dataset.panel + '"]');
        if (!panel) return;
        /* O CTA do painel é o .btn (ex.: "Conhecer Pós Tech"). Em mobile
           (≤576px) o dm-panel some, então o próprio dm-item navega pra cá. */
        var cta = panel.querySelector('.dm-panel-cta') || panel.querySelector('.btn');
        if (cta) item.dataset.href = cta.getAttribute('href') || '';
    });

    root.querySelectorAll('.dm-item[data-panel]').forEach(function (item) {
        item.addEventListener('mouseenter', function () {
            if (isMobileSm()) return;
            var dropdown = item.closest('.dropdown');
            if (dropdown) activatePanel(dropdown, item.dataset.panel);
        });
        item.addEventListener('click', function (e) {
            /* ≤576px: dm-panels escondido. Item ou navega (data-href)
               ou alterna accordion (.dm-item-sub irmão). */
            if (isMobileSm()) {
                var sub = item.nextElementSibling;
                if (sub && sub.classList.contains('dm-item-sub')) {
                    e.preventDefault();
                    /* Fecha outros accordions do mesmo dropdown */
                    var dd = item.closest('.dropdown');
                    if (dd) {
                        dd.querySelectorAll('.dm-item-sub.open').forEach(function (s) {
                            if (s !== sub) s.classList.remove('open');
                        });
                        dd.querySelectorAll('.dm-item.open').forEach(function (i) {
                            if (i !== item) i.classList.remove('open');
                        });
                    }
                    sub.classList.toggle('open');
                    item.classList.toggle('open');
                    return;
                }
                if (item.dataset.href) {
                    if (isExternal(item.dataset.href)) {
                        window.open(item.dataset.href, '_blank', 'noopener');
                    } else {
                        window.location.href = item.dataset.href;
                    }
                }
                return;
            }
            var dropdown = item.closest('.dropdown');
            if (dropdown) activatePanel(dropdown, item.dataset.panel);
        });
    });

    /* ── Desktop: hover com grace period ─────────────────────────── */
    var closeTimers = new Map();

    function closeNavItem(item) {
        var b = item.querySelector('button.nav-btn');
        item.classList.remove('open');
        closeTimers.delete(item);
        if (b) b.setAttribute('aria-expanded', 'false');
    }

    root.querySelectorAll('.nav-item').forEach(function (item) {
        var btn = item.querySelector('button.nav-btn');

        item.addEventListener('mouseenter', function () {
            if (isMobile()) return;
            if (closeTimers.has(item)) {
                clearTimeout(closeTimers.get(item));
                closeTimers.delete(item);
            }
            root.querySelectorAll('.nav-item.open').forEach(function (other) {
                if (other !== item) {
                    clearTimeout(closeTimers.get(other));
                    closeTimers.delete(other);
                    other.classList.remove('open');
                    var ob = other.querySelector('button.nav-btn');
                    if (ob) ob.setAttribute('aria-expanded', 'false');
                }
            });
            item.classList.add('open');
            if (btn) btn.setAttribute('aria-expanded', 'true');
            var dd = item.querySelector('.dropdown');
            if (dd) {
                var first = dd.querySelector('.dm-item[data-panel]');
                if (first) activatePanel(dd, first.dataset.panel);
            }
        });

        item.addEventListener('mouseleave', function () {
            if (isMobile()) return;
            var timer = setTimeout(function () { closeNavItem(item); }, 150);
            closeTimers.set(item, timer);
        });

        /* Mobile: click toggle */
        var navBtnEl = item.querySelector('.nav-btn');
        if (navBtnEl) {
            navBtnEl.addEventListener('click', function (e) {
                if (!isMobile()) return;
                var dd = item.querySelector('.dropdown');
                if (!dd) return; /* CTA navega normalmente */
                e.preventDefault();
                var isOpen = item.classList.contains('open');
                root.querySelectorAll('.nav-item.open').forEach(function (other) {
                    if (other !== item) closeNavItem(other);
                });
                item.classList.toggle('open', !isOpen);
                navBtnEl.setAttribute('aria-expanded', String(!isOpen));
                /* ≤576px: dm-panels escondido, não há nada pra ativar.
                   Entre 577-864 ainda usa painel, então ativa o primeiro. */
                if (!isOpen && !isMobileSm()) {
                    var first = dd.querySelector('.dm-item[data-panel]');
                    if (first) activatePanel(dd, first.dataset.panel);
                }
            });
        }
    });

    /* ── Fechar ao clicar fora ───────────────────────────────────── */
    document.addEventListener('click', function (e) {
        if (!e.target.closest('#site-menu .nav')) {
            root.querySelectorAll('.nav-item.open').forEach(function (item) {
                closeNavItem(item);
            });
        }
    });

    /* ── Fechar ao redimensionar (troca de breakpoint) ───────────── */
    window.addEventListener('resize', function () {
        root.querySelectorAll('.nav-item.open').forEach(function (item) {
            clearTimeout(closeTimers.get(item));
            closeNavItem(item);
        });
    });

    /* ── Visibilidade do menu por scroll ─────────────────────────────
       Modelo de estado:
       - baseHidden: condições normais (scroll = 0 em páginas comuns).
       - forceHidden: condições de override (sec-anuidade.is-active ou
         scroll perto do fim da página). Quando true, força menu oculto
         independente do baseHidden.

       Fluxos:
       - Páginas normais (formacao-N.html etc): menu começa hidden.
         Aparece quando user rola pra baixo. Volta a sumir quando volta
         ao topo, quando sec-anuidade fica .is-active, ou perto do fim.
       - home.html (body.page-home): menu começa visível em modo top
         (top: 16px, dropdowns pra baixo). Quando #layer-content ganha
         .is-in (user saiu do hero), fade-out → troca pra modo bottom →
         fade-in. Volta pro top quando .is-in some. Também se recolhe
         perto do fim do conteúdo. */
    var nav = root.querySelector('.nav');
    if (!nav) return;

    var isHomePage   = document.body.classList.contains('page-home');
    var secAnuidade  = document.querySelector('.sec-anuidade');
    var layerContent = document.getElementById('layer-content');
    var layerTrocas  = document.getElementById('layer-trocas');

    var baseHidden  = !isHomePage; /* non-home: começa hidden. home: visível. */
    var forceHidden = false;

    function applyVisibility() {
        nav.classList.toggle('is-hidden', baseHidden || forceHidden);
    }

    /* Transição entre top↔bottom (no home):
       1. Adiciona is-hidden → modo atual recolhe na sua direção própria
          (bottom: pra baixo, top: pra cima).
       2. Depois da saída (500ms), troca o is-top no DOM. is-hidden ainda
          presente, mas agora o transform é da nova direção.
       3. Aguarda 2 rAFs pra navegador pintar o novo estado hidden, então
          remove is-hidden → modo novo entra na sua direção própria
          (bottom: de baixo pra cima, top: de cima pra baixo). */
    function fadeReplace(toggleFn) {
        nav.classList.add('is-hidden');
        setTimeout(function () {
            toggleFn();
            requestAnimationFrame(function () {
                requestAnimationFrame(applyVisibility);
            });
        }, 500);
    }

    function getWindowScrollY() {
        return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    function isNearBottom() {
        if (!isHomePage) {
            var sy = getWindowScrollY();
            var doc = document.documentElement;
            return (sy + window.innerHeight) >= (doc.scrollHeight - 100);
        }
        /* Home: o scroll real acontece dentro de #layer-trocas (parte
           inferior do conteúdo). Checa se está perto do fim dele. */
        if (layerTrocas) {
            return (layerTrocas.scrollTop + layerTrocas.clientHeight) >= (layerTrocas.scrollHeight - 100);
        }
        return false;
    }

    function updateForceHidden() {
        var anuActive = secAnuidade && secAnuidade.classList.contains('is-active');
        var atEnd     = isNearBottom();
        forceHidden = anuActive || atEnd;
        applyVisibility();
    }

    if (isHomePage) {
        nav.classList.add('is-top');
        baseHidden = false;
        /* Entrada suave: aguarda 2 rafs pra garantir que o estado inicial
           .is-hidden (setado em menu-include.js) já foi pintado antes de
           removê-lo. Sem o rAF, a remoção é coalescida com a inserção e
           a transição CSS não dispara. */
        requestAnimationFrame(function () {
            requestAnimationFrame(applyVisibility);
        });

        if (layerContent) {
            var currentMode = layerContent.classList.contains('is-in') ? 'bottom' : 'top';
            if (currentMode === 'bottom') nav.classList.remove('is-top');

            var mo = new MutationObserver(function () {
                var nowIn   = layerContent.classList.contains('is-in');
                var nextMode = nowIn ? 'bottom' : 'top';
                if (nextMode === currentMode) return;
                currentMode = nextMode;
                if (nextMode === 'bottom') {
                    fadeReplace(function () { nav.classList.remove('is-top'); });
                } else {
                    fadeReplace(function () { nav.classList.add('is-top'); });
                }
            });
            mo.observe(layerContent, { attributes: true, attributeFilter: ['class'] });
        }

        /* Listeners de scroll dos containers do home pra checar near-bottom */
        if (layerTrocas)  layerTrocas .addEventListener('scroll', updateForceHidden, { passive: true });
        if (layerContent) layerContent.addEventListener('scroll', updateForceHidden, { passive: true });
    } else {
        baseHidden = true;
        applyVisibility();
        window.addEventListener('scroll', function () {
            baseHidden = getWindowScrollY() <= 0;
            updateForceHidden();
        }, { passive: true });
    }

    /* sec-anuidade observer (formacao-N.html): observa mudanças de
       classList pra detectar .is-active. Quando popup abre, menu some.
       Quando popup fecha, menu volta (se outras condições permitirem). */
    if (secAnuidade) {
        var anuMo = new MutationObserver(updateForceHidden);
        anuMo.observe(secAnuidade, { attributes: true, attributeFilter: ['class'] });
    }

    updateForceHidden();
})();
