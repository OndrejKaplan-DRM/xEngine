# xSpace 1: přehled polí

Generováno z `src/xspace/formats.js` příkazem `npm run doc`. Neupravovat ručně. Výklad a pravidla jsou v `02_KONTRAKTY.md`.

## pack: manifest balíku (pack.json)

| Pole | Povinné | Typ | Význam |
|---|---|---|---|
| `xspace` | ano | vždy `1` | verze formátu xSpace |
| `kind` | ano | vždy `"pack"` | druh souboru |
| `id` | ano | id | id balíku |
| `title` | ano | text | název |
| `version` | ano | text | verze balíku, tvar X.Y.Z |
| `free` |  | ano/ne | balík obsahuje jen assety bez povinností (CC0, vlastní) |
| `requires` |  | pole: id | balíky, ze kterých tento čerpá prefaby nebo materiály |
| `materials` |  | text | cesta k souboru materiálů |
| `prefabs` |  | pole: text | soubory prefabů |
| `levels` |  | pole: text | soubory levelů |
| `assets` |  | pole: objekt | binární soubory balíku s původem a otiskem |
| `assets[].path` | ano | text | cesta k binárnímu souboru relativně k balíku |
| `assets[].bytes` | ano | celé číslo 1 až ∞ | velikost v bajtech |
| `assets[].sha256` | ano | text | otisk SHA-256, 64 šestnáctkových znaků |
| `assets[].license` | ano | `CC0-1.0` · `own` · `CC-BY-4.0` · `MIT` · `OFL-1.1` | licence |
| `assets[].source` | ano | text | odkud soubor je (adresa, nebo skript, který ho vyrobil) |
| `assets[].author` |  | text | autor |

## materials: soubor materiálů

| Pole | Povinné | Typ | Význam |
|---|---|---|---|
| `xspace` | ano | vždy `1` | verze formátu xSpace |
| `kind` | ano | vždy `"materials"` | druh souboru |
| `materials` | ano | mapa id → objekt | id materiálu → materiál |
| `materials[].model` | ano | `lit` · `unlit` · `emissive` | osvětlovací model |
| `materials[].color` | ano | [r, g, b] 0–1 | základní barva; u materiálu s albedo průměrná barva povrchu (N-009): kdo texturu nekreslí, kreslí color, kdo ji kreslí, násobí ji color / albedoMean |
| `materials[].albedo` |  | text | cesta k textuře barvy, relativně k balíku |
| `materials[].albedoMean` |  | [r, g, b] 0–1 | průměrná barva souboru albedo, lineárně (N-009); jen spolu s albedo, zapisuje nástroj, který texturu vyrobil |
| `materials[].normal` |  | text | cesta k normálové mapě |
| `materials[].emissive` |  | [r, g, b] 0–1 | barva vlastního svitu |
| `materials[].emissiveStrength` |  | číslo 0 až 100 | síla vlastního svitu |
| `materials[].rough` |  | číslo 0 až 1 | drsnost 0–1 |
| `materials[].metal` |  | číslo 0 až 1 | kovovost 0–1 |
| `materials[].uvScale` |  | číslo 0.01 až 100 | kolik metrů světa pokryje jedna dlaždice textury |
| `materials[].surface` | ano | `concrete` · `stone` · `metal` · `wood` · `glass` · `tile` · `plastic` · `rubber` · `carpet` · `dirt` · `grass` · `water` · `flesh` | povrch pro zvuk, částice a akustiku |
| `materials[].alphaTest` |  | číslo 0 až 1 | práh průhlednosti 0–1 |
| `materials[].opacity` |  | číslo 0 až 1 | průhlednost 0–1 (výchozí 1); pod 1 se materiál kreslí průhledně, po neprůhledných a bez zápisu do hloubky |
| `materials[].twoSided` |  | ano/ne | kreslit obě strany |

## prefab: prefab: znovupoužitelný předmět, zařízení nebo tvor

