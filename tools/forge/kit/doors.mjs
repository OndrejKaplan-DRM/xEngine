// xForge, sada kit_base: dveře, brána a okno. Počátek = střed prahu otvoru, rovina dveří je místní XY,
// prochází se podél Z. Panty jsou na straně −X a křídlo se otevírá do −Z (kladný úhel kolem +Y).
// Rozměr v názvu je stavební otvor; zárubeň z něj ubere 5 cm z každé strany a shora.
// Zavřené dveře nesmějí mít průhlednou škvíru: engine místnost za zavřenými dveřmi portálu nekreslí (N-107).
// Mezery kolem křídla (5 mm po stranách, 10 mm nahoře a dole) proto kryjí dorazy zárubně a prahová lišta.

import { box, boxc, cyl, cbox, collide, node, hinge, slider, definePrefab, IO } from '../lib.mjs';

const FR = 0.05; // šířka zárubně
const HALF = 0.11; // polovina hloubky zárubně: zeď 0,2 m a 1 cm přesah na každé straně

const STOP = 0.015; // o kolik doraz přesahuje okraj křídla
const SLOT = 0.002; // vůle mezi dorazem a tím, co z líce křídla nejvíc vyčnívá
const STOP_D = 0.013; // tloušťka dorazu
const SILL_H = 0.012; // prahová lišta: o 2 mm vyšší než mezera pod křídlem

/**
 * Dorazy zárubně a prahová lišta. Dorazy leží za křídlem na straně +Z (křídlo se otevírá do −Z) a přesahují
 * jeho okraj o STOP; lišta leží pod křídlem. x0, x1 = světlý otvor; t = jak daleko od roviny dveří sahá křídlo
 * i s kováním na líci +Z. Bez kolize: křídlu nepřekážejí a postava je přejde.
 */
function seals(x0, x1, h, t, mat, { left = true, right = true } = {}) {
  const z0 = t + SLOT;
  const z1 = z0 + STOP_D;
  const top = h - FR - 0.01 - STOP;
  const out = [box('frame', [x0, 0, -0.015], [x1, SILL_H, 0.015], mat), box('frame', [x0, top, z0], [x1, h - FR, z1], mat)];
  if (left) out.push(box('frame', [x0, 0, z0], [x0 + 0.005 + STOP, top, z1], mat));
  if (right) out.push(box('frame', [x1 - 0.005 - STOP, 0, z0], [x1, top, z1], mat));
  return out;
}

const jamb = (x0, x1, h, mat) => box('frame', [x0, 0, -HALF], [x1, h, HALF], mat);
const head = (x0, x1, h, mat) => box('frame', [x0, h - FR, -HALF], [x1, h, HALF], mat);
const doorParts = { physics: { body: 'kinematic' } };
const NOTE_SWING = 'Interiérové dveře: panty by dovolily 180°, v ostění se křídlo zastaví o zeď nebo zarážku kolem 90–100°. Zvolená mez dá průchod plnou šířkou bez nárazu do zdi. Úvaha, neměřeno.';
const NOTE_LATCH = 'Klika rozetového kování se stlačuje o 25–35° a pružina ji vrací; 30°. Úvaha, neměřeno.';

/** Klika na obou lících křídla; uzel handle je v ose čtyřhranu, páka míří k pantům (−X). */
const handleParts = (mat) => [1, -1].flatMap((s) => [boxc('handle', [0, 0, s * 0.026], [0.05, 0.05, 0.012], mat), boxc('handle', [0, 0, s * 0.045], [0.018, 0.018, 0.05], mat), boxc('handle', [-0.055, 0, s * 0.064], [0.13, 0.018, 0.016], mat)]);

