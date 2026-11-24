# Stav sešny A (běh)

**Vlna:** 2 · **Větev:** `sesna-a` · **Základ:** sloučeno `zaklad-2` = `36faf65` (znění 4: D-039 až D-044; sloučení `a842098`) · **Stav:** 24. 11. 2026, 22:45 · **Model:** od 24. 11. odpoledne Opus 5.5 (předtím Fable 5.2; přerušení limitem, práce v repu se neztratila)

Poslední regrese (sandbox, 24. 11. 21:40, znění 4 + zapečené světlo, hlava `sesna-a` po `a842098`): `npm run test:a` **417 kontrol ve 27 sadách**, `npm test` **266**, `npm run test:axb` **37**, vše 0 selhalo. Skupina B naposledy na A2.5 (A2.6 a znění 4 její data nemění). Sestavení pro Ondřeje: naposledy „vlna 2, krok 5“.

Přehled napříč sešnami je v kořenovém `TODO.md` (oddíl „Sešna A“ píšu já). Tenhle soubor má nahoře totéž podrobněji, pod tím deník rozhodnutí, stavbu, měření a historii.

## 1. Kde jsme (čti první)

**Teď (znění 4 základu, dodatek START_A z 24. 11. odpoledne):**
- [x] sloučeno znění 4 (`a842098`)
- [x] D-039 strop řádků = fyzická výška plátna (okno 702 bodů × 1,25 → 878 řádků místo 1 080; `a_11_shell`)
- [x] D-040 rozměry postavy a odstup kontroléru ze `src/xspace/body.js`
- [x] D-042 zkoušky dveří nezávislé na rozsahu dveří zlatého vzorku (`oneSidedDoors`): se zlatým vzorkem ±105° (kopie mimo repo, `PACK=…`) projdou všechny zkoušky A v Node. **Svodná může dveře zlatého vzorku přepnout.**
- [x] D-041 a D-044: běh čte zapečené světlo `levels/<id>.light.bin` (`src/world/baked.js`). Soubor vyrobený z vrstev běhu dá tytéž barvy (poměrně do 1e-7), i po rozsvícení lampy a otevření dveří; v sandboxu stavba vrstev xLabu 30 ms místo 446 ms. Skutečný soubor ze xBake sešny B (xLab, jen kvádry, před D-041) se přečetl: 14 ze 14 světel, poměr jasu proti výpočtu medián 1,00 (10 % 0,73, 90 % 1,57; odraz a stíny prefabů). Do hry ho zatím nic nedopraví: N-111 a soubor v balíku od sešny B
- [x] N-009 (návrh sešny B): barva materiálu s texturou = průměr povrchu, textura × (color / průměr); průměr z `albedoMean`, jinak spočítaný při načtení
- [x] **N-110 zkouška (D-043)**: textura světla s bodem 5 nebo 10 cm na hale xLabu za přepínačem `?lightmap=5|10` (`src/world/lightmap.js`). Ostrý stín sloupů a krytu; v místě vrcholu stejná hodnota jako po vrcholech. Sandbox: 10 cm 4 MB a 1,2 až 1,7 s výpočtu, 5 cm 16 MB a 3,9 až 5,4 s. Čísla z T460 chybí (N-110, oddíl Zkouška)
- [x] Ondřejův snímek z T460 (24. 11. 09:57, `complex_7`, `c_lab_06`): (1) nastavení „Dveře od hráče“ rozšiřovalo rozsah i 16 kusům nábytku v `complex_7` (skříně, lednice, víka centrifug; v katakombách víka truhel), které by se otevřely dovnitř; teď jen dveře v otvoru portálu, včetně druhého křídla (`a_14_swing`). (2) Černá stěna kartotéky není chyba výpočtu: lampa visí přesně nad šířkou kartotéky (x 10,85 m, kartotéka 10,40 až 10,86 m), na boky přímé světlo nedopadne a zbývá okolní člen 0,05. Chybí odražené světlo (vrstva `indirect` ze xBake, D-035); otázka pro Ondřeje
- [x] A2.5 nová pole základu (podrobně v tabulce „Hotovo“ a v deníku)
- [x] A2.6 na zkušebních datech: díl `shape: "mesh"` a kolize `hull` / `mesh` z `.glb`, textura barvy `albedo` (stupeň `low` ≤ 512 px), světlo texturu násobí; textury a sítě v `?bench` a F3. Soubory balíku do hry zatím nedostane build: návrh **N-111**
- [ ] A2.6 hotovo, když: kus ze sešny B (B2.5) je ve hře vidět a `?bench` z T460 ukáže cenu

**Další:**
- [ ] A2.6 zkouška na kusu ze sešny B, až bude B2.5 a N-111 (bez něj soubor balíku do `dist/*.html` nevloží nikdo)
- [ ] N-110: rozhodnutí podle `?bench` z T460 (Ondřej a svodná, D-043)
- [ ] výchozí rozlišení 1080 řádků, pokud se vejde do 10 ms (Ondřejova volba 4 b); rozhodne `?bench` bez vyhlazování

**Čeká na Ondřeje:**
1. sestavení krok 6, jen jedna karta s hrou: `xlab.html?bench`, `xlab.html?lightmap=10&bench`, `xlab.html?lightmap=5&bench` (výpočet textury při načtení, paměť, `draw.ms` v hale) a pohled na halu s `?lightmap=5` (lampy: hala B se rozsvítí při vstupu, A pákou v laboratoři)

