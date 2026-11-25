# N-014: prokazatelná viditelnost (PVS) jako měřítko rozpočtu a zkouška, že nic nebliká

Sešna: B · Datum: 2026-11-25 · Stav: otevřený · Pro: svodnou sešnu (funkce do základu) a sešnu A (zkouška)

## Co potřebuju

1. **Do základu** funkci `levelPVS(level)` (od 25. 11. 2026 `src/gen/pvs.js`, kde podle ní generátor drží rozpočet 300 tisíc △ funkcí `fitPVS`; dřív `test/b_lib/pvs.mjs`; 170 řádků bez knihoven): pro každou buňku množina buněk, do kterých z ní vede přímka otvory portálů (všechny dveře otevřené). Je to **horní mez** toho, co smí běh kdy kreslit, a jedno měřítko rozpočtu pro generátor, xBench i běh.
2. **Od sešny A** zkoušku, že kreslení je mezi dvěma mezemi: nekreslí nic mimo PVS buňky kamery (rozpočet platí) a nevynechá nic, co je z oka skutečně vidět (místnost nebliká).

## Proč

Ondřej 25. 11. 2026 v 1:29 (volba 2 a): „Udělejme to jako ve hrách – chytře škrtejme, co není vidět. Ale opravdu prokazatelně – už několikrát na mě blikla při jiném projektu místnost, ke které jsem se blížil.“

Do teď hlídala B-T1 mez 300 tisíc △ pro **celý level**. To je přísné (nejhorší level 299 608 △ při 12 △ na kvádr, s kvádry po síti světla až 396 894 △) a nic neříká o tom, co je vidět. Na T460 změřený `?bench` (complex_7, 25. 11. 1:14) ukázal v pohledu nejvýš 149 094 △.

## Jak se PVS počítá (dnes v sešně B)

- Buňka C je z S vidět, když existuje přímka, která projde průměty všech otvorů na cestě S → … → C do půdorysu. Průmět přímky ve 3D, která otvory projde, projde i jejich průměty, takže výsledek je **nadmnožina** skutečné viditelnosti z kteréhokoli místa buňky S.
- Přímka z = a·x + b nebo x = a·z + b (|a| ≤ 1); každý otvor dá dvě lineární nerovnice v (a, b); proveditelnost je minimum konvexní funkce (ternární hledání). Otvory se berou o 1 µm širší (rezerva ve prospěch viditelnosti).
- Ověřené případy (B-T10): otvory v zákrytu, otvory dole-nahoře-dole, chodba za dva rohy, dva otvory v téže zdi, souměrnost, shoda s T460 (PVS `complex_7` při mřížce 0,25 m nejvýš 251 278 △ ≥ změřených 149 094 △; buňka s nejvíc voláními na T460, `c_corr_01`, je i buňka s největším PVS).

| Levely (sandbox, 200 seedů) | Nejvíc △ vidět z buňky (mřížka 0,5 m) | Celý level | Nejdelší řetěz portálů s výhledem |
|---|---|---|---|
| `complex` dvě patra | 88 168 až 205 314 | 195 496 až 396 894 | 3 až 7 |
| `complex` jedno patro | 92 576 až 229 174 | 224 389 až 346 231 | 3 až 7 |
| `catacombs` | 46 926 až 106 804 | 68 430 až 134 348 | 3 až 8 |

## Zkouška pro sešnu A (návrh)

Na cestě robota v T5 a v `?bench` pro každý snímek:

1. **Horní mez:** buňky, které `visibility.js` označí jako viditelné, ⊆ `levelPVS(level).get(buňka kamery)`. Selže-li, kreslí se něco, co vidět nejde (plýtvání), nebo je chyba v PVS.
2. **Dolní mez (nebliká):** z oka pustit mřížku paprsků přes celé zorné pole (třeba 64 × 36) proti kvádrům levelu v Rapieru; buňka každého zasaženého kvádru musí být v množině kreslených buněk. Hlavně v pásmu do 1 m před portálem a v rovině portálu (`PASS` 0,3 m, `NEAR` 0,02 m), kde portálové ořezy obvykle selhávají.
3. `MAX_DEPTH` 12 a `MAX_VISITS` 512: dnes je nejdelší řetěz s výhledem 8 (B-T1 to hlídá). Kdyby generátor jednou udělal delší, usekla by se viditelnost a místnost by blikla; B-T1 to ohlásí dřív.

## Dopad

- Základ: `src/xspace/pvs.js` (nebo `tools/lib`), dokument rozpočtu (`06_ROZPOCTY.md`: „300 tisíc △ viditelných z buňky podle PVS“).
- Sešna A: zkouška 1 a 2 v T5 a ve `?bench`; bez změny kreslení.
- Sešna B: B-T1 hlídá rozpočet podle PVS a délku řetězů (hotovo), B-T10 hlídá výpočet PVS.

## Rozhodnutí

(vyplní svodná sešna)
