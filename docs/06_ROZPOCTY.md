# Rozpočty pro Lenovo T460

**Všechna čísla v této tabulce jsou odhad.** Vycházejí z rozpočtů Arény v2 (krok ≤ 2 ms, volání ≤ 400) snížených pro integrovanou grafiku. Závazná budou, až je nahradí měření `xbench.html` na Ondřejově stroji. Do té doby se podle nich navrhuje, ale netvrdí se, že na T460 platí.

## Cíl

60 snímků za sekundu při 1366 × 768, nebo při 1920 × 1080 s měřítkem vykreslení kolem 70 %. Nikdy pod 30.

## Tabulka

| Veličina | Mez (odhad) | Kdo hlídá | Čím se změří |
|---|---|---|---|
| čas snímku | ≤ 16,6 ms, nikdy přes 33 ms | A | xBench, potom F3 ve hře na T460 |
| volání kreslení na pohled | ≤ 300 | A | `renderer.info`, test |
| viditelné trojúhelníky | ≤ 250 tisíc | A, B | `renderer.info`, validátor (`tris`) |
| dynamická světla na viditelnou buňku | ≤ 4 | A | test |
| stínová mapa | výchozí vypnuto; nejvýš jedna 1 024 px | A | nastavení |
| krok simulace (120 Hz) | ≤ 2 ms | A | `E.profile` |
| alokace v kroku | žádné | A | test haldy |
| paměť textur | ≤ 256 MB | B | součet z manifestu |
| halda JavaScriptu | ≤ 400 MB | A | Chrome na T460 |
| start do menu | ≤ 5 s | A | T460 |
| načtení levelu | ≤ 5 s | A | T460 |
| prefab | ≤ 500 △ běžný, ≤ 2 000 △ složitý | B | validátor |
| buňka | ≤ 150 entit, ≤ 400 kvádrů | B | validátor |
| generování levelu (50 místností) | ≤ 1 s v Node | B | test |
| zapečení světla xLabu | ≤ 60 s v Node | B | test |
| kód enginu ve hře (bez Rapieru a dat) | ≤ 1,5 MB | A | výpis sestavení |
| celá regrese základu | ≤ 3 min | svodná | `npm test` |

## Co vím a co ne

- Vím (specifikace výrobce): T460 má Intel HD Graphics 520, procesor se 2 jádry a 4 vlákny, displej 1366 × 768 nebo 1920 × 1080.
- Nevím: jeden, nebo dva moduly paměti (jednokanálová paměť integrovanou grafiku citelně zpomaluje), rozlišení displeje, prohlížeč a ovladač, zda stroj při zátěži nesnižuje takt kvůli teplotě.
- Sandbox, ve kterém vznikají testy, kreslí softwarově na 2 jádrech. Jeho časy snímku s T460 nesouvisejí a nikde se neuvádějí jako výkon.

## Jak se rozpočty zpřesní

1. Ondřej spustí `xbench.html` na T460 (připojené napájení, jen jedna karta) a pošle výsledek.
2. Svodná sešna přepíše tabulku: mez = největší změřená hodnota, která se vešla do 16,6 ms, snížená o třetinu jako rezerva.
3. Výsledek rozhodne i tři otevřené volby: kolik světel smí svítit za běhu, zda má smysl stínová mapa a zda textury komprimovat (xBench vypisuje, které formáty grafika umí).
