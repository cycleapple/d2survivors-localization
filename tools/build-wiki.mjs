// 官方 wiki 的繁中版：讀 wiki-fetch 抓的官方頁面（data/wiki/src/）和譯文（dict/wiki/zh-TW.json），產生 site/zh-tw/wiki/**。
// 格式和規則見 docs/manifest-v2.md 的「wiki（網站上的繁中版）」，網站這邊的作法見 docs/site.md 的「wiki」。
// GitHub Actions 讀不到 data/，所以在本機跑，產生的頁面 commit 進 repo。build-site.mjs 不動這些檔案，只讀 site/zh-tw/wiki/pages.json 加進 sitemap 和繁中首頁。
//
// node tools/build-wiki.mjs                                    產生全部頁面
// node tools/build-wiki.mjs --src <資料夾> --dict <檔案> --out <資料夾>   換來源或輸出位置（測試用）
//
// 譯文的 key 跟翻譯的工具一樣用 tools/wiki-strings.mjs 算

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SITE, SITE_LANGS } from '../site/src/config.mjs';
import { I18N } from '../site/src/i18n.mjs';
import { htmlKey, fillKey, enSpans, lookup, wikiData } from './wiki-strings.mjs';

const OFFICIAL = 'https://d2survivors.lol/wiki/';
const LANG = SITE_LANGS.find(l => l.id === 'zh-TW');
const OUT_PATH = `${LANG.path}/wiki/`; // 相對於網站根目錄

// 只有繁中，介面文字直接寫在這裡（不放 i18n.mjs）
const T = {
  titleSuffix: 'D2 Survivors Wiki 繁體中文版',
  home: '繁中翻譯首頁',
  official: '官方網站',
  toc: '目錄',
  tocLabel: 'Wiki 目錄',
  crumbs: '目前位置',
  notice: (link, date) => `<strong>非官方翻譯。</strong>本頁翻譯自 D2 Survivors 官方 wiki 的${link}，上次對照官方：${date}。內容以官方原文為準。`,
  untranslated: n => `這頁還有 ${n} 段沒翻譯，先顯示英文原文。`,
  // 官方用玩家自己的遊戲檔在瀏覽器裡畫的清單（物品等）：我們不放遊戲檔，連到官方原頁
  dataList: link => `這份清單是官方網頁讀《暗黑破壞神 II》的遊戲檔畫出來的，這裡不放遊戲檔，請到${link}查看。`,
  dataListLink: '官方原頁',
  // 官方用 JS 做的互動表（恐怖區域的階級轉盤等）
  tiersLabel: '每一階的數字（可以左右、上下捲動）',
  dataWidget: link => `這裡原本是官方網頁的互動表格，請到${link}使用。`,
  sourceCredit: 'wiki 原文：D2 Survivors 官方 wiki（framara 製作），繁體中文由玩家翻譯。',
};

// ---------- HTML：小型解析器（官方頁面是程式產生的，結構規律，不需要完整的 HTML5 解析） ----------

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea']);
const TAG_RE = /<!--[\s\S]*?-->|<![^>]*>|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/g;

// 節點：{ text }（原始 HTML 文字，實體不解碼）或 { tag, attrs: [[name, value|null]], children }；
// pos 時元素多一欄 at（開標籤在 html 裡的位置），用來對回 wiki-strings 的 enSpans
export function parseHtml(html, { pos = false } = {}) {
  const root = { tag: '#root', attrs: [], children: [] };
  const stack = [root];
  const top = () => stack[stack.length - 1];
  let last = 0;
  TAG_RE.lastIndex = 0;
  for (let m; (m = TAG_RE.exec(html));) {
    if (m.index > last) top().children.push({ text: html.slice(last, m.index) });
    last = TAG_RE.lastIndex;
    if (m[0].startsWith('<!')) continue; // 註解、doctype
    if (m[1]) {
      const i = stack.findLastIndex(n => n.tag === m[1].toLowerCase());
      if (i > 0) stack.length = i;
      continue;
    }
    const el = { tag: m[2].toLowerCase(), attrs: parseAttrs(m[3]), children: [] };
    if (pos) el.at = m.index;
    top().children.push(el);
    if (RAW.has(el.tag)) {
      const end = new RegExp(`</${el.tag}\\s*>`, 'ig');
      end.lastIndex = last;
      const e = end.exec(html);
      el.children.push({ text: html.slice(last, e ? e.index : html.length) });
      last = TAG_RE.lastIndex = e ? end.lastIndex : html.length;
    } else if (!VOID.has(el.tag) && !m[4]) stack.push(el);
  }
  if (last < html.length) top().children.push({ text: html.slice(last) });
  return root;
}

