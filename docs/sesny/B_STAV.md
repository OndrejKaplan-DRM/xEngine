# Stav sešny B

**Vlna:** 2 (zadání nahoře v `START_B.md`) · **Větev:** `sesna-b` · **Základ:** základ 2, znění 5 (`zaklad-2` = `main` = `608f0cb`: sloučená vlna 2 obou sešen, D-045 až D-048), sloučeno 24. 11. 2026 (`614e4d7`) · **Stav:** 25. 11. 2026 v noci, sešna B04 (krok 21: realistický inventář z hladkých sítí)

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
| realistický inventář: hladké sítě, sklo, plasty, chemikálie, zaoblení přístrojů; návrh N-012 | hotovo první kolo (kus po kuse zbývá u přístrojů, nábytku a `kit_it`) | `2a9a4bb` až `3be532e` |
| znění 8 a 9 základu sloučeno; interakce jen přes `src/xspace/interact.js` (D-052) | hotovo | `8ba697c`, `73cb0bb` |
| xBake zapeče pevné díly prefabů (D-041) | hotovo | `d91f6ba` a následující |
| sklo výraznější (Ondřej 1:02, volba 2 b): lem a odlesk; návrh N-013 | hotovo v datech | `31d1ed2` a následující |
| rozpočet podle toho, co je z buňky prokazatelně vidět (PVS; Ondřej 1:29, volba 2 a); B-T10; návrh N-014 | hotovo | viz oddíl níže |
| `kit_home` s předvolbou bytu | nezačato | |

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

### Ondřej 25. 11. 2026, 0:19: běh `?bench` na T460 a otázky na test

Poslal výsledek `xlab_gen.html?level=complex_7&bench` (sestavení A02 „krok 5“, ještě bez sítí skla; surový výstup `docs/navrhy/N-011-bench-T460-2026-11-24.json`) a snímek nastavení: zorné pole 90°, 1 080 řádků, vyhlazování zapnuto, mřížka světla 0,25 m. Ptá se: (1) „mám podezření, že máš v testu nějakou chybu… měl jsem puštěnou jedinou kartu“; (2) „počítáš s tím dlouhým zapékáním světla na začátku? A nastavení si hlídáš?“; (3) „obraz celou dobu skáče zleva doprava… je to celou dobu schválně tak kývavá chůze?“

Co jsem zjistila (podrobně návrh **N-011** pro sešnu A, `src/app/bench.js`):
- **Kývání je chyba robota měření**, ne záměr: řídí se o krok pozadu (systém `input` sebere otočení dřív, než ho robot pošle), smyčka kmitá 20 Hz. Simulace v Node: 10 obratů za 0,75 s, s opravou 1.
- **30 snímků/s způsobuje měření**: každý snímek se kvůli času vykreslení kreslí ještě v dávce 12 až 40 ms; 16,4 ms práce + dávka ≈ naměřených 33,4 ms. Platí `workMs` (medián 16,4 ms, 95 % 23,4 ms) a `draw.ms` (11,1 / 17,45 ms); rozestup snímků ne.
- **Nastavení ve výstupu jsou** (`env.rowsChosen` 1 080, `env.antialias` true, `level.lightGrid` 0,25), chybí zorné pole.
- **Světlo se počítá 33,3 s** (`lightBuildMs`, 368 136 vzorků při mřížce 0,25 m): běh ho počítá sám, soubor z xBake ještě nečte. Tohle odstraní D-041 (xBake zapeče i díly prefabů) a čtení souboru v enginu A.
- Pro mě: **nejvýš 490 volání kreslení** v `c_corr_01` (mez 400, sandbox T5 ukázal 255) a 135 488 △ v pohledu. Laboratoře přidaly materiály; hlídat při přestavbě inventáře.

### Ondřej 25. 11. 2026, 1:14: `?bench` se sítěmi na T460

