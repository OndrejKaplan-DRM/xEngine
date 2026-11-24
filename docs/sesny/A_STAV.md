# Stav sešny A (běh)

**Vlna:** 2 · **Větev:** `sesna-a` · **Základ:** sloučeno `zaklad-2` = `0af8c25` (znění 3 + D-038) · **Stav:** 24. 11. 2026, 17:00 · **Model:** od 24. 11. odpoledne Opus 5.5 (předtím Fable 5.2; přerušení limitem, práce v repu se neztratila)

Poslední celá regrese (`npm run test:all`, sandbox): **728 kontrol, 0 selhalo** (základ 254, skupina A 345 ve 22 sadách, skupina B 92, zkouška A × B 37) na `db6fad0`.

Přehled napříč sešnami je v kořenovém `TODO.md` (oddíl „Sešna A“ píšu já). Tenhle soubor má nahoře totéž podrobněji, pod tím deník rozhodnutí, stavbu, měření a historii.

## 1. Kde jsme (čti první)

**Teď:**
- [ ] prověřit Ondřejův snímek z T460 (24. 11. 09:57, `complex_7`, `c_lab_06`): podezření, že nastavení „Dveře od hráče“ rozšiřuje rozsah i dvířkům nábytku (skříň, lednice, okno mají interakci `door`)
- [ ] A2.5 nová pole základu: `screen.offset`, `JOINT_TRAVEL_SECONDS` z `formats.js`, `interact.seeThrough` a `portals[].passable` v ořezu, `materials[].opacity`

**Další:**
- [ ] A2.6 textura barvy a díl `.glb` na jednom kusu (D-030). Čeká na B2.5 (sešna B ji ještě nezačala); engine připravím a vyzkouším na vlastních zkušebních datech v `test/a_lib/`
- [ ] zkouška textury světla na hale xLabu (N-110); Ondřej 24. 11. 02:26: až po A2.5 a A2.6
- [ ] výchozí rozlišení 1080 řádků, pokud se vejde do 10 ms (Ondřejova volba 4 b); rozhodne `?bench` bez vyhlazování

**Čeká na Ondřeje:**
1. zorné pole po opravě: a) použitelné, b) nižší strop než 120°, c) promítání Panini
2. `?bench` znovu s opravenou metodou, **bez vyhlazování, mřížka 0,5 m**: `xlab.html?bench`, `…?bench&rows=1080`, `xlab_gen.html?bench` (poslal zatím dva běhy, jeden s vyhlazováním a mřížkou 0,25 m)
3. terminál: po Esc a Pokračovat dál sedí a kurzor hned poslouchá?

**Čeká na jiné sešny:**
- svodná: rozhodnout N-109 (dveře na obě strany v datech) a N-110 (světlo v textuře); sloučit vlnu 2 sešny A do základu
- B: dveře s kloubem na obě strany (N-109), B2.5 (prefab `.glb` a materiál s texturou)

**Hotovo ve vlně 2** (podrobnosti v oddílech 3 a 5):

| Úkol | Commit | Doloženo |
|---|---|---|
| A2.1 světlo po vrcholech, zastínění, dveře jako brány, okraj stínu po podílech | `a664e95`, `3cab4e3`, `e2be3cc` | `a_12_view`, `a_18_light` (stín za sloupem 0,194 × 1,590), `a_18_soft`, `test:axb` |
| A2.2 pevné řádky 576 / 768 / 1080, vyhlazování v nastavení, `?bench` a F9 | `a664e95`, `19b5377`, `db6fad0` | `a_11_shell`, `a_18_bench`; na T460 běží (Ondřej 24. 11.) |
| A2.3 krok simulace: obal Rapieru jen po změně | `b77837f` | `a_12_step`; T460: krok medián 0,55 až 0,68 ms (dřív fyzika až 3,10 ms) |
| A2.4 skok na nový stisk, terminál D-024, dveře D-025, „Rozhraní entit“ | `a664e95`, `5626629`, `f2766ea` | `a_13_player`, `a_16_*`, `a_14_block`; zkouška terminálu na T460 prošla (D-032) |
| sloučení D-037 (mřížka na násobcích buňky, bez schovaných ploch) a N-101 | `25e17a4` | švy 128 → 0 bodů (`a_17_view`) |
| zorné pole: vodorovný úhel při 4 : 3, strop 120° | `db6fad0` | na T460 F3 ukazuje 117° × 74° při nastavení 90 (snímek 24. 11. 09:57) |
| dveře od hráče jako nastavení, výchozí zapnuto | `25e17a4`, `db6fad0` | `a_14_swing`; návrh N-109 |
| A2.5, A2.6, A2.7 | – | nezačato |

## 2. Deník rozhodnutí sešny A

Rozhodnutí, která sešna A udělala sama ve své oblasti. Projektová rozhodnutí (D-0xx) jsou v `docs/DECISIONS.md`; co z tohoto deníku má platit pro celý projekt, jde návrhem.

