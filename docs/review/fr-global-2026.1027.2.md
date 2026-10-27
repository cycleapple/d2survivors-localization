# French dictionary-wide fixes (2026.1027.2)

Layer: `dict/fr/manual/review-global-2026.1027.2.json` (253 keys, merges after `review-2026.1027.2.json`; `unify-eu.mjs` skips every `review-*` key, so these values are final and are already œ-free, straight-quoted and upper-cased where the key is). Builder: `work/agents/fr-global/build.mjs`.
Tool: `tools/build-glossary.mjs` (two fr-only changes), `dict/fr/d2r-auto.json` regenerated: 121 keys changed, all `affix:` or rare names, none added/removed.
After `bash work/translation/remerge.sh fr`: all 253 values survive in `dict/fr.json`; `check-alignment` 0 mismatches; no case twins with different values.

## 1. Loot filter / uniques tab / banish — 6 keys
- Found: `KEEP` DÉPÔT and `Kept` Dépôt (D2R "deposit" from 보관); sentences already say "Conserver". `Banish` Exclure while `Banish* · *`, the hint and all sentences say bannir. `Missing` Aucun (= "none").
- Done: KEEP → CONSERVER; Kept → Collectés, Missing → Manquants (uniques tab "all / kept / missing" = collected / still to find); its empty-list lines "None kept yet" → "Aucun collecté pour l’instant", "Every one is kept" → "Tous sont collectés"; Banish → Bannir.

## 2. Stash vs chest — 42 keys
Decision: **stash = réserve (f.)**, **chest = coffre (m.)**.
- D2R French uses both words for the stash ("coffre partagé", but "Votre réserve est pleine", "Votre réserve personnelle", "Réserve d’or"), while its world chests are only "Coffre". This game's chests are a core mechanic (they drop from champions/bosses, carry names over them), so they keep D2R's object name, and the stash takes D2R's other stash word. "Your stash is full" is now word for word D2R ("Votre réserve est pleine").
- Done: `Stash` Cache → Réserve, `Shared Stash` → Réserve partagée, 33 sentences rewritten with gender agreement (de la réserve, réserve ouverte, votre ancienne réserve…), plus the 7 "No room for that with the <class> or in the stash" keys from `new-runtime-2026.1027.2.json` (they said "coffre").
- Kept: "Caskets, corpses, stashes…" stays "caches" (world objects, D2R "Réserve secrète"; avoids the player stash word). "keep your gear in the stash chest" → "dans la réserve".
- All 30 chest strings already said coffre; none says réserve/cache. Guide table updated (Stash, Chest).
- Note for the other agents: anything new about the stash should say réserve.

## 3. Bad auto-matched fillers / labels — 28 keys
- `poison` "Le poison" (unique-monster prefix) → "Poison" (same case as Feu/Froid/Foudre/Magie).
- `a monster` "Monstres" → "un monstre" (Slain by a monster); `a skill` "Compétences" → "une compétence" (fallback of "Evolved from"); `spark` Flamme → étincelle; `swift blow` Souffle vif → coup rapide; `arrow` Flèches → flèche; `Blow` Souffle → Coup.
- Element words: the only runtime filler is `Slain by …: # ${element} damage`. Added 12 keys (6 elements × 2 forms) so the element is part of the sentence: "pts de dégâts physiques / de Feu / de Froid / de Foudre / de Poison / magiques" (was "(physique)", "(Le poison)").
- Character-screen / SHOW DAMAGE labels (2-word auto matches): `Crushing Blow` "Expiation" → Coup écrasant; `Fire Damage` "Dégâts de Feu :" (gave "::") → Dégâts de Feu; Cold/Lightning/Poison/Magic Damage → Dégâts de Froid / de Foudre / de Poison / magiques (D2R "Dégâts de Poison", "Dégâts magiques"); Maximum/Minimum Damage "Dégâts Maximal/Minimal" → maximum/minimum; Enhanced Defense "Augmente la défense" → Défense améliorée.
- Checked, not changed: `Cap` = Coiffe is only the base item (no "cap = limit" filler); `fire`/`cold` (Feu/Froid) kept capitalised like D2R's "dégâts de Feu"; `physical` physique.

