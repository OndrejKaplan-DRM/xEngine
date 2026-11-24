# Stav

**Verze:** základ 2, znění 8 · 25. 11. 2026 v noci · větev `zaklad-2` (shodná s `main`) · vlna 2 sloučená v polovině (D-048)
**Co se dělá a co čeká na koho:** `TODO.md` (D-038). Tady je stav základu, čísla a co je ověřené.
**Další krok:** vlna 2, sešny A a B podle oddílu „vlna 2“ a dodatků nahoře v `docs/sesny/START_A.md` a `START_B.md`.

Základ 2 = znění 2 základu 1 + sloučená vlna 1 (sešna A `230b3ee`, sešna B `754f46d`) + zkouška A × B + rozhodnuté návrhy a rozpory (D-029 až D-034) + rozpočty podle tří běhů xBench 0.2.

## Znění 8 základu 2 (25. 11. 2026 v noci): víc interakcí v prefabu (N-010)

Ondřej 25. 11. 0:00: textura světla (a) bod 5 cm (D-050), převzetí z Arény (a) nejdřív zbraně (D-051). N-010 přijat ve variantě a (D-052).

| Co | Kde | Ověřeno |
|---|---|---|
| `components.interact` jako seznam s `id`; `interactions`, `interactionById`, `interactionOf` (podle zasaženého uzlu, předek bez kloubu, svázaný kloub), `doorInteraction`; `from` / `to` ve spojeních | `src/xspace/interact.js`, `formats.js`, `check-prefab.js`, `validate.js` | T1c: 27 kontrol (kartotéka se čtyřmi zásuvkami jako jeden prefab, 14 mutací, cesty nálezů); zlatý vzorek a balíky sešny B (`kit_base`, `kit_lab`, `kit_it`, `kit_all`, `gen_demo` ze `sesna-b` `9b00112`) bez nálezu |
| `validate.js` (587 řádků) rozdělen podle odpovědnosti | `check.js` (108: tvar), `check-prefab.js` (174: prefab), `validate.js` (346: materiály, level, balík) | T1 beze změny 155 kontrol |
| regrese na `main` (`3f0ae44`) | **953 kontrol, 0 selhalo**: základ 310, A 405 ve 26 sadách, B 201 v 7 sadách, A × B 37 | testy po skupinách, 0:06 až 0:11 |

## Znění 7 základu 2 (24. 11. 2026 pozdě v noci): kostry bez alokací (N-102)

Ondřej ve 23:38: další krok (b) N-102; kód staré hry (a) jen Aréna v2.

| Co | Kde | Ověřeno |
|---|---|---|
| `rigCompile`, `rigValues`, `rigFollow`, `rigSolve`; `rigMatrices` je obálka nad nimi | `src/xspace/rig.js` (262 řádků) | T1b: 40 případů na prefabech zlatého vzorku, rozdíl proti původnímu výpočtu 0; mimo testy 802 případů na 478 prefabech (`golden`, `kit_base`, `kit_lab`, `kit_it` ze `sesna-b` `42b7dae`), rozdíl 0; `rigFollow` = `jointFollow` |
| testy koster odděleny z T1 (608 řádků, přes mez 600) | `test/t1b_rig.mjs` (134 řádků), `test/t1_xspace.mjs` (502), `package.json` `test:node` | `npm test`: T1 155 + T1b 14 = 169 jako před rozdělením |
| regrese na `main` (`c4bac67`) | **926 kontrol, 0 selhalo**: základ 283, A 405 ve 26 sadách, B 201 v 7 sadách, A × B 37 | testy po skupinách, 23:41 až 23:46 |
| Aréna v2 připojena jen pro čtení | `OndrejKaplan-DRM/Arena`, větev `hra` `a04e8c0` (v2.9) | soupis v `docs/prevzeti/ARENA.md` |

Rychlost `rigSolve` jen pro představu (sandbox, o T460 nic neříká): 100 000 kroků kostry se 4 uzly a 3 klouby 62 ms. Sešna A zatím volá `rigMatrices` v kroku (`src/world/entities.js`); přechod je v dodatku znění 7 ve `START_A.md`.

