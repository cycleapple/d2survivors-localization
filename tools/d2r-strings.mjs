// 從 D2R 安裝資料夾取出全部語系字串檔（data/local/lng/strings/*.json，每條都有 enUS、zhTW、koKR…）
// 借用遊戲自己的 CASC 讀取器：把 extract-worker.cjs 複製一份，拿掉 worker 的進入點、改成匯出 openCascFolder
//   node tools/d2r-strings.mjs <app.asar> <D2R 安裝資料夾> <輸出資料夾>
import { extractFile } from '@electron/asar';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [asar, d2rDir, outDir] = process.argv.slice(2);
if (!asar || !d2rDir || !outDir) { console.error('用法：node tools/d2r-strings.mjs <app.asar> <D2R 安裝資料夾> <輸出資料夾>'); process.exit(1); }

const ENTRY = 'if (import_node_worker_threads3.isMainThread) void main();';
let worker = extractFile(asar, path.join('desktop', 'dist', 'extract-worker.cjs')).toString('utf8');
if (worker.split(ENTRY).length !== 2) throw new Error('extract-worker.cjs 的進入點跟預期不同（遊戲版本可能改了）');
worker = worker.replace(ENTRY, 'module.exports = { openCascFolder };');
const readerPath = path.resolve('work/casc-reader.cjs');
fs.mkdirSync(path.dirname(readerPath), { recursive: true });
fs.writeFileSync(readerPath, worker);

const { openCascFolder } = createRequire(import.meta.url)(readerPath);
const casc = openCascFolder(d2rDir);
const names = [...casc.files()].map(f => f.name).filter(n => /local[\\/]lng[\\/]strings[\\/][^\\/]+\.json$/i.test(n));
if (!names.length) throw new Error('D2R 裡找不到 local/lng/strings/*.json');

fs.mkdirSync(outDir, { recursive: true });
let total = 0;
for (const name of names) {
  const data = casc.read(name);
  if (!data) { console.warn(`讀不到：${name}`); continue; }
  const rows = JSON.parse(new TextDecoder('utf-8').decode(data).replace(/^﻿/, ''));
  total += rows.length;
  fs.writeFileSync(path.join(outDir, path.basename(name.replace(/\\/g, '/'))), JSON.stringify(rows, null, 1));
}
casc.close?.();
console.log(`${names.length} 個字串檔、${total} 條 → ${outDir}`);
