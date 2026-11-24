# TODO: co je hotové, co se dělá, co čeká

Krátký přehled celého projektu na jedné stránce. Podrobnosti jsou v odkazech, ne tady.

**Pravidla tohoto souboru**
- Každá sešna přepisuje **jen svůj oddíl** (svodná, A, B), po každém uzavřeném kroku, ve stejném commitu jako práce.
- „Hotovo“ jen s commitem a zeleným testem. Bez toho je to „rozpracované“.
- Co je hotové, z oddílu „Teď“ zmizí a zůstane jedním řádkem v „Hotovo“. Dlouhé popisy patří do `*_STAV.md`.
- Na začátku sešny: `git fetch` a přečíst tento soubor z větve základu i z větví sešen (`git show origin/sesna-a:TODO.md`). Než se soubor dostane do základu, je jen na větvi `sesna-b`.

**Kde je co**

| Co | Kde |
|---|---|
| pravidla pro AI (čte se samo v každé sešně) | `CLAUDE.md` |
| Ondřejovo zadání (platí nad rozhodnutími sešen) | `docs/00_ZADANI.md` |
| moduly, tok dat, vrstvy běhu | `docs/01_ARCHITEKTURA.md`; mapa složek v `README.md` |
| závazná rozhraní a pole formátu | `docs/02_KONTRAKTY.md`, `docs/02a_XSPACE_pole.md` (z `src/xspace/formats.js`) |
| deník rozhodnutí (D-001 a dál: co, proč, co se zvažovalo, jak vrátit) | `docs/DECISIONS.md` |
| návrhy změn N-xxx a jejich osud | `docs/navrhy/` |
| podrobný stav | `docs/STATE.md` (základ), `docs/sesny/A_STAV.md`, `docs/sesny/B_STAV.md` (na větvích sešen) |
| zadání vlny pro sešny | `docs/sesny/START_A.md`, `START_B.md`, `START_SVOD.md` |
| změřeno na T460 | `docs/06_ROZPOCTY.md`, `docs/mereni/` |

## Teď (2026-11-24, 16:00)

| Sešna | Větev a hlava | Dělá teď | Potom |
|---|---|---|---|
| svodná | `zaklad-2` = `main` = `a995347` (znění 3 základu 2) | nic neběží | sloučit vlnu 2, dluhy základu (oddíl níže) |
| A | `sesna-a` = `db6fad0` | A2.5 nová pole základu, A2.6 textury a sítě (Ondřej 24. 11. 02:26: „1 b“) | textura světla N-110 až potom |
| B | `sesna-b` (hlava v `git log`) | B2.4 první textury v galerii sady | B2.5 zkouška povrchu na jednom kusu |

## Čeká na Ondřeje

| Kdo se ptá | Otázka | Kde |
|---|---|---|
| A | zorné pole po opravě: a) použitelné, b) nižší strop než 120°, c) promítání Panini | `A_STAV.md`, Otázky |
| A | tři měření `?bench` s opravenou metodou (bez vyhlazování, mřížka 0,5 m; `?bench`, `&rows=1080`, `xLab_gen…?bench`) | tamtéž |
| A | terminál: po Esc a Pokračovat kurzor hned poslouchá? a) ano, b) ne | tamtéž |
| B | nic | |

## Otevřené návrhy (rozhoduje svodná sešna)

| Návrh | Co | Podala | Stav |
|---|---|---|---|
| N-001 znění 2 | zapečené světlo: potvrdit `gate` jako seznam id dveří a pole `doors` v hlavičce | B | přijato se změnou (D-035), dvě věci k potvrzení |
| N-002 | svázané klouby (`follow`): dvoukřídlé dveře jako jeden prefab | B | přijato, základ dluží |
| N-008 | rozměry postavy (poloměr, výška, schod, odstup kontroléru) do `src/xspace` | B | otevřený |
| N-102 | `rigCompile`, `rigSolve` bez alokací | A | přijato, základ dluží |
| N-105 | xLab je přesvícený (svítivosti a expozice zlatého vzorku) | A | čeká na čísla jasu |
| N-109 | otočné dveře se otvírají od hráče: kloub na obě strany v datech | A | Ondřej chce do dat (24. 11., „2 a“); čeká na svodnou, potom data sešny B |
| N-110 | světlo v textuře, bod 5 cm, zapéká xBake | A | Ondřej: až po A2.5 a A2.6 |

## Svodná sešna (oddíl mění jen svodná)

Zapsala sešna B 2026-11-24 podle `docs/sesny/START_SVOD.md` (`a995347`).

