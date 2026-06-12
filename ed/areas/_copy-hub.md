# Copy — HUB "Aprenda por Área de Negócio"

> **Página:** `/ed/areas/` (index.html)
> **O que é:** HUB que apresenta as 4 áreas de **Análise de Dados por Área** (Logística, Financeiro, Vendas, RH).
> **Paralelo:** está para as 4 páginas de área assim como `/ed/formacoes/` está para as 7 formações. Mesma estrutura, mesmo Design System, mesmos componentes.
> **Status:** copy v1 para aprovação. Produção do HTML vem depois do "ok" no texto.

---

## 0. Conceito — o que diferencia Áreas de Formações

Para a copy não brigar com a do HUB de Formações, a régua é esta:

| | **Formações** (já existe) | **Aprenda por Área** (esta) |
|---|---|---|
| Corte | Por **competência** (a ferramenta) | Por **departamento** (o seu trabalho) |
| Pergunta que responde | "Quero dominar Power BI / SQL / Python a fundo" | "Quero resolver os problemas da minha área — ou entrar nela com dado na mão" |
| Como ensina | Trilha técnica estruturada, do básico ao avançado | **Business cases reais** com os dados e indicadores daquela área |
| Promessa | Virar a referência técnica | "[Área] com mais clareza e menos achismo" — sair com um dashboard replicável do seu mundo |
| Momento | Aprofundamento / carreira | Aplicação imediata / porta de entrada pelo seu contexto |

**Frase-âncora do HUB:** você não aprende com a base de vendas de uma loja fictícia americana. Aprende com OTIF, DRE, turnover e ticket médio — os números que mandam na área que você escolher (a de hoje ou a que você quer).

---

## 1. HERO

- **Tag superior:** `Aprenda por Área de Negócio`
- **H1:** **4 áreas.** Aprenda análise de dados com **os indicadores reais da sua área de negócio**.
- **Subtítulo (hero-p):** Logística, Financeiro, Vendas ou RH. Escolha a área onde você trabalha — ou onde quer entrar — e aprenda com os dados, os KPIs e os business cases reais dela. Nada de planilha-exemplo genérica.
- **CTA primário:** `Encontrar minha área` → âncora `#areas-inner`
- **CTA secundário (subtle):** `Como funciona` → âncora `#sec-why`
- **Marquee (hero):** ícones das 4 áreas em loop (ver Assets).

---

## 2. SEC-AREAS (o miolo) — as 4 áreas

> Espelha a `sec-formacoes`: nav lateral (lista clicável) + cards. 4 itens em vez de 7.
> **Cada card traz as duas opções de compra no rodapé**, como seletor: *Curso avulso* (R$ 19, 1 business case pra começar) e *Pack da área* (R$ 49, todos os business cases — opção destacada).

- **Eyebrow:** `As 4 áreas`
- **Título:** Escolha **a área onde você trabalha** — ou onde quer entrar

### Card — Logística
- Label: `Área` · Título: **Logística**
- Desc: Do achismo na operação ao painel que mostra **ruptura, OTIF e custo logístico** em tempo real.
- Indicadores (tags / chips): Entregas no prazo · OTIF · Giro de estoque · Ruptura · Custo logístico · Tempo médio de entrega · Nível de serviço
- Tag rodapé: `7+ indicadores` · `business cases reais`
- Footer: **Curso avulso R$ 19** · **Pack da área R$ 49** → ambos linkam pra `/ed/areas/logistica/`

### Card — Financeiro
- Label: `Área` · Título: **Financeiro**
- Desc: Do fechamento no Excel ao **DRE, fluxo de caixa e margem** vivos num dashboard que a diretoria abre sozinha.
- Indicadores: Fluxo de caixa · DRE · Margem (bruta/operacional/líquida) · EBITDA · Orçado vs Realizado · Contas a pagar e receber · Análise vertical e horizontal
- Tag rodapé: `7+ indicadores` · `business cases reais`
- Footer: **Curso avulso R$ 19** · **Pack da área R$ 49** → ambos linkam pra `/ed/areas/financeiro/`

### Card — Vendas
- Label: `Área` · Título: **Vendas**
- Desc: Da planilha de meta ao painel de **faturamento, ticket médio e ranking** que o time olha todo dia.
- Indicadores: Faturamento · Meta vs Realizado · Ticket médio · Ranking de vendedores · Volume por produto · Crescimento mês a mês
- Tag rodapé: `6+ indicadores` · `business cases reais`
- Footer: **Curso avulso R$ 19** · **Pack da área R$ 49** → ambos linkam pra `/ed/areas/vendas/`

### Card — RH
- Label: `Área` · Título: **RH**
- Desc: Dos números soltos de pessoas ao painel de **turnover, headcount e absenteísmo** que sustenta decisão.
- Indicadores: Turnover · Headcount · Absenteísmo · Tempo médio de contratação · Desempenho por área · Evolução do quadro
- Tag rodapé: `6+ indicadores` · `business cases reais`
- Footer: **Curso avulso R$ 19** · **Pack da área R$ 49** → ambos linkam pra `/ed/areas/rh/`

---

## 3. SEC-WHY (filosofia) — "Por que aprender pela sua área"

- **Eyebrow:** `Nossa filosofia`
- **Título:** Por que a Xperiun ensina dados **pela sua área de negócio**
- **Lede (sub):** e não com a planilha-exemplo de sempre

