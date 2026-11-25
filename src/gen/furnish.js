// xGen, vybavení: rozmístí prefaby sady podle jednoduchých pravidel a zapojí je.
//   dveře už stojí v portálech (build.js); tady: tlačítka u posuvných dveří, vypínač u dveří → svítidla,
//   světlo do středu stropu (nebo pochodně na zdi), nábytek ke zdem, věci na stoly, bedny do volné plochy.
// Rozměry prefabů se berou z katalogu (data sady), ne z čísel v kódu. Nic se nepostaví do zóny před otvorem,
// do rozsahu pohybu jiného kloubu ani mimo buňku.

import { entityMatrix, mat4Point, interactions } from '../xspace/index.js';
import { V, m, r4 } from './util.js';
import { RUN_X } from './kit.js';
import { boxM, boxesHit } from './build.js';
import { openingsConnected } from './passage.js';
import { passRadius } from './body.js';

const grow = (b, d) => ({ min: b.min.map((x) => x - d), max: b.max.map((x) => x + d) });
const inside = (b, outer, eps = 0.002) => [0, 1, 2].every((k) => b.min[k] >= outer.min[k] - eps && b.max[k] <= outer.max[k] + eps);
const stem = (prefab) => prefab.replace(/_\d+$/, '');

/** Čtyři zdi buňky z pohledu zevnitř: run = osa, podél které zeď běží, n = směr od zdi do místnosti. */
const wallsOf = (c) => [
  { run: 0, face: c.min[1], n: 1, a0: c.min[0], a1: c.max[0] },
  { run: 0, face: c.max[1], n: -1, a0: c.min[0], a1: c.max[0] },
  { run: 1, face: c.min[0], n: 1, a0: c.min[1], a1: c.max[1] },
  { run: 1, face: c.max[0], n: -1, a0: c.min[1], a1: c.max[1] },
];
/** Natočení prefabu zády ke zdi a znaménko, kterým se místní +X promítá do směru podél zdi. */
const facing = (wall) => (wall.run === RUN_X ? (wall.n > 0 ? [0, 1] : [180, -1]) : wall.n > 0 ? [90, -1] : [-90, 1]);

