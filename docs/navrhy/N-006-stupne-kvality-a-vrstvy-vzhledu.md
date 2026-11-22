# N-006: stupně kvality a vrstvy vzhledu (hra má vypadat skutečně a projekt má unést silnější stroj)

Sešna: B · Datum: 2026-11-22 · Stav: otevřený

Týká se celého projektu, ne jen obsahu: základu (formát, rozpočty, rozhodnutí), sešny A (vykreslení) i sešny B (nástroje a data). Podnět je Ondřejův, z 22. 11. 2026 13:51:

> „Tělesa a objekty jsou příliš sterilní. Základní tvary jsou dobré, ale já potřebuju, aby vypadaly hyperrealisticky. Takto mohou vypadat jako náhledy v xForge, kde budeme potřebovat určitou čistotu pro práci, ale ve hře to musí vypadat skutečně.“
>
> „Chci být připravený i na přechod na rychlejší počítače s grafickou kartou. Na Lenovu T460 nezůstanu napořád. Měj tedy plán a prostor na případ nárůstu výpočetního výkonu, kdy budeš moci použít výrazně víc grafických prvků, shaderů, textur, detailů. Už teď s tím počítej při stavbě celého projektu, xEnginu i jeho souvisejících toolů.“

## Co potřebuju

Aby projekt přestal mít jediný cílový stroj: data se vyrábějí v nejvyšší kvalitě, jakou umíme, a běh si z nich podle stroje vybere stupeň; T460 je nejnižší herní stupeň, ne strop.

## Proč to bez toho nejde

**Dnešní stav vzhledu (ověřeno v datech a kódu k 22. 11. 2026):**

| Kde | Co je | Co chybí |
|---|---|---|
| `packs/kit_base` | 49 prefabů jen z dílů `box` a `cyl` (válec = šestnáctiúhelník), 8 276 △ celkem, průměr 169 △ na prefab; 41 materiálů, každý jedna barva + drsnost + kovovost | zkosené hrany, oblé tvary, drobné díly; jakákoli textura |
| formát xSpace 1 | materiál **už má** `albedo`, `normal`, `uvScale`; díl **už má** `shape: "mesh"` s cestou k `.glb`; manifest má `assets` s otiskem a licencí; level má `baked.method` `vertex` nebo `lightmap` | mapy drsnosti, kovovosti a zastínění; úrovně detailu; víc rozlišení téže textury; průhlednost (N-005); obtisky; označení, od kterého stupně se co kreslí |
| xView (`tools/xview/main.js`) | kreslí `box` a `cyl` jednou barvou; u sítě stojí „sítě .glb kreslí až engine“ | textury, sítě |
| engine sešny A (`origin/sesna-a`, `c8444bf`, `src/render/materials.js`) | `MeshLambertMaterial({ color })`: z materiálu se bere jen barva | drsnost, kovovost, textury, sítě, zapečené světlo, stíny |
| rozpočty (`docs/06_ROZPOCTY.md`) | jediný sloupec „pro Lenovo T460“ | sloupec pro jakýkoli jiný stroj |

Formát tedy z velké části připravený je. Chybí ten, kdo textury a sítě vyrobí (B), ten, kdo je nakreslí (A), a pravidlo, podle kterého se rozhodne, co se na kterém stroji kreslí (základ).

**Proč objekty vypadají sterilně.** Pořadí podle toho, kolik která věc na dojmu udělá; je to můj úsudek, ne měření:

1. **Světlo a stín.** Nic nevrhá stín, nic nemá ztmavené kouty a styk s podlahou. Bez toho předmět „nestojí“ v místnosti, ať má sebevíc detailu. Hry z let 1996 až 2004 stály na zapečeném světle se stíny.
2. **Povrch.** Jedna barva na materiál. Chybí kresba dřeva, zrno betonu, špína, oděrky, nápisy.
3. **Tvar.** Všechny hrany jsou dokonale ostré, takže nechytají odlesk; válce jsou hranaté; chybí drobné díly (šrouby, panty, kliky, kabely, těsnění, nožky).
4. **Historie a nepořádek.** Všechno je čisté, stejné, v pravých úhlech. Chybí opotřebení, skvrny, obtisky, drobnosti na stolech a na zemi, mírně pootočený nábytek.
5. **Odezva materiálu.** Kov, plast a dřevo se liší jen barvou. Chybí odlesky, odraz okolí, průhledné sklo.
6. **Obraz.** Mlha, záře kolem světel, vyhlazení hran, tónování.

