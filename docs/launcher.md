# 啟動器（launcher/，Rust）

選語言（manifest 裡有的翻譯：繁體中文、简体中文、日本語、Deutsch、Français、Русский；加上 English／한국어原版）後按「啟動遊戲」：自動下載新的翻譯、修改 app.asar、用選的語言開遊戲。

```
cd launcher && cargo build --release        # → launcher/target/release/d2s-launcher.exe
cargo test --release                        # 有 backup/2026.1026.4/app.asar 時會多測重新打包
```

## 視窗

- **語言畫面**（第一次開啟時最先出現；「設定」→「重新執行設定精靈」也從這裡開始）：只有標題列的 D2 圖示和程式名稱，加上兩欄的語言卡片（manifest 裡有 `desktop` 的語言，加上 English、한국어）。卡片上是語言名稱（大字）和狀態（小字），都用那個語言自己寫（简体中文／测试中、Русский／бета，`i18n::native_status`），不用國旗。沒有步驟指示、沒有說明文字（玩家這時還沒選語言），底下只有一個「→」。預設選 Windows 的地區格式對應的語言（`GetUserDefaultLocaleName`，zh-TW／zh-HK → 繁中、zh-CN → 簡中、ja／de／fr／ru／pl／ko，其他用英文）。選的語言同時決定啟動器的介面語言和遊戲的翻譯語言
- **設定精靈**（選完語言之後，全部用選的語言）：上方是步驟指示（① 遊戲 — ② Diablo II — ③ 完成，目前的用金色），底下是「上一步／下一步（找不到時是略過）／完成」；第一步的「上一步」回到語言畫面
  1. D2 Survivors：沿用 `game_dir` 的偵測（預設 `%LOCALAPPDATA%\Programs\D2 Survivors`），可以手動選資料夾。沒裝時給官方網站按鈕和「重新偵測」，也可以略過
  2. Diablo II：依序找 D2 Survivors 自己記的 `%APPDATA%\D2 Survivors\desktop.json` 的 `installDir`、D2R 的解除安裝登錄（`InstallLocation`）、經典版的登錄（`InstallPath`）、`Program Files (x86)` 下的預設資料夾；資料夾裡有 `D2R.exe` 算 D2R，有 `d2data.mpq` 和 `Game.exe` 算經典版。找到的存進設定的 `d2_dir`／`d2_kind`（之後從 D2R 取字型、或改走在玩家電腦上配對官方譯名的備案時用）。都沒找到時說明需要購買 Diablo II: Resurrected，按鈕連到 Blizzard 官方頁面（只放官方連結）；偵測不到不擋流程。測試「找不到」的畫面：設環境變數 `D2S_FAKE_NO_D2=1` 再按「重新偵測」
  3. 完成：連結（網站、社群 Discord、「☕ 請我喝杯咖啡」）、「在桌面建立捷徑」、「啟動遊戲」
