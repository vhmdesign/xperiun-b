/* ══════════════════════════════════════════════════════════════════════
   BLACK FRIDAY (/ed/bf/)
   1. Popup: [data-abre-vip] abre o grupo VIP (form 407).
   2. Comparativo: dropdown de formação e ícones, portados do index.js da
      /ed/formacoes/ com caminhos absolutos.
   3. Entradas: título letra a letra, lede e cards, como na /ed/formacoes/.
   4. Formações e Extras, portados da /ed/infinite-pass/oferta/: pastas 3D,
      tags, CTA dos cards de área, carrossel e diagrama do marketplace.
   ══════════════════════════════════════════════════════════════════════ */

var BF_SEM_MOVIMENTO = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Regra do projeto: sem blur animado abaixo de 864. */
var BF_ESTREITO = window.matchMedia && window.matchMedia('(max-width: 864px)').matches;
function bf(px) {
    if (BF_ESTREITO) return 'none';
    return px === 0 ? 'blur(0)' : 'blur(' + px + 'px)';
}
if (window.matchMedia) {
    window.matchMedia('(max-width: 864px)').addEventListener('change', function (e) {
        BF_ESTREITO = e.matches;
    });
}

/* ── 1. Popup ─────────────────────────────────────────────────────────── */
(function () {
    document.addEventListener('click', function (ev) {
        if (!ev.target.closest('[data-abre-vip]')) return;
        ev.preventDefault();
        /* O popup desta página (form-bf-v3.html, form 407). */
        if (window.openPopup) window.openPopup('popup-form-bf-v3');
    });
})();

