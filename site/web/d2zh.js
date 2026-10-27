// D2 Survivors 繁體中文（網頁版書籤）
// 書籤：javascript:import('<這個檔案的網址>').then(m=>m.default()).catch(e=>alert(e))
//
// 做法：跟桌面版一樣用遊戲內建的翻譯系統，只是改在瀏覽器裡做。
// 1. 抓下遊戲頁面和所有模組，套用 rules.json 的修改（多一個語言 zh、點陣字型認得中文、中文斷行…）
// 2. 修改過的模組做成 blob 網址，用 import map 換掉原本的模組
// 3. 停掉頁面上正在跑的原版，換成一個同網域的 iframe，在裡面重新開一次修改版
// 任何一步失敗都在第 3 步之前，原版遊戲不受影響。
// 再按一次書籤＝中英切換。重新整理頁面就回到原版。

import { loadGame, applyRules, relink, bootHtml } from './core.js';

const HERE = new URL('.', import.meta.url);
const LANG_KEY = 'd2s:lang';
const GAME_HOSTS = ['d2survivors.lol', 'www.d2survivors.lol'];

export default function run() {
  if (window.__d2zh) return window.__d2zh.toggle();
  return start().catch(e => {
    hideStatus();
    console.error(e);
    alert(`D2 繁體中文載入失敗：${e.message || e}`);
  });
}

async function start() {
  if (!GAME_HOSTS.includes(location.hostname) || !document.getElementById('d2-files')) {
    alert('請先打開 D2 Survivors 的遊戲頁面（https://d2survivors.lol/play/），再按這個書籤。');
    return;
  }
  showStatus('正在載入繁體中文…');

  const get = async url => {
    const res = await fetch(url, { cache: url.startsWith(location.origin) ? 'default' : 'no-cache' });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.text();
  };
  const playUrl = new URL(location.pathname.replace(/[^/]*$/, ''), location.origin).href;
  const meta = JSON.parse(await get(new URL('rules.json', HERE).href));
  const [game, dict] = await Promise.all([
    loadGame(playUrl, get),
    get(new URL(`zh-TW.json?v=${meta.dictHash}`, HERE).href),
  ]);

  const blob = (src, type = 'text/javascript') => URL.createObjectURL(new Blob([src], { type }));
  const zhDict = blob(`export default ${dict};`);
  const failed = applyRules(game.modules, meta.rules, { zh_dict: zhDict });
  const fatal = failed.filter(r => !r.optional);
  if (failed.length) console.warn('[D2 繁體中文] 沒套上的修改：', failed.map(r => `${r.label}（${r.found}）`));
  if (fatal.length) {
    throw new Error(`遊戲改版了，中文化需要更新（${fatal.map(r => r.label).join('、')}）`);
  }

  const imports = {};
  for (const [url, src] of game.modules) imports[url] = blob(relink(url, src));
  const html = bootHtml(game.html, playUrl, game.entry, { imports });

  await stopPage();
  try { localStorage.setItem(LANG_KEY, 'zh'); } catch { /* 存不了就只有這次是中文 */ }
  openShell(html);
}

// 停掉原版：關掉它的聲音、畫面更新、計時器、WebGL
async function stopPage() {
  // 遊戲用 Web Lock 防止開兩個分頁，要等 pagehide（persisted）才放掉；遊戲也會在 pagehide 時存檔
  try { window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })); } catch { /* 舊瀏覽器 */ }
  // AudioContext 沒辦法從外面找到：攔截 state、currentTime 一小段時間，遊戲讀到的那個就是。
  // 遊戲每次按鍵都會檢查 state（被瀏覽器暫停就恢復），所以送一個沒有作用的按鍵（F24）讓它讀一次
  const contexts = new Set();
  const proto = window.BaseAudioContext?.prototype;
  const hooked = ['state', 'currentTime'].map(name => [name, proto && Object.getOwnPropertyDescriptor(proto, name)]).filter(([, d]) => d?.get);
  for (const [name, d] of hooked) Object.defineProperty(proto, name, { ...d, get() { contexts.add(this); return d.get.call(this); } });
  for (const type of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(type, { key: 'F24', code: 'F24', bubbles: true }));
  await new Promise(r => setTimeout(r, 300));
  for (const [name, d] of hooked) Object.defineProperty(proto, name, d);
  // 背景音樂是接進 AudioContext 的 <audio>，關掉 AudioContext 就一起沒聲音了
  for (const c of contexts) c.close().catch(() => {});

  // 原版可能還在載入（await 到一半）：之後的網路請求都不回應，讓它停在那裡
  window.fetch = () => new Promise(() => {});
  window.requestAnimationFrame = () => 0;
  const last = setTimeout(() => {});
  for (let i = 0; i <= last; i++) { clearTimeout(i); clearInterval(i); }
  for (const c of document.querySelectorAll('canvas')) {
    try { (c.getContext('webgl2') || c.getContext('webgl'))?.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* 2D canvas */ }
  }
}

