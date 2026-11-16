/*
 * Progressive blur (projeto IEDA)
 *
 * Aplica um blur que cresce de cima para baixo no PRÓPRIO elemento.
 * Uso:
 *   <div class="pblur" data-pblur-from="0" data-pblur-to="8">
 *     <div class="sua-forma"></div>
 *   </div>
 *
 * Atributos:
 *   data-pblur-from   blur no topo, em px (padrão 0)
 *   data-pblur-to     blur na base, em px (padrão 8)
 *   data-pblur-steps  quantidade de camadas (padrão: 1 por px, mínimo 2)
 *   data-pblur-dir    direção do from para o to: bottom (padrão), top, right ou left
 *
 * Como funciona: o conteúdo é clonado em N camadas, cada uma com um blur fixo
 * (interpolado entre from e to) e uma máscara vertical que mostra só a faixa
 * dela. As faixas se cruzam e se SOMAM (plus-lighter dentro de um grupo
 * isolado), então a transição entre níveis de blur é contínua.
 *
 * API (para animações):
 *   const pb = progressiveBlur(el, { from: 0, to: 8, steps: 9, dir: 'bottom' });
 *   pb.set({ from: 2, to: 16 });   // muda os valores sem recriar camadas
 */
(function () {
    function pct(p) {
        // posição p (0..1) dentro da forma, convertida para a caixa da camada,
        // que é maior que a forma em --pblur-pad de cada lado
        return 'calc(var(--pblur-pad) + (100% - 2 * var(--pblur-pad)) * ' + p.toFixed(4) + ')';
    }

    function maskFor(i, n, dir) {
        // n = número de faixas (camadas - 1); posições p_k = k / n
        var p = function (k) { return pct(Math.min(Math.max(k / n, 0), 1)); };
        if (n === 0) return 'linear-gradient(#000, #000)';
        // máscara em "tenda": entra de p(i-1) a p(i), sai de p(i) a p(i+1).
        // As tendas vizinhas somam exatamente 1 e as camadas se somam via
        // mix-blend-mode: plus-lighter (ver CSS), então não há listra nem
        // acúmulo de opacidade em formas semitransparentes.
        var stops = [];
        if (i === 0) {
            stops.push('#000 0%', '#000 ' + p(0));
        } else {
            stops.push('transparent 0%', 'transparent ' + p(i - 1), '#000 ' + p(i));
        }
        if (i === n) {
            stops.push('#000 100%');
        } else {
            stops.push('transparent ' + p(i + 1), 'transparent 100%');
        }
        return 'linear-gradient(to ' + dir + ', ' + stops.join(', ') + ')';
    }

    function progressiveBlur(el, opts) {
        opts = opts || {};
        var from = opts.from != null ? +opts.from : +(el.dataset.pblurFrom || 0);
        var to = opts.to != null ? +opts.to : +(el.dataset.pblurTo || 8);
        var steps = opts.steps != null ? +opts.steps : +(el.dataset.pblurSteps || 0);
        if (!steps) steps = Math.max(2, Math.round(Math.abs(to - from)) + 1);
        var dir = opts.dir || el.dataset.pblurDir || 'bottom';

        var source = el.firstElementChild;
        if (!source) return null;

        el.classList.add('pblur');
        source.classList.add('pblur-source');

        var layers = [];
        for (var i = 0; i < steps; i++) {
            var layer = document.createElement('div');
            layer.className = 'pblur-layer';
            layer.setAttribute('aria-hidden', 'true');
            var m = maskFor(i, steps - 1, dir);
            layer.style.webkitMaskImage = m;
            layer.style.maskImage = m;
            var clone = source.cloneNode(true);
            clone.classList.remove('pblur-source');
            clone.classList.add('pblur-clone');
            layer.appendChild(clone);
            el.appendChild(layer);
            layers.push(clone);
        }

        function set(v) {
            if (v.from != null) from = +v.from;
            if (v.to != null) to = +v.to;
            var max = Math.max(from, to);
            el.style.setProperty('--pblur-pad', Math.ceil(max * 3) + 'px');
            for (var k = 0; k < layers.length; k++) {
                var t = layers.length === 1 ? 0 : k / (layers.length - 1);
                var b = from + (to - from) * t;
                layers[k].style.filter = b > 0 ? 'blur(' + b.toFixed(2) + 'px)' : 'none';
            }
        }

        set({});
        return { el: el, layers: layers, set: set };
    }

    window.progressiveBlur = progressiveBlur;

    function init() {
        var els = document.querySelectorAll('[data-pblur-to], [data-pblur-from]');
        for (var i = 0; i < els.length; i++) {
            if (!els[i].__pblur) els[i].__pblur = progressiveBlur(els[i]);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
