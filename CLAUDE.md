# Instruções do projeto Xperiun

## CORES E DADOS — NUNCA INVENTAR, SEM EXCEÇÃO

**Cores e tokens vêm SEMPRE do design system (`ed/site-dependencias/root.css`).** NUNCA inventar hex, chutar Pantone, ou usar cor de memória. Antes de usar qualquer cor, abra o `root.css` e pegue o token real (`--pc300` = #6464FF, `--pp500` = #9600FF, `--sc500`, `--er500`, `--bw`, escalas `--pc300-10/15/25/50/75`, etc.).

**Regra geral que isto instancia:** se faltar QUALQUER valor (cor, medida, dado de curso, copy), **PARE, leia a fonte, ou pergunte.** É proibido preencher a lacuna com um placeholder/chute e seguir em frente, mesmo "só pra testar". Chute de cor num projeto de design é erro grave (já cometido: chutei `--pc300` como #005EB8 e inventei `--pp500`). Na dúvida, verificar > adivinhar.

## GRID DO DESIGN SYSTEM — OBRIGATÓRIO, SEM EXCEÇÃO

Antes de escrever ou editar **qualquer** CSS de layout (`display: grid`, `grid-template-columns`, `grid-column`, container com `max-width`), pare e siga ESTE grid. NUNCA invente grid próprio (grid fixo de N cols, largura fixa, capar `max-width` em 1152 num grid Wide, etc.). Se um layout tem colunas, ele usa este sistema.

### Container
- `max-width: 1440px` (Wide, base 10 cols) **ou** `max-width: 1152px` (Desktop, base 8 cols). **NUNCA** 1408/1120 nem outro valor.
- `padding: 0 16px`, `box-sizing: border-box`, `margin: 0 auto`.
- Fórmula: max-width = content + 16 + 16. Coluna = **112px** em qualquer tier. `span 4 = 544px`.

### Colunas / gap por breakpoint (container Wide 1440 — o `max-width` NUNCA muda, só as colunas)
- base (≥1440): `grid-template-columns: repeat(10, 1fr)`, `column-gap: 32px`
- `@media (max-width: 1439px)`: `repeat(8, 1fr)` (gap 32) — cai em ≤1439, **NÃO** em ≤1152
- `@media (max-width: 864px)`: `repeat(6, 1fr)`, `column-gap: 24px`
- `@media (max-width: 576px)`: `repeat(4, 1fr)`, `column-gap: 16px`

(Páginas que começam já no Desktop usam `max-width: 1152px` + `repeat(8,1fr)` base, e caem 6/4 em ≤864/≤576.)

### Posicionamento
- Posicione SEMPRE com `grid-column: span N` (nunca largura fixa).
- Ao cair de colunas, **remapeie os spans** proporcionalmente (ex.: `span 5 + span 5` no grid 10 vira `span 4 + span 4` no grid 8). Um `span 6` num grid de 4 cols estoura, criando colunas implícitas.
- Em `@media (max-width: 864px)` e `(max-width: 576px)`, os blocos viram `grid-column: 1 / -1` (largura cheia, empilhados). **Nunca deixar `span 3` "à esquerda" nesses breakpoints.**

### Checklist antes de finalizar qualquer layout
1. Container tem `max-width: 1440` (ou 1152), `padding: 0 16px`, `box-sizing: border-box`? 
2. Colunas caem 10→8 (≤1439) → 6 (≤864) → 4 (≤576) com gaps 32/32/24/16?
3. `max-width` ficou fixo (não capou em 1152 num grid Wide)?
4. Spans remapeados em cada breakpoint e `1 / -1` em ≤864/≤576?
5. **Ordem no CSS:** as `@media` do grid vêm DEPOIS das regras base (`grid-column` base). Se a regra base de span vier depois da media query, ela sobrescreve (mesma especificidade) e o layout trava num span só em todos os breakpoints. Erro real já cometido aqui.

Referência canônica no código: `ed/formacoes/style.css` (`.hero-content`, `.extras-inner`, `.oferta-inner`), `ed/pos-graduacoes/mba-fpa.css`, `ed/site-dependencias/home.css`. Se tiver dúvida do arranjo, **abra um desses e espelhe**, não improvise.
