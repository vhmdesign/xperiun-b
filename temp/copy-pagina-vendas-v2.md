# Página de vendas v2, enxuta: IA e Automação com a Completa em cena desde o início

Substitui o deck de 15 seções. Agora são **9 seções**.
Mudanças em relação à v1:
1. A Xperiun Completa aparece na **seção 03**, não na 09.
2. Carrossel único com **todos os cursos das 7 formações**, filtrável por formação.
3. **Todos os 41 Business Cases** na página, com popup de detalhe.
4. Seções de dor, pilares, professores e entregáveis foram fundidas ou cortadas.

Convenções: **Eyebrow** = `.sec-eyebrow`, **Título** = `.sec-title` (h2), **Lede** = `.sec-lede`.
Destaque em título é `<span style="font-weight: 700">`, nunca `<strong>`.
Cores só via token do `root.css`. Container `max-width: 1440px`, `padding: 0 16px`,
grid 10 / 8 / 6 / 4 nos breakpoints 1440 / 1439 / 864 / 576, gaps 32 / 32 / 24 / 16.

---

## O novo fluxo

| # | Seção | O que faz |
|---|---|---|
| 01 | Hero | Vende a Formação 6 e já mostra os dois preços |
| 02 | Números + a dor | Uma seção só, compacta |
| 03 | **A virada (H2R/Totvs)** | Completa entra aqui, cedo |
| 04 | **Carrossel de todos os cursos** | 47 cursos, filtro por formação |
| 05 | **Todos os Business Cases** | 41 cases, popup de detalhe |
| 06 | Prova social | Depoimentos e logos, comprimido |
| 07 | As duas ofertas | 497 vs 1.497 |
| 08 | Risco + FAQ | FAQ cortado pra 5 perguntas |
| 09 | Fechamento | CTA invertido |

As seções 04 e 05 fazem o trabalho que na v1 exigia seis seções de texto. Em vez de
*descrever* o tamanho do ecossistema, a página **mostra** o catálogo inteiro e deixa o
leitor navegar. Isso encurta a página e aumenta a prova ao mesmo tempo.

---

# SEÇÃO 01, Hero

**Top tag:** `Formação 6` + `Inteligência Artificial e Automação`

**H1:**
> Dobre sua produtividade.
> <span 700>Saia do operacional repetitivo.</span>

**Sub (`.hero-p`):**
> Agentes de IA, automação no N8N e apps no Power Apps pra liberar de 10 a 20 horas por
> semana do seu calendário. 10 cursos, ~62h, quatro entregáveis prontos pra usar amanhã.

**Bloco de preço no hero, duas linhas lado a lado:**

| | |
|---|---|
| **R$ 497** | esta formação, 12 meses |
| **R$ 1.497** | tudo da Xperiun, vitalício |

**CTA primário:** `Garantir por R$ 497`
**CTA secundário:** `Comparar com a Completa`, ancorado na seção 07

**Design:**
- `.hero--f6` com `.hero-bg-float` e `.hero-wave`, como no f6.
- **Mudança chave:** o hero passa a carregar as duas linhas de preço. O leitor sabe desde o primeiro scroll que existem duas portas, então a seção 03 não é surpresa, é explicação. Linha de 497 em `--bw`, linha de 1.497 em `--pc300` com `--ring-15` ao redor.
- `.hero-h1` mantém `padding: 64px` e `margin: -64px` pro halo. Não zerar.
- Abaixo de 864px, keyframe redefinida sem blur.

---

# SEÇÃO 02, Números e a dor (fusão)

**Eyebrow:** `O custo invisível`

**Título:**
> Você não está sem tempo.
> <span 700>Seu tempo está indo pra tarefa que não precisa de você.</span>

**Lede:**
> Consolidar planilha, atualizar relatório, copiar dado entre sistemas, responder o
> mesmo pedido de sempre. Nada disso exige julgamento. Tudo isso exige as suas horas.

**Faixa de números (`.meta-card`), na mesma seção:**

| Valor | Label |
|---|---|
| 10 a 20h | por semana em rotina manual |
| ~62h | de formação em IA e automação |
| 4 | entregáveis prontos |
| 1 de 7 | formações do ecossistema |

