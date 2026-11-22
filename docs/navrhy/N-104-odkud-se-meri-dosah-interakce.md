# N-104: odkud se měří dosah interakce (`interact.range`)

Sešna: A · Datum: 2026-11-22 · Stav: otevřený

## Co potřebuju

Jednu větu v kontraktu: od čeho se počítá `components.interact.range`.

## Proč to bez toho nejde

`formats.js` říká jen „dosah v metrech“. Když se měří od očí (1,6 m nad zemí), lékárnička zlatého vzorku (`pickup_medkit_01`, dosah 1,6 m, leží na podlaze) jde sebrat, jen když hráč stojí skoro na ní a dívá se kolmo dolů: i ze vzdálenosti 0,8 m je od očí 1,75 m. Test `a_15_io` to chytil. Generátor sešny B by musel dosah předmětů na zemi nafukovat podle výšky očí, kterou nezná (je v profilu enginu).

## Návrh

Do `02_KONTRAKTY.md`, oddíl Interakce: „Dosah se měří od osy těla hráče (svislá úsečka od nohou po oči) k bodu, kam dopadl paprsek pohledu. Předmět musí být zároveň pod zaměřovačem a paprsek nesmí cestou narazit na nic jiného.“

Tím platí pro vypínač ve výšce očí totéž co dnes a předmět na podlaze je dosažitelný z téže vodorovné vzdálenosti.

Druhá možnost, kterou nenavrhuju jako výchozí: sebratelné předměty sbírat dotykem (jako Half-Life). Dá se přidat později příznakem u součásti `pickup`.

## Dopad

Jen text kontraktu. Data ani verze formátu se nemění. Sešna B může u předmětů na zemi nechat běžný dosah 1,6 m.

## Dočasné řešení

Engine už měří od osy těla (`src/play/interact.js`, `scan`).

## Rozhodnutí

(vyplní svodná sešna)
