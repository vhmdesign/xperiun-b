/* ══════════════════════════════════════════════════════════════════════════
   Certificado Xperiun (rascunho isolado): a página inteira é o form.

   O link do treinador define curso, período e token pela querystring; o aluno
   só preenche o nome e o tratamento. Os 4 cursos do catálogo CURSOS
   dividem o mesmo fundo: o que muda é o par de cores das faixas (os mesmos
   pares Corporate do temp/generator.html), o badge, a linha do treinamento,
   o fecho e o token.

   O catálogo vem do cursos.js. O PDF é montado do zero, em JS puro (sem
   pdf-lib/fontkit): fundo PNG/JPEG,
   faixas em gradiente, badge com transparência e texto em Poppins embutida.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
    var XP = window.XPCert;                    /* catálogo compartilhado (cursos.js) */
    var acharCurso = XP.acharCurso, dia = XP.dia, mes = XP.mes, temGenero = XP.temGenero;

    var BASE = XP.BASE;
    var FONT_REG = BASE + 'Poppins-Regular.ttf';
    var FONT_BOLD = BASE + 'Poppins-Bold.ttf';

    /* Geometria do certificado (o SVG das faixas e a posição do badge estão em
       coordenadas de 3564x2520; tudo escala junto com o tamanho real da arte). */
    var SVG_W = 3564, SVG_H = 2520;
    var FAIXA_LINHA = '#f5f5ff';               /* o --bw do DS */
    var BADGE_LADO = 764, BADGE_BASE = 90;     /* badge centralizado, 90 acima da base */
    var TEXTO_MAX_W = 3064;                    /* linha mais larga que isso encolhe pra caber */

    var ERRO_URL = 'Este não é um endereço válido para acesso ao certificado, consulte o treinador para obter o endereço válido.';

    var q = function (sel) { return document.querySelector(sel); };
    var val = function (sel) { return (q(sel).value || '').trim(); };

    var form = q('[data-cert-form]');
    var curso = null;

    /* ── Link do treinador ──────────────────────────────────────────────────
       Curso, período e token são obrigatórios e só vêm pela URL (ficam nos
       campos hidden); nome e sexo são prefill opcional. Token errado
       vale como endereço inválido: sem ele o link não emite nada. */
    function lerUrl() {
        var p = new URLSearchParams(location.search);
        var set = function (sel, v) { if (v) q(sel).value = String(v).trim(); };
        set('[data-cert-nome]', p.get('nome') || p.get('firstname'));
        if ((p.get('sexo') || '').toLowerCase().indexOf('f') === 0) {
            q('input[name="cert-sexo"][value="Feminino"]').checked = true;
        }

        var c = acharCurso((p.get('curso') || '').trim());
        var diaI = dia(p.get('diaInicio')), diaF = dia(p.get('diaFinal'));
        var mesI = mes(p.get('mesInicio')), mesF = mes(p.get('mesFinal'));
        var ano = (p.get('anoInicio') || p.get('ano') || '').trim();
        var token = (p.get('token') || '').trim();
        if (!c || !diaI || !diaF || !mesI || !mesF || !/^[0-9]{4}$/.test(ano) || !token) return Promise.resolve(null);

        /* O token não é comparado com nada em claro: confere pelo SHA-256. */
        return XP.conferirToken(token, c).then(function (ok) {
            if (!ok) return null;
            q('[data-cert-token]').value = token;
            q('[data-cert-curso]').value = c.slug;
            q('[data-cert-dia-i]').value = diaI;
            q('[data-cert-dia-f]').value = diaF;
            q('[data-cert-mes-i]').value = mesI;
            q('[data-cert-mes-f]').value = mesF;
            q('[data-cert-ano]').value = ano;
            return c;
        });
    }

    /* ── Tela ───────────────────────────────────────────────────────────────── */

    function montar() {
        lerUrl()
            .then(function (c) { if (c) { curso = c; comLink(); } else { semLink(ERRO_URL); } })
            ['catch'](function () {
                /* WebCrypto exige contexto seguro: sem ele, não dá pra conferir o token */
                semLink('Abra esta página por HTTPS para emitir o certificado.');
            });
    }

    function semLink(texto) {
        var bloqueio = q('[data-cert-bloqueio]');
        bloqueio.textContent = texto;
        bloqueio.hidden = false;
        form.hidden = true;
        q('.cert-badge-media').hidden = true;
        q('.cert-page').classList.add('is-bloqueado');
        q('.cert-title').textContent = 'Certificado';
    }

    function comLink() {
        q('[data-cert-desc]').textContent =
            'Você concluiu o treinamento de ' + curso.nome + '. Confira seus dados abaixo e baixe seu certificado de conclusão.';

        /* Badge animado, igual ao preview do generator: stage + reflexo espelhado. */
        var stage = function (alt) {
            return '<div class="cert-badge-stage"><img src="' + curso.badge + '" alt="' + alt + '"></div>';
        };
        q('[data-cert-badge]').innerHTML =
            '<div class="cert-badge">' +
                stage('Badge de ' + curso.nome) +
                '<div class="cert-badge-reflexo" aria-hidden="true">' +
                    '<div class="cert-badge-flip">' + stage('') + '</div>' +
                '</div>' +
            '</div>';

        var btnBadge = q('[data-cert-baixar-badge]');
        btnBadge.href = curso.badge;
        btnBadge.hidden = false;

        /* Cada opção mostra a frase que vai sair no certificado: "Reconhecido"
           e "Reconhecida" sozinhos são quase iguais em Poppins. */
        q('[data-cert-bloco-sexo]').hidden = !temGenero(curso);
        if (temGenero(curso)) {
            q('[data-cert-fecho-m]').textContent = comoSai(curso.fecho.m);
            q('[data-cert-fecho-f]').textContent = comoSai(curso.fecho.f);
        }

        /* Digitar em qualquer campo limpa o estado de erro dele. */
        Array.prototype.forEach.call(form.querySelectorAll('.input'), function (el) {
            el.addEventListener('input', function () {
                var g = el.closest('.input-group');
                if (g) g.classList.remove('is-error');
            });
        });

        form.addEventListener('submit', function (e) { e.preventDefault(); enviar(); });
    }

    /* ", sendo reconhecido como um X." -> "Sendo reconhecido como um X" */
    function comoSai(fecho) {
        var t = fecho.replace(/^[,\s]+/, '').replace(/\.$/, '');
        return t.charAt(0).toUpperCase() + t.slice(1);
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
        var label = btn.textContent;
        btn.textContent = 'Gerando...';
        btn.disabled = true;
        msg('', '');

        baixarCertificado(curso, val('[data-cert-nome]'))
            .then(function () { msg('', 'O download do seu certificado já começou.'); })
            ['catch'](function (e) {
                console.error('Certificado:', e);
                msg('Não foi possível gerar o certificado agora. Tente de novo em instantes.', '');
            })
            .then(function () {
                btn.textContent = label;
                btn.removeAttribute('data-loading');
                btn.disabled = false;
            });
    }

    /* Frase do período, igual aos scripts antigos:
       mesmo dia        -> "dia 05 de agosto de 2026"
       mesmo mês        -> "de 03 a 05 de agosto de 2026"
       meses diferentes -> "de 30 de julho a 05 de agosto de 2026" */
    function frasePeriodo(dI, mI, dF, mF, ano) {
        var ini, meio;
        if (mI === mF && dI === dF) { ini = 'dia '; meio = ''; }
        else if (mI === mF) { ini = 'de ' + dI; meio = ' a '; }
        else { ini = 'de ' + dI; meio = ' de ' + mI + ' a '; }
        return ini + meio + dF + ' de ' + mF + ' de ' + ano;
    }

    /* As 5 linhas do certificado, em pixels do certificado (3564x2520):
       size = corpo da fonte, topo = baseline medida a partir do topo da arte.
       Todas são centralizadas na horizontal. */
    function linhasDoCertificado(c, nome) {
        var sexoEl = q('input[name="cert-sexo"]:checked');
        var fecho = temGenero(c)
            ? ((sexoEl && sexoEl.value === 'Feminino') ? c.fecho.f : c.fecho.m)
            : c.fecho;
        var periodo = frasePeriodo(val('[data-cert-dia-i]'), val('[data-cert-mes-i]'),
                                   val('[data-cert-dia-f]'), val('[data-cert-mes-f]'), val('[data-cert-ano]'));
        return [
            { t: 'Conferimos este certificado a', bold: false, size: 72,  topo: 962 },
            { t: nome,                            bold: false, size: 132, topo: 1160 },
            { t: 'Ao mérito de:',                 bold: false, size: 72,  topo: 1358 },
            { t: c.linhaCurso,                    bold: true,  size: 72,  topo: 1448 },
            { t: periodo + fecho,                 bold: false, size: 72,  topo: 1538 }
        ];
    }

    /* ── Gerador do certificado (PDF do zero, JS puro, sem libs) ──────────────
       Página = arte de fundo + faixas (shading axial) + badge (com SMask) +
       texto em Poppins embutida como fonte CID (Type0/Identity-H) com ToUnicode,
       ou seja, texto selecionável e buscável. */
    var cache = {};   /* url -> Uint8Array */

    function bin(u8) {
        var s = '';
        for (var i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + 8192, u8.length)));
        return s;
    }
    function n2(x) { return (Math.round(x * 100) / 100).toString(); }
    function hex4(n) { return ('000' + n.toString(16)).slice(-4); }

    /* ── Fundo: JPEG ou PNG ──────────────────────────────────────────────────
       JPEG entra como DCTDecode. PNG (sem interlace nem alpha) entra como
       FlateDecode com Predictor 15: os IDAT vão pro PDF do jeito que estão,
       sem recompressão e sem perda. */
    function imagemInfo(u8) {
        if (u8[0] === 0xFF && u8[1] === 0xD8) return jpegInfo(u8);
        if (u8[0] === 0x89 && u8[1] === 0x50) return pngInfo(u8);
        throw new Error('o fundo do certificado precisa ser JPEG ou PNG');
    }

    /* Tamanho e nº de componentes do JPEG (marcador SOFn). */
    function jpegInfo(u8) {
        var i = 2;
        while (i < u8.length - 9) {
            if (u8[i] !== 0xFF) { i++; continue; }
            var m = u8[i + 1];
            if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
            if (m === 0xDA || m === 0xD9) break;
            var len = (u8[i + 2] << 8) | u8[i + 3];
            if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
                var comps = u8[i + 9];
                var espaco = comps === 1 ? '/DeviceGray' : (comps === 4 ? '/DeviceCMYK' : '/DeviceRGB');
                var decode = comps === 4 ? '/Decode[1 0 1 0 1 0 1 0]' : '';   /* JPEG CMYK da Adobe vem invertido */
                return {
                    h: (u8[i + 5] << 8) | u8[i + 6],
                    w: (u8[i + 7] << 8) | u8[i + 8],
                    dict: '/ColorSpace' + espaco + '/BitsPerComponent 8' + decode + '/Filter/DCTDecode',
                    dados: u8
                };
            }
            i += 2 + len;
        }
        throw new Error('JPEG do certificado inválido (SOF não encontrado)');
    }

    /* Chunks do PNG que interessam (IHDR, PLTE e os IDAT concatenados). */
    function pngChunks(u8) {
        var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
        var i = 8, w = 0, h = 0, bd = 0, ct = 0, inter = 0, plte = null, idats = [], total = 0;
        while (i + 8 <= u8.length) {
            var len = dv.getUint32(i);
            var tipo = String.fromCharCode(u8[i + 4], u8[i + 5], u8[i + 6], u8[i + 7]);
            var off = i + 8;
            if (tipo === 'IHDR') {
                w = dv.getUint32(off); h = dv.getUint32(off + 4);
                bd = u8[off + 8]; ct = u8[off + 9]; inter = u8[off + 12];
            } else if (tipo === 'PLTE') plte = u8.subarray(off, off + len);
            else if (tipo === 'IDAT') { idats.push(u8.subarray(off, off + len)); total += len; }
            else if (tipo === 'IEND') break;
            i = off + len + 4;
        }
        if (inter) throw new Error('PNG interlaçado não é suportado; salve sem interlace');
        var idat = new Uint8Array(total), p = 0, k;
        for (k = 0; k < idats.length; k++) { idat.set(idats[k], p); p += idats[k].length; }
        return { w: w, h: h, bd: bd, ct: ct, plte: plte, idat: idat };
    }

    function pngInfo(u8) {
        var png = pngChunks(u8), w = png.w, bd = png.bd, ct = png.ct, plte = png.plte;
        if (ct === 4 || ct === 6) throw new Error('o fundo do certificado não pode ter canal alpha');
        var comps = ct === 2 ? 3 : 1;
        var espaco = ct === 2 ? '/DeviceRGB'
            : (ct === 3 ? '[/Indexed/DeviceRGB ' + (plte.length / 3 - 1) + '<' + bin(plte).replace(/[\s\S]/g, function (ch) { return ('0' + ch.charCodeAt(0).toString(16)).slice(-2); }) + '>]'
                        : '/DeviceGray');
        return {
            w: w, h: png.h,
            dict: '/ColorSpace' + espaco + '/BitsPerComponent ' + bd +
                  '/Filter/FlateDecode/DecodeParms<</Predictor 15/Colors ' + comps +
                  '/BitsPerComponent ' + bd + '/Columns ' + w + '>>',
            dados: png.idat
        };
    }

    /* ── Badge (PNG com transparência) ────────────────────────────────────────
       O alpha não cabe num XObject simples, então o PNG é decodificado aqui
       (inflate + desfiltragem) e volta em dois streams: as cores e a máscara de
       opacidade (SMask). DecompressionStream/CompressionStream são nativos. */
    function comStream(bytes, ts) {
        return new Response(new Blob([bytes]).stream().pipeThrough(ts)).arrayBuffer()
            .then(function (b) { return new Uint8Array(b); });
    }
    function desfiltrar(raw, w, h, bpp) {
        var linha = w * bpp, out = new Uint8Array(h * linha), p = 0, o = 0, y, x, f, a, b, c, pr, pa, pb, pc, v;
        for (y = 0; y < h; y++) {
            f = raw[p++];
            for (x = 0; x < linha; x++) {
                v = raw[p + x];
                a = x >= bpp ? out[o + x - bpp] : 0;
                b = y > 0 ? out[o - linha + x] : 0;
                c = (x >= bpp && y > 0) ? out[o - linha + x - bpp] : 0;
                if (f === 1) v += a;
                else if (f === 2) v += b;
                else if (f === 3) v += (a + b) >> 1;
                else if (f === 4) {
                    pr = a + b - c; pa = Math.abs(pr - a); pb = Math.abs(pr - b); pc = Math.abs(pr - c);
                    v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
                }
                out[o + x] = v & 255;
            }
            p += linha; o += linha;
        }
        return out;
    }
    function prepararBadge(u8) {
        var png = pngChunks(u8);
        if (png.ct !== 6 || png.bd !== 8) throw new Error('o badge precisa ser PNG RGBA de 8 bits');
        return comStream(png.idat, new DecompressionStream('deflate')).then(function (raw) {
            var w = png.w, h = png.h, n = w * h, i;
            var px = desfiltrar(raw, w, h, 4);
            var rgb = new Uint8Array(n * 3), alfa = new Uint8Array(n);
            for (i = 0; i < n; i++) {
                rgb[i * 3] = px[i * 4]; rgb[i * 3 + 1] = px[i * 4 + 1]; rgb[i * 3 + 2] = px[i * 4 + 2];
                alfa[i] = px[i * 4 + 3];
            }
            return Promise.all([
                comStream(rgb, new CompressionStream('deflate')),
                comStream(alfa, new CompressionStream('deflate'))
            ]).then(function (a) { return { w: w, h: h, rgb: a[0], alfa: a[1] }; });
        });
    }

    /* ── Faixas do topo e do rodapé, no par de cores do curso ────────────────── */

    function hexRgb(hex) {
        var n = parseInt(hex.slice(1), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
            .map(function (v) { return Math.round(v / 255 * 1000) / 1000; }).join(' ');
    }
    /* Gradiente axial horizontal (o mesmo linearGradient do SVG). */
    function shading(x0, x1, c0, c1) {
        return '<</ShadingType 2/ColorSpace/DeviceRGB/Coords[' + n2(x0) + ' 0 ' + n2(x1) + ' 0]/Extend[true true]' +
               '/Function<</FunctionType 2/Domain[0 1]/C0[' + hexRgb(c0) + ']/C1[' + hexRgb(c1) + ']/N 1>>>>';
    }
    /* Desenha em coordenadas do certificado (origem no topo) e escala pro
       tamanho real da arte, então serve pra qualquer arte na mesma proporção. */
    function overlaySvg(W, H) {
        var re = function (x, yTopo, w, h) {
            return n2(x) + ' ' + n2(SVG_H - yTopo - h) + ' ' + n2(w) + ' ' + n2(h) + ' re';
        };
        return 'q ' + n2(W / SVG_W) + ' 0 0 ' + n2(H / SVG_H) + ' 0 0 cm\n' +
            'q ' + re(0, 2340, SVG_W, 180) + ' W n /Sh0 sh Q\n' +      /* faixa do rodapé */
            'q ' + re(0, 0, SVG_W, 90) + ' W n /Sh0 sh Q\n' +          /* faixa do topo */
            hexRgb(FAIXA_LINHA) + ' rg\n' +
            re(0, 2365, SVG_W, 10) + ' f\n' +                          /* fio claro do rodapé */
            re(0, 55, SVG_W, 10) + ' f\n' +                            /* fio claro do topo */
            'q ' + re(3296.75, 2437.255, 10, 10) + ' W n /Sh1 sh Q\n' +
            'Q\n';
    }

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

    function montarPdf(imgBytes, regFont, boldFont, linhasSpec, cores, badge) {
        var info = imagemInfo(imgBytes), W = info.w, H = info.h;
        var reg = parseTTF(regFont), bold = parseTTF(boldFont);

        var gidOf = function (f, ch) { return f.cmap[ch.charCodeAt(0)] || 0; };
        var textW = function (f, str, size) { var w = 0, i; for (i = 0; i < str.length; i++) w += (f.adv[gidOf(f, str[i])] || 0); return w / f.upm * size; };
        var used = { reg: {}, bold: {} }, uni = { reg: {}, bold: {} };
        var enc = function (f, str, key) { var s = '', i, gd; for (i = 0; i < str.length; i++) { gd = gidOf(f, str[i]); used[key][gd] = 1; uni[key][gd] = str.charCodeAt(i); s += hex4(gd); } return s; };

        var cs = 'q ' + W + ' 0 0 ' + H + ' 0 0 cm /Im0 Do Q\n' + overlaySvg(W, H);
        var escala = 'q ' + n2(W / SVG_W) + ' 0 0 ' + n2(H / SVG_H) + ' 0 0 cm ';
        if (badge) {
            cs += escala + 'q ' + BADGE_LADO + ' 0 0 ' + BADGE_LADO + ' ' +
                  n2((SVG_W - BADGE_LADO) / 2) + ' ' + BADGE_BASE + ' cm /Im1 Do Q Q\n';
        }
        /* Texto em coordenadas do certificado (3564x2520, origem no topo), na
           mesma escala das faixas e do badge: os números do TEXTO são os pixels
           da arte. Cada linha é centralizada; se passar de TEXTO_MAX_W, encolhe. */
        cs += escala + '0 0 0 rg\n';
        linhasSpec.forEach(function (ln) {
            if (!ln.t) return;
            var f = ln.bold ? bold : reg, key = ln.bold ? 'bold' : 'reg', fn = ln.bold ? 'F2' : 'F1';
            var size = ln.size;
            var w = textW(f, ln.t, size);
            if (w > TEXTO_MAX_W) { size = size * TEXTO_MAX_W / w; w = TEXTO_MAX_W; }
            cs += 'BT /' + fn + ' ' + n2(size) + ' Tf ' + n2((SVG_W - w) / 2) + ' ' + n2(SVG_H - ln.topo) + ' Td <' + enc(f, ln.t, key) + '> Tj ET\n';
        });
        cs += 'Q\n';

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

        var shadings = '/Shading<</Sh0 ' + shading(0, SVG_W, cores.inicial, cores.final) +
                       '/Sh1 ' + shading(3306.75, 3296.75, cores.inicial, cores.final) + '>>';
        var imgBin = bin(info.dados);
        var badgeXObj = badge ? '/Im1 16 0 R' : '';
        var objs = [
            '<</Type/Catalog/Pages 2 0 R>>',
            '<</Type/Pages/Kids[3 0 R]/Count 1>>',
            '<</Type/Page/Parent 2 0 R/MediaBox[0 0 ' + W + ' ' + H + ']/Resources<</XObject<</Im0 4 0 R' + badgeXObj + '>>/Font<</F1 5 0 R/F2 10 0 R>>' + shadings + '/ProcSet[/PDF/ImageC/Text]>>/Contents 15 0 R>>',
            '<</Type/XObject/Subtype/Image/Width ' + W + '/Height ' + H + info.dict + '/Length ' + imgBin.length + '>>\nstream\n' + imgBin + '\nendstream',
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
        if (badge) {
            var rgbBin = bin(badge.rgb), alfaBin = bin(badge.alfa);
            objs.push('<</Type/XObject/Subtype/Image/Width ' + badge.w + '/Height ' + badge.h +
                '/ColorSpace/DeviceRGB/BitsPerComponent 8/SMask 17 0 R/Filter/FlateDecode/Length ' + rgbBin.length + '>>\nstream\n' + rgbBin + '\nendstream');
            objs.push('<</Type/XObject/Subtype/Image/Width ' + badge.w + '/Height ' + badge.h +
                '/ColorSpace/DeviceGray/BitsPerComponent 8/Filter/FlateDecode/Length ' + alfaBin.length + '>>\nstream\n' + alfaBin + '\nendstream');
        }

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

    /* "Baixar Certificado": monta o PDF com os dados do form e dispara o download. */
    function baixarCertificado(c, nome) {
        var linhas = linhasDoCertificado(c, nome);
        var badge = c.badge ? fetchBytes(c.badge).then(prepararBadge) : Promise.resolve(null);
        return Promise.all([fetchBytes(c.arte), fetchBytes(FONT_REG), fetchBytes(FONT_BOLD), badge]).then(function (a) {
            var pdf = montarPdf(a[0], a[1], a[2], linhas, c.cores, a[3]);
            var url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
            var el = document.createElement('a');
            el.href = url;
            el.download = 'Certificado ' + c.nome + ' - ' + nome + '.pdf';
            document.body.appendChild(el); el.click(); el.remove();
            setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        });
    }

    montar();
})();
