# Stav sešny B

**Vlna:** 2 (zadání nahoře v `START_B.md`) · **Větev:** `sesna-b` · **Základ:** základ 2, znění 2 (`zaklad-2` = `main` = `d2fb217`), sloučeno 23. 11. 2026 (znění 1 `588ff12`, znění 2 `8387674`) · **Stav:** 23. 11. 2026, 03:00, konec sešny B02

> **Základ.** Větev stojí na základu 2: znění 2 základu 1 + sloučená vlna 1 obou sešen + zkouška A × B (`npm run test:axb`) + rozhodnuté návrhy (D-029 až D-034); znění 2 základu 2 přidalo díly prefabu v `geom.js` (N-101) a rozhodnutí D-035 až D-037. V repu je engine sešny A ve stavu `230b3ee`; její novější práce (světlo po vrcholech, zastínění, dveře jako brány světla) je na `origin/sesna-a` (`a1d3081`) a v této větvi není.

## Vlna 2: kde jsme (23. 11. 2026)

Zadání vlny 2 je nahoře v `docs/sesny/START_B.md` a má přednost. Stav proti němu:

| Úkol vlny 2 | Stav | Poznámka |
|---|---|---|
| B2.1 průchodnost pro skutečného hráče a katakomby | **zčásti hotovo** | hotovo: katakomby podle volby 2 b, prkenné dveře se světlostí 0,90 m, zkouška A × B zelená. **Zbývá:** generátor hlídá průchod 0,6 m (`src/gen/passage.js`, `test/b_lib/level-checks.mjs`); má to být šířka z profilu hráče (0,74 m), čtená z dat nebo z předvolby |
| B2.2 přijatá pole (`components.place`, `opacity`, `passable`, `seeThrough` u mříže, `speed`) | nezačato | `seeThrough` už mají křídla dvoukřídlých dveří |
| B2.3 xSearcher | nezačato | hotové jen měření zdrojů z 22. 11. (`tools/searcher/ZDROJE.md`) |
| B2.4 vzhled v polích, která formát má (hrubý tvar, textury barvy, přepínač v galerii) | nezačato | |
| B2.5 zkouška povrchu na jednom kusu (dveře `.glb`, materiál s texturou) | nezačato | |
| B2.6 xBake a N-001 | **hotovo podle zadání vlny 1; proti rozhodnutí D-035 a zadání vlny 2 zbývají tři úpravy** | N-001 je přijat se změnou (D-035). **(1) Dveře v portálu při zapékání nestíní:** vzorek, ke kterému vede volná cesta od světla otvorem portálu s dveřmi, patří do vlastního úseku vrstvy s polem `gate` (id entity dveří) a za běhu svítí úrovní × otevření dveří. xBake dnes zavřenými křídly stíní a `gate` nepíše: **neuděláno**, formát `XLV1` to nemá. Vzor: `src/world/occlusion.js` na `origin/sesna-a` a popis v jejím `A_STAV.md`. (2) Stínit kolizemi prefabu z `partCollider` (v základu od znění 2); dnes stíním viditelnými díly (`parts`) a průnik s válcem počítám sama (`tools/bake/scene.mjs`). (3) Víc stínových paprsků na vzorek (D-037 to výslovně ukládá xBake) |
| B2.7 xDesigner, dům, tvor | nezačato | |

**Co se stalo 23. 11. po půlnoci.** Po sloučení se základem 2 selhala zkouška A × B ve dvou kontrolách: místnosti za dvoukřídlými dveřmi byly pro kapsli hráče nedosažitelné (`c_store_08`, `c_lab_05`, `c_store_12` v `complex_7`, `c_store_02` v `complex_21`). **Příčina byla moje:** dočasné řešení k N-007 nezapisovalo dvoukřídlé dveře do `portal.door` a navigace robota (`test/t5_lib/robot.mjs`) hledá dveře jen tam. Oprava (`129318d`): křídla mají `interact.seeThrough: true` (pole přijaté v N-107) a první křídlo je zase v `portal.door`. Pohled portál nezavírá, průchod a zvuk ano. Po opravě: všechny buňky dosažitelné, robot došel do nejvzdálenější buňky ve všech třech levelech (`complex_7` 57,9 m, `complex_21` 42,5 m, `catacombs_3` 26,3 m), dveře otevřel rukou, vynuceně žádné. Je to první zkouška nad dnešními katakombami a dveřmi.

