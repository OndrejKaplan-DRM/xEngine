# Stav

**Verze:** integrace vlny 1 · 22. 11. 2026, 22:30 · větev `integrace-1` (základ: `zaklad-1` = `main` = `16548b4`, znění 2)
**Další krok:** svodná sešna „main 02“ rozhodne rozpory a návrhy; po Ondřejově slovu `integrace-1` → `main` a `zaklad-2`.

## Integrace vlny 1 (svodná sešna main 02, 22. 11. 2026)

| Krok | Výsledek | Čím ověřeno |
|---|---|---|
| znění 2 základu na GitHubu | `zaklad-1` = `main` = `16548b4` | `npm test` 232 kontrol před pushem, `git ls-remote` po něm |
| vlastnictví složek | sešna A ani B nesáhla mimo své složky; `package.json` beze změny; žádný soubor přes 600 řádků | `git diff --name-only` proti základu |
| sloučení `sesna-a` (`230b3ee`) | bez konfliktu; dva importy Shellu a rozpad velikosti v `a_00_build` opraveny (`e13d1fc`) | základ 232, skupina A 16 sad z 16, 267 kontrol |
| sloučení `sesna-b` (`754f46d`) | bez konfliktu; zámek balíků beze změny | základ 232, skupina B 4 sady ze 4, 92 kontrol |
| **zkouška A × B** | level sešny B běží v enginu sešny A beze změny kódu: všechny buňky dosažitelné pro kapsli hráče, robot došel ze startu do nejvzdálenější buňky ve všech třech levelech `gen_demo` (57,9 m, 42,5 m, 28,7 m) i ve zlatém vzorku (25,2 m), dveře na cestě otevřel rukou, nikde neuvázl; nejvýš 158 volání kreslení na pohled; v prohlížeči startují všechny tři levely s čistou konzolí | `npm run test:axb`: T5 28 kontrol v Node, 9 v prohlížeči |
| celá regrese | 628 kontrol, 0 selhalo | `npm run test:all` |
| měření T460 | tři běhy xBench 0.2 v `docs/mereni/`, rozpočty přepsány podle nejhoršího běhu | `docs/06_ROZPOCTY.md` |

Co zkouška A × B neříká: robot běží v Node bez obrazu (stejný kód hry, jiné vykreslení). Chodí po nejkratší cestě, takže většinu místností jen míjí. Dveře `door_plank_01` nechávají průchod 0,80 m pro postavu širokou 0,70 m (s odstupem kontroléru 0,74 m): projít jdou, ale jen středem. Krok simulace je měřen v sandboxu, o T460 nevypovídá.

## Co zbývá svodné sešně před `zaklad-2`

1. **Rozpory kódu sešny A se zněním 2** (rozhodnout, zapsat do `DECISIONS.md`): světlo po pixelech a `MeshLambertMaterial` (D-022), velikost obrazu z `devicePixelRatio` a zapnuté vyhlazování hran (D-023), terminál s uvolněním zámku kurzoru (D-024), zablokované dveře (D-025), oddíl „Rozhraní entit“ (D-026), ořez po buňkách hotový dřív, než čekalo D-027. Převod na světlo po vrcholech má zadaný sešna A (`START_A.md`, oddíl 2a).
2. **Návrhy:** N-002 až N-006 (sešna B), N-101 až N-107 (sešna A). Nerozhodnuto. N-001 (formát zapečeného světla) neexistuje.
3. Oddíl C zadání (`00_ZADANI.md`), `REQUIREMENTS.md`, `05_PARITA_2003.md`: stavy řádků po vlně 1.
4. Zadání vlny 2 (`START_A.md`, `START_B.md`) proti oddílu C zadání; potom skill `xengine`.

Sešna A má po vlně otevřené: skok v profilu `arena` na nový stisk (Ondřejova volba 3 b, neuděláno). Sešna B: katakomby podle volby 2 b (stropy aspoň 2,6 m, chodby aspoň 1,6 m, neuděláno), B1.3 xBake nezačato, B1.4 xSearcher jen měření zdrojů.

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

`npm test`: 232 kontrol; `npm run test:all` (základ, A, B, A × B): 628 kontrol, 0 selhalo (Node 22, Chromium bez grafické karty).

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

1. Projít sestavení `xlab_gen.html` (engine A + levely B) a říct slovo ke sloučení `integrace-1` do `main` a k založení `zaklad-2`.
2. Potvrdit nebo přepsat body 6/ až 8/ zadání (`00_ZADANI.md`, sestavila je svodná sešna z jeho vět).
3. Říct, zda smím do `vibe-game-frameworks` zapsat, že Shell má domov v xEngine.
4. Pět otázek sešny B k vzhledu (`docs/sesny/B_STAV.md`, konec dokumentu).

## Návrhy

Otevřených 12: N-002 až N-006 a N-101 až N-107. Přehled v `docs/navrhy/README.md`, stav v oddílu „Co zbývá svodné sešně“.
