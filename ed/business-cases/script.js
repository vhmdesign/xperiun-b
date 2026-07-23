/* ── Business Cases por área (mesmos dados do /ed/areas/) ──────────────
   cs(): monta um projeto; nível derivado do caminho da imagem. AB = base
   das imagens das áreas. Usado pra abrir o lightbox (XpFolder) na busca. */
var AB = '/ed/site-dependencias/site-media/areas/';
function cs(img, title, dur, aulas, desc, href, prof) {
    var nivel = /\/iniciante\//.test(img) ? 'Iniciante'
              : /\/intermediario\//.test(img) ? 'Intermediário'
              : /\/avancado\//.test(img) ? 'Avançado' : '';
    return { image: AB + img, title: title, nivel: nivel, duracao: dur, aulas: aulas,
             professor: prof || 'Leonardo Karpinski', desc: desc, allHref: href };
}
var L = '/ed/areas/logistica/', F = '/ed/areas/financeiro/', V = '/ed/areas/vendas/', R = '/ed/areas/rh/', D = '/ed/areas/';
var AREAS = {
    al: [
        cs('logistica/iniciante/Desempenho Logístico.webp', 'Desempenho Logístico', '2 h', '2', 'Colabore com uma empresa de logística para melhorar o desempenho de sua cadeia de suprimentos. Identifique atrasos, otimize rotas de entrega e reduza custos operacionais.', L),
        cs('logistica/iniciante/Gestão de Frotas para Logística.webp', 'Gestão de Frotas para Logística', '2 h', '2', 'Ajude uma empresa de logística a gerenciar sua frota de veículos com eficiência, reduzindo custos e melhorando o planejamento de rotas.', L),
        cs('logistica/intermediario/Indicadores de Desempenho Logístico.webp', 'Indicadores de Desempenho Logístico', '3 h', '2', 'Analise indicadores de desempenho logístico, como pontualidade de entregas e eficiência de armazenamento, para uma empresa de transporte.', L),
        cs('logistica/intermediario/Logística com Cálculo de OTIF.webp', 'Logística com Cálculo de OTIF', '2 h', '2', 'Realize análises logísticas com cálculo de OTIF (On-Time In-Full), avaliando desempenho de entregas e cumprimento de prazos.', L)
    ],
    af: [
        cs('financeira/iniciante/Análise Financeira.webp', 'Análise Financeira', '2 h', '2', 'Colabore com uma empresa financeira para analisar sua saúde financeira, identificar riscos e oportunidades de investimento, aprofundando-se em demonstrativos financeiros.', F),
        cs('financeira/iniciante/Controle Financeiro.webp', 'Controle Financeiro', '2 h', '2', 'Auxilie uma pequena empresa a manter um controle financeiro sólido, criando sistemas de acompanhamento de despesas e receitas.', F),
        cs('financeira/iniciante/Dashboard Financeiro da Xperia Automotive.webp', 'Dashboard Financeiro da Xperia Automotive', '1 h', '8', 'Ajude Carlos, assistente administrativo da Xperia Automotive, a modernizar os processos da empresa, ainda dependentes do Excel.', F),
        cs('financeira/intermediario/Case de Controladoria com DRE.webp', 'Case de Controladoria com DRE', '4 h', '32', 'Trabalhe com um departamento de controladoria para desenvolver um dashboard que exiba a Demonstração de Resultados (DRE) de forma clara e eficaz.', F),
        cs('financeira/intermediario/Dashboard Financeiro Xperia Automotive.webp', 'Dashboard Financeiro Xperia Automotive', '2 h', '9', 'Transforme um dashboard financeiro mal elaborado em um de alto impacto para uma indústria automotiva, com ajustes visuais e organizacionais.', F),
        cs('financeira/intermediario/Fluxo de Caixa com Simulador Financeiro.webp', 'Fluxo de Caixa com Simulador Financeiro', '10 h', '7', 'Colabore com uma startup financeira para criar um simulador de fluxo de caixa que ajude os clientes a planejar seus negócios.', F),
        cs('financeira/avancado/Análise Financeira com Fluxo de Caixa.webp', 'Análise Financeira com Fluxo de Caixa', '7 h', '6', 'Trabalhe com uma startup para criar um fluxo de caixa robusto e prever cenários financeiros, destacando gestão financeira e análise de riscos.', F),
        cs('financeira/avancado/Demonstrativo Financeiro da Ambev.webp', 'Demonstrativo Financeiro da Ambev', '3 h', '2', 'Analise o demonstrativo financeiro da Ambev para identificar áreas de otimização de recursos e melhorias no desempenho financeiro.', F),
        cs('financeira/avancado/Demonstrativo de Resultados e Análise de Títulos.webp', 'Demonstrativo de Resultados e Análise de Títulos', '3 h', '4', 'Colabore com uma empresa para analisar demonstrativos financeiros e identificar títulos de investimento promissores.', F),
        cs('financeira/avancado/DRE Avançada.webp', 'DRE Avançada', '2 h', '2', 'Crie uma Demonstração do Resultado do Exercício (DRE) detalhada no Power BI, com cálculos automatizados de margens e percentuais para uma análise financeira mais intuitiva e dinâmica.', F),
        cs('financeira/avancado/Análises Financeiras para Grandes Corporações.webp', 'Análises Financeiras para Grandes Corporações', '8 h', '58', 'Este é um treinamento abrangente focado em desenvolver habilidades práticas no uso de ferramentas de BI, como o Power BI, para criar painéis financeiros eficazes.', F, 'Fernando Jesus')
    ],
    av: [
        cs('vendas/iniciante/Dashboard de Vendas da PBIDist.webp', 'Dashboard de Vendas da PBIDist', '2 h', '13', 'Ajude Frederico, gerente da PBIDist, a automatizar a análise de desempenho dos vendedores, criando um painel de controle eficiente que economiza tempo e aumenta a produtividade.', V),
        cs('vendas/iniciante/Desafio Toy & Play.webp', 'Desafio Toy & Play', '2 h', '2', 'Analise dados de brinquedos e jogos para identificar tendências de mercado e oportunidades de marketing no entretenimento infantil.', V),
        cs('vendas/iniciante/Desafio MR Bolos.webp', 'Desafio MR Bolos', '1 h', '2', 'Participe do desafio MR Bolos para analisar dados de vendas de uma confeitaria. Mostre sua capacidade de otimizar operações de pequenas empresas.', V, 'Felipe Martins'),
        cs('vendas/intermediario/Carpinski - Infográfico Comercial.webp', 'Carpinski, Infográfico Comercial', '57 min', '4', 'Desenvolva um infográfico comercial para a Carpinski, destacando realizações e dados-chave com comunicação visual e storytelling.', V),
        cs('vendas/intermediario/Desafio Bitrix24.webp', 'Desafio Bitrix24', '2 h', '2', 'Implemente o Bitrix24 em uma empresa, personalizando-o para gerenciamento de projetos e colaboração.', V),
        cs('vendas/intermediario/Performance de Vendas.webp', 'Performance de Vendas', '2 h', '2', 'Avalie o desempenho das equipes de vendas, identifique tendências de mercado e recomende estratégias para impulsionar o crescimento.', V),
        cs('vendas/intermediario/Realizado vs Meta.webp', 'Realizado vs Meta', '2 h', '2', 'Compare os resultados realizados com as metas estabelecidas, analise os desvios e recomende estratégias para atingir os objetivos.', V),
        cs('vendas/intermediario/Vendas x Meta Conectando em SQL Server.webp', 'Vendas x Meta Conectando em SQL Server', '2 h', '2', 'Conecte dados de vendas ao SQL Server e faça análises avançadas: tendências de mercado, desempenho vs metas e estratégias de vendas.', V),
        cs('vendas/avancado/Análises Comerciais com Storytelling.webp', 'Análises Comerciais com Storytelling', '8 h', '5', 'Aprimore as estratégias de vendas de uma empresa de varejo, usando previsões avançadas para recomendar produtos e ações de marketing.', V),
        cs('vendas/avancado/Análise Comercial com Simulador de Metas.webp', 'Análise Comercial com Simulador de Metas', '1 h', '2', 'Ajude uma equipe de vendas a bater metas com um simulador que permite ajustar estratégias em tempo real.', V),
        cs('vendas/avancado/Varejo com Análises Avançadas da Loja Pinski.webp', 'Varejo com Análises Avançadas da Loja Pinski', '5 h', '3', 'Aprimore a operação de varejo da loja Pinski: identifique padrões de compra, segmente clientes e otimize o mix de produtos.', V),
        cs('../formacoes/aulas/f5/Projeto Final, Sistema de Recomendação.webp', 'Sistema de Recomendação', '9 h', '60', 'Ajude o gestor da Pinski Modas a superar o caos das planilhas: acompanhamento de metas mensais, desempenho da equipe e performance dos produtos.', V)
    ],
    arh: [
        cs('rh/iniciante/Dashboard de RH da Klog.webp', 'Dashboard de RH da Klog', '1 h', '7', 'Ajude Ana, analista de RH na Klog, a dar conta das demandas de relatórios mensais urgentes com um dashboard automatizado que acompanha os indicadores-chave.', R),
        cs('rh/iniciante/KPIs de Recursos Humanos (RH).webp', 'KPIs de Recursos Humanos', '2 h', '2', 'Explore KPIs de RH, medindo desempenho da equipe, satisfação do colaborador e eficiência dos processos em uma empresa real.', R),
        cs('rh/iniciante/Recursos Humanos com Análise de Turnover.webp', 'Recursos Humanos com Análise de Turnover', '2 h', '3', 'Analise o turnover de funcionários: identifique as principais causas de saída, avalie o impacto financeiro e recomende medidas de retenção.', R),
        cs('rh/intermediario/Análise de Dados para Recursos Humanos.webp', 'Análise de Dados para Recursos Humanos', '16 h', '71', 'Este treinamento cobre a aplicação de um relatório de People Analytics em RH. O projeto cria painéis para avaliar desempenho, absenteísmo e turnover.', R, 'Jonathan Borges'),
        cs('rh/avancado/People Analytics com Análises Avançadas.webp', 'People Analytics com Análises Avançadas', '3 h', '2', 'Use análises avançadas de RH para insights sobre recrutamento, retenção, desenvolvimento e gestão de talentos.', R)
    ],
    ad: [
        cs('diversos/iniciante/Desafio Filmes Netflix.webp', 'Desafio Filmes Netflix', '2 h', '2', 'Explore o catálogo de filmes e séries da Netflix para identificar padrões de gênero, duração e lançamentos, criando seu primeiro dashboard de análise exploratória.', D),
        cs('diversos/iniciante/Acessos com Dados da Netflix.webp', 'Acessos com Dados da Netflix', '2 h', '2', 'Analise dados de acessos e consumo da Netflix para entender comportamento de audiência, horários de pico e preferências por conteúdo.', D),
        cs('diversos/iniciante/Dashboard da Fórmula 1.webp', 'Dashboard da Fórmula 1', '2 h', '3', 'Monte um dashboard interativo com dados históricos da Fórmula 1: desempenho de pilotos, escuderias e resultados ao longo das temporadas.', D),
        cs('diversos/intermediario/Educação com Dados do ENEM.webp', 'Educação com Dados do ENEM', '3 h', '4', 'Trabalhe com a base pública do ENEM para analisar desempenho por região, escola e área de conhecimento, gerando insights sobre a educação no Brasil.', D),
        cs('diversos/intermediario/Dashboard de Compras.webp', 'Dashboard de Compras', '3 h', '3', 'Desenvolva um dashboard de compras para acompanhar fornecedores, prazos de entrega, volumes e custos, apoiando decisões de suprimentos.', D),
        cs('diversos/intermediario/Gestão de Portfólio de Projetos.webp', 'Gestão de Portfólio de Projetos', '3 h', '3', 'Crie um painel de gestão de portfólio para acompanhar status, prazos, orçamento e riscos de múltiplos projetos em andamento.', D),
        cs('diversos/avancado/Chamados de Suporte (SAC) com Cálculo de SLA.webp', 'Chamados de Suporte (SAC) com Cálculo de SLA', '4 h', '5', 'Analise os chamados de um SAC com cálculo de SLA no Power BI: tempo de resposta, cumprimento de prazos e gargalos no atendimento.', D),
        cs('diversos/avancado/Produção (PCP) com Cálculo de OEE.webp', 'Produção (PCP) com Cálculo de OEE', '4 h', '5', 'Construa um dashboard de PCP com cálculo de OEE (Overall Equipment Effectiveness), medindo disponibilidade, performance e qualidade da produção.', D),
        cs('diversos/avancado/Dashboard de Manutenção (PCM).webp', 'Dashboard de Manutenção (PCM)', '4 h', '4', 'Desenvolva um dashboard de PCM (Planejamento e Controle de Manutenção) para acompanhar ordens de serviço, indicadores MTBF, MTTR e custos.', D)
    ]
};

