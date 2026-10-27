// 從遊戲的 app.asar 抽出韓文字典的全部英文 key（連同韓文譯文，之後配對官方字串用）
//   node tools/extract-keys.mjs <app.asar> <輸出 .json>
import { extractFile, listPackage } from '@electron/asar';
import fs from 'node:fs';
import path from 'node:path';
import { readDict } from './read-dict.mjs';

const [asar, out] = process.argv.slice(2);
const koPath = listPackage(asar).find(p => /[/\\]web[/\\]assets[/\\]ko-[^/\\]*\.js$/.test(p));
if (!koPath) throw new Error('app.asar 裡找不到 ko-*.js');
const tmp = path.resolve('work/ko-dict.js');
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.writeFileSync(tmp, extractFile(asar, koPath.replace(/^[/\\]/, '')));
const dict = readDict(tmp);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(dict, null, 1));
console.log(`${Object.keys(dict).length} 條 → ${out}`);
