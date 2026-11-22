# xEngine a xEcosystem: vize, rozsah a co jsem v zadání změnila

Stav 22. 11. 2026. Vychází z Ondřejova zadání (A až F, body 1 až 5), z Arény v2, ze sady frameworků Level 1 a z rozboru vývoje enginů od Doomu po rok 2026.

## 1. Jádro jednou větou

**Chodím světem z pohledu první osoby, který vznikl z dat, a všechno, na co sáhnu, se chová podle své kostry.**

Engine sám nic nestaví. Svět je vždy soubor dat (xSpace), který vyrobil nástroj nebo generátor, a engine ho jen načte, vykreslí, spočítá a oživí.

## 2. Co to je a co to není

| Je | Není |
|---|---|
| engine pro 3D z pohledu první osoby v prohlížeči (WebGL 2), cílený na Lenovo T460 | vlastní rasterizér, náhrada Three.js ani konkurent Unrealu |
| datový formát xSpace a jeho validátor | další hra s levely napsanými v kódu (to byla mez Arény v2) |
| nástroje, které vyrábějí data: generátory, zapékání světla, hledání volných assetů, později editor | náhrada Blenderu. Blender zůstává jedním z nástrojů |
| dvě mutace téhož jádra: svižná (aréna) a klidná (přesná práce rukama) | dva enginy vedle sebe |
| zkušební level xLab, na kterém se všechno měří | engine bez hry. Každá vlna končí něčím, co se dá projít |

## 3. Součásti a jejich jména

| Jméno | Co dělá | Kde | Kdo |
|---|---|---|---|
| **xKernel** | registr systémů, fáze, události, pevný krok, režimy, uložení stavu | `src/kernel` | základ |
| **xSpace** | formát dat (balík, materiály, prefab, level), validátor, geometrie, kostry | `src/xspace`, `packs/` | základ |
| **xWorld** | načtení levelu do scény a fyziky, buňky a portály, entity, spojení vstupů a výstupů | `src/world` | sešna A |
| **xRender** | vykreslení: dávky, viditelnost, světla, zbraň v ruce, obraz | `src/render` | sešna A |
| **xPhys** | Rapier: statický svět, postava, tělesa, paprsky | `src/phys` | sešna A |
| **xPlay** | hráč, profily pohybu, interakce, později zbraně a nepřátelé | `src/play` | sešna A |
| **xShell** | menu, pauza, nastavení, ukládání; převzato z `vibe-game-frameworks` | `src/shell`, `src/app` | sešna A (zapojení) |
| **xGen** | generátory: parametry a seed → data levelu (místnosti, chodby, patra, katakomby) | `src/gen` | sešna B |
| **xForge** (v zadání xBlender) | výroba prefabů a modelů kódem, od kostry k tvaru | `tools/forge` | sešna B |
| **xBake** | zapékání světla | `tools/bake` | sešna B |
| **xSearcher** | hledání a příjem volných assetů s evidencí licencí | `tools/searcher` | sešna B |
| **xDesigner** | editor světů nad stejným během jako hra | `tools/designer` | od vlny 2 |
| **xView**, **xBench** | prohlížeč dat a měření stroje | `tools/xview`, `tools/xbench` | základ |

## 4. Kde se rozcházím se zadáním a proč

Zadání beru vážně, ale v osmi bodech by doslovné splnění vedlo přesně k tomu, čemu se chceš vyhnout.