/* Dropdown (componente do DS, root.css): abre/fecha, posiciona pra cima se
   faltar espaço abaixo, seleciona a opção e fecha ao clicar fora. Ao apertar
   o botão de busca, abre o lightbox (XpFolder) com os Business Cases da área. */
document.querySelectorAll('.dropdown-group').forEach(function (group) {
    var trigger = group.querySelector('.dropdown');
    var opts    = group.querySelector('.dropdown-options');
    var icon    = group.querySelector('.dropdown-icon');
    var label   = trigger && trigger.querySelector('.dropdown-placeholder, .dropdown-value');
    if (!trigger || !opts) return;
    var gap = 8;
    var searchBtn = group.parentElement && group.parentElement.querySelector('button.btn');
    var selectedArea = null;
    if (searchBtn) {
        searchBtn.addEventListener('click', function () {
            if (selectedArea && AREAS[selectedArea] && window.XpFolder) {
                window.XpFolder.open(AREAS[selectedArea], searchBtn);
            }
        });
    }

    function open() {
        opts.style.visibility = 'hidden';
        opts.style.display    = 'block';
        var optH = opts.offsetHeight;
        opts.style.display    = '';
        opts.style.visibility = '';
        var gRect = group.getBoundingClientRect();
        var spaceBelow = window.innerHeight - gRect.bottom - gap;
        var spaceAbove = gRect.top - gap;
        group.classList.toggle('is-open-up', spaceBelow < optH && spaceAbove >= optH);
        group.classList.add('is-open');
        if (icon) icon.textContent = 'expand_less';
    }

    function close() {
        group.classList.remove('is-open', 'is-open-up');
        if (icon) icon.textContent = 'expand_more';
    }

    trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        group.classList.contains('is-open') ? close() : open();
    });

    group.querySelectorAll('.dropdown-option').forEach(function (opt) {
        opt.addEventListener('click', function (e) {
            e.stopPropagation();
            if (label) {
                label.textContent = opt.textContent;
                label.className   = 'dropdown-value';
            }
            selectedArea = opt.dataset.area || null;
            if (searchBtn) searchBtn.disabled = false;
            close();
            /* levanta a tab (svg) correspondente à área selecionada. */
            if (opt.dataset.tab) {
                document.querySelectorAll('.bc-explore-layer-tab').forEach(function (t) {
                    t.classList.remove('is-active');
                });
                var tab = document.querySelector('.bc-explore-layer-tab--' + opt.dataset.tab);
                if (tab) tab.classList.add('is-active');
            }
        });
    });

    document.addEventListener('click', function (e) {
        if (!group.contains(e.target)) close();
    });
});

