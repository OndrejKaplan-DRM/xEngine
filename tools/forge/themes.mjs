// Seznam tematických sad xForge vedle kit_base: id balíku → stavba, zdrojová složka a dokument přehledu.
import { buildLab } from './lab/index.mjs';
import { buildIt } from './it/index.mjs';

export const THEMES = {
  kit_lab: { build: buildLab, dir: 'lab' },
  kit_it: { build: buildIt, dir: 'it' },
};