**Ondřej 22. 11. ve 23:33** (po zhlédnutí náhledu xBake na svém stroji): odraz slabší; dál předávka a nová sešna. Provedeno: vrstva `indirect` nese v hlavičce `weight: 0,5` (`cc4f1fc`), data vrstvy jsou dál plná. Z jeho snímků: zapečení xLabu v jeho Chrome trvalo 2,37 s; stíny sloupů v hale jsou na podlaze **hranaté skvrny** (vzorky po 0,5 m, stín má u každého vzorku jen dvě hodnoty); vnější strany zdí byly v přehledu černé (opraveno přisvícením přehledu, náhled 0.2).

**První věc pro xBake příště:** víc stínových paprsků na vzorek (několik počátků v okolí vrcholu místo jednoho), aby hrana stínu dostala mezistupně a nebyla zubatá. Kontrakt se tím nemění. Neuděláno.

**Znění 2 základu 2 (23. 11. 2026, sloučeno `8387674`, bez konfliktů).** Svodná sešna mezitím rozhodla mé dva návrhy a návrh sešny A o mřížce. Co z toho plyne pro tuhle větev:

| Rozhodnutí | Co říká | Co to znamená pro sešnu B | Stav |
|---|---|---|---|
| D-035 (N-001) | soubor `levels/<id>.light.bin` přijat; křídla dveří v portálech při zapékání nestíní, světlo zadržuje brána za běhu (úsek vrstvy s polem `gate`); vrstva `indirect` se bránou neřídí; čtení souboru (`decodeBake`) přejde do základu při příštím sloučení | upravit `tools/bake/bake.mjs` a `format.mjs`: dveře portálu vyřadit ze stínících těles, vzorky osvětlené otvorem s dveřmi dát do úseku s `gate`; doplnit `b_t5_bake` a oddíl návrhu N-001. Pole `baked` do balíků dál nepsat | **neuděláno** |
| D-036 (N-007) | zakrytí otvoru se počítá ze všech neprůhledných dílů dveří v klidu (bod 1 přijat); seznam entit u portálu zamítnut; dvoukřídlé dveře budou jeden prefab se svázanými klouby, až základ dodá `follow` (N-002); do té doby `seeThrough` | data už tomu odpovídají (`129318d`). Až bude `follow`: z `door_double_*` udělat jeden prefab a `seeThrough` u něj zrušit | čeká na základ |
| D-037 (N-108) | základ změní mřížku světla: vrcholy na násobcích `LIGHT_CELL` ve světě, bez ploch schovaných v jiném kvádru; počet a pořadí vzorků se změní | počty a pořadí beru z `brushLightMesh`, natvrdo nikde nejsou; po změně se změní otisk `geometry` a všechna čísla xBake v tomto souboru (vzorky, velikosti, časy). Vzorků „v tělese“ má ubýt | čeká na základ |
| N-101 proveden | `partMesh`, `partTris`, `partCollider`, `CYL_SEGMENTS` jsou v `src/xspace/geom.js` | vlastní výpočet dílů mám na čtyřech místech a má zmizet: `tools/forge/lib.mjs` (`partTris`), `tools/forge/gallery/scene.js`, `tools/bake/scene.mjs`, `tools/bake/view.js` | **neuděláno** |

Pořadí pro příští sešnu: zbytek B2.1 → xBake podle D-035 (brány) spolu s `partCollider` a víc paprsky → díly z `geom.js` v galerii a v `lib.mjs` → B2.2 a dál.


## Hotovo × neuděláno