## 4. Difficulty fillers — 2 keys
- `on Nightmare` / `on Hell` → "en Cauchemar" / "en Enfer" (like "on Terror tier #" = "en Terreur, palier {0}"). The `* on Nightmare` / `* on Hell` / `* on Terror tier *` templates already give "(Cauchemar)" etc.; "Fell in *, *" is "Mort en …" (review layer).

## 5. Magic prefixes — 27 keys + tool
- Why the forms were dropped: build-glossary looked up the gender forms by D2R's *current English*; D2R renamed these affixes (Gaea's → Gaean, Terra's → Terrene, Envenomed → Foul, Trump → Fool's, Paleocene → Faithful, Snowflake → Snowy, Ember → Fiery, Gritty → Grinding, Corosive → Corrosive, Scorching → Condensing, Accursed → Cursing, Vodoun → Mojo, Warder's → Warden's…). The value was matched through Korean, but the forms lookup by English failed. The lookup by D2R row Key (`affixFormsByKey`) was already in the tool when I regenerated (added by the German agent); regenerating gave 17 `affix:` keys their four forms.
- Where D2R's row has the new meaning, the layer overrides: `affix:Envenomed` infect → envenimé/envenimée/envenimés/envenimées; `affix:Trump` fou → d’atout (invariable); `affix:Paleocene` fidèle → paléocène/paléocènes; `affix:Terra's` terrenien → terrien/terrienne/terriens/terriennes; `affix:Scorching` condensé → embrasé/embrasée/embrasés/embrasées (a fire prefix here; plain key was already "embrasé").
- Plain prefix keys → D2R's lowercase form (21): délétère, acrobatique, d’ange, d’archange, d’archer, athlétique, de Bahamut, du berserker, du fabricant d’arcs, du capitaine, de cobalt, corrosif, du Dragon, du drake, du guet-apens, envenimé, de Fletcher, gaien, grinçant, gymnastique, and `Warder's` → défensif (D2R's row for that Key; "de la Sentinelle" is already `of the Sentinel`). Amber/Gold/Shadow/Ember kept (ordinary words / modifier name).
- The per-level prefix patch note now lists "grinçant, d’atout, oeil-de-faucon, visionnaire et paléocène" (was Grinçant, Fou, …, Fidèle).
- Checked with `work/translation/compose-proto.mjs` logic: Coiffe gaienne, Gants terriens, Épée courte envenimée, Amulette d’atout, Rapière embrasée, Grand bouclier défensif.

## 6. Rare names — 65 keys + tool (104 auto keys)
- Raven: D2R's rare prefix is item-names "du Corbeau"; auto picked the skill "Corbeau" (87 names). build-glossary (fr only) now prefers the item-names front with a de/du form when the front is not in the affix file → 87 auto names fixed (Raven Claw / Raven Frost stay: D2R uniques). The layer only fixes "Raven Shard".
- Vengeance (no D2R rare form): 77 "de la vengeance" / 42 "Vengeance" → all "de la vengeance" (42 keys).
- Shard: D2R's back part is "L’éclat" → 24 names "L’éclat X" → "Éclat X".
- Gender of plural back parts: the Korean match often hit a non-affix row (objects "Cadavre", runeword "Dévastation"), whose missing forms left the front in ms ("Perles cadavérique", "Grèves inéluctable"); and untagged "Brodequins" counted as ms. build-glossary (fr only) now takes the forms from the affix-file front and treats an untagged -s back as plural → 17 auto names fixed (Perles/Sabots/Piétineurs/Grèves/Brodequins).
- Checked other fronts: no other split. Not changed (report): Fiend → "Fiel" (138, bare monster name, "fiel" = bile), Ghoul → "Goule" / Wraith → "Spectre" (155 each, bare noun, no D2R rare form; the 7 lowercase ones are D2R uniques like Peaux de goule), Armageddon / "de L’Ordre" are D2R's own forms, Flight "Penne" is tagged [ms] by D2R ("Penne cruel").

