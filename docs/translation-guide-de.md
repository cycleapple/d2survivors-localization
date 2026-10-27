# Übersetzungsleitfaden (D2 Survivors, Deutsch)

Zielgruppe sind deutschsprachige Spieler, die *Diablo II: Resurrected* auf Deutsch kennen. Begriffe richten sich nach dem **offiziellen deutschen D2R**; der Text soll wie ein Spielbildschirm klingen: natürlich, knapp, ohne Übersetzungsdeutsch.

`ref` in der Eingabe ist die traditionell-chinesische Übersetzung und dient nur dazu, die Bedeutung im Spiel zu verstehen. Maßgeblich ist das englische Original.

## Dateiformat

- Eingabe: `work/todo-de/batch-XX.json`, jeder Eintrag `{ key, ko, ref, hints }`
  - `key`: englischer Originaltext. Er ist der Schlüssel im Wörterbuch und wird **nicht verändert**
  - `ko`: koreanische Übersetzung des Spiels (Platzhalterreihenfolge, Verwendung)
  - `ref`: traditionelles Chinesisch (falls vorhanden), nur zur Bedeutung
  - `hints`: offizielle D2R-Übersetzungen von Wörtern im Satz (`[englisch, deutsch]`), per Textvergleich gefunden, also nicht immer passend
- Ausgabe: `dict/de/manual/ui-NN.json` (Dateiname steht im Auftrag). Ein JSON-Objekt `{ "englischer key": "deutsche Übersetzung", … }` mit **allen** Einträgen der Eingabe. UTF-8

## Platzhalter (am wichtigsten)

- `*` im key ist Text (das Spiel übersetzt ihn vorher und setzt ihn ein), `#` ist eine Zahl
- In der Übersetzung steht `{0}`, `{1}` … für das erste, zweite … `*` oder `#` im key (in Reihenfolge, `*` und `#` zusammen gezählt)
- **Die Platzhalter müssen genau dieselben sein wie in `ko`** (jede Nummer einmal). Die Reihenfolge darf sich nach der deutschen Satzstellung richten
- `+`, `%`, `×`, `/` neben Platzhaltern bleiben stehen: `+#% gold` → `+{0} % Gold` ist falsch, richtig ist `+{0}% Gold` (D2R schreibt `%+d%% erhöhter Schaden` ohne Leerzeichen vor `%`)
- **In `*` steht oft schon „Zahl + Nomen“** (`1 bolt` wird vorher zu „1 Geschoss“ übersetzt). Im Satz kein zweites Nomen dazuschreiben
- Keys ohne `*`/`#` bekommen kein `{0}`. Zeilenumbrüche (`\n`) im key bleiben erhalten

## Schreibweise (wie D2R Deutsch)

- **„Bezeichnung: Wert“** mit Doppelpunkt und Leerzeichen: `Benötigte Stufe: {0}`, `Magiefundbonus: +{0}%`
- Keys in GROSSBUCHSTABEN (`NEW RUN`, `MAIN MENU`) sind Schaltflächen oder Überschriften: auch auf Deutsch in Großbuchstaben und **kurz** (`OPTIONEN`, `VERLASSEN`). Deutsch ist länger als Englisch, die Schaltflächen sind schmal: lieber ein kürzeres Wort als eine wörtliche Übersetzung
- Trennzeichen wie ` · `, ` / `, ` - ` bleiben wie im Original (das Spiel trennt dort und übersetzt die Teile einzeln)
- Fertigkeiten, Gegenstände, Monster: offizielle D2R-Namen. Nachschlagen mit `hints` oder `node tools/lookup.mjs data/d2r-strings "Name" --lang de`
- Eigennamen, Tasten, Marken bleiben: Discord, Steam, Battle.net, Enter, Esc, Tab, A/B/X/Y, LB, RT, DPS
- Spielnamen: *Diablo II*, *Diablo II: Resurrected*, *Lord of Destruction* (nicht übersetzen)
- Anrede: möglichst unpersönlich. Wenn der Spieler direkt angesprochen werden muss, **du** (klein)
- Abkürzungen wie in D2R sind erlaubt, wenn der Platz knapp ist (`Geschick.`, `Wid. gegen Feuer`)

