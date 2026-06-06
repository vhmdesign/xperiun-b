// scroll-suave.js
// Lerp-based smooth scroll. Sem dependências, sem wrappers de DOM.
// Funciona com position:fixed, âncoras e qualquer JS que mude scrollY.
(function () {

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Touch-only (sem mouse) NÃO precisa de wheel/keyboard handlers — esses
    // eventos não disparam. Mas o CLICK handler precisa rodar em todos os
    // devices pra dar smooth nas âncoras com lerp controlado (e ainda
    // respeitar `data-scroll-to="end"`).
    const hasFinePonter = window.matchMedia('(pointer: fine)').matches;
    const isTouch = 'ontouchstart' in window;
    const isTouchOnly = isTouch && !hasFinePonter;

    // ─── Configuração ────────────────────────────────────────────────────────
    const EASE      = 0.12;   // 0.05 = mais suave / 0.15 = mais direto
    const THRESHOLD = 0.4;    // px — diferença mínima para continuar animando

    // ─── Estado ──────────────────────────────────────────────────────────────
    let current = 0;
    let target  = 0;
    let running = false;

    // ─── Helpers ─────────────────────────────────────────────────────────────
    function limit() {
        return document.documentElement.scrollHeight - window.innerHeight;
    }

    function clamp(v) {
        return Math.max(0, Math.min(v, limit()));
    }

    // ─── Loop RAF ────────────────────────────────────────────────────────────
    function tick() {
        const diff = target - current;

        if (Math.abs(diff) < THRESHOLD) {
            current = target;
            window.scrollTo(0, current);
            running = false;
            return;
        }

        current += diff * EASE;
        window.scrollTo(0, current);
        requestAnimationFrame(tick);
    }

    function move(dy) {
        target = clamp(target + dy);
        if (!running) {
            running = true;
            current = window.scrollY;
            requestAnimationFrame(tick);
        }
    }

    // ─── Sincroniza quando scroll muda por fonte externa (âncoras, JS) ───────
    window.addEventListener('scroll', function () {
        if (!running) {
            current = window.scrollY;
            target  = window.scrollY;
        }
    }, { passive: true });

    // ─── Resize: reclampa para não ultrapassar novo limite ───────────────────
    window.addEventListener('resize', function () {
        target  = clamp(target);
        current = clamp(current);
    });

    // ─── Âncoras: intercepta <a href="#..."> e anima via lerp ────────────────
    // Sempre ativo (desktop + mobile) pra dar comportamento uniforme.
    // Usa offsetTop walk (não getBoundingClientRect) pra ignorar transforms
    // aplicados ao alvo — ex: sec-oferta tem translateY(pin) quando o usuário
    // está em anuidade. Com rect.top, o destino ficava deslocado pelo pin.
    function getNaturalTop(el) {
        let y = 0;
        let cur = el;
        while (cur) {
            y += cur.offsetTop;
            cur = cur.offsetParent;
        }
        return y;
    }

    document.addEventListener('click', function (e) {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;

        const id = a.getAttribute('href').slice(1);
        if (!id) return;

        const el = document.getElementById(id);
        if (!el) return;

        e.preventDefault();
        const dest = clamp(getNaturalTop(el));
        target  = dest;
        current = window.scrollY;
        running = true;
        requestAnimationFrame(tick);
    });

    // Wheel + keyboard só fazem sentido em devices com fine pointer.
    if (isTouchOnly) return;

    // ─── Wheel ───────────────────────────────────────────────────────────────
    function isInsideHorizontalScroller(el) {
        while (el && el !== document.documentElement) {
            if (el.scrollWidth > el.clientWidth + 2) {
                const ox = getComputedStyle(el).overflowX;
                if (ox === 'auto' || ox === 'scroll') return true;
            }
            el = el.parentElement;
        }
        return false;
    }

    window.addEventListener('wheel', function (e) {
        // Só deixa o scroll horizontal nativo quando a intenção é horizontal
        // (trackpad swipe com deltaX dominante ou shift+wheel). Wheel vertical sempre
        // rola a página, mesmo sobre carrosséis com overflow-x: auto.
        const horizontalIntent = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
        if (horizontalIntent && isInsideHorizontalScroller(e.target)) return;

        e.preventDefault();

        let dy = e.deltaY;
        if (e.deltaMode === 1) dy *= 40;              // Firefox: linhas → px
        if (e.deltaMode === 2) dy *= window.innerHeight; // modo página

        move(dy);
    }, { passive: false });

    // ─── Teclado ─────────────────────────────────────────────────────────────
    window.addEventListener('keydown', function (e) {
        const active = document.activeElement;
        const tag = active && active.tagName;

        // Não intercepta quando foco está em input/textarea/select/button
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        const LINE = 120;
        const PAGE = window.innerHeight * 0.88;

        switch (e.key) {
            case 'ArrowDown':  e.preventDefault(); move(LINE);           break;
            case 'ArrowUp':    e.preventDefault(); move(-LINE);          break;
            case 'PageDown':   e.preventDefault(); move(PAGE);           break;
            case 'PageUp':     e.preventDefault(); move(-PAGE);          break;
            case ' ':          e.preventDefault(); move(PAGE * (e.shiftKey ? -1 : 1)); break;
            case 'Home':
                e.preventDefault();
                target = 0;
                if (!running) { running = true; current = window.scrollY; requestAnimationFrame(tick); }
                break;
            case 'End':
                e.preventDefault();
                target = limit();
                if (!running) { running = true; current = window.scrollY; requestAnimationFrame(tick); }
                break;
        }
    });

})();
