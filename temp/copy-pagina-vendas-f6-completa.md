# Página de vendas: IA e Automação, com funil pra Xperiun Completa

Deck de copy + direção de design, seção por seção.
Oferta A: Formação em Inteligência Artificial e Automação, 12 meses, R$ 497.
Oferta B: Xperiun Completa, vitalícia, R$ 1.497.

Convenções deste doc:
- **Eyebrow** = `.sec-eyebrow`, **Título** = `.sec-title` (h2), **Lede** = `.sec-lede`.
- Destaque dentro de título é `<span style="font-weight: 700">`, nunca `<strong>`.
- Toda cor citada é token do `root.css`. Nada de hex solto.
- Container `max-width: 1440px`, `padding: 0 16px`, grid 10 / 8 / 6 / 4 cols nos
  breakpoints 1440 / 1439 / 864 / 576, gaps 32 / 32 / 24 / 16.

---

## Fluxo da página em uma linha

Dor de tempo, a Formação 6 como solução, prova de entregável, quem ensina,
reconhecimento, **virada da década**, as duas competências, Business Cases,
as duas ofertas lado a lado, risco zero, FAQ, fechamento.

A página inteira é honesta sobre vender duas coisas. Ela não esconde a Completa
pro final nem entrega ela cedo demais. A virada acontece depois da prova social,
quando o leitor já quis a Formação 6.

---

# SEÇÃO 01, Hero

**Eyebrow / top tag:** `Formação 6` + tag `Inteligência Artificial e Automação`

**H1:**
> Dobre sua produtividade.
> <span 700>Saia do operacional repetitivo.</span>

**Sub (`.hero-p`):**
> A formação que ensina IA e automação como ferramenta prática pra liberar de 10 a 20
> horas por semana do seu calendário. Você não sai com promessa de produtividade,
> sai com sistema rodando.

**CTAs:** primário `Garantir por R$ 497`, secundário `Ver o que vem na Completa`

**Design:**
- Reusar `.hero--f6` do f6, incluindo `.hero-bg-float` e `.hero-wave`.
- O CTA secundário aqui é a única menção antecipada à Completa, e é um link discreto (`.btn` ghost), não um segundo botão cheio. Ele existe pra quem já chegou decidido, não pra competir com o primário.
- Manter `padding: 64px` + `margin: -64px` no `.hero-h1` pro halo do blur. Não zerar.
- Abaixo de 864px, redefinir a keyframe sem blur.

---

# SEÇÃO 02, Barra de números

**Design apenas** (`.sec-meta` / `.meta-card`), sem eyebrow nem título.

| Valor | Label |
|---|---|
| ~62h | de carga total |
| 10 | cursos |
| 4 | entregáveis prontos |
| Vitalício | disponível na Completa |

**Nota:** a quarta célula é a semente do funil. Ela planta "vitalício" no primeiro
scroll, sem explicar. O leitor vai encontrar a explicação na seção 09.

---

# SEÇÃO 03, A dor (seção nova)

**Eyebrow:** `O custo invisível`

**Título:**
> Você não está sem tempo.
> <span 700>Seu tempo está sendo consumido por tarefa que não precisa de você.</span>

**Lede:**
> Consolidar planilha, atualizar relatório, copiar dado de um sistema pro outro,
> responder o mesmo pedido de sempre. Nada disso exige julgamento. Tudo isso exige
> as suas horas.

**Três colunas (padrão `.troca-card`):**

1. **10 a 20 horas por semana**
   É a faixa que profissional de negócio gasta em rotina manual. Meio expediente por semana.
2. **Nenhuma delas aparece na sua avaliação**
   Ninguém é promovido por consolidar planilha rápido. Promovem por decisão.
3. **A conta piora sozinha**
   Cada novo relatório, cada novo sistema, cada nova cobrança recorrente vira mais carga fixa.

**Design:**
- Grid `span 3 / span 3 / span 4` no tier 10 cols, `span 3 / span 3 / span 2` no 8, `1 / -1` em 864 e 576.
- Fundo `--bb`, cards com `box-shadow: var(--ring-10)`. Sem `border`.
- Usar `--er500` só no número "10 a 20 horas" ou em nada. Vermelho aqui é acento de uma palavra, não cor de seção.

---

# SEÇÃO 04, O que você vai dominar

**Eyebrow:** `O que você vai dominar`

