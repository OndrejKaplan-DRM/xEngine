# Kontrakty (zmrazený základ 1)

Tohle je závazné pro obě sešny. Změna jen návrhem v `docs/navrhy/` a rozhodnutím svodné sešny.
Přehled všech polí formátu je v `02a_XSPACE_pole.md` (generovaný, neupravuje se ručně).

## 1. Jádro (`src/kernel`)

### Systém

```js
const system = {
  name: 'doors',                 // povinné, jedinečné
  phase: 'late',                 // 'input' | 'sim' | 'physics' | 'late' | 'view' | 'ui'; výchozí 'sim'
  after: ['io', '?nav'],         // běžet po těchto systémech; '?jméno' = jen pokud existuje
  events: ['door:opened'],       // události, které systém vysílá (deklarace je povinná)
  async init(E) {},              // jednou: assety, posluchače
  build() {},                    // jednou: statický svět
  reset() {},                    // nová hra a před nahráním: vrať vše, co step mění
  step(dt) {},                   // pevný krok 1/120 s, jen v režimu 'playing'
  frame(real, alpha) {},         // každý snímek; alpha = podíl mezi dvěma kroky
  snapshot() { return {}; },     // čistá data
  restore(data) {},
};
E.add(system);
```

### Fáze

| Fáze | Co sem patří | Příklad |
|---|---|---|
| `input` | čtení vstupu a jeho převod na záměr | klávesnice, myš, robot v testu |
| `sim` | rozhodování a herní logika, která chce pohyb | hráč, zbraně, AI, pohony kloubů |
| `physics` | krok Rapieru; nic jiného | xPhys |
| `late` | co čte výsledek fyziky | spouštěče, spojení vstupů a výstupů, poškození |
| `view` | kamera, animace, viditelnost | xRender |
| `ui` | HUD, vývojářský přehled | |

Pravidla: polohu kinematického tělesa čti až ve fázi `late` (projeví se po kroku fyziky). Závislost na systému z pozdější fáze je chyba a jádro ji odmítne. Systém nelze přidat po `init()`.

### Události

- Tvar `oblast:sloveso` (např. `door:opened`, `io:fired`, `cell:changed`), malé písmeno na začátku obou částí.
- Vysílat i poslouchat lze jen deklarované události. Události jádra: `mode`, `reset`, `restored`.
- Posluchač nesmí měnit stav jiného systému přímo; smí si zapsat záměr a provést ho ve vlastním `step`.

### Čas a náhoda

- Krok `1/120` s. `E.timeScale` škáluje přísun času, délku kroku nikdy.
- Zpoždění se počítá v krocích. `setTimeout`, `Date.now()` a `performance.now()` do herní logiky nepatří.
- Náhoda jen přes `rngNext(stav)`. Každá oblast má vlastní stav (hra, efekty, generátory), ukládá se se stavem systému.

### Režimy

`boot → menu → playing ⇄ paused → over`. Tabulka je v `engine.js` (`TRANSITIONS`) a nikde jinde.

### Háček pro testy

Hra vystaví `window.__xe` s tímto minimem (sešna A smí přidávat, ne ubírat):

```text
start(levelId, opts)   spustí level bez zámku kurzoru
sim(sekundy, vstupy)   kroky bez čekání na skutečný čas
key(code, down)  look(dx, dy)  use()
get(cesta)             čtení stavu ('player.pos', 'entity.e_door_lab.joint')
stats()                { stepMs, frameMs, calls, tris, cells, bodies }
snapshot()  restore(data)
```

## 2. Prostor a jednotky

| Věc | Dohoda |
|---|---|
| délka | metr |
| osy | pravotočivá soustava, **+Y nahoru** |
| pohled | hráč s `yaw` 0 se dívá ve směru **−Z** |
| přední strana prefabu | **+Z** (shodně s glTF) |
| natočení | stupně, pole `[rx, ry, rz]`, pořadí **YXZ** (shodné s `Euler('YXZ')` v three.js) |
| natočení kolem Y | `ry` 0 = čelem k +Z, 90 = k +X, 180 = k −Z, −90 = k −X |
| rozsah | souřadnice do ±4 096 m od počátku |
| čas v datech | sekundy herního času |

### Počátek prefabu

| Druh | Počátek | Poznámka |
|---|---|---|
| stojí na zemi | střed půdorysu na podlaze | |
| visí na zdi | bod dotyku se zdí ve středu zařízení | +Z míří ze zdi do místnosti |
| visí ze stropu | bod dotyku se stropem | předmět je pod počátkem |
| dveře | střed prahu otvoru | rovina dveří je místní XY, prochází se podél Z |

