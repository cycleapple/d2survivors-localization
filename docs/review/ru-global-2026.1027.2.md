# Russian: dictionary-wide fixes (2026.1027.2)

Output: `dict/ru/manual/review-global-2026.1027.2.json`, **530 keys** (changed or added). It merges after `review-2026.1027.2.json`, and `unify-eu.mjs` skips it. The generator is `work/agents/ru-global/fix.mjs`. It reads `work/agents/ru-global/base.json` (a snapshot of dict/ru.json taken before this layer) with the review file on top. `log.json` beside it lists the keys for each item.
After `bash work/translation/remerge.sh ru`, all 530 values are in dict/ru.json, and `check-alignment` reports 0 number mismatches.

| # | Item | Keys |
|---|---|---|
| 1 | Months | 11 |
| 2 | Leaderboard | 9 |
| 3 | ко льду | 3 |
| 4 | Modifier names and the changelog lines that quote them | 23 |
| 5 | Auto-matched words, glued labels | 38 |
| 6 | Count fillers | 7 |
| 7 | Magic prefixes | 21 |
| 8 | Chill | 9 |
| 9 | Maximum life | 4 |
| 10 | Rare names | 340 |
| 11 | Unique monster names | 6 |
| 12 | Item-stat pieces | 49 |
| 13 | SHOW ITEMS / SHOW DAMAGE | 3 |
| 14 | Guide typo | 1 doc line |
| 15 | Glyphs (→) | 7 |

## 1. Months
- **Full names:** the review file already makes all 12 genitive and lowercase. No change here.
- **Found:** the game also has two short-month arrays (`Jan`…`Dec`). They are used as `${day} ${m}` (news dates) and `${day} ${m} ${year}` (leaderboard and save dates).
  - `Mar` was auto-matched to "Дефект" (a rare suffix). That key is used alone only as a month, because rare names are whole keys.
  - The other short months had no key at all.
- **Done:** added or changed 11 keys: янв., февр., мар., апр., июн., июл., авг., сент., окт., нояб., дек. (`May` = мая already).

## 2. Leaderboard
- After the review file, 9 values still had "таблиц* лидеров". All are now "таблиц* рекордов".
- 47 values now use таблица рекордов, and none use лидеров.

## 3. ко льду
- 3 values: the "Half its damage is fire damage, which hurts monsters immune to cold. …" family.

## 4. Modifier names
Each name was checked against every modifier name and every skill name, using `modifier:` first where it exists (`work/agents/ru-global/mods.mjs`).

**Clashes fixed:**
- **Frostfire** (9 skills) had the same name as Frostburn, "Обжигающий холод". Frostburn keeps it, because it is also the D2R unique gloves. Frostfire is now **Морозное пламя**.
- **Cleave** and **Sundering** were both "Рассекатель", which is also the skill Lacerator. Now **Рассечение** and **Раскалывание**.
- **Rend**, **Crushing** and **Crush** were all "Трепатель". Now **Раздирание** (plain key and `modifier:Rend`, because plain Rend is also on the rare-suffix list), **Дробление** and **Пролом**.
- **Storm Claw** clashed with Storm Claws. Now **Штормовой коготь**.
- **Shards** was "Осколок", and the plural would equal Splinter's "Осколки". Now **Ледяные осколки**.
- **Spikes** was "Шипов" (genitive). "Шипы" would be the skill Thorns, so it is now **Колючки**.
- **Horror**: added `modifier:Horror` = **Страх**. Plain Horror stays Ужас, because it is also the monster skeleton5.
- **Twin** and **Volley**: the plain keys now match the `modifier:` keys the cards show, **Два клинка** and **Шквал стрел**. Plain Twin had been "Близнецы", which is Twins. The web bookmark version has no `modifier:` lookup.
- **Thunderbolt** = Небесная молния, already done by the review.

**Other modifier fixes:**
- **Return** "Назад" is now **Возврат**, which is what 3 changelog lines already said.
- **Storm Axes**: changed to lowercase "топоры".
- **Deep Cold** "Застывший" (an adjective) is now **Стужа**.
- Added `modifier:Rumble` = **Вибрация**. The RUMBLE/Rumble case twin shows the caps ВИБРАЦИЯ on the card otherwise.

**Changelog lines now quote the card names:**
- Pounce, Storm Claw, Frostfire (1 line)
- Magic Arrow's Volley
- Blessed Aim's Stunning ("Оглушение" → Ошеломление)
- Grave Chill (unify had turned it into "Могильный лед" → Могильный холод)
- Leap's Rumble ("Грохот" → Вибрация)
- Phoenix Strike's Rebirth ("Оживление" → Возрождение)

The Frost Maiden line was already fixed by the review. Re-running `modq.mjs` on dict/ru.json finds only declined forms, which are correct.

**Checked `new-extra` modifier: keys:** all are unique after these changes. The one exception is `modifier:Static` "Статический разряд", which is already the name the changelog uses.