## Znění 6 základu 2 (24. 11. 2026 v noci): zakrytí dveří a svázané klouby

Ondřej ve 21:19: další krok (a). Provedeno:

| Co | Kde | Ověřeno |
|---|---|---|
| pravidlo validátoru `portal.door.cover` (D-036): kolmý průmět neprůhledných dílů `box` dveří v klidové poloze (`rest`, N-109) do roviny portálu pokryje otvor; neplatí pro `seeThrough` | `src/xspace/cover.js`, `validate.js` | T1 (dvě mutace); zlatý vzorek měl u `door_hinged_01` škvíru 1 cm (616 cm²), viditelné křídlo je teď přes celý otvor; `gen_demo` (main i `sesna-b`): 94 portálů s dveřmi, škvíra nikde |
| svázané klouby `rig.joints[].follow` a `jointFollow` (N-002) | `formats.js`, `rig.js`, `validate.js` | T1 (dvoukřídlé dveře jako jeden prefab, řetěz, ořez, pět mutací) |
| regrese na `main` (`1cf0261`) | **923 kontrol, 0 selhalo**: základ 280, A 405, B 201, A × B 37 | testy po skupinách |
| balíky sešny B ve stavu `42b7dae` (`kit_base`, `kit_lab`, `kit_it`, `kit_all`, `gen_demo`) | 0 chyb, 0 varování s novými pravidly | `xspace-check --strict` |
| sloučení nanečisto `main` (`6d0a9e0`) + `sesna-a` `38c1c07` + `sesna-b` `3f45c21` | bez konfliktu; 982 kontrol, **1 selhala**: `b_t8_zasuvky` (spodní zásuvka kartotéky se neotevře). Selže stejně na samotné `sesna-b` `3f45c21` (commit „rozpracováno“: generátor vybavuje i ze sad `kit_lab` a `kit_it`), tedy rozpracovaný stav sešny B, ne základ. Ostatní: základ 280, A 417 ve 27 sadách, B 8 z 9 sad, A × B 40 | testy po skupinách, 21:30 až 21:36 |

## Znění 5 základu 2 (24. 11. 2026 večer): sloučená vlna 2

Ondřej v 19:57: sloučit vlnu 2 teď (D-048). Větev zůstává `zaklad-2`, vlna 2 nekončí.

| Krok | Výsledek | Čím ověřeno |
|---|---|---|
| vlastnictví složek | sešny nesáhly mimo své složky; výjimky podle pravidel: `TODO.md` (svůj oddíl), `package.json` (sešna B přidala `sharp` 0.35.5 do `devDependencies`) | `git diff --name-only` proti základu |
| sloučení `sesna-a` (`85d6a6d`) a `sesna-b` (`ba16d8d`) | bez konfliktu (obě si předtím vzaly znění 4) | `d6f2982`; zámek balíků obnoven |
| regrese po sloučení | **909 kontrol, 0 selhalo**: základ 266, A 405 ve 26 sadách, B 201 v 7 sadách, A × B 37 | testy po skupinách, sandbox, 20:00 až 20:04 |
| dveře zlatého vzorku na obě strany (N-109, D-042) | `door_hinged_01` ±105° | `3b558bc`; skupiny A, B, A × B zelené |
| N-009 (D-045) | `albedoMean` ve formátu, validátor `mat.albedoMean` | T1 |
| N-111 (D-046) | soubory balíku v sestavení (`pack.files`), `materialFrom`, validátor textur materiálů (`ref.asset`) | T1; `dist/xlab_gen.html` 7 061 kB, z toho 30 textur `kit_base` (1 287 kB, v base64 1 717 kB) |
| regrese na `main` (`9a1f7cd`) | **913 kontrol, 0 selhalo**: základ 270, A 405, B 201, A × B 37 | testy po skupinách, 20:12 až 20:17 |
| rozhodnutí | D-045 až D-049 (N-009, N-111, světlo za dveřmi se `seeThrough`, sloučení, okolní světlo jako E) | `DECISIONS.md`; oddíly „Rozhodnutí“ v souborech N-001, N-007, N-008, N-009, N-108 až N-111 |

