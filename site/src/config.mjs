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
  fallback: { gameVersion: '2026.1027.2', launcherVersion: '1.0.0' },
  // 中文化社群的 Discord 邀請連結（使用者自己的伺服器，不是遊戲官方的 LINKS.d2sDiscord）。留空就不顯示
  discordUrl: 'https://discord.gg/QMBbTHSsaK',
  // 站長平台的驗證碼（只填 content 的值）。有值才輸出 meta：google-site-verification、msvalidate.01、baidu-site-verification
  verify: { google: '', bing: '', baidu: '' },
  // 贊助連結（使用者的 PayPal）。放在常見問題下面的小段落和頁尾，留空就不顯示
  donateUrl: 'https://paypal.me/DonateCYtw',
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
  { id: 'de', path: 'de', label: 'Deutsch', html: 'de', hreflang: 'de', og: 'de_DE', fonts: [] },
  { id: 'fr', path: 'fr', label: 'Français', html: 'fr', hreflang: 'fr', og: 'fr_FR', fonts: [] },
  // Cinzel 沒有西里爾字母，標題改用 Philosopher
  { id: 'ru', path: 'ru', label: 'Русский', html: 'ru', hreflang: 'ru', og: 'ru_RU', fonts: ['Philosopher:wght@400;700'] },
  { id: 'pl', path: 'pl', label: 'Polski', html: 'pl', hreflang: 'pl', og: 'pl_PL', fonts: [] },
];

// 宣傳截圖（規格見 docs/release.md 的「宣傳截圖」）：site/assets/shots/<頁面 path>/<場景>.webp。
// 每頁先找自己語言的，沒有就找 all/（各語言共用的），再沒有就用 zh-tw/ 的並在圖說註明（shots.fallback）；都沒有的場景不顯示。
// 圖說是 i18n 的 shots.<場景>。game 是並排輪播，desktop／web 只在那個版本顯示
export const SHOTS = {
  game: ['title', 'menu', 'levelup', 'item', 'character', 'skills', 'hud'],
  desktop: ['launcher-lang', 'launcher-main'],
  web: ['web-desktop', 'web-mobile'],
};
// 分享圖（og-<path>.jpg）的背景用哪個場景
export const OG_SHOT = 'levelup';

// 遊戲翻譯的語言清單（順序就是網站上的順序）。manifest 裡有的語言以 manifest 為準（status：available／beta、條數、更新時間），
// 沒有的就是 planned（計畫中）。name：用各個網站介面語言寫的語言名稱，沒有的介面語言用 en
export const LANGUAGES = [
  { id: 'zh-TW', native: '繁體中文', name: { 'zh-TW': '中文（繁體）', 'zh-CN': '中文（繁体）', en: 'Chinese (Traditional)', ja: '中国語（繁体字）', de: 'Chinesisch (traditionell)', fr: 'chinois (traditionnel)', ru: 'китайский (традиционный)', pl: 'chiński (tradycyjny)' }, status: 'available', entries: 12758, updated: '2026-10-27' },
  { id: 'zh-CN', native: '简体中文', name: { 'zh-TW': '中文（簡體）', 'zh-CN': '中文（简体）', en: 'Chinese (Simplified)', ja: '中国語（簡体字）', de: 'Chinesisch (vereinfacht)', fr: 'chinois (simplifié)', ru: 'китайский (упрощённый)', pl: 'chiński (uproszczony)' }, status: 'beta', entries: 12753, updated: '2026-10-27' },
  { id: 'ja', native: '日本語', name: { 'zh-TW': '日文', 'zh-CN': '日语', en: 'Japanese', ja: '日本語', de: 'Japanisch', fr: 'japonais', ru: 'японский', pl: 'japoński' }, status: 'beta', entries: 12755, updated: '2026-10-27' },
  // 德、法、俄、波蘭文已發布（beta，狀態以 manifest 為準）；manifest 還沒有的顯示「計畫中」
  { id: 'de', native: 'Deutsch', name: { 'zh-TW': '德文', 'zh-CN': '德语', en: 'German', ja: 'ドイツ語', de: 'Deutsch', fr: 'allemand', ru: 'немецкий', pl: 'niemiecki' }, status: 'planned' },
  { id: 'fr', native: 'Français', name: { 'zh-TW': '法文', 'zh-CN': '法语', en: 'French', ja: 'フランス語', de: 'Französisch', fr: 'français', ru: 'французский', pl: 'francuski' }, status: 'planned' },
  { id: 'ru', native: 'Русский', name: { 'zh-TW': '俄文', 'zh-CN': '俄语', en: 'Russian', ja: 'ロシア語', de: 'Russisch', fr: 'russe', ru: 'русский', pl: 'rosyjski' }, status: 'planned' },
  { id: 'pl', native: 'Polski', name: { 'zh-TW': '波蘭文', 'zh-CN': '波兰语', en: 'Polish', ja: 'ポーランド語', de: 'Polnisch', fr: 'polonais', ru: 'польский', pl: 'polski' }, status: 'planned' },
];
