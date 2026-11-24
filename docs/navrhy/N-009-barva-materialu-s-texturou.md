# N-009: Barva materiálu s texturou

Sešna: B · Datum: 2026-11-24 · Stav: otevřený

## Co potřebuju

Rozhodnout, co znamená `color` u materiálu, který má `albedo`, a jak se textura s barvou skládá.

## Proč to bez toho nejde

Dvě pravidla v projektu si odporují:

1. **Formát** (`src/xspace/formats.js`, materiál): `color` je „základní barva (násobí texturu)“. To je zvyk glTF (`baseColorFactor` × `baseColorTexture`).
2. **N-006, bod „Pravidla“, a D-029:** `color`, `rough` a `metal` platí vždy; jsou to hodnoty stupně 0 (`clean`, nástroje) a záloha, když se textura nenačte. Z `color` dnes počítá i xBake (barva odrazu) a jen z `color` kreslí xView a engine sešny A.

Obojí platí přesně jen tehdy, když má textura průměr 1. Vyfocená textura ho nemá. Změřeno na 21 materiálech sady `kit_base` (B2.4, 24. 11. 2026; průměr textury lineárně, z hotového souboru 512 px):

| Materiál | `color` | průměr textury | `color` / průměr | z textury |
|---|---|---|---|---|
| `brick_red` | 0,45 0,24 0,18 | 0,28 0,14 0,08 | 1,6 1,7 2,1 | barva |
| `concrete_dark` | 0,27 0,27 0,28 | 0,09 0,10 0,09 | 2,9 2,8 3,2 | barva |
| `concrete_raw` | 0,50 0,50 0,48 | 0,09 0,10 0,09 | 5,4 5,2 5,4 | barva |
| `concrete_smooth` | 0,40 0,40 0,39 | 0,09 0,10 0,09 | 4,3 4,2 4,4 | barva |
| `dirt_packed` | 0,27 0,21 0,15 | 0,14 0,12 0,09 | 1,9 1,8 1,7 | barva |
| `lino_grey` | 0,44 0,46 0,44 | 0,27 0,27 0,27 | 1,6 1,7 1,6 | šedá kresba |
| `metal_floor` | 0,33 0,34 0,36 | 0,15 0,15 0,17 | 2,2 2,2 2,2 | barva |
| `plaster_green` | 0,52 0,61 0,54 | 0,41 0,37 0,35 | 1,3 1,7 1,5 | barva |
| `plaster_grey` | 0,62 0,62 0,60 | 0,41 0,37 0,35 | 1,5 1,7 1,7 | barva |
| `plaster_light` | 0,80 0,79 0,74 | 0,41 0,37 0,35 | 2,0 2,2 2,1 | barva |
| `steel_brushed` | 0,62 0,64 0,66 | 0,29 0,30 0,32 | 2,1 2,1 2,1 | barva |
| `steel_dark` | 0,18 0,19 0,21 | 0,29 0,30 0,32 | 0,6 0,6 0,7 | barva |
| `steel_painted` | 0,36 0,42 0,47 | 0,07 0,07 0,07 | 5,2 6,1 6,8 | šedá kresba |
| `stone_block` | 0,42 0,40 0,37 | 0,06 0,06 0,06 | 7,2 6,8 6,3 | šedá kresba |
| `stone_pale` | 0,60 0,58 0,53 | 0,36 0,36 0,36 | 1,7 1,6 1,5 | šedá kresba |
| `stone_rough` | 0,33 0,31 0,29 | 0,23 0,23 0,23 | 1,4 1,3 1,2 | šedá kresba |
| `tile_grey` | 0,50 0,53 0,55 | 0,95 0,94 0,94 | 0,5 0,6 0,6 | barva |
| `tile_white` | 0,82 0,84 0,84 | 0,95 0,94 0,94 | 0,9 0,9 0,9 | barva |
| `wood_oak` | 0,50 0,36 0,20 | 0,23 0,23 0,23 | 2,1 1,5 0,9 | šedá kresba |
| `wood_old` | 0,25 0,17 0,10 | 0,12 0,09 0,06 | 2,0 1,8 1,6 | barva |
| `wood_pine` | 0,72 0,58 0,38 | 0,17 0,12 0,07 | 4,3 5,0 5,4 | barva |

Poměr je 0,53 až 7,18. Co by to udělalo:

