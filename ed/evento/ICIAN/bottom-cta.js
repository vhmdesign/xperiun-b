/* Recolhe a barra fixa de CTA enquanto a 1ª (hero) ou a última (faq) seções
   estiverem visíveis; mostra no meio da página. */
(function () {
    var bar = document.querySelector('.ic-bottom-cta');
    var first = document.querySelector('.ic-hero');
    var last = document.querySelector('.ic-game');
    if (!bar) return;

    var vis = { first: false, last: false };
    function update() { bar.classList.toggle('is-hidden', vis.first || vis.last); }

    if ('IntersectionObserver' in window && (first || last)) {
        var io = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].target === first) vis.first = entries[i].isIntersecting;
                else if (entries[i].target === last) vis.last = entries[i].isIntersecting;
            }
            update();
        });
        if (first) io.observe(first);
        if (last) io.observe(last);
    }
})();
