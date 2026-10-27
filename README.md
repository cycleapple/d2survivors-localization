# D2 Survivors 中文化（非官方）

[D2 Survivors](https://d2survivors.lol/) 的玩家自製翻譯：繁體中文、简体中文、日本語。

- **桌面版**（Windows）：啟動器選好語言、按「啟動遊戲」，自動下載最新翻譯並套用到遊戲。遊戲自己更新後，下次從啟動器開會自動重新套用
- **瀏覽器版**（電腦、手機）：在 d2survivors.lol 的網頁版遊戲按一下書籤，就切換成中文

做法是沿用遊戲內建的翻譯系統（換掉韓文字典的位置），不是在畫面上另外蓋一層字，所以介面、物品、技能、說明都能翻到。物品、技能、怪物、地名用《暗黑破壞神 II：獄火重生》的官方譯名。

## 聲明

- 這是玩家自製的非官方翻譯，跟 Blizzard Entertainment、D2 Survivors 的作者都沒有關係，也沒有得到他們的認可。
- 字典裡的物品、技能、怪物、地名等官方譯名取自《暗黑破壞神 II：獄火重生》，版權屬於 Blizzard Entertainment, Inc.。Diablo 是 Blizzard Entertainment, Inc. 的商標。
- 其餘譯文是自己翻譯的。
- 免費使用，所有功能都不收費，也不販售任何遊戲內容。贊助是自願的，用來支持翻譯和維護的時間，贊助與否不影響任何功能。
- 這個 repo 不包含任何遊戲的美術、音效、字型或程式。
- 權利人如果要求移除，請開 issue，會立即處理。

## 目錄

| 資料夾 | 內容 | 文件 |
|---|---|---|
| `dict/` | 字典：D2R 官方譯名自動配對、人工翻譯、合併後的各語言字典 | [docs/translation.md](docs/translation.md)、[翻譯規範](docs/translation-guide.md)、[用語決策](docs/term-decisions.md) |
| `tools/` | 抽字串、配對、檢查、合併、打包、發布的 Node.js 工具 | [docs/translation.md](docs/translation.md) |
| `tools/patch-rules.mjs` | 桌面版對遊戲的修改規則（啟動器和 `patch.mjs` 共用） | [docs/desktop-patch.md](docs/desktop-patch.md) |
| `launcher/` | 桌面版啟動器（Rust） | [docs/launcher.md](docs/launcher.md) |
| `site/` | 網站（下載、安裝說明） | [docs/site.md](docs/site.md) |
| `site/web/`、`tools/web-rules.mjs` | 瀏覽器版書籤 | [docs/web.md](docs/web.md) |
| `site/data/` | 更新來源：manifest 和各語言字典（工具產生） | [docs/manifest-v2.md](docs/manifest-v2.md) |

開源範圍、公開界線、發布流程：[docs/release.md](docs/release.md)

## 贊助

覺得好用的話，可以請我喝杯咖啡：[PayPal](https://paypal.me/DonateCYtw)

## 開發

```
npm install
```

產生字典需要自己的 D2 Survivors（桌面版）和《暗黑破壞神 II：獄火重生》：遊戲本身的檔案和 D2R 的原始字串檔都不放在 repo 裡（`backup/`、`versions/`、`data/`、`work/`），要用工具從自己的安裝取出。步驟見 [docs/translation.md](docs/translation.md)。

## 授權

程式碼用 [MIT](LICENSE)。翻譯資料（`dict/` 和產生出來的字典）不在 MIT 範圍內，授權另外決定；官方譯名的權利屬於 Blizzard Entertainment, Inc.。
