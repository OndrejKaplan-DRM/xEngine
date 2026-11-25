// Sada kit_home: okna a venek domu (Ondřej 25. 11. 2026 v 17:00: „přidat okna do bytů … malé nádvoří kolem domu
// a schodové dveře do komplexu. Ať dům vypadá realisticky“). Okna do otvoru ve zdi (počátek uprostřed spodní hrany
// otvoru v rovině středu zdi, +Z do místnosti; zeď 20 cm): průhledné do bytů a na schodiště, matná na laboratorní
// podlaží (vnitřní a vnější polovina zvlášť, otvor bez portálu kryjí obě). Zábradlí ramene schodiště (stoupá po +X,
// rozměry stupně z předvolby house). Nádvoří: lampa, stromy, živý plot, lavička, stojan na kola, koš, stříška nad vchodem.

import { simple, staticFloor } from '../lab/common.mjs';
import { cbox } from '../lib.mjs';
import { A, merge, roundedBox, flatBox, tube, cylinder, lathe, moved, mTranslate, mRotate, at } from '../lab/appliance.mjs';
import { jitter, seedOf, weldNormals } from '../mesh/noise.mjs';
import { bounds } from '../mesh/geo.mjs';

const floor = () => ({ components: staticFloor(), group: 'world' });
const wall = (h) => ({ components: { physics: { body: 'static' }, place: { mount: 'wall', height: h } } });
const mk = (cat, f) => (id, title, parts, o = {}) => simple(id, title, `home.${cat}`, parts, { gen: `home/outdoor.mjs#${f}`, ...o });
const opening = (w, colliders, params) => ({ components: { physics: { body: 'static' }, place: { mount: 'opening', opening: [w, WIN_H] } }, colliders, params });
/** Kolize parapetů (vnitřní deska 15 cm přes líc zdi, venkovní plech s okapnicí). */
const sillIn = (w) => cbox('body', [-w / 2 - 0.05, -0.005, 0.06], [w / 2 + 0.05, 0.025, 0.25], 'world');
const sillOut = (w) => cbox('body', [-w / 2 - 0.03, -0.04, -0.16], [w / 2 + 0.03, 0.012, -0.03], 'world');

// ---- okna ----------------------------------------------------------------------------------------------------------
const WIN_H = 1.3;
/** Rám v rovině z0…z1: obdélník x0…x1, y0…y1 z lišt šířky b. */
const frame = (x0, x1, y0, y1, z0, z1, b) => merge([flatBox([x0, y0, z0], [x1, y0 + b, z1]), flatBox([x0, y1 - b, z0], [x1, y1, z1]), flatBox([x0, y0 + b, z0], [x0 + b, y1 - b, z1]), flatBox([x1 - b, y0 + b, z0], [x1, y1 - b, z1])]);
/** Křídla: n křídel vedle sebe v rámu x0…x1 (každé s lištou 5 cm a sklem). */
function sashes(k, w, n, z0, z1, glass) {
  const parts = [];
  const sw = (w - 0.12) / n;
  const bars = [];
  const panes = [];
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + 0.06 + i * sw;
    bars.push(frame(x0, x0 + sw, 0.06, WIN_H - 0.06, z0, z1, 0.055));
    panes.push(flatBox([x0 + 0.05, 0.11, (z0 + z1) / 2 - 0.004], [x0 + sw - 0.05, WIN_H - 0.11, (z0 + z1) / 2 + 0.004]));
  }
  parts.push(A('body', `${k}_sash`, merge(bars), 'lacquer_white'), A('body', `${k}_glass`, merge(panes), glass));
  return { parts, sw };
}

