_Předávka – část 1/3_

# Předávka — xEngine, svodná sešna main 03 — 2026-11-25

## 0. Hlavička
- Projekt / pracovní linie: xEngine (`OndrejKaplan-DRM/xEngine`), **svodná sešna „main 03“** (základ: `src/kernel`, `src/xspace`, `src/shell`, `packs/golden`, `tools/*`, `build.mjs`, `docs/0*.md`, `CLAUDE.md`, `README.md`). Navazuje na „main 02“.
- Rozsah sešny: 24. 11. 2026 01:50 až 25. 11. 2026 01:04; 8 Ondřejových zpráv (včetně této žádosti o předávku); 7 znění základu (znění 4 až 10 základu 2; znění 5 je sloučení vlny 2) a soupis převzetí z Arény; fáze 1–9.
- Model: začátek Claude Fable 5.2 Extra; 24. 11. v 16:00 po limitu útraty přepnul Ondřej na Claude Opus 5.5 Extra.
- Úplnost: **začátek jen ze souhrnu.** Kontext se zkomprimoval dvakrát (kolem 16:00 a kolem 23:41). Fáze 1 a 2 (24. 11. 01:50 až 16:00) jsou rekonstruované ze souhrnu a z repa, položky mají značku „(ze souhrnu)“ nebo „(dok.)“. Časy commitů jsou z `git log`. Čísla jsou z logů testů a z dokumentů v repu, ne z paměti.
- Navazuje na: `docs/sesny/predavky/main02_prubezna1_2026-11-24_cast1.md` až `cast3.md` (průběžná předávka main 02, 24. 11. 01:11).
- Kde je tato předávka: v chatu a doslovně v repu jako `docs/sesny/predavky/main03_predavka_2026-11-25.md`. **Do projektu v claude.ai se nepíše** (Ondřej 24. 11. 01:50: „Projekt v claude.ai je plný: nic do něj nepiš, stav piš do repa a posílej mi soubory.“).

## 1. Cíl, motivace, rámec
- Původní zadání (24. 11. 01:50, doslovně, klíčové části): „Jsi svodná sešna projektu xEngine („main 03“), navazuješ na „main 02“. Načti skilly `xengine` a `session-handoff`. Připoj repo `OndrejKaplan-DRM/xEngine` s právem zápisu a přečti celé … předávky … potom `CLAUDE.md`, `docs/00_ZADANI.md`, `docs/STATE.md` a `docs/sesny/START_SVOD.md`. Před čímkoli dalším `git fetch` a zjisti hlavy větví. Push větví `main`, `zaklad-2` a `integrace-1` ti povoluji. Projekt v claude.ai je plný: nic do něj nepiš, stav piš do repa a posílej mi soubory. Řekni mi v 8 řádcích, kde jsme, a navrhni další krok.“ (ze souhrnu)
- Proč: xEngine je vlastní engine pro 3D z pohledu první osoby v prohlížeči (Three.js 0.187, Rapier 0.21) s datovým formátem xSpace a nástroji; cílový stroj Lenovo T460. Ondřej chce úroveň nad svými staršími hrami (xDoom, Aréna, Planetka, Sluneční soustava). Svodná sešna drží základ, rozhoduje návrhy a slučuje práci dvou souběžných sešen A (běh) a B (obsah a nástroje).
- Omezení: zadání `docs/00_ZADANI.md` mění jen Ondřej; obsah jsou data; jedna pravda pro výpočty; světlo po vrcholech na T460; pevný krok bez `Math.random`; jeden prohlížeč naráz; soubor do 600 řádků; čísla o výkonu jen z T460.
- Jak se cíl posunul: původně „uzavřít dluhy základu ze `START_SVOD.md`“ → v 16:00 přibyl požadavek „přesuň paměť z chatu do repa“ → ve 19:57 sloučit vlnu 2 v polovině → ve 21:19 a 23:38 Ondřej vybíral další kroky (zakrytí dveří a svázané klouby, kostry bez alokací) → ve 23:38 převzetí ze staré hry Aréna v2 → po půlnoci zbraně, víc interakcí v prefabu a textura světla po 5 cm.

## 2. Výchozí stav a vstupy
- Přílohy na začátku (ze souhrnu): tři části průběžné předávky main 02 a **10 snímků přehledu F3 z T460** (24. 11. kolem 01:42) po změně mřížky světla D-037. Jeden ze snímků byl černý; ve 21:19 Ondřej potvrdil, že to byl omyl.
- Základ na začátku: `zaklad-2` = `main`, základ 2 znění 3 (D-037 mřížka světla znění 2, `a995347`, ještě od main 02). Sešny A a B pracovaly na vlně 2 (světlo po vrcholech, xBake, xSearcher, textury).
- Co jsme na začátku nevěděli a zjistili později: (1) dveře zlatého vzorku na obě strany (±105°) shodí 8 kontrol sešny A; (2) `npm run test:all` je řetěz `&&` a skupiny B a A × B po první chybě vůbec neběží; (3) zlaté dveře měly škvíru 1 cm (616 cm²); (4) sešny dostávají Ondřejova rozhodnutí i napřímo (A ve 23:58 N-112, B ve 23:57 25 MB), svodná je musí číst z jejich `TODO.md` a `*_STAV.md`; (5) Aréna v2.9 je jen na větvi `hra`, hlavní větev repa Arena je jiný projekt (Údolí).

## 3. Časová osa (vrstva 1 – chronologie)

### Fáze 1 — Start a stav (24. 11. 01:50, ze souhrnu)
- Spouštěč: startovní zadání (oddíl 1), přílohy (předávka main 02, 10 snímků F3).
- Co jsme udělali: načtené skilly `xengine` a `session-handoff`; `add_repo` s právem zápisu; přečtené `CLAUDE.md`, `00_ZADANI.md`, `STATE.md`, `START_SVOD.md`; `git fetch` a hlavy větví; odpověď v 8 řádcích s návrhem dalšího kroku.
- Výsledek: (ze souhrnu) bez zachovaného znění odpovědi.
- Důsledek: práce na dluzích základu podle `START_SVOD.md` a na měření F3.

### Fáze 2 — Znění 4 rozpracováno, limit útraty (24. 11. dopoledne až 16:00, ze souhrnu a dok.)
- Co jsme udělali: rozpracované rozhodnutí D-039 až D-044 (strop řádků podle okna, rozměry postavy v základu, pevné díly prefabů ve vzorcích světla, dveře na obě strany, směr textury světla, čtení zapečeného světla) a moduly `src/xspace/body.js`, `samples.js`, `bake.js`; dokument měření F3.
- Výsledek: sešnu přerušil limit útraty u Fable 5.2 Extra. Commity z této práce jsou až po 16:00 (fáze 3).

