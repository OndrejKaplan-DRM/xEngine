# Zadání sešny B, vlna 2: „Vypadá to skutečně“

Zapsala svodná sešna main 02, 22. 11. 2026. **Tento oddíl má přednost.** Pod ním zůstává zadání vlny 1; jeho pravidla obsahu a pasti platí dál.

**Stav větve `sesna-b` ve 23:30 (`9944620`):** katakomby podle volby 2 b, dveře bez škvír (N-007) a xBake s návrhem N-001 už na větvi podle commitů jsou; po sloučení se `zaklad-2` nanečisto prošlo 6 sad ze 6. **Po sloučení i s větví sešny A ale selže `npm run test:axb`:** pro kapsli hráče jsou nedosažitelné `c_store_08`, `c_lab_05` a `c_store_12` v `complex_7` a `c_store_02` v `complex_21`. Ve `zaklad-2` byly dosažitelné všechny. Začni tím (B2.1); světlost dveří je 0,90 m, příčina bude jinde.

**Dodatek 23. 11. 2026 (znění 2 základu 2):** (1) N-001 přijat se změnou (D-035): křídla dveří v portálech při zapékání nestíní; vzorky, ke kterým vede volná cesta od světla otvorem portálu s dveřmi, ulož jako vlastní úsek vrstvy s polem `gate` (id entity dveří). Pravidlo má sešna A v `src/world/occlusion.js`; při sloučení přejde do základu, do té doby se drž jejího popisu v `A_STAV.md`. Do balíků pole `baked` dál nepiš. (2) N-007 (D-036): zakrytí ze všech dílů přijato, seznam entit u portálu ne; dvoukřídlé dveře budou jeden prefab, až základ dodá `follow` (N-002). Dveře, kterými je vidět, k portálu připisuj a označ `seeThrough`. (3) N-108 (D-037): mřížku světla změní základ (vrcholy na násobcích `LIGHT_CELL`, bez schovaných ploch); počty a pořadí vzorků ber vždy z `brushLightMesh`, otisk `geometry` se tím změní. (4) Díly prefabu ber z `partMesh` a `partTris` ze `src/xspace` (galerie, xBake).

## V2.0 Než začneš

1. `git fetch origin && git merge origin/zaklad-2`.
2. Přečti `CLAUDE.md`, `docs/00_ZADANI.md` (body 6/ až 8/ a oddíl C), `docs/DECISIONS.md` D-029 až D-034, `docs/06_ROZPOCTY.md`, `docs/navrhy/README.md` a oddíl „Rozhodnutí“ ve svých návrzích N-002 až N-006.
3. `npm install && npm run test:all`: základ 237, skupina A 267, skupina B 92, zkouška A × B 37 kontrol.
4. V repu je teď i engine sešny A. Tvoje levely si v něm pustíš: `node build.mjs xlab_gen` → `dist/xlab_gen.html?level=0` (1, 2). `npm run test:axb` je vede robotem a musí zůstat zelená po každé změně generátoru nebo sady.

## V2.1 Úkoly v pořadí

| # | Úkol | Hotovo, když |
|---|---|---|
| B2.1 | **Průchodnost pro skutečného hráče a katakomby.** Hráč má poloměr 0,35 m a s odstupem kontroléru potřebuje průchod 0,74 m; generátor hlídá 0,6 m. Zvyš na šířku z profilu hráče (čti z dat nebo dej do předvolby, ne natvrdo na dvou místech). Dveře `door_plank_01` nechávají 0,80 m: rozšiř na světlost aspoň 0,90 m. K tomu Ondřejova volba 2 b: stropy katakomb aspoň 2,6 m, chodby aspoň 1,6 m. | 200 seedů × 2 předvolby bez nálezu; `test:axb` zelená; nová čísla v `B_STAV.md` |
| B2.2 | **Přijatá pole.** `components.place` do sady a `h` z pravidel předvoleb pryč (N-004); `opacity` u skla (N-005); okna s `passable: false` a mříže se `seeThrough` do předvoleb (N-003); `speed` u kloubů s pohonem (N-103). `follow` zatím nepiš (základ ho dluží, D-034). | přísná kontrola balíků 0 varování; okno a mříž v aspoň jednom levelu `gen_demo` |
| B2.3 | **xSearcher** (B1.4): `tools/searcher/find.mjs`, příjem do `packs/_inbox` mimo git, 10 assetů CC0 se záznamem, test bez sítě. | podle zadání vlny 1, řádek B1.4 |
| B2.4 | **Vzhled v polích, která formát má** (N-006, pořadí 1 a 2). Bohatší hrubý tvar u nejviditelnějších prefabů; textury barvy z CC0 zdrojů přes `albedo` a `uvScale`, pro stupeň `low` nejvýš 512 px, originály mimo git; přepínač „čistý / herní“ v galerii. | montáž „čistý × herní“ aspoň 8 prefabů; součet velikosti textur v `B_STAV.md` |
| B2.5 | **Zkouška povrchu na jednom kusu** (D-030) pro sešnu A: jedny dveře se sítí `.glb` na stávající kostře (díl `shape: "mesh"`) a jeden materiál s texturou. Do `B_STAV.md` napiš přesně, co má sešna A načíst, a co ti ve formátu chybělo. Nová pole N-006 (`layer`, `lod`, `minTier`, `orm` a další) do dat nepiš. | balík projde přísnou kontrolou; sešna A má v `B_STAV.md` popis |
| B2.6 | **xBake a N-001** (B1.3 podle zadání vlny 1): zapečené světlo po vrcholech a vrstvách se stíny. Pro zastínění dílů ber `colliders` prefabu, ne vlastní dělení válce (N-101). | podle zadání vlny 1, řádek B1.3 |
| B2.7 | Když zbude: xDesigner nad během A, předvolba dům s interiérem, tvor od kostry. | podle domluvy v `B_STAV.md` |

