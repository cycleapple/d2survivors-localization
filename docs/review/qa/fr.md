# fr screenshot review (desktop 48 + web 28, contact sheets only)

Checked against current `dict/fr.json` (2026-10-28). D = desktop (`work/qa/fr/desktop/`), W = web (`work/qa/fr/web/`).
Dictionary fixes still needed are in `fixes.json` (23 keys). No "?" boxes or missing glyphs anywhere (ç, É, À and â render correctly; "Oeil" is written that way on purpose).

| file | problem | status now | fix |
|---|---|---|---|
| D 02-main-menu, W 01-main-menu | "Jouer" and "Options" are mixed case while SAUVEGARDES / QUITTER are in caps | still open (`PLAY`/`Play` = "Jouer", `Options` = "Options") | `PLAY`, `Play` → JOUER; `Options` → OPTIONS (also fixes the pause menu, D 13 / W 10c) |
| D 02, W 01 | "ACTUALITÉS" button too wide: É and S squeezed against the right knob (crop) | still open | `NEWS` → INFOS |
| D 05-options-graphics, W 02b | "EFFETS DE COMPÉTENCE" cut off at the left edge (slider row). WEB-FINDINGS 8 | still open | `SKILL EFFECTS` → EFFETS (the hint below says what it does) |
| D 06-options-game, W 02c | "LANGUE: Français" has no space before the colon | probably fixed: `LANGUAGE: *` = "LANGUE : {0}". Check on the next screenshots | none |
| W 02a/02b/02c/02d | options show NON / VOIR LES OBJETS / AFFICHER DÉGÂTS / Grondement (older dictionary) | fixed (DÉSACTIVÉ, AFFICHER LES OBJETS/DÉGÂTS, Vibration, same as desktop) | none |
| D 14-loot-filter, W 10d | "OBJETS MAGIQUE", "OBJETS RARE" (no plural agreement) | still open | `MAGIC ITEMS` → OBJETS MAGIQUES, `RARE ITEMS` → OBJETS RARES |
| W 10d | CHARMES = "Dépôt" (older dictionary) | fixed ("Conserver", same as D 14) | none |
| D 14, W 10d | loot-filter hint sits over Vie/Mana | known | none |
| D 20/22/32/63, W 06-amazon/06-sorceress-character | female classes show "SURVIVANT" | not a dictionary problem: the character screen calls `fit('Survivor')` directly. `title:Survivor:f` = "Survivante" already exists; launcher and web each need a rule (same as the ru/pl report) | rule |
| D 21/23/27/29/31/33/61/64, W 06-* | skill-tree tab names cut off ("Compétences de javel…", "…aîtrises de combat", "Métamorph…") | known (tab width) | none |
| D 25-necromancer-skilltree, W 06-necromancer-skills | tab shows "Invocation / Sorts": word-by-word fallback, wrong word order. `Summoning Spells` has no key (`Poison and Bone Spells` does) | still open | add `Summoning Spells` → "Sorts\nd’invocation" (the key format is a guess based on the poison/bone key. If the game key has a `\n`, use that form) |
| D 27-paladin-skilltree | "Évolue de Expiation avec Fanatisme": no elision. Still happens now for vowel-initial skills ("Évolue de Inferno", "de Explosion arctique") | still open | `Evolves from * with *` → "Évolue depuis {0} avec {1}", `Evolves from *:` → "Évolue depuis {0} :" |
| D 21b/27/29/33 tooltips, D/W HUD | "Dégâts de Feu: 55", "Raclée: +4%", "Vie: 100 / 100": no space before ":" | not a dictionary problem (the code adds ": " to translated labels). Minor | optional rule |
| D 40/41 (rank), D 42/43/44, W 07a/07b/08a (buy) | Charsi hint "…ez sur une marchandise pour l’acheter" cut at the left. The rank hint also touches the left edge. DESKTOP-REPORT fr item, WEB-FINDINGS 9 | still open (text unchanged) | `Click a ware to buy it` → "Cliquez pour acheter", `Click a rank to buy it` → "Cliquez pour acheter un rang" |
| W 07a–08a | Charsi top tab "Compétences" overflows its tab (WEB-FINDINGS 9) | still open. `Skills` is used in many places, so it is not shortened here | layout (web) |
| W 07a/07c/07d | web stash = "Cache", search = "Rechercher dans le coffre" (older dictionary) | fixed (`Stash` = Réserve, `Search the stash` = Rechercher dans la réserve) | none |
| D 47-stash, W 07d | three tabs all read "Partagé" and look the same | same keys (`Shared`) as English, so not a fr problem (pl reported the same thing) | none |
| D 48-mercenaries | mercenary list cut at the right edge | known | none |
| D 50-leaderboard | "Nécromancien" class button text is shrunk to a tiny font but still readable (crop) | minor | none |
| D 64-levelup-1/2 | card list gets a scrollbar. The FCR passive line "+10% de vitesse de sort très rapide : vos compétences se rechargent actuellement 11% plus vite" is very long | still open | shorter FCR lines (4 keys: `+#% Faster Cast Rate: …` and `*: skills recharge…` / `*: nothing for you now…`) |
| D 70-death, W 11-death | "Prtg." (column for share of damage) is an odd abbreviation that reads like "partager" | still open (`Share` = "Prtg.", only used here) | `Share` → Part |
| W 11-death | "Tué par Rat-épic: 5 physical damage" (WEB-FINDINGS 3) | fixed: `Slain by *: * physical damage` → "Tué(e) par Rat-épic : 5 pts de dégâts physiques" (translator, matches D 70) | none |
| W 11-death | bottom hint "Entrée : rejouer - T : marchandises de Charsi - Échap : Camp des Rogues" runs into "Mana: 41 / 41" (crop). It fits on desktop, but only just | still open | 6 `Enter: … T: Charsi's wares …` keys → "T : Charsi", "fin de partie" (about 25% shorter) |
| W 10c-pause | "L’Acte I n’est pas sauvegardé…" pushes the disclaimer down onto the Vie/Mana labels | layout (web), probably in every language | layout |
| W 03-saves, W 10a-hud | "1 pièces d’or", "1 victimes": plural used with 1 | dictionary has no plural forms (`# gold`, `# kills`). Minor | none (would need a plural rule) |
| W 04a-news-top | date "27 Octobre" vs desktop "27 octobre" | launcher/web date formatting, not the dictionary | rule (web: lowercase month) |
| D 61/64, W 06-* | "Frappe du Tigre" vs "Frappe du phénix", "Trait de Feu", "Griffes du Tonnerre", "T. de foudre", "+10% à la Marche/Course" | these are D2R official strings (d2r-auto), so they are kept | none |
| W 01-main-menu | backup banner "Gardez une copie de votre sauvegarde : …" fills almost the whole width over the logo | fits. Watch it | none |

## All-language items from DESKTOP-REPORT / WEB-REPORT
- `# physical damage` on the death screen: fr is fine (`Slain by *: * physical damage` exists)
- "Select" / "Pause" untranslated (pl): fr has `Select` = "Sélect.", `Pause` = "Pause" (the French word is the same)
- Level-up card ", " separators: fine for French
- Female "Survivor": affects fr as well (see table). The rule should use `title:Survivor:f`
- Mercenary list: known
