# Stav sešny A

**Vlna:** 2 · **Větev:** `sesna-a` (sloučeno se `zaklad-2` = `a995347`, znění 3) · **Datum:** 24. 11. 2026, stav ve 03:30

## Stav 24. 11. 2026: Ondřejova zkouška na T460, základ 2 znění 3

Poslední běh `npm run test:all` na `25e17a4`: **727 kontrol, 0 selhalo** (základ 254, skupina A 344 ve 22 sadách, skupina B 92, zkouška A × B 37). Sandbox.

### Co jsem udělala

| Co | Stav | Čím doloženo |
|---|---|---|
| sloučení `zaklad-2` znění 3 (`a995347`: D-037, N-101) | hotovo | vzorky z `levelLightMeshes`; `src/world/parts.js` zrušen, díly z `src/xspace`; švy v `a_17_view` 128 → 0, mez testu je 0 |
| zkouška D-032 (terminál v Chrome na T460) | **prošla** (Ondřej, 24. 11.) | ve starém sestavení fungoval jen Esc a Pokračovat; v novém odchází pravé tlačítko i šipka dolů. Výslovně nepotvrzeno: po Esc a Pokračovat hráč dál sedí |
| nápověda terminálu po odchodu visela dál (snímky z `complex_7`) | opraveno | `interact:left` ji schová |
| dveře od hráče (Ondřejova volba 4 b) | engine hotov, data ne | `a_14_swing` (8 kontrol); návrh **N-109**; zkouška v prohlížeči adresou `?doors=away` |
| stíny po 5 cm (Ondřej: „chci 0,05 m“) | **vrcholy to neumí**; návrh **N-110** (světlo v textuře) | čísla v návrhu; obrázek `xLab_podlaha_haly_stiny_2026-11-24.png` |
| F3: průběh stavby světla | hotovo | řádek světel ukazuje „STAVÍ SE n %“, dokud vrstvy nejsou hotové |

### Měření T460 z přehledu F3 (Ondřejovy snímky, 24. 11., sestavení `cc7893f`)

Chrome, okno asi 1 918 × 878 bodů. „Snímek“ je čas procesoru na snímek ve skriptu (dva kroky a odeslání kreslení); **čas grafiky F3 neměří**. Hodnoty jsou klouzavé průměry.

| # | Level, buňka | Řádky, vyhlazování, mřížka | Snímků/s | Snímek | Krok | player | phys | Volání | △ |
|---|---|---|---|---|---|---|---|---|---|
| 1 | xLab, `c_lab` | 768, ne, 0,5 m | 60 | 2,18 | 0,47 | 0,23 | 0,14 | 25 | 8 948 |
| 2 | xLab, `c_lab` | 768, ne, 0,25 m | 60 | 3,75 | 0,93 | 0,45 | 0,34 | 13 | 13 018 |
| 3 | xLab, `c_hall` | 768, ne, 0,25 m | 60 | 4,00 | 0,84 | 0,48 | 0,29 | 50 | 107 108 |
| 4 | xLab, u terminálu | 768, ne, 0,25 m | 53 | 2,84 | 0,62 | 0,01 | 0,49 | 9 | 12 714 |
| 5 | xLab, `c_hall` | 1080, ne, 0,25 m | 60 | 4,39 | 1,04 | 0,50 | 0,37 | 30 | 93 820 |
| 6 | xLab, `c_lab` | 1080, ne, 0,25 m | 60 | 2,75 | 0,70 | 0,34 | 0,25 | 10 | 12 878 |
| 7 | xLab, `c_lab` | 1080, **ano**, 0,25 m | 60 | 7,41 | 1,57 | 0,80 | 0,61 | 17 | 22 216 |
| 8 | xLab, `c_hall` | 1080, **ano**, 0,25 m | **44** | 10,74 | 1,58 | 0,81 | 0,62 | 34 | 89 240 |
| 9 | `complex_7`, `c_tech_03` | 1080, ano, 0,25 m | 56 | 15,83 | 1,64 | 0,85 | 0,61 | 49 | 16 842 |
| 10 | `complex_7`, `c_office_04` | 1080, ano, 0,25 m | 60 | 12,69 | 1,49 | 0,79 | 0,50 | 29 | 6 648 |
| 11 | `complex_7`, `c_lab_03` | 1080, ano, 0,25 m | **45** | 16,51 | 2,01 | 0,93 | 0,71 | 55 | 23 646 |
| 12 | `complex_7`, `c_lab_01` | 1080, ano, 0,25 m | **49** | 17,53 | 1,89 | 0,96 | 0,68 | 92 | 32 416 |
| 13 | `complex_7`, `c_corr_01`, chůze | 576, ne, 0,5 m | 60 | 9,40 | 0,60 | 0,33 | 0,19 | 117 | 16 826 |
| 14 | `complex_7`, `c_office_02` | 576, ne, 0,5 m | 60 | 5,92 | 0,47 | 0,19 | 0,22 | 92 | 11 482 |
| 15 | `complex_7`, `c_lab_03` | 576, ne, 0,5 m | 60 | 7,44 | 1,47 | 1,09 | 0,23 | 100 | 14 902 |

Stavba vrstev světla na T460: xLab 0,5 m 1 231 ms, 0,25 m 1 471 ms (staré sestavení s jedním paprskem 584 ms); `complex_7` 0,5 m **24,3 s**, 0,25 m **44,4 s**.

**Co z toho plyne (měřeno):**

1. **Náprava kroku fyziky (A2.3) na T460 zabrala.** `phys` v `complex_7` je 0,19 až 0,23 ms bez vyhlazování a 0,49 až 0,71 ms s ním; svodná sešna na sestavení z vlny 1 naměřila v témže levelu 2,10 ms. Krok je pod mezí 2 ms ve 14 pohledech z 15 (jednou 2,01 ms, s vyhlazováním v 1080 řádcích).
2. **Největší díl kroku je teď `player`** (0,19 až 1,09 ms), ne fyzika.
3. **Vyhlazování hran v 1080 řádcích neudrží 60 snímků/s** (hala xLabu 44). Zůstává vypnuté.
4. **1080 řádků bez vyhlazování drží 60 snímků/s** v obou zkoušených pohledech xLabu, i s mřížkou 0,25 m a 93 820 △. Čas grafiky ale neznám; výchozí rozlišení změním až podle `?bench&rows=1080`.
5. **Stavba světla při načtení je pro levely sešny B příliš dlouhá** (24 až 44 s). Hra při ní běží, ale ubírá jí až 8 ms na snímek. Tyhle levely potřebují zapečené světlo.

**Co z toho neplyne (výklad, neověřeno):** tytéž systémy stojí se zapnutým vyhlazováním v 1080 řádcích dvakrát až třikrát víc (`phys` 0,25 → 0,61 ms v téže buňce). Práce je stejná; čtu to tak, že procesor a grafika sdílejí příkon a při plné zátěži grafiky procesor zpomalí. Snímky 9 až 12 mohly vzniknout během stavby světla (do 1,5 min po startu); nové F3 to už ukáže.

### Pravidlo bran světla pro základ (dodatek k D-035)

`src/world/occlusion.js` má na fyzice jedinou závislost: funkci „protíná úsečka stavbu?“ (`phys.raycast` s maskou `LIGHT_RAY`, tedy jen kvádry a klíny levelu, bez prefabů). V rozhraní Rapier není; základ ji může nahradit vlastním průnikem úsečky s kvádry. Co pravidlo potřebuje:

- **vstup:** kvádry levelu (stínítka), portály s `door` (obdélník portálu a id entity dveří), světlo;
- **výsledek pro vzorek:** −1 zastíněno, 0 volná cesta, jinak brána. Brána = množina dveří, jejichž portálem úsečka ke světlu prochází; jedny dveře mají bránu se svým id, víc dveří společnou (svítí součinem otevření);
- **konstanty:** vzorek se zvedne o 0,02 m po normále; paprsek začíná 0,03 m směrem ke světlu a končí 0,02 m před ním; světlo ležící na ploše se pro zkoušku odsune 0,1 m od stavby;
- **vzorek ve stavbě** (paprsek 0,1 mm vzhůru něco zasáhne) přebírá bránu od souseda přes hranu, který světlo vidí;
- **otevření dveří** = |hodnota − rest| / největší vzdálenost dorazu od `rest` (platí i pro dveře na obě strany, N-109);
- **okraj stínu po podílech** (`lightfield.soften`) je nadstavba: vzorek pak smí být ve více úsecích, v každém svým podílem. Zapečený soubor to musí dovolit (řídké kódování to umí, husté ne).


## Vlna 2 (zadání `START_A.md`, oddíl „vlna 2“): stav 23. 11. 2026

Navázala jsem po přerušení na `5626629`. Základ se mezitím pohnul na `zaklad-2`; podle V2.0 jsem ho sloučila (`a1d3081`, bez konfliktu) a pustila celou regresi. Poslední běh `npm run test:all` na `b77837f`: **702 kontrol, 0 selhalo** (základ 237, skupina A 336 ve 21 sadách, skupina B 92, zkouška A × B 37). Sandbox, Node 22, Chromium bez grafické karty.

