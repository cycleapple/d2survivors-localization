// 把翻譯字典放進遊戲的 app.asar（取代韓文字典的位置），輸出新的 app.asar
//   node tools/patch.mjs <原始 app.asar> <字典 .json> <輸出 app.asar> [--lang zh-TW|zh-CN|ja|de|fr|ru]
// 修改規則在 patch-rules.mjs（啟動器也用同一份），依語言的 groups 套用；預設繁中
import { extractAll, createPackage } from '@electron/asar';
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS_DIR, DICT_TARGET, RULES, LANGUAGES, applyRule } from './patch-rules.mjs';
import { takeLang } from './langs.mjs';

const { lang: target, args } = takeLang(process.argv.slice(2));
const [src, dictFile, out] = args;
if (!src || !dictFile || !out) { console.error('用法：node tools/patch.mjs <原始 app.asar> <字典 .json> <輸出 app.asar> [--lang zh-TW|zh-CN|ja|de|fr|ru]'); process.exit(1); }
const lang = LANGUAGES.find(l => l.id === target.id);
if (!lang) throw new Error(`patch-rules.mjs 的 LANGUAGES 沒有 ${target.id}`);

const tmp = path.resolve('work/patch-tmp');
fs.rmSync(tmp, { recursive: true, force: true });
extractAll(src, tmp);
const assets = path.join(tmp, ASSETS_DIR);

function findAsset(re) {
  const hits = fs.readdirSync(assets).filter(n => re.test(n));
  if (hits.length !== 1) throw new Error(`找到 ${hits.length} 個符合 ${re} 的檔案，預期 1 個`);
  return path.join(assets, hits[0]);
}


// 這個語言的字型（tools/zh-fonts.mjs 從本機 D2R 取出的）：有就放進 fonts-zh/（資料夾名稱沿用，俄文也放這裡），
// 「中文字型」「俄文字型」規則會載入它
const LOCAL_FONTS = target.fonts;
const fonts = fs.existsSync(LOCAL_FONTS) ? fs.readdirSync(LOCAL_FONTS).filter(n => n.endsWith('.woff2')) : [];
if (fonts.length) {
  const fontDir = path.join(assets, '..', 'fonts-zh');
  fs.mkdirSync(fontDir, { recursive: true });
  for (const n of fonts) fs.copyFileSync(path.join(LOCAL_FONTS, n), path.join(fontDir, n));
}
console.log(fonts.length ? `字型：${fonts.join('、')}` : `沒有 ${LOCAL_FONTS}，用系統字型`);

const dict = JSON.parse(fs.readFileSync(dictFile, 'utf8'));
fs.writeFileSync(findAsset(new RegExp(DICT_TARGET.file)), DICT_TARGET.template.replace('{{dict}}', () => JSON.stringify(dict)));

// 加分的規則（optional）對不上就略過、照樣打包；必要的對不上就停下來
const skipped = [];
for (const rule of RULES.filter(r => r.groups.some(g => lang.groups.includes(g)))) {
  try {
    // find／replace（沒有的話逐字比對 from／to），在 file 指定的檔案、或所有 .js 裡要剛好出現一次（patch-rules.mjs 的 applyRule）
    const cands = fs.readdirSync(assets).filter(n => rule.file ? new RegExp(rule.file).test(n) : n.endsWith('.js'));
    const hits = cands.map(n => [n, applyRule(fs.readFileSync(path.join(assets, n), 'utf8'), rule, lang)]).filter(([, r]) => r.count > 0);
    if (hits.length !== 1 || hits[0][1].count !== 1) throw new Error(`${rule.label}：預期在 1 個檔案裡出現 1 次，實際 ${hits.map(([n, r]) => `${n}×${r.count}`).join('、') || '0 次'}`);
    fs.writeFileSync(path.join(assets, hits[0][0]), hits[0][1].out);
  } catch (e) {
    if (!rule.optional) throw e;
    skipped.push(rule.label);
    console.warn(`略過加分的規則：${e.message}`);
  }
}
if (skipped.length) console.warn(`略過 ${skipped.length} 條加分的規則（遊戲可能改版了，用 tools/check-rules.mjs 檢查）`);

await createPackage(tmp, out);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`完成：${out}（${lang.name}，${Object.keys(dict).length} 條）`);
