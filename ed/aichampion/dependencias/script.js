(() => {
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const sq = document.getElementById('fill-canvas');
  const sqx = sq.getContext('2d'); // alpha (transparente sobre o hero até preencher)
  const sqD = document.getElementById('fill-canvas-dark');
  const sqxD = sqD.getContext('2d'); // fill bb reverso (depois da agenda)
  let sqThreshD = null; // thresholds do fill bb (top-down, o "ao contrário")
  let sqCols = 50, sqRows = 0, sqCell = 0, sqThresh = null, sqPc = null, sqConv = null; // grid de quadrados 2vw
  const SQ_FADE = 0.08;     // janela de fade-in de cada quadrado
  const SQ_BOTTOMUP = 0.7;  // peso do "de baixo pra cima" (1=puro, 0=aleatório)
  const SQ_PC = 0.01;       // fração dos quadrados em pc300 (resto em bw)
  const SQ_APPEAR = 0.6;    // fração do fill em que TODOS já apareceram
  const SQ_CONV = 0.15;     // janela em que cada pc300 vira bw

  // ---- config ----
  const N = 1200;          // total de partículas (bola chega a 1200 no fim do scroll)
  const BASE_N = 800;      // visíveis no topo; as extras (1/3) surgem conforme o scroll
  const RADIUS = 1;        // raio da bola
  const WAVE_SPEED = 1.1;  // velocidade base das ondas
  const WAVE_SHARP = 1.8;  // nitidez das manchas de cor (maior = mais definida)
  const PC300 = [100, 100, 255]; // --pc300 #6464FF (root.css) - onda contínua
  const PP500 = [150, 0, 255];   // --pp500 #9600FF (root.css) - onda rara
  const BW = [245, 245, 255];    // --bw #F5F5FF (root.css) - onda radial (só nas de trás)
  const RARE_CHANCE = 0.006; // chance por frame de disparar a onda rara (~1 a cada 2.8s)
  const RARE_SPEED = 0.010;   // velocidade da varredura rara
  const RARE_WIDTH = 0.4;     // largura da banda rara
  const RARE_MIX = 0.95;      // quanto o PP500 domina na passagem
  // onda radial 2D PP500 (começa no fim do scroll, infinita e intermitente):
  // anel expande do bottom-center da tela por todo o raio, some, e repete
  const RADIAL_CYCLE = 3.4;   // duração do ciclo (expansão + pausa)
  const RADIAL_EXPAND = 0.6;  // fração do ciclo em que o anel expande (resto = pausa)
  const RADIAL_BAND = 170;    // espessura do anel (px de canvas)
  const RADIAL_MIX = 1.0;     // quanto o PP500 domina na crista do anel
  const OPACITY_MIN = 0.6;   // opacidade mínima do "piscar" aleatório (1 = sem variação)
  const OPACITY_SPEED = 1.0; // velocidade da variação de opacidade
  const DEFORM_AMP = 0.10; // contido em ±10% (bola sempre entre 90% e 110% do raio)
  const DEFORM_SPEED = 1.05; // velocidade da deformação (respiração/ondular)

  // camadas de deformação (mais camadas + freq maior = deformação mais viva/presente,
  // mas a amplitude somada continua capada em ±10% pelo DEFORM_AMP)
  const DEFS = [
    { dx: 1.0, dy: 0.3, dz: 0.2, freq: 1.4, spd: 1.00 },
    { dx: 0.2, dy: 1.0, dz: 0.4, freq: 1.8, spd: -0.71 },
    { dx: 0.4, dy: 0.5, dz: 1.0, freq: 1.1, spd: 0.53 },
    { dx: 0.8, dy: 0.6, dz: 0.5, freq: 2.3, spd: -0.87 },
  ];

  // camadas de onda sobrepostas (direção x/y/z, frequência e velocidade próprias)
  // a soma delas gera um padrão irregular e imprevisível (manchas de azul)
  const WAVES = [
    { dx: 0.2, dy: 1.0, dz: 0.1, freq: 2.1, spd: 1.00 },
    { dx: 0.9, dy: 0.3, dz: 0.4, freq: 1.6, spd: -0.63 },
    { dx: 0.3, dy: 0.5, dz: 1.0, freq: 2.8, spd: 0.42 },
    { dx: 0.7, dy: 0.8, dz: 0.6, freq: 3.5, spd: -0.87 },
  ];

  // ---- partículas fixas na superfície da esfera (Fibonacci) ----
  const pts = new Float32Array(N * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    pts[i * 3]     = Math.cos(t) * r * RADIUS;
    pts[i * 3 + 1] = y * RADIUS;
    pts[i * 3 + 2] = Math.sin(t) * r * RADIUS;
  }

  // ritmo/fase aleatórios da opacidade (cada partícula pisca desalinhada)
  const opPhase = new Float32Array(N);
  const opSpeed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    opPhase[i] = Math.random() * 6.283;
    opSpeed[i] = 0.5 + Math.random() * 1.5;
  }

  // ---- wireframe: ICOSFERA (icosaedro subdividido) = bola de triângulos ----
  const WIRE_R = 0.95;    // 5% menor que a bola principal (raio 1)
  const WIRE_ALPHA = 0.05;      // opacidade normal das linhas (5%)
  const WIRE_RARE_ALPHA = 0.25; // opacidade na passagem da onda rara PP500 (25%)
  const WIRE_SUB = 1;     // subdivisões: 0=20 triângulos, 1=80, 2=320
  const wireV = [];      // vértices [x,y,z]
  const wireE = [];      // arestas [i, j]
  (function buildWire() {
    const t = (1 + Math.sqrt(5)) / 2;        // razão áurea
    const verts = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
    ];
    let faces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ];
    const R0 = Math.hypot(verts[0][0], verts[0][1], verts[0][2]); // circunraio base
    const mid = (cache, a, b) => {              // ponto médio reprojetado na esfera
      const key = a < b ? a + '_' + b : b + '_' + a;
      if (cache[key] !== undefined) return cache[key];
      const va = verts[a], vb = verts[b];
      let mx = (va[0] + vb[0]) / 2, my = (va[1] + vb[1]) / 2, mz = (va[2] + vb[2]) / 2;
      const g = R0 / Math.hypot(mx, my, mz);
      const idx = verts.length; verts.push([mx * g, my * g, mz * g]); cache[key] = idx; return idx;
    };
    for (let s = 0; s < WIRE_SUB; s++) {        // subdivide cada triângulo em 4
      const cache = {}, nf = [];
      for (let ff = 0; ff < faces.length; ff++) {
        const a = faces[ff][0], b = faces[ff][1], c = faces[ff][2];
        const ab = mid(cache, a, b), bc = mid(cache, b, c), ca = mid(cache, c, a);
        nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
      }
      faces = nf;
    }
    const f = WIRE_R / R0;
    for (let i = 0; i < verts.length; i++) wireV.push([verts[i][0] * f, verts[i][1] * f, verts[i][2] * f]);
    const eset = new Set();                     // arestas únicas das faces
    const addE = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (!eset.has(k)) { eset.add(k); wireE.push([a, b]); } };
    for (let ff = 0; ff < faces.length; ff++) {
      addE(faces[ff][0], faces[ff][1]); addE(faces[ff][1], faces[ff][2]); addE(faces[ff][2], faces[ff][0]);
    }
  })();
  const wsx = new Float32Array(wireV.length);
  const wsy = new Float32Array(wireV.length);
  const wsz = new Float32Array(wireV.length);   // z rotacionado (p/ profundidade da cor)
  // ponto médio de cada aresta (~unitário) pra amostrar a onda de cor
  const emx = new Float32Array(wireE.length);
  const emy = new Float32Array(wireE.length);
  const emz = new Float32Array(wireE.length);
  for (let e = 0; e < wireE.length; e++) {
    const a = wireE[e][0], b = wireE[e][1];
    emx[e] = (wireV[a][0] + wireV[b][0]) / (2 * WIRE_R);
    emy[e] = (wireV[a][1] + wireV[b][1]) / (2 * WIRE_R);
    emz[e] = (wireV[a][2] + wireV[b][2]) / (2 * WIRE_R);
  }

  // ---- animação do símbolo (SVG): BW piscando + ondas esporádicas pc300 ----
  const symRects = Array.from(document.querySelectorAll('.brand:not(.brand--cta) .symbol rect'));
  const symN = symRects.length;
  const symPhase = new Float32Array(symN);
  const symSpeed = new Float32Array(symN);
  const symCx = new Float32Array(symN);
  for (let i = 0; i < symN; i++) {
    symPhase[i] = Math.random() * 6.283;
    symSpeed[i] = 0.8 + Math.random() * 2.0;
    const el = symRects[i];
    const ccx = parseFloat(el.getAttribute('x')) + parseFloat(el.getAttribute('width')) / 2;
    const ccy = parseFloat(el.getAttribute('y')) + parseFloat(el.getAttribute('height')) / 2;
    symCx[i] = (ccx + ccy) * 0.7071; // projeção na diagonal 45°
  }
  const SYM_OPMIN = 0.75;       // opacidade mínima do piscar
  const SYM_WAVE_CHANCE = 0.006; // chance/frame de disparar onda pc300 (esporádica)
  const SYM_WAVE_SPEED = 0.02;   // velocidade da varredura
  const SYM_WAVE_WIDTH = 22;     // largura da banda pc300 (unidades do viewBox)
  let symWave = -1;              // -1 = inativa; 0..1 = varrendo

  // símbolo do header (cta): opacity ESTÁTICA (sem flicker), cor base bb (CSS).
  // Mantém só as ondas pc300 (compartilha a mesma onda do símbolo do topo).
  const ctaSymRects = Array.from(document.querySelectorAll('.brand--cta .symbol rect'));
  const ctaSymCx = new Float32Array(ctaSymRects.length);
  for (let i = 0; i < ctaSymRects.length; i++) {
    const el = ctaSymRects[i];
    const ccx = parseFloat(el.getAttribute('x')) + parseFloat(el.getAttribute('width')) / 2;
    const ccy = parseFloat(el.getAttribute('y')) + parseFloat(el.getAttribute('height')) / 2;
    ctaSymCx[i] = (ccx + ccy) * 0.7071; // projeção na diagonal 45°
  }

  // ---- projeção ----
  let W, H, cx, cy, scale, baseScale, sizeScale, dpr;
  let rotX = 0.35, rotY = 0;
  const SPIN_SPEED = 1.0; // velocidade geral do giro automático
  const GROW_MAX = 5;     // a bola cresce até 5x no fim do scroll

  // container do texto+botão começa exatamente no bottom do título (altura varia)
  const titleEl = document.querySelector('.hero-title');   // título 1 (será dividido em letras)
  const titleWrap = document.querySelector('.hero-title-wrap');
  const ledeWrap = document.querySelector('.hero-lede-wrap');
  const heroLede = document.querySelector('.hero-lede-col'); /* logo Claude + lede animam juntos */
  const heroCta = document.querySelector('.hero-cta');
  const newTitle = document.querySelector('.hero-title2');
  const detailWrap = document.querySelector('.hero-detail-wrap');
  const heroDetail = document.querySelector('.hero-detail');
  if (heroDetail) heroDetail.style.opacity = 0; // começa invisível
  const curriculoHolder = document.querySelector('.agenda-holder');
  const profsHolder = document.querySelector('.profs-holder');
  const profsSec = document.querySelector('.sec-profs');

  // quebra um título em letras (preserva os <strong>) pra animar letra por letra
  const LETTER_WINDOW = 0.35; // fração do progresso que cada letra leva
  function splitLetters(node, out) {
    const kids = Array.from(node.childNodes);
    for (const ch of kids) {
      if (ch.nodeType === 3) { // texto -> palavras (nowrap) com uma letra-span cada
        const frag = document.createDocumentFragment();
        for (const part of ch.textContent.split(/(\s+)/)) {
          if (part === '') continue;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
          const word = document.createElement('span'); // agrupa a palavra -> não quebra no meio
          word.className = 'word';
          for (const c of part) {
            const span = document.createElement('span');
            span.className = 'ltr'; span.textContent = c;
            word.appendChild(span);
            out.push(span);
          }
          frag.appendChild(word);
        }
        node.replaceChild(frag, ch);
      } else if (ch.nodeType === 1) { // entra nos <strong>
        splitLetters(ch, out);
      }
    }
  }
  // disparo escalonado esquerda->direita (ordem de leitura)
  const stagger = (arr) => arr.map((_, i) => arr.length > 1 ? (i / (arr.length - 1)) * (1 - LETTER_WINDOW) : 0);
  const letters = [];  splitLetters(titleEl, letters);
  const letterStart = stagger(letters);
  const letters2 = []; if (newTitle) splitLetters(newTitle, letters2);
  const letterStart2 = stagger(letters2);
  const INTRO_DUR = 1.2; // duração (s) da entrada do título 1 no load
  for (let i = 0; i < letters.length; i++) letters[i].style.opacity = 0;   // entram no load
  for (let i = 0; i < letters2.length; i++) letters2[i].style.opacity = 0; // novo título começa invisível

  // ---- curriculum: entrada coreografada (título letra a letra + cards/CTA staggered) ----
  const curSec = document.querySelector('.agenda');
  const curTitle = document.querySelector('.agenda-title');
  const curCards = Array.from(document.querySelectorAll('.agenda-card'));
  // anima o CONTEÚDO interno de cada card (media + meta), não o card em si,
  // pra não mexer nas linhas (box-shadow fica no .agenda-card e não se move)
  const curCardParts = curCards.map(c => Array.from(c.children));
  // aplica opacity + translateY nas partes internas do card i
  const setCardReveal = (i, v) => {
    const parts = curCardParts[i];
    for (let p = 0; p < parts.length; p++) {
      parts[p].style.opacity = v;
      parts[p].style.transform = 'translateY(' + (48 * (1 - v)) + 'px)';
    }
  };
  const curCta = document.querySelector('.agenda-header-cta');
  const curLetters = []; if (curTitle) splitLetters(curTitle, curLetters);
  const curLetterStart = stagger(curLetters);
  for (let i = 0; i < curLetters.length; i++) curLetters[i].style.opacity = 0;
  for (let i = 0; i < curCards.length; i++) setCardReveal(i, 0);
  if (curCta) curCta.style.opacity = 0;
  if (curriculoHolder) curriculoHolder.style.opacity = 0; // holder começa invisível (fade-in no scroll)
  if (profsSec) profsSec.style.opacity = 0; // instrutores: fade-in no lugar (dirigido pelo fill)

  function positionLede() {
    if (!titleEl) return;
    const b = titleEl.getBoundingClientRect().bottom + 'px';
    if (ledeWrap) ledeWrap.style.top = b;
    if (detailWrap) detailWrap.style.top = b;
  }

  // gradiente CONTÍNUO pelo título: cada letra mostra a fatia do gradiente do título
  // inteiro (background-size = largura do título, position = deslocamento da letra)
  function paintGrad(titleNode, arr) {
    if (!titleNode) return;
    const tr = titleNode.getBoundingClientRect();
    for (let i = 0; i < arr.length; i++) {
      const el = arr[i];
      const x = el.getBoundingClientRect().left - tr.left;
      el.style.backgroundSize = tr.width + 'px 100%';
      el.style.backgroundPosition = (-x) + 'px 0';
    }
  }
  function paintGradient() { paintGrad(titleEl, letters); paintGrad(newTitle, letters2); paintGrad(curTitle, curLetters); }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    cx = (W * dpr) / 2; cy = (H * dpr) / 2 - 128 * dpr; // bola sobe 128px (canvas cobre tudo)
    // tamanho base ancorado em ~544px (topo); cresce via scroll no frame()
    baseScale = Math.min(W, H, 544) * dpr * 0.38;
    // partícula proporcional à bola: encolhe junto em viewports menores
    sizeScale = Math.min(W, H, 544) / 544;
    positionLede();
    paintGradient();
    // grid de quadrados: 2vw normal, 4vw abaixo de 576px
    sq.width = W * dpr; sq.height = H * dpr;
    sqCols = W <= 576 ? 25 : 50;              // 4vw (<=576) ou 2vw
    sqCell = (W / sqCols) * dpr;
    sqRows = Math.ceil((H * dpr) / sqCell);
    sqThresh = new Float32Array(sqCols * sqRows);
    sqPc = new Uint8Array(sqCols * sqRows); // 1 = pc300, 0 = bw
    sqConv = new Float32Array(sqCols * sqRows); // início da conversão pc300->bw
    // de baixo pra cima (base pela linha) + aleatório: alguns de cima surgem antes.
    // aparecem todos até SQ_APPEAR; depois os pc300 convertem pra bw até o fim.
    for (let r = 0; r < sqRows; r++) {
      const base = sqRows > 1 ? (sqRows - 1 - r) / (sqRows - 1) : 0; // 0 embaixo (1º), 1 no topo
      for (let c = 0; c < sqCols; c++) {
        const idx = r * sqCols + c;
        sqThresh[idx] = (base * SQ_BOTTOMUP + Math.random() * (1 - SQ_BOTTOMUP)) * (SQ_APPEAR - SQ_FADE);
        sqPc[idx] = Math.random() < SQ_PC ? 1 : 0;
        sqConv[idx] = SQ_APPEAR + Math.random() * (1 - SQ_APPEAR - SQ_CONV); // vira bw em algum ponto do fim
      }
    }
    // fill bb reverso (depois da agenda): mesmo grid, ordem TOP-DOWN (o "ao contrário")
    sqD.width = W * dpr; sqD.height = H * dpr;
    sqThreshD = new Float32Array(sqCols * sqRows);
    for (let r = 0; r < sqRows; r++) {
      const baseTop = sqRows > 1 ? r / (sqRows - 1) : 0; // 0 no topo (aparece 1º), 1 embaixo
      for (let c = 0; c < sqCols; c++) {
        sqThreshD[r * sqCols + c] = (baseTop * SQ_BOTTOMUP + Math.random() * (1 - SQ_BOTTOMUP)) * (1 - SQ_FADE);
      }
    }
    // altura do profs-holder = altura real do conteúdo + folga de pin (1.2 telas).
    // Assim o sticky só SOLTA depois que o fill+fade terminam (que levam ~1 tela
    // presos no topo), em qualquer altura de tela/conteúdo — inclusive ≤576, onde
    // os cards empilhados passam de 100dvh.
    if (profsHolder && profsSec) {
      profsHolder.style.height = (profsSec.offsetHeight + H * 1.2) + 'px';
    }
  }
  // revela os blocos do hero (escondidos via CSS) só depois do layout correto
  let heroRevealed = false;
  function revealHero() {
    if (heroRevealed) return; heroRevealed = true;
    positionLede(); paintGradient();
    if (titleWrap) titleWrap.style.visibility = 'visible';
    if (ledeWrap) ledeWrap.style.visibility = 'visible';
    if (detailWrap) detailWrap.style.visibility = 'visible';
  }
  window.addEventListener('resize', resize);
  window.addEventListener('load', () => { positionLede(); paintGradient(); resize(); revealHero(); }); // após as fontes
  resize();
  // revela assim que as fontes estiverem prontas (rápido, self-hosted) — evita o flash;
  // fallback no 'load' acima e num timeout de segurança caso fonts.ready não dispare.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { positionLede(); paintGradient(); revealHero(); });
  } else {
    revealHero();
  }
  setTimeout(revealHero, 1500);

  let time = 0;

  // ---- progresso do scroll (0 no topo -> 1 no fim da página) ----
  let scrollP = 0;       // valor suavizado usado na animação
  let scrollTarget = 0;  // alvo cru vindo do scroll
  let scrollPx = 0;      // px de scroll suavizado (dirige as animações do hero)
  function onScroll() {
    const max = 4 * window.innerHeight; // hero = 400vh: as animações do hero completam aqui
    scrollTarget = Math.min(1, Math.max(0, window.scrollY / max));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  scrollP = scrollTarget;

  // ---- onda rara PP500: fica inativa e dispara de vez em quando ----
  let rarePhase = -1;              // -1 = inativa; 0..1 = varrendo
  let rdx = 1, rdy = 0, rdz = 0;   // direção aleatória da varredura
  let radialStart = -1;            // instante em que a onda radial começa (fim do scroll)

  function frame() {
    time += 0.016;

    // scroll suave: scrollP desliza em direção ao alvo (lerp) em vez de saltar
    scrollP += (scrollTarget - scrollP) * 0.08;

    // px de scroll suavizado que dirige a coreografia do hero
    scrollPx += (window.scrollY - scrollPx) * 0.12;
    const VH = window.innerHeight;
    const smooth = (t) => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
    const MID = (128 + VH) / 2; // meio da animação do título

    // (1) título 1: ENTRA letra por letra no load (opacity 0->1 + translateY 24->0)
    // e SAI letra por letra no scroll [128px, 100vh] (fade + translateY -128)
    const introP = Math.min(1, time / INTRO_DUR);
    const tp = Math.min(1, Math.max(0, (scrollPx - 128) / (VH - 128)));
    for (let i = 0; i < letters.length; i++) {
      const inA = smooth((introP - letterStart[i]) / LETTER_WINDOW);  // 0->1 aparece
      const outA = smooth((tp - letterStart[i]) / LETTER_WINDOW);     // 0->1 some
      const el = letters[i];
      el.style.opacity = inA * (1 - outA);
      el.style.transform = 'translateY(' + (24 * (1 - inA) - 128 * outA) + 'px)';
    }

    // (2) lede e botão saem juntos, lados opostos: do MEIO da anim do título até 100vh
    const lc = smooth((scrollPx - MID) / (VH - MID));
    if (heroLede) { heroLede.style.opacity = 1 - lc; heroLede.style.transform = 'translateX(' + (-128 * lc) + 'px)'; }
    if (heroCta)  { heroCta.style.opacity = 1 - lc;  heroCta.style.transform  = 'translateX(' + (128 * lc) + 'px)'; }

    // (3) novo título aparece letra por letra (esq->dir) quando o antigo termina
    // (após 100vh, ao longo de ~60vh): opacity 0->1 + translateY 24->0
    const ntp = Math.min(1, Math.max(0, (scrollPx - VH) / (VH * 0.6)));
    for (let i = 0; i < letters2.length; i++) {
      const a = smooth((ntp - letterStart2[i]) / LETTER_WINDOW);
      const el = letters2[i];
      el.style.opacity = a;
      el.style.transform = 'translateY(' + (24 * (1 - a)) + 'px)';
    }

    // (4) texto de detalhe entra de baixo pra cima, logo após o título 2
    if (heroDetail) {
      const dp = smooth((scrollPx - VH * 1.2) / (VH * 0.6));
      heroDetail.style.opacity = dp;
      heroDetail.style.transform = 'translateY(' + (64 * (1 - dp)) + 'px)';
    }

    // a bola cresce de 1x (topo) até GROW_MAX (fim do scroll)
    const grow = 1 + scrollP * (GROW_MAX - 1);
    scale = baseScale * grow;

    // transparência: 2x mais rápida que o tamanho e termina antes (100% na metade do scroll)
    const scrollAlpha = Math.min(1, scrollP * 2);

    // onda radial 2D PP500: liga no fim do scroll, expande do bottom-center e repete
    const radialGate = Math.min(1, Math.max(0, (scrollP - 0.9) / 0.1)); // fade-in perto do fim
    const rOriginX = canvas.width / 2, rOriginY = canvas.height;        // centro = bottom-center
    const rMaxR = Math.hypot(canvas.width / 2, canvas.height);          // quinas do topo
    const rTravel = rMaxR + RADIAL_BAND * dpr * 1.8;                    // vai ALÉM da borda (sai da tela)
    // ancora o ciclo no momento que chega no fim do scroll -> 1ª onda instantânea
    if (radialGate > 0) { if (radialStart < 0) radialStart = time; }
    else radialStart = -1;
    const rPhase = (((time - radialStart) % RADIAL_CYCLE) + RADIAL_CYCLE) % RADIAL_CYCLE / RADIAL_CYCLE; // 0..1
    const rOn = radialGate > 0 && rPhase < RADIAL_EXPAND;               // expandindo (fora disso = pausa)
    const rRing = rOn ? (rPhase / RADIAL_EXPAND) * rTravel : -1;        // raio atual do anel
    const rBand = RADIAL_BAND * dpr;

    // giro automático rápido e com velocidade variável (ondas lentas somadas =
    // acelera/desacelera e muda de sentido de forma orgânica/aleatória)
    const spinY = (0.005 + Math.sin(time * 0.31) * 0.004 + Math.sin(time * 0.13 + 1.7) * 0.003) * SPIN_SPEED;
    const spinX = (0.002 + Math.sin(time * 0.23 + 2.1) * 0.003 + Math.sin(time * 0.09 + 0.5) * 0.002) * SPIN_SPEED;
    rotY += spinY;
    rotX += spinX;

    // dispara/avança a onda rara
    if (rarePhase < 0) {
      if (Math.random() < RARE_CHANCE) {
        rarePhase = 0;
        const a = Math.random() * 6.283, u = Math.random() * 2 - 1, s = Math.sqrt(1 - u * u);
        rdx = s * Math.cos(a); rdy = s * Math.sin(a); rdz = u; // direção aleatória na esfera
      }
    } else {
      rarePhase += RARE_SPEED;
      if (rarePhase > 1) rarePhase = -1; // terminou, volta a ficar rara
    }
    const rareCenter = -1.3 + rarePhase * 2.6; // banda cruza a bola de um lado ao outro

    const sinY = Math.sin(rotY), cosY = Math.cos(rotY);
    const sinX = Math.sin(rotX), cosX = Math.cos(rotX);

    ctx.fillStyle = '#00000A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < N; i++) {
      const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];

      // deformação leve e aleatória: empurra a partícula pra dentro/fora do raio
      let dsum = 0;
      for (let d = 0; d < DEFS.length; d++) {
        const dv = DEFS[d];
        const proj = x * dv.dx + y * dv.dy + z * dv.dz;
        dsum += Math.sin((proj * dv.freq - time * DEFORM_SPEED * dv.spd) * Math.PI);
      }
      const rscale = 1 + (dsum / DEFS.length) * DEFORM_AMP; // raio ondula ~1
      const dx = x * rscale, dy = y * rscale, dz = z * rscale;

      const x1 = dx * cosY - dz * sinY;
      const z1 = dx * sinY + dz * cosY;
      const y1 = dy * cosX - z1 * sinX;
      const z2 = dy * sinX + z1 * cosX;

      const persp = 1 / (2.4 - z2);
      const sx = cx + x1 * scale * persp * 2.4;
      const sy = cy + y1 * scale * persp * 2.4;

      const depth = (z2 + 1) / 2;                // 0 atrás, 1 frente

      // máscara "de trás": ondas só nas partículas do fundo; frente = nada
      // (1 no fundo, cai a 0 no equador; frente fica sem efeito de onda)
      const backMask = Math.min(1, Math.max(0, (0.5 - depth) / 0.3));

      // ondas passageiras aleatórias: soma de várias camadas em direções diferentes
      let sum = 0;
      for (let w = 0; w < WAVES.length; w++) {
        const wv = WAVES[w];
        const proj = x * wv.dx + y * wv.dy + z * wv.dz; // posição fixa da partícula
        sum += Math.sin((proj * wv.freq - time * WAVE_SPEED * wv.spd) * Math.PI);
      }
      let wave = (sum / WAVES.length) * 0.5 + 0.5;  // 0..1 (padrão irregular)
      wave = Math.pow(wave, WAVE_SHARP);            // manchas de azul mais definidas

      // B&W base (brilho pela profundidade) + onda contínua clareando pro PC300
      const gray = 35 + depth * 200;             // tom B&W
      let r = Math.round(gray + (PC300[0] - gray) * wave);
      let g = Math.round(gray + (PC300[1] - gray) * wave);
      let b = Math.round(gray + (PC300[2] - gray) * wave);

      // onda rara PP500: banda gaussiana varrendo em direção aleatória
      let rare = 0;
      if (rarePhase >= 0) {
        const projR = x * rdx + y * rdy + z * rdz; // ~ -1..1
        const dd = (projR - rareCenter) / RARE_WIDTH;
        rare = Math.exp(-dd * dd) * RARE_MIX;      // 0..~0.95
        if (rare > 0.002) {
          r = Math.round(r + (PP500[0] - r) * rare);
          g = Math.round(g + (PP500[1] - g) * rare);
          b = Math.round(b + (PP500[2] - b) * rare);
        }
      }

      // onda radial 2D BW: anel (tela) do bottom-center, SÓ nas partículas de trás
      let rad = 0;
      if (rRing >= 0 && backMask > 0) {
        const d2d = Math.hypot(sx - rOriginX, sy - rOriginY);
        const dd2 = (d2d - rRing) / rBand;
        rad = Math.exp(-dd2 * dd2) * RADIAL_MIX * radialGate * backMask;
        if (rad > 0.002) {
          r = Math.round(r + (BW[0] - r) * rad);
          g = Math.round(g + (BW[1] - g) * rad);
          b = Math.round(b + (BW[2] - b) * rad);
        }
      }

      // transparência pela profundidade, invertendo conforme o scroll (extremos completos):
      // scrollP 0 = frente visível 100% / trás transparente 0%
      // scrollP 1 = frente transparente 0% / trás visível 100%
      const depthAlpha = depth * (1 - scrollAlpha) + (1 - depth) * scrollAlpha;
      let alpha = depthAlpha; // 0 (transparência total) -> 1 (visibilidade total)

      // tamanho proporcional: perspectiva real (depth) escala junto com a bola (grow).
      // como tudo cresce pelo mesmo fator, a partícula do fundo (0.6) chega ao tamanho
      // da maior da superfície inicial (2.4) quando grow = 4 (2.4 / 0.6).
      const size = (0.6 + depth * 1.8) * dpr * grow * sizeScale;

      // opacidade aleatória por partícula (piscar desalinhado)
      let opVar = OPACITY_MIN + (Math.sin(time * OPACITY_SPEED * opSpeed[i] + opPhase[i]) * 0.5 + 0.5) * (1 - OPACITY_MIN);
      opVar += (1 - opVar) * Math.max(rare, rad); // onda (rara ou radial) volta pra opacidade cheia
      alpha *= opVar;
      alpha *= (1 - radialGate * 0.7); // fim do scroll: base mais transparente (ênfase na onda BW)
      alpha = alpha + (1 - alpha) * rad; // onda radial (de trás): crista SEM transparência

      // partículas "extras" (1/3) surgem conforme o scroll -> a bola vai a 1200 no fim
      if (i % 3 === 2) alpha *= scrollP;
      if (alpha < 0.01) continue; // não desenha o invisível (perf)

      // núcleo da partícula: quadrado (cor exata BW/PC300)
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha.toFixed(3) + ')';
      const s2 = size * 2;
      ctx.fillRect(sx - size, sy - size, s2, s2);
    }

    // ---- wireframe dentro da bola, variando de cor com a mesma onda das partículas ----
    for (let k = 0; k < wireV.length; k++) {
      const v = wireV[k];
      const wx1 = v[0] * cosY - v[2] * sinY;
      const wz1 = v[0] * sinY + v[2] * cosY;
      const wy1 = v[1] * cosX - wz1 * sinX;
      const wz2 = v[1] * sinX + wz1 * cosX;
      const wpersp = 1 / (2.4 - wz2);
      wsx[k] = cx + wx1 * scale * wpersp * 2.4;
      wsy[k] = cy + wy1 * scale * wpersp * 2.4;
      wsz[k] = wz2;
    }
    ctx.lineWidth = 2 * dpr; // mínimo 2px
    for (let e = 0; e < wireE.length; e++) {
      const a = wireE[e][0], b = wireE[e][1];
      // onda de cor (gray -> PC300) no ponto médio da aresta, igual às partículas
      let wsum = 0;
      for (let w = 0; w < WAVES.length; w++) {
        const wv = WAVES[w];
        const proj = emx[e] * wv.dx + emy[e] * wv.dy + emz[e] * wv.dz;
        wsum += Math.sin((proj * wv.freq - time * WAVE_SPEED * wv.spd) * Math.PI);
      }
      let wwave = (wsum / WAVES.length) * 0.5 + 0.5;
      wwave = Math.pow(wwave, WAVE_SHARP);
      const wdepth = ((wsz[a] + wsz[b]) * 0.5 / WIRE_R + 1) / 2;
      const wgray = 35 + wdepth * 200;
      let wr = Math.round(wgray + (PC300[0] - wgray) * wwave);
      let wg = Math.round(wgray + (PC300[1] - wgray) * wwave);
      let wb = Math.round(wgray + (PC300[2] - wgray) * wwave);
      // onda rara PP500 (esporádica): tinge PP500 e sobe a opacidade pra 50%
      let wrare = 0;
      if (rarePhase >= 0) {
        const projR = emx[e] * rdx + emy[e] * rdy + emz[e] * rdz;
        const ddR = (projR - rareCenter) / RARE_WIDTH;
        wrare = Math.exp(-ddR * ddR) * RARE_MIX;
        if (wrare > 0.002) {
          wr = Math.round(wr + (PP500[0] - wr) * wrare);
          wg = Math.round(wg + (PP500[1] - wg) * wrare);
          wb = Math.round(wb + (PP500[2] - wb) * wrare);
        }
      }
      const walpha = WIRE_ALPHA + (WIRE_RARE_ALPHA - WIRE_ALPHA) * wrare;
      ctx.strokeStyle = 'rgba(' + wr + ',' + wg + ',' + wb + ',' + walpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(wsx[a], wsy[a]);
      ctx.lineTo(wsx[b], wsy[b]);
      ctx.stroke();
    }

    // ---- símbolo: piscar aleatório BW + onda esporádica pc300 (varre em 45°) ----
    if (symWave < 0) { if (Math.random() < SYM_WAVE_CHANCE) symWave = 0; }
    else { symWave += SYM_WAVE_SPEED; if (symWave > 1) symWave = -1; }
    const symWC = -20 + symWave * 160; // centro da banda cruza a diagonal (com folga)
    for (let i = 0; i < symN; i++) {
      const flick = SYM_OPMIN + (Math.sin(time * symSpeed[i] + symPhase[i]) * 0.5 + 0.5) * (1 - SYM_OPMIN);
      let wv = 0;
      if (symWave >= 0) { const dd = (symCx[i] - symWC) / SYM_WAVE_WIDTH; wv = Math.exp(-dd * dd); }
      const rr = Math.round(245 + (PC300[0] - 245) * wv); // BW #F5F5FF -> pc300 na crista
      const gg = Math.round(245 + (PC300[1] - 245) * wv);
      const el = symRects[i];
      el.style.opacity = flick.toFixed(3);
      el.setAttribute('fill', 'rgb(' + rr + ',' + gg + ',255)');
    }
    // símbolo do header (cta): opacity estática; só as ondas pc300 (bb -> pc300 na crista)
    for (let i = 0; i < ctaSymRects.length; i++) {
      let wv = 0;
      if (symWave >= 0) { const dd = (ctaSymCx[i] - symWC) / SYM_WAVE_WIDTH; wv = Math.exp(-dd * dd); }
      const rr = Math.round(PC300[0] * wv);              // bb 0 -> pc300 100
      const bch = Math.round(10 + (PC300[2] - 10) * wv); // bb 10 -> pc300 255
      ctaSymRects[i].setAttribute('fill', 'rgb(' + rr + ',' + rr + ',' + bch + ')');
    }

    // ---- preenchimento: após os 400vh do hero, a tela enche de quadrados 2vw BW ----
    const fillP = Math.min(1, Math.max(0, (window.scrollY - 4 * VH) / (2 * VH)));
    sqx.clearRect(0, 0, sq.width, sq.height);
    if (fillP > 0 && sqThresh) {
      const n = sqCols * sqRows;
      for (let k = 0; k < n; k++) {
        let a = (fillP - sqThresh[k]) / SQ_FADE; // fade-in por quadrado
        if (a <= 0) continue;
        if (a > 1) a = 1;
        a = a * a * (3 - 2 * a); // smoothstep
        let fr = 235, fg = 235, fb = 245; // --ln100 #EBEBF5
        if (sqPc[k]) { // pc300 que converte pra ln100 ao continuar o scroll
          let cv = (fillP - sqConv[k]) / SQ_CONV;
          cv = cv < 0 ? 0 : cv > 1 ? 1 : cv;
          cv = cv * cv * (3 - 2 * cv);
          fr = Math.round(100 + 135 * cv); fg = fr; // 100 (pc300) -> 235 (ln100)
          fb = Math.round(255 - 10 * cv);           // 255 (pc300) -> 245 (ln100)
        }
        sqx.fillStyle = 'rgba(' + fr + ',' + fg + ',' + fb + ',' + a.toFixed(3) + ')';
        const c = k % sqCols, r = (k / sqCols) | 0;
        // fronteiras inteiras: borda direita/base de uma célula == esquerda/topo
        // da próxima, então o espaço é exato (sem gap nem sobreposição de 1px)
        const x0 = Math.round(c * sqCell), x1 = Math.round((c + 1) * sqCell);
        const y0 = Math.round(r * sqCell), y1 = Math.round((r + 1) * sqCell);
        sqx.fillRect(x0, y0, x1 - x0, y1 - y0);
      }
    }

    // ---- fill bb REVERSO: depois da agenda, os quadrados escurecem a tela de volta ----
    sqxD.clearRect(0, 0, sqD.width, sqD.height);
    if (profsHolder && sqThreshD) {
      // dirigido pelo profs-holder: fillLen 2 => 50% do fill exatamente quando
      // o sec-profs prende no topo (aí ele começa a esmaecer).
      const dsTop = profsHolder.getBoundingClientRect().top;
      const darkFillP = Math.min(1, Math.max(0, (VH - dsTop) / (VH * 2)));
      if (darkFillP > 0) {
        const n = sqCols * sqRows;
        for (let k = 0; k < n; k++) {
          let a = (darkFillP - sqThreshD[k]) / SQ_FADE;
          if (a <= 0) continue;
          if (a > 1) a = 1;
          a = a * a * (3 - 2 * a); // smoothstep
          sqxD.fillStyle = 'rgba(0,0,10,' + a.toFixed(3) + ')'; // bb #00000A
          const c = k % sqCols, r = (k / sqCols) | 0;
          const x0 = Math.round(c * sqCell), x1 = Math.round((c + 1) * sqCell);
          const y0 = Math.round(r * sqCell), y1 = Math.round((r + 1) * sqCell);
          sqxD.fillRect(x0, y0, x1 - x0, y1 - y0);
        }
      }
    }

    // ---- fade-in dos holders (esmaecem no lugar; roda SEMPRE, sem gating) ----
    {
      const isMob = window.innerWidth < 865;
      // agenda: mobile = fade ao entrar na viewport; desktop = fade ao prender (sticky)
      if (curriculoHolder && curSec) {
        const t = curSec.getBoundingClientRect().top;
        curriculoHolder.style.opacity = isMob
          ? smooth((VH * 0.9 - t) / (VH * 0.4))
          : smooth(Math.max(0, -t) / (VH * 0.5));
      }
      // instrutores (sticky no topo): esmaece começando na METADE do fill; ao
      // terminar, o holder solta e rola normalmente.
      if (profsSec && profsHolder) {
        const dfp = Math.min(1, Math.max(0, (VH - profsHolder.getBoundingClientRect().top) / (VH * 2)));
        profsSec.style.opacity = smooth((dfp - 0.5) / 0.5);
      }
    }

    // ---- curriculum: título letra a letra + cards e CTA com translate/opacity staggered ----
    if (curSec) {
      if (window.innerWidth < 865) {
        // mobile: sem pin (scroll normal), então cada elemento aparece ao ENTRAR
        // na viewport. Mesma linguagem do desktop (translateY + opacity), com
        // stagger natural: título letra a letra, cada card pela própria entrada.
        const enter = (el) => {
          const top = el.getBoundingClientRect().top;
          return smooth((VH * 0.9 - top) / (VH * 0.35)); // 0 aos 90% da tela, 1 aos 55%
        };
        const tRp = curTitle ? enter(curTitle) : 1;
        for (let i = 0; i < curLetters.length; i++) {
          const a = smooth((tRp - curLetterStart[i]) / LETTER_WINDOW);
          curLetters[i].style.opacity = a;
          curLetters[i].style.transform = 'translateY(' + (24 * (1 - a)) + 'px)';
        }
        for (let i = 0; i < curCards.length; i++) {
          setCardReveal(i, enter(curCards[i]));
        }
        if (curCta) {
          const cc = enter(curCta);
          curCta.style.opacity = cc;
          curCta.style.transform = 'translateX(' + (24 * (1 - cc)) + 'px)';
        }
      } else {
        const rp = Math.min(1, Math.max(0, -curSec.getBoundingClientRect().top) / (VH * 0.5)); // 0..1 ao prender
        for (let i = 0; i < curLetters.length; i++) {
          const a = smooth((rp - curLetterStart[i]) / LETTER_WINDOW);
          curLetters[i].style.opacity = a;
          curLetters[i].style.transform = 'translateY(' + (24 * (1 - a)) + 'px)';
        }
        const CARD_STAGGER = 0.12, CARD_WIN = 0.4;
        for (let i = 0; i < curCards.length; i++) {
          setCardReveal(i, smooth((rp - i * CARD_STAGGER) / CARD_WIN));
        }
        if (curCta) {
          const cc = smooth((rp - 0.1) / CARD_WIN);
          curCta.style.opacity = cc;
          curCta.style.transform = 'translateX(' + (24 * (1 - cc)) + 'px)';
        }
      }
    }

    requestAnimationFrame(frame);
  }
  frame();
})();

