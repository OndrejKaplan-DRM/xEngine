# Architektura xEngine

Čti po `00_VIZE.md`. Závazná rozhraní jsou v `02_KONTRAKTY.md`; tady je, proč jsou taková.

## 1. Tok dat

```text
 nástroje (sešna B)                      data (xSpace)                       běh (sešna A)
 ───────────────────                     ─────────────                       ─────────────
 xGen      generátory levelů  ──┐
 xForge    prefaby a modely   ──┼──►  packs/<balík>/pack.json      ──►  xWorld  načte, postaví scénu a kolize
 xBake     zapečené světlo    ──┤       materials.json                  xRender kreslí jen viditelné buňky
 xSearcher volné assety       ──┘       prefabs/*.json                  xPhys   Rapier
 xDesigner (od vlny 2)                  levels/*.json                   xPlay   hráč, interakce
                                        assets/ (glb, textury, zvuk)    xShell  menu, nastavení, ukládání
                                              │
                                   npm run check (validátor)
                                   xView (kontrola okem)
```

Jediný směr závislosti: nástroje → data → běh. Běh nikdy nevolá nástroj a nástroj nikdy nesahá do běhu. Obě strany čtou stejný popis formátu (`src/xspace/formats.js`) a stejné funkce pro geometrii a kostry.

## 2. Vrstvy běhu

```text
 xShell   menu · pauza · nastavení · ukládání · vývojářská sada          (nezná engine, mluví přes adaptér)
 ─────────────────────────────────────────────────────────────────────
 xPlay    hráč · profily pohybu · interakce · zbraně · nepřátelé          fáze input, sim
 xWorld   level · buňky a portály · entity · spojení vstupů a výstupů     fáze late
 xPhys    Rapier: svět, postava, tělesa, paprsky                          fáze physics
 xRender  dávky · viditelnost · světla · druhý průchod · obraz            fáze view
 ─────────────────────────────────────────────────────────────────────
 xKernel  registr systémů · fáze · události · pevný krok 120 Hz · režimy · snapshot
```

Vrstva smí volat jen vrstvy pod sebou a mluvit událostmi. Pořadí systémů neurčuje pořadí řádků v `main.js`, ale fáze a deklarované závislosti (`after`). To je přímá odpověď na mez xDOOM (8 až 15 ručních dotykových bodů na nový systém) i na křehké místo Arény („fyzika se v `main.js` přesune před ukládání“).

## 3. Poučení z vývoje enginů a co z něj plyne

| Rok | Engine | Co vymyslel | Co si z toho bere xEngine |
|---|---|---|---|
| 1993 | Doom | svět jako data (WAD), strom BSP | obsah mimo kód: balíky xSpace |
| 1996 | Quake | předpočítaná viditelnost, lightmapy, model klient–server | viditelnost po buňkách, zapečené světlo, simulace oddělená od obrazu |
| 1996 | Build | interaktivní prostředí ze sektorů | každý předmět má stupně volnosti v datech |
| 1998 | Half-Life | spojení výstup → vstup, skriptované sekvence, kostry | pole `io` u entit a spouštěčů; chování levelu bez kódu |
| 1998 | Unreal | editor je engine v jiném režimu | xDesigner poběží nad stejným během jako hra |
| 1999 | Quake III | materiál jako skript, pohyb jako tři funkce | materiály jako data; profily pohybu jako data |
| 2004 | Doom 3 | obrazovky ve světě, kurzor místo zaměřovače | klidný režim: ukotvení kamery a klikání na obrazovku |
| 2004 | Half-Life 2 | fyzika jako herní prvek, zapečené světlo + sondy pro pohyblivé objekty | Rapier jako jediná autorita; sondy světla po buňkách (vlna 2) |
| 2007 | Penumbra | předměty ovládané tažením myši | manipulace: myš hýbe kloubem v jeho mezích |
| 2014–15 | Unreal 4, Unity 5 | fyzikálně založené materiály, datově orientovaný návrh | materiál má drsnost a kovovost v datech; světla v kandelách |
| 2020+ | glTF, meshopt, KTX2 | společný formát assetů a jejich komprese | modely jako `.glb`, komprese textur podle výsledku xBench |
| 2022 | Unreal 5 | geometrie a světlo bez ručního ladění | pro T460 mimo dosah; bere se jen zásada „rozpočet hlídá nástroj, ne člověk“ |

