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

Hotovo: N-101 (`partMesh`, `partCollider`, `partTris` v `geom.js`, 23. 11. 2026); D-037 mřížka světla znění 2 (24. 11. 2026, bod 1 níže). Rozhodnuto: N-001 (D-035), N-007 (D-036), N-108 (D-037).

1. **D-037, mřížka světla znění 2: hotovo 24. 11. 2026.** Čísla jsou ve `STATE.md`. Zbývá jen při příštím sloučení ověřit, že sešny A a B přešly na `levelLightMeshes`, a rozhodnout doplněk N-108 (pole `env.lightCell`) po měření `?bench` s `grid=0.25` na T460.
2. **D-036: hotovo 24. 11. 2026** (`src/xspace/cover.js`). Pravidlo validátoru `portal.door.cover` ze všech neprůhledných dílů dveří v klidu (vzor: `test/b_lib/door-cover.mjs` sešny B, kolmá část), mutace v T1; neplatí pro `seeThrough`.
3. **N-002: hotovo 24. 11. 2026.** `rig.joints[].follow`, pravidla validátoru, `jointFollow` v `rig.js`. Povýšeno, protože na něm stojí dvoukřídlé dveře jako jeden prefab.
4. **D-035: hotovo 24. 11. 2026** (D-044: `src/xspace/bake.js`; pravidlo paprsku zůstává v xBake). Zbývá: validátor ohlídá, že `baked.file` je v `assets`.
4b. **N-201: zkušební formát zbraní v základu 25. 11. 2026** (D-053). Zbývá: po zkoušce A3.1 a B3.1 zmrazit (D-030), odebrat `EXPERIMENTAL_KINDS` u zmrazených druhů.
4a. **N-010: hotovo 25. 11. 2026** (D-052, `src/xspace/interact.js`, T1c). Zbývá: při sloučení ověřit, že sešna A vybírá interakci přes `interactionOf` a sešna B má kartotéku jako jeden prefab.
5. **N-102: hotovo 24. 11. 2026** (`rigCompile`, `rigValues`, `rigFollow`, `rigSolve` v `rig.js`; `rigMatrices` je obálka). Zbývá: při sloučení ověřit, že sešna A v `src/world/entities.js` (`pose`) přešla na zkompilovanou kostru (dodatek znění 7 ve `START_A.md`).
6. **N-105:** svítivosti a expozice zlatého vzorku; sešna A už na světlo po vrcholech přešla, čeká se na její čísla jasu po sloučení.
7. **N-103:** varování `rig.noSpeed`, až sešna B doplní `speed`.
8. **D-030:** po zkoušce textury a sítě na jednom kusu zmrazit jména polí N-006 do formátu.
9. **D-032:** výsledek zkoušky terminálu v Chrome.
10. **Shell:** přenést z `vibe-game-frameworks` zkoušky v prohlížeči (`t2_shell`, `t4_nastaveni_ui`) a zkoušku katalogu; rozhodnout, kde žije specifikace `02_SHELL`. Zápis o novém domově tam je (větev `dev`, `3aa13f4`).
11. **xBench:** čtyři nejtěžší případy vycházejí ve všech bězích 22,5 až 25,2 ms při různé zátěži (postřeh sešny A): prověřit, jestli to není strop metody. Doplnit průhledné plochy, víc textur a interiér s texturou v 1080 řádcích.
12. `REQUIREMENTS.md` a `05_PARITA_2003.md`: stavy řádků po vlně 1 nejsou přepsané.

## Na co si dát pozor

- „VŠE OK“ ve stavu sešny neber jako důkaz; pusť testy sama.
- Pevné počty v testech jedné sešny rozbije dodávka druhé: přepiš na hodnoty z dat.
- Překročený rozpočet po sloučení řeš příčinou (rozpad po skupinách), ne zvednutím meze.
- Do `main` nic bez Ondřejova výslovného souhlasu.
