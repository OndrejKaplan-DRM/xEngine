// Sada kit_lab: laboratorní sklo z hladkých sítí (B04, Ondřej 24. 11. 23:57: „lépe řeš kužely, válce, zaoblení…
// materiál je sklo, tak ať to tak vypadá“). Každá nádoba je jedna rotační plocha s tenkou stěnou, zaobleným dnem
// a zesíleným lemem; kádinka a odměrný válec mají hubičku, rysky a popisnou plochu ze smaltu, baňky zábrus.
// Rozměry podle obvyklých norem tvarů (kádinka nízká, Erlenmeyerova baňka úzkohrdlá, odměrný válec vysoký
// s šestibokou nohou, odměrná baňka, varná baňka s kulatým dnem, reagenční lahev se závitem GL 45) a katalogů
// prodejců laboratorního skla; neměřeno. Varianta _01 je prázdná, další s kapalinou nebo ze hnědého skla.

import { simple } from './common.mjs';
import { lathe, arc } from '../mesh/lathe.mjs';
import { merge, deform } from '../mesh/geo.mjs';
import { pyramid, torus } from '../mesh/solids.mjs';
import { GLASS, ENAMEL, segFor, wallFor, vesselGeom, liquidGeom, ticks, band, ring, spout, part, FRONT } from './glassware.mjs';

