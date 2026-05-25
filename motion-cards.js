/* Motion cards: scroll-reveal opt-in.
   Qualquer elemento com a classe `.motion` ganha `.is-revealed` quando
   seu topo passa abaixo de 50% da altura do viewport. Quando a página
   volta ao topo (scrollY === 0), reseta todos pra disparar de novo.

   CSS pattern:
     .meu-elemento { ...estado inicial...; transition: 0.5s all ease-out; }
     .meu-elemento.is-revealed { ...estado final... }
   ou:
     .card.motion .child { ...inicial... }
     .card.motion.is-revealed .child { ...final... }

   Throttle via requestAnimationFrame: 1 update por frame, sem layout
   thrash mesmo com muitos elementos. */
(function () {
    'use strict';

    const TRIGGER_RATIO = 0.5;
    let scheduled = false;

    function update() {
        const triggerY = window.innerHeight * TRIGGER_RATIO;
        const items = document.querySelectorAll('.motion');

        if (window.scrollY === 0) {
            items.forEach((el) => el.classList.remove('is-revealed'));
            return;
        }

        items.forEach((el) => {
            const top = el.getBoundingClientRect().top;
            el.classList.toggle('is-revealed', top < triggerY);
        });
    }

    function schedule() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            update();
            scheduled = false;
        });
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', update);
    } else {
        update();
    }
})();
