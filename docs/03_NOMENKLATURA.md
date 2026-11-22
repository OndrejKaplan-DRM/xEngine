# Názvosloví

Krátké a závazné. Když si nejsi jistá jménem, hledej tady dřív, než vymyslíš nové.

## Jména věcí

| Věc | Tvar | Příklad |
|---|---|---|
| součást ekosystému | `x` + jméno | xKernel, xSpace, xForge |
| soubor a složka | malá písmena, pomlčky | `read-pack.mjs`, `tools/forge` |
| systém jádra | jedno slovo, malými | `physics`, `player`, `io`, `doors` |
| událost | `oblast:sloveso` | `door:opened`, `cell:changed` |
| id v datech | malá písmena, číslice, podtržítko; nejvýš 48 znaků | `door_hinged_01` |
| prefab | `<co>_<varianta>_<nn>` | `lamp_ceiling_01` |
| kategorie prefabu | slova s tečkami | `arch.door`, `device.lab`, `prop.furniture`, `item.health`, `creature.humanoid` |
| materiál | `<látka>_<upřesnění>` | `concrete_wall`, `metal_dark` |
| vstup entity | sloveso v rozkazu, velbloudí zápis | `open`, `turnOn`, `setLevel` |
| výstup entity | co se stalo | `opened`, `pressed`, `on`, `changed` |
| cíl sestavení | malá písmena | `xview`, `xbench`, `xlab` |
| test | `t<číslo>_` základ, `a_`, `b_` sešny | `test/a_t1_pohyb.cjs` |
| větev | `zaklad-N`, `sesna-a`, `sesna-b`, `integrace-N` | |
| návrh změny | `N-<číslo>-<téma>.md` | `N-001-zapecene-svetlo.md` |

## Předpony id v levelu

| Předpona | Co |
|---|---|
| `c_` | buňka |
| `p_` | portál |
| `b_` | kvádr nebo klín |
| `e_` | entita |
| `l_` | světlo |
| `t_` | spouštěč |
| `sp_` | výchozí místo |

Předpony validátor nevynucuje; drž je kvůli čitelnosti výpisů.

## Slovník

| Česky | V kódu a datech | Význam |
|---|---|---|
| balík | pack | adresář s manifestem, daty a soubory |
| buňka | cell | vnitřní objem místnosti |
| portál | portal | otvor mezi dvěma buňkami |
| kvádr, klín | brush (`box`, `wedge`) | hrubá stavba levelu |
| prefab | prefab | znovupoužitelný předmět, zařízení nebo tvor |
| entita | entity | umístěný prefab |
| kostra | rig | uzly a klouby prefabu |
| uzel | node | bod kostry, na kterém visí díly |
| kloub | joint | stupeň volnosti (`hinge`, `slider`) |
| díl | part | viditelný tvar na uzlu |
| kolize | collider | kolizní tvar na uzlu |
| součást | component | pojmenovaná vlastnost prefabu (`physics`, `interact`…) |
| spojení | io | výstup jedné entity → vstup druhé |
| spouštěč | trigger | objem, který reaguje na vstup hráče |
| profil | profile | mutace enginu: `arena`, `real` |
| klidný režim | station | kamera ukotvená u stolu, panelu, terminálu |
| zlatý vzorek | golden | zmrazený referenční balík |
| základ | zaklad-N | zmrazený stav repa, ze kterého sešny vycházejí |
| svodná sešna | — | sešna, která slučuje a drží kontrakty |
| návrh | N-… | písemná žádost o změnu základu nebo kontraktu |

## Čísla a jednotky

Metry, sekundy, stupně, kilogramy, kandely. Barvy jako `[r, g, b]` v rozsahu 0 až 1 (lineárně). Verze formátu jedno celé číslo (`xspace: 1`), verze balíku `X.Y.Z`.
