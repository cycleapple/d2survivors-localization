# D2 Survivors Localization (unofficial)

**English** | [繁體中文](docs/readme/README.zh-TW.md) | [简体中文](docs/readme/README.zh-CN.md) | [日本語](docs/readme/README.ja.md) | [Deutsch](docs/readme/README.de.md) | [Français](docs/readme/README.fr.md) | [Русский](docs/readme/README.ru.md) | [Polski](docs/readme/README.pl.md)

A fan-made translation of [D2 Survivors](https://d2survivors.lol/) (Diablo 2 Survivors) into Traditional Chinese, Simplified Chinese, Japanese, German, French, Russian and Polish.

**Website:** https://cycleapple.github.io/d2survivors-localization/ · **Discord:** https://discord.gg/QMBbTHSsaK

- **Desktop (Windows):** download the [launcher](https://github.com/cycleapple/d2survivors-localization/releases/latest/download/d2s-launcher.exe), pick a language and press Play. It downloads the latest translation and applies it to the game. When the game updates itself, the launcher re-applies the translation the next time you start from it.
- **Browser (PC and mobile):** on the web version at d2survivors.lol, tap a bookmark to switch the game to your language. Tap it again to switch back to English.

It plugs into the game's own translation system (it takes over the Korean dictionary slot) instead of drawing text on top of the screen, so the UI, items, skills and tooltips are all translated. Items, skills, monsters and places use the official names from *Diablo II: Resurrected*.

## Leaderboards

- The browser version does not upload leaderboard scores while a translation is active.
- The game marks a translated desktop install as *patched*. To compete on the leaderboard, choose English in the launcher and it restores the untouched original game.

## Disclaimer

- This is an unofficial fan translation. It is not affiliated with or endorsed by Blizzard Entertainment or the author of D2 Survivors.
- Official names in the dictionaries (items, skills, monsters, places, etc.) come from *Diablo II: Resurrected* and belong to Blizzard Entertainment, Inc. Diablo is a trademark of Blizzard Entertainment, Inc.
- All other text is our own translation.
- It is free. Nothing is paywalled and no game content is sold. Donations are voluntary, support the time spent translating and maintaining, and do not unlock anything.
- This repository contains none of the game's art, audio, fonts or code.
- Rights holders who want something removed can open an issue and it will be handled right away.

## Repository layout

| Folder | Contents | Docs |
|---|---|---|
| `dict/` | Dictionaries: auto-matched official D2R names, manual translations, merged per-language dictionaries | [docs/translation.md](docs/translation.md), [style guide](docs/translation-guide.md), [term decisions](docs/term-decisions.md) |
| `tools/` | Node.js tools to extract strings, match, check, merge, package and publish | [docs/translation.md](docs/translation.md) |
| `tools/patch-rules.mjs` | How the desktop game is patched (shared by the launcher and `patch.mjs`) | [docs/desktop-patch.md](docs/desktop-patch.md) |
| `launcher/` | Desktop launcher (Rust) | [docs/launcher.md](docs/launcher.md) |
| `site/` | Website (downloads, install guide) | [docs/site.md](docs/site.md) |
| `site/web/`, `tools/web-rules.mjs` | Browser bookmarklet | [docs/web.md](docs/web.md) |
| `site/data/` | Update feed: manifest and per-language dictionaries (generated) | [docs/manifest-v2.md](docs/manifest-v2.md) |

What is open source, what stays out of the repo, and how releases work: [docs/release.md](docs/release.md). The docs under `docs/` are written in Traditional Chinese.

## Donate

If you enjoy it, you can buy me a coffee: [PayPal](https://paypal.me/DonateCYtw)

## Development

```
npm install
```

Building the dictionaries needs your own copy of D2 Survivors (desktop) and *Diablo II: Resurrected*. Game files and raw D2R string files are not in the repo (`backup/`, `versions/`, `data/`, `work/`); the tools extract them from your own install. Steps: [docs/translation.md](docs/translation.md).

## License

- Code (`tools/`, `launcher/`, the code and styles in `site/`, `.github/`): [MIT](LICENSE)
- Translation data (`dict/` and the dictionaries generated from it): **not covered by MIT**. The license is not decided yet; until then all rights are reserved. See [dict/LICENSE](dict/LICENSE)
- Official names belong to Blizzard Entertainment, Inc.; D2 Survivors belongs to its author, framara
