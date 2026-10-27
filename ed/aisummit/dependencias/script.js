/* ══════════════════════════════════════════════════════════════════════
   AI SUMMIT
   ══════════════════════════════════════════════════════════════════════ */

/* Ouve a troca de uma media query (a janela cruzou o breakpoint). Safari
   antigo só tem addListener. As funções ouvintes leem mq.matches na hora
   (não o evento), então servem pros dois disparos. */
function ouvirMq(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
    // Reforço: o change da media query sai no ciclo de renderização, que
    // alguns navegadores atrasam; no resize a troca já é conferida. As
    // funções ouvintes só agem quando o estado muda de fato.
    window.addEventListener('resize', fn);
}

/* ── Carrossel do header ───────────────────────────────────────────────
   Os cards ficam parados lado a lado; cada um é um rolo de caça-níquel.
   Em cada rodada todos disparam juntos e param na próxima foto, um depois
   do outro, da esquerda pra direita. Quando o último para, ficam parados
   3s e vem a próxima rodada, sem fim. O movimento está na keyframe
   ais-midia-roleta do CSS; aqui o ritmo e as fotos.

   Cada rolo é uma tira de fotos coladas: a anterior (aparece no puxão),
   a da vez e as PASSOS seguintes. Cada rolo dura PARADA_S a mais que o
   anterior. Quando para, as fotos que passaram vão pro fim da tira e o
   transform volta ao repouso, que mostra a mesma foto. Nada salta.

   As fotos vêm do HTML (6 cards). Cards suficientes pra chegar na borda
   direita da tela (o último sangra e é cortado). O passo entre as fotos de
   cards vizinhos garante que dois cards parados nunca mostram a mesma
   foto. Pausa com a aba oculta e com o header fora da tela;
   com prefers-reduced-motion os cards ficam parados. */
(function () {
    var trilha = document.querySelector('.ais-midia-trilha');
    if (!trilha) return;

    var fotos = [].map.call(trilha.querySelectorAll('.ais-midia-foto'), function (img) {
        return img.getAttribute('src');
    });
    var molde = trilha.querySelector('.ais-midia-foto');
    var total = fotos.length;
    if (!total) return;
    var parado = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hero = document.querySelector('.ais-hero');
    var ESPERA_MS = 3000;  // parado entre uma rodada e outra
    var GIRO_S = 1;        // duração do giro do 1º rolo
    var PARADA_S = 0.3;    // cada rolo para esse tanto depois do anterior
    var PASSOS = 1;        // fotos que cada rolo anda por rodada
    var slots = [];
    var girando = 0;
    var proxima = null;
    var pendente = false;
    var naTela = true;

    function pausado() {
        return document.hidden || !naTela;
    }

    function src(i) {
        return fotos[((i % total) + total) % total];
    }

    // Reescreve a tira a partir da foto da vez (a 2ª da tira). Só troca o
    // src que mudou: a foto que fica na janela não pisca.
    function preencher(slot) {
        var imgs = slot.pilha.children;
        for (var d = 0; d < imgs.length; d++) {
            var novo = src(slot.atual - 1 + d);
            if (imgs[d].getAttribute('src') !== novo) imgs[d].src = novo;
        }
    }

    function quantos() {
        var card = trilha.firstElementChild;
        var gap = parseFloat(getComputedStyle(trilha).columnGap) || 0;
        var passo = card.offsetWidth + gap;
        var inicio = trilha.getBoundingClientRect().left;
        return Math.max(1, Math.min(total, Math.ceil((window.innerWidth - inicio) / passo)));
    }

    function montar(n) {
        // Com até total/n fotos de distância entre vizinhos, o card que já
        // girou nunca alcança a foto do seguinte. Com mais cards que isso
        // permite, a distância é -1: as fotos andam um card pra direita a
        // cada volta, e também nunca repetem.
        var salto = Math.floor(total / n) >= 2 ? Math.floor(total / n) : -1;
        trilha.textContent = '';
        slots = [];
        for (var s = 0; s < n; s++) {
            var card = document.createElement('div');
            card.className = 'ais-midia-card';
            // A janela corta o rolo; o card fica sem corte pras linhas do
            // grid (::before e ::after) passarem pra fora dele.
            var janela = document.createElement('div');
            janela.className = 'ais-midia-janela';
            card.appendChild(janela);
            var pilha = document.createElement('div');
            pilha.className = 'ais-midia-pilha';
            for (var d = 0; d < PASSOS + 2; d++) pilha.appendChild(molde.cloneNode(false));
            pilha.style.setProperty('--ais-n', PASSOS + 2);
            pilha.style.setProperty('--ais-passos', PASSOS);
            pilha.style.setProperty('--ais-dur', (GIRO_S + s * PARADA_S) + 's');
            janela.appendChild(pilha);
            trilha.appendChild(card);
            var slot = { pilha: pilha, atual: s * salto };
            preencher(slot);
            slots.push(slot);
        }
        clearTimeout(proxima);
        girando = 0;
        if (!parado) proxima = setTimeout(rodada, ESPERA_MS);
    }

    // Rodada: todos os rolos disparam juntos.
    function rodada() {
        proxima = null;
        if (pausado()) { pendente = true; return; }
        girando = slots.length;
        slots.forEach(function (slot) {
            slot.pilha.classList.add('is-girando');
        });
    }

    // Rolo parado na foto seguinte (a última da tira): a tira é refeita
    // a partir dela e o transform volta ao repouso, que mostra a mesma
    // foto. Quando o último rolo para, a rodada fica parada ESPERA_MS e
    // começa a próxima.
    trilha.addEventListener('animationend', function (e) {
        var pilha = e.target;
        if (!pilha.classList || !pilha.classList.contains('is-girando')) return;
        var slot = null;
        for (var s = 0; s < slots.length; s++) if (slots[s].pilha === pilha) slot = slots[s];
        if (!slot) return;
        slot.atual += PASSOS;
        // As fotos que já passaram vão pro fim da tira: a que está na
        // janela vira a 2ª sem trocar de src (não pisca).
        for (var k = 0; k < PASSOS; k++) pilha.appendChild(pilha.firstElementChild);
        preencher(slot);
        pilha.classList.remove('is-girando');
        if (--girando === 0) proxima = setTimeout(rodada, ESPERA_MS);
    });

    var n = quantos();
    montar(n);

    var espera = null;
    window.addEventListener('resize', function () {
        clearTimeout(espera);
        espera = setTimeout(function () {
            var novo = quantos();
            if (novo !== n) montar(n = novo);
        }, 200);
    });

    if (parado) return;

    // Pausado: o giro em andamento congela (CSS) e a rodada que venceu
    // durante a pausa espera a volta.
    function pausa() {
        trilha.classList.toggle('is-pausado', pausado());
        if (!pausado() && pendente) {
            pendente = false;
            rodada();
        }
    }
    document.addEventListener('visibilitychange', pausa);
    if (hero && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entradas) {
            naTela = entradas[0].isIntersecting;
            pausa();
        }).observe(hero);
    }
})();

/* ── Aparelho fraco ─────────────────────────────────────────────────────
   Pouca memória ou poucos núcleos: liga .ais-leve no <html>. O CSS tira
   o blur animado do header. Os dois dados
   são estimativas do navegador (deviceMemory só existe no Chrome). */
(function () {
    var mem = navigator.deviceMemory, nucleos = navigator.hardwareConcurrency;
    if ((mem && mem <= 4) || (nucleos && nucleos <= 4)) {
        document.documentElement.classList.add('ais-leve');
    }
})();

/* ── Vídeo do header: versão e carregamento ────────────────────────────
   Até 864 usa a versão de 964x240 (~580 KB) em vez da de 1926x480
   (~1,5 MB). O vídeo só carrega depois do load da página, pra não disputar
   banda com CSS, fontes e imagens. A versão acompanha a tela: se a janela
   cruzar 864 depois de aberta, o arquivo é trocado (sem repetir a entrada:
   ver comMetadados no efeito de scroll). */
