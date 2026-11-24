# xSearcher: zdroje, licence a co je v příjmu

## Stav 24. 11. 2026: nástroj `find.mjs` (B2.3)

```text
node tools/searcher/find.mjs "<dotaz>" [--source polyhaven,ambientcg] [--limit 10]     hledání (dotaz smí být česky)
node tools/searcher/find.mjs --get <zdroj>:<id>[,…] [--res 2k] [--maps albedo,normal,arm] [--query "…"]
node tools/searcher/find.mjs --inbox                                                    co je v příjmu, sedí otisky?
--record <složka> uloží odpovědi rozhraní · --replay <složka> bez sítě · --out <složka> jiný příjem
```

- Stahuje do `packs/_inbox/<zdroj>/<asset>/` (mimo git, `packs/_inbox/.gitignore`) mapy a `record.json`: zdroj, id, název, licence s doložením, podmínky rozhraní, autor, adresa stránky a rozhraní, datum, dotaz, štítky, rozměr předlohy, rozlišení, u každého souboru velikost, SHA-256, adresa a MD5 (Poly Haven), u ambientCG otisk a obsah archivu.
- Selže-li kterýkoli soubor (velikost nebo MD5 nesedí na rozhraní), nezapíše nic. Do balíků nic nepřesouvá; položku `pack.json.assets` pro odvozený soubor připraví `packAsset` v `inbox.mjs`.
- **Brána:** jen `CC0-1.0`, zdroj musí mít licenci doloženou (stránka a datum přečtení), druh jen textura. Při pochybnosti ne. Validátor základu navíc odmítne v balíku s `free: true` jinou licenci než CC0 a vlastní (`license.notFree`); hlídá to `test/b_t7_searcher.mjs`.
- **Druhy:** `--type model` nástroj odmítne (Ondřej 24. 11. 2026, volba 2 a: z webu jen materiály a textury, tvary vlastní). `--type sound`: zdroj se strojovým rozhraním bez účtu a s CC0 zatím nemám.
- Za proxy sandboxu se nástroj sám spustí znovu s `NODE_USE_ENV_PROXY=1` (vestavěný `fetch` v Node jinak proxy nečte). Na stroji bez proxy se nic takového neděje.

### Licence a podmínky rozhraní (přečteno 24. 11. 2026)

| Zdroj | Licence assetů | Doloženo | Podmínky rozhraní |
|---|---|---|---|
| Poly Haven | CC0 pro všechno (textury, HDRI, modely), uvedení autora nepovinné | `https://polyhaven.com/license` | `https://github.com/Poly-Haven/Public-API/blob/master/ToS.md`: každé volání s vlastním User-Agent nebo Referer se jménem programu (2.4); uživatel programu musí vidět, že obsah je z Poly Haven (2.5, krátký popisek nebo „Powered by Poly Haven“); neomezovat výkon rozhraní (2.6). Assety zůstávají CC0 i po stažení. Nástroj posílá `xEngine-xSearcher/0.1 (+https://github.com/OndrejKaplan-DRM/xEngine)` a u výsledků i stažení vypisuje jméno zdroje. |
| ambientCG | „Creative Commons CC0 1.0 Universal“ pro všechny assety, uvedení autora nepovinné | `https://docs.ambientcg.com/license/` | `https://docs.ambientcg.com/api/`: zvláštní podmínky neuvádí; jen varování, že rozhraní nemusí být spolehlivé pro „enterprise-level“ použití |

Žádné z rozhraní licenci u jednotlivého assetu neuvádí; brána se opírá o licenci zdroje. Kdyby některý zdroj začal vést assety s jinou licencí, nástroj to nepozná. Doložení je potřeba občas přečíst znovu.

### Měření 24. 11. 2026 (z Node, přes proxy sandboxu)

| Adresa | Výsledek |
|---|---|
| `https://api.polyhaven.com/types` | 200, 29 B, 293 ms |
| `https://api.polyhaven.com/assets?t=textures` | 200, 857 289 B, 871 textur |
| `https://api.polyhaven.com/files/concrete_floor_worn_001` | 200, 37 057 B; mapy v 1k, 2k, 4k, 8k, u každé velikost a MD5 |
| `https://ambientcg.com/api/v2/full_json?type=Material&q=…` | 200; pro „concrete“ 67 materiálů |
| `https://ambientcg.com/api/v3/assets?q=concrete` | 200; nástroj ho zatím nepoužívá (v2 vrací název, rozměr a archivy v jedné odpovědi) |
| stažení 10 assetů (oddíl níže) | 7 × Poly Haven a 3 × ambientCG ve dvou dávkách za 3,1 s a 6,3 s, bez chyby |

