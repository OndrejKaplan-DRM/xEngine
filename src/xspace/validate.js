// Validátor xSpace. Čistý modul (Node i prohlížeč): dostane načtený balík a vrátí nálezy.
// Dvě vrstvy: (1) tvar podle popisu ve formats.js, (2) smysl: odkazy, geometrie, kostry, spojení.
// Každý nález má stálý kód, na který se odkazují testy i zprávy sešen.

import { FORMATS, LIMITS, LEVEL_TARGETS, FREE_LICENSES, FACE_KEYS, XSPACE_VERSION } from './formats.js';
import { inBounds, boundsGap, wedgeRunRise } from './geom.js';
import { bodyWidth } from './body.js';

const ID = /^[a-z][a-z0-9_]*$/;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isVec = (v, n) => Array.isArray(v) && v.length === n && v.every(isNum);

/** Sběrač nálezů. */
function collector() {
  const items = [];
  return {
    items,
    err: (code, path, msg) => items.push({ level: 'error', code, path, msg }),
    warn: (code, path, msg) => items.push({ level: 'warn', code, path, msg }),
  };
}

/** Vrstva 1: tvar hodnoty podle popisu. */
function checkShape(d, v, path, c) {
  switch (d.t) {
    case 'const':
      if (v !== d.value) c.err('shape.const', path, `má být ${JSON.stringify(d.value)}, je ${JSON.stringify(v)}`);
      return;
    case 'any':
      return;
    case 'id':
    case 'ref':
      if (typeof v !== 'string' || !v) return c.err('shape.type', path, 'má být neprázdný řetězec');
      if (d.t === 'id' && (!ID.test(v) || v.length > LIMITS.idMax)) {
        c.err('shape.id', path, `id „${v}“ má být malými písmeny, číslicemi a podtržítkem, nejvýš ${LIMITS.idMax} znaků`);
      }
      return;
    case 'str':
      if (typeof v !== 'string' || !v) c.err('shape.type', path, 'má být neprázdný řetězec');
      return;
    case 'bool':
      if (typeof v !== 'boolean') c.err('shape.type', path, 'má být true nebo false');
      return;
    case 'num':
    case 'int':
      if (!isNum(v)) return c.err('shape.type', path, 'má být číslo');
      if (d.t === 'int' && !Number.isInteger(v)) return c.err('shape.type', path, 'má být celé číslo');
      if (d.min !== undefined && v < d.min) c.err('shape.range', path, `${v} je pod mezí ${d.min}`);
      if (d.max !== undefined && v > d.max) c.err('shape.range', path, `${v} je nad mezí ${d.max}`);
      return;
    case 'vec2':
      if (!isVec(v, 2)) c.err('shape.type', path, 'má být pole dvou čísel');
      return;
    case 'vec3':
      if (!isVec(v, 3)) return c.err('shape.type', path, 'má být pole tří čísel');
      if (v.some((x) => Math.abs(x) > LIMITS.coordMax)) c.err('shape.range', path, `souřadnice mimo ±${LIMITS.coordMax} m`);
      return;
    case 'color':
      if (!isVec(v, 3)) return c.err('shape.type', path, 'má být pole tří čísel [r, g, b]');
      if (v.some((x) => x < 0 || x > 1)) c.err('shape.range', path, 'složky barvy mají být 0–1');
      return;
    case 'enum':
      if (!d.values.includes(v)) c.err('shape.enum', path, `„${v}“ není z výčtu: ${d.values.join(', ')}`);
      return;
    case 'arr':
      if (!Array.isArray(v)) return c.err('shape.type', path, 'má být pole');
      if (d.minLen !== undefined && v.length < d.minLen) c.err('shape.length', path, `má mít aspoň ${d.minLen} položek`);
      if (d.maxLen !== undefined && v.length > d.maxLen) c.err('shape.length', path, `má mít nejvýš ${d.maxLen} položek`);
      v.forEach((item, i) => checkShape(d.of, item, `${path}[${i}]`, c));
      return;
    case 'map':
      if (!v || typeof v !== 'object' || Array.isArray(v)) return c.err('shape.type', path, 'má být objekt id → hodnota');
      for (const [k, item] of Object.entries(v)) checkShape(d.of, item, `${path}.${k}`, c);
      return;
    case 'obj':
      if (!v || typeof v !== 'object' || Array.isArray(v)) return c.err('shape.type', path, 'má být objekt');
      for (const [k, fd] of Object.entries(d.fields)) {
        if (v[k] === undefined) {
          if (fd.req) c.err('shape.required', `${path}.${k}`, 'povinné pole chybí');
        } else checkShape(fd, v[k], `${path}.${k}`, c);
      }
      for (const k of Object.keys(v)) {
        if (!(k in d.fields)) c.warn('shape.unknown', `${path}.${k}`, 'neznámé pole (překlep, nebo pole z novější verze formátu)');
      }
      return;
    default:
      throw new Error(`Neznámý typ v popisu formátu: ${d.t}`);
  }
}

