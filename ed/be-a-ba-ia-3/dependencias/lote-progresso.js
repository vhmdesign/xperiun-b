/* ══════════════════════════════════════════════════════════════════════════
   Barra de progresso dos lotes (faixa do topo).

   Janelas, em HORÁRIO DE BRASÍLIA (o Brasil não tem mais horário de verão
   desde 2019, então é UTC-3 o ano todo — por isso dá pra somar 3h e usar
   Date.UTC, sem depender do fuso da máquina de quem acessa):

     Lote 0 — 10/08 00:00 → 15/08 23:59:59   (só via ?oferta=)  R$ 19
     Lote 1 — 10/08 00:00 → 20/08 23:59:59   (lançamento)       R$ 37
     Lote 2 — 21/08 00:00 → 25/08 23:59:59   (segundo lote)     R$ 47
     Lote 3 — 26/08 00:00 → 28/08 23:59:59   (encerramento)     R$ 57

   As datas NÃO aparecem na tela: servem só pra calcular em que lote estamos, o
   quanto já passou dele e qual preço mostrar. Quem vira o preço do card de
   oferta é este mesmo relógio, em `[data-lote-preco]` — o número no HTML é só
   o fallback de quem cair aqui com o JS bloqueado, e por isso é o do lote 1.
   O lote atual continua publicado em `document.documentElement.dataset.lote`.

   Curva: cada lote começa em 55% e chega a 100% no fim da janela, subindo
   EXPONENCIALMENTE (fica quase parada no começo e dispara perto da virada):

       p(t) = 55 + 45 · (e^(k·t) − 1) / (e^k − 1),  t ∈ [0,1], k = 3

   Amostras com k=3: t=0 → 55% · t=0,25 → 59,4% · t=0,5 → 66,7% · t=0,75 → 78%
   · t=0,9 → 87,6% · t=1 → 100%.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
    /* a mesma barra aparece na faixa do topo E no card de oferta: tudo e
       atualizado junto, por isso querySelectorAll em vez de querySelector */
    var barras = document.querySelectorAll('[data-lote-barra]');
    if (!barras.length) return;
    var nomes = document.querySelectorAll('[data-lote-nome]');    /* "Lote 01" */
    var saidasPct = document.querySelectorAll('[data-lote-pct]'); /* "55%" */
    var precos = document.querySelectorAll('[data-lote-preco]');  /* "37" */

    var ANO = 2026;
    var PISO = 55;      /* nunca começa zerada */
    var TETO = 100;
    var CURVA = 3;      /* quanto maior, mais tarde a barra dispara */

    /* meia-noite (ou fim do dia) de Brasília expressa em timestamp UTC */
    function brt(mes, dia, hora, min, seg) {
        return Date.UTC(ANO, mes - 1, dia, hora + 3, min, seg, 0);
    }

    var LOTES = [
        { n: 1, preco: '37', ini: brt(8, 10, 0, 0, 0), fim: brt(8, 20, 23, 59, 59) },
        { n: 2, preco: '47', ini: brt(8, 21, 0, 0, 0), fim: brt(8, 25, 23, 59, 59) },
        { n: 3, preco: '57', ini: brt(8, 26, 0, 0, 0), fim: brt(8, 28, 23, 59, 59) }
    ];

    /* ── Modo "aluno Xperiun" ────────────────────────────────────────────────
       ?oferta=aluno-xperiun troca a oferta inteira: carimba data-oferta no
       <html> (o CSS pendura tudo nesse seletor), fixa "Lote 00" e R$19 e SAI
       antes de ligar o relógio, porque neste modo não existe lote correndo nem
       barra pra encher.

       A oferta tem JANELA, não só prazo: 10/08 00:00 até 15/08 23:59:59 de
       Brasília, abrindo junto com o lote 1. Fora dela o parâmetro não vale e a
       página segue normal, com os três lotes e suas viradas. Por isso este
       bloco vem depois do brt(): as datas precisam do mesmo relógio de
       Brasília que os lotes usam (e ANO só existe daqui pra baixo). */
    var INICIO_ALUNO = brt(8, 10, 0, 0, 0);
    var FIM_ALUNO = brt(8, 15, 23, 59, 59);

    if (new URLSearchParams(location.search).get('oferta') === 'aluno-xperiun' &&
        Date.now() >= INICIO_ALUNO && Date.now() <= FIM_ALUNO) {
        document.documentElement.dataset.oferta = 'aluno-xperiun';
        var rotulos = document.querySelectorAll('[data-lote-nome]');
        for (var k = 0; k < rotulos.length; k++) rotulos[k].textContent = 'Lote 00';
        var valores = document.querySelectorAll('[data-lote-preco]');
        for (k = 0; k < valores.length; k++) valores[k].textContent = '19';
        return;
    }

    function progresso(t) {
        if (t <= 0) return PISO;
        if (t >= 1) return TETO;
        var e = Math.exp(CURVA);
        return PISO + (TETO - PISO) * (Math.exp(CURVA * t) - 1) / (e - 1);
    }

    function atualizar() {
        var agora = Date.now();
        var pct = PISO, lote = 0, i, l;

        for (i = 0; i < LOTES.length; i++) {
            l = LOTES[i];
            if (agora >= l.ini && agora <= l.fim) {
                lote = l.n;
                pct = progresso((agora - l.ini) / (l.fim - l.ini));
                break;
            }
        }
        /* antes do primeiro lote fica no piso; depois do último, cheia */
        if (!lote) {
            if (agora > LOTES[LOTES.length - 1].fim) { pct = TETO; lote = LOTES.length; }
            else { pct = PISO; lote = 1; }
        }

        pct = Math.round(pct * 10) / 10;
        var inteiro = Math.round(pct);
        var rotulo = 'Lote ' + (lote < 10 ? '0' + lote : lote);
        var preco = LOTES[lote - 1].preco;

        var preenche;
        for (i = 0; i < barras.length; i++) {
            preenche = barras[i].querySelector('[data-lote-preenche]');
            if (preenche) preenche.style.width = pct + '%';
            barras[i].setAttribute('aria-valuenow', inteiro);
            barras[i].setAttribute('aria-label', rotulo + ', ' + inteiro + '% do período');
        }
        for (i = 0; i < nomes.length; i++) nomes[i].textContent = rotulo;
        for (i = 0; i < saidasPct.length; i++) saidasPct[i].textContent = inteiro + '% das vagas preenchidas';
        for (i = 0; i < precos.length; i++) precos[i].textContent = preco;
        document.documentElement.dataset.lote = String(lote);
    }

    atualizar();
    /* a barra anda sozinha com a página aberta (1 min é folgado pro passo) */
    setInterval(atualizar, 60000);
})();
