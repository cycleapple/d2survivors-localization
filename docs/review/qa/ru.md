# ru: release screenshot check

I looked at every screenshot: desktop has 49 (`work/qa/ru/desktop/`, game 2026.1027.2, dictionary from about 00:50) and web has 25 (`work/qa/ru/web/`, site/data 20261027-1503). For widths I compared against de/fr with the same file numbers. "Status now" means what `dict/ru.json` (00:58, after commit 661f00f) gives today. I checked runtime-built lines with the game's own translator: `work/agents/qa-ru/tr.mjs [dict] [extra]`, where `|` in an input line stands for a newline. Every value in `fixes.json` went through that harness on top of `dict/ru.json`.

No "?" boxes or tofu from missing Cyrillic glyphs. The only "?" came from the arrow → in the old dictionary (see the cards below). At small sizes the font draws "и" almost like "н" (Друид → "Друнд", Ассасин → "Ассасин"). That is the shape of the system font, not a wrong character.

## DESKTOP-REPORT items for ru / all languages

| Item | Result |
|---|---|
| ru: main menu has only "Настройки" in lower case (`02-main-menu`) | Still open: `Options` = "Настройки" (d2r-auto). Fix: `Options` → `НАСТРОЙКИ`. The pause menu has the same problem (`13`, web `10c`) |
| All languages: mercenary list cut off at the right edge (`48`) | ru: "Разбойница-разведчица - уровен…" is cut. Current dictionary gives "Разбойница-разведчица - 3-й уровень", which is just as long. **Launcher / bookmarklet**: the hire box needs to grow left or wrap (the box is anchored at the right edge of the screen). I can't shorten it in the dictionary without making "Level #" worse everywhere else |
| All languages: ", " in evolution conditions | For Russian a half-width ", " is correct, nothing to do |
| de/pl: "physical damage" untranslated on the death screen | ru translates it. The form "6 урона (физический)" is awkward; fixed (see `70`) |

## Problems