**Título:**
> Que tipo de habilidade você vai desenvolver

**Lede:**
> Não é "ChatGPT te ajuda no trabalho". É montar o sistema que faz o trabalho por você.

**Tiles (`.skill-tile`, ícone Material Symbols):**

| Ícone | Nome | Meta |
|---|---|---|
| `smart_toy` | Agentes de IA que executam tarefa real | Agente que pesquisa, escreve, integra com sistema e fecha a tarefa, não só responde pergunta. |
| `account_tree` | Automação no N8N, sem código | Você conecta CRM, planilha, email, Slack e ERP num fluxo, sem depender de dev. |
| `bolt` | Power Automate no ambiente Microsoft | Automação na ferramenta nativa que a sua empresa provavelmente já paga. |
| `apps` | Aplicativo no Power Apps | App interno do zero (checklist, documento, formulário), sem virar desenvolvedor. |
| `auto_awesome` | IA generativa dentro do fluxo de trabalho | Fundamento claro do que LLM faz e do que não faz, aplicado em rotina real. |
| `code` | Python aplicado a agentes de IA | Vantagem técnica rara pra quem vem do lado do negócio. |

**Design:** reusar `.skills-grid` do f6. O tile `--wide` fica no primeiro (agentes de IA), porque é o diferencial da formação. Ícone em `--pc300`, dentro de caixa com fundo `--pc300-10`.

---

# SEÇÃO 05, Estrutura curricular

**Eyebrow:** `Estrutura curricular`

**Título:**
> Os 10 cursos da Formação

**Lede:**
> IA, N8N, Power Automate e Power Apps em ~62h. Ordem flexível. Ataque primeiro o
> módulo que resolve a sua dor.

**Conteúdo:** os 10 `.course-card` já existentes no f6, com carga, professor, título e `.course-modal` no clique.

**Design:** copiar `.courses-grid` + modal como está. Não reescrever componente que já funciona.

---

# SEÇÃO 06, Entregáveis

**Eyebrow:** `Munição pra carreira`

**Título:**
> Você não termina com caderno cheio.
> <span 700>Termina com quatro coisas funcionando.</span>

**Lede:**
> Quatro entregáveis tangíveis, prontos pra usar amanhã na sua empresa.

**Cards (`.proj-card`):**

1. **App pronto**, App de Checklist e App de Gestão de Documentos no Power Apps. Dois apps pra distribuir pro time da operação amanhã.
2. **IA aplicada**, Agente de IA funcional em Python e LLM, executando tarefa real. Ativo de portfólio que diferencia.
3. **Fluxo automatizado**, Automação documentada no N8N conectando 3 ou mais sistemas, reusável nas próximas.
4. **Biblioteca própria**, Templates de N8N e material de IA aplicada pra adaptar em caso novo.

**Design:** `.projetos-grid` do f6. Tag de categoria em `--pc300` sobre fundo `--pc300-10`.

---

# SEÇÃO 07, Os 4 pilares

**Eyebrow:** `O que você vai aprender`

**Título:**
> Os 4 pilares da Formação 6

**Lede:**
> Automation e IA Mastery, da tarefa manual ao sistema autônomo.

1. **IA Generativa Aplicada**, Fundamento de LLM e ChatGPT, e discernimento de quando IA resolve e quando não resolve.
2. **Agentes de IA com Python**, Agente que executa, integra com sistema e fecha a tarefa do início ao fim.
3. **Automação sem código com N8N**, Conexão de sistemas em fluxo automatizado, sem dev.
4. **Power Platform corporativo**, Automate pra processo, Apps pra operação, no stack que a empresa já paga.

**Design:** `.pilares-grid` com `.pilar-num` grande em `--pc300-25` e texto em `--bw`.

---

# SEÇÃO 08, Professores e prova social

**Eyebrow:** `Quem te ensina`

**Título:**
> Seus professores

**Lede:**
> Profissionais de mercado que automatizam processo de empresa de verdade.

César Germano (IA, N8N, Python e Agentes), Anderson Rocha (Power Automate),
Daniel Petrin (3 cursos de Power Apps).

**Depoimentos, eyebrow:** `+35 mil alunos`
**Título:** `Quem aprendeu na Xperiun está dizendo`
**Selo:** avaliação média 4,9 estrelas, mais o grid de logos de empregadores.

