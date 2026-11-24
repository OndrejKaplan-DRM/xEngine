# TODO: co se dělá, co čeká, co je hotové

Jediný přehled napříč sešnami. Podrobnosti jsou jinde (odkazy u řádků); tady je jen to, co potřebuješ vědět, než začneš.

**Pravidla souboru** (D-038):
- Každá sešna mění **jen svůj oddíl**. Svodná sešna navíc oddíl „Čeká na Ondřeje“ a hlavičku.
- Aktualizuje se na konci každého kroku spolu s commitem, ne až na konci sešny.
- „Nedávno hotovo“ drží posledních 8 položek; starší jsou v `git log` a v `*_STAV.md`.
- Řádek = jedna věc, kdo, stav, kde je podrobně. Čísla jen změřená, s místem měření.
- Čerstvý oddíl sešny je na její větvi, než se sloučí: `git show origin/sesna-a:TODO.md`, `git show origin/sesna-b:TODO.md`.

**Základ:** `zaklad-2` = `main` = `integrace-1`, základ 2 znění 6 (24. 11. 2026 v noci; vlna 2 sloučená v polovině). Hlavy sešen ve 20:20: `sesna-a` = `3250dd6`, `sesna-b` = `5e03d87` (obě bez konfliktu se základem). Regrese na `main`: 923 kontrol, 0 selhalo (`docs/STATE.md`).

## Čeká na Ondřeje

| # | Co | Ptá se | Od | Podrobně |
|---|---|---|---|---|
| 1 | Dva běhy `?bench` ve sestavení sešny A „krok 5“, na síti a s vypnutou Úsporou energie v Chrome (večerní běhy měly 30 snímků/s): `xlab_tex.html?bench&tex=0` (cena textur) a `xlab_gen.html?bench&rows=1080` (výchozí 1 080 řádků pro velký level) | sešna A | 24. 11. 19:51 | `A_STAV.md`, oddíl 1 |
| 2 | Potvrdit nebo přepsat body 6/ až 8/ zadání (sestavila je svodná sešna z tvých vět) | svodná | 22. 11. | `docs/00_ZADANI.md`, oddíl B |

**Zodpovězeno 24. 11. 2026:** 21:19 svodné: další krok **(a) pravidlo zakrytí dveří a svázané klouby**; černá obrazovka byl **omyl** (snímek poslaný omylem, uzavřeno). 19:57 svodné: sloučit vlnu 2 do základu **teď (a)**; `?bench` pustíš **(a)**; otázce na černou obrazovku jsi nerozuměl (přeformulováno výše). 19:49 sešně A: zorné pole **(a) použitelné**, terminál po Esc **(a) funguje**, černé boky bez přímého světla **(a) počkat na odražené světlo ze zapečeného souboru**; poslal tři běhy `?bench` (`A_STAV.md`, oddíl 5.1). 02:26 sešně A: nejdřív A2.5 a A2.6, textura světla potom; dveře od hráče do dat. 02:04 sešně B: mez 8 GB, nejdřív xSearcher a textury, náhled zapečení počká.

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

**Čeká na sešny:** A dělí okolní světlo π (D-049) → potom svodná vynásobí okolní světlo zlatého vzorku π; A zapojí `jointFollow` v enginu. B zapisuje `albedoMean`, zapéká pevné díly prefabů (D-041), dvoukřídlé dveře jako jeden prefab bez `seeThrough` (N-002).

**Další na řadě:** rozhodnout N-010 (víc interakcí v prefabu; sešna B dělá ~600 těles, každý den zpoždění je předělávka) → `rigCompile`, `rigSolve` (N-102) → svítivosti zlatého vzorku (N-105) → `rig.noSpeed` (N-103) → zmrazit pole N-006 (D-030) → zkoušky Shellu → xBench (strop 22,5 až 25,2 ms) → `REQUIREMENTS.md` a `05_PARITA_2003.md` → úprava skillu `xengine` po sloučení.

## Sešna A (běh)

Podrobně: `docs/sesny/A_STAV.md` na větvi `sesna-a` (oddíl 1 „Kde jsme“, oddíl 2 deník rozhodnutí sešny A), zadání `docs/sesny/START_A.md`.

**Teď (24. 11. večer):**
- [x] A2.5 nová pole základu
- [x] A2.6 na zkušebních datech: díl `.glb`, kolize `hull` / `mesh`, textura barvy (na T460 nejvýš 512 px), světlo texturu násobí; T460: 14 textur v xLabu, vykreslení 2,29 / 2,9 ms (medián / 95 %, `?bench` 24. 11. 19:39)
- [ ] sloučit znění 4 základu 2 a dodatek: D-039 strop řádků, testy nezávislé na rozsahu dveří zlatého vzorku (D-042), rozměry postavy z `body.js` (D-040), pořadí vzorků `levelSamples` (D-041), **čtení zapečeného světla `bake.js` (D-044)**: odstraní 54 s stavby světla v `complex_7` a přinese odražené světlo (Ondřej 19:49: černé boky řešit tímhle)
- [ ] A2.6 na kusu ze sešny B: potřebuje B2.5 a návrh **N-111**

**Potom:** zkouška textury světla na hale xLabu s bodem 5 i 10 cm (N-110, D-043) → výchozí 1 080 řádků, pokud `complex_7` na T460 vyjde do 10 ms (xLab: 95 % 7,38 ms).

**Čeká na jiné:** svodná rozhoduje N-109, N-110, **N-111** a jestli světlo prochází dveřmi se `seeThrough`; sešna B dveře na obě strany v datech (N-109), B2.5 (u dílů `mesh` vyplňovat `mat`, velké plochy modelu dělit asi po 0,5 m kvůli světlu po vrcholech), chybějící pole v `kit_base` (`screen.offset` u terminálů, `opacity` u `glass_pane`).

**Nedávno hotovo:**
- 24. 11. A2.6 na zkušebních datech: `glb.js`, `assets.js`, textura v `materials.js` (`6e1ab0c`, `3c6bab0`); testy `a_26_mesh` (30), `a_26_view` (8)
- 24. 11. A2.5 nová pole: rychlost kloubu ze základu, `screen.offset`, `seeThrough`, `passable`, `opacity` (sklo průhledné, nestíní světlo)
- 24. 11. snímek z T460 (`complex_7`): „Dveře od hráče“ jen v otvoru portálu, ne dvířka nábytku (`afb5b0a`); černý bok kartotéky = chybí odražené světlo
- 24. 11. zorné pole: číslo z nastavení je vodorovný úhel při 4 : 3, strop 120°; na T460 F3 ukazuje 117° × 74° při 90 (`db6fad0`)
- 24. 11. `?bench` měří čas grafiky dávkou (`draw.ms`); stará metoda na T460 vracela obnovu displeje
- 24. 11. sloučeno znění 3 základu (D-037), vlastní kopie dílů prefabů zrušena; švy 128 → 0 (`25e17a4`)
- 24. 11. zkouška terminálu na T460 prošla (D-032)
- 23. 11. A2.3 krok fyziky: na T460 medián 0,55 až 0,68 ms, dřív až 3,10 ms (`b77837f`)

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
