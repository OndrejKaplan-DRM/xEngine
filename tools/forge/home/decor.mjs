// Sada kit_home: světla, rostliny a dekor bytu. Stojací lampy (oblouková, trojnožka), pokojové rostliny (monstera,
// fíkus, kaktus, tchýnin jazyk), obrazy, hodiny, kulaté zrcadlo, radiátor, pianino a drobnosti na desku (vázy,
// stoh knih, svíčky, mísa s ovocem, reproduktor, herní konzole, rámeček s fotkou, stolní lampička, budík).
// Lampy jsou zatím dekor bez vlastního světla (světlo bytu dává předvolba); rozměry úvahou.

import { simple, staticFloor } from '../lab/common.mjs';
import { A, merge, T, roundedBox, flatBox, tube, cylinder, torus, lathe, moved, mTranslate, mRotate, at } from '../lab/appliance.mjs';
import { arc } from '../mesh/lathe.mjs';
import { mirrorFace } from './soft.mjs';

const pad = (i) => String(i).padStart(2, '0');
const floor = () => ({ components: staticFloor(), group: 'world' });
const wall = (h) => ({ components: { physics: { body: 'static' }, place: { mount: 'wall', height: h } } });
const mk = (cat, f) => (id, title, parts, o = {}) => simple(id, title, `home.${cat}`, parts, { gen: `home/decor.mjs#${f}`, ...o });

/** Květináč (soustružený) s hlínou; spodek v y = 0, poloměr r, výška h. */
function pot(k, r, h, mat) {
  return [
    A('body', `${k}_pot`, lathe([[0, 0], [r * 0.75, 0, 'c'], [r, h * 0.95], [r * 1.04, h], [r * 0.96, h], [r * 0.93, h * 0.9]], { seg: 16 }), mat),
    A('body', `${k}_soil`, cylinder(r * 0.93, h * 0.86, h * 0.9, { seg: 14 }), 'soil_home'),
  ];
}

/** List rostliny: protáhlý zploštělý kosočtverec z bodu [x, y, z], směr podle úhlů (yaw, pitch), délka l, šířka w. */
function leaf(x, y, z, yaw, pitch, l, w) {
  const g = lathe([[0, 0], [w / 2, l * 0.4, 'c'], [0, l]], { seg: 4 });
  return moved(g, at(mTranslate(x, y, z), mRotate('y', yaw), mRotate('x', pitch), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 1]));
}

