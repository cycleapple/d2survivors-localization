// 用 usage-index.mjs 的用途索引分析用語
//   node tools/term-analysis.mjs <usage.json> <zh-TW.json> <輸出 .json>
// 1. 一個 key 多種用途：同一個英文同時是技能、技能變體、被動…（遊戲只有一個 key，譯名只能選一個）
// 2. 名稱一致：句子裡提到某個名稱（技能、變體、區域、按鈕…）時，譯文有沒有用它自己的譯名
// 3. 大小寫撞名：遊戲的翻譯器不分大小寫（RUMBLE 和 Rumble 是同一個 key），譯文不一樣時只有最後一個會生效
import fs from 'node:fs';

const [usageFile, zhFile, outFile] = process.argv.slice(2);
if (!outFile) { console.error('用法：node tools/term-analysis.mjs <usage.json> <zh-TW.json> <輸出 .json>'); process.exit(1); }
const usage = JSON.parse(fs.readFileSync(usageFile, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhFile, 'utf8'));
// 審過、確定沒問題的「句子裡沒用名稱本身的譯名」（Blizzard 是公司不是法術、Return to Deckard Cain 不是技能變體…）：
// dict/<語言>/term-exceptions.json（繁中是 dict/manual/term-exceptions.json），{ "名稱 key": ["句子 key", …] }
const exceptionsFile = zhFile.replace(/dict\/(zh-TW)\.json$/, 'dict/manual/term-exceptions.json').replace(/dict\/([\w-]+)\.json$/, 'dict/$1/term-exceptions.json');
const exceptions = fs.existsSync(exceptionsFile) ? JSON.parse(fs.readFileSync(exceptionsFile, 'utf8')) : {};

// 「名稱」類的用途（會在句子裡被提到的東西）
const NAME_KINDS = ['技能', '技能變體', '被動', '恰西強化', '區域', '章節名稱', 'D2 資料（monster-catalog）', '按鈕或標題（全大寫）'];
const kindsOf = key => Object.keys(usage[key]?.kinds ?? {});
const nameKinds = key => kindsOf(key).filter(k => NAME_KINDS.includes(k));

// 1. 多種用途：只算分屬不同領域的（區域名稱也出現在怪物資料裡、被動和恰西強化同名，是同一個意思）
const DOMAIN = { '技能': '技能', '技能變體': '技能變體', '被動': '屬性', '恰西強化': '屬性', '按鈕或標題（全大寫）': '介面', 'D2 資料（monster-catalog）': '怪物', '區域': '地點', '章節名稱': '地點' };
const domains = key => {
  const d = new Set(nameKinds(key).map(k => DOMAIN[k]));
  if (d.has('地點')) d.delete('怪物');
  return [...d];
};
const multi = Object.keys(usage).map(key => ({ key, zh: zh[key], kinds: nameKinds(key), domains: domains(key) })).filter(x => x.domains.length >= 2);

// 2. 名稱一致
// 句子裡會被提到的名稱：技能、變體、被動、恰西強化、區域、章節；按鈕只算全大寫的（句子裡寫成 SHOW DAMAGE 才是在講按鈕）；
// 怪物資料裡的單字（fire、Diablo）太常是一般用法，不算
const TERM_KINDS = ['技能', '技能變體', '被動', '恰西強化', '區域', '章節名稱', '按鈕或標題（全大寫）'];
const terms = Object.keys(usage)
  .filter(key => kindsOf(key).some(k => TERM_KINDS.includes(k)) && zh[key] && !/[*#{]/.test(key) && key.length >= 4 && /[一-鿿]/.test(zh[key]))
  .filter(key => !kindsOf(key).every(k => k === '按鈕或標題（全大寫）' || !TERM_KINDS.includes(k)) || key === key.toUpperCase())
  .map(key => ({ key, zh: zh[key], kinds: nameKinds(key) }));
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// 大小寫要一樣；前後接著首字大寫的字，是更長的專有名詞的一部分（Charged Bolt Sentry、Iron Ward），不算，
// 但前一個字是所有格（Conviction's Lingering）要算，這是改版說明提到技能變體最常見的寫法；
// 遊戲名稱、公司名（Diablo II、Blizzard Entertainment）也不算
for (const t of terms) t.re = new RegExp(`(^|[^A-Za-z'])(?<![A-Z][a-z]+ )${escape(t.key)}('s)?(?! [A-Z][a-z]| II\\b| Entertainment)([^A-Za-z]|$)`);
const sentences = Object.entries(zh).filter(([key]) => key.length > 25 && /\s/.test(key));

const misses = new Map();
for (const [key, value] of sentences) {
  const hit = terms.filter(t => t.key !== key && t.re.test(key));
  // 較長的名稱包含較短的（Frost Nova 包含 Nova）就只看長的
  const longest = hit.filter(t => !hit.some(o => o !== t && o.key.length > t.key.length && o.key.includes(t.key)));
  for (const t of longest) {
    if (value.includes(t.zh)) continue;
    if (exceptions[t.key]?.includes(key)) continue;
    (misses.get(t.key) ?? misses.set(t.key, { term: t.key, zh: t.zh, kinds: t.kinds, sentences: [] }).get(t.key)).sentences.push({ key, zh: value });
  }
}
const inconsistent = [...misses.values()].sort((a, b) => b.sentences.length - a.sentences.length);

// 3. 大小寫撞名（字典的順序就是遊戲處理的順序，後面的蓋過前面的）
const groups = new Map();
for (const [key, value] of Object.entries(zh)) {
  const n = key.replace(/\s+/g, ' ').trim().toUpperCase();
  (groups.get(n) ?? groups.set(n, []).get(n)).push({ key, zh: value, kinds: kindsOf(key) });
}
const caseClash = [...groups.values()].filter(g => g.length > 1 && new Set(g.map(x => x.zh)).size > 1).map(g => ({ entries: g, wins: g.at(-1).zh }));

fs.writeFileSync(outFile, JSON.stringify({ multi, caseClash, inconsistent: inconsistent.map(x => ({ ...x, count: x.sentences.length, sentences: x.sentences.slice(0, 8) })) }, null, 1));
console.log(`一個 key 多種用途：${multi.length} 條`);
console.log(`大小寫撞名、譯文不同：${caseClash.length} 組${caseClash.length ? '（' + caseClash.map(c => c.entries.map(e => e.key).join('/')).join('、') + '）' : ''}`);
console.log(`名稱 ${terms.length} 個；句子 ${sentences.length} 條；有 ${inconsistent.length} 個名稱在句子裡沒用到自己的譯名（共 ${inconsistent.reduce((n, x) => n + x.sentences.length, 0)} 處）`);
