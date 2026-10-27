// 產生網站的靜態頁：每種介面語言一頁（site/<path>/index.html）、語言選擇首頁（site/index.html）、sitemap.xml、robots.txt
// 文字在 site/src/i18n.mjs，設定在 site/src/config.mjs。內容直接輸出在 HTML 裡，不靠 JavaScript 換字（搜尋引擎看得到）。
// 有 site/data/manifest.json 就用裡面的語言狀態、條數、版本；沒有就用 config 的數字。網頁開啟後還會再讀一次較新的 manifest。
//
// node tools/build-site.mjs

import fs from 'node:fs';
import path from 'node:path';
import { SITE, LINKS, SITE_LANGS, LANGUAGES } from '../site/src/config.mjs';
import { I18N } from '../site/src/i18n.mjs';
import { esc, fmt, siteState, langGridHtml, heroMetaHtml, downloadBtnHtml, changelogHtml, RUNTIME_KEYS } from '../site/src/shared.mjs';

const ROOT = 'site';
const BASE = SITE.base;
const today = new Date().toISOString().slice(0, 10);

let manifest = null;
try {
  manifest = JSON.parse(fs.readFileSync(path.join(ROOT, SITE.manifestPath), 'utf8'));
  if (manifest.schema !== 2) throw new Error(`schema ${manifest.schema}`);
} catch (e) {
  if (e.code !== 'ENOENT') console.warn(`略過 ${SITE.manifestPath}：${e.message}`);
  manifest = null;
}
const state = siteState(LANGUAGES, SITE, manifest);

// 更新紀錄：沒有這個檔就不顯示（網頁開啟後讀到 manifest 的 changelog 再顯示）
let changelog = [];
try {
  changelog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/changelog.json'), 'utf8')).entries || [];
} catch (e) {
  if (e.code !== 'ENOENT') console.warn(`略過 data/changelog.json：${e.message}`);
}
const discordLink = (t, text) => `<a href="${esc(SITE.discordUrl)}" target="_blank" rel="noopener">${esc(text)}</a>`;
const bookmarklet = `javascript:import('${new URL(SITE.bookmarkletPath, BASE).href}').then(m=>m.default()).catch(e=>alert('D2 Survivors Localization: '+e))`;

const pageUrl = l => (l ? new URL(`${l.path}/`, BASE).href : BASE);
const alternates = () => [
  ...SITE_LANGS.map(l => `<link rel="alternate" hreflang="${l.hreflang}" href="${pageUrl(l)}">`),
  `<link rel="alternate" hreflang="x-default" href="${BASE}">`,
].join('\n  ');
const fontsLink = families => `<link href="https://fonts.googleapis.com/css2?${['Cinzel:wght@500;700', ...families].map(f => 'family=' + f).join('&')}&display=swap" rel="stylesheet">`;
const FAVICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230c0a08'/%3E%3Ctext x='16' y='22' font-family='Georgia,serif' font-size='15' font-weight='700' text-anchor='middle' fill='%23c9a45c'%3ED2%3C/text%3E%3C/svg%3E`;

// <head> 共用部分：SEO、Open Graph、Twitter 卡片
function head({ title, description, url, ogLocale, ogAlt = [], fonts, prefix }) {
  const image = new URL('assets/og.jpg', BASE).href;
  return `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="color-scheme" content="dark">
  <link rel="canonical" href="${url}">
  ${alternates()}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="D2 Survivors Localization">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="${ogLocale}">
  ${ogAlt.map(o => `<meta property="og:locale:alternate" content="${o}">`).join('\n  ')}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${image}">
  <link rel="icon" href="${FAVICON}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ${fontsLink(fonts)}
  <link rel="stylesheet" href="${prefix}style.css">`;
}