function parseAttrs(s) {
  return [...s.matchAll(/([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)]
    .map(m => [m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? null]);
}

export const serialize = nodes => nodes.map(n => {
  if (!n.tag) return n.text;
  const open = `<${n.tag}${n.attrs.map(([k, v]) => (v === null ? ` ${k}` : ` ${k}="${v.replace(/"/g, '&quot;')}"`)).join('')}>`;
  return VOID.has(n.tag) ? open : `${open}${serialize(n.children)}</${n.tag}>`;
}).join('');

const attr = (el, name) => el.attrs?.find(([k]) => k === name)?.[1];
const hasClass = (el, c) => (attr(el, 'class') || '').split(/\s+/).includes(c);
const withAttr = (el, name, value) => ({ ...el, attrs: [...el.attrs.filter(([k]) => k !== name), ...(value === undefined ? [] : [[name, value]])] });
function find(nodes, test) {
  for (const n of nodes) {
    if (!n.tag) continue;
    if (test(n)) return n;
    const f = find(n.children, test);
    if (f) return f;
  }
  return null;
}
const findAll = (nodes, test, out = []) => {
  for (const n of nodes) if (n.tag) { if (test(n)) out.push(n); else findAll(n.children, test, out); }
  return out;
};

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };
const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
  e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENTITIES[e.toLowerCase()] ?? m);
