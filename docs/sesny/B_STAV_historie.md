# Stav sešny B: historie (B02, B03)

Přesunuto z `B_STAV.md` 25. 11. 2026 (soubor má mít do 600 řádků). Text beze změny; aktuální stav je v `B_STAV.md`.

## Sešna B03 (24. 11. 2026)

Ondřej v 01:11: zápis do repa a push `sesna-b` povolen; pokračovat zbytkem B2.1, potom xBake podle D-035 a dál podle stavu; do projektu v claude.ai nic nezapisovat. Odpovědi na otevřené otázky: **1 (a)** opotřebený provoz, **2 (a)** z webu jen materiály a textury, tvary vlastní, **3 (a)** herní vzhled nejdřív v galerii sady. K otázce 5 (silnější stroj): „podívej se na alza.cz nebo na jiný web, co je dneska zlatý standard pro hry a udělej to podle takovéhle konfigurace (řekněme celý počítač bez monitoru do 35.000,- s DPH, nebo notebook)“.

| Krok | Stav | Commit |
|---|---|---|
| sloučení `origin/zaklad-2` (`67d2075`: jen průběžná předávka svodné sešny) | hotovo, bez konfliktů; výchozí regrese 242 + 16 sad + 123 + 28 + 9, vše zeleně | `1b896c1` |
| B2.1 zbytek: průchodnost podle skutečného hráče, světlost dveří, návrh N-008 | hotovo | `d2e1481` |
| xBake podle D-035: brány, stínění kolizemi, okraj stínu po podílech, čtení bez Node | hotovo | `3d1aa2a` |
| náhled xBake 0.3, díly z `partMesh` a `partTris` v náhledu, galerii a knihovně prefabů, N-001 znění 2 | hotovo | `7dd9cd2` |
| sloučení `origin/zaklad-2` (`a995347`: mřížka světla znění 2, D-037) a xBake nad `levelLightMeshes` | hotovo, bez konfliktů; svodná sešna to pushla během této sešny | `2cde996`, `9d34aa6` |
| B2.3 xSearcher: nástroj, 10 textur CC0 v příjmu, test bez sítě | hotovo | `5828344`, `24e2358` |
| B2.4 textury: 21 materiálů, galerie se třemi pohledy, návrh N-009 | hotovo | `7204c2d`, `046f9a7`, `951044a`, `70d2473` |
| B2.2, B2.4 bohatší hrubý tvar, B2.5, B2.7 | nezačato | |

**B2.1: průchodnost.** Rozměry postavy má generátor na jednom místě (`src/gen/body.js`: poloměr 35 cm, odstup kontroléru 2 cm, rezerva 3 cm) a předvolby je předávají v `params().body`. Cestu místností hledá s poloměrem 0,40 m (dřív číslo 0,32 m v `passage.js`). Stavba odmítne pokus, kde by otvor nebo otevřené dveře nepustily 0,80 m (`catalog.clearWidth`: světlost z kolizí prefabu s kloubem dveří na dorazu). Nezávislé kontroly (`test/b_lib/level-checks.mjs`) měří skutečným hráčem levelu: poloměr z `src/play/profiles.js` a odstup z `src/phys/phys.js` (jen čtou; 0,35 + 0,02 m, průchod 0,74 m). Nová zkouška `test/b_lib/door-pass.mjs`: největší kruh, který projde otevřenými dveřmi v půdorysu (kolize prefabu a zeď, mřížka 1 cm).

| Co | Hodnota | Kde a jak |
|---|---|---|
| 200 seedů × 2 předvolby + 50 jedno patro + 50 s hádankou | 0 nálezů; cesta široká 0,74 m ověřena v 9 až 31 buňkách na level | `b_t1_xgen` (55 kontrol), sandbox |
| totéž se starým poloměrem 0,32 m | 11 z 200 levelů `complex` a 42 z 200 levelů `catacombs` mělo místnost, kde mezi dvěma otvory nevedla cesta široká 0,74 m | sonda nad týmiž kontrolami; proto test dřív nic nehlásil (měřil 0,6 m) |
| dopad na vybavení | `complex` 87 662 → 87 626 entit na 200 levelů (−0,04 %), `catacombs` 25 526 → 25 439 (−0,3 %); pokusů navíc stejně (0 a 37) | sonda, 200 seedů |
| `packs/gen_demo` | bajtově beze změny (tři ukázkové levely nábytek neztratily) | `cli.mjs demo`, `git status` |
| světlost otevřených dveří pro kapsli | `door_wood_01`, `door_steel_01`, `door_plank_01`, `door_sliding_01` 0,88 m; `gate_iron_01` 0,94 m; dvoukřídlé 1,66 m; hráč potřebuje 0,74 m | `b_t2_kit` (23 kontrol), kruh v půdorysu |

Mez: kontrola průchodnosti je dvourozměrná (mřížka 0,1 m, překážka = obal čehokoli mezi 0,25 a 1,7 m nad podlahou) a buňky s plošinou nebo galerií přeskakuje. Trojrozměrně a kapslí to měří jen robot zkoušky A × B, a ten chodí nejkratší cestou.

**xBake podle D-035.** Pravidlo brány je stejné jako za běhu u sešny A (`occlusion.js`): rozhoduje úsečka z počátku paprsku vzorku ke světlu a obrys portálu z dat. Brána je **seznam** dveří (úsečka může projít dvojími), úroveň úseku je součin jejich otevření. Odraz a přístupnost okolního světla se počítají se zavřenými dveřmi; zdrojem odrazu je jen část vrstev bez brány, takže zavřenými dveřmi neprosvítá ani odraz. Zárubně stíní dál, nestíní jen kolize na pohyblivých uzlech dveří.

Po sloučení mřížky znění 2 (D-037; vzorky z `levelLightMeshes`, bez schovaných ploch):

| Level | Vzorků | Z toho v tělese | Vrstev | Dveří | Úseků (položek) | Zjemněno | Čas | Soubor | gzip |
|---|---|---|---|---|---|---|---|---|---|
| xLab | 20 509 | 490 (2 %) | 16 | 2 | 13 (584) | 1 964 | 1,0 s | 476 kB | 315 kB |
| `catacombs_3` | 33 606 | 7 038 (21 %) | 64 | 6 | 31 (1 393) | 3 613 | 2,6 s | 789 kB | 555 kB |
| `complex_21` | 61 075 | 12 383 (20 %) | 114 | 41 | 307 (11 784) | 8 162 | 6,1 s | 1 671 kB | 1 061 kB |
| `complex_7` | 65 618 | 19 051 (29 %) | 118 | 47 | 320 (13 244) | 10 059 | 7,3 s | 1 779 kB | 1 151 kB |

Sandbox, `node tools/bake/cli.mjs`; časy orientační. Převod na novou mřížku byla výměna jedné funkce: xBake počet, pořadí ani rozteč vzorků nikde nepředpokládá (plocha si nese skutečné souřadnice řad a sloupců) a `b_t6` bere počty ze zapečení v Node. Vzorků ubylo o 1 až 12 %, soubory ale o 3 až 7 % narostly. Domněnka, neměřeno: schované plochy byly v řídkých vrstvách zadarmo (samé nuly), kdežto nové vrcholy na koncích ploch nesou světlo. U generovaných levelů je vzorků v tělese pořád pětina až třetina (plochy schované jen zčásti); doplnění od sousedů je dál potřeba.

Před D-037 (stará mřížka, týž kód): xLab 20 658 vzorků, 13 úseků (565 položek), 464 kB; `catacombs_3` 38 098, 31 (1 215), 757 kB; `complex_21` 64 393, 298 (10 134), 1 559 kB, z toho 1 055 položek přes dvoje dveře; `complex_7` 73 092, 312 (11 481), 1 673 kB, 986 položek přes dvoje dveře, 63 různých bran ze 47 dveří.

Kvádr levelu stíní jen tehdy, když je vidět (`vis` není `false`) a má neprůhledné materiály (`opacity`, N-005): neviditelná kolize stín nevrhá a sklem světlo projde. Otisk `geometry` nese znění mřížky a počty vzorků po kvádrech; soubory zapečené starou mřížkou neplatí.

Co hlídá `b_t5_bake` (26 kontrol) nově: otevřené dveře pustí světlo, které projde otvorem téhož levelu bez dveří (xLab: úseky nesou 99 % toho světla; dveře zlatého vzorku nemají kolizi zárubně), a žádný vzorek ho nemá víc; se zavřenými dveřmi je světla stejně jako dřív, když křídla stínila (součet 62 556 proti 62 557); barvy rostou s otevřením dveří; okraj stínu je proti jemnému výpočtu (12 × 12 paprsků) blíž než jeden paprsek (součet odchylek 47,4 proti 356,6 na 2 033 dvojicích); soubor jde přečíst z `ArrayBuffer`; otisk geometrie se změní s kvádrem i s jeho viditelností.

**Náhled xBake 0.4** (`dist/xbake.html`; 0.3 byl týž náhled nad starou mřížkou): nové přepínače „Dveře otevřené“ (dveře portálů se nakreslí na dorazu a úseky s bránou se rozsvítí) a „Jemný okraj stínu“, nový pohled „Dveře laboratoře“. V montáži `test/out/b_bake_montaz.png` je to vidět: zavřenými posuvnými dveřmi z laboratoře do chodby nic nesvítí, po otevření je na podlaze chodby světlá skvrna; okraj stínu sloupu už nemá zuby po buňkách. Vidět je i to, co zůstalo: stín je po půlmetrové mřížce rozmazaný a na stropě haly je mezi sloupy tmavý pás. Ten pás není vada výpočtu: světla haly `l_hall_1` a `l_hall_3` visí 0,5 m pod stropem a 0,6 m vedle sloupů `b_pillar_050` a `b_pillar_052`, takže sloup zakryje široký výsek stropu (sonda: 190 z 1 592 stropních vzorků haly má méně než polovinu světla; stíní je sloupy ve 118 případech a zdi v 55). Je to vlastnost dat zlatého vzorku a hodí se k N-105 (svítivosti a rozmístění světel xLabu).

