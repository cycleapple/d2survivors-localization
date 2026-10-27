// 檢查一批譯文：每條都要有、佔位符要跟韓文一樣、要有目標語言的字；繁中另外檢查不能有半形冒號逗號接中文
//   node tools/check-batch.mjs <batch-XX.json> <ui-XX.json> [--lang zh-TW|zh-CN|ja]
import fs from 'node:fs';
import { takeLang } from './langs.mjs';

const { lang, args } = takeLang(process.argv.slice(2));
const [batchFile, outFile] = args;
const batch = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
const out = JSON.parse(fs.readFileSync(outFile, 'utf8').replace(/^﻿/, ''));
const placeholders = s => (s.match(/\{\d+\}/g) ?? []).sort().join();
// 韓文字典沒有的 key（ko 是 null）：佔位符照英文 key 裡 * 和 # 的數量
const expected = (key, ko) => ko != null ? placeholders(ko) : Array.from({ length: (key.match(/[*#]/g) ?? []).length }, (_, i) => `{${i}}`).sort().join();
// 不用翻也可以的：專有名詞、按鍵、縮寫
const LATIN_OK = /^[A-Za-z0-9 .:+\-/%×·()#{}'!?,]*$/;
// 繁中用全形標點；D2R 的簡中、日文用半形冒號（「掉宝率: +%d%%」），不檢查
const FULLWIDTH = lang.id === 'zh-TW';

const problems = [];
const keys = new Set(batch.map(x => x.key));
for (const { key, ko } of batch) {
  const zh = out[key];
  if (typeof zh !== 'string' || !zh.trim()) { problems.push(`缺少：${key}`); continue; }
  if (placeholders(zh) !== expected(key, ko)) problems.push(`佔位符不同：${key} → ${zh}（應該是 ${expected(key, ko) || '無'}，譯文 ${placeholders(zh) || '無'}）`);
  if (!lang.script.test(zh) && !LATIN_OK.test(zh)) problems.push(`沒有${lang.name}：${key} → ${zh}`);
  if (!lang.script.test(zh) && LATIN_OK.test(zh) && zh !== key) problems.push(`沒有${lang.name}（確認是否本來就不用譯）：${key} → ${zh}`);
  if (FULLWIDTH && (/[一-鿿][:,][^\s\d]/.test(zh) || /[一-鿿][,;]/.test(zh))) problems.push(`用了半形標點：${key} → ${zh}`);
  if (lang.id === 'zh-CN' && /[個與為們這說時點會於從還對實際應開關選擇]/.test(zh)) problems.push(`有繁體字：${key} → ${zh}`);
}
for (const key of Object.keys(out)) if (!keys.has(key)) problems.push(`多出來的 key（不在這批裡）：${key}`);
console.log(problems.length ? problems.join('\n') : 'OK');
console.log(`${batch.length} 條，問題 ${problems.length} 個`);
process.exitCode = problems.length ? 1 : 0;