**Design:**
- Título e lede em `span 6` (grid 10), faixa de números ocupando `1 / -1` abaixo.
- A célula "1 de 7" é o gancho da seção 03. Ela deixa a lacuna visível sem explicar.
- `--er500` só no "10 a 20h". Vermelho é acento de um número, não cor de seção.

---

# SEÇÃO 03, A VIRADA (subiu da 09 pra cá)

**Eyebrow:** `Projeção até o fim da década`

**Título:**
> Só que uma competência
> <span 700>não é a mesma coisa que duas.</span>

**Lede:**
> O estudo da H2R em parceria com a Totvs projeta as profissões mais relevantes até o
> final da década. Duas delas estão dentro da Xperiun.

**Dois cards lado a lado:**

**Card 1, aceso**
`Você está aqui, Formação 6`
### Especialista em IA e Machine Learning
Agentes, automação, IA aplicada. É exatamente esta formação, e ela custa R$ 497.

**Card 2, apagado, com selo vermelho `Não incluso em R$ 497`**
`Formações 1, 2, 4 e 5`
### Analista e Cientista de Dados
Power BI, SQL, Python e Data Science. A segunda competência da lista, fora da oferta
de R$ 497 e dentro da Xperiun Completa.

**Fecho, centralizado:**
> Automação sem leitura de dado te deixa rápido no lugar errado. Dado sem automação te
> deixa preciso e sobrecarregado. O mercado da próxima década vai pagar por quem tem
> os dois lados.
>
> A Formação 6 te dá uma. A Xperiun Completa te dá as duas, por R$ 1.000 a mais, pra sempre.

**Design:**
- Fundo `--bb` com `.sec-gradient` puxando `--pp500-15` de um canto. Única seção com roxo dominante, sinalizando troca de assunto.
- Cards `span 5` + `span 5` no grid 10, `span 4` + `span 4` no grid 8, `1 / -1` em 864 e 576.
- **O contraste é a mensagem.** Card 1: `--ring-25`, ícone `--pc300`, texto `--bw`. Card 2: `--ring-10`, texto `--bw-50`, ícone `--bw-25`, selo em `--er500` sobre fundo `--er500` a 10%. O leitor precisa ver a lacuna antes de ler sobre ela.
- Transição só com keyword. Sem `cubic-bezier`.

**Nota:** o estudo aponta três profissões. A copy cita as duas que estão na Xperiun e
não afirma qual é a terceira. "Duas das três" é mais forte que listar as três.

---

# SEÇÃO 04, Carrossel de todos os cursos

**Eyebrow:** `Catálogo completo`

**Título:**
> 47 cursos. <span 700>10 são seus por R$ 497. 47 são seus por R$ 1.497.</span>

**Lede:**
> Filtre por formação e veja o catálogo inteiro. Clique em qualquer curso pra abrir
> carga, professor e o que ele cobre.

**Chips de filtro (o primeiro ativo por padrão):**

`Formação 6, IA e Automação (10)` | `Todas as formações (47)` | `F1 Power BI Básico (8)` | `F2 Power BI Avançado (9)` | `F3 Fabric (3)` | `F4 SQL (4)` | `F5 Python (7)` | `F7 Carreira (6)`

**Regra de comportamento (isto é copy e é conversão):**
Ao abrir a página, o filtro está em **Formação 6**, mostrando os 10 cursos que a
oferta de R$ 497 entrega. Quando o usuário clica em qualquer outro chip, aparece
uma faixa fina acima do track:

> `Estes cursos vêm na Xperiun Completa, R$ 1.497 vitalício.` + link `Ver oferta`

Ou seja, explorar o catálogo é o próprio argumento de upgrade. O leitor descobre o
tamanho do ecossistema navegando, não lendo bullet.

**Dados reais do catálogo, por formação:**

| Formação | Cursos | Carga |
|---|---|---|
| F1 Power BI Básico ao Intermediário | 8 | ~38h |
| F2 Power BI Intermediário ao Avançado | 9 | ~103h |
| F3 Microsoft Fabric | 3 | ~53h |
| F4 Banco de Dados e SQL | 4 (3 + 1 bônus) | ~57h |
| F5 Python e Data Science | 7 | ~58h |
| **F6 IA e Automação** | **10** | **~62h** |
| F7 Carreira e Negócios | 6 | ~31h |

