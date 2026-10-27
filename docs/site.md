# 網站（site/）

宣傳／下載頁，純靜態，用 GitHub Pages 部署。每種介面語言各一頁靜態 HTML（給搜尋引擎看），由 `tools/build-site.mjs` 從文字表產生。

```
node tools/build-site.mjs          # 產生下面「產生的檔案」，改了文字或設定都要重跑
node tools/serve.mjs site 8766     # 本機預覽（或 python -m http.server 8765 -d site）
```

## 網址

| 網址 | 內容 |
|---|---|
| `/` | 語言選擇頁（標題列出所有語言的名稱，窄螢幕最上面也有全部語言）。**不自動跳轉**（爬蟲才看得到），只依上次選的或瀏覽器語言標出「建議」。舊網址 `/?lang=zh-CN` 會轉到該語言頁 |
| `/zh-tw/` | 繁體中文（台灣用語） |
| `/zh-cn/` | 简体中文（大陆用语） |
| `/en/` | English |
| `/ja/` | 日本語 |
| `/de/`、`/fr/`、`/ru/`、`/pl/` | Deutsch、Français、Русский、Polski |

`BASE`（網站網址）在 `site/src/config.mjs` 的 `SITE.base`，暫定 `https://cycleapple.github.io/d2survivors-localization/`。換網域就改這個值再重新產生；canonical、hreflang、Open Graph、sitemap、書籤網址都從這裡來。頁面之間的連結和 CSS、JS 用相對路徑，本機預覽和子路徑都能用。

## 檔案

| 檔案 | 說明 |
|---|---|
| `site/src/config.mjs` | 設定：`SITE`（BASE、下載網址、manifest 路徑、書籤路徑、manifest 讀不到時的版本號、中文化社群 Discord、更新紀錄筆數、「翻譯修正中」的時數）、`LINKS`（官方連結）、`SITE_LANGS`（介面語言）、`LANGUAGES`（遊戲翻譯語言清單） |
| `site/src/i18n.mjs` | 每種介面語言的文字。`key@web` 是瀏覽器版專用的文字；`faq.items`、`sources.cards` 的連結第三欄標 `desktop`／`web` 只在那個版本顯示 |
| `site/src/shared.mjs` | 建置腳本和網頁共用：合併 manifest、產生語言進度、首頁資訊列、下載按鈕 |
| `tools/build-site.mjs` | 頁面樣板，產生靜態頁 |
| `site/app.js` | 語言頁的互動：版本切換、書籤按鈕、讀較新的 manifest 重畫 |
| `site/root.js` | 首頁：標出建議語言 |
| `site/style.css`、`site/assets/` | 樣式、截圖、分享圖（`og.jpg`、`og-<語言>.jpg`，1200×630） |

產生的檔案（commit 進 repo，部署時也會重新產生）：`site/index.html`、`site/<語言>/index.html`、`site/sitemap.xml`、`site/robots.txt`。**不要手動改**，改 `site/src/` 再重跑。

`site/web/`（書籤，見 [web.md](web.md)）和 `site/data/`（manifest v2 和字典，見 [manifest-v2.md](manifest-v2.md)）是其他聊天室的，網站只讀不改。

## SEO

每個語言頁都有：自己的 `<title>`、meta description、`<html lang>`、canonical、三個語言互相標的 hreflang 加上 `x-default`（指到語言選擇頁）、Open Graph（`og:locale` 和 alternate）、Twitter 大圖卡片。內容直接寫在 HTML 裡，不靠 JavaScript（百度幾乎不跑 JS）。

