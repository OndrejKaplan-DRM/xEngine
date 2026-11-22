# N-102: `rigMatrices` bez alokací pro použití v kroku simulace

Sešna: A · Datum: 2026-11-22 · Stav: otevřený

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

(vyplní svodná sešna)
