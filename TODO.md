# TODO: co se dělá, co čeká, co je hotové

Jediný přehled napříč sešnami. Podrobnosti jsou jinde (odkazy u řádků); tady je jen to, co potřebuješ vědět, než začneš.

**Pravidla souboru** (D-038):
- Každá sešna mění **jen svůj oddíl**. Svodná sešna navíc oddíl „Čeká na Ondřeje“ a hlavičku.
- Aktualizuje se na konci každého kroku spolu s commitem, ne až na konci sešny.
- „Nedávno hotovo“ drží posledních 8 položek; starší jsou v `git log` a v `*_STAV.md`.
- Řádek = jedna věc, kdo, stav, kde je podrobně. Čísla jen změřená, s místem měření.
- Čerstvý oddíl sešny je na její větvi, než se sloučí: `git show origin/sesna-a:TODO.md`, `git show origin/sesna-b:TODO.md`.

**Základ:** `zaklad-2` = `main` = `integrace-1`, základ 2 znění 4 (24. 11. 2026). Hlavy sešen v 16:33: `sesna-a` = `c7a2a64`, `sesna-b` = `4aeeeb4`. Regrese: `main` 662 kontrol, sloučení nanečisto s oběma sešnami 855, 0 selhalo (`docs/STATE.md`).

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

**Hotovo dnes (main 03, 24. 11.):**
- [x] paměť projektu v repu: tento soubor, mapa v `CLAUDE.md`, moduly v `docs/01_ARCHITEKTURA.md` (D-038)
- [x] měření z tvých snímků F3 z 24. 11.: `docs/mereni/T460_2026-11-24_D-037_F3.md`
- [x] rozhodnuto: D-039 řádky podle okna; D-040 N-008 přijat; D-041 vzorky i z pevných dílů prefabů; D-042 N-109 přijat; D-043 N-110 jako směr se zkouškou 5 a 10 cm, `env.lightCell` zamítnuto; D-044 brána jako seznam a `doors` v hlavičce přijaty, čtení souboru do základu
- [x] základ: `src/xspace/body.js` (N-008) a varování `portal.narrow`; `src/xspace/samples.js` (`levelSamples`); `src/xspace/bake.js` (`decodeBake`, `composeColors`, `gateLevel`, `doorOpenness`)
- [x] věty do `02_KONTRAKTY.md`: vzorky (D-041), soubor světla (D-044), dveře na obě strany (D-042)
- [ ] zlatý vzorek: `door_hinged_01` na obě strany (N-109) **čeká na sešnu A**: 8 jejích kontrol počítá s jednostrannými dveřmi
- [x] celá regrese po skupinách a sloučení nanečisto s hlavami sešen (855 kontrol, 0 selhalo); `STATE.md` znění 4; dodatky nahoře ve `START_A.md` a `START_B.md`

**Čeká na sešny:** A upraví testy jednostranných dveří (potom přepnu zlatý vzorek na ±105°), převezme `BODY` a `levelSamples`, strop řádků (D-039). B vyřeší srážku `TODO.md` a `CLAUDE.md` verzí základu, převezme `BODY` a `bake.js`, zapeče pevné díly prefabů (D-041).

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

Podrobně: `docs/sesny/A_STAV.md` na větvi `sesna-a` (oddíl 1 „Kde jsme“, oddíl 2 deník rozhodnutí sešny A), zadání `docs/sesny/START_A.md`.

**Teď (24. 11. večer):**
- [x] A2.5 nová pole základu; A2.6 na zkušebních datech (T460: 14 textur v xLabu, vykreslení 2,29 / 2,9 ms)
- [x] znění 4 základu: D-039 strop řádků, D-040 rozměry postavy, D-042 zkoušky dveří připravené na ±105°, **D-041 a D-044 běh čte zapečené světlo** (shoda s výpočtem, soubor ze xBake se přečte), N-009 barva materiálu s texturou
- [ ] A2.6 na kusu ze sešny B a zapečené světlo ve hře: potřebuje **N-111** (build vkládá jen JSON) a soubor `levels/<id>.light.bin` v balíku od sešny B
- [ ] zkouška textury světla na hale xLabu s bodem 5 i 10 cm (N-110, D-043)

**Potom:** výchozí 1 080 řádků (na plátně, které je má), pokud `complex_7` na T460 vyjde do 10 ms (xLab: 95 % 7,38 ms).

**Čeká na jiné:** svodná: N-111, přepnout dveře zlatého vzorku na ±105° (testy A připravené), N-009, `composeColors` bez dělení π (A_STAV, oddíl 9), N-110; sešna B: zapečený soubor do balíků (se vzorky dílů podle D-041), B2.5 (u dílů `mesh` vyplňovat `mat`), `screen.offset` a `opacity` v `kit_base`.

**Nedávno hotovo:**
- 24. 11. znění 4: zapečené světlo v běhu (`a_44_bake`), strop řádků, rozměry postavy, zkoušky dveří na ±105°
- 24. 11. A2.6 na zkušebních datech: `glb.js`, `assets.js`, textura v `materials.js` (`6e1ab0c`, `3c6bab0`); testy `a_26_mesh` (30), `a_26_view` (8)
- 24. 11. A2.5 nová pole: rychlost kloubu ze základu, `screen.offset`, `seeThrough`, `passable`, `opacity` (sklo průhledné, nestíní světlo)
- 24. 11. snímek z T460 (`complex_7`): „Dveře od hráče“ jen v otvoru portálu, ne dvířka nábytku (`afb5b0a`); černý bok kartotéky = chybí odražené světlo
- 24. 11. zorné pole: číslo z nastavení je vodorovný úhel při 4 : 3, strop 120°; na T460 F3 ukazuje 117° × 74° při 90 (`db6fad0`)
- 24. 11. `?bench` měří čas grafiky dávkou (`draw.ms`); stará metoda na T460 vracela obnovu displeje
- 24. 11. sloučeno znění 3 základu (D-037), vlastní kopie dílů prefabů zrušena; švy 128 → 0 (`25e17a4`)
- 24. 11. zkouška terminálu na T460 prošla (D-032)

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