| Úkol | Stav | Test | Poznámka |
|---|---|---|---|
| B1.1 xGen: stavebnice a rozvržení | hotovo | `b_t1_xgen` 52 (Node) | předvolby `complex` (dvě patra s galerií, nebo jedno patro s plošinou a rampou) a `catacombs`; 500 levelů bez nálezu validátoru; katakomby po Ondřejově volbě 2 (b) |
| B1.2 xForge: sada prefabů | hotovo, vzhled nevyhovuje | `b_t2_kit` 21 (Node), `b_t3_galerie` 8, `b_t4_levely` 20 (prohlížeč) | `kit_base`: 49 prefabů, 27 s kloubem (33 kloubů), 41 materiálů; galerie `dist/kit.html`; generátor rozmisťuje 47 ze 49. Ondřej 22. 11.: tvary dobré, ale „příliš sterilní“ (viz Rozhodnutí a N-006). Zavřené dveře jsou od B02 bez škvír (N-007) |
| B1.3 xBake: zapečené světlo | hotovo podle zadání znění 2; běh soubor zatím nečte (N-001 přijat se změnou, D-035; čtení přejde do základu) | `b_t5_bake` 15 (Node), `b_t6_bake_nahled` 7 (prohlížeč) | světlo po vrcholech `brushLightMesh`, jedna vrstva na světlo se zastíněním, k tomu vrstva odrazu (RGB) a přístupnosti okolního světla; xLab 20 658 vzorků za 1,1 s, soubor 452 kB; nástroj `node tools/bake/cli.mjs packs/<balík>`, náhled `dist/xbake.html`, montáž `test/out/b_bake_montaz.png` |
| B1.4 xSearcher: příjem assetů | začato | | hotové jen měření dosažitelnosti zdrojů (`tools/searcher/ZDROJE.md`); nástroj `find.mjs` neexistuje |

Poslední celý běh (23. 11. 2026, po sloučení znění 2 základu 2, `8387674`): základ `npm test` 242 kontrol (T0 41, T1 128, T4 46, T2 15, T3 12), skupina A 16 sad z 16, skupina B `npm run test:b` 123 kontrol v 6 sadách, zkouška A × B `npm run test:axb` 28 + 9 kontrol. Vše zeleně.

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
| xSearcher a textury (B2.3, B2.4) | nezačato; nová sešna | |

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
| vývojové pomůcky: rozložení přes seedy, půdorysy do PNG, snímky levelů, montáž galerie | `tools/designer/dev/stats.mjs`, `plans.cjs`, `shots.cjs`; `tools/forge/dev/kitshot.cjs` |
| měření dosažitelnosti zdrojů assetů | `tools/searcher/ZDROJE.md` |
| xBake: vzorky, stínítka a paprsky (`scene.mjs`), vrstvy (`bake.mjs`), soubor a otisky (`format.mjs`), nástroj `node tools/bake/cli.mjs packs/<balík> [--level id] [--out složka] [--rays 32] [--no-indirect]` → `dist/bake/<balík>/<level>.light.bin` | `tools/bake` |
| náhled zapečeného světla (cíl `xbake`: zapeče v prohlížeči, přepínače Stíny, Odraz, Kouty, Lampy; pohledy jako xView a „Stín sloupu“) | `tools/bake/view.js`, `view.html`, `target.json` → `dist/xbake.html` |
| zkouška zakrytí otvoru dveřmi paprsky | `test/b_lib/door-cover.mjs` |

## Změřená čísla

Všechno změřeno v sandboxu (Node 22, 2 jádra; prohlížeč Chromium se softwarovým vykreslováním). Časy jsou orientační, o T460 neříkají nic.

