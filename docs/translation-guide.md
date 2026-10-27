# 翻譯規範（D2 Survivors 繁體中文）

目標讀者是玩過《暗黑破壞神 II：獄火重生》繁中版的台灣玩家。用語以 D2R 官方繁中為準，語氣自然、簡潔，像遊戲介面，不像說明書。

## 檔案格式

- 輸入：`work/todo-ui/batch-XX.json`，每條是 `{ key, ko, hints }`
  - `key`：遊戲的英文原文，也是字典的 key，**不要改**
  - `ko`：韓文版譯文，用來看佔位符的順序和這句話實際怎麼用
  - `hints`：句子裡出現的詞在 D2R 官方繁中的譯法（`[英文, 繁中]`），也可能是稀有名稱的組合例子
- 輸出：`dict/manual/ui-XX.json`，一個 JSON 物件 `{ "英文 key": "繁中譯文", … }`，每條輸入都要有。檔案用 UTF-8

## 佔位符（最重要）

- key 裡的 `*` 代表一段文字（遊戲會先翻好再填進來），`#` 代表數字
- 譯文用 `{0}`、`{1}`… 指到 key 裡第 1、第 2… 個 `*` 或 `#`（照出現順序，`*` 和 `#` 一起算）
- **譯文的佔位符必須跟 `ko` 完全一樣**（同樣這幾個編號，各出現一次），順序可以依中文語序調整
- key 裡的 `+`、`%`、`×`、`/` 等符號跟著佔位符一起保留，例如 `+#% gold` → `金幣 +{0}%`
- 沒有 `*`、`#` 的 key，譯文裡也不能有 `{0}`
- key 裡有換行（`\n`）就保留換行

## 標點與格式

- 用全形標點：`：`、`，`、`。`、`？`、`！`、`（）`，引號用 `「」`，遊戲名稱用 `《》`
- 例外：` · `、` / `、` - ` 這種分隔符照原文保留（遊戲會用它們切開再分段翻譯）
- 中文和數字、英文之間不用特別加空格；保留原文本來就有的空格分隔（例如 `生命: 80`這種 UI 數值顯示以原樣式為準）
- key 全大寫的（`NEW RUN`、`MAIN MENU`）是按鈕或標題，譯得短一點
- 專有名詞、按鍵、品牌照原文：Discord、Steam、Battle.net、Enter、Esc、Tab、A／B／X／Y、LB、RT、DPS、MF、XP 等
- 遊戲名稱：Diablo II → 《暗黑破壞神 II》，Diablo II: Resurrected → 《暗黑破壞神 II：獄火重生》，Lord of Destruction → 毀滅之王

## 片段字串

有些 key 不是完整的句子，而是執行時會拼起來的片段，例如 `, after this difficulty's #`、`spirals`、`to`。先看 `ko` 理解它怎麼用，再譯成拼起來讀得通的中文片段。拿不準的就譯成最中性的說法。

## 稀有物品名稱

像 `Beast Glare`、`Viper Grasp` 這種兩個英文字、首字大寫的通常是稀有物品名稱（前段＋後段）。照 D2R 繁中的組法：**前段＋後段，中間不加空格**，後段常用「之X」的形式。

- 先用 `hints` 裡同一個字的官方譯法（例如 Beast → 野獸，`Beast Aegis` → 野獸之禦）
- 後段沒有官方譯法的，自己譯一個簡潔的名詞，同一個英文字在所有名稱裡都要用同一個譯法（例如 Glare 一律 → 之凝視）
- 怎麼判斷不是稀有名稱：`ko` 是一般說明、或明顯是 UI 用語（`Attack Rating`、`Gold Find`），就照一般用語譯

## 單字

沒有前綴的單一英文字（`Chain`、`Orb`、`Circle`）會在整句查不到時被拿來逐字翻譯，要譯成一般用法的名詞或動詞，**不要**用稀有名稱的「之X」形式。看 `ko` 判斷意思，例如 `Circle` 的 ko 是「○버튼」→ 手把的「○ 鍵」。

## 核心用語（D2R 官方繁中）

