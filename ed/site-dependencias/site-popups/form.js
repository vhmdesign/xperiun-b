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

    // Normaliza telefone BR para E.164 (+55DDDNUMERO). Forms novos da AC
    // têm campo de telefone internacional e EXIGEM esse formato; os antigos
    // (texto simples) também aceitam. Padrão único pra TODOS os forms — atuais
    // e futuros — já que este form.js é compartilhado.
    function toE164BR(raw) {
        var d = String(raw || '').replace(/\D/g, '');
        if (!d) return '';
        if (d.length > 11 && d.indexOf('55') === 0) return '+' + d; // já vem com código do país
        return '+55' + d;
    }

    function initModal(modal) {
        if (modal.dataset.wired === '1') return;
        modal.dataset.wired = '1';

        const form     = modal.querySelector('form');
        const cancels  = modal.querySelectorAll('.popup-form-cancel');
        const backdrop = modal.querySelector('.popup-form-backdrop');
        const success  = modal.querySelector('.popup-form-success');
        const phoneIn  = modal.querySelector('input[name="phone"]');
        if (!form) return;

        const recaptchaEl = initRecaptcha(modal);

        // Dropdowns (design system) — cada .dropdown-group seta o hidden input
        // do seu .input-group ao selecionar uma opção (data-value ou texto).
        const dropdowns = [];
        modal.querySelectorAll('.dropdown-group').forEach((group) => {
            const trigger = group.querySelector('.dropdown');
            const opts    = group.querySelector('.dropdown-options');
            const label   = trigger?.querySelector('.dropdown-placeholder, .dropdown-value');
            const icon    = trigger?.querySelector('.dropdown-icon');
            const hidden  = group.closest('.input-group')?.querySelector('input[type="hidden"]');
            const gap     = 8;
            if (!trigger || !opts || !label) return;
            dropdowns.push({ group, hidden });

            function getClipContainer() {
                let el = group.parentElement;
                while (el && el !== document.body) {
                    const s = getComputedStyle(el);
                    if (s.overflow === 'hidden' || s.overflowY === 'hidden') return el;
                    el = el.parentElement;
                }
                return document.documentElement;
            }

            function openDropdown() {
                const container = getClipContainer();
                const cRect = container.getBoundingClientRect();
                const gRect = group.getBoundingClientRect();
                opts.style.maxHeight  = '';
                opts.style.visibility = 'hidden';
                opts.style.display    = 'block';
                const optH = opts.offsetHeight;
                opts.style.display    = '';
                opts.style.visibility = '';
                const spaceBelow = cRect.bottom - gRect.bottom - gap;
                const spaceAbove = gRect.top - cRect.top - gap;
                if (spaceBelow >= optH) {
                    group.classList.remove('is-open-up');
                    opts.style.maxHeight = '';
                } else if (spaceAbove >= optH) {
                    group.classList.add('is-open-up');
                    opts.style.maxHeight = '';
                } else {
                    group.classList.remove('is-open-up');
                    opts.style.maxHeight = Math.max(spaceBelow, 40) + 'px';
                }
                group.classList.add('is-open');
                if (icon) icon.textContent = 'expand_less';
            }

            function closeDropdown() {
                group.classList.remove('is-open', 'is-open-up');
                opts.style.maxHeight = '';
                if (icon) icon.textContent = 'expand_more';
            }

            /* Safari iOS: elementos não-padrão (<div>/<li>) só recebem
               click reliably com role="button" + tabindex. Sem isso,
               taps na trigger podem não disparar o handler. */
            trigger.setAttribute('role', 'button');
            trigger.setAttribute('tabindex', '0');
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                group.classList.contains('is-open') ? closeDropdown() : openDropdown();
            });
            trigger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    group.classList.contains('is-open') ? closeDropdown() : openDropdown();
                }
            });

            group.querySelectorAll('.dropdown-option').forEach((opt) => {
                opt.setAttribute('role', 'option');
                opt.setAttribute('tabindex', '0');
                const select = (e) => {
                    e.stopPropagation();
                    label.textContent = opt.textContent.trim();
                    label.className   = 'dropdown-value';
                    if (hidden) hidden.value = opt.dataset.value ?? opt.textContent.trim();
                    const ig = group.closest('.input-group');
                    if (ig) ig.classList.remove('is-error');
                    const err = ig?.querySelector('.input-error-text');
                    if (err) err.style.display = 'none';
                    closeDropdown();
                };
                opt.addEventListener('click', select);
                opt.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        select(e);
                    }
                });
            });
        });

        function close() { modal.classList.remove('is-open'); }
        cancels.forEach(b => b.addEventListener('click', close));
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

            for (const d of dropdowns) {
                const dropOk = !!(d.hidden && d.hidden.value);
                const ig = d.group.closest('.input-group');
                if (ig) ig.classList.toggle('is-error', !dropOk);
                const err = ig?.querySelector('.input-error-text');
                if (err) err.style.display = dropOk ? 'none' : '';
                ok = ok && dropOk;
            }

            return ok;
        }

        function serialize(f) {
            const out = [];
            for (const el of f.elements) {
                if (!el.name || el.disabled || el.type === 'submit' || el.type === 'button') continue;
                const val = el.name === 'phone' ? toE164BR(el.value) : el.value;
                out.push(encodeURIComponent(el.name) + '=' + encodeURIComponent(val));
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
    let docClickWired = false;
    function init() {
        document.querySelectorAll('.popup-form').forEach(initModal);
        if (!escWired) {
            document.addEventListener('keydown', (e) => {
                if (e.key !== 'Escape') return;
                document.querySelectorAll('.popup-form.is-open').forEach(m => m.classList.remove('is-open'));
            });
            escWired = true;
        }
        // Clique fora fecha qualquer dropdown aberto (trigger/opção usam stopPropagation).
        if (!docClickWired) {
            document.addEventListener('click', () => {
                document.querySelectorAll('.dropdown-group.is-open').forEach((g) => {
                    g.classList.remove('is-open', 'is-open-up');
                    const o = g.querySelector('.dropdown-options'); if (o) o.style.maxHeight = '';
                    const ic = g.querySelector('.dropdown-icon');   if (ic) ic.textContent = 'expand_more';
                });
            });
            docClickWired = true;
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
