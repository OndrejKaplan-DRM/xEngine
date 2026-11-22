# Stav sešny B

**Vlna:** 1 · **Větev:** `sesna-b` · **Základ:** znění 2 (`zaklad-1` = `16548b4`), sloučeno 22. 11. 2026 ve 22:35 (`ff4af58`) · **Stav:** 22. 11. 2026 večer, sešna B02

> **Základ.** Větev stojí na znění 2 (`origin/zaklad-1` = `origin/main` = `16548b4`): světlo po vrcholech (`brushLightMesh`, `lightIrradiance`), Shell v `src/shell`, zadání v `docs/00_ZADANI.md`. Sloučení bylo bez konfliktů; po něm základ 232 kontrol a skupina B beze změny. Svodná sešna má stav vlny 1 (`754f46d`) sloučený v `integrace-1`; commity této sešny B02 tam nejsou.

## Hotovo × neuděláno

| Úkol | Stav | Test | Poznámka |
|---|---|---|---|
| B1.1 xGen: stavebnice a rozvržení | hotovo | `b_t1_xgen` 52 (Node) | předvolby `complex` (dvě patra s galerií, nebo jedno patro s plošinou a rampou) a `catacombs`; 500 levelů bez nálezu validátoru; katakomby po Ondřejově volbě 2 (b) |
| B1.2 xForge: sada prefabů | hotovo, vzhled nevyhovuje | `b_t2_kit` 21 (Node), `b_t3_galerie` 8, `b_t4_levely` 20 (prohlížeč) | `kit_base`: 49 prefabů, 27 s kloubem (33 kloubů), 41 materiálů; galerie `dist/kit.html`; generátor rozmisťuje 47 ze 49. Ondřej 22. 11.: tvary dobré, ale „příliš sterilní“ (viz Rozhodnutí a N-006). Zavřené dveře jsou od B02 bez škvír (N-007) |
| B1.3 xBake: zapečené světlo | neuděláno, **další krok** | | zadání znění 2: světlo po vrcholech `brushLightMesh`, jedna vrstva na světlo, zastínění a nepřímá vrstva navíc; funkce základu jsou po sloučení k dispozici; návrh N-001 nenapsán |
| B1.4 xSearcher: příjem assetů | začato | | hotové jen měření dosažitelnosti zdrojů (`tools/searcher/ZDROJE.md`); nástroj `find.mjs` neexistuje |

`npm run test:b`: 101 kontrol, 0 selhalo, asi 60 s. `npm test` (základ, znění 2): 232 kontrol, 0 selhalo.

## Sešna B02 (22. 11. 2026 večer)

Ondřej ve 22:24: zápis do repa a push `sesna-b` ano; znění 2 sloučit hned; pořadí práce katakomby → škvíry u dveří → xBake → xSearcher a textury.

| Krok | Stav | Commit |
|---|---|---|
| sloučení znění 2 základu (`origin/zaklad-1`, `16548b4`) | hotovo, bez konfliktů | `ff4af58` |
| katakomby podle volby 2 (b) | hotovo | `b2f5ef0` |
| škvíry u dveří, dveře portálu, prkenné dveře, návrh N-007 | hotovo | commit „Dveře bez škvír“ |
| B1.3 xBake a N-001 | další krok | |
| B1.4 xSearcher a textury | po xBake | |