**Ondřej 24. 11. 21:13:** výchozí rozlišení **(a) zůstává 768 řádků** (rezerva pro textury a světlo; `complex_7` na 1 080 řádcích má 95 % 10,2 ms). Volba 4 b z 23. 11. („1 080, když se vejde do 10 ms“) je tím uzavřená: nevešlo se.

**Ondřej 24. 11. 19:49** (k otázkám z kroku 5): zorné pole po opravě **(a) použitelné**; terminál po Esc a Pokračovat **(a) sedí dál a kurzor poslouchá**; černé boky bez přímého světla **(a) počkat na odražené světlo ze zapečeného souboru** (D-044 je v základu, čtení souboru je úkol sešny A). Poslal tři běhy `?bench` (oddíl 5.1).

**Čeká na jiné sešny:**
- svodná: **N-111** (textury, `.glb` a zapečené světlo do stránky); přepnout dveře zlatého vzorku na ±105° (testy A jsou připravené); N-009; `composeColors` v `bake.js` nedělí π (oddíl 9); sloučit vlnu 2 sešny A do základu
- B: soubor `levels/<id>.light.bin` do balíků (`pack.json.assets`) a se vzorky dílů prefabů (D-041, pole `entities` v hlavičce)
- B: dveře s kloubem na obě strany (N-109), B2.5 (prefab `.glb` a materiál s texturou); v sadě `kit_base` chybí přijatá pole: `screen.offset` u `terminal_desk_01` a `terminal_wall_01` (běh zatím odvozuje plochu z dílů a hlásí to), `opacity` u `glass_pane` (sklo je dnes neprůhledné)

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
| A2.5 nová pole: `JOINT_TRAVEL_SECONDS`, `screen.offset`, `seeThrough`, `passable`, `opacity` | `b522e7e` a další | `a_25_fields` (11), `a_25_view` (6): skleněnými zavřenými dveřmi je vidět chodba (střed dveří 200,6 → 30,5 od otevřených), mříž se `seeThrough` nezavírá pohled |
| A2.6 engine na zkušebních datech: `glb.js` (vlastní čtení glTF, bez knihovny), `assets.js` (soubory balíku), kolize `trimesh`, textura v `materials.js`, `?bench` a F3 | `6e1ab0c`, `3c6bab0` | `a_26_mesh` (Node, 30): transformace uzlů, `#uzel`, `COL_*` a `_LODn`, zrcadlení, UV, chybějící soubor; paprsek zastaví kolize z `.glb` na 1,600 m. `a_26_view` (prohlížeč, 8): WebP 1 024 px → 512 px, šachovnice na síti i na kvádru, zelený pruh nahoře, po zhasnutí lamp jas 30 → 9 |
| zkušební sestavení `xlab_tex` (textura 1 024 px na všech 14 osvětlených materiálech xLabu, stojan z `.glb`; `?tex=0` bez textur) | `1dcc2a1` | v sandboxu 14 textur → 512 px, 3,67 Mpx, 0 chyb; čas na T460 neměřen |
| znění 4 základu: D-039, D-040, D-042 (zkoušky), D-041 a D-044 (čtení zapečeného světla), N-009 | `a842098` až `7b348c7` a dál | `a_11_shell` (strop řádků), `a_14_*` se zlatým vzorkem ±105°, `a_44_bake` (12), `a_26_view` (10) |
| A2.6 na kusu ze sešny B, A2.7 | – | čeká na B2.5 a N-111; A2.7 nezačato |

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
| 24. 11. | dveře od hráče: strana podle polohy hráče; rozsah na obě strany dočasně kopií prefabu, jen dveřím v otvoru portálu | Ondřej (4 b, potom 2 a); data jsou sešny B; dvířka nábytku mají tutéž interakci `door` a otevřela by se dovnitř | měnit balík; všem prefabům `door` | `behaviors.js`, `swing.js`, N-109, `a_14_swing` |
| 24. 11. | zorné pole = vodorovný úhel při 4 : 3, svislý z něj, strop 120° na šířku | číslo šlo do kamery jako svislý úhel; na okně 2,18 : 1 bylo „110“ 144° | svislý úhel jako dosud | `src/render/fov.js` |
| 24. 11. | `?bench` měří vykreslení dávkou opakovaných snímků a jedním čtením bodu | čtení po každém snímku vrátilo na T460 obnovu displeje (15,2 až 16,1 ms ve všech buňkách) | čas kolem `E.tick` | `draw.ms` v JSON |
| 24. 11. | `screen.offset` z dat platí vždy; prefab bez něj dostane plochu 1 mm před nejpřednějším dílem uzlu a jedno ohlášení | terminály sady `kit_base` pole nemají a díly jim sahají 3 až 4 mm před uzel; výchozí 0 by obrazovku schovala za rámeček | smazat odvozování úplně (zadání A2.5) | `interact.js`, `a_25_fields` |
| 24. 11. | `seeThrough` otvírá portál jen pro pohled; světlo dál řídí otevření dveří | tak počítá i xBake (D-035); dvoukřídlé dveře mají `seeThrough` jen kvůli druhému křídlu, ne proto, že by byly průhledné | pustit světlo skrz | `visibility.js`; otázka pro svodnou |
| 24. 11. | kvádr, jehož všechny plochy jsou průhledné, koliduje, ale světlo nestíní (skupina `world` místo `brush`) | sklo by jinak vrhalo plný stín | stínit vším | `world.js`, `a_25_fields` |
| 24. 11. | portál s `passable: false` je pro pohled otevřený, trasa měření jím nevede | okno (N-003) | – | `bench.js`, `a_25_fields` |
| 24. 11. | `.glb` čte vlastní kód (`glb.js`, asi 200 řádků), ne `GLTFLoader` | totéž musí běžet v Node (testy, xBake, zapékání) a engine z modelu potřebuje jen síť a uzly; `GLTFLoader` je asynchronní a staví objekty three.js | `GLTFLoader` + převod | `src/world/glb.js`, `a_26_mesh` |
| 24. 11. | soubory balíku ve hře = `pack.files`, klíč `<id balíku>/<cesta>` | dva balíky smí mít stejnou cestu; prefab ví, odkud je (`from`) | klíč jen cesta | `assets.js`, N-111 |
| 24. 11. | UV sítě z `.glb` se nedělí `uvScale` | glTF má vlastní UV 0..1; `uvScale` je pro krabicovou projekci v metrech | dělit vždy | `entities.js` (`uvOf`), `a_26_mesh` |
| 24. 11. | kolize `mesh` u dynamického tělesa → konvexní obal týchž vrcholů | Rapier dynamickému tělesu síť trojúhelníků nedovolí | odmítnout | `assets.colliderOf` |
| 24. 11. | textura se zmenšuje při dekódování (`createImageBitmap`), do té doby kreslí bílá 1 × 1 | data nesou originál (D-029), stupeň `low` ≤ 512 px; načtení levelu nečeká na obrázky | čekat na textury před startem | `materials.js`, `a_26_view` |
| 24. 11. | barva materiálu s texturou = průměr povrchu (N-009 varianta a sešny B) | B to v `B_STAV` žádá; doslovné „color násobí texturu“ ztmaví `kit_base` 1,3× až 7×; přepínač `COLOR_IS_MEAN` | čekat na rozhodnutí svodné | `materials.js`, `a_26_view` |
| 24. 11. | zapečené světlo: barva = okolní člen × ao + Σ úroveň × barva × E / π + odraz × váha / π | kontrakt „jas = barva / π × E“; `composeColors` v základu π nedělí, proto ho běh nevolá a skládá úseky sám (přepínání světel a bran beze změny) | volat `composeColors` po každé změně | `baked.js`; otázka pro svodnou |
| 24. 11. | soubor bez pole `entities` (před D-041) se bere pro kvádry, díly prefabů počítá běh; soubor s jinými počty vzorků se odmítne | xBake sešny B dnes píše jen kvádry | odmítnout celý | `checkBake`, `a_44_bake` |
| 24. 11. | sítě z `.glb` a pohnutá světla svítí běh i se souborem | D-041 bere za vzorky jen díly `box` a `cyl`; soubor popisuje světlo v klidové poloze | – | `buildLayer(…, skipBaked)` |
| 24. 11. | zapečený soubor se čte jen se zastíněním (`light.shadows`) | stíny jsou v souboru; bez zastínění se srovnává s xView | číst vždy | `lighting.prepare` |
| 24. 11. | zkouška textury světla počítá při načtení, half float RGBA, `MeshBasicMaterial.lightMap` (kanál UV 1), síť dávky bez indexů | D-043: zkouška dřív než formát; `lightMap` dělí π stejně jako kontrakt; vlastní shader zatím zbytečný | formát a xBake (až podle čísla) | `lightmap.js`, `a_43_*` |
| 24. 11. | díl `mesh` bez `mat` dostane z glTF jen základní barvu | formát říká „bere se z glTF“; textura uvnitř `.glb` by znamenala druhou cestu k materiálům vedle `materials.json` | číst materiály glTF celé | `assets.materialOf`; doporučení pro B v N-111 |

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
- **Fyzika** (`phys.js`): jediná instance Rapieru; `lazyMap` pouští obal Rapieru jen po změně těles. Tvary `box`, `cyl`, `ball`, `hull`, `trimesh` (síť jen pro pevná a kinematická tělesa).
- **Soubory balíku** (A2.6; `assets.js`, `glb.js`): bajty z `pack.files` (base64 nebo `Uint8Array`), čtení `.glb` (polohy, normály, UV, indexy, transformace uzlů, výběr `#uzel`, úmluvy `COL_*` a `_LODn`), síť dílu `mesh`, kolize `hull` a `mesh`. Ostatní tvary dál `geom.js`. Textura barvy v `materials.js`: barva × textura × barva vrcholu, `low` ≤ 512 px, sRGB, opakování, mipmapy.
- **Zapečené světlo** (D-041, D-044; `baked.js`): statické dávky si pamatují, který vrchol je který vzorek levelu (`sampleMap`, pořadí `levelSamples`: kvádry, potom pevné díly prefabů). Při načtení levelu `readBake` vezme `levels/<id>.light.bin` z `pack.files`, `checkBake` porovná počty vzorků, `lighting.prepare` vyplní základ (okolní člen × ao + odraz × váha / π) a vrstvy světel převede na úseky (`bakedSegs`; brány přes `occlusion.gateFor`). Vrcholy bez vzorku (sítě `.glb`) a světla bez vrstvy v souboru počítá běh jako dřív. F3 a `?bench` říkají, kolik světel je ze souboru.
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