| Pole | Povinné | Typ | Význam |
|---|---|---|---|
| `xspace` | ano | vždy `1` | verze formátu xSpace |
| `kind` | ano | vždy `"prefab"` | druh souboru |
| `id` | ano | id | id prefabu, tvar <co>_<varianta>_<nn> |
| `title` | ano | text | název česky |
| `category` | ano | text | kategorie s tečkami (arch.door, prop.furniture, device.lab, creature.humanoid…) |
| `bounds` | ano | objekt | obal v prostoru prefabu |
| `bounds.min` | ano | [x, y, z] | nejmenší roh [x, y, z] v metrech |
| `bounds.max` | ano | [x, y, z] | největší roh [x, y, z] v metrech |
| `rig` | ano | objekt | kostra: uzly a klouby. Každý pohyblivý předmět i tvor začíná kostrou. |
| `rig.nodes` | ano | pole: objekt (aspoň 1) | uzly kostry; první je kořen |
| `rig.nodes[].id` | ano | id | id uzlu, jedinečné v prefabu |
| `rig.nodes[].parent` |  | odkaz (node) | nadřazený uzel; kořen ho nemá |
| `rig.nodes[].pos` |  | [x, y, z] | poloha vůči rodiči v metrech |
| `rig.nodes[].rot` |  | [x, y, z] | natočení vůči rodiči ve stupních, pořadí YXZ |
| `rig.joints` |  | pole: objekt | klouby = stupně volnosti předmětu |
| `rig.joints[].id` | ano | id | id kloubu |
| `rig.joints[].node` | ano | odkaz (node) | uzel, kterým kloub hýbe (vůči jeho rodiči) |
| `rig.joints[].type` | ano | `hinge` · `slider` | hinge = otáčení ve stupních, slider = posuv v metrech |
| `rig.joints[].axis` | ano | [x, y, z] | osa v prostoru rodiče uzlu, jednotkový vektor |
| `rig.joints[].min` | ano | číslo | dolní mez (stupně nebo metry) |
| `rig.joints[].max` | ano | číslo | horní mez (stupně nebo metry) |
| `rig.joints[].rest` |  | číslo | klidová poloha; výchozí je min |
| `rig.joints[].detents` |  | pole: číslo | polohy, do kterých kloub zaskakuje |
| `rig.joints[].spring` |  | číslo 0 až 10000 | tuhost návratu do klidové polohy; 0 = bez pružiny |
| `rig.joints[].damping` |  | číslo 0 až 1000 | tlumení |
| `rig.joints[].speed` |  | číslo 0.001 až 10000 | rychlost pohonu (stupně nebo metry za sekundu) |
| `rig.joints[].drive` |  | `manual` · `motor` · `both` | kdo kloubem hýbe: hráč, pohon, nebo oba |
| `rig.joints[].follow` |  | objekt | svázaný kloub (N-002): nepohání se sám, jeho hodnotu dopočítá jointFollow ze sledovaného kloubu (dvoukřídlé dveře, kolečko a stolek mikroskopu) |
| `rig.joints[].follow.joint` | ano | odkaz (joint) | kloub téhož prefabu, který tento kloub sleduje |
| `rig.joints[].follow.ratio` | ano | číslo | hodnota = offset + ratio × hodnota sledovaného kloubu (jednotky tohoto kloubu na jednotku sledovaného) |
| `rig.joints[].follow.offset` |  | číslo | posun; výchozí 0 |
| `rig.clips` |  | pole: objekt | animační klipy (tvorové) |
| `rig.clips[].id` | ano | id | id klipu (idle, walk, attack1…) |
| `rig.clips[].file` | ano | text | cesta k souboru animace |
| `parts` | ano | pole: objekt (aspoň 1) | viditelné díly |
| `parts[].node` | ano | odkaz (node) | uzel kostry, ke kterému díl patří |
| `parts[].shape` | ano | `box` · `cyl` · `mesh` | tvar |
| `parts[].min` |  | [x, y, z] | box: nejmenší roh v prostoru uzlu |
| `parts[].max` |  | [x, y, z] | box: největší roh v prostoru uzlu |
| `parts[].center` |  | [x, y, z] | cyl: střed |
| `parts[].radius` |  | číslo 0.001 až 100 | cyl: poloměr |
| `parts[].height` |  | číslo 0.001 až 100 | cyl: výška |
| `parts[].axis` |  | `x` · `y` · `z` | cyl: osa |
| `parts[].mesh` |  | text | mesh: cesta k souboru .glb, volitelně #jménoUzlu |
| `parts[].mat` |  | odkaz (material) | materiál; u mesh volitelný (bere se z glTF) |
| `colliders` |  | pole: objekt | kolizní tvary |
| `colliders[].node` | ano | odkaz (node) | uzel kostry |
| `colliders[].shape` | ano | `box` · `cyl` · `ball` · `hull` · `mesh` | tvar |
| `colliders[].min` |  | [x, y, z] | box: nejmenší roh |
| `colliders[].max` |  | [x, y, z] | box: největší roh |
| `colliders[].center` |  | [x, y, z] | cyl, ball: střed |
| `colliders[].radius` |  | číslo 0.001 až 100 | cyl, ball: poloměr |
| `colliders[].height` |  | číslo 0.001 až 100 | cyl: výška |
| `colliders[].axis` |  | `x` · `y` · `z` | cyl: osa |
| `colliders[].mesh` |  | text | hull, mesh: cesta k souboru .glb, volitelně #jménoUzlu |
| `colliders[].group` |  | `world` · `prop` · `debris` · `trigger` | kolizní skupina; výchozí world u static, jinak prop |
| `components` |  | objekt | součásti |
| `inputs` |  | pole: text | vstupy, které entita přijímá |
| `outputs` |  | pole: text | výstupy, které entita vysílá |
| `tris` |  | celé číslo 0 až ∞ | počet trojúhelníků nejvyšší úrovně detailu |
| `source` | ano | objekt | původ a licence |
| `source.tool` | ano | text | nástroj, který soubor vyrobil (xforge, xsearcher, gen, designer, golden, rucne) |
| `source.generator` |  | text | jméno generátoru nebo skriptu |
| `source.params` |  | cokoli | parametry generátoru (pro opakovatelnost) |
| `source.seed` |  | celé číslo | seed generátoru |
| `source.license` | ano | `CC0-1.0` · `own` · `CC-BY-4.0` · `MIT` · `OFL-1.1` | licence |
| `source.author` |  | text | autor nebo původní zdroj |
| `source.url` |  | text | adresa zdroje, pokud asset pochází z webu |
| `source.date` |  | text | datum vzniku nebo stažení, RRRR-MM-DD |

