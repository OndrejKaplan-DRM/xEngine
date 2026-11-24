# N-111: binární soubory balíku ve hře (textury, .glb)

Sešna: A · Datum: 2026-11-24 · Stav: otevřený

## Co potřebuju

Aby sestavení vložilo do stránky i binární soubory balíku vyjmenované v `pack.json.assets` (textury WebP, modely `.glb`), včetně souborů balíků z `requires`, a aby je stejně dostaly testy v Node.

## Proč to bez toho nejde

A2.6 (D-030): engine umí díl `shape: "mesh"`, kolize `hull` a `mesh` z `.glb` a texturu barvy `albedo` (commit `6e1ab0c` a následující, testy `a_26_mesh.mjs` 30 kontrol, `a_26_view.cjs` 8 kontrol). `build.mjs` ale vkládá jen `globalThis.__PACK__ = JSON.stringify(readPackFull(...))`, tedy JSON. Kus ze sešny B (B2.5: dveře `.glb`, materiál s texturou) by v `dist/xlab_gen.html` neměl ani síť, ani texturu. Test v prohlížeči to dnes obchází pastí na globál `__PACK__` (`test/a_lib/browser.cjs`, volba `mutate`), hra pro Ondřeje to obejít nemůže.

## Návrh

1. **Kde soubory leží ve hře:** `pack.files`, objekt `{ "<id balíku>/<cesta vůči kořeni balíku>": hodnota }`. Hodnota v prohlížeči je řetězec base64 (tak ho vloží build), v Node `Uint8Array`. Engine (`src/world/assets.js`) přijme obojí i `ArrayBuffer`. Klíč nese id balíku, protože dva balíky můžou mít stejnou cestu (`textures/wall.webp`).
2. **`tools/lib/read-pack.mjs`:** `readPackFull(dir, { files: true })` přidá `files` pro hlavní balík i pro každý balík z `requires` (čte jen soubory z `manifest.assets`; ověření velikosti a otisku zůstává v `checkPackDir`). Bez volby beze změny.
3. **`build.mjs`:** cíl s `pack` volá `readPackFull(..., { files: true })` a soubory zakóduje do base64. Přírůstek je asi +33 % velikosti souborů; build vypíše jejich součet zvlášť (`data … kB, soubory … kB`).
4. **Původ materiálu po `mergePacks`:** prefaby nesou `from`, materiály jen seznam `foreignMaterials`. Navrhuju `materialFrom: { <id materiálu>: <id balíku> }`, aby se `albedo` hledalo v balíku, odkud materiál pochází. Do té doby engine zkouší hlavní balík a pak `requires` v pořadí (stejná cesta ve dvou balících by vzala první).
5. **Validátor:** odkaz `mesh` a `albedo` musí mířit na soubor ze `assets` (nový kód nálezu, třeba `asset.notListed`), uzel za `#` musí v `.glb` existovat (`asset.meshNode`). Engine to dnes hlásí až za běhu (F3: „CHYBÍ soubory“, konzole).

Otázka pro svodnou sešnu (D-029): jednosouborová hra s texturami 2K naroste rychle (odhad, neměřeno: jedna 2K WebP asi 0,5 až 2 MB, v base64 o třetinu víc). Engine na stupni `low` zmenšuje při dekódování na 512 px, takže velký originál stojí jen místo v souboru a čas dekódování. Možnosti: (a) vkládat originály a nechat zmenšení na běhu; (b) cíl sestavení zvolí strop (`"assetsMax": 512`) a build vloží odvozenou verzi, pokud ji manifest uvádí (sešna B odvozuje 512 px a 1K podle B_STAV). Pro T460 a jeden soubor bych volila (b), data dál nesou originál.

## Dopad

- Základ: `read-pack.mjs`, `build.mjs`, případně `mergePacks` a validátor. Formát se nemění (pole `assets`, `albedo`, `mesh` jsou od základu 1).
- Sešna B: nic povinného. Doporučení z práce na A2.6 níže.
- Testy: `t*` beze změny; `a_26_view.cjs` po přijetí může místo pasti číst soubory z buildu.

## Co engine umí a jak čte data (A2.6)

- `.glb` = glTF 2.0 binární, jen jeden vnitřní blok BIN (externí soubory a `sparse` ne), trojúhelníky. Čte polohy, normály, UV (`TEXCOORD_0`), indexy a transformace uzlů výchozí scény. Bez normál dopočítá normály ploch.
- Odkaz `soubor.glb#uzel` = uzel a jeho potomci; bez `#` celý model kromě uzlů `COL_*` a `*_LODn`. Souřadnice kořene modelu = souřadnice uzlu kostry prefabu, na který díl visí (+Y nahoru, metry).
- UV sítě z `.glb` se **nedělí** `uvScale` (glTF má vlastní UV 0..1); `uvScale` dál platí pro krabicovou projekci kvádrů a válců.
- Kolize `mesh` = síť trojúhelníků jen u pevných a kinematických těles; dynamické těleso (bedna) dostane konvexní obal týchž vrcholů (Rapier síť u dynamického tělesa nedovolí). Kolize `hull` = konvexní obal.
- Díl `mesh` bez `mat`: formát říká „bere se z glTF“. Engine zatím bere jen `baseColorFactor` prvního materiálu sítě, texturu uvnitř `.glb` ne. Doporučení pro B: u dílů `mesh` vyplňovat `mat` (materiál z `materials.json`, jedna pravda pro barvu, texturu, povrch a zvuk).
- Textura barvy: barva materiálu × textura × světlo vrcholu (zapečené i počítané světlo texturu násobí). Stupeň `low`: delší strana nejvýš 512 px (zmenšení při dekódování). Do dekódování se materiál kreslí jen barvou.
- Barva materiálu texturu **násobí** (formát: „základní barva (násobí texturu)“). Materiál s texturou z fotografie má mít barvu blízko `[1, 1, 1]`, jinak se ztmaví dvakrát (zkušební sestavení `xlab_tex`: šedé materiály xLabu × šum 150 až 255 jsou znatelně tmavší než bez textury).
- **Světlo na síti z `.glb` je po jejích vrcholech.** Velká rovná plocha ze dvou trojúhelníků má světlo jen ve čtyřech rozích (stojan v testu: celá přední stěna jedním odstínem). Doporučení pro B: velké plochy modelů dělit zhruba po 0,5 m (krok mřížky světla, `LIGHT_CELL`), nebo počkat na texturu světla (N-110).

## Dočasné řešení

Engine čte `pack.files`, když je v balíku. Bez nich se díl `mesh` nepostaví (zpráva v konzoli a v F3), kolize z `.glb` chybí a materiál s `albedo` se kreslí jen barvou; hra jede dál. Testy soubory vkládají samy (`test/a_lib/glb.mjs` vyrobí `.glb` kódem, WebP vyrobí prohlížeč). Po přijetí se nic v enginu nemění.

## Rozhodnutí

(vyplní svodná sešna)
