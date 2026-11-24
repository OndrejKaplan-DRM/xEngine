# Stav

**Verze:** základ 2, znění 4 · 24. 11. 2026 · větev `zaklad-2` (shodná s `main`)
**Co se dělá a co čeká na koho:** `TODO.md` (D-038). Tady je stav základu, čísla a co je ověřené.
**Další krok:** vlna 2, sešny A a B podle oddílu „vlna 2“ a dodatků nahoře v `docs/sesny/START_A.md` a `START_B.md`.

Základ 2 = znění 2 základu 1 + sloučená vlna 1 (sešna A `230b3ee`, sešna B `754f46d`) + zkouška A × B + rozhodnuté návrhy a rozpory (D-029 až D-034) + rozpočty podle tří běhů xBench 0.2.

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

## Stav větví sešen (24. 11. 2026 v 16:33)

Obě sešny běží. Do `zaklad-2` jejich práce z vlny 2 **nepatří**; je to stav pro příští sloučení. Co právě dělají: jejich oddíly v `TODO.md` na jejich větvích.

| Větev | Hlava | Základ, na kterém stojí | Stav vlny 2 podle jejich `*_STAV.md` |
|---|---|---|---|
| `sesna-a` | `c7a2a64` | znění 3 a D-038 (`0af8c25`); dodatek znění 4 ještě ne | A2.1 až A2.5 hotovo (světlo po vrcholech, obraz a `?bench`, krok fyziky, dluhy vlny 1, nová pole základu); zorné pole jako vodorovný úhel; dveře od hráče jako nastavení; A2.6 a A2.7 nezačato |
| `sesna-b` | `4aeeeb4` | znění 3 (`a995347`); D-038 ještě ne | B2.1, B2.3 (xSearcher: 10 textur CC0 v `packs/_inbox`) a B2.6 (xBake podle D-035) hotovo; B2.2, B2.4, B2.5, B2.7 nezačato |

Výsledek sloučení nanečisto s těmito hlavami je v oddíle „Znění 4“ výše (855 kontrol, 0 selhalo).

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

`npm test`: 266 kontrol; celá regrese na `main` (základ, A, B, A × B): 662 kontrol, 0 selhalo (Node 22, Chromium bez grafické karty, 24. 11. 2026). Pozor: `npm run test:all` je řetěz `&&` a u první chybné skupiny skončí; při hledání chyb pouštěj skupiny zvlášť.

## Co hotové není

- **Engine vlny 2 v základu.** Na `main` je engine sešny A z vlny 1 (světlo po pixelech); světlo po vrcholech, `?bench`, náprava kroku fyziky a nová pole jsou jen na `sesna-a`. Sloučení vlny 2 čeká na Ondřejovo slovo (`TODO.md`).
- Shell je přestěhovaný, ne zapojený. Jeho zkoušky v prohlížeči a zkouška katalogu zůstaly ve `vibe-game-frameworks`.
- Běh zapečený soubor nečte. Čtení je v základu (`bake.js`), xBake je na `sesna-b`; pevné díly prefabů do souboru xBake ještě nezapéká (D-041).
- Načítání `.glb`, textury ve hře, zvuk, tvorové, editor. Pravidlo validátoru `portal.door.cover` (D-036) a svázané klouby (N-002).

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
