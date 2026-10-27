# 啟動器（launcher/，Rust）

選語言（manifest 裡有的翻譯：繁體中文、简体中文、日本語、Deutsch、Français、Русский；加上 English／한국어原版）後按「啟動遊戲」：自動下載新的翻譯、修改 app.asar、用選的語言開遊戲。

```
cd launcher && cargo build --release        # → launcher/target/release/d2s-launcher.exe
cargo test --release                        # 有 backup/2026.1026.4/app.asar 時會多測重新打包
```

## 視窗

- **設定精靈**（第一次開啟時；之後可以從「設定」→「重新執行設定精靈」再跑一次）：
  1. 選語言：同時決定啟動器的介面語言和遊戲的翻譯語言。預設照 Windows 的地區格式（`GetUserDefaultLocaleName`，zh-TW／zh-HK → 繁中、zh-CN → 簡中、ja／de／fr／ru／pl／ko，其他用英文）。兩欄的大按鈕一次列出 manifest 裡有 `desktop` 的語言，加上 English、한국어 (원본)；每個語言的名稱和「測試中」都用那個語言自己寫（「简体中文（测试中）」「Русский (бета)」，`i18n::native_label`）。標題用 🌐 加上多種語言並列（`i18n::LANGUAGE_TITLE`），說明和「下一步」照目前選的語言、點了立刻換。還沒讀到 manifest 時顯示「讀取中」，讀不到就說明可以先選原版
  2. D2 Survivors：沿用 `game_dir` 的偵測（預設 `%LOCALAPPDATA%\Programs\D2 Survivors`），可以手動選資料夾。沒裝時給官方網站按鈕和「重新偵測」，也可以略過
  3. Diablo II：依序找 D2 Survivors 自己記的 `%APPDATA%\D2 Survivors\desktop.json` 的 `installDir`、D2R 的解除安裝登錄（`InstallLocation`）、經典版的登錄（`InstallPath`）、`Program Files (x86)` 下的預設資料夾；資料夾裡有 `D2R.exe` 算 D2R，有 `d2data.mpq` 和 `Game.exe` 算經典版。找到的存進設定的 `d2_dir`／`d2_kind`（之後從 D2R 取字型、或改走在玩家電腦上配對官方譯名的備案時用）。都沒找到時說明需要購買 Diablo II: Resurrected，按鈕連到 Blizzard 官方頁面（只放官方連結）；偵測不到不擋流程。測試「找不到」的畫面：設環境變數 `D2S_FAKE_NO_D2=1` 再按「重新偵測」
  4. 完成：連結（中文化網站、社群 Discord、「☕ 請我喝杯咖啡」）、「在桌面建立捷徑」、「啟動遊戲」
- **主畫面**：語言下拉選單（選項文字一樣用各自的語言）、大的「啟動遊戲」按鈕、狀態區（翻譯版本、遊戲版本、啟動器版本和有沒有新版、最新一筆更新紀錄）。上方視需要顯示：找不到遊戲、退回原版的原因、錯誤、需要更新啟動器、還沒看過的更新紀錄
- **設定**：遊戲資料夾、Diablo II 資料夾、更新來源、自動更新、啟動後關閉、還原原版、建立桌面捷徑、重新執行設定精靈、連結（網站、Discord、贊助）、命令列說明、詳細紀錄
- 背景的檢查更新失敗（離線、網址還沒上線）不跳紅色錯誤，狀態區顯示「無法檢查更新，先用本機的翻譯」；啟動、還原失敗才顯示錯誤
- 網址集中在 `system.rs`：`SITE_URL`（中文化網站，暫定 GitHub Pages 網址，換網域只改這裡）、`DISCORD_URL`（永久邀請連結）、`DONATE_URL`（贊助，只是一個小連結：不跳出、不提醒、不影響功能）、`GAME_URL`、`D2R_URL`
- 介面文字在 `launcher/src/i18n.rs` 的 `TABLE`：一行一個 key，依序是繁中、簡中、英文；日、德、法、俄、波蘭、韓文先用英文（要加語言：加一欄，`column()` 對應過去）。`{}` 是代入的值，各語言數量要一樣（`cargo test` 會檢查）。介面語言跟著選的遊戲語言（選英文、韓文原版時用英文）。中日文用系統字型（微軟正黑、雅黑、遊ゴシック、Malgun Gothic），簡中介面把雅黑排前面
- 畫面上的路徑把使用者資料夾換成 `%LOCALAPPDATA%` 之類（`system::display_path`），截圖不會露出帳號
- 桌面捷徑用 PowerShell 的 `WScript.Shell` 建立，指到啟動器本身、參數 `--play`（開視窗並直接啟動遊戲；出錯或退回原版時視窗留著）。捷徑指到啟動器現在的位置，所以啟動器要先放在固定的地方再建捷徑
- 圖示：跟網站一樣的「D2」（深色圓角方塊上的金字）。`launcher/assets/make-icon.ps1` 產生 `icon.ico`（`build.rs` 用 winresource 放進 exe）和 `icon-64.rgba`（視窗標題列）
- 截圖在 `work/launcher/`（`wizard-*.png`、`en-wizard-1-language.png`、`main*.png`、`settings.png`），用的是正式的 `site/data/manifest.json` 和 changelog

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

## 待辦

- 還不會取出 D2R 的字型（字型不能放進 manifest 公開），所以從啟動器套用時中日文用系統字型；暗色字的修正照樣有效
- 網址定案後，改 `paths.rs` 的預設網址（或編譯時設 `D2S_MANIFEST_URL`），再發一版
- 第一個 Release 還沒發（還沒有 remote）。workflow 只做過 YAML 語法檢查，在本機模擬過版本檢查和 sha256 那兩步，還沒在 GitHub 上實際跑過
