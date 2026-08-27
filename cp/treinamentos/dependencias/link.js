/* ══════════════════════════════════════════════════════════════════════════
   Gerador do link do certificado (uso interno do treinador).

   Monta a URL que a página do aluno espera: ?curso=&diaInicio=&mesInicio=
   &diaFinal=&mesFinal=&anoInicio=&token=. O token sai do catálogo (cursos.js),
   então não tem como circular link com token errado.

   Treinamento e meses usam o dropdown do DS (.dropdown-group + .dropdown +
   .dropdown-options), controlado aqui pela classe is-open.

   Acesso: os tokens ficam cifrados no cofre.js e só são decifrados com as
   credenciais digitadas aqui (PBKDF2 + AES-GCM, ver cofre.js). Não existe
   comparação de senha no código nem token em claro pra alguém extrair; sem as
   credenciais, o gerador não tem o que colocar no link. Ainda assim, é uma
   página estática: dá pra tentar senhas offline, então a senha precisa ser boa
   e o ideal continua sendo trancar a pasta no servidor.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
    var XP = window.XPCert;                    /* catálogo compartilhado (cursos.js) */
    /* Base do link: domínio de produção fixo, não location.origin. Aberto em
       preview ou local, o link precisa continuar apontando pro site real. */
    var PAGINA = 'https://xperiun.com/cp/treinamentos/certificado/';
    var SECULO = '20';                         /* o ano é 20 + os dois dígitos do campo */
    var ALTURA_LISTA = 280;                    /* max-height da lista + folga (ver style.css) */

    var q = function (sel) { return document.querySelector(sel); };
    var val = function (sel) { return (q(sel).value || '').trim(); };

    var form = q('[data-link-form]');
    var saida = q('[data-link-saida]');
    var curso = null;
    var TOKENS = null;                         /* só em memória, enquanto a aba estiver aberta */

    /* ── Acesso ──────────────────────────────────────────────────────────────
       Nada de sessão salva: recarregou, pede as credenciais de novo (o token
       decifrado nunca encosta em storage). */
    function montarLogin() {
        var login = q('[data-login-form]');
        var botao = q('[data-login-entrar]');
        var erro = q('[data-login-erro]');
        var erros = 0;   /* tentativa pela tela vai ficando lenta (offline não dá pra impedir) */

        q('.cert-page').classList.add('is-bloqueado');
        q('.cert-badge-media').hidden = true;

        login.addEventListener('submit', function (e) {
            e.preventDefault();
            var rotulo = botao.textContent;
            botao.textContent = 'Entrando...';
            botao.disabled = true;
            erro.textContent = '';

            window.XPCofre.abrir(val('[data-login-usuario]'), val('[data-login-senha]'))
                .then(function (tokens) {
                    if (!tokens) {
                        erros++;
                        return new Promise(function (r) { setTimeout(r, Math.min(erros, 5) * 1000); })
                            .then(function () {
                                erro.textContent = 'Usuário ou senha inválidos.';
                                q('[data-login-senha]').value = '';
                                q('[data-login-senha]').focus();
                            });
                    }
                    erros = 0;
                    TOKENS = tokens;
                    abrirGerador();
                })
                ['catch'](function () {
                    erro.textContent = 'Abra esta página por HTTPS para entrar.';
                })
                .then(function () {
                    botao.textContent = rotulo;
                    botao.disabled = false;
                });
        });
    }

    function abrirGerador() {
        q('[data-login-form]').hidden = true;
        form.hidden = false;
        q('[data-titulo]').textContent = 'Link do certificado';
        q('[data-desc]').textContent = 'Escolha o treinamento e as datas da turma. O link já sai com o token e é o que o aluno usa pra emitir o certificado.';
        q('.cert-page').classList.remove('is-bloqueado');
        q('.cert-badge-media').hidden = false;
        montarTela();
    }

    /* ── Dropdown do DS ─────────────────────────────────────────────────────
       opcoes = [{ valor, rotulo }]. O valor escolhido fica em group.dataset.valor. */
    function montarDropdown(group, opcoes, aoEscolher) {
        var trigger = group.querySelector('.dropdown');
        var alvo = group.querySelector('[data-dd-valor]');
        var icone = group.querySelector('[data-dd-icone]');
        var lista = group.querySelector('.dropdown-options');

        lista.innerHTML = opcoes.map(function (o) {
            return '<li class="dropdown-option" role="option" data-valor="' + o.valor + '">' + o.rotulo + '</li>';
        }).join('');

        function abrir(sim) {
            group.classList.toggle('is-open', sim);
            trigger.setAttribute('aria-expanded', sim ? 'true' : 'false');
            icone.textContent = sim ? 'expand_less' : 'expand_more';
            /* Escolhe o lado com mais espaço (o DS já prevê o is-open-up). Se não
               couber inteira em nenhum dos dois, fica pra baixo e rola por dentro,
               que é o que o max-height do .dropdown-options garante. */
            if (sim) {
                var r = trigger.getBoundingClientRect();
                var abaixo = window.innerHeight - r.bottom, acima = r.top;
                group.classList.toggle('is-open-up', abaixo < ALTURA_LISTA && acima > abaixo);
            } else {
                group.classList.remove('is-open-up');
            }
        }
        function escolher(valor, rotulo) {
            group.dataset.valor = valor;
            alvo.textContent = rotulo;
            alvo.className = 'dropdown-value';
            alvo.setAttribute('data-dd-valor', '');
            group.classList.remove('is-error');
            abrir(false);
            if (aoEscolher) aoEscolher(valor);
        }

        trigger.addEventListener('click', function () { abrir(!group.classList.contains('is-open')); });
        trigger.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(!group.classList.contains('is-open')); }
            if (e.key === 'Escape') abrir(false);
        });
        lista.addEventListener('click', function (e) {
            var op = e.target.closest('.dropdown-option');
            if (op) escolher(op.getAttribute('data-valor'), op.textContent);
        });
        document.addEventListener('click', function (e) {
            if (!group.contains(e.target)) abrir(false);
        });

        return { escolher: escolher };
    }

    function montarTela() {
        /* Treinamento */
        var ddCurso = montarDropdown(
            q('[data-dd="curso"]'),
            XP.CURSOS.map(function (c) { return { valor: c.slug, rotulo: c.nome }; }),
            function (slug) { curso = XP.acharCurso(slug); aplicarCurso(); invalidar(); }
        );
        ddCurso.escolher(XP.CURSOS[0].slug, XP.CURSOS[0].nome);

        /* Meses */
        var meses = XP.MESES.map(function (m) { return { valor: m, rotulo: m }; });
        montarDropdown(q('[data-dd="mes-i"]'), meses, invalidar);
        montarDropdown(q('[data-dd="mes-f"]'), meses, invalidar);

        q('[data-link-base]').value = PAGINA;
        q('[data-link-ano]').value = String(new Date().getFullYear()).slice(-2);

        /* Dia e ano: só números; dia ganha zero à esquerda ao sair do campo */
        ['[data-link-dia-i]', '[data-link-dia-f]'].forEach(function (sel) {
            var el = q(sel);
            el.addEventListener('blur', function () { if (el.value.length === 1) el.value = '0' + el.value; });
        });
        Array.prototype.forEach.call(form.querySelectorAll('input'), function (el) {
            el.addEventListener('input', function () {
                if (el.hasAttribute('inputmode')) el.value = el.value.replace(/[^0-9]/g, '');
                el.closest('.input-group').classList.remove('is-error');
                invalidar();
            });
        });

        form.addEventListener('submit', function (e) { e.preventDefault(); gerar(); });
        q('[data-link-copiar]').addEventListener('click', copiar);

        aplicarCurso();
    }

    /* Badge do treinamento escolhido, com o mesmo movimento da página do aluno. */
    function aplicarCurso() {
        var stage = function (alt) {
            return '<div class="cert-badge-stage"><img src="' + curso.badge + '" alt="' + alt + '"></div>';
        };
        q('[data-cert-badge]').innerHTML =
            '<div class="cert-badge">' +
                stage('Badge de ' + curso.nome) +
                '<div class="cert-badge-reflexo" aria-hidden="true">' +
                    '<div class="cert-badge-flip">' + stage('') + '</div>' +
                '</div>' +
            '</div>';
    }

    function msg(erro, ok) {
        q('[data-link-erro]').textContent = erro || '';
        q('[data-link-ok]').textContent = ok || '';
    }
    /* Mudou algum campo: o link que está na tela não vale mais. */
    function invalidar() {
        saida.value = '';
        q('[data-link-saida-grupo]').hidden = true;
        q('[data-link-copiar]').disabled = true;
        msg('', '');
    }
    /* Ordena data dentro do ano: mês (índice) e dia viram um número só. */
    function emDias(mes, dia) {
        return XP.MESES.indexOf(mes) * 100 + parseInt(dia, 10);
    }
    /* 31 de abril, 30 de fevereiro: o Date corrige a data, então o dia muda. */
    function diaExiste(dia, mes, ano) {
        var d = new Date(parseInt(ano, 10), XP.MESES.indexOf(mes), parseInt(dia, 10));
        return d.getDate() === parseInt(dia, 10);
    }
    function marcar(el, erro) {
        var g = el.closest('.input-group') || el.closest('.dropdown-group');
        if (g) g.classList.toggle('is-error', !!erro);
    }

    function gerar() {
        var diaI = XP.dia(val('[data-link-dia-i]')), diaF = XP.dia(val('[data-link-dia-f]'));
        var mesI = q('[data-dd="mes-i"]').dataset.valor || '';
        var mesF = q('[data-dd="mes-f"]').dataset.valor || '';
        var ano = SECULO + val('[data-link-ano]');
        var base = val('[data-link-base]');

        marcar(q('[data-link-dia-i]'), !diaI);
        marcar(q('[data-link-dia-f]'), !diaF);
        q('[data-dd="mes-i"]').classList.toggle('is-error', !mesI);
        q('[data-dd="mes-f"]').classList.toggle('is-error', !mesF);
        marcar(q('[data-link-ano]'), !/^[0-9]{4}$/.test(ano));
        marcar(q('[data-link-base]'), !base);

        if (!diaI || !diaF || !mesI || !mesF || !/^[0-9]{4}$/.test(ano) || !base) {
            invalidar();
            msg('Preencha o treinamento, o período e o endereço da página.', '');
            return;
        }

        /* Dia que não existe no mês (31 de fevereiro e afins) */
        if (!diaExiste(diaI, mesI, ano)) {
            marcar(q('[data-link-dia-i]'), true);
            msg('O dia de início não existe em ' + mesI + '.', '');
            invalidar();
            return;
        }
        if (!diaExiste(diaF, mesF, ano)) {
            marcar(q('[data-link-dia-f]'), true);
            msg('O dia de término não existe em ' + mesF + '.', '');
            invalidar();
            return;
        }
        /* Término antes do início (mesmo ano pros dois) */
        if (emDias(mesF, diaF) < emDias(mesI, diaI)) {
            marcar(q('[data-link-dia-f]'), true);
            q('[data-dd="mes-f"]').classList.add('is-error');
            msg('O término não pode ser antes do início.', '');
            invalidar();
            return;
        }

        var p = new URLSearchParams();
        p.set('curso', curso.slug);
        p.set('diaInicio', diaI);
        p.set('mesInicio', mesI);
        p.set('diaFinal', diaF);
        p.set('mesFinal', mesF);
        p.set('anoInicio', ano);
        p.set('token', TOKENS[curso.slug]);

        saida.value = base + (base.indexOf('?') >= 0 ? '&' : '?') + p.toString();
        q('[data-link-saida-grupo]').hidden = false;
        q('[data-link-copiar]').disabled = false;
        msg('', 'Link gerado.');
    }

    function copiar() {
        if (!saida.value) return;
        var pronto = function () { msg('', 'Link copiado.'); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(saida.value).then(pronto)['catch'](selecionar);
        } else {
            selecionar();
        }
    }
    /* Sem clipboard (http, permissão negada): deixa o link selecionado pro Ctrl+C. */
    function selecionar() {
        saida.focus();
        saida.select();
        msg('Copie com Ctrl+C: o link já está selecionado.', '');
    }

    montarLogin();
})();