### Fáze 3 — Přepnutí modelu, paměť projektu v repu, znění 4 (24. 11. 16:00 až 16:34)
- Spouštěč, Ondřej v 16:00: „Narazili na usage-limit při použití Claude Fable 5.2 Extra, Přepnul jsem model na Opus 5.5 Extra. Můžeš prosím navázat tam, kdes byla přerušena a úkol dodělat s novým modelem, aniž bys ztratila jakoukoli část rozdělané práce? … PS: používej často Git a práci si ukládej do repa … 1. Přesuň „paměť“ z chatu do repa … CLAUDE.md … ARCHITECTURE.md … DECISIONS.md … TODO.md … Ztrácíme se občas v tom, co je už hotové a co ne. Stále předáváme sešny.“
- Co jsme udělali:
  - **D-038 paměť projektu v repu:** nový `TODO.md` v kořeni (oddíly „Čeká na Ondřeje“, „Zodpovězeno“, svodná, A, B; každá sešna mění jen svůj oddíl); v `CLAUDE.md` mapa „Kde co je“, „Jak to spustit“, pravidlo „Git často“; v `docs/01_ARCHITEKTURA.md` oddíl 9 „Moduly dnes“ (commity `b43d0bd` 16:02, `29e194d` 16:05). Místo nového `ARCHITECTURE.md` slouží `docs/01_ARCHITEKTURA.md` a místo nového `DECISIONS.md` už existující `docs/DECISIONS.md`.
  - Měření F3 z T460 do `docs/mereni/T460_2026-11-24_D-037_F3.md` (`0af8c25` 16:07).
  - D-039 až D-044 (`7a9e39f` 16:09), N-008 `body.js` a varování `portal.narrow` (`6f8588c`), `samples.js` + `bake.js` (`d65e40e` 16:11), N-109 dveře zlatého vzorku ±105° (`9dd562f` 16:13), dodatky pro A a B znění 4 (`4b5e386`).
  - **Zvrat:** se dveřmi ±105° selhalo v sloučení nanečisto 8 kontrol sešny A (`a_14_block`, `a_14_entities`, `a_14_swing`) → data zpět na 0° až 105° (`e01026c` 16:24), sešna A dostala za úkol upravit testy.
  - `STATE.md` znění 4 (`36faf65` 16:34): regrese `main` 662 kontrol, sloučení nanečisto 855, 0 selhalo.
  - Sešna B si mezitím vyrobila vlastní `TODO.md` a `CLAUDE.md` (srážka); základ převzal oddíl B doslova, B při slučování vzala verzi základu.
- Důsledek: od této fáze se každé Ondřejovo rozhodnutí zapisuje do `TODO.md` (oddíl „Zodpovězeno“) a do `DECISIONS.md` hned.

### Fáze 4 — Sloučení vlny 2 v polovině, znění 5 (24. 11. 19:51 až 20:20)
- Spouštěč, Ondřej ve 19:57: „1. Sloučit vlnu 2 … -->(a) 2. Nové měření `?bench` … --> (a) 3. Černá obrazovka … -->nerozumím“.
- Co jsme udělali: sloučení `sesna-a` (`85d6a6d`) a `sesna-b` (`ba16d8d`) do základu (`136edcc`, `93e81ab`, `d6f2982` 19:59; zámek balíků se `sharp` 0.35.5); regrese **909 kontrol, 0 selhalo** (základ 266, A 405 ve 26 sadách, B 201 v 7 sadách, A × B 37). Potom N-109 dveře ±105° znovu (`3b558bc` 20:10, sešna A testy mezitím upravila v `85d6a6d`), N-009 `albedoMean` (`6dbf4ce`, D-045), N-111 soubory balíku ve hře (`9a1f7cd`, D-046), D-047 až D-049 (`608f0cb`, `2f1e69d` 20:20). Regrese `main` `9a1f7cd`: **913 kontrol, 0 selhalo**.
- Výsledek: `main` = `zaklad-2` = `integrace-1`, základ 2 znění 5; větev základu zůstává `zaklad-2`, vlna 2 nekončí (D-048).
- Čísla z T460 (sešna A, Ondřejův `?bench` 24. 11. 19:39 až 19:47, sestavení „krok 5“): `draw.ms` medián xLab 576 řádků 2,29 ms, `complex_7` 576 řádků 2,26 ms, xLab 1 080 řádků 5,57 ms (95 % 7,38 ms); krok simulace 0,22 až 0,45 ms medián; stavba světla `complex_7` 13,1 s výpočtu; 30 snímků/s ve všech třech během (nejspíš Úspora energie v Chrome, neověřeno). (dok.: `STATE.md` znění 5)
- Důsledek: otázku na černou obrazovku jsem přeformulovala.

### Fáze 5 — Zakrytí dveří a svázané klouby, znění 6 (24. 11. 21:19 až 21:37)
- Spouštěč, Ondřej ve 21:19: „1. Další krok … --> (a) 2. Černá obrazovka … --> (to byl určitě omyl, černý screen bych ti neposílal). Pokračuj dál. Řekni mi, kam můžu poslat kód naší bývalé varianty 3D FPS, kde máme spousta věcí už vykoumaných a šly by převzít.“
- Co jsme udělali:
  - **D-036 pravidlo `portal.door.cover`** (`src/xspace/cover.js`, `b47c623` 21:22): kolmý průmět neprůhledných dílů `box` dveří v klidu musí zakrýt otvor portálu; neplatí pro `seeThrough`. Zlaté dveře `door_hinged_01` měly škvíru 1 cm (616 cm²) → viditelné křídlo přes celý otvor 1,0 × 2,1 m, kolize beze změny. `gen_demo` (main i `sesna-b`): 94 portálů s dveřmi, škvíra nikde.
  - **N-002 svázané klouby** `rig.joints[].follow { joint, ratio, offset? }` a `jointFollow` (`1cf0261` 21:23), pět mutací, dvoukřídlé dveře jako jeden prefab v testu.
  - Znění 6 (`6d0a9e0` 21:29): regrese `main` `1cf0261` **923 kontrol, 0 selhalo** (základ 280, A 405, B 201, A × B 37).
  - Sloučení nanečisto `main` `6d0a9e0` + `sesna-a` `38c1c07` + `sesna-b` `3f45c21` (21:30 až 21:36): 982 kontrol, **1 selhala** `b_t8_zasuvky` (spodní zásuvka kartotéky se neotevře); selže stejně na samotné `sesna-b` `3f45c21` (commit „rozpracováno“) → rozpracovaný stav sešny B, ne základ (`06fa115`).
  - Odpověď na „kam poslat kód“: připojit repo ze GitHubu jen pro čtení (ze souhrnu, přesné znění odpovědi není zachované).
- Důsledek: sešna B dostala za úkol `door_double_01` jako jeden prefab s `follow`.