**Cílový stroj pro horní stupně (odpověď na otázku 5).** Průzkum trhu 24. 11. 2026 (web, ceny s DPH; ověřovala jsem jen z webu, ne nákupem):

| Co se vejde do 35 000 Kč | Sestava | Cena a zdroj |
|---|---|---|
| stolní PC, hotové | Intel Core Ultra 5 225F, **RTX 5060 Ti 8 GB**, 16 GB DDR5, 1 TB SSD, Windows 11 (LYNX Challenger) | 33 990 Kč, alza.cz |
| stolní PC, hotové | Ryzen 5 5600, **RTX 5060 Ti 16 GB**, 16 GB DDR4, 1 TB SSD, Windows 11 | od 34 400 Kč, bestcomp.cz (stránka starší, cenu jsem neověřila k dnešku) |
| stolní PC těsně nad mezí | Core i5 nebo Core Ultra 5, RTX 5060 Ti 16 GB, 32 GB RAM, 1 až 2 TB SSD (AlzaPC GameBox Prime) | 36 990 až 42 990 Kč podle procesoru a disku, alza.cz |
| notebook | Core i7-13645HX nebo Ryzen 7 250, **RTX 5060 8 GB** (100 až 115 W), 16 GB DDR5, 1 TB SSD, 144 až 165 Hz (Lenovo LOQ 15) | 28 790 až 29 690 Kč, alza.cz (druhý bez systému a adaptéru) |

Souvislosti: paměti a grafiky letos zdražily (kit 32 GB DDR5 stojí 12 až 13 tisíc Kč, RTX 5060 Ti 16 GB kolem 21 tisíc Kč; svetandroida.cz, 16. 11. 2026), proto se do 35 tisíc vejde verze s 16 GB grafické paměti jen se starší platformou. Ve Steam Hardware Survey je od července 2026 nejčastější grafická paměť 16 GB a v září 2026 byla nejčastější kartou RTX 5070 (5,86 %).

**Co z toho beru pro projekt** (rozhodnutí sešny B pro její nástroje a data; čísla stupňů 2 a 3 zůstávají odhad, dokud je nezměří xBench na takovém stroji, D-029):

- Stupeň 2 `mid` = notebook s RTX 5060 8 GB. Stupeň 3 `high` = stolní PC s RTX 5060 Ti. **Závazná mez pro data je 8 GB grafické paměti**; 16 GB je rezerva, na kterou se nespoléhám.
- Hrubý poměr výkonu grafiky proti T460 podle PassMark G3D: HD 520 kolem 865 bodů, RTX 5060 Ti 16 GB 22 635, RTX 5070 28 683, tedy zhruba 26× až 33×. Je to syntetický test, ne měření našeho enginu.
- Textury: originály držet v 2K (sada map ambientCG 2K-JPG má 36 MB; 4K 131 MB je pro 8 GB paměti a obraz 1080p až 1440p zbytečná), odvozovat 512 px pro `low`, 1K pro `mid`, 2K pro `high`. Normálové mapy a mapy drsnosti vyrábět a ukládat od začátku, i když je T460 nepoužije.
- Tvar: nejvyšší úroveň detailu prefabu smí mít řádově 5× až 10× víc trojúhelníků než dnes; T460 dostane dnešní hrubý tvar jako nižší úroveň (až bude pole `lod`, D-030).
- Světlo: na stupních 2 a 3 je místo pro světla po pixelech a stínové mapy; zapečené vrstvy xBake zůstávají základem pro všechny stupně.

**Ondřej ve 02:04** (odpovědi na tři otázky z konce této sešny): mez grafické paměti pro horní stupeň **(a) 8 GB**; co dřív **(a) xSearcher a první textury v galerii**, okna, mříže a zbytek přijatých polí až potom; náhled zapečeného světla pro vygenerované levely **(b) počkat, až soubor načte hra**. K tomu průběžná předávka: `xEngine_sesnaB03_predavka_2026-11-24.md` (poslaná Ondřejovi do chatu, v repu není).

**Ondřej v 15:58** (po přepnutí modelu na Opus 5.5 kvůli limitu): pokračovat v práci a „přesuň paměť z chatu do repa“: `CLAUDE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TODO.md`; „Ztrácíme se občas v tom, co je už hotové a co ne.“ Provedeno (`TODO.md` + úprava `CLAUDE.md`, commit níže):

- **`TODO.md` v kořeni repa je nový:** jedna stránka, co je hotové, co se dělá, co čeká na koho; oddíl pro každou sešnu, každá mění jen svůj. Oddíly svodné sešny a sešny A jsem napsala podle `START_SVOD.md` (`a995347`) a `A_STAV.md` (`db6fad0`); dál je vedou ony.
- **`CLAUDE.md` patří základu; upravila jsem ho na Ondřejovo výslovné slovo:** přidán oddíl „Co to je a jak to spustit“, `TODO.md` v seznamu čtení a v kroku „Konec každého kroku“, řádek o sdílení `TODO.md`. Svodná sešna to při sloučení převezme nebo upraví.
- **`ARCHITECTURE.md` a `DECISIONS.md` jsem nezakládala:** existují jako `docs/01_ARCHITEKTURA.md` a `docs/DECISIONS.md` (D-001 až D-037) a `CLAUDE.md` na ně teď odkazuje hned nahoře. Druhá kopie v kořeni by byla druhá pravda.
- Ostatní sešny uvidí `TODO.md` až po sloučení do základu (push mám jen na `sesna-b`).

**B2.3 xSearcher (24. 11. odpoledne, `5828344`, `24e2358`).** Nástroj `node tools/searcher/find.mjs "<dotaz>"` hledá textury v Poly Haven a ambientCG (český dotaz přeloží malým slovníkem: „beton podlaha“ → concrete floor), u každého výsledku jmenuje zdroj, autora a rozměr předlohy. `--get <zdroj>:<id>` stáhne 2K mapy do `packs/_inbox/<zdroj>/<asset>/` se záznamem `record.json` (licence s doložením a datem přečtení, podmínky rozhraní, autor, adresy, datum, dotaz, rozměr předlohy, u každého souboru velikost, SHA-256, adresa, MD5). Z Poly Haven bere barvu, normálu GL a ARM (okolní stín, drsnost, kovovost v jednom souboru jako glTF), z ambientCG archiv ZIP, ze kterého vybere barvu, normálu GL, drsnost, okolní stín a kovovost nebo průhlednost, jsou-li. Když velikost nebo MD5 souboru nesedí na rozhraní, nezapíše nic. `--inbox` ověří otisky na disku. Brána: jen `CC0-1.0` ze zdroje s doloženou licencí, jen textury; modely nástroj odmítne s odkazem na Ondřejovu volbu 2 a.

Licence ani jedno rozhraní u assetu neuvádí, brána se proto opírá o licenci zdroje, přečtenou 24. 11.: Poly Haven „všechny assety CC0“ (`polyhaven.com/license`), ambientCG „Creative Commons CC0 1.0 Universal“ (`docs.ambientcg.com/license/`). **Podmínky rozhraní Poly Haven** (`ToS.md` v jejich repu na GitHubu) chtějí u každého volání vlastní User-Agent se jménem programu a aby uživatel programu viděl, že obsah je z Poly Haven; nástroj obojí dělá (`xEngine-xSearcher/0.1 (+adresa repa)`, jméno zdroje u výsledků a stažení). Assety samy uvedení autora nevyžadují.

V příjmu je 10 textur pro materiály sady (tabulka v `tools/searcher/ZDROJE.md`): `concrete_floor_worn_001`, `painted_plaster_wall`, `old_linoleum_flooring_01`, `rusty_painted_metal`, `old_planks_02`, `red_brick`, `stone_brick_wall_001` z Poly Haven a `Tiles107`, `DiamondPlate008C`, `Ground110` z ambientCG; 82,5 MB. Do balíků zatím nic nešlo; to je B2.4 (odvozené 512 px a 1K, položky `pack.json.assets` přes `packAsset`).

Test `b_t7_searcher` (47 kontrol) běží bez sítě nad odpověďmi nahranými 24. 11. (`test/b_lib/searcher/`, 160 kB; seznam 871 textur Poly Haven zkrácen na 50 položek skriptem `nahrat.mjs`, který jde pustit znovu). Hlídá hledání a řazení, bránu (CC-BY, neznámá licence, licence mimo slovník, model, id s cestou, zdroj bez doložení), MD5 a velikost, výběr map z archivu, otisky, poškozený soubor v příjmu, User-Agent, validátor balíku s `free: true` (CC0 projde, CC-BY ne) a příkazovou řádku s `--replay`.

**B2.4 textury (24. 11. odpoledne, `7204c2d`, `046f9a7`, `951044a`, `70d2473`).** Z příjmu xSearcheru (19 assetů, 157,1 MB, 2K) vyrábí `tools/forge/textures.mjs` textury sady: barvu a normálovou mapu GL jako WebP 512 px (stupeň `low`) do `packs/kit_base/textures/` a zámek `tools/forge/kit/textures.lock.json` s otisky, původem (zdroj, autor, licence, adresa originálu a jeho otisk) a průměrnou barvou hotového souboru lineárně. Přiřazení je v `tools/forge/kit/textures.mjs`: 21 materiálů z 15 textur (beton, omítka, dlaždice, linoleum, plech, natřená a broušená ocel, tři dřeva, cihla, tři kameny, hlína). `make-kit.mjs` z něj doplní materiálům `albedo`, `normal`, `uvScale` (rozměr předlohy ze záznamu) a do `pack.json` 30 položek `assets`; příjem k tomu nepotřebuje. 30 souborů, 1 287,4 kB (1 318 258 B); dva běhy dají stejné bajty. `sharp` 0.35.5 je nově v `devDependencies` (výjimka pro sešnu B; zámek balíčků necommitován).

