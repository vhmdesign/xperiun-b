/* ══════════════════════════════════════════════════════════════════════════
   Certificado da Formação AI Champion: a página inteira é o form, sem popup.
   Estrutura portada do /cp/treinamentos/certificado/ (cert-form.js) e o portão
   de acesso, do /cp/treinamentos/gerar/ (link.js + cofre.js).

   Duas telas na mesma página: o acesso (usuário e senha, conferidos pelo
   acesso.js) e a emissão, onde o aluno digita o nome e baixa o PDF. O PDF é
   montado do zero, em JS puro (sem pdf-lib/fontkit): fundo JPEG + texto em
   Poppins embutida como fonte CID, o que o deixa selecionável e buscável.

   Aceita ?nome= pra pré-preencher o campo (mesmo parâmetro que o menu-topo usa).
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
    var BADGE_SRC = '/ed/aichampion/certificado/dependencias/Badge-AI-Champion.png';        /* PNG grande, alta qualidade — só pro download */
    var BADGE_PREVIEW = '/ed/aichampion/certificado/dependencias/Badge-AI-Champion-200.webp'; /* leve (200x200) — badge animado na tela */

    var form = null;   /* [data-cert-form], preenchido lá embaixo, na partida */

    var q = function (sel) { return document.querySelector(sel); };
    var val = function (sel) { return (q(sel).value || '').trim(); };

    /* ── Acesso ──────────────────────────────────────────────────────────────
       Nada de sessão salva: recarregou, pede as credenciais de novo. Errar vai
       deixando a tentativa pela tela mais lenta (offline não dá pra impedir). */
    function montarLogin() {
        var login = q('[data-login-form]');
        var botao = q('[data-login-entrar]');
        var erro = q('[data-login-erro]');
        var erros = 0;

        q('.cert-page').classList.add('is-bloqueado');

        login.addEventListener('submit', function (e) {
            e.preventDefault();
            var rotulo = botao.textContent;
            botao.textContent = 'Entrando...';
            botao.disabled = true;
            erro.textContent = '';

            window.XPAcesso.conferir(val('[data-login-usuario]'), q('[data-login-senha]').value)
                .then(function (ok) {
                    if (!ok) {
                        erros++;
                        return new Promise(function (r) { setTimeout(r, Math.min(erros, 5) * 1000); })
                            .then(function () {
                                erro.textContent = 'Usuário ou senha inválidos.';
                                q('[data-login-senha]').value = '';
                                q('[data-login-senha]').focus();
                            });
                    }
                    erros = 0;
                    abrirEmissao();
                })
                ['catch'](function () {
                    erro.textContent = 'Abra esta página por HTTPS para entrar.';
                })
                .then(function () {
                    botao.textContent = rotulo;
                    botao.disabled = false;
                });
        });
    }

    /* ── Emissão ────────────────────────────────────────────────────────────── */
    function abrirEmissao() {
        q('[data-login-form]').hidden = true;
        form.hidden = false;
        q('[data-cert-titulo]').textContent = 'Parabéns';
        q('[data-cert-desc]').textContent =
            'Você concluiu a Formação AI Champion. Confira seu nome abaixo e baixe seu badge e seu certificado de conclusão.';
        q('.cert-page').classList.remove('is-bloqueado');

        /* Badge animado, igual ao preview do generator: stage + reflexo espelhado. */
        var stage = function (alt) {
            return '<div class="cert-badge-stage"><img src="' + BADGE_PREVIEW + '" alt="' + alt + '"></div>';
        };
        var media = q('[data-cert-badge]');
        media.innerHTML =
            '<div class="cert-badge">' +
                stage('Badge da Formação AI Champion') +
                '<div class="cert-badge-reflexo" aria-hidden="true">' +
                    '<div class="cert-badge-flip">' + stage('') + '</div>' +
                '</div>' +
            '</div>';
        media.hidden = false;

        q('[data-cert-baixar-badge]').href = BADGE_SRC;

        var nome = q('[data-cert-nome]');
        var nomeUrl = (new URLSearchParams(location.search).get('nome') || '').trim();
        if (nomeUrl) nome.value = nomeUrl;
        nome.focus();

        /* Digitar limpa o estado de erro do campo. */
        nome.addEventListener('input', function () {
            var g = nome.closest('.input-group');
            if (g) g.classList.remove('is-error');
        });

        form.addEventListener('submit', function (e) { e.preventDefault(); enviar(); });
    }

    function marcar(sel, erro) {
        var g = q(sel).closest('.input-group');
        if (g) g.classList.toggle('is-error', !!erro);
    }
    function msg(erro, ok) {
        q('[data-cert-erro]').textContent = erro || '';
        q('[data-cert-ok]').textContent = ok || '';
    }

    function enviar() {
        if (!val('[data-cert-nome]')) {
            marcar('[data-cert-nome]', true);
            msg('Preencha seu nome completo.', '');
            return;
        }

        var btn = q('[data-cert-baixar-certificado]');
        if (btn.getAttribute('data-loading')) return;
        btn.setAttribute('data-loading', '1');
        var rotulo = btn.textContent;
        btn.textContent = 'Gerando...';
        btn.disabled = true;
        msg('', '');

        baixarCertificado(val('[data-cert-nome]'))
            .then(function () { msg('', 'O download do seu certificado já começou.'); })
            ['catch'](function (e) {
                console.error('Certificado:', e);
                msg('Não foi possível gerar o certificado agora. Tente de novo em instantes.', '');
            })
            .then(function () {
                btn.textContent = rotulo;
                btn.removeAttribute('data-loading');
                btn.disabled = false;
            });
    }

    /* ── Gerador do certificado (PDF do zero, JS puro, sem libs) ──────────────
       Certificado = JPEG (fundo, DCTDecode) + texto em Poppins embutido como
       fonte CID (Type0/Identity-H), com ToUnicode (texto selecionável/buscável).
       Sem pdf-lib/fontkit; o embutidor TrueType mínimo está aqui embaixo. */
    var BASE = '/ed/aichampion/certificado/dependencias/';
    var CERT_JPG = BASE + 'certificado-AI-Champion.jpg';
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
        var L4 = 'Formação AI Champion,';
        var L5 = 'realizada aos sábados, 08, 15, 22 e 29 de agosto de 2026, das 9h às 13h.';

        /* Tamanhos e posições EXATOS da referência (nome regular; curso em bold). */
        var nameSize = 65, textoSize = 35, conferimosSize = 35;

        var linhas = [
            { f: reg,  key: 'reg',  fn: 'F1', t: L1,   s: conferimosSize, y: H / 2 + 1.5 * nameSize },
            { f: reg,  key: 'reg',  fn: 'F1', t: nome, s: nameSize,       y: H / 2 },
            { f: reg,  key: 'reg',  fn: 'F1', t: L3,   s: textoSize,      y: H / 2 - 1.5 * nameSize },
            { f: bold, key: 'bold', fn: 'F2', t: L4,   s: textoSize,      y: H / 2 - 1.5 * nameSize - 1.25 * textoSize },
            { f: reg,  key: 'reg',  fn: 'F1', t: L5,   s: textoSize,      y: H / 2 - 1.5 * nameSize - 2 * 1.25 * textoSize }
        ];

        /* Largura útil da arte. A linha das datas é longa (4 sábados) e um nome
           muito comprido também estoura: encolhe o corpo até caber, sem mexer
           na baseline (y), pra manter o mesmo ritmo vertical da referência. */
        var MAX_W = W - 160;

        var cs = 'q ' + W + ' 0 0 ' + H + ' 0 0 cm /Im0 Do Q\n0 0 0 rg\n';
        linhas.forEach(function (ln) {
            var size = ln.s, larg = textW(ln.f, ln.t, size);
            if (larg > MAX_W) { size = size * MAX_W / larg; larg = MAX_W; }
            var x = (W - larg) / 2;
            cs += 'BT /' + ln.fn + ' ' + n2(size) + ' Tf ' + n2(x) + ' ' + n2(ln.y) + ' Td <' + enc(ln.f, ln.t, ln.key) + '> Tj ET\n';
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

    form = q('[data-cert-form]');
    montarLogin();
})();
