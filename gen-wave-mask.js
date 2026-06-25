/* gen-wave-mask.js — pré-gera as máscaras da onda (.wave/.wave-section/
   .wave-section-top) JÁ BORRADAS como WebP, pra tirar o feGaussianBlur de
   dentro do data-URI SVG (que pesa: rasterizar blur stdDeviation=64 em runtime).

   O blur é "assado" na imagem (mesmo padrão do gen-hero-blur.js). A máscara
   vira uma imagem estática com alpha suave → mask-image sem custo de blur.

   Render a 3× (2880×810) com sigma 192 = mesmo blur RELATIVO do original
   (stdDeviation 64 no viewBox 960×270 → 64/960 == 192/2880). 3× = nítido
   quando o mask-size: 100% 100% estica pro elemento.

   Rodar: `npm run gen-wave` (ou `node gen-wave-mask.js`). */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'ed', 'site-dependencias', 'site-imagens');

const SCALE = 3;
const W = 960 * SCALE, H = 270 * SCALE, SIGMA = 64 * SCALE;

/* Mesmos paths do root.css (côncavo embaixo e o espelhado em Y no topo) */
const MASKS = {
    'wave-mask-bottom': 'M480 240C214.9 240 0 132.55 0 0v270h960V0c0 132.55-214.9 240-480 240',
    'wave-mask-top':    'M480 30C214.9 30 0 137.45 0 270V0h960V270c0 -132.55-214.9 -240-480 -240',
};

for (const [name, d] of Object.entries(MASKS)) {
    const svg = `<svg width="${W}" height="${H}" viewBox="0 0 960 270" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="#fff"/></svg>`;
    const dest = path.join(OUT, `${name}.webp`);
    await sharp(Buffer.from(svg)).blur(SIGMA).webp({ quality: 90, alphaQuality: 100 }).toFile(dest);
    console.log(`✓ ${name}.webp  (${W}×${H}, sigma ${SIGMA})`);
}
console.log('done — máscaras em', path.relative(__dirname, OUT));