/** Stojací lampy, rostliny, obrazy, hodiny, zrcadlo, radiátor, pianino. */
export function decor() {
  const one = mk('decor', 'decor');
  const plants = [];
  // monstera: listy na stoncích
  {
    const k = 'plant_floor_home_01';
    const lv = [];
    const st = [];
    for (let i = 0; i < 9; i++) {
      const a = i * 40;
      const tip = [Math.cos((a * Math.PI) / 180) * 0.3, 0.55 + (i % 3) * 0.2, Math.sin((a * Math.PI) / 180) * 0.3];
      st.push(tube([[0, 0.3, 0], [tip[0] * 0.5, tip[1] - 0.05, tip[2] * 0.5], tip], 0.006, 4, { bend: 0.1, bendSeg: 1 }));
      lv.push(leaf(tip[0], tip[1], tip[2], -a + 90, 70, 0.32, 0.26));
    }
    plants.push(one(k, 'Pokojová rostlina: monstera v květináči', [...pot(k, 0.2, 0.35, 'plant_pot_white'), A('body', `${k}_stems`, merge(st), 'plant_leaf'), A('body', `${k}_leaves`, merge(lv), 'plant_leaf')], floor()));
  }
  // fíkus: kmínek a koruna z listů
  {
    const k = 'plant_floor_home_02';
    const lv = [];
    for (let i = 0; i < 28; i++) {
      const a = i * 137.5;
      const yy = 0.9 + (i % 7) * 0.09;
      const rr = 0.12 + (i % 4) * 0.05;
      lv.push(leaf(Math.cos((a * Math.PI) / 180) * rr, yy, Math.sin((a * Math.PI) / 180) * rr, -a, 60 + (i % 3) * 15, 0.12, 0.06));
    }
    plants.push(one(k, 'Pokojová rostlina: fíkus', [...pot(k, 0.17, 0.3, 'plant_pot_clay'), A('body', `${k}_trunk`, tube([[0, 0.28, 0], [0.03, 0.7, 0.02], [0, 1.0, 0]], 0.018, 6, { bend: 0.2, bendSeg: 2 }), 'wood_walnut'), A('body', `${k}_leaves`, merge(lv), 'plant_leaf')], floor()));
  }
  // kaktus
  {
    const k = 'plant_floor_home_03';
    plants.push(one(k, 'Pokojová rostlina: sloupový kaktus', [...pot(k, 0.14, 0.24, 'plant_pot_clay'), A('body', `${k}_cactus`, merge([moved(lathe([[0.07, 0], [0.08, 0.6], ...arc(0, 0.6, 0.08, 0, 90, 3).slice(1)], { seg: 10 }), mTranslate(0, 0.22, 0)), moved(lathe([[0.04, 0], [0.045, 0.22], ...arc(0, 0.22, 0.045, 0, 90, 2).slice(1)], { seg: 8 }), at(mTranslate(0.07, 0.55, 0), mRotate('z', -50)))]), 'plant_leaf')], floor()));
  }
  // tchýnin jazyk: vzpřímené listy
  {
    const k = 'plant_floor_home_04';
    const lv = [];
    for (let i = 0; i < 10; i++) lv.push(leaf(Math.cos(i * 2.4) * 0.05, 0.24, Math.sin(i * 2.4) * 0.05, i * 36, 8 + (i % 3) * 6, 0.5 + (i % 4) * 0.08, 0.07));
    plants.push(one(k, 'Pokojová rostlina: tchýnin jazyk', [...pot(k, 0.13, 0.26, 'lacquer_anthracite'), A('body', `${k}_leaves`, merge(lv), 'plant_leaf')], floor()));
  }
  const pictures = [['picture_sea', 'moře'], ['picture_field', 'pole'], ['picture_forest', 'les']].map(([m, n], i) => {
    const k = `picture_frame_${pad(i + 1)}`;
    const [w, h] = i === 1 ? [0.9, 0.6] : [0.6, 0.8];
    return one(k, `Obraz v rámu (${n})`, [A('body', `${k}_frame`, roundedBox([-w / 2, -h / 2, 0], [w / 2, h / 2, 0.03], 0.006, 1), i === 2 ? 'wood_walnut' : 'lacquer_anthracite'), A('body', `${k}_mat`, flatBox([-w / 2 + 0.04, -h / 2 + 0.04, 0.03], [w / 2 - 0.04, h / 2 - 0.04, 0.0305]), 'lacquer_white'), A('body', `${k}_art`, flatBox([-w / 2 + 0.08, -h / 2 + 0.08, 0.0305], [w / 2 - 0.08, h / 2 - 0.08, 0.031]), m)], wall(1.55));
  });
  const ck = 'clock_wall_01';
  const hands = [moved(flatBox([-0.004, 0, 0], [0.004, 0.11, 0.003]), at(mTranslate(0, 0, 0.042), mRotate('z', -60))), moved(flatBox([-0.005, 0, 0], [0.005, 0.08, 0.003]), at(mTranslate(0, 0, 0.045), mRotate('z', 130)))];
  const ticks = Array.from({ length: 12 }, (_, i) => moved(flatBox([-0.003, 0.13, 0.04], [0.003, 0.15, 0.0415]), mRotate('z', i * 30)));
  const sk = 'mirror_round_01';
  const rk = 'radiator_01';
  const fins = Array.from({ length: 18 }, (_, i) => flatBox([-0.45 + i * 0.05 + 0.006, 0, 0.03], [-0.45 + (i + 1) * 0.05 - 0.006, 0.55, 0.1]));
  const pk = 'piano_01';
  return [
    one('floor_lamp_01', 'Stojací oblouková lampa', [
      A('body', 'floor_lamp_01_base', roundedBox([-0.16, 0, -0.16], [0.16, 0.05, 0.16], 0.02, 1), 'worktop_stone'),
      A('body', 'floor_lamp_01_arc', tube([[0, 0.05, -0.05], [0, 1.6, -0.05], [0.7, 1.95, -0.05], [1.3, 1.75, -0.05]], 0.012, 8, { bend: 0.5, bendSeg: 6 }), 'steel_chrome'),
      A('body', 'floor_lamp_01_shade', moved(lathe([[0.06, 0.2], [0.2, 0.02, 'c'], [0.19, 0], [0.05, 0.18], [0, 0.2]], { seg: 18 }), mTranslate(1.3, 1.55, -0.05)), 'lacquer_anthracite'),
    ], floor()),
    one('floor_lamp_02', 'Stojací lampa na trojnožce', [
      A('body', 'floor_lamp_02_legs', merge([0, 1, 2].map((i) => tube([[0, 1.1, 0], [Math.cos(i * 2.094) * 0.25, 0.014, Math.sin(i * 2.094) * 0.25]], 0.012, 6))), 'wood_walnut'),
      A('body', 'floor_lamp_02_shade', moved(lathe([[0.18, 0], [0.16, 0.3], [0.155, 0.3], [0.175, 0.005]], { seg: 18 }), mTranslate(0, 1.15, 0)), 'bedding_white'),
      A('body', 'floor_lamp_02_stem', cylinder(0.01, 1.05, 1.2, { seg: 6 }), 'brass'),
    ], floor()),
    ...plants,
    ...pictures,
    one(ck, 'Nástěnné hodiny', [A('body', `${ck}_rim`, moved(lathe([[0.17, 0], [0.18, 0.02, 'c'], [0.17, 0.04], [0.16, 0.04]], { seg: 24 }), mRotate('x', 90)), 'lacquer_anthracite'), A('body', `${ck}_face`, moved(cylinder(0.162, 0, 0.038, { seg: 24 }), mRotate('x', 90)), 'lacquer_white'), A('body', `${ck}_marks`, merge([...ticks, ...hands]), 'plastic_black')], wall(1.8)),
    one(sk, 'Kulaté zrcadlo', [A('body', `${sk}_frame`, moved(torus(0.3, 0.015, 0, { seg: 28, n: 3 }), at(mTranslate(0, 0, 0.015), mRotate('x', 90))), 'brass'), ...mirrorFace('body', sk, 0, 0.29, 0, null, 0.008)], wall(1.6)),
    one(rk, 'Článkový radiátor s ventilem', [A('body', `${rk}_fins`, merge(fins), 'lacquer_white'), A('body', `${rk}_pipes`, merge([tube([[-0.47, 0.05, 0.065], [-0.5, 0.05, 0.065], [-0.5, -0.1, 0.065]], 0.009, 6, { bend: 0.02, bendSeg: 1 }), tube([[0.47, 0.5, 0.065], [0.5, 0.5, 0.065]], 0.009, 6)]), 'steel_chrome'), A('body', `${rk}_valve`, moved(cylinder(0.025, 0, 0.07, { seg: 10, edge: 0.006, n: 1 }), mTranslate(0.5, 0.48, 0.065)), 'lacquer_white')], wall(0.15)),
    one(pk, 'Pianino', [
      A('body', `${pk}_case`, merge([roundedBox([-0.75, 0.0, -0.3], [0.75, 1.25, 0.0], 0.012, 1), roundedBox([-0.75, 0.62, 0.0], [0.75, 0.76, 0.3], 0.01, 1), flatBox([-0.75, 0.0, 0.0], [-0.7, 0.62, 0.28]), flatBox([0.7, 0.0, 0.0], [0.75, 0.62, 0.28])]), 'lacquer_anthracite'),
      A('body', `${pk}_keys`, flatBox([-0.66, 0.74, 0.12], [0.66, 0.77, 0.3]), 'ceramic_white'),
      A('body', `${pk}_black`, merge(Array.from({ length: 36 }, (_, i) => flatBox([-0.64 + i * 0.0365, 0.77, 0.12], [-0.627 + i * 0.0365, 0.785, 0.21])).filter((_, i) => i % 7 !== 2 && i % 7 !== 6)), 'plastic_black'),
      A('body', `${pk}_pedals`, merge([-0.08, 0, 0.08].map((x) => flatBox([x - 0.015, 0.04, 0.0], [x + 0.015, 0.05, 0.12]))), 'brass'),
    ], floor()),
  ];
}

