# Předávka – část 2/3

Průběžná předávka č. 1 — xEngine, svodná sešna „main 02“ — 2026-11-24 (pokračování)

## 5. Osoby a obsazení
| Kdo | Role | Vztah k věci | Co řekl / rozhodl / chce | Jak s ním jednat |
|---|---|---|---|---|
| Ondřej Kaplan | zadavatel, jediný, kdo mění zadání a povoluje push | zkouší na svém T460, přeposílá zprávy mezi sešnami | povolil push 4 větví; projekt je plný; volby 1b, 2a, 3a (fáze 6), 1a, 2a (fáze 7), 1a, 2a (fáze 8); u sešny A volba 2a (zavřenými dveřmi světlo neprochází) a „chci jemnější [stíny] už teď“; u sešny B: tvary dobré, ale „příliš sterilní“, odraz slabší (dok.) | česky, tykat, krátké mezistavy, soubor k vyzkoušení, 3–5 otázek a/b, odpovídá tvarem „1 → (a)“; nepodlézat, čísla jen změřená |
| Kristína, main 02 (já) | svodná sešna | vlastní základ, slučuje, rozhoduje návrhy | viz oddíl 6 | — |
| sešna main 01 | předchozí svodná | znění 2 základu 1, předávka ve 2 částech | předala bundle a „první kroky main 02“ | uzavřená |
| sešna A (běhy A01, A02) | běh enginu | `src/world`, `render`, `phys`, `play`, `app` | návrhy N-101 až N-108; 4 otázky pro Ondřeje; v doplňku N-108 navrhuje pole `env.lightCell` | jen přes `A_STAV.md` a `START_A.md`; skončila 2026-11-23 asi v 05:00 na `3b005a7` |
| sešna B (běhy B01, B02) | obsah a nástroje | `src/gen`, `tools/forge`, `bake`, `searcher`, `designer`, balíky | návrhy N-001 až N-007; 4 otevřené otázky pro Ondřeje (1, 2, 3, 5) | jen přes `B_STAV.md` a `START_B.md`; skončila 2026-11-23 ve 03:00 na `64e622b` |

## 6. Rozhodnutí (platná)
- Push větví `zaklad-1`, `main`, `integrace-1`, `zaklad-2` povolen; do projektu v claude.ai nepsat — Ondřej, 2026-11-22 21:01.
- `zaklad-2` až po rozhodnutí návrhů a rozporů (1 b); převod sešny A na světlo po vrcholech je první úkol vlny 2 a `zaklad-2` na něj nečeká (2 a); zápis o Shellu do `vibe-game-frameworks` hned (3 a) — Ondřej, 2026-11-22 23:09.
- D-029: stupně kvality 0 `clean`, 1 `low` (T460), 2 `mid`, 3 `high`; data nesou nejvyšší kvalitu, běh vybírá; závazný a změřený je jen `low` — svodná, fáze 6.
- D-030: pole N-006 (`layer`, `lod`, `minTier`, `trisBase`, `orm`, `emissiveMap`, `sizes`, `detail`, `decals`) do formátu až po zkoušce na jednom kusu (prefab se sítí `.glb` a materiál s texturou) — svodná, fáze 6.
- D-031: rozpory vlny 1 se zněním 2 (mimo jiné ruší D-027) — svodná, fáze 6.
- D-032: klidný režim; s dodatkem, že platí D-024 — svodná, fáze 6.
- D-033: které přijaté návrhy jsou už v základu (volitelná pole a věty kontraktu) — svodná, fáze 6.
- D-034: dluhy základu a jejich pořadí; N-101 je od 2026-11-23 provedeno — svodná, fáze 6 a 7.
- D-035: soubor `levels/<id>.light.bin` (značka `XLV1`, vrstvy `light`, `entity`, `indirect`, `ao`) přijat; křídla dveří v portálech nestíní, úsek vrstvy s polem `gate` × otevření dveří; `indirect` se bránou neřídí; `decodeBake` přejde do základu při příštím sloučení — svodná, fáze 7.
- D-036: zakrytí otvoru ze všech neprůhledných dílů dveří v klidu; `portal.door` zůstává jedna entita; dvoukřídlé dveře jako jeden prefab přes N-002 (`follow`); do té doby `seeThrough` — svodná, fáze 7.
- D-037: mřížka světla znění 2 (vrcholy na násobcích `LIGHT_CELL` ve světě, bez ploch schovaných celé v jiném kvádru); varianta (b) jen když zbudou švy; hrubost stínu řeší xBake víc paprsky — svodná, fáze 7.
- Další krok svodné: mřížka světla hned (1 a); průběžná předávka teď (2 a) — Ondřej, 2026-11-24 01:04.
- Úprava skillu `xengine`: navržena 2026-11-23, Ondřej ji uložil (stav souboru 2026-11-24 01:06).

