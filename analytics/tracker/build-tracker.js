// Empacota tracker.src.js (com rrweb embutido) num unico public/tracker.js.
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [join(__dirname, 'tracker.src.js')],
  outfile: join(__dirname, '..', 'public', 'tracker.js'),
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2018',
});

console.log('tracker.js gerado em public/tracker.js');