/* ── 2. Comparativo ───────────────────────────────────────────────────── */
(function () {
    /* Cores das formações, as mesmas da /ed/formacoes/. */
    var cores = {
        f1: '#E19632', f2: '#E16432', f3: '#32C896',
        f4: '#32C8C8', f5: '#64C832', f6: '#3264FF', f7: '#E13232'
    };
    var ICONES = '/ed/site-dependencias/site-media/formacoes/icones/';
    var FUNDOS = '/ed/site-dependencias/site-media/formacoes/bg/';
    var icones = {
        f1: ICONES + 'Power%20BI%20B%C3%A1sico.svg',
        f2: ICONES + 'Power%20BI%20Intermedi%C3%A1rio.svg',
        f3: ICONES + 'Microsoft%20Fabric.svg',
        f4: ICONES + 'Banco%20de%20Dados%20%26%20SQL.svg',
        f5: ICONES + 'Python%20%26%20Data%20Science.svg',
        f6: ICONES + 'Automa%C3%A7%C3%A3o%20%26%20IA.svg',
        f7: ICONES + 'Carreira%20%26%20Neg%C3%B3cios.svg'
    };
    var fundos = {
        f1: FUNDOS + 'formacao-pbi.webp',
        f2: FUNDOS + 'formacao-pbia.webp',
        f3: FUNDOS + 'formacao-fabric.webp',
        f4: FUNDOS + 'formacao-bdsql.webp',
        f5: FUNDOS + 'formacao-dspython.webp',
        f6: FUNDOS + 'formacao-autoia.webp',
        f7: FUNDOS + 'formacao-negocios.webp'
    };

    /* Primeiro item da lista da avulsa: a própria formação. Os números são
       os dos cards de Formações desta página, pra os dois não divergirem. */
    var nomes = {
        f1: 'Power BI Básico ao Intermediário',
        f2: 'Power BI Intermediário ao Avançado',
        f3: 'Microsoft Fabric',
        f4: 'Banco de Dados & SQL',
        f5: 'Python & Data Science',
        f6: 'Inteligência Artificial e Automação',
        f7: 'Carreira & Negócios'
    };
    var cargas = {
        f1: '8 cursos, ~38h de conteúdo',
        f2: '9 cursos, ~103h de conteúdo',
        f3: '3 cursos, ~53h de conteúdo',
        f4: '3 cursos + bônus, ~57h de conteúdo',
        f5: '7 cursos, ~58h de conteúdo',
        f6: '19 cursos, ~89h de conteúdo',
        f7: '6 cursos, ~31h de conteúdo'
    };

    function rgba(hex, a) {
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }

    /* A Xperiun Completa no preço cheio, como opção do dropdown, pra
       comparar com a oferta da Black Friday ao lado. Preço e textos são os
       do card da Completa na /ed/formacoes/ e do card da oferta aqui; o
       ícone é o símbolo da Xperiun do favicon. */
    var COMPLETA = {
        icone: '/ed/site-dependencias/site-imagens/S%C3%ADmbolo%20Xperiun%20%C3%ACcone.svg',
        fundo: FUNDOS + 'formacao-xperiun.webp',
        valor: '197',
        detalhe: 'no cartão ou R$ 1.997 à vista.',
        nome: '7 Formações por Competência',
        meta: 'Power BI, Microsoft Fabric, SQL, Python, IA e Carreira',
        cert: 'Formação Completa reconhecida pelo MEC'
    };
    /* O que a formação avulsa mostra, pra voltar dela pra uma fN. */
    var AVULSA = {
        valor: '97',
        detalhe: 'no cartão ou R$ 997 /ano.',
        cert: 'Certificação por competência'
    };

    /* Aplica a formação fN, ou a Completa, no card. O HTML já nasce com a
       f6 aplicada; isto só roda quando a pessoa troca. */
    function aplica(card, f) {
        var completa = f === 'completa';
        var cor = cores[f];
        if (!card || (!cor && !completa)) return;
        card.classList.remove('oferta-card--f1', 'oferta-card--f2', 'oferta-card--f3', 'oferta-card--f4', 'oferta-card--f5', 'oferta-card--f6', 'oferta-card--f7', 'oferta-card--full');
        /* Na Completa a cor vem da própria classe (--pc300-25, a mesma do
           card da oferta), então o inline sai. */
        card.classList.add(completa ? 'oferta-card--full' : 'oferta-card--' + f);
        if (completa) card.style.removeProperty('--card-accent');
        else card.style.setProperty('--card-accent', rgba(cor, 0.15));

        var valor = card.querySelector('.oferta-price .value');
        var detalhe = card.querySelector('.oferta-price-detail');
        if (valor) valor.textContent = completa ? COMPLETA.valor : AVULSA.valor;
        if (detalhe) detalhe.textContent = completa ? COMPLETA.detalhe : AVULSA.detalhe;

        var item = card.querySelector('.oferta-check--formacao');
        if (item) {
            item.querySelector('.oferta-check-nome').textContent = completa ? COMPLETA.nome : nomes[f];
            item.querySelector('.oferta-check-meta').textContent = completa ? COMPLETA.meta : cargas[f];
        }
        /* Na Completa tudo vem incluso: os extras acendem e a
           certificação passa a ser a do MEC, em warning como na oferta. */
        card.querySelectorAll('.oferta-check--extra').forEach(function (li) {
            li.classList.toggle('is-disabled', !completa);
        });
        var cert = card.querySelector('.oferta-check--cert .oferta-check-meta');
        if (cert) {
            cert.textContent = completa ? COMPLETA.cert : AVULSA.cert;
            cert.classList.toggle('oferta-check-meta--mec', completa);
        }

        var caixa = card.querySelector('.oferta-icon-box');
        if (caixa) {
            var img = caixa.querySelector('.oferta-icon');
            if (img) img.src = completa ? COMPLETA.icone : icones[f];
            caixa.style.background = completa ? 'var(--pc300-10)' : rgba(cor, 0.1);
        }
        var fundo = card.querySelector('.oferta-card-img');
        if (fundo) fundo.src = completa ? COMPLETA.fundo : fundos[f];
    }

    document.querySelectorAll('.oferta-card .dropdown-group').forEach(function (grupo) {
        var gatilho = grupo.querySelector('.dropdown');
        var opcoes = grupo.querySelector('.dropdown-options');
        var rotulo = gatilho.querySelector('.dropdown-placeholder, .dropdown-value');
        var seta = gatilho.querySelector('.dropdown-icon');
        var card = grupo.closest('.oferta-card');
        var FOLGA = 8;

        /* Abre pra baixo se cabe; senão pra cima; senão pra baixo com
           rolagem. O limite é o primeiro ancestral que corta overflow. */
        function recorte() {
            var el = grupo.parentElement;
            while (el && el !== document.body) {
                var s = getComputedStyle(el);
                if (s.overflow === 'hidden' || s.overflowY === 'hidden') return el;
                el = el.parentElement;
            }
            return document.documentElement;
        }
        function abre() {
            var c = recorte().getBoundingClientRect();
            var g = grupo.getBoundingClientRect();
            opcoes.style.maxHeight = '';
            opcoes.style.visibility = 'hidden';
            opcoes.style.display = 'block';
            var h = opcoes.offsetHeight;
            opcoes.style.display = '';
            opcoes.style.visibility = '';
            var abaixo = c.bottom - g.bottom - FOLGA;
            var acima = g.top - c.top - FOLGA;
            if (abaixo >= h) {
                grupo.classList.remove('is-open-up');
            } else if (acima >= h) {
                grupo.classList.add('is-open-up');
            } else {
                grupo.classList.remove('is-open-up');
                opcoes.style.maxHeight = Math.max(abaixo, 40) + 'px';
            }
            grupo.classList.add('is-open');
            if (seta) seta.textContent = 'expand_less';
        }
        function fecha() {
            grupo.classList.remove('is-open', 'is-open-up');
            opcoes.style.maxHeight = '';
            if (seta) seta.textContent = 'expand_more';
        }

        gatilho.addEventListener('click', function (e) {
            e.stopPropagation();
            grupo.classList.contains('is-open') ? fecha() : abre();
        });
        grupo.querySelectorAll('.dropdown-option').forEach(function (op) {
            op.addEventListener('click', function (e) {
                e.stopPropagation();
                rotulo.textContent = op.textContent;
                rotulo.className = 'dropdown-value';
                fecha();
                aplica(card, op.dataset.target);
            });
        });
        document.addEventListener('click', fecha);

        /* Ícones das 7 funcionam como o dropdown. */
        card.querySelectorAll('.oferta-completa-icon').forEach(function (ic) {
            var cls = Array.prototype.find.call(ic.classList, function (c) { return /^oferta-completa-icon--f\d$/.test(c); });
            if (!cls) return;
            var f = cls.slice('oferta-completa-icon--'.length);
            ic.style.cursor = 'pointer';
            ic.addEventListener('click', function () {
                var op = grupo.querySelector('.dropdown-option[data-target="' + f + '"]');
                if (op) op.click();
            });
        });
    });
})();

/* ── 2b. Seletor do carrossel de ofertas (só no celular) ──────────────────
   Abaixo de 864 os dois cards viram um scroll horizontal com snap (CSS) e
   o .bf-perfil é a navegação dele, nos dois sentidos:

     - marcar uma opção rola a trilha até o card que ela nomeia
       (data-alvo = id do card);
     - rolar a trilha (arraste, roda, teclado) marca a opção do card mais
       perto do início dela.

   Marcar o rádio pelo script NÃO dispara `change`, então o segundo
   caminho não realimenta o primeiro. Acima de 864 a trilha não rola
   (scrollWidth = clientWidth) e o seletor está escondido: nada aqui faz
   efeito, sem precisar de media query no JS. */