## 3. xSpace: pravidla nad rámec tvaru polí

### Balík

- Adresář s `pack.json`. Cesty v manifestu jsou relativní ke kořeni balíku.
- Každý binární soubor je v `assets` s velikostí, otiskem SHA-256, licencí a zdrojem. Soubor mimo seznam do balíku nepatří.
- `free: true` = balík obsahuje jen licence bez povinností (`CC0-1.0`, `own`). Validátor to hlídá.
- `requires` vyjmenuje balíky, ze kterých tento čerpá prefaby a materiály. Hledají se jako sousední adresáře pojmenované svým id (`packs/<id>`). Spojení dělá `mergePacks`; stejné id materiálu nebo prefabu ve dvou balících je chyba. Závislosti nejsou přechodné: balík vyjmenuje všechno, co potřebuje.
- Zlatý vzorek `packs/golden` je zmrazený. Vyrábí ho `tools/golden/make.mjs` a test T1 hlídá, že výstup je bajtově shodný.

### Level

- **Buňka** je vnitřní objem vzduchu, osově zarovnaný kvádr. Buňky se nepřekrývají. Místnost do L jsou dvě buňky se širokým portálem.
- **Zeď patří právě jedné buňce.** Dvě buňky nikdy nestaví tutéž zeď dvakrát (dvojité plochy blikají a zapečené světlo na nich nesedí). Validátor překryvy hlásí.
- **Portál** jsou čtyři rohy v rovině kolmé na osu, uprostřed tloušťky zdi mezi dvěma buňkami. Pod otvorem je vždy práh (kvádr podlahy), jinak je v podlaze díra.
- **Dveře u portálu** (`door`) portál zavírají pro viditelnost a zvuk, dokud je jejich kloub v klidové poloze. **V klidové poloze musí zakrýt celý otvor**: kolmý průmět všech neprůhledných dílů `box` prefabu (pevných i pohyblivých, osově zarovnaných, nejvýš 0,3 m od roviny portálu) pokryje obdélník portálu; jinak validátor hlásí `portal.door.cover` (D-036, `src/xspace/cover.js`). Dveře, kterými je vidět (mříž, prosklené), mají v prefabu `interact.seeThrough: true`: portál zavírají pro průchod a zvuk, pro viditelnost ne (N-003, N-107).
- **Portál jen pro pohled** (okno) má `passable: false`: počítá se do viditelnosti a zvuku, ne do dosažitelnosti a navigace (N-003).
- Engine řadí viditelnou geometrii po plochách: plocha kvádru jde do buňky, do které míří. Pole `cell` kvádru rozhoduje jen u ploch, které nemíří do žádné buňky (ostění, práh, vnější strana) (N-107).
- Každá buňka je portály dosažitelná z výchozího místa hráče, nebo má `isolated: true`.
- **Kvádr** (`box`) a **klín** (`wedge`, pole `rise` říká, kterým směrem stoupá). Síť, kolizi a UV počítá výhradně `src/xspace/geom.js`. UV jsou krabicová projekce ve světových metrech; dělí se hodnotou `uvScale` materiálu.
- `col: false` = bez kolize, `vis: false` = neviditelná zábrana.
- Level má právě jedno výchozí místo hráče a to leží uvnitř buňky.

### Prefab a kostra