## 7. Slepé uličky a zamítnuté varianty
- Dijkstra se vzdálenostmi ve `Float32Array` — halda držela hodnoty v plné přesnosti, porovnání nesedělo a uzly se neexpandovaly — `Float64Array`.
- Navigační vzorky přesně na násobcích mřížky — paprsek po společné stěně dvou kvádrů mine oba — posun vzorků o `OFF = 0.003` m.
- Navigační mřížka 0,1 m — dveřmi se světlostí 0,80 m projde kapsle jen středem a střed ležel mezi vzorky — mřížka 0,05 m.
- Měření volání kreslení v Node bez nastavení pohledu — vracelo pohled ze startu — před měřením `game.render.setView(...)`.
- Odhad výkonu hry z xBench — vyvrácen měřením F3 — odhad vždy označit a nechat změřit.
- `portal.door` jako seznam entit (N-007 bod 2) — zamítnuto, viz D-036.
- Dveře stínící při zapékání v klidové poloze (N-001 bod 5) — zamítnuto, viz D-035.
- Záplata švů posunem geometrie a vyhlazování hran jako lék na švy — zamítnuto v D-037 (zadání to zakazuje; vyhlazování stojí na T460 4,4 až 6,2 ms).
- Příkaz s `&` uvnitř volání na pozadí — skončil hned — pouštět bez `&` a číst log.
- `git log zaklad-2..` — místní větev toho jména neexistuje — používat `origin/zaklad-2` nebo `integrace-1`.
- Klíč `shell` v `test/a_00_build.mjs` (moje přejmenování) — sešna A nechala `vendor`, hrozil konflikt — převzato znění sešny A.