| 英文 | 繁中 | 英文 | 繁中 |
|---|---|---|---|
| Magic Find | 魔寶尋獲率 | Gold Find／Extra Gold | 金幣尋獲率（怪物金幣掉落量） |
| Attack Rating | 準確率 | Defense | 防禦 |
| Faster Cast Rate | 施法速度 | Faster Run/Walk | 跑步 / 行走速度 |
| Faster Hit Recovery | 打擊恢復 | Faster Block Rate | 格擋速度 |
| Increased Attack Speed | 攻擊速度 | Enhanced Damage | 傷害強化 |
| Damage Reduced | 傷害降低 | Crushing Blow | 粉碎打擊 |
| Deadly Strike | 致命打擊 | Open Wounds | 開放傷口 |
| Life／Mana stolen per hit | 擊中竊取生命／法力 | All Resistances | 所有抗性 |
| Fire／Cold／Lightning／Poison | 火焰／冰寒／閃電／毒素 | Resist | 抗性（抗火、抗寒、抗電、毒素抗性） |
| Experience／XP | 經驗值 | Level | 等級 |
| Required Level | 需要等級 | Requirements | 需求 |
| Strength／Dexterity／Vitality／Energy | 力量／敏捷／體能／能量 | Life／Mana | 生命／法力 |
| Skill／Skills | 技能 | Passive | 被動 |
| Aura | 靈氣 | Curse | 詛咒 |
| Summon | 召喚 | Knockback | 擊退 |
| Chill／Freeze | 冰緩／凍結 | Pierce | 穿透 |
| Slow | 緩速 | Elite（物品、怪物） | 精英 |
| Gold | 金幣 | Sell／Buy／Repair | 出售／購買／修復 |
| Stash | 儲物箱 | Inventory | 物品欄 |
| Mercenary／Hireling | 傭兵 | Waypoint | 傳送平台 |
| Shrine | 聖壇 | Potion | 藥水 |
| Charm（Small／Large／Grand） | 咒符（小型／大型／特大） | Rune／Gem／Jewel | 符文／寶石／珠寶 |
| Normal／Magic／Rare | 普通／魔法／稀有 | Set／Unique | 套裝／獨特 |
| Superior／Ethereal／Socketed | 上等／無形／鑲孔 | Durability | 耐久度 |
| Champion（怪物） | 精英 | Unique（怪物） | 獨特 |
| Minion | 僕從 | Boss | 首領 |
| Normal／Nightmare／Hell（難度） | 普通／惡夢／地獄 | Difficulty | 難度 |
| Act 1～5 | 第一章～第五章 | Hero | 英雄 |
| Cooldown | 冷卻時間 | Run（一局遊戲） | 一局（New Run → 新的一局） |
| Kills | 擊殺 | Leaderboard | 排行榜 |
| Level Up | 升級 | Reroll／Skip／Banish | 重抽／跳過／排除 |
| Evolve／Evolves into | 進化／進化為 | Tier（Terror Tier） | 階（恐懼階） |
| Terror | 恐懼 | Save | 存檔 |

## 本專案自訂的系統用語（遊戲自己的機制，D2R 沒有）

| 英文 | 譯法 | 英文 | 譯法 |
|---|---|---|---|
| Skill Modifier／Modifier | 技能變體／變體 | Skill Modifier Point | 技能變體點數 |
| draft／drafted（升級抽卡） | 抽選／選用 | re-draft | 重新抽選 |
| Reroll／Skip／Banish | 重抽／跳過／排除 | card（升級卡片） | 卡片 |
| rest（暫時關閉技能）／Rested | 暫停／暫停中 | take it up again | 重新啟用 |
| legit／not legit | 合規／不合規 | ranked／not ranked | 列入排名／不列入排名 |
| rank（恰西賣的強化） | 階 | Terror tier # | 恐懼第{0}階 |
| run（一局） | 一局 | camp | 營地 |
| kept hero／keep | 保留的英雄／保留 | hero | 英雄 |
| climb（恐懼階攀升） | 攀升 | act boss | 章節首領 |
| Tome／Book | 秘典／技能書 | Charms window | 咒符欄 |
| proc（裝備觸發） | 觸發 | DPS | DPS（每秒傷害） |
| desktop app | 桌面版 | website | 網站 |

人名用 D2R 官方：Akara 阿卡拉、Charsi 恰西、Gheed 基德、Kashya 卡夏、Warriv 瓦瑞夫、Fara 法拉、Ormus 奧瑪斯、Larzuk 拉蘇克、Anya 安亞、Malah 瑪拉、Tyrael 泰瑞爾、Deckard Cain 迪卡‧凱恩、Andariel 安達莉爾、Duriel 都瑞爾、Mephisto 墨菲斯托、Diablo 迪亞布羅（指魔王；指遊戲時是《暗黑破壞神 II》）、Baal 巴爾、Nihlathak 尼拉塞克。查不到的用 `lookup.mjs` 查。

## 長句（改版說明、技能說明）

- 多半是改版說明，一條講一件改動。寫成簡潔的陳述句：「現在……」「不再……」「改為……」「修正……的問題」。不要加「您」，稱呼玩家用「你」（跟 D2R 一樣）
- 一條英文可能有好幾個子句，中文可以重排語序，但不要漏資訊，數字、百分比、技能名稱都要保留
- 技能、物品、怪物、區域名稱一律用官方譯名（看提示或 `lookup.mjs`），遊戲裡的按鈕、選項名稱用 `dict/zh-TW.json` 裡已經翻好的譯法（例如 SHOW DAMAGE → 用 `zh-TW.json` 裡的譯文），讓說明裡提到的名稱跟介面一致
- 很長的一句可以用「，」「；」斷開，句尾不用加句號（英文原文沒有句號就不加）

## 提示只是查表結果

`hints` 是用字面比對查出來的，常會有誤配，例如 Count → 伯爵（應該是「數量」）、Left → 左（應該是「剩下」）、Mercenary → 傭兵物品欄（應該是「傭兵」）。**核心用語表和本專案用語優先**，提示只在專有名詞（技能、物品、怪物、區域）上參考。

查不到的 D2R 用語可以用 `node tools/lookup.mjs data/d2r-strings "片語"` 查官方譯法，也可以搜尋 `dict/d2r-auto.json`。