Počet trojúhelníků je tedy jen část bodu 3. Samotné přidání trojúhelníků ani samotné stažení cizích modelů to nespraví.

**Co unese T460 (xBench 0.1, změřeno Ondřejem 22. 11. 2026, 1366 × 768):**

| Případ | Medián |
|---|---|
| scéna bez výpočtu světel (`MeshBasicMaterial`) | 2,35 ms |
| 4 bodová světla po pixelech | 14,0 ms |
| 8 světel | 17,3 ms |
| fyzikální materiál s 8 světly | 22,8 ms |
| stínová mapa 2 048 px | 25,2 ms |
| 800 volání kreslení | 7,15 ms |
| 1,2 mil. trojúhelníků | 16,0 ms |

Úzké hrdlo je výpočet na pixel, ne geometrie. Z toho plynou dvě věci. Zaprvé: víc trojúhelníků si T460 dovolit může (tvar se dá zlepšit hned). Zadruhé: fyzikální materiály se světly a stíny za běhu na T460 nepoběží v 60 snímcích; „hyperrealisticky“ ve smyslu dnešních her je stupeň pro grafickou kartu. Na T460 je dosažitelné „věrohodně jako dobrá hra z let 1998 až 2004“: textury a zapečené světlo se stíny. **Kolik stojí textura na T460, změřeno není**; měří to xBench 0.2, který na T460 zatím neběžel.

**Bez stupňů kvality hrozí dvojí škoda.** Když se data i engine postaví jen na míru T460 (jedna barva, světlo po vrcholech, D-022 jako jediná cesta), na silnějším stroji nebude co zapnout a práce se bude dělat znovu. Když se naopak začne stavět na fyzikálních materiálech a stínech, T460 to neutáhne.

## Návrh

### 1. Zásada (do `docs/00_VIZE.md` a `CLAUDE.md`)

**Data nesou nejvyšší kvalitu, jakou umíme vyrobit. Běh z nich vybírá stupeň podle stroje. Žádný nástroj ani formát nesmí kvalitu zahodit jen proto, že ji T460 neunese.**

### 2. Stupně kvality (`tier`)

| Stupeň | Pro co | Světlo | Materiál | Geometrie | Obraz |
|---|---|---|---|---|---|
| 0 `clean` | náhledy v nástrojích (xForge, xView, xDesigner) | pracovní, rovnoměrné | barva materiálu, bez textur | díly `box` a `cyl` | nic |
| 1 `low` | T460 a podobné | jen zapečené (po vrcholech podle D-022; mapa osvětlení, až ji xBench změří) | textura barvy, nejvýš 512 px | nižší úroveň detailu | nic |
| 2 `mid` | slabší grafická karta | zapečené + 1 až 2 světla se stínem za běhu | + normálová mapa, 1 024 px | plná úroveň detailu | vyhlazení hran, záře |
| 3 `high` | grafická karta | zapečené nepřímé + světla a stíny za běhu, zastínění koutů v obraze | fyzikální materiál se všemi mapami, 2 048 px, odrazy okolí | plná úroveň + ozdobná geometrie a obtisky | plný řetěz |

Stupeň 0 je odpověď na Ondřejovo „náhledy v xForge potřebují čistotu“: není to nouzový režim, je to pracovní pohled, který zůstane napořád. Hranice mezi stupni 1 až 3 jsou návrh k diskusi; závazné mají být až z měření.

- Výběr: xBench vrátí doporučený stupeň, Shell ho nabídne v nastavení, hráč ho smí změnit.
- `docs/06_ROZPOCTY.md` dostane sloupec na stupeň. Sloupec `low` jsou dnešní změřená čísla T460; ostatní zůstanou prázdné, dokud je někdo nezměří na skutečném stroji.
- D-022 (světlo po vrcholech, žádná stínová mapa) se přepíše z „tak to engine dělá“ na „tak to dělá stupeň `low`“.

### 3. Vrstvy prefabu: kostra → hrubý tvar → povrch

Dnešní pořadí „kostra před tvarem“ se prodlouží o jeden krok a nic z hotového se nezahodí:

| Vrstva | Co to je | K čemu |
|---|---|---|
| `rig` | uzly a klouby (beze změny) | pohyb, interakce |
| hrubý tvar | dnešní díly `box` a `cyl` (beze změny) | stupeň 0, kolize, vzdálená úroveň detailu, záloha, když síť chybí |
| povrch | sítě `.glb` navázané na tytéž uzly, s úrovněmi detailu | stupně 1 až 3 |

