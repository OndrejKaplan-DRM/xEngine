# xEngine

Engine pro 3D z pohledu první osoby v prohlížeči, datový formát xSpace a nástroje kolem něj. Cílový stroj: Lenovo T460 (Intel HD 520, 8 GB).

**Stav: základ 1 (22. 11. 2026).** Hotové jsou kontrakty, jádro, formát dat s validátorem, zkušební level xLab, prohlížeč dat a měření stroje. Engine sám vzniká ve vlně 1. Podrobně `docs/STATE.md`.

## Rychlý start

```text
npm install
npm test            jádro, formát, zlatý vzorek, sestavení, prohlížeč dat, měření (165 kontrol)
npm run build       dist/xview.html a dist/xbench.html
npm run check       kontrola zlatého vzorku validátorem
```

- `dist/xview.html`: prohlížeč zkušebního levelu (otevři dvojklikem).
- `dist/xbench.html`: měření stroje. Spusť na T460 a pošli výsledek; podle něj se nastaví rozpočty.

## Mapa

```text
src/kernel      xKernel   systémy, fáze, události, pevný krok                      základ
src/xspace      xSpace    formáty, validátor, geometrie, kostry                     základ
packs/golden              zlatý vzorek: level xLab a 12 prefabů                     základ
tools/golden              generátor zlatého vzorku                                   základ
tools/xview     xView     prohlížeč balíku                                           základ
tools/xbench    xBench    měření stroje                                              základ
vendor/         xShell    Shell z vibe-game-frameworks (připnutá kopie)              základ
src/world  src/render  src/phys  src/play  src/app     běh                           sešna A
src/gen  tools/forge  tools/bake  tools/searcher       obsah a nástroje              sešna B
test/           t* základ · a_* sešna A · b_* sešna B
docs/           00 vize · 01 architektura · 02 kontrakty · 02a pole formátu · 03 názvosloví
                04 sešny · 05 parita 2003 · 06 rozpočty · STATE · REQUIREMENTS · DECISIONS
                sesny/ zadání a stavy sešen · navrhy/ návrhy změn
```

## Pro sešny

Začni v `CLAUDE.md`. Zadání je v `docs/sesny/START_A.md`, `START_B.md` nebo `START_SVOD.md`.

## Licence a původ

Kód a zlatý vzorek jsou vlastní dílo projektu. Knihovny: three (MIT), Rapier (Apache 2.0), three-mesh-bvh (MIT), esbuild (MIT). Shell ve `vendor/` pochází z repa `vibe-game-frameworks` téhož autora.