- `rig.nodes`: první uzel je kořen a je vůči entitě pevný. Ostatní mají `parent`.
- `rig.joints`: kloub hýbe uzlem vůči jeho rodiči. `hinge` ve stupních kolem osy, `slider` v metrech po ose. Osa je jednotkový vektor v prostoru rodiče.
- Jeden kloub na uzel. Víc stupňů volnosti = mezilehlý uzel.
- Místní matice uzlu = posun · natočení · kloub. Počítá ji výhradně `src/xspace/rig.js` (`rigMatrices`, `entityMatrix`). V kroku simulace se kostra kompiluje jednou na prefab (`rigCompile`) a řeší bez alokací do připraveného pole (`rigValues` mimo krok, potom `rigFollow` a `rigSolve`, N-102); `rigMatrices` je obálka nad týmž výpočtem.
- `rest` je klidová poloha (výchozí `min`), `detents` polohy, do kterých kloub zaskakuje, `spring` vrací do klidu, `drive` říká, kdo smí hýbat: `manual` hráč, `motor` pohon, `both` oba.
- Prefab s klouby má těleso `kinematic`. `dynamic` těleso nesmí mít kolizi `mesh`.
- Interakcí smí mít prefab víc (N-010, D-052): `components.interact` je jeden objekt, nebo seznam objektů s `id` jedinečným v prefabu (kartotéka se čtyřmi zásuvkami je jeden prefab se čtyřmi klouby a čtyřmi interakcemi). Jeden kloub ovládá nejvýš jedna interakce; `pickup` a `grab` jednají s celou entitou a v seznamu s dalšími být nesmějí. Jediná interakce bez `id` má id `main`.
- Síť, počet trojúhelníků a kolizní tvar dílu prefabu počítá výhradně `src/xspace/geom.js` (`partMesh`, `partTris`, `partCollider`; válec má `CYL_SEGMENTS` dílků) (N-101). Díl `lathe` je rotační plocha z profilu `[[r, y], …]` (líc vpravo od směru profilu, `r = 0` je pól, `crease` = ostré hrany, `seg` 6 až 64 stěn, `arc` výseč, `axis` a `center` jako u válce; osa x: profil roste do +x) a díl `rbox` je kvádr se zaoblenými hranami (`min`, `max`, `radius`, `steps` 1 až 4); síť obou počítá `src/xspace/solids.js` stejně jako xForge (N-012, D-058). Kolize dílů se nepočítají: prefab má kolize zvlášť (`colliders`).
- `speed` je rychlost pohonu **i ruky** hráče. Když chybí, platí doba přejezdu celého rozsahu podle druhu interakce z `JOINT_TRAVEL_SECONDS` ve `formats.js` (N-103).
- `components.place` říká nástrojům, kam se prefab přichytává a jak velký otvor potřebuje (N-004). Engine ho nečte.
- `components.screen`: plocha leží v rovině XY uzlu, střed v jeho počátku, líc do +Z; `offset` ji posouvá po ose Z (N-106).

### Interakce (`components.interact.kind`)

**Kterou interakci hráč ovládá:** jedinou interakci kdekoli na prefabu. U seznamu tu, jejíž kloub hýbe zasaženým uzlem (uzel kolideru nebo dílu); uzel bez vlastního kloubu patří kloubu nejbližšího předka a svázaný kloub (N-002) interakci kloubu, který sleduje. Nenajde-li se, platí interakce bez kloubu, je-li jediná, jinak žádná (pevný korpus nic neovládá). Počítá to výhradně `interactionOf` ze `src/xspace/interact.js`; seznam interakcí dává `interactions` (vždy pole), dveře portálu `doorInteraction` (právě jedna interakce `door`, jinak `portal.door`). Stav (otevřeno, zamčeno, výstupy) má každá interakce vlastní.

**Dosah** (`interact.range`) se měří od osy těla hráče (svislá úsečka od nohou po oči) k bodu, kam dopadl paprsek pohledu. Předmět musí být pod zaměřovačem a paprsek nesmí cestou narazit na nic jiného (N-104).

| Druh | Vyžaduje | Obvyklé vstupy | Obvyklé výstupy |
|---|---|---|---|
| `button` | kloub `slider` s pružinou | `press`, `lock`, `unlock` | `pressed`, `released` |
| `switch` | kloub se dvěma zarážkami | `turnOn`, `turnOff`, `toggle` | `on`, `off` |
| `lever` | kloub se zarážkami | `turnOn`, `turnOff`, `toggle` | `on`, `off`, `changed` |
| `valve` | kloub `hinge` na víc otáček | `setLevel` | `changed`, `opened`, `closed` |
| `door` | kloub | `open`, `close`, `toggle`, `lock`, `unlock` | `opened`, `closed`, `locked`, `unlocked` |

| `drawer` | kloub `slider` | `open`, `close`, `lock`, `unlock` | `opened`, `closed` |
| `terminal` | `station` + součást `screen` | `print`, `lock`, `unlock` | `used`, `left`, `command` |
| `station` | `station` | | `used`, `left` |
| `pickup` | součást `pickup` | `enable`, `disable` | `picked` |
| `grab` | těleso `dynamic` | | `grabbed`, `dropped` |

