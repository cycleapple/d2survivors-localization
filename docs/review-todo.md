# 待人工確認的譯文

第一輪 UI 翻譯（`dict/manual/ui-01～06.json`）時，翻譯者標出來拿不準的條目。改好的直接修改對應的 `ui-XX.json`，或寫進 `dict/manual/overrides.json`（最後合併，會蓋過前面）。

> **2026-10-27（遊戲 2026.1027.2）**：「意思不確定」「第二輪」「樣板」三節已經對照遊戲程式碼逐條處理完，每條的依據和決定見 [review/todo-2026.1027.2.md](review/todo-2026.1027.2.md)；修正放在 `dict/manual/review-todo-2026.1027.2.json`（繁中 13 條，含聖光彈複數的專用樣板）和 `dict/zh-CN/manual/review-todo-2026.1027.2.json`（簡中 14 條）。下面的清單留著反查。日文、歐洲語言跑正式版標準時，聖光彈的 `pierce`／`Pierce` 撞名要各自檢查。

## 系統用語（全專案統一，已套用）

| 英文 | 譯法 | 說明 |
|---|---|---|
| Modifier／Skill Modifier Point | 變體／技能變體點數 | 第 1 批原本是「修正」，已統一 |
| re-draft | 重新抽選 | 原本有「重選」「重抽」，已統一；Reroll 是「重抽」 |
| legit／not legit | 合規／不合規 | 原本有「合法」，已統一 |
| rest（暫時關閉技能） | 暫停 | REST SKILL → 暫停技能 |
| rank（Charsi 賣的強化） | 階 | 跟 Terror tier 的「階」同字，可能混淆；也有幾條譯成「每級」 |
| Tier | 階 | Terror tier # → 恐懼第{0}階 |

## 稀有名稱後段（D2R 沒有，自訂）

Glare → 之凝視、Mauler → 重擊者、Road → 之路、Sphere → 之球體、Stalk → 之潛獵、Pelt → 獸皮（Beast Pelt 變成「野獸獸皮」，可考慮改「之皮」）

## 意思不確定

- `Found` → 搜尋結果（如果是「已找到」的計數標籤要改）
- `Taken:` → 已取回（如果是「受到的傷害」要改成「受到：」）
- `Plus` → 加強（韓文只是音譯，看不出用途）
- `hand #` → 手{0}（武器手還是牌？）
- `+1 slower` → 較慢則 +1
- `Runs not sent to the leaderboard` → 紀錄不會送出至排行榜（狀態還是選項？）
- `From gear, half its Increased Attack Speed, its mana and the card` 的斷句
- `Akara's re-draft gives back a legit hero's` → 取回的是點數還是金幣
- `Nothing else: no account, no address` → address 指 IP、email 還是住址
- `One Tree`、`Three in a Row`、`Every Act`、`The portal back`：成就名稱，條件不明
- `Books and Tomes` → 技能書／秘典
- `The Harrowing` → 劫難、`The Sightless Eye` → 盲目之眼、`The Secret of the Vizjerei` → 費斯傑利的秘密（各章標題，D2R 沒有官方譯名）
- `Duriel's Lair` → 都瑞爾的巢穴（D2R 同一個 key 是「塔拉夏的密室」，照英文譯）
- `Sword Mastery` → 利刃專精（D2R 的 Blade Mastery 官方名）
- `Frost Charge` → 冰霜充能（也可能是「衝鋒」）、`Napalm` → 燃油
- `Vex` → 折磨、`Trump` → 王牌（不是符文伐克斯）
- `title:Patriarch`／`title:Matriarch` → 都是「統領者」

## 第二輪：長句（long-01～06）和自動配對審核（audit-01～02）

用語（翻譯者自訂，已大致一致）：
- 技能變體名稱多半沿用 `zh-TW.json` 現有的，改版說明裡用「」框起來，例如「白霜軌跡」「靜電大地」
- Charsi's ranks → 恰西強化階（已統一）；charges（刺客、Fury、Maul 的層數）→ 集氣；synergy → 協同加成；super unique → 超級獨特怪物；monster mods → 怪物詞綴；hover box → 說明框；monster bar → 怪物血條（第 3 批寫成「怪物資訊列」，要統一）
- Sanctuary（世界）→ 庇護之地、nephalem → 奈非天（照《暗黑破壞神 III》繁中）

意思不確定：
- `barrels and urns stand where they did`：英文和韓文的意思相反（照舊擺在原處／原處改放木桶）
- `Holy Shield`「提供的格擋機率降低三分之一」：是技能加成還是總格擋機率
- `twice as close` → 「近一倍」有歧義
- `Treehead leaves the Tree, Rakanishu the stones`、`keeps you between himself and the monsters`、`drinks a hireling's double`、`past his grace`
- `none below #%`：是「生命低於 #% 時不消耗」還是「低於 #% 不使用技能」
- `Greater Mummy` → 解繃者（D2R 沒有這個名稱）
- `A Terror offer` → 恐懼階邀約；`trap depth` → 進化深度；`on a continued Hell` → 接續進行的地獄難度
- 頭銜：title:Slayer → 殺戮者、title:Champion → 奪冠者（照 D2R 角色頭銜），Patriarch／Matriarch 都是統領者

技能變體名稱（審核改的、可以再斟酌）：
- Vortex 漩渦、Searing 灼燒、Cyclone 颶風、Firewall 焰牆、Bramble 刺藤、Purge 肅清、Contemplation 沉思、Horror 驚駭、Spikes 尖刺、Crush 粉碎、Crushing 崩碎、Return 折返、Ward 結界、Shroud 籠罩
- 保留 D2R 官方名、但跟 D2R 的技能或怪物同名的：Venom 淬毒、Taunt 嘲諷、Cleave 斬劈、Huntress 女獵手、Snare 圈套、Alpha 頭目
- 撞名：Frostburn 和 Frostfire 都是「霜燃」；Gut 開膛 和 Ripper 開膛手很像
- Lance → 長槍，用在 6 個技能上，有些不貼切
- `Remaining` → 剩餘，跟上一行「剩餘點數」（Stat Points）連起來讀會重複，建議 Stat Points 改「能力點數」

## 樣板要在遊戲裡看實際效果

`*` 會填入「數字＋名詞」（例如 `1 bolt`），樣板本身不要再補名詞或量詞，否則會變成「1發飛彈枚火焰彈」。已修正火焰彈、電能彈兩條（見 overrides.json）。下面這些第 1、2 批的翻譯者也懷疑有同樣的問題：

- `* hit the monsters in reach for * damage each.`（補了「次攻擊」）
- `Delivers # of # damage to the toughest in reach...`
- `Crushes # for # damage and knocks them back.`（補了「隻怪物」）
- `Fires # of # damage that # for #s.`、`Fires # of # damage that # target.`、`Fires # of ice that # # and #, for # damage.`
- `# # for # damage around what #.`、`# # at monsters ...`、`# # after monsters ...`
- `* out around you for * damage to all *.`

測法：遊戲開著時用 `tools/cdp.mjs` 的 eval 呼叫翻譯函式（見 README），或在升級卡片上看。
