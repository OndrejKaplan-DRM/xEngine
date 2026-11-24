# TODO: co se dělá, co čeká, co je hotové

Jediný přehled napříč sešnami. Podrobnosti jsou jinde (odkazy u řádků); tady je jen to, co potřebuješ vědět, než začneš.

**Pravidla souboru** (D-038):
- Každá sešna mění **jen svůj oddíl**. Svodná sešna navíc oddíl „Čeká na Ondřeje“ a hlavičku.
- Aktualizuje se na konci každého kroku spolu s commitem, ne až na konci sešny.
- „Nedávno hotovo“ drží posledních 8 položek; starší jsou v `git log` a v `*_STAV.md`.
- Řádek = jedna věc, kdo, stav, kde je podrobně. Čísla jen změřená, s místem měření.

**Základ:** `zaklad-2` = `main` = `integrace-1` = `a995347` (základ 2, znění 3). Hlavy sešen: `sesna-a` = `db6fad0`, `sesna-b` = `8be5b71`. Stav k 24. 11. 2026 16:05.

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
- [x] paměť projektu v repu: tento soubor, mapa v `CLAUDE.md`, moduly v `docs/01_ARCHITEKTURA.md`
- [ ] měření z tvých snímků F3 z 24. 11. do `docs/mereni/`
- [ ] rozhodnout N-008, N-109, N-110, pole `env.lightCell`, dvě místa „k potvrzení“ v N-001, vzorky dílů prefabů v zapečeném souboru
- [ ] základ: rozměry postavy (N-008), čtení zapečeného světla do `src/xspace` (dluh 4), vzorky pevných dílů prefabů
- [ ] celá regrese, sloučení nanečisto s hlavami sešen, znění 4 základu 2, dodatky pro sešny A a B

**Další na řadě** (po dnešku, pořadí z `START_SVOD.md`): pravidlo validátoru `portal.door.cover` (D-036) → svázané klouby `follow` (N-002, dvoukřídlé dveře jako jeden prefab) → `rigCompile`, `rigSolve` (N-102) → svítivosti zlatého vzorku (N-105) → `rig.noSpeed` (N-103) → zmrazit pole N-006 (D-030) → zkoušky Shellu → xBench (strop 22,5 až 25,2 ms) → `REQUIREMENTS.md` a `05_PARITA_2003.md`.

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
- [x] A2.5 nová pole základu
- [x] A2.6 na zkušebních datech: díl `.glb`, kolize `hull` / `mesh`, textura barvy (na T460 nejvýš 512 px), světlo texturu násobí; T460: 14 textur v xLabu, vykreslení 2,29 / 2,9 ms (medián / 95 %, `?bench` 24. 11. 19:39)
- [ ] sloučit znění 4 základu 2 a dodatek: D-039 strop řádků, testy nezávislé na rozsahu dveří zlatého vzorku (D-042), rozměry postavy z `body.js` (D-040), pořadí vzorků `levelSamples` (D-041), **čtení zapečeného světla `bake.js` (D-044)**: odstraní 54 s stavby světla v `complex_7` a přinese odražené světlo (Ondřej 19:49: černé boky řešit tímhle)
- [ ] A2.6 na kusu ze sešny B: potřebuje B2.5 a návrh **N-111**

**Potom:** zkouška textury světla na hale xLabu s bodem 5 i 10 cm (N-110, D-043) → výchozí 1 080 řádků, pokud `complex_7` na T460 vyjde do 10 ms (xLab: 95 % 7,38 ms).

**Čeká na jiné:** svodná rozhoduje N-109, N-110, **N-111** a jestli světlo prochází dveřmi se `seeThrough`; sešna B dveře na obě strany v datech (N-109), B2.5 (u dílů `mesh` vyplňovat `mat`, velké plochy modelu dělit asi po 0,5 m kvůli světlu po vrcholech), chybějící pole v `kit_base` (`screen.offset` u terminálů, `opacity` u `glass_pane`).

**Nedávno hotovo:**
- 24. 11. A2.6 na zkušebních datech: `glb.js`, `assets.js`, textura v `materials.js` (`6e1ab0c`, `3c6bab0`); testy `a_26_mesh` (30), `a_26_view` (8)
- 24. 11. A2.5 nová pole: rychlost kloubu ze základu, `screen.offset`, `seeThrough`, `passable`, `opacity` (sklo průhledné, nestíní světlo)
- 24. 11. snímek z T460 (`complex_7`): „Dveře od hráče“ jen v otvoru portálu, ne dvířka nábytku (`afb5b0a`); černý bok kartotéky = chybí odražené světlo
- 24. 11. zorné pole: číslo z nastavení je vodorovný úhel při 4 : 3, strop 120°; na T460 F3 ukazuje 117° × 74° při 90 (`db6fad0`)
- 24. 11. `?bench` měří čas grafiky dávkou (`draw.ms`); stará metoda na T460 vracela obnovu displeje
- 24. 11. sloučeno znění 3 základu (D-037), vlastní kopie dílů prefabů zrušena; švy 128 → 0 (`25e17a4`)
- 24. 11. zkouška terminálu na T460 prošla (D-032)
- 23. 11. A2.3 krok fyziky: na T460 medián 0,55 až 0,68 ms, dřív až 3,10 ms (`b77837f`)

## Sešna B (obsah a nástroje)

Podrobně: `docs/sesny/B_STAV.md` na větvi `sesna-b`, zadání `docs/sesny/START_B.md`.

**Teď** (Ondřej 24. 11. 02:04): B2.3 xSearcher → B2.4 vzhled („opotřebený provoz“, z webu jen materiály a textury, poprvé v galerii; originály 2K, odvozeně 1K a 512 px) → B2.5 zkouška povrchu na jednom kusu → zbytek B2.2.

**Čeká na základ:** svázané klouby (N-002) pro dvoukřídlé dveře; rozhodnutí N-109 (dveře na obě strany potřebují jiné těsnění škvír než doraz); čtení zapečeného souboru v běhu.

**Nedávno hotovo** (stav `B_STAV.md` z 24. 11., 02:11):
- 24. 11. xBake nad mřížkou znění 3 (`levelLightMeshes`); xLab 20 509 vzorků, 1,0 s, 476 kB (sandbox)
- 24. 11. xBake podle D-035: dveře jako brány světla, stínění kolizemi prefabů, okraj stínu 4 × 4 paprsky, čtení bez Node (`tools/bake/read.mjs`)
- 24. 11. B2.1 průchodnost pro skutečného hráče (0,74 m), světlost dveří, návrh N-008
- 24. 11. cílový stroj pro horní stupně: mez grafické paměti 8 GB (Ondřej 02:04)
- 23. 11. díly v nástrojích z `partMesh` a `partTris` ze základu
- 23. 11. oprava zkoušky A × B: dvoukřídlé dveře v `portal.door` se `seeThrough`
- 22. 11. katakomby podle volby 2 b, škvíry u dveří (N-007), xBake 0.1 a náhled