- **主畫面**：語言下拉選單（選項文字一樣用各自的語言）、說明（原版不會被標成 patched／翻譯版會）、金色的大「啟動遊戲」按鈕、最新一筆更新紀錄的小卡片（沒看過的有「新」和「知道了」）。底部是狀態列（翻譯、遊戲、啟動器的版本，綠點正常、黃點要注意：檢查更新失敗、有新版啟動器）和連結（網站、Discord、贊助）。上方視需要顯示：找不到遊戲、退回原版的原因、錯誤、需要更新啟動器
- **主畫面沒裝遊戲時**：「啟動遊戲」的位置換成「尚未安裝 D2 Survivors」卡片，附官方網站的下載按鈕（`GAME_URL`）、「重新偵測」、「選擇資料夾」，不會按了啟動才報錯。**找不到 Diablo II** 時顯示一行提醒和 D2R 官方頁面連結，不擋啟動（開啟時沒記錄就先偵測一次，避免誤報）
- **關於**（標題列的「ⓘ 關於」）：D2 Survivors 的一兩句介紹（framara 製作的免費粉絲遊戲）、需要自己的 Diablo II／D2R 檔案、已安裝的版本；遊戲的連結（官方網站、瀏覽器版、遊戲官方 Discord、D2R 官方頁面）和翻譯的連結（翻譯網站、翻譯社群 Discord、贊助）分成兩區，並註明這個啟動器是非官方翻譯、跟遊戲作者和 Blizzard 無關。網址在 `system.rs`，跟網站 `site/src/config.mjs` 的 `LINKS` 一樣。底部連結列的 Discord 是「翻譯社群 Discord」
- **設定**：遊戲資料夾、Diablo II 資料夾、更新來源、自動更新、啟動後關閉、還原原版、建立桌面捷徑、重新執行設定精靈、連結、命令列說明、授權（Cinzel 的 OFL 全文）、詳細紀錄
- 背景的檢查更新失敗（離線、網址還沒上線）不跳紅色錯誤，狀態列的翻譯變成黃點、旁邊的 ⚠ 說明「無法檢查更新，先用本機的翻譯」；啟動、還原失敗才顯示錯誤
- **視覺風格**跟網站一樣（`theme.rs`，顏色照 `site/style.css` 開頭的變數：背景 #0c0a08、面板 #18140f、金色 #c9a45c 等，圓角 6px）。背景是自己畫的深色漸層加一點金光，不用暴雪或遊戲本身的圖、Logo、字型
  - 標題字型 Cinzel（`launcher/assets/fonts/`，從 npm 的 `@fontsource/cinzel` 5.3.0 取 600 字重的 WOFF 轉成 TTF，SIL OFL 1.1，授權檔 `OFL.txt` 一起放、設定頁的「授權」裡也顯示全文）。中文標題退回系統的明體（繁中、日文用細明體，簡中用宋體），西里爾字母用 Georgia
  - 內文 Segoe UI，加上微軟正黑（簡中是微軟雅黑、日文是遊ゴシック）、Malgun Gothic，emoji 圖示用 egui 內建的 Noto Emoji
  - 「啟動遊戲」是金底深色字（#1a1206），hover 變亮金、按下變暗並往下 1 px
  - 視窗 580×620（邏輯像素，Windows 縮放時跟著放大）。100%、125% 實際截圖檢查過；150% 時是 870×930 實體像素，1080p 螢幕的工作區放得下
- 測試、截圖用的環境變數：`D2S_UI_PAGE=language`／`wizard1`～`wizard3`／`main`／`settings` 直接開那一頁；`D2S_UI_ZOOM=1.25` 連視窗一起放大，模擬 Windows 的縮放
- 程式名稱是 `system.rs` 的 `APP_NAME`「D2 Survivors Localization」：每種介面語言都一樣、不翻譯（啟動器支援很多語言，不叫「中文化」）。視窗標題、標題列、exe 的 FileDescription／ProductName（`build.rs`）、桌面捷徑名稱都用它；exe 檔名照舊是 `d2s-launcher.exe`
- 網址集中在 `system.rs`：`SITE_URL`（網站，暫定 GitHub Pages 網址，換網域只改這裡）、`DISCORD_URL`（永久邀請連結）、`DONATE_URL`（贊助，只是一個小連結：不跳出、不提醒、不影響功能）、`GAME_URL`、`D2R_URL`
- 介面文字在 `launcher/src/i18n.rs` 的 `TABLE`：一行一個 key，8 欄依序是繁中、簡中、英文、日、德、法、俄、波蘭文（韓文和其他語言用英文）。日、德、法、俄、波蘭文是翻譯聊天室翻的（`dict/launcher-i18n.json`），`node launcher/merge-i18n.mjs --write` 併進 TABLE（不加 `--write` 只列出差異）；新增或修改 key 時要通知翻譯聊天室補翻（來源清單 `dict/launcher-i18n-src.json`）。`{}` 是代入的值，各語言數量要一樣（`cargo test` 會檢查）。介面語言跟著選的遊戲語言（選英文、韓文原版時用英文）。處理中的紀錄是繁中寫的，其他介面語言只顯示「處理中」
- 畫面上的路徑把使用者資料夾換成 `%LOCALAPPDATA%` 之類（`system::display_path`），截圖不會露出帳號
- 桌面捷徑用 PowerShell 的 `WScript.Shell` 建立，指到啟動器本身、參數 `--play`（開視窗並直接啟動遊戲；出錯或退回原版時視窗留著）。捷徑指到啟動器現在的位置，所以啟動器要先放在固定的地方再建捷徑。捷徑名稱是「D2 Survivors Localization」；建的時候把舊版的「D2 Survivors 啟動器／启动器／Launcher」捷徑刪掉（只刪指向 d2s-launcher 的），桌面上不會同時有兩個
- 圖示：跟網站一樣的「D2」（深色圓角方塊上的金字）。`launcher/assets/make-icon.ps1` 產生 `icon.ico`（`build.rs` 用 winresource 放進 exe）和 `icon-64.rgba`（視窗標題列）
- 截圖在 `work/launcher/ui-<語言>-<頁面>.png`（八種介面語言各一套，加上繁中 125%；`contact.png` 是全部縮圖），用正式的 `site/data/manifest.json` 和 changelog。截圖用 `PrintWindow` 讓視窗自己畫，不會截到別的視窗；路徑顯示成 `%LOCALAPPDATA%`，沒有帳號名稱

