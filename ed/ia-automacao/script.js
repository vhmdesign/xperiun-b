/* ══════════════════════════════════════════════════════════════════════
   /ed/ia-automacao/script.js

   Só a lógica que não existe em nenhum lugar do site: os dois carrosséis
   filtráveis e o roteamento de clique pra cada popup.

   O que vem de fora (carregado antes, no index.html):
     formacoes/script.js      reveal de títulos, hero, depoimentos, FAQ,
                              mini-carrossel da oferta
     business-cases/script.js objeto AREAS com os 41 Business Cases
     areas/pasta.js           window.XpFolder, o lightbox dos cases
     dados.js                 FORMACOES + CURSOS (47 cursos)

   O modal de curso é o .course-modal de formacoes/style.css, mas a
   abertura é feita AQUI por delegação: os cards nascem depois do load,
   então o binding por card do formacoes/script.js não os alcança (e por
   isso também não há listener duplicado).
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var PRECO_F6 = 'R$ 497';
    var PRECO_FC = 'R$ 1.497';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function abrir(nome) {
        if (window.openPopup) window.openPopup(nome);
    }

    /* ══════════════════════════════════════════════════════════════════
       Carrossel genérico: setas + estado de disabled conforme o scroll.
       Usado pelos dois tracks pra a página falar um só idioma.
       ══════════════════════════════════════════════════════════════════ */
    function ligarCarrossel(track, btnPrev, btnNext) {
        if (!track) return { reset: function () {} };

        function passo() {
            var card = track.querySelector('.course-card');
            var gap = parseFloat(getComputedStyle(track).columnGap) || 32;
            return card ? card.getBoundingClientRect().width + gap : 0;
        }
        function atualizar() {
            var max = track.scrollWidth - track.clientWidth - 2;
            if (btnPrev) btnPrev.disabled = track.scrollLeft <= 2;
            if (btnNext) btnNext.disabled = track.scrollLeft >= max;
        }
        function mover(dir) {
            var s = passo();
            if (s) track.scrollBy({ left: s * dir, behavior: 'smooth' });
        }
        if (btnPrev) btnPrev.addEventListener('click', function () { mover(-1); });
        if (btnNext) btnNext.addEventListener('click', function () { mover(1); });
        track.addEventListener('scroll', atualizar, { passive: true });
        window.addEventListener('resize', atualizar);

        return {
            reset: function () {
                track.scrollLeft = 0;
                requestAnimationFrame(atualizar);
            }
        };
    }

    /* Botão de filtro: sem componente de chip no DS, então reusa o .btn.
       subtle = inativo, neutral = ativo. */
    function marcarAtivo(container, valor) {
        container.querySelectorAll('.btn[data-filtro]').forEach(function (b) {
            var on = b.dataset.filtro === valor;
            b.setAttribute('data-emphasis', on ? 'neutral' : 'subtle');
            b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
    }

    /* ══════════════════════════════════════════════════════════════════
       04, CATÁLOGO: os 47 cursos das 7 formações
       ══════════════════════════════════════════════════════════════════ */
    (function catalogo() {
        var track = document.getElementById('cat-track');
        var chips = document.getElementById('cat-chips');
        var aviso = document.getElementById('cat-aviso');
        var avisoTxt = document.getElementById('cat-aviso-texto');
        if (!track || !chips || typeof CURSOS === 'undefined') return;

        var porId = {};
        FORMACOES.forEach(function (f) { porId[f.id] = f; });

        var carrossel = ligarCarrossel(
            track,
            document.getElementById('cat-prev'),
            document.getElementById('cat-next')
        );

        /* ── Chips: F6 primeiro (é o produto de entrada), depois "todas" ── */
        var html = '';
        html += '<button class="btn" data-size="s" data-emphasis="neutral" role="tab"'
             +  ' data-filtro="f6" aria-selected="true">Formação 6, IA e Automação'
             +  ' <span class="chip-count">(' + porId.f6.cursos + ')</span></button>';
        html += '<button class="btn" data-size="s" data-emphasis="subtle" role="tab"'
             +  ' data-filtro="todas" aria-selected="false">Todas as formações'
             +  ' <span class="chip-count">(' + CURSOS.length + ')</span></button>';
        FORMACOES.forEach(function (f) {
            if (f.id === 'f6') return;
            html += '<button class="btn" data-size="s" data-emphasis="subtle" role="tab"'
                 +  ' data-filtro="' + f.id + '" aria-selected="false">'
                 +  f.id.toUpperCase() + ' ' + esc(f.curto)
                 +  ' <span class="chip-count">(' + f.cursos + ')</span></button>';
        });
        chips.innerHTML = html;

        /* ── Card de curso: mesmo markup do .course-card das formações, pra
             o CSS e o modal funcionarem sem adaptação. A etiqueta de
             inclusão é o que carrega o funil dentro do carrossel. ── */
        function cardHTML(c) {
            var naF6 = c.f === 'f6';
            var etiqueta = naF6
                ? '<span class="tag-status course-card-inclusao" data-semantic="success" data-size="s">Incluso nos ' + PRECO_F6 + '</span>'
                : '<span class="tag-status course-card-inclusao" data-semantic="neutral" data-size="s">Completa</span>';
            return '<article class="course-card" tabindex="0" role="button"'
                +  ' data-f="' + esc(c.f) + '"'
                +  ' data-aulas="' + esc(c.aulas) + '"'
                +  ' data-duracao="' + esc(c.dur) + '"'
                +  ' data-professor="' + esc(c.prof) + '">'
                +  '<span class="course-card-bg" style="background-image: url(\'' + esc(c.img) + '\');"></span>'
                +  '<div class="course-card-container">'
                +  '<div class="course-card-text">'
                +  '<div class="course-card-tags">'
                +  '<span class="tag-status" data-semantic="neutral" data-size="s">' + esc(c.dur) + '</span>'
                +  '<span class="tag-status" data-semantic="neutral" data-size="s">' + esc(c.prof) + '</span>'
                +  etiqueta
                +  '</div>'
                +  '<h3 class="course-card-title">' + esc(c.titulo) + '</h3>'
                +  '<p class="course-card-desc">' + esc(c.desc) + '</p>'
                +  '</div>'
                +  '<span class="material-symbols-outlined course-card-arrow">arrow_insert</span>'
                +  '</div></article>';
        }

        function render(filtro) {
            var lista = filtro === 'todas'
                ? CURSOS
                : CURSOS.filter(function (c) { return c.f === filtro; });
            track.innerHTML = lista.map(cardHTML).join('');

            /* Explorar o catálogo É o argumento de upgrade: fora da F6, a
               faixa aparece dizendo de onde aquele curso vem. */
            if (filtro === 'f6') {
                aviso.hidden = true;
            } else {
                var fora = CURSOS.filter(function (c) { return c.f !== 'f6'; }).length;
                avisoTxt.textContent = filtro === 'todas'
                    ? fora + ' destes ' + CURSOS.length + ' cursos vêm na Xperiun Completa, ' + PRECO_FC + ' vitalício.'
                    : 'Os ' + porId[filtro].cursos + ' cursos da formação ' + porId[filtro].nome
                      + ' vêm na Xperiun Completa, ' + PRECO_FC + ' vitalício.';
                aviso.hidden = false;
            }
            carrossel.reset();
        }

        chips.addEventListener('click', function (e) {
            var btn = e.target.closest('.btn[data-filtro]');
            if (!btn) return;
            marcarAtivo(chips, btn.dataset.filtro);
            render(btn.dataset.filtro);
        });

        render('f6');

        /* ── Modal de curso, por delegação ── */
        var modal = document.getElementById('courseModal');
        if (!modal) return;
        var elMedia = document.getElementById('courseModalMedia');
        var elTitulo = document.getElementById('courseModalTitle');
        var elForm = document.getElementById('courseModalFormacao');
        var elDur = document.getElementById('courseModalDuracao');
        var elAulas = document.getElementById('courseModalAulas');
        var elProf = document.getElementById('courseModalProfessor');
        var elDesc = document.getElementById('courseModalDesc');
        var elCta = document.getElementById('courseModalCta');

        function abrirModal(card) {
            var bg = card.querySelector('.course-card-bg');
            var titulo = card.querySelector('.course-card-title');
            var desc = card.querySelector('.course-card-desc');
            var f = porId[card.dataset.f];

            elMedia.style.backgroundImage = bg ? getComputedStyle(bg).backgroundImage : '';
            elTitulo.textContent = titulo ? titulo.textContent : '';
            elForm.textContent = f ? f.nome : '';
            elDur.textContent = card.dataset.duracao || '';
            elAulas.textContent = card.dataset.aulas || '-';
            elProf.textContent = card.dataset.professor || '';
            elDesc.textContent = desc ? desc.textContent : '';

            /* O CTA muda conforme onde o curso está: dentro da F6 vende os
               497, fora dela vende a Completa. */
            if (card.dataset.f === 'f6') {
                elCta.innerHTML =
                    '<button class="btn" data-size="s" data-emphasis="neutral" data-cta="f6">Garantir a Formação por ' + PRECO_F6 + '</button>'
                  + '<button class="btn" data-size="s" data-emphasis="subtle" data-cta="fc">Ver a Xperiun Completa</button>';
            } else {
                elCta.innerHTML =
                    '<button class="btn" data-size="s" data-emphasis="medium-core" data-cta="fc">Quero a Xperiun Completa, ' + PRECO_FC + '</button>'
                  + '<p class="course-modal-cta-nota">Este curso não entra na oferta de ' + PRECO_F6 + '.</p>';
            }

            modal.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        }
        function fecharModal() {
            modal.classList.remove('is-open');
            document.body.style.overflow = '';
        }

        track.addEventListener('click', function (e) {
            var card = e.target.closest('.course-card');
            if (card) abrirModal(card);
        });
        track.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var card = e.target.closest('.course-card');
            if (!card) return;
            e.preventDefault();
            abrirModal(card);
        });
        modal.addEventListener('click', function (e) {
            if (e.target.closest('[data-close]')) { fecharModal(); return; }
            var cta = e.target.closest('[data-cta]');
            if (cta) {
                fecharModal();
                abrir(cta.dataset.cta === 'fc' ? 'popup-form-fc' : 'popup-form-f6');
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('is-open')) fecharModal();
        });
    })();

    /* ══════════════════════════════════════════════════════════════════
       05, BUSINESS CASES: os 41 cases, popup pelo XpFolder
       ══════════════════════════════════════════════════════════════════ */
    (function cases() {
        var track = document.getElementById('cases-track');
        var chips = document.getElementById('cases-chips');
        if (!track || !chips || typeof AREAS === 'undefined') return;

        /* Ordem por volume: a área mais rica aparece primeiro. */
        var AREA = [
            { id: 'av',  nome: 'Vendas' },
            { id: 'af',  nome: 'Financeiro' },
            { id: 'ad',  nome: 'Diversos' },
            { id: 'arh', nome: 'Recursos Humanos' },
            { id: 'al',  nome: 'Logística' }
        ].filter(function (a) { return AREAS[a.id] && AREAS[a.id].length; });

        var total = AREA.reduce(function (n, a) { return n + AREAS[a.id].length; }, 0);

        var carrossel = ligarCarrossel(
            track,
            document.getElementById('cases-prev'),
            document.getElementById('cases-next')
        );

        var html = '<button class="btn" data-size="s" data-emphasis="neutral" role="tab"'
                 + ' data-filtro="todos" aria-selected="true">Todos'
                 + ' <span class="chip-count">(' + total + ')</span></button>';
        AREA.forEach(function (a) {
            html += '<button class="btn" data-size="s" data-emphasis="subtle" role="tab"'
                 +  ' data-filtro="' + a.id + '" aria-selected="false">' + esc(a.nome)
                 +  ' <span class="chip-count">(' + AREAS[a.id].length + ')</span></button>';
        });
        chips.innerHTML = html;

        /* Nível vira semântica de tag do DS, sem inventar cor:
           Iniciante = success, Intermediário = neutral, Avançado = gold. */
        function semanticaNivel(nivel) {
            if (nivel === 'Iniciante') return 'success';
            if (nivel === 'Avançado') return 'gold';
            return 'neutral';
        }

        function cardHTML(c, areaId, i) {
            return '<article class="course-card" tabindex="0" role="button"'
                +  ' data-area="' + esc(areaId) + '" data-i="' + i + '">'
                +  '<span class="course-card-bg" style="background-image: url(\'' + esc(c.image) + '\');"></span>'
                +  '<div class="course-card-container">'
                +  '<div class="course-card-text">'
                +  '<div class="course-card-tags">'
                +  (c.nivel ? '<span class="tag-status" data-semantic="' + semanticaNivel(c.nivel) + '" data-size="s">' + esc(c.nivel) + '</span>' : '')
                +  '<span class="tag-status" data-semantic="neutral" data-size="s">' + esc(c.duracao) + '</span>'
                +  '<span class="tag-status course-card-inclusao" data-semantic="neutral" data-size="s">Completa</span>'
                +  '</div>'
                +  '<h3 class="course-card-title">' + esc(c.title) + '</h3>'
                +  '<p class="course-card-desc">' + esc(c.desc) + '</p>'
                +  '</div>'
                +  '<span class="material-symbols-outlined course-card-arrow">arrow_insert</span>'
                +  '</div></article>';
        }

        function render(filtro) {
            var partes = [];
            AREA.forEach(function (a) {
                if (filtro !== 'todos' && filtro !== a.id) return;
                AREAS[a.id].forEach(function (c, i) { partes.push(cardHTML(c, a.id, i)); });
            });
            track.innerHTML = partes.join('');
            carrossel.reset();
        }

        chips.addEventListener('click', function (e) {
            var btn = e.target.closest('.btn[data-filtro]');
            if (!btn) return;
            marcarAtivo(chips, btn.dataset.filtro);
            render(btn.dataset.filtro);
        });

        render('todos');

        /* Clique abre o lightbox do XpFolder escopado na ÁREA do case.
           XpFolder.open() sempre começa no índice 0, então a lista é
           rotacionada pra o case clicado ser o primeiro. A navegação do
           lightbox dá a volta, então nada fica inacessível, e os dots
           ficam no tamanho da área (4 a 12) em vez dos 41. */
        track.addEventListener('click', function (e) {
            var card = e.target.closest('.course-card');
            if (card) abrirCase(card);
        });
        track.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var card = e.target.closest('.course-card');
            if (!card) return;
            e.preventDefault();
            abrirCase(card);
        });

        function abrirCase(card) {
            var lista = AREAS[card.dataset.area];
            if (!lista || !window.XpFolder) return;
            var i = parseInt(card.dataset.i, 10) || 0;
            window.XpFolder.open(lista.slice(i).concat(lista.slice(0, i)), card);
        }
    })();

})();
