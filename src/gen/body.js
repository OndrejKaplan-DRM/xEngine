// xGen: postava, pro kterou generátor staví. Jediné místo v generátoru, kde jsou rozměry hráče.
//
// Level xSpace nese jen jméno profilu pohybu (`profile`); rozměry kapsle jsou v profilu enginu
// (src/play/profiles.js, oblast sešny A) a odstup kontroléru ve fyzice (src/phys/phys.js). Generátor běží
// i bez enginu (nástroje, prohlížeč), proto si na engine nesahá a má tuhle jednu kopii. Že se od enginu
// neodchýlila, hlídá test b_t1_xgen (čte profil enginu a porovnává). Návrh N-008: rozměry postavy do základu.
//
// Délky v centimetrech jako všude v generátoru.

export const BODY = {
  radius: 35, // poloměr kapsle hráče
  skin: 2, // odstup, který kontrolér postavy drží od překážek
  reserve: 3, // rezerva generátoru: průchod přesně na šířku kapsle se dá projít jen s dokonalým mířením
};

/** Šířka, kterou potřebuje kapsle s odstupem kontroléru (cm). Tohle musí splnit každý otvor a každé dveře. */
export const bodyWidth = (b = BODY) => 2 * (b.radius + b.skin);
/** Poloměr, se kterým generátor hledá cestu místností (m): kapsle, odstup a rezerva. */
export const passRadius = (b = BODY) => (b.radius + b.skin + b.reserve) / 100;
