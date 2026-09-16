/* ══════════════════════════════════════════════════════════════════════
   /ed/infinite-pass/oferta/dependencias/script.js

   Foil holográfico do ticket da lateral.

   Portado do bloco equivalente de /ed/pos-graduacoes/mba-fpa.js, com uma
   subtração deliberada: lá o card INTEIRO se inclina numa matrix3d que
   segue o cursor. Aqui o ticket fica parado e só o foil se move, então a
   matemática da matriz não veio junto. Ela foi REMOVIDA, e não deixada
   desligada: código morto envelhece pior que código ausente.

   O que sobrou, e é o efeito:
     - dez polígonos borrados em cores espectrais por cima da superfície,
       com shimmer ocioso (esse vive no CSS, em @keyframes);
     - no hover, o shimmer pausa e a rotação dos polígonos passa a
       responder à posição do cursor, voltando ao ocioso na saída.

   O overlay é injetado DUAS vezes, uma por metade do ticket, porque a
   silhueta dele não é um retângulo arredondado: são duas caixas cujas
   curvas de 24px entram pra dentro onde elas se encontram. Um recorte
   único no wrapper deixava o foil pintando por fora desses cantos. Com um
   overlay por metade, quem corta é o `overflow: hidden` de cada bloco, no
   raio que ele já tem.

   Pra continuar lendo como UMA folha de foil, os dois são desenhados no
   tamanho do ticket INTEIRO e deslocados: dentro do card o topo fica em
   0, dentro do canhoto ele sobe o tanto que o canhoto está abaixo do topo
   do ticket. Cada bloco mostra a fatia que lhe cabe da mesma arte.

   O bloco sai em silêncio se o ticket não estiver na página, e respeita
   prefers-reduced-motion não ligando nada.
   ══════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════════
   Relógio da página, e o atalho de pré-visualização dos lotes.

   Tudo o que muda com o tempo nesta página (o lote em cartaz, o rótulo dos
   botões, os preços, o relógio, a barra, a faixa de bônus) sai de UMA
   pergunta: que horas são. Este bloco responde a ela, e é o único lugar da
   página que chama `Date.now`.

   Com `?lote=01`, `?lote=02` ou `?lote=03` na URL, ele passa a responder
   com um instante DENTRO daquele lote, e a página inteira se comporta como
   se aquele fosse o momento. Não há bandeira de "modo de teste" espalhada
   pelos outros blocos: eles continuam só perguntando as horas.

   O instante é o MEIO da janela do lote pedido, e não o começo: no começo
   a barra está em zero e o relógio cheio, que é o estado menos informativo
   pra conferir. No lote 03, que não tem fim definido, é logo depois da
   virada.

   E é um DESVIO, não um congelamento: guarda-se a diferença entre o
   instante pedido e o relógio de verdade, e ela é somada a cada chamada.
   Assim o relógio continua andando e a barra continua se movendo, que é o
   que se quer ver num teste. Congelado, a tela ficaria parada e não daria
   pra saber se o mecanismo funciona.

   `Date.now` NÃO é substituído globalmente. Ele ainda é o relógio de tudo
   o mais que roda na página, inclusive do que não é nosso.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var desvio = 0;

    var pedido = new URLSearchParams(location.search).get('lote');
    var lote = document.querySelector('.of-lote[data-fim]');

    if (pedido && lote) {
        var inicio = Date.parse(lote.dataset.inicio);
        var fim01 = Date.parse(lote.dataset.fim);
        var fim02 = Date.parse(lote.dataset.fim02);
        var alvo = NaN;

        if (pedido === '01' || pedido === '1') alvo = (inicio + fim01) / 2;
        else if (pedido === '02' || pedido === '2') alvo = (fim01 + fim02) / 2;
        /* Meia hora depois da virada: perto o bastante pra ser claramente o
           lote 03, longe o bastante pra não cair em cima do segundo exato em
           que a conta muda. */
        else if (pedido === '03' || pedido === '3') alvo = fim02 + 1800000;

        if (!isNaN(alvo)) {
            desvio = alvo - Date.now();
            /* Um aviso no console, e não um selo na tela: quem abre a página
               com o parâmetro sabe o que pediu, e um banner atrapalharia
               justamente a conferência do layout. */
            console.info('[oferta] pré-visualizando o Lote ' + pedido +
                ' (' + new Date(alvo).toLocaleString('pt-BR') + ')');
        }
    }

    /* O relógio da página. Sem parâmetro, é `Date.now` e nada mais. */
    window.XpOferta = window.XpOferta || {};
    window.XpOferta.agora = function () { return Date.now() + desvio; };
})();

/* ══════════════════════════════════════════════════════════════════════
   Pastas 3D dos cursos.

   Cada card de formação ganha a .of-forma-pasta de /ed/areas/, montada com os
   cursos daquela formação. Clicar abre o lightbox do XpFolder, com nav e
   dots. Os dados vêm do dados.js compartilhado, pra não duplicar catálogo.

   Portado de /ed/pre-vitalicio/, menos um pedaço: lá o bloco lê os cursos
   da F6 direto do DOM, porque aquela página tem uma seção de cursos da F6
   que não pode divergir da pasta. Esta página não tem essa seção, então a
   F6 vem do catálogo como as outras seis.

   A origem também intercepta o clique do botão "Ver formação" pra abrir a
   mesma pasta. Aqui esse botão não existe mais (a coluna de CTA saiu do
   card), então a pasta é o único gatilho e não há o que interceptar.

   O `allHref` continua sendo montado, mas hoje não leva a lugar nenhum: ele
   alimenta o botão do rodapé do lightbox, que o style.css desta pasta
   esconde. Fica montado porque é de graça e porque basta remover aquele
   `display: none` pra a página da formação voltar a ter um caminho, que
   hoje ela não tem mais em nenhum lugar desta seção.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    if (typeof CURSOS === 'undefined' || typeof FORMACOES === 'undefined') return;
    if (!window.XpFolder) return;

    var slug = {
        f1: 'f1-power-bi-basico-intermediario',
        f2: 'f2-power-bi-intermediario-avancado',
        f3: 'f3-microsoft-fabric',
        f4: 'f4-banco-de-dados-sql',
        f5: 'f5-python-data-science',
        f6: 'f6-automacao-ia',
        f7: 'f7-carreira-negocios'
    };

    /* CURSOS -> formato que o lightbox espera. `nivel` fica vazio: curso não
       tem nível como os Business Cases têm, e não se inventa dado. */
    var porFormacao = {};
    CURSOS.forEach(function (c) {
        (porFormacao[c.f] = porFormacao[c.f] || []).push({
            image: c.img,
            title: c.titulo,
            nivel: '',
            duracao: c.dur,
            aulas: c.aulas,
            professor: c.prof,
            desc: c.desc,
            allHref: '/ed/formacoes/' + (slug[c.f] || '')
        });
    });

    FORMACOES.forEach(function (f) {
        var el = document.querySelector('.of-forma .of-forma-pasta[data-f="' + f.id + '"]');
        if (!el || !porFormacao[f.id]) return;
        window.XpFolder.mount(el, { unit: 'cursos', projects: porFormacao[f.id] });
    });
})();

/* ══════════════════════════════════════════════════════════════════════
   Tags das formações.

   Substituem a .formacoes-nav de /ed/formacoes/ e fazem o mesmo trabalho
   dela, que vive no index.js de lá: clicar rola até o card, e um
   IntersectionObserver acende a tag da formação que está em cena.

   As duas margens do observador vêm da origem (-20% em cima, -60%
   embaixo): elas estreitam a faixa de detecção pra uma fita no terço
   superior da tela, senão dois ou três cards contariam como "em cena" ao
   mesmo tempo e a tag ativa ficaria piscando durante a rolagem.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var tags = document.querySelectorAll('.of-forma-tag');
    var cards = document.querySelectorAll('.of-forma .of-forma-card');
    if (!tags.length || !cards.length) return;

    for (var i = 0; i < tags.length; i++) {
        tags[i].addEventListener('click', function () {
            var alvo = document.getElementById(this.dataset.alvo);
            /* `scrollIntoView` e não um cálculo próprio: o respiro embaixo
               da lateral fixa já está no `scroll-margin-top` do card, e o
               scroll-suave.js global cuida do amaciamento. */
            if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    if (!('IntersectionObserver' in window)) return;

    var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            if (!e.isIntersecting) return;
            for (var j = 0; j < tags.length; j++) tags[j].classList.remove('is-active');
            var tag = document.querySelector('.of-forma-tag[data-alvo="' + e.target.id + '"]');
            if (tag) tag.classList.add('is-active');
        });
    }, { rootMargin: '-20% 0px -60% 0px' });

    for (var k = 0; k < cards.length; k++) obs.observe(cards[k]);
})();