### Co je v příjmu (24. 11. 2026, 2K, pro materiály sady `kit_base` ve směru „opotřebený provoz“)

Odvozené textury 512 px v balíku vyrábí `tools/forge/textures.mjs` (B2.4); přiřazení materiálů je v `tools/forge/kit/textures.mjs`.

| Zdroj | Asset | Pro materiál | Mapy | MB na disku | Rozměr předlohy (m) | Autor |
|---|---|---|---|---|---|---|
| Poly Haven | `concrete_floor_worn_001` | `concrete_raw` | albedo, normal, arm | 2,0 | 3 × 3 | Dimitrios Savva, Rico Cilliers |
| Poly Haven | `painted_plaster_wall` | `plaster_light`, `plaster_grey` | albedo, normal, arm | 9,3 | 2 × 2 | Amal Kumar |
| ambientCG | `Tiles107` | `tile_white` | albedo, normal, roughness, ao | 3,2 (archiv 6,7) | 1 × 1 | ambientCG |
| Poly Haven | `old_linoleum_flooring_01` | `lino_grey` | albedo, normal, arm | 6,6 | 1,99 × 1,99 | Charlotte Baglioni |
| ambientCG | `DiamondPlate008C` | `metal_floor` | albedo, normal, roughness, ao, metalness | 15,8 (archiv 24,3) | neuvedeno | ambientCG |
| Poly Haven | `rusty_painted_metal` | `steel_painted` | albedo, normal, arm | 5,8 | 2,2 × 2,2 | Amal Kumar |
| Poly Haven | `old_planks_02` | `wood_old` do 24. 11. večer, pak nepoužito (spáry prken v textuře se tloukly se škvírami prken ve tvaru) | albedo, normal, arm | 4,3 | 2 × 2 | Rob Tuytel |
| Poly Haven | `red_brick` | `brick_red` | albedo, normal, arm | 10,3 | 1,4 × 1,4 | Rob Tuytel |
| Poly Haven | `stone_brick_wall_001` | `stone_block` | albedo, normal, arm | 3,2 | 2,5 × 2,5 | Dimitrios Savva, Rico Cilliers |
| ambientCG | `Ground110` | `dirt_packed` | albedo, normal, roughness, ao | 22,1 (archiv 35,2) | 2,1 × 2,1 | ambientCG |

Pro B2.4 (24. 11. odpoledne) přibylo devět assetů pro materiály prefabů; čtyři z nich jsem po prohlédnutí nepoužila (odstín nebo kresba nesedí, viz `tools/forge/kit/textures.mjs`):

| Zdroj | Asset | Pro materiál | Mapy | MB na disku | Rozměr předlohy (m) | Autor |
|---|---|---|---|---|---|---|
| ambientCG | `Metal009` | `steel_brushed`, `steel_dark` | albedo, normal, roughness, metalness | 8,5 (archiv 16,7) | neuvedeno | ambientCG |
| Poly Haven | `castle_wall_varriation` | `stone_rough` | albedo, normal, arm | 6,8 | 2 × 2 | Rob Tuytel |
| Poly Haven | `kitchen_wood` | `wood_pine` do 24. 11. večer, pak nepoužito (bez suků) | albedo, normal, arm | 10,9 | 0,6 × 0,6 | Rob Tuytel |
| Poly Haven | `oak_veneer_01` | `wood_oak` do 24. 11. večer, pak nepoužito (dýha bez letokruhů) | albedo, normal, arm | 9,7 | 1,83 × 1,83 | Jenelle van Heerden |
| Poly Haven | `sandstone_blocks_05` | `stone_pale` | albedo, normal, arm | 7,1 | 3 × 3 | Rob Tuytel |
| Poly Haven | `metal_plate` | nepoužito (zelenorezavý slzičkový plech) | albedo, normal, arm | 9,1 | 0,5 × 0,5 | Rob Tuytel |
| Poly Haven | `monastery_stone_floor` | nepoužito (nepravidelné desky) | albedo, normal, arm | 9,6 | 1,8 × 1,8 | Amal Kumar |
| Poly Haven | `oak_veneer_05` | nepoužito (bez znatelné kresby) | albedo, normal, arm | 6,7 | 1 × 1 | Jenelle van Heerden |
| Poly Haven | `rough_block_wall` | nepoužito | albedo, normal, arm | 6,3 | 3,04 × 3 | Rob Tuytel |

