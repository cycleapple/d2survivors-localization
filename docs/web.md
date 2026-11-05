# 網頁版書籤（site/web/）

在 https://d2survivors.lol/ （首頁）或 https://d2survivors.lol/play/ 用瀏覽器玩時，用書籤切換成繁體中文、简体中文或日本語（電腦、手機都可以）。網站「瀏覽器版」分頁的「安裝書籤」區塊有拖曳安裝的按鈕和手機用的程式碼；書籤是 `javascript:import('<網站>/web/d2zh.js').then(m=>m.default())`，網站部署在哪裡就指到哪裡（暫定 `https://cycleapple.github.io/d2survivors-localization/web/d2zh.js`）。

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
| `site/web/fonts/` | 俄文用的 Philosopher Bold 西里爾字母子集（`philosopher-bold-cyrillic.woff2`）和它的授權 `OFL.txt` |
| `tools/web-rules.mjs` | 修改規則 `WEB_RULES`、語言設定 `WEB_LANGUAGES`、`WEB_PLAY_URL`、`WEB_CHECKED`。格式寫在檔案開頭的註解 |
| `tools/build-web.mjs` | 檢查規則還對得上線上的遊戲；全部通過時改寫 `WEB_CHECKED` |

規則和字典不放在 `site/web/`：`tools/make-manifest.mjs`（翻譯）讀 `web-rules.mjs`，寫進 `site/data/manifest.json` 的 `web.rules`、`languages[].web`（見 [manifest-v2.md](manifest-v2.md)）。改了 `web-rules.mjs` 要請翻譯那邊重新產生 manifest，書籤才會拿到。

## 做法

