# 桌面版的修改（app.asar）

修改規則在 `tools/patch-rules.mjs`，`tools/patch.mjs` 和啟動器共用同一份（啟動器從 manifest 讀，見 [manifest-v2.md](manifest-v2.md)）。網頁版的規則另外在 `tools/web-rules.mjs`，見 [web.md](web.md)。

## 不怕小改動的寫法：find／replace（啟動器 1.0.3 起）

- 規則原本逐字比對壓縮後的程式碼（`from`／`to`），遊戲改版、壓縮後的名稱一換就對不上（2026.1027.4 壞了 5 條）。現在每條規則另外有 `find`（regex）和 `replace`，壓縮後的名稱用群組抓下來再放回去，跟網頁書籤的 `web-rules.mjs` 同一個做法；兩邊是同一份遊戲程式碼，比對的寫法（壓縮名稱用 `([A-Za-z0-9_$]+)`、同一個名稱用反向參照）一樣
- 寫在 `patch-rules.mjs` 最後的 `ROBUST`：`T(樣板, 換成)`，`‹1›`、`‹2›`… 是壓縮後的名稱（第一次出現時抓下來，之後要一樣），`‹n*›` 是任意一段（最短）。規則加進去的變數名稱都用 `$` 開頭，不會跟抓到的名稱撞在一起
- 程式碼裡拿不到的名稱不再依賴：女性職業的名單直接寫出來、標題字型家族直接比對 `D2R Kodia`、魔法物品的 key 正規化照遊戲寫在規則裡。Survivor 和變體名稱需要翻譯函式，改成在語言模組放查詢函式（`globalThis.__d2Survivor`、`globalThis.__d2Mods`，各一條規則），用的地方 `?.`／`||` 保護，查詢函式那條對不上也不會出錯
- 升級卡片的頓號用同一個函式裡翻譯標題的函式；HUD 的頓號（網頁元素）改成條件後面另外接一段「、」，條件本身交給遊戲的網頁翻譯
- 套用：`patch-rules.mjs` 的 `applyRule`（`patch.mjs`、`check-rules.mjs`、`work/launcher/verify.mjs` 都用它），啟動器是 `patcher.rs` 的 `Find`：Rust 的 regex 沒有反向參照，換成新的群組、比對到之後確認一樣；`$1` 的代換兩邊一樣（`expandReplace`／`expand`，有單元測試）
- `from`／`to` 照樣保留給舊版啟動器（1.0.0～1.0.2）。只有新版才需要的兩條查詢函式，`from`＝`to`＝語言模組裡的 `` `d2s:lang` ``，舊版套用等於不改。`check-rules.mjs` 另外列一行「舊版啟動器對不上幾條」
- 驗證（2026-10-28）：2026.1027.2、2026.1027.4 兩個版本的原版，每條規則都剛好符合一次；七種語言用啟動器（1.0.3）裝進遊戲複本，跟 Node 的 `applyRule` 每個檔案都一樣、改過的 .js 語法都正確，English／한국어還原成原版的 sha。2026.1027.2 上 1.0.2 要略過 2～4 條，1.0.3 一條都不用略過。實機：兩個版本的德文 Überlebende、波蘭文 WYJŚCIE 的符號、繁中版權聲明折兩行、升級卡片的「、」；執行中檢查魔法物品名稱組合（Robustes beschlagenes Leder des Fuchses）、全大寫（SCHILDE、ЩИТЫ）、兩個查詢函式
- 跟原本逐字比對的輸出比：規則加進去的變數名稱改成 `$` 開頭、上面那幾個不再依賴名稱的地方寫法不同，效果一樣
- 遊戲改版後先跑 `node tools/check-rules.mjs <新版解開的資料夾>`；find 對不上的才要改樣板（`tools/find-anchors.mjs` 還能幫忙找舊寫法的位置）

## 必要和加分的規則（啟動器 1.0.2 起）