Jen 512 px: formát má na mapu jednu cestu a tu čte i T460. Rozlišení 1K a 2K pro stupně 2 a 3 čekají na jména polí z N-006 (D-030); originály 2K leží v příjmu. Normálové mapy jsou v poli `normal` také 512 px; T460 je nepoužije (světlo po vrcholech).

**Rozpor v kontraktu, návrh N-009.** Formát říká, že `color` „násobí texturu“, N-006 a D-029 berou `color` jako vzhled stupně 0 a zálohu. Platí to současně jen pro texturu s průměrem 1. Změřeno: barvy materiálů jsou proti průměru vyfocených textur u 18 z 21 materiálů světlejší, většinou 1,5× až 5,5× (beton 0,50 proti 0,09 lineárně), zesílení vychází 0,53 až 7,18. Doslovné násobení by povrch s texturou ztmavilo až sedmkrát, zapečené zesílení by useklo světlá místa. Návrh N-009 (varianta a): `color` je průměrná barva povrchu a běh kreslí `textura × (color / průměr textury)`, průměr v novém poli `albedoMean`. Data `kit_base` tomu odpovídají už teď (`color` beze změny), průměr je zatím jen v zámku. Kde odstín textury nesedí na barvu materiálu víc než 1,35×, bere sada z textury jen šedou kresbu (5 z 21: linoleum, natřená ocel, tři kameny; dub 1,47× také).

**Galerie 0.2** (`dist/kit.html`, 2 573 327 B, dřív 745 kB): přepínač pohledů **Čistý** (barva), **T460** (textura barvy, Lambert, bez normál) a **Grafická karta** (`MeshStandardMaterial`, normálová mapa, drsnost, kovovost, odrazy okolí z `RoomEnvironment`). Textury bere přímo z balíku přes `import … with { type: 'bytes' }` (esbuild 0.28; `build.mjs` beze změny), tónové mapování AgX ve všech pohledech stejně. Panel prefabu vypisuje u každého materiálu zdroj, autora a licenci textury. Měřeno v sandboxu (`swatchStats`, stěna 2 × 2 m čelně): průměrný jas s texturou je u 21 materiálů do 7,6 % od jasu bez textury (pravidlo N-009 drží); v pohledu Grafická karta je obraz o 15 až 30 bodů z 255 světlejší, protože přibude světlo okolí. Montáže: `test/out/b_kit_pohledy.png` (10 prefabů ve třech pohledech) a `test/out/b_kit_vzornik.png` (21 materiálů).

Co z obrazu vidím (softwarové vykreslení, ne grafická karta): kresba je výrazná u cihly, hlíny, kamenů, natřeného plechu a prken; beton, omítka a dlaždice jsou jemné. Smrk (`kitchen_wood`) má kvůli světlé barvě materiálu a zesílení 4 až 5 bledé pruhy. Světlé kameny vypadají spíš jako mramor. Obojí souvisí s tím, že barvy materiálů jsou světlejší než skutečné povrchy (N-009, vedlejší nález); jestli je ztmavit, je otázka na Ondřeje.

**Ondřej ve 19:55** (odpovědi na tři otázky B2.4): **1 a** barvy materiálů stáhnout k barvám skutečných povrchů a v generovaných levelech přidat expozici; **2 a** směr textur sedí; **3 a** bohatší tvar prefabů. K tomu doslova: „chci více těles, více prefabů, bohatší tvary (zkosení, drobné díly, reliefy, výstupky, mezery, škvíry, římsy, nepravidelnosti, výstupky, zakřivení, prohlubně); chci možnost otevírat i spodní šuplíky nezávisle na prvním, realističtější barvu dřeva, sukovitost, trhliny, letorosty, vnitřní kompartmentizaci“. Otázka zpět (čeká): „vnitřní kompartmentizace“ = (a) přihrádky v šuplících a police ve skříních, nebo (b) kresba dřeva (kompartmentalizace podle Shiga); pracuju s (a).

**Barvy podle skutečných povrchů (1 a, 24. 11. večer).** 21 materiálů (všechny s texturou a `plastic_ivory`) má jas podle referenčního albeda, odstín zůstal: starý beton 0,2 až 0,3, nový 0,4 až 0,55, omítka 0,4 až 0,45, čerstvé dřevo 0,35 až 0,42, staré zvětralé 0,12 až 0,16, bílá akrylová barva 0,8, kovy 0,5 až 0,98 (lineárně; polycount.com, docs.studio-397.com, shinsoj.artstation.com). Například `concrete_raw` 0,50 → 0,25, `wood_pine` 0,60 → 0,38, `plaster_light` 0,79 → 0,55; `metal_floor` 0,34 → 0,45 (kov). Plochou vážený jas povrchů (kvádry i pevné díly prefabů podle `levelSamples`, 30 levelů na předvolbu): `complex` 0,513 → 0,325, `catacombs` 0,307 → 0,209. O ten poměr (1,578 a 1,468) je vyšší expozice předvoleb: `complex` 0,6 → 0,95, `catacombs` 0,7 → 1,03; průměrný jas obrazu tedy zůstává, liší se poměr mezi materiály. `gen_demo` se změnil jen v `env.exposure`. Galerie: expozice AgX 1,15 → 1,7. Zesílení textur (N-009) kleslo, protože barvy jsou blíž fotkám.

**Co mezitím udělala sešna A** (`origin/sesna-a` = `c131ac4`, její `A_STAV.md` z 24. 11.; v této větvi není; od 05:30 je hlava `db6fad0`: zorné pole jako vodorovný úhel při 4 : 3 se stropem 120°, dveře od hráče jako nastavení, Ondřejovy odpovědi z 02:26 „1 b“ a „2 a“):

| Co | Co to znamená pro sešnu B |
|---|---|
| Ondřejova zkouška na T460 (F3, 15 pohledů): stavba vrstev světla při načtení trvá v `complex_7` 24,3 s při mřížce 0,5 m a 44,4 s při 0,25 m (xLab 1,2 a 1,5 s) | levely z generátoru potřebují zapečené světlo; soubor z xBake má smysl, až ho běh načte (čtení je připravené v `tools/bake/read.mjs`, do základu ho přenese svodná sešna) |
| návrh **N-110**, otevřený: Ondřej po zkoušce mřížky 0,25 m řekl „chci ještě míň, chci 0,05 m“; po vrcholech to nejde, navrhuje texturu světla (atlas ploch, bod 5 cm, vrstvy a brány jako dnes) zapékanou v xBake | kdyby byl přijat: xBake a formát N-001 dostanou další druh vrstvy a souřadnice do atlasu ze základu. Do rozhodnutí na tom nepracuju |
| návrh **N-109**, otevřený: otočné dveře se mají otvírat od hráče (Ondřejova volba 4 b u sešny A); chce v datech kloub na obě strany (`min = −max`, `rest = 0`) u dveří bez dorazů | všechny moje otočné dveře dorazy mají (kryjí škvíry, N-007 a D-036) a otvírají se na jednu stranu. Dveře na obě strany by potřebovaly jiné těsnění škvír než doraz. Do rozhodnutí data neměním |
| popis pravidla bran pro základ (dodatek k D-035) | shoda v podstatě: brána je množina dveří a svítí součinem otevření, vzorek smí být ve víc úsecích. **Rozdíly, které musí svodná sešna sjednotit:** její stínítka jsou jen kvádry levelu, moje i kolize prefabů; její paprsek začíná 0,03 m směrem ke světlu a končí 0,02 m před ním a světlo na ploše odsouvá o 0,1 m, můj začíná 2 cm po normále a 1 cm ke středu plochy a posledních 0,3 m před světlem nestíní; její vzorek ve stavbě přebírá bránu od souseda, můj dostává průměr platných sousedů |

**Co se stalo 23. 11. po půlnoci.** Po sloučení se základem 2 selhala zkouška A × B ve dvou kontrolách: místnosti za dvoukřídlými dveřmi byly pro kapsli hráče nedosažitelné (`c_store_08`, `c_lab_05`, `c_store_12` v `complex_7`, `c_store_02` v `complex_21`). **Příčina byla moje:** dočasné řešení k N-007 nezapisovalo dvoukřídlé dveře do `portal.door` a navigace robota (`test/t5_lib/robot.mjs`) hledá dveře jen tam. Oprava (`129318d`): křídla mají `interact.seeThrough: true` (pole přijaté v N-107) a první křídlo je zase v `portal.door`. Pohled portál nezavírá, průchod a zvuk ano. Po opravě: všechny buňky dosažitelné, robot došel do nejvzdálenější buňky ve všech třech levelech (`complex_7` 57,9 m, `complex_21` 42,5 m, `catacombs_3` 26,3 m), dveře otevřel rukou, vynuceně žádné. Je to první zkouška nad dnešními katakombami a dveřmi.

**Ondřej 22. 11. ve 23:33** (po zhlédnutí náhledu xBake na svém stroji): odraz slabší; dál předávka a nová sešna. Provedeno: vrstva `indirect` nese v hlavičce `weight: 0,5` (`cc4f1fc`), data vrstvy jsou dál plná. Z jeho snímků: zapečení xLabu v jeho Chrome trvalo 2,37 s; stíny sloupů v hale jsou na podlaze **hranaté skvrny** (vzorky po 0,5 m, stín má u každého vzorku jen dvě hodnoty); vnější strany zdí byly v přehledu černé (opraveno přisvícením přehledu, náhled 0.2).