(function () {
    var video = document.querySelector('.ais-hero-video');
    if (!video) return;
    var mq = window.matchMedia('(max-width: 864px)');
    // Poster só com prefers-reduced-motion (vídeo parado no 1º quadro).
    // Com o efeito, o vídeo entra a partir do quadro preto: o poster nem
    // chegaria a aparecer.
    var parado = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var carregado = false;

    function aplicar() {
        var m = mq.matches;
        if (parado) video.poster = video.getAttribute(m ? 'data-poster-mobile' : 'data-poster');
        if (!carregado) return;
        var src = video.getAttribute(m ? 'data-src-mobile' : 'data-src');
        if (video.getAttribute('src') !== src) {
            video.src = src;
            video.load();
        }
    }
    function carregar() {
        carregado = true;
        aplicar();
    }

    aplicar();
    ouvirMq(mq, aplicar);
    if (document.readyState === 'complete') carregar();
    else window.addEventListener('load', carregar, { once: true });
})();

/* ── Efeito de scroll do header ────────────────────────────────────────
   O vídeo não toca sozinho: o scroll escolhe o quadro. --ais-p vai de 0
   (topo) a 1 (depois de 75% da altura do header): escolhe o quadro do
   vídeo e o CSS usa ele pra afastar o conteúdo do header pros lados. --ais-q
   faz a seção seguinte subir e aparecer conforme entra na tela.
   Com prefers-reduced-motion não liga: vídeo parado no 1º quadro. */
(function () {
    var hero = document.querySelector('.ais-hero');
    var video = document.querySelector('.ais-hero-video');
    var temas = document.querySelector('.ais-temas');
    var cards = temas ? [].slice.call(temas.querySelectorAll('.ais-tema')) : [];
    if (!hero || !video) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.documentElement.classList.add('ais-fx');

    var mobile = window.matchMedia('(max-width: 864px)');
    var itens = [].slice.call(hero.querySelectorAll(
        '.ais-logo, .ais-hero-texto, .ais-hero-data, .ais-hero-local, .ais-hero-acao, .ais-hero-midia, .ais-saber-mais'));

    var duracao = 0;
    var tempoAtual = -1;
    var pendente = false;

    // Entrada do vídeo: do último quadro (preto) até o quadro do scroll,
    // as raízes crescendo. inicioEntrada fica null até o vídeo estar pronto.
    var ENTRADA = 2400;
    var inicioEntrada = null;
    var emEntrada = false;
    var entradaArmada = false;

    function limitar(v) { return Math.min(1, Math.max(0, v)); }

    function atualizar() {
        pendente = false;
        // Até 864 o header é mais alto que a tela: o vídeo (fixo no topo)
        // se recolhe ao longo da primeira tela de scroll, enquanto é visto.
        var distancia = (mobile.matches ? window.innerHeight : hero.offsetHeight) * 0.75;
        var p = limitar(window.scrollY / distancia);
        hero.style.setProperty('--ais-p', p.toFixed(4));
        // Compensa o scroll até o fim do efeito: o conteúdo do header fica
        // parado na tela (o CSS só usa isso acima de 864).
        hero.style.setProperty('--ais-y', Math.min(Math.max(window.scrollY, 0), distancia).toFixed(1) + 'px');

        // Busca de quadro só quando muda ao menos meio quadro (24fps).
        if (duracao) {
            var fim = duracao - 0.05;
            var t = p * fim;
            // --ais-v: deslocamento vertical do vídeo (1 = 100% acima da
            // tela, 0 = no lugar). Na saída acompanha o scroll (sobe com as
            // raízes se recolhendo); na entrada vem de 1 até o valor do
            // scroll (desce com as raízes crescendo).
            // Sobe na metade da velocidade do scroll e acelera no fim pra
            // sair inteiro da tela (100% acima) antes de ser escondido em
            // p = 1: sem corte seco, mesmo quando só o poster carregou.
            // 0.5p + 0.5p^4: ~metade da velocidade até uns 60% do efeito.
            var v = 0.5 * p + 0.5 * Math.pow(p, 4);
            if (emEntrada) {
                // Antes da busca inicial terminar, fica parado no fim (preto).
                var k = inicioEntrada === null ? 0 : limitar((performance.now() - inicioEntrada) / ENTRADA);
                var e = 1 - Math.pow(1 - k, 3);   // desacelera no fim
                t = fim + (t - fim) * e;
                v = 1 + (v - 1) * e;
                if (k >= 1) emEntrada = false;
            }
            video.style.setProperty('--ais-v', v.toFixed(4));
            if (Math.abs(t - tempoAtual) > 1 / 48) {
                video.currentTime = t;
                tempoAtual = t;
            }
        }
        // Totalmente apagado: some de vez (não pinta por baixo da página).
        video.style.visibility = p >= 1 ? 'hidden' : '';

        // Até 864: cada item esmaece pela própria posição (o header é mais
        // alto que a tela). Começa quando a base dele sobe acima da metade
        // da tela (ou de onde ela já estava no topo da página, se for mais
        // alto: no topo tudo aparece inteiro) e chega a 0 quando sai pelo
        // topo. --ais-fm, pra não brigar com o --ais-f do CSS acima de 864.
        if (mobile.matches) {
            var metade = window.innerHeight * 0.5;
            itens.forEach(function (el) {
                var base = el.getBoundingClientRect().bottom;
                var inicio = Math.min(metade, base + window.scrollY);
                var f = inicio > 0 ? limitar((inicio - base) / inicio) : 1;
                el.style.setProperty('--ais-fm', f.toFixed(4));
            });
        }

        if (temas) {
            var topo = temas.getBoundingClientRect().top;
            var q = limitar((window.innerHeight - topo) / (window.innerHeight * 0.6));
            temas.style.setProperty('--ais-q', q.toFixed(4));

            // Cada card entra pelo seu lado: começa quando o topo dele
            // aparece embaixo da tela e termina quando chega à metade.
            cards.forEach(function (card) {
                var c = limitar((window.innerHeight - card.getBoundingClientRect().top) / (window.innerHeight * 0.5));
                card.style.setProperty('--ais-c', c.toFixed(4));
            });
        }
    }

    function agendar() {
        if (pendente) return;
        pendente = true;
        requestAnimationFrame(atualizar);
    }

    // Assim que os metadados chegam, o vídeo vai pro último quadro (preto,
    // igual ao fundo) antes de pintar qualquer imagem: não precisa ser
    // escondido (escondido, o navegador pode nem decodificar). Terminada
    // essa busca, a entrada corre o tempo de volta até o quadro do scroll.
    function comMetadados() {
        duracao = video.duration || 0;
        if (!duracao) return;
        // Troca de versão (a janela cruzou 864): a entrada não se repete,
        // o arquivo novo só retoma o quadro do scroll.
        if (entradaArmada) {
            tempoAtual = -1;
            atualizar();
            return;
        }
        entradaArmada = true;
        emEntrada = true;
        tempoAtual = -1;
        video.addEventListener('seeked', function () {
            inicioEntrada = performance.now();
            requestAnimationFrame(lacoEntrada);
        }, { once: true });
        atualizar();   // com inicioEntrada null, busca o último quadro
    }
    if (video.readyState >= 1) comMetadados();
    else video.addEventListener('loadedmetadata', comMetadados);

    // Laço da entrada: atualiza a cada quadro até ela terminar.
    function lacoEntrada() {
        atualizar();
        if (emEntrada) requestAnimationFrame(lacoEntrada);
    }
    // iOS só pinta quadros buscados depois de o vídeo ter tocado uma vez:
    // toca e pausa na hora (muted, então é permitido).
    video.addEventListener('loadeddata', function () {
        var r = video.play();
        if (r && r.then) r.then(function () { video.pause(); tempoAtual = -1; atualizar(); }).catch(function () {});
    }, { once: true });

    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    atualizar();
})();

/* ── Reveal: a .ais-presencial sobe por cima da .ais-temas ───────────
   A .ais-temas é sticky com top = 100vh - altura dela (CSS); aqui a altura
   real vai pra --ais-temas-altura, atualizada quando ela muda de tamanho
   (conteúdo, fontes, breakpoint) e quando a tela muda (barra do navegador
   no celular, rotação, janela). Mesmo esquema do /ed/formacoes/. */
/* O mesmo pra .ais-presencial (presa pela base enquanto os palestrantes
   sobem por cima), em --ais-pres-altura. */
