# Stav sešny B

**Vlna:** 2 (zadání nahoře v `START_B.md`) · **Větev:** `sesna-b` · **Základ:** základ 2, znění 5 (`zaklad-2` = `main` = `608f0cb`: sloučená vlna 2 obou sešen, D-045 až D-048), sloučeno 24. 11. 2026 (`614e4d7`) · **Stav:** 24. 11. 2026 v noci, sešna B04 (krok 20: sady `kit_lab` a `kit_it` v levelech)

> **Základ.** Od znění 5 je v základu i engine sešny A z vlny 2 (světlo po vrcholech, textury a `.glb`, `?bench`) a moje vlna 2 do `ba16d8d`. Nová pole a rozhodnutí, která se týkají dat sešny B: `albedoMean` (D-045, N-009 přijat), soubory balíku ve hře (D-046, N-111), zavřené dveře se `seeThrough` zadržují světlo (D-047).

## Vlna 2: kde jsme (23. 11. 2026)

Zadání vlny 2 je nahoře v `docs/sesny/START_B.md` a má přednost. Stav proti němu:

| Úkol vlny 2 | Stav | Poznámka |
|---|---|---|
| B2.1 průchodnost pro skutečného hráče a katakomby | **hotovo** (24. 11. 2026, `d2e1481`) | katakomby podle volby 2 b, prkenné dveře se světlostí 0,90 m, zkouška A × B zelená. Generátor hledá cestu místností s poloměrem z rozměrů postavy (`src/gen/body.js`: kapsle 0,35 m + odstup kontroléru 0,02 m + rezerva 0,03 m; dřív číslo 0,32 m v kódu) a každý otvor i otevřené dveře musejí pustit postavu (`catalog.clearWidth`). Kontroly levelů měří skutečným hráčem z profilu enginu (`test/b_lib/player.mjs`). 200 seedů × 2 předvolby bez nálezu. Čísla v oddílu „Sešna B03“. Návrh N-008: rozměry postavy do základu |
| B2.2 přijatá pole (`components.place`, `opacity`, `passable`, `seeThrough` u mříže, `speed`) | **rozpracováno** | `opacity` 0,3 u `glass_pane` a `screen.offset` u terminálů (24. 11. večer, `905d029`); `seeThrough` mají křídla dvoukřídlých dveří; zbytek nezačat |
| B2.3 xSearcher | **hotovo** (24. 11. 2026, `5828344`, `24e2358`) | `tools/searcher/find.mjs`: hledání (i česky) a příjem textur CC0 z Poly Haven a ambientCG do `packs/_inbox` (mimo git) se záznamem o původu, licenci a otiscích; 10 assetů v příjmu (82,5 MB, 2K); test bez sítě `b_t7_searcher` (47 kontrol). Podrobně oddíl „Sešna B03“ a `tools/searcher/ZDROJE.md` |
| B2.4 vzhled v polích, která formát má (hrubý tvar, textury barvy, přepínač v galerii) | **textury hotovo** (24. 11. 2026, `7204c2d`, `046f9a7`, `951044a`); **bohatší tvar: první dávka a zásuvky** (24. 11. večer, `5e03d87`, `8d52fb5`) | 21 materiálů `kit_base` má `albedo`, `normal` a `uvScale` (30 souborů WebP 512 px, 1 287,4 kB); galerie 0.2 s pohledy čistý / T460 / grafická karta a vzorníkem materiálů; montáž 10 prefabů. Barva materiálu a textura si v kontraktu odporují: návrh N-009. Podrobně oddíl „Sešna B03“ |
| B2.5 zkouška povrchu na jednom kusu (dveře `.glb`, materiál s texturou) | nezačato | |
| B2.6 xBake a N-001 | **hotovo podle D-035 a zadání vlny 2** (24. 11. 2026, `3d1aa2a`, `7dd9cd2`) | (1) křídla dveří v portálech přímé světlo nestíní; světlo otvorem portálu s dveřmi je v úseku vrstvy s polem `gate` a běh ho násobí otevřením dveří. (2) Stíní kolize prefabů přes `partCollider` ze základu. (3) Vzorek na okraji stínu svítí podílem své plošky (4 × 4 paprsky). (4) Čtení souboru bez Node (`tools/bake/read.mjs`), připravené k přenosu do základu. Běh soubor dál nečte. Podrobně oddíl „Sešna B03“ a návrh N-001, znění 2 |
| B2.7 xDesigner, dům, tvor | nezačato | |

## Sešna B04 (24. 11. 2026 večer, model Opus 5.5)

Navazuje na B03 po přepnutí modelu (Ondřej v 15:58: limit u Fable 5.2, pokračovat bez ztráty práce, „používej často Git“). Práce podle Ondřejových odpovědí z 19:55 (níže v oddílu B03).

| Krok | Stav | Commit |
|---|---|---|
| dodatek znění 4: `TODO.md` a `CLAUDE.md` verzí základu, `BODY` ze `src/xspace/body.js`, čtení souboru světla ze `src/xspace/bake.js`, `tools/bake/read.mjs` smazán | hotovo | `ba16d8d` |
| barvy materiálů podle albeda (volba 1 a) a expozice předvoleb | hotovo | `6f3141b` |
| bohatší tvary, první dávka (volba 3 a) | hotovo | `5e03d87` |
| zásuvky nezávisle, duté, s přihrádkami; návrh N-010 | hotovo | `8d52fb5`, `1696306` |
| sloučení znění 5 základu (vlna 2 v `main`) | hotovo, bez konfliktů | `614e4d7` |
| `albedoMean` (D-045), `opacity` skla (N-005), `screen.offset` terminálů | hotovo | `905d029` |
| dřevo se suky, trhlinami a letokruhy | hotovo | `60ddb43` |
| sady `kit_lab` (286 prefabů) a `kit_it` (80 prefabů) | hotovo | `611f325`, `334315f`, `1952f28`, `105c8ac`, `428b2e8`, `42b7dae` |
| zařazení obou sad do předvolby `complex` (obory laboratoří, serverovna, výpočetní sál, open space, zasedačka) | hotovo | `3f45c21` a následující |
| `kit_home` s předvolbou bytu; xBake zapeče pevné díly prefabů (D-041) | nezačato | |

**Bohatší tvary (`tools/forge/shapes.mjs`).** Jen z kvádrů a válců: pevné díly prefabu z kvádrů a válců zapeče xBake (D-041) a engine A je kreslí bez `.glb`. Funkce: `bevelBox` (sražené hrany ze tří překrytých kvádrů, 36 △), `planks` (prkna se škvírami, drobně různou tloušťkou a délkou podle semínka), `framedPanel` (rám s vpadlou výplní), `cornice` (římsa po vrstvách), `lathe` (soustružený profil z válců), `tray` (dutá vana s přepážkami), `handle` (madlo), `noise` (opakovatelná nepravidelnost podle id). Přestavěno: bedny (prkna se škvírami 6 mm, tmavé jádro, rohové lišty), sudy (dřevěný s vyboulením a obručemi, ocelový s lemy a žebry), truhla (prkna, kování, vnitřní přihrádka), skříň s dvířky (rám s výplní, římsa, zapuštěný sokl, police s lištou), stoly (prkenná deska, gumové patky, lubové desky, příčky), židle, regály (úhelníky, police s lištou, krabice), kamenná lavice.

**Mez trojúhelníků.** Bohatší tvar se do odhadu z `06_ROZPOCTY.md` (prefab ≤ 500 △ běžný, ≤ 2 000 △ složitý; je to odhad sešny B, ne měření) nevešel. Změnila jsem kontrolu v `b_t2`: běžný prefab ≤ 1 000 △, přístroj ≤ 2 000 △, a v `b_t1` nově **celý level ≤ 300 tisíc △** (kvádry + prefaby; změřená mez viditelné scény z `06_ROZPOCTY.md`, celý level je horní mez toho, co je vidět). Po zásuvkách: `complex` 101 344 až 191 324 △ na level, `catacombs` 35 496 až 76 880 △ (b_t1, 500 seedů). **Pro svodnou sešnu:** řádek „prefab“ v `06_ROZPOCTY.md` by měl říkat ≤ 1 000 △; rozhoduje měření scény, ne prefab.

**Zásuvky nezávisle (Ondřej: „otevírat i spodní šuplíky nezávisle na prvním“).** Formát verze 1 unese jednu interakci na prefab. Dočasné řešení bez změny formátu: kartotéka (`cabinet_file_01`) a stůl (`desk_office_01`) jsou korpusy bez kloubu a v `source.params.attach` jmenují své zásuvky (`drawer_file_01` 4×, `drawer_desk_01` 3×) s polohou v prostoru korpusu. Generátor je postaví jako vlastní entity hned za korpusem (`furnish.js`, `tryPlace`), katalog (`catalog.js`: `attachments`, `restBox`, `sweptBox`) počítá obaly i se zásuvkami, takže rozmístění nechá místo pro vytažené zásuvky. Trvalé řešení navrhuju v **N-010** (doporučená varianta: `interact` jako seznam).

- Zásuvky jsou **duté**: vana s bočnicemi, zády, dnem a výsuvy. Kartotéka: šest závěsných desek (zelené a z hnědé lepenky `paper_kraft`, nový materiál bez textury) na lištách, štítky, papíry; čelo se sraženými hranami, rámeček na štítek, madlo, zámek nad horní zásuvkou. Stůl: podélná a příčná přepážka (tužky vpředu, papíry vzadu), dvě tužky. Korpusy mají příčky mezi šachtami, výsuvy na bocích a zapuštěný sokl.
- Tak čtu „vnitřní kompartmentizaci“ (varianta a: přihrádky v zásuvkách a police ve skříních). Otázka na Ondřeje, jestli myslel spíš kresbu dřeva (varianta b), je otevřená.
- Trojúhelníky: `cabinet_file_01` 316, `drawer_file_01` 456 (kartotéka celkem 2 140), `desk_office_01` 292, `drawer_desk_01` 320 (stůl celkem 1 252). Sada: 51 prefabů (12 200 △), 42 materiálů.
- Generované levely: `complex` 44 až 189 zásuvek na level (medián 105 až 112 podle běhu), entit 412 až 714 (medián 510 až 543), tedy zhruba o pětinu víc entit než se zásuvkou v korpusu; nejvíc 48 entit v jedné buňce (`complex`, 100 seedů; odhad v `06_ROZPOCTY.md` je ≤ 150). Cena víc entit v běhu na T460 **není změřená**; s xBench nebo `?bench` nad `complex_7` ji změří až Ondřej.

| Kontrola | Výsledek | Kde |
|---|---|---|
| připojené zásuvky existují, mají interakci, sedí do korpusu, nepřekrývají se, jsou duté (60 % bodů vnitřku vany volných) | 7 zásuvek u 2 korpusů | `b_t2` |
| u každého korpusu v levelu stojí jeho zásuvky na místě a s natočením podle korpusu (1 mm, 0,1°) | 0 nálezů na 500 seedech | `checkAttachments` v `b_lib/level-checks.mjs`, `b_t1` |
| v enginu A (`complex_7`): spodní zásuvka se otevře sama (0,45 m), ostatní tři stojí | ano | `b_t8_zasuvky.cjs` |
| hráč zamíří na třetí zásuvku zdola a vytáhne ji skutečnou myší (0,29 m); druhá a horní stojí | ano | `b_t8` |
| prostřední zásuvka stolu se otevře sama (0,33 m) | ano | `b_t8` |

Snímek `test/out/b_zasuvky.png` (kartotéka se spodní a třetí zásuvkou otevřenou, stůl s otevřenou prostřední; engine A s texturami). Past: pohon zásuvky se zastaví o hráče, který stojí v její dráze (D-025); hráč musí stát dál než 0,8 m od čela kartotéky.

**Znění 5 základu.** Sloučení bez konfliktů. `albedoMean` zapisuje `make-kit.mjs` z průměru hotového souboru v zámku textur; galerie bere zesílení `color / albedoMean` z dat materiálu (zámek už jen jako záloha). `glass_pane` má `opacity` 0,3 (galerie ho kreslí průhledně), terminály `screen.offset` 1 mm před svítícím dílem (0,005 a 0,004 m). Kontrola textury v galerii (B-T3) je teď na dřevěné skříni: nová kartotéka má víc odstínů už v čistém pohledu (45), takže poměr 1,5× k textuře přestal měřit texturu.

**Dřevo (Ondřej 19:55, krok 5; `60ddb4c`).** Smrk `wood_pine` ← ambientCG `Wood096` (suky, výsušné trhliny, letokruhy), dub `wood_oak` ← `Wood049` (vystouplé letokruhy), staré dřevo `wood_old` ← `Wood060` (tmavé, jemné trhliny). Odstín barvy materiálu je z průměru fotky, jas z albeda (smrk 0,38, dub 0,20, staré 0,14), takže textura jde v barvě, ne v šedi (odstín ×1,01 až 1,04). Vybírala jsem z náhledů 17 dřev Poly Haven a 24 ambientCG a z originálů pěti kandidátů (`tools/searcher/ZDROJE.md`). Galerie má tónové mapování Khronos PBR Neutral (AgX dřevo odbarvoval do růžova) a kontrola jasu textury v B-T3 měří lineárně přes celou periodu textury (odchylka nejvýš 2,9 %, mez 5 %; dřív 7,6 % při mezi 10 %, protože okno měření bralo jen kus textury).

**Ondřej ve 20:38: „do začátku bych chtěl cca 600 těles a objektů“** (byty a domy: obývák, ložnice, kuchyně, koupelna, dětský pokoj, okna, topení, lampy; IT: laboratoře, serverovny, open space, superpočítače; vědecké laboratoře: organická chemie, biochemie, molekulární biologie, genové manipulace, fyziologie, genové a tkáňové inženýrství; přístroje od vah po elektronový mikroskop, bioreaktory; terária, akvária, klece, karanténa; laboratorní sklo a plast; inspirace weby P-lab, Thermo Fisher, Waters, Shimadzu, Eppendorf, Sigma-Aldrich, Serva, PragoLab a dalších). Jeho odpovědi na čtyři otázky (20:4x):

- **Pořadí: laboratoře a IT první** (objeví se hned v levelech `complex`); byty a domy potom, s novou předvolbou generátoru.
- **Počet: asi 150 tvarů × varianty** (rozměr, barva, materiál, textura), ne 600 různých tvarů.
- **Balíky: tematické** `kit_lab`, `kit_it`, později `kit_home` vedle `kit_base`; level si bere jen ty, které potřebuje (`requires`).
- **Detail: do 1 000 △ jako dnes**; víc až s polem `lod`.
- K tomu (moje pravidlo, Ondřejovi napsané v otázce): rozměry a uspořádání přístrojů z katalogů výrobců, tvary obecné, bez log, názvů a kopie konkrétního designu.