**Design:** `.profs-grid` e `.sec-depos` como estão. O carrossel de vídeo e a faixa de logos fecham a etapa "eu quero isso" antes da virada.

---

# SEÇÃO 09, A VIRADA (seção nova, coração da página)

**Eyebrow:** `Projeção até o fim da década`

**Título:**
> Antes de você escolher,
> <span 700>um dado que muda a conta.</span>

**Lede:**
> O estudo da H2R em parceria com a Totvs projeta as profissões mais relevantes até o
> final da década. Duas delas estão dentro da Xperiun.

**Bloco duplo, lado a lado:**

**Card 1, ativo**
`Formação 6, você está aqui`
### Especialista em IA e Machine Learning
É exatamente esta formação. Agentes, automação, IA aplicada. A competência que você
compra por R$ 497.

**Card 2, apagado**
`Formações 1, 2, 4 e 5`
### Analista e Cientista de Dados
Power BI, SQL, Python e Data Science. A segunda competência da lista, e ela não está
na oferta de R$ 497.

**Fecho da seção (texto centralizado, largura de leitura):**
> A Formação 6 te coloca em uma das duas.
> As outras seis te colocam nas duas.
>
> Automação sem leitura de dado te deixa rápido no lugar errado. Dado sem automação
> te deixa preciso e sobrecarregado. O mercado da próxima década vai pagar por quem
> tem os dois lados.

**Design (esta é a seção que merece investimento):**
- Fundo escuro `--bb` com `.sec-gradient` puxando `--pp500-15` de um canto. É a única seção com roxo dominante, pra marcar que aqui a página mudou de assunto.
- Os dois cards em `span 5` + `span 5` (grid 10), `span 4` + `span 4` (grid 8), `1 / -1` em 864 e 576.
- **Contraste é a mensagem:** card 1 com `box-shadow: var(--ring-25)` e ícone em `--pc300`. Card 2 com `--ring-10`, texto em `--bw-50`, ícone em `--bw-25`, e um selo `Não incluso em R$ 497` em `--er500` sobre `--er500` a 10%. O leitor precisa *ver* a lacuna antes de ler sobre ela.
- Opcional, se houver apetite: uma linha do tempo horizontal fina (2026 a 2030) atravessando os dois cards, com os dois marcos plotados. Se for fazer gráfico, seguir a paleta do DS, `--pc300` e `--pp500` como as duas séries, nunca cor nova.
- Transição só com keyword (`ease`, `ease-out`). Sem `cubic-bezier`.

**Nota de honestidade:** o estudo aponta três profissões. A copy cita as duas que
estão na Xperiun e não afirma qual é a terceira. Manter assim, inclusive porque a
frase "duas das três" é mais forte do que listar as três.

---

# SEÇÃO 10, O mapa das 7 formações

**Eyebrow:** `As duas competências`

**Título:**
> O caminho completo, das duas pontas

**Lede:**
> Sete formações por competência. A 6 é uma delas. A Completa é todas.

**Layout:** as 7 formações em lista com ícone (`.oferta-completa-icon--f1` até `--f7`).
A F6 aparece marcada como `Você já vai levar esta`. As outras seis aparecem com o
rótulo `Vem na Completa`.

| | Formação | Papel na projeção |
|---|---|---|
| 01 | Power BI Básico ao Intermediário | Base de Analista de Dados |
| 02 | Power BI Intermediário ao Avançado | Senioridade em análise |
| 03 | Microsoft Fabric | Stack que vira padrão corporativo |
| 04 | Banco de Dados e SQL | Independência da TI |
| 05 | Python e Data Science | Entrada em ciência de dados |
| 06 | **IA e Automação** | **Especialista em IA e ML** |
| 07 | Carreira e Negócios | Converter técnica em salário e contrato |

**Design:** grid de 7 itens, o item 06 com `--ring-25` e acento `--pc300`, os outros
com `--ring-10`. Números 44 cursos e ~370h em destaque no rodapé da seção.

---

# SEÇÃO 11, Biblioteca de Business Cases

**Eyebrow:** `Biblioteca Na Prática`

**Título:**
> Curso te ensina.
> <span 700>Case te prova.</span>

**Lede:**
> Com a Xperiun Completa você abre a Biblioteca de Cases Reais inteira, projetos
> construídos a partir de empresas brasileiras, em todas as áreas.

