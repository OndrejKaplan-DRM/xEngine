# Stav sešny B

**Vlna:** 1 · **Větev:** `sesna-b` (ze `zaklad-1`, `a2ce175`) · **Datum:** 22. 11. 2026

> **Pozor na základ.** Tahle sešna i sešna A stojí na `a2ce175`. Svodná sešna mezitím připravila znění 2 základu (`6ae2e6c`: světlo po vrcholech, `brushLightMesh`, `lightIrradiance`, Shell v `src/shell`, změněné zadání B1.3). K 22. 11. 13:10 na GitHubu není (`origin/zaklad-1` = `a2ce175`). Moje větev jen přidává soubory ve vlastních složkách, přebázování by mělo projít bez konfliktů; neověřeno, dokud znění 2 není na GitHubu.

## Hotovo × neuděláno

| Úkol | Stav | Test | Poznámka |
|---|---|---|---|
| B1.1 xGen: stavebnice a rozvržení | hotovo | `b_t1_xgen` 47 (Node) | předvolby `complex` (dvě patra s galerií, nebo jedno patro s plošinou a rampou) a `catacombs`; 500 levelů bez nálezu validátoru |
| B1.2 xForge: sada prefabů | hotovo | `b_t2_kit` 17 (Node), `b_t3_galerie` 8, `b_t4_levely` 20 (prohlížeč) | `kit_base`: 49 prefabů, 27 s kloubem (33 kloubů), 41 materiálů; galerie `dist/kit.html`; generátor rozmisťuje 47 ze 49 |
| B1.3 xBake: zapečené světlo | neuděláno | | zadání se ve znění 2 změnilo (po vrcholech a vrstvách) a stojí na funkcích základu, které na GitHubu nejsou; návrh N-001 jsem naslepo nepsala |
| B1.4 xSearcher: příjem assetů | neuděláno | | nezačato |

`npm run test:b`: 92 kontrol, 0 selhalo, 65 s. `npm test` (základ): 165 kontrol, 0 selhalo.

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
| sada | 49 prefabů, 8 276 △ celkem, nejtěžší `microscope_01` 456 △ | `b_t2_kit` |
| galerie | 49 z 49 prefabů se vykreslí, u 27 z 27 kloubových je krajní poloha v obraze vidět | `b_t3_galerie`, dlaždice 160 px, softwarové vykreslení |
| levely v xView | `complex_7` přehled 235 volání a 71 988 △; ze startu 44 volání | `b_t4_levely`; xView neslučuje po buňkách ani neořezává, čísla nejsou rozpočet enginu |
| velikost | `dist/kit.html` 760 kB, `dist/xgen.html` 1 052 kB (z toho data 426 kB) | výpis sestavení |

## Neověřeno

- **Nikdo to neprošel.** Engine sešny A levely z `gen_demo` nenačetl. Průchodnost hlídám dvourozměrnou mřížkou s poloměrem 0,3 m, ne Rapierem; hala s galerií a plošinou se v ní přeskakuje (víc úrovní podlahy).
- **Schody.** Geometrie je v mezích zadání (výška stupně 0,17 až 0,20 m, hloubka 0,28 m), ale kontrolér postavy je nezkoušel. Zlatý vzorek má stupně 0,25 m, takže by měly být snazší; je to úvaha.
- **Vzhled.** Všechny snímky jsou ze softwarového vykreslování, v galerii s vlastním nasvícením, v xView s osvětlením po vrcholech celých stěn (na hranicích úseků zdí dělá viditelné svislé předěly; je to vlastnost prohlížeče, ne dat). Barvy materiálů neviděl nikdo na skutečné grafické kartě.
- **Meze kloubů.** Žádná nebyla změřena na skutečném předmětu; u každé je v `KIT.md` úvaha a u většiny poznámka „neměřeno“.
- **Svítivosti.** Pevná světla jsem volila podle zlatého vzorku (místnost 9 až 22 cd, hala 140 cd, pochodeň 8 až 12 cd). Jak je to jasné ve hře, nevím; katakomby jsou schválně tmavé a výklenky bez světla.
- **Posuvné dveře** zajíždějí do zdi (křídlo se v otevřené poloze překrývá s kvádrem zdi). Jak se k tomu postaví Rapier a kreslení, nevím.
- **Dvoukřídlé dveře** jsou dvě entity se stejným počátkem (viz N-002). Jak je engine nabídne k „použít“, nevím.
- **Počet entit.** Level `complex` má 320 až 584 entit. Jestli to T460 unese, řekne až engine se slučováním a měření.
- **Přebázování** na znění 2 základu (viz upozornění nahoře).
- **Odchylka od pravidel obsahu:** katakomby mají stropy 2,2 až 2,6 m (pravidlo říká 2,6 až 3,2 m) a chodby 1,2 až 1,5 m. Je to záměr předvolby; dveřní otvory mají aspoň 2,0 m.

## Návrhy (docs/navrhy)

| Číslo | Co | Dočasné řešení |
|---|---|---|
| N-002 | svázané klouby (dvoukřídlé dveře, mikroskop, klika) | dvě entity spojené přes `io`; nesvázané klouby |
| N-003 | portál jen pro pohled a průhledné dveře (okno, mříž) | generátor okno a mřížovou bránu nerozmisťuje |
| N-004 | údaje prefabu pro rozmisťování (uchycení, rozměr otvoru) | výška v pravidlech předvoleb, otvor ze `source.params` |
| N-005 | průhlednost materiálu (sklo) | `glass_pane` je neprůhledný |