| Co | Hodnota | Kde a jak |
|---|---|---|
| seedy bez nálezu validátoru | 200 `complex` (dvě patra) + 200 `catacombs` + 50 `complex` jedno patro + 50 `complex` s hádankou = 500 levelů, 0 chyb, 0 varování | `b_t1_xgen`, validátor nad levelem spojeným se sadou |
| pokusů na level | `complex` vždy 1, `catacombs` 1 až 3 (medián 1) | tamtéž (pokus = jeden proud náhody; nevyhovující se zahodí) |
| buněk na level | `complex` 31 až 59 (medián 45), `catacombs` 25 až 47 (35), jedno patro 34 až 57 (45) | tamtéž |
| dveří v portálech | `complex` 29 až 60 (43), `catacombs` 3 až 17 (9) | tamtéž |
| čas generování | `complex` 3,4 až 52,8 ms (medián 6,5), `catacombs` 1,1 až 10,0 ms (2,3) | tamtéž, `performance.now` kolem `generateLevel`, první volání nese zahřátí |
| kvádrů a entit na level | `complex` 354 až 629 kvádrů, 320 až 584 entit; `catacombs` 274 až 510 kvádrů, 83 až 171 entit | tamtéž |
| nejvíc v jedné buňce | 48 entit, 94 kvádrů (meze validátoru 150 a 400) | sonda přes 300 levelů |
| trojúhelníků v celém levelu | průměr 54 537, nejvíc 87 964 (kvádry + součet `tris` prefabů) | sonda přes 300 levelů před poslední úpravou pravidel; řádově platí |
| průchodnost místností | v 9 až 31 buňkách na level (`catacombs` 9 až 28) mezi všemi otvory cesta široká 0,6 m | `b_t1_xgen`, mřížka 0,1 m, nezávislá na generátoru |
| opakovatelnost | stejný seed dvakrát = stejné bajty (`complex` 201 577, `catacombs` 101 890 znaků); `packs/gen_demo` a `packs/kit_base` bajtově shodné s výstupem nástrojů | `b_t1_xgen`, `b_t2_kit` |
| sada | 49 prefabů, 8 564 △ celkem (průměr 175 △), nejtěžší `microscope_01` 456 △; dveře 156 až 332 △ | `b_t2_kit` |
| galerie | 49 z 49 prefabů se vykreslí, u 27 z 27 kloubových je krajní poloha v obraze vidět | `b_t3_galerie`, dlaždice 160 px, softwarové vykreslení |
| levely v xView | `complex_7` přehled 235 volání a 71 988 △; ze startu 44 volání | `b_t4_levely`; xView neslučuje po buňkách ani neořezává, čísla nejsou rozpočet enginu |
| velikost | `dist/kit.html` 745 kB, `dist/xgen.html` 1 029 kB (z toho data 429 kB); `packs/kit_base` 224 kB, `packs/gen_demo` 468 kB na disku | výpis sestavení, `du` |
| zapečení světla (xBake) | xLab: 20 658 vzorků, 16 vrstev, 1,1 s, 452 kB (gzip 317 kB); `catacombs_3`: 38 098 vzorků, 64 vrstev, 2,8 s, 731 kB; `complex_21`: 64 393, 114, 5,7 s, 1 420 kB; `complex_7`: 73 092, 118, 8,7 s, 1 535 kB | `tools/bake/cli.mjs`; 64 paprsků polokoulí na vzorek; časy ze sandboxu, orientační |
| vzorky schované v tělese | xLab 1 381 z 20 658 (7 %), `complex_7` 32 581 z 73 092 (45 %) | tamtéž; počátek paprsku leží uvnitř kvádru nebo dílu |
| stín sloupu v hale xLabu | 466 dvojic vzorek podlahy × světlo za sloupem, 460 bez přímého světla; přímé osvětlení těch míst 2,42 proti 4,32 bez zastínění; s odrazem 4,49. V obraze (pohled „Stín sloupu“, jen přímé světlo): průměrný jas 146,8 proti 168,2 z 255 bez zastínění | `b_t5_bake`, `b_t6_bake_nahled` (softwarové vykreslení) |
| náhled xBake | `dist/xbake.html` 623 kB; zapečení xLabu v prohlížeči 0,5 až 1 s | `b_t6_bake_nahled`, výpis sestavení |
| dosažitelnost zdrojů assetů | Poly Haven a ambientCG: rozhraní i soubory ano; OpenGameArt a Quaternius: stránky ano, stažení souboru neměřeno; Kenney: 403 | `curl` 22. 11. kolem 14:00, tabulka v `tools/searcher/ZDROJE.md` |
| velikost jedné sady map | ambientCG `Concrete049`: 1K-JPG 10 406 004 B, 2K-JPG 36 432 631 B, 4K-JPG 131 410 218 B | odpověď rozhraní ambientCG |

## Neověřeno