### 5.1 `?bench`, sestavení „vlna 2, krok 5“ (Ondřej, 24. 11. 19:39 až 19:47)

Bez vyhlazování, mřížka 0,5 m, Chrome 158, okno 1 536 × 864 při `devicePixelRatio` 1,25.

| | `xlab_tex.html?bench` | `xlab_gen.html?bench` (`complex_7`) | `xlab.html?bench&rows=1080` |
|---|---|---|---|
| obraz | 1 259 × 576 | 1 259 × 576 | 2 360 × 1 080 |
| textury | 14, 3,67 Mpx, 18,7 MB (odhad paměti) | 0 | 0 |
| **`draw.ms` medián / 95 % / nejvíc** | **2,29 / 2,9 / 11,45** | **2,26 / 3,6 / 36,7** | **5,57 / 7,38 / 9,9** |
| volání nejvýš, △ nejvýš | 55, 35 468 | 396, 47 606 | 55, 35 456 |
| rozestup snímků medián / 95 % | 33,2 / 33,5 ms | 33,2 / 33,5 ms | 33,3 / 50 ms |
| práce snímku (`workMs`) medián / 95 % | 7,2 / 9,4 ms | 7,5 / 9,8 ms | 11,7 / 15,5 ms |
| krok simulace medián / 95 % | 0,22 / 0,54 ms | 0,25 / 0,40 ms | 0,45 / 0,75 ms |
| pevná práce: skript / 5 000 paprsků | **13,1** / 23,5 ms | 3,9 / 20,8 ms | 4,3 / 15,8 ms |
| stavba světla (`lightBuildMs`) | 921 ms | **13 065 ms** | 589 ms |
| vzorky světla, okraj stínu | 22 922, 1 697 | 135 305, 15 681 | 22 898, 1 697 |