/** Otočné jednokřídlé dveře se zárubní a klikou. style: 'panel' (kazety), 'window' (průzor a okopový plech). */
export function doorHinged(o = {}) {
  const p = { id: 'door_wood_01', title: 'Dveře otočné dřevěné 1,0 × 2,1 m', width: 1, height: 2.1, leaf: 'wood_oak', frame: 'wood_old', trim: 'brass', inset: 'wood_old', style: 'panel', max: 95, hp: 250, surface: 'wood', ...o };
  const { width: w, height: h } = p;
  const lw = w - 2 * FR;
  const lh = h - FR - 0.01;
  const nodes = [node('frame'), node('leaf', 'frame', [-w / 2 + FR, 0, 0]), node('handle', 'leaf', [lw - 0.07, 1.05, 0])];
  const joints = [hinge('swing', 'leaf', [0, 1, 0], 0, p.max, { damping: 4, speed: 120, drive: 'both' }), hinge('latch', 'handle', [0, 0, 1], 0, 30, { spring: 60, damping: 2, drive: 'manual' })];
  const leaf = box('leaf', [0.005, 0.01, -0.02], [lw - 0.005, lh, 0.02], p.leaf);
  const parts = [jamb(-w / 2, -w / 2 + FR, h, p.frame), jamb(w / 2 - FR, w / 2, h, p.frame), head(-w / 2 + FR, w / 2 - FR, h, p.frame), ...seals(-w / 2 + FR, w / 2 - FR, h, 0.023, p.frame), leaf];
  for (const z of [0.02, -0.023]) {
    if (p.style === 'panel') parts.push(box('leaf', [0.12, 0.2, z], [lw - 0.12, 0.92, z + 0.003], p.inset), box('leaf', [0.12, 1.14, z], [lw - 0.12, lh - 0.18, z + 0.003], p.inset));
    else parts.push(box('leaf', [0.005, 0.01, z], [lw - 0.005, 0.26, z + 0.003], p.trim));
  }
  if (p.style === 'window') parts.push(box('leaf', [lw / 2 - 0.1, 1.35, -0.024], [lw / 2 + 0.1, 1.75, 0.024], 'glass_pane'));
  for (const y of [0.25, 1, 1.75]) parts.push(box('leaf', [-0.012, y, -0.034], [0.01, y + 0.1, -0.02], p.trim)); // panty na straně otevírání
  parts.push(...handleParts(p.trim));
  return definePrefab(
    {
      id: p.id,
      title: p.title,
      category: 'arch.door',
      nodes,
      joints,
      parts,
      colliders: [collide(leaf), cbox('frame', [-w / 2, 0, -HALF], [-w / 2 + FR, h, HALF]), cbox('frame', [w / 2 - FR, 0, -HALF], [w / 2, h, HALF])],
      components: { ...doorParts, interact: { kind: 'door', joint: 'swing', prompt: 'Otevřít', range: 1.8, manipulate: true }, health: { hp: p.hp, surface: p.surface } },
      ...IO.door,
      gen: 'doors.mjs#doorHinged',
      params: { width: w, height: h, style: p.style },
    },
    { swing: NOTE_SWING, latch: NOTE_LATCH },
  );
}

