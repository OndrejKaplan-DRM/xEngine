# Stav sešny A

**Vlna:** 1 · **Větev:** `sesna-a` (ze `zaklad-1`, `a2ce175`) · **Datum:** 22. 11. 2026

## Hotovo × neuděláno

| Úkol | Stav | Test | Poznámka |
|---|---|---|---|
| A1.1 kostra aplikace | hotovo | `a_00_build` 3, `a_11_app` 21 (Node), `a_11_shell` 19 (prohlížeč) | cíl `xlab`, Shell přes adaptér, zámek kurzoru, `__xe` |
| A1.2 statický svět | hotovo | `a_12_world` 9 (Node), `a_12_view` 8 (prohlížeč) | 54 koliderů z 54 kvádrů, 17 dávek (buňka × materiál), snímek ze startu shodný s xView |
| A1.3 hráč a profily | hotovo | `a_13_player` 38 (Node), `a_13_walk` 7 (prohlížeč) | T1–T4 v obou profilech, schodiště na galerii, přepnutí profilu za běhu |
| A1.4 entity a kostry | hotovo | `a_14_entities` 20 (Node), `a_14_view` 7 (prohlížeč) | 20 entit, bedny padají, křídlo dveří při 90° = `rigMatrices`, tři pohledy shodné s xView |
| A1.5 použít + spojení | hotovo | `a_15_io` 18 (Node), `a_15_use` 11 (prohlížeč) | tlačítko → dveře → po 36 krocích lampa; vypínač; spouštěč jednou; uložení uprostřed otevírání; strop řetězu 32 |
| A1.6 manipulace a klidný režim | hotovo | `a_16_manip` 38 (Node), `a_16_view` 20 (prohlížeč) | ventil myší na 50 % → lampa 50 %; páka na dorazu vyšle `on`; zásuvka a křídlo dveří tažením; terminál: kamera podle `station`, psaní, kurzor na obrazovce, Esc vrací přesně |
| A1.7 buňky a portály | — | | |
| A1.8 světla a obraz | — | | |

## Jak je to postavené

- `src/app/game.js` skládá jádro a systémy a **nezná DOM**. Tentýž kód běží ve hře (`src/app/main.js`, vykreslení three.js) i v testech v Node (`src/render/null.js`, vykreslení bez obrazu). Fyzika, hráč, kostry a spojení se proto testují v Node za zlomek sekundy; prohlížeč zůstává na obraz a Shell.
- `src/app/main.js` přidává plátno, Shell (`vendor/shell` přes adaptér), zámek kurzoru (`lock.js`), HUD a háček `__xe` (`hook.js`).
- Styl Shellu se nekopíruje: `import css from '../../vendor/shell/shell.css' with { type: 'text' }` (esbuild 0.28.2 to umí bez úpravy `build.mjs`).
- Nastavení (`src/app/settings.js`): zorné pole, měřítko vykreslení, počet světel za běhu, citlivost myši, profil pohybu (jen s `?dev`, neukládá se).
- Akce a klávesy jsou data (`src/play/actions.js`): pohyb šipkami i WASD, skok mezerník a pravé tlačítko, použít E a Enter, uchopit levé tlačítko.
- **Manipulace** (`src/play/interact.js`): úchop je bod, kam dopadl paprsek pohledu. Engine spočítá, kudy se ten bod na obrazovce hýbe na jednotku kloubu, a posun myši promítne do tohoto směru. Úchop tedy sleduje myš: páka nahoru a dolů, ventil za obvod po kružnici, ventil za střed prostým pohybem do strany. Díl, který se hýbe hlavně k hráči a od něj (zásuvka, křídlo dveří zepředu), se ovládá pohybem myši k sobě a od sebe, dvakrát rychleji. Pohled se při tažení neotáčí. Doraz na mez se hlásí hned, i když hráč díl ještě drží.
- **Klidný režim**: po „použít“ u prefabu se `station` kamera za 0,4 s přejede na `eye`, míří na `look`, zorné pole podle dat; tělo stojí. Zámek kurzoru se uvolní, kurzor se promítá na plochu obrazovky (průsečík paprsku s rovinou uzlu). Klávesnice jde na obrazovku: Enter vyšle výstup `command` s napsaným textem, kliknutí na obrazovku `command` s textem `click`, vstup `print` vypíše řádek. Esc vrací do hry (nepauzuje) a vyšle `left`. Obsah obrazovky je text na 2D plátně mapovaném na plochu ve světě (`src/play/terminal.js`, `render.addScreen`).
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
| načtení levelu v Node | asi 80 ms včetně stavby koliderů, start Rapieru 63 ms | `E.stats.boot`, sandbox; orientační |

## Neověřeno