Druhý běh `xlab_gen.html?level=complex_7&bench` na T460 se sestavením z 0:45 (realistický inventář, první kolo; bez lemu a odlesku skla). Surový výstup `docs/navrhy/N-011-bench-T460-2026-11-25.json`. Proti běhu bez sítí (24. 11., stejný level, stejné nastavení):

| Veličina (T460) | Bez sítí | Se sítěmi |
|---|---|---|
| díly `mesh` / jejich △ | 0 / 0 | 588 / 65 806 |
| statické △ levelu | 426 532 | 457 778 |
| vykreslení snímku `draw.ms` medián / 95 % / max | 11,1 / 17,45 / 33,1 ms | 11,05 / 17,65 / 45,1 ms |
| práce snímku `workMs` medián / 95 % | 16,4 / 23,4 ms | 16,4 / 24,2 ms |
| volání kreslení 95 % / max | 264 / 490 | 269 / 496 |
| △ v pohledu medián / 95 % / max | 26 420 / 91 256 / 135 488 | 26 950 / 95 712 / 149 094 |
| stavba světla za běhu | 33,3 s | 34,3 s |

**Závěr (změřeno):** hladké sítě inventáře stojí na T460 v mediánu nic a v 95 % +0,2 ms vykreslení (+1 %); jediné maximum 45,1 ms je ojedinělá špička. 30 snímků/s a kývání jsou dál chyby měření (N-011). Rezerva je v 95 % malá (17,65 ms proti 16,7 ms na 60 snímků/s); rozhoduje spíš počet volání než trojúhelníky.

### Realistický inventář (krok 21, 25. 11. 2026; `2a9a4bb`, `815d1ba`, `4f20bca`, `9489c70`, `3be532e`)

**Nástroje (`tools/forge/mesh/`).** Hladké sítě, které xForge zapíše do `packs/<sada>/meshes/*.glb` a do `pack.json.assets` s otiskem; díl prefabu je `mesh` s cestou `meshes/<soubor>.glb#<uzel>` (formát ho má od základu 1, engine A ho kreslí).
- `lathe.mjs`: rotační plocha z profilu `[r, y]` (líc vpravo od směru profilu, bod s r = 0 je pól, `'c'` ostrá hrana, `rounded()` zaoblí roh poloměrem a počtem úseků); `vesselProfile` dělá tenkou stěnu (vnější profil, oblý okraj, vnitřní odsazený po normále, dno o zadanou tloušťku nad vnějším pólem) a zjednoduší ji podle vzdálenosti od přímky (podle úhlu mizelo rameno kužele).
- `solids.mjs`: zaoblený kvádr (`s` 0/1/2 → 12/108/300 △), deska se zaoblenými rohy, hranol, trubka s ohyby (paralelní přenos rámce), válec, kužel, koule, toroid, jehlan, otevřená krabice, zrcadlení, deformace a vyhlazení normál.
- `glb.mjs` (deterministický zápis: zaokrouhlení, indexy uint16/32, min/max), `sha256.mjs` (otisk bez závislostí), `registry.mjs` (`meshPart`, `meshTris`, `meshCorners`, `meshFiles`, `shiftMeshPart`). `lib.mjs` počítá trojúhelníky a obaly i ze sítí; posun dílu `shiftPart` umí i síť.
- `lab/common.mjs`: v `simple()` a `moving()` se válec od poloměru 8 mm sám změní na válec se zaoblenou hranou (pokud nepřečnívá zadané kolize), plášť přístroje (`casing`) na zaoblený kvádr s patkami, panel na zapuštěnou desku s oblými tlačítky. Tím se zaoblení dostalo do všech přístrojů obou sad bez přepisu každého kusu.