| Datum | Rozhodnutí | Proč | Co jsem zavrhla | Doklad |
|---|---|---|---|---|
| 22. 11. | plochy kvádrů se řadí do dávek podle toho, kam míří, ne podle buňky kvádru | stěna je vidět ze dvou místností; při řazení podle buňky chyběla v chodbě stěna | dávky po `brush.cell` | `cells.js`, `a_12_world` |
| 22. 11. | uzly prefabů jsou v klidu pevné těleso, kinematické jen za pohybu kloubu | kontrolér postavy bere stojící kinematické těleso jako plošinu; od dveří se 0,2 s nedalo odejít | kinematické stále | `phys.setMoving` |
| 22. 11. | dveře jako brána světla: úsek vrstvy skrz otvor portálu × otevření dveří | Ondřej (2 a): zavřenými dveřmi světlo neprochází, při otevírání přibývá | dveře jako stínítko | `occlusion.js`; převzato do D-035 |
| 22. 11. | vzorek ležící ve stavbě přebírá viditelnost souseda přes hranu | jinak se od rohu táhne tmavý pruh přes buňku mřížky | prohlásit ho za zastíněný | `lightfield.js`, `a_18_light` |
| 22. 11. | černá clona v otvoru zavřených dveří | bez vyhlazování bylo kolem křídla 130 bodů pozadí | spoléhat na vyhlazování | `render.addShutter`; N-107, D-036 |
| 22. 11. | vrstvy světla se ve hře staví po částech, nejvýš 8 ms na snímek | velký level by při načtení zamrzl na sekundy | stavět naráz | `lighting.js` |
| 22. 11. | vyhlazování hran výchozí vypnuté; přepnutí vymění plátno | stojí 4,4 až 6,2 ms (xBench 0.2); `antialias` jde změnit jen novým kontextem | – | `render.setAntialias` |
| 22. 11. | skok v profilu `arena` na nový stisk, stisk ve vzduchu platí při dopadu | Ondřejova volba 3 b | držení = skákání | `profiles.js`, `a_13_player` |
| 23. 11. | terminál: zámek kurzoru zůstává, vlastní kurzor, Esc = pauza, odchod šipkou dolů nebo pravým tlačítkem | na T460 Esc shodil hru do pauzy; E k odchodu nejde, u terminálu se píše | uvolnit zámek (vlna 1) | `5626629`, D-024, D-032 |
| 23. 11. | D-025: překážka je průnik hlubší než 2 mm, který posun prohlubuje; hlídají se jen `door` a `drawer`; vrací se jen pohon | věc, která se veze se zásuvkou, ji nesmí zablokovat; ovladače míří od hráče | zastavit při každém dotyku | `blocking.js`, `a_14_block` |
| 23. 11. | okraj stínu: 4 × 4 paprsky z plošky vzorku, vzorek svítí podílem | Ondřej (2 b): stíny hrubé; mřížka je kontrakt a měnit ji smí jen základ | jemnější mřížka natvrdo | `lightfield.soften`, `a_18_soft` |
| 23. 11. | mřížka 0,25 m jen jako volba, výchozí 0,5 m | na 0,5 m stojí zapečené světlo z xBake | 0,25 m výchozí | nastavení Mřížka světla |
| 23. 11. | obal Rapieru prochází tělesa jen v kroku po změně (`phys.lazyMap`) | 91 z 95 µs kroku byl tenhle obal; tělesa vznikají jen přes `phys.js` | jiný počet koliderů, jiný engine | `b77837f`, `a_12_step` (výsledek shodný na bit) |
| 24. 11. | stíny po 5 cm ne vrcholy, ale textura světla (návrh N-110) | xLab by měl 1,45 mil. bodů, `complex_7` 3,18 mil.; rozpočet T460 je 300 tisíc △ | mřížka 0,05 m | `docs/navrhy/N-110-svetlo-v-texture.md` |
| 24. 11. | dveře od hráče: strana podle polohy hráče; rozsah na obě strany dočasně kopií prefabu | Ondřej (4 b, potom 2 a); data jsou sešny B | měnit balík | `behaviors.js`, `swing.js`, N-109 |
| 24. 11. | zorné pole = vodorovný úhel při 4 : 3, svislý z něj, strop 120° na šířku | číslo šlo do kamery jako svislý úhel; na okně 2,18 : 1 bylo „110“ 144° | svislý úhel jako dosud | `src/render/fov.js` |
| 24. 11. | `?bench` měří vykreslení dávkou opakovaných snímků a jedním čtením bodu | čtení po každém snímku vrátilo na T460 obnovu displeje (15,2 až 16,1 ms ve všech buňkách) | čas kolem `E.tick` | `draw.ms` v JSON |

## 3. Jak je to postavené (moduly sešny A)

Mapa modulů celého projektu je v `docs/01_ARCHITEKTURA.md`, oddíl 9. Tady jen to, co z ní není poznat.

