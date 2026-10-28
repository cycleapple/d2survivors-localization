# manifest v2（更新來源格式）

啟動器、網頁版書籤、網站三邊共用的更新來源。v1 只給啟動器用，放在 dist repo；v2 跟網站放在一起，三邊讀同一份。

## 放在哪裡

網站用 GitHub Pages 部署（GitHub Actions 把 `site/` 整個上傳），manifest 和字典放在 `site/data/`：

```
site/data/manifest.json
site/data/dict/zh-TW.json
site/data/dict/zh-CN.json
site/data/dict/ja.json
```

- `<BASE>` 是網站的網址。暫定 `https://cycleapple.github.io/d2survivors-localization/`；有自己的網域就換成網域。**公開宣傳前要定案**，因為玩家裝好的書籤寫死了這個網址
- manifest 網址：`<BASE>data/manifest.json`。啟動器編譯時用 `D2S_MANIFEST_URL` 設預設值；書籤用自己所在的網址推算（`new URL('../data/manifest.json', import.meta.url)`）；網站用相對路徑 `data/manifest.json`
- 這些檔案由 `node tools/publish.mjs` 產生，commit 進 repo，不要手動改
- Pages 的 CDN 會快取約 10 分鐘。manifest 本身讀的時候加 `cache: 'no-cache'`；字典網址帶雜湊（`?v=<sha256 前 12 碼>`），內容換了網址就換了，不會拿到舊的
- 不用 GitHub API，所以沒有每小時 60 次的限制，也不用 token

## 格式

```jsonc
{
  "schema": 2,
  "updated": "2026-10-28T03:00:00.000Z",   // 發布時間
  "version": "20261028-0300",              // 這次發布的版本，顯示用

  "game": {
    "desktop": "2026.1027.1",              // 規則對得上的桌面版遊戲版本（顯示用，不是限制）
    "web_checked": "2026-10-28T02:55:00Z"  // 上次用 build-web.mjs --check 確認網頁版規則的時間
  },

  "launcher": {
    "latest": "0.3.0",                     // 目前最新的啟動器版本
    "minimum": "0.3.0",                    // 低於這個版本的啟動器要先更新才能套用（規則格式改了的時候調高）
    "download": "https://github.com/cycleapple/d2survivors-localization/releases/latest/download/d2s-launcher.exe",
    "sha256_url": "https://github.com/cycleapple/d2survivors-localization/releases/latest/download/d2s-launcher.exe.sha256"
  },

  "languages": [
    {
      "id": "zh-TW",                       // 語言代碼，三邊通用
      "name": "繁體中文",                   // 顯示名稱（用該語言自己寫）
      "status": "available",               // available | beta（可以選，標示測試中）| draft（見下面）
      "entries": 12616,                    // 字典條數
      "dict": {
        "url": "dict/zh-TW.json?v=1a2b3c4d5e6f",   // 相對於 manifest.json
        "sha256": "…",
        "size": 2345678
      },
      "desktop": {                         // 沒有這一欄＝桌面版不能選
        "menu_name": "繁體中文",
        "html_lang": "zh-Hant",
        "groups": ["base", "dict", "cjk", "magic-zh", "fullwidth"]
      },
      "web": {                             // 沒有這一欄＝網頁版不能選
        "menu_name": "繁體中文",
        "html_lang": "zh-Hant",
        "groups": ["…"],
        "fonts": ["Microsoft JhengHei", "PingFang TC", "Noto Sans TC"]
      }
    }
  ],

  "desktop": {                             // = v1 的 patch，內容不變
    "assets_dir": "desktop/dist/web/assets",
    "dict_target": { "file": "^ko-.*\\.js$", "template": "var e={{dict}};export{e as default};" },
    "rules": [ { "label": "…", "groups": ["base"], "file": "…", "from": "…", "to": "…" } ]
  },

  "web": {
    "play_url": "https://d2survivors.lol/play/",
    "rules": [ { "label": "…", "groups": ["…"], "file": "…", "find": "…", "replace": "…", "optional": false } ]
  }
}
```

