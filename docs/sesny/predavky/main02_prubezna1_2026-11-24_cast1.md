# Předávka – část 1/3

# Průběžná předávka č. 1 — xEngine, svodná sešna „main 02“ — 2026-11-24

## 0. Hlavička
- Projekt / pracovní linie: xEngine (repo `OndrejKaplan-DRM/xEngine`), svodná sešna „main 02“; chat „Vyvoj xEngine main02 22_11_2026“, https://claude.ai/chat/f52ca96e-1eaa-47d5-9a4c-afe37d4f7f84
- Rozsah sešny: 5 Ondřejových zpráv (2026-11-22 21:01 až 2026-11-24 01:04), 4 moje dlouhé odpovědi, asi 160 volání nástrojů, 28 commitů v `main` od `16548b4` (11 mých, 2 sloučení a 15 převzatých ze sešen), fáze 1–8
- Úplnost: **začátek jen ze souhrnu.** Kontext se zhustil před fází 7. Fáze 1–6 jsou složené ze souhrnu „(ze souhrnu)“, z přepisu chatu přes `read_conversation` „(přepis)“ a z repa „(dok.)“. Výstupy nástrojů z fází 1–6 v přepisu nejsou; čísla beru z dokumentů v repu.
- Navazuje na: předávku sešny main 01 `xEngine_predavka_2026-11-22_cast1.md` a `_cast2.md` (přišly v zipu `xEngine_pro_main02_2026-11-22.zip`, v repu nejsou)

## 1. Cíl, motivace, rámec
- Původní zadání (doslovně, 2026-11-22 21:01): „Jsi svodná sešna projektu xEngine („main 02“), navazuješ na „main 01“. Načti skilly `xengine` a `session-handoff`. […] Připoj repo `OndrejKaplan-DRM/xEngine` s právem zápisu. Je-li `origin/zaklad-1` pořád `a2ce175`, načti znění 2 základu z přílohy: `git fetch <soubor .bundle> main:zneni-2` (hlava `16548b4`). Řiď se `CLAUDE.md`, `docs/00_ZADANI.md` a `docs/sesny/START_SVOD.md`, oddíl „První kroky sešny main 02“. Push větví `zaklad-1`, `main`, `integrace-1` a `zaklad-2` ti povoluji. Projekt v claude.ai je plný: nové dokumenty do něj nezapisuj, stav piš do repa a posílej mi soubory.“
- Proč to Ondřej dělá: staví engine pro 3D z první osoby v prohlížeči, který má běžet na jeho Lenovu T460, a ekosystém nástrojů kolem datového formátu xSpace. Práci dělí mezi tři souběžné sešny (svodná, A = běh, B = obsah a nástroje). Úspěch svodné sešny: sloučit vlnu 1, dokázat, že data sešny B běží v enginu sešny A beze změny kódu, rozhodnout návrhy a dát sešnám jedno znění základu pro vlnu 2.
- Omezení a podmínky (platí dál): push jen větví `zaklad-1`, `main`, `integrace-1`, `zaklad-2`; do projektu v claude.ai nic nového nepsat; stav do repa a soubory Ondřejovi; podsešny jen na výslovnou žádost; do paměti nezapisovat z vlastní iniciativy; Ondřejův e-mail je soukromý; zadání `docs/00_ZADANI.md` mění jen Ondřej (D-028); jeden prohlížeč naráz; čísla o výkonu jen z T460.
- Jak se cíl posunul: původně „první kroky main 02“ (znění 2, sloučení vlny 1, zkouška A × B, rozpočty, návrhy) → od 2026-11-22 23:09 založení `zaklad-2` a zadání vlny 2 → od 2026-11-23 02:26 dluhy základu a rozhodování nových návrhů → od 2026-11-24 01:04 mřížka světla podle D-037 a tato předávka.

