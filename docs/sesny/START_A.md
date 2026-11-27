# Zadání sešny A, vlna 2: „Běží to na T460 a je na co se dívat“

Zapsala svodná sešna main 02, 22. 11. 2026. **Tento oddíl má přednost.** Pod ním zůstává zadání vlny 1 (znění 2): úkoly A1.2, A1.4, A1.6 a A1.8 v něm popisují, jak má převod na světlo po vrcholech vypadat.

**Stav větve `sesna-a` ve 23:30 (`5626629`):** A2.1, A2.2 a z A2.4 skok, „Rozhraní entit“ a terminál podle D-024 už na větvi podle commitů jsou. Svodná sešna je neposuzovala; po sloučení se `zaklad-2` nanečisto prošlo 18 sad z 18. Dolož je v `A_STAV.md` proti sloupci „Hotovo, když“ a pokračuj od A2.3. Po sloučení s větví sešny B selže `npm run test:axb` na čtyřech nedosažitelných buňkách (viz `STATE.md`); je to úkol sešny B, ale týká se i tebe, kdyby příčina byla v kolizích.

**Dodatek 25. 11. 2026 večer (znění 11 základu 2, svodná main 04: návrhy sešny B N-012, N-014, N-015):** Nejdřív sluč `origin/zaklad-2`; tvoje větev má základ ze znění 4 a sloučení se zněním 11 je nanečisto bez konfliktu (čísla ve `STATE.md`). Pořadí práce ti Ondřej poslal zprávou: sloučit, okolní světlo děleno π (D-049), N-010 v běhu, A3.1 zbraně, kostra v kroku, textura světla. K tomu: (1) **N-014, D-057: prokazatelná viditelnost.** `src/xspace/pvs.js`: `levelPVS(level)` dá pro každou buňku množinu buněk, které z ní mohou být vidět (všechny dveře otevřené, okna průhledná; nadmnožina, nezávisle ověřená v T1f). Zkouška pro tebe, v T5 (robot) i ve `?bench`, každý snímek: **horní mez** = buňky, které kreslíš, ⊆ `levelPVS(level).get(buňka kamery)`; **dolní mez** (nic nebliká) = mřížka paprsků z oka přes celé zorné pole (např. 64 × 36) proti kvádrům v Rapieru; buňka každého zasaženého kvádru musí být mezi kreslenými, hlavně do 1 m před portálem a v jeho rovině. Kreslení se tím nemění; když horní mez selže, kreslíš navíc, když dolní, místnost bliká. Rozpočet `06_ROZPOCTY.md` je teď ≤ 300 tisíc △ z kterékoli buňky podle PVS (`visibleTris`, `VISIBLE_TRIS_LOW`). (2) **N-012, D-058: díly `lathe` a `rbox`.** Síť dá `partMesh` (tvůj `assets.js` ji volá pro všechno kromě `mesh`, takže je nakreslíš beze změny kódu), UV v metrech jako u kvádru, normály hladké s ostrými hranami v `crease`. Jsou to **pevné díly** (`STATIC_SHAPES` v `samples.js`) a nesou vzorky světla v pořadí `levelSamples`; pevné díly nevybírej podle tvaru sama, ber `staticPartIndices` / `entityStaticMesh`, jinak se rozejde pořadí se souborem ze xBake. Kolize dílů se nepočítají, prefab má `colliders`. (3) `formats.js` je rozdělený (`schema.js`, `formats-weapon.js`), importy z `formats.js` a `index.js` platí beze změny. (4) xView 0.2 má přepínač podlaží (N-015). (5) Návrhy sešny B pro tebe: N-011 (`?bench` kývá pohledem) a N-013 (sklo s okrajem a odleskem) leží na `sesna-b`; rozhodni je a zapiš do `A_STAV.md`.

**Dodatek 25. 11. 2026 v noci (znění 10 základu 2: tvůj N-112 přijat, D-055):** Atlas ploch a soubor textury světla jsou v základu (zkušební do zkoušky celého `complex_7`). `src/xspace/atlas.js`: `lightmapLayout(levelSamples(…), texel)` dá rozměr atlasu a **UV 1 pro každý vzorek v pořadí `levelSamples`** (`NaN` = vzorek mimo atlas, typicky plášť válce: svítí se dál po vrcholech i přímým světlem), `lightmapDilation(width, height, index)` okraje map (CSR; sandbox `complex_7` po 5 cm 345 ms). `src/xspace/lightmap.js`: `decodeLightmap` (soubor na disku je gzip: v prohlížeči `DecompressionStream('gzip')`), `composeLightmap` → přímé E (RGB) bodů na ploše; ty převedeš do half float textury (`toHalf`), okraje doplníš podle `lightmapDilation`. Otisk `baked.lightmap.atlas` porovnej s `lightmapLayout(…).hash`; nesouhlasí-li, texturu nepoužij. Shader podle tvého návrhu: `diffuse × (barva vrcholu + lightMap / π)`, kde barva vrcholu nese okolní člen, odraz a u vzorků mimo atlas i přímé světlo. Přepnutí lampy skládá jen body té lampy. Tvoje `src/world/lightmap.js` zůstává jako zkušební cesta za `?lightmap=`; atlas ber ze základu. Až B dodá zapečený `complex_7`, změř `?bench` na T460 (5 cm i zmenšení na 10 cm).

**Dodatek 25. 11. 2026 v noci (znění 9 základu 2: zkouška zbraní N-201, D-051, D-053):** Ondřejovo pořadí převzetí z Arény: nejdřív zbraně. Základ má **zkušební** formát zbraní a munice a jeden kus ve zlatém vzorku: plazmová puška `plasma_rifle_01` (hodnoty Arény v2.9), model v ruce `wpn_plasma_rifle_01`, zbraň na zemi `e_plasma` ve startovní místnosti xLabu, munice `cells`. Pravidla jsou v `02_KONTRAKTY.md`, oddíl „Zkušební: zbraně, munice a boj“; vzorce jen ze `src/xspace/weapon.js` (`rampValue`, `splashFalloff`, `pushDelta`). Úkol **A3.1, zkouška zbraní na jednom kusu** (pořadí ber podle sebe, ale po rozpracovaném N-010):