Co sloučení přineslo (podrobně `TODO.md` a `*_STAV.md`): sešna A světlo po vrcholech se zastíněním a branami dveří, pevné řádky se stropem výšky plátna, `?bench`, nápravu kroku fyziky, nová pole (A2.5), díly `.glb` a textury (A2.6 na zkušebních datech), zorné pole jako vodorovný úhel, dveře od hráče; sešna B průchodnost 0,74 m, xBake podle D-035, xSearcher (příjem textur CC0), 30 textur sady `kit_base`.

**Hra na T460 po vlně 2** (Ondřejův `?bench`, 24. 11. 19:39 až 19:47, sestavení sešny A „krok 5“; podrobně `A_STAV.md`, oddíl 5.1): čas grafiky `draw.ms` medián xLab 576 řádků 2,29 ms, `complex_7` 576 řádků 2,26 ms, xLab 1 080 řádků 5,57 ms (95 % 7,38 ms). Krok simulace 0,22 až 0,45 ms medián. Stavba světla `complex_7` při startu 13,1 s výpočtu. Všechny tři běhy měly 30 snímků/s při práci snímku 7 až 12 ms; nejspíš Úspora energie v Chrome (neověřeno).

## Znění 4 základu 2 (24. 11. 2026, svodná sešna main 03)

| Co | Kde | Rozhodnutí |
|---|---|---|
| `TODO.md` v kořeni: co se dělá, co čeká na Ondřeje, co je hotové, oddíl pro každou sešnu; `CLAUDE.md` s mapou „kde co je“ a pravidlem „Git často“; moduly v `01_ARCHITEKTURA.md`, oddíl 9 | kořen, `docs/` | D-038 |
| rozměry postavy: `BODY`, `CHARACTER_SKIN`, `bodyWidth()` = 0,74 m; varování validátoru `portal.narrow` | `src/xspace/body.js`, `validate.js` | D-040 (N-008) |
| vzorky světla levelu i s pevnými díly prefabů: `levelSamples`, `entityStaticMesh`, `staticPartIndices`, `movingNodes` | `src/xspace/samples.js`, `02_KONTRAKTY` | D-041 |
| čtení zapečeného světla a skládání barev: `decodeBake`, `composeColors`, `gateLevel` (převzato ze sešny B), `doorOpenness` | `src/xspace/bake.js`, `02_KONTRAKTY` | D-044 |
| dveře na obě strany: věta v kontraktech, vzorec otevření | `02_KONTRAKTY`, `bake.js` | D-042 (N-109); zlatý vzorek až po úpravě testů sešny A |
| strop řádků fyzickou výškou plátna; textura světla jako směr se zkouškou; `env.lightCell` zamítnuto | provede sešna A | D-039, D-043 (N-110, N-108) |
| Ondřejův přehled F3 z 24. 11. (10 snímků) | `docs/mereni/T460_2026-11-24_D-037_F3.md` | — |

Vzorky světla podle `levelSamples` (mřížka 0,5 m, sandbox, počty platí všude):

| Level | Kvádry (`levelLightMeshes`) | Pevné díly prefabů | Celkem |
|---|---|---|---|
| xLab | 20 509 | 1 602 (11 z 20 entit) | 22 111 |
| `complex_7` | 65 618 | 65 546 (380 z 423) | 131 164 |
| `complex_21` | 61 075 | 61 916 (355 z 392) | 122 991 |
| `catacombs_3` | 33 606 | 14 550 (67 ze 112) | 48 156 |

`gen_demo` ze `sesna-b` (`8be5b71`). V komplexech nesou pevné díly polovinu vzorků; dosud je zapečený soubor nenesl (D-041).

**Testy (sandbox, Node 22, Chromium bez grafické karty, 24. 11. 16:24 až 16:33):**

