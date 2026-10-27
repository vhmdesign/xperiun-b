/* ══════════════════════════════════════════════════════════════════════
   AI Summit, obrigado: popup da pesquisa (o mesmo da
   /ed/be-a-ba-ia-3/obrigado/, que era inline lá).

   O botão abre o popup (desliza da direita), "Sair", clique fora e Esc
   fecham. O Typeform é montado a partir do data-tf-id do .obr-tf (a
   pesquisa do AI Summit): ele vira data-tf-live e o embed.js do Typeform
   é carregado; vazio, nada do Typeform carrega. O loading some quando o
   iframe carrega, com um teto de 8s pra nunca travar.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    var openBtn = document.getElementById('obr-open');
    var closeBtn = document.getElementById('obr-close');
    var popup = document.getElementById('obr-popup');
    if (!openBtn || !popup) return;

    function abre() { popup.classList.add('is-open'); popup.setAttribute('aria-hidden', 'false'); document.documentElement.style.overflow = 'hidden'; }
    function fecha() { popup.classList.remove('is-open'); popup.setAttribute('aria-hidden', 'true'); document.documentElement.style.overflow = ''; }
    openBtn.addEventListener('click', abre);
    if (closeBtn) closeBtn.addEventListener('click', fecha);
    popup.addEventListener('click', function (e) { if (e.target === popup) fecha(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecha(); });

    var tf = popup.querySelector('.obr-tf');
    var loading = popup.querySelector('.obr-popup-loading');
    var id = tf && (tf.getAttribute('data-tf-id') || '').trim();
    if (!id) {
        if (window.console) console.warn('[obrigado] data-tf-id vazio: a pesquisa do Typeform não foi carregada.');
        return;
    }

    // Monta o embed do Typeform com o ID
    tf.setAttribute('data-tf-live', id);
    var s = document.createElement('script');
    s.src = '//embed.typeform.com/next/embed.js';
    document.body.appendChild(s);

    // Esconde o loading quando o iframe do Typeform aparece e carrega
    if (loading) {
        var escondido = false;
        var esconde = function () { if (escondido) return; escondido = true; loading.classList.add('is-hidden'); };
        var observa = function (ifr) { ifr.addEventListener('load', esconde); };
        var existente = tf.querySelector('iframe');
        if (existente) observa(existente);
        else if (window.MutationObserver) {
            var obs = new MutationObserver(function () {
                var ifr = tf.querySelector('iframe');
                if (ifr) { obs.disconnect(); observa(ifr); }
            });
            obs.observe(tf, { childList: true, subtree: true });
        }
        setTimeout(esconde, 8000); // nunca trava o loading
    }
})();