- `src/app/game.js` skládá jádro a systémy a **nezná DOM**. Tentýž kód běží ve hře (`main.js`, three.js) i v testech v Node (`src/render/null.js`, bez obrazu). Fyzika, hráč, kostry, spojení a světlo se testují v Node; prohlížeč zůstává na obraz a Shell.
- `src/app/main.js` přidává plátno, Shell (`src/shell` přes adaptér), zámek kurzoru (`lock.js`), HUD, F3 a F4 (`dev.js`), `?bench` a F9 (`bench.js`, sonda fyziky `probe.js`) a háček `__xe` (`hook.js`).
- **Nastavení** (`settings.js`): zorné pole, vnitřní rozlišení (576 / 768 / 1080 řádků, výchozí 768), vyhlazování hran (vypnuto), mřížka světla (0,5 / 0,25 m, od nové hry), citlivost myši, dveře od hráče (zapnuto, od nové hry), profil pohybu (jen s `?dev`).
- **Zorné pole** (`src/render/fov.js`): nastavení je vodorovný úhel při 4 : 3, kamera dostane svislý `2·atan(tan(h/2) / (4/3))`, vodorovný úhel je nejvýš 120°. `station.fov` z dat je svislý úhel podle formátu.
- **Vnitřní rozlišení** (D-023): `setPixelRatio(1)` a `setSize(šířka podle okna, řádky)`; plátno roztahuje CSS. Vyhlazování je vlastnost kontextu WebGL: přepnutí vymění plátno; myš a zámek proto visí na obalu `#view`.
- **Vstup**: akce a klávesy jsou data (`actions.js`); stisk kratší než snímek se zamkne do nejbližšího kroku (`input.js`).
- **Klidný režim** (D-024; `interact.js`, `terminal.js`): po „použít“ u terminálu kamera za 0,4 s dojede na `station`, zámek kurzoru zůstává, myš vede vlastní kurzor po obrazovce ve světě (`interact.cursor`), levé tlačítko je „použít“ v místě kurzoru, Enter vyšle `command`. Odchod šipkou dolů nebo pravým tlačítkem (to přitom neskočí). Esc je pauza i tady; bez zámku (testy) se promítá kurzor systému.
- **Manipulace**: úchop je bod, kam dopadl paprsek pohledu; posun myši se promítne do směru, kterým se ten bod na obrazovce hýbe na jednotku kloubu. Díl, který se hýbe hlavně k hráči (zásuvka), se ovládá pohybem myši k sobě a od sebe.
- **Dveře a zásuvky nikoho nedrtí** (D-025; `blocking.js`): nová poloha dílu se nejdřív zkusí proti kapsli hráče a volným tělesům (`phys.obstructs`); při překážce se krok zruší a pohon se po 0,5 s stání vrátí, odkud vyjel. Stání se ukládá.
- **Dveře od hráče** (`behaviors.js`, `swing.js`): dveře s klidovou polohou uvnitř rozsahu kloubu se otevřou k dorazu, kam se křídlo vzdaluje od hráče. Nastavení rozšíří rozsah dveřím, které ho mají v datech jen na jednu stranu (kopie prefabu).
- **Viditelnost** (`visibility.js`, `cells.js`): před vykreslením se z buňky kamery projdou portály a každý zúží výhled na svůj obdélník na obrazovce; dveře v klidu portál zavírají a otvor kryje černá clona. Plochy kvádrů jsou v dávce buňky, kam míří; plochy, které nemíří nikam, ve všech dotčených buňkách.
- **Světlo po vrcholech** (D-022; `lightfield.js`, `lighting.js`): vzorky = vrcholy `levelLightMeshes` (D-037) a pevných dílů prefabů. Vrstva světla = řídký seznam (index vzorku, E), po úsecích podle brány. Barva = okolní člen + Σ úroveň × barva × E / π; `MeshBasicMaterial` s barvou vrcholů. Změna úrovně se přičte jako rozdíl jednou před vykreslením (`light.flush`). Pohyblivé díly mají jednu hodnotu na stěnu (`facets.js`).
- **Zastínění a brány** (`occlusion.js`): paprsek Rapieru ze vzorku ke světlu, stíní jen stavba levelu (skupina `SOLID`). Vede-li cesta otvorem portálu s dveřmi, vzorek patří do úseku s bránou a svítí × otevření dveří. Okraj stínu: 4 × 4 paprsky z plošky (`soften`). Pravidlo pro základ je v oddílu 8.
- **Fyzika** (`phys.js`): jediná instance Rapieru; `lazyMap` pouští obal Rapieru jen po změně těles.
- **Měření** (`bench.js`, `probe.js`): robot projde trasu z dat (buňky, portály) a v každé buňce se rozhlédne. JSON: `draw.ms` (vykreslení dávkou, metoda xBench), rozestup snímků, krok po systémech, počty těles, profil Rapieru, pevná práce (smyčka ve skriptu a 5 000 paprsků) pro srovnání strojů. Volby `&rows=`, `&aa=1`, `&quick`, `&grid=0.25`.
- **F3** (`dev.js`): snímky, čas snímku a kroku, obraz, zorné pole (skutečné úhly), volání, △, buňky, světla, mřížka, vzorky, průběh stavby světla, krok po systémech, fyzika (kolidery, volná tělesa, kolik nespí, kinematická). **F4** obrysy buněk a portálů.