## Bruchstücke, Einzelwörter, Namen seltener Gegenstände

- Manche keys sind Bruchstücke, die zur Laufzeit zusammengesetzt werden (`, after this difficulty's #`, `spirals`). Mit `ko`/`ref` prüfen, wie sie verwendet werden, und so übersetzen, dass das Ganze lesbar ist
- Ein einzelnes englisches Wort ohne Präfix (`Chain`, `Orb`) wird für die Wort-für-Wort-Übersetzung benutzt, wenn ein ganzer Satz fehlt: als normales Nomen/Verb übersetzen, nicht in der Form für seltene Namen („Bestien -“)
- Zwei großgeschriebene Wörter (`Beast Glare`) sind meist Namen seltener Gegenstände: vorderer Teil wie in D2R ohne „ -“, dann Bindestrich, dann der hintere Teil: Beast Edge → **Bestien-Schneide**, Doom Blow → **Verdammnis-Schlag** (Beispiele in `hints`). Gleiches englisches Wort → überall dieselbe Übersetzung

## Wortarten und Geschlecht (Gegenstandsnamen)

Magische Gegenstände setzt das Spiel zur Laufzeit zusammen: **Präfix + Gegenstand + Suffix**, z. B. „robuste Kappe des Geistes“. Das Präfix (Adjektiv) richtet sich nach dem Geschlecht des Gegenstands. Deshalb:

- `affix:<Präfix>`-Keys, die ein Adjektiv sind, bekommen **alle vier Formen** im D2R-Format: `[fs]robuste[ms]robuster[ns]robustes[pl]robuste` (fs = feminin, ms = maskulin, ns = neutrum, pl = Plural; Kasus Nominativ, ohne Artikel)
- `affix:<Suffix>` („of the Mind“) ist eine Genitivgruppe ohne Formen: `des Geistes`
- Gegenstandsnamen (Basistypen) bleiben ohne Markierung (`Kappe`); ihr Geschlecht steht in eigenen Keys `gender:<Gegenstand>` (das Werkzeug erzeugt sie aus D2R)
- In normalen Sätzen gibt es keine Markierungen `[..]`

## Wichtige Begriffe (offizielles D2R Deutsch)

| Englisch | Deutsch | Englisch | Deutsch |
|---|---|---|---|
| Magic Find | Magiefundbonus | Gold Find | Goldfundbonus |
| Attack Rating | Angriffswert | Defense | Verteidigung |
| Faster Cast Rate | schnellere Zauberrate | Faster Run/Walk | Bewegungsgeschwindigkeit |
| Faster Hit Recovery | schnellere Erholung nach Treffer | Faster Block Rate | schnellere Blockrate |
| Increased Attack Speed | erhöhte Angriffsgeschwindigkeit | Enhanced Damage | erhöhter Schaden |
| Damage Reduced by | Schaden reduziert um | Crushing Blow | Niederstrecken |
| Deadly Strike | Todesschlag | Open Wounds | offene Wunden |
| Life/Mana stolen per hit | abgesaugtes Leben/Mana pro Treffer | All Resistances | alle Widerstände |
| Fire/Cold/Lightning/Poison | Feuer/Kälte/Blitz/Gift | Resist Fire | Widerstand gegen Feuer |
| Experience | Erfahrung | Level | Stufe |
| Required Level | Benötigte Stufe | Requirements | Anforderungen |
| Strength/Dexterity/Vitality/Energy | Stärke/Geschicklichkeit/Vitalität/Energie | Life/Mana | Leben/Mana |
| Skill | Fertigkeit | Skill Tree | Fertigkeitsbaum |
| Passive | Passiv | Aura/Curse | Aura/Fluch |
| Knockback | Rückstoß | Pierce | Durchbohren |
| Gold | Gold | Sell/Buy/Repair | Verkaufen/Kaufen/Reparieren |
| Gamble | Glücksspiel | Imbue | Verzaubern |
| Stash | Schatz | Inventory | Inventar |
| Mercenary | Söldner | Waypoint | Wegpunkt |
| Shrine | Schrein | Potion | Trank |
| Belt | Gürtel | Small/Large/Grand Charm | Kleiner/Großer Zauber, Riesenzauber |
| Rune/Gem/Jewel | Rune/Edelstein/Juwel | Durability | Haltbarkeit |
| Normal/Magic/Rare | Normal/Magisch/Selten | Set/Unique | Set/Einzigartig |
| Superior/Ethereal/Socketed | Hochwertig/Ätherisch/Gesockelt | Elite | Elite |
| Champion (Monster) | Champion | Unique monster | einzigartiges Monster |
| Minion | Diener | Difficulty | Schwierigkeitsgrad |
| Normal/Nightmare/Hell | Normal/Alptraum/Hölle | Act 1–5 | Akt 1–5 |
| Quest Log | Questlog | Automap | Autom. Karte |

