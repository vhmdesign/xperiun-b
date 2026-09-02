/* ══════════════════════════════════════════════════════════════
   ESTUDO DO HERO (2a versão) — as ligações entre as colunas

   Por que JS aqui, sendo que as ligações DENTRO da pilha são SVG estático: lá o
   desenho tem proporção fixa (o losango é sempre metade da largura, o passo é sempre
   32% dela), então um viewBox resolve em qualquer tamanho. Entre colunas não há
   proporção nenhuma: a altura da linha do grid vem do conteúdo, as peças das fontes se
   repartem por ela com space-between, os nós ficam centrados numa coluna que muda de
   largura a cada breakpoint. Coordenada escrita à mão só acertaria numa largura.

   O jeito é o mesmo do diagnostico-avancado.js, e de propósito: medir com
   offsetLeft/offsetTop e redesenhar quando o tamanho muda.
   ══════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';
    var PONTA = 8;              /* o quadrado que marca a ponta do traço no nó */

    function n(v) { return Math.round(v * 100) / 100; }

    /* Posição de layout de um elemento dentro de `ate`: soma offsetLeft/offsetTop
       subindo a cadeia de offsetParent. Não uso getBoundingClientRect porque ele
       devolve coordenada de VIEWPORT e já com transform aplicado; aqui os planos da
       pilha levam transform, e a origem que interessa é a da caixa, não a de onde o
       transform a deixou. offsetLeft/offsetTop ignoram transform por definição, e a
       origem deles é a borda de padding do offsetParent, que é a mesma origem do SVG
       (absoluto com inset: 0 dentro do .hr). */
    function pos(el, ate) {
        var x = 0, y = 0, no = el;
        while (no && no !== ate) {
            x += no.offsetLeft;
            y += no.offsetTop;
            no = no.offsetParent;
        }
        return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
    }

    /* Curva do meio da borda DIREITA de uma peça até o meio da borda ESQUERDA da
       próxima, com as duas alças no meio-x do vão: o traço sai e chega perpendicular à
       borda e nunca escapa da faixa entre as duas peças, seja a diferença de altura
       grande ou zero. É a mesma route() das outras ilustrações. */
    function route(x0, y0, x1, y1) {
        var mx = (x0 + x1) / 2;
        return 'M' + n(x0) + ' ' + n(y0) +
            ' C' + n(mx) + ' ' + n(y0) +
            ', ' + n(mx) + ' ' + n(y1) +
            ', ' + n(x1) + ' ' + n(y1);
    }

    var hr = document.querySelector('.hr');
    var svg = hr && hr.querySelector('.hr-fluxo');
    if (!svg) return;

    /* Por data-etapa e não por ordem no documento: as duas colunas de lista usam a
       mesma .hr-card, então um seletor solto pegaria as duas de uma vez e os índices do
       data-de passariam a depender de onde cada coluna caiu no HTML. */
    var fontes = Array.prototype.slice.call(hr.querySelectorAll('[data-etapa="fontes"] .hr-card'));
    /* O card de conteúdo dentro do baralho, e não o baralho: cada item da governança
       tem quatro .hr-card (o de conteúdo e os três vazios da pilha), então o seletor
       precisa do :not pra a ligação chegar uma vez só. E é o card, e não o baralho,
       porque o baralho reserva no padding o espaço da pilha: medi-lo colocaria a
       chegada meia pilha abaixo do meio do card. */
    var governanca = Array.prototype.slice.call(
        hr.querySelectorAll('[data-etapa="governanca"] .hr-baralho > .hr-card:not(.hr-fake)'));
    var nos = Array.prototype.slice.call(hr.querySelectorAll('.hr-conector'));
    /* A pilha inteira, e não cada plano: a plataforma é UMA coisa, e as cinco camadas
       são o desenho dela por dentro, não cinco destinos. Todos os nós entregam no mesmo
       ponto, o meio da borda esquerda da pilha. */
    var pilha = hr.querySelector('.hr-pilha');

    /* A topologia é declarada no HTML, não aqui: cada nó diz de quais fontes recebe, no
       data-de, com os índices de 1 a 5. Assim o desenho continua descrito onde está o
       conteúdo, como as posições --col/--span e --z, e este arquivo só sabe medir e
       traçar. */
    var links = [], pontas = [];
    nos.forEach(function (no) {
        (no.getAttribute('data-de') || '').split(',').forEach(function (i) {
            var de = fontes[parseInt(i, 10) - 1];
            if (de) links.push({ de: de, para: no });
        });
        if (pilha) links.push({ de: no, para: pilha });
    });
    /* A plataforma entrega em cada item da governança. Sai toda do mesmo ponto, o meio
       da borda direita da pilha, pelo mesmo motivo que recebe num ponto só: ela é uma
       coisa, e as cinco camadas são o desenho dela por dentro. */
    if (pilha) governanca.forEach(function (item) {
        links.push({ de: pilha, para: item });
    });
    /* E a governança entrega no BI, os três num ponto só. O alvo é a LISTA da coluna, e
       não uma peça dela: a entrega é na coluna inteira, e o meio da borda esquerda da
       lista é o centro dela. Como a lista tem 16 de recuo à esquerda, a ponta para nesse
       vão e não encosta em card nenhum, que é o papel do recuo. */
    var bi = hr.querySelector('[data-etapa="bi"] [data-alvo]');
    if (bi) governanca.forEach(function (item) {
        links.push({ de: item, para: bi });
    });
    if (!links.length) return;

    /* As pontas saem das próprias ligações, e não de uma lista à parte: assim toda
       ligação tem quadrado nos dois lados por construção, e nenhuma ponta fica de fora
       quando a topologia muda no HTML.

       Uma por BORDA, não uma por traço: um nó recebe duas ligações no mesmo ponto e a
       pilha recebe quatro, e por traço seriam vários quadrados empilhados no mesmo
       lugar. Daí a busca antes de empurrar. */
    function ponta(el, lado) {
        for (var i = 0; i < pontas.length; i++) {
            if (pontas[i].el === el && pontas[i].lado === lado) return;
        }
        pontas.push({ el: el, lado: lado });
    }
    links.forEach(function (l) {
        ponta(l.de, 'dir');
        ponta(l.para, 'esq');
    });

    links.forEach(function (l) {
        l.path = document.createElementNS(NS, 'path');
        svg.appendChild(l.path);
    });
    /* Os quadrados entram depois dos traços no DOM pra pintar por cima deles.

       O estado vem do selo da peça, lido do DOM, e não de uma lista escrita aqui: o selo
       é o único lugar que diz onde está o problema, então mover o selo no HTML leva
       junto a cor da ponta. Uma segunda lista aqui seria uma segunda verdade, e as duas
       sairiam do lugar na primeira vez que alguém mexesse só numa.

       A ponta é verde por padrão, dos dois lados: o normal do desenho é o dado passar
       bem, e é a exceção que tem que saltar. As duas exceções dizem coisas diferentes. Na
       saída, a cor do estado da própria peça. Na entrada, o cinza de quando pelo menos
       uma origem está suja. Peça sem saída, como o relatório em erro, não tem ponta
       colorida, porque a ponta não existe. */
    /* O estado próprio de uma peça: o selo que ela leva, e só o dela. :scope > porque a
       busca precisa parar nos filhos diretos. Sem isso a chegada no BI, que é a lista
       inteira da coluna, acharia o selo de erro que mora num dos relatórios dentro dela e
       se daria por doente: um container não está em erro só porque alguma coisa dentro
       dele está. */
    function estado(el) {
        if (el.querySelector(':scope > .hr-selo--er')) return 'is-er';
        if (el.querySelector(':scope > .hr-selo--wr')) return 'is-wr';
        return '';
    }

    pontas.forEach(function (p) {
        p.rect = document.createElementNS(NS, 'rect');
        p.rect.setAttribute('width', PONTA);
        p.rect.setAttribute('height', PONTA);

        var cls = '';
        if (p.lado === 'dir') {
            /* Saída: leva o estado da própria peça, e verde quando a peça está limpa.
               O que uma peça contamina é o que sai dela, não o que chega. */
            cls = estado(p.el) || 'is-ok';
        } else {
            /* Entrada: verde quando TUDO que desemboca ali está limpo. Basta uma origem
               em alerta ou erro pra a chegada voltar ao cinza, e é de propósito que ela
               não fique amarela nem vermelha: o problema é de quem enviou, e pintar a
               chegada com a cor do estado diria que o problema é daqui. O cinza é a
               ausência de afirmação, e é isso que se quer dizer.

               A propagação é lida das ligações que já existem, então ela acompanha
               qualquer mudança de topologia no HTML sem nada a acertar aqui. */
            var sujo = links.some(function (l) {
                return l.para === p.el && estado(l.de);
            });
            if (!sujo) cls = 'is-ok';
        }
        if (cls) p.rect.setAttribute('class', cls);
        svg.appendChild(p.rect);
    });

    function desenhar() {
        var w = hr.offsetWidth, h = hr.offsetHeight;
        svg.setAttribute('width', w);
        svg.setAttribute('height', h);
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

        links.forEach(function (l) {
            var a = pos(l.de, hr), b = pos(l.para, hr);
            /* Sai pela direita da peça de origem e chega pela esquerda da de destino.
               Na pilha, o meio da borda esquerda cai na altura do centro dela, que é
               onde os quatro nós convergem. */
            l.path.setAttribute('d', route(
                a.x + a.w, a.y + a.h / 2,
                b.x, b.y + b.h / 2
            ));
        });

        pontas.forEach(function (p) {
            var r = pos(p.el, hr);
            var x = p.lado === 'esq' ? r.x : r.x + r.w;
            p.rect.setAttribute('x', n(x - PONTA / 2));
            p.rect.setAttribute('y', n(r.y + r.h / 2 - PONTA / 2));
        });
    }

    desenhar();
    /* ResizeObserver no lugar de só window.resize: a altura da linha do grid muda
       quando o conteúdo muda de tamanho (um rótulo que passa a quebrar em duas linhas,
       por exemplo), e isso não gera evento de resize da janela. */
    if (window.ResizeObserver) new ResizeObserver(desenhar).observe(hr);
    else window.addEventListener('resize', desenhar);
    /* As fontes de texto chegam depois do primeiro desenho e mudam a altura das peças,
       o que move o centro de cada borda. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(desenhar);
})();
