/* frame-embed.js — escala cada .frame-embed pra caber na largura do
   container, mantendo a proporção do design (--frame-w/--frame-h).
   Injeta o frame-embed.css automaticamente se ainda não estiver na página.

   scale = larguraReal(container) / larguraDeDesign(--frame-w)
   Aplicado em --frame-scale, consumido pelo transform: scale() do iframe. */
(function () {
    /* injeta o CSS irmão (frame-embed.css) uma única vez */
    var script = document.currentScript;
    if (script && script.src) {
        var cssUrl = new URL('frame-embed.css', new URL(script.src, document.baseURI)).href;
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
    }

    function scaleOne(el) {
        var designW = parseFloat(getComputedStyle(el).getPropertyValue('--frame-w'));
        if (!designW || !el.clientWidth) return;
        el.style.setProperty('--frame-scale', (el.clientWidth / designW).toString());
    }

    /* se o iframe for same-origin, ajusta --frame-h pela altura real do
       conteúdo (mantém o declarado se for cross-origin / inacessível) */
    function autoHeight(el) {
        var ifr = el.querySelector('iframe');
        if (!ifr) return;
        try {
            var doc = ifr.contentDocument;
            if (!doc || !doc.body) return;
            var h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
            if (h) { el.style.setProperty('--frame-h', String(h)); scaleOne(el); }
        } catch (e) { /* cross-origin: usa o --frame-h declarado */ }
    }

    function init() {
        var frames = document.querySelectorAll('.frame-embed');
        if (!frames.length) return;

        var ro = (typeof ResizeObserver !== 'undefined')
            ? new ResizeObserver(function (entries) { entries.forEach(function (e) { scaleOne(e.target); }); })
            : null;

        Array.prototype.forEach.call(frames, function (el) {
            scaleOne(el);
            if (ro) ro.observe(el);
            var ifr = el.querySelector('iframe');
            if (ifr) {
                autoHeight(el);
                var ready = function () { autoHeight(el); scaleOne(el); el.classList.add('is-ready'); };
                if (ifr.contentDocument && ifr.contentDocument.readyState === 'complete') ready();
                ifr.addEventListener('load', ready);
            } else {
                el.classList.add('is-ready');
            }
        });

        if (!ro) window.addEventListener('resize', function () {
            Array.prototype.forEach.call(frames, scaleOne);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
