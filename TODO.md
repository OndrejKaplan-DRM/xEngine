# TODO: co se dělá, co čeká, co je hotové

Jediný přehled napříč sešnami. Podrobnosti jsou jinde (odkazy u řádků); tady je jen to, co potřebuješ vědět, než začneš.

**Pravidla souboru** (D-038):
- Každá sešna mění **jen svůj oddíl**. Svodná sešna navíc oddíl „Čeká na Ondřeje“ a hlavičku.
- Aktualizuje se na konci každého kroku spolu s commitem, ne až na konci sešny.
- „Nedávno hotovo“ drží posledních 8 položek; starší jsou v `git log` a v `*_STAV.md`.
- Řádek = jedna věc, kdo, stav, kde je podrobně. Čísla jen změřená, s místem měření.
- Čerstvý oddíl sešny je na její větvi, než se sloučí: `git show origin/sesna-a:TODO.md`, `git show origin/sesna-b:TODO.md`.

**Základ:** `zaklad-2` = `main` = `integrace-1` (hlava v `git log`; znění 3 základu 2 + dnešní změny svodné sešny, viz její oddíl). Hlavy sešen k 24. 11. 2026 16:20: `sesna-a` = `63a7554`, `sesna-b` = `b43d0bd`.

## Čeká na Ondřeje

| # | Co | Ptá se | Od | Podrobně |
|---|---|---|---|---|
| 1 | Zorné pole po opravě (vodorovný úhel při 4 : 3, strop 120°): a) použitelné, b) nižší strop, c) promítání Panini | sešna A | 24. 11. | `A_STAV.md`, konec |
| 2 | `?bench` znovu s opravenou metodou, bez vyhlazování, mřížka 0,5 m: `xlab.html?bench`, `…?bench&rows=1080`, `xlab_gen.html?bench`. Rozhodne výchozí rozlišení a o textuře světla (N-110). | sešna A, svodná | 24. 11. | `A_STAV.md`, konec |
| 3 | Terminál: po Esc a Pokračovat dál sedíš u terminálu a kurzor hned poslouchá? | sešna A | 23. 11. | D-032 |
| 4 | Černá obrazovka (snímek 3 z 24. 11. 01:42): jen okamžik, nebo trvala? | svodná | 24. 11. | `docs/mereni/T460_2026-11-24_D-037_F3.md` |
| 5 | Potvrdit nebo přepsat body 6/ až 8/ zadání (sestavila je svodná sešna z tvých vět) | svodná | 22. 11. | `docs/00_ZADANI.md`, oddíl B |
| 6 | Sloučit práci vlny 2 obou sešen do základu (světlo po vrcholech, xBake, zorné pole…): a) teď, b) až po A2.6 a B2.5 | svodná | 24. 11. | `docs/STATE.md` |

## Svodná sešna (základ)

Podrobně: `docs/STATE.md`, dluhy a pořadí `docs/sesny/START_SVOD.md`, rozhodnutí `docs/DECISIONS.md`.

**Teď (main 03, 24. 11.):**
- [x] paměť projektu v repu: tento soubor, mapa v `CLAUDE.md`, moduly v `docs/01_ARCHITEKTURA.md` (D-038)
- [x] měření z tvých snímků F3 z 24. 11.: `docs/mereni/T460_2026-11-24_D-037_F3.md`
- [x] rozhodnuto: D-039 řádky podle okna; D-040 N-008 přijat; D-041 vzorky i z pevných dílů prefabů; D-042 N-109 přijat; D-043 N-110 jako směr se zkouškou 5 a 10 cm, `env.lightCell` zamítnuto; D-044 brána jako seznam a `doors` v hlavičce přijaty, čtení souboru do základu
- [x] základ: `src/xspace/body.js` (N-008) a varování `portal.narrow`; `src/xspace/samples.js` (`levelSamples`); `src/xspace/bake.js` (`decodeBake`, `composeColors`, `gateLevel`, `doorOpenness`)
- [x] věty do `02_KONTRAKTY.md`: vzorky (D-041), soubor světla (D-044), dveře na obě strany (D-042)
- [ ] zlatý vzorek: `door_hinged_01` na obě strany (N-109) **čeká na sešnu A**: 8 jejích kontrol počítá s jednostrannými dveřmi
- [ ] celá regrese, sloučení nanečisto s hlavami sešen, `STATE.md`, dodatky pro sešny A a B

**Návrhy, které základ dluží:** N-002 `follow`, N-102 `rigCompile` a `rigSolve`, N-103 `rig.noSpeed`, N-105 svítivosti xLabu. Otevřený žádný; přehled `docs/navrhy/README.md`.