/* ══════════════════════════════════════════════════════════════════════
   Os dois controles da oferta.

   O TOGGLE DE PERFIL manda na parcela: aluno paga 147, novo paga 247. Ela
   aparece em dois lugares, o número grande do ticket e a linha "ou 12x N"
   da comparação, e os dois vêm da mesma constante aqui embaixo.

   O perfil manda também no À VISTA: 2497 pra quem é novo, 1497 pra aluno.
   Ele aparece embaixo do preço do ticket e no slot de valor da linha do
   Infinite Pass na comparação.

   Ou seja, cada perfil tem DOIS números, a parcela e o à vista, e eles não
   se derivam um do outro (12 x 247 = 2964, não 2497): são preços
   independentes da tabela, então a tabela é que está escrita aqui.

   O SLIDER DE ANOS manda no custo de quem NÃO leva o vitalício: cada ano
   de assinatura avulsa custa 3500, então a conta é anos x 3500.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    /* A tabela de preços da página, num lugar só: três lotes, e em cada um
       o par parcela/à vista para cada perfil. Os quatro números do Lote 01
       são os mesmos que o ticket e a seção da conta usam, então eles NÃO
       aparecem duas vezes: o PRECO abaixo aponta para cá. */
    var LOTES = {
        '01': { aluno: { parcela: 147, avista: 1497 }, novo: { parcela: 247, avista: 2497 } },
        '02': { aluno: { parcela: 197, avista: 1997 }, novo: { parcela: 297, avista: 2997 } },
        '03': { aluno: { parcela: 247, avista: 2497 }, novo: { parcela: 347, avista: 3497 } }
    };
    /* Qual lote está em cartaz AGORA.

       O prazo do Lote 01 é o mesmo `data-fim` que alimenta o relógio e a
       barra: passou dele, a página inteira vira Lote 02. Uma data só pra
       tudo, em vez de uma cópia por peça.

       A virada pro Lote 03 não está implementada porque o prazo do 02 não
       me foi passado. Quando vier, ele entra aqui no mesmo formato. */
    var elPrazo = document.querySelector('.of-lote[data-fim]');

    function loteAtual() {
        if (!elPrazo) return '01';
        /* Os atributos são lidos A CADA chamada, não uma vez na carga.
           Guardar os valores parseados economizaria nada e criaria um cache
           invisível: mudar as datas no HTML (ou no inspetor) deixaria de ter
           efeito, e a página passaria a discordar da própria marcação. */
        var agora = window.XpOferta.agora();
        var fim02 = Date.parse(elPrazo.dataset.fim02);
        if (!isNaN(fim02) && agora >= fim02) return '03';
        var fim01 = Date.parse(elPrazo.dataset.fim);
        if (!isNaN(fim01) && agora >= fim01) return '02';
        return '01';
    }
    var CUSTO_ANO = 3500;
    var PARCELAS = 12;

    var anos = document.querySelector('.of-anos');
    var atual = document.querySelector('.of-anos-atual');
    var perfis = document.querySelectorAll('.of-perfil-input');
    /* Plural: há mais de um ticket na página, e os dois mostram o mesmo
       preço. No singular, o segundo ficava congelado no valor escrito no
       HTML enquanto o toggle mexia só no primeiro. */
    var precoTicket = document.querySelectorAll('.of-preco-valor');
    var avistaTicket = document.querySelectorAll('.of-preco-avista');
    var valorAvulsa = document.querySelector('.of-linha--caro .of-linha-valor');
    var valorIP = document.querySelector('.of-linha--barato .of-linha-valor');
    var parcelaLinha = document.querySelector('.of-linha-parcela');
    var ganho = document.querySelector('.of-ganho-valor');
    var cartoesLote = document.querySelectorAll('.of-leva-linha[data-lote]');

    /* Cada peça é opcional: o ticket e a seção da conta são blocos
       independentes, e a página tem que continuar de pé se um deles sair. */
    if (!anos && !perfis.length) return;

    /* Separador de milhar do pt-BR é ponto, que é o que o resto da página
       usa ("R$ 13.979"). toLocaleString resolve sem tabela de formatação
       escrita à mão. */
    function milhar(n) { return n.toLocaleString('pt-BR'); }
    function real(n) { return 'R$ ' + milhar(n); }

    function perfilAtivo() {
        for (var i = 0; i < perfis.length; i++) {
            if (perfis[i].checked) return perfis[i].value;
        }
        return 'novo';
    }

    /* Tudo o que muda quando o lote vira. */
    var titulos = document.querySelectorAll('.of-lote-titulo');
    var ctas = document.querySelectorAll('[data-cta-lote]');
    var subComparacao = document.querySelector('.of-linha--barato .of-linha-sub');
    var bonusCanhoto = document.querySelectorAll('.of-stub-bonus');
    /* Tudo o que promete o bônus das 50 primeiras compras, e que portanto só
       vale no Lote 01: a faixa amarela do topo, a linha do canhoto dos dois
       tickets e os cards de bônus que levam esse selo. Somem juntas, pela
       mesma condição, porque dizem a mesma coisa. Uma lista só, senão a
       próxima peça que prometer esse bônus fica de fora do desligamento, que
       já aconteceu duas vezes aqui.

       Os cards entram na lista por CONTEÚDO, e não por posição: quem manda é
       carregar a tag de "50 primeiras". Escritos como "os dois primeiros",
       bastaria reordenar os bônus pra a regra passar a esconder os errados. */
    var bonus50 = Array.prototype.slice.call(
        document.querySelectorAll('.of-faixa, .of-stub-bonus50'));

    Array.prototype.forEach.call(
        document.querySelectorAll('.of-leva-card'), function (card) {
            if (card.querySelector('.tag-status[data-semantic="warning"]')) {
                bonus50.push(card);
            }
        });

    function pinta() {
        var id = loteAtual();
        var PRECO = LOTES[id] || LOTES['01'];
        var p = PRECO[perfilAtivo()] || PRECO.novo;

        /* O lote em cartaz aparece por escrito em quatro lugares. */
        for (var ti = 0; ti < titulos.length; ti++) titulos[ti].textContent = 'Lote ' + id;
        for (var ci = 0; ci < ctas.length; ci++) ctas[ci].textContent = 'Garantir Lote ' + id;
        if (subComparacao) subComparacao.textContent = 'Lote ' + id;

        /* O bônus escrito no canhoto muda com o lote: o 03 não leva a
           mentoria, só o livro. O texto é LIDO do card daquele lote, e não
           escrito aqui: os bônus já estão na marcação, um por lote, e uma
           segunda cópia no script seria a mesma verdade em dois lugares,
           livre pra discordar no dia em que um deles mudasse. */
        var cartaoDoLote = document.querySelector('.of-leva-linha[data-lote="' + id + '"] .of-linha-sub');
        if (cartaoDoLote) {
            for (var bo = 0; bo < bonusCanhoto.length; bo++) {
                bonusCanhoto[bo].textContent = 'Bônus: ' + cartaoDoLote.textContent;
            }
        }

        /* E aceso na lista de lotes da seção "o que você leva". */
        for (var li = 0; li < cartoesLote.length; li++) {
            cartoesLote[li].classList.toggle('is-ativo', cartoesLote[li].dataset.lote === id);
        }

        /* O bônus das 50 primeiras é do Lote 01: fora dele, some. `hidden` e
           não uma classe, porque o que se quer é tirar da página, não pintar
           de outro jeito. */
        for (var bi = 0; bi < bonus50.length; bi++) bonus50[bi].hidden = id !== '01';

        var txtParcela = String(p.parcela);
        var txtAvista = 'ou ' + milhar(p.avista) + ' à vista';
        for (var t = 0; t < precoTicket.length; t++) precoTicket[t].textContent = txtParcela;
        for (var a = 0; a < avistaTicket.length; a++) avistaTicket[a].textContent = txtAvista;
        if (valorIP) valorIP.textContent = real(p.avista);
        if (parcelaLinha) parcelaLinha.textContent = 'ou ' + PARCELAS + 'x ' + p.parcela;

        /* Os três cartões de lote seguem o MESMO toggle de perfil, cada um
           com a sua linha da tabela. E o que já passou troca os valores por
           "Esgotado": preço de lote vencido é oferta do que não existe. */
        for (var c = 0; c < cartoesLote.length; c++) {
            var lote = LOTES[cartoesLote[c].dataset.lote];
            if (!lote) continue;
            var lp = lote[perfilAtivo()] || lote.novo;
            var elPreco = cartoesLote[c].querySelector('.of-leva-preco');
            var elAvista = cartoesLote[c].querySelector('.of-linha-parcela');
            if (elPreco) elPreco.textContent = String(lp.parcela);
            if (elAvista) elAvista.textContent = 'ou ' + milhar(lp.avista) + ' à vista';

            /* Comparação numérica, e não de texto: '10' < '2' como string, e
               a regra passaria a errar assim que houvesse um lote 10. */
            var venceu = Number(cartoesLote[c].dataset.lote) < Number(id);
            var elValor = cartoesLote[c].querySelector('.of-linha-valor');
            var elEsgotado = cartoesLote[c].querySelector('.of-leva-esgotado');
            if (elValor) elValor.hidden = venceu;
            if (elAvista) elAvista.hidden = venceu;
            if (elEsgotado) elEsgotado.hidden = !venceu;
        }

        if (anos) {
            var n = +anos.value;
            var avulsa = n * CUSTO_ANO;
            if (atual) atual.textContent = n + (n === 1 ? ' ano' : ' anos');
            if (valorAvulsa) valorAvulsa.textContent = real(avulsa);

            /* Quanto se deixa de gastar: o que a assinatura avulsa custaria
               no período, menos o que o Infinite Pass custa uma vez só.

               O `Math.max(0, ...)` não é zelo à toa. Em 1 ano e perfil novo
               a conta fica NEGATIVA (1997 - 2497 = -500), porque aí o
               vitalício ainda não se pagou. "Você deixa de gastar R$ -500"
               seria uma frase sem sentido, então o piso é zero. Os outros
               nove anos da faixa são todos positivos. */
            if (ganho) ganho.textContent = real(Math.max(0, avulsa - p.avista));
        }
    }

    /* Os dois tickets têm o MESMO toggle, mas cada um com o seu grupo de
       rádio. Foi assim que o bug apareceu e assim que ele se conserta:

       com um `name` só pros quatro inputs, eles viravam um grupo único, e
       marcar uma opção num ticket DESMARCAVA as duas do outro. O segundo
       ticket ficava sem nenhuma pílula acesa, porque o visual sai do
       `:checked`. Com grupos separados cada ticket guarda a própria
       escolha, e é este ouvinte que mantém os dois dizendo a mesma coisa:
       ao mudar num, todos os inputs do mesmo valor são marcados. */
    function sincroniza(valor) {
        for (var j = 0; j < perfis.length; j++) {
            perfis[j].checked = perfis[j].value === valor;
        }
    }

    /* A virada tem que acontecer com a página aberta, não só num F5. Só
       repinta quando o lote REALMENTE mudou: repintar a cada segundo
       reescreveria uma dúzia de nós à toa e atropelaria a seleção de texto
       de quem estiver lendo. */
    var ultimoLote = loteAtual();
    setInterval(function () {
        var id = loteAtual();
        if (id === ultimoLote) return;
        ultimoLote = id;
        pinta();
    }, 1000);

    if (anos) anos.addEventListener('input', pinta);
    for (var i = 0; i < perfis.length; i++) {
        perfis[i].addEventListener('change', function () {
            sincroniza(this.value);
            pinta();
        });
    }
    pinta();
})();

