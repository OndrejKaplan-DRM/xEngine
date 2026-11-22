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
4. **Jedno efektové světlo** (záblesk výstřelu, baterka) je otevřená otázka: cenu jednoho světla po pixelech xBench 0.1 neměřil. Do měření se s ním nepočítá.
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

Omezení verze 1 (vědomé): jeden kloub na uzel a jedna interakce na prefab. Skříň se třemi zásuvkami jsou tři entity.

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

Co se z Arény přebírá beze změny: Rapier a zkušenosti s ním (`arena-fyzika`), pohyb ve stylu Quake, pevný krok 120 Hz, slučování po materiálu, testování přes `sim()`.

## 8. Co se záměrně odkládá

Síťová hra. Venkovní terén s výškovou mapou (potřebuje nový tvar v xSpace). Tvorové se skinem a animacemi (vlna 2 až 3). Zvuk (vlna 2). WebGPU (až bude důvod a měření). Sledování paprsků (nikdy na T460).