- 規則標 `optional: true` 的是**加分**的：稱號、名稱組合、斷行、標點、大小寫、版面寬度、變體名稱、暗色字、日期等。對不上時略過那一條，照樣套用翻譯；啟動器主畫面一行提示「遊戲剛更新，部分細節修正中（略過 N 項修改）」，略過的清單記在 `state.json` 的 `installed.skipped`
- 沒標的是**必要**的（9 條）：啟動器指定語言、語言選單名稱、頁面語言標記、外文字判斷（中日文、西里爾字母、拉丁擴充 A）、中文／俄文／波蘭文字型；加上字典位置。對不上就整個退回原版，主畫面顯示黃色卡片
- `tools/patch.mjs` 一樣：加分的對不上時印警告、略過，必要的對不上就停下來
- `tools/check-rules.mjs` 分開列「必要失敗」「加分失敗」；exit code 只在必要失敗（或找不到字典位置）時是 1。最後一行是給自動偵測讀的 `RESULT required_failed=<n> optional_failed=<n>`
- 舊版啟動器（1.0.0、1.0.1）不認得 `optional`（serde 沒設 deny_unknown_fields，直接忽略），照舊一條對不上就退回原版
- 2026.1027.4 的例子：壞掉的 5 條（女性稱號 2 條、波蘭文符號、版權寬度、變體名稱）都是加分的，1.0.2 會照樣套用翻譯

## 驗證結果（2026.1026.4）

