# N-005: průhlednost materiálu (sklo)

Sešna: B · Datum: 2026-11-22 · Stav: přijatý, pole je ve formátu

## Co potřebuju
Materiál, skrz který je vidět.

## Proč to bez toho nejde
Materiál má jen `alphaTest` (ostrý výřez podle textury). Sklo okna, okno digestoře, police lednice, průzory dveří a víčko centrifugy v sadě `kit_base` používají materiál `glass_pane`, který se kreslí jako neprůhledná světle modrá plocha. Za oknem digestoře tak není vidět pracovní prostor a průzorem dveří není vidět do místnosti.

## Návrh
`materials[].opacity` (číslo 0 až 1, výchozí 1). Hodnota pod 1 znamená průhledný materiál kreslený po neprůhledných, bez zápisu do hloubky. Validátor: `opacity < 1` a zároveň `alphaTest` je varování (dva různé způsoby průhlednosti).

## Dopad
- Sešna A: druhá dávka pro průhledné díly, řazení odzadu stačí po objektech. Cenu na T460 je potřeba změřit (xBench), průhledné plochy se kreslí přes sebe.
- Zapečené světlo: průhledný díl nevrhá stín (nebo jen částečný); patří do návrhu N-001.
- Zlatý vzorek beze změny, verze formátu se nemění.

## Dočasné řešení
`glass_pane` je neprůhledný materiál s povrchem `glass` (zvuk zásahu sedí). Po přijetí stačí doplnit `opacity` v `tools/forge/materials.mjs`.

## Rozhodnutí

**Přijato** (svodná sešna, 22. 11. 2026, D-033). `materials[].opacity` je ve `formats.js`; `opacity < 1` spolu s `alphaTest` dává varování `mat.alphaBoth`. Kreslení průhledných dílů je úkol sešny A ve vlně 2. Cena na T460 změřená není; patří do příštího xBench. Stín průhledného dílu řeší N-001.
