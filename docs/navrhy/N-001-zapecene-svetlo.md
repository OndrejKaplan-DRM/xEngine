# N-001: soubor se zapečeným světlem po vrcholech a po vrstvách

Sešna: B · Datum: 2026-11-22 · Stav: otevřený

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

Hlavička: `format: "xspace-light"`, `version: 1`, `level`, `method: "vertex"`, `cell` (buňka mřížky), `samples` (počet vzorků), `brushes: [[id, počet vzorků], …]` v pořadí levelu, `geometry`, `scene` (otisky), `layers: [{ id, kind, ref, channels, encoding, count, offset, nonzero, light? }]`.

Vzorek číslo `s` = vrchol `v` kvádru `i`, kde `s = Σ počtů předchozích kvádrů + v`. Pořadí vrcholů uvnitř kvádru je pořadí `brushLightMesh`.

Kódování vrstvy: `dense` = `Float32[samples × channels]`; `sparse` = `Uint32[count]` indexy vzorků vzestupně a za nimi `Float32[count × channels]`, ostatní vzorky mají 0. xBake volí to menší.

### 3. Vrstvy

| `kind` | `id` | Kanály | Co obsahuje |
|---|---|---|---|
| `light` | `light:<id světla>` | 1 | E vzorků od jednoho světla z pole `lights` při plné úrovni, se zastíněním |
| `entity` | `entity:<id entity>` | 1 | totéž pro bodové světlo prefabu, jehož uzel nemá nad sebou kloub (nemůže se pohnout) |
| `indirect` | `indirect` | 3 | jeden odraz základních světel levelu při plné úrovni; už vynásobeno barvou světel a barvou plochy, od které se světlo odrazilo. Hlavička vrstvy nese `weight`, doporučenou váhu za běhu |
| `ao` | `ao` | 1 | přístupnost okolního světla 0 až 1 (kout a pata zdi mají méně) |

Barva vzorku za běhu: `okolní světlo × ao + Σ úroveň × barva světla × E + indirect × k`. Barvou materiálu se násobí až potom, jako dnes. `k` je váha odrazu z hlavičky vrstvy (`weight`). xBake píše 0,5: Ondřej 22. 11. 2026 po zhlédnutí náhledu zvolil slabší odraz. Data vrstvy jsou spočtená plně, váhu jde změnit bez nového zapečení.

Světlo s `dynamic: true` a světlo prefabu na pohyblivém uzlu vrstvu nemají; počítá je běh.

### 4. Otisky a co s nimi běh udělá

| Otisk | Z čeho | Když nesedí |
|---|---|---|
| `geometry` | tvar, `min`, `max` a `rise` všech kvádrů v pořadí levelu + buňka mřížky | vzorky neodpovídají: soubor zahodit celý a počítat při načtení |
| `layers[].light` | druh, poloha, směr, svítivost, dosah a úhel světla (barva ne) | přepočítat jen tuhle vrstvu |
| `scene` | entity (id, prefab, poloha, natočení) | vzorky platí, stíny mohou ležet jinde: použít a ve vývojářském přehledu upozornit |

Běh otisky počítat nemusí. Levnější zkouška při načtení: součet `brushes[].počet` = počet vrcholů, které si běh sám vyrobil; otisky hlídá nástroj a validátor.

### 5. Co stíní (a co s dveřmi)

- Kvádry a klíny levelu a díly prefabů **v klidové poloze**, včetně křídel dveří. Zavřené dveře tedy světlo nepustí; když se otevřou, světlo z vedlejší místnosti dovnitř nepřibude. Je to zjednodušení verze 1. Opačná volba (dveře nestíní, jako ve hrách na enginu Half-Life) dá světlou skvrnu za zavřenými dveřmi, a dveře jsou většinu času zavřené.
- Nestíní: volná tělesa (`physics.body: "dynamic"`, hráč je odnese), sklo (materiály `glass…`, do rozhodnutí N-005), a nic v posledních 0,3 m před světlem (světlo sedí ve svítidle nebo těsně pod stropem).
- Vzorek, jehož počátek paprsku (2 cm nad plochou, 1 cm ke středu plochy) leží uvnitř tělesa, dostane průměr platných sousedů na téže ploše. Bez toho by každá zeď měla u paty tmavý pruh široký jednu buňku mřížky. Vzorky bez platného souseda (plocha schovaná celá) mají 0.

### 6. Změřeno (sandbox, Node 22, 2 jádra; časy orientační)

