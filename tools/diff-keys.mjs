// 比對兩個版本的韓文字典：新增、刪除、韓文改了（英文 key 一樣、作者改了韓文譯文，意思可能也改了）
//   node tools/diff-keys.mjs <舊 ko.json> <新 ko.json> <輸出 .json>
import fs from 'node:fs';

const [oldFile, newFile, outFile] = process.argv.slice(2);
if (!outFile) { console.error('用法：node tools/diff-keys.mjs <舊 ko.json> <新 ko.json> <輸出 .json>'); process.exit(1); }
const before = JSON.parse(fs.readFileSync(oldFile, 'utf8'));
const after = JSON.parse(fs.readFileSync(newFile, 'utf8'));
const added = Object.keys(after).filter(k => !(k in before));
const removed = Object.keys(before).filter(k => !(k in after));
const koChanged = Object.keys(after).filter(k => k in before && before[k] !== after[k]);
fs.writeFileSync(outFile, JSON.stringify({
  added: Object.fromEntries(added.map(k => [k, after[k]])),
  removed: Object.fromEntries(removed.map(k => [k, before[k]])),
  koChanged: Object.fromEntries(koChanged.map(k => [k, { before: before[k], after: after[k] }])),
}, null, 1));
console.log(`舊 ${Object.keys(before).length} 條 → 新 ${Object.keys(after).length} 條：新增 ${added.length}、刪除 ${removed.length}、韓文改了 ${koChanged.length} → ${outFile}`);