**Sklo (Ondřejova výtka „Erlenmeyerova baňka vůbec nevypadá jako Erlenmeyerova baňka“).** Každá nádoba je tenká stěna: vnější i vnitřní povrch, oblý okraj, zaoblené dno a pata, kužel s ramenem do hrdla (Erlenmeyer), koule s hrdlem (varná), hruška se zábrusem (odměrná), pata se šestiúhelníkovou nohou (válec). Materiál `glass_thin` (`opacity` 0,25, oboustranný), smaltovaná stupnice a pole na popis (`enamel_white`), matné zábrusy (`glass_frosted`), kapaliny s meniskem pod hladinou stěny, víčka GL 45 s vroubky, zátky, korek, porcelán, PTFE. Počet stěn podle poloměru (10 až 22). Nové prefaby: nálevka v Erlenmeyerově baňce s filtrem, Büchnerova nálevka na odsávací baňce s hadicí (sestava), krystalizační miska, kapací lahvičky (dvě), kádinka s pipetami, filtrační baňka 500 ml.
**Přestavěno dál:** plasty (53: zkumavky s kuželovým dnem, víčka s vroubky, Petriho misky, destičky, střičky, kanystry, lahve, vialky), chemikálie (38: hnědé lahve s výstražným kosočtvercem, dózy s vroubkovaným víčkem, vyboulený pytel, plechovka, bezpečnostní kanystr, pufry GL 45, vialky s hliníkovým víčkem, sklenice s krystaly, odpadní nádoba s nálevkou), rotační odparka (skloněná baňka v lázni, parovod, chladič se spirálou, jímací baňka). Ostatní přístroje, velké přístroje, nábytek, chlazení, chovy a celý `kit_it` mají zatím jen zaoblení ze společné vrstvy, ne přestavbu kus po kuse.

| Sada | Prefabů | △ celkem (nejvíc) | Před přestavbou | Sítě .glb |
|---|---|---|---|---|
| `kit_lab` | 293 | 171 484 (2 458, sestava) | 286 prefabů, 93 580 △ (+83 %) | 4 221 kB: `glass` 1,23 MB, `plastic` 1,07 MB, `chem` 0,56 MB, `parts` 1,40 MB, `bench` 63 kB |
| `kit_it` | 80 | 16 696 (888) | 15 128 △ (+10 %) | `parts` 109 kB |

Po kategoriích `kit_lab`: sklo 76 kusů 60 960 △, plasty 53 / 29 180, chemikálie 38 / 24 018, stolní přístroje 52 / 23 946, velké přístroje 26 / 11 512, nábytek 23 / 13 872, chlazení 11 / 3 634, chovy 14 / 4 362.

**Jak čtu „o 50 % víc trojúhelníků“:** mez **prefabu** 1 000 → 1 500 △, sestava (stojan, exsikátor, odparka, odsávací baňka) do 2 500 △. Součet sady jen hlásím; B-T9 hlídá, aby nepřesáhl dvojnásobek stavu před přestavbou (`kit_lab` 93 580, `kit_it` 15 128). **Sada jako celek narostla o 83 %, ne o 50 %**; otázka na Ondřeje, jestli myslel prefab, nebo celek. V levelu je nárůst menší, protože generátor bere asi 200 z 373 prefabů a sklo stojí jen na deskách:

| Level (sandbox, b_t1, 200 seedů) | Před (krok 20) | Po (krok 21) |
|---|---|---|
| `complex` dvě patra, celý level (kvádry + prefaby) | 108 308 až 228 516 △, medián 159 064 | 124 928 až 295 204 △, medián 197 622 (+24 %) |
| `complex_7`, vrcholy prefabů | 239 260 | kvádry a válce 222 430 + sítě 29 173 = 251 603 (+5 %) |
| `dist/xlab_gen.html` | 8,0 MB | 13,6 MB (13 632 kB; mez Ondřeje 25 MB) |
| T5 v prohlížeči, nejvíc volání kreslení po cestě robota | 255 (`complex_7`) | 251 (`complex_7`), 116, 110 |

