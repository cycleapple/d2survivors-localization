# Przewodnik tłumaczenia (D2 Survivors, polski)

Odbiorcy to polscy gracze, którzy znają polską wersję *Diablo II: Resurrected*. Terminologia zgodnie z **oficjalnym polskim D2R**; tekst ma brzmieć jak ekran gry: naturalnie, zwięźle, bez kalek z angielskiego.

`ref` w danych wejściowych to przekład na chiński tradycyjny, tylko do zrozumienia sensu w grze. Podstawą jest angielski oryginał.

## Format plików

- Wejście: `work/todo-pl/batch-XX.json`, każdy element `{ key, ko, ref, hints }`
  - `key` — angielski oryginał. To klucz słownika, **nie zmieniać**
  - `ko` — koreański przekład gry (kolejność wstawek, użycie)
  - `ref` — chiński tradycyjny (jeśli jest), tylko dla sensu
  - `hints` — oficjalne tłumaczenia D2R słów z frazy (`[angielski, polski]`), znalezione przez dopasowanie tekstu, więc czasem nie pasują
- Wyjście: `dict/pl/manual/ui-NN.json` (nazwa w poleceniu). Jeden obiekt JSON `{ "angielski klucz": "tłumaczenie", … }` ze **wszystkimi** elementami. UTF-8

## Wstawki (najważniejsze)

- `*` w kluczu to tekst (gra najpierw go tłumaczy, potem wstawia), `#` to liczba
- W tłumaczeniu `{0}`, `{1}`… to pierwsza, druga… `*` lub `#` klucza (po kolei, `*` i `#` liczone razem)
- **Wstawki muszą być dokładnie takie jak w `ko`** (każdy numer raz). Kolejność można zmienić pod polską składnię
- `+`, `%`, `×`, `/` przy wstawkach zostają: `+#% gold` → `+{0}% złota` (D2R: `%+d%% do obrażeń`)
- **W `*` często jest już „liczba + rzeczownik”** (`1 bolt` najpierw tłumaczy się na „1 pocisk”). Nie powtarzać rzeczownika w zdaniu
- **Liczby i przypadki:** gra nie odmienia rzeczowników według liczby („1 punkt / 2 punkty / 5 punktów”). Budować zdania tak, żeby forma nie zależała od liczby: `Punkty: {0}`, `{0} pkt.`, `poziom {0}`, `{0} s` — jak D2R (`Zmniejsza otrzymywane obrażenia o %d pkt.`)
- W kluczu bez `*`/`#` nie wstawiać `{0}`. Znaki nowej linii (`\n`) zachować

## Zapis (jak w D2R)

- **„Nazwa: wartość”** — dwukropek i spacja: `Wymagany poziom: {0}`, `Magiczne przedmioty: +{0}%`
- Polskie litery (ą ć ę ł ń ó ś ź ż) pisać normalnie
- Klucze WIELKIMI LITERAMI (`NEW RUN`, `MAIN MENU`) to przyciski i nagłówki: też WIELKIMI LITERAMI i **krótko** (`OPCJE`, `WYJŚCIE`). Polski jest dłuższy od angielskiego, a przyciski są wąskie: lepiej krótkie słowo niż dosłowne tłumaczenie
- Separatory ` · `, ` / `, ` - ` jak w oryginale (gra dzieli w tych miejscach i tłumaczy części osobno)
- Umiejętności, przedmioty, potwory — oficjalne nazwy D2R. Sprawdzać w `hints` albo `node tools/lookup.mjs data/d2r-strings "nazwa" --lang pl`
- Nazwy własne, klawisze, marki bez zmian: Discord, Steam, Battle.net, Enter, Esc, Tab, A/B/X/Y, LB, RT, DPS
- Tytuły gier: *Diablo II*, *Diablo II: Resurrected*, *Lord of Destruction* (bez tłumaczenia)
- Zwracanie się do gracza: najlepiej bezosobowo; jeśli trzeba — na **ty**, jak D2R („Wróć do Kashyi po nagrodę.”)
- Skróty D2R dozwolone, gdy brakuje miejsca (`Odprn. na Ogień`, `Klejn.`)

## Fragmenty, pojedyncze słowa, nazwy rzadkich przedmiotów

- Niektóre klucze to fragmenty składane w trakcie gry (`, after this difficulty's #`, `spirals`). Sprawdzić użycie w `ko`/`ref` i tłumaczyć tak, żeby całość się czytała
- Pojedyncze angielskie słowo bez przedrostka (`Chain`, `Orb`) służy do tłumaczenia słowo po słowie, gdy brak całej frazy: tłumaczyć jako zwykły rzeczownik/czasownik
- Dwa słowa z wielkiej litery (`Beast Glare`) to zwykle nazwy rzadkich przedmiotów: **przymiotnik + rzeczownik**, przymiotnik zgodny z rodzajem rzeczownika, obie części wielką literą jak w D2R: Beast Edge → **Bestialskie Ostrze**, Bone Bite → **Kościane Ukąszenie** (przykłady w `hints`). To samo angielskie słowo — wszędzie to samo tłumaczenie

## Rodzaj (nazwy przedmiotów)

Przedmioty magiczne gra składa w trakcie gry: **przedrostek + przedmiot + przyrostek** (D2R: `%0 %1 %2`), np. „Masywny Kaptur Umysłu”. Przedrostek (przymiotnik) zgadza się z przedmiotem:

