/* menu-include.js — carrega o menu compartilhado dinamicamente.

   Uso na página:
     <div data-menu></div>
     <script src="caminho/para/menu/menu-include.js"></script>

   O script auto-detecta o próprio caminho pra resolver menu.html, menu.css
   e menu.js. Sempre que menu.html for editado, todas as páginas que importam
   este script refletem a mudança no próximo load. */
(function () {
    /* document.currentScript é null quando este script é injetado
       dinamicamente (ex.: carregamento condicional via ?menu=ativo).
       Nesse caso, localiza o próprio <script> pela src no DOM. */
    var script = document.currentScript;
    if (!script || !script.src) {
        script = Array.prototype.slice.call(document.querySelectorAll('script[src]'))
            .filter(function (s) { return /menu-include\.js(\?|$)/.test(s.src); })
            .pop();
    }
    if (!script || !script.src) return;

    var scriptUrl = new URL(script.src, document.baseURI);
    var menuHtmlUrl = new URL('menu.html', scriptUrl).href;
    var menuCssUrl  = new URL('menu.css',  scriptUrl).href;
    var menuJsUrl   = new URL('menu.js',   scriptUrl).href;

    /* root.css é assumido como já carregado pela página host (tokens DS).
       Injeta apenas menu.css (estilos próprios do menu). */
    var hasCss = Array.prototype.some.call(
        document.querySelectorAll('link[rel="stylesheet"]'),
        function (l) { return l.href === menuCssUrl; }
    );
    if (!hasCss) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = menuCssUrl;
        document.head.appendChild(link);
    }

    /* Garante a fonte Material Symbols (ícones das áreas no dropdown Aprenda).
       Injeta só se a página host ainda não a carregou. */
    var hasSymbols = Array.prototype.some.call(
        document.querySelectorAll('link[href]'),
        function (l) { return /Material\+Symbols/.test(l.href); }
    );
    if (!hasSymbols) {
        var sym = document.createElement('link');
        sym.rel = 'stylesheet';
        sym.href = '/ed/site-dependencias/site-fonts/material-symbols.css';
        document.head.appendChild(sym);
    }

    /* Carrega menu.html, extrai #site-menu e substitui o placeholder.
       Depois disso, carrega menu.js (que depende dos elementos já estarem
       no DOM pra registrar listeners). */
    function mount() {
        var placeholder = document.querySelector('[data-menu]');
        if (!placeholder) return;
        fetch(menuHtmlUrl)
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var menuEl = doc.querySelector('#site-menu');
                if (!menuEl) return;
                /* Reescreve paths relativos de <img src> e <a href> para
                   absolutos baseados na pasta pai de /menu/ (root do projeto).
                   Sem isso, paths como "media/..." ou "formacoes/..." resolvem
                   relativos à página host — quebra quando a host está em um
                   subdiretório (ex.: /formacoes/power-bi-...html).
                   Usa .pathname em vez de .href pra produzir paths
                   absolutos no site (/imagens/...) sem incluir protocol+host
                   (evita ter http://IP/... no src renderizado). */
                var rewriteRelative = function (el, attr) {
                    var val = el.getAttribute(attr);
                    if (!val) return;
                    if (/^([a-z]+:|\/|#|data:|mailto:|tel:)/i.test(val)) return;
                    /* '../../': sobe 2 níveis até ed/ (raiz do projeto).
                       Paths em menu.html são expressos relativos a ed/
                       (ex.: site-dependencias/site-media/foo, formacoes/X).
                       Resultado fica /ed/site-dependencias/... — /ed/ é mantido
                       na URL pública (estrutura visível ao usuário). */
                    var resolved = new URL('../../' + val, scriptUrl);
                    /* .pathname sozinho descarta query/hash; preserva ambos
                       pra que params como ?menu=ativo sobrevivam à reescrita. */
                    el[attr] = resolved.pathname + resolved.search + resolved.hash;
                };
                menuEl.querySelectorAll('img[src]').forEach(function (img) {
                    rewriteRelative(img, 'src');
                });
                menuEl.querySelectorAll('a[href]').forEach(function (a) {
                    rewriteRelative(a, 'href');
                });

                /* Estado inicial sincronizado antes da inserção, pra evitar
                   o flash de menu visível antes do menu.js rodar:
                   - body.page-home: menu começa oculto em modo top (.is-top
                     + .is-hidden). menu.js remove .is-hidden após raf pra
                     disparar a transição CSS de entrada suave.
                   - outras páginas: menu oculto (.is-hidden), aparece via
                     menu.js no primeiro scroll. */
                var navEl = menuEl.querySelector('.nav');
                if (navEl) {
                    /* page-home e menu-top iniciam no modo top (is-top), pra
                       que a entrada suave aconteça por cima. Demais páginas
                       só recebem is-hidden (modo bottom default). */
                    if (document.body.classList.contains('page-home') ||
                        document.body.classList.contains('menu-top')) {
                        navEl.classList.add('is-top');
                        navEl.classList.add('is-hidden');
                    } else {
                        navEl.classList.add('is-hidden');
                    }
                }

                placeholder.replaceWith(menuEl);

                /* Injeta o JS depois do DOM estar montado, pra que os
                   listeners do menu encontrem os elementos. */
                var hasJs = Array.prototype.some.call(
                    document.querySelectorAll('script[src]'),
                    function (s) { return s.src === menuJsUrl; }
                );
                if (!hasJs) {
                    var s = document.createElement('script');
                    s.src = menuJsUrl;
                    s.defer = true;
                    document.body.appendChild(s);
                }
            })
            .catch(function (err) {
                console.warn('[menu-include] erro ao carregar menu:', err);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