(function () {
    'use strict';

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* A página tem MAIS DE UM ticket (o do topo e o da seção "o que você
       leva"), e cada um precisa do seu próprio foil, com seu próprio
       estado. Por isso o corpo virou uma função por ticket em vez de um
       `querySelector` solto: com o singular, o segundo ticket ficava sem
       brilho nenhum e o primeiro respondia ao mouse dos dois. */
    /* O contador tem que ser zerado ANTES da volta que chama a função: a
       DECLARAÇÃO dela sobe no escopo, mas esta atribuição é uma linha como
       outra qualquer e roda na ordem em que está escrita. Embaixo do
       forEach, `montaFoil.n` ainda era undefined nas chamadas e o id saía
       "ofTicketBlurNaN", repetido nos quatro. */
    montaFoil.n = 0;

    Array.prototype.forEach.call(document.querySelectorAll('.of-ticket'), montaFoil);

    function montaFoil(host) {
    var fx = host.querySelector('.of-ticket-fx');
    if (!fx) return;

    var hospedeiros = [
        fx.querySelector('.of-lateral-card'),
        fx.querySelector('.of-lateral-stub')
    ].filter(Boolean);
    if (!hospedeiros.length) return;

    /* Um id POR foil, e nao um fixo. Sao dois tickets com duas metades cada,
       e o mesmo `ofTicketBlur` saia repetido quatro vezes: id repetido e HTML
       invalido, e `url(#id)` resolve sempre no primeiro. Na pratica os quatro
       borroes usavam o desvio calculado pra a medida do PRIMEIRO ticket, e o
       do canhoto de baixo ficava com a intensidade errada. */
    var BLUR = 'ofTicketBlur' + (++montaFoil.n);

    /* O SVG é criado por JS, e não escrito no HTML, porque é decoração
       pura: sem script a página fica com o ticket limpo em vez de um SVG
       morto na marcação. */
    var svgs = hospedeiros.map(function (el) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'of-ticket-overlay');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('aria-hidden', 'true');
        el.appendChild(svg);
        return svg;
    });

    var ovs = [];
    var firstOverlayPosition = 0;
    var disableInOutOverlayAnimation = true;
    var disableOverlayAnimation = false;
    var enterTimeout = null, leaveTimeout1 = null, leaveTimeout2 = null, leaveTimeout3 = null;

    function aplicaOverlay() {
        for (var i = 0; i < ovs.length; i++) {
            /* i % 10 e não i: são dez grupos POR metade, e o defasamento
               de 10 graus tem que recomeçar na segunda, senão o canhoto
               continuaria a conta do card e as duas metades sairiam com o
               foil em ângulos diferentes. */
            ovs[i].style.transform = 'rotate(' + (firstOverlayPosition + (i % 10) * 10) + 'deg)';
            ovs[i].style.animation = disableOverlayAnimation ? 'none' : '';
            ovs[i].style.transition = disableInOutOverlayAnimation ? 'none' : 'transform 200ms ease-out';
        }
    }
    function setFirstOverlayPosition(v) { firstOverlayPosition = v; aplicaOverlay(); }
    function setDisableOverlayAnimation(v) { disableOverlayAnimation = v; aplicaOverlay(); }
    function setDisableInOutOverlayAnimation(v) { disableInOutOverlayAnimation = v; aplicaOverlay(); }

    /* Redesenha os overlays na medida atual do ticket. O polígono é a
       ampulheta da origem ("0,0 W,H W,0 0,H"): duas diagonais cruzadas que
       varrem a caixa inteira. */
    function desenhaOverlay() {
        var rf = fx.getBoundingClientRect();
        var w = Math.max(1, Math.round(rf.width));
        var h = Math.max(1, Math.round(rf.height));
        /* 5 de desvio para 176px de largura na origem, mantido em
           proporção aqui pra o borrão ter o mesmo peso visual. */
        var desvio = Math.max(1, (5 * w / 176)).toFixed(2);

        /* A marcação é montada POR SVG, e não uma vez pras duas metades: o
           filtro mora dentro do SVG e precisa de id próprio. Escrito uma vez
           só, o mesmo id saía nos dois, e id repetido é HTML inválido. A arte
           continua idêntica nas duas, que é o ponto do efeito; o que muda é
           só o nome do filtro. */
        for (var i = 0; i < svgs.length; i++) {
            var idFiltro = BLUR + '-' + i;
            var grupos = '';
            for (var k = 0; k < 10; k++) {
                grupos += '<g class="of-ov of-ov-' + (k + 1) + '">'
                    + '<polygon points="0,0 ' + w + ',' + h + ' ' + w + ',0 0,' + h + '"'
                    + ' filter="url(#' + idFiltro + ')" opacity="0.5"/>'
                    + '</g>';
            }
            svgs[i].setAttribute('viewBox', '0 0 ' + w + ' ' + h);
            svgs[i].innerHTML = '<defs><filter id="' + idFiltro + '">'
                + '<feGaussianBlur in="SourceGraphic" stdDeviation="' + desvio + '"/>'
                + '</filter></defs>' + grupos;
            /* negativo no canhoto, zero no card: é isto que costura a arte
               das duas metades numa folha só */
            svgs[i].style.top = (rf.top - hospedeiros[i].getBoundingClientRect().top) + 'px';
            svgs[i].style.height = h + 'px';
        }
        ovs = fx.querySelectorAll('.of-ov');
        aplicaOverlay();
    }

    /* ── Reação ao cursor ─────────────────────────────────────────────
       Mesma coreografia da origem, menos o tilt: entrando, o shimmer
       ocioso pausa e a rotação passa a vir da distância do cursor até o
       centro; saindo, ela volta a zero em dois passos e o shimmer
       retoma. ── */
    function posicaoPeloCursor(cx, cy) {
        var r = host.getBoundingClientRect();
        var xCentro = (r.left + r.right) / 2;
        var yCentro = (r.top + r.bottom) / 2;
        return (Math.abs(xCentro - cx) + Math.abs(yCentro - cy)) / 1.5;
    }

    host.addEventListener('mouseenter', function (e) {
        clearTimeout(leaveTimeout1); clearTimeout(leaveTimeout2); clearTimeout(leaveTimeout3);
        setDisableOverlayAnimation(true);
        setDisableInOutOverlayAnimation(false);
        enterTimeout = setTimeout(function () { setDisableInOutOverlayAnimation(true); }, 350);
        var cx = e.clientX, cy = e.clientY;
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                setFirstOverlayPosition(posicaoPeloCursor(cx, cy));
            });
        });
    });

    host.addEventListener('mousemove', function (e) {
        var cx = e.clientX, cy = e.clientY;
        setTimeout(function () { setFirstOverlayPosition(posicaoPeloCursor(cx, cy)); }, 150);
    });

    host.addEventListener('mouseleave', function () {
        clearTimeout(enterTimeout);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                setDisableInOutOverlayAnimation(false);
                leaveTimeout1 = setTimeout(function () { setFirstOverlayPosition(-firstOverlayPosition / 4); }, 150);
                leaveTimeout2 = setTimeout(function () { setFirstOverlayPosition(0); }, 300);
                leaveTimeout3 = setTimeout(function () {
                    setDisableOverlayAnimation(false);
                    setDisableInOutOverlayAnimation(true);
                }, 500);
            });
        });
    });

    desenhaOverlay();

    /* O ticket muda de altura com o conteúdo e de largura com o
       breakpoint, e o overlay é desenhado em pixels medidos, então ele
       precisa ser refeito quando a caixa muda. */
    if ('ResizeObserver' in window) {
        new ResizeObserver(desenhaOverlay).observe(fx);
    } else {
        window.addEventListener('resize', desenhaOverlay);
    }
    }
})();