**Další na řadě** (po dnešku, pořadí z `START_SVOD.md`): pravidlo validátoru `portal.door.cover` (D-036, počítané v poloze `rest`, D-042) → svázané klouby `follow` (N-002, dvoukřídlé dveře jako jeden prefab) → `rigCompile`, `rigSolve` (N-102) → svítivosti zlatého vzorku (N-105) → `rig.noSpeed` (N-103) → zmrazit pole N-006 (D-030) → zkoušky Shellu → xBench (strop 22,5 až 25,2 ms) → `REQUIREMENTS.md` a `05_PARITA_2003.md`.

**Nedávno hotovo:**
- 24. 11. D-037 mřížka světla: vrcholy na násobcích buňky ve světě, schované plochy pryč; švy na zlatém vzorku 128 → 0 (`a995347`)
- 24. 11. průběžná předávka main 02 (`docs/sesny/predavky/`)
- 23. 11. díly prefabů v základu: `partMesh`, `partTris`, `partCollider` (N-101, `cc5078f`)
- 23. 11. rozhodnutí D-035 (zapečené světlo), D-036 (zakrytí otvoru dveřmi), D-037 (mřížka světla)
- 22. 11. `zaklad-2`: sloučená vlna 1, zkouška A × B (`npm run test:axb`), rozhodnutí D-029 až D-034, zadání vlny 2
- 22. 11. rozpočty podle tří běhů xBench 0.2 (`docs/06_ROZPOCTY.md`)

## Sešna A (běh)

Podrobně: `docs/sesny/A_STAV.md` na větvi `sesna-a`, zadání `docs/sesny/START_A.md`.

**Teď:** A2.5 nová pole základu (`screen.offset`, `JOINT_TRAVEL_SECONDS`, `seeThrough`, `passable`, `opacity`) → A2.6 textura a síť `.glb` na jednom kusu se sešnou B (D-030).

**Potom:** zkouška textury světla na hale xLabu (N-110; Ondřej 24. 11. 02:26: až po A2.5 a A2.6).

**Nedávno hotovo** (stav `A_STAV.md` z 24. 11., 05:30):
- 24. 11. zorné pole: číslo z nastavení je vodorovný úhel při 4 : 3, strop 120° (`db6fad0`)
- 24. 11. `?bench` měří čas grafiky dávkou (stará metoda na T460 vracela obnovu displeje)
- 24. 11. dveře od hráče jako nastavení, výchozí zapnuto; návrh N-109 do dat
- 24. 11. sloučeno znění 3 základu (D-037), vlastní kopie dílů prefabů zrušena; švy 128 → 0
- 24. 11. zkouška terminálu na T460 prošla (D-032)
- 23. 11. A2.3 krok fyziky: na T460 medián 0,55 až 0,68 ms, dřív až 3,10 ms (Ondřejův `?bench` 24. 11.)
- 23. 11. A2.1 světlo po vrcholech se zastíněním, branami dveří a okrajem stínu po podílech; A2.2 pevné řádky a `?bench`
- 23. 11. A2.4 dluhy vlny 1 (skok, D-024, D-025)

## Sešna B (obsah a nástroje)

Oddíl převzat doslova z `TODO.md` na `sesna-b` (`b43d0bd`); vede ho sešna B.

**Hotovo ve vlně 2:**
- B2.1 průchodnost pro skutečného hráče 0,74 m, katakomby, světlost dveří (`d2e1481`)
- B2.6 xBake podle D-035: dveře jako brány světla, stínění kolizemi prefabů, okraj stínu po podílech, čtení bez Node (`3d1aa2a`, `7dd9cd2`), nad mřížkou D-037 (`9d34aa6`)
- díly prefabů z `geom.js` v galerii, náhledu a xBake (`7dd9cd2`)
- poslední celá regrese: 699 kontrol, 0 selhalo (`9d34aa6`, sandbox)

**Teď:** B2.3 xSearcher (`tools/searcher/find.mjs`): hledání a příjem textur CC0 z Poly Haven a ambientCG do `packs/_inbox/`, se záznamem o původu a licenci; test nad uloženými odpověďmi bez sítě.

**Další, v tomto pořadí** (Ondřej 24. 11.: opotřebený provoz; z webu jen materiály a textury; poprvé v galerii; mez 8 GB grafické paměti):
1. B2.4 textury barvy do `kit_base` přes `albedo`, galerie se třemi pohledy (čistý, T460, grafická karta); originály 2K, odvozeně 1K a 512 px
2. B2.5 zkouška povrchu na jednom kusu (dveře `.glb` na stejné kostře)
3. zbytek B2.2: `components.place`, `opacity`, `passable`, `seeThrough` u mříže, `speed`
4. B2.7 xDesigner, dům, tvor

**Čeká na jiné:** N-109 (data dveří na obě strany, až rozhodne svodná) · N-002 (jeden prefab dvoukřídlých dveří) · N-110 (nový druh vrstvy v xBake).
