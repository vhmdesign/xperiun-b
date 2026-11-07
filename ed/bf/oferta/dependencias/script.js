/* ══════════════════════════════════════════════════════════════════════
   /ed/bf/oferta/dependencias/script.js

   Script da oferta da Black Friday, portado da oferta do Infinite Pass
   (/ed/infinite-pass/oferta/). Saíram o relógio dos lotes, o toggle de
   perfil, o slider de anos e a tabela de preços: aqui há uma oferta só,
   com os valores fixos no HTML. O indicador do lote virou a barra de
   vagas. O resto (pastas, carrosséis, FAQ, depoimentos, logos e o
   CTA flutuante) veio sem mudança de comportamento.

   O foil holográfico que a origem desenhava por cima do ticket saiu:
   dez polígonos girando em `mix-blend-mode: screen`, duas camadas por
   ticket e dois tickets na página deixavam a rolagem travada em vários
   aparelhos. No lugar dele há o mesmo leque de cores num degradê cônico
   girando em CSS (ver o style.css); daqui ele só precisa da medida do
   centro e do observador que o pausa fora da tela, no fim do arquivo.
   ══════════════════════════════════════════════════════════════════════ */

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
        /* A resposta 3 tem duas versões (com e sem o +1 ano bônus); vale a
           da fase atual, a que o CSS não esconderia. */
        var semBonus = document.documentElement.classList.contains('bf-sem-bonus');
        var fonte = null;
        Array.prototype.some.call(document.querySelectorAll('.of-faq-fonte [data-faq="' + chip.dataset.faq + '"]'), function (el) {
            if (el.classList.contains(semBonus ? 'so-com-bonus' : 'so-sem-bonus')) return false;
            fonte = el;
            return true;
        });
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
   Popup do form.

   Todo botão de compra da página leva `data-abre-form` (o do hero, os
   canhotos dos dois tickets e o do CTA fixo) e abre o mesmo popup, o
   form-bf-oferta.html, carregado pelo form-include.js. Um ouvinte só, no
   documento, em vez de um por botão: cobre também os botões que ainda
   forem criados, sem ninguém lembrar de ligar.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    document.addEventListener('click', function (ev) {
        if (!ev.target.closest('[data-abre-form]')) return;
        ev.preventDefault();
        if (window.openPopup) window.openPopup('popup-form-bf-oferta');
    });
})();

/* ══════════════════════════════════════════════════════════════════════
   Timer de antes da abertura, e a tag do modo de teste.

   O relógio da página (window.XpOferta.agora) e a decisão "timer ou
   oferta" moram num script curto no <head> do index.html, porque precisam
   estar prontos antes do primeiro paint. Ele aceita o teste pela URL,
   sempre no horário de Brasília:

     ?agora=2026-11-05T20:00   antes da abertura: só o timer
     ?agora=2026-11-10T12:00   depois: a oferta, como no dia 10
     ?agora=2026-11-14         só a data vale 00:00

   O teste é um DESVIO, não um congelamento: o relógio segue andando a
   partir do instante pedido, então a barra se move e o timer conta.

   Este bloco faz três coisas:
     1. com o parâmetro, põe uma tag fixa no canto dizendo o instante
        simulado, pra um print de teste nunca passar pela página real;
     2. antes da abertura, faz o timer contar;
     3. na hora da abertura, RECARREGA a página. Trocar só a classe do
        <html> mostraria a oferta, mas os carrosséis e o brilho do ticket
        medem as caixas na carga, e caixas que estavam escondidas medem
        zero. Recarregando, tudo mede do jeito certo. No teste, a recarga
        leva o ?agora= pro instante da abertura, senão o relógio voltaria
        ao instante pedido e o timer recomeçaria em loop.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    /* Rede, caso o script do <head> não tenha rodado: relógio de verdade. */
    if (!window.XpOferta || !window.XpOferta.agora) {
        window.XpOferta = {
            ABERTURA: Date.parse('2026-11-06T08:00:00-03:00'),
            simulado: null,
            agora: function () { return Date.now(); }
        };
    }
    var X = window.XpOferta;

    /* ── 1. tag do teste ── */
    if (X.simulado !== null) {
        var legivel = new Date(X.simulado).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        console.info('[oferta] simulando ' + legivel + ' (Brasília)');
        var aviso = document.createElement('span');
        aviso.className = 'tag-status of-teste-agora';
        aviso.setAttribute('data-size', 's');
        aviso.setAttribute('data-semantic', 'error');
        aviso.textContent = 'Teste: ' + legivel + ' (Brasília)';
        document.body.appendChild(aviso);
    } else if (X.pedido) {
        console.warn('[oferta] ?agora= inválido: "' + X.pedido +
            '". Use 2026-11-10T12:00 ou 2026-11-10.');
    }

    /* ── 2 e 3. timer e abertura ── */
    if (!document.documentElement.classList.contains('bf-antes')) return;
    var timer = document.querySelector('[data-alvo-espera]');
    if (!timer) return;
    var campos = {};
    Array.prototype.forEach.call(timer.querySelectorAll('[data-un]'), function (el) {
        campos[el.dataset.un] = el;
    });
    function dois(n) { return (n < 10 ? '0' : '') + n; }

    function abre() {
        if (X.simulado !== null) {
            var url = new URL(location.href);
            url.searchParams.set('agora', '2026-11-06T08:00');
            location.replace(url.toString());
        } else {
            location.reload();
        }
    }

    var relogio = null;
    function tique() {
        var falta = X.ABERTURA - X.agora();
        if (falta <= 0) { clearInterval(relogio); abre(); return; }
        var s = Math.floor(falta / 1000);
        if (campos.d) campos.d.textContent = dois(Math.floor(s / 86400));
        if (campos.h) campos.h.textContent = dois(Math.floor((s % 86400) / 3600));
        if (campos.m) campos.m.textContent = dois(Math.floor((s % 3600) / 60));
        if (campos.s) campos.s.textContent = dois(s % 60);
    }
    tique();
    relogio = setInterval(tique, 1000);
})();