/* ══════════════════════════════════════════════════════════════════════
   CTA dos cards de área (Extras).

   Aqui havia a mesma pasta 3D dos cards de formação. Ela saiu e no lugar
   entra um botão de baixa ênfase na direita do card, que abre o MESMO
   lightbox de Business Cases: o que mudou foi o gatilho, não o conteúdo.

   O botão nasce daqui, e não da marcação, porque o rótulo carrega a
   contagem de casos daquela área. Escrita no HTML, ela seria um número
   copiado do catálogo, livre pra divergir dele depois, que é exatamente o
   defeito que a f6 teve (10 cursos na lista, 19 na realidade). Vindo do
   AREAS, ela não tem como discordar.

   Efeito colateral bom: sem JS não nasce botão nenhum, em vez de nascer um
   botão que não abre nada.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    if (typeof AREAS === 'undefined' || !window.XpFolder) return;

    var slots = document.querySelectorAll('.of-extras-cta[data-area]');
    Array.prototype.forEach.call(slots, function (slot) {
        var dados = AREAS[slot.dataset.area];
        if (!dados || !dados.projects || !dados.projects.length) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn';
        btn.setAttribute('data-size', 's');
        btn.setAttribute('data-emphasis', 'subtle');
        btn.textContent = 'Ver ' + dados.projects.length + ' ' + (dados.unit || 'itens');

        slot.appendChild(btn);
    });

    /* O clique é DELEGADO, e não preso a cada botão. O carrossel ao lado é
       infinito POR CÓPIA: ele clona a trilha inteira, e `cloneNode` copia
       marcação, não ouvintes. Um ouvinte por botão deixaria mortos os
       botões das cópias, e são elas que aparecem em cena boa parte do
       tempo. Delegando, o botão clonado funciona por existir, sem precisar
       ter sido registrado, e o bloco não passa a depender da ordem em que
       os dois rodam. */
    document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('.of-extras-cta[data-area] .btn');
        if (!btn) return;
        var dados = AREAS[btn.closest('.of-extras-cta').dataset.area];
        if (dados && dados.projects) window.XpFolder.open(dados.projects, btn);
    });
})();

/* ══════════════════════════════════════════════════════════════════════
   Carrossel dos Extras.

   A trilha NÃO usa `overflow` (o CSS explica por quê: os vizinhos precisam
   aparecer por fora da coluna). Sem scroller nativo, este bloco responde
   por tudo: posição, arraste, snap, giro e teclado.

   ── O GIRO ──

   O carrossel é infinito POR CÓPIA: a fila de cards é montada três vezes
   seguidas e o que está em cena é sempre a do meio. Passar do último card
   apenas revela o primeiro da cópia da direita, que é idêntico a ele;
   terminada a transição, o índice recua uma banda inteira, sem animação, e
   volta pro meio. Como as três bandas são iguais e o recuo é de exatamente
   uma banda, a tela não muda um pixel no recuo: o giro não tem costura.

   A alternativa clássica (mover o primeiro card pro fim a cada volta) foi
   descartada: ela refaz o layout no meio do gesto, e o passo mudaria
   debaixo do dedo. Copiar custa DOM uma vez só e não custa nada durante o
   movimento.

   As cópias são decorativas: levam `aria-hidden` e não recebem foco, senão
   um leitor de tela anunciaria os nove conteúdos três vezes. Os `id`
   também ficam só nos originais, porque id repetido é HTML inválido. Como
   o repouso é sempre na banda do meio, o card em que se pousa é sempre o
   de verdade.

   As setas nunca mais desligam, e isso é consequência, não esquecimento:
   num carrossel que gira não existe ponta.

   ── O ARRASTE ──

   É por POINTER EVENTS, e isso é o conserto de um defeito real: com
   scroller nativo o dedo arrastava e o mouse não, porque scroller nenhum
   se arrasta com o mouse. Pointer Event é um só pros dois, então dedo e
   mouse passam a andar pelo mesmo caminho.

   Três detalhes que o arraste exige e que são fáceis de esquecer:

     1. `setPointerCapture`, senão soltar o botão fora da trilha (ou fora da
        janela) deixaria o carrossel grudado no ponteiro pra sempre;
     2. um LIMIAR antes de considerar arraste, senão o clique no botão do
        card viraria um micro-arraste e o popup nunca abriria;
     3. depois de um arraste de verdade, o `click` que o navegador dispara
        no fim tem que ser engolido uma vez, senão soltar o dedo em cima do
        botão abriria o popup sem querer.

   O `touch-action: pan-y` do CSS é o par disto: ele deixa a rolagem
   vertical da página com o navegador e manda só o horizontal pra cá.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var trilha = document.querySelector('.of-extras-cards');
    var tags = Array.prototype.slice.call(document.querySelectorAll('.of-extras-tag'));
    if (!trilha || !tags.length) return;

    var originais = Array.prototype.slice.call(trilha.querySelectorAll('.of-extras-card'));
    if (!originais.length) return;

    var N = originais.length;   /* cards de verdade; o resto é cópia */

    var LIMIAR = 8;        /* px de folga antes de virar arraste */
    var VIRADA = 0.2;      /* fração do passo que já troca de slide */

    /* ── as duas cópias ── */
    function copia(antes) {
        var pedaco = document.createDocumentFragment();
        originais.forEach(function (card) {
            var c = card.cloneNode(true);
            /* NENHUM id sobrevive na copia, nem no card nem dentro dele: id
               repetido e HTML invalido, e um dos cards traz um <svg> com
               gradiente identificado. As referencias `url(#...)` da copia
               continuam funcionando, porque elas valem no documento inteiro e
               acham a definicao que ficou no card original. */
            c.removeAttribute('id');
            Array.prototype.forEach.call(c.querySelectorAll('[id]'),
                function (e) { e.removeAttribute('id'); });
            c.setAttribute('aria-hidden', 'true');
            /* Foco não entra numa cópia: ela já está escondida do leitor de
               tela, e conteúdo focável dentro de `aria-hidden` é justamente
               a combinação que quebra a navegação por teclado (o foco vai
               parar num lugar que a leitura não anuncia). */
            Array.prototype.forEach.call(
                c.querySelectorAll('a, button, input, select, textarea, [tabindex]'),
                function (f) { f.setAttribute('tabindex', '-1'); });
            pedaco.appendChild(c);
        });
        if (antes) trilha.insertBefore(pedaco, trilha.firstChild);
        else trilha.appendChild(pedaco);
    }
    copia(false);
    copia(true);

    var slides = Array.prototype.slice.call(trilha.querySelectorAll('.of-extras-card'));

    var indice = N;        /* repouso: primeiro card da banda do meio */
    var passo = 0;
    var larg = 0;
    var arrastando = false;
    var pegou = false;
    var x0 = 0;
    var dx = 0;

    /* As duas medidas saem de `getBoundingClientRect`, que devolve FRAÇÃO.
       `offsetLeft` e `offsetWidth`, que estavam aqui, arredondam pro inteiro
       mais próximo, e o passo real é quebrado (994,4px numa janela de 1440).
       Meio pixel por card não incomodava enquanto o repouso era o índice 0;
       com o giro, o repouso passou pro índice 9 e o erro virou quase 4px, o
       bastante pra o card em cena calcular opacidade 0,9959. Como o ponteiro
       só é liberado acima de 0,999, o card da vez ficava com
       `pointer-events: none` e o botão dentro dele parava de responder.

       O rect é imune ao transform pro que interessa aqui: os dois cards
       estão deslocados igual, então a DIFERENÇA entre eles é o passo puro. */
    function mede() {
        var caixa = slides[0].getBoundingClientRect();
        larg = caixa.width;
        passo = slides.length > 1
            ? slides[1].getBoundingClientRect().left - caixa.left
            : larg;
    }

    function pinta(suave) {
        var tx = -indice * passo + dx;
        trilha.style.transition = suave ? 'transform 0.4s ease-out' : 'none';
        trilha.style.transform = 'translate3d(' + tx + 'px, 0, 0)';

        slides.forEach(function (s, i) {
            /* Quanto deste slide já passou da borda esquerda da trilha. A
               posição vem do ÍNDICE, não de uma leitura do DOM: os cards são
               todos da mesma largura, então `i * passo` é a posição exata, e
               a conta inteira fecha sem arredondamento nenhum. De quebra,
               some uma leitura de layout por card a cada quadro do arraste. */
            var fora = (indice - i) * passo - dx;
            var op = 1 - fora / larg;
            op = op < 0 ? 0 : (op > 1 ? 1 : op);
            s.style.opacity = op;
            /* Card esmaecido continua existindo e continua capturando
               clique: opacidade não é o mesmo que ausência. Como ele passa
               por cima da lateral fixa, era ele quem engolia os cliques nas
               tags, e a navegação inteira ficava morta. Só o card em cena
               (opacidade cheia) recebe ponteiro. */
            s.style.pointerEvents = op > 0.999 ? '' : 'none';
        });

        /* A tag ativa é decidida FORA do laço. Dentro dele, como três
           slides dividem a mesma tag, a última volta desmarcaria o que a
           primeira acabou de marcar. */
        var ativa = ((indice % N) + N) % N;
        tags.forEach(function (t, k) { t.classList.toggle('is-active', k === ativa); });
    }

    /* Traz o índice de volta pra banda do meio. O quadro na tela é idêntico
       antes e depois (as bandas são cópias e o recuo é de uma banda exata),
       mas os ELEMENTOS trocam de papel: o card que estava em cena vira o da
       banda vizinha, e quem assume o lugar dele estava com opacidade 0. Sem
       cortar a transição de opacidade, esse card apareceria esmaecendo
       durante 0.4s, e o giro sem costura ganharia uma piscada bem no ponto
       da emenda. A classe corta a transição, o reflow força o navegador a
       assumir os valores novos, e aí ela sai. */
    function normaliza() {
        if (pegou) return;
        var alvo = ((indice - N) % N + N) % N + N;
        if (alvo === indice) return;
        indice = alvo;
        trilha.classList.add('is-recentrando');
        pinta(false);
        void trilha.offsetWidth;
        trilha.classList.remove('is-recentrando');
    }

    trilha.addEventListener('transitionend', function (e) {
        /* `transitionend` borbulha, e os cards também transicionam (a
           opacidade). Sem este filtro, cada card terminando a transição
           dele dispararia um recuo. */
        if (e.target === trilha && e.propertyName === 'transform') normaliza();
    });

    function vaiPara(i, suave) {
        /* O limite aqui é o da FILA RENDERIZADA, não o do carrossel: ele
           não tem fim, mas o DOM tem. Um gesto violento não pode mandar a
           trilha pro vazio depois da terceira banda. */
        indice = i < 0 ? 0 : (i > slides.length - 1 ? slides.length - 1 : i);
        dx = 0;
        pinta(suave !== false);
        if (suave === false) normaliza();
    }

    /* Das três ocorrências de um card (uma por banda), a tag leva pra mais
       perto. Sem isso, clicar na última tag estando na primeira faria a
       trilha varrer oito cards pra frente, quando o vizinho da esquerda é o
       mesmo conteúdo a um passo de distância. */
    function maisPerto(logico) {
        var melhor = logico + N, dist = Infinity;
        for (var k = 0; k < 3; k++) {
            var c = logico + k * N;
            var d = Math.abs(c - indice);
            if (d < dist) { dist = d; melhor = c; }
        }
        return melhor;
    }

    tags.forEach(function (tag, i) {
        tag.addEventListener('click', function () { vaiPara(maisPerto(i)); });
    });

    /* Setas: a segunda via de navegação. Elas andam de um slide pro vizinho
       e leem o MESMO `indice` das tags, então as duas nunca discordam sobre
       o que está em cena. Nenhuma delas desliga: o carrossel gira, e a
       ponta onde o botão deixaria de cumprir a promessa não existe mais. */
    var setas = Array.prototype.slice.call(document.querySelectorAll('.of-extras-nav .lb-nav'));
    setas.forEach(function (seta) {
        seta.addEventListener('click', function () {
            vaiPara(indice + (+seta.dataset.passo));
        });
    });

    /* ── arraste ── */

    /* Sem isto o arraste morre em cima de qualquer imagem, e os cards são
       quase todos imagem. O navegador começa o arrastar NATIVO da <img>
       (aquele de soltar o arquivo em outra janela), e a partir daí ele
       para de mandar pointermove: o gesto trava no primeiro pixel. Foi
       exatamente o que aconteceu aqui, e o sintoma era "o drag não
       funciona" só nos cards com foto. `dragstart` borbulha, então um
       ouvinte na trilha cobre todas as imagens dentro dela. */
    trilha.addEventListener('dragstart', function (e) { e.preventDefault(); });

    trilha.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        pegou = true;
        arrastando = false;
        x0 = e.clientX;
        dx = 0;
    });

    trilha.addEventListener('pointermove', function (e) {
        if (!pegou) return;
        var d = e.clientX - x0;
        if (!arrastando) {
            if (Math.abs(d) < LIMIAR) return;
            arrastando = true;
            trilha.setPointerCapture(e.pointerId);
            trilha.classList.add('is-arrastando');
        }
        /* Aqui havia um freio pras pontas, dividindo o deslocamento por 3
           quando o gesto puxava pra fora do primeiro ou do último card. Ele
           saiu junto com as pontas: o que vem depois do último agora é o
           primeiro, e frear ali seria resistir a um movimento válido. */
        dx = d;
        pinta(false);
    });

    function solta(e) {
        if (!pegou) return;
        pegou = false;
        if (!arrastando) return;
        arrastando = false;
        trilha.classList.remove('is-arrastando');
        if (trilha.hasPointerCapture && trilha.hasPointerCapture(e.pointerId)) {
            trilha.releasePointerCapture(e.pointerId);
        }
        /* Quantos slides o gesto andou, em frações de passo, com o zero
           deslocado pra VIRADA contar como um salto: arrastar 20% do passo
           já troca de card, em vez dos 50% que o arredondamento puro
           exigiria. O sinal do deslocamento acompanha o sentido do gesto,
           senão um arraste pra trás precisaria de 80% pra valer. */
        var saltos = 0;
        if (passo) {
            var f = -dx / passo;
            /* o sinal sai da conta e volta no fim de propósito: arredondar o
               módulo deixa os dois sentidos idênticos. Somando o
               deslocamento direto em `f`, o gesto pra trás precisaria de um
               pixel a mais que o gesto pra frente, porque Math.round(-0.5)
               é -0 e Math.round(0.5) é 1. */
            saltos = (f < 0 ? -1 : 1) * Math.round(Math.abs(f) + (0.5 - VIRADA));
        }
        vaiPara(indice + saltos);

        /* engole o clique que fecha o gesto, uma vez só */
        trilha.addEventListener('click', function engole(ev) {
            ev.stopPropagation();
            ev.preventDefault();
            trilha.removeEventListener('click', engole, true);
        }, true);
    }
    trilha.addEventListener('pointerup', solta);
    trilha.addEventListener('pointercancel', solta);

    /* ── teclado ──
       Só as setas horizontais, de propósito.

       Home e End chegaram a ficar aqui e tiveram que sair: o
       scroll-suave.js global escuta keydown na window e trata Home, End,
       PageUp/Down, espaço e as setas VERTICAIS rolando a página, sem
       consultar `e.defaultPrevented`. Ou seja, o preventDefault daqui não
       o segura, e a tecla fazia as duas coisas ao mesmo tempo: o carrossel
       ia pra ponta e a página saltava junto.

       As setas laterais sobram livres porque aquele script não as usa. Se
       um dia Home e End forem desejáveis aqui, o conserto é lá: fazer o
       scroll-suave.js sair cedo quando o evento já foi tratado. Não fiz
       porque ele é global e vale pro site inteiro. */
    trilha.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        vaiPara(indice + d);
    });

    /* A largura do slide vem da largura da trilha, então redimensionar
       muda o passo e a posição de repouso. */
    window.addEventListener('resize', function () { mede(); pinta(false); });

    mede();
    pinta(false);
})();

