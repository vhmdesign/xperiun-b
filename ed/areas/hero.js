/* ═══════════════════════════════════════════════════════════
   Painéis empilhados 3D (JS puro · cores Xperiun)
   Recriação vanilla do "stacked panels". A onda (que no original
   seguia o cursor) aqui é uma VARREDURA AUTOMÁTICA infinita, sem
   participação do mouse. Tudo via requestAnimationFrame.
   ═══════════════════════════════════════════════════════════ */
(function () {
    "use strict";

    const PANEL_COUNT = 16;
    const Z_SPREAD = 42;
    const SIGMA = 2.8;

    /* 4 imagens do hero, pré-borradas em hero-blur/ nos níveis 0/2/4/6px
       (geradas por gen-hero-blur.js) — sem filter: blur() em runtime. */
    const AB = '/ed/site-dependencias/site-media/areas/';

    const stage = document.querySelector('[data-stacked-panels]');
    if (!stage) return;

    const wrap = document.createElement('div');
    wrap.className = 'sp-scene-wrap';
    const scene = document.createElement('div');
    scene.className = 'sp-scene';
    wrap.appendChild(scene);
    stage.appendChild(wrap);

    const panels = [];
    for (let i = 0; i < PANEL_COUNT; i++) {
        const t = i / (PANEL_COUNT - 1);
        const baseZ = (i - (PANEL_COUNT - 1)) * Z_SPREAD;
        const w = (264 + t * 80) * (512 / 344);  /* frente = 512px; fundo escala proporcional (~393px) */
        const h = w * 9 / 16;                     /* 16:9 */

        const p = document.createElement('div');
        p.className = 'sp-panel';
        /* Valores por painel → custom properties (o CSS aplica) */
        p.style.setProperty('--w', w + 'px');
        p.style.setProperty('--h', h + 'px');
        p.style.setProperty('--op', String(0.25 + t * 0.75));
        p.style.setProperty('--z', baseZ + 'px');
        /* imagem já borrada conforme a profundidade (0/2/4/6) — sem filter em runtime */
        const blurLevel = Math.floor((PANEL_COUNT - 1 - i) / 4) * 2;
        p.style.setProperty('--img', 'url("' + AB + 'hero-blur/areas-hero-top-sp-scene-img0' + (((PANEL_COUNT - 1 - i) % 4) + 1) + '-b' + blurLevel + '.webp")');

        const img = document.createElement('div');
        img.className = 'sp-panel-img';
        const vig = document.createElement('div');
        vig.className = 'sp-panel-vignette';

        p.appendChild(img);
        p.appendChild(vig);
        scene.appendChild(p);
        panels.push({ el: p, h: h });
    }

    /* ── Render de um frame (tempo absoluto em segundos) ── */
    function render(time) {
        /* posição da onda varrendo 0 → (PANEL_COUNT-1) → 0, infinitamente */
        const pos = (PANEL_COUNT - 1) * (0.5 + 0.5 * Math.sin(time * 0.6));

        /* tilt suave da cena (no lugar do movimento do mouse) */
        const rotY = -42 + Math.sin(time * 0.4) * 7;
        const rotX = 18 + Math.sin(time * 0.3 + 1) * 5;
        scene.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';

        /* bob vertical do container (-64 ↔ +64), sincronizado com a onda (mesmo sin) */
        stage.style.transform = 'translateY(' + (64 * Math.sin(time * 0.6)) + 'px)';

        for (let i = 0; i < panels.length; i++) {
            const dist = Math.abs(i - pos);
            const influence = Math.exp(-(dist * dist) / (2 * SIGMA * SIGMA));
            /* Altura fixa: o topo percorre o MESMO caminho que o scaleY (origem
               no rodapé) produzia — h·0.65·(1−influência) — agora como posição. */
            const waveY = -influence * 70 + panels[i].h * 0.65 * (1 - influence);
            panels[i].el.style.setProperty('--wave', waveY + 'px');
        }
    }

    /* ── Loop com pausa fora da tela + respeito a prefers-reduced-motion ── */
    let rafId = null;
    function frame(now) { render(now / 1000); rafId = requestAnimationFrame(frame); }
    function start() { if (rafId === null) rafId = requestAnimationFrame(frame); }
    function stop()  { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
        render(0);                              /* pose estática, sem animar */
    } else if ('IntersectionObserver' in window) {
        /* só anima enquanto o hero está visível */
        new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
        }, { threshold: 0 }).observe(stage);
    } else {
        start();
    }
})();
