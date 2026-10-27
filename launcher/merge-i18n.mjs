// 把翻譯聊天室的 dict/launcher-i18n.json（ja／de／fr／ru／pl）併進 launcher/src/i18n.rs 的 TABLE
//   node launcher/merge-i18n.mjs [--write]（在 repo 根目錄執行）
// TABLE 目前每行是 ("key", "繁中", "簡中", "英文") 或已經是 ("key", ["繁中", …8 欄])；輸出成 8 欄
import fs from 'node:fs';

const file = 'launcher/src/i18n.rs';
const src = fs.readFileSync(file, 'utf8');
const tr = JSON.parse(fs.readFileSync('dict/launcher-i18n.json', 'utf8'));
const LANGS = ['zh-TW', 'zh-CN', 'en', 'ja', 'de', 'fr', 'ru', 'pl'];

const start = src.indexOf('const TABLE');
const open = src.indexOf('= &[', start) + 4;
const close = src.indexOf('\n];', open);
const body = src.slice(open, close);
const rows = [];
for (const line of body.split('\n')) {
  const t = line.trim();
  if (!t.startsWith('("')) continue;
  // ("k", "a", "b", "c"), 或 ("k", ["a", …]),：當成 JSON 陣列讀
  const arr = JSON.parse('[' + t.replace(/^\(/, '').replace(/\),$/, '').replace(/\[|\]/g, '') + ']');
  rows.push({ key: arr[0], vals: arr.slice(1) });
}
const keys = rows.map(r => r.key);
const missing = keys.filter(k => !tr[k]);
const extra = Object.keys(tr).filter(k => !keys.includes(k));
console.log(`TABLE ${keys.length} 個 key，翻譯檔 ${Object.keys(tr).length} 個`);
console.log(`翻譯檔沒有（先用英文）：${missing.join('、') || '無'}`);
console.log(`翻譯檔多出來（TABLE 已經沒有）：${extra.join('、') || '無'}`);

const count = s => (s.match(/\{\}/g) ?? []).length;
const problems = [];
const out = rows.map(({ key, vals }) => {
  const [tw, cn, en] = vals;
  const more = ['ja', 'de', 'fr', 'ru', 'pl'].map(l => {
    const v = vals[LANGS.indexOf(l)] ?? tr[key]?.[l] ?? en;
    if (count(v) !== count(en)) problems.push(`${key}／${l}：{} 數量不一樣`);
    return v;
  });
  // 翻譯檔有的話以翻譯檔為準（重新跑時會更新）
  const more2 = ['ja', 'de', 'fr', 'ru', 'pl'].map((l, i) => tr[key]?.[l] ?? more[i]);
  return `    (${JSON.stringify(key)}, [${[tw, cn, en, ...more2].map(v => JSON.stringify(v)).join(', ')}]),`;
});
if (problems.length) console.log(problems.join('\n'));
if (process.argv.includes('--write')) {
  fs.writeFileSync(file, src.slice(0, open) + '\n' + out.join('\n') + src.slice(close));
  console.log(`已寫入 ${file}`);
}