Formát už dovoluje mít u jednoho uzlu vedle sebe díly `box`, `cyl` i `mesh`. Chybí jen říct, který díl patří do které vrstvy. Přesná změna dílu prefabu (`part` v `src/xspace/formats.js`), jména polí jsou návrh:

```text
parts[].layer: "base" | "skin"   // nepovinné, výchozí "base"; base = hrubý tvar, skin = povrch
parts[].lod: 0                   // jen u skin: 0 = nejvyšší detail; víc dílů téhož uzlu
                                 // s různým lod = úrovně detailu téhož povrchu
parts[].tris: 1840               // jen u shape "mesh": počet trojúhelníků dílu
parts[].minTier: 1               // nepovinné: od kterého stupně se díl smí kreslit
tris                             // beze změny: nejvyšší úroveň detailu celého prefabu
trisBase                         // nové: počet trojúhelníků hrubého tvaru
```

Pravidlo kreslení: ve stupni 0, nebo když se síť nenačte, se kreslí díly `base`. Ve stupních 1 až 3 se u prefabu, který má aspoň jeden díl `skin`, kreslí jen díly `skin` (úroveň podle stupně a vzdálenosti); prefab bez dílů `skin` se kreslí z dílů `base` jako dnes.

Kloub hýbe uzlem, takže se stejně hýbe hrubý tvar i povrch. Kolize dál plynou z `colliders`, ne z povrchu.

### 4. Materiál: mapy a rozlišení

```text
materials.<id>.orm:       "tex/steel_painted_orm.webp"   // zastínění, drsnost, kovovost v kanálech R, G, B
materials.<id>.emissiveMap: "tex/…"                       // nepovinné
materials.<id>.sizes:     [256, 512, 1024, 2048]          // která rozlišení balík nese
materials.<id>.opacity                                     // viz N-005
```

- `color`, `rough`, `metal` zůstávají povinné a platí vždy: jsou to hodnoty stupně 0 a záloha, když se textura nenačte.
- Soubory rozlišení se jmenují podle vzoru `<jméno>.<rozlišení>.<přípona>`; `albedo`, `normal` a `orm` uvádějí cestu bez rozlišení a běh si doplní to, které stupeň dovoluje.
- Komprese pro grafickou paměť (KTX2) je druhý krok. T460 podle xBench umí S3TC a BPTC, ne ETC2 ani ASTC.

### 5. Level: ozdobná vrstva

```text
level.detail: [ { prefab | mesh, pos, rot, cell, minTier } ]            // lišty, zárubně, kabely, potrubí, stropní rošty
level.decals: [ { mat, pos, normal, size, rot, cell, minTier } ]        // skvrny, nápisy, praskliny
entities[].minTier                                                       // drobnosti, které slabý stroj vynechá
```

Ozdobná vrstva nemá kolize, neúčastní se interakcí ani ukládání pozice a nesmí být podmínkou průchodu levelem. Level proto zůstane hratelný stejně na všech stupních.

### 6. Co se změní v nástrojích

| Nástroj | Změna |
|---|---|
| xForge | generátor prefabu vrací kostru, hrubý tvar **a** povrch; galerie má přepínač „čistý / herní“ a přepínač stupně |
| xSearcher | originály stahuje v nejvyšším rozumném rozlišení do `packs/_inbox` (mimo git); nic nezmenšuje |
| xBake (nebo nový krok „xPack“) | z originálů vyrobí odvozená rozlišení a úrovně detailu, spočítá otisky, zapíše `assets`; zapéká světlo zvlášť pro způsob `vertex` a `lightmap` |
| xGen | rozmisťuje i ozdobnou vrstvu a drobnosti s `minTier`; malé náhodné pootočení a posun nábytku |
| xView | zůstává stupeň 0 (čistý pohled na data) |
| xBench | vrací doporučený stupeň; měří cenu textury, normálové mapy a mapy osvětlení |
| validátor | kontroluje, že každý prefab s díly `skin` má i hrubý tvar, že úrovně detailu klesají, že součet textur stupně `low` je pod rozpočtem paměti |

### 7. Co se změní v enginu (sešna A, nejdřív vlna 2)

