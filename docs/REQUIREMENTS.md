# Požadavky

Každý požadavek Ondřejovými slovy (zkráceně), s číslem a stavem. Stavy: nový → plánovaný → hotový | upravený | odložený | zamítnutý.
Zdroj R-001 až R-024: zadání z 22. 11. 2026 („Ze zkušenosti evoluce komerčních enginů…“) a zpráva téhož dne.

| ID | Požadavek | Stav | Kde | Poznámka |
|---|---|---|---|---|
| R-001 | sofistikovaný 3D herní engine, který spolehlivě běží i na Lenovo T460 s 8 GB | plánovaný | A1 až A3, `06_ROZPOCTY` | rozpočty čekají na xBench |
| R-002 | A: xEngine jako jádro úkolu; efektivita a strategické nakládání s výkonem | plánovaný | `01_ARCHITEKTURA` | |
| R-003 | B: „xBlender“ na tvorbu assetů, sám se učí, Blender případně zastoupí | upravený | D-011 | knihovna generátorů xForge; Blender zůstává nástrojem |
| R-004 | struktury, které „půjdou na ruku“ enginu i designeru | hotový (formát) | `02_KONTRAKTY`, xSpace | |
| R-005 | bloky světa: stromy, nepřátelé, zbraně, zdi s prasklinami, okna, dveře, vybavení laboratoře, nábytek, lustr, vypínač… | plánovaný | B1.2, B2, B3 | interiér ve vlně 1, stromy a tvorové později |
| R-006 | co nejvíc za co nejmíň trojúhelníků | upravený | `00_VIZE` bod 4 | páka je zapečené světlo, ne počet trojúhelníků |
| R-007 | u živých tvorů nejdřív kostra a pohyby, pak „maso“; totéž u všeho, co má stupeň volnosti | hotový (formát), plánovaný (obsah) | `rig` v xSpace, B1.2, B2 | |
| R-008 | C: xSearcher: volné assety všech typů, volně použitelné a šiřitelné | plánovaný | B1.4, D-012 | výchozí jen CC0 |
| R-009 | D: xShell: menu, setup, vývojářské nástroje, bestiář, hitboxy, tréninkové mapy, integrace | plánovaný | A1.1, vlny 2 a 3 | Shell z `vibe-game-frameworks`, D-006 |
| R-010 | E: xDesigner: jednoduchý 3D designer map se širokou paletou prvků | plánovaný | B2 | |
| R-011 | kliknu: katedrála | plánovaný | B3 | |
| R-012 | kliknu: dům o několika patrech s vnitřním členěním a interiérem | plánovaný | B2 | |
| R-013 | kliknu: zahrada se stromy, záhony, cestou, plotem | plánovaný | B3 | potřebuje terén a `.glb` |
| R-014 | kliknu: kopec s trávou, květinami a stromy | plánovaný | B3 | potřebuje nový tvar v xSpace |
| R-015 | kliknu: změť katakomb s nepravidelnostmi | plánovaný | B1.1 | |
| R-016 | kliknu: futuristický komplex s halou, stroji, schodišti, logickým uspořádáním | plánovaný | B1.1 | |
| R-017 | F: xSpace: úložiště proměnných prvků hry (levely, obtížnost, nepřátelé, pozice, příběh) | hotový (formát levelu a balíku), plánovaný (zbytek) | `src/xspace`, `packs/` | uložené pozice jdou přes Shell |
| R-018 | všechno vzájemně kompatibilní, jasné názvosloví a hierarchie | hotový | `02_KONTRAKTY`, `03_NOMENKLATURA` | |
| R-019 | engine pokryje transformace, pohyb, vykreslení, stíny, světla, fyziku, třídění úloh | plánovaný | fáze jádra, A1 až A3 | |
| R-020 | aspoň 75 % věrnosti s Half-Life, Quake III, RtCW, Counter-Strike; standard roku 2003 | upravený | `05_PARITA_2003`, D-013 | 30 ze 40 řádků s testem |
| R-021 | svižná mutace (aréna) a realistická mutace; jemná motorika (kliky, páky, vypínače, přístroje, psaní na počítači) | plánovaný | profily, A1.5, A1.6 | vzory upraveny, D-014 |
| R-022 | lze použít Three.js, Octree, Rapier s jasným rozdělením úloh | upravený | D-001, D-002 | Octree ne; jedna fyzika |
| R-023 | použitelné i pro jiné aplikace z pohledu první osoby | plánovaný | engine nezná žánr; hra je profil a data | ověří se až druhou aplikací |
| R-024 | poučit se z evoluce enginů až do roku 2026 | hotový (rozbor) | `01_ARCHITEKTURA` oddíl 3 | |
| R-025 | nad úrovní Planetky 8, xDoom, Soustavy 200, Arény, Dinoše ve všech aspektech | upravený | `01_ARCHITEKTURA` oddíl 7 | měří se proti Aréně v2 |
| R-026 | celý kód enginu do 10 MB | hotový (triviálně) | `06_ROZPOCTY` | nahrazeno užitečnějšími mezemi |
| R-027 | práce rozdělená do dvou souběžných sešen se sdíleným repem, skilly a balíkem | hotový | `04_SESNY`, `sesny/START_*` | |
| R-028 | neskončit po pěti sešnách zamotaný ve vlastních bolestech a rozporech | plánovaný | `04_SESNY` oddíl 7 | pozná se až po páté sešně |