## V2.2 Co se změnilo proti vlně 1

- Měření T460 (tři běhy xBench 0.2): textura přidá v interiéru 0,5 až 1,0 ms, takže stupeň `low` textury mít smí. Změřená je jedna textura; paměť a desítky textur změřené nejsou.
- Stupně kvality jsou přijaté jako rámec (D-029). Data vyráběj v nejvyšší kvalitě, jakou umíš, a odvozená rozlišení dělej z originálů.
- Svítivosti světel teď neměň: jas se bude ladit jednou, po převodu enginu na světlo po vrcholech (N-105). V montáži zkoušky A × B je jeden pohled v `complex_7` skoro bílý.
- Robot zkoušky A × B otevírá dvoukřídlé dveře rukou a prošel všemi třemi levely; dočasné řešení N-002 tedy funguje.
- Tvých pět otázek Ondřejovi (směr vzhledu, cizí modely, kde vidět herní vzhled, velikost hry, silnější stroj) čeká na odpověď. Do té doby platí tvoje doporučení z `B_STAV.md`.

---

## Zadání vlny 1 (sešna B): „Mám z čeho stavět“

Jsi sešna **B (obsah a nástroje)**. Vyrábíš data ve formátu xSpace a nástroje, které je vyrábějí. Druhá sešna (A) souběžně staví engine; potkáte se jen přes data.

## 0. Než začneš

1. Připoj repo `OndrejKaplan-DRM/xEngine` (přístup pro zápis), naklonuj, `git checkout -b sesna-b origin/zaklad-1`.
2. Přečti `CLAUDE.md`, `docs/STATE.md`, `docs/02_KONTRAKTY.md`, `docs/02a_XSPACE_pole.md`, `docs/01_ARCHITEKTURA.md` (oddíly 1, 3, 6).
   Sada Level 1, na kterou se zadání odkazuje (`01_CORE`, `02_SHELL`, `10_CASE_FPS`), je v balíku pro sešny ve složce `level1/` a v repu `OndrejKaplan-DRM/vibe-game-frameworks` ve složce `frameworks/` (veřejné, stačí klon pro čtení).
3. Přečti `tools/golden/make.mjs` a `packs/golden`: to je vzor dat i stylu generátoru. Tvoje výstupy musí projít stejným validátorem (`npm run check`, pro jiný balík `node tools/xspace-check.mjs packs/<balík> --strict`).
4. Načti skilly `xengine`, `blender-skills` (oddíly 0, 13, 14), `arena-assety` (oddíly 1, 4), `herni-data-zestihleni`, `headless-webgl-testing`. Kde se skill `xengine` liší od repa, platí repo. Přečti i `docs/DECISIONS.md` D-022 (světlo po vrcholech) a `docs/06_ROZPOCTY.md`.
5. `npm install && npm test`. Musí projít (T0 41, T1 118, T4 46, T2 15, T3 12).

**Přechod ze znění 1.** Sešna B začala ze znění 1 (`a2ce175`). Než budeš pokračovat: `git fetch origin && git merge origin/zaklad-1` (zkušební sloučení u svodné sešny proběhlo bez konfliktů, testy základu zůstaly zelené). Pro tebe se mění úkol B1.3 a přibyly `brushLightMesh` a `lightIrradiance` v `src/xspace`; Shell je v `src/shell`. `B_STAV.md` vyplňuj po každém uzavřeném kroku, zatím je v něm jen šablona.