## 4. Rozhraní entit (D-026)

**Entita za běhu** (`src/world/entities.js`) = umístěný prefab:

- totožnost: `id`, `index` (pořadí v levelu, klíč pro spojení), `def`, `prefab`, `cell`;
- kostra: `joints` (`value`, `vel`, `target`, `speed`, `active`, `held`, `from`, `blocked`), `guard` (D-025), `values` (id kloubu → hodnota pro `rigMatrices`), `nodeWorld`, `movers` (uzly, které se hýbou: matice, díl ve vykreslení, těleso, záznam ve světle);
- stav: `state { locked, on, level, phase, enabled, rep }`, společný všem druhům;
- součásti z prefabu: `comp` (`interact`, `light`, `physics`, `pickup`, `screen`), `kind` = `comp.interact.kind`;
- vazby: `body` a `home` (dynamické těleso), `colliders`, `light`, `links`.

**Jak se součást hlásí ke svému systému.** Při načtení (`instantiate`) entita předá každému systému to jeho: vykreslení (`render.addStatic`, `render.addMover`), fyzice (`phys.addBody`, `phys.addCollider` s odkazem `{ kind: 'entity', ent, node }`), světlu (`light.addLight`, `light.addMover`). Chování podle `kind` je tabulka v `behaviors.js` (`init`, `use`, `input`, `onJoint`). Obrazovky a manipulaci drží `src/play/interact.js` a `terminal.js`.

**Uložený stav** (`snapshot` systému `entities`): `s` = kopie `state`; `j` = pro každý kloub `[value, vel, target, speed, active, from, blocked]`; `b` = u dynamického tělesa 14 čísel. Zvlášť fronta spojení (`io`), spouštěče (`world`) a hráč. Neukládá se text terminálu, světlo (dopočítá se) a nic z vykreslení.

**Události:** `io:fired`, `level:checkpoint`, `level:complete`, `level:message`, `interact:used`, `interact:denied`, `interact:seated`, `interact:left`, `player:jumped`, `player:landed`. Výstupy prefabů (`opened`, `on`, `changed`…) jdou rovnou do fronty spojení (`io.fire`).

**Co bych před zmrazením změnila:** (1) `state` je jedna struktura pro všechny druhy; s tvory a zbraněmi poroste. (2) Entita drží odkazy na záznamy tří systémů; čistší by byl jeden „díl“ s jedním rozhraním. (3) Jedna interakce a jeden hlavní kloub na prefab je mez formátu verze 1; `behaviors.js` s ní počítá.

## 5. Měření z T460

Stroj: Lenovo T460, Intel HD Graphics 520 (ANGLE, Direct3D 11), Chrome 157, 4 vlákna, 8 GB, displej 1536 × 864 při zvětšení 1,25, okno hry asi 1 918 × 878 bodů (poměr stran 2,18 : 1).

### 5.1 `?bench` (Ondřej, 24. 11., sestavení „vlna 2, krok 2“)

| | Běh 1 | Běh 2 |
|---|---|---|
| obraz, vyhlazování, mřížka | 1 259 × 576, ne, 0,5 m | 2 360 × 1 080, **ano**, 0,25 m |
| snímků za běh | 1 065 za 19,0 s | 750 za 20,2 s |
| rozestup snímků: medián / 95 % | 16,7 / 16,8 ms | 16,8 / **33,5 ms** |
| krok simulace: medián / 95 % / nejvíc | 0,55 / 1,06 / 2,45 ms | 0,68 / 1,10 / 2,64 ms |
| `player` medián | 0,30 ms | 0,34 ms |
| `phys` medián; uvnitř Rapieru průměrně | 0,18; 0,18 ms | 0,21; 0,18 ms |
| pevná práce: skript / 5 000 paprsků | 5,5 / 19,3 ms | 5,1 / 16,5 ms |
| volání nejvýš, △ nejvýš | 55, 35 456 | 55, 127 452 |

1. Krok simulace v xLabu: medián 0,55 až 0,68 ms, 95 % do 1,1 ms. Obal kolem kroku Rapieru zmizel (`phys` = uvnitř Rapieru). Náprava A2.3 platí i na T460.
2. Pevná práce je na T460 1,6× až 2,1× pomalejší než v sandboxu, krok simulace ale 5× až 9×. Neumím vysvětlit měřením; domněnka: krátké dávky práce 120× za sekundu běží při nízkém taktu procesoru.
3. 1 080 řádků s vyhlazováním a mřížkou 0,25 m neudrží 60 snímků/s (průměrně 37).
4. `frame.workMs` z těchto běhů neplatí (15,2 až 16,1 ms ve všech buňkách = obnova displeje); opraveno v `db6fad0` (`draw.ms`). **Čas grafiky ve hře z T460 zatím nemám.**