- Klucze `affix:<przedrostek>` będące przymiotnikami mają **wszystkie formy** w formacie D2R: `[ms]Masywny[fs]Masywna[nl]Masywne` (ms — męski, fs — żeński, nl — nijaki, także liczba mnoga)
- `affix:<przyrostek>` („of the Mind”) — dopełniacz bez form: `Umysłu`
- Nazwy przedmiotów (typy podstawowe) bez znaczników (`Kaptur`); ich rodzaj jest w osobnych kluczach `gender:<przedmiot>`, które narzędzie bierze z D2R
- W zwykłych zdaniach nie ma znaczników `[..]`

## Główne terminy (oficjalne D2R)

| Angielski | Polski | Angielski | Polski |
|---|---|---|---|
| Magic Find | magiczne przedmioty | Gold Find | złoto |
| Attack Rating | skuteczność ataku | Defense | obrona |
| Faster Cast Rate | szybkość rzucania czarów | Faster Run/Walk | szybkość poruszania się |
| Faster Hit Recovery | szybkość odzyskiwania równowagi | Faster Block Rate | szybkość blokowania |
| Increased Attack Speed | szybkość ataku | Enhanced Damage | do obrażeń |
| Damage Reduced by | zmniejsza otrzymywane obrażenia o | Crushing Blow | druzgocące uderzenie |
| Deadly Strike | zabójcze uderzenie | Open Wounds | otwarcie rany |
| All Resistances | wszystkie odporności | Resist Fire | odporność na ogień |
| Fire/Cold/Lightning/Poison | ogień/zimno/błyskawice/trucizna | Experience | doświadczenie (PD) |
| Level / Required Level | poziom / wymagany poziom | Requirements | wymagania |
| Strength/Dexterity/Vitality/Energy | siła/zręczność/żywotność/energia | Life/Mana | zdrowie/mana |
| Skill / Skill Tree | umiejętność / umiejętności | Passive | pasywne |
| Knockback | odrzucanie | Pierce | przebijanie |
| Gold | złoto | Gamble | hazard |
| Imbue | nasycenie | Stash | skrytka |
| Inventory | ekwipunek | Mercenary | najemnik |
| Waypoint | punkt nawigacyjny | Shrine | kapliczka |
| Potion | mikstura | Belt | pas |
| Small/Large/Grand Charm | Mniejszy/Duży/Wielki Talizman | Rune/Gem/Jewel | runa/klejnot/klejnot |
| Durability | trwałość | Normal/Magic/Rare | zwykłe/magiczne/rzadkie |
| Set/Unique | zestawy/unikatowe | Superior/Ethereal/Socketed | dobrej jakości/eteryczne/z gniazdem |
| Elite | elitarny | Champion (potwór) | czempion |
| Minion | sługa | Difficulty | poziom trudności |
| Normal/Nightmare/Hell | Normalny/Koszmar/Piekło | Act 1–5 | Akt I–V |
| Quest Log | zadania | Automap | automapa |

Nazwy D2R: Akara, Charsi, Gheed, Kashya, Deckard Cain, Andariel, Duriel, Mefisto, Diablo, Baal; Obozowisko Łotrzyc, Krwawe Wrzosowisko. Klasy: Amazonka, Czarodziejka, Nekromanta, Paladyn, Barbarzyńca, Druid, Zabójczyni.

## Terminy tej gry (nie ma ich w D2R)

| Angielski | Polski | Angielski | Polski |
|---|---|---|---|
| Skill Modifier / Modifier | modyfikator umiejętności / modyfikator | Skill Modifier Point | punkt modyfikatora |
| draft (wybór kart przy awansie) | wybór | re-draft | ponowny wybór |
| Reroll / Skip / Banish | losuj ponownie / pomiń / wyklucz | card | karta |
| rest (wstrzymać umiejętność) / Rested | odłożyć / odłożona | take it up again | przywróć |
| legit / not legit | uczciwy / nieuczciwy | ranked | rankingowy |
| rank (ulepszenia Charsi) | ranga | Terror tier # | Groza, stopień {0} |
| run (jedno podejście) | podejście | camp | obóz |
| kept hero / keep | zachowany bohater / zachowaj | hero | bohater |
| Evolve / Evolves into | rozwój / rozwija się w | act boss | boss aktu |
| Tome / Book | księga / księga umiejętności | Charms window | okno talizmanów |
| hover box | podpowiedź | loot filter | filtr łupów |
| IN MY COLLECTION | W KOLEKCJI | KEEP / HIDE / SELL / PICK UP | Zachowaj / Ukryj / Sprzedaj / Podnieś |
| desktop app | aplikacja na komputer | website | strona |
| Level Up | awans | Kills | zabójstwa |
| SAVES | ZAPISY | REPORT | ZGŁOŚ |
| AUTO STATS | AUTO-ATRYBUTY | build | build |

## Długie teksty (lista zmian, opisy)

- Głównie lista zmian, jedna zmiana w wierszu. Krótko, bezosobowo: „Błyskawica zadaje teraz o 10% więcej obrażeń”, „… już nie …”, „Poprawiono: …”
- Szyk można zmieniać, ale nie gubić informacji: liczby, procenty, nazwy umiejętności zachować
- Opisy umiejętności i krótkie teksty interfejsu w stylu opisów D2R
- Nazwy przycisków i opcji w tekście tak samo jak w przetłumaczonym interfejsie

Oficjalne terminy: `node tools/lookup.mjs data/d2r-strings "wyrażenie" --lang pl`.