- 跟桌面版一樣用遊戲內建的翻譯系統，不是蓋一層字上去：書籤讀 `../data/manifest.json`（相對於 `d2zh.js`），抓下遊戲頁面和全部模組（約 44 個），照**目前的語言**挑出 groups 符合的規則套用，模組做成 blob 網址，用 import map 換掉原本的模組，再在同網域的 iframe 裡重新開一次遊戲。字典照 manifest 的 `dict.url` 抓，做成 blob 模組
- 原版遊戲（外層頁面）會先停掉：送 `pagehide` 讓它存檔、放掉防止開兩個分頁的 Web Lock；送一個 F24 按鍵讓它讀 AudioContext 再關掉（不然背景音樂會兩份）；停掉 rAF、計時器、WebGL
- 停掉的那一份不能再拿 Web Lock（`d2-survivors/play`，2026-11-05 起）：原版在拿到 `/site.json` 之後才去搶鎖，按書籤時它可能還在等（手機、網路慢），停掉之後才拿到，iframe 裡的修改版就一直顯示「D2 Survivors is open in another tab」。`stopPage` 先把那個 realm 的 `LockManager.prototype.request` 換成永遠不回應（每個 realm 各一份，iframe 不受影響），再送 `pagehide`。已經在排隊的（另一個分頁開著遊戲時排在它後面、送 `pagehide` 時正拿到一半）：遊戲拿到鎖時才登記 `pagehide` 的 listener，所以停掉之後登記的 `pagehide` listener 一律馬上呼叫，拿到就放掉。換語言時停掉的舊 iframe 也一樣。真的有另一個分頁開著遊戲時照原版顯示「open in another tab」，那個分頁關掉後修改版接手
- 可以在首頁（`/`）或遊戲頁面（`/play/`、`/play/setup.html`）啟動（2026-10-30 起）。手機建議從首頁：在 `/play/` 啟動時停掉的原版還佔著記憶體（模組、下載的遊戲資料），等於兩份遊戲；首頁只有 landing 的小腳本（約 33KB，2D 的火星動畫，一樣用 `stopPage` 停掉）。從首頁啟動時：遊戲頁面固定是 `/play/`；網址列用 `history.replaceState` 換成 `/play/`、分頁標題用遊戲頁面的，所以分頁被手機丟掉重新載入、或再按一次書籤時回到的是原版遊戲，不是首頁。其他頁面（wiki 等，它們也有 `#d2-files`，所以還要看路徑）提示要先打開首頁或遊戲頁面
- iframe 先載入 `/robots.txt` 再把修改版寫進去：這樣才歸遊戲的 Service Worker（scope `/`）管，「USE MY OWN FILES」模式靠它從 OPFS 讀 D2 檔案
- 遊戲要選檔案模式時會把 iframe 換到 `setup.html`（原版英文）；選完回到 `/play/` 時書籤再換成修改版。iframe 停在 `setup.html` 的時候，畫面下方一直顯示「請先選擇遊戲檔案，選完會自動切回〇〇」（七種語言；遊戲語言是英文、韓文時用英文），離開就收起來。見下面「選檔案（setup.html）和 hosted 檔案拿掉之後」
- 網頁版多幾個語言（localStorage `d2s:lang` = `zh-TW`／`zh-CN`／`ja`），不佔韓文的位置；原版遊戲讀到不認得的值會照瀏覽器語言回到英文，所以重新整理後不會卡在看不懂的語言。舊版書籤存的 `zh` 當成 `zh-TW`
- manifest 的 `status`（見 [manifest-v2.md](manifest-v2.md)）：`beta` 在遊戲語言選單的名稱後面標「（測試中）」，`draft` 標「（草稿）」，用那個語言自己寫（「简体中文（测试中）」「Français (brouillon)」）；不認得的值當成 `draft`。`available` 不標
- 第一次按書籤開哪個語言：安裝碼帶的語言（`m.default('zh-TW')`，網站各語言頁的安裝碼；是 manifest 裡有 `web` 的語言才算，並寫進 `d2s:lang`、`d2zh:last`）→ 遊戲設定裡的語言 → 上次用的（`d2zh:last`）→ 瀏覽器語言 → 繁中。沒帶參數的舊書籤照舊；舊版 `d2zh.js` 會忽略參數
- 再按一次書籤＝回到原版英文的遊戲頁面（2026-10-30 起，所有書籤都一樣；原本是在頁面裡切英文，但 Android 實機在頁面裡再開一份遊戲會卡住）：網址已經是遊戲頁面就 `location.reload()`（保留網址參數），不是的話（從首頁啟動又換不了網址）`location.assign('/play/')`。`d2s:lang` 不動：原版讀到不認得的值會用英文，再按書籤就直接開回那個語言
- 遊戲裡「選項 → 遊戲設定 → 語言」列出 English、한국어 和 manifest 裡有 `web` 欄位的語言；換語言時修改版會請外層用新語言的規則重新開一次（不然 `location.reload()` 會載入原版）。連續切換時，建到一半又換的話建好的那份丟掉、照最新的設定再建，最後停在最後選的語言
- 換語言重開時先停掉舊的 iframe（跟停原版一樣：pagehide、AudioContext、rAF、計時器、每個 canvas 的 `WEBGL_lose_context`），再建新的：手機能同時開的 WebGL context 有限，一份遊戲就有好幾個 canvas。新的 iframe 最前面加一段計算 `requestAnimationFrame` 次數的程式（`__d2zhFrames`，滿 10 次換回原本的），頁面看得到的時間累計 20 秒還不到 10 次就提示「切換失敗，請重新整理頁面再按一次書籤」（遊戲已經存了新語言，重新整理再按書籤就會直接用它開）
- 省電畫質（顯示設定的「BATTERY SAVER」，預設關）：書籤在 iframe 最前面把 `devicePixelRatio` 蓋成 min(原本, 1)，開關是 `__d2zhLowres`，設定存在 localStorage `d2zh:lowres`（`1`／`0`）。遊戲每格都讀 `devicePixelRatio` 算解析度（`saveTransfer` 的 render scale，key 含 dpr），所以馬上生效，不用重開。顯示設定的那一列是 `web-rules.mjs` 的三條 base 規則（optional，沒套上只是沒有那一列；`__d2zhLowres` 不在時也不顯示）。字典要加 `BATTERY SAVER`、`BATTERY SAVER: #`、`Lower resolution, for phones` 才會翻譯，沒加時顯示英文。不碰排行榜：遊戲的排行榜判斷（`tainted`、`page()`）只看網址參數和 `navigator.webdriver`；被換掉的 `devicePixelRatio`、`requestAnimationFrame` 只會出現在問題回報的診斷文字（`ui` 模組的 `page` 欄位），修改版本來就不送回報
- 防無限重新載入：15 秒內超過 3 次就停下來提示「一直重新載入」。只算 iframe 自己換頁回到 `/play/` 被換成修改版的那種（`reboot(true)`）；玩家在遊戲選單換語言不算（2026-10-30，玩家在手機上快速切了一輪語言就撞到保護、畫面卡住）
- 網頁版改版比桌面版頻繁、壓縮後的變數名稱會變，所以 `web-rules.mjs` 用 regex（變數名稱抓下來再放回去；`pattern()` 的 `<1>`、`<2>`… 要照第一次出現的順序編號，跟 `$1`、`$2`… 對得上），跟桌面版的 `patch-rules.mjs` 分開。必要的規則（語言選單、接受語言設定、載入字典、外文字判斷）沒套上就不啟動，提示「需要更新」；其他的標 `optional`，沒套上照樣啟動、在 console 警告
- 規則的 groups 跟桌面版（`patch-rules.mjs`）一樣：`base`（每次都套用，包括英文）、`dict`、`cjk`、`magic-zh`、`magic-ja`（日文魔法物品名稱「前綴 後綴 物品」）、`fullwidth`（只有繁中用全形冒號）、`magic-de`／`magic-fr`／`magic-ru`、`unique-de`／`unique-fr`／`unique-ru`（有詞性的語言組魔法物品和獨特怪物的名字）、`cyrillic`（西里爾字母當外文字畫）、`font-ru`、`latin-ext`（波蘭文 U+0100–017F 當外文字畫）、`font-pl`、`size-pl`（外文字大小）、`magic-pl`、`unique-pl`、`digit5`（七種翻譯語言都有：數字「5」開口）、`caps`（德法俄波：英文原文沒有小寫字母時，譯文用 `toLocaleUpperCase` 轉成全大寫；字典查詢不分大小寫，SHIELDS／Shields 共用一個譯文）。斷行禁則、「暗色字不加描邊」（石頭按鈕的中日文、俄文畫成實心字）跟桌面版相同；網頁版的禁則多一個半形「:」（日文協同加成不在冒號前斷行）
- 只有網頁版有的（2026-10-28，桌面版還沒做）：角色畫面的「Survivor」女性職業查 `title:Survivor:f`（Выжившая、Ocalała；這個字是角色畫面直接寫的，不經過稱號函式）；升級卡片的進化條件在中日文用「、」接（程式在英文後面接半形「,」）；`caps`
- 德、法、俄文的名稱組合：字典的 `affix:`、`unique:` 有每種詞性的形式（「[ms]…[fs]…」），照 `gender:<名詞>` 挑。順序：德文「前綴 物品 後綴」、獨特怪物「前段-後段 稱號」；法文「物品 前綴 後綴」、「後段 前段 稱號」；俄文「前綴 物品 後綴」、「稱號, 前段 後段」；波蘭文「前綴 物品 後綴」、「稱號, 前段 後段」（不改大小寫，複數的詞性是 nl）。輸出要跟桌面版一樣，參考實作是 `work/translation/compose-proto.mjs`；`work/web/compose-check.mjs` 用套好規則的遊戲模組跑同一組例子跟它對照（德法俄波 44 個全部一樣）。規則裡新加的變數都用 `d2` 開頭，免得跟遊戲壓縮後的名稱撞到
- 跟桌面版同名、一起維護的規則：技能變體專用譯名（`modifier:<名稱>`，例如繁中荊棘之靈的 Vengeance 是「復仇」不是聖騎士的「復仇打擊」）、女性職業的稱號（`title:<稱號>:f`，Zerstörerin）、德文多字物品名稱在前綴後面小寫（Robuste schwere Handschuhe）。驗證：`node work/web/new-rules-check.mjs`
- 字型：網頁版沒有 D2R 的字型，改用系統字型（`local()`）註冊成遊戲的外文字字型家族。繁中：微軟正黑體、蘋方 TC、Noto Sans TC；簡中：微軟雅黑、蘋方 SC、Noto Sans SC；日文：遊ゴシック、Meiryo、Hiragino、Noto Sans JP、最後是 MS ゴシック（非日文版的 Windows 常常沒有 Meiryo，`local()` 全部找不到時中日文會退回系統語言的字型，繁中 Windows 上是正黑體，一行裡混兩種字型；遊ゴシック Windows 10／11 都有）；俄文（只註冊 U+0400–04FF）：Philosopher Bold，抓不到時 Segoe UI、Arial、Roboto、Noto Sans（見下一點）。德、法文的字點陣字型本來就有（Latin-1），不用另外的字型；波蘭文（只註冊 U+0100–017F）跟俄文一樣用系統字型。波蘭文只有幾個字母走外文字、夾在點陣字母中間，照韓文的放大比例會大一號，所以標題 ×1.2、內文 ×1.0 不加粗（`size-pl`，有沒有 D2R 韓文字型的兩個分支都改）。桌面版的小按鈕字用 ×1.5、Exocet 先畫 4 倍大再縮小，是 Exocet 的問題；網頁版用系統字型，×1.5 的 Ś 會比點陣大寫高一截，×1.2 剛好，小字的尖音符號也都在（2026-10-27 用最終版 `dict/pl.json` 放大看「NOWOŚCI」「WYJŚCIE」）
- 俄文字型（2026-11-04 起）：系統字型（Segoe UI 等）跟遊戲的風格差很多，改用開放授權的 Philosopher Bold（SIL OFL 1.1，github.com/google/fonts 的 `ofl/philosopher`；沒有保留字型名稱，子集可以照原名）。按鈕（D2R Kodia）和內文（D2R Iris、D2 Hangul…）四個家族共用一個檔：`site/web/fonts/philosopher-bold-cyrillic.woff2`，只留 U+0400–04FF（176 字、16 KB），旁邊放 `OFL.txt`。`WEB_LANGUAGES` 的 `fonts` 可以寫 `{ url }`（相對於 manifest.json，跟字典一樣），書籤換成絕對網址、`core.js` 產生 `url("…") format("woff2")`，後面接原本的系統字型當備用（字型檔抓不到時用）。舊版的 `core.js` 讀到 `{ url }` 會變成 `local("[object Object]")`，找不到就照下一項，一樣能用。子集用 `fontTools.subset --unicodes=U+0400-04FF --flavor=woff2 --layout-features=* --name-IDs=*` 產生（原檔、候選字型的比較在 `work/網頁書籤版本/ru-font-digits.md`）；之後翻譯那邊的 `zh-fonts.mjs` 支援從檔案路徑讀時可以改用它產生
- 數字「5」開口（2026-11-04 起，`digit5`，optional）：font16、font24、font30、font42、fontexocet10 的「5」碗是封閉的，看起來像頂端平的「6」（營地的「法力 35 / 35」原版看起來像 36）。點陣字型的 constructor 拿到圖集時先改「5」那一格：中線以下、最底兩列墨以上，墨（亮度 ≥ peak×0.2）分成兩段以上的列，最後一段（碗的右邊）之前的像素全部清掉，暗的描邊一起清。改之前先算那一格的墨的 FNV-1a，是五種已知的形狀才改（`web-rules.mjs` 的 `FIVE_SHAPES`；自己的 D2R 檔案、替代字型等形狀不一樣的不改，同一份圖集改過之後形狀也不一樣，不會再改一次）。只改一次圖集，之後畫字跟原本一樣，沒有額外成本；只改畫面，不碰排行榜。英文、韓文不套。font42 也是遊戲「D2 Exocet」向量字型的來源，那個字型的 5 也會跟著開口。原型（Python）和規則的函式對 8 個圖集的結果逐像素一樣（`work/網頁書籤版本/five/`）

