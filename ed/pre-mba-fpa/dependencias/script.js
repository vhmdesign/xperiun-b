/* ═══════════════════════════════════════════════════════════════
   PRÉ-MBA FP&A, /ed/pre-mba-fpa/ (este arquivo em dependencias/)

   Dois comportamentos de scroll, um por seção:

     1. reveal do topo, onde a .pre-linha escala por cima do
        .pre-header enquanto ele esmaece, desfoca e se abre em dois
     2. pin da seção 2, com scrub do vídeo e troca dos dois cards

   A regra que vale pro arquivo inteiro: o JS MEDE e o CSS DECIDE. Aqui
   só saem variáveis e uma classe de estado; que efeito existe em qual
   breakpoint e pra que lado cada coisa vai é decisão do style.css.

   O reveal do topo é clone do padrão de ed/formacoes/script.js
   (pilares-profs sobe sobre sec-projetos) e de
   ed/pos-graduacoes/mba-fpa.js (mba-how sobe sobre mba-light).
   ═══════════════════════════════════════════════════════════════ */

/* Altura do header exposta em --pre-header-h. Muda com breakpoint e
   com a quebra do título, então precisa de ResizeObserver, não de uma
   medição única no load. */
(function () {
    var header = document.querySelector('.pre-top .pre-header');
    if (!header) return;

    function update() {
        header.style.setProperty('--pre-header-h', header.offsetHeight + 'px');
    }

    update();

    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(update).observe(header);
    }
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', update);
    }
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
})();

/* Fade do header conforme a .pre-linha o cobre.

   O progresso é geométrico, não em pixels de scroll: mede quanto da
   altura do header já foi coberta pelo topo da .pre-linha.

     0  topo da linha na base do header (nada coberto)
     1  topo da linha no topo do header (coberto por inteiro)

   getBoundingClientRect no header já devolve a posição deslocada pelo
   sticky, então a conta vale nos dois estados (rolando e colado).

   No mesmo passe saem outras três variáveis:

   --pre-figure-y   paralaxe vertical da figura: ela desce 1.1px por px
                    de avanço. O deslocamento é limitado à faixa útil,
                    porque no fim dela o header já está com opacidade 0
                    e só sobraria transform gigante sem nada visível.

   --pre-header-blur  desfoque do header acompanhando o fade, de 0 a
                    16px. Quem decide se ele vale é o CSS: acima de 864
                    o filter consome a variável, em tablet e mobile a
                    media query devolve filter: none.

   --pre-cards-x    deriva lateral dos cards do aside, de 0 a 64px.
                    Também é o CSS quem decide onde vale (só abaixo de
                    864) e para que lado cada card vai.

   --pre-lead-x     deriva lateral do lead e do aside inteiros, de 0 a
                    128px, o oposto do caso acima: só vale ACIMA de
                    864, onde os dois estão lado a lado.

   Todos partem do MESMO progresso, e todos começam depois de um
   respiro de 128px de scroll.

   Respeita prefers-reduced-motion: nesse caso o CSS já desliga o
   sticky, a opacidade, o blur e o transform, e aqui as variáveis nem
   são escritas. */
