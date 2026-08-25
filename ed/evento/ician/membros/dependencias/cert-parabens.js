/* ══════════════════════════════════════════════════════════════════════════
   Popup "Parabéns" (certificado liberado).
   Aparece no lugar do popup de progresso quando TODAS as aulas estão concluídas.
   - Badge-ICIAN animado (float + swing) com reflexo, igual temp/generator.html.
   - "Sair" no topo direito; "Baixar Badge" e "Baixar Certificado" no rodapé direito.
   Compartilhado pela home e pelas aulas; o menu-topo.js chama XPCert.abrirSeCompleto().

   Teste: ?cert=full força o estado concluído e abre o popup automaticamente.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
    var TOTAL = 4;                                   /* nº de aulas da imersão */
    var STORE_KEY = 'xp-imersao-concluidas';
    var BADGE_SRC = '/ed/evento/ician/membros/dependencias/Badge-ICIAN.png';        /* PNG grande, alta qualidade — só pro download */
    var BADGE_PREVIEW = '/ed/evento/ician/membros/dependencias/Badge-ICIAN-200.webp'; /* leve (200x200) — badge animado no popup */

    function testeFull() {
        return new URLSearchParams(location.search).get('cert') === 'full';
    }
    function estaCompleto() {
        if (testeFull()) return true;
        var conc = [];
        try { conc = JSON.parse(localStorage.getItem(STORE_KEY) || '[]') || []; } catch (_) {}
        var feitas = {};
        conc.forEach(function (n) { if (n >= 0 && n < TOTAL) feitas[n] = 1; });
        return Object.keys(feitas).length >= TOTAL;
    }

    var modal = null;

    /* Um <div class="cert-badge-stage"> com o badge (usado no badge e no reflexo). */
    function stageHTML(alt) {
        return '<div class="cert-badge-stage"><img src="' + BADGE_PREVIEW + '" alt="' + alt + '"></div>';
    }

    function build() {
        if (modal) return;
        modal = document.createElement('div');
        modal.className = 'cert-modal';
        modal.id = 'aula-modal-parabens';
        modal.innerHTML =
            '<div class="cert-modal-backdrop"></div>' +
            '<div class="cert-modal-card" role="dialog" aria-modal="true">' +
                '<button class="btn cert-modal-close" type="button" data-size="s" data-emphasis="subtle" data-cert-sair>Sair</button>' +
                '<div class="cert-modal-header">' +
                    '<h2 class="cert-modal-title">Parabéns</h2>' +
                    '<p class="cert-modal-desc">Você concluiu todas as aulas da Imersão Claude &amp; IA para Negócios. Baixe seu badge e seu certificado de conclusão.</p>' +
                '</div>' +
                '<div class="cert-badge-media">' +
                    '<div class="cert-badge-preview">' +
                        stageHTML('Badge da Imersão Claude &amp; IA para Negócios') +
                        '<div class="cert-badge-reflection" aria-hidden="true">' +
                            '<div class="cert-badge-reflection-flip">' + stageHTML('') + '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="cert-modal-body">' +
                    '<div class="input-group cert-modal-field">' +
                        '<label class="input-label input-label-s" for="cert-parabens-nome">Nome Completo</label>' +
                        '<input class="input" type="text" id="cert-parabens-nome" data-cert-nome placeholder="Seu nome como sairá no certificado" autocomplete="name">' +
                    '</div>' +
                    '<div class="cert-modal-actions">' +
                        '<a class="btn" data-size="m" data-emphasis="medium" download href="' + BADGE_SRC + '" data-cert-baixar-badge>Baixar Badge</a>' +
                        '<button class="btn" data-size="m" data-emphasis="high" type="button" data-cert-baixar-certificado disabled>Baixar Certificado</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(modal);

        var backdrop = modal.querySelector('.cert-modal-backdrop');
        var sair = modal.querySelector('[data-cert-sair]');
        backdrop.addEventListener('click', fechar);
        sair.addEventListener('click', fechar);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('is-open')) fechar();
        });

        /* Nome completo: destrava o "Baixar Certificado" quando preenchido. */
        var input = modal.querySelector('[data-cert-nome]');
        var btnCert = modal.querySelector('[data-cert-baixar-certificado]');
        var nomeUrl = (new URLSearchParams(location.search).get('nome') || '').trim();
        if (nomeUrl) input.value = nomeUrl;   /* prefill com o ?nome= (mesmo que o menu-topo usa) */
        function sync() { btnCert.disabled = input.value.trim().length === 0; }
        input.addEventListener('input', sync);
        sync();
        btnCert.addEventListener('click', function () {
            var nome = input.value.trim();
            if (!nome) { input.focus(); return; }
            if (btnCert.getAttribute('data-loading')) return;
            btnCert.setAttribute('data-loading', '1');
            var label = btnCert.textContent;
            btnCert.textContent = 'Gerando...';
            btnCert.disabled = true;
            baixarCertificado(nome)['catch'](function (e) { console.error('Certificado:', e); })
                .then(function () {
                    btnCert.textContent = label;
                    btnCert.removeAttribute('data-loading');
                    sync();
                });
        });
    }

    function abrir() {
        build();
        document.body.style.overflow = 'hidden';
        modal.classList.add('is-open');
    }
    function fechar() {
        if (!modal) return;
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    /* ── Gerador do certificado (PDF do zero, JS puro, sem libs) ──────────────
       Certificado = JPEG (fundo, DCTDecode) + texto em Poppins embutido como
       fonte CID (Type0/Identity-H), com ToUnicode (texto selecionável/buscável).
       Sem pdf-lib/fontkit; o embutidor TrueType mínimo está aqui embaixo. */
    var BASE = '/ed/evento/ician/membros/dependencias/';
    var CERT_JPG = BASE + 'certificado-ician.jpg';
    var FONT_REG = BASE + 'Poppins-Regular.ttf';
    var FONT_BOLD = BASE + 'Poppins-Bold.ttf';
    var CERT_W = 1754, CERT_H = 1240;   /* tamanho do JPEG/página, em pt */
    var cache = {};   /* url -> Uint8Array */

    function bin(u8) {
        var s = '';
        for (var i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + 8192, u8.length)));
        return s;
    }
    function n2(x) { return (Math.round(x * 100) / 100).toString(); }
    function hex4(n) { return ('000' + n.toString(16)).slice(-4); }

    /* parser TrueType mínimo: cmap (fmt 4) + hmtx + head/hhea/maxp */
    function parseTTF(u8) {
        var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
        var u16 = function (o) { return dv.getUint16(o); }, i16 = function (o) { return dv.getInt16(o); }, u32 = function (o) { return dv.getUint32(o); };
        var numTables = u16(4), t = {}, p = 12, i;
        for (i = 0; i < numTables; i++) {
            var tag = String.fromCharCode(u8[p], u8[p + 1], u8[p + 2], u8[p + 3]);
            t[tag] = { off: u32(p + 8), len: u32(p + 12) };
            p += 16;
        }
        var head = t.head.off, upm = u16(head + 18);
        var bbox = [i16(head + 36), i16(head + 38), i16(head + 40), i16(head + 42)];
        var hhea = t.hhea.off, ascent = i16(hhea + 4), descent = i16(hhea + 6), numHM = u16(hhea + 34);
        var numGlyphs = u16(t.maxp.off + 4), hmtx = t.hmtx.off, adv = new Array(numGlyphs), last = 0, g;
        for (g = 0; g < numGlyphs; g++) { if (g < numHM) last = u16(hmtx + g * 4); adv[g] = last; }
        var cmap = t.cmap.off, nSub = u16(cmap + 2), sub = 0, s;
        for (s = 0; s < nSub; s++) {
            var plat = u16(cmap + 4 + s * 8), enc = u16(cmap + 4 + s * 8 + 2), off = u32(cmap + 4 + s * 8 + 4);
            if ((plat === 3 && (enc === 1 || enc === 10)) || plat === 0) { sub = cmap + off; if (plat === 3 && enc === 1) break; }
        }
        var map = {};
        if (u16(sub) === 4) {
            var segX2 = u16(sub + 6), segCount = segX2 / 2;
            var endO = sub + 14, startO = endO + segX2 + 2, deltaO = startO + segX2, rangeO = deltaO + segX2, seg, c;
            for (seg = 0; seg < segCount; seg++) {
                var end = u16(endO + seg * 2), start = u16(startO + seg * 2), delta = u16(deltaO + seg * 2), ro = u16(rangeO + seg * 2);
                for (c = start; c <= end && c !== 0xFFFF; c++) {
                    var gid;
                    if (ro === 0) gid = (c + delta) & 0xFFFF;
                    else { gid = u16(rangeO + seg * 2 + ro + (c - start) * 2); if (gid) gid = (gid + delta) & 0xFFFF; }
                    if (gid) map[c] = gid;
                }
            }
        }
        return { upm: upm, bbox: bbox, ascent: ascent, descent: descent, adv: adv, cmap: map, bytes: u8 };
    }

    function montarPdf(jpg, regFont, boldFont, nome) {
        var W = CERT_W, H = CERT_H;
        var reg = parseTTF(regFont), bold = parseTTF(boldFont);

        var gidOf = function (f, ch) { return f.cmap[ch.charCodeAt(0)] || 0; };
        var textW = function (f, str, size) { var w = 0, i; for (i = 0; i < str.length; i++) w += (f.adv[gidOf(f, str[i])] || 0); return w / f.upm * size; };
        var used = { reg: {}, bold: {} }, uni = { reg: {}, bold: {} };
        var enc = function (f, str, key) { var s = '', i, gd; for (i = 0; i < str.length; i++) { gd = gidOf(f, str[i]); used[key][gd] = 1; uni[key][gd] = str.charCodeAt(i); s += hex4(gd); } return s; };

        var L1 = 'Conferimos este certificado a';
        var L3 = 'pela participação na';
        var L4 = 'Imersão Claude & IA para Negócios,';
        var L5 = 'com carga horária de 4 horas, nos dias 21, 22 e 23 de julho de 2026.';

        /* Tamanhos e posições EXATOS da referência (nome regular; curso em bold). */
        var nameSize = 65, textoSize = 35, conferimosSize = 35;

        var linhas = [
            { f: reg,  key: 'reg',  fn: 'F1', t: L1,   s: conferimosSize, y: H / 2 + 1.5 * nameSize },
            { f: reg,  key: 'reg',  fn: 'F1', t: nome, s: nameSize,       y: H / 2 },
            { f: reg,  key: 'reg',  fn: 'F1', t: L3,   s: textoSize,      y: H / 2 - 1.5 * nameSize },
            { f: bold, key: 'bold', fn: 'F2', t: L4,   s: textoSize,      y: H / 2 - 1.5 * nameSize - 1.25 * textoSize },
            { f: reg,  key: 'reg',  fn: 'F1', t: L5,   s: textoSize,      y: H / 2 - 1.5 * nameSize - 2 * 1.25 * textoSize }
        ];

        var cs = 'q ' + W + ' 0 0 ' + H + ' 0 0 cm /Im0 Do Q\n0 0 0 rg\n';
        linhas.forEach(function (ln) {
            var x = (W - textW(ln.f, ln.t, ln.s)) / 2;
            cs += 'BT /' + ln.fn + ' ' + n2(ln.s) + ' Tf ' + n2(x) + ' ' + n2(ln.y) + ' Td <' + enc(ln.f, ln.t, ln.key) + '> Tj ET\n';
        });

        var warr = function (f, set) { var a = [], keys = Object.keys(set).map(Number).sort(function (x, y) { return x - y; }); keys.forEach(function (gd) { a.push(gd + ' [' + Math.round(f.adv[gd] * 1000 / f.upm) + ']'); }); return a.join(' '); };
        var desc = function (f, name, ff) {
            var sc = function (v) { return Math.round(v * 1000 / f.upm); };
            return '<</Type/FontDescriptor/FontName/' + name + '/Flags 32/FontBBox[' + f.bbox.map(sc).join(' ') + ']/ItalicAngle 0/Ascent ' + sc(f.ascent) + '/Descent ' + sc(f.descent) + '/CapHeight 700/StemV 80/FontFile2 ' + ff + ' 0 R>>';
        };
        var ff2 = function (f) { var b = bin(f.bytes); return '<</Length ' + b.length + '/Length1 ' + b.length + '>>\nstream\n' + b + '\nendstream'; };
        var toUni = function (m) {
            var ents = Object.keys(m).map(function (gd) { return '<' + hex4(+gd) + '> <' + hex4(m[gd]) + '>'; }), bf = '', i;
            for (i = 0; i < ents.length; i += 100) { var ch = ents.slice(i, i + 100); bf += ch.length + ' beginbfchar\n' + ch.join('\n') + '\nendbfchar\n'; }
            var body = '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo<</Registry(Adobe)/Ordering(UCS)/Supplement 0>> def\n/CMapName/Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n' + bf + 'endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
            return '<</Length ' + body.length + '>>\nstream\n' + body + '\nendstream';
        };

        var jpgBin = bin(jpg);
        var objs = [
            '<</Type/Catalog/Pages 2 0 R>>',
            '<</Type/Pages/Kids[3 0 R]/Count 1>>',
            '<</Type/Page/Parent 2 0 R/MediaBox[0 0 ' + W + ' ' + H + ']/Resources<</XObject<</Im0 4 0 R>>/Font<</F1 5 0 R/F2 10 0 R>>/ProcSet[/PDF/ImageC/Text]>>/Contents 15 0 R>>',
            '<</Type/XObject/Subtype/Image/Width ' + W + '/Height ' + H + '/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ' + jpgBin.length + '>>\nstream\n' + jpgBin + '\nendstream',
            '<</Type/Font/Subtype/Type0/BaseFont/Poppins/Encoding/Identity-H/DescendantFonts[6 0 R]/ToUnicode 9 0 R>>',
            '<</Type/Font/Subtype/CIDFontType2/BaseFont/Poppins/CIDSystemInfo<</Registry(Adobe)/Ordering(Identity)/Supplement 0>>/FontDescriptor 7 0 R/CIDToGIDMap/Identity/DW 500/W [' + warr(reg, used.reg) + ']>>',
            desc(reg, 'Poppins', 8),
            ff2(reg),
            toUni(uni.reg),
            '<</Type/Font/Subtype/Type0/BaseFont/Poppins-Bold/Encoding/Identity-H/DescendantFonts[11 0 R]/ToUnicode 14 0 R>>',
            '<</Type/Font/Subtype/CIDFontType2/BaseFont/Poppins-Bold/CIDSystemInfo<</Registry(Adobe)/Ordering(Identity)/Supplement 0>>/FontDescriptor 12 0 R/CIDToGIDMap/Identity/DW 500/W [' + warr(bold, used.bold) + ']>>',
            desc(bold, 'Poppins-Bold', 13),
            ff2(bold),
            toUni(uni.bold),
            '<</Length ' + cs.length + '>>\nstream\n' + cs + '\nendstream'
        ];

        var pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', offsets = [], i;
        for (i = 0; i < objs.length; i++) { offsets.push(pdf.length); pdf += (i + 1) + ' 0 obj\n' + objs[i] + '\nendobj\n'; }
        var xref = pdf.length, j;
        pdf += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
        for (j = 0; j < offsets.length; j++) pdf += ('0000000000' + offsets[j]).slice(-10) + ' 00000 n \n';
        pdf += 'trailer\n<</Size ' + (objs.length + 1) + '/Root 1 0 R>>\nstartxref\n' + xref + '\n%%EOF';

        var u8 = new Uint8Array(pdf.length), k;
        for (k = 0; k < pdf.length; k++) u8[k] = pdf.charCodeAt(k) & 0xFF;
        return u8;
    }

    function fetchBytes(url) {
        if (cache[url]) return Promise.resolve(cache[url]);
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error('não carregou ' + url + ' (' + r.status + ')');
            return r.arrayBuffer();
        }).then(function (buf) { cache[url] = new Uint8Array(buf); return cache[url]; });
    }

    /* "Baixar Certificado": monta o PDF com o nome e dispara o download. */
    function baixarCertificado(nome) {
        return Promise.all([fetchBytes(CERT_JPG), fetchBytes(FONT_REG), fetchBytes(FONT_BOLD)]).then(function (a) {
            var pdf = montarPdf(a[0], a[1], a[2], nome);
            var url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
            var el = document.createElement('a');
            el.href = url;
            el.download = 'Certificado - ' + nome + '.pdf';
            document.body.appendChild(el); el.click(); el.remove();
            setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        });
    }

    /* Faixa de oferta (64px no topo, acima do menu). INDEPENDENTE do certificado:
       fica oculta por padrão e só aparece com ?oferta=1 (teste). Depois será
       ligada pelo comando/flag real; não tem relação com concluir as aulas. */
    function topbarAtiva() {
        return new URLSearchParams(location.search).get('oferta') === '1';
    }
    /* Preenche a faixa com quadrados 16px em checkerboard (tocam nos vértices),
       incluídos aleatoriamente, cada um com opacity animada em tempo aleatório. */
    function popularQuadrados(host) {
        var s = 16, w = host.offsetWidth || window.innerWidth, h = 64;
        var cols = Math.ceil(w / s) + 1, rows = Math.ceil(h / s), html = '', r, c;
        for (r = 0; r < rows; r++) {
            for (c = 0; c < cols; c++) {
                if ((r + c) % 2 !== 0) continue;       /* checkerboard: cantos se tocam */
                if (Math.random() > 0.6) continue;     /* distribuição aleatória */
                var dur = (2 + Math.random() * 3).toFixed(2);
                var del = (-Math.random() * 5).toFixed(2);
                html += '<span class="cert-topbar-sq" style="left:' + (c * s) + 'px;top:' + (r * s) +
                        'px;animation-duration:' + dur + 's;animation-delay:' + del + 's"></span>';
            }
        }
        host.innerHTML = html;
    }

    function montarTopbar() {
        if (!topbarAtiva() || document.querySelector('.cert-topbar')) return;
        var bar = document.createElement('a');
        bar.className = 'cert-topbar';
        bar.href = '/ed/aichampion/';
        bar.target = '_blank';
        bar.rel = 'noopener noreferrer';
        bar.setAttribute('aria-label', 'Ver oferta: Condições especiais para a Formação AI Champion');
        bar.innerHTML =
            '<span class="cert-topbar-squares" aria-hidden="true"></span>' +
            '<div class="cert-topbar-content">' +
                '<div class="cert-topbar-brand">' +
                    '<span class="cert-topbar-logo" aria-hidden="true"></span>' +
                '</div>' +
                '<span class="cert-topbar-txt">Condições especiais para a Formação AI Champion</span>' +
                '<div class="cert-topbar-offer">' +
                    '<span class="btn cert-topbar-btn" data-size="s" aria-hidden="true">Ver Oferta</span>' +
                '</div>' +
            '</div>';
        var slot = document.querySelector('[data-menu-topo]');
        if (slot && slot.parentNode) slot.parentNode.insertBefore(bar, slot);
        else document.body.insertBefore(bar, document.body.firstChild);
        document.body.classList.add('has-cert-topbar');   /* ajusta o layout (bg/alturas) das páginas */

        var host = bar.querySelector('.cert-topbar-squares');
        popularQuadrados(host);
        var t;
        window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { popularQuadrados(host); }, 200); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montarTopbar);
    else montarTopbar();

    /* Exposto pro menu-topo.js e pro botão da sanfona decidirem quando abrir.
       O popup NÃO abre sozinho: só pelo item "Certificado" do menu ou pelo
       botão "Acessar meu Certificado" (que aparece no aula-progress em 100%). */
    window.XPCert = {
        estaCompleto: estaCompleto,
        abrir: abrir,
        fechar: fechar,
        abrirSeCompleto: function () {
            if (estaCompleto()) { abrir(); return true; }
            return false;
        }
    };
})();
