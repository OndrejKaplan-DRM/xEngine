# Převzetí z Arény v2 (soupis)

Zapsala svodná sešna main 03, 24. 11. 2026 v noci, podle Ondřejovy volby ve 23:38: „(a) Stačí jen Aréna“.

**Zdroj:** `OndrejKaplan-DRM/Arena`, složka `arena2/`, větev `hra`, commit `a04e8c0` („docs: stav v11 (v2.9 stabilní demo)“). Stav hry: `arena2/docs/Arena_v2_stav_v11.md`. Repo je připojené jen pro čtení; svodná sešna do něj nic nezapisuje. Hlavní větev `main` repa je jiný projekt (Údolí); Aréna v2.9 je jen na `hra`.

**Jak číst tento soubor:** Aréna je zdroj hodnot, postupů, dat a zkušeností, ne architektury (pravidlo ze skillu `xengine`, oddíl 6). Kód se nekopíruje: v Aréně je level v kódu, náhoda z `Math.random`, světla po pixelech a volné řetězce událostí, tedy čtyři věci, které xEngine zakazuje. Převádí se: (1) čísla a pravidla do dat xSpace nebo do tabulek ve vlastní složce sešny, (2) postup do nového kódu podle pravidel xEngine, (3) data (modely, zvuky, tvorové) převodníkem do balíku s licencemi.

## 1. Co v Aréně je

88 souborů JS, 19 708 řádků (`src/`), sestavení 11,57 MB JS v jednom HTML (stav v11). Three.js 0.170, Rapier `rapier3d-compat` 0.20, esbuild.

| Oblast | Soubory (řádky) | Obsah |
|---|---|---|
| jádro | `core/engine.js` | registr systémů v pořadí registrace, sběrnice událostí, krok 120 Hz, `snapshot()` / `restore()` |
| fyzika | `physics/physics.js` (122) | jeden svět Rapier; skupiny `WORLD 1, PLAYER 2, MUTANT 4, PROP 8, DEBRIS 16, GRENADE 32`, `groups = (member << 16) \| filter` |
| hráč | `game/player.js` (158) | kinematická kapsle (výška 1,8 m, poloměr 0,35 m), pohyb ve stylu Quake, autostep 0,45 m, svah do 45°, klouzání nad 35°, povrch kroků podle materiálu a zóny |
| zbraně | `game/weapons.js` (701), `projectiles.js` (207), `minigun.js` (217), `flamer.js` (192), `wsnd.js` (93) | 12 zbraní v 9 slotech (pěsti, kladivo, plazma, hromovka, hřebíkomet, mlýnek, granátomet, raketomet, plamenomet, paprskomet, granáty, nálože), hodnoty z xDOOM I6.7.3 a I6.7.5 |
| zbraň v ruce | `game/viewmodels.js` (510), `src/assets/zbrane/*.glb` (13 souborů včetně rukou `ruce.glb`, 1 388 072 B) | modely z Blenderu, záložně procedurální; vrstva 1 kreslená po vymazání hloubky (neprojde zdí) |
| výbuchy | `game/explosions.js` (205) | jediný zdroj události `explosion`, řetězení frontou, impuls `Δv = 18 · power · f / (1 + m/800)`, `f = 1 − d/r`; kryt paprsky; výbuch v tunelu jako rovinná vlna (`k = 1 + 0,75 · ln(2πr²/A)`, omezeno 1,3 až 3) |
| destrukce | `breakables.js` (486), `glass.js` (182), `felling.js` (280), `remnants.js` (89), `props.js` (596) | rozbitný nábytek (trosky 15 až 25 % objemu), okna a rozeta (střepy), kácení stromů a lamp (4 rány kladivem), auta ve stupních poškození, bedny ve 3 stavech, výbušné sudy |
| nepřátelé | `game/enemies.js` (1 250), `nav.js` (250), `waves.js` (124) | typy Skokan, Chrlič, Kolos, Ultrátor, Behemoth R2 a R3, Pavoun, Kulturista, cvičný mutant; navigace mřížkou 1 × 1 m s několika podlažími nad sebou a „flow field“ (Dijkstra od hráče); šířka průchodu pro velké tvory; vlny se spawny mimo dohled |
| tvorové (vzhled) | `creatures/*` (14 souborů), `creatures/data/*.json` (6 souborů, 2 536 446 B) | díly přivázané ke kostem, měkké váhy u kloubů, zapečená okluze do barev vrcholů, celý tvor 1 `SkinnedMesh` = 1 volání; malované atlasy 256 a 512 px; hlavy a těla ze zadání C1 a G2 |
| efekty | `fx/effects.js` (244), `fx/real.js` (548), `fx/flame.js` (151) | fond 250 částic, decaly, ohnivé koule, stopovky, záblesky; „real“ efekty jen v kampani |
| zvuk | `audio/audio.js` (578), `audio/bank.js` (213), `assets/sfx/` | banka 545 klipů CC0 ve 150 událostech z 84 balíčků, Ogg Opus 1 549 723 B; akustika zón (dozvuk podle velikosti prostoru) |
| obraz | `render/*` (7 souborů, 1 255) | retro rozlišení, otřesy kamery, noční obloha s hvězdami (Hipparcos, BSD-3-Clause) a astronomií nad Prahou, hladina vody, procedurální textury s normálovou mapou |
| rozhraní | `ui/*` (1 470) | menu se stavy `menu / playing / paused / dead / ended`, HUD, 13 akcí × 2 vazby, konzole, F3, ukládání (sloty auto / quick / 1 až 3, F7 / F9), mapa na Tab, minimapa |
| svět | `world/**` (6 317) | aréna, Katedrála s tunelem, kampus, Barrandov; **level v kódu** |
| nástroje | `tools/tvor_prevod.cjs`, `behemoth_r2_prevod.cjs`, `validate_assets.py`, `tools/sondy/*`, `tools/regrese/run.sh` | převod tvora z formátu `katedrala-creature 1`, kontrola assetů, sondy paměti, volání kreslení, stínů a kolizí |
| Blender | `assets/blender/zbrane/knihovna.py`, `zbrane.py`, `objekty/*.py` (20 skriptů), `car_wreck.py` | modely zbraní a předmětů; barva vrcholů `COLOR_0`: R okluze, G opotřebení hran, B špína v koutech |
| testy | `test/*` (38 souborů) | testy hry v prohlížeči (`__arena2`), snímky zbraní a mapy, měření zbraně v ruce |

