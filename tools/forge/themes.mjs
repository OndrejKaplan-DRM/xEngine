// Seznam tematických sad xForge vedle kit_base: id balíku → stavba, zdrojová složka a dokument přehledu.
import { buildLab } from './lab/index.mjs';

export const THEMES = {
  kit_lab: { build: buildLab, dir: 'lab' },
};
