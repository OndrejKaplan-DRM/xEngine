# N-103: co platí, když kloub nemá `speed`

Sešna: A · Datum: 2026-11-22 · Stav: přijatý, data jsou ve formátu

## Co potřebuju

Dohodu, jak rychle se kloub hýbe, když data `speed` neuvádějí, a jakou rychlostí ho ovládá hráč klávesou „použít“ u kloubu s `drive: manual`.

## Proč to bez toho nejde

Pole `speed` je v `formats.js` volitelné a ve zlatém vzorku ho má jen `door_hinged_01` (120 °/s) a `door_slide_01` (1,6 m/s). Vypínač, páka, tlačítko, zásuvka a ventil ho nemají, a přitom je hráč ovládá: vypínač se musí nějak rychle přehodit, tlačítko zamáčknout. Bez dohody si rychlost vymyslí engine a generátor sešny B nemá jak říct „tahle páka je těžká“.

## Návrh

1. Do kontraktu (`02_KONTRAKTY.md`, Prefab a kostra): „`speed` je rychlost pohonu **i ruky**. Když chybí, platí výchozí doba přejezdu celého rozsahu podle druhu interakce.“
2. Výchozí doby jako data v `formats.js` (aby je četl i xDesigner a `kit.html`):

| Druh | Doba přejezdu celého rozsahu |
|---|---|
| `button` | 0,06 s |
| `switch` | 0,10 s |
| `lever` | 0,25 s |
| `drawer` | 0,50 s |
| `door` | 1,00 s |
| `valve` | 3,00 s |
| jiné | 0,50 s |

3. Validátor: varování `rig.noSpeed`, když kloub s `drive: motor` nebo `both` nemá `speed` (pohon bez rychlosti je skoro jistě opomenutí).

## Dopad

Sešna B: generátory prefabů můžou `speed` vynechat a dostanou rozumné chování. Zlatý vzorek se měnit nemusí. Verze formátu se nemění.

## Dočasné řešení

Tabulka výše je v `src/world/joints.js` (`DEFAULT_TRAVEL_SECONDS`). Hodnoty jsou můj odhad, ne měření.

## Rozhodnutí

**Přijato body 1 a 2** (svodná sešna, 22. 11. 2026, D-033). Věta je v kontraktech, tabulka je ve `formats.js` jako `JOINT_TRAVEL_SECONDS`; sešna A ji začne číst odtud místo vlastní kopie v `joints.js`. Hodnoty jsou odhad, ne měření. **Bod 3 (varování `rig.noSpeed`) odložen:** nejdřív musí sešna B doplnit `speed` u kloubů s pohonem, jinak by varování shodilo přísnou kontrolu jejích balíků.
