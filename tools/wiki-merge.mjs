// wiki 譯文：自動配對遊戲字典 + 人工譯文 → dict/wiki/zh-TW.json（tools/build-wiki.mjs 讀這份）
//   node tools/wiki-merge.mjs
// 1. dict/wiki/auto.json（工具產生，不要手改）：wiki 字串跟遊戲的 key 一樣（不分大小寫）、遊戲字典 dict/zh-TW.json 有譯文的，直接用遊戲的譯名。
//    單字只配遊戲裡當名稱用的（work/usage.json）；「A · B」每段都有譯文的組起來
//    每次重新產生，遊戲改了譯名這裡也跟著改。有佔位符的不配（wiki 的 <0> 跟遊戲的 {0} 不是同一回事）
//    技能變體名稱（ul.wiki-mods 裡的）另外配 modifier:名稱（遊戲的專用譯名，跟別的技能同名的那幾個），build-wiki 用 lookup() 先查它
// 2. dict/wiki/manual/*.json（人寫的，{ key: 譯文 }）：蓋過自動配對
// 3. 輸出只放現在官方頁面上有的 key（data/wiki/src/，wiki-fetch 抓的），格式 { strings: { key: 譯文 } }，key 照字母排
import fs from 'node:fs';
import path from 'node:path';
import { enSpans, pageStrings } from './wiki-strings.mjs';

const SRC = 'data/wiki/src', DIR = 'dict/wiki', OUT = `${DIR}/zh-TW.json`;
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJson = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 1) + '\n');
const sortKeys = o => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b, 'en')));

const { pages } = readJson(`${SRC}/pages.json`);
const htmls = pages.map(p => fs.readFileSync(path.join(SRC, p.path, 'index.html'), 'utf8'));
const keys = new Set(htmls.flatMap(h => pageStrings(h).map(s => s.key)));
// 技能變體名稱（ul.wiki-mods 裡的）也可以有 modifier:名稱 的專用譯名
const modKeys = new Set(htmls.flatMap(h => enSpans(h).filter(s => s.context === 'modifier').map(s => `modifier:${s.key}`)));

// 遊戲字典：不分大小寫（遊戲本身也是這樣查），# * 佔位符的 key 不配
const readGame = readJson('dict/zh-TW.json');
const game = new Map();
for (const [k, v] of Object.entries(readGame)) {
  if (k.startsWith('gender:') || /[#*]/.test(k) || /\{\d+\}/.test(v)) continue;
  const low = k.toLowerCase();
  if (!game.has(low) || k === k.trim()) game.set(low, v);
}
// 單字的 key 只配遊戲裡當名稱用的（技能、變體、怪物、NPC、區域…，看 work/usage.json 的用途）。
// 其他單字（Skill 在遊戲裡是「點」、Circle 是手把的「○ 鍵」）意思要看上下文，留給人工翻。沒有用途索引就全部不配
const usage = fs.existsSync('work/usage.json') ? readJson('work/usage.json') : {};
const NAME_KINDS = /^(技能|技能變體|被動|恰西強化|區域|章節名稱|名稱對照表|D2 資料（(monster-catalog|hirelings|town|scenery|gear)）|名稱（\w+\.name）)$/;
const isName = k => Object.keys(usage[k]?.kinds ?? {}).some(kind => NAME_KINDS.test(kind));
const auto = {};
for (const k of keys) {
  if (/<\/?\d+\/?>|\{\w+\}/.test(k)) continue;
  if (!/\s/.test(k) && !isName(k)) continue;
  const v = game.get(k.toLowerCase());
  if (v && v !== k) auto[k] = v;
}
for (const k of modKeys) { const v = readGame[k]; if (v) auto[k] = v; }
fs.mkdirSync(`${DIR}/manual`, { recursive: true });

const manual = {};
for (const f of fs.readdirSync(`${DIR}/manual`).filter(f => f.endsWith('.json')).sort()) Object.assign(manual, readJson(`${DIR}/manual/${f}`));
const strings = {};
for (const k of [...keys, ...modKeys]) { const v = manual[k] ?? auto[k]; if (v) strings[k] = v; }
// 「Amazon · Bow and Crossbow Skills」這種用 · 連起來的：每一段都有譯文（自動、人工或遊戲字典）就組起來，算自動配對
for (const k of keys) {
  if (strings[k] || !k.includes(' · ') || /<\/?\d+\/?>/.test(k)) continue;
  const parts = k.split(' · ').map(p => strings[p] ?? manual[p] ?? auto[p] ?? (/\s/.test(p) || isName(p) ? game.get(p.toLowerCase()) : undefined));
  if (parts.every(Boolean)) strings[k] = auto[k] = parts.join(' · ');
}
writeJson(`${DIR}/auto.json`, sortKeys(auto));
writeJson(OUT, { strings: sortKeys(strings) });

const stale = Object.keys(manual).filter(k => !keys.has(k) && !modKeys.has(k));
console.log(`wiki：官方頁面上 ${keys.size} 條，自動配對 ${Object.keys(auto).length}、人工 ${Object.keys(manual).length - stale.length}，有譯文 ${Object.keys(strings).length}（${(Object.keys(strings).length / keys.size * 100).toFixed(1)}%）→ ${OUT}`);
if (stale.length) console.log(`人工譯文裡 ${stale.length} 條官方頁面已經沒有了（留著，官方改回來還用得到）：node tools/wiki-check.mjs --stale 看明細`);