Poučení, které není v tabulce: **enginy, které přežily, měly nástroje.** Carmack měl lepší technologii, Epic měl editor. Proto má druhá sešna stejnou váhu jako první.

## 4. Vykreslení na T460

Strategie je „vzhled roku 2003 metodami roku 2003, kde to stroj vyžaduje“. Měření z 22. 11. 2026 (`06_ROZPOCTY`) rozhodlo takto:

1. **Světlo po vrcholech, po vrstvách.** Stroj unese hodně geometrie a málo výpočtu na pixel: scéna bez výpočtu světel 2,4 ms, tatáž se 4 bodovými světly 14,0 ms. Proto se světlo statického světa počítá na procesoru po vrcholech sítě s buňkou 0,5 m (`brushLightMesh`) a ukládá po vrstvách, jedna na světlo. Lampa na vypínač mění jen úroveň své vrstvy. Je to postup Half-Life (světelné styly) a volba „vertex lighting“ z Quake III pro slabé stroje. Ve vlně 1 se vrstvy spočítají při načtení levelu, od vlny 2 je dodá xBake včetně stínů a odraženého světla.
2. **Materiály bez výpočtu světel.** Svět kreslí `MeshBasicMaterial` s barvou vrcholů. Ve scéně není bodové světlo, stínová mapa (změřeno +11 ms) ani fyzikální materiál (+5,5 ms).
3. **Pohyblivé díly** (dveře, bedny, později zbraň a tvorové) se osvětlují týmž vzorcem po stěnách dílu, s přepočtem jen při pohybu nebo změně světla. Stín pod nimi je nanejvýš tmavá skvrna.
4. **Jedno efektové světlo** (záblesk výstřelu, baterka): xBench 0.2 změřil jedno světlo po pixelech na +2,2 až +3,9 ms proti 2,4 ms (interiér, 1366 × 768), čtyři na +7,4 až +8,3 ms. Na stupni `low` smí být ve scéně nejvýš jedno (`06_ROZPOCTY`).
5. **Statické dávky.** Kvádry a nepohyblivé prefaby se slučují po buňce a materiálu. Volání kreslení jsou levná (800 volání 7,2 ms), mez je 400.
6. **Pevné vnitřní rozlišení.** Obraz se počítá v 768 řádcích (volby 576, 768, 1080) a zvětšuje se na displej; nikdy podle `devicePixelRatio`.
7. **Buňky a portály** zůstávají v datech a ve hře slouží od vlny 2 k ořezu pohledem. Na levelu velikosti xLabu ořez nic měřitelného nepřináší.
8. **Druhý průchod pro zbraň** (invariant F5 z Level 1).

## 5. Dvě mutace a klidný režim

Mutace je **profil v datech**, ne větev v kódu:

| | `arena` (svižná) | `real` (klidná) |
|---|---|---|
| vzor | Quake III Arena | Half-Life, Counter-Strike |
| pohyb | rychlost 8,1 m/s, zrychlení ve vzduchu bez stropu, výskoky | rychlost 6,4 m/s, strop přání ve vzduchu, bez třesu |
| interakce | „použít“ jednou klávesou | navíc manipulace a klidný režim |
| level | určuje `profile` v datech, jde přepnout za běhu ve vývojářském režimu | |

Tři úrovně interakce, všechny řízené daty prefabu:

