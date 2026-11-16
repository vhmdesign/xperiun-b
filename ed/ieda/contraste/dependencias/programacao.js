/*
 * IEDA, programação (/ed/ieda/): animações dos tópicos e navegação de cada dia.
 * As animações são as de /temp/ieda/diversas/ (loop em passos de 150ms; o JS só troca classes
 * e alturas/larguras, as transições ficam no programacao.css).
 *
 * Cada dia (.ieda-dia) tem uma navegação (.ieda-dia-nav) e um palco com um <article data-anim>
 * por tópico; só o ativo aparece e roda. Ao ativar, o tópico recomeça do primeiro passo.
 * Avanço automático: no fim de cada loop do ativo vai para o próximo (só com o dia na tela);
 * um clique na navegação escolhe o tópico e o avanço segue a partir dele. Um anel de
 * progresso na pílula do ativo mostra quanto falta pra passar pro próximo.
 * Abaixo de 864px não há navegação: os tópicos viram um carrossel infinito (criaCarrossel),
 * com avanço automático, arrastar e o indicador de slides clicável; todos os cards rodam.
 * Com prefers-reduced-motion: sem loop e sem avanço; cada tópico fica parado no último passo.
 */
(function () {
    function q(c, k) { return c.querySelector('[data-k="' + k + '"]'); }
    function liga(el, classe, on) { el.classList.toggle(classe, !!on); }

    var A = {
        // 01: os nós acendem em sequência e os fios preenchem até o Power BI (girado em destaque).
        // Depois, sem girar, os logos acendem e apagam devagar, ao acaso, em #FFFFC8, como se conversassem.
        arq: { len: 60, f: function (c, lk) {
            var s = Math.min(3, Math.floor(lk / 5)), conversa = lk >= 20;
            for (var i = 0; i < 4; i++) {
                var n = q(c, 'n' + i), logo = n.querySelector('.logo');
                liga(n, 'apagado', s < i);
                liga(logo, 'hi', !conversa && s === i);
                // sutil (sem efeito estroboscópico): cada logo só pode trocar de estado a cada 1,2s
                // (8 passos), com as janelas defasadas entre os logos, e a cor entra/sai em 1s
                if (!c.__pisca) c.__pisca = { janela: [], on: [] };
                var janela = Math.floor((lk + i * 3) / 8);
                if (c.__pisca.janela[i] !== janela) {
                    c.__pisca.janela[i] = janela;
                    c.__pisca.on[i] = Math.random() < 0.4;
                }
                liga(logo, 'pisca', conversa && c.__pisca.on[i]);
            }
            // o fio tem progressive blur: o preenchimento existe na fonte e em cada camada clonada
            // l0 e l2 são fios retos (largura do preenchimento); l1 é a curva Supabase > Claude Code (classe on)
            for (var j = 0; j < 3; j += 2) {
                var fills = c.querySelectorAll('[data-k="l' + j + '"] i');
                for (var f = 0; f < fills.length; f++) fills[f].style.width = s > j ? '100%' : '0%';
            }
            var curvas = c.querySelectorAll('[data-k="l1"]');
            for (var g = 0; g < curvas.length; g++) liga(curvas[g], 'on', s > 1);
        } },

        // 02: a ligação dupla até a spec preenche, os requisitos são marcados; o fio até os arquivos
        // preenche junto com o primeiro check e cada arquivo aparece logo depois do seu check
        cc: { len: 40, f: function (c, lk) {
            var s = Math.min(3, Math.floor(lk / 6));
            for (var i = 0; i < 3; i++) {
                liga(q(c, 'r' + i), 'on', s > i);
                liga(q(c, 'f' + i), 'on', lk >= 6 * (i + 1) + 3);
            }
            // ligação dupla (fonte + camadas do progressive blur): os dois braços, depois a descida/subida
            // até o meio e por fim a saída única (atrasos no CSS)
            var juntas = c.querySelectorAll('[data-k="j"]');
            for (var g = 0; g < juntas.length; g++) liga(juntas[g], 'on', lk >= 1);
        } },

        // 03: bronze, silver, gold em sequência; no gold o gráfico cresce
        md: { len: 46, f: function (c, lk) {
            var s = Math.min(2, Math.floor(lk / 8));
            for (var i = 0; i < 3; i++) {
                var p = q(c, 'p' + i);
                liga(p, 'apagado', i > s);
                liga(p, 'hi', i === s);
            }
            // começa com todas as barras em 16px; no gold crescem (em % dos 64px do gráfico)
            var cresce = s === 2 && lk >= 20, h = [32, 64, 64, 96, 32, 64, 96, 64];
            for (var j = 0; j < 8; j++) q(c, 'b' + j).style.height = (cresce ? h[j] : 16) + 'px';
            // fio em verde (fonte + camadas do progressive blur): os dados saem do Supabase logo no início
            var fills = c.querySelectorAll('[data-k="l0"] i');
            for (var f = 0; f < fills.length; f++) fills[f].style.width = lk >= 1 ? '100%' : '0%';
        } },

        // 04: revisando, ajustes, revisando, aprovado
        cx: { len: 64, f: function (c, lk, k) {
            var sx = Math.floor(lk / 8) % 4;
            var st = q(c, 'st'), flag = q(c, 'flag');
            liga(st, 'st-erro', sx === 1);
            liga(st, 'st-ok', sx === 3);
            q(c, 'stt').textContent = ['revisando', 'ajustes', 'revisando', 'aprovado'][sx];
            q(c, 'spin').style.transform = 'rotate(' + (k * 90) + 'deg)';
            liga(flag, 'flag-erro', sx === 1);
            liga(flag, 'flag-ok', sx >= 2);
            // fios em verde (fonte + camadas do progressive blur): o PR sai do Claude Code no começo
            // de cada rodada (32 passos); a curva até o Codex desce em vermelho nos ajustes e em verde
            // no aprovado (o vermelho fica enquanto ela esvazia, para não trocar de cor no caminho)
            var fills = c.querySelectorAll('[data-k="l0"] i');
            for (var f = 0; f < fills.length; f++) fills[f].style.width = lk % 32 >= 1 ? '100%' : '0%';
            var desce = c.querySelectorAll('[data-k="l1"]');
            for (var d = 0; d < desce.length; d++) {
                liga(desce[d], 'on', sx === 1 || sx === 3);
                liga(desce[d], 'erro', sx === 1 || sx === 2);
            }
        } },

        // 05: os 7 dias do cron rodam um a um; no fim, coleta concluída
        gh: { len: 46, f: function (c, lk) {
            var s = Math.min(8, Math.floor(lk / 4));
            var dias = c.querySelectorAll('.dia');
            for (var i = 0; i < dias.length; i++) {
                liga(dias[i], 'on', s > i);
                liga(dias[i], 'pulo', s === i + 1);
            }
            liga(q(c, 'ok'), 'on', s >= 7);
        } },

        // 06: as curvas descem do Claude Code para cada MCP, uma por vez; o MCP acende quando a curva chega
        // (0,6s = 4 passos depois). Curvas com progressive blur: atualizar a fonte e as camadas clonadas
        mcp: { len: 40, f: function (c, lk) {
            for (var i = 0; i < 3; i++) {
                var t = 6 * i + 1, cs = c.querySelectorAll('[data-k="v' + i + '"]');
                for (var g = 0; g < cs.length; g++) liga(cs[g], 'on', lk >= t);
                liga(q(c, 'm' + i), 'apagado', lk < t + 4);
            }
        } },

        // 07: a pergunta é digitada, os editais aparecem com relevância e vem a resposta
        // digitação a 4 letras por passo (a pergunta inteira em ~1,5s); o resto vem logo em seguida
        rag: { len: 38, f: function (c, lk, k) {
            var t = 'quais licitações de TI abriram em SP?';
            q(c, 'typed').textContent = t.slice(0, Math.min(t.length, lk * 4));
            q(c, 'caret').style.opacity = (lk < 12 && k % 4 < 2) ? 1 : 0;
            liga(q(c, 'sb'), 'parado', lk >= 12);
            for (var i = 0; i < 2; i++) {
                liga(q(c, 'r' + i), 'on', lk >= 14 + i * 2);
                q(c, 'h' + i).style.width = lk >= 19 ? (i ? '48%' : '72%') : '0%';
            }
            liga(q(c, 'ans'), 'on', lk >= 23);
        } },

        // 08: as três curvas descem juntas da Orca; depois os agentes enchem em paralelo, cada um no seu ritmo
        orca: { len: 46, f: function (c, lk) {
            var js = c.querySelectorAll('[data-k="j"]');
            for (var g = 0; g < js.length; g++) liga(js[g], 'on', lk >= 1);
            var d = [16, 26, 11];
            for (var i = 0; i < 3; i++) {
                var pr = Math.min(1, Math.max(0, lk - 5) / d[i]);
                q(c, 'p' + i).style.height = Math.round(pr * 100) + '%';
                liga(q(c, 'c' + i), 'on', pr >= 1);
            }
        } },

        // 09: o fio do OpenRouter chega nos modelos (0,4s) e eles aparecem um por vez (rápido, raciocínio,
        // econômico, a cada 0,3s); depois a curva leva até o Hermes, o fio até o Telegram preenche e chega
        // o aviso; tudo esvazia no começo do loop seguinte
        hermes: { len: 36, f: function (c, lk) {
            var r = lk;
            for (var i = 0; i < 3; i++) liga(q(c, 'ch' + i), 'apagado', r < 4 + i * 2);
            r -= 6; // o resto da sequência começa depois do terceiro modelo
            var f0 = c.querySelectorAll('[data-k="l0"] i');
            for (var f = 0; f < f0.length; f++) f0[f].style.width = lk >= 1 ? '100%' : '0%';
            var cv = c.querySelectorAll('[data-k="l1"]');
            for (var g = 0; g < cv.length; g++) liga(cv[g], 'on', r >= 4);
            var f2 = c.querySelectorAll('[data-k="l2"] i');
            for (var h = 0; h < f2.length; h++) f2[h].style.width = r >= 8 ? '100%' : '0%';
            liga(q(c, 'badge'), 'on', r >= 11);
        } },

        // 10: cada filtro muda as barras (em px, múltiplos de 16)
        pbi: { len: 60, f: function (c, lk) {
            var s = Math.floor(lk / 20) % 3;
            var sets = [[32, 48, 32, 64, 48, 80, 64, 80], [64, 32, 80, 48, 64, 48, 32, 48], [16, 48, 64, 48, 80, 64, 48, 80]];
            for (var i = 0; i < 3; i++) liga(q(c, 'f' + i), 'on', lk >= 4 && i === s);
            var pb = c.querySelectorAll('.pb');
            for (var j = 0; j < pb.length; j++) pb[j].style.height = (lk >= 4 ? sets[s][j] : 16) + 'px';
        } }
    };

    var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // abaixo de 864 não há navegação: os tópicos viram carrossel (style.css) e todos rodam
    var carrossel = window.matchMedia ? window.matchMedia('(max-width: 864px)') : { matches: false };
    var k = 0;
    var dias = [];

    function desenha(card, lk) {
        A[card.getAttribute('data-anim')].f(card, lk, k);
    }

    // anel de progresso do tópico ativo (só com avanço automático): enche de 0 a 1 ao longo
    // de um loop da animação; cheio, o dia passa pro próximo tópico
    var SVG = 'http://www.w3.org/2000/svg';
    function criaAnel(botao) {
        var svg = document.createElementNS(SVG, 'svg');
        svg.setAttribute('class', 'ieda-dia-nav-prog');
        svg.setAttribute('viewBox', '0 0 16 16');
        svg.setAttribute('aria-hidden', 'true');
        ['ieda-dia-nav-prog-trilho', 'ieda-dia-nav-prog-cheio'].forEach(function (cl) {
            var c = document.createElementNS(SVG, 'circle');
            c.setAttribute('class', cl);
            c.setAttribute('cx', '8');
            c.setAttribute('cy', '8');
            c.setAttribute('r', '7');
            c.setAttribute('pathLength', '1');
            svg.appendChild(c);
        });
        botao.appendChild(svg);
        return svg.lastChild;
    }

    // ---------- carrossel (abaixo de 864; acima o CSS esconde o indicador e o JS não mexe) ----------
    // Loop infinito sem emenda: o card da vez é sempre o primeiro filho do palco e o palco anda
    // por translateX. Ao avançar t cards, o palco desliza -t passos e, no fim da transição, os t
    // primeiros vão pro fim e o palco volta pra 0 sem transição (nada muda na tela).
    // Arrastar (mouse ou dedo): no começo do gesto o último card vai pra frente (o palco compensa
    // 1 passo), então dá pra puxar pros dois lados; ao soltar, encaixa no anterior, no mesmo ou
    // no próximo. O indicador (.ieda-dia-slides) leva direto a qualquer card, sempre pra frente.
    // Avanço automático no fim do loop da animação do card da vez (passo() abaixo).
    function criaCarrossel(dia, d) {
        var palco = dia.querySelector('.ieda-dia-palco');
        var cards = d.cards, n = cards.length;
        var c = { atual: 0, animando: false, arrastando: false, inicio: 0, ini: cards.map(function () { return 0; }) };
        d.car = c;

        var barra = document.createElement('div');
        barra.className = 'ieda-dia-slides';
        var marcas = cards.map(function (card, j) {
            var m = document.createElement('button');
            m.type = 'button';
            var nome = card.querySelector('.anim-nome');
            m.setAttribute('aria-label', 'Tópico ' + (j + 1) + (nome ? ': ' + nome.textContent.replace(/:$/, '') : ''));
            m.addEventListener('click', function () { irPara(j); });
            barra.appendChild(m);
            return m;
        });
        palco.parentNode.insertBefore(barra, palco);

        function passoPx() {
            var f = palco.children;
            return f.length > 1 ? f[1].offsetLeft - f[0].offsetLeft : palco.clientWidth;
        }
        function setX(x, anima) {
            palco.style.transition = anima ? 'transform 0.5s ease' : 'none';
            palco.style.transform = 'translateX(' + x + 'px)';
        }
        function marca() {
            marcas.forEach(function (m, j) {
                liga(m, 'is-ativo', j === c.atual);
                if (j === c.atual) m.setAttribute('aria-current', 'true'); else m.removeAttribute('aria-current');
            });
        }
        // depois da transição: gira o DOM t vezes e volta o palco pra 0; o novo primeiro é o da vez
        function assenta(t) {
            for (var i = 0; i < t; i++) palco.appendChild(palco.firstElementChild);
            setX(0, false);
            var novo = cards.indexOf(palco.firstElementChild);
            if (novo !== c.atual) {
                c.atual = novo;
                c.ini[novo] = k;   // a animação do card da vez recomeça do primeiro passo
                desenha(cards[novo], 0);
            }
            c.inicio = k;
            c.animando = false;
            marca();
        }
        function desliza(t, deX) {
            c.animando = true;
            if (deX != null) setX(deX, false);
            palco.getBoundingClientRect();
            setX(-t * passoPx(), true);
            var feito = false;
            function fim() {
                if (feito) return;
                feito = true;
                palco.removeEventListener('transitionend', fim);
                assenta(t);
            }
            palco.addEventListener('transitionend', fim);
            setTimeout(fim, 650);
        }
        c.proximo = function () { if (!c.animando && !c.arrastando) desliza(1); };
        function irPara(j) {
            if (c.animando || c.arrastando || !carrossel.matches) return;
            var t = (j - c.atual + n) % n;
            if (t) desliza(t);
        }

        // arrastar
        var x0 = 0, dx = 0, pid = null;
        palco.addEventListener('pointerdown', function (e) {
            if (!carrossel.matches || c.animando || e.button > 0) return;
            c.arrastando = true;
            pid = e.pointerId;
            x0 = e.clientX;
            dx = 0;
            palco.insertBefore(palco.lastElementChild, palco.firstElementChild);
            setX(-passoPx(), false);
            liga(palco, 'is-arrastando', true);
        });
        palco.addEventListener('pointermove', function (e) {
            if (!c.arrastando || e.pointerId !== pid) return;
            dx = e.clientX - x0;
            if (Math.abs(dx) > 4 && !palco.hasPointerCapture(pid)) palco.setPointerCapture(pid);
            setX(-passoPx() + dx, false);
        });
        function solta(e) {
            if (!c.arrastando || e.pointerId !== pid) return;
            c.arrastando = false;
            liga(palco, 'is-arrastando', false);
            var lim = Math.max(40, passoPx() * 0.15);
            // t conta a partir do card que foi pra frente: 0 = anterior, 1 = o mesmo, 2 = próximo
            var t = dx < -lim ? 2 : dx > lim ? 0 : 1;
            desliza(t, -passoPx() + dx);
        }
        palco.addEventListener('pointerup', solta);
        palco.addEventListener('pointercancel', solta);
        // clicar e arrastar com mouse não deve arrastar imagem nem selecionar texto
        palco.addEventListener('dragstart', function (e) { e.preventDefault(); });

        // semântica de cada modo: no desktop os cards são painéis das abas (role=tabpanel, no
        // HTML); no carrossel as abas somem, então o palco vira um carrossel e cada card um
        // slide ("1 de 5: nome"). Ao sair do carrossel também limpa o deslocamento.
        var rotulo = dia.querySelector('.ieda-dia-nav');
        rotulo = rotulo ? rotulo.getAttribute('aria-label') : '';
        function muda() {
            if (carrossel.matches) {
                palco.setAttribute('role', 'region');
                palco.setAttribute('aria-roledescription', 'carrossel');
                if (rotulo) palco.setAttribute('aria-label', rotulo);
                cards.forEach(function (card, j) {
                    var nome = card.querySelector('.anim-nome');
                    card.setAttribute('role', 'group');
                    card.setAttribute('aria-roledescription', 'slide');
                    card.setAttribute('aria-label', (j + 1) + ' de ' + n + (nome ? ': ' + nome.textContent.replace(/:$/, '') : ''));
                    card.removeAttribute('aria-labelledby');
                });
            } else {
                palco.style.transform = '';
                palco.style.transition = '';
                ['role', 'aria-roledescription', 'aria-label'].forEach(function (a) { palco.removeAttribute(a); });
                cards.forEach(function (card) {
                    card.setAttribute('role', 'tabpanel');
                    card.removeAttribute('aria-roledescription');
                    card.removeAttribute('aria-label');
                    card.setAttribute('aria-labelledby', card.id.replace(/-t(\d+)$/, '-b$1'));
                });
            }
        }
        if (carrossel.addEventListener) carrossel.addEventListener('change', muda);
        else if (carrossel.addListener) carrossel.addListener(muda);
        muda();

        marca();
    }

    function progresso(d, v) {
        var cheio = d.aneis[d.ativo];
        if (cheio) cheio.style.strokeDashoffset = String(1 - Math.min(1, Math.max(0, v)));
    }

    Array.prototype.forEach.call(document.querySelectorAll('.ieda-dia'), function (dia) {
        var botoes = Array.prototype.slice.call(dia.querySelectorAll('.ieda-dia-nav-item'));
        var cards = Array.prototype.slice.call(dia.querySelectorAll('[data-anim]'));
        var d = { botoes: botoes, cards: cards, ativo: 0, inicio: 0, visivel: false };
        d.aneis = reduz ? [] : botoes.map(criaAnel);

        // estado inicial de todos (escondidos ficam prontos no primeiro passo)
        cards.forEach(function (c) {
            var a = A[c.getAttribute('data-anim')];
            desenha(c, reduz ? a.len - 1 : 0);
        });

        d.ativa = function (i) {
            d.ativo = i;
            d.inicio = k;
            botoes.forEach(function (b, j) {
                var dist = Math.min(2, Math.abs(j - i));
                b.setAttribute('data-dist', dist);
                b.setAttribute('aria-selected', j === i ? 'true' : 'false');
                b.tabIndex = j === i ? 0 : -1;
            });
            cards.forEach(function (c, j) { liga(c, 'is-ativo', j === i); });
            var a = A[cards[i].getAttribute('data-anim')];
            desenha(cards[i], reduz ? a.len - 1 : 0);
            // o anel do novo ativo volta pra zero sem transição
            var cheio = d.aneis[i];
            if (cheio) {
                cheio.style.transition = 'none';
                progresso(d, 0);
                cheio.getBoundingClientRect();
                cheio.style.transition = '';
            }
        };

        botoes.forEach(function (b, j) {
            b.addEventListener('click', function () { d.ativa(j); });
            // setas trocam o tópico (padrão de abas)
            b.addEventListener('keydown', function (e) {
                var n = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
                if (!n) return;
                e.preventDefault();
                var p = (j + n + botoes.length) % botoes.length;
                d.ativa(p);
                botoes[p].focus();
            });
        });

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (es) {
                es.forEach(function (e) { d.visivel = e.isIntersecting; });
            }, { threshold: 0.25 }).observe(dia);
        } else {
            d.visivel = true;
        }

        d.ativa(0);
        criaCarrossel(dia, d);
        dias.push(d);
    });

    function passo() {
        k++;
        if (carrossel.matches) {
            dias.forEach(function (d) {
                var car = d.car;
                // todos rodam; cada um conta a partir de quando virou o da vez
                d.cards.forEach(function (c, j) {
                    desenha(c, (k - car.ini[j]) % A[c.getAttribute('data-anim')].len);
                });
                // avanço automático: fim do loop do da vez, com o dia na tela e sem gesto em curso
                var a = A[d.cards[car.atual].getAttribute('data-anim')];
                if (d.visivel && !car.arrastando && !car.animando && k - car.inicio >= a.len) car.proximo();
            });
            return;
        }
        dias.forEach(function (d) {
            var c = d.cards[d.ativo], a = A[c.getAttribute('data-anim')];
            var lk = k - d.inicio;
            if (lk >= a.len && d.visivel) {
                d.ativa((d.ativo + 1) % d.cards.length);
                return;
            }
            desenha(c, lk % a.len);
            // fora da tela o avanço espera: o anel fica cheio até o dia voltar a aparecer
            progresso(d, lk / a.len);
        });
    }

    if (!reduz) setInterval(passo, 150);
})();