## 更新來源（manifest v2）

- 讀網站上的 manifest v2，格式見 [manifest-v2.md](manifest-v2.md)。預設 `https://cycleapple.github.io/d2survivors-localization/data/manifest.json`（暫定網址）；編譯時設 `D2S_MANIFEST_URL` 環境變數可以換預設值
- 不用 GitHub API，也不用 token（舊版的 token 設定拿掉了）
- 設定裡的「更新來源」留空就用預設值。舊版存的 v1 網址（dist repo）會自動換成預設值，所以網址定案後重新編譯，大家就跟著換
- 也可以指到別的網址或本機路徑（例如 `site/data/manifest.json`），字典網址相對於 manifest
- 讀 manifest 時網址加上 `?t=<時間>`、送 `Cache-Control: no-cache`，避開 Pages 的 CDN 快取；字典網址本來就帶雜湊
- 讀的欄位：
  - `schema` 不是 2 就停下來，提示更新啟動器
  - `desktop`（修改規則）＝ v1 的 `patch`
  - `languages[]` 裡有 `desktop` 欄位的語言才列進選單；`status: beta` 標成「測試中」、`draft` 和不認得的值都標成「草稿」，不當正式版（目前 make-manifest.mjs 不輸出 draft 的語言）
  - `launcher`：自我更新，見下面
  - `changelog`：更新紀錄，見下面
- 只下載選的語言的字典，以及本機已經有、但版本舊了的字典
- manifest 規則和字典都存在本機，離線或更新失敗時用上次的

## 原版（English／한국어）

- 選 English 或 한국어原版時，換回備份的原版 app.asar，**不套任何規則**（連「啟動器指定語言」也不套），跟遊戲附的 `app.asar.sha256` 對得上，排行榜紀錄不會標成 patched。介面上寫明「原版：排行榜紀錄不會被標成 patched」；選翻譯語言時寫「翻譯版的排行榜紀錄會被標成 patched」
- 原版不理會啟動器指定的語言，照遊戲自己存的語言（localStorage 的 `d2s:lang`）開，所以介面上提示語言不對時到遊戲的 OPTIONS → GAME → LANGUAGE 切換（韓文畫面是 설정 → GAME → 언어）
- 為了不讓翻譯版改到遊戲存的語言：「啟動器指定語言」規則只把 `d2slang` 記在 sessionStorage，不寫進 localStorage；「遊戲裡切換語言」規則讓遊戲裡的切換同時更新 sessionStorage（遊戲本身照常存進 localStorage，那是玩家自己選的）。所以用翻譯版玩過、再選 English 原版，遊戲會照原本存的語言（通常是英文）開。舊版啟動器（0.2.0 之前）曾把 `ko` 寫進去，那些玩家要照上面的提示切一次
- 不修改遊戲的 localStorage（leveldb）：格式是 Chromium 內部的，改壞會弄掉存檔設定，不值得冒險

