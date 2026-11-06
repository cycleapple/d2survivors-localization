// 抓官方 wiki（https://d2survivors.lol/wiki/）到 data/wiki/src/，翻成網站上的繁中版用（格式見 docs/manifest-v2.md 的「wiki」）
//   node tools/wiki-fetch.mjs [--delay 毫秒，預設 1500]
// 從 /wiki/ 開始，照頁面裡的 /wiki/… 連結一頁一頁爬（一次一頁、每頁之間停一下，不要對官方網站太兇）。
// 每頁存成 data/wiki/src/<路徑>/index.html（首頁是 data/wiki/src/index.html），清單寫 data/wiki/src/pages.json：
//   { fetched, pages: [{ path, sha256 }] }，path 是 /wiki/ 後面那段、不含頭尾斜線（"items/uniques"；首頁是 ""）
// 再跑一次時跟上一次的 pages.json 比，列出新增、改動、刪除的頁面；有 dict/wiki/zh-TW.json 的話再列出還沒有譯文的字串
// 官方拿掉的頁面只從清單拿掉，檔案留著（要不要刪自己決定）
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pageStrings } from './wiki-strings.mjs';

const BASE = 'https://d2survivors.lol/wiki/';
const OUT = 'data/wiki/src';
const DICT = 'dict/wiki/zh-TW.json';
const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const DELAY = Number(arg('--delay') ?? 1500);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const file = p => path.join(OUT, p, 'index.html');

// 頁面裡指到 wiki 頁面的連結 → path（不含 #、?，不含檔案）
function wikiLinks(html, pageUrl) {
  const out = new Set();
  for (const [, href] of html.matchAll(/<a\s[^>]*?href="([^"]*)"/g)) {
    let url;
    try { url = new URL(href.replace(/&amp;/g, '&'), pageUrl); } catch { continue; }
    if (url.origin !== new URL(BASE).origin || !url.pathname.startsWith('/wiki/')) continue;
    const p = url.pathname.slice('/wiki/'.length).replace(/\/+$/, '');
    if (/\.[a-z0-9]+$/i.test(p)) continue;
    out.add(decodeURIComponent(p));
  }
  return out;
}

async function get(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'd2survivors-localization wiki-fetch (one page at a time, for an unofficial translation)' } });
    if (res.ok) return res.text();
    if (res.status === 404) return null;
    if (res.status === 429 || attempt >= 3) throw new Error(`${url}：HTTP ${res.status}`);
    await sleep(DELAY * 4 * attempt);
  }
}

const before = fs.existsSync(`${OUT}/pages.json`) ? JSON.parse(fs.readFileSync(`${OUT}/pages.json`, 'utf8')) : null;
const oldHash = new Map((before?.pages ?? []).map(p => [p.path, p.sha256]));
const queue = [''], seen = new Set(queue), pages = [], missing = [];
while (queue.length) {
  const p = queue.shift();
  const url = BASE + (p ? `${p}/` : '');
  const html = await get(url);
  if (html == null) { missing.push(p); continue; }
  fs.mkdirSync(path.dirname(file(p)), { recursive: true });
  fs.writeFileSync(file(p), html);
  pages.push({ path: p, sha256: sha256(html) });
  for (const l of wikiLinks(html, url)) if (!seen.has(l)) { seen.add(l); queue.push(l); }
  process.stdout.write(`\r${pages.length} 頁，還有 ${queue.length} 頁  `);
  if (queue.length) await sleep(DELAY);
}
console.log();
pages.sort((a, b) => a.path.localeCompare(b.path, 'en'));
fs.writeFileSync(`${OUT}/pages.json`, JSON.stringify({ fetched: new Date().toISOString(), pages }, null, 1) + '\n');
console.log(`${pages.length} 頁 → ${OUT}/`);
if (missing.length) console.log(`連結指到、但官方回 404 的頁面：${missing.map(p => `/wiki/${p}`).join('、')}`);

if (before) {
  const now = new Set(pages.map(p => p.path));
  const list = (title, ps) => ps.length && console.log(`${title}（${ps.length}）：\n${ps.map(p => `  /wiki/${p}${p ? '/' : ''}`).join('\n')}`);
  list('新增的頁面', pages.filter(p => !oldHash.has(p.path)).map(p => p.path));
  list('改動的頁面', pages.filter(p => oldHash.has(p.path) && oldHash.get(p.path) !== p.sha256).map(p => p.path));
  list('官方拿掉的頁面（檔案留著）', [...oldHash.keys()].filter(p => !now.has(p)));
}

// 還沒有譯文的字串（照頁面列）
if (fs.existsSync(DICT)) {
  const { strings } = JSON.parse(fs.readFileSync(DICT, 'utf8'));
  let total = 0;
  const byPage = [];
  for (const { path: p } of pages) {
    const todo = [...new Set(pageStrings(fs.readFileSync(file(p), 'utf8')).map(s => s.key))].filter(k => !strings[k]);
    if (todo.length) { byPage.push([p, todo.length]); total += todo.length; }
  }
  const unique = new Set(pages.flatMap(({ path: p }) => pageStrings(fs.readFileSync(file(p), 'utf8')).map(s => s.key)).filter(k => !strings[k]));
  console.log(`還沒有譯文：${unique.size} 條（各頁加起來 ${total}），${byPage.length} 頁有缺。各頁明細：node tools/wiki-check.mjs`);
}
