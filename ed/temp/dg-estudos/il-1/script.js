/* Ilustração 1: conectores dos cards e varredura da lupa.

   Conectores na mesma técnica do bloco .ds-squad de /cp/data-squads/ (item 1 do
   data-squads.js): um <path> SVG por ligação, com a geometria medida do layout
   real via getBoundingClientRect. Sem as partículas de lá: o traço é estático.

   Medir em vez de calcular é o ponto da técnica: quem posiciona os cards é o
   grid, e o JS só lê onde eles caíram. Some a dependência da altura do card
   (que antes era somada à mão no CSS e desalinhava os traços a cada mudança de
   padding, gap ou métrica de fonte) e o desenho passa a acompanhar qualquer
   mudança de layout sozinho. A varredura da lupa depende da mesma medição: as
   paradas são as coordenadas reais dos cards. */
(function () {
    var stage = document.querySelector('.il-lupa-stage');
    if (!stage) return;
    var fundo = stage.querySelector('.il-camada--fundo');
    var canvas = stage.querySelector('.il-camada--nitido .il-canvas');
    if (!fundo || !canvas) return;

    var NS = 'http://www.w3.org/2000/svg';
    var PONTA_W = 4, PONTA_H = 16;  /* retangulo que marca as pontas do traco */
    /* fracao do ciclo que cada parada passa PARADA; o resto do passo é a
       transição pra próxima. 0.72 dá 18% de pausa e 7% de movimento com 4
       paradas, ou seja, a lente descansa bem mais do que anda. */
    var PAUSA = 0.72;

    function cards(el) {
        return Array.prototype.slice.call(el.querySelectorAll('.il-card'));
    }

    /* A camada desfocada é um clone da nítida, feito aqui e não escrito no HTML:
       as duas precisam ser pixel a pixel idênticas pra as máscaras se encaixarem,
       e manter duas cópias da marcação à mão seria só uma chance de elas
       divergirem. Clonado ANTES de montar os conectores, então o clone entra com
       o .il-conn vazio e recebe os próprios paths no laço abaixo. */
    fundo.appendChild(canvas.cloneNode(true));

    /* ── conectores, uma vez por cópia do canvas ────────────────────── */
    var desenhos = [];
    Array.prototype.slice.call(stage.querySelectorAll('.il-canvas')).forEach(function (cv) {
        var d = conectar(cv);
        if (d) desenhos.push(d);
    });
    if (!desenhos.length) return;

    function conectar(cv) {
        var svg = cv.querySelector('.il-conn');
        var cols = Array.prototype.slice.call(cv.querySelectorAll('.il-col'));
        if (!svg || cols.length < 2) return null;

        /* Topologia derivada do DOM, não escrita à mão: todo card de uma coluna
           liga em todos os cards da coluna seguinte. É a regra do desenho ("o
           centro direito deles com o centro esquerdo do próximo e assim por
           diante"), então redistribuir os cards no HTML reconfigura os conectores
           sozinho, sem nenhuma lista de ligações pra manter em sincronia. */
        var links = [];
        for (var i = 0; i < cols.length - 1; i++) {
            var de = cards(cols[i]), para = cards(cols[i + 1]);
            for (var a = 0; a < de.length; a++) {
                for (var b = 0; b < para.length; b++) {
                    links.push({ de: de[a], para: para[b] });
                }
            }
        }
        if (!links.length) return null;

        links.forEach(function (l) {
            l.path = document.createElementNS(NS, 'path');
            svg.appendChild(l.path);
        });

        /* Pontas: o retângulo que marca o início e o fim dos traços. Uma por BORDA
           de card com ligação, não uma por ponta de path: no card do meio chegam
           dois conectores no mesmo ponto e saem outros dois, então por path seriam
           quatro retângulos empilhados exatamente no mesmo lugar. Por borda dão 9
           (contra 12 por ponta de path), sem sobreposição.
           Vêm depois dos paths no DOM pra pintar por cima do traço. */
        var pontas = [];
        cols.forEach(function (col, i) {
            cards(col).forEach(function (el) {
                if (i > 0) pontas.push({ el: el, lado: 'left' });
                if (i < cols.length - 1) pontas.push({ el: el, lado: 'right' });
            });
        });
        pontas.forEach(function (p) {
            p.rect = document.createElementNS(NS, 'rect');
            p.rect.setAttribute('width', PONTA_W);
            p.rect.setAttribute('height', PONTA_H);
            svg.appendChild(p.rect);
        });

        return { cv: cv, svg: svg, cols: cols, links: links, pontas: pontas };
    }

    function n(v) { return Math.round(v * 100) / 100; }

    /* Curva do centro da borda DIREITA de um card até o centro da borda ESQUERDA
       do próximo. Bézier cúbica única, sem canto nem trecho reto, com as duas
       alças na horizontal: o traço sai e chega perpendicular à borda do card,
       como no .ds-squad (lá as alças são verticais porque o fluxo é vertical;
       aqui o fluxo é da esquerda pra direita, então elas giram 90°).

       As duas alças ficam no meio-x do vão. Isso mantém a tangente horizontal
       nas duas pontas e nunca deixa a curva escapar da faixa entre os dois
       cards, seja a diferença de altura grande (card do meio, que sobe ou desce
       um card inteiro) ou zero (dois cards na mesma altura, onde a curva vira
       uma reta). Um comprimento de alça fixo não teria essa propriedade. */
    function route(x0, y0, x1, y1) {
        var mx = (x0 + x1) / 2;
        return 'M' + n(x0) + ' ' + n(y0) +
            ' C' + n(mx) + ' ' + n(y0) +
            ', ' + n(mx) + ' ' + n(y1) +
            ', ' + n(x1) + ' ' + n(y1);
    }

    /* Medir com o canvas ANIMADO é seguro porque tudo aqui é diferença entre dois
       retângulos do mesmo canvas: a translação do transform entra nos dois e se
       cancela. Só valeria pra translação, não pra escala. */
    function desenhar(d) {
        var c = d.cv.getBoundingClientRect();
        d.svg.setAttribute('width', c.width);
        d.svg.setAttribute('height', c.height);
        d.svg.setAttribute('viewBox', '0 0 ' + c.width + ' ' + c.height);
        d.links.forEach(function (l) {
            var a = l.de.getBoundingClientRect();
            var b = l.para.getBoundingClientRect();
            l.path.setAttribute('d', route(
                a.right - c.left, a.top - c.top + a.height / 2,
                b.left - c.left, b.top - c.top + b.height / 2
            ));
        });
        /* centrado no ponto onde o traco encosta: metade da largura pra tras em x
           e metade da altura pra cima em y, entao o retangulo fica montado na
           borda do card, com 2px de cada lado dela. */
        d.pontas.forEach(function (p) {
            var r = p.el.getBoundingClientRect();
            var x = (p.lado === 'left' ? r.left : r.right) - c.left;
            var y = r.top - c.top + r.height / 2;
            p.rect.setAttribute('x', n(x - PONTA_W / 2));
            p.rect.setAttribute('y', n(y - PONTA_H / 2));
        });
    }

    /* ── varredura da lupa ──────────────────────────────────────────────
       Uma parada por TIPO de card, que é uma parada por coluna: onde a coluna tem
       duas cópias da mesma etapa, centrar a primeira já mostra o tipo.

       O canvas está ancorado em left/top: 50% do palco, e a lupa é um círculo
       parado no centro do palco. Então o transform de cada parada é literalmente
       a coordenada do centro do card dentro do canvas, negativa: âncora no centro
       menos a posição do card põe aquele card exatamente sob a lente. Sem essa
       ancoragem em 50% a conta precisaria carregar o tamanho do palco também.

       As keyframes são geradas aqui porque dependem dessa medição, e regeradas
       junto com os traços: a altura dos cards muda quando a fonte real carrega, e
       com ela o centro de cada parada. Trocar o texto de uma @keyframes em
       execução não reinicia a animação, ela segue do mesmo ponto do ciclo. */
    var folha = document.createElement('style');
    document.head.appendChild(folha);

    var alvos = Array.prototype.slice.call(canvas.querySelectorAll('.il-col')).map(function (col) {
        return cards(col)[0];
    }).filter(Boolean);

    function paradas() {
        if (!alvos.length) return;
        var c = canvas.getBoundingClientRect();
        var passo = 100 / alvos.length;
        var quadros = alvos.map(function (el, i) {
            var r = el.getBoundingClientRect();
            var x = n(-(r.left - c.left + r.width / 2));
            var y = n(-(r.top - c.top + r.height / 2));
            var t = i * passo;
            return n(t) + '%, ' + n(t + passo * PAUSA) + '% { transform: translate(' + x + 'px, ' + y + 'px); }';
        });
        /* volta pra primeira parada no fim do ciclo, senão o infinite daria um
           salto seco da última pra primeira. */
        quadros.push('100% ' + quadros[0].slice(quadros[0].indexOf('{')));
        folha.textContent = '@keyframes il-lupa-pan {' + quadros.join('\n') + '}';
    }

    function tudo() {
        desenhos.forEach(desenhar);
        paradas();
    }

    tudo();
    /* is-pronto libera a animação e a visibilidade das duas camadas de uma vez:
       antes disso o canvas não tem transform nenhum e ficaria com o canto no
       centro do palco. Pela classe (e não no CSS de base) as duas cópias começam
       a animar no mesmo recálculo de estilo, o que é o que as mantém em passo. */
    stage.classList.add('is-pronto');

    if (window.ResizeObserver) {
        var ro = new ResizeObserver(tudo);
        ro.observe(stage);
        /* observar os cards também: a altura deles muda com o texto do label, e
           é isso que move o centro vertical dos traços e das paradas. */
        desenhos.forEach(function (d) { cards(d.cv).forEach(function (el) { ro.observe(el); }); });
    } else {
        window.addEventListener('resize', tudo);
    }
    /* o label e o ícone entram com fonte de fallback e mudam de altura quando a
       real carrega: sem este redraw o desenho fica parado na medida antiga. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(tudo);
})();