**První věc pro xBake příště** (zapsáno 23. 11.): víc stínových paprsků na vzorek. **Hotovo v B03**: okraj stínu po podílech plošky, 4 × 4 paprsky.

**Znění 2 základu 2 (23. 11. 2026, sloučeno `8387674`, bez konfliktů).** Svodná sešna mezitím rozhodla mé dva návrhy a návrh sešny A o mřížce. Co z toho plyne pro tuhle větev:

| Rozhodnutí | Co říká | Co to znamená pro sešnu B | Stav |
|---|---|---|---|
| D-035 (N-001) | soubor `levels/<id>.light.bin` přijat; křídla dveří v portálech při zapékání nestíní, světlo zadržuje brána za běhu (úsek vrstvy s polem `gate`); vrstva `indirect` se bránou neřídí; čtení souboru (`decodeBake`) přejde do základu při příštím sloučení | dveře portálu vyřazeny ze stínících těles, světlo otvorem s dveřmi je v úseku s `gate`; `b_t5_bake` a návrh N-001 doplněny. Pole `baked` do balíků dál nepíšu | **hotovo** (B03, `3d1aa2a`) |
| D-036 (N-007) | zakrytí otvoru se počítá ze všech neprůhledných dílů dveří v klidu (bod 1 přijat); seznam entit u portálu zamítnut; dvoukřídlé dveře budou jeden prefab se svázanými klouby, až základ dodá `follow` (N-002); do té doby `seeThrough` | data už tomu odpovídají (`129318d`). Až bude `follow`: z `door_double_*` udělat jeden prefab a `seeThrough` u něj zrušit | čeká na základ |
| D-037 (N-108) | základ změní mřížku světla: vrcholy na násobcích `LIGHT_CELL` ve světě, bez ploch schovaných v jiném kvádru; počet a pořadí vzorků se změní | základ to provedl (`a995347`); vzorky beru z `levelLightMeshes`, počty a pořadí natvrdo nikde nejsou; otisk `geometry` nese znění mřížky, staré soubory neplatí. Vzorků „v tělese“ ubylo (xLab 1 387 → 490, `complex_7` 32 291 → 19 051), čísla v oddílu „Sešna B03“ | **hotovo** (B03, `9d34aa6`) |
| N-101 proveden | `partMesh`, `partTris`, `partCollider`, `CYL_SEGMENTS` jsou v `src/xspace/geom.js` | vlastní výpočet dílů na čtyřech místech zmizel: `tools/forge/lib.mjs` předává `partTris` ze základu, galerie a náhled xBake kreslí `partMesh`, xBake stíní přes `partCollider`; `packs/kit_base` bajtově beze změny | **hotovo** (B03, `7dd9cd2`) |

Pořadí (podle Ondřejovy volby z 24. 11. ve 02:04): ~~B2.3 xSearcher~~ a ~~B2.4 textury~~ (hotovo 24. 11. odpoledne) → zbytek B2.4 (bohatší hrubý tvar) a B2.5; původně **B2.4 vzhled** (směr „opotřebený provoz“, z webu jen materiály a textury, poprvé v galerii; originály 2K, odvozeně 1K a 512 px; z B2.2 jen to, co vzhled potřebuje) → B2.5 zkouška povrchu na jednom kusu → zbytek B2.2 (okna, mříže, `components.place`, `speed`).


## Hotovo × neuděláno

| Úkol | Stav | Test | Poznámka |
|---|---|---|---|
| B1.1 xGen: stavebnice a rozvržení | hotovo | `b_t1_xgen` 55 (Node) | předvolby `complex` (dvě patra s galerií, nebo jedno patro s plošinou a rampou) a `catacombs`; 500 levelů bez nálezu validátoru; katakomby po Ondřejově volbě 2 (b) |
| B1.2 xForge: sada prefabů | hotovo, vzhled nevyhovuje | `b_t2_kit` 32 (Node), `b_t3_galerie` 12, `b_t4_levely` 20 (prohlížeč) | `kit_base`: 49 prefabů, 27 s kloubem (33 kloubů), 41 materiálů; galerie `dist/kit.html`; generátor rozmisťuje 47 ze 49. Ondřej 22. 11.: tvary dobré, ale „příliš sterilní“ (viz Rozhodnutí a N-006). Zavřené dveře jsou od B02 bez škvír (N-007) |
| B1.3 xBake: zapečené světlo | hotovo podle zadání vlny 2 a D-035; běh soubor zatím nečte (čtení přejde do základu) | `b_t5_bake` 26 (Node), `b_t6_bake_nahled` 9 (prohlížeč) | světlo po vrcholech `brushLightMesh`, jedna vrstva na světlo se zastíněním a s úseky za dveřmi (brány), okraj stínu po podílech, k tomu vrstva odrazu (RGB) a přístupnosti okolního světla; xLab 20 509 vzorků za 1,0 s, soubor 476 kB; nástroj `node tools/bake/cli.mjs packs/<balík>`, náhled `dist/xbake.html`, montáž `test/out/b_bake_montaz.png` |
| B1.4 xSearcher: příjem assetů | hotovo jako B2.3 (24. 11. 2026) | `b_t7_searcher` 47 (Node, bez sítě) | jen textury; modely nestahuje (Ondřejova volba 2 a), zvuky nemají zdroj; tabulka zdrojů a příjmu v `tools/searcher/ZDROJE.md` |

Po B2.4 (24. 11. 2026, `951044a`, sandbox): `npm test` 254 kontrol, `npm run test:b` 7 sad ze 7, 201 kontrol (`b_t2_kit` 32, `b_t3_galerie` 12), `npm run test:axb` 28 + 9: engine sešny A balík s texturami načte a robot projde. Skupinu A jsem nepouštěla (její testy berou zlatý vzorek).

Po B2.3 (24. 11. 2026, `24e2358`, sandbox): `npm test` 254 kontrol, `npm run test:b` 7 sad ze 7, 188 kontrol (`b_t7_searcher` 47 nových), vše zeleně. Skupinu A a zkoušku A × B jsem nepouštěla: změna je jen v `tools/searcher`, `packs/_inbox/.gitignore` a testech B.

Poslední celý běh (24. 11. 2026, `9d34aa6`, po sloučení znění 3 základu 2, `npm run test:all`, sandbox): základ `npm test` 254 kontrol (T0 41, T1 140, T4 46, T2 15, T3 12), skupina A 16 sad z 16 (267 kontrol), skupina B 141 kontrol v 6 sadách (`b_t1_xgen` 55, `b_t2_kit` 23, `b_t3_galerie` 8, `b_t4_levely` 20, `b_t5_bake` 26, `b_t6_bake_nahled` 9), zkouška A × B 28 + 9. Celkem 699 kontrol, 0 selhalo. Před sloučením (`7dd9cd2`, základ `67d2075`): 687 kontrol, 0 selhalo.

## Sešna B02 (22. 11. 2026 večer)

Ondřej ve 22:24: zápis do repa a push `sesna-b` ano; znění 2 sloučit hned; pořadí práce katakomby → škvíry u dveří → xBake → xSearcher a textury.

| Krok | Stav | Commit |
|---|---|---|
| sloučení znění 2 základu (`origin/zaklad-1`, `16548b4`) | hotovo, bez konfliktů | `ff4af58` |
| katakomby podle volby 2 (b) | hotovo | `b2f5ef0` |
| škvíry u dveří, dveře portálu, prkenné dveře, návrh N-007 | hotovo | `6d5f90f` |
| B1.3 xBake a N-001: výpočet, formát, test | hotovo | commit „xBake: zapečené světlo po vrstvách“ |
| B1.3 xBake: náhled v prohlížeči, snímek vedle xView, potlačení zrnění odrazu | hotovo | commit „xBake: náhled“ |
| slabší odraz (váha 0,5), přisvícený přehled v náhledu | hotovo | `cc4f1fc` |
| sloučení základu 2 (`origin/zaklad-2`, `b12f8ed`) | hotovo, bez konfliktů | `588ff12` |
| oprava zkoušky A × B (křídla dvoukřídlých dveří se `seeThrough`) | hotovo | `129318d` |
| sloučení znění 2 základu 2 (`origin/zaklad-2`, `d2fb217`) | hotovo, bez konfliktů | `8387674` |
| xSearcher a textury (B2.3, B2.4) | nezačato; nová sešna (neplatí: B2.3 hotovo 24. 11. 2026, viz Sešna B03) | |

**Dveře.** Engine sešny A bere zavřené dveře portálu jako neprůhledné a místnost za nimi nekreslí (její N-107). Sada měla kolem křídla skutečné škvíry: 1 cm pod křídlem a pod překladem, 0,5 cm po stranách, 4 mm mezi prkny prkenných dveří, 8 mm mezi křídly dvoukřídlých dveří. Zkouška paprsky (`test/b_lib/door-cover.mjs`) jimi před opravou prostrčila 1 374 až 8 352 paprsků na jedny dveře, po opravě žádný. Oprava: dorazy zárubně za křídlem (přesah 15 mm), prahová lišta 12 mm bez kolize, jádro prkenných dveří, krycí lišta na pravém křídle dvoukřídlých dveří, u posuvných dveří uzavřená štěrbina stojky nad křídlem. Generátor zapisuje do `portal.door` každé dveře, které v otvoru stojí; u dvoukřídlých první křídlo a obě křídla mají `seeThrough` (od `129318d`, shodně s D-036). Prkenné dveře mají otvor 1,0 × 2,0 m místo 0,9 × 2,0 m (světlost 0,90 m): svodná sešna v T5 zjistila, že 0,80 m projde postava široká 0,74 m jen středem.

