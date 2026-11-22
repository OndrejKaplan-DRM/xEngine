# Rozpočty pro Lenovo T460

**Změřeno 22. 11. 2026** na Ondřejově stroji (Chrome 157): xBench 0.1 jednou (02:16) a xBench 0.2 třikrát (20:57, 21:32, 21:35). Surové výsledky: `docs/mereni/T460_2026-11-22_xbench-0.1.json` a `T460_2026-11-22_xbench-0.2_beh1.json` až `_beh3.json`. **Rozpočty stojí na nejhorším ze tří běhů verze 0.2**, protože se běhy od sebe liší (viz „Rozptyl“). U každé meze níže je uvedeno, zda stojí na měření, nebo je to dál odhad.

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

## xBench 0.2: tři běhy

Obraz 1366 × 768, pokud není uvedeno jinak. Medián v milisekundách ve třech bězích, nejhorší medián a nejhorší 95. percentil. Prvních 16 případů má stejnou scénu jako ve verzi 0.1 (ověřeno čtením kódu sešnou main 01).

| Případ | Běh 1 | Běh 2 | Běh 3 | Nejhorší medián | Nejhorší 95 % | Verze 0.1 |
|---|---|---|---|---|---|---|
| základ (101 volání, 102 tis. △) | 1,91 | 1,95 | 1,90 | 1,95 | 3,41 | 2,32 |
| 200 volání | 1,91 | 2,06 | 2,00 | 2,06 | 3,88 | 4,02 |
| 400 volání | 2,76 | 3,06 | 2,88 | 3,06 | 5,75 | 3,85 |
| 800 volání | 4,63 | 5,35 | 5,20 | 5,35 | 7,65 | 7,15 |
| 296 tis. △ | 3,83 | 3,63 | 3,78 | 3,83 | 7,20 | 5,60 |
| 594 tis. △ | 6,13 | 6,50 | 7,15 | 7,15 | 14,30 | 9,05 |
| 1 201 tis. △ | 14,50 | 9,70 | 11,85 | 14,50 | 16,50 | 16,00 |
| bez bodových světel (Lambert) | 2,38 | 2,44 | 2,43 | 2,44 | 5,27 | — |
| 1 bodové světlo | 4,52 | 4,32 | 4,40 | 4,52 | 7,45 | — |
| 2 bodová světla | 6,60 | 6,30 | 6,05 | 6,60 | 9,40 | — |
| 4 bodová světla | 6,80 | 7,70 | 10,35 | 10,35 | 15,80 | 14,00 |
| 8 bodových světel | 12,05 | 12,70 | 16,70 | 16,70 | 18,10 | 17,30 |
| 16 bodových světel | 23,10 | 23,20 | 23,10 | 23,20 | 25,70 | 22,80 |
| fyzikální materiál, 8 světel | 22,50 | 22,50 | 22,70 | 22,70 | 24,20 | 22,80 |
| stín 2 048 px, 4 světla | 24,60 | 23,90 | 24,50 | 24,60 | 28,30 | 25,20 |
| 8 světel, 1025 × 576 | 10,35 | 10,45 | 9,15 | 10,45 | 15,50 | 14,00 |
| 8 světel, 683 × 384 | 5,50 | 5,42 | 4,10 | 5,50 | 8,90 | 7,90 |
| 8 světel, 1920 × 1080 | 22,70 | 22,80 | 22,50 | 22,80 | 24,70 | 23,30 |
| bez výpočtu světel (`MeshBasicMaterial`) | 2,00 | 2,00 | 2,03 | 2,03 | 4,47 | 2,35 |
| barva vrcholů, bez výpočtu světel | 2,06 | 2,13 | 2,10 | 2,13 | 4,44 | — |
| barva vrcholů, 1920 × 1080 | 3,45 | 3,25 | 3,30 | 3,45 | 6,63 | — |
| **interiér přes celý obraz, barva vrcholů** | 2,41 | 2,41 | 2,44 | **2,44** | 4,81 | — |
| interiér, 1025 × 576 | 2,05 | 2,03 | 2,01 | 2,05 | 4,26 | — |
| interiér, 1920 × 1080 | 3,80 | 4,35 | 4,25 | 4,35 | 7,58 | — |
| interiér s texturou | 2,98 | 3,48 | 3,23 | 3,48 | 7,18 | — |
| interiér s vyhlazováním hran | 6,80 | 6,85 | 8,60 | 8,60 | 12,00 | — |
| interiér, 1 světlo po pixelech | 4,65 | 4,65 | 6,30 | 6,30 | 9,45 | — |
| interiér, 4 světla po pixelech | 9,85 | 10,45 | 10,70 | 10,70 | 12,55 | — |

### Co z verze 0.2 plyne