/** Prkenné dveře s kováním a kruhem místo kliky (sklepy, katakomby). */
export function doorPlank(o = {}) {
  const p = { id: 'door_plank_01', title: 'Dveře prkenné s kováním 1,0 × 2,0 m', width: 1, height: 2, max: 100, ...o };
  const { width: w, height: h } = p;
  const lw = w - 2 * FR;
  const lh = h - FR - 0.01;
  const parts = [jamb(-w / 2, -w / 2 + FR, h, 'wood_old'), jamb(w / 2 - FR, w / 2, h, 'wood_old'), head(-w / 2 + FR, w / 2 - FR, h, 'wood_old'), ...seals(-w / 2 + FR, w / 2 - FR, h, 0.027, 'wood_old')];
  parts.push(box('leaf', [0.005, 0.01, -0.016], [lw - 0.005, lh, 0.016], 'wood_old')); // jádro křídla: spáry mezi prkny nejsou průhledné
  const n = 5;
  const pw = (lw - 0.01) / n;
  for (let i = 0; i < n; i++) parts.push(box('leaf', [0.005 + i * pw + 0.002, 0.01, -0.02], [0.005 + (i + 1) * pw - 0.002, lh, 0.02], i % 2 ? 'wood_oak' : 'wood_old'));
  for (const y of [0.35, 1.55]) parts.push(box('leaf', [0, y, -0.027], [lw - 0.04, y + 0.07, 0.027], 'iron_black')); // pásové závěsy přes celé křídlo
  for (const s of [1, -1]) parts.push(cyl('leaf', [lw - 0.12, 1, s * 0.031], 0.055, 0.008, 'z', 'iron_black'), boxc('leaf', [lw - 0.12, 1.06, s * 0.03], [0.03, 0.03, 0.02], 'iron_black'));
  return definePrefab(
    {
      id: p.id,
      title: p.title,
      category: 'arch.door',
      nodes: [node('frame'), node('leaf', 'frame', [-w / 2 + FR, 0, 0])],
      joints: [hinge('swing', 'leaf', [0, 1, 0], 0, p.max, { damping: 6, speed: 90, drive: 'both' })],
      parts,
      colliders: [cbox('leaf', [0.005, 0.01, -0.02], [lw - 0.005, lh, 0.02]), cbox('frame', [-w / 2, 0, -HALF], [-w / 2 + FR, h, HALF]), cbox('frame', [w / 2 - FR, 0, -HALF], [w / 2, h, HALF])],
      components: { ...doorParts, interact: { kind: 'door', joint: 'swing', prompt: 'Otevřít', range: 1.8, manipulate: true }, health: { hp: 300, surface: 'wood' } },
      ...IO.door,
      gen: 'doors.mjs#doorPlank',
      params: { width: w, height: h },
    },
    { swing: 'Těžké prkenné dveře na pásových závěsech: stejné meze jako u interiérových dveří (zastaví je ostění), o něco pomalejší kvůli hmotnosti. Úvaha, neměřeno.' },
  );
}

/** Posuvné dveře na pohon: křídlo zajede do kapsy ve zdi na straně +X. */
export function doorSliding(o = {}) {
  const p = { id: 'door_sliding_01', title: 'Dveře posuvné na pohon 1,0 × 2,1 m', width: 1, height: 2.1, leaf: 'steel_painted', frame: 'steel_dark', ...o };
  const { width: w, height: h } = p;
  const clear = w - 2 * FR;
  const lh = h - FR - 0.01;
  const leaf = box('leaf', [-clear / 2 - 0.01, 0.01, -0.025], [clear / 2 + 0.03, lh, 0.025], p.leaf);
  const parts = [
    jamb(-w / 2, -w / 2 + FR, h, p.frame),
    box('frame', [w / 2 - FR, 0, -HALF], [w / 2, h, -0.035], p.frame), // pravá zárubeň má štěrbinu pro křídlo
    box('frame', [w / 2 - FR, 0, 0.035], [w / 2, h, HALF], p.frame),
    head(-w / 2 + FR, w / 2 - FR, h, p.frame),
    ...seals(-w / 2 + FR, w / 2 - FR, h, 0.028, p.frame, { left: false, right: false }), // po stranách křídlo zajíždí do stojek
    box('frame', [w / 2 - FR, lh, -0.035], [w / 2, h, 0.035], p.frame), // štěrbina ve stojce je jen tak vysoká jako křídlo
    box('frame', [w / 2 - FR, 0, -0.015], [w / 2, SILL_H, 0.015], p.frame), // prahová lišta pokračuje štěrbinou
    box('frame', [-0.06, h - 0.04, HALF], [0.06, h - 0.015, HALF + 0.006], 'emit_green'),
    box('frame', [-0.06, h - 0.04, -HALF - 0.006], [0.06, h - 0.015, -HALF], 'emit_green'),
    leaf,
    box('leaf', [-clear / 2 - 0.01, 0.98, -0.028], [clear / 2 + 0.03, 1.1, 0.028], 'paint_yellow'),
    box('leaf', [-0.12, 1.4, -0.027], [0.12, 1.7, 0.027], 'glass_pane'),
  ];
  return definePrefab(
    {
      id: p.id,
      title: p.title,
      category: 'arch.door',
      nodes: [node('frame'), node('leaf', 'frame')],
      joints: [slider('slide', 'leaf', [1, 0, 0], 0, Math.round(clear * 100) / 100, { speed: 1.2, drive: 'motor' })],
      parts,
      colliders: [collide(leaf), cbox('frame', [-w / 2, 0, -HALF], [-w / 2 + FR, h, HALF])],
      components: { ...doorParts, interact: { kind: 'door', joint: 'slide', prompt: 'Otevřít', range: 1.8 } },
      ...IO.door,
      gen: 'doors.mjs#doorSliding',
      params: { width: w, height: h },
    },
    { slide: 'Automatické posuvné dveře: křídlo zajede celé do kapsy, zdvih = světlá šířka průchodu (0,9 m). Pohony pro pěší provoz jezdí zhruba 0,5–1,0 m/s; 1,2 m/s je zvoleno kvůli hratelnosti. Úvaha, neměřeno.' },
  );
}

