// 翻新語言時，除了自動配對沒對到的，另外要翻的 key：
//   1. 繁中修正過、D2R 同名字串意思不對的（tools/corrected-keys.mjs 的結果）
//   2. 繁中字典裡、韓文字典沒有的（補翻的舊改版說明、章節樣板、Evolves * into *: 這類）；
//      不含 modifier:（技能變體專用譯名另外決定）和新版已經刪掉的
//   node tools/extra-keys.mjs <新版 ko.json> <corrected.json> <diff.json 或 -> <輸出 .json>
import fs from 'node:fs';

const [koFile, correctedFile, diffFile, outFile] = process.argv.slice(2);
if (!outFile) { console.error('用法：node tools/extra-keys.mjs <新版 ko.json> <corrected.json> <diff.json 或 -> <輸出 .json>'); process.exit(1); }
const ko = JSON.parse(fs.readFileSync(koFile, 'utf8'));
const tw = JSON.parse(fs.readFileSync('dict/zh-TW.json', 'utf8'));
const removed = diffFile !== '-' ? Object.keys(JSON.parse(fs.readFileSync(diffFile, 'utf8')).removed) : [];
const corrected = JSON.parse(fs.readFileSync(correctedFile, 'utf8'));
const notInKo = Object.keys(tw).filter(k => !(k in ko) && !k.startsWith('modifier:') && !removed.includes(k));
const keys = [...new Set([...corrected, ...notInKo])];
fs.writeFileSync(outFile, JSON.stringify(keys, null, 1));
console.log(`另外要翻：繁中修正過的 ${corrected.length} 條＋韓文字典沒有的 ${notInKo.length} 條 → ${keys.length} 條 → ${outFile}`);
