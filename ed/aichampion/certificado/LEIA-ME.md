# Certificado da Formação AI Champion

Página do aluno: entra com usuário e senha, digita o nome e baixa o badge e o PDF
do certificado. Duas telas na mesma página, sem popup.

Estrutura e layout portados do `/cp/treinamentos/certificado/`; o portão de acesso,
do `/cp/treinamentos/gerar/`. O PDF é montado no navegador (JS puro, sem libs)
sobre a arte JPEG, com Poppins embutida como fonte CID, o que deixa o texto
selecionável e buscável.

Abrir em `/ed/aichampion/certificado/`. Aceita `?nome=` para pré-preencher o
campo depois do login (mesmo parâmetro que o menu-topo usa).

## Acesso

| | |
| --- | --- |
| Usuário | `incomparável` ou `incomparavel`, em qualquer caixa |
| Senha | `xperiun`, exatamente assim |

O usuário é normalizado antes de conferir (NFD, fora os acentos, minúsculas, sem
espaço nas pontas), então `IncOmParável`, `INCOMPARAVEL` e `  Incomparavel  `
entram igual. A senha é conferida como digitada.

A senha não está no código: o que está no `acesso.js` é o resultado de um
PBKDF2-SHA256 de 310.000 iterações sobre `usuário:senha`, com sal aleatório, os
mesmos parâmetros do `cofre.js` do `/cp/treinamentos/`. Errar a senha vai deixando
a tentativa pela tela mais lenta (1s, 2s, até 5s). Não há sessão salva: recarregou,
pede de novo.

**Até onde isso protege.** No `/cp/treinamentos/gerar/` a derivação abre um pacote
AES-GCM, então sem as credenciais não existe token nenhum para extrair. Aqui não há
segredo para destrancar, porque a arte do certificado é arquivo estático e continua
alcançável por URL direta. Ou seja: isto segura visita casual e link repassado, não
segura quem abre o devtools. Se precisar valer de verdade, o caminho é o mesmo de
lá: proteção de diretório no servidor, ou middleware de Pages Function no repo do
Cloudflare.

Para trocar as credenciais, gerar outro par sal/hash e substituir no `acesso.js`:

```js
const crypto = require('crypto');
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const salt = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync(norm('<usuário>') + ':' + '<senha>', salt, 310000, 32, 'sha256');
console.log({ salt: salt.toString('base64'), hash: hash.toString('base64') });
```

## Segurança

Mesmo conjunto do `/cp/treinamentos/` (ver o LEIA-ME de lá), montado em camadas.

### Fora de busca
`<meta robots>` na página, `X-Robots-Tag` no `.htaccess`/`_headers` cobrindo TODOS
os arquivos da pasta (arte, badge, CSS, JS, não só o HTML) e 403 para crawler
conhecido, incluindo os de IA e os de SEO.

A página **não** entra em `Disallow` no `robots.txt`, de propósito, pela mesma
regra que o arquivo já documenta: bloquear por `Disallow` impede o Google de LER
a tag `noindex`, e a URL acaba indexada sem título nem descrição.

### Headers
`X-Frame-Options: DENY`, `nosniff`, CORP e COOP same-origin, `Permissions-Policy`
fechando clipboard, câmera, microfone e geolocalização, e `Cache-Control:
no-store` no HTML.

`Referrer-Policy: same-origin`, **não trocar por `no-referrer`**: o `/ed/.htaccess`
só serve `root.css`, as fontes e o logo quando recebe referer do próprio domínio,
então sem referer a página perde o estilo.

### CSP em enforcement
```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:; font-src 'self'; connect-src 'self';
object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
```
Não Report-Only como o resto do site: aqui não há `<script>` inline (o guard que
seria inline é o `guard.js`) e nada vem de fora, porque `root.css`, `fonts.css` e
as Poppins são self-hosted. `blob:` cobre o PDF montado no navegador. Colar GTM
nesta página quebra a CSP, e é pra quebrar: página atrás de login não leva tracking.

### Hotlink dos assets (só Apache)
Requisição sem referer nosso, ou digitada na barra de endereço, vira 404 para
`jpg/png/webp/svg/css/js/ttf/woff2`. É o que impede alguém de puxar a arte do
certificado ou o badge em alta sem passar pela página. No Cloudflare isso não é
por arquivo: se precisar, é Scrape Shield › Hotlink Protection no painel.

