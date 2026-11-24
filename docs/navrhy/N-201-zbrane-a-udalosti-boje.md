# N-201: Zbraně, munice a události boje (zkouška na plazmové pušce)

Sešna: svodná · Datum: 2026-11-25 · Stav: přijatý ke zkoušce na jednom kusu (D-051, D-053)

Svodná sešna čísluje své návrhy od 201. Tento je zároveň zadáním zkoušky: formát je v základu jako **zkušební** (pole se smějí po zkoušce změnit bez zachování zpětné slučitelnosti), zlatý vzorek nese jeden kus, sešny A a B na něm zkusí celou cestu. Po zkoušce se formát zmrazí (D-030) a z oddílu „Zkušební“ v `02_KONTRAKTY.md` se přesune mezi závazné.

## Co potřebuju

Zbraň jako data xSpace: hráč ji sebere, vystřelí, střela zasáhne svět, tělesa a entity se životy, výbuch odhodí předměty. Hodnoty z Arény v2.9 (`docs/prevzeti/ARENA.md`, A-1 až A-5).

## Proč to bez toho nejde

Zadání 1/ chce střílení, exploze a zoom, B/ zbraně; nic z toho neexistuje. V Aréně jsou zbraně kód (`weapons.js`, 701 řádků) a hodnoty jsou tabulky v kódu. Pravidlo „obsah jsou data“ to v xEngine nepustí.

## Návrh

### Soubory balíku

| Soubor | Druh (`kind`) | Manifest | Obsah |
|---|---|---|---|
| `ammo.json` | `ammo` | `ammo: "ammo.json"` | mapa id munice → `{ title, max }` |
| `weapons/<id>.json` | `weapon` | `weapons: [ … ]` | jedna zbraň |

Zbraň v ruce je **prefab** (díly `box`, `cyl` nebo `mesh` z `.glb`): stejná cesta pro model, materiály, licenci a kontrolu jako u všeho ostatního. Zbraň ležící ve světě je prefab s `interact.kind: "pickup"` a `pickup.item` = id zbraně (dá zbraň a `amount` munice) nebo id munice.

### Zbraň (`weapon`)

| Pole | Povinné | Význam |
|---|---|---|
| `id`, `title` | ano | id `<co>_<varianta>_<nn>`, název česky |
| `slot` | ano | číslo 0 až 9 (klávesa); víc zbraní ve slotu se střídá v pořadí `order` |
| `order` | | pořadí ve slotu, výchozí 0 |
| `ammo` | | id munice; bez něj zbraň munici nepotřebuje (pěsti, kladivo) |
| `view` | ano | `{ prefab, pos, rot?, muzzle }`: prefab modelu v ruce, poloha a natočení vůči kameře (metry, x vpravo, y nahoru, −z dopředu; stupně YXZ), ústí v prostoru prefabu |
| `zoom` | | `{ fov }`: vodorovné zorné pole při přiblížení, stupně |
| `primary` | ano | režim hlavního tlačítka |
| `alt` | | režim druhého tlačítka |
| `source` | ano | původ a licence (jako u prefabu) |

### Režim (`primary`, `alt`)

| Pole | Význam |
|---|---|
| `kind` | `hitscan` (paprsek), `projectile` (střela s letem), `melee` (úder na dosah) |
| `cooldown` | nejkratší čas mezi výstřely, s |
| `cost` | munice na výstřel (výchozí 1, je-li `ammo`) |
| `pellets`, `spread` | počet broků (výchozí 1), rozptyl ve stupních (kužel) |
| `damage` | poškození jednoho zásahu |
| `range` | dosah paprsku nebo úderu, m (`hitscan`, `melee`) |
| `push` | rychlost, kterou zásah udělí lehkému tělesu, m/s (viz výbuch) |
| `projectile` | `{ speed, accel?, gravity?, life, radius?, bounce?, fuse? }`: m/s, m/s², násobek tíže (0 = rovně), s, m, odrazivost 0–1, rozbuška s |
| `splash` | `{ radius, damage, push }`: výbuch nebo šplouchnutí v místě dopadu |
| `charge` | `{ time, release? }`: nabíjení podržením (s do plného), samovolné vystřelení (s) |
| `recoil` | zákluz 0–1 (obraz zbraně, ne míření) |
| `noise` | poloměr, na který výstřel slyší nepřátelé, m |
| `sounds` | mapa `fire`, `charged`, `empty` → id zvukové události (prázdné, dokud není Z-2) |