// 外層頁面只剩一個滿版的 iframe；document.open 會清掉原版的 DOM 和 window 上的事件
function openShell(html) {
  const title = document.title;
  document.open();
  document.write(`<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title></title>
<style>
html,body{margin:0;height:100%;background:#000;overflow:hidden}
iframe{display:block;border:0;width:100%;height:100%}
body>:not(iframe):not(#d2zh-toast){display:none!important}
#d2zh-toast{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:1;padding:8px 14px;border:1px solid #6b5326;border-radius:6px;
background:rgba(12,10,8,.92);color:#e8dfcc;font:14px/1.4 "Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif;pointer-events:none;transition:opacity .4s}
</style></head><body></body></html>`);
  document.close();
  document.title = title;
  // 原版還在跑的程式可能再往頁面加東西（載入失敗的畫面…）：一律移掉
  new MutationObserver(() => {
    for (const el of [...document.body.children]) if (el.tagName !== 'IFRAME' && el.id !== 'd2zh-toast') el.remove();
  }).observe(document.body, { childList: true });

  let frame = null;
  let boots = [];
  const boot = () => {
    // 修改版自己一直重新載入（例如 Service Worker 沒接手）就停下來，不要無限迴圈
    const now = Date.now();
    boots = boots.filter(t => now - t < 15000).concat(now);
    if (boots.length > 3) { toast('中文化一直重新載入，已停止。請重新整理頁面。', 0); return; }
    const old = frame;
    const next = frame = document.createElement('iframe');
    next.title = title;
    next.allow = 'fullscreen; gamepad; autoplay; clipboard-read; clipboard-write; screen-wake-lock';
    next.allowFullscreen = true;
    // 先載入一個同網域、不會跑遊戲的頁面：這樣 iframe 才歸遊戲的 Service Worker 管
    // （用自己的 D2 檔案時，遊戲靠它讀檔），再把修改版寫進去
    next.src = new URL('/robots.txt', location.origin).href;
    next.addEventListener('load', () => {
      let doc = null;
      try { doc = next.contentDocument; } catch { /* 不同網域 */ }
      if (!doc) { toast('中文化載入失敗：框架打不開。請重新整理頁面。', 0); return; }
      doc.open();
      doc.write(html);
      doc.close();
      // 之後 iframe 自己換頁（遊戲的「重新載入」、改用自己的檔案…）會載入原版：回到遊戲頁面時再換成修改版
      next.addEventListener('load', () => {
        let d = null;
        try { d = next.contentDocument; } catch { /* 不同網域 */ }
        if (next === frame && d && !d.querySelector('meta[name="d2zh"]') && d.getElementById('d2-files')) boot();
      });
      next.focus();
    }, { once: true });
    if (old) {
      // 遊戲在 pagehide 時存檔、放掉防止開兩個分頁的鎖
      try { old.contentWindow.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })); } catch { /* 已經關掉 */ }
      old.replaceWith(next);
    } else {
      document.body.append(next);
    }
  };

  window.__d2zh = {
    reboot: boot,
    toggle() {
      const lang = frame?.contentWindow?.__d2zhLang;
      let current = null;
      try { current = lang ? lang.get() : localStorage.getItem(LANG_KEY); } catch { /* 讀不到當成英文 */ }
      const next = current === 'zh' ? 'en' : 'zh';
      toast(next === 'zh' ? '切換成繁體中文' : 'Switching to English');
      if (lang) return lang.set(next);
      try { localStorage.setItem(LANG_KEY, next); } catch { /* 只有這次 */ }
      boot();
    },
  };
  boot();
  toast('繁體中文已開啟。再按一次書籤可以切換中英文。');
}

let statusEl = null;
function showStatus(text) {
  statusEl ??= Object.assign(document.createElement('div'), { id: 'd2zh-status' });
  statusEl.textContent = text;
  statusEl.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483647;padding:8px 14px;border:1px solid #6b5326;border-radius:6px;background:rgba(12,10,8,.92);color:#e8dfcc;font:14px/1.4 "Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
  document.body.append(statusEl);
}
function hideStatus() { statusEl?.remove(); }

function toast(text, ms = 3500) {
  let el = document.getElementById('d2zh-toast');
  if (!el) { el = Object.assign(document.createElement('div'), { id: 'd2zh-toast' }); document.body.append(el); }
  el.textContent = text;
  el.style.opacity = '1';
  clearTimeout(toast.timer);
  if (ms) toast.timer = setTimeout(() => { el.style.opacity = '0'; }, ms);
}
