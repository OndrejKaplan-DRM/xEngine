# Stav sešny B

**Vlna:** 1 · **Větev:** `sesna-b` (ze `zaklad-1`, `a2ce175`) · **Datum:** 22. 11. 2026, stav ve 14:00

> **Pozor na základ.** Tahle sešna i sešna A stojí na `a2ce175` (znění 1). Svodná sešna má připravené znění 2 základu (commity `6ae2e6c`, `4c84752`, `058ed41`: světlo po vrcholech, `brushLightMesh`, `lightIrradiance`, Shell v `src/shell`, změněné zadání B1.3), ale jen ve svém kontejneru; push čeká na Ondřejovo výslovné slovo. K 22. 11. 14:00 je `origin/zaklad-1` = `origin/main` = `a2ce175`. Až tam bude `058ed41`: `git fetch origin`, `git merge origin/zaklad-1` (sloučit, ne přebázovat; tak to stojí ve stavovém dokumentu svodné sešny), znovu přečíst `CLAUDE.md` a `START_B.md`. Svodná sešna zkusila sloučení nad `eb4b3c8` bez konfliktů; nad dnešním stavem větve je to neověřené.

## Hotovo × neuděláno

| Úkol | Stav | Test | Poznámka |
|---|---|---|---|
| B1.1 xGen: stavebnice a rozvržení | hotovo | `b_t1_xgen` 47 (Node) | předvolby `complex` (dvě patra s galerií, nebo jedno patro s plošinou a rampou) a `catacombs`; 500 levelů bez nálezu validátoru |
| B1.2 xForge: sada prefabů | hotovo, vzhled nevyhovuje | `b_t2_kit` 17 (Node), `b_t3_galerie` 8, `b_t4_levely` 20 (prohlížeč) | `kit_base`: 49 prefabů, 27 s kloubem (33 kloubů), 41 materiálů; galerie `dist/kit.html`; generátor rozmisťuje 47 ze 49. Ondřej 22. 11.: tvary dobré, ale „příliš sterilní“ (viz Rozhodnutí a N-006) |
| B1.3 xBake: zapečené světlo | neuděláno | | zadání se ve znění 2 změnilo (po vrcholech a vrstvách) a stojí na funkcích základu, které na GitHubu nejsou; návrh N-001 jsem naslepo nepsala |
| B1.4 xSearcher: příjem assetů | začato | | hotové jen měření dosažitelnosti zdrojů (`tools/searcher/ZDROJE.md`); nástroj `find.mjs` neexistuje |

`npm run test:b`: 92 kontrol, 0 selhalo, 65 s. `npm test` (základ): 165 kontrol, 0 selhalo.

## Rozhodnutí Ondřeje (22. 11. 2026, 13:51)

| Otázka | Volba | Stav v kódu |
|---|---|---|
| 1. hustota vybavení v komplexu | (a) nechat | platí, nic se nemění |
| 2. katakomby | (b) stropy zvednout na 2,6 m, chodby rozšířit na 1,6 m | **neuděláno**; `src/gen/presets/catacombs.js` má dál stropy 2,2 až 3,2 m a chodby 1,2 až 1,5 m |
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
| 0 | navázání: `git fetch origin`; je-li `origin/zaklad-1` = `058ed41`, `git merge origin/zaklad-1` a znovu přečíst `CLAUDE.md` a `START_B.md`; jinak pokračovat na `a2ce175` | `npm test` a `npm run test:b` zelené | po sloučení má základ 232 kontrol |
| 1 | katakomby podle volby 2 (b): stropy aspoň 2,6 m, chodby aspoň 1,6 m | 200 seedů bez nálezu, `gen_demo` přegenerovaný, nová čísla v tabulce | změní se počty buněk (širší chodby berou plochu); přeměřit `tools/designer/dev/stats.mjs`; zmizí odchylka od pravidel obsahu |
| 2 | B1.4 xSearcher: `tools/searcher/find.mjs "<dotaz>" --type model\|texture\|sound`, příjem do `packs/_inbox/<zdroj>/<asset>/` se záznamem | 10 stažených assetů se záznamem, test na uložených odpovědích bez sítě, balík `free: true` odmítne jinou licenci než CC0 a vlastní | začít Poly Haven a ambientCG (mají rozhraní a soubory jdou stáhnout); `packs/_inbox` nepatří do gitu |
| 3 | život beze změny formátu: válce s víc stěnami, náhrada zkosení a drobné díly u nejviditelnějších prefabů (dveře, stoly, skříně, bedny, sudy, svítidla), drobnosti na stoly a na zem, malé náhodné pootočení a posun nábytku v xGen | montáž „před a po“ stejných prefabů; `tris` v mezích pravidel obsahu (500 běžný, 2 000 složitý) | vidět ve všech dnešních prohlížečích i v enginu sešny A |
| 4 | herní pohled v galerii: textury barvy a normálové mapy z CC0 zdrojů do `kit_base` přes `albedo` a `normal`, přepínač „čistý / herní“ v `dist/kit.html` | montáž „čistý × herní“ aspoň 8 prefabů; součet velikosti textur zapsaný | galerie je jediné místo, kde vykreslení patří sešně B; ve hře to bude vidět, až engine načte textury |
| 5 | zkouška povrchu: jeden prefab (dveře) se sítí `.glb` na stejné kostře, jednou vyrobenou kódem, jednou přes `bpy` | oba kusy v galerii vedle hrubého tvaru; porovnání pracnosti a velikosti | podklad pro rozhodnutí N-006; `bpy` v sandboxu není nainstalovaný |
| 6 | B1.3 xBake + N-001 | podle `START_B.md` znění 2 | až po kroku 0 se sloučením |

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
| ukázkový balík: `complex_7` (dvě patra, hádanka), `complex_21` (jedno patro), `catacombs_3` | `packs/gen_demo` (vyžaduje `kit_base`) |
| vývojové pomůcky: rozložení přes seedy, půdorysy do PNG, snímky levelů, montáž galerie | `tools/designer/dev/stats.mjs`, `plans.cjs`, `shots.cjs`; `tools/forge/dev/kitshot.cjs` |
| měření dosažitelnosti zdrojů assetů | `tools/searcher/ZDROJE.md` |