| Část | Hotovo, když |
|---|---|
| sebrání a výběr: `pickup.item` = id zbraně dá zbraň a `amount` munice; slot 0–9; volba klávesy přiblížení je tvoje (zapiš ji) | robot v xLabu sebere pušku u startu a má 40 článků |
| střelba: hlavní (střela 45 m/s, 10 ran/s, rozptyl přes `rngNext`), druhé tlačítko nabíjí kouli (2 s plně, samo ve 2,6 s); střela = paprsek Rapieru po dráze za krok | robot trefí terč `e_target`: výstup `hit` přepne lampu `e_lamp_hall_b` (spojení už ve zlatém vzorku je) |
| výbuch: poškození a odhození podle `splashFalloff` a `pushDelta`, kryt paprskem přes statický svět | nabitá koule odhodí bednu (`crate_wood_01`) s Δv podle `pushDelta` na 5 %; bedna za zdí se nehne |
| zásah entit s `health`: `hit`, `destroyed`, `breakInto` | test na kopii prefabu s nízkým `hp` |
| události `weapon:fired`, `weapon:switched`, `combat:hit`, `combat:exploded`, `combat:destroyed`, `combat:noise` deklarované | T0 / tvůj test: nedeklarovaná událost by shodila běh |
| zbraň v ruce: druhý průchod po vymazání hloubky, bez světla po pixelech; záblesk ústí jako jediné efektové světlo; ústí za zdí → střela z oka | snímek z plátna s puškou u zdi (zbraň nikdy nepronikne zdí) |
| přiblížení `zoom.fov` 45° (vodorovně, jako tvé zorné pole) | nastavení i klávesa projdou `apply/probe` |
| cena na T460 | `?bench` se zbraní v ruce a se střelbou (průlet může střílet) |

Co ve formátu chybí nebo nesedí, napiš do `A_STAV.md` (formát je zkušební, změním ho). Z Arény ber hodnoty a postupy (`docs/prevzeti/ARENA.md`, A-1 až A-5), ne kód: Aréna má `Math.random` na 291 místech.

**Dodatek 25. 11. 2026 v noci (znění 8 základu 2: N-010 víc interakcí v prefabu, D-052):** (1) `components.interact` smí být seznam objektů s `id` (jediný objekt bez `id` platí dál a má id `main`). Čti ho jen přes `src/xspace/interact.js`: `interactions(prefab)` (vždy pole), `interactionOf(prefab, nodeId)` (kterou interakci ovládá zasažený uzel: kloub uzlu nebo nejbližšího předka, svázaný kloub podle sledovaného; jinak jediná interakce bez kloubu; jinak `null` = nic), `interactionById`, `doorInteraction` (portál). Přímé čtení `components.interact.kind` / `.joint` v `src/play/interact.js`, `src/world/behaviors.js`, `entities.js`, `visibility.js`, `swing.js` a `src/app` nahraď. (2) Stav entity (otevřeno, zamčeno, poloha, výstupy) veď **po interakcích** (klíč `id`). Spojení: `from` = výstup jen z té interakce, `to` = vstup jen do té interakce; bez `to` jde vstup do všech interakcí cíle (zamknout celou kartotéku). Výstup nese, ze které interakce přišel. (3) Test si udělej sama na kopii prefabu (vzor: kartotéka v `test/t1c_interact.mjs`): čtyři zásuvky v jednom prefabu, každá se otevře zvlášť, zamčení jedním spojením. Ve hře zatím žádný prefab se seznamem není. (4) Až to budeš mít, napiš to do `A_STAV.md` a `TODO.md`: sešna B na to čeká, kartotéku a stůl vrátí do jednoho prefabu až po tobě (jinak shodí zkoušku A × B).

**Dodatek 25. 11. 2026 po půlnoci (Ondřejova rozhodnutí D-050 a D-051):** (1) **N-110 přijat, bod 5 cm** (D-050). Texturu světla bude počítat xBake předem; tvůj výpočet při načtení zůstává jen za přepínačem `?lightmap=` jako zkušební cesta. Velikost bodu bude pole dat; na stupni `low` ji smíš při načtení zmenšit na 10 cm. Formát se zmrazí po zkoušce celého `complex_7` v xBake (sešna B); ty k ní dodáš čtení souboru a `?bench` na T460. Hra smí mít až 25 MB (Ondřej sešně B 24. 11. 23:57): `complex_7` po 5 cm v half float vychází podle tvého odhadu 32 MB na vrstvu, proto zkouška porovná i 4 bajty na bod (`RGB9_E5`, které WebGL 2 umí vzorkovat, nebo RGBM) a vrstvy jen pro přepínaná světla a brány. (2) **Pořadí převzetí z Arény** (D-051, `docs/prevzeti/ARENA.md`): nejdřív zbraně, střelba, zoom a výbuchy. Svodná připraví události boje a formát zbraně; tvůj díl bude střelba přes paprsky Rapieru, zbraň v ruce ve druhém průchodu, zoom a výbuch s impulsem (A-1 až A-5 v soupisu). Nezačínej dřív, než dodatek s formátem přijde; do té doby platí tvoje fronta.

**Dodatek 24. 11. 2026 pozdě v noci (znění 7 základu 2: N-102 kostry bez alokací):** (1) `src/xspace/rig.js` má `rigCompile(prefab)`, `rigValues(compiled, values)`, `rigFollow(compiled, values)` a `rigSolve(compiled, values, out)`. `rigMatrices` je obálka, dává bit po bitu totéž co dřív (T1b, 40 případů; 802 případů na 478 prefabech včetně `kit_lab` a `kit_it`). (2) V enginu: `rigCompile` jednou na prefab při stavbě entit (výsledek je jen pro čtení, smí ho sdílet všechny entity téhož prefabu), pole hodnot `rigValues` a pole matic `new Float64Array(16 * C.count)` jednou na entitu. V kroku zapiš hodnoty kloubů do pole (index `C.jointIndex.get(id)`; `NaN` = klid), zavolej `rigFollow` (svázané klouby, N-002) a `rigSolve`; matice uzlu `i` začíná na `16 i` (`C.nodeIndex.get(id)`). Tím odpadne volání `rigMatrices` v kroku (`src/world/entities.js`) i oddělené `jointFollow`; volání mimo krok (sondy, nástroje) smí zůstat u obálky. Shodu ohlídá tvůj test: stejné matice jako dnes. (3) `test/t1_xspace.mjs` měl 608 řádků; testy koster jsou teď v `test/t1b_rig.mjs` (součást `npm test`), mutace `rig.*` zůstaly v T1.

