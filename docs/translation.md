# 翻譯

做法：沿用遊戲內建的翻譯系統。把韓文字典（`ko-*.js`）換成譯文字典，再對 `lang-*.js` 和點陣字型做最小幅度的修改（見 [desktop-patch.md](desktop-patch.md)），最後重新打包成 `app.asar`。

`versions/`（從遊戲抽出的 key 和韓文）、`data/d2r-strings/`（D2R 原始字串檔）、`work/` 都不在 repo 裡，要用自己的遊戲和 D2R 產生。

## 指令

```
npm install

# 字典流程
node tools/extract-keys.mjs backup/2026.1027.1/app.asar versions/2026.1027.1/ko.json        # 抽出全部英文 key（連同韓文）
node tools/d2r-strings.mjs backup/2026.1027.1/app.asar "C:/Program Files (x86)/Diablo II Resurrected" data/d2r-strings   # 取出 D2R 字串檔
node tools/build-glossary.mjs versions/2026.1027.1/ko.json data/d2r-strings dict/d2r-auto.json work/glossary-report.json   # 自動配對官方譯名

# 翻譯（還沒配對到的）
node tools/make-todo.mjs versions/2026.1027.1/ko.json data/d2r-strings dict/d2r-auto.json work/glossary-report.json work/todo-ui template,short,title,monster   # 分批、附用語提示
node tools/check-batch.mjs work/todo-ui/batch-01.json dict/manual/ui-01.json   # 檢查一批譯文
node tools/lookup.mjs data/d2r-strings "Magic Find"                            # 查 D2R 官方譯法
node tools/check-alignment.mjs dict/manual/long-*.json                         # 檢查譯文有沒有對錯 key（數字要對得上）

# 審核自動配對（技能變體名稱、全大寫按鈕、韓文跟 D2R 不同的）
node tools/audit-auto.mjs work/app/desktop/dist/web/assets versions/2026.1027.1/ko.json data/d2r-strings dict/d2r-auto.json work/audit-auto.json
node tools/propagate-renames.mjs dict/d2r-auto.json dict/manual/audit-*.json -- dict/manual/ui-*.json dict/manual/long-*.json   # 改名同步到句子裡，輸出要逐條看

# 字串用途索引：解析遊戲程式碼（語法樹）和資料檔，記下每個 key 在遊戲裡當什麼用
#   （技能、技能變體、被動、恰西強化、區域、說明框、改版說明、按鈕…），翻譯或審核時可以查
node tools/usage-index.mjs work/app/desktop/dist/web "%APPDATA%/D2 Survivors/d2" versions/2026.1027.1/ko.json work/usage.json
# 用語分析：一個 key 多種用途、大小寫撞名（遊戲不分大小寫，只有一個譯文會生效）、句子裡的名稱跟名稱本身的譯名不一致
node tools/term-analysis.mjs work/usage.json dict/zh-TW.json work/term-report.json
# 反查一個詞：對應哪些 key、最後是哪個字典檔決定的、各層原本怎麼譯、在遊戲裡當什麼用。用語決策紀錄在 docs/term-decisions.md
node tools/where.mjs 火海

# 找遊戲裡實際查不到的字串：work/make-debug.mjs 把翻譯器放到 window.__d2zhT（只給本機測試，不要發布），
# 進遊戲走一遍後讀 [...window.__d2zhT.missing] 存成 json，再整理（去掉已經是中文的、按鍵字母、斷行片段）
node tools/missing-report.mjs work/missing.json versions/2026.1027.1/ko.json dict/zh-TW.json work/missing-report.json

# 中文字型：從本機 D2R 取出繁中內文字型、只留用到的字（要 Python 的 fontTools 和 brotli）。patch.mjs 有這個資料夾就會放進去
node tools/zh-fonts.mjs "C:/Program Files (x86)/Diablo II Resurrected" dict/zh-TW.json data/d2r-strings work/fonts-zh

# 合併、打包、安裝（後面的字典蓋過前面的）
node tools/merge-dict.mjs versions/2026.1027.1/ko.json dict/zh-TW.json dict/d2r-auto.json dict/manual/audit-*.json dict/manual/ui-*.json dict/manual/long-*.json dict/manual/new-*.json dict/manual/modifiers.json dict/manual/overrides.json
node tools/patch.mjs backup/2026.1027.1/app.asar dict/zh-TW.json work/app.asar   # 產生修改版
node tools/install.mjs              # 裝進遊戲（遊戲要先關掉）
node tools/install.mjs --restore    # 還原原版
```