- **Prošel to jen robot bez obrazu.** Zkouška A × B (`npm run test:axb`, test základu) pouští všechny tři levely `gen_demo` v enginu sešny A beze změny kódu; nad dnešním stavem (nové katakomby a dveře) je zelená od `129318d`. Robot běží v Node bez vykreslení, chodí nejkratší cestou a většinu místností míjí. Engine v této větvi je stav sešny A z vlny 1 (`230b3ee`); s její novější větví (`a1d3081`, světlo po vrcholech) a s mou opravou ji nanečisto sloučila a pustila svodná sešna: 722 kontrol, 0 selhalo (`docs/STATE.md`, 23. 11.); sama jsem to nepouštěla. Vlastní průchodnost hlídám dál dvourozměrnou mřížkou s poloměrem 0,3 m (B2.1 chce 0,37 m podle profilu hráče); hala s galerií a plošinou se v ní přeskakuje.
- **Schody.** Geometrie je v mezích zadání (výška stupně 0,17 až 0,20 m, hloubka 0,28 m), ale kontrolér postavy je nezkoušel. Zlatý vzorek má stupně 0,25 m, takže by měly být snazší; je to úvaha. Sešna A změřila, že kontrolér vyjde schod jen při vodorovném posunu aspoň asi 7 mm na krok; s mými schody to nikdo nezkoušel.
- **Vzhled.** Všechny snímky jsou ze softwarového vykreslování, v galerii s vlastním nasvícením, v xView s osvětlením po vrcholech celých stěn (na hranicích úseků zdí dělá viditelné svislé předěly; je to vlastnost prohlížeče, ne dat). Barvy materiálů neviděl nikdo na skutečné grafické kartě. Ondřej viděl montáže a soubory z 22. 11. a vzhled označil za sterilní.
- **Meze kloubů.** Žádná nebyla změřena na skutečném předmětu; u každé je v `KIT.md` úvaha a u většiny poznámka „neměřeno“.
- **Svítivosti.** Pevná světla jsem volila podle zlatého vzorku (místnost 9 až 22 cd, hala 140 cd, pochodeň 8 až 12 cd). Jak je to jasné ve hře, nevím; katakomby jsou schválně tmavé a výklenky bez světla. Sešna A v N-105 píše, že zlatý vzorek je přesvícený; moje hodnoty z něj vycházejí, takže se jich to může týkat také.
- **Posuvné dveře** zajíždějí do zdi (křídlo se v otevřené poloze překrývá s kvádrem zdi). Jak se k tomu postaví Rapier a kreslení, nevím.
- **Dvoukřídlé dveře** jsou dvě entity se stejným počátkem (N-002, `follow` dluží základ). První křídlo je v `portal.door`, obě mají `seeThrough`: engine za nimi kreslí místnost i při zavřených křídlech. Když hráč otevře jako první levé křídlo, projde na okamžik krycí lištou pravého (8 mm, bez kolize); okem neposuzováno.
- **Zakrytí otvoru dveřmi** hlídá vzorkovaná zkouška paprsky (`test/b_lib/door-cover.mjs`: kolmé paprsky na síti z hran dílů a šikmé vějíře do 50° vodorovně a 30° svisle), ne důkaz. V enginu sešny A to se zavřenými dveřmi nikdo neviděl.
- **Zapečené světlo je vidět jen v mém náhledu a jen ze softwarového vykreslování.** Vrstvy bez zastínění dávají v náhledu stejný obraz jako xView se světly po pixelech (montáž, prostřední sloupec). Se stíny: stín sloupu je vidět, ale po půlmetrové mřížce má rozmazaný a nepravidelný okraj; na stropě haly dělá stín sloupu od blízké lampy hranatou tmavou skvrnu. S odrazem je bílá laboratoř vybledlá (xLab je podle N-105 přesvícený a expozice je laděná bez odrazu). První verze odrazu dala po celé místnosti světlé skvrny; teď je omezený a vyhlazený (N-001, oddíl 7) a o kolik tím ubylo energie, jsem neměřila. Běh soubor nečte (čtení přejde do základu, D-035) a zapečená data zatím neodpovídají rozhodnutí o dveřích jako branách. Prefaby v náhledu osvětluju po stěnách dílů ze středu stěny a díly téže entity si nestíní; to je vlastnost náhledu, ne formátu.
- **Svislé čárkované čáry na stěnách** v místech, kde na sebe navazují kvádry zdí: sešna A je vidí v enginu u mých levelů i ve zlatém vzorku. Dřív jsem je tady přičetla prohlížeči xView; to neplatí. Příčina neověřená (domněnka sešny A: prosvítají boční plochy kvádrů uvnitř zdi).
- **Počet entit.** Level `complex` má 320 až 584 entit. Jestli to T460 unese, řekne až engine se slučováním a měření.
- **Stažení assetu** z OpenGameArt a Quaternius, licenční údaje zdrojů (viz `tools/searcher/ZDROJE.md`).
- **Všechno v N-006** kromě toho, co je tam výslovně označené jako ověřené: stupně kvality a jejich meze jsou návrh bez měření.

## Návrhy (docs/navrhy)

