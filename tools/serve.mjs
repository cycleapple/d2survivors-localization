// 本機預覽網站，並允許其他網域讀取（在 d2survivors.lol 上測試書籤用）
//   node tools/serve.mjs [資料夾=site] [port=8766]
// 書籤改成：javascript:import('http://localhost:8766/web/d2zh.js').then(m=>m.default())
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.argv[2] ?? 'site';
const port = Number(process.argv[3] ?? 8766);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };

createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // 公開網站讀 localhost 時 Chrome 會先送 Private Network Access 的預檢
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', '*'); res.end(); return; }
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\\/])+/, '');
  if (!path || path.endsWith('/') || path.endsWith('\\')) path = join(path, 'index.html');
  try {
    if (path.startsWith('..')) throw new Error('outside root');
    const body = await readFile(join(root, path));
    res.setHeader('Content-Type', TYPES[extname(path)] ?? 'application/octet-stream');
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end('not found');
  }
}).listen(port, () => console.log(`http://localhost:${port}/`));
