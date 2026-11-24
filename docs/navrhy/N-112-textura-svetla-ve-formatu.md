# N-112: textura světla ve formátu a v xBake (bod 5 cm)

Sešna: A · Datum: 2026-11-25 · Stav: otevřený

## Co potřebuju

Ondřej 24. 11. 23:58 k otázce po zkoušce N-110: **(a) textura světla do formátu a do xBake s bodem 5 cm.** Potřebuju od základu atlas ploch (jedna pravda pro xBake i běh) a formát souboru s vrstvami světla po bodech textury; od sešny B zapékání.

## Proč to bez toho nejde

Zkouška N-110 (D-043), změřeno na T460 24. 11. 23:16 (tabulka v N-110, oddíl Zkouška):

- vykreslení s texturou světla je levné: medián 2,51 → 3,24 ms, 95 % +0,7 až +0,9 ms (768 řádků);
- výpočet při načtení ne: jedna hala xLabu po 5 cm 6,1 s (2,7 mil. paprsků), stránka po tu dobu stojí;
- po vrcholech 5 cm nejde (xLab 1,45 mil. bodů, `complex_7` 3,18 mil.; rozpočet T460 300 tisíc △).

Textura tedy musí přijít hotová ze xBake jako zapečené světlo po vrcholech (D-044).

## Velikosti (sandbox, kód zkoušky `src/world/lightmap.js`, bez zjemnění okraje stínu)

| | bodů na plochách | atlas (half float RGBA v paměti grafiky) | vrstvy světel: varint + half / gzip | paprsků |
|---|---|---|---|---|
| xLab celý, 10 cm | 392 230 | 1 024 × 1 024, 8 MB | 1,6 / 0,8 MB | 1,16 mil. |
| xLab celý, 5 cm | 1 527 577 | 2 048 × 1 024, 16 MB | 6,4 / 3,1 MB | 4,52 mil. |
| `complex_7`, 10 cm | 1 119 884 | 2 048 × 2 048, 32 MB | 6,0 / 3,1 MB | 22,8 mil. (61 s) |
| `complex_7`, 5 cm (odhad ×4) | asi 4,5 mil. | 4 096 × 2 048 až 4 096², 64 až 128 MB | asi 24 / 12 MB | asi 90 mil. |

Plyne z toho: (1) `complex_7` po 5 cm potřebuje v grafice 64 MB i při lepším skládání atlasu, s 8 bity na kanál (RGBM) 32 MB; (2) soubor se vrstvami má smysl jen zkomprimovaný (gzip v prohlížeči přes `DecompressionStream`); (3) data se do limitu kódu nepočítají (zadání bod 5, změna 2), ale prodlouží stahování a start.

## Návrh

1. **Základ: atlas ploch** `lightmapAtlas(level, prefabs, materials, texel)` v `src/xspace` (jedna pravda pro xBake i běh, jako `levelSamples`). Mapa = plocha (skupina `levelLightMeshes` kvádru, stěna pevného dílu prefabu); plášť válce se do atlasu nedává a zůstává po vrcholech. Deterministické skládání (pořadí ploch jako `levelSamples`), okraj 2 body. Výstup: rozměr atlasu, pro každý vzorek `levelSamples` jeho UV 1 (nebo „mimo atlas“), pro každý bod atlasu poloha a normála. Kód zkoušky (`chartsOf`, `pack`, rasterizace středů bodů) je k dispozici; pro základ ho je třeba přepsat ze statických dávek běhu na plochy `levelSamples`.
2. **Formát:** nový soubor `levels/<id>.lightmap.bin` vedle `levels/<id>.light.bin` (ten zůstává: odraz, přístupnost okolního světla a přímé světlo vzorků mimo atlas). Hlavička: `texel`, `width`, `height`, otisk atlasu (geometrie + texel), vrstvy jako N-001 (`light`, `entity`, úseky s `gate`), jen řídké po bodech atlasu a s hodnotou v half float; celé tělo gzip.
3. **xBake (sešna B):** body atlasu jsou další vzorky se stejným pravidlem paprsku (D-044). Zjemnění okraje stínu při 5 cm spíš 2 × 2 než 4 × 4 (bod je ostrý sám).
4. **Běh (sešna A):** přímé světlo z textury, odraz a okolní člen dál po vrcholech: shader `diffuse × (barva vrcholu + lightMap / π)` (dnes MeshBasicMaterial násobí, změna přes `onBeforeCompile`). Přepnutí lampy skládá jen body té lampy (dnes zkouška skládá celou texturu, 55 ms na halu). Stupeň `low` smí texturu zmenšit na 10 cm (průměr 2 × 2), když paměť nestačí (D-029).
5. **Pořadí:** základ (atlas, formát, validátor) → B (zapékání xLabu a `complex_7`) → A (čtení, shader, přepínání) → `?bench` na T460 v `complex_7`.

## Dopad

- Mění D-022 na „přímé světlo statického světa v textuře, kde ji data nesou; jinak a pro odraz po vrcholech“.
- N-111 (soubory balíku ve stránce) je předpoklad: bez něj se `.lightmap.bin` do hry nedostane stejně jako `.light.bin`.
- Zlatý vzorek: zapečené soubory nejsou jeho součástí (vyrábí je xBake); testy A si soubor vyrobí samy jako u D-044.

## Dočasné řešení

Zkouška za přepínačem `?lightmap=5|10` (počítá se při načtení, jen vybrané buňky). Výchozí běh beze změny.

## Rozhodnutí

(vyplní svodná sešna)
