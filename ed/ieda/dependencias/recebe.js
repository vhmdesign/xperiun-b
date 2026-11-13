/*
 * IEDA, "O que você recebe" (/ed/ieda/): inventário de 8 itens.
 * Os slots são abas (role=tab) de um painel só (#ieda-item). Selecionar um slot (clique, ou
 * setas/Home/End com o foco nos slots) leva o conteúdo dele pro painel: número, raridade,
 * ícone, nome completo e descrição (vêm dos data-* do slot). A cor de cada item é a da
 * raridade (data-raridade, no CSS).
 * Troca sozinha pro próximo a cada 6s com a seção na tela; pausa com o mouse em cima ou com
 * o foco dentro da seção. Com prefers-reduced-motion não troca sozinha.
 */
(function () {
    var secao = document.querySelector('.ieda-recebe');
    if (!secao) return;
    var slots = Array.prototype.slice.call(secao.querySelectorAll('.ieda-slot'));
    var painel = secao.querySelector('.ieda-item');
    if (!slots.length || !painel) return;

    var num = painel.querySelector('.ieda-item-num');
    var rar = painel.querySelector('.ieda-item-raridade');
    var ico = painel.querySelector('.ieda-item-icone');
    var nome = painel.querySelector('.ieda-item-nome');
    var desc = painel.querySelector('.ieda-item-desc');
    var barras = Array.prototype.slice.call(painel.querySelectorAll('.ieda-item-barra span'));
    var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var empilhado = window.matchMedia ? window.matchMedia('(max-width: 864px)') : { matches: false };
    var atual = 0;

    function seleciona(i, foca) {
        atual = i;
        var s = slots[i];
        slots.forEach(function (b, j) {
            b.setAttribute('aria-selected', j === i ? 'true' : 'false');
            b.tabIndex = j === i ? 0 : -1;
        });
        barras.forEach(function (b, j) { b.classList.toggle('is-ativo', j === i); });
        painel.setAttribute('aria-labelledby', s.id);
        painel.setAttribute('data-raridade', s.getAttribute('data-raridade'));
        num.textContent = String(i + 1).padStart(2, '0');
        rar.textContent = s.getAttribute('data-raridade-rotulo');
        ico.src = s.getAttribute('data-icone');
        nome.textContent = s.getAttribute('data-nome');
        desc.textContent = s.getAttribute('data-desc');
        // reinicia a entrada do conteúdo (fade + o ícone girando pro lugar)
        painel.classList.remove('is-trocando');
        painel.getBoundingClientRect();
        painel.classList.add('is-trocando');
        if (foca) s.focus();
    }

    slots.forEach(function (b, j) {
        b.addEventListener('click', function () {
            seleciona(j);
            reinicia();
            // abaixo de 864 o painel fica acima dos slots: se ele saiu da tela, rola até ele
            if (empilhado.matches && painel.getBoundingClientRect().top < 0) {
                painel.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' });
            }
        });
        b.addEventListener('keydown', function (e) {
            var n = slots.length, p = -1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') p = (j + 1) % n;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') p = (j - 1 + n) % n;
            else if (e.key === 'Home') p = 0;
            else if (e.key === 'End') p = n - 1;
            if (p < 0) return;
            e.preventDefault();
            seleciona(p, true);
            reinicia();
        });
    });

    // troca automática
    var visivel = false, pausado = false, timer = null;
    function reinicia() {
        clearTimeout(timer);
        if (reduz || !visivel || pausado) return;
        timer = setTimeout(function () { seleciona((atual + 1) % slots.length); reinicia(); }, 6000);
    }
    secao.addEventListener('mouseenter', function () { pausado = true; reinicia(); });
    secao.addEventListener('mouseleave', function () { pausado = false; reinicia(); });
    secao.addEventListener('focusin', function () { pausado = true; reinicia(); });
    secao.addEventListener('focusout', function (e) {
        if (!secao.contains(e.relatedTarget)) { pausado = false; reinicia(); }
    });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
            es.forEach(function (e) { visivel = e.isIntersecting; reinicia(); });
        }, { threshold: 0.3 }).observe(secao);
    }

    seleciona(0);
    painel.classList.remove('is-trocando');
})();