/* Cards de Business Cases: clicar abre o lightbox (XpFolder) da área. */
document.querySelectorAll('.bc-case-card[data-area]').forEach(function (card) {
    card.addEventListener('click', function () {
        var area = card.dataset.area;
        if (AREAS[area] && window.XpFolder) window.XpFolder.open(AREAS[area], card);
    });
});

/* ── Reveal no scroll: fade/blur/translate nas ilustrações. Mesma linguagem
   do reveal do formacoes/script.js — o IntersectionObserver adiciona
   .is-entered; o estado inicial e a transição vivem no style.css. Stagger
   por grupo (elementos co-localizados entram juntos). ───────────────────── */
(function () {
    var OPT = { rootMargin: '0px 0px -25% 0px', threshold: 0 };
    function reveal(selector, step) {
        var idx = 0;
        document.querySelectorAll(selector).forEach(function (el) {
            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    obs.unobserve(el);
                    var delay = idx * (step || 0);
                    idx++;
                    setTimeout(function () { el.classList.add('is-entered'); }, delay);
                });
            }, OPT);
            obs.observe(el);
        });
    }
    reveal('.bc-step', 120);
    reveal('.bc-explore-shot', 120);
    reveal('.bc-active-img', 120);
    reveal('.bc-explore-layer-stack', 0);
    reveal('.bc-portfolio-over .frame-embed', 120);
})();

/* Sobreposição sticky: mantém --bc-cases-height atualizada (altura da
   bc-cases-sec) pra o top sticky ficar correto. Padrão do courses-depos-track. */
(function () {
    var sec = document.querySelector('.bc-cases-track .bc-cases-sec');
    if (!sec) return;
    function update() { sec.style.setProperty('--bc-cases-height', sec.offsetHeight + 'px'); }
    update();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(update).observe(sec);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
})();