/** Okno průhledné (byty, schodiště): rám, dvě nebo jedno křídlo, kliky, vnitřní parapet, venkovní plech, odlesk skla. */
function clearWindow(k, w) {
  const n = w >= 1.2 ? 2 : 1;
  const { parts, sw } = sashes(k, w, n, -0.02, 0.05, 'glass_pane');
  const glint = [];
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + 0.11 + i * sw;
    // dva šikmé pruhy odlesku na skle (z obou stran, jako u laboratorního skla, N-013)
    for (const [t, d] of [[0.25, 0.07], [0.42, 0.03]]) glint.push(moved(flatBox([-d / 2, 0, -0.0015], [d / 2, 0.45, 0.0015]), at(mTranslate(x0 + (sw - 0.1) * t, 0.35, 0.015), mRotate('z', -28))));
  }
  return [
    A('body', `${k}_frame`, frame(-w / 2, w / 2, 0, WIN_H, -0.03, 0.06, 0.06), 'lacquer_white'),
    ...parts,
    A('body', `${k}_glint`, merge(glint), 'glass_glint'),
    // klika u volné hrany křídla (u dvou křídel u středového sloupku na obou)
    A('body', `${k}_handles`, merge(Array.from({ length: n }, (_, i) => moved(merge([flatBox([-0.012, -0.02, 0], [0.012, 0.02, 0.02]), flatBox([-0.009, -0.11, 0.015], [0.009, 0, 0.03])]), mTranslate(n === 2 ? (i ? 0.035 : -0.035) : w / 2 - 0.09, WIN_H / 2 + 0.05, 0.05)))), 'steel_brushed'),
    // vnitřní parapet: v ostění a 15 cm přes líc zdi; venkovní plech s okapnicí
    A('body', `${k}_sill_in`, merge([flatBox([-w / 2, 0, 0.06], [w / 2, 0.025, 0.1]), roundedBox([-w / 2 - 0.05, -0.005, 0.1], [w / 2 + 0.05, 0.025, 0.25], 0.008, 1)]), 'lacquer_white'),
    A('body', `${k}_sill_out`, merge([flatBox([-w / 2, 0, -0.1], [w / 2, 0.012, -0.03]), flatBox([-w / 2 - 0.03, -0.04, -0.16], [w / 2 + 0.03, 0.012, -0.1])]), 'aluminium'),
  ];
}

/** Matné okno laboratoře: vnitřní polovina (rám, mléčné sklo, parapet) a vnější (rám, sklo, plech) zvlášť. */
function frostedHalf(k, w, inner) {
  const [z0, z1] = inner ? [0.0, 0.06] : [-0.03, 0.0];
  const n = w >= 1.2 ? 2 : 1;
  const { parts } = sashes(k, w, n, z0, z1, 'glass_milky');
  return [
    A('body', `${k}_frame`, frame(-w / 2, w / 2, 0, WIN_H, z0, z1, 0.06), 'lacquer_white'),
    ...parts,
    // mléčné sklo zakryje otvor celý (bez portálu za ním nic není): deska přes celý světlý otvor rámu
    A('body', `${k}_cover`, flatBox([-w / 2 + 0.06, 0.06, inner ? 0.002 : -0.006], [w / 2 - 0.06, WIN_H - 0.06, inner ? 0.006 : -0.002]), 'glass_milky'),
    inner
      ? A('body', `${k}_sill`, merge([flatBox([-w / 2, 0, 0.06], [w / 2, 0.025, 0.1]), roundedBox([-w / 2 - 0.05, -0.005, 0.1], [w / 2 + 0.05, 0.025, 0.25], 0.008, 1)]), 'lacquer_white')
      : A('body', `${k}_sill`, merge([flatBox([-w / 2, 0, -0.1], [w / 2, 0.012, -0.03]), flatBox([-w / 2 - 0.03, -0.04, -0.16], [w / 2 + 0.03, 0.012, -0.1])]), 'aluminium'),
  ];
}

