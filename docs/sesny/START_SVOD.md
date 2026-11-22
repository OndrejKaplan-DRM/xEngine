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

## První kroky sešny main 02 (zapsáno 22. 11. 2026)

1. **Znění 2 základu.** Je-li `origin/zaklad-1` novější než `a2ce175`, je na GitHubu. Jinak ho vezmi z přílohy: `git fetch /cesta/xengine_zneni2_2026-11-22.bundle main:zneni-2` (otisky commitů zůstanou stejné).
2. Přečti `docs/00_ZADANI.md` včetně oddílu C, `docs/STATE.md`, `A_STAV.md` a `B_STAV.md` z větví sešen a všechny návrhy N-002 až N-006 a N-101 až N-107.
3. **Sloučení:** `integrace-1` z hlavy znění 2, potom `sesna-a` (v `src/app/main.js` dva importy `../../vendor/shell/…` → `../shell/…`, v `test/a_00_build.mjs` rozpad velikosti), potom `sesna-b`. Zkušební sloučení 22. 11. 2026 bylo u obou bez konfliktů a skupina A po změně importů prošla 16 z 16.
4. **Rozpory mezi kódem sešny A a zněním 2** zapiš a rozhodni: světlo po pixelech (D-022), velikost obrazu (D-023), terminál a Esc (D-024), zablokované dveře (D-025), popis rozhraní entit (D-026), ořez po buňkách je hotový dřív, než D-027 čekalo.
5. **Návrhy.** Nejdůležitější je N-006 (stupně kvality a vrstvy vzhledu): váže se na body 6/ a 8/ zadání a na D-022.
6. Výsledek xBench 0.2 z T460 (pokud přišel) do `06_ROZPOCTY.md` a `docs/mereni/`.
7. Zadání vlny 2 pro A a B piš proti oddílu C zadání: co je největší díra mezi zadáním a stavem.
8. Push jen na Ondřejovo výslovné slovo; může ho dát předem ve startovní zprávě.

## Dluhy základu před vlnou 2 (zapsáno 22. 11. 2026)

1. **Shell se přestěhoval jen kódem** (D-006). Zbývá: přenést z `vibe-game-frameworks` zkoušky Shellu v prohlížeči (`t2_shell`, `t4_nastaveni_ui`) a zkoušku katalogu (`t5_katalog`, bez části vázané na arkádu), rozhodnout, kde žije specifikace `02_SHELL`, a po Ondřejově slovu zapsat do `vibe-game-frameworks`, že Shell má domov tady.
2. **xBench 0.2** je hotový; čeká se na výsledek z T460. Výsledek rozhodne o efektovém světle (D-022), o výchozím vnitřním rozlišení (D-023) a o vyhlazování hran. Potom přepsat `06_ROZPOCTY.md` a uložit surová data do `docs/mereni/`.
3. **Skill `xengine`** po sloučení vlny 1 srovnat s repem (světlo po vrcholech, `src/shell`, změřené rozpočty).

## Na co si dát pozor

- „VŠE OK“ ve stavu sešny neber jako důkaz; pusť testy sama.
- Pevné počty v testech jedné sešny rozbije dodávka druhé: přepiš na hodnoty z dat.
- Překročený rozpočet po sloučení řeš příčinou (rozpad po skupinách), ne zvednutím meze.
- Do `main` nic bez Ondřejova výslovného souhlasu.
