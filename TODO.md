# TODO: co se dělá, co čeká, co je hotové

Jediný přehled napříč sešnami. Podrobnosti jsou jinde (odkazy u řádků); tady je jen to, co potřebuješ vědět, než začneš.

**Pravidla souboru** (D-038):
- Každá sešna mění **jen svůj oddíl**. Svodná sešna navíc oddíl „Čeká na Ondřeje“ a hlavičku.
- Aktualizuje se na konci každého kroku spolu s commitem, ne až na konci sešny.
- „Nedávno hotovo“ drží posledních 8 položek; starší jsou v `git log` a v `*_STAV.md`.
- Řádek = jedna věc, kdo, stav, kde je podrobně. Čísla jen změřená, s místem měření.
- Čerstvý oddíl sešny je na její větvi, než se sloučí: `git show origin/sesna-a:TODO.md`, `git show origin/sesna-b:TODO.md`.

**Základ:** `zaklad-2` = `main` = `integrace-1`, základ 2 znění 10 (25. 11. 2026 v noci; vlna 2 sloučená v polovině). Hlavy sešen 25. 11. v 16:25: `sesna-a` = `17b8176` (0:02; základ sloučený naposledy u znění 5), `sesna-b` = `36653bc` (16:20; znění 10 sloučené). Regrese na `main`: 1 000 kontrol, 0 selhalo (`docs/STATE.md`); `npm test` na čistém klonu v 16:25: 357, 0 selhalo.

## Čeká na Ondřeje

Nic.

**Zodpovězeno 25. 11. 2026:** 17:00 svodné (main 04): další krok základu **návrhy sešny B** v pořadí N-015 → N-014 → rozdělit `formats.js` → N-012 (zvuk z Arény i N-105 počkají, až sešna A dožene znění 6 až 10); **zpráva pro sešnu A** připravená svodnou (sešna A stojí od 0:02); „vnitřní kompartmentizace“ prefabů = **obojí**, a) přihrádky a police i b) kresba dřeva (pro sešnu B); body 6/ až 8/ zadání **potvrzené beze změny**. 0:49 svodné: **velikost hry až 80 MB** (D-054, předtím 25 MB); další krok základu **(a) atlas ploch a soubor textury světla (N-112)**. 0:00 svodné: textura světla N-110 **(a) bod 5 cm** (D-050; zapéká xBake, rozhodne zkouška celého `complex_7`); pořadí převzetí z Arény **(a) zbraně, střelba, zoom a výbuchy → zvuk → tvorové** (D-051).

**Zodpovězeno 24. 11. 2026:** 23:57 sešně B: hustota laboratoří stačí (a), další krok zapečení pevných dílů prefabů (b), **hra smí mít až 25 MB** (a), `?bench` nad `complex_7` pustíš (a). 21:13 a 21:20 sešně A: výchozí rozlišení **(a) zůstává 768 řádků** (`complex_7` na 1 080 řádcích 95 % 10,2 ms); dva běhy s texturami: textury barvy na T460 únosné (`A_STAV.md`, oddíl 5). 23:38 svodné: kód staré hry **(a) jen Aréna v2** z GitHubu (`OndrejKaplan-DRM/Arena`, připojit jen pro čtení, sepsat co převzít); další krok **(b) N-102** (kostry bez alokací), N-010 až potom. 21:19 svodné: další krok **(a) pravidlo zakrytí dveří a svázané klouby**; černá obrazovka byl **omyl** (snímek poslaný omylem, uzavřeno). 19:57 svodné: sloučit vlnu 2 do základu **teď (a)**; `?bench` pustíš **(a)**; otázce na černou obrazovku jsi nerozuměl (přeformulováno výše). 19:49 sešně A: zorné pole **(a) použitelné**, terminál po Esc **(a) funguje**, černé boky bez přímého světla **(a) počkat na odražené světlo ze zapečeného souboru**; poslal tři běhy `?bench` (`A_STAV.md`, oddíl 5.1). 02:26 sešně A: nejdřív A2.5 a A2.6, textura světla potom; dveře od hráče do dat. 02:04 sešně B: mez 8 GB, nejdřív xSearcher a textury, náhled zapečení počká.

## Svodná sešna (základ)

Podrobně: `docs/STATE.md`, dluhy a pořadí `docs/sesny/START_SVOD.md`, rozhodnutí `docs/DECISIONS.md`.

