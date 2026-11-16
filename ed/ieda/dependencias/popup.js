/* IEDA, /ed/ieda/: só o botão da oferta (.ieda-btn--oferta, data-cta="garantir-vaga") abre o
   popup de inscrição. Os outros CTAs (hero, "O projeto", painel do "O que você recebe" e o CTA
   fixo) são links pra seção de oferta (href="#oferta", data-cta="ir-oferta"), com a rolagem
   suave do scroll-suave.js.
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

/* CTA fixo no rodapé (.ieda-cta-fixo): aparece depois que "O projeto" (.ieda-projeto) saiu
   pelo topo da tela e some quando o "O que você recebe" (.ieda-recebe) entra na tela (dali
   pra baixo, inclusive na oferta, fica escondido). Escondido, sai do teclado (tabindex -1)
   e dos leitores de tela (aria-hidden). */
(function () {
    var barra = document.querySelector('.ieda-cta-fixo');
    var projeto = document.querySelector('.ieda-projeto');
    var recebe = document.querySelector('.ieda-recebe');
    if (!barra || !projeto) return;
    var btn = barra.querySelector('a');
    var agendado = false;

    function atualiza() {
        agendado = false;
        var passou = projeto.getBoundingClientRect().bottom <= 0;
        var chegouNoRecebe = recebe && recebe.getBoundingClientRect().top < window.innerHeight;
        var mostra = passou && !chegouNoRecebe;
        barra.classList.toggle('is-escondido', !mostra);
        barra.setAttribute('aria-hidden', mostra ? 'false' : 'true');
        if (btn) btn.tabIndex = mostra ? 0 : -1;
    }
    function agenda() {
        if (!agendado) { agendado = true; requestAnimationFrame(atualiza); }
    }
    window.addEventListener('scroll', agenda, { passive: true });
    window.addEventListener('resize', agenda);
    atualiza();
})();