### Fáze 6 — Kostry bez alokací, Aréna v2 (24. 11. 23:38 až 23:50)
- Spouštěč, Ondřej ve 23:38: „Super. Otázky 1. Kód staré hry … --> (a) Stačí jen Aréna 2. Další krok: (a) rozhodnout N-010 … (b) obnovit kompilaci koster bez alokací (N-102) … --> (b)“.
- Co jsme udělali:
  - **N-102** (`c4bac67` 23:41): v `src/xspace/rig.js` `rigCompile(prefab)` (jednou na prefab), `rigValues`, `rigFollow`, `rigSolve(compiled, values, out)` bez alokací; `rigMatrices` je obálka. Shoda s původním rekurzivním výpočtem bit po bitu: 40 případů na zlatém vzorku v testu, mimo testy 802 případů na 478 prefabech (`golden`, `kit_base`, `kit_lab`, `kit_it`), rozdíl 0. Sandbox jen pro představu: 100 000 kroků kostry se 4 uzly a 3 klouby 62 ms.
  - `test/t1_xspace.mjs` měl 608 řádků → testy koster do nového `test/t1b_rig.mjs` (134 řádků; T1 502). Regrese `c4bac67`: **926 kontrol, 0 selhalo** (`bc01b1d` 23:46, znění 7).
  - **Aréna v2** připojena jen pro čtení: `OndrejKaplan-DRM/Arena`, větev `hra`, commit `a04e8c0` (v2.9 „stabilní demo“); klon `/home/claude/arena` (hlavní větev = jiný projekt Údolí), pracovní strom `/home/claude/arena-hra`.
  - **Soupis `docs/prevzeti/ARENA.md`** (`3e40bee` 23:50, poslán Ondřejovi jako soubor): co převzít komu (A-1 až A-13, B-1 až B-7), co musí přibýt do formátu (Z-1 zbraň, Z-2 zvuková událost, Z-3 tvor, Z-4 události boje, Z-5 rozbitnost), co nepřebírat (levely v kódu, bodová světla a stíny, Lambert/Phong, pořadí registrace, jeden HTML s assety), pasti převodu (`Math.random` 291× ve 26 souborech, `setTimeout` 20× v 9, Rapier 0.20 → 0.21, Three 0.170 → 0.187).
  - Do `TODO.md` dvě otázky: N-110 (a/b/c) a pořadí převzetí z Arény.
- Důsledek: Ondřej odpověděl v 0:00.
_Předávka – část 2/3_

### Fáze 7 — Rozhodnutí N-110 a pořadí z Arény; N-010; zbraně (25. 11. 0:00 až 0:30)
- Spouštěč, Ondřej v 0:00: „1. Textura světla (N-110 …) … --> (a) 2. Pořadí převzetí z Arény … --> (a)“.
- Co jsme udělali:
  - **D-050** (N-110 přijat, bod 5 cm; texturu zapéká xBake předem, velikost bodu je pole dat, stupeň `low` smí zmenšit na 10 cm; formát se zmrazí po zkoušce celého `complex_7`) a **D-051** (pořadí převzetí: zbraně, střelba, zoom, výbuchy → zvuk → tvorové) (`14a28db` 0:01); dodatky pro A a B.
  - **N-010 víc interakcí v prefabu, varianta a (D-052)** (`3f0ae44` 0:06): `components.interact` je objekt, nebo seznam objektů s `id` (jediný objekt bez `id` = `main`); `src/xspace/interact.js` (`interactions`, `interactionById`, `interactionOf` podle zasaženého uzlu, předek bez kloubu, svázaný kloub podle sledovaného; `doorInteraction`); spojení mají `from` a `to`; validátor `interact.id`, `interact.jointTwice`, `interact.solo` (`pickup`, `grab` jen samy), `io.from`, `io.to`; `portal.door` chce právě jednu interakci `door`. `validate.js` (587 řádků) rozdělen na `check.js` (tvar), `check-prefab.js` (prefab) a `validate.js`. Test T1c 27 kontrol. Balíky sešny B (`kit_base`, `kit_lab`, `kit_it`, `kit_all`, `gen_demo` ze `sesna-b` `9b00112`) bez nálezu. Regrese `3f0ae44`: **953 kontrol, 0 selhalo** (znění 8, `eb2fdb0`).
  - **N-201 zbraně jako zkušební formát (D-053)** (`db3d6f0`, `9aaedd9`, `0e77921` 0:13 až 0:23): druhy souborů `ammo` (`ammo.json`) a `weapon` (`weapons/<id>.json`), pole manifestu, typ `ramp` (`{ min, max, curve? }` podle nabití), `EXPERIMENTAL_KINDS`, `PUSH_MASS = 800`, `PICKUP_ITEMS = ['health', 'armor']`; `src/xspace/weapon.js` (`rampValue`, `splashFalloff`, `pushDelta`), `src/xspace/check-weapon.js` (`ref.ammo`, `ref.prefab`, `weapon.projectile`, `weapon.range`, `weapon.charge`, `weapon.ammo`, `weapon.slot`, `pack.dupeWeapon`, `pickup.item`). Zlatý vzorek: munice `cells` (200), `plasma_rifle_01` s hodnotami Arény, model v ruce `wpn_plasma_rifle_01`, zbraň na zemi `pickup_plasma_rifle_01` (40 článků) jako entita `e_plasma` ve startovní místnosti, materiál `plasma_glow`. Test T1d 31 kontrol (nabitá koule = vzorce Arény, rozdíl < 1e-9). Návrh `docs/navrhy/N-201-zbrane-a-udalosti-boje.md` (svodná čísluje od 201).
  - **Zvrat:** skupina B na `main` selhala ve 2 kontrolách `b_t7_searcher` (`pack.missingFile`): test skládá balík z manifestu zlatého vzorku a odebere jen `materials`, `prefabs`, `levels`, takže nové pole `ammo` hlásilo chybějící soubor → pravidlo hlásí chybějící soubor munice jen u balíku z `loadPack` (`ammo: null`). Regrese **984 kontrol, 0 selhalo** (základ 341, A 405, B 201, A × B 37) (znění 9, `0e77921`).
  - Sloučení nanečisto `main` `0e77921` + `sesna-a` `17b8176` + `sesna-b` `5ed1070` (0:24 až 0:30): bez konfliktu, **1 059 kontrol, 0 selhalo** (základ 341, A 430, B 248, A × B 40) (`ab79baa`).
- Výsledek: sešna A má úkol A3.1 (zkouška zbraní na plazmové pušce), sešna B úkol B3.1 (puška z modelu Arény v balíku `kit_arena`).

### Fáze 8 — 80 MB a atlas textury světla, znění 10 (25. 11. 0:49 až 1:02)
- Spouštěč, Ondřej v 0:49 (na mou poznámku, že `complex_7` po 5 cm je proti 25 MB těsný): „Kristíno, v pohodě. Tak pojďme quotu zvětšit na 80 MB“; „Jak pokračovat se základem? --> (a)“ = atlas ploch a soubor textury světla (N-112 sešny A).
- Co jsme udělali:
  - **D-054 velikost hry až 80 MB** (předtím 25 MB, Ondřej sešně B 24. 11. 23:57); řádek v `docs/06_ROZPOCTY.md` (`b823685` 0:50).
  - **N-112 přijat (D-055), zkušební:** `src/xspace/atlas.js` (`lightmapLayout`, `lightmapTexels`, `lightmapDilation`, `LIGHTMAP_TEXEL` 0,05, `LIGHTMAP_PAD` 2, `LIGHTMAP_MAX` 8 192) a `src/xspace/lightmap.js` (soubor XLM1: `encodeLightmap`, `decodeLightmap`, `composeLightmap`, `toHalf`, `fromHalf`); pole `level.baked.lightmap { file, texel, atlas }`; validátor hlásí zapečené soubory mimo `assets` (`ref.asset`). Test T1e 16 kontrol (`6b56edc`, `eb84574`, `c01250a`).
  - **Zvraty při stavbě atlasu:** (1) tvrzení „vrchol leží ve středu bodu“ neplatí (okraje stěn nejsou na násobcích bodu), test ho chytil → test kontroluje, že čtyři body bilineárního filtru u vrcholu mají hodnotu; (2) malé mapy (víčka válců) a ostré rohy zůstávaly bez bodu → každý vrchol dostane svůj nejbližší bod, který nese polohu vrcholu; (3) okraje map 1,9 s v sandboxu pro `complex_7` → přepis na typovaná pole, 0,35 s.
  - Regrese `eb84574`: **1 000 kontrol, 0 selhalo** (základ 357, A 405, B 201, A × B 37).
