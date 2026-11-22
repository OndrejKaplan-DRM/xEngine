# Zadání sešny A, vlna 1: „Projdu xLab“

Jsi sešna **A (běh)**. Stavíš engine nad zmrazeným základem 1. Druhá sešna (B) souběžně staví generátory a prefaby; potkáte se jen přes data xSpace.

## 0. Než začneš

1. Připoj repo `OndrejKaplan-DRM/xEngine` (přístup pro zápis), naklonuj, `git checkout -b sesna-a origin/zaklad-1`.
2. Přečti `CLAUDE.md`, `docs/STATE.md`, `docs/02_KONTRAKTY.md`, `docs/01_ARCHITEKTURA.md` (oddíly 2, 4, 5), `docs/06_ROZPOCTY.md`.
3. Načti skilly `arena-jadro`, `arena-fyzika`, `headless-webgl-testing`, `debug-and-token-economy`. Aréna je zdroj zkušeností a hodnot, ne kódu ke kopírování: její level je v kódu, tvůj je v datech.
4. `npm install && npm test`. Musí projít (T0 41, T1 101, T2 15, T3 8).
5. Otevři si `dist/xview.html` snímkem (`test/out/xview_*.png` po testu): to je level, který máš oživit.

## 1. Cíl

`dist/xlab.html`: hráč se objeví ve startovní místnosti zlatého vzorku, projde chodbou do haly, vyjde schod, schody a rampu 30°, z rampy 50° sklouzne, tlačítkem otevře dveře laboratoře, přehodí páku, otočí ventilem, vysune zásuvku a sedne si k terminálu. V obou profilech (`arena`, `real`).

Level, prefaby ani materiály **nepíšeš do kódu**. Všechno čteš z `__PACK__` (cíl sestavení s `"pack": "../../packs/golden"`).

## 2. Úkoly v pořadí

Nutné minimum je A1.1 až A1.5. Další jen když zbude síla, v uvedeném pořadí. Po každém úkolu testy, `A_STAV.md`, commit, push.

| # | Úkol | Hotovo, když |
|---|---|---|
| **A1.1** | **Kostra aplikace.** `src/app/main.js`, `target.json` (id `xlab`), jádro z `src/kernel`, Shell z `vendor/shell` přes adaptér (titul, start, pauza, nastavení: zorné pole, citlivost, měřítko vykreslení, profil pohybu). Protokol zámku kurzoru podle `02_SHELL` oddíl 3. `window.__xe` podle kontraktu. | start do menu bez chyby v konzoli; pauza zastaví čítač kroků; každé nastavení projde `apply/probe` |
| **A1.2** | **xPhys + xWorld, statický svět.** Rapier (jedna instance, krok ve fázi `physics`). Z levelu: kolize přes `brushCollider`, viditelná geometrie přes `brushMesh` sloučená po buňce a materiálu. Po postavení světa jeden `world.step()`. | počet koliderů = počet kvádrů s kolizí; volání kreslení ≤ počet (buňka × materiál); snímek ze startu odpovídá xView |
| **A1.3** | **Hráč a profily.** Kinematický kontrolér, pohyb třemi funkcemi (`10_CASE_FPS` F3), profily `arena` a `real` jako data v `src/play/profiles.js`, kamera `yaw`/`pitch` (F4), přepnutí profilu za běhu v `?dev`. | T1 rychlost po rovině = max ±5 % (oba profily); T2 série výskoků v `arena` > 1,2 × max; T3 rozběh proti zdi při `timeScale` 5 zůstane v místnosti; T4 schod 0,3 m vyjde, rampa 30° vyjde, na rampě 50° sklouzne; vyjde schodiště na galerii (nohy v 1,5 m) |
| **A1.4** | **Entity a kostry.** Prefab → uzly podle `rigMatrices`, díly `box` a `cyl`, kolize na uzlech (kinematická tělesa), dynamická tělesa (bedny). Pohon kloubu (`speed`, `drive`), pružina, zarážky. | bedna ve skladu spadne ze stohu po odstrčení; hodnota kloubu se dá číst přes `__xe.get`; poloha křídla dveří při 90° = výsledek `rigMatrices` |
| **A1.5** | **Použít + spojení vstupů a výstupů.** Paprsek z oka na kolize prefabů s interakcí, nápověda akce (`prompt`), druhy `button`, `switch`, `door`. Fronta spojení ve fázi `late` (zpoždění v krocích, `once`, `param`, strop řetězu 32), cíl `@level`. Lampy (`light`) reagují na `turnOn`, `turnOff`, `toggle`, `setLevel`. | tlačítko v chodbě otevře dveře laboratoře a po 0,3 s se rozsvítí lampa; vypínač ve startu rozsvítí a zhasne; spouštěč v hale zareaguje jen jednou; ulož uprostřed otevírání → nahraj → stejný stav po 120 krocích |
| A1.6 | **Manipulace a klidný režim.** Držení tlačítka myši hýbe kloubem (`lever`, `valve`, `drawer`, křídlo dveří); `terminal`: kamera se plynule ukotví podle `station`, zámek kurzoru se uvolní, kurzor míří na obrazovku, Esc vrací. Obsah obrazovky stačí jako text na plátně. | ventil na 50 % nastaví lampu laboratoře na poloviční svit; páka do krajní polohy vyšle `on`; odchod od terminálu vrátí kameru přesně na původní místo |
| A1.7 | **Buňky a portály.** Sledování buňky kamery, průchod portály s ořezem na obdélník portálu na obrazovce, zavřené dveře portál uzavírají. Vývojářská vrstva: obrysy buněk a portálů. | ze startu se zavřenými dveřmi se kreslí 1 buňka; po otevření přibude chodba; počet volání kreslení v hale nezávisí na obsahu laboratoře |
| A1.8 | **Světla za běhu a obraz.** Světla levelu jako dynamická s rozpočtem (N nejbližších na viditelné buňky, N z nastavení), expozice z `env.exposure`, měřítko vykreslení. Vývojářský přehled F3 (snímky, ms kroku po systémech, volání, trojúhelníky, buňka, rychlost v m/s). | počet aktivních světel nikdy nepřekročí nastavení; snímky ze čtyř míst bez černých ploch |

