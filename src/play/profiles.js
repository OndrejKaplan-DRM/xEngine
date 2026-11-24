// xPlay: profily pohybu. Mutace enginu je profil v datech, ne větev v kódu (docs/01_ARCHITEKTURA.md, oddíl 5).
// Zdroj hodnot: sada Level 1, 10_CASE_FPS, invariant F3. Jedna herní jednotka původních her = 0,0254 m.
// Jistota: arena 5/5 (Quake III Arena), real 3/5 (Counter-Strike, Half-Life): výchozí odhad, neladit naslepo.

import { BODY as BODY_DIMS } from '../xspace/index.js';

const U = 0.0254;

/** Rozměry postavy a pravidla terénu jsou v základu (`src/xspace/body.js`, D-040); profil k nim přidává jen chování. */
const BODY = {
  ...BODY_DIMS,
  snap: 0.3, // m, přichycení k zemi při chůzi dolů
  mass: 80, // kg, čím postava tlačí do beden
};

export const PROFILES = {
  arena: {
    id: 'arena',
    label: 'Aréna (svižný)',
    source: 'Quake III Arena',
    confidence: 5,
    ...BODY,
    maxSpeed: 320 * U, // 8,13 m/s
    accel: 10,
    friction: 6,
    stopSpeed: 100 * U,
    airAccel: 1,
    airCap: null, // bez stropu přání ve vzduchu
    gravity: 800 * U, // 20,3 m/s²
    jumpSpeed: 270 * U, // 6,86 m/s, výška výskoku 1,16 m
    jumpHold: false, // každý výskok na nový stisk (Ondřej 22. 11. 2026)
    jumpBuffer: true, // stisk ve vzduchu platí při dopadu, dokud se klávesa drží (jako Quake III)
  },
  real: {
    id: 'real',
    label: 'Real (klidný)',
    source: 'Counter-Strike, Half-Life',
    confidence: 3,
    ...BODY,
    maxSpeed: 250 * U, // 6,35 m/s
    accel: 5,
    friction: 4,
    stopSpeed: 75 * U,
    airAccel: 10,
    airCap: 30 * U, // 0,76 m/s
    gravity: 800 * U,
    jumpSpeed: 268 * U,
    jumpHold: false,
    jumpBuffer: false, // skok jen stiskem na zemi (jako Half-Life: držená klávesa po dopadu neskáče)
  },
};

export const PROFILE_IDS = Object.keys(PROFILES);

/** Profil podle id; neznámé id je chyba dat, ne důvod k tichému náhradnímu chování. */
export function profileById(id) {
  const p = PROFILES[id];
  if (!p) throw new Error(`Neznámý profil pohybu „${id}“. Známé: ${PROFILE_IDS.join(', ')}.`);
  return p;
}
