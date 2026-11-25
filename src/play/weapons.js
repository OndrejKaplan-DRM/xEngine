// xPlay: zbraně hráče (A3.1, zkušební formát N-201, D-053). Výbava a munice, výběr slotem, střelba (hlavní
// tlačítko střílí, druhé nabíjí), přiblížení, zbraň v ruce a záblesk. Hodnoty jsou data balíku (weapons/*.json),
// vzorce podle nabití jen rampValue ze src/xspace/weapon.js. Náhoda rozptylu jen přes rngNext.
//
// Ovládání (moje volba, zapsaná v A_STAV): levé tlačítko střílí, když hráč zrovna nedrží ovladač (páka, ventil,
// zásuvka pod zaměřovačem se dál chytá levým); druhá střelba F nebo prostřední tlačítko; přiblížení Z (držet,
// nebo přepínat podle nastavení); zbraně klávesami 1–0 (číslo = slot v datech).

import { rngNext } from '../kernel/index.js';
import { rampValue, entityMatrix, mat4Point, rigMatrices } from '../xspace/index.js';
import { SIGHT_RAY } from '../phys/phys.js';
import { newBatch, appendMesh } from '../render/batch.js';
import { addFacets } from '../world/facets.js';
import { cameraVfov } from '../render/fov.js';
import { createProjectiles } from './projectiles.js';

const RAD = Math.PI / 180;
const AIM_MAX = 1000; // m: dosah paprsku, kterým se hledá bod pod zaměřovačem
const RNG_SEED = 0x5eed2b1;
// záblesk (obraz, odhad podle Arény): svítivost cd, dosah m, doba s
const FLASH = { primary: [120, 5, 0.05], alt: [500, 8, 0.09], blast: [900, 10, 0.12] };
const FLASH_COLOR = [0.45, 0.7, 1];
const BLAST_TIME = 0.28; // s: koule výbuchu doroste a zmizí
const KICK_M = 0.06; // m: zákluz 1 = posun zbraně o 6 cm k oku
const KICK_HALF = 0.07; // s: poločas návratu zbraně
const RELIGHT_MOVE = 0.1; // m: zbraň se znovu nasvítí po posunu oka o tolik, nebo po otočení
const RELIGHT_TURN = 0.08; // rad

