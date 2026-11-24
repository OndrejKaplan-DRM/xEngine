# Stav

**Verze:** základ 2, znění 3 · 24. 11. 2026 · větev `zaklad-2` (shodná s `main`)
**Další krok:** vlna 2, sešny A a B podle oddílu „vlna 2“ nahoře v `docs/sesny/START_A.md` a `START_B.md`.

Základ 2 = znění 2 základu 1 + sloučená vlna 1 (sešna A `230b3ee`, sešna B `754f46d`) + zkouška A × B + rozhodnuté návrhy a rozpory (D-029 až D-034) + rozpočty podle tří běhů xBench 0.2.

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

## Stav větví sešen (24. 11. 2026 v 01:10)

Obě sešny skončily 23. 11. 2026 mezi 03:00 a 05:00. Do `zaklad-2` jejich práce z vlny 2 **nepatří**; je to stav pro příští sloučení.

| Větev | Hlava | Základ, na kterém stojí | Stav vlny 2 podle jejich `*_STAV.md` |
|---|---|---|---|
| `sesna-a` | `3b005a7` | znění 1 (`b12f8ed`); znění 2 ani 3 nesloučila | A2.1 světlo po vrcholech, A2.2 obraz a měření, A2.4 dluhy vlny 1 (D-024, D-025) hotovo; A2.3 krok simulace změřen jen v sandboxu; okraj stínu po podílech a volitelná mřížka 0,25 m; A2.5 až A2.7 nezačato |
| `sesna-b` | `64e622b` | znění 2 (`d2fb217`) | B2.1 zčásti (generátor dál hlídá průchod 0,6 m místo 0,74 m), xBake hotov podle vlny 1, brány podle D-035 a díly z `geom.js` neuděláno; B2.2 až B2.5 a B2.7 nezačato |

Výsledek sloučení nanečisto s těmito hlavami je v oddíle „Znění 3“ výše. Zkouška z 23. 11. (`cc5078f` + `a1d3081` + `129318d`): 722 kontrol, 0 selhalo.

## Co je hotové (základ 1)

| Část | Kde | Stav |
|---|---|---|
| jádro: systémy, fáze, závislosti, deklarované události, pevný krok 120 Hz, režimy, uložení stavu | `src/kernel` | 41 kontrol v T0 |
| xSpace 1: popis formátů, validátor se stálými kódy nálezů, načtení a spojení balíků, geometrie kvádrů a klínů, matice koster | `src/xspace` | 140 kontrol v T1, z toho 58 mutací |
| světlo: síť vzorků `brushLightMesh` (mřížka 0,5 m, pořadí vrcholů je kontrakt) a vzorec `lightIrradiance` | `src/xspace/geom.js`, `light.js` | 17 kontrol v T1 |
| zlatý vzorek: level xLab (5 buněk, 4 portály, 54 kvádrů, 20 entit, 10 světel, 11 spojení) a 12 prefabů s kostrou | `packs/golden`, `tools/golden/make.mjs` | bez nálezů, bajtově opakovatelný |
| xView: prohlížeč balíku (pět pohledů, vrstvy, validátor v prohlížeči) | `tools/xview` → `dist/xview.html` | 15 kontrol v T2 |
| xBench 0.2: měření stroje (28 případů, z toho 16 shodných s verzí 0.1) | `tools/xbench` → `dist/xbench.html` | 12 kontrol v T3; verze 0.1 změřena na T460, verze 0.2 zatím ne |
| xShell: menu, pauza, nastavení z deklarací, katalog nabídek | `src/shell` | 46 kontrol v T4 (jen nastavení) |
| rozpočty z měření T460 | `docs/06_ROZPOCTY.md`, `docs/mereni/` | změřeno 22. 11. 2026 |
| dokumenty: vize, architektura, kontrakty, názvosloví, rozdělení sešen, parita, rozpočty, požadavky, rozhodnutí | `docs/` | dokument polí se generuje a hlídá testem |

`npm test`: 254 kontrol; `npm run test:all` (základ, A, B, A × B): 650 kontrol, 0 selhalo (Node 22, Chromium bez grafické karty).

## Co hotové není

- **Engine podle znění 2.** xLab i levely sešny B se dají projít (`dist/xlab.html`, `dist/xlab_gen.html`), ale engine z vlny 1 svítí po pixelech; podle měření T460 tím překračuje rozpočet vykreslení.
- Shell je přestěhovaný, ne zapojený. Jeho zkoušky v prohlížeči a zkouška katalogu zůstaly ve `vibe-game-frameworks`.
- Formát zapečeného světla (návrh N-001 od sešny B; vzorky, pořadí a vrstvy jsou už dané kontraktem).
- Ořez pohledem po buňkách (vlna 2), načítání `.glb`, textury, zvuk, tvorové, editor.

## Neověřeno

- Světlo po vrcholech ve hře na T460. Měřeno je jen to, že scéna bez výpočtu světel stojí 2,4 ms a se 4 bodovými světly 14,0 ms; že síť s mřížkou 0,5 m vypadá dobře, ukáže až sešna A.
- Cena jednoho světla po pixelech, scéna bez světel v 1080 řádcích, textury (čeká na xBench 0.2).
- Čas kroku simulace na T460.
- Verze Rapieru 0.21.0 a three-mesh-bvh 0.9.18 jsou připnuté, ale nic je zatím nepoužívá.
- Hodnoty pohybu pro profil `real` (Counter-Strike, Half-Life) mají jistotu 3/5.
- Ochranná známka Blender (důvod jména xForge) je uvedena z obecné znalosti, bez právního ověření.
- Přínos druhého modulu paměti v T460.

## Otevřené pro Ondřeje

1. Zkouška terminálu (D-032) v novém sestavení sešny A: sednout si k terminálu, stisknout Esc (pauza), vrátit se do hry a říct, jestli se s vlastním kurzorem dá pracovat a jestli se po návratu hned vrátí ovládání.
2. Pět otázek sešny B ke vzhledu (`docs/sesny/B_STAV.md`, konec dokumentu).
3. Potvrdit nebo přepsat body 6/ až 8/ zadání (`00_ZADANI.md`; sestavila je svodná sešna z jeho vět).
4. Až sešna A dodá `?bench`: pustit ho na T460.

## Návrhy

Žádný otevřený. Přehled rozhodnutí v `docs/navrhy/README.md`. Oddíl „Rozhodnutí“ v souborech N-001, N-007 a N-108 doplním při příštím sloučení (soubory jsou zatím jen na větvích sešen).
