# N-008: rozměry postavy hráče v základu

Sešna: B · Datum: 2026-11-24 · Stav: otevřený

## Co potřebuju
Jedno místo v základu, odkud se čtou rozměry kapsle hráče a odstup kontroléru: generátor, engine i robot zkoušky A × B.

## Proč to bez toho nejde
Zadání B2.1 chce, aby generátor hlídal průchod „na šířku z profilu hráče“, ne natvrdo. Level xSpace nese jen jméno profilu (`profile: 'arena' | 'real'`); rozměry jsou v `src/play/profiles.js` (oblast sešny A, společný objekt `BODY`: poloměr 0,35 m, výška 1,8 m, schod 0,4572 m) a odstup v `src/phys/phys.js` (`CHARACTER_SKIN = 0.02`). Dnes jsou tedy na třech místech:

| Kdo | Kde | Hodnota |
|---|---|---|
| engine | `src/play/profiles.js`, `src/phys/phys.js` | 0,35 m a 0,02 m |
| robot zkoušky A × B | `test/t5_lib/nav.mjs` | `P.radius + 0.02` (odstup opsaný číslem) |
| generátor | `src/gen/body.js` (od 24. 11. 2026) | 35 cm a 2 cm |

Generátor běží i bez enginu (nástroje, prohlížeč levelů, později xDesigner), takže si `src/play` importovat nemá. Měření, proč na tom záleží: se starým poloměrem 0,32 m měl 11 z 200 levelů `complex` a 42 z 200 levelů `catacombs` místnost, kde mezi dvěma otvory nevedla cesta široká 0,74 m (kontrola `test/b_lib/level-checks.mjs`, mřížka 0,1 m, sandbox).

## Návrh
`src/xspace/body.js` (nebo oddíl v `formats.js`):

```js
export const BODY = { height: 1.8, radius: 0.35, eye: 1.6, stepHeight: 0.4572, stepMinWidth: 0.15, walkNormal: 0.7 }; // metry
export const CHARACTER_SKIN = 0.02; // m; odstup kontroléru postavy od překážek
export const bodyWidth = () => 2 * (BODY.radius + CHARACTER_SKIN); // 0,74 m: nejužší průchod, kterým postava projde
```

Profily pohybu (`arena`, `real`) si tělo berou odtud a přidávají jen rychlosti. Kdyby měly profily někdy různě velké tělo, patří rozměry do dat levelu vedle `profile`; dnes jsou stejné, proto konstanta.

Volitelně pravidlo validátoru (varování): portál s `passable` jiným než `false`, jehož otvor je užší než `bodyWidth()`.

## Dopad
- Sešna A: `src/play/profiles.js` a `src/phys/phys.js` hodnoty jen převezmou z `src/xspace`; chování se nemění.
- Základ: `test/t5_lib/nav.mjs` vezme odstup z konstanty.
- Sešna B: `src/gen/body.js` se zmenší na rezervu generátoru; `test/b_lib/player.mjs` bude číst základ místo oblasti sešny A.
- Formát, zlatý vzorek ani verze se nemění.

## Dočasné řešení
`src/gen/body.js` drží jedinou kopii v generátoru (poloměr, odstup, rezerva 3 cm) a předvolby ji předávají v `params().body`. Test `b_t1_xgen` čte skutečného hráče z `src/play/profiles.js` a `src/phys/phys.js` (jen čte) a selže, když je postava generátoru menší než hráč enginu. Nezávislé kontroly levelů (`test/b_lib/level-checks.mjs`) měří šířky rovnou hráčem z profilu levelu.

## Rozhodnutí
(vyplní svodná sešna)