| Co | Základ `npm test` | Skupina A | Skupina B | A × B | Celkem |
|---|---|---|---|---|---|
| `main` (`e01026c`) | 266 (T0 41, T1 152, T4 46, T2 15, T3 12) | 267 v 16 sadách | 92 ve 4 sadách | 37 | **662, 0 selhalo** |
| sloučení nanečisto `main` + `sesna-a` `c7a2a64` + `sesna-b` `4aeeeb4` | 266 | 364 ve 24 sadách | 188 v 7 sadách | 37 | **855, 0 selhalo** |

Sloučení nanečisto: sešna A bez konfliktu; sešna B se srazí v `TODO.md` a `CLAUDE.md` (oba vznikly tentýž den v její větvi i v základu), vyřešeno verzí základu; dodatek ve `START_B.md`. **Zlatý vzorek s dveřmi ±105° (N-109) zkouškou neprošel**: 8 kontrol sešny A ve třech sadách (`a_14_block`, `a_14_entities`, `a_14_swing`) počítá s jednostrannými dveřmi. Data jsou proto zpět na 0° až 105° (`e01026c`); přepnou se po úpravě testů sešny A.

## Integrace vlny 1 (svodná sešna main 02, 22. 11. 2026)

| Krok | Výsledek | Čím ověřeno |
|---|---|---|
| znění 2 základu na GitHubu | `zaklad-1` = `main` = `16548b4` | `npm test` 232 kontrol před pushem, `git ls-remote` po něm |
| vlastnictví složek | sešna A ani B nesáhla mimo své složky; `package.json` beze změny; žádný soubor přes 600 řádků | `git diff --name-only` proti základu |
| sloučení `sesna-a` (`230b3ee`) | bez konfliktu; dva importy Shellu a rozpad velikosti v `a_00_build` opraveny (`e13d1fc`) | základ 232, skupina A 16 sad z 16, 267 kontrol |
| sloučení `sesna-b` (`754f46d`) | bez konfliktu; zámek balíků beze změny | základ 232, skupina B 4 sady ze 4, 92 kontrol |
| **zkouška A × B** | level sešny B běží v enginu sešny A beze změny kódu: všechny buňky dosažitelné pro kapsli hráče, robot došel ze startu do nejvzdálenější buňky ve všech třech levelech `gen_demo` (57,9 m, 42,5 m, 28,7 m) i ve zlatém vzorku (25,2 m), dveře na cestě otevřel rukou, nikde neuvázl; nejvýš 158 volání kreslení na pohled; v prohlížeči startují všechny tři levely s čistou konzolí | `npm run test:axb`: T5 28 kontrol v Node, 9 v prohlížeči |
| celá regrese | 633 kontrol, 0 selhalo (základ 237, A 267, B 92, A × B 37) | `npm run test:all` |
| měření T460 | tři běhy xBench 0.2 v `docs/mereni/`, rozpočty přepsány podle nejhoršího běhu | `docs/06_ROZPOCTY.md` |

Co zkouška A × B neříká: robot běží v Node bez obrazu (stejný kód hry, jiné vykreslení). Chodí po nejkratší cestě, takže většinu místností jen míjí. Dveře `door_plank_01` nechávají průchod 0,80 m pro postavu širokou 0,70 m (s odstupem kontroléru 0,74 m): projít jdou, ale jen středem. Krok simulace je měřen v sandboxu, o T460 nevypovídá.

## Znění 3 základu 2 (24. 11. 2026): mřížka světla podle D-037

Proti znění 2 přibylo v `src/xspace/geom.js`:

- `brushLightMesh(b, cell, skip)`: hrana plochy rovnoběžná s osou má vrcholy na násobcích buňky ve světových souřadnicích a na obou koncích (dřív se dělila rovnoměrně podle své délky). Šikmá hrana klínu a jeho trojúhelníkové boky se dělí jako dřív. Třetí parametr vyjmenuje plochy, které se nevyrábějí.
- `brushHiddenFaces(brushes, materials)`: plochy, které leží celé v jiném neprůhledném viditelném kvádru (včetně jeho povrchu).
- `levelLightMeshes(brushes, materials, cell)`: sítě celého levelu bez schovaných ploch; kvádr s `vis: false` síť nemá. **Tohle je od teď definice vzorků levelu** (`02_KONTRAKTY`, Světlo).
- Strop dílků jedné hrany je 256 místo 64. Se stropem 64 by se při buňce 0,25 m plochy delší než 16 m dělily po 0,5 m a ztratily společné vrcholy se sousedy.
- Nástroj `node tools/light-stat.mjs packs/<balík> [--cell 0.25]` vypíše počty a T-spoje.

Změřeno v sandboxu na balících ve stavu základu (jsou to počty, ne časy, platí všude):

| Level | Vzorků dřív | Vzorků teď | Trojúhelníků dřív | Trojúhelníků teď | Schovaných ploch | T-spojů dřív | T-spojů teď |
|---|---|---|---|---|---|---|---|
| `xlab` (zlatý vzorek) | 20 658 | 20 509 | 32 386 | 32 826 | 64 z 322 | 1 321 | 139 |
| `catacombs_3` | 39 136 | 35 352 | 44 860 | 44 908 | 666 z 2 046 | 5 422 | 1 278 |
| `complex_21` | 64 393 | 61 075 | 81 738 | 84 731 | 798 z 2 471 | 7 727 | 1 534 |
| `complex_7` | 73 092 | 65 618 | 91 344 | 91 126 | 1 179 z 2 988 | 9 500 | 2 000 |

- T-spoj je vrchol jedné plochy uvnitř okrajové hrany jiné viditelné plochy, která tam vrchol nemá; na takovém místě může vykreslení vynechat bod. „Dřív“ je stará funkce z `d2fb217` na týchž viditelných plochách.
- **Zarovnání samo vzorky přidává** (xLab +3,7 %, generované levely +14 až +15 %), protože plochy mimo mřížku dostanou krajní pásek. Vynechání schovaných ploch ubere 4 až 22 %. Výsledek: vzorků o 1 až 10 % méně, trojúhelníků stejně (−0,2 až +3,7 %).
- **Očekávání z D-037 se nepotvrdilo:** úspora měla být třetina až polovina vzorků, celé schované plochy jich ale nesou jen 4 až 22 %. Vzorky, které leží v tělese na plochách schovaných jen zčásti, zůstávají.
- Při buňce 0,25 m má xLab 68 735 vzorků a 122 162 trojúhelníků (dřív 59 394 a 102 798, protože starý strop 64 dílků dlouhé plochy potichu zhruboval).

**Švy ve hře.** Po sloučení nanečisto se `sesna-a` (`3b005a7`) hlásí její test `a_17_view` (48 pohledů zlatého vzorku, pozadí v signální barvě, vyhlazování vypnuté) **0 bodů pozadí na švech**; před změnou 128 bodů, nejhorší pohled 21. Varianta (b) z N-108 proto není potřeba. Platí pro zlatý vzorek; na generovaných levelech pohledový test švů neexistuje a T-spoje tam zbývají.

**Sloučení nanečisto s oběma větvemi** (`3380bf2` + `sesna-a` `3b005a7` + `sesna-b` `64e622b`, 24. 11. 2026, sandbox): bez konfliktu; základ 254 kontrol, skupina A 21 sad z 21 (336 kontrol), zkouška A × B 28 + 9, skupina B 5 sad ze 6. **Selže jedna kontrola v `b_t6_bake_nahled`**, která má počet vzorků xLabu natvrdo (20 658; po změně 21 432, po přechodu na `levelLightMeshes` 20 509). Oprava patří sešně B (dodatek ve `START_B.md`).

Po sloučení dostanou obě sešny novou mřížku samy. Schované plochy přestanou počítat, až nahradí smyčku přes `brushLightMesh` voláním `levelLightMeshes` (sešna A ve `src/world/world.js`, sešna B v xBake).