**Design:**
- **Reusar `.course-card` e `.course-modal` que já existem** em [ed/formacoes/style.css](ed/formacoes/style.css) e [ed/formacoes/script.js](ed/formacoes/script.js). Zero componente novo pro card e pro popup.
- Track horizontal com `scroll-snap-type: x mandatory`, `overflow-x: auto`, drag no desktop e swipe no touch. Setas `chevron_left` / `chevron_right` no padrão de `.depos-nav`.
- O track sangra até a borda da tela, mas o **primeiro card alinha com a coluna 1 do grid**. Padding lateral do track = `calc((100vw - min(1440px, 100vw)) / 2 + 16px)`, pra respeitar o container sem cortar a sensação de continuidade.
- Cards de formação diferente da 6 ganham tag `Completa` em `--pc300` sobre `--pc300-10`. Os 10 da F6 ganham tag `Incluso nos R$ 497` em `--sc500`. É a diferença visual que carrega o funil.
- Filtro troca o conteúdo do track sem recarregar. Ao trocar, resetar `scrollLeft` pra 0.
- Altura fixa dos cards pra não haver salto de layout ao filtrar.
- Em ≤576px o carrossel mostra 1,15 card por viewport, sinalizando que tem mais ao lado.

**Alternativa se quiserem mais impacto e aceitarem altura:** 7 tracks empilhados, um por
formação, no padrão de prateleira. Mostra o catálogo inteiro de uma vez, mas alonga a
página, que é justamente o que esta v2 quer evitar. Fica registrada como variante.

---

# SEÇÃO 05, Todos os Business Cases

**Eyebrow:** `Biblioteca Na Prática`

**Título:**
> Curso te ensina. <span 700>Case te prova.</span>

**Lede:**
> 41 Business Cases construídos a partir de empresas brasileiras. Todos abertos na
> Xperiun Completa. Clique em qualquer um pra ver nível, duração, aulas e professor.

**Chips por área, com contagem real:**

`Todos (41)` | `Vendas (12)` | `Financeiro (11)` | `Diversos (9)` | `RH (5)` | `Logística (4)`

**Corpo curto, abaixo dos chips:**
> Não é replicar passo na tela. É receber a demanda como um analista recebe, sem
> tutorial guiando a sua mão, e resolver. É daí que sai o portfólio, e portfólio é o
> que o recrutador abre depois de fechar o seu certificado.

**Selo de contraste, fechando a seção:**
> Nenhum Business Case entra na oferta de R$ 497. Todos os 41 entram na de R$ 1.497,
> pra sempre.

**Design:**
- **Reusar o lightbox que já existe:** `XpFolder` / `Lightbox.open()` em [ed/areas/pasta.js](ed/areas/pasta.js). Ele já traz mídia 16/9, título sobreposto, stats de Nível, Duração, Aulas e Professor, descrição, CTA, navegação prev/next e dots. É exatamente o popup pedido, já construído e testado.
- **Dados:** vêm do objeto `AREAS` em [ed/business-cases/script.js](ed/business-cases/script.js), montado pela função `cs()`. Importar esse arquivo em vez de duplicar a lista. Chaves: `al` logística, `af` financeiro, `av` vendas, `arh` RH, `ad` diversos.
- **Layout:** carrossel no mesmo padrão da seção 04, pra a página manter um só idioma de navegação. Card no tamanho do `.proj-card`, imagem 16/9 mais título mais tag de nível.
- Tag de nível com semântica: Iniciante em `--sc500`, Intermediário em `--pc300`, Avançado em `--pp500`. São os três níveis que a `cs()` já deriva do caminho da imagem, não inventar quarto nível.
- A seção inteira em fundo `--bw` (clara), quebrando a sequência escura e dando respiro antes da oferta.
- Link `Ver a biblioteca completa` apontando pra `/ed/business-cases/`.

---

# SEÇÃO 06, Prova social (comprimida)

**Eyebrow:** `+35 mil alunos`
**Título:** `Quem aprendeu na Xperiun está dizendo`

