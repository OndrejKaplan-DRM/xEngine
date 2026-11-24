# Návrhy změn základu a kontraktů

Sešna A ani B nemění soubory základu ani soubory druhé sešny. Když něco potřebuje, napíše návrh. Rozhoduje svodná sešna při slučování.

## Postup

1. Soubor `N-<číslo>-<téma>.md` v této složce, číslo další volné (každá sešna čísluje ve vlastní řadě: B od 001, A od 101, svodná od 201, aby se nesrazily; svodná tak píše zadání zkoušky nového formátu).
2. Dočasné řešení ve vlastní složce, za přepínačem nebo ve vlastním poli, které validátor ohlásí jen jako varování `shape.unknown`.
3. Práce pokračuje. Na rozhodnutí se nečeká.

## Šablona

```text
# N-000: <název>

Sešna: A | B · Datum: RRRR-MM-DD · Stav: otevřený | přijatý | odložený | zamítnutý

## Co potřebuju
(jedna věta)

## Proč to bez toho nejde
(konkrétní případ, nejlépe s daty nebo testem)

## Návrh
(přesná změna: pole formátu, funkce, rozhraní; včetně názvů a jednotek)

## Dopad
(co se musí změnit u druhé sešny, ve zlatém vzorku, v testech; mění se verze formátu?)

## Dočasné řešení
(co dělám teď a jak se to odstraní)

## Rozhodnutí
(vyplní svodná sešna: přijato / odloženo / zamítnuto, proč, v jakém commitu)
```

## Přehled

Tabulku udržuje svodná sešna. Sešny A a B jen přidávají soubory návrhů; tento soubor neupravují.

| Číslo | Název | Sešna | Stav |
|---|---|---|---|
| N-001 | formát souboru se zapečeným světlem | B | očekává se ve vlně 1 |

## Známé kandidáty

Tohle formát verze 1 vědomě neumí; kdo na to narazí, napíše návrh:

- víc interakcí na jeden prefab (stůl se třemi zásuvkami),
- válec a obecná síť jako tvar kvádru levelu,
- terén s výškovou mapou,
- buňka jiného tvaru než osově zarovnaný kvádr,
- venkovní buňka bez stropu a obloha jako její okolí,
- kulový kloub,
- světelné sondy.

## Rozhodnuto po vlně 1 (svodná sešna main 02, 22. 11. 2026)

| Návrh | Výsledek | Kde je to v základu |
|---|---|---|
| N-001 zapečené světlo | přijat se změnou: dveře v portálech nestíní, světlo zadržuje brána za běhu (23. 11. 2026). Znění 2: brána jako seznam dveří a pole `doors` v hlavičce přijaty; soubor ponese i pevné díly prefabů (24. 11. 2026) | D-035, D-041, D-044; čtení a skládání v `src/xspace/bake.js`, pořadí vzorků `levelSamples` |
| N-007 zakrytí otvoru dveřmi | bod 1 přijat (zakrytí ze všech dílů), bod 2 zamítnut (seznam entit u portálu) (23. 11. 2026) | D-036 |
| N-002 svázané klouby | přijat, proveden 24. 11. 2026 | D-034; `rig.joints[].follow`, `jointFollow` v `rig.js`, validátor `rig.follow`, `rig.followCycle`, T1 |
| N-003 portál jen pro pohled, průhledné dveře | přijat | `formats.js`, validátor, T1 |
| N-004 údaje pro rozmisťování | přijat | `components.place`, T1 |
| N-005 průhlednost materiálu | přijat | `materials[].opacity`, T1 |
| N-006 stupně kvality a vrstvy vzhledu | přijat po částech | D-029, D-030 |
| N-101 díly prefabu v `geom.js` | přijat a proveden 23. 11. 2026 | `partMesh`, `partCollider`, `partTris`, `CYL_SEGMENTS`; xView je používá; T1 |
| N-102 `rigMatrices` bez alokací | **proveden** 24. 11. 2026 (`rigCompile`, `rigValues`, `rigFollow`, `rigSolve`) | D-034 |
| N-103 výchozí rychlost kloubu | přijaty body 1 a 2, varování odloženo | `JOINT_TRAVEL_SECONDS`, kontrakty |
| N-104 dosah interakce | přijat | kontrakty |
| N-105 přesvícený xLab | přijat, provede se po převodu světla | D-034 |
| N-106 plocha obrazovky | přijat | `screen.offset`, zlatý vzorek |
| N-107 dveře musí zakrýt portál | přijat s úpravou | kontrakty; pravidlo validátoru `portal.door.cover` provedeno 24. 11. 2026 (`src/xspace/cover.js`, D-036) |
| N-108 švy a hrubost mřížky světla | přijata varianta (a) a vynechání schovaných ploch; provedeno 24. 11. 2026. Doplněk sešny A (pole `env.lightCell`) zamítnut 24. 11. 2026 | D-037, D-043; `brushLightMesh` znění 2, `brushHiddenFaces`, `levelLightMeshes`; test švů sešny A hlásí 0 bodů, varianta (b) není potřeba |


## Rozhodnuto ve vlně 2 (svodná sešna main 03, 24. 11. 2026)

| Návrh | Výsledek | Kde je to v základu |
|---|---|---|
| N-008 rozměry postavy v základu (B) | přijat a proveden | D-040; `src/xspace/body.js`, varování `portal.narrow` |
| N-109 dveře se otvírají od hráče (A) | přijat (Ondřej 24. 11. 02:26: „ať to jde do dat“) | D-042; věta v kontraktech, `doorOpenness`; zlatý vzorek `door_hinged_01` ±105° (24. 11. večer) |
| N-110 světlo v textuře (A) | **přijat, bod 5 cm** (Ondřej 25. 11. 0:00); zapéká xBake, velikost bodu je pole dat, `low` smí zmenšit na 10 cm; formát a kódování se zmrazí po zkoušce celého `complex_7` v xBake | D-043, D-050 |
| N-009 barva materiálu s texturou (B) | přijata varianta a1 (`color` = průměr povrchu, pole `albedoMean`) | D-045; `formats.js`, validátor `mat.albedoMean`, T1 |
| N-010 víc interakcí v prefabu (B) | **přijata varianta a a provedena** 25. 11. 2026: `components.interact` jako seznam s `id`, výběr podle zasaženého uzlu (`interactionOf`), `from` / `to` ve spojeních | D-052; `src/xspace/interact.js`, validátor `interact.id`, `interact.jointTwice`, `interact.solo`, `io.from`, `io.to`, T1c |
| N-111 soubory balíku ve hře (A) | přijat, body 1 až 4 provedeny; kontrola uzlu v `.glb` a strop velikosti odloženy | D-046; `read-pack.mjs`, `build.mjs`, `load.js` (`materialFrom`), validátor `ref.asset` pro textury, T1 |
| N-201 zbraně, munice a události boje (svodná) | **přijat ke zkoušce** 25. 11. 2026: zkušební druhy `ammo` a `weapon`, plazmová puška ve zlatém vzorku; zmrazí se po zkoušce sešen A a B | D-051, D-053; `formats.js`, `weapon.js`, `check-weapon.js`, T1d |
