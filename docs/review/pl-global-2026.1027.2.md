# Polish: dictionary-wide fixes (2026.1027.2)

Output: `dict/pl/manual/review-global-2026.1027.2.json`, 364 keys (only keys that change). It merges after `review-2026.1027.2.json` and before `overrides.json`. unify-eu skips every key in it, so nothing gets overwritten. After `bash work/translation/remerge.sh pl`, all 364 values are in `dict/pl.json` (0 mismatches), and `check-alignment` reports 0 number mismatches. Scripts and logs are in `work/agents/pl-global/`. `tr.mjs` runs the game's translator on `dict/pl.json` (plus an optional overlay).

## 1. Raven / Vengeance rare names — 124 keys
- **Found:** 87 "Kruk X" (the D2R noun) and 44 "Zemsta X". The per-string review had already fixed 5 Raven and 2 Vengeance names.
- **Done:** the remaining 82 Raven names now use the D2R rare prefix `[fs]Krucza[ms]Kruczy[nl]Krucze` (item-names.json "Raven"), and the 42 Zemsta names use Mściwy/Mściwa/Mściwe. The adjective agrees with the noun gender from the table in item 2.
- **Also fixed:** Vengeance Glare "Mściwe Spojrzenie" became "Mściwy Blask", the same noun as every other "X Glare".
- **Kept:** Raven Claw "Szpon Kruka" and Raven Frost "Kruczy Lód" are D2R unique items.

## 2. Adjective/noun gender agreement in rare names — 111 more keys (incl. Brow) + 5 unique:/gender: keys
- **Method:** the prefix list (44 words) and suffix list (155 words) come from the game code (`eMe`/`tMe` in moved.js), plus Dragon, Vengeance and 7 legacy suffixes found in the dict (Orb, Shard, Glare, Mauler, Road, Sphere, Stalk). Noun genders come from the D2R suffix rows (`[fs]Pięść`, `[fs]Uprząż`…) and the D2R noun tags. 15 untagged nouns were set by hand. Prefix forms come from the D2R affix rows; for Ghoul, Wraith, Fiend and Vengeance (not in D2R) the dict's own forms were used. Every "Prefix Suffix" key was compared with the expected "form[gender] noun". Table: `work/agents/pl-global/rare-table.json`.
- **Gender (85):** masculine prefix on feminine nouns that end in a consonant, or in -ica: Iglica 15, Pieśń 15, Przyłbica 15, Pięść 15, Uprząż 14, Obręcz 11. One more ("Beast Song") was already in review.
- **Lowercase noun (4):** "… kula" became "… Kula" (Ghoul, Rune, Plague, Wraith Orb).
- **One noun per English word (12):**
  - Stalk: "Trop" became "Pościg" in 9 names, because Track is also "Trop".
  - Glare: "Spojrzenie" became "Blask" in 3 names.
  - Grim Ward is not a rare name (it is the D2R skill Ponury Totem), so it was left alone.
