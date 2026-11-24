# TODO: co se dělá, co čeká, co je hotové

Jediný přehled napříč sešnami. Podrobnosti jsou jinde (odkazy u řádků); tady je jen to, co potřebuješ vědět, než začneš.

**Pravidla souboru** (D-038):
- Každá sešna mění **jen svůj oddíl**. Svodná sešna navíc oddíl „Čeká na Ondřeje“ a hlavičku.
- Aktualizuje se na konci každého kroku spolu s commitem, ne až na konci sešny.
- „Nedávno hotovo“ drží posledních 8 položek; starší jsou v `git log` a v `*_STAV.md`.
- Řádek = jedna věc, kdo, stav, kde je podrobně. Čísla jen změřená, s místem měření.
- Čerstvý oddíl sešny je na její větvi, než se sloučí: `git show origin/sesna-a:TODO.md`, `git show origin/sesna-b:TODO.md`.

**Základ:** `zaklad-2` = `main` = `integrace-1`, základ 2 znění 7 (24. 11. 2026 pozdě v noci; vlna 2 sloučená v polovině). Hlavy sešen ve 23:50: `sesna-a` = `728a9a5`, `sesna-b` = `235b38a`. Regrese na `main`: 926 kontrol, 0 selhalo (`docs/STATE.md`).

## Čeká na Ondřeje

| # | Co | Ptá se | Od | Podrobně |
|---|---|---|---|---|
| 1 | **Textura světla (N-110)** po tvém měření z T460 (23:13 až 23:16): vykreslení +0,7 až +0,9 ms (levné), výpočet jedné haly při načtení 1,8 s po 10 cm a 6,1 s po 5 cm (za běhu nejde, musí zapéct xBake předem), paměť 4 / 16 MB na halu. a) do formátu a xBake s bodem 5 cm, b) totéž s 10 cm, c) zůstat u světla po vrcholech. **Svodná doporučuje a)** s velikostí bodu jako polem dat (T460 smí načíst zmenšeně po 10 cm, D-029); definitivně rozhodne zkouška celého `complex_7` v xBake (čas zapékání, velikost souboru, paměť) | sešna A | 24. 11. 23:18 | `docs/navrhy/N-110-svetlo-v-texture.md` na `sesna-a`, oddíl „Zkouška“ |
| 2 | **Pořadí převzetí z Arény v2:** a) nejdřív zbraně, střelba, zoom a výbuchy (formát zbraně se zkouškou na plazmové pušce), potom zvuk, potom tvorové; b) nejdřív tvorové a nepřátelé; c) nejdřív zvuk | svodná | 24. 11. 23:55 | `docs/prevzeti/ARENA.md`, oddíl 5 |
| 3 | Potvrdit nebo přepsat body 6/ až 8/ zadání (sestavila je svodná sešna z tvých vět) | svodná | 22. 11. | `docs/00_ZADANI.md`, oddíl B |

**Zodpovězeno 24. 11. 2026:** 21:13 a 21:20 sešně A: výchozí rozlišení **(a) zůstává 768 řádků** (`complex_7` na 1 080 řádcích 95 % 10,2 ms); dva běhy s texturami: textury barvy na T460 únosné (`A_STAV.md`, oddíl 5). 23:38 svodné: kód staré hry **(a) jen Aréna v2** z GitHubu (`OndrejKaplan-DRM/Arena`, připojit jen pro čtení, sepsat co převzít); další krok **(b) N-102** (kostry bez alokací), N-010 až potom. 21:19 svodné: další krok **(a) pravidlo zakrytí dveří a svázané klouby**; černá obrazovka byl **omyl** (snímek poslaný omylem, uzavřeno). 19:57 svodné: sloučit vlnu 2 do základu **teď (a)**; `?bench` pustíš **(a)**; otázce na černou obrazovku jsi nerozuměl (přeformulováno výše). 19:49 sešně A: zorné pole **(a) použitelné**, terminál po Esc **(a) funguje**, černé boky bez přímého světla **(a) počkat na odražené světlo ze zapečeného souboru**; poslal tři běhy `?bench` (`A_STAV.md`, oddíl 5.1). 02:26 sešně A: nejdřív A2.5 a A2.6, textura světla potom; dveře od hráče do dat. 02:04 sešně B: mez 8 GB, nejdřív xSearcher a textury, náhled zapečení počká.

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

**Čeká na sešny:** A dělí okolní světlo π (D-049) → potom svodná vynásobí okolní světlo zlatého vzorku π; A zapojí svázané klouby a zkompilovanou kostru v kroku (`rigCompile` / `rigFollow` / `rigSolve`, dodatek znění 7). B zapisuje `albedoMean`, zapéká pevné díly prefabů (D-041), dvoukřídlé dveře jako jeden prefab bez `seeThrough` (N-002).

- [x] N-102 kostry bez alokací (`rigCompile`, `rigValues`, `rigFollow`, `rigSolve`; T1b; regrese 926 kontrol, 0 selhalo)

- [x] soupis převzetí z Arény v2 (`docs/prevzeti/ARENA.md`: co komu, co chybí ve formátu, co nepřebírat, pořadí)

**Teď:** čeká na tvé odpovědi 1 a 2 výše; mezitím N-010 (víc interakcí v prefabu).