function dupes(list, path, code, c) {
  const seen = new Set();
  list.forEach((x, i) => {
    if (!x || typeof x.id !== 'string') return;
    if (seen.has(x.id)) c.err(code, `${path}[${i}].id`, `id „${x.id}“ se opakuje`);
    seen.add(x.id);
  });
  return seen;
}

function boxOk(min, max, path, c, minSize = LIMITS.brushMinSize) {
  if (!isVec(min, 3) || !isVec(max, 3)) return false;
  let ok = true;
  for (let i = 0; i < 3; i++) {
    if (max[i] - min[i] < minSize) {
      c.err('geom.box', path, `rozměr v ose ${'xyz'[i]} je ${(max[i] - min[i]).toFixed(4)} m; min musí být menší než max aspoň o ${minSize} m`);
      ok = false;
    }
  }
  return ok;
}

// ---- materiály -------------------------------------------------------------------------

function checkMaterials(file, mats, c, assetPaths = null, foreign = null) {
  checkShape(FORMATS.materials, mats, file, c);
  const ids = new Set();
  if (mats && mats.materials && typeof mats.materials === 'object') {
    for (const [k, m] of Object.entries(mats.materials)) {
      if (!ID.test(k)) c.err('shape.id', `${file}.materials.${k}`, 'id materiálu má být malými písmeny, číslicemi a podtržítkem');
      ids.add(k);
      if (m && m.model === 'emissive' && !m.emissive) c.err('mat.emissive', `${file}.materials.${k}`, 'model emissive vyžaduje pole emissive');
      if (m && assetPaths && !foreign?.has(k)) {
        for (const f of ['albedo', 'normal']) {
          if (typeof m[f] === 'string' && !assetPaths.has(m[f])) c.err('ref.asset', `${file}.materials.${k}.${f}`, `soubor „${m[f]}“ není v seznamu assets manifestu (N-111)`);
        }
      }
      if (m && m.albedoMean !== undefined && (!m.albedo || !Array.isArray(m.albedoMean) || m.albedoMean.some((x) => !(x > 0)))) c.err('mat.albedoMean', `${file}.materials.${k}.albedoMean`, 'albedoMean patří jen k materiálu s albedo a všechny složky mají být větší než 0 (N-009)');
      if (m && isNum(m.opacity) && m.opacity < 1 && m.alphaTest !== undefined) c.warn('mat.alphaBoth', `${file}.materials.${k}`, 'materiál má opacity pod 1 i alphaTest: dva různé způsoby průhlednosti');
    }
  }
  return ids;
}

// ---- prefab ----------------------------------------------------------------------------