`status` 的三種值：

- `available`：正式版
- `beta`：可以選，標示「測試中」
- `draft`：翻譯還在做（`tools/langs.mjs` 標的）。`publish` 不會把 draft 的語言寫進 manifest，所以正常發布的 manifest 裡不會出現。萬一出現（例如手動產生的測試用 manifest），啟動器和書籤標成「草稿」，網站顯示成「計畫中」
- 讀到不認得的值：當成 `draft` 處理，不要當成正式版

## 各欄位歸誰

| 部分 | 產生的程式 | 讀的程式 | 誰維護 |
|---|---|---|---|
| 最上層、`languages[]` 的 `id`／`name`／`status`／`entries`／`dict` | `tools/publish.mjs`（讀 `tools/langs.mjs`） | 三邊 | 翻譯 |
| `languages[].desktop`、`desktop` | `tools/patch-rules.mjs` | 啟動器 | 啟動器 |
| `languages[].web`、`web` | `tools/web-rules.mjs` | 書籤 | 網頁書籤 |
| `launcher` | `tools/publish.mjs` 讀最新的 GitHub Release | 啟動器 | 啟動器 |
| `game` | `tools/publish.mjs` | 網站（顯示） | 翻譯 |

- `desktop`、`web` 兩塊、`languages[].desktop`、`languages[].web` 裡面的欄位，由各自的負責方決定，改了只要兩邊（產生和讀取）一致就好，在這份文件更新說明
- 最上層和 `languages[]` 的共用欄位要改，先改這份文件、通知另外兩邊

## 讀取規則

- **啟動器**：`schema` 不是 2 就停下來，提示更新啟動器。自己的版本低於 `launcher.minimum` 時，不套用新規則，先自我更新。語言下拉選單列出有 `desktop` 欄位的語言，加上 English／한국어原版
- **書籤**：列出有 `web` 欄位的語言。localStorage 的語言值用 `id`（`zh-TW`、`zh-CN`、`ja`）；舊版存的 `zh` 當成 `zh-TW`
- **網站**：語言清單、條數、更新時間讀 `languages[]`；`status` 顯示成「可用」或「測試中」。下載按鈕固定用 `launcher.download`（或直接寫 `releases/latest/download/…`，不用每次改網站）

## 啟動器自我更新

- 啟動器發布在主 repo 的 GitHub Releases。tag `launcher-v<版本>` 推上去，GitHub Actions 在 Windows 上編譯，上傳 `d2s-launcher.exe` 和 `d2s-launcher.exe.sha256`
- 啟動器每次開啟讀 manifest 時比對 `launcher.latest`：有新版就提示（或自動）下載、核對 sha256，再替換自己（Windows 上執行中的 exe 不能覆寫，但可以改名：先把自己改名成 `.old`，放新檔，重開後刪掉 `.old`）
- 沒有程式碼簽章，Windows SmartScreen 會警告。網站的常見問題要寫怎麼略過

## 從 v1 換過來

- v1（dist repo）只有拿 token 測試的人在用，停在最後一版，不再更新。新版啟動器改讀 v2，舊版啟動器讀到的還是 v1，不會壞
- 主 repo 公開、v2 上線之後，dist repo 封存（archive）

## 更新紀錄（changelog）

玩家看得到的「這次更新了什麼」。網站、啟動器、Discord 公告讀同一份。

### 檔案

- `site/data/changelog.json`：`tools/publish.mjs` 產生，跟 manifest 一起 commit。不要手動改
- `dict/changelog-next.json`：下一次發布要寫的說明，**人寫的**。`publish` 把它併進 changelog 之後清空（變成 `{}`）。沒有這個檔或是空的，就只寫自動統計
- manifest 最上層多一欄 `changelog`：`{ "url": "changelog.json?v=<sha256 前 12 碼>", "latest": "<最新一筆的 version>" }`。啟動器和網站比對 `latest` 就知道有沒有新的更新紀錄

### `dict/changelog-next.json`（人寫）

