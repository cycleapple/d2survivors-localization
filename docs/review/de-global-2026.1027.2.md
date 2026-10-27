# German dictionary-wide fixes (game 2026.1027.2)

Layer: `dict/de/manual/review-global-2026.1027.2.json` (277 keys; merges after `review-2026.1027.2.json`, before `overrides.json`).
Build script: `work/agents/de-global/build.mjs`. Base for the script is `work/agents/de-global/de-base.json`: the merged dict after the regenerated d2r-auto, without this layer.
`unify-eu.mjs` now skips every key that is in a `review-*.json` file, so it can't undo these values. That's why the layer writes straight quotes and all-caps itself.
After `bash work/translation/remerge.sh de`, all 277 values are in `dict/de.json` unchanged. `check-alignment`: 864 strings with numbers, 0 mismatches.
Translator harness used for checks: `work/agents/de-global/tr.cjs` (the game's own translator over dict/de.json).

## 1. `cold` = Kältezauber
- Source of the bad match: D2R `strhirespecial6` (hireling special "Cold" → "Kältezauber"). Fixed `cold` → **Kälte**.
- Other element words: `fire` Feuer, `poison` Gift, `Magic` Magie (only an item-stat filler) and `physical` physisch are all fine. `lightning` is item 2.
- 1 key.

## 2. `lightning` = the skill "Blitzschlag"
- These game templates insert the bare element word:
  - `Slain by *: * * damage` and `Slain by *'s *: * * damage` (moved.js, `t.element`: physical/fire/cold/lightning/poison/magic)
  - `Less * damage taken*` (Game.js character screen, fire/cold/lightning/poison)
  - `+${t} ${e} Damage` and `Adds ${t}-${n} ${e} Damage` (already covered by D2R's concrete `+# cold damage` / `Adds #-# … damage` templates)
- Added concrete keys, which win because they have more fixed text:
  - 12 `Slain by …` keys, e.g. "Getötet durch {0}: {1} Blitzschaden" and "… {1} physischer Schaden"
  - 4 `Less X damage taken*` keys, e.g. "Erlittener Blitzschaden verringert{0}"
- The skill `Lightning` stays "Blitzschlag". The reviewers' generic keys stay as the fallback.
- 16 keys.

## 3. "X Damage" labels
- Cold Damage → Kälteschaden; Magic Damage → Magieschaden (Lightning Damage was already done in review).
- Average/Minimum/Maximum Damage (Charsi compare rows) → Durchschnittsschaden / Minimaler Schaden / Maximaler Schaden.
- The generic wildcard `+# Damage` was splitting `+20% Attack Damage` into "+20% Angreifen Schaden". Added `+#% Attack Damage` → "+{0}% Angriffsschaden" and `+# Average Damage`.
- 7 keys.

## 4. Magic-affix adjectives
- Cause: the game's `affix:` keys are D2 internal names (D2R `Key`), and the D2R English differs: Corosive/Corrosive, Scorching/Condensing, Gritty/Grinding (row 20916), Trump/Fool's, Vodoun/Mojo, Gaea's/Gaean, and so on. build-glossary only looked up forms by enUS.
- **Tool fix**: when enUS has no match, `affix:` keys fall back to the item-nameaffixes `Key`.
- Now all 15 listed affixes have `[ms][fs][ns][pl]` forms. Two more were fixed the same way:
  - `affix:Envenomed` "Faul -" → [ms]fauler…
  - `affix:Warder's` "des Wächters" (a suffix form on a prefix) → [ms]beschützender…
- Layer: removed the D2R stray space in `affix:Glowing` and `affix:Emerald` ("[ms] glühender").
- **Skipped**: Kenshi's / Sensei's / Shogukusha's. D2R's own values are the genitives Kenshis / Senseis / Shogukushas, which don't change with gender ("Kenshis Kappe"). They are correct as they are.
- Side effect: the key fallback isn't limited to German. Regenerating ru or pl auto would change 17 affix keys each (fr: 0). I did not regenerate them.

## 5. Rare names (tool fix in `tools/build-glossary.mjs`, German only)
- The back nouns (D2 RareSuffix rows hood, gyre, heart…) have **no gender tags anywhere in D2R's rare rows**. The gender now comes from, in order:
  1. the row's own tag
  2. the same German word tagged elsewhere in item-names/item-nameaffixes (Herz ← hrt "[ns]Herz")
  3. a table `DE_GENDER` in the tool for the ~110 words D2R never tags (this includes Stange, the back of "Bar", which matched Bardiche)
- Adjective fronts Bitter/Cruel/Entropy: 320 names now take the back noun's gender. First letter capitalised for keys that start uppercase (Verbitterte Schnürschuhe, Grausames Herz).
- `X Bane` (25): the back "Gift -" is D2R's prefix form, so the " -" is dropped (Dämonen-Gift, Grausames Gift).
- Extra fixes in the same function (same kind of broken output):
  - Noun fronts that D2R wrote without " -" are now compounds: Raven/Ghoul/Wraith/Fiend/Corpse/Vengeance/Rule → Raben-/Ghul-/Gespenster-/Teufels-/Kadaver-/Rache-/Regel- (was "Rabe Ägis"; 824 names).
  - Genitive fronts go after the noun: Imp "der Kobolde" → "Horn der Kobolde" (133); Armageddon uses D2R's rare prefix "von Armageddon" → "Stirn von Armageddon" (30).
- Regenerated `dict/de/d2r-auto.json`. Diff old → new: **1327 rare-name keys + 17 affix keys, nothing else**. List in `work/agents/de-global/diffauto.txt`.
- Two modifier names that go through the same rare matcher got fixed as a side effect: Holy Edge "geheiligter Schneide" → Geheiligte Schneide; Charged Blow → Aufgeladener Schlag.
- No manual layer overrode any changed key.

## 6. Loot filter / collection and other single-word auto-matches
- Loot filter and collection:
  - KEEP → AUFBEWAHREN (sentences already quote "Aufbewahren")
  - Collection tabs All/Kept/Missing: Kept → Gesammelt, Missing "Keine" → Fehlend; matching empty texts "None kept yet" → Noch keiner gesammelt, "Every one is kept" → Alle gesammelt
  - Kill "Hauer" → Tötung (I can't find it used in the code)
- Other wrong auto-matches used as labels or fillers:
  - News headers: Latest "Modern" → Neueste, Earlier "Zurück" → Ältere
  - Damage-source label Attack "Angreifen" → Angriff
  - Inventory slot Weapon "Waffen" → Waffe
  - Fillers: spark "Flammer" → Funke, arrow "Pfeile" → Pfeil
  - Modifier name Return "Zurück" → Rückkehr (it is only used as a modifier name)
  - Blade "messer" → Messer
- Skill-tree names (character screen rows) were word-for-word matches or D2R tab strings with hyphen line breaks ("Feuer Fertigkeiten", "Herbei-\nrufung Fertigkeiten", "Offensiv-\nauren"). Now D2R tab names: Feuerzauber, Blitzzauber, Kältezauber, Herbeirufung, Kampffertigkeiten, Offensivauren, Defensivauren, Kriegsschreie, Elementarzauber, Gestaltwandel, Schattendisziplinen, Kampfbeherrschung.
- Fire/Cold/Lightning/Poison Resistance labels had "Feuer-\nWiderstand" → Feuerwiderstand, etc.
- Total: 32 keys.
- Seen but not changed (not shown as text, or a design question):
  - `Boss` is a voice-line id; `web` is a platform id sent to the server
  - The champion-type adjectives (Fanatic → fanatischer…) are lowercase masculine forms
  - `Static` / `Alpha` are already covered by `modifier:` keys

## 7. Terror tiers
- Schrecken-Stufe(n) → Schreckensstufe(n) and Kuh-Stufe → Kuhstufe: 13 keys. The reviewers had already done the others; 0 left.
- **Not changed**: "Schrecken Stufe {0}" (7 numbered labels). That spelling is the guide's own term-table entry for `Terror tier #`. Change it in the guide first if you want "Schreckensstufe {0}".
- Compounds like "Schrecken-Bestenliste" are left as they are.

## 8. Dire wolf, Sightless Eye
- **Note**: D2R itself is inconsistent here. The monster is "Todeswolf" (monsters.json Druid Fenris / UIFenirsui); the skill is "Schreckenswolf" (Skillname238).
- I followed the skill name players see on the card (the reviewers did the same): Todeswolf/Todeswölfe → Schreckenswolf/-wölfe, 3 keys. 0 left.
- "The Sightless Eye" isn't an act-name string in D2R. The order is "Schwestern vom Verborgenen Auge" / "Das Verborgene Auge" (Akara's lines).
- `The Sightless Eye. *` → "Das Verborgene Auge. {0}" (the bare title was already done in review).

## 9. Crushing Blow
- D2R: "Chance auf vernichtenden Schlag". "Niederstrecken" is the skill Smite.
- Fixed the label `Crushing Blow` → Vernichtender Schlag, plus 3 changelog lines. The reviewers had already fixed 2 others.
- Only 6 keys mention Crushing Blow, not ~17. The 11 remaining "Niederstrecken" are all about Smite and correct.
- Guide term table updated: "vernichtender Schlag (Smite = Niederstrecken)".

## 10. Stat phrases after a number
- How it works: the game's D2 item-stat formatter (moved.js `sje`, descval 1) prints "num phrase". The translator then translates the phrase on its own (number + phrase fallback).
- Checked all 101 keys used as `stats.*.pos/neg/str2` against D2R's "%d%% …" rows. The reviewers had already fixed Increased Chance of Blocking, Faster Block Rate, Faster Hit Recovery, Slower Stamina Drain, Piercing Attack and Damage Taken Goes To Mana.
- Now lowercase: Life/Mana stolen per hit, Absorbs Fire/Cold/Lightning Damage.
- Fixed wording: Damage to Demons "zu Schaden gegen Dämonen" → Schaden gegen Dämonen; Damage to Undead → Schaden gegen Untote.
- `Enhanced Defense` and `Enhanced Damage` are also capitalised labels in Charsi's compare list. The labels stay capitalised ("Verbesserte Verteidigung", was "Erhöht Verteidigung"), and I added exact templates `+#% Enhanced Defense` / `+#% Enhanced Damage` with the lowercase phrase.
- 10 keys.

## 11. bolts, creeper
- `# bolts` → "{0} Geschosse".
- creeper "Ranke" → Kriecher in `creeper` and 4 sentences. The vine lines (Aasranke, "Gaben der Ranken") stay.
- 6 keys.

## 12. Modifier names in changelog lines
- Checked every "<Skill>'s <Modifier>" line against the modifier's own translation (`modifier:X`, otherwise `X`). Script: `work/agents/de-global/mods.cjs`.
- Rewrote 13 lines with the name quoted: Rolling Cry, Bloodlust + Last Stand, Siphon, Spite, Fealty, Absorb + Retort, Rumble (now "Vibration"), Quick Drain, Twin Kick, Embers (Glutfunken), Searing (Brand), Frostfire (Frostbrand), Return.
- The only one left is Withering Ground, and it is only the declension ("Der Welkende Boden").

## 13. Percent, decimals
- D2R German writes "10%", so every "N %" / "{n} %" → no space.
- D2R German has no decimal numbers in game text; the only two are a version number and a debug line. I chose the **decimal point** because:
  - numbers the game inserts at run time (`toFixed`) always use a point
  - 61 of the 78 existing decimals already used a point
- Converted the 17 decimal commas. check-alignment: 0 mismatches.
- 163 keys changed only for this (plus the ones above).

## 14. Cain challenges
- The list now uses the infinitive throughout: Mephisto "Töte …" (now worded like the Baal line), `Hold * evolved skills as an act boss falls.`, `Clear a tier with No Potions in the Belt.` (the reviewers had done the rest).
- 3 keys.
- The quest-log texts with "Ihr/Euch" (Akara, Cain) are D2R quest style and not in this list; left as they are.

## 15. Lowercase white items and potions
- 43 base items plus 4 healing potions are lowercase: D2R's own values ("[pl]schwere Handschuhe").
- **Can't be fixed in the dictionary.** In lang-*.js:
  - `I(e,'normal')` shows a white item with `translateAs('item', name)`.
  - The magic name's base in the patch-rules German rule (`b=this.translateAs('item',t)`) uses the same lookup: `item:<name>` first, then the plain key.
  - So capitalising either key also gives "Robuste Schwere Handschuhe".
- **A runtime rule would need** one of:
  - (a) A separate composition key. In `magic-de`, `b = this.exact.get(s(`base:${t.trim()}`)) ?? this.translateAs('item',t)`. The dictionary would then get `base:<item>` = lowercase-adjective form and capitalised plain keys. A build-glossary change can generate `base:` from D2R.
  - (b) In `magic-de`, lowercase the first letter of `b` when there is a prefix and `b` has 2+ words. This also fixes the composed D2R forms that are already capitalised ("Robuste Himmlische Sichel").
- The rule belongs to tools/patch-rules.mjs, which isn't mine.
- Done here: `Blade` "messer" → Messer (a noun, so safe).

## 16. Portal / destination templates (coordinator's request)
- `A portal to * has opened` and `A portal to # has opened`: the filler is a town, an act or "the Secret Cow Level" ("Ein Portal nach Das Geheime Kuhlevel"). Both → "Ein Portal hat sich geöffnet: {0}".
- `A portal to Act # has opened` ("nach Akt {0}") is fine.
- `Walk into the portal to *` ("Betritt das Portal (Ziel: {0})") and `CONTINUE TO #` ("WEITER: {0}") were already fine.
- `The portal takes you in #…` ("Das Portal bringt dich in 3 fort…", where # is the countdown) → "Das Portal bringt dich fort in {0}…".
- 3 keys.

## Report only: female titles
- Titles are picked in Game-DdGU5sWi.js `Hg(cls, difficulty, hardcore)`:
  - Hardcore uses `Vg={normal:'Destroyer',nightmare:'Conqueror',hell:'Guardian'}`
  - Softcore: normal → Slayer, nightmare → Champion, hell → Matriarch for `Bg=['amazon','assassin','sorceress']`, Patriarch for the others
- The English titles are gender-neutral, but German needs Zerstörerin / Eroberin / Wächterin / Schlächterin for the Bg classes.
- A rule should look up e.g. `title:<X>:f` when `Bg.includes(cls)` (Matriarch is already handled through its own key).

## Seen, not fixed
- "Getötet durch Monster" / "Getötet durch Gefallener": the `Slain by *` filler is a bare monster name.
- `the Rogue Encampment` (a possible portal filler) has no key.
