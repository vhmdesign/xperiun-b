// Geometria das raízes do símbolo, a partir de raiz-dados.js (gerado por logo-evolucao-build.cjs).
// Cada galho é um polígono [E, B, X1, Cx, X2] (E = centro da ponta do pai, B = canto externo da base, X1 e X2 as pontas
// externa e interna, Cx = o canto da ponta do pai, que fica sempre sobre o contorno do filho). Crescimento orgânico
// (exemplos a/b/c do usuário), com f = fração do comprimento:
//   a -> b: a borda de dentro do filho gira em torno de E, de E->C (ao longo da ponta do pai) até a reta do filho;
//           a ponta de fora segue a lateral do pai (V3a -> C), então nenhum canto sobra pra fora;
//   b -> c: o filho alonga e o chanfro de fora (V3a -> C) vai fechando até a ponta ficar reta.
// Ramificação de um lado só: a face da ponta do pai do lado sem filho gira em torno de E alinhada com a borda de dentro
// do filho (o pai ganha dois vértices: Q na lateral e Et no centro da ponta).
// Define globalThis.Raiz; usado pelo loop, player, transição, contagem e (no node, via vm) pelas builds.
globalThis.Raiz = (() => {
  const lerp = (a, b, s) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
  const mais = (a, v, k) => [a[0] + v[0] * k, a[1] + v[1] * k];
  const inter = (p, u, q, v) => { // p + u*a = q + v*b
    const den = u[0] * v[1] - u[1] * v[0];
    if (Math.abs(den) < 1e-9) return q;
    return mais(p, u, ((q[0] - p[0]) * v[1] - (q[1] - p[1]) * v[0]) / den);
  };

  function proprio(s, f) {
    if (f <= 0) return [s.E, s.E, s.E, s.E, s.E];
    const Lef = Math.min(1, f) * s.L;
    if (Lef < s.Lc) return [s.E, s.B, s.V3a, s.C, lerp(s.C, s.U3, Lef / s.Lc)];
    const x = Lef - s.Lc, u = s.L > s.Lc ? x / (s.L - s.Lc) : 1;
    return [s.E, s.B, lerp(s.V3a, mais(s.B, s.d, s.L), u), mais(s.C, s.d, x), mais(s.U3, s.d, x)];
  }

  // Os dados guardam só a construção: cada galho é um retângulo (larg[g] x L) girado em múltiplos de 45° (a), com o
  // vértice de dentro da base no centro exato da ponta do pai (p; na fase 1, o centro da face f da base, vindo do pai
  // de direção ap e largura W). s diz de que lado do eixo fica a largura. Tudo é montado aqui, sem arredondar nada.
  const R2 = Math.SQRT1_2;
  const DIRS = [[1, 0], [R2, R2], [0, 1], [-R2, R2], [-1, 0], [-R2, -R2], [0, -1], [R2, -R2]];
  const pe = v => [-v[1], v[0]];
  function prepara(dados) {
    if (dados.pronto) return dados;
    dados.segs.forEach(s => {
      const w = dados.larg[s.g], pai = s.g > 0 ? dados.segs[s.p] : null;
      s.d = DIRS[s.a];
      const pv = pe(s.d); s.n = [pv[0] * s.s, pv[1] * s.s];
      s.E = pai ? mais(mais(pai.E, pai.n, dados.larg[pai.g] / 2), pai.d, pai.L) : dados.faces[s.f];
      s.B = mais(s.E, s.n, w);
      const dp = pai ? pai.d : DIRS[s.ap], W = pai ? dados.larg[pai.g] : s.W, t = pe(dp);
      s.C = mais(s.E, t, (t[0] * s.n[0] + t[1] * s.n[1] > 0 ? 1 : -1) * W / 2); // canto da ponta do pai do lado do filho
      s.V3a = inter(s.B, s.d, s.C, dp);                                       // borda de fora encontra a lateral do pai
      s.Lc = (s.C[0] - s.E[0]) * s.d[0] + (s.C[1] - s.E[1]) * s.d[1];
      s.U3 = mais(s.E, s.d, s.Lc);
    });
    dados.pronto = true;
    return dados;
  }

  // prog[g] = fração do comprimento da fase g (0 a 1)
  function pontos(dados, prog) {
    prepara(dados);
    const P = dados.segs.map(s => proprio(s, prog[s.g]));
    dados.segs.forEach((s, i) => {
      if (!s.corte) return;
      const pts = P[i], lado = s.corte.lado, filho = dados.segs[s.corte.k];
      let Q = pts[lado], Et = pts[lado];
      if (prog[s.g] >= 1) {
        Et = lerp(pts[2], pts[4], 0.5);
        const v4 = P[s.corte.k][4], dir = [Et[0] - v4[0], Et[1] - v4[1]];
        if (prog[filho.g] > 0 && Math.hypot(dir[0], dir[1]) > 1e-6) Q = inter(Et, dir, pts[lado], s.d);
      }
      P[i] = lado === 2 ? [pts[0], pts[1], Q, Et, pts[3], pts[4]] : [pts[0], pts[1], pts[2], pts[3], Et, Q];
    });
    return P;
  }

  const n2 = v => +v.toFixed(2);
  // depois do M os pares seguintes são linhas implícitas (sem o L repetido)
  const caminho = pts => 'M' + pts.map(p => `${n2(p[0])} ${n2(p[1])}`).join(' ') + 'Z';
  const formas = (dados, prog) => pontos(dados, prog).map(caminho);
  // atualiza os <path> só onde a forma mudou (fora da fase que está crescendo, quase nada muda de um quadro pro outro).
  // Os dados são só a metade esquerda: els pode ter o dobro, com a metade direita num grupo espelhado (mesmo d).
  function atualiza(els, dados, prog) {
    const f = formas(dados, prog);
    for (let i = 0; i < els.length; i++) {
      const d = f[i % f.length];
      if (els[i].__d !== d) { els[i].setAttribute('d', d); els[i].__d = d; }
    }
  }

  // ease-in-out do CSS (cubic-bezier .42 0 .58 1)
  function easeInOut(x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let lo = 0, hi = 1;
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2, bx = 3 * (1 - m) * (1 - m) * m * 0.42 + 3 * (1 - m) * m * m * 0.58 + m * m * m; if (bx < x) lo = m; else hi = m; }
    const m = (lo + hi) / 2; return 3 * (1 - m) * m * m + m * m * m;
  }
  // loop do logo-evolucao: cada fase cresce em [a,b], segura, recolhe em [c,e]
  function progLoop(dados, t) {
    return dados.loop.T.map(o => t <= o.a ? 0 : t < o.b ? easeInOut((t - o.a) / (o.b - o.a)) : t <= o.c ? 1
      : t < o.e ? 1 - easeInOut((t - o.c) / (o.e - o.c)) : 0);
  }

  return { prepara, pontos, formas, atualiza, caminho, easeInOut, progLoop };
})();