Sestavení pro Ondřeje z `cc7893f`: `xLab_A02_2026-11-23.html` (4 921 kB, SHA-256 `2cf024f06f84e3c8…`) a `xLab_gen_A02_2026-11-23.html` (5 327 kB, `674799dc2d9cf192…`); obě se v menu hlásí „xEngine 0.1 · vlna 2, krok 1 (A02) · 2026-11-23“.

### Úkoly proti sloupci „Hotovo, když“

| # | Stav | Čím doloženo |
|---|---|---|
| A2.1 světlo po vrcholech | **hotovo** | průchod scénou nenajde žádné `Light` (`a_12_view`); místo za sloupem v hale je tmavší: 0,194 se sloupem × 1,590 bez něj, lineárně před expozicí (`a_18_light`); přepnutí lampy mění jen úroveň vrstvy, halda neroste (`a_18_light`, `a_lib/heap`); snímky proti xView s novým prahem (`a_12_view`, `a_18_view`); `test:axb` zelená (37). Zavřenými dveřmi světlo neprochází: vrstva má úseky po „branách“, úsek skrz dveře se násobí jejich otevřením (`src/world/occlusion.js`). |
| A2.2 obraz a měření | **hotovo** | řádky 576, 768, 1080 a `setPixelRatio(1)`; vyhlazování hran výchozí vypnuté, v nastavení; každé nastavení projde `apply/probe` (`a_11_shell`, 23 kontrol); `?bench` doběhne v xLabu (`a_18_bench`) i v `xlab_gen.html?level=0` (sonda: `complex_7`, zkrácená trasa, 11 s, JSON vydán). JSON nese medián a 95 % času snímku, krok po systémech, volání, △, velikost obrazu, řetězec grafiky; nově i počty těles a profil Rapieru. |
| A2.3 krok simulace | **příčina a náprava změřeny v sandboxu; číslo z T460 chybí** | viz oddíl níže |
| A2.4 dluhy vlny 1 | **hotovo**, zkouška D-032 čeká na Ondřeje | skok na nový stisk (`a_13_player`); D-025 (`a_14_block`, 18 kontrol); „Rozhraní entit“ níže; terminál podle D-024 (`a_16_view`, `a_16_manip`) |
| A2.5 nová pole základu | nezačato | |
| A2.6 textury a sítě | nezačato | |
| A2.7 | nezačato | |

### D-024 a D-032: terminál

Výsledek zkoušky starého řešení v Chrome na T460 (Ondřej, 22. 11., snímky obrazovky): **Esc u terminálu hru shodil do pauzy.** Staré řešení (zámek kurzoru se u terminálu uvolní, Esc = odejít) tedy neobstálo a D-024 platí.

Nové řešení (`5626629`): zámek kurzoru se u terminálu vůbec nepouští. Myš vede vlastní kurzor po obrazovce ve světě (`interact.cursor`), levé tlačítko je „použít“ v jeho místě, klávesnice píše. **Odchod: šipka dolů nebo pravé tlačítko myši.** Klávesa „použít“ (E) k odchodu být nemůže, protože se u terminálu píše. Esc je pauza i tady (prohlížeč při Esc zámek pustí vždy); po návratu hráč dál sedí. Test s podvrženým zámkem: za celý pobyt 0 žádostí o zámek, 0 uvolnění, 0 událostí `pointerlockchange`. **Ve skutečném Chrome neověřeno**; je to Ondřejova zkouška z `STATE.md`, bod 1.

### D-025: dveře a zásuvky na pohon nikoho nedrtí

Než se nová hodnota kloubu roznese do těles, zkusí se kolize dílu v nové poloze proti kapsli postavy a volným tělesům (`phys.obstructs`). Stojí-li něco v cestě, krok se zruší a díl stojí jako pevné těleso, aby se od něj dalo odejít. Pohon, který stojí 0,5 s, se vrátí tam, odkud vyjel. Formát se nemění, nový výstup není.

- Překážka je průnik hlubší než 2 mm, který posun prohlubuje. Dotyk a věc, která se veze s dílem, překážka není (bedna opřená o dveře z druhé strany otevření nebrání).
- Platí pro druhy `door` a `drawer`. Tlačítko, vypínač, páka a ventil se nehlídají.
- Pružina, zarážka a ruka hráče jen stojí; vrací se jen pohon.
- Vrácené dveře ohlásí `closed` (nebo `opened`), jako by dojely; `opened` po nepovedeném otevření nikdy.
- Změřeno v Node (`a_14_block`): otočné dveře se o hráče zastaví na 22° ze 105°, nejmenší mezera 1,59 mm, po 0,500 s se vrátí, hráč se nepohne (0,000 mm). O bednu se zastaví na 6°, bedna se nepohne. Posuvné dveře se o hráče ve dveřích zastaví na 0,860 m z 0,98 m a znovu otevřou.
- **Co hráč pozná:** dveře, které se otvírají k němu, se o něj zastaví a za půl sekundy zavřou. Musí ustoupit. Dveře už také neodtlačí bednu.

### Jemnější stíny (Ondřejova volba 2 b)

Dvě věci, obě v mé oblasti:

1. **Okraj stínu po podílech** (`lightfield.soften`, zapnuto). Vzorek, jehož soused vidí světlo jinak, se neptá jedním paprskem, ale 4 × 4 paprsky ze své plošky, a svítí podílem. Zub po buňkách mřížky se změní v plynulý přechod a hrana leží, kde má. **Mřížka vzorků se nemění**, kontrakt 0,5 m platí. Dílčí bod za zdí se nepočítá (světlo ani stín přes zeď neprosáknou).
2. **Volitelná mřížka 0,25 m** (nastavení Obraz → Mřížka světla, platí od nové hry; adresa `?grid=0.25`). Tohle je skutečně jemnější stín. Výchozí zůstává 0,5 m, protože na ní stojí kontrakt a zapečené světlo z xBake (N-001); proto je to volba, ne výchozí stav.

| Varianta (xLab) | Vzorků | Položek ve vrstvách | Zjemněno | △ stavby | Paprsků | Stavba vrstev |
|---|---|---|---|---|---|---|
| 0,5 m, jeden paprsek | 22 898 | 30 829 | 0 | 34 970 | 65 588 | 170 ms |
| 0,5 m, okraj po podílech (**výchozí**) | 22 898 | 31 722 | 1 697 | 34 970 | 214 096 | 473 ms |
| 0,25 m, jeden paprsek | 72 829 | 102 546 | 0 | 126 966 | 211 201 | 401 ms |
| 0,25 m, okraj po podílech | 72 829 | 104 275 | 3 257 | 126 966 | 510 074 | 804 ms |

Tabulka je po sloučení znění 3 základu 2 (D-037: jiná mřížka, bez schovaných ploch, strop dílků hrany 256); před ním bylo 23 199 a 63 392 vzorků. Časy jsou ze sandboxu (Node), orientační; počty platí všude. Pohled do haly: 12 volání a 22 930 △ při 0,5 m, 67 302 △ při 0,25 m. Rozpočet T460 je 300 tisíc viditelných △; cena 0,25 m na T460 **změřená není**. Level sešny B `complex_7` má při 0,5 m 151 952 vzorků, z toho 12 867 zjemněných, a vrstvy se staví 6,9 až 7,2 s (sandbox, prohlížeč): takové levely potřebují zapečené světlo.

Co zjemnění neumí: stín užší než buňka mřížky (hned za sloupem) zůstává schodovitý i při 0,25 m; je to mez světla po vrcholech.

### A2.3: krok simulace

**Rozpad kroku v sandboxu** (Node, hráč stojí, všechna volná tělesa do 1 s usnou):

| Level | Kolidery (bez tělesa) | Tělesa (volná / pevná / kinematická) | `world.step()` | z toho jádro Rapieru | z toho obal po kroku |
|---|---|---|---|---|---|
| xLab | 75 | 12 | 9,4 µs | 2,3 µs | 6,7 µs (71 %) |
| `complex_7` | 1 079 (916) | 160 (43 / 116 / 1) | 95,1 µs | 2,2 µs | 91,4 µs (96 %) |
| `complex_21` | 998 (831) | 155 (37 / 117 / 1) | 89,3 µs | 2,3 µs | 84,5 µs (95 %) |

**Příčina (doložená čtením kódu a měřením):** obal Rapieru 0.21 po každém `world.step()` volá `mapNewSoftBodies()`. Ta projde zpětným voláním z WASM všechna tělesa a všechny kolidery a hledá nová a zrušená. Cena roste s počtem koliderů, ne s děním ve scéně. Počet těles, která nespí, příčinou není (v klidu 0 ze 43), kinematické těleso je jediné (hráč).

**Náprava** (`phys.lazyMap`, zapnuto): obal se pouští jen v kroku po změně. Tělesa a kolidery vznikají a zanikají jen přes `src/phys/phys.js`, který si změnu poznačí. Výsledek simulace je shodný na bit (`a_12_step`: 52 hodnot, rozdíl 0).

| Celý krok hry | Před | Po | Poměr |
|---|---|---|---|
| `complex_7`, hráč stojí | 119,5 µs | 10,1 µs | 11,8× |
| `complex_7`, hráč chodí | 151,6 µs | 34,3 µs | 4,4× |
| `complex_21`, hráč stojí | 109,6 µs | 9,0 µs | 12,2× |
| `complex_21`, hráč chodí | 134,2 µs | 33,4 µs | 4,0× |
| xLab, hráč stojí | 25,2 µs | 10,1 µs | 2,5× |
| `complex_7` v prohlížeči (`?bench`, zkrácená trasa): medián kroku | 0,24 ms | 0,11 ms | 2,2× |
| totéž, systém `phys` | 0,173 ms | 0,035 ms | 4,9× |