1. **1 080 řádků v xLabu se vejde do 10 ms** (95 % 7,38 ms, nejvíc 9,9 ms). Ondřejovo pravidlo (volba 4 b) je tím splněné pro xLab; pro velký level ne ověřené: `complex_7` na 1 080 řádcích změřený není. Odhad z poměru 1 080 / 576 v xLabu (asi 2,4×, ale jeden běh s texturami a jeden bez): 95 % kolem 9 ms, tedy na hraně. Proto ještě běh `xlab_gen.html?bench&rows=1080`. Pozor na D-039: strop řádků = fyzická výška plátna; v Ondřejově okně (asi 878 bodů) se 1 080 dostane jen na celé obrazovce.
2. **Textury jsou levné**: 14 textur 512 px na všech plochách xLabu a vykreslení 2,29 / 2,9 ms. Srovnání bez textur ve stejném sestavení chybí (`?tex=0` nepřišel); běh s texturami měl navíc 3× pomalejší pevnou práci skriptu (13,1 proti 3,9 a 4,3 ms), procesor byl tedy v jiném stavu nebo zaneprázdněný (dekódování textur na pozadí?) a čísla procesoru z něj nesrovnávám.
3. **Všechny tři běhy mají 30 snímků/s** (rozestup 33,2 ms), ráno v kroku 2 to bylo 60 (16,7 ms). Práce snímku je 7 až 12 ms, hra tedy 60 snímků/s stíhá; omezení dělá prohlížeč nebo systém. Nejpravděpodobněji Úspora energie v Chrome (na baterii snižuje obnovovací frekvenci a `requestAnimationFrame` se jí přizpůsobí). Ověřit během na síti.
4. **Stavba světla v `complex_7` trvá 13,1 s výpočtu** (s okrajem stínu). Hra ji staví po 8 ms za snímek, při 30 snímcích/s je to asi 54 s, než je světlo hotové (odhad 13 065 / 8 / 30). Řešení je zapečený soubor (D-044): běh ho zatím nečte, je to další krok sešny A.
5. Krok simulace 0,22 až 0,45 ms medián (ráno 0,55 až 0,68 ms; jiný stav napájení, srovnávat jen v rámci jednoho večera).

**Doplněk (Ondřej, 24. 11. 20:42 a 20:54, krok 5, obraz 2 360 × 1 080, 1 080 řádků zvolených i v nastavení):**

| | `xlab_tex.html?bench&tex=0` (xLab bez textur, se stojanem) | `xlab_gen.html?bench&rows=1080` (`complex_7`) |
|---|---|---|
| `draw.ms` medián / 95 % / nejvíc | 4,57 / 6,5 / 18,1 | **6,97 / 10,2 / 19,0** |
| volání nejvýš, △ nejvýš | 55, 35 468 | 395, 47 594 |
| práce snímku medián / 95 % | 9,7 / 13,5 ms | 12,4 / 16,8 ms |
| rozestup snímků | 33,3 ms (30 /s) | 33,3 ms (30 /s) |
| pevná práce: skript / paprsky | **60,1** / 23,8 ms | 4,0 / 21,0 ms |
| stavba světla | 840 ms | 12 731 ms |

6. **`complex_7` na 1 080 řádcích: 95 % 10,2 ms**, medián 6,97 ms. Ondřejovo pravidlo (1 080, když se vejde do 10 ms) je na hraně a bez textur; s texturami bude hůř. Podle D-039 se v okně (878 fyzických bodů) 1 080 nekreslí; při 878 řádcích odhad 95 % kolem 7 až 8 ms (poměr bodů 0,66, neměřeno). Otázka pro Ondřeje: výchozí 768, nebo 1 080 se stropem okna.
7. **Cena textur pořád oddělená není**: běh `&tex=0` je na 1 080 řádcích, běh s texturami (5.1 výše) na 576. Navíc pevná práce skriptu 60,1 ms (jinak 4): procesor byl v tu chvíli vytížený (podle snímku obrazovky v jiné kartě běžel výpočet světla `complex_7`). Potřebný běh: `xlab_tex.html?bench&rows=1080`, jen jedna karta s hrou.
8. Oba běhy znovu 30 snímků/s (Úspora energie nebo napájení z baterie trvá).

