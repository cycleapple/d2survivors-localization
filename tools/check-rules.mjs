// 檢查 patch-rules.mjs 的每條規則在某個版本的遊戲裡還對不對得上（不修改任何檔案）
//   node tools/check-rules.mjs <app.asar 解開的資料夾>
// 每條規則的 from 要在目標檔案裡剛好出現一次；對不上的列出來，要照新版的程式碼改規則。
// 必要的規則（和字典位置）對不上時 exit code 1（啟動器會整個退回原版）；只有加分的（optional）對不上時 exit code 0（啟動器略過那幾條、照樣套用翻譯）。
// 最後一行是給自動偵測讀的總結：RESULT required_failed=<n> optional_failed=<n>
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS_DIR, DICT_TARGET, RULES, LANGUAGES, fillTemplate } from './patch-rules.mjs';

const [root] = process.argv.slice(2);
if (!root) { console.error('用法：node tools/check-rules.mjs <app.asar 解開的資料夾>'); process.exit(1); }
const assets = path.join(root, ASSETS_DIR);
const files = fs.readdirSync(assets).filter(n => n.endsWith('.js'));
const read = n => fs.readFileSync(path.join(assets, n), 'utf8');
const lang = LANGUAGES[0];
const failed = { required: [], optional: [] };

const dictFiles = files.filter(n => new RegExp(DICT_TARGET.file).test(n));
console.log(`${dictFiles.length === 1 ? 'OK  ' : '失敗（必要）'} 字典位置（${DICT_TARGET.file}）：${dictFiles.join('、') || '找不到'}`);
if (dictFiles.length !== 1) failed.required.push('字典位置');

for (const rule of RULES) {
  const from = fillTemplate(rule.from, lang);
  const candidates = rule.file ? files.filter(n => new RegExp(rule.file).test(n)) : files;
  const hits = candidates.map(n => [n, read(n).split(from).length - 1]).filter(([, c]) => c > 0);
  const total = hits.reduce((s, [, c]) => s + c, 0);
  const ok = total === 1;
  if (!ok) failed[rule.optional ? 'optional' : 'required'].push(rule.label);
  const mark = ok ? 'OK  ' : rule.optional ? '失敗（加分）' : '失敗（必要）';
  console.log(`${mark} ${rule.label}：${ok ? hits[0][0] : total === 0 ? '找不到' : `出現 ${total} 次（${hits.map(([n, c]) => `${n}×${c}`).join('、')}）`}`);
}

console.log('');
if (failed.required.length) console.log(`必要失敗 ${failed.required.length} 條（翻譯會整個退回原版）：${failed.required.join('、')}`);
if (failed.optional.length) console.log(`加分失敗 ${failed.optional.length} 條（略過這幾條，照樣套用翻譯）：${failed.optional.join('、')}`);
if (!failed.required.length && !failed.optional.length) console.log('全部對得上');
console.log(`RESULT required_failed=${failed.required.length} optional_failed=${failed.optional.length}`);
process.exitCode = failed.required.length ? 1 : 0;