Všechno sandbox. **Co nevím:** jestli tohle vysvětluje 0,64 až 3,50 ms z T460. Sandbox měl na obalu 0,09 ms, T460 hlásí u fyziky 0,6 až 3,1 ms, tedy 7× až 34× víc, a mezi dvěma pohledy téhož levelu se liší pětkrát při stejném počtu koliderů. Jeden stroj takový rozptyl pomalejším procesorem nevysvětlí. Proto `?bench` nově vydá: krok po systémech, počty těles a koliderů a kolik jich nespí, profil kroku přímo z Rapieru a „pevnou práci“ (smyčka ve skriptu a 5 000 paprsků; v sandboxu 3,1 až 3,3 ms a 9,2 až 11 ms). Poměr pevné práce mezi stroji řekne, kolikrát je T460 pomalejší; zbytek je rozdíl v tom, co krok dělá. Přehled F3 má nový řádek „fyzika“ (kolidery, volná tělesa, kolik nespí, kinematická).

## Sešna A02: přechod na znění 2 (`START_A.md`, oddíl 2a)

`origin/zaklad-1` se 22. 11. ve 21:50 posunul na `16548b4`; od té chvíle se stavělo. Poslední celý běh (na commitu `30e9f24`, sestavení „vlna 1, znění 2 (A02)“): `npm test` 232 kontrol, `npm run test:a` 18 sad z 18, 297 kontrol, vše zeleně. Soubor pro Ondřeje `xLab_A02_2026-11-22.html` je bajtově `dist/xlab.html` z tohoto commitu (SHA-256 `5e7f23cd603fbc00…`).

| Krok 2a | Co | Stav |
|---|---|---|
| 1 | sloučit znění 2 | hotovo, bez konfliktů |
| 2 | importy Shellu ze `src/shell`, rozpad velikosti v `a_00_build` | hotovo |
| 3 | nejdřív zelená | na `7d3bec6` i po sloučení 16 sad z 16; tři selhání ze zadání se týkala commitu `949d478` |
| 4 | světlo po vrcholech (D-022) | hotovo: síť z `brushLightMesh`, vrstvy z `lightIrradiance`, `MeshBasicMaterial` s barvou vrcholů; zásobník `PointLight`, Lambert a nastavení počtu světel zrušeny |
| 5 | vnitřní rozlišení (D-023), vyhlazování hran | hotovo: 576, 768, 1080 řádků (výchozí 768), `setPixelRatio(1)`; vyhlazování výchozí vypnuté, přepíná se v nastavení za běhu |
| 6 | oddíl „Rozhraní entit“; zablokovaný pohyb dveří (D-025); světlo dílů po stěnách | oddíl hotov (níže); světlo dílů hotovo; **D-025 neuděláno** |
| 7 | snímky proti xView znovu | hotovo: rozdíl 0,46 až 1,13 z 255 (dřív 0,01 až 0,18); srovnává se bez zastínění, které xView nemá |
| 8 | `?bench`; klidný režim podle D-024 | `?bench` hotov; **D-024 neuděláno** (terminál dál uvolňuje zámek kurzoru a Esc od něj odchází bez pauzy) |
| A1.8 | zastínění vrstev světla | hotovo, včetně dveří jako bran (Ondřejova volba 2a) |
| – | skok 3b | hotovo |

**Co Ondřej uvidí jinak než ve vlně 1:** plochy jsou osvětlené po vrcholech mřížky 0,5 m, takže hrany stínů jsou zubaté a světlo těsně u stropu dělá hranatou skvrnu. Zeď světlo zastaví, zavřené dveře také; při otevírání světlo přibývá. Na hranách místností mohou problikávat jednotlivé tmavé body (švy sítí, N-108).

### Ondřejovy odpovědi na otázky A01

| # | Otázka | Volba | Důsledek |
|---|---|---|---|
| 1 | ventil | a | beze změny |
| 2 | světlo a zavřené dveře | a | zachováno i se světlem po vrcholech: část vrstvy, která svítí otvorem portálu s dveřmi, se násobí otevřením dveří (`occlusion.js`) |
| 3 | skok v profilu `arena` | **b** | hotovo: každý výskok na nový stisk; stisk ve vzduchu platí při dopadu, dokud se klávesa drží (jako Quake III). Profil `real` skáče jen stiskem na zemi (jako Half-Life) |
| 4 | lékárnička | a | beze změny |
| 5 | scissor | a | čekat na měření; viz výklad níže |

### Měření T460: čtyři běhy (xBench 0.1 jednou, xBench 0.2 třikrát)

Stroj: Intel HD Graphics 520 (ANGLE, Direct3D 11), Chrome 157, 4 vlákna, 8 GB, displej 1536 × 864 při zvětšení 1,25 (= 1920 × 1080 bodů), WebGL 2 ano, textury S3TC a BPTC ano, ETC2 a ASTC ne. Metoda v obou verzích stejná: vykreslení a `readPixels` jednoho bodu (čeká na grafiku), 2,5 s na případ, medián. Prvních 16 případů má v 0.2 stejnou scénu jako v 0.1. Časy běhů: 0.1 ve 02:16, 0.2 ve 20:57, 21:32 a 21:35 (třetí běh hned po druhém). Mediány v ms; poslední sloupec je nejhorší 95. percentil ze všech běhů.

| Případ | Volání | △ (tis.) | Světla | Obraz | Materiál a příznaky | 0.1 | 0.2 č. 1 | 0.2 č. 2 | 0.2 č. 3 | 95 % max |
|---|---|---|---|---|---|---|---|---|---|---|
| `zaklad` | 101 | 102 | 0 | 1366 × 768 | Lambert | 2,32 | 1,91 | 1,95 | 1,90 | 3,41 |
| `volani_200` | 201 | 97 | 0 | 1366 × 768 | Lambert | 4,02 | 1,91 | 2,06 | 2,00 | 6,15 |
| `volani_400` | 401 | 102 | 0 | 1366 × 768 | Lambert | 3,85 | 2,76 | 3,06 | 2,88 | 7,80 |
| `volani_800` | 801 | 106 | 0 | 1366 × 768 | Lambert | 7,15 | 4,63 | 5,35 | 5,20 | 8,35 |
| `tris_300` | 201 | 296 | 0 | 1366 × 768 | Lambert | 5,60 | 3,83 | 3,63 | 3,78 | 7,20 |
| `tris_600` | 201 | 594 | 0 | 1366 × 768 | Lambert | 9,05 | 6,13 | 6,50 | 7,15 | 14,30 |
| `tris_1200` | 201 | 1201 | 0 | 1366 × 768 | Lambert | 16,00 | 14,50 | 9,70 | 11,85 | 18,20 |
| `svetla_4` | 201 | 205 | 4 | 1366 × 768 | Lambert | 14,00 | 6,80 | 7,70 | 10,35 | 16,20 |
| `svetla_8` | 201 | 205 | 8 | 1366 × 768 | Lambert | 17,30 | 12,05 | 12,70 | 16,70 | 18,80 |
| `svetla_16` | 201 | 205 | 16 | 1366 × 768 | Lambert | 22,80 | 23,10 | 23,20 | 23,10 | 25,70 |
| `pbr_8` | 201 | 205 | 8 | 1366 × 768 | fyzikální | 22,80 | 22,50 | 22,50 | 22,70 | 25,50 |
| `zapecene` | 201 | 205 | 0 | 1366 × 768 | bez světel | 2,35 | 2,00 | 2,00 | 2,03 | 8,05 |
| `stin_2048` | 201 | 205 | 4 | 1366 × 768 | Lambert, stín 2048 | 25,20 | 24,60 | 23,90 | 24,50 | 28,30 |
| `meritko_75` | 201 | 205 | 8 | 1025 × 576 | Lambert | 14,00 | 10,35 | 10,45 | 9,15 | 15,50 |
| `meritko_50` | 201 | 205 | 8 | 683 × 384 | Lambert | 7,90 | 5,50 | 5,42 | 4,10 | 8,90 |
| `fhd_8` | 201 | 205 | 8 | 1920 × 1080 | Lambert | 23,30 | 22,70 | 22,80 | 22,50 | 24,90 |
| `svetla_0` | 201 | 205 | 0 | 1366 × 768 | Lambert | – | 2,38 | 2,44 | 2,43 | 5,27 |
| `svetla_1` | 201 | 205 | 1 | 1366 × 768 | Lambert | – | 4,52 | 4,32 | 4,40 | 7,45 |
| `svetla_2` | 201 | 205 | 2 | 1366 × 768 | Lambert | – | 6,60 | 6,30 | 6,05 | 9,40 |
| `vrcholy` | 201 | 205 | 0 | 1366 × 768 | bez světel, barva vrcholů | – | 2,06 | 2,13 | 2,10 | 4,44 |
| `vrcholy_fhd` | 201 | 205 | 0 | 1920 × 1080 | bez světel, barva vrcholů | – | 3,45 | 3,25 | 3,30 | 6,63 |
| `interier` | 202 | 207 | 0 | 1366 × 768 | bez světel, barva vrcholů, interiér | – | 2,41 | 2,41 | 2,44 | 4,81 |
| `interier_576` | 202 | 207 | 0 | 1025 × 576 | bez světel, barva vrcholů, interiér | – | 2,05 | 2,03 | 2,01 | 4,26 |
| `interier_fhd` | 202 | 207 | 0 | 1920 × 1080 | bez světel, barva vrcholů, interiér | – | 3,80 | 4,35 | 4,25 | 7,58 |
| `interier_tex` | 202 | 207 | 0 | 1366 × 768 | bez světel, barva vrcholů, interiér, textura | – | 2,98 | 3,48 | 3,23 | 7,18 |
| `interier_aa` | 202 | 207 | 0 | 1366 × 768 | bez světel, barva vrcholů, interiér, vyhlazování | – | 6,80 | 6,85 | 8,60 | 12,00 |
| `interier_1` | 202 | 207 | 1 | 1366 × 768 | Lambert, barva vrcholů, interiér | – | 4,65 | 4,65 | 6,30 | 9,45 |
| `interier_4` | 202 | 207 | 4 | 1366 × 768 | Lambert, interiér | – | 9,85 | 10,45 | 10,70 | 12,55 |