## Změřená čísla

Všechno změřeno v sandboxu (Node 22, 2 jádra; prohlížeč Chromium se softwarovým vykreslováním). Časy jsou orientační, o T460 neříkají nic.

| Co | Hodnota | Kde a jak |
|---|---|---|
| seedy bez nálezu validátoru | 200 `complex` (dvě patra) + 200 `catacombs` + 50 `complex` jedno patro + 50 `complex` s hádankou = 500 levelů, 0 chyb, 0 varování | `b_t1_xgen`, validátor nad levelem spojeným se sadou |
| pokusů na level | `complex` vždy 1, `catacombs` 1 až 2 | tamtéž (pokus = jeden proud náhody; nevyhovující se zahodí) |
| buněk na level | `complex` 31 až 59 (medián 45), `catacombs` 27 až 53 (38), jedno patro 34 až 57 (45) | tamtéž |
| dveří v portálech | `complex` 29 až 60 (43), `catacombs` 4 až 19 (10) | tamtéž |
| čas generování | `complex` 4,7 až 82,6 ms (medián 9,4), `catacombs` 1,4 až 13,3 ms (2,8); level s 53 buňkami 8,9 ms | tamtéž, `performance.now` kolem `generateLevel`, první volání nese zahřátí |
| kvádrů a entit na level | `complex` 354 až 629 kvádrů, 320 až 584 entit; `catacombs` 298 až 543 kvádrů, 96 až 181 entit | tamtéž |
| nejvíc v jedné buňce | 48 entit, 94 kvádrů (meze validátoru 150 a 400) | sonda přes 300 levelů |
| trojúhelníků v celém levelu | průměr 54 537, nejvíc 87 964 (kvádry + součet `tris` prefabů) | sonda přes 300 levelů před poslední úpravou pravidel; řádově platí |
| průchodnost místností | v 9 až 31 buňkách na level mezi všemi otvory cesta široká 0,6 m | `b_t1_xgen`, mřížka 0,1 m, nezávislá na generátoru |
| opakovatelnost | stejný seed dvakrát = stejné bajty (201 577 a 103 979 znaků); `packs/gen_demo` a `packs/kit_base` bajtově shodné s výstupem nástrojů | `b_t1_xgen`, `b_t2_kit` |
| sada | 49 prefabů, 8 276 △ celkem (průměr 169 △), nejtěžší `microscope_01` 456 △ | `b_t2_kit` |
| galerie | 49 z 49 prefabů se vykreslí, u 27 z 27 kloubových je krajní poloha v obraze vidět | `b_t3_galerie`, dlaždice 160 px, softwarové vykreslení |
| levely v xView | `complex_7` přehled 235 volání a 71 988 △; ze startu 44 volání | `b_t4_levely`; xView neslučuje po buňkách ani neořezává, čísla nejsou rozpočet enginu |
| velikost | `dist/kit.html` 760 kB, `dist/xgen.html` 1 052 kB (z toho data 426 kB); `packs/kit_base` 216 kB, `packs/gen_demo` 476 kB na disku | výpis sestavení, `du` |
| dosažitelnost zdrojů assetů | Poly Haven a ambientCG: rozhraní i soubory ano; OpenGameArt a Quaternius: stránky ano, stažení souboru neměřeno; Kenney: 403 | `curl` 22. 11. kolem 14:00, tabulka v `tools/searcher/ZDROJE.md` |
| velikost jedné sady map | ambientCG `Concrete049`: 1K-JPG 10 406 004 B, 2K-JPG 36 432 631 B, 4K-JPG 131 410 218 B | odpověď rozhraní ambientCG |

## Neověřeno