/* ══════════════════════════════════════════════════════════════════════
   A barra de vagas, e a tag do hero que muda junto.

   No lugar do indicador do lote da oferta do Infinite Pass. É uma barra
   de efeito, não um contador de vendas: ela não lê estoque de lugar
   nenhum. Mesmo assim ela não é sorteada: a porcentagem sai do RELÓGIO,
   então todo mundo que abre a página no mesmo instante vê o mesmo número.

   O cronograma é a tabela FASES logo abaixo, e é o ÚNICO lugar com esses
   números (os três blocos `[data-vagas]` da página, os dois tickets e o
   CTA fixo, só dizem onde escrever). Todos os horários são de Brasília,
   com o -03:00 escrito no próprio carimbo, pra a conta não depender do
   fuso de quem visita:

     06/11 08:00 a 06/11 23:59   de 56% a 97%   (a abertura: o timer
                                                termina às 08:00)
     07/11 00:00 a 09/11 23:59   de 56% a 97%
     10/11 00:00 a 23/11 23:59   de 56% a 99%   (sem o +1 ano bônus)

   Dentro de cada fase a subida é LINEAR: o mesmo tanto por hora, do
   começo ao fim. A origem usava 1-(1-t)^2, que sobe rápido no começo e
   afrouxa no fim, e aqui isso fazia a barra disparar nas primeiras horas
   de cada fase. Na virada de uma fase pra
   outra a barra RECUA (97 -> 56), que é o pedido: é a "nova leva" de
   vagas abrindo. Fora das fases ela segura o último valor conhecido:
   antes da abertura, o começo da primeira; entre o fim de uma fase e o
   início da outra (o último minuto do dia), o fim da que acabou; depois
   da última, os 99.

   O texto é TRUNCADO, não arredondado, e nunca passa de 99: anunciar
   "100% das vagas" com o botão de compra funcionando seria uma mentira
   que a própria página desmentiria no clique seguinte.

   A planilha temp/vagas-bf.xlsx (no Compartilhado, fora do que publica)
   faz exatamente a mesma conta, em fórmulas; se a tabela daqui mudar, a
   aba de premissas dela precisa mudar junto.

   O intervalo é de 1s, mas cada tique RECALCULA a partir do relógio, em
   vez de somar um passo: voltar pra aba depois de um tempo mostra o
   número certo.

   Pra testar qualquer dia e hora: ?agora=2026-11-10T12:00 na URL (ver o
   script do <head> do index.html e o bloco do timer, logo acima).
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var FASES = [
        { inicio: '2026-11-06T08:00:00-03:00', fim: '2026-11-06T23:59:00-03:00', de: 56, ate: 97 },
        { inicio: '2026-11-07T00:00:00-03:00', fim: '2026-11-09T23:59:00-03:00', de: 56, ate: 97 },
        { inicio: '2026-11-10T00:00:00-03:00', fim: '2026-11-23T23:59:00-03:00', de: 56, ate: 99 }
    ].map(function (f) {
        return { inicio: Date.parse(f.inicio), fim: Date.parse(f.fim), de: f.de, ate: f.ate };
    });

    /* Quando o "Somente hoje" do hero vira "Últimas vagas": o fim do dia 6,
       ou seja, o começo da segunda fase. */
    var VIRADA_TAG = FASES[1].inicio;

    /* Fim do +1 ano bônus: o começo da fase 3. O script do <head> já põe
       .bf-sem-bonus na carga; aqui é pra quem está com a página aberta na
       virada. */
    var FIM_BONUS = (window.XpOferta && window.XpOferta.FIM_BONUS) || FASES[2].inicio;
    var FIM_OFERTA = (window.XpOferta && window.XpOferta.FIM_OFERTA) || Date.parse('2026-11-24T00:00:00-03:00');

    /* Quanto a curva desacelera. 1 é linear (o que vale aqui); 2 seria o
       ease-out quadrático da origem, que sobe rápido demais no começo. */
    var DESACELERACAO = 1;
    var TETO = 99;

    function porcentagem(agora) {
        if (agora < FASES[0].inicio) return FASES[0].de;
        for (var i = FASES.length - 1; i >= 0; i--) {
            var f = FASES[i];
            if (agora < f.inicio) continue;
            if (agora >= f.fim) return f.ate;
            var t = (agora - f.inicio) / (f.fim - f.inicio);
            return f.de + (f.ate - f.de) * (1 - Math.pow(1 - t, DESACELERACAO));
        }
        return FASES[0].de;
    }

    var blocos = document.querySelectorAll('[data-vagas]');
    var tag = document.querySelector('.bf-hero-data time[data-depois]');
    if (!blocos.length && !tag) return;

    function pinta() {
        /* As horas vêm do relógio da página, que aceita o ?agora= de
           teste (ver o bloco acima). */
        var agora = window.XpOferta && window.XpOferta.agora ? window.XpOferta.agora() : Date.now();
        var pct = Math.min(TETO, porcentagem(agora));
        var mostra = Math.floor(pct);

        Array.prototype.forEach.call(blocos, function (bloco) {
            var texto = bloco.querySelector('.of-vagas-texto');
            /* No CTA fixo a frase é partida em duas peças, pra o número
               ganhar a cor da oferta: lá o script escreve só o número, e o
               "das vagas" mora no HTML. */
            var num = bloco.querySelector('.of-vagas-num');
            var barra = bloco.querySelector('.of-vagas-barra');
            var trilho = bloco.querySelector('.of-vagas-trilho');

            if (texto) texto.textContent = mostra + '% das vagas preenchidas';
            if (num) num.textContent = mostra + '%';
            if (barra) barra.style.width = pct.toFixed(2) + '%';
            /* O valor também vai pro ARIA: a barra é um progressbar de
               verdade, e sem isto ela anunciaria para sempre o número que
               está escrito no HTML. */
            if (trilho) trilho.setAttribute('aria-valuenow', mostra);
        });

        /* A tag troca de texto uma vez só, na virada; o texto de depois
           mora no atributo, e o de antes no próprio HTML. */
        if (tag && agora >= VIRADA_TAG && tag.textContent !== tag.dataset.depois) {
            tag.textContent = tag.dataset.depois;
        }

        if (agora >= FIM_BONUS && !document.documentElement.classList.contains('bf-sem-bonus')) {
            document.documentElement.classList.add('bf-sem-bonus');
        }

        /* Fim da oferta, pra quem está com a página aberta na virada: o
           <head> já faz isto na carga. */
        if (agora >= FIM_OFERTA && !document.documentElement.classList.contains('bf-encerrada')) {
            document.documentElement.classList.add('bf-encerrada');
            window.scrollTo(0, 0);
        }
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
        '/ed/bf/oferta/dependencias/depoimento-claudio.webp',
        '/ed/bf/oferta/dependencias/depoimento-cleiton.webp',
        '/ed/bf/oferta/dependencias/depoimento-daniel.webp',
        '/ed/bf/oferta/dependencias/depoimento-edson.webp',
        '/ed/bf/oferta/dependencias/depoimento-eduardo.webp',
        '/ed/bf/oferta/dependencias/depoimento-ezequiel.webp',
        '/ed/bf/oferta/dependencias/depoimento-gabriel.webp',
        '/ed/bf/oferta/dependencias/depoimento-louiz.webp',
        '/ed/bf/oferta/dependencias/depoimento-pedro.webp',
        '/ed/bf/oferta/dependencias/depoimento-vinicius.webp',
        '/ed/bf/oferta/dependencias/depoimento-vitoria.webp'
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
        { src: '/ed/bf/oferta/dependencias/empresa-vale.webp', alt: 'Vale' },
        { src: '/ed/bf/oferta/dependencias/empresa-mercedes.webp', alt: 'Mercedes-Benz' },
        { src: '/ed/bf/oferta/dependencias/empresa-bradesco.webp', alt: 'Bradesco' },
        { src: '/ed/bf/oferta/dependencias/empresa-santander.webp', alt: 'Santander' },
        { src: '/ed/bf/oferta/dependencias/empresa-cpfl.webp', alt: 'CPFL' },
        { src: '/ed/bf/oferta/dependencias/empresa-ambev.webp', alt: 'Ambev' },
        { src: '/ed/bf/oferta/dependencias/empresa-magalu.webp', alt: 'Magalu' },
        { src: '/ed/bf/oferta/dependencias/empresa-inter.webp', alt: 'Inter' },
        { src: '/ed/bf/oferta/dependencias/empresa-google.webp', alt: 'Google' },
        { src: '/ed/bf/oferta/dependencias/empresa-suzano.webp', alt: 'Suzano' },
        { src: '/ed/bf/oferta/dependencias/empresa-sicoob.webp', alt: 'Sicoob' },
        { src: '/ed/bf/oferta/dependencias/empresa-cbf.webp', alt: 'CBF' },
        { src: '/ed/bf/oferta/dependencias/empresa-airliquide.webp', alt: 'Air Liquide' },
        { src: '/ed/bf/oferta/dependencias/empresa-3m.webp', alt: '3M' },
        { src: '/ed/bf/oferta/dependencias/empresa-cielo.webp', alt: 'Cielo' },
        { src: '/ed/bf/oferta/dependencias/empresa-globo.webp', alt: 'Globo' },
        { src: '/ed/bf/oferta/dependencias/empresa-neoway.webp', alt: 'Neoway' },
        { src: '/ed/bf/oferta/dependencias/empresa-natura.webp', alt: 'Natura' },
        { src: '/ed/bf/oferta/dependencias/empresa-claro.webp', alt: 'Claro' },
        { src: '/ed/bf/oferta/dependencias/empresa-piracanjuba.webp', alt: 'Piracanjuba' }
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

    var faixa = document.getElementById('bf-rodape-cta');
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
   Centro do brilho do ticket.

   O brilho é CSS puro (um degradê cônico girando em `transform`, ver o
   style.css). Este bloco só diz a ele ONDE fica o centro: o do ticket
   inteiro, e não o de cada metade, pra o card e o canhoto mostrarem
   fatias da mesma folha, como o foil da origem fazia.

   Pra cada metade ele escreve duas variáveis:
     --of-brilho-cy  a distância do topo da metade até o centro do ticket
     --of-brilho-d   o diâmetro que cobre o ticket inteiro girando

   É medida, não animação: roda na carga e de novo só quando o ticket muda
   de tamanho (ResizeObserver), nunca a cada quadro.

   E o giro pelo mouse, como na origem: o ângulo sai da distância do
   cursor até o centro do ticket (a mesma conta de lá, soma das distâncias
   dividida por 1,5) e vai pra --of-brilho-giro, que o CSS aplica no
   `rotate` do leque. Um `requestAnimationFrame` junta os movimentos, então
   é no máximo uma escrita por quadro; saindo, o ângulo volta a zero.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var tickets = document.querySelectorAll('.of-ticket-fx');
    if (!tickets.length) return;

    function mede(fx) {
        var metades = fx.querySelectorAll('.of-lateral-card, .of-lateral-stub');
        var r = fx.getBoundingClientRect();
        var centro = r.top + r.height / 2;
        /* A diagonal da caixa, com folga: girando 10 graus, o quadrado do
           leque não pode deixar um canto do ticket descoberto. */
        var d = Math.ceil(Math.sqrt(r.width * r.width + r.height * r.height) * 1.1);
        Array.prototype.forEach.call(metades, function (m) {
            m.style.setProperty('--of-brilho-cy', (centro - m.getBoundingClientRect().top) + 'px');
            m.style.setProperty('--of-brilho-d', d + 'px');
        });
    }

    var semMovimento = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function giroPeloMouse(fx) {
        var host = fx.closest('.of-ticket') || fx;
        var pendente = null;
        host.addEventListener('mousemove', function (e) {
            var cx = e.clientX, cy = e.clientY;
            if (pendente) return;
            pendente = requestAnimationFrame(function () {
                pendente = null;
                var r = host.getBoundingClientRect();
                var giro = (Math.abs((r.left + r.right) / 2 - cx) +
                            Math.abs((r.top + r.bottom) / 2 - cy)) / 1.5;
                /* Na variável do -fx, e não em cada metade: as duas herdam
                   dele, então é uma escrita só pros dois leques. */
                fx.style.setProperty('--of-brilho-giro', giro.toFixed(1) + 'deg');
            });
        });
        host.addEventListener('mouseleave', function () {
            if (pendente) { cancelAnimationFrame(pendente); pendente = null; }
            fx.style.setProperty('--of-brilho-giro', '0deg');
        });
    }

    Array.prototype.forEach.call(tickets, function (fx) {
        mede(fx);
        if ('ResizeObserver' in window) {
            new ResizeObserver(function () { mede(fx); }).observe(fx);
        }
        if (!semMovimento) giroPeloMouse(fx);
    });
    if (!('ResizeObserver' in window)) {
        window.addEventListener('resize', function () {
            Array.prototype.forEach.call(tickets, mede);
        });
    }
})();