const CAT = 'lab.glass';
const gen = (f) => `lab/glass.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const LIQ = ['liquid_blue', 'liquid_amber', 'liquid_water', 'liquid_green', 'liquid_red', 'liquid_purple'];

/** Poloměr profilu ve výšce y (lineárně mezi body profilu zdola nahoru). */
export function radiusAt(profile, y) {
  for (let i = 1; i < profile.length; i++) {
    const [r0, y0] = profile[i - 1];
    const [r1, y1] = profile[i];
    if ((y >= y0 && y <= y1) || (y <= y0 && y >= y1)) return y1 === y0 ? Math.max(r0, r1) : r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return profile[profile.length - 1][0];
}
/** Pásek po šikmé stěně (kužel Erlenmeyerovy baňky) mezi výškami y0 a y1, kousek nad povrchem. */
const slantBand = (outer, y0, y1, span, mid, seg = 6, lift = 0.0003) => lathe([[radiusAt(outer, y0) + lift, y0], [radiusAt(outer, y1) + lift, y1]], { a0: mid - span / 2, a1: mid + span / 2, seg });
const slantTicks = (outer, ys, span, mid, h = 0.0006) => merge(ys.map((y, i) => slantBand(outer, y - h / 2, y + h / 2, i % 2 ? span : span * 0.55, mid, 2)));

/** Kádinka nízká: objem mL → [průměr, výška] v mm. Hubička vlevo (−X), stupnice a popisná plocha vpředu. */
const BEAKERS = { 50: [42, 60], 100: [50, 70], 250: [70, 95], 600: [90, 125], 1000: [105, 145], 2000: [130, 185] };
export function beakers() {
  return Object.entries(BEAKERS).flatMap(([ml, [d, h]], k) => {
    const R = d / 2000;
    const H = h / 1000;
    const wall = wallFor(R);
    const v = vesselGeom([[0, 0], [R, 0, Math.max(0.002, R * 0.12)], [R, H - 0.006, 0.004], [R + wall * 0.8, H]], { wall, lip: wall * 0.9 });
    const glass = spout(v.geom, H - Math.max(0.01, H * 0.1), H, 180, R * 0.07 + 0.0015, 0.0008, 42);
    const ys = Array.from({ length: 6 }, (_, i) => H * (0.25 + 0.1 * i));
    const enamel = merge(ticks(R + 0.00025, ys, { span: 24, major: 2, mid: FRONT - 18 }), band(R + 0.00025, H * 0.6, H * 0.72, 24, FRONT + 24, 4));
    const base = [part(`beaker_${ml}`, 'glass', glass), part(`beaker_${ml}`, 'marks', enamel, ENAMEL)];
    return [0, 1].map((n) => {
      const parts = n ? [...base, part(`beaker_${ml}`, 'liquid', liquidGeom(v.inner, H * 0.55), LIQ[k % LIQ.length])] : base;
      return simple(`beaker_${ml}_${pad(n + 1)}`, `Kádinka ${ml} ml${n ? ' s roztokem' : ''}`, CAT, parts, { gen: gen('beakers') });
    });
  });
}

/** Erlenmeyerova baňka úzkohrdlá: mL → [průměr dna, výška, průměr hrdla] v mm. Kužel, zaoblená pata i rameno. */
const ERLEN = { 100: [64, 105, 22], 250: [85, 145, 34], 500: [105, 180, 34], 1000: [131, 220, 42] };
export function erlenmeyerGeom(d, h, nd, o = {}) {
  const [R, H, rn] = [d / 2000, h / 1000, nd / 2000];
  const ys = H * 0.74; // začátek hrdla
  const wall = wallFor(R) * 0.9;
  return { R, H, rn, ...vesselGeom([[0, 0], [R, 0, R * 0.16], [rn, ys, rn * 1.1], [rn, H - 0.004], [rn + wall, H]], { wall, lip: wall * 1.2, seg: o.seg ?? segFor(R, 0.85) }) };
}
export function erlenmeyers() {
  return Object.entries(ERLEN).flatMap(([ml, [d, h, n]], k) => {
    const e = erlenmeyerGeom(d, h, n);
    const ys = Array.from({ length: 5 }, (_, i) => e.H * (0.12 + 0.07 * i));
    const enamel = merge(slantTicks(e.outer, ys, 22, FRONT - 16), slantBand(e.outer, e.H * 0.3, e.H * 0.42, 22, FRONT + 24, 4));
    const base = [part(`flask_erlen_${ml}`, 'glass', e.geom), part(`flask_erlen_${ml}`, 'marks', enamel, ENAMEL)];
    return [0, 1].map((v) => {
      const parts = v ? [...base, part(`flask_erlen_${ml}`, 'liquid', liquidGeom(e.inner, e.H * 0.3), LIQ[(k + 2) % LIQ.length])] : base;
      return simple(`flask_erlen_${ml}_${pad(v + 1)}`, `Erlenmeyerova baňka ${ml} ml${v ? ' s roztokem' : ''}`, CAT, parts, { gen: gen('erlenmeyers') });
    });
  });
}

/** Šestiboká noha se sraženou hranou (odměrný válec): poloměr opsané kružnice r, tloušťka t. */
const hexFoot = (r, t) => merge(pyramid(r, r, 0, t - 0.0015, 6, 0), pyramid(r, r - 0.0015, t - 0.0015, t, 6, 0));

/** Odměrný válec: mL → [průměr trubice, výška trubice] v mm; modrá šestiboká noha z PP, hubička, stupnice. */
const CYLS = { 10: [13, 140], 100: [28, 250], 500: [52, 390], 1000: [65, 460] };
export function measuringCylinders() {
  return Object.entries(CYLS).flatMap(([ml, [d, h]], k) => {
    const r = d / 2000;
    const H = h / 1000;
    const y0 = 0.009;
    const wall = Math.max(0.0009, wallFor(r));
    const v = vesselGeom([[0, y0 - 0.003], [r, y0 - 0.003, 0.002], [r, y0 + H - 0.004, 0.002], [r + wall * 0.7, y0 + H]], { wall, bottom: 0.004, seg: segFor(r, 0.9) });
    const glass = spout(v.geom, y0 + H - 0.012, y0 + H, 180, r * 0.18 + 0.0015, 0.0012, 38);
    const N = 21;
    const ys = Array.from({ length: N }, (_, i) => y0 + H * (0.08 + (0.8 * i) / (N - 1)));
    const enamel = merge(ticks(r + 0.00025, ys, { span: 28, major: 5, mid: FRONT, h: 0.0005 }), band(r + 0.00025, y0 + H * 0.9, y0 + H * 0.94, 30, FRONT, 4));
    const foot = Math.max(0.024, r * 2.1);
    const base = [part(`cylinder_grad_${ml}`, 'foot', hexFoot(foot, y0), 'cap_blue'), part(`cylinder_grad_${ml}`, 'glass', glass), part(`cylinder_grad_${ml}`, 'marks', enamel, ENAMEL)];
    return [0, 1].map((n) => {
      const parts = n ? [...base, part(`cylinder_grad_${ml}`, 'liquid', liquidGeom(v.inner, y0 + H * 0.6), LIQ[(k + 1) % LIQ.length])] : base;
      return simple(`cylinder_grad_${ml}_${pad(n + 1)}`, `Odměrný válec ${ml} ml${n ? ' s kapalinou' : ''}`, CAT, parts, { gen: gen('measuringCylinders') });
    });
  });
}

/** Zátka z PP s osmibokou hlavou (odměrná baňka): zapadá do hrdla o poloměru rn od výšky y. */
function stopper(rn, y) {
  const plug = lathe([[rn * 0.92, y - 0.012], [rn * 0.98, y, 'c'], [rn * 1.25, y, 'c'], [rn * 1.25, y + 0.002]], { seg: 8 });
  const head = merge(pyramid(rn * 1.7, rn * 1.7, y + 0.002, y + 0.011, 8, 22.5), pyramid(rn * 1.7, rn * 1.45, y + 0.011, y + 0.013, 8, 22.5));
  return merge(plug, head);
}

/** Odměrná baňka: mL → [průměr baňky, celková výška, průměr hrdla] v mm; hruškovitá, ryska po obvodu hrdla, zábrus, zátka. */
const VOLUMETRIC = { 50: [50, 140, 12], 100: [60, 170, 14], 250: [80, 220, 16], 1000: [120, 310, 20] };
export function volumetricFlasks() {
  return Object.entries(VOLUMETRIC).flatMap(([ml, [d, h, n]], k) => {
    const [R, H, rn] = [d / 2000, h / 1000, n / 2000];
    const bh = R * 1.75; // výška baňky
    const top = H - 0.012; // konec hrdla pod zátkou
    const wall = wallFor(R) * 0.8;
    const v = vesselGeom([[0, 0], [R * 0.62, 0, R * 0.3], [R, bh * 0.42, R * 0.55, 3], [rn, bh, R * 0.5], [rn, top - 0.002], [rn + wall * 0.6, top]], { wall, lip: wall, seg: segFor(R, 0.8), lipN: 2 });
    const yMark = bh + (top - bh) * 0.45;
    const cap = k % 2 ? 'cap_yellow' : 'cap_blue';
    const base = [
      part(`flask_vol_${ml}`, 'glass', v.geom),
      part(`flask_vol_${ml}`, 'mark', merge(ring(rn + 0.0002, yMark, 0.0007, 14), slantBand(v.outer, bh * 0.3, bh * 0.42, 30, FRONT, 5)), ENAMEL),
      part(`flask_vol_${ml}`, 'joint', ring(rn + 0.00015, top - 0.008, 0.012, 14), 'glass_frosted'),
      part(`flask_vol_${ml}`, 'stopper', stopper(rn - wall, top), cap),
    ];
    return [0, 1].map((m) => {
      const parts = m ? [...base, part(`flask_vol_${ml}`, 'liquid', liquidGeom(v.inner, yMark, { men: 0.002 }), LIQ[(k + 3) % LIQ.length])] : base;
      return simple(`flask_vol_${ml}_${pad(m + 1)}`, `Odměrná baňka ${ml} ml${m ? ' doplněná po rysku' : ''}`, CAT, parts, { gen: gen('volumetricFlasks') });
    });
  });
}

/** Varná baňka s kulatým dnem na korkovém kroužku: mL → [průměr baňky, délka hrdla, průměr hrdla] v mm; zábrus NZ. */
const ROUND = { 100: [64, 60, 26], 250: [85, 70, 30], 500: [105, 80, 30], 1000: [131, 90, 34] };
export function roundFlaskGeom(d, l, nd, y0 = 0.008, seg = null) {
  const [R, L, rn] = [d / 2000, l / 1000, nd / 2000];
  const cy = y0 + R;
  const u1 = (Math.acos(Math.min(0.98, rn / R)) * 180) / Math.PI;
  const sph = arc(0, cy, R, -90, u1, 6);
  const yN = cy + R * Math.sin((u1 * Math.PI) / 180);
  const wall = wallFor(R) * 0.9;
  const outer = [...sph.slice(0, -1).map(([r, y]) => [r, y]), [rn, yN, rn * 0.5], [rn, yN + L - 0.003], [rn + wall, yN + L]];
  return { R, cy, rn, top: yN + L, ...vesselGeom(outer, { wall, lip: wall, n: 2, seg: seg ?? segFor(R, 0.85) }) };
}
export function roundFlasks() {
  return Object.entries(ROUND).flatMap(([ml, [d, l, n]], k) => {
    const f = roundFlaskGeom(d, l, n);
    const cork = torus(f.R * 0.5, 0.0085, 0.0085, { n: 4, seg: 14 });
    const base = [part(`flask_round_${ml}`, 'cork', cork, 'cork'), part(`flask_round_${ml}`, 'glass', f.geom), part(`flask_round_${ml}`, 'joint', ring(f.rn + 0.00015, f.top - 0.012, 0.02, 14), 'glass_frosted')];
    return [0, 1].map((v) => {
      const parts = v ? [...base, part(`flask_round_${ml}`, 'liquid', liquidGeom(f.inner, f.cy - f.R * 0.25), LIQ[(k + 4) % LIQ.length])] : base;
      return simple(`flask_round_${ml}_${pad(v + 1)}`, `Varná baňka ${ml} ml na korkovém kroužku${v ? ', s náplní' : ''}`, CAT, parts, { gen: gen('roundFlasks') });
    });
  });
}

/** Šroubovací víčko GL 45 s vroubkováním a vylévacím kroužkem; hrdlo o poloměru rn končí ve výšce top. */
export function gl45Cap(rn, top, ridges = 12) {
  const rc = rn + 0.0035;
  const cap = lathe([[rn, top - 0.019], [rc, top - 0.019, 'c'], ...arc(rc - 0.002, top + 0.004, 0.002, 0, 90, 2), [0, top + 0.006]], { seg: ridges * 2 });
  const ribbed = deform(cap, ([x, y, z]) => {
    const r = Math.hypot(x, z);
    if (r < rc - 0.0005 || y > top + 0.0035) return [x, y, z];
    const a = Math.atan2(-z, x);
    const s = 1 + 0.025 * Math.cos(a * ridges);
    return [x * s, y, z * s];
  });
  const pour = lathe([[rn - 0.0005, top - 0.026], [rn + 0.0045, top - 0.026, 'c'], [rn + 0.0045, top - 0.02, 'c'], [rn + 0.001, top - 0.019]], { seg: 16 });
  return { ribbed, pour };
}

/** Reagenční lahev se závitem GL 45: mL → [průměr, výška] v mm; čirá prázdná se stupnicí, čirá s vodou a štítkem, hnědá. */
const BOTTLES = { 100: [56, 100], 250: [70, 143], 500: [86, 181], 1000: [101, 230], 2000: [136, 265] };
export function reagentBottles() {
  const bands = ['label_band_blue', 'label_band_red', 'label_band_green', 'label_band_orange', 'label_band_blue'];
  return Object.entries(BOTTLES).flatMap(([ml, [d, h]], k) => {
    const [R, H] = [d / 2000, h / 1000];
    const rn = 0.0205; // hrdlo GL 45 bez závitu
    const top = H - 0.004;
    const sh = H - 0.03 - R * 0.55; // začátek ramene
    const wall = Math.max(0.0018, wallFor(R) * 1.2);
    const outer = [[0, 0.002], [R * 0.9, 0, R * 0.08, 1], [R, R * 0.12, R * 0.1, 2], [R, sh, R * 0.25, 2], [rn + 0.002, H - 0.03, rn * 0.6, 2], [rn + 0.002, top - 0.024], [rn, top - 0.022], [rn, top - 0.002], [rn + wall * 0.4, top]];
    const seg = segFor(R, 0.8);
    const v = vesselGeom(outer, { wall, bottom: 0.004, seg, lipN: 2 });
    const { ribbed, pour } = gl45Cap(rn + 0.0015, top);
    const lab = merge(band(R + 0.0003, H * 0.22, H * 0.55, 100, FRONT, 10));
    const labBand = band(R + 0.0006, H * 0.47, H * 0.55, 100, FRONT, 10);
    const grad = merge(ticks(R + 0.00025, Array.from({ length: 5 }, (_, i) => sh * (0.3 + 0.12 * i)), { span: 22, major: 2, mid: FRONT - 20 }), band(R + 0.00025, sh * 0.45, sh * 0.75, 36, FRONT + 24, 6));
    const head = (id) => [part(id, 'cap', ribbed, 'cap_blue'), part(id, 'pour', pour, 'cap_yellow')];
    return [
      ['01', GLASS, 0, null, false],
      ['02', GLASS, 0.6, 'liquid_water', true],
      ['03', 'glass_amber', 0.7, 'liquid_amber', true],
    ].map(([n, glass, fill, liq, labeled]) => {
      const key = `bottle_gl45_${ml}`;
      const parts = [part(key, glass === GLASS ? 'glass' : 'amber', v.geom, glass), ...head(key)];
      if (labeled) parts.push(part(key, 'label', lab, 'label_paper'), part(key, 'labelband', labBand, bands[k]));
      else parts.push(part(key, 'marks', grad, ENAMEL));
      if (liq) parts.push(part(`${key}_${n}`, 'liquid', liquidGeom(v.inner, sh * fill + 0.004), liq));
      return simple(`bottle_gl45_${ml}_${n}`, `Reagenční lahev ${ml} ml${glass === GLASS ? '' : ', hnědé sklo'}${labeled ? ', se štítkem' : ''}`, CAT, parts, { gen: gen('reagentBottles') });
    });
  });
}

export const VESSELS = [beakers, erlenmeyers, measuringCylinders, volumetricFlasks, roundFlasks, reagentBottles];