export function furnish(preset, P, plan, S, catalog, rng, opts = {}) {
  const { cells } = plan;
  const lights = [];
  const triggers = [];
  const spawns = [];
  const cellBox = cells.map((c) => ({ min: [m(c.min[0]), m(c.y0), m(c.min[1])], max: [m(c.max[0]), m(c.y1), m(c.max[1])] }));
  const lampsOf = cells.map(() => []);
  const attachOf = new Map(); // entita → její připojené entity
  const optional = new Map(); // volitelné entity (věci na deskách) → připojené; čte je rozpočet viditelného

  /** Zkusí postavit prefab; vrátí entitu, nebo null, když místo není volné. */
  function tryPlace(ci, prefab, pos, ry, o = {}) {
    const rest = catalog.worldBox(prefab, pos, ry, 'rest');
    if (!inside(rest, cellBox[ci])) return null;
    const occ = S.zones[ci];
    const fat = grow(rest, o.margin ?? 0.02);
    const mine = (z) => Boolean(o.host) && z.e === o.host; // věc na stole se smí dotýkat svého stolu
    if (occ.some((z) => !mine(z) && boxesHit(z, fat))) return null;
    const swept = catalog.worldBox(prefab, pos, ry, 'swept');
    const moves = swept.max.some((x, k) => x - rest.max[k] > 0.01) || swept.min.some((x, k) => rest.min[k] - x > 0.01);
    if (moves && (!inside(swept, cellBox[ci]) || occ.some((z) => z.kind === 'solid' && !mine(z) && boxesHit(z, swept)))) return null;
    const e = { id: S.eid(stem(prefab)), prefab, cell: S.meta[ci].id, pos: V(...pos), rot: V(0, ry, 0) };
    // svítidlo s vlastním vypínačem (stolní lampa) se zapojí samo na sebe; turnOn a turnOff jsou bezpečné i dvakrát
    const comp = catalog.get(prefab).components || {};
    if (comp.light && interactions(catalog.get(prefab)).some((x) => x.kind === 'switch')) e.io = [{ on: 'on', target: e.id, input: 'turnOn' }, { on: 'off', target: e.id, input: 'turnOff' }];
    occ.push({ ...rest, kind: 'solid', e });
    if (moves) occ.push({ ...swept, kind: 'zone', e });
    S.entities.push(e);
    // připojené prefaby (zásuvky): vlastní entity hned za rodičem; místo za ně drží obaly rodiče z katalogu
    const mtx = entityMatrix(e);
    const att = catalog.attachments(prefab).map((a) => ({ id: S.eid(stem(a.prefab)), prefab: a.prefab, cell: e.cell, pos: V(...mat4Point(mtx, a.pos).map(r4)), rot: V(0, ry + (a.ry || 0), 0) }));
    S.entities.push(...att);
    attachOf.set(e, att);
    return e;
  }

  /** Postaví prefab zády ke zdi tak, aby jeho nižší okraj podél zdi ležel na souřadnici low (cm). height = výška nad podlahou (cm) u nástěnných. */
  function againstWall(ci, wall, prefab, low, height = 0, o = {}) {
    const rb = catalog.restBox(prefab);
    const [ry, sgn] = facing(wall);
    const along = m(low) - (sgn > 0 ? rb.min[0] : -rb.max[0]);
    // odstup od zdi podle rozsahu pohybu: víko truhly se sklápí dozadu a musí se za ni vejít
    const back = Math.min(rb.min[2], catalog.sweptBox(prefab).min[2]);
    const normal = m(wall.face) + wall.n * ((height ? 0 : 0.02) - back);
    const y = m(cells[ci].y0 + height);
    return tryPlace(ci, prefab, wall.run === RUN_X ? [along, y, normal] : [normal, y, along], ry, o);
  }
  const widthCm = (prefab) => Math.ceil((catalog.restBox(prefab).max[0] - catalog.restBox(prefab).min[0]) * 100);
  const depthCm = (prefab) => Math.ceil((catalog.restBox(prefab).max[2] - catalog.restBox(prefab).min[2]) * 100);

  /** Věc na desce stolu nebo před ním: místní poloha vůči hostiteli. */
  function relative(ci, host, prefab, local, ryAdd = 0, o = {}) {
    const p = mat4Point(entityMatrix(host), local);
    return tryPlace(ci, prefab, p.map(r4), host.rot[1] + ryAdd, { host, margin: 0, ...o });
  }

  /**
   * Věci na desku hostitele zleva doprava podle šířek, se stejnými mezerami; co se nevejde, vynechá.
   * Výška desky: components.place.top, jinak source.params.top, jinak vršek obalu. Hloubka: source.params.deck = [z0, z1]
   * je volný pruh desky v prostoru prefabu (před nástavbou a policí); věc stojí zády u z0 a nesmí přečnívat z1.
   * Bez deck stojí věci na −2 cm (stoly z kit_base).
   */
  function dressTop(ci, host, list) {
    if (!list || !list.length) return;
    const pf = catalog.get(host.prefab);
    const rb = catalog.restBox(host.prefab);
    const pr = (pf.source && pf.source.params) || {};
    const topY = ((pf.components || {}).place || {}).top ?? pr.top ?? rb.max[1];
    const deck = pr.deck;
    const edge = 0.03;
    const span = rb.max[0] - rb.min[0] - 2 * edge;
    const items = [];
    let used = 0;
    for (const t of list) {
      const tb = catalog.restBox(t);
      const w = tb.max[0] - tb.min[0];
      if (used + w > span || (deck && tb.max[2] - tb.min[2] > deck[1] - deck[0] - 0.01)) continue;
      items.push([t, tb, w]);
      used += w;
    }
    const gap = (span - used) / (items.length + 1);
    let x = rb.min[0] + edge + gap;
    for (const [t, tb, w] of items) {
      const e = relative(ci, host, t, [x - tb.min[0], topY, deck ? deck[0] + 0.01 - tb.min[2] : -0.02]);
      // věc na desce je volitelná: když je z některé buňky vidět víc, než unese T460, generátor ji odebere (fitPVS)
      if (e) optional.set(e, attachOf.get(e));
      x += w + gap;
    }
  }
  /** Židle kolem hostitele: seats = [[x, z, natočení], …] v prostoru hostitele (m, stupně). */
  function seatsAround(ci, host, item) {
    for (const [x, z, ry] of item.seats || []) relative(ci, host, item.seat, [x, 0, z], ry, { margin: 0.02 });
  }

  /** Jedna položka fronty: prefab ke zdi a případně věci na něm, před ním a nad ním. */
  function placeItem(ci, wall, item, low) {
    const e = againstWall(ci, wall, item.p, low, item.h || 0);
    if (!e) return null;
    const rb = catalog.restBox(item.p);
    dressTop(ci, e, item.top);
    // židle patří ke stolu: jeho obal (včetně vysunuté zásuvky) jí nevadí, stojí mimo zásuvku (chairX)
    if (item.chair) relative(ci, e, item.chair, [item.chairX || 0, 0, rb.max[2] + 0.4], 180, { margin: 0.02 });
    seatsAround(ci, e, item);
    if (item.stack) relative(ci, e, item.stack, [0, rb.max[1], 0], rng.int(-25, 25));
    if (item.over) againstWall(ci, wall, item.over.p, low + Math.round((widthCm(item.p) - widthCm(item.over.p)) / 2), item.over.h, { host: e });
    return e;
  }

  /** Projde zdi v náhodném pořadí a skládá k nim frontu položek vedle sebe. */
  function packWalls(ci, queue, maxDepth) {
    const c = cells[ci];
    const items = queue.filter((it) => it.h || depthCm(it.p) <= maxDepth);
    for (const wall of rng.shuffle(wallsOf(c))) {
      let cur = wall.a0 + rng.int(1, 4) * 10;
      let guard = 0;
      while (items.length && cur < wall.a1 - 20 && guard++ < 200) {
        const k = items.findIndex((it, i) => i < 3 && cur + widthCm(it.p) <= wall.a1 - 5);
        if (k < 0) break;
        const item = items[k];
        const w = widthCm(item.p);
        const chain = item.chain || 1;
        let placed = 0;
        for (let n = 0; n < chain && cur + w <= wall.a1 - 5; n++) {
          if (!placeItem(ci, wall, item, cur)) break;
          placed++;
          cur += w;
        }
        if (placed) {
          items.splice(k, 1);
          cur += rng.int(1, 8) * 5;
        } else cur += 20;
      }
    }
  }

  /** Volně stojící věci v ploše místnosti, s uličkou kolem. */
  function scatter(ci, list) {
    const c = cells[ci];
    for (const item of list) {
      for (let t = 0; t < 12; t++) {
        const x = rng.int(c.min[0] + 110, Math.max(c.min[0] + 110, c.max[0] - 110));
        const z = rng.int(c.min[1] + 110, Math.max(c.min[1] + 110, c.max[1] - 110));
        const e = tryPlace(ci, item.p, [m(x), m(c.y0), m(z)], item.yaw === false ? (c.w >= c.d ? 0 : 90) : rng.int(0, 7) * 45, { margin: item.aisle ?? 0.45 });
        if (!e) continue;
        if (item.stack) relative(ci, e, item.stack, [0, catalog.restBox(item.p).max[1], 0], rng.int(-25, 25));
        dressTop(ci, e, item.top);
        seatsAround(ci, e, item);
        break;
      }
    }
  }

  /**
   * Řady skříní nebo stolů v ploše místnosti podél delší osy (serverovna, open space). R.items se opakují dokola.
   * R.pairs: dvojice řad zády k sobě (horká ulička uvnitř skříní, stoly čelem k sobě), jinak jednotlivé řady. Mezi řadami
   * ulička R.aisle, u zdí volno R.wall a na koncích R.end (cm). R.over: prefab ze stropu nad osou řady (kabelový žlab).
   * R.seat a R.seats: židle ke každému kusu řady (místo pro ně 70 cm na každé straně). R.tops: seznam desek, které se
   * střídají dokola. Seznam R je řada možností; platí první, která se do místnosti vejde. @returns počet postavených kusů
   */
  function rowsIn(ci, list) {
    const c = cells[ci];
    const run = c.w >= c.d ? RUN_X : 1 - RUN_X;
    const along = run === RUN_X ? [c.min[0], c.max[0]] : [c.min[1], c.max[1]];
    const across = run === RUN_X ? [c.min[1], c.max[1]] : [c.min[0], c.max[0]];
    for (const R of [].concat(list)) {
      const dep = Math.max(...R.items.map(depthCm)) + 2;
      const seat = R.seats ? 70 : 0;
      const band = (R.pairs ? 2 : 1) * dep + 2 * seat;
      const aisle = R.aisle ?? 120;
      const end = R.end ?? 110;
      const count = Math.max(0, Math.floor((across[1] - across[0] - 2 * (R.wall ?? 130) + aisle) / (band + aisle)));
      if (!count || Math.min(...R.items.map(widthCm)) > along[1] - along[0] - 2 * end) continue;
      let s = Math.round((across[0] + across[1] - (count * band + (count - 1) * aisle)) / 2);
      let k = 0;
      let placed = 0;
      for (let r = 0; r < count; r++) {
        const line = s + seat + (R.pairs ? dep : 0);
        for (const n of R.pairs ? [-1, 1] : [1]) {
          const wall = { run, face: line, n, a0: along[0], a1: along[1] };
          for (let cur = along[0] + end; ; ) {
            const id = R.items[k % R.items.length];
            const w = widthCm(id);
            if (cur + w > along[1] - end) break;
            const e = againstWall(ci, wall, id, cur, 0);
            if (e) {
              if (R.tops) dressTop(ci, e, R.tops[k % R.tops.length]);
              if (R.seat) seatsAround(ci, e, R);
              k++;
              placed++;
            }
            cur += w;
          }
        }
        if (R.over) {
          const w = widthCm(R.over);
          const mid = R.pairs ? line : line + Math.round(dep / 2);
          for (let cur = along[0] + end; cur + w <= along[1] - end; cur += w) {
            const a = cur + w / 2;
            tryPlace(ci, R.over, run === RUN_X ? [m(a), m(c.y1), m(mid)] : [m(mid), m(c.y1), m(a)], run === RUN_X ? 0 : 90, { margin: 0 });
          }
        }
        s += band + aisle;
      }
      if (placed) return placed;
    }
    return 0;
  }

  /** Věci na strop (kamera, přístupový bod Wi-Fi): náhodné místo aspoň půl metru od zdí, mimo svítidla. */
  function ceilingItems(ci, list) {
    const c = cells[ci];
    for (const id of list) {
      for (let t = 0; t < 10; t++) {
        const x = rng.int(c.min[0] + 50, Math.max(c.min[0] + 50, c.max[0] - 50));
        const z = rng.int(c.min[1] + 50, Math.max(c.min[1] + 50, c.max[1] - 50));
        if (tryPlace(ci, id, [m(x), m(c.y1), m(z)], 0, { margin: 0.05 })) break;
      }
    }
  }

  // ---- 1) výchozí místo hráče: uprostřed startovní buňky, čelem k nejbližšímu otvoru
  {
    const c = cells[plan.start];
    const [x, z] = [(c.min[0] + c.max[0]) / 2, (c.min[1] + c.max[1]) / 2];
    S.zones[plan.start].push(boxM(x - 50, c.y0, z - 50, x + 50, c.y0 + 190, z + 50, 'zone'));
    const side = S.sides[plan.start][0];
    let yaw = 0;
    if (side) {
      const along = (side.c0 + side.c1) / 2;
      const [dx, dz] = side.run === RUN_X ? [along - x, side.face - z] : [side.face - x, along - z];
      yaw = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? -90 : 90) : dz > 0 ? 180 : 0;
    }
    spawns.push({ id: 'sp_player', kind: 'player', pos: V(m(x), m(c.y0), m(z)), yaw });
  }

  // ---- 2) tlačítka u posuvných dveří (z obou stran, na straně kapsy)
  for (const o of S.openings) {
    if (!o.style.slide) continue;
    for (const [X, face, n] of [[o.A, o.s.b0, -1], [o.B, o.s.b1, 1]]) {
      const wall = { run: o.s.run, face, n, a0: X.min[o.s.run], a1: X.max[o.s.run] };
      const low = o.pocket === 'hi' ? o.c1 + 22 : o.c0 - 22 - widthCm(preset.button);
      const y = o.sill - X.y0 + 120;
      const e = againstWall(X.i, wall, preset.button, low, y);
      if (e) e.io = [{ on: 'pressed', target: o.doorIds[0], input: 'toggle' }];
    }
  }

  // ---- 3) světla: pevná (zapékají se) a svítidla sady (vypínatelný přídavek, nejvýš čtyři na buňku)
  cells.forEach((c, ci) => {
    const L = preset.lighting(c);
    if (!L) return;
    const id = S.meta[ci].id;
    const addLight = (x, y, z, cd, extra = {}) => lights.push({ id: `l_${String(lights.length + 1).padStart(3, '0')}`, cell: id, type: 'point', pos: V(m(x), m(y), m(z)), color: L.color, intensity: cd, range: L.range, cast: true, ...extra });
    if (L.mount === 'wall') {
      // pochodně: zkoušej místa po obvodu, pevné světlo kousek před pochodní
      const want = Math.max(1, Math.min(L.max || 3, Math.round(Math.max(c.w, c.d) / L.spacing)));
      let got = 0;
      for (const wall of rng.shuffle(wallsOf(c))) {
        for (let t = 0; t < 6 && got < want; t++) {
          const low = rng.int(wall.a0 + 30, Math.max(wall.a0 + 30, wall.a1 - 50));
          const e = againstWall(ci, wall, L.fixture, low, L.height);
          if (!e) continue;
          got++;
          lampsOf[ci].push(e);
          const [px, py, pz] = [e.pos[0] * 100, e.pos[1] * 100, e.pos[2] * 100];
          const out = 35 * wall.n;
          addLight(wall.run === RUN_X ? px : px + out, py + 45, wall.run === RUN_X ? pz + out : pz, L.cd);
          break;
        }
      }
      if (!got && L.fallback) addLight((c.min[0] + c.max[0]) / 2, c.y1 - 30, (c.min[1] + c.max[1]) / 2, L.cd * 0.6);
      return;
    }
    if (L.perFloor && c.tall) {
      // vysoká hala přes víc podlaží: řada světel nad každým podlažím (strop je až nad posledním)
      const longX0 = c.w >= c.d;
      const n = Math.max(1, Math.round(Math.max(c.w, c.d) / L.spacing));
      for (const y of plan.floorY) {
        for (let i = 0; i < n; i++) {
          const a = (i + 0.5) / n;
          addLight(Math.round(longX0 ? c.min[0] + c.w * a : (c.min[0] + c.max[0]) / 2), y + L.perFloor, Math.round(longX0 ? (c.min[1] + c.max[1]) / 2 : c.min[1] + c.d * a), L.cd);
        }
      }
      return;
    }
    const longX = c.w >= c.d;
    const nLong = Math.max(1, Math.round(Math.max(c.w, c.d) / L.spacing));
    const nShort = Math.min(c.w, c.d) >= L.spacing * 1.6 ? 2 : 1;
    let fixtures = 0;
    for (let i = 0; i < nLong; i++) {
      for (let j = 0; j < nShort; j++) {
        const a = (i + 0.5) / nLong;
        const s = (j + 0.5) / nShort;
        const x = Math.round(c.min[0] + c.w * (longX ? a : s));
        const z = Math.round(c.min[1] + c.d * (longX ? s : a));
        addLight(x, c.y1 - 30, z, L.cd);
        if (L.fixture && fixtures < 4) {
          const e = tryPlace(ci, L.fixture, [m(x), m(c.y1), m(z)], longX ? 0 : 90, { margin: 0 });
          if (e) {
            fixtures++;
            lampsOf[ci].push(e);
          }
        }
      }
    }
  });

  // ---- 4) vypínač u dveří → svítidla místnosti
  cells.forEach((c, ci) => {
    const L = preset.lighting(c);
    if (!L || !L.switch || !lampsOf[ci].length) return;
    const sides = [...S.sides[ci]].sort((p, q) => q.o.doorIds.length - p.o.doorIds.length);
    const sw = widthCm(L.switch);
    for (const side of sides) {
      const wall = { run: side.run, face: side.face, n: side.n, a0: c.min[side.run], a1: c.max[side.run] };
      const e = againstWall(ci, wall, L.switch, side.c1 + 20, side.sill - c.y0 + 130) || againstWall(ci, wall, L.switch, side.c0 - 20 - sw, side.sill - c.y0 + 130);
      if (!e) continue;
      e.io = lampsOf[ci].flatMap((l) => [{ on: 'on', target: l.id, input: 'turnOn' }, { on: 'off', target: l.id, input: 'turnOff' }]);
      break;
    }
  });

  // ---- 5) nábytek ke zdem a věci do plochy
  //      Když by nábytek zatarasil cestu mezi otvory místnosti, ubírá se od naposledy postaveného kusu.
  const walkR = passRadius(P.body); // kapsle hráče s odstupem kontroléru a rezervou; ne číslo v kódu
  const blocksWay = (z) => z.kind === 'solid' && !z.steps && (!z.e || (catalog.get(z.e.prefab).colliders || []).length > 0);
  const passable = (ci) => S.hall && S.hall.cell === ci ? true : openingsConnected(cells[ci], S.sides[ci], S.zones[ci].filter(blocksWay), walkR);
  cells.forEach((c, ci) => {
    const plan2 = preset.furniture(c, rng, catalog);
    if (!plan2) return;
    const before = S.entities.length;
    if (plan2.rows && plan2.rowsFirst) rowsIn(ci, plan2.rows);
    packWalls(ci, plan2.walls || [], plan2.maxDepth ?? 90);
    if (plan2.rows && !plan2.rowsFirst) rowsIn(ci, plan2.rows);
    scatter(ci, plan2.center || []);
    ceilingItems(ci, plan2.ceiling || []);
    while (S.entities.length > before && !passable(ci)) {
      const gone = S.entities.pop();
      S.zones[ci] = S.zones[ci].filter((z) => z.e !== gone);
    }
    // tlačítko bez úkolu ovládá svítidla své místnosti
    for (const e of S.entities.slice(before)) {
      if (interactions(catalog.get(e.prefab)).some((x) => x.kind === 'button') && !e.io && lampsOf[ci].length) e.io = lampsOf[ci].map((l) => ({ on: 'pressed', target: l.id, input: 'toggle' }));
    }
  });

  // ---- 6) hádanka: zamčená místnost na konci větve a páka jinde (jen na přání)
  if (opts.puzzle) {
    const degree = cells.map((_, i) => S.sides[i].length);
    const dist = distances(cells.length, S.openings, plan.start);
    const vault = cells
      .filter((c) => c.kind === 'room' && c.i !== plan.start && degree[c.i] === 1 && S.sides[c.i][0].o.doorIds.length === 1)
      .sort((p, q) => dist[q.i] - dist[p.i] || p.i - q.i)[0];
    if (vault) {
      const o = S.sides[vault.i][0].o;
      const door = S.entities.find((e) => e.id === o.doorIds[0]);
      const others = cells.filter((c) => c.i !== vault.i && c.kind !== 'corridor' && c.i !== plan.start).sort((p, q) => dist[p.i] - dist[q.i]);
      let lever = null;
      for (const c of rng.shuffle(others.slice(0, 8))) {
        for (const wall of rng.shuffle(wallsOf(c))) {
          lever = againstWall(c.i, wall, preset.lever, rng.int(wall.a0 + 40, Math.max(wall.a0 + 40, wall.a1 - 60)), 140);
          if (lever) break;
        }
        if (lever) break;
      }
      if (lever) {
        door.props = { locked: true };
        lever.io = [{ on: 'on', target: door.id, input: 'unlock' }, { on: 'on', target: door.id, input: 'open', delay: 0.5 }];
        const b = cellBox[vault.i];
        triggers.push({ id: 't_goal', cell: S.meta[vault.i].id, min: V(b.min[0] + 0.3, b.min[1], b.min[2] + 0.3), max: V(b.max[0] - 0.3, b.min[1] + 2, b.max[2] - 0.3), once: true, io: [{ on: 'enter', target: '@level', input: 'complete' }] });
      }
    }
  }

  // ---- 7) kontrolní bod u vstupu do největší buňky a místa pro nepřátele
  {
    const big = [...cells].filter((c) => c.i !== plan.start).sort((p, q) => q.area - p.area || p.i - q.i)[0];
    if (big) {
      const b = cellBox[big.i];
      const cx = (b.min[0] + b.max[0]) / 2;
      const cz = (b.min[2] + b.max[2]) / 2;
      triggers.push({ id: 't_checkpoint', cell: S.meta[big.i].id, min: V(cx - 1.5, b.min[1], cz - 1.5), max: V(cx + 1.5, b.min[1] + 2.2, cz + 1.5), once: true, io: [{ on: 'enter', target: '@level', input: 'checkpoint' }] });
    }
    let n = 0;
    for (const c of cells) {
      if (!preset.enemy || !preset.enemy(c) || c.i === plan.start || n >= 4) continue;
      for (let t = 0; t < 10; t++) {
        const x = rng.int(c.min[0] + 100, c.max[0] - 100);
        const z = rng.int(c.min[1] + 100, c.max[1] - 100);
        const spot = boxM(x - 45, c.y0, z - 45, x + 45, c.y0 + 190, z + 45, 'zone');
        if (S.zones[c.i].some((q) => boxesHit(q, spot))) continue;
        S.zones[c.i].push(spot);
        spawns.push({ id: `sp_enemy_${++n}`, kind: 'enemy', pos: V(m(x), m(c.y0), m(z)), yaw: rng.int(0, 3) * 90, what: 'dummy' });
        break;
      }
    }
  }
  return { lights, triggers, spawns, optional };
}

/** Vzdálenost buněk od startu v počtu otvorů. */
export function distances(count, openings, start) {
  const adj = Array.from({ length: count }, () => []);
  for (const o of openings) {
    adj[o.A.i].push(o.B.i);
    adj[o.B.i].push(o.A.i);
  }
  const dist = new Array(count).fill(Infinity);
  dist[start] = 0;
  const queue = [start];
  while (queue.length) {
    const i = queue.shift();
    for (const j of adj[i]) {
      if (dist[j] === Infinity) {
        dist[j] = dist[i] + 1;
        queue.push(j);
      }
    }
  }
  return dist;
}
