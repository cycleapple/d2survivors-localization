# QA pl: release screenshots check

Checked: **48 desktop** screenshots (`work/qa/pl/desktop/`) and **17 web** screenshots. `work/qa/pl/web/` is empty. The web shots are in `work/qa/pl/web-20261028a/`; that folder has no README. Every image was opened, and cramped areas were zoomed. Widths were compared with de/fr/ru/zh-TW (same file numbers). There are no English screenshots.

To check the CURRENT dictionary (`dict/pl.json`), I ran runtime strings through the game's own translator (`lang-ETagAkXB.js`), using `work/agents/qa-pl/tr2.mjs`. I also ran every item-stat formatter the game uses (`work/agents/qa-pl/stats.mjs`) before and after the fixes.

What the translator does that matters here:
- Keys are matched **case-insensitively**: `s()` upper-cases them. So `Report`/`REPORT`, `next level`/`Next Level`, `Rumble`/`RUMBLE` and `Pick up`/`PICK UP` each have one shared value.
- When the source has no newline, a newline in the translation becomes a space. This makes `\n` in tree-tab labels safe in one-line contexts.

No "?" boxes and no tofu in the current dictionary. The only "?" seen was in web 09b, and the current dictionary already fixes it. The only characters above U+017F are `–` (the game maps it to `-`) and `← →`, which appear only in DOM hints.

All dictionary fixes are in `work/qa/pl/fixes.json` (101 keys). Placeholders were checked, and all of them were run through the translator.

