# Zadání sešny B, vlna 1: „Mám z čeho stavět“

Jsi sešna **B (obsah a nástroje)**. Vyrábíš data ve formátu xSpace a nástroje, které je vyrábějí. Druhá sešna (A) souběžně staví engine; potkáte se jen přes data.

## 0. Než začneš

1. Připoj repo `OndrejKaplan-DRM/xEngine` (přístup pro zápis), naklonuj, `git checkout -b sesna-b origin/zaklad-1`.
2. Přečti `CLAUDE.md`, `docs/STATE.md`, `docs/02_KONTRAKTY.md`, `docs/02a_XSPACE_pole.md`, `docs/01_ARCHITEKTURA.md` (oddíly 1, 3, 6).
   Sada Level 1, na kterou se zadání odkazuje (`01_CORE`, `02_SHELL`, `10_CASE_FPS`), je v balíku pro sešny ve složce `level1/` a v repu `OndrejKaplan-DRM/vibe-game-frameworks` ve složce `frameworks/` (veřejné, stačí klon pro čtení).
3. Přečti `tools/golden/make.mjs` a `packs/golden`: to je vzor dat i stylu generátoru. Tvoje výstupy musí projít stejným validátorem (`npm run check`, pro jiný balík `node tools/xspace-check.mjs packs/<balík> --strict`).
4. Načti skilly `blender-skills` (oddíly 0, 13, 14), `arena-assety` (oddíly 1, 4), `herni-data-zestihleni`, `headless-webgl-testing`.
5. `npm install && npm test`. Musí projít (T0 41, T1 101, T2 15, T3 8).

## 1. Cíl

Nástroje, které z parametrů a seedu vyrobí platný level a platné prefaby, a první sada obsahu, na které se dá engine zkoušet. Měřítkem není počet řádků, ale to, že **200 různých seedů projde validátorem bez jediného nálezu** a že prefaby vypadají na galerii jako to, čím mají být.

Všechno jsou čisté funkce: parametry + seed → data. Stejný vstup = bajtově stejný výstup. Náhoda jen přes `rngNext` z `src/kernel`.

## 2. Úkoly v pořadí

Nutné minimum je B1.1 a B1.2. Další jen když zbude síla. Po každém úkolu testy, `B_STAV.md`, commit, push.

| # | Úkol | Hotovo, když |
|---|---|---|
| **B1.1** | **xGen: stavebnice a rozvržení.** `src/gen/kit.js`: místnost (podlaha, strop, zdi s otvory, práh), chodba, schodiště, rampa, sloup; zeď vlastní vždy jedna buňka. `src/gen/layout.js`: graf místností a chodeb ze seedu (dělení plochy nebo mřížka), dveře, záruka dosažitelnosti a nepřekrývání buněk, volitelně patra spojená schodištěm. Předvolby `complex` (technický komplex: hala, laboratoře, sklady, chodby) a `catacombs` (úzké chodby, výklenky, nepravidelné rozměry). Nástroj `node tools/gen.mjs <předvolba> --seed N --out packs/<balík>`. | 200 seedů × 2 předvolby: 0 chyb a 0 varování validátoru; 20 až 60 buněk; stejný seed dvakrát = stejné bajty; generování 50 místností do 1 s v Node; každý level má schod nebo rampu a aspoň troje dveře |
| **B1.2** | **xForge: sada prefabů `kit_base`.** Každý prefab je funkce `(parametry) → prefab` v `tools/forge/kit/*.mjs`, od kostry k tvaru: nejdřív uzly a klouby s mezemi, potom díly a kolize. Aspoň 30 prefabů: dveře (otočné, posuvné, dvoukřídlé), okno, tlačítko, vypínač, páka, ventil, kohoutek, zásuvková skříň, skříň s dvířky, stůl, židle, regál, lavice, svítidla (stropní, nástěnné, stolní), laboratorní přístroje (centrifuga s víkem, digestoř s výsuvným oknem, mikroskop se zaostřovacím kolečkem, lednice), bedny, sudy, potrubí, zábradlí, terminál. Generátor B1.1 je rozmisťuje podle jednoduchých pravidel (dveře do portálů, vypínač u dveří, světlo do středu stropu, nábytek ke zdem). | všechny projdou validátorem; každý pohyblivý má kloub s mezemi z reálného předmětu (napiš zdroj nebo úvahu); galerie `dist/kit.html` (vlastní cíl sestavení, smíš použít funkce z `src/xspace`) ukáže každý prefab v klidu a v krajní poloze kloubu; montáž snímků pro Ondřeje |
| B1.3 | **xBake: první zapečené světlo.** Návrh formátu souboru jako `docs/navrhy/N-001-zapecene-svetlo.md` (osvětlení E lineárně podle kontraktu, způsob `vertex` nebo `lightmap`, otisk geometrie a světel). Prototyp v Node: přímé světlo se stíny (paprsky proti kvádrům a dílům prefabů v klidové poloze), jeden odraz nebo okolní člen, pro zlatý vzorek. Náhled vlastní stránkou. | návrh úplný a odůvodněný (velikost souboru, čas zapékání, co s dveřmi); zapečení xLabu do 60 s; snímek „jen zapečené světlo“ vedle snímku z xView; místa ve stínu sloupu jsou měřitelně tmavší |
| B1.4 | **xSearcher: příjem volných assetů.** Nejdřív změř, které zdroje jsou ze sandboxu dosažitelné (Kenney, OpenGameArt, Poly Haven, ambientCG, Quaternius) a zapiš to. Nástroj `node tools/searcher/find.mjs "<dotaz>" --type model|texture|sound`: hledá, ukáže licenci, stáhne do `packs/_inbox/<zdroj>/<asset>/` se záznamem (licence, adresa, autor, datum, otisk). Výchozí brána: jen `CC0-1.0`; při pochybnosti NE. Do balíků nic nepřesouvá sám. | tabulka dosažitelnosti zdrojů; 10 stažených assetů se záznamem; test na uložených odpovědích (bez sítě); balík s `free: true` odmítne cokoli jiného než CC0 a vlastní dílo |

