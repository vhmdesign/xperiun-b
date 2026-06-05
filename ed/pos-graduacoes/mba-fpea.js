/* Mouse parallax nas .mba-orb — desktop only. Mapeia posição do
   cursor relativa ao centro do hero pro range ±64px em cada eixo.
   CSS variables --mx/--my no .mba-hero são lidas pelas orbs no
   transform: translate(var(--mx), var(--my)) rotate(...). */
(function () {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var hero = document.querySelector('.mba-hero');
    if (!hero) return;

    var MAX = 64;
    var rafId = null;
    var targetX = 0, targetY = 0;

    function apply() {
        rafId = null;
        hero.style.setProperty('--mx', targetX + 'px');
        hero.style.setProperty('--my', targetY + 'px');
    }

    hero.addEventListener('mousemove', function (e) {
        var rect = hero.getBoundingClientRect();
        var halfW = rect.width / 2;
        var halfH = rect.height / 2;
        var dx = (e.clientX - rect.left - halfW) / halfW;  // -1 a 1
        var dy = (e.clientY - rect.top  - halfH) / halfH;  // -1 a 1
        /* Clamp e multiplica pelo MAX. dx/dy podem passar de ±1
           se mouse sair do bbox antes do mouseleave disparar. */
        targetX = Math.max(-1, Math.min(1, dx)) * MAX;
        targetY = Math.max(-1, Math.min(1, dy)) * MAX;
        if (rafId === null) rafId = requestAnimationFrame(apply);
    });

    hero.addEventListener('mouseleave', function () {
        targetX = 0;
        targetY = 0;
        if (rafId === null) rafId = requestAnimationFrame(apply);
    });
})();

/* Stripes dinâmicos no .mba-hero-stripes. flex:1 1 0 distribui width
   igualmente entre filhos, então só precisamos escolher a contagem
   certa pra cada stripe ficar entre MIN e MAX px. ResizeObserver
   re-roda em resize do hero (window resize, viewportvh changes etc). */
(function () {
    var stripes = document.querySelector('.mba-hero-stripes');
    if (!stripes) return;

    var MIN = 96;
    var MAX = 128;
    var TARGET = (MIN + MAX) / 2;
    var currentCount = -1;

    function pickCount(W) {
        if (W <= 0) return 0;
        /* Range válido: ceil(W/MAX) ≤ count ≤ floor(W/MIN). */
        var minCount = Math.ceil(W / MAX);
        var maxCount = Math.floor(W / MIN);
        if (maxCount >= minCount) {
            /* Meio do range → transição estável entre breakpoints. */
            return Math.floor((minCount + maxCount) / 2);
        }
        /* Range vazio (W em faixas tipo 129–191 onde 1 stripe > MAX
           mas 2 stripes < MIN). Fallback: o que chega mais perto. */
        return Math.max(1, Math.round(W / TARGET));
    }

    function update() {
        var W = stripes.clientWidth;
        var count = pickCount(W);
        if (count === currentCount) return;

        if (count > currentCount) {
            var frag = document.createDocumentFragment();
            for (var i = stripes.children.length; i < count; i++) {
                frag.appendChild(document.createElement('div'));
            }
            stripes.appendChild(frag);
        } else {
            while (stripes.children.length > count) {
                stripes.removeChild(stripes.lastChild);
            }
        }
        currentCount = count;
    }

    update();
    if (window.ResizeObserver) {
        new ResizeObserver(update).observe(stripes);
    } else {
        window.addEventListener('resize', update);
    }
})();
