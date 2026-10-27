# 翻訳ガイド（D2 Survivors 日本語）

読者は『ディアブロ II リザレクテッド』の日本語版を遊んだことのある日本のプレイヤーです。用語は **D2R 公式日本語** に合わせ、ゲーム画面らしく自然で簡潔に。

入力の `ref` は繁体字中国語版の訳で、ゲーム内での意味をつかむための参考です。中国語の語順や漢字語をそのまま持ち込まないこと。

## ファイル形式

- 入力：`work/todo-ja/batch-XX.json`。各項目は `{ key, ko, ref, hints }`
  - `key`：ゲームの英語原文。辞書のキーなので **変更しない**
  - `ko`：韓国語版の訳。プレースホルダーの順序と、その文の使われ方の参考に
  - `ref`：繁体字中国語版の訳（ある場合のみ）。意味の参考のみ
  - `hints`：文中の語の D2R 公式日本語訳（`[英語, 日本語]`）。文字列の一致で引いたものなので誤りもある
- 出力：`dict/ja/manual/XX-NN.json`（ファイル名は作業指示を参照）。JSON オブジェクト `{ "英語 key": "日本語訳", … }`。入力の全項目を含めること。UTF-8

## プレースホルダー（最重要）

- key の `*` は文字列（ゲームが先に翻訳してから差し込む）、`#` は数値
- 訳文では `{0}`、`{1}`… で key の 1 番目、2 番目…の `*` または `#` を指す（出現順、`*` と `#` を通しで数える）
- **訳文のプレースホルダーは `ko` と完全に同じにする**（同じ番号をそれぞれ 1 回）。順序は日本語の語順に合わせて入れ替えてよい
- key の `+`、`%`、`×`、`/` はプレースホルダーと一緒に残す。例：`+#% gold` → `ゴールド +{0}%`
- **`*` には「数値＋名詞」が入ることが多い**（`1 bolt` が先に「1発」と訳されて入る）。テンプレート側で助数詞や名詞を重ねないこと。迷ったら `ref` の書き方を参考に
- `*`、`#` のない key の訳文に `{0}` を入れない。key に改行（`\n`）があれば残す

## 表記（D2R 日本語に合わせる）

- 句読点は全角の「、」「。」。かっこは全角の（　）
- **「ラベル: 数値」は半角コロン＋半角スペース**（D2R と同じ）：`アイテムドロップ: +{0}%`、`必要レベル: {0}`
- ` · `、` / `、` - ` などの区切りは原文どおり残す（ゲームがここで区切って個別に訳す）
- スキル名・アイテム名・モンスター名は D2R 公式の表記（多くはカタカナ）。`hints` か `node tools/lookup.mjs data/d2r-strings "名前" --lang ja` で確認する
- key がすべて大文字のもの（`NEW RUN`、`MAIN MENU`）はボタンや見出し。短く
- 固有名詞・キー・ブランドは原文のまま：Discord、Steam、Battle.net、Enter、Esc、Tab、A／B／X／Y、LB、RT、DPS など
- ゲーム名：Diablo II →『ディアブロ II』、Diablo II: Resurrected →『ディアブロ II リザレクテッド』、Lord of Destruction → ロード・オブ・デストラクション

## 断片の文字列、単語、レアアイテム名

- 実行時に組み立てる断片の key がある（`, after this difficulty's #`、`spirals`）。`ko`、`ref` で使われ方を確認し、組み立てたときに自然に読める断片にする
- 接頭辞のない英単語 1 語（`Chain`、`Orb`）は、文全体が辞書にないときの単語ごとの訳に使われる。普通の名詞・動詞として訳し、レア名の前半用の「〜の」形にしない
- 先頭が大文字の英単語 2 語（`Beast Glare`）はたいていレアアイテム名：前半＋後半を **スペースなしで** つなぐ。前半は D2R の形（獣の、破滅の）、後半は名詞（`hints` に例あり。Doom Blow → 破滅の一撃）。同じ英単語にはすべての名前で同じ訳を使う

## 主要用語（D2R 公式日本語）

