// 檢查網頁版書籤的修改規則（tools/web-rules.mjs）還對得上線上的遊戲。規則和字典由 tools/make-manifest.mjs 寫進 manifest
//   node tools/build-web.mjs [--check] [網址]   抓線上的遊戲（預設 WEB_PLAY_URL），每個語言（加上英文）各套用一次規則，
//                                              檢查每條都套得上、改完的模組語法正確
// 全部的語言都沒有必要規則失敗、也沒有語法錯誤時，改寫 web-rules.mjs 的 WEB_CHECKED（manifest 的 game.web_checked）
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'acorn';
import { WEB_RULES, WEB_LANGUAGES, WEB_PLAY_URL } from './web-rules.mjs';
import { loadGame, applyRules, rulesFor, ruleVars, relink } from '../site/web/core.js';

const args = process.argv.slice(2).filter(a => a !== '--check');
const playUrl = args[0] ?? WEB_PLAY_URL;
const get = async url => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
};
const game = await loadGame(playUrl, get);
console.log(`主程式 ${game.entry}，共 ${game.modules.size} 個模組`);

let ok = true;
for (const lang of [null, ...WEB_LANGUAGES]) {
  const rules = rulesFor(WEB_RULES, lang);
  const modules = new Map(game.modules);
  const failed = applyRules(modules, rules, ruleVars(WEB_LANGUAGES, lang, 'blob:dict'));
  console.log(`\n${lang ? `${lang.id}（${lang.groups.join('、')}）` : 'English（base）'}`);
  for (const r of rules) {
    const f = failed.find(x => x.label === r.label);
    console.log(`  ${f ? (r.optional ? '△' : '✗') : '✓'} ${r.label}${f ? `（符合：${f.found}）` : ''}`);
  }
  if (failed.some(r => !r.optional)) ok = false;
  // 改過的模組至少要能被解析（規則換錯會變成語法錯誤）
  for (const [url, src] of modules) {
    if (src === game.modules.get(url)) continue;
    try { parse(relink(url, src), { ecmaVersion: 'latest', sourceType: 'module' }); } catch (e) {
      console.log(`  ✗ 語法錯誤 ${url}：${e.message}`);
      ok = false;
    }
  }
}

if (ok) {
  const file = new URL('./web-rules.mjs', import.meta.url);
  const src = readFileSync(file, 'utf8');
  writeFileSync(file, src.replace(/export const WEB_CHECKED = '[^']*';/, `export const WEB_CHECKED = '${new Date().toISOString()}';`));
  console.log('\n全部的必要規則都套得上，已更新 WEB_CHECKED');
} else {
  console.log('\n有必要規則沒套上或語法錯誤：書籤會提示「需要更新」，要先修 tools/web-rules.mjs');
  process.exitCode = 1;
}
