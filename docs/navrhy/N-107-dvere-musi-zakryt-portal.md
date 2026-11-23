# N-107: dveře u portálu musí v klidové poloze zakrýt celý otvor

Sešna: A · Datum: 2026-11-22 · Stav: přijatý s úpravou

## Co potřebuju

Pravidlo ve validátoru (a větu v kontraktu): kolize pohyblivého dílu dveří (`portal.door`) v klidové poloze kloubu zakrývá celý čtyřúhelník portálu.

## Proč to bez toho nejde

Viditelnost po buňkách (A1.7) bere zavřené dveře jako neprůhledné: buňka za nimi se nekreslí a její světla nesvítí. Když křídlo otvor nezakryje celý (užší křídlo, okno ve dveřích, mříž), je škvírou vidět pozadí scény místo místnosti. Engine to z dat poznat neumí; ve zlatém vzorku to sedí (zkouška paprsky v `a_17_cells`: 1 130 volných paprsků, žádný neprošel zavřenými dveřmi), u levelu z generátoru to nikdo nehlídá.

## Návrh

1. Validátor, nový kód `portal.door.cover`: pro každý portál s `door` spočítat obal kolizí uzlu s hlavním kloubem v klidové poloze a ověřit, že průmět do roviny portálu pokrývá jeho čtyřúhelník (tolerance 2 cm).
2. Kontrakt, oddíl o portálech: „Dveře, které otvor nezakryjí (mříž, dveře s oknem), se k portálu nepřipisují; portál pak zůstává pro viditelnost otevřený.“
3. Kontrakt, tamtéž, pro informaci generátoru: „Engine řadí viditelnou geometrii po plochách: plocha kvádru jde do buňky, do které míří. Pole `cell` kvádru rozhoduje jen u ploch, které nemíří do žádné buňky (ostění, práh, vnější strana).“

## Dopad

Jedno pravidlo validátoru a dvě věty kontraktu. Data zlatého vzorku se nemění.

## Dočasné řešení

Žádné v kódu. Test `a_17_cells` hlídá zlatý vzorek paprsky; pro balík sešny B stačí pustit tentýž test s `PACK=packs/<balík>`.

## Rozhodnutí

**Přijato s úpravou** (svodná sešna, 22. 11. 2026, D-033 a D-034). Bod 2 nahrazuje `interact.seeThrough` z N-003: mříž nebo prosklené dveře se k portálu **připisují** (zavírají průchod a zvuk) a příznak říká, že pohled nezavírají. Bod 3 (řazení ploch do buněk) je v kontraktech. Bod 1 (pravidlo `portal.door.cover`) přijat jen pro dveře bez `seeThrough`; do validátoru ho doplní svodná sešna během vlny 2. Do té doby hlídá zlatý vzorek test `a_17_cells`.
