// 把還沒配對到的 key 分批，附上韓文和用語提示，給翻譯用
//   node tools/make-todo.mjs <ko.json> <D2R 字串資料夾> <d2r-auto.json> <glossary-report.json> <輸出資料夾> <類型,類型…> [每批字數]
//     [--lang zh-TW|zh-CN|ja] [--extra <key 清單 .json>] [--ref <參考譯文 .json>]
// 類型是報告裡未配對的分類：template、short、long、title、monster
// --extra：另外要翻的 key（例如繁中修正過、D2R 同名字串意思不對的，見 corrected-keys.mjs）
// --ref：每條附上這份字典的譯文當參考（翻其他語言時附繁中，幫忙理解遊戲裡的實際意思）
// 提示來源：
//   1. 句子裡 1～4 個字的片語，在 d2r-auto.json 或 D2R 字串裡有完全相同的英文（「Magic Find: +%d%%」也算「Magic Find」）
//   2. 句子裡的單字在已配對的稀有名稱中怎麼組合（Beast → 野獸之禦）
import fs from 'node:fs';
import path from 'node:path';
import { takeLang } from './langs.mjs';

const { lang, args: rest } = takeLang(process.argv.slice(2));
const option = name => { const i = rest.indexOf(name); if (i < 0) return null; const v = rest[i + 1]; rest.splice(i, 2); return v; };
const extraFile = option('--extra'), refFile = option('--ref');
const [koFile, d2rDir, autoFile, reportFile, outDir, kinds, perBatchArg] = rest;
if (!kinds) { console.error('用法：node tools/make-todo.mjs <ko.json> <D2R 字串資料夾> <d2r-auto.json> <glossary-report.json> <輸出資料夾> <類型,類型…> [每批字數]'); process.exit(1); }
const perBatch = Number(perBatchArg) || 12000;

const norm = s => s.replace(/\s+/g, ' ').trim().toUpperCase();
const clean = s => s.replace(/ÿc./g, '').replace(/\[[a-z]{2}\]/g, '').trim();
const PREFIX = /^(item|affix|monster|unique|title):/;

const terms = new Map();   // 英文（正規化）→ 目標語言
const addTerm = (en, zh) => { en = en.trim(); zh = zh.trim(); if (en && zh && lang.script.test(zh) && !lang.skip?.(zh) && !terms.has(norm(en))) terms.set(norm(en), { en, zh }); };
const auto = JSON.parse(fs.readFileSync(autoFile, 'utf8'));
for (const [key, zh] of Object.entries(auto)) if (!/[*#{]/.test(key)) addTerm(key.replace(PREFIX, ''), zh);
for (const file of fs.readdirSync(d2rDir).filter(n => n.endsWith('.json'))) {
  for (const row of JSON.parse(fs.readFileSync(path.join(d2rDir, file), 'utf8'))) {
    const en = clean(row.enUS ?? ''), zh = clean(row[lang.col] ?? '');
    if (!en || !zh || en.length > 60) continue;
    if (!/%/.test(en)) addTerm(en, zh);
    const label = /^([^%:]+):\s*[+-]?%/.exec(en), zhLabel = /^([^%:：]+)[:：]/.exec(zh);
    if (label && zhLabel) addTerm(label[1], zhLabel[1]);
    // 「+%d%% Faster Cast Rate」→「施法速度 +%d%%」：拿掉數值記號後兩邊都只剩用語
    const strip = s => s.replace(/[+-]?%\+?[dis0-9]%{0,2}/g, ' ').replace(/[+%]/g, ' ').replace(/\s+/g, ' ').trim();
    if (/%/.test(en) && !label) {
      const enCore = strip(en), zhCore = strip(zh);
      if (/^[A-Za-z][A-Za-z' -]+$/.test(enCore) && !/[A-Za-z0-9]/.test(zhCore)) addTerm(enCore, zhCore);
    }
  }
}

// 稀有名稱「前段 後段」的組合例子，依單字索引
const rareByWord = new Map();
for (const [key, zh] of Object.entries(auto)) {
  if (!/^[A-Z][a-z']+ [A-Z][a-z']+$/.test(key)) continue;
  for (const w of key.split(' ')) (rareByWord.get(w) ?? rareByWord.set(w, []).get(w)).push([key, zh]);
}

// 常見虛詞單獨出現時不當提示（「and → 和」沒有幫助，還會誤導）
const STOP = new Set('a an and or the of to in on at by for from with as is are be it its it\'s this that these those your you yours his her their them they he she we our no not now so but if then than more less all any each every one two who what which when where how up out off over into onto under again also only just still too very can will would could should may might has have had do does did was were been being place pick'.split(' '));

function hints(key) {
  const max = key.length > 80 ? 16 : 10;
  const words = key.replace(PREFIX, '').replace(/[*#]/g, ' ').replace(/'s\b/g, '').split(/[^A-Za-z'-]+/).filter(Boolean);
  const found = [];
  for (let n = Math.min(4, words.length); n >= 1; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const phrase = words.slice(i, i + n).join(' ');
      if (n === 1 && STOP.has(phrase.toLowerCase())) continue;
      const t = terms.get(norm(phrase));
      if (t && norm(t.en) !== norm(key) && !found.some(([en]) => norm(en).includes(norm(phrase)))) found.push([t.en, t.zh]);
    }
  }
  const out = found.slice(0, max);
  for (const w of new Set(words)) {
    if (!/^[A-Z]/.test(w) || STOP.has(w.toLowerCase())) continue;
    const ex = rareByWord.get(w);
    if (ex && out.length < max + 3) out.push(ex[0]);
  }
  return out;
}

const ko = JSON.parse(fs.readFileSync(koFile, 'utf8'));
const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
const extra = extraFile ? JSON.parse(fs.readFileSync(extraFile, 'utf8')) : [];
const keys = [...new Set([...kinds.split(',').flatMap(k => report.unmatched[k] ?? []), ...extra])];
const ref = refFile ? JSON.parse(fs.readFileSync(refFile, 'utf8')) : null;
fs.mkdirSync(outDir, { recursive: true });
let batch = [], size = 0, n = 0;
const flush = () => { if (!batch.length) return; fs.writeFileSync(path.join(outDir, `batch-${String(++n).padStart(2, '0')}.json`), JSON.stringify(batch, null, 1)); batch = []; size = 0; };
for (const key of keys) {
  batch.push({ key, ko: ko[key] ?? null, ...(ref?.[key] && { ref: ref[key] }), hints: hints(key) });
  size += key.length;
  // 字數到了就分批；短字串（稀有名稱）很多時，條數也不要超過 500
  if (size >= perBatch || batch.length >= 500) flush();
}
flush();
console.log(`${keys.length} 條、${n} 批 → ${outDir}（用語 ${terms.size} 條）`);