### Guard e anti-copy
`guard.js` (cópia do `/cp/treinamentos/`) barra `file://` e iframe de terceiro;
`anti-copy.js` do projeto bloqueia botão direito, F12 e Ctrl+U/S.

### A trava que ainda não está ligada

O login é JavaScript: o `acesso.js` precisa chegar ao navegador para desenhar a
tela, e quem salvar esse arquivo pode testar senhas offline, sem limite e sem
deixar rastro. Nenhuma das camadas acima resolve isso. As duas que resolvem:

| Onde | Como | Estado |
| --- | --- | --- |
| Apache | bloco Basic Auth comentado no fim do `.htaccess` | desligado |
| Cloudflare | `functions/ed/aichampion/certificado/_middleware.js`, env var `AICHAMPION_CERT_SENHA` | desligado (sem a env var, deixa passar) |

As duas ficam desligadas por padrão porque **o aluno passaria a digitar senha
duas vezes**: a do servidor e a da própria página. No `/cp/treinamentos/gerar/`
esse custo não existe, porque lá o público é um treinador só; aqui é a turma
inteira. Ligar é uma troca consciente de conveniência por segurança.

Para ligar no Cloudflare: Settings › Environment variables, criar
`AICHAMPION_CERT_SENHA` em **Production E Preview**. A senha fica na env var e
não no código, porque o repo vai pro GitHub e hardcoded ela entraria no
histórico para sempre.

## Arquivos

| arquivo | o que é |
| --- | --- |
| `index.html` | as duas telas (acesso e emissão) |
| `dependencias/style.css` | layout, portado do `/cp/treinamentos/dependencias/style.css` |
| `dependencias/acesso.js` | conferência das credenciais (equivale ao `cofre.js`) |
| `dependencias/cert-form.js` | telas + gerador do PDF |
| `dependencias/guard.js` | cópia do `/cp/treinamentos/`: barra `file://` e iframe de terceiro |
| `.htaccess` | endurecimento do Apache (só no repo Compartilhado; o build do Cloudflare ignora `**/.htaccess`) |

A página mora em `/ed/`, então todo caminho de CSS, JS e asset é absoluto
(`/ed/aichampion/certificado/...`). Caminho relativo quebraria a página quando
abrem o endereço com barra no final.

## Arte

| arquivo | o que é |
| --- | --- |
| `certificado-AI-Champion.jpg` | fundo do certificado, 1754 x 1240 px |
| `Badge-AI-Champion.png` | badge 1120 x 1120, é o que sai no "Baixar Badge" |
| `Badge-AI-Champion-200.webp` | badge 200 x 200 com alpha, é o que anima na tela |

O `-200.webp` é derivado do PNG (Lanczos, qualidade 85, method 6). Para refazer
depois de trocar o PNG:

```
python -c "from PIL import Image; Image.open('Badge-AI-Champion.png').convert('RGBA').resize((200,200), Image.LANCZOS).save('Badge-AI-Champion-200.webp','WEBP',quality=85,method=6)"
```

O fundo tem que ser JPEG mesmo (o PDF usa `DCTDecode`); PNG não passa. Se a arte
sair em outro tamanho, ajustar `CERT_W` / `CERT_H` no `dependencias/cert-form.js`.

## Texto que sai no certificado

```
Conferimos este certificado a
<NOME DIGITADO>
pela participação na
Formação AI Champion,                                          <- bold
realizada aos sábados, 08, 15, 22 e 29 de agosto de 2026, das 9h às 13h.
```

Fica em `montarPdf()` (`L1`, `L3`, `L4`, `L5`). As posições e corpos (65pt no nome,
35pt no resto) são os mesmos do `/temp/certificado-be-a-ba-ia-3/`, de onde esta
página saiu. A única diferença de engenharia é um limite de largura
(`MAX_W = 1594pt`): a linha das datas é bem mais longa que a de um evento de um dia
só, então qualquer linha que passe disso encolhe até caber, sem mexer na baseline.
Medido: a linha das datas dá 1242pt, cabe folgado; a trava só age em nome muito
comprido.

Atenção ao mexer no bloco de texto: esta arte tem três assinaturas empilhadas na
diagonal, e a linha das datas fecha a uns 20px do topo do badge. Sobrou pouca
folga vertical para descer o bloco.
