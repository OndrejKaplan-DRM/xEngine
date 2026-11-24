// xWorld: entity = umístěný prefab. Kostra před tvarem: uzly a klouby určují, co se hýbe; díly a kolize se na
// uzly jen věší. Matice uzlů počítá výhradně rigMatrices (src/xspace/rig.js), tady se jen roznášejí do
// vykreslení (pohyblivé díly) a do fyziky (kinematická tělesa uzlů, dynamická tělesa beden).
// Engine o „dveřích“ neví nic: co kloub znamená, říká interakce prefabu (behaviors.js).

import { entityMatrix, rigMatrices, mat4Mul, mat4Point, partMesh, partCollider } from '../xspace/index.js';
import { newBatch, appendMesh } from '../render/batch.js';
import { decompose, compose, mul4 } from '../phys/xform.js';
import { addFacets } from './facets.js';
import { makeJoint, stepJoint, MOVED } from './joints.js';
import { GUARDED, guardOf, obstructed, revertStep } from './blocking.js';
import { swingBoth } from './swing.js';

const CELL_CHECK_FRAMES = 16;

export function createEntities({ phys, render, world, light, pack }) {
  const prefabs = new Map(pack.prefabs.map((p) => [p.data.id, p.data]));
  const matDefs = pack.materials?.materials || {};
  const uvScale = (m) => matDefs[m]?.uvScale || 1;
  const isEmissive = (m) => matDefs[m]?.model === 'emissive';

  let list = [];
  let byId = new Map();
  const active = []; // entity s kloubem v pohybu
  const dynamic = []; // entity s dynamickým tělesem
  const T = { x: 0, y: 0, z: 0, qx: 0, qy: 0, qz: 0, qw: 1, s: 1 };
  const tv = { x: 0, y: 0, z: 0 };
  const tq = { x: 0, y: 0, z: 0, w: 1 };
  const tp = [0, 0, 0];
  let frameNo = 0;
  const stat = { stalled: 0, returns: 0 }; // kroky, kdy díl stál o překážku; návraty po 0,5 s stání
  const warned = new Set();
  const warn = (msg) => {
    if (warned.has(msg)) return;
    warned.add(msg);
    console.info(`xWorld: ${msg}`);
  };
  /** Chování podle interakce (behaviors.js); doplní se po sestavení hry. */
  let behave = null;
  /** id entity dveří → buňky po obou stranách jejího portálu. */
  const doorCells = new Map();

  function instantiate(def, index) {
    let prefab = prefabs.get(def.prefab);
    if (!prefab) throw new Error(`Entita „${def.id}“ odkazuje na prefab „${def.prefab}“, který v balíku není.`);
    if (sys.doorsAway) prefab = swingBoth(prefab);
    const comp = prefab.components || {};
    const bodyKind = comp.physics?.body || 'static';
    const kind = comp.interact?.kind || null;
    const em = entityMatrix(def);
    const scale = def.scale ?? 1;
    const joints = (prefab.rig.joints || []).map((j) => makeJoint(j, kind));
    const ent = {
      id: def.id,
      index,
      def,
      prefab,
      cell: def.cell,
      kind,
      guard: GUARDED.has(kind), // díly se zastaví o hráče a volná tělesa (D-025)
      kin: false, // tělesa uzlů jsou právě kinematická
      interact: comp.interact || null,
      comp,
      em,
      scale,
      joints,
      jointById: Object.fromEntries(joints.map((j) => [j.def.id, j])),
      values: Object.fromEntries(joints.map((j) => [j.def.id, j.value])),
      movers: [], // uzly, které se hýbou: { id, world, mover, body }
      nodeWorld: {}, // id uzlu → světová matice (pevné uzly jednou, pohyblivé průběžně)
      body: null,
      home: null,
      whole: null, // jeden pohyblivý díl pro celou entitu (dynamické těleso, sebratelný předmět)
      wholeM: null, // jeho světová matice (vlastní pole: čte ji i světlo)
      wholeLit: null, // jeho záznam ve světle
      glow: null, // svítící díly lampy: { mover, mats }
      colliders: [],
      light: null,
      lightNode: null,
      // locked, enabled: obecné; on, level: lampa a dvoupolohové klouby; phase: tlačítko; rep: naposled hlášená poloha (changed)
      state: { locked: false, on: false, level: 1, phase: 0, enabled: true, rep: 0 },
      links: null, // spojení výstupů (doplní io)
      inActive: false,
    };

    // ---- které uzly se hýbou (uzel s kloubem a jeho potomci)
    const nodes = prefab.rig.nodes;
    const jointNodes = new Set(joints.map((j) => j.def.node));
    const parent = new Map(nodes.map((n) => [n.id, n.parent]));
    const moves = (id) => {
      for (let n = id; n !== undefined; n = parent.get(n)) if (jointNodes.has(n)) return true;
      return false;
    };
    const M = rigMatrices(prefab, ent.values);
    for (const n of nodes) ent.nodeWorld[n.id] = mat4Mul(em, M[n.id]);

    // ---- viditelné díly
    const whole = bodyKind === 'dynamic' || !!comp.pickup;
    const hasLight = !!comp.light;
    const wholePieces = new Map(); // materiál → dávka v prostoru prefabu
    const glowPieces = new Map(); // materiál → dávka ve světě
    const nodePieces = new Map(); // uzel → (materiál → dávka v prostoru uzlu)
    const piece = (map, mat) => {
      if (!map.has(mat)) map.set(mat, Object.assign(newBatch(), { facets: [] }));
      return map.get(mat);
    };
    /** Díl do dávky pohyblivého kusu; jeho stěny si dávka pamatuje pro světlo (jedna hodnota na stěnu). */
    const addPart = (map, part, mesh, matrix) => {
      const b = piece(map, part.mat);
      const v0 = b.positions.length / 3;
      appendMesh(b, mesh, 0, mesh.indices.length, matrix, uvScale(part.mat));
      addFacets(b.facets, b, v0, b.positions.length / 3);
    };
    // dveře v portálu jsou vidět z obou buněk: pevné díly jdou do dávek obou, pohyblivé jsou sdílené
    const also = (doorCells.get(def.id) || []).filter((c) => c !== ent.cell);
    for (const part of prefab.parts) {
      const mesh = partMesh(part);
      if (!mesh) {
        warn(`díl tvaru „${part.shape}“ (prefab ${prefab.id}) se zatím nekreslí`);
        continue;
      }
      const len = mesh.indices.length;
      if (whole) addPart(wholePieces, part, mesh, M[part.node]);
      else if (moves(part.node)) {
        if (!nodePieces.has(part.node)) nodePieces.set(part.node, new Map());
        addPart(nodePieces.get(part.node), part, mesh, null);
      } else if (hasLight && isEmissive(part.mat)) appendMesh(piece(glowPieces, part.mat), mesh, 0, len, ent.nodeWorld[part.node], uvScale(part.mat));
      else {
        render.addStatic(ent.cell, part.mat, mesh, 0, len, ent.nodeWorld[part.node], uvScale(part.mat));
        for (const c of also) render.addStatic(c, part.mat, mesh, 0, len, ent.nodeWorld[part.node], uvScale(part.mat));
      }
    }
    const toPieces = (map) => [...map].map(([mat, batch]) => ({ mat, batch }));
    const facetsOf = (pieces) => pieces.map((p) => p.batch.facets);
    if (wholePieces.size) {
      const pieces = toPieces(wholePieces);
      ent.whole = render.addMover(ent.cell, pieces);
      ent.wholeM = [...em];
      ent.whole.setMatrix(ent.wholeM);
      ent.wholeLit = light.addMover(ent.whole, ent.wholeM, facetsOf(pieces));
    }
    if (glowPieces.size) {
      const pieces = toPieces(glowPieces);
      ent.glow = { mover: render.addMover(ent.cell, pieces), mats: pieces.map((p) => p.mat) };
      ent.glow.mover.setMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    }
    const moverOf = new Map();
    for (const n of nodes) {
      if (whole || !moves(n.id)) continue;
      const pieces = nodePieces.has(n.id) ? toPieces(nodePieces.get(n.id)) : null;
      const rec = { id: n.id, world: ent.nodeWorld[n.id], mover: pieces ? render.addMover(ent.cell, pieces, also) : null, body: null, lit: null };
      rec.mover?.setMatrix(rec.world);
      if (rec.mover) rec.lit = light.addMover(rec.mover, rec.world, facetsOf(pieces));
      ent.movers.push(rec);
      moverOf.set(n.id, rec);
    }

    // ---- fyzika
    const opts = (c) => ({ group: c.group || (bodyKind === 'static' ? 'world' : 'prop'), friction: comp.physics?.friction, restitution: comp.physics?.restitution, scale });
    const cols = (prefab.colliders || []).map((c) => ({ c, s: partCollider(c) })).filter((x) => {
      if (!x.s) warn(`kolizní tvar „${x.c.shape}“ (prefab ${prefab.id}) zatím neumím`);
      return !!x.s;
    });
    if (bodyKind === 'dynamic') {
      decompose(em, T);
      ent.body = phys.addBody('dynamic', T.x, T.y, T.z, { x: T.qx, y: T.qy, z: T.qz, w: T.qw }, { ccd: !!comp.physics.ccd });
      ent.home = { ...T };
      const mass = (comp.physics.mass ?? 10) / Math.max(cols.length, 1);
      for (const { c, s } of cols) {
        const local = decompose(M[c.node], { ...T });
        const p = mat4Point(M[c.node], s.center);
        ent.colliders.push(phys.addCollider(ent.body, s.shape, [p[0] * scale, p[1] * scale, p[2] * scale], { x: local.qx, y: local.qy, z: local.qz, w: local.qw }, { ...opts(c), mass }, { kind: 'entity', ent, node: c.node }));
      }
      dynamic.push(ent);
    } else {
      for (const { c, s } of cols) {
        const ref = { kind: 'entity', ent, node: c.node };
        const rec = moverOf.get(c.node);
        if (rec) {
          if (!rec.body) {
            decompose(rec.world, T);
            rec.body = phys.addBody('fixed', T.x, T.y, T.z, { x: T.qx, y: T.qy, z: T.qz, w: T.qw }); // kinematické jen za pohybu
          }
          const col = phys.addCollider(rec.body, s.shape, [s.center[0] * scale, s.center[1] * scale, s.center[2] * scale], null, opts(c), ref);
          ent.colliders.push(col);
          if (ent.guard && c.group !== 'trigger') (rec.guards || (rec.guards = [])).push(guardOf(col));
        } else {
          const w = ent.nodeWorld[c.node];
          decompose(w, T);
          ent.colliders.push(phys.addCollider(null, s.shape, mat4Point(w, s.center), { x: T.qx, y: T.qy, z: T.qz, w: T.qw }, opts(c), ref));
        }
      }
    }

    // ---- světlo nesené prefabem
    if (comp.light) {
      const L = comp.light;
      const node = L.node || nodes[0].id;
      const w = ent.nodeWorld[node];
      ent.lightNode = node;
      // směr kuželového světla prefabu je v prostoru uzlu; do světa ho otočí matice uzlu
      const dir = L.dir ? [w[0] * L.dir[0] + w[4] * L.dir[1] + w[8] * L.dir[2], w[1] * L.dir[0] + w[5] * L.dir[1] + w[9] * L.dir[2], w[2] * L.dir[0] + w[6] * L.dir[1] + w[10] * L.dir[2]] : undefined;
      ent.light = light.addLight({ ...L, pos: [w[12], w[13], w[14]], dir }, { id: ent.id, cell: ent.cell, on: false, fixed: false });
    }
    return ent;
  }

  /** Roznese hodnoty kloubů do matic, vykreslení a kinematických těles. given = matice, které už někdo spočítal. */
  function pose(ent, teleport, given) {
    for (const j of ent.joints) ent.values[j.def.id] = j.value;
    if (!ent.movers.length) return;
    const M = given || rigMatrices(ent.prefab, ent.values);
    for (const rec of ent.movers) {
      mul4(ent.em, M[rec.id], rec.world);
      rec.mover?.setMatrix(rec.world);
      light.touchMover(rec.lit);
      if (rec.body) {
        decompose(rec.world, T);
        tv.x = T.x;
        tv.y = T.y;
        tv.z = T.z;
        tq.x = T.qx;
        tq.y = T.qy;
        tq.z = T.qz;
        tq.w = T.qw;
        if (teleport) {
          rec.body.setTranslation(tv, true);
          rec.body.setRotation(tq, true);
        }
        rec.body.setNextKinematicTranslation(tv);
        rec.body.setNextKinematicRotation(tq);
      }
      if (ent.light && rec.id === ent.lightNode) {
        ent.light.pos[0] = rec.world[12];
        ent.light.pos[1] = rec.world[13];
        ent.light.pos[2] = rec.world[14];
        light.moveLight(ent.light);
      }
    }
  }
  /** Tělesa uzlů: kinematická jen za pohybu, jinak pevná (viz phys.addBody). */
  function moving(ent, on) {
    ent.kin = on;
    for (const rec of ent.movers) if (rec.body) phys.setMoving(rec.body, on);
  }
  function activate(ent) {
    if (ent.inActive) return;
    ent.inActive = true;
    active.push(ent);
    moving(ent, true);
  }
  /** Kloub dojel: těleso uzlu posadit přesně na místo a vrátit mezi pevná. */
  function settle(ent) {
    ent.inActive = false;
    pose(ent, true);
    moving(ent, false);
  }
  /** Dílu stojí něco v cestě (D-025): krok se zruší a díl stojí jako pevné těleso, aby se od něj dalo odejít. */
  function stall(ent, dt) {
    stat.stalled++;
    stat.returns += revertStep(ent, dt);
    if (ent.kin) moving(ent, false);
  }
  function syncBody(ent) {
    ent.body.translation(tv);
    ent.body.rotation(tq);
    if (!ent.whole) return;
    compose(tv.x, tv.y, tv.z, tq.x, tq.y, tq.z, tq.w, ent.scale, ent.wholeM);
    ent.whole.setMatrix(ent.wholeM);
    light.touchMover(ent.wholeLit);
  }
  function showLamp(ent) {
    const L = ent.light;
    if (!L) return;
    L.on = ent.state.on;
    L.level = ent.state.level;
    if (ent.glow) ent.glow.mats.forEach((m, i) => ent.glow.mover.setMaterial(i, L.on && L.level > 0 ? m : `${m}:off`));
    light.setLight(L);
    render.invalidate();
  }
  function initial(ent) {
    const props = ent.def.props || {};
    const s = ent.state;
    s.locked = !!props.locked;
    s.on = props.on ?? ent.comp.light?.on ?? !!ent.comp.light;
    s.level = props.level ?? 1;
    s.phase = 0;
    s.enabled = props.enabled ?? true;
    for (const j of ent.joints) {
      j.value = j.rest;
      j.vel = 0;
      j.target = NaN;
      j.from = j.rest;
      j.blocked = 0;
      j.held = false;
      j.active = false;
    }
    behave?.init(ent);
  }

  const sys = {
    name: 'entities',
    phase: 'sim',
    get list() {
      return list;
    },
    byId: (id) => byId.get(id),
    /** Zkouška k N-109: otočné dveře na obě strany, otvírají se od hráče. Platí pro level načtený potom. */
    doorsAway: false,
    set behave(b) {
      behave = b;
    },

    load(ctx) {
      doorCells.clear();
      for (const p of ctx.level.portals || []) if (p.door) doorCells.set(p.door, [p.a, p.b]);
      list = (ctx.level.entities || []).map(instantiate);
      byId = new Map(list.map((e) => [e.id, e]));
      for (const ent of list) {
        initial(ent);
        showLamp(ent);
      }
    },
    unload() {
      list = [];
      byId = new Map();
      active.length = 0;
      dynamic.length = 0;
    },

    reset() {
      active.length = 0;
      for (const ent of list) {
        initial(ent);
        settle(ent);
        showLamp(ent);
        ent.whole?.setVisible(true);
        for (const c of ent.colliders) phys.setColliderEnabled(c, true);
        if (ent.body) {
          const h = ent.home;
          ent.body.setTranslation(phys.vec(h.x, h.y, h.z), true);
          tq.x = h.qx;
          tq.y = h.qy;
          tq.z = h.qz;
          tq.w = h.qw;
          ent.body.setRotation(tq, true);
          ent.body.setLinvel(phys.vec(0, 0, 0), true);
          ent.body.setAngvel(phys.vec(0, 0, 0), true);
          syncBody(ent);
        }
      }
    },

    step(dt) {
      for (let i = active.length - 1; i >= 0; i--) {
        const ent = active[i];
        let moved = false;
        let busy = false;
        let M = null;
        for (const j of ent.joints) {
          j.bits = 0;
          if (!j.active) continue;
          j.pv = j.value;
          j.pt = j.target;
          j.bits = stepJoint(j, dt);
          if (j.bits & MOVED) moved = true;
        }
        if (moved && ent.guard) {
          // D-025: nová poloha se nejdřív zkusí proti hráči a volným tělesům
          for (const j of ent.joints) ent.values[j.def.id] = j.value;
          M = rigMatrices(ent.prefab, ent.values);
          if (obstructed(ent, M, phys)) {
            stall(ent, dt);
            moved = false;
          } else {
            for (const j of ent.joints) j.blocked = 0;
            if (!ent.kin) moving(ent, true);
          }
        }
        for (const j of ent.joints) {
          if (j.bits && behave) behave.onJoint(ent, j, j.bits);
          if (j.active) busy = true;
        }
        if (moved) pose(ent, false, M);
        if (!busy) {
          settle(ent);
          active[i] = active[active.length - 1];
          active.pop();
        }
      }
    },

    /** Dynamická tělesa: přenést polohu z fyziky do obrazu (jen neuspaná). */
    frame() {
      frameNo++;
      for (let i = 0; i < dynamic.length; i++) {
        const ent = dynamic[i];
        if (ent.body.isSleeping() || !ent.state.enabled) continue;
        syncBody(ent);
        if ((frameNo + i) % CELL_CHECK_FRAMES === 0) {
          tp[0] = tv.x;
          tp[1] = tv.y + 0.1;
          tp[2] = tv.z;
          const cell = world.cellAt(tp);
          if (cell && cell.id !== ent.cell) {
            ent.cell = cell.id;
            ent.whole?.setCell(cell.id);
            if (ent.light) ent.light.cell = cell.id;
          }
        }
      }
    },

    // ---- ovládání kloubů (volá chování a interakce)
    /** Pohon k cíli rychlostí kloubu (nebo zadanou). */
    drive(ent, j, target, speed) {
      j.from = j.value;
      j.blocked = 0;
      j.target = Math.min(j.def.max, Math.max(j.def.min, target));
      if (speed) j.speed = speed;
      j.held = false;
      j.active = true;
      activate(ent);
    },
    /** Okamžité nastavení hodnoty (ruka hráče, testy). held = kloub drží ruka a pružina ani zarážky nepracují. */
    setJoint(ent, j, value, held = false) {
      const v = Math.min(j.def.max, Math.max(j.def.min, value));
      let moved = v !== j.value;
      let M = null;
      if (moved && ent.guard) {
        // ani ruka hráče díl do nikoho nezatlačí: zablokovaný posun se prostě neprovede
        ent.values[j.def.id] = v;
        M = rigMatrices(ent.prefab, ent.values);
        if (obstructed(ent, M, phys)) {
          ent.values[j.def.id] = j.value;
          moved = false;
          M = null;
          stat.stalled++;
        }
      }
      if (moved) j.value = v;
      j.target = NaN;
      j.vel = 0;
      j.held = held;
      j.active = true; // i po puštění: pružina nebo zarážka kloub dotáhne
      activate(ent);
      if (moved) pose(ent, false, M);
      return moved;
    },
    release(ent, j) {
      j.held = false;
      j.active = true;
      activate(ent);
    },
    setLamp(ent, on, level) {
      ent.state.on = on;
      if (level !== undefined) ent.state.level = Math.min(1, Math.max(0, level));
      showLamp(ent);
    },
    /** Zapne nebo vypne entitu jako celek (sebraný předmět zmizí i s kolizí). */
    setEnabled(ent, on) {
      ent.state.enabled = on;
      ent.whole?.setVisible(on);
      for (const c of ent.colliders) phys.setColliderEnabled(c, on);
    },
    /** Střed obalu entity ve světě (kam mířit pohledem); u pohyblivých dílů střed hlavního kloubového uzlu. */
    center(id) {
      const ent = byId.get(id);
      if (!ent) throw new Error(`Entita „${id}“ v levelu není.`);
      const b = ent.prefab.bounds;
      const j = behave?.mainJoint(ent);
      // interaktivní prefab: střed kolizí uzlu s kloubem (tam hráč míří), jinak střed obalu prefabu
      const cols = j ? (ent.prefab.colliders || []).filter((c) => c.node === j.def.node && c.min) : [];
      if (cols.length) {
        const c = cols[0];
        return mat4Point(ent.nodeWorld[c.node], [(c.min[0] + c.max[0]) / 2, (c.min[1] + c.max[1]) / 2, (c.min[2] + c.max[2]) / 2]);
      }
      return mat4Point(ent.em, [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2]);
    },
    /** Impuls do dynamického tělesa (N·s) v jeho těžišti. */
    impulse(ent, x, y, z) {
      ent.body?.applyImpulse(phys.vec(x, y, z), true);
    },

    snapshot() {
      return list.map((ent) => {
        const out = { s: { ...ent.state } };
        if (ent.joints.length) out.j = ent.joints.map((j) => [j.value, j.vel, Number.isNaN(j.target) ? null : j.target, j.speed, j.active ? 1 : 0, j.from, j.blocked]);
        if (ent.body) {
          const p = ent.body.translation();
          const q = ent.body.rotation();
          const l = ent.body.linvel();
          const a = ent.body.angvel();
          out.b = [p.x, p.y, p.z, q.x, q.y, q.z, q.w, l.x, l.y, l.z, a.x, a.y, a.z, ent.body.isSleeping() ? 1 : 0];
        }
        return out;
      });
    },
    restore(data) {
      active.length = 0;
      list.forEach((ent, i) => {
        const d = data[i];
        settle(ent);
        if (!d) return;
        Object.assign(ent.state, d.s);
        (d.j || []).forEach((r, k) => {
          const j = ent.joints[k];
          if (!j) return;
          j.value = r[0];
          j.vel = r[1];
          j.target = r[2] === null ? NaN : r[2];
          j.speed = r[3];
          j.active = !!r[4];
          j.from = r[5] ?? j.value;
          j.blocked = r[6] ?? 0;
          j.held = false;
          if (j.active) activate(ent);
        });
        pose(ent, true);
        showLamp(ent);
        sys.setEnabled(ent, ent.state.enabled);
        if (ent.body && d.b) {
          const b = d.b;
          ent.body.setTranslation(phys.vec(b[0], b[1], b[2]), true);
          tq.x = b[3];
          tq.y = b[4];
          tq.z = b[5];
          tq.w = b[6];
          ent.body.setRotation(tq, true);
          ent.body.setLinvel(phys.vec(b[7], b[8], b[9]), true);
          ent.body.setAngvel(phys.vec(b[10], b[11], b[12]), true);
          if (b[13]) ent.body.sleep();
          syncBody(ent);
        }
      });
    },

    inspect(path) {
      if (path[0] === 'ids') return list.map((e) => e.id);
      if (path[0] === 'active') return active.map((e) => e.id);
      if (path[0] === 'stat') return { ...stat };
      const ent = byId.get(path[0]);
      if (!ent) return undefined;
      switch (path[1]) {
        case 'joint': {
          const j = path[2] ? ent.jointById[path[2]] : ent.joints[0];
          return j ? j.value : undefined;
        }
        case 'norm':
          return ent.joints[0]?.norm;
        case 'blocked':
          return ent.joints[0]?.blocked;
        case 'state':
          return { ...ent.state };
        case 'node':
          return ent.nodeWorld[path[2]] ? [...ent.nodeWorld[path[2]]] : undefined;
        case 'pos': {
          if (!ent.body) return [ent.em[12], ent.em[13], ent.em[14]];
          const p = ent.body.translation();
          return [p.x, p.y, p.z];
        }
        case 'body': {
          const b = path[2] ? ent.movers.find((m) => m.id === path[2])?.body : ent.body || ent.movers.find((m) => m.body)?.body;
          if (!b) return undefined;
          const p = b.translation();
          const q = b.rotation();
          return { pos: [p.x, p.y, p.z], rot: [q.x, q.y, q.z, q.w], sleeping: b.isSleeping() };
        }
        case 'light':
          return ent.light ? { on: ent.light.on, level: ent.light.level, intensity: ent.light.intensity } : undefined;
        case 'prefab':
          return ent.prefab.id;
        default:
          return undefined;
      }
    },
  };
  return sys;
}