/** Drobnosti na desku stolu, polici nebo komodu. */
export function tops() {
  const one = mk('decor', 'tops');
  const vase = (k, prof, mat) => one(k, 'Váza', [A('body', `${k}_vase`, lathe(prof, { seg: 16 }), mat)]);
  return [
    vase('vase_01', [[0, 0], [0.05, 0, 'c'], [0.07, 0.1, 'c'], [0.035, 0.22], [0.045, 0.26], [0.04, 0.26], [0.03, 0.22], [0, 0.21]], 'ceramic_white'),
    vase('vase_02', [[0, 0], [0.06, 0, 'c'], [0.06, 0.3, 'c'], [0.055, 0.3], [0.055, 0.01], [0, 0.01]], 'glass_tinted'),
    vase('vase_03', [[0, 0], [0.04, 0, 'c'], [0.09, 0.08, 'c'], [0.05, 0.16], [0.03, 0.18], [0, 0.17]], 'plant_pot_clay'),
    one('books_stack_01', 'Stoh knih', [A('body', 'books_stack_01_a', merge([flatBox([-0.12, 0, -0.08], [0.12, 0.035, 0.08]), moved(flatBox([-0.1, 0.035, -0.075], [0.1, 0.07, 0.075]), mRotate('y', 8))]), 'book_blue'), A('body', 'books_stack_01_b', moved(flatBox([-0.11, 0.07, -0.08], [0.11, 0.1, 0.08]), mRotate('y', -6)), 'book_red')]),
    one('candles_01', 'Svíčky na podnosu', [A('body', 'candles_01_tray', cylinder(0.12, 0, 0.012, { seg: 18, edge: 0.003, n: 1 }), 'brass'), A('body', 'candles_01_wax', merge([[-0.05, 0.12], [0.04, 0.08], [0.0, 0.16]].map(([x, h], i) => moved(cylinder(0.025, 0.012, 0.012 + h, { seg: 10 }), mTranslate(x, 0, i === 2 ? -0.04 : 0.02)))), 'ceramic_white')]),
    one('bowl_fruit_01', 'Mísa s ovocem', [A('body', 'bowl_fruit_01_bowl', lathe([[0, 0], [0.06, 0, 'c'], [0.14, 0.08], [0.135, 0.08], [0.055, 0.008], [0, 0.008]], { seg: 18 }), 'ceramic_white'), A('body', 'bowl_fruit_01_or', merge([[-0.04, 0.03], [0.05, -0.02], [0.0, 0.06]].map(([x, z]) => moved(lathe(arc(0, 0, 0.035, -90, 90, 4), { seg: 8 }), mTranslate(x, 0.05, z)))), 'fruit_orange'), A('body', 'bowl_fruit_01_gr', merge([[0.03, 0.05], [-0.05, -0.04]].map(([x, z]) => moved(lathe(arc(0, 0, 0.033, -90, 90, 4), { seg: 8 }), mTranslate(x, 0.07, z)))), 'fruit_green')]),
    one('speaker_01', 'Reproduktor', [A('body', 'speaker_01_box', roundedBox([-0.09, 0, -0.1], [0.09, 0.28, 0.1], 0.012, 1), 'wood_walnut'), A('body', 'speaker_01_cones', merge([moved(cylinder(0.06, 0, 0.004, { seg: 16 }), at(mTranslate(0, 0.09, 0.1), mRotate('x', 90))), moved(cylinder(0.025, 0, 0.004, { seg: 12 }), at(mTranslate(0, 0.21, 0.1), mRotate('x', 90)))]), 'plastic_black')]),
    one('console_game_01', 'Herní konzole s ovladačem', [A('body', 'console_game_01_box', roundedBox([-0.15, 0, -0.13], [0.15, 0.06, 0.13], 0.01, 1), 'plastic_black'), A('body', 'console_game_01_led', flatBox([-0.1, 0.02, 0.13], [-0.06, 0.025, 0.1305]), 'emit_display'), A('body', 'console_game_01_pad', moved(roundedBox([-0.075, 0, -0.04], [0.075, 0.03, 0.04], 0.015, 1), at(mTranslate(0.25, 0, 0.05), mRotate('y', -20))), 'plastic_anthracite')]),
    one('photo_frame_01', 'Rámeček s fotkou', [A('body', 'photo_frame_01_frame', moved(roundedBox([-0.08, 0, -0.008], [0.08, 0.2, 0.008], 0.004, 1), mRotate('x', -12)), 'wood_walnut'), A('body', 'photo_frame_01_photo', moved(flatBox([-0.065, 0.015, 0.008], [0.065, 0.185, 0.0085]), mRotate('x', -12)), 'picture_sea')]),
    one('lamp_bedside_01', 'Stolní lampička se stínidlem', [A('body', 'lamp_bedside_01_base', lathe([[0, 0], [0.07, 0, 'c'], [0.075, 0.02, 'c'], [0.03, 0.06], [0.012, 0.25], [0, 0.25]], { seg: 14 }), 'ceramic_white'), A('body', 'lamp_bedside_01_shade', moved(lathe([[0.13, 0], [0.09, 0.18], [0.085, 0.18], [0.125, 0.004]], { seg: 16 }), mTranslate(0, 0.2, 0)), 'bedding_white')]),
    one('alarm_clock_01', 'Budík', [A('body', 'alarm_clock_01_body', roundedBox([-0.06, 0, -0.03], [0.06, 0.08, 0.03], 0.015, 1), 'plastic_black'), A('body', 'alarm_clock_01_lcd', flatBox([-0.045, 0.02, 0.03], [0.045, 0.06, 0.0305]), 'emit_red')]),
    one('plant_pot_small_01', 'Malá rostlina v květináči', [...pot('plant_pot_small_01', 0.07, 0.12, 'plant_pot_white'), A('body', 'plant_pot_small_01_leaves', merge(Array.from({ length: 8 }, (_, i) => leaf(Math.cos(i * 2.4) * 0.02, 0.11, Math.sin(i * 2.4) * 0.02, i * 45, 40, 0.12, 0.05))), 'plant_leaf')]),
  ];
}
