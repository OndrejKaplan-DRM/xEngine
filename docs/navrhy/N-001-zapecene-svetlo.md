# N-001: soubor se zapečeným světlem po vrcholech a po vrstvách

Sešna: B · Datum: 2026-11-22, znění 2 z 2026-11-24 · Stav: přijatý se změnou (D-035); znění 2 změnu zapracovává

> **Znění 2 (24. 11. 2026).** Svodná sešna návrh přijala s jednou změnou (D-035): křídla dveří v portálech při zapékání nestíní a světlo jejich otvorem patří do úseku vrstvy s bránou. Oddíly 2, 3, 5 a 6 jsou podle toho přepsané a xBake to od `3d1aa2a` dělá; od `9d34aa6` bere vzorky z `levelLightMeshes` (mřížka znění 2, D-037). Dvě věci nad rámec rozhodnutí jsou označené **k potvrzení**: brána je seznam dveří (ne jedno id) a hlavička nese pole `doors`.

## Co potřebuju

Přijmout formát souboru, do kterého xBake ukládá zapečené světlo, a pravidla, podle kterých ho běh použije nebo zahodí.

## Proč to bez toho nejde

Kontrakt (02_KONTRAKTY, Světlo) určuje vzorky (vrcholy `brushLightMesh(b, LIGHT_CELL)`), jejich pořadí, vrstvy a jednotku (osvětlení E, lineárně). Formát souboru výslovně nechává na tomto návrhu. Bez něj musí běh počítat vrstvy při každém načtení levelu sám; `complex_7` jich má 118 a 73 092 vzorků.

## Návrh

### 1. Kde soubor leží

`levels/<id levelu>.light.bin` v balíku, zapsaný v `assets` manifestu (licence `own`). Level na něj ukazuje polem, které formát už má: `baked: { file, method: "vertex", hash }`. `hash` je otisk geometrie (viz 4).

### 2. Stavba souboru (little-endian)

| Část | Obsah |
|---|---|
| 4 bajty | značka `XLV1` |
| `uint32` | délka hlavičky v bajtech (zarovnaná na 4) |
| hlavička | JSON v UTF-8, doplněný mezerami |
| data | pole `Float32` a `Uint32` za sebou; polohu každého říká hlavička (`offset` v bajtech od začátku dat) |

Hlavička: `format: "xspace-light"`, `version: 1`, `level`, `method: "vertex"`, `cell` (buňka mřížky), `samples` (počet vzorků), `brushes: [[id, počet vzorků], …]` v pořadí levelu, `grid` (znění mřížky světla, dnes 2), `geometry`, `scene` (otisky), `doors: [id entity, …]` (dveře portálů, se kterými se zapékalo; **k potvrzení**), `layers: [{ id, kind, ref, channels, encoding, count, offset, nonzero, light?, gates? }]`.

Úseky s bránou (D-035): `gates: [{ gate: [id entity dveří, …], count, offset }]` u vrstev `light` a `entity`. Úsek je vždy řídký se stejnou stavbou jako řídká vrstva (`Uint32[count]` indexy vzestupně, potom `Float32[count]`). `encoding`, `count` a `offset` vrstvy popisují její část bez brány. Tentýž vzorek smí být v části bez brány i v několika úsecích: na okraji stínu svítí každou cestou svým podílem.

`gate` je seznam, protože úsečka ze vzorku ke světlu může projít dvojími dveřmi (světlo svítí přes dvě místnosti). Změřeno (na mřížce před D-037): v `complex_7` je 63 různých bran ze 47 dveří a 986 z 11 481 položek úseků (8,6 %) vede přes dvoje dveře; v `complex_21` 1 055 z 10 134 (10,4 %); v xLabu 2 z 565. Rozhodnutí D-035 mluví o „poli `gate` (id entity dveří)“; seznam s jedním id je jeho obecnější tvar a stejně to má sešna A za běhu (`occlusion.js`, kombinace dveří). **K potvrzení.**

Vzorek číslo `s` = vrchol `v` kvádru `i`, kde `s = Σ počtů předchozích kvádrů + v`. Pořadí vrcholů uvnitř kvádru je pořadí `brushLightMesh`.

Kódování vrstvy: `dense` = `Float32[samples × channels]`; `sparse` = `Uint32[count]` indexy vzorků vzestupně a za nimi `Float32[count × channels]`, ostatní vzorky mají 0. xBake volí to menší.

### 3. Vrstvy