const footer = t => `<footer class="footer">
    <div class="wrap">
      ${SITE.discordUrl ? `<p class="footer-community">${discordLink(t, t['community.join'])}</p>` : ''}
      <p>${t['footer.disclaimer']}</p>
      <p class="footer-small"><span data-only="desktop">Game ${esc(state.gameVersion)} · Launcher ${state.launcherReleased ? 'v' + esc(state.launcherVersion) : '—'}</span><span data-only="web">Web · Translations ${esc(state.updated || '')}</span></p>
    </div>
  </footer>`;

// 文字有「key@web」版本時，兩個版本各輸出一份
function perPlatform(t, key, render) {
  const web = t[`${key}@web`];
  return web === undefined ? render(t[key], '') : render(t[key], ' data-only="desktop"') + '\n        ' + render(web, ' data-only="web"');
}

// 版本分頁用：在 JS 執行前先決定顯示哪個版本，避免先閃一下桌面版
const PLATFORM_BOOT = `<script>(function(){var P=['desktop','web'],q=new URLSearchParams(location.search).get('platform'),h={'#install':'desktop','#web':'web'}[location.hash],s;try{s=localStorage.getItem('d2s-site-platform')}catch(e){}document.body.dataset.platform=P.indexOf(q)>=0?q:h||(P.indexOf(s)>=0?s:/Windows/i.test(navigator.userAgent)?'desktop':'web')})()</script>`;

// 文字裡的 {langs}（A、B 或 C）、{langsAnd}（A、B 和 C）：manifest 裡可用和測試中的語言，用這一頁的語言寫。
// 加了新語言重新產生就好，不用改文字
function fillLangs(texts, lang) {
  const names = state.languages.filter(l => l.status === 'available' || l.status === 'beta').map(l => l.name[lang] || l.name.en || l.native);
  const list = type => new Intl.ListFormat(lang, { type }).format(names);
  const fill = v => typeof v === 'string' ? v.replaceAll('{langs}', list('disjunction')).replaceAll('{langsAnd}', list('conjunction'))
    : Array.isArray(v) ? v.map(fill)
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]))
    : v;
  return fill(texts);
}

const langLink = (o, sl) => `<a href="../${o.path}/" hreflang="${o.hreflang}" lang="${o.html}" data-lang="${o.id}"${o === sl ? ' aria-current="page"' : ''}>${esc(o.label)}</a>`;

