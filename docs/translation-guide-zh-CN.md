# 翻译规范（D2 Survivors 简体中文）

读者是玩过《暗黑破坏神 II：狱火重生》简体中文版的中国大陆玩家。用语以 **D2R 官方简体中文** 为准，用大陆的说法，语气自然、简洁，像游戏界面，不像说明书。

**不是把繁体中文转成简体。** 输入里的 `ref` 是繁体中文版的译文，只用来理解这句话在游戏里的意思；繁中的用词很多跟大陆不一样（见下面「常见的繁中与简中差异」），不要照抄。

## 文件格式

- 输入：`work/todo-zh-CN/batch-XX.json`，每条是 `{ key, ko, ref, hints }`
  - `key`：游戏的英文原文，也是字典的 key，**不要改**
  - `ko`：韩文版译文，看占位符的顺序和这句话怎么用
  - `ref`：繁体中文版的译文（有的才有），只当意思参考
  - `hints`：句子里的词在 D2R 官方简中的译法（`[英文, 简中]`），是字面比对查出来的，可能会错配
- 输出：`dict/zh-CN/manual/XX-NN.json`（文件名见任务说明），一个 JSON 对象 `{ "英文 key": "简中译文", … }`，每条输入都要有。UTF-8

## 占位符（最重要）

- key 里的 `*` 代表一段文字（游戏会先翻好再填进来），`#` 代表数字
- 译文用 `{0}`、`{1}`… 指 key 里第 1、第 2… 个 `*` 或 `#`（按出现顺序，`*` 和 `#` 一起算）
- **译文的占位符必须跟 `ko` 完全一样**（同样这几个编号，各出现一次），顺序可以按中文语序调整
- key 里的 `+`、`%`、`×`、`/` 跟着占位符保留，例如 `+#% gold` → `金币 +{0}%`
- **`*` 常常会填进「数字＋名词」**（例如 `1 bolt` 先翻成「1枚」再填进来），模板里不要再补量词或名词，否则会变成「发射1枚枚火焰弹」。不确定就用 `ref` 的写法当参考
- 没有 `*`、`#` 的 key，译文里也不能有 `{0}`；key 里有换行（`\n`）就保留

## 标点与格式（照 D2R 简中）

- 句子用全角标点：`，`、`。`、`？`、`！`、`（）`；引号用 `“”` 或 `「」`都可以，同一批里统一用 `“”`
- **「标签: 数值」用半角冒号加空格**，跟 D2R 一样：`掉宝率: +{0}%`、`需要等级: {0}`
- ` · `、` / `、` - ` 这种分隔符照原文保留（游戏会用它们切开再分段翻译）
- key 全大写的（`NEW RUN`、`MAIN MENU`）是按钮或标题，译得短一点
- 专有名词、按键、品牌照原文：Discord、Steam、Battle.net、Enter、Esc、Tab、A／B／X／Y、LB、RT、DPS 等
- 游戏名称：Diablo II → 《暗黑破坏神 II》，Diablo II: Resurrected → 《暗黑破坏神 II：狱火重生》，Lord of Destruction → 毁灭之王

## 片段字串、单字、稀有物品名称

- 有些 key 是运行时拼起来的片段（`, after this difficulty's #`、`spirals`），先看 `ko`、`ref` 理解用法，再译成拼起来读得通的中文片段
- 没有前缀的单一英文字（`Chain`、`Orb`）在整句查不到时会被拿来逐字翻译，译成一般名词或动词
- 两个首字大写的英文字（`Beast Glare`）通常是稀有物品名称：前段＋后段，**中间不加空格**，照 D2R 简中的组法（`hints` 里有例子，例如 Doom Blow → 厄运强击）。同一个英文字在所有名称里用同一个译法

## 核心用语（D2R 官方简中）