| `kind` | `id` | Kanály | Co obsahuje |
|---|---|---|---|
| `light` | `light:<id světla>` | 1 | E vzorků od jednoho světla z pole `lights` při plné úrovni, se zastíněním |
| `entity` | `entity:<id entity>` | 1 | totéž pro bodové světlo prefabu, jehož uzel nemá nad sebou kloub (nemůže se pohnout) |
| `indirect` | `indirect` | 3 | jeden odraz základních světel levelu při plné úrovni; už vynásobeno barvou světel a barvou plochy, od které se světlo odrazilo. Hlavička vrstvy nese `weight`, doporučenou váhu za běhu |
| `ao` | `ao` | 1 | přístupnost okolního světla 0 až 1 (kout a pata zdi mají méně) |

Barva vzorku za běhu: `okolní světlo × ao + Σ úroveň × barva světla × (E bez brány + Σ otevření brány × E úseku) + indirect × k`. Otevření brány je součin otevření jejích dveří (0 zavřeno, 1 otevřeno; podíl dráhy kloubu od klidu k dorazu, jak ho počítá sešna A). Vrstvy `indirect` a `ao` se bránou neřídí: jsou spočtené se zavřenými dveřmi.

Původní vzorec bez bran: `okolní světlo × ao + Σ úroveň × barva světla × E + indirect × k`. Barvou materiálu se násobí až potom, jako dnes. `k` je váha odrazu z hlavičky vrstvy (`weight`). xBake píše 0,5: Ondřej 22. 11. 2026 po zhlédnutí náhledu zvolil slabší odraz. Data vrstvy jsou spočtená plně, váhu jde změnit bez nového zapečení.

Světlo s `dynamic: true` a světlo prefabu na pohyblivém uzlu vrstvu nemají; počítá je běh.

### 4. Otisky a co s nimi běh udělá

| Otisk | Z čeho | Když nesedí |
|---|---|---|
| `geometry` | znění mřížky, buňka, tvar, `min`, `max` a `rise` všech kvádrů v pořadí levelu a počet vzorků každého kvádru (závisí i na `vis` a průhlednosti materiálů) | vzorky neodpovídají: soubor zahodit celý a počítat při načtení |
| `layers[].light` | druh, poloha, směr, svítivost, dosah a úhel světla (barva ne) | přepočítat jen tuhle vrstvu |
| `scene` | entity (id, prefab, poloha, natočení) | vzorky platí, stíny mohou ležet jinde: použít a ve vývojářském přehledu upozornit |

Běh otisky počítat nemusí. Levnější zkouška při načtení: součet `brushes[].počet` = počet vrcholů, které si běh sám vyrobil; otisky hlídá nástroj a validátor.

### 5. Co stíní a co s dveřmi (znění 2, podle D-035)

- **Stíní** viditelné neprůhledné kvádry a klíny levelu (`vis` není `false`, materiál bez `opacity` pod 1 a bez `alphaTest`) a **kolizní tvary prefabů** v klidové poloze (`colliders`; tvar z `partCollider` ze základu, N-101). Viditelné díly bez kolize nestíní. Dřív stínily díly (`parts`); zadání vlny 2 chce kolize.
- **Křídla dveří v portálech přímé světlo nestíní.** Křídlo = kolize na uzlu, který má nad sebou kloub, u entity z `portal.door` a u každých dalších dveří se stejným počátkem (druhé křídlo dvoukřídlých dveří). Zárubeň (kolize na nepohyblivém uzlu) stíní dál.
- **Brána.** Vede-li volná úsečka z počátku paprsku vzorku ke světlu otvorem portálu, který má dveře (průsečík s rovinou `quad` uvnitř jeho obrysu), patří světlo do úseku s bránou těch dveří. Pravidlo je stejné jako za běhu u sešny A (`src/world/occlusion.js`); společná funkce má přejít do základu. Po otevření dveří tak světlo z vedlejší místnosti přibude.
- **Odraz a přístupnost okolního světla** se počítají se zavřenými dveřmi: zdrojem odrazu je jen část vrstev bez brány a křídla v nich stíní. Zavřenými dveřmi tedy neprosvítá ani odraz. Otevřené dveře přidají jen přímé světlo (zjednodušení verze 1).
- **Nestíní:** volná tělesa (`physics.body: "dynamic"`, hráč je odnese), kolize skupiny `trigger`, a nic v posledních 0,3 m před světlem (světlo sedí ve svítidle nebo těsně pod stropem). Sklo se zvlášť neřeší: kolize nemá materiál. Až bude okno v levelech (B2.2), bude jeho tabule stínit jako plná; řešení patří k `opacity` (N-005).
- Kolize tvaru `hull` a `mesh` `partCollider` neumí a nestíní; nástroj jejich počet vypíše. Sada `kit_base` ani zlatý vzorek žádnou nemají.
- Vzorek, jehož počátek paprsku (2 cm nad plochou, 1 cm ke středu plochy) leží uvnitř tělesa, dostane průměr platných sousedů na téže ploše, v části bez brány i v každém úseku. Bez toho by každá zeď měla u paty tmavý pruh široký jednu buňku mřížky. Vzorky bez platného souseda (plocha schovaná celá) mají 0.

