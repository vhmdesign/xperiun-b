/* JS do Diagnóstico Avançado de BI.

   1) conectores das peças, compartilhados pelas ilustrações 1 e 2
   2) ilustração 1 (.dg-arq): varredura da lupa
   3) ilustração 2 (.dg-falha): enquadramento pela etapa em alerta
   4) sec-diagnostico: tilt do dashboard conforme o scroll
   5) entradas que o script compartilhado não cobre: o card da sec-erro e o
      cabeçalho dos pilares
   6) sec-metodo: travamento na tela e cards na horizontal
   7) sec-metodo: cabeçalho vira card em tela larga e baixa
   8) sobreposição: os critérios sobem sobre a metodologia
   9) CTAs que abrem o popup do form
  10) barra fixa de CTA: recolhe no topo e no fim
  11) sobreposição: os cases sobem sobre os critérios
  12) player dos cases (vídeos de depoimento)
  13) rotação dos logos da faixa "Empresas que confiam"

   As ilustrações 3, 4 e 5 são só CSS e não passam por aqui.

   Conectores na técnica do bloco .ds-squad de /cp/data-squads/ (item 1 do
   data-squads.js): um <path> SVG por ligação, com a geometria medida do layout real,
   pelo pos() daqui.

   Medir em vez de escrever coordenada à mão é o ponto da técnica: quem posiciona
   as peças é o grid, e o JS só lê onde elas caíram. Some a dependência da altura
   da peça e do degrau de cada coluna, que de outro modo viveriam como número no
   CSS e desalinhariam em silêncio a cada ajuste de padding, gap ou fonte. A
   varredura da lupa depende da mesma medição: as paradas são as coordenadas reais
   das peças.

   As duas ilustrações usam a MESMA função de conectar, e não uma cópia cada:
   desenham o mesmo traço, sobre a mesma peça, e duas cópias divergiriam no
   primeiro ajuste. O que muda entre elas (a lupa) fica só na ilustração 1. */