## 5. Auto-matched words and glued labels
**Words fixed:**
- Terror → **Ужас**
- Normal / NORMAL → **Обычная**
- Report → **СООБЩИТЬ**
- KEEP → **СОХРАНИТЬ**
- Kept → **В коллекции**, plus "None kept yet" / "Every one is kept" reworded to match
- Sell → **Продать**, plus the changelog line that said "Продажа"
- poison "отрава" → **Яд**
- skill / a skill "свободных" → **умение**
- passive → **пассивное умение**
- Earlier "Прош." → **Ранее**
- Champion "Элита" → **Чемпион** (monster)
- Bolt / bolt "болт" → **снаряд**
- a monster → монстр

**Labels fixed:**
- Skill tabs: Лед/Огонь/Молния Умения → **Магия льда / огня / молнии** (D2R); Прислужники Умения → **Призыв** (one key for both necromancer and druid); Сила стихий Умения → **Сила стихий**.
- Damage-type labels, which skill hovers use as "Cold Damage: 5-10 a bolt": **Урон от льда / Урон от молнии / Магический урон / Урон от яда** ("Урона от яда" was genitive).
- Max / Min / Average damage → **Максимальный / Минимальный / Средний урон**.
- Crushing Blow "Кара" (wrong word) → **Сокрушительный удар**.
- Mercenary Life / Defense → **Здоровье / Защита наемника**.
- Shared Stash "Общее Тайник" → **Общий тайник**.

**Terror:**
- The skill Terror (the D2R curse "Устрашение") and the Terror mode share one key. The key is now Ужас.
- The 3 changelog lines that list the curse now say Ужас, to match the card.

**Cap:** verified. Наголовник is the right D2R item name, and the code never uses "cap" alone as a word. **No change.**

## 6. Count fillers
- `# arrows` → **стрелы ×{0}**, `# bolts` → **снаряды ×{0}**. These are the forms that work inside the templates.
- `# kick(s)` → **удар(ы) ногой ×{0}**.
- `# hits` → **попадания ×{0}**. It had "Максимум целей", which was the wrong meaning; it is used only in a debug line.
- "Fires # of lightning…" → "Выпускает: {0} молнии…", and "# of lightning shock…" → "Молнии ({0}) бьют…". Both now read correctly with the singular filler.
- Every `tb()` / `rb()` skill description was run through the game's translator (`work/agents/ru-global/desc.mjs`, n = 1 and 3). None of them contain "Стрел:" or "Снарядов:" any more.
- The other plural keys (javelins, sparks, monsters, skeletons, twisters, webs, hammers, swift blows…) were already in the ×{0} form.
- **Not fixable in the dictionary:** the hints "Levels gear adds to every # #" and "A level past a #'s maximum…" (character screen) get words in their `#` slots, and a `#` slot only matches numbers. They stay English in every language. `passive` and `skill` are now filler forms anyway.

## 7. Magic prefixes
- 17 `affix:` prefixes had a single form: Accursed, Acrobat's, Athlete's, Corosive, Ember, Envenomed, Gaea's, Gritty, Gymnast's, Nature's, Paleocene, Scorching, Snowflake, Terra's, Trump, Vodoun, Warder's. All now have 4 forms in the D2R format. They are exactly the D2 keys that D2R renamed.