- Electron fuse `EnableEmbeddedAsarIntegrityValidation` 是關閉的，重新打包的 asar 可以正常載入。
- patch.mjs 修改的地方（每一處都先檢查只出現一次，遊戲改版後對不上就會報錯）：
  1. `ko-*.js` 換成選的語言的字典（格式：英文原文 → 譯文，支援 `*`、`#`、`{0}`）
  2. `lang-*.js`：選單名稱 `한국어` 改成該語言的名稱（`繁體中文`／`简体中文`／`日本語`），`<html lang>` 改成 `zh-Hant`／`zh-Hans`／`ja`。各語言套用哪些規則看 `patch-rules.mjs` 的 `LANGUAGES[].groups`（manifest 的 `languages[].desktop.groups`）
  3. 點陣字型的「外文字」判斷（原本只有韓文）加上漢字、中文標點、全形字元。沒有這一步，中文會畫成 `?`
  4. 魔法物品名稱組合不加空格。順序（後綴、前綴、物品）遊戲本來就對，跟 D2R 繁中的 `MagicFormat` `%2%0%1` 一樣，只是韓文版會加空格（`%2 %0 %1`）。例如「能量之緋紅便帽」
  5. 「標籤: 值」整句查不到、分開翻再接回去時，標籤是中文就接成全形「：」不加空格（原本會變成「需要等級：: 1」）
  6. 點陣字型的斷行：中文可以在任何字之間斷行，句末標點跟著前一個字（原本只在空白處斷，中文句子會整行超出）
  7. 標題畫面、主選單底部的版權聲明：中文時第一段的寬度上限從 700 縮成 360，在句號處折成兩行（原本中文只排一行，太寬會蓋到左下角的版本號）。© 那行和英文照原本的 700
  8. 中文字型：用跟韓文字型同樣的字型家族名稱（D2R Kodia、D2R Iris、D2 Hangul…）註冊 `fonts-zh/body.woff2`，字元範圍限定中文。字型是 D2R 繁中的內文字型 Blizzard Global TC，由 `tools/zh-fonts.mjs` 從本機 D2R 取出，只有本機打包才會放進去（暴雪的字型不能公開）。沒有字型檔時照舊用系統字型。D2R 的標題字型方新書試過，筆畫太細、在石頭按鈕上更難讀，所以不用
  9. 暗色字（石頭按鈕上的字）：遊戲照點陣字型推算顏色時，把黑字邊緣較淡的像素誤判成「灰色填色＋黑色描邊」，中文像空心的灰字。最後的填色很暗（最亮 < 75）又比描邊淡時，改成只用描邊色畫實心字，再往右 1 像素多畫一次當粗體。升級標題那種褐金色（97）和金字、白字不受影響
  10. 技能變體專用譯名：變體表定義完之後，把每個變體的 `name` 換成 getter，翻譯時先查 `modifier:名稱`（`dict/manual/modifiers.json`），查不到照一般譯名；英文照原本。用來分開跟別的技能同名的變體（荊棘之靈的「復仇」vs 聖騎士的「復仇打擊」），原因和清單見 [term-decisions.md](term-decisions.md)

  11. 德、法、俄文的魔法物品名稱（magic-de／magic-fr／magic-ru）：照 `gender:<物品>` 從 `affix:` 的「[ms]…[fs]…」挑出對應詞性的形式。德文「前綴 物品 後綴」（前綴結尾是「 -」時用連字號接：Engels-Ring）、法文「物品 前綴 後綴」、俄文「前綴 物品 後綴」（物品小寫開頭）；德、俄文句首大寫
  12. 德、法、俄文的獨特怪物名字（keepSave 的 `Ma`，unique-de／unique-fr／unique-ru）：德文「前段-後段 稱號」、法文「後段 前段 稱號」、俄文「稱號, 前段 後段」；法、俄文的前段照 `gender:<後段>` 挑形式。參考實作是 `work/translation/compose-proto.mjs`（網頁書籤的 `web-rules.mjs` 輸出要一樣）
  13. 俄文（cyrillic）：西里爾字母 U+0400–04FF 也當外文字畫（點陣字型沒有，原本畫成「?」）；第 9 項的暗色字修正也套用（按鈕上的黑字原本一樣是空心的灰字）
  14. 俄文字型（font-ru）：用同樣的字型家族名稱註冊，範圍 U+0400-04FF，D2R Kodia（標題字型）用 `title.woff2`（D2R 的 Exocet），其他用 `body.woff2`（Philosopher）。檔案由 `zh-fonts.mjs … --lang ru` 產生到 `work/fonts/ru/`，跟中文一樣放進 `fonts-zh/`，只有本機打包才有；從啟動器套用時用系統字型（Chromium 的預設字型，有襯線，可以讀，2026.1027.1 實測沒有「?」）

  15. 波蘭文（群組名稱跟網頁書籤一樣：latin-ext、font-pl、size-pl、magic-pl、unique-pl）：
      - 拉丁擴充 A（U+0100–017F，ą ć ę ł ń ś ź ż）當外文字；第 9 項的暗色字修正也套用
      - 字型：D2R Kodia（標題）← `title.woff2`（Exocet），其他 ← `body.woff2`（Formal436），`zh-fonts.mjs … --lang pl` 產生到 `work/fonts/pl/`，只有本機打包才有；從啟動器套用時用系統字型
      - 大小：只有幾個字母走外文字、夾在點陣字母中間，照韓文的放大比例會大一號。標題 ×1.2、內文 ×1.0、不加粗；沒有 D2R 韓文字型時（桌面版通常是這樣）原本是固定的 12／15／24 px，也改成同樣的算法，標題一律用 D2R Kodia 家族。小的標題字（按鈕的 fontexocet10，字高不到 16）用 ×1.5：Exocet 的大寫只有 0.59 em，×1.2 時 Ś 比旁邊的點陣大寫矮一截
      - 符號：Exocet 的 Ś、Ć、Ź 在 11、13 px 直接畫時尖音符號會整個消失（12、14 px 又有；不是被切掉），所以標題家族改成在 4 倍大的暫存 canvas 畫再縮小貼回去。符號高出文字 canvas 時先往下移、放不下的部分垂直壓扁。內文字型直接畫（縮小會糊掉）
      - 魔法物品「前綴 物品 後綴」、獨特怪物「稱號, 前段 後段」，都不改大小寫；複數物品的詞性是 nl
      - 2026.1027.1 實測（有字型、系統字型兩種）：主選單 NOWOŚCI、WYJŚCIE 的符號都在，大小跟點陣大寫一致；選項頁大標題 DŹWIĘKU 正常

  16. 日期格式（dict）：遊戲在語言是 ko 時寫死韓文的日期（「10월 27일」），翻譯放在 ko 槽位，排行榜的日期會變成韓文。改成照 `<html lang>` 用 `toLocaleDateString`（繁中「10月27日」、德文「27. Okt.」）。2026.1027.2 實測排行榜

  17. 女性職業的稱號（gender，德、法、俄、波蘭文）：amazon、assassin、sorceress 先查 `title:<稱號>:f`，查不到照 `title:<稱號>`。稱號函式（Game）和角色畫面沒有稱號時直接寫的「Survivor」（saveTransfer 的 `fit(\`Survivor\`)`）都套用（俄文「Выжившая」）。只放在有 `:f` key 的語言：其他語言查不到時，翻譯器可能把「Survivor:f」拆開翻
  18. 全大寫（caps，德、法、俄、波蘭文）：翻譯器查字典不分大小寫，SHIELDS 和 Shields 是同一個譯文。英文原文有兩個以上大寫字母、沒有小寫字母時，譯文用 `toLocaleUpperCase(<html lang>)` 轉成全大寫（`translate` 和 `translateAs` 的完全符合）。主選單 НАСТРОЙКИ、拾取篩選器、控制器設定、死亡畫面的按鈕
  19. 進化條件（cjk）：升級卡片和 HUD 的條件之間，遊戲接半形「,」，中日文改成「、」（條件先翻譯好再接）。中文斷行的「不放在行首」加上半形 `: ; , . ! ? )`（日文「ライトニングセントリー: +4%」不會斷在冒號前）
  20. 中日文的系統字型（cjk）：沒有 `fonts-zh/body.woff2` 時（從啟動器套用的都是這樣），原本交給 Chromium 照字挑字型，簡中同一行混用兩種字型、日文粗體用到中文字型。改成先用 `local()` 註冊這個語言的系統字型（簡中微軟雅黑、日文遊ゴシック Medium／メイリオ、繁中微軟正黑），再註冊字型檔；同一個家族裡後註冊的優先，字型檔缺的字才用系統字型。本機打包時 patch.mjs 放進去的字型照語言分：繁中 `work/fonts-zh/`、簡中 `work/fonts/zh-CN/`、日文 `work/fonts/ja/`（`langs.mjs` 的 `fonts`）

  17～20 是翻譯聊天室截圖檢查的需求（`work/qa/RULE-REQUESTS.md` 1～5），補截圖在 `work/qa/<語言>/desktop/*-fix.png`

  `tools/compare-shots.ps1` 可以把兩張截圖的同一塊放大並排，比較改前改後；`node tools/cdp.mjs 9229 preload "<js>"` 可以在頁面載入前掛上攔截（例如記錄 `fillText` 用的顏色）

## 測試

用 `"D2 Survivors.exe" --remote-debugging-port=9229` 啟動遊戲，再用 `node tools/cdp.mjs 9229 shot|click|key|eval ...` 截圖或操作。

測試翻譯結果不用進遊戲操作：遊戲開著時，在頁面裡 `import('../assets/lang-*.js')` 會拿到遊戲正在用的同一個模組，`d(文字)` 是一般翻譯，`f('monster', 名稱)` 是怪物這類有前綴的，`p(名稱, 'magic', 底材)` 是魔法物品。例如：

```
node tools/cdp.mjs 9229 eval "(async()=>{const m=await import(new URL('../assets/lang-YSuWKZSI.js',location.href).href);return m.d('Chain Lightning')})()"
```
