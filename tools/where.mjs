// 反查一個詞：對應哪些 key、最後的譯文是哪個字典檔決定的、各層原本怎麼譯、在遊戲裡當什麼用
//   node tools/where.mjs <譯文或英文> [--exact] [--lang zh-TW|zh-CN|ja]
// 預設是部分比對（key 或譯文含有這段文字），--exact 只找完全相同的
// 字典的層次跟合併時一樣（tools/langs.mjs 的 layers），後面的蓋過前面的
import fs from 'node:fs';
import { takeLang, layers } from './langs.mjs';

const { lang, args } = takeLang(process.argv.slice(2));
const exact = args.includes('--exact');
const query = args.filter(a => a !== '--exact').join(' ');
if (!query) { console.error('用法：node tools/where.mjs <譯文或英文> [--exact] [--lang zh-TW|zh-CN|ja]'); process.exit(1); }

const read = f => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
const LAYERS = layers(lang).map(file => ({ file, dict: read(file) }));
// 最新的遊戲版本（versions/ 底下的資料夾名稱就是版本號）
const latest = fs.readdirSync('versions').filter(d => /^\d{4}\.\d+\.\d+$/.test(d)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).at(-1);
const ko = read(`versions/${latest}/ko.json`);
const final = read(lang.out);
const usage = read('work/usage.json');

const match = s => s && (exact ? s === query : s.toLowerCase().includes(query.toLowerCase()));
const keys = Object.keys(final).filter(k => match(k) || match(final[k]));
if (!keys.length) { console.log('找不到'); process.exit(0); }
for (const key of keys.slice(0, 30)) {
  const layers = LAYERS.filter(l => key in l.dict);
  console.log(`\n${key}\n  譯文：${final[key]}（${layers.at(-1)?.file ?? '?'}）`);
  if (ko[key]) console.log(`  韓文：${ko[key]}`);
  if (layers.length > 1) console.log(`  各層：${layers.map(l => `${l.file.replace('dict/', '')}=${l.dict[key]}`).join('｜')}`);
  if (key.startsWith('modifier:')) console.log('  （技能變體專用譯名，見 docs/term-decisions.md）');
  const u = usage[key];
  if (u) {
    console.log(`  用途：${Object.entries(u.kinds).map(([k, n]) => `${k}×${n}`).join('、')}`);
    for (const r of u.refs.slice(0, 3)) console.log(`    ${r.file} ${r.path || ''}${r.siblings ? ` {${r.siblings}}` : ''}${r.call ? ` 呼叫 ${r.call}()` : ''}`);
  } else if (!key.includes(':')) console.log('  用途：程式碼和資料裡找不到（多半是執行時組出來的，例如稀有物品名稱）');
}
if (keys.length > 30) console.log(`\n……還有 ${keys.length - 30} 條，用更精確的字查，或加 --exact`);
