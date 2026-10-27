# 網站（site/）

下載／安裝頁，純靜態（`index.html`、`style.css`、`app.js`、`assets/`，網頁版書籤在 `web/`，見 [web.md](web.md)）。上方兩層分頁：

- 第一層是介面語言：繁中（台灣用語）、簡中、英文（`?lang=zh-TW`／`zh-CN`／`en`；沒指定時依瀏覽器語言，台港澳用繁中、其他中文用簡中）
- 第二層是版本：桌面版（啟動器，`#install`）、瀏覽器版（書籤，`#web`）（`?platform=desktop`／`web`；沒指定時 Windows 用桌面版，Mac、Linux、手機用瀏覽器版）。HTML 標 `data-only="desktop"`／`"web"` 的只在那個版本顯示；`I18N` 裡 `key@web` 是那個版本專用的文字，`faq.items`、`sources.cards` 的連結第三欄標版本
- 兩層都會記在 localStorage；網址有帶參數時，切換也會跟著改網址

- 設定都在 `site/app.js` 最上面的 `SITE`：`downloadUrl`（啟動器下載網址，留空時按鈕顯示「尚未發布」）、`launcherVersion`、`gameVersion`、`totalKeys`、`feedbackUrl`
- 語言清單和狀態在 `LANGUAGES`（`available`／`in-progress`／`planned`）
- 網站資料夾裡有 `manifest.json` 時（`node tools/make-manifest.mjs site`），語言條數和更新時間會直接讀它，啟動器的更新來源也能指到同一個網址。manifest v2 會改放在 `site/data/`，見 [manifest-v2.md](manifest-v2.md)
- 本機預覽：`python -m http.server 8765 -d site`
- 部署：GitHub Pages（用 GitHub Actions 部署 `site/`），見 [release.md](release.md)