**Dodatek 24. 11. 2026 v noci (znění 6 základu 2: zakrytí dveří a svázané klouby):** (1) **N-002 provedeno:** kloub smí mít `follow { joint, ratio, offset? }` a `jointFollow(prefab, values)` v `src/xspace/rig.js` dopočítá jeho hodnotu (řetěz, ořez na meze). Svázaný kloub nikdy není kloubem interakce. V enginu: po kroku pohonů zavolej `jointFollow` a hodnoty svázaných kloubů nastav (tělesa jejich uzlů jsou kinematická po dobu pohybu jako u ostatních). Pro bránu světla a ořez pohledem u dveří se dvěma křídly ber otevření **kloubu interakce** (`doorOpenness`). Sešna B z toho udělá dvoukřídlé dveře jako jeden prefab `door_double_01` bez `seeThrough`; do té doby platí dnešní data. (2) **D-036 provedeno:** validátor hlásí `portal.door.cover`, když zavřené dveře v klidu nezakryjí otvor. Zlatý vzorek měl u `door_hinged_01` škvíru 1 cm; viditelné křídlo je teď přes celý otvor 1,0 × 2,1 m (kolize beze změny). Černou clonu v otvoru zavřených dveří můžeš nechat jako pojistku, data už škvíry mít nesmí. Po sloučení zkontroluj `a_17_view` a testy se zlatými dveřmi.

**Dodatek 24. 11. 2026 večer (znění 5 základu 2: vlna 2 sloučená, D-048):** (1) Tvoje práce do `85d6a6d` je v základu (909 kontrol, 0 selhalo). `git fetch origin && git merge origin/zaklad-2`; nad `3250dd6` je to bez konfliktu. Dostaneš i práci sešny B (xBake, xSearcher, 30 textur `kit_base`, nové barvy a tvary sady). (2) **Zlatý vzorek má `door_hinged_01` ±105°** (N-109); tvoje testy prošly. `swing.js` teď potřebuje jen data sady `kit_base`. (3) **N-111 přijat (D-046):** build vkládá soubory balíku do `pack.files` (klíč `<id balíku>/<cesta>`, base64) a `mergePacks` dává `materialFrom`. Past na `__PACK__` v testech už není nutná. `xlab_gen.html` nese 30 textur `kit_base` (1 717 kB v base64); cenu v `?bench` změř. (4) **N-009 přijat (D-045):** pole `albedoMean` je ve formátu; tvůj `COLOR_IS_MEAN` je správná cesta. (5) **D-049, odpověď na π v `composeColors`:** vrací osvětlení E záměrně (kontrakt: E se násobí barvou a dělí π při vykreslení). Rozpor je v okolním světle: ty ho π nedělíš, náhled xBake ano. Platí, že `env.ambient` je E jako ostatní světlo: **děl ho π taky** (při výpočtu i ze souboru) a můžeš volat `composeColors`. Aby xLab nepotemněl, vynásobím okolní světlo zlatého vzorku π při příštím sloučení s tvou změnou; dej vědět v `A_STAV.md`. (6) **D-047:** zavřené dveře se `seeThrough` světlo zadržují (verze 1), jak to děláš. (7) Díly `mesh` do vzorků nepatří (D-041 jen `box` a `cyl`); svítíš je po vrcholech sama. (8) Oddíl 9 architektury jsem podle tvých poznámek přepsala.

**Dodatek 24. 11. 2026 odpoledne (znění 4 základu 2, svodná main 03):** (1) Sluč `origin/zaklad-2`; `TODO.md` a `CLAUDE.md` už máš (D-038). (2) **D-039 strop řádků:** počet řádků omez fyzickou výškou plátna (`clientHeight × devicePixelRatio`). Na Ondřejově okně dávala volba 1 080 obraz 2 360 × 1 080 do plochy asi 1 916 × 878 fyzických bodů, tedy 1,51× bodů navíc (`docs/mereni/T460_2026-11-24_D-037_F3.md`). (3) **N-109 přijat (D-042).** Věta v kontraktech odpovídá tvému `behaviors.js`. **Zlatý vzorek zatím nepřepínám:** s `door_hinged_01` ±105° selhalo ve sloučení nanečisto 8 tvých kontrol ve třech sadách, protože počítají s jednostrannými dveřmi: D-025 (dveře se o hráče zastaví, vrátí se, `closed`, uhnutí, uložení), doba pohonu v `a_14_entities` (počítá `(max − min) / speed`, správně je od `rest`) a dvě kontroly přepínače v `a_14_swing`. Uprav je, aby nezávisely na rozsahu dveří zlatého vzorku (jednostrannou kopii prefabu si test udělá sám, jako `swing.js`), napiš to do `A_STAV.md` a já data přepnu. Zkoušku si můžeš pustit sama: v `tools/golden/make.mjs` dej `door_hinged_01` `min: -105` a `node tools/golden/make.mjs packs/golden` (necommituj). Otevření pro brány světla je `doorOpenness` ze základu (stejný vzorec jako tvůj v `occlusion.js`). Nastavení „Dveře od hráče“ smí zůstat, `swing.js` ale nesmí rozšiřovat rozsah kloubům, které nejsou dveře (tvůj nález se dvířky nábytku). (4) **N-008 přijat (D-040):** rozměry postavy jsou v `src/xspace/body.js` (`BODY`, `CHARACTER_SKIN`); `src/play/profiles.js` a `src/phys/phys.js` je mají převzít, robot zkoušky A × B už je bere odtud. (5) **D-041 vzorky světla:** pořadí vzorků je `levelSamples(level, prefabs, materials)` ze `src/xspace/samples.js`: kvádry z `levelLightMeshes`, potom pevné díly entit ve světových souřadnicích (pevný díl = `box` nebo `cyl` na uzlu bez kloubu nad sebou, u entity, která není dynamická ani `pickup`). Tvoje statická dávka je dnes svítí ve vlastním pořadí; přejdi na tohle, aby šel číst zapečený soubor. (6) **D-044:** čtení zapečeného souboru je `src/xspace/bake.js` (`decodeBake`, `composeColors`, `gateLevel`, `doorOpenness`). Pravidlo paprsku je jen v xBake; tvůj výpočet při načtení je náhradní řešení, dokud soubor nečteš, a s xBake se nemusí shodovat na bod. (7) **N-110 (D-043):** po A2.5 a A2.6 zkouška na hale xLabu s bodem 5 cm **i** 10 cm a `?bench` na T460 s texturou i bez ní; formát a atlas se rozhodnou podle toho. Pole `env.lightCell` nebude, `?grid=0.25` zůstává volbou běhu.

