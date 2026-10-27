// 產生更新來源 manifest v2（格式見 docs/manifest-v2.md）：<輸出資料夾>/manifest.json 和 <輸出資料夾>/dict/<id>.json
//   node tools/make-manifest.mjs [輸出資料夾，預設 site/data]
// 啟動器、網頁版書籤、網站讀同一份。字典網址相對於 manifest.json，帶內容雜湊（Pages 的 CDN 會快取）。
//   共用欄位（最上層、languages[] 的 id／name／status／entries／dict、game）：這裡產生，語言清單和狀態來自 tools/langs.mjs（draft 的不放）
//   桌面版（languages[].desktop、desktop）：tools/patch-rules.mjs 的 LANGUAGES／RULES／ASSETS_DIR／DICT_TARGET
//   網頁版（languages[].web、web）：tools/web-rules.mjs 的 WEB_LANGUAGES／WEB_RULES（還沒匯出 WEB_LANGUAGES 時不輸出）
//   launcher：還沒有 GitHub Release，先不輸出
// 字典和規則都沒變時不改寫 manifest.json（updated／version 才不會每次都變）
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { TARGETS, target } from './langs.mjs';
import { ASSETS_DIR, DICT_TARGET, RULES, LANGUAGES } from './patch-rules.mjs';

const outDir = process.argv[2] ?? 'site/data';
const web = await import('./web-rules.mjs');

const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');
const now = new Date();
const stamp = now.toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');

// 網頁版每個語言的設定：陣列（每筆有 id）或以 id 為 key 的物件都可以
const webLangs = web.WEB_LANGUAGES && (Array.isArray(web.WEB_LANGUAGES)
  ? Object.fromEntries(web.WEB_LANGUAGES.map(({ id, ...l }) => [id, l]))
  : web.WEB_LANGUAGES);

// 桌面版規則對得上的遊戲版本：versions/ 裡最新的一版（只給網站顯示）
const desktopVersion = fs.existsSync('versions')
  ? fs.readdirSync('versions').filter(n => /^\d+\.\d+\.\d+$/.test(n)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).at(-1)
  : undefined;

fs.mkdirSync(path.join(outDir, 'dict'), { recursive: true });
// status 是 draft 的語言（還在做）不發布。啟動器只認得 available 和 beta，其他的會當成正式版顯示，所以別的值一律擋下來
const languages = Object.entries(TARGETS).filter(([, t]) => t.status !== 'draft').map(([id, t]) => {
  if (!['available', 'beta'].includes(t.status)) throw new Error(`${id} 的 status「${t.status}」不能發布（只能是 available、beta，還在做的用 draft）`);
  const buf = fs.readFileSync(target(id).out);
  const entries = Object.keys(JSON.parse(buf.toString('utf8'))).length;
  fs.writeFileSync(path.join(outDir, 'dict', `${id}.json`), buf);
  const hash = sha256(buf);
  const lang = { id, name: t.name, status: t.status, entries, dict: { url: `dict/${id}.json?v=${hash.slice(0, 12)}`, sha256: hash, size: buf.length } };
  const desktop = LANGUAGES.find(l => l.id === id);
  if (desktop) lang.desktop = { menu_name: desktop.menu_name, html_lang: desktop.html_lang, groups: desktop.groups };
  if (webLangs?.[id]) lang.web = webLangs[id];
  console.log(`${id}：${entries} 條（${t.status}）${desktop ? '、桌面版' : ''}${lang.web ? '、網頁版' : ''}`);
  return lang;
});

// 拿掉已經不發布的語言的字典
for (const name of fs.readdirSync(path.join(outDir, 'dict'))) {
  if (!languages.some(l => `${l.id}.json` === name)) fs.rmSync(path.join(outDir, 'dict', name));
}

const manifest = {
  schema: 2,
  updated: now.toISOString(),
  version: stamp,
  game: { ...(desktopVersion && { desktop: desktopVersion }), ...(web.WEB_CHECKED && { web_checked: web.WEB_CHECKED }) },
  languages,
  desktop: { assets_dir: ASSETS_DIR, dict_target: DICT_TARGET, rules: RULES },
  ...(webLangs && { web: { play_url: web.WEB_PLAY_URL ?? 'https://d2survivors.lol/play/', rules: web.WEB_RULES } }),
};

const file = path.join(outDir, 'manifest.json');
const strip = m => JSON.stringify({ ...m, updated: undefined, version: undefined });
const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
if (old && strip(old) === strip(manifest)) {
  console.log(`沒有變動，${file} 不改寫（${old.version}）`);
} else {
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`完成：${file}（${stamp}）`);
}
