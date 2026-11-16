/*
 * IEDA, "O que você recebe" (/ed/ieda/): inventário de 8 itens.
 * Os slots são abas (role=tab) de um painel só (#ieda-item). Selecionar um slot (clique, ou
 * setas/Home/End com o foco nos slots) leva o conteúdo dele pro painel: número, raridade,
 * ícone, nome completo e descrição (vêm dos data-* do slot). A cor de cada item é a da
 * raridade (data-raridade, no CSS).
 * Troca sozinha pro próximo a cada 6s com a seção na tela; pausa com o mouse em cima ou com
 * o foco dentro da seção. Quem conta o tempo é a barra do item ativo (.ieda-item-barra,
 * animação ieda-barra de 6s no CSS): ela enche como progresso e, no animationend, troca.
 * Pausar só congela a barra (.is-rodando sai do painel), então a troca espera junto e
 * retoma de onde parou. Com prefers-reduced-motion não troca sozinha.
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
        // tira e recoloca o is-ativo (com reflow no meio): a barra recomeça do zero mesmo
        // quando o item selecionado é o mesmo
        barras.forEach(function (b) { b.classList.remove('is-ativo'); });
        barras[i].getBoundingClientRect();
        barras[i].classList.add('is-ativo');
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
        });
    });

    // troca automática: a barra do ativo anda só com .is-rodando; no fim dela, o próximo
    var visivel = false, pausado = false;
    function reinicia() {
        painel.classList.toggle('is-rodando', !reduz && visivel && !pausado);
    }
    painel.addEventListener('animationend', function (e) {
        if (e.animationName !== 'ieda-barra' || e.target !== barras[atual]) return;
        seleciona((atual + 1) % slots.length);
    });
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

    /* Abaixo de 864 (CSS): sem slots e sem o painel único. Cada item vira um card próprio,
       igual ao painel (clone dele, com o mesmo conteúdo dos data-* do slot) sem a barra e sem o botão,
       todos visíveis em lista. Montados uma vez aqui; o CSS só mostra a lista em <=864.
       Clonar o painel mantém o que cada versão tem nele (ex.: os losangos da prévia
       /ed/ieda/contraste/). */
    var lista = document.createElement('ul');
    lista.className = 'ieda-itens';
    lista.setAttribute('role', 'list');
    slots.forEach(function (s, i) {
        var c = painel.cloneNode(true);
        c.removeAttribute('id');
        c.removeAttribute('role');
        c.removeAttribute('tabindex');
        c.removeAttribute('aria-labelledby');
        c.classList.remove('is-trocando', 'is-rodando');
        c.setAttribute('data-raridade', s.getAttribute('data-raridade'));
        var barra = c.querySelector('.ieda-item-barra');
        if (barra) barra.remove();
        // sem o botão nos cards da lista
        var btn = c.querySelector('.ieda-btn');
        if (btn) btn.remove();
        c.querySelector('.ieda-item-num').textContent = String(i + 1).padStart(2, '0');
        c.querySelector('.ieda-item-raridade').textContent = s.getAttribute('data-raridade-rotulo');
        var img = c.querySelector('.ieda-item-icone');
        img.loading = 'lazy';
        img.src = s.getAttribute('data-icone');
        c.querySelector('.ieda-item-nome').textContent = s.getAttribute('data-nome');
        c.querySelector('.ieda-item-desc').textContent = s.getAttribute('data-desc');
        var li = document.createElement('li');
        li.appendChild(c);
        lista.appendChild(li);
    });
    painel.parentNode.insertBefore(lista, painel.nextSibling);
})();