1. **Použít.** Paprsek z oka, klávesa. Tlačítko, vypínač, dveře na pohon.
2. **Manipulovat.** Držení tlačítka myši a pohyb myší hýbe kloubem v jeho mezích. Páka, ventil, zásuvka, křídlo dveří.
3. **Klidný režim.** Kamera se ukotví k místu (`station`). Zámek kurzoru zůstává; pohyb myši vede vlastní kurzor po obrazovce ve světě, klik je „použít“ v místě kurzoru. Odchod klávesou „použít“ nebo krokem; Esc je všude pauza (D-024). Terminál, pracovní stůl, ovládací panel.

## 6. Kostra před tvarem

Každý prefab má `rig`: uzly a klouby. Platí pro dveře stejně jako pro tvora.

- Kloub má typ (`hinge` ve stupních, `slider` v metrech), osu, meze, klidovou polohu, zarážky, pružinu a pohon.
- Viditelné díly a kolize se věší na uzly. Tvar je výměnný, kostra ne.
- Engine o „dveřích“ neví nic; ví, že kloub `hinge` jde od 0 do 105 stupňů a že interakce `door` ho smí pohánět.
- U tvorů se ke kostře přidají klipy. Pořadí práce ve xForge: kostra → rozsahy kloubů → pohyby → teprve potom tvar a povrch.

Omezení verze 1 (vědomé): jeden kloub na uzel. Interakcí smí mít prefab víc (N-010, D-052, 25. 11. 2026): skříň se třemi zásuvkami je jeden prefab se třemi interakcemi a hráč ovládá tu, jejíž kloub hýbe zasaženým dílem (`interactionOf`).

## 7. Aréna v2 → xEngine

| Oblast | Aréna v2 (v2.9) | xEngine | Jak se pozná |
|---|---|---|---|
| level | kód v `world/*.js` (přes 3 000 řádků) | data xSpace z nástroje | nový level bez změny `src/` |
| viditelnost | jen ořez pohledem, až 381 volání u limitu 400 | buňky a portály | volání kreslení klesne při zavřených dveřích |
| světlo | fond 4 až 14 bodových světel, vše za běhu | zapečené + rozpočet dynamických | čas snímku při 10 světlech v levelu |
| pořadí systémů | pořadí registrace | fáze a závislosti | test T0 |
| události | volné řetězce | deklarované, překlep shodí test | test T0 |
| interakce | střelba a sebrání | použít, manipulovat, klidný režim | testy vlny 1 |
| předměty | zvláštní kód pro každý druh | kostra a součásti v datech | nový předmět = jen soubor |
| assety | vložené do jednoho HTML (11,6 MB) | balíky s otisky a licencemi | manifest a validátor |
| obsah z nástrojů | Blender skripty na zakázku | generátory s parametry a seedem | 200 seedů bez nálezu |
| regrese | asi 60 minut | testy dat v Node do sekundy, prohlížeč jen na obraz | čas `npm test` |

Co se z Arény přebírá beze změny: Rapier a zkušenosti s ním (`arena-fyzika`), pohyb ve stylu Quake, pevný krok 120 Hz, slučování po materiálu, testování přes `sim()`. Co dalšího převzít (zbraně, výbuchy, zvuk, tvorové, modely) a komu: `docs/prevzeti/ARENA.md` (soupis z větve `hra`, v2.9, 24. 11. 2026).

## 8. Co se záměrně odkládá

Síťová hra. Venkovní terén s výškovou mapou (potřebuje nový tvar v xSpace). Tvorové se skinem a animacemi (vlna 2 až 3). Zvuk (vlna 2). WebGPU (až bude důvod a měření). Sledování paprsků (nikdy na T460).

## 9. Moduly dnes

Stav 24. 11. 2026 večer, po sloučení vlny 2 do základu (D-048): všechny moduly níže jsou v `zaklad-2` (= `main`). Sloupec „Vlastní“ říká, kdo modul mění. Co se právě dělá, je v `TODO.md`.

### Základ (mění jen svodná sešna)

