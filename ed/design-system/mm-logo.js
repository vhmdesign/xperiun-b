/* Logo actions: clipboard + download.
   Botões com `data-copy-svg="path/to.svg"` fazem fetch do arquivo e
   copiam o conteúdo via `navigator.clipboard.writeText()`.
   Botões com `data-download-png="https://…"` disparam download via
   anchor sintetizado. Atributo vazio = URL ainda não fornecida (mostra
   feedback "URL pendente").

   Ambos exibem feedback in-button por 1.5s e chamam preventDefault +
   stopPropagation pra não disparar o popup do btn-data.js. */
(function () {
    'use strict';

    const FEEDBACK_MS = 1500;

    function flashFeedback(btn, message) {
        if (btn.dataset.flashing === 'true') return;
        btn.dataset.flashing = 'true';
        const original = btn.textContent;
        btn.textContent = message;
        setTimeout(() => {
            btn.textContent = original;
            delete btn.dataset.flashing;
        }, FEEDBACK_MS);
    }

    function copySvg(btn) {
        /* Lê o <svg> inline irmão do botão (mesmo .mm-logo-tile).
           Sem fetch: nenhum dev server pode injetar nada porque o SVG já
           está no DOM. outerHTML preserva atributos, viewBox, gradients,
           defs: tudo que faz o SVG renderizar. */
        const tile = btn.closest('.mm-logo-tile');
        const svg = tile && tile.querySelector('svg');
        if (!svg) {
            flashFeedback(btn, 'SVG não encontrado');
            return;
        }
        navigator.clipboard.writeText(svg.outerHTML).then(
            () => flashFeedback(btn, 'Copiado!'),
            (err) => {
                flashFeedback(btn, 'Erro');
                console.error('Clipboard write failed:', err);
            }
        );
    }

    function downloadPng(btn) {
        const url = btn.getAttribute('data-download-png');
        if (!url) {
            flashFeedback(btn, 'URL pendente');
            return;
        }
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    document.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('[data-copy-svg]');
        if (copyBtn) {
            e.preventDefault();
            e.stopPropagation();
            copySvg(copyBtn);
            return;
        }

        const dlBtn = e.target.closest('[data-download-png]');
        if (dlBtn) {
            e.preventDefault();
            e.stopPropagation();
            downloadPng(dlBtn);
        }
    });
})();