**Pozor:** nejhorší level `complex` (295 204 △) je těsně pod mezí 300 tisíc z b_t1. Další přestavba kus po kuse musí brát z rozpočtu levelu, ne jen prefabu (víc tvaru tam, kde je vidět zblízka; méně stěn u věcí v regálech). Výkon na T460: změřený 25. 11. v 1:14 (oddíl výše), sítě v 95 % +0,2 ms vykreslení.

**Kontroly (B-T9, 16):** validátor, bajtová shoda zápisu včetně `.glb`, mez 1 500 / 2 500 △, každá síť je v `pack.json.assets`, **kolize obepínají síť do 3 mm** (`boundsAt(p, {}, meshCorners)` proti `boundsAt(p)`; generátor sítě nečte, rozmisťuje podle kolizí), součet sady ≤ 2× stav před přestavbou. Snímky: `test/out/b_sklo_pred_po.png` (galerie, sklo před a po), `test/out/b_sklo_hra.png` (12 kusů skla v enginu A v `complex_7` a `complex_21`), `test/out/b_mistnosti.png`, montáže `plast.png`, `chem.png`, `pristroje.png` (galerie).

**Neověřeno / známé meze:**
- Díly `mesh` xBake nezapeče (vzorky D-041 berou jen `box` a `cyl`) a zkouška A × B v Node je nevidí (čte balík bez souborů). Obojí řeší návrh **N-012** (rotační a zaoblený díl ve formátu); do té doby sítě svítí běh sám.
- Sklo je v enginu A kreslené jako průhledný materiál bez lomu a odlesku; jak vypadá při vyhlazování a na T460, neviděl nikdo.
- Snímek místností z kamery ve dveřích chytí otevřené křídlo dveří přes půl obrazu (serverovny v `b_mistnosti.png`); je to pomůcka, ne chyba levelu.

### Zapečené pevné díly prefabů (krok 22, D-041; 25. 11. 2026)

**Znění 8 a 9 základu** sloučeno bez konfliktů (`8ba697c`). Podle dodatku D-052 čtu interakce jen přes `src/xspace/interact.js` (`interactions`, `doorInteraction`) v `src/gen/catalog.js`, `furnish.js`, `tools/bake/gates.mjs`, `view.js`, `tools/forge/doc.mjs`, galerii a testech; `b_t7` odebírá z manifestu zlatého vzorku i `ammo` a `weapons` (`73cb0bb`). Kartotéka a stůl zůstávají korpus + zásuvky, dokud sešna A neumí vybrat interakci podle zasaženého uzlu (dodatek, bod 2).

**Co xBake dělá nově.** Vzorky jsou v pořadí `levelSamples` ze základu: kvádry, potom vrcholy pevných dílů prefabů po entitách (`tools/bake/scene.mjs`). Plocha dílu = souvislá část jeho sítě (stěna kvádru, plášť a podstavy válce); počátek paprsku 2 cm nad plochou a 1 cm k jejímu středu jako u kvádrů. Hlavička souboru nese `entities: [[id, počet]]`, otisk geometrie zahrnuje entity (id, prefab, poloha, natočení, počet vzorků). Náhled xBake barví pevné díly ze zapečených vzorků, pohyblivé díly dál počítá sám. `cli.mjs --no-entities` zapeče jen kvádry (ke srovnání).

Rozhodla jsem (pro svodnou a sešnu A k vědomí):
- **Vlastní kolize entity její díly nestíní** (paprsky ze vzorku dílu přeskočí kolize téže entity). Kolize je obal; bez toho by díly uvnitř obalu (police pod deskou, přístroj v nástavbě) byly černé. Cena: spodní police regálu dostane světlo, jako by nad ní horní police nebyla, a kout pod deskou stolu nemá vlastní stín. Cizí entity a kvádry stíní normálně.
- Zdrojem odrazu jsou dál jen kvádry (zásah kolize prefabu se počítá jen do přístupnosti okolního světla) a mez jasu zdroje se počítá jen z vzorků kvádrů, takže **vzorky kvádrů mají s díly i bez nich stejné hodnoty ve všech vrstvách** (B-T5).
- Okraj stínu po podílech je jen na kvádrech (díl nemá mřížku řad a sloupců, jeden paprsek na vzorek).