## 2. Co převzít a komu

Priorita: **1** = přímo zaplní mezeru ze zadání (oddíl C `00_ZADANI.md`) a je hotové a odzkoušené; **2** = užitečné, chce úpravu; **3** = později.

### 2.1 Sešna A (běh)

| # | Co | Z Arény | Jak do xEngine | Chybí v základu | Mezera v zadání | P |
|---|---|---|---|---|---|---|
| A-1 | **střelba a zásah** | `weapons.js` `hitscan`, `MELEE` (`jab`, `hook`, `hammer`), `RAIL` (120 dmg, zoom 24°), zásahová koule tvora | nový systém v `src/play` přes Rapier paprsky; hodnoty zbraní jako data | formát zbraně (viz 2.3, Z-1) | „1/ střílení“ | 1 |
| A-2 | **granáty a rakety** | `projectiles.js`, `GREN` (`hand`: rychlost 16, rozbuška 3 s, r 4, 90 dmg; `launcher`: 28, 2,5 s, r 6, 130 dmg), raketomet (20 + zrychlení 14, 100 dmg, r 4,5), výbuch dotykem tvora 0,008 s | dynamická tělesa Rapier, náhoda přes `rngNext` | formát zbraně | „1/ exploze“ | 1 |
| A-3 | **výbuch a impuls** | `explosions.js`: vzorec impulsu, kryt paprsky, řetězení frontou, rovinná vlna v chodbě (paprsky do 24 směrů + podlaha a strop) | událost `combat:explode` (nebo podobně, deklarovaná); impuls do všech dynamických těles; záblesk jako to jediné efektové světlo (D-022) | deklarace událostí boje (Z-4) | „1/ exploze“ | 1 |
| A-4 | **zbraň v ruce** | `viewmodels.js`: vrstva 1 po vymazání hloubky; souřadnice vůči kameře (x vpravo, y nahoru, −z dopředu); `muzzle` | druhý průchod kreslení bez světla po pixelech (barva vrcholů nebo textura); měření zbraně v ruce podle skillu `fps-zbrane-mereni` | formát zbraně (model, poloha v ruce, ústí) | „1/ střílení, zoom“ | 1 |
| A-5 | **zoom** | paprskomet `zoomFov: 24` | zorné pole je už vodorovný úhel (sešna A); zoom = změna úhlu na vstupu | nic | „1/ zoom“ | 1 |
| A-6 | **zvuk za běhu** | `bank.js`: varianta z „pytle“ bez opakování, výška ±, hlasitost ± dB, útlum a dolní propust vzdáleností, vzdálená verze, limity hlasů na událost, kategorii a celkem (krade se nejnižší priorita → nejtišší → nejstarší), `cooldown` s dávkou, pod −48 dB nehraje, ducking ambience při výbuchu, líné dekódování po skupinách; `audio.js`: dozvuk podle velikosti zóny | nový systém v `src/play` nebo `src/app`; zóny dozvuku z buněk levelu (buňky už jsou kvádry vzduchu se známým objemem) | formát zvukové události (Z-2) | zadání zvuk zmiňuje jen u xSearcheru; Aréna ho má hotový | 2 |
| A-7 | **efekty** | `effects.js`: fond 250 částic, decaly, stopovky | instancované částice bez alokací v kroku; decaly do vrstvy nad zapečeným světlem | nic (běh) | „1/ exploze“ | 2 |
| A-8 | **nepřátelé: chování** | `enemies.js` (vnímání, stavy, útoky), `nav.js` (flow field, podlaží, šířka průchodu), `waves.js` | navigace z dat levelu: buňky a portály jsou hotový graf; mřížka 1 m uvnitř buněk | formát tvora (Z-3), formát chování | „F/ nepřátelé, obtížnost“ | 2 |
| A-9 | **tvorové: vykreslení** | `creatures/rig.js`: 1 `SkinnedMesh` na tvora, měkké váhy, zapečená okluze do barev vrcholů | matice kostí z `rigSolve` (N-102 hotovo); světlo tvora po vrcholech ze vzorků okolí | formát tvora (Z-3) | „B/ nepřátelé a jejich pohyby“ | 2 |
| A-10 | **destrukce** | `breakables.js`, `glass.js`, `felling.js`, `remnants.js` | rozbití = výměna prefabu za trosky (data), střepy jako dynamická tělesa do stropu počtu; trvalé trosky jako nastavení | pole „rozbitný“ v prefabu (Z-5) | „B/ zdi s prasklinami“ | 3 |
| A-11 | **ukládání a menu** | `save.js` (sloty, F7 / F9, auto po vyčištěné vlně), `menu.js` (stavy, Esc podle 5a), `input.js` (13 akcí × 2 vazby, `e.code`, tlačítka myši, kolečko) | jádro xEngine `snapshot` / `restore` už má, Shell má menu; převzít sloty a vazby, ne kód | nic | „F/ uložené pozice“ | 2 |
| A-12 | **mapa** | `automap.js` (z registru krabic), `minimap.js` (60 m kolem hráče, 4 px/m) | mapa z buněk a portálů levelu (data už jsou) | nic | „D/ vývojářské nástroje“ (zčásti) | 3 |
| A-13 | **obloha a voda** | `sky.js`, `astro.js`, `stardata.js` (Hipparcos, BSD-3-Clause), `water.js` | pro venkovní levely (kopec, zahrada v xDesigneru) | pole prostředí `env` pro oblohu | „E/ kopec, zahrada“ | 3 |