## level: level

| Pole | Povinné | Typ | Význam |
|---|---|---|---|
| `xspace` | ano | vždy `1` | verze formátu xSpace |
| `kind` | ano | vždy `"level"` | druh souboru |
| `id` | ano | id | id levelu |
| `title` | ano | text | název |
| `profile` | ano | `arena` · `real` | výchozí mutace enginu: arena = svižná, real = klidná a přesná |
| `env` |  | objekt | prostředí |
| `env.ambient` | ano | [r, g, b] 0–1 | okolní světlo |
| `env.exposure` |  | číslo 0.01 až 100 | expozice před převodem do rozsahu displeje; výchozí 1 |
| `env.fog` |  | objekt | mlha |
| `env.fog.color` | ano | [r, g, b] 0–1 | barva mlhy |
| `env.fog.density` | ano | číslo 0 až 1 | hustota |
| `env.sky` |  | text | id oblohy |
| `env.sun` |  | objekt | slunce nebo měsíc |
| `env.sun.dir` | ano | [x, y, z] | směr, odkud světlo svítí |
| `env.sun.color` | ano | [r, g, b] 0–1 | barva |
| `env.sun.intensity` | ano | číslo 0 až 100 | síla |
| `cells` | ano | pole: objekt (aspoň 1) | buňky: místnosti a úseky, základ viditelnosti, zvuku a rozpočtů |
| `cells[].id` | ano | id | id buňky, předpona c_ |
| `cells[].name` |  | text | název pro mapu a vývojářské nástroje |
| `cells[].bounds` | ano | objekt | vnitřní objem buňky (vzduch), osově zarovnaný kvádr |
| `cells[].bounds.min` | ano | [x, y, z] | nejmenší roh [x, y, z] v metrech |
| `cells[].bounds.max` | ano | [x, y, z] | největší roh [x, y, z] v metrech |
| `cells[].zone` |  | text | akustické schéma |
| `cells[].ambient` |  | [r, g, b] 0–1 | okolní světlo buňky; jinak se bere z env |
| `cells[].isolated` |  | ano/ne | buňka záměrně není spojená portálem (tajná místnost, teleport) |
| `portals` |  | pole: objekt | portály: otvory mezi buňkami |
| `portals[].id` | ano | id | id portálu, předpona p_ |
| `portals[].a` | ano | odkaz (cell) | první buňka |
| `portals[].b` | ano | odkaz (cell) | druhá buňka |
| `portals[].quad` | ano | pole: [x, y, z] (aspoň 4) | čtyři rohy otvoru v jedné rovině |
| `portals[].door` |  | odkaz (entity) | entita dveří; zavřené dveře portál uzavírají pro viditelnost i zvuk (pro viditelnost ne, mají-li seeThrough) |
| `portals[].passable` |  | ano/ne | lze projít (výchozí ano); ne = otvor jen pro pohled a zvuk (okno), nepočítá se do dosažitelnosti ani navigace |
| `brushes` |  | pole: objekt | kvádry a klíny: hrubá stavba levelu |
| `brushes[].id` | ano | id | id kvádru, předpona b_ |
| `brushes[].cell` | ano | odkaz (cell) | buňka, ke které kvádr patří |
| `brushes[].shape` |  | `box` · `wedge` | tvar; výchozí box |
| `brushes[].min` | ano | [x, y, z] | nejmenší roh |
| `brushes[].max` | ano | [x, y, z] | největší roh |
| `brushes[].rise` |  | `+x` · `-x` · `+z` · `-z` | wedge: směr, kterým šikmá plocha stoupá |
| `brushes[].mat` | ano | odkaz (material) | materiál |
| `brushes[].faces` |  | mapa id → odkaz (material) | box: jiný materiál pro stěnu (+x, -x, +y, -y, +z, -z) |
| `brushes[].col` |  | ano/ne | má kolizi; výchozí ano |
| `brushes[].vis` |  | ano/ne | je vidět; výchozí ano |
| `brushes[].tag` |  | text | volná značka (wall, floor, ceiling, stair, ramp, pillar…) |
| `entities` |  | pole: objekt | umístěné prefaby |
| `entities[].id` | ano | id | id entity, předpona e_ |
| `entities[].prefab` | ano | odkaz (prefab) | prefab |
| `entities[].cell` | ano | odkaz (cell) | buňka |
| `entities[].pos` | ano | [x, y, z] | poloha |
| `entities[].rot` |  | [x, y, z] | natočení ve stupních, pořadí YXZ |
| `entities[].scale` |  | číslo 0.01 až 100 | rovnoměrné měřítko |
| `entities[].props` |  | cokoli | výchozí stav entity (např. locked, on, level) |
| `entities[].io` |  | pole: objekt | spojení výstupů této entity |
| `entities[].io[].on` | ano | text | výstup této entity nebo spouštěče (např. opened, pressed, enter) |
| `entities[].io[].target` | ano | text | id cílové entity levelu, nebo vestavěný cíl @level |
| `entities[].io[].input` | ano | text | vstup cíle (např. open, turnOn) |
| `entities[].io[].from` |  | id | jen výstupy této interakce prefabu (id z components.interact); bez něj výstup kterékoli interakce |
| `entities[].io[].to` |  | id | vstup jen do této interakce cíle (id z components.interact cíle); bez něj do všech interakcí cíle |
| `entities[].io[].delay` |  | číslo 0 až 600 | zpoždění v sekundách herního času |
| `entities[].io[].once` |  | ano/ne | spojení se provede jen jednou |
| `entities[].io[].param` |  | cokoli | pevná hodnota pro vstup; bez ní se předá hodnota výstupu |
| `lights` |  | pole: objekt | pevná světla levelu (zapékají se) |
| `lights[].id` | ano | id | id světla, předpona l_ |
| `lights[].cell` | ano | odkaz (cell) | buňka |
| `lights[].type` | ano | `point` · `spot` · `sun` | druh |
| `lights[].pos` | ano | [x, y, z] | poloha |
| `lights[].dir` |  | [x, y, z] | směr (spot, sun) |
| `lights[].color` | ano | [r, g, b] 0–1 | barva |
| `lights[].intensity` | ano | číslo 0 až 1000 | svítivost |
| `lights[].range` |  | číslo 0.1 až 200 | dosah v metrech |
| `lights[].angle` |  | číslo 1 až 170 | úhel kužele ve stupních |
| `lights[].cast` |  | ano/ne | vrhá stín (v zapečeném světle vždy) |
| `lights[].dynamic` |  | ano/ne | nesmí se zapéct (mění se za běhu) |
| `lights[].style` |  | `steady` · `flicker` · `pulse` · `strobe` | styl |
| `triggers` |  | pole: objekt | spouštěcí objemy |
| `triggers[].id` | ano | id | id spouštěče, předpona t_ |
| `triggers[].cell` | ano | odkaz (cell) | buňka |
| `triggers[].min` | ano | [x, y, z] | nejmenší roh |
| `triggers[].max` | ano | [x, y, z] | největší roh |
| `triggers[].once` |  | ano/ne | zareaguje jen jednou |
| `triggers[].io` | ano | pole: objekt (aspoň 1) | spojení; výstupy spouštěče jsou enter a exit |
| `triggers[].io[].on` | ano | text | výstup této entity nebo spouštěče (např. opened, pressed, enter) |
| `triggers[].io[].target` | ano | text | id cílové entity levelu, nebo vestavěný cíl @level |
| `triggers[].io[].input` | ano | text | vstup cíle (např. open, turnOn) |
| `triggers[].io[].from` |  | id | jen výstupy této interakce prefabu (id z components.interact); bez něj výstup kterékoli interakce |
| `triggers[].io[].to` |  | id | vstup jen do této interakce cíle (id z components.interact cíle); bez něj do všech interakcí cíle |
| `triggers[].io[].delay` |  | číslo 0 až 600 | zpoždění v sekundách herního času |
| `triggers[].io[].once` |  | ano/ne | spojení se provede jen jednou |
| `triggers[].io[].param` |  | cokoli | pevná hodnota pro vstup; bez ní se předá hodnota výstupu |
| `spawns` | ano | pole: objekt (aspoň 1) | výchozí místa |
| `spawns[].id` | ano | id | id |
| `spawns[].kind` | ano | `player` · `enemy` · `item` | co se tu rodí |
| `spawns[].pos` | ano | [x, y, z] | poloha nohou |
| `spawns[].yaw` |  | číslo -360 až 360 | natočení ve stupních; 0 = pohled ve směru -Z |
| `spawns[].what` |  | text | id nepřítele nebo předmětu |
| `baked` |  | objekt | zapečené světlo; chybí-li, engine svítí za běhu |
| `baked.file` | ano | text | soubor se zapečeným světlem |
| `baked.method` | ano | `vertex` · `lightmap` | způsob |
| `baked.hash` | ano | text | otisk geometrie a světel, pro které zapečení platí |
| `source` | ano | objekt | původ a licence |
| `source.tool` | ano | text | nástroj, který soubor vyrobil (xforge, xsearcher, gen, designer, golden, rucne) |
| `source.generator` |  | text | jméno generátoru nebo skriptu |
| `source.params` |  | cokoli | parametry generátoru (pro opakovatelnost) |
| `source.seed` |  | celé číslo | seed generátoru |
| `source.license` | ano | `CC0-1.0` · `own` · `CC-BY-4.0` · `MIT` · `OFL-1.1` | licence |
| `source.author` |  | text | autor nebo původní zdroj |
| `source.url` |  | text | adresa zdroje, pokud asset pochází z webu |
| `source.date` |  | text | datum vzniku nebo stažení, RRRR-MM-DD |