### 5a. Okraj stínu po podílech (D-037 ukládá xBake víc paprsků na vzorek)

Vzorek, jehož soused na téže ploše vidí světlo jinak (svítí × stín × jiná brána), se neptá jedním paprskem, ale 4 × 4 paprsky z bodů rozložených po své plošce (půl kroku mřížky na každou stranu, oříznuto okrajem plochy). Svítí podílem plošky, který světlo vidí; podíly se sčítají zvlášť pro každou bránu. Dílčí bod, ke kterému od vzorku nevede volná úsečka, se nepočítá. Mřížka vzorků ani formát se nemění. Stejný postup má za běhu sešna A (`lightfield.soften`).

Změřeno na xLabu (sandbox, mřížka znění 2): 1 964 zjemněných dvojic vzorek × světlo, stínových paprsků 134 283 místo 56 559. Proti jemnému výpočtu (12 × 12 paprsků) je součet odchylek na okraji stínu 47,4 místo 356,6 při jednom paprsku (2 033 dvojic). Stín užší než buňka mřížky, který nezasáhne žádný vrchol, se nezjemní a zůstane neviditelný; je to mez světla po vrcholech.

### 6. Změřeno (sandbox, Node 22, 2 jádra; časy orientační)

Znění 2 (brány, stínění kolizemi, okraj stínu 4 × 4) nad mřížkou světla znění 2 (D-037, `levelLightMeshes`), 24. 11. 2026, `node tools/bake/cli.mjs`:

| Level | Vzorků | Z toho v tělese | Vrstev | Dveří | Úseků s bránou (položek) | Zjemněno | Čas | Soubor | Po gzip |
|---|---|---|---|---|---|---|---|---|---|
| xLab (zlatý vzorek) | 20 509 | 490 (2 %) | 16 | 2 | 13 (584) | 1 964 | 1,0 s | 476 kB | 315 kB |
| `catacombs_3` | 33 606 | 7 038 (21 %) | 64 | 6 | 31 (1 393) | 3 613 | 2,6 s | 789 kB | 555 kB |
| `complex_21` | 61 075 | 12 383 (20 %) | 114 | 41 | 307 (11 784) | 8 162 | 6,1 s | 1 671 kB | 1 061 kB |
| `complex_7` | 65 618 | 19 051 (29 %) | 118 | 47 | 320 (13 244) | 10 059 | 7,3 s | 1 779 kB | 1 151 kB |

Totéž nad starou mřížkou (před D-037): xLab 20 658 vzorků, 464 kB; `catacombs_3` 38 098, 757 kB; `complex_21` 64 393, 1 559 kB; `complex_7` 73 092, 1 673 kB. Úseky s bránou přidaly 3 až 10 % velikosti souboru (`complex_7` na staré mřížce: 1 673 kB proti 1 547 kB bez bran a s jedním paprskem na vzorek). Kód xBake počet, pořadí ani rozteč vzorků nikde nepředpokládá; převod na novou mřížku byla výměna jedné funkce.

Znění 1 (22. 11. 2026, dveře stínily, stínily díly, jeden paprsek na vzorek): xLab 20 658 vzorků, 1,1 s, 452 kB; `catacombs_3` 2,8 s, 731 kB; `complex_21` 5,7 s, 1 420 kB; `complex_7` 8,7 s, 1 535 kB.

64 paprsků polokoulí na vzorek pro odraz a přístupnost. V prohlížeči (náhled `dist/xbake.html`) trvá zapečení xLabu stejným kódem zhruba stejně. Bez zastínění se vrstva shoduje s `lightIrradiance` přesně (uložení jako `Float32`, poměrná odchylka nejvýš 5,9e-8).