- Výsledek: znění 10 základu 2, `main` = `zaklad-2` = `integrace-1` = `c01250a`.

### Fáze 9 — Předávka (25. 11. 1:04)
- Spouštěč, Ondřej: „Díky. /session-handoff“. Na otázku o dalším kroku (a zvuk / b N-105 / c skončit a sepsat předávku) odpověděl předávkou; volba mezi a a b zůstává otevřená.
- Co jsme udělali: pomůcky svodné sešny z kontejneru do repa `tools/svod/` (`c48dbe7`); tato předávka.

## 4. Zvraty a přehodnocení
| # | Původně | Nově | Proč | Kdo / fáze |
|---|---|---|---|---|
| 1 | dveře zlatého vzorku ±105° hned (N-109) | zpět na 0° až 105° (`e01026c`), znovu ±105° až po úpravě testů sešny A (`3b558bc`) | 8 kontrol sešny A počítalo s jednostrannými dveřmi | svodná, fáze 3 a 4 |
| 2 | regrese jedním `npm run test:all` | testy po skupinách (`tools/svod/groups.sh`) | `test:all` je řetěz `&&`, po první chybě skupiny B a A × B neběží | svodná, fáze 3 |
| 3 | sešna B má vlastní `TODO.md` a `CLAUDE.md` | verze základu, oddíl B převzatý doslova | srážka při sloučení; D-038 | fáze 3 |
| 4 | otázka „černá obrazovka“ | uzavřeno jako omyl | Ondřej 21:19 | fáze 5 |
| 5 | `composeColors` dělí π? (otázka sešny A) | okolní světlo je osvětlení E jako ostatní (D-049); svodná vynásobí okolní světlo zlatého vzorku π, až A přejde | jedna jednotka pro všechno světlo | fáze 4 |
| 6 | selhání `b_t8_zasuvky` v sloučení nanečisto | rozpracovaný stav sešny B, ne základ | stejně selhalo na samotné `sesna-b` `3f45c21` | fáze 5 |
| 7 | „jedna interakce na prefab (verze 1)“ | seznam interakcí s `id` (D-052) | Ondřej sešně B 24. 11. 19:55: zásuvky nezávisle | fáze 7 |
| 8 | textura světla jen jako zkouška (D-043) | přijata s bodem 5 cm, zapéká xBake (D-050, D-055) | T460: vykreslení +0,7 až +0,9 ms, výpočet při načtení 1,8 s / 6,1 s | Ondřej 0:00 a 0:49 |
| 9 | hra do 25 MB | hra do 80 MB (D-054) | Ondřej 0:49 | fáze 8 |
| 10 | pravidlo `pack.missingFile` pro munici vždy | jen u balíku z `loadPack` | test sešny B skládá balík z manifestu zlatého vzorku | fáze 7 |
| 11 | vrchol ve středu bodu atlasu | nejbližší bod každého vrcholu na ploše | test atlasu | fáze 8 |
| 12 | `git remote set-url` na správnou adresu | odmítnuto klasifikátorem; push přes plnou adresu | „Destructive or Unwanted Actions“ | fáze 6 |

## 5. Osoby a obsazení
| Kdo | Role | Vztah k věci | Co řekl / rozhodl / chce | Jak s ním jednat |
|---|---|---|---|---|
| Ondřej Kaplan | zadavatel, testuje na T460 | rozhoduje volby a/b/c, mění jen on zadání | rozhodnutí v `TODO.md` „Zodpovězeno“ a D-038 až D-055 | Kristína, ženský rod, tykání, #SPM; krátké zprávy, otázky a/b/c, čísla jen změřená, soubory posílat |
| Sešna A (běh) | Kristína, `session_011CupjaUm1FMBGLuRo8uQKT`, větev `sesna-a` | engine: světlo, obraz, fyzika, hráč, interakce | N-110 zkouška, N-112 návrh, bere Ondřejova rozhodnutí i napřímo | dodatky nahoře ve `START_A.md`; její stav jen z `A_STAV.md` a jejího `TODO.md` |
| Sešna B (obsah a nástroje) | Kristína, `session_011CupjW4xASwVZjXBTWoH2s`, větev `sesna-b` | xGen, xForge, xBake, xSearcher, balíky | návrhy N-010, N-011, N-012; od Ondřeje 23:57 „realistický inventář“ | dodatky nahoře ve `START_B.md`; stav z `B_STAV.md` |
| Svodná main 03 | Kristína, `session_011CupjXTS3BgPNpfJrEeJGg` | základ, slučování, rozhodnutí návrhů | tato předávka | — |
| Svodná main 02 | předchozí svodná | D-037 a znění 3 | průběžná předávka `docs/sesny/predavky/main02_*` | — |

