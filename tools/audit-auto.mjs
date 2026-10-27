// 找出 d2r-auto.json 裡可能誤配的條目，給人工（或翻譯）重看：
//   1. 技能變體名稱（遊戲自己取的，例如 Vortex、Searing），D2R 同名的字串多半是別的東西
//   2. 全大寫的按鈕、標題（KEEP、RELOAD），D2R 同名的是別的介面
//   3. 英文跟 D2R 一樣，但遊戲的韓文跟 D2R 的 koKR 不一樣（作者的韓文多半照 D2R；不一樣代表用在別的意思）
//   node tools/audit-auto.mjs <app.asar 解開的 assets 資料夾> <ko.json> <D2R 字串資料夾> <d2r-auto.json> <輸出 .json>
import fs from 'node:fs';
import path from 'node:path';

const [assetsDir, koFile, d2rDir, autoFile, outFile] = process.argv.slice(2);
if (!outFile) { console.error('用法：node tools/audit-auto.mjs <assets 資料夾> <ko.json> <D2R 字串資料夾> <d2r-auto.json> <輸出 .json>'); process.exit(1); }
const norm = s => s.replace(/\s+/g, ' ').trim().toUpperCase();
const clean = s => (s ?? '').replace(/ÿc./g, '').replace(/\[[a-z]{2}\]/g, '').trim();
const PREFIX = /^(item|affix|monster|unique|title):/;

// 技能變體：程式裡是 skillId:[{id:`x`,name:`Name`,describe:`…`,…},…]
const modifiers = new Map();
for (const file of fs.readdirSync(assetsDir).filter(n => n.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(assetsDir, file), 'utf8');
  for (const group of src.matchAll(/(\w+):\[(\{id:`[^`]+`,name:`[^`]+`,describe:`[^`]*`[^\]]*)\]/g)) {
    for (const m of group[2].matchAll(/\{id:`[^`]+`,name:`([^`]+)`,describe:`([^`]*)`/g)) {
      modifiers.set(m[1], { skill: group[1], describe: m[2] });
    }
  }
}

const byEn = new Map();
for (const file of fs.readdirSync(d2rDir).filter(n => n.endsWith('.json'))) {
  for (const row of JSON.parse(fs.readFileSync(path.join(d2rDir, file), 'utf8'))) {
    const en = clean(row.enUS);
    if (!en || /%/.test(en)) continue;
    (byEn.get(norm(en)) ?? byEn.set(norm(en), []).get(norm(en))).push({ file, id: row.Key, ko: clean(row.koKR), zh: clean(row.zhTW) });
  }
}

const ko = JSON.parse(fs.readFileSync(koFile, 'utf8'));
const auto = JSON.parse(fs.readFileSync(autoFile, 'utf8'));
const suspects = [];
for (const [key, zh] of Object.entries(auto)) {
  const core = key.replace(PREFIX, '');
  const cands = byEn.get(norm(core)) ?? [];
  const reasons = [];
  if (!PREFIX.test(key) && modifiers.has(core)) reasons.push('技能變體名稱');
  if (/[A-Z]{2}/.test(core) && core === core.toUpperCase()) reasons.push('全大寫按鈕');
  const gameKo = ko[key].replace(/\s+/g, '');
  if (cands.length && !cands.some(c => c.ko.replace(/\s+/g, '') === gameKo)) reasons.push('韓文跟 D2R 不同');
  if (!reasons.length) continue;
  const mod = modifiers.get(core);
  suspects.push({
    key, ko: ko[key], zh, reasons,
    ...(mod && { modifierOf: mod.skill, describe: mod.describe }),
    d2r: cands.map(c => `${c.file.replace('.json', '')}:${c.id}=${c.zh}（${c.ko}）`),
  });
}
fs.writeFileSync(outFile, JSON.stringify(suspects, null, 1));
const count = r => suspects.filter(s => s.reasons.includes(r)).length;
console.log(`技能變體 ${modifiers.size} 個；d2r-auto ${Object.keys(auto).length} 條，可疑 ${suspects.length} 條 → ${outFile}`);
console.log(`  技能變體名稱 ${count('技能變體名稱')}、全大寫按鈕 ${count('全大寫按鈕')}、韓文跟 D2R 不同 ${count('韓文跟 D2R 不同')}（可重疊）`);
