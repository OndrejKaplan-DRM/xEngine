// Sada kit_home: vybavení bytu (Ondřej 25. 11. 2026 v 14:47: „(a) byt“ do čtyřpodlažního domu, horní patra byty).
// Obývák, kuchyň a jídelna, ložnice a dětský pokoj, koupelna a WC, předsíň a pracovna, dekor. Stojí na kit_base
// a kit_lab (chrom, sklo, plasty, displeje). Čistý modul bez přístupu k souborům.

import { buildTheme, asPack } from '../theme.mjs';
import { HOME_MATERIALS } from './materials.mjs';
import { sofas, armchairs, tables, storage } from './living.mjs';
import { decor, tops } from './decor.mjs';
import { units, dining, appliances } from './kitchen.mjs';
import { bedroom, kids } from './bedroom.mjs';
import { bath, hall } from './bath.mjs';
import { windows, yard } from './outdoor.mjs';
import { withFile } from '../lab/appliance.mjs';

export const HOME_ID = 'kit_home';
// sítě jdou do vlastního souboru sady (meshes/home.glb)
export const HOME_MAKERS = [sofas, armchairs, tables, storage, decor, tops, units, dining, appliances, bedroom, kids, bath, hall, windows, yard].map((make) => () => withFile('home', make));

export const buildHome = () =>
  buildTheme({ id: HOME_ID, title: 'Byt: obývák, kuchyň, ložnice, dětský pokoj, koupelna, předsíň (xForge)', version: '0.1.0', requires: ['kit_base', 'kit_lab'], makers: HOME_MAKERS, materials: HOME_MATERIALS });
export const homeAsPack = () => asPack(buildHome());