### 2.2 Sešna B (obsah a nástroje)

| # | Co | Z Arény | Jak do xEngine | Chybí v základu | P |
|---|---|---|---|---|---|
| B-1 | **zvuková banka jako balík** | `assets/sfx/bank.json` (150 událostí, 545 klipů), `bank.b64` (Ogg Opus 1 549 723 B), `CREDITS.md` (84 balíčků CC0 se stránkou a autorem, licence ověřena 20. a 22. 10. 2026), `build_sfx.py` (ořez, přeladění, filtr, vrstvení, dozvuk) | nový balík, každý klip se zdrojem a licencí; `build_sfx.py` jako vzor pro xSearcher (příjem zvuků) | formát zvukové události (Z-2) | 1 |
| B-2 | **předměty z Blenderu** | `src/assets/objekty/*.glb` (20 souborů, 665 608 B: bedna, korouhev, koš, kovadlina, lavice, lékárnička, louč, mříž, munice, oltář, pancíř, pánev, pec, podstavec, řetěz, sud, sutiny, svícen, vozík, zábrana), `car.glb` (70 464 B), skripty `assets/blender/objekty/*.py` | prefaby s díly `shape: "mesh"` (formát i běh je umí, A2.6); kostra a kolider podle xSpace; licence: vlastní dílo z Arény | nic | 2 |
| B-3 | **zbraně z Blenderu** | `src/assets/zbrane/*.glb` (12 zbraní a ruce, 1 388 072 B), `knihovna.py`, `zbrane.py` | modely zbraní pro A-4; kanály barvy vrcholů R/G/B (okluze, opotřebení, špína) jsou hotová vrstva vzhledu pro xForge | formát zbraně (Z-1) | 1 |
| B-4 | **postup modelování** | `knihovna.py`: modeluje se v souřadnicích Three.js, před exportem otočení do Blenderu; díl = objekt s pivotem a nulovou rotací | do xForge jako pravidlo pro díly `.glb` (souhlasí s „kostra před tvarem“ a s osami prefabu) | nic | 2 |
| B-5 | **tvorové** | `creatures/data/*.json` (Behemoth R2 a R3, Pavoun, Ultrátor, těla; 2 536 446 B), `tools/tvor_prevod.cjs` (kontrola kostí, oblastí, indexů, statistiky), atlasy | převodník do formátu tvora; licence ověřit u každého (těla C1 a hlavy G2 vznikly jako zadání pro jiné AI, soubory uvádějí CC0-1.0) | formát tvora (Z-3) | 2 |
| B-6 | **procedurální textury** | `render/textures.js` (513), `creatures/enemytex.js` (502), `realism.js` (normálová mapa a lesk z atlasu, levný podpovrchový rozptyl kůže) | xForge / xSearcher: textury jako soubory balíku (N-111 hotovo), ne kód v běhu | nic | 3 |
| B-7 | **rozbitný nábytek** | `world/breakables_data.js` (podíly trosek: lavice 22,7 %, svícen 20,4 %, stůl 17,2 %, židle 18,2 %) | varianty prefabů „celý / trosky“ | Z-5 | 3 |

