// 把 work/app.asar 裝進遊戲，或用備份還原
//   node tools/install.mjs            裝上 work/app.asar
//   node tools/install.mjs --restore  還原成 backup/<版本>/app.asar
import fs from 'node:fs';
import path from 'node:path';

const game = path.join(process.env.LOCALAPPDATA, 'Programs', 'D2 Survivors', 'resources', 'app.asar');
const restore = process.argv.includes('--restore');
// backup/ 裡也有存檔備份（saves-*），只看有 app.asar 的資料夾
const backups = fs.readdirSync('backup').filter(d => fs.existsSync(path.join('backup', d, 'app.asar'))).sort();
const src = restore ? path.join('backup', backups.at(-1), 'app.asar') : 'work/app.asar';
fs.copyFileSync(src, game);
console.log(`${restore ? '已還原' : '已安裝'}：${src} → ${game}`);