/**
 * Jedno křídlo dvoukřídlých dveří 1,8 × 2,1 m. Formát verze 1 má jednu interakci a jeden kloub na prefab,
 * proto jsou dvoukřídlé dveře dvě entity se stejným počátkem (střed celého otvoru), svázané spojením opened → open.
 * Jedno křídlo samo otvor nezakryje, proto má `seeThrough`: dveře portálu, které ho zavírají pro průchod a zvuk,
 * ale ne pro pohled (kontrakt, N-107). Až bude v základu `follow` (N-002), budou z toho jedny dveře se dvěma křídly.
 */
export function doorDoubleLeaf(o = {}) {
  const p = { side: 'l', width: 1.8, height: 2.1, leaf: 'steel_painted', frame: 'steel_dark', trim: 'steel_brushed', max: 95, ...o };
  const { width: w, height: h } = p;
  const s = p.side === 'l' ? -1 : 1;
  const half = w / 2;
  const lw = half - FR - 0.004;
  const lh = h - FR - 0.01;
  const span = (a, b) => [Math.min(a, b), Math.max(a, b)];
  const lx = (a, b) => span(-s * a, -s * b); // místní X křídla: od pantu ke středu otvoru
  const lbox = (a, b, y0, y1, z0, z1, mat) => box('leaf', [lx(a, b)[0], y0, z0], [lx(a, b)[1], y1, z1], mat);
  const leaf = lbox(0.005, lw, 0.01, lh, -0.022, 0.022, p.leaf);
  const parts = [jamb(...span(s * half, s * (half - FR)), h, p.frame), head(...span(s * (half - FR), 0), h, p.frame), ...seals(...span(s * (half - FR), 0), h, 0.025, p.frame, { left: s < 0, right: s > 0 }), leaf, lbox(lw / 2 - 0.14, lw / 2 + 0.14, 1.3, 1.75, -0.026, 0.026, 'glass_pane')];
  for (const z of [0.022, -0.025]) parts.push(lbox(0.005, lw, 0.01, 0.26, z, z + 0.003, p.trim));
  for (const z of [0.05, -0.05]) parts.push(lbox(lw - 0.1, lw - 0.07, 0.9, 1.25, z - 0.012, z + 0.012, p.trim), lbox(lw - 0.1, lw - 0.07, 0.92, 0.95, Math.min(z, 0), Math.max(z, 0), p.trim), lbox(lw - 0.1, lw - 0.07, 1.2, 1.23, Math.min(z, 0), Math.max(z, 0), p.trim));
  // krycí lišta na pravém křídle překrývá spáru mezi křídly (8 mm) ze strany, kam se dveře otevírají
  if (s > 0) parts.push(lbox(lw - 0.026, lw + 0.016, 0.01, lh, -0.03, -0.022, p.trim));
  const side = p.side === 'l' ? 'levé' : 'pravé';
  return definePrefab(
    {
      id: p.side === 'l' ? 'door_dleft_01' : 'door_dright_01',
      title: `Dveře dvoukřídlé 1,8 × 2,1 m, ${side} křídlo`,
      category: 'arch.door',
      nodes: [node('frame'), node('leaf', 'frame', [s * (half - FR), 0, 0])],
      joints: [hinge('swing', 'leaf', [0, -s, 0], 0, p.max, { damping: 5, speed: 110, drive: 'both' })],
      parts,
      colliders: [collide(leaf), cbox('frame', [span(s * half, s * (half - FR))[0], 0, -HALF], [span(s * half, s * (half - FR))[1], h, HALF])],
      components: { ...doorParts, interact: { kind: 'door', joint: 'swing', prompt: 'Otevřít', range: 1.8, manipulate: true, seeThrough: true } },
      ...IO.door,
      gen: 'doors.mjs#doorDoubleLeaf',
      params: { width: w, height: h, side: p.side },
    },
    { swing: 'Křídlo dvoukřídlých dveří: stejná mez jako u jednokřídlých (ostění), obě křídla se otevírají na tutéž stranu. Úvaha, neměřeno.' },
  );
}