Nerozhodnuto: pole `env.lightCell` z doplňku N-108 (sešna A). Čeká na číslo `?bench` s `grid=0.25` z T460.

## Znění 2 základu 2 (23. 11. 2026)

Proti znění 1 (`b12f8ed`) přibylo: díly prefabu v základu (N-101: `partMesh`, `partCollider`, `partTris`; xView je používá) a rozhodnutí tří návrhů, které přišly během integrace: N-001 soubor se zapečeným světlem (D-035), N-007 zakrytí otvoru dveřmi (D-036), N-108 mřížka světla (D-037). Sešny si znění 2 vezmou týmž `git merge origin/zaklad-2`.

## Rozhodnuto po vlně 1

- **Návrhy:** všech 15 rozhodnuto, přehled v `docs/navrhy/README.md`. Osm je už v základu, zbytek základ dluží (seznam v `docs/sesny/START_SVOD.md`).
- **Rozpory kódu sešny A se zněním 2:** D-031 (světlo po vrcholech a pevné řádky jsou první úkol vlny 2), D-032 (klidný režim rozhodne zkouška v Chrome), D-027 zrušeno.
- **Stupně kvality** (D-029): rámec přijat; změřený je jen stupeň `low` pro T460.

## Co ukázala hra na T460 (22. 11. 2026, čtyři pohledy, přehled F3)

Hra z vlny 1 drží 60 snímků/s. Krok simulace je 0,64 až 3,50 ms proti mezi 2 ms a skoro celý ho tvoří fyzika. Čas grafiky F3 neměří. Podrobně `docs/mereni/T460_2026-11-22_xlab_gen_F3.md`.

Sešna A má z vlny 1 otevřené: skok v profilu `arena` na nový stisk, zablokované dveře (D-025), oddíl „Rozhraní entit“ (D-026). Sešna B: katakomby podle volby 2 b, B1.3 xBake nezačato, B1.4 xSearcher jen měření zdrojů.

## Stav větví sešen (24. 11. 2026 ve 20:20)

Obě sešny běží. Práce vlny 2 do `85d6a6d` (A) a `ba16d8d` (B) je v základu; co přibylo potom, je stav pro příští sloučení. Co právě dělají: jejich oddíly v `TODO.md` na jejich větvích.

| Větev | Hlava | Základ, na kterém stojí | Stav vlny 2 podle jejich `*_STAV.md` |
|---|---|---|---|
| `sesna-a` | `3250dd6` | znění 4 (`36faf65`); znění 5 ještě ne | nad rámec sloučeného: běh čte zapečené světlo ze souboru v pořadí `levelSamples` (`652f7ea`; barvy shodné s výpočtem, poměrně do 1e-7), F3 a `?bench` to hlásí; regrese 417 kontrol A |
| `sesna-b` | `5e03d87` | znění 4 (`36faf65`); znění 5 ještě ne | nad rámec sloučeného: barvy materiálů podle albeda skutečných povrchů a expozice předvoleb (Ondřejova volba 1 a), bohatší tvary prefabů (Ondřejova volba 3 a, první dávka) |

Obě hlavy jdou se základem sloučit bez konfliktu (`git merge-tree`, 20:20); testy nad nimi jsem nepouštěla.

## Co je hotové (základ 1)

