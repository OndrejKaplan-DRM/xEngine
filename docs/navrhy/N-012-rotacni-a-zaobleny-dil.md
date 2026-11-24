# N-012: rotační a zaoblený díl ve formátu (místo .glb z xForge)

Sešna: B · Datum: 2026-11-25 · Stav: otevřený

## Co potřebuju

Dva nové tvary dílu prefabu, které spočítá `partMesh` v `src/xspace/geom.js` stejně jako kvádr a válec: **`lathe`** (rotační plocha z profilu) a **`rbox`** (kvádr se zaoblenými hranami).

## Proč to bez toho nejde

Ondřej 24. 11. 23:57: „lépe řeš kužely, válce, jehlany, i zaoblení… Ty děláš takové bizarní schodovité tvary… materiál je sklo, tak ať to tam i vypadá.“ Z kvádrů a 16stěnných válců se kužel, zaoblené dno ani tenká stěna postavit nedají. Laboratorní sklo bylo stoh válců (Erlenmeyerova baňka = pět válců nad sebou).

Dočasně to řeším dílem `mesh`, který formát umí: xForge vyrobí síť a zapíše ji do `packs/<sada>/meshes/*.glb`. Funguje to (engine A sítě kreslí, B-T9, T5 a hra v prohlížeči zelené), ale:

1. **Zapékání.** Vzorky světla (D-041, `src/xspace/samples.js`) berou jen pevné díly `box` a `cyl`. Díly `mesh` xBake nezapeče a běh je musí svítit sám. Dnes v `complex_7` 29 173 vrcholů sítí proti 222 430 vrcholům kvádrů a válců prefabů (13 %). S přestavbou celého inventáře podíl poroste.
2. **Generátor a kontroly bez souborů.** `src/gen` a `measure.js` soubory nečtou, místo prefabu měří z kvádrů, válců a kolizí. Proto B-T9 hlídá, že kolize obepínají sítě (do 3 mm), a válec, který přečnívá zadané kolize, nechávám válcem.
3. **Zkouška A × B v Node nevidí sítě.** `test/t5_axb.mjs` čte balík bez souborů (`readPackFull(dir)`), xWorld hlásí „soubor meshes/… ve hře není“ a počty volání kreslení v Node sítě nezahrnují. Prohlížečová část (`t5_axb_view.cjs`) je zahrnuje.
4. **Velikost.** Sítě `kit_lab` mají 4,2 MB (5 souborů .glb), `kit_it` 0,1 MB; tentýž tvar jako popis profilu má desítky bajtů.

## Návrh

Díl prefabu (formát verze 1, nové hodnoty `shape`):

```text
{ node, shape: 'lathe', profile: [[r, y], …], seg: 6–64, crease?: [indexy bodů s ostrou hranou], arc?: [a0, a1] (stupně), mat }
    rotační plocha kolem osy Y uzlu; profil v metrech, r ≥ 0 (bod s r = 0 je pól); líc vpravo od směru profilu
    (nahoru po vnější stěně = ven). Hladké normály kromě bodů v crease. Tenká stěna = jeden profil ven, přes okraj a dovnitř.
{ node, shape: 'rbox', min, max, radius, steps: 1–4, mat }
    kvádr se zaoblenými hranami a rohy; steps = úseky oblouku (1 = sražení s hladkou normálou, 108 △; 2 = oblé, 300 △).
```

- `partMesh`, `partTris`, `partCollider` (kolize jako obal: kvádr, u `lathe` válec z největšího poloměru) v `geom.js`; `samples.js` je pak zapeče jako ostatní pevné díly (D-041).
- Algoritmus je hotový a odzkoušený v `tools/forge/mesh/lathe.mjs` a `solids.mjs` (rotační plocha s póly a ostrými hranami, zaoblený kvádr); převezme se do základu beze změny výsledku.
- Validátor: profil aspoň 2 body, `seg` v mezích, `radius` ≤ polovina nejmenšího rozměru.

## Dopad

- Základ: `formats.js`, `geom.js`, `validate.js`, dokument polí; zlatý vzorek se nemění.
- Sešna A: kreslí díly přes `partMesh` jako dnes, nic dalšího.
- Sešna B: xForge zapíše místo .glb profil; soubory `meshes/*.glb` zmizí, kromě dílů, které nejsou rotační ani kvádr (hadice, spirála chladiče, deformované tvary). Ty zůstanou `mesh`.
- Testy: zkouška A × B v Node uvidí všechny díly; doporučuju i tak číst balík se soubory (`readPackFull(dir, { files: true })`).

## Dočasné řešení

Díly `mesh` v `packs/kit_lab/meshes/` a `packs/kit_it/meshes/` z xForge (`tools/forge/mesh/registry.mjs`, `glb.mjs`). Přechod na `lathe` a `rbox` je výměna funkce, která díl zapisuje (`meshPart` → popis tvaru).

## Rozhodnutí

(vyplní svodná sešna)