## 1. Cíl

Nástroje, které z parametrů a seedu vyrobí platný level a platné prefaby, a první sada obsahu, na které se dá engine zkoušet. Měřítkem není počet řádků, ale to, že **200 různých seedů projde validátorem bez jediného nálezu** a že prefaby vypadají na galerii jako to, čím mají být.

Všechno jsou čisté funkce: parametry + seed → data. Stejný vstup = bajtově stejný výstup. Náhoda jen přes `rngNext` z `src/kernel`.

## 2. Úkoly v pořadí

Nutné minimum je B1.1 a B1.2. Další jen když zbude síla. Po každém úkolu testy, `B_STAV.md`, commit, push.

| # | Úkol | Hotovo, když |
|---|---|---|
| **B1.1** | **xGen: stavebnice a rozvržení.** `src/gen/kit.js`: místnost (podlaha, strop, zdi s otvory, práh), chodba, schodiště, rampa, sloup; zeď vlastní vždy jedna buňka. `src/gen/layout.js`: graf místností a chodeb ze seedu (dělení plochy nebo mřížka), dveře, záruka dosažitelnosti a nepřekrývání buněk, volitelně patra spojená schodištěm. Předvolby `complex` (technický komplex: hala, laboratoře, sklady, chodby) a `catacombs` (úzké chodby, výklenky, nepravidelné rozměry). Nástroj `node src/gen/cli.mjs <předvolba> --seed N --out packs/<balík>` (ve tvé složce; `tools/*.mjs` patří základu). | 200 seedů × 2 předvolby: 0 chyb a 0 varování validátoru; 20 až 60 buněk; stejný seed dvakrát = stejné bajty; generování 50 místností do 1 s v Node; každý level má schod nebo rampu a aspoň troje dveře |
| **B1.2** | **xForge: sada prefabů `kit_base`.** Každý prefab je funkce `(parametry) → prefab` v `tools/forge/kit/*.mjs`, od kostry k tvaru: nejdřív uzly a klouby s mezemi, potom díly a kolize. Aspoň 30 prefabů: dveře (otočné, posuvné, dvoukřídlé), okno, tlačítko, vypínač, páka, ventil, kohoutek, zásuvková skříň, skříň s dvířky, stůl, židle, regál, lavice, svítidla (stropní, nástěnné, stolní), laboratorní přístroje (centrifuga s víkem, digestoř s výsuvným oknem, mikroskop se zaostřovacím kolečkem, lednice), bedny, sudy, potrubí, zábradlí, terminál. Generátor B1.1 je rozmisťuje podle jednoduchých pravidel (dveře do portálů, vypínač u dveří, světlo do středu stropu, nábytek ke zdem). | všechny projdou validátorem; každý pohyblivý má kloub s mezemi z reálného předmětu (napiš zdroj nebo úvahu); galerie `dist/kit.html` (vlastní cíl sestavení, smíš použít funkce z `src/xspace`) ukáže každý prefab v klidu a v krajní poloze kloubu; montáž snímků pro Ondřeje |
| B1.3 | **xBake: zapečené světlo po vrstvách.** Rozhodnuto měřením T460 (D-022, `06_ROZPOCTY`): světlo se ukládá **po vrcholech**, ne do textury. Vzorky jsou vrcholy `brushLightMesh(b, LIGHT_CELL)` ze základu, ve stejném pořadí; přímé světlo počítá `lightIrradiance` ze základu, ty přidáváš zastínění (paprsky proti kvádrům a dílům prefabů v klidové poloze) a jeden odraz nebo okolní člen. **Jedna vrstva na světlo** (aby šla lampa za běhu přepnout), nepřímé světlo jako vrstva navíc. Návrh formátu souboru jako `docs/navrhy/N-001-zapecene-svetlo.md`: uložení `Float32` po kvádrech a vrstvách, řídké vrstvy, otisk geometrie a světel, co s dveřmi. Náhled vlastní stránkou. | návrh úplný a odůvodněný (velikost souboru, čas zapékání, co s dveřmi); zapečení xLabu do 60 s; snímek „jen zapečené světlo“ vedle snímku z xView; místa ve stínu sloupu jsou měřitelně tmavší; součet vrstev bez zastínění se shoduje s `lightIrradiance` na 1e-6 |
| B1.4 | **xSearcher: příjem volných assetů.** Nejdřív změř, které zdroje jsou ze sandboxu dosažitelné (Kenney, OpenGameArt, Poly Haven, ambientCG, Quaternius) a zapiš to. Nástroj `node tools/searcher/find.mjs "<dotaz>" --type model|texture|sound`: hledá, ukáže licenci, stáhne do `packs/_inbox/<zdroj>/<asset>/` se záznamem (licence, adresa, autor, datum, otisk). Výchozí brána: jen `CC0-1.0`; při pochybnosti NE. Do balíků nic nepřesouvá sám. | tabulka dosažitelnosti zdrojů; 10 stažených assetů se záznamem; test na uložených odpovědích (bez sítě); balík s `free: true` odmítne cokoli jiného než CC0 a vlastní dílo |

