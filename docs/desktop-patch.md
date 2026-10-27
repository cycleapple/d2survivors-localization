# 桌面版的修改（app.asar）

修改規則在 `tools/patch-rules.mjs`，`tools/patch.mjs` 和啟動器共用同一份（啟動器從 manifest 讀，見 [manifest-v2.md](manifest-v2.md)）。網頁版的規則另外在 `tools/web-rules.mjs`，見 [web.md](web.md)。

## 驗證結果（2026.1026.4）

- Electron fuse `EnableEmbeddedAsarIntegrityValidation` 是關閉的，重新打包的 asar 可以正常載入。
- patch.mjs 修改的地方（每一處都先檢查只出現一次，遊戲改版後對不上就會報錯）：
  1. `ko-*.js` 換成繁中字典（格式：英文原文 → 譯文，支援 `*`、`#`、`{0}`）
  2. `lang-*.js`：選單名稱 `한국어` 改成 `繁體中文`，`<html lang>` 改成 `zh-Hant`
  3. 點陣字型的「外文字」判斷（原本只有韓文）加上漢字、中文標點、全形字元。沒有這一步，中文會畫成 `?`
  4. 魔法物品名稱組合不加空格。順序（後綴、前綴、物品）遊戲本來就對，跟 D2R 繁中的 `MagicFormat` `%2%0%1` 一樣，只是韓文版會加空格（`%2 %0 %1`）。例如「能量之緋紅便帽」
  5. 「標籤: 值」整句查不到、分開翻再接回去時，標籤是中文就接成全形「：」不加空格（原本會變成「需要等級：: 1」）
  6. 點陣字型的斷行：中文可以在任何字之間斷行，句末標點跟著前一個字（原本只在空白處斷，中文句子會整行超出）
  7. 標題畫面、主選單底部的版權聲明：中文時第一段的寬度上限從 700 縮成 360，在句號處折成兩行（原本中文只排一行，太寬會蓋到左下角的版本號）。© 那行和英文照原本的 700
  8. 中文字型：用跟韓文字型同樣的字型家族名稱（D2R Kodia、D2R Iris、D2 Hangul…）註冊 `fonts-zh/body.woff2`，字元範圍限定中文。字型是 D2R 繁中的內文字型 Blizzard Global TC，由 `tools/zh-fonts.mjs` 從本機 D2R 取出，只有本機打包才會放進去（暴雪的字型不能公開）。沒有字型檔時照舊用系統字型。D2R 的標題字型方新書試過，筆畫太細、在石頭按鈕上更難讀，所以不用
  9. 暗色字（石頭按鈕上的字）：遊戲照點陣字型推算顏色時，把黑字邊緣較淡的像素誤判成「灰色填色＋黑色描邊」，中文像空心的灰字。最後的填色很暗（最亮 < 75）又比描邊淡時，改成只用描邊色畫實心字，再往右 1 像素多畫一次當粗體。升級標題那種褐金色（97）和金字、白字不受影響
  10. 技能變體專用譯名：變體表定義完之後，把每個變體的 `name` 換成 getter，翻譯時先查 `modifier:名稱`（`dict/manual/modifiers.json`），查不到照一般譯名；英文照原本。用來分開跟別的技能同名的變體（荊棘之靈的「復仇」vs 聖騎士的「復仇打擊」），原因和清單見 [term-decisions.md](term-decisions.md)

  `tools/compare-shots.ps1` 可以把兩張截圖的同一塊放大並排，比較改前改後；`node tools/cdp.mjs 9229 preload "<js>"` 可以在頁面載入前掛上攔截（例如記錄 `fillText` 用的顏色）

## 測試

用 `"D2 Survivors.exe" --remote-debugging-port=9229` 啟動遊戲，再用 `node tools/cdp.mjs 9229 shot|click|key|eval ...` 截圖或操作。

測試翻譯結果不用進遊戲操作：遊戲開著時，在頁面裡 `import('../assets/lang-*.js')` 會拿到遊戲正在用的同一個模組，`d(文字)` 是一般翻譯，`f('monster', 名稱)` 是怪物這類有前綴的，`p(名稱, 'magic', 底材)` 是魔法物品。例如：

```
node tools/cdp.mjs 9229 eval "(async()=>{const m=await import(new URL('../assets/lang-YSuWKZSI.js',location.href).href);return m.d('Chain Lightning')})()"
```