/* ══════════════════════════════════════════════════════════════════════
   FAQ em formato de conversa.

   Clicar num chip troca dois balões: a pergunta (que é o próprio texto do
   chip) e a resposta (que vem do bloco oculto no HTML, casada pelo
   `data-faq`).

   As respostas NÃO moram aqui dentro de propósito. Escritas no script,
   elas sumiriam da página pra quem não executa JS e pra qualquer coisa que
   leia o HTML. Estando na marcação, o script só copia texto de um lugar
   pro outro.

   O estado é o `aria-pressed` do chip, e não uma classe: o atributo já tem
   que existir pro leitor de tela, e manter uma classe em paralelo seria a
   mesma verdade em dois lugares, livre pra discordar.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var chips = document.querySelectorAll('.of-faq-chip');
    var pergunta = document.querySelector('[data-faq-pergunta]');
    var resposta = document.querySelector('[data-faq-resposta]');
    if (!chips.length || !pergunta || !resposta) return;

    var linhaPergunta = pergunta.closest('.of-faq-linha');
    var linhaResposta = resposta.closest('.of-faq-linha');

    /* Religa uma animação. Só tirar e repor a classe não basta: o navegador
       junta as duas mudanças no mesmo quadro, conclui que nada mudou e não
       reinicia nada. Ler uma medida no meio força o reflow e separa os dois
       estados. */
    function roda(linha, classe) {
        if (!linha) return;
        linha.classList.remove('is-saindo', 'is-entrando');
        void linha.offsetWidth;
        linha.classList.add(classe);
    }

    function escreve(chip) {
        var fonte = document.querySelector('.of-faq-fonte [data-faq="' + chip.dataset.faq + '"]');
        if (!fonte) return false;
        pergunta.textContent = chip.textContent;
        resposta.textContent = fonte.textContent;
        return true;
    }

    /* Com movimento reduzido as animações viram `none` e o `animationend`
       nunca dispara. Sem este atalho a troca simplesmente não aconteceria:
       o texto ficaria preso na pergunta anterior. */
    var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    function semMovimento() { return !!(mq && mq.matches); }

    /* Qual chip é o alvo AGORA. Clicar de novo no meio da saída não
       empilha troca nenhuma: reinicia a saída e o `animationend` passa a
       escrever o chip mais recente. */
    var alvo = null;

    linhaResposta.addEventListener('animationend', function (e) {
        if (e.animationName !== 'ofFaqSai' || !alvo) return;
        escreve(alvo);
        alvo = null;
        roda(linhaPergunta, 'is-entrando');
        roda(linhaResposta, 'is-entrando');
    });

    function mostra(chip) {
        for (var i = 0; i < chips.length; i++) {
            var ativo = chips[i] === chip;
            /* Os dois saem da MESMA decisão, na mesma linha: o `aria-pressed`
               é o que o leitor de tela lê, e o `.is-active` é o estado que o
               componente Button Tags do DS pinta. Escritos juntos, não têm
               como discordar. */
            chips[i].setAttribute('aria-pressed', ativo ? 'true' : 'false');
            chips[i].classList.toggle('is-active', ativo);
        }
        if (semMovimento()) { escreve(chip); return; }
        alvo = chip;
        /* A fala velha sai primeiro; quem escreve a nova e traz ela de volta
           é o `animationend` acima. A duração vive só no CSS: repetir ela
           aqui num setTimeout seria a mesma medida em dois lugares, livre
           pra divergir. */
        roda(linhaPergunta, 'is-saindo');
        roda(linhaResposta, 'is-saindo');
    }

    for (var i = 0; i < chips.length; i++) {
        chips[i].addEventListener('click', function () { mostra(this); });
    }
})();