function langPage(sl) {
  const t = fillLangs(I18N[sl.id], sl.id);
  // 桌面捷徑的範例用這一頁的語言（不是遊戲翻譯語言的就用繁中）
  const exampleLang = state.languages.some(l => l.id === sl.id && l.entries) ? sl.id : 'zh-TW';
  const only = p => (p ? ` data-only="${p}"` : '');
  const runtime = {
    lang: sl.id,
    t: Object.fromEntries(RUNTIME_KEYS.map(k => [k, t[k]])),
    // manifest 讀不到時用建置時的時間判斷要不要顯示「翻譯修正中」
    webChecked: manifest?.game?.web_checked || null,
  };
  const feedbackUrl = SITE.discordUrl || SITE.feedbackUrl;
  const faq = t['faq.items'].filter(([, a]) => SITE.discordUrl || !a.includes('{discord}'));

  return `<!doctype html>
<html lang="${sl.html}">
<head>
  ${head({
    title: t['meta.title'],
    description: t['meta.description'],
    url: pageUrl(sl),
    ogLocale: sl.og,
    ogAlt: SITE_LANGS.filter(o => o !== sl).map(o => o.og),
    fonts: sl.fonts,
    prefix: '../',
  })}
</head>
<body data-platform="desktop">
  ${PLATFORM_BOOT}
  <header class="topbar">
    <!-- 第一層選網站語言（各自一頁），第二層選桌面版／瀏覽器版（同一頁裡切換） -->
    <div class="wrap topbar-inner">
      <a class="brand" href="${BASE}">D2S <span>Localization</span></a>
      <nav class="tabs lang-switch" aria-label="${esc(t['langs.label'])}">
        ${SITE_LANGS.map(o => langLink(o, sl)).join('\n        ')}
      </nav>
      <!-- 窄螢幕放不下所有語言分頁時改用選單（style.css 切換） -->
      <details class="lang-menu lang-switch">
        <summary aria-label="${esc(t['langs.label'])}">${esc(sl.label)}</summary>
        <div class="lang-menu-list">
          ${SITE_LANGS.map(o => langLink(o, sl)).join('\n          ')}
        </div>
      </details>
    </div>
    <div class="wrap subbar-inner">
      <nav class="nav">
        <a href="#download">${esc(t['nav.download'])}</a>
        <a href="#sources">${esc(t['nav.sources'])}</a>
        <a href="#languages">${esc(t['nav.languages'])}</a>
        <a href="#install" data-only="desktop">${esc(t['nav.install'])}</a>
        <a href="#web" data-only="web">${esc(t['nav.install'])}</a>
        <a href="#faq">${esc(t['nav.faq'])}</a>
      </nav>
      <div class="subtabs" id="platform-switch" role="group" aria-label="${esc(t['platform.label'])}">
        ${['desktop', 'web'].map(p => `<button type="button" data-platform="${p}">${esc(t['platform.' + p])}<small>${esc(t[`platform.${p}.sub`])}</small></button>`).join('\n        ')}
      </div>
    </div>
  </header>

  <main id="top">
    <!-- game.web_checked 太舊時由 app.js 顯示（看當下時間，所以不在建置時決定） -->
    <div class="notice" id="stale-notice" role="status" hidden>
      <div class="wrap">${t['notice.stale']}${SITE.discordUrl ? ' ' + fmt(t['notice.discord'], esc(SITE.discordUrl)) : ''}</div>
    </div>

    <section class="hero" id="download">
      <div class="wrap">
        <p class="eyebrow">${esc(t['hero.eyebrow'])}</p>
        <h1>${esc(t['hero.title'])}</h1>
        ${perPlatform(t, 'hero.lead', (s, a) => `<p class="lead"${a}>${esc(s)}</p>`)}
        <div class="cta" data-only="desktop">
          ${downloadBtnHtml(state, t, SITE.downloadUrl)}
          <a class="btn btn-ghost" href="#install">${esc(t['hero.howto'])}</a>
        </div>
        <div class="cta" data-only="web">
          <a class="btn btn-primary" href="#web">${esc(t['hero.bookmark'])}</a>
          <a class="btn btn-ghost" href="${LINKS.d2sPlay}" target="_blank" rel="noopener">${esc(t['hero.play'])}</a>
        </div>
        <div id="hero-meta">
        ${heroMetaHtml(state, t)}
        </div>
        ${SITE.discordUrl ? `<p class="hero-community">${discordLink(t, t['community.join'])}</p>` : ''}
      </div>
    </section>

    <section class="screens">
      <div class="wrap screens-grid">
        <figure>
          <img src="../assets/screen-levelup.webp" width="1239" height="929" loading="lazy" alt="${esc(t['screens.levelup'])}">
          <figcaption>${esc(t['screens.levelup'])}</figcaption>
        </figure>
        <figure>
          <img src="../assets/screen-hud.webp" width="1239" height="929" loading="lazy" alt="${esc(t['screens.hud'])}">
          <figcaption>${esc(t['screens.hud'])}</figcaption>
        </figure>
      </div>
    </section>

    <section class="section" id="sources">
      <div class="wrap">
        <h2>${esc(t['sources.title'])}</h2>
        <p class="section-lead">${esc(t['sources.lead'])}</p>
        <div class="cards">
          ${t['sources.cards'].map(c => `<article class="card">
            <h3>${esc(c.title)}</h3>
            <p class="card-sub">${esc(c.sub)}</p>
            <p>${esc(c.body)}</p>
            <ul class="links">
              ${c.links.map(([label, key, p]) => `<li${only(p)}><a href="${LINKS[key]}" target="_blank" rel="noopener">${esc(label)}<span class="host">${new URL(LINKS[key]).hostname}</span></a></li>`).join('\n              ')}
            </ul>
          </article>`).join('\n          ')}
        </div>
        <p class="source-note">${esc(t['sources.note'])}</p>
      </div>
    </section>

    <section class="section" id="languages">
      <div class="wrap">
        <h2>${esc(t['languages.title'])}</h2>
        <p class="section-lead">${esc(t['languages.lead'])}</p>
        <ul class="lang-grid" id="lang-grid">
          ${langGridHtml(state, t, sl.id)}
        </ul>
      </div>
    </section>

    <section class="section" id="changelog"${changelog.length ? '' : ' hidden'}>
      <div class="wrap narrow">
        <h2>${esc(t['changelog.title'])}</h2>
        <p class="section-lead">${esc(t['changelog.lead'])}</p>
        <ol class="changelog" id="changelog-list">
          ${changelogHtml(changelog, t, sl.id, SITE.changelogCount)}
        </ol>
      </div>
    </section>

    <section class="section" id="install" data-only="desktop">
      <div class="wrap">
        <h2>${esc(t['install.title'])}</h2>
        <p class="section-lead">${esc(t['install.lead'])}</p>
        <p class="switch-hint">${esc(t['switch.toWeb'])} <button type="button" class="link-btn" data-platform="web">${esc(t['switch.toWeb.btn'])}</button></p>
        <ol class="steps">
          ${t['install.steps'].map(([title, body]) => `<li><strong>${esc(title)}</strong><p>${body}</p></li>`).join('\n          ')}
        </ol>
        <div class="cards">
          <article class="card">
            <h3>${esc(t['restore.title'])}</h3>
            <div>${t['restore.body']}</div>
          </article>
          <article class="card">
            <h3>${esc(t['cli.title'])}</h3>
            <p>${esc(t['cli.lead'])}</p>
            <pre><code>d2s-launcher.exe --launch --lang ${exampleLang}</code></pre>
            <dl class="cli-list">
              ${t['cli.items'].map(([flag, desc]) => `<dt><code>${esc(flag)}</code></dt><dd>${esc(desc)}</dd>`).join('\n              ')}
            </dl>
          </article>
        </div>
      </div>
    </section>

    <section class="section" id="web" data-only="web">
      <div class="wrap">
        <h2>${esc(t['web.title'])}</h2>
        <p class="section-lead">${t['web.lead']}</p>
        <p class="switch-hint">${esc(t['switch.toDesktop'])} <button type="button" class="link-btn" data-platform="desktop">${esc(t['switch.toDesktop.btn'])}</button></p>
        <div class="cards">
          <article class="card">
            <h3>${esc(t['web.pc.title'])}</h3>
            <p class="bookmarklet-row">
              <a class="btn btn-primary bookmarklet" id="bookmarklet" href="${esc(bookmarklet)}" draggable="true">${esc(t['web.bookmark.name'])}</a>
              <span class="bookmarklet-hint" id="bookmarklet-hint">${esc(t['web.pc.hint'])}</span>
            </p>
            <ol class="web-steps">
              ${t['web.pc.steps'].map(s => `<li>${s}</li>`).join('\n              ')}
            </ol>
          </article>
          <article class="card">
            <h3>${esc(t['web.mobile.title'])}</h3>
            <p class="bookmarklet-row">
              <button type="button" class="btn btn-ghost" id="copy-bookmarklet">${esc(t['web.copy'])}</button>
              <span class="bookmarklet-hint" id="copy-status" role="status"></span>
            </p>
            <pre class="bookmarklet-code"><code id="bookmarklet-code">${esc(bookmarklet)}</code></pre>
            <ol class="web-steps">
              ${t['web.mobile.steps'].map(s => `<li>${s}</li>`).join('\n              ')}
            </ol>
          </article>
        </div>
        <div class="card web-usage">
          <h3>${esc(t['web.usage.title'])}</h3>
          <ul>
            ${t['web.usage.items'].map(s => `<li>${esc(s)}</li>`).join('\n            ')}
          </ul>
        </div>
      </div>
    </section>

    <section class="section" id="faq">
      <div class="wrap narrow">
        <h2>${esc(t['faq.title'])}</h2>
        <div class="faq">
          ${faq.map(([q, a, p]) => `<details${only(p)}><summary>${esc(q)}</summary><div class="answer">${a
            .replace('{feedback}', feedbackUrl ? fmt(t['faq.feedback'], esc(feedbackUrl)) : t['faq.nofeedback'])
            .replaceAll('{discord}', esc(SITE.discordUrl))}</div></details>`).join('\n          ')}
        </div>
      </div>
    </section>
  </main>

  ${footer(t)}

  <script id="page-data" type="application/json">${JSON.stringify(runtime).replace(/</g, '\\u003c')}</script>
  <script type="module" src="../app.js"></script>
</body>
</html>
`;
}