function checkPrefab(file, p, matIds, prefabIds, assetPaths, c) {
  checkShape(FORMATS.prefab, p, file, c);
  if (!p || typeof p !== 'object') return;
  if (p.bounds) boxOk(p.bounds.min, p.bounds.max, `${file}.bounds`, c);

  const nodes = Array.isArray(p.rig?.nodes) ? p.rig.nodes : [];
  const joints = Array.isArray(p.rig?.joints) ? p.rig.joints : [];
  const nodeIds = dupes(nodes, `${file}.rig.nodes`, 'rig.dupe', c);
  const jointIds = dupes(joints, `${file}.rig.joints`, 'rig.dupe', c);

  // kostra: jeden kořen, rodiče existují, žádný kruh
  const parentOf = new Map(nodes.filter((n) => n && n.id).map((n) => [n.id, n.parent]));
  const roots = nodes.filter((n) => n && n.parent === undefined);
  if (nodes.length && roots.length !== 1) c.err('rig.root', `${file}.rig.nodes`, `kostra má mít právě jeden kořen, má ${roots.length}`);
  nodes.forEach((n, i) => {
    if (!n || n.parent === undefined) return;
    if (!nodeIds.has(n.parent)) return c.err('ref.node', `${file}.rig.nodes[${i}].parent`, `uzel „${n.parent}“ neexistuje`);
    const seen = new Set([n.id]);
    let cur = n.parent;
    while (cur !== undefined) {
      if (seen.has(cur)) {
        c.err('rig.cycle', `${file}.rig.nodes[${i}]`, `uzel „${n.id}“ je ve vlastní větvi předků`);
        break;
      }
      seen.add(cur);
      cur = parentOf.get(cur);
    }
  });

  const jointedNodes = new Set();
  joints.forEach((j, i) => {
    if (!j) return;
    const path = `${file}.rig.joints[${i}]`;
    if (j.node !== undefined && !nodeIds.has(j.node)) c.err('ref.node', `${path}.node`, `uzel „${j.node}“ neexistuje`);
    if (j.node !== undefined && parentOf.get(j.node) === undefined && nodeIds.has(j.node)) {
      c.err('rig.rootJoint', `${path}.node`, 'kloub nemůže hýbat kořenem; kořen je pevná část předmětu');
    }
    if (jointedNodes.has(j.node)) c.err('rig.dupeJoint', `${path}.node`, `uzel „${j.node}“ už kloub má; víc stupňů volnosti = mezilehlý uzel`);
    jointedNodes.add(j.node);
    if (isVec(j.axis, 3)) {
      const len = Math.hypot(...j.axis);
      if (Math.abs(len - 1) > 1e-3) c.err('rig.axis', `${path}.axis`, `osa má být jednotkový vektor, délka je ${len.toFixed(4)}`);
    }
    if (isNum(j.min) && isNum(j.max)) {
      if (j.min >= j.max) c.err('rig.limits', path, `min (${j.min}) musí být menší než max (${j.max})`);
      const span = j.max - j.min;
      if (j.type === 'slider' && span > LIMITS.sliderMax) c.err('rig.limits', path, `posuv ${span} m je nad mezí ${LIMITS.sliderMax} m`);
      if (j.type === 'hinge' && span > 360 * LIMITS.hingeMaxTurns) c.err('rig.limits', path, `otočení ${span}° je nad mezí ${LIMITS.hingeMaxTurns} otáček`);
      const inside = (v) => v >= j.min - 1e-9 && v <= j.max + 1e-9;
      if (j.rest !== undefined && isNum(j.rest) && !inside(j.rest)) c.err('rig.limits', `${path}.rest`, 'klidová poloha je mimo meze');
      (Array.isArray(j.detents) ? j.detents : []).forEach((dv, k) => {
        if (isNum(dv) && !inside(dv)) c.err('rig.limits', `${path}.detents[${k}]`, 'zarážka je mimo meze');
      });
    }
  });

  const needsBox = (x, path) => {
    if (x.min === undefined || x.max === undefined) c.err('shape.required', path, 'tvar box vyžaduje min a max');
    else boxOk(x.min, x.max, path, c, LIMITS.partMinSize);
  };
  const needsCyl = (x, path) => {
    for (const k of ['center', 'radius', 'height', 'axis']) if (x[k] === undefined) c.err('shape.required', `${path}.${k}`, 'tvar cyl vyžaduje center, radius, height a axis');
  };
  const needsMesh = (x, path) => {
    if (x.mesh === undefined) return c.err('shape.required', `${path}.mesh`, 'tvar vyžaduje pole mesh');
    const filePart = String(x.mesh).split('#')[0];
    if (!assetPaths.has(filePart)) c.err('ref.asset', `${path}.mesh`, `soubor „${filePart}“ není v seznamu assets manifestu`);
  };

  (Array.isArray(p.parts) ? p.parts : []).forEach((x, i) => {
    if (!x) return;
    const path = `${file}.parts[${i}]`;
    if (x.node !== undefined && !nodeIds.has(x.node)) c.err('ref.node', `${path}.node`, `uzel „${x.node}“ neexistuje`);
    if (x.mat !== undefined && !matIds.has(x.mat)) c.err('ref.material', `${path}.mat`, `materiál „${x.mat}“ neexistuje`);
    if (x.shape === 'box') needsBox(x, path);
    if (x.shape === 'cyl') needsCyl(x, path);
    if (x.shape === 'mesh') needsMesh(x, path);
    if (x.shape !== 'mesh' && x.mat === undefined) c.err('shape.required', `${path}.mat`, 'díl z kvádru nebo válce musí mít materiál');
  });

  (Array.isArray(p.colliders) ? p.colliders : []).forEach((x, i) => {
    if (!x) return;
    const path = `${file}.colliders[${i}]`;
    if (x.node !== undefined && !nodeIds.has(x.node)) c.err('ref.node', `${path}.node`, `uzel „${x.node}“ neexistuje`);
    if (x.shape === 'box') needsBox(x, path);
    if (x.shape === 'cyl') needsCyl(x, path);
    if (x.shape === 'ball' && (x.center === undefined || x.radius === undefined)) c.err('shape.required', path, 'tvar ball vyžaduje center a radius');
    if (x.shape === 'hull' || x.shape === 'mesh') needsMesh(x, path);
    if (x.shape === 'mesh' && p.components?.physics?.body === 'dynamic') c.err('phys.meshDynamic', path, 'dynamické těleso nesmí mít kolizi mesh; použij hull nebo kvádry');
  });

  const comp = p.components || {};
  if (comp.interact) {
    const it = comp.interact;
    if (it.joint !== undefined && !jointIds.has(it.joint)) c.err('ref.joint', `${file}.components.interact.joint`, `kloub „${it.joint}“ neexistuje`);
    const needsJoint = ['button', 'switch', 'lever', 'valve', 'door', 'drawer'];
    if (needsJoint.includes(it.kind) && it.joint === undefined) c.err('interact.joint', `${file}.components.interact`, `interakce ${it.kind} vyžaduje kloub`);
    if ((it.kind === 'terminal' || it.kind === 'station') && !it.station) c.err('interact.station', `${file}.components.interact`, `interakce ${it.kind} vyžaduje ukotvení kamery (station)`);
    if (it.kind === 'terminal' && !comp.screen) c.err('interact.screen', `${file}.components`, 'terminál vyžaduje součást screen');
    if (it.kind === 'pickup' && !comp.pickup) c.err('interact.pickup', `${file}.components`, 'interakce pickup vyžaduje součást pickup');
    if (it.kind === 'grab' && comp.physics?.body !== 'dynamic') c.err('interact.grab', `${file}.components`, 'uchopit jde jen dynamické těleso');
  }
  if (comp.place?.mount === 'opening' && comp.place.opening === undefined) c.err('place.opening', `${file}.components.place`, 'umístění do otvoru vyžaduje rozměr otvoru (opening)');
  if (comp.place?.mount === 'wall' && comp.place.height === undefined) c.err('place.height', `${file}.components.place`, 'nástěnný prefab vyžaduje výšku počátku nad podlahou (height)');
  if (comp.interact?.seeThrough && comp.interact.kind !== 'door') c.warn('interact.seeThrough', `${file}.components.interact`, 'seeThrough má smysl jen u dveří');
  if (comp.light?.node !== undefined && !nodeIds.has(comp.light.node)) c.err('ref.node', `${file}.components.light.node`, `uzel „${comp.light.node}“ neexistuje`);
  if (comp.screen?.node !== undefined && !nodeIds.has(comp.screen.node)) c.err('ref.node', `${file}.components.screen.node`, `uzel „${comp.screen.node}“ neexistuje`);
  if (comp.health?.breakInto !== undefined && !prefabIds.has(comp.health.breakInto)) c.err('ref.prefab', `${file}.components.health.breakInto`, `prefab „${comp.health.breakInto}“ neexistuje`);
  if (comp.physics?.body === 'dynamic' && comp.physics.mass === undefined) c.err('phys.mass', `${file}.components.physics`, 'dynamické těleso musí mít hmotnost');
  if (comp.physics && !(Array.isArray(p.colliders) && p.colliders.length)) c.err('phys.noCollider', `${file}.components.physics`, 'těleso bez kolizního tvaru');
  if (joints.length && comp.physics?.body === 'static') c.warn('phys.staticJoint', `${file}.components.physics`, 'předmět s klouby má být kinematic, jinak se jeho pohyblivé díly nesrazí s hráčem');
  if (isNum(p.tris) && p.tris > LIMITS.warnPrefabTris) c.warn('budget.prefabTris', `${file}.tris`, `${p.tris} trojúhelníků je nad doporučením ${LIMITS.warnPrefabTris}`);

  for (const k of ['inputs', 'outputs']) {
    const list = Array.isArray(p[k]) ? p[k] : [];
    if (new Set(list).size !== list.length) c.err('io.dupe', `${file}.${k}`, 'položky se opakují');
  }
}

