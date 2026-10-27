# 啟動器（launcher/，Rust）

選語言（manifest 裡有的翻譯：繁體中文、简体中文、日本語、Deutsch、Français、Русский；加上 English／한국어原版）後按「啟動遊戲」：自動下載新的翻譯、修改 app.asar、用選的語言開遊戲。

```
cd launcher && cargo build --release        # → launcher/target/release/d2s-launcher.exe
cargo test --release                        # 有 backup/2026.1026.4/app.asar 時會多測重新打包
```

## 更新來源（manifest v2）

- 讀網站上的 manifest v2，格式見 [manifest-v2.md](manifest-v2.md)。預設 `https://cycleapple.github.io/d2survivors-localization/data/manifest.json`（暫定網址）；編譯時設 `D2S_MANIFEST_URL` 環境變數可以換預設值
- 不用 GitHub API，也不用 token（舊版的 token 設定拿掉了）
- 設定裡的「更新來源」留空就用預設值。舊版存的 v1 網址（dist repo）會自動換成預設值，所以網址定案後重新編譯，大家就跟著換
- 也可以指到別的網址或本機路徑（例如 `site/data/manifest.json`），字典網址相對於 manifest
- 讀 manifest 時網址加上 `?t=<時間>`、送 `Cache-Control: no-cache`，避開 Pages 的 CDN 快取；字典網址本來就帶雜湊
- 讀的欄位：
  - `schema` 不是 2 就停下來，提示更新啟動器
  - `desktop`（修改規則）＝ v1 的 `patch`
  - `languages[]` 裡有 `desktop` 欄位的語言才列進選單；`status: beta` 標成「測試中」、`draft` 標成「草稿」（目前 make-manifest.mjs 不輸出 draft 的語言）
  - `launcher`：自我更新，見下面
- 只下載選的語言的字典，以及本機已經有、但版本舊了的字典
- manifest 規則和字典都存在本機，離線或更新失敗時用上次的

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
- 指定語言：遊戲本身會把環境變數 `D2S_QUERY` 加在網址後面，啟動器傳 `d2slang=en|ko`（翻譯都放在 ko 槽位）；`patch-rules.mjs` 的「啟動器指定語言」規則讓遊戲在每個視窗第一次載入時採用它。之後在遊戲裡切換語言照樣有效
- 命令列（可以做成捷徑）：`d2s-launcher --launch [--lang zh-TW|zh-CN|ja|de|fr|ru|en|ko] [--no-update]`；另外有 `--install`（只裝不開）、`--update`、`--restore`、`--self-update`、`--status`、`--manifest <網址或路徑> --save`
- 設定、字典、備份都在 `%LOCALAPPDATA%\D2SurvivorsLauncher\`。測試時設 `D2S_LAUNCHER_DIR` 環境變數可以換一個資料夾，不會動到平常用的設定和快取
- 不會改 `app.asar.sha256`，所以遊戲照樣知道 asar 被改過（排行榜紀錄會標成 patched）

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
