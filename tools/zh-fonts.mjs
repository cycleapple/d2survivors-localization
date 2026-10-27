// 從 D2R 取出這個語言的字型，只留要用到的字、轉成 woff2，給 patch.mjs 放進 app.asar 的 fonts-zh/
//   node tools/zh-fonts.mjs <D2R 安裝資料夾> <字典 .json> <D2R 字串資料夾> <輸出資料夾> [--lang zh-TW|zh-CN|ja]
// 跟遊戲處理韓文字型的方式一樣（它把 D2R 的 kodia.ttf／irisl.ttf 只留韓文，放在 fonts-ko/）：
//   body.woff2 ← D2R 給這個語言的內文字型（tools/langs.mjs 的 font），大小字都用它。
//   繁中是 blizzardglobaltcunicode.ttf、簡中是 blizzardglobal-v5_81.ttf、日文是 bljap_v8_3.ttf
// D2R 繁中的標題字型 arfangxinshuh7c95b5_eb_t.ttf（文鼎方新書）試過，筆畫太細，在石頭按鈕上反而難讀，所以不用
// 留下的字：字典譯文和 D2R 這個語言的字串裡出現過的所有中日韓字元、假名、中文標點、全形字元
// 字型是暴雪和文鼎的，輸出只能自己用（放在 work/，不要公開）。需要 Python 的 fontTools 和 brotli
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { takeLang } from './langs.mjs';

const { lang, args } = takeLang(process.argv.slice(2));
const [d2rDir, dictFile, stringsDir, outDir] = args;
if (!outDir) { console.error('用法：node tools/zh-fonts.mjs <D2R 安裝資料夾> <字典 .json> <D2R 字串資料夾> <輸出資料夾> [--lang zh-TW|zh-CN|ja]'); process.exit(1); }

// 俄文（langs.mjs 的 fontFiles）分成兩個：title.woff2 ← Exocet（按鈕、標題，跟遊戲的拉丁字母同一套），
// body.woff2 ← Philosopher Bold Italic（內文，D2R 俄文版代替沒有西里爾字母的 Formal436 用的字型）
const FONTS = lang.fontFiles ?? [
  { out: 'body.woff2', src: lang.font },
];
if (!FONTS.every(f => f.src)) { console.error(`${lang.name} 不用另外的字型（點陣字型本來就有這些字）`); process.exit(1); }
// 中文標點、假名、漢字（含擴充 A）、全形字元；俄文是西里爾字母
const CJK = lang.fontChars ?? /[　-ヿ㐀-䶿一-鿿＀-￯]/;

const chars = new Set();
const collect = s => { for (const ch of s ?? '') if (CJK.test(ch)) chars.add(ch); };
for (const value of Object.values(JSON.parse(fs.readFileSync(dictFile, 'utf8')))) collect(value);
for (const file of fs.readdirSync(stringsDir).filter(n => n.endsWith('.json'))) {
  for (const row of JSON.parse(fs.readFileSync(path.join(stringsDir, file), 'utf8'))) collect(row[lang.col]);
}

// d2r-strings.mjs 產生的 CASC 讀取器（遊戲自己的，從 extract-worker.cjs 改出來）
const readerPath = path.resolve('work/casc-reader.cjs');
if (!fs.existsSync(readerPath)) throw new Error('找不到 work/casc-reader.cjs，先執行一次 tools/d2r-strings.mjs');
const { openCascFolder } = createRequire(import.meta.url)(readerPath);
const casc = openCascFolder(d2rDir);
const names = [...casc.files()].map(f => f.name);

fs.mkdirSync(outDir, { recursive: true });
const charsFile = path.join(outDir, 'chars.txt');
fs.writeFileSync(charsFile, [...chars].join(''));
for (const font of FONTS) {
  const name = names.find(n => n.toLowerCase().endsWith(`fonts\\${font.src}`) || n.toLowerCase().endsWith(`fonts/${font.src}`));
  if (!name) throw new Error(`D2R 裡找不到 ${font.src}`);
  const ttf = path.join(outDir, font.src);
  fs.writeFileSync(ttf, casc.read(name));
  execFileSync('python', ['-m', 'fontTools.subset', ttf, `--text-file=${charsFile}`, '--flavor=woff2', '--layout-features=*', `--output-file=${path.join(outDir, font.out)}`], { stdio: 'inherit' });
  fs.rmSync(ttf);
  console.log(`${font.out} ← ${font.src}：${(fs.statSync(path.join(outDir, font.out)).size / 1024).toFixed(0)} KB`);
}
casc.close?.();
console.log(`${chars.size} 個字 → ${outDir}`);
