(function () {
    // Para cada grupo .mm-filtros, escopeia o toggle às seções filhas do MESMO parent.
    // Isso permite múltiplos grupos independentes (ex.: cores brand/alert + UI buttons/tag-buttons/...).
    document.querySelectorAll('.mm-filtros').forEach(filtros => {
        const scope = filtros.parentElement;
        if (!scope) return;
        const filters = filtros.querySelectorAll('.mm-filtro');
        const sections = scope.querySelectorAll(':scope > .mm-section');

        function activate(name) {
            filters.forEach(f => {
                f.classList.toggle('is-active', f.dataset.filter === name);
            });
            sections.forEach(s => {
                s.classList.toggle('is-active', s.dataset.section === name);
            });
        }

        filters.forEach(f => {
            f.addEventListener('click', (e) => {
                // Impede que btn-data.js abra o popup ao clicar num filtro
                e.stopPropagation();
                activate(f.dataset.filter);
            });
        });

        // Ativa o filtro inicial: o que já tem .is-active, ou o primeiro do grupo.
        const initial = Array.from(filters).find(f => f.classList.contains('is-active')) || filters[0];
        if (initial) activate(initial.dataset.filter);
    });
})();
