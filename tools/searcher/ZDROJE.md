# xSearcher: dosažitelnost zdrojů ze sandboxu

První krok úkolu B1.4. Změřeno **22. 11. 2026 kolem 14:00** z pracovního prostředí sešny B příkazem `curl` (časový limit 12 až 20 s, přes výchozí proxy prostředí). Nástroj `find.mjs` zatím neexistuje; tady je jen měření, na kterém bude stát.

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