## 8. Registr faktů
| Kategorie | Položka | Hodnota (přesně) | Zdroj | Jistota |
|---|---|---|---|---|
| repo | adresa | `https://github.com/OndrejKaplan-DRM/xEngine.git` (malými písmeny jen přesměruje) | skill, git | 5/5 |
| repo | klon v kontejneru | `/home/claude/xengine`, větev `main` | kontejner | 5/5 |
| větve 2026-11-24 01:10 | `main` = `zaklad-2` = `integrace-1` | `d2fb217` | `git fetch` | 5/5 |
| větve | `zaklad-1` | `16548b4` | `git fetch` | 5/5 |
| větve | `sesna-a` | `3b005a7` (obsahuje `b12f8ed`, neobsahuje `d2fb217`) | `git fetch` | 5/5 |
| větve | `sesna-b` | `64e622b` (obsahuje `d2fb217`) | `git fetch` | 5/5 |
| větve, historie | `sesna-a` | `7d3bec6` → `230b3ee` (stav sloučený do základu) → `b0dce2f` → `5626629` → `f2766ea` → `a1d3081` → `3b005a7` | git, přepis | 5/5 |
| větve, historie | `sesna-b` | `754f46d` (stav sloučený do základu) → `9944620` → `129318d` → `64e622b` | git | 5/5 |
| moje commity | po řadě | `e13d1fc`, `e0d3767`, `8541329`, `d2c19aa`, `0db9773`, `932caad`, `0c7c662`, `dd7c359`, `b12f8ed`, `cc5078f`, `d2fb217`; sloučení `0161f63` (A), `cb7068e` (B) | `git log` | 5/5 |
| jiné repo | `vibe-game-frameworks`, větev `dev` | `3aa13f4`; klon `/home/claude/vibe-game-frameworks` | ze souhrnu | 4/5 |
| git | autor a konec zprávy | `Kristína (Claude) <noreply@anthropic.com>`; `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>` a `Claude-Session: https://claude.ai/code/session_011CupjaPB9YsvWJHCDQSXiF` | pravidla | 5/5 |
| git | push | `git -c push.negotiate=true push origin main main:refs/heads/zaklad-2 main:refs/heads/integrace-1` | použito | 5/5 |
| verze | knihovny | Three.js 0.187, Rapier 0.21 compat, esbuild 0.28.2, Node 22; Playwright z `/opt/npm-tools` | repo | 5/5 |
| testy | znění 1 / znění 2 základu 1 | 165 / 232 kontrol | přepis | 5/5 |
| testy | `integrace-1` první regrese | 628 | přepis | 5/5 |
| testy | `zaklad-2` `b12f8ed` | 633 (základ 237, A 267, B 92, A × B 37) | ze souhrnu | 5/5 |
| testy | `cc5078f` | 638 (základ 242: T0 41, T1 128, T4 46, T2 15, T3 12) | log | 5/5 |
| testy | sloučení nanečisto 2026-11-22 23:30 | 688 prošlo, 2 selhaly (T5) | dok. | 5/5 |
| testy | sloučení nanečisto 2026-11-23 02:40 (`cc5078f` + `a1d3081` + `129318d`) | 722, 0 selhalo; A 18 sad, B 6 sad, A × B 28 + 9 | log | 5/5 |
| testy | běh sešny A na `b77837f` | 702 (základ 237, A 336 ve 21 sadách, B 92, A × B 37) | dok. `A_STAV.md` | 4/5 |
| T5 | `complex_7` / `complex_21` / `catacombs_3` / zlatý vzorek | 45/45 buněk, 57,9 m, 9 dveří, 158 volání / 39/39, 42,5 m, 6, 105 / 33/33, 28,7 m, 1, 108 / 5/5, 25,2 m, 1, 37 | přepis | 5/5 |
| T5 | parametry robota | mřížka 0,05 m; `OFF = 0.003`; poloměr kapsle `P.radius + 0.02`; `FOOT = 0.35`; `STEP_UP = 0.3`; schůdnost `normal.y >= 0.7`; krok 1/30 s; limit 400 volání | ze souhrnu | 4/5 |
| T5 | nedosažitelné buňky 2026-11-22 (opraveno `129318d`) | `c_store_08`, `c_lab_05`, `c_store_12` (`complex_7`), `c_store_02` (`complex_21`) | dok. | 5/5 |
| hráč | šířka kapsle s odstupem | 0,74 m (poloměr 0,35 m + `CHARACTER_SKIN` 0,02 m) | přepis | 4/5 |
| xBench 0.2, nejhorší medián ze 3 běhů, 1366 × 768 | interiér, barva vrcholů | 2,44 ms (576 řádků 2,05; 1080 řádků 4,35) | `06_ROZPOCTY.md` | 5/5 |
| xBench 0.2 | interiér s texturou / s vyhlazováním | 3,48 / 8,60 ms | tamtéž | 5/5 |
| xBench 0.2 | interiér, 1 / 4 světla po pixelech | 6,30 / 10,70 ms | tamtéž | 5/5 |
| xBench 0.2 | 8 / 16 světel; fyzikální materiál 8 světel; stín 2 048 px | 16,70 / 23,20; 22,70; 24,60 ms | tamtéž | 5/5 |
| xBench 0.2 | 800 volání; 594 tis. △; 1 201 tis. △ | 5,35; 7,15; 14,50 ms | tamtéž | 5/5 |
| xBench 0.2 | rozpočet vykreslení | 10 ms | tamtéž | 5/5 |
| F3 na T460 (4 pohledy, hra z vlny 1, 8 světel po pixelech) | snímky/s | 60 ve všech | `docs/mereni/…F3.md` | 5/5 |
| F3 | čas procesoru na snímek | 9,46 / 4,75 / 2,74 / 7,79 ms | tamtéž | 5/5 |
| F3 | krok simulace (mez 2 ms) | 2,87 / 1,23 / 0,64 / 3,50 ms | tamtéž | 5/5 |
| F3 | z toho fyzika | 2,10 / 0,95 / 0,60 / 3,10 ms | tamtéž | 5/5 |
| sandbox | krok simulace téhož levelu | medián 0,13 až 0,17 ms | T5 | 5/5 |
| T460 | panel | 1920 × 1080 při 125 % (1536 × 864 bodů CSS); Intel HD 520; 8 GB v 1 modulu | xBench, ze souhrnu | 4/5 |
| světlo | `LIGHT_CELL` | 0,5 m (`src/xspace/geom.js`) | repo | 5/5 |
| světlo | zlatý vzorek, síť pro světlo | 20 658 vzorků, 32 386 trojúhelníků (bez dílů prefabů) | N-108, T1 | 5/5 |
| světlo | xLab u sešny A | 23 199 vzorků, 34 642 △; při 0,25 m 63 392 a 107 106 | dok. `A_STAV.md` | 4/5 |
| světlo | `complex_7` | 151 952 vzorků, 124 světel, stavba vrstev 6,9 až 7,2 s (sandbox) | dok. `A_STAV.md` | 4/5 |
| švy | test `a_17_view` | 128 bodů ve 48 pohledech, nejhorší pohled 21 z 1 049 088; práh 0,01 % obrazu | N-108 | 5/5 |
| formát (fáze 6) | nová pole | `components.place {mount, height, opening, top}`, `PLACE_MOUNTS`, `JOINT_TRAVEL_SECONDS = { button: 0.06, switch: 0.1, lever: 0.25, drawer: 0.5, door: 1, valve: 3, other: 0.5 }`, `interact.seeThrough`, `screen.offset` (u `desk_terminal_01` 0,023), `materials[].opacity`, `portals[].passable` | `formats.js` | 5/5 |
| validátor (fáze 6) | nové kódy | `mat.alphaBoth`, `place.opening`, `place.height`, `interact.seeThrough`; formát zná 8 součástí | `validate.js`, T1 | 5/5 |
| základ (fáze 7) | N-101 | `CYL_SEGMENTS = 16`, `partMesh`, `partTris` (kvádr 12, válec 64), `partCollider` → `{ shape, center }` | `geom.js` | 5/5 |
| xView | po N-101 | 43 volání, 3 112 trojúhelníků (beze změny) | T2 | 5/5 |
| sestavení sešny A | pro Ondřeje z `cc7893f` | `xLab_A02_2026-11-23.html` (4 921 kB, SHA-256 `2cf024f06f84e3c8…`), `xLab_gen_A02_2026-11-23.html` (5 327 kB, `674799dc2d9cf192…`) | dok. `A_STAV.md` | 4/5 |
| xBake u Ondřeje | zapečení xLabu v jeho Chrome | 2,37 s | dok. `B_STAV.md` | 4/5 |
| skill | `xengine` na disku | 15 324 bajtů, čas 2026-11-24 01:06, nové znění | kontejner | 5/5 |
| sešny | adresa mé sešny / sešny B | `session_011CupjaPB9YsvWJHCDQSXiF` / `session_011CupjYAkUYRtTbNAfHf2KJ` (okrajové) | commity | 5/5 |

