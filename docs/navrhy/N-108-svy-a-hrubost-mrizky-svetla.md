# N-108: švy mezi sítěmi světla a hrubost stínu

Sešna: A · Datum: 2026-11-22 · Stav: otevřený

## Co potřebuju

Rozhodnutí, jak má `brushLightMesh` řešit společné hrany sousedních ploch (dnes na nich vrcholy nelícují) a jak jemná má být mřížka tam, kde padá stín.

## Proč to bez toho nejde

Dvě věci, obě změřené na zlatém vzorku po převodu na světlo po vrcholech (commit `19b5377`):

1. **Švy.** Každá plocha kvádru má vlastní mřížku s buňkou nejvýš 0,5 m, dělenou podle své délky. Kde se stýká stěna se stropem nebo s podlahou, mají obě plochy na společné hraně jiný počet vrcholů. Rasterizace pak na hraně občas vynechá bod a prosvítá pozadí. Test `a_17_view` (pozadí v signální barvě, 48 pohledů, vyhlazování vypnuté): nejhorší pohled 21 bodů z 1 049 088, součet přes 48 pohledů 128 bodů. Body leží v pravidelných rozestupech podél hran místnosti (snímek `xLab_svy_2026-11-22.png` poslaný Ondřejovi). Ve hře je pozadí tmavá barva mlhy, takže jsou to tmavé tečky na světlé hraně; při pohybu mohou problikávat. Zadání (oddíl 6) říká nezáplatovat to posunem geometrie, proto návrh.
2. **Hrubý stín.** Zastínění se počítá po vzorcích (jeden paprsek na vzorek a světlo). Hrana stínu sloupu na podlaze a na stropě haly je zubatá po 0,5 m, protože mezi osvětleným a zastíněným vrcholem se jen lineárně prolíná. Stejně tak světlo těsně u plochy (lampa 0,3 m pod stropem) dá na stropě hranatou skvrnu.

## Návrh

Švy, dvě možnosti:

- **(a) mřížka zarovnaná na svět.** Vnitřní vrcholy plochy na násobcích `LIGHT_CELL` ve světových souřadnicích místo dělení délky plochy. Sousední plochy ve stejné rovině pak sdílejí vrcholy mřížky. Kolmé plochy (stěna × strop) je sdílejí také, pokud jejich společná hrana leží na téže mřížce. Zbývají švy tam, kde hrana jedné plochy končí uprostřed hrany druhé (překlad nad dveřmi). Mění počet a pořadí vrcholů, tedy kontrakt pro zapékání.
- **(b) průchod odstranění švů.** Po sestavení všech ploch levelu vložit na každou hranu vrcholy sousedních ploch, které na ní leží, a přilehlé trojúhelníky rozdělit. Odstraní švy úplně. Přidané vrcholy jsou další vzorky světla; pořadí původních se nemění, nové se přidávají na konec.

Doporučuji (a) a potom změřit, kolik bodů zbylo; (b) jen když to nebude stačit.

Stín, k rozhodnutí až s xBake (vlna 2): zjemnit mřížku jen u ploch, přes které jde hrana stínu, nebo počítat viditelnost víc paprsky na vzorek (světlo jako malá plocha) a ukládat zlomek. Obojí se dá spočítat při zapékání a za běhu nestojí nic.

## Dopad

(a) mění `brushLightMesh` a test T1 (počty vzorků zlatého vzorku 20 658 a 32 386 se změní). Engine sešny A čte síť přes `brushLightMesh` a žádný počet nemá natvrdo; testy `a_12_world` počítají z dat. Formát xSpace se nemění.

## Dočasné řešení

Žádné v geometrii. Test `a_17_view` rozlišuje díru (souvislá plocha pozadí, musí být 0) a šev (jednotlivé body, nejvýš 0,01 % obrazu) a počet bodů na švech hlídá, aby nerostl. Zapnuté vyhlazování hran švy rozmaže, ale na T460 stojí 4,4 až 6,2 ms na snímek.

## Doplněk 23. 11. 2026 (sešna A, po Ondřejově odpovědi „chci jemnější už teď“)

K hrubosti stínu jsem ve své oblasti udělala dvě věci; švů se netýkají.

1. **Okraj stínu po podílech** (`src/world/lightfield.js`, `soften`). Vzorek na hraně stínu se ptá 4 × 4 paprsky ze své plošky a svítí podílem. Mřížka vzorků ani jejich pořadí se nemění; kontrakt platí. xLab: 1 677 zjemněných položek z 31 255, paprsků 219 255 místo 66 104, stavba vrstev v sandboxu 345 až 371 ms místo 143 až 164 ms.
2. **Mřížka 0,25 m jako volba** (`world.lightCell`, nastavení Mřížka světla, adresa `?grid=0.25`). Volám `brushLightMesh(b, 0.25)` ze základu, vlastní kopii výpočtu nemám. xLab: 63 392 vzorků a 107 106 trojúhelníků (základ v `06_ROZPOCTY` uvádí pro 0,25 m 59 394 a 102 798 bez dílů prefabů).

**Co z toho plyne pro rozhodnutí:** volba 0,25 m je odchylka od kontraktu jen tehdy, když se zapne; zapečené světlo z xBake (N-001) na ní nesedí, protože počítá s 0,5 m. Bude-li Ondřej chtít 0,25 m jako výchozí, musí krok mřížky nést level nebo stupeň kvality (D-029) a xBake ho musí číst ze stejného místa. Navrhuju pole `env.lightCell` (volitelné, výchozí 0,5) a tentýž údaj v hlavičce souboru zapečeného světla.

## Rozhodnutí

Varianta (a) a vynechání schovaných ploch přijaty a provedeny (D-037, 24. 11. 2026, `a37bd48`, `3380bf2`); švy na zlatém vzorku 128 → 0, varianta (b) není potřeba. Doplněk s polem `env.lightCell` zamítnut (D-043): mřížka vzorků zůstává 0,5 m, jemný stín má řešit textura světla (N-110).