## 3. Co nedělat

Engine, vykreslení ve hře, fyziku, editor (xDesigner je vlna 2). Modely přes Blender jen jako připravenou cestu (skript a jeden vzorek), ne jako hlavní výstup: engine v této vlně `.glb` nenačítá. Tvory až ve vlně 2. Žádné změny v `src/kernel`, `src/xspace`, `packs/golden`, `tools/golden`, `tools/xview`, `build.mjs`.

Chybí-li ti ve formátu tvar nebo pole (válec jako kvádr levelu, výšková mapa, víc interakcí na prefab), **neobcházej to a neměň formát**: napiš návrh a pracuj s tím, co je.

## 4. Pravidla obsahu

- Rozměry z reality: dveře 0,8 až 1,0 × 2,0 až 2,1 m, klika 1,0 až 1,1 m, vypínač 1,2 až 1,4 m, stůl 0,72 až 0,76 m, sedák 0,45 m, schod 0,15 až 0,2 m výška a 0,25 až 0,3 m hloubka, strop 2,6 až 3,2 m, chodba aspoň 1,2 m.
- Trojúhelníky: běžný prefab do 500, složitý přístroj do 2 000. Počet zapisuj do `tris`.
- Materiály jen ty, které balík definuje; povrch (`surface`) vyplň pravdivě, řídí zvuk kroků a zásahů.
- Licence: tvoje generátory jsou `own`. Cokoli z webu jen `CC0-1.0` a se záznamem.
- Jména: `<co>_<varianta>_<nn>`, kategorie s tečkami (`arch.door`, `device.lab`, `prop.furniture`).

## 5. Pasti, které znám předem

- Zeď postavená dvakrát (sousední místnosti) = překryv = varování validátoru. Zdi veď jako seznam úseků s jedním vlastníkem.
- Pod každým otvorem musí být práh, jinak je v podlaze díra (test T1 to hlídá u zlatého vzorku; hlídej to u svých).
- Portál leží uprostřed tloušťky zdi a nesmí přesahovat žádnou z obou buněk.
- Čísla zaokrouhluj (v `make.mjs` na 4 desetinná místa), jinak se bajty mezi běhy liší.
- Balík s levely si prefaby a materiály bere z balíku sady přes `requires: ["kit_base"]`. Balíky leží vedle sebe v `packs/` a jmenují se svým id; `xspace-check` i sestavení je spojí samy. Stejné id materiálu nebo prefabu ve dvou balících je chyba.
- Vlastní level si prohlédneš v xView bez zásahu do něj: založ si cíl sestavení se svým `target.json`, který má `"entry": "../xview/main.js"`, `"template": "../xview/index.html"` a `"pack"` na tvůj balík. xView kreslí první level balíku a díly `box` a `cyl`.
- `bpy` (Blender jako modul Pythonu): `pip install bpy==5.2.2 --break-system-packages`; binárka `blender` v sandboxu není. Sketchfab, BlenderKit a obrázky z webu sandbox nepustí.
- Playwright neinstaluj; je v `/opt/npm-tools`. Jeden prohlížeč naráz.
- Zvuky a textury nikdo neposlouchal ani neviděl, dokud to neudělá Ondřej. Napiš to do stavu.

## 6. Co odevzdáš

1. Větev `sesna-b` s nástroji, balíky a testy `test/b_*` (běží přes `npm run test:b`).
2. `docs/sesny/B_STAV.md` podle šablony.
3. Pro Ondřeje: montáž galerie prefabů, tři vygenerované levely (snímky půdorysu a pohledu), případně `dist/kit.html`.
4. Návrhy v `docs/navrhy/` (aspoň N-001, pokud ses dostala k B1.3; dále vše, co ti ve formátu chybělo).
5. Tři až pět otázek pro Ondřeje s volbami a/b.
