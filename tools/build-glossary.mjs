// 用 D2R 官方字串（enUS／koKR／目標語言）自動配對遊戲字典的英文 key，產生目標語言的譯文
//   node tools/build-glossary.mjs <ko.json> <D2R 字串資料夾> <輸出 .json> [報告 .json] [--lang zh-TW|zh-CN|ja]
// 語言設定在 tools/langs.mjs，預設繁中。下面的變數名稱 zh 指的是目標語言的譯文
// 有詞性的語言（德文）另外輸出：affix:<詞綴> 保留 D2R 每種詞性的形式「[fs]robuste[ms]robuster…」、
// gender:<物品> 是物品名稱的詞性（fs／ms／ns／pl），給魔法物品名稱組合時挑形容詞的形式用
// 配對順序：
//   1. 英文相同（去掉 item:／affix: 這類前綴，比較方式跟遊戲一樣：空白合併、不分大小寫）
//   2. 韓文相同（遊戲的韓文多半直接取自 D2R 的 koKR）
//   3. 數值樣板：D2R 的 %d／%+d／%s 轉成遊戲的 * 或 #，譯文轉成 {0}、{1}…
// 多個候選時，用韓文譯文挑；挑不出來就取出現最多次的
import fs from 'node:fs';
import path from 'node:path';
import { takeLang, cleanD2R, genderForms, nounGender } from './langs.mjs';

const { lang, args } = takeLang(process.argv.slice(2));
const [koFile, d2rDir, outFile, reportFile] = args;
if (!koFile || !d2rDir || !outFile) { console.error('用法：node tools/build-glossary.mjs <ko.json> <D2R 字串資料夾> <輸出 .json> [報告 .json]'); process.exit(1); }

const PREFIX = /^(item|affix|monster|unique|title):/;
const norm = s => s.replace(/\s+/g, ' ').trim().toUpperCase();
// D2R 字串裡的顏色碼（ÿc4）、性別／單複數標記（[ms]、[fs]、[pl]…）
const clean = cleanD2R;   // 多種詞性的形式取陽性單數，見 langs.mjs
const TOKEN = /%(\+?)(?:d|i|s|\d)/g;

// D2R 的一條字串 → 可比對的英文／韓文形式，以及目標語言的譯文；樣板會轉成遊戲的格式
function forms(row) {
  const en = clean(row.enUS ?? ''), ko = clean(row.koKR ?? ''), zh = clean(row[lang.col] ?? '');
  if (!en || !zh || !lang.isText(zh) || lang.skip?.(zh)) return [];
  const raw = (row[lang.col] ?? '').replace(/ÿc./g, '').trim();
  if (!TOKEN.test(en)) return [{ en, ko, zh, raw }];
  TOKEN.lastIndex = 0;
  const count = (en.match(TOKEN) ?? []).length;
  if ((zh.match(TOKEN) ?? []).length !== count) return [];
  let i = 0, k = 0;
  const zhT = zh.replace(TOKEN, (_, plus) => `${plus}{${i++}}`).replace(/%%/g, '%');
  const koT = ko.replace(TOKEN, (_, plus) => `${plus}{${k++}}`).replace(/%%/g, '%');
  const enStar = en.replace(TOKEN, (_, plus) => `${plus}*`).replace(/%%/g, '%');
  const enHash = en.replace(TOKEN, (_, plus) => `${plus}#`).replace(/%%/g, '%');
  return [{ en: enStar, ko: koT, zh: zhT }, { en: enHash, ko: koT, zh: zhT }];
}

const byEn = new Map(), byKo = new Map();
const add = (map, key, entry) => { if (!key) return; const k = norm(key); (map.get(k) ?? map.set(k, []).get(k)).push(entry); };
let rows = 0;
const genderOf = new Map(), affixForms = new Map();   // 英文（正規化）→ 物品名稱的詞性／詞綴每種詞性的形式
const pluralGuess = new Set(), affixGender = new Map();
for (const file of fs.readdirSync(d2rDir).filter(n => n.endsWith('.json'))) {
  for (const row of JSON.parse(fs.readFileSync(path.join(d2rDir, file), 'utf8'))) {
    rows++;
    if (lang.gendered && row.enUS && row[lang.col]) {
      const en = norm(clean(row.enUS)), g = nounGender(row[lang.col]);
      if (file === 'item-names.json' && g && !genderOf.has(en)) genderOf.set(en, g);
      // D2R 有些物品沒標詞性（法文「Gants」、俄文「Перчатки」）：英文是 -s 結尾的複數就當複數
      if (file === 'item-names.json' && !g && !genderForms(row[lang.col]) && /[^s]s$/.test(clean(row.enUS))) pluralGuess.add(en);
      // 獨特怪物名字的後段（Heart、Maw）：詞性標在詞綴檔的 heartUM、maw，給前段的形容詞照著挑
      if (file === 'item-nameaffixes.json' && g && !affixGender.has(en)) affixGender.set(en, g);
      if (file === 'item-nameaffixes.json' && genderForms(row[lang.col]) && !affixForms.has(en)) affixForms.set(en, row[lang.col].replace(/ÿc./g, '').trim());
    }
    for (const f of forms(row)) { const entry = { ...f, file, id: row.Key }; add(byEn, f.en, entry); add(byKo, f.ko, entry); }
  }
}