(function () {
    var grade = document.querySelector('.oferta-grid');
    var radios = Array.prototype.slice.call(document.querySelectorAll('.bf-perfil .of-perfil-input'));
    if (!grade || !radios.length) return;

    var pares = radios.map(function (r) {
        return { radio: r, card: document.getElementById(r.dataset.alvo) };
    }).filter(function (p) { return p.card; });
    if (!pares.length) return;

    function rola(card) {
        /* Onde o card está hoje em relação à trilha, mais o quanto ela já
           rolou, menos o recuo do snap (o padding de 16 da trilha, que é onde
           o snap pousaria sozinho). Por getBoundingClientRect, e não
           offsetLeft: o offsetLeft é medido contra o ancestral posicionado
           mais próximo, que não é a trilha. */
        var alvo = grade.scrollLeft
            + card.getBoundingClientRect().left - grade.getBoundingClientRect().left
            - parseFloat(getComputedStyle(grade).paddingLeft || 0);
        grade.scrollTo({ left: alvo, behavior: BF_SEM_MOVIMENTO ? 'auto' : 'smooth' });
    }

    pares.forEach(function (p) {
        p.radio.addEventListener('change', function () {
            if (p.radio.checked) rola(p.card);
        });
    });

    var quadro = 0;
    grade.addEventListener('scroll', function () {
        if (quadro) return;
        quadro = requestAnimationFrame(function () {
            quadro = 0;
            var base = grade.getBoundingClientRect().left;
            var melhor = null, dist = Infinity;
            pares.forEach(function (p) {
                var d = Math.abs(p.card.getBoundingClientRect().left - base);
                if (d < dist) { dist = d; melhor = p; }
            });
            if (melhor && !melhor.radio.checked) melhor.radio.checked = true;
        });
    }, { passive: true });
})();

/* ── 3. Entradas ──────────────────────────────────────────────────────── */
(function () {
    if (BF_SEM_MOVIMENTO || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('bf-js');

    var T = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';
    var OPT = { rootMargin: '0px 0px -25% 0px', threshold: 0 };

    /* Quebra o título em letras, cada palavra num nowrap; percorre os
       filhos, então o span de destaque em 700 mantém o peso. */
    function prepara(titulo) {
        var spans = [];
        function anda(no) {
            if (no.nodeType === 3) {
                var txt = no.textContent;
                if (!txt) return;
                var frag = document.createDocumentFragment();
                var i = 0;
                while (i < txt.length) {
                    if (/\s/.test(txt[i])) {
                        frag.appendChild(document.createTextNode(txt[i]));
                        i++;
                    } else {
                        var j = i;
                        while (j < txt.length && !/\s/.test(txt[j])) j++;
                        var palavra = document.createElement('span');
                        palavra.className = 'word-nowrap';
                        for (var k = i; k < j; k++) {
                            var sp = document.createElement('span');
                            sp.textContent = txt[k];
                            palavra.appendChild(sp);
                            spans.push(sp);
                        }
                        frag.appendChild(palavra);
                        i = j;
                    }
                }
                no.parentNode.replaceChild(frag, no);
            } else if (no.nodeType === 1) {
                Array.prototype.slice.call(no.childNodes).forEach(anda);
            }
        }
        Array.prototype.slice.call(titulo.childNodes).forEach(anda);
        spans.forEach(function (sp) {
            sp.style.display = 'inline-block';
            sp.style.opacity = '0';
            sp.style.filter = bf(8);
            sp.style.transform = 'translateY(32px)';
            sp.style.transition = T;
        });
        return spans;
    }

    document.querySelectorAll('.sec-title').forEach(function (titulo) {
        var spans = prepara(titulo);
        var lede = titulo.parentNode && titulo.parentNode.querySelector('.sec-lede');
        var obs = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                if (!e.isIntersecting) return;
                obs.unobserve(titulo);
                titulo.style.opacity = '1';
                spans.forEach(function (sp, i) {
                    setTimeout(function () {
                        sp.style.opacity = '1';
                        sp.style.filter = bf(0);
                        sp.style.transform = 'translateY(0)';
                    }, i * 10);
                });
                if (lede) {
                    setTimeout(function () {
                        lede.style.opacity = '1';
                        lede.style.filter = bf(0);
                        lede.style.transform = 'translateY(0)';
                    }, 150);
                }
            });
        }, OPT);
        obs.observe(titulo);
    });

    /* Cards: atraso pela ORDEM DE ENTRADA, não pela do DOM. */
    var fila = 0;
    var zera;
    var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            if (!e.isIntersecting) return;
            obs.unobserve(e.target);
            var el = e.target;
            setTimeout(function () { el.classList.add('is-entered'); }, fila * 80);
            fila++;
            clearTimeout(zera);
            zera = setTimeout(function () { fila = 0; }, 200);
        });
    }, OPT);
    document.querySelectorAll('.oferta-card, .bf-perfis-nota, .faq-grid, .bf-manifesto-p').forEach(function (el) { obs.observe(el); });
})();

/* ══════════════════════════════════════════════════════════════════════
   FORMAÇÕES E EXTRAS
   Blocos portados da /ed/infinite-pass/oferta/dependencias/script.js,
   na mesma ordem de lá (o do diagrama precisa rodar DEPOIS do carrossel,
   que clona os cards). Comentários da origem inclusos.
   ══════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════════
   Pastas 3D dos cursos.

   Cada card de formação ganha a .of-forma-pasta de /ed/areas/, montada com os
   cursos daquela formação. Clicar abre o lightbox do XpFolder, com nav e
   dots. Os dados vêm do dados.js compartilhado, pra não duplicar catálogo.

   Portado de /ed/pre-vitalicio/, menos um pedaço: lá o bloco lê os cursos
   da F6 direto do DOM, porque aquela página tem uma seção de cursos da F6
   que não pode divergir da pasta. Esta página não tem essa seção, então a
   F6 vem do catálogo como as outras seis.

   A origem também intercepta o clique do botão "Ver formação" pra abrir a
   mesma pasta. Aqui esse botão não existe mais (a coluna de CTA saiu do
   card), então a pasta é o único gatilho e não há o que interceptar.

   O `allHref` continua sendo montado, mas hoje não leva a lugar nenhum: ele
   alimenta o botão do rodapé do lightbox, que o style.css desta pasta
   esconde. Fica montado porque é de graça e porque basta remover aquele
   `display: none` pra a página da formação voltar a ter um caminho, que
   hoje ela não tem mais em nenhum lugar desta seção.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    if (typeof CURSOS === 'undefined' || typeof FORMACOES === 'undefined') return;
    if (!window.XpFolder) return;

    var slug = {
        f1: 'f1-power-bi-basico-intermediario',
        f2: 'f2-power-bi-intermediario-avancado',
        f3: 'f3-microsoft-fabric',
        f4: 'f4-banco-de-dados-sql',
        f5: 'f5-python-data-science',
        f6: 'f6-automacao-ia',
        f7: 'f7-carreira-negocios'
    };

    /* CURSOS -> formato que o lightbox espera. `nivel` fica vazio: curso não
       tem nível como os Business Cases têm, e não se inventa dado. */
    var porFormacao = {};
    CURSOS.forEach(function (c) {
        (porFormacao[c.f] = porFormacao[c.f] || []).push({
            image: c.img,
            title: c.titulo,
            nivel: '',
            duracao: c.dur,
            aulas: c.aulas,
            professor: c.prof,
            desc: c.desc,
            allHref: '/ed/formacoes/' + (slug[c.f] || '')
        });
    });

    FORMACOES.forEach(function (f) {
        var el = document.querySelector('.of-forma .of-forma-pasta[data-f="' + f.id + '"]');
        if (!el || !porFormacao[f.id]) return;
        window.XpFolder.mount(el, { unit: 'cursos', projects: porFormacao[f.id] });
    });
})();