## 遊戲改版時退回原版

遊戲自己更新後，規則可能對不上（`patcher.rs` 的 `RuleMismatch`）。這時不要讓玩家開不了遊戲：

- 換回真正的原版開遊戲（跟上面的原版一樣，不套任何規則），視窗上方和命令列都顯示「遊戲剛更新，翻譯修正中，先用原版開啟」和語言的提示。視窗不會自動關掉，讓玩家看到原因
- 設定裡選的語言不會改。下次開啟照常檢查更新，翻譯修好、規則對得上就自動套回去（安裝紀錄的 key 不一樣就會重做）
- 第一次開啟又沒有網路、選的翻譯還沒下載時（`game.rs` 的 `NoTranslation`），也一樣用原版開，提示「翻譯還沒下載（請確認網路）」
- 遊戲開著、app.asar 寫不進去時照舊報錯（退回也要寫檔，沒辦法）

## 更新紀錄

- manifest 有 `changelog: { url, latest }` 時，`latest` 跟本機上次看過的（`state.json` 的 `changelog_seen`）不一樣，就下載 `changelog.json`，在視窗上方顯示 `latest` 那一筆的日期和 `summary`
- `summary` 照介面語言挑（目前是選的翻譯語言，選英文、韓文原版時用 en），沒有就用 zh-TW，再沒有就用 en
- 按「知道了」，或顯示著時按「啟動遊戲」，就記成看過了
- 命令列執行 `--update`、`--launch` 時印出來，但不記成看過
- manifest 沒有 `changelog` 欄位、或讀不到 changelog.json 時什麼都不顯示（後者在紀錄裡留一行警告）

## 自我更新

照 [manifest-v2.md](manifest-v2.md) 的「啟動器自我更新」。

- 讀到 manifest 的 `launcher.latest` 比自己新：視窗上方顯示「有新版啟動器」和「更新啟動器」按鈕；命令列 `--status` 會提示，`--self-update` 更新
- 自己低於 `launcher.minimum`：這份 manifest 和字典都不存下來（不套用新規則），照舊用本機上一版的翻譯，並提示先更新啟動器
- 沒有 `launcher` 區塊就當成沒有新版
- 更新：下載 `sha256_url`（`sha256sum` 格式，只取第一欄）和 `download`，核對 sha256、檢查是 Windows 程式（`MZ`），再把自己改名成 `d2s-launcher.exe.old`、放上新檔。視窗版會自動重開；下次開啟時刪掉 `.old`
- 網址可以是相對於 manifest 的路徑或本機路徑（測試用）

## 發布啟動器

1. 改 `launcher/Cargo.toml` 的 `version`
2. commit、推 tag：`git tag launcher-v0.2.0 && git push origin launcher-v0.2.0`
3. `.github/workflows/release-launcher.yml` 在 windows-latest 上檢查 tag 跟 `Cargo.toml` 的版本一樣、跑測試、編譯，建立 Release，附上 `d2s-launcher.exe` 和 `d2s-launcher.exe.sha256`
4. 下次 `node tools/publish.mjs` 時，manifest 的 `launcher.latest` 跟著更新（翻譯聊天室的工具讀最新的 Release）。規則格式改了、舊啟動器不能用的時候，才調高 `launcher.minimum`

- 網站的下載按鈕用 `releases/latest/download/d2s-launcher.exe`，所以主 repo 的 Release 只放啟動器，不然「最新的 Release」會指錯
- 沒有程式碼簽章，Windows SmartScreen 會警告

## 其他

