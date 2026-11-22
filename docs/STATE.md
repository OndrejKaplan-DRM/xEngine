# Stav

**Verze:** základ 2 · 22. 11. 2026 · větev `zaklad-2` (shodná s `main`)
**Další krok:** vlna 2, sešny A a B podle oddílu „vlna 2“ nahoře v `docs/sesny/START_A.md` a `START_B.md`.

Základ 2 = znění 2 základu 1 + sloučená vlna 1 (sešna A `230b3ee`, sešna B `754f46d`) + zkouška A × B + rozhodnuté návrhy a rozpory (D-029 až D-034) + rozpočty podle tří běhů xBench 0.2.

## Integrace vlny 1 (svodná sešna main 02, 22. 11. 2026)

| Krok | Výsledek | Čím ověřeno |
|---|---|---|
| znění 2 základu na GitHubu | `zaklad-1` = `main` = `16548b4` | `npm test` 232 kontrol před pushem, `git ls-remote` po něm |
| vlastnictví složek | sešna A ani B nesáhla mimo své složky; `package.json` beze změny; žádný soubor přes 600 řádků | `git diff --name-only` proti základu |
| sloučení `sesna-a` (`230b3ee`) | bez konfliktu; dva importy Shellu a rozpad velikosti v `a_00_build` opraveny (`e13d1fc`) | základ 232, skupina A 16 sad z 16, 267 kontrol |
| sloučení `sesna-b` (`754f46d`) | bez konfliktu; zámek balíků beze změny | základ 232, skupina B 4 sady ze 4, 92 kontrol |
| **zkouška A × B** | level sešny B běží v enginu sešny A beze změny kódu: všechny buňky dosažitelné pro kapsli hráče, robot došel ze startu do nejvzdálenější buňky ve všech třech levelech `gen_demo` (57,9 m, 42,5 m, 28,7 m) i ve zlatém vzorku (25,2 m), dveře na cestě otevřel rukou, nikde neuvázl; nejvýš 158 volání kreslení na pohled; v prohlížeči startují všechny tři levely s čistou konzolí | `npm run test:axb`: T5 28 kontrol v Node, 9 v prohlížeči |
| celá regrese | 633 kontrol, 0 selhalo (základ 237, A 267, B 92, A × B 37) | `npm run test:all` |
| měření T460 | tři běhy xBench 0.2 v `docs/mereni/`, rozpočty přepsány podle nejhoršího běhu | `docs/06_ROZPOCTY.md` |

Co zkouška A × B neříká: robot běží v Node bez obrazu (stejný kód hry, jiné vykreslení). Chodí po nejkratší cestě, takže většinu místností jen míjí. Dveře `door_plank_01` nechávají průchod 0,80 m pro postavu širokou 0,70 m (s odstupem kontroléru 0,74 m): projít jdou, ale jen středem. Krok simulace je měřen v sandboxu, o T460 nevypovídá.

## Rozhodnuto po vlně 1

- **Návrhy:** všech 12 rozhodnuto, přehled v `docs/navrhy/README.md`. Sedm je už v základu (volitelná pole a věty kontraktu), šest základ dluží (seznam v `docs/sesny/START_SVOD.md`).
- **Rozpory kódu sešny A se zněním 2:** D-031 (světlo po vrcholech a pevné řádky jsou první úkol vlny 2), D-032 (klidný režim rozhodne zkouška v Chrome), D-027 zrušeno.
- **Stupně kvality** (D-029): rámec přijat; změřený je jen stupeň `low` pro T460.

## Co ukázala hra na T460 (22. 11. 2026, čtyři pohledy, přehled F3)

Hra z vlny 1 drží 60 snímků/s. Krok simulace je 0,64 až 3,50 ms proti mezi 2 ms a skoro celý ho tvoří fyzika. Čas grafiky F3 neměří. Podrobně `docs/mereni/T460_2026-11-22_xlab_gen_F3.md`.

Sešna A má z vlny 1 otevřené: skok v profilu `arena` na nový stisk, zablokované dveře (D-025), oddíl „Rozhraní entit“ (D-026). Sešna B: katakomby podle volby 2 b, B1.3 xBake nezačato, B1.4 xSearcher jen měření zdrojů.

## Co je hotové (základ 1)

| Část | Kde | Stav |
|---|---|---|
| jádro: systémy, fáze, závislosti, deklarované události, pevný krok 120 Hz, režimy, uložení stavu | `src/kernel` | 41 kontrol v T0 |
| xSpace 1: popis formátů, validátor se stálými kódy nálezů, načtení a spojení balíků, geometrie kvádrů a klínů, matice koster | `src/xspace` | 123 kontrol v T1, z toho 58 mutací |
| světlo: síť vzorků `brushLightMesh` (mřížka 0,5 m, pořadí vrcholů je kontrakt) a vzorec `lightIrradiance` | `src/xspace/geom.js`, `light.js` | 17 kontrol v T1 |
| zlatý vzorek: level xLab (5 buněk, 4 portály, 54 kvádrů, 20 entit, 10 světel, 11 spojení) a 12 prefabů s kostrou | `packs/golden`, `tools/golden/make.mjs` | bez nálezů, bajtově opakovatelný |
| xView: prohlížeč balíku (pět pohledů, vrstvy, validátor v prohlížeči) | `tools/xview` → `dist/xview.html` | 15 kontrol v T2 |
| xBench 0.2: měření stroje (28 případů, z toho 16 shodných s verzí 0.1) | `tools/xbench` → `dist/xbench.html` | 12 kontrol v T3; verze 0.1 změřena na T460, verze 0.2 zatím ne |
| xShell: menu, pauza, nastavení z deklarací, katalog nabídek | `src/shell` | 46 kontrol v T4 (jen nastavení) |
| rozpočty z měření T460 | `docs/06_ROZPOCTY.md`, `docs/mereni/` | změřeno 22. 11. 2026 |
| dokumenty: vize, architektura, kontrakty, názvosloví, rozdělení sešen, parita, rozpočty, požadavky, rozhodnutí | `docs/` | dokument polí se generuje a hlídá testem |

`npm test`: 237 kontrol; `npm run test:all` (základ, A, B, A × B): 633 kontrol, 0 selhalo (Node 22, Chromium bez grafické karty).

## Co hotové není

- **Engine podle znění 2.** xLab i levely sešny B se dají projít (`dist/xlab.html`, `dist/xlab_gen.html`), ale engine z vlny 1 svítí po pixelech; podle měření T460 tím překračuje rozpočet vykreslení.
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

1. Zkouška D-032: v `xlab_gen.html?level=1` si sednout k terminálu, stisknout Esc a říct, jestli se rozhlížení myší vrátilo hned, nebo až po kliknutí.
2. Pět otázek sešny B ke vzhledu (`docs/sesny/B_STAV.md`, konec dokumentu).
3. Potvrdit nebo přepsat body 6/ až 8/ zadání (`00_ZADANI.md`; sestavila je svodná sešna z jeho vět).
4. Až sešna A dodá `?bench`: pustit ho na T460.

## Návrhy

Žádný otevřený. Přehled rozhodnutí v `docs/navrhy/README.md`.