[['.ais-temas-trilho .ais-temas', '--ais-temas-altura'],
 ['.ais-presencial-trilho .ais-presencial', '--ais-pres-altura']].forEach(function (par) {
    var sec = document.querySelector(par[0]);
    if (!sec) return;
    function atualizar() {
        sec.style.setProperty(par[1], sec.offsetHeight + 'px');
    }
    atualizar();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(atualizar).observe(sec);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', atualizar);
    window.addEventListener('resize', atualizar);
    window.addEventListener('orientationchange', atualizar);
});

/* ── Mosaico do presencial até 864: faixas que andam com o scroll ──────
   Cada par de fotos é uma faixa de 200% (2 fotos de 100%). Enquanto ela
   atravessa a tela, anda meia faixa na horizontal: a 1ª da 1ª foto pra 2ª
   (pra esquerda), a 2ª no sentido contrário (da 2ª pra 1ª, pra direita). O
   movimento acontece no miolo da passagem (de 15% a 85%), com ease, e fica
   parado antes e depois. Acima de 864, e com prefers-reduced-motion, sem
   transform (as faixas nem são caixas no desktop). */
(function () {
    var pares = [].slice.call(document.querySelectorAll('.ais-presencial-par'));
    if (!pares.length) return;
    var mq = window.matchMedia('(max-width: 864px)');
    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
    var itens = pares.map(function (p) {
        return { par: p, faixa: p.querySelector('.ais-presencial-faixa'), dir: p.classList.contains('ais-presencial-par--dir') };
    });
    var pendente = false;
    function suave(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function atualizar() {
        pendente = false;
        var ativo = mq.matches && !reduz.matches;
        var vh = window.innerHeight;
        itens.forEach(function (it) {
            if (!ativo) { it.faixa.style.transform = ''; return; }
            var r = it.par.getBoundingClientRect();
            // 0 quando o topo entra pela base da tela, 1 quando a base sai pelo topo
            var p = (vh - r.top) / (vh + r.height);
            var t = suave(Math.min(1, Math.max(0, (p - 0.15) / 0.7)));
            var x = it.dir ? -50 * (1 - t) : -50 * t;   // % da faixa (200%)
            it.faixa.style.transform = 'translate3d(' + x.toFixed(3) + '%, 0, 0)';
        });
    }
    function agendar() { if (!pendente) { pendente = true; requestAnimationFrame(atualizar); } }
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    if (mq.addEventListener) mq.addEventListener('change', agendar); else if (mq.addListener) mq.addListener(agendar);
    atualizar();
})();

/* ── Mosaico do presencial acima de 864: a última foto cresce ─────────
   Presa no topo (sticky, 0), ela cresce enquanto a pista logo abaixo
   passa: --cresce vai de 0 (quando ela engata no topo) a 1 (quando a pista
   termina e ela volta a subir com a seção). Com ease. Até 864 e com
   prefers-reduced-motion, fica em 0.
   A seção fica presa pela base (os palestrantes sobem por cima) assim que
   a base dela chega à base da tela, e aí nada mais anda. Por isso a pista
   tem o comprimento que faz o crescimento (70% da tela) acabar exatamente
   nesse ponto: 70% + 100% da tela - a foto - o padding de baixo da seção,
   no mínimo 70% (telas baixas). Com a pista fixa em 70vh, em telas altas
   a seção prendia antes e a foto parava no meio (a 1080 em 78%). */
(function () {
    var foto = document.querySelector('.ais-presencial-foto--final');
    var pista = document.querySelector('.ais-presencial-pista');
    var secao = document.querySelector('.ais-presencial');
    if (!foto || !pista || !secao) return;
    var mq = window.matchMedia('(min-width: 865px)');
    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
    var pendente = false;
    function suave(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function atualizar() {
        pendente = false;
        if (!mq.matches) { pista.style.height = ''; foto.style.removeProperty('--cresce'); return; }
        var vh = window.innerHeight, curso = vh * 0.7;
        var baixo = parseFloat(getComputedStyle(secao).paddingBottom) || 0;
        var h = Math.round(Math.max(curso, curso + vh - foto.offsetHeight - baixo)) + 'px';
        if (pista.style.height !== h) pista.style.height = h;
        if (reduz.matches) { foto.style.removeProperty('--cresce'); return; }
        var topo = parseFloat(getComputedStyle(foto).top) || 0;
        var engate = topo + foto.offsetHeight;                // base da foto presa
        var r = pista.getBoundingClientRect();
        // Começa quando ela engata; termina 70% da tela depois (quando a
        // seção prende) ou no fim da página, o que vier antes.
        var y = window.scrollY;
        var ini = r.top + y - engate;
        var fim = Math.min(ini + curso, document.documentElement.scrollHeight - window.innerHeight);
        var t = fim > ini ? Math.min(1, Math.max(0, (y - ini) / (fim - ini))) : 0;
        foto.style.setProperty('--cresce', suave(t).toFixed(4));
    }
    function agendar() { if (!pendente) { pendente = true; requestAnimationFrame(atualizar); } }
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    if (mq.addEventListener) mq.addEventListener('change', agendar); else if (mq.addListener) mq.addListener(agendar);
    atualizar();
})();

/* ── Texto do presencial esmaece com o scroll ──────────────────────────
   Começa quando o texto prende no topo (a seção chega ao topo da tela) e
   chega a 0 no fim do scroll da seção: acima de 864, quando a última foto
   termina de crescer (a base do mosaico na base da foto presa); até 864,
   quando o fim do mosaico chega ao fim da tela. Ou no fim da página, se
   ela acabar antes. Linear, preso ao scroll. */
(function () {
    var secao = document.querySelector('.ais-presencial');
    var texto = document.querySelector('.ais-presencial-texto');
    var mosaico = document.querySelector('.ais-presencial-mosaico');
    var final = document.querySelector('.ais-presencial-foto--final');
    if (!secao || !texto || !mosaico) return;
    var mq = window.matchMedia('(min-width: 865px)');
    var pendente = false;
    function atualizar() {
        pendente = false;
        var y = window.scrollY;
        var ini = secao.getBoundingClientRect().top + y;
        var base = mosaico.getBoundingClientRect().bottom + y;
        var ate = mq.matches && final ? final.offsetHeight : window.innerHeight;
        // e no máximo quando a seção prende pela base (base + padding de
        // baixo na base da tela): dali em diante ela não anda mais
        var prende = base + (parseFloat(getComputedStyle(secao).paddingBottom) || 0) - window.innerHeight;
        var fim = Math.min(base - ate, prende, document.documentElement.scrollHeight - window.innerHeight);
        var t = fim > ini ? Math.min(1, Math.max(0, (y - ini) / (fim - ini))) : 0;
        texto.style.opacity = (1 - t).toFixed(3);
    }
    function agendar() { if (!pendente) { pendente = true; requestAnimationFrame(atualizar); } }
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    window.addEventListener('load', agendar);
    if (mq.addEventListener) mq.addEventListener('change', agendar); else if (mq.addListener) mq.addListener(agendar);
    atualizar();
})();

/* ── Palestrantes com o scroll ────────────────────────────────────────
   palestrantes-01 -> 02 -> 03.pdf. Com .is-sequencia (sem reduced motion;
   todas as larguras) a seção é um trilho de 760svh com o palco preso
   (100svh). Ela sobe por cima do fim da .ais-presencial com a raiz
   inteira (fase4) e, contando em telas desde que o topo dela chega ao
   topo da tela:
     0 a 1,25: os níveis da raiz se recolhem, do mais fino ao mais grosso,
       um de cada vez (cada um só depois do filho terminar), até sobrar só
       o símbolo (01);
     1,25 a 2: o símbolo desce meia altura; junto, o branco dá lugar às
       fotos do Leo (até 1,5) e as fotos já sobem, com o Leo saindo por
       cima do símbolo, inteiro quando ele termina de descer (02 -> 03);
       o título/texto e o nome/descrição chegam pelos lados (1,4 a 2);
     2 a 2,3: parado;
     2,3 a 3,2, 3,8 a 4,7 e 5,3 a 6,2: trocas pelo palestrante seguinte
       (Sayuri, Alison e Iago, a cada 1,5 tela): o seguinte aparece por cima do atual com o topo da foto
       no topo do símbolo (como o 1º em 02) e sobe até sair por cima dele,
       enquanto o atual esmaece parado no lugar; o
       nome do atual sobe esmaecendo e o do seguinte sobe aparecendo (o
       do 1º, na primeira vez, chega pela direita);
     6,2 a 6,6: parado, até a seção acabar.
   O CSS faz tudo a partir das variáveis (ver o bloco PALESTRANTES). Sem
   o script, ou com reduced motion, fica o fim do 1º (03). */
(function () {
    var sec = document.querySelector('.ais-profs');
    var palco = sec && sec.querySelector('.ais-profs-palco');
    if (!palco) return;
    var quadros = [].slice.call(sec.querySelectorAll('.ais-profs-quadro'));
    var nomes = [].slice.call(sec.querySelectorAll('.ais-profs-quem'));
    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
    var VARS = ['--ais-r4', '--ais-r3', '--ais-r2', '--ais-r1', '--ais-pf-desce', '--ais-pf-fotos', '--ais-pf-texto'];
    // [início, fim] de cada fase, em telas. Os níveis da raiz em fila: cada
    // um só começa quando o filho (o mais fino, preso na ponta dele)
    // terminou de recolher. Logo que acaba, o símbolo desce e, ao mesmo
    // tempo, as fotos entram e o Leo já sobe pra fora da máscara, inteiro
    // quando o símbolo termina de descer.
    var FASES = [[0, 0.3], [0.3, 0.6], [0.6, 0.9], [0.9, 1.25], [1.25, 2], [1.25, 1.5], [1.4, 2]];
    var SOBE = [1.25, 2];       // o 1º palestrante sai por cima do símbolo
    var TROCA = 2.3, PASSO = 1.5; // início da 1ª troca e distância entre elas
    var pendente = false;
    function lim(t) { return Math.min(1, Math.max(0, t)); }
    function suave(t) { t = lim(t); return t * t * (3 - 2 * t); }
    function fase(p, a, b) { return suave((p - a) / (b - a)); }
    function limpar() {
        VARS.concat('--ais-pf-fundo', '--ais-pf-escuro').forEach(function (n) { sec.style.removeProperty(n); });
        quadros.concat(nomes).forEach(function (el) {
            el.style.removeProperty('--ais-pf-pos');
            el.style.removeProperty('--ais-pf-o');
            el.style.removeProperty('--ais-pf-q');
            el.style.removeProperty('--ais-pf-dx');
            el.style.removeProperty('--ais-pf-dy');
        });
    }
    function atualizar() {
        pendente = false;
        var seq = !reduz.matches;
        sec.classList.toggle('is-sequencia', seq);
        if (!seq) { limpar(); return; }
        var vh = palco.offsetHeight;
        var p = -sec.getBoundingClientRect().top / vh;
        // fundo: transparente enquanto ela sobe; só depois de presa (topo
        // da seção no topo da tela) vai a --bw, em 0,3 tela de scroll (junto
        // com o recolhimento do 1º nível da raiz)
        sec.style.setProperty('--ais-pf-fundo', lim(p / 0.3).toFixed(4));
        // painel: --pc400 a --bb, linear, de presa até o fim do scroll dela
        sec.style.setProperty('--ais-pf-escuro', lim(p / (sec.offsetHeight / vh - 1)).toFixed(4));
        VARS.forEach(function (n, i) {
            sec.style.setProperty(n, fase(p, FASES[i][0], FASES[i][1]).toFixed(4));
        });
        // Palestrantes: posição das fotos (1 embaixo, 0 no topo do símbolo,
        // -1 saindo por cima) e o nome (opacidade e deslocamento: o 1º chega
        // pela direita; nas trocas, os nomes sobem, o que sai esmaecendo e o
        // que entra aparecendo).
        quadros.forEach(function (q, i) {
            var pos, entra, dx = 0, dy = 0;
            if (i === 0) {
                pos = -fase(p, SOBE[0], SOBE[1]);
                entra = fase(p, FASES[6][0], FASES[6][1]);
                dx = (1 - entra) * 48;
            } else {
                var t = TROCA + (i - 1) * PASSO;
                pos = -fase(p, t, t + 0.9);
                entra = fase(p, t + 0.4, t + 0.9);
                dy = (1 - entra) * 48;
            }
            // o seguinte aparece (esmaece pra dentro) no começo da subida
            var aparece = i === 0 ? 1 : fase(p, TROCA + (i - 1) * PASSO, TROCA + (i - 1) * PASSO + 0.4);
            // a saída (se vier outro depois): as fotos ficam no lugar e
            // esmaecem enquanto o seguinte sobe por cima; o nome sobe e some
            var op = 1, sai = 0;
            if (i < quadros.length - 1) {
                var s = TROCA + i * PASSO;
                op = 1 - fase(p, s, s + 0.9);
                sai = fase(p, s, s + 0.4);
                dy -= sai * 48;
            }
            q.style.setProperty('--ais-pf-pos', pos.toFixed(4));
            q.style.setProperty('--ais-pf-o', (op * aparece).toFixed(4));
            if (nomes[i]) {
                nomes[i].style.setProperty('--ais-pf-q', (entra * (1 - sai)).toFixed(4));
                nomes[i].style.setProperty('--ais-pf-dx', dx.toFixed(1) + 'px');
                nomes[i].style.setProperty('--ais-pf-dy', dy.toFixed(1) + 'px');
            }
        });
    }
    function agendar() { if (!pendente) { pendente = true; requestAnimationFrame(atualizar); } }
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    ouvirMq(reduz, agendar);
    atualizar();
})();

/* ── Cronograma: palco preso, palestras rolando dentro da faixa ─────────
   agenda.pdf. Com .is-seq (sem reduced motion; acima de 864) a seção
   é um trilho com o palco preso (100svh): a faixa da grade fica parada e é
   uma janela da altura de uma palestra (a lista corta o resto). As
   palestras rolam dentro dela na mesma velocidade do scroll da página
   (scroll real: cada px de página anda 1 px na lista), desde que o topo
   da seção chega ao topo da tela até a última chegar à faixa; depois, 20%
   da tela parado. Cada uma, pela distância d até a faixa (em alturas
   dela; 0 = encaixada):
     --ais-ag-y: d * altura (a posição);
     --ais-ag-o: esmaece entrando e saindo (1 até |d| 0,1, 0 em |d| 0,7);
     --ais-ag-r: inclinação do número e da foto, 0 na entrada e na saída,
       inteira só encaixada (1 em d 0, 0 em |d| 0,6).
   A altura do trilho vai em --ais-ag-trilho (caminho + 20% da tela). Os
   quadrados de .ais-agenda-pontos acompanham: --ais-ag-ponto (0 a 1) em
   cada um, o quanto a palestra dele está na faixa. Sem o script, ou com reduced motion, ficam
   empilhadas (e os quadrados somem); até 864 também, sem o scroll dentro
   da faixa, mas com a entrada (--ais-ag-o em cada filho e --ais-ag-r no
   número e na foto, de 0 a 1 enquanto cada um sobe pela base da tela, sem
   efeito na saída). */
(function () {
    var sec = document.querySelector('.ais-agenda');
    var lista = sec && sec.querySelector('.ais-agenda-cards');
    var cards = sec ? [].slice.call(sec.querySelectorAll('.ais-agenda-card')) : [];
    if (!lista || !cards.length) return;
    var pontos = [].slice.call(sec.querySelectorAll('.ais-agenda-pontos span'));
    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
    var estreita = window.matchMedia('(max-width: 864px)');
    var VARS = ['--ais-ag-o', '--ais-ag-y', '--ais-ag-r'];
    // a entrada até 864, por elemento: a opacity em cada filho da palestra
    // e a inclinação no número e na foto
    var entra = [];
    cards.forEach(function (c) {
        [].forEach.call(c.children, function (el) { entra.push({ el: el, v: '--ais-ag-o' }); });
        [].forEach.call(c.querySelectorAll('.ais-agenda-num, .ais-agenda-avatar'), function (el) { entra.push({ el: el, v: '--ais-ag-r' }); });
    });
    var pendente = false;
    function lim(t) { return Math.min(1, Math.max(0, t)); }
    function suave(t) { t = lim(t); return t * t * (3 - 2 * t); }
    function atualizar() {
        pendente = false;
        var seq = !reduz.matches && !estreita.matches;
        sec.classList.toggle('is-seq', seq);
        if (!seq) {
            sec.style.removeProperty('--ais-ag-trilho');
            cards.forEach(function (c) { VARS.forEach(function (n) { c.style.removeProperty(n); }); });
            // Até 864 (empilhadas): só a entrada, por elemento (a palestra
            // é mais alta que a tela, então medir pelo topo dela deixava a
            // foto pronta antes de aparecer). Cada filho esmaece e o número
            // e a foto giram de 0 até a inclinação enquanto o centro deles
            // sobe de 90% a 45% da altura da tela (o pé da tela fica atrás
            // da barra de vagas e da arte da flor); saindo por cima fica
            // como está.
            var anima = !reduz.matches, vh = window.innerHeight;
            entra.forEach(function (x) {
                if (!anima) { x.el.style.removeProperty(x.v); return; }
                var r = x.el.getBoundingClientRect();
                x.el.style.setProperty(x.v, suave((vh * 0.9 - (r.top + r.height / 2)) / (vh * 0.45)).toFixed(3));
            });
            return;
        }
        entra.forEach(function (x) { x.el.style.removeProperty(x.v); });
        var alt = lista.offsetHeight;
        var caminho = (cards.length - 1) * alt;
        sec.style.setProperty('--ais-ag-trilho', Math.round(caminho + window.innerHeight * 0.2) + 'px');
        var pos = Math.min(caminho, Math.max(0, -sec.getBoundingClientRect().top)) / alt;
        cards.forEach(function (c, i) {
            var d = i - pos, a = Math.abs(d);
            c.style.setProperty('--ais-ag-y', (d * alt).toFixed(1) + 'px');
            c.style.setProperty('--ais-ag-o', (1 - suave((a - 0.1) / 0.6)).toFixed(3));
            c.style.setProperty('--ais-ag-r', (1 - suave(a / 0.6)).toFixed(3));
        });
        // indicador: cada quadrado acende na proporção em que a palestra
        // dele está na faixa (1 encaixada, 0 a uma faixa de distância)
        pontos.forEach(function (q, i) {
            q.style.setProperty('--ais-ag-ponto', lim(1 - Math.abs(i - pos)).toFixed(3));
        });
    }
    function agendar() { if (!pendente) { pendente = true; requestAnimationFrame(atualizar); } }
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    ouvirMq(reduz, agendar);
    ouvirMq(estreita, agendar);
    atualizar();
})();

/* ── Oferta: entrada em quadrado, título que abre e troca ──────────────
   Layout de ref/inicio.pdf -> ref/fim.pdf. Com .is-forma (sem reduced
   motion; todas as larguras) a seção é um trilho de 400svh com o cartão
   preso (100svh), sobreposto à última tela do cronograma (margem de
   -100svh no CSS). O quanto ela já passou (em telas) guia:
     0 a 0,7: o cronograma fica preso pela base e o painel nasce no meio
       da tela, crescendo de um ponto até um quadrado (0 a 0,3 da fase),
       e abre primeiro na horizontal e depois na vertical até a tela toda
       menos 16 de cada lado; o fundo atrás dele esmaece em --bb; enquanto
       ele abre na horizontal o título entra pelos lados, sem opacity
       ("Garanta" da esquerda, "seu lugar" da direita);
     0,7 a 0,8: o título parado no meio (inicio.pdf);
     0,8 a 2 (p de 0 a 1): as linhas abrem até as bordas do painel (p 0 a
       0,6) e as infos (p 0,25 a 0,65, da esquerda pra direita) e o
       ticket (p 0,35 a 0,75, da direita pra esquerda) entram esmaecendo
       pra dentro (fim.pdf); depois fica parado;
     2 a 3: troca pela próxima seção (.ais-proxima, vazia por enquanto),
       como o workflow da clipo.one: o painel encolhe pro canto de cima à
       esquerda e o da próxima cresce do canto de baixo à direita, os dois
       se tocando pela quina.
   Tudo na unidade da altura da tela (100svh), a mesma do CSS. Em telas
   baixas o cartão pode ser mais alto que a tela (o conteúdo não cabe): a
   diferença (extra) entra no trilho (--ais-of-extra) entre a abertura e a
   troca, e nesse trecho o cartão sobe junto com a página até mostrar a
   base; o quadrado e o título se centram na tela, não no cartão
   (--ais-of-meio), e na troca ele encolhe pelo canto que está à vista.
   A próxima seção também pode passar da tela: a sobra dela rola depois
   da troca (--ais-px-extra), e a da oferta adianta o começo dela
   (--ais-of-extra na margem negativa). Depois da troca a próxima fica
   presa mais MAPA telas: o mapa, que cresceu como quadrado no meio da
   tela (mapa01.pdf), anda e vira o retângulo no lugar dele (mapa02.pdf),
   com as linhas acompanhando, e as infos entram (--ais-px-info). */
(function () {
    var sec = document.querySelector('.ais-oferta');
    var cartao = sec && sec.querySelector('.ais-oferta-cartao');
    if (!cartao) return;
    var ticket = sec.querySelector('.ais-ticket');
    var agenda = document.querySelector('.ais-agenda');
    var trilho = document.querySelector('.ais-agenda-trilho');
    var proxSec = document.querySelector('.ais-proxima');
    var prox = proxSec && proxSec.querySelector('.ais-proxima-cartao');
    var pInner = proxSec && proxSec.querySelector('.ais-proxima-inner');
    var mapa = proxSec && proxSec.querySelector('.ais-mapa');
    var moldura = mapa && mapa.querySelector('.ais-mapa-moldura');
    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
    var FORMA = 0.7, PAUSA = 0.1, RECOLHE = 1, MAPA = 1, BORDA = 16;
    var PX_VARS = ['--ais-of-extra', '--ais-px-extra', '--ais-px-info'];
    var VARS = ['--ais-oferta-fundo', '--ais-of-entra', '--ais-of-abre', '--ais-of-info', '--ais-of-ticket', '--ais-of-extra', '--ais-of-meio'];
    var altura = '', pendente = false;
    function lim(t) { return Math.min(1, Math.max(0, t)); }
    function suave(t) { t = lim(t); return t * t * (3 - 2 * t); }
    function fase(p, a, b) { return suave((p - a) / (b - a)); }
    function mix(a, b, t) { return a + (b - a) * t; }
    function definir(nome, v) { sec.style.setProperty(nome, v.toFixed(3)); }

    // Mapa da próxima seção, de quadrado (e 0, mapa01.pdf) a retângulo (e
    // 1, mapa02.pdf). Tudo em px a partir das medidas sem transform
    // (offset*): a moldura fica no lugar final, deslocada até o meio da
    // tela (tela = a altura visível) e recortada no quadrado do lado menor;
    // as linhas seguem a parte visível (no .ais-mapa, onde ela mora).
    function quadro(e, tela) {
        if (!moldura || !pInner) return;
        var W = moldura.offsetWidth, H = moldura.offsetHeight, lado = Math.min(W, H);
        var l0 = moldura.offsetLeft, t0 = moldura.offsetTop, f = 1 - e;
        var meioX = pInner.offsetLeft + mapa.offsetLeft + l0 + W / 2;
        var meioY = pInner.offsetTop + mapa.offsetTop + t0 + H / 2;
        var tx = (prox.offsetWidth / 2 - meioX) * f, ty = (tela / 2 - meioY) * f;
        var cx = (W - lado) / 2 * f, cy = (H - lado) / 2 * f;
        var v = { tx: tx, ty: ty, cx: cx, cy: cy, l: l0 + tx + cx, t: t0 + ty + cy, w: W - 2 * cx, h: H - 2 * cy };
        for (var n in v) mapa.style.setProperty('--ais-mp-' + n, v[n].toFixed(1) + 'px');
        proxSec.classList.add('is-linhas');
    }

    function atualizar() {
        pendente = false;
        var forma = !reduz.matches;
        sec.classList.toggle('is-forma', forma);
        if (trilho) trilho.classList.toggle('is-forma', forma);
        if (proxSec) proxSec.classList.toggle('is-troca', forma);
        if (!forma) {
            cartao.style.clipPath = '';
            cartao.style.transform = '';
            cartao.style.transformOrigin = '';
            if (prox) prox.style.transform = '';
            if (proxSec) PX_VARS.forEach(function (n) { proxSec.style.removeProperty(n); });
            if (prox) quadro(1, 0);
            VARS.forEach(function (n) { sec.style.removeProperty(n); });
            if (ticket) ticket.style.pointerEvents = '';
            return;
        }
        // Altura do cronograma pro sticky dele (preso com a base na base
        // da tela enquanto a oferta sobe por cima).
        if (agenda) {
            var a = agenda.offsetHeight + 'px';
            if (a !== altura) { agenda.style.setProperty('--ais-agenda-altura', a); altura = a; }
        }
        var alt = cartao.offsetHeight, vw = cartao.offsetWidth;
        var vh = Math.min(alt, window.innerHeight);
        var extra = alt - vh;
        sec.style.setProperty('--ais-of-extra', extra + 'px');
        sec.style.setProperty('--ais-of-meio', (vh / 2 - BORDA) + 'px');
        // a próxima: a sobra da oferta adianta o começo dela (margem) e a
        // dela própria rola depois da troca (altura)
        if (prox) {
            proxSec.style.setProperty('--ais-of-extra', extra + 'px');
            proxSec.style.setProperty('--ais-px-extra', Math.max(0, prox.offsetHeight - vh) + 'px');
        }
        var desce = -sec.getBoundingClientRect().top;

        // Quadrado: nasce de um ponto no meio da tela, cresce até "lado" e
        // abre até a tela menos a borda.
        var e = lim(desce / (vh * FORMA));
        definir('--ais-oferta-fundo', e);
        var en = fase(e, 0, 0.3), eh = fase(e, 0.3, 0.65), ev = fase(e, 0.65, 1);
        var lado = Math.min(240, vw * 0.3) * en;
        var cima = mix((vh - lado) / 2, BORDA, ev), canto = mix((vw - lado) / 2, BORDA, eh);
        var baixo = mix(alt - (vh + lado) / 2, BORDA, ev);
        cartao.style.clipPath = 'inset(' + cima.toFixed(1) + 'px ' + canto.toFixed(1) + 'px ' + baixo.toFixed(1) + 'px)';

        // Título: entra pelos lados enquanto o quadrado abre na horizontal
        // (sem opacity), fica no meio e depois abre com as infos e o ticket.
        definir('--ais-of-entra', eh);
        // o cartão (preso no topo) solta quando a base da seção chega à
        // base dele: a troca acaba aí
        var troca = sec.offsetHeight - alt - vh * RECOLHE;
        var ini = vh * (FORMA + PAUSA), curso = troca - extra - ini;
        var p = curso > 0 ? lim((desce - ini) / curso) : 1;
        definir('--ais-of-abre', fase(p, 0, 0.6));
        definir('--ais-of-info', fase(p, 0.25, 0.65));
        var tv = fase(p, 0.35, 0.75);
        definir('--ais-of-ticket', tv);
        // o ticket é o botão: só clicável depois de aparecer
        if (ticket) ticket.style.pointerEvents = tv > 0.5 ? '' : 'none';

        // Troca pela próxima seção.
        // Antes dela, o que passa da tela sobe com a página (sobe = 0 a
        // extra); a escala é pelo canto de cima à esquerda que está à vista.
        var sobe = Math.min(extra, Math.max(0, desce - (troca - extra)));
        var k = suave((desce - troca) / (vh * RECOLHE));
        cartao.style.transformOrigin = extra ? BORDA + 'px ' + (sobe + BORDA) + 'px' : '';
        cartao.style.transform = (sobe ? 'translateY(' + (-sobe).toFixed(1) + 'px) ' : '') + (k > 0 ? 'scale(' + (1 - k).toFixed(4) + ')' : '');
        if (prox) {
            prox.style.transform = 'translate(' + ((vw - 2 * BORDA) * (1 - k)).toFixed(1) + 'px,' + ((vh - 2 * BORDA) * (1 - k)).toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
            proxSec.classList.toggle('is-aberta', k >= 0.5);
            // Depois da troca (MAPA telas, presa): o mapa vira retângulo
            // (q 0 a 0,6) e as infos entram (q 0,4 a 0,9).
            var q = lim((desce - troca - vh * RECOLHE) / (vh * MAPA));
            quadro(fase(q, 0, 0.6), vh);
            proxSec.style.setProperty('--ais-px-info', fase(q, 0.4, 0.9).toFixed(3));
        }
    }
    function agendar() { if (!pendente) { pendente = true; requestAnimationFrame(atualizar); } }

    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    // a altura do cartão muda quando fontes e imagens chegam (o extra)
    if ('ResizeObserver' in window) {
        var ro = new ResizeObserver(agendar);
        ro.observe(cartao);
        if (prox) ro.observe(prox);
    }
    ouvirMq(reduz, agendar);
    atualizar();
})();

/* ── Ticket da oferta pelo mouse ──
   Com mouse (ponteiro fino, acima de 864, sem reduced motion) o ticket
   ganha .is-mouse e o CSS lê --ais-tk-x/y (-1 a 1): a posição do ponteiro
   na oferta em relação ao centro do ticket, em meias telas. Move o degradê
   e inclina o ticket (skew de até 3.75deg em cada eixo). Fora da seção
   volta ao centro. Sem mouse, o degradê anda sozinho (CSS). */
(function () {
    var sec = document.querySelector('.ais-oferta');
    var ticket = sec && sec.querySelector('.ais-ticket');
    if (!ticket) return;
    var mouse = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 865px)');
    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
    var x = 0, y = 0, pendente = false;
    function lim(t) { return Math.min(1, Math.max(-1, t)); }
    function ligado() { return mouse.matches && !reduz.matches; }
    function pintar() {
        pendente = false;
        ticket.style.setProperty('--ais-tk-x', x.toFixed(3));
        ticket.style.setProperty('--ais-tk-y', y.toFixed(3));
    }
    function agendar() { if (!pendente) { pendente = true; requestAnimationFrame(pintar); } }
    function modo() {
        var on = ligado();
        ticket.classList.toggle('is-mouse', on);
        if (!on) {
            x = y = 0;
            ticket.style.removeProperty('--ais-tk-x');
            ticket.style.removeProperty('--ais-tk-y');
        }
    }

    sec.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || !ligado()) return;
        var r = ticket.getBoundingClientRect();
        x = lim((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2));
        y = lim((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2));
        agendar();
    }, { passive: true });
    sec.addEventListener('pointerleave', function () {
        if (!ligado()) return;
        x = y = 0;
        agendar();
    });
    ouvirMq(mouse, modo);
    ouvirMq(reduz, modo);
    modo();
})();