Namen wie in D2R Deutsch: Akara, Charsi, Gheed, Kaschya, Deckard Cain, Andariel, Duriel, Mephisto, Diablo, Baal; Lager der Jägerinnen, Blutmoor, Höhle des Bösen. Klassen: Amazone, Zauberin, Totenbeschwörer, Paladin, Barbar, Druide, Assassine.

## Begriffe dieses Spiels (gibt es in D2R nicht)

| Englisch | Deutsch | Englisch | Deutsch |
|---|---|---|---|
| Skill Modifier / Modifier | Fertigkeitsvariante / Variante | Skill Modifier Point | Variantenpunkt |
| draft (Kartenwahl beim Stufenaufstieg) | Auswahl | re-draft | neu wählen |
| Reroll / Skip / Banish | Neu würfeln / Überspringen / Ausschließen | card | Karte |
| rest (Fertigkeit pausieren) / Rested | ruhen lassen / ruht | take it up again | wieder aufnehmen |
| legit / not legit | regulär / nicht regulär | ranked | gewertet |
| rank (Charsis Verbesserungen) | Rang | Terror tier # | Schrecken Stufe {0} |
| run (ein Durchgang) | Durchgang | camp | Lager |
| kept hero / keep | aufbewahrter Held / aufbewahren | hero | Held |
| Evolve / Evolves into | Entwicklung / entwickelt sich zu | act boss | Aktboss |
| Tome / Book | Foliant / Fertigkeitenbuch | Charms window | Zauberfenster |
| hover box | Tooltip | loot filter | Beutefilter |
| IN MY COLLECTION | IN MEINER SAMMLUNG | KEEP / HIDE / SELL / PICK UP | Aufbewahren / Ausblenden / Verkaufen / Aufheben |
| desktop app | Desktop-App | website | Website |
| Level Up | Stufenaufstieg | Kills | Tötungen |
| SAVES | SPIELSTÄNDE | REPORT | MELDEN |
| AUTO STATS | AUTO-ATTRIBUTE | build | Build |

## Lange Texte (Änderungsprotokoll, Fertigkeitsbeschreibungen)

- Meist Änderungsprotokoll, eine Änderung pro Zeile. Kurz, Präsens oder Perfekt, ohne Anrede: „Blitzschlag verursacht jetzt 10 % mehr Schaden“, „… wird nicht mehr …“, „Behoben: …“
- Satzstellung darf sich ändern, aber keine Information fehlen lassen: Zahlen, Prozente, Fertigkeitsnamen bleiben alle erhalten
- Fertigkeitsbeschreibungen und kurze UI-Texte im Stil der D2R-Beschreibungen
- Schaltflächen- und Optionsnamen im Text genauso wie in der bereits übersetzten Oberfläche

Offizielle Begriffe nachschlagen: `node tools/lookup.mjs data/d2r-strings "Ausdruck" --lang de`.
