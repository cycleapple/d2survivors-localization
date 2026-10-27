// 產生啟動器的更新來源：<輸出資料夾>/manifest.json 和各語言的字典
//   node tools/make-manifest.mjs <輸出資料夾>
// 把整個資料夾放到網站上（或 GitHub），啟動器的 manifest_url 指到 manifest.json 就會自動更新。
// 字典網址是相對於 manifest.json 的路徑。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ASSETS_DIR, DICT_TARGET, RULES, LANGUAGES } from './patch-rules.mjs';

const [outDir] = process.argv.slice(2);
if (!outDir) { console.error('用法：node tools/make-manifest.mjs <輸出資料夾>'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');
const now = new Date();
const stamp = now.toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');

const languages = LANGUAGES.map(({ dict, ...lang }) => {
  const buf = fs.readFileSync(dict);
  const entries = Object.keys(JSON.parse(buf.toString('utf8'))).length;
  const name = `${lang.id}.json`;
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log(`${lang.id}：${entries} 條 → ${name}`);
  // 網址帶上雜湊：GitHub raw 會快取 5 分鐘，換了網址才不會拿到舊字典
  const hash = sha256(buf);
  return { ...lang, version: stamp, entries, dict: { url: `${name}?v=${hash.slice(0, 12)}`, sha256: hash, size: buf.length } };
});

const manifest = {
  schema: 1,
  updated: now.toISOString(),
  patch: { assets_dir: ASSETS_DIR, dict_target: DICT_TARGET, rules: RULES },
  languages,
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`完成：${path.join(outDir, 'manifest.json')}`);