## 9. Tematický přehled (vrstva 2 – podle témat)

### Základ a větve
- Aktuální stav: základ 2, znění 2: `main` = `zaklad-2` = `integrace-1` = `d2fb217`. Obsahuje sloučenou vlnu 1 (A ve stavu `230b3ee`, B ve stavu `754f46d`), test T5, cíl `xlab_gen`, rozhodnutí D-029 až D-037, nová volitelná pole formátu a N-101.
- Jak jsme k němu došli: znění 2 základu 1 z bundle → `integrace-1` → rozhodnutí → `zaklad-2` (`b12f8ed`) → N-101 a tři rozhodnutí (`cc5078f`) → stav větví (`d2fb217`).
- Otevřené: sešna A si znění 2 ještě nesloučila; práce vlny 2 obou sešen v základu není.

### Zkouška A × B (T5)
- Aktuální stav: trvalý test, zelený v základu i po sloučení nanečisto s oběma větvemi (722 kontrol).
- Jak jsme k němu došli: robot přes vstupy hráče, navigace měřená v Rapieru; tři chyby v navigaci; po prvním dalším sloučení 2 selhání kvůli dvoukřídlým dveřím, opravila sešna B v datech.
- Otevřené: robot běží bez obrazu a chodí nejkratší cestou; halu se dvěma patry a katakomby neprošel celé. Sešna B dál hlídá průchod 0,6 m místo 0,74 m (zbytek B2.1).