- **Doslovně „color násobí texturu“** s dnešními barvami: u 18 z 21 materiálů bude povrch s texturou 1,3× až 7× tmavší než týž povrch bez ní (stupeň 0, xView, dnešní engine A), u obou dlaždic a tmavé oceli světlejší. Odraz z xBake by neodpovídal tomu, co je vidět.
- **Zesílení zapéct do textury** (přebarvit ji při odvození tak, aby průměr = `color`): při zesílení 2 až 7 se světlá místa useknou na 1 a kresba se zploští.

Vedlejší nález: ploché barvy sady jsou proti vyfoceným povrchům u 18 z 21 materiálů světlejší, většinou 1,5× až 5,5× (beton 0,50 proti 0,09; smrk 0,72 proti 0,17). Barvy vznikly bez předlohy („nikdo je neviděl na skutečné grafické kartě“, `tools/forge/materials.mjs`). Jestli je stáhnout k realistickému albedu a vyrovnat to expozicí, je otázka vzhledu pro Ondřeje, ne tohoto návrhu.

## Návrh

**Varianta a (doporučuji):** u materiálu s `albedo` je `color` průměrná barva povrchu (lineárně). Běh, který texturu kreslí, ji násobí zesílením `color / průměr textury`, ne samotnou barvou. Kdo texturu nekreslí, kreslí `color` a vidí týž průměr.

- a1, průměr v datech: nové volitelné pole materiálu `albedoMean: [r, g, b]` (lineárně, 0 až 1, průměr souboru `albedo`). Zapisuje ho nástroj, který texturu vyrobí (xForge: `tools/forge/textures.mjs` ho už počítá z hotového souboru a má ho v `tools/forge/kit/textures.lock.json`). Validátor: pole jen spolu s `albedo`, složky větší než 0.
- a2, průměr počítá běh: při načtení textury zmenšením na 1 × 1 bod v lineárních hodnotách. Bez změny formátu, ale každý spotřebitel (engine, xView, xBake) to musí umět sám a výsledek závisí na filtru zmenšení.

Doporučuji a1: jedna pravda v datech, levné za běhu, xBake a xView se nemusí učit dekódovat obrázky.

**Varianta b:** zvyk glTF. `color` násobí texturu (u textury tedy zpravidla [1, 1, 1]) a stupeň 0 dostane nové pole `flatColor`. Funguje, ale zdvojí barvu u každého materiálu s texturou a xBake, xView i dnešní engine musí přejít na `flatColor`.

**Varianta c:** zesílení zapéct do textury. Zamítám sama: měřeno, zesílení až 7,2×, světlá místa se useknou.

U variant a i b platí: kde se odstín textury od barvy materiálu liší víc než 1,35× (poměr největšího a nejmenšího zesílení kanálů), bere xForge z textury jen kresbu v šedi a barvu dává materiál. Jinak by z rezavě červeného plechu vznikl modrý plech s modrou rzí. Týká se to 5 z 21 materiálů (sloupec „z textury“).

## Dopad

- Formát: popis pole `color` (a1: plus pole `albedoMean`). Verze formátu se nemění (pole je volitelné).
- Engine sešny A (A2.6 textury): kreslit `albedo × (color / albedoMean)`; normálovou mapu jen na stupni 2 a 3.
- xView, xBake: beze změny (berou `color`).
- Zlatý vzorek: textury nemá, beze změny.
- D-030: tohle je zkouška na víc než jednom kusu. Galerie sady kreslí podle varianty a od 24. 11. 2026 a test `b_t3_galerie` hlídá, že průměrný jas stěny s texturou je do 10 % od téže stěny bez textury (naměřeno nejvýš 7,6 %, 21 materiálů).

## Dočasné řešení

- `packs/kit_base`: `color`, `rough`, `metal` beze změny; přibylo `albedo`, `normal` a `uvScale` (rozměr předlohy ze záznamu xSearcheru). Průměr textury a zesílení jsou zatím jen v `tools/forge/kit/textures.lock.json` (pole `files[…].mean`, `materials[…].gain`).
- Galerie sady (`dist/kit.html`) kreslí podle varianty a.
- **Pro sešnu A do rozhodnutí:** u materiálů z `kit_base` texturu buď nekresli, nebo si průměr spočítej při načtení (a2). Doslovné „`color` × textura“ dá povrch 2× až 7× tmavší.

## Rozhodnutí

(vyplní svodná sešna)