| File | Problem | Status now | Fix |
|---|---|---|---|
| desktop 02, 13; web 01, 10c | Main menu / pause button "Настройки" not in caps (other buttons are ИГРАТЬ, СОХРАНЕНИЯ, ВЫЙТИ) | open | `Options` → `НАСТРОЙКИ` (the other use, the PS button name "Options", can be in caps too) |
| desktop 06; web 02c | "Автохарактеристики: ВЫКЛ." is the only row on the game-options page not in caps | open | `Auto stats` → `АВТОХАРАКТЕРИСТИКИ` (every use is that options row) |
| desktop 04; web 02a | Sound page: "Звук", "Музыка" in lower case. "Выключить звук: ВЫКЛ." is a contradiction ("turn sound off: OFF") | open | `Sound` → `ЗВУК`, `Music` → `МУЗЫКА`, `Mute` → `БЕЗ ЗВУКА` (gives "БЕЗ ЗВУКА: ВЫКЛ./ВКЛ.") |
| desktop 06, 14 | OFF is inconsistent: "АВТООБНОВЛЕНИЕ: ОТКЛ." and preset "ОТКЛ." against "…: ВЫКЛ." everywhere else | open | `OFF` → `ВЫКЛ.` (pairs with ON = ВКЛ.) |
| desktop 06, 13, 14; web 02c, 10c, 10d | "СОРТИРОВКА ДОБЫЧИ" disagrees with the term table (loot filter = фильтр добычи) and with the changelog ("фильтр добычи" 8 times) | open | `LOOT FILTER` → `ФИЛЬТР ДОБЫЧИ` (also shorter) |
| desktop 14; web 10d | Loot filter values "Взять", but the term table has PICK UP = Подобрать and the changelog says "ПОДОБРАТЬ" | open | `Pick up` → `Подобрать` (also used for the gamepad hint, the meaning fits) |
| desktop 14; web 10d | Two hint lines overflow on desktop ("Никогда не скрывает… в выкупе у" runs past the screen edge and wraps onto the Life/Mana line, overlapping "Здоровье: 100/100") | open | Shorten: `KEEP wins over…` → "\"Сохранить\" важнее \"Скрыто\" и \"Продать\", иначе решает самая строгая строка"; `It never hides…` → "Не скрывает и не продает новые уникальные предметы, предметы заданий и выброшенное вами. Проданное можно выкупить у Чарси" (the de shot overlaps the same way: **launcher** could also move this hint up) |
| desktop 14; web 10d | Loot filter: in the left column some rows are in caps (МАГИЧЕСКИЕ ПРЕДМЕТЫ…ОРУЖИЕ, ОБЕРЕГИ) and others are not (Щиты, Шлемы, Нательная броня…Амулеты). The value column mixes "Взять/Продать" with "СОХРАНИТЬ/СКРЫТО" | open, **not fixable in the dictionary**: the game looks keys up case-insensitively, so SHIELDS and Shields (Uniques tab), BOOTS and Boots (item base name), SELL and Sell (shop tab) are one key | **Launcher + bookmarklet**: in the translator wrapper, when the source string is all caps (`/[A-Z]/.test(e) && e === e.toUpperCase()`), upper-case the result for ru (and pl, whose letters outside the bitmap font are drawn from a system font). That fixes this screen, the controller screen (next row) and the death-screen button "Лагерь разбойниц" (`ROGUE ENCAMPMENT` vs the area name) in one place |
| desktop 07; web 02d | Controller: the rows "Пояс 1–4, Персонаж, Наемник, Карта, Дерево умений, Меню" are in lower case, the rest in caps | open (same case-insensitive collision: CHARACTER/Character tab, AUTOMAP/Automap, etc.) | Same launcher/bookmarklet rule as above |
| desktop 07; web 02d | Xbox "View" button shown as "Показать" (a verb) | open | `View` → `Просмотр` (the Xbox button's Russian name) |
| web 02d | RUMBLE = "Грохот" (the Leap modifier's name) | **fixed** (now ВИБРАЦИЯ) | — |
| web 02b | "ПОКАЗАТЬ ПРЕДМЕТЫ" vs desktop "ПОКАЗ ПРЕДМЕТОВ" | fixed (both ПОКАЗ ПРЕДМЕТОВ) | — |
| desktop 05, 06, 13 | REPORT = "Пожаловаться" | **fixed** (now СООБЩИТЬ, see web 02a / 10c / 11) | — |
| web 04a | Date "27 Октябрь" | fixed (`October` = октября) | — |
| desktop 12, 50, 62, 70; web 05b, 10a | Normal = "Обычные" (plural, as for item quality) | **fixed** (now "Обычная": HUD "Акт 1 - Обычная", see web 11/12b) | — |
| desktop 50 | Leaderboard tab "Устрашение" for Terror | **fixed** (Terror = Ужас) | — |
| desktop 20–32, 63; web 06 | Character screen: "Уровень" cut ("Уровен"); the leaderboard column is cut the same way (`50`) | open | `Level` → `Ур.` (D2R's own abbreviation: "Ур. %d"). All four uses are labels: character screen, leaderboard column, mercenary box, itemstats |
| desktop 21–33; web 06-amazon/necromancer-skills | Skill tree tab names cut at the right edge: "Магия молни…", "Пассивные и магичес…", "Боевые навык…", "Боевое мастерс…", "Боевые искусст…", "Теневые навык…", "Боевые клич…". English breaks these over 2–3 lines (the labels come from D2R strings joined with \n, and the translation keeps its \n only when the source has one) | open | Add \n: `Lightning Spells` "Магия\nмолнии", `Bow and Crossbow Skills` "Луки\nи арбалеты", `Passive and Magic Skills` "Пассивные\nи магические\nнавыки", `Javelin and Spear Skills` "Дротики\nи копья", `Defensive Auras` "Защитные\nауры", `Combat Skills` "Боевые\nнавыки", `Combat Masteries` "Боевое\nмастерство", `Shape Shifting` "Смена\nоблика", `Shadow Disciplines` "Теневые\nнавыки", `Martial Arts` "Боевые\nискусства", `Poison and Bone Spells` "Яды\nи кости" (D2R name, no longer "Заклинания ядов и костей", which ran into the border). In other places the \n becomes a space (I checked "+1 к боевым искусствам…" and "…дерева \"Боевые навыки\""). **Left open**: `Warcries` "Боевые клич(и)" is one D2R string with no \n, so it can't be split. 1 letter short; launcher/bookmarklet could shrink the tab font one step or let it wrap |
| desktop 25; web 06-necromancer | Necromancer tab "Призыв / Заклинания": `Summoning Spells` is missing from the dictionary, so the two parts are translated separately | open | New key `Summoning Spells` → `Призыв` (D2R tab: Призыв) |
| desktop 40–46; web 07a–d, 08a | Charsi/Gheed hint box cut: "Щелкните ранг, чтобы купить ег…", "…товар, чтобы купить е…", "…предмет для азартной иг…", "…т проданных предметов для выку…" | open (texts unchanged) | Shorter: `Click a rank to buy it` "Щелчок по рангу: купить", `Click a ware to buy it` "Щелчок по товару: купить", `Click an item to gamble` "Щелчок по предмету: сыграть", `Click an item to buy it back` "Щелчок по предмету: выкупить", `Nothing sold to buy back` "Выкупать нечего". The phone versions in the same box are shortened the same way (Tap … ) |
| desktop 40–47; web 07a–d | Hint at the bottom right of the inventory wraps to 5 lines and the last one ("Esc: закрыть") is cut by the frame | open | `Click to pick up · Right-click to equip · Shift-click to sell · Esc to close` → "ЛКМ: взять · ПКМ: надеть · Shift+ЛКМ: продать · Esc: закрыть"; the stash version (`Click to pick up · Ctrl-click…`) the same way (ЛКМ/ПКМ as in D2R's "Щелкните ПКМ") |
| web 07a–d | Top tab "Дерево умений" in the Charsi window wraps onto 2 lines and runs past the tab (WEB-FINDINGS 9) | open | `Skill Tree` → `Умения` (the same key also shows on the controller row and the level-up tab; "Умения" reads fine there too) |
| desktop 47; web 07d | Stash tab "Уникальные" cut ("…никальные") | open | `Uniques` → `Уник.` (the changelog still calls the tab "Уникальные", which is fine for readers) |
| desktop 41; web 07a | Charsi rank box: two lines run together, e.g. "На старте: Живучесть +5 за ранг +20-40 к максимальному запасу…" | open (the template `+* starting * per rank *` has no newline) | `+* starting * per rank *` → "На старте: {1} +{0} за ранг\n{2}". Also new keys `+* starting * per rank` and `+#% chance of a critical strike` (the Dexterity rank was not translated at all: "+5 starting Dexterity per rank / +1% chance of a critical strike") |
| web 08a, desktop 44 | Item stat "Сопр. льду +6%": the short form from the character screen leaks into the item box | open | New keys `Fire/Cold/Lightning/Poison Resist +#%` → "+{0}% к сопротивлению огню/льду/молнии/яду" (D2R: "%+d%% к сопротивлению льду"). The character screen keeps "Сопр. льду" |
| web 08a | "+1 к умению "Лед Умения" (только: Волшебница)" | **fixed** ("+1 к умениям льда (только для волшебниц)") | — |
| desktop 44 | "+1 к умению "Теневые навыки" (только: Ассасин)", "+21% Повышает защиту", "+3 Здоровье" | **fixed** ("+1 к теневым навыкам (только для ассасинов)", "+21% к защите", "+3 к здоровью") | — |
| desktop 64-1…5 | "?" boxes: "Уровень 1 ? 2", "Огненный взрыв ? Огненная волна" (→ is not in the bitmap font) | **fixed** ("С уровня 1 на 2", "Огненный взрыв – Огненная волна": the – is mapped to - by the game) | — |
| desktop 61, 64; web 09a, 06 | Requirement line "Скор. умений, 12-й уровень" and the passive card title "Скор. умений": the character-screen abbreviation also names the passive | open, minor (one key `Faster Cast Rate`, and the character screen needs the short form) | none. Acceptable |
| web 09a, 12a | Ice Bolt card: "Выпускает ледяные снаряды (1): они пронзают монстров (до 1) и охлаждают…" pushes the evolution line under the card's bottom edge (desktop has the same 6-line card) | open | Shorten the start: `Fires # bolt(s) of ice…` → "Ледяные снаряды ({0}) пронзают монстров (до {1}) и охлаждают, урон: {2}." |
| desktop 70; web 11 | "Причина гибели: Шипастая крыса — 6 урона (физический)": wrong case and awkward | open | New keys `Slain by *: * <element> damage` and `Slain by *'s *: * <element> damage` for physical/fire/cold/lightning/poison/magic → "Причина гибели: Шипастая крыса — физический урон: 6", "… Стрела огня (Бишибош) — урон от огня: 9". The generic template stays for anything else |
| desktop 70; web 11 | Death screen buttons: "ЕЩЕ РАЗ" in caps, "Товары Чарси" and "Лагерь разбойниц" not | open | `Charsi's Wares` → `ТОВАРЫ ЧАРСИ` (every use is a button). "Лагерь разбойниц" (ROGUE ENCAMPMENT) collides with the area name, so it needs the launcher/bookmarklet caps rule |
| web 12b | Phone width: "Здоровье: 90 / 90" and "Мана: 26 / 26" are drawn at the top over the Пауза/Персонаж buttons (in de 12a they sit above the orbs) | not a translation problem | **Bookmarklet**: check the portrait layout of the life/mana labels (maybe the shot was taken right after closing the level-up screen) |
| desktop 08; web 03 | Saves window, news, waypoint, HUD, camp, title, death stats | fine | — |

## Not covered

No boss banner, Terror or skill-modifier card (same as the other languages). No magic/rare item in the run inventory (I checked the Charsi tooltips instead).

## Web (new set)

Checked the 27 shots in `work/qa/ru/web/` (publish 06b4ab5, site/data 20261027-1727) through the 7 contact sheets in `sheets-web/`, plus 2 crops. "Status now" = current `dict/ru.json` (03:24, which already contains `review-qa-2026.1027.2.json`). No "?" boxes or tofu. New fixes are in `work/qa/ru/fixes-web.json` (3 keys, checked with `tr.mjs` on top of `dict/ru.json`).

| File | Problem | Status now | Fix |
|---|---|---|---|
| 01, 10c | "Настройки" not in caps | known, **fixed** (НАСТРОЙКИ) | — |
| 02a | Звук / Музыка / "Выключить звук: ВЫКЛ." | known, **fixed** (ЗВУК, МУЗЫКА, БЕЗ ЗВУКА) | — |
| 02c, 10c, 10d | Автохарактеристики, СОРТИРОВКА ДОБЫЧИ, preset ОТКЛ., values "Взять" | known, **fixed** | — |
| 02d | Controller rows in mixed case; "Карта: Показать" | known (caps rule = launcher/bookmarklet); View **fixed** (Просмотр) | — |
| 06-amazon/sorceress-character | "Выживший" for female classes | known (female Survivor rule) | — |
| 06-amazon/sorceress-character | "Уровень" cut | known, **fixed** (Ур.) | — |
| 06-amazon/sorceress-character | "Урон уменьшен" | fits (crop), OK | — |
| 06-*-skills, 09a | Tree tab names; "Призыв / Заклинания" | known (skill-tree tab width); Summoning Spells **fixed** | — |
| 07a–08a | Shop hint cut, inventory hint 5 lines, top tab "Дерево умений", stash "Уникальные", rank box on one line | known, **fixed** in dict (Щелчок по…, ЛКМ/ПКМ, Умения, Уник., \n) | — |
| 07a, 07b, 08a | Button "НОВЫЙ ЗАБЕГ" | fits (crop), OK | — |
| 08a | "Атакующий получает урон 1" (number glued to the label; D2R: "Атакующий получает урон: %d") | **open** (no `Attacker Takes Damage of #` key; pl already has it) | `Attacker Takes Damage of #` → `Атакующий получает урон: {0}` |
| 08a | "Сопр. льду" in the item box | known, **fixed** (+{0}% к сопротивлению …) | — |
| 09a, 12a | Ice Bolt card too tall | known (desktop) | as in fixes.json |
| 10c, 12b | Copyright over HUD at 800×600; phone life/mana drawn over the top buttons (pl 12b draws them above the orbs) | known, layout | **Bookmarklet** |
| 11 | Death-screen column "Общ." (= "total") for Share; the column is the damage share (100%) | **open** | `Share` → `Доля` (only use: death-screen table) |
| 11 | "Потеряно: это восхождение." reads as "Lost: this ascension" (the climb itself, not its progress) | **open**, minor | `Lost: this climb. Your * starts again at level 1.` → "Потеряно: прогресс этого восхождения. {0} снова начинает с 1-го уровня." (pl says "postęp tej wspinaczki") |
| 11 | "6 урона (физический)"; buttons Товары Чарси / Лагерь разбойниц | known, **fixed** ("физический урон: 6", ТОВАРЫ ЧАРСИ); ROGUE ENCAMPMENT needs the caps rule | — |
| 01 | Main menu: the backup hint "Сохраните копию: …" sits on the bottom of the SURVIVORS logo (pl the same) | layout, minor | **Bookmarklet / site**: move the hint a few px down |
| 00, 03, 04b, 05a, 05b, 09b, 10a, 12a | Title, saves, news, camp, waypoint, skill modifiers (Расщепление / Морозное пламя / Тяжесть), HUD, phone buttons (Выбрать, Пауза) | OK | — |
