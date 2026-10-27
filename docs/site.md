# 網站（site/）

宣傳／下載頁，純靜態，用 GitHub Pages 部署。每種介面語言各一頁靜態 HTML（給搜尋引擎看），由 `tools/build-site.mjs` 從文字表產生。

```
node tools/build-site.mjs          # 產生下面「產生的檔案」，改了文字或設定都要重跑
node tools/serve.mjs site 8766     # 本機預覽（或 python -m http.server 8765 -d site）
```

## 網址

| 網址 | 內容 |
|---|---|
| `/` | 語言選擇頁。**不自動跳轉**（爬蟲才看得到），只依上次選的或瀏覽器語言標出「建議」。舊網址 `/?lang=zh-CN` 會轉到該語言頁 |
| `/zh-tw/` | 繁體中文（台灣用語） |
| `/zh-cn/` | 简体中文（大陆用语） |
| `/en/` | English |

`BASE`（網站網址）在 `site/src/config.mjs` 的 `SITE.base`，暫定 `https://cycleapple.github.io/d2survivors-localization/`。換網域就改這個值再重新產生；canonical、hreflang、Open Graph、sitemap、書籤網址都從這裡來。頁面之間的連結和 CSS、JS 用相對路徑，本機預覽和子路徑都能用。

## 檔案

| 檔案 | 說明 |
|---|---|
| `site/src/config.mjs` | 設定：`SITE`（BASE、下載網址、manifest 路徑、書籤路徑、manifest 讀不到時的版本號）、`LINKS`（官方連結）、`SITE_LANGS`（介面語言）、`LANGUAGES`（遊戲翻譯語言清單） |
| `site/src/i18n.mjs` | 每種介面語言的文字。`key@web` 是瀏覽器版專用的文字；`faq.items`、`sources.cards` 的連結第三欄標 `desktop`／`web` 只在那個版本顯示 |
| `site/src/shared.mjs` | 建置腳本和網頁共用：合併 manifest、產生語言進度、首頁資訊列、下載按鈕 |
| `tools/build-site.mjs` | 頁面樣板，產生靜態頁 |
| `site/app.js` | 語言頁的互動：版本切換、書籤按鈕、讀較新的 manifest 重畫 |
| `site/root.js` | 首頁：標出建議語言 |
| `site/style.css`、`site/assets/` | 樣式、截圖、`og.jpg`（1200×630 分享圖） |

產生的檔案（commit 進 repo，部署時也會重新產生）：`site/index.html`、`site/<語言>/index.html`、`site/sitemap.xml`、`site/robots.txt`。**不要手動改**，改 `site/src/` 再重跑。

`site/web/`（書籤，見 [web.md](web.md)）和 `site/data/`（manifest v2 和字典，見 [manifest-v2.md](manifest-v2.md)）是其他聊天室的，網站只讀不改。

## SEO

每個語言頁都有：自己的 `<title>`、meta description、`<html lang>`、canonical、三個語言互相標的 hreflang 加上 `x-default`（指到語言選擇頁）、Open Graph（`og:locale` 和 alternate）、Twitter 大圖卡片。內容直接寫在 HTML 裡，不靠 JavaScript（百度幾乎不跑 JS）。

- `sitemap.xml` 每個網址都附 hreflang 對照
- `robots.txt` 只有放在網域根目錄才有效。現在在 `github.io/<repo>/` 底下，搜尋引擎不會讀；換成自己的網域之後才生效。在那之前，sitemap 請到 Google Search Console、Bing、百度站長平台手動提交
- Google Fonts 只載入該語言需要的字型（繁中 Noto Serif TC、簡中 Noto Serif SC、英文只有 Cinzel）

## 兩層分頁

- 第一層是介面語言：各自一頁，用連結切換
- 第二層是版本：桌面版（啟動器，`#install`）、瀏覽器版（書籤，`#web`），同一頁裡切換。兩邊內容都在 HTML 裡，標 `data-only="desktop"`／`"web"`，用 CSS 藏起另一邊
- 顯示哪個版本：網址 `?platform=desktop`／`web` → `#install`／`#web` → 上次選的（localStorage）→ Windows 用桌面版，其他（Mac、Linux、手機）用瀏覽器版。在 `<body>` 開頭用一小段內嵌程式先決定，不會先閃一下桌面版

## manifest v2

- 建置時讀 `site/data/manifest.json`：語言的 `status`（`available` 可用／`beta` 測試中）、`entries`、`updated`、`game.desktop`、`launcher.latest`。manifest 沒有的語言顯示「計畫中」。讀不到就用 `config.mjs` 的數字
- 網頁開啟後再讀一次 `data/manifest.json`（`cache: 'no-cache'`），比較新就重畫語言進度、首頁資訊列、下載按鈕。翻譯剛發布、網站還沒重新產生時也會是新的數字
- 語言進度只顯示字典條數，不算百分比：遊戲改版會加 key，字典也有遊戲外的字串，百分比會失準

## 下載按鈕

固定指到 `https://github.com/cycleapple/d2survivors-localization/releases/latest/download/d2s-launcher.exe`（`SITE.downloadUrl`）。manifest 裡有 `launcher.latest` 才算已發布（`publish.mjs` 只在有 GitHub Release 時寫入），在那之前按鈕顯示「即將推出」。

## 書籤

書籤網址是 `BASE + web/d2zh.js`，建置時寫進 HTML。本機預覽時書籤也是指到正式網址。

## 加一種介面語言（例如 /ja/）

1. `site/src/config.mjs` 的 `SITE_LANGS` 加一筆：`{ id: 'ja', path: 'ja', label: '日本語', html: 'ja', hreflang: 'ja', og: 'ja_JP', fonts: ['Noto+Serif+JP:wght@600;700'] }`
2. `site/src/i18n.mjs` 加一份 `ja`（照 `en` 的 key 翻）；`LANGUAGES` 每一筆的 `name` 加 `ja`（沒加就顯示英文名稱）
3. `style.css` 視需要加 `:root:lang(ja)` 的字型
4. `node tools/build-site.mjs`。hreflang、sitemap、語言分頁、首頁卡片都會自動多一個

## 部署

`.github/workflows/pages.yml`：push 到 `main` 時跑 `node tools/build-site.mjs`，把 `site/` 整個上傳到 GitHub Pages（含 `site/data/`、`site/web/`）。repo 的 Settings → Pages → Source 要選「GitHub Actions」。流程見 [release.md](release.md)。