/* ══════════════════════════════════════════════════════════════════════
   Animacao so quando o bloco esta em cena.

   Um observador so, pros blocos que animam sozinhos o tempo todo: o brilho
   dos dois tickets, as faixas do hero e as esteiras (a da comunidade, a dos selos, e as
   copias que o carrossel faz de cada uma). Fora da tela eles ganham
   `.of-parado` e congelam.

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
        '.of-ticket, .bf-faixas, .of-card-midia--esteira, .of-card-midia--selos');
    if (!blocos.length) return;

    var olho = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            e.target.classList.toggle('of-parado', !e.isIntersecting);
        });
    }, { rootMargin: '128px' });

    Array.prototype.forEach.call(blocos, function (b) { olho.observe(b); });
})();

/* ══════════════════════════════════════════════════════════════════════
   PLAYER DO VÍDEO (acima do FAQ)

   A página só tem a capa. No primeiro clique entra a IFrame API do
   YouTube, com todos os controles nativos desligados, e quem manda são os
   botões daqui: tocar/pausar, linha do tempo, som e tela cheia. O iframe
   não recebe clique nenhum (o escudo do CSS fica por cima), então não há
   caminho de dentro do player para o youtube.com.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    var caixa = document.querySelector('.of-video[data-yt]');
    if (!caixa) return;

    var vid = caixa.dataset.yt;
    var capa = caixa.querySelector('.of-video-capa');
    var escudo = caixa.querySelector('.of-video-escudo');
    var controles = caixa.querySelector('.of-video-controles');
    var btnTocar = caixa.querySelector('[data-acao="tocar"]');
    var btnSom = caixa.querySelector('[data-acao="som"]');
    var btnTela = caixa.querySelector('[data-acao="tela"]');
    var barra = caixa.querySelector('.of-video-barra');
    var tAtual = caixa.querySelector('[data-tempo-atual]');
    var tTotal = caixa.querySelector('[data-tempo-total]');

    var player = null;
    var pronto = false;
    var arrastando = false;
    var relogio = null;

    var temTelaCheia = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
    if (!temTelaCheia) caixa.classList.add('sem-tela-cheia');

    function mmss(s) {
        s = Math.max(0, Math.floor(s || 0));
        var m = Math.floor(s / 60), r = s % 60;
        return m + ':' + (r < 10 ? '0' : '') + r;
    }

    function pintaBarra() {
        if (!pronto || arrastando) return;
        var dur = player.getDuration() || 0;
        var cur = player.getCurrentTime() || 0;
        var v = dur ? Math.round(cur / dur * 1000) : 0;
        barra.value = v;
        barra.style.setProperty('--p', v / 1000);
        tAtual.textContent = mmss(cur);
        tTotal.textContent = mmss(dur);
    }

    function marcaTocando(sim) {
        caixa.classList.toggle('is-tocando', sim);
        btnTocar.setAttribute('aria-label', sim ? 'Pausar' : 'Tocar');
        clearInterval(relogio);
        if (sim) relogio = setInterval(pintaBarra, 250);
        pintaBarra();
    }

    function marcaSom() {
        var mudo = player.isMuted();
        caixa.classList.toggle('is-mudo', mudo);
        btnSom.setAttribute('aria-label', mudo ? 'Ligar o som' : 'Tirar o som');
    }

    function alterna() {
        if (!pronto) return;
        if (player.getPlayerState() === 1) player.pauseVideo();
        else player.playVideo();
    }

    function aoMudarEstado(e) {
        var s = e.data;
        if (s === 1) {               /* tocando */
            capa.hidden = true;
            marcaTocando(true);
        } else if (s === 0) {        /* acabou: a capa volta, e o clique recomeça */
            marcaTocando(false);
            player.seekTo(0, true);
            player.pauseVideo();
            capa.hidden = false;
            controles.hidden = true;
        } else if (s === 2) {        /* pausado */
            marcaTocando(false);
        }
    }

    function carregaApi(pronta) {
        if (window.YT && window.YT.Player) return pronta();
        var anterior = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
            if (typeof anterior === 'function') anterior();
            pronta();
        };
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            var s = document.createElement('script');
            s.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(s);
        }
    }

    function monta() {
        carregaApi(function () {
            player = new YT.Player(caixa.querySelector('.of-video-player'), {
                host: 'https://www.youtube-nocookie.com',
                videoId: vid,
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    rel: 0,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    playsinline: 1,
                    cc_load_policy: 0,
                    origin: location.origin
                },
                events: {
                    onReady: function () {
                        pronto = true;
                        var f = player.getIframe();
                        f.setAttribute('tabindex', '-1');
                        f.setAttribute('title', 'Vídeo da Black Friday');
                        controles.hidden = false;
                        marcaSom();
                        player.playVideo();
                        pintaBarra();
                    },
                    onStateChange: aoMudarEstado
                }
            });
        });
    }

    /* `montando` trava o segundo toque enquanto a API ainda carrega (rede
       lenta no celular): sem isso nasciam dois players no mesmo nó. Se o
       navegador barrar o autoplay (iOS), a capa continua na tela e o próximo
       toque cai no playVideo() abaixo, já dentro do gesto do usuário. */
    var montando = false;
    capa.addEventListener('click', function () {
        if (!player) {
            if (montando) return;
            montando = true;
            monta();
            return;
        }
        if (pronto) {
            controles.hidden = false;
            player.playVideo();
        }
    });

    escudo.addEventListener('click', alterna);
    btnTocar.addEventListener('click', alterna);

    btnSom.addEventListener('click', function () {
        if (!pronto) return;
        if (player.isMuted()) player.unMute(); else player.mute();
        setTimeout(marcaSom, 50);
    });

    barra.addEventListener('input', function () {
        arrastando = true;
        barra.style.setProperty('--p', barra.value / 1000);
        if (pronto) tAtual.textContent = mmss(barra.value / 1000 * player.getDuration());
    });
    barra.addEventListener('change', function () {
        arrastando = false;
        if (!pronto) return;
        player.seekTo(barra.value / 1000 * player.getDuration(), true);
    });

    function emTelaCheia() {
        return (document.fullscreenElement || document.webkitFullscreenElement) === caixa;
    }
    btnTela.addEventListener('click', function () {
        if (emTelaCheia()) {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
            (caixa.requestFullscreen || caixa.webkitRequestFullscreen).call(caixa);
        }
    });
    function marcaTela() {
        var sim = emTelaCheia();
        caixa.classList.toggle('is-cheia', sim);
        btnTela.setAttribute('aria-label', sim ? 'Sair da tela cheia' : 'Tela cheia');
    }
    document.addEventListener('fullscreenchange', marcaTela);
    document.addEventListener('webkitfullscreenchange', marcaTela);
})();