### 2.3 Svodná sešna (základ): co musí přibýt do formátu

Každé nové pole podle D-030: nejdřív zkouška na jednom kusu, potom zmrazení ve `formats.js`, validátor se stálými kódy a mutace v T1.

| # | Formát | Zkouška na jednom kusu | Podle Arény |
|---|---|---|---|
| Z-1 | **zbraň** (slot, munice, režim střelby, poškození, dosah, kadence, střela, model v ruce, ústí, zoom) | plazmová puška: hodnoty z `weapons.js`, model `plasma.glb` | `DEFS`, `MELEE`, `GREN`, `RAIL`, `HAMMER` |
| Z-2 | **zvuková událost** (klipy, variace výšky a hlasitosti, vzdálenost, priorita, kategorie, limity hlasů, cooldown, smyčka) | výstřel plazmy a krok po kameni | `bank.json` (`events`, `clips`) |
| Z-3 | **tvor** (kostra se skinováním, klipy pohybu, zásahové koule, životy, rychlosti, útoky) | Pavoun (`pavoun.json`, 356 078 B) | `creatures/rig.js`, `tvor_prevod.cjs`, `enemies.js` |
| Z-4 | **události boje** (zásah, výbuch, smrt, hluk) jako deklarované `oblast:sloveso` | v T0 | Aréna má nejméně 12 volných jmen; nejčastější `noise` (18 míst v kódu) |
| Z-5 | **rozbitnost prefabu** (životy, prefab trosek, střepy) | lavice | `breakables.js` |

