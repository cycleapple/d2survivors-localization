# 網頁版書籤（site/web/）

在 https://d2survivors.lol/play/ 用瀏覽器玩時，用書籤套用繁中（電腦、手機都可以）。網站「瀏覽器版」分頁的「安裝書籤」區塊有拖曳安裝的按鈕和手機用的程式碼；書籤是 `javascript:import('<網站>/web/d2zh.js').then(m=>m.default())`，網站部署在哪裡就指到哪裡。

> 書籤裡寫死了網站網址，玩家裝好之後網址就不能再換。公開宣傳前要先決定好網域。

```
node tools/build-web.mjs            # 產生 site/web/rules.json、site/web/zh-TW.json（字典改了就要重跑）
node tools/build-web.mjs --check    # 抓線上的網頁版，檢查每條規則都套得上、改完的模組語法正確
node tools/serve.mjs site 8766      # 本機預覽（允許跨網域讀取）；launch.json 的 site-cors
```

- 做法跟桌面版一樣用遊戲內建的翻譯系統，不是蓋一層字上去：書籤抓下遊戲頁面和全部模組（約 44 個），套用 `tools/web-rules.mjs` 的修改，做成 blob 網址，用 import map 換掉原本的模組，再在同網域的 iframe 裡重新開一次遊戲。原版遊戲（外層頁面）會先停掉：送 `pagehide` 讓它存檔、放掉防止開兩個分頁的 Web Lock；送一個 F24 按鍵讓它讀 AudioContext 再關掉（不然背景音樂會兩份）；停掉 rAF、計時器、WebGL
- iframe 先載入 `/robots.txt` 再把修改版寫進去：這樣才歸遊戲的 Service Worker（scope `/`）管，「USE MY OWN FILES」模式靠它從 OPFS 讀 D2 檔案
- 網頁版多一個語言 `zh`（localStorage `d2s:lang` = `zh`），不佔韓文的位置；原版遊戲讀到 `zh` 不認得，會照瀏覽器語言回到英文，所以重新整理後不會卡在看不懂的語言
- 再按一次書籤＝中英切換；遊戲裡「選項 → 遊戲設定 → 語言」換語言時，修改版會請外層重新開一次修改版（不然 `location.reload()` 會載入原版）
- 網頁版改版比桌面版頻繁、壓縮後的變數名稱會變，所以 `web-rules.mjs` 用 regex（變數名稱抓下來再放回去），跟桌面版的 `patch-rules.mjs` 分開。必要的規則（語言選單、接受 zh、載入字典、外文字判斷）沒套上就不啟動，提示「中文化需要更新」；其他的標 `optional`，沒套上照樣啟動、在 console 警告
- 中文字型：網頁版沒有 D2R 的繁中字型，改用系統字型（`local()` 微軟正黑體、蘋方、Noto Sans TC）註冊成遊戲的外文字字型家族
- 已在 Chrome（內建瀏覽器）用 HOSTED FILES 測過：標題、主選單、選項、營地、升級卡片都是中文，書籤切換、遊戲內換語言、舊的背景音樂關掉都正常。還沒測：USE MY OWN FILES 模式實際讀檔、Safari／Firefox、手機

注意：`site/web/zh-TW.json` 就是 `dict/zh-TW.json`，含有暴雪的官方字串。書籤要從公開網址讀字典，網站公開時這個檔案也跟著公開（公開界線見 [release.md](release.md)）。

## 待辦

- 只有繁中：改讀 manifest v2，簡中、日文也能選（見 [manifest-v2.md](manifest-v2.md) 的「網頁版」）
