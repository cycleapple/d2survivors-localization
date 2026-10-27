# 網頁版書籤（site/web/）

在 https://d2survivors.lol/play/ 用瀏覽器玩時，用書籤切換成繁體中文、简体中文或日本語（電腦、手機都可以）。網站「瀏覽器版」分頁的「安裝書籤」區塊有拖曳安裝的按鈕和手機用的程式碼；書籤是 `javascript:import('<網站>/web/d2zh.js').then(m=>m.default())`，網站部署在哪裡就指到哪裡（暫定 `https://cycleapple.github.io/d2survivors-localization/web/d2zh.js`）。

> 書籤裡寫死了網站網址，玩家裝好之後網址就不能再換。公開宣傳前要先決定好網域。

```
node tools/build-web.mjs            # 抓線上的網頁版，每個語言（加上英文）各套用一次規則，檢查都套得上、改完的模組語法正確
node tools/serve.mjs site 8766      # 本機預覽（允許跨網域讀取）；launch.json 的 site-cors
```

## 檔案

| 檔案 | 內容 |
|---|---|
| `site/web/d2zh.js` | 書籤本體：讀 manifest、停掉原版、在 iframe 裡開修改版、語言切換 |
| `site/web/core.js` | 抓模組、套規則、產生頁面（書籤和 `build-web.mjs` 共用） |
| `tools/web-rules.mjs` | 修改規則 `WEB_RULES`、語言設定 `WEB_LANGUAGES`、`WEB_PLAY_URL`、`WEB_CHECKED`。格式寫在檔案開頭的註解 |
| `tools/build-web.mjs` | 檢查規則還對得上線上的遊戲；全部通過時改寫 `WEB_CHECKED` |

規則和字典不放在 `site/web/`：`tools/make-manifest.mjs`（翻譯）讀 `web-rules.mjs`，寫進 `site/data/manifest.json` 的 `web.rules`、`languages[].web`（見 [manifest-v2.md](manifest-v2.md)）。改了 `web-rules.mjs` 要請翻譯那邊重新產生 manifest，書籤才會拿到。

## 做法