### 5.2 Přehled F3 (Ondřejovy snímky 24. 11.)

„Snímek“ je čas procesoru na snímek ve skriptu (dva kroky a odeslání kreslení); čas grafiky F3 neměří. Klouzavé průměry. Řádky 1 až 15 sestavení „krok 1“ (`cc7893f`), řádek 16 „krok 3“ (`db6fad0`).

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
| 16 | `complex_7`, `c_lab_06`, u skříně | 1080, ano, 0,25 m | 53 | 15,49 | 1,54 | 0,39 | 0,78 | 16 | 7 712 |

Stavba vrstev světla na T460: xLab 0,5 m 1 231 ms, 0,25 m 1 471 až 2 151 ms; `complex_7` 0,5 m 24,3 s, 0,25 m 38,5 až 44,4 s.

Plyne z toho: (1) vyhlazování v 1 080 řádcích neudrží 60 snímků/s, zůstává vypnuté; (2) 1 080 řádků bez vyhlazování drželo 60 snímků/s v obou pohledech xLabu, výchozí rozlišení ale změním až podle `draw.ms`; (3) levely sešny B potřebují zapečené světlo (stavba 24 až 44 s ubírá hře až 8 ms na snímek); (4) s vyhlazováním v 1 080 řádcích stojí tytéž systémy dvakrát až třikrát víc (`phys` 0,25 → 0,61 ms v téže buňce), domněnka: procesor a grafika sdílejí příkon.

### 5.3 xBench (čtyři běhy: 0.1 jednou 22. 11. 02:16, 0.2 třikrát 22. 11. 20:57, 21:32, 21:35)

Metoda: vykreslení a `readPixels` jednoho bodu, 2,5 s na případ, medián v ms; poslední sloupec nejhorší 95. percentil.

| Případ | Volání | △ (tis.) | Světla | Obraz | Materiál a příznaky | 0.1 | 0.2 č. 1 | 0.2 č. 2 | 0.2 č. 3 | 95 % max |
|---|---|---|---|---|---|---|---|---|---|---|
| `zaklad` | 101 | 102 | 0 | 1366 × 768 | Lambert | 2,32 | 1,91 | 1,95 | 1,90 | 3,41 |
| `volani_400` | 401 | 102 | 0 | 1366 × 768 | Lambert | 3,85 | 2,76 | 3,06 | 2,88 | 7,80 |
| `volani_800` | 801 | 106 | 0 | 1366 × 768 | Lambert | 7,15 | 4,63 | 5,35 | 5,20 | 8,35 |
| `tris_600` | 201 | 594 | 0 | 1366 × 768 | Lambert | 9,05 | 6,13 | 6,50 | 7,15 | 14,30 |
| `tris_1200` | 201 | 1201 | 0 | 1366 × 768 | Lambert | 16,00 | 14,50 | 9,70 | 11,85 | 18,20 |
| `svetla_4` | 201 | 205 | 4 | 1366 × 768 | Lambert | 14,00 | 6,80 | 7,70 | 10,35 | 16,20 |
| `svetla_16` | 201 | 205 | 16 | 1366 × 768 | Lambert | 22,80 | 23,10 | 23,20 | 23,10 | 25,70 |
| `stin_2048` | 201 | 205 | 4 | 1366 × 768 | Lambert, stín 2048 | 25,20 | 24,60 | 23,90 | 24,50 | 28,30 |
| `vrcholy_fhd` | 201 | 205 | 0 | 1920 × 1080 | barva vrcholů | – | 3,45 | 3,25 | 3,30 | 6,63 |
| `interier` | 202 | 207 | 0 | 1366 × 768 | barva vrcholů, interiér | – | 2,41 | 2,41 | 2,44 | 4,81 |
| `interier_576` | 202 | 207 | 0 | 1025 × 576 | totéž | – | 2,05 | 2,03 | 2,01 | 4,26 |
| `interier_fhd` | 202 | 207 | 0 | 1920 × 1080 | totéž | – | 3,80 | 4,35 | 4,25 | 7,58 |
| `interier_tex` | 202 | 207 | 0 | 1366 × 768 | totéž, textura | – | 2,98 | 3,48 | 3,23 | 7,18 |
| `interier_aa` | 202 | 207 | 0 | 1366 × 768 | totéž, vyhlazování | – | 6,80 | 6,85 | 8,60 | 12,00 |
| `interier_1` | 202 | 207 | 1 | 1366 × 768 | Lambert, interiér | – | 4,65 | 4,65 | 6,30 | 9,45 |
| `interier_4` | 202 | 207 | 4 | 1366 × 768 | Lambert, interiér | – | 9,85 | 10,45 | 10,70 | 12,55 |