| Level (sandbox, `node tools/bake/cli.mjs packs/gen_demo`) | Vzorků (z toho na dílech) | Zapečení | Soubor (gzip) | Bez dílů |
|---|---|---|---|---|
| `complex_7` | 182 468 (116 850) | 28,1 s | 4 835 kB (3 420 kB) | 65 618 vzorků, 8,6 s, 1 744 kB (1 131 kB) |
| `complex_21` | 149 303 | 20 až 25 s | 4 047 kB | |
| `catacombs_3` | 57 132 | 5,2 s | 1 404 kB | |
| `golden/xlab` | 22 111 (1 602 na 11 entitách) | 1,1 s | 533 kB | 20 509 vzorků |

Vzorků v tělese (dno dílu na podlaze, záda u zdi) je v `complex_7` o 9 768 víc; nejsou vidět. 116 vrstev = jedna na světlo, z toho většina řídkých. **Velikost:** tři levely by v dnešním formátu přidaly do hry 10,3 MB (gzip 7,6 MB); s hrou 13,6 MB by to bylo těsně pod 25 MB. Kolik ušetří vrstvy jen pro přepínaná světla a kratší čísla, je otázka zkoušky N-110 (dodatek D-050, další krok).

**Kontroly** (B-T5, 32): vzorky kvádrů a za nimi díly po entitách v pořadí `levelSamples`, každý vzorek ve vrcholu `levelSamples` se stejnou normálou, bez zastínění přesně `lightIrradiance` i na dílech, horní plocha entity, na kterou světlo míří, světlo dostane (36 z 36 v xLabu), na dílech 77 % vzorků, na které světlo míří, světlo dostane (zbytek stíní jiná tělesa), vzorky kvádrů beze změny, hlavička `entities` a otisk s polohou entity. B-T6: náhled zapeče xLab stejně jako Node.

**Neověřeno:** běh soubor dál nečte, takže v enginu A zapečené díly nikdo neviděl; náhled `complex_7` (přehled a start) vypadá v pořádku, laboratoře zblízka ne. Díly `mesh` (sklo, plasty, chemikálie, zaoblené pláště a panely ze sítí) do vzorků nepatří (D-041 bere jen `box` a `cyl`) a svítí je běh: N-012.

### Sklo s lemem a odleskem (krok 23, Ondřej 25. 11. v 1:02, volba 2 b)

Běh kreslí sklo jako průhlednou barvu (`MeshBasicMaterial`, barva vrcholů, `opacity`), takže okraj ani odlesk nevzniknou. V datech teď každá nádoba z `vesselGeom` nese dvě **doprovodné sítě** (`geom.extras`), ze kterých `definePrefab` udělá díly téhož uzlu (`expandExtras` v `tools/forge/mesh/registry.mjs`); ohnou se s hubičkou (`deform`), zrcadlí a posunou se sestavou (`append`, `mirror`, `shiftMeshPart`):
- **lem**: horní okraj s 1,2 až 4 mm vnější a vnitřní stěny, pět bodů profilu, 0,15 mm nad sklem, materiál `glass_rim` (opacity 0,72, světlejší) nebo `glass_amber_rim`;
- **odlesk**: dva svislé pruhy na vnější stěně od 12 % výšky po lem (vpředu vlevo 9°, vpravo 2,5°), materiál `glass_glint` (bílá, opacity 0,55);
- `glass_lab` má opacity 0,3 (dřív 0,25) a nádech do zelenomodra; kovová lázeň ani plast doprovodné sítě nedostanou (materiál dílu není sklo).

Pruhy jsou namalované, točí se s předmětem a nesledují světlo; skutečný okraj podle úhlu pohledu a odlesk navrhuju sešně A v **N-013** (shader průhledného materiálu, bez nového pole). Snímky: `test/out/sklo_odlesk.png` (galerie), `b_sklo_hra2.png` a `b_sklo_zblizka.png` (engine A).

