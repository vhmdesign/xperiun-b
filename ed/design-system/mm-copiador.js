(function () {
    function rgbToHex(rgbString) {
        const nums = rgbString.match(/\d+/g);
        if (!nums || nums.length < 3) return null;
        const [r, g, b] = nums.map(Number);
        return '#' + [r, g, b]
            .map(v => v.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
    }

    function findHex(text) {
        if (!text) return null;
        const m = text.match(/#[0-9A-Fa-f]{6}\b/);
        return m ? m[0].toUpperCase() : null;
    }

    function getHexFor(el) {
        let hex = findHex(el.textContent);
        if (hex) return hex;

        if (el.parentElement) {
            hex = findHex(el.parentElement.textContent);
            if (hex) return hex;
        }

        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            return rgbToHex(bg);
        }
        return null;
    }

    async function copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch (_) { /* fallback abaixo */ }

        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);

        const selection = document.getSelection();
        const savedRange = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);

        let ok = false;
        try { ok = document.execCommand('copy'); } catch (_) { ok = false; }

        document.body.removeChild(textarea);
        if (savedRange) {
            selection.removeAllRanges();
            selection.addRange(savedRange);
        }
        return ok;
    }

    let toastEl = null;
    let toastTimer = null;
    function showToast(message) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.id = 'mm-cores-toast';
            Object.assign(toastEl.style, {
                position: 'fixed',
                bottom: '32px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 10, 0.92)',
                color: '#F5FAFF',
                padding: '12px 20px',
                borderRadius: '8px',
                fontFamily: '"Poppins", sans-serif',
                fontSize: '14px',
                letterSpacing: '0.02em',
                zIndex: '9999',
                pointerEvents: 'none',
                opacity: '0',
                transition: 'opacity 0.2s ease'
            });
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = message;
        requestAnimationFrame(() => { toastEl.style.opacity = '1'; });
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toastEl.style.opacity = '0'; }, 1500);
    }

    function isColorSwatch(el) {
        const classes = [...el.classList];
        if (!classes.some(c => c.startsWith('mm-cores-'))) return false;
        if (classes.some(c => c.startsWith('container-'))) return false;
        if (classes.includes('mm-cores-40')) return false;
        if (classes.includes('mm-cores-titulo')) return false;
        return true;
    }

    function flashCode(el) {
        el.classList.add('is-copied');
        setTimeout(() => el.classList.remove('is-copied'), 600);
    }

    document.addEventListener('click', async (e) => {
        // code.copy: copia o textContent do elemento
        const codeEl = e.target.closest('code.copy');
        if (codeEl) {
            const text = codeEl.textContent;
            const ok = await copyToClipboard(text);
            if (ok) flashCode(codeEl);
            showToast(ok ? `"${text}" copiado` : 'Falha ao copiar');
            return;
        }

        // color swatches
        let target = e.target;
        while (target && target !== document.body) {
            if (target.classList && isColorSwatch(target)) break;
            target = target.parentElement;
        }
        if (!target || target === document.body) return;

        const hex = getHexFor(target);
        if (!hex) return;

        const ok = await copyToClipboard(hex);
        showToast(ok ? `${hex} copiado` : 'Falha ao copiar');
    });

    const cursorStyle = document.createElement('style');
    cursorStyle.textContent = `
        [class*="mm-cores-"]:not([class*="container-"]):not(.mm-cores-40):not(.mm-cores-titulo) {
            cursor: pointer;
        }
        code.copy {
            cursor: pointer;
            user-select: none;
            transition: opacity 0.15s;
        }
        code.copy.is-copied {
            opacity: 0.5;
        }
    `;
    document.head.appendChild(cursorStyle);
})();
