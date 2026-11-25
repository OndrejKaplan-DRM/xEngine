# N-015: přehled xView u vysokého levelu

Sešna B, 25. 11. 2026. Vlastník: svodná sešna (`tools/xview`).

## Co se děje
Pohled „Přehled“ (`iso`) v `tools/xview/main.js` staví kameru do výšky `size.z * 0.6` nad nulou. Dům z předvolby `house`
(4 podlaží po 3 m, hloubka asi 17 m) je vysoký 12 m; kamera ve výšce asi 10 m tak stojí uvnitř nejvyššího podlaží
a vidí zvenku jen jeho strop a zeď (`test/out/b_level_house_1_iso.png`: jedna šedá plocha, 6 odstínů).

## Návrh
Výška kamery přehledu ze všech tří rozměrů, například `all.max.y + Math.max(size.x, size.z) * 0.6`, a cíl pohledu
ve výšce středu nejnižšího podlaží. Volitelně v přehledu skrýt podlaží nad vybraným (jako `ceiling: false`).

## Dočasné řešení v oblasti B
B-T4 u levelu vyššího, než je kamera přehledu, chce v přehledu jen tři odstíny místo osmi (zápis v nálezu testu).
Pohled ze startu kontroluje beze změny.