**xBench 0.2 na T460** (tři běhy 22. 11. 2026 ve 20:57, 21:32 a 21:35; surová data svodná sešna uložila do `docs/mereni/` ve větvi `integrace-1`). Interiér přes celý obraz, 1366 × 768, medián v ms:

| Případ | běh 1 | běh 2 | běh 3 |
|---|---|---|---|
| světlo po vrcholech | 2,41 | 2,41 | 2,44 |
| totéž s texturou (jedna, 256 px, s mipmapami) | 2,98 | 3,48 | 3,23 |
| totéž s vyhlazováním hran | 6,80 | 6,85 | 8,60 |
| totéž s 1 světlem po pixelech | 4,65 | 4,65 | 6,30 |
| 4 světla po pixelech | 9,85 | 10,45 | 10,70 |
| 300 tis. △ (bez interiéru) | 3,83 | 3,63 | 3,78 |
| 600 tis. △ (bez interiéru) | 6,13 | 6,50 | 7,15 |

Co z toho čtu pro obsah (výklad, ne měření): (1) textura barvy je na T460 levná, +0,6 až +1,1 ms; víc velkých textur naráz změřeno není. (2) Světlo po pixelech zůstává drahé, takže normálové mapy a odlesky nemají na T460 čím svítit: „život“ tam musí nést textura barvy a zapečené světlo se stíny; normálové mapy patří do dat pro stroj s grafickou kartou. (3) Vyhlazování hran stojí +4,4 až +6,2 ms a na T460 bude spíš vypnuté; drobný detail proto patří do textury, ne do tenké geometrie. (4) Trojúhelníků je rezerva: 300 tisíc pod 4 ms, moje levely mají celé nejvýš asi 88 tisíc. Rozptyl mezi běhy je velký (4 bodová světla 6,8 / 7,7 / 10,4 ms); rozdílům pod 2 ms nevěřím na desetiny.

**Zadání znění 2** (`docs/00_ZADANI.md`) pro sešnu B: xForge má být nástroj typu Blender, nebo takový, který Blender využívá a učí se (bod B/; D-011 už neříká „jen knihovna generátorů“). „Sám se učí“ umím splnit jako knihovnu receptů a pastí, která roste s každým assetem; nástroj, který se zlepšuje bez sešny, neslibuju (řekla jsem to Ondřejovi 22. 11.). Do mezí 50 a 100 MB se grafika a zvuky nepočítají (bod 5/). Body 6/ až 8/ jsou Ondřejova slova z 13:51, na která odpovídá N-006. Podle oddílu C chybí v sadě stromy, tvorové a jejich pohyby, zbraně, zdi s prasklinami a obrazy.

## Rozhodnutí Ondřeje (22. 11. 2026, 13:51)

| Otázka | Volba | Stav v kódu |
|---|---|---|
| 1. hustota vybavení v komplexu | (a) nechat | platí, nic se nemění |
| 2. katakomby | (b) stropy zvednout na 2,6 m, chodby rozšířit na 1,6 m | **hotovo** (B02): stropy 2,6 až 3,2 m, chodby 1,6 až 1,9 m; hlídá `b_t1_xgen` (nejnižší strop 2,60 m, nejužší chodba 1,60 m přes 200 seedů) |
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
| 0 | navázání a sloučení znění 2 | **hotovo** (`ff4af58`) | základ 232 kontrol |
| 1 | katakomby podle volby 2 (b): stropy aspoň 2,6 m, chodby aspoň 1,6 m | **hotovo** | 200 seedů bez nálezu, `gen_demo` přegenerovaný (`catacombs_3`: 30 buněk místo 33); průchody mezi chodbami zůstávají oblouky široké 1,3 až 1,8 m |
| 2 | škvíry u dveří, dveře portálu, návrh N-007 | **hotovo** | zkouška paprsky v `b_t2_kit` a `b_t1_xgen` |
| 3 | B1.3 xBake + N-001 (Ondřej 22. 11. večer: xBake před xSearcherem) | **hotovo**: zapečení xLabu 1,1 s (mez 60 s), stín sloupu měřitelný v číslech i v obraze, součet vrstev bez zastínění = `lightIrradiance` (odchylka 5,9e-8), návrh N-001, náhled `dist/xbake.html`, montáž vedle xView | na T460 jediná cesta ke stínům (D-022). Stíny jsou po půlmetrové mřížce rozmazané; povrchy jsou dál jednobarevné, takže sterilní vzhled tím sám nezmizel |
| 4 | B1.4 xSearcher: `tools/searcher/find.mjs "<dotaz>" --type model\|texture\|sound`, příjem do `packs/_inbox/<zdroj>/<asset>/` se záznamem | 10 stažených assetů se záznamem, test na uložených odpovědích bez sítě, balík `free: true` odmítne jinou licenci než CC0 a vlastní | začít Poly Haven a ambientCG (mají rozhraní a soubory jdou stáhnout); `packs/_inbox` nepatří do gitu |
| 5 | život beze změny formátu: válce s víc stěnami, náhrada zkosení a drobné díly u nejviditelnějších prefabů (dveře, stoly, skříně, bedny, sudy, svítidla), drobnosti na stoly a na zem, malé náhodné pootočení a posun nábytku v xGen | montáž „před a po“ stejných prefabů; `tris` v mezích pravidel obsahu (500 běžný, 2 000 složitý) | vidět ve všech dnešních prohlížečích i v enginu sešny A |
| 6 | herní pohled v galerii: textury barvy z CC0 zdrojů do `kit_base` přes `albedo`; tři pohledy „čistý / T460 / grafická karta“ v `dist/kit.html` | montáž aspoň 8 prefabů ve třech pohledech; součet velikosti textur zapsaný | podle xBench 0.2 (viz Sešna B02): textura barvy je na T460 levná, světlo po pixelech ne. Pohled T460 = textura × světlo po vrcholech; normálové mapy a odlesky jen v pohledu pro grafickou kartu. Původní znění tohoto kroku počítalo s normálovými mapami i pro T460; to neplatí |
| 7 | zkouška povrchu: jeden prefab (dveře) se sítí `.glb` na stejné kostře, jednou vyrobenou kódem, jednou přes `bpy` | oba kusy v galerii vedle hrubého tvaru; porovnání pracnosti a velikosti | podklad pro rozhodnutí N-006; `bpy` v sandboxu není nainstalovaný | Podle zadání B/ a D-011 je cesta přes Blender součást xForge, ne jen zkouška. |

## Sešna B04, kroky 20 až 24 (přesunuto z B_STAV 25. 11. 2026 večer)

### Sady `kit_lab` a `kit_it` (Ondřej 20:38, „600 těles“)

Tematické balíky vedle `kit_base` (volba Ondřeje): každý má `requires` (`kit_lab` → `kit_base`; `kit_it` → `kit_base`, `kit_lab`), vlastní materiály a prefaby a id se s ostatními nesmí potkat. Rozměry z katalogů výrobců a obvyklých norem (`tools/forge/lab/ROZMERY.md`), tvary obecné, bez log a názvů. Jen kvádry a válce (zapeče je xBake, D-041), do 1 000 △ na prefab.

