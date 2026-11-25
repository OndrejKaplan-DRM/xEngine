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

## Zkouška (D-043), 24. 11. večer

Za přepínačem `?lightmap=5` nebo `?lightmap=10` (cm) a `&lmcell=` (výchozí `c_hall`) v sestavení „vlna 2, krok 6“; kód `src/world/lightmap.js`, testy `a_43_lightmap.mjs` (Node, 8) a `a_43_view.cjs` (prohlížeč, 5).

- Plochy statických dávek vybraných buněk se rozloží na mapy (spojené trojúhelníky jedné roviny; trojúhelník pláště válce sám), poskládají do atlasu po řádcích (okraj 2 body) a dostanou UV 1. Bod = střed texelu uvnitř trojúhelníku; okraje map převezmou hodnotu sousedů (předpočítané pořadí).
- Světlo stejně jako po vrcholech: `lightIrradiance` ze základu, zastínění a brány z `occlusion.gateOf`. Bez okraje stínu po podílech (bod 5 cm je ostrý sám). Hodnota = E × barva (a π × okolní člen) v RGBA half float; `MeshBasicMaterial.lightMap` ji dělí π. V místě vrcholu dá textura totéž co světlo po vrcholech (medián poměru 1,0000 na 65 161 vrcholech).
- Vrstvy po světlech a branách: přepnutí lampy nebo otevření dveří texturu jen složí znovu (5 cm: 55 ms v sandboxu) a nahraje.
- Zapečený soubor (D-044) se s ní nekombinuje: textura se počítá při načtení vždy.

| hala xLabu (sandbox, softwarové vykreslení) | 10 cm | 5 cm |
|---|---|---|
| atlas, paměť (half float RGBA) | 1 024 × 512, 4 MB | 2 048 × 1 024, 16 MB |
| bodů na plochách, map | 263 641, 337 | 1 035 102, 337 |
| paprsků zastínění | 682 201 | 2 688 304 |
| výpočet při načtení | 1,2 až 1,7 s | 3,9 až 5,4 s |

**T460 (Ondřej, 24. 11. 23:13 až 23:16, sestavení krok 6, 1 678 × 768, bez vyhlazování, jedna karta):**

| xLab | bez textury světla | hala 10 cm | hala 5 cm |
|---|---|---|---|
| `draw.ms` medián / 95 % / nejvíc | 2,51 / 3,24 / 4,01 | 3,24 / 3,91 / 10,85 | 3,24 / 4,18 / 9,00 |
| výpočet textury při načtení | – | **1 772 ms** | **6 104 ms** |
| nejdelší snímek (zástava při načtení) | 50 ms | 2 598 ms | 6 962 ms |
| paměť textury | – | 4 MB | 16 MB |
| pevná práce: 5 000 paprsků | 12,8 ms | 11,0 ms | 11,8 ms |

Závěr pro rozhodnutí (D-043): **vykreslení s texturou světla je na T460 levné** (medián +0,7 ms v celé trase, 95 % +0,7 až +0,9 ms; textura je jen v hale, takže rozdíl je spíš horní mez). **Výpočet při načtení ne**: jedna hala po 5 cm 6,1 s a stránka stojí; odpovídá to rychlosti paprsků (2,7 mil. paprsků při 11,8 ms na 5 000 = 6,3 s). Celý level (`complex_7`, odhad 3,2 mil. bodů a 124 světel) jde jen zapéct v xBake předem. Paměť 16 MB na halu, pro `complex_7` po 5 cm odhadem 32 MB jedné vrstvy (half float), pro přepínaná světla víc.

## Rozhodnutí

Směr přijat, formát odložen (D-043, 24. 11. 2026): data smějí nést texturu světla (D-029); sešna A po A2.6 udělá zkoušku na hale xLabu s bodem 5 cm i 10 cm a `?bench` na T460 s ní i bez ní. Formát vrstvy, atlas ploch (funkce v základu) a změna D-022 se rozhodnou podle toho čísla.