// key 的前綴對應 D2R 的哪個字串檔，有多個候選時優先用那個檔的
const PREFIX_FILES = { item: ['item-names.json'], unique: ['item-names.json', 'item-runes.json'], affix: ['item-nameaffixes.json'], monster: ['monsters.json'], title: ['ui.json'] };
const placeholders = s => (s.match(/\{\d+\}/g) ?? []).sort().join();
function pick(cands, ko, prefix) {
  const zhs = new Map();
  for (const c of cands) zhs.set(c.zh, (zhs.get(c.zh) ?? 0) + 1);
  if (zhs.size === 1) return { zh: cands[0].zh, ambiguous: false };
  const sameKo = cands.filter(c => c.ko && norm(c.ko) === norm(ko));
  if (sameKo.length && new Set(sameKo.map(c => c.zh)).size === 1) return { zh: sameKo[0].zh, ambiguous: false };
  const inFile = cands.filter(c => PREFIX_FILES[prefix]?.includes(c.file));
  if (inFile.length && new Set(inFile.map(c => c.zh)).size === 1) return { zh: inFile[0].zh, ambiguous: false };
  return { zh: [...zhs].sort((a, b) => b[1] - a[1])[0][0], ambiguous: true };
}

// 稀有物品名稱「前段 後段」：D2R 分開存，前段的 key 是大寫開頭（Doom），後段是小寫（blow）。
// 前段最準的是 item-nameaffixes 裡 key 就等於那個字的（Shadow／ShadowUM → 暗影）；
// 同一個英文字也可能是介面字串（UiShadowUI → 暗影分身），所以有這種的就只用它
// 兩段的 koKR 接起來跟遊戲的韓文一樣 → checked；
// 韓文不同（遊戲自己翻的）但前段有大寫 key、後段有同名小寫 key 的 D2R 字串 → structural（之後要抽查）
const removeSpaces = s => s.replace(/\s+/g, '');
// 前段有每種詞性的形式時（德文、法文），照後段的詞性挑；兩段怎麼接看 langs.mjs 的 rareJoin
const frontFor = (a, b, front) => { const f = genderForms(a.raw ?? ''), g = nounGender(b.raw ?? ''); return (f && g && f[g]) || front; };
const joinRare = (a, b, front = a.zh) => lang.rareJoin(lang.gendered ? frontFor(a, b, front) : front, b.zh);
function rareName(key, koValue) {
  const words = key.split(' ');
  if (words.length !== 2) return null;
  const [first, second] = words.map(w => (byEn.get(norm(w)) ?? []).filter(c => !/[{]/.test(c.zh)));
  // 「Blood」是稀有物品名稱的前段，「BloodUM」是獨特怪物名稱的前段：中文同名，日文不同（血濡れた／ブラッド），先用前者
  const affixKey = id => first.filter(c => c.file === 'item-nameaffixes.json' && c.id === id);
  const exactFront = affixKey(words[0]).length ? affixKey(words[0]) : affixKey(`${words[0]}UM`);
  const front = exactFront.length ? exactFront : first.filter(c => /^[A-Z]/.test(c.id));
  const back = second.filter(c => c.id === words[1].toLowerCase());
  // 韓文比對用所有同名字串（詞綴的 koKR 常多一個「의」，符文之語的才對得上），中文前段還是用詞綴的
  const preferred = new Set(exactFront.map(c => c.zh)).size === 1 ? exactFront[0].zh : null;
  for (const a of exactFront.length ? first : front.length ? front : first) for (const b of back.length ? back : second) {
    if (a.ko && b.ko && removeSpaces(a.ko + b.ko) === removeSpaces(koValue)) return { zh: joinRare(a, b, preferred ?? a.zh), method: 'rareName' };
  }
  // 前段常跟符文之語同名（Death → 死亡／死神），稀有名稱不會用符文之語的；再有多個就優先用詞綴檔的
  const notRuneword = front.filter(c => c.file !== 'item-runes.json');
  const affixes = notRuneword.filter(c => c.file === 'item-nameaffixes.json');
  const fronts = new Set(notRuneword.map(c => c.zh)).size > 1 && affixes.length ? affixes : notRuneword;
  const frontZh = new Set(fronts.map(c => c.zh));
  const backZh = new Set(back.map(c => c.zh));
  if (frontZh.size === 1 && backZh.size === 1) return { zh: joinRare(fronts[0], back[0]), method: 'rareNameStructural' };
  return null;
}

const ko = JSON.parse(fs.readFileSync(koFile, 'utf8'));
const out = {}, report = { byMethod: {}, ambiguous: [], placeholderMismatch: [], unmatched: {} };
const category = key => PREFIX.exec(key)?.[1] ?? (key.length > 80 ? 'long' : /[*#]/.test(key) ? 'template' : 'short');
for (const [key, koValue] of Object.entries(ko)) {
  const prefix = PREFIX.exec(key)?.[1];
  const core = key.replace(PREFIX, '');
  let method = null, cands = byEn.get(norm(core));
  if (cands) method = /[*#]/.test(core) ? 'template' : 'english';
  else if ((cands = byKo.get(norm(koValue))) && koValue.trim().length >= 2) method = 'korean';
  if (!method) {
    const rare = rareName(core, koValue);
    if (rare) {
      out[key] = rare.zh;
      report.byMethod[rare.method] = (report.byMethod[rare.method] ?? 0) + 1;
      if (rare.method === 'rareNameStructural') (report.structural ??= []).push({ key, ko: koValue, zh: rare.zh });
      continue;
    }
    (report.unmatched[category(key)] ??= []).push(key);
    continue;
  }
  const { zh, ambiguous } = pick(cands, koValue, prefix);
  if (placeholders(zh) !== placeholders(koValue)) { report.placeholderMismatch.push({ key, ko: koValue, zh }); (report.unmatched[category(key)] ??= []).push(key); continue; }
  // 沒有前綴的單字（Chain、Orb）是一般名詞：遊戲整句查不到時會逐字翻，用稀有名稱的前後段形式（之鏈、獣の）會變成「之鏈 閃電」
  if (!prefix && !/\s/.test(core) && lang.affixForm(zh)) {
    (report.suffixForm ??= []).push({ key, ko: koValue, zh });
    (report.unmatched[category(key)] ??= []).push(key);
    continue;
  }
  if (ambiguous) report.ambiguous.push({ key, chosen: zh, options: [...new Set(cands.map(c => c.zh))] });
  out[key] = zh;
  report.byMethod[method] = (report.byMethod[method] ?? 0) + 1;
}

// D2R 的名稱是小寫開頭的語言（俄文）：英文 key 大寫開頭的，譯文第一個字母也改大寫（詞綴留給組合時處理）
if (lang.capitalize) {
  for (const [key, zh] of Object.entries(out)) {
    if (!key.startsWith('affix:') && /^[A-Z]/.test(key.replace(PREFIX, '')) && /^\p{Ll}/u.test(zh)) out[key] = zh[0].toUpperCase() + zh.slice(1);
  }
}

// 有詞性的語言：魔法物品名稱的詞綴保留每種詞性的形式，物品名稱附上詞性
if (lang.gendered) {
  let forms = 0, genders = 0;
  for (const key of Object.keys(out)) {
    const core = key.replace(PREFIX, '');
    // affix:（魔法物品的詞綴）和 unique:（獨特怪物名字的前段，Storm → Штормовой／Штормовое…）都在執行時跟名詞組合
    if (/^(affix|unique):/.test(key) && affixForms.has(norm(core))) { out[key] = affixForms.get(norm(core)); forms++; }
  }
  for (const key of Object.keys(ko)) {
    const core = key.replace(PREFIX, '');
    if (out[`gender:${core}`]) continue;
    const plural = lang.id === 'fr' ? 'mp' : 'pl';
    const g = (!PREFIX.test(key) || key.startsWith('item:')) ? genderOf.get(norm(core)) ?? (pluralGuess.has(norm(core)) ? plural : null)
      : key.startsWith('unique:') ? affixGender.get(norm(core)) : null;
    if (g) { out[`gender:${core}`] = g; genders++; }
  }
  report.gendered = { affixForms: forms, itemGenders: genders };
  console.log(`詞性：詞綴 ${forms} 個保留每種詞性的形式；物品名稱 ${genders} 個附上詞性（gender:<物品>）`);
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
if (reportFile) fs.writeFileSync(reportFile, JSON.stringify(report, null, 1));
const total = Object.keys(ko).length, matched = Object.keys(out).filter(k => !k.startsWith('gender:')).length;
console.log(`D2R 字串 ${rows} 條；遊戲 key ${total} 條，配對到 ${matched} 條（${(matched / total * 100).toFixed(1)}%）`);
console.log('配對方式：', report.byMethod);
console.log(`有多個候選、取最常見的：${report.ambiguous.length} 條；佔位符對不上而放棄：${report.placeholderMismatch.length} 條`);
console.log('未配對（依類型）：', Object.fromEntries(Object.entries(report.unmatched).map(([k, v]) => [k, v.length])));