## 7. Modifier names — 8 keys
- `Stunning` Étourdir (verb) and `modifier:Stunning` Étourdissant → Étourdissement (matches "L’Étourdissement de Tir béni…").
- Other auto-matched modifier names: Pulse "régulier" (adjective) → Pulsation; Hunter "Le Chasseur" → Chasseur; Fester "La suppuration" → Suppuration; Crushing "Déchirure" → Écrasement; Crush "Déchirure" → Broyage; Sundering "Fendoir" → Fracture. None is quoted in a patch note.
- Checked, not changed: Thrown "Lancer" is overridden by `modifier:Thrown` Jet; Cleave/Brand/Grounded/Crack are nouns.

## 8. The hero is masculine — 10 keys
- "Elle porte {0}", "ce qu’elle a gagné", "qu’elle ne peut pas porter/avoir", "Faites-la revenir", "la faire revenir", "Akara peut la faire recommencer", "montre qu’elle a terminé" → il / le. Also "éclat doré" → "lueur dorée" in the two golden-glow lines that still said éclat. Lines about Charsi, Akara, the Rogue Scout, the Valkyrie, the Amazon/Sorceress/Assassin keep "elle".

## 9. Chill — 34 keys
- Found: glacer 13+, refroidir 7, ralentir 15, "gel" 5 for the same thing. D2R: cold "slows" (Cold Arrow "enchants arrows to slow targets" = ralentir); geler/immobiliser is freeze.
- Done: chill = ralentir, chilled = ralenti, the effect = ralentissement(s); fillers `chill`/`chills` → ralentissent/ralentit. "Grave Chill" in its patch note now matches the modifier name Froid sépulcral. D2R names keep their words (Armure de gel, glaçant).

## 10. SHOW … — 7 keys
- AFFICHER (D2R "View" = Afficher; the long notes already said AFFICHER LES DÉGÂTS): SHOW DAMAGE, SHOW ITEMS, their `: #` keys, the Alt hint. Added `SHOW DAMAGE: *` / `SHOW ITEMS: *`: the runtime value is a word (SIMPLE / OFF), so the `#` key never matched and the ": " fallback dropped the space.

## 11. Levels gear adds to every # # — 10 keys
- The code fills words (`${tree minus " Skills"} ${skill|passive|skill and passive}`), so the `# #` key never matches. Added `Levels gear adds to every * skill / * passive / * skill and passive` → "Les niveaux de l’équipement s’ajoutent à chaque compétence (Feu)" etc., and tree keys that had none (Bow and Crossbow, Combat, Javelin and Spear, Passive and Magic, Poison and Bone). `new-runtime-2026.1027.2.json` (another agent) has exact sentences for most class/tree combinations and the three "A level past a …'s maximum" keys; those win, mine cover the rest.

## 12. Titles — 3 keys
- title:Guardian Gardienne → Gardien; "The Infernal Gate" and "The Infernal Gate. *" → "La Porte des Enfers" (the other chapters have their article).

## 13. Months — 0 keys
- Already lowercase in `review-2026.1027.2.json` (janvier … décembre); verified they survive.

## 14. Creepers / skeletal mages / bolts — 10 keys
- "empoisonnant de {1}" → "infligeant {1} de poison" in both creeper sentences (the fallback was fixed in the review layer); "# skeletal mage casts…" now matches the plural ("des traits de feu, de froid, de foudre ou de poison pour…"); `# bolt` projectile → trait.
- Added count keys # raven(s), # creeper(s), # skeletal mage(s) for the fallback templates. Bare "ravens" / "creepers" / "skeletal mages" are never shown alone (only via `tb()` / `rb()` with a number), so no noun keys.

## 15. pierce — 1 key
- Holy Bolt singular "Fires # bolt of holy light that pierces #, …" added (plural is in new-extra); Ice Bolt has both sentences. Lowercase `pierce` cannot get its own value: the lookup is case-insensitive and `Pierce` is the Amazon passive "Percer".

## Needs a runtime rule (not fixed)
- The ": " fallback joins "Label: value" without French spacing ("Dégâts de Feu: 10-20 par flèche" on the skill box per-hit lines).
- "Evolved from a skill" fallback gives "Évoluée à partir de une compétence" (no elision); only when the source skill has no name.
- Element words share keys with skill names (`lightning` = Foudre the skill, `magic` = Magie): handled for "Slain by" with full keys; any other runtime "${element}" filler would need a rule.

## unify-eu
- No rule change needed. It now skips `review-*` keys, so it cannot undo this layer; values were written œ-free and upper-case where needed.