Všech 28 případů: surové výsledky `docs/mereni/T460_2026-11-22_xbench-*.json` (základ), tabulka v `git show 254491e:docs/sesny/A_STAV.md`. Výklad: interiér bez výpočtu světel 2,4 ms (D-022 potvrzeno); textura +0,6 až 1,1 ms, vyhlazování +4,4 až 6,2 ms, jedno světlo po pixelech +2,2 až 3,9 ms; střední pásmo kolísá mezi běhy až dvojnásobně, rozpočet stavět na nejhorším běhu; čtyři nejtěžší případy vycházejí vždy 22,5 až 25,2 ms (možná strop metody, patří svodné sešně).

## 6. Čísla ze sandboxu (orientační, softwarové vykreslení)

Počty (volání, △, vzorky, paprsky) platí všude, časy ne.

| Co | Hodnota | Kde |
|---|---|---|
| světlo xLabu po D-037 | 22 898 vzorků; 0,5 m s okrajem po podílech: 31 722 položek, 1 697 zjemněných, 214 096 paprsků, stavba 473 ms | `a_18_soft`, sonda |
| totéž, mřížka 0,25 m | 72 829 vzorků, 126 966 △, 510 074 paprsků, 804 ms | sonda |
| světlo `complex_7` (0,5 m) | 151 952 vzorků, 12 867 zjemněných, stavba 6,9 až 7,2 s v prohlížeči | `?bench` v sandboxu |
| plocha stavby levelu | xLab 3 618 m², `complex_7` 7 954 m², `complex_21` 7 244 m² | `levelLightMeshes`, N-110 |
| stín za sloupem | barva vzorku podlahy 0,194 se sloupem × 1,590 bez něj | `a_18_light` |
| dveře jako brána | vzorek 1 m za dveřmi startu: zavřeno 0,6454, otevřeno 0,7053; po zavření zpět přesně | `a_18_light` |
| švy mezi sítěmi | 0 bodů pozadí ve 48 pohledech (před D-037 128) | `a_17_view` |
| krok hry `complex_7`, hráč stojí / chodí | 119,5 → 10,1 µs / 151,6 → 34,3 µs (`lazyMap`) | sonda, oddíl 2 |
| volání a △ na trase `?bench` v xLabu | nejvýš 55 volání, 35 128 △ | `a_18_bench` |
| D-025 | otočné dveře se o hráče zastaví na 22° ze 105°, mezera 1,59 mm, návrat po 0,500 s, hráč se nepohne; o bednu na 6° | `a_14_block` |
| halda po 500 použitích tlačítka (s vykreslením) | +83 kB, růst se zastaví | `test/a_lib/heap.mjs` |
| myš na celý rozsah (citlivost 1) | křídlo 299 bodů na 105° z 1,2 m, zásuvka 173 bodů na 0,38 m, páka 207 bodů na 80°, ventil 414 bodů na půl rozsahu | sonda, `a_16_manip` |
| pohyb | T1 arena 8,13 m/s, real 6,35 m/s; série výskoků arena 186 % max; výška výskoku 1,131 / 1,114 m | `a_13_player` |
| snímky proti xView (bez zastínění) | start 0,75, laboratoř 1,13, hala 0,46 z 255 | `a_12_view`, `a_14_view` |
| soubor | `dist/xlab.html` 4,93 MB, z toho Rapier s WASM asi 4,2 MB | výpis sestavení |

Starší čísla z vlny 1 (světla po pixelech, rozpočet světel, jas pohledů): `git show 254491e:docs/sesny/A_STAV.md`.

## 7. Neověřeno

- **Čas grafiky ve hře na T460** (`draw.ms`); proto zatím ani výchozí 1 080 řádků.
- **Zorné pole po opravě**: na T460 se uplatnilo (F3 117° × 74°), jestli je příjemné, řekne Ondřej.
- **Terminál po Esc a Pokračovat**: hráč má dál sedět a kurzor poslouchat; ověřeno jen s podvrženým zámkem v headless prohlížeči.
- **Dveře od hráče v levelech sešny B**: prefaby dveří mají v zárubni doraz, křídlo jím při otevření na druhou stranu projde (jen vzhled). Rozsah se dnes rozšiřuje všem prefabům s interakcí `door` a kloubem `hinge`, tedy možná i dvířkům nábytku (prověřuji, oddíl 1).
- **D-025 a obsah zásuvky** (věc se má vézt se zásuvkou); zlatý vzorek zásuvku s obsahem nemá.
- **D-025 v levelech sešny B**: jestli se tam dveře někde zastaví o hráče tak, že překáží, jsem nehledala.
- **Odchylka barev po tisících přepnutí** světel nebo dveří (rozdíl v jednoduché přesnosti; po jednom cyklu pod 1e-5).
- **Scissor** (ořez bodů na obdélník portálu) není; podle xBench by ušetřil zlomky ms.
- **Prefaby nevrhají stín** (stůl, skříň, bedna); stíní jen kvádry levelu.
- **Slunce** (`type: sun`) se zastíněním: žádný level ho nemá.
- **Jak se manipulace drží v ruce** (citlivost): změřené jen robotem, oddíl 6.
- Text terminálu se neukládá. Zámek kurzoru ve vloženém rámci claude.ai nejspíš neprojde (hra pak přejde na tažení myší).

