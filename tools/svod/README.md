# Pomůcky svodné sešny

Skripty, které svodná sešna main 03 používala při slučování a regresi (24. a 25. 11. 2026). Nejsou součástí `npm test`; cesty `/home/claude/xengine` a `/home/claude/log` jsou natvrdo pro kontejner Claude, v jiném prostředí je uprav.

| Soubor | Co dělá | Použití |
|---|---|---|
| `groups.sh` | testy po skupinách na aktuální větvi (`npm test`, `test:a`, `test:b`, `test:axb`), log každé skupiny zvlášť a stav do `g_<štítek>_status.txt`; `npm run test:all` je řetěz `&&` a po první chybě skončí, proto po skupinách | `tools/svod/groups.sh n112` (na pozadí; čekat `until grep -q KONEC …`) |
| `zkouska.sh` | sloučení nanečisto `main` + `origin/sesna-a` + `origin/sesna-b` na dočasné větvi, konflikty, testy po skupinách, úklid; nic nepushuje | `tools/svod/zkouska.sh`, výsledek `/home/claude/log/z_status.txt` |
| `rigcheck.mjs` | `rigMatrices` / `rigSolve` proti původnímu rekurzivnímu výpočtu na všech prefabech balíků (N-102) | `node tools/svod/rigcheck.mjs . packs/golden packs/kit_base` |
| `cover_scan.mjs` | škvíry kolem dveří portálů podle `src/xspace/cover.js` (D-036) | `node tools/svod/cover_scan.mjs . packs/gen_demo` |
| `samples_count.mjs` | počty vzorků světla podle `levelSamples` (D-041) | `node tools/svod/samples_count.mjs . packs/gen_demo` |
| `atlas_try.mjs` | atlas textury světla po 10 a 5 cm: rozměr, mapy, body, okraj, časy (N-112) | `node --max-old-space-size=4096 tools/svod/atlas_try.mjs packs/gen_demo 0` |