## 選檔案（setup.html）和 hosted 檔案拿掉之後

2026-11-04 查的（遊戲 20261103.2，研究筆記在 `work/網頁書籤版本/setup-flow.md`）。

遊戲現在有兩種檔案模式，選擇存在 localStorage `d2s:files`（`own`／`hosted`，沒選過是空的；遊戲裡也能改：選項 → 遊戲設定 → GAME FILES）：
- HOSTED FILES：跟以前一樣從網站下載 `/d2/…` 的圖和音效
- USE MY OWN FILES…：選 D2 經典版 1.14（`.mpq`）或 D2R（CASC）的安裝資料夾，`/import/worker.js` 把遊戲要的部分轉成跟 hosted 一樣的 `d2/…` 檔案，寫進瀏覽器的 OPFS（第一次幾分鐘）。之後 Service Worker（`/sw.js`，scope `/`）從 OPFS 回應同網域 `/d2/…` 的 GET。網址、檔名都不變，只是回應的來源換了，所以 `web-rules.mjs` 不受影響

遊戲啟動時怎麼走：
- 電腦、沒選過、網址沒有參數 → 先換到 `setup.html`（新玩家第一次一定會到這頁）
- 選了 own → 檢查抽好的檔案、等 Service Worker 接手（第一次可能自己重新載入一次），有問題就換到 `setup.html?reason=…`
- 觸控手機（`pointer: coarse`）不能用自己的檔案（setup 頁寫「A phone can't read an install」）：hosted 還在時一律用 hosted
- hosted 拿掉 → 遊戲顯示「已停止提供」的頁面（USE MY OWN FILES… ／下載桌面版），不能玩。這頁是遊戲畫的，書籤會翻
- desktop app（`app:`）不受影響：第一行就直接玩，不會到 `setup.html`