| Část | Kde | Stav |
|---|---|---|
| jádro: systémy, fáze, závislosti, deklarované události, pevný krok 120 Hz, režimy, uložení stavu | `src/kernel` | 41 kontrol v T0 |
| xSpace 1: popis formátů, validátor se stálými kódy nálezů, načtení a spojení balíků, geometrie kvádrů a klínů, matice koster | `src/xspace` | 152 kontrol v T1 (24. 11.) |
| světlo: síť vzorků `brushLightMesh` (mřížka 0,5 m, pořadí vrcholů je kontrakt) a vzorec `lightIrradiance` | `src/xspace/geom.js`, `light.js` | 17 kontrol v T1 |
| zlatý vzorek: level xLab (5 buněk, 4 portály, 54 kvádrů, 20 entit, 10 světel, 11 spojení) a 12 prefabů s kostrou | `packs/golden`, `tools/golden/make.mjs` | bez nálezů, bajtově opakovatelný |
| xView: prohlížeč balíku (pět pohledů, vrstvy, validátor v prohlížeči) | `tools/xview` → `dist/xview.html` | 15 kontrol v T2 |
| xBench 0.2: měření stroje (28 případů, z toho 16 shodných s verzí 0.1) | `tools/xbench` → `dist/xbench.html` | 12 kontrol v T3; na T460 změřena verze 0.1 jednou a 0.2 třikrát (22. 11.) |
| xShell: menu, pauza, nastavení z deklarací, katalog nabídek | `src/shell` | 46 kontrol v T4 (jen nastavení) |
| rozpočty z měření T460 | `docs/06_ROZPOCTY.md`, `docs/mereni/` | změřeno 22. 11. 2026 |
| dokumenty: vize, architektura, kontrakty, názvosloví, rozdělení sešen, parita, rozpočty, požadavky, rozhodnutí | `docs/` | dokument polí se generuje a hlídá testem |

`npm test`: 280 kontrol; celá regrese na `main` (základ, A, B, A × B): 923 kontrol, 0 selhalo (Node 22, Chromium bez grafické karty, 24. 11. 2026 v noci). Pozor: `npm run test:all` je řetěz `&&` a u první chybné skupiny skončí; při hledání chyb pouštěj skupiny zvlášť.

## Co hotové není

- **Zapečené světlo ve hře.** Běh ho čte jen na `sesna-a` (od `652f7ea`); xBake zatím nezapéká pevné díly prefabů (D-041) a balíky soubor `.light.bin` nenesou. Okolní světlo: sešna A ho má dělit π (D-049).
- Shell je přestěhovaný, ne zapojený. Jeho zkoušky v prohlížeči a zkouška katalogu zůstaly ve `vibe-game-frameworks`.
- Zvuk, tvorové, editor. Svázané klouby v enginu (sešna A) a dvoukřídlé dveře jako jeden prefab (sešna B); víc interakcí v prefabu (N-010, nerozhodnuto).

## Neověřeno

- **Čas grafiky ve hře na T460.** F3 měří jen procesor; `?bench` měl na skutečné grafice chybu (vracel obnovu displeje), sešna A ji opravila 24. 11. a nové měření chybí. Na něm závisí výchozí rozlišení a zkouška textury světla.
- Hra ve vlně 2 na T460 drží 60 snímků/s ve všech zkoušených pohledech kromě 1 080 řádků s vyhlazováním (44 až 46); krok simulace 0,55 až 0,68 ms v mediánu (`docs/mereni/T460_2026-11-24_D-037_F3.md`, `A_STAV.md`). Hala se dvěma patry a katakomby za pohybu změřené nejsou.
- Stavba vrstev světla při startu `complex_7` na T460 29,7 s; se zapečeným souborem a pevnými díly v něm by odpadla, ověřené to není.
- Verze Rapieru 0.21.0 a three-mesh-bvh 0.9.18 jsou připnuté, ale nic je zatím nepoužívá.
- Hodnoty pohybu pro profil `real` (Counter-Strike, Half-Life) mají jistotu 3/5.
- Ochranná známka Blender (důvod jména xForge) je uvedena z obecné znalosti, bez právního ověření.
- Přínos druhého modulu paměti v T460.

## Otevřené pro Ondřeje

Jediný seznam je v `TODO.md`, oddíl „Čeká na Ondřeje“.

## Návrhy

Žádný otevřený (24. 11. rozhodnuty N-008, N-109, N-110 a doplněk N-108). Přehled v `docs/navrhy/README.md`. Oddíl „Rozhodnutí“ v souborech N-001, N-007, N-008, N-108, N-109 a N-110 doplním při příštím sloučení (soubory jsou zatím jen na větvích sešen).