Carrossel de depoimentos em vídeo, selo de 4,9 estrelas e a faixa de logos de
empregadores, tudo em uma seção só.

**Design:** `.sec-depos` do f6 como está. Cortar a seção separada de professores da v1.
Os nomes dos professores já aparecem nas tags dos cards do carrossel da seção 04, que é
prova mais concreta que uma grid de retratos.

---

# SEÇÃO 07, As duas ofertas

**Eyebrow:** `Investimento`

**Título:**
> Duas portas. <span 700>Escolha com o preço na frente.</span>

### Card A (`.oferta-card--f6`)
`Foco em IA e Automação`
**Formação em Inteligência Artificial e Automação**
**R$ 497**, acesso por 12 meses

- 10 cursos, ~62h
- 4 entregáveis prontos (2 apps Power Apps, agente de IA, fluxo N8N)
- Certificado Xperiun por competência
- Templates de N8N e material de IA aplicada
- Sem Business Cases
- Sem as outras 6 formações

**CTA:** `Garantir a Formação 6`

### Card B (`.oferta-card--full`, destacado)
`Mais escolhido, acesso vitalício`
**Xperiun Completa**
**R$ 1.497**, vitalício, sem renovação

- As 7 formações, 47 cursos
- Tudo da Formação 6 incluso
- Os 41 Business Cases, todas as áreas
- Comunidade Xperiun (Discord, lives quinzenais, workshops)
- Acervo de lives (177h) e workshops (47h)
- Certificado MEC via UNIFATEC, único produto com o selo
- Rota de Carreira (Portfólio, LinkedIn Champion, 1º Emprego)
- 20% off em MBA e Pós Tech

**CTA:** `Quero a Xperiun Completa`

**Linha de valor:**
> As 7 formações compradas avulsas custam R$ 6.979. Na Completa saem por R$ 1.497.

**Design:**
- Card A `span 4`, Card B `span 6` no grid 10. `span 3` e `span 5` no grid 8. `1 / -1` em 864 e 576, com o Card B primeiro na ordem visual.
- Card B com `--ring-25` e glow de `--pp500-15`. Card A em `--ring-10` neutro.
- Checks inclusos em `--sc500`. Os dois itens de exclusão do Card A com ícone `close` em `--bw-25`, não em vermelho. Exclusão aqui é informação, não ameaça.
- Preço no padrão `.completa-price-value`, com o valor avulso riscado acima.
- Traço mínimo 2px via `--ring-*`. Nada de `border: 1px`.

---

# SEÇÃO 08, Risco e FAQ (fusão, FAQ cortado pra 5)

**Eyebrow:** `Sem risco`

**Título:**
> O que você paga aqui não evapora

**Corpo:**
> A Formação dá 12 meses de acesso. A Xperiun Completa é vitalícia, paga uma vez e o
> acesso é seu. Sem renovação, sem mensalidade, sem letra miúda.

**Selos:** `7 dias de garantia`, `Acesso imediato`, `Sem renovação`

**FAQ, 5 perguntas:**

1. **Preciso saber programar?** Não. N8N e Power Automate são sem código, Power Apps é visual. Só o curso de Python e Agentes pede fundamento mínimo, e vem estruturado pra profissional de negócio.
2. **É pra quem nunca usou IA?** Sim, e pra quem já usa também. Os dois primeiros cursos dão o fundamento, e do terceiro em diante a profundidade sobe. Quem já usa ChatGPT todo dia aprende a sair do assistente pro agente que executa.
3. **Vale pagar R$ 1.000 a mais pela Completa?** Se você só quer resolver o operacional deste ano, a Formação 6 resolve. Se você quer as duas competências da projeção da década, os 41 Business Cases e o certificado MEC, sem nunca pagar de novo, a Completa resolve.
4. **O vitalício é vitalício mesmo?** Sim. Pagamento único, sem renovação e sem mensalidade.
5. **Quanto tempo leva?** Você define o ritmo. Aulas gravadas, sem turma e sem data de entrega.