## 8. Pravidlo bran světla pro základ (dodatek k D-035)

`occlusion.js` má na fyzice jedinou závislost: „protíná úsečka stavbu?“ (`phys.raycast` s maskou `LIGHT_RAY`, jen kvádry a klíny levelu). Základ ji může nahradit vlastním průnikem úsečky s kvádry.

- **vstup:** kvádry levelu, portály s `door` (obdélník a id entity dveří), světlo;
- **výsledek pro vzorek:** −1 zastíněno, 0 volná cesta, jinak brána = množina dveří, jejichž portálem úsečka prochází (víc dveří společná brána, svítí součinem otevření);
- **konstanty:** vzorek se zvedne o 0,02 m po normále; paprsek začíná 0,03 m směrem ke světlu, končí 0,02 m před ním; světlo na ploše se odsune 0,1 m od stavby;
- **vzorek ve stavbě** (paprsek 0,1 mm vzhůru něco zasáhne) přebírá bránu od souseda přes hranu;
- **otevření dveří** = |hodnota − rest| / největší vzdálenost dorazu od `rest` (platí i pro dveře na obě strany);
- **okraj stínu po podílech** je nadstavba: vzorek smí být ve více úsecích, v každém svým podílem (řídké kódování to umí, husté ne).

## 9. Návrhy sešny A (`docs/navrhy/`)

| Číslo | Co | Stav | Moje dočasné řešení |
|---|---|---|---|
| N-101 | díly prefabu v `geom.js` | přijat a proveden (23. 11.) | zrušeno, beru ze základu |
| N-102 | `rigMatrices` bez alokací | přijat, základ dluží | volám jen při změně kloubu |
| N-103 | výchozí rychlost kloubu | přijat (`JOINT_TRAVEL_SECONDS`) | vlastní tabulka v `joints.js`, zruší A2.5 |
| N-104 | dosah interakce od osy těla | přijat | – |
| N-105 | přesvícený xLab | přijat, po převodu světla | – |
| N-106 | plocha obrazovky (`screen.offset`) | přijat | odvozování v `interact.js`, zruší A2.5 |
| N-107 | dveře musí zakrýt portál | přijat s úpravou (D-036) | černá clona |
| N-108 | švy a hrubost mřížky světla | proveden (D-037) | – |
| N-109 | dveře na obě strany v datech | otevřený | nastavení „Dveře od hráče“, `swing.js` |
| N-110 | světlo v textuře (bod 5 cm) | otevřený | okraj stínu po podílech, mřížka 0,25 m |

**Pro svodnou sešnu:** v `docs/01_ARCHITEKTURA.md`, oddíl 9, chybí `src/app/probe.js` (sonda fyziky pro `?bench`); `terminal.js` je obsah obrazovky (text na plátně), klidný režim sám je v `interact.js`.

## 10. Poznatky pro skill

Vlna 1:

- Kontrolér postavy v Rapieru 0.21 vyjde schod jen při vodorovném posunu aspoň asi 7 mm na volání (120 Hz: 0,75 m/s nestačí, 0,9 m/s ano). Po nárazu do zdi nenulovat rychlost; v `player.js` smí do zdi „tlačit“ 1,5 m/s (`WALL_KEEP`).
- Kapsle se o hranu schodu opírá zaoblením (normála dotyku vypadá jako strmý svah); schůdnost rozhoduje paprsek dolů ze středu spodní polokoule.
- Kinematické těleso v klidu postavu „drží“; uzly prefabů proto v klidu `fixed`, kinematické jen za pohybu.
- `enableSnapToGround` stáhne postavu vmáčknutou do rohu dvou zdí pod podlahu (až −0,15 m); pojistka paprskem po každém pohybu dolů.
- Tlak dolů na zemi dává na rovině občas krok s nulovým pohybem; na zemi se dolů netlačí a oporu ověřuje paprsek jednou za 4 kroky.
- Vstup čtený jen v kroku ztrácí krátká ťuknutí; stisk zamknout do nejbližšího kroku (`latched`).
- Obrazovka ve světě: `CanvasTexture` na `MeshBasicMaterial` s `toneMapped: false`; překreslovat jen po změně.
- Zeď jedné buňky je vidět ze dvou; dávky řadit po plochách podle směru.
- Díru ve vykreslení pozná signální pozadí (purpurová), ne „černé body“; souvislá plocha = díra, jednotlivé body = šev.
- Výběr světel podle viditelnosti jejich buňky mění osvětlení při otáčení hlavy; pravidlo musí být nezávislé na směru pohledu.
- Test, který projde vždy, je k ničemu (počet světel měřený na vykreslení bez obrazu je `min(…)` z definice).
- Postavu umístit o odstup kontroléru (0,02 m) nad podlahu. `translation()` a spol. v Rapieru 0.21 berou cílový objekt (bez alokace). Výška výskoku vychází o půl kroku integrace níž než `v²/2g`.
- esbuild 0.28.2 umí `import css from './x.css' with { type: 'text' }`. Rapier 0.21 má typy v `dist/**/*.d.ts`.
- Varování SwiftShaderu `GPU stall due to ReadPixels` je šum. Pomocné soubory testů do `test/a_lib/` (jinak je `run-tests.mjs` pustí jako test).

