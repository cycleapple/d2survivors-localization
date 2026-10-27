// 在 D2R 字串裡查英文片語的官方譯法（整個字的比對，不分大小寫）
//   node tools/lookup.mjs <D2R 字串資料夾> <片語> [片語…] [--lang zh-TW|zh-CN|ja]
import fs from 'node:fs';
import path from 'node:path';
import { takeLang } from './langs.mjs';

const { lang, args } = takeLang(process.argv.slice(2));
const [dir, ...phrases] = args;
const rows = fs.readdirSync(dir).filter(n => n.endsWith('.json')).flatMap(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const escape = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
for (const phrase of phrases) {
  const re = new RegExp(`(^|[^A-Za-z])${escape(phrase)}([^A-Za-z]|$)`, 'i');
  const hits = rows.filter(r => r.enUS && r[lang.col] && r.enUS.length < 60 && re.test(r.enUS) && !lang.skip?.(r[lang.col]))
    .sort((a, b) => a.enUS.length - b.enUS.length).slice(0, 3);
  console.log(`${phrase} :: ${hits.map(r => `${JSON.stringify(r.enUS)} = ${JSON.stringify(r[lang.col])}`).join(' ; ')}`);
}
