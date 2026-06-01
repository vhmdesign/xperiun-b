/* form.js — comportamento compartilhado pra todos os popups .popup-form.
   Itera sobre cada .popup-form na página e instala: máscara BR no phone,
   captura UTM da URL, validação dos required (nome/email/phone), submissão
   JSONP via injeção de <script> pra activehosted.com/proc.php, fechamento
   via Cancelar/backdrop/ESC.

   Suporte opcional a reCAPTCHA v2: se a popup tiver um <div class="g-recaptcha"
   data-sitekey="..."> dentro do <form>, a API do Google é carregada uma vez,
   o widget é renderizado, e o token é validado antes do submit. O input
   hidden g-recaptcha-response (injetado pelo widget) entra na serialização
   automaticamente.

   Idempotente por popup via dataset.wired. Expõe window.openPopup(id). */
(function () {
    // ── reCAPTCHA loader (singleton) ─────────────────────────────
    let recaptchaApiPromise = null;
    function loadRecaptchaApi() {
        if (recaptchaApiPromise) return recaptchaApiPromise;
        recaptchaApiPromise = new Promise((resolve) => {
            if (window.grecaptcha && window.grecaptcha.render) {
                resolve();
                return;
            }
            window.__popupFormRecaptchaReady = () => resolve();
            const s = document.createElement('script');
            s.src = 'https://www.google.com/recaptcha/api.js?onload=__popupFormRecaptchaReady&render=explicit';
            s.async = true;
            s.defer = true;
            document.head.appendChild(s);
        });
        return recaptchaApiPromise;
    }

    function initRecaptcha(modal) {
        const el = modal.querySelector('.g-recaptcha');
        if (!el) return null;
        const sitekey = el.getAttribute('data-sitekey');
        if (!sitekey || sitekey.indexOf('TODO') === 0) {
            console.warn('[form] reCAPTCHA sitekey ausente/TODO em', modal.id);
            return el;
        }
        if (!el.id) el.id = 'recaptcha-' + modal.id;
        loadRecaptchaApi().then(() => {
            if (el.dataset.rendered === '1') return;
            const widgetId = window.grecaptcha.render(el.id, { sitekey });
            el.dataset.widgetId = String(widgetId);
            el.dataset.rendered = '1';
        });
        return el;
    }

    function initModal(modal) {
        if (modal.dataset.wired === '1') return;
        modal.dataset.wired = '1';

        const form     = modal.querySelector('form');
        const cancel   = modal.querySelector('.popup-form-cancel');
        const backdrop = modal.querySelector('.popup-form-backdrop');
        const success  = modal.querySelector('.popup-form-success');
        const phoneIn  = modal.querySelector('input[name="phone"]');
        if (!form) return;

        const recaptchaEl = initRecaptcha(modal);

        function close() { modal.classList.remove('is-open'); }
        cancel?.addEventListener('click', close);
        backdrop?.addEventListener('click', close);

        // UTM capture (preenche field[N] a partir da URL atual)
        const params = new URLSearchParams(location.search);
        const utmMap = {
            utm_medium:   'field[4]',
            utm_content:  'field[5]',
            utm_campaign: 'field[2]',
            utm_source:   'field[3]',
            sck:          'field[60]',
            utm_term:     'field[103]',
        };
        for (const [param, fieldName] of Object.entries(utmMap)) {
            const v = params.get(param);
            if (v) {
                const el = modal.querySelector(`input[name="${fieldName}"]`);
                if (el) el.value = v;
            }
        }

        // Máscara BR: (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
        phoneIn?.addEventListener('input', () => {
            let v = phoneIn.value.replace(/\D/g, '').slice(0, 11);
            if (v.length > 10)      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
            else if (v.length > 6)  v = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
            else if (v.length > 2)  v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
            else if (v.length > 0)  v = `(${v}`;
            phoneIn.value = v;
        });

        function showError(input, show) {
            const group = input.closest('.input-group');
            if (group) group.classList.toggle('is-error', show);
            const err = group?.querySelector('.input-error-text');
            if (err) err.style.display = show ? '' : 'none';
        }

        function validate() {
            let ok = true;
            const fullname = form.fullname;
            const email    = form.email;
            const phone    = form.phone;

            const nameOk = fullname.value.trim().length >= 2;
            showError(fullname, !nameOk); ok = ok && nameOk;

            const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
            showError(email, !emailOk); ok = ok && emailOk;

            const phoneRaw = phone.value.replace(/\D/g, '');
            const phoneOk  = phoneRaw.length === 10 || phoneRaw.length === 11;
            showError(phone, !phoneOk); ok = ok && phoneOk;

            if (recaptchaEl && window.grecaptcha) {
                const wid = recaptchaEl.dataset.widgetId;
                const token = window.grecaptcha.getResponse(wid === undefined ? undefined : Number(wid));
                const captchaOk = !!token;
                recaptchaEl.classList.toggle('is-error', !captchaOk);
                ok = ok && captchaOk;
            }

            return ok;
        }

        function serialize(f) {
            const out = [];
            for (const el of f.elements) {
                if (!el.name || el.disabled || el.type === 'submit' || el.type === 'button') continue;
                out.push(encodeURIComponent(el.name) + '=' + encodeURIComponent(el.value));
            }
            return out.join('&');
        }

        function submit() {
            const url = form.action + '?' + serialize(form) + '&jsonp=true';
            const s = document.createElement('script');
            s.src = url;
            s.onload  = () => { form.hidden = true; if (success) success.hidden = false; };
            s.onerror = () => { alert('Erro ao enviar. Tente novamente.'); };
            document.head.appendChild(s);
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validate()) submit();
        });
    }

    let escWired = false;
    function init() {
        document.querySelectorAll('.popup-form').forEach(initModal);
        if (!escWired) {
            document.addEventListener('keydown', (e) => {
                if (e.key !== 'Escape') return;
                document.querySelectorAll('.popup-form.is-open').forEach(m => m.classList.remove('is-open'));
            });
            escWired = true;
        }
    }

    // API pública pra abrir popup por ID. Ex: openPopup('popup-form-f2')
    window.openPopup = function (id) {
        document.getElementById(id)?.classList.add('is-open');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