/* ══════════════════════════════════════════════════════════════════════
   O indicador do lote, e a barra que o acompanha.

   Ele muda de natureza conforme o lote em cartaz, e as duas leituras
   (texto e barra) saem sempre da MESMA conta:

     LOTE 01, contagem regressiva. O texto mostra quanto falta até o
       `data-fim`; a barra mostra quanto do período já passou, de
       `data-inicio` até lá. Linear: tempo não acelera.

     LOTE 02, vagas preenchidas. O texto mostra "N% das vagas
       preenchidas" e a barra mostra o mesmo N. Sai de `data-vagas-02` e
       chega a 100% no `data-fim-02`, DESACELERANDO: corre no começo e vai
       afrouxando perto do fim.

   Todos os números vivem em atributos do `.of-lote`, nenhum no script. Os
   nomes são `data-fim02` e `data-vagas02`, sem hífen antes do número: em
   `data-fim-02` o hífen NÃO some na leitura, porque a conversão pra
   camelCase do `dataset` só vale quando o hífen vem antes de letra
   minúscula. A chave viraria `fim-02` e `dataset.fim02` seria undefined,
   que foi o que aconteceu na primeira versão disto.

   O LOTE 03 ainda não tem regra: sem a janela dele, o indicador fica
   vazio em vez de repetir o número do lote anterior, que anunciaria
   "100% das vagas" enquanto vende.

   O intervalo é de 1s, mas cada tique RECALCULA a partir do relógio, em
   vez de decrementar um contador. Subtrair 1 a cada disparo iria
   acumulando o atraso do `setInterval` (e pararia junto com a aba em
   segundo plano); recalculando, voltar pra aba mostra a hora certa.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var lotes = document.querySelectorAll('.of-lote[data-fim]');
    if (!lotes.length) return;

    /* Quanto a curva de vagas desacelera. 1 seria linear; 2 é o ease-out
       quadrático, que aos 10% do tempo já entregou 19% do caminho e aos
       90% entregou 99%. Está nomeado pra ser ajustável sem caçar o número
       no meio da conta. */
    var DESACELERACAO = 2;

    function doisDigitos(n) { return (n < 10 ? '0' : '') + n; }

    function pinta() {
        var agora = window.XpOferta.agora();

        Array.prototype.forEach.call(lotes, function (lote) {
            var relogio = lote.querySelector('.of-lote-timer');
            var barra = lote.querySelector('.of-lote-barra');
            var trilho = lote.querySelector('.of-lote-trilho');

            var inicio = Date.parse(lote.dataset.inicio);
            var fim01 = Date.parse(lote.dataset.fim);
            var fim02 = Date.parse(lote.dataset.fim02);
            var vagas02 = parseFloat(lote.dataset.vagas02);

            var texto = '';
            var pct = null;

            if (!isNaN(fim01) && agora < fim01) {
                /* ── Lote 01: quanto falta ── */
                var resta = Math.max(0, Math.floor((fim01 - agora) / 1000));
                /* Horas TOTAIS, sem virar dias: um prazo de 30h lê
                   "30:00:00", que é o que se espera de um contador. */
                texto = doisDigitos(Math.floor(resta / 3600)) + ':'
                    + doisDigitos(Math.floor((resta % 3600) / 60)) + ':'
                    + doisDigitos(resta % 60);
                if (!isNaN(inicio) && fim01 > inicio) {
                    pct = (agora - inicio) / (fim01 - inicio) * 100;
                }
            } else if (!isNaN(fim02) && agora < fim02 && !isNaN(vagas02)) {
                /* ── Lote 02: vagas preenchidas, desacelerando ──
                   `t` é o tempo, de 0 a 1. A curva 1-(1-t)^n devolve quanto
                   do caminho já foi: ela sobe rápido no começo e achata no
                   fim, que é o pedido. */
                var t = (agora - fim01) / (fim02 - fim01);
                t = t < 0 ? 0 : (t > 1 ? 1 : t);
                var andou = 1 - Math.pow(1 - t, DESACELERACAO);
                pct = vagas02 + (100 - vagas02) * andou;
                /* O texto é truncado, e travado em 99 até o prazo chegar de
                   fato. Numa curva que desacelera, o último ponto percentual
                   demora muito: arredondando, o número virava "100%" um dia e
                   meio antes do fim e ficava lá, anunciando lote esgotado com
                   o lote ainda vendendo. Truncar atrasa isso, e o teto de 99
                   resolve o resto: 100% passa a ser o instante do prazo, e só
                   ele. A BARRA continua contínua, porque ali a fração é o
                   desenho, não a afirmação. */
                var mostra = t >= 1 ? 100 : Math.min(99, Math.floor(pct));
                texto = mostra + '% das vagas preenchidas';
            } else if (!isNaN(fim02) && agora >= fim02) {
                /* Lote 03. Ele não tem janela própria, então o texto fica
                   vazio: qualquer número ali seria invenção. A barra, essa
                   vai a 100, porque é o que se sabe de fato, que o último
                   período definido terminou. Deixá-la como está seria pior:
                   ela guardaria a fração do lote anterior, ou o número que
                   veio escrito na marcação, nenhum dos dois com sentido. */
                pct = 100;
            }

            if (relogio && texto) relogio.textContent = texto;
            if (relogio && !texto) relogio.textContent = '';

            if (barra && pct !== null) {
                pct = pct < 0 ? 0 : (pct > 100 ? 100 : pct);
                barra.style.width = pct.toFixed(2) + '%';
                /* O valor também vai pro ARIA: a barra é um progressbar de
                   verdade, e sem isto ela anunciaria para sempre o número
                   que está escrito no HTML. */
                if (trilho) trilho.setAttribute('aria-valuenow', Math.round(pct));
            }
        });
    }

    pinta();
    setInterval(pinta, 1000);
})();