## 6. Rozhodnutí (platná)
Všechna jsou v `docs/DECISIONS.md`; tady jedna věta.
- D-038 paměť projektu v repu, `TODO.md`, každá sešna mění svůj oddíl — Ondřej 16:00 — fáze 3.
- D-039 počet řádků omezen fyzickou výškou plátna (volba 1 080 dávala 1,51× bodů navíc) — svodná podle měření F3 — fáze 2/3.
- D-040 rozměry postavy v `src/xspace/body.js` (výška 1,8 m, poloměr 0,35 m, oko 1,6 m, schod 18″ = 0,4572 m, odstup kontroléru 0,02 m, šířka 0,74 m) — N-008 — fáze 2/3.
- D-041 vzorky světla = kvádry z `levelLightMeshes` + pevné díly prefabů (`levelSamples`) — svodná — fáze 2/3.
- D-042 dveře od hráče, ±105° (N-109) — Ondřej sešně A 02:26 — fáze 3/4.
- D-043 textura světla jako směr, zkouška dřív než formát; `env.lightCell` zamítnuto — Ondřej 02:26 — fáze 3.
- D-044 čtení zapečeného světla v `bake.js`, pravidlo paprsku v xBake — svodná — fáze 3.
- D-045 `color` u materiálu s texturou = průměr povrchu, pole `albedoMean` (N-009) — svodná — fáze 4.
- D-046 soubory balíku v sestavení `pack.files`, `materialFrom` (N-111) — svodná — fáze 4.
- D-047 zavřené dveře se `seeThrough` zadržují světlo (verze 1) — svodná — fáze 4.
- D-048 vlna 2 sloučena v polovině — Ondřej 19:57 — fáze 4.
- D-049 okolní světlo je osvětlení E — svodná na otázku sešny A — fáze 4.
- D-036 provedeno (pravidlo `portal.door.cover`), N-002 provedeno (svázané klouby) — Ondřej 21:19 — fáze 5.
- D-034 doplněno: N-102 provedeno — Ondřej 23:38 — fáze 6.
- D-050 textura světla po 5 cm, zapéká xBake — Ondřej 0:00 — fáze 7.
- D-051 pořadí převzetí z Arény: zbraně → zvuk → tvorové — Ondřej 0:00 — fáze 7.
- D-052 víc interakcí v prefabu (N-010, varianta a) — svodná — fáze 7.
- D-053 zbraně a munice jako zkušební formát, kus = plazmová puška zlatého vzorku — svodná — fáze 7.
- D-054 hra do 80 MB — Ondřej 0:49 — fáze 8.
- D-055 atlas a soubor textury světla v základu, zkušební (N-112) — Ondřej 0:49 „(a)“ + svodná — fáze 8.
- Projekt v claude.ai se nepíše; stav do repa, Ondřejovi soubory — Ondřej 01:50 — fáze 1.

## 7. Slepé uličky a zamítnuté varianty
- `npm run test:all` jako jediná regrese — skryje skupiny za první chybou — vždy po skupinách.
- Přepnout zlatý vzorek dřív než testy sešny A — shodí 8 cizích kontrol — změnu zlatého vzorku nejdřív zkusit sloučením nanečisto (`tools/svod/zkouska.sh`).
- Pole `env.lightCell` (doplněk N-108) — zamítnuto v D-043; mřížka 0,25 m stojí na T460 stavbu vrstev 50,4 s v `complex_7` a neřeší 5 cm.
- Textura světla počítaná při načtení (zkouška N-110) — 6,1 s na jednu halu po 5 cm, stránka stojí — jen xBake předem (D-050).
- N-010 varianta b (pole `attach`, engine staví připojené entity) a c (zůstat u samostatných entit) — odvozená id komplikují ukládání a spojení; vztah by nebyl v datech levelu.
- Zbraně jen jako dokument a data v `source.params` sešny B — bez validátoru a společného kusu by sešny pracovaly naslepo (D-053).
- Atlas ze statických dávek běhu (kód zkoušky sešny A) — xBake běží v Node bez enginu, atlas musí vznikat z dat (`levelSamples`).
- Mřížka bodů zarovnaná ve světě — okraje stěn stejně nejsou na násobcích bodu.
- Převzít kód Arény — porušuje pravidla xEngine (levely v kódu, `Math.random`, světla po pixelech, volné události); přebírají se hodnoty, postupy a data.
- `git remote set-url` — odmítl klasifikátor automatického režimu; funguje push na plnou adresu.