/** Mřížová brána. Je průhledná: generátor ji nezapisuje jako dveře portálu, jinak by engine za ní přestal kreslit. */
export function gateIron(o = {}) {
  const p = { id: 'gate_iron_01', title: 'Brána mřížová 1,0 × 2,1 m', width: 1, height: 2.1, max: 110, ...o };
  const { width: w, height: h } = p;
  const lw = w - 0.06;
  const lh = h - 0.12;
  const parts = [box('frame', [-w / 2, 0.2, -0.03], [-w / 2 + 0.025, 0.32, 0.03], 'iron_black'), box('frame', [-w / 2, 1.6, -0.03], [-w / 2 + 0.025, 1.72, 0.03], 'iron_black')];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const x = 0.01 + (i * (lw - 0.02)) / (n - 1);
    parts.push(boxc('leaf', [x, 0.04 + lh / 2, 0], [0.02, lh, 0.02], 'iron_black'));
  }
  for (const y of [0.1, 1.05, lh - 0.04]) parts.push(box('leaf', [0, y, -0.015], [lw, y + 0.04, 0.015], 'iron_black'));
  parts.push(boxc('leaf', [lw - 0.08, 1.07, 0], [0.12, 0.16, 0.05], 'steel_dark'));
  return definePrefab(
    {
      id: p.id,
      title: p.title,
      category: 'arch.door',
      nodes: [node('frame'), node('leaf', 'frame', [-w / 2 + 0.03, 0, 0])],
      joints: [hinge('swing', 'leaf', [0, 1, 0], 0, p.max, { damping: 8, speed: 70, drive: 'both' })],
      parts,
      colliders: [cbox('leaf', [0, 0.04, -0.02], [lw, 0.04 + lh, 0.02])],
      components: { ...doorParts, interact: { kind: 'door', joint: 'swing', prompt: 'Otevřít bránu', range: 1.8, manipulate: true } },
      ...IO.door,
      gen: 'doors.mjs#gateIron',
      params: { width: w, height: h },
    },
    { swing: 'Kovaná brána na čepech bez zárubně: otevře se dál než dveře, zastaví ji až zeď za čepem (kolem 110°). Úvaha, neměřeno.' },
  );
}

