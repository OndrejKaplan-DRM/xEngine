# Návrhy změn základu a kontraktů

Sešna A ani B nemění soubory základu ani soubory druhé sešny. Když něco potřebuje, napíše návrh. Rozhoduje svodná sešna při slučování.

## Postup

1. Soubor `N-<číslo>-<téma>.md` v této složce, číslo další volné (obě sešny číslují ve vlastní řadě: A od 101, B od 001, aby se nesrazily).
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
| N-001 zapečené světlo | nepodán; sešna B ho napíše s úkolem xBake | — |
| N-002 svázané klouby | přijat, základ dluží | D-034 |
| N-003 portál jen pro pohled, průhledné dveře | přijat | `formats.js`, validátor, T1 |
| N-004 údaje pro rozmisťování | přijat | `components.place`, T1 |
| N-005 průhlednost materiálu | přijat | `materials[].opacity`, T1 |
| N-006 stupně kvality a vrstvy vzhledu | přijat po částech | D-029, D-030 |
| N-101 díly prefabu v `geom.js` | přijat, základ dluží (první v pořadí) | D-034 |
| N-102 `rigMatrices` bez alokací | přijat, základ dluží | D-034 |
| N-103 výchozí rychlost kloubu | přijaty body 1 a 2, varování odloženo | `JOINT_TRAVEL_SECONDS`, kontrakty |
| N-104 dosah interakce | přijat | kontrakty |
| N-105 přesvícený xLab | přijat, provede se po převodu světla | D-034 |
| N-106 plocha obrazovky | přijat | `screen.offset`, zlatý vzorek |
| N-107 dveře musí zakrýt portál | přijat s úpravou | kontrakty; pravidlo validátoru dluží základ |

