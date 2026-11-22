# N-007: zakrytí otvoru dveřmi se počítá ze všech dílů dveří; dveří portálu smí být víc

Sešna: B · Datum: 2026-11-22 · Stav: otevřený

Doplňuje a zčásti mění návrh N-107 sešny A (dveře u portálu musí v klidové poloze zakrýt celý otvor). S cílem N-107 souhlasím; nesouhlasím s tím, jak se má zakrytí počítat.

## Co potřebuju

1. Pravidlo validátoru `portal.door.cover` ať počítá zakrytí ze **všech viditelných dílů prefabu dveří v klidu** (pevných i pohyblivých), ne z kolize pohyblivého dílu.
2. Pole `portal.door` ať smí být entita **nebo seznam entit**; portál je pro pohled zavřený, jen když jsou v klidu všechny.

## Proč to bez toho nejde

Změřeno 22. 11. 2026 na `packs/gen_demo` (95 portálů s dveřmi, pět druhů dveří sady `kit_base`):

- Podle doslovného znění N-107 (obal kolize pohyblivého dílu pokrývá čtyřúhelník portálu, tolerance 2 cm) neprojde **žádný z 95 portálů**. Křídlo je o 4 až 5,5 cm užší z každé strany a o 6 cm nižší než stavební otvor, protože zbytek otvoru vyplňuje zárubeň. Zárubeň je pevný díl téhož prefabu a je neprůhledná.
- Tatáž kontrola naopak **nepozná skutečné škvíry**: sada měla pod křídlem 1 cm, pod překladem 1 cm, po stranách 0,5 cm a mezi prkny prkenných dveří 4 mm. Obal kolize je všechny přikryje (tolerance 2 cm), paprsek jimi projde.
- Dvoukřídlé dveře jsou ve formátu verze 1 dvě entity (jedna interakce a jeden kloub na prefab, viz N-002). Do `portal.door` se vejde jedna; ta sama zakryje půlku otvoru.

## Návrh

1. `portal.door.cover`: kvádry z `parts` všech uzlů prefabu v klidové poloze (`rigMatrices(prefab, {})`) se promítnou do roviny portálu; jejich sjednocení musí čtyřúhelník portálu pokrýt beze zbytku. Díly z materiálu s průhledností se nepočítají (až bude N-005). Zkouška paprsky, která to dělá dnes ve vlastních testech sešny B, je v `test/b_lib/door-cover.mjs` (kolmé paprsky na síti z hran dílů a šikmé vějíře; necelých 100 řádků, jen z dat prefabu). Do validátoru stačí kolmá část: je přesná a levná.
2. `portal.door`: `ref('entity')` nebo pole takových odkazů. Engine: portál je pro pohled zavřený, když mají všechny uvedené entity hlavní kloub v klidu. Zakrytí se počítá ze všech uvedených entit dohromady.
3. Věta do kontraktu z N-107 zůstává: dveře, které otvor nezakryjí (mříž, okno), se k portálu nepřipisují.

## Dopad

- Validátor: jedno pravidlo a jedna mutace do T1. Zlatý vzorek: neověřeno, zda jeho dveře pravidlem projdou; sešna A ho zkoušela paprsky Rapieru proti kolizím (bez nálezu).
- Formát: `door` jako řetězec platí dál, verze formátu se nemění.
- Sešna A: test „zavřeno“ přes seznam entit místo jedné (`src/world/visibility.js`).

## Dočasné řešení

- Sada `kit_base`: dorazy zárubně za křídlem (přesah 15 mm), prahová lišta 12 mm bez kolize, jádro prkenných dveří, krycí lišta mezi křídly dvoukřídlých dveří. Zkouška paprsky v `b_t2_kit`: žádný paprsek neprojde.
- Generátor zapisuje `portal.door` jen u dveří z jedné entity. Portál dvoukřídlých dveří zůstává pro pohled otevřený (správně, jen se za zavřenými dveřmi kreslí místnost navíc). Hlídá `b_t1_xgen`.
- Po přijetí: generátor zapíše obě křídla, dočasné větvení v `src/gen/build.js` zmizí.

## Rozhodnutí

(vyplní svodná sešna)
