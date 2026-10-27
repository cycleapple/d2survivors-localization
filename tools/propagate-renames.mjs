// 審核改了名稱之後，把已翻好的句子裡引用的舊名稱一起換掉
// 只換「英文原文確實提到那個名稱」的句子；有「舊名」就換「新名」，沒有括號的才換裸字。
// 稀有物品名稱（兩個首字大寫的字）不換：裡面的前段、後段是 D2R 官方的組字（Ward → 守護），跟改名的技能變體無關。
// 換完一定要看輸出：同一個英文字在句子裡可能是別的意思（Return to game、Share 按鈕）
//   node tools/propagate-renames.mjs <舊字典 d2r-auto.json> <審核結果 .json…> -- <要更新的字典 .json…>
import fs from 'node:fs';

const args = process.argv.slice(2);
const sep = args.indexOf('--');
if (sep < 2) { console.error('用法：node tools/propagate-renames.mjs <舊字典> <審核結果…> -- <要更新的字典…>'); process.exit(1); }
const [oldFile, ...auditFiles] = args.slice(0, sep);
const targets = args.slice(sep + 1);

const old = JSON.parse(fs.readFileSync(oldFile, 'utf8'));
const renames = [];
for (const file of auditFiles) {
  for (const [key, zh] of Object.entries(JSON.parse(fs.readFileSync(file, 'utf8')))) {
    const before = old[key];
    // 只處理名稱（沒有佔位符、不是句子）
    if (!before || before === zh || /\{\d\}/.test(before) || before.length < 2 || key.length > 40) continue;
    renames.push({ en: key.replace(/^(item|affix|monster|unique|title):/, ''), from: before, to: zh });
  }
}

const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let total = 0;
for (const file of targets) {
  const dict = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = 0;
  for (const [key, zh] of Object.entries(dict)) {
    if (/^[A-Z][a-z']+ [A-Z][a-z']+$/.test(key)) continue;
    let next = zh;
    for (const r of renames) {
      if (!new RegExp(`(^|[^A-Za-z])${escape(r.en)}([^A-Za-z]|$)`).test(key)) continue;
      if (next.includes(`「${r.from}」`)) next = next.replaceAll(`「${r.from}」`, `「${r.to}」`);
      else if (next.includes(r.from)) next = next.replaceAll(r.from, r.to);
    }
    if (next !== zh) { console.log(`${file}｜${key.slice(0, 60)}\n    ${zh}\n →  ${next}`); dict[key] = next; changed++; }
  }
  if (changed) fs.writeFileSync(file, JSON.stringify(dict, null, 1));
  total += changed;
}
console.log(`改名 ${renames.length} 個；更新了 ${total} 條`);