**Hotovo ve vlně 2:** N-101 díly prefabů v `geom.js` (23. 11.); D-037 mřížka světla znění 2 (24. 11., `a995347`).

**Dluhy základu (pořadí z `START_SVOD.md`):**
1. při sloučení ověřit, že A i B berou vzorky z `levelLightMeshes`; rozhodnout `env.lightCell` (N-108) po měření T460
2. D-036: pravidlo validátoru `portal.door.cover` ze všech neprůhledných dílů dveří
3. N-002: `rig.joints[].follow`
4. D-035: převzít do `src/xspace` čtení souboru světla (`tools/bake/read.mjs` sešny B) a pravidlo bran (`occlusion.js` sešny A); sjednotit tři rozdíly (`B_STAV.md`, „Sešna B03“)
5. N-102 · 6. N-105 · 7. N-103 (`rig.noSpeed`) · 8. D-030 zmrazit jména polí N-006 po zkoušce na jednom kusu · 9. D-032 výsledek zkoušky terminálu · 10. zkoušky Shellu v prohlížeči · 11. xBench: strop metody u nejtěžších případů · 12. stavy řádků v `REQUIREMENTS.md` a `05_PARITA_2003.md`

**Rozhodnout:** N-008, N-109, N-110 a dvě věci N-001 znění 2. Sloučení `sesna-a` + `sesna-b` nanečisto nikdo nepouštěl.

## Sešna A (oddíl mění jen sešna A)

Zapsala sešna B 2026-11-24 podle `A_STAV.md` z `db6fad0`; od příštího kroku ho vede sešna A.

**Hotovo ve vlně 2:** A2.1 světlo po vrcholech · A2.2 obraz a měření (`?bench`) · A2.3 krok simulace (na T460 medián 0,55 až 0,68 ms) · A2.4 dluhy vlny 1 · zorné pole jako vodorovný úhel při 4 : 3, strop 120° (`db6fad0`) · dveře od hráče jako nastavení, výchozí zapnuto (`db6fad0`)

**Teď:** A2.5 nová pole základu, A2.6 textury a sítě.

**Neuděláno:** A2.7; čtení souboru se zapečeným světlem z xBake (čeká na přenos čtení do základu; na T460 trvá stavba světla `complex_7` při načtení 24,3 s).

Poslední celá regrese podle sešny A: 728 kontrol, 0 selhalo (sandbox; skupina B v její větvi je starý stav, 92 kontrol).

## Sešna B (oddíl mění jen sešna B)

**Hotovo ve vlně 2:**
- B2.1 průchodnost pro skutečného hráče 0,74 m, katakomby, světlost dveří (`d2e1481`)
- B2.6 xBake podle D-035: dveře jako brány světla, stínění kolizemi prefabů, okraj stínu po podílech, čtení bez Node (`3d1aa2a`, `7dd9cd2`), nad mřížkou D-037 (`9d34aa6`)
- díly prefabů z `geom.js` v galerii, náhledu a xBake (`7dd9cd2`)
- B2.3 xSearcher: `tools/searcher/find.mjs` hledá a přijímá textury CC0 z Poly Haven a ambientCG do `packs/_inbox` se záznamem; 10 textur v příjmu (82,5 MB, 2K); test bez sítě `b_t7_searcher` 47 kontrol (`5828344`, `24e2358`)
- poslední celá regrese: 699 kontrol, 0 selhalo (`9d34aa6`, sandbox); po B2.3 `npm test` 254 a `npm run test:b` 188 kontrol zeleně

**Teď:** B2.4 textury z příjmu do `kit_base` přes `albedo` a `uvScale` (odvozené 512 px pro `low`, 1K pro `mid`; originály 2K zůstávají v příjmu), galerie se třemi pohledy (čistý, T460, grafická karta), montáž aspoň 8 prefabů, součet velikostí do `B_STAV.md`. Směr podle Ondřeje 24. 11.: opotřebený provoz, poprvé v galerii, mez 8 GB grafické paměti.

**Další, v tomto pořadí:**
1. B2.5 zkouška povrchu na jednom kusu (dveře `.glb` na stejné kostře)
2. zbytek B2.2: `components.place`, `opacity`, `passable`, `seeThrough` u mříže, `speed`
3. B2.7 xDesigner, dům, tvor

**Čeká na jiné:** N-109 (data dveří na obě strany, až rozhodne svodná) · N-002 (jeden prefab dvoukřídlých dveří) · N-110 (nový druh vrstvy v xBake).