/* ══════════════════════════════════════════════════════════════════════
   Tags das formações.

   Substituem a .formacoes-nav de /ed/formacoes/ e fazem o mesmo trabalho
   dela, que vive no index.js de lá: clicar rola até o card, e um
   IntersectionObserver acende a tag da formação que está em cena.

   As duas margens do observador vêm da origem (-20% em cima, -60%
   embaixo): elas estreitam a faixa de detecção pra uma fita no terço
   superior da tela, senão dois ou três cards contariam como "em cena" ao
   mesmo tempo e a tag ativa ficaria piscando durante a rolagem.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var tags = document.querySelectorAll('.of-forma-tag');
    var cards = document.querySelectorAll('.of-forma .of-forma-card');
    if (!tags.length || !cards.length) return;

    for (var i = 0; i < tags.length; i++) {
        tags[i].addEventListener('click', function () {
            var alvo = document.getElementById(this.dataset.alvo);
            /* `scrollIntoView` e não um cálculo próprio: o respiro embaixo
               da lateral fixa já está no `scroll-margin-top` do card, e o
               scroll-suave.js global cuida do amaciamento. */
            if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    if (!('IntersectionObserver' in window)) return;

    var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            if (!e.isIntersecting) return;
            for (var j = 0; j < tags.length; j++) tags[j].classList.remove('is-active');
            var tag = document.querySelector('.of-forma-tag[data-alvo="' + e.target.id + '"]');
            if (tag) tag.classList.add('is-active');
        });
    }, { rootMargin: '-20% 0px -60% 0px' });

    for (var k = 0; k < cards.length; k++) obs.observe(cards[k]);
})();

/* ══════════════════════════════════════════════════════════════════════
   CTA dos cards de área (Extras).

   Aqui havia a mesma pasta 3D dos cards de formação. Ela saiu e no lugar
   entra um botão de baixa ênfase na direita do card, que abre o MESMO
   lightbox de Business Cases: o que mudou foi o gatilho, não o conteúdo.

   O botão nasce daqui, e não da marcação, porque o rótulo carrega a
   contagem de casos daquela área. Escrita no HTML, ela seria um número
   copiado do catálogo, livre pra divergir dele depois, que é exatamente o
   defeito que a f6 teve (10 cursos na lista, 19 na realidade). Vindo do
   AREAS, ela não tem como discordar.

   Efeito colateral bom: sem JS não nasce botão nenhum, em vez de nascer um
   botão que não abre nada.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    if (typeof AREAS === 'undefined' || !window.XpFolder) return;

    var slots = document.querySelectorAll('.of-extras-cta[data-area]');
    Array.prototype.forEach.call(slots, function (slot) {
        var dados = AREAS[slot.dataset.area];
        if (!dados || !dados.projects || !dados.projects.length) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn';
        btn.setAttribute('data-size', 's');
        btn.setAttribute('data-emphasis', 'subtle');
        btn.textContent = 'Ver ' + dados.projects.length + ' ' + (dados.unit || 'itens');

        slot.appendChild(btn);
    });

    /* O clique é DELEGADO, e não preso a cada botão. O carrossel ao lado é
       infinito POR CÓPIA: ele clona a trilha inteira, e `cloneNode` copia
       marcação, não ouvintes. Um ouvinte por botão deixaria mortos os
       botões das cópias, e são elas que aparecem em cena boa parte do
       tempo. Delegando, o botão clonado funciona por existir, sem precisar
       ter sido registrado, e o bloco não passa a depender da ordem em que
       os dois rodam. */
    document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('.of-extras-cta[data-area] .btn');
        if (!btn) return;
        var dados = AREAS[btn.closest('.of-extras-cta').dataset.area];
        if (dados && dados.projects) window.XpFolder.open(dados.projects, btn);
    });
})();

