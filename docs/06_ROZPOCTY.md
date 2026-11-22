# Rozpočty pro Lenovo T460

**Změřeno 22. 11. 2026** nástrojem xBench 0.1 na Ondřejově stroji (napájení ze sítě, jedna karta, Chrome 157). Surový výsledek: `docs/mereni/T460_2026-11-22_xbench-0.1.json`. U každé meze níže je uvedeno, zda stojí na měření, nebo je to dál odhad.

## Stroj

| Údaj | Hodnota | Zdroj |
|---|---|---|
| grafika | Intel HD Graphics 520, přes ANGLE na Direct3D 11 | xBench |
| procesor | 4 vlákna | xBench |
| paměť | 8 GB v jednom modulu (obsazen 1 slot ze 2), DDR3 | Správce úloh, snímek od Ondřeje |
| displej | 1920 × 1080 při měřítku Windows 125 % (prohlížeč hlásí 1536 × 864 a `devicePixelRatio` 1,25) | xBench |
| WebGL 2 | ano | xBench |
| WebGPU | prohlížeč ho nabízí; engine ho nepoužívá (D-001) | xBench |
| komprese textur | S3TC ano, BPTC ano, ETC2 ne, ASTC ne | xBench |
| největší textura, anizotropie | 16 384 px, 16× | xBench |
| volná paměť při běžné práci | 2,1 GB z 7,4 GB (otevřený prohlížeč a běžné programy) | Správce úloh |

Jeden modul znamená jednokanálovou paměť. Integrovaná grafika si paměť půjčuje od procesoru, takže druhý stejný modul vykreslování obvykle zrychlí. O kolik na tomto stroji, není změřeno; engine se navrhuje na stroj tak, jak je.

## Změřené časy snímku

Obraz 1366 × 768, pokud není uvedeno jinak. Medián a 95. percentil v milisekundách. Mez pro 60 snímků za sekundu je 16,6 ms.

| Případ | Volání | Trojúhelníky | Světla | Medián | 95 % |
|---|---|---|---|---|---|
| základ | 101 | 102 tis. | 0 | 2,3 | 3,3 |
| 200 volání | 201 | 97 tis. | 0 | 4,0 | 6,2 |
| 400 volání | 401 | 102 tis. | 0 | 3,9 | 7,8 |
| 800 volání | 801 | 106 tis. | 0 | 7,2 | 8,4 |
| 300 tis. trojúhelníků | 201 | 296 tis. | 0 | 5,6 | 6,5 |
| 600 tis. trojúhelníků | 201 | 594 tis. | 0 | 9,1 | 10,5 |
| 1,2 mil. trojúhelníků | 201 | 1 201 tis. | 0 | 16,0 | 18,2 |
| 4 bodová světla | 201 | 205 tis. | 4 | 14,0 | 16,2 |
| 8 bodových světel | 201 | 205 tis. | 8 | 17,3 | 18,8 |
| 16 bodových světel | 201 | 205 tis. | 16 | 22,8 | 24,4 |
| fyzikální materiál, 8 světel | 201 | 205 tis. | 8 | 22,8 | 25,5 |
| bez výpočtu světel (`MeshBasicMaterial`) | 201 | 205 tis. | 0 | 2,4 | 8,1 |
| stín 2 048 px, 4 světla | 201 | 205 tis. | 4 | 25,2 | 28,1 |
| 8 světel, obraz 1025 × 576 | 201 | 205 tis. | 8 | 14,0 | 15,1 |
| 8 světel, obraz 683 × 384 | 201 | 205 tis. | 8 | 7,9 | 8,9 |
| 8 světel, obraz 1920 × 1080 | 201 | 205 tis. | 8 | 23,3 | 24,9 |

## Co z měření plyne

| Zjištění | Výpočet z tabulky |
|---|---|
| Volání kreslení jsou levná: zhruba 5 µs na volání. | (7,2 − 4,0) ms / 600 volání |
| Trojúhelníky jsou levné: zhruba 11,5 ms na milion. | (16,0 − 5,6) ms / 905 tis. |
| **Světlo po pixelech je to, co stroj neunese.** Tatáž scéna stojí bez výpočtu světel 2,4 ms a se 4 bodovými světly 14,0 ms. Každé další světlo přidá zhruba 0,7 ms. | 14,0 proti 2,4; (22,8 − 14,0) / 12 |
| Stínová mapa jednoho bodového světla stojí 11 ms. | 25,2 − 14,0 |
| Fyzikální materiál stojí při 8 světlech o 5,5 ms víc než Lambertův. | 22,8 − 17,3 |
| Plné rozlišení displeje stojí při 8 světlech o 6 ms víc než 1366 × 768. | 23,3 − 17,3 |
| Čas snímku kolísá: 95. percentil bývá o 2 až 6 ms nad mediánem i u lehkých scén. | sloupec 95 % |

## Co měření neříká