| 英語 | 日本語 | 英語 | 日本語 |
|---|---|---|---|
| Magic Find | アイテムドロップ | Gold Find | ゴールドドロップ |
| Attack Rating | 命中率 | Defense | 防御力 |
| Faster Cast Rate | スキル発動速度 | Faster Run/Walk | 歩き/走り速度 |
| Faster Hit Recovery | ヒットリカバリー速度 | Faster Block Rate | ブロック速度 |
| Increased Attack Speed | 攻撃速度 | Enhanced Damage | ダメージを強化 |
| Damage Reduced | ダメージを軽減 | Crushing Blow | クラッシング・ブロー |
| Deadly Strike | デッドリー・ストライク | Open Wounds | 出血状態 |
| Life／Mana stolen per hit | ライフ／マナを吸収 | All Resistances | 全属性耐性 |
| Fire／Cold／Lightning／Poison | 火炎／冷気／電撃／毒物 | Resist | 耐性（火炎耐性…） |
| Experience | 経験値 | Level | レベル |
| Required Level | 必要レベル | Requirements | 必要ステータス |
| Strength／Dexterity／Vitality／Energy | 力／敏捷性／生命力／エナジー | Life／Mana | ライフ／マナ |
| Skill | スキル | Passive | 常時発動 |
| Aura | オーラ | Curse | 呪い |
| Summon | 召喚 | Knockback | ノックバック |
| Chill／Freeze | 冷却（鈍化）／凍結 | Slow | 速度低下 |
| Pierce | 貫通 | Gold | ゴールド |
| Sell／Buy／Repair | 売却／購入／修理 | Gamble | ギャンブル |
| Imbue | エンチャント | Stash | 保管箱 |
| Inventory | 所持品 | Mercenary | 傭兵 |
| Waypoint | ウェイポイント | Shrine | 祭壇 |
| Potion | ポーション | Belt | ベルト |
| Charm（Small／Large／Grand） | 護符（小／中／大） | Rune／Gem／Jewel | ルーン／宝石／宝玉 |
| Normal／Magic／Rare | ノーマル／魔法／レア | Set／Unique | セット／ユニーク |
| Superior／Ethereal／Socketed | 上質な／イシリアル／ソケット | Durability | 耐久力 |
| Champion（モンスター） | 闘士 | Unique（モンスター） | ユニークモンスター |
| Minion | ミニオン | Elite | エリート |
| Boss | ボス（act boss は「章のボス」） | Difficulty | 難易度 |
| Normal／Nightmare／Hell（難易度） | ノーマル／ナイトメア／ヘル | Act 1～5 | 第1章～第5章 |
| Skill Tree | スキルツリー | Quest Log | クエストログ |
| Automap | オートマップ | Terror | 恐怖 |

人名・地名は D2R 日本語：アカラ、チャルシ、ギード、カーシャ、デッカード・ケイン、アンダリエル、デュリエル、メフィスト、ディアブロ、バール、ローグの野営地、血の荒野。クラス：アマゾネス、ソーサレス、ネクロマンサー、パラディン、バーバリアン、ドルイド、アサシン。

## このゲーム独自の用語（D2R にない仕組み）

| 英語 | 日本語 | 英語 | 日本語 |
|---|---|---|---|
| Skill Modifier／Modifier | スキル変化／変化 | Skill Modifier Point | スキル変化ポイント |
| draft（レベルアップのカード選択） | 選択 | re-draft | 選び直し |
| Reroll／Skip／Banish | リロール／スキップ／除外 | card（レベルアップのカード） | カード |
| rest（スキルを一時停止）／Rested | 休止／休止中 | take it up again | 再開 |
| legit／not legit | 正規／非正規 | ranked | ランキング対象 |
| rank（チャルシが売る強化） | ランク | Terror tier # | 恐怖 第{0}段階 |
| run（1 回のプレイ） | ラン | camp | 野営地 |
| kept hero／keep | 保管した英雄／保管 | hero | 英雄 |
| Evolve／Evolves into | 進化／〜に進化 | act boss | 章のボス |
| Tome／Book | 秘典／スキルの書 | Charms window | 護符欄 |
| hover box | ツールチップ | loot filter | 拾得フィルター |
| IN MY COLLECTION | 収集済み | KEEP／HIDE／SELL／PICK UP | 保管／非表示／売却／拾う |
| desktop app | デスクトップ版 | website | ウェブサイト |
| Level Up | レベルアップ | Kills | 撃破数 |

## 長文（更新情報、スキル説明）

- 多くは更新情報で、1 行に 1 つの変更。です・ます調で簡潔に：「〜するようになりました」「〜しなくなりました」「〜に変更しました」「〜を修正しました」。プレイヤーは「あなた」と呼ばず、主語は省略してよい
- 語順は入れ替えてよいが、情報を落とさない。数値・割合・スキル名はすべて残す
- スキル説明・UI の短文は体言止めや常体でもよい（D2R の説明文に合わせる）
- 説明文に出てくるボタン名・設定名は、翻訳済みの UI と同じ訳を使う

公式用語が見つからないとき：`node tools/lookup.mjs data/d2r-strings "語句" --lang ja`。