(function () {
    var NS = 'http://www.w3.org/2000/svg';
    var PONTA_W = 4, PONTA_H = 16;  /* retangulo que marca as pontas do traco */

    function pecas(el) {
        return Array.prototype.slice.call(el.querySelectorAll('.dg-card'));
    }

    function n(v) { return Math.round(v * 100) / 100; }

    /* Posição e tamanho de um elemento DENTRO de um ancestral, em coordenadas de
       layout: soma offsetLeft/offsetTop subindo a cadeia de offsetParent até chegar
       nele.

       Por que não getBoundingClientRect: as raízes das ilustrações levam um
       skew(0deg, -7.5deg), e o rect devolve a caixa já transformada. Num skewY o y de
       cada elemento passa a depender do x dele, e a altura do bounding box cresce com
       a largura: nem as diferenças entre dois rects se cancelam mais, nem a altura
       serve. Antes do skew o único transform era a translação do pan, que se cancelava
       na subtração; com o skew, não.

       offsetLeft/offsetTop ignoram transform por definição, e a origem deles é a borda
       de padding do offsetParent, a mesma origem do .dg-conn (absoluto com inset: 0 no
       canvas). Então as duas coisas falam a mesma coordenada. */
    function pos(el, ate) {
        var x = 0, y = 0, no = el;
        while (no && no !== ate) {
            x += no.offsetLeft;
            y += no.offsetTop;
            no = no.offsetParent;
        }
        return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
    }

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

    /* Medir com o diagrama ANIMADO é seguro porque o pos() lê coordenadas de layout,
       que nenhum transform altera: nem a translação do pan, nem o skew da raiz. */
    function desenhar(d) {
        var w = d.cv.offsetWidth, h = d.cv.offsetHeight;
        d.svg.setAttribute('width', w);
        d.svg.setAttribute('height', h);
        d.svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        d.links.forEach(function (l) {
            var a = pos(l.de, d.cv);
            var b = pos(l.para, d.cv);
            l.path.setAttribute('d', route(
                a.x + a.w, a.y + a.h / 2,
                b.x, b.y + b.h / 2
            ));
        });
        /* centrado no ponto onde o traco encosta: metade da largura pra tras em x
           e metade da altura pra cima em y, entao o retangulo fica montado na
           borda da peca, com 2px de cada lado dela. */
        d.pontas.forEach(function (p) {
            var r = pos(p.el, d.cv);
            var x = p.lado === 'left' ? r.x : r.x + r.w;
            var y = r.y + r.h / 2;
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

    /* ── 2) ilustração 1: esteira sob a lupa ─────────────────────────── */
    (function () {
        var moldura = document.querySelector('.dg-arq');
        if (!moldura) return;
        var fundo = moldura.querySelector('.dg-arq-camada--fundo');
        var canvas = moldura.querySelector('.dg-arq-camada--nitido .dg-arq-canvas');
        if (!fundo || !canvas) return;

        /* Fracao do passo que cada parada passa PARADA; o resto e a transicao pra
           proxima. Com 4 paradas o passo e 25% do ciclo, entao 0.5 reparte esse passo
           ao meio. No ciclo de 10s do CSS isso sai em 1,25s parado e 1,25s andando.
           Os dois valores andam juntos: mexer na duracao do CSS sem revisar este
           numero muda a pausa E o deslocamento de uma vez. */
        var PAUSA = 0.5;

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
            var passo = 100 / alvos.length;
            var quadros = alvos.map(function (el, i) {
                var r = pos(el, canvas);
                var x = n(-(r.x + r.w / 2));
                var y = n(-(r.y + r.h / 2));
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

    /* ── 3) ilustração 2: escada com a etapa em falha ────────────────── */
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
           também resolve o diagrama (864) ser mais largo que o card (832): centrar
           pelo alerta mostra a parte que importa em vez de cortar pela ponta.
           transform não altera layout, então isto não realimenta o ResizeObserver. */
        var alerta = canvas.querySelector('.dg-card--alerta');
        function enquadrar() {
            if (!alerta) return;
            var r = pos(alerta, canvas);
            canvas.style.transform = 'translate(' +
                n(-(r.x + r.w / 2)) + 'px, ' +
                n(-(r.y + r.h / 2)) + 'px)';
        }

        observar(moldura, pecas(canvas), function () { desenhar(d); enquadrar(); });
        /* só agora o diagrama tem transform; antes disso ele ficaria com o canto no
           centro da moldura */
        moldura.classList.add('is-pronto');
    })();
})();

/* ── 4) sec-diagnostico: tilt do dashboard ───────────────────────────
   Portado do script.js de /ed/areas/logistica/, com a classe renomeada.
   Repouso (o que o CSS declara): perspective(512px) rotateX(15deg) translateY(-128px)
   Fim (quando o centro da peça alcança o centro da tela): rotateX(0deg) translateY(0px)

   Só o transform: o trecho que animava opacidade e blur saiu junto com a <img>, que
   deu lugar a uma placa de cor chapada. Num campo sem imagem desfoque não faz nada e
   opacidade só deixaria o fundo da seção vazar pela placa.

   Abaixo de 864 o efeito sai inteiro e o CSS assume: lá a peça é 100% de largura e sem
   transform. */
(function () {
    var sec = document.querySelector('.diagnostico-dash');
    if (!sec) return;

    var FROM_ROT = 15;   /* deg */
    var FROM_TY = -128;  /* px */

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
        sec.style.transform = 'perspective(512px) rotateX(0deg) translateY(0px)';
        return;
    }

    var ticking = false;

    function apply() {
        ticking = false;
        if (window.innerWidth <= 864) {
            sec.style.transform = '';
            return;
        }
        var rect = sec.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        /* progresso pelo centro da peça: 0 com o centro no fundo da viewport,
           1 (plano) quando ele chega ao centro da tela. */
        var centerY = rect.top + rect.height / 2;
        var p = (vh - centerY) / (vh / 2);
        if (p < 0) p = 0;
        if (p > 1) p = 1;
        var rot = FROM_ROT * (1 - p);
        var ty = FROM_TY * (1 - p);
        sec.style.transform = 'perspective(512px) rotateX(' + rot + 'deg) translateY(' + ty + 'px)';
    }

    function onScroll() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(apply);
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    apply();
})();

/* ── 5) entradas próprias ──────────────────────────────
   Estes blocos nascem em opacity 0 e só acendem com .is-entered, pelo CSS:
   - .erro-card, que entra inteiro pela keyframe dg-erro-entra;
   - .pilares-header, cujos parágrafos entram escalonados;
   - os .case-card e a .depos-logos-section da .sec-cases, que vieram do
     /cp/data-squads/ com esse estado inicial. Lá quem os acendia era um par de
     helpers (stagger/bloco) daquele arquivo; aqui entram neste observer, que já faz
     o mesmo trabalho. Sem escalonamento entre os cards: cada um acende quando entra,
     o que dá a mesma leitura sem uma segunda mecânica pra manter.
   Nos dois casos o eyebrow e o título por dentro são animados pelo formacoes/script.js;
   o que falta é o resto do bloco, e é o que este observer cobre.

   Por que não o formacoes/script.js: os observeSingle de lá são uma lista fixa de
   seletores (.skills-grid, .conta-grid, .faq-grid e companhia) e nenhum dos dois está
   nela. Dava pra pegar carona pendurando um .conta-grid neles, que é o truque que o
   /cp/data-squads/ usa, mas seria batizá-los com o nome de um componente que não são, e
   este arquivo acabou de perder um monte de nome herdado sem sentido.

   As opções do observer são as MESMAS de lá (threshold 0 e -25% no rodapé), pra os dois
   gestos partirem juntos em vez de um adiantar o outro: o título é animado pelo script
   de lá, que usa exatamente essas opções.
   unobserve depois de acender porque a entrada é uma vez só, não um vai e volta. */
(function () {
    var alvos = Array.prototype.slice.call(
        document.querySelectorAll('.erro-card, .pilares-header, .sec-cases .case-card, .sec-cases .depos-logos-section')
    );
    if (!alvos.length) return;
    if (!window.IntersectionObserver) {
        /* sem suporte não há como saber a hora certa, e bloco invisível é pior que bloco
           sem animação: entra aceso. */
        alvos.forEach(function (el) { el.classList.add('is-entered'); });
        return;
    }
    var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            obs.unobserve(entry.target);
            entry.target.classList.add('is-entered');
        });
    }, { rootMargin: '0px 0px -25% 0px', threshold: 0 });
    alvos.forEach(function (el) { obs.observe(el); });
})();

