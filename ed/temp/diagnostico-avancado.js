/* JS do Diagnóstico Avançado de BI.

   1) conectores das peças, compartilhados pelas ilustrações 1 e 2
   2) ilustração 1 (.dg-arq): varredura da lupa
   3) ilustração 2 (.dg-falha): enquadramento pela etapa em alerta

   Conectores na técnica do bloco .ds-squad de /cp/data-squads/ (item 1 do
   data-squads.js): um <path> SVG por ligação, com a geometria medida do layout
   real via getBoundingClientRect.

   Medir em vez de escrever coordenada à mão é o ponto da técnica: quem posiciona
   as peças é o grid, e o JS só lê onde elas caíram. Some a dependência da altura
   da peça e do degrau de cada coluna, que de outro modo viveriam como número no
   CSS e desalinhariam em silêncio a cada ajuste de padding, gap ou fonte. A
   varredura da lupa depende da mesma medição: as paradas são as coordenadas reais
   das peças.

   As duas ilustrações usam a MESMA função de conectar, e não uma cópia cada:
   desenham o mesmo traço, sobre a mesma peça, e duas cópias divergiriam no
   primeiro ajuste. O que muda entre elas (a lupa) fica só na ilustração 1.

   Nota: este arquivo era cópia do marketplace.js (cometa do card Ecossistema).
   Aquele código saiu porque a página não tem .mk-eco: era um no-op. */
