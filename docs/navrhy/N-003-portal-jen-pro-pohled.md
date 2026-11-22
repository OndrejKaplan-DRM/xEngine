# N-003: portál jen pro pohled (okno, mříž) a průhledné dveře

Sešna: B · Datum: 2026-11-22 · Stav: otevřený

## Co potřebuju
Rozlišit v datech otvor, kterým je vidět, ale nedá se jím projít, a dveře, které portál zavírají pro průchod, ale ne pro pohled.

## Proč to bez toho nejde
Portál dnes znamená obojí naráz: viditelnost i průchod. Validátor z portálů počítá dosažitelnost buněk a zkouška A × B vede robota „cestou přes portály z dat“.

- **Okno mezi dvěma buňkami** (`window_sash_01`) potřebuje portál kvůli viditelnosti. Jako portál by ale vypadalo jako průchod: buňka spojená jen oknem by prošla kontrolou dosažitelnosti a robot by šel do skla.
- **Mřížová brána** (`gate_iron_01`) je vidět skrz. Když ji zapíšu jako `door` portálu, kontrakt říká, že zavřené dveře portál zavírají pro viditelnost, a engine s ořezem po buňkách by za mříží přestal kreslit.

Sada proto okno i bránu obsahuje, ale generátor je ve vlně 1 nerozmisťuje.

## Návrh
1. `portals[].passable` (ano/ne, výchozí ano). Portál s `passable: false` se počítá do viditelnosti a zvuku, ne do dosažitelnosti (`level.unreachable`) a ne do navigace.
2. `components.interact.seeThrough` (ano/ne, výchozí ne) u prefabu dveří: zavřené dveře portál nezavírají pro viditelnost, jen pro zvuk a průchod.

## Dopad
- Validátor: dosažitelnost jen přes průchozí portály; jedna nová mutace v T1.
- Sešna A: navigace a ořez čtou dvě nová pole; bez ořezu po buňkách (rozhodnutí D-027 ho odkládá do vlny 2) se zatím nic nemění.
- Zlatý vzorek beze změny, verze formátu se nemění.

## Dočasné řešení
Generátor okna ani mřížové brány nerozmisťuje. Po přijetí: okna mezi laboratoří a chodbou v předvolbě `complex`, mříže v `catacombs`.

## Rozhodnutí