**Dveře.** Engine sešny A bere zavřené dveře portálu jako neprůhledné a místnost za nimi nekreslí (její N-107). Sada měla kolem křídla skutečné škvíry: 1 cm pod křídlem a pod překladem, 0,5 cm po stranách, 4 mm mezi prkny prkenných dveří, 8 mm mezi křídly dvoukřídlých dveří. Zkouška paprsky (`test/b_lib/door-cover.mjs`) jimi před opravou prostrčila 1 374 až 8 352 paprsků na jedny dveře, po opravě žádný. Oprava: dorazy zárubně za křídlem (přesah 15 mm), prahová lišta 12 mm bez kolize, jádro prkenných dveří, krycí lišta na pravém křídle dvoukřídlých dveří, u posuvných dveří uzavřená štěrbina stojky nad křídlem. Generátor zapisuje `portal.door` jen u dveří z jedné entity. Prkenné dveře mají otvor 1,0 × 2,0 m místo 0,9 × 2,0 m (světlost 0,90 m): svodná sešna v T5 zjistila, že 0,80 m projde postava široká 0,74 m jen středem.

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
| 3 | B1.3 xBake + N-001 (Ondřej 22. 11. večer: xBake před xSearcherem) | podle `START_B.md` znění 2: zapečení xLabu do 60 s, stín sloupu měřitelně tmavší, součet vrstev bez zastínění = `lightIrradiance` na 1e-6, náhled vlastní stránkou | na T460 jediná cesta ke stínům (D-022); stíny a ztmavené kouty jsou první příčina sterilního vzhledu |
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
| dosažitelnost zdrojů assetů | Poly Haven a ambientCG: rozhraní i soubory ano; OpenGameArt a Quaternius: stránky ano, stažení souboru neměřeno; Kenney: 403 | `curl` 22. 11. kolem 14:00, tabulka v `tools/searcher/ZDROJE.md` |
| velikost jedné sady map | ambientCG `Concrete049`: 1K-JPG 10 406 004 B, 2K-JPG 36 432 631 B, 4K-JPG 131 410 218 B | odpověď rozhraní ambientCG |

## Neověřeno

- **Prošel to jen robot bez obrazu.** Svodná sešna (`integrace-1`, test T5) pustila všechny tři levely `gen_demo` v enginu sešny A beze změny kódu: všechny buňky dosažitelné pro kapsli hráče, robot došel ze startu do nejvzdálenější buňky (57,9 m, 42,5 m, 28,7 m), dveře otevřel rukou, nikde neuvázl. Robot chodí nejkratší cestou a většinu místností míjí; běží v Node bez vykreslení. Zkouška proběhla nad stavem `754f46d`, tedy před změnou katakomb a dveří; nad dnešním stavem ji nikdo nepustil. Vlastní průchodnost hlídám dál dvourozměrnou mřížkou s poloměrem 0,3 m, ne Rapierem; hala s galerií a plošinou se v ní přeskakuje.
- **Schody.** Geometrie je v mezích zadání (výška stupně 0,17 až 0,20 m, hloubka 0,28 m), ale kontrolér postavy je nezkoušel. Zlatý vzorek má stupně 0,25 m, takže by měly být snazší; je to úvaha. Sešna A změřila, že kontrolér vyjde schod jen při vodorovném posunu aspoň asi 7 mm na krok; s mými schody to nikdo nezkoušel.
- **Vzhled.** Všechny snímky jsou ze softwarového vykreslování, v galerii s vlastním nasvícením, v xView s osvětlením po vrcholech celých stěn (na hranicích úseků zdí dělá viditelné svislé předěly; je to vlastnost prohlížeče, ne dat). Barvy materiálů neviděl nikdo na skutečné grafické kartě. Ondřej viděl montáže a soubory z 22. 11. a vzhled označil za sterilní.
- **Meze kloubů.** Žádná nebyla změřena na skutečném předmětu; u každé je v `KIT.md` úvaha a u většiny poznámka „neměřeno“.
- **Svítivosti.** Pevná světla jsem volila podle zlatého vzorku (místnost 9 až 22 cd, hala 140 cd, pochodeň 8 až 12 cd). Jak je to jasné ve hře, nevím; katakomby jsou schválně tmavé a výklenky bez světla. Sešna A v N-105 píše, že zlatý vzorek je přesvícený; moje hodnoty z něj vycházejí, takže se jich to může týkat také.
- **Posuvné dveře** zajíždějí do zdi (křídlo se v otevřené poloze překrývá s kvádrem zdi). Jak se k tomu postaví Rapier a kreslení, nevím.
- **Dvoukřídlé dveře** jsou dvě entity se stejným počátkem (N-002) a od B02 nejsou zapsané v `portal.door` (N-007): engine za nimi kreslí místnost i při zavřených křídlech. Když hráč otevře jako první levé křídlo, projde na okamžik krycí lištou pravého (8 mm, bez kolize); okem neposuzováno.
- **Zakrytí otvoru dveřmi** hlídá vzorkovaná zkouška paprsky (`test/b_lib/door-cover.mjs`: kolmé paprsky na síti z hran dílů a šikmé vějíře do 50° vodorovně a 30° svisle), ne důkaz. V enginu sešny A to se zavřenými dveřmi nikdo neviděl.
- **Svislé čárkované čáry na stěnách** v místech, kde na sebe navazují kvádry zdí: sešna A je vidí v enginu u mých levelů i ve zlatém vzorku. Dřív jsem je tady přičetla prohlížeči xView; to neplatí. Příčina neověřená (domněnka sešny A: prosvítají boční plochy kvádrů uvnitř zdi).
- **Počet entit.** Level `complex` má 320 až 584 entit. Jestli to T460 unese, řekne až engine se slučováním a měření.
- **Stažení assetu** z OpenGameArt a Quaternius, licenční údaje zdrojů (viz `tools/searcher/ZDROJE.md`).
- **Všechno v N-006** kromě toho, co je tam výslovně označené jako ověřené: stupně kvality a jejich meze jsou návrh bez měření.

