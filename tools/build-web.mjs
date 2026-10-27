// 網頁版書籤（site/web/）的資料：rules.json（修改規則）、zh-TW.json（字典）
//   node tools/build-web.mjs [字典]          產生 site/web/rules.json、site/web/zh-TW.json（預設字典 dict/zh-TW.json）
//   node tools/build-web.mjs --check [網址]  抓線上的遊戲（預設 https://d2survivors.lol/play/），檢查每條規則都套得上
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
import { WEB_RULES } from './web-rules.mjs';
import { loadGame, applyRules, relink } from '../site/web/core.js';

const OUT = 'site/web';
const args = process.argv.slice(2);

if (args[0] === '--check') {
  const playUrl = args[1] ?? 'https://d2survivors.lol/play/';
  const get = async url => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.text();
  };
  const game = await loadGame(playUrl, get);
  console.log(`主程式 ${game.entry}，共 ${game.modules.size} 個模組`);
  const failed = applyRules(game.modules, WEB_RULES, { zh_dict: 'blob:zh' });
  for (const r of WEB_RULES) {
    const f = failed.find(x => x.label === r.label);
    console.log(`${f ? (r.optional ? '△' : '✗') : '✓'} ${r.label}${f ? `（符合：${f.found}）` : ''}`);
  }
  // 改過的模組至少要能被解析（規則換錯會變成語法錯誤）
  for (const [url, src] of game.modules) {
    try { parse(relink(url, src), { ecmaVersion: 'latest', sourceType: 'module' }); } catch (e) {
      console.log(`✗ 語法錯誤 ${url}：${e.message}`);
      process.exitCode = 1;
    }
  }
  if (failed.some(r => !r.optional)) process.exitCode = 1;
} else {
  const dictPath = args[0] ?? 'dict/zh-TW.json';
  const dict = JSON.stringify(JSON.parse(readFileSync(dictPath, 'utf8')));
  const dictHash = createHash('sha256').update(dict).digest('hex').slice(0, 12);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/zh-TW.json`, dict);
  const rules = WEB_RULES.map(({ label, file, find, replace, optional }) => ({ label, file, find, replace, optional: !!optional }));
  writeFileSync(`${OUT}/rules.json`, JSON.stringify({ updated: new Date().toISOString(), dictHash, entries: Object.keys(JSON.parse(dict)).length, rules }, null, 1) + '\n');
  console.log(`${OUT}/zh-TW.json（${Object.keys(JSON.parse(dict)).length} 條，${dictHash}）、${OUT}/rules.json（${rules.length} 條規則）`);
}
