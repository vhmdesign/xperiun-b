// Baixa o Material Symbols subsetado (só os ícones usados no site) e gera material-symbols.css local. Temporário.
const fs = require('fs');
const path = require('path');
const OUT = 'ed/site-dependencias/site-fonts';
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const icons = 'account_balance,account_balance_wallet,account_tree,add,analytics,api,apps,architecture,arrow_back,arrow_cool_down,arrow_forward,arrow_insert,arrow_left_alt,arrow_right_alt,assignment,auto_awesome,auto_graph,bolt,build,business_center,cable,cancel,check,check_circle,chevron_left,chevron_right,cleaning_services,close,cloud_upload,co_present,code,contact_support,conveyor_belt,data_object,database,deployed_code,device_hub,download,expand_less,expand_more,folder_special,function,grid_view,group,groups,handshake,how_to_reg,hub,insights,leaderboard,live_tv,local_shipping,mail,manage_accounts,map,memory,menu_book,model_training,monitoring,notifications,play_arrow,play_circle,psychology,quiz,recommend,remove,rocket_launch,rule,schedule,schema,school,sell,share,shield,shopping_cart,smart_toy,south,south_west,speed,star,storage,table_view,terminal,trending_up,verified,verified_user,warehouse,warning,work,workspace_premium';
const url = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,200..400,0,0&icon_names=' + icons + '&display=block';

async function dl(u) {
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + u);
  return r;
}

(async () => {
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
  // classe base (igual à que o Google fornecia) — mantém font-size/display/liga
  outCss += ".material-symbols-outlined{font-family:'Material Symbols Outlined';font-weight:normal;font-style:normal;font-size:24px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-feature-settings:'liga';-webkit-font-smoothing:antialiased;}\n";
  fs.writeFileSync(path.join(OUT, 'material-symbols.css'), outCss);
  console.log('--- material-symbols.css OK (' + faces.length + ' faces) ---');
})().catch(e => { console.error(e); process.exit(1); });
