// 網站設定。改了要重新產生：node tools/build-site.mjs
// 這個檔案建置腳本（Node）和網頁的 app.js 都會讀，不能用到 Node 或瀏覽器專屬的東西。

export const SITE = {
  // 網站網址（結尾要有 /）。換網域改這裡再重新產生；canonical、hreflang、sitemap、書籤網址都從這裡來
  base: 'https://cycleapple.github.io/d2survivors-localization/',
  // 啟動器固定下載網址（最新的 GitHub Release）。manifest 裡有 launcher.latest 才算已發布，之前按鈕顯示「即將推出」
  downloadUrl: 'https://github.com/cycleapple/d2survivors-localization/releases/latest/download/d2s-launcher.exe',
  // manifest v2，相對於網站根目錄
  manifestPath: 'data/manifest.json',
  // 網頁版書籤載入的程式，相對於網站根目錄
  bookmarkletPath: 'web/d2zh.js',
  // manifest 讀不到時用的數字
  fallback: { gameVersion: '2026.1026.4', launcherVersion: '0.1.0' },
  // 中文化社群的 Discord 邀請連結（使用者自己的伺服器，不是遊戲官方的 LINKS.d2sDiscord）。留空就不顯示
  discordUrl: '',
  // 回報問題的其他網址（GitHub Issues…），沒有 discordUrl 時才用。留空就不顯示
  feedbackUrl: '',
  // 更新紀錄顯示幾筆（site/data/changelog.json，manifest 的 changelog.url）
  changelogCount: 5,
  // manifest 的 game.web_checked 超過幾小時沒更新，就顯示「遊戲剛更新，翻譯修正中」
  // （每小時的 web-check 只在規則都套得上時才更新這個時間）
  staleHours: 3,
};

// 官方連結（D2 Survivors 官網上的 Battle.net 商店連結也是這個）
export const LINKS = {
  d2sHome: 'https://d2survivors.lol/',
  d2sDownload: 'https://d2survivors.lol/download/',
  d2sPlay: 'https://d2survivors.lol/play/',
  d2sDiscord: 'https://discord.gg/mYMGgZPuQb',
  bnetShop: 'https://us.shop.battle.net/en-us/family/diablo-ii',
  bnetApp: 'https://download.battle.net/',
  steam: 'https://store.steampowered.com/app/2536520/',
};

// 網站介面語言：每個一頁（<path>/index.html）。加 /ja/：這裡加一筆、i18n.mjs 加一份 ja，再重新產生
// hreflang 給搜尋引擎、html 給 <html lang>、og 給 Open Graph、fonts 是 Google Fonts 要多載的字型
export const SITE_LANGS = [
  { id: 'zh-TW', path: 'zh-tw', label: '繁體中文', html: 'zh-Hant-TW', hreflang: 'zh-TW', og: 'zh_TW', fonts: ['Noto+Serif+TC:wght@600;700'] },
  { id: 'zh-CN', path: 'zh-cn', label: '简体中文', html: 'zh-Hans-CN', hreflang: 'zh-CN', og: 'zh_CN', fonts: ['Noto+Serif+SC:wght@600;700'] },
  { id: 'en', path: 'en', label: 'English', html: 'en', hreflang: 'en', og: 'en_US', fonts: [] },
  { id: 'ja', path: 'ja', label: '日本語', html: 'ja', hreflang: 'ja', og: 'ja_JP', fonts: ['Noto+Serif+JP:wght@600;700'] },
];

// 遊戲翻譯的語言清單（順序就是網站上的順序）。manifest 裡有的語言以 manifest 為準（status：available／beta、條數、更新時間），
// 沒有的就是 planned（計畫中）。name：用各個網站介面語言寫的語言名稱，沒有的介面語言用 en
export const LANGUAGES = [
  { id: 'zh-TW', native: '繁體中文', name: { 'zh-TW': '中文（繁體）', 'zh-CN': '中文（繁体）', en: 'Chinese (Traditional)', ja: '中国語（繁体字）' }, status: 'available', entries: 12758, updated: '2026-10-27' },
  { id: 'zh-CN', native: '简体中文', name: { 'zh-TW': '中文（簡體）', 'zh-CN': '中文（简体）', en: 'Chinese (Simplified)', ja: '中国語（簡体字）' }, status: 'beta', entries: 12753, updated: '2026-10-27' },
  { id: 'ja', native: '日本語', name: { 'zh-TW': '日文', 'zh-CN': '日语', en: 'Japanese', ja: '日本語' }, status: 'beta', entries: 12755, updated: '2026-10-27' },
  // 翻譯中（manifest 還沒有的顯示「計畫中」）：德、法、俄文已翻完在等規則，波蘭文接著做
  { id: 'de', native: 'Deutsch', name: { 'zh-TW': '德文', 'zh-CN': '德语', en: 'German', ja: 'ドイツ語' }, status: 'planned' },
  { id: 'fr', native: 'Français', name: { 'zh-TW': '法文', 'zh-CN': '法语', en: 'French', ja: 'フランス語' }, status: 'planned' },
  { id: 'ru', native: 'Русский', name: { 'zh-TW': '俄文', 'zh-CN': '俄语', en: 'Russian', ja: 'ロシア語' }, status: 'planned' },
  { id: 'pl', native: 'Polski', name: { 'zh-TW': '波蘭文', 'zh-CN': '波兰语', en: 'Polish', ja: 'ポーランド語' }, status: 'planned' },
  { id: 'es-ES', native: 'Español (España)', name: { 'zh-TW': '西班牙文（西班牙）', 'zh-CN': '西班牙语（西班牙）', en: 'Spanish (Spain)', ja: 'スペイン語（スペイン）' }, status: 'planned' },
  { id: 'es-419', native: 'Español (Latinoamérica)', name: { 'zh-TW': '西班牙文（拉丁美洲）', 'zh-CN': '西班牙语（拉丁美洲）', en: 'Spanish (Latin America)', ja: 'スペイン語（中南米）' }, status: 'planned' },
  { id: 'it', native: 'Italiano', name: { 'zh-TW': '義大利文', 'zh-CN': '意大利语', en: 'Italian', ja: 'イタリア語' }, status: 'planned' },
  { id: 'pt-BR', native: 'Português (Brasil)', name: { 'zh-TW': '葡萄牙文（巴西）', 'zh-CN': '葡萄牙语（巴西）', en: 'Portuguese (Brazil)', ja: 'ポルトガル語（ブラジル）' }, status: 'planned' },
];