/* ══════════════════════════════════════════════════════════════════════
   Carrossel dos Extras.

   A trilha NÃO usa `overflow` (o CSS explica por quê: os vizinhos precisam
   aparecer por fora da coluna). Sem scroller nativo, este bloco responde
   por tudo: posição, arraste, snap, giro e teclado.

   ── O GIRO ──

   O carrossel é infinito POR CÓPIA: a fila de cards é montada três vezes
   seguidas e o que está em cena é sempre a do meio. Passar do último card
   apenas revela o primeiro da cópia da direita, que é idêntico a ele;
   terminada a transição, o índice recua uma banda inteira, sem animação, e
   volta pro meio. Como as três bandas são iguais e o recuo é de exatamente
   uma banda, a tela não muda um pixel no recuo: o giro não tem costura.

   A alternativa clássica (mover o primeiro card pro fim a cada volta) foi
   descartada: ela refaz o layout no meio do gesto, e o passo mudaria
   debaixo do dedo. Copiar custa DOM uma vez só e não custa nada durante o
   movimento.

   As cópias são decorativas: levam `aria-hidden` e não recebem foco, senão
   um leitor de tela anunciaria os nove conteúdos três vezes. Os `id`
   também ficam só nos originais, porque id repetido é HTML inválido. Como
   o repouso é sempre na banda do meio, o card em que se pousa é sempre o
   de verdade.

   As setas nunca mais desligam, e isso é consequência, não esquecimento:
   num carrossel que gira não existe ponta.

   ── O ARRASTE ──

   É por POINTER EVENTS, e isso é o conserto de um defeito real: com
   scroller nativo o dedo arrastava e o mouse não, porque scroller nenhum
   se arrasta com o mouse. Pointer Event é um só pros dois, então dedo e
   mouse passam a andar pelo mesmo caminho.

   Três detalhes que o arraste exige e que são fáceis de esquecer:

     1. `setPointerCapture`, senão soltar o botão fora da trilha (ou fora da
        janela) deixaria o carrossel grudado no ponteiro pra sempre;
     2. um LIMIAR antes de considerar arraste, senão o clique no botão do
        card viraria um micro-arraste e o popup nunca abriria;
     3. depois de um arraste de verdade, o `click` que o navegador dispara
        no fim tem que ser engolido uma vez, senão soltar o dedo em cima do
        botão abriria o popup sem querer.

   O `touch-action: pan-y` do CSS é o par disto: ele deixa a rolagem
   vertical da página com o navegador e manda só o horizontal pra cá.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var trilha = document.querySelector('.of-extras-cards');
    var tags = Array.prototype.slice.call(document.querySelectorAll('.of-extras-tag'));
    if (!trilha || !tags.length) return;

    var originais = Array.prototype.slice.call(trilha.querySelectorAll('.of-extras-card'));
    if (!originais.length) return;

    var N = originais.length;   /* cards de verdade; o resto é cópia */

    var LIMIAR = 8;        /* px de folga antes de virar arraste */
    var VIRADA = 0.2;      /* fração do passo que já troca de slide */

    /* ── as duas cópias ── */
    function copia(antes) {
        var pedaco = document.createDocumentFragment();
        originais.forEach(function (card) {
            var c = card.cloneNode(true);
            /* NENHUM id sobrevive na copia, nem no card nem dentro dele: id
               repetido e HTML invalido, e um dos cards traz um <svg> com
               gradiente identificado. As referencias `url(#...)` da copia
               continuam funcionando, porque elas valem no documento inteiro e
               acham a definicao que ficou no card original. */
            c.removeAttribute('id');
            Array.prototype.forEach.call(c.querySelectorAll('[id]'),
                function (e) { e.removeAttribute('id'); });
            c.setAttribute('aria-hidden', 'true');
            /* Foco não entra numa cópia: ela já está escondida do leitor de
               tela, e conteúdo focável dentro de `aria-hidden` é justamente
               a combinação que quebra a navegação por teclado (o foco vai
               parar num lugar que a leitura não anuncia). */
            Array.prototype.forEach.call(
                c.querySelectorAll('a, button, input, select, textarea, [tabindex]'),
                function (f) { f.setAttribute('tabindex', '-1'); });
            pedaco.appendChild(c);
        });
        if (antes) trilha.insertBefore(pedaco, trilha.firstChild);
        else trilha.appendChild(pedaco);
    }
    copia(false);
    copia(true);

    var slides = Array.prototype.slice.call(trilha.querySelectorAll('.of-extras-card'));

    var indice = N;        /* repouso: primeiro card da banda do meio */
    var passo = 0;
    var larg = 0;
    var arrastando = false;
    var pegou = false;
    var x0 = 0;
    var dx = 0;

    /* As duas medidas saem de `getBoundingClientRect`, que devolve FRAÇÃO.
       `offsetLeft` e `offsetWidth`, que estavam aqui, arredondam pro inteiro
       mais próximo, e o passo real é quebrado (994,4px numa janela de 1440).
       Meio pixel por card não incomodava enquanto o repouso era o índice 0;
       com o giro, o repouso passou pro índice 9 e o erro virou quase 4px, o
       bastante pra o card em cena calcular opacidade 0,9959. Como o ponteiro
       só é liberado acima de 0,999, o card da vez ficava com
       `pointer-events: none` e o botão dentro dele parava de responder.

       O rect é imune ao transform pro que interessa aqui: os dois cards
       estão deslocados igual, então a DIFERENÇA entre eles é o passo puro. */
    function mede() {
        var caixa = slides[0].getBoundingClientRect();
        larg = caixa.width;
        passo = slides.length > 1
            ? slides[1].getBoundingClientRect().left - caixa.left
            : larg;
    }

    function pinta(suave) {
        var tx = -indice * passo + dx;
        trilha.style.transition = suave ? 'transform 0.4s ease-out' : 'none';
        trilha.style.transform = 'translate3d(' + tx + 'px, 0, 0)';

        slides.forEach(function (s, i) {
            /* Quanto deste slide já passou da borda esquerda da trilha. A
               posição vem do ÍNDICE, não de uma leitura do DOM: os cards são
               todos da mesma largura, então `i * passo` é a posição exata, e
               a conta inteira fecha sem arredondamento nenhum. De quebra,
               some uma leitura de layout por card a cada quadro do arraste. */
            var fora = (indice - i) * passo - dx;
            var op = 1 - fora / larg;
            op = op < 0 ? 0 : (op > 1 ? 1 : op);
            s.style.opacity = op;
            /* Card esmaecido continua existindo e continua capturando
               clique: opacidade não é o mesmo que ausência. Como ele passa
               por cima da lateral fixa, era ele quem engolia os cliques nas
               tags, e a navegação inteira ficava morta. Só o card em cena
               (opacidade cheia) recebe ponteiro. */
            s.style.pointerEvents = op > 0.999 ? '' : 'none';
        });

        /* A tag ativa é decidida FORA do laço. Dentro dele, como três
           slides dividem a mesma tag, a última volta desmarcaria o que a
           primeira acabou de marcar. */
        var ativa = ((indice % N) + N) % N;
        tags.forEach(function (t, k) { t.classList.toggle('is-active', k === ativa); });
    }

    /* Traz o índice de volta pra banda do meio. O quadro na tela é idêntico
       antes e depois (as bandas são cópias e o recuo é de uma banda exata),
       mas os ELEMENTOS trocam de papel: o card que estava em cena vira o da
       banda vizinha, e quem assume o lugar dele estava com opacidade 0. Sem
       cortar a transição de opacidade, esse card apareceria esmaecendo
       durante 0.4s, e o giro sem costura ganharia uma piscada bem no ponto
       da emenda. A classe corta a transição, o reflow força o navegador a
       assumir os valores novos, e aí ela sai. */
    function normaliza() {
        if (pegou) return;
        var alvo = ((indice - N) % N + N) % N + N;
        if (alvo === indice) return;
        indice = alvo;
        trilha.classList.add('is-recentrando');
        pinta(false);
        void trilha.offsetWidth;
        trilha.classList.remove('is-recentrando');
    }

    trilha.addEventListener('transitionend', function (e) {
        /* `transitionend` borbulha, e os cards também transicionam (a
           opacidade). Sem este filtro, cada card terminando a transição
           dele dispararia um recuo. */
        if (e.target === trilha && e.propertyName === 'transform') normaliza();
    });

    function vaiPara(i, suave) {
        /* O limite aqui é o da FILA RENDERIZADA, não o do carrossel: ele
           não tem fim, mas o DOM tem. Um gesto violento não pode mandar a
           trilha pro vazio depois da terceira banda. */
        indice = i < 0 ? 0 : (i > slides.length - 1 ? slides.length - 1 : i);
        dx = 0;
        pinta(suave !== false);
        if (suave === false) normaliza();
    }

    /* Das três ocorrências de um card (uma por banda), a tag leva pra mais
       perto. Sem isso, clicar na última tag estando na primeira faria a
       trilha varrer oito cards pra frente, quando o vizinho da esquerda é o
       mesmo conteúdo a um passo de distância. */
    function maisPerto(logico) {
        var melhor = logico + N, dist = Infinity;
        for (var k = 0; k < 3; k++) {
            var c = logico + k * N;
            var d = Math.abs(c - indice);
            if (d < dist) { dist = d; melhor = c; }
        }
        return melhor;
    }

    tags.forEach(function (tag, i) {
        tag.addEventListener('click', function () { vaiPara(maisPerto(i)); });
    });

    /* Setas: a segunda via de navegação. Elas andam de um slide pro vizinho
       e leem o MESMO `indice` das tags, então as duas nunca discordam sobre
       o que está em cena. Nenhuma delas desliga: o carrossel gira, e a
       ponta onde o botão deixaria de cumprir a promessa não existe mais. */
    var setas = Array.prototype.slice.call(document.querySelectorAll('.of-extras-nav .lb-nav'));
    setas.forEach(function (seta) {
        seta.addEventListener('click', function () {
            vaiPara(indice + (+seta.dataset.passo));
        });
    });

    /* ── arraste ── */

    /* Sem isto o arraste morre em cima de qualquer imagem, e os cards são
       quase todos imagem. O navegador começa o arrastar NATIVO da <img>
       (aquele de soltar o arquivo em outra janela), e a partir daí ele
       para de mandar pointermove: o gesto trava no primeiro pixel. Foi
       exatamente o que aconteceu aqui, e o sintoma era "o drag não
       funciona" só nos cards com foto. `dragstart` borbulha, então um
       ouvinte na trilha cobre todas as imagens dentro dela. */
    trilha.addEventListener('dragstart', function (e) { e.preventDefault(); });

    trilha.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        pegou = true;
        arrastando = false;
        x0 = e.clientX;
        dx = 0;
    });

    trilha.addEventListener('pointermove', function (e) {
        if (!pegou) return;
        var d = e.clientX - x0;
        if (!arrastando) {
            if (Math.abs(d) < LIMIAR) return;
            arrastando = true;
            trilha.setPointerCapture(e.pointerId);
            trilha.classList.add('is-arrastando');
        }
        /* Aqui havia um freio pras pontas, dividindo o deslocamento por 3
           quando o gesto puxava pra fora do primeiro ou do último card. Ele
           saiu junto com as pontas: o que vem depois do último agora é o
           primeiro, e frear ali seria resistir a um movimento válido. */
        dx = d;
        pinta(false);
    });

    function solta(e) {
        if (!pegou) return;
        pegou = false;
        if (!arrastando) return;
        arrastando = false;
        trilha.classList.remove('is-arrastando');
        if (trilha.hasPointerCapture && trilha.hasPointerCapture(e.pointerId)) {
            trilha.releasePointerCapture(e.pointerId);
        }
        /* Quantos slides o gesto andou, em frações de passo, com o zero
           deslocado pra VIRADA contar como um salto: arrastar 20% do passo
           já troca de card, em vez dos 50% que o arredondamento puro
           exigiria. O sinal do deslocamento acompanha o sentido do gesto,
           senão um arraste pra trás precisaria de 80% pra valer. */
        var saltos = 0;
        if (passo) {
            var f = -dx / passo;
            /* o sinal sai da conta e volta no fim de propósito: arredondar o
               módulo deixa os dois sentidos idênticos. Somando o
               deslocamento direto em `f`, o gesto pra trás precisaria de um
               pixel a mais que o gesto pra frente, porque Math.round(-0.5)
               é -0 e Math.round(0.5) é 1. */
            saltos = (f < 0 ? -1 : 1) * Math.round(Math.abs(f) + (0.5 - VIRADA));
        }
        vaiPara(indice + saltos);

        /* engole o clique que fecha o gesto, uma vez só */
        trilha.addEventListener('click', function engole(ev) {
            ev.stopPropagation();
            ev.preventDefault();
            trilha.removeEventListener('click', engole, true);
        }, true);
    }
    trilha.addEventListener('pointerup', solta);
    trilha.addEventListener('pointercancel', solta);

    /* ── teclado ──
       Só as setas horizontais, de propósito.

       Home e End chegaram a ficar aqui e tiveram que sair: o
       scroll-suave.js global escuta keydown na window e trata Home, End,
       PageUp/Down, espaço e as setas VERTICAIS rolando a página, sem
       consultar `e.defaultPrevented`. Ou seja, o preventDefault daqui não
       o segura, e a tecla fazia as duas coisas ao mesmo tempo: o carrossel
       ia pra ponta e a página saltava junto.

       As setas laterais sobram livres porque aquele script não as usa. Se
       um dia Home e End forem desejáveis aqui, o conserto é lá: fazer o
       scroll-suave.js sair cedo quando o evento já foi tratado. Não fiz
       porque ele é global e vale pro site inteiro. */
    trilha.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        vaiPara(indice + d);
    });

    /* A largura do slide vem da largura da trilha, então redimensionar
       muda o passo e a posição de repouso. */
    window.addEventListener('resize', function () { mede(); pinta(false); });

    mede();
    pinta(false);
})();

