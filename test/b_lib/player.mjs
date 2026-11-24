// Skutečný hráč pro kontroly dat sešny B: rozměry ze základu (src/xspace/body.js, D-040), ne z generátoru.
// Profil pohybu levelu (`profile`) mění jen rychlosti; tělo je pro všechny profily stejné.
import { BODY, CHARACTER_SKIN } from '../../src/xspace/body.js';
import { PROFILES } from '../../src/play/profiles.js';

/** Hráč levelu podle jména profilu: poloměr kapsle, odstup kontroléru, r = obojí dohromady, šířka průchodu. */
export function playerOf(profileId) {
  if (!PROFILES[profileId]) throw new Error(`neznámý profil pohybu „${profileId}“`);
  const r = BODY.radius + CHARACTER_SKIN;
  return { profile: profileId, radius: BODY.radius, skin: CHARACTER_SKIN, r, width: 2 * r, height: BODY.height, step: BODY.stepHeight };
}

export const PROFILE_IDS = Object.keys(PROFILES);