## Součásti prefabu (`components`)

### physics: fyzikální těleso (Rapier)

| Pole | Povinné | Typ | Význam |
|---|---|---|---|
| `body` | ano | `static` · `kinematic` · `dynamic` | druh tělesa |
| `mass` |  | číslo 0.01 až 100000 | hmotnost v kg (jen dynamic) |
| `friction` |  | číslo 0 až 4 | tření |
| `restitution` |  | číslo 0 až 1 | odrazivost |
| `ccd` |  | ano/ne | průběžná detekce kolizí pro rychlá tělesa |

### interact: co s předmětem může hráč dělat; jeden objekt, nebo seznam (každá zásuvka, dvířka zvlášť; hráč ovládá tu, jejíž kloub hýbe zasaženým uzlem)

| Pole | Povinné | Typ | Význam |
|---|---|---|---|
| `id` |  | id | id interakce, jedinečné v prefabu; povinné, je-li interakcí víc (seznam, N-010); jediná interakce bez id je „main“ |
| `kind` | ano | `button` · `switch` · `lever` · `valve` · `door` · `drawer` · `terminal` · `station` · `pickup` · `grab` | druh interakce; určuje chování a nabídnuté vstupy a výstupy |
| `joint` |  | odkaz (joint) | kloub, kterým se interakce hýbe |
| `prompt` |  | text | krátký popis akce pro hráče („Otevřít“) |
| `range` |  | číslo 0.2 až 6 | dosah v metrech |
| `manipulate` |  | ano/ne | jde ovládat tažením myši při držení tlačítka (jemná motorika) |
| `seeThrough` |  | ano/ne | jen u dveří: zavřené dveře portál nezavírají pro pohled (mříž, prosklené dveře), jen pro průchod a zvuk |
| `station` |  | objekt | ukotvení kamery pro klidný režim (stůl, panel, terminál) |
| `station.eye` | ano | [x, y, z] | poloha oka v prostoru prefabu |
| `station.look` | ano | [x, y, z] | bod, na který se kamera dívá, v prostoru prefabu |
| `station.fov` |  | číslo 20 až 110 | svislé zorné pole ve stupních |