### Co z měření čtu pro běh (výklad, ne měření)

1. **Opakovatelnost.** Mezi třemi běhy verze 0.2 se lehké případy (do 5 ms) liší nejvýš o 17 % a nejtěžší (nad 22 ms) o 3 %. Střední pásmo skáče: 4 světla 6,8 až 10,4 ms, 8 světel 12,1 až 16,7 ms, 1,2 mil. △ 9,7 až 14,5 ms, jedno světlo v interiéru 4,65 až 6,3 ms. Běh verze 0.1 byl v lehkých a středních případech o 20 až 110 % pomalejší (200 volání 4,0 ms proti 1,9 až 2,1 ms; 4 světla 14,0 ms), v nejtěžších stejný. Hodnota 14,0 ms pro 4 světla tedy není rozpor mezi verzemi, ale rozptyl stroje. Příčinu neznám; domněnka (neověřená): řízení taktu grafiky podle zátěže a teploty.
2. **Čtyři nejtěžší případy vycházejí ve všech čtyřech bězích 22,5 až 25,2 ms**, ačkoli jde o různou zátěž (16 světel, fyzikální materiál s 8 světly, stín se 4 světly, 8 světel při 1920 × 1080). Buď shoda okolností, nebo strop daný metodou měření. Patří to svodné sešně (xBench je základ).
3. **Světlo po vrcholech (D-022) měření potvrzuje.** Interiér přes celý obraz bez výpočtu světel: 2,41 až 2,44 ms při 1366 × 768 ve všech třech bězích, 3,80 až 4,35 ms při 1920 × 1080.
4. **Co bylo v `06_ROZPOCTY.md` neznámé a teď je změřené** (interiér, 1366 × 768, proti 2,4 ms): textura +0,6 až +1,1 ms; vyhlazování hran +4,4 až +6,2 ms; jedno světlo po pixelech +2,2 až +3,9 ms; čtyři +7,4 až +8,3 ms. Jedno efektové světlo se tedy do 10 ms vejde, vyhlazování má být ve výchozím stavu vypnuté. Světlo po pixelech ani vyhlazování se při 1920 × 1080 neměřily.
5. **Volání a trojúhelníky nejsou úzké hrdlo:** 801 volání 4,6 až 7,2 ms, 594 tis. △ 6,1 až 9,1 ms. xLab má 9 až 57 volání.
6. **xLab z vlny 1 by na T460 60 snímků/s nejspíš nedržel** (kreslil v rozlišení okna × 1,25, s vyhlazováním a s 8 světly po pixelech; nejbližší změřený případ `fhd_8` má 22,5 až 23,3 ms). Převod podle oddílu 2a to řeší; skutečné číslo dá `?bench` na T460.
7. **Scissor (otázka 5):** xBench neměří překreslování, takže přímo nerozhoduje. Bod navíc stojí při barvě vrcholů 1,1 až 1,9 ms na milion bodů; ořez by ušetřil zlomky ms. Doporučení: do vlny 2 nedávat, vrátit se k němu podle `?bench` skutečné hry.

## Hotovo × neuděláno (úkoly podle znění 2)

| Úkol | Stav | Test | Poznámka |
|---|---|---|---|
| A1.1 kostra aplikace | hotovo | `a_00_build` 3, `a_11_app` 21 (Node), `a_11_shell` 22 (prohlížeč) | Shell ze `src/shell`; vnitřní rozlišení a vyhlazování v nastavení; na displeji T460 (okno 1536 × 864, `devicePixelRatio` 1,25) se kreslí 1365 × 768. **Neuděláno:** vstup jako samostatný „záměr“ pro tvory (vstup má dnes záměr hráče, `__xe.key` a `__xe.look` jdou stejnou cestou) |
| A1.2 statický svět a světlo po vrcholech | hotovo | `a_12_world` 13 (Node), `a_12_view` 9 (prohlížeč) | 23 199 vzorků v xLabu (z toho 21 901 na kvádrech), vrstva na světlo, změna úrovně jako rozdíl; ve scéně žádné světlo three.js |
| A1.3 hráč a profily | hotovo | `a_13_player` 41 (Node), `a_13_walk` 7 (prohlížeč) | skok na nový stisk |
| A1.4 entity a kostry | hotovo kromě D-025 | `a_14_entities` 20 (Node), `a_14_view` 7 (prohlížeč) | světlo dílů: jedna hodnota na stěnu, přepočet při pohybu dílu nebo změně světla v dosahu. **Neuděláno:** dveře se o stojícího hráče nezastaví a nevrátí (D-025) |
| A1.5 použít a spojení | hotovo | `a_15_io` 18 (Node), `a_15_use` 11 (prohlížeč) | lampy mění úroveň vrstvy světla; 500 stisků včetně snímků: halda +83 kB |
| A1.6 manipulace a klidný režim | hotovo podle znění 1 | `a_16_manip` 39 (Node), `a_16_view` 20 (prohlížeč) | **Neuděláno:** D-024 (zámek kurzoru má u terminálu zůstat, Esc má být všude pauza, odchod klávesou „použít“) |
| A1.7 buňky a portály | hotovo (podle D-027 patřilo až do vlny 2) | `a_17_cells` 16 (Node), `a_17_view` 17 (prohlížeč) | výběr světel podle buněk zrušen (světlo je po vrcholech); clona v otvoru zavřených dveří |
| A1.8 obraz a měření | hotovo | `a_18_light` 11 (Node), `a_18_view` 13, `a_18_bench` 9 (prohlížeč) | zastínění paprskem Rapieru, dveře jako brány, stavba vrstev po částech s oznámením průběhu, F3, `?bench` |

## Rozhraní entit (D-026; popis toho, co existuje)

**Entita za běhu** (`src/world/entities.js`) = umístěný prefab:

- totožnost: `id`, `index` (pořadí v levelu, klíč pro spojení), `def` (záznam z levelu), `prefab`, `cell`;
- kostra: `joints` (jeden záznam na kloub: `value`, `vel`, `target`, `speed`, `active`, `held`, `from`, `blocked`), `guard` (díly se zastaví o hráče a volná tělesa; druhy `door` a `drawer`), `values` (id kloubu → hodnota pro `rigMatrices`), `nodeWorld` (id uzlu → světová matice), `movers` (uzly, které se hýbou: matice, díl ve vykreslení, těleso ve fyzice, záznam ve světle);
- stav: `state { locked, on, level, phase, enabled, rep }`. Je společný všem druhům; druh ho jen jinak čte;
- součásti z prefabu: `comp` (`interact`, `light`, `physics`, `pickup`, `screen`), `kind` = `comp.interact.kind`;
- vazby: `body` a `home` (dynamické těleso a výchozí poloha), `colliders`, `light` (záznam ve světle), `links` (spojení výstupů).

**Jak se součást hlásí ke svému systému.** Součásti nemají vlastní třídy. Při načtení (`instantiate`) entita předá každému systému to jeho: vykreslení sítě dílů (`render.addStatic` pro pevné díly, `render.addMover` pro pohyblivé), fyzice tělesa a kolize (`phys.addBody`, `phys.addCollider` s odkazem `{ kind: 'entity', ent, node }`), světlu záznam lampy (`light.addLight`) a pohyblivé díly (`light.addMover`). Chování podle `kind` je tabulka funkcí v `src/world/behaviors.js` (`init`, `use`, `input`, `onJoint`); engine o „dveřích“ neví nic, co není v ní. Obrazovky a manipulaci drží vrstva xPlay (`src/play/interact.js`, `terminal.js`).

**Co jde do uloženého stavu** (`snapshot` systému `entities`, pole v pořadí entit): `s` = kopie `state`; `j` = pro každý kloub `[value, vel, target, speed, active, from, blocked]` (`from` = odkud pohon vyjel, `blocked` = jak dlouho stojí o překážku; D-025); `b` = u dynamického tělesa poloha, otočení, rychlosti a spánek (14 čísel). Zvlášť se ukládá fronta spojení (`io`: pořadí, vypálená spojení `once`, čekající záznamy), spouštěče (`world`) a hráč. Neukládá se: text terminálu, světlo (dopočítá se ze stavu lamp a dveří) a nic z vykreslení.

