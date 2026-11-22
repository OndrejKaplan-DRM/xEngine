# Zadání xEngine a xEcosystem: Ondřejova myšlenka

**Znění 2 · 2026-11-22 · autor: Ondřej Kaplan**

## Pravidla tohoto dokumentu

1. Text v oddílu A je Ondřejův a mění ho jen Ondřej. Sešny ho čtou jako první a nepřepisují ho, ani „pro upřesnění“.
2. Když se stav projektu od zadání liší, **zadání se kvůli tomu nemění**. Rozdíl se zapíše do oddílu C s tím, kdo ho zavedl.
3. Každá změna zadání má řádek v oddílu B s datem a původním zněním.
4. Rozhodnutí sešen (`DECISIONS.md`) zadání nenahrazují. Kde mu odporují, platí zadání, dokud Ondřej neřekne jinak.

## A. Zadání

Text je doslova podle Ondřeje. Změny jsou vyznačené značkou ⟦změna N⟧ a popsané v oddílu B.

Ze zkusenosti evoluce komercnich enginu her (jako Doom3, HalfLife, Quake, Unreal ) a nasich autentickych zkusenosti pri vyvoji nasich amaterskych 3D FPV strilecek vyvin sofistikovany 3D herni engine, ktery by spolehlive bezel i na Notebooku Lenovo T460 s 8GB RAM

Naprogramuj vzajemne kompatibilni:

**A/ xEngine** - podrobne definovany nize, jadro celeho ukolu; technicky nejvyznamnejsi soucast; nejvetsi intelektualni investice
- zde je potreba predvest skutecnou genialitu chapani prostoru, jeho vykreslovani a interakci teles pri dramaticke efektivite a strategickem nakladani s vypocetnim vykonem.

**B/ xForge** ⟦změna 1: dříve „xBlender“⟧ 3D Tool na tvorbu Assetu a 3D Objektu typu Blender; pripadne tool ktery Blender sofistikovane vyuziva a sam se uci a zdokonaluje svou praci s Blenderem, pripadne jeho praci sam plne zastoupi
- smyslem tohoto toolu je generovani presne takovych stuktur, ktere "pujdou na ruku" enginu i designeru. Zde se budou navrhovat bloky 3D sveta, stromy, nepratele, pohyby nepratel, zbrane, telesa, objekty, predmety, zdi s prasklinami, okna, dvere, pistole, vybaveni laboratore, pristroje, objekty interieru, zidle, obrazy, stoly, nabytek, lustr, lampicka, vypinac
- vse bude slouzit jako zakladni blok do Designeru, ktery objekty nacte a ve velkem s nimi bude schopen manipulace.
- cilem je ziskat co nejvic za co nejmin (co nejvetsi hyperrealosticnost za co nejmin trojulelniku)
- u nepratel a zivych tvoru, postupuj nejdrive navrhem kostry a pohybu kostry; udelej vsechny mozne pohyby zakladnich koster a na ne pak "nabaluj  maso" a fyziologicke pohyby ziskej jako emergentni proces zakladniho pochopeni biofyziky (analogicky postupuj u vsech predmetu, ktere maji nejaky stupen volnosti pohybu - zacni vzdy kostrou)

**C/ xSearcher** - tool na vyhledavani volnych assetu vsech typu (3D objekty, zvuky, textury, artefakty, sprity, hudba, herni doplky), ktere je mozne libovolne pouzivat, modifikovat a svobodne sirit bez zvlastnich omezeni
- Searcher bude hledat "vhodou korist" pro *(věta v původním zadání nedokončena)*

**D/ xShell**
Bude obsahovat zakladni shell hry, polozky menu, setup, utility, vyvojarske nastroje, bestiar, hitboxy, hitpointy, treninkove mapy, veskere nastaveni, integraci vsech soucasti tak, aby vse fungovalo, nic se slozite nedohledavalo a vse bylo logicky roztridene a strukturovane.
- informace o xSpace
- kompatibilita napric vsemi oblastmi

**E/ xDesigner** Jednoduchy a intuituvni 3D designer Map a 3D svetu s sirokym spektrem prvku umoznujicich velmi rychly design komplexnich prostredi se zakladni paletou prvku, ktere jdou dale ladit a customizovat.
- vyuziva prvky z xForge ⟦změna 1: dříve „z xBlenderu“⟧, pripadne primo prvky z xSearch a je schopen je na par kliku organizovat do velkych makrokomplexu:
- kliknu: objevi se katedrala;
- kliknu: objevi se veliky dum o nekolika patrech i s vnitrnim clenenenim (mistnosti, pricky, spajz, zachos, satnik) i s interierem (nabytek, skrine, TV, stolem, pohovka, obrazy, koupelna, kuchyne, linka, zachod, lekarnicka)
- kliknu: objevi se zahrada se stromy, zahony, kvetinami, cestou k domu, oplocenim, parkovaci plochou, pripadnym mistem pro stavbu
- kliknu: objevi se kopec pokryty travou a kvetinami s nahodnym rozmistenim stromu, keru a ruznych rostlin
- kliknu: a objevi se zmet katakomb s variabilni strukturou povrchu, reliefem, zakoutimi, krizovatkami, nerovnostmi, nepravidelnostmi
- kliknu: a objevi se obrovky futuristicky komplex s mistnostmi, technickymi schodisti, stroji, regaly, osvetlenim, halou, inzenyrskymi sitemi, logickym usporadanim stanovist, struktur, vchodu a vychodu...

