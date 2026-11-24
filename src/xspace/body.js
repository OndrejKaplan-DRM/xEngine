// Postava hráče: jediné místo, odkud se čtou její rozměry (N-008, D-040). Čte je engine (profily pohybu,
// kontrolér postavy), generátor levelů, robot zkoušky A × B i validátor. Profily pohybu (`arena`, `real`)
// k tělu přidávají jen rychlosti; kdyby jednou měly různé tělo, patří rozměry do dat levelu vedle `profile`.

const INCH = 0.0254;

/** Rozměry postavy v metrech. */
export const BODY = Object.freeze({
  height: 1.8, // výška kapsle
  radius: 0.35, // poloměr kapsle
  eye: 1.6, // oko nad nohama
  stepHeight: 18 * INCH, // nejvyšší schod, který postava vyjde bez skoku (0,4572 m)
  stepMinWidth: 0.15, // nejmenší hloubka schodu
  walkNormal: 0.7, // nejmenší svislá složka normály, po které se dá chodit (asi 45,6°)
});

/** Odstup, který kontrolér postavy (Rapier) drží od překážek, v metrech. */
export const CHARACTER_SKIN = 0.02;

/** Nejužší průchod, kterým postava projde: 2 × (poloměr + odstup) = 0,74 m. */
export const bodyWidth = (body = BODY, skin = CHARACTER_SKIN) => 2 * (body.radius + skin);
