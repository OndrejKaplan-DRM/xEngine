# TODO: co se dělá, co čeká, co je hotové

Jediný přehled napříč sešnami. Podrobnosti jsou jinde (odkazy u řádků); tady je jen to, co potřebuješ vědět, než začneš.

**Pravidla souboru** (D-038):
- Každá sešna mění **jen svůj oddíl**. Svodná sešna navíc oddíl „Čeká na Ondřeje“ a hlavičku.
- Aktualizuje se na konci každého kroku spolu s commitem, ne až na konci sešny.
- „Nedávno hotovo“ drží posledních 8 položek; starší jsou v `git log` a v `*_STAV.md`.
- Řádek = jedna věc, kdo, stav, kde je podrobně. Čísla jen změřená, s místem měření.
- Čerstvý oddíl sešny je na její větvi, než se sloučí: `git show origin/sesna-a:TODO.md`, `git show origin/sesna-b:TODO.md`.

**Základ:** `zaklad-2` = `main` = `integrace-1`, základ 2 znění 4 (24. 11. 2026). Hlavy sešen v 16:33: `sesna-a` = `c7a2a64`, `sesna-b` = `4aeeeb4`. Regrese: `main` 662 kontrol, sloučení nanečisto s oběma sešnami 855, 0 selhalo (`docs/STATE.md`).

## Čeká na Ondřeje

| # | Co | Ptá se | Od | Podrobně |
|---|---|---|---|---|
| 1 | Dva běhy `?bench` ve sestavení sešny A „krok 5“, na síti a s vypnutou Úsporou energie v Chrome (večerní běhy měly 30 snímků/s): `xlab_tex.html?bench&tex=0` (cena textur) a `xlab_gen.html?bench&rows=1080` (výchozí 1 080 řádků pro velký level) | sešna A | 24. 11. 19:51 | `A_STAV.md`, oddíl 1 |
| 2 | Černá obrazovka na snímku 3 z 24. 11. 01:42 (celé okno hry černé, bez přehledu F3): jen chvilka, nebo zůstala? | svodná | 24. 11. | `docs/mereni/T460_2026-11-24_D-037_F3.md` |
| 3 | Potvrdit nebo přepsat body 6/ až 8/ zadání (sestavila je svodná sešna z tvých vět) | svodná | 22. 11. | `docs/00_ZADANI.md`, oddíl B |

**Zodpovězeno 24. 11. 2026:** 19:57 svodné: sloučit vlnu 2 do základu **teď (a)**; `?bench` pustíš **(a)**; otázce na černou obrazovku jsi nerozuměl (přeformulováno výše). 19:49 sešně A: zorné pole **(a) použitelné**, terminál po Esc **(a) funguje**, černé boky bez přímého světla **(a) počkat na odražené světlo ze zapečeného souboru**; poslal tři běhy `?bench` (`A_STAV.md`, oddíl 5.1). 02:26 sešně A: nejdřív A2.5 a A2.6, textura světla potom; dveře od hráče do dat. 02:04 sešně B: mez 8 GB, nejdřív xSearcher a textury, náhled zapečení počká.

## Svodná sešna (základ)

Podrobně: `docs/STATE.md`, dluhy a pořadí `docs/sesny/START_SVOD.md`, rozhodnutí `docs/DECISIONS.md`.

**Hotovo dnes (main 03, 24. 11.):**
- [x] paměť projektu v repu: tento soubor, mapa v `CLAUDE.md`, moduly v `docs/01_ARCHITEKTURA.md` (D-038)
- [x] měření z tvých snímků F3 z 24. 11.: `docs/mereni/T460_2026-11-24_D-037_F3.md`
- [x] rozhodnuto: D-039 řádky podle okna; D-040 N-008 přijat; D-041 vzorky i z pevných dílů prefabů; D-042 N-109 přijat; D-043 N-110 jako směr se zkouškou 5 a 10 cm, `env.lightCell` zamítnuto; D-044 brána jako seznam a `doors` v hlavičce přijaty, čtení souboru do základu
- [x] základ: `src/xspace/body.js` (N-008) a varování `portal.narrow`; `src/xspace/samples.js` (`levelSamples`); `src/xspace/bake.js` (`decodeBake`, `composeColors`, `gateLevel`, `doorOpenness`)
- [x] věty do `02_KONTRAKTY.md`: vzorky (D-041), soubor světla (D-044), dveře na obě strany (D-042)
- [ ] zlatý vzorek: `door_hinged_01` na obě strany (N-109) **čeká na sešnu A**: 8 jejích kontrol počítá s jednostrannými dveřmi
- [x] celá regrese po skupinách a sloučení nanečisto s hlavami sešen (855 kontrol, 0 selhalo); `STATE.md` znění 4; dodatky nahoře ve `START_A.md` a `START_B.md`

**Čeká na sešny:** A upraví testy jednostranných dveří (potom přepnu zlatý vzorek na ±105°), převezme `BODY` a `levelSamples`, strop řádků (D-039). B vyřeší srážku `TODO.md` a `CLAUDE.md` verzí základu, převezme `BODY` a `bake.js`, zapeče pevné díly prefabů (D-041).

**Návrhy, které základ dluží:** N-002 `follow`, N-102 `rigCompile` a `rigSolve`, N-103 `rig.noSpeed`, N-105 svítivosti xLabu. Otevřený žádný; přehled `docs/navrhy/README.md`.