/* Driver do agenda: o stage é sticky (prende no topo). Enquanto sobe
   atrás do branco ele fica invisível (opacity 0); ao prender, faz FADE-IN no
   lugar (primeiros FADE px); depois disso os cards deslizam na horizontal. */
(function () {
    var sec   = document.querySelector('.agenda');
    var grid  = document.querySelector('.agenda-grid');
    var stage = document.querySelector('.agenda-stage');
    if (!sec || !grid || !stage) return;

    function isSmall() { return window.innerWidth < 865; }
    function fadeRange() { return window.innerHeight * 0.5; } // 50vh de fade in-place

    function maxTranslate() {
        if (isSmall()) return 0;
        var width = sec.clientWidth;
        var cards = grid.querySelectorAll('.agenda-card');
        if (!cards.length) return Math.max(0, grid.scrollWidth - width);
        var last = cards[cards.length - 1];
        var gap = Math.max(16, width / 2 - 720);
        return Math.max(0, last.offsetLeft + last.offsetWidth - (width - gap));
    }

    function updateHeight() {
        if (isSmall()) { sec.style.height = ''; return; }
        /* 100dvh do stage + 50dvh do fade-in-place (fadeRange = 0.5 da altura).
           Mantemos ambos em dvh (não em px de JS) pra a altura acompanhar o
           viewport em TEMPO REAL — barra de URL no mobile, resize, etc. Só o
           maxTranslate (depende de largura) fica em px. */
        sec.style.height = 'calc(150dvh + ' + maxTranslate() + 'px)';
    }

    function apply() {
        if (isSmall()) { grid.style.transform = ''; return; }
        var progress = Math.max(0, -sec.getBoundingClientRect().top);
        // reveal dos elementos roda nos primeiros fadeRange px; horizontal só depois
        var pos = Math.min(Math.max(0, progress - fadeRange()), maxTranslate());
        grid.style.transform = 'translateX(' + (-pos) + 'px)';
    }

    function recalc() { updateHeight(); apply(); }
    window.addEventListener('scroll', apply, { passive: true });
    window.addEventListener('resize', recalc);
    window.addEventListener('load', recalc);
    window._agendaRecalc = recalc;
    updateHeight();
    apply();
})();