// 首頁：語言選擇。不自動跳轉（爬蟲才看得到），只依瀏覽器語言標出建議的語言
function rootPage() {
  const en = I18N.en;
  const planned = state.languages.filter(l => !SITE_LANGS.some(s => s.id === l.id));
  const title = `D2 Survivors Localization | ${SITE_LANGS.map(s => s.label).join('・')}`;
  const description = `${en['meta.description']} ${I18N['zh-TW']['meta.description']}`;
  return `<!doctype html>
<html lang="en">
<head>
  ${head({
    title,
    description,
    url: BASE,
    ogLocale: 'en_US',
    ogAlt: SITE_LANGS.filter(s => s.og !== 'en_US').map(s => s.og),
    fonts: SITE_LANGS.flatMap(s => s.fonts),
    prefix: '',
  })}
</head>
<body class="root-page">
  <main>
    <section class="hero">
      <div class="wrap">
        <p class="eyebrow">Unofficial fan translation · <span lang="zh-Hant-TW">非官方玩家翻譯</span></p>
        <h1>D2 Survivors Localization</h1>
        <p class="lead">${esc(en['hero.lead'])}</p>
        <ul class="root-langs" id="root-langs">
          ${SITE_LANGS.map(s => {
            const t = I18N[s.id];
            return `<li lang="${s.html}" data-lang="${s.id}">
            <a class="root-lang" href="${s.path}/" hreflang="${s.hreflang}">
              <span class="root-lang-name">${esc(s.label)}</span>
              <span class="root-lang-title">${esc(t['hero.title'])}</span>
              <span class="root-lang-desc">${esc(t['meta.description'])}</span>
              <span class="root-lang-enter">${esc(t['root.enter'])} →</span>
              <span class="root-suggested" hidden>${esc(t['root.suggested'])}</span>
            </a>
          </li>`;
          }).join('\n          ')}
        </ul>
        <p class="root-planned">${esc(en['languages.title'])}: ${planned.map(l => `<span lang="${esc(l.id)}">${esc(l.native)}</span>`).join(' · ')}</p>
      </div>
    </section>
  </main>

  ${footer(en)}

  <script type="module" src="root.js"></script>
</body>
</html>
`;
}

function sitemap() {
  const links = SITE_LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${pageUrl(l)}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}"/>`).join('\n');
  const urls = [BASE, ...SITE_LANGS.map(pageUrl)].map(loc => `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
${links}
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  console.log(`寫入 ${file}`);
};

for (const sl of SITE_LANGS) {
  if (!I18N[sl.id]) throw new Error(`i18n.mjs 沒有 ${sl.id}`);
  write(path.join(ROOT, sl.path, 'index.html'), langPage(sl));
}
write(path.join(ROOT, 'index.html'), rootPage());
write(path.join(ROOT, 'sitemap.xml'), sitemap());
write(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', BASE).href}\n`);
console.log(manifest ? `manifest：${manifest.version || manifest.updated}` : `沒有 ${SITE.manifestPath}，用 config 的數字`);