遊戲裡在 選項 → 語言 選「繁體中文」（佔用韓文的位置，存在 localStorage `d2s:lang` = `ko`）。

## 其他語言（簡體中文、日文）

一次只能裝一種：每種語言都是佔用韓文的位置，選單名稱換成「简体中文」「日本語」。每種語言的設定（D2R 的哪一欄、用哪個字型、文字範圍）在 `tools/langs.mjs`。工具加上 `--lang zh-CN` 或 `--lang ja`，檔案就換成下面這些；沒加的時候是繁中，路徑跟上面一樣。

| | 繁中 | 簡中／日文 |
|---|---|---|
| D2R 自動配對 | `dict/d2r-auto.json` | `dict/<語言>/d2r-auto.json` |
| 人工翻譯、覆寫 | `dict/manual/` | `dict/<語言>/manual/`（`ui-*.json`、`modifiers.json`、`overrides.json`） |
| 合併後的字典 | `dict/zh-TW.json` | `dict/zh-CN.json`、`dict/ja.json` |
| 字型 | `work/fonts-zh`（D2R 繁中內文字型） | `work/fonts/<語言>`（簡中 `blizzardglobal-v5_81.ttf`、日文 `bljap_v8_3.ttf`） |
| 翻譯規範 | `docs/translation-guide.md` | `docs/translation-guide-zh-CN.md`、`docs/translation-guide-ja.md` |

```
node tools/build-glossary.mjs versions/2026.1027.1/ko.json data/d2r-strings dict/ja/d2r-auto.json work/glossary-report-ja.json --lang ja
node tools/make-todo.mjs versions/2026.1027.1/ko.json data/d2r-strings dict/ja/d2r-auto.json work/glossary-report-ja.json work/todo-ja all --lang ja --ref dict/zh-TW.json
node tools/check-batch.mjs work/todo-ja/batch-01.json dict/ja/manual/ui-01.json --lang ja
node tools/merge-dict.mjs versions/2026.1027.1/ko.json dict/ja.json $(node -e "import('./tools/langs.mjs').then(({layers,target})=>console.log(layers(target('ja')).join(' ')))")
node tools/term-analysis.mjs work/usage.json dict/ja.json work/term-report-ja.json
node tools/zh-fonts.mjs "C:/Program Files (x86)/Diablo II Resurrected" dict/ja.json data/d2r-strings work/fonts/ja --lang ja
node tools/patch.mjs backup/2026.1027.1/app.asar dict/ja.json work/app.asar --lang ja
node tools/where.mjs 非表示 --lang ja
```

- 各語言的修改規則群組在 `tools/patch-rules.mjs` 的 `LANGUAGES`：簡中跟繁中一樣是「後綴前綴物品」、不加空格，但不換全形冒號（D2R 簡中本來就用半形）；日文的魔法物品名稱是「前綴後綴物品」（D2R 日文的 MagicFormat `%0%2%1`），斷行加上日文禁則（長音、小寫假名不放行首，左括號不放行尾）
- 跨批統一用詞的一次性腳本：`work/unify-zh-CN.mjs`、`work/unify-ja.mjs`（結果寫進各自的 `overrides.json`、`modifiers.json`），決定紀錄在 [term-decisions.md](term-decisions.md)
- 發布時三種語言都會進 manifest（見下面的「發布」）

## 德文、法文、俄文（還在做，status: draft，不發布）

跟中日文同一套流程（`--lang de|fr|ru`，檔案在 `dict/<語言>/`，規範是 `docs/translation-guide-{de,fr,ru}.md`），不同的地方：