/* Relocate do header pra dentro do grid em wide-short (vw>864 + vh<864) — vira
   "primeiro card" na mesma linha. */
(function () {
    var stage  = document.querySelector('.agenda-stage');
    var track  = document.querySelector('.agenda-track');
    var grid   = document.querySelector('.agenda-grid');
    var header = document.querySelector('.agenda-header');
    if (!stage || !track || !grid || !header) return;

    var mq = window.matchMedia('(min-width: 865px) and (max-height: 864px)');

    function relocate() {
        if (mq.matches) {
            if (header.parentNode !== grid) {
                grid.insertBefore(header, grid.firstChild);
                header.classList.add('agenda-header--inline');
                var spacer = document.createElement('div');
                spacer.className = 'agenda-spacer';
                spacer.setAttribute('aria-hidden', 'true');
                grid.insertBefore(spacer, header);
            }
        } else {
            if (header.parentNode !== stage) {
                // o header volta pro topo do stage, ANTES do track (grid agora
                // vive dentro do .agenda-track, não é mais filho do stage)
                stage.insertBefore(header, track);
                header.classList.remove('agenda-header--inline');
                var spacer = grid.querySelector('.agenda-spacer');
                if (spacer) spacer.parentNode.removeChild(spacer);
            }
        }
        if (typeof window._agendaRecalc === 'function') {
            window._agendaRecalc();
        }
    }

    relocate();
    if (mq.addEventListener) mq.addEventListener('change', relocate);
    else mq.addListener(relocate);
    window.addEventListener('orientationchange', relocate);
})();