書籤怎麼接：
- iframe 先載入 `/robots.txt` 再寫入修改版，所以歸 Service Worker 管（實測 iframe 裡 `navigator.serviceWorker.controller` 有值），用自己的檔案時一樣從 OPFS 讀
- 新玩家按書籤：修改版一開就被換到 `setup.html`，書籤在下方顯示提示；選 HOSTED FILES 後 setup 把 iframe 帶回 `/play/`，書籤自動重開修改版（實測繁中、俄文都直接回到翻譯版的標題畫面）。選自己的檔案抽完也會回 `/play/`，應該一樣接得上（還沒實測，要真的瀏覽器選資料夾）
- 遊戲第一次用自己的檔案自己重新載入時，iframe 會載入原版 `/play/`，書籤一樣換回修改版（算進防無限重新載入的次數）

**hosted 檔案拿掉之後，手機（觸控）不能玩**：手機讀不到安裝資料夾，只會看到「已停止提供」頁（書籤會翻）。電腦要改用「自己的檔案」（D2 1.14 或 D2R）。到時候書籤的手機省電、省記憶體只對有滑鼠的平板和電腦有用。
- 拿掉的時間沒有公布：頁面、FAQ、新聞都只寫「very soon」。開關是網站的 `/site.json`（現在 `{ "hostedFiles": true }`，Last-Modified 2026-10-18），改成 false 立刻生效，不用發新版。網址加 `?hosted=0` 可以模擬拿掉之後的樣子
- 網站上的預告由宣傳網站那邊加