**Cena textur (Ondřej, 24. 11. 21:20, `xlab_tex.html?bench&rows=1080`, jediná karta, dva běhy):**

| xLab, 2 360 × 1 080 | `draw.ms` medián | 95 % | nejvíc | skript (pevná práce) |
|---|---|---|---|---|
| 14 textur 512 px (18,7 MB), běh 1 | 6,25 | 9,65 | 14,65 | 4,4 ms |
| 14 textur 512 px, běh 2 | 5,97 | 9,45 | 10,75 | 4,7 ms |
| bez textur, `xlab_tex.html?bench&tex=0` (procesor vytížený) | 4,57 | 6,5 | 18,1 | 60,1 ms |
| bez textur, `xlab.html?bench&rows=1080` (krok 5, 19:47) | 5,57 | 7,38 | 9,9 | 4,3 ms |

9. **Textury na všech plochách xLabu stojí na 1 080 řádcích asi +0,4 až +1,7 ms v mediánu a +2,1 až +3,1 ms v 95 %** (rozpětí podle toho, se kterým během bez textur se srovnává; dva běhy bez textur se samy liší o 1 ms). Dva běhy s texturami se shodují na 0,3 ms. Na výchozích 768 řádcích by to při ceně úměrné počtu bodů bylo asi polovina (odhad, neměřeno). Sedí to s xBench 0.2 sešny B (+0,6 až +1,1 ms). **Textury barvy jsou na T460 únosné**; xLab s nimi na 1 080 řádcích má 95 % 9,5 ms, výchozí 768 řádků (Ondřej 21:13) nechává rezervu.

Surový JSON běhu `complex_7` je v příloze na konci souboru; z ostatních dvou jsou tu jen čísla z tabulky (celé jsou v chatu 24. 11. 19:49).

### 5.1a `?bench` (Ondřej, 24. 11., sestavení „vlna 2, krok 2“)

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

- **Dveře od hráče v levelech sešny B**: prefaby dveří mají v zárubni doraz, křídlo jím při otevření na druhou stranu projde (jen vzhled). Rozšiřují se jen dveře v otvoru portálu (37 v `complex_7`), nábytek ne.
- **Průhlednost na T460**: průhledné materiály se kreslí bez zápisu do hloubky a po neprůhledných; cena na T460 neměřená, sklo zatím v datech není.
- **Odražené světlo chybí**: plochy, na které žádná lampa přímo nesvítí, mají jen okolní člen levelu (`complex_7`: 0,05, tedy skoro černé). Řešení je vrstva `indirect` ze zapečeného souboru; běh ho zatím nečte (dluh základu).
- **D-025 a obsah zásuvky** (věc se má vézt se zásuvkou); zlatý vzorek zásuvku s obsahem nemá.
- **D-025 v levelech sešny B**: jestli se tam dveře někde zastaví o hráče tak, že překáží, jsem nehledala.
- **Odchylka barev po tisících přepnutí** světel nebo dveří (rozdíl v jednoduché přesnosti; po jednom cyklu pod 1e-5).
- **Scissor** (ořez bodů na obdélník portálu) není; podle xBench by ušetřil zlomky ms.
- **Prefaby nevrhají stín** ve výpočtu běhu (stůl, skříň, bedna); stíní jen kvádry levelu. Se zapečeným souborem stíní i kolize prefabů v klidu (pravidlo xBake, D-044; ve snímku xLabu stín pod stolem).
- **Zapečené světlo na T460**: čas načtení a vzhled; ve hře soubor zatím není (N-111). Soubor se vzorky dílů prefabů (D-041) sešna B ještě nevyrobila; čtení ověřené jen souborem vyrobeným testem.
- **Textury a `.glb` na T460**: cena textury ve hře (`draw.ms`), čas dekódování WebP a paměť neměřené; `?bench` je teď vypisuje (`textures`, `textureMB`, `meshParts`, `meshTris`), ale level s texturou zatím není (N-111, B2.5).
- **Světlo na síti z `.glb` je po jejích vrcholech**: velká plocha ze dvou trojúhelníků má světlo jen v rozích (stojan v `a_26_view` má přední stěnu jedním odstínem). Doporučení pro B v N-111.
- **Textura světla (N-110) na T460**: čas výpočtu při načtení (stránka během něj stojí), 16 MB textury, cena vykreslení; ve hře se počítá jen hala a jen za přepínačem. Okraj stínu je schodovitý po bodech (10 cm viditelně, 5 cm méně); zjemnění okraje po podílech by stálo 16× paprsků.
- **`.glb` jen ze zkušebních modelů vyrobených kódem**: model z Blenderu (jiné rozložení bloků, `byteStride`, normalizované UV, víc primitiv) ještě engine neviděl.
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
| N-103 | výchozí rychlost kloubu | přijat (`JOINT_TRAVEL_SECONDS`) | čtu ze základu (A2.5) |
| N-104 | dosah interakce od osy těla | přijat | – |
| N-105 | přesvícený xLab | přijat, po převodu světla | – |
| N-106 | plocha obrazovky (`screen.offset`) | přijat | čtu z dat; bez pole odvozuji z dílů (data sady `kit_base`) |
| N-107 | dveře musí zakrýt portál | přijat s úpravou (D-036) | černá clona |
| N-108 | švy a hrubost mřížky světla | proveden (D-037) | – |
| N-109 | dveře na obě strany v datech | otevřený | nastavení „Dveře od hráče“, `swing.js` |
| N-110 | světlo v textuře (bod 5 cm) | otevřený | okraj stínu po podílech, mřížka 0,25 m |
| N-111 | binární soubory balíku (textury, `.glb`) v buildu a v Node | otevřený | engine čte `pack.files`, když jsou; testy je vkládají samy |