| Level | Vzorků | Z toho v tělese | Vrstev | Čas | Soubor | Po gzip |
|---|---|---|---|---|---|---|
| xLab (zlatý vzorek) | 20 658 | 1 381 (7 %) | 16 | 1,1 s | 452 kB | 317 kB |
| `catacombs_3` | 38 098 | 14 164 (37 %) | 64 | 2,8 s | 731 kB | 496 kB |
| `complex_21` | 64 393 | 23 039 (36 %) | 114 | 5,7 s | 1 420 kB | 851 kB |
| `complex_7` | 73 092 | 32 581 (45 %) | 118 | 8,7 s | 1 535 kB | 931 kB |

64 paprsků polokoulí na vzorek pro odraz a přístupnost. V prohlížeči (náhled `dist/xbake.html`) trvá zapečení xLabu stejným kódem zhruba stejně. Bez zastínění se vrstva shoduje s `lightIrradiance` přesně (uložení jako `Float32`, poměrná odchylka nejvýš 5,9e-8).

Třetina až polovina vzorků generovaných levelů leží na plochách schovaných v tělese (spodek podlahy, čela a temena zdí). Formát je ukládá jako nuly v řídkých vrstvách; běh pro ně ale dál drží vrcholy. To je námět pro základ (nevyrábět síť pro plochy, které leží celé v jiném kvádru), ne součást tohoto návrhu.

### 7. Zrnění odrazu

Plocha půl metru od světla má osvětlení o dva řády vyšší než zbytek místnosti a paprsky polokoulí ji trefí jen občas. První verze (32 paprsků, bez úprav) dala v obraze světlé skvrny po celé místnosti. Teď: 64 paprsků, jas zdrojové plochy odrazu omezený na osminásobek průměrného osvětlení a dvojí vyhlazení nepřímé vrstvy přes sousedy na téže ploše (přes hranu nepřeteče). Omezení ubírá odrazu energii; o kolik, jsem neměřila.

### 8. Co jsem nezvolila

- Světlo v textuře (`method: "lightmap"`): rozhodnuto D-022 podle měření T460.
- Poloviční přesnost (`Float16`): zmenší soubor na polovinu; odkládám, dokud velikost nevadí.
- Odraz zvlášť pro každé světlo: lampa by při zhasnutí zhasla i svůj odraz, ale vrstvy by přestaly být řídké. Ve verzi 1 odráží jen základní světla levelu, která se nepřepínají.

## Dopad

- Základ: funkce pro čtení souboru v prohlížeči (dnešní `decodeBake` v `tools/bake/format.mjs` čte `Buffer` v Node; má 25 řádků) patří do `src/xspace`, aby ji běh i nástroje měly z jednoho místa. Validátor: soubor z `baked.file` musí být v `assets`.
- Sešna A: při načtení levelu použít vrstvy ze souboru místo vlastního výpočtu, podle pravidel v oddílu 4; vrstva `ao` násobí okolní člen.
- Formát levelu se nemění (`baked` už existuje). Zlatý vzorek se nemění, dokud svodná sešna nerozhodne, že má zapečené světlo nést.

## Dočasné řešení

xBake zapisuje do `dist/bake/<balík>/` (necommituje se) a do balíků pole `baked` nepíše. Výpočet a formát hlídá `test/b_t5_bake.mjs`.

## Neověřeno

- Obraz je jen ze softwarového vykreslování v sandboxu (montáž `test/out/b_bake_montaz.png`, náhled `dist/xbake.html`). Na skutečné grafické kartě to neviděl nikdo.
- Ostrost stínů. Vzorky jsou po 0,5 m, takže stín sloupu má rozmazaný a nepravidelný okraj a na stropě haly dělá stín sloupu od blízké lampy hranatou tmavou skvrnu. Jemnější buňka mřížky by pomohla, ale je součást kontraktu.
- Síla odrazu. V hale xLabu vychází na místech ve stínu sloupu přímé světlo 2,42 (bez zastínění 4,32), s odrazem 4,49: odraz stín z velké části zaplní a bílá laboratoř je s ním v obraze vybledlá. xLab je podle N-105 přesvícený a expozice je laděná na obraz bez odrazu; proto má odraz váhu (dnes 0,5).
- Bajtová shoda mezi stroji. Na jednom stroji je výstup opakovatelný; `Math.cos` a `Math.sqrt` se mezi verzemi V8 mohou lišit v posledním bitu.
- Použití v běhu a čas načtení na T460.

## Rozhodnutí

(vyplní svodná sešna)