/** Okno s otvíravým křídlem. Počátek = střed spodní hrany otvoru; křídlo se otevírá do −Z. */
export function windowSash(o = {}) {
  const p = { id: 'window_sash_01', title: 'Okno s otvíravým křídlem 1,2 × 1,2 m', width: 1.2, height: 1.2, ...o };
  const { width: w, height: h } = p;
  const F = 0.06;
  const sw = w - 2 * F;
  const sh = h - 2 * F;
  const parts = [
    box('frame', [-w / 2, 0, -0.07], [-w / 2 + F, h, 0.07], 'plastic_ivory'),
    box('frame', [w / 2 - F, 0, -0.07], [w / 2, h, 0.07], 'plastic_ivory'),
    box('frame', [-w / 2 + F, 0, -0.07], [w / 2 - F, F, 0.07], 'plastic_ivory'),
    box('frame', [-w / 2 + F, h - F, -0.07], [w / 2 - F, h, 0.07], 'plastic_ivory'),
    box('sash', [0.003, 0.003, -0.03], [0.05, sh - 0.003, 0.03], 'plastic_ivory'),
    box('sash', [sw - 0.05, 0.003, -0.03], [sw - 0.003, sh - 0.003, 0.03], 'plastic_ivory'),
    box('sash', [0.05, 0.003, -0.03], [sw - 0.05, 0.05, 0.03], 'plastic_ivory'),
    box('sash', [0.05, sh - 0.05, -0.03], [sw - 0.05, sh - 0.003, 0.03], 'plastic_ivory'),
    box('sash', [0.05, 0.05, -0.006], [sw - 0.05, sh - 0.05, 0.006], 'glass_pane'),
    boxc('handle', [0, 0, -0.008], [0.03, 0.07, 0.016], 'steel_brushed'),
    boxc('handle', [0, -0.06, -0.026], [0.02, 0.14, 0.02], 'steel_brushed'),
  ];
  return definePrefab(
    {
      id: p.id,
      title: p.title,
      category: 'arch.window',
      nodes: [node('frame'), node('sash', 'frame', [-w / 2 + F, F, 0]), node('handle', 'sash', [sw - 0.025, sh / 2, -0.03])],
      joints: [hinge('swing', 'sash', [0, 1, 0], 0, 90, { damping: 3, drive: 'manual' }), hinge('latch', 'handle', [0, 0, 1], 0, 90, { detents: [0, 90], damping: 1, drive: 'manual' })],
      parts,
      colliders: [cbox('sash', [0.003, 0.003, -0.03], [sw - 0.003, sh - 0.003, 0.03]), cbox('frame', [-w / 2, 0, -0.07], [w / 2, F, 0.07]), cbox('frame', [-w / 2, h - F, -0.07], [w / 2, h, 0.07])],
      components: { physics: { body: 'kinematic' }, interact: { kind: 'door', joint: 'swing', prompt: 'Otevřít okno', range: 1.6, manipulate: true } },
      inputs: ['open', 'close', 'toggle'],
      outputs: ['opened', 'closed'],
      gen: 'doors.mjs#windowSash',
      params: { width: w, height: h },
    },
    { swing: 'Otvíravé okenní křídlo: do 90°, dál mu brání ostění. Úvaha, neměřeno.', latch: 'Okenní klika: dvě polohy po 90° (zavřeno, otevřeno), proto dvě zarážky.' },
  );
}

export const DOORS = [
  () => doorHinged(),
  () => doorHinged({ id: 'door_steel_01', title: 'Dveře otočné ocelové 1,0 × 2,1 m', leaf: 'steel_painted', frame: 'steel_dark', trim: 'steel_brushed', style: 'window', max: 100, hp: 600, surface: 'metal' }),
  () => doorPlank(),
  () => doorSliding(),
  () => doorDoubleLeaf({ side: 'l' }),
  () => doorDoubleLeaf({ side: 'r' }),
  () => gateIron(),
  () => windowSash(),
];