Dřevo (24. 11. večer, Ondřej v 19:55: „realističtější barvu dřeva, sukovitost, trhliny, letorosty“). Vybírala jsem z náhledů 17 dřev Poly Haven a 24 dřev ambientCG (`test/out` jen v kontejneru) a z 2K originálů pěti kandidátů. Barvu materiálu teď sada bere z průměru fotky (odstín) a z albeda skutečného dřeva (jas), takže textura jde v barvě, ne v šedi:

| Zdroj | Asset | Pro materiál | Co má | MB na disku | Rozměr předlohy (m) | Autor |
|---|---|---|---|---|---|---|
| ambientCG | `Wood096` | `wood_pine` | smrk: suky, výsušné trhliny, letokruhy | 11,2 | 0,5 × 0,5 (domněnka z rozhraní) | ambientCG |
| ambientCG | `Wood049` | `wood_oak` | hnědý dub s vystouplými letokruhy | 13,2 | 0,8 × 0,8 (domněnka) | ambientCG |
| ambientCG | `Wood060` | `wood_old` | tmavé staré dřevo s jemnými trhlinami | 23,5 | neuvedeno | ambientCG |
| ambientCG | `Wood066` | nepoužito (mořené do červena, odstín 5,6× od dubu) | | 13,9 | 0,4 × 0,4 (domněnka) | ambientCG |
| ambientCG | `Wood098` | nepoužito (překližka se suky; záloha pro smrk) | | 9,8 | neuvedeno | ambientCG |

Celkem 24 assetů, 228,7 MB map (do 24. 11. odpoledne 19 assetů a 157,1 MB; archivy ambientCG se neukládají, jen jejich otisk). Prvních 10 mělo 82,5 MB, archivy 66,2 MB. Příjem je mimo git; znovu ho vyrobí `--get` se stejnými id (otisky v záznamech pak ukážou, jestli zdroj soubor mezitím změnil). Rozměr u ambientCG čtu jako centimetry (rozhraní jednotku neuvádí; domněnka podle čísel). ARM z Poly Haven je okolní stín (R), drsnost (G), kovovost (B) jako v glTF; u ambientCG jsou mapy zvlášť.

## Měření 22. 11. 2026: dosažitelnost zdrojů ze sandboxu

První krok úkolu B1.4. Změřeno **22. 11. 2026 kolem 14:00** z pracovního prostředí sešny B příkazem `curl` (časový limit 12 až 20 s, přes výchozí proxy prostředí). Tehdy nástroj `find.mjs` ještě neexistoval; tohle je měření, na kterém stojí.

Dosažitelnost se mezi sešnami může lišit. Nástroj proto musí selhání zdroje ohlásit a pokračovat a test musí běžet na uložených odpovědích, bez sítě.

## Zdroje ze zadání