**Pro svodnou sešnu:** (0) `composeColors` v `src/xspace/bake.js` sčítá úroveň × barva × E bez dělení π, kontrakt říká jas = barva / π × E; běh π dělí (barvy ze souboru = výpočet při načtení), `composeColors` nevolá. Totéž odraz: xBake ukládá osvětlení (E), dělí se taky. (0b) D-041 bere za vzorky jen díly `box` a `cyl`; díly `mesh` (`.glb`) ve vzorcích nejsou a svítí je běh. (1) v `docs/01_ARCHITEKTURA.md`, oddíl 9, chybí `src/app/probe.js` (sonda fyziky pro `?bench`) a `src/render/opacity.js`, `src/world/swing.js`, `src/world/glb.js`, `src/world/assets.js`; `terminal.js` je obsah obrazovky (text na plátně), klidný režim sám je v `interact.js`. (2) Kontrakt neříká, jestli světlo prochází zavřenými dveřmi se `seeThrough` (mříž ano, dvoukřídlé dveře ne); běh i xBake ho dnes zadržují.

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
- **`h.ok(podmínka, jméno)`: podmínka je první.** S obráceným pořadím je „podmínkou“ neprázdný text a projde všechno (a_26_mesh: 30 zelených, z toho jedna kontrola ve skutečnosti padala). Test psát s pomocnou funkcí v pořadí věty a podmínku obalit `!!`.
- Zkouška „světlo násobí texturu“: v xLabu svítí do haly i chodba portálem a přední stěnu stojanu za sloupem lampa haly nevidí (stín sloupu). Srovnání zapnuto × vypnuto dělat se zhasnutými světly levelu (intenzita 0 v úpravě balíku) a na místě, které lampa opravdu vidí.
- `ImageBitmap` nebere `flipY` z WebGL; převrátit při dekódování (`imageOrientation: 'flipY'`) a textuře dát `flipY = false`.
- Po dekódování vzniká nová `Texture` a materiálům se vymění `map` (výměnu obrázku jiného rozměru v už nahrané textuře jsem nezkoušela; podle čtení three.js 0.187 je úložiště textury alokované na první rozměr).
- glTF má v = 0 nahoře; engine (geom.js) dole: v čtení `.glb` převrátit `v → 1 − v`.
- Úprava souborů základu i „na zkoušku, necommitovat“ (zlatý vzorek přes `tools/golden/make.mjs`) neprošla bezpečnostní kontrolou nástroje. Stejná zkouška jde bez zásahu do repa: kopie balíku do `/tmp`, změna JSON tam a `PACK=/tmp/… node test/a_….mjs` (`loadPack` bere `PACK`).
- Srovnání barev ze souboru s výpočtem: u vrcholů těsně u lampy jsou složky v tisících a součet v jednoduché přesnosti v jiném pořadí se liší v posledních bitech; porovnávat poměrně (|rozdíl| / (1 + |hodnota|)), ne absolutně.
- `E.init()` staví level hned; volba, která mění stavbu (mřížka, dveře, zdroj světla), musí `start()` přimět postavit level znovu.

## 11. Otázky pro Ondřeje

Zodpovězeno 24. 11. 02:26: nejdřív A2.5 a A2.6, textura světla potom; dveře od hráče ano, ať to jde do dat. Zodpovězeno 24. 11. 19:49: zorné pole (a) použitelné, terminál (a) funguje, černé boky (a) počkat na odražené světlo ze zapečeného souboru. 21:13: výchozí rozlišení (a) zůstává 768 řádků. Otevřené jsou v oddílu 1 („Čeká na Ondřeje“).

## 12. Historie (zkráceně; podrobně `git log` a starší znění tohoto souboru)

