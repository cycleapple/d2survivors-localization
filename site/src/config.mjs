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
  // 回報問題的網址（GitHub Issues、Discord…），留空就不顯示
  feedbackUrl: '',
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
];

// 遊戲翻譯的語言清單。manifest 裡有的語言以 manifest 為準（status：available／beta、條數、更新時間），
// 沒有的就是 planned（計畫中）。name：用各個網站介面語言寫的語言名稱，沒有的介面語言用 en
export const LANGUAGES = [
  { id: 'zh-TW', native: '繁體中文', name: { 'zh-TW': '中文（繁體）', 'zh-CN': '中文（繁体）', en: 'Chinese (Traditional)' }, status: 'available', entries: 12616, updated: '2026-10-27' },
  { id: 'zh-CN', native: '简体中文', name: { 'zh-TW': '中文（簡體）', 'zh-CN': '中文（简体）', en: 'Chinese (Simplified)' }, status: 'planned' },
  { id: 'ja', native: '日本語', name: { 'zh-TW': '日文', 'zh-CN': '日语', en: 'Japanese' }, status: 'planned' },
  { id: 'de', native: 'Deutsch', name: { 'zh-TW': '德文', 'zh-CN': '德语', en: 'German' }, status: 'planned' },
  { id: 'fr', native: 'Français', name: { 'zh-TW': '法文', 'zh-CN': '法语', en: 'French' }, status: 'planned' },
  { id: 'es-ES', native: 'Español (España)', name: { 'zh-TW': '西班牙文（西班牙）', 'zh-CN': '西班牙语（西班牙）', en: 'Spanish (Spain)' }, status: 'planned' },
  { id: 'es-419', native: 'Español (Latinoamérica)', name: { 'zh-TW': '西班牙文（拉丁美洲）', 'zh-CN': '西班牙语（拉丁美洲）', en: 'Spanish (Latin America)' }, status: 'planned' },
  { id: 'it', native: 'Italiano', name: { 'zh-TW': '義大利文', 'zh-CN': '意大利语', en: 'Italian' }, status: 'planned' },
  { id: 'pl', native: 'Polski', name: { 'zh-TW': '波蘭文', 'zh-CN': '波兰语', en: 'Polish' }, status: 'planned' },
  { id: 'pt-BR', native: 'Português (Brasil)', name: { 'zh-TW': '葡萄牙文（巴西）', 'zh-CN': '葡萄牙语（巴西）', en: 'Portuguese (Brazil)' }, status: 'planned' },
  { id: 'ru', native: 'Русский', name: { 'zh-TW': '俄文', 'zh-CN': '俄语', en: 'Russian' }, status: 'planned' },
];