### Výkon na T460
- Aktuální stav: rozpočty podle xBench 0.2 (3 běhy); světlo po vrcholech stojí 2,44 ms; hra z vlny 1 drží 60 snímků/s; krok simulace je ve 2 pohledech ze 4 nad mezí 2 ms.
- Jak jsme k němu došli: jeden běh → tři běhy → F3 ve hře.
- Otevřené: sešna A našla příčinu kroku v sandboxu (obal Rapieru prochází tělesa jen po změně, `b77837f`), **číslo z T460 chybí**; `?bench` na T460 nikdo nepustil; postřeh sešny A, že 4 nejtěžší případy xBench vycházejí 22,5 až 25,2 ms (možný strop metody).

### Světlo
- Aktuální stav: v základu je `brushLightMesh` s buňkou 0,5 m dělenou podle délky plochy. Sešna A na své větvi svítí po vrcholech, má zastínění, brány dveří, okraj stínu po podílech (4 × 4 paprsky) a volitelnou mřížku 0,25 m (`?grid=0.25`). Sešna B má xBake (formát `XLV1`), zatím bez bran.
- Jak jsme k němu došli: D-022 (main 01) → měření → N-108 a N-001 → D-035 a D-037.
- Otevřené: **D-037 v základu (další krok)**; sešna A v doplňku N-108 navrhuje pole `env.lightCell` (volitelné, výchozí 0,5) a tentýž údaj v hlavičce zapečeného souboru: nerozhodnuto; `decodeBake` a pravidlo brány do základu při příštím sloučení.

### Návrhy
- Aktuální stav: všech 15 rozhodnuto (N-001 až N-007, N-101 až N-108). Přehled v `docs/navrhy/README.md`.
- Otevřené: oddíl „Rozhodnutí“ v souborech N-001, N-007, N-108 doplnit při sloučení; doplněk N-108 (`env.lightCell`).

### Dluhy základu (pořadí ze `START_SVOD.md`)
1. D-037 mřížka světla; 2. pravidlo validátoru `portal.door.cover` (D-036); 3. N-002 `follow`; 4. `decodeBake` a brána do `src/xspace` (D-035); 5. N-102 `rigCompile`, `rigSolve`; 6. N-105 svítivosti a expozice zlatého vzorku; 7. N-103 varování `rig.noSpeed`; 8. D-030 zmrazit pole N-006; 9. D-032 výsledek zkoušky terminálu; 10. Shell: přenést zkoušky `t2_shell`, `t4_nastaveni_ui` a zkoušku katalogu; 11. xBench: strop 22,5 až 25,2 ms, průhledné plochy, víc textur, interiér s texturou v 1080 řádcích; 12. `REQUIREMENTS.md` a `05_PARITA_2003.md`.

### Sešny A a B (stav jejich větví, mimo základ)
- Sešna A (`3b005a7`): A2.1 světlo po vrcholech hotovo, A2.2 obraz a měření hotovo, A2.3 krok simulace změřen jen v sandboxu, A2.4 dluhy vlny 1 hotovo (D-024, D-025), A2.5 až A2.7 nezačato.
- Sešna B (`64e622b`): B2.1 zčásti, B2.6 xBake hotovo podle vlny 1, proti D-035 neuděláno (brány, `gate`), čtyři vlastní výpočty dílů má nahradit `partMesh` (neuděláno), B2.2 až B2.5 a B2.7 nezačato.
