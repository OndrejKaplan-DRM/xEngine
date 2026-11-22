# Stav sešny A

**Vlna:** 1 · **Větev:** `sesna-a` (ze `zaklad-1`, `a2ce175`) · **Datum:** 22. 11. 2026

## Navázání A02 (22. 11. 2026, 21:10): nic nestavěno

- `origin/zaklad-1` = `origin/main` = `a2ce175` (`git ls-remote`, 21:03). Znění 2 základu na GitHubu není; `docs/00_ZADANI.md` neexistuje v žádné větvi a `START_A.md` nemá oddíl 2a. Podle zadání A02 jsem proto nic nestavěla, jen zapsala tento oddíl.
- Čistý klon `sesna-a` (`7d3bec6`): `npm test` 165 kontrol, `npm run test:a` 16 sad z 16, vše zeleně. `dist/xlab.html` z čistého klonu má stejný otisk jako soubor `xLab_vlna1_2026-11-22.html`, který má Ondřej (SHA-256 `fb95f9a5bdf6…`).
- Předávku sešny A01 nemám (v projektu, kde běží A02, ji hledání v konverzacích nenašlo); vycházím z tohoto dokumentu a z kódu.

### Ondřejovy odpovědi na otázky A01

| # | Otázka | Volba | Důsledek |
|---|---|---|---|
| 1 | ventil | a | beze změny |
| 2 | světlo a zavřené dveře | a | beze změny |
| 3 | skok v profilu `arena` | **b** | změna: každý výskok na nový stisk (`jumpHold` v `src/play/profiles.js`); robot v T2 (`a_13_player`) musí mačkat znovu. **Neuděláno.** |
| 4 | lékárnička | a | beze změny |
| 5 | scissor | a | čekat na měření; měření přišlo, viz výklad níže |

### Měření T460: xBench 0.2, 22. 11. 2026, 20:57

Stroj: Intel HD Graphics 520 (ANGLE, Direct3D 11), Chrome 157, 4 vlákna, 8 GB, displej 1536 × 864 při zvětšení 1,25 (= 1920 × 1080 bodů), WebGL 2 ano, WebGPU ano, textury S3TC a BPTC ano, ETC2 a ASTC ne, největší textura 16 384 px. **Jeden běh.** Metoda: vykreslení a `readPixels` jednoho bodu (čeká na grafiku), 2,5 s na případ, medián a 95. percentil; obraz mimo displej v uvedené velikosti.

| Případ | Volání | △ (tis.) | Světla | Obraz | Materiál a příznaky | Medián (ms) | 95 % (ms) |
|---|---|---|---|---|---|---|---|
| `zaklad` | 101 | 102 | 0 | 1366 × 768 | Lambert | 1,91 | 2,65 |
| `volani_200` | 201 | 97 | 0 | 1366 × 768 | Lambert | 1,91 | 3,88 |
| `volani_400` | 401 | 102 | 0 | 1366 × 768 | Lambert | 2,76 | 3,63 |
| `volani_800` | 801 | 106 | 0 | 1366 × 768 | Lambert | 4,63 | 6,95 |
| `tris_300` | 201 | 296 | 0 | 1366 × 768 | Lambert | 3,83 | 6,30 |
| `tris_600` | 201 | 594 | 0 | 1366 × 768 | Lambert | 6,13 | 9,20 |
| `tris_1200` | 201 | 1201 | 0 | 1366 × 768 | Lambert | 14,50 | 15,50 |
| `svetla_4` | 201 | 205 | 4 | 1366 × 768 | Lambert | 6,80 | 10,50 |
| `svetla_8` | 201 | 205 | 8 | 1366 × 768 | Lambert | 12,05 | 14,20 |
| `svetla_16` | 201 | 205 | 16 | 1366 × 768 | Lambert | 23,10 | 24,90 |
| `pbr_8` | 201 | 205 | 8 | 1366 × 768 | fyzikální | 22,50 | 23,90 |
| `zapecene` | 201 | 205 | 0 | 1366 × 768 | bez světel (basic) | 2,00 | 3,70 |
| `stin_2048` | 201 | 205 | 4 | 1366 × 768 | Lambert, stín 2048 | 24,60 | 28,30 |
| `meritko_75` | 201 | 205 | 8 | 1025 × 576 | Lambert | 10,35 | 14,90 |
| `meritko_50` | 201 | 205 | 8 | 683 × 384 | Lambert | 5,50 | 8,90 |
| `fhd_8` | 201 | 205 | 8 | 1920 × 1080 | Lambert | 22,70 | 24,60 |
| `svetla_0` | 201 | 205 | 0 | 1366 × 768 | Lambert | 2,38 | 4,59 |
| `svetla_1` | 201 | 205 | 1 | 1366 × 768 | Lambert | 4,52 | 7,05 |
| `svetla_2` | 201 | 205 | 2 | 1366 × 768 | Lambert | 6,60 | 9,40 |
| `vrcholy` | 201 | 205 | 0 | 1366 × 768 | bez světel (basic), barva vrcholů | 2,06 | 4,44 |
| `vrcholy_fhd` | 201 | 205 | 0 | 1920 × 1080 | bez světel (basic), barva vrcholů | 3,45 | 6,63 |
| `interier` | 202 | 207 | 0 | 1366 × 768 | bez světel (basic), barva vrcholů, interiér | 2,41 | 4,18 |
| `interier_576` | 202 | 207 | 0 | 1025 × 576 | bez světel (basic), barva vrcholů, interiér | 2,05 | 4,18 |
| `interier_fhd` | 202 | 207 | 0 | 1920 × 1080 | bez světel (basic), barva vrcholů, interiér | 3,80 | 4,40 |
| `interier_tex` | 202 | 207 | 0 | 1366 × 768 | bez světel (basic), barva vrcholů, interiér, textura | 2,98 | 6,27 |
| `interier_aa` | 202 | 207 | 0 | 1366 × 768 | bez světel (basic), barva vrcholů, interiér, vyhlazování | 6,80 | 7,80 |
| `interier_1` | 202 | 207 | 1 | 1366 × 768 | Lambert, barva vrcholů, interiér | 4,65 | 5,00 |
| `interier_4` | 202 | 207 | 4 | 1366 × 768 | Lambert, interiér | 9,85 | 11,15 |

