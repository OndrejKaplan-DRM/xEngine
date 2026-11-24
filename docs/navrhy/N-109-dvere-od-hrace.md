# N-109: Otočné dveře se otvírají od hráče

Sešna: A · Datum: 2026-11-24 · Stav: otevřený

## Co potřebuju

Aby otočné dveře v balících měly kloub s rozsahem na obě strany od klidové polohy (`min < rest < max`), tam kde to zárubeň dovolí.

## Proč to bez toho nejde

Ondřej 24. 11. 2026 k D-025: dveře, které se otvírají k hráči, se o něj zastaví a po 0,5 s zavřou; chce, aby se otvíraly vždy od hráče (s tím, že se k tématu možná vrátí). Kloub `door_hinged_01` má rozsah 0° až 105°, tedy jen na jednu stranu, a `rigMatrices` hodnotu mimo rozsah ořízne. Engine to z dat změnit nemůže.

## Návrh

Formát se nemění; mění se data a jedno pravidlo výkladu.

1. **Data:** otočné dveře, které se smějí otvírat na obě strany, mají `min = −max` a `rest = 0` (zlatý vzorek `door_hinged_01`; v sadě sešny B dveře bez dorazů v zárubni). Dveře s dorazem zůstávají jednostranné.
2. **Kontrakt (věta k tabulce interakcí):** „Dveře s klidovou polohou uvnitř rozsahu kloubu jsou zavřené v `rest`; vstup `open` je otevře k tomu dorazu, kam se křídlo vzdaluje od toho, kdo otvírá. Výstup `opened` platí pro oba dorazy.“
3. **Validátor:** pravidlo `portal.door.cover` (D-036) počítat v poloze `rest`, ne v `min`.

## Dopad

- Sešna A: hotovo a otestováno (`src/world/behaviors.js`, `test/a_14_swing.mjs`, 8 kontrol): strana se volí podle polohy hráče; `toggle`, `close`, `opened`, `closed`, ořez pohledem i brána světla počítají s klidovou polohou uvnitř rozsahu. Jednostranné dveře se chovají jako dosud.
- Sešna B: rozhodnout u každého prefabu dveří, jestli má dorazy. Podle D-036 a N-007 je dnes mají.
- Zlatý vzorek: jedna hodnota v `tools/golden/make.mjs`.
- Verze formátu se nemění.

## Dočasné řešení

Přepínač `?doors=away` (`entities.doorsAway`, `src/world/swing.js`): otočným dveřím s rozsahem na jednu stranu rozšíří rozsah souměrně; entita dostane kopii prefabu, balík se nemění. Výchozí stav je vypnuto. U dveří s dorazem v zárubni projde křídlo při otevření na druhou stranu dorazem (jen vzhled). Po přijetí návrhu soubor `swing.js` zmizí.

## Rozhodnutí