**Dodatek 24. 11. 2026 (znění 3 základu 2, D-037 provedeno):** (1) Sluč `origin/zaklad-2`; stojíš na `b12f8ed` a chybí ti N-101 i D-037. Zkouška nanečisto s tvou `3b005a7` prošla: 21 sad z 21, 336 kontrol. (2) `brushLightMesh` teď dělí hrany rovnoběžné s osou na násobcích buňky ve světě. Voláš ji beze změny, takže novou mřížku dostaneš sloučením. `a_17_view` po sloučení hlásí 0 bodů na švech (dřív 128); hlídání „nesmí růst“ si nastav na nový stav. (3) Schované plochy: smyčku `brushLightMesh(b, sys.lightCell)` ve `src/world/world.js` nahraď `levelLightMeshes(level.brushes, materials, sys.lightCell)` (jedna síť na kvádr, `null` pro `vis: false`), nebo předej třetí parametr z `brushHiddenFaces`. xLab tím ztratí 64 ploch z 322. Pravidlo „vzorek pod sousedním kvádrem přebírá viditelnost od souseda“ potřebuješ dál pro plochy schované jen zčásti. (4) Strop dílků hrany je 256 místo 64: při `?grid=0.25` se plochy delší než 16 m už nezhrubují. Tvůj test po sloučení: 24 009 → 75 418 vzorků, 36 018 → 130 114 trojúhelníků (v `A_STAV.md` máš pro 0,25 m 63 392 a 107 106). Čísla přepiš. (5) Pole `env.lightCell` z tvého doplňku N-108 do formátu zatím nejde; rozhodnu po čísle `?bench` s `grid=0.25` z T460. Po D-037 jsou vrcholy mřížky 0,5 m na plochách rovnoběžných s osami podmnožinou mřížky 0,25 m. (6) Počty a T-spoje libovolného balíku vypíše `node tools/light-stat.mjs packs/<balík> [--cell 0.25]`.

**Dodatek 23. 11. 2026 (znění 2 základu 2):** (1) `partMesh`, `partCollider` a `partTris` jsou v základu; obsah `src/world/parts.js` nahraď importem ze `src/xspace` (`partCollider` vrací totéž co tvoje `colliderShape`). (2) N-108 rozhodnuto (D-037): mřížku světla změní základ, nezáplatuj ji; počty vzorků neměj nikde natvrdo. (3) N-001 přijat se změnou (D-035): zapečené vrstvy ponesou úseky s polem `gate` podle tvého pravidla z `occlusion.js`; ta funkce přejde při sloučení do základu, piš ji proto bez závislosti na Rapieru v rozhraní, pokud to jde, a napiš do stavu, co k tomu potřebuje. (4) `portal.door` zůstává jedna entita (D-036).

## V2.0 Než začneš

1. `git fetch origin && git merge origin/zaklad-2` (zkušební sloučení s `sesna-a` na `b0dce2f` bylo bez konfliktu).
2. Přečti `CLAUDE.md`, `docs/00_ZADANI.md` oddíl C, `docs/DECISIONS.md` D-029 až D-034, `docs/06_ROZPOCTY.md`, `docs/navrhy/README.md` (co je rozhodnuto) a `docs/mereni/T460_2026-11-22_xlab_gen_F3.md`.
3. `npm install && npm run test:all`: základ 237, skupina A 267, skupina B 92, zkouška A × B 37 kontrol.
4. Zkouška A × B je od teď tvoje pojistka: `npm run test:axb` vede robota levely sešny B. Po každém kroku musí zůstat zelená.

## V2.1 Úkoly v pořadí