Verdikt nástroje: rozpočet vykreslení 10 ms ze 16,6 ms; vejde se 801 volání a 594 tis. △.

### Co z měření čtu pro běh (výklad, ne měření)

1. **Volání a trojúhelníky nejsou úzké hrdlo.** 801 volání 4,6 ms (asi 4,5 µs na volání), 594 tis. △ 6,1 ms. xLab má 9 až 57 volání; levely sešny B měly v kouřové zkoušce nejvýš 72 volání a celý level má nejvýš 88 tis. △. Buňky a portály (A1.7) tedy na T460 nešetří volání, ale světla: méně viditelných buněk = méně světel po pixelech.
2. **Úzké hrdlo je světlo počítané po pixelech.** Interiér přes celý obraz při 1366 × 768: bez světel 2,4 ms, jedno světlo 4,7 ms, čtyři 9,9 ms. Stín 2 048 px +17,8 ms, fyzikální materiál s 8 světly 22,5 ms, vyhlazování hran +4,4 ms, textura +0,6 ms, 1920 × 1080 s barvou vrcholů 3,8 ms.
3. **xLab z vlny 1 je na T460 ve výchozím nastavení nejspíš pod 60 snímky/s.** Kreslí v rozlišení okna × 1,25 (na celé obrazovce 1920 × 1080), s vyhlazováním hran (`antialias` zapnutý, vypíná jen `?aa=0`) a s rozpočtem 8 světel po pixelech (`MeshLambertMaterial`). Nejbližší změřený případ `fhd_8` má 22,7 ms, a to bez vyhlazování a bez plného pokrytí obrazu. **Neověřeno:** čísla z F3 na T460 nemám.
4. Komentář v `src/render/materials.js` („Lambert, levný na integrované grafice“) měření vyvrací; three 0.187 počítá Lambert po pixelech.
5. **Scissor (otázka 5):** xBench neměří překreslování, takže přímo nerozhoduje. Nepřímo: bod navíc stojí při barvě vrcholů asi 1,4 ms na milion bodů, ořez by ušetřil zlomky ms. Doporučení: do vlny 2 nedávat; vrátit se k němu, jen když F3 na T460 po zapečeném světle ukáže problém s body.
6. **Spolehlivost.** Jeden běh, případy za sebou bez přestávky. Nesrovnalosti: 2 světla 6,6 ms × 4 světla 6,8 ms (měřeno v různých částech běhu); měřítko 75 % s 8 světly 10,35 ms, kde úměra k počtu bodů (z případů `svetla_8` a `fhd_8`) dává asi 7,3 ms; `B_STAV.md` uvádí z xBench 0.1 „4 světla 14,0 ms“, teď 6,8 ms (metoda měření je v 0.1 i 0.2 stejná; výsledek 0.1 nemám). Závěrům o násobcích věřím, rozdílům pod asi 2 ms ne. Druhý běh by ukázal rozptyl.