**Regrese po B04** (sandbox): `npm test` T0 41, T1 156, T4 46, T2 15, T3 12; `npm run test:b` 209 (B-T1 62, B-T2 33, B-T3 12, B-T4 20, B-T5 26, B-T6 9, B-T7 47) + B-T8 7; `npm run test:axb` 37; 0 selhalo.

### Sady `kit_lab` a `kit_it` (Ondřej 20:38, „600 těles“)

Tematické balíky vedle `kit_base` (volba Ondřeje): každý má `requires` (`kit_lab` → `kit_base`; `kit_it` → `kit_base`, `kit_lab`), vlastní materiály a prefaby a id se s ostatními nesmí potkat. Rozměry z katalogů výrobců a obvyklých norem (`tools/forge/lab/ROZMERY.md`), tvary obecné, bez log a názvů. Jen kvádry a válce (zapeče je xBake, D-041), do 1 000 △ na prefab.

| Sada | Prefabů | △ celkem (nejvíc) | Materiálů | Obsah |
|---|---|---|---|---|
| `kit_lab` | 286 | 93 580 (968) | 38 | sklo (kádinky, baňky Erlenmeyerovy, varné a odměrné, odměrné válce, reagenční láhve, exsikátory, stojany s byretou a s nálevkou, destilace); plasty (zkumavky, stojánky, špičky, Petriho misky, destičky, kryoboxy, střičky, kanystry, láhve HDPE, sáčky, rukavice, nádoby na ostré předměty a led); chemikálie ve 20 druzích balení (láhve 100 ml až 2,5 l s piktogramy, dózy s práškem, papírový pytel, kity, plechovka a bezpečnostní kanystr na rozpouštědla, roztoky, odpad); stolní přístroje (52: váhy, centrifugy, termomixér, vortexy, míchačky, třepačky, termocyklér, qPCR, spektrofotometry, elektroforézy, gel-doc, elektroporátor, UV lampa, pipety, vývěvy, odparka, lázně, pH metr, mikroskopy, tlakové láhve, Dewarovy nádoby); velké přístroje (UPLC, HPLC, MS, GC, GC-MS, sekvenátory, konfokální mikroskop, TEM, SEM, autoklávy, boxy třídy II, laminární box, CO₂ inkubátory, lyofilizátor, pipetovací robot, cytometr, NMR, myčka, výrobník ledu, ultračistá voda); chlazení (mrazáky −80 °C ve třech šířkách, lednice, mrazák −20 °C, truhlicový mrazák, zásobník LN2, chladicí a mrazicí komora, do které se dá vejít); nábytek (stoly ke zdi 1,2 až 1,8 m s nástavbou, ostrůvek, stůl s výlevkou, regály, bezpečnostní skříně, digestoř 1,8 m, židle, vozík, nouzová sprcha); reaktory a bioreaktory; akvária, terária, klece IVC a regál, klec pro králíka, průchozí box, izolátor, dekontaminační sprcha, odpad |
| `kit_it` | 80 | 15 128 (888) | 33 | počítače (monitory 24 až 34" i na výšku, skříně, mini, vše v jednom, notebooky, tablety, telefon, klávesnice, sestavy na stůl, tiskárny, multifunkce); serverovna (racky 42U se servery, síťový, diskové pole, otevřený rám, superpočítač, UPS, baterie, chlazení do řady a CRAH, kabelové žlaby, perforovaná dlaždice, hasicí plyn, čtečka karet, kamera, Wi-Fi); open space (stoly pro čtyři, stoly s nastavitelnou výškou, židle, jednací stoly 2,4 a 4 m, telefonní budka, tabule, akustické panely, televize, projektor a plátno, rostliny, sedačky a sedací vaky, kuchyňka, skříňky, stolní tenis, fotbálek, skleněná příčka, recepce) |

Zápis: `node tools/forge/make-pack.mjs [kit_lab|kit_it|all]` → `packs/<sada>`, přehled `tools/forge/<lab|it>/SADA.md` (generovaný) a meta balík `packs/kit_all` (jen `requires`, pro galerii). Kontroly v **B-T9** (`test/b_t9_sady.mjs`, 14): validátor, bajtová shoda zápisu, jména, do 1 000 △, `place` podle uchycení (podlaha a deska y ≥ 0, strop pod počátkem, zeď z ≥ 0), kolize, materiály i ze závislých sad, poznámky ke kloubům, rozměry 2 mm až 4 m, kolize id mezi sadami. Galerie (`dist/kit.html`) ukazuje všechny tři sady s nadpisy, B-T3 dělá montáž každé sady (`test/out/b_kit_lab_galerie.png`, `b_kit_it_galerie.png`).

### Sady v generovaných levelech (krok 20)

- **Více sad v generátoru.** `mergeKits` (`src/gen/catalog.js`) spojí sady do jednoho katalogu; sada, jejíž `requires` mezi ostatními chybí, i kolize id jsou chyba. `cli.mjs`: `--kit` se dá opakovat, bez něj bere `kit_base`, `kit_lab`, `kit_it` z `packs/`. Balík levelů má `requires` všech sad (`levelPackManifest` bere seznam), level má v `source.params.kit` id spojená „+“. `packs/gen_demo` teď vyžaduje všechny tři.
- **Obor místnosti** (`refine` v předvolbě, volá ho `build.js` před jmény buněk; `src/gen/presets/complex_kits.js`): laboratoř dostane obor organická chemie, tkáňové kultury, molekulární biologie, analytika nebo vivárium (vivárium od 16 m²); technická místnost od 18 m² s pravděpodobností 0,45 serverovnu (od 40 m² výpočetní sál), aspoň jedna serverovna na level, když je technická místnost od 16 m²; kancelář od 24 m² open space, od 12 m² s pravděpodobností 0,3 zasedačku; velká laboratoř (od 36 m²) s pravděpodobností 0,3 open space. Buňky mají id podle oboru (`c_chem_01`, `c_server_01`, `c_open_01`…) a české jméno. Bez sad (`catalog.has`) zůstává všechno jako dřív.
- **Vybavení.** Laboratoř má frontu podle oboru (digestoř, stoly s věcmi na desce, bezpečnostní skříně, mrazáky, boxy, inkubátory, sekvenátor, plyny, akvária…), delší než kancelář (obvod / 0,95 m, 4 až 14 kusů), velká laboratoř ostrůvek nebo velký přístroj uprostřed. Na desku stolu jde 1 až 2 přístroje a 3 až 6 drobností oboru (sklo, láhve, stojánky, špičky). Laboratoře míchají i stoly a přístroje z `kit_base`. Serverovna a výpočetní sál: **řady skříní** podél delší osy, dvojice zády k sobě, nad osou kabelový žlab, v úzké místnosti jedna řada; u zdí chlazení, UPS, baterie, hasicí plyn. Open space: řady stolů pro čtyři se židlemi, nebo dvojice stolů s nastavitelnou výškou se sestavami počítačů a židlí; u zdí skříňky, tabule, rostliny, kuchyňka, kopírka. Zasedačka: jednací stůl se šesti židlemi, televize, tabule, projektor. Chodba, hala a sklad dostanou doplňky (rostlina, voda, koše; dusík, Dewarovy nádoby, regály, kanystry, chladicí komora).
- **Rozmisťování** (`furnish.js`): `dressTop` staví věci na desku zleva doprava podle šířek se stejnými mezerami; výška desky z `components.place.top`, pruh desky z **`source.params.deck` = [z od, z do]** (laboratorní stoly −0,065 až 0,37 m před policemi nástavby, ostrůvek 0,19 až 0,74 m, stoly IT −0,38 až 0,38 m; věc stojí zády u začátku pruhu a nesmí přečnívat). `rowsIn` (řady, varianty od největší, platí první, která se vejde), `seatsAround` (židle kolem stolu), `ceilingItems` (kamera, Wi-Fi, projektor), `rowsFirst` (serverovna a open space staví řady před nábytkem u zdí).

| Kontrola (B-T1, sandbox) | Výsledek |
|---|---|
| `complex` se sadami, 200 seedů: validátor, prahy, průchodnost místností skutečným hráčem, strop, chodby | 0 nálezů |
| laboratoří oboru na level (dvě patra) / serveroven / open space a zasedaček | 3 až 15 (medián 8) / 0 až 6 (medián 1, aspoň jedna v 90 % levelů) / 0 až 10 (medián 4) |
| celý level (kvádry + prefaby), dvě patra | 108 308 až 228 516 △, medián 159 064 (mez 300 tisíc) |
| entit na level, dvě patra | 416 až 809, medián 600 (jen `kit_base`: 417 až 709, medián 541) |
| generování | medián 8,1 ms, nejvíc 46,5 ms (mez 1 s) |
| prefabů ze sad `kit_lab` a `kit_it`, které generátor použije | 200 z 366 |
| `complex` jen s `kit_base` (50 seedů): bez oborů, vybavení jako dřív, každý prefab `kit_base` použit kromě okna a mříže (N-003) | ano |
| zkouška A × B (`gen_demo` v enginu A): robot dojde, dveře rukou, volání kreslení na cestě | ano; nejvýš 255 (`complex_7`, dřív 221), mez 400 |

Snímky z enginu A: `test/out/b_mistnosti.png` (12 místností z `complex_7` a `complex_21`, kamera ve dveřích) a detail desek a stolů; pomůcka `test/b_lib/room-shots.cjs`. **Sestavení `dist/xlab_gen.html` má 8,0 MB** (data 3,1 MB): build přibalí všechny prefaby obou sad, i nepoužité. Cena víc entit a materiálů v laboratořích na T460 **není změřená** (F3 nebo `?bench` nad `complex_7`).

**Regrese po kroku 20** (sandbox): `npm test` T0 41, T1 156, T4 46, T2 15, T3 12; `npm run test:b` 9 sad (B-T1 78, B-T2 33, B-T3 12, B-T4 20, B-T5 26, B-T6 9, B-T7 47, B-T8 7, B-T9 14); `npm run test:axb` 31 + 9; 0 selhalo.

### Ondřej 24. 11. 2026, 23:57

Odpovědi: (1 a) hustota laboratoří stačí; (2 b) další krok je zapečené světlo na pevných dílech prefabů (D-041), `kit_home` až po něm; (3 a) velikost hry nevadí, **hra smí mít až 25 MB**; (4 a) `xlab_gen.html?level=complex_7&bench` pustí na T460.

Nové zadání (jeho slovy): „Chci víc prefabů, ve vyšší kvalitě, víc trojúhelníků (například Erlenmeyerova baňka vůbec nevypadá jako Erlenmeyerova baňka – lépe řeš kužely, válce, jehlany, i zaoblení. Se stejným počtem trojúhelníků bych zvládnul téměř hyperrealistický tvar. Ty děláš takové bizarní schodovité tvary. Navíc materiál je sklo, tak ať to tam i vypadá.“ „Pojďme celému inventáři vdechnout více realismu. Počet trojúhelníků teď zvyš o 50 %, ale snaž se odvést 5krát lepší práci než při první iteraci. Kádinka s nálevkou včetně zaobleného dna, to je pár trojúhelníků. Odměrný válec to samé.“

Jak to čtu: realistický inventář je hlavní úkol teď, D-041 hned po něm (před `kit_home`). Mez prefabu 1 000 → 1 500 △.

**Proč byly tvary schodovité:** formát má pro díly jen kvádr a válec se 16 stěnami (64 △); kužel, zaoblení ani tenkou stěnu válec neumí, takže profil baňky jsem skládala ze stohu válců s různým poloměrem. Formát ale má díl `mesh` (soubor .glb, volitelně `#uzel`) a engine A ho kreslí. Dočasné řešení: xForge vyrobí hladké sítě (rotační plochy z profilu, kužely, zaoblené kvádry, trubky) a zapíše je do .glb v balíku sady. Trvalé řešení navrhnu svodné sešně: rotační díl ve formátu (profil + počet stěn), aby ho zapékal xBake (D-041 dnes bere jen kvádry a válce) a balík nenesl megabajty sítí.

## Sešna B03 (24. 11. 2026)

Ondřej v 01:11: zápis do repa a push `sesna-b` povolen; pokračovat zbytkem B2.1, potom xBake podle D-035 a dál podle stavu; do projektu v claude.ai nic nezapisovat. Odpovědi na otevřené otázky: **1 (a)** opotřebený provoz, **2 (a)** z webu jen materiály a textury, tvary vlastní, **3 (a)** herní vzhled nejdřív v galerii sady. K otázce 5 (silnější stroj): „podívej se na alza.cz nebo na jiný web, co je dneska zlatý standard pro hry a udělej to podle takovéhle konfigurace (řekněme celý počítač bez monitoru do 35.000,- s DPH, nebo notebook)“.

| Krok | Stav | Commit |
|---|---|---|
| sloučení `origin/zaklad-2` (`67d2075`: jen průběžná předávka svodné sešny) | hotovo, bez konfliktů; výchozí regrese 242 + 16 sad + 123 + 28 + 9, vše zeleně | `1b896c1` |
| B2.1 zbytek: průchodnost podle skutečného hráče, světlost dveří, návrh N-008 | hotovo | `d2e1481` |
| xBake podle D-035: brány, stínění kolizemi, okraj stínu po podílech, čtení bez Node | hotovo | `3d1aa2a` |
| náhled xBake 0.3, díly z `partMesh` a `partTris` v náhledu, galerii a knihovně prefabů, N-001 znění 2 | hotovo | `7dd9cd2` |
| sloučení `origin/zaklad-2` (`a995347`: mřížka světla znění 2, D-037) a xBake nad `levelLightMeshes` | hotovo, bez konfliktů; svodná sešna to pushla během této sešny | `2cde996`, `9d34aa6` |
| B2.3 xSearcher: nástroj, 10 textur CC0 v příjmu, test bez sítě | hotovo | `5828344`, `24e2358` |
| B2.4 textury: 21 materiálů, galerie se třemi pohledy, návrh N-009 | hotovo | `7204c2d`, `046f9a7`, `951044a`, `70d2473` |
| B2.2, B2.4 bohatší hrubý tvar, B2.5, B2.7 | nezačato | |

**B2.1: průchodnost.** Rozměry postavy má generátor na jednom místě (`src/gen/body.js`: poloměr 35 cm, odstup kontroléru 2 cm, rezerva 3 cm) a předvolby je předávají v `params().body`. Cestu místností hledá s poloměrem 0,40 m (dřív číslo 0,32 m v `passage.js`). Stavba odmítne pokus, kde by otvor nebo otevřené dveře nepustily 0,80 m (`catalog.clearWidth`: světlost z kolizí prefabu s kloubem dveří na dorazu). Nezávislé kontroly (`test/b_lib/level-checks.mjs`) měří skutečným hráčem levelu: poloměr z `src/play/profiles.js` a odstup z `src/phys/phys.js` (jen čtou; 0,35 + 0,02 m, průchod 0,74 m). Nová zkouška `test/b_lib/door-pass.mjs`: největší kruh, který projde otevřenými dveřmi v půdorysu (kolize prefabu a zeď, mřížka 1 cm).

| Co | Hodnota | Kde a jak |
|---|---|---|
| 200 seedů × 2 předvolby + 50 jedno patro + 50 s hádankou | 0 nálezů; cesta široká 0,74 m ověřena v 9 až 31 buňkách na level | `b_t1_xgen` (55 kontrol), sandbox |
| totéž se starým poloměrem 0,32 m | 11 z 200 levelů `complex` a 42 z 200 levelů `catacombs` mělo místnost, kde mezi dvěma otvory nevedla cesta široká 0,74 m | sonda nad týmiž kontrolami; proto test dřív nic nehlásil (měřil 0,6 m) |
| dopad na vybavení | `complex` 87 662 → 87 626 entit na 200 levelů (−0,04 %), `catacombs` 25 526 → 25 439 (−0,3 %); pokusů navíc stejně (0 a 37) | sonda, 200 seedů |
| `packs/gen_demo` | bajtově beze změny (tři ukázkové levely nábytek neztratily) | `cli.mjs demo`, `git status` |
| světlost otevřených dveří pro kapsli | `door_wood_01`, `door_steel_01`, `door_plank_01`, `door_sliding_01` 0,88 m; `gate_iron_01` 0,94 m; dvoukřídlé 1,66 m; hráč potřebuje 0,74 m | `b_t2_kit` (23 kontrol), kruh v půdorysu |

Mez: kontrola průchodnosti je dvourozměrná (mřížka 0,1 m, překážka = obal čehokoli mezi 0,25 a 1,7 m nad podlahou) a buňky s plošinou nebo galerií přeskakuje. Trojrozměrně a kapslí to měří jen robot zkoušky A × B, a ten chodí nejkratší cestou.

**xBake podle D-035.** Pravidlo brány je stejné jako za běhu u sešny A (`occlusion.js`): rozhoduje úsečka z počátku paprsku vzorku ke světlu a obrys portálu z dat. Brána je **seznam** dveří (úsečka může projít dvojími), úroveň úseku je součin jejich otevření. Odraz a přístupnost okolního světla se počítají se zavřenými dveřmi; zdrojem odrazu je jen část vrstev bez brány, takže zavřenými dveřmi neprosvítá ani odraz. Zárubně stíní dál, nestíní jen kolize na pohyblivých uzlech dveří.

Po sloučení mřížky znění 2 (D-037; vzorky z `levelLightMeshes`, bez schovaných ploch):

| Level | Vzorků | Z toho v tělese | Vrstev | Dveří | Úseků (položek) | Zjemněno | Čas | Soubor | gzip |
|---|---|---|---|---|---|---|---|---|---|
| xLab | 20 509 | 490 (2 %) | 16 | 2 | 13 (584) | 1 964 | 1,0 s | 476 kB | 315 kB |
| `catacombs_3` | 33 606 | 7 038 (21 %) | 64 | 6 | 31 (1 393) | 3 613 | 2,6 s | 789 kB | 555 kB |
| `complex_21` | 61 075 | 12 383 (20 %) | 114 | 41 | 307 (11 784) | 8 162 | 6,1 s | 1 671 kB | 1 061 kB |
| `complex_7` | 65 618 | 19 051 (29 %) | 118 | 47 | 320 (13 244) | 10 059 | 7,3 s | 1 779 kB | 1 151 kB |

Sandbox, `node tools/bake/cli.mjs`; časy orientační. Převod na novou mřížku byla výměna jedné funkce: xBake počet, pořadí ani rozteč vzorků nikde nepředpokládá (plocha si nese skutečné souřadnice řad a sloupců) a `b_t6` bere počty ze zapečení v Node. Vzorků ubylo o 1 až 12 %, soubory ale o 3 až 7 % narostly. Domněnka, neměřeno: schované plochy byly v řídkých vrstvách zadarmo (samé nuly), kdežto nové vrcholy na koncích ploch nesou světlo. U generovaných levelů je vzorků v tělese pořád pětina až třetina (plochy schované jen zčásti); doplnění od sousedů je dál potřeba.

Před D-037 (stará mřížka, týž kód): xLab 20 658 vzorků, 13 úseků (565 položek), 464 kB; `catacombs_3` 38 098, 31 (1 215), 757 kB; `complex_21` 64 393, 298 (10 134), 1 559 kB, z toho 1 055 položek přes dvoje dveře; `complex_7` 73 092, 312 (11 481), 1 673 kB, 986 položek přes dvoje dveře, 63 různých bran ze 47 dveří.

Kvádr levelu stíní jen tehdy, když je vidět (`vis` není `false`) a má neprůhledné materiály (`opacity`, N-005): neviditelná kolize stín nevrhá a sklem světlo projde. Otisk `geometry` nese znění mřížky a počty vzorků po kvádrech; soubory zapečené starou mřížkou neplatí.

Co hlídá `b_t5_bake` (26 kontrol) nově: otevřené dveře pustí světlo, které projde otvorem téhož levelu bez dveří (xLab: úseky nesou 99 % toho světla; dveře zlatého vzorku nemají kolizi zárubně), a žádný vzorek ho nemá víc; se zavřenými dveřmi je světla stejně jako dřív, když křídla stínila (součet 62 556 proti 62 557); barvy rostou s otevřením dveří; okraj stínu je proti jemnému výpočtu (12 × 12 paprsků) blíž než jeden paprsek (součet odchylek 47,4 proti 356,6 na 2 033 dvojicích); soubor jde přečíst z `ArrayBuffer`; otisk geometrie se změní s kvádrem i s jeho viditelností.

**Náhled xBake 0.4** (`dist/xbake.html`; 0.3 byl týž náhled nad starou mřížkou): nové přepínače „Dveře otevřené“ (dveře portálů se nakreslí na dorazu a úseky s bránou se rozsvítí) a „Jemný okraj stínu“, nový pohled „Dveře laboratoře“. V montáži `test/out/b_bake_montaz.png` je to vidět: zavřenými posuvnými dveřmi z laboratoře do chodby nic nesvítí, po otevření je na podlaze chodby světlá skvrna; okraj stínu sloupu už nemá zuby po buňkách. Vidět je i to, co zůstalo: stín je po půlmetrové mřížce rozmazaný a na stropě haly je mezi sloupy tmavý pás. Ten pás není vada výpočtu: světla haly `l_hall_1` a `l_hall_3` visí 0,5 m pod stropem a 0,6 m vedle sloupů `b_pillar_050` a `b_pillar_052`, takže sloup zakryje široký výsek stropu (sonda: 190 z 1 592 stropních vzorků haly má méně než polovinu světla; stíní je sloupy ve 118 případech a zdi v 55). Je to vlastnost dat zlatého vzorku a hodí se k N-105 (svítivosti a rozmístění světel xLabu).

**Cílový stroj pro horní stupně (odpověď na otázku 5).** Průzkum trhu 24. 11. 2026 (web, ceny s DPH; ověřovala jsem jen z webu, ne nákupem):

| Co se vejde do 35 000 Kč | Sestava | Cena a zdroj |
|---|---|---|
| stolní PC, hotové | Intel Core Ultra 5 225F, **RTX 5060 Ti 8 GB**, 16 GB DDR5, 1 TB SSD, Windows 11 (LYNX Challenger) | 33 990 Kč, alza.cz |
| stolní PC, hotové | Ryzen 5 5600, **RTX 5060 Ti 16 GB**, 16 GB DDR4, 1 TB SSD, Windows 11 | od 34 400 Kč, bestcomp.cz (stránka starší, cenu jsem neověřila k dnešku) |
| stolní PC těsně nad mezí | Core i5 nebo Core Ultra 5, RTX 5060 Ti 16 GB, 32 GB RAM, 1 až 2 TB SSD (AlzaPC GameBox Prime) | 36 990 až 42 990 Kč podle procesoru a disku, alza.cz |
| notebook | Core i7-13645HX nebo Ryzen 7 250, **RTX 5060 8 GB** (100 až 115 W), 16 GB DDR5, 1 TB SSD, 144 až 165 Hz (Lenovo LOQ 15) | 28 790 až 29 690 Kč, alza.cz (druhý bez systému a adaptéru) |

Souvislosti: paměti a grafiky letos zdražily (kit 32 GB DDR5 stojí 12 až 13 tisíc Kč, RTX 5060 Ti 16 GB kolem 21 tisíc Kč; svetandroida.cz, 16. 11. 2026), proto se do 35 tisíc vejde verze s 16 GB grafické paměti jen se starší platformou. Ve Steam Hardware Survey je od července 2026 nejčastější grafická paměť 16 GB a v září 2026 byla nejčastější kartou RTX 5070 (5,86 %).

**Co z toho beru pro projekt** (rozhodnutí sešny B pro její nástroje a data; čísla stupňů 2 a 3 zůstávají odhad, dokud je nezměří xBench na takovém stroji, D-029):

- Stupeň 2 `mid` = notebook s RTX 5060 8 GB. Stupeň 3 `high` = stolní PC s RTX 5060 Ti. **Závazná mez pro data je 8 GB grafické paměti**; 16 GB je rezerva, na kterou se nespoléhám.
- Hrubý poměr výkonu grafiky proti T460 podle PassMark G3D: HD 520 kolem 865 bodů, RTX 5060 Ti 16 GB 22 635, RTX 5070 28 683, tedy zhruba 26× až 33×. Je to syntetický test, ne měření našeho enginu.
- Textury: originály držet v 2K (sada map ambientCG 2K-JPG má 36 MB; 4K 131 MB je pro 8 GB paměti a obraz 1080p až 1440p zbytečná), odvozovat 512 px pro `low`, 1K pro `mid`, 2K pro `high`. Normálové mapy a mapy drsnosti vyrábět a ukládat od začátku, i když je T460 nepoužije.
- Tvar: nejvyšší úroveň detailu prefabu smí mít řádově 5× až 10× víc trojúhelníků než dnes; T460 dostane dnešní hrubý tvar jako nižší úroveň (až bude pole `lod`, D-030).
- Světlo: na stupních 2 a 3 je místo pro světla po pixelech a stínové mapy; zapečené vrstvy xBake zůstávají základem pro všechny stupně.

**Ondřej ve 02:04** (odpovědi na tři otázky z konce této sešny): mez grafické paměti pro horní stupeň **(a) 8 GB**; co dřív **(a) xSearcher a první textury v galerii**, okna, mříže a zbytek přijatých polí až potom; náhled zapečeného světla pro vygenerované levely **(b) počkat, až soubor načte hra**. K tomu průběžná předávka: `xEngine_sesnaB03_predavka_2026-11-24.md` (poslaná Ondřejovi do chatu, v repu není).

**Ondřej v 15:58** (po přepnutí modelu na Opus 5.5 kvůli limitu): pokračovat v práci a „přesuň paměť z chatu do repa“: `CLAUDE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TODO.md`; „Ztrácíme se občas v tom, co je už hotové a co ne.“ Provedeno (`TODO.md` + úprava `CLAUDE.md`, commit níže):

- **`TODO.md` v kořeni repa je nový:** jedna stránka, co je hotové, co se dělá, co čeká na koho; oddíl pro každou sešnu, každá mění jen svůj. Oddíly svodné sešny a sešny A jsem napsala podle `START_SVOD.md` (`a995347`) a `A_STAV.md` (`db6fad0`); dál je vedou ony.
- **`CLAUDE.md` patří základu; upravila jsem ho na Ondřejovo výslovné slovo:** přidán oddíl „Co to je a jak to spustit“, `TODO.md` v seznamu čtení a v kroku „Konec každého kroku“, řádek o sdílení `TODO.md`. Svodná sešna to při sloučení převezme nebo upraví.
- **`ARCHITECTURE.md` a `DECISIONS.md` jsem nezakládala:** existují jako `docs/01_ARCHITEKTURA.md` a `docs/DECISIONS.md` (D-001 až D-037) a `CLAUDE.md` na ně teď odkazuje hned nahoře. Druhá kopie v kořeni by byla druhá pravda.
- Ostatní sešny uvidí `TODO.md` až po sloučení do základu (push mám jen na `sesna-b`).

**B2.3 xSearcher (24. 11. odpoledne, `5828344`, `24e2358`).** Nástroj `node tools/searcher/find.mjs "<dotaz>"` hledá textury v Poly Haven a ambientCG (český dotaz přeloží malým slovníkem: „beton podlaha“ → concrete floor), u každého výsledku jmenuje zdroj, autora a rozměr předlohy. `--get <zdroj>:<id>` stáhne 2K mapy do `packs/_inbox/<zdroj>/<asset>/` se záznamem `record.json` (licence s doložením a datem přečtení, podmínky rozhraní, autor, adresy, datum, dotaz, rozměr předlohy, u každého souboru velikost, SHA-256, adresa, MD5). Z Poly Haven bere barvu, normálu GL a ARM (okolní stín, drsnost, kovovost v jednom souboru jako glTF), z ambientCG archiv ZIP, ze kterého vybere barvu, normálu GL, drsnost, okolní stín a kovovost nebo průhlednost, jsou-li. Když velikost nebo MD5 souboru nesedí na rozhraní, nezapíše nic. `--inbox` ověří otisky na disku. Brána: jen `CC0-1.0` ze zdroje s doloženou licencí, jen textury; modely nástroj odmítne s odkazem na Ondřejovu volbu 2 a.

Licence ani jedno rozhraní u assetu neuvádí, brána se proto opírá o licenci zdroje, přečtenou 24. 11.: Poly Haven „všechny assety CC0“ (`polyhaven.com/license`), ambientCG „Creative Commons CC0 1.0 Universal“ (`docs.ambientcg.com/license/`). **Podmínky rozhraní Poly Haven** (`ToS.md` v jejich repu na GitHubu) chtějí u každého volání vlastní User-Agent se jménem programu a aby uživatel programu viděl, že obsah je z Poly Haven; nástroj obojí dělá (`xEngine-xSearcher/0.1 (+adresa repa)`, jméno zdroje u výsledků a stažení). Assety samy uvedení autora nevyžadují.

V příjmu je 10 textur pro materiály sady (tabulka v `tools/searcher/ZDROJE.md`): `concrete_floor_worn_001`, `painted_plaster_wall`, `old_linoleum_flooring_01`, `rusty_painted_metal`, `old_planks_02`, `red_brick`, `stone_brick_wall_001` z Poly Haven a `Tiles107`, `DiamondPlate008C`, `Ground110` z ambientCG; 82,5 MB. Do balíků zatím nic nešlo; to je B2.4 (odvozené 512 px a 1K, položky `pack.json.assets` přes `packAsset`).

Test `b_t7_searcher` (47 kontrol) běží bez sítě nad odpověďmi nahranými 24. 11. (`test/b_lib/searcher/`, 160 kB; seznam 871 textur Poly Haven zkrácen na 50 položek skriptem `nahrat.mjs`, který jde pustit znovu). Hlídá hledání a řazení, bránu (CC-BY, neznámá licence, licence mimo slovník, model, id s cestou, zdroj bez doložení), MD5 a velikost, výběr map z archivu, otisky, poškozený soubor v příjmu, User-Agent, validátor balíku s `free: true` (CC0 projde, CC-BY ne) a příkazovou řádku s `--replay`.

**B2.4 textury (24. 11. odpoledne, `7204c2d`, `046f9a7`, `951044a`, `70d2473`).** Z příjmu xSearcheru (19 assetů, 157,1 MB, 2K) vyrábí `tools/forge/textures.mjs` textury sady: barvu a normálovou mapu GL jako WebP 512 px (stupeň `low`) do `packs/kit_base/textures/` a zámek `tools/forge/kit/textures.lock.json` s otisky, původem (zdroj, autor, licence, adresa originálu a jeho otisk) a průměrnou barvou hotového souboru lineárně. Přiřazení je v `tools/forge/kit/textures.mjs`: 21 materiálů z 15 textur (beton, omítka, dlaždice, linoleum, plech, natřená a broušená ocel, tři dřeva, cihla, tři kameny, hlína). `make-kit.mjs` z něj doplní materiálům `albedo`, `normal`, `uvScale` (rozměr předlohy ze záznamu) a do `pack.json` 30 položek `assets`; příjem k tomu nepotřebuje. 30 souborů, 1 287,4 kB (1 318 258 B); dva běhy dají stejné bajty. `sharp` 0.35.5 je nově v `devDependencies` (výjimka pro sešnu B; zámek balíčků necommitován).

Jen 512 px: formát má na mapu jednu cestu a tu čte i T460. Rozlišení 1K a 2K pro stupně 2 a 3 čekají na jména polí z N-006 (D-030); originály 2K leží v příjmu. Normálové mapy jsou v poli `normal` také 512 px; T460 je nepoužije (světlo po vrcholech).

**Rozpor v kontraktu, návrh N-009.** Formát říká, že `color` „násobí texturu“, N-006 a D-029 berou `color` jako vzhled stupně 0 a zálohu. Platí to současně jen pro texturu s průměrem 1. Změřeno: barvy materiálů jsou proti průměru vyfocených textur u 18 z 21 materiálů světlejší, většinou 1,5× až 5,5× (beton 0,50 proti 0,09 lineárně), zesílení vychází 0,53 až 7,18. Doslovné násobení by povrch s texturou ztmavilo až sedmkrát, zapečené zesílení by useklo světlá místa. Návrh N-009 (varianta a): `color` je průměrná barva povrchu a běh kreslí `textura × (color / průměr textury)`, průměr v novém poli `albedoMean`. Data `kit_base` tomu odpovídají už teď (`color` beze změny), průměr je zatím jen v zámku. Kde odstín textury nesedí na barvu materiálu víc než 1,35×, bere sada z textury jen šedou kresbu (5 z 21: linoleum, natřená ocel, tři kameny; dub 1,47× také).

**Galerie 0.2** (`dist/kit.html`, 2 573 327 B, dřív 745 kB): přepínač pohledů **Čistý** (barva), **T460** (textura barvy, Lambert, bez normál) a **Grafická karta** (`MeshStandardMaterial`, normálová mapa, drsnost, kovovost, odrazy okolí z `RoomEnvironment`). Textury bere přímo z balíku přes `import … with { type: 'bytes' }` (esbuild 0.28; `build.mjs` beze změny), tónové mapování AgX ve všech pohledech stejně. Panel prefabu vypisuje u každého materiálu zdroj, autora a licenci textury. Měřeno v sandboxu (`swatchStats`, stěna 2 × 2 m čelně): průměrný jas s texturou je u 21 materiálů do 7,6 % od jasu bez textury (pravidlo N-009 drží); v pohledu Grafická karta je obraz o 15 až 30 bodů z 255 světlejší, protože přibude světlo okolí. Montáže: `test/out/b_kit_pohledy.png` (10 prefabů ve třech pohledech) a `test/out/b_kit_vzornik.png` (21 materiálů).

Co z obrazu vidím (softwarové vykreslení, ne grafická karta): kresba je výrazná u cihly, hlíny, kamenů, natřeného plechu a prken; beton, omítka a dlaždice jsou jemné. Smrk (`kitchen_wood`) má kvůli světlé barvě materiálu a zesílení 4 až 5 bledé pruhy. Světlé kameny vypadají spíš jako mramor. Obojí souvisí s tím, že barvy materiálů jsou světlejší než skutečné povrchy (N-009, vedlejší nález); jestli je ztmavit, je otázka na Ondřeje.

**Ondřej ve 19:55** (odpovědi na tři otázky B2.4): **1 a** barvy materiálů stáhnout k barvám skutečných povrchů a v generovaných levelech přidat expozici; **2 a** směr textur sedí; **3 a** bohatší tvar prefabů. K tomu doslova: „chci více těles, více prefabů, bohatší tvary (zkosení, drobné díly, reliefy, výstupky, mezery, škvíry, římsy, nepravidelnosti, výstupky, zakřivení, prohlubně); chci možnost otevírat i spodní šuplíky nezávisle na prvním, realističtější barvu dřeva, sukovitost, trhliny, letorosty, vnitřní kompartmentizaci“. Otázka zpět (čeká): „vnitřní kompartmentizace“ = (a) přihrádky v šuplících a police ve skříních, nebo (b) kresba dřeva (kompartmentalizace podle Shiga); pracuju s (a).

**Barvy podle skutečných povrchů (1 a, 24. 11. večer).** 21 materiálů (všechny s texturou a `plastic_ivory`) má jas podle referenčního albeda, odstín zůstal: starý beton 0,2 až 0,3, nový 0,4 až 0,55, omítka 0,4 až 0,45, čerstvé dřevo 0,35 až 0,42, staré zvětralé 0,12 až 0,16, bílá akrylová barva 0,8, kovy 0,5 až 0,98 (lineárně; polycount.com, docs.studio-397.com, shinsoj.artstation.com). Například `concrete_raw` 0,50 → 0,25, `wood_pine` 0,60 → 0,38, `plaster_light` 0,79 → 0,55; `metal_floor` 0,34 → 0,45 (kov). Plochou vážený jas povrchů (kvádry i pevné díly prefabů podle `levelSamples`, 30 levelů na předvolbu): `complex` 0,513 → 0,325, `catacombs` 0,307 → 0,209. O ten poměr (1,578 a 1,468) je vyšší expozice předvoleb: `complex` 0,6 → 0,95, `catacombs` 0,7 → 1,03; průměrný jas obrazu tedy zůstává, liší se poměr mezi materiály. `gen_demo` se změnil jen v `env.exposure`. Galerie: expozice AgX 1,15 → 1,7. Zesílení textur (N-009) kleslo, protože barvy jsou blíž fotkám.

**Co mezitím udělala sešna A** (`origin/sesna-a` = `c131ac4`, její `A_STAV.md` z 24. 11.; v této větvi není; od 05:30 je hlava `db6fad0`: zorné pole jako vodorovný úhel při 4 : 3 se stropem 120°, dveře od hráče jako nastavení, Ondřejovy odpovědi z 02:26 „1 b“ a „2 a“):

| Co | Co to znamená pro sešnu B |
|---|---|
| Ondřejova zkouška na T460 (F3, 15 pohledů): stavba vrstev světla při načtení trvá v `complex_7` 24,3 s při mřížce 0,5 m a 44,4 s při 0,25 m (xLab 1,2 a 1,5 s) | levely z generátoru potřebují zapečené světlo; soubor z xBake má smysl, až ho běh načte (čtení je připravené v `tools/bake/read.mjs`, do základu ho přenese svodná sešna) |
| návrh **N-110**, otevřený: Ondřej po zkoušce mřížky 0,25 m řekl „chci ještě míň, chci 0,05 m“; po vrcholech to nejde, navrhuje texturu světla (atlas ploch, bod 5 cm, vrstvy a brány jako dnes) zapékanou v xBake | kdyby byl přijat: xBake a formát N-001 dostanou další druh vrstvy a souřadnice do atlasu ze základu. Do rozhodnutí na tom nepracuju |
| návrh **N-109**, otevřený: otočné dveře se mají otvírat od hráče (Ondřejova volba 4 b u sešny A); chce v datech kloub na obě strany (`min = −max`, `rest = 0`) u dveří bez dorazů | všechny moje otočné dveře dorazy mají (kryjí škvíry, N-007 a D-036) a otvírají se na jednu stranu. Dveře na obě strany by potřebovaly jiné těsnění škvír než doraz. Do rozhodnutí data neměním |
| popis pravidla bran pro základ (dodatek k D-035) | shoda v podstatě: brána je množina dveří a svítí součinem otevření, vzorek smí být ve víc úsecích. **Rozdíly, které musí svodná sešna sjednotit:** její stínítka jsou jen kvádry levelu, moje i kolize prefabů; její paprsek začíná 0,03 m směrem ke světlu a končí 0,02 m před ním a světlo na ploše odsouvá o 0,1 m, můj začíná 2 cm po normále a 1 cm ke středu plochy a posledních 0,3 m před světlem nestíní; její vzorek ve stavbě přebírá bránu od souseda, můj dostává průměr platných sousedů |

**Co se stalo 23. 11. po půlnoci.** Po sloučení se základem 2 selhala zkouška A × B ve dvou kontrolách: místnosti za dvoukřídlými dveřmi byly pro kapsli hráče nedosažitelné (`c_store_08`, `c_lab_05`, `c_store_12` v `complex_7`, `c_store_02` v `complex_21`). **Příčina byla moje:** dočasné řešení k N-007 nezapisovalo dvoukřídlé dveře do `portal.door` a navigace robota (`test/t5_lib/robot.mjs`) hledá dveře jen tam. Oprava (`129318d`): křídla mají `interact.seeThrough: true` (pole přijaté v N-107) a první křídlo je zase v `portal.door`. Pohled portál nezavírá, průchod a zvuk ano. Po opravě: všechny buňky dosažitelné, robot došel do nejvzdálenější buňky ve všech třech levelech (`complex_7` 57,9 m, `complex_21` 42,5 m, `catacombs_3` 26,3 m), dveře otevřel rukou, vynuceně žádné. Je to první zkouška nad dnešními katakombami a dveřmi.

**Ondřej 22. 11. ve 23:33** (po zhlédnutí náhledu xBake na svém stroji): odraz slabší; dál předávka a nová sešna. Provedeno: vrstva `indirect` nese v hlavičce `weight: 0,5` (`cc4f1fc`), data vrstvy jsou dál plná. Z jeho snímků: zapečení xLabu v jeho Chrome trvalo 2,37 s; stíny sloupů v hale jsou na podlaze **hranaté skvrny** (vzorky po 0,5 m, stín má u každého vzorku jen dvě hodnoty); vnější strany zdí byly v přehledu černé (opraveno přisvícením přehledu, náhled 0.2).

**První věc pro xBake příště** (zapsáno 23. 11.): víc stínových paprsků na vzorek. **Hotovo v B03**: okraj stínu po podílech plošky, 4 × 4 paprsky.

**Znění 2 základu 2 (23. 11. 2026, sloučeno `8387674`, bez konfliktů).** Svodná sešna mezitím rozhodla mé dva návrhy a návrh sešny A o mřížce. Co z toho plyne pro tuhle větev:

| Rozhodnutí | Co říká | Co to znamená pro sešnu B | Stav |
|---|---|---|---|
| D-035 (N-001) | soubor `levels/<id>.light.bin` přijat; křídla dveří v portálech při zapékání nestíní, světlo zadržuje brána za běhu (úsek vrstvy s polem `gate`); vrstva `indirect` se bránou neřídí; čtení souboru (`decodeBake`) přejde do základu při příštím sloučení | dveře portálu vyřazeny ze stínících těles, světlo otvorem s dveřmi je v úseku s `gate`; `b_t5_bake` a návrh N-001 doplněny. Pole `baked` do balíků dál nepíšu | **hotovo** (B03, `3d1aa2a`) |
| D-036 (N-007) | zakrytí otvoru se počítá ze všech neprůhledných dílů dveří v klidu (bod 1 přijat); seznam entit u portálu zamítnut; dvoukřídlé dveře budou jeden prefab se svázanými klouby, až základ dodá `follow` (N-002); do té doby `seeThrough` | data už tomu odpovídají (`129318d`). Až bude `follow`: z `door_double_*` udělat jeden prefab a `seeThrough` u něj zrušit | čeká na základ |
| D-037 (N-108) | základ změní mřížku světla: vrcholy na násobcích `LIGHT_CELL` ve světě, bez ploch schovaných v jiném kvádru; počet a pořadí vzorků se změní | základ to provedl (`a995347`); vzorky beru z `levelLightMeshes`, počty a pořadí natvrdo nikde nejsou; otisk `geometry` nese znění mřížky, staré soubory neplatí. Vzorků „v tělese“ ubylo (xLab 1 387 → 490, `complex_7` 32 291 → 19 051), čísla v oddílu „Sešna B03“ | **hotovo** (B03, `9d34aa6`) |
| N-101 proveden | `partMesh`, `partTris`, `partCollider`, `CYL_SEGMENTS` jsou v `src/xspace/geom.js` | vlastní výpočet dílů na čtyřech místech zmizel: `tools/forge/lib.mjs` předává `partTris` ze základu, galerie a náhled xBake kreslí `partMesh`, xBake stíní přes `partCollider`; `packs/kit_base` bajtově beze změny | **hotovo** (B03, `7dd9cd2`) |

Pořadí (podle Ondřejovy volby z 24. 11. ve 02:04): ~~B2.3 xSearcher~~ a ~~B2.4 textury~~ (hotovo 24. 11. odpoledne) → zbytek B2.4 (bohatší hrubý tvar) a B2.5; původně **B2.4 vzhled** (směr „opotřebený provoz“, z webu jen materiály a textury, poprvé v galerii; originály 2K, odvozeně 1K a 512 px; z B2.2 jen to, co vzhled potřebuje) → B2.5 zkouška povrchu na jednom kusu → zbytek B2.2 (okna, mříže, `components.place`, `speed`).


## Hotovo × neuděláno

| Úkol | Stav | Test | Poznámka |
|---|---|---|---|
| B1.1 xGen: stavebnice a rozvržení | hotovo | `b_t1_xgen` 55 (Node) | předvolby `complex` (dvě patra s galerií, nebo jedno patro s plošinou a rampou) a `catacombs`; 500 levelů bez nálezu validátoru; katakomby po Ondřejově volbě 2 (b) |
| B1.2 xForge: sada prefabů | hotovo, vzhled nevyhovuje | `b_t2_kit` 32 (Node), `b_t3_galerie` 12, `b_t4_levely` 20 (prohlížeč) | `kit_base`: 49 prefabů, 27 s kloubem (33 kloubů), 41 materiálů; galerie `dist/kit.html`; generátor rozmisťuje 47 ze 49. Ondřej 22. 11.: tvary dobré, ale „příliš sterilní“ (viz Rozhodnutí a N-006). Zavřené dveře jsou od B02 bez škvír (N-007) |
| B1.3 xBake: zapečené světlo | hotovo podle zadání vlny 2 a D-035; běh soubor zatím nečte (čtení přejde do základu) | `b_t5_bake` 26 (Node), `b_t6_bake_nahled` 9 (prohlížeč) | světlo po vrcholech `brushLightMesh`, jedna vrstva na světlo se zastíněním a s úseky za dveřmi (brány), okraj stínu po podílech, k tomu vrstva odrazu (RGB) a přístupnosti okolního světla; xLab 20 509 vzorků za 1,0 s, soubor 476 kB; nástroj `node tools/bake/cli.mjs packs/<balík>`, náhled `dist/xbake.html`, montáž `test/out/b_bake_montaz.png` |
| B1.4 xSearcher: příjem assetů | hotovo jako B2.3 (24. 11. 2026) | `b_t7_searcher` 47 (Node, bez sítě) | jen textury; modely nestahuje (Ondřejova volba 2 a), zvuky nemají zdroj; tabulka zdrojů a příjmu v `tools/searcher/ZDROJE.md` |

Po B2.4 (24. 11. 2026, `951044a`, sandbox): `npm test` 254 kontrol, `npm run test:b` 7 sad ze 7, 201 kontrol (`b_t2_kit` 32, `b_t3_galerie` 12), `npm run test:axb` 28 + 9: engine sešny A balík s texturami načte a robot projde. Skupinu A jsem nepouštěla (její testy berou zlatý vzorek).

Po B2.3 (24. 11. 2026, `24e2358`, sandbox): `npm test` 254 kontrol, `npm run test:b` 7 sad ze 7, 188 kontrol (`b_t7_searcher` 47 nových), vše zeleně. Skupinu A a zkoušku A × B jsem nepouštěla: změna je jen v `tools/searcher`, `packs/_inbox/.gitignore` a testech B.

Poslední celý běh (24. 11. 2026, `9d34aa6`, po sloučení znění 3 základu 2, `npm run test:all`, sandbox): základ `npm test` 254 kontrol (T0 41, T1 140, T4 46, T2 15, T3 12), skupina A 16 sad z 16 (267 kontrol), skupina B 141 kontrol v 6 sadách (`b_t1_xgen` 55, `b_t2_kit` 23, `b_t3_galerie` 8, `b_t4_levely` 20, `b_t5_bake` 26, `b_t6_bake_nahled` 9), zkouška A × B 28 + 9. Celkem 699 kontrol, 0 selhalo. Před sloučením (`7dd9cd2`, základ `67d2075`): 687 kontrol, 0 selhalo.

## Sešna B02 (22. 11. 2026 večer)

Ondřej ve 22:24: zápis do repa a push `sesna-b` ano; znění 2 sloučit hned; pořadí práce katakomby → škvíry u dveří → xBake → xSearcher a textury.

| Krok | Stav | Commit |
|---|---|---|
| sloučení znění 2 základu (`origin/zaklad-1`, `16548b4`) | hotovo, bez konfliktů | `ff4af58` |
| katakomby podle volby 2 (b) | hotovo | `b2f5ef0` |
| škvíry u dveří, dveře portálu, prkenné dveře, návrh N-007 | hotovo | `6d5f90f` |
| B1.3 xBake a N-001: výpočet, formát, test | hotovo | commit „xBake: zapečené světlo po vrstvách“ |
| B1.3 xBake: náhled v prohlížeči, snímek vedle xView, potlačení zrnění odrazu | hotovo | commit „xBake: náhled“ |
| slabší odraz (váha 0,5), přisvícený přehled v náhledu | hotovo | `cc4f1fc` |
| sloučení základu 2 (`origin/zaklad-2`, `b12f8ed`) | hotovo, bez konfliktů | `588ff12` |
| oprava zkoušky A × B (křídla dvoukřídlých dveří se `seeThrough`) | hotovo | `129318d` |
| sloučení znění 2 základu 2 (`origin/zaklad-2`, `d2fb217`) | hotovo, bez konfliktů | `8387674` |
| xSearcher a textury (B2.3, B2.4) | nezačato; nová sešna (neplatí: B2.3 hotovo 24. 11. 2026, viz Sešna B03) | |

**Dveře.** Engine sešny A bere zavřené dveře portálu jako neprůhledné a místnost za nimi nekreslí (její N-107). Sada měla kolem křídla skutečné škvíry: 1 cm pod křídlem a pod překladem, 0,5 cm po stranách, 4 mm mezi prkny prkenných dveří, 8 mm mezi křídly dvoukřídlých dveří. Zkouška paprsky (`test/b_lib/door-cover.mjs`) jimi před opravou prostrčila 1 374 až 8 352 paprsků na jedny dveře, po opravě žádný. Oprava: dorazy zárubně za křídlem (přesah 15 mm), prahová lišta 12 mm bez kolize, jádro prkenných dveří, krycí lišta na pravém křídle dvoukřídlých dveří, u posuvných dveří uzavřená štěrbina stojky nad křídlem. Generátor zapisuje do `portal.door` každé dveře, které v otvoru stojí; u dvoukřídlých první křídlo a obě křídla mají `seeThrough` (od `129318d`, shodně s D-036). Prkenné dveře mají otvor 1,0 × 2,0 m místo 0,9 × 2,0 m (světlost 0,90 m): svodná sešna v T5 zjistila, že 0,80 m projde postava široká 0,74 m jen středem.

**xBench 0.2 na T460** (tři běhy 22. 11. 2026 ve 20:57, 21:32 a 21:35; surová data svodná sešna uložila do `docs/mereni/` ve větvi `integrace-1`). Interiér přes celý obraz, 1366 × 768, medián v ms:

| Případ | běh 1 | běh 2 | běh 3 |
|---|---|---|---|
| světlo po vrcholech | 2,41 | 2,41 | 2,44 |
| totéž s texturou (jedna, 256 px, s mipmapami) | 2,98 | 3,48 | 3,23 |
| totéž s vyhlazováním hran | 6,80 | 6,85 | 8,60 |
| totéž s 1 světlem po pixelech | 4,65 | 4,65 | 6,30 |
| 4 světla po pixelech | 9,85 | 10,45 | 10,70 |
| 300 tis. △ (bez interiéru) | 3,83 | 3,63 | 3,78 |
| 600 tis. △ (bez interiéru) | 6,13 | 6,50 | 7,15 |

Co z toho čtu pro obsah (výklad, ne měření): (1) textura barvy je na T460 levná, +0,6 až +1,1 ms; víc velkých textur naráz změřeno není. (2) Světlo po pixelech zůstává drahé, takže normálové mapy a odlesky nemají na T460 čím svítit: „život“ tam musí nést textura barvy a zapečené světlo se stíny; normálové mapy patří do dat pro stroj s grafickou kartou. (3) Vyhlazování hran stojí +4,4 až +6,2 ms a na T460 bude spíš vypnuté; drobný detail proto patří do textury, ne do tenké geometrie. (4) Trojúhelníků je rezerva: 300 tisíc pod 4 ms, moje levely mají celé nejvýš asi 88 tisíc. Rozptyl mezi běhy je velký (4 bodová světla 6,8 / 7,7 / 10,4 ms); rozdílům pod 2 ms nevěřím na desetiny.

**Zadání znění 2** (`docs/00_ZADANI.md`) pro sešnu B: xForge má být nástroj typu Blender, nebo takový, který Blender využívá a učí se (bod B/; D-011 už neříká „jen knihovna generátorů“). „Sám se učí“ umím splnit jako knihovnu receptů a pastí, která roste s každým assetem; nástroj, který se zlepšuje bez sešny, neslibuju (řekla jsem to Ondřejovi 22. 11.). Do mezí 50 a 100 MB se grafika a zvuky nepočítají (bod 5/). Body 6/ až 8/ jsou Ondřejova slova z 13:51, na která odpovídá N-006. Podle oddílu C chybí v sadě stromy, tvorové a jejich pohyby, zbraně, zdi s prasklinami a obrazy.

## Rozhodnutí Ondřeje (22. 11. 2026, 13:51)

| Otázka | Volba | Stav v kódu |
|---|---|---|
| 1. hustota vybavení v komplexu | (a) nechat | platí, nic se nemění |
| 2. katakomby | (b) stropy zvednout na 2,6 m, chodby rozšířit na 1,6 m | **hotovo** (B02): stropy 2,6 až 3,2 m, chodby 1,6 až 1,9 m; hlídá `b_t1_xgen` (nejnižší strop 2,60 m, nejužší chodba 1,60 m přes 200 seedů) |
| 3. výchozí komplex | (a) dvě patra s galerií | platí, je to výchozí |
| 4. zamčená místnost s pákou | (a) jen na přání (`--puzzle`) | platí |
| 5. co dál | (c) víc detailu u prefabů + (a) B1.4 xSearcher | viz Plán |

Dva nové požadavky ze stejné zprávy, oba přesahují sešnu B:

1. **Ve hře to má vypadat skutečně.** „Tělesa a objekty jsou příliš sterilní. Základní tvary jsou dobré, ale já potřebuju, aby vypadaly hyperrealisticky. Takto mohou vypadat jako náhledy v xForge, kde budeme potřebovat určitou čistotu pro práci, ale ve hře to musí vypadat skutečně.“ K tomu: xSearcher má hledat volné assety k importu, úpravě, převzetí nebo inspiraci.
2. **Rezerva pro silnější stroj.** „Chci být připravený i na přechod na rychlejší počítače s grafickou kartou. Na Lenovu T460 nezůstanu napořád. […] Už teď s tím počítej při stavbě celého projektu, xEnginu i jeho souvisejících toolů.“

Obojí je rozpracované jako návrh **N-006** (stupně kvality a vrstvy vzhledu), protože se týká i základu a sešny A.

## Vzhled: co chybí a co s tím

Proč jsou prefaby sterilní (pořadí je můj úsudek, ne měření): (1) světlo a stín: nic nevrhá stín a nemá ztmavené kouty; (2) povrch: jedna barva na materiál, žádná textura; (3) tvar: ostré hrany, hranaté válce, chybí drobné díly (průměr 169 △ na prefab); (4) opotřebení a nepořádek; (5) odezva materiálu (odlesky, průhledné sklo); (6) obraz (mlha, záře, vyhlazení). Počet trojúhelníků je jen část bodu 3.

Co je ověřené v kódu a v datech:

- Formát xSpace 1 **už má** u materiálu `albedo`, `normal` a `uvScale`, u dílu `shape: "mesh"` s cestou k `.glb` a v manifestu `assets` s otiskem a licencí. Moje sada z toho nepoužívá nic.
- xView kreslí jen `box` a `cyl` jednou barvou. Engine sešny A (`c8444bf`) bere z materiálu jen barvu (`MeshLambertMaterial`). Textura ani síť by dnes nebyla vidět nikde kromě mé galerie.
- T460 podle xBench 0.1: úzké hrdlo je výpočet na pixel (4 světla 14,0 ms, fyzikální materiál s 8 světly 22,8 ms, stín 25,2 ms), ne geometrie (1,2 mil. trojúhelníků 16,0 ms). Víc trojúhelníků si dovolit můžeme; fyzikální materiály se stíny za běhu na T460 ne. Cena textury na T460 změřená není (xBench 0.2 tam neběžel).

Závěr: „hyperrealisticky“ ve smyslu dnešních her je stupeň pro grafickou kartu. Na T460 je dosažitelné „věrohodně jako dobrá hra z let 1998 až 2004“: textury a zapečené světlo se stíny. Aby se práce nedělala dvakrát, data mají nést nejvyšší kvalitu a běh si má vybrat stupeň. Podrobně N-006.

## Plán další sešny B

Pořadí je závazné jen do bodu 2; dál rozhodne, co mezitím udělá svodná sešna a Ondřej.

| # | Krok | Hotovo, když | Poznámka |
|---|---|---|---|
| 0 | navázání a sloučení znění 2 | **hotovo** (`ff4af58`) | základ 232 kontrol |
| 1 | katakomby podle volby 2 (b): stropy aspoň 2,6 m, chodby aspoň 1,6 m | **hotovo** | 200 seedů bez nálezu, `gen_demo` přegenerovaný (`catacombs_3`: 30 buněk místo 33); průchody mezi chodbami zůstávají oblouky široké 1,3 až 1,8 m |
| 2 | škvíry u dveří, dveře portálu, návrh N-007 | **hotovo** | zkouška paprsky v `b_t2_kit` a `b_t1_xgen` |
| 3 | B1.3 xBake + N-001 (Ondřej 22. 11. večer: xBake před xSearcherem) | **hotovo**: zapečení xLabu 1,1 s (mez 60 s), stín sloupu měřitelný v číslech i v obraze, součet vrstev bez zastínění = `lightIrradiance` (odchylka 5,9e-8), návrh N-001, náhled `dist/xbake.html`, montáž vedle xView | na T460 jediná cesta ke stínům (D-022). Stíny jsou po půlmetrové mřížce rozmazané; povrchy jsou dál jednobarevné, takže sterilní vzhled tím sám nezmizel |
| 4 | B1.4 xSearcher: `tools/searcher/find.mjs "<dotaz>" --type model\|texture\|sound`, příjem do `packs/_inbox/<zdroj>/<asset>/` se záznamem | 10 stažených assetů se záznamem, test na uložených odpovědích bez sítě, balík `free: true` odmítne jinou licenci než CC0 a vlastní | začít Poly Haven a ambientCG (mají rozhraní a soubory jdou stáhnout); `packs/_inbox` nepatří do gitu |
| 5 | život beze změny formátu: válce s víc stěnami, náhrada zkosení a drobné díly u nejviditelnějších prefabů (dveře, stoly, skříně, bedny, sudy, svítidla), drobnosti na stoly a na zem, malé náhodné pootočení a posun nábytku v xGen | montáž „před a po“ stejných prefabů; `tris` v mezích pravidel obsahu (500 běžný, 2 000 složitý) | vidět ve všech dnešních prohlížečích i v enginu sešny A |
| 6 | herní pohled v galerii: textury barvy z CC0 zdrojů do `kit_base` přes `albedo`; tři pohledy „čistý / T460 / grafická karta“ v `dist/kit.html` | montáž aspoň 8 prefabů ve třech pohledech; součet velikosti textur zapsaný | podle xBench 0.2 (viz Sešna B02): textura barvy je na T460 levná, světlo po pixelech ne. Pohled T460 = textura × světlo po vrcholech; normálové mapy a odlesky jen v pohledu pro grafickou kartu. Původní znění tohoto kroku počítalo s normálovými mapami i pro T460; to neplatí |
| 7 | zkouška povrchu: jeden prefab (dveře) se sítí `.glb` na stejné kostře, jednou vyrobenou kódem, jednou přes `bpy` | oba kusy v galerii vedle hrubého tvaru; porovnání pracnosti a velikosti | podklad pro rozhodnutí N-006; `bpy` v sandboxu není nainstalovaný | Podle zadání B/ a D-011 je cesta přes Blender součást xForge, ne jen zkouška. |

## Co je kde

| Co | Kde |
|---|---|
| stavebnice (podlaha, strop, zeď s otvory a prahem, schody, rampa, plošina, sloup, místnost) | `src/gen/kit.js` |
| rozvržení: dělení plochy, úseky zdí s jedním vlastníkem, kostra grafu a smyčky | `src/gen/layout.js` |
| z plánu kvádry, portály, dveře, galerie, plošina, schody do zapuštěných místností | `src/gen/build.js` |
| vybavení a zapojení (vypínač → svítidla, tlačítko → posuvné dveře, páka → zamčené dveře) | `src/gen/furnish.js`, `passage.js` |
| předvolby (rozměry, účely místností, pravidla vybavení) | `src/gen/presets/*.js` |
| nástroj: `node src/gen/cli.mjs <předvolba> --seed N --out packs/<balík>` (`demo`, `list`, `--floors`, `--puzzle`) | `src/gen/cli.mjs` |
| půdorys levelu jako SVG po patrech | `src/gen/plan-svg.js` |
| knihovna prefabů: kostra → klouby se zdůvodněním → díly → součásti; obal a `tris` se počítají | `tools/forge/lib.mjs` |
| prefaby sady | `tools/forge/kit/*.mjs`, přehled a zdůvodnění mezí `tools/forge/KIT.md` (generovaný) |
| zápis sady: `node tools/forge/make-kit.mjs` | `packs/kit_base` |
| galerie (cíl `kit`) | `tools/forge/gallery`, `dist/kit.html` |
| prohlížeč vygenerovaných levelů (cíl `xgen`: xView beze změny + přepínač levelů) | `tools/designer`, `dist/xgen.html` |
| ukázkový balík: `complex_7` (dvě patra, hádanka), `complex_21` (jedno patro), `catacombs_3` | `packs/gen_demo` (vyžaduje `kit_base`, `kit_lab`, `kit_it`) |
| tematické sady: stavba (`theme.mjs`), seznam (`themes.mjs`), zápis `node tools/forge/make-pack.mjs [id|all]`; zdroje `tools/forge/lab/*.mjs` (rozměry `ROZMERY.md`), `tools/forge/it/*.mjs`; přehledy `SADA.md` | `packs/kit_lab`, `packs/kit_it`, meta balík `packs/kit_all` |
| vybavení ze sad v předvolbě `complex` (obory, serverovna, open space, zasedačka) | `src/gen/presets/complex_kits.js` |
| snímky místností z enginu A do montáže | `test/b_lib/room-shots.cjs` |
| vývojové pomůcky: rozložení přes seedy, půdorysy do PNG, snímky levelů, montáž galerie | `tools/designer/dev/stats.mjs`, `plans.cjs`, `shots.cjs`; `tools/forge/dev/kitshot.cjs` |
| xSearcher: hledání a příjem textur CC0 (`find.mjs`), síť a záznam odpovědí (`http.mjs`), čtení ZIP (`zip.mjs`), slovník a řazení (`match.mjs`), zdroje (`sources/`), brána licencí a příjem (`inbox.mjs`); zdroje, licence a obsah příjmu `ZDROJE.md` | `tools/searcher` |
| příjem stažených originálů (mimo git, zůstává jen `.gitignore`) | `packs/_inbox/<zdroj>/<asset>/` s `record.json` |
| uložené odpovědi rozhraní pro test bez sítě a skript, který je nahraje | `test/b_lib/searcher/` |
| xBake: vzorky a jejich plochy (`scene.mjs`), stínítka z kolizí a paprsky (`rays.mjs`), brány dveří (`gates.mjs`), vrstvy a okraj stínu (`bake.mjs`), čtení souboru a složení barev bez Node (`read.mjs`), zápis a otisky (`format.mjs`), nástroj `node tools/bake/cli.mjs packs/<balík> [--level id] [--out složka] [--rays 64] [--soft 4] [--no-indirect] [--no-gates]` → `dist/bake/<balík>/<level>.light.bin` | `tools/bake` |
| náhled zapečeného světla (cíl `xbake`: zapeče v prohlížeči, přepínače Stíny, Jemný okraj stínu, Odraz, Kouty, Lampy, Dveře otevřené; pohledy jako xView, „Stín sloupu“ a „Dveře laboratoře“) | `tools/bake/view.js`, `view.html`, `target.json` → `dist/xbake.html` |
| rozměry postavy, pro kterou generátor staví (poloměr, odstup kontroléru, rezerva) | `src/gen/body.js` |
| textury sady: který materiál bere kterou texturu z příjmu (`kit/textures.mjs`), odvození WebP 512 px a zámek s otisky a průměry (`textures.mjs`, `kit/textures.lock.json`; potřebuje příjem a `sharp`), modul textur galerie (`gallery/textures.js`, píše `make-kit.mjs`), montáž pohledů (`dev/kitlooks.cjs`) | `tools/forge` |
| odvozené textury v balíku | `packs/kit_base/textures/*.512.webp` |
| skutečný hráč pro kontroly dat (čte profil enginu) a průchod otevřenými dveřmi kruhem v půdorysu | `test/b_lib/player.mjs`, `test/b_lib/door-pass.mjs` |
| zkouška zakrytí otvoru dveřmi paprsky | `test/b_lib/door-cover.mjs` |

## Změřená čísla

Všechno změřeno v sandboxu (Node 22, 2 jádra; prohlížeč Chromium se softwarovým vykreslováním). Časy jsou orientační, o T460 neříkají nic.

| Co | Hodnota | Kde a jak |
|---|---|---|
| seedy bez nálezu validátoru | 200 `complex` (dvě patra) + 200 `catacombs` + 50 `complex` jedno patro + 50 `complex` s hádankou = 500 levelů, 0 chyb, 0 varování | `b_t1_xgen`, validátor nad levelem spojeným se sadou |
| pokusů na level | `complex` vždy 1, `catacombs` 1 až 3 (medián 1) | tamtéž (pokus = jeden proud náhody; nevyhovující se zahodí) |
| buněk na level | `complex` 31 až 59 (medián 45), `catacombs` 25 až 47 (35), jedno patro 34 až 57 (45) | tamtéž |
| dveří v portálech | `complex` 29 až 60 (43), `catacombs` 3 až 17 (9) | tamtéž |
| čas generování | `complex` 3,4 až 52,8 ms (medián 6,5), `catacombs` 1,1 až 10,0 ms (2,3) | tamtéž, `performance.now` kolem `generateLevel`, první volání nese zahřátí |
| kvádrů a entit na level | `complex` 354 až 629 kvádrů, 320 až 584 entit; `catacombs` 274 až 510 kvádrů, 83 až 171 entit | tamtéž |
| nejvíc v jedné buňce | 48 entit, 94 kvádrů (meze validátoru 150 a 400) | sonda přes 300 levelů |
| trojúhelníků v celém levelu | průměr 54 537, nejvíc 87 964 (kvádry + součet `tris` prefabů) | sonda přes 300 levelů před poslední úpravou pravidel; řádově platí |
| průchodnost místností | v 9 až 31 buňkách na level (`catacombs` 9 až 28) mezi všemi otvory cesta široká 0,74 m (hráč z profilu enginu); generátor ji hledá s 0,80 m | `b_t1_xgen`, mřížka 0,1 m, nezávislá na generátoru; od B03 |
| opakovatelnost | stejný seed dvakrát = stejné bajty (`complex` 205 318, `catacombs` 100 693 znaků); `packs/gen_demo` a `packs/kit_base` bajtově shodné s výstupem nástrojů | `b_t1_xgen`, `b_t2_kit` |
| sada | 49 prefabů, 8 564 △ celkem (průměr 175 △), nejtěžší `microscope_01` 456 △; dveře 156 až 332 △ | `b_t2_kit` |
| galerie | 49 z 49 prefabů se vykreslí, u 27 z 27 kloubových je krajní poloha v obraze vidět | `b_t3_galerie`, dlaždice 160 px, softwarové vykreslení |
| levely v xView | `complex_7` přehled 235 volání a 71 988 △; ze startu 44 volání | `b_t4_levely`; xView neslučuje po buňkách ani neořezává, čísla nejsou rozpočet enginu |
| velikost | `dist/kit.html` 745 kB, `dist/xgen.html` 1 029 kB (z toho data 429 kB); `packs/kit_base` 224 kB, `packs/gen_demo` 468 kB na disku | výpis sestavení, `du` |
| zapečení světla (xBake), stav B03, mřížka znění 2 | xLab: 20 509 vzorků, 16 vrstev, 13 úseků s bránou, 1,0 s, 476 kB (gzip 315 kB); `catacombs_3`: 33 606 vzorků, 64 vrstev, 31 úseků, 2,6 s, 789 kB; `complex_21`: 61 075, 114, 307, 6,1 s, 1 671 kB; `complex_7`: 65 618, 118, 320, 7,3 s, 1 779 kB | `tools/bake/cli.mjs`; 64 paprsků polokoulí na vzorek, okraj stínu 4 × 4; časy ze sandboxu, orientační. Stav B02 (stará mřížka, dveře stínily, stínily díly, jeden paprsek): 1,1 s a 452 kB; 2,8 s a 731 kB; 5,7 s a 1 420 kB; 8,7 s a 1 535 kB |
| vzorky schované v tělese | xLab 490 z 20 509 (2 %), `complex_7` 19 051 z 65 618 (29 %); před D-037 1 387 z 20 658 a 32 291 z 73 092 | tamtéž; počátek paprsku leží uvnitř kvádru nebo kolize prefabu |
| stín sloupu v hale xLabu | 464 dvojic vzorek podlahy × světlo za sloupem, 415 úplně bez přímého světla, průměrně ubylo 97 % světla; přímé osvětlení těch míst 2,43 proti 4,34 bez zastínění; s odrazem 3,46 | `b_t5_bake` |
| okraj stínu po podílech | xLab: 1 964 zjemněných dvojic vzorek × světlo, stínových paprsků 134 283 místo 56 559; součet odchylek proti výpočtu 12 × 12 paprsků 47,4 místo 356,6 | `b_t5_bake` |
| brány světla | xLab: 2 dveře v portálech, 13 úseků v 10 vrstvách, 584 položek; otevřené dveře pustí 99 % světla, které projde týmž otvorem bez dveří; součet světla se zavřenými dveřmi 62 556 proti 62 557 při stínících křídlech | `b_t5_bake` |
| náhled xBake 0.4 | `dist/xbake.html` 618 kB; zapečení xLabu v prohlížeči 0,8 s (stránka peče třikrát: se stíny, bez zastínění a s jedním paprskem pro srovnání). Pohled „Stín sloupu“, jen přímé světlo: průměrný jas 147,0 proti 168,2 z 255 bez zastínění. Pohled „Dveře laboratoře“, jen přímé světlo: 152,2 s otevřenými dveřmi proti 140,7 se zavřenými | `b_t6_bake_nahled` (softwarové vykreslení), výpis sestavení |
| dosažitelnost zdrojů assetů | Poly Haven a ambientCG: rozhraní i soubory ano; OpenGameArt a Quaternius: stránky ano, stažení souboru neměřeno; Kenney: 403 | `curl` 22. 11. kolem 14:00, tabulka v `tools/searcher/ZDROJE.md`; 24. 11. z Node znovu ano (Poly Haven `/types` 293 ms, seznam 871 textur 857 289 B) |
| příjem xSearcheru | 10 assetů (7 × Poly Haven, 3 × ambientCG), 2K, 82,5 MB map; archivy ambientCG 66,2 MB se neukládají; stažení ve dvou dávkách 3,1 s a 6,3 s | `find.mjs --get`, `--inbox`, sandbox 24. 11. |
| textury sady (B2.4) | 21 materiálů, 30 souborů WebP 512 px, 1 287,4 kB; příjem 19 assetů, 157,1 MB; `dist/kit.html` 2 573 327 B (dřív 745 kB) | `tools/forge/textures.mjs`, `make-kit.mjs`, výpis sestavení |
| jas stěny s texturou proti barvě (galerie, pohled T460 proti čistému) | do 7,6 % u 21 materiálů; zesílení color / průměr textury 0,53 až 7,18 | `b_t3_galerie`, `swatchStats`, softwarové vykreslení |
| velikost jedné sady map | ambientCG `Concrete049`: 1K-JPG 10 406 004 B, 2K-JPG 36 432 631 B, 4K-JPG 131 410 218 B | odpověď rozhraní ambientCG |

## Neověřeno

- **Prošel to jen robot bez obrazu.** Zkouška A × B (`npm run test:axb`, test základu) pouští všechny tři levely `gen_demo` v enginu sešny A beze změny kódu; nad dnešním stavem (nové katakomby a dveře) je zelená od `129318d`. Robot běží v Node bez vykreslení, chodí nejkratší cestou a většinu místností míjí. Engine v této větvi je stav sešny A z vlny 1 (`230b3ee`); s její novější větví (`a1d3081`, světlo po vrcholech) a s mou opravou ji nanečisto sloučila a pustila svodná sešna: 722 kontrol, 0 selhalo (`docs/STATE.md`, 23. 11.); sama jsem to nepouštěla. S hlavou sešny A z 24. 11. (`c131ac4`) a s touhle větví po B03 to nepouštěl nikdo; sešna A měla při svém posledním běhu (727 kontrol na `25e17a4`) ve větvi starší stav sešny B. Vlastní průchodnost hlídám od B03 poloměrem skutečného hráče (0,37 m), ale dál dvourozměrnou mřížkou; hala s galerií a plošinou se v ní přeskakuje.
- **Schody.** Geometrie je v mezích zadání (výška stupně 0,17 až 0,20 m, hloubka 0,28 m), ale kontrolér postavy je nezkoušel. Zlatý vzorek má stupně 0,25 m, takže by měly být snazší; je to úvaha. Sešna A změřila, že kontrolér vyjde schod jen při vodorovném posunu aspoň asi 7 mm na krok; s mými schody to nikdo nezkoušel.
- **Vzhled.** Všechny snímky jsou ze softwarového vykreslování, v galerii s vlastním nasvícením, v xView s osvětlením po vrcholech celých stěn (na hranicích úseků zdí dělá viditelné svislé předěly; je to vlastnost prohlížeče, ne dat). Barvy materiálů neviděl nikdo na skutečné grafické kartě. Ondřej viděl montáže a soubory z 22. 11. a vzhled označil za sterilní.
- **Meze kloubů.** Žádná nebyla změřena na skutečném předmětu; u každé je v `KIT.md` úvaha a u většiny poznámka „neměřeno“.
- **Svítivosti.** Pevná světla jsem volila podle zlatého vzorku (místnost 9 až 22 cd, hala 140 cd, pochodeň 8 až 12 cd). Jak je to jasné ve hře, nevím; katakomby jsou schválně tmavé a výklenky bez světla. Sešna A v N-105 píše, že zlatý vzorek je přesvícený; moje hodnoty z něj vycházejí, takže se jich to může týkat také.
- **Posuvné dveře** zajíždějí do zdi (křídlo se v otevřené poloze překrývá s kvádrem zdi). Jak se k tomu postaví Rapier a kreslení, nevím.
- **Dvoukřídlé dveře** jsou dvě entity se stejným počátkem (N-002, `follow` dluží základ). První křídlo je v `portal.door`, obě mají `seeThrough`: engine za nimi kreslí místnost i při zavřených křídlech. Když hráč otevře jako první levé křídlo, projde na okamžik krycí lištou pravého (8 mm, bez kolize); okem neposuzováno.
- **Zakrytí otvoru dveřmi** hlídá vzorkovaná zkouška paprsky (`test/b_lib/door-cover.mjs`: kolmé paprsky na síti z hran dílů a šikmé vějíře do 50° vodorovně a 30° svisle), ne důkaz. V enginu sešny A to se zavřenými dveřmi nikdo neviděl.
- **Zapečené světlo je vidět jen v mém náhledu a jen ze softwarového vykreslování.** Vrstvy bez zastínění dávají v náhledu stejný obraz jako xView se světly po pixelech (montáž, prostřední sloupec). Se stíny: stín sloupu má od B03 plynulý okraj místo zubů, ale po půlmetrové mřížce je dál rozmazaný; na stropě haly je tmavý pás od sloupů, vedle kterých visí světla (správný stín, viz „Sešna B03“). S odrazem je bílá laboratoř vybledlá (xLab je podle N-105 přesvícený a expozice je laděná bez odrazu). Odraz je omezený a vyhlazený (N-001, oddíl 7) a o kolik tím ubylo energie, jsem neměřila. Prefaby v náhledu osvětluju po stěnách dílů ze středu stěny a díly téže entity si nestíní; to je vlastnost náhledu, ne formátu.
- **Brány světla nečetl žádný běh.** Úseky s bránou četl jen můj náhled a test. Že moje pravidlo průchodu otvorem dává stejné brány jako `occlusion.js` sešny A, jsem neporovnávala na datech (její kód v téhle větvi není), jen čtením. Otevření dveří 0 až 1 bere náhled jen jako zavřeno nebo otevřeno.
- **Stín otevřeného křídla neexistuje.** Křídlo dveří v portálu přímé světlo nestíní zavřené ani otevřené. Odraz se po otevření dveří nemění.
- **Stíní kolize, ne díly.** Co nemá kolizi (svítidla, lišty, drobné díly), stín nevrhá. Kolik to v obraze dělá proti stavu B02 (stínily díly), jsem neporovnávala.
- **Průzkum cílového stroje** je z webu k 24. 11. 2026: ceny jsem neověřovala nákupem, u bestcomp.cz ani k dnešnímu dni. Poměr výkonu proti T460 je z cizího syntetického testu. Stupně `mid` a `high` nemají žádné měření našeho enginu.
- **Svislé čárkované čáry na stěnách** v místech, kde na sebe navazují kvádry zdí: sešna A je vidí v enginu u mých levelů i ve zlatém vzorku. Dřív jsem je tady přičetla prohlížeči xView; to neplatí. Příčina neověřená (domněnka sešny A: prosvítají boční plochy kvádrů uvnitř zdi).
- **Počet entit.** Level `complex` má 320 až 584 entit. Jestli to T460 unese, řekne až engine se slučováním a měření.
- **Stažení assetu** z OpenGameArt a Quaternius (viz `tools/searcher/ZDROJE.md`).
- **Textury viděl jen softwarový vykreslovač** v galerii. Engine sešny A je nečte, na T460 ani na grafické kartě je nikdo neviděl. Cenu 30 textur na T460 nikdo neměřil (xBench 0.2 má jednu texturu přes celý obraz: 3,48 ms proti 2,44 ms bez ní). Osvětlení galerie a tónové mapování AgX jsou vlastnost náhledu, ne enginu. `uvScale` u `DiamondPlate008C` a `Metal009` je odhad 1 m (zdroj rozměr neuvádí), u ostatních ambientCG čtu rozměr jako centimetry.
- **Licence assetu v xSearcheru** je licence zdroje přečtená 24. 11. 2026; rozhraní ji u assetu neuvádí. Kdyby zdroj začal vést assety s jinou licencí, nástroj to nepozná. Rozměr předlohy u ambientCG čtu jako centimetry (rozhraní jednotku neuvádí). Nástroj jsem pouštěla jen v sandboxu (Linux, za proxy), ne na Ondřejově stroji s Windows.
- **Všechno v N-006** kromě toho, co je tam výslovně označené jako ověřené: stupně kvality a jejich meze jsou návrh bez měření.

## Návrhy (docs/navrhy)

| Číslo | Co | Dočasné řešení |
|---|---|---|
| N-001 | soubor se zapečeným světlem po vrcholech a vrstvách (stavba, vrstvy, otisky, co stíní). **Přijat se změnou (D-035):** dveře v portálech nestíní, úsek vrstvy s `gate`. **Znění 2 (24. 11.)** změnu zapracovává; k potvrzení svodné sešně: `gate` je seznam id dveří, hlavička nese `doors` | xBake píše do `dist/bake`, pole `baked` do balíků nezapisuje; brány umí od B03 |
| N-002 | svázané klouby (dvoukřídlé dveře, mikroskop, klika) | dvě entity spojené přes `io`; nesvázané klouby |
| N-003 | portál jen pro pohled a průhledné dveře (okno, mříž) | generátor okno a mřížovou bránu nerozmisťuje |
| N-004 | údaje prefabu pro rozmisťování (uchycení, rozměr otvoru) | výška v pravidlech předvoleb, otvor ze `source.params` |
| N-005 | průhlednost materiálu (sklo). **Přijat**, pole `opacity` v základu | `glass_pane` má `opacity` 0,3 (24. 11. večer) |
| N-006 | stupně kvality a vrstvy vzhledu (hra má vypadat skutečně; rezerva pro silnější stroj) | bohatší hrubý tvar a textury v polích, která formát už má; nová pole nepíšu |
| N-008 | rozměry postavy hráče (poloměr, výška, schod) a odstup kontroléru do základu: dnes jsou v enginu, v robotu zkoušky A × B a v generátoru. **Přijat (D-040)** | `src/gen/body.js` drží jednu kopii v generátoru; test `b_t1_xgen` ji porovnává s profilem enginu |
| N-009 | barva materiálu s texturou: `color` jako průměrná barva povrchu, běh kreslí `textura × (color / albedoMean)`. **Přijat (D-045)** | `kit_base` zapisuje `albedoMean` (24. 11. večer, `905d029`) |
| N-007 | zakrytí otvoru dveřmi počítat ze všech dílů dveří; `portal.door` jako seznam (doplňuje N-107 sešny A). **Bod 1 přijat, bod 2 zamítnut (D-036)** | dorazy a prahová lišta v sadě; křídla dvoukřídlých dveří mají `seeThrough` a první je v `portal.door`; zkouška paprsky v `b_t1`, `b_t2` |
| N-010 | víc interakcí v jednom prefabu (kartotéka se čtyřmi zásuvkami, stůl s kontejnerem); doporučuju `interact` jako seznam. **Otevřený** | korpus jmenuje zásuvky v `source.params.attach`, generátor je staví jako samostatné entity (`8d52fb5`) |

Bez návrhu, jen k zapsání: (1) `build.mjs` najde jeden `target.json` na složku v `tools/`, takže prohlížeč levelů sedí v `tools/designer`; až bude potřeba víc cílů, bude to chtít pole cílů nebo hlubší hledání. (2) Kloub na víc než 8 otáček (rotor centrifugy) formát neumí; rotor je zatím pevný díl. (3) Zápis JSON ve stylu zlatého vzorku mám jako vlastní funkci `fmtJson` v `src/gen/util.js`, protože ta z `tools/golden/make.mjs` není vyvezená; patřila by do `tools/lib`.

## Co potřebuju od sešny A

Nic neblokuje. Co by ses měla dozvědět dřív než při slučování:

1. **Zkus `packs/gen_demo` místo zlatého vzorku.** První level `complex_7` má zamčené dveře (`props: { locked: true }`) a páku, která je odemkne a otevře (`unlock`, potom `open` se zpožděním 0,5 s). Pro robota bez hádanky je `complex_21` nebo `catacombs_3`.
2. **Buňka přes dvě patra.** Hala v `complex_7` sahá od 0 do 6,4 m; portály do horního patra má ve výšce 3,4 m na galerii, schody jsou plné stupně v hale.
3. **Zapuštěné buňky.** Krypty mají podlahu pod nulou (až −0,72 m); práh portálu je ve výšce vyšší podlahy a schody jsou uvnitř nižší buňky.
4. **Zeď má jednoho vlastníka, ale vidí ji dvě buňky.** Až přijde ořez po buňkách (D-027), viditelná buňka musí kreslit i zdi sousedů, které se jí dotýkají; jinak v ní budou díry.
5. **Světla.** Pole `lights` dává základní osvětlení (má se zapékat). Svítidla sady mají vlastní světlo vypnuté (`on: false`) a vypínač u dveří je zapíná přes `io`; pochodně hoří pořád (`on: true`, `flicker`). Stolní lampa je zapojená sama na sebe (`on → turnOn`).
6. **`io` míří i na vlastní entitu** (stolní lampa) a dvě entity se smí spojit do kruhu (křídla dveří: `opened → open` tam i zpět). Počítám, že `open` na otevřené dveře už výstup `opened` nevyšle.
7. **Přečti si N-006.** Ondřej chce, aby hra vypadala skutečně a aby projekt unesl silnější stroj. Pro vykreslení z toho plyne: nepočítat s tím, že materiál je jen barva (formát už má `albedo` a `normal`) a že díl je jen `box` nebo `cyl` (formát už má `mesh`). Nic z toho není úkol vlny 1.
8. **Dveře (od B02).** Všechny dveře sady mají prahovou lištu 12 mm bez kolize a dorazy zárubně; zavřené jsou bez škvír. Křídla dvoukřídlých dveří mají `seeThrough`, první křídlo je v `portal.door` a druhé se najde přes spojení `opened → open`; jejich portál je pro pohled pořád otevřený (D-036). Prkenné dveře mají otvor 1,0 × 2,0 m.
9. **Katakomby (od B02)** mají chodby 1,6 až 1,9 m a stropy 2,6 až 3,2 m; `gen_demo` je přegenerovaný, `catacombs_3` má 30 buněk.
10. **Zapečené světlo s branami (od B03).** Soubor `<level>.light.bin` má u vrstev `light` a `entity` pole `gates: [{ gate: [id dveří…], count, offset }]`; čtení a složení barev je v `tools/bake/read.mjs` (bez Node, `decodeBake` bere `ArrayBuffer`). Úsek se násobí součinem otevření dveří v `gate`, stejně jako tvoje brány. Část vrstvy bez brány a vrstvy `indirect` a `ao` platí pro zavřené dveře. Vzorek smí být ve víc úsecích (okraj stínu po podílech).
12. **Textury v `kit_base` (od B2.4, N-009).** 21 materiálů má `albedo` (WebP 512 px), `normal` (512 px) a `uvScale` (metry na dlaždici; sítě základu dávají UV v metrech). `pack.json.assets` je nese s otiskem. Pozor: `color` u nich zůstal průměrnou barvou povrchu. Doslovné `color × textura` dá povrch až 7× tmavší; kresli `textura × (color / průměr textury)` (průměr spočítej při načtení, než svodná rozhodne N-009), nebo texturu zatím nekresli.
11. **Moje testy čtou tvůj profil hráče** (`src/play/profiles.js`, `CHARACTER_SKIN` z `src/phys/phys.js`), jen čtou. Když změníš poloměr nebo odstup, selže `b_t1_xgen` a je to správně: generátor pak staví pro menší postavu. Návrh N-008 to chce mít v základu.

## Poznatky pro skill
- (B04) Víc ovládaných dílů v jednom kusu nábytku: korpus + samostatné prefaby zásuvek v `source.params.attach`, generátor je staví jako entity hned za korpusem, katalog počítá obaly se zásuvkami (N-010). V enginu se zásuvka na pohon zastaví o hráče v dráze (D-025): ve zkoušce stůj dál než dosah výsuvu.
- (B04, krok 20) Sady vedle `kit_base`: balík levelů vyžaduje všechny sady přímo (`mergePacks` neřeší `requires` tranzitivně); generátor je spojí `mergeKits` a kolizi id hlásí hned. Vybavení podle sady se zapíná `catalog.has(<prefab>)`, takže `kit_base` sám dává stejné místnosti jako dřív.
- (B04) Řada skříní v ploše místnosti je `againstWall` u **pomyslné zdi** (osa řady, `n` = směr čela): dvojice zády k sobě jsou dvě pomyslné zdi na téže ose s opačným `n`. Rozměry a natočení řeší stejný kód jako nábytek u zdi.
- (B04) Věci na desku: šířky z `restBox`, výška z `components.place.top`, hloubka z `source.params.deck`; bez pruhu desky stojí vysoký přístroj v polici nástavby.
- (B04) `TODO.md` má oddíl „Nedávno hotovo“ v každé sešně: nahrazování textu podle prvního výskytu zapíše do oddílu svodné. Hledej od nadpisu svého oddílu.
- (B04) Kamera pro snímek místnosti: ve dveřích, 0,6 m za středem portálu (to místo generátor drží volné), ne v rohu (tam stojí nábytek).

- (B04) Bohatý tvar z kvádrů a válců (`tools/forge/shapes.mjs`), ne z `.glb`: pevné díly zapeče xBake (D-041) a engine je nakreslí bez načítání modelu. Sražená hrana = tři překryté kvádry (36 △).
- (B04) Kontrola „je vidět textura“ podle počtu odstínů se rozbije, když prefab zbohatne tvarem (víc odstínů už v čistém pohledu); měř na prefabu s velkými plochami jednoho materiálu.

- **Commit hned, ne až po testech.** Tuhle sešnu přerušil limit dřív, než vznikl první commit; soubory přežily restart kontejneru jen proto, že zůstaly na disku. První rozpracovaný stav patří na větev hned, jak projde validátorem, ne až po testech.
- **Celé centimetry v generátoru, metry až v datech.** Hrany buněk a zdí se porovnávají přesně a úsek zdi mezi dvěma buňkami je právě jejich společná stěna, takže otvor nikdy nepřesáhne žádnou z nich. Validátor nenašel nic už na prvním běhu.
- **Zdi jako desky z dělení plochy.** Každé dělení přidá jednu desku; desky se dotýkají, ale nepřekrývají. Deska se potom rozřeže podle buněk po obou stranách a každý kus dostane jednoho vlastníka. Zdi dvou pater nad sebou se musí oříznout pásmem patra, jinak se u buňky přes dvě patra překryjí.
- **Strop spodního patra a podlaha horního jsou dvě desky nad sebou** (rozteč pater = světlá výška + 2 × tloušťka), protože půdorysy pater se liší.
- **Validátor hledá překryvy i u klínů podle jejich obalu**, ne podle šikmé plochy.
- **Co validátor nehlídá, musí hlídat generátor a nezávislý test:** plošina zakrývala dveře, nábytek zatarasil cestu mezi dvěma dveřmi (asi v jednom levelu ze čtyřiceti), kancelářská židle a truhla se nikdy nepostavily kvůli obalu přes rozsah pohybu. Všechno našel až test nad daty.
- **Obal prefabu je přes celý rozsah pohybu.** Pro rozmisťování je potřeba i obal v klidu (`src/gen/measure.js`, `boundsAt`).
- **Pomocné soubory testů do `test/b_lib/`** (soubor `test/b_*.mjs` by se pustil jako test). Stejně to má sešna A.
- **xView kreslí první level balíku.** Jiný level vybere obal, který před jeho startem přehodí pořadí v `__PACK__` (`tools/designer/pre.js`); pořadí importů je pořadí spuštění. Pohled „Start“ se dívá vždy ve směru −Z bez ohledu na `yaw`.
- **`getImageData` opakovaně nad stejným plátnem** vypíše v Chromiu varování a test na čistou konzoli spadne; plátno pro statistiku vytvářej s `willReadFrequently`.
- **Formát umí víc, než kdo kreslí.** `albedo`, `normal` a díl `mesh` ve formátu jsou od základu 1; xView je přeskakuje a engine je nečte. Než napíšu „formát to neumí“, přečíst `src/xspace/formats.js`, ne dokumenty.
- **Čistý vzhled z kvádrů je pracovní pohled, ne herní.** Ondřej ho bere pro náhledy v nástrojích, pro hru ne. Montáž prefabů z kvádrů a válců mu jako ukázka vzhledu hry neposílat.
- **Síť ze sandboxu sešny B pustí víc, než říká zadání:** Poly Haven a ambientCG včetně souborů, OpenGameArt a Quaternius (stránky), GitHub, Wikimedia Commons. Kenney vrací 403, Sketchfab neprojde. Platí pro 22. 11. 2026; v jiné sešně měřit znovu.
- **Stavový dokument svodné sešny v projektu (`claude/xEngine_zaklad1_2026-11-22.md`) se mění během dne.** Před zápisem stavu ho přečíst znovu: mezi ránem a odpolednem se v něm změnil cílový commit znění 2 (`6ae2e6c` → `058ed41`) i postup (sloučit, ne přebázovat).
- **Mezera kolem křídla dveří je díra v obraze.** Engine za zavřenými dveřmi portálu místnost nekreslí. Mezery, které jsou u skutečných dveří (pod křídlem, kolem zárubně), musí v datech krýt doraz nebo lišta. Obal kolize to nepozná; pozná to paprsek proti dílům (`test/b_lib/door-cover.mjs`).
- **Dveřmi portálu smí být jen entita, která otvor zakryje sama.** Křídlo dvoukřídlých dveří ne.
- **Připojení repa se zápisem a push chtějí Ondřejovo výslovné slovo ve zprávě.** Bez něj je systém odmítne (sešně B02 připojení, sešně main 01 push). Číst veřejné repo jde i bez něj.
- **Než začneš slučovat z přílohy, zeptej se GitHubu znovu.** Mezi dvěma zprávami téhož večera svodná sešna znění 2 pushla a založila `integrace-1`.
- **Vrchol světelné sítě na hraně plochy leží často ve zdi.** Paprsek z něj skončí hned v tělese a kolem každé zdi vznikne tmavý pruh široký jednu buňku mřížky. Počátek paprsku posunout 2 cm po normále a 1 cm ke středu plochy; vzorek, který i tak leží v tělese, doplnit průměrem platných sousedů na téže ploše.
- **Srovnání „se stíny × bez stínů“ musí mít na obou stranách stejné členy.** Výpočet se zastíněním a odrazem vyšel světlejší než výpočet bez zastínění a bez odrazu; test to chytil jako selhání a chyba byla v testu.
- **Odraz počítaný paprsky zrní kvůli plochám těsně u světla** (osvětlení o dva řády vyšší než okolí, trefí je jeden paprsek z desítek). Bez obrazu to z čísel poznat nešlo; první pohled do náhledu ano. Pomohlo omezit jas zdroje odrazu a vyhladit vrstvu přes sousedy na ploše.
- **Světlo na dílu prefabu počítat ve středu stěny, ne v rozích, a díly téže entity nechat, ať si nestíní.** Roh křídla dveří je 1 cm od překladu a paprsek z něj skončí ve zdi: dveře byly v náhledu černé. Střed stěny skříně leží za čelem zásuvky.
- **Dočasné řešení v datech ověř proti testu, který data čte.** Dvoukřídlé dveře jsem přestala zapisovat do `portal.door` a vlastní testy prošly; zkouška A × B, kterou jsem tehdy v repu neměla, selhala. Když test druhé strany není po ruce, napsat změnu do stavu jako riziko, ne jako hotovou věc.
- **Než vymyslíš vlastní dočasné řešení, podívej se, jestli už svodná sešna nepřijala pole, které to řeší** (`interact.seeThrough` z N-107 řešilo přesně křídlo, které otvor nezakryje).
- **Stín po vrcholech má na hraně jen dvě hodnoty** a při mřížce 0,5 m z toho jsou hranaté skvrny; Ondřej si jich všiml hned. Jeden paprsek na vzorek nestačí.
- **Test, který měří menší postavou než hra, nic nehlídá.** Kontrola průchodnosti měřila 0,6 m a byla zelená; se skutečným hráčem (0,74 m) by neprošlo 11 z 200 levelů `complex` a 42 z 200 `catacombs`. Rozměry do testu brát z téhož místa, odkud je bere hra.
- **Okraj stínu: zjemňovat jen vzorky, jejichž soused vidí světlo jinak.** 4 × 4 paprsky z plošky vzorku, podíl místo ano/ne; stojí to 2,5× víc stínových paprsků (xLab 134 tisíc místo 55 tisíc); čas zapečení `complex_7` stoupl i s branami z 5,0 na 6,8 s (sandbox). Plošku oříznout okrajem plochy a dílčí bod, ke kterému od vzorku nevede volná úsečka, nepočítat.
- **Trojúhelníková plocha se dvěma dílky má stejné počty vrcholů a trojúhelníků jako mřížka 3 × 2.** Rozpoznání mřížky z počtů ji splete; ověřit, že poslední vrchol leží v protějším rohu.
- **Kód nad sítí pro světlo nemá předpokládat stejnou rozteč vrcholů** (D-037 ji změní). Plocha si má nést skutečné souřadnice řad a sloupců a nejbližší vzorek hledat v nich.
- **Zkouška proti levelu bez dveří je dobré nezávislé měřítko pro brány:** otevřené dveře mají pustit to, co projde otvorem bez nich, a ne víc.
- **Prostředí se může uprostřed kroku restartovat.** Soubory na disku přežily, běžící příkazy ne. Rozpracovaný stav commitnout hned, jak projde první test v Node, ještě před testy v prohlížeči.
- **Čísla v testu prohlížeče brát ze stejného výpočtu v Node** (`await import()` z `.cjs`), ne opisovat: `b_t6` měl natvrdo 20 658 vzorků a 16 vrstev.
- **Vestavěný `fetch` v Node za proxy sandboxu potřebuje `NODE_USE_ENV_PROXY=1`** (Node 22.21 a novější); `curl` proxy čte sám. Nástroj se za proxy spustí znovu s touto proměnnou; na stroji bez proxy nic nedělá.
- **Rozhraní Poly Haven má vlastní podmínky** (`ToS.md` v repu `Poly-Haven/Public-API`): User-Agent se jménem programu a uživatel musí vidět, že obsah je z Poly Haven. Assety jsou CC0 bez povinnosti uvádět autora; podmínky platí pro používání živého rozhraní.
- **Ani Poly Haven, ani ambientCG neuvádí licenci u assetu.** Brána se opírá o licenci zdroje a záznam nese adresu stránky s licencí a datum přečtení.
- **ambientCG dává materiál jen jako ZIP** (2K-JPG 6,7 až 35,2 MB), Poly Haven po souborech s MD5 (2K: 2,0 až 10,3 MB na tři mapy). Na ZIP stačí 70 řádků s `zlib.inflateRawSync` a `zlib.crc32`; závislost není potřeba.
- **esbuild 0.28 umí `import x from './a.webp' with { type: 'bytes' }`** (Uint8Array v balíku). Atribut `loader` neumí. Binární soubor se tak dostane do sestaveného HTML bez úpravy `build.mjs`.
- **Ploché barvy materiálů sady jsou proti vyfoceným povrchům většinou 1,5× až 5,5× světlejší** (lineárně). Textura násobená takovou barvou je tmavá, zesílení zapečené do textury useká světlá místa. Řešení v galerii: `textura × (color / průměr textury)`, N-009.
- **Kde odstín textury nesedí na barvu materiálu, brát z ní jen šedou kresbu** (práh 1,35× mezi kanály). Rezavě červený plech přebarvený do modrošedé měl modrou rez.
- **Pravidlo „průměr drží“ ověřit měřením jasu v obraze, ne okem z montáže:** šedé dlaždice vypadaly v montáži světlejší, změřený rozdíl byl 0 %.
- **Galerie bez tónového mapování přepálí textury do bílé,** jakmile k polokulovému světlu přibude světlo okolí. AgX ve všech pohledech stejně.
- **`sharp` 0.35.5 dává při stejné verzi stejné bajty WebP;** verzi připnout přesně, jinak se změní otisky v `pack.json`.
- **Uložené odpovědi pro test zkrátit skriptem, který jde pustit znovu,** ne ručně: seznam 871 textur měl 857 kB, test potřebuje 50 položek.

## Otázky pro Ondřeje

Zodpovězeno 24. 11. 2026: **1 (a)** opotřebený provoz, **2 (a)** z webu jen materiály a textury, tvary vlastní na vlastních kostrách, **3 (a)** herní vzhled nejdřív v galerii sady. Otázka 5: cílový stroj podle dnešního trhu do 35 000 Kč (oddíl „Sešna B03“, Cílový stroj). Otázka 4 je stažená od B02.

Tři otázky z konce sešny B03 zodpovězeny 24. 11. ve 02:04: mez grafické paměti **(a) 8 GB**; nejdřív **(a) xSearcher a první textury v galerii**; náhled zapečeného světla pro vygenerované levely **(b) počkat, až soubor načte hra**.

Nové otázky z 24. 11. odpoledne (B2.4; galerie `dist/kit.html`, montáže `b_kit_pohledy.png` a `b_kit_vzornik.png`):

1. **Barvy materiálů jsou proti skutečným povrchům světlejší** (beton 5×, omítka 2×). (a) stáhnout je k barvě textur a v generovaných levelech přidat expozici; kresba bude výraznější a povrchy přirozenější. (b) nechat dnešní světlé barvy, textura se jim přizpůsobuje. Doporučuju (a).
2. **Textury v galerii:** (a) směr sedí, pokračuj; (b) některé vyměnit (napiš které); (c) jinak.
3. **Co dál:** (a) bohatší hrubý tvar prefabů (zkosení, drobné díly; zbytek B2.4); (b) B2.5 zkouška povrchu na jednom kusu (dveře ze sítě `.glb`). Doporučuju (a).

Mimo sešnu B na tebe čekají čtyři otázky sešny A (`A_STAV.md`, konec): zkouška textury světla hned, nebo později (N-110); dveře od hráče do dat (N-109); měření `?bench`; terminál po Esc.