**Trojúhelníky:** sklo a lem přidaly asi 10 tisíc △; nejhorší level `complex` vyšel na 303 886 (mez b_t1 300 tisíc). Vrátila jsem to zjednodušením víček a náplní vialek (karton a podložka 1 344 → 936 a 1 380 → 972 △) a lemem z pěti bodů: `kit_lab` 181 016 △, nejhorší level 299 608. **Jsme na mezi.** Celý level je přísná náhrada za „viditelnou scénu do 300 tisíc △“ (06_ROZPOCTY); `?bench` na T460 ukázal v `complex_7` nejvýš 135 488 △ v pohledu. Než přidám další tvar, potřebuju lepší měřítko (buňka + sousedé přes portály) nebo měření z T460. Sestava (stojan, odparka, exsikátor) smí mít do 3 000 △ (přístroj 2 000 × 1,5 podle volby 1 a), odparka má 2 814.

### Rozpočet podle viditelnosti (krok 24, Ondřej 1:29, volba 2 a)

`test/b_lib/pvs.mjs`: pro každou buňku množina buněk, do kterých z ní vede přímka otvory portálů (všechny dveře otevřené, v půdorysu, tedy nadmnožina skutečné viditelnosti z kteréhokoli místa buňky). B-T1 teď hlídá **„z žádné buňky víc než 300 tisíc △“** s kvádry po síti světla (`levelLightMeshes`, mřížka dat 0,5 m), jak je kreslí běh, a délku řetězu portálů s výhledem do 12 (`MAX_DEPTH` viditelnosti sešny A). Celý level se jen hlásí. Nová sada **B-T10** (10 kontrol): ručně složené případy, souměrnost, ukázkové levely a shoda s T460.

| 200 seedů (sandbox) | Nejvíc △ vidět z buňky | Celý level (kvádry po síti světla) | Řetěz s výhledem |
|---|---|---|---|
| `complex` dvě patra | 88 168 až 205 314, medián 139 342 | 195 496 až 396 894 | 3 až 7 |
| `complex` jedno patro | 92 576 až 229 174 | 224 389 až 346 231 | 3 až 7 |
| `catacombs` | 46 926 až 106 804 | 68 430 až 134 348 | 3 až 8 |

Shoda s měřením: PVS `complex_7` při mřížce 0,25 m (Ondřejovo nastavení) je nejvýš 251 278 △ v `c_corr_01`; T460 změřil nejvýš 149 094 △ a nejvíc volání (496) právě v `c_corr_01`. **Pozor:** při mřížce 0,25 m mají kvádry asi dvakrát víc △ (`complex_21` 293 394 vidět z buňky); se světlem v textuře (D-050) budou kvádry zase 12 △. Návrh **N-014**: PVS do základu a pro sešnu A zkouška „kreslím ⊆ PVS“ (rozpočet) a „vše, co paprsek z oka zasáhne, kreslím“ (nic nebliká), hlavně u portálů.

**Regrese po krocích 22 a 23** (sandbox): `npm test` T0 41, T1 155, T1b 14, T1c 27, T1d 31, T4 46, T2 15, T3 12; `npm run test:b` 9 sad (B-T1 78, B-T2 33, B-T3 12, B-T4 20, B-T5 32, B-T6 9, B-T7 47, B-T8 7, B-T9 16); `npm run test:axb` 31 + 9; 0 selhalo.

**Regrese po kroku 21** (sandbox): `npm test` T0 41, T1 155, T1b 14, T4 46, T2 15, T3 12; `npm run test:b` 9 sad (B-T1 78, B-T2 33, B-T3 12, B-T4 20, B-T5 26, B-T6 9, B-T7 47, B-T8 7, B-T9 16); `npm run test:axb` 31 + 9; 0 selhalo.

## Sešny B02 a B03