| Číslo | Co | Dočasné řešení |
|---|---|---|
| N-001 | soubor se zapečeným světlem po vrcholech a vrstvách (stavba, vrstvy, otisky, co stíní). **Přijat se změnou (D-035):** dveře v portálech nestíní, úsek vrstvy s `gate` | xBake píše do `dist/bake`, pole `baked` do balíků nezapisuje; brány neumí |
| N-002 | svázané klouby (dvoukřídlé dveře, mikroskop, klika) | dvě entity spojené přes `io`; nesvázané klouby |
| N-003 | portál jen pro pohled a průhledné dveře (okno, mříž) | generátor okno a mřížovou bránu nerozmisťuje |
| N-004 | údaje prefabu pro rozmisťování (uchycení, rozměr otvoru) | výška v pravidlech předvoleb, otvor ze `source.params` |
| N-005 | průhlednost materiálu (sklo) | `glass_pane` je neprůhledný |
| N-006 | stupně kvality a vrstvy vzhledu (hra má vypadat skutečně; rezerva pro silnější stroj) | bohatší hrubý tvar a textury v polích, která formát už má; nová pole nepíšu |
| N-007 | zakrytí otvoru dveřmi počítat ze všech dílů dveří; `portal.door` jako seznam (doplňuje N-107 sešny A). **Bod 1 přijat, bod 2 zamítnut (D-036)** | dorazy a prahová lišta v sadě; křídla dvoukřídlých dveří mají `seeThrough` a první je v `portal.door`; zkouška paprsky v `b_t1`, `b_t2` |

Bez návrhu, jen k zapsání: (1) `build.mjs` najde jeden `target.json` na složku v `tools/`, takže prohlížeč levelů sedí v `tools/designer`; až bude potřeba víc cílů, bude to chtít pole cílů nebo hlubší hledání. (2) Kloub na víc než 8 otáček (rotor centrifugy) formát neumí; rotor je zatím pevný díl. (3) Zápis JSON ve stylu zlatého vzorku mám jako vlastní funkci `fmtJson` v `src/gen/util.js`, protože ta z `tools/golden/make.mjs` není vyvezená; patřila by do `tools/lib`.

## Co potřebuju od sešny A

Nic neblokuje. Co by ses měla dozvědět dřív než při slučování:

1. **Zkus `packs/gen_demo` místo zlatého vzorku.** První level `complex_7` má zamčené dveře (`props: { locked: true }`) a páku, která je odemkne a otevře (`unlock`, potom `open` se zpožděním 0,5 s). Pro robota bez hádanky je `complex_21` nebo `catacombs_3`.
2. **Buňka přes dvě patra.** Hala v `complex_7` sahá od 0 do 6,4 m; portály do horního patra má ve výšce 3,4 m na galerii, schody jsou plné stupně v hale.
3. **Zapuštěné buňky.** Krypty mají podlahu pod nulou (až −0,72 m); práh portálu je ve výšce vyšší podlahy a schody jsou uvnitř nižší buňky.
4. **Zeď má jednoho vlastníka, ale vidí ji dvě buňky.** Až přijde ořez po buňkách (D-027), viditelná buňka musí kreslit i zdi sousedů, které se jí dotýkají; jinak v ní budou díry.
5. **Světla.** Pole `lights` dává základní osvětlení (má se zapékat). Svítidla sady mají vlastní světlo vypnuté (`on: false`) a vypínač u dveří je zapíná přes `io`; pochodně hoří pořád (`on: true`, `flicker`). Stolní lampa je zapojená sama na sebe (`on → turnOn`).
6. **`io` míří i na vlastní entitu** (stolní lampa) a dvě entity se smí spojit do kruhu (křídla dveří: `opened → open` tam i zpět). Počítám, že `open` na otevřené dveře už výstup `opened` nevyšle.
7. **Přečti si N-006.** Ondřej chce, aby hra vypadala skutečně a aby projekt unesl silnější stroj. Pro vykreslení z toho plyne: nepočítat s tím, že materiál je jen barva (formát už má `albedo` a `normal`) a že díl je jen `box` nebo `cyl` (formát už má `mesh`). Nic z toho není úkol vlny 1.
8. **Dveře (od B02).** Všechny dveře sady mají prahovou lištu 12 mm bez kolize a dorazy zárubně; zavřené jsou bez škvír. Křídla dvoukřídlých dveří mají `seeThrough`, první křídlo je v `portal.door` a druhé se najde přes spojení `opened → open`; jejich portál je pro pohled pořád otevřený (D-036). Prkenné dveře mají otvor 1,0 × 2,0 m.
9. **Katakomby (od B02)** mají chodby 1,6 až 1,9 m a stropy 2,6 až 3,2 m; `gen_demo` je přegenerovaný, `catacombs_3` má 30 buněk.

