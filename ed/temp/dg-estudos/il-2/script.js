/* Conectores da ilustração 2.

   Mesma técnica da il-1 e do bloco .ds-squad de /cp/data-squads/: um <path> SVG
   por ligação, com a geometria medida do layout real via getBoundingClientRect.
   Sem a lupa daqui: aqui é só o traço.

   Medir em vez de calcular é o ponto da técnica: quem posiciona as peças é o
   grid, e o JS só lê onde elas caíram. Some a dependência da altura da peça e do
   degrau de cada coluna, que de outro modo teriam que ser somados à mão no CSS e
   desalinhariam a cada ajuste de padding, gap ou métrica de fonte. Trocar o
   --sobe de uma coluna no HTML já reposiciona os traços. */
(function () {
    var canvas = document.querySelector('.il-canvas');
    if (!canvas) return;
    var svg = canvas.querySelector('.il-conn');
    /* :not(.il-col--solta) porque nem toda coluna faz parte da corrente. A peça da
       causa raiz mora numa coluna própria, fora do fluxo das etapas, e sem esse
       filtro ela entraria na sequência e ganharia um conector vindo da última
       etapa, que não existe no desenho. */
    var cols = Array.prototype.slice.call(canvas.querySelectorAll('.il-col:not(.il-col--solta)'));
    if (!svg || cols.length < 2) return;

    var NS = 'http://www.w3.org/2000/svg';
    var PONTA_W = 4, PONTA_H = 16;  /* retangulo que marca as pontas do traco */

    function cards(col) {
        return Array.prototype.slice.call(col.querySelectorAll('.il-card'));
    }

    /* Topologia derivada do DOM, não escrita à mão: toda peça de uma coluna liga
       em todas as peças da coluna seguinte. Aqui isso dá uma corrente simples,
       porque cada coluna tem uma peça só, mas a regra é a mesma da il-1: mudar a
       distribuição no HTML reconfigura os conectores sozinho. */
    var links = [];
    for (var i = 0; i < cols.length - 1; i++) {
        var de = cards(cols[i]), para = cards(cols[i + 1]);
        for (var a = 0; a < de.length; a++) {
            for (var b = 0; b < para.length; b++) {
                links.push({ de: de[a], para: para[b] });
            }
        }
    }
    if (!links.length) return;

    links.forEach(function (l) {
        l.path = document.createElementNS(NS, 'path');
        svg.appendChild(l.path);
    });

    /* Pontas: uma por BORDA de peça com ligação, não uma por ponta de path. Aqui
       as duas contas dariam o mesmo (a corrente não tem peça recebendo mais de um
       traço), mas a regra por borda é a que continua valendo se a ilustração
       ganhar uma coluna com duas peças.
       Vêm depois dos paths no DOM pra pintar por cima do traço. */
    var pontas = [];
    cols.forEach(function (col, i) {
        cards(col).forEach(function (el) {
            if (i > 0) pontas.push({ el: el, lado: 'left', col: i });
            if (i < cols.length - 1) pontas.push({ el: el, lado: 'right', col: i });
        });
    });

    /* O trecho que sai da peça em alerta é o caminho por onde o defeito segue
       adiante, e as duas pontas dele mudam de cor. Descobrir qual é lendo o DOM, e
       não marcando no HTML: a peça em alerta é a que tem .il-card--alerta, então
       mover o alerta pra outra etapa reposiciona as pontas coloridas sozinho.
       Ponta de SAÍDA: a da direita da própria peça em alerta.
       Ponta de ENTRADA: a da esquerda de quem está na coluna seguinte. */
    var colAlerta = -1;
    cols.forEach(function (col, i) {
        if (col.querySelector('.il-card--alerta')) colAlerta = i;
    });

    /* A etapa seguinte à do alerta é a que recebe o defeito, e marca isso nos
       quadradinhos dela. Marcada aqui, e não à mão no HTML, pelo mesmo motivo das
       pontas: assim a posição do alerta é o ÚNICO lugar que descreve onde está o
       problema, e mover o .il-card--alerta leva junto as pontas, os quadradinhos e
       a leitura inteira. Escrever a jusante no HTML seria a mesma informação em
       dois lugares, prontos pra discordar. */
    if (colAlerta >= 0 && cols[colAlerta + 1]) {
        cards(cols[colAlerta + 1]).forEach(function (el) {
            el.classList.add('il-card--jusante');
        });
    }
    pontas.forEach(function (p) {
        p.erro = colAlerta >= 0 && (
            (p.lado === 'right' && p.col === colAlerta) ||
            (p.lado === 'left' && p.col === colAlerta + 1)
        );
    });

    pontas.forEach(function (p) {
        p.rect = document.createElementNS(NS, 'rect');
        p.rect.setAttribute('width', PONTA_W);
        p.rect.setAttribute('height', PONTA_H);
        if (p.erro) p.rect.setAttribute('class', 'is-erro');
        svg.appendChild(p.rect);
    });

    function n(v) { return Math.round(v * 100) / 100; }

    /* Curva do centro da borda DIREITA de uma peça até o centro da borda ESQUERDA
       da próxima. Bézier cúbica única, sem canto nem trecho reto, com as duas
       alças na horizontal: o traço sai e chega perpendicular à borda.

       As duas alças ficam no meio-x do vão. Isso mantém a tangente horizontal nas
       duas pontas e nunca deixa a curva escapar da faixa entre as duas peças, o
       que aqui importa mais do que na il-1: o degrau de 128 é maior que o vão de
       96, então a curva é bem mais alta que larga. Um comprimento de alça fixo
       estouraria pros lados nessa proporção. */
    function route(x0, y0, x1, y1) {
        var mx = (x0 + x1) / 2;
        return 'M' + n(x0) + ' ' + n(y0) +
            ' C' + n(mx) + ' ' + n(y0) +
            ', ' + n(mx) + ' ' + n(y1) +
            ', ' + n(x1) + ' ' + n(y1);
    }

    function draw() {
        var c = canvas.getBoundingClientRect();
        svg.setAttribute('width', c.width);
        svg.setAttribute('height', c.height);
        svg.setAttribute('viewBox', '0 0 ' + c.width + ' ' + c.height);
        links.forEach(function (l) {
            var a = l.de.getBoundingClientRect();
            var b = l.para.getBoundingClientRect();
            l.path.setAttribute('d', route(
                a.right - c.left, a.top - c.top + a.height / 2,
                b.left - c.left, b.top - c.top + b.height / 2
            ));
        });
        /* centrado no ponto onde o traco encosta: metade da largura pra tras em x
           e metade da altura pra cima em y, entao o retangulo fica montado na
           borda da peca, com 2px de cada lado dela. */
        pontas.forEach(function (p) {
            var r = p.el.getBoundingClientRect();
            var x = (p.lado === 'left' ? r.left : r.right) - c.left;
            var y = r.top - c.top + r.height / 2;
            p.rect.setAttribute('x', n(x - PONTA_W / 2));
            p.rect.setAttribute('y', n(y - PONTA_H / 2));
        });
    }

    /* Enquadramento: a moldura tem altura fixa e quem manda no que aparece nela e a
       etapa em alerta, que fica sempre no centro. Como o diagrama esta ancorado em
       left/top 50% da moldura, o transform e literalmente a coordenada do centro
       daquela peca dentro do diagrama, negativada.
       Medido, e nao escrito: a posicao depende da altura da peca e do degrau, e
       qualquer uma das duas mudando reposiciona o quadro sozinho.
       transform nao altera layout, entao isto nao realimenta o ResizeObserver. */
    var frame = canvas.closest('.il-frame');
    var alerta = canvas.querySelector('.il-card--alerta');
    function centrar() {
        if (!frame || !alerta) return;
        var c = canvas.getBoundingClientRect();
        var r = alerta.getBoundingClientRect();
        canvas.style.transform = 'translate(' +
            n(-(r.left - c.left + r.width / 2)) + 'px, ' +
            n(-(r.top - c.top + r.height / 2)) + 'px)';
    }
    function tudo() { draw(); centrar(); }

    tudo();
    if (frame) frame.classList.add('is-pronto');
    if (window.ResizeObserver) {
        var ro = new ResizeObserver(tudo);
        ro.observe(canvas);
        /* observar as peças também: a altura delas muda com o texto do rótulo, e é
           isso que move o centro vertical de onde os traços saem. */
        cols.forEach(function (col) { cards(col).forEach(function (el) { ro.observe(el); }); });
    } else {
        window.addEventListener('resize', tudo);
    }
    /* o rótulo e o ícone entram com fonte de fallback e mudam de altura quando a
       real carrega: sem este redraw os traços ficam parados na medida antiga. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(tudo);
})();