1. **Šest součástí naráz je přepálený start.** Tvoje vlastní zásada 9 z Level 1 říká „jedna novinka na iteraci“. Řešení není zadání zmenšit, ale rozříznout ho datovým kontraktem: jedna polovina data vyrábí, druhá je spotřebovává, a potkávají se na zlatém vzorku. Proto existuje xSpace dřív než první řádek enginu.
2. **Engine bez hry nemá selekční tlak.** id Tech vznikl z Doomu a Quaka, Source z Half-Life. Engine psaný „do zásoby“ nikdo neprověří. Proto je součástí základu level xLab s měřitelnými úkoly (schod 0,3 m, rampa 30° a 50°, dveře na tlačítko, páka, ventil, terminál).
3. **„xBlender, který se sám učí a Blender zastoupí“ nepostavím a neslíbím.** Postavím knihovnu generátorů v kódu: parametry → kostra → tvar → kolize → data. „Učení“ znamená, že každý poznatek skončí ve skillu a v galerii, proti které se nové výstupy porovnávají. Jméno navrhuju změnit na **xForge**: Blender je ochranná známka Blender Foundation a nástroj je širší než Blender. Rozhodnutí je na tobě (D-011).
4. **„Hyperrealističnost za co nejmíň trojúhelníků“ míří na špatnou páku.** Integrovaná grafika T460 zvládne stovky tisíc trojúhelníků; dusí ji počet světel na pixel a volání kreslení. Realistický dojem roku 2003 stál na zapečeném světle (Half-Life 2), ne na geometrii. Proto je v plánu zapékání světla dřív než detailní modely.
5. **„75 % věrnosti“ se nedá změřit, dokud není řečeno čeho.** Převedla jsem to na seznam 40 schopností enginů roku 2003 (`05_PARITA_2003.md`); 75 % = 30 splněných řádků s testem.
6. **Doom 3 není svižná aréna a Doom: The Dark Ages není vzor realismu pro T460.** Doom 3 je pomalý koridor s jednotným osvětlením; beru z něj obrazovky ve světě, na které se dá klikat. The Dark Ages vyžaduje sledování paprsků na grafice o tři třídy výš; technicky z něj pro T460 nejde převzít nic. Svižnou mutaci proto kalibruju podle Quake III, klidnou podle Half-Life a Counter-Strike.
7. **Octree vedle Rapieru ne.** Level 1 to má jako invariant F1 (jedna fyzikální autorita) a Aréna to potvrdila. Pro výběr myší v editoru a zapékání světla slouží `three-mesh-bvh`, což není kolizní systém.
8. **„Kód do 10 MB“ nic nehlídá** (celý prohlížeč dat má 0,63 MB včetně Three.js). Užitečné meze jsou čas snímku, volání kreslení a paměť na T460. Ty jsou v `06_ROZPOCTY.md` a zatím jsou odhad: nahradí je čísla z xBench na tvém stroji.

A jedno upřesnění: **„nad úrovní všech našich projektů ve všech aspektech“** beru jako srovnání s Arénou v2, jediným srovnatelným projektem. Tabulka je v `01_ARCHITEKTURA.md`, oddíl 6. Sluneční soustava 200 řeší jiný problém (64bitová přesnost, efemeridy) a měřit se s ní nedává smysl.

## 5. Referenční stroj

Lenovo ThinkPad T460 podle specifikace výrobce: Intel Core i5-6200U (2 jádra, 4 vlákna), **Intel HD Graphics 520** bez samostatné grafiky, displej 1366 × 768 nebo 1920 × 1080. Zdroj: Lenovo PSREF.

Neznámé, které rozhodují o výkonu víc než cokoli v kódu:
- zda je 8 GB jako jeden modul, nebo dva (jeden modul = jednokanálová paměť, integrovaná grafika pak běží znatelně pomaleji),
- které rozlišení displeje stroj má,
- prohlížeč a ovladač grafiky.

Na všechno odpoví jedno spuštění `xbench.html`.

## 6. Podle čeho poznáme, že se to povedlo

1. Level vznikne nástrojem a engine ho načte bez úpravy kódu enginu.
2. Na T460 běží xLab na 60 snímcích za sekundu v rozpočtech změřených xBench.
3. 30 ze 40 řádků parity má test.
4. Po páté sešně jde přidat nový systém bez zásahu do jiného systému (měřeno: žádná změna v cizí složce, žádný rozbitý cizí test).
5. Každá vlna končí sestavením, které sis prošel.