**Card 1 — O problema** (tag `error` "O problema")
- Título: **O curso de dados padrão**
- Corpo: Ensina a ferramenta no abstrato: importa um CSV genérico, faz um gráfico de exemplo. No trabalho real, o dado é outro e a dor continua.

**Card 2 — A Xperiun** (tag `neutral` "A Xperiun")
- Título: **Aprenda com o seu mundo**
- Corpo: Cada área tem business cases construídos com dados e indicadores reais do departamento. Você importa uma base de verdade, trata, cria as medidas e sai com um dashboard replicável — pronto pra empresa ou pro portfólio.

**Card 3 — O caminho** (tag `success` "O caminho")
- Título: **Nossa sugestão**
- Lista:
  - *Comece pela sua área:* escolha Logística, Financeiro, Vendas ou RH — a que você já vive ou a que quer destravar — e resolva a dor mais concreta primeiro.
  - *Aprofunde quando quiser:* quando a vontade for dominar a ferramenta a fundo, as [Formações por competência](/ed/formacoes/) são o passo natural.

---

## 4. SEC-OFERTA — como adquirir

> Modelo travado: **por área**, R$ 19 o curso avulso ou R$ 49 o pack da área. Sem comparação de preço com a Completa e sem framing de "versão barata" — a oferta se vende pelo resultado, não pelo desconto.

- **Eyebrow:** `Como adquirir`
- **Título:** Leve **um curso** ou a **área completa**
- **Subtítulo:** Escolha a área, escolha a profundidade. Você sai com dashboard rodando nos dois.

**Card 1 — Curso avulso**
- Label: Leve um curso se…
- Preço: **R$ 19**
- Desc: Você quer destravar um indicador específico — montar aquele painel que te cobram e aplicar já.
- Seletor: escolher área → curso (Logística / Financeiro / Vendas / RH)

**Card 2 — Pack da área** (destaque)
- Label: Leve a área completa se…
- Preço: **R$ 49**
- Desc: Você quer o conjunto de business cases da sua área inteiro — do operacional ao executivo, num modelo replicável.
- Checks: Todos os cases da área · Dados reais, dashboard do zero · Modelo replicável pra empresa ou portfólio
- Seletor: escolher área (Logística / Financeiro / Vendas / RH)
- CTA: `Garantir minha área`

---

## 5. SEC-DEPOS (prova social)

Reaproveitar 100% o componente do HUB de Formações (carrossel de depoimentos em vídeo + logos de empresas + "+35 mil alunos" + 4,9 estrelas). Sem copy nova.

---

## 6. SEC-FAQ — dúvidas frequentes

- **Eyebrow:** `Dúvidas frequentes` · **Título:** Perguntas que a gente recebe **toda semana**

1. **Não sei qual área escolher. Como decido?**
   Vá pela área que você quer destravar — a de hoje ou a que você mira. Qual número define aquela área? Se é prazo de entrega e estoque → Logística. Se é caixa, margem e fechamento → Financeiro. Se é meta e faturamento → Vendas. Se é turnover e headcount → RH.

2. **Preciso saber Power BI antes?**
   Não. Cada área parte do zero: você importa a base, trata os dados, cria as medidas e monta o dashboard junto com a aula. O foco é aplicar nos dados da sua área, não decorar teoria.

3. **Qual a diferença entre "área" e "formação"?**
   Área te ensina a resolver os problemas do seu departamento com business cases reais dele. Formação te ensina a competência (Power BI, SQL, Python) a fundo, do básico ao avançado. Muita gente começa pela área e migra pra formação depois.

4. **Os dados dos cases são reais?**
   São bases reais de cada área (anonimizadas). Você sai com um modelo replicável — leva o mesmo dashboard pra empresa onde trabalha ou pro seu portfólio.

5. **Trabalho numa área que não está na lista. Serve pra mim?**
   Os fundamentos (tratar dado, criar medida, montar painel) servem pra qualquer área. Comece pela mais próxima da sua — e as competências viajam pra qualquer departamento.

---

## 7. SEC-CTA (fechamento)

- **Eyebrow:** `Próximo passo`
- **Título:** **Comece pela área** onde você trabalha — ou onde quer chegar
- **Sub:** É assim que você vira analista de dados na prática: começando pelos números reais da área, com um dashboard de verdade — não com a base-exemplo de sempre.
- **Tags:** Dados reais · Dashboard do zero · Modelo replicável
- **CTA primário:** `Ver as 4 áreas` → `#areas-inner`
- **CTA secundário (medium-core):** `Conhecer a Xperiun Completa` → `/`

---

## Assets necessários (pra produção)

- **Ícones das 4 áreas** (SVG, estilo dos ícones de formação em `site-media/formacoes/icones/`): Logística, Financeiro, Vendas, RH. → provavelmente em `site-media/areas/icones/`.
- **Backgrounds dos cards** (.webp 512×512, estilo `formacoes/bg/`): 1 por área.
- **Hero box icon** + marquee com os 4 ícones.
- Reaproveitáveis sem novo asset: depoimentos, logos de empresas, footer, menu, popups de form.

## Decisões abertas (preciso de você)

1. **Nº de cases por área:** confirmar quantos business cases cada área tem, pra fechar a tag de rodapé dos cards (hoje só diz "business cases reais", sem número).

2. **Nome oficial do pilar:** o menu usa *"Análise de Dados por Área"*; você falou *"Aprenda por Área de Negócio"*. Qual vira o nome da tag/título do hero?

3. **Preço no hero?** A home anuncia "a partir de R$ 19". Quer puxar esse "R$ 19" pro hero ou deixar o preço só na oferta (Seção 4)?
