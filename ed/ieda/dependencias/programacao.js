/*
 * IEDA, programação e vídeos da página (/ed/ieda/).
 * As 12 animações são vídeos (dependencias/videos/, gerados por temp/ieda/videos/): 10 da
 * programação (um por tópico) + plantão e radar no "Na prática". Cada vídeo tem variante
 * desktop (d) e mobile (m, abaixo de 576px), em webm VP9 e mp4 H.264; a variante vem do
 * <source media> e o poster é escolhido aqui.
 *
 * Programação acima de 864px: cada dia tem uma navegação (.ieda-dia-nav, abas) e um painel por
 * tópico; só o ativo aparece e toca, do começo. Avanço automático: quando o vídeo do ativo acaba
 * (uma volta), o dia vai pro próximo (só com o dia na tela; fora dela o vídeo para). Um anel de
 * progresso na pílula do ativo mostra quanto falta.
 * Abaixo de 864px não há navegação: os tópicos viram um carrossel infinito (criaCarrossel), com
 * avanço automático no fim do vídeo do card da vez, arrastar e o indicador de slides clicável.
 * Plantão e radar: tocam em loop enquanto estão na tela. O radar tem alfa (webm VP9); onde o
 * vídeo cai no mp4 (Safari, sem alfa), ele fica recortado no card (.sem-alfa).
 * Com prefers-reduced-motion: nada toca sozinho; ficam os posters e a navegação manual.
 */