/* Smooth scroll leve (lerp da posição real, sem dependência). Move o window.scrollY
   de verdade, então fill/curriculum/hero seguem o valor suavizado. Touch fica nativo. */
(function () {
    if (window.matchMedia('(pointer: coarse)').matches) return; // mobile/touch: nativo
    var EASE = 0.12;
    var target = window.scrollY;
    var current = target;
    var raf = null;
    function maxScroll() { return document.documentElement.scrollHeight - window.innerHeight; }
    function clamp(v) { return Math.max(0, Math.min(v, maxScroll())); }
    function tick() {
        current += (target - current) * EASE;
        if (Math.abs(target - current) < 0.5) { current = target; raf = null; }
        else raf = requestAnimationFrame(tick);
        window.scrollTo(0, current);
    }
    window.addEventListener('wheel', function (e) {
        e.preventDefault();
        var dy = e.deltaY;
        if (e.deltaMode === 1) dy *= 16;               // linhas -> px
        else if (e.deltaMode === 2) dy *= window.innerHeight; // páginas -> px
        target = clamp(target + dy);
        if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: false });
    // resync se o scroll mudar por outro meio (barra, teclado) enquanto parado
    window.addEventListener('scroll', function () {
        if (!raf) { target = window.scrollY; current = target; }
    });
    // no resize o scrollHeight muda: cancela o rAF pendente e ressincroniza a
    // posição com a real (senão o tick fica forçando scrollTo num valor velho e
    // a página "trava e nunca mais volta" ao ajustar o viewport)
    window.addEventListener('resize', function () {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        current = target = clamp(window.scrollY);
    });
})();

