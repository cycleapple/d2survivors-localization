# 用語決策紀錄

為什麼某個詞這樣譯、改過什麼、依據是什麼。新的決定加在最上面。

反查一個詞（對應哪些 key、最後是哪個字典檔決定的、各層原本怎麼譯、在遊戲裡當什麼用）：

```
node tools/where.mjs 火海
node tools/where.mjs Vengeance --exact
```

`where.mjs` 的「用途」來自 `work/usage.json`，遊戲改版後要重新產生（見 README 的「字串用途索引」）。

其他相關文件：翻譯規範和核心用語表在 [translation-guide.md](translation-guide.md)；翻譯者標出來、還沒人工確認的條目在 [review-todo.md](review-todo.md)。

---

## 2026-10-27　德文、法文、俄文草稿（遊戲 2026.1027.1）

自動配對（D2R deDE／frFR／ruRU）＋分批翻譯，統一用 `node work/unify-eu.mjs <de|fr|ru>`（寫進各自的 `overrides.json`）。還是 status: draft，等修改規則做好才發布。

- **角色稱號 title:**：自動配對抓到詞綴（德 Schlitzer、法 Égorgeuse），改用 D2R 的 PlayerTitle：Schlächter／Tueur／Истребитель 等
- **拾取篩選器 Hide**：Leder／Cuir／Шкура（毛皮）→ Ausblenden／Masquer／Скрыть（跟繁中、日文同一個問題）
- **全大寫的按鈕**：D2R 對到大小寫混合的字串（RESUME → Weiterspielen）改成全大寫；有大小寫不同的同名 key（PLAY／Play）時兩個用同一個譯文（遊戲查字典不分大小寫）。法文 Play 用 Jouer（D2R 的 PARTIE 是「一局」）
- **角色畫面欄位**：實測俄文整個超出框外，改用 D2R 式的縮寫：Скор. умений、Сопр. огню、Feuerwid.、Résist. au feu…；德文 Dexterity 保留 D2R 的「Geschick.」。Attack Damage 原本是逐字翻的（Angreifen Schaden／Атака Урон），改成 Angriffsschaden／Dégâts d’attaque／Урон атаки
- **俄文的冷氣屬性**：規範原本寫 холод，D2R 是 лед（урон от льда），各批一半一半，統一成 лед 並照格變化（холода → льда…），規範也改了
- **還沒統一的**：各批自創的技能變體名稱（德 Erfrierung、法 Engelure…）有沒有前後一致、法文 Stash 用 coffre 跟寶箱同字，要等用語分析和實測

## 2026-10-27　簡體中文、日文（遊戲 2026.1027.1）

兩種語言都從 D2R 的 zhCN／jaJP 欄自動配對（簡中不是由繁中轉換，用中國大陸的遊戲用語），沒配對到的分批翻譯，再用 `work/unify-zh-CN.mjs`、`work/unify-ja.mjs` 統一各批的用詞。反查加 `--lang`：`node tools/where.mjs 猎法者 --lang zh-CN`。

**簡中（`dict/zh-CN/manual/overrides.json`）：**
- Assassin 刺客 → 猎法者（D2R 簡中介面的職業名稱）；Sorceress 法师 → 巫师
- 用多數寫法：AUTO STATS 自动加点、REPORT 反馈、build 配置、Horadric Codex 赫拉迪姆法典、Faster Cast Rate 施法速度
- 樣板：`Fires # at the nearest monsters…` 的 `#` 會填入「數字＋量詞」，樣板不再補量詞；章節標題 `The Sightless Eye. *` 跟章節名稱一致
- 技能變體專用譯名（`modifiers.json`）：Vengeance 报复、Sacrifice 献祭、Inferno 烈焰、Firestorm 火海、Maul 重锤、Venom 猛毒、Taunt 挑衅、Alpha 兽王