### Co čeká

| Co | Na kom |
|---|---|
| push znění 2 základu do `zaklad-1`; potom `git merge origin/zaklad-1`, `CLAUDE.md`, `docs/00_ZADANI.md`, `START_A.md` oddíl 2a | Ondřej + svodná |
| skok 3b | A, nezávisí na základu |
| výchozí nastavení pro T460 (vyhlazování vypnuté, rozpočet světel 0, 1, 2, 4 místo 4, 6, 8, 12, strop rozlišení) | A, nezávisí na základu; čeká na Ondřejovo slovo, protože zadání vlny 2 neznám |
| čísla z F3 v xLabu na T460 (start se zavřenými dveřmi, chodba s rozsvícenými lampami) | Ondřej |

## Hotovo × neuděláno

| Úkol | Stav | Test | Poznámka |
|---|---|---|---|
| A1.1 kostra aplikace | hotovo | `a_00_build` 3, `a_11_app` 21 (Node), `a_11_shell` 19 (prohlížeč) | cíl `xlab`, Shell přes adaptér, zámek kurzoru, `__xe` |
| A1.2 statický svět | hotovo | `a_12_world` 9 (Node), `a_12_view` 8 (prohlížeč) | 54 koliderů z 54 kvádrů, 17 dávek (buňka × materiál), snímek ze startu shodný s xView |
| A1.3 hráč a profily | hotovo | `a_13_player` 38 (Node), `a_13_walk` 7 (prohlížeč) | T1–T4 v obou profilech, schodiště na galerii, přepnutí profilu za běhu |
| A1.4 entity a kostry | hotovo | `a_14_entities` 20 (Node), `a_14_view` 7 (prohlížeč) | 20 entit, bedny padají, křídlo dveří při 90° = `rigMatrices`, tři pohledy shodné s xView |
| A1.5 použít + spojení | hotovo | `a_15_io` 18 (Node), `a_15_use` 11 (prohlížeč) | tlačítko → dveře → po 36 krocích lampa; vypínač; spouštěč jednou; uložení uprostřed otevírání; strop řetězu 32 |
| A1.6 manipulace a klidný režim | hotovo | `a_16_manip` 39 (Node), `a_16_view` 20 (prohlížeč) | ventil myší na 50 % → lampa 50 %; páka na dorazu vyšle `on`; zásuvka a křídlo dveří tažením; terminál: kamera podle `station`, psaní, kurzor na obrazovce, Esc vrací přesně |
| A1.7 buňky a portály | hotovo | `a_17_cells` 19 (Node), `a_17_view` 16 (prohlížeč) | start se zavřenými dveřmi 1 buňka (9 volání), po otevření přibude chodba (29), hala nezávisí na laboratoři; žádná díra ze 48 pohledů × 2 stavy dveří; F4 obrysy. **Neuděláno:** ořez pixelů (scissor) na obdélník portálu, viz níže |
| A1.8 světla a obraz | hotovo | `a_18_view` 12 (prohlížeč) | aktivních světel nejvýš tolik, kolik říká nastavení (4, 6, 8, 12 ze 14); expozice z dat; měřítko vykreslení; přehled F3; čtyři pohledy bez černých ploch |

Poslední celý běh (22. 11. 2026, po posledním commitu): základ `npm test` 165 kontrol, skupina A `npm run test:a` 16 sad z 16, 267 kontrol, vše zeleně.

## Jak je to postavené

