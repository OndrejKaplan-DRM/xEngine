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
