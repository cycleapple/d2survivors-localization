// 合併字典：後面的檔案蓋過前面的（例如 d2r-auto.json 之後接 manual/*.json）
// 只收韓文字典裡有的 key、佔位符跟韓文一樣的譯文；其他列在報告裡。
// 韓文字典沒有的 key（遊戲有這句但韓文版也沒翻）也收，佔位符要剛好是 key 裡 * 和 # 的數量
//   node tools/merge-dict.mjs <ko.json> <輸出 zh-TW.json> <字典 .json…>
import fs from 'node:fs';

const [koFile, outFile, ...dictFiles] = process.argv.slice(2);
if (!koFile || !outFile || !dictFiles.length) { console.error('用法：node tools/merge-dict.mjs <ko.json> <輸出 zh-TW.json> <字典 .json…>'); process.exit(1); }

const ko = JSON.parse(fs.readFileSync(koFile, 'utf8'));
const placeholders = s => (s.match(/\{\d+\}/g) ?? []).sort().join();
const expected = key => key in ko ? placeholders(ko[key]) : Array.from({ length: (key.match(/[*#]/g) ?? []).length }, (_, i) => `{${i}}`).sort().join();
const merged = {}, from = {}, rejected = [], added = [];
for (const file of dictFiles) {
  const dict = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  for (const [key, zh] of Object.entries(dict)) {
    if (typeof zh !== 'string' || !zh.trim()) { rejected.push(`${file}：空的譯文：${key}`); continue; }
    if (placeholders(zh) !== expected(key)) { rejected.push(`${file}：佔位符不同：${key} → ${zh}`); continue; }
    if (!(key in ko)) added.push(key);
    merged[key] = zh;
    from[key] = file;
  }
}

// 稀有名稱後段的一致性：同一個英文後段，扣掉前段的官方譯法後，剩下的譯法應該一樣。
// 前段的官方譯法 = d2r-auto 裡同一個前段的所有名稱的共同開頭（至少要有兩個名稱）
const RARE = /^[A-Z][a-z']+ [A-Z][a-z']+$/;
const officialByFront = new Map();
for (const [key, zh] of Object.entries(merged)) {
  if (!RARE.test(key) || !from[key].includes('d2r-auto')) continue;
  const front = key.split(' ')[0];
  (officialByFront.get(front) ?? officialByFront.set(front, []).get(front)).push(zh);
}
const frontZh = new Map();
for (const [front, names] of officialByFront) {
  if (names.length < 2) continue;
  let common = names[0];
  for (const s of names) while (!s.startsWith(common)) common = common.slice(0, -1);
  if (common) frontZh.set(front, common);
}
const backs = new Map();
for (const [key, zh] of Object.entries(merged)) {
  if (!RARE.test(key) || from[key].includes('d2r-auto')) continue;
  const [front, back] = key.split(' ');
  const f = frontZh.get(front);
  if (!f || !zh.startsWith(f)) continue;
  const rest = zh.slice(f.length);
  if (!backs.has(back)) backs.set(back, new Map());
  backs.get(back).set(rest, [...(backs.get(back).get(rest) ?? []), key]);
}
const inconsistent = [...backs].filter(([, m]) => m.size > 1).map(([back, m]) => ({ back, forms: Object.fromEntries([...m].map(([rest, keys]) => [rest, keys.length])) }));

fs.writeFileSync(outFile, JSON.stringify(merged, null, 1));
const total = Object.keys(ko).length, n = Object.keys(merged).length;
console.log(`${n} / ${total} 條（${(n / total * 100).toFixed(1)}%）→ ${outFile}`);
if (added.length) console.log(`韓文字典沒有、新增的 ${added.length} 條：${added.join('｜')}`);
if (rejected.length) console.log(`沒收進來 ${rejected.length} 條：\n${rejected.slice(0, 30).join('\n')}`);
if (inconsistent.length) console.log(`稀有名稱後段譯法不一致 ${inconsistent.length} 個：\n${inconsistent.map(x => `${x.back}：${JSON.stringify(x.forms)}`).join('\n')}`);