**Události:** `io:fired` (každé provedené spojení), `level:checkpoint`, `level:complete`, `level:message` (cíl `@level`), `interact:used`, `interact:denied`, `interact:seated`, `interact:left`, `player:jumped`, `player:landed`. Výstupy prefabů (`opened`, `on`, `changed`…) nejsou události jádra: jdou rovnou do fronty spojení (`io.fire`).

**Co bych před zmrazením změnila:** (1) `state` je jedna společná struktura s poli, která většina druhů nepoužívá; s tvory a zbraněmi poroste. (2) Entita drží odkazy na záznamy tří systémů (`movers[].mover`, `.body`, `.lit`); čistší by byl jeden „díl“ s jedním rozhraním. (3) Jedna interakce a jeden hlavní kloub na prefab je mez formátu (verze 1), ne enginu; `behaviors.js` s ní ale počítá.

## Jak je to postavené

- `src/app/game.js` skládá jádro a systémy a **nezná DOM**. Tentýž kód běží ve hře (`src/app/main.js`, vykreslení three.js) i v testech v Node (`src/render/null.js`, vykreslení bez obrazu). Fyzika, hráč, kostry a spojení se proto testují v Node za zlomek sekundy; prohlížeč zůstává na obraz a Shell.
- `src/app/main.js` přidává plátno, Shell (`src/shell` přes adaptér), zámek kurzoru (`lock.js`), HUD a háček `__xe` (`hook.js`).
- Styl Shellu se nekopíruje: `import css from '../shell/shell.css' with { type: 'text' }` (esbuild 0.28.2 to umí bez úpravy `build.mjs`).
- Nastavení (`src/app/settings.js`): zorné pole, vnitřní rozlišení (576, 768, 1080 řádků; výchozí 768), vyhlazování hran (výchozí vypnuté), citlivost myši, profil pohybu (jen s `?dev`, neukládá se).
- **Vnitřní rozlišení** (D-023): `setPixelRatio(1)` a `setSize(šířka podle poměru stran okna, řádky)`; plátno na velikost okna roztahuje CSS. **Vyhlazování hran** je vlastnost kontextu WebGL a za běhu se přepnout nedá, proto přepnutí vymění plátno za nové a vykreslovač postaví znovu (`render.setAntialias`); scéna zůstává. Kvůli tomu myš a zámek kurzoru visí na obalu `#view`, ne na plátně.
- Akce a klávesy jsou data (`src/play/actions.js`): pohyb šipkami i WASD, skok mezerník a pravé tlačítko, použít E a Enter, uchopit levé tlačítko.
- **Manipulace** (`src/play/interact.js`): úchop je bod, kam dopadl paprsek pohledu. Engine spočítá, kudy se ten bod na obrazovce hýbe na jednotku kloubu, a posun myši promítne do tohoto směru. Úchop tedy sleduje myš: páka nahoru a dolů, ventil za obvod po kružnici, ventil za střed prostým pohybem do strany. Díl, který se hýbe hlavně k hráči a od něj (zásuvka, křídlo dveří zepředu), se ovládá pohybem myši k sobě a od sebe, dvakrát rychleji. Pohled se při tažení neotáčí. Doraz na mez se hlásí hned, i když hráč díl ještě drží.
- **Klidný režim**: po „použít“ u prefabu se `station` kamera za 0,4 s přejede na `eye`, míří na `look`, zorné pole podle dat; tělo stojí. Zámek kurzoru se uvolní, kurzor se promítá na plochu obrazovky (průsečík paprsku s rovinou uzlu). Klávesnice jde na obrazovku: Enter vyšle výstup `command` s napsaným textem, kliknutí na obrazovku `command` s textem `click`, vstup `print` vypíše řádek. Esc vrací do hry (nepauzuje) a vyšle `left`. Obsah obrazovky je text na 2D plátně mapovaném na plochu ve světě (`src/play/terminal.js`, `render.addScreen`).
- **Viditelnost** (`src/world/visibility.js`, systém `vis`): před každým vykreslením (háček `render.beforeDraw`) se z buňky kamery projdou portály. Každý portál zúží výhled na obdélník, který zabírá na obrazovce; portál mimo ten obdélník se dál neprochází. Dveře v klidové poloze portál zavírají. Oko blíž než 0,3 m k otvoru ho nezužuje (průchod dveřmi bez probliknutí). Vypnout jde adresou `?novis` nebo `__xe.vis(false)`.
- **Stěna má dvě strany** (`src/world/cells.js`): zeď patří v datech jedné buňce, ale vidět je ze dvou místností. Viditelná geometrie se proto řadí po plochách: plocha kvádru jde do dávky buňky, do které míří. Plocha, která nemíří do žádné buňky (ostění, práh), jde do všech buněk, kterých se kvádr dotýká. Dveře v portálu: pevné díly (zárubeň) jsou v dávkách obou buněk, pohyblivé (křídlo) se kreslí, když je vidět aspoň jedna z nich.
- **Světlo po vrcholech** (D-022; `src/world/lightfield.js`, `lighting.js`): vzorek = vrchol statické dávky (kvádry přes `brushLightMesh` s buňkou 0,5 m, pevné díly prefabů svými vrcholy). Každé světlo má vrstvu: řídký seznam (index vzorku, E při plné úrovni). Barva vzorku = okolní člen + Σ úroveň × barva × E / π; materiál je `MeshBasicMaterial` s barvou vrcholů. Změna úrovně je přičtení rozdílu přes vzorky vrstvy, bez alokací, a provede se jednou před vykreslením (`light.flush`), ne při každém přepnutí. Vykreslení půjčuje pole barev (`render.statics`, ovladače dílů) a po změně je nahraje (`touch`).
- **Pohyblivé díly** (křídlo dveří, páka, bedna): jedna hodnota na stěnu dílu (`src/world/facets.js`), vzorec ve středu stěny; přepočet jen když se díl pohnul nebo se změnilo světlo v dosahu.
- **Zastínění** (A1.8; `src/world/occlusion.js`): paprsek Rapieru ze vzorku ke světlu, stíní jen stavba levelu (kolizní skupina `SOLID` = kvádry; prefaby stín nevrhají). Začátek paprsku se posouvá o 3 cm ke světlu, aby neležel v rovině sousedního kvádru; světlo sedící na ploše (lampa na stropě) se pro zkoušku odsune 10 cm od stavby. Vzorek, který leží ve stavbě (síť stěny pokračuje za roh pod sousední zeď), přebírá viditelnost od souseda přes hranu, jinak by se od rohu do místnosti táhl tmavý pruh. Pohyblivý díl: jeden paprsek ze středu dílu.
- **Dveře jako brána** (Ondřejova volba 2a): vede-li volná cesta ze vzorku ke světlu otvorem portálu, který má dveře, patří vzorek do úseku vrstvy s bránou a svítí úrovní světla × otevření dveří (0 až 1 z hodnoty kloubu). Zavřenými dveřmi tak světlo neprochází a při otevírání přibývá. Dveře samy paprsek nezastavují.
- **Stavba vrstev po částech**: ve hře v prohlížeči se vrstvy staví po světlech, nejvýš 8 ms na snímek, s oznámením „Počítám světlo: N %“; hra mezitím běží s tím, co je hotové. Testy a Node staví naráz (`light.incremental = false`).
- **Clona portálu**: buňka za zavřenými dveřmi se nekreslí, takže škvírou kolem křídla prosvítalo pozadí; v otvoru zavřených dveří je proto černá plocha (`render.addShutter`).
- **Měření ve hře** (`src/app/bench.js`; adresa `?bench` nebo klávesa F9): robot projde trasu složenou z dat (buňky a portály), v každé buňce se rozhlédne; čas snímku se měří kolem celého `E.tick` s čekáním na grafiku (`readPixels`, stejně jako xBench). Volby adresy: `&rows=576|768|1080`, `&aa=1`, `&quick`.
- **Vývojářské vrstvy** (`src/app/dev.js`): F3 přehled (snímky, čas snímku a kroku, krok po systémech, velikost obrazu, volání, △, kreslené buňky, počet světel a vzorků světla, buňka kamery, rychlost, poloha), F4 obrysy buněk a portálů (buňka kamery žlutě, viditelná zeleně, schovaná šedě; portál viděný azurově, otevřený mimo výhled modře, zavřený červeně). Fungují i bez `?dev`.
- Krátké ťuknutí klávesy se neztratí: stisk si vstup pamatuje do nejbližšího kroku (`src/play/input.js`). Bez toho při nízké snímkové frekvenci mizelo „použít“ kratší než jeden snímek.

## Změřená čísla

