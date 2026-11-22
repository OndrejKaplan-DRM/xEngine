# N-106: kde leží plocha obrazovky (`components.screen`)

Sešna: A · Datum: 2026-11-22 · Stav: otevřený

## Co potřebuju

Jednu větu ve formátu: kde vůči uzlu leží plocha obrazovky a kam míří její líc. A jednu větu o tom, co znamená `app`.

## Proč to bez toho nejde

`formats.js` u součásti `screen` uvádí `node`, `size`, `res`, `app`. Neříká, jestli plocha leží ve středu uzlu, v jaké rovině a jak daleko před díly uzlu. Engine na tu plochu kreslí obsah a počítá na ní polohu kurzoru; generátor sešny B musí vědět, kam na model monitoru má sklo dát, jinak bude text zapuštěný v rámu nebo viset před ním.

## Návrh

Do popisu součásti `screen` ve `formats.js` (a tím do `02a_XSPACE_pole.md`):

- „Plocha leží v rovině XY uzlu `node`, střed má v počátku uzlu, líc míří do +Z uzlu, osa X plochy je vpravo a Y nahoru.“
- Volitelné pole `offset` (číslo v metrech, výchozí 0): posun plochy po ose Z uzlu. Monitor zlatého vzorku by měl `offset: 0.022` (přední strana skla).
- `app`: „id obsahu obrazovky. Engine verze 1 zná jediný obsah, textovou konzoli; neznámé id se zobrazí jako konzole.“

## Dopad

Jedno volitelné pole ve formátu a dvě věty popisu. Stávající data zůstávají platná. `desk_terminal_01` ve zlatém vzorku dostane `offset: 0.022` (jinak plocha leží uprostřed tloušťky monitoru).

## Dočasné řešení

Engine pole `offset` zatím nemá odkud číst, proto si posun odvodí sám: plocha sedí 1 mm před nejpřednějším dílem uzlu (největší `max.z` kvádrů uzlu). Viz `src/play/interact.js`, `load()`. Pro monitor zlatého vzorku to dává 0,023 m. Jakmile pole `offset` vznikne, odvozování zmizí.

## Rozhodnutí

(vyplní svodná sešna)
