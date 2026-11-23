// xLab: sonda fyziky pro ?bench a přehled F3 (úkol A2.3: proč je krok simulace na T460 několikrát delší než
// v sandboxu). Sbírá počty těles a koliderů, profil kroku přímo z Rapieru a čas kroku po systémech jádra;
// k tomu změří pevnou práci (skript a paprsky), aby šlo oddělit „stroj je N× pomalejší“ od „krok dělá víc“.
// Nic z toho nemění hru: profil Rapieru se zapíná jen po dobu měření.

import { SIGHT_RAY } from '../phys/phys.js';

const PARTS = ['step', 'collision', 'broad', 'narrow', 'solver', 'islands', 'changes'];
const COUNT_EVERY = 10; // počty těles se čtou jednou za tolik snímků (160 těles = 320 volání do WASM)
const CALIB_LOOP = 2e6;
const CALIB_RAYS = 5000;

const quantile = (sorted, q) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] : 0);
/** Souhrn řady. Průměr je tu kvůli hodinám prohlížeče: mají krok 0,1 ms, kratší úsek čtou většinou jako 0. */
function summary(arr, n, digits = 3) {
  const s = Array.from(arr.subarray(0, n)).sort((a, b) => a - b);
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s[i];
  return { mean: +(s.length ? sum / s.length : 0).toFixed(digits), median: +quantile(s, 0.5).toFixed(digits), p95: +quantile(s, 0.95).toFixed(digits), max: +(s[s.length - 1] || 0).toFixed(digits) };
}

export function createPhysProbe({ game, max }) {
  const { phys, E, player } = game;
  const parts = PARTS.map(() => new Float32Array(max));
  const awake = new Float32Array(max);
  let sysNames = [];
  let sys = [];
  let n = 0;
  let lastAwake = 0;
  const eye = [0, 0, 0];
  const dir = [0, 0, 0];

  /** Počty těles a koliderů teď. */
  function counts() {
    const W = phys.world;
    const c = { colliders: W.colliders.len(), collidersNoBody: phys.stat.fixedColliders, bodies: W.bodies.len(), dynamic: 0, awake: 0, kinematic: 0, fixed: 0 };
    W.bodies.forEach((b) => {
      if (b.isDynamic()) {
        c.dynamic++;
        if (!b.isSleeping()) c.awake++;
      } else if (b.isKinematic()) c.kinematic++;
      else c.fixed++;
    });
    return c;
  }

  /**
   * Pevná práce pro srovnání strojů: smyčka ve skriptu a paprsky do levelu z místa hráče (WASM Rapieru).
   * Nejlepší ze tří pokusů; poměr těchto časů mezi dvěma stroji je poměr jejich rychlosti pro hru.
   */
  function calib() {
    let js = Infinity;
    let rays = Infinity;
    let sink = 0;
    for (let rep = 0; rep < 3; rep++) {
      let t0 = performance.now();
      for (let i = 0; i < CALIB_LOOP; i++) sink += Math.sqrt(i) * 1.0001;
      js = Math.min(js, performance.now() - t0);
      player.eye(eye, dir);
      t0 = performance.now();
      for (let i = 0; i < CALIB_RAYS; i++) {
        // směry po spirále kolem celé koule (zlatý úhel), vždy stejné
        const y = 1 - (2 * (i + 0.5)) / CALIB_RAYS;
        const r = Math.sqrt(1 - y * y);
        const a = i * 2.399963229728653;
        if (phys.raycast(eye[0], eye[1], eye[2], Math.cos(a) * r, y, Math.sin(a) * r, 30, SIGHT_RAY)) sink++;
      }
      rays = Math.min(rays, performance.now() - t0);
    }
    return { jsMs: +js.toFixed(2), jsLoop: CALIB_LOOP, raysMs: +rays.toFixed(2), rays: CALIB_RAYS, sink: sink > 0 };
  }

  return {
    counts,
    calib,
    start() {
      n = 0;
      lastAwake = counts().awake;
      sysNames = [];
      sys = [];
      phys.world.profilerEnabled = true;
    },
    /** Po snímku: profil posledního kroku fyziky a klouzavé časy systémů. */
    sample() {
      if (n >= max) return;
      const W = phys.world;
      parts[0][n] = W.timingStep();
      parts[1][n] = W.timingCollisionDetection();
      parts[2][n] = W.timingBroadPhase();
      parts[3][n] = W.timingNarrowPhase();
      parts[4][n] = W.timingSolver();
      parts[5][n] = W.timingIslandConstruction();
      parts[6][n] = W.timingUserChanges();
      if (n % COUNT_EVERY === 0) lastAwake = counts().awake;
      awake[n] = lastAwake;
      if (!sysNames.length) {
        // jména systémů jsou známá až po prvním měřeném kroku jádra
        sysNames = Object.keys(E.stats.sys);
        sys = sysNames.map(() => new Float32Array(max));
      }
      for (let i = 0; i < sysNames.length; i++) sys[i][n] = E.stats.sys[sysNames[i]] || 0;
      n++;
    },
    stop() {
      if (phys.world) phys.world.profilerEnabled = false;
    },
    result() {
      const c = counts();
      const rapierMs = {};
      PARTS.forEach((p, i) => (rapierMs[p] = summary(parts[i], n)));
      const bySystem = {};
      sysNames.forEach((name, i) => {
        const s = summary(sys[i], n);
        if (s.max >= 0.005) bySystem[name] = s;
      });
      return {
        sys: bySystem,
        phys: {
          ...c,
          awake: summary(awake, n, 0),
          rapierMs,
          note: 'rapierMs je profil jednoho kroku uvnitř Rapieru (step = celek; collision = broad + narrow; solver; islands; changes); hodiny prohlížeče mají krok 0,1 ms, pod ním platí jen průměr (mean). Systém phys v step.sys je celé world.step() včetně obnovy dotazů; rozdíl proti rapierMs.step je režie kolem.',
        },
      };
    },
  };
}