Svodná sešna dál: vzor sond z `tools/sondy` (paměť rendereru po fázích, rozpad volání kreslení podle skupin scény, výpis koliderů) do `tools/` základu, až budou potřeba; poučení z `regrese/run.sh` (každý test zvlášť, load average v souhrnu, základ k porovnání podle testu, ne jeden pro všechny).

## 3. Co nepřebírat

| Co | Proč |
|---|---|
| levely `world/**` (6 317 řádků: aréna, Katedrála, kampus, Barrandov) | level v kódu porušuje „obsah jsou data“; rozložení Katedrály a tunelu smí posloužit jako předloha pro generátor `katedrála` v xDesigneru (zadání E/), ne jako kód |
| fond bodových světel 4 až 14, stíny `castShadow` (53×), `shadowMap` | D-022: na T460 žádná stínová mapa a nejvýš jedno efektové světlo; stín nese zapečené světlo |
| materiály `MeshLambertMaterial` (48×), `MeshPhongMaterial` (13×) | v three 0.187 počítá Lambert světlo po pixelech; xEngine kreslí barvou vrcholů |
| pořadí systémů registrací, volné řetězce událostí | xEngine má fáze, `after` a deklarované události; překlep shodí test |
| jeden HTML s vloženými assety | xEngine má balíky s otisky a licencemi |
| registr krabic jako zdroj kolizí a mapy | xEngine má buňky, portály a Rapier ze stejných dat |

## 4. Na co si dát pozor při převodu

- **Náhoda a čas:** `Math.random` 291× ve 26 souborech, `setTimeout` 20× v 9, `Date.now` 3×. V herní logice xEngine nesmí být ani jedno; náhoda přes `rngNext`, čas přes pevný krok. Hodnota převzatá „1:1“ ze vzorce s `Math.random` se proto musí přepsat a znovu ověřit testem.
- **Verze:** Rapier 0.20 → 0.21 a Three.js 0.170 → 0.187. Názvy API ověř v typech balíku, ne podle kódu Arény.
- **Rozměry postavy:** Aréna má kapsli s poloměrem 0,35 m a výškou 1,8 m, xEngine totéž v `src/xspace/body.js` (D-040) plus odstup kontroléru 0,02 m. Autostep Arény 0,45 m odpovídá schodu xEngine 18 palců = 0,4572 m (`BODY.stepHeight`); ber hodnotu z `body.js`.
- **Hodnoty zbraní** pocházejí z xDOOM I6.7.3 a I6.7.5 a byly laděné na Arénu (svižná mutace). Pro profil `real` (Half-Life, Counter-Strike) je potřeba vlastní sada; neber jednu tabulku pro oba profily.
- **Výkon:** čísla v dokumentech Arény (volání kreslení 161 až 381 při limitu 400, start, paměť) nejsou z T460 ani z xBench. Pro xEngine platí jen měření `?bench` na Ondřejově stroji.
- **Licence:** zvuky mají doloženou CC0 u každého balíčku. U tvorů a hlav, které vznikly jako zadání pro jiné AI (GPT, Gemini), ověř a zapiš původ v poli licence; validátor `license.*` je bez toho nepustí.
- **Testy Arény** jsou v prohlížeči a pomalé (regrese kolem 60 minut podle `01_ARCHITEKTURA.md`, oddíl 7). Převzít scénáře zkoušek (co se ověřuje), ne testy samotné.

## 5. Navržené pořadí

1. Svodná: Z-4 události boje a Z-1 formát zbraně se zkouškou na plazmové pušce (data od sešny B, běh od sešny A).
2. A: A-1 střelba, A-4 zbraň v ruce, A-5 zoom, A-3 výbuch; B: B-3 zbraně a B-2 předměty jako prefaby.
3. Svodná Z-2 + B-1 zvuková banka + A-6 zvuk za běhu.
4. Svodná Z-3 + B-5 tvorové + A-8 a A-9 nepřátelé (stojí na N-102, hotovo, a na N-010, víc interakcí v prefabu, nerozhodnuto).
5. Zbytek (A-7, A-10 až A-13, B-6, B-7) podle zadání E/ a F/.

Dokud Ondřej pořadí nepotvrdí, je to návrh svodné sešny, ne rozhodnutí.
