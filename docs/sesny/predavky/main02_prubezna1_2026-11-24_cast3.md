# Předávka – část 3/3

Průběžná předávka č. 1 — xEngine, svodná sešna „main 02“ — 2026-11-24 (dokončení)

## 10. Co rezonovalo
- Ondřej odpovídá jen na otázky a/b a vždy krátce. Ve fázi 6 šel jednou proti doporučení (zápis o Shellu hned). Na nabídku předávky z 2026-11-22 neodpověděl; přijal ji až jako otázku a/b 2026-11-24.
- Posílá měření a snímky sám od sebe (xBench třikrát, F3 čtyři pohledy). Čísla z jeho stroje jsou pro něj argument, odhady ne.
- U sešen: chce herní vzhled, ne čistý vzhled z kvádrů („příliš sterilní“, dok.); chce jemnější stíny už teď (dok.); zavřenými dveřmi světlo nemá procházet (dok.).
- Forma: tabulky, krátké odstavce, oddíl „Co jsem neudělala“, hotová věta ke zkopírování pro sešny A a B. V této sešně použil příkaz `/session-handoff`, jiná makra (#…) ne.

## 11. Výstupy a kde jsou
- Repo `OndrejKaplan-DRM/xEngine`, větev `zaklad-2` (= `main` = `integrace-1`): všechno podstatné. `docs/STATE.md`, `docs/DECISIONS.md` (D-029 až D-037), `docs/navrhy/README.md`, `docs/06_ROZPOCTY.md`, `docs/mereni/` (3 běhy xBench 0.2 a `T460_2026-11-22_xlab_gen_F3.md`), `docs/sesny/START_A.md`, `START_B.md`, `START_SVOD.md`, `test/t5_*`, `tools/xlab_gen/`.
- Tato předávka: `docs/sesny/predavky/main02_prubezna1_2026-11-24_cast1.md`, `_cast2.md`, `_cast3.md`.
- Repo `vibe-game-frameworks`, větev `dev`, `3aa13f4`: zápis, že Shell má domov v xEngine.
- Soubory poslané Ondřejovi do chatu (kopie v `/home/claude/out`): `xEngine_integrace1_AxB_montaz.jpg`, `xEngine_integrace1_xlab_gen.html`, `xEngine_STATE_2026-11-22_integrace1.md`, `xEngine_06_ROZPOCTY_2026-11-22.md` (fáze 5); `xEngine_STATE_2026-11-22_zaklad2.md`, `xEngine_navrhy_rozhodnuti_2026-11-22.md`, `xEngine_START_A_vlna2.md`, `xEngine_START_B_vlna2.md` (fáze 6); `xEngine_STATE_2026-11-23.md`, `xEngine_rozhodnuti_D-035_az_D-037.md`, `xEngine_navrhy_prehled_2026-11-23.md` (fáze 7).
- Skill `xengine`: nové znění uložené v Ondřejově účtu.
- Projektové dokumenty v claude.ai: nic (projekt je plný, nepíšu do něj).
- Jen v kontejneru – po sešně ztraceno: `/home/claude/scratch/navdbg.mjs`, `navdbg2.mjs` (ladění navigace), `montage.py` (montáž snímků), `xb.py` (tabulka běhů xBench), `/home/claude/scratch/ho/extract.py` (výtah z přepisu chatu). Všechno jednorázové (okrajové). Vstupy v `/home/claude/in` má Ondřej jako přílohy.

## 12. Ověřeno / neověřeno
- Ověřeno: hlavy větví na GitHubu — `git fetch` 2026-11-24 01:10.
- Ověřeno: `cc5078f` projde celou regresí (638 kontrol) — `npm run test:all` 2026-11-23.
- Ověřeno: nový základ + obě větve sešen jdou sloučit bez konfliktu a projdou (722 kontrol) — sloučení nanečisto na dočasné místní větvi 2026-11-23, nic z toho nepushnuto. Platí pro `a1d3081` a `129318d`, ne pro dnešní hlavy.
- Ověřeno: xView kreslí po N-101 stejně (43 volání, 3 112 trojúhelníků) — T2.
- Ověřeno: skill je uložený — čtení souboru na disku 2026-11-24.
- Neověřeno: sloučení dnešních hlav `3b005a7` a `64e622b` se základem — nepouštěla jsem.
- Neověřeno: čísla sešny A z vlny 2 (krok fyziky po úpravě, cena mřížky 0,25 m) na T460 — nikdo neměřil.
- Neověřeno: jak se hra chová za pohybu, v hale se dvěma patry a v katakombách — F3 jsou 4 stojící pohledy.
- Neověřeno: výsledek zkoušky terminálu v novém sestavení sešny A (D-024) — čeká na Ondřeje.
- Limit: fáze 1 až 6 znám ze souhrnu, přepisu a repa, ne z vlastního kontextu.

## 13. Rozpracované, čeká na koho, otevřené otázky
| Co | Stav | Čeká na | Od kdy |
|---|---|---|---|
| D-037 mřížka světla v základu | schváleno, v kódu nic | mě (hned po předávce) | 2026-11-24 |
| sloučení znění 2 do `sesna-a` | sešna A stojí na `b12f8ed` | sešnu A | 2026-11-23 |
| `?bench` a F3 nového sestavení na T460 (krok fyziky, 1080 řádků) | sestavení `xLab_gen_A02_2026-11-23.html` existuje | Ondřeje | 2026-11-23 |
| zkouška terminálu podle D-024 | nové řešení v sestavení A02 | Ondřeje | 2026-11-23 |
| 4 otázky sešny A (terminál a Esc; hrubost stínů; co dřív; výchozí rozlišení) | otázka 2 zodpovězena („jemnější už teď“), ostatní podle `A_STAV.md` | Ondřeje | 2026-11-22 |
| otázky sešny B 1, 2, 3, 5 (směr vzhledu; cizí modely; kde vidět herní vzhled poprvé; cílový silnější stroj) | otevřené | Ondřeje | 2026-11-22 |
| pole `env.lightCell` (doplněk N-108) | nerozhodnuto | mě; má smysl rozhodnout spolu s D-037 | 2026-11-23 |
| oddíl „Rozhodnutí“ v N-001, N-007, N-108 | soubory jen na větvích sešen | příští sloučení | 2026-11-23 |
| potvrzení bodů 6/ až 8/ zadání (oddíl C) | zapsáno, nepotvrzeno | Ondřeje | 2026-11-22 |
| ostatní dluhy základu 2 až 12 | viz oddíl 9 | mě, bez pokynu nezačínat | 2026-11-22 |
| nový balík pro sešny (bundle, startovní zprávy) | neuděláno | pokyn | 2026-11-22 |

- Otevřené otázky pro Ondřeje: žádná nová; viz tabulka.

## 14. Pasti a know-how
- **Sešny commitují po minutách.** Před každým slučováním a psaním stavu `git fetch` a `git ls-remote`. Podmíněné rozhodnutí (D-032) zastaralo dřív, než jsem ho pushla.
- **Sloučení nanečisto** dělat na dočasné místní větvi (`git checkout -B zkouska main`, sloučit `origin/sesna-a` a `origin/sesna-b`, `npm install`, `npm run test:all`), potom větev smazat. Celá regrese trvá několik minut (přesně jsem ji neměřila); pouštět na pozadí bez `&` a číst log.
- **Soubory návrhů leží na větvi sešny.** Rozhodnutí patří do `DECISIONS.md` a `docs/navrhy/README.md`; do souboru návrhu až po sloučení. Sešnám to sdělit dodatkem nahoře v jejich `START_*.md`.
- **Znění základu se posouvá commity přímo na `zaklad-2`, i když jde jen o dokumenty.** Sešny si ho berou `git merge origin/zaklad-2`; hash ve `STATE.md` nikdy neukazuje na vlastní commit (dnes: kód `cc5078f`, hlava `d2fb217`).
- **Pevné počty v testech** rozbila i moje změna formátu (T1: „formát zná 7 součástí“ → 8).
- **`checkPackDir` vrací `{ pack, res }`**, ne výsledek přímo.
- **Paprsky v Rapieru:** z bodu na ploše kvádru vrací zásah ve vzdálenosti 0; po společné stěně dvou kvádrů mine oba. Vzorky posouvat o milimetry.
- **F3 není čas snímku.** `frameMs` a `stepMs` jsou klouzavé průměry času procesoru (váha 5 %); grafiku neměří. Čas kroku ze sandboxu (0,13 až 0,17 ms) na T460 neplatí (0,64 až 3,50 ms).
- **xBench kolísá** u případů se světly až o polovinu; rozpočet stavět na nejhorším ze tří běhů.
- **`propose_skills` u úpravy** napoprvé odmítne, když aktuální `SKILL.md` není v konverzaci, a vypíše ho; stačí zavolat znovu s úplným zněním.
- **Přepis chatu** (`read_conversation`, `conversation_id: "current"`): 9 obratů; dlouhé obraty asistenta se uloží do souboru (67 až 98 kB), první obrat přišel přímo do kontextu (asi 6 tisíc tokenů). Výstupy nástrojů v něm nejsou.
- **Projekt je plný:** předávky svodné sešny patří do repa (`docs/sesny/predavky/`) a jako soubory Ondřejovi.
- **Push a připojení repa** chtějí Ondřejovo výslovné slovo ve zprávě; povolení z 2026-11-22 platí pro 4 jmenované větve.

## 15. Navázání
- Další krok: D-037 v základu. `brushLightMesh` s vnitřními vrcholy na násobcích `LIGHT_CELL` ve světových souřadnicích; funkce nad celým levelem, která vynechá plochy schované celé v jiném kvádru; T1 (počty zlatého vzorku 20 658 a 32 386 se změní); xView; sloučení nanečisto s oběma větvemi sešen a zápis, co se u nich změnou rozbije; dodatky do `START_A.md` a `START_B.md`; `STATE.md`; commit a push. Potom změřit švy (test `a_17_view` je v oblasti sešny A, pouští se po sloučení nanečisto).
- Skilly k načtení: `xengine` (nové znění; rozcestník a pasti), `session-handoff` (tato předávka), při práci s testy v prohlížeči `headless-webgl-testing`.
- Startovní prompt pro novou sešnu (ke zkopírování):
  > Jsi svodná sešna projektu xEngine („main 03“), navazuješ na „main 02“. Načti skilly `xengine` a `session-handoff`. Připoj repo `OndrejKaplan-DRM/xEngine` s právem zápisu a přečti celé `docs/sesny/predavky/main02_prubezna1_2026-11-24_cast1.md`, `_cast2.md` a `_cast3.md` (i s dodatkem na konci části 3), potom `CLAUDE.md`, `docs/00_ZADANI.md`, `docs/STATE.md` a `docs/sesny/START_SVOD.md`. Před čímkoli dalším `git fetch` a zjisti hlavy větví. Push větví `main`, `zaklad-2` a `integrace-1` ti povoluji. Projekt v claude.ai je plný: nic do něj nepiš, stav piš do repa a posílej mi soubory. Řekni mi v 8 řádcích, kde jsme, a navrhni další krok.

## Dodatek po průběžné předávce č. 1 (2026-11-24, D-037 provedeno)

Psáno po odeslání tří částí do chatu; v chatu tento dodatek není.

- **D-037 je v základu** (`a37bd48`, `3380bf2`): `brushLightMesh(b, cell, skip)` s vrcholy na násobcích buňky ve světě, `brushHiddenFaces`, `levelLightMeshes` (definice vzorků levelu), strop dílků hrany 256 místo 64, nástroj `tools/light-stat.mjs`. T1 má 140 kontrol, základ 254, celá regrese základu 650, 0 selhalo.
- **Změřeno:** švy na zlatém vzorku 128 → 0 bodů (`a_17_view` sešny A po sloučení nanečisto); T-spoje xLab 1 321 → 139, `catacombs_3` 5 422 → 1 278, `complex_21` 7 727 → 1 534, `complex_7` 9 500 → 2 000; vzorky xLab 20 658 → 20 509, `catacombs_3` 39 136 → 35 352, `complex_21` 64 393 → 61 075, `complex_7` 73 092 → 65 618. Varianta (b) není potřeba.
- **Zvrat:** D-037 čekalo úsporu třetiny až poloviny vzorků; celé schované plochy jich nesou jen 4 až 22 % a samo zarovnání vzorky přidává (+3,7 až +15 %).
- **Slepá ulička:** se stropem 64 dílků se při buňce 0,25 m plochy delší než 16 m dělily po 0,5 m; test sešny A `a_18_soft` na tom ve zkoušce selhal (24 009 → 50 450 vzorků). Po zvýšení stropu prochází (24 009 → 75 418).
- **Sloučení nanečisto** (`3380bf2` + `3b005a7` + `64e622b`): základ 254, A 21 sad z 21 (336), A × B 28 + 9, B 5 sad ze 6. Selže `b_t6_bake_nahled`: počet vzorků xLabu natvrdo (20 658).
- **Čeká:** sešny A a B mají přejít na `levelLightMeshes` (dodatky z 24. 11. v `START_A.md` a `START_B.md`); `env.lightCell` nerozhodnuto, čeká na `?bench` s `grid=0.25` z T460.
- **Poznatek pro skill `xengine`:** věta „Mřížka vzorků se změní (D-037)“ už neplatí; vzorky levelu definuje `levelLightMeshes`. Upravit při příští úpravě skillu.
- Pomocné skripty měření v `/home/claude/scratch/d037` (stará funkce z `d2fb217` pro sloupec „dřív“) jsou jen v kontejneru.