/* ── Mapa do Local do Evento ───────────────────────────────────────────
   MapLibre GL (self-hosted em dependencias/local/maplibre/) com os tiles
   vetoriais da OpenFreeMap (sem chave). Carrega perto da tela (800px
   antes). O estilo base é o "positron" da OpenFreeMap, repintado camada
   por camada com os tokens do root.css (lidos do :root, então a cor tem
   uma fonte só):
     terra --bw, áreas residenciais --ln100, prédios --ln200, parques
     --pc100, água --pc200 (nomes em --bw com halo --pc500), ruas pequenas
     --ln600, vias principais --pc300 com contorno --pc500, rodovias
     --pc500 com contorno --pc700, trilhos --dn100, rótulos --bb com halo
     --bw.
   Pino com o símbolo do evento (.ais-mapa-pino) no Sapiens Parque. Gestos cooperativos:
   o scroll da página não vira zoom (Ctrl/⌘ + rolagem ou dois dedos).
   Sem WebGL, sem rede ou com erro: o embed do Google no lugar. */
(function () {
    var el = document.querySelector('.ais-mapa-gl');
    if (!el) return;
    var BASE = '/ed/aisummit/dependencias/local/maplibre/';
    var ESTILO = 'https://tiles.openfreemap.org/styles/positron';
    var EMBED = 'https://www.google.com/maps?q=Avenida+Luiz+Boiteux+Piazza,+1302,+Cachoeira+do+Bom+Jesus,+Florian%C3%B3polis+-+SC&output=embed';
    var feito = false;

    function fallback() {
        if (el.querySelector('iframe')) return;
        el.innerHTML = '';
        var f = document.createElement('iframe');
        f.className = 'ais-mapa-frame';
        f.src = EMBED;
        f.title = el.getAttribute('aria-label') || 'Mapa';
        f.loading = 'lazy';
        f.referrerPolicy = 'no-referrer-when-downgrade';
        f.allowFullscreen = true;
        el.appendChild(f);
    }
    function temWebGL() {
        try {
            var c = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
        } catch (e) { return false; }
    }
    function carrega(url, tipo) {
        return new Promise(function (ok, erro) {
            var n = document.createElement(tipo === 'css' ? 'link' : 'script');
            if (tipo === 'css') { n.rel = 'stylesheet'; n.href = url; } else { n.src = url; }
            n.onload = ok; n.onerror = erro;
            document.head.appendChild(n);
        });
    }
    function token(nome) {
        return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
    }
    // Repinta o estilo base com os tokens da página.
    function repinta(s) {
        var t = function (n) { return token(n); };
        var cor = {
            background: { 'background-color': t('--bw') },
            landuse_residential: { 'fill-color': t('--ln100'), 'fill-opacity': 1 },
            park: { 'fill-color': t('--pc100'), 'fill-opacity': 1 },
            landcover_wood: { 'fill-color': t('--pc100'), 'fill-opacity': 0.6 },
            // água em --pc200: o --pc300 é a cor do painel em volta, e o mar
            // no canto do mapa parecia um recorte
            water: { 'fill-color': t('--pc200') },
            waterway: { 'line-color': t('--pc200') },
            building: { 'fill-color': t('--ln200'), 'fill-outline-color': t('--ln400') },
            highway_path: { 'line-color': t('--ln600') },
            highway_minor: { 'line-color': t('--ln600') },
            highway_major_casing: { 'line-color': t('--pc500') },
            highway_major_inner: { 'line-color': t('--pc300') },
            highway_major_subtle: { 'line-color': t('--pc300') },
            highway_motorway_casing: { 'line-color': t('--pc700') },
            highway_motorway_inner: { 'line-color': t('--pc500') },
            highway_motorway_subtle: { 'line-color': t('--pc500') },
            highway_motorway_bridge_casing: { 'line-color': t('--pc700') },
            highway_motorway_bridge_inner: { 'line-color': t('--pc500') },
            boundary_3: { 'line-color': t('--dn100') },
            boundary_2: { 'line-color': t('--dn100') }
        };
        s.layers.forEach(function (l) {
            l.paint = l.paint || {};
            var c = cor[l.id];
            if (c) Object.keys(c).forEach(function (k) { l.paint[k] = c[k]; });
            if (/^railway/.test(l.id) && l.type === 'line') l.paint['line-color'] = t('--dn100');
            if (l.type === 'symbol' && l.layout && l.layout['text-field']) {
                var agua = /^water/.test(l.id);
                l.paint['text-color'] = agua ? t('--bw') : t('--bb');
                l.paint['text-halo-color'] = agua ? t('--pc500') : t('--bw');
                l.paint['text-halo-width'] = 1.5;
            }
        });
        return s;
    }
    function monta() {
        if (feito) return;
        feito = true;
        if (!temWebGL()) { fallback(); return; }
        Promise.all([carrega(BASE + 'maplibre-gl.css', 'css'), carrega(BASE + 'maplibre-gl.js', 'js')])
            .then(function () { return fetch(ESTILO).then(function (r) { if (!r.ok) throw new Error('estilo ' + r.status); return r.json(); }); })
            .then(function (estilo) {
                var lng = parseFloat(el.dataset.lng), lat = parseFloat(el.dataset.lat);
                var mapa = new window.maplibregl.Map({
                    container: el,
                    style: repinta(estilo),
                    center: [lng, lat],
                    zoom: 14.6,
                    minZoom: 10,
                    maxZoom: 18,
                    dragRotate: false,
                    pitchWithRotate: false,
                    touchPitch: false,
                    cooperativeGestures: true,
                    attributionControl: { compact: true },
                    locale: {
                        'CooperativeGesturesHandler.WindowsHelpText': 'Use Ctrl + rolagem para dar zoom no mapa',
                        'CooperativeGesturesHandler.MacHelpText': 'Use ⌘ + rolagem para dar zoom no mapa',
                        'CooperativeGesturesHandler.MobileHelpText': 'Use dois dedos para mover o mapa',
                        'NavigationControl.ZoomIn': 'Aumentar o zoom',
                        'NavigationControl.ZoomOut': 'Diminuir o zoom'
                    }
                });
                mapa.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
                // Símbolo do evento (o mesmo do logotipo). A haste aponta o
                // local: âncora na base, descontando a folga do viewBox
                // abaixo da haste (16 unidades ≈ 7px).
                var marca = document.createElement('div');
                marca.className = 'ais-mapa-marca';
                marca.setAttribute('aria-hidden', 'true');
                marca.innerHTML = '<svg class="ais-mapa-pino" viewBox="664 524 172 112">' +
                    '<defs><path id="ais-simbolo" d="M820 560h-45.86l32.43 32.43-14.14 14.14L760 574.14V620h-20v-45.86l-32.43 32.43-14.14-14.14L725.86 560H680v-20h40c11.95 0 22.67 5.24 30 13.55 7.33-8.31 18.05-13.55 30-13.55h40z"/></defs>' +
                    '<use class="ais-pino-forma" href="#ais-simbolo"/>' +
                    '<use class="ais-pino-cintila" href="#ais-simbolo"/></svg>';
                new window.maplibregl.Marker({ element: marca, anchor: 'bottom', offset: [0, 7] }).setLngLat([lng, lat]).addTo(mapa);
                // Atribuição compacta fechada (o "i" abre); o MapLibre abre
                // ela sozinha quando o mapa é largo.
                mapa.on('load', function () {
                    var a = el.querySelector('.maplibregl-ctrl-attrib');
                    if (a) a.classList.remove('maplibregl-compact-show');
                });
                mapa.on('error', function (e) {
                    // erro de tile solto não derruba o mapa; só falha geral do estilo
                    if (e && e.error && /style/i.test(String(e.error.message || ''))) fallback();
                });
            })
            .catch(fallback);
    }
    if (!('IntersectionObserver' in window)) { monta(); return; }
    var olho = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { olho.disconnect(); monta(); }
    }, { rootMargin: '800px' });
    olho.observe(el);
})();