(function () {
    var NS = 'http://www.w3.org/2000/svg';
    var PONTA_W = 4, PONTA_H = 16;  /* retangulo que marca as pontas do traco */

    function pecas(el) {
        return Array.prototype.slice.call(el.querySelectorAll('.dg-card'));
    }

    function n(v) { return Math.round(v * 100) / 100; }

    /* Curva do centro da borda DIREITA de uma peça até o centro da borda ESQUERDA
       da próxima. Bézier cúbica única, sem canto nem trecho reto, com as duas
       alças na horizontal: o traço sai e chega perpendicular à borda, como no
       .ds-squad (lá as alças são verticais porque o fluxo é vertical; aqui o fluxo
       é da esquerda pra direita, então elas giram 90°).

       As duas alças ficam no meio-x do vão. Isso mantém a tangente horizontal nas
       duas pontas e nunca deixa a curva escapar da faixa entre as duas peças, seja
       a diferença de altura grande ou zero (onde a curva vira uma reta). Um
       comprimento de alça fixo estouraria pros lados quando a subida é maior que o
       vão, que é o caso da escada da ilustração 2. */
    function route(x0, y0, x1, y1) {
        var mx = (x0 + x1) / 2;
        return 'M' + n(x0) + ' ' + n(y0) +
            ' C' + n(mx) + ' ' + n(y0) +
            ', ' + n(mx) + ' ' + n(y1) +
            ', ' + n(x1) + ' ' + n(y1);
    }

    /* Monta os conectores de um diagrama e devolve o que o desenhar() precisa.
       null quando não há o que ligar. */
    function conectar(cv) {
        var svg = cv.querySelector('.dg-conn');
        /* :not(.dg-col--solta) porque nem toda coluna faz parte da corrente. Na
           ilustração 2 a peça da causa raiz mora numa coluna fora do fluxo, e sem
           esse filtro ela entraria na sequência e ganharia um conector vindo da
           última etapa, que não existe no desenho. */
        var cols = Array.prototype.slice.call(cv.querySelectorAll('.dg-col:not(.dg-col--solta)'));
        if (!svg || cols.length < 2) return null;

        /* Topologia derivada do DOM, não escrita à mão: toda peça de uma coluna
           liga em todas as peças da coluna seguinte. Na ilustração 1 isso dá o
           leque da esteira, na 2 uma corrente simples, com a mesma regra. */
        var links = [];
        for (var i = 0; i < cols.length - 1; i++) {
            var de = pecas(cols[i]), para = pecas(cols[i + 1]);
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
           de peça com ligação, não uma por ponta de path: na ilustração 1 a peça do
           meio recebe dois conectores no mesmo ponto e emite outros dois, então por
           path seriam quatro retângulos empilhados no mesmo lugar.
           Vêm depois dos paths no DOM pra pintar por cima do traço. */
        var pontas = [];
        cols.forEach(function (col, i) {
            pecas(col).forEach(function (el) {
                if (i > 0) pontas.push({ el: el, lado: 'left', col: i });
                if (i < cols.length - 1) pontas.push({ el: el, lado: 'right', col: i });
            });
        });

        /* Se alguma etapa está em alerta (ilustração 2), o trecho que sai dela é o
           caminho por onde o defeito segue adiante: as duas pontas dele mudam de
           cor e a etapa seguinte fica marcada como a jusante.
           Lido do DOM, e não escrito à mão no HTML, pra a posição do alerta ser o
           ÚNICO lugar que descreve onde está o problema: mover o .dg-card--alerta
           leva junto as pontas coloridas e os quadradinhos. Na ilustração 1 não há
           alerta, e tudo isto é no-op. */
        var colAlerta = -1;
        cols.forEach(function (col, i) {
            if (col.querySelector('.dg-card--alerta')) colAlerta = i;
        });
        if (colAlerta >= 0 && cols[colAlerta + 1]) {
            pecas(cols[colAlerta + 1]).forEach(function (el) {
                el.classList.add('dg-card--jusante');
            });
        }

        pontas.forEach(function (p) {
            var erro = colAlerta >= 0 && (
                (p.lado === 'right' && p.col === colAlerta) ||
                (p.lado === 'left' && p.col === colAlerta + 1)
            );
            p.rect = document.createElementNS(NS, 'rect');
            p.rect.setAttribute('width', PONTA_W);
            p.rect.setAttribute('height', PONTA_H);
            if (erro) p.rect.setAttribute('class', 'is-erro');
            svg.appendChild(p.rect);
        });

        return { cv: cv, svg: svg, links: links, pontas: pontas };
    }

    /* Medir com o diagrama ANIMADO é seguro porque tudo aqui é diferença entre
       dois retângulos do mesmo canvas: a translação do transform entra nos dois e
       se cancela. Só valeria pra translação, não pra escala. */
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
           borda da peca, com 2px de cada lado dela. */
        d.pontas.forEach(function (p) {
            var r = p.el.getBoundingClientRect();
            var x = (p.lado === 'left' ? r.left : r.right) - c.left;
            var y = r.top - c.top + r.height / 2;
            p.rect.setAttribute('x', n(x - PONTA_W / 2));
            p.rect.setAttribute('y', n(y - PONTA_H / 2));
        });
    }

    /* Redesenha no resize e quando as fontes carregam: o rótulo e o ícone entram
       com fonte de fallback e mudam de altura, e é isso que move o centro vertical
       de onde os traços saem. */
    function observar(raiz, alvos, refazer) {
        refazer();
        if (window.ResizeObserver) {
            var ro = new ResizeObserver(refazer);
            ro.observe(raiz);
            alvos.forEach(function (el) { ro.observe(el); });
        } else {
            window.addEventListener('resize', refazer);
        }
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(refazer);
    }

    /* ── 1) ilustração 1: esteira sob a lupa ─────────────────────────── */
    (function () {
        var moldura = document.querySelector('.dg-arq');
        if (!moldura) return;
        var fundo = moldura.querySelector('.dg-arq-camada--fundo');
        var canvas = moldura.querySelector('.dg-arq-camada--nitido .dg-arq-canvas');
        if (!fundo || !canvas) return;

        /* fracao do passo que cada parada passa PARADA; o resto e a transicao pra
           proxima. 0.72 da 18% de pausa e 7% de movimento com 4 paradas, ou seja a
           lente descansa bem mais do que anda, senao o rotulo revelado nao da tempo
           de ser lido. */
        var PAUSA = 0.72;

        /* A camada desfocada é um clone da nítida, feito aqui e não escrito no
           HTML: as duas precisam ser idênticas pra as máscaras se encaixarem, e
           manter duas cópias da marcação à mão seria só uma chance de divergirem.
           Clonado ANTES de montar os conectores, então o clone entra com o
           .dg-conn vazio e recebe os próprios paths no laço abaixo. */
        fundo.appendChild(canvas.cloneNode(true));

        var desenhos = [];
        Array.prototype.slice.call(moldura.querySelectorAll('.dg-arq-canvas')).forEach(function (cv) {
            var d = conectar(cv);
            if (d) desenhos.push(d);
        });
        if (!desenhos.length) return;

        /* ── varredura da lupa ──
           Uma parada por TIPO de etapa, que é uma parada por coluna: onde a coluna
           tem duas cópias da mesma etapa, centrar a primeira já mostra o tipo.

           O diagrama está ancorado em left/top 50% da moldura, e a lupa é um
           círculo parado no centro dela. Então o transform de cada parada é
           literalmente a coordenada do centro da peça dentro do diagrama,
           negativada: âncora no centro menos a posição da peça põe aquela peça
           exatamente sob a lente. Sem essa ancoragem em 50% a conta precisaria
           carregar o tamanho da moldura, que é fluido com o card.

           As keyframes são geradas aqui porque dependem dessa medição, e regeradas
           junto com os traços: a altura das peças muda quando a fonte real carrega,
           e com ela o centro de cada parada. Trocar o texto de uma @keyframes em
           execução não reinicia a animação, ela segue do mesmo ponto do ciclo. */
        var folha = document.createElement('style');
        document.head.appendChild(folha);

        var alvos = Array.prototype.slice.call(canvas.querySelectorAll('.dg-col')).map(function (col) {
            return pecas(col)[0];
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
            folha.textContent = '@keyframes dg-arq-pan {' + quadros.join('\n') + '}';
        }

        function tudo() {
            desenhos.forEach(desenhar);
            paradas();
        }

        var todasAsPecas = [];
        desenhos.forEach(function (d) { todasAsPecas = todasAsPecas.concat(pecas(d.cv)); });
        observar(moldura, todasAsPecas, tudo);

        /* is-pronto libera a animação e a visibilidade das duas camadas de uma vez:
           antes disso o diagrama não tem transform e ficaria com o canto no centro
           da moldura. Pela classe (e não no CSS de base) as duas cópias começam a
           animar no mesmo recálculo de estilo, o que é o que as mantém em passo. */
        moldura.classList.add('is-pronto');
    })();

    /* ── 2) ilustração 2: escada com a etapa em falha ────────────────── */
    (function () {
        var moldura = document.querySelector('.dg-falha');
        if (!moldura) return;
        var canvas = moldura.querySelector('.dg-falha-canvas');
        if (!canvas) return;
        var d = conectar(canvas);
        if (!d) return;

        /* Enquadramento: a moldura tem altura fixa e quem manda no que aparece nela
           é a etapa em alerta, que fica sempre no centro. Como o diagrama está
           ancorado em left/top 50% da moldura, o transform é literalmente a
           coordenada do centro daquela peça dentro do diagrama, negativada. É a
           mesma mecânica da lupa da ilustração 1, reduzida a uma parada só.
           Medido, e não escrito: a posição depende da altura da peça e do degrau, e
           qualquer uma das duas mudando reenquadra sozinho. Nos dois eixos, o que
           também resolve o diagrama (864) ser mais largo que o card (544): centrar
           pelo alerta mostra a parte que importa em vez de cortar pela ponta.
           transform não altera layout, então isto não realimenta o ResizeObserver. */
        var alerta = canvas.querySelector('.dg-card--alerta');
        function enquadrar() {
            if (!alerta) return;
            var c = canvas.getBoundingClientRect();
            var r = alerta.getBoundingClientRect();
            canvas.style.transform = 'translate(' +
                n(-(r.left - c.left + r.width / 2)) + 'px, ' +
                n(-(r.top - c.top + r.height / 2)) + 'px)';
        }

        observar(moldura, pecas(canvas), function () { desenhar(d); enquadrar(); });
        /* só agora o diagrama tem transform; antes disso ele ficaria com o canto no
           centro da moldura */
        moldura.classList.add('is-pronto');
    })();
})();
