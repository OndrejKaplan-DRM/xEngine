// Sada kit_lab: vybavení laboratoří (Ondřej 24. 11. 2026: „vědecké laboratoře“; laboratoře a IT první).
// Seznam rodin prefabů; každá rodina vrací pole { prefab, notes } (varianty rozměru, náplně, barvy).
// Čistý modul (bez přístupu k souborům): používá ho zápis balíku, testy i galerie.

import { buildTheme, asPack } from '../theme.mjs';
import { LAB_MATERIALS } from './materials.mjs';
import { VESSELS } from './glass.mjs';
import { GLASS_KITS } from './glass_kits.mjs';
import { PLASTIC } from './plastic.mjs';
import { CHEM } from './chem.mjs';
import { BENCH } from './bench.mjs';
import { LARGE } from './large.mjs';
import { COLD } from './cold.mjs';
import { LAB_FURNITURE } from './furniture.mjs';
import { ANIMAL } from './animal.mjs';

export const LAB_ID = 'kit_lab';
export const LAB_MAKERS = [...VESSELS, ...GLASS_KITS, ...PLASTIC, ...CHEM, ...BENCH, ...LARGE, ...COLD, ...LAB_FURNITURE, ...ANIMAL];

export const buildLab = () =>
  buildTheme({ id: LAB_ID, title: 'Laboratoře: sklo, plasty, chemikálie, přístroje (xForge)', version: '0.1.0', requires: ['kit_base'], makers: LAB_MAKERS, materials: LAB_MATERIALS });
export const labAsPack = () => asPack(buildLab());