## 2. Výchozí stav a vstupy
- GitHub na začátku (ověřeno `git ls-remote`, 2026-11-22 kolem 21:10): `zaklad-1` = `main` = `a2ce175` (znění 1, `npm test` 165 kontrol); `sesna-a` = `7d3bec6` (A1.1 až A1.8; `test:a` 16 sad z 16, 267 kontrol, 186 s); `sesna-b` = `754f46d` (`test:b` 4 sady ze 4, 92 kontrol, 56 s). Žádná sešna nesáhla mimo své složky, sloučení A + B nanečisto bez konfliktu, žádný soubor přes 600 řádků. (přepis)
- Přílohy první zprávy: předávka sešny B (2 soubory), `B_STAV.md`, jeden výsledek xBench 0.2 (JSON) a `xbench_0-2.html` (555 kB). **Chyběl `.bundle`, stavový dokument a předávka main 01.** Projekt „Experiments“, ve kterém chat běží, má jediný dokument „Obecný kontext“. (přepis)
- Přílohy druhé zprávy (21:41): `06_ROZPOCTY.md`, `START_A.md`, dva další běhy xBench 0.2, `xEngine_zaklad1_zneni2_2026-11-22.zip` a `xEngine_pro_main02_2026-11-22.zip` (obsah: `00_CTI_ME.md`, `xEngine_ZADANI_zneni2_2026-11-22.md`, `xEngine_predavka_2026-11-22_cast1.md`, `_cast2.md`, `xengine_zneni2_2026-11-22.bundle`). Rozbaleno do `/home/claude/in/zneni2` a `/home/claude/in/main02`.
- Třetí zpráva (23:09): 4 snímky obrazovky s přehledem F3 ze hry na T460.
- Co jsme na začátku nevěděli: jaký panel má T460 (zjištěno z xBench: 1920 × 1080 při 125 %, tedy 1536 × 864 bodů CSS); jestli hra z vlny 1 udrží 60 snímků (udrží, fáze 6); že krok simulace je na T460 řádově pomalejší než v sandboxu; že sešny budou během integrace commitovat dál.

## 3. Časová osa (vrstva 1 – chronologie)

### Fáze 1 — Start a zjištění, co chybí (2026-11-22 21:01 až asi 21:35) (přepis)
- Spouštěč: Ondřej: „Chápeš všechno? Máš všechny informace? Víš, co děláme, kde jsme a jak navázat?“
- Co jsem udělala: načetla skilly `xengine` a `session-handoff`, připojila repo s právem zápisu, klon do `/home/claude/xengine`, ověřila větve a testy všech tří větví (dvě pracovní kopie `/home/claude/wt-a`, `/home/claude/wt-b`), přečetla dokumenty základu a `A_STAV.md`.
- Výsledek: odpověď „roli chápu, všechny informace nemám“; tabulka chybějících vstupů; první čtení xBench 0.2 z jednoho běhu (interiér 2,41 ms; textura 2,98; vyhlazování 6,8; 1 světlo 4,65; 4 světla 9,85; 8 světel 12,05; fyzikální materiál 22,5; stín 24,6; 800 volání 4,63; 594 tis. △ 6,13; 1,2 mil. △ 14,5). Nic nepushnuto, nic nezměněno.
- Otázky a moje doporučení: 1 (a) bundle přiložit, 2 (a) předávku main 01 přiložit, 3 (b) zkoušku A × B udělat mezitím lokálně.
- Důsledek: Ondřej poslal oba zipy a další měření.

### Fáze 2 — Znění 2 základu na GitHub (2026-11-22 21:41 až 21:42) (přepis, dok.)
- Spouštěč: Ondřej: „Posílám test znovu“.
- Co jsem udělala: ověřila bundle (`git bundle verify`), načetla `main:zneni-2` (hlava `16548b4`), `npm test` 232 kontrol, push `zaklad-1` a `main`.
- Výsledek: `zaklad-1` = `main` = `16548b4`. Znění 2 přineslo `docs/00_ZADANI.md` (Ondřejovo zadání, D-028), rozhodnutí D-022 až D-028 a Shell v `src/shell` (D-006).

### Fáze 3 — Sloučení vlny 1 do `integrace-1` (2026-11-22 21:42 až 21:46) (dok.)
- Co jsem udělala: větev `integrace-1` z `16548b4`; sloučení `sesna-a` ve stavu `230b3ee` (`0161f63`); oprava importů Shellu ze `src/shell` a rozpad velikosti v `a_00_build` (`e13d1fc`); sloučení `sesna-b` ve stavu `754f46d` (`cb7068e`).
- Výsledek: bez konfliktu; skupina A 267 kontrol, skupina B 92.

### Fáze 4 — Zkouška A × B, test T5 (2026-11-22 21:46 až 22:06) (ze souhrnu, dok.)
- Co jsem udělala: napsala robota, který chodí jen vstupy hráče (`test/t5_lib/nav.mjs`, `robot.mjs`, `test/t5_axb.mjs`), a cíl sestavení `xlab_gen` (engine A + `packs/gen_demo`, volba `?level=N|id`) se zkouškou v prohlížeči (`test/t5_axb_view.cjs`). Montáž 12 pohledů z cesty robota.
- Tři chyby cestou: Dijkstra neexpandoval (vzdálenosti ve `Float32Array`); navigace neměla uzly v otvorech (paprsek přesně po společné stěně dvou kvádrů prahu); mřížka 0,1 m nenašla průchod dveřmi se světlostí 0,80 m.
- Výsledek (`e0d3767`): `complex_7` 45 buněk ze 45, cesta 57,9 m, 9 dveří rukou, nejvýš 158 volání kreslení; `complex_21` 39 z 39, 42,5 m, 6 dveří, 105 volání; `catacombs_3` 33 z 33, 28,7 m, 1 dveře, 108 volání; zlatý vzorek 5 z 5, 25,2 m, 1 dveře, 37 volání. Skript `npm run test:axb` (28 + 9 kontrol), `test:all` ho zahrnuje.
- Nálezy pro sešnu B: `door_plank_01` má světlost 0,80 m, kapsle hráče potřebuje 0,74 m; generátor hlídá průchod s poloměrem 0,3 m, hráč má 0,35 m; jeden pohled v `complex_7` je přesvícený (souvisí s N-105).