**日文（`dict/ja/manual/overrides.json`）：**
- 拾取篩選器 Hide 皮 → 非表示（跟繁中同一個問題）；Kept 保管済み → 収集済み（跟 IN MY COLLECTION 一致）
- 大小寫撞名：spiral/Spiral 都是「螺旋」；RUMBLE（手把震動）和 Rumble（跳躍的變體）都是「振動」
- 章節標題 `The Harrowing. *` 苦難の時 → 地獄巡り（跟章節名稱一致）
- 改版說明裡的變體名稱改成名稱本身（調律、大量出血、雹の嵐、天罰、切り返し、軍旗、悪意、蘇生…共 17 條）；SAVES 一律「セーブデータ」；Sell Price 一律「売値」
- 技能變體專用譯名（`modifiers.json`）：Vengeance 復讐、Sacrifice 生贄、Inferno 業火、Firestorm 火の海、Maul 重撃、Venom 猛毒、Taunt 引きつけ、Alpha 群れの長；另外 Static 静電気（D2R 的「痺れる」是形容詞）、Champion 精鋭（不用怪物前綴的「凶悪なる」）
- 保留官方譯名：Magic Find アイテムドロップ（D2R 日文介面；角色畫面的欄位窄，會斷成兩行）、EXIT 終了する
- 稀有名稱後段「刃／の刃」之類的差異是 D2R 日文前段有的帶「の」、有的不帶，都是官方譯名，不改

**驗證：** 兩種語言都走過主選單、選項、存檔、新聞、物品欄、技能樹、一局（選卡 10 次），查不到的字串 0 條；魔法物品名稱順序（日文「深紅を帯びた魔力のキャップ」）、版權聲明寬度正常。

## 2026-10-27　遊戲更新到 2026.1027.1

- **新字串：** 韓文字典新增 94 條、刪除 5 條，韓文譯文沒有改過的。新增的都不在 D2R 裡，全部補翻在 `dict/manual/new-2026.1027.1.json`，大多是改版說明，另有拾取篩選器的「BETTER ONLY → 只要更好的」、技能說明框的「冷卻：{0}秒」「每次施放命中{0}次」等
- **修改規則：** 12 條裡有 10 條照樣對得上；「版權聲明寬度」「技能變體專用譯名」依賴壓縮名稱，用 `tools/find-anchors.mjs` 找到新寫法後更新
- **用語分析抓到的：** 新譯的「War Banner now marks its reach…」把技能變體 War Banner 寫成「戰旗」，字典裡它叫「戰爭旗幟」，已改成一致
- **拾取篩選器和「獨特」分頁的選項：** 用途索引顯示它們在 `{pick,keep,hide,sell,better}`、`{all,kept,missing}` 裡。Hide 毛皮 → 隱藏（D2R 的毛皮是皮革材質；遊戲韓文也寫成「가죽」皮革，韓文版同樣有這個錯），Pick up 拿取 → 拾取（跟「拾取篩選器」一致），Kept 存入 → 已收藏（跟「已收藏」IN MY COLLECTION 一致）。都在 `overrides.json`
- **驗證：** 走過主選單、選項、存檔、新聞（捲到底）、營地、物品欄、技能樹、一局（選卡 12 次）、暫停選單，查不到的字串 0 條；技能變體專用譯名、版權聲明都正常

## 2026-10-27　技能變體專用譯名（遊戲 2026.1026.4）

**問題：** 用語分析（`tools/term-analysis.mjs`）發現有些技能變體跟別的技能或怪物同名。遊戲只有一個 key，所以變體卡片會顯示成別的職業的技能名稱，例如荊棘之靈的變體 Vengeance 顯示成聖騎士的技能「復仇打擊」。

**做法：** 修改規則「技能變體專用譯名」（`tools/patch-rules.mjs`）。在變體表定義完之後，把每個變體的 `name` 換成 getter：
- 翻譯時先查 `modifier:名稱`，查不到就照一般譯名。
- 英文模式照原本的英文。

專用譯名在 `dict/manual/modifiers.json`，只有下面這 8 個需要；其他 330 多個變體行為不變。