**Další na řadě** (po dnešku, pořadí z `START_SVOD.md`): pravidlo validátoru `portal.door.cover` (D-036, počítané v poloze `rest`, D-042) → svázané klouby `follow` (N-002, dvoukřídlé dveře jako jeden prefab) → `rigCompile`, `rigSolve` (N-102) → svítivosti zlatého vzorku (N-105) → `rig.noSpeed` (N-103) → zmrazit pole N-006 (D-030) → zkoušky Shellu → xBench (strop 22,5 až 25,2 ms) → `REQUIREMENTS.md` a `05_PARITA_2003.md`.

**Nedávno hotovo:**
- 24. 11. D-037 mřížka světla: vrcholy na násobcích buňky ve světě, schované plochy pryč; švy na zlatém vzorku 128 → 0 (`a995347`)
- 24. 11. průběžná předávka main 02 (`docs/sesny/predavky/`)
- 23. 11. díly prefabů v základu: `partMesh`, `partTris`, `partCollider` (N-101, `cc5078f`)
- 23. 11. rozhodnutí D-035 (zapečené světlo), D-036 (zakrytí otvoru dveřmi), D-037 (mřížka světla)
- 22. 11. `zaklad-2`: sloučená vlna 1, zkouška A × B (`npm run test:axb`), rozhodnutí D-029 až D-034, zadání vlny 2
- 22. 11. rozpočty podle tří běhů xBench 0.2 (`docs/06_ROZPOCTY.md`)

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

Podrobně: `docs/sesny/B_STAV.md` na větvi `sesna-b` (oddíl „Sešna B04“), zadání `docs/sesny/START_B.md`. Vede sešna B.

**Teď** (Ondřej 24. 11. 19:55: 1 a, 2 a, 3 a a k tomu „více těles, více prefabů, bohatší tvary…, spodní šuplíky nezávisle, realističtější dřevo“):
1. [x] dodatek znění 4: `BODY` a `decodeBake` ze základu (`ba16d8d`); [ ] xBake zapeče i pevné díly prefabů (D-041)
2. [x] barvy materiálů k albedu skutečných povrchů, expozice v generovaných levelech (`6f3141b`)
3. [x] bohatší tvary, první dávka (z kvádrů a válců, ať je zapeče xBake a nakreslí engine A): bedny, sudy, truhla, skříň, stoly, židle, regály, lavice (`5e03d87`); [ ] další dávka a nové prefaby
4. [x] zásuvky nezávisle: samostatné entity připojené ke korpusu, duté s přihrádkami, návrh **N-010**; v enginu A ověřeno (`8d52fb5`, `1696306`)
5. [x] dřevo: realističtější barva, suky, trhliny, letokruhy (`60ddb4c`)
6. [ ] **600 těles** (Ondřej 20:38; odpovědi: laboratoře a IT první, ~150 tvarů × varianty, tematické balíky `kit_lab` a `kit_it`, do 1 000 △): dávka L1 sklo, plast a chemikálie → L2 stolní přístroje → L3 velké přístroje, chovy, karanténa → I1 počítače, serverovna, open space → zařazení do předvolby `complex` → `kit_home` s předvolbou bytu

**Potom:** B2.5 (dveře ze sítě pro sešnu A, D-030) · zbytek B2.2 (`components.place`, `passable` u oken, `seeThrough` u mříže, `speed`; `opacity` skla a `screen.offset` hotové) · B2.7.

**Čeká na jiné:** N-010 víc interakcí v prefabu (svodná) · N-002 jeden prefab dvoukřídlých dveří · N-110 až po zkoušce sešny A · otázka na Ondřeje: „vnitřní kompartmentizace“ = (a) přihrádky a police, nebo (b) kresba dřeva (pracuju s a).

**Nedávno hotovo:**
- 24. 11. znění 5 základu sloučeno (`614e4d7`); `albedoMean` u 21 materiálů (D-045), `opacity` skla, `screen.offset` terminálů (`905d029`)
- 24. 11. zásuvky kartotéky a stolu jako samostatné entity; B-T8 v enginu A: spodní se otevře sama, třetí vytáhne hráč myší, ostatní stojí (`8d52fb5`, `1696306`)
- 24. 11. bohatší tvary, první dávka; mez prefabu 1 000 △, celý level do 300 tisíc △ (`5e03d87`)
- 24. 11. barvy podle albeda, expozice `complex` 0,95 a `catacombs` 1,03 (`6f3141b`)
- 24. 11. B2.4 textury: 21 materiálů `kit_base` s `albedo`, `normal`, `uvScale` (30 souborů WebP 512 px, 1 287,4 kB), galerie se třemi pohledy (`7204c2d`, `951044a`, `70d2473`)
- 24. 11. B2.3 xSearcher: příjem textur CC0 z Poly Haven a ambientCG, test bez sítě 47 kontrol (`5828344`, `24e2358`)
- 24. 11. xBake nad mřížkou D-037; brány dveří, stínění kolizemi, okraj stínu po podílech (`3d1aa2a`, `9d34aa6`)
- 24. 11. regrese po zásuvkách a znění 5: `npm test` 270, `npm run test:b` 209 (+ B-T8 7), `npm run test:axb` 37, 0 selhalo (sandbox)
