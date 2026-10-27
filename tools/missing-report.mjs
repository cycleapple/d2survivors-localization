// 整理遊戲翻譯器記下的「查不到的字串」（missing），去掉不需要翻的，跟字典比對
//   node tools/missing-report.mjs <missing.json> <ko.json> <zh-TW.json> <輸出 .json>
// 去掉：已經是中文的（翻譯器會把翻好的再查一次）、1～2 個字元（標誌字母、手把按鍵）、
//       長句被斷行切開的片段（是另一條 missing 的一部分）、沒有英文字母的
import fs from 'node:fs';

const [missingFile, koFile, zhFile, outFile] = process.argv.slice(2);
const missing = [...new Set(JSON.parse(fs.readFileSync(missingFile, 'utf8')))];
const ko = JSON.parse(fs.readFileSync(koFile, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhFile, 'utf8'));
const norm = s => s.replace(/\s+/g, ' ').trim().toUpperCase();
const koKeys = new Set(Object.keys(ko).map(norm)), zhKeys = new Set(Object.keys(zh).map(norm));

const real = missing.filter(s => !/[　-鿿＀-￯]/.test(s) && s.trim().length > 2 && /[A-Za-z]{2}/.test(s));
const fragment = s => real.some(o => o !== s && o.length > s.length && norm(o).includes(norm(s)));
const lines = real.filter(s => !fragment(s));
const out = lines.map(s => ({ text: s, inKo: koKeys.has(norm(s)), inZh: zhKeys.has(norm(s)) }));
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log(`missing ${missing.length} 條 → 要看的 ${lines.length} 條（去掉中文、短字、斷行片段）`);
console.log(`  韓文字典也沒有：${out.filter(x => !x.inKo).length}；韓文有但繁中沒有：${out.filter(x => x.inKo && !x.inZh).length}；字典有卻還是查不到：${out.filter(x => x.inZh).length}`);