Dveře, jejichž klidová poloha leží uvnitř rozsahu kloubu (`min < rest < max`, např. ±105°), jsou zavřené v `rest`; vstup `open` je otevře k tomu dorazu, ke kterému se křídlo vzdaluje od toho, kdo otvírá. Výstup `opened` platí pro oba dorazy. Otevření dveří (0 až 1) je \|hodnota − `rest`\| / největší vzdálenost dorazu od `rest` (`doorOpenness` v `src/xspace/bake.js`; N-109, D-042).

Skutečné vstupy a výstupy prefabu jsou vždy ty, které má zapsané v `inputs` a `outputs`; tabulka je doporučení, aby se jména nerozešla.
Výstup `changed` nese hodnotu 0 až 1: `(poloha − min) / (max − min)`.

### Spojení výstup → vstup (`io`)

- Záznam `{ on, target, input, delay?, once?, param?, from?, to? }` u entity nebo spouštěče.
- `from` (jen u entity): výstup jen z této interakce prefabu; bez něj z kterékoli. `to`: vstup jen do této interakce cíle; bez něj do všech jeho interakcí (zamknout celou kartotéku jedním spojením). Neexistující id hlásí validátor `io.from` a `io.to` (N-010).
- Cíl je entita levelu, nebo vestavěný `@level` (`checkpoint`, `complete`, `message`).
- Když výstup nese hodnotu a `param` chybí, hodnota se předá vstupu.
- Spojení se vyřizují ve fázi `late`, v pořadí (krok splatnosti, pořadí vzniku). `delay` se převádí na kroky zaokrouhlením nahoru.
- Řetěz spojení v jednom kroku má strop 32 článků; delší se přeruší a zaloguje (ochrana proti smyčce).
- Fronta čekajících spojení je součást uloženého stavu.
- Výstupy spouštěče jsou `enter` a `exit`.

### Světlo

- Svítivost bodového a kuželového světla je v **kandelách**. Osvětlení plochy ve vzdálenosti `d`, na kterou světlo dopadá pod úhlem `θ` od kolmice:
  `E = I · cos θ · okno(d) / max(d², 0,01)`, `okno(d) = clamp(1 − (d / range)⁴, 0, 1)²`. Je to výchozí chování `PointLight` v three.js s `decay = 2` a `distance = range`.
