/* ══════════════════════════════════════════════════════════════════════════
   /ed/bf/vitalicio/: o bloco da compra (.vit-cta-wrap) aparece 4s depois
   do clique no vídeo.

   O player é um iframe do Panda Video, de outro domínio: um clique dentro
   dele não chega na página. Dois sinais, o primeiro que vier vale:
     1. o Panda manda postMessage pra página quando o vídeo dá play
        (panda_play);
     2. o clique no iframe tira o foco da janela e o põe no iframe
        (blur da janela + document.activeElement === iframe).

   O <head> põe .vit-espera no html antes da pintura (o bloco começa
   escondido); sem JS nada disso roda e o bloco aparece normal.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
    var ESPERA = 4000;
    var bloco = document.querySelector('.vit-cta-wrap');
    var iframe = document.querySelector('.vit-video iframe');
    if (!bloco) return;
    if (!iframe) { bloco.classList.add('is-visivel'); return; }

    var disparado = false;
    function disparar() {
        if (disparado) return;
        disparado = true;
        window.removeEventListener('message', aoMensagem);
        window.removeEventListener('blur', aoBlur);
        setTimeout(function () { bloco.classList.add('is-visivel'); }, ESPERA);
    }

    // 1. Play do Panda. A mensagem vem como objeto ({ message: 'panda_play' })
    //    ou texto; aceita os dois, e só do iframe do vídeo.
    function aoMensagem(e) {
        if (e.source !== iframe.contentWindow) return;
        var d = e.data;
        var nome = d && typeof d === 'object' ? (d.message || d.event || d.type) : d;
        if (typeof nome === 'string' && nome.indexOf('panda_play') !== -1) disparar();
    }

    // 2. Clique no iframe: a janela perde o foco pra ele. O activeElement só
    //    é atualizado depois do blur, por isso o setTimeout 0.
    function aoBlur() {
        setTimeout(function () {
            if (document.activeElement === iframe) disparar();
        }, 0);
    }

    window.addEventListener('message', aoMensagem);
    window.addEventListener('blur', aoBlur);
})();