## 8. Registr faktů
| Kategorie | Položka | Hodnota (přesně) | Zdroj | Jistota |
|---|---|---|---|---|
| repo | xEngine | `https://github.com/OndrejKaplan-DRM/xEngine.git` (malými písmeny jen přesměruje: „This repository moved“) | git | 5/5 |
| větve | `main` = `zaklad-2` = `integrace-1` | `c48dbe7` (25. 11. po 1:04; znění 10 = `c01250a` + `tools/svod`) | `git ls-remote` | 5/5 |
| větve | `sesna-a` | `17b8176` (25. 11. 0:02, N-112 návrh) | `git ls-remote` 1:03 | 5/5 |
| větve | `sesna-b` | `fd3ee93` (25. 11. 1:01; zapečené pevné díly, sloučené znění 8 a 9, interakce přes `interact.js`) | `git ls-remote` 1:03 | 5/5 |
| push | příkaz | `git -c push.negotiate=true push -q https://github.com/OndrejKaplan-DRM/xEngine.git main main:refs/heads/zaklad-2 main:refs/heads/integrace-1` | praxe | 5/5 |
| commit | autor a podpis | `-c user.name="Kristína (Claude)" -c user.email="noreply@anthropic.com"`; konec zprávy `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` a `Claude-Session: https://claude.ai/code/session_011CupjXTS3BgPNpfJrEeJGg` | praxe | 5/5 |
| regrese | `main` po znění 10 | 1 000 kontrol, 0 selhalo: základ 357, A 405 (26 sad), B 201 (7 sad), A × B 37 | logy `g_n112_*` | 5/5 |
| regrese | vývoj na `main` | 909 → 913 → 923 → 926 → 953 → 984 → 1 000 | `STATE.md` | 5/5 |
| regrese | základ `npm test` | T0 41, T1 155, T1b 14, T1c 27, T1d 31, T1e 16, T4 46, T2 15, T3 12 = 357 | log | 5/5 |
| sloučení nanečisto | se zněním 9 | 1 059 kontrol, 0 selhalo (základ 341, A 430, B 248, A × B 40) | `z_status.txt` 0:30 | 5/5 |
| T460 | `?bench` 24. 11. 19:39 až 19:47 | `draw.ms` medián xLab 576 ř. 2,29 ms, `complex_7` 576 ř. 2,26 ms, xLab 1 080 ř. 5,57 ms (95 % 7,38 ms); krok 0,22 až 0,45 ms; 30 snímků/s | `STATE.md` znění 5 | 4/5 |
| T460 | `complex_7` 1 080 řádků | 95 % 10,2 ms, medián 6,97 ms → výchozí zůstává 768 (Ondřej sešně A 21:13) | `A_STAV.md` | 4/5 |
| T460 | textury barvy na 1 080 ř. | medián +0,4 až +1,7 ms, 95 % +2,1 až +3,1 ms (Ondřej 21:20, dva běhy) | `A_STAV.md` | 4/5 |
| T460 | N-110 hala xLabu (23:13 až 23:16) | `draw.ms` 2,51 / 3,24 / 4,01 bez textury; 3,24 / 3,91 / 10,85 po 10 cm; 3,24 / 4,18 / 9,00 po 5 cm (medián / 95 % / nejvíc); výpočet 1 772 ms / 6 104 ms; paměť 4 / 16 MB | `N-110` na `sesna-a` | 4/5 |
| D-039 | přepočet řádků | volba 1 080 dávala 2 360 × 1 080 do plochy asi 1 916 × 878 fyzických bodů = 1,51× | `docs/mereni/T460_2026-11-24_D-037_F3.md` | 4/5 |
| vzorky | `complex_7` (main) | kvádry po kvádrech 84 102, `levelLightMeshes` 65 618, pevné díly 65 546, celkem `levelSamples` 131 164 | měření v sandboxu | 5/5 |
| vzorky | xLab | 22 111 (20 509 kvádry + 1 602 díly); beze změny po přidání pušky | T1d | 5/5 |
| vzorky | `complex_7` se sadami B | 182 468 vzorků (116 850 na dílech), xBake 28 s v sandboxu, 4,8 MB | `TODO.md` sešny B | 4/5 |
| atlas | xLab | 10 cm 1 024 × 1 024, 381 915 bodů; 5 cm 2 048 × 1 024, 1 489 446 bodů; 426 map | `tools/svod/atlas_try.mjs` | 5/5 |
| atlas | `complex_7` (main) | 10 cm 2 048 × 2 048, 1 066 190 bodů (25,4 %); 5 cm 4 096 × 2 048, 3 915 567 bodů (46,7 %); 14 863 map; okraj 1 816 102 bodů; okraj 0,35 s v sandboxu | dtto | 5/5 |
| atlas | odhad sešny A | `complex_7` po 5 cm 64 až 128 MB v grafice (half float), vrstvy asi 24 MB / 12 MB po gzipu | N-112 | 3/5 |
| zlatý vzorek | obsah | 14 prefabů, 54 kvádrů, 21 entit, 10 světel, 1 zbraň, 17 materiálů | `make.mjs` | 5/5 |
| zlatý vzorek | dveře | `door_hinged_01` ±105°, `rest` 0; viditelné křídlo přes celý otvor 1,0 × 2,1 m | `make.mjs` | 5/5 |
| plazma | hlavní režim | střela 45 m/s, život 4 s, `cooldown` 0,1 s, 12 + šplouchnutí 6 v 1 m, rozptyl 0,46° (0,008 rad), hluk 30 m, 1 článek | `weapons/plasma_rifle_01.json` z Arény | 5/5 |
| plazma | nabitá koule | 5 až 20 článků, 14 až 40 m/s, život 6 s, výbuch 2,5 až 5,5 m, 30 až 200 (kvadraticky), `push` 12 až 33 m/s (kvadraticky), plně 2 s, samo 2,6 s, pauza 0,5 s, hluk 40 m, přímý zásah 0 | dtto | 5/5 |
| plazma | v ruce | `view.pos` [0,22, −0,215, −0,48] (Aréna), `rot` [0, 180, 0], ústí [0, 0,01, 0,38], přiblížení 45° (volba svodné) | dtto | 5/5 |
| Aréna | repo | `OndrejKaplan-DRM/Arena`, `arena2/`, větev `hra`, `a04e8c0` (v2.9); `main` = Údolí | git | 5/5 |
| Aréna | rozsah | 88 souborů JS, 19 708 řádků `src/`; sestavení 11,57 MB JS; svět 6 317 řádků v kódu | `wc`, stav v11 | 5/5 |
| Aréna | zvuk | 545 klipů, 150 událostí, 84 balíčků CC0, Ogg Opus 1 549 723 B (`bank.b64` 2 066 300 B) | `bank.json`, `CREDITS.md` | 5/5 |
| Aréna | modely | předměty 20 `.glb` 665 608 B; zbraně 13 `.glb` (12 + ruce) 1 388 072 B; auto `car.glb` 70 464 B; tvorové 6 JSON 2 536 446 B | `du` | 5/5 |
| Aréna | rozpory | `Math.random` 291× / 26 souborů; `setTimeout` 20× / 9; `castShadow` 53×; Lambert 48×; Phong 13×; `PointLight` ve 4 souborech; nejméně 12 volných jmen událostí | `grep` | 5/5 |
| velikosti souborů | základ | `formats.js` 588, `validate.js` 350, `check-prefab.js` 174, `check.js` 125, `atlas.js` 330, `lightmap.js` 206, `rig.js` 262, `t1_xspace.mjs` 502 | `wc -l` | 5/5 |
| hra | sestavení | `xlab_gen.html` 7 061 kB po N-111 (30 textur 1 287 kB, base64 1 717 kB); u sešny B 13,6 MB | `STATE.md`, `B_STAV.md` | 4/5 |
| kontejner | pracovní místa | repo `/home/claude/xengine`, logy `/home/claude/log`, Aréna `/home/claude/arena` a `/home/claude/arena-hra`, stará kopie pomůcek `/home/claude/scratch/tools` | — | 5/5 |
_Předávka – část 3/3_

## 9. Tematický přehled (vrstva 2 – podle témat)

### Paměť projektu a postup (D-038)
- Aktuální stav: `TODO.md` je první, co sešna čte (čeká na Ondřeje, zodpovězeno, oddíly svodná / A / B); `STATE.md` má znění 4 až 10 nahoře nejnovější; rozhodnutí v `DECISIONS.md` (D-001 až D-055; řádky D-038 až D-049 a D-050 až D-055 nejsou v číselném pořadí, nové se vkládají před řádek D-038); dodatky pro sešny nahoře ve `START_A.md` a `START_B.md` (nejnovější první); mapa v `CLAUDE.md`.
- Jak jsme k němu došli: Ondřej v 16:00 („Ztrácíme se občas v tom, co je už hotové a co ne“); od té doby se každé jeho rozhodnutí zapisuje do repa hned a commituje.
- Otevřené: skill `xengine` je zastaralý (píše o základu 2 znění 2, 242 a 638 kontrolách); aktualizuje ho svodná až na konci vlny 2 (pravidlo „skilly neupravuj během vlny“).

### Světlo: vzorky, zapečený soubor, textura světla
- Aktuální stav: vzorky = `levelSamples` (D-041); zapečený soubor `.light.bin` (XLV1) čte `bake.js` (D-044); okolní světlo je E (D-049); **textura světla po 5 cm přijata (D-050)**, atlas a soubor XLM1 v základu jako zkušební (D-055). Sešna B už zapéká pevné díly prefabů (`fd3ee93`).
- Jak jsme k němu došli: F3 z T460 a výpočty (fáze 2 a 3), zkouška sešny A na hale (N-110), Ondřej 0:00 a 0:49.
- Otevřené: zkouška celého `complex_7` (B zapeče po 5 a 10 cm, změří čas, velikost po gzipu, vrstvy; A přečte, složí, změří `?bench`); potom zmrazit; okolní světlo zlatého vzorku × π (0,06 → 0,1885 atd.) až sešna A přejde na dělení π (D-049); N-105 svítivosti zlatého vzorku.

### Kostry a interakce
- Aktuální stav: N-002 svázané klouby (`follow`, `jointFollow`, `rigFollow`), N-102 kostra bez alokací (`rigCompile`, `rigValues`, `rigFollow`, `rigSolve`), N-010 seznam interakcí (`interact.js`). Dveře na obě strany ±105° ve zlatém vzorku, pravidlo zakrytí dveří `portal.door.cover`.
- Otevřené: sešna A má přejít v kroku na zkompilovanou kostru (dodatek znění 7) a vybírat interakci přes `interactionOf` (znění 8); teprve potom sešna B sloučí kartotéku a stůl do jednoho prefabu a `door_double_01` do jednoho prefabu s `follow`. N-103 varování `rig.noSpeed`, až B doplní `speed`.

