/* ═══════════════════════════════════════════════════════════════════════════
   Aros do bloco claro: encolhem conforme o bloco sobe na viewport.

   O CSS descreve os três anéis como múltiplos de 12/24/36 vezes --aro. Aqui só
   se move essa única variável, de 16 (início: 192/384/576) até 1 (repouso:
   12/24/36).

   A janela do efeito é 3/4 da altura da viewport, contada a partir do momento
   em que o topo do bloco aparece na borda de baixo. Quem não tem JS ou pede
   menos movimento fica no repouso, que é o padrão declarado no CSS.

   Custo: box-shadow é propriedade de PINTURA, então cada passo repinta a faixa.
   Por isso o valor é arredondado em passos de 0,05 e só escrito quando muda de
   verdade, e o cálculo só roda quando o bloco está perto da tela.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
    var bloco = document.querySelector('.light-block');
    if (!bloco) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var INICIO = 16;    /* 16 x 12/24/36 = 192/384/576 */
    var FIM = 1;
    var agendado = false;
    var ultimo = -1;

    function aplicar() {
        agendado = false;
        var vh = window.innerHeight || 0;
        var topo = bloco.getBoundingClientRect().top;

        /* longe da tela: nem calcula, só garante o extremo certo */
        var p;
        if (topo >= vh) p = 0;
        else {
            var janela = vh * 0.75;
            p = (vh - topo) / janela;
            if (p > 1) p = 1;
        }

        var escala = INICIO + (FIM - INICIO) * p;
        escala = Math.round(escala * 20) / 20;      /* passo de 0,05 */
        if (escala === ultimo) return;
        ultimo = escala;
        bloco.style.setProperty('--aro', escala);
    }

    function agendar() {
        if (agendado) return;
        agendado = true;
        window.requestAnimationFrame(aplicar);
    }

    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    /* imagem que carrega tarde muda a altura da página e move o bloco sem que
       ninguém role nada: sem isto o valor congela no que valia antes. */
    window.addEventListener('load', agendar);
    if (window.ResizeObserver) new ResizeObserver(agendar).observe(bloco);
    aplicar();
})();