/* Esfera de partículas compacta no header do card da oferta (onde era o vídeo).
   Auto-contida: gira sozinha, quadradinhos com profundidade + onda pc300 esporádica. */
(function () {
  const cv = document.getElementById('completa-ball');
  if (!cv) return;
  const g = cv.getContext('2d');
  const N = 1200, PC300 = [100, 100, 255], PP500 = [150, 0, 255];
  const WIRE_R = 0.95, WIRE_ALPHA = 0.05, WIRE_RARE_ALPHA = 0.25, WIRE_SUB = 1;
  const RARE_CHANCE = 0.006, RARE_SPEED = 0.01, RARE_WIDTH = 0.4, RARE_MIX = 0.95;
  const pts = new Float32Array(N * 3);
  const opPhase = new Float32Array(N), opSpeed = new Float32Array(N);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = golden * i;
    pts[i * 3] = Math.cos(a) * r; pts[i * 3 + 1] = y; pts[i * 3 + 2] = Math.sin(a) * r;
    opPhase[i] = Math.random() * 6.283; opSpeed[i] = 0.8 + Math.random() * 1.5;
  }
  // esfera de triângulos (icosaedro subdividido, 5% menor) — igual ao hero
  const wireV = [], wireE = [];
  (function () {
    const t = (1 + Math.sqrt(5)) / 2;
    const verts = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
    let faces = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
    const R0 = Math.hypot(verts[0][0], verts[0][1], verts[0][2]);
    const mid = (c, a, b) => { const k = a<b?a+'_'+b:b+'_'+a; if (c[k]!==undefined) return c[k]; const va=verts[a],vb=verts[b]; let mx=(va[0]+vb[0])/2,my=(va[1]+vb[1])/2,mz=(va[2]+vb[2])/2; const gg=R0/Math.hypot(mx,my,mz); const idx=verts.length; verts.push([mx*gg,my*gg,mz*gg]); c[k]=idx; return idx; };
    for (let s = 0; s < WIRE_SUB; s++) { const c={}, nf=[]; for (let ff=0; ff<faces.length; ff++){ const a=faces[ff][0],b=faces[ff][1],cc=faces[ff][2]; const ab=mid(c,a,b),bc=mid(c,b,cc),ca=mid(c,cc,a); nf.push([a,ab,ca],[b,bc,ab],[cc,ca,bc],[ab,bc,ca]); } faces=nf; }
    const f = WIRE_R / R0;
    for (let i = 0; i < verts.length; i++) wireV.push([verts[i][0]*f, verts[i][1]*f, verts[i][2]*f]);
    const eset = new Set(); const addE = (a,b) => { const k=a<b?a+'_'+b:b+'_'+a; if(!eset.has(k)){eset.add(k); wireE.push([a,b]);} };
    for (let ff=0; ff<faces.length; ff++){ addE(faces[ff][0],faces[ff][1]); addE(faces[ff][1],faces[ff][2]); addE(faces[ff][2],faces[ff][0]); }
  })();
  const WN = wireV.length;
  const wvx = new Float32Array(WN), wvy = new Float32Array(WN), wvz = new Float32Array(WN);
  const wsx = new Float32Array(WN), wsy = new Float32Array(WN);
  let W, H, dpr, cx, cy, scale;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cx = cv.width / 2; cy = cv.height / 2;
    scale = 544 * dpr * 0.38; // mesmo tamanho da esfera do hero antes do scroll
  }
  window.addEventListener('resize', resize); resize();
  let time = 0, rotY = 0, wave = -1, rarePhase = -1, rdx = 1, rdy = 0, rdz = 0;
  const order = new Array(N);
  var compSec = document.querySelector('.completa');
  function ballVisible() {
    if (!compSec) return true;
    var r = compSec.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }
  function frame() {
    if (document.hidden || !ballVisible()) { requestAnimationFrame(frame); return; }
    time += 0.016; rotY += 0.006;
    if (!W) resize();
    g.clearRect(0, 0, cv.width, cv.height);
    const cY = Math.cos(rotY), sY = Math.sin(rotY);
    const rotX = 0.35, cX = Math.cos(rotX), sX = Math.sin(rotX);
    // onda pc300 (banda varrendo) + onda RARA pp500 (esporádica, direção aleatória)
    if (wave < 0) { if (Math.random() < 0.008) wave = 0; } else { wave += 0.02; if (wave > 1) wave = -1; }
    const wc = -1.3 + wave * 2.6;
    if (rarePhase < 0) {
      if (Math.random() < RARE_CHANCE) {
        rarePhase = 0;
        const a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1);
        rdx = Math.sin(b) * Math.cos(a); rdy = Math.sin(b) * Math.sin(a); rdz = Math.cos(b);
      }
    } else { rarePhase += RARE_SPEED; if (rarePhase > 1) rarePhase = -1; }
    const rareCenter = -1.3 + rarePhase * 2.6;
    // ---- partículas ----
    for (let i = 0; i < N; i++) {
      const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
      const x1 = x * cY - z * sY, z1 = x * sY + z * cY;
      const y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
      order[i] = [x1, y1, z2, i];
    }
    order.sort((a, b) => a[2] - b[2]);
    for (let k = 0; k < N; k++) {
      const p = order[k], x1 = p[0], y1 = p[1], z2 = p[2], i = p[3];
      const persp = 1 / (2.4 - z2);
      const sx = cx + x1 * scale * persp * 2.4, sy = cy + y1 * scale * persp * 2.4;
      const depth = (z2 + 1) / 2;
      const base = 60 + depth * 195;
      let wv = 0; if (wave >= 0) { const dd = (x1 - wc) / 0.4; wv = Math.exp(-dd * dd); }
      let rr = Math.round(base + (PC300[0]-base)*wv), gg = Math.round(base + (PC300[1]-base)*wv), bb = Math.round(base + (PC300[2]-base)*wv);
      let rare = 0;
      if (rarePhase >= 0) { const pr = x1*rdx + y1*rdy + z2*rdz; const dr = (pr - rareCenter)/RARE_WIDTH; rare = Math.exp(-dr*dr)*RARE_MIX; if (rare > 0.002) { rr = Math.round(rr + (PP500[0]-rr)*rare); gg = Math.round(gg + (PP500[1]-gg)*rare); bb = Math.round(bb + (PP500[2]-bb)*rare); } }
      let alpha = depth * (0.6 + (Math.sin(time*opSpeed[i]+opPhase[i])*0.5+0.5)*0.4);
      alpha += (1 - alpha) * Math.max(wv, rare); // crista (pc300 ou pp500) volta a opacidade cheia
      if (alpha < 0.02) continue;
      const size = (0.6 + depth * 1.8) * dpr;
      g.fillStyle = 'rgba(' + rr + ',' + gg + ',' + bb + ',' + alpha.toFixed(3) + ')';
      g.fillRect(sx - size, sy - size, size * 2, size * 2);
    }
    // ---- esfera de triângulos (wireframe), mesma onda de cor + pp500 rara ----
    for (let k = 0; k < WN; k++) {
      const v = wireV[k];
      const wx1 = v[0]*cY - v[2]*sY, wz1 = v[0]*sY + v[2]*cY;
      const wy1 = v[1]*cX - wz1*sX, wz2 = v[1]*sX + wz1*cX;
      const wpersp = 1 / (2.4 - wz2);
      wvx[k] = wx1; wvy[k] = wy1; wvz[k] = wz2;
      wsx[k] = cx + wx1 * scale * wpersp * 2.4; wsy[k] = cy + wy1 * scale * wpersp * 2.4;
    }
    g.lineWidth = 2 * dpr;
    for (let e = 0; e < wireE.length; e++) {
      const a = wireE[e][0], b = wireE[e][1];
      const mxr = (wvx[a]+wvx[b])/2, myr = (wvy[a]+wvy[b])/2, mzr = (wvz[a]+wvz[b])/2;
      let wv = 0; if (wave >= 0) { const dd = (mxr - wc)/0.4; wv = Math.exp(-dd*dd); }
      const wdepth = ((wvz[a]+wvz[b])*0.5 / WIRE_R + 1) / 2;
      const wgray = 35 + wdepth * 200;
      let wr = Math.round(wgray + (PC300[0]-wgray)*wv), wg = Math.round(wgray + (PC300[1]-wgray)*wv), wb = Math.round(wgray + (PC300[2]-wgray)*wv);
      let wrare = 0;
      if (rarePhase >= 0) { const pr = mxr*rdx + myr*rdy + mzr*rdz; const dr = (pr - rareCenter)/RARE_WIDTH; wrare = Math.exp(-dr*dr)*RARE_MIX; if (wrare > 0.002) { wr = Math.round(wr + (PP500[0]-wr)*wrare); wg = Math.round(wg + (PP500[1]-wg)*wrare); wb = Math.round(wb + (PP500[2]-wb)*wrare); } }
      const walpha = WIRE_ALPHA + (WIRE_RARE_ALPHA - WIRE_ALPHA) * wrare;
      g.strokeStyle = 'rgba(' + wr + ',' + wg + ',' + wb + ',' + walpha.toFixed(3) + ')';
      g.beginPath(); g.moveTo(wsx[a], wsy[a]); g.lineTo(wsx[b], wsy[b]); g.stroke();
    }
    requestAnimationFrame(frame);
  }
  frame();
})();