(function () {
    var VELOCIDADE = 1.1;   /* paralaxe da figura, px por px de scroll */
    var BLUR_MAX   = 16;    /* blur máximo do header, px               */
    var CARDS_MAX  = 64;    /* deriva lateral dos cards do aside, px   */
    var LEAD_MAX   = 128;   /* deriva lateral de lead e aside, px      */
    var RESPIRO    = 128;   /* px que a .pre-linha sobe antes de tudo  */

    var header = document.querySelector('.pre-top .pre-header');
    var linha  = document.querySelector('.pre-top .pre-linha');
    var figura = document.querySelector('.pre-top .pre-hd-figure');
    var aside  = document.querySelector('.pre-top .pre-hd-aside');
    if (!header || !linha) return;

    var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    var ticking = false;

    function apply() {
        ticking = false;

        if (reduz && reduz.matches) {
            header.style.removeProperty('--pre-header-fade');
            header.style.removeProperty('--pre-header-blur');
            header.style.removeProperty('--pre-lead-x');
            if (figura) figura.style.removeProperty('--pre-figure-y');
            if (aside)  aside.style.removeProperty('--pre-cards-x');
            return;
        }

        var h = header.offsetHeight;
        if (!h) return;

        /* Régua única de todos os efeitos: quantos px a .pre-linha já
           subiu sobre o header. Em desktop equivale ao scrollY, porque
           o header cola desde o topo; no mobile só começa a contar
           quando ele cola, que é quando a sobreposição existe.

           O RESPIRO desconta os primeiros 128px: a seção sobe esses
           128px com o header intacto e só depois o resto começa. A
           faixa restante (h - respiro) é normalizada em 0..1, então o
           fade continua terminando exatamente quando a seção cobre o
           header por inteiro. */
        var hr = header.getBoundingClientRect();
        var subiu = hr.bottom - linha.getBoundingClientRect().top;

        var efetivo = subiu - RESPIRO;
        if (efetivo < 0) efetivo = 0;

        var faixa = h - RESPIRO;
        if (faixa < 1) faixa = 1;
        if (efetivo > faixa) efetivo = faixa;

        var progresso = efetivo / faixa;

        header.style.setProperty('--pre-header-fade', String(1 - progresso));
        header.style.setProperty('--pre-header-blur', (progresso * BLUR_MAX) + 'px');

        /* Deriva lateral de lead e aside. Sempre positivo; o sinal (o
           lead pra esquerda, o aside pra direita) fica no CSS, e as
           regras só existem acima de 864. */
        header.style.setProperty('--pre-lead-x', (progresso * LEAD_MAX) + 'px');

        if (figura) {
            figura.style.setProperty('--pre-figure-y', (efetivo * VELOCIDADE) + 'px');
        }

        /* Deriva lateral dos cards do aside. O valor é sempre positivo;
           o sinal (esquerda ou direita) fica no CSS, por card, e as
           regras só existem abaixo de 864. */
        if (aside) {
            aside.style.setProperty('--pre-cards-x', (progresso * CARDS_MAX) + 'px');
        }
    }

    function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(apply);
    }

    apply();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('orientationchange', onScroll);
    if (reduz && reduz.addEventListener) {
        reduz.addEventListener('change', apply);
    }
})();

/* ═══════════════════════════════════════════════════════════════
   SEÇÃO 2: pin com scrub de vídeo e troca dos dois cards

   Progressive enhancement: a seção nasce empilhada e legível no CSS, e
   este IIFE liga o modo pin (classe .is-live no track) em qualquer
   largura, desligando só com prefers-reduced-motion. Sem JS os dois
   blocos ficam um sobre o outro no fluxo e nada some.

   A direção da troca dos cards é decisão do CSS, não daqui: vertical
   acima de 864, horizontal abaixo.

   Ligado, o progresso 0..1 dentro do curso do track comanda:
     --pre-vira-p    troca dos cards (o CSS traduz em translateY)
     video.currentTime   scrub do vídeo

   O vídeo é só rebobinado, nunca recebe play(): quem manda no tempo
   dele é o scroll.
   ═══════════════════════════════════════════════════════════════ */
