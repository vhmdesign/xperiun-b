/* IEDA, /ed/ieda/: os CTAs (data-cta="garantir-vaga") abrem o popup de inscrição.
   O popup vem de /ed/site-dependencias/site-popups/form-ieda.html (form-include.js);
   o openPopup é do form.js. Sem ele (ainda carregando), o clique não faz nada (href="#"). */
(function () {
    document.addEventListener('click', function (e) {
        var alvo = e.target.closest('[data-cta="garantir-vaga"]');
        if (!alvo) return;

        e.preventDefault();

        if (typeof window.openPopup !== 'function') return;
        window.openPopup('popup-form-ieda');
    });
})();