/* Bônus (gains, estilo sec-formacoes): nav sticky + cards empilhados. Clicar num
   botão rola até o card; conforme o scroll, o card no centro ativa seu botão (scroll-spy). */
(function () {
  var navWrap = document.querySelector('.gains-nav');
  var nav = document.querySelectorAll('.gains-nav-item');
  var cards = document.querySelectorAll('.gains-cards .gains-card');
  if (!navWrap || !nav.length || !cards.length) return;
  /* nav-item correspondente a um card */
  function itemFor(id) {
    for (var i = 0; i < nav.length; i++) if (nav[i].getAttribute('data-target') === id) return nav[i];
    return null;
  }
  /* clicar rola até o TOPO do card encostar no BOTTOM do nav-item correspondente */
  nav.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = document.getElementById(btn.getAttribute('data-target'));
      if (!t) return;
      var delta = t.getBoundingClientRect().top - btn.getBoundingClientRect().bottom;
      window.scrollTo({ top: window.scrollY + delta, behavior: 'smooth' });
    });
  });
  /* revela header + nav ao entrar na seção */
  var sec = document.querySelector('.gains');
  if (sec) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { sec.classList.add('is-in'); secObs.disconnect(); } });
    }, { rootMargin: '0px 0px -20% 0px' });
    secObs.observe(sec);
  }
  /* revela o conteúdo de cada card ao entrar na viewport (animação de entrada) */
  var rev = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('is-revealed'); });
  }, { rootMargin: '-10% 0px -10% 0px', threshold: 0 });
  cards.forEach(function (c) { rev.observe(c); });
  /* scroll-spy: ativa o botão cujo card teve o TOPO alcançado pelo BOTTOM do seu nav-item */
  var ticking = false;
  function spy() {
    ticking = false;
    var activeId = cards[0].id;
    cards.forEach(function (c) {
      var it = itemFor(c.id);
      var ref = it ? it.getBoundingClientRect().bottom : navWrap.getBoundingClientRect().bottom;
      if (c.getBoundingClientRect().top <= ref + 1) activeId = c.id;
    });
    nav.forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-target') === activeId); });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  spy();
})();