| # | Úkol | Hotovo, když |
|---|---|---|
| A2.1 | **Světlo po vrcholech** (D-022, D-031; oddíl 2a níže, kroky 4 a 7). Síť z `brushLightMesh`, vrstvy z `lightIrradiance`, `MeshBasicMaterial` s barvou vrcholů, zastínění paprsky Rapieru, světlo dílů po stěnách. Zásobník bodových světel zmizí; smí zůstat nejvýš jedno efektové světlo. Ořez po buňkách zůstává pro geometrii. Ondřej chce, aby zavřenými dveřmi světlo neprocházelo (jeho volba 2 a): navrhni jak a zapiš to. | průchod scénou nenajde víc než jedno `Light`; místo za sloupem v hale je měřitelně tmavší; přepnutí lampy mění jen úroveň vrstvy a nealokuje; snímky proti xView s novým prahem; `test:axb` zelená |
| A2.2 | **Obraz a měření.** Pevný počet řádků 576, 768, 1080 (D-023), `setPixelRatio(1)`; vyhlazování hran výchozí vypnuté a v nastavení. `xlab.html?bench`: pevný průlet přes `__xe`, na konci JSON (medián a 95 % času snímku, krok po systémech, volání, △, velikost obrazu, řetězec grafiky). Cíl `xlab_gen` patří základu; `?bench` musí fungovat i v něm. | každé nastavení projde `apply/probe`; `?bench` doběhne v xLabu i v `xlab_gen.html?level=0` a vydá JSON |
| A2.3 | **Krok simulace na T460.** Změřeno ve hře: 0,64 až 3,50 ms, z toho fyzika až 3,10 ms; mez je 2 ms a sandbox ukazoval 0,13 až 0,17 ms. Najdi příčinu (počet koliderů a těles, která nespí, kinematická tělesa, něco jiného) a navrhni nápravu. Příčinu dokládej měřením, ne domněnkou; na T460 měří Ondřej přes `?bench`. | v `A_STAV.md` je rozpad kroku pro `complex_7` s počty těles a koliderů a změřený účinek nápravy v sandboxu; číslo z T460 po Ondřejově běhu |
| A2.4 | **Dluhy vlny 1.** Skok v profilu `arena` na nový stisk (Ondřejova volba 3 b). Zablokované dveře (D-025). Oddíl „Rozhraní entit“ v `A_STAV.md` (D-026). Klidný režim podle D-024: ověř ve skutečném Chrome, co udělá Esc u terminálu a jestli se po návratu z pauzy hned vrátí ovládání (D-032), a napiš výsledek. | testy; věta o výsledku zkoušky D-032 |
| A2.5 | **Nová pole základu.** Čti `screen.offset` (smaž odvozování), `JOINT_TRAVEL_SECONDS` z `formats.js` (smaž vlastní tabulku), `interact.seeThrough` a `portals[].passable` v ořezu po buňkách, `materials[].opacity` (průhledné díly kreslené po neprůhledných). | sklo `glass_pane` s `opacity` je ve hře průhledné; mříž se `seeThrough` nezavírá pohled |
| A2.6 | **Textury a sítě: zkouška na jednom kusu** (D-030) se sešnou B. Načti texturu barvy (`albedo`, `uvScale`) a díl `shape: "mesh"` (`.glb`) z balíku; zapečené světlo texturu násobí. Stupeň `low`: textury nejvýš 512 px. Co ti v datech chybí, napiš jako návrh. | jeden prefab se sítí a jeden materiál s texturou ze sešny B jsou ve hře vidět; cena v `?bench` |
| A2.7 | Když zbude: vrstvy světla z xBake (až bude N-001), zbraň v ruce, zvukové zóny, ukládání přes Shell. | podle domluvy v `A_STAV.md` |

## V2.2 Co se změnilo proti vlně 1

- Mez kódu je podle zadání 50 MB (`a_00_build` hlídá 10 MB; nech, je přísnější).
- Rozpočty: nejvýš jedno efektové světlo po pixelech, vyhlazování hran ne, textury ano (`06_ROZPOCTY.md`).
- Hra z vlny 1 drží na T460 ve čtyřech zkoušených pohledech 60 snímků/s. Převod světla se nedělá kvůli rychlosti těchto pohledů, ale kvůli stínům, stálému času snímku a místu pro textury.
- Přijaté návrhy: N-101 až N-107 mají v souboru oddíl „Rozhodnutí“. N-101 a N-102 udělá svodná sešna v základu; do té doby platí tvoje dočasná řešení.
- Svítivosti zlatého vzorku (N-105) se budou ladit až po tvém převodu; napiš do stavu průměrný jas čtyř pohledů po převodu.

---

## Zadání vlny 1 (sešna A): „Projdu xLab“

Znění 2 z 22. 11. 2026, po měření T460 a před startem sešen.

Jsi sešna **A (běh)**. Stavíš engine nad zmrazeným základem 1. Druhá sešna (B) souběžně staví generátory a prefaby; potkáte se jen přes data xSpace.

## 0. Než začneš

1. Připoj repo `OndrejKaplan-DRM/xEngine` (přístup pro zápis), naklonuj, `git checkout -b sesna-a origin/zaklad-1`.
2. Přečti `CLAUDE.md`, `docs/STATE.md`, `docs/02_KONTRAKTY.md`, `docs/01_ARCHITEKTURA.md` (oddíly 2, 4, 5), `docs/06_ROZPOCTY.md`, v `docs/DECISIONS.md` řádky D-022 až D-027.
   Sada Level 1, na kterou se zadání odkazuje (`01_CORE`, `02_SHELL`, `10_CASE_FPS`), je v balíku pro sešny ve složce `level1/` a v repu `OndrejKaplan-DRM/vibe-game-frameworks` ve složce `frameworks/` (veřejné, stačí klon pro čtení).
3. Načti skilly `xengine`, `arena-jadro`, `arena-fyzika`, `headless-webgl-testing`, `debug-and-token-economy`. Aréna je zdroj zkušeností a hodnot, ne kódu ke kopírování: její level je v kódu, tvůj je v datech. Kde se skill `xengine` liší od repa, platí repo.
4. `npm install && npm test`. Musí projít: T0 41, T1 118, T4 46, T2 15, T3 12.
5. Otevři si snímek `test/out/xview_*.png` (vznikne testem): to je level, který máš oživit.

## 1. Cíl

`dist/xlab.html`: hráč se objeví ve startovní místnosti zlatého vzorku, projde chodbou do haly, vyjde schod, schody a rampu 30°, z rampy 50° sklouzne, tlačítkem otevře dveře laboratoře, přehodí páku, otočí ventilem, vysune zásuvku a sedne si k terminálu. V obou profilech (`arena`, `real`).

Level, prefaby ani materiály **nepíšeš do kódu**. Všechno čteš z `__PACK__` (cíl sestavení s `"pack": "../../packs/golden"`).

**Jak to bude vypadat:** ploché barvy materiálů, světlo po vrcholech, žádné textury, žádné stíny v reálném čase. Ve vlně 1 se posuzuje pohyb a interakce, ne krása. Napiš to Ondřejovi k prvnímu sestavení, ať nečeká víc.

## 2. Dvě sešny, ne jedna

Vlna 1 se do jedné sešny nevejde. Počítej s tímto řezem:

