// Baixa o Material Symbols subsetado e gera material-symbols.css local.
// Os ícones são AUTO-DESCOBERTOS: o script varre TODO o HTML/JS de ed/ e pega
// tudo que aparece dentro de um elemento .material-symbols-outlined, unido a uma
// lista BASE (ícones setados via JS que não aparecem como texto no HTML).
// => Nunca mais precisa editar lista à mão: adicionou um ícone novo em qualquer
//    página, é só rodar `node dl-symbols.cjs` que ele entra no subset.
const fs = require('fs');
const path = require('path');
const OUT = 'ed/site-dependencias/site-fonts';
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/* BASE: lista mestra (nunca some daqui). Cobre ícones que o scan por regex NÃO
   pega — setados via JS concatenado (ex.: folder_open), em CSS content (ex.:
   keyboard_arrow_down) ou setados dinamicamente. O auto-scan abaixo só ADICIONA
   novos que aparecem no HTML; nada é removido. Se um ícone sumir/quebrar, é só
   garantir que está aqui ou usado num <span class="material-symbols-outlined">. */
const BASE = ('account_balance,account_balance_wallet,account_tree,add,alarm,analytics,api,apps,architecture,arrow_back,arrow_cool_down,arrow_forward,arrow_insert,arrow_left_alt,arrow_outward,arrow_right_alt,assignment,attach_file,auto_awesome,auto_graph,battery_full,bluetooth,bolt,bookmark,build,business_center,cable,calendar_month,camera_alt,cancel,chat,check,check_circle,chevron_left,chevron_right,cleaning_services,close,cloud,cloud_upload,co_present,code,contact_support,content_copy,conveyor_belt,data_object,database,dataset,delete,deployed_code,description,device_hub,directions_car,download,edit,error,expand_less,expand_more,favorite,flight,folder,folder_open,folder_special,function,grid_view,group,groups,handshake,help,home,how_to_reg,hub,image,info,insights,key,keyboard_arrow_down,keyboard_double_arrow_down,language,leaderboard,link,live_tv,local_shipping,location_on,lock,mail,manage_accounts,map,memory,menu,menu_book,mic,model_training,monitoring,notifications,palette,pause,person,phone,place,play_arrow,play_circle,print,psychology,quiz,recommend,refresh,remove,restaurant,rocket_launch,rule,save,schedule,schema,school,search,sell,send,settings,share,shield,shopping_cart,skip_next,skip_previous,smart_toy,south,south_west,speed,star,storage,table_view,terminal,thumb_up,timer,train,trending_up,verified,verified_user,videocam,visibility,volume_up,warehouse,warning,wifi,work,workspace_premium').split(',');

/* Varre recursivamente ed/ por .html e .js */
function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(html|js)$/i.test(e.name)) acc.push(p);
  }
  return acc;
}

/* Pega o nome do ícone (texto) dentro de QUALQUER elemento cuja classe use a
   fonte Material Symbols: material-symbols-outlined/rounded/sharp OU o alias
   curto `ms`. Cobre HTML e template strings de JS. É amplo DE PROPÓSITO: um
   falso-positivo só adiciona um glifo inofensivo ao subset; o perigo real é
   FALTAR um ícone (aí ele vira texto gigante na página). */
const set = new Set(BASE);
const re = /class\s*=\s*["'][^"']*\b(?:material-symbols[\w-]*|ms)\b[^"']*["'][^>]*>\s*([a-z0-9_]+)\s*</g;
for (const f of walk('ed', [])) {
  const txt = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = re.exec(txt))) set.add(m[1]);
}
const icons = [...set].sort().join(',');
/* FILL como eixo VARIÁVEL (0..1) => o subset self-hosted passa a ter ícone
   preenchido também. Antes era FILL fixo em 0 (só outlined), o que forçava
   membros e as páginas do DS a puxar Material Symbols do CDN do Google só pra
   ter os ícones filled — e era justamente esse <link> cross-origin que falhava
   (Firefox com proteção anti-rastreio, redes que bloqueiam fonts.googleapis.com)
   deixando a ligadura virar texto cru ("play_arrow"). Com FILL no subset, zero
   dependência de CDN pra ícone em qualquer página. */
const url = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,200..400,0..1,0&icon_names=' + icons + '&display=block';

async function dl(u) {
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + u);
  return r;
}

(async () => {
  console.log('icons (' + set.size + '): ' + icons);
  const css = await (await dl(url)).text();
  const faces = css.match(/@font-face\s*{[^}]*}/g) || [];
  let outCss = '', seen = new Set();
  for (const face of faces) {
    const wght = ((face.match(/font-weight:\s*([\d.]+)/) || [])[1] || '400');
    const m = face.match(/url\((https:\/\/[^)]+)\)\s*format\(['"]?(\w+)['"]?\)/);
    if (!m) continue;
    const woff2 = m[2] === 'woff2';
    const ext = woff2 ? 'woff2' : 'ttf';
    const file = `material-symbols-${wght}.${ext}`;
    if (!seen.has(file)) {
      seen.add(file);
      const buf = Buffer.from(await (await dl(m[1])).arrayBuffer());
      const tmp = path.join(OUT, file + '.tmp');
      fs.writeFileSync(tmp, buf);
      fs.renameSync(tmp, path.join(OUT, file));
      console.log(file, Math.round(buf.length / 1024) + 'KB');
    }
    outCss += face.replace(/url\([^)]+\)\s*format\([^)]+\)/, `url(/ed/site-dependencias/site-fonts/${file}) format('${woff2 ? 'woff2' : 'truetype'}')`).replace(/\s+/g, ' ').trim() + '\n';
  }
  outCss += ".material-symbols-outlined{font-family:'Material Symbols Outlined';font-weight:normal;font-style:normal;font-size:24px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-feature-settings:'liga';-webkit-font-smoothing:antialiased;}\n";
  fs.writeFileSync(path.join(OUT, 'material-symbols.css'), outCss);
  console.log('--- material-symbols.css OK (' + faces.length + ' faces) ---');
})().catch(e => {
  /* Não-fatal: se a rede/API falhar, mantém o subset existente e deixa o build
     seguir (nunca quebra o deploy por causa disso). Exit 0 de propósito. */
  console.error('[dl-symbols] falhou, mantendo o subset existente:', e.message);
  process.exit(0);
});