## 排行榜和問題回報：成績照原版上傳，問題回報不送

**2026-11-01 起（使用者決定）：翻譯模式的成績照原版流程上傳排行榜，問題回報維持不送。** 這推翻下面 2026-10-27 的「一律不上傳」。

理由：
- 書籤只改文字和版面，不改玩法；網頁版本來就沒有完整性檢查，書籤沒有讓任何檢查失效
- 一律不上傳讓翻譯玩家不能上榜；而且專家級報到被當成連不上，英雄會被遊戲標成不排名、而且是永久的
- 紀錄照實送：`lang` 是實際的語言（`zh-TW`、`ja`…，切回英文時是 `en`），不偽裝成 `en`；不碰 `tainted`、`navigator.webdriver`、網址的開發參數這些判斷。問題回報不送：翻譯版的錯誤（字串、版面）不該送給原作者

做法：`web-rules.mjs` 拿掉「排行榜：不送出成績／不排進佇列／不送出佇列」三條，只留「回報：不送出」「回報：不送出佇列」。書籤開啟時的提示拿掉「成績不會上傳」那句，只說再按一次書籤回到原版英文。

2026-11-01 查的（遊戲 20261101.1，只看程式和公開的 GET，沒有對 `/api/leaderboard` 送任何測試資料）：
- 紀錄的 `lang` 是語言模組的目前設定（`Game` 組紀錄時 `lang: <目前語言>()`），用戶端沒有限制只能是 `en`／`ko`
- 伺服器收不收其他語言**不知道**：公開的三個難度排行榜 300 筆紀錄（`/api/leaderboard/runs/<id>`）全部是 `en` 或 `ko`（網頁 179、桌面 121），沒有其他語言的例子可以參考
- 伺服器拒收時用戶端的處理（`saveTransfer` 的佇列）：400／422 標成 refused，6 小時後再試，最多 8 次就放棄（記一行 warn）；其他 4xx 直接丟掉；只有連不上、429、5xx 會退避、擋住後面的。所以拒收不會卡住佇列，佇列最多 40 筆、先丟被拒的。回應裡的 `unverified`（會把專家級英雄標成不排名）只在 200／201 時才讀，拒收不會標
- 專家級報到（`/hc/checkin`）的內容是 player、name、build（和已經有的 mark），沒有 `lang`
- 驗證：用 `site/web/core.js` 對抓下來的遊戲模組套 zh-TW 的規則，`saveTransfer` 的送出函式、排進佇列、送出佇列、死亡回報都跟原版一字不差；問題回報的兩處有改。`build-web.mjs` 八種語言全部 ✓。沒有在遊戲裡實際打一局（會送到正式的排行榜）
- 2026-11-02 的遊戲版本把排行榜佇列、死亡回報和問題回報（`/api/report`、`d2s:report-queue`）原封不動搬到新模組 `leaderboardSend`，`saveTransfer` 裡已經沒有。舊規則只對 `saveTransfer`，所以兩條回報規則對不上、書籤載入失敗；改成兩個檔名都接受。同一版的顯示設定在 SHOW DAMAGE 後面多了 WEATHER、SHOW DAMAGE 的說明也改了，省電畫質那一列改成接在 SHOW DAMAGE 前面，只對 `label`、`toggle`，說明再改也對得上。重驗：39 條規則七種語言全部套得上，`leaderboardSend` 的送出、排進佇列、送出佇列、死亡回報跟原版一字不差