**Hotovo v noci (main 03, 24. 11.):**
- [x] pravidlo validátoru `portal.door.cover` (D-036); zlatý vzorek bez škvíry u dveří
- [x] svázané klouby `follow` a `jointFollow` (N-002)
- [x] regrese na `main` 923 kontrol, 0 selhalo; `STATE.md` znění 6; dodatky pro A a B

**Hotovo dnes večer (main 03, 24. 11.):**
- [x] vlna 2 sloučená do základu na Ondřejovo slovo (D-048): A do `85d6a6d`, B do `ba16d8d`; 909 kontrol, 0 selhalo
- [x] dveře zlatého vzorku na obě strany ±105° (N-109)
- [x] N-009 přijat: pole `albedoMean` (D-045); N-111 přijat: soubory balíku v sestavení, `materialFrom`, kontrola textur ve validátoru (D-046)
- [x] D-047 světlo za dveřmi se `seeThrough`, D-049 okolní světlo jako osvětlení E
- [x] regrese na `main` 913 kontrol, 0 selhalo; `STATE.md` znění 5; architektura podle sešny A; oddíly „Rozhodnutí“ v návrzích; dodatky pro A a B

**Hotovo dnes odpoledne:** `TODO.md` a mapa v `CLAUDE.md` (D-038); měření F3 z 24. 11.; D-039 až D-044; `body.js`, `samples.js`, `bake.js`.

**Čeká na sešny:** A dělí okolní světlo π (D-049) → potom svodná vynásobí okolní světlo zlatého vzorku π; A zapojí svázané klouby a zkompilovanou kostru v kroku (`rigCompile` / `rigFollow` / `rigSolve`, dodatek znění 7). B zapisuje `albedoMean`, zapéká pevné díly prefabů (D-041), dvoukřídlé dveře jako jeden prefab bez `seeThrough` (N-002). Pořadí N-010: nejdřív A vybírá interakci přes `interactionOf`, potom B vrátí kartotéku a stůl do jednoho prefabu. Zkouška zbraní: A3.1 (sešna A) a B3.1 (sešna B), dodatky znění 9.

- [x] N-102 kostry bez alokací (`rigCompile`, `rigValues`, `rigFollow`, `rigSolve`; T1b; regrese 926 kontrol, 0 selhalo)

- [x] soupis převzetí z Arény v2 (`docs/prevzeti/ARENA.md`: co komu, co chybí ve formátu, co nepřebírat, pořadí)

- [x] N-010 víc interakcí v prefabu (D-052, `src/xspace/interact.js`, T1c; regrese 953 kontrol, 0 selhalo)

- [x] zkušební formát zbraní a munice, události boje, plazmová puška ve zlatém vzorku (N-201, D-053, T1d; regrese 984 kontrol, 0 selhalo)

- [x] atlas ploch a soubor textury světla (N-112, D-055, `atlas.js`, `lightmap.js`, T1e; regrese 1 000 kontrol, 0 selhalo)

**Předávka main 03:** `docs/sesny/predavky/main03_predavka_2026-11-25.md` (25. 11. 1:04). **Teď:** čeká na sešny: zkouška zbraní (A3.1, B3.1) a zkouška textury světla na celém `complex_7` (B zapeče, A přečte a změří); potom zmrazit oba zkušební formáty (D-030). Mezitím zvuk z Arény (Z-2, D-051).

**Další na řadě:** svítivosti zlatého vzorku (N-105) → `rig.noSpeed` (N-103) → zmrazit pole N-006 (D-030) → zkoušky Shellu → xBench (strop 22,5 až 25,2 ms) → `REQUIREMENTS.md` a `05_PARITA_2003.md` → úprava skillu `xengine` po sloučení.

## Sešna A (běh)

Podrobně: `docs/sesny/A_STAV.md` na větvi `sesna-a` (oddíl 1 „Kde jsme“, oddíl 2 deník rozhodnutí sešny A), zadání `docs/sesny/START_A.md`.

**Teď (fronta podle Ondřeje 25. 11. 17:25):**
- [x] sloučeno znění 10 základu (`b852756`): `npm test` 377, `test:a` 430, `test:axb` 37, 0 selhalo
- [ ] D-049 okolní světlo / π → [ ] N-010 interakce v běhu (B čeká s kartotékou a stolem) → [ ] A3.1 plazmová puška + `xlab.html` (s opravou `?bench` podle N-011) → [ ] kostra v kroku (N-102) → [ ] sklo N-013 → [ ] textura světla XLM1 (až B dodá `complex_7`)
- N-011 a N-013 (návrhy sešny B) přijaté, rozhodnutí v `A_STAV.md`, oddíl 1

