// 產生網站的靜態頁：每種介面語言一頁（site/<path>/index.html）、語言選擇首頁（site/index.html）、sitemap.xml、robots.txt
// 文字在 site/src/i18n.mjs，設定在 site/src/config.mjs。內容直接輸出在 HTML 裡，不靠 JavaScript 換字（搜尋引擎看得到）。
// 有 site/data/manifest.json 就用裡面的語言狀態、條數、版本；沒有就用 config 的數字。網頁開啟後還會再讀一次較新的 manifest。
//
// node tools/build-site.mjs           產生頁面（GitHub Actions 部署時也跑這個）
// node tools/build-site.mjs --og      另外用 ImageMagick 重做各語言分享圖和 favicon（本機，改了標題或副標時）
// node tools/build-site.mjs --check   另外把每頁的 SEO 摘要和問題寫到 work/site/seo-check.txt

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

// 站長平台驗證：config 有填才輸出
const VERIFY_META = { google: 'google-site-verification', bing: 'msvalidate.01', baidu: 'baidu-site-verification' };
const verifyMeta = () => Object.entries(VERIFY_META).filter(([k]) => SITE.verify?.[k])
  .map(([k, name]) => `<meta name="${name}" content="${esc(SITE.verify[k])}">`).join('\n  ');

// 分享圖：各語言的 assets/og-<path>.jpg（node tools/build-site.mjs --og 產生），沒有就用共用的 og.jpg
const ogImage = sl => {
  const file = sl && `assets/og-${sl.path}.jpg`;
  return new URL(file && fs.existsSync(path.join(ROOT, file)) ? file : 'assets/og.jpg', BASE).href;
};

// JSON-LD：放進 <script type="application/ld+json">，避免內容裡的 </script> 斷掉
const jsonLd = data => `<script type="application/ld+json">${JSON.stringify(data, null, 1).replace(/</g, '\\u003c')}</script>`;

// <head> 共用部分：SEO、Open Graph、Twitter 卡片、favicon、結構化資料
function head({ title, description, url, ogLocale, ogAlt = [], fonts, prefix, image, imageAlt, ld }) {
  return `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="color-scheme" content="dark">
  ${verifyMeta()}
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
  <meta property="og:image:alt" content="${esc(imageAlt)}">
  <meta property="og:locale" content="${ogLocale}">
  ${ogAlt.map(o => `<meta property="og:locale:alternate" content="${o}">`).join('\n  ')}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${image}">
  <meta name="twitter:image:alt" content="${esc(imageAlt)}">
  <link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml">
  <link rel="icon" href="${prefix}favicon.ico" sizes="48x48">
  <link rel="apple-touch-icon" href="${prefix}apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ${fontsLink(fonts)}
  <link rel="stylesheet" href="${prefix}style.css">
  ${jsonLd(ld)}`;
}

// 遊戲翻譯目前可以選的語言（manifest 的 available／beta）
const translatedLangs = () => state.languages.filter(l => l.status === 'available' || l.status === 'beta').map(l => l.id);

// 語言頁的結構化資料：桌面版啟動器（SoftwareApplication）、瀏覽器版書籤（WebApplication）、常見問題（FAQPage）。
// 不寫 author／publisher（不是暴雪、也不是遊戲作者的產品）
function langPageLd(sl, t, url, image, faq) {
  const offers = { '@type': 'Offer', price: '0', priceCurrency: 'USD' };
  // FAQPage 只放兩個版本都看得到的題目，答案用頁面上的同一段文字（Google 允許的標籤以外的拿掉）
  const answer = a => a.replace(/<\/?(code|kbd)>/g, '');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': url + '#launcher',
        name: t['hero.title'],
        alternateName: t['seo.alternateNames'],
        description: t['meta.description'],
        url: url + '#install',
        image,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Windows',
        inLanguage: translatedLangs(),
        isAccessibleForFree: true,
        offers,
        ...(state.launcherReleased ? { downloadUrl: SITE.downloadUrl, softwareVersion: state.launcherVersion } : {}),
      },
      {
        '@type': 'WebApplication',
        '@id': url + '#bookmark',
        name: `${t['hero.title']} – ${t['platform.web']}`,
        description: t['web.title'],
        url: url + '#web',
        applicationCategory: 'GameApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Chrome, Edge, Firefox, Safari',
        inLanguage: translatedLangs(),
        isAccessibleForFree: true,
        offers,
      },
      {
        '@type': 'FAQPage',
        '@id': url + '#faq',
        inLanguage: sl.hreflang,
        mainEntity: faq.filter(([, , only]) => !only).map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: answer(a) },
        })),
      },
    ],
  };
}