Na staré mřížce ležela třetina až polovina vzorků generovaných levelů na plochách schovaných v tělese. Základ od D-037 plochy schované celé nevyrábí; v tělese zůstává pětina až třetina vzorků (plochy schované jen zčásti) a doplnění od sousedů je dál potřeba. Otisk `geometry` nese od téže chvíle znění mřížky (`grid: 2` i v hlavičce) a počty vzorků po kvádrech.

### 7. Zrnění odrazu

Plocha půl metru od světla má osvětlení o dva řády vyšší než zbytek místnosti a paprsky polokoulí ji trefí jen občas. První verze (32 paprsků, bez úprav) dala v obraze světlé skvrny po celé místnosti. Teď: 64 paprsků, jas zdrojové plochy odrazu omezený na osminásobek průměrného osvětlení a dvojí vyhlazení nepřímé vrstvy přes sousedy na téže ploše (přes hranu nepřeteče). Omezení ubírá odrazu energii; o kolik, jsem neměřila.

### 8. Co jsem nezvolila

- Světlo v textuře (`method: "lightmap"`): rozhodnuto D-022 podle měření T460.
- Poloviční přesnost (`Float16`): zmenší soubor na polovinu; odkládám, dokud velikost nevadí.
- Odraz zvlášť pro každé světlo: lampa by při zhasnutí zhasla i svůj odraz, ale vrstvy by přestaly být řídké. Ve verzi 1 odráží jen základní světla levelu, která se nepřepínají.

## Dopad

- Základ: čtení souboru je od znění 2 v `tools/bake/read.mjs` bez Node a bez knihoven (`decodeBake` nad `ArrayBuffer`, `Uint8Array` i `Buffer`, `gateLevel`, `composeColors`); soubor jde do `src/xspace` přenést tak, jak je. Zápis a otisky zůstávají v `tools/bake/format.mjs`. Validátor: soubor z `baked.file` musí být v `assets`.
- Sešna A: při načtení levelu použít vrstvy ze souboru místo vlastního výpočtu, podle pravidel v oddílu 4; vrstva `ao` násobí okolní člen; úsek s bránou se násobí otevřením jeho dveří stejně jako její dnešní brány.
- Otisk `scene` nově zahrnuje dveře portálů (`id`, `door`, `quad`): změna dveří portálu posune brány.
- Formát levelu se nemění (`baked` už existuje). Zlatý vzorek se nemění, dokud svodná sešna nerozhodne, že má zapečené světlo nést.

## Dočasné řešení

xBake zapisuje do `dist/bake/<balík>/` (necommituje se) a do balíků pole `baked` nepíše. Výpočet a formát hlídá `test/b_t5_bake.mjs` (26 kontrol: shoda se základem, stín sloupu, brány proti levelu bez dveří, okraj stínu proti jemnému výpočtu, zápis a čtení).

## Neověřeno

- Obraz je jen ze softwarového vykreslování v sandboxu (montáž `test/out/b_bake_montaz.png`, náhled `dist/xbake.html`). Na skutečné grafické kartě to neviděl nikdo.
- Ostrost stínů. Vzorky jsou po 0,5 m, takže stín sloupu je rozmazaný; od znění 2 má okraj mezistupně místo zubů (oddíl 5a). Na stropě haly dělá stín sloupu od blízké lampy dál tmavou skvrnu s rovnými okraji. Jemnější buňka mřížky by pomohla, ale je součást kontraktu.
- Brány v běhu. Úseky s bránou četl jen můj náhled a test; engine soubor zatím nečte. Že pravidlo průchodu otvorem dává stejné brány jako `occlusion.js` sešny A, jsem neporovnávala na datech (její kód v této větvi není), jen čtením.
- Stín otevřeného křídla. Křídlo dveří v portálu nestíní zavřené ani otevřené; stín křídla v otevřené poloze neexistuje.
- Síla odrazu. V hale xLabu vychází na místech ve stínu sloupu přímé světlo 2,42 (bez zastínění 4,32), s odrazem 4,49: odraz stín z velké části zaplní a bílá laboratoř je s ním v obraze vybledlá. xLab je podle N-105 přesvícený a expozice je laděná na obraz bez odrazu; proto má odraz váhu (dnes 0,5).
- Bajtová shoda mezi stroji. Na jednom stroji je výstup opakovatelný; `Math.cos` a `Math.sqrt` se mezi verzemi V8 mohou lišit v posledním bitu.
- Použití v běhu a čas načtení na T460.

## Rozhodnutí

(vyplní svodná sešna)