const escText = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const escAttr = s => escText(s).replace(/"/g, '&quot;');
const textOf = nodes => decode(nodes.map(n => (n.tag ? textOf(n.children) : n.text)).join('')).replace(/[ \t\n\r\f]+/g, ' ').trim();

// ---------- 譯文 ----------

// key 和查法都用翻譯的 tools/wiki-strings.mjs，兩邊才不會分岔：官方頁面裡的 span 用 enSpans 給的 key、tags、context，
// 譯文用 lookup 查（技能變體名稱先查 modifier:名稱）；其他（頁尾的版權聲明、譯文換回來之後裡面的元素）用 htmlKey 算
const placeholders = s => [...s.matchAll(/<\/?\d+\/?>/g)].map(m => m[0]).sort().join();
// 一個元素的內容 → { key, nodes（譯文換回的節點，沒有譯文或佔位符對不上是 null）, bad }
function translate(el, ctx) {
  const span = ctx.spans.get(el.at);
  const { key, tags } = span || htmlKey(serialize(el.children));
  const tr = key && (span ? lookup(ctx.dict, span) : ctx.dict[key]);
  if (!tr) return { key, nodes: null };
  if (placeholders(tr) !== placeholders(key)) return { key, nodes: null, bad: true };
  try { return { key, nodes: parseHtml(fillKey(tr, tags)).children }; } catch { return { key, nodes: null, bad: true }; }
}

// ---------- 一頁 ----------

// 拿掉的元素：官方的程式、圖片、遊戲檔畫的圖示、搜尋框（要官方的 JS）、等 JS 才顯示的東西
const DROP_TAGS = new Set(['script', 'style', 'link', 'meta', 'img', 'svg', 'canvas', 'picture', 'video', 'audio', 'iframe', 'noscript', 'input', 'select', 'textarea', 'button', 'template']);
const DROP_CLASSES = ['wiki-icon', 'wiki-search', 'wiki-side-toggle'];
const dropped = n => DROP_TAGS.has(n.tag) || DROP_CLASSES.some(c => hasClass(n, c)) || attr(n, 'hidden') !== undefined;

// 官方網址的 wiki 路徑（'' 是 wiki 首頁，'items/uniques' …）；不是 wiki 頁面回傳 null
function wikiPath(url) {
  const u = new URL(url);
  if (u.origin !== new URL(OFFICIAL).origin || !(u.pathname + '/').startsWith('/wiki/')) return null;
  return u.pathname.replace(/^\/wiki\/?/, '').replace(/\/+$/, '');
}
const normPath = p => p.replace(/\\/g, '/').replace(/^\/?(wiki\/)?/, '').replace(/\/?(index\.html)?$/, '');
const officialUrl = p => new URL(p ? `${p}/` : '', OFFICIAL).href;
const pageDepth = p => (p ? p.split('/').length : 0) + OUT_PATH.split('/').filter(Boolean).length;
// 從 from 頁到 to 頁的相對網址（兩個都是 wiki 路徑）
function relWiki(from, to) {
  const rel = path.posix.relative(`/${from}`, `/${to}`);
  return rel ? `${rel}/` : './';
}

function localize(nodes, ctx) {
  const out = [];
  for (const n of nodes) {
    if (!n.tag) { out.push(n); continue; }
    const lang = attr(n, 'data-in');
    if ((lang && lang !== 'en') || attr(n, 'lang') === 'ko' || dropped(n)) continue;
    // 恐懼階轉盤：wiki-data 的 rows 做成 100 階的靜態表
    if (hasClass(n, 'wiki-dial') && ctx.data?.rows?.length) {
      out.push({ text: terrorTable(ctx.data, ctx) });
      continue;
    }
    // 用遊戲檔畫的清單（data-items 等）：換成一句說明
    const widget = attr(n, 'data-items') !== undefined ? T.dataList : hasClass(n, 'wiki-dial') ? T.dataWidget : null;
    if (widget) {
      out.push({ text: `<p class="wiki-data-note">${widget(`<a href="${escAttr(ctx.official)}" target="_blank" rel="noopener">${T.dataListLink}</a>`)}</p>` });
      continue;
    }
    let el = n.attrs.some(([k]) => k === 'href') ? link(n, ctx) : n;
    if (lang === 'en') {
      const { key, nodes: f, bad } = translate(n, ctx);
      if (f) ctx.translated++;
      else if (bad) ctx.bad.add(key);
      else if (key) ctx.missing.add(key);
      const kids = localize(f || n.children, ctx);
      el = withAttr(el, 'data-in');
      // 沒翻到的保留英文：標 lang="en"，螢幕報讀和字型才對
      if (!f && key) el = withAttr(el, 'lang', 'en');
      if (el.tag === 'span' && !el.attrs.length) out.push(...kids);
      else out.push({ ...el, children: kids });
      continue;
    }
    out.push({ ...el, children: localize(el.children, ctx) });
  }
  return out;
}

// wiki-data 的 { en, ko }：換成譯文，沒有就英文（標 lang="en"）
function dataText(o, ctx) {
  const key = (o?.en || '').replace(/\s+/g, ' ').trim();
  const tr = ctx.dict[key];
  if (tr) ctx.translated++;
  else if (key) ctx.missing.add(key);
  return tr ? escText(tr) : `<span lang="en">${escText(key)}</span>`;
}

// 恐懼階轉盤（terror 頁的 .wiki-dial）→ 靜態表格。官方是選一階顯示 8 格，這裡每一列一階。
// rows 的 13 欄和數字格式見 docs/translation.md 的「恐懼階轉盤」：階、怪物等級、首領等級、/players、怪物總數、
// 生命、傷害、經驗值倍數、詞綴數、物品等級、魔寶%、金幣%、物品%
function terrorTable(data, ctx) {
  const t = k => dataText(data.text?.[k], ctx);
  const num = n => n.toLocaleString('en-US');
  const times = x => `${x >= 10 ? x.toFixed(1) : x.toFixed(2)}×`;
  const cols = [
    [t('tier'), r => r[0]],
    [t('monsters'), r => num(r[4]), 'hot'],
    [t('perWave'), r => num(Math.round(r[4] / (data.waves || 9)))],
    [t('monsterLevel'), r => r[1]],
    [t('boss'), r => r[2]],
    ['/players', r => r[3]],
    [t('life'), r => times(r[5]), 'hot'],
    [t('damage'), r => times(r[6])],
    [t('experience'), r => times(r[7])],
    [t('affixes'), r => r[8]],
    [t('magicFind'), r => `+${r[10]}%`],
    [t('gold'), r => `+${r[11]}%`],
    [t('items'), r => `+${r[12]}%`],
    [t('itemLevel'), r => r[9]],
  ];
  return `<div class="wiki-scroll wiki-tiers" tabindex="0" role="region" aria-label="${T.tiersLabel}"><table class="wiki-table wiki-num">
  <thead><tr>${cols.map(([h, , c]) => `<th scope="col"${c ? ` class="${c}"` : ''}>${h}</th>`).join('')}</tr></thead>
  <tbody>
${data.rows.map(r => `  <tr>${cols.map(([, f, c], i) => (i ? `<td${c ? ` class="${c}"` : ''}>${f(r)}</td>` : `<th scope="row">${f(r)}</th>`)).join('')}</tr>`).join('\n')}
  </tbody>
</table></div>`;
}

// 連結：wiki 頁面之間（這次有產生的頁面）換成我們的，其他（遊戲、排行榜、FAQ、還沒有譯文的頁面）連回官方
function link(n, ctx) {
  const href = decode(attr(n, 'href'));
  if (href.startsWith('#')) return n;
  let u;
  try { u = new URL(href, ctx.official); } catch { return withAttr(n, 'href'); }
  if (u.pathname.startsWith('/cdn-cgi/')) return withAttr(n, 'href'); // Cloudflare 的信箱保護
  const p = wikiPath(u.href);
  if (p !== null && ctx.pages.has(p)) return withAttr(n, 'href', escAttr(relWiki(ctx.path, p) + u.hash));
  let el = withAttr(n, 'href', escAttr(u.href));
  if (u.protocol.startsWith('http')) el = withAttr(withAttr(el, 'target', '_blank'), 'rel', 'noopener');
  return el;
}

const inner = (n, ctx) => (n ? serialize(localize(n.children, ctx)) : '');

// 標題字型：跟 build-site.mjs 一樣，中文的 Noto Serif 只載 h1～h3 和品牌用到的字
const GOOGLE_FONTS = 'https://fonts.googleapis.com/css2?';
function fontLinks(html) {
  const text = [...html.matchAll(/<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/g)].map(m => textOf(parseHtml(m[2]).children)).join('');
  const cjk = [...new Set([...text].filter(c => c > '\x7f'))].sort().join('');
  const links = [`${GOOGLE_FONTS}family=Cinzel:wght@500;700&display=swap`];
  if (cjk) for (const f of LANG.fonts) links.push(`${GOOGLE_FONTS}family=${f}&text=${encodeURIComponent(cjk)}&display=swap`);
  return links.map(h => `<link rel="stylesheet" href="${escAttr(h)}" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="${escAttr(h)}"></noscript>`).join('\n  ');
}
const jsonLd = data => `<script type="application/ld+json">${JSON.stringify(data, null, 1).replace(/</g, '\\u003c')}</script>`;

function buildPage(src, p, ctx) {
  const doc = parseHtml(src, { pos: true });
  const spans = new Map(enSpans(src).map(s => [s.start, s]));
  const c = { ...ctx, path: p, official: officialUrl(p), spans, data: wikiData(src), translated: 0, missing: new Set(), bad: new Set() };
  const toc = find(doc.children, n => hasClass(n, 'wiki-toc'));
  const crumbs = find(doc.children, n => hasClass(n, 'wiki-crumbs'));
  const h1 = find(doc.children, n => n.tag === 'h1');
  const sub = find(doc.children, n => hasClass(n, 'doc-sub'));
  const body = find(doc.children, n => n.tag === 'article');
  if (!h1 || !body) throw new Error(`${p || '(wiki 首頁)'}：找不到 h1 或 article，官方頁面的結構可能改了`);
  const footer = find(doc.children, n => hasClass(n, 'site-footer'));
  const legal = footer ? findAll(footer.children, n => hasClass(n, 'site-credits') || hasClass(n, 'site-legal')) : [];

  const titleHtml = inner(h1, c);
  const subHtml = inner(sub, c);
  const bodyHtml = inner(body, c);
  const missing = c.missing.size; // 「這頁還有幾段沒翻」只算標題和內文；目錄、路徑每頁都一樣，不算
  const enTitle = textOf(find(h1.children, n => attr(n, 'data-in') === 'en')?.children || h1.children);
  const crumbsHtml = inner(crumbs, c);
  const tocHtml = inner(toc, c);
  // 官方頁尾的作者和暴雪版權聲明：照原文保留（有譯文就用譯文）
  const legalHtml = legal.map(n => {
    const f = translate(n, c).nodes;
    return `<p${f ? '' : ' lang="en"'}>${serialize(f || n.children)}</p>`;
  }).join('\n      ');

  const title = textOf(parseHtml(titleHtml).children);
  const description = textOf(parseHtml(subHtml).children) || title;
  const url = new URL(OUT_PATH + (p ? `${p}/` : ''), SITE.base).href;
  const prefix = '../'.repeat(pageDepth(p));
  const wikiHome = relWiki(p, '');
  const breadcrumb = [...parseHtml(crumbsHtml).children].filter(n => n.tag).map(n => ({
    name: textOf(n.children),
    item: n.tag === 'a' ? new URL(attr(n, 'href') || '', url).href : url,
  }));

  const html = `<!doctype html>
<html lang="${LANG.html}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escText(p ? `${title}｜${T.titleSuffix}` : T.titleSuffix)}</title>
  <meta name="description" content="${escAttr(description)}">
  <meta name="color-scheme" content="dark">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="zh-Hant" href="${url}">
  <link rel="alternate" hreflang="en" href="${c.official}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="D2 Survivors Localization">
  <meta property="og:title" content="${escAttr(title)}">
  <meta property="og:description" content="${escAttr(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${new URL(`assets/og-${LANG.path}.jpg`, SITE.base).href}">
  <meta property="og:locale" content="${LANG.og}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml">
  <link rel="icon" href="${prefix}favicon.ico" sizes="48x48">
  <link rel="apple-touch-icon" href="${prefix}apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <!--fonts-->
  <link rel="stylesheet" href="${prefix}style.css">
  <link rel="stylesheet" href="${prefix}wiki.css">
  ${jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': url,
        name: title,
        description,
        url,
        inLanguage: 'zh-Hant',
        isBasedOn: c.official,
        translationOfWork: { '@type': 'WebPage', url: c.official, name: enTitle, inLanguage: 'en' },
        dateModified: ctx.checked,
      },
      ...(breadcrumb.length > 1 ? [{
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumb.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: b.item })),
      }] : []),
    ],
  })}
</head>
<body class="wiki">
  <header class="topbar">
    <div class="wrap topbar-inner wiki-topbar">
      <a class="brand" href="${prefix}">D2S <span>Localization</span></a>
      <nav class="wiki-topnav">
        <a href="${prefix}${LANG.path}/">${T.home}</a>
        <a href="${wikiHome}"${p ? '' : ' aria-current="page"'}>Wiki</a>
        <a href="${escAttr(new URL(OFFICIAL).origin + '/')}" target="_blank" rel="noopener">${T.official} ↗</a>
      </nav>
    </div>
  </header>

  <div class="wrap wiki-layout">
    <aside class="wiki-side">
      <details class="wiki-side-box" id="wiki-side">
        <summary>${T.toc}</summary>
        <nav class="wiki-toc" aria-label="${T.tocLabel}">${tocHtml}</nav>
      </details>
    </aside>
    <main class="wiki-page">
      ${crumbsHtml ? `<nav class="wiki-crumbs" aria-label="${T.crumbs}">${crumbsHtml}</nav>` : ''}
      <p class="wiki-notice" role="note">${T.notice(`〈<a href="${escAttr(c.official)}" target="_blank" rel="noopener" hreflang="en" lang="en">${escText(enTitle)}</a>〉`, `<time class="wiki-checked" datetime="${ctx.checked}">${ctx.checked}</time>`)}${missing ? ` <span class="wiki-missing">${T.untranslated(missing)}</span>` : ''}</p>
      <header class="doc-head">
        <h1>${titleHtml}</h1>
        ${subHtml ? `<p class="doc-sub">${subHtml}</p>` : ''}
      </header>
      <article class="wiki-body">${bodyHtml}</article>
    </main>
  </div>

  <footer class="footer">
    <div class="wrap">
      <p>${I18N[LANG.id]['footer.disclaimer']}</p>
      <p>${T.sourceCredit}</p>
      ${legalHtml}
    </div>
  </footer>
  <!-- 寬螢幕一開始就展開目錄；手機收著（沒有 JS 也是收著，點「目錄」打開） -->
  <script>if (matchMedia('(min-width: 901px)').matches) document.getElementById('wiki-side').open = true;</script>
</body>
</html>
`;
  return { html: html.replace('<!--fonts-->', fontLinks(html)), title, translated: c.translated, missing: c.missing, bodyMissing: missing, bad: c.bad };
}

// ---------- 全部 ----------

function main() {
  const arg = (name, def) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : def; };
  const SRC = arg('--src', 'data/wiki/src');
  const DICT = arg('--dict', 'dict/wiki/zh-TW.json');
  const OUT = arg('--out', path.join('site', OUT_PATH));

  // 頁面清單：pages.json（wiki-fetch 寫的），沒有就掃資料夾
  let list;
  let fetched;
  try {
    const j = JSON.parse(fs.readFileSync(path.join(SRC, 'pages.json'), 'utf8'));
    list = j.pages.map(x => ({ ...x, path: normPath(x.path) }));
    fetched = j.fetched;
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    list = fs.readdirSync(SRC, { recursive: true }).map(f => f.replace(/\\/g, '/')).filter(f => /(^|\/)index\.html$/.test(f))
      .map(f => ({ path: normPath(f) }));
  }
  if (!list.length) throw new Error(`${SRC} 裡沒有官方 wiki 的頁面（先跑 tools/wiki-fetch.mjs）`);
  let dict = {};
  try { dict = JSON.parse(fs.readFileSync(DICT, 'utf8')).strings || {}; } catch (e) { if (e.code !== 'ENOENT') throw e; console.warn(`沒有 ${DICT}，全部顯示英文`); }

  const srcFile = p => path.join(SRC, p, 'index.html');
  const checkedOf = x => String(x.fetched || fetched || new Date(fs.statSync(srcFile(x.path)).mtime).toISOString()).slice(0, 10);
  const pages = new Set(list.map(x => x.path));
  const old = (() => { try { return JSON.parse(fs.readFileSync(path.join(OUT, 'pages.json'), 'utf8')).pages; } catch { return []; } })();
  const oldByPath = Object.fromEntries(old.map(x => [x.path, x]));
  const today = new Date().toISOString().slice(0, 10);
  // 比對內容有沒有變時不看「上次對照」的日期，免得每次重抓都改掉全部頁面的 lastmod
  const comparable = s => s.replace(/<time class="wiki-checked"[^>]*>[^<]*<\/time>/, '').replace(/"dateModified": "[^"]*"/, '');

  const out = [];
  const missing = new Set();
  const bad = new Set();
  let translated = 0;
  for (const x of list.sort((a, b) => a.path.localeCompare(b.path))) {
    const r = buildPage(fs.readFileSync(srcFile(x.path), 'utf8'), x.path, { dict, pages, checked: checkedOf(x) });
    const file = path.join(OUT, x.path, 'index.html');
    let prev = null;
    try { prev = fs.readFileSync(file, 'utf8'); } catch {}
    if (prev !== r.html) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, r.html); }
    const changed = prev === null || comparable(prev) !== comparable(r.html);
    out.push({ path: x.path, title: r.title, lastmod: changed || !oldByPath[x.path] ? today : oldByPath[x.path].lastmod, checked: checkedOf(x), untranslated: r.bodyMissing });
    translated += r.translated;
    r.missing.forEach(k => missing.add(k));
    r.bad.forEach(k => bad.add(k));
  }
  // 官方刪掉的頁面：只刪我們產生的 index.html 和空掉的資料夾
  for (const x of old) {
    if (pages.has(x.path)) continue;
    const file = path.join(OUT, x.path, 'index.html');
    if (fs.existsSync(file)) { fs.rmSync(file); console.log(`刪除 ${file}`); }
    for (let d = path.dirname(file); d.length > OUT.replace(/[\\/]$/, '').length && fs.existsSync(d) && !fs.readdirSync(d).length; d = path.dirname(d)) fs.rmdirSync(d);
  }
  fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify({ schema: 1, official: OFFICIAL, pages: out }, null, 1) + '\n');

  console.log(`wiki：${out.length} 頁 → ${OUT}，翻好 ${translated} 段，沒有譯文 ${missing.size} 條，佔位符對不上 ${bad.size} 條`);
  if (bad.size) console.log(`佔位符對不上（顯示英文）：\n  ${[...bad].slice(0, 20).join('\n  ')}`);
  console.log('記得再跑 node tools/build-site.mjs，sitemap 和繁中首頁的 wiki 入口才會更新');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
