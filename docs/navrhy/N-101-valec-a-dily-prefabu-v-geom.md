# N-101: síť a kolize dílů prefabu (válec) do `src/xspace/geom.js`

Sešna: A · Datum: 2026-11-22 · Stav: přijatý a provedený

## Co potřebuju

Jedinou implementaci toho, jak vypadá díl prefabu tvaru `cyl` (a `box`) jako síť a jako kolizní tvar, vedle `brushMesh` a `brushCollider`.

## Proč to bez toho nejde

Kvádr dílu beru z `brushMesh({ min, max })`, to je v pořádku. Válec ale základ nemá: xView si ho staví přes `THREE.CylinderGeometry(r, r, h, 16)` a otočení podle osy (`tools/xview/main.js`, `addPart`), engine si ho musí postavit sám a xBake sešny B bude potřebovat třetí kopii. Tři kopie téhož dělení válce jsou přesně to, čemu má `geom.js` bránit: stačí, aby se jedna lišila počtem dílků nebo otočením, a zapečené světlo nesedne na geometrii ve hře.

Důkaz, že to dnes drží jen náhodou: `test/a_14_view.cjs` porovnává snímky xLab × xView (rozdíl 0,01 až 0,18 z 255). Sedí proto, že jsem dělení a otočení opsala z xView.

## Návrh

Do `src/xspace/geom.js` (čisté funkce, bez knihoven, stejný tvar výstupu jako `brushMesh`):

```js
export const CYL_SEGMENTS = 16;
/** Síť dílu v prostoru jeho uzlu: { positions, normals, uvs, indices }, nebo null pro shape 'mesh'. */
export function partMesh(part) {}
/** Kolizní tvar: { type: 'box', half } | { type: 'cyl', radius, height, axis } | { type: 'ball', radius } + center; null pro hull a mesh ze souboru. */
export function partCollider(collider) {}
/** Počet trojúhelníků dílu (box 12, cyl 64) pro kontrolu pole tris. */
export function partTris(part) {}
```

Dohoda pro válec: osa `y` beze změny; `x` = otočení o +90° kolem Z, tedy (x, y, z) → (−y, x, z); `z` = otočení o +90° kolem X, tedy (x, y, z) → (x, −z, y). Vrcholy pláště v úhlech `i / 16 · 2π` od osy +Z směrem k +X (shodně s three.js). UV pláště: obvod v metrech × výška v metrech; víka: průmět v metrech.

## Dopad

- xView: nahradit `addPart` voláním `partMesh` (odpadne závislost na `CylinderGeometry`).
- Sešna B: xBake a `kit.html` berou díly odsud.
- Validátor může `tris` prefabu kontrolovat přes `partTris` (dnes ho jen přebírá).
- Verze formátu se nemění.

## Dočasné řešení

`src/world/parts.js` (`cylMesh`, `partMesh`, `colliderShape`). Po přijetí se soubor zmenší na import z `geom.js`.

## Rozhodnutí

**Přijato** (svodná sešna, 22. 11. 2026, D-034). `partMesh`, `partCollider`, `partTris` a `CYL_SEGMENTS` patří do `src/xspace/geom.js` s dohodou os z návrhu; xView je začne používat. Provede svodná sešna v základu během vlny 2 (dluh základu, první v pořadí, protože na něm stojí světlo dílů i xBake). Do té doby je vzorem `src/world/parts.js` sešny A; sešna B pro zastínění v xBake bere `colliders` prefabu, ne vlastní dělení válce.

**Provedeno 23. 11. 2026** (svodná sešna): `partMesh`, `partTris`, `partCollider` a `CYL_SEGMENTS` jsou v `src/xspace/geom.js` s dohodou os z návrhu; `partCollider` vrací `{ shape, center }` stejně jako dosavadní `colliderShape` sešny A. xView díly staví přes `partMesh`; počty volání a trojúhelníků v T2 se nezměnily. V T1 pět nových kontrol, mimo jiné že `tris` každého prefabu zlatého vzorku je součet `partTris` jeho dílů. Sešna A nahradí obsah `src/world/parts.js` importem ze základu.