/* completa: título letra a letra + revela (canoa + sub + tiles + card) ao entrar */
(function () {
  var sec = document.querySelector('.completa');
  if (!sec) return;
  var h2 = sec.querySelector('.completa-h2');
  var letters = [];
  /* quebra o título em palavras/letras (preserva <strong>) */
  function split(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
      if (ch.nodeType === 3) {
        var frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(function (part) {
          if (part === '') return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var word = document.createElement('span'); word.className = 'word';
          part.split('').forEach(function (c) {
            var s = document.createElement('span'); s.className = 'ltr'; s.textContent = c;
            word.appendChild(s); letters.push(s);
          });
          frag.appendChild(word);
        });
        node.replaceChild(frag, ch);
      } else if (ch.nodeType === 1) { split(ch); }
    });
  }
  if (h2) {
    split(h2);
    /* gradiente CONTÍNUO pelo título: cada letra mostra sua fatia do gradiente */
    function paint() {
      var tr = h2.getBoundingClientRect();
      for (var i = 0; i < letters.length; i++) {
        var x = letters[i].getBoundingClientRect().left - tr.left;
        letters[i].style.backgroundSize = tr.width + 'px 100%';
        letters[i].style.backgroundPosition = (-x) + 'px 0';
      }
    }
    for (var i = 0; i < letters.length; i++) {
      letters[i].style.transitionDelay = (letters.length > 1 ? (i / (letters.length - 1)) * 0.4 : 0) + 's';
    }
    paint();
    window.addEventListener('resize', paint);
    window.addEventListener('load', paint);
  }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { sec.classList.add('is-in'); obs.disconnect(); } });
  }, { rootMargin: '0px 0px -20% 0px' });
  obs.observe(sec);
})();

/* linhas horizontais do gains full-viewport: offset (esquerda da coluna dos cards)
   e largura (clientWidth, sem a scrollbar) expostos como CSS vars.
   Também: gains-nav ganha min-height = altura do 1º card (bottom encostando). */
(function () {
  var gc = document.querySelector('.gains-cards');
  var nav = document.querySelector('.gains-nav');
  var firstCard = document.querySelector('.gains-cards .gains-card');
  if (!gc) return;
  function upd() {
    document.documentElement.style.setProperty('--gains-cards-left', gc.getBoundingClientRect().left + 'px');
    document.documentElement.style.setProperty('--gains-vw', document.documentElement.clientWidth + 'px');
    if (nav && firstCard) {
      if (window.innerWidth > 864) nav.style.minHeight = firstCard.getBoundingClientRect().height + 'px';
      else nav.style.minHeight = '';
    }
  }
  upd();
  window.addEventListener('resize', upd);
  window.addEventListener('load', upd);
})();

/* countdown: contagem regressiva até a meia-noite de 25/07 (todos os .gains-timer) */
(function () {
  var timers = document.querySelectorAll('.gains-timer[data-deadline]');
  if (!timers.length) return;
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tickAll() {
    var now = Date.now();
    timers.forEach(function (t) {
      var diff = new Date(t.getAttribute('data-deadline')).getTime() - now;
      if (diff < 0) diff = 0;
      var s = Math.floor(diff / 1000);
      var d = Math.floor(s / 86400); s -= d * 86400;
      var h = Math.floor(s / 3600);  s -= h * 3600;
      var m = Math.floor(s / 60);    s -= m * 60;
      var elD = t.querySelector('[data-days]'), elH = t.querySelector('[data-hours]'),
          elM = t.querySelector('[data-mins]'), elS = t.querySelector('[data-secs]');
      if (elD) elD.textContent = pad(d);
      if (elH) elH.textContent = pad(h);
      if (elM) elM.textContent = pad(m);
      if (elS) elS.textContent = pad(s);
    });
  }
  tickAll();
  setInterval(tickAll, 1000);
})();

/* ══════════ depos-faq-wrap :: bundle portado de /ed/formacoes/ ══════════ */

/* helper: neutraliza blur em telas <=576px */
(function () {
window.__deposBf = window.__deposBf || (function () {
    var IS_NARROW = window.matchMedia && window.matchMedia('(max-width: 576px)').matches;
    if (window.matchMedia) {
        window.matchMedia('(max-width: 576px)').addEventListener('change', function (e) { IS_NARROW = e.matches; });
    }
    return function bf(px) {
        if (IS_NARROW) return 'none';
        return px === 0 ? 'blur(0)' : 'blur(' + px + 'px)';
    };
})();
})();

/* avatares aleatórios (fundo dos .depos-avatar) */
(function () {
    var thumbs = [
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-claudio.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-cleiton.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-daniel.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-edson.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-eduardo.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-ezequiel.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-gabriel.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-louiz.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-pedro.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-vinicius.webp',
        '/ed/site-dependencias/site-media/depoimento-video-thumb/depoimento-video-thumb-vitoria.webp'
    ];
    for (var i = thumbs.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = thumbs[i]; thumbs[i] = thumbs[j]; thumbs[j] = t;
    }
    document.querySelectorAll('.depos-avatar').forEach(function (el, i) {
        el.style.backgroundImage    = 'url(' + thumbs[i] + ')';
        el.style.backgroundSize     = 'cover';
        el.style.backgroundPosition = 'center';
    });
})();

/* população + rotação dos logos (#depos-logos-grid) */
(function () {
    var logos = [
        { src: '/ed/site-dependencias/site-media/logos/logo-3m.webp',          alt: '3M' },
        { src: '/ed/site-dependencias/site-media/logos/logo-airliquide.webp',  alt: 'Air Liquide' },
        { src: '/ed/site-dependencias/site-media/logos/logo-ambev.webp',       alt: 'Ambev' },
        { src: '/ed/site-dependencias/site-media/logos/logo-bradesco.webp',    alt: 'Bradesco' },
        { src: '/ed/site-dependencias/site-media/logos/logo-cbf.webp',         alt: 'CBF' },
        { src: '/ed/site-dependencias/site-media/logos/logo-cielo.webp',       alt: 'Cielo' },
        { src: '/ed/site-dependencias/site-media/logos/logo-claro.webp',       alt: 'Claro' },
        { src: '/ed/site-dependencias/site-media/logos/logo-cpfl.webp',        alt: 'CPFL' },
        { src: '/ed/site-dependencias/site-media/logos/logo-globo.webp',       alt: 'Globo' },
        { src: '/ed/site-dependencias/site-media/logos/logo-google.webp',      alt: 'Google' },
        { src: '/ed/site-dependencias/site-media/logos/logo-inter.webp',       alt: 'Inter' },
        { src: '/ed/site-dependencias/site-media/logos/logo-magalu.webp',      alt: 'Magalu' },
        { src: '/ed/site-dependencias/site-media/logos/logo-mercedes.webp',    alt: 'Mercedes-Benz' },
        { src: '/ed/site-dependencias/site-media/logos/logo-natura.webp',      alt: 'Natura' },
        { src: '/ed/site-dependencias/site-media/logos/logo-neoway.webp',      alt: 'Neoway' },
        { src: '/ed/site-dependencias/site-media/logos/logo-piracanjuba.webp', alt: 'Piracanjuba' },
        { src: '/ed/site-dependencias/site-media/logos/logo-santander.webp',   alt: 'Santander' },
        { src: '/ed/site-dependencias/site-media/logos/logo-suzano.webp',      alt: 'Suzano' },
        { src: '/ed/site-dependencias/site-media/logos/logo-vale.webp',        alt: 'Vale' },
        { src: '/ed/site-dependencias/site-media/logos/sicoob.webp',           alt: 'Sicoob' }
    ];
    var grid = document.getElementById('depos-logos-grid');
    if (!grid) return;
    var imgs = Array.from(grid.querySelectorAll('.depos-logo-card img'));
    var imgToLogo = new Map();
    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }
    function visibleImgs() {
        return imgs.filter(function(img) { return img.closest('.depos-logo-card').offsetHeight > 0; });
    }
    function displayedLogos() {
        var arr = [];
        visibleImgs().forEach(function(img) {
            var l = imgToLogo.get(img);
            if (l) arr.push(l);
        });
        return arr;
    }
    function init() {
        var visible = visibleImgs();
        var initial = shuffle(logos).slice(0, visible.length);
        visible.forEach(function(img, i) {
            img.src = initial[i].src;
            img.alt = initial[i].alt;
            img.style.opacity = '0.5';
            imgToLogo.set(img, initial[i]);
        });
    }
    var lastImg = null;
    function tick() {
        var visible = visibleImgs();
        if (!visible.length) return;
        var candidates = visible.length > 1 ? visible.filter(function(i) { return i !== lastImg; }) : visible;
        var img = candidates[Math.floor(Math.random() * candidates.length)];
        lastImg = img;
        var displayed = displayedLogos();
        var pool = logos.filter(function(l) { return displayed.indexOf(l) === -1; });
        if (!pool.length) return;
        var next = pool[Math.floor(Math.random() * pool.length)];
        imgToLogo.set(img, next);
        img.style.opacity = '0';
        var loaded = false, delayed = false;
        function tryComplete() {
            if (!loaded || !delayed) return;
            img.src = next.src;
            img.alt = next.alt;
            img.style.opacity = '0.5';
        }
        setTimeout(function () { delayed = true; tryComplete(); }, 600);
        var preloader = new Image();
        preloader.onload = preloader.onerror = function () { loaded = true; tryComplete(); };
        preloader.src = next.src;
    }
    init();
    setInterval(tick, 700);
})();

