# 啟動器（launcher/，Rust）

選語言（繁體中文／English／한국어原版）後按「啟動遊戲」：自動下載新的翻譯、修改 app.asar、用選的語言開遊戲。

```
cd launcher && cargo build --release        # → launcher/target/release/d2s-launcher.exe
node tools/publish.mjs                      # 發布翻譯：重新產生 dist/，有變動就 push 到更新來源的 repo
```

> 更新來源要換成 manifest v2（跟網站放在一起），見 [manifest-v2.md](manifest-v2.md)。下面是 v1 的現況。

- 更新來源：repo [cycleapple/d2survivors-zh-tw-dist](https://github.com/cycleapple/d2survivors-zh-tw-dist)（`dist/` 就是它的 clone）。啟動器預設讀 `https://api.github.com/repos/cycleapple/d2survivors-zh-tw-dist/contents/manifest.json`
  - 私人 repo 要 token：到 GitHub → Settings → Developer settings → Fine-grained tokens 建一個只限這個 repo、Contents 唯讀的 token，填進啟動器「設定」的 GitHub token（或設 `D2S_GITHUB_TOKEN` 環境變數）。token 只會送給 GitHub。repo 公開後就不用 token（沒有 token 時 GitHub API 每個 IP 每小時 60 次，啟動器每次開只用 1～2 次）
  - 用 contents API 而不是 raw.githubusercontent.com：raw 網址對私人 repo 的分支會快取舊的 commit 好幾分鐘，剛發布的翻譯拿不到。字典網址也帶上雜湊（`zh-TW.json?v=…`）
  - 也可以指到其他網址或本機路徑（`node tools/make-manifest.mjs <資料夾>` 產生）。編譯時設 `D2S_MANIFEST_URL` 環境變數可以換預設值
  - repo 還沒公開之前，啟動器給別人用，每個人要有自己的 token，不要把 token 編進啟動器
- manifest 裡除了字典的 sha256，還有修改規則，所以遊戲改版後只要更新 `patch-rules.mjs` 再發布，啟動器不用重新編譯
- 原版 app.asar：用遊戲附的 `resources/app.asar.sha256` 判斷。遊戲裡是原版（剛裝好或遊戲自己更新過）就先備份到 `%LOCALAPPDATA%\D2SurvivorsLauncher\originals\`，每次都從原版重新修改。所以遊戲自己更新後，下次從啟動器開就會自動重新套用
- 指定語言：遊戲本身會把環境變數 `D2S_QUERY` 加在網址後面，啟動器傳 `d2slang=en|ko`；`patch-rules.mjs` 的「啟動器指定語言」規則讓遊戲在每個視窗第一次載入時採用它。之後在遊戲裡切換語言照樣有效
- 命令列（可以做成捷徑）：`d2s-launcher --launch [--lang zh-TW|en|ko] [--no-update]`；另外有 `--install`（只裝不開）、`--update`、`--restore`、`--status`、`--manifest <網址> --save`
- 設定、字典、備份都在 `%LOCALAPPDATA%\D2SurvivorsLauncher\`
- 不會改 `app.asar.sha256`，所以遊戲照樣知道 asar 被改過（排行榜紀錄會標成 patched）

修改了遊戲的哪些地方，見 [desktop-patch.md](desktop-patch.md)。

## 待辦

- 還不會取出 D2R 的中文字型（字型不能放進 manifest 公開），所以從啟動器套用時中文用系統字型；暗色字的修正照樣有效
- 只能選繁中：manifest 已經有簡中、日文的字典，介面要能選
- 啟動器本身的自動更新（見 [manifest-v2.md](manifest-v2.md) 的「啟動器」）
