/* motion-cards.js — revela elementos com a classe .motion ao entrarem na
   viewport, adicionando .is-revealed (dispara as transições CSS, ex.: a
   animação de .formacao-card-img no hub de formações).

   Estava referenciado em /ed/formacoes/index.html mas o arquivo não existia,
   então a classe .is-revealed nunca era adicionada e a animação não rodava. */
(function () {
    var els = document.querySelectorAll('.motion');
    if (!els.length) return;

    var reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !('IntersectionObserver' in window)) {
        els.forEach(function (el) { el.classList.add('is-revealed'); });
        return;
    }

    var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

    els.forEach(function (el) { obs.observe(el); });
})();