### 2026-10-27 的舊決定（已經不適用）

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

書籤改成「再按一次＝重新整理」之後（2026-10-30，正式 manifest 20261030-0013，內建瀏覽器）：
- `default('ja')`，遊戲設定是 zh-TW：開日文，`d2s:lang`、`d2zh:last` 都變成 ja；`default()`：照遊戲設定開 zh-TW（`d2zh:last` 是 ja 也不影響）
- 遊戲選單換成繁中：舊 iframe 的 WebGL context 變成 lost，新的開起來、畫面在跑，25 秒內沒有誤報
- 讓新的 iframe 看起來沒在畫（測試時把 `__d2zhFrames` 固定成 0）、遊戲選單換成英文：21 秒時出現「切換失敗」提示，`d2s:lang` 已經是 en
- 再按一次書籤：頁面重新整理成原版，`d2s:lang` 維持 zh-TW
- 沒在 Android 實機上測

首頁啟動、省電畫質（2026-10-30，正式 manifest 20261030-0013 的字典＋目前的 `web-rules.mjs`，內建瀏覽器）：
- 首頁啟動：網址列變成 `/play/`、標題是遊戲的，iframe 歸 Service Worker 管，遊戲拿到 Web Lock（`d2-survivors/play`）。再按書籤：重新整理成原版 `/play/`
- 首頁啟動後從 iframe 打開 `setup.html` 選 HOSTED FILES：回到 `/play/` 換回修改版（繁中），`d2s:files` 是 hosted。把 `d2s:files` 刪掉再從首頁啟動：遊戲直接用網站的檔案，沒有先去 `setup.html`
- `/play/?class=sorceress&god` 啟動（`default('ja')`）、再按書籤：重新整理，網址參數還在
- wiki 頁面：提示要先打開首頁或遊戲頁面（之前 wiki 也有 `#d2-files`，會去抓 wiki 的模組，提示「需要更新」）
- 省電畫質（手機尺寸 375×812、dpr 2）：關 750×1624 → 開 375×812（1 秒內），再關回 750×1624；用顯示設定的那一列切換也一樣，`d2zh:lowres` 跟著變
- JS heap（`performance.memory.usedJSHeapSize`，手機尺寸，遊戲開始畫之後）：首頁啟動 39～50 MB，`/play/` 啟動 58 MB（原版自己在標題畫面約 30 MB）。只算 JS，貼圖、解碼後的音效等不在裡面，實際差距應該更大

