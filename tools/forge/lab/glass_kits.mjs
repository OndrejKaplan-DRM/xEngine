// Sada kit_lab: sestavy ze skla z hladkých sítí: stojánek se zkumavkami, stojany s byretou, dělicí nálevkou
// a destilací, exsikátor, třecí miska, hodinové sklo; nové: nálevka s filtrem na baňce, Büchnerova nálevka na
// odsávací baňce, krystalizační miska, kapací lahvičky, kádinka s Pasteurovými pipetami. Rozměry obvyklé
// (zkumavka 16 × 160 mm, byreta 50 ml, dělicí nálevka 250 ml, Liebigův chladič 300 mm), neměřeno.

import { simple } from './common.mjs';
import { lathe, arc } from '../mesh/lathe.mjs';
import { merge, moved, mirror, mTranslate, mRotate, at, deform } from '../mesh/geo.mjs';
import { roundedBox, slab, tube, cylinder, torus, pyramid } from '../mesh/solids.mjs';
import { GLASS, ENAMEL, segFor, vesselGeom, liquidGeom, ticks, band, ring, part, FRONT } from './glassware.mjs';
import { erlenmeyerGeom, roundFlaskGeom } from './glass.mjs';

const CAT = 'lab.glass';
const gen = (f) => `lab/glass_kits.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const T = (g, x, y, z) => moved(g, mTranslate(x, y, z));
const THIN = 'glass_thin';

/** Zkumavka s kulatým dnem jednou plochou (tenké sklo, oboustranné): poloměr r, délka L, dno ve výšce 0. */
const testTube = (r, L, seg = 10) => lathe([...arc(0, r, r, -90, 0, 3), [r, L - 0.002], [r * 1.12, L]], { seg });
const tubeLiquid = (r, y, seg = 10) => lathe([...arc(0, r, r * 0.86, -90, 0, 2).map(([a, b]) => [a, b + 0.0004]), [r * 0.86, y], [0, y]], { seg });

/** Stojan z nerezového drátu se šesti zkumavkami 16 × 160 mm, různě naplněnými. */
export function testTubeRacks() {
  const fills = [['liquid_blue', 'liquid_red', 'liquid_green'], ['liquid_amber', 'liquid_yellow', 'liquid_purple'], ['liquid_pink', 'liquid_water', 'liquid_pink']];
  const frame = merge(
    slab(0, 0, 0.19, 0.06, 0, 0.004, 0.006, 1),
    slab(0, 0, 0.19, 0.036, 0.098, 0.101, 0.004, 1),
    slab(0, 0, 0.19, 0.036, 0.05, 0.053, 0.004, 1),
    ...[-0.093, 0.093].map((x) => tube([[x, 0.004, -0.017], [x, 0.101, -0.017], [x, 0.101, 0.017], [x, 0.004, 0.017]], 0.002, 6, { bend: 0.008, bendSeg: 3 })),
  );
  return fills.map((col, v) => {
    const glass = [];
    const liq = {};
    for (let i = 0; i < 6; i++) {
      const x = -0.075 + i * 0.03;
      glass.push(T(testTube(0.008, 0.16), x, 0.0045, 0));
      if (i % 2 === 0 || v === 1) {
        const m = col[i % 3];
        (liq[m] = liq[m] || []).push(T(tubeLiquid(0.008, 0.05 + (i % 3) * 0.018), x, 0.0045, 0));
      }
    }
    const parts = [part('rack_testtube', 'frame', frame, 'steel_brushed'), part('rack_testtube', 'tubes', merge(glass), THIN), ...Object.entries(liq).map(([m, list]) => part(`rack_testtube_${pad(v + 1)}`, m, merge(list), m))];
    return simple(`rack_testtube_${pad(v + 1)}`, `Stojan se skleněnými zkumavkami ${v + 1}`, CAT, parts, { gen: gen('testTubeRacks') });
  });
}

// ---- laboratorní stojan -----------------------------------------------------------------------------------

const ROD = [-0.06, -0.05]; // tyč stojanu (x, z)
/** Deska s tyčí: deska 200 × 160 mm se sraženými hranami, tyč Ø 12 mm výšky h. */
const standBase = (h) => ({
  plate: slab(0, 0, 0.2, 0.16, 0, 0.012, 0.01, 3, 0.002),
  rod: T(cylinder(0.006, 0.012, 0.012 + h, { edge: 0.002, seg: 12 }), ROD[0], 0, ROD[1]),
});
/** Křížová spojka na tyči ve výšce y a rameno svorky délky len směrem +x. */
const clamp = (y, len, jaw = 0.012) => ({
  boss: roundedBox([ROD[0] - 0.013, y - 0.012, ROD[1] - 0.011], [ROD[0] + 0.013, y + 0.012, ROD[1] + 0.011], 0.003, 1),
  arm: tube([[ROD[0] + 0.013, y, ROD[1]], [ROD[0] + len, y, ROD[1]]], 0.0035, 8),
  jaws: merge(roundedBox([ROD[0] + len - 0.004, y - 0.01, ROD[1] - jaw - 0.006], [ROD[0] + len + 0.012, y + 0.01, ROD[1] - jaw], 0, 0), roundedBox([ROD[0] + len - 0.004, y - 0.01, ROD[1] + jaw], [ROD[0] + len + 0.012, y + 0.01, ROD[1] + jaw + 0.006], 0, 0)),
});
const steel = (key, list) => part(key, 'steel', merge(list), 'steel_brushed');
const dark = (key, list) => part(key, 'dark', merge(list), 'steel_dark');
/** Teflonový kohout: kuželový klíč napříč (osa X) s plochou rukojetí, střed (x, y, z). */
const stopcock = (x, y, z, r = 0.004) => merge(moved(lathe([[0, -0.012], [r * 0.8, -0.012, 'c'], [r, 0.012, 'c'], [0, 0.012]], { seg: 10 }), at(mTranslate(x, y, z), mRotate('z', 90))), roundedBox([x + 0.011, y - 0.008, z - 0.002], [x + 0.016, y + 0.008, z + 0.002], 0, 0));

export function standSetups() {
  // 1) byreta 50 ml nad titrační baňkou
  const bx = ROD[0] + 0.07;
  const s1 = standBase(0.7);
  const c1 = clamp(0.55, 0.07, 0.0065);
  const burette = lathe([[0.0011, 0.105], [0.0016, 0.12], [0.0035, 0.14, 'c'], [0.0062, 0.152], [0.0062, 0.71], [0.0069, 0.72]], { seg: 12 });
  const bTicks = ticks(0.0064, Array.from({ length: 26 }, (_, i) => 0.18 + i * 0.019), { span: 50, major: 5, mid: FRONT, h: 0.0006 });
  const bLiq = lathe([[0, 0.152], [0.0052, 0.152], [0.0052, 0.48], [0, 0.48]], { seg: 10 });
  const e = erlenmeyerGeom(64, 105, 22, { seg: 16 });
  const burettePrefab = simple('stand_burette_01', 'Stojan s byretou a titrační baňkou', CAT, [
    part('stand', 'plate', s1.plate, 'steel_painted'),
    steel('stand_burette', [s1.rod, c1.arm]),
    dark('stand_burette', [c1.boss, c1.jaws]),
    part('stand_burette', 'burette', T(burette, bx, 0, ROD[1]), THIN),
    part('stand_burette', 'ticks', T(bTicks, bx, 0, ROD[1]), ENAMEL),
    part('stand_burette', 'titrant', T(bLiq, bx, 0, ROD[1]), 'liquid_purple'),
    part('stand_burette', 'cock', stopcock(bx, 0.128, ROD[1]), 'ptfe'),
    part('stand_burette', 'flask', T(e.geom, bx, 0.012, ROD[1]), GLASS),
    part('stand_burette', 'flaskliq', T(liquidGeom(e.inner, 0.03, { seg: 14 }), bx, 0.012, ROD[1]), 'liquid_pink'),
  ], { gen: gen('standSetups'), params: { assembly: true } });

  // 2) dělicí nálevka 250 ml v kruhu nad kádinkou
  const fx = ROD[0] + 0.08;
  const s2 = standBase(0.62);
  const c2 = clamp(0.42, 0.04);
  const fy = 0.33; // výpust nálevky
  const sep = vesselGeom([[0, 0], [0.006, 0.002, 0.004, 1], [0.044, 0.07, 0.035, 3], [0.041, 0.11, 0.025, 2], [0.011, 0.135, 0.006, 1], [0.011, 0.152], [0.012, 0.154]], { wall: 0.0016, seg: 16 });
  const ringHolder = T(torus(0.046, 0.003, 0, { n: 3, seg: 16 }), fx, fy + 0.045, ROD[1]);
  const stem = lathe([[0.002, fy - 0.11], [0.0028, fy - 0.11, 'c'], [0.0032, fy - 0.018], [0.0045, fy]], { seg: 10 });
  const beakerB = vesselGeom([[0, 0], [0.035, 0, 0.004], [0.035, 0.09, 0.004, 1], [0.0365, 0.095]], { wall: 0.0012, seg: 16 });
  const funnelPrefab = simple('stand_funnel_01', 'Stojan s dělicí nálevkou', CAT, [
    part('stand', 'plate', s2.plate, 'steel_painted'),
    steel('stand_funnel', [s2.rod, c2.arm, ringHolder]),
    dark('stand_funnel', [c2.boss]),
    part('stand_funnel', 'sep', T(sep.geom, fx, fy, ROD[1]), GLASS),
    part('stand_funnel', 'lower', T(liquidGeom(sep.inner, 0.035, { seg: 16 }), fx, fy, ROD[1]), 'liquid_amber'),
    part('stand_funnel', 'stem', T(stem, fx, 0, ROD[1]), THIN),
    part('stand_funnel', 'cock', stopcock(fx, fy - 0.012, ROD[1]), 'ptfe'),
    part('stand_funnel', 'plug', T(lathe([[0.0095, -0.012], [0.0105, 0.004, 'c'], [0.014, 0.004, 'c'], ...arc(0.009, 0.012, 0.005, 0, 90, 2), [0, 0.017]], { seg: 12 }), fx, fy + 0.154, ROD[1]), 'ptfe'),
    part('stand_funnel', 'beaker', T(beakerB.geom, fx, 0.012, ROD[1]), GLASS),
    part('stand_funnel', 'beakerliq', T(liquidGeom(beakerB.inner, 0.03, { seg: 16 }), fx, 0.012, ROD[1]), 'liquid_yellow'),
  ], { gen: gen('standSetups'), params: { assembly: true } });

  // 3) destilace: topné hnízdo, varná baňka, nástavec s teploměrem, Liebigův chladič s hadicemi, jímadlo
  const s3 = standBase(0.6);
  const c3 = clamp(0.25, 0.05);
  const c4 = clamp(0.4, 0.09);
  const mx = ROD[0] + 0.05;
  const mantle = merge(lathe([[0, 0.012], [0.07, 0.012, 'c'], ...arc(0.062, 0.1, 0.008, 0, 90, 2), [0.045, 0.108, 'c'], [0.045, 0.104]], { seg: 18 }), roundedBox([-0.03, 0.02, 0.05], [0.03, 0.07, 0.075], 0.004, 1));
  const f = roundFlaskGeom(85, 50, 26, 0.05, 12);
  const neckTop = f.top;
  const head = tube([[mx, neckTop - 0.01, ROD[1]], [mx, neckTop + 0.06, ROD[1]], [mx + 0.05, neckTop + 0.07, ROD[1]]], 0.007, 10, { bend: 0.015, bendSeg: 3, caps: false });
  const condA = [mx + 0.05, neckTop + 0.07, ROD[1]];
  const condB = [mx + 0.3, neckTop - 0.05, ROD[1]];
  const jacket = tube([condA, condB].map((p, i) => (i ? p : [p[0] + 0.01, p[1] - 0.005, p[2]])), 0.0135, 12, {});
  const innerT = tube([condA, [condB[0] + 0.04, condB[1] - 0.02, condB[2]]], 0.0055, 8, { caps: false });
  const hoses = merge(
    tube([[condA[0] + 0.03, condA[1] - 0.003, ROD[1] + 0.013], [condA[0] + 0.03, condA[1] + 0.02, ROD[1] + 0.03], [condA[0] + 0.03, 0.05, ROD[1] + 0.07]], 0.004, 6, { bend: 0.02, bendSeg: 3 }),
    tube([[condB[0] - 0.03, condB[1] - 0.003, ROD[1] + 0.013], [condB[0] - 0.03, condB[1] - 0.03, ROD[1] + 0.03], [condB[0] - 0.03, 0.012, ROD[1] + 0.06]], 0.004, 6, { bend: 0.02, bendSeg: 3 }),
  );
  const thermo = lathe([[0, neckTop + 0.04], [0.0035, neckTop + 0.04, 'c'], [0.0035, neckTop + 0.2], [0, neckTop + 0.205]], { seg: 8 });
  const recv = erlenmeyerGeom(64, 105, 22, { seg: 12 });
  const rx = condB[0] + 0.04;
  const still = simple('stand_distill_01', 'Destilační aparatura s chladičem a topným hnízdem', CAT, [
    part('stand', 'plate', s3.plate, 'steel_painted'),
    steel('stand_distill', [s3.rod, c3.arm, c4.arm]),
    dark('stand_distill', [c3.boss, c4.boss, c3.jaws, c4.jaws]),
    part('stand_distill', 'mantle', T(mantle, mx, 0, ROD[1]), 'steel_dark'),
    part('stand_distill', 'lamp', T(roundedBox([0.012, 0.055, 0.074], [0.02, 0.063, 0.078], 0, 0), mx, 0, ROD[1]), 'emit_amber'),
    part('stand_distill', 'flask', T(f.geom, mx, 0, ROD[1]), GLASS),
    part('stand_distill', 'flaskliq', T(liquidGeom(f.inner, f.cy - f.R * 0.2, { seg: 14 }), mx, 0, ROD[1]), 'liquid_amber'),
    part('stand_distill', 'glass', merge(head, jacket, T(recv.geom, rx, 0, ROD[1])), GLASS),
    part('stand_distill', 'inner', merge(innerT, T(thermo, mx, 0, ROD[1])), THIN),
    part('stand_distill', 'hoses', hoses, 'rubber_black'),
    part('stand_distill', 'distillate', T(liquidGeom(recv.inner, 0.022, { seg: 12 }), rx, 0, ROD[1]), 'liquid_water'),
  ], { gen: gen('standSetups'), params: { assembly: true } });
  return [burettePrefab, funnelPrefab, still];
}

/** Exsikátor se zabroušeným okrajem, víkem s knoflíkem, porcelánovou deskou a silikagelem; Ø 150 a 250 mm. */
export function desiccators() {
  return [150, 250].map((d) => {
    const R = d / 2000;
    const seg = 16;
    const body = vesselGeom([[0, 0], [R * 0.6, 0, R * 0.08], [R * 0.62, R * 0.42, R * 0.06, 1], [R * 0.95, R * 0.55, R * 0.08, 1], [R * 0.97, R * 1.32, R * 0.06, 1], [R * 1.18, R * 1.38, 0.003, 1], [R * 1.18, R * 1.45]], { wall: 0.004, lip: 0.002, seg, lipN: 2 });
    const h = R * 1.45;
    // víko: vyrobené dnem vzhůru (knoflík dole) a zrcadlené
    const lidUp = vesselGeom([[0, 0], [0.016, 0, 0.004, 1], [0.016, 0.026, 0.006, 1], [R * 0.35, 0.034, R * 0.3], [R * 1.0, R * 0.55, R * 0.25], [R * 1.18, R * 0.6, 0.003, 1], [R * 1.18, R * 0.64]], { wall: 0.004, lip: 0.002, seg, lipN: 2 });
    const lid = T(mirror(lidUp.geom, 1), 0, h + R * 0.64, 0);
    const gel = deform(lathe([[0, 0.006], [R * 0.56, 0.006, 'c'], [R * 0.56, R * 0.2], [0, R * 0.24]], { seg }), ([x, y, z]) => [x, y + (y > R * 0.1 ? 0.002 * Math.sin(x * 400) * Math.cos(z * 370) : 0), z]);
    const plate = slab(0, 0, R * 1.84, R * 1.84, R * 0.55, R * 0.55 + 0.006, R * 0.92, 6);
    return simple(`desiccator_${d}_01`, `Exsikátor ${d} mm se silikagelem`, CAT, [part(`desiccator_${d}`, 'body', body.geom, GLASS), part(`desiccator_${d}`, 'lid', lid, GLASS), part(`desiccator_${d}`, 'joint', ring(R * 1.18 + 0.0002, h - 0.002, 0.008, seg), 'glass_frosted'), part(`desiccator_${d}`, 'plate', plate, 'porcelain'), part(`desiccator_${d}`, 'gel', gel, 'powder_blue')], { gen: gen('desiccators'), params: { assembly: true } }); // nádoba, víko a deska
  });
}

/** Třecí miska s tloučkem (porcelán) a hodinové sklo s krystaly modré skalice. */
export function smallware() {
  const bowl = vesselGeom([[0, 0], [0.028, 0, 0.012], [0.058, 0.04, 0.02], [0.06, 0.05]], { wall: 0.006, lip: 0.003, seg: 22 });
  const pestle = moved(lathe([[0, 0], ...arc(0, 0.018, 0.018, -90, 0, 3).slice(1), [0.011, 0.04, 0.02], ...arc(0, 0.11, 0.008, 0, 90, 2)], { seg: 14 }), at(mTranslate(0.012, 0.012, 0), mRotate('z', -38)));
  const powder = lathe([[0, 0.012], [0.03, 0.014], [0.042, 0.022], [0, 0.022]], { seg: 18 });
  const mortar = simple('mortar_porcelain_01', 'Třecí miska s tloučkem', CAT, [part('mortar', 'bowl', bowl.geom, 'porcelain'), part('mortar', 'pestle', pestle, 'porcelain'), part('mortar', 'powder', powder, 'powder_white')], { gen: gen('smallware') });
  const rs = (0.05 * 0.05 + 0.008 * 0.008) / (2 * 0.008);
  const u0 = (Math.asin(0.05 / rs) * 180) / Math.PI;
  const watch = lathe(arc(0, rs + 0.001, rs, -90, -90 + u0, 6), { seg: 24 });
  const crystals = [];
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4;
    const r = 0.004 + (i % 4) * 0.005;
    const s = 0.003 + (i % 3) * 0.0015;
    crystals.push(moved(pyramid(s, 0, 0, s * 1.6, 4, i * 17), at(mTranslate(Math.cos(a) * r, 0.0015 + (r * r) / (2 * rs), Math.sin(a) * r), mRotate('z', (i % 5) * 9))));
  }
  const watchglass = simple('watchglass_01', 'Hodinové sklo s krystaly', CAT, [part('watchglass', 'glass', watch, THIN), part('watchglass', 'crystals', merge(crystals), 'powder_blue')], { gen: gen('smallware') });
  return [mortar, watchglass];
}


/** Nálevka 60° s hrdlem (sklo jednou plochou) a skládaný filtr; vrchol nálevky ve výšce y, průměr d (m). */
function funnelGeom(d, y, stem = 0.06) {
  const R = d / 2;
  const h = R * 1.6;
  const glass = lathe([[0.0035, y - stem], [0.0042, y - stem + 0.003, 'c'], [0.0042, y], [R, y + h, R * 0.06], [R + 0.002, y + h + 0.002]], { seg: segFor(R, 0.8) });
  const paper = deform(lathe([[0.001, y + 0.004], [R * 0.86, y + h * 0.92], [R * 0.88, y + h * 0.98]], { seg: 16 }), ([x, yy, z]) => {
    const a = Math.atan2(z, x);
    const k = 1 + 0.06 * Math.abs(Math.sin(a * 4)); // skládaný filtr: osm záhybů
    return [x * k, yy, z * k];
  });
  return { glass, paper, top: y + h };
}

/** Odsávací baňka (silnostěnná Erlenmeyerova s olivkou na boku) 500 ml. */
function filterFlask() {
  const e = erlenmeyerGeom(105, 200, 40, { seg: 18 });
  const arm = tube([[0, e.H - 0.05, 0], [-0.045, e.H - 0.058, 0]], 0.0045, 8, { caps: false });
  return { ...e, arm };
}

export function newGlass() {
  // 1) Erlenmeyerova baňka 250 ml s nálevkou a skládaným filtrem
  const e = erlenmeyerGeom(85, 145, 34, { seg: 16 });
  const f = funnelGeom(0.075, e.H - 0.02, 0.05);
  const funnelErlen = simple('funnel_erlen_01', 'Erlenmeyerova baňka s nálevkou a skládaným filtrem', CAT, [
    part('funnel_erlen', 'flask', e.geom, GLASS),
    part('funnel_erlen', 'filtrate', liquidGeom(e.inner, 0.03, { seg: 14 }), 'liquid_yellow'),
    part('funnel_erlen', 'funnel', f.glass, THIN),
    part('funnel_erlen', 'paper', f.paper, 'label_paper'),
    part('funnel_erlen', 'slurry', lathe([[0.004, e.H + 0.004], [0.022, e.H + 0.02], [0, e.H + 0.021]], { seg: 12 }), 'powder_blue'),
  ], { gen: gen('newGlass') });

  // 2) Büchnerova nálevka (porcelán) na odsávací baňce s gumovým kroužkem a hadicí k vývěvě
  const ff = filterFlask();
  const by = ff.H + 0.012;
  const buchner = lathe([[0.003, by - 0.05], [0.0045, by - 0.05, 'c'], [0.0055, by - 0.01], [0.012, by, 0.004], [0.045, by + 0.005, 0.003], [0.047, by + 0.055, 0.002], [0.05, by + 0.058], [0.045, by + 0.058], [0.043, by + 0.012], [0, by + 0.012]], { seg: 20 });
  const adapter = lathe([[0.012, by - 0.03], [0.022, by - 0.03, 'c'], [0.026, by + 0.002, 'c'], [0.014, by + 0.002]], { seg: 14 });
  const hose = tube([[-0.045, ff.H - 0.058, 0], [-0.09, ff.H - 0.065, 0], [-0.12, 0.004, 0.04], [-0.2, 0.004, 0.08]], 0.006, 8, { bend: 0.04, bendSeg: 4 });
  const buchnerPrefab = simple('buchner_flask_01', 'Büchnerova nálevka na odsávací baňce s hadicí k vývěvě', CAT, [
    part('buchner', 'flask', merge(ff.geom, ff.arm), GLASS),
    part('buchner', 'filtrate', liquidGeom(ff.inner, 0.04, { seg: 16 }), 'liquid_green'),
    part('buchner', 'funnel', buchner, 'porcelain'),
    part('buchner', 'cake', lathe([[0, by + 0.013], [0.042, by + 0.013, 'c'], [0.042, by + 0.019], [0, by + 0.02]], { seg: 16 }), 'powder_white'),
    part('buchner', 'rubber', merge(adapter, hose), 'rubber_black'),
  ], { gen: gen('newGlass'), params: { assembly: true } });

  // 3) krystalizační miska 90 × 50 mm s krystaly
  const dish = vesselGeom([[0, 0], [0.045, 0, 0.004], [0.045, 0.048, 0.002], [0.0462, 0.05]], { wall: 0.0018, seg: 20 });
  const xt = [];
  for (let i = 0; i < 11; i++) {
    const a = i * 2.1;
    const r = 0.006 + (i % 4) * 0.008;
    const s = 0.004 + (i % 3) * 0.002;
    xt.push(moved(pyramid(s, s * 0.4, 0, s * 1.4, 4, i * 23), at(mTranslate(Math.cos(a) * r, 0.0028, Math.sin(a) * r), mRotate('x', (i % 3) * 12))));
  }
  const crystDish = simple('dish_cryst_01', 'Krystalizační miska s krystaly', CAT, [part('dish_cryst', 'glass', dish.geom, GLASS), part('dish_cryst', 'liquor', liquidGeom(dish.inner, 0.012, { seg: 18, flat: true }), 'liquid_blue'), part('dish_cryst', 'crystals', merge(xt), 'powder_blue')], { gen: gen('newGlass') });

  // 4) kapací lahvička 50 ml s pipetou a gumovým balonkem (hnědá a čirá)
  const drop = vesselGeom([[0, 0], [0.019, 0, 0.003], [0.019, 0.055, 0.012], [0.0085, 0.07, 0.003], [0.0085, 0.078], [0.009, 0.08]], { wall: 0.0014, seg: 16 });
  const teat = lathe([[0.009, 0.074], [0.0105, 0.074, 'c'], [0.0105, 0.088, 0.002], [0.007, 0.092, 0.002], ...arc(0, 0.098, 0.0075, -60, 90, 3).slice(1)], { seg: 14 });
  const pip = lathe([[0.0008, 0.012], [0.0025, 0.02], [0.003, 0.074]], { seg: 8 });
  const droppers = [['01', 'glass_amber', 'hnědá'], ['02', GLASS, 'čirá']].map(([n, g, name]) => simple(`bottle_dropper_${n}`, `Kapací lahvička 50 ml s pipetou, ${name}`, CAT, [part('bottle_dropper', g === GLASS ? 'glass' : 'amber', drop.geom, g), part('bottle_dropper', 'pipette', pip, THIN), part('bottle_dropper', 'teat', teat, 'rubber_black'), part(`bottle_dropper_${n}`, 'liquid', liquidGeom(drop.inner, 0.035, { seg: 14 }), n === '01' ? 'liquid_amber' : 'liquid_purple')], { gen: gen('newGlass') }));

  // 5) kádinka 250 ml s Pasteurovými pipetami
  const bk = vesselGeom([[0, 0], [0.035, 0, 0.004], [0.035, 0.09, 0.004], [0.0365, 0.095]], { wall: 0.0012, seg: 18 });
  const pipettes = [];
  const bulbs = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4;
    const foot = [Math.cos(a) * 0.012, 0.004, Math.sin(a) * 0.012];
    const lean = [Math.cos(a) * 0.05, 0.225, Math.sin(a) * 0.05];
    pipettes.push(tube([foot, foot.map((v, k) => v + (lean[k] - v) * 0.35), lean], 0.0025, 6, { caps: true }));
    if (i % 2 === 0) bulbs.push(moved(lathe([[0.0028, 0], [0.004, 0.002], ...arc(0, 0.016, 0.0045, -40, 90, 3)], { seg: 10 }), at(mTranslate(...lean), mRotate('z', -Math.atan2(lean[0] - foot[0], lean[1] - foot[1]) * 57.3))));
  }
  const pipBeaker = simple('beaker_pipettes_01', 'Kádinka s Pasteurovými pipetami', CAT, [part('beaker_pipettes', 'beaker', bk.geom, GLASS), part('beaker_pipettes', 'pipettes', merge(pipettes), THIN), part('beaker_pipettes', 'bulbs', merge(bulbs), 'cap_red')], { gen: gen('newGlass') });

  // 6) odsávací baňka 500 ml samotná
  const flaskOnly = simple('flask_filter_500_01', 'Odsávací baňka 500 ml s olivkou', CAT, [part('flask_filter', 'glass', merge(ff.geom, ff.arm), GLASS)], { gen: gen('newGlass') });
  return [funnelErlen, buchnerPrefab, crystDish, ...droppers, pipBeaker, flaskOnly];
}

export const GLASS_KITS = [testTubeRacks, standSetups, desiccators, smallware, newGlass];