const footer = t => `<footer class="footer">
    <div class="wrap">
      ${SITE.discordUrl || SITE.donateUrl ? `<p class="footer-community">${[
        SITE.discordUrl && discordLink(t, t['community.join']),
        SITE.donateUrl && `<a href="${esc(SITE.donateUrl)}" target="_blank" rel="noopener">${esc(t['donate.short'])}</a>`,
      ].filter(Boolean).join('<span class="sep" aria-hidden="true">·</span>')}</p>` : ''}
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

const langLink = (o, sl, prefix = '../') => `<a href="${prefix}${o.path}/" hreflang="${o.hreflang}" lang="${o.html}" data-lang="${o.id}"${o === sl ? ' aria-current="page"' : ''}>${esc(o.label)}</a>`;

// 窄螢幕放不下語言分頁時，在頁面最上面把所有語言一次列出（各用自己的語言寫，可以折行）。寬螢幕藏起來
const langStrip = (sl, label, prefix) => `<nav class="lang-strip lang-switch" aria-label="${esc(label)}">
    <span class="globe" aria-hidden="true">🌐</span>
    ${SITE_LANGS.map(o => langLink(o, sl, prefix)).join('\n    ')}
  </nav>`;

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
  // 常見問題：頁面和 FAQPage 結構化資料用同一份文字
  const faq = t['faq.items']
    .filter(([, a]) => SITE.discordUrl || !a.includes('{discord}'))
    .map(([q, a, p]) => [q, a
      .replace('{feedback}', feedbackUrl ? fmt(t['faq.feedback'], esc(feedbackUrl)) : t['faq.nofeedback'])
      .replaceAll('{discord}', esc(SITE.discordUrl)), p]);
  const url = pageUrl(sl);
  const image = ogImage(sl);

  return `<!doctype html>
<html lang="${sl.html}">
<head>
  ${head({
    title: t['meta.title'],
    description: t['meta.description'],
    url,
    ogLocale: sl.og,
    ogAlt: SITE_LANGS.filter(o => o !== sl).map(o => o.og),
    fonts: sl.fonts,
    prefix: '../',
    image,
    imageAlt: t['og.alt'],
    ld: langPageLd(sl, t, url, image, faq),
  })}
</head>
<body data-platform="desktop">
  ${PLATFORM_BOOT}
  ${langStrip(sl, t['langs.label'], '../')}
  <header class="topbar">
    <!-- 第一層選網站語言（各自一頁），第二層選桌面版／瀏覽器版（同一頁裡切換） -->
    <div class="wrap topbar-inner">
      <a class="brand" href="${BASE}">D2S <span>Localization</span></a>
      <nav class="tabs lang-switch" aria-label="${esc(t['langs.label'])}">
        <span class="globe" aria-hidden="true">🌐</span>
        ${SITE_LANGS.map(o => langLink(o, sl)).join('\n        ')}
      </nav>
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
          ${faq.map(([q, a, p]) => `<details${only(p)}><summary>${esc(q)}</summary><div class="answer">${a}</div></details>`).join('\n          ')}
        </div>
        ${SITE.donateUrl ? `<!-- 贊助：低調放在常見問題後面，不跳視窗 -->
        <aside class="support" id="support">
          <h3>${esc(t['donate.title'])}</h3>
          <p>${esc(t['donate.body'])}</p>
          <p><a class="btn btn-ghost btn-small" href="${esc(SITE.donateUrl)}" target="_blank" rel="noopener">${esc(t['donate.button'])}</a></p>
          <p class="support-note">${esc(t['donate.statement'])}</p>
        </aside>` : ''}
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
  // 首頁是 x-default，用英文；各語言的標題和說明在下面的卡片裡
  const title = 'Diablo 2 Survivors Translations | D2 Survivors Localization';
  const description = `Unofficial translations of the game itself for Diablo 2 Survivors (D2 Survivors). Pick your language: ${SITE_LANGS.map(s => s.label).join(', ')}.`;
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
    image: ogImage(null),
    imageAlt: en['og.alt'],
    ld: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': BASE + '#website',
      name: 'D2 Survivors Localization',
      alternateName: SITE_LANGS.map(s => I18N[s.id]['hero.title']),
      description,
      url: BASE,
      inLanguage: SITE_LANGS.map(s => s.hreflang),
      hasPart: SITE_LANGS.map(s => ({ '@type': 'WebPage', name: I18N[s.id]['meta.title'], url: pageUrl(s), inLanguage: s.hreflang })),
    },
  })}
</head>
<body class="root-page">
  ${langStrip(null, 'Language', '')}
  <main>
    <section class="hero">
      <div class="wrap">
        <p class="eyebrow root-eyebrow"><span aria-hidden="true">🌐</span> ${SITE_LANGS.map(s => `<span lang="${s.html}">${esc(s.label)}</span>`).join(' · ')}</p>
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

