# N-105: zlatý vzorek xLab je přesvícený

Sešna: A · Datum: 2026-11-22 · Stav: přijatý, provede základ po převodu světla

## Co potřebuju

Snížit svítivost světel nebo expozici ve zlatém vzorku (`tools/golden/make.mjs`), aby stěny nebyly skoro bílé.

## Proč to bez toho nejde

Jde to, ale obraz, který Ondřej uvidí, vypadá hůř, než engine umí, a svodná sešna podle něj bude ladit zapečené světlo. Engine svítí přesně podle kontraktu (kandely, útlum jako `PointLight`, expozice `env.exposure`) a jeho snímky se od xView liší o 0,01 až 0,18 z 255. Průměrný jas snímků 1366 × 768 po zapnutí lamp (`test/a_15_use.cjs`, softwarové vykreslení):

| Pohled | Průměrný jas z 255 |
|---|---|
| start, lampa zapnutá | 170 |
| chodba | 179 |
| laboratoř | 217 |
| hala | 162 |

Laboratoř má dvě pevná světla po 30 cd ve výšce 2,8 m a k tomu lampu 60 cd; při expozici 0,6 a tónové křivce ACES jsou bílé omítky na horní mezi rozsahu a ztrácí se tvar (kout místnosti není poznat). Bez lamp je to snesitelné jen ve startu (jas 86).

## Návrh

Jedno z toho, rozhodne svodná sešna:

1. `env.exposure` 0,6 → 0,25 (nejmenší zásah, jeden řádek), nebo
2. svítivost pevných světel a lamp dělit zhruba 2,5 a expozici nechat, nebo
3. lampy prefabu `lamp_ceiling_01` 60 cd → 20 cd a pevná světla v místnostech, kde lampa visí, ubrat (dnes svítí obojí naráz ze stejného místa).

K bodu 3: pevné světlo `l_start` a lampa `e_lamp_start` jsou 0,3 m od sebe. Až bude zapečené světlo, pevné světlo se zapeče a lampa přisvítí navrch; dvojí osvětlení téhož místa je v datech asi omylem.

## Dopad

Zlatý vzorek (bajtová shoda v T1 se obnoví přegenerováním), referenční snímky xView. Kód enginu ani formát se nemění.

## Dočasné řešení

Žádné: data zlatého vzorku nejsou moje. Testy sešny A porovnávají jas relativně, takže změnu snesou.

## Rozhodnutí

**Přijato v zásadě** (svodná sešna, 22. 11. 2026, D-034). Přesvícení potvrzuje i zkouška A × B (bílý pohled v `complex_7`, světla sešny B vycházejí ze zlatého vzorku). Data teď neměním: engine přechází na světlo po vrcholech (první úkol vlny 2) a jas se musí ladit jednou, proti novému vykreslení. Potom varianta 3 z návrhu (zrušit dvojí osvětlení téhož místa, lampy 60 → 20 cd) a podle výsledku expozice. Sešna B do té doby drží své svítivosti.