- **22. 11., sešna A01** (vlna 1, znění 1): A1.1 až A1.8 hotovo (`7d3bec6`); stav `git show 7d3bec6:docs/sesny/A_STAV.md`.
- **22. 11. večer, sešna A02**: přechod na znění 2 (světlo po vrcholech, pevné řádky, zastínění, brány dveří, `?bench`; `56bd047` až `254491e`). Ondřejovy odpovědi A01: ventil a, světlo a zavřené dveře a, skok b, lékárnička a, scissor čekat na měření.
- **23. 11.**: D-024 (`5626629`), D-025 (`f2766ea`), sloučení `zaklad-2` (`a1d3081`), jemnější stíny (`e2be3cc`), A2.3 (`b77837f`). Ondřej: Esc u terminálu koliduje (udělat jinak), stíny jemnější (b), nejdřív dokončit znění 2 (a), 1 080 řádků, když se vejde do 10 ms (b).
- **24. 11. v noci**: sloučeno znění 3 základu (D-037, N-101; `25e17a4`), dveře od hráče, nápověda terminálu, N-109 a N-110, měření F3 z T460 (`c131ac4`). Ondřej: terminál funguje, stíny chce po 5 cm, dveře od hráče, dál A2.5 i A2.6.
- **24. 11. ráno**: zorné pole, `draw.ms`, dveře od hráče v nastavení (`db6fad0`). Ondřej: nejdřív A2.5 a A2.6, dveře od hráče do dat, dva běhy `?bench`.
- **24. 11. odpoledne**: přechod na model Opus 5.5 po limitu; sloučeno D-038 (paměť projektu v repu, `TODO.md`); tento soubor přestavěn (nahoře přehled, deník rozhodnutí, historie dole); dveře od hráče jen v otvoru portálu (`afb5b0a`); A2.5.
- **24. 11. večer**: A2.6 na zkušebních datech (`6e1ab0c`, `3c6bab0`), návrh N-111.

## Příloha: surový `?bench` z T460

`xlab_gen.html?bench`, `complex_7`, sestavení krok 5, 24. 11. 2026 19:45 (Ondřej):

