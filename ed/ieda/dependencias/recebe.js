/*
 * IEDA, "O que você recebe" (/ed/ieda/): inventário de 8 itens.
 *
 * Os slots são abas (role=tab). O HTML traz só o item 01 (.ieda-item, dentro de
 * .ieda-painel); aqui ele vira molde dos outros 7, cada um completo e com o seu conteúdo
 * (número, raridade, ícone, nome e descrição vêm dos data-* do slot; data-item e
 * data-icone-item dão visual próprio a um item, ex.: o 08, do AI Summit). Os 8 ficam
 * empilhados na mesma célula (CSS): trocar de item é só mover o .is-ativo. O que sai ganha
 * .is-saiu (sobe e esmaece) e o que entra vem de baixo; só opacity e transform animam.
 *
 * Troca sozinha pro próximo a cada 4s com a seção na tela. Quem conta o tempo é a barra do
 * item ativo (o traço .is-atual dele, animação ieda-barra de 4s no CSS): ela enche como
 * progresso e, no animationend, troca. Pausa com o mouse em cima do painel (:hover no CSS)
 * ou com o foco nele (.is-rodando sai do painel); clicar num slot não pausa, a barra
 * recomeça do zero e segue. Pausar só congela a barra, então a troca espera junto e retoma
 * de onde parou. Com prefers-reduced-motion não troca sozinha.
 *
 * Abaixo de 864 (CSS) não há slots: o painel vira a lista com os 8 itens visíveis (sem
 * barra e sem botão); aqui eles deixam de ficar escondidos pra leitores de tela.
 */
(function () {
    var secao = document.querySelector('.ieda-recebe');
    if (!secao) return;
    var slots = Array.prototype.slice.call(secao.querySelectorAll('.ieda-slot'));
    var painel = secao.querySelector('.ieda-painel');
    var molde = painel && painel.querySelector('.ieda-item');
    if (!slots.length || !molde) return;

    var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lista = window.matchMedia ? window.matchMedia('(max-width: 864px)') : { matches: false };
    var atual = 0;

    function dois(n) { return String(n).padStart(2, '0'); }

    // monta os 8 itens: o 01 é o próprio molde (já vem preenchido no HTML)
    var itens = slots.map(function (s, i) {
        var it = i === 0 ? molde : molde.cloneNode(true);
        it.id = 'ieda-item-' + dois(i + 1);
        it.setAttribute('aria-labelledby', s.id);
        it.setAttribute('data-raridade', s.getAttribute('data-raridade'));
        var marca = s.getAttribute('data-item');
        if (marca) it.setAttribute('data-item', marca); else it.removeAttribute('data-item');
        it.classList.toggle('is-ativo', i === 0);
        it.querySelector('.ieda-item-num').textContent = dois(i + 1);
        it.querySelector('.ieda-item-raridade').textContent = s.getAttribute('data-raridade-rotulo');
        var img = it.querySelector('.ieda-item-icone');
        if (i > 0) img.loading = 'lazy';
        img.src = s.getAttribute('data-icone-item') || s.getAttribute('data-icone');
        it.querySelector('.ieda-item-nome').textContent = s.getAttribute('data-nome');
        it.querySelector('.ieda-item-desc').textContent = s.getAttribute('data-desc');
        // na barra de cada item, o traço da posição dele é o que enche
        it.querySelectorAll('.ieda-item-barra span').forEach(function (b, j) {
            b.classList.toggle('is-atual', j === i);
        });
        s.setAttribute('aria-controls', it.id);
        if (i > 0) painel.appendChild(it);
        return it;
    });

    // acessibilidade: no painel só o ativo existe pra leitor de tela e teclado; na lista
    // (<=864) todos
    function acessivel() {
        itens.forEach(function (it, i) {
            var oculto = !lista.matches && i !== atual;
            it.toggleAttribute('inert', oculto);
            if (oculto) it.setAttribute('aria-hidden', 'true'); else it.removeAttribute('aria-hidden');
            it.tabIndex = !lista.matches && i === atual ? 0 : -1;
            if (lista.matches) it.removeAttribute('role'); else it.setAttribute('role', 'tabpanel');
        });
    }
    if (lista.addEventListener) lista.addEventListener('change', acessivel);

    // reinicia a barra do item (tira e recoloca o .is-atual com reflow no meio)
    function zeraBarra(it) {
        var b = it.querySelector('.ieda-item-barra .is-atual');
        if (!b) return;
        b.classList.remove('is-atual');
        b.getBoundingClientRect();
        b.classList.add('is-atual');
    }

    function seleciona(i, foca) {
        var s = slots[i];
        slots.forEach(function (b, j) {
            b.setAttribute('aria-selected', j === i ? 'true' : 'false');
            b.tabIndex = j === i ? 0 : -1;
        });
        if (foca) s.focus();
        if (i === atual) { zeraBarra(itens[i]); return; }

        var sai = itens[atual], entra = itens[i];
        // o que entra sempre vem de baixo: se ele tinha saído pra cima, volta pra baixo
        // sem animar (está invisível) antes de entrar
        if (entra.classList.contains('is-saiu')) {
            entra.style.transition = 'none';
            entra.classList.remove('is-saiu');
            entra.getBoundingClientRect();
            entra.style.transition = '';
        }
        itens.forEach(function (it) { if (it !== sai) it.classList.remove('is-saiu'); });
        sai.classList.remove('is-ativo');
        sai.classList.add('is-saiu');
        entra.classList.add('is-ativo');
        atual = i;
        zeraBarra(entra);
        acessivel();
    }

    slots.forEach(function (b, j) {
        b.addEventListener('click', function () { seleciona(j); });
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
    var visivel = false, focoNoPainel = false;
    function reinicia() {
        painel.classList.toggle('is-rodando', !reduz && visivel && !focoNoPainel);
    }
    painel.addEventListener('animationend', function (e) {
        if (e.animationName !== 'ieda-barra' || !itens[atual].contains(e.target)) return;
        seleciona((atual + 1) % slots.length);
    });
    painel.addEventListener('focusin', function () { focoNoPainel = true; reinicia(); });
    painel.addEventListener('focusout', function (e) {
        if (!painel.contains(e.relatedTarget)) { focoNoPainel = false; reinicia(); }
    });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
            es.forEach(function (e) { visivel = e.isIntersecting; reinicia(); });
        }, { threshold: 0.3 }).observe(secao);
    }

    acessivel();
})();
