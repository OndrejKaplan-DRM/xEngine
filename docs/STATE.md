# Stav

**Verze:** základ 1, znění 2 · 22. 11. 2026 · větev `zaklad-1` (shodná s `main`)
**Další krok:** svodná sešna „main 02“: sloučení vlny 1 podle `docs/sesny/START_SVOD.md`, oddíl „První kroky sešny main 02“.

Znění 2 obsahuje měření T460, tři Ondřejova rozhodnutí a z nich plynoucí změny (D-006, D-011, D-016, D-022 až D-027).

**Stav 22. 11. 2026 v 17:40.** Znění 2 není na GitHubu (`main` = `zaklad-1` = `a2ce175`); je v kontejneru sešny main 01 a v souboru `xengine_zneni2_2026-11-22.bundle`.

| Větev | Hlava | Co je hotové | Ověřila svodná sešna |
|---|---|---|---|
| `sesna-a` | `7d3bec6` | celá vlna 1 podle **znění 1** (A1.1 až A1.8); podle jejího stavu 16 sad, 267 kontrol | zkušební sloučení se zněním 2 bez konfliktů; po změně dvou importů Shellu 16 z 16 sad prošlo |
| `sesna-b` | `754f46d` | B1.1 xGen a B1.2 sada `kit_base` (49 prefabů); B1.3 nezačato, B1.4 jen měření zdrojů; podle jejího stavu 92 kontrol | zkušební sloučení bez konfliktů; její testy svodná nepouštěla |

Co sešna A postavila jinak, než říká znění 2: zásobník bodových světel po pixelech (D-022), velikost obrazu podle `devicePixelRatio` (D-023), terminál podle původního zadání s uvolněním zámku kurzoru (D-024), ořez po buňkách už hotový (D-027 tím ztrácí smysl). Návrhy k rozhodnutí: N-002 až N-006 (sešna B), N-101 až N-107 (sešna A).

Nové od Ondřeje (22. 11. 2026): zadání ve znění 2 je v `docs/00_ZADANI.md` (jméno xForge, meze 50 a 100 MB, hra má vypadat skutečně, rezerva pro stroj s grafickou kartou).

## Co je hotové (základ 1)

| Část | Kde | Stav |
|---|---|---|
| jádro: systémy, fáze, závislosti, deklarované události, pevný krok 120 Hz, režimy, uložení stavu | `src/kernel` | 41 kontrol v T0 |
| xSpace 1: popis formátů, validátor se stálými kódy nálezů, načtení a spojení balíků, geometrie kvádrů a klínů, matice koster | `src/xspace` | 118 kontrol v T1, z toho 53 mutací |
| světlo: síť vzorků `brushLightMesh` (mřížka 0,5 m, pořadí vrcholů je kontrakt) a vzorec `lightIrradiance` | `src/xspace/geom.js`, `light.js` | 17 kontrol v T1 |
| zlatý vzorek: level xLab (5 buněk, 4 portály, 54 kvádrů, 20 entit, 10 světel, 11 spojení) a 12 prefabů s kostrou | `packs/golden`, `tools/golden/make.mjs` | bez nálezů, bajtově opakovatelný |
| xView: prohlížeč balíku (pět pohledů, vrstvy, validátor v prohlížeči) | `tools/xview` → `dist/xview.html` | 15 kontrol v T2 |
| xBench 0.2: měření stroje (28 případů, z toho 16 shodných s verzí 0.1) | `tools/xbench` → `dist/xbench.html` | 12 kontrol v T3; verze 0.1 změřena na T460, verze 0.2 zatím ne |
| xShell: menu, pauza, nastavení z deklarací, katalog nabídek | `src/shell` | 46 kontrol v T4 (jen nastavení) |
| rozpočty z měření T460 | `docs/06_ROZPOCTY.md`, `docs/mereni/` | změřeno 22. 11. 2026 |
| dokumenty: vize, architektura, kontrakty, názvosloví, rozdělení sešen, parita, rozpočty, požadavky, rozhodnutí | `docs/` | dokument polí se generuje a hlídá testem |

`npm test`: 232 kontrol, 0 selhalo (Node 22, Chromium bez grafické karty).

## Co hotové není

- **Engine.** Nic se zatím nedá projít. xView data jen kreslí.
- Shell je přestěhovaný, ne zapojený. Jeho zkoušky v prohlížeči a zkouška katalogu zůstaly ve `vibe-game-frameworks`.
- Formát zapečeného světla (návrh N-001 od sešny B; vzorky, pořadí a vrstvy jsou už dané kontraktem).
- Ořez pohledem po buňkách (vlna 2), načítání `.glb`, textury, zvuk, tvorové, editor.

## Neověřeno

- Světlo po vrcholech ve hře na T460. Měřeno je jen to, že scéna bez výpočtu světel stojí 2,4 ms a se 4 bodovými světly 14,0 ms; že síť s mřížkou 0,5 m vypadá dobře, ukáže až sešna A.
- Cena jednoho světla po pixelech, scéna bez světel v 1080 řádcích, textury (čeká na xBench 0.2).
- Čas kroku simulace na T460.
- Verze Rapieru 0.21.0 a three-mesh-bvh 0.9.18 jsou připnuté, ale nic je zatím nepoužívá.
- Hodnoty pohybu pro profil `real` (Counter-Strike, Half-Life) mají jistotu 3/5.
- Ochranná známka Blender (důvod jména xForge) je uvedena z obecné znalosti, bez právního ověření.
- Přínos druhého modulu paměti v T460.

## Otevřené pro Ondřeje

1. Dostat znění 2 na GitHub (slovo k pushi), nebo předat sešně main 02 soubor `.bundle`.
2. Říct, zda smím do `vibe-game-frameworks` zapsat, že Shell má domov v xEngine.
3. Pustit xBench 0.2 na T460 a poslat výsledek.

## Návrhy

Žádný otevřený. Přehled v `docs/navrhy/README.md`.