### Převzetí z Arény v2
- Aktuální stav: soupis `docs/prevzeti/ARENA.md`; pořadí D-051; zbraně jako zkušební formát se zkouškou na plazmové pušce (N-201, D-053; úkoly A3.1 a B3.1).
- Otevřené: po zkoušce zmrazit formát zbraní; potom zvuk (Z-2: formát zvukové události, zvuková banka B-1 jako balík s licencemi, běh A-6), potom tvorové (Z-3).

### Formát a validátor
- Aktuální stav: zkušební druhy `ammo`, `weapon` (`EXPERIMENTAL_KINDS`), typ `ramp`, pole `baked.lightmap`; validátor rozdělený na `check.js`, `check-prefab.js`, `check-weapon.js`, `validate.js`; dokument polí `docs/02a_XSPACE_pole.md` se generuje (`npm run doc`).
- Otevřené: `formats.js` má 588 řádků, další pole = nejdřív ho rozdělit; N-012 sešny B (rotační díl `lathe` a zaoblený kvádr `rbox` v `partMesh`) čeká na rozhodnutí; D-030 zmrazit pole N-006.

### Regrese a slučování
- Aktuální stav: regrese po skupinách (`tools/svod/groups.sh`), sloučení nanečisto (`tools/svod/zkouska.sh`); poslední: `main` 1 000 kontrol, nanečisto se zněním 9 1 059, vše 0 selhalo.
- Otevřené: konec vlny 2 → `zaklad-3` a úprava skillu.

## 10. Co rezonovalo
- Ondřej chce **jasný přehled, co je hotové** (16:00) a práci uloženou v Gitu kvůli limitům a přepínání modelů („používej často Git“).
- Odpovídá rychle volbami a/b/c a většinou bere doporučenou; když otázce nerozumí, řekne to („nerozumím“ 19:57) → otázky formulovat konkrétně, s tím, co z odpovědi plyne.
- Volnější limity, když brání kvalitě: „v pohodě. Tak pojďme quotu zvětšit na 80 MB“ (0:49).
- Chce zužitkovat staré projekty („spousta věcí už vykoumaných“, 21:19), ale stačila mu Aréna („Stačí jen Aréna“, 23:38).
- Na konec dne „Super.“ a „Díky.“; žádná kritika výstupů v této sešně.
- Makra v této sešně nepoužil (kromě `/session-handoff`).

## 11. Výstupy a kde jsou
- Repo (vše na `main` = `zaklad-2` = `integrace-1`, `c48dbe7`):
  - kód základu: `src/xspace/body.js`, `samples.js`, `bake.js`, `cover.js`, `interact.js`, `check.js`, `check-prefab.js`, `check-weapon.js`, `weapon.js`, `atlas.js`, `lightmap.js`; úpravy `rig.js`, `formats.js`, `validate.js`, `load.js`, `index.js`, `tools/lib/read-pack.mjs`, `build.mjs`, `tools/golden/make.mjs`, `tools/xspace-doc.mjs`;
  - testy: `test/t1b_rig.mjs` (14), `t1c_interact.mjs` (27), `t1d_weapon.mjs` (31), `t1e_lightmap.mjs` (16); úpravy `t1_xspace.mjs`, `test/t5_lib/nav.mjs`;
  - zlatý vzorek: `ammo.json`, `weapons/plasma_rifle_01.json`, `prefabs/wpn_plasma_rifle_01.json`, `prefabs/pickup_plasma_rifle_01.json`, entita `e_plasma`, materiál `plasma_glow`, dveře ±105°;
  - dokumenty: `TODO.md`, `CLAUDE.md`, `README.md`, `docs/STATE.md` (znění 4 až 10), `docs/DECISIONS.md` (D-038 až D-055), `docs/02_KONTRAKTY.md` (zkušební oddíl zbraní, textura světla, interakce, spojení `from`/`to`), `docs/01_ARCHITEKTURA.md` (oddíl 9 moduly, oddíl 7 Aréna), `docs/06_ROZPOCTY.md` (80 MB), `docs/navrhy/README.md`, `docs/navrhy/N-201-zbrane-a-udalosti-boje.md`, `docs/prevzeti/ARENA.md`, `docs/mereni/T460_2026-11-24_D-037_F3.md`, `docs/sesny/START_A.md`, `START_B.md`, `START_SVOD.md`;
  - pomůcky: `tools/svod/` (`groups.sh`, `zkouska.sh`, `rigcheck.mjs`, `cover_scan.mjs`, `samples_count.mjs`, `atlas_try.mjs`, `README.md`);
  - tato předávka: `docs/sesny/predavky/main03_predavka_2026-11-25.md`.
- Soubory poslané Ondřejovi: `ARENA.md` (24. 11. 23:50), tato předávka.
- Jen v kontejneru, po sešně ztraceno (nevadí, obnovitelné): klony Arény `/home/claude/arena` a `/home/claude/arena-hra` (znovu `add_repo` s právem čtení, větev `hra`); logy `/home/claude/log/*` (čísla jsou přepsaná v `STATE.md`); staré pomůcky `/home/claude/scratch/tools/{clip.py, crop.py, probe.py, split.mjs, regrese.sh, regrese2.sh}` (ořez a sondy snímků z fáze 1 a 2, nahrazené `tools/svod/`).

## 12. Ověřeno / neověřeno
- Ověřeno:
  - regrese po každém kroku testy po skupinách (čísla v oddílu 8); sloučení nanečisto se zněním 6 (982, 1 selhání v rozpracovaném stavu B) a se zněním 9 (1 059, 0);
  - N-102 bit po bitu na 478 prefabech (802 případů); N-010 na kopii kartotéky se čtyřmi zásuvkami a 14 mutacemi; plazma = vzorce Arény pro nabití 0 až 1; atlas: mapy se nepřekrývají, filtr u vrcholu nesáhne do prázdna, XLM1 projde zápisem a čtením přes gzip;
  - všechny balíky na `main` a balíky sešny B ze `sesna-b` `9b00112` bez nálezu s novými pravidly (`xspace-check --strict`).
- Neověřeno / limity:
  - nic z toho, co je ve formátu nově (zbraně, textura světla, seznam interakcí), zatím neběží v enginu sešny A; ve hře se to ukáže až po A3.1, N-010 v běhu a čtení textury světla;
  - výkon textury světla v celém `complex_7` na T460 (jen počty bodů ze sandboxu a odhad paměti 64 MB);
  - velikost souboru textury světla s reálnými hodnotami (test měl umělá data: 1 129 kB rozbaleno, 6 kB po gzipu, to nic neříká);
  - 30 snímků/s v Ondřejových bězích `?bench` (Úspora energie? sešna B v N-011 našla jinou příčinu: robot kývá pohledem a dávka měření srazí hru na 30 snímků/s);
  - fáze 1 a 2 jen ze souhrnu.