**Corpo:**
> Vendas, Financeiro, Logística, Recursos Humanos, Compras, Produção, Saúde e TI.
>
> Não é replicar passo na tela. É receber a demanda como um analista recebe, sem
> tutorial guiando a sua mão, e resolver.
>
> É daí que sai o portfólio. E portfólio é o que o recrutador abre depois de fechar
> o seu certificado.

**Selo de contraste:**
> Na oferta de R$ 497 a biblioteca não entra. Na de R$ 1.497 ela entra por inteiro, pra sempre.

**Design:**
- Chips por área com contagem, puxando os números reais de `/ed/business-cases/`. Ver nota de dado no fim deste doc antes de cravar total.
- Link `Ver a biblioteca` apontando pra `/ed/business-cases/`. Deixar o leitor conferir o tamanho do acervo é mais persuasivo que afirmar o tamanho.
- Fundo `--bw` (seção clara) pra quebrar a sequência escura e dar respiro antes da oferta.

---

# SEÇÃO 12, As duas ofertas

**Eyebrow:** `Investimento`

**Título:**
> Duas portas.
> <span 700>Escolha com o preço na frente.</span>

**Lede:**
> Leva só a Formação em IA e Automação, ou leva o ecossistema inteiro pra sempre.

### Card A (`.oferta-card--f6`)
**Eyebrow do card:** `Foco em IA e Automação`
**Título:** Formação em Inteligência Artificial e Automação
**Preço:** R$ 497
**Detalhe:** acesso por 12 meses

- 10 cursos, ~62h de conteúdo
- 4 entregáveis prontos (2 apps, agente de IA, fluxo N8N)
- Certificado Xperiun por competência
- Templates de N8N e material de IA aplicada

**CTA:** `Garantir a Formação 6`

### Card B (`.oferta-card--full`, destacado)
**Eyebrow do card:** `Mais escolhido, acesso vitalício`
**Título:** Xperiun Completa
**Preço:** R$ 1.497
**Detalhe:** acesso vitalício, sem renovação

- As 7 formações por competência (44 cursos, ~370h)
- **Tudo da Formação 6 incluso**
- Biblioteca de Business Cases completa, todas as áreas
- Comunidade Xperiun (Discord, lives quinzenais, workshops)
- Acervo de lives (177h) e workshops (47h)
- Certificado MEC via UNIFATEC, único produto com o selo
- Rota de Carreira (Portfólio, LinkedIn Champion, 1º Emprego)
- 20% off em MBA e Pós Tech (Passaporte Acadêmico)

**CTA:** `Quero a Xperiun Completa`

**Linha de valor abaixo dos cards:**
> As 7 formações compradas avulsas custam R$ 6.979. Na Completa saem por R$ 1.497.

**Design:**
- Card A `span 4`, Card B `span 6` no grid 10. No grid 8, `span 3` e `span 5`. Em 864 e 576, `1 / -1` com o Card B primeiro na ordem visual.
- Card B com `--ring-25`, glow suave de `--pp500-15`, e a faixa de eyebrow em `--pc300`. Card A em `--ring-10` neutro.
- Preço com `.completa-price-value` (número grande) e o valor avulso riscado acima, como na home.
- `--sc500` só nos checks do Card B. Verde é sinal de incluso, não decoração.
- Nada de `border: 1px`. Traço mínimo 2px via `--ring-*`.

---

# SEÇÃO 13, Quebra de risco

**Eyebrow:** `Sem risco`

**Título:**
> O que você paga aqui não evapora

**Corpo:**
> Mensalidade é aluguel. Você para de pagar e perde tudo.
>
> A Formação em IA e Automação dá 12 meses de acesso. A Xperiun Completa é vitalícia,
> paga uma vez e o acesso é seu. Sem renovação, sem mensalidade, sem letra miúda.

**Selos:** `7 dias de garantia`, `Acesso imediato`, `Sem renovação`

**Design:** faixa `.oferta-risk` / `.completa-risk`, ícones `verified_user`, `bolt`, `cancel`.

> **Atenção editorial:** hoje o site inteiro vende "anuidade com crédito vitalício de
> upgrade". Com a Completa vitalícia esse argumento muda. Esta seção substitui o
> discurso de anuidade. Ver nota de consistência no fim do doc.

---

# SEÇÃO 14, FAQ

