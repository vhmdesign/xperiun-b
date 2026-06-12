/* ═══════════════════════════════════════════════════════════
   Painéis empilhados 3D — protótipo (JS puro · cores Xperiun)
   Recriação vanilla do "stacked panels". A onda (que no original
   seguia o cursor) aqui é uma VARREDURA AUTOMÁTICA infinita, sem
   participação do mouse. Tudo via requestAnimationFrame.
   ═══════════════════════════════════════════════════════════ */
(function () {
    "use strict";

    const PANEL_COUNT = 22;
    const Z_SPREAD = 42;
    const SIGMA = 2.8;

    /* 6 imagens de cursos (variadas entre as áreas), repetidas a cada 6 painéis */
    const AB = '/ed/site-dependencias/site-media/areas/';
    const IMAGES = [
        AB + 'logistica/intermediario/Logística com Cálculo de OTIF.webp',
        AB + 'financeira/avancado/Demonstrativo Financeiro da Ambev.webp',
        AB + 'vendas/intermediario/Realizado vs Meta.webp',
        AB + 'financeira/intermediario/Case de Controladoria com DRE.webp',
        AB + 'vendas/avancado/Varejo com Análises Avançadas da Loja Pinski.webp',
        AB + 'logistica/iniciante/Desempenho Logístico.webp'
    ];

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
        p.style.setProperty('--img', 'url("' + IMAGES[i % IMAGES.length] + '")');
        /* Blur de profundidade: +2px a cada 4 painéis, mais nos do fundo */
        p.style.setProperty('--blur', (Math.floor((PANEL_COUNT - 1 - i) / 4) * 2) + 'px');

        const img = document.createElement('div');
        img.className = 'sp-panel-img';
        const vig = document.createElement('div');
        vig.className = 'sp-panel-vignette';

        p.appendChild(img);
        p.appendChild(vig);
        scene.appendChild(p);
        panels.push({ el: p, h: h });
    }

    /* ── Loop: varredura + tilt automáticos (timestamp do rAF, sem mouse) ── */
    function frame(now) {
        const time = now / 1000;

        /* posição da onda varrendo 0 → (PANEL_COUNT-1) → 0, infinitamente */
        const pos = (PANEL_COUNT - 1) * (0.5 + 0.5 * Math.sin(time * 0.6));

        /* tilt suave da cena (no lugar do movimento do mouse) */
        const rotY = -42 + Math.sin(time * 0.4) * 7;
        const rotX = 18 + Math.sin(time * 0.3 + 1) * 5;
        scene.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';

        for (let i = 0; i < panels.length; i++) {
            const dist = Math.abs(i - pos);
            const influence = Math.exp(-(dist * dist) / (2 * SIGMA * SIGMA));
            /* Altura fixa: o topo percorre o MESMO caminho que o scaleY (origem
               no rodapé) produzia — h·0.65·(1−influência) — agora como posição. */
            const waveY = -influence * 70 + panels[i].h * 0.65 * (1 - influence);
            panels[i].el.style.setProperty('--wave', waveY + 'px');
        }

        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
})();
