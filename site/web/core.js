// 抓遊戲的模組、套用修改規則。書籤（d2zh.js）和 tools/build-web.mjs 共用，不能用到瀏覽器或 Node 專屬的東西。

// 模組裡引用其他模組的寫法："./x.js"、`./x.js`（含 Vite 的 __vite__mapDeps 清單）
const SPEC = /(["'`])\.\/([\w.-]+\.js)\1/g;

// 從遊戲頁面找到主程式，再一路抓下所有引用到的模組。get(url) 回傳文字
export async function loadGame(playUrl, get) {
  const html = await get(playUrl);
  const m = /<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"[^>]*><\/script>/.exec(html);
  if (!m) throw new Error('找不到遊戲的主程式（<script type="module">）');
  const entry = new URL(m[1], playUrl).href;
  const modules = new Map();
  let queue = [entry];
  while (queue.length) {
    const batch = [...new Set(queue)].filter(u => !modules.has(u));
    const sources = await Promise.all(batch.map(get));
    queue = [];
    batch.forEach((url, i) => {
      modules.set(url, sources[i]);
      for (const [, , name] of sources[i].matchAll(SPEC)) queue.push(new URL(name, url).href);
    });
  }
  return { html, entry, modules };
}

const fileName = url => url.slice(url.lastIndexOf('/') + 1);

// 每條規則的 find 在（file 符合的）模組裡必須剛好符合一次。直接改 modules，回傳沒套上的規則
export function applyRules(modules, rules, vars = {}) {
  const failed = [];
  for (const rule of rules) {
    const re = new RegExp(rule.find, 'g');
    const fileRe = rule.file ? new RegExp(rule.file) : null;
    const hits = [];
    for (const [url, src] of modules) {
      if (fileRe && !fileRe.test(fileName(url))) continue;
      const n = [...src.matchAll(re)].length;
      if (n) hits.push({ url, n });
    }
    if (hits.length !== 1 || hits[0].n !== 1) {
      failed.push({ ...rule, found: hits.map(h => `${fileName(h.url)}×${h.n}`).join(', ') || '沒有' });
      continue;
    }
    const to = rule.replace.replace(/\{\{(\w+)\}\}/g, (s, k) => vars[k] ?? s);
    modules.set(hits[0].url, modules.get(hits[0].url).replace(new RegExp(rule.find), to));
  }
  return failed;
}

// 模組換成 blob 網址後，相對路徑和 import.meta.url 會失效：一律改成原本的絕對網址，
// 再用 import map 把原本的網址對應到 blob
export function relink(url, src) {
  return src
    .replace(SPEC, (s, q, name) => q + new URL(name, url).href + q)
    .replaceAll('import.meta.url', JSON.stringify(url));
}

// 遊戲頁面改成：先放 import map，再載入主程式。modulepreload 會抓原版，拿掉；
// 沒有 type 的 inline script（網站統計）外層頁面已經跑過，也拿掉
export function bootHtml(html, playUrl, entry, importMap) {
  const boot = `<script type="importmap">${JSON.stringify(importMap)}</script>`
    + `<script type="module">import ${JSON.stringify(entry)};</script>`;
  return html
    .replace(/<head>/, `<head><base href="${playUrl}"><meta name="d2zh" content="1">`)
    .replace(/<link rel="modulepreload"[^>]*>\s*/g, '')
    .replace(/<script>[\s\S]*?<\/script>\s*/g, '')
    .replace(/<script\b[^>]*\btype="module"[^>]*\bsrc="[^"]+"[^>]*><\/script>/, () => boot);
}