### health: zničitelnost

| Pole | Povinné | Typ | Význam |
|---|---|---|---|
| `hp` | ano | číslo 1 až 1000000 | body výdrže |
| `surface` |  | `concrete` · `stone` · `metal` · `wood` · `glass` · `tile` · `plastic` · `rubber` · `carpet` · `dirt` · `grass` · `water` · `flesh` | povrch pro zvuk a částice zásahu; jinak se bere z materiálu |
| `breakInto` |  | odkaz (prefab) | prefab trosek, který entitu po zničení nahradí |

### light: světlo nesené prefabem

| Pole | Povinné | Typ | Význam |
|---|---|---|---|
| `type` | ano | `point` · `spot` · `sun` | druh světla |
| `color` | ano | [r, g, b] 0–1 | barva |
| `intensity` | ano | číslo 0 až 1000 | svítivost (jednotky enginu) |
| `range` |  | číslo 0.1 až 200 | dosah v metrech |
| `angle` |  | číslo 1 až 170 | úhel kužele ve stupních (spot) |
| `node` |  | odkaz (node) | uzel kostry, na kterém světlo sedí |
| `cast` |  | ano/ne | vrhá stín |
| `style` |  | `steady` · `flicker` · `pulse` · `strobe` | styl (dědictví světelných stylů Quake) |
| `on` |  | ano/ne | výchozí stav |