## 3. Co nedělat

Engine, vykreslení ve hře, fyziku, editor (xDesigner je vlna 2). Modely přes Blender jen jako připravenou cestu (skript a jeden vzorek), ne jako hlavní výstup: engine v této vlně `.glb` nenačítá. Tvory až ve vlně 2. Žádné změny v `src/kernel`, `src/xspace`, `packs/golden`, `tools/golden`, `tools/xview`, `build.mjs`.

Chybí-li ti ve formátu tvar nebo pole (válec jako kvádr levelu, výšková mapa, víc interakcí na prefab), **neobcházej to a neměň formát**: napiš návrh a pracuj s tím, co je.

## 4. Pravidla obsahu

- Rozměry z reality: dveře 0,8 až 1,0 × 2,0 až 2,1 m, klika 1,0 až 1,1 m, vypínač 1,2 až 1,4 m, stůl 0,72 až 0,76 m, sedák 0,45 m, schod 0,15 až 0,2 m výška a 0,25 až 0,3 m hloubka, strop 2,6 až 3,2 m, chodba aspoň 1,2 m.
- Trojúhelníky: běžný prefab do 500, složitý přístroj do 2 000. Počet zapisuj do `tris`.
- Materiály jen ty, které balík definuje; povrch (`surface`) vyplň pravdivě, řídí zvuk kroků a zásahů.
- Licence: tvoje generátory jsou `own`. Cokoli z webu jen `CC0-1.0` a se záznamem.
- Jména: `<co>_<varianta>_<nn>`, kategorie s tečkami (`arch.door`, `device.lab`, `prop.furniture`).

## 5. Pasti, které znám předem

- Zeď postavená dvakrát (sousední místnosti) = překryv = varování validátoru. Zdi veď jako seznam úseků s jedním vlastníkem.
- Pod každým otvorem musí být práh, jinak je v podlaze díra (test T1 to hlídá u zlatého vzorku; hlídej to u svých).
- Portál leží uprostřed tloušťky zdi a nesmí přesahovat žádnou z obou buněk.
- Čísla zaokrouhluj (v `make.mjs` na 4 desetinná místa), jinak se bajty mezi běhy liší.
- Balík s levely si prefaby a materiály bere z balíku sady přes `requires: ["kit_base"]`. Balíky leží vedle sebe v `packs/` a jmenují se svým id; `xspace-check` i sestavení je spojí samy. Stejné id materiálu nebo prefabu ve dvou balících je chyba.
- Vlastní level si prohlédneš v xView bez zásahu do něj: založ si cíl sestavení se svým `target.json`, který má `"entry": "../xview/main.js"`, `"template": "../xview/index.html"` a `"pack"` na tvůj balík. xView kreslí první level balíku a díly `box` a `cyl`.
- `bpy` (Blender jako modul Pythonu): `pip install bpy==5.2.2 --break-system-packages`; binárka `blender` v sandboxu není. Sketchfab, BlenderKit a obrázky z webu sandbox nepustí.
- Playwright neinstaluj; je v `/opt/npm-tools`. Jeden prohlížeč naráz.
- Zvuky a textury nikdo neposlouchal ani neviděl, dokud to neudělá Ondřej. Napiš to do stavu.

## 6. Co odevzdáš

1. Větev `sesna-b` s nástroji, balíky a testy `test/b_*` (běží přes `npm run test:b`).
2. `docs/sesny/B_STAV.md` podle šablony.
3. Pro Ondřeje: montáž galerie prefabů, tři vygenerované levely (snímky půdorysu a pohledu), případně `dist/kit.html`.
4. Návrhy v `docs/navrhy/` (aspoň N-001, pokud ses dostala k B1.3; dále vše, co ti ve formátu chybělo).
5. Tři až pět otázek pro Ondřeje s volbami a/b.