Číslo, které se mění s nabitím, se zapíše jako `{ min, max, curve? }`: hodnota při nulovém a plném nabití, `curve` `linear` (výchozí) nebo `square` (roste s druhou mocninou nabití). Platí pro `cost`, `damage`, `push`, `projectile.speed`, `splash.radius`, `splash.damage`, `splash.push`.

### Plazmová puška (hodnoty z Arény, `weapons.js` a `projectiles.js`, větev `hra` `a04e8c0`)

| | Hlavní | Druhé (nabitá koule) |
|---|---|---|
| druh | střela | střela |
| kadence | `cooldown` 0,1 s (10 ran/s) | 0,5 s |
| munice | 1 článek | 5 až 20 článků (lineárně) |
| střela | 45 m/s, život 4 s | 14 až 40 m/s (lineárně), život 6 s |
| poškození | 12 při zásahu, šplouchnutí 1,0 m za 6 | výbuch 2,5 až 5,5 m (lineárně), 30 až 200 (s druhou mocninou) |
| odhození | – | `push` 12 až 33 m/s (s druhou mocninou; Aréna `power` (8 + 14 e) / 12 × 18) |
| rozptyl | 0,46° (Aréna 0,008 rad) | 0 |
| nabití | – | plné za 2,0 s, samo vystřelí ve 2,6 s |
| hluk | 30 m | 40 m |

Munice `cells`: nejvýš 200. Přiblížení u plazmy Aréna nemá (má ho paprskomet, 24°); zkouška ho dá plazmě, aby se zoom ověřil na stejném kusu.

### Výbuch a odhození

Těleso o hmotnosti `m` ve vzdálenosti `d` od středu výbuchu s poloměrem `r` dostane změnu rychlosti `push · (1 − d/r) / (1 + m / PUSH_MASS)`, `PUSH_MASS = 800 kg` (vzorec Arény: lehké věci létají, auto 1 100 kg se převrátí). Poškození klesá lineárně stejně. Kryt: bod za statickým světem (paprsek ze středu výbuchu) poškození ani odhození nedostane. Výbuch v chodbě jako rovinná vlna (Aréna K14) je mimo zkoušku.

### Zásah a životy

Entita s `components.health` bere poškození; při `hp ≤ 0` vyšle výstup `destroyed` a nahradí ji `breakInto`, nebo zmizí. Zásah vyšle výstup `hit` (terč `target_01` ho už má). Povrch zásahu (částice, zvuk) je `health.surface`, jinak povrch materiálu.

### Události boje (deklarované, tvar `oblast:sloveso`)

| Událost | Kdy | Obsah |
|---|---|---|
| `weapon:fired` | výstřel | `{ weapon, mode, pos, dir }` |
| `weapon:switched` | výměna zbraně | `{ weapon }` |
| `combat:hit` | zásah čehokoli | `{ target, point, normal, damage, surface, weapon }`; `target` = id entity, nebo `null` pro svět |
| `combat:exploded` | výbuch | `{ pos, radius, damage, push, weapon }` |
| `combat:destroyed` | entita přišla o všechny životy | `{ target, weapon }` |
| `combat:noise` | hluk pro nepřátele | `{ pos, radius }` |

Systémy je deklarují ve vlastnosti `events`; nedeklarovaná událost shodí test (pravidlo jádra).

## Dopad

- **Základ (svodná):** formáty `ammo` a `weapon`, pole manifestu, typ hodnoty podle nabití, validátor (`ref.prefab`, `ref.ammo`, `weapon.*`), načtení a spojení balíků, zlatý vzorek (munice, plazmová puška, model v ruce, zbraň na zemi ve xLabu), test T1d.
- **Sešna A:** zbraně v `src/play` (výběr, střelba přes paprsky a tělesa Rapieru, nabíjení, zoom), střela a výbuch s odhozením, zásah entit s `health`, zbraň v ruce ve druhém průchodu (po vymazání hloubky; bez světla po pixelech, D-022; záblesk ústí smí být to jediné efektové světlo), události z tabulky. Měření na T460 přes `?bench`.
- **Sešna B:** plazmová puška z modelu Arény (`plasma.glb` jako díl `mesh`, materiály, licence „vlastní dílo z Arény“), sebratelná zbraň a munice jako prefaby; galerie ukáže zbraň v ruce.
- Verze formátu zůstává 1; nové druhy souborů jsou zkušební.

## Dočasné řešení

Žádné; formát je v základu jako zkušební od znění 8 základu 2.

## Rozhodnutí

Přijato ke zkoušce (svodná, 25. 11. 2026, D-053; pořadí Ondřej 25. 11. 0:00, D-051).
