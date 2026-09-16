/* ══════════════════════════════════════════════════════════════════════════
   Acesso da página do certificado da Formação AI Champion.

   Mesma ideia do cofre.js do /cp/treinamentos/gerar/: a senha NÃO está neste
   arquivo. O que está é o resultado de um PBKDF2-SHA256 de 310.000 iterações
   sobre "usuário:senha", com sal aleatório. Conferir é refazer a derivação com
   o que a pessoa digitou e comparar os 32 bytes.

   Diferença honesta pro cofre.js: lá a derivação abre um pacote AES-GCM, então
   sem as credenciais não existe token nenhum pra extrair. Aqui não há segredo
   pra destrancar (a arte do certificado é arquivo estático, alcançável por URL
   direta), então isto é um portão de página estática: segura visita casual e
   link repassado, não segura quem abre o devtools. Se um dia precisar valer de
   verdade, o caminho é o mesmo do /cp/treinamentos/: proteção de diretório no
   servidor, ou middleware de Pages Function no repo do Cloudflare.

   O usuário aceita "incomparável" e "incomparavel", em qualquer caixa: antes de
   derivar, o texto é normalizado (NFD, fora os acentos, minúsculas, sem sobras
   nas pontas). A senha é conferida exatamente como digitada.
   ══════════════════════════════════════════════════════════════════════════ */
window.XPAcesso = {
    salt: 'Vg/ty+4a9P4GRplusBU5aQ==',
    hash: '58zeYH8GGlK4ETH8Xps3tU9KzziL5eMlnkb5MuUNop4=',
    iter: 310000,

    /* base64 -> Uint8Array */
    bytes: function (b64) {
        var bin = atob(b64), u8 = new Uint8Array(bin.length), i;
        for (i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        return u8;
    },

    /* "IncOmParável" -> "incomparavel" */
    normalizar: function (usuario) {
        return String(usuario || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    },

    /* Resolve true/false. Rejeita com 'sem-crypto' fora de contexto seguro. */
    conferir: function (usuario, senha) {
        var self = this;
        if (!window.crypto || !crypto.subtle) {
            return Promise.reject(new Error('sem-crypto'));
        }
        var claro = self.normalizar(usuario) + ':' + String(senha || '');
        return crypto.subtle.importKey('raw', new TextEncoder().encode(claro),
            { name: 'PBKDF2' }, false, ['deriveBits'])
            .then(function (base) {
                return crypto.subtle.deriveBits(
                    { name: 'PBKDF2', salt: self.bytes(self.salt), iterations: self.iter, hash: 'SHA-256' },
                    base, 256);
            })
            .then(function (bits) {
                var a = new Uint8Array(bits), b = self.bytes(self.hash), dif = a.length ^ b.length, i;
                for (i = 0; i < a.length && i < b.length; i++) dif |= a[i] ^ b[i];   /* sem short-circuit */
                return dif === 0;
            });
    }
};