| Modul | Složka, hlavní soubory | Co dělá | Testy |
|---|---|---|---|
| xKernel | `src/kernel`: `engine.js`, `store.js`, `rng.js` | registr systémů, fáze a závislosti `after`, deklarované události, pevný krok 120 Hz, režimy, uložení stavu, náhoda přes `rngNext` | T0 |
| xSpace | `src/xspace`: `formats.js` (jediná pravda o polích), `validate.js` (stálé kódy nálezů; tvar v `check.js`, prefab v `check-prefab.js`), `interact.js` (interakce prefabu: `interactions`, `interactionOf`, `doorInteraction`, N-010), `load.js` (balíky, `mergePacks`, `materialFrom`), `geom.js` (kvádry, klíny, díly prefabů `partMesh` / `partTris` / `partCollider`, síť pro světlo `brushLightMesh` a `levelLightMeshes`), `samples.js` (vzorky světla levelu `levelSamples`, D-041), `light.js` (vzorec osvětlení), `bake.js` (čtení zapečeného světla, `doorOpenness`, D-044), `body.js` (rozměry postavy, D-040), `rig.js` (matice koster: `rigCompile` / `rigSolve` bez alokací, obálka `rigMatrices`, svázané klouby `jointFollow` / `rigFollow`) | formát dat a vše, co z něj musí A i B počítat stejně | T1 (včetně mutací), kontrola dokumentu polí |
| xShell | `src/shell` | menu, pauza, nastavení z deklarací, katalog nabídek; engine nezná, mluví přes adaptér (D-006) | T4 (jen nastavení) |
| zlatý vzorek | `packs/golden` (level xLab, 12 prefabů), generátor `tools/golden/make.mjs` | referenční data; výstup generátoru je bajtově shodný s repem | T1 |
| xView | `tools/xview` → `dist/xview.html` | prohlížeč balíku: pět pohledů, vrstvy, validátor v prohlížeči | T2 |
| xBench | `tools/xbench` → `dist/xbench.html` | měření stroje (28 případů); podle něj `06_ROZPOCTY` | T3 |
| cíl `xlab_gen` | `tools/xlab_gen` → `dist/xlab_gen.html?level=N` | engine + balík `gen_demo` sešny B i se soubory `kit_base` (textury, N-111); soubor, který Ondřej zkouší na T460 | T5 v prohlížeči |
| zkouška A × B | `test/t5_axb.mjs`, `test/t5_lib/` (navigace a robot) | robot projde levely sešny B v enginu sešny A jen vstupy hráče | T5 (`npm run test:axb`) |
| nástroje | `tools/lib/read-pack.mjs` (čtení balíku, `files` pro N-111), `tools/xspace-check.mjs` (validátor), `tools/xspace-doc.mjs` (dokument polí), `tools/light-stat.mjs` (počty vzorků a T-spoje), `tools/run-tests.mjs`, `build.mjs` (cíle z `target.json`, soubory balíku jako base64) | | |

### Běh (sešna A)