- **判斷有沒有翻**：德、法文跟英文同樣是拉丁字母，`langs.mjs` 標 `latin: true`，不用文字範圍判斷（`isText`）；俄文用西里爾字母判斷
- **詞性**（`gendered: true`）：D2R 的名詞標詞性「[fs]Kappe」，形容詞列出每種詞性的形式「[fs]robuste[ms]robuster[ns]robustes[pl]robuste」（法文的複數是 mp／fp）。`build-glossary.mjs`：
  - 一般顯示用的譯文取陽性單數（`langs.mjs` 的 `cleanD2R`）
  - `affix:<詞綴>`、`unique:<獨特怪物名字的前段>` 保留每種詞性的形式，給執行時的組合挑
  - `gender:<物品>` 是物品名稱和獨特怪物名字後段的詞性；D2R 沒標的、英文是 -s 結尾的當複數（Gants、Перчатки）
- **稀有名稱**（字典裡是整個名稱，不用規則）：德文「Bestien-Schneide」（前段的「 -」改成連字號）、法文「Tranchant de la bête」（後段 前段）、俄文「Звериная кромка」（形容詞照名詞的詞性）。見 `langs.mjs` 的 `rareJoin`
- **俄文的名稱是小寫**（「наголовник」）：英文 key 大寫開頭的，譯文第一個字母改大寫（`capitalize`）
- **數字**：可以用當地寫法（「1,5」「1.000」「1 000」），`check-alignment.mjs` 會換回來比對
- 統一用詞、修自動配對：`node work/unify-eu.mjs <de|fr|ru>`（角色稱號用 D2R 的 PlayerTitle、拾取篩選器的 Hide、全大寫按鈕改成全大寫）

### 字型實測（遊戲 2026.1027.1）

| | 結果 |
|---|---|
| ä ö ü ß、é è à ç ñ « » | 點陣字型（Latin-1）本來就有，不用改 |
| œ Œ、ł ą ę（波蘭文） | 畫成「?」：點陣字型只有 Latin-1。法文規範要求寫成 oe |
| 西里爾字母 | 畫成「?」：要像中日文一樣當「外文字」，用 canvas 字型畫 |

俄文字型試了三種（`work/translation/ru-proto.mjs` 在 debug 版上加範圍和字型，截圖在 `work/translation/ru-*.png`）：Exocet（D2R 的 exocetblizzardot-medium.otf，有西里爾字母，小寫畫成小型大寫，跟遊戲的拉丁字母一致）、Philosopher Bold Italic（D2R 的 philosopher-bolditalic.ttf，應該是俄文版代替 Formal436 的內文字型，小寫好讀但是斜體）、Kodia。建議：**標題、按鈕用 Exocet，內文用 Philosopher**。`node tools/zh-fonts.mjs … --lang ru` 產生 `work/fonts/ru/title.woff2`、`body.woff2`。

### 需要啟動器（patch-rules.mjs）和網頁書籤（web-rules.mjs）加的規則

參考實作和測試：`node work/translation/compose-proto.mjs dict/<語言>/d2r-auto.json <de|fr|ru>`。

1. **俄文：外文字範圍**。`HANGUL_RANGES` 那條再加 `||t>=1024&&t<=1279`（U+0400–04FF）
2. **俄文：字型**。外文字的字型家族照點陣字型分兩種（keepSave 的 `foreignFont()`）：標題字型（exocet10／24／30／42）用 `D2R Kodia`，內文用 `D2R Iris`（粗體）；沒有 D2R 時是 `D2 Hangul`／`D2 Hangul 14`。註冊 unicodeRange `U+0400-04FF`：`D2R Kodia` ← title.woff2，其他三個 ← body.woff2。網頁版沒有 D2R 字型的話用系統字型也可以
3. **魔法物品名稱**（三種語言各一個群組）。取代 `return[a(i),a(r),this.translateAs(`item`,t)].filter(Boolean).join(` `)`：
   - 詞性 `g = this.exact.get(s(`gender:${t.trim()}`)) ?? 'ms'`；`pick(v)`：`v` 開頭是 `[` 就取 `[g]` 後面那段（沒有就取第一段），否則原樣
   - 德文：`前綴 物品 後綴`，前綴結尾是「 -」時跟物品用連字號接（Engels-Ring），整個名稱第一個字母大寫：Robuste Kappe des Geistes
   - 法文：`物品 前綴 後綴`：Coiffe solide de l’esprit
   - 俄文：`前綴 物品 後綴`，有前綴時物品第一個字母改小寫，整個名稱第一個字母大寫：Прочный наголовник разума