### Fáze 5 — Rozpočty podle tří běhů xBench 0.2 a první zpráva o integraci (2026-11-22 22:06 až asi 22:20) (dok., přepis)
- Co jsem udělala: uložila tři běhy do `docs/mereni/`, přepsala `docs/06_ROZPOCTY.md` podle nejhoršího mediánu (`8541329`), `STATE.md` (`d2c19aa`). Sešna A mezitím pushla `b0dce2f`; aby další sloučení nemělo konflikt, převzala jsem její znění `test/a_00_build.mjs` a importů v `src/app/main.js` (`0db9773`). Push `integrace-1` = `0db9773`. První celá regrese 628 kontrol.
- Výsledek: zpráva Ondřejovi s montáží a hrou `xEngine_integrace1_xlab_gen.html`. V ní můj odhad: „Engine z vlny 1 svítí po pixelech, takže na T460 nejspíš 60 snímků neudrží. To je odhad z xBench, hru na T460 nikdo neměřil.“
- Otázky a doporučení: 1 `zaklad-2` hned (a) / až po rozhodnutí návrhů (b); 2 převod na světlo po vrcholech je první úkol vlny 2 (a) / počkat s `zaklad-2` (b); 3 zápis o Shellu do `vibe-game-frameworks` ano (a) / později (b). Doporučila jsem 1 (b), 2 (a), 3 (b).

### Fáze 6 — Měření F3, rozhodnutí, `zaklad-2`, zadání vlny 2 (2026-11-22 23:09 až 23:32) (přepis, dok.)
- Spouštěč: Ondřej poslal 4 snímky F3 a odpověděl: „1. […] -> (b) 2. […] ->(a) 3. […] --> (a)“. Ve třetím bodě šel proti mému doporučení.
- Co jsem udělala:
  1. Vyčetla čísla F3 proti kódu přehledu a zapsala `docs/mereni/T460_2026-11-22_xlab_gen_F3.md` (`0c7c662`).
  2. Přečetla 12 návrhů a rozhodla je i rozpory kódu sešny A se zněním 2: D-029 až D-034 (`932caad`). Sedm návrhů promítnuto do `formats.js`, validátoru, T1 a kontraktů.
  3. Zápis o Shellu ve `vibe-game-frameworks`, větev `dev`, commit `3aa13f4` (README, poznámka v `frameworks/02_SHELL_Specifikace.md`, nový `src/shell/README.md`).
  4. Zadání vlny 2 nahoře v `START_A.md` (A2.1 až A2.7) a `START_B.md` (B2.1 až B2.7), `04_SESNY.md`, dluhy základu ve `START_SVOD.md`, oddíl C zadání, pravidla v `CLAUDE.md` (`dd7c359`).
  5. Regrese 633 kontrol, push: `zaklad-2` = `main` = `integrace-1`.
  6. Sloučení nanečisto s čerstvými větvemi sešen (A `5626629`, B `9944620`): 688 kontrol prošlo, 2 selhaly v T5. Zapsáno do `STATE.md` a D-032 s dodatkem (`b12f8ed`).
- Výsledek: `zaklad-2` = `b12f8ed`. Odvolala jsem odhad z fáze 5: „Můj odhad byl špatně.“ Nový nález: krok simulace na T460 nad mezí 2 ms.
- Otázky a doporučení: 1 (a) rozhodnout tři nové návrhy a udělat první dluh základu; 2 (a) navrhnout úpravu skillu hned. Nabídka průběžné předávky zůstala bez odpovědi.

