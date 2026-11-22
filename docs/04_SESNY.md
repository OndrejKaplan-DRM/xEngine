# Rozdělení práce do souběžných sešen

Vychází z toho, co se osvědčilo v Aréně v2 (`arena-podsesny`), Planetce 8 a Soustavě 200: zmrazený základ, dělení podle souborů, vlastní větve, jedna svodná sešna.

## 1. Řez

Práce se nedělí podle témat, ale podle **datového kontraktu xSpace**:

```text
           sešna B: OBSAH A NÁSTROJE                     sešna A: BĚH
           vyrábí data                                   spotřebovává data
   xGen · xForge · xBake · xSearcher        xWorld · xRender · xPhys · xPlay · xShell
                      │                                       │
                      └──────────►  xSpace  ◄─────────────────┘
                            formát + validátor + zlatý vzorek
                                   (základ, zmrazeno)
```

Proč právě tady:

- Obě strany se dají vyvíjet i testovat bez sebe. A testuje proti zlatému vzorku, B proti validátoru.
- Sešny nesdílejí jediný soubor, který by obě měnily. Konflikt při slučování může vzniknout jen v `package.json`, a i tam má každá vlastní oddíl.
- Chyba v kontraktu se pozná hned (validátor, testy mutací), ne až při slučování.
- Řez odpovídá hlavní mezi Arény: tam byl obsah v kódu enginu, a proto se nedal dělat souběžně.

## 2. Tři role

| Role | Větev | Co dělá | Kdy |
|---|---|---|---|
| **Svodná** | `main`, `zaklad-N`, `integrace-N` | drží základ a kontrakty, rozhoduje návrhy, slučuje, pouští celou regresi, posílá sestavení Ondřejovi, navrhuje úpravy skillů | před vlnou a po ní |
| **A: běh** | `sesna-a` | engine: načtení levelu, vykreslení, fyzika, hráč, interakce, Shell | během vlny |
| **B: obsah a nástroje** | `sesna-b` | generátory, prefaby, zapékání světla, hledání assetů, později editor | během vlny |

Svodná sešna během vlny nepracuje na kódu. Je to táž konverzace, ve které základ vznikl, nebo nová se zadáním `START_SVOD.md`.

## 3. Protokol

1. **Start:** sešna si připojí repo, přečte `CLAUDE.md` a své `START_*.md`, založí větev z `zaklad-N`, pustí `npm install` a `npm test`.
2. **Práce:** jen ve vlastních složkách (tabulka v `CLAUDE.md`). Commit a push po každém uzavřeném kroku.
3. **Stav:** `docs/sesny/A_STAV.md` nebo `B_STAV.md`. Je to jediný kanál mezi sešnami; druhá sešna ho smí číst (`git fetch origin sesna-b` a `git show origin/sesna-b:docs/sesny/B_STAV.md`).
4. **Potřebuju změnu v základu nebo u druhé sešny:** návrh do `docs/navrhy/N-<číslo>-<téma>.md`, dočasné řešení ve vlastní složce za přepínačem, pokračovat. Nikdy nečekat a nikdy neupravit cizí soubor.
5. **Limit nebo restart kontejneru:** soubory zůstanou, procesy zmizí. Nezačínat znovu: přečíst vlastní `*_STAV.md` a `git log`, pokračovat.
6. **Konec vlny:** testy zelené, `*_STAV.md` úplný (hotovo, čísla, neověřeno, návrhy, poznatky pro skill), push. Zpráva Ondřejovi, že je hotovo.
7. **Slučování (svodná):** `git fetch`, nová větev `integrace-N` ze `zaklad-N`, `git merge --no-ff origin/sesna-a`, testy, `git merge --no-ff origin/sesna-b`, testy, rozhodnout návrhy, celá regrese (`npm run test:all`), zkouška A × B (viz 5), sloučit do `main`, založit `zaklad-(N+1)`, napsat zadání další vlny.

Pasti známé z dřívějška: značky (tagy) proxy odmítá, proto větve. `git apply` v podadresáři tiše přeskočí cesty mimo něj. Výstupy sestavení (`dist/`) se necommitují. Pevné počty v testech rozbije každá další dodávka, proto se počítají z dat.

## 4. Vlny

Každá vlna končí sestavením, které si Ondřej projde, a jeho slovem. Bez toho se další vlna nezadává.

### Vlna 1 (zadání hotové)