Bez návrhu, jen k zapsání: (1) `build.mjs` najde jeden `target.json` na složku v `tools/`, takže prohlížeč levelů sedí v `tools/designer`; až bude potřeba víc cílů, bude to chtít pole cílů nebo hlubší hledání. (2) Kloub na víc než 8 otáček (rotor centrifugy) formát neumí; rotor je zatím pevný díl. (3) Zápis JSON ve stylu zlatého vzorku mám jako vlastní funkci `fmtJson` v `src/gen/util.js`, protože ta z `tools/golden/make.mjs` není vyvezená; patřila by do `tools/lib`.

## Co potřebuju od sešny A

Nic neblokuje. Co by ses měla dozvědět dřív než při slučování:

1. **Zkus `packs/gen_demo` místo zlatého vzorku.** První level `complex_7` má zamčené dveře (`props: { locked: true }`) a páku, která je odemkne a otevře (`unlock`, potom `open` se zpožděním 0,5 s). Pro robota bez hádanky je `complex_21` nebo `catacombs_3`.
2. **Buňka přes dvě patra.** Hala v `complex_7` sahá od 0 do 6,4 m; portály do horního patra má ve výšce 3,4 m na galerii, schody jsou plné stupně v hale.
3. **Zapuštěné buňky.** Krypty mají podlahu pod nulou (až −0,72 m); práh portálu je ve výšce vyšší podlahy a schody jsou uvnitř nižší buňky.
4. **Zeď má jednoho vlastníka, ale vidí ji dvě buňky.** Až přijde ořez po buňkách (D-027), viditelná buňka musí kreslit i zdi sousedů, které se jí dotýkají; jinak v ní budou díry.
5. **Světla.** Pole `lights` dává základní osvětlení (má se zapékat). Svítidla sady mají vlastní světlo vypnuté (`on: false`) a vypínač u dveří je zapíná přes `io`; pochodně hoří pořád (`on: true`, `flicker`). Stolní lampa je zapojená sama na sebe (`on → turnOn`).
6. **`io` míří i na vlastní entitu** (stolní lampa) a dvě entity se smí spojit do kruhu (křídla dveří: `opened → open` tam i zpět). Počítám, že `open` na otevřené dveře už výstup `opened` nevyšle.

## Poznatky pro skill

- **Commit hned, ne až po testech.** Tuhle sešnu přerušil limit po deseti hodinách bez jediného commitu; soubory přežily restart kontejneru jen proto, že zůstaly na disku. První rozpracovaný stav patří na větev do hodiny.
- **Celé centimetry v generátoru, metry až v datech.** Hrany buněk a zdí se porovnávají přesně a úsek zdi mezi dvěma buňkami je právě jejich společná stěna, takže otvor nikdy nepřesáhne žádnou z nich. Validátor nenašel nic už na prvním běhu.
- **Zdi jako desky z dělení plochy.** Každé dělení přidá jednu desku; desky se dotýkají, ale nepřekrývají. Deska se potom rozřeže podle buněk po obou stranách a každý kus dostane jednoho vlastníka. Zdi dvou pater nad sebou se musí oříznout pásmem patra, jinak se u buňky přes dvě patra překryjí.
- **Strop spodního patra a podlaha horního jsou dvě desky nad sebou** (rozteč pater = světlá výška + 2 × tloušťka), protože půdorysy pater se liší.
- **Validátor hledá překryvy i u klínů podle jejich obalu**, ne podle šikmé plochy.
- **Co validátor nehlídá, musí hlídat generátor a nezávislý test:** plošina zakrývala dveře, nábytek zatarasil cestu mezi dvěma dveřmi (asi v jednom levelu ze čtyřiceti), kancelářská židle a truhla se nikdy nepostavily kvůli obalu přes rozsah pohybu. Všechno našel až test nad daty.
- **Obal prefabu je přes celý rozsah pohybu.** Pro rozmisťování je potřeba i obal v klidu (`src/gen/measure.js`, `boundsAt`).
- **Pomocné soubory testů do `test/b_lib/`** (soubor `test/b_*.mjs` by se pustil jako test). Stejně to má sešna A.
- **xView kreslí první level balíku.** Jiný level vybere obal, který před jeho startem přehodí pořadí v `__PACK__` (`tools/designer/pre.js`); pořadí importů je pořadí spuštění. Pohled „Start“ se dívá vždy ve směru −Z bez ohledu na `yaw`.
- **`getImageData` opakovaně nad stejným plátnem** vypíše v Chromiu varování a test na čistou konzoli spadne; plátno pro statistiku vytvářej s `willReadFrequently`.

## Otázky pro Ondřeje

1. Hustota vybavení v komplexu (laboratoř má 6 až 9 kusů): (a) nechat, (b) ubrat zhruba na polovinu, (c) přidat.
2. Katakomby: (a) nechat stísněné (stropy 2,2 až 2,6 m, chodby 1,2 až 1,5 m), (b) zvednout stropy na 2,6 m a chodby rozšířit na 1,6 m.
3. Výchozí komplex: (a) dvě patra s galerií, jak je teď, (b) jedno patro s plošinou a rampou.
4. Hádanka se zamčenou místností a pákou: (a) jen na přání přepínačem `--puzzle`, jak je teď, (b) v každém levelu.
5. Zbytek vlny: (a) B1.4 xSearcher, (b) počkat na znění 2 základu a dělat B1.3 zapékání, (c) víc detailu u prefabů, které se ti nelíbí.