**Wrong meanings fixed:**
- Scorching: опаляющий
- Paleocene: палеоценовый
- Envenomed: отравленный (D2R's Foul was "гнусный"; plain "Яда" → Отравленный)
- Warder's: надзирательский (D2R). It had been "часового", which equals "of the Sentinel" and is a genitive that can't go in front of the noun.
- of Anima: души

**Deadly:** the typo "смертоносносный" comes from D2R itself. All 4 forms are now смертоносный.

## 8. Chill
- 9 values changed "замедляет/замедляют холодом" and "замедление/замедлением от льда" to **охлаждает / охлаждение**.
- The Cold Enchanted death-nova line also changed to охлаждает.
- No "замедл… холод/льд" is left.

## 9. Maximum life
- 4 values now use максимальный запас здоровья, in the right case.
- **Left as is:** the label "Life now, and its maximum" = "Текущее и максимальное здоровье".

## 10. Rare names
- **Method** (`work/agents/ru-global/rare.mjs`): for the 45 rare fronts, find the front's form at the start of the value, then take the back noun's gender. The gender comes from the D2R tag of that Russian word, or from the noun's ending. Words ending in -ь come from a hand-checked list.
- 340 names were fixed.

| Front | Names | Fix |
|---|---|---|
| Raven | 84 | «Ворон» → вороний / воронья / воронье / вороньи (D2R item-names "Raven") |
| Armageddon | 28 | «Армагеддон» → апокалиптический… (D2R key Holocaust) |
| Vengeance | 116 | «Отмщение» → мстительный / мстительная / мстительное / мстительные |
| Other fronts | 112 | Masculine adjective on a feminine or plural noun that unify could not read (ending -ь, or two words) |

- In the "Other fronts" row, the nouns are песнь (17 "X Song"), спираль, деталь, погибель, жердь and "подбитые ботинки". Example: Кровавый песнь → Кровавая песнь.
- Re-running the check on dict/ru.json finds 0. Ghoul, Wraith and Fiend were checked by hand and were already right.

## 11. Unique monster names
**How they are built:** the patch rule gives "Title, Front Back". The front is `unique:<front>`, with its form picked by `gender:<back>`. The back is `unique:<back>` with its first letter lowercased; it is **not** form-picked.

**Fixed:**
- **Maul**: `unique:Maul` "Раскол" (masculine) didn't match `gender:Maul` fs, which comes from the item кувалда. The gender key has to stay fs for magic items, so `unique:Maul` is now **Кувалда**.
- **Claw** and **Shank**: `gender:Claw` = pl and `gender:Shank` = pl came from D2R items that this game doesn't have as bases. Now ms (коготь) and fs (плюсна).
- **Skull** and **Jade**: `unique:Skull` and `unique:Jade` held the 4-form adjective strings, because the D2R English collides. Both are used only as backs, so the screen showed the raw "[ms]черепной[fs]…". Now **Череп** and **Нефрит** (D2R suffix nouns).

**Needs a tool change: Flame.** It is in both the front list (`Fa`) and the back list (`Ia`), and there is only one key, `unique:Flame`.
- As forms, the back shows the raw markup.
- As the noun **Пламень** (what it is set to now), the back is right and the front reads "Пламень клык", which doesn't agree.
- Proposed fix: in the unique rule for ru (and fr/pl), look up the back as `e('uniqueback', n[1])`, falling back to `e('unique', n[1])`. Then add `uniqueback:Flame` = Пламень, and let `unique:Flame` go back to the forms.
- Alternatively, run the back through `k()` only when the value doesn't start with "[".

## 12. Item-stat pieces
**How the game builds the lines:** `<value> <text>` when val = 1, `<text> <value>` when val = 2, and the text alone for func 19. Every itemstats stat was rendered through the game's translator (`work/agents/ru-global/stats.mjs`).

**Keys used only in item stats** now hold D2R forms:
- к живучести / ловкости / здоровью / мане, ко всем характеристикам (the last was missing)
- к вероятности блока, к скорости блока
- урона по нежити, к урону по демонам, к рейтингу атаки
- к урону, приходящемуся на ману
- к вероятности нанести сокрушительный удар / открытую рану
- к поглощению урона от огня / льда
- к максимальной выносливости
- к максимальному сопротивлению льду (missing)
- Снижает цены у торговцев (missing)

**Keys also used as labels** (the gear and stat-breakdown lists) got their own number templates instead:
- `+#% Enhanced Defense`
- `+#% Enhanced Damage`
- `+#% Increased Attack Speed`
- `#% Deadly Strike`
- `#% Life/Mana stolen per hit`
- `+# Fire/Cold/Lightning Absorb`

The label "Enhanced Defense" is now Повышенная защита; it had been the verb "Повышает защиту".

**Class tabs:** "+2 to Fire Skills (Sorceress Only)" was caught by the wild template "+* to * (* Only)" and showed '+2 к умению "Огонь Умения"'. Added 21 exact templates, e.g. "+{0} к умениям огня (только для волшебниц)". The necromancer's summoning tab uses прислужников.

**Not done (rare item stats):**
- `Reanimate as:` (func 23)
- `(%d/%d Charges)` and `Level` from itemstats.strings
- "+5 to <single skill>" without a class: the wild "+* to *" can't be a key, because the game requires 3 capital letters in a template's fixed text.

## 13. SHOW ITEMS / SHOW DAMAGE
- The labels were already fixed by the review.
- The 3 changelog lines now say ПОКАЗ ПРЕДМЕТОВ / ПОКАЗ УРОНА.

## 14. Guide typo
- Дуриэль → Дюриэль in `docs/translation-guide-ru.md`, line 83 of the D2R names list.

## 15. Glyphs
**Em dash (—, 298 values) and en dash (–, 22 values): no change needed.**
- The ru fonts in `work/fonts/ru/` are subsets of 63 Cyrillic glyphs and have no U+2014. But canvas text uses them only for U+0400–04FF (the patch rule "外文字判斷（西里爾字母）").
- Everything else goes through the bitmap font. Its `code()` maps characters through `tce = {"·":"-","–":"-","—":"-","‘":"'","’":"'","“":'"',"”":'"',"…":"."}`, so both dashes are drawn as "-".
- DOM text uses normal web fonts.

**→ fixed (coordinator's extra item):**
- "→" is not in `tce` and is above 255, so the bitmap font returns "?".
- 7 values had → in the translation only (the English keys don't have it). Reworded as the Polish fix did: "Развитие: {0} – {1}!", "С уровня {0} на {1}{2}", "{0} – {1}, требуется:", and so on.
- The "← →" keys already have the arrows in English, so they were left as is.
- "…" (9 values) is in the English keys too, and is drawn as "." as in English.

## Left for later
- **Terror:** the curse and the mode now share Ужас. Separating them would need a tool change.
- **Web bookmark version** (`web-rules.mjs`) has no `modifier:` lookup, so the plain keys show:
  - Horror shows Ужас on the card.
  - Rumble shows ВИБРАЦИЯ.
- **Rare names:** "* Crusher" / "* Scarab" keep the capitalized back from D2R (Звериный Сокрушитель). The agreement is now right.