**Čeká na jiné:** sešna B: zapečený `complex_7` se souborem XLM1 (pro bod 6).

**Nedávno hotovo:**
- 24. 11. N-110 zkouška: textura světla 5 / 10 cm na hale xLabu (`a_43_*`); sandbox 16 / 4 MB, 3,9 až 5,4 / 1,2 až 1,7 s
- 24. 11. znění 4: zapečené světlo v běhu (`a_44_bake`), strop řádků, rozměry postavy, zkoušky dveří na ±105°
- 24. 11. A2.6 na zkušebních datech: `glb.js`, `assets.js`, textura v `materials.js` (`6e1ab0c`, `3c6bab0`); testy `a_26_mesh` (30), `a_26_view` (8)
- 24. 11. A2.5 nová pole: rychlost kloubu ze základu, `screen.offset`, `seeThrough`, `passable`, `opacity` (sklo průhledné, nestíní světlo)
- 24. 11. snímek z T460 (`complex_7`): „Dveře od hráče“ jen v otvoru portálu, ne dvířka nábytku (`afb5b0a`); černý bok kartotéky = chybí odražené světlo
- 24. 11. zorné pole: číslo z nastavení je vodorovný úhel při 4 : 3, strop 120°; na T460 F3 ukazuje 117° × 74° při 90 (`db6fad0`)
- 24. 11. `?bench` měří čas grafiky dávkou (`draw.ms`); stará metoda na T460 vracela obnovu displeje
- 24. 11. sloučeno znění 3 základu (D-037), vlastní kopie dílů prefabů zrušena; švy 128 → 0 (`25e17a4`)

## Sešna B (obsah a nástroje)

Podrobně: `docs/sesny/B_STAV.md` na větvi `sesna-b`, zadání `docs/sesny/START_B.md`. Vede sešna B.

**Teď** (Ondřej 24. 11. 19:55: 1 a, 2 a, 3 a a k tomu „více těles, více prefabů, bohatší tvary…, spodní šuplíky nezávisle, realističtější dřevo“):
1. dodatek znění 4: `BODY` a `decodeBake` ze základu, xBake zapeče i pevné díly prefabů (D-041)
2. barvy materiálů k albedu skutečných povrchů, expozice v generovaných levelech (Ondřejova volba 1 a)
3. tvary ze sítí `.glb` z kódu (zkosení, zaoblení, římsy, výplně, mezery, vyboulení, nepravidelnosti); přestavba nejviditelnějších prefabů a nové prefaby
4. šuplíky nezávisle: samostatné entity a návrh na víc interakcí v jednom prefabu; duté šuplíky
5. dřevo se suky, trhlinami a letokruhy

**Potom:** B2.5 (dveře ze sítě pro sešnu A, D-030) · zbytek B2.2 (`components.place`, `opacity`, `passable`, `seeThrough` u mříže, `speed`) · B2.7.

**Čeká na jiné:** N-009 barva materiálu s texturou (svodná; týká se A2.6) · N-002 jeden prefab dvoukřídlých dveří · N-110 až po zkoušce sešny A.

**Nedávno hotovo:**
- 24. 11. B2.4 textury: 21 materiálů `kit_base` s `albedo`, `normal`, `uvScale` (30 souborů WebP 512 px, 1 287,4 kB), galerie se třemi pohledy, návrh N-009 (`7204c2d`, `951044a`, `70d2473`)
- 24. 11. B2.3 xSearcher: hledání a příjem textur CC0 z Poly Haven a ambientCG do `packs/_inbox`; 19 textur v příjmu; test bez sítě 47 kontrol (`5828344`, `24e2358`)
- 24. 11. xBake nad mřížkou D-037; brány dveří, stínění kolizemi, okraj stínu po podílech (`3d1aa2a`, `7dd9cd2`, `9d34aa6`)
- 24. 11. B2.1 průchodnost pro hráče 0,74 m, světlost dveří (`d2e1481`)
- 24. 11. regrese po B2.4: `npm test` 254, `npm run test:b` 201, `npm run test:axb` 37, 0 selhalo (`951044a`, sandbox)
