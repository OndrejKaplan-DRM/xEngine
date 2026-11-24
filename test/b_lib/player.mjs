// Skutečný hráč pro kontroly dat sešny B: rozměry se čtou z profilu pohybu enginu a z fyziky (oblast sešny A),
// ne z generátoru. Když sešna A postavu změní, kontroly průchodnosti to poznají samy.

import { PROFILES } from '../../src/play/profiles.js';
import { CHARACTER_SKIN } from '../../src/phys/phys.js';

/** Hráč levelu podle jména profilu: poloměr kapsle, odstup kontroléru, r = obojí dohromady, šířka průchodu. */
export function playerOf(profileId) {
  const p = PROFILES[profileId];
  if (!p) throw new Error(`neznámý profil pohybu „${profileId}“`);
  const r = p.radius + CHARACTER_SKIN;
  return { profile: profileId, radius: p.radius, skin: CHARACTER_SKIN, r, width: 2 * r, height: p.height, step: p.stepHeight };
}

export const PROFILE_IDS = Object.keys(PROFILES);