| 英文 | 简中 | 英文 | 简中 |
|---|---|---|---|
| Magic Find | 掉宝率 | Gold Find | 金币获取率 |
| Attack Rating | 命中值 | Defense | 防御 |
| Faster Cast Rate | 更快速施法（属性名可写「施法速度」） | Faster Run/Walk | 更快速跑步/步行 |
| Faster Hit Recovery | 更快速打击回复 | Faster Block Rate | 更快速格挡 |
| Increased Attack Speed | 提高攻击速度 | Enhanced Damage | 强化伤害 |
| Damage Reduced | 伤害降低 | Crushing Blow | 粉碎打击 |
| Deadly Strike | 致死打击 | Open Wounds | 开创性伤口 |
| Life／Mana stolen per hit | 击中时偷取生命／法力 | All Resistances | 所有抗性 |
| Fire／Cold／Lightning／Poison | 火焰／冰霜／闪电／毒素 | Resist | 抗性（火焰抗性…） |
| Experience | 经验值 | Level | 等级 |
| Required Level | 需要等级 | Requirements | 需求 |
| Strength／Dexterity／Vitality／Energy | 力量／敏捷／活力／能量 | Life／Mana | 生命／法力 |
| Skill | 技能 | Passive | 被动 |
| Aura | 光环 | Curse | 诅咒 |
| Summon | 召唤 | Knockback | 击退 |
| Chill／Freeze | 冰缓／冻结 | Slow | 减速 |
| Pierce | 贯穿 | Gold | 金币 |
| Sell／Buy／Repair | 出售／购买／修复 | Gamble | 赌博（D2R 按钮是「试试手气」） |
| Imbue | 灌魔 | Stash | 储藏箱 |
| Inventory | 物品栏 | Mercenary | 佣兵 |
| Waypoint | 传送点 | Shrine | 魔坛 |
| Potion | 药水 | Belt | 腰带 |
| Charm（Small／Large／Grand） | 神符（小型／大型／巨型） | Rune／Gem／Jewel | 符文／宝石／珠宝 |
| Normal／Magic／Rare | 普通／魔法／稀有 | Set／Unique | 套装／暗金 |
| Superior／Ethereal／Socketed | 精良／无形／镶孔 | Durability | 耐久度 |
| Champion（怪物） | 勇士 | Unique（怪物） | 暗金怪 |
| Minion | 爪牙 | Elite | 精英 |
| Boss | 首领（游戏里的 act boss 写「幕首领」） | Difficulty | 难度 |
| Normal／Nightmare／Hell（难度） | 普通／噩梦／地狱 | Act 1～5 | 第一幕～第五幕 |
| Skill Tree | 技能树 | Quest Log | 任务日志 |
| Automap | 自动地图（D2R 设置里叫「透视地图」，说明文字用「自动地图」） | Terror | 恐惧 |

人名、地名用 D2R 简中：阿卡拉、恰西、基德、卡夏、迪卡德·凯恩、安达莉尔、督瑞尔、墨菲斯托、迪亚波罗、巴尔、流亡者营地、精华荒地。技能、物品、怪物名称一律查 `hints` 或 `node tools/lookup.mjs data/d2r-strings "名称" --lang zh-CN`。

## 本项目的系统用语（游戏自己的机制，D2R 没有）

| 英文 | 简中 | 英文 | 简中 |
|---|---|---|---|
| Skill Modifier／Modifier | 技能变体／变体 | Skill Modifier Point | 技能变体点数 |
| draft（升级抽卡） | 抽选 | re-draft | 重新抽选 |
| Reroll／Skip／Banish | 重抽／跳过／排除 | card（升级卡片） | 卡片 |
| rest（暂时关闭技能）／Rested | 暂停／已暂停 | take it up again | 重新启用 |
| legit／not legit | 合规／不合规 | ranked | 计入排名 |
| rank（恰西卖的强化） | 阶 | Terror tier # | 恐惧第{0}阶 |
| run（一局） | 一局 | camp | 营地 |
| kept hero／keep | 保留的英雄／保留 | hero | 英雄 |
| Evolve／Evolves into | 进化／进化为 | act boss | 幕首领 |
| Tome／Book | 秘典／技能书 | Charms window | 神符栏 |
| hover box | 提示框 | loot filter | 拾取过滤器 |
| IN MY COLLECTION | 已收藏 | KEEP／HIDE／SELL／PICK UP | 保留／隐藏／出售／拾取 |
| desktop app | 桌面版 | website | 网站 |
| Level Up | 升级 | Kills | 击杀 |

## 常见的繁中与简中差异（`ref` 里看到左边的，要换成右边的）

物品欄→物品栏、儲物箱→储藏箱、傳送平台→传送点、魔寶尋獲率→掉宝率、獨特→暗金、咒符→神符、首領→首领、章節→幕、恐懼階→恐惧阶、品質→品质、滑鼠→鼠标、按鍵→按键、設定→设置、檔案→文件、存檔→存档、帳號→账号、畫面→画面、螢幕→屏幕、伺服器→服务器、網路→网络、資料→数据、預設→默认、啟用→启用、載入→加载、程式→程序、手把→手柄、選單→菜单、視窗→窗口、說明框→提示框

## 长句（更新说明、技能说明）

- 多半是更新说明，一条讲一件改动。写成简洁的陈述句：「现在……」「不再……」「改为……」「修复了……的问题」。称呼玩家用「你」
- 可以重排语序，但不要漏信息，数字、百分比、技能名称都要保留
- 说明里提到的游戏按钮、选项名称，跟已经翻好的界面用同一个译法

查不到的官方用语：`node tools/lookup.mjs data/d2r-strings "片语" --lang zh-CN`。