/* ── Popup de inscrição ────────────────────────────────────────────────
   O botão com data-popup (o ticket da oferta) abre o
   popup do form 520 (form-aisummit.html, montado pelo form-include.js; o
   openPopup vem do form.js). Delegado no document porque o popup chega
   depois, por fetch. */
document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-popup]');
    if (!a) return;
    e.preventDefault();
    if (window.openPopup) window.openPopup(a.getAttribute('data-popup'));
});

/* ── "Garantir vaga" do header e da barra fixa → oferta ────────────────
   Levam até o #garantir (o ponto da oferta com preço, itens e ticket na
   tela; posição no style.css). Não usa o scroll-suave.js, que calcula o
   destino uma vez só no clique: se a fonte ou uma imagem acima chega no
   meio do caminho e muda a altura da página, ele passava do ponto e caía
   na troca pela próxima seção. Aqui o destino é relido a cada quadro.
   Captura no document pra rodar antes do scroll-suave (que ouve na
   bolha); roda de roda ou toque no meio cancela. Com reduced motion, pula
   direto. */
(function () {
    var alvo = document.getElementById('garantir');
    if (!alvo) return;
    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
    var rodando = false, atual = 0;
    function destino() {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        return Math.max(0, Math.min(max, alvo.getBoundingClientRect().top + window.scrollY));
    }
    function parar() { rodando = false; }
    function passo() {
        if (!rodando) return;
        var d = destino() - atual;
        if (Math.abs(d) < 0.5) { window.scrollTo(0, destino()); rodando = false; return; }
        atual += d * 0.12;
        window.scrollTo(0, atual);
        requestAnimationFrame(passo);
    }
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href="#garantir"]');
        if (!a) return;
        e.preventDefault();
        e.stopPropagation();
        if (reduz.matches) { window.scrollTo(0, destino()); return; }
        atual = window.scrollY;
        if (!rodando) { rodando = true; requestAnimationFrame(passo); }
    }, true);
    window.addEventListener('wheel', parar, { passive: true });
    window.addEventListener('touchstart', parar, { passive: true });
})();