- 用詞照 [seo-research.md](seo-research.md)：每種語言的 title、description 都同時有「D2 Survivors」和「Diablo 2 Survivors」（法文寫 Diablo II Survivors），加上該語言的稱呼和找翻譯的詞（暗黑2倖存者／中文版、暗黑破坏神2幸存者／汉化、ディアブロ2 サバイバーズ／日本語化、patch FR、Русификатор…）。英文頁搶不到「D2 Survivors」本身，改以「translation」為目標
- 「D2 Survivors」在 Google 會跟 Destiny 2、The Division 2 撞名，所以 title、description 和首段（h1 下面）都要有「Diablo 2 Survivors」。英文首段可以寫「Diablo 2 meets Vampire Survivors」，但 title 不放 Vampire Survivors
- 首段要寫清楚是**把遊戲本身翻成該語言**，不是攻略（搜尋結果前面多半是攻略站的語言版）
- 長度：title 約 60 字元（中日文約 30 字），description 約 160 字元（中日文約 100 字）；重要的詞放前面。不要堆關鍵字，也不要提其他翻譯作者
- `sitemap.xml` 每個網址都附 hreflang 對照
- 結構化資料（JSON-LD，在 `<head>`）：語言頁是 SoftwareApplication（桌面版啟動器，operatingSystem Windows）、WebApplication（瀏覽器版書籤）、FAQPage（只放兩個版本都看得到的題目，文字跟頁面一樣）；首頁是 WebSite。alternateName 用 i18n 的 `seo.alternateNames`。不寫 author／publisher。部署後用 Google 的「複合式搜尋結果測試」檢查
- 站長平台驗證：`SITE.verify` 的 google、bing、baidu 有值才輸出 google-site-verification、msvalidate.01、baidu-site-verification
- favicon：`site/favicon.svg`、`favicon.ico`（16／32／48）、`apple-touch-icon.png`（180），每頁都有 link（Google 搜尋結果的小圖示要真的網址）
- 分享圖：`assets/og-<語言>.jpg`，標題用該語言（i18n 的 `hero.title`、`og.subtitle`），og:image:alt 用 `og.alt`；首頁用 `og.jpg`。改了這些文字要在本機跑 `node tools/build-site.mjs --og`（需要 ImageMagick 和 Windows 字型），產生的圖 commit 進 repo
- sitemap 的 lastmod：頁面內容跟上次產生的一樣就沿用舊日期，有變才寫當天
- 檢查：`node tools/build-site.mjs --check` 把每頁的 title、description、canonical、hreflang、分享圖、JSON-LD 摘要寫到 `work/site/seo-check.txt`，也檢查重複、缺漏、FAQPage 題目是否在頁面上
- `robots.txt` 只有放在網域根目錄才有效。現在在 `github.io/<repo>/` 底下，搜尋引擎不會讀；換成自己的網域之後才生效。在那之前，sitemap 請到 Google Search Console、Bing、百度站長平台手動提交
- Google Fonts 只載入該語言需要的字型（繁中 Noto Serif TC、簡中 Noto Serif SC、英文只有 Cinzel）

## 兩層分頁

- 第一層是介面語言：各自一頁，用連結切換。寬螢幕是分頁（前面有 🌐）；1000px 以下放不下，改成在頁面最上面一次列出所有語言（`.lang-strip`，會折成兩、三行，目前的語言反白），標題列只留版本分頁。每個語言都用自己的語言寫，不用只寫一種語言的「語言」標籤或下拉選單，看不懂中文的訪客也找得到。之後語言再變多、寬螢幕的分頁放不下時，調高這個寬度
- 第二層是版本：桌面版（啟動器，`#install`）、瀏覽器版（書籤，`#web`），同一頁裡切換。兩邊內容都在 HTML 裡，標 `data-only="desktop"`／`"web"`，用 CSS 藏起另一邊
- 顯示哪個版本：網址 `?platform=desktop`／`web` → `#install`／`#web` → 上次選的（localStorage）→ Windows 用桌面版，其他（Mac、Linux、手機）用瀏覽器版。在 `<body>` 開頭用一小段內嵌程式先決定，不會先閃一下桌面版

## manifest v2

- 建置時讀 `site/data/manifest.json`：語言的 `status`（`available` 可用／`beta` 測試中）、`entries`、`updated`、`game.desktop`、`launcher.latest`。manifest 沒有的語言顯示「計畫中」。讀不到就用 `config.mjs` 的數字
- 網頁開啟後再讀一次 `data/manifest.json`（`cache: 'no-cache'`），比較新就重畫語言進度、首頁資訊列、下載按鈕。翻譯剛發布、網站還沒重新產生時也會是新的數字
- 語言進度只顯示字典條數，不算百分比：遊戲改版會加 key，字典也有遊戲外的字串，百分比會失準

## 更新紀錄

- 讀 `site/data/changelog.json`（`tools/publish.mjs` 產生，格式見 [manifest-v2.md](manifest-v2.md) 的「更新紀錄」），顯示最近 `SITE.changelogCount`（5）筆的日期、種類（翻譯／語言／遊戲改版／啟動器）、`summary`
- `summary` 用頁面語言；沒有的話中文頁用繁中、英文頁用英文，再沒有就用有的那個
- 建置時寫進 HTML；網頁開啟後讀 manifest 的 `changelog.url` 再畫一次。兩邊都沒有就不顯示這個區塊（HTML 裡留著隱藏的區塊，讀到才打開）

## 「遊戲剛更新，翻譯修正中」

- manifest 的 `game.web_checked` 超過 `SITE.staleHours`（3）小時沒更新，頁面上方（標題列下面）就顯示提示。每小時的 `.github/workflows/web-check.yml` 只在規則都套得上時才更新這個時間，所以時間太舊＝網頁版可能壞了
- 要看「現在」的時間，所以由 `app.js` 判斷，不在建置時決定；manifest 讀不到時用建置時嵌進頁面的時間。沒有 `web_checked` 就不顯示
- 有中文化社群 Discord 時，提示後面加一句「最新消息請看中文化社群 Discord」

## 中文化社群 Discord

