/* build.js — Pipeline de minificação Tier 1 pra páginas /ed/*.
   Lê de ed/ (source), escreve em dist/ed/ (output, gitignored).
   Tudo que NÃO for HTML/CSS/JS é copiado as-is (imagens, .htaccess, fonts, etc.).

   Estratégia conservadora pra Tier 1:
     - HTML: collapse whitespace, remove comments (preserva fingerprint
             Xperiun via ignoreCustomComments), minify inline CSS/JS.
     - CSS:  clean-css level 2 (merge rules, remove duplicates, sem perda).
     - JS:   terser default (mangle + compress). Nomes de classes NÃO são
             tocados aqui — só nomes de variáveis/funções dentro do JS.
             Class-name hashing fica pra Tier 2.

   Roda em CI (GitHub Actions) antes do FTP upload. Roda local com
   `npm run build`. Preview com `npm run preview`. */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import { minify as minifyHTML } from 'html-minifier-terser';
import { minify as minifyJS } from 'terser';
import CleanCSS from 'clean-css';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, 'ed');
const OUT = path.join(__dirname, 'dist', 'ed');

const HTML_OPTS = {
    collapseWhitespace: true,
    conservativeCollapse: false,
    removeComments: true,
    /* Preserva comentários contendo "Xperiun" (fingerprint legal de
       proteção que injetamos antes de </body>). */
    ignoreCustomComments: [/Xperiun/i],
    collapseBooleanAttributes: true,
    decodeEntities: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    minifyCSS: true,
    minifyJS: true,
};

const cleanCSS = new CleanCSS({
    /* level 1 (safe): whitespace, comments, color shortening, sem
       transformações estruturais.
       NÃO usar level 2 — ele faz "structural optimizations" que NÃO
       entendem CSS Nesting Module e acabam strippando @keyframes
       quando aparecem dentro de seletores aninhados (ex: o bloco
       body.formacoes-hub {} em formacoes/style.css). Browsers toleram
       o nesting, mas level 2 reescreve a CSS de forma errada. */
    level: 1,
    returnPromise: false,
});

async function processFile(srcPath, outPath, rel) {
    const ext = path.extname(srcPath).toLowerCase();
    try {
        if (ext === '.html' || ext === '.htm') {
            const content = await fs.readFile(srcPath, 'utf-8');
            const minified = await minifyHTML(content, HTML_OPTS);
            await fs.writeFile(outPath, minified);
            return 'html';
        }
        if (ext === '.css') {
            const content = await fs.readFile(srcPath, 'utf-8');
            const result = cleanCSS.minify(content);
            if (result.errors && result.errors.length) {
                throw new Error('clean-css: ' + result.errors.join('; '));
            }
            await fs.writeFile(outPath, result.styles);
            return 'css';
        }
        if (ext === '.js') {
            const content = await fs.readFile(srcPath, 'utf-8');
            const result = await minifyJS(content);
            if (!result.code) throw new Error('terser returned empty code');
            await fs.writeFile(outPath, result.code);
            return 'js';
        }
        /* Imagens, .htaccess, fonts, JSON, etc. — copiar literal. */
        await fs.copyFile(srcPath, outPath);
        return 'copy';
    } catch (err) {
        console.warn(`  [warn] ${rel}: ${err.message} — copiando as-is`);
        await fs.copyFile(srcPath, outPath);
        return 'fallback';
    }
}

async function build() {
    const t0 = Date.now();

    /* Limpa output. Importante: ed/ é gitignored e re-gerado a cada build. */
    await fs.rm(OUT, { recursive: true, force: true });

    /* glob com dot:true pra incluir .htaccess e outros dotfiles. */
    const files = await glob('**/*', {
        cwd: SRC,
        nodir: true,
        dot: true,
    });

    const counts = { html: 0, css: 0, js: 0, copy: 0, fallback: 0 };

    for (const rel of files) {
        const srcPath = path.join(SRC, rel);
        const outPath = path.join(OUT, rel);
        await fs.mkdir(path.dirname(outPath), { recursive: true });
        const kind = await processFile(srcPath, outPath, rel);
        counts[kind]++;
    }

    const dt = ((Date.now() - t0) / 1000).toFixed(2);
    console.log(`Build done in ${dt}s — ${counts.html} html, ${counts.css} css, ${counts.js} js, ${counts.copy} copy${counts.fallback ? `, ${counts.fallback} fallback` : ''}`);
}

build().catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
});
