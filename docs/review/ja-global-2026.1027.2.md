# ja 全体修正（review-global-2026.1027.2.json, 370 keys）

1. 単語の自動照合: `poison` ポイズン→毒、`passive`／`Passives` 常時発動/→常時発動（`Passives` にも同じスラッシュ）。`Lightning` はソーサレスのスキル名（skills.lightning.name）で、属性名として出るのは死亡画面の「Slain by …: # lightning damage」だけ（zh-TW の 閃電 は両方 D2R 公式なので通る）。ライトニングのまま残し、死亡画面用に `Slain by *: * lightning damage`／`Slain by *'s *: * lightning damage` →「電撃ダメージ」を追加（5 keys）
2. 免疫: 12 件中 3 件は review-2026.1027.2 で修正済み。残り 9 件を「物理無効」「その属性が無効のモンスター」「無効を解除」（既存訳の言い方）に（9）
3. recharge は「再使用」（再使用時間／再使用が速くなる）に統一、cooldown はクールダウンのまま。recharge なのにクールダウン 8 件（review の 2 件を含む）、リチャージ 9 件を修正（17）。cooldown の key に再使用・リチャージを使ったものは 0
4. 致命の一撃: D2R の StrSkillCritChance「致命の一撃発動確率」に統一（11。〜の確率 8、〜の発動確率 2、人狼の「致命の一撃 +%」1）。「%の確率で致命の一撃が発生」のような文は変えていない
5. `# arrows` 矢の本数: {0} → 矢{0}本（1）。tb() が作る数＋名詞（arrow, bolt, hammer, javelin, kick, magic arrow, monster, skeleton, spark, swift blow, twister, web）はほかは全部「名詞{0}助数詞」で問題なし。`# kills`（撃破数 {0}）は HUD 単独表示なのでそのまま
6. `Missing` なし→未収集（1）。使われるのは独特アイテムのフィルター `{all,kept,missing}` だけ
7. チャルシの wares（画面・品揃え）を品揃えに（14）。売り物 1 個の「ware」（Click a ware… など）は商品のまま
8. たき火 2 件→焚き火（多数派、review の 焚き火（Enter）と同じ）。START は review で 開始 に変わっていて、ニュースの「開始」と既に一致（主張は review 前の状態）。同じ文の EXIT を「終了」→ボタンと同じ「終了する」に（3）
9. レア名: 前半 Raven→レイヴンの（84）、Plague→災禍の（151）、Armageddon→天変地異の（29）、後半 Spawn→落とし子（他の前半 31）、Eye→眼（Plague Eye、Raven Eye、前半の数に含む）。計 295。後半は既存訳を流用し、D2R の rare suffix（item-names 2325–2479）と照合、違ったのは Plague Dart（ジャベリン→滑翔）だけ。Raven Claw／Raven Frost（ユニーク）、Plague Bearer（モンスター）、Plague Wave（変化）、Coldsteel Eye、Darkforce Spawn、Fire Eye は除外。unique:Plague プレイグ（ユニークモンスターの前半、D2R 公式）はそのまま
10. D2R の item-nameaffixes「Warder's」(id 20768) が 番人が携えし。affix:Warder's 歩哨の（of the Sentinel の訳が韓国語一致で付いた）→番人が携えし（1）
11. `Frostfire` フロストバーン→霜炎（9 スキルの変化名）。Frostburn（手袋・アイスアローの変化）はフロストバーンのまま（1）
12. title: は 7 個。D2R の *PlayerTitle に合わせ Slayer スレイヤー→討伐者、Guardian 守護せし者→守護者（2）。Champion 闘士、Patriarch 族長、Matriarch 女族長、Destroyer 破壊者、Conqueror 征服者は D2R と同じ
13. modifier: キー 5 個追加: Volley 斉射（2本増える魔法の矢）、Onslaught 怒涛（最後に最強の敵へもう一突き）、Heavy 渾身（ファイアボルト 1 発にまとめる／ジャブ 2 回に減って強く）、Stalker 強敵狩り（影が最も手強い敵を狙う）、Ember 熾火（毎撃メテオ）。素の key は review の値のまま（5）
14. Holy Bolt: 汎用テンプレートだと「…与える（アンデッドには2倍）。モンスター3体を貫通。」と後ろに切れる。複数形の専用 key（zh-TW と同じ）と単数形を追加（2）
15. `Throws an axe from each hand for # damage.`（既存の `…damage#.` は貫通なしの文にマッチしない）、`(max)`（「Level 3 to 4 (max)」の残り）を追加し、`Level * to * (max)` → レベル{0}～{1}（最大）も追加（3）。翻訳器のシミュレーションで確認

報告のみ: 「Fire Bolt, Infernoほか2つ」は j2()（シナジー行）が `r.slice(0,e).join(", ")` と A2()（「A, B and C」）で作る一覧が `*` に入るもの。一覧を分ける key は zh-TW にもない（zh-TW も英語のまま）。「*, *」は大文字 3 字未満でワイルドカードにならず、「* and *」は広すぎるので追加していない
範囲外で見つけたもの: レア名の前半 Dragon（ドラゴン）、Vengeance（報復）に「の」がない（2 語の key 242 件。D2R の rare prefix 表にない前半）。変化名に動詞形が残っている：Thrown 投げる、Creeping 這い寄る、Glacier 氷原生む、Ride the Bolt 稲妻に乗る

作業用スクリプト: work/agents/ja-global/（build.cjs は自分の出力ファイルを消して remerge した状態で実行する）