- 邀請連結放在 `SITE.discordUrl`（使用者自己的伺服器），留空時下面都不顯示：首頁資訊列下的「加入中文化社群 Discord」、頁尾、常見問題「翻譯有錯或遊戲壞了，要去哪裡回報？」（`faq.items` 回答裡有 `{discord}` 的題目）、「想幫忙翻譯」那題的聯絡連結、「翻譯修正中」提示
- `LINKS.d2sDiscord` 是 D2 Survivors **遊戲官方**的 Discord（英文），來源卡片上寫「遊戲官方 Discord」，跟中文化社群分開。遊戲本身的問題請玩家到官方，翻譯的問題到中文化社群

## 贊助

- 連結在 `SITE.donateUrl`（使用者的 PayPal），留空就不顯示
- 放在常見問題後面的小段落（標題、「覺得好用的話，可以請我喝杯咖啡」、PayPal 按鈕）和頁尾（跟 Discord 連結並排）。不跳視窗、不放在下載按鈕旁邊
- 段落裡附上聲明（`donate.statement`）：免費使用，所有功能都不收費，也不販售任何遊戲內容；贊助是自願的，用來支持翻譯和維護的時間，贊助與否不影響任何功能。跟 README 同一個意思，不寫「不營利」
- 贊助的文字不提 Blizzard 或官方譯名

## 下載按鈕

固定指到 `https://github.com/cycleapple/d2survivors-localization/releases/latest/download/d2s-launcher.exe`（`SITE.downloadUrl`）。manifest 裡有 `launcher.latest` 才算已發布（`publish.mjs` 只在有 GitHub Release 時寫入），在那之前按鈕顯示「即將推出」。

## 書籤

書籤網址是 `BASE + web/d2zh.js`，建置時寫進 HTML。本機預覽時書籤也是指到正式網址。

## 加一種介面語言（例如 /de/）

規則：翻譯聊天室把某種語言改成 beta 或 available 並發布後，會通知網站加上那個語言的頁面（/ja/ 就是這樣加的）。

1. `site/src/config.mjs` 的 `SITE_LANGS` 加一筆，例如 `{ id: 'de', path: 'de', label: 'Deutsch', html: 'de', hreflang: 'de', og: 'de_DE', fonts: [] }`。`fonts` 是 Google Fonts 要多載的標題字型（拉丁字母用 Cinzel 就夠，空陣列）
2. `site/src/i18n.mjs` 加一份（照 `en` 的 key 翻，關鍵字參考翻譯聊天室給的）。這些要依語言調整：
   - 啟動器只有繁中介面：按鈕名稱照原文寫，後面加譯文，例如「啟動遊戲」（ゲームを起動）
   - SmartScreen 那題用該語言版 Windows 的按鈕文字
   - 截圖是繁中版，說明要註明
   - 書籤名稱 `web.bookmark.name`
3. `LANGUAGES` 每一筆的 `name` 加這個語言（沒加就顯示英文名稱）
4. `style.css` 視需要加 `:root:lang(xx)` 的字型
5. `node tools/build-site.mjs`。hreflang、sitemap、語言分頁、首頁卡片、首頁標題都會自動多一個

檢查 key 有沒有漏：每種語言的 key 要跟 `en` 一樣（`faq.items` 題數可以不同）。

### 語言清單

- `LANGUAGES` 的順序就是網站上的順序；還在做的語言先放進去，manifest 沒有的顯示「計畫中」
- 文字裡要列出「有哪些語言」的地方用 `{langs}`（A、B 或 C）或 `{langsAnd}`（A、B 和 C），建置時用 manifest 裡可用和測試中的語言、以那一頁的語言產生（`Intl.ListFormat`）。新語言發布後重新產生就好，不用改文字
- Discord 置頂文字裡的語言列表歸 Discord 聊天室，語言有變動時傳訊息給它

## 部署

`.github/workflows/pages.yml`：push 到 `main` 時跑 `node tools/build-site.mjs`，把 `site/` 整個上傳到 GitHub Pages（含 `site/data/`、`site/web/`）。repo 的 Settings → Pages → Source 要選「GitHub Actions」。流程見 [release.md](release.md)。

## 部署後要使用者自己做的

1. GitHub repo 公開、Settings → Pages → Source 選 GitHub Actions，push 一次讓網站上線
2. 建立站長平台帳號、加入網站：Google Search Console、Bing Webmaster Tools、百度搜索资源平台（百度需要中國手機號碼）。選「HTML 標記」驗證，把 content 的值填進 `SITE.verify`，重新產生、push，再回平台按驗證
3. 在三個平台提交 sitemap：`<BASE>sitemap.xml`（Bing 也可以從 Google Search Console 匯入）
4. 用 Google 的「複合式搜尋結果測試」貼各語言頁的網址，確認結構化資料沒有錯誤
5. 換成自己的網域之後：改 `SITE.base`、重新產生，robots.txt 才會生效；站長平台要重新加網站
