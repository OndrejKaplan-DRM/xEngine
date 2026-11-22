# Rozhodnutí

Datum | rozhodnutí | zvažované možnosti | proč | jak vrátit. Všechna z 22. 11. 2026, autorka Kristína, pokud není uvedeno jinak. „Čeká na Ondřeje“ = platí jako výchozí, dokud neřekne jinak.

| ID | Rozhodnutí | Zvažováno | Proč | Jak vrátit |
|---|---|---|---|---|
| D-001 | Vykreslení přes Three.js 0.187 a WebGL 2 | vlastní rasterizér; WebGPU | T460 a všechny naše testy stojí na WebGL 2; Three.js je ověřený ve čtyřech projektech; WebGPU na ovladačích HD 520 je nejistota bez měření | vykreslení je jen v `src/render`; výměna nezasáhne data ani fyziku |
| D-002 | Jediná fyzika je Rapier; žádný Octree pro kolize | Octree + Rapier (zadání) | invariant F1 z Level 1, zkušenost Arény: dva kolizní světy = dvě pravdy | — |
| D-003 | Obsah jsou data xSpace; engine neobsahuje žádný level ani prefab | levely v kódu jako v Aréně | hlavní mez Arény; bez toho nejde souběžná práce ani editor | — |
| D-004 | Řez mezi sešnami vede datovým kontraktem | dělení po tématech (grafika × fyzika) | sešny nesdílejí soubory a testují se bez sebe | `04_SESNY` |
| D-005 | Jádro převzato z `vibe-game-frameworks` a rozšířeno o fáze, závislosti a deklarované události; krok 120 Hz | jádro Arény; nové od nuly | je nejnovější, má testy a čisté rozhraní; pořadí registrace byla křehká | `src/kernel/engine.js` |
| D-006 | Shell se nepíše znovu: kopie v `vendor/` připnutá na commit `ab8557a` (větev `dev`), pravda zůstává ve `vibe-game-frameworks` | vyvíjet Shell tady; git submodul | jedna pravda; submodul by komplikoval klonování v sandboxu | `tools/vendor-check.mjs --update` |
| D-007 | Buňky jsou osově zarovnané kvádry spojené portály; viditelnost průchodem portály | BSP a předpočítaná viditelnost; jen ořez pohledem | interiéry z generátoru místnosti znají; je to jednoduché a měřitelné | formát snese pozdější obecnější tvar buňky |
| D-008 | Světla v kandelách se zeslabením jako three.js; zapečené světlo ukládá osvětlení, ne barvu; expozice v datech levelu | libovolné „jednotky enginu“ | zapékání (B) a běh (A) musí počítat totéž | `02_KONTRAKTY` oddíl 3 |
| D-009 | Každý prefab má kostru; jeden kloub na uzel; jedna interakce na prefab | volné „animace“ u předmětů; víc interakcí | zadání chce kostru napřed; jednoduchost verze 1 | návrh na rozšíření formátu |
| D-010 | Dvě mutace jsou profil v datech (`arena`, `real`) | dvě větve kódu | jedna cesta kódem, obě se testují stejně | `src/play/profiles` |
| D-011 | Nástroj ze zadání „xBlender“ se jmenuje xForge a je to knihovna generátorů, ne náhrada Blenderu. **Čeká na Ondřeje.** | jméno xBlender; samoučící se nástroj | Blender je ochranná známka Blender Foundation; nástroj je širší; samoučení neumím slíbit | přejmenovat složku `tools/forge` |
| D-012 | xSearcher přijímá ve výchozím stavu jen CC0 a nic sám nepřesouvá do balíků | i CC-BY | „bez zvláštních omezení“ ze zadání splňuje jen CC0; CC-BY ukládá povinnost uvést autora | přepínač v nástroji; validátor CC-BY umí |
| D-013 | „75 %“ = 30 ze 40 řádků `05_PARITA_2003` s testem; „nad úrovní našich projektů“ = tabulka proti Aréně v2 | nechat slovně | bez měřítka se o splnění nedá rozhodnout | upravit seznam |
| D-014 | Svižná mutace podle Quake III, klidná podle Half-Life a Counter-Strike; z Doom 3 jen obrazovky ve světě; z Doom: The Dark Ages nic technického | vzory ze zadání doslova | Doom 3 není aréna; The Dark Ages vyžaduje sledování paprsků | — |
| D-015 | Vývoj po souborech, vydání jako jeden HTML soubor; mez 10 MB platí pro kód, ne pro data | vše v jednom souboru jako Aréna (11,6 MB) | start a paměť; data se mají načítat postupně | `build.mjs` |
| D-016 | Referenční stroj T460 = Intel HD 520; rozpočty jsou odhad do měření xBench | věřit odhadu | zásada „měř, nevěř“ | `06_ROZPOCTY` |
| D-017 | Engine se staví nad zkušebním levelem xLab a každá vlna končí průchozím sestavením | nejdřív engine, potom hra | engine bez hry nemá čím být prověřen | — |
| D-018 | Verze knihoven jsou připnuté v základu (three 0.187.0, Rapier 0.21.0, three-mesh-bvh 0.9.18, esbuild 0.28.2); zámek balíků obnovuje svodná sešna | volné verze | opakovatelné sestavení; konflikty zámku při slučování | `package.json` |
| D-019 | Větve `zaklad-N`, `sesna-a`, `sesna-b`, `integrace-N`; do `main` slučuje jen svodná sešna; značky se nepoužívají | patche jako v Aréně | proxy značky odmítá; větve se osvědčily v Soustavě 200 | — |
| D-020 | Identifikátory v kódu anglicky, komentáře a dokumenty česky, texty pro hráče v jedné tabulce | vše česky | shodně s `vibe-game-frameworks`; knihovny jsou anglické | — |
| D-021 | Základ obsahuje jen to, co potřebují obě sešny: jádro, formát, validátor, geometrii, kostry, zlatý vzorek, prohlížeč, měření. Entity a komponenty za běhu navrhuje sešna A. | zmrazit i rozhraní entit | nevyzkoušené rozhraní by se zmrazilo špatně; B ho nepotřebuje | — |