| Sešna | Úkoly | Končí |
|---|---|---|
| **A-1** (tahle) | A1.1 až A1.5: nutné minimum | průchozím sestavením: chůze, dveře na tlačítko, lampy na vypínač |
| **A-2** (nová sešna, táž větev `sesna-a`, navazuje podle `A_STAV.md`) | A1.6 a A1.8 | manipulací myší, terminálem, zastíněným světlem a měřením na T460 |

A1.7 (ořez pohledem po buňkách a portálech) je přesunuto do vlny 2 (D-027). Po každém úkolu: testy, `A_STAV.md`, commit, push.

## 2a. Přechod ze znění 1 (pro sešnu, která už běží)

Sešna A začala 22. 11. 2026 ve 02:44 ze znění 1 (`a2ce175`) a dokončila podle něj celou vlnu 1 (A1.1 až A1.8, commit `7d3bec6`). Body 3 a 8 níže psala svodná sešna ke commitu `949d478`; na `7d3bec6` po sloučení a změně importů prošlo 16 z 16 sad. Než budeš pokračovat:

1. `git fetch origin && git merge origin/zaklad-1`. Zkušební sloučení u svodné sešny proběhlo bez konfliktů.
2. **Shell se přestěhoval.** V `src/app/main.js` změň dva importy z `../../vendor/shell/…` na `../shell/…`. V `test/a_00_build.mjs` uprav rozpad velikosti: `vendor/` už neexistuje, Shell je `src/shell/`.
3. **Nejdřív zelená.** Na commitu `949d478` u svodné sešny selhávají 3 sady z 9: `a_12_view` (52 volání kreslení proti 17 dvojicím; snímek proti xView s rozdílem 5,15 z 255), `a_12_world` (29 dávek místo počtu dvojic), `a_13_walk` („šipka dolů couvá“, 0,29 → 0,33). Testy kroku A1.2 zjevně nepočítají s prefaby z A1.4. Oprav testy nebo kód a do stavu napiš, co z toho bylo co. `A_STAV.md` uvádí tyto sady jako prošlé; počty ve stavu piš z posledního běhu celé skupiny, ne z doby, kdy krok vznikl.
4. **Převeď vykreslení na světlo po vrcholech** (A1.2 v tomto znění, D-022). Síť z `brushLightMesh`, vrstvy světla z `lightIrradiance`, `MeshBasicMaterial` s barvou vrcholů. Zásobník `PointLight` a `MeshLambertMaterial` ze `src/render` zmizí, nastavení „počet světel za běhu“ také. Důvod: na T460 stojí 4 bodová světla 14,0 ms a scéna bez výpočtu světel 2,35 ms; tvoje snímky běží s 12 světly.
5. **Vnitřní rozlišení** (D-023): `setPixelRatio(1)` a pevný počet řádků 576, 768, 1080. Teď se velikost obrazu odvozuje z `devicePixelRatio`, který je na T460 1,25. Vyhlazování hran (`antialias`) ve výchozím stavu vypni a dej ho do nastavení; jeho cena na T460 není změřená.
6. **Doplň k A1.4:** oddíl „Rozhraní entit“ v `A_STAV.md` (popiš, co už existuje), zablokovaný pohyb dveří (D-025), světlo dílů po stěnách.
7. Snímky proti xView po převodu světla porovnej znovu. xView svítí po pixelech, shoda proto bude horší než dosud; zapiš novou hodnotu a nastav podle ní práh.
8. Potom `xlab.html?bench` podle A1.8 tohoto znění a klidný režim podle D-024: ve skutečném prohlížeči ověř, co udělá Esc u terminálu a jestli se po návratu hned vrátí rozhlížení myší.

## 3. Úkoly

### A1.1 Kostra aplikace

**Vznikne:** `src/app/main.js`, `src/app/index.html`, `src/app/target.json` (`{ "id": "xlab", "entry": "main.js", "template": "index.html", "pack": "../../packs/golden" }`).

**Jak:**
- Jádro z `src/kernel`: `createEngine()`, systémy s `phase`, `after` a deklarovanými `events`.
- Shell z `src/shell` přes adaptér: `mountShell(adapter, { root })`. Adaptér má `meta { id, title, subtitle, version, tone: 'hard' }`, `state { mode(), onMode(fn) }` (napoj na režim jádra a jeho událost `mode`), `game { newGame(), pause(), resume(), quit() }` a `settings` (deklarace s `apply` a `probe`): zorné pole, citlivost myši, vnitřní rozlišení (576, 768, 1080 řádků; výchozí 768), profil pohybu.
- Vnitřní rozlišení (D-023): `renderer.setPixelRatio(1)` a `setSize(šířka, řádky, false)`; plátno roztahuje CSS. `devicePixelRatio` (na T460 je 1,25) do velikosti obrazu nevstupuje.
- Zámek kurzoru podle `02_SHELL` oddíl 3: žádost jen z gesta uživatele, ztráta zámku při hře = pauza, odmítnutí zámku po Esc (Chrome 1,25 až 2,5 s) se ošetří opakováním při dalším kliku, ne chybou.
- **Vstup odděl od postavy.** Systém vstupu (fáze `input`) zapisuje „záměr“ (pohyb, skok, dřep, použít, držení tlačítka myši, přírůstek pohledu). Postava čte jen záměr. Do téhož záměru zapisuje `__xe.key` a `__xe.look`, takže testy, pozdější záznamy a tvorové jdou stejnou cestou jako hráč.
- `window.__xe` podle kontraktu (`start, sim, key, look, use, get, stats, snapshot, restore`). Všechny testy řídí hru přes něj a krokují `sim`, nečekají na skutečný čas.

**Hotovo, když:** start do menu bez chyby v konzoli; pauza zastaví čítač kroků; každé nastavení projde `apply/probe`; po volbě 576 řádků má vykreslovací plocha přesně tolik řádků.

**Ondřej uvidí:** titulní obrazovku, nastavení, prázdnou scénu.

### A1.2 Statický svět a světlo po vrcholech

**Vznikne:** `src/phys` (Rapier), `src/world` (stavba levelu z dat), `src/render` (sítě, materiály, světlo).