/* ── Vídeo de fundo do ticket (a flor) ─────────────────────────────────
   preload="none" e o src no data-src: só carrega quando o ticket chega
   perto da tela (512px antes), toca em loop enquanto está nela e pausa
   fora. Com prefers-reduced-motion não toca (fica o poster). */
(function () {
    var v = document.querySelector('.ais-ticket-video');
    if (!v) return;
    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
    function carrega() {
        if (!v.getAttribute('src') && v.dataset.src) { v.src = v.dataset.src; v.load(); }
    }
    function toca(sim) {
        if (sim && !reduz.matches) {
            carrega();
            var pr = v.play();
            if (pr && pr.catch) pr.catch(function () {});
        } else {
            v.pause();
        }
    }
    if (!('IntersectionObserver' in window)) { toca(true); return; }
    new IntersectionObserver(function (e) { toca(e[0].isIntersecting); }, { rootMargin: '512px' }).observe(v);
    ouvirMq(reduz, function () { if (reduz.matches) v.pause(); });
})();

/* ── FAQ ───────────────────────────────────────────────────────────────
   O mesmo da /ed/bf/: clique na linha inteira. Abrir liga o <details>
   primeiro e só no quadro seguinte anima o grid de 0fr pra 1fr (e o ícone
   vira "remove"); a resposta só esmaece pra dentro depois que o grid abriu
   (CSS). Fechar faz o contrário (a resposta some, depois o grid fecha) e
   só desliga o <details> no fim do grid. Com reduced motion, fecha na
   hora. */