手機尺寸的記憶體（2026-11-03，遊戲 20261103.1，正式 manifest 20261103-1237，zh-TW）：自己開的 headless Chrome 156（另一個設定檔），375×812、dpr 2、Android UA、觸控。每種情況都重開 Chrome、清掉網站資料（像第一次玩），流程是標題（主選單）→ PLAY 進營地 → 傳送點、普通難度打約 100 秒（每 2 秒選第一張升級卡、用方向鍵走）。數字是 JS heap（GC 後）／分頁的 renderer 程序 private／GPU 程序 private，單位 MB：

| 情況 | 標題 | 營地 | 打 100 秒後 |
|---|---|---|---|
| 1. 原版 | 22／239／203 | 74／490／296 | 69／618／475 |
| 2. 首頁按書籤 | 29／297／222 | 81／444／316 | 75／642／492 |
| 3. `/play/` 按書籤 | 49／435／206 | 101／558／270 | 97／773／378 |
| 4. 2＋省電畫質 | 29／298／181 | 81／446／253 | 76／685／361 |

- 打的時候 `d2survivors.lol/api/` 只放行 GET，POST 一律在瀏覽器擋掉（CDP 的 Fetch），四種情況都沒有任何 `/api/` 請求，排行榜收不到東西
- 記憶體主要是遊戲自己的：打的時候 renderer 約 620 MB 裡，malloc 約 300 MB、ArrayBuffer 約 130 MB（heap 快照裡看得到約 34 MB，都是 `Uint8Array`／`Uint8ClampedArray`，應該是解出的精靈圖）、Blink 的 buffer 約 100～170 MB、V8 約 35 MB；GPU 程序 300～500 MB（貼圖）。遊戲資料 JSON 解開 12 MB（scenery.json 6.4 MB），解析後的物件只有幾 MB，原文沒有留著
- 首頁按書籤比原版多：JS heap 約 6～7 MB，renderer、GPU 的差在量測誤差裡（±50 MB 內、有多有少；原版重量兩次，打完的 renderer 差 26 MB）。多出來的是：原版模組的原始碼約 4.3 MB（`d2zh.js` 的 `game.modules`，換語言重建要用；iframe 裡編譯的是改過的那份，所以等於兩份）、字典模組的原始碼 1.3 MB（字典用 `export default {…}` 的模組載入，V8 會一直留著原始碼）加上解析後的字典約 2 MB、字型快取 1.7 MB。改過的模組放在 blob（browser 程序，約 6 MB），iframe 之後還會動態載入，不能先 revoke
- `/play/` 按書籤比首頁多：JS heap 約 20 MB、renderer 110～140 MB。停掉的原版只停了畫面、聲音、計時器，它的模組、遊戲資料、解出的圖都還被頁面拿著，放不掉
- 省電畫質：遊戲的 2D 疊層 canvas 從 750×1624 變 375×812（renderer 的 canvas 11 → 4 MB），GPU 程序三個階段都比情況 2 少 40～130 MB（只量一次）。這次 WebGL canvas 本來就是 375×812（遊戲自己挑的解析度），所以 WebGL 沒變；遊戲用 2 倍解析度時（之前量過 600×1299、750×1624）WebGL 的 drawingBuffer 也會跟著變小
- 書籤能省的：從 `/play/` 啟動最多（約 20 MB JS、100 MB 以上程序記憶體），可以在手機上改成提示「改從首頁開」或自動回首頁；原版模組原始碼不留、換語言時再從快取抓，約 4 MB；字典改用 JSON 讀，約 1 MB。遊戲自己的圖、聲音、資料不是書籤能動的
- 不是實機：headless Chrome 在電腦上跑，絕對值跟 Android 不一樣，只看各情況的差