- Jas povrchu = barva materiálu / π · E. Převod do rozsahu displeje dělá engine expozicí `env.exposure`. **Okolní světlo (`env.ambient`, `cells[].ambient`) je také osvětlení E** a dělí se π stejně (D-049): jas vzorku = barva / π × (okolní × ao + Σ úroveň × barva světla × E + odraz × váha); závorku vrací `composeColors`.
- **Zapečené světlo ukládá osvětlení E (lineárně, před expozicí), ne hotovou barvu.** Engine ho násobí barvou materiálu stejně jako světlo za běhu.
- Kuželové světlo (`spot`): `angle` je plný úhel kužele; posledních 20 % úhlu je měkký okraj. Slunce (`sun`): `intensity` je osvětlení plochy kolmé ke směru, bez zeslabení vzdáleností.
- **Jediná implementace vzorce je `lightIrradiance` v `src/xspace/light.js`.** Počítá osvětlení bez zastínění; zda je mezi bodem a světlem překážka, řeší volající.
- **Statický svět se osvětluje po vrcholech, ne po pixelech** (D-022, změřeno na T460). Vzorky světla levelu definuje `levelSamples(level, prefabs, materials, LIGHT_CELL)` ze `src/xspace/samples.js` (D-041): nejdřív vrcholy sítí `levelLightMeshes` (kvádr po kvádru v pořadí `brushes`, buňka mřížky 0,5 m), potom vrcholy **pevných dílů prefabů** (entity v pořadí `entities`, díly v pořadí `parts`, vrcholy v pořadí `partMesh`, ve světových souřadnicích). Pevný díl = díl `box`, `cyl`, `lathe` nebo `rbox` (`STATIC_SHAPES`) na uzlu, nad kterým ani na kterém není kloub, u entity, která není dynamické těleso ani `pickup`. **Pořadí vzorků je součást kontraktu**: zapékání ukládá hodnoty v tomto pořadí a běh je v něm čte.
- **Každé světlo tvoří vlastní vrstvu** (obdoba světelných stylů Half-Life). Vrstva = osvětlení E vzorků při plné úrovni světla. Barva vzorku = okolní člen + Σ úroveň světla × barva světla × E. Přepnutí lampy mění jen úroveň, vrstva se nepřepočítává.
- Světla v `lights` zapéká xBake, pokud nemají `dynamic: true`. Světlo nesené prefabem (součást `light`) má také svou vrstvu; počítá se při načtení levelu a znovu jen tehdy, když se pohne uzel, na kterém sedí.
- Pohyblivé díly (křídlo dveří, bedna) se osvětlují stejným vzorcem po stěnách dílu; přepočet jen při pohybu dílu nebo změně světla.
- Formát souboru se zapečeným světlem je podle návrhu N-001 (přijat, D-035, D-044): `levels/<id>.light.bin`, vrstvy `light`, `entity`, `indirect`, `ao`; hlavička nese `brushes` a `entities` (`[id, počet vzorků]`, D-041) a `doors`; brána úseku je seznam id dveří a svítí součinem jejich otevření. **Čtení a skládání barev je jen v `src/xspace/bake.js`** (`decodeBake`, `composeColors`, `gateLevel`, `doorOpenness`). Paprsky pro zastínění počítá jen xBake (D-044).
- **Textura světla (zkušební, N-112, D-050, D-055):** přímé světlo statického světa smí nést textura s bodem `baked.lightmap.texel` (výchozí 0,05 m) v souboru `baked.lightmap.file` (`levels/<id>.lightmap.bin`, na disku gzip). **Atlas ploch počítá jen `src/xspace/atlas.js`** ze vzorků `levelSamples`: `lightmapLayout` (mapy, UV 1 každého vzorku; `NaN` = vzorek mimo atlas, svítí se po vrcholech), `lightmapTexels` (body na ploše, které zapéká xBake se stejným pravidlem paprsku jako vzorky, D-044), `lightmapDilation` (okraje map). Řádek 0 atlasu je první v datech (textura bez flipY). **Zápis, čtení a skládání souboru jsou jen v `src/xspace/lightmap.js`** (`encodeLightmap`, `decodeLightmap`, `composeLightmap`, half float `toHalf` / `fromHalf`). Textura nese jen přímé osvětlení E světel a světel entit (úseky s bránou jako u vzorků); okolní člen, přístupnost, odraz a vzorky mimo atlas zůstávají v `levels/<id>.light.bin`. Otisk `baked.lightmap.atlas` = `lightmapLayout(…).hash`; když nesouhlasí, běh texturu nepoužije. Stupeň `low` smí texturu při načtení zmenšit na dvojnásobný bod (průměr 2 × 2).
- **Zavřené dveře u portálu zadržují světlo i se `seeThrough`** (verze 1, D-047); `seeThrough` mění jen viditelnost.
- **Dveře v portálu při zapékání nestíní.** Vzorek, ke kterému vede volná cesta od světla otvorem portálu s dveřmi, svítí úrovní světla × otevření dveří (úsek vrstvy s polem `gate`). Zavřenými dveřmi tak světlo neprochází a při otevírání přibývá (D-035).
- **Mřížka vzorků, znění 2** (D-037, v základu od 24. 11. 2026). Hrana plochy rovnoběžná s osou má vrcholy na násobcích buňky ve světových souřadnicích a na obou svých koncích; šikmá hrana klínu a jeho trojúhelníkové boky se dělí rovnoměrně. Plochy, které sdílejí přímku, na ní proto mají stejné vrcholy. Plocha, která leží celá v jiném neprůhledném viditelném kvádru (včetně jeho povrchu), vzorky nemá (`brushHiddenFaces`); kvádr s `vis: false` také ne. Nikdo nesmí mít počet ani pořadí vzorků natvrdo; obojí se bere z `geom.js`. Na plochách rovnoběžných s osami jsou vrcholy mřížky 0,5 m podmnožinou mřížky 0,25 m.

### Zkušební: zbraně, munice a boj (N-201, D-053)

Pole jsou **zkušební**: po zkoušce na plazmové pušce zlatého vzorku se smějí změnit bez zachování zpětné slučitelnosti. Podrobně `docs/navrhy/N-201-zbrane-a-udalosti-boje.md`, pole `docs/02a_XSPACE_pole.md` (druhy `ammo` a `weapon`).

