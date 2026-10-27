// 語言頁的互動：桌面版／瀏覽器版切換、書籤按鈕、讀較新的 manifest 更新語言進度和下載按鈕。
// 頁面文字都是 tools/build-site.mjs 產生好的，這裡不換字。

import { SITE, LANGUAGES } from './src/config.mjs';
import { siteState, langGridHtml, heroMetaHtml, downloadBtnHtml } from './src/shared.mjs';

const $ = sel => document.querySelector(sel);
const { lang, t } = JSON.parse($('#page-data').textContent);

const PLATFORMS = ['desktop', 'web'];
// 每個版本的安裝區塊
const INSTALL_SECTION = { desktop: 'install', web: 'web' };
// 頁面一開始由內嵌的小程式決定（網址 ?platform=、#install／#web、上次選的、Windows 與否）
let platform = document.body.dataset.platform;

function showPlatform() {
  document.body.dataset.platform = platform;
  document.querySelectorAll('#platform-switch button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.platform === platform)));
}

function setPlatform(next) {
  if (!PLATFORMS.includes(next) || next === platform) return false;
  platform = next;
  try { localStorage.setItem('d2s-site-platform', platform); } catch {}
  // 網址裡有 ?platform= 時跟著改，不然重新整理又會回到網址指定的那個
  const url = new URL(location.href);
  if (url.searchParams.has('platform')) {
    url.searchParams.set('platform', platform);
    history.replaceState(null, '', url);
  }
  showPlatform();
  return true;
}

// 子分頁，以及安裝區塊裡「看另一個版本」的按鈕（這個會捲到那個版本的安裝區塊）
document.addEventListener('click', e => {
  const btn = e.target.closest('button[data-platform]');
  if (!btn) return;
  const fromHint = !btn.closest('#platform-switch');
  if (setPlatform(btn.dataset.platform) && fromHint) $('#' + INSTALL_SECTION[platform]).scrollIntoView();
});

// 連到 #install／#web 時切到那個版本，不然會連到被藏起來的區塊
addEventListener('hashchange', () => {
  const p = PLATFORMS.find(p => location.hash === '#' + INSTALL_SECTION[p]);
  if (p && setPlatform(p)) $('#' + INSTALL_SECTION[p]).scrollIntoView();
});

// 換語言時記下來，首頁會標出上次選的語言
document.querySelectorAll('.lang-switch a').forEach(a => a.addEventListener('click', () => {
  try { localStorage.setItem('d2s-site-lang', a.dataset.lang); } catch {}
}));

// 書籤按鈕要拖到書籤列；在這裡直接點只顯示提示
$('#bookmarklet').addEventListener('click', e => {
  e.preventDefault();
  const hint = $('#bookmarklet-hint');
  hint.textContent = t['web.pc.drag'];
  hint.classList.add('flash');
});

$('#copy-bookmarklet').addEventListener('click', async () => {
  const status = $('#copy-status');
  try {
    await navigator.clipboard.writeText($('#bookmarklet-code').textContent);
    status.textContent = t['web.copied'];
  } catch {
    status.textContent = t['web.copyfail'];
    getSelection().selectAllChildren($('#bookmarklet-code'));
  }
});

// 頁面裡的數字是建置時的；manifest 比較新的話（翻譯剛發布、網站還沒重新產生）就重畫
async function loadManifest() {
  try {
    const res = await fetch(new URL('../' + SITE.manifestPath, location.href), { cache: 'no-cache' });
    if (!res.ok) return;
    const manifest = await res.json();
    if (manifest.schema !== 2) return;
    const state = siteState(LANGUAGES, SITE, manifest);
    $('#lang-grid').innerHTML = langGridHtml(state, t, lang);
    $('#hero-meta').innerHTML = heroMetaHtml(state, t);
    $('#download-btn').outerHTML = downloadBtnHtml(state, t, SITE.downloadUrl);
  } catch {}
}

showPlatform();
loadManifest();
