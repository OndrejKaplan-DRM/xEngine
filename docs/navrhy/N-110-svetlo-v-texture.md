# N-110: Světlo v textuře pro jemné stíny (bod 5 cm)

Sešna: A · Datum: 2026-11-24 · Stav: otevřený

## Co potřebuju

Rozhodnutí, jestli zapečené světlo ponese vedle vzorků po vrcholech i texturu světla (bod 5 cm), a jestli ji smí číst už stupeň `low`.

## Proč to bez toho nejde

Ondřej 24. 11. 2026, po zkoušce mřížky 0,25 m na T460: „chci ještě míň, chci 0,05 m“. Světlem po vrcholech to nejde, čísla:

| | xLab | `complex_7` |
|---|---|---|
| plocha stavby | 3 618 m² | 7 954 m² |
| vzorků při 0,5 m (dnes) | 22 898 | 151 952 včetně dílů prefabů |
| bodů při 5 cm | 1,45 mil. | 3,18 mil. |
| trojúhelníků, kdyby to byly vrcholy | asi 2,9 mil. | asi 6,4 mil. |
| rozpočet viditelných trojúhelníků na T460 | 300 tisíc | 300 tisíc |
| stavba vrstev na T460 při 0,5 m / 0,25 m (změřeno, F3) | 1,2 s / 1,5 s | 24,3 s / 44,4 s |

Plochy spočítal `levelLightMeshes`, časy jsou z Ondřejových snímků F3 z 24. 11. Počet trojúhelníků při 5 cm je odhad (dva na bod). Síť po 5 cm by rozpočet překročila desetkrát až dvacetkrát.

Co by 5 cm dalo, ukazuje `xLab_podlaha_haly_stiny_2026-11-24.png` (podlaha haly shora, stejné světlo a zastínění, tři jemnosti). Jen podlaha haly: 145 600 bodů, 641 414 paprsků, 1,1 s v sandboxu.

## Návrh

1. **Data nesou nejvyšší kvalitu (D-029):** xBake vedle vrstev po vrcholech zapeče texturu světla: atlas ploch levelu, bod 5 cm, vrstvy jako dnes (`light`, `entity`, úseky s `gate` podle D-035). xLab se vejde do 2 048 × 2 048 bodů, `complex_7` těsně také (3,18 mil. z 4,19 mil.), nebo do 4 096 × 4 096 s rezervou.
2. **Běh vybírá stupeň:** vrcholy zůstávají pro stupeň, který texturu neunese. Jestli ji `low` unese, řekne měření: xBench 0.2 dává na T460 za jednu texturu 0,6 až 1,1 ms při 1 366 × 768. Textura světla a textura barvy jsou dvě čtení na bod.
3. **Přepínaná světla a dveře:** pevná světla v jedné textuře; přepínané lampy a brány dveří ve druhé, čtyři vrstvy v kanálech RGBA na buňku, úroveň vrstvy jako číslo v shaderu. Přepnutí lampy pak nestojí nic na procesoru.
4. **Počítat při načtení to nejde:** `complex_7` má při 5 cm asi 64 mil. paprsků (20 na bod, 124 světel); to je práce pro xBake, ne pro start hry.

## Dopad

- Mění D-022 („světlo po vrcholech“) na „světlo po vrcholech, nebo v textuře podle stupně“. Rozhoduje Ondřej a svodná sešna.
- Sešna B: xBake a formát N-001 dostanou další druh vrstvy a atlas (souřadnice do atlasu musí být kontrakt jako dnes pořadí vzorků).
- Sešna A: materiál se dvěma texturami, souřadnice atlasu u sítě, čtení vrstev.
- Základ: funkce, která plochám přidělí místo v atlasu (jedna pravda pro xBake i běh).

## Dočasné řešení

Okraj stínu po podílech (výchozí) a volitelná mřížka 0,25 m (`?grid=0.25`, nastavení Mřížka světla). Jemnější mřížku než 0,25 m nenabízím: v xLabu by 0,125 m dalo asi 290 tisíc vzorků a v `complex_7` víc než milion.

Navrhuju první krok jako zkoušku na jednom kusu: textura světla jen pro halu xLabu, spočtená při načtení za přepínačem, a `?bench` na T460 s ní a bez ní. Podle čísla se rozhodne zbytek.

## Rozhodnutí