| Zdroj | Co jsem zkusila | Výsledek | Závěr |
|---|---|---|---|
| Kenney | `https://kenney.nl/`, `https://kenney.nl/assets` | 403, 199 B | **nedosažitelný** |
| OpenGameArt | `https://opengameart.org/` | 200, 117 000 B | dosažitelný (stránky) |
| OpenGameArt | hledání `art-search-advanced?keys=crate&field_art_licenses_tid[]=4` | 200, 49 363 B | hledání s filtrem licence vrací stránku; stažení souboru assetu neměřeno |
| Poly Haven | `https://api.polyhaven.com/types` | 200, 29 B | rozhraní dosažitelné |
| Poly Haven | `https://api.polyhaven.com/assets?t=models` | 200 | seznam modelů s kategoriemi, štítky, autory |
| Poly Haven | `https://api.polyhaven.com/files/wooden_table_02` | 200 | klíče `Diffuse`, `nor_dx`, `nor_gl`, `Rough`, `Metal`, `AO`, `arm`, `gltf`, `fbx`, `usd`, `blend`; glTF v rozlišeních `1k`, `2k`, `4k` |
| Poly Haven | soubor `https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/wooden_table_02/wooden_table_02_1k.gltf` | 200, 2 687 B | **soubory jdou stáhnout** |
| Poly Haven | soubor `…/Models/jpg/1k/wooden_table_02/wooden_table_02_diff_1k.jpg` | 200, 178 379 B, `image/jpeg` | textury jdou stáhnout |
| ambientCG | `https://ambientcg.com/api/v2/full_json?limit=1` | 200, 8 167 B | rozhraní dosažitelné |
| ambientCG | `…/full_json?type=Material&limit=1&include=downloadData` | 200; `numberOfResults` 2 046 | 2 046 materiálů; odpověď nese adresy a velikosti archivů |
| ambientCG | soubor `https://ambientcg.com/get?file=Concrete034_1K-JPG.zip` | 200, 3 657 575 B, `application/zip` | **soubory jdou stáhnout** |
| Quaternius | `https://quaternius.com/` | 200, 82 613 B | dosažitelný (stránky) |
| Quaternius | `https://quaternius.com/packs/ultimatemodularruins.html` | 200, 15 231 B | stránka balíku ano; odkud se stahuje archiv, neměřeno |

Pozor na `https://dl.polyhaven.org/` bez cesty: vrací 521. Není to nedostupnost, kořen jen nemá stránku.

## Navíc (mimo zadání, pro pozdější rozšíření)

| Zdroj | Adresa | Výsledek |
|---|---|---|
| GitHub, surové soubory | `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/README.md` | 200, 6 294 B |
| GitHub, hledání repozitářů | `https://api.github.com/search/repositories?q=cc0+textures&per_page=1` | 200, 6 308 B |
| Wikimedia Commons, rozhraní | `https://commons.wikimedia.org/w/api.php?action=query&list=search…` | 200, 561 B |
| cgbookcase | `https://www.cgbookcase.com/` | 200, 68 953 B |
| ShareTextures | `https://www.sharetextures.com/` | 200, 396 005 B |
| Freesound | `https://freesound.org/` | 200, 462 118 B (stahování chce účet; neměřeno) |
| Sketchfab | `https://sketchfab.com/` | 202, 0 B: **neprošlo** (shoduje se se zadáním) |

## Velikosti, se kterými je třeba počítat

Sada map jednoho materiálu z ambientCG (`Concrete049`, z odpovědi rozhraní):

| Rozlišení | Archiv |
|---|---|
| 1K-JPG | 10 406 004 B |
| 2K-JPG | 36 432 631 B |
| 4K-JPG | 131 410 218 B |

Jeden materiál ve 4K je větší než celý dnešní engine i s daty. Originály patří do příjmové složky (`packs/_inbox`, mimo git), do balíků jen odvozené zmenšené verze. Podrobně `docs/navrhy/N-006-stupne-kvality-a-vrstvy-vzhledu.md`.

## Co z měření plyne pro nástroj

1. Poly Haven a ambientCG mají strojové rozhraní, stažitelné soubory a jedinou licenci pro všechno (podle jejich stránek CC0; při stavbě nástroje ověřit a licenci číst z odpovědi, kde ji rozhraní uvádí). Jsou to první dva zdroje nástroje a zároveň jediné dva z měřených, které nabízejí fotorealistické materiály a skenované modely.
2. OpenGameArt a Quaternius mají jen stránky. OpenGameArt míchá licence, takže brána „jen CC0, při pochybnosti NE“ se musí opřít o filtr hledání i o údaj na stránce assetu. Quaternius je stylizovaný, ne realistický.
3. Kenney je ze sandboxu odmítnutý (403). Nástroj ho má vést jako zdroj „nedosažitelný“, ne ho obcházet.
4. Zvuky: žádný ze zdrojů ze zadání je nenabízí ve strojové podobě bez účtu. OpenGameArt ano (stránky), Freesound chce účet. Zůstává otevřené.

## Neověřeno

- Stažení souboru assetu z OpenGameArt a z Quaternius (měřila jsem jen stránky).
- Licenční údaje jednotlivých zdrojů (znám je, v této sešně jsem je na stránkách nečetla).
- Jestli je dosažitelnost stejná v jiné sešně a v testech spouštěných svodnou sešnou.