**Jak:**
- Rapier: jedna instance, krok ve fázi `physics`. Kolize z `brushCollider(b)`. Po postavení světa jeden `world.step()`.
- Viditelná geometrie z **`brushLightMesh(b, LIGHT_CELL)`** (základ; plochy kvádru rozdělené na mřížku 0,5 m), sloučená po buňce a materiálu. Atribut `color` jako `Float32` (lineární hodnoty, smějí být nad 1).
- Materiál `MeshBasicMaterial({ vertexColors: true, color: barva materiálu })`. **Ve scéně není `PointLight`, stínová mapa ani `MeshStandardMaterial`** (D-022; na T460 stojí 4 bodová světla 14 ms, scéna bez nich 2,4 ms).
- **Vrstvy světla.** Každé světlo (z `level.lights` i ze součásti `light` entity) má vrstvu: řídký seznam (index vzorku, E) spočtený funkcí **`lightIrradiance`** ze základu. Barva vzorku = okolní člen z `env` + Σ úroveň × barva světla × E; jas povrchu = barva materiálu / π × E (kontrakt). Převod na displej: `ACESFilmicToneMapping` a `toneMappingExposure = env.exposure`, stejně jako xView, aby se snímky daly srovnat.
- Změna úrovně světla: `součet += Δúroveň × vrstva` jen přes vzorky té vrstvy, potom `needsUpdate` u dotčených sítí. Bez alokací.
- V tomto kroku **bez zastínění** (světlo prochází zdí). Je to vědomé zjednodušení; zapiš ho do stavu. Zastínění přijde v A1.8.

**Hotovo, když:** počet koliderů = počet kvádrů s kolizí; volání kreslení ≤ počet dvojic (buňka, materiál); snímek ze startu odpovídá xView; úroveň světla 0 ztmaví vzorky v jeho dosahu a ostatní nezmění; průchod scénou nenajde žádné `Light`.

**Ondřej uvidí:** osvětlený xLab z pevné kamery.

### A1.3 Hráč a profily

**Jak:**
- Kinematický kontrolér Rapieru (kapsle; rozměry, výška oka, výška schodu a úhly svahu jsou data profilu). Pohyb třemi funkcemi podle `10_CASE_FPS` F3 (zrychlení, tření, vzduch), kamera `yaw` a `pitch` (F4).
- Profily `arena` a `real` jako data v `src/play/profiles.js`. Přepnutí za běhu v `?dev`.
- Polohu postavy drž ve vlastním vektoru; `translation()` kinematického tělesa platí až po kroku.

**Hotovo, když:** T1 rychlost po rovině = maximum ±5 % (oba profily); T2 série výskoků v `arena` > 1,2 × maximum; T3 rozběh proti zdi při `timeScale` 5 zůstane v místnosti; T4 schod 0,3 m vyjde, rampu 30° vyjde, z rampy 50° sklouzne; vyjde schodiště na galerii (nohy v 1,5 m).

**Ondřej uvidí:** první sestavení k proběhnutí. Pošli ho hned, s větou o vzhledu z oddílu 1.

### A1.4 Entity a kostry

**Než začneš kódovat:** napiš do `A_STAV.md` oddíl **„Rozhraní entit“**, nejvýš půl strany (D-026): co je entita za běhu (id, prefab, hodnoty kloubů, stav součástí), jak se součást přihlašuje ke svému systému, co přesně jde do uloženého stavu, které události vznikají. Je to největší návrhové rozhodnutí vlny; svodná sešna ho po vlně zmrazí do kontraktů, nebo vrátí.

**Jak:**
- Polohy uzlů jen přes `entityMatrix(e)` × `rigMatrices(prefab, hodnoty)`. Díly `box` a `cyl`.
- Kolize dílů jako kinematická tělesa posouvaná každý krok podle kostry; volná tělesa (bedny) podle součásti `physics`.
- Pohon kloubu (`speed`, `drive`), pružina, tlumení, zarážky.
- **Zablokovaný pohyb (D-025).** Než pohon v tomto kroku díl posune, zkus novou polohu dílu proti kapsli hráče a volným tělesům. Koliduje-li, díl stojí; trvá-li to 0,5 s, vrátí se do polohy, ze které vyjel. Nikoho nedrtí a nikoho netlačí zdí. Formát se nemění, žádný nový výstup.
- Světlo dílů: jedna hodnota na stěnu dílu (u kvádru 6 normál) funkcí `lightIrradiance` ve středu stěny; přepočet jen když se uzel pohnul nebo se změnilo světlo v dosahu.

**Hotovo, když:** bedna ve skladu spadne ze stohu po odstrčení; hodnota kloubu jde číst přes `__xe.get`; poloha křídla dveří při 90° = výsledek `rigMatrices`; dveře se o stojícího hráče zastaví a vrátí.

### A1.5 Použít a spojení vstupů s výstupy

**Jak:**
- Paprsek z oka (Rapier) na kolize dílů s interakcí; dosah je údaj profilu. Nápověda akce z `prompt`.
- Druhy `button`, `switch`, `door`.
- Fronta spojení ve fázi `late`: pevné pole záznamů (cíl, vstup, parametr, zbývající kroky, hloubka řetězu), zpoždění v krocích, `once`, `param`, strop řetězu 32. Fronta je součást uloženého stavu. Cíl `@level` (`checkpoint`, `complete`, `message`).
- Lampy: `turnOn`, `turnOff`, `toggle`, `setLevel` mění úroveň vrstvy světla z A1.2 a barvu svítícího dílu.

**Hotovo, když:** tlačítko v chodbě otevře dveře laboratoře a po 0,3 s se rozsvítí lampa; vypínač ve startu rozsvítí a zhasne; spouštěč v hale zareaguje jen jednou; ulož uprostřed otevírání → nahraj → stejný stav po 120 krocích; 500 stisků tlačítka nezvětší haldu.

**Ondřej uvidí:** druhé sestavení: dveře, vypínače, lampy. Tím končí sešna A-1.

### A1.6 Manipulace a klidný režim (sešna A-2)

