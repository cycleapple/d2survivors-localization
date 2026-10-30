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
- manifest 的 `status`（見 [manifest-v2.md](manifest-v2.md)）：`beta` 在遊戲語言選單的名稱後面標「（測試中）」，`draft` 標「（草稿）」，用那個語言自己寫（「简体中文（测试中）」「Français (brouillon)」）；不認得的值當成 `draft`。`available` 不標
- 第一次按書籤開哪個語言：遊戲設定裡的語言 → 上次用的（`d2zh:last`）→ 瀏覽器語言 → 繁中
- 再按一次書籤＝目前的語言和英文切換。遊戲裡「選項 → 遊戲設定 → 語言」列出 English、한국어 和 manifest 裡有 `web` 欄位的語言；換語言時修改版會請外層用新語言的規則重新開一次（不然 `location.reload()` 會載入原版）。連續切換時，建到一半又換的話建好的那份丟掉、照最新的設定再建，最後停在最後選的語言
- 防無限重新載入：15 秒內超過 3 次就停下來提示「一直重新載入」。只算 iframe 自己換頁回到 `/play/` 被換成修改版的那種（`reboot(true)`）；玩家自己換語言（遊戲的語言選單、按書籤）不算（2026-10-30，玩家在手機上快速切了一輪語言就撞到保護、畫面卡住）
- 網頁版改版比桌面版頻繁、壓縮後的變數名稱會變，所以 `web-rules.mjs` 用 regex（變數名稱抓下來再放回去；`pattern()` 的 `<1>`、`<2>`… 要照第一次出現的順序編號，跟 `$1`、`$2`… 對得上），跟桌面版的 `patch-rules.mjs` 分開。必要的規則（語言選單、接受語言設定、載入字典、外文字判斷）沒套上就不啟動，提示「需要更新」；其他的標 `optional`，沒套上照樣啟動、在 console 警告
- 規則的 groups 跟桌面版（`patch-rules.mjs`）一樣：`base`（每次都套用，包括英文）、`dict`、`cjk`、`magic-zh`、`magic-ja`（日文魔法物品名稱「前綴 後綴 物品」）、`fullwidth`（只有繁中用全形冒號）、`magic-de`／`magic-fr`／`magic-ru`、`unique-de`／`unique-fr`／`unique-ru`（有詞性的語言組魔法物品和獨特怪物的名字）、`cyrillic`（西里爾字母當外文字畫）、`font-ru`、`latin-ext`（波蘭文 U+0100–017F 當外文字畫）、`font-pl`、`size-pl`（外文字大小）、`magic-pl`、`unique-pl`、`caps`（德法俄波：英文原文沒有小寫字母時，譯文用 `toLocaleUpperCase` 轉成全大寫；字典查詢不分大小寫，SHIELDS／Shields 共用一個譯文）。斷行禁則、「暗色字不加描邊」（石頭按鈕的中日文、俄文畫成實心字）跟桌面版相同；網頁版的禁則多一個半形「:」（日文協同加成不在冒號前斷行）
- 只有網頁版有的（2026-10-28，桌面版還沒做）：角色畫面的「Survivor」女性職業查 `title:Survivor:f`（Выжившая、Ocalała；這個字是角色畫面直接寫的，不經過稱號函式）；升級卡片的進化條件在中日文用「、」接（程式在英文後面接半形「,」）；`caps`
- 德、法、俄文的名稱組合：字典的 `affix:`、`unique:` 有每種詞性的形式（「[ms]…[fs]…」），照 `gender:<名詞>` 挑。順序：德文「前綴 物品 後綴」、獨特怪物「前段-後段 稱號」；法文「物品 前綴 後綴」、「後段 前段 稱號」；俄文「前綴 物品 後綴」、「稱號, 前段 後段」；波蘭文「前綴 物品 後綴」、「稱號, 前段 後段」（不改大小寫，複數的詞性是 nl）。輸出要跟桌面版一樣，參考實作是 `work/translation/compose-proto.mjs`；`work/web/compose-check.mjs` 用套好規則的遊戲模組跑同一組例子跟它對照（德法俄波 44 個全部一樣）。規則裡新加的變數都用 `d2` 開頭，免得跟遊戲壓縮後的名稱撞到
- 跟桌面版同名、一起維護的規則：技能變體專用譯名（`modifier:<名稱>`，例如繁中荊棘之靈的 Vengeance 是「復仇」不是聖騎士的「復仇打擊」）、女性職業的稱號（`title:<稱號>:f`，Zerstörerin）、德文多字物品名稱在前綴後面小寫（Robuste schwere Handschuhe）。驗證：`node work/web/new-rules-check.mjs`
- 字型：網頁版沒有 D2R 的字型，改用系統字型（`local()`）註冊成遊戲的外文字字型家族。繁中：微軟正黑體、蘋方 TC、Noto Sans TC；簡中：微軟雅黑、蘋方 SC、Noto Sans SC；日文：遊ゴシック、Meiryo、Hiragino、Noto Sans JP、最後是 MS ゴシック（非日文版的 Windows 常常沒有 Meiryo，`local()` 全部找不到時中日文會退回系統語言的字型，繁中 Windows 上是正黑體，一行裡混兩種字型；遊ゴシック Windows 10／11 都有）；俄文（只註冊 U+0400–04FF）：Segoe UI、Arial、Roboto、Noto Sans。德、法文的字點陣字型本來就有（Latin-1），不用另外的字型；波蘭文（只註冊 U+0100–017F）跟俄文一樣用系統字型。波蘭文只有幾個字母走外文字、夾在點陣字母中間，照韓文的放大比例會大一號，所以標題 ×1.2、內文 ×1.0 不加粗（`size-pl`，有沒有 D2R 韓文字型的兩個分支都改）。桌面版的小按鈕字用 ×1.5、Exocet 先畫 4 倍大再縮小，是 Exocet 的問題；網頁版用系統字型，×1.5 的 Ś 會比點陣大寫高一截，×1.2 剛好，小字的尖音符號也都在（2026-10-27 用最終版 `dict/pl.json` 放大看「NOWOŚCI」「WYJŚCIE」）

