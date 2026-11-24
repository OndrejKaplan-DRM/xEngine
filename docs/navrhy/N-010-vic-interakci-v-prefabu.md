# N-010: Víc interakcí v jednom prefabu

Sešna: B · Datum: 2026-11-24 · Stav: otevřený

## Co potřebuju

Prefab nábytku s několika pohyblivými díly, z nichž každý jde ovládat zvlášť: kartotéka se čtyřmi zásuvkami, stůl s kontejnerem, později skříň se dvěma dvířky a zásuvkou, kuchyňská linka.

## Proč to bez toho nejde

Formát verze 1 má v prefabu jednu interakci (`components.interact` je jeden objekt s jedním `joint`). Kostra unese kloubů víc, ale hráč může ovládat jen jeden. Ondřej 24. 11. 2026 v 19:55: „chci možnost otevírat i spodní šuplíky nezávisle na prvním“. Do té doby se v kartotéce hýbala jen horní zásuvka a tři spodní byly pevné.

## Dočasné řešení (na větvi `sesna-b` od `8d52fb5`)

- Korpus (`cabinet_file_01`, `desk_office_01`) je prefab bez kloubu. Zásuvky jsou samostatné prefaby (`drawer_file_01`, `drawer_desk_01`), každá se svým kloubem a interakcí.
- Korpus je jmenuje v `source.params.attach: [{ prefab, pos, ry? }]` (poloha v prostoru korpusu, natočení kolem Y ve stupních). Pole `source.params` je volné, formát se nemění a validátor nehlásí nic.
- Generátor (`src/gen/furnish.js`, `tryPlace`) postaví zásuvky jako vlastní entity hned za korpusem; katalog (`src/gen/catalog.js`: `attachments`, `restBox`, `sweptBox`) počítá obaly i se zásuvkami, takže místo před kartotékou zůstane volné pro vytažené zásuvky.
- Engine sešny A nemusí o vztahu nic vědět: v `complex_7` se spodní zásuvka otevře sama, třetí vytáhne hráč myší a ostatní stojí (`test/b_t8_zasuvky.cjs`, 7 kontrol).

Nevýhody, kvůli kterým to není trvalé řešení:

1. **Víc entit.** Předvolba `complex` po změně: zásuvek 44 až 189 na level (medián 105 až 112 podle běhu), entit 412 až 714 (medián 510 až 543); bez samostatných zásuvek by entit bylo zhruba o pětinu méně. Cena v běhu (tělesa, volání kreslení) na T460 není změřená.
2. **Vztah není v datech levelu.** Kdo kartotéku posune nebo smaže (xDesigner, ruční úprava levelu), musí zásuvky dohledat podle polohy. Test to dělá na milimetr (`checkAttachments` v `test/b_lib/level-checks.mjs`).
3. **Spojení.** „Zamkni kartotéku“ jsou čtyři spojení na čtyři entity.

## Návrh

Varianta **a (doporučuju):** `components.interact` smí být seznam. Položka má navíc `id` (jedinečné v prefabu); `joint` určuje, který kloub ovládá, a tím i uzel. Hráč ovládá tu interakci, jejíž kloub hýbe uzlem zasaženého koliderou (kolider patří uzlu; uzel bez vlastního kloubu patří kloubu nejbližšího předka). Výstupy a vstupy entity dostanou volitelné upřesnění: ve spojení `{ on: 'opened', from: '<id interakce>' }` a vstup `{ input: 'open', to: '<id interakce>' }`; bez upřesnění platí pro všechny interakce prefabu (zamknout celou kartotéku jedním spojením).

Varianta **b:** pole prefabu `attach` ve formátu (to, co dnes dělám v `source.params`); engine postaví připojené entity sám a dá jim id `<id rodiče>.<k>`. Level zůstane malý a vztah je v datech, ale pořád jsou to samostatné entity.

Varianta **c:** zůstat u dnešního stavu (jen generátor).

## Dopad

- Varianta a: formát (validátor: `interact` jako objekt nebo seznam, `id` jedinečné, každý `joint` existuje a žádný kloub nemá dvě interakce), sešna A (výběr interakce podle zasaženého uzlu, upřesnění ve spojeních), sešna B (kartotéka a stůl zpět jako jeden prefab se 4 a 3 klouby, `attach` pryč, test B-T8 beze změny smyslu). Verze formátu: rozšíření zpětně slučitelné (jeden objekt dál platí).
- Varianta b: formát a engine A (stavba připojených entit), xDesigner; sešna B jen přesune pole.

## Rozhodnutí

(vyplní svodná sešna)
