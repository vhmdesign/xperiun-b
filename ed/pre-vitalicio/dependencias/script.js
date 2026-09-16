/* ══════════════════════════════════════════════════════════════════════
   /ed/pre-vitalicio/dependencias/script.js

   Coreografia do hero, portada de /ed/aichampion/dependencias/script.js.
   Ficou SÓ a parte de texto: a quebra do título em letras, o gradiente
   contínuo por letra e as fases dirigidas pelo scroll. Todo o desenho do
   canvas (bola de partículas, preenchimento de quadrados) e a camada de
   noise ficaram de fora.

   As fases, em múltiplos da altura da tela (VH). O hero tem 300vh:

     load          título 1 entra letra a letra (por tempo, 1.2s)
     128px a 1VH   título 1 sai letra a letra, subindo
     0.5VH a 1VH   lede sai pra esquerda, botões saem pra direita
     1VH a 1.6VH   título 2 entra letra a letra
     1.2VH a 1.8VH texto de detalhe sobe
     128px a 1VH   o fundo (vídeo + véu) sobe e esmaece; a canoa fica
     2VH a 2.8VH   o que sobrou sai de cena

   A última fase não existe no aichampion: lá o canvas de preenchimento
   cobria o hero no fim. Sem ele, os blocos (que são position: fixed)
   ficariam parados sobre a próxima seção, então saem por conta própria.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    /* ── Avatares da prova social: mesmo comportamento da home, os 5 círculos
         recebem thumbs sorteados dos depoimentos em vídeo. ── */
    (function avatares() {
        var alvos = document.querySelectorAll('.depos-avatar');
        if (!alvos.length) return;
        var base = '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-';
        var nomes = ['claudio', 'cleiton', 'daniel', 'edson', 'eduardo', 'ezequiel',
                     'gabriel', 'louiz', 'pedro', 'vinicius', 'vitoria'];
        for (var i = nomes.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = nomes[i]; nomes[i] = nomes[j]; nomes[j] = t;
        }
        alvos.forEach(function (el, k) {
            el.style.backgroundImage = 'url(' + base + nomes[k % nomes.length] + '.webp)';
        });
    })();

    /* ── Infinite Pass: saída no scroll ──────────────────────────────
       Réplica da coreografia de /ed/infinite-pass/, medida na origem:

         lockup  0 -> 0.30 tela : opacity 1->0, blur 0->8px,  Y 0->64px
         vídeo   0 -> 0.50 tela : scale 1->1.5, blur 0->64px, Y 0->256px

       Lá a seção é o topo da página, então o progresso é o próprio
       scrollY. Aqui ela vive no meio, então o progresso é o quanto o topo
       da seção já passou do topo da tela, o que dá o mesmo efeito.

       O bloco de chamada NÃO entra na animação: na origem o hero inteiro
       some porque é só abertura, mas aqui embaixo do lockup existe preço
       e botão, e some-los enquanto o leitor rola até eles seria defeito. ── */
    /* ── Barra de CTA fixa ─────────────────────────────
       Aparece quando o Infinite Pass entra na tela e some quando ele sai,
       ou quando a seção de oferta ou a última seção da página chegam. A
       ideia é empurrar o vitalício só na faixa em que ele está sendo
       apresentado, e sair de cena quando a página já mostra os botões de
       verdade. ── */
    (function barraDeCta() {
        var barra = document.querySelector('.bottom-cta');
        var ip = document.querySelector('.ip');
        if (!barra || !ip) return;

        var oferta = document.querySelector('.sec-oferta');
        var ultima = document.querySelector('.sec-cta');

        var pedido = false;
        function pinta() {
            pedido = false;
            var vh = window.innerHeight;
            /* A partir do Infinite Pass, nao apenas enquanto ele está em
               cena: basta ele ter entrado na tela uma vez. */
            var comecou = ip.getBoundingClientRect().top < vh;
            /* e some quando a oferta ou a última seção chegam */
            var fechou = false;
            [oferta, ultima].forEach(function (s) {
                if (s && s.getBoundingClientRect().top < vh) fechou = true;
            });
            var mostra = comecou && !fechou;
            barra.classList.toggle('is-hidden', !mostra);
            /* o botao do WhatsApp sobe quando a barra esta em cena */
            document.documentElement.classList.toggle('tem-barra-cta', mostra);
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

    /* ── Entrada da sec-skills e da sec-cta ───────────────────
       O CSS portado deixa .skills-grid, .cta-sub e os filhos da .cta-right
       em opacity 0 esperando .is-entered, que na origem vem de um observer
       do formacoes/script.js. Sem ele o conteúdo das duas seções nunca
       aparecia. ── */
    (function entradaSkillsECta() {
        var OPT = { rootMargin: '0px 0px -25% 0px', threshold: 0 };
        function revela(seletor, passo, margem) {
            var i = 0;
            document.querySelectorAll(seletor).forEach(function (el) {
                var obs = new IntersectionObserver(function (entradas) {
                    entradas.forEach(function (e) {
                        if (!e.isIntersecting) return;
                        obs.unobserve(el);
                        var atraso = i * (passo || 0);
                        i++;
                        setTimeout(function () { el.classList.add('is-entered'); }, atraso);
                    });
                }, { rootMargin: margem || OPT.rootMargin, threshold: 0 });
                obs.observe(el);
            });
        }
        revela('.skills-grid', 0);
        /* Sem recuo aqui: a .sec-cta e a ultima secao, e com o -25% do
           padrao os elementos dela ficam na faixa de baixo que o observer
           ignora, mesmo no fim da pagina. Medido em 1440x950: a tag para em
           720 e o limite era 713, entao nunca aparecia. */
        revela('.cta-right .tag-status', 60, '0px');
        revela('.cta-right .btn', 60, '0px');
    })();

    /* ── Entrada dos cabeçalhos de seção ──────────────────────────────
       Gesto de /ed/aichampion/: o título entra letra a letra com stagger
       curto, o eyebrow junto e o lede logo atrás.

       O estado inicial escondido é escrito AQUI, não no CSS. Na origem ele
       mora no CSS, e por isso uma seção fica invisível se o observer não
       rodar; deste jeito, sem JS, tudo aparece normal.

       Abaixo de 864 o blur sai e fica só opacity mais deslocamento, que é
       a regra do projeto pra blur animado. ── */
    (function entradaDosCabecalhos() {
        var reduz = window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduz) return;

        var estreito = window.matchMedia
            && window.matchMedia('(max-width: 864px)').matches;
        function desfoque(px) { return estreito || !px ? 'none' : 'blur(' + px + 'px)'; }
        var TRANS = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';

        /* Quebra o título em letras, mantendo cada palavra dentro de um
           span nowrap pra a quebra de linha continuar caindo entre
           palavras, nunca no meio de uma. */
        function fatiaTitulo(titulo) {
            if (titulo.dataset.animPronto) return titulo._letras || [];
            titulo.dataset.animPronto = '1';
            var letras = [];

            function percorre(no) {
                if (no.nodeType === 3) {
                    var texto = no.textContent;
                    if (!texto) return;
                    var frag = document.createDocumentFragment();
                    var i = 0;
                    while (i < texto.length) {
                        if (/\s/.test(texto[i])) {
                            frag.appendChild(document.createTextNode(texto[i]));
                            i++;
                        } else {
                            var j = i;
                            while (j < texto.length && !/\s/.test(texto[j])) j++;
                            var palavra = document.createElement('span');
                            palavra.className = 'word-nowrap';
                            for (var k = i; k < j; k++) {
                                var sp = document.createElement('span');
                                sp.textContent = texto[k];
                                palavra.appendChild(sp);
                                letras.push(sp);
                            }
                            frag.appendChild(palavra);
                            i = j;
                        }
                    }
                    no.parentNode.replaceChild(frag, no);
                    return;
                }
                if (no.nodeType !== 1) return;
                Array.prototype.slice.call(no.childNodes).forEach(percorre);
            }

            Array.prototype.slice.call(titulo.childNodes).forEach(percorre);
            titulo._letras = letras;
            return letras;
        }

        function escondeLetras(letras) {
            letras.forEach(function (sp) {
                sp.style.display = 'inline-block';
                sp.style.opacity = '0';
                sp.style.filter = desfoque(16);
                sp.style.transform = 'translateY(16px)';
                sp.style.transition = TRANS;
            });
        }

        function esconde(el, dy) {
            el.style.opacity = '0';
            el.style.filter = desfoque(16);
            el.style.transform = 'translateY(' + dy + 'px)';
            el.style.transition = TRANS;
        }

        function mostra(el) {
            el.style.opacity = '1';
            el.style.filter = desfoque(0);
            el.style.transform = 'translateY(0)';
        }

        var OPT = { rootMargin: '0px 0px -25% 0px', threshold: 0 };

        document.querySelectorAll('.sec-title').forEach(function (titulo) {
            var cabecalho = titulo.parentNode;
            if (!cabecalho) return;
            var eyebrow = cabecalho.querySelector('.sec-eyebrow');
            /* o lede nem sempre e irmao do titulo: na sec-cta ele e o
               .cta-sub, que fica fora do .cta-header. Mesma busca que a
               origem faz. */
            var lede = cabecalho.querySelector('.sec-lede, .cta-sub');
            if (!lede && cabecalho.parentNode && cabecalho.parentNode.querySelector) {
                lede = cabecalho.parentNode.querySelector('.sec-lede, .cta-sub');
            }
            var letras = fatiaTitulo(titulo);

            escondeLetras(letras);
            if (eyebrow) esconde(eyebrow, -16);
            if (lede) esconde(lede, 16);

            var obs = new IntersectionObserver(function (entradas) {
                entradas.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    obs.unobserve(titulo);
                    if (eyebrow) mostra(eyebrow);
                    letras.forEach(function (sp, i) {
                        setTimeout(function () { mostra(sp); }, i * 10);
                    });
                    if (lede) setTimeout(function () { mostra(lede); }, 150);
                });
            }, OPT);
            obs.observe(titulo);
        });
    })();

    /* ── Logos das empresas ────────────────────────────────────────
       O #depos-logos-grid nasce com <img src="">: quem preenche e
       roda os logos e este bloco, portado de /ed/aichampion/. Sem
       ele a grade fica com imagens vazias. ── */
    /* população + rotação dos logos (#depos-logos-grid) */
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
        var imgs = Array.from(grid.querySelectorAll('.depos-logo-card img'));
        var imgToLogo = new Map();
        function shuffle(arr) {
            var a = arr.slice();
            for (var i = a.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var t = a[i]; a[i] = a[j]; a[j] = t;
            }
            return a;
        }
        function visibleImgs() {
            return imgs.filter(function(img) { return img.closest('.depos-logo-card').offsetHeight > 0; });
        }
        function displayedLogos() {
            var arr = [];
            visibleImgs().forEach(function(img) {
                var l = imgToLogo.get(img);
                if (l) arr.push(l);
            });
            return arr;
        }
        function init() {
            var visible = visibleImgs();
            var initial = shuffle(logos).slice(0, visible.length);
            visible.forEach(function(img, i) {
                img.src = initial[i].src;
                img.alt = initial[i].alt;
                img.style.opacity = '0.5';
                imgToLogo.set(img, initial[i]);
            });
        }
        var lastImg = null;
        function tick() {
            var visible = visibleImgs();
            if (!visible.length) return;
            var candidates = visible.length > 1 ? visible.filter(function(i) { return i !== lastImg; }) : visible;
            var img = candidates[Math.floor(Math.random() * candidates.length)];
            lastImg = img;
            var displayed = displayedLogos();
            var pool = logos.filter(function(l) { return displayed.indexOf(l) === -1; });
            if (!pool.length) return;
            var next = pool[Math.floor(Math.random() * pool.length)];
            imgToLogo.set(img, next);
            img.style.opacity = '0';
            var loaded = false, delayed = false;
            function tryComplete() {
                if (!loaded || !delayed) return;
                img.src = next.src;
                img.alt = next.alt;
                img.style.opacity = '0.5';
            }
            setTimeout(function () { delayed = true; tryComplete(); }, 600);
            var preloader = new Image();
            preloader.onload = preloader.onerror = function () { loaded = true; tryComplete(); };
            preloader.src = next.src;
        }
        init();
        setInterval(tick, 700);
    })();

    /* ── Depoimentos: reveal e carrossel infinito ───────────────
       O CSS portado deixa .depos-card, .depos-nav e .champ-img em opacity
       0 esperando a classe .is-entered, que na origem vem de um sistema de
       observers grande do aichampion. Aqui o mesmo efeito sai de um
       observer curto, no mesmo formato do usado nos cards de oferta.
       O carrossel clona os cards nas duas pontas pra o loop nao ter
       emenda, e o vídeo só vira iframe do YouTube quando clicado (facade),
       pra nao carregar o player de todos de uma vez. ── */
    (function depoimentos() {
        var wrap = document.querySelector('.depos-faq-wrap');
        if (!wrap) return;

        var OPT = { rootMargin: '0px 0px -25% 0px', threshold: 0 };
        function revela(seletor, passo) {
            var i = 0;
            wrap.querySelectorAll(seletor).forEach(function (el) {
                var obs = new IntersectionObserver(function (entradas) {
                    entradas.forEach(function (e) {
                        if (!e.isIntersecting) return;
                        obs.unobserve(el);
                        var atraso = i * (passo || 0);
                        i++;
                        setTimeout(function () { el.classList.add('is-entered'); }, atraso);
                    });
                }, OPT);
                obs.observe(el);
            });
        }
        /* facade de vídeo: troca o thumb pelo player só no clique */
        wrap.addEventListener('click', function (e) {
            var video = e.target.closest && e.target.closest('.depos-video[data-vid]');
            if (!video) return;
            var vid = video.dataset.vid;
            var inicio = video.dataset.start || 0;
            delete video.dataset.vid;
            var iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube.com/embed/' + vid + '?start=' + inicio + '&autoplay=1';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            video.innerHTML = '';
            video.appendChild(iframe);
        });

        var track = document.getElementById('depos-track');
        if (!track) return;
        var originais = Array.prototype.slice.call(track.children);
        if (!originais.length) return;

        /* clones nas duas pontas, pra o loop nao ter emenda */
        originais.forEach(function (c) {
            var cl = c.cloneNode(true);
            cl.setAttribute('aria-hidden', 'true');
            track.appendChild(cl);
        });
        originais.slice().reverse().forEach(function (c) {
            var cl = c.cloneNode(true);
            cl.setAttribute('aria-hidden', 'true');
            track.insertBefore(cl, track.firstChild);
        });

        var prev = document.getElementById('depos-prev');
        var next = document.getElementById('depos-next');
        var N = originais.length;

        function passo() {
            var c = track.querySelector('.depos-card');
            /* getBoundingClientRect, nao offsetWidth: este arredonda pra
               inteiro e a fracao da largura acumula deslocamento ao longo
               dos clones. */
            var gap = parseFloat(getComputedStyle(track).columnGap) || 24;
            return c ? c.getBoundingClientRect().width + gap : 0;
        }

        /* reposiciona sem animar: com o scroll-behavior ligado, a correcao
           do loop viraria uma rolagem visivel */
        function poeDireto(pos) {
            track.style.scrollBehavior = 'auto';
            track.scrollLeft = pos;
            void track.offsetWidth;
            track.style.scrollBehavior = '';
        }

        /* acima de 1440 os containers da pagina ficam centrados em 1408; o
           track sangra, entao precisa desse recuo pra alinhar com eles */
        function recuoDoGrid() {
            if (!window.matchMedia('(min-width: 1440px)').matches) return 0;
            return Math.max(0, (document.documentElement.clientWidth - 1408) / 2);
        }

        function corrigeLoop() {
            var W = N * passo();
            var r = recuoDoGrid();
            if (!W) return;
            if (track.scrollLeft < W - r) poeDireto(track.scrollLeft + W);
            else if (track.scrollLeft >= 2 * W - r) poeDireto(track.scrollLeft - W);
        }

        function comeco() {
            var s = passo();
            /* as imagens podem nao ter layout ainda; tenta de novo no
               proximo frame ate a medida existir */
            if (!s) { requestAnimationFrame(comeco); return; }
            poeDireto(N * s - recuoDoGrid());
        }
        requestAnimationFrame(function () { requestAnimationFrame(comeco); });
        window.addEventListener('resize', comeco);

        /* a correcao roda DEPOIS que a rolagem assenta, nunca durante: se
           rodar dentro do proprio handler, ela puxa o track no meio da
           animacao do botao */
        var timerBotao;
        function anda(dir) {
            var s = passo();
            if (!s) return;
            track.scrollBy({ left: s * dir, behavior: 'smooth' });
            clearTimeout(timerBotao);
            timerBotao = setTimeout(corrigeLoop, 500);
        }
        if (prev) prev.addEventListener('click', function () { anda(-1); });
        if (next) next.addEventListener('click', function () { anda(1); });

        var timerScroll;
        track.addEventListener('scroll', function () {
            clearTimeout(timerScroll);
            timerScroll = setTimeout(corrigeLoop, 150);
        }, { passive: true });

        if (prev) prev.disabled = false;
        if (next) next.disabled = false;

        /* Os reveals vem DEPOIS da clonagem de proposito: o cloneNode copia
           a classList do momento da copia, entao clone feito antes do
           observer nasce sem .is-entered e ficaria presos em opacity 0,
           abrindo buracos no loop. */
        revela('.depos-nav', 0);
        revela('.depos-card', 40);
        revela('.champ-img', 40);
    })();

    /* ── Ofertas: entrada dos cards e mini-carrossel ─────────────
       O .oferta-card nasce com opacity 0 e só aparece com .is-entered, que
       na origem vem de um observer do formacoes/script.js. O carrossel só
       tem efeito abaixo de 864px, onde o CSS transforma o grid em faixa
       rolável; os botões vêm do próprio HTML portado. ── */
    (function ofertas() {
        var cards = document.querySelectorAll('.oferta-card');
        if (cards.length) {
            var obs = new IntersectionObserver(function (entradas) {
                entradas.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    obs.unobserve(e.target);
                    var i = Array.prototype.indexOf.call(cards, e.target);
                    setTimeout(function () { e.target.classList.add('is-entered'); }, i * 120);
                });
            }, { rootMargin: '0px 0px -25% 0px', threshold: 0 });
            Array.prototype.forEach.call(cards, function (c) { obs.observe(c); });
        }

        var grid = document.querySelector('.oferta-grid');
        var prev = document.getElementById('oferta-prev');
        var next = document.getElementById('oferta-next');
        if (!grid || !prev || !next) return;
        var lista = Array.prototype.slice.call(grid.querySelectorAll('.oferta-card'));
        if (lista.length < 2) return;

        function recuo() { return parseFloat(getComputedStyle(grid).scrollPaddingLeft) || 0; }

        function atual() {
            var max = grid.scrollWidth - grid.clientWidth;
            if (grid.scrollLeft <= 1) return 0;
            if (grid.scrollLeft >= max - 1) return lista.length - 1;
            var r = recuo(), perto = 0, menor = Infinity;
            lista.forEach(function (c, i) {
                var dist = Math.abs(c.offsetLeft - grid.scrollLeft - r);
                if (dist < menor) { menor = dist; perto = i; }
            });
            return perto;
        }

        function vaiPara(i) {
            var c = lista[i];
            if (c) grid.scrollTo({ left: Math.max(0, c.offsetLeft - recuo()), behavior: 'smooth' });
        }

        function atualizaBotoes() {
            var i = atual();
            prev.disabled = i <= 0;
            next.disabled = i >= lista.length - 1;
        }

        prev.addEventListener('click', function () { var i = atual(); if (i > 0) vaiPara(i - 1); });
        next.addEventListener('click', function () { var i = atual(); if (i < lista.length - 1) vaiPara(i + 1); });
        grid.addEventListener('scroll', atualizaBotoes, { passive: true });
        window.addEventListener('resize', atualizaBotoes);
        atualizaBotoes();
    })();

    /* ── Pin de saída de seção ────────────────────────────
       O CSS prende a seção com `top: var(--<nome>)`. O valor é `altura da
       viewport menos altura da seção`: negativo, ele faz a seção parar no
       instante em que a borda de baixo dela alcançaria o rodapé da tela. A
       partir daí a próxima sobe por cima da cauda travada, pelos 100vh de
       folga que o espaçador reserva.

       Dois pares usam isto: .sec-courses -> .ip e .bc-cases-sec -> .vit. ── */
    (function pinsDeSaida() {
        function prende(seletor, variavel) {
            var sec = document.querySelector(seletor);
            if (!sec) return;

            function mede() {
                document.documentElement.style.setProperty(
                    variavel,
                    (window.innerHeight - sec.offsetHeight) + 'px'
                );
            }

            mede();
            window.addEventListener('resize', mede);
            /* a altura muda quando as imagens carregam e quando o grid
               remapeia de colunas */
            if (window.ResizeObserver) new ResizeObserver(mede).observe(sec);
        }

        /* A folga e o quanto a secao presa fica parada, e quem sobe tem que
           ser alto o bastante pra cobri-la ate o fim. Quando a secao de cima
           e mais baixa que a viewport, sobra um pedaco do wrapper sem nada
           por cima (medido: tira de 40px no fim da pagina). Entao a folga
           vira o menor entre uma viewport e a altura de quem cobre, e a
           margem negativa la no CSS le a mesma variavel. */
        function folga(quemCobre, variavel) {
            var el = document.querySelector(quemCobre);
            if (!el) return;

            function mede() {
                /* floor no rect, nao offsetHeight: este arredonda pra cima
                   (911 pra uma altura real de 910,4) e a folga passava da
                   secao por 1px, deixando um fio da cauda travada aparecendo. */
                var h = Math.min(window.innerHeight,
                    Math.floor(el.getBoundingClientRect().height));
                document.documentElement.style.setProperty(variavel, h + 'px');
            }

            mede();
            window.addEventListener('resize', mede);
            if (window.ResizeObserver) new ResizeObserver(mede).observe(el);
        }

        prende('.sec-courses', '--courses-pin-top');
        prende('.bc-cases-sec', '--cases-pin-top');
        folga('.ip', '--courses-folga');
        folga('.vit', '--cases-folga');
    })();

    (function saidaInfinitePass() {
        var sec  = document.querySelector('.ip');
        var tit  = document.querySelector('.ip-titulo');
        var vid  = document.querySelector('.ip-video');
        var cta  = document.querySelector('.ip-cta');
        if (!sec || !tit || !vid) return;

        /* Quebra cada linha do lockup em letras. O h2 ganha aria-label e as
           letras saem da árvore de acessibilidade, senão o leitor de tela
           soletraria "I-N-F-I-N-I-T-E". */
        var linhas = [].slice.call(tit.querySelectorAll('.ip-titulo-linha'));
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

        var reduz = window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduz) return;

        function trava(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

        /* Modelo medido na referência: a saida inteira dura meia tela; cada
           letra leva 0.6 desse trecho pra sumir e os inícios se espalham
           dentro dos 0.4 iniciais. INFINITE apaga da primeira letra pra
           última; PASS faz o contrário, da última pra primeira. */
        var CURSO  = 0.50;   /* fração da viewport que a saída ocupa */
        var ESPERA = 0.55;   /* scroll parada antes da chamada começar a sair */
        var SAIDA  = 0.70;   /* e quanto ela leva pra sumir */
        var JANELA = 0.60;   /* duração do fade de uma letra */
        var LEQUE  = 0.40;   /* espalhamento dos inícios */

        var pedido = false;
        function pinta() {
            pedido = false;
            var vh = window.innerHeight;
            var passou = -sec.getBoundingClientRect().top;   /* px já subidos */
            var p = trava(passou / (vh * CURSO));

            grupos.forEach(function (letras, iLinha) {
                var n = letras.length - 1 || 1;
                letras.forEach(function (letra, i) {
                    /* linha 0 (INFINITE) começa pela esquerda, linha 1 (PASS)
                       pela direita */
                    var ordem = iLinha === 0 ? i : n - i;
                    var inicio = (ordem / n) * LEQUE;
                    var q = trava((p - inicio) / JANELA);
                    letra.style.opacity = String(1 - q);
                    letra.style.transform = 'translateY(' + (64 * q) + 'px)';
                });
            });

            /* A chamada sai pra esquerda esmaecendo, mesmo gesto da
               .hero-lede-col do hero (mesmos 128px), mas com janela
               própria: ela só começa a sair depois que o lockup já se foi, e
               leva mais scroll pra sumir. Com a mesma janela do título o
               texto saía cedo demais pra dar tempo de ler. */
            var pc = trava((passou - vh * ESPERA) / (vh * SAIDA));
            if (cta) {
                cta.style.opacity = String(1 - pc);
                cta.style.transform = 'translateX(' + (-128 * pc) + 'px)';
                cta.style.pointerEvents = pc > 0.5 ? 'none' : 'auto';
            }

            /* O vídeo desce e cresce enquanto some. Antes ele desfocava; o
               blur saiu e o fade ficou no lugar. */
            vid.style.opacity = String(1 - p);
            vid.style.transform = 'translate(-50%, -50%) translateY('
                + (256 * p) + 'px) scale(' + (1 + 0.5 * p) + ')';
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

    /* ── Reveal das imagens do "Aprenda Ativamente" ───────────────────
       Portado do business-cases/script.js: o CSS deixa as .bc-active-img
       transparentes e o observer adiciona .is-entered quando a seção
       entra na tela, com stagger. ── */
    (function revelaBcAtivo() {
        var imgs = document.querySelectorAll('.bc-active-img');
        if (!imgs.length) return;
        var reduz = window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduz || !('IntersectionObserver' in window)) {
            imgs.forEach(function (el) { el.classList.add('is-entered'); });
            return;
        }
        var i = 0;
        imgs.forEach(function (el) {
            var obs = new IntersectionObserver(function (entradas) {
                entradas.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    obs.unobserve(el);
                    setTimeout(function () { el.classList.add('is-entered'); }, (i++) * 120);
                });
            }, { rootMargin: '0px 0px -25% 0px', threshold: 0 });
            obs.observe(el);
        });
    })();

    /* ── Alinha o topo do 1o card com o topo da lista da nav ──────────
       A coluna dos cards precisa descer a altura do header da nav mais o
       gap entre header e lista. Medido, não chutado: o título quebra em
       número diferente de linhas conforme a largura. Abaixo de 864px a
       lista some e o alinhamento perde sentido, então o offset zera. ── */
    (function alinhaCardsComNav() {
        var nav    = document.querySelector('.formacoes-nav');
        var header = document.querySelector('.formacoes-header');
        var lista  = document.querySelector('.formacoes-nav-list');
        var layout = document.querySelector('.formacoes-layout');
        if (!nav || !header || !lista || !layout) return;

        function ajusta() {
            if (getComputedStyle(lista).display === 'none') {
                layout.style.setProperty('--formacoes-offset', '0px');
                return;
            }
            var gap = parseFloat(getComputedStyle(nav).rowGap) || 0;
            /* sem arredondar: a altura do header é fracionária e o
               arredondamento deixava 1px de desalinho */
            layout.style.setProperty('--formacoes-offset',
                (header.getBoundingClientRect().height + gap) + 'px');
        }

        ajusta();
        if (window.ResizeObserver) new ResizeObserver(ajusta).observe(header);
        window.addEventListener('resize', ajusta);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajusta);
    })();

    /* ── As 7 formações: nav lateral ──────────────────────────────────
       Portado do index.js do hub. Clicar num item rola até o card, e um
       IntersectionObserver marca no nav qual card está na tela. ── */
    (function navFormacoes() {
        var itens = document.querySelectorAll('.formacoes-nav-item');
        var cards = document.querySelectorAll('.formacao-card');
        if (!itens.length || !cards.length) return;

        itens.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var alvo = document.getElementById(btn.dataset.target);
                if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        var obs = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                if (!e.isIntersecting) return;
                itens.forEach(function (b) { b.classList.remove('is-active'); });
                var ativo = document.querySelector('[data-target="' + e.target.id + '"]');
                if (ativo) ativo.classList.add('is-active');
            });
        }, { rootMargin: '-20% 0px -60% 0px' });

        cards.forEach(function (c) { obs.observe(c); });
    })();

    /* ── Lightbox: tira a stat "Nível" do DOM ────────────────────────
       O pasta.js constrói sempre 4 stats (Nível, Duração, Aulas,
       Professor). Nível existe pros Business Cases; curso não tem nível.
       Esconder por CSS deixaria o nó no DOM, então ele é removido de fato
       assim que o lightbox é construído (o pasta.js monta na primeira
       abertura, daí o observer). Não dá pra editar o pasta.js: ele é
       compartilhado com /ed/areas/, onde Nível é informação real. ── */
    (function tiraNivel() {
        function limpa(lb) {
            var stat = lb.querySelector('.course-modal-stat');
            if (stat && /Nível/.test(stat.textContent)) stat.remove();
        }
        var pronto = document.querySelector('.lb-card');
        if (pronto) { limpa(pronto); return; }
        var obs = new MutationObserver(function (muts) {
            for (var i = 0; i < muts.length; i++) {
                var nos = muts[i].addedNodes;
                for (var j = 0; j < nos.length; j++) {
                    var el = nos[j];
                    if (el.nodeType !== 1) continue;
                    var card = el.classList.contains('lb-card') ? el : el.querySelector && el.querySelector('.lb-card');
                    if (card) { limpa(card); obs.disconnect(); return; }
                }
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
    })();

    /* ── Pastas 3D das formações ──────────────────────────────────────
       Cada card de formação ganha a .area-folder de /ed/areas/, montada
       com os cursos daquela formação. Clicar abre o lightbox do XpFolder,
       o mesmo componente com nav prev/next e dots dos Business Cases.
       Os dados vêm de /ed/pre-vitalicio/dependencias/dados.js (CURSOS + FORMACOES), pra
       não duplicar o catálogo. ── */
    (function pastasFormacoes() {
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

        /* CURSOS -> formato que o Lightbox espera. `nivel` fica vazio: curso
           não tem nível como os Business Cases têm, e não se inventa dado. */
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

        /* A F6 é a formação desta página e o catálogo dela vive na seção
           de cursos, que já foi atualizada. Ler direto do DOM daquela seção
           evita ter duas listas de F6 na mesma página divergindo: o que
           está na seção é o que abre na pasta. As outras seis continuam
           vindo do dados.js. */
        function cursosDaSecao() {
            var cards = document.querySelectorAll('.courses-grid .course-card');
            return Array.prototype.map.call(cards, function (c) {
                var bg = c.querySelector('.course-card-bg');
                var m = /url\(["']?(.*?)["']?\)/.exec(bg ? getComputedStyle(bg).backgroundImage : '');
                var tags = c.querySelectorAll('.course-card-tags .tag-status');
                var titulo = c.querySelector('.course-card-title');
                var desc = c.querySelector('.course-card-desc');
                return {
                    image: m ? m[1] : '',
                    title: titulo ? titulo.textContent : '',
                    nivel: '',
                    duracao: c.dataset.duracao !== undefined ? c.dataset.duracao
                             : (tags[0] ? tags[0].textContent : ''),
                    aulas: c.dataset.aulas || '',
                    professor: c.dataset.professor !== undefined ? c.dataset.professor
                               : (tags[1] ? tags[1].textContent : ''),
                    desc: desc ? desc.textContent : '',
                    allHref: '#cursos'
                };
            });
        }
        var daSecao = cursosDaSecao();
        if (daSecao.length) porFormacao.f6 = daSecao;

        /* O card da seção de cursos abre o MESMO popup da pasta da F6, com
           a mesma navegação. Antes havia um segundo modal, mais pobre e sem
           nav, pra a mesma lista. O XpFolder.open() sempre começa no índice
           0, então a lista é rotacionada pra o card clicado ser o primeiro;
           a navegação dá a volta, nada fica inacessível. */
        var grid = document.querySelector('.courses-grid');
        if (grid && daSecao.length) {
            var abrirCurso = function (card) {
                var cards = Array.prototype.slice.call(grid.querySelectorAll('.course-card'));
                var i = cards.indexOf(card);
                if (i < 0) return;
                window.XpFolder.open(daSecao.slice(i).concat(daSecao.slice(0, i)), card);
            };
            grid.addEventListener('click', function (e) {
                var card = e.target.closest('.course-card');
                if (card) abrirCurso(card);
            });
            grid.addEventListener('keydown', function (e) {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                var card = e.target.closest('.course-card');
                if (!card) return;
                e.preventDefault();
                abrirCurso(card);
            });
        }

        FORMACOES.forEach(function (f) {
            var el = document.querySelector('.area-folder[data-f="' + f.id + '"]');
            if (!el || !porFormacao[f.id]) return;
            window.XpFolder.mount(el, { unit: 'cursos', projects: porFormacao[f.id] });

            /* "Ver formação" abre o mesmo popup da pasta. O href continua
               apontando pra página da formação: serve pra abrir em nova aba,
               pro teclado e pro rastreamento. Só o clique simples é
               interceptado; ctrl/cmd/meio seguem navegando. */
            var card = el.closest('.formacao-card');
            var btn = card && card.querySelector('.area-card-col--cta .btn');
            if (!btn) return;
            btn.addEventListener('click', function (e) {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                window.XpFolder.open(porFormacao[f.id], btn);
            });
        });
    })();

    var titleEl    = document.querySelector('.hero-title');
    var titleWrap  = document.querySelector('.hero-title-wrap');
    var newTitle   = document.querySelector('.hero-title2');
    var ledeWrap   = document.querySelector('.hero-lede-wrap');
    var heroLede   = document.querySelector('.hero-lede-col');
    var heroCtas   = document.querySelector('.hero-ctas');
    var detailWrap = document.querySelector('.hero-detail-wrap');
    /* anima a COLUNA, pra os logos subirem junto com o texto que creditam */
    var heroDetail = document.querySelector('.hero-detail-col');
    var brand      = document.querySelector('.hero-logo');
    var video      = document.querySelector('.hero-bg');
    var canoa      = document.querySelector('.canoa-bottom');
    var scrim      = document.querySelector('.hero-scrim');
    var hint       = document.querySelector('.ic-scroll-hint');
    var hero       = document.querySelector('.hero');
    if (!titleEl || !hero) return;

    /* ── Quebra o título em letras, preservando os elementos internos
         (o <span> de peso 700). Cada palavra vira um .word que não quebra
         no meio, e cada letra um .ltr animável. ── */
    var LETTER_WINDOW = 0.35;   /* fatia do progresso que cada letra leva */
    var INTRO_DUR = 1.2;        /* segundos da entrada do título 1 */

    function splitLetters(node, out) {
        var kids = Array.prototype.slice.call(node.childNodes);
        for (var k = 0; k < kids.length; k++) {
            var ch = kids[k];
            if (ch.nodeType === 3) {
                var frag = document.createDocumentFragment();
                var partes = ch.textContent.split(/(\s+)/);
                for (var p = 0; p < partes.length; p++) {
                    var part = partes[p];
                    if (part === '') continue;
                    if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
                    var word = document.createElement('span');
                    word.className = 'word';
                    for (var c = 0; c < part.length; c++) {
                        var span = document.createElement('span');
                        span.className = 'ltr';
                        span.textContent = part[c];
                        word.appendChild(span);
                        out.push(span);
                    }
                    frag.appendChild(word);
                }
                node.replaceChild(frag, ch);
            } else if (ch.nodeType === 1) {
                splitLetters(ch, out);
            }
        }
    }

    /* disparo escalonado da esquerda pra direita, na ordem de leitura */
    function stagger(arr) {
        return arr.map(function (_, i) {
            return arr.length > 1 ? (i / (arr.length - 1)) * (1 - LETTER_WINDOW) : 0;
        });
    }

    var letters = [];  splitLetters(titleEl, letters);
    var letterStart = stagger(letters);
    var letters2 = []; if (newTitle) splitLetters(newTitle, letters2);
    var letterStart2 = stagger(letters2);

    /* ── Gradiente CONTÍNUO pelo título: cada letra mostra a fatia do
         gradiente do título inteiro. Sem isso cada letra teria o gradiente
         completo dentro dela e o texto ficaria listrado. ── */
    function paintGrad(node, arr) {
        if (!node) return;
        var tr = node.getBoundingClientRect();
        for (var i = 0; i < arr.length; i++) {
            var el = arr[i];
            var x = el.getBoundingClientRect().left - tr.left;
            el.style.backgroundSize = tr.width + 'px 100%';
            el.style.backgroundPosition = (-x) + 'px 0';
        }
    }
    function paintGradient() {
        paintGrad(titleEl, letters);
        paintGrad(newTitle, letters2);
    }

    /* lede e detalhe ancoram no rodapé do título, que muda de altura
       conforme a largura da tela */
    function positionLede() {
        var b = titleEl.getBoundingClientRect().bottom + 'px';
        if (ledeWrap) ledeWrap.style.top = b;
        if (detailWrap) detailWrap.style.top = b;
    }

    function revelar() {
        positionLede();
        paintGradient();
        if (titleWrap) titleWrap.style.visibility = 'visible';
        if (ledeWrap) ledeWrap.style.visibility = 'visible';
        if (detailWrap) detailWrap.style.visibility = 'visible';
    }

    /* ── Quem pediu menos movimento recebe o hero parado: uma tela, tudo
         visível, sem os 300vh de scroll e sem animação de letra. ── */
    var semMovimento = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (semMovimento) {
        hero.classList.add('hero--estatico');
        for (var a = 0; a < letters.length; a++) {
            letters[a].style.opacity = 1;
            letters[a].style.transform = 'none';
        }
        revelar();
        window.addEventListener('resize', paintGradient);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(paintGradient);
        return;
    }

    var i;
    for (i = 0; i < letters.length; i++) letters[i].style.opacity = 0;
    for (i = 0; i < letters2.length; i++) letters2[i].style.opacity = 0;
    if (heroDetail) heroDetail.style.opacity = 0;

    window.addEventListener('resize', function () { positionLede(); paintGradient(); });
    window.addEventListener('load', revelar);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(revelar);
    } else {
        revelar();
    }
    setTimeout(revelar, 1500);   /* rede de segurança */

    /* ── Loop ────────────────────────────────────────────────────────── */
    var tempo = 0;
    var scrollPx = 0;   /* scroll suavizado: é o lerp que dá o arrasto */

    function suave(t) {
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        return t * t * (3 - 2 * t);
    }
    function faixa(v, ini, fim) { return suave((v - ini) / (fim - ini)); }

    function frame() {
        tempo += 0.016;
        scrollPx += (window.scrollY - scrollPx) * 0.12;

        var VH = window.innerHeight;
        var MID = (128 + VH) / 2;

        /* (1) título 1: entra por tempo no load, sai pelo scroll */
        var introP = Math.min(1, tempo / INTRO_DUR);
        var tp = faixa(scrollPx, 128, VH);
        for (var i = 0; i < letters.length; i++) {
            var entra = suave((introP - letterStart[i]) / LETTER_WINDOW);
            var sai   = suave((tp - letterStart[i]) / LETTER_WINDOW);
            letters[i].style.opacity = entra * (1 - sai);
            letters[i].style.transform = 'translateY(' + (24 * (1 - entra) - 128 * sai) + 'px)';
        }
        /* fora de cena, tira do paint: só opacity 0 deixaria fantasma de
           compositing (as .ltr têm will-change), e display:none quebraria a
           medição que o positionLede() faz. */
        titleEl.style.visibility = tp >= 1 ? 'hidden' : 'visible';

        /* (2) lede e botões saem juntos, pra lados opostos */
        var lc = faixa(scrollPx, MID, VH);
        if (heroLede) {
            heroLede.style.opacity = 1 - lc;
            heroLede.style.transform = 'translateX(' + (-128 * lc) + 'px)';
        }
        if (heroCtas) {
            heroCtas.style.opacity = 1 - lc;
            heroCtas.style.transform = 'translateX(' + (128 * lc) + 'px)';
            heroCtas.style.pointerEvents = lc > 0.5 ? 'none' : 'auto';
        }

        /* (3) título 2 entra letra a letra, depois que o primeiro saiu */
        var ntp = faixa(scrollPx, VH, VH * 1.6);
        for (var j = 0; j < letters2.length; j++) {
            var v = suave((ntp - letterStart2[j]) / LETTER_WINDOW);
            letters2[j].style.opacity = v;
            letters2[j].style.transform = 'translateY(' + (24 * (1 - v)) + 'px)';
        }
        if (newTitle) newTitle.style.visibility = ntp > 0 ? 'visible' : 'hidden';

        /* (4) detalhe sobe, logo atrás do título 2 */
        if (heroDetail) {
            var dp = faixa(scrollPx, VH * 1.2, VH * 1.8);
            heroDetail.style.opacity = dp;
            heroDetail.style.transform = 'translateY(' + (64 * (1 - dp)) + 'px)';
        }

        /* (5) saída de cena. No aichampion o canvas de preenchimento cobria
           tudo aqui; sem ele, os blocos fixos precisam sair sozinhos, senão
           ficariam parados por cima da próxima seção. */
        var ep = faixa(scrollPx, VH * 2, VH * 2.8);
        var resta = 1 - ep;
        if (titleWrap) {
            titleWrap.style.opacity = resta;
            titleWrap.style.visibility = ep >= 1 ? 'hidden' : 'visible';
        }
        if (detailWrap) {
            detailWrap.style.opacity = resta;
            detailWrap.style.visibility = ep >= 1 ? 'hidden' : 'visible';
        }
        if (brand) brand.style.opacity = 0.5 * resta;   /* a marca vive em 0.5 */
        /* A canoa NÃO acompanha o vídeo: nem no deslocamento nem na
           opacidade. Ela é luz presa à borda da tela e precisa continuar
           acesa durante o título 2 e o texto do estudo. Sai só no fim,
           junto com o resto (fase 5). */
        if (canoa) canoa.style.opacity = resta;

        /* (6) o fundo sai junto com o primeiro bloco, na MESMA faixa em que
           o título 1, o lede e os botões saem: sobe e esmaece, em vez de
           ficar parado até o fim do hero. O translateX(-50%) da centragem
           tem que ser reescrito aqui, senão o transform novo o apaga e o
           fundo pula pra direita. */
        var fundoY = -128 * tp;
        var fundoOp = (1 - tp) * resta;
        if (video) {
            video.style.transform = 'translateX(-50%) translateY(' + fundoY + 'px)';
            video.style.opacity = fundoOp;
        }
        /* O véu é solidário ao vídeo: mesmo deslocamento, mesma caixa. Na
           opacidade ele NÃO acompanha o esmaecimento do vídeo (fica em 1
           durante o primeiro scroll) e só sai no fim do hero, junto com o
           resto, via `resta`. */
        if (scrim) {
            scrim.style.transform = 'translateX(-50%) translateY(' + fundoY + 'px)';
            scrim.style.opacity = resta;
        }

        /* o indicador de scroll some assim que o scroll começa */
        if (hint) hint.style.opacity = 1 - faixa(scrollPx, 0, VH * 0.3);

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();
