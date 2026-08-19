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

    // ── Telefone internacional (Brasil + Portugal) ───────────────────
    // Um seletor de país (injetado à esquerda do input de phone por
    // setupPhone) define o país ativo; máscara, validação e normalização
    // E.164 seguem esse país. Forms novos da AC têm campo de telefone
    // internacional e EXIGEM E.164; os antigos (texto simples) também
    // aceitam. Padrão único pra TODOS os forms, atuais e futuros, já que
    // este form.js é compartilhado. Pra adicionar um país, basta uma
    // entrada aqui (dial, code, national, máscara via maskPhone).
    var COUNTRIES = {
        BR: { dial: '+55',  code: '55',  flag: '🇧🇷', name: 'Brasil',   national: 11,
              placeholder: '(11) 99999-9999', error: 'Informe um WhatsApp válido com DDD.' },
        PT: { dial: '+351', code: '351', flag: '🇵🇹', name: 'Portugal', national: 9,
              placeholder: '912 345 678',     error: 'Indique um número de telemóvel válido.' },
    };
    function onlyDigits(raw) { return String(raw || '').replace(/\D/g, ''); }

    // Máscara por país: BR (XX) XXXXX-XXXX / PT XXX XXX XXX (9 dígitos).
    function maskPhone(raw, cc) {
        var d = onlyDigits(raw);
        if (cc === 'PT') {
            d = d.slice(0, 9);
            if (d.length > 6) return d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6);
            if (d.length > 3) return d.slice(0, 3) + ' ' + d.slice(3);
            return d;
        }
        d = d.slice(0, 11);
        if (d.length > 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
        if (d.length > 6)  return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
        if (d.length > 2)  return '(' + d.slice(0, 2) + ') ' + d.slice(2);
        if (d.length > 0)  return '(' + d;
        return '';
    }

    // BR: 10 (fixo) ou 11 (celular) dígitos. PT: 9 dígitos.
    function phoneValid(raw, cc) {
        var n = onlyDigits(raw).length;
        return cc === 'PT' ? n === 9 : (n === 10 || n === 11);
    }

    // Normaliza pro E.164 (+<code><numero>) conforme o país selecionado.
    function toE164(raw, cc) {
        var c = COUNTRIES[cc] || COUNTRIES.BR;
        var d = onlyDigits(raw);
        if (!d) return '';
        if (d.indexOf(c.code) === 0 && d.length > c.national) return '+' + d; // já veio com o código do país
        return c.dial + d;
    }

    // ── Respostas da ActiveCampaign ──────────────────────────────────
    // O proc.php?jsonp=true devolve JS que chama estas funções globais.
    // Sucesso REAL = redirect (window.top.location, executa sozinho) ou
    // _show_thank_you. Erro de validação (ex.: telefone inválido) = _show_error.
    // Antes o form.js mostrava sucesso só por o script ter carregado, então
    // envio recusado dava "sucesso" falso. Agora respeitamos a resposta.
    function acModalById(id) {
        var f = document.getElementById('_form_' + id + '_');
        return f ? f.closest('.popup-form') : null;
    }
    function showFormError(modal, message) {
        var form = modal && modal.querySelector('form');
        if (!form) return;
        var box = form.querySelector('.popup-form-error');
        if (!box) {
            box = document.createElement('p');
            box.className = 'popup-form-error';
            var actions = form.querySelector('.popup-form-actions');
            actions ? form.insertBefore(box, actions) : form.appendChild(box);
        }
        box.textContent = message || 'Não foi possível enviar. Confira os dados e tente novamente.';
        box.hidden = false;
    }
    window._load_script = window._load_script || function () {};   // tracking da AC: ignorado
    window._show_thank_you = function (id) {
        var modal = acModalById(id);
        if (!modal) return;
        var form = modal.querySelector('form');
        var success = modal.querySelector('.popup-form-success');
        if (form) form.hidden = true;
        if (success) success.hidden = false;
    };
    window._show_error = function (id, message) {
        var modal = acModalById(id);
        if (!modal) return;
        var form = modal.querySelector('form');
        var success = modal.querySelector('.popup-form-success');
        if (success) success.hidden = true;   // nunca mostra sucesso quando há erro
        if (form) form.hidden = false;
        // A AC devolve o formato internacional "(formato +XXXXXXXXXXXXX)",
        // confuso pro usuário. Troca pelo exemplo do país selecionado.
        if (message) {
            var codeEl = modal.querySelector('.popup-form-country-code');
            var hint = codeEl && codeEl.textContent === '+351' ? '9XX XXX XXX' : '(DDD) XXXXX-XXXX';
            message = message.replace(/\(formato\s*\+X+\)/i, '(' + hint + ')');
        }
        showFormError(modal, message);
        var btn = modal.querySelector('[id$="_submit"]');
        if (btn) { btn.disabled = false; btn.classList.remove('processing'); }
    };

    function initModal(modal) {
        if (modal.dataset.wired === '1') return;
        modal.dataset.wired = '1';

        const form     = modal.querySelector('form');
        const cancels  = modal.querySelectorAll('.popup-form-cancel');
        const backdrop = modal.querySelector('.popup-form-backdrop');
        const success  = modal.querySelector('.popup-form-success');
        const phoneIn  = modal.querySelector('input[name="phone"]');
        if (!form) return;

        // País ativo do telefone (default Brasil). O seletor abaixo troca isto.
        let country = 'BR';

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
                    // o hidden não dispara change sozinho quando o valor vem do JS.
                    // Sem isto o bloco de etapas não saberia que o campo foi
                    // preenchido e o botão continuaria desabilitado.
                    hidden?.dispatchEvent(new Event('change', { bubbles: true }));
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

        // o evento avisa o bloco de etapas pra voltar pra primeira. Quem não tem
        // etapas simplesmente não escuta.
        function close() {
            modal.classList.remove('is-open');
            modal.dispatchEvent(new CustomEvent('popup-form-reset'));
        }
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

        // ── Seletor de país + máscara internacional (BR / PT) ────────
        // Injeta um seletor de país à esquerda do input de telefone, sem
        // editar o HTML de cada form. Trocar o país reformata o valor atual,
        // ajusta placeholder + texto de erro e muda validação/E.164.
        if (phoneIn) setupPhone(phoneIn);

        function setCountry(cc) {
            if (!COUNTRIES[cc]) cc = 'BR';
            country = cc;
            const c = COUNTRIES[cc];
            if (!phoneIn) return;
            phoneIn.placeholder = c.placeholder;
            phoneIn.value = maskPhone(phoneIn.value, cc);
            const errText = phoneIn.closest('.input-group')?.querySelector('.input-error-text');
            if (errText) errText.textContent = c.error;
        }

        function setupPhone(input) {
            input.setAttribute('maxlength', '15');
            input.addEventListener('input', () => { input.value = maskPhone(input.value, country); });

            const row = document.createElement('div');
            row.className = 'popup-form-phone';

            const trigger = document.createElement('div');
            trigger.className = 'popup-form-country';
            trigger.setAttribute('role', 'button');
            trigger.setAttribute('tabindex', '0');
            trigger.setAttribute('aria-label', 'Selecionar país do telefone');
            const code  = document.createElement('span'); code.className = 'popup-form-country-code';
            const caret = document.createElement('span');
            caret.className = 'material-symbols-outlined popup-form-country-caret';
            caret.textContent = 'expand_more';
            trigger.append(code, caret);

            const menu = document.createElement('ul');
            menu.className = 'popup-form-country-menu';
            menu.hidden = true;
            Object.keys(COUNTRIES).forEach((cc) => {
                const c = COUNTRIES[cc];
                const li = document.createElement('li');
                li.className = 'popup-form-country-option';
                li.dataset.country = cc;
                li.setAttribute('role', 'button');
                li.setAttribute('tabindex', '0');
                li.textContent = c.name + '  ' + c.dial;
                const pick = (e) => { e.stopPropagation(); applyCountry(cc); closeMenu(); };
                li.addEventListener('click', pick);
                li.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); }
                });
                menu.appendChild(li);
            });

            input.parentNode.insertBefore(row, input);
            row.append(trigger, input, menu);

            function renderTrigger(cc) {
                code.textContent = COUNTRIES[cc].dial;
            }
            // Decide abrir pra cima ou pra baixo conforme o espaço dentro do
            // card (que tem overflow:hidden e cortaria o menu). Mede a altura
            // do menu fora de tela e compara com o espaço acima/abaixo do gatilho.
            function positionMenu() {
                const clip = row.closest('.popup-form-card') || document.documentElement;
                const cRect = clip.getBoundingClientRect();
                const tRect = trigger.getBoundingClientRect();
                const prevVis = menu.style.visibility;
                menu.style.visibility = 'hidden';
                menu.hidden = false;
                const mH = menu.offsetHeight;
                menu.hidden = true;
                menu.style.visibility = prevVis;
                const gap = 8;
                const spaceBelow = cRect.bottom - tRect.bottom - gap;
                const spaceAbove = tRect.top - cRect.top - gap;
                const up = spaceBelow < mH && spaceAbove > spaceBelow;
                row.classList.toggle('is-up', up);
            }
            function openMenu()  { positionMenu(); menu.hidden = false; row.classList.add('is-open'); caret.textContent = 'expand_less'; }
            function closeMenu() { menu.hidden = true; row.classList.remove('is-open'); caret.textContent = 'expand_more'; }
            function applyCountry(cc) { setCountry(cc); renderTrigger(cc); input.focus(); }

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.hidden ? openMenu() : closeMenu();
            });
            trigger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    menu.hidden ? openMenu() : closeMenu();
                }
            });
            // Fecha ao clicar fora (o handler global de dropdowns não cobre esta classe).
            document.addEventListener('click', () => { if (!menu.hidden) closeMenu(); });

            renderTrigger(country);
            setCountry(country);
        }

        function showError(input, show) {
            const group = input.closest('.input-group');
            if (group) group.classList.toggle('is-error', show);
            const err = group?.querySelector('.input-error-text');
            if (err) err.style.display = show ? '' : 'none';
        }

        // validate(escopo): sem argumento valida o form inteiro, que é o
        // comportamento de sempre no submit. Com um elemento, valida só os campos
        // dentro dele, que é o que o avanço de etapa precisa (ver o bloco de
        // etapas abaixo): a etapa 2 existe no DOM desde o começo, então validar o
        // form todo na etapa 1 reprovaria em dropdowns que o usuário ainda nem viu.
        function validate(escopo, silencioso) {
            const raiz = escopo || form;
            const dentro = (el) => !!el && raiz.contains(el);
            const marca = (input, erro) => { if (!silencioso) showError(input, erro); };
            let ok = true;
            const fullname = form.fullname;
            const email    = form.email;
            const phone    = form.phone;

            if (dentro(fullname)) {
                const nameOk = fullname.value.trim().length >= 2;
                marca(fullname, !nameOk); ok = ok && nameOk;
            }

            if (dentro(email)) {
                const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
                marca(email, !emailOk); ok = ok && emailOk;
            }

            if (dentro(phone)) {
                const phoneOk = phoneValid(phone.value, country);
                marca(phone, !phoneOk); ok = ok && phoneOk;
            }

            // Demais inputs de texto marcados required (ex.: field[39] empresa no
            // form-data-squads). O trio acima tem validação de formato própria;
            // estes só precisam estar preenchidos. Até o data-squads nenhum popup
            // tinha um campo assim, então o laço não altera os que já existiam.
            raiz.querySelectorAll('input[type="text"][required]').forEach((el) => {
                if (el.name === 'fullname') return;
                const filled = el.value.trim() !== '';
                marca(el, !filled);
                ok = ok && filled;
            });

            if (recaptchaEl && dentro(recaptchaEl) && window.grecaptcha) {
                const wid = recaptchaEl.dataset.widgetId;
                const token = window.grecaptcha.getResponse(wid === undefined ? undefined : Number(wid));
                const captchaOk = !!token;
                if (!silencioso) recaptchaEl.classList.toggle('is-error', !captchaOk);
                ok = ok && captchaOk;
            }

            for (const d of dropdowns) {
                if (!dentro(d.group)) continue;
                const dropOk = !!(d.hidden && d.hidden.value);
                if (!silencioso) {
                    const ig = d.group.closest('.input-group');
                    if (ig) ig.classList.toggle('is-error', !dropOk);
                    const err = ig?.querySelector('.input-error-text');
                    if (err) err.style.display = dropOk ? 'none' : '';
                }
                ok = ok && dropOk;
            }

            return ok;
        }

        // Erro por campo. Aparece no BLUR e não a cada tecla: marcar de vermelho
        // enquanto a pessoa ainda está digitando o email é hostil. Depois de
        // marcado, o erro sai sozinho no input assim que o campo fica válido.
        // O escopo é o .input-group, que é o recorte que o validate() sabe
        // percorrer: contém o input e, nos dropdowns, o .dropdown-group.
        // É o mesmo par blur/input que o embed original da ActiveCampaign fazia.
        form.querySelectorAll('.input-group').forEach((grupo) => {
            const campo = grupo.querySelector('input:not([type="hidden"])');
            if (!campo) return;
            campo.addEventListener('blur', () => { validate(grupo); });
            campo.addEventListener('input', () => {
                if (grupo.classList.contains('is-error')) validate(grupo);
            });
        });

        // Etapas (opcional). Só entra em ação se o form tiver .popup-form-step;
        // os popups de uma etapa só não têm nenhum e seguem exatamente como antes.
        // Mostra uma etapa por vez, o [data-step-next] avança depois de validar a
        // etapa atual, e o submit só aparece na última.
        const etapas = Array.from(form.querySelectorAll('.popup-form-step'));
        if (etapas.length > 1) {
            const btnNext   = form.querySelector('[data-step-next]');
            const btnBack   = form.querySelector('[data-step-back]');
            const btnCancel = form.querySelector('.popup-form-cancel');
            const btnSubmit = form.querySelector('[type="submit"]');
            const conta     = modal.querySelector('.popup-form-steps-label');
            const barras    = modal.querySelectorAll('.popup-form-steps-bar');
            let atual = 0;

            // Só UM botão de avanço na tela por vez: o Próximo nas etapas do meio,
            // o Confirmar na última, no mesmo lugar. O [hidden] só funciona porque
            // o form.css re-aplica display:none nele (o .btn do DS é inline-flex,
            // que sozinho vence o default do atributo).
            const pintaEtapa = () => {
                etapas.forEach((et, i) => { et.hidden = i !== atual; });
                const ultima  = atual === etapas.length - 1;
                const primeira = atual === 0;
                if (btnNext)   btnNext.hidden = ultima;
                if (btnSubmit) btnSubmit.hidden = !ultima;
                // slot da esquerda: Cancelar na primeira etapa, Voltar nas demais.
                // Sair de uma etapa do meio continua possível pelo Esc e pelo
                // clique no backdrop, que o initModal já liga.
                if (btnCancel) btnCancel.hidden = !primeira;
                if (btnBack)   btnBack.hidden = primeira;
                if (conta) conta.textContent = 'Etapa ' + (atual + 1) + ' de ' + etapas.length;
                // barra clicável só pra etapa JÁ VISITADA: voltar é livre, avançar
                // continua passando pela validação do Próximo. O disabled nas
                // demais é o que dá o affordance (o CSS tira o cursor de mão).
                barras.forEach((b, i) => {
                    b.classList.toggle('is-done', i <= atual);
                    b.disabled = i >= atual;
                });
                atualizaBotoes();
            };

            // navegação num lugar só. O foco vai pro 1º campo da etapa nova pra
            // quem usa teclado não ter que tabular o formulário inteiro de volta.
            const vai = (i) => {
                atual = Math.max(0, Math.min(i, etapas.length - 1));
                pintaEtapa();
                etapas[atual].querySelector('input:not([type="hidden"]), .dropdown')?.focus();
            };

            barras.forEach((b, i) => {
                b.addEventListener('click', () => { if (i < atual) vai(i); });
            });
            btnBack?.addEventListener('click', () => vai(atual - 1));

            // O botão de avanço da etapa fica desabilitado até a etapa estar
            // completa, então o usuário nunca clica pra ser recusado.
            function atualizaBotoes() {
                // silencioso: true — é a MESMA checagem do clique, só sem pintar erro.
                // Antes isto vivia numa função paralela (preenchida()), e duas
                // implementações da mesma regra podem divergir, que foi o que fez o
                // Próximo habilitar com campo inválido. Agora existe um caminho só.
                const pronta = validate(etapas[atual], true);
                const alvo = atual === etapas.length - 1 ? btnSubmit : btnNext;
                if (alvo) alvo.disabled = !pronta;
            }
            form.addEventListener('input',  atualizaBotoes);
            form.addEventListener('change', atualizaBotoes);

            btnNext?.addEventListener('click', () => {
                if (!validate(etapas[atual])) return;
                vai(atual + 1);
            });

            // Volta pra etapa 1 ao fechar, senão reabrir o popup cai no meio do
            // formulário com os campos da etapa 1 já preenchidos e escondidos.
            modal.addEventListener('popup-form-reset', () => { atual = 0; pintaEtapa(); });
            pintaEtapa();
        }

        function serialize(f) {
            const out = [];
            for (const el of f.elements) {
                if (!el.name || el.disabled || el.type === 'submit' || el.type === 'button') continue;
                const val = el.name === 'phone' ? toE164(el.value, country) : el.value;
                out.push(encodeURIComponent(el.name) + '=' + encodeURIComponent(val));
            }
            return out.join('&');
        }

        function submit() {
            const errBox = form.querySelector('.popup-form-error');
            if (errBox) errBox.hidden = true;            // limpa erro anterior
            const url = form.action + '?' + serialize(form) + '&jsonp=true';
            const s = document.createElement('script');
            s.src = url;
            // Sucesso/erro vêm da RESPOSTA da AC: redirect (executa sozinho),
            // _show_thank_you (sucesso) ou _show_error (recusado). onerror só
            // cobre falha de rede (a AC não respondeu).
            s.onerror = () => { showFormError(modal, 'Erro de conexão. Tente novamente.'); };
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