setup.html 的提示（2026-11-04，遊戲 20261103.2，正式 manifest 20261103-1513，本機的 `site/`；自己開的 headless Chrome，1000×750、dpr 2）：清掉網站資料 → 首頁按書籤（繁中、俄文）→ iframe 換到 `setup.html`，下方顯示提示 → 點 HOSTED FILES → 回到 `/play/` 的修改版（標題畫面是翻譯版），提示收起來，`d2s:files` 是 hosted。`/api/` 只放行 GET，沒有任何 POST。截圖在 `work/網頁書籤版本/shots/hint-*.png`

俄文字型、數字 5（2026-11-04，遊戲 20261103.2；測試站 `work/網頁書籤版本/site-test2/` 是 `site/web` 加上正式 manifest 20261103-1513 的字典、目前的 `web-rules.mjs` 規則，另外多一條只在測試站的規則把點陣字型放進 `__d2zhFonts`，用遊戲自己的字型畫數字；自己開的 headless Chrome，1000×750、dpr 2）：
- 七種語言都從首頁按書籤：主選單、新聞、設定正常（`work/網頁書籤版本/shots/five/<語言>-*.png`、`shots/five/menus.png`）
- 俄文：四個字型家族都是 loaded，`philosopher-bold-cyrillic.woff2` 只在俄文時抓；主選單按鈕跟之前比較圖的 Philosopher Bold 一樣
- 數字：七種語言 font16、font24、font30、font42、fontexocet10 的 5 都開口，font6、font8、fontformal12 不變；在遊戲裡換成英文時是原版的 5（`work/網頁書籤版本/shots/five/digits-*.png`）。營地的 HUD：英文「MANA: 35 / 35」看起來像 36，繁中「法力：35 / 35」是開口的 5（`work/網頁書籤版本/shots/five/hud-en-vs-zh-TW.png`，同一個英雄）
- `/api/` 只放行 GET，沒有任何 POST

Web Lock（2026-11-05，遊戲 game-DLW6qfcM.js，正式 manifest 20261105-1104，本機的 `site/`；自己開的 headless Chrome，1000×750，`d2s:files`＝hosted，`/api/` 只放行 GET，沒有任何 POST）：
- 重現（改之前）：用 CDP 把原版的 `/site.json` 延遲 1.5 秒、iframe 的延遲 4 秒，`/play/` 一開就按書籤 → 原版停掉之後才拿到鎖，iframe 一直是「open in another tab」。原版延遲 6 秒（iframe 先拿到）→ 原版排在 iframe 後面，換成日文時原版拿到鎖，新的 iframe 一樣卡住
- 只用 CPU 降速（6 倍）沒有重現：原版還沒送出 `/site.json`，被停掉的 `fetch` 擋住
- 改之後：上面兩種都正常進到繁中、換日文正常，鎖只在 iframe 手上、沒有排隊的請求。首頁一開就按（`/site.json` 延遲 8 秒）也正常
- 正常時機按、再按一次（重新整理成原版）、重新整理後再按、換日文、換俄文：都正常，每次鎖都在目前的 iframe
- 另一個分頁先開著原版：按書籤後 iframe 照原版顯示「open in another tab」；把那個分頁關掉，3 秒內 iframe 拿到鎖、進到繁中（改之前會被停掉的原版拿走，一直卡住）
- 沒在手機實機上測

還沒測：USE MY OWN FILES 實際讀檔、Safari／Firefox、手機、遊戲中的升級卡片和物品名稱（日文的魔法物品順序、禁則斷行只用 `build-web.mjs` 確認規則套得上；德法俄的名稱組合用 `compose-check.mjs` 對照過，沒有在遊戲畫面上看過）。

## 待辦

- 選檔案的 `setup.html` 是原版英文頁面（決定不翻，只顯示提示）
- USE MY OWN FILES 在真的瀏覽器裡實測（選資料夾、抽完、按書籤看翻譯和讀檔）：聊天室管理那邊做