/* ── 6) sec-metodo: travamento na tela + cards na horizontal ──────────
   Portado dos dois IIFEs do .agenda de /ed/aichampion/dependencias/script.js, com as
   classes renomeadas e uma diferença de comportamento, anotada abaixo.

   Como o travamento funciona: o .metodo-stage é sticky com top 0 e 100dvh, então ele
   prende no topo enquanto a seção passa. A seção é mais ALTA que o stage, e essa sobra é
   o que dá o curso de rolagem: o quanto a página rola dentro dela é o quanto os cards
   deslizam na horizontal. Por isso a altura precisa ser calculada aqui, e não escrita no
   CSS: ela depende de quantos cards existem e de quanto eles somam de largura.

   A altura fica em calc(100dvh + Npx), com o dvh preservado em CSS em vez de virar px:
   assim a parte da viewport acompanha barra de URL, resize e rotação em tempo real, e só
   o percurso horizontal (que depende de largura) entra como px.

   DIFERENÇA em relação ao original: lá a altura era 150dvh e o translate só começava
   depois de 50vh de rolagem, uma janela morta reservada pro fade-in coreografado do
   título e dos cards. Essa coreografia é dirigida pelo scroll do hero da aichampion e
   não foi portada, então a janela morta viraria meia tela de seção presa sem nada
   acontecendo. Aqui o horizontal começa junto com o travamento.

   Abaixo de 865 nada disso vale: o CSS solta o stage e empilha os cards, e aqui a altura
   e o transform são zerados pra não sobrar resíduo de um resize vindo do desktop. */
(function () {
    var sec = document.querySelector('.sec-metodo');
    var grid = document.querySelector('.metodo-grid');
    var stage = document.querySelector('.metodo-stage');
    if (!sec || !grid || !stage) return;

    function isSmall() { return window.innerWidth < 865; }

    /* Quanto os cards precisam andar: a borda direita do último card menos a borda
       direita da área visível, descontando o mesmo respiro lateral que o .metodo-grid
       usa de padding. Assim o último card para alinhado com o container de 1440 em vez
       de encostar na borda da tela. */
    function maxTranslate() {
        if (isSmall()) return 0;
        var width = sec.clientWidth;
        var cards = grid.querySelectorAll('.metodo-card');
        if (!cards.length) return Math.max(0, grid.scrollWidth - width);
        var last = cards[cards.length - 1];
        var gap = Math.max(16, width / 2 - 720);
        return Math.max(0, last.offsetLeft + last.offsetWidth - (width - gap));
    }

    function updateHeight() {
        if (isSmall()) { sec.style.height = ''; return; }
        sec.style.height = 'calc(100dvh + ' + maxTranslate() + 'px)';
    }

    function apply() {
        if (isSmall()) { grid.style.transform = ''; return; }
        /* progresso = o quanto o topo da seção já subiu além do topo da tela, que é
           exatamente o quanto o stage está preso. */
        var progress = Math.max(0, -sec.getBoundingClientRect().top);
        var pos = Math.min(progress, maxTranslate());
        grid.style.transform = 'translateX(' + (-pos) + 'px)';
    }

    function recalc() { updateHeight(); apply(); }
    window.addEventListener('scroll', apply, { passive: true });
    window.addEventListener('resize', recalc);
    /* load além do resize porque as imagens dos cards entram com loading lazy: quando
       elas chegam, a largura do grid muda e o percurso tem que ser remedido. */
    window.addEventListener('load', recalc);
    window._metodoRecalc = recalc;
    updateHeight();
    apply();
})();

/* ── 7) sec-metodo: cabeçalho vira card em tela larga e baixa ─────────
   Faixa wide-short (vw > 864 e vh < 864): o cabeçalho empilhado em cima mais os 100dvh
   do stage não deixam altura pro card respirar. A saída do original, portada aqui: o
   cabeçalho sai do topo do stage e entra na FILA como primeiro item, com um espaçador
   invisível na frente pra a fila não começar encostada na borda.

   É movimento de DOM, não de CSS, porque o cabeçalho precisa passar a ser filho do
   .metodo-grid pra transladar junto com os cards.

   matchMedia em vez de resize porque o gatilho é uma condição de duas dimensões, e o
   media query já a resolve; o listener só dispara quando ela vira.
   No fim chama o recalc do item 6, porque entrar ou sair da fila muda a largura total do
   grid e portanto o percurso horizontal. */