4. **獨特怪物名字**（keepSave 的 `return`${a} ${r} ${i}``，r 前段、i 後段、a 稱號）：
   - 德文：`前段-後段 稱號`（Düsternis-Hauer der Hungrige）
   - 法文：`後段 前段 稱號`，前段照後段的詞性挑（Croc mélancolique l’Affamé）
   - 俄文：`稱號, 前段 後段`，前段照後段的詞性挑（D2R 的「%2, %0 %1」：Голод, Мрачный клык）
5. 斷行：三種語言都用空白斷行，不用改

## 發布

翻譯有變動、要讓啟動器和網頁版書籤拿到時：

```
node tools/publish.mjs
```

1. 合併每種語言的字典（`tools/langs.mjs` 的 `TARGETS`，用 `versions/` 裡最新一版的 key，字典層次是 `layers()`）→ `dict/<id>.json`
2. `tools/make-manifest.mjs site/data` 產生 manifest v2（格式見 [manifest-v2.md](manifest-v2.md)）：
   - `site/data/manifest.json`
   - `site/data/dict/zh-TW.json`、`zh-CN.json`、`ja.json`（字典網址帶 sha256 前 12 碼，內容換了網址就換了）
3. 只 `git add site/data/`、commit（不 push；push 之後 GitHub Actions 部署 Pages）。字典和規則都沒變時，manifest 不改寫，也不會 commit

manifest 各部分從哪裡來：

| 欄位 | 來源 |
|---|---|
| `languages[]` 的 `id`、`name`、`status` | `tools/langs.mjs` 的 `TARGETS` |
| `languages[]` 的 `entries`、`dict` | 合併後的 `dict/<id>.json` |
| `languages[].desktop`、`desktop` | `tools/patch-rules.mjs` 的 `LANGUAGES`、`RULES`、`ASSETS_DIR`、`DICT_TARGET`（啟動器聊天室維護） |
| `languages[].web`、`web` | `tools/web-rules.mjs` 的 `WEB_LANGUAGES`、`WEB_RULES`、`WEB_PLAY_URL`（網頁書籤聊天室維護）；還沒匯出 `WEB_LANGUAGES` 時不輸出 |
| `game.desktop` | `versions/` 裡最新一版 |
| `game.web_checked` | `tools/web-rules.mjs` 有匯出 `WEB_CHECKED` 才輸出 |
| `launcher` | 還沒有 GitHub Release，先不輸出。之後加的時候：`sha256_url` 指到的檔案是 sha256sum 格式（`<雜湊> <檔名>`），啟動器只取第一欄 |

狀態（`status`）：繁中 `available`；簡中、日文 `beta`。兩者都翻完、統一過用詞，也進遊戲走過主要畫面，查不到的字串 0 條，但還沒有玩家實際玩過的回報。有玩家回報、修過一輪之後，改 `langs.mjs` 的 `status`。

v1 的更新來源（`dist/`，`cycleapple/d2survivors-zh-tw-dist`）停在最後一版，不再更新。

## 遊戲更新後的流程

遊戲會自己更新（主選單出現「重新啟動以更新」），更新後 `app.asar` 會換成新版原版，中文就沒了。照下面重跑一次（以 2026.1027.1 為例；第一次做是 2026.1026.4 → 2026.1027.1，94 條新字串、2 條規則要改）：

