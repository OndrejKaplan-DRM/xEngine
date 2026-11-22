# Stav

**Verze:** základ 1 · 22. 11. 2026 · větev `zaklad-1` (shodná s `main`)
**Další krok:** vlna 1, sešny A a B souběžně podle `docs/sesny/START_A.md` a `START_B.md`.

## Co je hotové (základ 1)

| Část | Kde | Stav |
|---|---|---|
| jádro: systémy, fáze, závislosti, deklarované události, pevný krok 120 Hz, režimy, uložení stavu | `src/kernel` | 41 kontrol v T0 |
| xSpace 1: popis formátů, validátor se stálými kódy nálezů, načtení a spojení balíků, geometrie kvádrů a klínů, matice koster | `src/xspace` | 101 kontrol v T1, z toho 53 mutací |
| zlatý vzorek: level xLab (5 buněk, 4 portály, 54 kvádrů, 20 entit, 10 světel, 11 spojení) a 12 prefabů s kostrou | `packs/golden`, `tools/golden/make.mjs` | bez nálezů, bajtově opakovatelný |
| xView: prohlížeč balíku (pět pohledů, vrstvy, validátor v prohlížeči) | `tools/xview` → `dist/xview.html` | 15 kontrol v T2 |
| xBench: měření stroje (16 případů) | `tools/xbench` → `dist/xbench.html` | 8 kontrol v T3 (jen že doběhne) |
| Shell S0 + S1 a katalog nabídek, připnuté na `vibe-game-frameworks@ab8557a` | `vendor/` | kontrola otisků |
| dokumenty: vize, architektura, kontrakty, názvosloví, rozdělení sešen, parita, rozpočty, požadavky, rozhodnutí | `docs/` | dokument polí se generuje a hlídá testem |

`npm test`: 165 kontrol, 0 selhalo (Node 22, Chromium bez grafické karty).

## Co hotové není

- **Engine.** Nic se zatím nedá projít. xView data jen kreslí.
- **Rozpočty pro T460** jsou odhad; xBench na skutečném stroji ještě neběžel.
- Shell je jen zkopírovaný, ne zapojený.
- Formát zapečeného světla (čeká na návrh N-001 od sešny B).
- Načítání `.glb`, textury, zvuk, tvorové, editor.

## Neověřeno

- Všechno, co se týká výkonu a vzhledu na skutečné grafické kartě. Snímky z xView jsou ze softwarového vykreslování.
- xBench: ověřeno jen, že všech 16 případů doběhne a vydá výsledek. Jestli měří rozumně, ukáže první běh na T460.
- Verze Rapieru 0.21.0 a three-mesh-bvh 0.9.18 jsou v základu připnuté, ale nic je zatím nepoužívá.
- Hodnoty pohybu pro profil `real` (Counter-Strike, Half-Life) mají jistotu 3/5.
- Ochranná známka Blender (důvod návrhu jména xForge) je uvedena z obecné znalosti, bez právního ověření.

## Otevřené pro Ondřeje

1. Spustit `xbench.html` na T460 a poslat výsledek.
2. Jméno nástroje: xForge, nebo xBlender (D-011).
3. Kde má dál žít Shell: ve `vibe-game-frameworks` (výchozí, D-006), nebo tady.

## Návrhy

Žádný otevřený. Přehled v `docs/navrhy/README.md`.