## Návrhy (docs/navrhy)

| Číslo | Co | Dočasné řešení |
|---|---|---|
| N-002 | svázané klouby (dvoukřídlé dveře, mikroskop, klika) | dvě entity spojené přes `io`; nesvázané klouby |
| N-003 | portál jen pro pohled a průhledné dveře (okno, mříž) | generátor okno a mřížovou bránu nerozmisťuje |
| N-004 | údaje prefabu pro rozmisťování (uchycení, rozměr otvoru) | výška v pravidlech předvoleb, otvor ze `source.params` |
| N-005 | průhlednost materiálu (sklo) | `glass_pane` je neprůhledný |
| N-006 | stupně kvality a vrstvy vzhledu (hra má vypadat skutečně; rezerva pro silnější stroj) | bohatší hrubý tvar a textury v polích, která formát už má; nová pole nepíšu |
| N-007 | zakrytí otvoru dveřmi počítat ze všech dílů dveří; `portal.door` jako seznam (doplňuje N-107 sešny A) | dorazy a prahová lišta v sadě; dvoukřídlé dveře nejsou v `portal.door`; zkouška paprsky v `b_t1`, `b_t2` |

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
8. **Dveře (od B02).** Všechny dveře sady mají prahovou lištu 12 mm bez kolize a dorazy zárubně; zavřené jsou bez škvír. Dvoukřídlé dveře nejsou v `portal.door` (N-007), jejich portál je pro pohled pořád otevřený. Prkenné dveře mají otvor 1,0 × 2,0 m.
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

## Otázky pro Ondřeje

Prvních pět je zodpovězeno (viz Rozhodnutí), pořadí práce také (viz Sešna B02). Otevřené zůstávají 1, 2, 3 a 5; otázku 4 jsem stáhla, protože podle bodu 5/ zadání se grafika a zvuky do mezí nepočítají a balíky budou vedle hry:

1. Směr vzhledu, kterým začít: (a) opotřebený provoz (ošlapaný beton, oprýskaný lak, rez, prach; chyby se v něm ztratí a věrohodnosti se dosáhne nejdřív), (b) čistá moderní laboratoř (bílé plochy, nerez, sklo; každá nepřesnost je vidět a bez dobrého světla působí sterilně dál).
2. Cizí modely z webu: (a) z webu jen materiály a textury, tvary vlastní na vlastních kostrách (jednotný styl, všechno se hýbe), (b) k tomu i hotové skenované modely jako nepohyblivé rekvizity (rychleji plno, ale styl může tlouct a data narostou).
3. Kde chceš herní vzhled vidět poprvé: (a) co nejdřív v galerii sady, i když to hra ještě neumí, (b) až ve hře, až engine načte textury (vlna 2).
4. *(staženo, viz výše)* Velikost hry: (a) dál jeden soubor HTML a textury nejvýš 512 px, (b) hra a vedle ní složka s balíky, textury 1 024 px a víc.
5. Silnější stroj, na který mám mířit horní stupeň: (a) novější notebook s integrovanou grafikou, (b) stroj se samostatnou grafickou kartou (napiš jakou, nebo aspoň cenovou třídu).

Dvě věci čekají na tebe mimo sešnu B: push znění 2 základu (svodná sešna) a běh `xbench_0-2.html` na T460 (rozhodne, kolik textur T460 unese).