/* ══════════════════════════════════════════════════════════════════════
   Fotos da prova social do ticket.

   Mesmo sorteio da home e de /ed/areas/: a lista é embaralhada e os cinco
   primeiros vão pros círculos. Embaralhar, e não fixar cinco nomes na
   marcação, é o que faz a fileira mudar a cada carga em vez de eleger
   sempre os mesmos cinco alunos.

   Os dois tickets são servidos pela MESMA volta: o `querySelectorAll` pega
   os dez círculos, e o índice roda na lista com `%`, senão do sexto em
   diante a foto seria `undefined` e o círculo ficaria só com o --dn700.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var circulos = document.querySelectorAll('.of-prova .of-prova-retrato');
    if (!circulos.length) return;

    var fotos = [
        '/ed/infinite-pass/oferta/dependencias/depoimento-claudio.webp',
        '/ed/infinite-pass/oferta/dependencias/depoimento-cleiton.webp',
        '/ed/infinite-pass/oferta/dependencias/depoimento-daniel.webp',
        '/ed/infinite-pass/oferta/dependencias/depoimento-edson.webp',
        '/ed/infinite-pass/oferta/dependencias/depoimento-eduardo.webp',
        '/ed/infinite-pass/oferta/dependencias/depoimento-ezequiel.webp',
        '/ed/infinite-pass/oferta/dependencias/depoimento-gabriel.webp',
        '/ed/infinite-pass/oferta/dependencias/depoimento-louiz.webp',
        '/ed/infinite-pass/oferta/dependencias/depoimento-pedro.webp',
        '/ed/infinite-pass/oferta/dependencias/depoimento-vinicius.webp',
        '/ed/infinite-pass/oferta/dependencias/depoimento-vitoria.webp'
    ];

    for (var i = fotos.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = fotos[i]; fotos[i] = fotos[j]; fotos[j] = t;
    }

    Array.prototype.forEach.call(circulos, function (el, k) {
        el.style.backgroundImage = 'url(' + fotos[k % fotos.length] + ')';
    });
})();

/* ══════════════════════════════════════════════════════════════════════
   Conectores e partículas do diagrama do Marketplace.

   Portado do data-squads: um <path> por ficha, medido do layout REAL (quem
   posiciona as fichas é o CSS), e três partículas por conector correndo
   pelo mesmo `d`. Nada de laço por quadro: o script só monta os caminhos e
   a animação inteira é CSS.

   A curva mudou de eixo. No data-squads as fichas estão ACIMA do hub e as
   alças da bézier são verticais; aqui elas estão à ESQUERDA e à DIREITA
   dele, então as alças são horizontais. O traço sai pela borda interna da
   ficha, faz o S e entra no hub pela lateral, sem canto nem trecho reto. O
   sinal vem da própria geometria, então os quatro cantos usam a mesma conta.

   Há ainda dois conectores retos, do hub até as bordas do palco. Eles vêm
   do marketplace e existem pra o fluxo não parecer começar e terminar
   dentro do card: a máscara esmaece as pontas e eles somem na borda.

   A duração e o atraso de cada partícula são sorteados. Fixos, elas sairiam
   em fila cadenciada, que lê como esteira; sorteados, lê como fluxo.

   Este bloco roda DEPOIS do carrossel de propósito. O carrossel copia a
   fila de cards, e aqui o `querySelectorAll` pega os três palcos: o
   original e as duas cópias. Rodando antes, só o original teria observador
   de tamanho, e as cópias congelariam com os caminhos da primeira medida.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var palcos = document.querySelectorAll('.of-rede');
    if (!palcos.length) return;

    var NS = 'http://www.w3.org/2000/svg';
    var ALCA_MIN = 64;   /* alça mínima das tangentes, mantém a saída horizontal */
    var POR_TRACO = 3;   /* partículas por conector */

    function n(v) { return Math.round(v * 100) / 100; }

    /* Bézier cúbica de (x0,y0) até (x1,y1) com as duas alças na horizontal.
       A alça acompanha metade da distância, com um piso, pra a curva
       continuar suave tanto colada no hub quanto longe dele. */
    function rota(x0, y0, x1, y1) {
        var s = x1 > x0 ? 1 : -1;
        var k = Math.max(ALCA_MIN, Math.abs(x1 - x0) * 0.5) * s;
        return 'M' + n(x0) + ' ' + n(y0) +
            ' C' + n(x0 + k) + ' ' + n(y0) +
            ', ' + n(x1 - k) + ' ' + n(y1) +
            ', ' + n(x1) + ' ' + n(y1);
    }

    Array.prototype.forEach.call(palcos, function (palco) {
        var svg = palco.querySelector('.of-rede-conectores');
        var hub = palco.querySelector('.of-rede-hub');
        /* `:not` exclui as duas fichas fantasma: elas são textura de fundo,
           e um conector pra cada uma competiria com os dois ramos que já
           saem do hub pras bordas, no mesmo lugar. */
        var fichas = Array.prototype.slice.call(
            palco.querySelectorAll('.of-rede-ficha:not(.of-rede-ficha--fantasma)'));
        if (!svg || !hub || !fichas.length) return;

        var camada = document.createElement('div');
        camada.className = 'of-rede-particulas';
        camada.setAttribute('aria-hidden', 'true');
        svg.parentNode.insertBefore(camada, svg.nextSibling);

        /* Um traço por ficha, mais os dois retos do hub até as bordas. */
        var tracos = fichas.map(function (ficha) { return { ficha: ficha }; });
        tracos.push({ borda: -1 }, { borda: 1 });

        tracos.forEach(function (t) {
            t.path = document.createElementNS(NS, 'path');
            svg.appendChild(t.path);
            t.pontos = [];
            for (var i = 0; i < POR_TRACO; i++) {
                var ponto = document.createElement('span');
                ponto.className = 'of-rede-particula';
                ponto.style.setProperty('--dur', (2.5 + Math.random() * 3.5).toFixed(2) + 's');
                ponto.style.setProperty('--delay', (Math.random() * -8).toFixed(2) + 's');
                camada.appendChild(ponto);
                t.pontos.push(ponto);
            }
        });

        function desenha() {
            var c = palco.getBoundingClientRect();
            if (!c.width) return;
            svg.setAttribute('viewBox', '0 0 ' + c.width + ' ' + c.height);

            var h = hub.getBoundingClientRect();
            var hEsq = h.left - c.left, hDir = h.right - c.left;
            var hMeio = h.top - c.top + h.height / 2;

            tracos.forEach(function (t) {
                var d;
                if (t.ficha) {
                    var r = t.ficha.getBoundingClientRect();
                    var esq = r.left - c.left, dir = r.right - c.left;
                    /* Cada ponta encosta na borda virada pro outro: a ficha da
                       esquerda sai pela direita dela e chega na esquerda do
                       hub, e vice-versa. */
                    var aEsquerda = (esq + dir) / 2 < (hEsq + hDir) / 2;
                    d = rota(aEsquerda ? dir : esq, r.top - c.top + r.height / 2,
                             aEsquerda ? hEsq : hDir, hMeio);
                } else {
                    /* Os dois ramos que saem do hub pras bordas do palco. Eles
                       eram horizontais e agora terminam 32px fora da altura do
                       hub: o da direita sobe, o da esquerda desce. É a mesma
                       bézier dos outros, então o desvio acontece ao longo do
                       trecho inteiro em vez de num cotovelo no fim. */
                    var pra = t.borda < 0;
                    d = rota(pra ? hEsq : hDir, hMeio,
                             pra ? 0 : c.width, hMeio + (pra ? 32 : -32));
                }
                t.path.setAttribute('d', d);
                var caminho = 'path("' + d + '")';
                t.pontos.forEach(function (p) { p.style.offsetPath = caminho; });
            });
        }

        desenha();
        if (window.ResizeObserver) {
            var ro = new ResizeObserver(desenha);
            ro.observe(palco);
            fichas.forEach(function (f) { ro.observe(f); });
        } else {
            window.addEventListener('resize', desenha);
        }
        /* As fichas mudam de largura quando a fonte chega, e o traço é medido
           a partir delas: sem este redesenho ele ficaria preso à medida que o
           texto tinha com a fonte de sistema. */
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(desenha);

        /* Fora da tela, nada anima. */
        if (window.IntersectionObserver) {
            new IntersectionObserver(function (e) {
                palco.classList.toggle('is-paused', !e[0].isIntersecting);
            }, { rootMargin: '128px' }).observe(palco);
        }
    });
})();

/* ══════════════════════════════════════════════════════════════════════
   Carrossel de depoimentos.

   Portado do home.js. A trilha é um scroller NATIVO, ao contrário do
   carrossel dos extras: o arrasto é a rolagem horizontal do navegador, e as
   setas só empurram um passo. Isso serve aqui porque não há nada pra
   arrastar por cima dos cards, e o scroller nativo já traz inércia, teclado
   e leitura de tela de graça.

   O giro é por cópia, como o dos extras: o script duplica a fila antes e
   depois, e quando a rolagem passa de uma banda ele recoloca o scrollLeft
   uma banda adiante ou atrás, sem animação. Como as bandas são iguais, o
   salto não aparece.

   Saiu uma coisa da versão da home: o `gridOffset`, que compensava a trilha
   sangrando pra fora do container em telas largas. Aqui ela vive dentro de
   7 colunas, então a compensação seria sempre zero.

   O clique no vídeo é DELEGADO no documento, de propósito: as cópias saem de
   `cloneNode` e não carregam ouvintes. Mesmo motivo do CTA dos extras.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var trilha = document.getElementById('of-depos-trilha-id');
    if (!trilha) return;

    var antes = document.getElementById('of-depos-anterior');
    var depois = document.getElementById('of-depos-proximo');

    var originais = Array.prototype.slice.call(trilha.children);
    var N = originais.length;
    if (!N) return;

    originais.forEach(function (c) {
        var cl = c.cloneNode(true);
        cl.setAttribute('aria-hidden', 'true');
        trilha.appendChild(cl);
    });
    originais.slice().reverse().forEach(function (c) {
        var cl = c.cloneNode(true);
        cl.setAttribute('aria-hidden', 'true');
        trilha.insertBefore(cl, trilha.firstChild);
    });

    /* Troca a capa pelo player do YouTube. O `data-vid` sai junto, então o
       segundo clique no mesmo card não remonta o iframe por cima. */
    document.addEventListener('click', function (e) {
        var alvo = e.target.closest && e.target.closest('.of-depos-conteudo .of-depos-video[data-vid]');
        if (!alvo) return;
        var vid = alvo.dataset.vid;
        delete alvo.dataset.vid;
        var frame = document.createElement('iframe');
        frame.src = 'https://www.youtube.com/embed/' + vid + '?autoplay=1';
        frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        frame.allowFullscreen = true;
        alvo.innerHTML = '';
        alvo.appendChild(frame);
    });

    function passo() {
        var c = trilha.querySelector('.of-depos-card');
        var g = parseFloat(getComputedStyle(trilha).columnGap) || 24;
        return c ? c.getBoundingClientRect().width + g : 0;
    }

    /* Reposiciona sem animar: sem cortar o scroll-behavior, o recuo de uma
       banda inteira viraria um deslize visível de ponta a ponta. */
    function pulaPara(x) {
        trilha.style.scrollBehavior = 'auto';
        trilha.scrollLeft = x;
        void trilha.offsetWidth;
        trilha.style.scrollBehavior = '';
    }

    /* A FOLGA de 1px não é superstição: a largura do card é quebrada, então
       `N * passo()` também é, e o `scrollLeft` que o navegador guarda cai
       uma fração abaixo disso. Sem folga, a posição de repouso já entra na
       condição de "passou pra trás" e o carrossel dá um recuo inteiro no
       primeiro tique de rolagem, antes de qualquer gesto. */
    var FOLGA = 1;

    function recentra() {
        var banda = N * passo();
        if (!banda) return;
        if (trilha.scrollLeft < banda - FOLGA) pulaPara(trilha.scrollLeft + banda);
        else if (trilha.scrollLeft >= 2 * banda - FOLGA) pulaPara(trilha.scrollLeft - banda);
    }

    function comeco() {
        var p = passo();
        if (!p) { requestAnimationFrame(comeco); return; }
        pulaPara(N * p);
    }
    requestAnimationFrame(function () { requestAnimationFrame(comeco); });

    if (antes) antes.addEventListener('click', function () {
        trilha.scrollBy({ left: -passo(), behavior: 'smooth' });
    });
    if (depois) depois.addEventListener('click', function () {
        trilha.scrollBy({ left: passo(), behavior: 'smooth' });
    });

    /* O recuo espera a rolagem PARAR. Corrigir durante o gesto brigaria com
       a inércia do scroller e o dedo sentiria o tranco. */
    var relogio;
    trilha.addEventListener('scroll', function () {
        clearTimeout(relogio);
        relogio = setTimeout(recentra, 120);
    });

    window.addEventListener('resize', comeco);
})();