### Fáze 7 — N-101, tři rozhodnutí, znění 2 základu 2, skill (2026-11-23 02:26 až asi 03:00) (v kontextu)
- Spouštěč: Ondřej: „Diky, byli jsme preruseni. Navaz, kde jsi skoncila a pokracuj dal. 1/a 2/a“.
- Co jsem udělala:
  1. N-101: `partMesh`, `partTris`, `partCollider`, `CYL_SEGMENTS` v `src/xspace/geom.js`, export v `index.js`, xView je používá, 5 nových kontrol v T1.
  2. Rozhodnutí D-035 (N-001), D-036 (N-007), D-037 (N-108); dodatky z 23. 11. do `START_A.md` a `START_B.md`; věty do `02_KONTRAKTY.md`; nové pořadí dluhů ve `START_SVOD.md`. Commit `cc5078f` (02:35), push.
  3. Sloučení nanečisto `cc5078f` + `sesna-a` `a1d3081` + `sesna-b` `129318d`: bez konfliktu, 722 kontrol, 0 selhalo. Zapsáno do `STATE.md`, commit `d2fb217` (02:43), push.
  4. Návrh úpravy skillu `xengine` (celé nové znění). První volání nástroj odmítl s tím, že aktuální znění není v konverzaci, a sám ho vypsal; druhé volání se stejným obsahem prošlo.
- Výsledek: `main` = `zaklad-2` = `integrace-1` = `d2fb217`. Odeslány tři soubory.
- Otázky: 1 další krok (a) mřížka světla hned / (b) počkat; 2 průběžná předávka (a) teď / (b) později.

### Fáze 8 — Průběžná předávka a start D-037 (2026-11-24 01:04, běží)
- Spouštěč: Ondřej: „1. […] -->(a) 2. […] -->(a) /session-handoff“.
- Co jsem udělala před psaním: nový `git fetch` a čtení stavů sešen (viz oddíl 9), přepis chatu, kontrola skillu na disku.
- Zjištění: obě sešny skončily 2026-11-23 mezi 03:00 a 05:00. Sešna B si znění 2 (`d2fb217`) sloučila (`8387674`), sešna A ne (stojí na `b12f8ed`). Skill `xengine` je uložený v novém znění (soubor na disku má čas 2026-11-24 01:06 a nový text).
- D-037 v kódu: **zatím nic.** Začínám hned po této předávce; výsledek bude v `docs/STATE.md` a v dodatku na konci části 3 v repu.

## 4. Zvraty a přehodnocení
| # | Původně | Nově | Proč | Kdo / fáze |
|---|---|---|---|---|
| 1 | „Hra z vlny 1 na T460 nejspíš 60 snímků neudrží“ (můj odhad z xBench) | drží 60 ve všech 4 pohledech i s 8 světly po pixelech | Ondřejovy snímky F3 | já, fáze 5 → 6 |
| 2 | mez „≤ 4 dynamická světla“ v rozpočtech | nejvýš 1 efektové světlo po pixelech na stupni `low` | 4 světla v interiéru 10,70 ms proti rozpočtu vykreslení 10 ms | já, fáze 5 |
| 3 | rozdíl xBench 0.1 × 0.2 (4 světla 14,0 → 6,8 ms; 800 volání 7,15 → 4,63 ms) jsem měla za možnou změnu scény | je to rozptyl měření: případy se světly kolísají až o polovinu | tři běhy 0.2 | já, fáze 1 → 5 |
| 4 | doporučila jsem zápis o Shellu odložit (3 b) | Ondřej zvolil (a), provedeno | jeho rozhodnutí | Ondřej, fáze 6 |
| 5 | D-027: ořez pohledem po buňkách přesunut do vlny 2 | zrušeno | sešna A ho dokončila už ve vlně 1 | D-031, fáze 6 |
| 6 | D-032: klidný režim podmíněně, podle zkoušky v Chrome | zastaralo během minut; platí D-024 (zámek kurzoru zůstává) | sešna A ho mezitím postavila (`5626629`); Ondřejova zkouška starého řešení: Esc u terminálu hru shodil do pauzy (dok. `A_STAV.md`) | sešna A, fáze 6 |
| 7 | k selhání T5 jsem napsala „Dveře to nejsou, jejich světlost je 0,90 m“ | dveře to byly, jen jinak: dvoukřídlé dveře nebyly v `portal.door` a robot je neuměl otevřít | oprava sešny B `129318d` | sešna B, fáze 6 → 7 |
| 8 | N-007 bod 2: `portal.door` jako seznam entit | zamítnuto (D-036); sešna B bod ve stejnou dobu sama stáhla | dvě cesty k dvoukřídlým dveřím; N-002 je čistší | já a sešna B, fáze 7 |
| 9 | N-001 bod 5: dveře stíní v klidové poloze | dveře v portálech při zapékání nestíní, světlo zadržuje brána za běhu | Ondřejova volba 2a u sešny A; po otevření má světlo přibýt | D-035, fáze 7 |
| 10 | skill `xengine`: Shell ve `vendor/`, rozpočty jsou odhad | Shell v `src/shell`, rozpočty změřené | znění 2 a měření | fáze 7, uloženo 2026-11-24 |