```jsonc
{
  "kind": "translation",          // translation（修譯文）| language（新語言、語言升級成 beta／available）| game-fix（遊戲改版後修好）| launcher（啟動器新版）
  "announce": false,              // true＝發 Discord 公告；平常修譯文用 false
  "summary": {                    // 一句話，至少要有 zh-TW 和 en；網站每種介面語言（zh-TW、zh-CN、en、ja、de、fr、ru…）都要寫，沒寫的顯示 en
    "zh-TW": "修正 30 條技能說明，新增法文、俄文（測試中）",
    "zh-CN": "修正 30 条技能说明，新增法文、俄文（测试中）",
    "en": "Fixed 30 skill descriptions; added French and Russian (beta)"
  },
  "notes": { "zh-TW": ["「漩渦」改回官方譯名", "…"] }   // 選填，條列細節
}
```

### `site/data/changelog.json`（工具產生）

```jsonc
{
  "schema": 1,
  "entries": [                    // 新的在前面，最多留 50 筆
    {
      "version": "20261028-0300", // 跟 manifest 的 version 一樣
      "date": "2026-10-28",
      "kind": "translation",
      "announce": false,
      "summary": { "zh-TW": "…", "zh-CN": "…", "en": "…" },
      "notes": { "zh-TW": ["…"] },
      "game": { "desktop": "2026.1027.1" },
      "launcher": "0.3.0",        // 這次發布時的 launcher.latest（沒有就省略）
      "languages": [              // 自動統計：跟上一次發布比
        { "id": "zh-TW", "status": "available", "entries": 12758, "added": 12, "changed": 30, "removed": 0 }
      ]
    }
  ]
}
```

- 只有字典、規則、語言狀態、啟動器版本有變動才會多一筆（跟 `publish` 判斷要不要發布的條件一樣）
- 沒有寫 `changelog-next.json` 時，`summary` 由工具依統計自動產生（例如「繁中修正 30 條、新增 12 條」），`kind` 是 `translation`、`announce` 是 `false`

### 誰讀

| | 讀什麼 | 做什麼 |
|---|---|---|
| 網站 | 最近幾筆的 `summary`、`date` | 「更新紀錄」區塊；manifest 的 `game.web_checked` 太舊或 Web check 失敗時顯示「遊戲剛更新，翻譯修正中」 |
| 啟動器 | `changelog.latest` 跟本機上次看過的比 | 有新的就在視窗上顯示最新一筆的 `summary`（介面語言對應的那個） |
| Discord 公告 | `announce: true` 而且還沒發過的 | 發到 #announcements（見 [release.md](release.md)） |

## 遊戲改版的應對

- **網頁版**：`.github/workflows/web-check.yml` 每小時用 `build-web.mjs --check` 檢查線上的遊戲。必要規則對不上就開 `game-update` issue，並通知 Discord 的維護者頻道（secret `DISCORD_WEBHOOK_ALERTS`）。書籤本身在規則對不上時不啟動、提示「需要更新」，原版遊戲照常能玩
- **桌面版**：`.github/workflows/desktop-check.yml` 每小時讀遊戲自己的更新資訊 `https://d2survivors.lol/download/latest.yml`。版本跟 manifest 的 `game.desktop` 不同時，下載新版安裝檔（同一版只下載一次），解出 `app.asar`，跑 `check-rules.mjs`、數出各語言字典還沒有的新字串，開 `desktop-update` issue；必要規則對不上時另外加 `game-update`（網站會顯示提示）並通知 #alerts。手動測試：Actions → Desktop check → Run workflow，勾 force（只印結果、不開 issue）
- 啟動器套用時，必要規則對不上就**改用原版開遊戲**並在主畫面顯示黃色卡片；只有加分規則（optional）對不上時照樣套用翻譯
- **新字串**：補翻之前顯示英文，不算壞掉。補翻寫進 `dict/manual/new-<遊戲版本>.json`
- **修好之後**：發布時 `changelog-next.json` 的 `kind` 寫 `game-fix`、`announce` 寫 `true`