| 專用 key | 所屬技能 | 變體效果 | 原本顯示 | 改成 | 原因 |
|---|---|---|---|---|---|
| modifier:Vengeance | 荊棘之靈 | 生命低於 40% 時反彈 2.5 倍傷害 | 復仇打擊 | 復仇 | 原本是聖騎士技能名 |
| modifier:Sacrifice | 吸引 | 被詛咒的怪物死亡時爆炸 | 犧牲打擊 | 獻祭 | 原本是聖騎士技能名 |
| modifier:Inferno | 火焰魔像 | 神聖之火傷害提高 53% | 煉獄之火 | 烈焰 | 原本是女巫技能名 |
| modifier:Firestorm | 獻祭箭 | 燃燒地面範圍加倍 | 火焰風暴 | 火海 | 原本是德魯伊技能名 |
| modifier:Maul | 心靈之鎚 | 一記重擊打最強的怪物 | 槌擊 | 重錘 | 原本是德魯伊技能名 |
| modifier:Venom | 導引箭、雙重投擲 | 一半傷害轉為毒素 | 淬毒 | 劇毒 | 意思相近，但跟刺客技能同名 |
| modifier:Taunt | 鋼鐵魔像 | 吸引附近怪物攻擊魔像 | 嘲諷 | 挑釁 | 意思相近，但跟野蠻人技能同名 |
| modifier:Alpha | 召喚灰熊 | 只召喚灰熊和掠鴉，揮擊更強 | 頭目 | 獸王 | 「頭目」像首領 |

同名但**不改**的變體：它們用怪物名稱或原譯名反而貼切，例如 Huntress 女獵手、Strangler 扼殺者、Burning Dead 烈焰骷髏、Slayer 屠殺者、Static 靜電、Swarm 蜂擁、Horror 驚駭。

**同時改的句子**（也在 `modifiers.json` 裡）：
- 「Spirit of Barbs' Vengeance now returns…」→「荊棘之靈的「復仇」…」
- 「Immolation Arrow's Firestorm blast…」→「熾炎箭的「火海」爆炸…」

其他提到 Vengeance、Sacrifice、Inferno 等的句子講的是技能本身，例如聖騎士的復仇打擊、刺客的淬毒，維持官方譯名。稀有物品名稱（復仇勾刺）也不受影響。

**驗證：** 在遊戲頁面讀取變體表（keepSave 匯出為 `wd`），測試腳本是 `work/test-mods.js`：
- 中文模式：8 個變體顯示新譯名，同名技能維持官方譯名，其他變體照常（火焰彈的「分裂」）。
- 英文模式：全部是原本的英文。
- 技能樹的變體說明面板正常顯示。

**遊戲改版後：** 規則依賴壓縮後的名稱（`zs`、`Bs`、`Vs`，以及 keepSave 匯入的 `h`、`m`），對不上時 patch.mjs 會報錯，要重新找變體表的結尾。方法見 `work/find-mod-end.mjs`：用語法樹找 `zs={…}` 的結尾和 lang 的匯入名稱。

## 2026-10-27　大小寫撞名（遊戲 2026.1026.4）

**問題：** 遊戲的翻譯器比對時不分大小寫，所以「RUMBLE」和「Rumble」是同一個 key，只有字典裡排在後面的譯文會生效。手把選項「RUMBLE」原本會顯示技能變體的譯名「隆隆」。

**做法：** 同一組的兩個寫法給一樣的譯文（`dict/manual/overrides.json`），選兩種用途都說得通的譯法。依據是 `work/usage.json` 裡的用途：

| key | 用途 | 原本 | 統一成 |
|---|---|---|---|
| RUMBLE ／ Rumble | 手把震動選項／跳躍的技能變體（落地震地） | 震動／隆隆 | 震動 |
| RINGS ／ Rings | 物品分類對照表的戒指類別 | 戒指／指環 | 戒指（D2R 官方） |
| spiral ／ Spiral | 祝福之鎚說明裡鎚子的軌跡 | 盤旋／螺旋 | 盤旋 |
| bolt ／ Bolt | 技能說明裡發射出去的投射物 | 飛彈／弩箭 | 飛彈 |

引用「隆隆」的改版說明（跳躍的震動）也一起改了。`term-analysis.mjs` 現在會檢查這種情況，重跑時應該是 0 組。

## 2026-10-27　句子裡的名稱要跟名稱本身一樣（遊戲 2026.1026.4）

- 信念的變體 Lingering 叫「滯留」，改版說明「Conviction's Lingering…」原本寫成「殘留」，已改成「滯留」（`overrides.json`）。
- `term-analysis.mjs` 列出的其他 16 處是自然的寫法差異，**不改**：
  - 技能名「熊人變化」在句子裡寫成「變身熊人」
  - 技能名「致命攻勢」和遊戲機制「致命一擊」
  - 「Charged Bolt, Lightning and Death Sentries」是陷阱名（電能衛哨…）
  - 「Blizzard」在句子裡指公司