- 原版 app.asar：用遊戲附的 `resources/app.asar.sha256` 判斷。遊戲裡是原版（剛裝好或遊戲自己更新過）就先備份到 `%LOCALAPPDATA%\D2SurvivorsLauncher\originals\`，每次都從原版重新修改。所以遊戲自己更新後，下次從啟動器開會自動重新套用
- 指定語言：遊戲本身會把環境變數 `D2S_QUERY` 加在網址後面，翻譯版啟動器傳 `d2slang=ko`（翻譯都放在 ko 槽位；原版不傳）；`patch-rules.mjs` 的「啟動器指定語言」規則讓遊戲在每個視窗第一次載入時採用它（只記在 sessionStorage）。之後在遊戲裡切換語言照樣有效
- 命令列（可以做成捷徑）：`d2s-launcher --launch [--lang zh-TW|zh-CN|ja|de|fr|ru|en|ko] [--no-update]`；`--play` 是開視窗並直接啟動；另外有 `--install`（只裝不開）、`--update`、`--restore`、`--self-update`、`--status`、`--manifest <網址或路徑> --save`
- 設定、字典、備份都在 `%LOCALAPPDATA%\D2SurvivorsLauncher\`。測試時設 `D2S_LAUNCHER_DIR` 環境變數可以換一個資料夾，不會動到平常用的設定和快取
- 不會改 `app.asar.sha256`，所以遊戲照樣知道 asar 被改過（排行榜紀錄會標成 patched）。也不做任何隱藏修改痕跡的事；不想被標成 patched 就選 English／한국어原版（真正的原版，見上面）

修改了遊戲的哪些地方，見 [desktop-patch.md](desktop-patch.md)。

## 測試方法

遊戲開著時 app.asar 寫不進去，而且別的聊天室可能正開著遊戲測試。只測套用的話，用假的遊戲資料夾：

1. 建一個資料夾，放空的 `D2 Survivors.exe`、`resources/app.asar`（原版，例如 `backup/<版本>/app.asar`）和 `resources/app.asar.sha256`
2. `D2S_LAUNCHER_DIR` 指到另一個資料夾，裡面的 `config.json` 把 `game_dir` 設成上面的資料夾
3. `d2s-launcher --install --manifest site/data/manifest.json --lang ja`，再比對輸出

要進遊戲看：把整個遊戲資料夾複製一份，`D2S_USER_DATA` 指到另一個資料夾（遊戲本身支援，存檔和設定就不會動到平常的），裡面 `d2` 用 junction 指到平常的 `%APPDATA%\D2 Survivors\d2`（取出的 D2 素材，1.5 GB），`desktop.json` 的 `checkForUpdates` 設成 false。再用 `D2S_QUERY=d2slang=ko` 和 `--remote-debugging-port` 開複製的那份，用 `tools/cdp.mjs` 截圖

## 1.0.0

- `Cargo.toml` 的 version 是 1.0.0；預設 manifest 網址照舊是 `https://cycleapple.github.io/d2survivors-localization/data/manifest.json`
- 發布：推 tag `launcher-v1.0.0` → `release-launcher.yml` 建 Release，附 `d2s-launcher.exe` 和 `d2s-launcher.exe.sha256`
- 發布前的檢查（2026-10-28）：把 HEAD 的 `launcher/`、`.github/` 用 `git archive` 匯出到乾淨的資料夾，照 workflow 的步驟跑一次（tag 和 version 比對、`cargo test --release`、`cargo build --release`、算 sha256），兩個檔案都做得出來，exe 的 ProductVersion 是 1.0.0。確認 build 不靠沒進 repo 的檔案（圖示、Cinzel 字型、OFL 都在 repo 裡）

## 待辦

- 還不會取出 D2R 的字型（字型不能放進 manifest 公開），所以從啟動器套用時中日文用系統字型；暗色字的修正照樣有效
- 網址換成自己的網域的話，改 `paths.rs` 的預設網址（或編譯時設 `D2S_MANIFEST_URL`）和 `system.rs` 的 `SITE_URL`，再發一版
- workflow 還沒在 GitHub 上實際跑過（第一次推 tag 時確認）
- 新增的介面文字（關於頁、沒裝遊戲的卡片等）只有繁中、簡中、英文，其他五種語言要等翻譯聊天室補（`dict/launcher-i18n.json` → `node launcher/merge-i18n.mjs --write`）