// ---- level -----------------------------------------------------------------------------

function checkLevel(file, L, matIds, prefabById, externalPrefabs, c) {
  checkShape(FORMATS.level, L, file, c);
  if (!L || typeof L !== 'object') return null;
  const cells = Array.isArray(L.cells) ? L.cells : [];
  const portals = Array.isArray(L.portals) ? L.portals : [];
  const brushes = Array.isArray(L.brushes) ? L.brushes : [];
  const entities = Array.isArray(L.entities) ? L.entities : [];
  const lights = Array.isArray(L.lights) ? L.lights : [];
  const triggers = Array.isArray(L.triggers) ? L.triggers : [];
  const spawns = Array.isArray(L.spawns) ? L.spawns : [];

  const cellIds = dupes(cells, `${file}.cells`, 'level.dupe', c);
  dupes(portals, `${file}.portals`, 'level.dupe', c);
  dupes(brushes, `${file}.brushes`, 'level.dupe', c);
  const entIds = dupes(entities, `${file}.entities`, 'level.dupe', c);
  dupes(lights, `${file}.lights`, 'level.dupe', c);
  dupes(triggers, `${file}.triggers`, 'level.dupe', c);
  dupes(spawns, `${file}.spawns`, 'level.dupe', c);

  const cellById = new Map(cells.filter((x) => x && x.id).map((x) => [x.id, x]));
  const entById = new Map(entities.filter((x) => x && x.id).map((x) => [x.id, x]));
  const cellRef = (v, path) => {
    if (v !== undefined && !cellIds.has(v)) c.err('ref.cell', path, `buňka „${v}“ neexistuje`);
  };

  // buňky: platné a nepřekrývají se
  cells.forEach((cell, i) => {
    if (cell?.bounds) boxOk(cell.bounds.min, cell.bounds.max, `${file}.cells[${i}].bounds`, c);
  });
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const a = cells[i]?.bounds;
      const b = cells[j]?.bounds;
      if (!a || !b || !isVec(a.min, 3) || !isVec(a.max, 3) || !isVec(b.min, 3) || !isVec(b.max, 3)) continue;
      const over = [0, 1, 2].every((k) => Math.min(a.max[k], b.max[k]) - Math.max(a.min[k], b.min[k]) > 1e-6);
      if (over) c.err('level.cellOverlap', `${file}.cells[${j}]`, `buňky „${cells[i].id}“ a „${cells[j].id}“ se překrývají`);
    }
  }

  // portály: dvě různé buňky, rovina mezi jejich stěnami, otvor v rozsahu obou
  const links = new Map(cells.map((x) => [x?.id, new Set()]));
  portals.forEach((p, i) => {
    if (!p) return;
    const path = `${file}.portals[${i}]`;
    cellRef(p.a, `${path}.a`);
    cellRef(p.b, `${path}.b`);
    if (p.a === p.b) c.err('portal.same', path, 'portál musí spojovat dvě různé buňky');
    if (p.door !== undefined) {
      if (!entIds.has(p.door)) c.err('ref.entity', `${path}.door`, `entita „${p.door}“ neexistuje`);
      else {
        const pf = prefabById.get(entById.get(p.door).prefab);
        if (pf && pf.components?.interact?.kind !== 'door') c.err('portal.door', `${path}.door`, 'entita u portálu není dveřmi (interact.kind = door)');
      }
    }
    const A = cellById.get(p.a)?.bounds;
    const B = cellById.get(p.b)?.bounds;
    if (!A || !B || !Array.isArray(p.quad) || p.quad.length !== 4 || !p.quad.every((q) => isVec(q, 3))) return;
    if (p.passable !== false) {
      // portál jen pro pohled (okno) do dosažitelnosti nepatří (N-003)
      links.get(p.a)?.add(p.b);
      links.get(p.b)?.add(p.a);
    }
    const flat = [0, 1, 2].filter((k) => Math.max(...p.quad.map((q) => q[k])) - Math.min(...p.quad.map((q) => q[k])) <= LIMITS.portalPlaneEps);
    if (flat.length !== 1) return c.err('portal.plane', `${path}.quad`, 'rohy mají ležet v jedné rovině kolmé na osu x, y nebo z');
    const k = flat[0];
    const plane = p.quad[0][k];
    const lo = Math.min(A.max[k], B.max[k]);
    const hi = Math.max(A.min[k], B.min[k]);
    if (plane < lo - LIMITS.portalPlaneEps || plane > hi + LIMITS.portalPlaneEps) {
      c.err('portal.between', `${path}.quad`, `rovina portálu (${'xyz'[k]} = ${plane}) neleží mezi stěnami buněk (${lo} až ${hi})`);
    }
    for (const o of [0, 1, 2].filter((x) => x !== k)) {
      const qmin = Math.min(...p.quad.map((q) => q[o]));
      const qmax = Math.max(...p.quad.map((q) => q[o]));
      for (const [name, bb] of [[p.a, A], [p.b, B]]) {
        if (qmin < bb.min[o] - LIMITS.portalPlaneEps || qmax > bb.max[o] + LIMITS.portalPlaneEps) {
          c.err('portal.extent', `${path}.quad`, `otvor přesahuje buňku „${name}“ v ose ${'xyz'[o]}`);
        }
      }
      if (qmax - qmin < 0.05) c.err('portal.extent', `${path}.quad`, `otvor má v ose ${'xyz'[o]} nulový rozměr`);
      // průchozí otvor ve svislé zdi musí pustit postavu (N-008, D-040)
      if (o !== 1 && k !== 1 && p.passable !== false && qmax - qmin >= 0.05 && qmax - qmin < bodyWidth() - 1e-6) {
        c.warn('portal.narrow', `${path}.quad`, `otvor je široký ${+(qmax - qmin).toFixed(3)} m, postava potřebuje ${bodyWidth().toFixed(2)} m (nebo passable: false)`);
      }
    }
  });

  // kvádry
  const perCell = new Map(cells.map((x) => [x?.id, { brushes: 0, entities: 0 }]));
  brushes.forEach((b, i) => {
    if (!b) return;
    const path = `${file}.brushes[${i}]`;
    cellRef(b.cell, `${path}.cell`);
    if (b.mat !== undefined && !matIds.has(b.mat)) {
      if (externalPrefabs) c.warn('ref.materialExternal', `${path}.mat`, `materiál „${b.mat}“ není v tomto balíku; očekává se v balíku z requires`);
      else c.err('ref.material', `${path}.mat`, `materiál „${b.mat}“ neexistuje`);
    }
    const okBox = boxOk(b.min, b.max, path, c);
    const shape = b.shape || 'box';
    if (shape === 'wedge') {
      if (b.rise === undefined) c.err('shape.required', `${path}.rise`, 'klín vyžaduje směr stoupání');
      if (b.faces) c.err('brush.faces', `${path}.faces`, 'materiály po stěnách umí jen box');
      if (okBox && b.rise) {
        const { angleDeg } = wedgeRunRise(b);
        if (angleDeg > 80) c.warn('brush.steep', path, `klín se sklonem ${angleDeg.toFixed(0)}° je skoro zeď; použij box`);
      }
    } else if (b.rise !== undefined) c.warn('brush.rise', `${path}.rise`, 'pole rise má smysl jen u klínu');
    if (b.faces && typeof b.faces === 'object') {
      for (const [k, m] of Object.entries(b.faces)) {
        if (!FACE_KEYS.includes(k)) c.err('brush.faces', `${path}.faces.${k}`, `neznámá stěna; povolené: ${FACE_KEYS.join(', ')}`);
        if (!matIds.has(m) && !externalPrefabs) c.err('ref.material', `${path}.faces.${k}`, `materiál „${m}“ neexistuje`);
      }
    }
    const cell = cellById.get(b.cell);
    if (cell && okBox && boundsGap({ min: b.min, max: b.max }, cell.bounds) > 1.0) {
      c.warn('brush.far', path, `kvádr je víc než 1 m od své buňky „${b.cell}“`);
    }
    if (perCell.has(b.cell)) perCell.get(b.cell).brushes++;
  });

  // překryvy kvádrů (dvojité plochy blikají a zapečené světlo na nich nesedí)
  if (brushes.length <= LIMITS.overlapCheckMax) {
    const solid = brushes.map((b, i) => ({ b, i })).filter(({ b }) => b && isVec(b.min, 3) && isVec(b.max, 3) && b.vis !== false);
    for (let i = 0; i < solid.length; i++) {
      for (let j = i + 1; j < solid.length; j++) {
        const p = solid[i].b;
        const q = solid[j].b;
        if ([0, 1, 2].every((k) => Math.min(p.max[k], q.max[k]) - Math.max(p.min[k], q.min[k]) > 1e-4)) {
          c.warn('brush.overlap', `${file}.brushes[${solid[j].i}]`, `kvádry „${p.id}“ a „${q.id}“ se objemově překrývají`);
        }
      }
    }
  }

  // entity a spojení
  const ioCheck = (io, path, outputs, ownerLabel) => {
    (Array.isArray(io) ? io : []).forEach((l, k) => {
      if (!l) return;
      const lp = `${path}.io[${k}]`;
      if (outputs && typeof l.on === 'string' && !outputs.includes(l.on)) c.err('io.output', `${lp}.on`, `${ownerLabel} nemá výstup „${l.on}“ (má: ${outputs.join(', ') || 'žádný'})`);
      if (typeof l.target !== 'string') return;
      if (l.target.startsWith('@')) {
        const ins = LEVEL_TARGETS[l.target];
        if (!ins) c.err('io.target', `${lp}.target`, `vestavěný cíl „${l.target}“ neexistuje`);
        else if (!ins.includes(l.input)) c.err('io.input', `${lp}.input`, `cíl ${l.target} nemá vstup „${l.input}“ (má: ${ins.join(', ')})`);
        return;
      }
      const target = entById.get(l.target);
      if (!target) return c.err('io.target', `${lp}.target`, `entita „${l.target}“ neexistuje`);
      const tp = prefabById.get(target.prefab);
      if (tp && !(tp.inputs || []).includes(l.input)) c.err('io.input', `${lp}.input`, `prefab „${tp.id}“ nemá vstup „${l.input}“ (má: ${(tp.inputs || []).join(', ') || 'žádný'})`);
    });
  };

  entities.forEach((e, i) => {
    if (!e) return;
    const path = `${file}.entities[${i}]`;
    cellRef(e.cell, `${path}.cell`);
    const pf = prefabById.get(e.prefab);
    if (e.prefab !== undefined && !pf) {
      if (externalPrefabs) c.warn('ref.prefabExternal', `${path}.prefab`, `prefab „${e.prefab}“ není v tomto balíku; očekává se v balíku z requires`);
      else c.err('ref.prefab', `${path}.prefab`, `prefab „${e.prefab}“ neexistuje`);
    }
    const cell = cellById.get(e.cell);
    if (cell && isVec(e.pos, 3) && !inBounds(e.pos, cell.bounds, 0.5)) c.warn('entity.outside', `${path}.pos`, `entita leží víc než 0,5 m mimo svou buňku „${e.cell}“`);
    ioCheck(e.io, path, pf ? pf.outputs || [] : null, pf ? `prefab „${pf.id}“` : 'prefab');
    if (perCell.has(e.cell)) perCell.get(e.cell).entities++;
  });

  lights.forEach((l, i) => {
    if (!l) return;
    const path = `${file}.lights[${i}]`;
    cellRef(l.cell, `${path}.cell`);
    if ((l.type === 'spot' || l.type === 'sun') && l.dir === undefined) c.err('shape.required', `${path}.dir`, `světlo ${l.type} vyžaduje směr`);
    if (l.type !== 'sun' && l.range === undefined) c.err('shape.required', `${path}.range`, 'bodové a kuželové světlo vyžaduje dosah');
  });

  triggers.forEach((t, i) => {
    if (!t) return;
    const path = `${file}.triggers[${i}]`;
    cellRef(t.cell, `${path}.cell`);
    boxOk(t.min, t.max, path, c);
    ioCheck(t.io, path, ['enter', 'exit'], 'spouštěč');
  });

  // výchozí místa
  const players = spawns.filter((s) => s && s.kind === 'player');
  if (players.length !== 1) c.err('spawn.player', `${file}.spawns`, `level má mít právě jedno výchozí místo hráče, má ${players.length}`);
  let startCell = null;
  spawns.forEach((s, i) => {
    if (!s || !isVec(s.pos, 3)) return;
    const head = [s.pos[0], s.pos[1] + 0.9, s.pos[2]];
    const home = cells.find((cell) => cell?.bounds && isVec(cell.bounds.min, 3) && isVec(cell.bounds.max, 3) && inBounds(head, cell.bounds, 0));
    if (!home) c.err('spawn.outside', `${file}.spawns[${i}].pos`, 'výchozí místo není uvnitř žádné buňky');
    else if (s.kind === 'player') startCell = home.id;
    if (s.kind !== 'player' && s.what === undefined) c.err('shape.required', `${file}.spawns[${i}].what`, 'výchozí místo nepřítele nebo předmětu musí říct, co se tu rodí');
  });

  // dosažitelnost buněk od hráče
  if (startCell) {
    const seen = new Set([startCell]);
    const queue = [startCell];
    while (queue.length) for (const n of links.get(queue.shift()) || []) if (!seen.has(n)) (seen.add(n), queue.push(n));
    cells.forEach((cell, i) => {
      if (cell && !seen.has(cell.id) && !cell.isolated) c.err('level.unreachable', `${file}.cells[${i}]`, `buňka „${cell.id}“ není spojená portály s výchozím místem hráče`);
    });
  }

  for (const [idc, n] of perCell) {
    if (n.entities > LIMITS.warnEntitiesPerCell) c.warn('budget.cellEntities', `${file}.cells.${idc}`, `${n.entities} entit v buňce je nad doporučením ${LIMITS.warnEntitiesPerCell}`);
    if (n.brushes > LIMITS.warnBrushesPerCell) c.warn('budget.cellBrushes', `${file}.cells.${idc}`, `${n.brushes} kvádrů v buňce je nad doporučením ${LIMITS.warnBrushesPerCell}`);
  }

  return {
    id: L.id,
    cells: cells.length,
    portals: portals.length,
    brushes: brushes.length,
    brushTris: brushes.reduce((s, b) => s + ((b?.shape || 'box') === 'box' ? 12 : 8), 0),
    entities: entities.length,
    lights: lights.length,
    triggers: triggers.length,
    links: entities.reduce((s, e) => s + (Array.isArray(e?.io) ? e.io.length : 0), 0) + triggers.reduce((s, t) => s + (Array.isArray(t?.io) ? t.io.length : 0), 0),
  };
}

