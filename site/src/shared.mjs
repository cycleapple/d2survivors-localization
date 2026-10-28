// 建置腳本和網頁共用：合併 manifest、產生會隨 manifest 變動的區塊（語言進度、首頁資訊列、下載按鈕）。
// 建置時先輸出一份，網頁讀到較新的 manifest 再用同一套重畫。

export const fmt = (s, ...args) => s.replace(/\{(\d+)\}/g, (_, i) => args[i]);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// config 的語言清單和網站設定 + manifest v2（可以是 null）→ 網頁要顯示的狀態
export function siteState(languages, site, manifest) {
  const langs = languages.map(l => ({ ...l }));
  for (const m of manifest?.languages || []) {
    const entry = { status: m.status === 'beta' ? 'beta' : 'available', entries: m.entries, updated: (manifest.updated || '').slice(0, 10) || undefined };
    const known = langs.find(l => l.id === m.id);
    if (known) Object.assign(known, entry);
    else langs.push({ id: m.id, native: m.name, name: {}, ...entry });
  }
  return {
    languages: langs,
    gameVersion: manifest?.game?.desktop || site.fallback.gameVersion,
    launcherVersion: manifest?.launcher?.latest || site.fallback.launcherVersion,
    // publish.mjs 只在有 GitHub Release 時寫入 launcher.latest
    launcherReleased: Boolean(manifest?.launcher?.latest),
    updated: (manifest?.updated || '').slice(0, 10) || langs.map(l => l.updated).filter(Boolean).sort().at(-1),
  };
}

// t：這一頁的文字表；lang：網站介面語言
// 只顯示字典條數：遊戲改版會加 key，字典條數也包含遊戲外的字串，算百分比會失準
export function langGridHtml(state, t, lang) {
  const num = n => n.toLocaleString(lang);
  return state.languages.map(l => {
    const coverage = l.entries ? `<span class="lang-sub">${esc(fmt(t['lang.coverage'], num(l.entries)))}</span>` : '';
    return `<li class="lang ${l.status}">
      <div class="lang-head"><span class="lang-name" lang="${esc(l.id)}">${esc(l.native)}</span><span class="lang-code">${esc(l.id)}</span></div>
      <span class="lang-sub">${esc(l.name[lang] || l.name.en || l.native)}</span>
      <span class="status ${l.status}">${esc(t['status.' + l.status])}</span>
      ${coverage}
    </li>`;
  }).join('\n');
}

// 首頁資訊列，兩個版本各一份（data-only）
export function heroMetaHtml(state, t) {
  const item = ([k, v]) => `<li>${esc(k)} <strong>${esc(v)}</strong></li>`;
  const updated = state.updated && [t['meta.updated'], state.updated];
  const desktop = [
    [t['meta.game'], state.gameVersion],
    [t['meta.launcher'], state.launcherReleased ? `v${state.launcherVersion} · ${t['meta.platform']}` : `${t['hero.soon']} · ${t['meta.platform']}`],
    updated,
  ];
  const web = [
    [t['meta.browsers'], 'Chrome · Edge · Firefox · Safari'],
    [t['meta.devices'], t['meta.devices.value']],
    updated,
  ];
  return `<ul class="meta" data-only="desktop">${desktop.filter(Boolean).map(item).join('')}</ul>
        <ul class="meta" data-only="web">${web.filter(Boolean).map(item).join('')}</ul>`;
}

// 下載按鈕：已發布就是連結，還沒發布顯示「即將推出」
export function downloadBtnHtml(state, t, downloadUrl) {
  return state.launcherReleased
    ? `<a class="btn btn-primary" id="download-btn" href="${esc(downloadUrl)}">${esc(t['hero.download'])} <small>v${esc(state.launcherVersion)}</small></a>`
    : `<a class="btn btn-primary" id="download-btn" aria-disabled="true">${esc(t['hero.soon'])}</a>`;
}

// 多語言欄位（changelog 的 summary）：該語言 → 中文頁用繁中、其他用英文 → 有什麼用什麼
export function pickText(obj, lang) {
  if (!obj) return '';
  const order = [lang, lang.startsWith('zh') ? 'zh-TW' : 'en', 'en', 'zh-TW'];
  return obj[order.find(k => obj[k])] ?? Object.values(obj)[0] ?? '';
}

// 更新紀錄（changelog.json 的 entries，新的在前）
export function changelogHtml(entries, t, lang, count) {
  return entries.slice(0, count).map(e => `<li>
            <time datetime="${esc(e.date)}">${esc(e.date)}</time>
            <span class="kind kind-${esc(e.kind)}">${esc(t['changelog.kind.' + e.kind] || e.kind)}</span>
            <span class="changelog-summary">${esc(pickText(e.summary, lang))}</span>
          </li>`).join('\n          ');
}

// 查「遊戲剛更新」issue 的 GitHub API 網址（只要一筆，有就代表網頁版的規則對不上）
export function gameUpdateApi(site) {
  const repo = new URL(site.repoUrl).pathname.replace(/\/$/, '');
  return `https://api.github.com/repos${repo}/issues?labels=${encodeURIComponent(site.gameUpdateLabel)}&state=open&per_page=1`;
}

// 網頁讀 manifest 後要用到的文字（建置時嵌進頁面）
export const RUNTIME_KEYS = [
  'changelog.kind.translation', 'changelog.kind.language', 'changelog.kind.game-fix', 'changelog.kind.launcher',
  'lang.coverage', 'status.available', 'status.beta', 'status.planned',
  'meta.updated', 'meta.game', 'meta.launcher', 'meta.platform', 'meta.browsers', 'meta.devices', 'meta.devices.value',
  'hero.download', 'hero.soon', 'web.copied', 'web.copyfail', 'web.pc.drag',
];
