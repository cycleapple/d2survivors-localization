// 檢查 wiki 譯文（dict/wiki/）：佔位符一致、沒有韓文、各頁翻了多少
//   node tools/wiki-check.mjs [--pages] [--todo <頁面路徑>] [--stale]
//   預設：錯誤清單 + 總覽（字串數、字數）
//   --pages       每一頁的進度（有缺的才列）
//   --todo <路徑> 那一頁還沒有譯文的 key（例如 --todo items/uniques；首頁是 --todo ""）
//   --stale       人工譯文裡官方頁面已經沒有的 key
// 有錯誤時結束碼是 1
import fs from 'node:fs';
import path from 'node:path';
import { enSpans, pageStrings } from './wiki-strings.mjs';

const SRC = 'data/wiki/src', DIR = 'dict/wiki';
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] ?? '' : undefined; };

const { pages } = readJson(`${SRC}/pages.json`);
const perPage = pages.map(p => ({ path: p.path, strings: pageStrings(fs.readFileSync(path.join(SRC, p.path, 'index.html'), 'utf8')) }));
const kindOf = new Map(perPage.flatMap(p => p.strings.map(s => [s.key, s.kind])));
const modKeys = new Set(pages.flatMap(p => enSpans(fs.readFileSync(path.join(SRC, p.path, 'index.html'), 'utf8')).filter(s => s.context === 'modifier').map(s => `modifier:${s.key}`)));
const { strings } = readJson(`${DIR}/zh-TW.json`);
const layers = [['auto.json', readJson(`${DIR}/auto.json`)], ...fs.readdirSync(`${DIR}/manual`).filter(f => f.endsWith('.json')).sort().map(f => [`manual/${f}`, readJson(`${DIR}/manual/${f}`)])];

// 佔位符：<0>…</0>、<1/>、{n} 這類，每個都要跟原文一樣多（可以換順序）
const marks = s => (s.match(/<\/?\d+\/?>|\{\w+\}/g) ?? []).sort().join(' ');
const errors = [];
for (const [file, dict] of layers) {
  for (const [k, v] of Object.entries(dict)) {
    const where = `${file}：${JSON.stringify(k).slice(0, 80)}`;
    if (typeof v !== 'string' || !v.trim()) { errors.push(`${where} 譯文是空的`); continue; }
    if (marks(k) !== marks(v)) errors.push(`${where} 佔位符不一致：原文 [${marks(k)}]，譯文 [${marks(v)}]`);
    // 開關要成對、照順序巢狀（<0><1></1></0> 可以，<0><1></0></1> 不行）
    const stack = [];
    for (const [, close, n, self] of v.matchAll(/<(\/?)(\d+)(\/?)>/g)) {
      if (self) continue;
      if (!close) stack.push(n);
      else if (stack.pop() !== n) { errors.push(`${where} 佔位符的開關順序不對：${v.slice(0, 80)}`); break; }
    }
    if (/[가-힣]/.test(v)) errors.push(`${where} 譯文裡有韓文`);
    if (/[<>]/.test(v.replace(/<\/?\d+\/?>/g, ''))) errors.push(`${where} 譯文裡有佔位符以外的 < 或 >`);
  }
}

if (arg('--todo') !== undefined) {
  const p = perPage.find(p => p.path === arg('--todo').replace(/^\/?(wiki\/)?|\/$/g, ''));
  if (!p) { console.error(`沒有這一頁：${arg('--todo')}`); process.exit(1); }
  for (const k of [...new Set(p.strings.map(s => s.key))].filter(k => !strings[k])) console.log(JSON.stringify(k));
  process.exit(0);
}
if (process.argv.includes('--stale')) {
  for (const [file, dict] of layers.slice(1)) for (const k of Object.keys(dict)) if (!kindOf.has(k) && !modKeys.has(k)) console.log(`${file}：${JSON.stringify(k)}`);
  process.exit(0);
}

const words = k => k.replace(/<\/?\d+\/?>/g, ' ').split(/\s+/).filter(Boolean).length;
const all = [...kindOf.keys()], done = all.filter(k => strings[k]);
const sum = ks => ks.reduce((n, k) => n + words(k), 0);
console.log(`wiki 譯文：${done.length} / ${all.length} 條（${(done.length / all.length * 100).toFixed(1)}%），字數 ${sum(done)} / ${sum(all)}（${(sum(done) / sum(all) * 100).toFixed(1)}%）`);
for (const kind of ['html', 'data', 'meta', 'attr']) {
  const ks = all.filter(k => kindOf.get(k) === kind);
  console.log(`  ${kind.padEnd(5)} ${ks.filter(k => strings[k]).length} / ${ks.length}`);
}
const full = perPage.filter(p => p.strings.every(s => strings[s.key]));
console.log(`整頁都有譯文的：${full.length} / ${pages.length} 頁${full.length && full.length <= 10 ? `（${full.map(p => p.path || '首頁').join('、')}）` : ''}`);
if (process.argv.includes('--pages')) {
  for (const p of perPage) {
    const ks = [...new Set(p.strings.map(s => s.key))], miss = ks.filter(k => !strings[k]);
    if (miss.length) console.log(`  /wiki/${p.path}${p.path ? '/' : ''}  缺 ${miss.length} / ${ks.length}（${sum(miss)} 字）`);
  }
}
if (errors.length) { console.log(`\n錯誤 ${errors.length} 條：`); for (const e of errors) console.log(`  ${e}`); process.exit(1); }
console.log('錯誤 0 條');