- `src/app/game.js` skládá jádro a systémy a **nezná DOM**. Tentýž kód běží ve hře (`src/app/main.js`, vykreslení three.js) i v testech v Node (`src/render/null.js`, vykreslení bez obrazu). Fyzika, hráč, kostry a spojení se proto testují v Node za zlomek sekundy; prohlížeč zůstává na obraz a Shell.
- `src/app/main.js` přidává plátno, Shell (`vendor/shell` přes adaptér), zámek kurzoru (`lock.js`), HUD a háček `__xe` (`hook.js`).
- Styl Shellu se nekopíruje: `import css from '../../vendor/shell/shell.css' with { type: 'text' }` (esbuild 0.28.2 to umí bez úpravy `build.mjs`).
- Nastavení (`src/app/settings.js`): zorné pole, měřítko vykreslení, počet světel za běhu, citlivost myši, profil pohybu (jen s `?dev`, neukládá se).
- Akce a klávesy jsou data (`src/play/actions.js`): pohyb šipkami i WASD, skok mezerník a pravé tlačítko, použít E a Enter, uchopit levé tlačítko.
- **Manipulace** (`src/play/interact.js`): úchop je bod, kam dopadl paprsek pohledu. Engine spočítá, kudy se ten bod na obrazovce hýbe na jednotku kloubu, a posun myši promítne do tohoto směru. Úchop tedy sleduje myš: páka nahoru a dolů, ventil za obvod po kružnici, ventil za střed prostým pohybem do strany. Díl, který se hýbe hlavně k hráči a od něj (zásuvka, křídlo dveří zepředu), se ovládá pohybem myši k sobě a od sebe, dvakrát rychleji. Pohled se při tažení neotáčí. Doraz na mez se hlásí hned, i když hráč díl ještě drží.
- **Klidný režim**: po „použít“ u prefabu se `station` kamera za 0,4 s přejede na `eye`, míří na `look`, zorné pole podle dat; tělo stojí. Zámek kurzoru se uvolní, kurzor se promítá na plochu obrazovky (průsečík paprsku s rovinou uzlu). Klávesnice jde na obrazovku: Enter vyšle výstup `command` s napsaným textem, kliknutí na obrazovku `command` s textem `click`, vstup `print` vypíše řádek. Esc vrací do hry (nepauzuje) a vyšle `left`. Obsah obrazovky je text na 2D plátně mapovaném na plochu ve světě (`src/play/terminal.js`, `render.addScreen`).
- **Viditelnost** (`src/world/visibility.js`, systém `vis`): před každým vykreslením (háček `render.beforeDraw`) se z buňky kamery projdou portály. Každý portál zúží výhled na obdélník, který zabírá na obrazovce; portál mimo ten obdélník se dál neprochází. Dveře v klidové poloze portál zavírají. Oko blíž než 0,3 m k otvoru ho nezužuje (průchod dveřmi bez probliknutí). Vypnout jde adresou `?novis` nebo `__xe.vis(false)`.
- **Stěna má dvě strany** (`src/world/cells.js`): zeď patří v datech jedné buňce, ale vidět je ze dvou místností. Viditelná geometrie se proto řadí po plochách: plocha kvádru jde do dávky buňky, do které míří. Plocha, která nemíří do žádné buňky (ostění, práh), jde do všech buněk, kterých se kvádr dotýká. Dveře v portálu: pevné díly (zárubeň) jsou v dávkách obou buněk, pohyblivé (křídlo) se kreslí, když je vidět aspoň jedna z nich.
- **Světla**: svítí jen světlo, které otevřenými portály dosáhne (koulí dosahu) do některé viditelné buňky. Pravidlo nezávisí na směru pohledu, takže se osvětlení při otáčení nemění; mění se při otevření a zavření dveří. Z kandidátů se bere N nejvýznamnějších (svítivost / vzdálenost² od kamery), N z nastavení.
- **Vývojářské vrstvy** (`src/app/dev.js`): F3 přehled (snímky, čas snímku a kroku, krok po systémech, volání, △, kreslené buňky, aktivní světla, buňka kamery, rychlost, poloha), F4 obrysy buněk a portálů (buňka kamery žlutě, viditelná zeleně, schovaná šedě; portál viděný azurově, otevřený mimo výhled modře, zavřený červeně). Fungují i bez `?dev`.
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

## Zkouška balíku sešny B (`origin/sesna-b`, `packs/gen_demo` + `kit_base`)

Balík jsem si vytáhla do `/tmp` (do své větve jsem ho nedávala) a pustila v enginu beze změny kódu. Je to kouřová zkouška, ne průchod levelem.

| Level | Data | Výsledek v Node | Výsledek v prohlížeči |
|---|---|---|---|
| `complex_7` | 45 buněk, 49 portálů, 498 kvádrů, 423 entit, 124 světel | načtení 582 ms, hráč stojí na zemi, ze startu 1 až 2 buňky, nejvýš 72 volání z 984 sítí, chůze 3 s = 10,7 m, 226 předmětů použito, krok 0,47 ms | nezkoušeno |
| `complex_21` | 39 buněk, 44 portálů, 412 kvádrů, 392 entit, 123 světel | načtení 286 ms, 1 až 2 buňky, nejvýš 68 volání z 943 sítí, chůze 13,5 m, krok 0,42 ms | 15 až 42 volání z 12 směrů (z 1 222 sítí), žádný bod pozadí, konzole čistá |
| `catacombs_3` | 33 buněk, 35 portálů, 341 kvádrů, 132 entit, 71 světel | načtení 157 ms, 2 až 3 buňky, nejvýš 38 volání z 322 sítí, chůze 5,5 m, krok 0,16 ms | 10 až 30 volání (ze 413 sítí), žádný bod pozadí, konzole čistá |