/* ══════════════════════════════════════════════════════════════════════
   Rodizio dos logos de empregadores.

   Portado do home.js. Sao vinte logos pra doze lugares, e de tempos em
   tempos um lugar troca de logo. Nao e decoracao gratuita: a grade diz
   "trabalham nestas empresas", e o rodizio e o que deixa a lista parecer
   maior do que os doze quadros que cabem na tela.

   Este e o UNICO sorteio que sobrou em JS nesta pagina, e ele fica porque
   aqui o sorteio nao e "escolher uma vez", e movimento continuo: sem
   script, nao ha o que congelar na marcacao.

   Tres cuidados que a troca exige:

     1. O proximo logo sai de uma poca com os que NAO estao em nenhum
        quadro. Sem isso a mesma marca apareceria em dois lugares.
     2. A troca so acontece quando o esmaecimento terminou E a imagem nova
        ja carregou. Trocar o `src` antes disso pisca.
     3. O quadro sorteado nunca e o mesmo da vez anterior, senao um deles
        ficaria piscando sozinho enquanto os outros nao mudam.

   O relogio para quando o bloco sai da tela: rodar rodizio pra ninguem e
   so gastar bateria.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var grade = document.getElementById('of-depos-logos-id');
    if (!grade) return;

    var quadros = Array.prototype.slice.call(grade.querySelectorAll('.of-depos-logo img'));
    if (!quadros.length) return;

    var logos = [
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-vale.webp', alt: 'Vale' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-mercedes.webp', alt: 'Mercedes-Benz' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-bradesco.webp', alt: 'Bradesco' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-santander.webp', alt: 'Santander' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-cpfl.webp', alt: 'CPFL' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-ambev.webp', alt: 'Ambev' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-magalu.webp', alt: 'Magalu' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-inter.webp', alt: 'Inter' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-google.webp', alt: 'Google' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-suzano.webp', alt: 'Suzano' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-sicoob.webp', alt: 'Sicoob' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-cbf.webp', alt: 'CBF' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-airliquide.webp', alt: 'Air Liquide' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-3m.webp', alt: '3M' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-cielo.webp', alt: 'Cielo' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-globo.webp', alt: 'Globo' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-neoway.webp', alt: 'Neoway' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-natura.webp', alt: 'Natura' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-claro.webp', alt: 'Claro' },
        { src: '/ed/infinite-pass/oferta/dependencias/empresa-piracanjuba.webp', alt: 'Piracanjuba' }
    ];

    /* Que logo esta em cada quadro. E daqui que sai a poca de candidatos. */
    var emCena = new Map();

    function embaralha(a) {
        a = a.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    /* So os quadros que a media query atual deixa visiveis: abaixo de 864 a
       grade muda de colunas, mas o numero de cards nao muda. */
    function visiveis() {
        return quadros.filter(function (img) {
            return img.closest('.of-depos-logo').offsetHeight > 0;
        });
    }

    (function primeiraCarga() {
        var ativos = visiveis();
        var sorteio = embaralha(logos).slice(0, ativos.length);
        ativos.forEach(function (img, i) {
            img.src = sorteio[i].src;
            img.alt = sorteio[i].alt;
            emCena.set(img, sorteio[i]);
        });
    })();

    var ultimo = null;

    function troca() {
        var ativos = visiveis();
        if (!ativos.length) return;

        var candidatos = ativos.length > 1
            ? ativos.filter(function (i) { return i !== ultimo; })
            : ativos;
        var img = candidatos[Math.floor(Math.random() * candidatos.length)];
        ultimo = img;

        var usados = [];
        emCena.forEach(function (l) { if (l) usados.push(l); });
        var poca = logos.filter(function (l) { return usados.indexOf(l) === -1; });
        if (!poca.length) return;
        var novo = poca[Math.floor(Math.random() * poca.length)];

        /* Marca ANTES do tempo passar: se o proximo tique sortear outro
           quadro, ele ja enxerga este logo como ocupado. */
        emCena.set(img, novo);
        img.style.opacity = '0';

        var carregou = false, esmaeceu = false;
        function fecha() {
            if (!carregou || !esmaeceu) return;
            img.src = novo.src;
            img.alt = novo.alt;
            img.style.opacity = '';
        }
        setTimeout(function () { esmaeceu = true; fecha(); }, 600);
        var pre = new Image();
        pre.onload = pre.onerror = function () { carregou = true; fecha(); };
        pre.src = novo.src;
    }

    /* `prefers-reduced-motion` vale aqui tambem: a troca e movimento, e quem
       pediu menos movimento fica com os doze primeiros parados. A saida e
       ANTES do observador: desligar depois nao adiantaria, porque ele
       religaria o relogio na primeira vez que a grade entrasse na tela. */
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var relogio = null;
    function liga() { if (!relogio) relogio = setInterval(troca, 2000); }
    function desliga() { clearInterval(relogio); relogio = null; }

    if (window.IntersectionObserver) {
        new IntersectionObserver(function (e) {
            if (e[0].isIntersecting) liga(); else desliga();
        }, { rootMargin: '128px' }).observe(grade);
    } else {
        liga();
    }
})();

/* ══════════════════════════════════════════════════════════════════════
   Visibilidade do CTA flutuante.

   A regra é uma só: a faixa aparece quando NENHUM ticket está na tela.
   Enquanto um deles aparece, ela some, porque seria a mesma oferta duas
   vezes ao mesmo tempo.

   São dois tickets, e por isso o observador conta quantos estão visíveis em
   vez de olhar um só. Com `!entrada.isIntersecting` de um ticket qualquer a
   faixa apareceria no meio da página, com o outro ticket em cena.

   `aria-hidden` acompanha a classe: escondida, ela também sai da leitura de
   tela. O `visibility: hidden` do CSS já faria isso, mas o atributo deixa a
   intenção escrita e não depende de o estilo ter carregado.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var faixa = document.getElementById('of-rodape-cta');
    var tickets = document.querySelectorAll('.of-ticket');
    if (!faixa || !tickets.length) return;

    /* Sem IntersectionObserver a faixa simplesmente não aparece, que é o
       estado padrão dela. Melhor isso do que deixá-la fixa na tela o tempo
       todo, cobrindo o conteúdo. */
    if (!window.IntersectionObserver) return;

    /* O estado é um CONJUNTO de quem está em cena, e não um contador.

       Contador não serve: o observador dispara uma vez por elemento logo no
       registro, inclusive pros que já estão fora da tela, e cada um desses
       decrementava a partir do zero. O saldo ia pra negativo, era travado em
       zero, e a faixa aparecia com o ticket do topo bem na frente. Guardando
       quem está visível, a ordem e a repetição dos disparos param de
       importar. */
    var emCena = new Set();

    function pinta() {
        var mostrar = emCena.size === 0;
        faixa.classList.toggle('is-visivel', mostrar);
        faixa.setAttribute('aria-hidden', mostrar ? 'false' : 'true');
    }

    var olho = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            if (e.isIntersecting) emCena.add(e.target);
            else emCena.delete(e.target);
        });
        pinta();
    });

    Array.prototype.forEach.call(tickets, function (t) { olho.observe(t); });
})();

/* ══════════════════════════════════════════════════════════════════════
   Animacao so quando o bloco esta em cena.

   Um observador so, pros blocos que animam sozinhos o tempo todo: o foil
   dos dois tickets e as esteiras (a da comunidade, a dos selos, e as copias
   que o carrossel faz de cada uma). Fora da tela eles ganham `.of-parado` e
   congelam.

   Por que centralizar: cada bloco desses ja nasceu com o seu proprio
   IntersectionObserver ou com nenhum, e a regra "pausa quando sai" e a
   mesma pra todos. Espalhada, ela some no bloco seguinte que alguem
   acrescentar, que foi o que aconteceu com as esteiras.

   A margem de 128px liga o bloco um pouco antes de ele aparecer: pausado
   ate o ultimo pixel, a esteira entraria na tela parada por um quadro.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    if (!window.IntersectionObserver) return;

    var blocos = document.querySelectorAll(
        '.of-ticket, .of-card-midia--esteira, .of-card-midia--selos');
    if (!blocos.length) return;

    var olho = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            e.target.classList.toggle('of-parado', !e.isIntersecting);
        });
    }, { rootMargin: '128px' });

    Array.prototype.forEach.call(blocos, function (b) { olho.observe(b); });
})();