| Co | Hodnota | Kde a jak |
|---|---|---|
| kód enginu bez Rapieru a dat | viz `a_00_build` (three 524 kB, Shell 18 kB, zbytek kód sešny A a základ) | rozpad z esbuild metafile |
| celý soubor `dist/xlab.html` | 4,85 MB, z toho Rapier s WASM asi 4,2 MB | výpis sestavení po A1.2 |
| snímek ze startu proti xView | průměrný rozdíl kanálu 0,03 z 255; šum dvou běhů 0,000 | `a_12_view`, 1366 × 768, softwarové vykreslení, zorné pole 60°, 12 světel, bez prefabů |
| volání kreslení ze startu, statický svět | 17 (= počet dvojic buňka × materiál), 640 △ | `a_12_view`, bez viditelnosti po buňkách |
| T1 rychlost po 2 s po rovině | arena 8,13 m/s, real 6,35 m/s (= max profilu) | `a_13_player`, Node |
| T2 série výskoků s úkrokem, arena | 15,1 m/s = 186 % max po 3 výskocích; real stejným robotem 104 % | `a_13_player`; robot drží ideální úhel, člověk dosáhne méně |
| výška výskoku | arena 1,131 m (teorie 1,157), real 1,114 m (teorie 1,140) | `a_13_player`; rozdíl je půl kroku integrace |
| krok simulace, jen hráč a statický svět | 0,08 až 0,12 ms (hráč 0,06, Rapier 0,01 až 0,04) | `a_13_walk`, `E.profile`, sandbox: **orientační, ne výkon T460** |
| pohledy start, laboratoř, hala proti xView (s prefaby) | rozdíl 0,01 / 0,18 / 0,18 z 255; volání 52 / 27 / 12 | `a_14_view`, 1366 × 768, zorné pole 60°, 12 světel; bez viditelnosti po buňkách |
| dávky a pohyblivé díly xLabu | 29 dávek (buňka × materiál), 23 sítí pohyblivých dílů, 1 668 △ prefabů = součet `tris` z dat | `a_14_entities` |
| krok hráče podle situace | stojí 0,05 ms, běh 0,07 ms, tlačí do zdi 0,20 ms, schody 0,04 ms | sonda v Node, průměr 240 kroků, sandbox: **orientační** |
| tlačítko → dveře → lampa | dveře 0,98 m za 0,61 s (1,6 m/s z dat), lampa přesně 36 kroků po `opened` | `a_15_io`, Node |
| 500 použití tlačítka po zahřátí | halda +76 kB (15 000 kroků, 1 998 spojení); růst se zastaví, není to únik (332 kB po 500, 406 kB po 3 000 bez zahřátí) | `test/a_lib/heap.mjs`, Node s `--expose-gc` |
| průměrný jas pohledů po zapnutí lamp | start 170, chodba 179, laboratoř 217, hala 162 z 255 | `a_15_use`, softwarové vykreslení; viz N-105 |
| ventil myší na 50 % | 414 bodů myši při citlivosti 1 (úchop za střed, 0,9 m od ventilu); lampa 50,0 % | `a_16_manip`, Node; v prohlížeči skutečnou myší 417 bodů, lampa 50,2 % |
| jas laboratoře, lampa 100 % → 50 % | 199,1 → 185,5 z 255 | `a_16_view`, softwarové vykreslení; pokles je malý, protože laboratoř je přesvícená (N-105) |
| přejezd kamery k terminálu a zpět | 48 kroků (0,4 s) tam i zpět; po návratu poloha, směr i zorné pole bit po bitu shodné | `a_16_manip`, `a_16_view` |
| volání kreslení ze startu | dveře zavřené 9 (366 △), otevřené 29, bez viditelnosti 57 (= všech 57 sítí levelu) | `a_17_view`, 1366 × 768, zorné pole 75°, softwarové vykreslení (počty volání na grafice nezávisí) |
| volání kreslení v hale | 12, 6, 12, 6 ze čtyř pohledů; stejně s laboratoří bez 5 entit | `a_17_view`, dvě načtení |
| cena řazení ploch do buněk | 794 △ v dávkách místo 640 △ z dat (+24 %): plochy viděné ze dvou buněk a plochy, které nemíří do žádné | `a_12_world` |
| přepočet viditelnosti | 2,8 µs na pohled | `a_17_cells`, Node v sandboxu: **orientační** |
| zkouška úplnosti paprsky | 300 pohledů, 7 118 paprsků v záběru; volných 1 130 (zavřeno) a 2 711 (otevřeno); žádná buňka nechyběla | `a_17_cells`, paprsky Rapieru na 16 bodů každého portálu |
| světla | 14 svítících (10 levelu, 4 lampy); při rozpočtu 4, 6, 8, 12 svítí nejvýš 4, 6, 8, 12 | `a_18_view`, počítáno ve scéně three.js, 12 pohledů na rozpočet |
| jas čtyř pohledů (lampy zapnuté, dveře otevřené) | start 168, chodba 193, laboratoř 215, hala 168 z 255; černých bodů 0,33 / 0 / 0 / 0 % | `a_18_view` |
| start se zavřenými dveřmi: světlo jen z vlastní buňky × všechna světla skrz zdi | lampa zhasnutá 75,2 × 86,0; lampa rozsvícená 157,1 × 161,1 z 255 | sonda v prohlížeči, stejný pohled, `__xe.vis(true)` × `__xe.vis(false)` |
| 500 použití tlačítka po zahřátí (po A1.8) | halda +91 kB | `test/a_lib/heap.mjs` |
| celý soubor po A1.8 | `dist/xlab.html` 4,90 MB | výpis sestavení |
| myš potřebná na celý rozsah (citlivost 1) | křídlo dveří 299 bodů na 105° z 1,2 m, zásuvka 173 bodů na 0,38 m, páka 207 bodů na 80° | sonda v Node, robot táhne po směru, který hlásí hra |
| načtení levelu v Node | asi 80 ms včetně stavby koliderů, start Rapieru 63 ms | `E.stats.boot`, sandbox; orientační |

| **po převodu na světlo po vrcholech (A02)** | | |
| vzorky světla v xLabu | 23 199 (kvádry 21 901 ve 32 386 △, základ uvádí 20 658 a 32 386: rozdíl jsou plochy viděné ze dvou buněk) | `a_12_world`, `a_18_view` |
| vrstvy bez zastínění | 65 848 záznamů pro 14 světel, výpočet 9 až 11 ms | `a_18_view` před A1.8; sandbox, **orientačně** |
| vrstvy se zastíněním | 30 433 záznamů; 66 104 paprsků, z toho zastíněno 37 340; příprava 22 až 51 ms + vrstvy 95 až 138 ms | `a_18_light`, `a_18_view`; sandbox, **orientačně** |
| snímky proti xView (světlo po vrcholech × po pixelech, bez zastínění) | bez prefabů ze startu 0,59 z 255; s prefaby start 0,75, laboratoř 1,13, hala 0,46 | `a_12_view`, `a_14_view`, 1366 × 768, zorné pole 60° |
| stín za sloupem | barva vzorku podlahy 0,095 se sloupem × 1,575 bez něj (lineárně, před expozicí) | `a_18_light`; vzorek [0,39; 0; −23,90] za `b_pillar_052` |
| dveře jako brána | vzorek podlahy chodby 1 m za dveřmi startu: zavřeno 0,6454, při otevření 0,40 0,6693, otevřeno 0,7053; po zavření zpět přesně | `a_18_light` |
| švy mezi sítěmi | nejhorší pohled 21 bodů pozadí z 1 049 088, součet přes 48 pohledů 128; souvislá plocha pozadí 0 | `a_17_view`, signální pozadí, bez vyhlazování; N-108 |
| volání kreslení a △ na trase měření | nejvýš 55 volání a 35 128 △ (dveře otevřené, lampy rozsvícené) | `a_18_bench`; počty platí i na T460, časy ne |
| 500 použití tlačítka včetně snímků (světlo, brány) | halda +83 kB | `test/a_lib/heap.mjs` |
| celý soubor | `dist/xlab.html` 4,91 MB | výpis sestavení |

## Zkouška balíku sešny B (`origin/sesna-b`, `packs/gen_demo` + `kit_base`)

Balík jsem si vytáhla do `/tmp` (do své větve jsem ho nedávala) a pustila v enginu beze změny kódu. Je to kouřová zkouška, ne průchod levelem.

| Level | Data | Výsledek v Node | Výsledek v prohlížeči |
|---|---|---|---|
| `complex_7` | 45 buněk, 49 portálů, 498 kvádrů, 423 entit, 124 světel | načtení 582 ms, hráč stojí na zemi, ze startu 1 až 2 buňky, nejvýš 72 volání z 984 sítí, chůze 3 s = 10,7 m, 226 předmětů použito, krok 0,47 ms | nezkoušeno |
| `complex_21` | 39 buněk, 44 portálů, 412 kvádrů, 392 entit, 123 světel | načtení 286 ms, 1 až 2 buňky, nejvýš 68 volání z 943 sítí, chůze 13,5 m, krok 0,42 ms | 15 až 42 volání z 12 směrů (z 1 222 sítí), žádný bod pozadí, konzole čistá |
| `catacombs_3` | 33 buněk, 35 portálů, 341 kvádrů, 132 entit, 71 světel | načtení 157 ms, 2 až 3 buňky, nejvýš 38 volání z 322 sítí, chůze 5,5 m, krok 0,16 ms | 10 až 30 volání (ze 413 sítí), žádný bod pozadí, konzole čistá |

Časy jsou ze sandboxu, orientační. Zkouška našla dvě moje chyby, obě opravené: výběr světel bral jen prvních 64 světel levelu (pole pevné délky) a `open` na už otevřené dveře znovu hlásilo `opened` (dvě křídla spojená do kruhu by se budila donekonečna).