/** Okna a zábradlí ramene schodiště. */
export function windows() {
  const one = mk('window', 'windows');
  const out = [];
  for (const w of [1.2, 1.5]) {
    const cm = Math.round(w * 100);
    const glass = [cbox('body', [-w / 2, 0, -0.03], [w / 2, WIN_H, 0.06], 'world'), sillIn(w), sillOut(w)];
    out.push(
      one(`window_home_${cm}_01`, `Okno plastové ${cm} × 130 cm, průhledné`, clearWindow(`window_home_${cm}_01`, w), opening(w, glass, { width: w, height: WIN_H, kind: 'clear' })),
      one(`window_frosted_in_${cm}_01`, `Okno ${cm} × 130 cm s mléčným sklem, vnitřní polovina`, frostedHalf(`window_frosted_in_${cm}_01`, w, true), opening(w, [cbox('body', [-w / 2, 0, 0], [w / 2, WIN_H, 0.06], 'world'), sillIn(w)], { width: w, height: WIN_H, kind: 'frosted_in' })),
      one(`window_frosted_out_${cm}_01`, `Okno ${cm} × 130 cm s mléčným sklem, vnější polovina`, frostedHalf(`window_frosted_out_${cm}_01`, w, false), opening(w, [cbox('body', [-w / 2, 0, -0.03], [w / 2, WIN_H, 0], 'world'), sillOut(w)], { width: w, height: WIN_H, kind: 'frosted_out' })),
    );
  }
  out.push(stairRailing('railing_stair_01', 1, 10), stairRailing('railing_stair_02', 11, 19));
  return out;
}

/**
 * Zábradlí ramene schodiště po částech (rozměr dílu do 4 m): stupně předvolby house (17 × 28 cm, rameno 19 stupňů),
 * díl od stupně first do last. Počátek u paty prvního stupně dílu na hraně schodů, rameno stoupá po +X; sloupky
 * na lichých stupních, madlo 90 cm nad hranou stupně, svislé příčky po 12 cm.
 */
function stairRailing(k, first, last) {
  const [r, t] = [0.17, 0.28];
  const n = last - first + 1;
  const line = (x, dy) => dy + (r * x) / t + r / 2; // výška nad patou dílu ve vzdálenosti x (od středu prvního stupně)
  const x0 = t / 2;
  const x1 = (n - 0.5) * t;
  const posts = [];
  for (let i = 1; i <= n; i += 2) {
    const x = (i - 0.5) * t;
    posts.push(flatBox([x - 0.02, i * r, -0.02], [x + 0.02, line(x, 0.9), 0.02]));
  }
  const bars = [];
  for (let x = x0 + 0.12; x < x1 - 0.06; x += 0.12) bars.push(flatBox([x - 0.006, line(x, 0.1), -0.006], [x + 0.006, line(x, 0.86), 0.006]));
  const colliders = [];
  for (let i = 1; i <= n; i += 2) {
    const a = (i - 1) * t;
    const b = Math.min(n, i + 1) * t;
    colliders.push(cbox('body', [a, i * r, -0.03], [b, line(b, 1.0), 0.03], 'world'));
  }
  return simple(k, `Zábradlí ramene schodiště, stupně ${first} až ${last} (17 × 28 cm)`, 'home.window', [
    A('body', `${k}_rail`, tube([[x0 - 0.1, line(x0, 0.9) - (0.1 * r) / t, 0], [x1 + 0.1, line(x1, 0.9) + (0.1 * r) / t, 0]], 0.025, 10), 'wood_oak'),
    A('body', `${k}_posts`, merge(posts), 'steel_dark'),
    A('body', `${k}_bars`, merge(bars), 'steel_dark'),
    A('body', `${k}_stringer`, tube([[x0, line(x0, 0.1), 0], [x1, line(x1, 0.1), 0]], 0.012, 6), 'steel_dark'),
  ], { gen: 'home/outdoor.mjs#windows', components: { physics: { body: 'static' }, place: { mount: 'floor' } }, colliders, params: { riser: r, tread: t, first, last } });
}