/* ══════════════════════════════════════════════════════════════════════
   Conectores e partículas do diagrama do Marketplace.

   Portado do data-squads: um <path> por ficha, medido do layout REAL (quem
   posiciona as fichas é o CSS), e três partículas por conector correndo
   pelo mesmo `d`. Nada de laço por quadro: o script só monta os caminhos e
   a animação inteira é CSS.

   A curva mudou de eixo. No data-squads as fichas estão ACIMA do hub e as
   alças da bézier são verticais; aqui elas estão à ESQUERDA e à DIREITA
   dele, então as alças são horizontais. O traço sai pela borda interna da
   ficha, faz o S e entra no hub pela lateral, sem canto nem trecho reto. O
   sinal vem da própria geometria, então os quatro cantos usam a mesma conta.

   Há ainda dois conectores retos, do hub até as bordas do palco. Eles vêm
   do marketplace e existem pra o fluxo não parecer começar e terminar
   dentro do card: a máscara esmaece as pontas e eles somem na borda.

   A duração e o atraso de cada partícula são sorteados. Fixos, elas sairiam
   em fila cadenciada, que lê como esteira; sorteados, lê como fluxo.

   Este bloco roda DEPOIS do carrossel de propósito. O carrossel copia a
   fila de cards, e aqui o `querySelectorAll` pega os três palcos: o
   original e as duas cópias. Rodando antes, só o original teria observador
   de tamanho, e as cópias congelariam com os caminhos da primeira medida.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var palcos = document.querySelectorAll('.of-rede');
    if (!palcos.length) return;

    var NS = 'http://www.w3.org/2000/svg';
    var ALCA_MIN = 64;   /* alça mínima das tangentes, mantém a saída horizontal */
    var POR_TRACO = 3;   /* partículas por conector */

    function n(v) { return Math.round(v * 100) / 100; }

    /* Bézier cúbica de (x0,y0) até (x1,y1) com as duas alças na horizontal.
       A alça acompanha metade da distância, com um piso, pra a curva
       continuar suave tanto colada no hub quanto longe dele. */
    function rota(x0, y0, x1, y1) {
        var s = x1 > x0 ? 1 : -1;
        var k = Math.max(ALCA_MIN, Math.abs(x1 - x0) * 0.5) * s;
        return 'M' + n(x0) + ' ' + n(y0) +
            ' C' + n(x0 + k) + ' ' + n(y0) +
            ', ' + n(x1 - k) + ' ' + n(y1) +
            ', ' + n(x1) + ' ' + n(y1);
    }

    Array.prototype.forEach.call(palcos, function (palco) {
        var svg = palco.querySelector('.of-rede-conectores');
        var hub = palco.querySelector('.of-rede-hub');
        /* `:not` exclui as duas fichas fantasma: elas são textura de fundo,
           e um conector pra cada uma competiria com os dois ramos que já
           saem do hub pras bordas, no mesmo lugar. */
        var fichas = Array.prototype.slice.call(
            palco.querySelectorAll('.of-rede-ficha:not(.of-rede-ficha--fantasma)'));
        if (!svg || !hub || !fichas.length) return;

        var camada = document.createElement('div');
        camada.className = 'of-rede-particulas';
        camada.setAttribute('aria-hidden', 'true');
        svg.parentNode.insertBefore(camada, svg.nextSibling);

        /* Um traço por ficha, mais os dois retos do hub até as bordas. */
        var tracos = fichas.map(function (ficha) { return { ficha: ficha }; });
        tracos.push({ borda: -1 }, { borda: 1 });

        tracos.forEach(function (t) {
            t.path = document.createElementNS(NS, 'path');
            svg.appendChild(t.path);
            t.pontos = [];
            for (var i = 0; i < POR_TRACO; i++) {
                var ponto = document.createElement('span');
                ponto.className = 'of-rede-particula';
                ponto.style.setProperty('--dur', (2.5 + Math.random() * 3.5).toFixed(2) + 's');
                ponto.style.setProperty('--delay', (Math.random() * -8).toFixed(2) + 's');
                camada.appendChild(ponto);
                t.pontos.push(ponto);
            }
        });

        function desenha() {
            var c = palco.getBoundingClientRect();
            if (!c.width) return;
            svg.setAttribute('viewBox', '0 0 ' + c.width + ' ' + c.height);

            var h = hub.getBoundingClientRect();
            var hEsq = h.left - c.left, hDir = h.right - c.left;
            var hMeio = h.top - c.top + h.height / 2;

            tracos.forEach(function (t) {
                var d;
                if (t.ficha) {
                    var r = t.ficha.getBoundingClientRect();
                    var esq = r.left - c.left, dir = r.right - c.left;
                    /* Cada ponta encosta na borda virada pro outro: a ficha da
                       esquerda sai pela direita dela e chega na esquerda do
                       hub, e vice-versa. */
                    var aEsquerda = (esq + dir) / 2 < (hEsq + hDir) / 2;
                    d = rota(aEsquerda ? dir : esq, r.top - c.top + r.height / 2,
                             aEsquerda ? hEsq : hDir, hMeio);
                } else {
                    /* Os dois ramos que saem do hub pras bordas do palco. Eles
                       eram horizontais e agora terminam 32px fora da altura do
                       hub: o da direita sobe, o da esquerda desce. É a mesma
                       bézier dos outros, então o desvio acontece ao longo do
                       trecho inteiro em vez de num cotovelo no fim. */
                    var pra = t.borda < 0;
                    d = rota(pra ? hEsq : hDir, hMeio,
                             pra ? 0 : c.width, hMeio + (pra ? 32 : -32));
                }
                t.path.setAttribute('d', d);
                var caminho = 'path("' + d + '")';
                t.pontos.forEach(function (p) { p.style.offsetPath = caminho; });
            });
        }

        desenha();
        if (window.ResizeObserver) {
            var ro = new ResizeObserver(desenha);
            ro.observe(palco);
            fichas.forEach(function (f) { ro.observe(f); });
        } else {
            window.addEventListener('resize', desenha);
        }
        /* As fichas mudam de largura quando a fonte chega, e o traço é medido
           a partir delas: sem este redesenho ele ficaria preso à medida que o
           texto tinha com a fonte de sistema. */
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(desenha);

        /* Fora da tela, nada anima. */
        if (window.IntersectionObserver) {
            new IntersectionObserver(function (e) {
                palco.classList.toggle('is-paused', !e[0].isIntersecting);
            }, { rootMargin: '128px' }).observe(palco);
        }
    });
})();