Vlna 2:

- Jména `init`, `build`, `reset`, `step`, `frame`, `snapshot`, `restore` volá jádro samo; vlastní metoda `build()` se zavolala dvakrát (dvojnásobek paprsků). Jmenovat jinak (`prepare`).
- Paprsek Rapieru z bodu přesně na ploše kvádru hlásí zásah ve vzdálenosti 0 (hranice je vnitřek); paprsek zastínění začíná nad plochou a posunutý ke světlu.
- Síť plochy pokračuje pod sousední kvádr; vzorek ve stavbě musí převzít viditelnost souseda.
- Vyhlazování hran schovává švy a škvíry; zkoušku děr pouštět bez něj.
- Dvě kopie téže plochy (v dávkách dvou buněk) musí svítit stejně; omezení paprsků podle buněk to rozbilo.
- `MeshLambertMaterial` v three 0.187 počítá světlo po pixelech; na HD 520 stojí jedno světlo přes obraz 2,2 až 3,9 ms.
- `antialias` jde změnit jen novým plátnem a kontextem; posluchače a zámek kurzoru na stálý obal.
- xBench na T460 kolísá až dvojnásobně ve středním pásmu; rozpočet z nejhoršího běhu.
- **Obal Rapieru 0.21 po každém `world.step()` volá `mapNewSoftBodies()`**: projde zpětným voláním z WASM všechna tělesa a kolidery. Při 1 079 koliderech 91 z 95 µs kroku. Pouštět jen po změně (`phys.lazyMap`); výsledek simulace se nemění.
- **Čtení jednoho bodu po každém snímku na skutečné grafice čeká na obnovu displeje** (T460: 15,2 až 16,1 ms ve všech buňkách); v sandboxu se to neprojeví. Čas vykreslení měřit dávkou opakovaných snímků a jedním čtením (xBench).
- **Kamera three.js chce svislý úhel.** Nastavení zorného pole ve hrách je vodorovný úhel při 4 : 3 (Quake, Source); svislý úhel z okna 2,18 : 1 dal při „110“ 144° na šířku.
- Rozšíření rozsahu kloubu dveřím musí platit jen pro dveře v portálech, ne pro dvířka nábytku (stejná interakce `door`).

## 11. Otázky pro Ondřeje

Zodpovězeno 24. 11. 02:26: nejdřív A2.5 a A2.6, textura světla potom; dveře od hráče ano, ať to jde do dat. Otevřené jsou v oddílu 1 („Čeká na Ondřeje“) a v kořenovém `TODO.md`.

## 12. Historie (zkráceně; podrobně `git log` a starší znění tohoto souboru)

- **22. 11., sešna A01** (vlna 1, znění 1): A1.1 až A1.8 hotovo (`7d3bec6`); stav `git show 7d3bec6:docs/sesny/A_STAV.md`.
- **22. 11. večer, sešna A02**: přechod na znění 2 (světlo po vrcholech, pevné řádky, zastínění, brány dveří, `?bench`; `56bd047` až `254491e`). Ondřejovy odpovědi A01: ventil a, světlo a zavřené dveře a, skok b, lékárnička a, scissor čekat na měření.
- **23. 11.**: D-024 (`5626629`), D-025 (`f2766ea`), sloučení `zaklad-2` (`a1d3081`), jemnější stíny (`e2be3cc`), A2.3 (`b77837f`). Ondřej: Esc u terminálu koliduje (udělat jinak), stíny jemnější (b), nejdřív dokončit znění 2 (a), 1 080 řádků, když se vejde do 10 ms (b).
- **24. 11. v noci**: sloučeno znění 3 základu (D-037, N-101; `25e17a4`), dveře od hráče, nápověda terminálu, N-109 a N-110, měření F3 z T460 (`c131ac4`). Ondřej: terminál funguje, stíny chce po 5 cm, dveře od hráče, dál A2.5 i A2.6.
- **24. 11. ráno**: zorné pole, `draw.ms`, dveře od hráče v nastavení (`db6fad0`). Ondřej: nejdřív A2.5 a A2.6, dveře od hráče do dat, dva běhy `?bench`.
- **24. 11. odpoledne**: přechod na model Opus 5.5 po limitu; sloučeno D-038 (paměť projektu v repu, `TODO.md`); tento soubor přestavěn (nahoře přehled, deník rozhodnutí, historie dole).
