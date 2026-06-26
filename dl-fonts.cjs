// Baixa as fontes do Google e gera CSS local (self-host). Temporário.
const fs = require('fs');
const path = require('path');
const OUT = 'ed/site-dependencias/site-fonts';
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const KEEP = ['latin', 'latin-ext'];

// Fontes de texto do DS (root.css) + EB Garamond (títulos ICIAN)
const families = [
  'Poppins:wght@400;500;600;700;800',
  'Oswald:wght@400;700',
  'Syne:wght@400;700',
  'EB+Garamond:wght@700',
  'Cormorant+Infant:ital,wght@0,400;0,700;1,400;1,700',
];
const url = 'https://fonts.googleapis.com/css2?' + families.map(f => 'family=' + f).join('&') + '&display=swap';

async function dl(u) {
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + u);
  return r;
}

(async () => {
  const css = await (await dl(url)).text();
  const re = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*{([^}]*)}/g;
  let m, out = '', seen = new Set();
  while ((m = re.exec(css))) {
    const subset = m[1], body = m[2];
    if (!KEEP.includes(subset)) continue;
    const fam = (body.match(/font-family:\s*'([^']+)'/) || [])[1];
    const wght = (body.match(/font-weight:\s*(\d+)/) || [])[1];
    const style = (body.match(/font-style:\s*(\w+)/) || [])[1] || 'normal';
    const srcUrl = (body.match(/url\((https:\/\/[^)]+)\)/) || [])[1];
    const ur = (body.match(/unicode-range:\s*([^;]+);/) || [])[1] || '';
    if (!fam || !srcUrl) continue;
    const slug = fam.toLowerCase().replace(/\s+/g, '-').replace(/\+/g, '-');
    const file = `${slug}-${wght}${style === 'italic' ? 'i' : ''}-${subset}.woff2`;
    if (!seen.has(file)) {
      seen.add(file);
      const buf = Buffer.from(await (await dl(srcUrl)).arrayBuffer());
      const tmp = path.join(OUT, file + '.tmp');
      fs.writeFileSync(tmp, buf);
      fs.renameSync(tmp, path.join(OUT, file));
      console.log(file, Math.round(buf.length / 1024) + 'KB');
    }
    out += `@font-face{font-family:'${fam}';font-style:${style};font-weight:${wght};font-display:swap;src:url(/ed/site-dependencias/site-fonts/${file}) format('woff2');unicode-range:${ur};}\n`;
  }
  fs.writeFileSync(path.join(OUT, 'fonts.css'), out);
  console.log('--- fonts.css OK (' + out.split('\n').filter(Boolean).length + ' @font-face) ---');
})().catch(e => { console.error(e); process.exit(1); });