| Sada | Prefabů | △ celkem (nejvíc) | Materiálů | Obsah |
|---|---|---|---|---|
| `kit_lab` | 286 | 93 580 (968) | 38 | sklo (kádinky, baňky Erlenmeyerovy, varné a odměrné, odměrné válce, reagenční láhve, exsikátory, stojany s byretou a s nálevkou, destilace); plasty (zkumavky, stojánky, špičky, Petriho misky, destičky, kryoboxy, střičky, kanystry, láhve HDPE, sáčky, rukavice, nádoby na ostré předměty a led); chemikálie ve 20 druzích balení (láhve 100 ml až 2,5 l s piktogramy, dózy s práškem, papírový pytel, kity, plechovka a bezpečnostní kanystr na rozpouštědla, roztoky, odpad); stolní přístroje (52: váhy, centrifugy, termomixér, vortexy, míchačky, třepačky, termocyklér, qPCR, spektrofotometry, elektroforézy, gel-doc, elektroporátor, UV lampa, pipety, vývěvy, odparka, lázně, pH metr, mikroskopy, tlakové láhve, Dewarovy nádoby); velké přístroje (UPLC, HPLC, MS, GC, GC-MS, sekvenátory, konfokální mikroskop, TEM, SEM, autoklávy, boxy třídy II, laminární box, CO₂ inkubátory, lyofilizátor, pipetovací robot, cytometr, NMR, myčka, výrobník ledu, ultračistá voda); chlazení (mrazáky −80 °C ve třech šířkách, lednice, mrazák −20 °C, truhlicový mrazák, zásobník LN2, chladicí a mrazicí komora, do které se dá vejít); nábytek (stoly ke zdi 1,2 až 1,8 m s nástavbou, ostrůvek, stůl s výlevkou, regály, bezpečnostní skříně, digestoř 1,8 m, židle, vozík, nouzová sprcha); reaktory a bioreaktory; akvária, terária, klece IVC a regál, klec pro králíka, průchozí box, izolátor, dekontaminační sprcha, odpad |
| `kit_it` | 80 | 15 128 (888) | 33 | počítače (monitory 24 až 34" i na výšku, skříně, mini, vše v jednom, notebooky, tablety, telefon, klávesnice, sestavy na stůl, tiskárny, multifunkce); serverovna (racky 42U se servery, síťový, diskové pole, otevřený rám, superpočítač, UPS, baterie, chlazení do řady a CRAH, kabelové žlaby, perforovaná dlaždice, hasicí plyn, čtečka karet, kamera, Wi-Fi); open space (stoly pro čtyři, stoly s nastavitelnou výškou, židle, jednací stoly 2,4 a 4 m, telefonní budka, tabule, akustické panely, televize, projektor a plátno, rostliny, sedačky a sedací vaky, kuchyňka, skříňky, stolní tenis, fotbálek, skleněná příčka, recepce) |

Zápis: `node tools/forge/make-pack.mjs [kit_lab|kit_it|all]` → `packs/<sada>`, přehled `tools/forge/<lab|it>/SADA.md` (generovaný) a meta balík `packs/kit_all` (jen `requires`, pro galerii). Kontroly v **B-T9** (`test/b_t9_sady.mjs`, 14): validátor, bajtová shoda zápisu, jména, do 1 000 △, `place` podle uchycení (podlaha a deska y ≥ 0, strop pod počátkem, zeď z ≥ 0), kolize, materiály i ze závislých sad, poznámky ke kloubům, rozměry 2 mm až 4 m, kolize id mezi sadami. Galerie (`dist/kit.html`) ukazuje všechny tři sady s nadpisy, B-T3 dělá montáž každé sady (`test/out/b_kit_lab_galerie.png`, `b_kit_it_galerie.png`).

### Sady v generovaných levelech (krok 20)

- **Více sad v generátoru.** `mergeKits` (`src/gen/catalog.js`) spojí sady do jednoho katalogu; sada, jejíž `requires` mezi ostatními chybí, i kolize id jsou chyba. `cli.mjs`: `--kit` se dá opakovat, bez něj bere `kit_base`, `kit_lab`, `kit_it` z `packs/`. Balík levelů má `requires` všech sad (`levelPackManifest` bere seznam), level má v `source.params.kit` id spojená „+“. `packs/gen_demo` teď vyžaduje všechny tři.
- **Obor místnosti** (`refine` v předvolbě, volá ho `build.js` před jmény buněk; `src/gen/presets/complex_kits.js`): laboratoř dostane obor organická chemie, tkáňové kultury, molekulární biologie, analytika nebo vivárium (vivárium od 16 m²); technická místnost od 18 m² s pravděpodobností 0,45 serverovnu (od 40 m² výpočetní sál), aspoň jedna serverovna na level, když je technická místnost od 16 m²; kancelář od 24 m² open space, od 12 m² s pravděpodobností 0,3 zasedačku; velká laboratoř (od 36 m²) s pravděpodobností 0,3 open space. Buňky mají id podle oboru (`c_chem_01`, `c_server_01`, `c_open_01`…) a české jméno. Bez sad (`catalog.has`) zůstává všechno jako dřív.
- **Vybavení.** Laboratoř má frontu podle oboru (digestoř, stoly s věcmi na desce, bezpečnostní skříně, mrazáky, boxy, inkubátory, sekvenátor, plyny, akvária…), delší než kancelář (obvod / 0,95 m, 4 až 14 kusů), velká laboratoř ostrůvek nebo velký přístroj uprostřed. Na desku stolu jde 1 až 2 přístroje a 3 až 6 drobností oboru (sklo, láhve, stojánky, špičky). Laboratoře míchají i stoly a přístroje z `kit_base`. Serverovna a výpočetní sál: **řady skříní** podél delší osy, dvojice zády k sobě, nad osou kabelový žlab, v úzké místnosti jedna řada; u zdí chlazení, UPS, baterie, hasicí plyn. Open space: řady stolů pro čtyři se židlemi, nebo dvojice stolů s nastavitelnou výškou se sestavami počítačů a židlí; u zdí skříňky, tabule, rostliny, kuchyňka, kopírka. Zasedačka: jednací stůl se šesti židlemi, televize, tabule, projektor. Chodba, hala a sklad dostanou doplňky (rostlina, voda, koše; dusík, Dewarovy nádoby, regály, kanystry, chladicí komora).
- **Rozmisťování** (`furnish.js`): `dressTop` staví věci na desku zleva doprava podle šířek se stejnými mezerami; výška desky z `components.place.top`, pruh desky z **`source.params.deck` = [z od, z do]** (laboratorní stoly −0,065 až 0,37 m před policemi nástavby, ostrůvek 0,19 až 0,74 m, stoly IT −0,38 až 0,38 m; věc stojí zády u začátku pruhu a nesmí přečnívat). `rowsIn` (řady, varianty od největší, platí první, která se vejde), `seatsAround` (židle kolem stolu), `ceilingItems` (kamera, Wi-Fi, projektor), `rowsFirst` (serverovna a open space staví řady před nábytkem u zdí).

| Kontrola (B-T1, sandbox) | Výsledek |
|---|---|
| `complex` se sadami, 200 seedů: validátor, prahy, průchodnost místností skutečným hráčem, strop, chodby | 0 nálezů |
| laboratoří oboru na level (dvě patra) / serveroven / open space a zasedaček | 3 až 15 (medián 8) / 0 až 6 (medián 1, aspoň jedna v 90 % levelů) / 0 až 10 (medián 4) |
| celý level (kvádry + prefaby), dvě patra | 108 308 až 228 516 △, medián 159 064 (mez 300 tisíc) |
| entit na level, dvě patra | 416 až 809, medián 600 (jen `kit_base`: 417 až 709, medián 541) |
| generování | medián 8,1 ms, nejvíc 46,5 ms (mez 1 s) |
| prefabů ze sad `kit_lab` a `kit_it`, které generátor použije | 200 z 366 |
| `complex` jen s `kit_base` (50 seedů): bez oborů, vybavení jako dřív, každý prefab `kit_base` použit kromě okna a mříže (N-003) | ano |
| zkouška A × B (`gen_demo` v enginu A): robot dojde, dveře rukou, volání kreslení na cestě | ano; nejvýš 255 (`complex_7`, dřív 221), mez 400 |

Snímky z enginu A: `test/out/b_mistnosti.png` (12 místností z `complex_7` a `complex_21`, kamera ve dveřích) a detail desek a stolů; pomůcka `test/b_lib/room-shots.cjs`. **Sestavení `dist/xlab_gen.html` má 8,0 MB** (data 3,1 MB): build přibalí všechny prefaby obou sad, i nepoužité. Cena víc entit a materiálů v laboratořích na T460 **není změřená** (F3 nebo `?bench` nad `complex_7`).

**Regrese po kroku 20** (sandbox): `npm test` T0 41, T1 156, T4 46, T2 15, T3 12; `npm run test:b` 9 sad (B-T1 78, B-T2 33, B-T3 12, B-T4 20, B-T5 26, B-T6 9, B-T7 47, B-T8 7, B-T9 14); `npm run test:axb` 31 + 9; 0 selhalo.

### Ondřej 24. 11. 2026, 23:57

Odpovědi: (1 a) hustota laboratoří stačí; (2 b) další krok je zapečené světlo na pevných dílech prefabů (D-041), `kit_home` až po něm; (3 a) velikost hry nevadí, **hra smí mít až 25 MB**; (4 a) `xlab_gen.html?level=complex_7&bench` pustí na T460.

Nové zadání (jeho slovy): „Chci víc prefabů, ve vyšší kvalitě, víc trojúhelníků (například Erlenmeyerova baňka vůbec nevypadá jako Erlenmeyerova baňka – lépe řeš kužely, válce, jehlany, i zaoblení. Se stejným počtem trojúhelníků bych zvládnul téměř hyperrealistický tvar. Ty děláš takové bizarní schodovité tvary. Navíc materiál je sklo, tak ať to tam i vypadá.“ „Pojďme celému inventáři vdechnout více realismu. Počet trojúhelníků teď zvyš o 50 %, ale snaž se odvést 5krát lepší práci než při první iteraci. Kádinka s nálevkou včetně zaobleného dna, to je pár trojúhelníků. Odměrný válec to samé.“

Jak to čtu: realistický inventář je hlavní úkol teď, D-041 hned po něm (před `kit_home`). Mez prefabu 1 000 → 1 500 △.

**Proč byly tvary schodovité:** formát má pro díly jen kvádr a válec se 16 stěnami (64 △); kužel, zaoblení ani tenkou stěnu válec neumí, takže profil baňky jsem skládala ze stohu válců s různým poloměrem. Formát ale má díl `mesh` (soubor .glb, volitelně `#uzel`) a engine A ho kreslí. Dočasné řešení: xForge vyrobí hladké sítě (rotační plochy z profilu, kužely, zaoblené kvádry, trubky) a zapíše je do .glb v balíku sady. Trvalé řešení navrhnu svodné sešně: rotační díl ve formátu (profil + počet stěn), aby ho zapékal xBake (D-041 dnes bere jen kvádry a válce) a balík nenesl megabajty sítí.

### Ondřej 25. 11. 2026, 0:19: běh `?bench` na T460 a otázky na test

Poslal výsledek `xlab_gen.html?level=complex_7&bench` (sestavení A02 „krok 5“, ještě bez sítí skla; surový výstup `docs/navrhy/N-011-bench-T460-2026-11-24.json`) a snímek nastavení: zorné pole 90°, 1 080 řádků, vyhlazování zapnuto, mřížka světla 0,25 m. Ptá se: (1) „mám podezření, že máš v testu nějakou chybu… měl jsem puštěnou jedinou kartu“; (2) „počítáš s tím dlouhým zapékáním světla na začátku? A nastavení si hlídáš?“; (3) „obraz celou dobu skáče zleva doprava… je to celou dobu schválně tak kývavá chůze?“

Co jsem zjistila (podrobně návrh **N-011** pro sešnu A, `src/app/bench.js`):
- **Kývání je chyba robota měření**, ne záměr: řídí se o krok pozadu (systém `input` sebere otočení dřív, než ho robot pošle), smyčka kmitá 20 Hz. Simulace v Node: 10 obratů za 0,75 s, s opravou 1.
- **30 snímků/s způsobuje měření**: každý snímek se kvůli času vykreslení kreslí ještě v dávce 12 až 40 ms; 16,4 ms práce + dávka ≈ naměřených 33,4 ms. Platí `workMs` (medián 16,4 ms, 95 % 23,4 ms) a `draw.ms` (11,1 / 17,45 ms); rozestup snímků ne.
- **Nastavení ve výstupu jsou** (`env.rowsChosen` 1 080, `env.antialias` true, `level.lightGrid` 0,25), chybí zorné pole.
- **Světlo se počítá 33,3 s** (`lightBuildMs`, 368 136 vzorků při mřížce 0,25 m): běh ho počítá sám, soubor z xBake ještě nečte. Tohle odstraní D-041 (xBake zapeče i díly prefabů) a čtení souboru v enginu A.
- Pro mě: **nejvýš 490 volání kreslení** v `c_corr_01` (mez 400, sandbox T5 ukázal 255) a 135 488 △ v pohledu. Laboratoře přidaly materiály; hlídat při přestavbě inventáře.

### Ondřej 25. 11. 2026, 1:14: `?bench` se sítěmi na T460

Druhý běh `xlab_gen.html?level=complex_7&bench` na T460 se sestavením z 0:45 (realistický inventář, první kolo; bez lemu a odlesku skla). Surový výstup `docs/navrhy/N-011-bench-T460-2026-11-25.json`. Proti běhu bez sítí (24. 11., stejný level, stejné nastavení):

| Veličina (T460) | Bez sítí | Se sítěmi |
|---|---|---|
| díly `mesh` / jejich △ | 0 / 0 | 588 / 65 806 |
| statické △ levelu | 426 532 | 457 778 |
| vykreslení snímku `draw.ms` medián / 95 % / max | 11,1 / 17,45 / 33,1 ms | 11,05 / 17,65 / 45,1 ms |
| práce snímku `workMs` medián / 95 % | 16,4 / 23,4 ms | 16,4 / 24,2 ms |
| volání kreslení 95 % / max | 264 / 490 | 269 / 496 |
| △ v pohledu medián / 95 % / max | 26 420 / 91 256 / 135 488 | 26 950 / 95 712 / 149 094 |
| stavba světla za běhu | 33,3 s | 34,3 s |

**Závěr (změřeno):** hladké sítě inventáře stojí na T460 v mediánu nic a v 95 % +0,2 ms vykreslení (+1 %); jediné maximum 45,1 ms je ojedinělá špička. 30 snímků/s a kývání jsou dál chyby měření (N-011). Rezerva je v 95 % malá (17,65 ms proti 16,7 ms na 60 snímků/s); rozhoduje spíš počet volání než trojúhelníky.

### Realistický inventář (krok 21, 25. 11. 2026; `2a9a4bb`, `815d1ba`, `4f20bca`, `9489c70`, `3be532e`)

**Nástroje (`tools/forge/mesh/`).** Hladké sítě, které xForge zapíše do `packs/<sada>/meshes/*.glb` a do `pack.json.assets` s otiskem; díl prefabu je `mesh` s cestou `meshes/<soubor>.glb#<uzel>` (formát ho má od základu 1, engine A ho kreslí).
- `lathe.mjs`: rotační plocha z profilu `[r, y]` (líc vpravo od směru profilu, bod s r = 0 je pól, `'c'` ostrá hrana, `rounded()` zaoblí roh poloměrem a počtem úseků); `vesselProfile` dělá tenkou stěnu (vnější profil, oblý okraj, vnitřní odsazený po normále, dno o zadanou tloušťku nad vnějším pólem) a zjednoduší ji podle vzdálenosti od přímky (podle úhlu mizelo rameno kužele).
- `solids.mjs`: zaoblený kvádr (`s` 0/1/2 → 12/108/300 △), deska se zaoblenými rohy, hranol, trubka s ohyby (paralelní přenos rámce), válec, kužel, koule, toroid, jehlan, otevřená krabice, zrcadlení, deformace a vyhlazení normál.
- `glb.mjs` (deterministický zápis: zaokrouhlení, indexy uint16/32, min/max), `sha256.mjs` (otisk bez závislostí), `registry.mjs` (`meshPart`, `meshTris`, `meshCorners`, `meshFiles`, `shiftMeshPart`). `lib.mjs` počítá trojúhelníky a obaly i ze sítí; posun dílu `shiftPart` umí i síť.
- `lab/common.mjs`: v `simple()` a `moving()` se válec od poloměru 8 mm sám změní na válec se zaoblenou hranou (pokud nepřečnívá zadané kolize), plášť přístroje (`casing`) na zaoblený kvádr s patkami, panel na zapuštěnou desku s oblými tlačítky. Tím se zaoblení dostalo do všech přístrojů obou sad bez přepisu každého kusu.

**Sklo (Ondřejova výtka „Erlenmeyerova baňka vůbec nevypadá jako Erlenmeyerova baňka“).** Každá nádoba je tenká stěna: vnější i vnitřní povrch, oblý okraj, zaoblené dno a pata, kužel s ramenem do hrdla (Erlenmeyer), koule s hrdlem (varná), hruška se zábrusem (odměrná), pata se šestiúhelníkovou nohou (válec). Materiál `glass_thin` (`opacity` 0,25, oboustranný), smaltovaná stupnice a pole na popis (`enamel_white`), matné zábrusy (`glass_frosted`), kapaliny s meniskem pod hladinou stěny, víčka GL 45 s vroubky, zátky, korek, porcelán, PTFE. Počet stěn podle poloměru (10 až 22). Nové prefaby: nálevka v Erlenmeyerově baňce s filtrem, Büchnerova nálevka na odsávací baňce s hadicí (sestava), krystalizační miska, kapací lahvičky (dvě), kádinka s pipetami, filtrační baňka 500 ml.
**Přestavěno dál:** plasty (53: zkumavky s kuželovým dnem, víčka s vroubky, Petriho misky, destičky, střičky, kanystry, lahve, vialky), chemikálie (38: hnědé lahve s výstražným kosočtvercem, dózy s vroubkovaným víčkem, vyboulený pytel, plechovka, bezpečnostní kanystr, pufry GL 45, vialky s hliníkovým víčkem, sklenice s krystaly, odpadní nádoba s nálevkou), rotační odparka (skloněná baňka v lázni, parovod, chladič se spirálou, jímací baňka). Ostatní přístroje, velké přístroje, nábytek, chlazení, chovy a celý `kit_it` mají zatím jen zaoblení ze společné vrstvy, ne přestavbu kus po kuse.

| Sada | Prefabů | △ celkem (nejvíc) | Před přestavbou | Sítě .glb |
|---|---|---|---|---|
| `kit_lab` | 293 | 171 484 (2 458, sestava) | 286 prefabů, 93 580 △ (+83 %) | 4 221 kB: `glass` 1,23 MB, `plastic` 1,07 MB, `chem` 0,56 MB, `parts` 1,40 MB, `bench` 63 kB |
| `kit_it` | 80 | 16 696 (888) | 15 128 △ (+10 %) | `parts` 109 kB |

Po kategoriích `kit_lab`: sklo 76 kusů 60 960 △, plasty 53 / 29 180, chemikálie 38 / 24 018, stolní přístroje 52 / 23 946, velké přístroje 26 / 11 512, nábytek 23 / 13 872, chlazení 11 / 3 634, chovy 14 / 4 362.

**Jak čtu „o 50 % víc trojúhelníků“:** mez **prefabu** 1 000 → 1 500 △, sestava (stojan, exsikátor, odparka, odsávací baňka) do 2 500 △. Součet sady jen hlásím; B-T9 hlídá, aby nepřesáhl dvojnásobek stavu před přestavbou (`kit_lab` 93 580, `kit_it` 15 128). **Sada jako celek narostla o 83 %, ne o 50 %**; otázka na Ondřeje, jestli myslel prefab, nebo celek. V levelu je nárůst menší, protože generátor bere asi 200 z 373 prefabů a sklo stojí jen na deskách:

| Level (sandbox, b_t1, 200 seedů) | Před (krok 20) | Po (krok 21) |
|---|---|---|
| `complex` dvě patra, celý level (kvádry + prefaby) | 108 308 až 228 516 △, medián 159 064 | 124 928 až 295 204 △, medián 197 622 (+24 %) |
| `complex_7`, vrcholy prefabů | 239 260 | kvádry a válce 222 430 + sítě 29 173 = 251 603 (+5 %) |
| `dist/xlab_gen.html` | 8,0 MB | 13,6 MB (13 632 kB; mez Ondřeje 25 MB) |
| T5 v prohlížeči, nejvíc volání kreslení po cestě robota | 255 (`complex_7`) | 251 (`complex_7`), 116, 110 |

**Pozor:** nejhorší level `complex` (295 204 △) je těsně pod mezí 300 tisíc z b_t1. Další přestavba kus po kuse musí brát z rozpočtu levelu, ne jen prefabu (víc tvaru tam, kde je vidět zblízka; méně stěn u věcí v regálech). Výkon na T460: změřený 25. 11. v 1:14 (oddíl výše), sítě v 95 % +0,2 ms vykreslení.

**Kontroly (B-T9, 16):** validátor, bajtová shoda zápisu včetně `.glb`, mez 1 500 / 2 500 △, každá síť je v `pack.json.assets`, **kolize obepínají síť do 3 mm** (`boundsAt(p, {}, meshCorners)` proti `boundsAt(p)`; generátor sítě nečte, rozmisťuje podle kolizí), součet sady ≤ 2× stav před přestavbou. Snímky: `test/out/b_sklo_pred_po.png` (galerie, sklo před a po), `test/out/b_sklo_hra.png` (12 kusů skla v enginu A v `complex_7` a `complex_21`), `test/out/b_mistnosti.png`, montáže `plast.png`, `chem.png`, `pristroje.png` (galerie).

**Neověřeno / známé meze:**
- Díly `mesh` xBake nezapeče (vzorky D-041 berou jen `box` a `cyl`) a zkouška A × B v Node je nevidí (čte balík bez souborů). Obojí řeší návrh **N-012** (rotační a zaoblený díl ve formátu); do té doby sítě svítí běh sám.
- Sklo je v enginu A kreslené jako průhledný materiál bez lomu a odlesku; jak vypadá při vyhlazování a na T460, neviděl nikdo.
- Snímek místností z kamery ve dveřích chytí otevřené křídlo dveří přes půl obrazu (serverovny v `b_mistnosti.png`); je to pomůcka, ne chyba levelu.

### Zapečené pevné díly prefabů (krok 22, D-041; 25. 11. 2026)

**Znění 8 a 9 základu** sloučeno bez konfliktů (`8ba697c`). Podle dodatku D-052 čtu interakce jen přes `src/xspace/interact.js` (`interactions`, `doorInteraction`) v `src/gen/catalog.js`, `furnish.js`, `tools/bake/gates.mjs`, `view.js`, `tools/forge/doc.mjs`, galerii a testech; `b_t7` odebírá z manifestu zlatého vzorku i `ammo` a `weapons` (`73cb0bb`). Kartotéka a stůl zůstávají korpus + zásuvky, dokud sešna A neumí vybrat interakci podle zasaženého uzlu (dodatek, bod 2).

**Co xBake dělá nově.** Vzorky jsou v pořadí `levelSamples` ze základu: kvádry, potom vrcholy pevných dílů prefabů po entitách (`tools/bake/scene.mjs`). Plocha dílu = souvislá část jeho sítě (stěna kvádru, plášť a podstavy válce); počátek paprsku 2 cm nad plochou a 1 cm k jejímu středu jako u kvádrů. Hlavička souboru nese `entities: [[id, počet]]`, otisk geometrie zahrnuje entity (id, prefab, poloha, natočení, počet vzorků). Náhled xBake barví pevné díly ze zapečených vzorků, pohyblivé díly dál počítá sám. `cli.mjs --no-entities` zapeče jen kvádry (ke srovnání).

Rozhodla jsem (pro svodnou a sešnu A k vědomí):
- **Vlastní kolize entity její díly nestíní** (paprsky ze vzorku dílu přeskočí kolize téže entity). Kolize je obal; bez toho by díly uvnitř obalu (police pod deskou, přístroj v nástavbě) byly černé. Cena: spodní police regálu dostane světlo, jako by nad ní horní police nebyla, a kout pod deskou stolu nemá vlastní stín. Cizí entity a kvádry stíní normálně.
- Zdrojem odrazu jsou dál jen kvádry (zásah kolize prefabu se počítá jen do přístupnosti okolního světla) a mez jasu zdroje se počítá jen z vzorků kvádrů, takže **vzorky kvádrů mají s díly i bez nich stejné hodnoty ve všech vrstvách** (B-T5).
- Okraj stínu po podílech je jen na kvádrech (díl nemá mřížku řad a sloupců, jeden paprsek na vzorek).

| Level (sandbox, `node tools/bake/cli.mjs packs/gen_demo`) | Vzorků (z toho na dílech) | Zapečení | Soubor (gzip) | Bez dílů |
|---|---|---|---|---|
| `complex_7` | 182 468 (116 850) | 28,1 s | 4 835 kB (3 420 kB) | 65 618 vzorků, 8,6 s, 1 744 kB (1 131 kB) |
| `complex_21` | 149 303 | 20 až 25 s | 4 047 kB | |
| `catacombs_3` | 57 132 | 5,2 s | 1 404 kB | |
| `golden/xlab` | 22 111 (1 602 na 11 entitách) | 1,1 s | 533 kB | 20 509 vzorků |

Vzorků v tělese (dno dílu na podlaze, záda u zdi) je v `complex_7` o 9 768 víc; nejsou vidět. 116 vrstev = jedna na světlo, z toho většina řídkých. **Velikost:** tři levely by v dnešním formátu přidaly do hry 10,3 MB (gzip 7,6 MB); s hrou 13,6 MB by to bylo těsně pod 25 MB. Kolik ušetří vrstvy jen pro přepínaná světla a kratší čísla, je otázka zkoušky N-110 (dodatek D-050, další krok).

**Kontroly** (B-T5, 32): vzorky kvádrů a za nimi díly po entitách v pořadí `levelSamples`, každý vzorek ve vrcholu `levelSamples` se stejnou normálou, bez zastínění přesně `lightIrradiance` i na dílech, horní plocha entity, na kterou světlo míří, světlo dostane (36 z 36 v xLabu), na dílech 77 % vzorků, na které světlo míří, světlo dostane (zbytek stíní jiná tělesa), vzorky kvádrů beze změny, hlavička `entities` a otisk s polohou entity. B-T6: náhled zapeče xLab stejně jako Node.

**Neověřeno:** běh soubor dál nečte, takže v enginu A zapečené díly nikdo neviděl; náhled `complex_7` (přehled a start) vypadá v pořádku, laboratoře zblízka ne. Díly `mesh` (sklo, plasty, chemikálie, zaoblené pláště a panely ze sítí) do vzorků nepatří (D-041 bere jen `box` a `cyl`) a svítí je běh: N-012.

### Sklo s lemem a odleskem (krok 23, Ondřej 25. 11. v 1:02, volba 2 b)

Běh kreslí sklo jako průhlednou barvu (`MeshBasicMaterial`, barva vrcholů, `opacity`), takže okraj ani odlesk nevzniknou. V datech teď každá nádoba z `vesselGeom` nese dvě **doprovodné sítě** (`geom.extras`), ze kterých `definePrefab` udělá díly téhož uzlu (`expandExtras` v `tools/forge/mesh/registry.mjs`); ohnou se s hubičkou (`deform`), zrcadlí a posunou se sestavou (`append`, `mirror`, `shiftMeshPart`):
- **lem**: horní okraj s 1,2 až 4 mm vnější a vnitřní stěny, pět bodů profilu, 0,15 mm nad sklem, materiál `glass_rim` (opacity 0,72, světlejší) nebo `glass_amber_rim`;
- **odlesk**: dva svislé pruhy na vnější stěně od 12 % výšky po lem (vpředu vlevo 9°, vpravo 2,5°), materiál `glass_glint` (bílá, opacity 0,55);
- `glass_lab` má opacity 0,3 (dřív 0,25) a nádech do zelenomodra; kovová lázeň ani plast doprovodné sítě nedostanou (materiál dílu není sklo).

Pruhy jsou namalované, točí se s předmětem a nesledují světlo; skutečný okraj podle úhlu pohledu a odlesk navrhuju sešně A v **N-013** (shader průhledného materiálu, bez nového pole). Snímky: `test/out/sklo_odlesk.png` (galerie), `b_sklo_hra2.png` a `b_sklo_zblizka.png` (engine A).

**Trojúhelníky:** sklo a lem přidaly asi 10 tisíc △; nejhorší level `complex` vyšel na 303 886 (mez b_t1 300 tisíc). Vrátila jsem to zjednodušením víček a náplní vialek (karton a podložka 1 344 → 936 a 1 380 → 972 △) a lemem z pěti bodů: `kit_lab` 181 016 △, nejhorší level 299 608. **Jsme na mezi.** Celý level je přísná náhrada za „viditelnou scénu do 300 tisíc △“ (06_ROZPOCTY); `?bench` na T460 ukázal v `complex_7` nejvýš 135 488 △ v pohledu. Než přidám další tvar, potřebuju lepší měřítko (buňka + sousedé přes portály) nebo měření z T460. Sestava (stojan, odparka, exsikátor) smí mít do 3 000 △ (přístroj 2 000 × 1,5 podle volby 1 a), odparka má 2 814.

### Rozpočet podle viditelnosti (krok 24, Ondřej 1:29, volba 2 a)

`src/gen/pvs.js` (do kroku 25 `test/b_lib/pvs.mjs`): pro každou buňku množina buněk, do kterých z ní vede přímka otvory portálů (všechny dveře otevřené, v půdorysu, tedy nadmnožina skutečné viditelnosti z kteréhokoli místa buňky). B-T1 teď hlídá **„z žádné buňky víc než 300 tisíc △“** s kvádry po síti světla (`levelLightMeshes`, mřížka dat 0,5 m), jak je kreslí běh, a délku řetězu portálů s výhledem do 12 (`MAX_DEPTH` viditelnosti sešny A). Celý level se jen hlásí. Nová sada **B-T10** (10 kontrol): ručně složené případy, souměrnost, ukázkové levely a shoda s T460.

| 200 seedů (sandbox) | Nejvíc △ vidět z buňky | Celý level (kvádry po síti světla) | Řetěz s výhledem |
|---|---|---|---|
| `complex` dvě patra | 88 168 až 205 314, medián 139 342 | 195 496 až 396 894 | 3 až 7 |
| `complex` jedno patro | 92 576 až 229 174 | 224 389 až 346 231 | 3 až 7 |
| `catacombs` | 46 926 až 106 804 | 68 430 až 134 348 | 3 až 8 |

Shoda s měřením: PVS `complex_7` při mřížce 0,25 m (Ondřejovo nastavení) je nejvýš 251 278 △ v `c_corr_01`; T460 změřil nejvýš 149 094 △ a nejvíc volání (496) právě v `c_corr_01`. **Pozor:** při mřížce 0,25 m mají kvádry asi dvakrát víc △ (`complex_21` 293 394 vidět z buňky); se světlem v textuře (D-050) budou kvádry zase 12 △. Návrh **N-014**: PVS do základu a pro sešnu A zkouška „kreslím ⊆ PVS“ (rozpočet) a „vše, co paprsek z oka zasáhne, kreslím“ (nic nebliká), hlavně u portálů.