export function createWeapons({ pack, phys, player, input, interact, combat, render, light, assets, E: engine = null }) {
  let E = engine;
  const defs = (pack.weapons || []).map((w) => w.data).filter(Boolean);
  const index = new Map(defs.map((d, i) => [d.id, i]));
  const ammoDefs = pack.ammo?.ammo || {};
  const prefabs = new Map(pack.prefabs.map((p) => [p.data.id, p]));
  const matDefs = pack.materials?.materials || {};
  const projectiles = createProjectiles({ phys, combat, player, gravity: () => 9.81 });
  projectiles.setWeapons(defs);

  // ---- stav (uloží se)
  const have = new Uint8Array(defs.length);
  const ammo = {};
  let cur = -1;
  let nextShot = 0; // krok, od kterého smí znovu vystřelit
  let chargeFrom = -1; // krok začátku nabíjení, −1 = nenabíjí
  let zoomed = false;
  let rng = RNG_SEED;
  const stat = { fired: 0, primary: 0, alt: 0, empty: 0, fromEye: 0, switched: 0 };

  // ---- obraz (neukládá se)
  let vm = null; // { ctrl, light, def, V0, muzzle } zbraň v ruce
  const lightM = new Float64Array(16); // světová matice zbraně pro světlo: natočení kamery × zbraň, poloha oka
  lightM[15] = 1;
  const vmM = new Float64Array(16);
  const lastLit = [Infinity, 0, 0, 0, 0];
  let kick = 0;
  let flash = null; // [x, y, z, cd, dosah, zbývá, celkem]
  const blasts = []; // [x, y, z, r, t]
  const blastData = new Float32Array(8 * 5);
  let zoomSet = false;

  const eye = [0, 0, 0];
  const dir = [0, 0, 0];
  const aim = [0, 0, 0];
  const org = [0, 0, 0];
  const d = [0, 0, 0];
  const firedEvt = { weapon: '', mode: '', pos: [0, 0, 0], dir: [0, 0, 0] };
  const switchEvt = { weapon: '' };
  const lastShot = { origin: [0, 0, 0], dir: [0, 0, 0], fromEye: false, k: 0, cost: 0 };

  const cooldownSteps = (m) => Math.max(1, Math.ceil(m.cooldown / E.STEP - 1e-9));
  const costOf = (m, k) => (defs[cur].ammo ? Math.round(rampValue(m.cost ?? 1, k)) : 0);
  const ammoOf = (w) => (w.ammo ? ammo[w.ammo] || 0 : Infinity);

  /** Natočení kamery (YXZ: yaw kolem Y, pitch kolem X) do 3 × 3 po sloupcích v poli out[0..10] matice 4 × 4. */
  function camRot(yaw, pitch, out) {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    out[0] = cy;
    out[1] = 0;
    out[2] = -sy;
    out[4] = sy * sp;
    out[5] = cp;
    out[6] = cy * sp;
    out[8] = sy * cp;
    out[9] = -sp;
    out[10] = cy * cp;
    return out;
  }
  const camM = new Float64Array(16);
  /** Bod p v prostoru kamery do světa (oko eye, natočení podle hráče). */
  function camToWorld(p, out) {
    camRot(player.yaw * RAD, player.pitch * RAD, camM);
    out[0] = eye[0] + camM[0] * p[0] + camM[4] * p[1] + camM[8] * p[2];
    out[1] = eye[1] + camM[1] * p[0] + camM[5] * p[1] + camM[9] * p[2];
    out[2] = eye[2] + camM[2] * p[0] + camM[6] * p[1] + camM[10] * p[2];
    return out;
  }

  function buildViewModel() {
    if (vm) light.removeMover(vm.light);
    vm = null;
    render.setViewModel(null);
    if (cur < 0) return;
    const w = defs[cur];
    const pf = prefabs.get(w.view.prefab);
    if (!pf) return;
    const M = rigMatrices(pf.data, {});
    const pieces = new Map();
    for (const part of pf.data.parts || []) {
      const mesh = assets.meshOf(part, pf.from || null);
      if (!mesh) continue;
      if (!pieces.has(part.mat)) pieces.set(part.mat, Object.assign(newBatch(), { facets: [] }));
      const b = pieces.get(part.mat);
      const v0 = b.positions.length / 3;
      appendMesh(b, mesh, 0, mesh.indices.length, M[part.node], part.shape === 'mesh' ? 1 : matDefs[part.mat]?.uvScale || 1);
      addFacets(b.facets, b, v0, b.positions.length / 3);
    }
    const list = [...pieces].map(([mat, batch]) => ({ mat, batch }));
    const ctrl = render.setViewModel(list);
    if (!ctrl) return;
    const V0 = entityMatrix({ pos: w.view.pos, rot: w.view.rot || [0, 0, 0] });
    vm = { ctrl, def: w, V0, muzzle: mat4Point(V0, w.view.muzzle), light: light.addMover(ctrl, lightM, list.map((p) => p.batch.facets)) };
    lastLit[0] = Infinity;
  }

  function select(i) {
    if (i === cur) return;
    cur = i;
    chargeFrom = -1;
    setZoom(false);
    nextShot = Math.max(nextShot, E.steps + 1);
    buildViewModel();
    stat.switched++;
    switchEvt.weapon = i >= 0 ? defs[i].id : '';
    E.emit('weapon:switched', switchEvt);
  }

  function setZoom(on) {
    const want = !!on && cur >= 0 && !!defs[cur].zoom && !interact.seated;
    if (want === zoomed && want === zoomSet) return;
    zoomed = want;
    if (want) {
      render.setViewFov(cameraVfov(defs[cur].zoom.fov, render.aspect));
      zoomSet = true;
    } else if (zoomSet) {
      render.setViewFov(null);
      zoomSet = false;
    }
  }

  /** Náhodný směr v kuželi s polovičním vrcholovým úhlem s (stupně) kolem jednotkového v, přímo do v. */
  function spread(v, s) {
    if (!(s > 0)) return;
    let u;
    [u, rng] = rngNext(rng);
    const cosA = 1 - u * (1 - Math.cos(s * RAD));
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    [u, rng] = rngNext(rng);
    const phi = 2 * Math.PI * u;
    // dva kolmé vektory k v
    const ax = Math.abs(v[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let px = v[1] * ax[2] - v[2] * ax[1];
    let py = v[2] * ax[0] - v[0] * ax[2];
    let pz = v[0] * ax[1] - v[1] * ax[0];
    const pl = Math.hypot(px, py, pz);
    px /= pl;
    py /= pl;
    pz /= pl;
    const qx = v[1] * pz - v[2] * py;
    const qy = v[2] * px - v[0] * pz;
    const qz = v[0] * py - v[1] * px;
    const c = Math.cos(phi) * sinA;
    const sn = Math.sin(phi) * sinA;
    v[0] = v[0] * cosA + px * c + qx * sn;
    v[1] = v[1] * cosA + py * c + qy * sn;
    v[2] = v[2] * cosA + pz * c + qz * sn;
  }

  /** Výstřel režimu m (alt = druhé tlačítko) s nabitím k. */
  function fire(m, alt, k) {
    const w = defs[cur];
    const cost = costOf(m, k);
    if (ammoOf(w) < cost) {
      stat.empty++;
      return false;
    }
    if (w.ammo) ammo[w.ammo] -= cost;
    player.eye(eye, dir);
    const ex = player.collider;
    // bod pod zaměřovačem: tam míří střela z ústí
    const h = phys.raycast(eye[0], eye[1], eye[2], dir[0], dir[1], dir[2], AIM_MAX, SIGHT_RAY, ex);
    const reach = h ? h.dist : AIM_MAX;
    for (let i = 0; i < 3; i++) aim[i] = eye[i] + dir[i] * reach;
    camToWorld(vm ? vm.muzzle : [0, 0, 0], org);
    // ústí za zdí (zbraň u stěny): střela vychází z oka
    const mx = org[0] - eye[0];
    const my = org[1] - eye[1];
    const mz = org[2] - eye[2];
    const ml = Math.hypot(mx, my, mz);
    let fromEye = !vm || ml < 1e-6;
    if (!fromEye && phys.raycast(eye[0], eye[1], eye[2], mx / ml, my / ml, mz / ml, ml, SIGHT_RAY, ex)) fromEye = true;
    if (fromEye) {
      org[0] = eye[0];
      org[1] = eye[1];
      org[2] = eye[2];
      stat.fromEye++;
    }
    d[0] = aim[0] - org[0];
    d[1] = aim[1] - org[1];
    d[2] = aim[2] - org[2];
    let dl = Math.hypot(d[0], d[1], d[2]);
    if (dl < 0.05 || fromEye) {
      d[0] = dir[0];
      d[1] = dir[1];
      d[2] = dir[2];
      dl = 1;
    }
    d[0] /= dl;
    d[1] /= dl;
    d[2] /= dl;
    let pd = d;
    for (let p = 0; p < (m.pellets || 1); p++) {
      pd = [d[0], d[1], d[2]];
      spread(pd, m.spread || 0);
      if (m.kind === 'projectile') projectiles.spawn(org, pd, cur, alt, k);
      else if (m.kind === 'hitscan') hitscan(m, k, org, pd);
    }
    nextShot = E.steps + cooldownSteps(m);
    stat.fired++;
    stat[alt ? 'alt' : 'primary']++;
    lastShot.origin = [...org];
    lastShot.dir = [...pd]; // směr (poslední) střely po rozptylu
    lastShot.aim = [...d];
    lastShot.fromEye = fromEye;
    lastShot.k = k;
    lastShot.cost = cost;
    kick = Math.min(1, kick + (m.recoil || 0));
    const f = FLASH[alt ? 'alt' : 'primary'];
    startFlash(org, f[0] * (alt ? 0.5 + 0.5 * k : 1), f[1], f[2]);
    firedEvt.weapon = w.id;
    firedEvt.mode = alt ? 'alt' : 'primary';
    for (let i = 0; i < 3; i++) {
      firedEvt.pos[i] = org[i];
      firedEvt.dir[i] = d[i];
    }
    E.emit('weapon:fired', firedEvt);
    combat.noise(org, m.noise || 0);
    return true;
  }

  const hp = [0, 0, 0];
  const hn = [0, 0, 0];
  function hitscan(m, k, o, v) {
    const h = phys.raycast(o[0], o[1], o[2], v[0], v[1], v[2], m.range || AIM_MAX, SIGHT_RAY, player.collider);
    if (!h) return;
    for (let i = 0; i < 3; i++) {
      hp[i] = o[i] + v[i] * h.dist;
      hn[i] = [h.nx, h.ny, h.nz][i];
    }
    const ent = h.ref && h.ref.kind === 'entity' ? h.ref.ent : null;
    combat.hit(ent, hp, hn, rampValue(m.damage, k), defs[cur].id, h.ref?.mat ?? null);
    if (m.splash) combat.explode([hp[0] + hn[0] * 0.02, hp[1] + hn[1] * 0.02, hp[2] + hn[2] * 0.02], rampValue(m.splash.radius, k), rampValue(m.splash.damage, k), rampValue(m.splash.push, k) || 0, defs[cur].id, m.noise || 0, ent);
  }

  function startFlash(p, cd, range, time) {
    if (flash && flash[3] * (flash[5] / flash[6]) > cd) return; // silnější záblesk ještě svítí
    flash = [p[0], p[1], p[2], cd, range, time, time];
  }

  /** Nabití druhého režimu po h krocích držení, nejvýš na to, co munice zaplatí. */
  function chargeOf(m, held) {
    let k = Math.min(1, (held * E.STEP) / m.charge.time);
    const w = defs[cur];
    if (w.ammo && costOf(m, k) > ammoOf(w)) {
      let lo = 0;
      let hi = k;
      for (let it = 0; it < 12; it++) {
        const mid = (lo + hi) / 2;
        if (costOf(m, mid) <= ammoOf(w)) lo = mid;
        else hi = mid;
      }
      k = lo;
    }
    return k;
  }

  const sys = {
    name: 'weapons',
    phase: 'sim',
    after: ['player', 'interact'],
    events: ['weapon:fired', 'weapon:switched'],
    stat,
    projectiles,
    /** Přiblížení: 'hold' = jen při držení klávesy, 'toggle' = stisk zapne, další vypne. */
    zoomMode: 'hold',
    init(engine) {
      E = engine;
      E.on('combat:exploded', (e) => {
        blasts.push([e.pos[0], e.pos[1], e.pos[2], e.radius, BLAST_TIME]);
        if (blasts.length > 8) blasts.shift();
        if (e.radius >= 2) startFlash(e.pos, FLASH.blast[0], Math.max(FLASH.blast[1], 2 * e.radius), FLASH.blast[2]);
      });
    },
    load() {
      buildViewModel(); // světlo pohyblivých dílů se při načtení vyprázdní: zbraň se musí přihlásit znovu
    },
    unload() {
      vm = null;
      render.setViewModel(null);
    },
    reset() {
      have.fill(0);
      for (const k of Object.keys(ammo)) delete ammo[k];
      cur = -1;
      nextShot = 0;
      chargeFrom = -1;
      setZoom(false);
      rng = RNG_SEED;
      kick = 0;
      flash = null;
      blasts.length = 0;
      projectiles.clear();
      Object.assign(stat, { fired: 0, primary: 0, alt: 0, empty: 0, fromEye: 0, switched: 0 });
      buildViewModel(); // bez zbraně v ruce
    },

    /** Předmět ze sebrané věci (pickup.item): zbraň dá zbraň a amount její munice, munice jen munici. */
    give(item, amount = 0) {
      const wi = index.get(item);
      if (wi !== undefined) {
        const w = defs[wi];
        have[wi] = 1;
        if (w.ammo) sys.addAmmo(w.ammo, amount);
        if (cur < 0) select(wi);
        return true;
      }
      if (item in ammoDefs) {
        sys.addAmmo(item, amount);
        return true;
      }
      return false; // health, armor: hráč zatím nemá zdraví (A_STAV)
    },
    addAmmo(id, amount) {
      const max = ammoDefs[id]?.max ?? Infinity;
      ammo[id] = Math.min(max, (ammo[id] || 0) + Math.max(0, Math.round(amount)));
    },
    /** Vybrat zbraň podle id (testy, konzole). */
    select(id) {
      const wi = index.get(id);
      if (wi === undefined || !have[wi]) return false;
      select(wi);
      return true;
    },
    get current() {
      return cur >= 0 ? defs[cur] : null;
    },
    get zoomed() {
      return zoomed;
    },

    step(dt) {
      const I = input.intent;
      const seated = interact.seated;
      interact.armed = cur >= 0 && !seated;
      if (!seated && I.slot >= 0) {
        // slot: zbraně v něm podle order; opakovaný stisk přejde na další
        const inSlot = defs.map((w, i) => [w, i]).filter(([w, i]) => have[i] && w.slot === I.slot).sort((a, b) => (a[0].order || 0) - (b[0].order || 0));
        if (inSlot.length) {
          const at = inSlot.findIndex(([, i]) => i === cur);
          select(inSlot[(at + 1) % inSlot.length][1]);
        }
      }
      if (cur >= 0 && !seated) {
        const w = defs[cur];
        if (sys.zoomMode === 'toggle') {
          if (I.zoomPressed) setZoom(!zoomed);
        } else setZoom(I.zoom);
        const busy = interact.manipulating; // levé tlačítko právě drží ovladač
        if (chargeFrom >= 0) {
          const held = E.steps - chargeFrom;
          const k = chargeOf(w.alt, held);
          const auto = w.alt.charge.release && held * E.STEP >= w.alt.charge.release - 1e-9;
          if (!I.alt || auto) {
            chargeFrom = -1;
            fire(w.alt, true, k);
          }
        } else if (E.steps >= nextShot) {
          if (I.alt && w.alt) {
            if (w.alt.charge) {
              if (ammoOf(w) >= costOf(w.alt, 0)) chargeFrom = E.steps;
              else stat.empty++;
            } else fire(w.alt, true, 0);
          } else if (I.grab && !busy) fire(w.primary, false, 0);
        }
      } else {
        chargeFrom = -1;
        if (zoomed) setZoom(false);
      }
      projectiles.step(dt);
    },

    frame(real) {
      // střely a výbuchy
      const [n, data] = projectiles.visual();
      render.setShots(n, data);
      let nb = 0;
      for (let i = blasts.length - 1; i >= 0; i--) {
        const b = blasts[i];
        b[4] -= real;
        if (b[4] <= 0) blasts.splice(i, 1);
      }
      for (const b of blasts) {
        const t = 1 - b[4] / BLAST_TIME;
        blastData.set([b[0], b[1], b[2], b[3] * (0.3 + 0.7 * t), 0.85 * (1 - t)], nb * 5);
        nb++;
      }
      if (nb || blasts.length === 0) render.setBlasts(nb, blastData);
      // záblesk: jediné efektové světlo, síla klesá s časem
      if (flash) {
        flash[5] -= real;
        if (flash[5] <= 0) {
          flash = null;
          render.setFlash(0, 0, 0, 0, 0, 0, 0);
        } else {
          const s = flash[3] * (flash[5] / flash[6]);
          render.setFlash(flash[0], flash[1], flash[2], FLASH_COLOR[0] * s, FLASH_COLOR[1] * s, FLASH_COLOR[2] * s, flash[4]);
        }
      }
      // zbraň v ruce: vůči kameře s zákluzem; schovaná u terminálu
      if (!vm) return;
      vm.ctrl.setVisible(!interact.seated);
      kick *= Math.pow(0.5, real / KICK_HALF);
      vmM.set(vm.V0);
      vmM[14] += kick * KICK_M;
      vm.ctrl.setMatrix(vmM);
      // světlo zbraně: jako díl ve světě v místě oka (zbraň před okem by u zdi ležela ve zdi a ztmavla)
      const v = render.view;
      const moved = Math.hypot(v.x - lastLit[0], v.y - lastLit[1], v.z - lastLit[2]) > RELIGHT_MOVE || Math.abs(v.yaw - lastLit[3]) > RELIGHT_TURN || Math.abs(v.pitch - lastLit[4]) > RELIGHT_TURN;
      if (moved && vm.light) {
        camRot(v.yaw, v.pitch, camM);
        const R = vm.V0;
        for (let c = 0; c < 3; c++) {
          for (let r = 0; r < 3; r++) lightM[c * 4 + r] = camM[r] * R[c * 4] + camM[4 + r] * R[c * 4 + 1] + camM[8 + r] * R[c * 4 + 2];
        }
        lightM[12] = v.x;
        lightM[13] = v.y;
        lightM[14] = v.z;
        light.touchMover(vm.light);
        lastLit[0] = v.x;
        lastLit[1] = v.y;
        lastLit[2] = v.z;
        lastLit[3] = v.yaw;
        lastLit[4] = v.pitch;
      }
    },

    snapshot() {
      return { have: Array.from(have), ammo: { ...ammo }, cur, nextShot, chargeFrom, rng, projectiles: projectiles.snapshot() };
    },
    restore(s) {
      have.set(s.have || []);
      for (const k of Object.keys(ammo)) delete ammo[k];
      Object.assign(ammo, s.ammo || {});
      const prev = cur;
      cur = s.cur ?? -1;
      nextShot = s.nextShot ?? 0;
      chargeFrom = s.chargeFrom ?? -1;
      rng = s.rng ?? RNG_SEED;
      projectiles.restore(s.projectiles);
      setZoom(false);
      if (prev !== cur || !vm) buildViewModel();
    },

    inspect(path) {
      switch (path[0]) {
        case 'current':
          return cur >= 0 ? defs[cur].id : null;
        case 'have':
          return defs.filter((_, i) => have[i]).map((w) => w.id);
        case 'ammo':
          return path[1] ? ammo[path[1]] || 0 : { ...ammo };
        case 'charge':
          return chargeFrom >= 0 ? chargeOf(defs[cur].alt, E.steps - chargeFrom) : -1;
        case 'zoomed':
          return zoomed;
        case 'stat':
          return { ...stat, projectiles: projectiles.count, hits: projectiles.stat.hits, expired: projectiles.stat.expired, dropped: projectiles.stat.dropped };
        case 'last':
          return { ...lastShot };
        case 'muzzle':
          if (!vm) return null;
          player.eye(eye, dir);
          return camToWorld(vm.muzzle, [0, 0, 0]);
        case 'flash':
          return flash ? { cd: flash[3] * (flash[5] / flash[6]), range: flash[4] } : null;
        default:
          return undefined;
      }
    },
  };
  return sys;
}
