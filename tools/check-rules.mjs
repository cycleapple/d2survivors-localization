// 檢查 patch-rules.mjs 的每條規則在某個版本的遊戲裡還對不對得上（不修改任何檔案）
//   node tools/check-rules.mjs <app.asar 解開的資料夾>
// 每條規則的 from 要在目標檔案裡剛好出現一次；對不上的列出來，要照新版的程式碼改規則
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS_DIR, DICT_TARGET, RULES, LANGUAGES, fillTemplate } from './patch-rules.mjs';

const [root] = process.argv.slice(2);
if (!root) { console.error('用法：node tools/check-rules.mjs <app.asar 解開的資料夾>'); process.exit(1); }
const assets = path.join(root, ASSETS_DIR);
const files = fs.readdirSync(assets).filter(n => n.endsWith('.js'));
const read = n => fs.readFileSync(path.join(assets, n), 'utf8');
const lang = LANGUAGES[0];
let bad = 0;

const dictFiles = files.filter(n => new RegExp(DICT_TARGET.file).test(n));
console.log(`${dictFiles.length === 1 ? 'OK  ' : '失敗'} 字典位置（${DICT_TARGET.file}）：${dictFiles.join('、') || '找不到'}`);
if (dictFiles.length !== 1) bad++;

for (const rule of RULES) {
  const from = fillTemplate(rule.from, lang);
  const candidates = rule.file ? files.filter(n => new RegExp(rule.file).test(n)) : files;
  const hits = candidates.map(n => [n, read(n).split(from).length - 1]).filter(([, c]) => c > 0);
  const total = hits.reduce((s, [, c]) => s + c, 0);
  const ok = total === 1;
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : '失敗'} ${rule.label}：${ok ? hits[0][0] : total === 0 ? '找不到' : `出現 ${total} 次（${hits.map(([n, c]) => `${n}×${c}`).join('、')}）`}`);
}
console.log(bad ? `\n${bad} 條要改` : '\n全部對得上');
process.exitCode = bad ? 1 : 0;