/* ══════════════════════════════════════════════════════════════════════
   Animacao so quando o bloco esta em cena.

   Um observador so, pros blocos que animam sozinhos o tempo todo: o foil
   dos dois tickets e as esteiras (a da comunidade, a dos selos, e as copias
   que o carrossel faz de cada uma). Fora da tela eles ganham `.of-parado` e
   congelam.

   Por que centralizar: cada bloco desses ja nasceu com o seu proprio
   IntersectionObserver ou com nenhum, e a regra "pausa quando sai" e a
   mesma pra todos. Espalhada, ela some no bloco seguinte que alguem
   acrescentar, que foi o que aconteceu com as esteiras.

   A margem de 128px liga o bloco um pouco antes de ele aparecer: pausado
   ate o ultimo pixel, a esteira entraria na tela parada por um quadro.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    if (!window.IntersectionObserver) return;

    var blocos = document.querySelectorAll(
        '.of-ticket, .of-card-midia--esteira, .of-card-midia--selos');
    if (!blocos.length) return;

    var olho = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            e.target.classList.toggle('of-parado', !e.isIntersecting);
        });
    }, { rootMargin: '128px' });

    Array.prototype.forEach.call(blocos, function (b) { olho.observe(b); });
})();

/* ══════════════════════════════════════════════════════════════════════
   CTA fixo: visibilidade.

   Portado do "Visibilidade do CTA flutuante" da /ed/infinite-pass/oferta/.
   A faixa aparece quando o botão do topo NÃO está na tela, ou seja, do
   comparativo pra baixo (lá na origem ela também sumia sobre os tickets;
   aqui ela já vale sobre os cards da oferta). O estado é um CONJUNTO de
   quem está em cena, e não um contador: o observador dispara uma vez por
   elemento logo no registro, inclusive pros que estão fora da tela, e um
   contador iria pra negativo.

   Sem IntersectionObserver ela simplesmente não aparece, que é o estado
   padrão: melhor isso do que fixa o tempo todo cobrindo o conteúdo.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var faixa = document.getElementById('bf-rodape-cta');
    var pontos = document.querySelectorAll('.bf-hero-acao');
    if (!faixa || !pontos.length || !window.IntersectionObserver) return;

    var emCena = new Set();

    function pinta() {
        var mostrar = emCena.size === 0;
        faixa.classList.toggle('is-visivel', mostrar);
        faixa.setAttribute('aria-hidden', mostrar ? 'false' : 'true');
    }

    var olho = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            if (e.isIntersecting) emCena.add(e.target);
            else emCena.delete(e.target);
        });
        pinta();
    });

    Array.prototype.forEach.call(pontos, function (p) { olho.observe(p); });
})();

/* ══════════════════════════════════════════════════════════════════════
   Contagem no CTA fixo (porte da v2 da /ed/bf/ (já removida)).

   Dias, horas e minutos até o data-alvo (06/11/2026, 00h de Brasília,
   com o fuso escrito na data pra valer em qualquer relógio). A precisão
   é de minuto, então 15s de intervalo bastam. Passado o alvo, para em
   00 00 00.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var caixa = document.querySelector('.bf-contagem[data-alvo]');
    if (!caixa) return;
    var alvo = new Date(caixa.dataset.alvo).getTime();
    if (isNaN(alvo)) return;

    var campos = {
        d: caixa.querySelector('[data-un="d"]'),
        h: caixa.querySelector('[data-un="h"]'),
        m: caixa.querySelector('[data-un="m"]')
    };
    function dois(n) { return (n < 10 ? '0' : '') + n; }

    var timer;
    function atualiza() {
        var falta = Math.max(0, alvo - Date.now());
        if (campos.d) campos.d.textContent = dois(Math.floor(falta / 86400000));
        if (campos.h) campos.h.textContent = dois(Math.floor((falta % 86400000) / 3600000));
        if (campos.m) campos.m.textContent = dois(Math.floor((falta % 3600000) / 60000));
        if (!falta) clearInterval(timer);
    }
    atualiza();
    timer = setInterval(atualiza, 15000);
})();
/* ══════════════════════════════════════════════════════════════════════
   FAQ (porte da v2 da /ed/bf/ (já removida)).

   Clique na linha inteira. Abrir liga o <details> primeiro e só no
   quadro seguinte anima o grid de 0fr pra 1fr; fechar anima e só desliga
   o <details> no fim da transição.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    document.querySelectorAll('.sec-faq .faq-row').forEach(function (details) {
        var grid = details.querySelector('.faq-a-grid');
        var icon = details.querySelector('.faq-q-icon');
        if (!grid) return;
        details.addEventListener('click', function (e) {
            e.preventDefault();
            if (!details.open) {
                details.open = true;
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        grid.classList.add('is-open');
                        if (icon) icon.textContent = 'remove';
                    });
                });
            } else {
                grid.classList.remove('is-open');
                if (icon) icon.textContent = 'add';
                if (BF_SEM_MOVIMENTO) { details.open = false; return; }
                grid.addEventListener('transitionend', function () {
                    details.open = false;
                }, { once: true });
            }
        });
    });
})();