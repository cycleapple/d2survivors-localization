// 官方 wiki 頁面裡要翻的字串（格式見 docs/manifest-v2.md 的「wiki」，wiki-data 的結構見 docs/translation.md 的「wiki」）
// wiki-fetch、wiki-check、wiki-autofill 用；tools/build-wiki.mjs 產生頁面時也可以用 enSpans／fillKey，key 的算法才會一致
//   enSpans(html)        每個 <span data-in="en">（最外層的）：{ start, end, inner, key, tags, context? }；start／end 是整個元素在 html 裡的位置，
//                        技能變體名稱（ul.wiki-mods 的 strong 裡）有 context: 'modifier'
//   lookup(strings, span) 那個 span 的譯文：技能變體名稱先查 modifier:key 再查 key（跟遊戲一樣）
//   htmlKey(inner)       innerHTML → key：標籤照出現順序換成 <0>…</0>、<1/>（屬性不進 key），空白合併成一個、去掉頭尾空白
//   fillKey(text, tags)  譯文 → innerHTML：佔位符換回原本的標籤（tags 是 enSpans／htmlKey 給的，保留 href、class）
//   dataStrings(json)    wiki-data 裡每個 { en, ko } 的 en（顯示給玩家的字，純文字，{n} 這類是官方 JS 填的數字）
//   pageStrings(html)    一頁全部的字串：[{ key, kind }]，kind 是 html／data／meta（<title>、description）／attr（aria-label 等）
const VOID = new Set(['area', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const TAG = /<(\/?)([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g;

// script、style 和註解的內容換成空白（位置不變），裡面的 data-in 不算
function blank(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, m => ' '.repeat(m.length));
}

export function htmlKey(inner) {
  // 開標籤照順序給號，關標籤對回最近一個還沒關的同名開標籤
  const tags = [], open = [];
  let out = '';
  let last = 0;
  for (const m of inner.matchAll(TAG)) {
    out += inner.slice(last, m.index);
    last = m.index + m[0].length;
    const [, close, rawName, self] = m;
    const name = rawName.toLowerCase();
    if (close) {
      for (let i = open.length - 1; i >= 0; i--) {
        if (open[i].name !== name) continue;
        const { n } = open.splice(i, 1)[0];
        tags[n].close = m[0];
        out += `</${n}>`;
        break;
      }
      continue;
    }
    const n = tags.length;
    tags.push({ open: m[0], name });
    if (self || VOID.has(name)) out += `<${n}/>`;
    else { open.push({ name, n }); out += `<${n}>`; }
  }
  out += inner.slice(last);
  return { key: out.replace(/\s+/g, ' ').trim(), tags };
}

export function enSpans(html) {
  const src = blank(html);
  const spans = [];
  const start = /<span\b[^>]*\sdata-in="en"[^>]*>/g;
  for (let m; (m = start.exec(src));) {
    // 找對應的 </span>（中間的 span 要算深度）
    const tag = /<(\/?)span\b[^>]*>/gi;
    tag.lastIndex = m.index + m[0].length;
    let depth = 1, t;
    while (depth && (t = tag.exec(src))) depth += t[1] ? -1 : 1;
    if (depth) throw new Error(`data-in="en" 的 span 沒有結尾（位置 ${m.index}）`);
    const innerStart = m.index + m[0].length, end = t.index + t[0].length;
    const inner = html.slice(innerStart, t.index);
    spans.push({ start: m.index, end, open: m[0], inner, ...htmlKey(inner), ...(isModifierName(src, m.index) && { context: 'modifier' }) });
    start.lastIndex = end; // 裡面如果還有 data-in="en"，算在外層這條裡
  }
  return spans;
}

// 技能變體的名稱：<ul class="wiki-mods"><li><strong><span data-in="en">名稱</span>。跟別的技能同名的變體，遊戲用 modifier:名稱 的專用譯名
function isModifierName(src, at) {
  const ul = src.lastIndexOf('<ul class="wiki-mods"', at);
  return ul >= 0 && src.lastIndexOf('</ul>', at) < ul && /<strong>\s*$/.test(src.slice(Math.max(0, at - 40), at));
}

// 一個 span 的譯文：技能變體名稱先查 modifier:key（跟遊戲一樣），再查 key；沒有譯文是 undefined
export function lookup(strings, span) {
  return (span.context === 'modifier' && strings[`modifier:${span.key}`]) || strings[span.key];
}

export function fillKey(text, tags) {
  return text.replace(/<(\/?)(\d+)(\/?)>/g, (m, close, n, self) => {
    const t = tags[n];
    if (!t) throw new Error(`譯文的佔位符 ${m} 在原文裡沒有`);
    return close ? t.close ?? '' : t.open;
  });
}

export function dataStrings(json) {
  const out = [];
  const walk = o => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== 'object') return;
    if (typeof o.en === 'string') { out.push(o.en.replace(/\s+/g, ' ').trim()); return; }
    Object.values(o).forEach(walk);
  };
  walk(json);
  return out;
}

export function wikiData(html) {
  const m = html.match(/<script\b[^>]*\bid="wiki-data"[^>]*>([\s\S]*?)<\/script>/);
  return m ? JSON.parse(m[1]) : null;
}

const decode = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

export function pageStrings(html) {
  const out = enSpans(html).map(s => ({ key: s.key, kind: 'html' }));
  const data = wikiData(html);
  if (data) out.push(...dataStrings(data).map(key => ({ key, kind: 'data' })));
  // <title> 的「頁名 · Wiki · D2 Survivors」只取頁名；description 只有英文
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (title) out.push({ key: decode(title.split(' · ')[0]).trim(), kind: 'meta' });
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (desc) out.push({ key: decode(desc).trim(), kind: 'meta' });
  const body = blank(html.slice(html.search(/<body\b/i) >>> 0));
  for (const [, , v] of body.matchAll(/\s(aria-label|placeholder|title)="([^"]*)"/g)) {
    const key = decode(v).trim();
    if (/[A-Za-z]/.test(key) && !/[가-힣]/.test(key)) out.push({ key, kind: 'attr' });
  }
  return out.filter(s => s.key);
}
