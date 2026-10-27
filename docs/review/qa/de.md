# German (de) screenshot review

I read every contact sheet once: desktop sheets 01–13 (50 shots) and web sheets 01–11 (41 shots). I made one crop (crop-1: the Charsi controls). I checked each problem against the current `dict/de.json` and ran the runtime lines through `work/agents/qa-ru/tr.mjs`. The dictionary fixes still needed are in `fixes.json` (24 keys).

No "?" boxes or missing glyphs. Ä/Ö/Ü/ß render fine.

| file | problem | status now | fix |
|---|---|---|---|
| desktop 14-loot-filter, web 10d-loot-filter | "MAGISCH GEGENSTÄNDE", "SELTEN GEGENSTÄNDE" (adjective not inflected) | still wrong | `MAGIC ITEMS` = MAGISCHE GEGENSTÄNDE, `RARE ITEMS` = SELTENE GEGENSTÄNDE |
| web 10d-loot-filter | Charms row shows "EINZAHLEN" (desktop: AUFBEWAHREN) | fixed (no "Einzahlen" left; KEEP = AUFBEWAHREN) | – |
| desktop 14, web 10d | hint text runs over the HUD | known | – |
| desktop 70-death, web 11-death | "9 physical damage" left in English | fixed (`Slain by *: * physical damage` = "Getötet durch {0}: {1} physischer Schaden") | – |
| desktop 70-death, web 11-death | bottom controls line overlaps "Leben"/"Mana" | still long (68 chars) | both `Enter: play again - T: Charsi's wares - …` keys: "Enter: nochmal - …" |
| desktop 70-death, web 11-death | damage column header "Gtlt." is an unclear abbreviation | still "Gtlt." | `Share` = Anteil |
| web 09a-levelup, web 06-sorceress-skills | Fire Bolt: "Feuert 1 Geschoss Feuergeschosse ab" (two nouns) | fixed ("Feuert 1 Geschoss auf die nächsten Monster ab …") | – |
| web 09a, web 06-sorceress-skills | Charged Bolt: "Feuert 5 Funken Blitze ab" | fixed ("Feuert 5 Funken aus Blitzenergie ab") | – |
| desktop 61-levelup-cards, 64-levelup-2/4/5/6, web 06-* skill cards | 3rd card text too long: scrollbar, last lines cut (Feuerbombe, Drachenkralle, Heulen) | still long | shorter text for Fire Blast, Dragon Talon (both keys) and Howl |
| desktop 40–46b Charsi tabs, web 07a–08d | hint under the grid cut at the left ("…ke auf einen Rang, um ihn zu kaufen", "…auf einen Gegenstand für ein Glücksspiel", "…verkauft, das zurückgekauft werden kann") | still long (38–50 chars, the box fits ~24) | 5 keys: "Rang anklicken: kaufen", "Ware anklicken: kaufen", "Anklicken: zurückkaufen", "Anklicken: Glücksspiel", "Nichts zum Zurückkaufen" |
| desktop 40–46b, web 07a–08d | controls at bottom right run past the frame ("Esc: schließen" cut; crop-1) | still 82 chars, 6 lines, room for 4 | `Click to pick up · Right-click to equip · …` = "Klick: nehmen · Rechts: anlegen · Shift: verkaufen · Esc: zu" |
| desktop 41-charsi-upgrade-tooltip, web 07a | rank tooltip runs two lines together: "+5 Vitalität zu Beginn pro Rang +20 bis 40 maximales Leben …" | still one line | `+* starting * per rank *` = "+{0} {1} zu Beginn pro Rang\n{2}" (same as ru/pl/ja) |
| web 07a | "nicht mit einem Bogen" | changed (now "keiner mit Bogen") | – |
| desktop 47-stash, web 07d | tab "Einzigartige Gegen…" cut | still "Einzigartige Gegenstände" | `Uniques` = Einzigartig (the changelog already calls the tab "Einzigartig"); the second changelog line changed to match |
| desktop 47, web 07d | stash note behind the search box; the "Geteilt" tabs look the same | known (same in pl) | – |
| – (dictionary) | `Shared Stash` = "Geteilt Schatz" (grammar) | still wrong | Geteilter Schatz |
| web 10a-hud, 10c-pause, 12a-mobile-hud | "1 Tötungen" | still "{0} Tötungen" | `# kills` = "Tötungen: {0}" |
| desktop 05-options-graphics, web 02b | "FERTIGKEITSEFFEKTE" reaches the left screen edge (desktop starts at x=0) | still 18 chars | `SKILL EFFECTS` = EIGENE EFFEKTE (hint: "Blendet nur deine eigenen Fertigkeiten ab"); the changelog line that names the slider changed to match |
| web 01-main-menu | backup hint "Bewahre eine Kopie … als Datei" (84 chars) runs over the SURVIVORS logo | still long | "Sichere deinen Spielstand als Datei unter SPIELSTÄNDE" |
| web 10c-pause | two-line Act I hint pushes the disclaimer onto "Leben"/"Mana" | still 121 chars | "Akt 1 wird nicht gespeichert, der nächste Durchgang beginnt neu. Gegenstände und Gold bleiben." |
| web 02d-options-controller | "GROLLEN" (Rumble) vs desktop "Vibration" | fixed (RUMBLE/Rumble = Vibration) | – |
| web 08a-rare-item | "+27% Erhöht Verteidigung" | fixed (de.json overrides `Enhanced Defense` = Verbesserte Verteidigung; `+#% Enhanced Defense` → "verbesserte Verteidigung") | – |
| desktop 44-charsi-rare-tooltip, web 08a | rare base line in lower case: "beschlagenes Leder", "schwere Handschuhe" | not a dictionary problem (the dictionary has "Beschlagenes Leder"/"Schwere Handschuhe"). The lowercase rule (945f582) also hits the base-type line of rare items | launcher/web rule: lower the base only after a magic prefix on the same line |
| desktop 20/22/32-character, web 06-*-character | female classes show "Überlebender" | dictionary has `title:Survivor:f` = Überlebende; the rule is still missing | launcher/web rule (WEB-REPORT item 1) |
| desktop 50-leaderboard | "Totenbeschwö…" cut in the class filter button | same key as the class name (`Necromancer`) | rule/layout (shorter label only in that button) |
| desktop 21/23/25/27/29/31/33 skill trees, web 06-*-skills | tree tab names cut / wrapped | known | – |
| web 07a–08d | Charsi top tab "Fertigkeitsba…" cut | layout (WEB-FINDINGS 9) | – |
| desktop 48-mercenaries | list cut at the right edge ("Jägerinnenspäher - Stufe") | known; "Jägerinnenspäher" is the official D2R name | – |
| desktop 64-levelup-4, web 06-druid-skills | "0.5 Leben", "0.56 Sek.", "4.0 Sek." use a decimal point | numbers are formatted by the game | rule if wanted (decimal comma) |
| desktop 01/08, 09/10 news, web 01/04a | "NEWS" button/title in English | OK: "News" is a common loanword and NEUIGKEITEN would not fit the button | – |
| desktop 14 / web 10d | loot hint uses "…" instead of „…“ | left as is: the guide has no rule for this, and the bitmap font may not have „ | – |

Checked and fine: main menu/options buttons in caps (SPIELEN, OPTIONEN, SPIELSTÄNDE, VERLASSEN); official D2R skill names (Comboblitz, Drachenkralle/Drachenklaue, Feuerbombe/Feuerwelle, Konzentrieren, Verblassen, Erhöhte Geschwindigkeit); waypoint panel; leaderboard date "27. Okt."; magic item names "Robuster Ringpanzer", "Kettenhandschuhe der Stärke".