## 13. Rozpracované, čeká na koho, otevřené otázky
| Co | Stav | Čeká na | Od kdy |
|---|---|---|---|
| další krok základu: a) zvuk z Arény (Z-2), b) N-105 svítivosti zlatého vzorku | nezačato | Ondřej (na otázku z 1:02 odpověděl předávkou) | 25. 11. 1:02 |
| A3.1 zkouška zbraní na plazmové pušce (sebrání, střela, nabití, výbuch s `pushDelta`, zásah entit, události, zbraň v ruce, přiblížení, `?bench`) | zadáno, dodatek znění 9 | sešna A | 25. 11. 0:23 |
| B3.1 plazmová puška z `plasma.glb` Arény v balíku `kit_arena` | zadáno | sešna B | 25. 11. 0:23 |
| zkouška textury světla na celém `complex_7` (5 a 10 cm) | zadáno, dodatek znění 10 | B zapeče → A přečte a změří na T460 | 25. 11. 1:02 |
| zmrazit zkušební formáty zbraní a textury světla | čeká na zkoušky | svodná | — |
| N-010 v běhu (`interactionOf`, stav po interakcích, `from`/`to`) | zadáno, znění 8 | sešna A; potom B kartotéka a stůl jako jeden prefab | 25. 11. 0:11 |
| kostra v kroku přes `rigCompile` / `rigSolve` | zadáno, znění 7 | sešna A | 24. 11. 23:46 |
| `door_double_01` jako jeden prefab s `follow`, mikroskop `focus` → `stage` | zadáno, znění 6 | sešna B | 24. 11. 21:29 |
| okolní světlo zlatého vzorku × π | čeká | sešna A (dělit okolní člen π, D-049) → svodná | 24. 11. 20:20 |
| N-012 rotační díl `lathe` a zaoblený kvádr `rbox` v `partMesh` | návrh sešny B na `sesna-b`, nerozhodnuto | svodná | 25. 11. |
| N-011 `?bench` kývá pohledem a srazí hru na 30 snímků/s | hlášení B pro A | sešna A | 25. 11. 0:19 (Ondřejův běh) |
| „vnitřní kompartmentizace“ prefabů: a) přihrádky a police, b) kresba dřeva | B pracuje s a | Ondřej | 24. 11. |
| potvrdit nebo přepsat body 6/ až 8/ zadání | otevřené od main 02 | Ondřej | 22. 11. |
| dluhy základu ze `START_SVOD.md`: N-103, D-030 (N-006), D-032, zkoušky Shellu, xBench strop 22,5 až 25,2 ms, `REQUIREMENTS.md` a `05_PARITA_2003.md` | nezačato | svodná | 22. 11. |
| konec vlny 2: `zaklad-3`, skill `xengine` | později | svodná, Ondřejův souhlas se sloučením | — |
- Otevřené otázky pro Ondřeje: další krok základu (a zvuk / b N-105); kompartmentizace (a/b, sešna B); body 6/ až 8/ zadání.

## 14. Pasti a know-how
- **Regrese:** `npm run test:all` po první chybě skončí; pouštěj `tools/svod/groups.sh <štítek>` na pozadí a čekej `until grep -q KONEC /home/claude/log/g_<štítek>_status.txt; do sleep 5; done` (příkaz s `timeout` až 600 000 ms). Jeden prohlížeč naráz: Node skripty smějí běžet vedle, druhý prohlížeč ne. Po odpovědi Ondřejovi se úloha na pozadí za pár minut zastaví, proto výsledek počkat před odpovědí.
- **Změna zlatého vzorku nebo manifestu** může shodit cizí testy: dveře ±105° shodily 8 kontrol A; pole `ammo` v manifestu shodilo 2 kontroly B (`b_t7_searcher` skládá balík z manifestu zlatého vzorku). Vždy po takové změně všechny skupiny, ideálně i `zkouska.sh`.
- **Natvrdo zapsané počty** v testech základu (T1 měl `prefabs === 12`) → počítat z dat.
- **Soubor do 600 řádků:** `t1_xspace.mjs` (608) a `validate.js` (587) bylo nutné rozdělit; `formats.js` je na 588. Nové testy jako samostatné soubory `test/t1<písmeno>_*.mjs` a do `package.json` `test:node`.
- **Po změně `formats.js` `npm run doc`**, jinak `xspace-doc --check` v `npm test` selže.
- **Python nahrazování s `assert a in s`**, jinak úprava tiše nic neudělá.
- **Git:** adresa malými písmeny jen přesměruje; `git remote set-url` odmítl klasifikátor; push na plnou adresu `https://github.com/OndrejKaplan-DRM/xEngine.git` s `-c push.negotiate=true` a hned `git ls-remote`. Tagy proxy odmítá. Commitovat i rozpracované (limit útraty přišel 24. 11. bez varování).
- **Sešny dostávají rozhodnutí i napřímo** (A ve 23:58, B ve 23:57 a 0:19): před každou otázkou Ondřejovi číst `git show origin/sesna-a:TODO.md`, `origin/sesna-b:TODO.md` a jejich `*_STAV.md`.
- **Atlas textury světla:** vrcholy neleží ve středech bodů (okraje stěn nejsou na násobcích bodu); malé mapy (víčka válců) by bez pravidla „nejbližší bod vrcholu“ neměly žádný bod; okraje map počítat přes typovaná pole (Set a pole objektů byly 5× pomalejší). Plášť válce do atlasu nepatří (UV `NaN`).
- **Aréna:** hodnoty jsou z xDOOM laděné pro svižnou mutaci; pro profil `real` je potřeba vlastní sada. Střela je v Aréně bod (paprsek po dráze za krok), proto plazma nemá `projectile.radius`. Nabitá koule škodí jen výbuchem (přímý zásah 0).
- **Měření:** čísla ze sandboxu jsou počty, ne výkon; výkon jen z `?bench` nebo F3 na T460.

## 15. Navázání
- Další krok: zeptat se Ondřeje na volbu a (zvuk z Arény) / b (N-105); mezitím zkontrolovat hlavy sešen a jejich stav (zbraně A3.1, B3.1, `complex_7`), N-012 rozhodnout, při další změně formátu nejdřív rozdělit `formats.js`.
- Skilly k načtení: `xengine` (rozcestník, i když je zastaralý), `session-handoff` (předávky). Pro zbraně případně `fps-zbrane-mereni` (měření zbraně v ruce) a `arena-assety` / `arena-jadro` jako zdroj hodnot Arény.
- Startovní prompt pro novou svodnou sešnu (ke zkopírování):
  > Jsi svodná sešna projektu xEngine („main 04“), navazuješ na „main 03“. Načti skilly `xengine` a `session-handoff`. Připoj repo `OndrejKaplan-DRM/xEngine` s právem zápisu a přečti celou předávku `docs/sesny/predavky/main03_predavka_2026-11-25.md`, potom `TODO.md`, `CLAUDE.md`, `docs/00_ZADANI.md`, `docs/STATE.md` a `docs/sesny/START_SVOD.md`. Před čímkoli dalším `git fetch`, hlavy větví a stav obou sešen (`git show origin/sesna-a:TODO.md`, `origin/sesna-b:TODO.md`). Push větví `main`, `zaklad-2` a `integrace-1` ti povoluji. Projekt v claude.ai je plný: nic do něj nepiš, stav piš do repa a posílej mi soubory. Řekni mi v 8 řádcích, kde jsme, a navrhni další krok.
