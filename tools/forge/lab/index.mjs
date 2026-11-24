// Sada kit_lab: vybavení laboratoří (Ondřej 24. 11. 2026: „vědecké laboratoře“; laboratoře a IT první).
// Seznam rodin prefabů; každá rodina vrací pole { prefab, notes } (varianty rozměru, náplně, barvy).
// Čistý modul (bez přístupu k souborům): používá ho zápis balíku, testy i galerie.

import { buildTheme, asPack } from '../theme.mjs';
import { LAB_MATERIALS } from './materials.mjs';
import { GLASS } from './glass.mjs';

export const LAB_ID = 'kit_lab';
export const LAB_MAKERS = [...GLASS];

export const buildLab = () =>
  buildTheme({ id: LAB_ID, title: 'Laboratoře: sklo, plasty, chemikálie, přístroje (xForge)', version: '0.1.0', requires: ['kit_base'], makers: LAB_MAKERS, materials: LAB_MATERIALS });
export const labAsPack = () => asPack(buildLab());