(function () {
    var stage = document.querySelector('.metodo-stage');
    var track = document.querySelector('.metodo-track');
    var grid = document.querySelector('.metodo-grid');
    var header = document.querySelector('.metodo-header');
    if (!stage || !track || !grid || !header) return;

    var mq = window.matchMedia('(min-width: 865px) and (max-height: 864px)');

    function relocate() {
        if (mq.matches) {
            if (header.parentNode !== grid) {
                grid.insertBefore(header, grid.firstChild);
                header.classList.add('metodo-header--inline');
                var spacer = document.createElement('div');
                spacer.className = 'metodo-spacer';
                spacer.setAttribute('aria-hidden', 'true');
                grid.insertBefore(spacer, header);
            }
        } else {
            if (header.parentNode !== stage) {
                /* volta pro topo do stage, ANTES do track: o grid vive dentro do track,
                   não é mais filho direto do stage. */
                stage.insertBefore(header, track);
                header.classList.remove('metodo-header--inline');
                var antigo = grid.querySelector('.metodo-spacer');
                if (antigo) antigo.parentNode.removeChild(antigo);
            }
        }
        if (typeof window._metodoRecalc === 'function') window._metodoRecalc();
    }

    relocate();
    if (mq.addEventListener) mq.addEventListener('change', relocate);
    else mq.addListener(relocate);
    window.addEventListener('orientationchange', relocate);
})();

/* ── 8) sobreposição: os critérios sobem sobre a metodologia ──────────
   Portado do IIFE de reveal do .mba-gains-offer-track de
   /ed/pos-graduacoes/mba-fpa.js. O CSS estaciona a .sec-metodo com
   top: calc(100vh - var(--metodo-altura)), e a única coisa que falta pra fórmula fechar
   é a altura real da seção. É só isso que este bloco faz.

   Por que a altura não pode estar no CSS: a .sec-metodo tem a altura definida pelo item
   6 (viewport travada + percurso horizontal dos cards), e ela muda em resize, em rotação
   e quando o cabeçalho entra ou sai da fila no wide-short. Um valor escrito à mão
   descolaria da realidade no primeiro desses eventos.

   ResizeObserver em vez de só ouvir resize: quem muda a altura é o item 6, via
   style.height, e isso não dispara evento de janela nenhum. O observer pega qualquer
   mudança, venha de onde vier. Os listeners de resize e orientationchange ficam como
   rede pros navegadores sem ResizeObserver.

   visualViewport porque no mobile a barra de URL entrando e saindo muda a viewport sem
   disparar resize em alguns navegadores, e a fórmula do top depende de 100vh. */
(function () {
    var sec = document.querySelector('.metodo-criterios-track .sec-metodo');
    if (!sec) return;

    function update() {
        sec.style.setProperty('--metodo-altura', sec.offsetHeight + 'px');
    }

    update();

    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(update).observe(sec);
    }
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', update);
    }
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
})();

/* ── 9) CTAs que abrem o popup do form ────────────────────────────────
   Portado do /cp/data-squads/. Handler delegado em [data-open-popup].

   Por que não onclick inline: o openPopup mora no form.js, que o form-include.js só
   injeta DEPOIS de buscar o HTML do popup por fetch. Um onclick no padrão
   `window.openPopup && window.openPopup(...)` encontra a função ainda undefined num
   clique cedo e não faz nada, sem erro no console: o botão parece morto. Aqui a gente
   ESPERA a função aparecer, em vez de testar uma vez só, e avisa se ela nunca vier. */
(function () {
    var PASSO = 100, TENTATIVAS = 50;   /* 5s de teto */

    function abrir(id, resta) {
        if (window.openPopup) { window.openPopup(id); return; }
        if (resta > 0) { setTimeout(function () { abrir(id, resta - 1); }, PASSO); return; }
        console.warn('[diagnostico-avancado] openPopup nao carregou; ' + id + ' nao abriu. ' +
                     'Conferir se o form-include.js buscou o form-data-squads.html.');
    }

    document.addEventListener('click', function (e) {
        var alvo = e.target && e.target.closest ? e.target.closest('[data-open-popup]') : null;
        if (!alvo) return;
        e.preventDefault();
        abrir(alvo.getAttribute('data-open-popup'), TENTATIVAS);
    });
})();

