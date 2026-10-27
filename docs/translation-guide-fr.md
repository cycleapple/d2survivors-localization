# Guide de traduction (D2 Survivors, français)

Public visé : joueurs francophones qui connaissent *Diablo II: Resurrected* en français. La terminologie suit **D2R officiel en français** ; le texte doit sonner comme un écran de jeu : naturel, concis, sans calque de l’anglais.

`ref` dans l’entrée est la traduction en chinois traditionnel, uniquement pour comprendre le sens en jeu. Le texte anglais fait foi.

## Format des fichiers

- Entrée : `work/todo-fr/batch-XX.json`, chaque élément `{ key, ko, ref, hints }`
  - `key` : texte anglais original. C’est la clé du dictionnaire, **ne pas la modifier**
  - `ko` : traduction coréenne du jeu (ordre des espaces réservés, usage)
  - `ref` : chinois traditionnel (si présent), pour le sens seulement
  - `hints` : traductions officielles D2R des mots de la phrase (`[anglais, français]`), trouvées par correspondance de texte, donc parfois hors contexte
- Sortie : `dict/fr/manual/ui-NN.json` (nom indiqué dans la consigne). Un objet JSON `{ "clé anglaise": "traduction", … }` avec **toutes** les entrées. UTF-8

## Espaces réservés (le plus important)

- `*` dans la clé est du texte (le jeu le traduit d’abord puis l’insère), `#` est un nombre
- Dans la traduction, `{0}`, `{1}`… désignent le 1er, 2e… `*` ou `#` de la clé (dans l’ordre, `*` et `#` comptés ensemble)
- **Les espaces réservés doivent être exactement ceux de `ko`** (chaque numéro une fois). L’ordre peut suivre la syntaxe française
- `+`, `%`, `×`, `/` à côté des espaces réservés restent : `+#% gold` → `+{0}% d’or` (D2R écrit `+%d%%` sans espace avant `%`)
- **`*` contient souvent déjà « nombre + nom »** (`1 bolt` devient d’abord « 1 projectile »). Ne pas répéter le nom dans la phrase
- Pas de `{0}` dans une clé sans `*`/`#`. Les retours à la ligne (`\n`) de la clé sont conservés

## Typographie (comme D2R)

- **« Libellé : valeur »** avec espace avant les deux-points, comme D2R : `Niveau requis : {0}`, `Découverte d’objets magiques : +{0}%`
- Apostrophe typographique `’` comme D2R (d’or, l’esprit)
- **Pas de `œ`/`Œ`** : la police bitmap du jeu ne les a pas (ils s’affichent « ? »). Écrire `oe` : coeur, oeil, manoeuvre. Les autres accents (é è ê à â ç ù û ô î ï ë) fonctionnent. Guillemets : « » s’affichent mal dans la police du jeu, utiliser des guillemets droits "…"
- Clés en MAJUSCULES (`NEW RUN`, `MAIN MENU`) : boutons ou titres, en MAJUSCULES et **courts** (`OPTIONS`, `QUITTER`). Le français est plus long que l’anglais et les boutons sont étroits : préférer un mot plus court à une traduction littérale. Les majuscules accentuées sont possibles (`É`, `À`)
- Séparateurs ` · `, ` / `, ` - ` comme dans l’original (le jeu coupe là et traduit chaque partie)
- Compétences, objets, monstres : noms officiels D2R. Vérifier avec `hints` ou `node tools/lookup.mjs data/d2r-strings "Nom" --lang fr`
- Noms propres, touches, marques inchangés : Discord, Steam, Battle.net, Entrée/Échap si D2R les traduit, sinon Enter, Esc, Tab, A/B/X/Y, LB, RT, DPS
- Titres : *Diablo II*, *Diablo II: Resurrected*, *Lord of Destruction* (non traduits)
- Adresse au joueur : tournures impersonnelles de préférence ; sinon **vous**, comme D2R
- Abréviations D2R permises si la place manque (`Résist. au feu`, `Journ. de quêtes`)

## Fragments, mots isolés, noms d’objets rares

- Certaines clés sont des fragments assemblés à l’exécution (`, after this difficulty's #`, `spirals`). Vérifier l’usage avec `ko`/`ref` et traduire pour que l’ensemble se lise bien
- Un mot anglais isolé sans préfixe (`Chain`, `Orb`) sert à la traduction mot à mot quand une phrase entière manque : le traduire comme un nom/verbe ordinaire, pas sous la forme des noms rares (« de la bête »)
- Deux mots avec majuscule (`Beast Glare`) sont en général des noms d’objets rares : en français l’ordre est **partie arrière puis partie avant** (`%1 %0` de D2R) : Beast Edge → **Tranchant de la bête**, Bone Bite → **Morsure en os** (exemples dans `hints`). Même mot anglais → même traduction partout. Si la partie avant est un adjectif, l’accorder avec le nom

## Genre et nombre (noms d’objets)

Le jeu compose les objets magiques à l’exécution : **objet + préfixe + suffixe** (`%1 %0 %2` de D2R), p. ex. « Coiffe solide de l’esprit ». Le préfixe (adjectif) s’accorde avec l’objet :

