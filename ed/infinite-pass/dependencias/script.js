/* ══════════════════════════════════════════════════════════════════════
   /ed/infinite-pass/dependencias/script.js

   Coreografias da página. Blocos independentes, cada um sai em silêncio
   se o seu elemento não existir:

     0. entrada do hero no carregamento
     1. saída do hero (lockup letra a letra, vídeo e chamada)
     2. entrada das falas do "Imagine"
     3. fundos decorativos e entrada do card do fechamento
     4. faixas de capas, entrada e sweep da timeline
     5. barra de CTA fixa

   Regra de blur do projeto: nada de blur ANIMADO abaixo de 864px. Quem
   decide é o `semBlur()` abaixo, consultado em cada frame, porque o
   leitor pode girar o aparelho no meio da página.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    function trava(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function lerp(a, b, t) { return a + (b - a) * t; }

    var reduz = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Abaixo de 864 o blur animado sai e sobra opacidade mais
       deslocamento, que é a regra do projeto. */
    var mqSemBlur = window.matchMedia
        ? window.matchMedia('(max-width: 864px)') : null;
    function semBlur() { return !mqSemBlur || mqSemBlur.matches; }

    /* ── 0. Entrada do hero, no carregamento ──────────────────────────
       Tudo que está no hero entra em cascata assim que a página abre: o
       vídeo atrás, o lockup letra a letra (da esquerda pra direita, na
       mesma ordem em que ele DEPOIS sai no scroll) e os blocos da chamada
       um a um.

       O estado ESCONDIDO não é escrito aqui: vem do CSS, sob a classe
       .ip-anima que um script inline do <head> liga antes do primeiro
       paint. Este bloco só REVELA. Foi assim que o flash de meio segundo
       ("aparece, some, entra") sumiu.

       Roda antes da coreografia de saída (bloco 1) de propósito: aquela
       escreve opacity/transform/filter a cada frame de scroll e venceria
       qualquer coisa daqui. Como as duas disputam as mesmas
       propriedades, a saída só assume quando a entrada termina, e quem
       faz essa passagem de bastão é o `window.ipHeroEntrou`. ── */
    (function entradaDoHero() {
        window.ipHeroEntrou = false;

        var raiz = document.documentElement;
        var tit = document.querySelector('.ip-titulo');
        var vid = document.querySelector('.ip-video');
        var cta = document.querySelector('.ip-cta');

        function encerra() {
            raiz.classList.remove('ip-anima');
            window.ipHeroEntrou = true;
        }

        if (reduz || !raiz.classList.contains('ip-anima')) { encerra(); return; }

        var DUR = 700;
        var PASSO = 90;    /* atraso entre um bloco da chamada e o próximo */
        var LETRA = 40;    /* atraso entre uma letra e a próxima */
        var BLUR = 8;

        /* O indicador de scroll não entra aqui à parte: ele vive dentro da
           .ip-assinatura-linha, que já é filha da .ip-cta. Concatenar de
           novo colocaria o mesmo elemento duas vezes na cascata. */
        var blocos = cta ? [].slice.call(cta.children) : [];

        function revela(el) {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            el.style.filter = 'none';
        }
        function prepara(el, dur) {
            el.style.transition = 'opacity ' + dur + 'ms ease-out, '
                + 'transform ' + dur + 'ms ease-out, filter ' + dur + 'ms ease-out';
            el.style.willChange = 'opacity, transform, filter';
        }

        function entra() {
            var letras = tit ? [].slice.call(tit.querySelectorAll('.ip-letra')) : [];

            if (vid) {
                vid.style.transition = 'opacity 1200ms ease-out';
                vid.style.opacity = '1';
            }

            /* O lockup: o h1 abre de uma vez e cada letra sobe no seu
               tempo. As letras nascem sem estado escondido (elas são
               criadas pelo bloco 1, depois do CSS), então ele é posto
               aqui mesmo, e num frame separado do revelar pra a
               transição ter de onde partir. */
            letras.forEach(function (l) {
                l.style.opacity = '0';
                l.style.transform = 'translateY(32px)';
                if (!semBlur()) l.style.filter = 'blur(' + BLUR + 'px)';
            });
            if (tit) tit.style.opacity = '1';

            requestAnimationFrame(function () {
                letras.forEach(function (l, i) {
                    prepara(l, DUR);
                    setTimeout(function () { revela(l); }, i * LETRA);
                });
            });

            var fimLetras = letras.length * LETRA + DUR;
            var atrasoBlocos = letras.length ? fimLetras * 0.45 : 0;

            blocos.forEach(function (el, i) {
                prepara(el, DUR);
                setTimeout(function () { revela(el); }, atrasoBlocos + i * PASSO);
            });

            var total = Math.max(fimLetras, atrasoBlocos + blocos.length * PASSO + DUR);
            setTimeout(function () {
                /* devolve o controle: limpa a transition pra a saída no
                   scroll escrever direto, sem interpolação atravessada */
                letras.forEach(function (l) {
                    l.style.transition = '';
                    l.style.willChange = 'transform, opacity, filter';
                });
                blocos.forEach(function (el) {
                    el.style.transition = '';
                    el.style.willChange = '';
                });
                encerra();
            }, total + 100);
        }

        /* espera o layout assentar (o bloco 1 já quebrou o lockup em
           letras neste ponto) antes de disparar */
        requestAnimationFrame(function () { requestAnimationFrame(entra); });
    })();

    /* ── 1. Saída do hero ─────────────────────────────────────────────
       Modelo medido na origem: a saída inteira dura meia tela; cada letra
       leva 0.6 desse trecho pra sumir e os inícios se espalham dentro dos
       0.4 iniciais. INFINITE apaga da primeira letra pra última; PASS faz
       o contrário. A chamada só começa a sair depois que o lockup já se
       foi, senão o leitor não tem tempo de ler.

       O split em letras acontece aqui, e não no HTML, pra que a página
       sem JS mantenha o texto inteiro. O h1 ganha aria-label e as letras
       saem da árvore de acessibilidade, senão o leitor de tela soletraria
       "I-N-F-I-N-I-T-E". ── */
    (function saidaDoHero() {
        var sec = document.querySelector('.ip-hero');
        var tit = document.querySelector('.ip-titulo');
        var vid = document.querySelector('.ip-video');
        var cta = document.querySelector('.ip-cta');
        if (!sec || !tit) return;

        var linhas = [].slice.call(tit.querySelectorAll('.ip-titulo-linha'));
        if (!linhas.length) return;

        tit.setAttribute('aria-label', linhas.map(function (l) {
            return l.textContent.trim();
        }).join(' '));

        var grupos = linhas.map(function (linha) {
            var texto = linha.textContent;
            linha.textContent = '';
            linha.setAttribute('aria-hidden', 'true');
            return texto.split('').map(function (ch) {
                var sp = document.createElement('span');
                sp.className = 'ip-letra';
                sp.textContent = ch;
                linha.appendChild(sp);
                return sp;
            });
        });

        if (reduz) return;

        var CURSO  = 0.50;   /* fração da viewport que a saída ocupa */
        var ESPERA = 0.15;   /* scroll parado antes da chamada começar a sair */
        var SAIDA  = 0.45;   /* e quanto ela leva pra sumir */
        var JANELA = 0.60;   /* duração do fade de uma letra */
        var LEQUE  = 0.40;   /* espalhamento dos inícios */
        var BLUR_LETRA = 4;  /* px, no fim da saída de cada letra */
        var BLUR_VIDEO = 8;  /* px, no fim da saída do vídeo */

        var pedido = false;
        function pinta() {
            pedido = false;
            /* passagem de bastão: enquanto a entrada roda, ela é dona das
               mesmas propriedades. Sem isto a saída sobrescreveria a
               entrada já no primeiro frame. */
            if (!window.ipHeroEntrou) return;
            var vh = window.innerHeight;
            var passou = -sec.getBoundingClientRect().top;   /* px já subidos */
            var p = trava(passou / (vh * CURSO));
            /* regra do projeto: nada de blur ANIMADO abaixo de 864, então
               nesse tier a saída fica só em opacidade e deslocamento */
            var borrar = !semBlur();

            grupos.forEach(function (letras, iLinha) {
                var n = letras.length - 1 || 1;
                letras.forEach(function (letra, i) {
                    /* linha 0 (INFINITE) começa pela esquerda,
                       linha 1 (PASS) pela direita */
                    var ordem = iLinha === 0 ? i : n - i;
                    var inicio = (ordem / n) * LEQUE;
                    var q = trava((p - inicio) / JANELA);
                    letra.style.opacity = String(1 - q);
                    letra.style.transform = 'translateY(' + (64 * q) + 'px)';
                    letra.style.filter = borrar ? 'blur(' + (BLUR_LETRA * q) + 'px)' : 'none';
                });
            });

            /* A chamada esmaece SO em opacidade, como na referencia: la o
               que sai de cena e o hero inteiro, com
               `hero.style.opacity = 1 - progresso` e nenhum transform. O
               deslocamento de 128px pra esquerda que estava aqui era gesto
               do /ed/pre-vitalicio/, nao desta pagina.

               A janela continua sendo propria: a chamada so comeca a sair
               depois que o lockup ja se foi, senao o leitor nao tem tempo
               de ler. */
            var pc = trava((passou - vh * ESPERA) / (vh * SAIDA));
            if (cta) {
                cta.style.opacity = String(1 - pc);
                cta.style.pointerEvents = pc > 0.5 ? 'none' : 'auto';
            }

            /* O vídeo desce, cresce e desfoca enquanto some. */
            if (vid) {
                vid.style.opacity = String(1 - p);
                vid.style.transform = 'translate(-50%, -50%) translateY('
                    + (256 * p) + 'px) scale(' + (1 + 0.5 * p) + ')';
                vid.style.filter = borrar ? 'blur(' + (BLUR_VIDEO * p) + 'px)' : 'none';
            }
        }
        function agenda() {
            if (pedido) return;
            pedido = true;
            requestAnimationFrame(pinta);
        }

        pinta();
        window.addEventListener('scroll', agenda, { passive: true });
        window.addEventListener('resize', agenda);
    })();

    /* ── 2. Entrada das falas do "Imagine" ────────────────────────────
       Cada fala aparece quando a borda de baixo dela cruza 75% da tela, a
       mesma âncora da origem, e volta a sumir se o leitor subir. A zona
       morta de 1% da viewport evita o piscar quando o scroll para em cima
       do limite.

       O estado escondido é escrito AQUI, não no CSS: assim a página sem
       JS mostra tudo em vez de nascer invisível. ── */
    (function entradaDasFalas() {
        var falas = [].slice.call(document.querySelectorAll('.ip-frase'));
        if (!falas.length) return;

        if (reduz) return;

        var ANCORA = 0.75;
        var MORTA_PCT = 0.01;
        var MORTA_MIN = 4;

        /* Sem blur nenhum, em largura nenhuma: aqui a entrada e so
           opacidade mais um deslocamento curto, numa janela longa o
           bastante pra parecer deslize e nao piscada. */
        var estados = falas.map(function (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(24px)';
            el.style.transition = 'opacity 600ms ease-out, '
                + 'transform 600ms ease-out';
            el.style.willChange = 'opacity, transform';
            return { el: el, ativo: false };
        });

        var pedido = false;
        function pinta() {
            pedido = false;
            var vh = window.innerHeight;
            var ancora = ANCORA * vh;
            var morta = Math.max(MORTA_MIN, MORTA_PCT * vh);

            estados.forEach(function (t) {
                var base = t.el.getBoundingClientRect().bottom;
                if (!t.ativo && base <= ancora - morta) {
                    t.ativo = true;
                    t.el.style.opacity = '1';
                    t.el.style.transform = 'translateY(0)';
                } else if (t.ativo && base >= ancora + morta) {
                    t.ativo = false;
                    t.el.style.opacity = '0';
                    t.el.style.transform = 'translateY(24px)';
                }
            });
        }
        function agenda() {
            if (pedido) return;
            pedido = true;
            requestAnimationFrame(pinta);
        }

        pinta();
        window.addEventListener('scroll', agenda, { passive: true });
        window.addEventListener('resize', agenda);
    })();

    /* ── 3. Fundos decorativos do "Imagine" ───────────────────────────
       O lettering atravessa a seção da esquerda pra direita conforme ela
       entra na tela (só translate: o blur dele é estático, escrito no
       CSS), e o brilho do rodapé da PÁGINA sobe em opacidade conforme o
       fechamento chega. Os dois são decorativos e vivem em seções
       diferentes: o lettering na do "Imagine", o brilho na do fechamento,
       que é onde a origem o coloca. ── */
    (function fundosDoImagine() {
        var fundo = document.querySelector('.ip-imagine-fundo');
        var brilho = document.querySelector('.ip-final-brilho');
        /* quem dirige o brilho e a SECAO, nao a caixa do brilho: ver a
           conta la embaixo */
        var secFinal = document.querySelector('.ip-final');
        if (!fundo && !brilho) return;

        /* teto do brilho: ele acende ate 0.5, nao ate 1 */
        var BRILHO_MAX = 0.5;
        if (reduz) {
            if (brilho) brilho.style.opacity = String(BRILHO_MAX);
            return;
        }

        var alvoFundo = 0, atualFundo = 0;
        var alvoBrilho = 0, atualBrilho = 0;
        var SUAVE = 0.1;
        var rodando = false;

        function mede() {
            var vh = window.innerHeight;
            if (fundo) {
                var r = fundo.getBoundingClientRect();
                alvoFundo = trava((vh - r.top) / vh);
            }
            if (brilho) {
                /* O progresso vem da SECAO entrando na tela, nao da caixa
                   do brilho.

                   A caixa do brilho esta colada no fim da pagina, entao
                   qualquer conta ancorada nela so fecharia em 1 num scroll
                   que NAO EXISTE: medido em 1440x900, no scroll maximo
                   (5900 de 5900) o brilho parava em 0,88 e ficava eternamente
                   perseguindo o alvo. Antes disso, dividindo por
                   (vh + altura), travava em 0,43.

                   Aqui a conta comeca quando o topo da secao entra por
                   baixo da tela e fecha quando ele sobe 75% da tela, o que
                   acontece com folga antes do fim da pagina: o brilho chega
                   aceso enquanto o card ainda esta em cena. */
                var alvo = secFinal || brilho;
                var b = alvo.getBoundingClientRect();
                alvoBrilho = trava((vh - b.top) / (vh * 0.75));
            }
            if (!rodando) { rodando = true; requestAnimationFrame(anima); }
        }

        function anima() {
            atualFundo = lerp(atualFundo, alvoFundo, SUAVE);
            atualBrilho = lerp(atualBrilho, alvoBrilho, SUAVE);

            if (fundo) {
                fundo.style.setProperty('--ip-fundo-x',
                    ((1 - atualFundo) * -100) + '%');
            }
            if (brilho) brilho.style.opacity = String(atualBrilho * BRILHO_MAX);

            /* para o loop quando já chegou: nada de rAF eterno */
            if (Math.abs(atualFundo - alvoFundo) < 0.001
                && Math.abs(atualBrilho - alvoBrilho) < 0.001) {
                rodando = false;
                return;
            }
            requestAnimationFrame(anima);
        }

        mede();
        window.addEventListener('scroll', mede, { passive: true });
        window.addEventListener('resize', mede);
    })();

    /* ── 3b. Chegada do card do fechamento ───────────────────────────
       DIRIGIDA PELO SCROLL, nao por gatilho. Medido na origem parando o
       scroll 2,5s em cada ponto, com viewport de 900 (valores ja
       assentados, entao sao o alvo e nao um estado de transicao):

         topo 918  blur 8px        rotateX 30,0
         topo 805  blur 5,201px    rotateX 26,0
         topo 684  blur 2,308px    rotateX 19,8
         topo 560  blur 0,699px    rotateX 13,3
         topo 430  blur 0,069px    rotateX  6,2
         topo 302  blur 0px        rotateX  0,0

       Duas curvas diferentes saindo do mesmo progresso: o angulo cai
       LINEAR e o blur cai com o CUBO dele. O cubo fecha nos cinco pontos
       (0,867^3 = 0,652 contra 0,650 medido; 0,661^3 = 0,289 contra 0,288;
       0,445^3 = 0,088 contra 0,087), e e o que faz o desfoque sumir cedo
       enquanto a placa ainda esta endireitando.

       O progresso e o topo do card atravessando a tela, entre 0,645 de
       viewport de curso e o fim em 0,335 de viewport (302 e 580 de 900).

       Sem `transition` no CSS: o valor e reescrito a cada frame, e uma
       transicao por cima so atrasaria o que ja acompanha o scroll. ── */
    (function chegadaDoCardFinal() {
        var card = document.querySelector('.ip-final-card');
        if (!card || reduz) return;

        var ANGULO   = 30;     /* graus, no comeco do curso */
        var BLUR     = 8;      /* px, no comeco do curso */
        var FIM      = 0.335;  /* fracao da viewport onde fecha */
        var CURSO    = 0.645;  /* fracao da viewport que a chegada ocupa */

        card.style.willChange = 'transform, filter';

        var pedido = false;
        function pinta() {
            pedido = false;
            var vh = window.innerHeight;
            var topo = card.getBoundingClientRect().top;
            var a = trava((topo - vh * FIM) / (vh * CURSO));

            card.style.transform = a
                ? 'perspective(256px) rotateX(' + (ANGULO * a) + 'deg)'
                : 'none';
            /* abaixo de 864 o blur sai e sobra so o endireitar da placa */
            card.style.filter = (a && !semBlur())
                ? 'blur(' + (BLUR * a * a * a) + 'px)'
                : 'none';
        }
        function agenda() {
            if (pedido) return;
            pedido = true;
            requestAnimationFrame(pinta);
        }

        pinta();
        window.addEventListener('scroll', agenda, { passive: true });
        window.addEventListener('resize', agenda);
    })();

    /* ── 4. Faixas de capas ───────────────────────────────────────────
       Cada faixa anda na horizontal conforme atravessa a tela, alternando
       o sentido, e cada capa perde nitidez e opacidade conforme se afasta
       do centro da viewport.

       As capas são course-cards (só capa e título, sem tags, sem seta e
       sem clique) posicionados em `left` por JS e clonados pros dois lados
       (os "fantasmas"), pra que a faixa nunca mostre um vazio nas pontas.
       Os clones saem da árvore de acessibilidade.

       Abaixo de 864 o blur não entra: só opacidade. ── */
    (function faixasDeCapas() {
        var faixas = [].slice.call(document.querySelectorAll('.ip-faixa'));
        if (!faixas.length) return;

        var MAX_BLUR = 8;
        var medidas = new WeakMap();

        function px(v) { return parseFloat(String(v).replace('px', '')) || 0; }

        function vars(el) {
            var cs = getComputedStyle(el);
            var w = px(cs.getPropertyValue('--capa-w'));
            var gap = px(cs.getPropertyValue('--capa-gap'));
            return { w: w, passo: w + gap };
        }

        function reais(faixa) {
            return [].slice.call(faixa.children).filter(function (n) {
                return n.classList && n.classList.contains('ip-capa')
                    && !n.classList.contains('is-fantasma');
            });
        }

        function monta(faixa) {
            [].slice.call(faixa.querySelectorAll('.ip-capa.is-fantasma'))
                .forEach(function (n) { n.remove(); });

            var v = vars(faixa);
            var originais = reais(faixa);
            if (!originais.length || !v.passo) return;

            originais.forEach(function (img, i) {
                img.style.left = Math.round(v.passo * i) + 'px';
            });

            function clona(img, esquerda) {
                var g = img.cloneNode(true);
                g.classList.add('is-fantasma');
                g.setAttribute('aria-hidden', 'true');
                g.style.pointerEvents = 'none';
                if (esquerda) faixa.insertBefore(g, originais[0]);
                else faixa.appendChild(g);
                return g;
            }
            originais.forEach(function (img, i) {
                clona(img, true).style.left =
                    Math.round(-v.passo * (i + 1)) + 'px';
            });
            originais.forEach(function (img, i) {
                clona(img, false).style.left =
                    Math.round(v.passo * (originais.length + i)) + 'px';
            });

            medidas.set(faixa, {
                passo: v.passo,
                capaW: v.w,
                curso: v.passo * (originais.length - 1),
                qtd: originais.length
            });
        }

        function pintaFaixa(faixa, travado) {
            var m = medidas.get(faixa);
            if (!m) return;

            /* remonta se o breakpoint trocou a medida da capa */
            var v = vars(faixa);
            if (v.passo !== m.passo) {
                monta(faixa);
                m = medidas.get(faixa);
                if (!m) return;
            }

            var r = faixa.getBoundingClientRect();
            var vh = window.innerHeight;
            /* com movimento reduzido a faixa não anda: fica parada no meio
               do curso, que é onde ela está mais legível */
            var p = travado ? 0.5 : trava((vh - r.top) / (vh + r.height));

            var rtl = faixa.getAttribute('data-sentido') !== 'ltr';
            var deslo = rtl ? -m.curso * p : m.curso * (p - 1);

            var centro = window.innerWidth / 2;
            var raio = 0.5 * window.innerWidth + 0.5 * m.passo * (m.qtd - 1);
            var apaga = semBlur();

            [].slice.call(faixa.querySelectorAll('.ip-capa')).forEach(function (el) {
                var esq = r.left + px(el.style.left) + deslo;
                var meio = esq + m.capaW / 2;
                var t = trava(Math.abs(meio - centro) / raio);

                el.style.transform = 'translate3d(' + deslo + 'px,0,0)';
                el.style.opacity = String(1 - t);
                el.style.filter = apaga ? 'none' : 'blur(' + (MAX_BLUR * t) + 'px)';
            });
        }

        var pedido = false;
        function pinta() {
            pedido = false;
            faixas.forEach(function (f) { pintaFaixa(f, false); });
        }
        function agenda() {
            if (pedido) return;
            pedido = true;
            requestAnimationFrame(pinta);
        }

        function remonta() {
            faixas.forEach(monta);
            pinta();
        }

        remonta();
        /* A faixa anda SEMPRE. Eu tinha desligado o scroll dela em
           prefers-reduced-motion, e isso congelava as capas no meio do
           curso: a fila perdia a continuidade e virava um bloco parado.
           A origem nao faz isso, e com razao: aqui nao ha nada tocando
           sozinho, o deslocamento e resposta direta ao scroll do leitor.
           O que continua desligado abaixo de 864 e so o blur. */
        window.addEventListener('scroll', agenda, { passive: true });
        window.addEventListener('resize', remonta);
        /* as capas entram com loading lazy: a altura da faixa vem do CSS,
           mas o layout ainda pode assentar depois do primeiro frame */
        window.addEventListener('load', remonta);
    })();

    /* ── 4b. Entrada da timeline das formacoes ───────────────────────
       Os itens entram em cascata quando a timeline cruza a tela. Na home
       quem faz isso e a keyframe cta-card-enter, que anima opacidade,
       deslocamento E blur de 32px; aqui o blur fica de fora em qualquer
       largura, seguindo a mesma decisao que ja vale nas falas do
       "Imagine".

       O estado escondido e escrito AQUI, nao no CSS (a classe .enter-card
       vem do HTML portado mas nao tem regra propria nesta pagina): sem JS
       a timeline aparece inteira, em vez de ficar invisivel. ── */
    (function entradaDaTimeline() {
        var itens = [].slice.call(
            document.querySelectorAll('.formacoes-timeline .formacoes-item'));
        if (!itens.length || reduz) return;
        if (!('IntersectionObserver' in window)) return;

        itens.forEach(function (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(24px)';
            el.style.transition = 'opacity 600ms ease-out, transform 600ms ease-out';
            el.style.willChange = 'opacity, transform';
        });

        var obs = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                if (!e.isIntersecting) return;
                obs.unobserve(e.target);
                var i = itens.indexOf(e.target);
                setTimeout(function () {
                    e.target.style.opacity = '1';
                    e.target.style.transform = 'translateY(0)';
                }, (i % 4) * 80);
            });
        }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });

        itens.forEach(function (el) { obs.observe(el); });
    })();

    /* ── 4c. Linha e sweep da timeline ────────────────────────────────
       A animação especial do .formacoes-timeline da home, portada.

       Acima de 576 cada FILEIRA ganha dois elementos: a linha de 100vw,
       que sangra a viewport inteira, e um sweep de 128px que atravessa
       essa linha da esquerda pra direita. Ao passar por cada ponto, o
       ponto dá um "ping" de sonar e o sweep assume a cor dele. As
       fileiras acendem uma de cada vez, em rodízio.

       As fileiras não vêm do DOM: aqui a timeline é um grid CSS, então
       elas são descobertas agrupando os itens pelo offsetTop. Isso evita
       a remontagem em .formacoes-row que a home faz em JS a cada
       breakpoint, e sobrevive sozinho a qualquer mudança de colunas.

       Abaixo de 576 as linhas horizontais somem e entra o trilho
       vertical: um sweep de 4px que acompanha o scroll e vai pingando os
       pontos conforme passa por eles. ── */
    (function sweepDaTimeline() {
        var timeline = document.querySelector('.formacoes-timeline');
        if (!timeline || reduz) return;

        var itens = [].slice.call(timeline.querySelectorAll('.formacoes-item'));
        if (!itens.length) return;

        var PASSO = 3;      /* segundos que o sweep leva pra atravessar */
        var PAUSA = 0.3;    /* respiro antes da próxima fileira */
        var TOTAL = PASSO + PAUSA;

        var mqV = window.matchMedia('(max-width: 576px)');

        function cor(item) {
            return getComputedStyle(item.querySelector('.formacoes-dot'))
                .getPropertyValue('--dot-color').trim() || '#9696FF';
        }
        function pinga(item) {
            var d = item.querySelector('.formacoes-dot');
            d.classList.remove('is-pinging');
            void d.offsetWidth;   /* força o restart da animação */
            d.classList.add('is-pinging');
        }

        var fileiras = [];
        var vsweep = null;

        function limpa() {
            [].slice.call(timeline.querySelectorAll('.formacoes-linha, .formacoes-sweep'))
                .forEach(function (n) { n.parentNode.removeChild(n); });
            fileiras = [];
            vsweep = null;
        }

        function monta() {
            limpa();

            if (mqV.matches) {
                vsweep = document.createElement('div');
                vsweep.className = 'formacoes-sweep formacoes-sweep--v';
                vsweep.setAttribute('aria-hidden', 'true');
                timeline.appendChild(vsweep);
                return;
            }

            /* agrupa por linha do grid: mesmo offsetTop, mesma fileira */
            var porTopo = {};
            itens.forEach(function (item) {
                var t = Math.round(item.offsetTop);
                (porTopo[t] = porTopo[t] || []).push(item);
            });

            Object.keys(porTopo)
                .sort(function (a, b) { return a - b; })
                .forEach(function (t) {
                    var grupo = porTopo[t];

                    var linha = document.createElement('div');
                    linha.className = 'formacoes-linha';
                    linha.setAttribute('aria-hidden', 'true');
                    linha.style.top = t + 'px';
                    timeline.appendChild(linha);

                    var sweep = document.createElement('div');
                    sweep.className = 'formacoes-sweep';
                    sweep.setAttribute('aria-hidden', 'true');
                    sweep.style.top = t + 'px';
                    timeline.appendChild(sweep);

                    fileiras.push({
                        itens: grupo,
                        sweep: sweep,
                        cores: grupo.map(cor),
                        xs: grupo.map(function (i) {
                            return i.querySelector('.formacoes-dot').getBoundingClientRect().left;
                        }),
                        pingados: grupo.map(function () { return false; }),
                        zerado: false
                    });
                });
        }

        function remede() {
            fileiras.forEach(function (f) {
                f.xs = f.itens.map(function (i) {
                    return i.querySelector('.formacoes-dot').getBoundingClientRect().left;
                });
            });
        }

        /* ── sweep horizontal, em rodízio entre as fileiras ── */
        var anterior = null;
        var t = 0;
        function quadro(agora) {
            if (anterior === null) anterior = agora;
            var dt = Math.min((agora - anterior) / 1000, 0.05);
            anterior = agora;

            if (!fileiras.length) { requestAnimationFrame(quadro); return; }

            t += dt;
            var vw = window.innerWidth;
            var ciclo = t % (fileiras.length * TOTAL);
            var ativa = Math.floor(ciclo / TOTAL);
            var dentro = ciclo - ativa * TOTAL;

            fileiras.forEach(function (f, i) {
                if (i !== ativa || dentro >= PASSO) {
                    if (!f.zerado) {
                        f.pingados = f.itens.map(function () { return false; });
                        f.zerado = true;
                    }
                    f.sweep.style.opacity = '0';
                    return;
                }

                f.zerado = false;
                var p = dentro / PASSO;
                var x = -128 + p * (vw + 256);
                var ponta = x + 128;

                var c = f.cores[0];
                for (var k = 0; k < f.xs.length; k++) {
                    if (ponta >= f.xs[k]) {
                        c = f.cores[k];
                        if (!f.pingados[k]) { f.pingados[k] = true; pinga(f.itens[k]); }
                    }
                }

                f.sweep.style.opacity = String(Math.min(p / 0.04, 1));
                f.sweep.style.transform = 'translateX(' + x + 'px)';
                f.sweep.style.background =
                    'linear-gradient(to right, transparent 0%, ' + c + ' 75%, transparent 100%)';
            });

            requestAnimationFrame(quadro);
        }

        /* ── sweep vertical do mobile, preso ao scroll ── */
        var pingadosV = itens.map(function () { return false; });
        var ultimoY = -Infinity;
        var pedidoV = false;

        function pintaV() {
            pedidoV = false;
            if (!vsweep) return;

            var rTl = timeline.getBoundingClientRect();
            var y = window.innerHeight * 0.5 - rTl.top;
            var descendo = y >= ultimoY;
            ultimoY = y;

            var cAtiva = cor(itens[0]);
            itens.forEach(function (item, i) {
                var d = item.querySelector('.formacoes-dot').getBoundingClientRect();
                var dy = d.top + d.height / 2 - rTl.top;
                if (descendo && y >= dy && !pingadosV[i]) {
                    pingadosV[i] = true;
                    pinga(item);
                }
                if (!descendo && y < dy) pingadosV[i] = false;
                if (pingadosV[i]) cAtiva = cor(item);
            });

            vsweep.style.transform = 'translateY(' + (y - 64) + 'px)';
            vsweep.style.opacity = (y >= 0 && y <= timeline.offsetHeight) ? '1' : '0';
            vsweep.style.background =
                'linear-gradient(to bottom, transparent 0%, ' + cAtiva + ' 75%, transparent 100%)';
        }
        function agendaV() {
            if (pedidoV || !vsweep) return;
            pedidoV = true;
            requestAnimationFrame(pintaV);
        }

        monta();
        requestAnimationFrame(quadro);
        window.addEventListener('scroll', agendaV, { passive: true });
        window.addEventListener('resize', function () {
            monta();
            remede();
            agendaV();
        });
        /* os cards do grid assentam depois que as fontes carregam */
        window.addEventListener('load', function () { monta(); remede(); });
    })();

    /* ── 5. Barra de CTA fixa ─────────────────────────────────────────
       Entra quando o hero terminou de sair e fica até o fim da página:
       depois que o card do fechamento perdeu o botão próprio, ela é o
       único CTA de toda a metade de baixo. ── */
    (function barraDeCta() {
        var barra = document.querySelector('.bottom-cta');
        var hero = document.querySelector('.ip-hero');
        if (!barra || !hero) return;

        var pedido = false;
        function pinta() {
            pedido = false;
            var vh = window.innerHeight;
            /* Entra quando o hero sai de cena e NÃO sai mais: o card do
               fechamento não tem mais botão próprio, então esta barra é o
               único CTA daqui pra baixo e precisa durar até o fim da
               página. */
            var comecou = hero.getBoundingClientRect().bottom < vh * 0.5;
            barra.classList.toggle('is-hidden', !comecou);
        }
        function agenda() {
            if (pedido) return;
            pedido = true;
            requestAnimationFrame(pinta);
        }

        pinta();
        window.addEventListener('scroll', agenda, { passive: true });
        window.addEventListener('resize', agenda);
    })();
})();