**F/ xSpace** Uloziste variabilnich prvku hry: misto, kde je jadro konkretni hry: konkretni levely, mapy, obtiznost, prostredi, nepratele, ulozene pozice, pribeh, ukoly, nastaveni, herni data

Vsechny prvky musi byt vzajemne kompatibilni a jednotne s jasnym nazvoslovim, nomenklaturou a hierarchii ukolu, roli, promennych

**1/** Engine musi pokryt spektrum problemu a technik transformace, ktere jsou potreba.
Zoomovani, pohyb, vykreslovani, stiny, svetla, zakladni fyzika, presna definice pro management trideni ukolu (kolize, svetla, stiny, pohyb, gravitace, strileni, exploze...)
Tak aby bylo dosazeno alespon 75% vernosti a urovne s enginy pohanejici hry jako HalfLife, Quake 3 Arena, Return to the Castle of WolfenStein, CounterStrike.
- svizna mutace (arena), Doom 3, Quake 3 Arena
- realisticka mutace CounterStrike, HalfLife, Doom: the DarkAges
- musi tedy mit mutaci pro sviznou 3D FPV akci, strileni, boj, pohyb, exploze i mutaci pro klidnejsi a presnejsi pohyb a komplexnejsi akce a plneni uloh ve 3D (psani na pocitaci, pohled na stul, jemnejsi motorika pri ovladani klik, pak, vypinacu, spotrebicu, stroju, zarizeni, vodovodu, laboratornich pristroju)

Engine musi byt alespon na urovni zakladniho standardu her roku 2003

Muzes si pomoci zakladnimi knihovnami jako je: Three.js; Octree; Rapier s bezchybnym managementem a jasnym rozdelenim ukolu

**2/** Engine at je primarne navrzen pro 3D FPS hry, ale at se da jeho pouziti zobecnit i pro dalsi aplikace, ktere vyuzivaji vykreslovani 3D reality z pohledu prvni osoby

**3/** Pouc se z evoluce enginu, algoritmu, funkci, i matematickych triku, ke kterym jednotlive enginy dospely, a to az k dnesnimu datu, tedy k roku 2026

**4/** Engine musi byt ve vsech aspektech nad urovni projektu, ktere jsme spolecne vytvorili, tedy  OliverovaPlanetka8, xDoom, SlunecniSoustava200, Arena, Dinosaurus

**5/** Cely kod enginu se musi vejit do 50 MB. Editor a dalsi casti mohou mit 100 MB. Grafika a zvuky se nezapocitavaji. ⟦změna 2: dříve „do 10 MB“⟧

**6/** ⟦změna 3: nový bod⟧ Ve hre to musi vypadat skutecne. Telesa a objekty maji vypadat hyperrealisticky. Ciste, jednoduche tvary mohou zustat jako nahledy v xForge, kde je potreba cistota pro praci.

**7/** ⟦změna 4: nový bod⟧ Pomoci ma xSearcher: nalezt ruzne volne assety a ty importovat, pouzit je, nebo je upravit, neco z nich okopirovat, prevzit nebo se tim inspirovat.

**8/** ⟦změna 5: nový bod⟧ Projekt ma byt pripraveny i na prechod na rychlejsi pocitace s grafickou kartou. Na Lenovu T460 se nezustane naporad. Prace se bude prepouzivat a dal rozvijet. Ma existovat plan a prostor na pripad narustu vypocetniho vykonu (vyrazne vic grafickych prvku, shaderu, textur, detailu). Pocitat s tim uz ted pri stavbe celeho projektu, xEnginu i jeho souvisejicich toolu.

## B. Rejstřík změn

| # | Datum | Místo | Původně | Nově | Zdroj |
|---|---|---|---|---|---|
| 1 | 2026-11-22 | B/ a E/ | „xBlender“, „z xBlenderu“ | xForge, „z xForge“ | Ondřej svodné sešně: „xForge“. **Mění se jen jméno.** Popis nástroje zůstává doslova. |
| 2 | 2026-11-22 | 5/ | „Cely kod enginu se musi vejit do 10 MB“ | 50 MB pro kód enginu; editor a další části 100 MB; grafika a zvuky se nezapočítávají | Ondřej svodné sešně 17:33 |
| 3 | 2026-11-22 | nový bod 6/ | — | hra má vypadat skutečně; čistý vzhled jen pro nástroje | Ondřej v sešně B 13:51, doslova v oddílu D |
| 4 | 2026-11-22 | nový bod 7/ | — | xSearcher jako zdroj k importu, úpravě, převzetí a inspiraci | tamtéž |
| 5 | 2026-11-22 | nový bod 8/ | — | rezerva pro rychlejší stroje s grafickou kartou | tamtéž |

Body 6/ až 8/ sestavila svodná sešna z Ondřejových vět v oddílu D. Ondřej je má potvrdit nebo přepsat vlastními slovy.

## C. Kde se projekt od zadání liší (stav 2026-11-22)

Tohle nejsou dohodnuté změny zadání. Je to seznam míst, kde projekt zadání zatím neplní nebo kde sešna rozhodla jinak.

| Bod zadání | Stav projektu | Kdo rozdíl zavedl |
|---|---|---|
| B/ nástroj typu Blender, který se sám učí, případně Blender zastoupí | xForge je dnes knihovna generátorů v kódu; 49 prefabů z kvádrů a válců. Blender nepoužívá, nic se neučí. Svodná sešna v D-011 a v `00_VIZE` napsala, že náhradu Blenderu „nepostaví a neslíbí“. **Ondřej potvrdil jméno, ne tohle zúžení.** | svodná sešna |
| B/ stromy, nepřátelé a jejich pohyby, zbraně, zdi s prasklinami, obrazy | neexistuje; sada má dveře, ovladače, nábytek, svítidla, laboratorní přístroje a rekvizity | zatím neuděláno |
| B/ „co nejvetsi hyperrealosticnost za co nejmin trojulelniku“ | prefaby mají průměrně 169 trojúhelníků a jednu barvu na materiál; Ondřej: „příliš sterilní“ | sešna B, zatím neuděláno |
| B/ u tvorů nejdřív kostra a pohyby, potom „maso“ | kostru a klouby mají předměty; tvorové neexistují | zatím neuděláno |
| C/ xSearcher | změřená dosažitelnost zdrojů; nástroj neexistuje | zatím neuděláno |
| D/ xShell: vývojářské nástroje, bestiář, hitboxy, hitpointy, tréninkové mapy | Shell má titul, pauzu a nastavení; hra má přehled F3 a obrysy buněk F4 | zatím neuděláno |
| E/ xDesigner: klik → katedrála, dům, zahrada, kopec, katakomby, komplex | generátor xGen z příkazové řádky pro komplex a katakomby a prohlížeč levelů; klikací designer, dům, zahrada, kopec a katedrála neexistují | zatím neuděláno |
| F/ obtížnost, nepřátelé, uložené pozice, příběh, úkoly | formát levelu, prefabu a materiálu s validátorem; jádro umí uložit stav; ostatní neexistuje | zatím neuděláno |
| 1/ zoom, stíny, střílení, exploze | pohyb, kolize, dveře, vypínače, lampy, manipulace myší, terminál; zoom, stíny, zbraně a exploze nejsou | zatím neuděláno |
| 1/ stíny a světla | rozhodnutí D-022: na T460 žádné světlo po pixelech a žádná stínová mapa, světlo po vrcholech; stín má nést zapečené světlo | svodná sešna, podle měření T460 |
| 1/ mutace podle Doom 3 a Doom: The Dark Ages | D-014: svižná podle Quake III, klidná podle Half-Life a Counter-Strike; z Doom 3 jen obrazovky ve světě, z The Dark Ages nic | svodná sešna |
| 1/ „alespon 75% vernosti“ | D-013: 30 ze 40 řádků tabulky `05_PARITA_2003` s testem; splněno je málo | svodná sešna (způsob měření) |
| 1/ Three.js, Octree, Rapier | Three.js a Rapier; Octree se nepoužívá (D-002) | svodná sešna |
| 6/ ve hře to má vypadat skutečně | engine kreslí jednu barvu na materiál; textury a sítě `.glb` formát umí, nikdo je nekreslí | zatím neuděláno |
| 8/ rezerva pro silnější stroj | návrh N-006 (stupně kvality) od sešny B, nerozhodnutý | zatím neuděláno |

## D. Ondřejův komentář z 2026-11-22 doslova (sešna B)

Kristino, je to docela dobre. Avsak telesa a objekty jsou prilis sterilni. Zakladni tvary jsou dobre, ale ja potrebuju aby vypadala hyperrealisticky. Takto mohou vypadat jako nahledy v xForge, kde budeme potrebovat urcitou cistotu pro praci, ale ve hre to musi vypadat skutecne...
Co jim chybi? Maji malo trojuhelniku? Chybi jim textury? Vypadaji jako sterilni objekty generovene architektonickymi studii v roce 1995. Vsechni jim trochu zivota. Minimalne do hry...
Mohl by pomoci ten xSearch, kdy bys mohla nalezt ruzne volne assety a ty importovat, pouzit je, nebo je upravit, neco z nich okopirovat, prevzit nebo se tim inspirovat.
Ohledne kapacity - chci byt pripraveny i na prechod na rychlejsi pocitace s grafickou kartou - do budoucna. Na Lenovu T460 nezustanu naporad. Tedy je potreba myslet i dal. Praci planuju prepouzit a dal rozvijet. Mej tedy plan a prostor na pripad narustu vypocetniho vykonu, kdy budes moci pouzit vyrazne vic grafickych prvku, shaderu, textur, detailu... Uz ted s tim pocitej pri stavbe celeho projektu, xEnginu i jeho souvisejicich toolu.