```json
{"env":{"tool":"xLab ?bench · xEngine 0.1 · vlna 2, krok 5 (A02) · 2026-11-24","date":"2026-11-24T18:45:09.861Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36","cores":4,"memoryGB":8,"screen":[1536,864],"dpr":1.25,"gpu":"ANGLE (Intel, Intel(R) HD Graphics 520 (0x00001916) Direct3D11 vs_5_0 ps_5_0, D3D11)","image":[1259,576],"antialias":false},"level":{"id":"complex_7","profile":"real","cells":45,"entities":423,"lights":124,"lightGrid":0.5,"lightSamples":135305,"lightSoftened":15681,"staticTris":137672,"textures":0,"textureMpx":0,"textureMB":0,"meshParts":0,"meshTris":0,"lightPrepMs":295.8,"lightBuildMs":13065},"run":{"seconds":251.5,"frames":8762,"steps":28332,"waypoints":175,"teleports":9},"frame":{"workMs":{"median":7.5,"p95":9.8,"max":116.5},"intervalMs":{"median":33.2,"p95":33.5,"max":14823.9},"fps":30.1},"step":{"ms":{"median":0.25,"p95":0.4,"max":1.29},"perFrame":3.23,"note":"klouzavý průměr času jednoho kroku simulace (120 Hz); sys = totéž po systémech","sys":{"input":{"mean":0.003,"median":0.003,"p95":0.009,"max":0.049},"bench":{"mean":0.005,"median":0.004,"p95":0.012,"max":0.03},"player":{"mean":0.116,"median":0.096,"p95":0.2,"max":0.985},"interact":{"mean":0.007,"median":0.007,"p95":0.016,"max":0.029},"entities":{"mean":0.001,"median":0,"p95":0.005,"max":0.015},"phys":{"mean":0.123,"median":0.117,"p95":0.173,"max":0.427},"world":{"mean":0.003,"median":0.002,"p95":0.008,"max":0.019},"io":{"mean":0.001,"median":0,"p95":0.005,"max":0.014}}},"phys":{"colliders":1079,"collidersNoBody":916,"bodies":160,"dynamic":43,"awake":{"mean":0,"median":0,"p95":1,"max":2},"kinematic":1,"fixed":116,"rapierMs":{"step":{"mean":0.087,"median":0.1,"p95":0.2,"max":0.9},"collision":{"mean":0.021,"median":0,"p95":0.1,"max":0.5},"broad":{"mean":0.004,"median":0,"p95":0,"max":0.2},"narrow":{"mean":0.009,"median":0,"p95":0.1,"max":0.3},"solver":{"mean":0.032,"median":0,"p95":0.1,"max":0.6},"islands":{"mean":0.001,"median":0,"p95":0,"max":0.1},"changes":{"mean":0.002,"median":0,"p95":0,"max":0.2}},"note":"rapierMs je profil jednoho kroku uvnitř Rapieru (step = celek; collision = broad + narrow; solver; islands; changes); hodiny prohlížeče mají krok 0,1 ms, pod ním platí jen průměr (mean). Systém phys v step.sys je celé world.step() včetně obnovy dotazů; rozdíl proti rapierMs.step je režie kolem."},"calib":{"jsMs":3.9,"jsLoop":2000000,"raysMs":20.8,"rays":5000,"sink":true},"draw":{"ms":{"median":2.26,"p95":3.6,"max":36.7},"calls":{"median":52,"p95":194,"max":396},"tris":{"median":9752,"p95":30726,"max":47606},"note":"ms = jedno vykreslení pohledu včetně grafiky, měřeno dávkou bez čekání na obnovu displeje; workMs ve frame je na skutečné grafice svázané s obnovou displeje a o rezervě nevypovídá"},"cells":[{"cell":"c_hall_01","frames":582,"workMsMedian":8,"workMsP95":10.2,"callsMax":205},{"cell":"c_lab_01","frames":142,"workMsMedian":7.4,"workMsP95":9,"callsMax":207},{"cell":"c_lab_02","frames":139,"workMsMedian":7.5,"workMsP95":10.9,"callsMax":212},{"cell":"c_store_01","frames":128,"workMsMedian":7.1,"workMsP95":9.3,"callsMax":195},{"cell":"c_office_01","frames":112,"workMsMedian":7.4,"workMsP95":10.3,"callsMax":206},{"cell":"c_tech_01","frames":143,"workMsMedian":7.7,"workMsP95":9.4,"callsMax":204},{"cell":"c_office_02","frames":139,"workMsMedian":7,"workMsP95":8.6,"callsMax":187},{"cell":"c_corr_01","frames":727,"workMsMedian":7.8,"workMsP95":11.2,"callsMax":337},{"cell":"c_lab_03","frames":163,"workMsMedian":7.5,"workMsP95":9.2,"callsMax":211},{"cell":"c_lab_04","frames":130,"workMsMedian":7.8,"workMsP95":10.5,"callsMax":208},{"cell":"c_corr_02","frames":157,"workMsMedian":7.1,"workMsP95":9.1,"callsMax":207},{"cell":"c_store_02","frames":105,"workMsMedian":7.3,"workMsP95":8.7,"callsMax":202},{"cell":"c_office_03","frames":142,"workMsMedian":7.8,"workMsP95":10,"callsMax":212},{"cell":"c_store_03","frames":134,"workMsMedian":7.3,"workMsP95":9,"callsMax":194},{"cell":"c_office_04","frames":122,"workMsMedian":6.9,"workMsP95":8.6,"callsMax":112},{"cell":"c_tech_02","frames":101,"workMsMedian":6.7,"workMsP95":8.3,"callsMax":114},{"cell":"c_store_04","frames":129,"workMsMedian":7,"workMsP95":8.4,"callsMax":114},{"cell":"c_tech_03","frames":130,"workMsMedian":6.9,"workMsP95":8.3,"callsMax":79},{"cell":"c_corr_03","frames":523,"workMsMedian":8,"workMsP95":10.5,"callsMax":186},{"cell":"c_store_05","frames":165,"workMsMedian":7.4,"workMsP95":8.9,"callsMax":131},{"cell":"c_store_06","frames":110,"workMsMedian":7.9,"workMsP95":10,"callsMax":162},{"cell":"c_office_05","frames":194,"workMsMedian":7.6,"workMsP95":10.3,"callsMax":159},{"cell":"c_tech_04","frames":105,"workMsMedian":6.7,"workMsP95":8.2,"callsMax":58},{"cell":"c_tech_05","frames":166,"workMsMedian":7.5,"workMsP95":9,"callsMax":180},{"cell":"c_store_07","frames":151,"workMsMedian":7.4,"workMsP95":8.6,"callsMax":209},{"cell":"c_tech_06","frames":165,"workMsMedian":6.9,"workMsP95":8,"callsMax":63},{"cell":"c_office_06","frames":108,"workMsMedian":6.9,"workMsP95":8.6,"callsMax":109},{"cell":"c_corr_04","frames":181,"workMsMedian":7.5,"workMsP95":8.6,"callsMax":200},{"cell":"c_store_08","frames":182,"workMsMedian":6.9,"workMsP95":8.7,"callsMax":180},{"cell":"c_lab_05","frames":116,"workMsMedian":7.1,"workMsP95":8.5,"callsMax":53},{"cell":"c_office_07","frames":158,"workMsMedian":7.3,"workMsP95":8.9,"callsMax":203},{"cell":"c_corr_05","frames":763,"workMsMedian":8,"workMsP95":10.8,"callsMax":396},{"cell":"c_store_09","frames":148,"workMsMedian":7,"workMsP95":8.6,"callsMax":151},{"cell":"c_tech_07","frames":95,"workMsMedian":7.2,"workMsP95":9.8,"callsMax":94},{"cell":"c_store_10","frames":160,"workMsMedian":6.9,"workMsP95":8.5,"callsMax":216},{"cell":"c_store_11","frames":92,"workMsMedian":6.8,"workMsP95":10.1,"callsMax":141},{"cell":"c_lab_06","frames":140,"workMsMedian":7.3,"workMsP95":10,"callsMax":173},{"cell":"c_lab_07","frames":203,"workMsMedian":7.7,"workMsP95":10.3,"callsMax":203},{"cell":"c_store_12","frames":114,"workMsMedian":6.9,"workMsP95":7.9,"callsMax":89},{"cell":"c_tech_08","frames":109,"workMsMedian":6.8,"workMsP95":7.9,"callsMax":88},{"cell":"c_store_13","frames":148,"workMsMedian":7,"workMsP95":8.8,"callsMax":82},{"cell":"c_corr_06","frames":543,"workMsMedian":7.5,"workMsP95":8.7,"callsMax":164},{"cell":"c_store_14","frames":265,"workMsMedian":7.7,"workMsP95":8.9,"callsMax":174},{"cell":"c_store_15","frames":120,"workMsMedian":7.7,"workMsP95":8.6,"callsMax":157},{"cell":"c_office_08","frames":113,"workMsMedian":7,"workMsP95":8,"callsMax":80}],"verdict":"Vykreslení jednoho snímku (procesor i grafika, bez čekání na displej): medián 2.26 ms, 95 % 3.6 ms. Rozestup snímků: medián 33.2 ms = 30.1 snímků/s, 95 % 33.5 ms. Krok simulace 0.25 ms (fyzika 0.117 ms, z toho uvnitř Rapieru průměrně 0.087 ms; nespí 0 z 43 volných těles; pevná práce: skript 3.9 ms, paprsky 20.8 ms). Obraz 1259 × 576, volání nejvýš 396, △ nejvýš 47606."}
```
