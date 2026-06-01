/* form-include.js — carrega os popups de inscrição dinamicamente.

   Uso na página:
     <div data-popup-form="f1"></div>
     <div data-popup-form="f2"></div>
     ...
     <script src="caminho/para/popups/form-include.js"></script>

     <!-- Abrir um popup específico: -->
     <button onclick="openPopup('popup-form-f2')">Quero F2</button>

   Pra cada placeholder [data-popup-form="fN"], faz fetch de form-fN.html,
   extrai .popup-form e substitui o placeholder. Injeta form.css uma vez
   no head e form.js uma vez depois que TODOS os popups estiverem no DOM
   (pra garantir que init() encontre todos via querySelectorAll). */
(function () {
    var script = document.currentScript;
    if (!script || !script.src) return;

    var scriptUrl = new URL(script.src, document.baseURI);
    var cssUrl    = new URL('form.css', scriptUrl).href;
    var jsUrl     = new URL('form.js',  scriptUrl).href;

    /* Injeta form.css no <head> se ainda não estiver presente */
    var hasCss = Array.prototype.some.call(
        document.querySelectorAll('link[rel="stylesheet"]'),
        function (l) { return l.href === cssUrl; }
    );
    if (!hasCss) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);
    }

    function loadPopup(placeholder) {
        var fN = placeholder.getAttribute('data-popup-form');
        if (!fN) return Promise.resolve();
        var htmlUrl = new URL('form-' + fN + '.html', scriptUrl).href;
        return fetch(htmlUrl)
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var popupEl = doc.querySelector('.popup-form');
                if (!popupEl) return;

                /* Reescreve paths relativos de <img src> pra absolutos baseados
                   na pasta /popups/. */
                popupEl.querySelectorAll('img[src]').forEach(function (img) {
                    var val = img.getAttribute('src');
                    if (!val || /^([a-z]+:|\/|#|data:|mailto:|tel:)/i.test(val)) return;
                    img.src = new URL(val, htmlUrl).href;
                });

                placeholder.replaceWith(popupEl);
            })
            .catch(function (err) {
                console.warn('[form-include] erro ao carregar ' + fN + ':', err);
            });
    }

    function mount() {
        var placeholders = document.querySelectorAll('[data-popup-form]');
        if (placeholders.length === 0) return;

        var promises = Array.prototype.map.call(placeholders, loadPopup);

        Promise.all(promises).then(function () {
            var hasJs = Array.prototype.some.call(
                document.querySelectorAll('script[src]'),
                function (s) { return s.src === jsUrl; }
            );
            if (!hasJs) {
                var s = document.createElement('script');
                s.src = jsUrl;
                s.defer = true;
                document.body.appendChild(s);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
