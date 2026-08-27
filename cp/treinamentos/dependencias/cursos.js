/* ══════════════════════════════════════════════════════════════════════════
   Catálogo dos certificados, compartilhado pelas duas páginas: a do aluno
   (/cp/treinamentos/certificado/) e a que monta os links (/cp/treinamentos/gerar/).
   Fonte única: incluir ou mudar um certificado é só mexer aqui.
   ══════════════════════════════════════════════════════════════════════════ */
window.XPCert = (function () {
    var BASE = '/cp/treinamentos/dependencias/';
    var ARTE_BG = BASE + 'certificados/certificado-bg.png';   /* fundo comum aos 4 */
    var BADGES = BASE + 'badges/';

    /* O token NÃO fica aqui: o que fica é o SHA-256 dele, só pra página do
       aluno conferir o que veio na URL. O token em si mora cifrado no
       cofre.js e só sai de lá com as credenciais do gerador de links. */
    var TOKEN_HASH = '70d3338db84d96c70d3104e551ee6c6ebcfc0e38075fb46064f6ace25dc3417b';

    /* slug       : valor esperado em ?curso=
       arte       : fundo do certificado (PNG ou JPG; a página sai no tamanho dele)
       cores      : par Corporate (temp/generator.html), usado nas faixas
       badge      : PNG do badge, que entra no rodapé do certificado e no botão
       tokenHash  : SHA-256 do token do curso (o token em claro fica no cofre)
       linhaCurso : linha em bold, logo abaixo de "Ao mérito de:"
       fecho      : string (sem gênero) ou { m: ..., f: ... } (com gênero) */
    var CURSOS = [
        {
            slug: 'power-bi-avancado',
            nome: 'Power BI Avançado',
            arte: ARTE_BG,
            cores: { inicial: '#9664ff', final: '#6400c8' },
            badge: BADGES + 'badge-power-bi-avancado.png',
            tokenHash: TOKEN_HASH,
            linhaCurso: 'Conclusão do Treinamento de Power BI Avançado com carga horária de 16 horas,',
            fecho: {
                m: ', sendo reconhecido como um Power BI Specialist.',
                f: ', sendo reconhecida como uma Power BI Specialist.'
            }
        },
        {
            slug: 'power-bi-negocios',
            nome: 'Power BI para Negócios',
            arte: ARTE_BG,
            cores: { inicial: '#ffc800', final: '#e19632' },
            badge: BADGES + 'badge-power-bi-negocios.png',
            tokenHash: TOKEN_HASH,
            linhaCurso: 'Conclusão do Treinamento de Power BI para Negócios com carga horária de 16 horas,',
            fecho: ', atingindo o nível Power BI Fundamentals.'
        },
        {
            slug: 'governanca-power-bi',
            nome: 'Governança em Power BI',
            arte: ARTE_BG,
            cores: { inicial: '#ff6496', final: '#961932' },
            badge: BADGES + 'badge-governanca-power-bi.png',
            tokenHash: TOKEN_HASH,
            linhaCurso: 'Conclusão do Treinamento de Governança em Power BI com carga horária de 12 horas,',
            fecho: ', atingindo o nível Power BI Service Architect.'
        },
        {
            slug: 'data-storytelling',
            nome: 'Power BI Data Storytelling',
            arte: ARTE_BG,
            cores: { inicial: '#64c8ff', final: '#3264ff' },
            badge: BADGES + 'badge-data-storytelling.png',
            tokenHash: TOKEN_HASH,
            linhaCurso: 'Conclusão do Treinamento de Power BI Data Storytelling com carga horária de 16 horas,',
            fecho: {
                m: ', sendo reconhecido como um Data Storytelling Specialist.',
                f: ', sendo reconhecida como uma Data Storytelling Specialist.'
            }
        }
    ];

    var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    function acharCurso(slug) {
        var i;
        for (i = 0; i < CURSOS.length; i++) if (CURSOS[i].slug === slug) return CURSOS[i];
        return null;
    }
    /* Dia: 1 ou 2 dígitos, sempre com zero à esquerda. */
    function dia(valor) {
        var v = String(valor || '').trim();
        if (!/^[0-9]{1,2}$/.test(v)) return '';
        var n = parseInt(v, 10);
        return (n >= 1 && n <= 31) ? ('0' + n).slice(-2) : '';
    }
    /* Mês por extenso ("agosto", "Agosto") ou número ("8", "08"). */
    function mes(valor) {
        var v = String(valor || '').trim().toLowerCase(), i = MESES.indexOf(v);
        if (i < 0 && /^[0-9]{1,2}$/.test(v)) i = parseInt(v, 10) - 1;
        return (i >= 0 && i < 12) ? MESES[i] : '';
    }
    function temGenero(c) { return typeof c.fecho === 'object'; }

    /* Confere o token da URL contra o hash do curso, sem nunca guardar o token
       em claro no site. Resolve true/false; rejeita se não houver WebCrypto
       (contexto não seguro, ou seja, http fora de localhost). */
    function conferirToken(token, curso) {
        if (!window.crypto || !crypto.subtle) return Promise.reject(new Error('sem-crypto'));
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(token || '')))
            .then(function (buf) {
                var b = new Uint8Array(buf), hex = '', i;
                for (i = 0; i < b.length; i++) hex += ('0' + b[i].toString(16)).slice(-2);
                return hex === curso.tokenHash;
            });
    }

    return {
        BASE: BASE, ARTE_BG: ARTE_BG, BADGES: BADGES,
        CURSOS: CURSOS, MESES: MESES,
        acharCurso: acharCurso, dia: dia, mes: mes, temGenero: temGenero,
        conferirToken: conferirToken
    };
})();
