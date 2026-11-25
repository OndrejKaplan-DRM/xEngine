// Materiály sady kit_lab: sklo, laboratorní plasty, víčka, štítky, kapaliny, pláště přístrojů, displeje.
// Jména se nepotkají s kit_base (balíky se spojují, stejné id ve dvou balících je chyba). Kovy, dřevo, guma,
// obecné plasty a svítící LED bere sada z kit_base. Barvy jsou lineární, jas podle albeda skutečných povrchů
// (bílý plast přístrojů 0,75 až 0,8, papír 0,75, sklo průhledné). Kapaliny jsou neprůhledné kromě vody: uvnitř
// průhledného skla se dvě průhledné vrstvy kreslí v nejistém pořadí, neprůhledná kapalina se nakreslí vždy dobře.

const lit = (color, surface, o = {}) => ({ model: 'lit', color, rough: 0.9, metal: 0, uvScale: 1, surface, ...o });
const glow = (color, emissive, strength) => ({ model: 'emissive', color, emissive, emissiveStrength: strength, surface: 'glass' });

export const LAB_MATERIALS = {
  // sklo
  glass_lab: lit([0.76, 0.87, 0.88], 'glass', { rough: 0.05, opacity: 0.3 }), // borosilikát, čiré (lehce do zelenomodra, ať je ve hře vidět)
  glass_rim: lit([0.9, 0.97, 0.98], 'glass', { rough: 0.05, opacity: 0.72 }), // lem nádoby: sklo viděné po délce je hustší a světlejší
  glass_amber_rim: lit([0.6, 0.34, 0.1], 'glass', { rough: 0.08, opacity: 0.9 }), // lem hnědé lahve
  glass_glint: lit([1, 1, 1], 'glass', { rough: 0.02, opacity: 0.55 }), // pruh odlesku na vnější stěně (běh zrcadlení nekreslí)
  glass_amber: lit([0.42, 0.2, 0.04], 'glass', { rough: 0.08, opacity: 0.75 }), // hnědé sklo lahví
  glass_tinted: lit([0.55, 0.68, 0.72], 'glass', { rough: 0.05, opacity: 0.4 }), // tónované sklo dveří a krytů
  glass_thin: lit([0.82, 0.88, 0.9], 'glass', { rough: 0.05, opacity: 0.3, twoSided: true }), // tenké sklo jednou plochou (zkumavky, pipety, hodinové sklo)
  glass_frosted: lit([0.78, 0.8, 0.8], 'glass', { rough: 0.6, opacity: 0.7 }), // zabroušené sklo (zábrus, popisná plocha)
  enamel_white: lit([0.8, 0.8, 0.78], 'glass', { rough: 0.5 }), // bílý smalt rysek a popisů na skle
  cork: lit([0.4, 0.25, 0.13], 'wood', { rough: 0.95 }), // korkový kroužek a zátka
  porcelain: lit([0.8, 0.79, 0.76], 'stone', { rough: 0.25 }), // glazovaný porcelán (třecí miska, Büchnerova nálevka)
  ptfe: lit([0.78, 0.78, 0.76], 'plastic', { rough: 0.6 }), // teflonový kohout a zátka
  // laboratorní plasty
  plastic_pp: lit([0.82, 0.82, 0.79], 'plastic', { rough: 0.45, opacity: 0.6 }), // polypropylen, mléčný
  plastic_ps: lit([0.86, 0.9, 0.92], 'plastic', { rough: 0.1, opacity: 0.35 }), // polystyren, čirý (misky, destičky)
  plastic_ps_thin: lit([0.86, 0.9, 0.92], 'plastic', { rough: 0.1, opacity: 0.3, twoSided: true }), // tenký čirý polystyren jednou plochou (Petriho misky, víka)
  plastic_pp_thin: lit([0.84, 0.84, 0.8], 'plastic', { rough: 0.45, opacity: 0.55, twoSided: true }), // tenký mléčný polypropylen (zkumavky)
  plastic_hdpe: lit([0.74, 0.74, 0.71], 'plastic', { rough: 0.6 }), // bílý polyetylen (kanystry, lahve)
  plastic_white: lit([0.77, 0.78, 0.77], 'plastic', { rough: 0.5 }), // plášť přístrojů
  plastic_light: lit([0.55, 0.57, 0.58], 'plastic', { rough: 0.5 }), // světle šedé díly přístrojů
  plastic_anthracite: lit([0.06, 0.065, 0.07], 'plastic', { rough: 0.45 }), // tmavé panely
  plastic_navy: lit([0.03, 0.07, 0.18], 'plastic', { rough: 0.45 }),
  plastic_teal: lit([0.03, 0.3, 0.33], 'plastic', { rough: 0.45 }),
  plastic_lime: lit([0.35, 0.6, 0.08], 'plastic', { rough: 0.45 }),
  plastic_orange: lit([0.78, 0.27, 0.03], 'plastic', { rough: 0.45 }),
  paint_brown: lit([0.2, 0.09, 0.04], 'metal', { rough: 0.5 }), // hrdlo lahve s heliem (EN 1089-3)
  bench_phenolic: lit([0.05, 0.05, 0.055], 'plastic', { rough: 0.4 }), // černá pracovní deska
  // víčka a štítky
  cap_blue: lit([0.03, 0.15, 0.5], 'plastic', { rough: 0.4 }),
  cap_red: lit([0.55, 0.04, 0.03], 'plastic', { rough: 0.4 }),
  cap_yellow: lit([0.82, 0.6, 0.04], 'plastic', { rough: 0.4 }),
  cap_green: lit([0.05, 0.32, 0.1], 'plastic', { rough: 0.4 }),
  cap_purple: lit([0.22, 0.06, 0.4], 'plastic', { rough: 0.4 }),
  label_paper: lit([0.76, 0.75, 0.7], 'plastic', { rough: 0.9 }),
  label_band_red: lit([0.62, 0.06, 0.04], 'plastic', { rough: 0.8 }),
  label_band_blue: lit([0.05, 0.2, 0.55], 'plastic', { rough: 0.8 }),
  label_band_orange: lit([0.85, 0.35, 0.03], 'plastic', { rough: 0.8 }),
  label_band_green: lit([0.06, 0.4, 0.15], 'plastic', { rough: 0.8 }),
  // kapaliny a prášky
  liquid_water: lit([0.6, 0.7, 0.75], 'water', { rough: 0.05, opacity: 0.45 }),
  liquid_blue: lit([0.02, 0.09, 0.42], 'water', { rough: 0.05 }),
  liquid_red: lit([0.45, 0.02, 0.03], 'water', { rough: 0.05 }),
  liquid_amber: lit([0.5, 0.24, 0.03], 'water', { rough: 0.05 }),
  liquid_green: lit([0.05, 0.33, 0.08], 'water', { rough: 0.05 }),
  liquid_purple: lit([0.18, 0.03, 0.32], 'water', { rough: 0.05 }),
  liquid_pink: lit([0.62, 0.16, 0.22], 'water', { rough: 0.05 }), // živné médium s fenolovou červení
  liquid_yellow: lit([0.68, 0.52, 0.04], 'water', { rough: 0.05 }),
  powder_white: lit([0.8, 0.8, 0.77], 'dirt', { rough: 1 }),
  powder_blue: lit([0.15, 0.35, 0.65], 'dirt', { rough: 1 }), // modrá skalice
  // displeje a světla přístrojů
  emit_display: glow([0.08, 0.22, 0.4], [0.2, 0.55, 1], 1.5),
  emit_uv: glow([0.35, 0.18, 0.85], [0.45, 0.2, 1], 3),
  emit_amber: glow([0.95, 0.55, 0.1], [1, 0.6, 0.1], 2),
};
