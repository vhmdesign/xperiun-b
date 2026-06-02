/* footer-include.js — carrega o footer compartilhado dinamicamente.

   Uso na página:
     <div data-footer></div>
     <script src="caminho/para/footer/footer-include.js"></script>

   O script auto-detecta o próprio caminho pra resolver footer.html e footer.css,
   então funciona tanto pra páginas no root quanto em subpastas.
   Sempre que footer.html for editado, todas as páginas que importam este script
   refletem a mudança no próximo load. */
(function () {
    var script = document.currentScript;
    if (!script || !script.src) return;

    var scriptUrl = new URL(script.src, document.baseURI);
    var footerHtmlUrl = new URL('footer.html', scriptUrl).href;
    var footerCssUrl  = new URL('footer.css',  scriptUrl).href;

    /* Injeta footer.css no <head> se ainda não estiver presente */
    var hasCss = Array.prototype.some.call(
        document.querySelectorAll('link[rel="stylesheet"]'),
        function (l) { return l.href === footerCssUrl; }
    );
    if (!hasCss) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = footerCssUrl;
        document.head.appendChild(link);
    }

    /* Carrega footer.html, extrai o <footer> e substitui o placeholder */
    function mount() {
        var placeholder = document.querySelector('[data-footer]');
        if (!placeholder) return;
        fetch(footerHtmlUrl)
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var footerEl = doc.querySelector('footer');
                if (footerEl) {
                    placeholder.replaceWith(footerEl);
                }
            })
            .catch(function (err) {
                console.warn('[footer-include] erro ao carregar footer:', err);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