| file | problem | status now | fix |
|---|---|---|---|
| desktop 13, 04/05/06 (bottom), 70 (bottom); web 10c, 12b, 02b/02c | Pause-menu button REPORT shows **"Zgłoś"** in mixed case, while the other buttons are caps (POWRÓT, OPCJE, FILTR ŁUPÓW, ZAPISZ I WYJDŹ). The guide says REPORT = ZGŁOŚ, and all changelog prose already writes ZGŁOŚ | open | `Report` → `ZGŁOŚ` (the same key serves REPORT) |
| desktop 04 | `MUTE: OFF` → "Wycisz: WYŁ." (mixed case: the label falls back to `Mute`) | open | add `MUTE: *` → `WYCISZ: {0}` |
| desktop 06; web 02c | `AUTO STATS: OFF` → "Auto-atrybuty: WYŁ." (mixed case: falls back to `Auto stats`) | open | add `AUTO STATS: *` → `AUTO-ATRYBUTY: {0}` |
| desktop 05; web 02b | Slider label **"EFEKTY UMIEJĘTNOŚCI"** is cut off on the left. The label is right-aligned to the slider and needs about 650 px, but only about 560 px is free (also de/fr) | open | `SKILL EFFECTS` → `EFEKTY UMIEJ.` (13 chars, about 445 px; "UMIEJ." is already used in WYBIERZ UMIEJ.). The changelog line "VIDEO OPTIONS has a SKILL EFFECTS slider…" is changed to match |
| desktop 07 | RUMBLE row shows "Wibracje" in mixed case among caps rows. `RUMBLE` and the Leap variant `Rumble` share one key | open | `RUMBLE`/`Rumble` → `WIBRACJE`, plus `modifier:Rumble` → `Wibracje` so the variant keeps its name (patch rule 10 / web "技能變體專用譯名") |
| desktop 07 | BELT 1–4, CHARACTER, MERCENARY, AUTOMAP, SKILL TREE, GAME MENU show as "Pas 1", "Postać", "Najemnik"… in mixed case. Their keys are shared with normal-case UI (minipanel, hovers). de/fr/ru do the same. "View"/"Menu" are gamepad button names, so they are fine | same in all languages | Not fixable in the dictionary. **Launcher + bookmarklet**: rule to `toLocaleUpperCase()` the controller row labels (`Lie` map in moved.js / `m=e=>…` in screens.js), or the game could upper-case them |
| desktop 12; web 05b | Unlock hints are inconsistent: "na poziomie Normalnym" vs "na poziomie Koszmar" | open | `Beat Nightmare's Baal to open` → `Pokonaj Baala w Koszmarze, by odblokować` |
| desktop 12 (also any grey font8 text) | The canvas-drawn Polish letter (ć in "odblokować") is much fainter than the bitmap letters in grey/disabled text | layout | **Launcher** (and web): the colour of foreign glyphs in grey bitmap text. The dark-text fix (item 9/15) does not cover mid-grey |
| desktop 20, 22, 24, 26, 28, 30, 32, 63 | Character sheet header "**następny poziom**" is lowercase (next to "Poziom", "PD"). The skill-hint key `next level` (lowercase) overrides `Next Level`, because both are one key | open | `Next Level`/`next level` → `Następny poziom` (D2R). New keys keep the hint lowercase: `*: next level at character level *` → `{0}: następny poziom (poziom postaci: {1})`, `*: next level at level *` → `{0}: następny poziom (poziom: {1})` |
| desktop 21, 23, 25, 27, 29, 31, 33; web 09a/09b | Skill-tree tab labels are wider than the tab (about 140 px). Overflowing ones: Oszczep i Włócznia, Pasywne i Magia, Trucizny i Kości, Aury Defensywne, Aury Ofensywne, Mistrzostwa Bojowe, Zmiana Kształtu, Dyscypliny Cienia (about 205 px), Sztuki Walki (slightly), Przywoływanie (druid, about 175 px). The labels lose D2R's 2-line layout because the dict values are one line | open | Values with `\n`: `Oszczep\ni Włócznia`, `Pasywne\ni Magia`, `Trucizny\ni Kości` (Skills + Spells), `Aury\nOfensywne`, `Aury\nDefensywne`, `Mistrzostwa\nBojowe`, `Zmiana\nKształtu`, `Dyscypliny\nCienia`, `Sztuki\nWalki`. One-line uses ("+1 do umiejętności Dyscyplin Cienia", hover texts) are unchanged because the newline collapses. "Łuk i Kusza" just fits, so it stays |
| desktop 25 | Necromancer tab: `Summoning\nSpells` → "**Przywoływanie / Zaklęcia**" (word-by-word: there is no `Summoning Spells` key). Re-checked: it still happens | open | `Summoning Spells` → `Przyzwania`. Also `Summoning` (druid tab) → `Przyzwania`, which is D2R's own druid tab label (StrSklTree26) and already used in "+{0} do umiejętności Przyzwania". For consistency, `Summoning Skills` and the two "Levels gear adds to every Summoning skill…" lines also become Przyzwania |
| desktop 21–33 (layout) | Tab labels have no width check, so de "Wurfspieß- und Spee…", fr and ja overflow too | layout, all languages | **Launcher + bookmarklet**: in `renderTree`, fall back to `font8` when the label is wider than the tab, the way the stash note already does (`font16.width(e)>lu[2]?font8:font16`) |
| desktop 41 | Charsi rank tooltip has no line break: "Żywotność: +5 na start na rangę +20-40 do maksymalnego zdrowia…" (ko has `\n`) | open | `+* starting * per rank *` → `{1}: +{0} na start na rangę\n{2}` |
| desktop 45 | Buy Back hint "Nic nie sprzedano, nie ma czego odkupić" is cut on both sides (the box fits about 27 chars, like "Kliknij towar, aby go kupić") | open | `Nothing sold to buy back` → `Nic do odkupienia` |
| desktop 46, 46b | Gamble hint "Kliknij przedmiot, aby zagrać w hazard" is cut on the left | open | `Click an item to gamble` → `Kliknij, by zagrać w hazard` (27 chars). The touch variants (`Tap an item, then tap it again` = 47 chars, `Tap a rank, then tap it again` = 43) go in the same box and will overflow too. They are not in the screenshots, so they need a mobile shot first |
| desktop 46; web 07b | `Gamble` = "hazard" (lowercase from d2r-auto). It is used for the tab, the button and the controller prompt | open | `Gamble` → `Hazard` |
| desktop 40–47 (bottom right) | Hint lines wrap: "Prawy przycisk:" / "wyposaż" take 2 lines, so the block is 5 lines | open (minor) | `PPM: wyposaż` in both hint keys ("Click to pick up · Right-click to equip · …", "Click to pick up · Ctrl-click to move across · …"). PPM is already used in the dict |
| desktop 47 | Stash tab "**Unikatowe**" is wider than its tab and covers the 4th "Wspólna" ("Wspólnd") | open | `Uniques` → `Unikaty`. The 9 changelog lines that name the tab (zakładka/zakładce/zakładkę Unikatowe) are changed to match |
| desktop 47 | The stash note ("Dostępne tylko dla tego bohatera") is hidden behind the search box: only "D…a" shows. de shows "N…n" (same) | layout, all languages | **Launcher + bookmarklet**: move the note above or below the search input, or hide it while the search box is shown |
| desktop 48 | Mercenary list is cut at the right edge ("Zwiadowczyni Łotrzyc - poziom…") | layout, all languages (in DESKTOP-REPORT) | **Launcher**: keep the hire list inside the screen (right-align or clamp x). The name is official D2R |
| desktop 50 | Leaderboard: date "27 PAŹ" is correct (rule 16). Class buttons shrink their font to fit. No problems | OK | – |
| desktop 61, 64-1…4; web 09a, 09b | Evolution head on level-up cards reads "**W umiejętność** Ślad Ognia:". It is a sentence fragment and does not match the other evolution lines ("Rozwój: X – Y, wymaga:") | open | `Into *:` → `Rozwój: {0}, wymaga:` |
| desktop 61; web 09a | 3 cards don't fit, so the list scrolls (the 3rd card is cut). Polish cards are 1–2 lines taller: the requirements wrap ("Szybkość rzucania czarów") and the web title wraps ("Ognisty Piorun -" / "Nowa umiejętność"). de/fr/ru also scroll. The list works; it is not overlap | minor | No term change: FCR is the D2R term. "Poziom 12" is capitalised in the list because `level #` = `Level #`. Optional **layout**: a bit more panel height |
| desktop 70; web 11 | Death screen "**9 physical damage**" is untranslated (DESKTOP-REPORT, WEB-FINDINGS #3) | **fixed in current dict** ("Zabójca: Płonący Trup – 9 pkt. obrażeń (fizyczne)") | Improvement: the element is in mixed case ("(Ogień)" vs "(fizyczne)"), so I added 12 per-element keys `Slain by *: * fire damage` … `Slain by *'s *: * magic damage` → "… pkt. obrażeń od ognia / fizycznych / magicznych" |
| desktop 70; web 11 | Damage table column "**Udost.**" (= udostępnij, "share" as in sharing) for "Share" (damage share %) | open | `Share` → `Udział` |
| desktop 14 | Loot filter: the first help line (99 chars) runs over the HUD labels "Zdrowie: 100 / 100" and "Mana". de/ru overlap too; fr just touches | open + layout | `KEEP wins over HIDDEN and SELL…` → `ZACHOWAJ wygrywa z UKRYTE i SPRZEDAJ. Poza tym decyduje najsurowszy wiersz` (74 chars). **Launcher**: hide the life/mana text or move the hints up while the filter is open (all languages) |
| desktop 14; web 10d | Value column: "Podnieś" (Pick up, shared key with prompts) is mixed case, while ZACHOWAJ/UKRYTE are caps. de/fr/ru do the same | same in all languages | Not fixable in the dictionary (shared key). Optional rule: upper-case the loot-filter values (`YRe` map) |
| web 10d | Charms value "ZDEPONUJ" | **fixed in current dict** (ZACHOWAJ) | – |
| web 09b | Evolution line "Pożoga **?** Ściana Ognia": old `→` arrow, which the bitmap font lacks | **fixed in current dict** (`–`, mapped to `-`; desktop 64-2 shows it fine) | – |
| web 08a (also any item tooltip) | Composed stat lines in the wrong order or wrong form: "+19% **Zwiększa obronę**", "**Odporność na Błyskawice +10%**", "Odporność na trucizny +8%". The formatter check also found "+7 Zręczność", "+7 Zdrowie", "+7 Mana", "+7% Atak do obrażeń", "+7 Średnia Obrażenia", "7% Zabójcze uderzenie", "7% Zdrowie wykradzione…", "Przywracanie zdrowia +7", "Atakujący otrzymują obrażenia w wysokości 7"… | open | 40 template keys in D2R order and wording, from item-modifiers.json (ModStr1b/1c/1e/1j–1n/1u/1v/2g/2l/2t/2u/2v/2y/2z/3g/3j/4m/4y/5c/5g–5n/5q…). Example: `Fire Resist +#%` → `+{0}% do odporności na ogień`, `+#% Enhanced Defense` → `+{0}% do obrony`. Also the label `Enhanced Defense` → `Zwiększona obrona` (like "Zwiększone obrażenia"). All 112 formatter lines now read correctly |
| web 07b | Top camp tabs: "UMIEJĘTNOŚCI" (Skill Tree) loses its last letter. de "Fertigkeitsbaum" is worse | layout | **Bookmarklet** (web only): shrink the font when the tab label is too wide. Not changed in the dict (`Skill Tree` is a shared D2R term) |
| web 12a (mobile) | Top button "**Pause**" is untranslated (d2r-auto copied D2R's English string) | open | `Pause` → `Pauza` |
| web 10c, 12b | At 800×600 the copyright line overlaps "Zdrowie"/"Mana". de is the same | layout, all languages | **Bookmarklet**: hide the HUD life/mana text under the pause overlay, or lift the copyright line |
| desktop 01–03, 08–11, 21b, 29 tooltip, 33 tooltip, 42–44, 62, 63; web 00, 01, 03, 05a | Read through; no overflow, no untranslated text, no wrong terms. Name grammar in 44 and 08a: "Gradowa Muszla / Hełm" agrees | OK | – |

## Not dictionary (by team)

- **Launcher (desktop)**:
  - Upper-case controller row labels.
  - Skill-tree tab `font8` fallback when the label is too wide.
  - Stash note hidden by the search box.
  - Mercenary list cut at the right edge.
  - Loot-filter hints over the HUD life/mana text.
  - Faint canvas glyphs in grey text.
  - Optional: upper-case the loot-filter values.
- **Bookmarklet (web)**:
  - The same tree-tab, stash-note and upper-case items.
  - Camp top tabs too narrow ("UMIEJĘTNOŚCI").
  - Copyright line over the HUD at 800×600.
- The **web screenshot folder** is `pl/web-20261028a/`, not `pl/web/` (that one is empty).

## Web (new set)

Checked the 29 shots in `work/qa/pl/web/` (publish 06b4ab5, site/data 20261027-1727) through the 8 contact sheets in `sheets-web/`, plus 3 crops. "Status now" = current `dict/pl.json` (03:24, which already contains `review-qa-2026.1027.2.json`). No "?" boxes or tofu. New fixes are in `work/qa/pl/fixes-web.json` (3 keys, checked with `work/agents/qa-ru/tr.mjs` on top of `dict/pl.json`).

| File | Problem | Status now | Fix |
|---|---|---|---|
| 02a | Slider labels "Dźwięk", "Muzyka" in mixed case, every other row is caps (WYCISZ, POPRZEDNIE MENU). ru got the same fix | **open** | `Sound` → `DŹWIĘK`, `Music` → `MUZYKA` (each is only the slider label) |
| 02a, 02c | "Wycisz: WYŁ.", "Auto-atrybuty: WYŁ." | known, **fixed** (WYCISZ: / AUTO-ATRYBUTY:) | — |
| 02a–02c, 10c, 11 | "Zgłoś" in mixed case | known, **fixed** (ZGŁOŚ) | — |
| 02b | "EFEKTY UMIEJĘTNOŚCI" cut on the left | known, **fixed** (EFEKTY UMIEJ.) | — |
| 02d | Controller rows in mixed case | known (caps rule = launcher/bookmarklet) | — |
| 05b | "Normalnym" vs "Koszmar" | known, **fixed** | — |
| 06-sorceress-character | "Ocalały" for Sorceress; "następny poziom" lowercase | known (female Survivor rule); Next Level **fixed** | — |
| 06-sorceress-skills, 09a | Tree tabs, "Przywoływanie / Zaklęcia" | known (tab width); Summoning Spells **fixed** (Przyzwania) | — |
| 06-sorceress-skill-tooltip | "Kliknij, by zobaczyć modyfikatory" | fits (crop), OK | — |
| 07a–08b | Top tab "Umiejętności" too wide; gamble hint cut, "Losuj ponownie"; stash "Wspólna"/"Unikatowe"; note behind search; "+16% Zwiększa obronę", "Odporność na Ogień +9%" | known; dict parts **fixed** (Kliknij, by zagrać w hazard, Unikaty, Hazard, item templates) | — |
| 09a, 12a | "W umiejętność Zniedołężnienie:" (12a already shows "Rozwija się w umiejętność …") | known, **fixed** (Rozwój: {0}, wymaga:) | — |
| 09b, 09c | Modifier tooltip ends "Wyłącz **opcję** innej umiejętności, aby zwolnić punkt": the same tooltip and the skill tooltip call them "modyfikatory" (guide: Modifier = modyfikator; ru says модификатор) | **open** | `No points are free. Turn off another skill's option to free one.` → "Brak wolnych punktów. Wyłącz modyfikator innej umiejętności, aby zwolnić punkt." |
| 10c | Copyright over HUD at 800×600 | known, layout | **Bookmarklet** |
| 10d | Values "Podnieś" mixed case; hint lines | known; KEEP hint **fixed** | — |
| 11 | "17 physical damage", column "Udost." | known, **fixed** (pkt. obrażeń fizycznych, Udział) | — |
| 12a, 12b | "Select", "Pause" | known, **fixed** (Wybierz, Pauza) | — |
| 12b | Phone button "Automapa" fills the button edge to edge (not cut, crop) | OK, watch | none (shared with the controller row AUTOMAPA) |
| 12a | Phone button "Umiejętności": the canvas "ś" sits loose between the bitmap letters | OK (fits) | — |
| 01 | Main-menu backup hint overlaps the bottom of the SURVIVORS logo (ru the same) | layout, minor | **Bookmarklet / site** |
| 00, 03, 04a, 04b, 05a, 08b names, 09b/09c variant names, 10a | Title, saves, news (Hardkor = D2R term), camp, HUD, "Karmazynowa Ćwiekowana Zbroja", Rozszczepienie / Mroźny Ogień / Ciężar, Obłok Jadu / Wypatroszenie / Daleki Rzut | OK | — |