## Poznatky pro skill

- **Commit hned, ne až po testech.** Tuhle sešnu přerušil limit dřív, než vznikl první commit; soubory přežily restart kontejneru jen proto, že zůstaly na disku. První rozpracovaný stav patří na větev hned, jak projde validátorem, ne až po testech.
- **Celé centimetry v generátoru, metry až v datech.** Hrany buněk a zdí se porovnávají přesně a úsek zdi mezi dvěma buňkami je právě jejich společná stěna, takže otvor nikdy nepřesáhne žádnou z nich. Validátor nenašel nic už na prvním běhu.
- **Zdi jako desky z dělení plochy.** Každé dělení přidá jednu desku; desky se dotýkají, ale nepřekrývají. Deska se potom rozřeže podle buněk po obou stranách a každý kus dostane jednoho vlastníka. Zdi dvou pater nad sebou se musí oříznout pásmem patra, jinak se u buňky přes dvě patra překryjí.
- **Strop spodního patra a podlaha horního jsou dvě desky nad sebou** (rozteč pater = světlá výška + 2 × tloušťka), protože půdorysy pater se liší.
- **Validátor hledá překryvy i u klínů podle jejich obalu**, ne podle šikmé plochy.
- **Co validátor nehlídá, musí hlídat generátor a nezávislý test:** plošina zakrývala dveře, nábytek zatarasil cestu mezi dvěma dveřmi (asi v jednom levelu ze čtyřiceti), kancelářská židle a truhla se nikdy nepostavily kvůli obalu přes rozsah pohybu. Všechno našel až test nad daty.
- **Obal prefabu je přes celý rozsah pohybu.** Pro rozmisťování je potřeba i obal v klidu (`src/gen/measure.js`, `boundsAt`).
- **Pomocné soubory testů do `test/b_lib/`** (soubor `test/b_*.mjs` by se pustil jako test). Stejně to má sešna A.
- **xView kreslí první level balíku.** Jiný level vybere obal, který před jeho startem přehodí pořadí v `__PACK__` (`tools/designer/pre.js`); pořadí importů je pořadí spuštění. Pohled „Start“ se dívá vždy ve směru −Z bez ohledu na `yaw`.
- **`getImageData` opakovaně nad stejným plátnem** vypíše v Chromiu varování a test na čistou konzoli spadne; plátno pro statistiku vytvářej s `willReadFrequently`.
- **Formát umí víc, než kdo kreslí.** `albedo`, `normal` a díl `mesh` ve formátu jsou od základu 1; xView je přeskakuje a engine je nečte. Než napíšu „formát to neumí“, přečíst `src/xspace/formats.js`, ne dokumenty.
- **Čistý vzhled z kvádrů je pracovní pohled, ne herní.** Ondřej ho bere pro náhledy v nástrojích, pro hru ne. Montáž prefabů z kvádrů a válců mu jako ukázka vzhledu hry neposílat.
- **Síť ze sandboxu sešny B pustí víc, než říká zadání:** Poly Haven a ambientCG včetně souborů, OpenGameArt a Quaternius (stránky), GitHub, Wikimedia Commons. Kenney vrací 403, Sketchfab neprojde. Platí pro 22. 11. 2026; v jiné sešně měřit znovu.
- **Stavový dokument svodné sešny v projektu (`claude/xEngine_zaklad1_2026-11-22.md`) se mění během dne.** Před zápisem stavu ho přečíst znovu: mezi ránem a odpolednem se v něm změnil cílový commit znění 2 (`6ae2e6c` → `058ed41`) i postup (sloučit, ne přebázovat).
- **Mezera kolem křídla dveří je díra v obraze.** Engine za zavřenými dveřmi portálu místnost nekreslí. Mezery, které jsou u skutečných dveří (pod křídlem, kolem zárubně), musí v datech krýt doraz nebo lišta. Obal kolize to nepozná; pozná to paprsek proti dílům (`test/b_lib/door-cover.mjs`).
- **Dveřmi portálu smí být jen entita, která otvor zakryje sama.** Křídlo dvoukřídlých dveří ne.
- **Připojení repa se zápisem a push chtějí Ondřejovo výslovné slovo ve zprávě.** Bez něj je systém odmítne (sešně B02 připojení, sešně main 01 push). Číst veřejné repo jde i bez něj.
- **Než začneš slučovat z přílohy, zeptej se GitHubu znovu.** Mezi dvěma zprávami téhož večera svodná sešna znění 2 pushla a založila `integrace-1`.
- **Vrchol světelné sítě na hraně plochy leží často ve zdi.** Paprsek z něj skončí hned v tělese a kolem každé zdi vznikne tmavý pruh široký jednu buňku mřížky. Počátek paprsku posunout 2 cm po normále a 1 cm ke středu plochy; vzorek, který i tak leží v tělese, doplnit průměrem platných sousedů na téže ploše.
- **Srovnání „se stíny × bez stínů“ musí mít na obou stranách stejné členy.** Výpočet se zastíněním a odrazem vyšel světlejší než výpočet bez zastínění a bez odrazu; test to chytil jako selhání a chyba byla v testu.
- **Odraz počítaný paprsky zrní kvůli plochám těsně u světla** (osvětlení o dva řády vyšší než okolí, trefí je jeden paprsek z desítek). Bez obrazu to z čísel poznat nešlo; první pohled do náhledu ano. Pomohlo omezit jas zdroje odrazu a vyhladit vrstvu přes sousedy na ploše.
- **Světlo na dílu prefabu počítat ve středu stěny, ne v rozích, a díly téže entity nechat, ať si nestíní.** Roh křídla dveří je 1 cm od překladu a paprsek z něj skončí ve zdi: dveře byly v náhledu černé. Střed stěny skříně leží za čelem zásuvky.
- **Dočasné řešení v datech ověř proti testu, který data čte.** Dvoukřídlé dveře jsem přestala zapisovat do `portal.door` a vlastní testy prošly; zkouška A × B, kterou jsem tehdy v repu neměla, selhala. Když test druhé strany není po ruce, napsat změnu do stavu jako riziko, ne jako hotovou věc.
- **Než vymyslíš vlastní dočasné řešení, podívej se, jestli už svodná sešna nepřijala pole, které to řeší** (`interact.seeThrough` z N-107 řešilo přesně křídlo, které otvor nezakryje).
- **Stín po vrcholech má na hraně jen dvě hodnoty** a při mřížce 0,5 m z toho jsou hranaté skvrny; Ondřej si jich všiml hned. Jeden paprsek na vzorek nestačí.