/* ── 10) barra fixa de CTA: recolhe no topo e no fim ──────────────────
   Portado do /cp/data-squads/, que por sua vez veio do bottom-cta.js do ICIAN: a barra
   fica escondida enquanto a PRIMEIRA ou a ÚLTIMA seção estão na tela, e aparece no meio
   da página, onde o usuário está lendo e o CTA da seção não está à vista.

   Diferença em relação ao original: lá a última seção é um seletor cravado
   (.sec-auto). Aqui ela é a última <section> do documento, pega em tempo de execução.
   Esta página cresceu de duas pra sete seções ao longo da construção, e um seletor
   cravado significaria lembrar de atualizar este arquivo a cada seção nova, o que é
   justamente o tipo de acoplamento silencioso que quebra sem avisar.

   Sem IntersectionObserver a barra fica VISÍVEL, que é o estado útil: melhor um CTA
   sempre à mão do que um que nunca aparece. */
(function () {
    var bar = document.querySelector('.bottom-cta');
    if (!bar) return;

    var primeira = document.querySelector('.hero');
    var secoes = document.querySelectorAll('section');
    var ultima = secoes.length ? secoes[secoes.length - 1] : null;

    if (!('IntersectionObserver' in window) || (!primeira && !ultima)) {
        bar.classList.remove('is-hidden');
        return;
    }

    var vis = { primeira: false, ultima: false };
    function atualiza() { bar.classList.toggle('is-hidden', vis.primeira || vis.ultima); }

    var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].target === primeira) vis.primeira = entries[i].isIntersecting;
            else if (entries[i].target === ultima) vis.ultima = entries[i].isIntersecting;
        }
        atualiza();
    });
    if (primeira) io.observe(primeira);
    if (ultima) io.observe(ultima);
})();

/* ── 11) sobreposição: os cases sobem sobre os critérios ────────
   Mesmo padrão do item 8, agora um nível abaixo: o track dos cases mora DENTRO do
   track da metodologia, e a .sec-criterios é ao mesmo tempo a de cima de um e a de
   baixo do outro. É exatamente como o mba-fpa encadeia os dele (o
   .mba-gains-offer-track vive dentro do .mba-curriculum-gains-track e a .mba-gains faz
   os dois papéis).

   A .sec-criterios não tem altura dinâmica como a .sec-metodo, mas os cards dela são
   sticky e a altura muda com a fonte carregando e com quebra de linha, então vale o
   mesmo ResizeObserver em vez de medir uma vez só.

   Além da altura, aqui sai o FREIO do sticky, que é o que faz os cards empilharem. A
   seção não anda enquanto está presa, e os cards de dentro precisam que ela ande: o
   último deles só encosta no próprio topo depois que a seção rolar o equivalente ao
   deslocamento natural dele. Se ela prender antes, os cards congelam a meio caminho, e
   em tela mais alta que a seção eles nem começam.

   O freio é topo_do_último_card menos deslocamento_natural_dele, um número negativo que
   entra num min() no CSS. É a mesma solução do mba-fpa com --mba-card-4-h: fórmula no
   CSS, medida no JS, porque só o layout sabe a altura real dos cards.

   O deslocamento natural NÃO sai de offsetTop: com sticky, o valor que o navegador
   devolve já vem deslocado quando o card está preso, e a medida mudaria conforme a
   rolagem. Ele é somado a partir do que não se move: padding do topo da seção, alturas
   dos cards anteriores e o gap entre eles. */
(function () {
    var sec = document.querySelector('.criterios-cases-track .sec-criterios');
    if (!sec) return;

    var cards = sec.querySelectorAll('.criterios-card');

    function freio() {
        if (!cards.length) return null;
        var ultimo = cards[cards.length - 1];
        var st = getComputedStyle(ultimo);
        /* fora do empilhamento (≤864) não há freio nenhum */
        if (st.position !== 'sticky') return null;
        var topo = parseFloat(st.top);
        if (isNaN(topo)) return null;

        var lista = ultimo.parentNode;
        var gap = parseFloat(getComputedStyle(lista).rowGap) || 0;
        var desloc = parseFloat(getComputedStyle(sec).paddingTop) || 0;
        for (var i = 0; i < cards.length - 1; i++) desloc += cards[i].offsetHeight + gap;

        return topo - desloc;
    }

    function update() {
        sec.style.setProperty('--criterios-altura', sec.offsetHeight + 'px');
        var f = freio();
        if (f === null) sec.style.setProperty('--criterios-freio', '99999px');
        else sec.style.setProperty('--criterios-freio', f + 'px');
    }

    update();

    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(update).observe(sec);
    }
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', update);
    }
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
})();

/* ── 12) player dos cases ───────────────────────────────
   Portado sem mudança do /cp/data-squads/data-squads.js. É autocontido: só depende da
   marcação .case-* e da IFrame API do YouTube, que ele mesmo carrega uma vez.
   Os comentários longos de dentro vieram junto porque documentam bug resolvido (o
   iframe travando em 640x390, a chrome do YouTube aparecendo, o véu no ENDED). */