**Eyebrow:** `Dúvidas frequentes`
**Título:** `Perguntas que a gente recebe toda semana`

1. **Preciso saber programar?** Não. N8N e Power Automate são sem código, Power Apps é visual. Só o curso de Python e Agentes pede fundamento mínimo, e ele vem estruturado pra profissional de negócio.
2. **É pra quem nunca usou IA ou pra quem já usa?** Pros dois. Os dois primeiros cursos dão o fundamento pra quem está zerado, e do terceiro em diante a profundidade sobe. Quem já usa ChatGPT todo dia aprende a sair do assistente pro agente que executa.
3. **Vale mesmo pagar R$ 1.000 a mais pela Completa?** Depende do seu horizonte. Se você só quer resolver o operacional deste ano, a Formação 6 resolve. Se você quer as duas competências da projeção da década e nunca mais pagar, a Completa resolve.
4. **O acesso vitalício é vitalício mesmo?** Sim. Pagamento único, sem renovação e sem mensalidade.
5. **Power Automate e Power Apps funcionam fora da Microsoft?** Funcionam melhor no Microsoft 365, que muitas empresas já pagam. Power Apps tem versão standalone, e N8N e os agentes de IA rodam independente do stack.
6. **Quanto tempo leva?** Você define o ritmo. Aulas gravadas, sem turma e sem data de entrega.
7. **Tem certificado que o mercado reconhece?** A Formação dá certificado Xperiun por competência. A Completa dá também o certificado MEC via UNIFATEC, aceito por RH de empresa grande.

**Design:** acordeão `.faq-row` do f6. **Cuidado conhecido:** `.faq-a-wrap` precisa de
`min-width: 0`, não `100%`, senão estoura o cap de 1440. É bug recorrente ao reportar
o FAQ da formacoes.

---

# SEÇÃO 15, Fechamento

**Eyebrow:** `Próximo passo`

**Título:**
> R$ 497 compra 12 meses de uma competência.
> <span 700>R$ 1.497 compra as duas que o mercado vai disputar, pra sempre.</span>

**Sub:**
> Uma vence quando o ano acaba. A outra não vence nunca.

**CTA primário:** `Quero a Xperiun Completa, R$ 1.497 vitalício`
**CTA secundário, discreto:** `Levar só a Formação em IA e Automação, R$ 497`

**Tags:** `Acesso vitalício`, `Certificado MEC`, `7 dias de garantia`

**Design:** `.sec-cta` do f6, com `.cta-left` de texto e `.cta-right` de ações.
A hierarquia aqui é invertida em relação ao hero: primário é a Completa, secundário
é a Formação. A página começa vendendo a 6 e termina vendendo as 7 em 1.

---

# Notas de execução

**Consistência a resolver antes de publicar**
1. As 7 páginas de formação e a home vendem "anuidade com crédito vitalício de upgrade", e a home tem FAQ inteiro sobre anuidade vs mensalidade. Com a Completa vitalícia a R$ 1.497, esse texto entra em contradição.
2. Preços atuais no site: F6 em 12x 97 / R$ 997, Completa em 12x 197 / R$ 1.997. Este deck usa 497 e 1.497 e não cita parcelamento, porque você não passou. Se houver 12x, o Card B fica "12x 149" e o A "12x 49".
3. A economia declarada na home (R$ 4.982) muda pra R$ 5.482 com o preço de 1.497.
4. Contagem de Business Cases: a home e as páginas de formação dizem 45, mas `/ed/business-cases/` lista 04 + 11 + 12 + 05 + 09, que somam 41. Por isso a seção 11 não crava número. Definir o correto e alinhar em todos os lugares.

**Regras do DS aplicadas neste deck**
- Sem em-dash e sem interpunct em nenhuma copy acima.
- Destaque em título por `font-weight: 700` em `<span>`, jamais `<strong>`.
- Traço mínimo 2px via `--ring-*`, nunca `border: 1px`.
- Transições só com keyword, sem `cubic-bezier`.
- Sem blur animado abaixo de 864px.
- CSS externo (`style.css?v=N`), nada de `<style>` inline.
- Caminhos absolutos em todo asset de `/ed/`.
- Ao criar o arquivo, partir de `ed/site-dependencias/_template-pagina.html`.
- Pesos Poppins self-hosted: 200/400/500/600/700/800. Sem 300.
