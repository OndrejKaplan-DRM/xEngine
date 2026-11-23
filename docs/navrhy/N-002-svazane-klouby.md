# N-002: svázané klouby (jeden pohyb, víc kloubů)

Sešna: B · Datum: 2026-11-22 · Stav: přijatý, provede základ ve vlně 2

## Co potřebuju
Aby kloub mohl sledovat jiný kloub téhož prefabu v pevném poměru.

## Proč to bez toho nejde
Formát verze 1 má jednu interakci na prefab a interakce pohání jeden kloub. Tři prefaby sady `kit_base` proto neumím zapsat tak, jak se chovají:

| Prefab | Co se má stát | Co je v datech teď |
|---|---|---|
| dvoukřídlé dveře | jedno otevření pohne oběma křídly | dvě entity `door_dleft_01` a `door_dright_01` se stejným počátkem, svázané spojením `opened → open` a `closed → close`; portál odkazuje na levé křídlo |
| `microscope_01` | kolečko `focus` (0 až 540°) zvedá stolek `stage` (0 až 0,025 m) | dva nesvázané klouby; stolek má `drive: motor` a nic ho nepohání |
| klika dveří (`door_wood_01`, `door_steel_01`) | stlačení kliky `latch` předchází otevření křídla `swing` | kloub `latch` v kostře je, ale nic ho neřídí |

Dvě entity na jedny dveře znamenají dvojí „použít“, portál hlídaný jen jedním křídlem a o krok zpožděné druhé křídlo.

## Návrh
Nové volitelné pole kloubu v `formats.js`:

```text
rig.joints[].follow   objekt
  joint   odkaz (joint)   kloub téhož prefabu, který tento kloub sleduje
  ratio   číslo           hodnota = offset + ratio × hodnota sledovaného kloubu (jednotky tohoto kloubu na jednotku sledovaného)
  offset  číslo           volitelné, výchozí 0
```

Pravidla pro validátor: `follow.joint` existuje a není to tento kloub; řetěz sledování nesmí tvořit kruh (nový kód `rig.followCycle`); výsledná hodnota pro `min` i `max` sledovaného kloubu leží v mezích tohoto kloubu (`rig.limits`); sledující kloub nesmí být kloubem interakce.
Engine sledující kloub nepohání sám: po kroku pohonů dopočítá jeho hodnotu. `rigMatrices` se nemění (dostane už dopočítané hodnoty); stačí pomocná funkce `jointFollow(prefab, values)` v `rig.js`.

## Dopad
- Sešna A: jeden průchod přes klouby se `follow` po kroku pohonů.
- Zlatý vzorek: beze změny. Verze formátu se nemění (pole je volitelné).
- Sešna B: dvoukřídlé dveře budou jeden prefab `door_double_01`; ze sady zmizí `door_dleft_01` a `door_dright_01` a generátor přestane zapojovat křídla přes `io`.

## Dočasné řešení
Dvě entity svázané spojením (`src/gen/build.js`, komentář u `doorIds.length === 2`); mikroskop se dvěma nesvázanými klouby. Po přijetí: úprava `tools/forge/kit/doors.mjs` a `lab.mjs`, v generátoru odpadne větev pro pár dveří.

## Rozhodnutí

**Přijato** (svodná sešna, 22. 11. 2026, D-034). Pole `rig.joints[].follow` s navrženými pravidly validátoru a funkce `jointFollow` v `rig.js` vzniknou v základu během vlny 2 (dluh základu). Do té doby platí dočasné řešení sešny B (dvě entity spojené přes `io`); zkouška A × B s ním prošla, robot otevřel dvoukřídlé dveře rukou. Sešna B pole `follow` do dat nepíše, dokud není ve `formats.js`.