| Zjištění | Výpočet z nejhorších mediánů |
|---|---|
| **Světlo zapečené po vrcholech je levné a stálé.** Interiér přes celý obraz stojí 2,4 ms, v 1080 řádcích 4,4 ms. Ve třech bězích se liší nejvýš o 0,03 ms (768 řádků). | 2,44; 4,35 |
| **Jedno světlo po pixelech v interiéru stojí až 3,9 ms, čtyři 8,3 ms.** Čtyři světla samotná překročí rozpočet vykreslení 10 ms. | 6,30 − 2,44; 10,70 − 2,44 |
| Textura přidá 0,5 až 1,0 ms. | 3,48 − 2,44 (nejlepší běh 2,98 − 2,41) |
| Vyhlazování hran přidá 4,4 až 6,2 ms. | 8,60 − 2,44 (nejlepší běh 6,80 − 2,41) |
| Volání kreslení: zhruba 5,5 µs na volání. | (5,35 − 2,06) ms / 600 |
| Trojúhelníky: zhruba 11 ms na milion; 95. percentil je u 594 tis. △ až 14,3 ms. | (14,50 − 3,83) ms / 905 tis. |
| Stínová mapa a fyzikální materiál zůstávají mimo rozpočet. | 24,60; 22,70 |

### Rozptyl

- Případy bez výpočtu světel jsou ve všech třech bězích stejné na desetiny milisekundy (základ 1,90 až 1,95; interiér 2,41 až 2,44).
- Případy se světly po pixelech a s velkou geometrií se mezi běhy liší až o polovinu: 4 světla 6,80 až 10,35 ms (verze 0.1: 14,0), 8 světel 12,05 až 16,70 ms, 1,2 mil. △ 9,70 až 14,50 ms, interiér s jedním světlem 4,65 až 6,30 ms, vyhlazování hran 6,80 až 8,60 ms.
- Příčinu neznám (domněnka, neověřená: stav napájení a teplota procesoru s integrovanou grafikou). Verze 0.1 byla u prvních 16 případů pomalejší než všechny tři běhy verze 0.2 při stejné scéně.
- Důsledek: jeden běh nestačí a rozpočet nesmí stát na nejlepším čísle. Čím víc práce po pixelech, tím méně se dá na čas snímku spolehnout.

## Co měření neříká

- **Scéna xBench 0.1 pokrývá 64 až 67 % obrazu** (koule a podlaha, jinde pozadí; změřeno funkcí `coverage` ve verzi 0.2). Interiér pokryje každý pixel, takže všechno, co se počítá po pixelech, bude ve hře dražší než zde.
- Textura je změřená jedna, na jedné scéně. Kolik stojí desítky textur a kolik paměti snesou, změřeno není.
- Dvě světla po pixelech v interiéru se neměřila (jen jedno a čtyři).
- Interiér s texturou v 1080 řádcích se neměřil.
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
| efektové světlo po pixelech (záblesk, baterka) | nejvýš 1 naráz | měření 0.2 (interiér s jedním světlem 6,3 ms, se čtyřmi 10,7 ms) | A | test, `?bench` |
| vyhlazování hran | výchozí vypnuto; volba v nastavení | měření 0.2 (+4,4 až +6,2 ms) | A | nastavení |
| textury barvy na statickém světě a prefabech | povoleny | měření 0.2 (+0,5 až +1,0 ms za jednu texturu v interiéru) | A, B | `?bench` s texturami |
| stínová mapa | žádná | měření | A | test |
| materiál | `MeshBasicMaterial` s barvou vrcholů; `MeshStandardMaterial` ne | měření | A | test |
| vnitřní rozlišení | výchozí 768 řádků; volby 576, 768, 1080 | měření 0.2: interiér bez světel 2,4 ms v 768 a 4,4 ms v 1080 řádcích. O výchozích 1080 rozhodne až měření hry (`?bench`). | A | nastavení, `?bench` |
| volání kreslení na pohled | ≤ 400 | měření 0.2 (400 volání 3,1 ms, 800 volání 5,4 ms) | A | `renderer.info`, test, T5 |
| viditelné trojúhelníky | ≤ 300 tisíc | měření 0.2 (296 tis. = 3,8 ms, 95 % 7,2 ms; 594 tis. = 7,2 ms, 95 % 14,3 ms) | A, B | `renderer.info`, validátor |
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

1. **`xlab.html?bench`** (sešna A): pevný průlet zkušebním levelem, výsledek jako JSON ke zkopírování. První měření skutečné hry včetně kroku simulace. Engine z vlny 1 svítí po pixelech (8 světel) a kreslí s vyhlazováním hran v rozlišení okna × 1,25; podle tabulky výše tím rozpočet překračuje. Měřit má smysl až po převodu na světlo po vrcholech.
2. xBench 0.3, až bude potřeba: interiér s texturou v 1080 řádcích, víc textur naráz, dvě světla po pixelech v interiéru, pauza mezi případy.
3. Kdyby do stroje přibyl druhý modul paměti: xBench znovu a nový soubor do `docs/mereni/`.