Oddíly „Sešna B03“, „Hotovo × neuděláno“, „Sešna B02“, „Rozhodnutí Ondřeje (22. 11.)“, „Vzhled: co chybí a co s tím“ a „Plán další sešny B“ jsou beze změny v `docs/sesny/B_STAV_historie.md`.

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
| N-011 | pro sešnu A: `?bench` kývá pohledem (řízení robota o krok pozadu, 20 Hz) a dávkou měření srazí hru na 30 snímků/s; přidat do výstupu zorné pole. **Otevřený** | platí `workMs` a `draw.ms`, ne rozestup snímků |
| N-013 | pro sešnu A: sklo s okrajem podle úhlu pohledu a odleskem (shader průhledného materiálu na stupni `low`, bez nového pole). **Otevřený** | lem a pruhy odlesku jako doprovodné sítě nádob (`31d1ed2`) |
| N-014 | prokazatelná viditelnost: PVS do základu jako měřítko rozpočtu; pro sešnu A zkouška, že kreslí ⊆ PVS a nic, co je vidět, nevynechá (Ondřej 1:29). **Otevřený** | `test/b_lib/pvs.mjs`, B-T1 a B-T10 |
| N-012 | rotační díl `lathe` a zaoblený kvádr `rbox` ve formátu, aby je zapekl xBake (D-041), měřil generátor a viděla zkouška A × B v Node; balík bez megabajtů `.glb`. **Otevřený** | díly `mesh` z xForge (`tools/forge/mesh/`), 4,2 MB sítí v `kit_lab` |

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
- (B04, krok 21) Laboratorní sklo jako stoh válců vypadá schodovitě a Ondřej to pozná hned. Tenká stěna z jednoho profilu (ven, přes oblý okraj, dovnitř) dá skutečný tvar za 300 až 900 △. Zjednodušovat profil podle vzdálenosti od přímky, ne podle úhlu (úhel smaže rameno kužele) a dno vnitřku počítat od vnějšího pólu, ne od absolutní výšky.
- (B04, krok 21) Generátor sítě nečte: kolize prefabu musí síť obepnout (B-T9 to měří po převedení sítě do prostoru prefabu). Válec, který přečnívá zadané kolize, nechávat válcem.
- (B04, krok 21) Galerie čte `__PACK__` z `packs/`: po změně xForge nejdřív `make-pack.mjs`, potom `node build.mjs kit`, jinak galerie ukáže stará data.
- (B04, krok 21) Změna zaoblení ve společné vrstvě (`simple`, `casing`, `panel`) prošla všemi sadami najednou; levnější než přepis kusů, ale rotace panelu měla opačné znaménko a panely ležely na zemi. Montáž galerie po každé změně společné vrstvy.

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

Starší otázky (B02 až B04) jsou zodpovězené a jejich odpovědi stojí v oddílech sešen výše. **Ondřej 25. 11. v 1:02:** (1 a) +50 % trojúhelníků platí na jeden prefab (sada +83 %, level +24 % nechat); (2 b) sklo ve hře je málo vidět, chce **výraznější okraj a odlesk**; (3 a) D-041 (hotové v téže noci); (4 a) `?bench` s novým sestavením pustí.

**Ondřej 25. 11. v 1:29:** (1 a) sklo takhle stačí; (2 a) mez trojúhelníků měřit z místnosti a místností za dveřmi, „udělejme to jako ve hrách – chytře škrtejme, co není vidět. Ale opravdu prokazatelně – už několikrát na mě blikla při jiném projektu místnost, ke které jsem se blížil…“; (3 b) přístroje a nábytek kus po kuse, „opět udělej aspoň 300 ks inventáře pro interiér, ať máme z čeho stavět“ (dotaz, zda byt a dům, nebo laboratoře a kanceláře, poslaný v 1:3x).

Otevřené: „vnitřní kompartmentizace“ = (a) přihrádky a police (pracuju s tím), nebo (b) kresba dřeva.
