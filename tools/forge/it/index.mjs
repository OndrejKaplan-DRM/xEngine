// Sada kit_it: IT laboratoře, serverovny, open space IT firem a vývojová centra, superpočítače (Ondřej 24. 11. 2026).
// Stojí na kit_base a kit_lab (plasty přístrojů, displeje, sklo). Čistý modul bez přístupu k souborům.

import { buildTheme, asPack } from '../theme.mjs';
import { IT_MATERIALS } from './materials.mjs';
import { COMPUTERS } from './computers.mjs';
import { SERVER } from './server.mjs';
import { OFFICE } from './office.mjs';

export const IT_ID = 'kit_it';
export const IT_MAKERS = [...COMPUTERS, ...SERVER, ...OFFICE];

export const buildIt = () =>
  buildTheme({ id: IT_ID, title: 'IT: počítače, serverovna, open space (xForge)', version: '0.1.0', requires: ['kit_base', 'kit_lab'], makers: IT_MAKERS, materials: IT_MATERIALS });
export const itAsPack = () => asPack(buildIt());