```
# 1. 備份存檔，讓遊戲更新（按「重新啟動以更新」），更新完關掉遊戲
# 2. 備份新版原版、解開
mkdir -p backup/<新版本> && cp "%LOCALAPPDATA%/Programs/D2 Survivors/resources/app.asar"* backup/<新版本>/
rm -rf work/app && npx asar extract backup/<新版本>/app.asar work/app
# 3. 抽新的 key，跟上一版比對（新增、刪除、韓文改了）
node tools/extract-keys.mjs backup/<新版本>/app.asar versions/<新版本>/ko.json
node tools/diff-keys.mjs versions/<舊版本>/ko.json versions/<新版本>/ko.json work/diff.json
# 4. 重新自動配對、合併，看還缺哪些（缺的就是要補翻的）
node tools/build-glossary.mjs versions/<新版本>/ko.json data/d2r-strings dict/d2r-auto.json work/glossary-report.json
node tools/merge-dict.mjs versions/<新版本>/ko.json dict/zh-TW.json dict/d2r-auto.json dict/manual/audit-*.json dict/manual/ui-*.json dict/manual/long-*.json dict/manual/new-*.json dict/manual/modifiers.json dict/manual/overrides.json
#    補翻的寫成 dict/manual/new-<新版本>.json，再合併一次
# 5. 檢查修改規則；對不上的（依賴壓縮名稱的那幾條）用 find-anchors 找新寫法，照著改 tools/patch-rules.mjs
node tools/check-rules.mjs work/app
node tools/find-anchors.mjs work/app
# 6. 字型（新譯文有新字才會變）、打包、安裝
node tools/zh-fonts.mjs "C:/Program Files (x86)/Diablo II Resurrected" dict/zh-TW.json data/d2r-strings work/fonts-zh
node tools/patch.mjs backup/<新版本>/app.asar dict/zh-TW.json work/app.asar && node tools/install.mjs
# 7. 用途索引、用語分析（新譯文裡的名稱要跟介面一致）、進遊戲量測漏翻（make-debug.mjs，見上面）
node tools/usage-index.mjs work/app/desktop/dist/web "%APPDATA%/D2 Survivors/d2" versions/<新版本>/ko.json work/usage.json
node tools/term-analysis.mjs work/usage.json dict/zh-TW.json work/term-report.json
# 8. 發布（見上面的「發布」）
node tools/publish.mjs
```

測技能變體譯名的 `work/test-mods.js` 裡的檔名和匯出名稱（變體表匯出成什麼）每版都會變，用 `node work/find-export.mjs <keepSave 檔> <變體表名稱>` 查。

## D2R 官方譯名自動配對（2026.1026.4）

`d2r-strings.mjs` 借用遊戲自己的 CASC 讀取器（從 `extract-worker.cjs` 複製到 `work/casc-reader.cjs`，再匯出 `openCascFolder`），從 D2R 取出 21 個字串檔，共 12,245 條，每條都有 enUS／zhTW／koKR。`work/casc-reader.cjs` 是遊戲的程式，不放進 repo。

遊戲字典有 12,615 條，自動配對到 8,891 條（70.5%）：

| 方式 | 條數 | 說明 |
|---|---|---|
| english | 3,064 | 英文相同（去掉 `item:`、`affix:` 之類的前綴） |
| template | 68 | D2R 的 `%d`／`%+d`／`%s` 轉成 `*`／`#`，譯文轉成 `{0}`… |
| korean | 127 | 英文不同，但韓文跟 D2R 的 koKR 相同 |
| rareName | 2,056 | 稀有名稱「前段 後段」分開配對再組合，兩段的 koKR 接起來跟遊戲韓文一致 |
| rareNameStructural | 3,576 | 同上，但遊戲韓文是作者自己翻的，只靠 D2R 的 key 結構判斷（前段大寫 key、後段同名小寫 key）。**要抽查** |

還沒配對到的 3,724 條：長句（多半是更新說明和技能說明）1,225 條、短字串 1,903 條、數值樣板 593 條、其他 3 條。這些要另外翻譯。

`work/glossary-report.json` 列出每一類未配對的 key、有歧義的 114 條（列出所有候選）、以及結構組合的每一條。

`data/d2r-strings/`（D2R 原始字串檔）只能自己用，不要公開；`dict/d2r-auto.json` 配對出來的譯名會合併進公開的 `zh-TW.json`（見 [release.md](release.md)）。

## 翻譯（2026.1026.4）