// ---- balík -----------------------------------------------------------------------------

/**
 * Zkontroluje načtený balík.
 * @param {{ manifest: object, materials?: object, prefabs: {file: string, data: object}[], levels: {file: string, data: object}[] }} pack
 * @returns {{ ok: boolean, errors: object[], warnings: object[], stats: object }}
 */
export function validatePack(pack) {
  const c = collector();
  const m = pack.manifest;
  checkShape(FORMATS.pack, m, 'pack.json', c);
  if (m && typeof m.version === 'string' && !/^\d+\.\d+\.\d+$/.test(m.version)) c.err('pack.version', 'pack.json.version', 'verze má mít tvar X.Y.Z');

  const assetPaths = new Set();
  (Array.isArray(m?.assets) ? m.assets : []).forEach((a, i) => {
    if (!a) return;
    if (assetPaths.has(a.path)) c.err('pack.dupeAsset', `pack.json.assets[${i}].path`, `soubor „${a.path}“ je v seznamu dvakrát`);
    assetPaths.add(a.path);
    if (typeof a.sha256 === 'string' && !/^[0-9a-f]{64}$/.test(a.sha256)) c.err('pack.sha', `pack.json.assets[${i}].sha256`, 'otisk má mít 64 šestnáctkových znaků malými písmeny');
    if (m.free && !FREE_LICENSES.includes(a.license)) c.err('license.notFree', `pack.json.assets[${i}].license`, `balík s free = true nesmí obsahovat licenci ${a.license}`);
    if (a.license === 'CC-BY-4.0' && !a.author) c.err('license.author', `pack.json.assets[${i}]`, 'licence CC-BY vyžaduje uvedení autora');
  });

  for (const e of pack.mergeErrors || []) c.err(e.code, 'pack.json.requires', e.msg);
  const matIds = pack.materials ? checkMaterials(m?.materials || 'materials.json', pack.materials, c, assetPaths, new Set(pack.foreignMaterials || [])) : new Set();
  if (m?.materials && !pack.materials) c.err('pack.missingFile', 'pack.json.materials', `soubor „${m.materials}“ se nenačetl`);

  const prefabById = new Map();
  for (const { file, data } of pack.prefabs || []) {
    if (data && typeof data.id === 'string') {
      if (prefabById.has(data.id)) c.err('pack.dupePrefab', file, `prefab „${data.id}“ je v balíku dvakrát`);
      prefabById.set(data.id, data);
    }
  }
  const prefabIds = new Set(prefabById.keys());
  for (const { file, data, from } of pack.prefabs || []) {
    if (from) continue; // prefab z balíku v requires: zkontrolován ve svém balíku, tady slouží jen odkazům
    checkPrefab(file, data, matIds, prefabIds, assetPaths, c);
    if (m?.free && data?.source && !FREE_LICENSES.includes(data.source.license)) c.err('license.notFree', `${file}.source.license`, `balík s free = true nesmí obsahovat licenci ${data.source.license}`);
  }

  // bez načtených balíků z requires je neznámý prefab jen varování; se spojeným balíkem (complete) chyba
  const external = !pack.complete && Array.isArray(m?.requires) && m.requires.length > 0;
  const levelStats = [];
  for (const { file, data } of pack.levels || []) {
    const s = checkLevel(file, data, matIds, prefabById, external, c);
    if (s) levelStats.push(s);
  }

  const errors = c.items.filter((x) => x.level === 'error');
  const warnings = c.items.filter((x) => x.level === 'warn');
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      xspace: XSPACE_VERSION,
      pack: m?.id,
      requires: Array.isArray(m?.requires) ? m.requires : [],
      materials: matIds.size,
      prefabs: prefabById.size,
      prefabTris: [...prefabById.values()].reduce((s, p) => s + (isNum(p.tris) ? p.tris : 0), 0),
      assets: assetPaths.size,
      levels: levelStats,
    },
  };
}
