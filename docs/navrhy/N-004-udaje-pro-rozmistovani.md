# N-004: údaje prefabu pro rozmisťování (způsob uchycení a rozměr otvoru)

Sešna: B · Datum: 2026-11-22 · Stav: otevřený

## Co potřebuju
Aby prefab sám řekl, jak se umisťuje (na podlahu, na zeď, na strop, na desku, do otvoru) a jak velký stavební otvor potřebuje.

## Proč to bez toho nejde
Generátor (a od vlny 2 xDesigner: „kliknu a objeví se“) musí vědět, kam prefab přichytit. Kontrakt určuje počátek prefabu podle druhu uchycení, ale druh uchycení v datech není. Teď to obcházím dvěma způsoby:

- výška nad podlahou u nástěnných prefabů je v pravidlech předvolby (`{ p: 'valve_gate_01', h: 110 }` v `src/gen/presets/complex.js`), takže kdo přidá nástěnný prefab bez `h`, postaví ho na podlahu;
- rozměr otvoru dveří čtu z `source.params.width` a `height` (`src/gen/catalog.js`, funkce `opening`), což je pole určené pro opakovatelnost generátoru, ne rozhraní. Z obalu (`bounds`) se otvor zjistit nedá: obal dveří zahrnuje rozsah pohybu křídla.

## Návrh
Nová volitelná součást prefabu v `COMPONENTS`:

```text
components.place
  mount    'floor' | 'wall' | 'ceiling' | 'top' | 'opening'   kam se prefab přichytává (počátek podle tabulky v kontraktech, oddíl 2)
  height   číslo 0 až 10      wall: obvyklá výška počátku nad podlahou v metrech
  opening  [šířka, výška]     opening: stavební otvor v metrech
  top      číslo 0 až 5       floor: výška plochy, na kterou jde něco postavit (deska stolu), v metrech
```

Validátor: `opening` vyžaduje pole `opening`; `wall` vyžaduje `height`.

## Dopad
- Jen čtenáři dat na straně nástrojů (xGen, xDesigner). Engine součást nepotřebuje a smí ji ignorovat.
- Zlatý vzorek beze změny, verze formátu se nemění.

## Dočasné řešení
`h` v pravidlech předvoleb, `source.params.width|height|top|seat` v prefabech sady. Po přijetí: `tools/forge/lib.mjs` doplní `components.place` z parametrů, `catalog.js` ho začne číst a `h` z pravidel předvoleb zmizí.

## Rozhodnutí