(function () {
    function liga(el, classe, on) { el.classList.toggle(classe, !!on); }
    var mm = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
    var reduz = mm('(prefers-reduced-motion: reduce)').matches;
    var carrossel = mm('(max-width: 864px)');
    var mobile = mm('(max-width: 576px)');
    var PASTA = '/ed/ieda/dependencias/videos/';
    var dias = [];

    function aoMudar(q, fn) {
        if (q.addEventListener) q.addEventListener('change', fn);
        else if (q.addListener) q.addListener(fn);
    }

    // ---------- vídeos ----------
    // Safari (desktop e iOS): toca webm VP9, mas sem a transparência; o radar usa o mp4
    var safari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);

    function poster(v) {
        v.poster = PASTA + v.getAttribute('data-video') + '-' + (mobile.matches ? 'm' : 'd') + '.webp';
    }
    function toca(v, doZero) {
        if (!v || reduz) return;
        if (doZero) { try { v.currentTime = 0; } catch (e) { /* ainda sem dados */ } }
        var p = v.play();
        if (p && p.catch) p.catch(function () { /* autoplay barrado: fica o poster */ });
    }
    function para(v) { if (v && !v.paused) v.pause(); }

    var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-video]'));
    videos.forEach(function (v) {
        poster(v);
        if (safari && v.getAttribute('data-video') === 'radar') {
            Array.prototype.forEach.call(v.querySelectorAll('source[type="video/webm"]'), function (s) { s.remove(); });
            var card = v.closest('.ieda-pratica-card');
            if (card) liga(card, 'sem-alfa', true);
        }
    });
    // passou de 576 pra cima ou pra baixo: troca a variante (posters e fontes)
    aoMudar(mobile, function () {
        videos.forEach(function (v) {
            var tocando = !v.paused;
            poster(v);
            v.load();
            if (tocando) toca(v);
        });
    });

    // ---------- "Na prática": plantão e radar em loop, só com o vídeo na tela ----------
    var pratica = Array.prototype.slice.call(document.querySelectorAll('.ieda-pratica-video'));
    if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (es) {
            es.forEach(function (e) { if (e.isIntersecting) toca(e.target); else para(e.target); });
        }, { threshold: 0.1 });
        pratica.forEach(function (v) { obs.observe(v); });
    } else {
        pratica.forEach(function (v) { toca(v); });
    }

    // ---------- anel de progresso do tópico ativo ----------
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
    function progresso(d, v) {
        var cheio = d.aneis[d.ativo];
        if (cheio) cheio.style.strokeDashoffset = String(1 - Math.min(1, Math.max(0, v)));
    }
    function zeraAnel(d) {
        var cheio = d.aneis[d.ativo];
        if (!cheio) return;
        cheio.style.transition = 'none';
        progresso(d, 0);
        cheio.getBoundingClientRect();
        cheio.style.transition = '';
    }

    // ---------- carrossel (abaixo de 864; acima o CSS esconde o indicador e o JS não mexe) ----------
    // Loop infinito sem emenda: o card da vez é sempre o primeiro filho do palco e o palco anda
    // por translateX. Ao avançar t cards, o palco desliza -t passos e, no fim da transição, os t
    // primeiros vão pro fim e o palco volta pra 0 sem transição (nada muda na tela).
    // Arrastar (mouse ou dedo): no começo do gesto o último card vai pra frente (o palco compensa
    // 1 passo), então dá pra puxar pros dois lados; ao soltar, encaixa no anterior, no mesmo ou
    // no próximo. O indicador (.ieda-dia-slides) leva direto a qualquer card, sempre pra frente.
    // Avanço automático no fim do vídeo do card da vez.
    function criaCarrossel(dia, d) {
        var palco = dia.querySelector('.ieda-dia-palco');
        var cards = d.cards, n = cards.length;
        var c = { atual: 0, animando: false, arrastando: false };
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
        // o vídeo do card da vez toca do começo; os outros param (o preview mostra o quadro parado)
        c.tocaAtual = function () {
            d.videos.forEach(function (v, j) { if (j !== c.atual) para(v); });
            if (d.visivel) toca(d.videos[c.atual], true);
        };
        // depois da transição: gira o DOM t vezes e volta o palco pra 0; o novo primeiro é o da vez
        function assenta(t) {
            for (var i = 0; i < t; i++) palco.appendChild(palco.firstElementChild);
            setX(0, false);
            var novo = cards.indexOf(palco.firstElementChild);
            var mudou = novo !== c.atual;
            c.atual = novo;
            c.animando = false;
            marca();
            if (mudou) c.tocaAtual();
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
        muda();
        d.mudaModo = muda;
        marca();
    }

    // ---------- dias ----------
    Array.prototype.forEach.call(document.querySelectorAll('.ieda-dia'), function (dia) {
        var botoes = Array.prototype.slice.call(dia.querySelectorAll('.ieda-dia-nav-item'));
        var cards = Array.prototype.slice.call(dia.querySelectorAll('.ieda-dia-palco > .anim'));
        var d = { botoes: botoes, cards: cards, ativo: 0, visivel: false };
        d.videos = cards.map(function (c) { return c.querySelector('video'); });
        d.aneis = reduz ? [] : botoes.map(criaAnel);

        d.ativa = function (i) {
            d.ativo = i;
            botoes.forEach(function (b, j) {
                b.setAttribute('data-dist', Math.min(2, Math.abs(j - i)));
                b.setAttribute('aria-selected', j === i ? 'true' : 'false');
                b.tabIndex = j === i ? 0 : -1;
            });
            cards.forEach(function (c, j) { liga(c, 'is-ativo', j === i); });
            d.videos.forEach(function (v, j) { if (j !== i) para(v); });
            zeraAnel(d);
            if (d.visivel && !carrossel.matches) toca(d.videos[i], true);
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

        // fim de uma volta do vídeo: avança (abas ou carrossel) ou, fora da tela, só recomeça
        d.videos.forEach(function (v, j) {
            v.addEventListener('ended', function () {
                if (carrossel.matches) {
                    var car = d.car;
                    if (j !== car.atual) return;
                    if (d.visivel && !car.arrastando && !car.animando) car.proximo();
                    else toca(v, true);
                    return;
                }
                if (j !== d.ativo) return;
                if (d.visivel) d.ativa((d.ativo + 1) % cards.length);
                else toca(v, true);
            });
        });

        // fora da tela o vídeo da vez para; ao voltar, continua
        function atual() { return carrossel.matches ? d.videos[d.car.atual] : d.videos[d.ativo]; }
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (es) {
                es.forEach(function (e) {
                    d.visivel = e.isIntersecting;
                    if (d.visivel) toca(atual()); else para(atual());
                });
            }, { threshold: 0.25 }).observe(dia);
        } else {
            d.visivel = true;
        }

        d.ativa(0);
        criaCarrossel(dia, d);
        dias.push(d);
    });

    // entrou ou saiu do carrossel: a semântica muda e quem toca é o ativo do modo novo
    aoMudar(carrossel, function () {
        dias.forEach(function (d) {
            d.mudaModo();
            d.videos.forEach(para);
            if (carrossel.matches) d.car.tocaAtual();
            else d.ativa(d.ativo);
        });
    });

    // anel de progresso: acompanha o vídeo do ativo
    if (!reduz) {
        (function quadro() {
            if (!carrossel.matches) {
                dias.forEach(function (d) {
                    var v = d.videos[d.ativo];
                    if (v && v.duration) progresso(d, v.currentTime / v.duration);
                });
            }
            requestAnimationFrame(quadro);
        })();
    }
})();