(function () {
    var sec = document.querySelector('.sec-cases');
    if (!sec) return;

    var PASSO = 5;             /* s por seta do teclado */
    var players = new Map();   /* box → YT.Player */
    var fila = [];             /* pedidos que chegaram antes da API */
    var pronta = false;
    var pedida = false;
    var relogio = null;        /* setInterval que pinta as barras */

    /* um registro por card: guarda os nós de uma vez, em vez de consultar o DOM
       a cada batida do relógio. */
    var regs = Array.prototype.map.call(
        sec.querySelectorAll('.case-video[data-vid]'),
        function (box) {
            var card = box.closest('.case-card');
            return {
                box: box,
                card: card,
                bar: card && card.querySelector('.case-bar'),
                fill: card && card.querySelector('.case-bar-fill'),
                cur: card && card.querySelector('.case-time-cur'),
                dur: card && card.querySelector('.case-time-dur'),
                botao: card && card.querySelector('.case-play'),
                arrastando: false,
                fracInicial: 0
            };
        }
    ).filter(function (r) { return r.card && r.bar && r.fill; });
    if (!regs.length) return;

    var porBox = new Map();
    regs.forEach(function (r) { porBox.set(r.box, r); });

    function carregaApi() {
        if (window.YT && window.YT.Player) { pronta = true; return; }
        if (pedida) return;
        pedida = true;
        var anterior = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
            if (typeof anterior === 'function') anterior();
            pronta = true;
            fila.forEach(function (fn) { fn(); });
            fila = [];
        };
        var script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
    }

    function tocando(estado) {
        return estado === YT.PlayerState.PLAYING || estado === YT.PlayerState.BUFFERING;
    }

    /* m:ss, virando h:mm:ss só quando passa da hora */
    function fmt(seg) {
        if (!isFinite(seg) || seg < 0) seg = 0;
        seg = Math.floor(seg);
        var h = Math.floor(seg / 3600);
        var m = Math.floor((seg % 3600) / 60);
        var s = seg % 60;
        var mm = h && m < 10 ? '0' + m : String(m);
        return (h ? h + ':' : '') + mm + ':' + (s < 10 ? '0' + s : s);
    }

    /* fracForcada existe pro seek pintar na hora, antes do player confirmar a
       nova posição (senão a barra volta pra posição antiga por um quadro). */
    function pinta(reg, fracForcada) {
        var player = players.get(reg.box);
        var duracao = player && player.getDuration ? player.getDuration() : 0;
        var atual = player && player.getCurrentTime ? player.getCurrentTime() : 0;
        var frac = typeof fracForcada === 'number' ? fracForcada
                 : (duracao > 0 ? atual / duracao : 0);
        frac = Math.min(1, Math.max(0, frac));
        /* scaleX via custom property: transform não dispara layout, então as 4
           atualizações por segundo custam só composição. */
        reg.fill.style.setProperty('--progresso', frac.toFixed(4));
        if (reg.cur) {
            reg.cur.textContent = fmt(typeof fracForcada === 'number' ? frac * duracao : atual);
        }
        if (reg.dur) reg.dur.textContent = fmt(duracao);
        reg.bar.setAttribute('aria-valuenow', Math.round(frac * 100));
    }

    function algumTocando() {
        return regs.some(function (r) {
            var p = players.get(r.box);
            return p && p.getPlayerState && tocando(p.getPlayerState());
        });
    }

    /* o relógio só existe enquanto tem vídeo rodando */
    function ajustaRelogio() {
        var ativo = algumTocando();
        if (ativo && !relogio) {
            relogio = setInterval(function () {
                regs.forEach(function (r) { if (!r.arrastando) pinta(r); });
            }, 250);
        } else if (!ativo && relogio) {
            clearInterval(relogio);
            relogio = null;
        }
    }

    function pausaOutros(atual) {
        players.forEach(function (player, box) {
            if (box === atual) return;
            if (player.pauseVideo) player.pauseVideo();
        });
    }

    function cria(reg) {
        var host = reg.box.querySelector('.case-player');
        if (!host || players.has(reg.box)) return;
        players.set(reg.box, new YT.Player(host, {
            /* 100% nos dois: o construtor grava esses valores como atributo
               width/height do iframe. Sem eles ele nasce 640x390 e não preenche
               a caixa, por mais que o CSS mande. */
            width: '100%',
            height: '100%',
            videoId: reg.box.dataset.vid,
            /* tudo desligado do que o YouTube desenha por conta própria:
               controls 0 (barra), modestbranding 1 (logo), rel 0 (sugeridos),
               fs 0 (tela cheia), disablekb 1 (teclado), iv_load_policy 3
               (anotações), cc_load_policy 0 (legenda automática). O resto da
               chrome (título, "assistir no YouTube") só aparece em hover, e o
               pointer-events: none do CSS impede o hover de existir. */
            playerVars: {
                controls: 0, modestbranding: 1, rel: 0, playsinline: 1,
                disablekb: 1, fs: 0, iv_load_policy: 3, cc_load_policy: 0,
                origin: location.origin
            },
            events: {
                onReady: function (e) {
                    pausaOutros(reg.box);
                    /* se o primeiro toque foi na barra, começa de onde pediram */
                    if (reg.fracInicial > 0) {
                        var d = e.target.getDuration();
                        if (d > 0) e.target.seekTo(d * reg.fracInicial, true);
                        reg.fracInicial = 0;
                    }
                    e.target.playVideo();
                    pinta(reg);
                },
                onStateChange: function (e) {
                    var ativo = tocando(e.data);
                    reg.card.classList.toggle('is-playing', ativo);
                    /* is-started tira o véu e NÃO volta no pause, só no fim:
                       pausar tem que deixar o frame à vista. */
                    if (e.data === YT.PlayerState.PLAYING) reg.card.classList.add('is-started');
                    if (reg.botao) reg.botao.setAttribute('aria-label', ativo ? 'Pausar' : 'Reproduzir');
                    if (ativo) pausaOutros(reg.box);
                    /* fim do vídeo: volta pro começo e repõe o véu antes que a
                       grade de vídeos sugeridos do YouTube apareça. */
                    if (e.data === YT.PlayerState.ENDED) {
                        e.target.seekTo(0, true);
                        e.target.pauseVideo();
                        reg.card.classList.remove('is-started');
                    }
                    pinta(reg);
                    ajustaRelogio();
                }
            }
        }));
    }

    /* cria o player se ainda não existe: na hora, se a API já respondeu, senão
       enfileira pro onYouTubeIframeAPIReady. */
    function garante(reg) {
        if (players.has(reg.box)) return;
        carregaApi();
        if (pronta) cria(reg);
        else fila.push(function () { cria(reg); });
    }

    function alterna(reg) {
        var player = players.get(reg.box);
        if (!player) { garante(reg); return; }
        /* getPlayerState só existe depois do onReady; antes dele o clique é ruído */
        if (!player.getPlayerState) return;
        if (tocando(player.getPlayerState())) player.pauseVideo();
        else { pausaOutros(reg.box); player.playVideo(); }
    }

    function fracDoPonteiro(reg, clientX) {
        var r = reg.bar.getBoundingClientRect();
        if (!r.width) return 0;
        return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    }

    function busca(reg, frac) {
        var player = players.get(reg.box);
        if (!player || !player.getDuration) {
            /* ainda sem player: guarda a fração, pinta otimista e deixa o
               onReady aplicar o seek. */
            reg.fracInicial = frac;
            pinta(reg, frac);
            garante(reg);
            return;
        }
        var d = player.getDuration();
        if (d > 0) player.seekTo(d * frac, true);
        pinta(reg, frac);
    }

    /* clique no botão OU na área do vídeo alterna. O vídeo funciona porque o
       iframe tem pointer-events: none e o clique atravessa pro .case-video. */
    sec.addEventListener('click', function (e) {
        var card = e.target.closest('.case-card');
        if (!card) return;
        if (!e.target.closest('.case-play') && !e.target.closest('.case-video')) return;
        var box = card.querySelector('.case-video[data-vid]');
        var reg = box && porBox.get(box);
        if (reg) alterna(reg);
    });

    /* barra: clique, arraste e teclado. Pointer Events cobre mouse e toque num
       caminho só, e o setPointerCapture mantém o arraste vivo mesmo com o cursor
       saindo da barra. */
    regs.forEach(function (reg) {
        reg.bar.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            reg.arrastando = true;
            if (reg.bar.setPointerCapture) {
                try { reg.bar.setPointerCapture(e.pointerId); } catch (err) {}
            }
            busca(reg, fracDoPonteiro(reg, e.clientX));
        });
        reg.bar.addEventListener('pointermove', function (e) {
            if (!reg.arrastando) return;
            busca(reg, fracDoPonteiro(reg, e.clientX));
        });
        function solta(e) {
            if (!reg.arrastando) return;
            reg.arrastando = false;
            if (reg.bar.releasePointerCapture && e.pointerId != null) {
                try { reg.bar.releasePointerCapture(e.pointerId); } catch (err) {}
            }
        }
        reg.bar.addEventListener('pointerup', solta);
        reg.bar.addEventListener('pointercancel', solta);

        reg.bar.addEventListener('keydown', function (e) {
            var player = players.get(reg.box);
            var d = player && player.getDuration ? player.getDuration() : 0;
            var t = player && player.getCurrentTime ? player.getCurrentTime() : 0;
            var frac = null;
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') frac = d > 0 ? (t + PASSO) / d : 0;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') frac = d > 0 ? (t - PASSO) / d : 0;
            else if (e.key === 'Home') frac = 0;
            else if (e.key === 'End') frac = 1;
            else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); alterna(reg); return; }
            if (frac === null) return;
            e.preventDefault();
            busca(reg, Math.min(1, Math.max(0, frac)));
        });
    });
})();