// ---- nádvoří ------------------------------------------------------------------------------------------------------
/** Koruna stromu: několik zdeformovaných koulí listí. */
function crown(cx, cy, cz, rad, seed) {
  const blobs = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = (i * 137.5 * Math.PI) / 180;
    const rr = rad * (0.55 + 0.12 * (i % 3));
    const off = i === 0 ? [0, 0, 0] : [Math.cos(a) * rad * 0.45, (i % 2 ? 0.25 : -0.1) * rad, Math.sin(a) * rad * 0.45];
    const ball = lathe(Array.from({ length: 7 }, (_, j) => {
      const u = -90 + (j * 180) / 6;
      return [Math.max(0.001, rr * Math.cos((u * Math.PI) / 180)), rr * Math.sin((u * Math.PI) / 180) + rr];
    }), { seg: 10 });
    blobs.push(moved(ball, mTranslate(cx + off[0], cy + off[1] - rr, cz + off[2])));
  }
  return weldNormals(jitter(merge(blobs), rad * 0.18, 2.2 / rad, seed));
}

/** Kmen s větvemi (zúžený, lehce zkroucený). */
function trunk(h, r0, seed) {
  const g = lathe([[r0 * 1.4, 0], [r0, 0.15, 'c'], [r0 * 0.8, h * 0.5], [r0 * 0.55, h], [0.001, h + 0.02]], { seg: 9 });
  const branches = [0, 1, 2].map((i) => {
    const a = i * 120 + 30;
    const c = Math.cos((a * Math.PI) / 180);
    const s = Math.sin((a * Math.PI) / 180);
    return tube([[0, h * (0.55 + i * 0.1), 0], [c * 0.5, h * (0.7 + i * 0.08), s * 0.5], [c * 0.9, h * (0.85 + i * 0.06), s * 0.9]], r0 * 0.35, 6, { bend: 0.15, bendSeg: 2 });
  });
  return jitter(merge([g, ...branches]), r0 * 0.15, 6, seed);
}

