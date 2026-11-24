# N-102: `rigMatrices` bez alokací pro použití v kroku simulace

Sešna: A · Datum: 2026-11-22 · Stav: proveden v základu 24. 11. 2026 (znění 7 základu 2)

## Co potřebuju

Variantu `rigMatrices`, která zapisuje do předem připravených polí, aby pohyb kloubu nealokoval.

## Proč to bez toho nejde

Rozpočet vlny říká „žádné alokace ve smyčce kroku“. Matice kostry ale smí počítat jen `src/xspace/rig.js` a `rigMatrices(prefab, values)` při každém volání vyrobí: `Map` kloubů, `Map` uzlů, objekt výsledku a na každý uzel dvě až čtyři nová pole po 16 číslech (`mat4Mul`, `mat4Translate`, `mat4Euler`, `mat4AxisAngle`).

Engine ji volá jednou za krok pro každou entitu, jejíž kloub se právě hýbe (`src/world/entities.js`, `pose`). Otevírající se dveře tak dělají asi 120 × 10 krátkodobých objektů za sekundu. Halda neroste (test `a_15` to hlídá), ale sběr odpadu na T460 je přesně ten druh zadrhnutí, kterému se rozpočet snaží vyhnout. Až se budou hýbat tvorové s dvaceti kostmi, bude to řádově víc.

## Návrh

```js
/** Jednou při načtení prefabu: pořadí uzlů, rodiče, klouby, klidové místní matice. */
export function rigCompile(prefab) {} // → { order, parent, joint, local, count }
/** V kroku: zapíše matice uzlů do out (Float64Array délky 16 × počet uzlů), nic nealokuje. */
export function rigSolve(compiled, values /* Float64Array podle pořadí kloubů */, out) {}
```

`rigMatrices` zůstane jako pohodlná obálka nad nimi (nástroje, testy), takže existuje pořád jedna implementace.

## Dopad

Jen `rig.js` a test T1 (shoda `rigSolve` s `rigMatrices` na zlatém vzorku). Sešny B se netýká. Verze formátu se nemění.

## Dočasné řešení

Volám `rigMatrices` jen pro entity s kloubem v pohybu a jen v krocích, kdy se hodnota změnila; součin s maticí entity dělám do připraveného pole (`mul4` v `src/phys/xform.js`).

## Rozhodnutí

**Přijato** (svodná sešna, 22. 11. 2026, D-034). `rigCompile` a `rigSolve` vzniknou v `rig.js`, `rigMatrices` zůstane obálkou. Provede svodná sešna dřív, než sešna B dodá prvního tvora s kostrou; do té doby stačí dočasné řešení sešny A (halda podle `a_15` neroste).

**Provedeno** (svodná sešna, 24. 11. 2026 v noci, `c4bac67`). V `src/xspace/rig.js`:

- `rigCompile(prefab)` jednou na prefab: `count`, `nodeIds`, `nodeIndex`, `order` (rodič před dítětem), `parent` (−1 = kořen), `joint` (index kloubu uzlu, −1 = bez kloubu), klidové místní matice `local` (posun · natočení), pole kloubů (`jointIds`, `jointIndex`, typ, osa, meze, klid) a pořadí svázaných kloubů (N-002).
- `rigValues(compiled, values)` → `Float64Array` hodnot kloubů v pořadí `jointIds`; `NaN` = klidová poloha. Volá se mimo krok (alokuje).
- `rigFollow(compiled, values)` dopočítá svázané klouby v poli na místě (totéž co `jointFollow`).
- `rigSolve(compiled, values, out)` zapíše matice uzlů do `out` (`Float64Array` 16 × `count`, uzel `i` od `16 i`) a vrátí `out`. Nealokuje; ořez na meze dělá sám.
- `rigMatrices(prefab, values)` zůstává jako obálka (kompiluje při každém volání, pro nástroje a testy).

Shoda: `rigSolve` i obálka dávají bit po bitu totéž co původní rekurzivní výpočet. T1b: 40 případů na prefabech zlatého vzorku (klid, meze, třetina rozsahu, hodnota za mezí), největší rozdíl 0. Mimo testy: 802 případů na 478 prefabech (`golden`, `kit_base` základu i sešny B, `kit_lab`, `kit_it` ze `sesna-b`), rozdíl 0. Rychlost jen pro představu, sandbox: 100 000 kroků kostry se 4 uzly a 3 klouby (`rigFollow` + `rigSolve`) 62 ms; o T460 to nic neříká.