- **Nikdo to neprošel.** Engine sešny A levely z `gen_demo` nenačetl (její `A_STAV.md` k `c8444bf` píše „Co potřebuju od sešny B: zatím nic“ a o `gen_demo` se nezmiňuje). Průchodnost hlídám dvourozměrnou mřížkou s poloměrem 0,3 m, ne Rapierem; hala s galerií a plošinou se v ní přeskakuje (víc úrovní podlahy).
- **Schody.** Geometrie je v mezích zadání (výška stupně 0,17 až 0,20 m, hloubka 0,28 m), ale kontrolér postavy je nezkoušel. Zlatý vzorek má stupně 0,25 m, takže by měly být snazší; je to úvaha. Sešna A změřila, že kontrolér vyjde schod jen při vodorovném posunu aspoň asi 7 mm na krok; s mými schody to nikdo nezkoušel.
- **Vzhled.** Všechny snímky jsou ze softwarového vykreslování, v galerii s vlastním nasvícením, v xView s osvětlením po vrcholech celých stěn (na hranicích úseků zdí dělá viditelné svislé předěly; je to vlastnost prohlížeče, ne dat). Barvy materiálů neviděl nikdo na skutečné grafické kartě. Ondřej viděl montáže a soubory z 22. 11. a vzhled označil za sterilní.
- **Meze kloubů.** Žádná nebyla změřena na skutečném předmětu; u každé je v `KIT.md` úvaha a u většiny poznámka „neměřeno“.
- **Svítivosti.** Pevná světla jsem volila podle zlatého vzorku (místnost 9 až 22 cd, hala 140 cd, pochodeň 8 až 12 cd). Jak je to jasné ve hře, nevím; katakomby jsou schválně tmavé a výklenky bez světla. Sešna A v N-105 píše, že zlatý vzorek je přesvícený; moje hodnoty z něj vycházejí, takže se jich to může týkat také.
- **Posuvné dveře** zajíždějí do zdi (křídlo se v otevřené poloze překrývá s kvádrem zdi). Jak se k tomu postaví Rapier a kreslení, nevím.
- **Dvoukřídlé dveře** jsou dvě entity se stejným počátkem (viz N-002). Jak je engine nabídne k „použít“, nevím.
- **Počet entit.** Level `complex` má 320 až 584 entit. Jestli to T460 unese, řekne až engine se slučováním a měření.
- **Sloučení** se zněním 2 základu (viz upozornění nahoře).
- **Odchylka od pravidel obsahu:** katakomby mají stropy od 2,2 m (pravidlo říká 2,6 až 3,2 m) a chodby 1,2 až 1,5 m. Ondřej zvolil nápravu (volba 2 b), provedena není.
- **Stažení assetu** z OpenGameArt a Quaternius, licenční údaje zdrojů (viz `tools/searcher/ZDROJE.md`).
- **Všechno v N-006** kromě toho, co je tam výslovně označené jako ověřené: stupně kvality a jejich meze jsou návrh bez měření.

## Návrhy (docs/navrhy)

| Číslo | Co | Dočasné řešení |
|---|---|---|
| N-002 | svázané klouby (dvoukřídlé dveře, mikroskop, klika) | dvě entity spojené přes `io`; nesvázané klouby |
| N-003 | portál jen pro pohled a průhledné dveře (okno, mříž) | generátor okno a mřížovou bránu nerozmisťuje |
| N-004 | údaje prefabu pro rozmisťování (uchycení, rozměr otvoru) | výška v pravidlech předvoleb, otvor ze `source.params` |
| N-005 | průhlednost materiálu (sklo) | `glass_pane` je neprůhledný |
| N-006 | stupně kvality a vrstvy vzhledu (hra má vypadat skutečně; rezerva pro silnější stroj) | bohatší hrubý tvar a textury v polích, která formát už má; nová pole nepíšu |

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

## Poznatky pro skill

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

## Otázky pro Ondřeje

Předchozích pět je zodpovězeno (viz Rozhodnutí). Nové:

1. Směr vzhledu, kterým začít: (a) opotřebený provoz (ošlapaný beton, oprýskaný lak, rez, prach; chyby se v něm ztratí a věrohodnosti se dosáhne nejdřív), (b) čistá moderní laboratoř (bílé plochy, nerez, sklo; každá nepřesnost je vidět a bez dobrého světla působí sterilně dál).
2. Cizí modely z webu: (a) z webu jen materiály a textury, tvary vlastní na vlastních kostrách (jednotný styl, všechno se hýbe), (b) k tomu i hotové skenované modely jako nepohyblivé rekvizity (rychleji plno, ale styl může tlouct a data narostou).
3. Kde chceš herní vzhled vidět poprvé: (a) co nejdřív v galerii sady, i když to hra ještě neumí, (b) až ve hře, až engine načte textury (vlna 2).
4. Velikost hry: (a) dál jeden soubor HTML a textury nejvýš 512 px, (b) hra a vedle ní složka s balíky, textury 1 024 px a víc.
5. Silnější stroj, na který mám mířit horní stupeň: (a) novější notebook s integrovanou grafikou, (b) stroj se samostatnou grafickou kartou (napiš jakou, nebo aspoň cenovou třídu).

Dvě věci čekají na tebe mimo sešnu B: push znění 2 základu (svodná sešna) a běh `xbench_0-2.html` na T460 (rozhodne, kolik textur T460 unese).