- **Scéna xBench 0.1 pokrývá 64 až 67 % obrazu** (koule a podlaha, jinde pozadí; změřeno funkcí `coverage` ve verzi 0.2). Interiér pokryje každý pixel, takže všechno, co se počítá po pixelech, bude ve hře dražší než zde.
- Jedno a dvě světla po pixelech se neměřila. Cena „jednoho efektového světla“ (záblesk, baterka) je neznámá.
- Scéna bez výpočtu světel se neměřila v 1920 × 1080.
- Textury se neměřily vůbec.
- Křivka podle rozlišení není přímka (z 683 × 384 na 1025 × 576 přibylo 6,1 ms, z 1025 × 576 na 1366 × 768 jen 3,3 ms). Příčinu neznám; z malých rozdílů proto nedělám jemné závěry.
- Čas kroku simulace na T460 se neměřil; xBench měří jen vykreslení.
- Slovní verdikt xBench 0.1 („unese 4 bodová světla“) je příliš shovívavý: porovnává jediný případ s celými 16,6 ms a nenechává nic pro simulaci a výkyvy. Platí tabulka níže, ne verdikt.

## Rozpočty

Vykreslení má z 16,6 ms dostat nejvýš 10 ms; zbytek patří simulaci (dva kroky po 2 ms), prohlížeči a výkyvům.

| Veličina | Mez | Podklad | Kdo hlídá | Čím se změří |
|---|---|---|---|---|
| čas snímku | ≤ 16,6 ms, nikdy přes 33 ms | cíl | A | `?bench` ve hře na T460 |
| vykreslení | ≤ 10 ms | cíl | A | `?bench`, F3 |
| světla po pixelech pro statický svět | **0** | měření | A | test: ve scéně není `PointLight` |
| efektové světlo po pixelech | 0 do měření xBench 0.2; potom nejvýš 1 | neznámé | A | xBench 0.2 |
| stínová mapa | žádná | měření | A | test |
| materiál | `MeshBasicMaterial` s barvou vrcholů; `MeshStandardMaterial` ne | měření | A | test |
| vnitřní rozlišení | výchozí 768 řádků; volby 576, 768, 1080 | měření (jen se světly), pro scénu bez světel odhad | A | nastavení, `?bench` |
| volání kreslení na pohled | ≤ 400 | měření (400 volání ≈ 4 ms) | A | `renderer.info`, test |
| viditelné trojúhelníky | ≤ 300 tisíc | měření (296 tis. = 5,6 ms) | A, B | `renderer.info`, validátor |
| buňka mřížky světla | 0,5 m (xLab: 20 658 vzorků, 32 386 trojúhelníků; při 0,25 m 59 394 a 102 798) | spočteno ze zlatého vzorku | základ | `brushLightMesh` |
| komprese textur (od vlny 2) | cíle S3TC a BPTC | měření | B | manifest |
| krok simulace (120 Hz) | ≤ 2 ms | odhad | A | `E.profile`, F3 na T460 |
| alokace v kroku | žádné | zásada | A | test haldy |
| paměť textur | ≤ 256 MB | odhad | B | součet z manifestu |
| halda JavaScriptu | ≤ 400 MB | odhad | A | Chrome na T460 |
| start do menu, načtení levelu | ≤ 5 s, ≤ 5 s | odhad | A | T460 |
| výpočet vrstev světla při načtení xLabu | ≤ 2 s | odhad | A | T460 |
| prefab | ≤ 500 △ běžný, ≤ 2 000 △ složitý | odhad | B | validátor |
| buňka | ≤ 150 entit, ≤ 400 kvádrů | odhad | B | validátor |
| generování levelu (50 místností) | ≤ 1 s v Node | odhad | B | test |
| zapečení světla xLabu | ≤ 60 s v Node | odhad | B | test |
| kód enginu ve hře (bez Rapieru a dat) | ≤ 1,5 MB | cíl | A | výpis sestavení |
| celá regrese základu | ≤ 3 min | cíl | svodná | `npm test` |

Sandbox, ve kterém vznikají testy, kreslí softwarově na 2 jádrech. Jeho časy snímku s T460 nesouvisejí a nikde se neuvádějí jako výkon.

## Další měření

1. **xBench 0.2** je hotový (28 případů; prvních 16 beze změny kvůli srovnání). Nově měří: 0, 1 a 2 bodová světla; barvu vrcholů bez výpočtu světel i v 1080 řádcích; interiér pokrývající celý obraz (768, 576 a 1080 řádků, s texturou, s vyhlazováním hran, s jedním a se čtyřmi světly po pixelech). Verdikt počítá s rozpočtem vykreslení 10 ms. **Čeká na běh na T460.**
2. **`xlab.html?bench`** (sešna A, úkol A1.8): pevný průlet zkušebním levelem, výsledek jako JSON ke zkopírování. První měření skutečné hry včetně kroku simulace.
3. Kdyby do stroje přibyl druhý modul paměti: xBench znovu a nový soubor do `docs/mereni/`.
