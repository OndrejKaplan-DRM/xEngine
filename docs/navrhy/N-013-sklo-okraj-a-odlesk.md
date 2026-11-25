# N-013: sklo s okrajem a odleskem v běhu (pro sešnu A)

Sešna: B · Datum: 2026-11-25 · Stav: otevřený

## Co potřebuju

Aby průhledný materiál (`opacity` pod 1) kreslil i na stupni `low` dvě věci, které skutečné sklo má a průhledná barva ne:

1. **Okraj podle úhlu pohledu** (Fresnel): kde se hráč dívá na stěnu šikmo (obrys nádoby), je sklo hustší a světlejší.
2. **Odlesk**: světlý pruh tam, kde se v hladké ploše zrcadlí světlo nebo světlé okolí.

## Proč to bez toho nejde

Ondřej 25. 11. 2026 v 1:02 (volba 2 b): sklo ve hře je málo vidět, chce **výraznější okraj a odlesk**. Engine dnes kreslí sklo jako `MeshBasicMaterial` s barvou vrcholů, `transparent`, `opacity` a bez zápisu hloubky (`src/render/materials.js`, `make`). Okraj ani odlesk tak nevzniknou, protože barva nezávisí na směru pohledu.

## Dočasné řešení v datech (hotové, `31d1ed2`)

Každá nádoba `kit_lab` nese dvě doprovodné sítě (`tools/forge/lab/glassware.mjs`, `vesselGeom`):

- **lem**: horní okraj nádoby s kouskem vnější a vnitřní stěny, materiál `glass_rim` (opacity 0,72, světlejší) nebo `glass_amber_rim`;
- **odlesk**: dva svislé pruhy na vnější stěně vpředu vlevo a vpravo, materiál `glass_glint` (bílá, opacity 0,55).

Pruhy jsou namalované v prostoru prefabu, takže se točí s předmětem a nesledují světlo ani hráče. Stojí asi 100 až 250 △ na nádobu (`kit_lab` 181 016 △). Až bude odlesk v běhu, pruhy ze sady vyřadím (jeden řádek v `glassware.mjs`); lem zůstane, protože hustší sklo na okraji nádoby je i ve skutečnosti.

## Návrh

V `make()` pro materiál s `opacity` pod 1 a `model: 'lit'` přidat do shaderu (např. `onBeforeCompile` nad `MeshBasicMaterial`, bez světel po pixelech):

```text
f = pow(1 − |dot(n, v)|, 3)                      n normála plochy, v směr k oku
alpha = mix(opacity, 0.85, f)                    okraj hustší
color = color + f × 0.35 × barva_okolí           okraj světlejší
odlesk: h = normalize(v + l), s = pow(max(dot(n, h), 0), 40 / (rough + 0.02))
color += s × 0.6                                  l = směr k nejbližšímu světlu buňky, nebo pevně shora (0, 1, 0)
```

- Potřebuje normály ve vertex shaderu (síť je má, `partMesh` i `.glb`) a jeden směr světla jako uniform; bez stínové mapy a bez světel three.js, takže to neodporuje D-022 ani pravidlu stupně `low`.
- `rough` už v datech je (sklo 0,02 až 0,08, zábrus 0,6); `metal` nepotřebuju.
- Cena: průhledných pixelů je málo (sklo na stolech), odhad +0,1 ms na T460; **změří až `?bench`**.

## Dopad

- Sešna A: `src/render/materials.js` (shader průhledného materiálu), test obrazu (obrys skla světlejší než střed).
- Sešna B: po přijetí vyřadí pruhy odlesku ze sady.
- Základ: nic; formát se nemění (D-030 neplatí, nové pole není).

## Rozhodnutí

(vyplní svodná sešna)
