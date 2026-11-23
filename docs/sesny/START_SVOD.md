# Zadání svodné sešny (po vlně N)

Jsi **svodná sešna**. Nepíšeš nové funkce. Slučuješ, ověřuješ, rozhoduješ návrhy a připravuješ další vlnu.

## Postup

1. Připoj repo, `git fetch origin`, přečti `CLAUDE.md`, `docs/STATE.md`, `docs/04_SESNY.md`, oba `docs/sesny/*_STAV.md` (z větví sešen) a všechny `docs/navrhy/N-*.md`.
2. Ověř, že sešny nesáhly do cizích složek: `git diff --stat origin/zaklad-N origin/sesna-a` a totéž pro `sesna-b`. Zásah mimo vlastnictví = vrátit a zapsat jako návrh.
3. `git checkout -b integrace-N origin/zaklad-N`, `git merge --no-ff origin/sesna-a`, `npm install`, `npm test`, `npm run test:a`. Potom `git merge --no-ff origin/sesna-b`, `npm test`, `npm run test:b`. Zkouška nanečisto předem: `git merge-tree --write-tree`.
4. `package-lock.json` obnov (`npm install`) a commitni.
5. **Zkouška A × B** podle `04_SESNY` oddíl 5: level z balíku B načtený během A. To je hlavní výsledek vlny.
6. Rozhodni návrhy: přijmout (změna základu + zvýšení `XSPACE_VERSION`, pokud se mění formát, + úprava zlatého vzorku a testů), odložit, zamítnout. Rozhodnutí zapiš do návrhu i do `DECISIONS.md`.
7. Celá regrese `npm run test:all` na klidném stroji (`uptime` pod 3).
8. Aktualizuj `STATE.md`, `REQUIREMENTS.md`, `05_PARITA_2003.md` (stavy řádků), `06_ROZPOCTY.md` (pokud přišel výsledek xBench).
9. Sestavení pro Ondřeje (`dist/xlab.html` s balíkem B, montáž snímků), mezistav „hotovo × neuděláno“.
10. Po Ondřejově slovu: sloučit do `main`, `git push origin main`, `git push origin main:refs/heads/zaklad-(N+1)`.
11. Napiš zadání další vlny (`START_A.md`, `START_B.md`) a nový balík pro sešny.
12. Teprve teď navrhni úpravu skillu `xengine` z poznatků v obou `*_STAV.md`, vždy z čerstvě přečteného znění.

## Stav po sešně main 02 (22. 11. 2026)

Vlna 1 je sloučená, zkouška A × B prošla, návrhy a rozpory jsou rozhodnuté (D-029 až D-034), `zaklad-2` = `main`. Zadání vlny 2 je v `START_A.md` a `START_B.md`. Zkouška A × B je test `npm run test:axb` (T5) a patří základu.

## Dluhy základu ve vlně 2 (provádí svodná sešna, v tomto pořadí)

0. **Nové návrhy:** N-001 (formát zapečeného světla), N-007 (zakrytí otvoru dveřmi, překrývá se s N-107) a N-108 (švy a hrubost mřížky světla) přišly během integrace a nejsou rozhodnuté.

1. **N-101:** `partMesh`, `partCollider`, `partTris` do `src/xspace/geom.js` podle `src/world/parts.js` sešny A; xView je začne používat; kontroly v T1.
2. **N-107:** pravidlo validátoru `portal.door.cover` pro dveře bez `seeThrough`, mutace v T1.
3. **N-002:** `rig.joints[].follow`, pravidla validátoru, `jointFollow` v `rig.js`.
4. **N-102:** `rigCompile` a `rigSolve`, dřív než přijde první tvor.
5. **N-105:** svítivosti a expozice zlatého vzorku, až sešna A převede vykreslení na světlo po vrcholech.
6. **N-103:** varování `rig.noSpeed`, až sešna B doplní `speed`.
7. **D-030:** po zkoušce textury a sítě na jednom kusu zmrazit jména polí N-006 do formátu.
8. **D-032:** podle zkoušky v Chrome přepsat D-024, nebo zadat přestavbu terminálu.
9. **Shell:** přenést z `vibe-game-frameworks` zkoušky v prohlížeči (`t2_shell`, `t4_nastaveni_ui`) a zkoušku katalogu; rozhodnout, kde žije specifikace `02_SHELL`. Zápis o novém domově tam je (větev `dev`, `3aa13f4`).
10. **xBench:** čtyři nejtěžší případy vycházejí ve všech bězích 22,5 až 25,2 ms při různé zátěži (postřeh sešny A): prověřit, jestli to není strop metody. Doplnit průhledné plochy, víc textur a interiér s texturou v 1080 řádcích.
11. `REQUIREMENTS.md` a `05_PARITA_2003.md`: stavy řádků po vlně 1 nejsou přepsané.
12. Skill `xengine` srovnat s repem (světlo po vrcholech, `src/shell`, stupně kvality, T5, změřené rozpočty).

## Na co si dát pozor

- „VŠE OK“ ve stavu sešny neber jako důkaz; pusť testy sama.
- Pevné počty v testech jedné sešny rozbije dodávka druhé: přepiš na hodnoty z dat.
- Překročený rozpočet po sloučení řeš příčinou (rozpad po skupinách), ne zvednutím meze.
- Do `main` nic bez Ondřejova výslovného souhlasu.