| Modul | Složka, hlavní soubory | Co dělá |
|---|---|---|
| xWorld | `src/world`: `world.js` (stavba levelu), `cells.js` a `visibility.js` (buňky, portály, ořez pohledem), `entities.js`, `behaviors.js` (dveře, ovladače, dveře od hráče), `joints.js`, `io.js` (spojení výstup → vstup), `blocking.js` (D-025), `lightfield.js` a `lighting.js` (světlo po vrcholech, vrstvy, okraj stínu po podílech), `occlusion.js` (zastínění a brány dveří; náhradní řešení, dokud běh nečte zapečený soubor), `facets.js`, `swing.js` (dveře od hráče pro data bez rozsahu na obě strany, N-109), `glb.js` (čtení `.glb` bez knihovny), `assets.js` (soubory balíku z `pack.files`) | level z dat do scény a kolizí, entity, světlo |
| xRender | `src/render`: `render.js`, `batch.js` (statické dávky po buňce a materiálu), `materials.js` (textura × `color` / `albedoMean`, N-009), `opacity.js` (průhlednost, N-005), `fov.js` (zorné pole jako vodorovný úhel při 4 : 3), `rows.js` (pevné řádky se stropem výšky plátna, D-023, D-039), `null.js` (vykreslení pro Node) | kreslí viditelné buňky, clona portálu |
| xPhys | `src/phys`: `phys.js`, `xform.js` | Rapier: svět, postava (odstup ze `src/xspace/body.js`), tělesa, paprsky, `trimesh` z `.glb` |
| xPlay | `src/play`: `player.js`, `move.js`, `profiles.js` (`arena`, `real`; tělo ze základu), `input.js`, `actions.js`, `interact.js` (použít, manipulovat, klidný režim D-024), `terminal.js` (obsah obrazovky ve světě) | hráč a interakce |
| aplikace | `src/app`: `main.js`, `game.js`, `settings.js`, `dev.js` (F3, F4), `hud.js`, `lock.js`, `bench.js` (`?bench`, F9), `probe.js` (sonda fyziky pro `?bench` a F3), `xlab_tex/` (zkušební cíl s texturami) | sestavení hry `dist/xlab.html` a napojení na Shell |

### Obsah a nástroje (sešna B)

| Modul | Složka, hlavní soubory | Co dělá |
|---|---|---|
| xGen | `src/gen`: `layout.js`, `build.js`, `passage.js`, `furnish.js`, `catalog.js`, `body.js` (rezerva generátoru nad postavou ze základu), `presets/complex.js`, `presets/catacombs.js`, `cli.mjs` | generátor levelů ze seedu; 200 seedů bez nálezu |
| xForge | `tools/forge`: `kit/*.mjs` (prefaby po druzích), `lib.mjs`, `materials.mjs`, `textures.mjs` (textury sady z příjmu xSearcheru, zámek), `make-kit.mjs`, galerie → `dist/kit.html` (pohledy čistý, T460, grafická karta) | sada `packs/kit_base` (49 prefabů, 30 textur WebP 512 px) |
| xBake | `tools/bake`: `bake.mjs` (vrstvy), `rays.mjs` (paprsky, stínění kvádry a kolizemi prefabů), `gates.mjs` (brány dveří, D-035), `format.mjs` (zápis a otisky), `scene.mjs`, `cli.mjs`, náhled → `dist/xbake.html` | zapečené světlo `levels/<id>.light.bin`; čtení je v základu (`src/xspace/bake.js`) |
| xSearcher | `tools/searcher`: `find.mjs`, `sources/` (Poly Haven, ambientCG), `inbox.mjs`, `match.mjs`, `zip.mjs`, `http.mjs`, `ZDROJE.md` | hledání a příjem volných assetů CC0 do `packs/_inbox` se záznamem původu a licence |
| xDesigner | `tools/designer` → `dist/xgen.html` | prohlížeč vygenerovaných levelů; klikací designer zatím není |
| balíky | `packs/kit_base`, `packs/gen_demo` (tři levely: `complex_7`, `complex_21`, `catacombs_3`) | data pro hru a zkoušky |

### Tok dat za běhu

```text
balík (pack.json, levels/*.json, prefabs/*.json, materials.json, assets: textury, .glb)
  └─ load.js + validate.js (+ pack.files ze sestavení, N-111)
       └─ world.js: kvádry → statické dávky (batch.js), kolize (phys.js)
                    entity → díly (partMesh, glb.js), kolize (partCollider, trimesh), klouby (rig.js)
                    vzorky světla (levelSamples: kvádry + pevné díly) → lightfield.js
                    zastínění (occlusion.js, paprsky Rapieru), brány dveří (doorOpenness)
  └─ smyčka 120 Hz: input → sim (player, interakce) → physics (Rapier) → late (entity, io) → view (ořez, světlo, kreslení) → ui
xBake (sešna B) počítá vrstvy světla mimo hru do levels/<id>.light.bin; běh soubor zatím nečte (úkol sešny A, čtení je v src/xspace/bake.js).
```