| | A1: „Projdu xLab“ | B1: „Mám z čeho stavět“ |
|---|---|---|
| cíl | načíst zlatý vzorek a projít ho v obou profilech, otevřít dveře tlačítkem, přehodit páku, sednout k terminálu | generátor místností a chodeb, sada parametrických prefabů s kostrou, první zapečené světlo, příjem volných assetů |
| nutné minimum | A1.1 až A1.5 | B1.1 a B1.2 |
| pokračování (druhá sešna na téže větvi) | A1.6 a A1.8; A1.7 (ořez po buňkách) je přesunuto do vlny 2 (D-027) | B1.3 a B1.4 |
| výstup pro Ondřeje | `dist/xlab.html` | `dist/kit.html` (galerie prefabů) a tři vygenerované levely v xView |
| zadání | `sesny/START_A.md` | `sesny/START_B.md` |

### Vlna 2 (zadání hotové 22. 11. 2026)

Základ `zaklad-2` = sloučená vlna 1 a rozhodnuté návrhy. Zadání je nahoře v `sesny/START_A.md` a `sesny/START_B.md`.

| | A2: „Běží to na T460 a je na co se dívat“ | B2: „Vypadá to skutečně“ |
|---|---|---|
| nejdřív | světlo po vrcholech, pevné řádky obrazu a `?bench`, krok simulace pod 2 ms na T460, dluhy vlny 1 | průchodnost pro kapsli hráče a katakomby, přijatá pole, xSearcher |
| potom | nová pole základu, textury a sítě `.glb` (zkouška na jednom kusu se sešnou B) | textury a bohatší tvar v sadě, jeden prefab se sítí pro sešnu A, xBake a N-001 |
| když zbude | vrstvy světla z xBake, zbraň v ruce, zvukové zóny, ukládání přes Shell | xDesigner nad během A, dům s interiérem, tvor od kostry |
| pojistka obou | `npm run test:axb`: robot projde levely sešny B v enginu sešny A | totéž |

### Vlna 3 (obrys)

| A3 | B3 |
|---|---|
| nepřátelé (automat, vnímání, navigace po buňkách), sondy světla, výkon na T460 podle xBench | katedrála, zahrada a kopec, rozšíření sady z volných assetů, makra v editoru („klik a je tu dům“) |

Pořadí generátorů ze zadání E podle toho, co už kontrakt unese: komplex a katakomby (vlna 1) → dům s interiérem (vlna 2) → katedrála, zahrada, kopec (vlna 3, potřebují terén a `.glb`).

## 5. Zkouška A × B při slučování

Jedna zkouška rozhoduje, jestli kontrakt drží: **level, který vyrobila B, se načte během, který napsala A, bez jediné změny kódu.**

1. `npm run check` na všech balících B: nula chyb.
2. `dist/xlab.html` s balíkem B místo zlatého vzorku: start bez chyby v konzoli.
3. Robot projde z výchozího místa do nejvzdálenější buňky (cesta přes portály z dat).
4. Rozpočty: volání kreslení a čas kroku pod mezí z `06_ROZPOCTY.md`.
5. Co neprošlo, je buď chyba dat (opraví B), nebo díra v kontraktu (návrh, rozhodne svodná).

## 6. Co dostane každá sešna

- **Repo** `OndrejKaplan-DRM/xEngine`, větev `zaklad-1`.
- **Balík** `xEngine_zaklad1_<datum>.zip`: startovní zadání, dokumenty, sada frameworků Level 1, výtah ze skillů a seznam pastí. Balík je kopie toho, co je v repu, pro případ, že sešna repo nemá po ruce; pravda je v repu.
- **Skilly** z účtu: A čte `arena-jadro`, `arena-fyzika`, `arena-assety`, `headless-webgl-testing`, `debug-and-token-economy`; B čte `blender-skills`, `arena-assety`, `herni-data-zestihleni`, `procedural-characters`, `headless-webgl-testing`. Skilly `doom-*` jen jako zdroj hodnot.

## 7. Čemu se tím vyhýbáme

| Bolest z dřívějška | Pojistka |
|---|---|
| obsah v kódu enginu, sdílené soubory | xSpace, vlastnictví složek |
| nový systém = 8 až 15 dotyků v cizích souborech | fáze, deklarované události, žádné úpravy `main.js` druhou sešnou |
| dvě kopie téže pravdy | `formats.js`, `geom.js`, `rig.js`; dokument polí se generuje |
| „VŠE OK“ podsešny bez ověření | svodná pouští testy sama po každém sloučení |
| testy s pevnými počty | počty z dat |
| regrese na hodinu | data se testují v Node (sekundy), prohlížeč jen na obraz |
| rozpočty z hlavy | xBench na T460 |
| požadavek vyšumí | `REQUIREMENTS.md` s čísly a stavem |
| skill přepsaný dvěma sešnami | skill mění jen svodná po sloučení |
