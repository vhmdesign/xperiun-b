# Certificados de treinamento — como funciona e o que falta ligar

Duas páginas:

- **`/cp/treinamentos/certificado/`** — o aluno emite o PDF. Recebe curso, período e
  token pela URL; o aluno só preenche o nome (e o tratamento, quando a copy do curso
  varia com gênero).
- **`/cp/treinamentos/gerar/`** — uso interno. O treinador monta o link que manda pra
  turma. Protegida por login.

O catálogo dos cursos (nomes, cores, badges, textos) fica em
`dependencias/cursos.js`, e vale para as duas páginas.

---

## PENDÊNCIA: ligar o Basic Auth no `/gerar/`

**Estado hoje:** qualquer pessoa que descubra o endereço consegue *abrir* a página do
gerador. Sem a senha ela não gera link nenhum, porque os tokens estão cifrados
(AES-GCM, chave derivada da senha por PBKDF2 — ver `dependencias/cofre.js`). Só que,
para exibir a tela de login, o navegador dela **já baixou o `cofre.js`**. Com esse
arquivo salvo, dá para testar senhas offline, sem limite de tentativas e sem
ninguém perceber.

**O que resolve:** proteção de diretório no servidor (Basic Auth). Aí o Apache pede
usuário e senha *antes* de entregar qualquer arquivo: quem não acertar recebe 401 e
não leva nem o HTML nem o `cofre.js`. Sem o arquivo, não há o que atacar offline. O
login da página continua valendo como segunda camada.

**Como ligar (2 minutos, sem mexer em código):** no painel da hospedagem, procurar
"Proteção de diretório" / "Directory Privacy", apontar para a pasta
`cp/treinamentos/gerar` e criar usuário e senha. O painel escreve o `.htaccess` e o
`.htpasswd` com o caminho certo.

**Na mão:** o bloco já está escrito e comentado em `gerar/.htaccess`. Descomentar e
trocar o `AuthUserFile` pelo caminho absoluto real da hospedagem (algo como
`/home/USUARIO/public_html/cp/treinamentos/gerar/.htpasswd`). Se o caminho estiver
errado, o Apache responde 500 na pasta inteira — por isso não deixei ativo.

**Se optar por não ligar:** a força da senha passa a ser a única defesa. Trocar
`Xperiun1234` por algo longo e aleatório (quatro palavras sorteadas, por exemplo) e
gerar um cofre novo.

---

## Trocar credenciais ou tokens

Os tokens não estão em texto claro em lugar nenhum: `cursos.js` guarda só o
**SHA-256** de cada token (o que a página do aluno usa para conferir o que veio na
URL), e o token em si vive cifrado no `cofre.js`.

Para gerar um cofre novo (senha diferente, token diferente, ou token por curso),
rodar um script Node com o `crypto` nativo:

```js
const crypto = require('crypto');
const USUARIO = 'Xperiun', SENHA = '<senha nova>', ITER = 310000;
const TOKENS = { 'power-bi-avancado': '<token>', /* ...um por slug... */ };

const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(USUARIO + ':' + SENHA, salt, ITER, 32, 'sha256');
const c = crypto.createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([c.update(JSON.stringify(TOKENS), 'utf8'), c.final()]);

console.log({ salt: salt.toString('base64'), iv: iv.toString('base64'), iter: ITER,
              dados: Buffer.concat([ct, c.getAuthTag()]).toString('base64') });

for (const [slug, t] of Object.entries(TOKENS))
    console.log(slug, crypto.createHash('sha256').update(t).digest('hex'));
```

O objeto vai para o `cofre.js`; os hashes, para o `tokenHash` de cada curso no
`cursos.js`. O `dados` precisa ser `ciphertext + authTag` concatenados, que é o
formato que o WebCrypto do navegador espera.

---

## Já está feito

- Fora de busca: `<meta robots>` nas páginas, `X-Robots-Tag` no `.htaccess` cobrindo
  todos os arquivos (inclusive imagens) e 403 para crawler conhecido.
- `anti-copy.js` do projeto e `guard.js` (bloqueia `file://` e iframe de terceiro).
- CSP em enforcement, `X-Frame-Options: DENY`, `nosniff`, CORP/COOP, hotlink
  protection nos assets, sem listagem de diretório.
- `Referrer-Policy: same-origin` — **não trocar por `no-referrer`**: o
  `/ed/.htaccess` só serve `root.css`, fontes e logo quando recebe referer do
  próprio domínio, então sem referer a página perde o estilo.

## Onde mais isto vive

Este mesmo conjunto está no repositório do Cloudflare (`site-xperiun`), em
`/cp/treinamentos/`. Lá a proteção do `/gerar/` é um middleware de Pages Function
(`functions/cp/treinamentos/gerar/_middleware.js`), que é mais forte que o Basic Auth
e já vem pronto: basta criar a variável de ambiente com a senha no painel do
Cloudflare. Mudou o catálogo aqui, replicar lá (e vice-versa).
