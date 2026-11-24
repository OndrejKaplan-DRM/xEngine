# N-011: `?bench` kývá pohledem a měřením samo srazí hru na 30 snímků/s

Sešna: B (hlášení pro sešnu A, `src/app/bench.js`) · Datum: 2026-11-25 · Stav: otevřený

## Co potřebuju

Aby měření `?bench` na T460 ukazovalo plynulou hru a rozestup snímků bez vlivu samotného měření.

## Proč to bez toho nejde

Ondřej 25. 11. 0:19 po běhu `xlab_gen.html?level=complex_7&bench` na T460 (jedna karta, nastavení 90°, 1 080 řádků, vyhlazování zapnuto, mřížka světla 0,25 m): „obraz celou dobu skáče zleva doprava… je to celou dobu schválně tak kývavá chůze?“ a „mám podezření, že máš v testu nějakou chybu“. Obojí sedí:

1. **Kývání je chyba řízení robota, ne záměr.** Robot (`bench`, fáze `input`) se registruje až po systému `input` (vzniká v `createGame`), takže `input.step()` v témže kroku sebere otočení z kroku předchozího a robot počítá odchylku od úhlu, ve kterém ještě není jeho poslední příkaz. Otočení je plná odchylka omezená na 2° za krok (240 °/s při 120 Hz). Zpoždění o jeden krok se zesílením 1 je netlumená smyčka: e(k+1) = e(k) − e(k−1), kořeny e^(±iπ/3), kmit s periodou 6 kroků, tedy 20 Hz. Na obrazovce s 30 snímky/s to vypadá jako škubání zleva doprava.
   - Změřeno v Node (sandbox, engine ze `zaklad-2`, `complex_7`, robot se stejným zákonem řízení, 0,75 s chůze k bodu 6 m vpředu a 1,2 m stranou): pořadí `input → robot → player`, **10 obratů směru otáčení za 88 kroků**, po krocích −1,35 0,69 2,00 1,65 −0,09 −1,43 −0,95 °. Se započtením odeslaného a ještě nepoužitého otočení: **1 obrat**, pohled plynule dosedne (−0,97 0,06 0,13 0,19 …).
2. **30 snímků/s způsobuje měření.** Každý měřený snímek se kvůli času vykreslení nakreslí ještě `repeat`krát a čte se bod (`gl.readPixels`), dokud dávka netrvá 12 až 40 ms. Ta dávka přibude ke každému snímku: práce snímku medián 16,4 ms + dávka ≥ 12 ms ≈ 33 ms, což je přesně naměřený rozestup 33,4 ms (29,9 snímků/s). Věta výsledku „Rozestup snímků: medián 33,4 ms = 29,9 snímků/s“ tedy o hře neříká nic.
3. **Nastavení ve výstupu jsou jen zčásti:** řádky (`env.rowsChosen`, `rowsCapped`), vyhlazování (`env.antialias`) a mřížka světla (`level.lightGrid`) tam jsou, **zorné pole chybí**.
4. **33 s výpočtu světla při startu** (`level.lightBuildMs` 33 315 ms, 368 136 vzorků při mřížce 0,25 m) se při změně nastavení během měření promítne do `intervalMs.max` 35 394 ms. Medián to nekazí, ale je to vidět.

## Návrh

1. Robot si pamatuje otočení, které poslal a hráč ho ještě nepoužil, a odečte ho od odchylky (`d = cíl − yaw − čeká`), nebo systém `input` dostane `after: ['?bench']`. Totéž u `input.hold('fwd', …)`, které je také o krok pozadu.
2. Čas vykreslení měřit dávkou jen v každém n-tém snímku (třeba 1 z 10) a rozestup snímků počítat jen ze snímků bez dávky; ve výsledku psát obojí zvlášť.
3. Do `env` přidat `fov` (stupně) a do věty výsledku vypsat nastavení: řádky, vyhlazování, zorné pole, mřížku světla.
4. Měřit až po dokončení výpočtu světla; čas výpočtu vypsat zvlášť (už je v `lightBuildMs`).

## Dopad

Jen `src/app/bench.js` (sešna A). Starší výsledky `?bench` mají rozestup snímků zkreslený měřením; platí z nich `workMs`, `draw.ms`, `step`, `calls` a `tris`.

## Dočasné řešení

Žádné; soubor patří sešně A. Ondřejovi jsem napsala, které hodnoty z jeho běhu platí.

## Rozhodnutí

(vyplní svodná sešna)
