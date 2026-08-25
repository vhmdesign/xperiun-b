(function () {
    /* Perfil/menu do topo vêm do menu-topo.js (compartilhado). */
    var p0 = new URLSearchParams(location.search);

    var VIDEO_IDS = ['wHg93SLy0qw', '6SP3jzRs7GA', 'uYQsFKZ3Z2k', 'q6czNzOy23M'];
    var TITULOS = ['Alguém vai ser referência em IA', 'Ecossistema Claude', 'Automatize com o Claude Cowork', 'Dominando Claude Code'];
    var DATAS = ['', '21/07', '22/07', '23/07'];   /* data de cada aula (aula 0 é intro, sem data) */

    /* Progresso persistido: índices das aulas concluídas no localStorage (o progresso deriva delas). */
    var STORE_KEY = 'xp-imersao-concluidas';
    var CONCLUIDAS = [];
    try { CONCLUIDAS = (JSON.parse(localStorage.getItem(STORE_KEY) || '[]') || []).filter(function (n) { return typeof n === 'number'; }); } catch (_) {}
    /* ?cert=full → simula TODAS as aulas concluídas (em memória, sem persistir) pra testar o fluxo completo. */
    if (p0.get('cert') === 'full') { CONCLUIDAS = VIDEO_IDS.map(function (_, i) { return i; }); }
    function salvarConcluidas() { try { localStorage.setItem(STORE_KEY, JSON.stringify(CONCLUIDAS)); } catch (_) {} }
    function marcarConcluida(idx) {
        if (idx >= 0 && idx < VIDEO_IDS.length && CONCLUIDAS.indexOf(idx) === -1) { CONCLUIDAS.push(idx); salvarConcluidas(); }
    }
    function descartarConcluida(idx) {
        var p = CONCLUIDAS.indexOf(idx);
        if (p > -1) { CONCLUIDAS.splice(p, 1); salvarConcluidas(); }
    }
    var TOTAL = VIDEO_IDS.length;
    /* Chat ao vivo: embed_domain precisa ser o host que serve a página (não funciona em file://). */
    function ytChat(id) { return id ? 'https://www.youtube.com/live_chat?v=' + id + '&embed_domain=' + location.hostname : ''; }
    var DOWNLOAD_URL = '#';   /* TROCAR: link real do material de apoio */

    /* Chat ao vivo: só aulas 1..3, existe até o dia da live (some depois); aula 0 nunca. */
    var LIVE_DATES = [null, '2026-07-21', '2026-07-22', '2026-07-23'];
    var hojeBR = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    var forceChat = p0.has('chat');   /* ?chat = força o chat (teste) */
    function chatExisteEm(i) { return forceChat || (!!LIVE_DATES[i] && hojeBR <= LIVE_DATES[i]); }

    /* Concluir aula: só a partir do dia da aula às 20:30 (Brasília), quando ela "existe inteira".
       Aula 0 (intro, pré-gravada) pode concluir a qualquer momento (sem gate). */
    var COMPLETE_TIMES = [null, '2026-07-21T20:30', '2026-07-22T20:30', '2026-07-23T20:30'];
    function agoraBrasilia() {
        var o = {};
        new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
        }).formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
        return o.year + '-' + o.month + '-' + o.day + 'T' + o.hour + ':' + o.minute;
    }
    function podeConcluir(i) { return !COMPLETE_TIMES[i] || agoraBrasilia() >= COMPLETE_TIMES[i]; }

    /* Aula ativa inicial: ?aula=N (deep-link dos cards) > a live de hoje > a primeira. */
    var ATIVA_INI = 0;
    var pAula = parseInt(p0.get('aula'), 10);
    if (!isNaN(pAula) && pAula >= 0 && pAula < TOTAL) {
        ATIVA_INI = pAula;
    } else {
        for (var di = 1; di < TOTAL; di++) { if (LIVE_DATES[di] === hojeBR) { ATIVA_INI = di; break; } }
    }

    var modules = [
        {
            eyebrow: 'Aulas', name: 'Imersão Claude & IA para Negócios', open: !chatExisteEm(ATIVA_INI), active: ATIVA_INI, done: [],
            lessons: TITULOS.map(function (nome, i) { return { nome: nome, id: VIDEO_IDS[i], idx: i }; })
        },
        {
            eyebrow: 'Materiais', name: 'Material de apoio', open: false,
            downloads: [{ nome: 'Fazer Download', href: DOWNLOAD_URL }]
        }
    ];

    var host = document.getElementById('aula-modules');

    modules.forEach(function (mod) {
        var done = mod.done || [];
        var temLessons = !!(mod.lessons && mod.lessons.length);

        var sec = document.createElement('section');
        sec.className = 'aula-mod' + (mod.open ? ' is-open' : '');

        var head = document.createElement('button');
        head.type = 'button'; head.className = 'aula-mod-head';
        head.setAttribute('aria-expanded', String(!!mod.open));
        head.innerHTML =
            '<span class="material-symbols-outlined aula-mod-folder">' + (mod.open ? 'folder_open' : 'folder') + '</span>' +
            '<span class="aula-mod-titles"><span class="aula-mod-eyebrow-row">' +
                '<span class="aula-mod-eyebrow">' + mod.eyebrow + '</span>' +
                (temLessons ? '<span class="aula-mod-count" data-mod-count>0/0</span>' : '') +
            '</span><span class="aula-mod-name">' + mod.name + '</span></span>';

        var list = document.createElement('div'); list.className = 'aula-lessons';
        var inner = document.createElement('div'); inner.className = 'aula-lessons-inner';

        if (temLessons) {
            mod.lessons.forEach(function (aula, i) {
                var li = document.createElement('div');
                li.className = 'aula-lesson';
                if (CONCLUIDAS.indexOf(aula.idx) > -1) li.className += ' is-done';   /* restaura do localStorage */
                if (i === mod.active) li.className += ' is-active';
                if (aula.id) { li.dataset.idx = aula.idx; }
                var data = DATAS[aula.idx];
                var ehHoje = !!LIVE_DATES[aula.idx] && LIVE_DATES[aula.idx] === hojeBR;   /* dia da aula */
                li.innerHTML =
                    '<span class="aula-lesson-mark"><span class="material-symbols-outlined">check</span></span>' +
                    '<span class="aula-lesson-name">' + aula.nome + '</span>' +
                    (data ? '<span class="aula-lesson-date' + (ehHoje ? ' is-hoje' : '') + '">' + data + '</span>' : '');
                inner.appendChild(li);
            });
        }

        (mod.downloads || []).forEach(function (d) {
            var dl = document.createElement('a');
            dl.className = 'aula-download'; dl.href = d.href; dl.target = '_blank'; dl.rel = 'noopener';
            dl.innerHTML =
                '<span class="aula-download-btn"><span class="material-symbols-outlined">download</span></span>' +
                '<span class="aula-lesson-name">' + d.nome + '</span>';
            inner.appendChild(dl);
        });

        list.appendChild(inner); sec.appendChild(head); sec.appendChild(list); host.appendChild(sec);
    });

    /* Certificado é a última opção (depois de Aulas/Materiais). */
    var certSec = host.querySelector('[data-section="cert"]');
    if (certSec) host.appendChild(certSec);

    /* Sanfona: só uma seção aberta por vez. */
    function setModulo(mod, aberto) {
        mod.classList.toggle('is-open', aberto);
        mod.querySelector('.aula-mod-head').setAttribute('aria-expanded', String(aberto));
        mod.querySelector('.aula-mod-folder').textContent = aberto ? 'folder_open' : 'folder';
    }
    function abrirModulo(mod) {
        host.querySelectorAll('.aula-mod.is-open').forEach(function (m) { if (m !== mod) setModulo(m, false); });
        setModulo(mod, true);
    }

    host.addEventListener('click', function (e) {
        var head = e.target.closest('.aula-mod-head');
        if (head) {
            var mod = head.closest('.aula-mod');
            if (mod.classList.contains('is-open')) setModulo(mod, false);
            else abrirModulo(mod);
            return;
        }
        if (e.target.closest('.aula-download')) return;
        var lesson = e.target.closest('.aula-lesson');
        if (lesson) navegarPara(lesson);
    });

    var nextBtn = document.querySelector('[data-next]');
    var prevBtn = document.querySelector('[data-prev]');
    var voltarBtn = document.querySelector('[data-voltar]');
    var concluirBtn = document.querySelector('[data-concluir-aula]');
    var concluirLabel = document.querySelector('[data-concluir-label]');
    var modal = document.getElementById('aula-modal');
    var alvo = null;

    function pedirConclusao(lesson) {
        alvo = lesson;
        /* progresso projetado se clicar "Sim" (aula atual ainda não concluída → +1). */
        var feitas = host.querySelectorAll('.aula-lesson.is-done').length;
        var projetado = Math.min(feitas + 1, TOTAL);
        var pct = TOTAL ? Math.round(projetado / TOTAL * 100) : 0;
        var fill = document.querySelector('[data-modal-progress-fill]');
        if (fill) fill.style.width = pct + '%';
        var lbl = document.querySelector('[data-modal-progress-label]');
        if (lbl) lbl.textContent = projetado + ' de ' + TOTAL + ' aulas concluídas (' + pct + '%)';
        modal.classList.add('is-open');
    }
    function fecharModal() { modal.classList.remove('is-open'); alvo = null; }

    /* Ao trocar de aula: se a atual já pode ser concluída (dia+20:30) e ainda não foi, pergunta; senão vai direto. */
    function navegarPara(lesson) {
        if (!lesson || lesson.classList.contains('is-active')) return;
        var atual = host.querySelector('.aula-lesson.is-active');
        var atualIdx = atual ? parseInt(atual.dataset.idx || '0', 10) : 0;
        if (!atual || atual.classList.contains('is-done') || !podeConcluir(atualIdx)) irPara(lesson, false);
        else pedirConclusao(lesson);
    }

    function irPara(lesson, marcarConcluido) {
        if (!lesson) return;
        var atual = host.querySelector('.aula-lesson.is-active');
        if (atual && atual !== lesson) {
            var aidx = parseInt(atual.dataset.idx || '0', 10);
            atual.classList.remove('is-active');
            if (marcarConcluido && podeConcluir(aidx)) { atual.classList.add('is-done'); marcarConcluida(aidx); }   /* respeita o gate de 20:30 + persiste */
        }
        lesson.classList.add('is-active');
        var mod = lesson.closest('.aula-mod');
        if (mod && !mod.classList.contains('is-open')) abrirModulo(mod);
        lesson.scrollIntoView({ block: 'nearest' });
        var idx = parseInt(lesson.dataset.idx || '0', 10);
        carregarVideo(lesson);
        atualizarChat(idx);
        atualizarUrl(idx);
        atualizarProgresso();
        atualizarNav();
    }

    /* Mantém ?aula=N na URL em sincronia com a aula ativa (link pronto pra compartilhar). */
    function atualizarUrl(idx) {
        try {
            var url = new URL(location.href);
            url.searchParams.set('aula', idx);
            history.replaceState(null, '', url);
        } catch (_) {}
    }

    /* ── Player YouTube (IFrame API) + rastreio da % assistida por aula ── */
    var videoLoader = document.querySelector('[data-video-loader]');
    function mostrarLoader() { if (videoLoader) videoLoader.classList.add('is-loading'); }
    function ocultarLoader() { if (videoLoader) videoLoader.classList.remove('is-loading'); }

    /* Progresso do vídeo (fração assistida por aula), persistido no localStorage.
       Lives não têm duração fixa: só grava algo útil em vídeo gravado (VOD). */
    var PROG_KEY = 'xp-imersao-video-progresso';
    var VIDEO_PROG = {};
    try { VIDEO_PROG = JSON.parse(localStorage.getItem(PROG_KEY) || '{}') || {}; } catch (_) {}
    function salvarProg(idx, frac) {
        if (!(frac > 0)) return;
        frac = Math.min(frac, 1);
        if (frac > (VIDEO_PROG[idx] || 0)) { VIDEO_PROG[idx] = frac; try { localStorage.setItem(PROG_KEY, JSON.stringify(VIDEO_PROG)); } catch (_) {} }
    }

    var player = null, playerReady = false, videoAtivoIdx = ATIVA_INI, pollTimer = null, pendingIdx = null;

    window.onYouTubeIframeAPIReady = function () {
        player = new YT.Player('aula-player', {
            width: '100%', height: '100%',
            playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
            events: {
                onReady: function () {
                    playerReady = true;
                    var idx = (pendingIdx != null) ? pendingIdx : videoAtivoIdx;
                    videoAtivoIdx = idx; pendingIdx = null;
                    if (VIDEO_IDS[idx]) player.cueVideoById(VIDEO_IDS[idx]);
                    ocultarLoader();
                },
                onStateChange: onEstadoVideo
            }
        });
    };

    function onEstadoVideo(e) {
        var S = YT.PlayerState;
        if (e.data === S.PLAYING) { ocultarLoader(); iniciarPoll(); }
        else if (e.data === S.BUFFERING) { mostrarLoader(); }
        else if (e.data === S.CUED) { ocultarLoader(); }
        else { pararPoll(); registrarProg(); ocultarLoader(); }
        if (e.data === S.ENDED) {
            salvarProg(videoAtivoIdx, 1);
            var prox = proximaAula();
            if (prox) irPara(prox, false);   /* avança sem concluir (conclusão é explícita no botão) */
        }
    }
    function iniciarPoll() { pararPoll(); pollTimer = setInterval(registrarProg, 1000); }
    function pararPoll() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }
    function registrarProg() {
        if (!playerReady || !player || !player.getDuration) return;
        var dur = player.getDuration();
        if (dur > 0) salvarProg(videoAtivoIdx, player.getCurrentTime() / dur);
    }

    function carregarVideo(lesson) {
        if (!lesson) return;
        registrarProg();   /* salva o progresso do vídeo atual antes de trocar */
        pararPoll();
        var idx = parseInt(lesson.dataset.idx || '0', 10);
        videoAtivoIdx = idx;
        mostrarLoader();
        if (playerReady && player.cueVideoById) player.cueVideoById(VIDEO_IDS[idx]);
        else pendingIdx = idx;   /* player ainda não pronto → carrega no onReady */
    }

    /* Chat ao vivo da aula ativa: mostra/esconde a seção e atualiza o src. */
    function atualizarChat(idx) {
        var chatSec = host.querySelector('[data-section="chat"]');
        if (!chatSec) return;
        if (chatExisteEm(idx)) {
            chatSec.style.display = '';
            var cf = chatSec.querySelector('.aula-chat-frame');
            var src = ytChat(VIDEO_IDS[idx]);
            if (cf && cf.getAttribute('src') !== src) cf.src = src;
        } else {
            if (chatSec.classList.contains('is-open')) setModulo(chatSec, false);
            chatSec.style.display = 'none';
        }
    }

    function proximaAula() {
        var todas = Array.prototype.slice.call(host.querySelectorAll('.aula-lesson'));
        var atual = host.querySelector('.aula-lesson.is-active');
        return atual ? todas[todas.indexOf(atual) + 1] : todas[0];
    }
    function anteriorAula() {
        var todas = Array.prototype.slice.call(host.querySelectorAll('.aula-lesson'));
        var atual = host.querySelector('.aula-lesson.is-active');
        var i = atual ? todas.indexOf(atual) : 0;
        return i > 0 ? todas[i - 1] : null;
    }

    function atualizarNav() {
        var temPrev = !!anteriorAula();
        if (prevBtn) prevBtn.style.display = temPrev ? '' : 'none';
        if (voltarBtn) voltarBtn.style.display = temPrev ? 'none' : '';   /* sem aula anterior (1ª) → "Voltar" */
        if (nextBtn) nextBtn.style.display = proximaAula() ? '' : 'none';
        atualizarConcluirBtn();
    }
    /* "Concluir aula": ativo só a partir do dia da aula às 20:30 (e some quando já concluída). */
    function atualizarConcluirBtn() {
        if (!concluirBtn) return;
        var atual = host.querySelector('.aula-lesson.is-active');
        var idx = atual ? parseInt(atual.dataset.idx || '0', 10) : 0;
        var done = !!(atual && atual.classList.contains('is-done'));
        concluirBtn.disabled = !done && !podeConcluir(idx);   /* concluída fica ativa pra poder cancelar */
        var icone = concluirBtn.querySelector('.material-symbols-outlined');
        if (icone) icone.textContent = done ? 'close' : 'how_to_reg';
        if (concluirLabel) concluirLabel.textContent = done ? 'Cancelar' : 'Concluir aula';
        concluirBtn.setAttribute('data-emphasis', done ? 'subtle' : 'medium');   /* concluída = menor ênfase */
    }

    function atualizarProgresso() {
        var totalGeral = 0, feitasGeral = 0;
        host.querySelectorAll('.aula-mod').forEach(function (mod) {
            var lessons = mod.querySelectorAll('.aula-lesson');
            var feitas = mod.querySelectorAll('.aula-lesson.is-done').length;
            totalGeral += lessons.length;
            feitasGeral += feitas;
            var cnt = mod.querySelector('[data-mod-count]');
            if (cnt) {
                cnt.textContent = feitas + '/' + lessons.length;
                cnt.classList.toggle('is-complete', lessons.length > 0 && feitas === lessons.length);
            }
        });
        var pct = totalGeral ? Math.round(feitasGeral / totalGeral * 100) : 0;
        /* atualiza todas as instâncias (sanfona + popup Certificado). */
        document.querySelectorAll('[data-progress-count]').forEach(function (el) { el.textContent = feitasGeral + '/' + totalGeral; });
        document.querySelectorAll('[data-progress-pct]').forEach(function (el) { el.textContent = pct + '%'; });
        document.querySelectorAll('[data-progress-ring]').forEach(function (el) { el.style.strokeDashoffset = (100 - pct); });
        document.querySelectorAll('.aula-progress').forEach(function (el) { el.classList.toggle('is-complete', pct === 100); });
    }

    /* Scrim de scroll: indica que há mais conteúdo abaixo na sanfona. */
    var aulaRight = document.querySelector('.aula-right');
    function atualizarScrim() {
        var temScroll = host.scrollHeight > host.clientHeight + 1;
        var noFim = host.scrollHeight - host.scrollTop - host.clientHeight <= 1;
        if (aulaRight) aulaRight.classList.toggle('has-scrim', temScroll && !noFim);
    }
    host.addEventListener('scroll', atualizarScrim);
    host.addEventListener('transitionend', atualizarScrim);   /* abrir/fechar sanfona muda a altura */
    window.addEventListener('resize', atualizarScrim);

    /* Estado inicial: vídeo + chat da aula ativa; abre o chat se existir. */
    var chatSecIni = host.querySelector('[data-section="chat"]');
    carregarVideo(host.querySelector('.aula-lesson.is-active'));
    atualizarChat(ATIVA_INI);
    atualizarUrl(ATIVA_INI);
    if (chatSecIni && chatExisteEm(ATIVA_INI)) setModulo(chatSecIni, true);
    atualizarProgresso();
    atualizarNav();
    atualizarScrim();

    if (nextBtn) nextBtn.addEventListener('click', function () { navegarPara(proximaAula()); });
    if (prevBtn) prevBtn.addEventListener('click', function () { navegarPara(anteriorAula()); });
    if (concluirBtn) concluirBtn.addEventListener('click', function () {
        var atual = host.querySelector('.aula-lesson.is-active');
        if (!atual) return;
        var idx = parseInt(atual.dataset.idx || '0', 10);
        if (atual.classList.contains('is-done')) {
            atual.classList.remove('is-done'); descartarConcluida(idx);   /* clicar de novo cancela */
        } else {
            if (!podeConcluir(idx)) return;
            atual.classList.add('is-done'); marcarConcluida(idx);
        }
        atualizarProgresso();
        atualizarNav();
    });
    if (modal) {
        modal.querySelector('[data-modal-yes]').addEventListener('click', function () { var l = alvo; fecharModal(); irPara(l, true); });
        modal.querySelector('[data-modal-no]').addEventListener('click', function () { var l = alvo; fecharModal(); irPara(l, false); });
        modal.addEventListener('click', function (e) { if (e.target === modal) fecharModal(); });
    }

    /* Botão "Acessar meu Certificado" (aparece na sanfona quando 100%): abre o popup Parabéns. */
    var btnAcessarCert = document.querySelector('[data-cert-acessar]');
    if (btnAcessarCert) btnAcessarCert.addEventListener('click', function () {
        if (window.XPCert && window.XPCert.abrir) window.XPCert.abrir();
    });

    /* Popup Certificado: só o fechar aqui (a abertura vem do menu-topo.js). */
    var modalCert = document.getElementById('aula-modal-certificado');
    if (modalCert) {
        var fecharCert = modalCert.querySelector('[data-cert-fechar]');
        if (fecharCert) fecharCert.addEventListener('click', function () { modalCert.classList.remove('is-open'); });
        modalCert.addEventListener('click', function (e) { if (e.target === modalCert) modalCert.classList.remove('is-open'); });
    }
})();