**Design:** `.oferta-risk` com ícones `verified_user`, `bolt`, `cancel`, e o acordeão
`.faq-row` logo abaixo, na mesma seção. **Cuidado conhecido:** `.faq-a-wrap` precisa de
`min-width: 0`, não `100%`, senão estoura o cap de 1440. Bug recorrente ao reportar o
FAQ da formacoes.

> **Atenção editorial:** o site inteiro hoje vende "anuidade com crédito vitalício de
> upgrade". Com a Completa vitalícia esse argumento muda, e esta seção substitui o
> discurso de anuidade.

---

# SEÇÃO 09, Fechamento

**Eyebrow:** `Próximo passo`

**Título:**
> R$ 497 compra 12 meses de uma competência.
> <span 700>R$ 1.497 compra as duas que o mercado vai disputar, pra sempre.</span>

**Sub:**
> Uma vence quando o ano acaba. A outra não vence nunca.

**CTA primário:** `Quero a Xperiun Completa, R$ 1.497 vitalício`
**CTA secundário, discreto:** `Levar só a Formação em IA e Automação, R$ 497`

**Tags:** `Acesso vitalício`, `41 Business Cases`, `Certificado MEC`, `7 dias de garantia`

**Design:** `.sec-cta` do f6, `.cta-left` com texto e `.cta-right` com ações. Hierarquia
invertida em relação ao hero: aqui o primário é a Completa.

---

# Notas de execução

## Divergências de dado encontradas no site (resolver antes de publicar)

Levantei os números direto do código, e três não batem com o que as páginas afirmam:

| Dado | O site afirma | O código tem | Onde conferi |
|---|---|---|---|
| Cursos na Completa | 44 | **47 cards** | soma dos `.course-card` em f1 a f7 |
| Carga total | ~370h | **~402h** | soma das cargas declaradas nos heros de f1 a f7 |
| Business Cases | 45 | **41** | objeto `AREAS` em `/ed/business-cases/script.js` (4+11+12+5+9) |

Isso importa mais nesta v2 do que na v1, porque as seções 04 e 05 **mostram** os itens
um por um. Se a página diz 45 cases e o carrossel exibe 41, o leitor conta. Definir os
números corretos e alinhar home, as 7 páginas de formação e esta página.

Observação sobre os 47: o f4 declara "3+1 cursos + bônus", então parte da diferença pode
ser critério de contagem de bônus. Vale decidir a regra, contar uma vez e replicar.

## Preço

Preços atuais no site: F6 em 12x 97 / R$ 997, Completa em 12x 197 / R$ 1.997. Este deck
usa 497 e 1.497 e não cita parcelamento, porque você não passou. Se houver 12x, Card A
fica "12x 49" e Card B "12x 149". A economia declarada na home muda de R$ 4.982 pra
R$ 5.482.

## Reuso, nada de componente novo

| O que a página precisa | O que já existe |
|---|---|
| Card e popup de curso | `.course-card` e `.course-modal` em `ed/formacoes/` |
| Popup de business case | `XpFolder` / `Lightbox.open()` em `ed/areas/pasta.js` |
| Dados dos business cases | objeto `AREAS` via `cs()` em `ed/business-cases/script.js` |
| Setas de carrossel | padrão `.depos-nav` |
| Cards de oferta | `.oferta-card--f6` e `.oferta-card--full` |
| Faixa de números | `.meta-card` |
| Acordeão de FAQ | `.faq-row` |

O único código realmente novo é a lógica de filtro por chip dos dois carrosséis.

## Regras do DS aplicadas

- Sem em-dash e sem interpunct em nenhuma copy acima.
- Destaque em título por `font-weight: 700` em `<span>`, jamais `<strong>`.
- Traço mínimo 2px via `--ring-*`, nunca `border: 1px`.
- Transições só com keyword, sem `cubic-bezier`.
- Sem blur animado abaixo de 864px.
- CSS externo (`style.css?v=N`), nada de `<style>` inline.
- Caminhos absolutos em todo asset de `/ed/`, testando com barra final.
- `.faq-a-wrap` com `min-width: 0`.
- Media queries do grid depois das regras base de `grid-column`.
- Pesos Poppins self-hosted: 200/400/500/600/700/800. Sem 300.
- Ao criar o arquivo, partir de `ed/site-dependencias/_template-pagina.html`.