## 3. Co nedělat

Zbraně, nepřátelé, zvuk, textury, `.glb`, zapečené světlo, ukládání do slotů, editor. Žádné změny v `src/kernel`, `src/xspace`, `packs/golden`, `vendor/`, `build.mjs`. Žádný vlastní výpočet geometrie kvádru nebo matice kloubu.

## 4. Rozpočty této vlny

Krok simulace ≤ 2 ms (měřeno `E.profile`, v sandboxu orientačně). Volání kreslení ≤ 150 na pohled v xLabu. Žádné alokace ve smyčce kroku (test: 500 použití tlačítka, halda neroste). Soubor ≤ 600 řádků. Čísla o snímcích za sekundu z prohlížeče v sandboxu **nepiš jako výkon**; ten změří Ondřej.

## 5. Pasti, které znám předem

- Rapier `0.21.0` je o verzi novější než v Aréně (`0.20.0`). Názvy API ověř v typech balíku (`node_modules/@dimforge/rapier3d-compat/*.d.ts`), ne z paměti. Zásah paprsku vrací `timeOfImpact`.
- Chybějící `world.step()` po stavbě světa = propad postavy a slepé paprsky.
- Polohu postavy drž ve vlastním vektoru; `translation()` kinematického tělesa platí až po kroku.
- Zarážka rychlosti o zeď jen když `got < want * 0.5` (jinak hráč stojí na každém schodu).
- Zbraň ani ruce zatím nekresli, ale vrstvu 1 kamery si pro ně nech volnou.
- V three `0.170` testoval stínový průchod vrstvy hlavní kamery, takže „objekt jen pro stín“ přes vrstvy nešel. Základ má `0.187`; než na tom něco postavíš, ověř snímkem.
- Headless: klik do menu může hru spustit se zámkem kurzoru a prohlížeč pak teče paměť. Start vždy přes `__xe.start()`.
- Hodnoty pohybu pro Counter-Strike a Half-Life v Level 1 mají jistotu 3/5. Napiš to do stavu, nelaď je naslepo.
- Shell v `vendor/` neupravuj. Co mu chybí (přemapování kláves, sloty), zapiš jako návrh pro repo `vibe-game-frameworks`.

## 6. Co odevzdáš

1. Větev `sesna-a` s kódem a testy `test/a_*` (běží přes `npm run test:a`).
2. `docs/sesny/A_STAV.md` podle šablony: hotovo × neuděláno po úkolech, změřená čísla, co není ověřeno, návrhy, poznatky pro skill.
3. `dist/xlab.html` poslaný Ondřejovi + mřížka snímků (jedna montáž, ne šest obrázků).
4. Tři až pět otázek pro Ondřeje s volbami a/b.
