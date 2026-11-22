# Stav sešny A

**Vlna:** 1 · **Větev:** `sesna-a` (ze `zaklad-1`, `a2ce175`) · **Datum:** 22. 11. 2026

## Hotovo × neuděláno

| Úkol | Stav | Test | Poznámka |
|---|---|---|---|
| A1.1 kostra aplikace | hotovo | `a_00_build` 3, `a_11_app` 21 (Node), `a_11_shell` 19 (prohlížeč) | cíl `xlab`, Shell přes adaptér, zámek kurzoru, `__xe` |
| A1.2 statický svět | — | | |
| A1.3 hráč a profily | — | | |
| A1.4 entity a kostry | — | | |
| A1.5 použít + spojení | — | | |
| A1.6 manipulace a klidný režim | — | | |
| A1.7 buňky a portály | — | | |
| A1.8 světla a obraz | — | | |

## Jak je to postavené

- `src/app/game.js` skládá jádro a systémy a **nezná DOM**. Tentýž kód běží ve hře (`src/app/main.js`, vykreslení three.js) i v testech v Node (`src/render/null.js`, vykreslení bez obrazu). Fyzika, hráč, kostry a spojení se proto testují v Node za zlomek sekundy; prohlížeč zůstává na obraz a Shell.
- `src/app/main.js` přidává plátno, Shell (`vendor/shell` přes adaptér), zámek kurzoru (`lock.js`), HUD a háček `__xe` (`hook.js`).
- Styl Shellu se nekopíruje: `import css from '../../vendor/shell/shell.css' with { type: 'text' }` (esbuild 0.28.2 to umí bez úpravy `build.mjs`).
- Nastavení (`src/app/settings.js`): zorné pole, měřítko vykreslení, počet světel za běhu, citlivost myši, profil pohybu (jen s `?dev`, neukládá se).
- Akce a klávesy jsou data (`src/play/actions.js`): pohyb šipkami i WASD, skok mezerník a pravé tlačítko, použít E a Enter, uchopit levé tlačítko.

## Změřená čísla

| Co | Hodnota | Kde a jak |
|---|---|---|
| kód enginu bez Rapieru a dat | 561 kB (three 524, Shell 18, kód sešny A 15, základ 4) | `a_00_build`, rozpad z esbuild metafile; A1.1, před zapojením fyziky |

## Neověřeno

- Zámek kurzoru ve skutečném prohlížeči. Headless prohlížeč ho neumí bezpečně (teče paměť), takže protokol je ověřený jen nad maketou dokumentu v Node (`a_11_app`): získání, ztráta → pauza, odmítnutí po Esc → „klikni znovu“, prostředí bez zámku → pohled tažením myši.
- Chování v náhledovém panelu claude.ai (vložený rámec): jestli tam zámek kurzoru projde, nevím; počítám s tím, že ne, a hra pak přejde na tažení myší.

## Návrhy (docs/navrhy)

Zatím žádný.

## Co potřebuju od sešny B

Zatím nic.

## Poznatky pro skill

- `esbuild` 0.28.2 umí `import x from './soubor.css' with { type: 'text' }`: styl z `vendor/` jde vložit do stránky bez kopie a bez zásahu do `build.mjs`.
- Rapier 0.21.0 má jiné rozložení balíčku než 0.20 (`dist/rapier.mjs`, `dist/rapier.cjs`, typy v `dist/**/*.d.ts`); `import RAPIER from '@dimforge/rapier3d-compat'` funguje v Node i v esbuildu.
- V sandboxu hlásí ovladač SwiftShader při skládání plátna s vrstvami HTML varování `GPU stall due to ReadPixels`. Je to šum softwarového vykreslování; testy sešny A ho filtrují (`test/a_lib/browser.cjs`), nic jiného ne.
- Pomocné soubory testů patří do složky `test/a_lib/`: soubor `test/a_*.mjs` by `tools/run-tests.mjs` pustil jako test.

## Otázky pro Ondřeje

(doplním na konci vlny)