Časy jsou ze sandboxu, orientační. Zkouška našla dvě moje chyby, obě opravené: výběr světel bral jen prvních 64 světel levelu (pole pevné délky) a `open` na už otevřené dveře znovu hlásilo `opened` (dvě křídla spojená do kruhu by se budila donekonečna).

Co je na snímcích vidět a neřešila jsem: **čárkované svislé čáry na stěnách v místech, kde na sebe navazují kvádry zdi** (i ve zlatém vzorku nad dveřmi laboratoře). Pozadí to není (zkouška signální barvou dává 0 bodů). Domněnka, neověřená: prosvítají boční plochy kvádrů, které leží uvnitř zdi. Náprava by byla takové zakryté plochy nekreslit.

## Neověřeno

- Zámek kurzoru ve skutečném prohlížeči. Headless prohlížeč ho neumí bezpečně (teče paměť), takže protokol je ověřený jen nad maketou dokumentu v Node (`a_11_app`): získání, ztráta → pauza, odmítnutí po Esc → „klikni znovu“, prostředí bez zámku → pohled tažením myši.
- **Výkon na T460.** Všechna čísla výše jsou ze sandboxu se softwarovým vykreslením. Počty volání a trojúhelníků platí všude, časy ne. Hra zatím nemá v sobě měření pro `xBench`; rozpočet kroku 2 ms plní v sandboxu s rezervou (0,08 až 0,2 ms), o T460 to neříká nic.
- **Ořez pixelů na obdélník portálu (scissor) není.** Obdélník portálu se používá k rozhodnutí, které buňky a portály jsou vidět; samotné kreslení buňky za portálem se jím neořezává. Přínos (méně překreslených bodů na HD 520) jde změřit jen na skutečné grafice a ořez nese riziko uříznutých dílů, které do buňky přesahují. Nechávám na vlnu 2 po prvním měření.
- **Škvíry kolem zavřených dveří.** Zlatý vzorek je těsný (zkouška paprsky). Level z generátoru, kde křídlo nezakryje celý portál, by škvírou ukázal pozadí; viz N-107.
- **Probliknutí světel při změně pořadí.** Když je kandidátů víc než rozpočet, vybírá se podle vzdálenosti od kamery; při chůzi se pořadí mění a slabší světlo může zhasnout skokem. V xLabu s rozpočtem 8 a 14 světly to nastává v chodbě; okem jsem to neposuzovala.
- Návrat zámku kurzoru po odchodu od terminálu. Hra o něj požádá hned (zámek uvolnila sama, ne hráč klávesou Esc, takže by ho prohlížeč měl vrátit bez čekání); když odmítne, vrátí ho první kliknutí do obrazu. Ověřit jde jen ve skutečném prohlížeči.
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
| N-105 | zlatý vzorek xLab je přesvícený (data) | žádné, data nejsou moje |
| N-106 | kde leží plocha obrazovky (`components.screen`) a co znamená `app` | plocha 1 mm před nejpřednějším dílem uzlu, každá `app` je textová konzole |
| N-107 | dveře u portálu musí v klidu zakrýt celý otvor (pravidlo validátoru) | žádné; zlatý vzorek hlídá `a_17_cells` |

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

## Otázky pro Ondřeje

1. **Ventil.** a) nechat: za obvod kola po kružnici, za střed pohybem do strany; b) vždy jen pohyb do strany (jednodušší, méně „v ruce“).
2. **Světlo a zavřené dveře.** a) nechat: zavřenými dveřmi světlo neprochází (start se zhasnutou lampou má jas 75 místo 86, rozdíl je malý); b) vrátit prosvítání skrz zdi jako v xView, dokud nebude zapečené světlo.
3. **Skok v profilu `arena`.** a) nechat držení mezerníku = série výskoků; b) každý výskok na nový stisk.
4. **Lékárnička a další předměty.** a) sbírat klávesou „použít“ (teď); b) dotykem jako v Half-Life.
5. **Ořez na obdélník portálu při kreslení (scissor).** a) počkat na měření na T460 a rozhodnout podle něj; b) udělat hned ve vlně 2 bez měření.