### sound: zvuky

| Pole | Povinné | Typ | Význam |
|---|---|---|---|
| `loop` |  | text | id smyčky, která hraje, dokud entita existuje |
| `events` |  | mapa id → text | výstup entity → id zvuku |

### pickup: sebratelný předmět

| Pole | Povinné | Typ | Význam |
|---|---|---|---|
| `item` | ano | text | id předmětu |
| `amount` |  | číslo 0 až 100000 | množství |

### place: jak se prefab umisťuje; čtou nástroje (xGen, xDesigner), engine smí ignorovat

| Pole | Povinné | Typ | Význam |
|---|---|---|---|
| `mount` | ano | `floor` · `wall` · `ceiling` · `top` · `opening` | kam se prefab přichytává |
| `height` |  | číslo 0 až 10 | wall: obvyklá výška počátku nad podlahou v metrech |
| `opening` |  | [a, b] | opening: šířka a výška stavebního otvoru v metrech |
| `top` |  | číslo 0 až 5 | floor: výška plochy, na kterou jde něco postavit (deska stolu), v metrech |

### screen: obrazovka ve světě, na kterou jde v klidném režimu klikat a psát (dědictví Doom 3). Plocha leží v rovině XY uzlu, střed má v jeho počátku, líc míří do +Z, osa X plochy je vpravo a Y nahoru

| Pole | Povinné | Typ | Význam |
|---|---|---|---|
| `node` | ano | odkaz (node) | uzel, na kterém obrazovka sedí |
| `size` | ano | [a, b] | šířka a výška plochy v metrech |
| `res` | ano | [a, b] | rozlišení v pixelech |
| `app` | ano | text | id obsahu obrazovky; engine verze 1 zná jen textovou konzoli a neznámé id zobrazí jako konzoli |
| `offset` |  | číslo -1 až 1 | posun plochy po ose Z uzlu v metrech (výchozí 0); plocha má ležet těsně před předním dílem uzlu |

## Vestavěné cíle spojení

| Cíl | Vstupy |
|---|---|
| `@level` | `checkpoint` · `complete` · `message` |

## Meze validátoru

| Mez | Hodnota |
|---|---|
| `idMax` | 48 |
| `brushMinSize` | 0.01 |
| `partMinSize` | 0.001 |
| `coordMax` | 4096 |
| `portalPlaneEps` | 0.02 |
| `sliderMax` | 5 |
| `hingeMaxTurns` | 8 |
| `warnEntitiesPerCell` | 150 |
| `warnBrushesPerCell` | 400 |
| `warnPrefabTris` | 5000 |
| `overlapCheckMax` | 4000 |