**Jak:**
- **Jeden postup pro všechny klouby.** Při stisku tlačítka myši vezmi bod úchopu na dílu (zásah paprsku) a směr, kterým se ten bod při pohybu kloubu hýbe (otočný kloub: osa × rameno; posuvný: osa). Ten směr promítni na obrazovku; pohyb myši podél něj mění hodnotu kloubu. Stejný kód obslouží páku, ventil, zásuvku i křídlo dveří. Po dobu držení se pohled neotáčí. Po puštění přebírá pružina a zarážky.
- **Klidný režim (D-024).** Kamera plynule (pevným krokem, asi 0,3 s) dojede do polohy `station`. **Zámek kurzoru zůstává.** Pohyb myši vede vlastní kurzor po ploše obrazovky ve světě (omezený jejím obdélníkem), klik je „použít“ v místě kurzoru, klávesnice píše do terminálu, Enter vyšle `command`. Odchod klávesou „použít“ nebo krokem vzad. **Esc je všude pauza**: prohlížeč při Esc zámek uvolní vždy a obejít to nejde; po návratu z pauzy hráč dál sedí u terminálu.
- Obsah obrazovky: text kreslený na plátno a použitý jako textura dílu se součástí `screen`.

**Hotovo, když:** ventil na 50 % nastaví lampu laboratoře na poloviční svit; páka do krajní polohy vyšle `on`; odchod od terminálu vrátí kameru přesně na původní místo; za celý pobyt u terminálu nepřijde žádná událost `pointerlockchange`; příkaz a Enter přepne lampu v hale.

### A1.7 Buňky a portály

Přesunuto do vlny 2 (D-027). Ve vlně 1 nic.

### A1.8 Obraz a měření (sešna A-2)

**Jak:**
- **Zastínění vrstev světla.** Paprsek Rapieru ze vzorku (odsazeného 2 cm po normále) ke světlu; narazí-li, E = 0. Počítá se při načtení, jen pro vzorky v dosahu světla. Trvá-li výpočet déle než 100 ms, rozlož ho do víc snímků a ukaž průběh. Pohyblivé díly: jeden paprsek na díl.
- **Přehled F3:** snímky za sekundu, ms kroku po systémech (`E.stats.sys`), volání kreslení, trojúhelníky, velikost obrazu, počet vzorků světla, rychlost v m/s.
- **`xlab.html?bench`:** pevný průlet levelem přes `__xe` (asi 20 s), na konci JSON ke zkopírování (medián a 95. percentil času snímku, ms kroku, volání, trojúhelníky, velikost obrazu, řetězec grafiky). Ondřej ho pustí na T460; je to první měření skutečné hry.

**Hotovo, když:** místo za sloupem v hale je měřitelně tmavší než totéž místo bez sloupu; snímky ze čtyř míst bez černých ploch; `?bench` doběhne a vydá JSON.

## 4. Co nedělat

Zbraně, nepřátelé, zvuk, textury, `.glb`, ukládání do slotů, editor, ořez po buňkách. Žádné změny v `src/kernel`, `src/xspace`, `src/shell`, `packs/golden`, `build.mjs`. Žádný vlastní výpočet geometrie kvádru, dělení ploch, vzorce světla nebo matice kloubu: to všechno je v základu. Žádné světlo po pixelech.

Co ti v Shellu nebo v základu chybí (přemapování kláves, sloty, výstup `blocked`), zapiš jako návrh do `docs/navrhy/` s číslem od N-101.

## 5. Rozpočty této vlny

Podklad je měření T460 v `docs/06_ROZPOCTY.md`.

| Veličina | Mez |
|---|---|
| světla po pixelech, stínové mapy | 0 |
| volání kreslení na pohled | ≤ 400 (xLab bude hluboko pod tím) |
| viditelné trojúhelníky | ≤ 300 tisíc (síť světla xLabu má 32 tisíc) |
| krok simulace | ≤ 2 ms (`E.profile`; v sandboxu orientačně) |
| alokace ve smyčce kroku | žádné |
| soubor | ≤ 600 řádků |

Čísla o snímcích za sekundu z prohlížeče v sandboxu **nepiš jako výkon**; ten změří Ondřej přes `?bench`.

## 6. Pasti, které znám předem

- Rapier `0.21.0` je o verzi novější než v Aréně (`0.20.0`). Názvy API ověř v typech balíku (`node_modules/@dimforge/rapier3d-compat/*.d.ts`), ne z paměti. Zásah paprsku vrací `timeOfImpact`.
- Chybějící `world.step()` po stavbě světa = propad postavy a slepé paprsky.
- Zarážka rychlosti o zeď jen když `got < want * 0.5` (jinak hráč stojí na každém schodu).
- Barva vrcholů je lineární. Hodnoty v sRGB do ní nepatří; převod na displej dělá až výstup vykreslení.
- Sousední kvádry mají každý svou mřížku, na společné hraně nemusí vrcholy lícovat. Kdyby na švech prosvítaly body, zapiš to a pošli snímek; nezáplatuj to posunem geometrie.
- Zbraň ani ruce zatím nekresli, ale vrstvu 1 kamery si pro ně nech volnou.
- Headless: klik do menu může hru spustit se zámkem kurzoru a prohlížeči pak teče paměť. Start vždy přes `__xe.start()`.
- Hodnoty pohybu pro Counter-Strike a Half-Life v Level 1 mají jistotu 3/5. Napiš to do stavu, nelaď je naslepo.
- Jeden prohlížeč naráz; Playwright z `/opt/npm-tools`.

## 7. Co odevzdáš

1. Větev `sesna-a` s kódem a testy `test/a_*` (běží přes `npm run test:a`).
2. `docs/sesny/A_STAV.md` podle šablony: hotovo × neuděláno po úkolech, oddíl „Rozhraní entit“, změřená čísla, co není ověřeno, návrhy, poznatky pro skill.
3. `dist/xlab.html` poslaný Ondřejovi po A1.3 a po A1.5, pokaždé s jednou montáží snímků (ne šest obrázků).
4. Tři až pět otázek pro Ondřeje s volbami a/b.