- 跟桌面版一樣用遊戲內建的翻譯系統，不是蓋一層字上去：書籤讀 `../data/manifest.json`（相對於 `d2zh.js`），抓下遊戲頁面和全部模組（約 44 個），照**目前的語言**挑出 groups 符合的規則套用，模組做成 blob 網址，用 import map 換掉原本的模組，再在同網域的 iframe 裡重新開一次遊戲。字典照 manifest 的 `dict.url` 抓，做成 blob 模組
- 原版遊戲（外層頁面）會先停掉：送 `pagehide` 讓它存檔、放掉防止開兩個分頁的 Web Lock；送一個 F24 按鍵讓它讀 AudioContext 再關掉（不然背景音樂會兩份）；停掉 rAF、計時器、WebGL
- iframe 先載入 `/robots.txt` 再把修改版寫進去：這樣才歸遊戲的 Service Worker（scope `/`）管，「USE MY OWN FILES」模式靠它從 OPFS 讀 D2 檔案
- 還沒選檔案模式時，遊戲會把 iframe 換到 `setup.html`（原版英文）；選完回到 `/play/` 時書籤再換成修改版
- 網頁版多幾個語言（localStorage `d2s:lang` = `zh-TW`／`zh-CN`／`ja`），不佔韓文的位置；原版遊戲讀到不認得的值會照瀏覽器語言回到英文，所以重新整理後不會卡在看不懂的語言。舊版書籤存的 `zh` 當成 `zh-TW`
- 第一次按書籤開哪個語言：遊戲設定裡的語言 → 上次用的（`d2zh:last`）→ 瀏覽器語言 → 繁中
- 再按一次書籤＝目前的語言和英文切換。遊戲裡「選項 → 遊戲設定 → 語言」列出 English、한국어 和 manifest 裡有 `web` 欄位的語言；換語言時修改版會請外層用新語言的規則重新開一次（不然 `location.reload()` 會載入原版）
- 網頁版改版比桌面版頻繁、壓縮後的變數名稱會變，所以 `web-rules.mjs` 用 regex（變數名稱抓下來再放回去；`pattern()` 的 `<1>`、`<2>`… 要照第一次出現的順序編號，跟 `$1`、`$2`… 對得上），跟桌面版的 `patch-rules.mjs` 分開。必要的規則（語言選單、接受語言設定、載入字典、外文字判斷）沒套上就不啟動，提示「需要更新」；其他的標 `optional`，沒套上照樣啟動、在 console 警告
- 規則的 groups 跟桌面版（`patch-rules.mjs`）一樣：`base`（每次都套用，包括英文）、`dict`、`cjk`、`magic-zh`、`magic-ja`（日文魔法物品名稱「前綴 後綴 物品」）、`fullwidth`（只有繁中用全形冒號）、`magic-de`／`magic-fr`／`magic-ru`、`unique-de`／`unique-fr`／`unique-ru`（有詞性的語言組魔法物品和獨特怪物的名字）、`cyrillic`（西里爾字母當外文字畫）、`font-ru`。斷行禁則、「暗色字不加描邊」（石頭按鈕的中日文、俄文畫成實心字）跟桌面版相同
- 德、法、俄文的名稱組合：字典的 `affix:`、`unique:` 有每種詞性的形式（「[ms]…[fs]…」），照 `gender:<名詞>` 挑。順序：德文「前綴 物品 後綴」、獨特怪物「前段-後段 稱號」；法文「物品 前綴 後綴」、「後段 前段 稱號」；俄文「前綴 物品 後綴」、「稱號, 前段 後段」。輸出要跟桌面版一樣，參考實作是 `work/translation/compose-proto.mjs`；`work/web/compose-check.mjs` 用套好規則的遊戲模組跑同一組例子跟它對照（現在 33 個全部一樣）。規則裡新加的變數都用 `d2` 開頭，免得跟遊戲壓縮後的名稱撞到
- 字型：網頁版沒有 D2R 的字型，改用系統字型（`local()`）註冊成遊戲的外文字字型家族。繁中：微軟正黑體、蘋方 TC、Noto Sans TC；簡中：微軟雅黑、蘋方 SC、Noto Sans SC；日文：Meiryo、Hiragino、Noto Sans JP；俄文（只註冊 U+0400–04FF）：Segoe UI、Arial、Roboto、Noto Sans。德、法文的字點陣字型本來就有（Latin-1），不用另外的字型

## 測試

本機測試：瀏覽器擋公開頁面讀 localhost，所以把 `site/web/*.js` 和 `make-manifest.mjs` 產生到暫存資料夾的 manifest、字典 gzip 起來，經 `robots.txt` 的網址 hash 放進 localStorage，在遊戲頁面用改寫過的 `fetch` 載入書籤。

2026-10-27 在 Chrome（內建瀏覽器）測過：
- 從 `setup.html` 按書籤 → 選 HOSTED FILES → 修改版繁中（標題、版權聲明）
- 遊戲內換成簡中（主選單）、日文（主選單、選項、遊戲設定「言語：日本語」），再換回英文，每次都用新語言的規則重開
- 再按書籤：英文 → 上次的日文 → 英文
- 舊的 `zh` 設定讀成 `zh-TW`
- 載入約 0.8 秒
- 「暗色字不加描邊」：主選單的石頭按鈕字變成實心黑字（原本像空心的灰字）

正式的 manifest（22949d4，version 20261027-1223）：繁中、簡中、日文切換、書籤切換都正常。

德、法、俄文（manifest 裡還是 draft，用暫存資料夾自己加上去的 manifest 測）：俄文標題、主選單（西里爾字母用系統字型畫、按鈕是實心黑字）、德文、法文主選單、書籤切換（法文 ↔ 英文）都正常。

還沒測：USE MY OWN FILES 實際讀檔、Safari／Firefox、手機、遊戲中的升級卡片和物品名稱（日文的魔法物品順序、禁則斷行只用 `build-web.mjs` 確認規則套得上；德法俄的名稱組合用 `compose-check.mjs` 對照過，沒有在遊戲畫面上看過）。

## 待辦

- 選檔案的 `setup.html` 是原版英文頁面