/* carrossel (loop infinito) + facade de vídeo (YouTube) */
(function () {
    const track   = document.getElementById('depos-track');
    const btnPrev = document.getElementById('depos-prev');
    const btnNext = document.getElementById('depos-next');
    if (!track) return;

    const origCards = Array.from(track.children);
    const N = origCards.length;

    origCards.forEach(c => {
        const cl = c.cloneNode(true);
        cl.setAttribute('aria-hidden', 'true');
        track.appendChild(cl);
    });
    origCards.slice().reverse().forEach(c => {
        const cl = c.cloneNode(true);
        cl.setAttribute('aria-hidden', 'true');
        track.insertBefore(cl, track.firstChild);
    });

    document.addEventListener('click', function (e) {
        const video = e.target.closest('.depos-video[data-vid]');
        if (!video) return;
        const vid   = video.dataset.vid;
        const start = video.dataset.start || 0;
        delete video.dataset.vid;
        const iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube.com/embed/' + vid + '?start=' + start + '&autoplay=1';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        video.innerHTML = '';
        video.appendChild(iframe);
    });

    function step() {
        const c = track.querySelector('.depos-card');
        const g = parseFloat(getComputedStyle(track).columnGap) || 24;
        // getBoundingClientRect (sub-pixel) em vez de offsetWidth (arredonda p/ inteiro),
        // senão a fração da largura da card acumula deslocamento ao longo dos clones.
        return c ? c.getBoundingClientRect().width + g : 0;
    }
    function setInstant(pos) {
        track.style.scrollBehavior = 'auto';
        track.scrollLeft = pos;
        void track.offsetWidth;
        track.style.scrollBehavior = '';
    }
    function gridOffset() {
        if (!window.matchMedia('(min-width: 1440px)').matches) return 0;
        // clientWidth (sem a scrollbar) pra casar com o margin:auto dos containers
        return Math.max(0, (document.documentElement.clientWidth - 1408) / 2);
    }
    function loopCorrect() {
        const W  = N * step();
        const pl = gridOffset();
        if (!W) return;
        if (track.scrollLeft < W - pl)           setInstant(track.scrollLeft + W);
        else if (track.scrollLeft >= 2 * W - pl) setInstant(track.scrollLeft - W);
    }
    function init() {
        const s = step();
        if (!s) { requestAnimationFrame(init); return; }
        setInstant(N * s - gridOffset());
    }
    requestAnimationFrame(() => requestAnimationFrame(init));
    window.addEventListener('resize', init);

    let scrollTimer;
    function move(dir) {
        const s = step();
        if (!s) return;
        track.scrollBy({ left: s * dir, behavior: 'smooth' });
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(loopCorrect, 500);
    }
    btnPrev.addEventListener('click', () => move(-1));
    btnNext.addEventListener('click', () => move(1));

    let nativeTimer;
    track.addEventListener('scroll', () => {
        clearTimeout(nativeTimer);
        nativeTimer = setTimeout(loopCorrect, 150);
    }, { passive: true });

    btnPrev.disabled = false;
    btnNext.disabled = false;
})();

/* FAQ accordion (clique na .faq-row inteira; abre/fecha animado) */
(function () {
    document.querySelectorAll('.sec-faq .faq-row').forEach(function (details) {
        var grid = details.querySelector('.faq-a-grid');
        var icon = details.querySelector('.faq-q-icon');
        details.addEventListener('click', function (e) {
            e.preventDefault();
            if (!details.open) {
                details.open = true;
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        grid.classList.add('is-open');
                        icon.textContent = 'remove';
                    });
                });
            } else {
                grid.classList.remove('is-open');
                icon.textContent = 'add';
                grid.addEventListener('transitionend', function () {
                    details.open = false;
                }, { once: true });
            }
        });
    });
})();

/* reveal (essencial): elementos entram em opacity:0 via CSS; isto os torna visíveis */
(function () {
    var wrap = document.querySelector('.depos-faq-wrap');
    if (!wrap) return;
    var bf = window.__deposBf || function (px) { return px === 0 ? 'blur(0)' : 'blur(' + px + 'px)'; };
    var T = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';

    function prepareTitle(title) {
        if (title.dataset.animPrepared) return title._animSpans || [];
        title.dataset.animPrepared = '1';
        var spans = [];
        function walk(node) {
            if (node.nodeType === 3) {
                var text = node.textContent;
                if (!text) return;
                var frag = document.createDocumentFragment();
                var i = 0;
                while (i < text.length) {
                    if (/\s/.test(text[i])) {
                        frag.appendChild(document.createTextNode(text[i]));
                        i++;
                    } else {
                        var j = i;
                        while (j < text.length && !/\s/.test(text[j])) j++;
                        var word = document.createElement('span');
                        word.className = 'word-nowrap';
                        for (var k = i; k < j; k++) {
                            var sp = document.createElement('span');
                            sp.textContent = text[k];
                            word.appendChild(sp);
                            spans.push(sp);
                        }
                        frag.appendChild(word);
                        i = j;
                    }
                }
                node.parentNode.replaceChild(frag, node);
            } else if (node.nodeType === 1) {
                Array.from(node.childNodes).forEach(walk);
            }
        }
        Array.from(title.childNodes).forEach(walk);
        spans.forEach(function (sp) {
            sp.style.display = 'inline-block';
            sp.style.opacity = '0';
            sp.style.filter = bf(8);
            sp.style.transform = 'translateY(32px)';
            sp.style.transition = T;
        });
        title._animSpans = spans;
        return spans;
    }

    function animateHeader(eyebrow, title, lede) {
        if (eyebrow) {
            eyebrow.style.opacity = '1';
            eyebrow.style.filter = bf(0);
            eyebrow.style.transform = 'translateY(0)';
        }
        if (title) {
            var spans = prepareTitle(title);
            title.style.opacity = '1';
            spans.forEach(function (sp, idx) {
                setTimeout(function () {
                    sp.style.opacity = '1';
                    sp.style.filter = bf(0);
                    sp.style.transform = 'translateY(0)';
                }, idx * 10);
            });
        }
        if (lede) {
            setTimeout(function () {
                lede.style.opacity = '1';
                lede.style.filter = bf(0);
                lede.style.transform = 'translateY(0)';
            }, 150);
        }
    }

    var OPT = { rootMargin: '0px 0px -25% 0px', threshold: 0 };

    wrap.querySelectorAll('.sec-title').forEach(prepareTitle);
    wrap.querySelectorAll('.sec-title').forEach(function (title) {
        var parent = title.parentNode;
        if (!parent) return;
        var eyebrow = parent.querySelector('.sec-eyebrow');
        var lede = parent.querySelector('.sec-lede');
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                obs.unobserve(title);
                animateHeader(eyebrow, title, lede);
            });
        }, OPT);
        obs.observe(title);
    });

    function observeSingle(selector) {
        wrap.querySelectorAll(selector).forEach(function (el) {
            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    obs.unobserve(el);
                    el.classList.add('is-entered');
                });
            }, OPT);
            obs.observe(el);
        });
    }
    function observeWithStagger(selector) {
        var staggerIdx = 0;
        wrap.querySelectorAll(selector).forEach(function (el) {
            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    obs.unobserve(el);
                    var delay = staggerIdx * 40;
                    staggerIdx++;
                    setTimeout(function () { el.classList.add('is-entered'); }, delay);
                });
            }, OPT);
            obs.observe(el);
        });
    }
    observeSingle('.faq-grid');
    observeSingle('.depos-nav');
    observeWithStagger('.depos-card');
    observeWithStagger('.champ-img');

    var depHeader = wrap.querySelector('.depos-header');
    if (depHeader) {
        var depSocialProof = depHeader.querySelector('.depos-social-proof');
        var depStars = depHeader.querySelector('.depos-stars');
        var depObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                depObs.unobserve(depHeader);
                if (depSocialProof) {
                    depSocialProof.style.opacity = '1';
                    depSocialProof.style.filter = bf(0);
                    depSocialProof.style.transform = 'translateY(0)';
                }
                if (depStars) {
                    depStars.style.opacity = '1';
                    depStars.style.filter = bf(0);
                    depStars.style.transform = 'translateY(0)';
                }
            });
        }, OPT);
        depObs.observe(depHeader);
    }
})();

/* barra de CTA fixa: só ativa ABAIXO da completa (quando a seção já passou o topo
   da viewport), seguindo visível por gains/depoimentos/faq */
(function () {
  var bar = document.querySelector('.bottom-cta');
  var completa = document.querySelector('.completa');
  if (!bar || !completa) return;
  var ticking = false;
  function update() {
    ticking = false;
    var show = completa.getBoundingClientRect().bottom <= 0;
    bar.classList.toggle('is-hidden', !show);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

