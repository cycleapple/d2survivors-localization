// 語言頁的互動：截圖輪播、讀較新的 manifest 更新語言進度和下載按鈕、「遊戲剛更新」提示。
// 頁面文字都是 tools/build-site.mjs 產生好的，這裡不換字。

import { SITE, LANGUAGES } from './src/config.mjs';
import { siteState, langGridHtml, heroMetaHtml, downloadBtnHtml, changelogHtml, gameUpdateApi } from './src/shared.mjs';

const $ = sel => document.querySelector(sel);
const { lang, t } = JSON.parse($('#page-data').textContent);

// 換語言時記下來，首頁會標出上次選的語言
document.querySelectorAll('.lang-switch a').forEach(a => a.addEventListener('click', () => {
  try { localStorage.setItem('d2s-site-lang', a.dataset.lang); } catch {}
}));

// 截圖捲到附近（上下 200px 內）才開始下載，而且等頁面載完才開始看，不跟首屏搶網路
const shotObserver = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.querySelectorAll('img[data-src]').forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
    shotObserver.unobserve(e.target);
  }
}, { rootMargin: '200px 0px' });
const watchShots = () => document.querySelectorAll('.shots').forEach(row => shotObserver.observe(row));
if (document.readyState === 'complete') watchShots(); else addEventListener('load', watchShots, { once: true });

// 截圖的一排放不下時加上一張／下一張按鈕（改視窗大小時重新判斷）
const screens = $('.screens');
document.querySelectorAll('.shots').forEach(row => {
  const nav = document.createElement('div');
  nav.className = 'shots-nav';
  // 捲到目前最近那張的前一張／下一張（用位置算，不用相對距離，連按也不會停在兩張中間）
  const figs = [...row.children];
  const positions = () => figs.map(f => f.offsetLeft - figs[0].offsetLeft);
  const current = () => {
    const pos = positions();
    return pos.reduce((best, p, i) => (Math.abs(p - row.scrollLeft) < Math.abs(pos[best] - row.scrollLeft) ? i : best), 0);
  };
  const go = i => row.scrollTo({ left: positions()[Math.max(0, Math.min(figs.length - 1, i))], behavior: 'smooth' });
  const button = (text, label, onClick) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', onClick);
    return b;
  };
  const prev = button('‹', screens?.dataset.prev || '', () => go(current() - 1));
  const next = button('›', screens?.dataset.next || '', () => go(current() + 1));
  nav.append(prev, next);
  const update = () => {
    const max = row.scrollWidth - row.clientWidth;
    nav.hidden = max <= 1;
    prev.disabled = row.scrollLeft <= 1;
    next.disabled = row.scrollLeft >= max - 1;
  };
  row.after(nav);
  row.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(row);
  update();
});

// 「遊戲剛更新，翻譯修正中」：GitHub 上有開著的 game-update issue 才顯示（檢查遊戲新版本的 workflow 失敗時開，修好後手動關）。
// 讀不到（限流、離線、錯誤）一律不顯示，寧可漏掉也不誤報。結果在 sessionStorage 記 10 分鐘，換頁不重查
const GAME_UPDATE_CACHE = 'd2s-site-game-update';
async function checkGameUpdate() {
  let open = null;
  try {
    const cached = JSON.parse(sessionStorage.getItem(GAME_UPDATE_CACHE));
    if (cached && Date.now() - cached.at < 10 * 60e3) open = cached.open;
  } catch {}
  if (open === null) {
    try {
      const res = await fetch(gameUpdateApi(SITE), { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) return;
      const issues = await res.json();
      if (!Array.isArray(issues)) return;
      open = issues.length > 0;
      try { sessionStorage.setItem(GAME_UPDATE_CACHE, JSON.stringify({ at: Date.now(), open })); } catch {}
    } catch {
      return;
    }
  }
  $('#stale-notice').hidden = !open;
}

// 頁面裡的數字是建置時的；manifest 比較新的話（翻譯剛發布、網站還沒重新產生）就重畫
async function loadManifest() {
  try {
    const manifestUrl = new URL('../' + SITE.manifestPath, location.href);
    const res = await fetch(manifestUrl, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    const manifest = await res.json();
    if (manifest.schema !== 2) throw new Error(`schema ${manifest.schema}`);
    const state = siteState(LANGUAGES, SITE, manifest);
    $('#lang-grid').innerHTML = langGridHtml(state, t, lang);
    $('#hero-meta').innerHTML = heroMetaHtml(state, t);
    $('#download-btn').outerHTML = downloadBtnHtml(state, t, SITE.downloadUrl);
    if (manifest.changelog?.url) loadChangelog(new URL(manifest.changelog.url, manifestUrl));
  } catch {}
}

async function loadChangelog(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const entries = (await res.json()).entries || [];
    if (!entries.length) return;
    $('#changelog-list').innerHTML = changelogHtml(entries, t, lang, SITE.changelogCount);
    $('#changelog').hidden = false;
  } catch {}
}

loadManifest();
checkGameUpdate();