- 翻譯規範：[translation-guide.md](translation-guide.md)（佔位符、標點、稀有名稱組法、核心用語表）
- `dict/manual/ui-01～06.json`：還沒配對到的樣板和短字串 2,544 條，照規範翻譯，各批都用 `check-batch.mjs` 檢查過，跨批的用語不一致也統一過（變體、重新抽選、合規、暫停…）
- `dict/manual/long-01～06.json`：長句 1,225 條（改版說明、技能說明），`check-batch.mjs`、`check-alignment.mjs` 都通過
- `dict/manual/audit-01～02.json`：自動配對的審核結果，403 條裡改了 58 條（Vortex 旋風斬 → 漩渦、Searing 猛燃者 → 灼燒、KEEP 存入 → 保留、RELOAD 更新 → 重新載入、Report 舉報 → 回報、Mercenary 傭兵物品欄 → 傭兵…）
- `dict/manual/overrides.json`：實測後的修正，最後合併；也可以放韓文字典沒有的 key（例如 `Evolves * into *:`）
- 合併後 `dict/zh-TW.json` 共 12,616 條，**覆蓋 100%**（多 1 條是韓文字典沒有的 `Evolves * into *:`）
- 拿不準、要人工確認的條目：[review-todo.md](review-todo.md)

注意：
- `*` 會填入「數字＋名詞」（`1 bolt` 先翻成「1枚」再填進去），所以樣板本身不能再補量詞
- 同一個英文 key 可能同時是技能名稱和技能變體（Vengeance、Sacrifice、Inferno），也可能同時是技能變體和稀有物品名稱（Storm Edge）。遊戲只有一個 key，譯名只能選一個：技能名稱優先用官方譯名
- 稀有物品名稱的前段、後段用 D2R 官方組字（Ward → 守護、Shroud → 罩衣），不要因為技能變體改名就跟著改
- 平行翻譯時，每個翻譯者的暫存檔要放在自己的資料夾（`work/audit/tmp-01/` 這種），共用暫存資料夾會互相覆蓋

## 待辦

- 角色名稱只允許英文字母和韓文（keepSave 裡的 `A-Za-z가-힣`）
- 有歧義的 102 條、[review-todo.md](review-todo.md) 的條目要人工確認

## 遊戲內實測（2026.1026.4，d2r-auto.json 8,846 條）

正常：區域（俠盜營地、鮮血荒地、第一章 - 普通）、角色面板（等級、力量、抗火…）、職業、技能名稱和技能樹分頁、物品和魔法物品名稱、怪物（沉淪魔、屍火、安達莉爾…）、傳送平台、難度、D2R 樣板（「煉獄之火可從以下獲得加成效果：」）。

當時的問題（都已經解決，見下一節）：
- 升級卡片的進化說明會逐字翻：「Into Chain Lightning:」這類樣板沒中文時，卡片會把那行拆成單字各自查，變成「Into 火焰 Ball」。也因為這樣，單字 key（Chain、Orb）不能用稀有名稱的後綴形式（之鏈、之球）；`build-glossary.mjs` 現在會跳過這種，列在報告的 `suffixForm`
- 句子查不到時，翻譯器會在「: 」切開只翻得到的那半，出現「火焰傷害: 21 a bolt」這種中英混雜
- 遊戲自己的用語（Faster Cast Rate、Magic Find、Level Up、Reroll／Skip／Banish…）還是英文

## 遊戲內實測（2026.1026.4，zh-TW.json 11,391 條）

升級卡片整張中文：「升級」「新技能 1/6」「向最近的怪物發射1枚火焰彈，造成21點傷害。」「進化為火球術：最大 1/8，暖流，從等級12起」「重抽 (R) · 2／跳過／排除」；長句會自動斷行。HUD：「擊殺 2」「0金幣」「生命：80 / 80」。

## 遊戲內實測（2026.1026.4，zh-TW.json 12,616 條）

標題畫面（「點擊或按任意鍵」、版權聲明）、主選單（網站／新聞、進行遊戲、選項、存檔、離開）、新聞頁的改版說明（整頁中文、長句會斷行）、技能變體說明（分裂、霜燃、沉重、「對付怪物群更強」）都正常。用翻譯函式確認審核修正生效：漩渦、灼燒、保留、重新載入、跳過、回報、傭兵、粉碎打擊、首領、暗影守護、復仇打擊。實測時發現「Latest」被配成「現代」，已改成「最新」。