(function () {
    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
    document.querySelectorAll('.sec-faq .faq-row').forEach(function (details) {
        var grid = details.querySelector('.faq-a-grid');
        var icon = details.querySelector('.faq-q-icon');
        if (!grid) return;
        details.addEventListener('click', function (e) {
            e.preventDefault();
            if (!details.open) {
                details.open = true;
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        grid.classList.add('is-open');
                        if (icon) icon.textContent = 'remove';
                    });
                });
            } else {
                grid.classList.remove('is-open');
                if (icon) icon.textContent = 'add';
                if (reduz.matches) { details.open = false; return; }
                // só no fim do grid (o esmaecer da resposta, antes, também
                // dispara transitionend e sobe até aqui); se reabriu no
                // meio, fica aberto
                grid.addEventListener('transitionend', function fim(ev) {
                    if (ev.target !== grid || ev.propertyName !== 'grid-template-rows') return;
                    grid.removeEventListener('transitionend', fim);
                    if (!grid.classList.contains('is-open')) details.open = false;
                });
            }
        });
    });
})();

/* ── CTA fixa no rodapé ────────────────────────────────────────────────
   A % preenchida vem do data-preenchido da barra (0 a 100): vira o número
   do texto (sempre 2 dígitos, "XX%": 5 -> 05), a largura do preenchimento
   (--ais-vagas) e o aria-valuenow. Sem número válido fica o "00" do HTML e
   a barra zerada.
   A barra aparece (.is-visivel) quando nem o header nem a oferta estão na
   tela (os dois já têm o botão / o ticket); escondida, sai da leitura de
   tela e do tab. Sem IntersectionObserver, fica sempre visível. */