- **Wrong whole-word auto-matches (9):** for example, Stone Smasher "Miażdżykamień" (that is Stone Crusher's D2R unique name) became "Kamienny Rozbijacz". Also fixed: Bone Lance, Plague Dart, Spirit Veil, Ghoul Hide, Bone Suit, Shadow Cloak/Mantle (both were "Płaszcz Cieni") and Spirit Shard.
- **Kept as official D2R names:** Grim Scythe/Wand/Shield, Skull Splitter, Death Cleaver, Stone Crusher, Wraith Flight, Dragon Flight/Claw, Death Mask, Spirit Mask, Spirit Ward, Blood Wing, Death Mark, Shadow Touch, Shadow Master, Rune Master, Rune Slayer. Demon Heart "Demonie Serce" is the D2R spelling (a typo in D2R) and was also kept.
- **Plain word:** "Brow" (word-by-word fallback) "Grzbiet" became "Czoło", as in the rare names.
- **Unique monster parts:**
  - unique:Head "głowa" became "Głowa".
  - unique:Pit had the neuter form "Podziemny", now "Podziemne" (a D2R typo).
  - unique:Bile had the feminine form "Zzłóciała", now "Zżółciała" (a D2R typo).
- **gender: keys made by unify's ending rule:** Assassin "Zabójczyni" was nl and is now fs; Necromancer "Nekromanta" was fs and is now ms. The ending rule only exempts -ca/-sta, not -ta. All other 721 gender: keys agree with the D2R noun tags.

## 3. Skill-tree tab names — 17 keys
- **Where they show:** `classTrees.*.labels` (the tab labels) and `+* to * (* Only)` use the tree names directly.
- **Changed to the D2R SkillCategory names:**
  - Aury Defensywne / Aury Ofensywne, Sztuki Walki, Dyscypliny Cienia
  - Zimno / Ogień / Błyskawice (were "… Umiejętności")
  - Żywioły, Przywoływanie, Zmiana Kształtu
  - Łuk i Kusza, Oszczep i Włócznia, Pasywne i Magia, Trucizny i Kości
  - Masteries "Bojowe" became "Mistrzostwa Bojowe"
- **Also fixed:** "Cathan's Traps" "Pułapkia Cathana" became "Pułapki Cathana" (D2R), and "+# to Fire Skills" now has a capitalized "Ognia", like its siblings.
- **Already correct:** the `Levels gear adds to every …` full variants and the short fillers (Cold Spells, Combat, Summoning, Elemental…), which already used the D2R tab names.

## 4. Wrong auto-matched words — 31 keys
- **Collection and pick-up filter:**
  - KEEP: ZDEPONUJ → ZACHOWAJ
  - Kept: Zdeponuj → Zachowane (the {all,kept,missing} tab, next to "Wszystkie"/"Wszystkie są zachowane")
  - Missing: Brak → Brakujące
- **Banish:** Nie pokazuj → Wyklucz.
- **ON/OFF:** ON "WŁĄCZONA" → "WŁ.", so it pairs with OFF "WYŁ." ("WYCISZ: WŁ.", "AUTO-AKTUALIZACJA: WYŁ."). The Sound on/off banner had the wrong gender ("DŹWIĘK WŁĄCZONA") and is now "Dźwięk włączony/wyłączony".
- **Fillers:**
  - skill/passive/a skill became lowercase "umiejętności"/"pasywne", for "wszystkie: {1} ({0})" and "Rozwinięto z: {0}".
  - a monster "Potwory" → "potwór" (Slain by …).
- **Word-by-word damage labels:** "Zimno Obrażenia" and "Błyskawica Obrażenia" were word-by-word, and "Magiczne Obrażenia" and "obrażenia od trucizny" were inconsistent with the others. All four now read Obrażenia od zimna / od błyskawic / od magii / od trucizny.
- **Monster type labels:** Champion, Fanatic, Berserker and Ghostly had the D2R name-prefix dash ("Czempion –"). Now Czempion, Fanatyk, Berserker and Duch.
- **Skill-variant names without a modifier: key:**
  - Return "Wróć" (a verb) → Powrót
  - Shards "Odłamek" → Odłamki (Splinter is also Odłamek)
  - Crush/Crushing "Przerzynacz" (= Rend) → Zgniecenie/Miażdżenie
  - Grounded "Grunt" → Uziemienie
  - Thicket "Krzew" → Gąszcz
  - Searing "Żar" (= Embers) → Rozżarzenie
  - Frostfire/Frostburn "Odmrożenie" (= Frostbite) → Mroźny Ogień / Mroźne Oparzenie
  - Sundering "Rozpłatanie" (= Cleave) → Rozłupanie
  - Bramble "Ciernisty" (an adjective; "Ciernie" is the Thorns skill) → Jeżyny
  - Deep Cold "Zlodowaciały" → Przenikliwy Chłód
- **Checked and left alone:**
  - Vortex, Cyclone, Alpha, Focus, Rebirth, Purge and others already have modifier: keys.
  - Shared "Wspólna" is also the shared stash tab.
  - Normal/Nightmare/Hell, Terror, Report and Sell are correct.

## 5. Count keys — 7 keys
- **Changed to the "noun ×N" form** that fits inside sentences:
  - `# arrows` → strzały ×{0}
  - `# bolts` → pociski ×{0}
  - `# kick` / `# kicks` → kopnięcie/kopnięcia ×{0}
  - `# hits` → trafienia ×{0}
- **Twister template:** `# seek monsters, …` gave "wir ×1 ścigają potwory" (lowercase, wrong verb agreement). It is now "Pościg za potworami: {0}; każdy mijany otrzymuje …".
- **Harness check** (50 lines, 1 and 3 of each): Magic/Fire/Cold/Exploding/Guided Arrow, Poison Javelin, Lightning Bolt, Fire/Ice/Holy Bolt, Charged Bolt, Lightning, Ice Blast, Poison Dagger, skeletons/mages, Shock Web, Dragon Talon, Psychic Hammer, Double Throw, Blessed Hammer, Zeal, Twister, Raven, Creeper.
  - Before: "Wystrzeliwuje: Liczba strzał: 3 …", "w najbliższe potwory: Liczba pocisków: 3".
  - After: "strzały ×3", "pociski ×3".
  - The double-noun templates (Fire Bolt, Charged Bolt, Lightning…) had already been fixed in review. Dragon Talon uses its full-number templates and reads correctly.

## 6. Magic prefixes — 23 keys
- **Forms added:** all 17 single-form affix: keys now have `[fs][ms][nl]` forms: Accursed, Acrobat's, Athlete's, Gymnast's, Corosive, Gritty, Snowflake, Gaea's, Nature's, Ember, Scorching, Envenomed, Paleocene, Trump, Terra's, Vodoun, Warder's.
- **Meanings:** the D2R rows behind some of these keys carry D2R's renamed English, which the game doesn't show:
  - Paleocene shows "Faithful" in D2R ("Wierny") → Paleoceński
  - Trump: D2R "Fool's" ("Ośli") → Atutowy
  - Scorching: D2R "Condensing" ("Skondensowany") → Prażący (Płonący is already Burning)
  - Envenomed: D2R "Foul" → Zatruty
- **Plain and affix made the same:**
  - Vodoun → "Wudu" (all forms)
  - Ember → Żarzący
  - Terra's → Gruntowy (D2R)
  - Warder's → Kuratorski (D2R; the plain key was the genitive "Strażnika")
  - Plain Scorching and Envenomed were changed too.
- **Typos:** affix:Weird neuter "Dzwine" → "Dziwne"; affix:Summoner's feminine "Demonolgiczna" → "Demonologiczna".
- **Check:** compose-proto composes names correctly.

## 7. Changelog variant names — 5 keys (plus the 3 renamed variants)
- The per-string review had already fixed Rally, Rebuke, Lingering, Crossfire, Trail, Fault Line, Stunning and Static.
- **Scan:** every news line (906) for a variant name after "'s", and also anywhere in the line. The remaining mismatches were:
  - Leap's Rumble: "Dudnienie" → "Wibracje"
  - Phoenix Strike's Rebirth: "Ożywienie" → "Odrodzenie" (the modifier: name)
- **Updated for the renames in item 4:** Dragon Tail's Searing, Blades of Ice's Frostfire, Spirit of Barbs' Bramble.
- The two remaining hits are false positives: Bulwark ("Szańca" is the inflected form) and "Crushing Blow".

## 8. Consistency — 30 keys
- **chill:** 25 strings used "spowalnia/spowolnienie" (also D2R's word for Slow, and this game has both Slow and chill: "Spowalnia … i je schładza"). They now use schładza/schłodzenie/schłodzony, which the review already chose for the status. Keys that also contain "slow" were left alone.
- **golden glow:** the last "złoty blask" became "złotą poświatę".
- **Send my runs:** every reference now says "Wysyłaj moje podejścia". "Tiers cleared offline or with Send my runs off…" now reads "przy wyłączonej opcji Wysyłaj moje podejścia".
- **Small fixes:**
  - swift blow "Żwawa Cios" → "szybki cios" (lowercase, like `# swift blow`)
  - creeper "Winorośl" → "Pełzacz"
  - unique:Head and unique:Spawn are capitalized (unique:Spawn in review, unique:Head here)
- **New key "damage per level ":** the piece now has a key, "do obrażeń ". In the harness the specific `+*% damage per level of *` key wins anyway.
- **New key "(max)" → "(maks.)":** it was untranslated in "Level 3 to 4 (max)".

## 9. "–" and "→" — 8 keys
- **Code check:**
  - The bitmap renderer (moved.js `code()`) maps `· – — ‘ ’ “ ” …` to `- - - ' ' " " .` through `tce`. Every other code point ≥ 256 that isn't a "foreign" glyph is drawn as "?" (63).
  - The Exocet font built from D2 font42 (`rse`) aliases 8211/8212 to "-".
  - DOM text falls back to Cinzel/Palatino/Georgia/serif.
  - pl's foreign range is only U+0100–017F (patch-rules), and the Polish fonts cover only that range.
- **"–" (26) and "—" (4):** they draw (as "-" in bitmap text). Kept.
- **"→" (U+2192):** it draws as "?" in bitmap text. The 7 strings that used it are now written in words or with "–":
  - "Rozwój: {0} – {1}!" / "…, wymaga:" / "…, wymaga też:" / "Rozwój: {0} – {1}:"
  - "Rozwiń: {0} – {1}"
  - "Skrzynia rozwinie teraz: {0} – {1}"
  - "Z poziomu {0} na {1}{2}"
- **Kept:** the 2 "← →" hints ("← →: wybierz …"). The English source has the same arrows, and they go to the DOM hint (setHint).

## Coordinator item: "next level" — 3 keys
- "Kula Ognia: Następny poziom: na poziomie postaci 12" now reads "Kula Ognia: następny poziom (poziom postaci: 12)".
- The filler "next level" lost its colon and capital. The templates `*: * at character level *` and `*: * at level *` became "{0}: {1} (poziom postaci: {2})" / "{0}: {1} (poziom: {2})", which also works for "learned" ("Kula Ognia: nauka (poziom: 12)").

## Report only (not fixed)
- **Hardcore titles:** title:Slayer/Champion/Destroyer/Conqueror/Guardian have one key for both genders (Pogromca, Mistrz, Niszczyciel, Zdobywca, Strażnik). D2R has the female forms (`Female*PlayerTitle`: Pogromczyni, Mistrzyni, Niszczycielka, Zdobywczyni, Strażniczka). This needs a rule that picks the form by the hero's sex.
- **unify-eu's Polish ending rule** treats -ta (Nekromanta) and consonant-final feminine nouns as masculine (both fixed here by key). Any new gender: key it generates can repeat this.
- **merge-dict's rare-suffix consistency report** lists 18 suffixes ("ie Paciorki" vs "e Paciorki"). These are false positives: the common prefix of "Trupi/Trupie" vs "Kościany/Kościane" splits inside the adjective ending.
- **Number format:** the game's own numbers stay "2.0 s" (decimal point), which is outside the dictionary.
