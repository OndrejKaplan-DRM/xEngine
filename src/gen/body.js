// xGen: postava, pro kterou generátor staví. Rozměry hráče jsou v základu (src/xspace/body.js, N-008, D-040);
// generátor k nim přidává jen vlastní rezervu. Délky v centimetrech jako všude v generátoru.
import { BODY as PLAYER, CHARACTER_SKIN } from '../xspace/body.js';

const cm = (m) => Math.round(m * 100);

export const BODY = Object.freeze({
  radius: cm(PLAYER.radius), // poloměr kapsle hráče (35)
  skin: cm(CHARACTER_SKIN), // odstup, který kontrolér postavy drží od překážek (2)
  reserve: 3, // rezerva generátoru: průchod přesně na šířku kapsle se dá projít jen s dokonalým mířením
});

/** Šířka, kterou potřebuje kapsle s odstupem kontroléru (cm). Tohle musí splnit každý otvor a každé dveře. */
export const bodyWidth = (b = BODY) => 2 * (b.radius + b.skin);
/** Poloměr, se kterým generátor hledá cestu místností (m): kapsle, odstup a rezerva. */
export const passRadius = (b = BODY) => (b.radius + b.skin + b.reserve) / 100;