Továrna na materiály podle stupně (`low`: materiál bez výpočtu světla + zapečené světlo + textura barvy; `high`: fyzikální materiál), načítání `.glb` a textur, výběr úrovně detailu podle vzdálenosti a stupně, vynechání ozdobné vrstvy pod `minTier`. Žádné místo v enginu nemá počítat s tím, že materiál je jen barva nebo že světlo je jen po vrcholech.

### 8. Pořadí

1. **Hned, beze změny formátu (sešna B):** bohatší hrubý tvar tam, kde to rozpočet dovolí (válce s víc stěnami, náhrada zkosení, drobné díly), drobnosti na stoly a na zem, malé náhodné pootočení nábytku, víc odstínů materiálů. Vidět to bude ve všech dnešních prohlížečích.
2. **Hned, v poli, které formát už má (sešna B):** textury barvy a normálové mapy z CC0 zdrojů do `kit_base` přes `albedo` a `normal`; herní pohled v galerii sady, protože galerie je jediné místo, kde vykreslení patří sešně B. Ve hře to vidět nebude, dokud to engine nenačte.
3. **Vlna 2 (základ + A + B):** stupně kvality, vrstva `skin`, `orm`, rozlišení, ozdobná vrstva; engine načítá textury a sítě; xBake zapéká se stíny.
4. **Až bude stroj s grafickou kartou:** stupně `mid` a `high` změřit a zapnout. WebGPU až potom a jen s měřením (D-001).

## Dopad

- **Formát:** nová nepovinná pole (`parts[].layer`, `parts[].lod`, `parts[].tris`, `minTier`, `trisBase`, `orm`, `emissiveMap`, `sizes`, `detail`, `decals`). Dnešní balíky zůstávají platné, verze formátu se měnit nemusí. Zlatý vzorek se měnit nemusí; pro zkoušku by měl dostat jeden prefab s povrchem a jeden materiál s texturou.
- **Základ:** `00_VIZE`, `01_ARCHITEKTURA` oddíl 4, `06_ROZPOCTY` (sloupce), `DECISIONS` (D-022 jako stupeň `low`, nové rozhodnutí o stupních), `05_PARITA_2003` řádky 5, 8, 11, 15, 17, xBench.
- **Sešna A:** `src/render/materials.js` a stavba sítí přestanou předpokládat barvu a díly `box`/`cyl`. Je to práce vlny 2, ale rozhodnutí je potřeba dřív, než se vykreslení usadí.
- **Sešna B:** xForge, xSearcher, xBake, xGen podle tabulky v bodě 6.
- **Velikost dat:** jedna sada map v rozlišení 1 024 px má jednotky megabajtů (ambientCG `Concrete049`, archiv 1K-JPG: 10 406 004 B před zmenšením a převodem). Hra v jednom souboru HTML přestane stačit pro stupně 2 a 3; balíky se budou muset načítat zvlášť. To je samostatné rozhodnutí.
- **Rizika:** (a) tři stupně jsou trojí testování; navrhuju testovat automaticky stupně 0 a 1 a stupně 2 a 3 až na skutečném stroji. (b) Skenované modely z webu vedle vlastních prefabů budou stylově tlouct; povrch vlastních prefabů proto má vznikat stejným postupem a ze stejných materiálů. (c) Cizí model nemá naši kostru; pohyblivé věci (dveře, páky, ventily) zůstanou vlastní.

## Dočasné řešení

Do rozhodnutí dělám body 1 a 2 z pořadí: obojí je v mojí složce a beze změny formátu. Pole `layer`, `lod`, `orm`, `detail`, `decals` ani `minTier` do dat nepíšu. Odstranění dočasného řešení: žádné není potřeba, hrubý tvar zůstává jako vrstva.

## Co nevím

- Cenu textury, normálové mapy a mapy osvětlení na T460 (xBench 0.2 tam neběžel).
- Jak vypadá světlo po vrcholech s texturou ve skutečné hře.
- Jaký stroj s grafickou kartou Ondřej pořídí; stupně 2 a 3 jsou do té doby bez čísel.
- Jestli se povrch prefabů vyplatí vyrábět kódem (zaoblený kvádr, rotační profil, tažení po křivce), nebo přes Blender jako modul Pythonu (`bpy` je v rejstříku balíků ve verzi 5.3.0, v sandboxu nainstalovaný není). Chci zkusit obojí na jednom prefabu.

## Rozhodnutí

(vyplní svodná sešna)