**Další na řadě:** rozhodnout N-010 (víc interakcí v prefabu; sešna B dělá ~600 těles) → svítivosti zlatého vzorku (N-105) → `rig.noSpeed` (N-103) → zmrazit pole N-006 (D-030) → zkoušky Shellu → xBench (strop 22,5 až 25,2 ms) → `REQUIREMENTS.md` a `05_PARITA_2003.md` → úprava skillu `xengine` po sloučení.

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

**Teď** (Ondřej 24. 11. 23:57: hustota laboratoří stačí (1 a); další krok zapečené světlo na pevných dílech prefabů D-041 (2 b), `kit_home` až potom; hra smí mít až 25 MB (3 a); `?bench` nad `complex_7` pustí (4 a). Nové zadání: **„víc prefabů, ve vyšší kvalitě, víc trojúhelníků… lépe řeš kužely, válce, jehlany, zaoblení… materiál je sklo, ať to tak vypadá“; trojúhelníků o 50 % víc, práce 5× lepší, celému inventáři víc realismu.**):
1. [~] realistický inventář: **první kolo hotovo** (sítě `tools/forge/mesh/`, sklo 76, plasty 53, chemikálie 38, odparka, zaoblení všech přístrojů ze společné vrstvy; 7 nových kusů skla; návrh N-012; `kit_lab` 171 484 △, level `complex` medián 197 622 △, nejvíc 295 204 z meze 300 tisíc; hra 13,6 MB). Zbývá kus po kuse: stolní a velké přístroje → nábytek a chlazení → `kit_it` → `kit_base`; nové prefaby
2. [ ] xBake zapeče pevné díly prefabů (D-041)
3. [ ] dodatek znění 6: `door_double_01` jako jeden prefab s `follow` (bez `seeThrough`), v generátoru zrušit párování křídel přes `io`, `door_dleft_01` a `door_dright_01` pryč; mikroskop `focus` → `stage`
4. [ ] `kit_home` s předvolbou bytu
5. [x] `kit_lab` 286 a `kit_it` 80 prefabů v levelech `complex` (`3f45c21`, `235b38a`); dřevo, zásuvky, barvy, první dávka tvarů (B_STAV, oddíl B04)

**Potom:** B2.5 (dveře ze sítě pro sešnu A, D-030) · zbytek B2.2 (`components.place`, `passable` u oken, `seeThrough` u mříže, `speed`; `opacity` skla a `screen.offset` hotové) · B2.7.

**Čeká na jiné:** **N-012 pro svodnou** (rotační díl `lathe` a zaoblený kvádr `rbox` ve formátu, aby je zapekl xBake a viděl generátor; dnes .glb) · **N-011 pro sešnu A** (`?bench` kývá pohledem kvůli zpožděnému řízení robota a měřením sám srazí hru na 30 snímků/s; Ondřej 25. 11. 0:19) · N-010 víc interakcí v prefabu (svodná) · N-002 jeden prefab dvoukřídlých dveří · N-110 až po zkoušce sešny A · otázka na Ondřeje: „vnitřní kompartmentizace“ = (a) přihrádky a police, nebo (b) kresba dřeva (pracuju s a).

**Nedávno hotovo:**
- 25. 11. realistický inventář, první kolo: hladké sítě z xForge (sklo s tenkou stěnou, kapalinou a stupnicí, plasty, chemikálie, odparka, zaoblené pláště a panely přístrojů), 7 nových kusů skla; regrese zelená (B_STAV, oddíl „Realistický inventář“; `2a9a4bb` až `3be532e`)
- 24. 11. sady v levelech: `complex` staví laboratoře podle oboru, serverovny v řadách, open space a zasedačky; 200 seedů bez nálezu, level ≤ 228 516 △, A × B zelená, nejvýš 255 volání kreslení (B_STAV, oddíl „Sady v generovaných levelech“)
- 24. 11. `kit_lab` 286 prefabů (sklo, plasty, chemikálie ve 20 baleních, 52 stolních a 26 velkých přístrojů, chlazení, nábytek, reaktory, chovy a karanténa) a `kit_it` 80 prefabů (počítače, serverovna, open space); B-T9 (`611f325` až `42b7dae`)
- 24. 11. znění 5 základu sloučeno (`614e4d7`); `albedoMean` u 21 materiálů (D-045), `opacity` skla, `screen.offset` terminálů (`905d029`)
- 24. 11. zásuvky kartotéky a stolu jako samostatné entity; B-T8 v enginu A: spodní se otevře sama, třetí vytáhne hráč myší, ostatní stojí (`8d52fb5`, `1696306`)
- 24. 11. bohatší tvary, první dávka; mez prefabu 1 000 △, celý level do 300 tisíc △ (`5e03d87`)
- 24. 11. barvy podle albeda, expozice `complex` 0,95 a `catacombs` 1,03 (`6f3141b`)
- 24. 11. B2.4 textury: 21 materiálů `kit_base` s `albedo`, `normal`, `uvScale` (30 souborů WebP 512 px, 1 287,4 kB), galerie se třemi pohledy (`7204c2d`, `951044a`, `70d2473`)
- 24. 11. B2.3 xSearcher: příjem textur CC0 z Poly Haven a ambientCG, test bez sítě 47 kontrol (`5828344`, `24e2358`)
