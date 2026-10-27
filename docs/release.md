# 開源與發布

## repo

- 主 repo（這個資料夾）：程式、網站、書籤、字典、文件。打算公開
- 程式碼用 MIT（見 [LICENSE](../LICENSE)）。翻譯（`dict/` 和產生出來的字典）的授權還沒決定，在那之前保留所有權利
- 舊的更新來源 repo `cycleapple/d2survivors-zh-tw-dist`（本機 `dist/`）：v2 上線後封存，見 [manifest-v2.md](manifest-v2.md)

## 公開界線（2026-10-27 決定）

`dict/zh-TW.json` 裡有 70%（8,856／12,616 條）是 D2R 官方譯文，照 D2R mod、資料庫網站的慣例直接公開，跟 D2 Survivors 本身附上取自 D2R koKR 的韓文字典一樣。

- 公開：遊戲用的對照表（`dict/`、`site/data/`、`site/web/` 的字典）和 manifest。README 有非官方聲明、Blizzard 版權註記、權利人要求就移除
- 不公開（`.gitignore` 已排除）：
  - D2R 原始字串檔（`data/d2r-strings/`）、字型、任何美術音效
  - 遊戲本身的檔案：原版 `app.asar`（`backup/`）、從遊戲抽出的 key 和韓文（`versions/`）、從遊戲複製的 CASC 讀取器（`work/casc-reader.cjs`）
- 收到下架要求的備案：repo 只放自己翻的部分，官方譯名由啟動器在玩家電腦上從他的 D2R 取出配對（`build-glossary.mjs` 的邏輯；可以借用遊戲 `extract-worker.cjs` 的 CASC 讀取器）。代價是沒裝 D2R 的玩家會少掉官方譯名

## 發布流程（目標）

1. **翻譯有變動**：`node tools/publish.mjs` → 合併所有語言、產生 `site/data/`（manifest v2 和字典）→ commit、push → GitHub Actions 部署 Pages。啟動器和書籤下次開啟就會拿到
2. **遊戲改版**：桌面版照 [translation.md](translation.md) 的「遊戲更新後的流程」改 `patch-rules.mjs`；網頁版跑 `node tools/build-web.mjs --check`，對不上就改 `web-rules.mjs`。都改完再 `publish`
3. **啟動器有新版**：推 tag `launcher-v<版本>` → GitHub Actions 編譯、建立 Release → 下次 `publish` 時 manifest 的 `launcher.latest` 跟著更新
4. **網站內容改了**：push 就會部署
5. **新語言上線**（draft → beta → available）：
   1. 翻譯：翻完、列出需要的規則
   2. 啟動器、網頁書籤：各自加規則（`patch-rules.mjs`、`web-rules.mjs`）
   3. 翻譯：改成 beta，`changelog-next.json` 寫 `kind: language`、`announce: true`，發布，再通知宣傳網站
   4. 宣傳網站：加該語言的網站頁面（`/<語言>/`），更新語言清單；再請 Discord 聊天室更新置頂的語言列表

## 正式版（available）的標準

使用者決定（2026-10-27）：**所有語言都是正式版才公開上線**。每種語言要全部通過下面 1～6 項，才能從 beta 改成 available：

1. **對應最新的遊戲版本**：遊戲更新後的新字串全部補翻，覆蓋 100%
2. **自動檢查全過**：check-batch、check-alignment、term-analysis（佔位符、數字、對錯 key、用語不一致、大小寫撞名）都是 0
3. **遊戲裡沒有漏翻**：用 make-debug 版走一遍（標題、主選單、選項、營地、七個職業的技能樹、升級卡片、物品欄、商店、各章節、改版說明），missing-report 為 0，包含句子樣板
4. **畫面沒有問題**：桌面版（啟動器）和網頁版（書籤）各截一套關鍵畫面，沒有超出框、沒有「?」或豆腐字、字型正常
5. **第二輪審稿**：另一個代理用乾淨的上下文獨立審，範圍是全部介面字串加上隨機 300 條，用語跟 D2R 官方譯名對照
6. **已知問題清零**：`docs/review-todo.md`、各語言的待辦（例如法文 Stash／寶箱都是 coffre、技能變體名稱的一致性）
7. **（建議，不擋上線）母語玩家抽查**：在 Discord 找各語言玩家看 20～30 分鐘，回報不自然的地方

另外，啟動器的介面文字（`launcher/src/i18n.rs`）也要有該語言，不能退回英文。

順序：遊戲先更新到最新版 → 跑「遊戲更新後的流程」→ 各語言依序跑 1～6 項（繁中 → 簡中 → 日文 → 德、法、俄、波蘭文；一次一兩種，控制用量）→ 全部改成 available → 公開上線

## 公告

- **更新紀錄**：每次發布自動寫進 `site/data/changelog.json`，網站和啟動器會顯示（格式見 [manifest-v2.md](manifest-v2.md) 的「更新紀錄」）
- **Discord**：
  - #announcements（更新公告）：`.github/workflows/announce.yml` 在 push 到 main、`changelog.json` 有新的 `announce: true` 項目時發文。webhook 網址存在 repo 的 secret `DISCORD_WEBHOOK_UPDATES`
  - #alerts（STAFF，只有 Moderator 看得到）：Web check 失敗時通知，secret `DISCORD_WEBHOOK_ALERTS`
  - webhook 網址等於發文權限，不進 repo、不貼在對話裡
- **哪些要公告**：平常修譯文只進更新紀錄。新語言、語言升級成 beta／available、遊戲改版修好、啟動器新版才發 Discord
- **論壇**（PTT、巴哈姆特、Bilibili、Reddit）：只發里程碑（正式上線、新增語言），手動貼。標明非官方、一句話講重點、附網站連結

## 公開前的檢查

- [ ] 網址定案（GitHub Pages 預設網址或自己的網域）；書籤和啟動器的預設 manifest 網址都指過去
- [ ] 第一個啟動器 Release 發好，網站下載按鈕連得到
- [ ] manifest v2 上線，啟動器、書籤都能選三種語言
- [ ] 主 repo 改公開：`gh repo edit cycleapple/<repo> --visibility public --accept-visibility-change-consequences`
- [ ] commit 作者信箱：公開後看得到。要隱藏的話，公開前改成 GitHub 的 noreply 信箱
- [ ] 通知 D2 Survivors 作者（書籤會修改他的網頁版遊戲）
- [ ] 公告：PTT、巴哈姆特、Bilibili、Discord