(function () {
    var barra = document.querySelector('.ais-barra-cta');
    if (!barra) return;
    var btn = barra.querySelector('.ais-barra-btn');
    var trilho = barra.querySelector('.ais-barra-trilho');
    var bruto = barra.getAttribute('data-preenchido');
    var v = bruto === '' || bruto === null ? NaN : parseFloat(bruto);
    if (!isNaN(v)) {
        v = Math.round(Math.min(100, Math.max(0, v)));
        barra.style.setProperty('--ais-vagas', v);
        barra.querySelector('.ais-barra-num').textContent = v < 10 ? '0' + v : String(v);
        trilho.setAttribute('aria-valuenow', v);
    }

    function mostrar(sim) {
        barra.classList.toggle('is-visivel', sim);
        barra.setAttribute('aria-hidden', sim ? 'false' : 'true');
        if (btn) btn.tabIndex = sim ? 0 : -1;
    }
    if (!('IntersectionObserver' in window)) { mostrar(true); return; }

    // Conjunto de quem está na tela (não contador: o observador dispara
    // uma vez por elemento já no registro).
    var emCena = new Set();
    var olho = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            if (e.isIntersecting) emCena.add(e.target);
            else emCena.delete(e.target);
        });
        mostrar(emCena.size === 0);
    });
    ['.ais-hero', '.ais-oferta'].forEach(function (s) {
        var el = document.querySelector(s);
        if (el) olho.observe(el);
    });
})();

/* ── Animações dos temas (vídeo) ──────────────────────────────────────
   Escolhe, por card, o tamanho pelo que ele ocupa na tela de verdade
   (largura x densidade, densidade até 2: até 760 px físicos, o de 688;
   acima, o de 1376) e o
   formato pelo navegador (AV1/WebM quando toca; senão H.264/MP4). Carrega
   só quando o card chega perto da tela (400 px antes) e só toca enquanto
   está visível; fora, pausa. Com prefers-reduced-motion ou economia de
   dados, fica só o pôster (1º quadro). Se a largura mudar (rotação, janela
   redimensionada) e cruzar o limite, troca de tamanho no mesmo ponto. */
(function () {
    var caixas = [].slice.call(document.querySelectorAll('.ais-video'));
    if (!caixas.length) return;
    var BASE = '/ed/aisummit/dependencias/temas/';
    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
    var economia = !!(navigator.connection && navigator.connection.saveData);
    var teste = document.createElement('video');
    var av1 = !!(teste.canPlayType && teste.canPlayType('video/webm; codecs="av01.0.05M.08"'));

    function parado() { return reduz.matches || economia; }
    function tamanho(c) {
        // Densidade limitada a 2: celular com tela 3x (card ~360) fica no de
        // 688, que já sai nítido ali, sem baixar o dobro à toa.
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        return c.el.clientWidth * dpr > 760 ? 1376 : 688;
    }
    function tocar(c) {
        if (parado() || !c.v.src) return;
        var p = c.v.play();
        if (p && p.catch) p.catch(function () {});
    }
    function preparar(c) {
        var t = tamanho(c);
        if (c.t === t) return;
        c.t = t;
        var id = c.el.getAttribute('data-video');
        c.v.poster = BASE + id + '-' + t + '.webp';
        if (parado()) return;
        var momento = c.v.currentTime || 0;
        c.v.src = BASE + id + '-' + t + (av1 ? '.webm' : '.mp4');
        c.v.preload = 'auto';
        if (momento) {
            c.v.addEventListener('loadedmetadata', function volta() {
                c.v.removeEventListener('loadedmetadata', volta);
                c.v.currentTime = momento;
            });
        }
        if (c.visivel) tocar(c);
    }

    var lista = caixas.map(function (el) {
        return { el: el, v: el.querySelector('video'), t: 0, perto: false, visivel: false };
    });

    if (!('IntersectionObserver' in window)) {
        lista.forEach(function (c) { c.perto = c.visivel = true; preparar(c); tocar(c); });
        return;
    }
    var perto = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            var c = lista[caixas.indexOf(e.target)];
            if (e.isIntersecting && !c.perto) { c.perto = true; preparar(c); }
        });
    }, { rootMargin: '400px 0px' });
    var visivel = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            var c = lista[caixas.indexOf(e.target)];
            c.visivel = e.isIntersecting;
            if (c.visivel) tocar(c); else c.v.pause();
        });
    });
    caixas.forEach(function (el) { perto.observe(el); visivel.observe(el); });

    var espera;
    window.addEventListener('resize', function () {
        clearTimeout(espera);
        espera = setTimeout(function () {
            lista.forEach(function (c) { if (c.perto) preparar(c); });
        }, 200);
    });
    function aoMudarMovimento() {
        lista.forEach(function (c) {
            if (parado()) { c.v.pause(); }
            else if (c.perto) { c.t = 0; preparar(c); if (c.visivel) tocar(c); }
        });
    }
    if (reduz.addEventListener) reduz.addEventListener('change', aoMudarMovimento);
    else if (reduz.addListener) reduz.addListener(aoMudarMovimento);
})();