// lastmod：頁面內容跟上次產生的一樣就沿用舊的日期（從現有的 sitemap.xml 讀），有變才寫今天
const oldLastmod = (() => {
  try {
    const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
    return Object.fromEntries([...xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map(m => [m[1], m[2]]));
  } catch { return {}; }
})();

function sitemap(lastmod) {
  const links = SITE_LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${pageUrl(l)}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}"/>`).join('\n');
  const urls = [BASE, ...SITE_LANGS.map(pageUrl)].map(loc => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod[loc]}</lastmod>
${links}
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

// 寫入，回傳內容有沒有變
const write = (file, text) => {
  let old = null;
  try { old = fs.readFileSync(file, 'utf8'); } catch {}
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  console.log(`${old === text ? '沒變' : '寫入'} ${file}`);
  return old !== text;
};

// 分享圖要在產生頁面之前，頁面才會指到各語言的圖
if (process.argv.includes('--og')) makeImages();

const lastmod = {};
const page = (url, file, html) => {
  lastmod[url] = write(file, html) || !oldLastmod[url] ? today : oldLastmod[url];
};
for (const sl of SITE_LANGS) {
  if (!I18N[sl.id]) throw new Error(`i18n.mjs 沒有 ${sl.id}`);
  page(pageUrl(sl), path.join(ROOT, sl.path, 'index.html'), langPage(sl));
}
page(BASE, path.join(ROOT, 'index.html'), rootPage());
write(path.join(ROOT, 'sitemap.xml'), sitemap(lastmod));
write(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', BASE).href}\n`);
console.log(manifest ? `manifest：${manifest.version || manifest.updated}` : `沒有 ${SITE.manifestPath}，用 config 的數字`);

if (process.argv.includes('--check')) seoCheck();

// --og：用 ImageMagick 產生各語言的分享圖、favicon（只在本機跑，產生的圖 commit 進 repo；CI 不需要）。
// 背景是升級卡片截圖，下面一條暗色帶放該語言的標題和副標。字型用 Windows 內建的
function makeImages() {
  const { execFileSync } = process.getBuiltinModule('node:child_process');
  const magick = (...args) => execFileSync('magick', args, { stdio: 'inherit' });
  const FONTS = 'C:/Windows/Fonts/';
  const font = { 'zh-TW': 'msjhbd.ttc', 'zh-CN': 'msyhbd.ttc', ja: 'YuGothB.ttc' };
  const assets = path.join(ROOT, 'assets');
  const og = (out, title, subtitle, fontFile) => magick(
    path.join(assets, 'screen-levelup.webp'), '-resize', '1200x', '-gravity', 'center', '-crop', '1200x630+0+0', '+repage',
    '-fill', 'rgba(12,10,8,0.55)', '-draw', 'rectangle 0,380 1200,420',
    '-fill', 'rgba(12,10,8,0.9)', '-draw', 'rectangle 0,420 1200,630',
    '-gravity', 'south', '-font', FONTS + fontFile, '-pointsize', '60', '-fill', '#ead39a', '-annotate', '+0+105', title,
    '-font', FONTS + (fontFile === 'georgiab.ttf' ? 'georgia.ttf' : fontFile), '-pointsize', '28', '-fill', '#ddd3c2', '-annotate', '+0+55', subtitle,
    '-quality', '85', out);
  og(path.join(assets, 'og.jpg'), 'D2 Survivors Localization', I18N.en['og.subtitle'], 'georgiab.ttf');
  for (const sl of SITE_LANGS) {
    const t = I18N[sl.id];
    og(path.join(assets, `og-${sl.path}.jpg`), t['hero.title'], t['og.subtitle'], font[sl.id] || 'georgiab.ttf');
  }

  // favicon：深色圓角方塊加金色「D2」（跟原本內嵌的 SVG 一樣，不用暴雪或遊戲的圖）
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0c0a08"/><text x="16" y="22" font-family="Georgia,serif" font-size="15" font-weight="700" text-anchor="middle" fill="#c9a45c">D2</text></svg>\n`;
  fs.writeFileSync(path.join(ROOT, 'favicon.svg'), svg);
  const png = (size, out) => magick('-size', `${size}x${size}`, 'xc:none', '-fill', '#0c0a08',
    '-draw', `roundrectangle 0,0 ${size - 1},${size - 1} ${size * 0.19},${size * 0.19}`,
    '-font', FONTS + 'georgiab.ttf', '-pointsize', String(Math.round(size * 0.47)), '-fill', '#c9a45c',
    '-gravity', 'center', '-annotate', `+0+${Math.round(size * 0.03)}`, 'D2',
    // 不寫時間戳記，圖沒變就不會產生 git 差異
    '-define', 'png:exclude-chunks=date,time', out);
  const tmp = fs.mkdtempSync(path.join(process.getBuiltinModule('node:os').tmpdir(), 'd2s-icon-'));
  for (const s of [16, 32, 48]) png(s, path.join(tmp, `${s}.png`));
  magick(...[16, 32, 48].map(s => path.join(tmp, `${s}.png`)), path.join(ROOT, 'favicon.ico'));
  png(180, path.join(ROOT, 'apple-touch-icon.png'));
  fs.rmSync(tmp, { recursive: true });
  console.log('分享圖、favicon 已產生');
}

// --check：每頁的 title、description、canonical、hreflang、og:image、JSON-LD 摘要，寫到 work/site/seo-check.txt，有問題就列出來
function seoCheck() {
  const pages = [['/', path.join(ROOT, 'index.html')], ...SITE_LANGS.map(s => [`/${s.path}/`, path.join(ROOT, s.path, 'index.html')])];
  const out = [], problems = [], seen = { title: new Map(), description: new Map() };
  const attr = (html, re) => (html.match(re) || [])[1];
  for (const [name, file] of pages) {
    const html = fs.readFileSync(file, 'utf8');
    const title = attr(html, /<title>([^<]*)<\/title>/);
    const description = attr(html, /<meta name="description" content="([^"]*)"/);
    const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
    const hreflang = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m => `${m[1]}=${m[2].replace(BASE, '/')}`);
    const image = attr(html, /<meta property="og:image" content="([^"]*)"/);
    const imageAlt = attr(html, /<meta property="og:image:alt" content="([^"]*)"/);
    const lang = attr(html, /<html lang="([^"]*)"/);
    let ld = [];
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        const data = JSON.parse(m[1]);
        for (const node of data['@graph'] || [data]) {
          const extra = node['@type'] === 'FAQPage' ? ` ${node.mainEntity.length} 題` : node.alternateName ? ` alternateName ${[].concat(node.alternateName).length} 個` : '';
          ld.push(`${node['@type']}${extra}`);
          if (node['@type'] === 'FAQPage') for (const q of node.mainEntity) if (!html.includes(`<summary>${esc(q.name)}</summary>`)) problems.push(`${name} FAQPage 的題目在頁面上找不到：${q.name}`);
        }
      } catch (e) { problems.push(`${name} JSON-LD 解析失敗：${e.message}`); }
    }
    const imageFile = image && path.join(ROOT, image.replace(BASE, ''));
    if (!title) problems.push(`${name} 沒有 title`);
    if (!description) problems.push(`${name} 沒有 description`);
    if (canonical !== new URL(name.slice(1), BASE).href) problems.push(`${name} canonical 不對：${canonical}`);
    if (hreflang.length !== SITE_LANGS.length + 1) problems.push(`${name} hreflang 有 ${hreflang.length} 個`);
    if (!imageFile || !fs.existsSync(imageFile)) problems.push(`${name} 分享圖不存在：${image}`);
    if (!imageAlt) problems.push(`${name} 沒有 og:image:alt`);
    if (!ld.length) problems.push(`${name} 沒有 JSON-LD`);
    for (const key of ['title', 'description']) {
      const v = key === 'title' ? title : description;
      if (seen[key].has(v)) problems.push(`${name} 的 ${key} 跟 ${seen[key].get(v)} 重複`);
      seen[key].set(v, name);
    }
    out.push(`${name}（lang=${lang}）
  title (${[...title].length})：${title}
  description (${[...description].length})：${description}
  canonical：${canonical}
  hreflang：${hreflang.join('  ')}
  og:image：${image.replace(BASE, '/')}（alt：${imageAlt}）
  JSON-LD：${ld.join('、')}
`);
  }
  for (const f of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'sitemap.xml', 'robots.txt']) if (!fs.existsSync(path.join(ROOT, f))) problems.push(`缺少 site/${f}`);
  const report = `網站 SEO 檢查（${new Date().toISOString()}，BASE ${BASE}）\n\n${out.join('\n')}\n${problems.length ? '問題：\n' + problems.map(p => '- ' + p).join('\n') : '沒有發現問題'}\n`;
  fs.mkdirSync('work/site', { recursive: true });
  fs.writeFileSync('work/site/seo-check.txt', report);
  console.log(`檢查結果寫到 work/site/seo-check.txt：${problems.length ? problems.length + ' 個問題' : '沒有問題'}`);
  if (problems.length) process.exitCode = 1;
}