- Munice je v souboru `ammo.json` (manifest `ammo`), zbraně v `weapons/<id>.json` (manifest `weapons`). Spojení balíků (`mergePacks`) bere munici a zbraně i z balíků v `requires`.
- **Zbraň v ruce je prefab** (`view.prefab`); ústí `view.muzzle` je v prostoru prefabu (přední strana +Z), `view.pos` a `view.rot` ho staví vůči kameře (x vpravo, y nahoru, −z dopředu). Kreslí se ve druhém průchodu po vymazání hloubky (nikdy neprojde zdí), na stupni `low` bez světla po pixelech (D-022); záblesk ústí smí být to jediné efektové bodové světlo. Když ústí leží za zdí (paprsek od oka k ústí narazí), střela vychází z oka (Aréna).
- Zbraň na zemi je prefab s `interact.kind: "pickup"`; `pickup.item` je id zbraně (dá zbraň a `amount` její munice), id munice, nebo `health` / `armor` (`PICKUP_ITEMS`); jiný předmět validátor hlásí varováním `pickup.item`.
- **Hodnota podle nabití** `{ min, max, curve? }` se počítá jen funkcí `rampValue(hodnota, nabití)` ze `src/xspace/weapon.js`; munici zaokrouhluje běh na celé (`Math.round`). Nabití je 0 až 1 = držení / `charge.time`; v `charge.release` zbraň vystřelí sama.
- **Výbuch:** poškození i odhození klesají lineárně se vzdáleností, `splashFalloff(d, r) = 1 − d/r`. Těleso o hmotnosti `m` dostane změnu rychlosti `pushDelta(push, d, r, m) = push · (1 − d/r) / (1 + m / PUSH_MASS)`, `PUSH_MASS = 800` kg. Bod, ke kterému vede paprsek ze středu výbuchu přes statický svět, nedostane nic (kryt).
- **Zásah:** entita s `components.health` ztrácí `hp`; každý zásah vyšle výstup `hit`, při `hp ≤ 0` výstup `destroyed` a entitu nahradí `breakInto`, nebo zmizí. Povrch pro částice a zvuk je `health.surface`, jinak povrch materiálu.
- **Události boje:** `weapon:fired` `{ weapon, mode, pos, dir }`, `weapon:switched` `{ weapon }`, `combat:hit` `{ target, point, normal, damage, surface, weapon }` (`target` = id entity, `null` = svět), `combat:exploded` `{ pos, radius, damage, push, weapon }`, `combat:destroyed` `{ target, weapon }`, `combat:noise` `{ pos, radius }`. Deklarují se ve vlastnosti `events` systému, který je vysílá.
- Náhoda rozptylu jen přes `rngNext` (pevný krok, jádro).

### Profily

`level.profile` je `arena`, nebo `real`. Konstanty pohybu jsou data sešny A (`src/play/profiles`), výchozí hodnoty podle `10_CASE_FPS` z Level 1. Hodnoty pro Counter-Strike a Half-Life mají jistotu 3/5 a ladí se na xLabu.

## 4. Assety (platí od vlny 2)

| Druh | Formát | Poznámka |
|---|---|---|
| model | glTF 2.0 binární (`.glb`), +Y nahoru, metry | uzly `COL_*` = kolize, `*_LOD1` = nižší detail (dohoda z Arény) |
| textura | WebP; KTX2 až podle výsledku xBench | rozměry mocniny dvou, nejvýš 2 048 px |
| zvuk | Ogg Opus | |
| animace | součást `.glb` | jména klipů `idle`, `walk`, `run`, `attack1`, `pain`, `death` |

## 5. Sestavení a testy

- Cíl sestavení = soubor `target.json` ve složce cíle. `node build.mjs --list` je vypíše.
- `npm test` = základ (T0 jádro, T1 xSpace, kontrola dokumentu polí, T4 nastavení Shellu, sestavení, T2 xView, T3 xBench).
- `npm run test:a`, `npm run test:b` = testy sešen (`test/a_*`, `test/b_*`), vždy za sebou.
- Test v prohlížeči bere obraz z plátna (`toDataURL` ve stejné úloze jako vykreslení), ne `page.screenshot`.

## 6. Kódy nálezů validátoru

Kódy jsou stálé a testy i zprávy sešen se na ně odkazují. Skupiny: `shape.*` (tvar pole), `ref.*` (odkaz na neexistující věc), `geom.*`, `portal.*`, `level.*`, `spawn.*`, `brush.*`, `rig.*`, `interact.*`, `phys.*`, `io.*`, `license.*`, `pack.*`, `mat.*`, `file.*`, `budget.*`, `entity.*`, `place.*`. Úplný seznam s příkladem mutace je v `test/t1_xspace.mjs` (interakce prefabu v `test/t1c_interact.mjs`).
