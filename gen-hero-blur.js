/* gen-hero-blur.js — pré-gera as variantes borradas das imagens do hero de
   áreas (painéis empilhados), pra NÃO usar filter: blur() em runtime.

   As 4 imagens do hero aparecem em profundidades com blur 0/2/4/6px.
   Geramos cada uma nesses níveis e o hero.js referencia direto
   (mantém o mesmo nome do original + sufixo -b<nível>).

   Rodar: `npm run gen-blur` (ou `node gen-hero-blur.js`). Saída commitada
   em ed/.../areas/hero-blur/ (o build copia as-is; sem custo em runtime). */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(__dirname, 'ed', 'site-dependencias', 'site-media', 'areas');
const OUT = path.join(BASE, 'hero-blur');

/* Mesma ordem/lista do IMAGES em hero.js (4 imagens, na raiz de areas/) */
const IMAGES = [
    'areas-hero-top-sp-scene-img01.webp',
    'areas-hero-top-sp-scene-img02.webp',
    'areas-hero-top-sp-scene-img03.webp',
    'areas-hero-top-sp-scene-img04.webp',
];
const LEVELS = [0, 2, 4, 6];

await fs.rm(OUT, { recursive: true, force: true });   /* limpa variantes antigas */
await fs.mkdir(OUT, { recursive: true });
for (let n = 0; n < IMAGES.length; n++) {
    const src = path.join(BASE, ...IMAGES[n].split('/'));
    const stem = IMAGES[n].replace(/\.webp$/, '');
    for (const L of LEVELS) {
        const dest = path.join(OUT, `${stem}-b${L}.webp`);
        if (L === 0) {
            await fs.copyFile(src, dest);            /* nítida = original */
        } else {
            await sharp(src).blur(L).webp({ quality: 82 }).toFile(dest);
        }
        console.log(`✓ ${stem}-b${L}.webp`);
    }
}
console.log('done — variantes em', path.relative(__dirname, OUT));
