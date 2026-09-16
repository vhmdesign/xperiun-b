/* ═══════════════════════════════════════════════════════════════════
   CATÁLOGO DAS ÁREAS (Business Cases por área)

   Estava inline no /ed/areas/index.html. Saiu de lá quando a página
   /ed/infinite-pass/oferta/ passou a mostrar os mesmos cards: duas cópias
   do mesmo catálogo divergem, e isso já aconteceu neste projeto (a f6 do
   dados.js ficou com 10 cursos enquanto a lista real tinha 19). Uma fonte
   só, dois consumidores.

   Expõe `AREAS`, um mapa id da área → { unit, projects }, no formato que o
   window.XpFolder.mount() espera. Quem monta é cada página, porque os
   seletores dos containers são diferentes em cada uma.
   ═══════════════════════════════════════════════════════════════════ */
var AREAS = (function () {
    var FB = '/ed/site-dependencias/site-media/formacoes/bg/';
    var AB = '/ed/site-dependencias/site-media/areas/';
    /* Placeholder (áreas ainda sem conteúdo: vendas, rh) */
    function bc(image, title, href) {
        return { image: FB + image, title: title, nivel: ',', duracao: ',', aulas: ',', professor: ',',
                 desc: 'Descrição do Business Case (placeholder).', allHref: href };
    }
    /* Business Case real (mentor: Leonardo Karpinski; nível derivado do caminho da imagem) */
    function cs(img, title, dur, aulas, desc, href, prof) {
        var nivel = /\/iniciante\//.test(img) ? 'Iniciante'
                  : /\/intermediario\//.test(img) ? 'Intermediário'
                  : /\/avancado\//.test(img) ? 'Avançado' : '';
        return { image: AB + img, title: title, nivel: nivel, duracao: dur, aulas: aulas,
                 professor: prof || 'Leonardo Karpinski', desc: desc, allHref: href };
    }
    var L = '/ed/areas/logistica/', F = '/ed/areas/financeiro/', V = '/ed/areas/vendas/', R = '/ed/areas/rh/';
    return {
        al: { unit: 'Business Cases', projects: [
            cs('logistica/iniciante/Desempenho Logístico.webp', 'Desempenho Logístico', '2 h', '2', 'Colabore com uma empresa de logística para melhorar o desempenho de sua cadeia de suprimentos. Identifique atrasos, otimize rotas de entrega e reduza custos operacionais.', L),
            cs('logistica/iniciante/Gestão de Frotas para Logística.webp', 'Gestão de Frotas para Logística', '2 h', '2', 'Ajude uma empresa de logística a gerenciar sua frota de veículos com eficiência, reduzindo custos e melhorando o planejamento de rotas.', L),
            cs('logistica/intermediario/Indicadores de Desempenho Logístico.webp', 'Indicadores de Desempenho Logístico', '3 h', '2', 'Analise indicadores de desempenho logístico, como pontualidade de entregas e eficiência de armazenamento, para uma empresa de transporte.', L),
            cs('logistica/intermediario/Logística com Cálculo de OTIF.webp', 'Logística com Cálculo de OTIF', '2 h', '2', 'Realize análises logísticas com cálculo de OTIF (On-Time In-Full), avaliando desempenho de entregas e cumprimento de prazos.', L)
        ] },
        af: { unit: 'Business Cases', projects: [
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
            cs('financeira/avancado/Análises Financeiras para Grandes Corporações.webp', 'Análises Financeiras para Grandes Corporações', '8 h', '58', 'Este é um treinamento abrangente focado em desenvolver habilidades práticas no uso de ferramentas de BI, como o Power BI, para criar painéis financeiros eficazes. Através de diversos módulos, o curso cobre desde a conexão e modelagem de dados até a criação e análise de visualizações complexas relacionadas a vendas, compras e fluxos de caixa.', F, 'Fernando Jesus')
        ] },
        av: { unit: 'Business Cases', projects: [
            cs('vendas/iniciante/Dashboard de Vendas da PBIDist.webp', 'Dashboard de Vendas da PBIDist', '2 h', '13', 'Ajude Frederico, gerente da PBIDist, a automatizar a análise de desempenho dos vendedores, criando um painel de controle eficiente que economiza tempo e aumenta a produtividade.', V),
            cs('vendas/iniciante/Desafio Toy & Play.webp', 'Desafio Toy & Play', '2 h', '2', 'Analise dados de brinquedos e jogos para identificar tendências de mercado e oportunidades de marketing no entretenimento infantil.', V),
            cs('vendas/iniciante/Desafio MR Bolos.webp', 'Desafio MR Bolos', '1 h', '2', 'Participe do desafio MR Bolos para analisar dados de vendas de uma confeitaria. Mostre sua capacidade de otimizar operações de pequenas empresas e adicione ao seu portfólio projetos de otimização.', V, 'Felipe Martins'),
            cs('vendas/intermediario/Carpinski - Infográfico Comercial.webp', 'Carpinski , Infográfico Comercial', '57 min', '4', 'Desenvolva um infográfico comercial para a Carpinski, destacando realizações e dados-chave com comunicação visual e storytelling.', V),
            cs('vendas/intermediario/Desafio Bitrix24.webp', 'Desafio Bitrix24', '2 h', '2', 'Implemente o Bitrix24 em uma empresa, personalizando-o para gerenciamento de projetos e colaboração.', V),
            cs('vendas/intermediario/Performance de Vendas.webp', 'Performance de Vendas', '2 h', '2', 'Avalie o desempenho das equipes de vendas, identifique tendências de mercado e recomende estratégias para impulsionar o crescimento.', V),
            cs('vendas/intermediario/Realizado vs Meta.webp', 'Realizado vs Meta', '2 h', '2', 'Compare os resultados realizados com as metas estabelecidas, analise os desvios e recomende estratégias para atingir os objetivos.', V),
            cs('vendas/intermediario/Vendas x Meta Conectando em SQL Server.webp', 'Vendas x Meta Conectando em SQL Server', '2 h', '2', 'Conecte dados de vendas ao SQL Server e faça análises avançadas: tendências de mercado, desempenho vs metas e estratégias de vendas.', V),
            cs('vendas/avancado/Análises Comerciais com Storytelling.webp', 'Análises Comerciais com Storytelling', '8 h', '5', 'Aprimore as estratégias de vendas de uma empresa de varejo, usando previsões avançadas para recomendar produtos e ações de marketing.', V),
            cs('vendas/avancado/Análise Comercial com Simulador de Metas.webp', 'Análise Comercial com Simulador de Metas', '1 h', '2', 'Ajude uma equipe de vendas a bater metas com um simulador que permite ajustar estratégias em tempo real.', V),
            cs('vendas/avancado/Varejo com Análises Avançadas da Loja Pinski.webp', 'Varejo com Análises Avançadas da Loja Pinski', '5 h', '3', 'Aprimore a operação de varejo da loja Pinski: identifique padrões de compra, segmente clientes e otimize o mix de produtos.', V),
            cs('../formacoes/aulas/f5/Projeto Final, Sistema de Recomendação.webp', 'Sistema de Recomendação', '9 h', '60', 'Ajude o gestor da Pinski Modas a superar o caos das planilhas: acompanhamento de metas mensais, desempenho da equipe e performance dos produtos.', V)
        ] },
        arh: { unit: 'Business Cases', projects: [
            cs('rh/iniciante/Dashboard de RH da Klog.webp', 'Dashboard de RH da Klog', '1 h', '7', 'Ajude Ana, analista de RH na Klog, a dar conta das demandas de relatórios mensais urgentes com um dashboard automatizado que acompanha os indicadores-chave e libera tempo pra análise estratégica.', R),
            cs('rh/iniciante/KPIs de Recursos Humanos (RH).webp', 'KPIs de Recursos Humanos', '2 h', '2', 'Explore KPIs de RH, medindo desempenho da equipe, satisfação do colaborador e eficiência dos processos em uma empresa real.', R),
            cs('rh/iniciante/Recursos Humanos com Análise de Turnover.webp', 'Recursos Humanos com Análise de Turnover', '2 h', '3', 'Analise o turnover de funcionários: identifique as principais causas de saída, avalie o impacto financeiro e recomende medidas de retenção.', R),
            cs('rh/intermediario/Análise de Dados para Recursos Humanos.webp', 'Análise de Dados para Recursos Humanos', '16 h', '71', 'Este treinamento cobre a aplicação de um relatório de People Analytics em RH. O projeto tem como principal meta a criação de painéis para avaliar desempenho, absenteísmo e turnover.', R, 'Jonathan Borges'),
            cs('rh/avancado/People Analytics com Análises Avançadas.webp', 'People Analytics com Análises Avançadas', '3 h', '2', 'Use análises avançadas de RH para insights sobre recrutamento, retenção, desenvolvimento e gestão de talentos.', R)
        ] }
    };
})();