**A02, po převodu na světlo po vrcholech** (22. 11. 2026, Node, balík z `origin/sesna-b` `754f46d`, beze změny kódu; časy ze sandboxu, orientační):

| Level | Vzorky světla | Záznamy ve vrstvách | Paprsky | Příprava + vrstvy | Bran dveří | Hráč |
|---|---|---|---|---|---|---|
| `complex_7` | 151 952 | 264 883 | 3,14 mil. | 0,3 + 6,5 s | 65 | stojí na zemi, 3 s chůze = 10,7 m |
| `complex_21` | 137 803 | 252 759 | 1,96 mil. | 0,2 + 4,3 s | 67 | 13,5 m |
| `catacombs_3` | 64 862 | 86 192 | 0,51 mil. | 0,1 + 1,0 s | 8 | 5,5 m |

Vrstvy velkého levelu se za běhu počítají sekundy (124 světel, každé zkouší paprskem všechny vzorky ve svém dosahu). Ve hře se staví po částech a hráč vidí průběh; pro levely této velikosti je ale na místě zapékání předem (xBake, vlna 2). V prohlížeči jsem levely sešny B po převodu nezkoušela.

Čárkované svislé čáry na stěnách, které jsem ve vlně 1 viděla a přičetla bočním plochám uvnitř zdi, byly švy mezi sítěmi (vyhlazování hran je rozmazávalo, proto zkouška signální barvou dávala 0 bodů). Po vypnutí vyhlazování jsou měřitelné; viz N-108.

## Neověřeno

- Zámek kurzoru ve skutečném prohlížeči. Headless prohlížeč ho neumí bezpečně (teče paměť), takže protokol je ověřený jen nad maketou dokumentu v Node (`a_11_app`): získání, ztráta → pauza, odmítnutí po Esc → „klikni znovu“, prostředí bez zámku → pohled tažením myši.
- **Výkon na T460.** Všechna čísla o čase jsou ze sandboxu se softwarovým vykreslením; počty volání a trojúhelníků platí všude. Hra teď měří sama sebe (`?bench`, F9), ale na T460 ještě neběžela.
- **Ořez pixelů na obdélník portálu (scissor) není.** Podle měření stojí bod navíc při barvě vrcholů 1,1 až 1,9 ms na milion; přínos ořezu by byl malý. Rozhodnout podle `?bench` na T460.
- **Škvíry kolem zavřených dveří.** Křídlo zlatého vzorku otvor nezakrývá na bod přesně: po vypnutí vyhlazování bylo kolem zavřených dveří vidět pozadí (130 bodů v jednom pohledu). Teď je v otvoru zavřených dveří černá clona. U dveří, které otvor nezakryjí vůbec (mříž, okno), by clona byla vidět jako černá plocha; viz N-107.
- **Vzhled světla po vrcholech na skutečné grafice.** Zubaté hrany stínů (mřížka 0,5 m), hranatá skvrna na stropě u lampy, tmavé body na švech: viděla jsem jen softwarové vykreslení. Jak moc to ruší při pohybu, posoudí Ondřej.
- **Odchylka barev po mnoha přepnutích.** Změna úrovně se přičítá jako rozdíl v jednoduché přesnosti. Po jednom otevření a zavření dveří je odchylka pod 1e-5 (test); po tisících cyklů může narůst. Neměřeno; oprava by byla občasný přepočet dávky z vrstev.
- **F9 a `?bench` ve skutečném prohlížeči.** Ověřeno jen v headless prohlížeči (robot projde 5 z 5 buněk bez přenesení, 13 bodů trasy, asi 18 s).
- **Přepnutí vyhlazování hran za běhu** (výměna plátna) ve skutečném prohlížeči a se zamčeným kurzorem.
- **Prefaby nevrhají stín** (stůl, skříň, bedna). Stíní jen kvádry levelu.
- **Slunce** (`type: sun`) se teď počítá i se zastíněním, ale zlatý vzorek ani levely sešny B žádné nemají: neověřeno.
- **Terminál podle D-024 ve skutečném Chrome** (vlastní kurzor se zamčenou myší, Esc = pauza a návrat, odchod šipkou dolů a pravým tlačítkem). Ověřeno jen s podvrženým zámkem v headless prohlížeči.
- **Krok simulace na T460 po nápravě** (A2.3) a cena mřížky 0,25 m na T460.
- **D-025 a obsah zásuvky.** Že se věc ležící v zásuvce veze s ní a neblokuje ji, plyne z pravidla (průnik se neprohlubuje), ale zlatý vzorek žádnou zásuvku s obsahem nemá: neověřeno.
- **D-025 a robot zkoušky A × B.** Zkouška je zelená; robot dveře otvírá rukou. Jestli se v levelech sešny B dveře někde otvírají proti hráči tak, že ho zastaví, jsem nehledala.
- (staré řešení terminálu, už neplatí) Návrat zámku kurzoru po odchodu od terminálu. Hra o něj požádá hned (zámek uvolnila sama, ne hráč klávesou Esc, takže by ho prohlížeč měl vrátit bez čekání); když odmítne, vrátí ho první kliknutí do obrazu. Ověřit jde jen ve skutečném prohlížeči.
- Jak se manipulace „drží v ruce“. Směr a rychlost jsou spočítané a otestované robotem, který táhne přesně po směru, který hra hlásí. Jestli je citlivost příjemná (změřeno robotem v Node při citlivosti 1: ventil 414 bodů myši na půl rozsahu, křídlo dveří 299 bodů na 105° z 1,2 m, zásuvka 173 bodů na 0,38 m, páka 207 bodů na 80°), řekne až ruka.
- Text terminálu se neukládá (po nahrání pozice je obrazovka prázdná).
- Chování v náhledovém panelu claude.ai (vložený rámec): jestli tam zámek kurzoru projde, nevím; počítám s tím, že ne, a hra pak přejde na tažení myší.

## Návrhy (docs/navrhy)

| Číslo | Co | Dočasné řešení |
|---|---|---|
| N-101 | síť a kolize dílů prefabu (válec) do `geom.js` | `src/world/parts.js` |
| N-102 | `rigMatrices` bez alokací | volám jen při změně hodnoty kloubu |
| N-103 | výchozí rychlost kloubu bez `speed` | tabulka v `src/world/joints.js` |
| N-104 | odkud se měří dosah interakce | měřím od osy těla hráče (`src/play/interact.js`) |
| N-105 | zlatý vzorek xLab je přesvícený (data) | žádné, data nejsou moje. Platí i po převodu: se zastíněním a rozsvícenými lampami má start jas 166, chodba 180, laboratoř 208, hala 160 z 255 |
| N-106 | kde leží plocha obrazovky (`components.screen`) a co znamená `app` | plocha 1 mm před nejpřednějším dílem uzlu, každá `app` je textová konzole |
| N-107 | dveře u portálu musí v klidu zakrýt celý otvor (pravidlo validátoru) | černá clona v otvoru zavřených dveří |
| N-109 | otočné dveře se otvírají od hráče (data: kloub na obě strany) | přepínač `?doors=away` (`src/world/swing.js`) |
| N-110 | světlo v textuře pro jemné stíny (bod 5 cm) | okraj stínu po podílech a volitelná mřížka 0,25 m |
| N-108 | švy mezi sítěmi světla (vrcholy sousedních ploch na společné hraně nelícují) a hrubost stínu při mřížce 0,5 m | švy: žádné v geometrii; test rozlišuje díru a šev a počet bodů na švech hlídá. Hrubost: okraj stínu po podílech a volitelná mřížka 0,25 m (doplněk v návrhu z 23. 11.) |

## Co potřebuju od sešny B

Nic, co by mě blokovalo. Pro zkoušku A × B při slučování:

- testy v Node berou balík z proměnné `PACK` (`PACK=packs/<balík> node test/a_17_cells.mjs`); většina testů ale míří na entity zlatého vzorku jménem (`e_valve`, `e_door_lab`), takže na cizím levelu projdou jen obecné části (viditelnost paprsky, řazení ploch, statický svět `a_12_world`);
- prefab dveří k portálu musí v klidu zakrýt celý otvor (N-107);
- obrazovka terminálu: plocha ve středu uzlu, líc +Z (N-106).

## Poznatky pro skill