## Otázky pro Ondřeje

Prvních pět je zodpovězeno (viz Rozhodnutí), pořadí práce a síla odrazu také (viz Vlna 2 a Sešna B02). Otevřené zůstávají 1, 2, 3 a 5; do odpovědi platí moje doporučení 1 (a), 2 (a), 3 (a). Otázku 4 jsem stáhla, protože podle bodu 5/ zadání se grafika a zvuky do mezí nepočítají a balíky budou vedle hry:

1. Směr vzhledu, kterým začít: (a) opotřebený provoz (ošlapaný beton, oprýskaný lak, rez, prach; chyby se v něm ztratí a věrohodnosti se dosáhne nejdřív), (b) čistá moderní laboratoř (bílé plochy, nerez, sklo; každá nepřesnost je vidět a bez dobrého světla působí sterilně dál).
2. Cizí modely z webu: (a) z webu jen materiály a textury, tvary vlastní na vlastních kostrách (jednotný styl, všechno se hýbe), (b) k tomu i hotové skenované modely jako nepohyblivé rekvizity (rychleji plno, ale styl může tlouct a data narostou).
3. Kde chceš herní vzhled vidět poprvé: (a) co nejdřív v galerii sady, i když to hra ještě neumí, (b) až ve hře, až engine načte textury (vlna 2).
4. *(staženo, viz výše)* Velikost hry: (a) dál jeden soubor HTML a textury nejvýš 512 px, (b) hra a vedle ní složka s balíky, textury 1 024 px a víc.
5. Silnější stroj, na který mám mířit horní stupeň: (a) novější notebook s integrovanou grafikou, (b) stroj se samostatnou grafickou kartou (napiš jakou, nebo aspoň cenovou třídu).

Mimo sešnu B na tebe teď nic nečeká: znění 2 je na GitHubu a `xbench_0-2.html` jsi na T460 pustil třikrát (22. 11.; výsledky v `docs/mereni/`).
