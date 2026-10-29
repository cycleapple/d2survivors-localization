// 語言頁的互動：桌面版／瀏覽器版切換、書籤按鈕、讀較新的 manifest 更新語言進度和下載按鈕。
// 頁面文字都是 tools/build-site.mjs 產生好的，這裡不換字。

import { SITE, LANGUAGES } from './src/config.mjs';
import { siteState, langGridHtml, heroMetaHtml, downloadBtnHtml, changelogHtml, gameUpdateApi } from './src/shared.mjs';

const $ = sel => document.querySelector(sel);
const { lang, t } = JSON.parse($('#page-data').textContent);

const PLATFORMS = ['desktop', 'web'];
// 每個版本的安裝區塊
const INSTALL_SECTION = { desktop: 'install', web: 'web' };
// 頁面一開始由內嵌的小程式決定（網址 ?platform=、#install／#web、上次選的、Windows 與否）
let platform = document.body.dataset.platform;

function showPlatform() {
  document.body.dataset.platform = platform;
  document.querySelectorAll('#platform-switch button, .pick').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.platform === platform)));
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

// 標題列的子分頁、首屏的版本卡片，以及安裝區塊開頭的版本卡片（這個會捲到另一個版本的安裝區塊）
document.addEventListener('click', e => {
  const btn = e.target.closest('button[data-platform]');
  if (!btn) return;
  const inSection = btn.closest('.section');
  if (setPlatform(btn.dataset.platform) && inSection) $('#' + INSTALL_SECTION[platform]).scrollIntoView();
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

// 手機書籤教學：iPhone／Android 分頁，預設照裝置（Android 用 Android，其他用 iPhone）
document.querySelectorAll('.guide').forEach(guide => {
  const show = os => {
    guide.dataset.os = os;
    guide.querySelectorAll('.os-tabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.os === os)));
  };
  show(/Android/i.test(navigator.userAgent) ? 'android' : 'ios');
  guide.querySelector('.os-tabs').addEventListener('click', e => {
    const b = e.target.closest('button[data-os]');
    if (b) show(b.dataset.os);
  });
});

// 截圖捲到附近（上下 200px 內）才開始下載，而且等頁面載完才開始看，不跟首屏搶網路；
// 藏起來的那個版本的一排等切換過去、看得到時才載
const shotObserver = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.querySelectorAll('img[data-src]').forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
    shotObserver.unobserve(e.target);
  }
}, { rootMargin: '200px 0px' });
const watchShots = () => document.querySelectorAll('.shots').forEach(row => shotObserver.observe(row));
if (document.readyState === 'complete') watchShots(); else addEventListener('load', watchShots, { once: true });

// 截圖、手機書籤教學的一排放不下時加上一張／下一張按鈕（換版本、改視窗大小時重新判斷）
const screens = $('.screens');
document.querySelectorAll('.shots, .guide-steps').forEach(row => {
  const nav = document.createElement('div');
  nav.className = 'shots-nav';
  if (row.dataset.only) nav.dataset.only = row.dataset.only;
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
  const prev = button('‹', row.dataset.prev || screens?.dataset.prev || '', () => go(current() - 1));
  const next = button('›', row.dataset.next || screens?.dataset.next || '', () => go(current() + 1));
  // 手機書籤教學：中間放第幾步的圓點（目前那顆是金色），點了跳到那一步
  const dots = row.matches('.guide-steps') ? figs.map((_, i) => button('', String(i + 1), () => go(i))) : [];
  nav.append(prev);
  if (dots.length) {
    const box = document.createElement('div');
    box.className = 'shots-dots';
    box.append(...dots);
    nav.append(box);
  }
  nav.append(next);
  const update = () => {
    const max = row.scrollWidth - row.clientWidth;
    nav.hidden = max <= 1;
    prev.disabled = row.scrollLeft <= 1;
    next.disabled = row.scrollLeft >= max - 1;
    const cur = dots.length ? current() : -1;
    dots.forEach((d, i) => (i === cur ? d.setAttribute('aria-current', 'step') : d.removeAttribute('aria-current')));
    // 一次一張時，高度跟著目前這一步（不然整排都是最高那一步的高度，短的步驟下面會空一大塊）
    if (dots.length) row.style.height = nav.hidden ? '' : `${figs[cur].offsetHeight + 12}px`;
  };
  row.after(nav);
  row.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(row);
  update();
});

// 「遊戲剛更新，翻譯修正中」：GitHub 上有開著的 game-update issue 才顯示（每小時的 web-check 失敗時開，修好後手動關）。
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

showPlatform();
loadManifest();
checkGameUpdate();