/** Venkovní vybavení nádvoří. */
export function yard() {
  const one = mk('yard', 'yard');
  // koruna začíná nejníž 2,2 m nad zemí (pod stromem se dá projít); kolize kmene a obal koruny
  const tree = (id, title, h, rad, seed) => {
    const c0 = crown(0, h * 0.62, 0, rad, seed);
    const lift = Math.max(0, 2.2 - bounds(c0).min[1]);
    const c = moved(c0, mTranslate(0, lift, 0));
    const t = trunk(h * 0.62 + lift, 0.11, seed);
    const [bc, bt] = [bounds(c), bounds(t)];
    return one(id, title, [A('body', `${id}_trunk`, t, 'bark_brown'), A('body', `${id}_crown`, c, 'foliage_green')], {
      ...floor(),
      colliders: [cbox('body', [bt.min[0], 0, bt.min[2]], [bt.max[0], bt.max[1], bt.max[2]], 'world'), cbox('body', bc.min, bc.max, 'world')],
    });
  };
  const hk = 'hedge_01';
  const hedge = jitter(roundedBox([-0.8, 0, -0.3], [0.8, 1.0, 0.3], 0.15, 2), 0.05, 7, seedOf(hk), (p) => Math.min(1, p[1] / 0.15));
  const pk = 'lamp_post_01';
  const bk = 'bench_park_01';
  const slats = [];
  for (let i = 0; i < 4; i++) slats.push(roundedBox([-0.9, 0.42, -0.2 + i * 0.1], [0.9, 0.45, -0.12 + i * 0.1], 0.006, 1));
  for (let i = 0; i < 3; i++) slats.push(moved(roundedBox([-0.9, 0, -0.04], [0.9, 0.09, -0.01], 0.006, 1), at(mTranslate(0, 0.52 + i * 0.12, -0.24), mRotate('x', -12))));
  const legs = [-0.72, 0.72].map((x) => merge([flatBox([x - 0.025, 0, -0.24], [x + 0.025, 0.42, -0.19]), flatBox([x - 0.025, 0, 0.13], [x + 0.025, 0.42, 0.18]), flatBox([x - 0.025, 0.38, -0.24], [x + 0.025, 0.42, 0.18]), moved(flatBox([x - 0.025, 0, -0.03], [x + 0.025, 0.5, 0.0]), at(mTranslate(0, 0.42, -0.22), mRotate('x', -12)))]));
  const rk = 'bike_rack_01';
  const loops = [];
  for (let i = 0; i < 5; i++) loops.push(tube([[-0.6 + i * 0.3, 0, 0], [-0.6 + i * 0.3, 0.75, 0], [-0.6 + i * 0.3, 0.8, 0.06], [-0.6 + i * 0.3, 0.75, 0.12], [-0.6 + i * 0.3, 0, 0.12]], 0.022, 8, { bend: 0.05, bendSeg: 2 }));
  const ck = 'canopy_entrance_01';
  return [
    tree('tree_01', 'Strom listnatý (lípa) 5,5 m', 5.5, 1.6, seedOf('tree_01')),
    tree('tree_02', 'Strom listnatý (javor) 4,5 m', 4.5, 1.25, seedOf('tree_02')),
    one(hk, 'Živý plot 1,6 m', [A('body', `${hk}_leaves`, weldNormals(hedge), 'foliage_dark')], floor()),
    one(pk, 'Lampa veřejného osvětlení 3,8 m', [
      A('body', `${pk}_base`, lathe([[0.13, 0], [0.13, 0.05, 'c'], [0.08, 0.12], [0.05, 0.35, 'c'], [0.04, 0.38]], { seg: 12 }), 'iron_black'),
      A('body', `${pk}_pole`, cylinder(0.04, 0.38, 3.5, { seg: 10 }), 'iron_black'),
      A('body', `${pk}_head`, lathe([[0.04, 3.5], [0.16, 3.52, 'c'], [0.18, 3.56, 'c'], [0.1, 3.82], [0.02, 3.86]], { seg: 12 }), 'iron_black'),
      A('body', `${pk}_glass`, lathe([[0.12, 3.56], [0.15, 3.62], [0.1, 3.74]], { seg: 12 }), 'emit_warm'),
    ], { ...floor(), colliders: [cbox('body', [-0.18, 0, -0.18], [0.18, 3.86, 0.18], 'world')] }),
    one(bk, 'Parková lavička s dřevěnými latěmi', [A('body', `${bk}_slats`, merge(slats), 'wood_oak'), A('body', `${bk}_frame`, merge(legs), 'iron_black')], floor()),
    one(rk, 'Stojan na pět kol', [A('body', `${rk}_loops`, merge(loops), 'steel_brushed')], floor()),
    one('bin_outdoor_01', 'Odpadkový koš venkovní', [
      A('body', 'bin_outdoor_01_body', lathe([[0.2, 0.05], [0.22, 0.75], [0.23, 0.78, 'c'], [0.21, 0.79], [0.19, 0.76]], { seg: 14 }), 'steel_painted'),
      A('body', 'bin_outdoor_01_post', flatBox([-0.03, 0, -0.26], [0.03, 0.85, -0.2]), 'iron_black'),
    ], floor()),
    one(ck, 'Stříška nad vchodem (sklo na ocelových konzolách)', [
      A('body', `${ck}_glass`, flatBox([-1.0, 0.0, 0.0], [1.0, 0.02, 1.1]), 'glass_pane'),
      A('body', `${ck}_frame`, merge([flatBox([-1.0, -0.06, 0], [1.0, 0.0, 0.05]), flatBox([-1.0, -0.06, 1.05], [1.0, 0.0, 1.1]), flatBox([-1.0, -0.06, 0], [-0.95, 0.0, 1.1]), flatBox([0.95, -0.06, 0], [1.0, 0.0, 1.1])]), 'steel_brushed'),
      A('body', `${ck}_rods`, merge([-0.8, 0.8].map((x) => tube([[x, 0.75, 0.01], [x, 0.02, 1.0]], 0.012, 6))), 'steel_brushed'),
    ], wall(2.45)),
  ];
}