(function () {
    var track = document.querySelector('.pre-vira-track');
    if (!track) return;

    var video  = track.querySelector('.pre-vira-video-el');
    var titulo = track.querySelector('.pre-vira-title');

    /* Altura real do título exposta em --pre-vira-ttl-h. O CSS usa ela
       na conta do teto de altura do vídeo e do painel, e ela muda com
       o breakpoint e com a quebra de linha do título. */
    if (titulo) {
        var medirTitulo = function () {
            track.style.setProperty('--pre-vira-ttl-h', titulo.offsetHeight + 'px');
        };
        medirTitulo();
        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(medirTitulo).observe(titulo);
        }
        window.addEventListener('resize', medirTitulo);
        window.addEventListener('orientationchange', medirTitulo);
    }

    var reduz    = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    var ticking  = false;
    var ligado   = false;
    var duracao  = 0;

    /* Gates de altura de viewport. No modo pin a seção é 100vh com
       overflow: clip, então conteúdo que não cabe é cortado sem chance
       de scroll: pior que não ter efeito nenhum. Abaixo do mínimo o pin
       simplesmente não liga e a seção volta a ser um bloco normal, que
       rola.

       Os dois limites saem de medição, não de chute:

       lado a lado (>864): título 72 + gap 48 + conteúdo natural do card
         mais alto 320 + padding 128 = 568  ->  gate em 560, com o teto
         de altura do CSS encolhendo o vídeo pra caber.

       empilhado (≤864): título 56 + vídeo 21:9 147 + card 392 +
         padding 128 = 723, e aqui não há o que encolher sem cortar
         texto  ->  gate em 720. */
    var alturaLado  = window.matchMedia && window.matchMedia('(min-height: 560px)');
    var alturaPilha = window.matchMedia && window.matchMedia('(min-height: 720px)');
    var estreito    = window.matchMedia && window.matchMedia('(max-width: 864px)');

    function podeLigar() {
        if (reduz && reduz.matches) return false;

        var gate = (estreito && estreito.matches) ? alturaPilha : alturaLado;
        if (gate && !gate.matches) return false;

        return true;
    }

    function apply() {
        ticking = false;

        if (!ligado) return;

        /* Curso útil = altura do track menos a viewport, que é o quanto
           dá pra rolar com a seção colada. */
        var r = track.getBoundingClientRect();
        var curso = track.offsetHeight - window.innerHeight;
        if (curso < 1) curso = 1;

        var p = -r.top / curso;
        if (p < 0) p = 0;
        if (p > 1) p = 1;

        track.style.setProperty('--pre-vira-p', String(p));

        /* Scrub. Só busca quando a diferença passa de um quadro, senão
           o seek fica brigando com ele mesmo a cada frame. */
        if (video && duracao) {
            var alvo = p * duracao;
            if (Math.abs(video.currentTime - alvo) > 1 / 60) {
                try { video.currentTime = alvo; } catch (e) {}
            }
        }
    }

    function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(apply);
    }

    function sync() {
        var deve = podeLigar();
        if (deve === ligado) { apply(); return; }

        ligado = deve;
        track.classList.toggle('is-live', ligado);

        if (!ligado) {
            track.style.removeProperty('--pre-vira-p');
        }
        apply();
    }

    /* Escolhe qual arquivo de vídeo carregar. Só um dos dois é baixado:
       a versão desktop (quadrada, 832px) ou a mobile (já recortada no
       21:9 do layout de baixo de 864). Feito aqui e não com
       <source media> porque em <video> esse atributo tem suporte
       inconsistente entre navegadores. */
    var mobile = window.matchMedia && window.matchMedia('(max-width: 864px)');

    function escolherFonte() {
        if (!video) return;

        var url = (mobile && mobile.matches)
            ? video.getAttribute('data-src-mobile')
            : video.getAttribute('data-src-desktop');
        if (!url) return;

        /* Já é esse arquivo: não recarrega. */
        if (video.getAttribute('src') === url) return;

        duracao = 0;
        video.setAttribute('src', url);
        video.load();
    }

    if (video) {
        video.addEventListener('loadedmetadata', function () {
            if (isFinite(video.duration)) {
                duracao = video.duration;
                apply();
            }
        });
    }

    escolherFonte();
    sync();

    function onResize() {
        escolherFonte();
        sync();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    if (mobile && mobile.addEventListener) mobile.addEventListener('change', onResize);
    if (reduz && reduz.addEventListener) reduz.addEventListener('change', sync);
    /* Os gates de altura também precisam reagir: girar o aparelho ou
       abrir o teclado muda a altura da viewport. */
    if (alturaLado && alturaLado.addEventListener) alturaLado.addEventListener('change', sync);
    if (alturaPilha && alturaPilha.addEventListener) alturaPilha.addEventListener('change', sync);
    if (estreito && estreito.addEventListener) estreito.addEventListener('change', sync);
})();

