/* FAQ accordion: clique em todo o .faq-row abre/fecha com animação (grid-rows),
   alterna o ícone add/remove. Mesmo comportamento do sec-faq das formações. */
(function () {
    document.querySelectorAll('.sec-faq .faq-row').forEach(function (details) {
        var grid = details.querySelector('.faq-a-grid');
        var icon = details.querySelector('.faq-q-icon');
        details.addEventListener('click', function (e) {
            e.preventDefault();
            if (!details.open) {
                details.open = true;
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        grid.classList.add('is-open');
                        icon.textContent = 'remove';
                    });
                });
            } else {
                grid.classList.remove('is-open');
                icon.textContent = 'add';
                grid.addEventListener('transitionend', function () { details.open = false; }, { once: true });
            }
        });
    });
})();
