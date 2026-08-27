/* ══════════════════════════════════════════════════════════════════════════
   Cofre dos tokens do gerador de links.

   Os tokens NÃO estão neste arquivo: o que está aqui é o pacote cifrado com
   AES-GCM 256, cuja chave é derivada de "usuário:senha" por PBKDF2-SHA256 com
   310.000 iterações. Sem as credenciais certas, a decifragem falha na
   verificação de integridade do GCM e não sai nada legível, então não adianta
   ler o código nem pular o login pelo devtools.

   Isto não substitui autenticação de servidor (qualquer um pode tentar senhas
   offline, no ritmo que o PBKDF2 permitir); é o teto do que dá pra fazer numa
   página estática. Pra trocar as credenciais ou os tokens, gerar outro pacote.
   ══════════════════════════════════════════════════════════════════════════ */
window.XPCofre = {
    salt: 'cxOmNyFUxw8ebcTY9nVOGA==',
    iv: 'mkziulgvi4Nm3blt',
    iter: 310000,
    dados: '2X97p37cw2pWryzuPM17fyxXMTPAc3q/PVW+K8CWGjYUvktULoMbzQroK3oZFIcCJ6KsQ/E9tvlSqb8YfVCYLvwXh5Zws3B9e+IdsmgSbcZJQUUy4eEzts77855e96FSVFf5hTsZ2BzUrH/aiQTatXEesmJ33Ez34NMdykmmNLY5C0vxQjukEOkogwVi6kQbkaUKeviXwZAdrhR7TDnsQER7W815Y0BU7g6wZLL0mw==',

    /* base64 -> Uint8Array */
    bytes: function (b64) {
        var bin = atob(b64), u8 = new Uint8Array(bin.length), i;
        for (i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        return u8;
    },

    /* Abre o cofre com as credenciais. Resolve com { slug: token } ou null. */
    abrir: function (usuario, senha) {
        var self = this;
        if (!window.crypto || !crypto.subtle) {
            return Promise.reject(new Error('sem-crypto'));
        }
        return crypto.subtle.importKey('raw', new TextEncoder().encode(usuario + ':' + senha),
            { name: 'PBKDF2' }, false, ['deriveKey'])
            .then(function (base) {
                return crypto.subtle.deriveKey(
                    { name: 'PBKDF2', salt: self.bytes(self.salt), iterations: self.iter, hash: 'SHA-256' },
                    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
            })
            .then(function (chave) {
                return crypto.subtle.decrypt({ name: 'AES-GCM', iv: self.bytes(self.iv) }, chave, self.bytes(self.dados));
            })
            .then(function (claro) { return JSON.parse(new TextDecoder().decode(claro)); })
            ['catch'](function (e) {
                if (e && e.message === 'sem-crypto') throw e;
                return null;   /* credenciais erradas: o GCM não autentica */
            });
    }
};
