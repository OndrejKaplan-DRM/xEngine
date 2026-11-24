# xEngine

Engine pro 3D z pohledu první osoby v prohlížeči, datový formát xSpace a nástroje kolem něj. Cílový stroj: Lenovo T460 (Intel HD 520, 8 GB).

**Co se dělá a co je hotové: `TODO.md`.** Stav základu a čísla: `docs/STATE.md`. Počty kontrol tady záměrně nejsou, stárnou.

## Rychlý start

```text
npm install
npm test            jádro, formát, zlatý vzorek, sestavení, prohlížeč dat, měření
npm run test:all    + sešna A, sešna B a zkouška A × B
node build.mjs xlab           dist/xlab.html: hra se zlatým vzorkem
node build.mjs xlab_gen       dist/xlab_gen.html?level=N: hra s levely sešny B
npm run check       kontrola zlatého vzorku validátorem
```

- `dist/xview.html`: prohlížeč balíku (otevři dvojklikem).
- `dist/xbench.html`: měření stroje. Spusť na T460 a pošli výsledek; podle něj se nastaví rozpočty.
- Ve hře: F3 přehled, F4 buňky a portály; adresa `?bench` změří celý snímek a vydá JSON.

## Mapa

```text
src/kernel      xKernel   systémy, fáze, události, pevný krok                      základ
src/xspace      xSpace    formáty, validátor, geometrie, kostry                     základ
packs/golden              zlatý vzorek: level xLab a 12 prefabů                     základ
tools/golden              generátor zlatého vzorku                                   základ
tools/xview     xView     prohlížeč balíku                                           základ
tools/xbench    xBench    měření stroje                                              základ
src/shell/     xShell    menu, pauza, nastavení (od 22. 11. 2026 je pravda tady)   základ
src/world  src/render  src/phys  src/play  src/app     běh                           sešna A
src/gen  tools/forge  tools/bake  tools/searcher       obsah a nástroje              sešna B
test/           t* základ · a_* sešna A · b_* sešna B
docs/           00 vize · 01 architektura · 02 kontrakty · 02a pole formátu · 03 názvosloví
                04 sešny · 05 parita 2003 · 06 rozpočty · STATE · REQUIREMENTS · DECISIONS
                sesny/ zadání a stavy sešen · navrhy/ návrhy změn
```

## Pro sešny

Začni v `CLAUDE.md` (mapa, kde co je) a `TODO.md`. Zadání je v `docs/sesny/START_A.md`, `START_B.md` nebo `START_SVOD.md`. Moduly a kdo je vlastní: `docs/01_ARCHITEKTURA.md`, oddíl 9.

## Licence a původ

Kód a zlatý vzorek jsou vlastní dílo projektu. Knihovny: three (MIT), Rapier (Apache 2.0), three-mesh-bvh (MIT), esbuild (MIT). Shell v `src/shell` pochází z repa `vibe-game-frameworks` téhož autora.