/* ── 13) rotação dos logos da faixa "Empresas que confiam" ──────
   Portado sem mudança do /cp/data-squads/. Os 12 slots do HTML começam vazios e este
   bloco os preenche e vai trocando, sem nunca repetir dois logos iguais na tela. */
(function () {
    var logos = [
        { src: '/ed/site-dependencias/site-media/logos/logo-3m.webp',          alt: '3M' },
        { src: '/ed/site-dependencias/site-media/logos/logo-airliquide.webp',  alt: 'Air Liquide' },
        { src: '/ed/site-dependencias/site-media/logos/logo-ambev.webp',       alt: 'Ambev' },
        { src: '/ed/site-dependencias/site-media/logos/logo-bradesco.webp',    alt: 'Bradesco' },
        { src: '/ed/site-dependencias/site-media/logos/logo-cbf.webp',         alt: 'CBF' },
        { src: '/ed/site-dependencias/site-media/logos/logo-cielo.webp',       alt: 'Cielo' },
        { src: '/ed/site-dependencias/site-media/logos/logo-claro.webp',       alt: 'Claro' },
        { src: '/ed/site-dependencias/site-media/logos/logo-cpfl.webp',        alt: 'CPFL' },
        { src: '/ed/site-dependencias/site-media/logos/logo-globo.webp',       alt: 'Globo' },
        { src: '/ed/site-dependencias/site-media/logos/logo-google.webp',      alt: 'Google' },
        { src: '/ed/site-dependencias/site-media/logos/logo-inter.webp',       alt: 'Inter' },
        { src: '/ed/site-dependencias/site-media/logos/logo-magalu.webp',      alt: 'Magalu' },
        { src: '/ed/site-dependencias/site-media/logos/logo-mercedes.webp',    alt: 'Mercedes-Benz' },
        { src: '/ed/site-dependencias/site-media/logos/logo-natura.webp',      alt: 'Natura' },
        { src: '/ed/site-dependencias/site-media/logos/logo-neoway.webp',      alt: 'Neoway' },
        { src: '/ed/site-dependencias/site-media/logos/logo-piracanjuba.webp', alt: 'Piracanjuba' },
        { src: '/ed/site-dependencias/site-media/logos/logo-santander.webp',   alt: 'Santander' },
        { src: '/ed/site-dependencias/site-media/logos/logo-suzano.webp',      alt: 'Suzano' },
        { src: '/ed/site-dependencias/site-media/logos/logo-vale.webp',        alt: 'Vale' },
        { src: '/ed/site-dependencias/site-media/logos/sicoob.webp',           alt: 'Sicoob' }
    ];

    var grid = document.getElementById('depos-logos-grid');
    if (!grid) return;

    var imgs = Array.prototype.slice.call(grid.querySelectorAll('.depos-logo-card img'));
    var imgToLogo = new Map();

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    /* slot valendo = celula com altura. As linhas que a grade achata em 0px nos
       tiers estreitos caem fora daqui. */
    function visibleImgs() {
        return imgs.filter(function (img) {
            return img.closest('.depos-logo-card').offsetHeight > 0;
        });
    }

    function displayedLogos() {
        var arr = [];
        visibleImgs().forEach(function (img) {
            var l = imgToLogo.get(img);
            if (l) arr.push(l);
        });
        return arr;
    }

    function init() {
        var visible = visibleImgs();
        var inicial = shuffle(logos).slice(0, visible.length);
        visible.forEach(function (img, i) {
            img.src = inicial[i].src;
            img.alt = inicial[i].alt;
            img.style.opacity = '0.5';
            imgToLogo.set(img, inicial[i]);
        });
    }

    var lastImg = null;

    function tick() {
        var visible = visibleImgs();
        if (!visible.length) return;

        var candidatos = visible.length > 1
            ? visible.filter(function (i) { return i !== lastImg; })
            : visible;
        var img = candidatos[Math.floor(Math.random() * candidatos.length)];
        lastImg = img;

        var naTela = displayedLogos();
        var pool = logos.filter(function (l) { return naTela.indexOf(l) === -1; });
        if (!pool.length) return;
        var next = pool[Math.floor(Math.random() * pool.length)];

        /* marca antes do preload pros ticks seguintes ja enxergarem o destino e
           nao sortearem o mesmo logo pra outro slot. */
        imgToLogo.set(img, next);
        img.style.opacity = '0';

        var carregou = false, esperou = false;
        function conclui() {
            if (!carregou || !esperou) return;
            img.src = next.src;
            img.alt = next.alt;
            img.style.opacity = '0.5';
        }
        setTimeout(function () { esperou = true; conclui(); }, 600);
        var pre = new Image();
        pre.onload = pre.onerror = function () { carregou = true; conclui(); };
        pre.src = next.src;
    }

    init();
    setInterval(tick, 700);
})();

