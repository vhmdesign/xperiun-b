/* Logística — tilt do .fluxo-dash proporcional ao scroll.
   Início: perspective(512px) rotateX(15deg) translateY(-128px)
   Fim (conforme rola até o topo): perspective(512px) rotateX(0deg) translateY(0px) */
(function () {
    var sec = document.querySelector('.fluxo-dash');
    if (!sec) return;
    var img = sec.querySelector('img');

    var FROM_ROT = 15;   // deg
    var FROM_TY = -128;  // px

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
        sec.style.transform = 'perspective(512px) rotateX(0deg) translateY(0px)';
        if (img) { img.style.opacity = '1'; img.style.filter = 'none'; }
        return;
    }

    var ticking = false;

    function apply() {
        ticking = false;
        // abaixo de 864px: sem efeito (deixa o CSS controlar)
        if (window.innerWidth <= 864) {
            sec.style.transform = '';
            if (img) { img.style.opacity = ''; img.style.filter = ''; }
            return;
        }
        var rect = sec.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        // progresso pelo centro do elemento: 0 quando o centro está no fundo da viewport,
        // 1 (plano) quando o centro chega ao centro da tela.
        var centerY = rect.top + rect.height / 2;
        var p = (vh - centerY) / (vh / 2);
        if (p < 0) p = 0;
        if (p > 1) p = 1;
        var rot = FROM_ROT * (1 - p);
        var ty = FROM_TY * (1 - p);
        sec.style.transform = 'perspective(512px) rotateX(' + rot + 'deg) translateY(' + ty + 'px)';
        if (img) {
            img.style.opacity = (0.5 + 0.5 * p).toString();
            img.style.filter = 'blur(' + (2 * (1 - p)) + 'px)';
        }
    }

    function onScroll() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(apply);
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    apply();
})();

/* Logística — preenche o stat "Nível" do course-modal, colorido por nível
   (como no /ed/areas). O formacoes/script.js abre o modal e preenche
   duração/aulas/professor; aqui só setamos o Nível (3ª tag do card). */
(function () {
    var nivelEl = document.getElementById('courseModalNivel');
    if (!nivelEl) return;
    var COLOR = {
        'Iniciante': 'var(--sc300)',
        'Intermediário': 'var(--wr300)',
        'Avançado': 'var(--er300)'
    };
    function setNivel(card) {
        var n = card.getAttribute('data-nivel') || '';
        nivelEl.textContent = n;
        nivelEl.style.color = COLOR[n] || '';
    }
    document.querySelectorAll('.course-card').forEach(function (card) {
        card.addEventListener('click', function () { setNivel(card); });
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') setNivel(card);
        });
    });
})();

/* Logística — mantém --sec-courses-height atualizada (sobreposição sec-courses
   ↔ sec-depos). Mesmo padrão do IIFE de --sec-projetos-height do formacoes/script.js. */
(function () {
    var sec = document.querySelector('.courses-depos-track .sec-courses');
    if (!sec) return;
    function update() {
        sec.style.setProperty('--sec-courses-height', sec.offsetHeight + 'px');
    }
    update();
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(update).observe(sec);
    }
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', update);
    }
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
})();