## 排行榜和問題回報：翻譯模式不上傳

2026-10-27 調查（遊戲 20261027.2）：

- 網頁版會上傳成績：局結束時 `Game` 的 `postRun()` 組一筆紀錄（版本字串、`platform: web`、目前語言、`notes` 等），排進 localStorage 的 `d2s:leaderboard-queue`，再由 `saveTransfer` 送到 `/api/leaderboard/runs`（專家級 `/hc/runs`）；死亡送 `/deaths`，專家級英雄每局報到也走同一個 POST；問題回報送 `/api/report`
- **網頁版的程式沒有完整性檢查**。桌面版是經過 Electron 外殼的 `d2app.leaderboard` 上傳（在那裡比對 `app.asar.sha256`、標成 patched），網頁版直接 `fetch`，紀錄裡沒有任何能分辨程式被改過的東西；遊戲自己的 `tainted` 只看網址的開發參數和 `navigator.webdriver`。所以書籤不是讓檢查失效，而是網頁版本來就沒有，結果一樣：修改版的成績看起來跟原版一樣（唯一的差別是 `lang` 欄位不是 `en`／`ko`，切回英文時連這個都一樣）
- 處理（使用者決定不繞過防作弊、選保守誠實的做法）：書籤的修改版**一律不上傳**，包括在書籤裡切回英文的時候。`web-rules.mjs` 的 base 群組（每種語言都套用）五條必要規則，套不上就不啟動：
  - 排行榜的 POST 一律當成連不上（`{status:null}`）：死亡、專家級報到都不送；專家級英雄因此會變成「不排名」，跟離線玩一樣，這是正確的結果
  - 成績不排進佇列；也不處理佇列（佇列裡原版留下的成績原封不動，重新整理回原版時照常送出，不會被修改版弄丟或替它送出）
  - 問題回報直接當成被拒（`refused`），也不處理回報佇列：修改版的問題不該送給原作者
  - 看排行榜（GET）照常
- 玩家看得到的說明：書籤開啟時的提示加一句「翻譯模式下成績不會上傳到排行榜，要上榜請重新整理頁面用原版」（七種語言），切回英文時也提示仍然不上傳。網站上的說明要宣傳網站加
- 驗證：在 d2survivors.lol 載入修改版，讀 iframe 正在執行的 `saveTransfer` 模組確認五處都改了；正常開一局（沒有開發參數）打到死亡，期間沒有任何 `/api/` 請求、排行榜佇列是空的

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

status 標示：简中 beta 顯示「语言：简体中文（测试中）」、法文 status 改成不認得的值時顯示「LANGUE: Français (brouillon)」。

波蘭文（還在翻，用 `dict/pl/` 的層自己合併的字典測）：主選單按鈕「WYJŚCIE」「NOWOŚCI」、選項「OPCJE DŹWIĘKU」、小字「Zgłoś」放大看過，系統字型畫的波蘭字母跟旁邊的點陣字母一樣大，Ś／Ź 的符號沒有被切掉，按鈕上是實心黑字。

連續換語言（2026-10-30，正式 manifest 20261030-0013）：遊戲裡每 0.4 秒換一次、連換 9 次停在英文，9 次都重開、沒有出現「一直重新載入」，最後是英文；同時連叫 5 次只重開 1 次、停在最後選的語言；iframe 自己換頁的重開連續 4 次，第 4 次停下來提示，之後玩家自己換語言照樣可以；書籤切換英文 ↔ 日文正常。

還沒測：USE MY OWN FILES 實際讀檔、Safari／Firefox、手機、遊戲中的升級卡片和物品名稱（日文的魔法物品順序、禁則斷行只用 `build-web.mjs` 確認規則套得上；德法俄的名稱組合用 `compose-check.mjs` 對照過，沒有在遊戲畫面上看過）。

## 待辦

- 選檔案的 `setup.html` 是原版英文頁面
