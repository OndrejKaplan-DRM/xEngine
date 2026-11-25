// Sada kit_lab: laboratorní nábytek (pracovní stoly s černou deskou a nástavbou, ostrůvek, stůl s výlevkou, regály,
// bezpečnostní skříně na chemikálie, digestoř 1,8 m, židle, vozíky, nouzová sprcha) a reaktory (stolní bioreaktory,
// nerezový bioreaktor 50 a 200 l, skleněný duplikovaný reaktor 20 a 50 l v rámu). Rozměry úvahou z katalogů
// laboratorního nábytku a reaktorů, neměřeno. Pracovní deska 0,9 m (laboratoř ve stoje, zadání sady).

import { box, boxc, cyl } from '../lib.mjs';
import { A, shell, door, barHandle, rail, lock, screen, casters, wireShelf, top, merge, roundedBox, flatBox, cylinder, torus, tube, lathe, moved, mTranslate, mRotate, at } from './appliance.mjs';
import { cone } from '../mesh/solids.mjs';
import { bevelBox } from '../shapes.mjs';
import { simple, moving, panel, vessel, staticFloor } from './common.mjs';

const CAT = 'lab.furniture';
const gen = (f) => `lab/furniture.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const TOP = 0.9;
const floor = (top) => ({ components: staticFloor(top), group: 'world' });
/** Volný pruh desky v hloubce (z od–do, prostor prefabu) před policemi nástavby; generátor na něj staví věci zády k nástavbě. */
const DECK_WALL = [-0.065, 0.37];

/**
 * Skříňky pod deskou (Ondřej 25. 11.: kus po kuse): zapuštěný sokl, korpus, pod deskou řada zásuvek, pod ní
 * dvířka se spárou 3 mm, každé čelo s nerezovým madlem. Bez kloubů (jen tvar). back = čela i na zadní straně
 * (ostrůvek). Čela jsou rovné desky; zaoblení 3 mm by z 2 m nebylo vidět a stálo by 100 △ na čelo.
 */
function under(key, x0, x1, d, o = {}) {
  const mat = o.mat || 'plastic_light';
  const pl = 0.1;
  const zf = d / 2 - 0.02; // čelo korpusu
  const fronts = [];
  const pulls = [];
  const n = Math.max(1, Math.round((x1 - x0) / (o.door ?? 0.6)));
  for (const side of o.back ? [1, -1] : [1]) {
    const z = side * zf;
    for (let i = 0; i < n; i++) {
      const a = x0 + ((x1 - x0) * i) / n + 0.0015;
      const b = x0 + ((x1 - x0) * (i + 1)) / n - 0.0015;
      const zz = (v) => (side > 0 ? [z, z + v] : [z - v, z]);
      const [za, zb] = zz(0.019);
      fronts.push(flatBox([a, TOP - 0.17, za], [b, TOP - 0.033, zb]), flatBox([a, pl + 0.003, za], [b, TOP - 0.173, zb]));
      const zh = side > 0 ? zb : za;
      const off = side * 0.028;
      for (const y of [TOP - 0.1, TOP - 0.24]) pulls.push(tube([[(a + b) / 2 - 0.08, y, zh], [(a + b) / 2 - 0.08, y, zh + off], [(a + b) / 2 + 0.08, y, zh + off], [(a + b) / 2 + 0.08, y, zh]], 0.0055, 4));
    }
  }
  const back = o.back ? -zf : -d / 2 + 0.02;
  return [
    A('body', `${key}_carcass`, flatBox([x0 + 0.002, pl, back], [x1 - 0.002, TOP - 0.03, zf]), mat),
    A('body', `${key}_fronts`, merge(fronts), mat),
    A('body', `${key}_pulls`, merge(pulls), 'steel_brushed'),
    A('body', `${key}_plinth`, flatBox([x0 + 0.02, 0, (o.back ? -zf : -d / 2) + 0.06], [x1 - 0.02, pl, zf - 0.06]), 'plastic_anthracite'),
  ];
}

/** Pracovní deska z kompaktního laminátu: zaoblené rohy, sražená hrana, mírný přesah. */
const benchTop = (key, x0, x1, z0, z1) => top('body', key, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, TOP - 0.03, TOP, 'bench_phenolic', 0.012);

/** Mediální lišta (zásuvky, plynové kohouty) na nástavbě: tmavý profil, bílé zásuvky, barevné kohouty. */
function servicePanel(key, x0, x1, y, z, side = 1) {
  const out = [A('body', `${key}_rail`, roundedBox([x0, y, side > 0 ? z : z - 0.04], [x1, y + 0.08, side > 0 ? z + 0.04 : z], 0.006, 1), 'aluminium')];
  const sockets = [];
  const taps = [];
  const k = Math.max(2, Math.floor((x1 - x0) / 0.3));
  const zf = side > 0 ? z + 0.04 : z - 0.04;
  for (let i = 0; i < k; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / k;
    if (i % 3 === 2) taps.push(moved(cylinder(0.012, 0, 0.03, { seg: 6 }), at(mTranslate(x, y + 0.04, zf), mRotate('x', side * 90))));
    else sockets.push(flatBox([x - 0.04, y + 0.012, side > 0 ? zf : zf - 0.004], [x + 0.04, y + 0.068, side > 0 ? zf + 0.004 : zf]));
  }
  out.push(A('body', `${key}_sockets`, merge(sockets), 'plastic_white'));
  if (taps.length) out.push(A('body', `${key}_taps`, merge(taps), 'cap_blue'));
  return out;
}

/** Pracovní stůl ke zdi s černou deskou, skříňkami a nástavbou s policemi a mediální lištou; délky 1,2, 1,5 a 1,8 m. */
export function benches() {
  const wall = [1.2, 1.5, 1.8].map((L, v) => {
    const d = 0.75;
    const k = `bench_lab_wall_${pad(v + 1)}`;
    const z0 = -d / 2 + 0.03;
    const parts = [
      ...under(k, -L / 2, L / 2, d),
      benchTop(k, -L / 2, L / 2, -d / 2, d / 2 + 0.01),
      // nástavba: zadní stěna, dva sloupky, dvě police s lemem, osvětlení pod horní policí
      A('body', `${k}_back`, flatBox([-L / 2, TOP, -d / 2], [L / 2, TOP + 0.75, z0]), 'plastic_light'),
      A('body', `${k}_posts`, merge([-1, 1].map((sx) => roundedBox([sx * (L / 2 - 0.02) - 0.02, TOP, z0], [sx * (L / 2 - 0.02) + 0.02, TOP + 0.76, z0 + 0.04], 0.004, 1))), 'aluminium'),
      A('body', `${k}_shelves`, merge([0.4, 0.7].map((y) => roundedBox([-L / 2 + 0.04, TOP + y, z0], [L / 2 - 0.04, TOP + y + 0.02, -d / 2 + 0.3], 0.004, 1))), 'steel_white'),
      A('body', `${k}_lips`, merge([0.4, 0.7].map((y) => flatBox([-L / 2 + 0.04, TOP + y + 0.02, -d / 2 + 0.29], [L / 2 - 0.04, TOP + y + 0.045, -d / 2 + 0.3]))), 'steel_white'),
      A('body', `${k}_light`, flatBox([-L / 2 + 0.1, TOP + 0.685, -d / 2 + 0.12], [L / 2 - 0.1, TOP + 0.697, -d / 2 + 0.16]), 'emit_cool'),
      ...servicePanel(k, -L / 2 + 0.06, L / 2 - 0.06, TOP + 0.05, z0),
    ];
    return simple(k, `Laboratorní stůl ke zdi ${String(L).replace('.', ',')} m s nástavbou`, CAT, parts, { gen: gen('benches'), components: staticFloor(TOP), group: 'world', params: { deck: DECK_WALL } });
  });
  const L = 2.4;
  const d = 1.5;
  const ik = 'bench_lab_island_01';
  const island = simple(ik, 'Laboratorní ostrůvek 2,4 m s policí na obě strany', CAT, [
    ...under(ik, -L / 2, L / 2, d, { back: true, door: 0.8 }),
    benchTop(ik, -L / 2, L / 2, -d / 2 - 0.01, d / 2 + 0.01),
    A('body', `${ik}_posts`, merge([-1, 1].map((sx) => roundedBox([sx * (L / 2 - 0.05) - 0.03, TOP, -0.03], [sx * (L / 2 - 0.05) + 0.03, TOP + 0.82, 0.03], 0.006, 1))), 'aluminium'),
    A('body', `${ik}_shelves`, merge([0.45, 0.78].map((y) => roundedBox([-L / 2 + 0.02, TOP + y, -0.18], [L / 2 - 0.02, TOP + y + 0.02, 0.18], 0.004, 1))), 'steel_white'),
    A('body', `${ik}_spine`, roundedBox([-L / 2 + 0.1, TOP, -0.06], [L / 2 - 0.1, TOP + 0.1, 0.06], 0.008, 1), 'aluminium'),
    A('body', `${ik}_sockets`, merge([-1, 1].flatMap((s) => [-0.8, -0.3, 0.3, 0.8].map((x) => flatBox([x - 0.04, TOP + 0.015, s > 0 ? 0.06 : -0.064], [x + 0.04, TOP + 0.085, s > 0 ? 0.064 : -0.06])))), 'plastic_white'),
  ], { gen: gen('benches'), components: staticFloor(TOP), group: 'world', params: { deck: [0.19, 0.74] } });
  const sinkL = 1.5;
  const sk = 'bench_lab_sink_01';
  const sink = simple(sk, 'Laboratorní stůl s výlevkou, baterií a oční sprchou', CAT, [
    ...under(sk, -sinkL / 2, sinkL / 2, 0.75, { door: 0.75 }),
    benchTop(sk, -sinkL / 2, sinkL / 2, -0.375, 0.385),
    // vana výlevky (nerez, zapuštěná do desky), výpusť, stojánek baterie s ramenem a pákou, oční sprcha, obklad
    A('body', `${sk}_basin`, merge([flatBox([-0.25, TOP - 0.2, -0.25], [0.25, TOP - 0.18, 0.25]), flatBox([-0.25, TOP - 0.2, -0.25], [-0.23, TOP + 0.002, 0.25]), flatBox([0.23, TOP - 0.2, -0.25], [0.25, TOP + 0.002, 0.25]), flatBox([-0.25, TOP - 0.2, -0.25], [0.25, TOP + 0.002, -0.23]), flatBox([-0.25, TOP - 0.2, 0.23], [0.25, TOP + 0.002, 0.25]), roundedBox([-0.27, TOP - 0.002, -0.27], [0.27, TOP + 0.004, 0.27], 0.003, 1)]), 'steel_brushed'),
    A('body', `${sk}_drain`, moved(cylinder(0.03, 0, 0.004, { seg: 10 }), mTranslate(0, TOP - 0.18, 0)), 'steel_dark'),
    A('body', `${sk}_tap`, tube([[0, TOP, -0.3], [0, TOP + 0.32, -0.3], [0, TOP + 0.32, -0.1], [0, TOP + 0.26, -0.08]], 0.012, 8, { bend: 0.06, bendSeg: 4 }), 'steel_chrome'),
    A('body', `${sk}_lever`, merge([roundedBox([-0.01, TOP + 0.04, -0.33], [0.01, TOP + 0.06, -0.22], 0.004, 1), moved(cylinder(0.02, 0, 0.05, { seg: 10 }), mTranslate(0, TOP, -0.3))]), 'steel_chrome'),
    A('body', `${sk}_eyewash`, merge([moved(cylinder(0.018, 0, 0.12, { seg: 8 }), mTranslate(0.5, TOP, -0.3)), tube([[0.5, TOP + 0.12, -0.3], [0.5, TOP + 0.16, -0.3], [0.5, TOP + 0.16, -0.18]], 0.012, 6, { bend: 0.03, bendSeg: 2 })]), 'paint_green'),
    A('body', `${sk}_eyecups`, merge([0.46, 0.54].map((x) => moved(lathe([[0.012, 0], [0.03, 0.025, 'c'], [0.03, 0.035]], { seg: 10 }), mTranslate(x, TOP + 0.15, -0.16)))), 'paint_yellow'),
    A('body', `${sk}_tiles`, flatBox([-sinkL / 2, TOP, -0.375], [sinkL / 2, TOP + 0.3, -0.355]), 'tile_white'),
  ], { gen: gen('benches'), components: staticFloor(TOP), group: 'world' });
  return [...wall, island, sink];
}

/** Regály: drátěný chromovaný (prázdný a se zásobami) ve dvou šířkách a nástěnná skříňka s prosklenými dvířky. */
export function shelving() {
  const rack = (w, stocked, v) => {
    const [d, h] = [0.45, 1.8];
    const k = `shelf_wire_${pad(v)}`;
    // kulaté sloupky s drážkami (pásky po 2,5 cm), nastavitelné patky, drátěné police s lemem
    const posts = [];
    const feetG = [];
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        posts.push(moved(cylinder(0.0125, 0.02, h, { seg: 8 }), mTranslate(sx * (w / 2 - 0.0125), 0, sz * (d / 2 - 0.0125))));
        feetG.push(moved(lathe([[0.018, 0], [0.018, 0.01, 'c'], [0.012, 0.02, 'c']], { seg: 6 }), mTranslate(sx * (w / 2 - 0.0125), 0, sz * (d / 2 - 0.0125))));
      }
    }
    const parts = [A('body', `${k}_posts`, merge(posts), 'steel_chrome'), A('body', `${k}_feet`, merge(feetG), 'plastic_black')];
    for (let i = 0; i < 5; i++) {
      const y = 0.12 + i * 0.4;
      parts.push(wireShelf('body', k, -w / 2 + 0.01, w / 2 - 0.01, -d / 2 + 0.01, d / 2 - 0.01, y + 0.012, 'steel_chrome', 0.15));
    }
    if (stocked) {
      const boxes = [];
      const bottles = [];
      const caps = [];
      const jugs = [];
      for (let i = 1; i < 4; i++) {
        const y = 0.12 + i * 0.4 + 0.016;
        for (let j = 0; j < Math.floor(w / 0.22); j++) {
          const x = -w / 2 + 0.12 + j * 0.22;
          const kind = (i + j) % 4;
          if (kind === 0) boxes.push(flatBox([x - 0.09, y, -0.15], [x + 0.09, y + 0.2, 0.15]));
          else if (kind === 1) {
            bottles.push(moved(lathe([[0.05, 0], [0.05, 0.16, 'c'], [0.02, 0.2], [0.02, 0.22]], { seg: 8 }), mTranslate(x, y, 0.05)));
            caps.push(moved(cylinder(0.022, 0, 0.025, { seg: 6 }), mTranslate(x, y + 0.22, 0.05)));
          } else if (kind === 2) boxes.push(flatBox([x - 0.09, y, -0.125], [x + 0.09, y + 0.12, 0.125]));
          else {
            jugs.push(flatBox([x - 0.07, y, -0.06], [x + 0.07, y + 0.16, 0.06]));
            caps.push(moved(cylinder(0.02, 0, 0.02, { seg: 6 }), mTranslate(x + 0.035, y + 0.16, 0)));
          }
        }
      }
      parts.push(A('body', `${k}_boxes`, merge(boxes), 'paper_kraft'), A('body', `${k}_bottles`, merge(bottles), 'glass_amber'), A('body', `${k}_caps`, merge(caps), 'plastic_white'), A('body', `${k}_jugs`, merge(jugs), 'plastic_hdpe'));
    }
    return simple(k, `Drátěný regál ${String(w).replace('.', ',')} m${stocked ? ' se zásobami' : ''}`, CAT, parts, { gen: gen('shelving'), ...floor() });
  };
  const wk = 'cabinet_wall_glass_01';
  const wallCab = simple(wk, 'Nástěnná skříňka s prosklenými dvířky', CAT, [
    A('body', `${wk}_box`, merge([flatBox([-0.5, 0, 0], [0.5, 0.7, 0.02]), roundedBox([-0.5, 0, 0], [-0.48, 0.7, 0.35], 0.004, 1), roundedBox([0.48, 0, 0], [0.5, 0.7, 0.35], 0.004, 1), roundedBox([-0.5, 0.68, 0], [0.5, 0.7, 0.35], 0.004, 1), roundedBox([-0.5, 0, 0], [0.5, 0.02, 0.35], 0.004, 1)]), 'plastic_light'),
    A('body', `${wk}_shelf`, flatBox([-0.48, 0.34, 0.02], [0.48, 0.356, 0.33]), 'plastic_white'),
    ...door('body', `${wk}_dl`, -0.495, -0.0015, 0.005, 0.695, 0.35, 0.02, { mat: 'plastic_light', window: [0.04, 0.04], flat: true }),
    ...door('body', `${wk}_dr`, 0.0015, 0.495, 0.005, 0.695, 0.35, 0.02, { mat: 'plastic_light', window: [0.04, 0.04], flat: true }),
    A('body', `${wk}_knobs`, merge([-0.03, 0.03].map((x) => moved(cylinder(0.008, 0, 0.02, { seg: 6 }), at(mTranslate(x, 0.35, 0.37), mRotate('x', 90))))), 'steel_chrome'),
    A('body', `${wk}_amber`, merge([-0.3, 0.15].map((x) => moved(lathe([[0.04, 0], [0.04, 0.12, 'c'], [0.015, 0.15], [0.015, 0.17]], { seg: 10 }), mTranslate(x, 0.356, 0.15)))), 'glass_amber'),
    A('body', `${wk}_clear`, merge([-0.1, 0.35].map((x) => moved(lathe([[0.04, 0], [0.04, 0.13, 'c'], [0.015, 0.15], [0.015, 0.17]], { seg: 10 }), mTranslate(x, 0.356, 0.15)))), 'glass_lab'),
    A('body', `${wk}_boxes`, merge([-0.38, 0.0, 0.3].map((x, i) => roundedBox([x - 0.08, 0.02, 0.05], [x + 0.08, 0.02 + 0.12 + i * 0.03, 0.28], 0.005, 1))), 'paper_kraft'),
  ], { gen: gen('shelving'), components: { physics: { body: 'static' }, place: { mount: 'wall', height: 1.5 } }, group: 'world' });
  return [rack(0.9, false, 1), rack(0.9, true, 2), rack(1.2, false, 3), rack(1.2, true, 4), wallCab];
}

/**
 * Bezpečnostní skříně na chemikálie: hořlaviny (žlutá) a kyseliny a louhy (bílá), dvoukřídlé, kloub u levého
 * křídla. Plášť, sokl, větrací hrdla nahoře, výstražné značky, madlo se zámkem, uvnitř vany na police.
 */
export function safetyCabinets() {
  return [['cabinet_flammable_01', 'Bezpečnostní skříň na hořlaviny', 'paint_yellow', 'label_band_red'], ['cabinet_corrosive_01', 'Bezpečnostní skříň na kyseliny a louhy', 'plastic_white', 'label_band_orange']].map(([id, title, mat, sign]) => {
    const [w, d, h] = [1.2, 0.6, 1.95];
    const zf = d / 2 - 0.04;
    const body = [
      shell('body', `${id}_l`, [-w / 2, 0.06, -d / 2], [-w / 2 + 0.03, h, zf], mat, 0.008),
      shell('body', `${id}_r`, [w / 2 - 0.03, 0.06, -d / 2], [w / 2, h, zf], mat, 0.008),
      shell('body', `${id}_t`, [-w / 2 + 0.028, h - 0.03, -d / 2], [w / 2 - 0.028, h, zf], mat, 0.008),
      A('body', `${id}_bb`, merge([flatBox([-w / 2 + 0.03, 0.06, -d / 2], [w / 2 - 0.03, 0.09, zf]), flatBox([-w / 2 + 0.03, 0.06, -d / 2], [w / 2 - 0.03, h - 0.03, -d / 2 + 0.03])]), mat),
      A('body', `${id}_trays`, merge([0.09, 0.6, 1.1].map((y) => roundedBox([-w / 2 + 0.04, y, -d / 2 + 0.04], [w / 2 - 0.04, y + 0.05, zf - 0.02], 0.006, 1))), 'steel_white'),
      A('body', `${id}_plinth`, flatBox([-w / 2 + 0.02, 0, -d / 2 + 0.02], [w / 2 - 0.02, 0.06, zf - 0.03]), 'plastic_anthracite'),
      A('body', `${id}_vents`, merge([-0.25, 0.25].map((x) => moved(lathe([[0.04, 0], [0.04, 0.05, 'c'], [0.03, 0.05, 'c'], [0.03, 0.02]], { seg: 10 }), mTranslate(x, h, -0.1)))), 'steel_brushed'),
      // pravé křídlo (pevné)
      ...door('body', `${id}_dr`, 0.002, w / 2 - 0.004, 0.065, h - 0.035, zf, 0.035, { mat }),
      A('body', `${id}_signr`, flatBox([0.15, h - 0.42, zf + 0.035], [0.4, h - 0.2, zf + 0.0356]), sign),
    ];
    return moving(id, title, CAT, body, {
      node: 'door', at: [-w / 2 + 0.004, 0.065, zf], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 100, kind: 'door', prompt: 'Otevřít skříň',
      parts: [
        ...door('door', `${id}_dl`, 0, w / 2 - 0.006, 0, h - 0.1, 0, 0.035, { mat }),
        barHandle('door', `${id}_dl`, w / 2 - 0.05, h * 0.38, h * 0.55, 0.035, { rad: 0.009, off: 0.03 }),
        ...lock('door', `${id}_dl`, w / 2 - 0.05, h * 0.34, 0.035),
        A('door', `${id}_signl`, flatBox([0.12, h - 0.45, 0.035], [0.4, h - 0.22, 0.0356]), sign),
      ],
      note: 'Křídlo bezpečnostní skříně se samozavíráním se otvírá o 90 až 110° a zavře se samo (požárně odolná skříň); 100°. Úvaha, neměřeno.',
    }, { gen: gen('safetyCabinets'), place: { mount: 'floor' }, group: 'world' });
  });
}

/** Digestoř 1,8 m s posuvným oknem, laboratorní židle (dvě výšky), vozík se dvěma policemi, nouzová sprcha. */
export function fumehoodAndMore() {
  const [w, d, h] = [1.8, 0.9, 2.4];
  const fk = 'fumehood_180_01';
  const hood = moving(fk, 'Digestoř 1,8 m s posuvným oknem', CAT, [
    ...under(fk, -w / 2, w / 2, d, { door: 0.6 }),
    benchTop(fk, -w / 2, w / 2, -d / 2, d / 2),
    // komora: boky, záda s odtahovou přepážkou, strop; čelní rám s horním panelem a světlem; hlídač proudění
    shell('body', `${fk}_l`, [-w / 2, TOP, -d / 2], [-w / 2 + 0.08, h, d / 2], 'plastic_white', 0.01),
    shell('body', `${fk}_r`, [w / 2 - 0.08, TOP, -d / 2], [w / 2, h, d / 2], 'plastic_white', 0.01),
    A('body', `${fk}_back`, merge([flatBox([-w / 2 + 0.08, TOP, -d / 2], [w / 2 - 0.08, h - 0.45, -d / 2 + 0.03]), flatBox([-w / 2 + 0.08, TOP + 0.1, -d / 2 + 0.1], [w / 2 - 0.08, h - 0.5, -d / 2 + 0.11])]), 'liner_white'),
    A('body', `${fk}_slots`, merge([TOP + 0.05, h - 0.55].map((y) => flatBox([-w / 2 + 0.12, y, -d / 2 + 0.105], [w / 2 - 0.12, y + 0.03, -d / 2 + 0.112]))), 'plastic_black'),
    shell('body', `${fk}_head`, [-w / 2, h - 0.45, -d / 2], [w / 2, h, d / 2], 'plastic_white', 0.012),
    A('body', `${fk}_lamp`, flatBox([-w / 2 + 0.15, h - 0.462, -d / 2 + 0.15], [w / 2 - 0.15, h - 0.45, d / 2 - 0.2]), 'emit_warm'),
    ...screen('body', `${fk}_mon`, w / 2 - 0.36, w / 2 - 0.12, h - 0.38, h - 0.25, d / 2, { buttons: 2, led: 'emit_green' }),
    A('body', `${fk}_taps`, merge([-1, 1].flatMap((s) => [0, 1].map((i) => moved(cylinder(0.012, 0, 0.04, { seg: 6 }), at(mTranslate(s * (w / 2 - 0.04), TOP + 0.25 + i * 0.12, d / 2 - 0.12), mRotate('z', -s * 90)))))), 'cap_blue'),
    A('body', `${fk}_cup`, flatBox([w / 2 - 0.3, TOP - 0.05, -d / 2 + 0.2], [w / 2 - 0.15, TOP + 0.003, -d / 2 + 0.35]), 'steel_brushed'),
  ], {
    node: 'sash', at: [0, TOP + 0.25, d / 2 - 0.03], joint: 'sash', type: 'slider', axis: [0, 1, 0], max: 0.6, kind: 'drawer', prompt: 'Vysunout okno',
    parts: [
      ...door('sash', `${fk}_sash`, -w / 2 + 0.09, w / 2 - 0.09, -0.03, 0.75, 0, 0.025, { mat: 'plastic_white', window: [0.03, 0.05], glass: 'glass_tinted' }),
      rail('sash', `${fk}_sash`, -0.4, 0.4, 0.0, 0.025, { rad: 0.008, off: 0.03, seg: 6 }),
    ],
    note: 'Okno digestoře jede svisle; pracovní otvor 40 až 50 cm, nahoru až 70 až 75 cm pro nakládání. Úvaha podle katalogů laboratorního nábytku, neměřeno.',
  }, { gen: gen('fumehoodAndMore'), place: { mount: 'floor', top: TOP }, group: 'world' });
  const stool = [['stool_lab_01', 'Laboratorní židle s opěradlem', 0.62, true], ['stool_lab_high_01', 'Vysoká laboratorní židle s kruhem pro nohy', 0.8, false]].map(([id, title, seat, back]) => {
    // kříž s pěti rameny a kolečky, plynový píst s krytem, čalouněný sedák, u vysoké kruh na nohy
    const arms = [];
    const wheels = [];
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5;
      const [cx, cz] = [Math.cos(a), Math.sin(a)];
      arms.push(tube([[0, 0.1, 0], [cx * 0.27, 0.075, cz * 0.27]], 0.016, 6));
      wheels.push(moved(cylinder(0.025, -0.012, 0.012, { seg: 8 }), at(mTranslate(cx * 0.28, 0.025, cz * 0.28), mRotate('z', 90))), moved(cylinder(0.008, 0.04, 0.075, { seg: 6 }), mTranslate(cx * 0.28, 0, cz * 0.28)));
    }
    const parts = [
      A('body', `${id}_arms`, merge([...arms, moved(cylinder(0.04, 0.07, 0.12, { seg: 10 }), mTranslate(0, 0, 0))]), 'plastic_anthracite'),
      A('body', `${id}_wheels`, merge(wheels), 'rubber_black'),
      A('body', `${id}_piston`, merge([moved(cylinder(0.028, 0.12, seat - 0.2, { seg: 10 }), mTranslate(0, 0, 0)), moved(cylinder(0.014, seat - 0.2, seat - 0.04, { seg: 8 }), mTranslate(0, 0, 0))]), back ? 'plastic_anthracite' : 'steel_chrome'),
      A('body', `${id}_seat`, moved(cylinder(0.2, seat - 0.04, seat + 0.03, { edge: 0.025, n: 2, seg: 16 }), mTranslate(0, 0, 0)), 'plastic_navy'),
    ];
    if (back) parts.push(A('body', `${id}_backbar`, tube([[0, seat - 0.03, -0.12], [0, seat - 0.03, -0.2], [0, seat + 0.25, -0.2]], 0.012, 6, { bend: 0.05, bendSeg: 2 }), 'steel_brushed'), A('body', `${id}_back`, roundedBox([-0.17, seat + 0.2, -0.235], [0.17, seat + 0.42, -0.19], 0.02, 1), 'plastic_navy'));
    else parts.push(A('body', `${id}_ring`, merge([torus(0.2, 0.01, seat - 0.38, { seg: 16, n: 4 }), ...[0, 1, 2].map((i) => tube([[0, seat - 0.38, 0], [Math.cos(i * 2.094) * 0.2, seat - 0.38, Math.sin(i * 2.094) * 0.2]], 0.007, 4))]), 'steel_chrome'));
    return simple(id, title, CAT, parts, { gen: gen('fumehoodAndMore'), components: staticFloor() });
  });
  const ck = 'cart_lab_01';
  const cart = simple(ck, 'Laboratorní vozík se dvěma policemi', CAT, [
    A('body', `${ck}_posts`, merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => moved(cylinder(0.012, 0.1, 0.9, { seg: 8 }), mTranslate(sx * 0.36, 0, sz * 0.21))))), 'steel_brushed'),
    A('body', `${ck}_trays`, merge([0.25, 0.85].map((y) => roundedBox([-0.38, y, -0.23], [0.38, y + 0.03, 0.23], 0.008, 1))), 'steel_brushed'),
    A('body', `${ck}_lips`, merge([0.25, 0.85].flatMap((y) => [flatBox([-0.38, y + 0.03, -0.23], [0.38, y + 0.05, -0.22]), flatBox([-0.38, y + 0.03, 0.22], [0.38, y + 0.05, 0.23])])), 'steel_brushed'),
    rail('body', `${ck}_push`, -0.2, 0.2, 0.92, -0.23, { rad: 0.011, off: -0.05 }),
    ...casters('body', ck, 0.78, 0.48, 0.1, 0.03),
    A('body', `${ck}_box`, roundedBox([-0.28, 0.88, -0.05], [-0.02, 0.97, 0.05], 0.01, 1), 'plastic_navy'),
    A('body', `${ck}_bottle`, moved(lathe([[0.05, 0], [0.05, 0.14, 'c'], [0.02, 0.17], [0.02, 0.19]], { seg: 10 }), mTranslate(0.15, 0.88, 0)), 'glass_amber'),
  ], { gen: gen('fumehoodAndMore'), components: staticFloor() });
  const sh = 'shower_emergency_01';
  const shower = simple(sh, 'Nouzová sprcha s oční sprchou', CAT, [
    A('body', `${sh}_base`, moved(cylinder(0.15, 0, 0.02, { edge: 0.005, n: 1, seg: 14 }), mTranslate(0, 0, 0)), 'paint_yellow'),
    A('body', `${sh}_pipe`, tube([[0, 0.02, 0], [0, 2.2, 0], [0, 2.2, 0.3]], 0.02, 8, { bend: 0.08, bendSeg: 4 }), 'paint_yellow'),
    A('body', `${sh}_head`, moved(lathe([[0.02, 0.06], [0.06, 0.04, 'c'], [0.13, 0.0, 'c'], [0, 0]], { seg: 16 }), mTranslate(0, 2.1, 0.3)), 'paint_green'),
    A('body', `${sh}_eye`, merge([tube([[0, 1.0, 0], [0, 1.0, 0.3]], 0.014, 6), moved(lathe([[0.03, 0], [0.13, 0.05, 'c'], [0.13, 0.06, 'c'], [0, 0.06]], { seg: 16 }), mTranslate(0, 0.98, 0.3))]), 'paint_green'),
    A('body', `${sh}_pull`, merge([tube([[0.03, 2.1, 0], [0.03, 1.55, 0]], 0.004, 4), roundedBox([-0.01, 1.48, -0.02], [0.07, 1.55, 0.02], 0.01, 1)]), 'steel_brushed'),
    A('body', `${sh}_sign`, flatBox([-0.15, 1.3, 0.021], [0.15, 1.45, 0.025]), 'label_band_green'),
  ], { gen: gen('fumehoodAndMore'), ...floor() });
  return [hood, ...stool, cart, shower];
}

/** Bioreaktory: stolní se skleněnou nádobou na řídicí věži (jedna a dvě nádoby), nerezový 50 l a 200 l; skleněné duplikované reaktory 20 a 50 l v rámu. */
export function reactors() {
  const glassVessel = (x, liq) => [...vessel('body', [[0.02, 0.07], [0.32, 0.07]], 'glass_lab', 0.65, liq).map((p) => ({ ...p, center: [x, p.center[1], 0] })), cyl('body', [x, 0.34, 0], 0.08, 0.03, 'y', 'steel_brushed'), cyl('body', [x, 0.42, 0], 0.035, 0.12, 'y', 'plastic_anthracite'), cyl('body', [x, 0.01, 0], 0.09, 0.02, 'y', 'steel_dark')];
  const tower = [...bevelBox('body', [-0.4, 0, -0.18], [-0.12, 0.65, 0.18], 'plastic_white', 0.01), box('body', [-0.38, 0.45, 0.18], [-0.14, 0.6, 0.182], 'emit_display'), ...[0, 1, 2].map((i) => cyl('body', [-0.34 + i * 0.08, 0.3, 0.2], 0.03, 0.04, 'z', 'plastic_light'))];
  const benchOne = simple('bioreactor_bench_01', 'Stolní bioreaktor se skleněnou nádobou', CAT, [...tower, ...glassVessel(0.05, 'liquid_yellow')], { gen: gen('reactors') });
  const benchTwo = simple('bioreactor_bench_02', 'Stolní bioreaktor se dvěma nádobami', CAT, [...tower, ...glassVessel(0.0, 'liquid_yellow'), ...glassVessel(0.2, 'liquid_pink')], { gen: gen('reactors') });
  const steel = [[50, 0.22, 0.6], [200, 0.33, 1.0]].map(([l, r, hv], v) => {
    const y0 = 0.55;
    const parts = [...[0, 1, 2].map((i) => box('body', [Math.cos(i * 2.094) * r * 0.8 - 0.025, 0, Math.sin(i * 2.094) * r * 0.8 - 0.025], [Math.cos(i * 2.094) * r * 0.8 + 0.025, y0 + 0.1, Math.sin(i * 2.094) * r * 0.8 + 0.025], 'steel_brushed')), ...vessel('body', [[y0, r * 0.5], [y0 + 0.08, r], [y0 + hv, r], [y0 + hv + 0.1, r * 0.6]], 'steel_brushed', 0, null), cyl('body', [0, y0 + hv + 0.2, 0], 0.07, 0.2, 'y', 'plastic_anthracite'), cyl('body', [r * 0.6, y0 + hv + 0.14, 0.0], 0.03, 0.1, 'y', 'steel_brushed'), cyl('body', [0, y0 + hv * 0.5, r + 0.01], 0.06, 0.02, 'z', 'glass_tinted'), box('body', [r + 0.15, 0, -0.3], [r + 0.75, 1.8, 0.3], 'plastic_white'), box('body', [r + 0.2, 1.3, 0.3], [r + 0.7, 1.7, 0.302], 'emit_display'), ...panel('body', 0.3, r + 0.2, r + 0.7, 1.0, 1.25, 4)];
    return simple(`bioreactor_steel_${l}_01`, `Nerezový bioreaktor ${l} l s řídicí skříní`, CAT, parts, { gen: gen('reactors'), ...floor() });
  });
  const jacket = [[20, 0.17, 0.45], [50, 0.24, 0.65]].map(([l, r, hv]) => {
    const y0 = 0.55;
    const parts = [...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box('body', [sx * 0.4 - 0.02, 0, sz * 0.32 - 0.02], [sx * 0.4 + 0.02, 2.1, sz * 0.32 + 0.02], 'steel_brushed'))), box('body', [-0.42, y0 + hv + 0.12, -0.34], [0.42, y0 + hv + 0.16, 0.34], 'steel_brushed'), ...vessel('body', [[y0 - 0.12, 0.04], [y0, r], [y0 + hv, r]], 'glass_lab', 0.55, 'liquid_amber'), cyl('body', [0, y0 + hv * 0.5, 0], r + 0.03, hv * 0.8, 'y', 'glass_tinted'), cyl('body', [0, y0 + hv + 0.25, 0], 0.08, 0.2, 'y', 'steel_dark'), cyl('body', [0.2, y0 + hv + 0.6, 0], 0.04, 0.6, 'y', 'glass_lab'), cyl('body', [0, y0 - 0.2, 0], 0.02, 0.15, 'y', 'glass_lab')];
    return simple(`reactor_jacketed_${l}_01`, `Skleněný duplikovaný reaktor ${l} l v rámu`, CAT, parts, { gen: gen('reactors'), ...floor() });
  });
  return [benchOne, benchTwo, ...steel, ...jacket];
}

export const LAB_FURNITURE = [benches, shelving, safetyCabinets, fumehoodAndMore, reactors];
