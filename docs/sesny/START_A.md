# Zadání sešny A, vlna 2: „Běží to na T460 a je na co se dívat“

Zapsala svodná sešna main 02, 22. 11. 2026. **Tento oddíl má přednost.** Pod ním zůstává zadání vlny 1 (znění 2): úkoly A1.2, A1.4, A1.6 a A1.8 v něm popisují, jak má převod na světlo po vrcholech vypadat.

**Stav větve `sesna-a` ve 23:30 (`5626629`):** A2.1, A2.2 a z A2.4 skok, „Rozhraní entit“ a terminál podle D-024 už na větvi podle commitů jsou. Svodná sešna je neposuzovala; po sloučení se `zaklad-2` nanečisto prošlo 18 sad z 18. Dolož je v `A_STAV.md` proti sloupci „Hotovo, když“ a pokračuj od A2.3. Po sloučení s větví sešny B selže `npm run test:axb` na čtyřech nedosažitelných buňkách (viz `STATE.md`); je to úkol sešny B, ale týká se i tebe, kdyby příčina byla v kolizích.

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