- **Kontrolér postavy v Rapieru 0.21 vyjde schod jen při vodorovném posunu aspoň asi 7 mm na volání** (změřeno při 120 Hz: 0,75 m/s nestačí, 0,9 m/s ano; na odstupu `offset` to nezávisí). Kdo po nárazu do zdi vynuluje rychlost, ze stoje u schodu nikdy nevyjde. Řešení v `src/play/player.js`: do zdi smí „tlačit“ 1,5 m/s (`WALL_KEEP`), odebírá se jen přebytek.
- **Kapsle se o hranu schodu opírá zaoblením**, takže normála dotyku hrany vypadá jako strmý svah (svislá složka 0,16 až 0,54) a mění se. Strmý svah od hrany schodu proto nejde poznat z normály dotyku; rozhoduje paprsek dolů ze středu spodní polokoule (schůdná plocha pod nohama = hrana, šikmá = svah).
- **Kinematické těleso v klidu postavu „drží“.** Kontrolér bere každé kinematické těleso v dotyku jako plošinu a ruší pohyb postavy ve směru jeho normály; od stojících kinematických dveří se 0,2 s nedalo odejít a kontrolér k tomu nevydal ani záznam kolize. Uzly prefabů jsou proto v klidu těleso `fixed` a kinematické jen po dobu pohybu kloubu (`phys.setMoving`, `entities.js`).
- **Přichycení k zemi (`enableSnapToGround`) stáhne postavu vmáčknutou do rohu dvou zdí pod podlahu** (změřeno až −0,15 m, ve všech režimech tlaku dolů). Pojistka v `player.js`: po každém pohybu dolů paprsek ze středu spodní polokoule ověří místo pod ní.
- **Tlak dolů na zemi (g·dt² na krok) dává na rovině občas krok s nulovým pohybem** (6 z 216 kroků při 8 m/s). Na zemi se proto dolů netlačí (`want.y = 0`) a oporu bez záznamu kolize ověřuje paprsek jednou za 4 kroky. Rychlost po nárazu se počítá ze ztraceného pohybu, ne ze záznamů kolizí, a až od druhého kroku po sobě.
- **Vstup čtený jen v kroku ztrácí krátká ťuknutí.** Kroky běží v dávkách po snímcích; stisk i puštění mezi dvěma snímky (30 ms při 30 snímcích/s) krok nikdy neuvidí. Stisk se proto zamyká do nejbližšího kroku (`latched` v `src/play/input.js`). V headless testu se to projeví hned: `page.keyboard.press` bez zámku neudělá nic.
- **Esc v klidném režimu**: Shell poslouchá `keydown` na `window` ve fázi probublávání. Aplikace si Esc u terminálu bere posluchačem ve fázi zachytávání a volá `stopImmediatePropagation`, jinak by Shell pauzoval.
- Obrazovka ve světě: `CanvasTexture` na `MeshBasicMaterial` s `toneMapped: false`, jinak ACES a expozice levelu text zešednou. Překreslovat jen po změně (`needsUpdate`), ne každý snímek.
- **Zeď jedné buňky × viditelnost po buňkách.** Když dávky jdou po buňce z dat (`brush.cell`), schování buňky schová i stranu stěny, kterou vidí soused: v chodbě by při zavřených dveřích chyběla stěna. Řešení je řadit po plochách podle toho, kam plocha míří (`src/world/cells.js`).
- **Díru ve vykreslení nepozná test „černých bodů“.** Pozadí scény three.js není černé (barva mlhy 0,02 lineárně je po převodu asi 39 z 255). Spolehlivá zkouška: nastavit pozadí na signální purpurovou a počítat její body, s kontrolním pohledem mimo level (`voidPixels` v `test/a_lib/image.cjs`).
- **Světla a viditelnost:** vybírat světla podle viditelnosti jejich vlastní buňky způsobí, že se osvětlení mění při otáčení hlavy (světlo za rohem zhasne, když jeho buňka vyjede ze záběru). Pravidlo musí být nezávislé na směru pohledu: kam světlo dosáhne otevřenými portály.
- Srovnání obrazu s xView musí běžet s vypnutou viditelností (`__xe.vis(false)`): xView kreslí vše a svítí všemi světly.
- Test, který by prošel vždy, je k ničemu: počet aktivních světel ≤ rozpočet jsem nejdřív měřila na vykreslení bez obrazu, kde je to `min(…)` z definice. Platný test počítá bodová světla přímo ve scéně three.js.
- Postavu je nutné umístit o odstup kontroléru (`CHARACTER_SKIN` 0,02 m) nad podlahu.
- `translation()`, `rotation()`, `linvel()`, `computedMovement()` a `computedCollision()` berou v 0.21 cílový objekt: dají se volat bez alokace.
- Výška výskoku vychází o půl kroku integrace níž než `v²/2g` (při 120 Hz o 2,3 %); testy to mají mít v toleranci.

- `esbuild` 0.28.2 umí `import x from './soubor.css' with { type: 'text' }`: styl z `vendor/` jde vložit do stránky bez kopie a bez zásahu do `build.mjs`.
- Rapier 0.21.0 má jiné rozložení balíčku než 0.20 (`dist/rapier.mjs`, `dist/rapier.cjs`, typy v `dist/**/*.d.ts`); `import RAPIER from '@dimforge/rapier3d-compat'` funguje v Node i v esbuildu.
- V sandboxu hlásí ovladač SwiftShader při skládání plátna s vrstvami HTML varování `GPU stall due to ReadPixels`. Je to šum softwarového vykreslování; testy sešny A ho filtrují (`test/a_lib/browser.cjs`), nic jiného ne.
- Pomocné soubory testů patří do složky `test/a_lib/`: soubor `test/a_*.mjs` by `tools/run-tests.mjs` pustil jako test.

Z A02 (světlo po vrcholech, zastínění, měření):

- **Jména metod systému si bere jádro.** `init`, `build`, `reset`, `step`, `frame`, `snapshot`, `restore` volá jádro samo. Systém světla měl vlastní `build()` pro stavbu vrstev a jádro ho při startu zavolalo podruhé (poznala jsem to na dvojnásobném počtu paprsků). Vlastní metody pojmenovat jinak (`prepare`).
- **Paprsek Rapieru z bodu přesně na ploše kvádru hlásí zásah ve vzdálenosti 0**, i když míří od kvádru (hranice se počítá jako vnitřek, `solid = true`). Vzorky světla leží na plochách a na hranách sousedních kvádrů skoro vždy. Paprsek zastínění proto začíná 2 cm nad plochou a ještě 3 cm ve směru ke světlu; světlo sedící na ploše (lampa na stropě má počátek v rovině stropu) se pro zkoušku odsune od stavby.
- **Síť plochy pokračuje pod sousední kvádr** (stěna běží za roh pod kolmou zeď). Takový vzorek leží ve stavbě; když se prohlásí za zastíněný, táhne se od rohu do místnosti tmavý pruh přes celou buňku mřížky. Řešení: převzít viditelnost od souseda přes hranu trojúhelníku. V xLabu je to 4 996 z 23 199 vzorků (počítají se i vzorky přesně na hranici).
- **Vyhlazování hran schovává švy a škvíry.** Zkouška „žádný bod pozadí“ se signální barvou dávala s vyhlazováním 0, protože okrajové body se smíchaly. Bez vyhlazování: 130 bodů kolem zavřených dveří a jednotlivé body na švech sítí. Zkoušku děr pouštět bez vyhlazování a rozlišovat souvislou plochu (díra) od jednotlivých bodů (šev).
- **Dvě kopie téže plochy musí svítit stejně.** Plocha, která nemíří do žádné buňky, je v dávkách všech buněk, kterých se kvádr dotýká. Zkusila jsem omezit paprsky jen na buňky dosažitelné portály od světla (o třetinu méně paprsků); kopie téže plochy pak dostaly různé světlo. Vráceno.
- **`MeshLambertMaterial` v three 0.187 počítá světlo po pixelech.** Komentář „Lambert, levný na integrované grafice“ byl omyl; na HD 520 stojí jedno světlo přes celý obraz 2,2 až 3,9 ms.
- **`antialias` je vlastnost kontextu WebGL.** Za běhu ho jde změnit jen novým plátnem a novým vykreslovačem; posluchače myši a zámek kurzoru proto patří na stálý obal, ne na plátno. Scénu si nový kontext nahraje sám.
- **xBench na T460 kolísá.** Lehké a nejtěžší případy se opakují do 20 %, střední pásmo až dvojnásobně. Rozpočet stavět na nejhorším ze tří běhů.
- **Stavba vrstev se zastíněním za běhu je pro velký level pomalá:** `complex_7` (152 tisíc vzorků, 124 světel) 3,1 milionu paprsků, 6,5 s v sandboxu. Pro xLab 0,1 až 0,2 s.
- **Měření celého snímku:** obalit `E.tick` (kroky i vykreslení) a po něm přečíst jeden bod obrazu (`readPixels`); bez toho se měří jen čas na procesoru a grafika dokresluje později.
- **Test černých bodů není test děr** ani po převodu světla: rub křídla dveří a stín jsou tmavé oprávněně. Průchod dveřmi teď hlídá souvislá plocha signální barvy.

## Otázky pro Ondřeje

Zodpovězeno 24. 11.: terminál funguje (pravé tlačítko i šipka dolů); stíny chce po 5 cm; dveře od hráče (b), téma se možná otevře znovu; dál A2.5 i A2.6. Bez odpovědi zůstalo měření `?bench`. Nové:

1. **Stíny po 5 cm jdou jen texturou světla (N-110).** a) udělej zkoušku na hale xLabu hned, před A2.5 a A2.6; b) nejdřív A2.5 a A2.6, textura světla potom.
2. **Dveře od hráče:** zkus `xLab_A02_2026-11-24.html?doors=away`. a) takhle to chci, ať to jde do dat (N-109); b) ještě jinak (napiš jak).
3. **Měření `?bench`** (F3 neměří grafiku): `xLab_A02_2026-11-24.html?bench`, totéž s `&rows=1080`, a `xLab_gen_A02_2026-11-24.html?bench`. Na konci tlačítko Zkopírovat výsledek; pošli tři texty.
4. **Terminál:** po Esc a Pokračovat dál sedíš u terminálu a kurzor hned poslouchá? a) ano; b) ne (napiš, co se stane).
