/* ───────────────────────────────────────────────────────────────
   Sincroniza os cards de curso das 7 páginas de formação (f1–f7)
   com o CSV de cursos: atualiza duração (tag[0]), nº de aulas
   (data-aulas) e descrição (.course-card-desc) — casando por título.

   Substituições PONTUAIS no HTML (não re-serializa o arquivo) →
   nada além de duração/aulas/descrição é tocado.

   Uso:  node sync-formacao-cursos.js          (dry-run, só relatório)
         node sync-formacao-cursos.js --write   (aplica)
   ─────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

const CSV_PATH = 'C:/Users/feelv/OneDrive/Área de Trabalho/VHM Desin/Claude/Xperiun/Web/CSV/export_All-cursos-modified---_2026-06-10_16-01-56.csv';
const FILES = [
    'ed/formacoes/f1-power-bi-basico-intermediario.html',
    'ed/formacoes/f2-power-bi-intermediario-avancado.html',
    'ed/formacoes/f3-microsoft-fabric.html',
    'ed/formacoes/f4-banco-de-dados-sql.html',
    'ed/formacoes/f5-python-data-science.html',
    'ed/formacoes/f6-automacao-ia.html',
    'ed/formacoes/f7-carreira-negocios.html',
];
const WRITE = process.argv.includes('--write');

/* ── helpers ── */
const collapse   = (s) => (s || '').replace(/\s+/g, ' ').trim();
const normKey    = (s) => collapse(s).toLowerCase();
const decodeEnt  = (s) => (s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const escapeHtml = (s) => (s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ── CSV → map por título ── */
const rows = parse(fs.readFileSync(CSV_PATH), { columns: true, skip_empty_lines: true, bom: true });
const byTitle = new Map();
for (const r of rows) {
    const key = normKey(r.titulo);
    if (!key) continue;
    byTitle.set(key, {
        titulo:  collapse(r.titulo),
        duracao: collapse(r.duracao_txt).replace(/\s+/g, ''),   // "4 h" → "4h"
        aulas:   collapse(r.qtd_aulas),
        desc:    collapse(r.descricao),
    });
}
console.log(`CSV: ${byTitle.size} cursos carregados.\n`);

/* Aliases: título no card (esquerda) → título no CSV (direita).
   Páginas usam vírgula onde o CSV usa ":", " e " onde usa "+", e "2.0" a mais. */
const ALIAS = new Map(Object.entries({
    'Power BI Serviço Essencial 2.0':                    'Power BI Serviço Essencial',
    'Projeto Final, Case de Controladoria com DRE':      'Projeto Final: Case de Controladoria com DRE',
    'Business Analytics, Indicadores e KPIs':            'Business Analytics: Indicadores e KPIs',
    'Projeto Final, Cases MR Bolos e HPN':               'Projeto Final: Cases MR Bolos e HPN',
    'Raciocínio Lógico e Lógica de Programação':         'Raciocínio Lógico + Lógica de Programação',
    'Projeto Final, Sistema de Recomendação':            'Projeto Final: Sistema de Recomendação',
    'N8N, Automação Inteligente de Tarefas e Processos': 'N8N: Automação Inteligente de Tarefas e Processos',
    'Power Apps, Aplicativo de Checklist':               'Power Apps: Aplicativo de Checklist',
    'Power Apps, Aplicativo de Gestão de Documentos':    'Power Apps: Aplicativo de Gestão de Documentos',
}).map(([card, csv]) => [normKey(card), normKey(csv)]));

/* ── processa cada página ── */
let totalUpdated = 0, totalMissing = 0;
for (const file of FILES) {
    let html = fs.readFileSync(file, 'utf8');
    const updated = [], missing = [];

    html = html.replace(/<article class="course-card"[\s\S]*?<\/article>/g, (block) => {
        const tm = block.match(/<h3 class="course-card-title">([\s\S]*?)<\/h3>/);
        if (!tm) return block;
        const cardTitle = collapse(decodeEnt(tm[1]));
        const k = normKey(cardTitle);
        const hit = byTitle.get(k) || (ALIAS.has(k) ? byTitle.get(ALIAS.get(k)) : null);
        if (!hit) { missing.push(cardTitle); return block; }

        let out = block;
        // 1) duração = primeira .tag-status
        out = out.replace(/(<span class="tag-status"[^>]*>)[\s\S]*?(<\/span>)/, `$1${escapeHtml(hit.duracao)}$2`);
        // 2) data-aulas no <article> (idempotente)
        out = out.replace(/(<article class="course-card"[^>]*?)\s*data-aulas="[^"]*"/, '$1');
        out = out.replace(/(<article class="course-card"[^>]*?)>/, `$1 data-aulas="${escapeHtml(hit.aulas)}">`);
        // 3) descrição
        out = out.replace(/(<p class="course-card-desc">)[\s\S]*?(<\/p>)/, `$1${escapeHtml(hit.desc)}$2`);

        updated.push(`${cardTitle}  ·  ${hit.duracao} · ${hit.aulas} aulas`);
        return out;
    });

    console.log(`── ${file}`);
    console.log(`   ✓ ${updated.length} atualizados${missing.length ? `   ✗ ${missing.length} sem match no CSV` : ''}`);
    updated.forEach((u) => console.log(`     • ${u}`));
    missing.forEach((m) => console.log(`     ⚠ SEM MATCH: "${m}"`));
    console.log('');

    totalUpdated += updated.length;
    totalMissing += missing.length;
    if (WRITE) fs.writeFileSync(file, html);
}

console.log(`${'='.repeat(50)}`);
console.log(`TOTAL: ${totalUpdated} cursos atualizados · ${totalMissing} sem match`);
console.log(WRITE ? '✓ Arquivos GRAVADOS.' : '↺ Dry-run (nada gravado). Rode com --write pra aplicar.');