- Les clés `affix:<préfixe>` qui sont des adjectifs ont **les quatre formes** au format D2R : `[ms]solide[fs]solide[mp]solides[fp]solides` (ms masculin singulier, fs féminin singulier, mp masculin pluriel, fp féminin pluriel)
- `affix:<suffixe>` (« of the Mind ») est un complément sans formes : `de l’esprit`
- Les noms d’objets (types de base) n’ont pas de marque (`Coiffe`) ; leur genre est dans des clés `gender:<objet>` générées par l’outil depuis D2R
- Jamais de marques `[..]` dans les phrases normales

## Termes principaux (D2R officiel)

| Anglais | Français | Anglais | Français |
|---|---|---|---|
| Magic Find | découverte d’objets magiques | Gold Find | découverte d’or |
| Attack Rating | score d’attaque | Defense | défense |
| Faster Cast Rate | vitesse de sort très rapide | Faster Run/Walk | marche/course |
| Faster Hit Recovery | récupération très rapide après un coup | Faster Block Rate | vitesse de blocage très rapide |
| Increased Attack Speed | vitesse d’attaque | Enhanced Damage | dégâts supplémentaires |
| Damage Reduced by | dégâts réduits de | Crushing Blow | coup écrasant |
| Deadly Strike | coup mortel | Open Wounds | blessures ouvertes |
| All Resistances | toutes les résistances | Resist Fire | résistance au feu |
| Fire/Cold/Lightning/Poison | feu/froid/foudre/poison | Experience | expérience |
| Level / Required Level | niveau / niveau requis | Requirements | conditions requises |
| Strength/Dexterity/Vitality/Energy | Force/Dextérité/Vitalité/Énergie | Life/Mana | Vie/Mana |
| Skill / Skill Tree | compétence / arbre des compétences | Passive | passif |
| Knockback | renversement | Pierce | percer |
| Gold | or | Gamble | parier |
| Imbue | imprégner | Stash | réserve (D2R : "Votre réserve est pleine") |
| Chest (coffre au trésor) | coffre (D2R : Coffre) | Chill / chilled | ralentir / ralenti, ralentissement (D2R : le froid ralentit) |
| Inventory | inventaire | Mercenary | mercenaire |
| Waypoint | relais | Shrine | sanctuaire |
| Potion | potion | Belt | ceinture |
| Small/Large/Grand Charm | charme mineur/grand charme/charme majeur | Rune/Gem/Jewel | rune/gemme/joyau |
| Durability | durabilité | Normal/Magic/Rare | normal/magique/rare |
| Set/Unique | d’ensemble/unique | Superior/Ethereal/Socketed | supérieur/éthéré/serti |
| Elite | élite | Champion (monstre) | champion |
| Minion | serviteur | Difficulty | difficulté |
| Normal/Nightmare/Hell | Normal/Cauchemar/Enfer | Act 1–5 | Acte I–V |
| Quest Log | journal de quêtes | Automap | carte auto. |

Noms D2R : Akara, Charsi, Gheed, Kashya, Deckard Cain, Andariel, Duriel, Méphisto, Diablo, Baal ; le Camp des Rogues, la Lande sanglante. Classes : Amazone, Sorcière, Nécromancien, Paladin, Barbare, Druide, Assassin.

## Termes propres à ce jeu (absents de D2R)

| Anglais | Français | Anglais | Français |
|---|---|---|---|
| Skill Modifier / Modifier | variante de compétence / variante | Skill Modifier Point | point de variante |
| draft (choix de cartes au niveau) | choix | re-draft | nouveau choix |
| Reroll / Skip / Banish | relancer / passer / bannir | card | carte |
| rest (mettre une compétence en pause) / Rested | mettre en repos / au repos | take it up again | reprendre |
| legit / not legit | réglementaire / non réglementaire | ranked | classé |
| rank (améliorations de Charsi) | rang | Terror tier # | Terreur, palier {0} |
| run (une partie) | partie | camp | camp |
| kept hero / keep | héros conservé / conserver | hero | héros (masculin : il, le faire revenir) |
| Evolve / Evolves into | évolution / évolue en | act boss | boss d’acte |
| Tome / Book | tome / livre de compétences | Charms window | fenêtre des charmes |
| hover box | infobulle | loot filter | filtre de butin |
| IN MY COLLECTION | DANS MA COLLECTION | KEEP / HIDE / SELL / PICK UP | Conserver / Masquer / Vendre / Ramasser |
| Uniques tab: Kept / Missing | Collectés / Manquants | SHOW DAMAGE / SHOW ITEMS | AFFICHER LES DÉGÂTS / AFFICHER LES OBJETS |
| desktop app | application de bureau | website | site web |
| Level Up | niveau supérieur | Kills | victimes |
| SAVES | SAUVEGARDES | REPORT | SIGNALER |
| AUTO STATS | STATS AUTO | build | build |

## Textes longs (notes de version, descriptions)

- Surtout des notes de version, une modification par ligne. Concis, présent ou passé composé, impersonnel : « Éclair inflige désormais 10% de dégâts en plus », « … ne … plus … », « Correction : … »
- L’ordre peut changer, mais aucune information ne doit manquer : nombres, pourcentages, noms de compétences
- Descriptions de compétences et textes d’interface courts dans le style des descriptions D2R
- Noms de boutons et d’options dans le texte identiques à l’interface déjà traduite

Termes officiels : `node tools/lookup.mjs data/d2r-strings "expression" --lang fr`.