- Zámek kurzoru ve skutečném prohlížeči. Headless prohlížeč ho neumí bezpečně (teče paměť), takže protokol je ověřený jen nad maketou dokumentu v Node (`a_11_app`): získání, ztráta → pauza, odmítnutí po Esc → „klikni znovu“, prostředí bez zámku → pohled tažením myši.
- Návrat zámku kurzoru po odchodu od terminálu. Hra o něj požádá hned (zámek uvolnila sama, ne hráč klávesou Esc, takže by ho prohlížeč měl vrátit bez čekání); když odmítne, vrátí ho první kliknutí do obrazu. Ověřit jde jen ve skutečném prohlížeči.
- Jak se manipulace „drží v ruce“. Směr a rychlost jsou spočítané a otestované robotem, který táhne přesně po směru, který hra hlásí. Jestli je citlivost příjemná (ventil: 414 bodů myši na půl rozsahu, dveře: asi 500 bodů na 105°), řekne až ruka.
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

## Co potřebuju od sešny B

Zatím nic.

## Poznatky pro skill

- **Kontrolér postavy v Rapieru 0.21 vyjde schod jen při vodorovném posunu aspoň asi 7 mm na volání** (změřeno při 120 Hz: 0,75 m/s nestačí, 0,9 m/s ano; na odstupu `offset` to nezávisí). Kdo po nárazu do zdi vynuluje rychlost, ze stoje u schodu nikdy nevyjde. Řešení v `src/play/player.js`: do zdi smí „tlačit“ 1,5 m/s (`WALL_KEEP`), odebírá se jen přebytek.
- **Kapsle se o hranu schodu opírá zaoblením**, takže normála dotyku hrany vypadá jako strmý svah (svislá složka 0,16 až 0,54) a mění se. Strmý svah od hrany schodu proto nejde poznat z normály dotyku; rozhoduje paprsek dolů ze středu spodní polokoule (schůdná plocha pod nohama = hrana, šikmá = svah).
- **Kinematické těleso v klidu postavu „drží“.** Kontrolér bere každé kinematické těleso v dotyku jako plošinu a ruší pohyb postavy ve směru jeho normály; od stojících kinematických dveří se 0,2 s nedalo odejít a kontrolér k tomu nevydal ani záznam kolize. Uzly prefabů jsou proto v klidu těleso `fixed` a kinematické jen po dobu pohybu kloubu (`phys.setMoving`, `entities.js`).
- **Přichycení k zemi (`enableSnapToGround`) stáhne postavu vmáčknutou do rohu dvou zdí pod podlahu** (změřeno až −0,15 m, ve všech režimech tlaku dolů). Pojistka v `player.js`: po každém pohybu dolů paprsek ze středu spodní polokoule ověří místo pod ní.
- **Tlak dolů na zemi (g·dt² na krok) dává na rovině občas krok s nulovým pohybem** (6 z 216 kroků při 8 m/s). Na zemi se proto dolů netlačí (`want.y = 0`) a oporu bez záznamu kolize ověřuje paprsek jednou za 4 kroky. Rychlost po nárazu se počítá ze ztraceného pohybu, ne ze záznamů kolizí, a až od druhého kroku po sobě.
- **Vstup čtený jen v kroku ztrácí krátká ťuknutí.** Kroky běží v dávkách po snímcích; stisk i puštění mezi dvěma snímky (30 ms při 30 snímcích/s) krok nikdy neuvidí. Stisk se proto zamyká do nejbližšího kroku (`latched` v `src/play/input.js`). V headless testu se to projeví hned: `page.keyboard.press` bez zámku neudělá nic.
- **Esc v klidném režimu**: Shell poslouchá `keydown` na `window` ve fázi probublávání. Aplikace si Esc u terminálu bere posluchačem ve fázi zachytávání a volá `stopImmediatePropagation`, jinak by Shell pauzoval.
- Obrazovka ve světě: `CanvasTexture` na `MeshBasicMaterial` s `toneMapped: false`, jinak ACES a expozice levelu text zešednou. Překreslovat jen po změně (`needsUpdate`), ne každý snímek.
- Postavu je nutné umístit o odstup kontroléru (`CHARACTER_SKIN` 0,02 m) nad podlahu.
- `translation()`, `rotation()`, `linvel()`, `computedMovement()` a `computedCollision()` berou v 0.21 cílový objekt: dají se volat bez alokace.
- Výška výskoku vychází o půl kroku integrace níž než `v²/2g` (při 120 Hz o 2,3 %); testy to mají mít v toleranci.

- `esbuild` 0.28.2 umí `import x from './soubor.css' with { type: 'text' }`: styl z `vendor/` jde vložit do stránky bez kopie a bez zásahu do `build.mjs`.
- Rapier 0.21.0 má jiné rozložení balíčku než 0.20 (`dist/rapier.mjs`, `dist/rapier.cjs`, typy v `dist/**/*.d.ts`); `import RAPIER from '@dimforge/rapier3d-compat'` funguje v Node i v esbuildu.
- V sandboxu hlásí ovladač SwiftShader při skládání plátna s vrstvami HTML varování `GPU stall due to ReadPixels`. Je to šum softwarového vykreslování; testy sešny A ho filtrují (`test/a_lib/browser.cjs`), nic jiného ne.
- Pomocné soubory testů patří do složky `test/a_lib/`: soubor `test/a_*.mjs` by `tools/run-tests.mjs` pustil jako test.

## Otázky pro Ondřeje

(doplním na konci vlny)