/* ═══════════════════════════════════════════════════════════════
   SEÇÃO 4: avatares da prova social

   Port do randomizador de /ed/aichampion/: as thumbs de depoimento
   compartilhadas do site entram como background dos .pre-prova-avatar,
   em ordem sorteada, pra pilha não ser sempre a mesma. São 11 arquivos
   pra 5 posições.
   ═══════════════════════════════════════════════════════════════ */
(function () {
    var caixas = document.querySelectorAll('.pre-prova-avatar');
    if (!caixas.length) return;

    var base = '/ed/site-dependencias/site-media/depoimento-video-thumb/';
    var nomes = ['claudio', 'cleiton', 'daniel', 'edson', 'eduardo', 'ezequiel',
                 'gabriel', 'louiz', 'pedro', 'vinicius', 'vitoria'];

    /* Fisher-Yates, como no original. */
    for (var i = nomes.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = nomes[i]; nomes[i] = nomes[j]; nomes[j] = t;
    }

    caixas.forEach(function (el, k) {
        el.style.backgroundImage = 'url(' + base + 'depoimento-video-thumb-' +
                                  nomes[k % nomes.length] + '.webp)';
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
    });
})();

/* ═══════════════════════════════════════════════════════════════
   BARRA DE CTA FIXA

   Port do controle do .bottom-cta de /ed/aichampion/, trocando o
   gatilho: lá a barra aparece depois da seção .completa, aqui depois do
   .pre-top (header mais seção 1) passar inteiro pelo topo da viewport.
   Assim existe um caminho de inscrição durante todo o corpo da landing,
   sem competir com o CTA do header enquanto ele está na tela.

   O rAF segura a leitura de layout numa por frame: getBoundingClientRect
   no listener de scroll sem isso força reflow a cada evento.
   ═══════════════════════════════════════════════════════════════ */
(function () {
    var barra = document.querySelector('.pre-bottom-cta');
    var topo = document.querySelector('.pre-top');
    if (!barra || !topo) return;

    var agendado = false;

    function atualizar() {
        agendado = false;
        barra.classList.toggle('is-hidden', topo.getBoundingClientRect().bottom > 0);
    }
    function onScroll() {
        if (agendado) return;
        agendado = true;
        requestAnimationFrame(atualizar);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    /* A altura do .pre-top só fica final depois das fontes e da figura
       do header. Se a primeira checagem cair antes disso, o gatilho
       pode dar positivo com a página no topo, a barra aparece e some em
       seguida, que era metade do pisca. O ResizeObserver cobre qualquer
       mudança de altura; load e fonts.ready cobrem o resto. */
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(onScroll).observe(topo);
    }
    window.addEventListener('load', onScroll);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(onScroll);
    }

    atualizar();
})();

/* ═══════════════════════════════════════════════════════════════
   SEÇÃO 5: scroll vertical vira deslocamento horizontal

   Port do driver do .fases-stage de /cp/data-squads/ (que veio do
   .mba-curriculum do MBA FP&A). A seção ganha altura de 100dvh mais o
   curso horizontal do trilho, o palco é sticky top 0 e, enquanto o
   usuário rola por dentro da seção, o palco fica parado e os cards
   deslizam pro lado.

   Abaixo de 865 desliga tudo, altura e transform zerados, e o CSS
   empilha. A largura é o único critério, sem detecção de toque: o
   Responsive Design Mode do DevTools emula toque por padrão e
   derrubaria o efeito em viewport desktop.
   ═══════════════════════════════════════════════════════════════ */
(function () {
    var sec = document.querySelector('.pre-aulas');
    if (!sec) return;
    var trilho = sec.querySelector('.pre-aulas-track');
    if (!trilho) return;

    function pequeno() { return window.innerWidth < 865; }

    /* clientWidth (e não innerWidth) exclui a barra de rolagem, batendo
       com o que o CSS enxerga. O padding direito do trilho entra na
       conta pro último card parar na mesma margem em que o primeiro
       começou. */
    function cursoMax() {
        if (pequeno()) return 0;
        var cards = trilho.querySelectorAll('.pre-aulas-card');
        if (!cards.length) return 0;
        var ultimo = cards[cards.length - 1];
        var padDir = parseFloat(getComputedStyle(trilho).paddingRight) || 0;
        return Math.max(0, ultimo.offsetLeft + ultimo.offsetWidth + padDir - sec.clientWidth);
    }

    function alturaSecao() {
        sec.style.height = pequeno() ? '' : 'calc(100dvh + ' + cursoMax() + 'px)';
    }

    function aplicar() {
        if (pequeno()) { trilho.style.transform = ''; return; }
        var progresso = Math.max(0, -sec.getBoundingClientRect().top);
        trilho.style.transform = 'translateX(' + -Math.min(progresso, cursoMax()) + 'px)';
    }

    window.addEventListener('scroll', aplicar, { passive: true });
    window.addEventListener('resize', function () { alturaSecao(); aplicar(); });
    window.addEventListener('orientationchange', function () { alturaSecao(); aplicar(); });
    /* As fontes mudam a altura do texto dos cards e, com isso, o curso. */
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { alturaSecao(); aplicar(); });
    }
    alturaSecao();
    aplicar();

    /* Entrada do trilho: o CSS deixa opacity 0 e a classe dispara a
       animação. Sem IntersectionObserver, entra direto, senão o trilho
       ficaria invisível. */
    if (window.IntersectionObserver) {
        new IntersectionObserver(function (entradas, obs) {
            if (!entradas[0].isIntersecting) return;
            trilho.classList.add('is-entered');
            obs.disconnect();
        }, { rootMargin: '0px 0px -15% 0px' }).observe(trilho);
    } else {
        trilho.classList.add('is-entered');
    }
})();

/* ═══════════════════════════════════════════════════════════════
   REVEAL DO FIM: --pre-aulas-h pro sticky de offset negativo

   Port do IIFE de --sec-fases-height de /cp/data-squads/. O CSS
   (.pre-fim-track .pre-aulas) precisa da altura REAL da seção em pixels
   pra montar top: calc(100dvh - altura).

   A altura aqui é duplamente dinâmica: o efeito horizontal a reescreve
   inline (100dvh mais o curso do trilho) a cada resize e a cada
   carregamento de fonte, e o curso muda com a largura. O
   ResizeObserver cobre isso sozinho; os listeners de viewport garantem
   atualização quando só o dvh muda (barra de endereço no mobile,
   rotação).
   ═══════════════════════════════════════════════════════════════ */
(function () {
    var sec = document.querySelector('.pre-fim-track .pre-aulas');
    if (!sec) return;

    function atualizar() {
        sec.style.setProperty('--pre-aulas-h', sec.offsetHeight + 'px');
    }

    atualizar();

    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(atualizar).observe(sec);
    }
    window.addEventListener('resize', atualizar);
    window.addEventListener('orientationchange', atualizar);
    window.addEventListener('load', atualizar);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(atualizar);
    }
})();

/* ═══════════════════════════════════════════════════════════════
   CTAs: abrir o popup de inscrição

   Os quatro CTAs da página (header, as duas ofertas e a barra fixa)
   declaram o alvo em data-abre-popup e nada mais. Antes isso morava num
   onclick inline em cada âncora, que é o padrão das outras páginas da
   casa; aqui saiu pra o HTML ficar sem JS.

   Delegação num listener só no documento, então CTA adicionado depois
   funciona sem religar nada. O openPopup é do form.js, que o
   form-include.js injeta junto com os popups: por isso a checagem antes
   de chamar, e por isso o preventDefault só acontece quando há popup pra
   abrir, deixando o href intacto se o form não tiver carregado.
   ═══════════════════════════════════════════════════════════════ */
(function () {
    document.addEventListener('click', function (e) {
        var alvo = e.target.closest('[data-abre-popup]');
        if (!alvo) return;

        var id = alvo.dataset.abrePopup;
        if (!id || typeof window.openPopup !== 'function') return;

        e.preventDefault();
        window.openPopup(id);
    });
})();
