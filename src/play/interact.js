// xPlay: interakce hráče se světem. Tři úrovně, všechny řízené daty prefabu (docs/01_ARCHITEKTURA.md, oddíl 5):
// 1. použít (paprsek z oka + klávesa), 2. manipulovat (držené tlačítko myši hýbe kloubem v jeho mezích),
// 3. klidný režim (kamera se ukotví podle station; zámek kurzoru zůstává a myš vede vlastní kurzor po obrazovce
//    ve světě, D-024).
// Paprsek jde proti kolizím v Rapieru, nikdy proti vykreslovaným sítím.

import { mat4Point } from '../xspace/index.js';
import { USE_RAY } from '../phys/phys.js';
import { MOVED, ARRIVED } from '../world/joints.js';
import { keyLabel } from './actions.js';
import { LOOK_DEG_PER_PX } from './input.js';
import { createTerminal, termPrint, termType, termKey, drawTerminal } from './terminal.js';

const RAD = Math.PI / 180;
const SCAN_EVERY = 4; // kroky mezi dotazy paprskem na to, co je pod zaměřovačem (30× za sekundu)
const MAX_RANGE = 6; // m; horní mez dosahu z formátu (interact.range)
const DEFAULT_RANGE = 1.6;
const SEAT_STEPS = 48; // 0,4 s: přejezd kamery do klidného režimu a zpět
const DEPTH_SHARE = 0.35; // pod tímto podílem pohybu úchopu napříč pohledem se táhne „k sobě a od sebe“
const DEPTH_GAIN = 2; // pohyb do hloubky hráč neodhadne, proto jde dvakrát rychleji než pohyb napříč
const MIN_ARM = 0.06; // m; kratší rameno úchopu otočného kloubu se nahradí (jinak by střed kola nešel otočit)

const smooth = (k) => k * k * (3 - 2 * k);

const CURSOR_SPAN = 700; // bodů myši přes celou šířku obrazovky terminálu při citlivosti 1

export function createInteract({ phys, player, input, behave, entities, render }) {
  let E = null;
  let target = null; // entita pod zaměřovačem v dosahu
  let prompt = '';
  let tick = 0;
  let manip = null; // { ent, j, node, local: [x, y, z] } úchop kloubu
  let seat = null; // { ent, phase: 'in' | 'on' | 'out', t, eye, yaw, pitch, fov, term }
  let blinkT = 0;
  let lastBlink = false;
  const terms = new Map(); // id entity → { term, screen, node, front, size }
  const eye = [0, 0, 0];
  const dir = [0, 0, -1];
  const hitP = [0, 0, 0];
  const grabP = [0, 0, 0];
  const axisW = [0, 0, 0];
  const stat = { uses: 0, scans: 0, grabs: 0 };
  const useKey = keyLabel('use');
  const grabKey = keyLabel('grab');
  /** Směr pohybu úchopu na obrazovce na jednotku kloubu (pro robota v testu: táhni myší tudy). */
  const screenDir = [0, 0];

  function scan() {
    stat.scans++;
    player.eye(eye, dir);
    const h = phys.raycast(eye[0], eye[1], eye[2], dir[0], dir[1], dir[2], MAX_RANGE, USE_RAY, player.collider);
    const ent = h && h.ref && h.ref.kind === 'entity' ? h.ref.ent : null;
    let ok = false;
    if (ent && ent.interact && ent.state.enabled) {
      // Dosah se měří od těla (osa postavy od nohou po oči), ne od očí: předmět na podlaze je od očí 1,6 m,
      // i když u něj hráč stojí. Kontrakt říká jen „dosah v metrech“ (návrh N-104).
      hitP[0] = eye[0] + dir[0] * h.dist;
      hitP[1] = eye[1] + dir[1] * h.dist;
      hitP[2] = eye[2] + dir[2] * h.dist;
      const feet = player.pos[1];
      const dy = hitP[1] > eye[1] ? hitP[1] - eye[1] : hitP[1] < feet ? feet - hitP[1] : 0;
      ok = Math.hypot(hitP[0] - eye[0], dy, hitP[2] - eye[2]) <= (ent.interact.range ?? DEFAULT_RANGE);
    }
    setTarget(ok ? ent : null);
    return ok ? h : null;
  }
  function setTarget(ent) {
    target = ent;
    const text = ent ? behave.prompt(ent) : '';
    if (!text) prompt = '';
    else if (ent.state.locked) prompt = text;
    else prompt = ent.interact.manipulate ? `[${useKey}] ${text} · ${grabKey}: táhni` : `[${useKey}] ${text}`;
  }

  // ---- manipulace: držené tlačítko myši hýbe kloubem
  function grab(h) {
    const j = behave.mainJoint(target);
    if (!j) return;
    const node = j.def.node;
    // úchop = bod zásahu, pokud paprsek trefil pohyblivý uzel; jinak střed jeho kolize
    const world = h.ref.node === node ? hitP : entities.center(target.id);
    manip = { ent: target, j, node, local: toLocal(target.nodeWorld[node], world), edge: edgeOf(j) };
    entities.setJoint(target, j, j.value, true);
    input.lookEnabled = false;
    screenDir[0] = screenDir[1] = 0;
    stat.grabs++;
    measure(); // směr tažení je známý hned po úchopu (HUD, robot v testu)
  }
  const edgeOf = (j) => (j.value <= j.def.min ? -1 : j.value >= j.def.max ? 1 : 0);

  /**
   * Spočítá, kudy na obrazovce a jak rychle se úchop hýbe na jednotku kloubu (stupeň nebo metr).
   * Výsledek: G.kx, G.ky = změna kloubu na bod myši vpravo a dolů; screenDir = směr myši, který kloub zvětšuje.
   */
  const G = { kx: 0, ky: 0 };
  function measure() {
    const { ent, j, node, local } = manip;
    const M = ent.nodeWorld[node];
    const P = pointInto(M, local, grabP);
    const A = rotateInto(M, j.def.axis, axisW); // osa kloubu je v prostoru uzlu a kloub sám ji nemění
    player.eye(eye, dir);
    // osy obrazovky ve světě: R vpravo, U = R × dopředu nahoru
    const yaw = player.yaw * RAD;
    const Rx = Math.cos(yaw);
    const Rz = -Math.sin(yaw);
    const Ux = -Rz * dir[1];
    const Uy = Rz * dir[0] - Rx * dir[2];
    const Uz = Rx * dir[1];
    // T = posun úchopu ve světě na jednotku kloubu
    let Tx = A[0];
    let Ty = A[1];
    let Tz = A[2];
    if (j.def.type === 'hinge') {
      let rx = P[0] - M[12];
      let ry = P[1] - M[13];
      let rz = P[2] - M[14];
      const along = rx * A[0] + ry * A[1] + rz * A[2];
      rx -= along * A[0];
      ry -= along * A[1];
      rz -= along * A[2];
      if (Math.hypot(rx, ry, rz) < MIN_ARM) {
        // úchop u osy (střed kola ventilu): náhradní rameno kolmo k ose směrem nahoru na obrazovce,
        // takže kolem otáčí prostý pohyb myši do strany; úchop za obvod chce pohyb po kružnici
        let k = Ux * A[0] + Uy * A[1] + Uz * A[2];
        rx = Ux - k * A[0];
        ry = Uy - k * A[1];
        rz = Uz - k * A[2];
        let len = Math.hypot(rx, ry, rz);
        if (len < 0.2) {
          k = Rx * A[0] + Rz * A[2];
          rx = Rx - k * A[0];
          ry = -k * A[1];
          rz = Rz - k * A[2];
          len = Math.hypot(rx, ry, rz);
        }
        const f = MIN_ARM / len;
        rx *= f;
        ry *= f;
        rz *= f;
      }
      Tx = (A[1] * rz - A[2] * ry) * RAD;
      Ty = (A[2] * rx - A[0] * rz) * RAD;
      Tz = (A[0] * ry - A[1] * rx) * RAD;
    }
    const dist = Math.hypot(P[0] - eye[0], P[1] - eye[1], P[2] - eye[2]);
    const perPx = Math.max(dist, 0.3) * LOOK_DEG_PER_PX * input.sensitivity * RAD; // metry na bod myši ve vzdálenosti úchopu
    const tr = Tx * Rx + Tz * Rz;
    const tu = Tx * Ux + Ty * Uy + Tz * Uz;
    const td = Tx * dir[0] + Ty * dir[1] + Tz * dir[2];
    const across = tr * tr + tu * tu;
    const len2 = across + td * td;
    if (len2 < 1e-14) {
      G.kx = G.ky = 0;
      return;
    }
    if (across >= DEPTH_SHARE * DEPTH_SHARE * len2) {
      // úchop se hýbe napříč pohledem: sleduje myš (průmět posunu myši na směr T v rovině obrazovky)
      G.kx = (tr * perPx) / across;
      G.ky = (-tu * perPx) / across; // myš dolů = záporný posun nahoru
    } else {
      // úchop se hýbe hlavně k hráči a od něj (zásuvka, křídlo dveří zepředu): myš nahoru = od sebe
      G.kx = 0;
      G.ky = (-Math.sign(td) * perPx * DEPTH_GAIN) / Math.sqrt(len2);
    }
    const n = Math.hypot(G.kx, G.ky) || 1;
    screenDir[0] = G.kx / n;
    screenDir[1] = G.ky / n;
  }
  function drag(I) {
    const { ent, j } = manip;
    if (!ent.state.enabled || ent.state.locked) return;
    measure();
    const dv = I.mx * G.kx + I.my * G.ky;
    if (!dv || !entities.setJoint(ent, j, j.value + dv, true)) return;
    // doraz na mez se hlásí hned (páka v krajní poloze sepne, i když ji hráč ještě drží)
    const edge = edgeOf(j);
    behave.onJoint(ent, j, edge && edge !== manip.edge ? MOVED | ARRIVED : MOVED);
    manip.edge = edge;
  }
  function drop() {
    const { ent, j, edge } = manip;
    manip = null;
    input.lookEnabled = !seat;
    entities.release(ent, j);
    // volný kloub po puštění zůstane stát a sám nic neohlásí: poslední hodnotu (ventil) dopoví tahle zpráva;
    // kloub s pružinou nebo zarážkami se ustálí sám a ohlásí to krok kloubu
    const d = j.def;
    if (!edge && !(d.spring > 0) && !d.detents?.length) behave.onJoint(ent, j, ARRIVED);
  }

  // ---- klidný režim: kamera ukotvená podle station
  function sit(ent) {
    const st = ent.interact.station;
    const e = mat4Point(ent.em, st.eye);
    const l = mat4Point(ent.em, st.look);
    const dx = l[0] - e[0];
    const dy = l[1] - e[1];
    const dz = l[2] - e[2];
    seat = { ent, phase: 'in', t: 0, eye: e, yaw: Math.atan2(-dx, -dz) / RAD, pitch: Math.atan2(dy, Math.hypot(dx, dz)) / RAD, fov: st.fov ?? render.baseFov, term: terms.get(ent.id) || null };
    player.frozen = true;
    player.viewOverride = true;
    input.lookEnabled = false;
    if (seat.term) {
      seat.term.term.active = true;
      seat.term.term.pointer = [0.5, 0.5]; // vlastní kurzor začíná uprostřed obrazovky
      seat.term.term.dirty = true;
    }
    setTarget(null);
    E.emit('interact:seated', ent.id);
  }

  /** Průsečík paprsku z ukotvené kamery s plochou obrazovky → [u, v] 0…1 (v dolů), nebo null mimo plochu. */
  function screenUv(s, t, nx, ny) {
    const tan = Math.tan((s.fov * RAD) / 2);
    const cy = Math.cos(s.yaw * RAD);
    const sy = Math.sin(s.yaw * RAD);
    const cp = Math.cos(s.pitch * RAD);
    const sp = Math.sin(s.pitch * RAD);
    const F = [-sy * cp, sp, -cy * cp];
    const R = [cy, 0, -sy];
    const U = [sy * sp, cp, cy * sp];
    const ax = nx * tan * render.aspect;
    const ay = ny * tan;
    const d = [F[0] + R[0] * ax + U[0] * ay, F[1] + R[1] * ax + U[1] * ay, F[2] + R[2] * ax + U[2] * ay];
    const M = s.ent.nodeWorld[t.node];
    // rovina obrazovky: bod C = uzel + osa Z · front, normála = osa Z uzlu
    const N = [M[8], M[9], M[10]];
    const C = [M[12] + N[0] * t.front, M[13] + N[1] * t.front, M[14] + N[2] * t.front];
    const denom = d[0] * N[0] + d[1] * N[1] + d[2] * N[2];
    if (Math.abs(denom) < 1e-6) return null;
    const k = ((C[0] - s.eye[0]) * N[0] + (C[1] - s.eye[1]) * N[1] + (C[2] - s.eye[2]) * N[2]) / denom;
    if (k <= 0) return null;
    const px = s.eye[0] + d[0] * k - C[0];
    const py = s.eye[1] + d[1] * k - C[1];
    const pz = s.eye[2] + d[2] * k - C[2];
    const u = (px * M[0] + py * M[1] + pz * M[2]) / t.size[0] + 0.5;
    const v = 0.5 - (px * M[4] + py * M[5] + pz * M[6]) / t.size[1];
    return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? [u, v] : null;
  }

  const sys = {
    name: 'interact',
    phase: 'sim',
    after: ['player'],
    events: ['interact:used', 'interact:denied', 'interact:seated', 'interact:left'],
    stat,
    get target() {
      return target;
    },
    /** Nápověda pro HUD; prázdný text = nic pod zaměřovačem. */
    get prompt() {
      return prompt;
    },
    get seated() {
      return !!seat;
    },
    get manipulating() {
      return !!manip;
    },
    init(engine) {
      E = engine;
    },

    load() {
      terms.clear();
      for (const ent of entities.list) {
        const sc = ent.comp.screen;
        if (!sc) continue;
        // Plocha obrazovky: střed uzlu, rovina XY, líc +Z, posazená těsně před nejpřednější díl uzlu.
        // Formát posun plochy neuvádí (návrh N-106).
        const front = Math.max(0, ...ent.prefab.parts.filter((p) => p.node === sc.node && p.max).map((p) => p.max[2])) + 0.001;
        const term = createTerminal(ent.prefab.title, sc.app);
        const screen = render.addScreen({ cell: ent.cell, matrix: ent.nodeWorld[sc.node], offset: front, size: sc.size, res: sc.res });
        terms.set(ent.id, { term, screen, node: sc.node, front, size: sc.size });
        screen.draw((ctx, w, h) => drawTerminal(ctx, w, h, term, false));
      }
    },
    unload() {
      terms.clear();
      manip = null;
      seat = null;
    },
    reset() {
      target = null;
      prompt = '';
      tick = 0;
      manip = null;
      seat = null;
      player.frozen = false;
      player.viewOverride = false;
      input.lookEnabled = true;
      render.setViewFov(null);
      stat.uses = stat.scans = stat.grabs = 0;
      for (const t of terms.values()) {
        t.term.lines.length = 0;
        t.term.input = '';
        t.term.active = false;
        t.term.pointer = null;
        t.term.dirty = true;
      }
    },

    step() {
      const I = input.intent;
      if (seat) {
        seat.t++;
        if (seat.phase === 'in' && seat.t >= SEAT_STEPS) seat.phase = 'on';
        else if (seat.phase === 'out' && seat.t >= SEAT_STEPS) {
          seat = null;
          player.frozen = false;
          player.viewOverride = false;
          input.lookEnabled = true;
          render.setViewFov(null);
        }
        return;
      }
      if (manip) {
        if (!I.grab) drop();
        else drag(I);
        return;
      }
      let h = null;
      if (I.use || I.grabPressed || ++tick % SCAN_EVERY === 0) h = scan();
      if (!target) return;
      if (I.use) {
        const r = behave.use(target);
        if (r === 'ok') {
          stat.uses++;
          E.emit('interact:used', target.id);
          if (target.interact.station && (target.kind === 'terminal' || target.kind === 'station')) {
            sit(target);
            return;
          }
        } else if (r === 'locked') E.emit('interact:denied', target.id);
        setTarget(target); // stav se mohl změnit (zamčeno, sebráno)
      } else if (I.grabPressed && h) {
        if (target.state.locked) E.emit('interact:denied', target.id);
        else if (target.interact.manipulate) grab(h);
      }
    },

    frame(real) {
      if (seat) {
        const k = smooth(Math.min(1, seat.t / SEAT_STEPS));
        const a = seat.phase === 'out' ? 1 - k : seat.phase === 'in' ? k : 1;
        player.eye(eye, dir);
        const dyaw = ((seat.yaw - player.yaw + 540) % 360) - 180;
        render.setView(eye[0] + (seat.eye[0] - eye[0]) * a, eye[1] + (seat.eye[1] - eye[1]) * a, eye[2] + (seat.eye[2] - eye[2]) * a, (player.yaw + dyaw * a) * RAD, (player.pitch + (seat.pitch - player.pitch) * a) * RAD);
        render.setViewFov(render.baseFov + (seat.fov - render.baseFov) * a);
      }
      // obrazovky: překreslit jen po změně, u aktivní navíc blikání kurzoru
      blinkT += real;
      const blink = blinkT % 1 < 0.5;
      for (const t of terms.values()) {
        if (t.term.dirty || (t.term.active && blink !== lastBlink)) t.screen.draw((ctx, w, h) => drawTerminal(ctx, w, h, t.term, blink));
      }
      lastBlink = blink;
    },

    // ---- klidný režim: vstup z aplikace (klávesnice a kurzor jdou mimo herní akce)
    /** Odejít od terminálu (šipka dolů nebo pravé tlačítko myši; Esc je všude pauza, D-024). */
    leave() {
      if (!seat || seat.phase === 'out') return;
      seat.phase = 'out';
      seat.t = 0;
      if (seat.term) {
        seat.term.term.active = false;
        seat.term.term.pointer = null;
        seat.term.term.dirty = true;
      }
      behave.emit(seat.ent, 'left');
      E.emit('interact:left', seat.ent.id);
    },
    /** Znak napsaný na klávesnici. */
    type(ch) {
      if (seat?.term && seat.phase === 'on') termType(seat.term.term, ch);
    },
    /** Enter nebo Backspace. Enter vyšle výstup command s napsaným textem. */
    key(key) {
      if (!seat?.term || seat.phase !== 'on') return;
      const cmd = termKey(seat.term.term, key);
      if (cmd !== null) behave.emit(seat.ent, 'command', cmd);
    },
    /**
     * Posun myši se zamčeným kurzorem (body myši, x vpravo, y dolů): vede vlastní kurzor po ploše obrazovky,
     * omezený jejím obdélníkem. Celá šířka obrazovky = CURSOR_SPAN bodů myši při citlivosti 1.
     */
    cursor(dx, dy) {
      if (!seat?.term || seat.phase !== 'on') return null;
      const t = seat.term;
      const p = t.term.pointer || (t.term.pointer = [0.5, 0.5]);
      const k = input.sensitivity / CURSOR_SPAN;
      p[0] = Math.min(1, Math.max(0, p[0] + dx * k));
      p[1] = Math.min(1, Math.max(0, p[1] + dy * k * (t.size[0] / t.size[1]))); // stejná rychlost ve světě oběma směry
      t.term.dirty = true;
      return p;
    },
    /** Kliknutí v místě vlastního kurzoru: vyšle command s textem 'click'. */
    click() {
      if (!seat?.term || seat.phase !== 'on' || !seat.term.term.pointer) return false;
      behave.emit(seat.ent, 'command', 'click');
      return true;
    },
    /**
     * Bez zámku kurzoru (prostředí, kde ho prohlížeč nedá): kurzor systému v souřadnicích obrazu −1…1 (x vpravo,
     * y nahoru) se promítne na plochu obrazovky terminálu; click = stisk tlačítka.
     */
    pointer(nx, ny, click = false) {
      if (!seat?.term || seat.phase !== 'on') return null;
      const t = seat.term;
      const uv = screenUv(seat, t, nx, ny);
      t.term.pointer = uv;
      t.term.dirty = true;
      if (click && uv) behave.emit(seat.ent, 'command', 'click');
      return uv;
    },
    /** Vstup print terminálu (volá chování entity). */
    print(ent, text) {
      const t = terms.get(ent.id);
      if (t) termPrint(t.term, text);
    },

    snapshot: () => ({}),
    restore() {
      sys.reset();
    },
    inspect(path) {
      switch (path[0]) {
        case 'target':
          return target ? target.id : null;
        case 'prompt':
          return prompt;
        case 'stat':
          return { ...stat };
        case 'seat':
          return seat ? { id: seat.ent.id, phase: seat.phase, eye: [...seat.eye], yaw: seat.yaw, pitch: seat.pitch, fov: seat.fov } : null;
        case 'manip':
          return manip ? { id: manip.ent.id, joint: manip.j.def.id, value: manip.j.value, screenDir: [...screenDir] } : null;
        case 'term': {
          const t = terms.get(path[1]);
          return t ? { lines: [...t.term.lines], input: t.term.input, active: t.term.active, pointer: t.term.pointer } : undefined;
        }
        default:
          return undefined;
      }
    },
  };
  return sys;
}

/** Bod ve světě → souřadnice v prostoru uzlu (matice uzlu je posun · otočení · rovnoměrné měřítko). */
function toLocal(M, p) {
  const s2 = M[0] * M[0] + M[1] * M[1] + M[2] * M[2] || 1;
  const x = p[0] - M[12];
  const y = p[1] - M[13];
  const z = p[2] - M[14];
  return [(x * M[0] + y * M[1] + z * M[2]) / s2, (x * M[4] + y * M[5] + z * M[6]) / s2, (x * M[8] + y * M[9] + z * M[10]) / s2];
}

/** Bod z prostoru uzlu do světa, zapsaný do out (bez alokace). */
function pointInto(M, p, out) {
  out[0] = M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12];
  out[1] = M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13];
  out[2] = M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14];
  return out;
}

/** Směr z prostoru uzlu do světa (jen otočení, výsledek jednotkový), zapsaný do out. */
function rotateInto(M, v, out) {
  const x = M[0] * v[0] + M[4] * v[1] + M[8] * v[2];
  const y = M[1] * v[0] + M[5] * v[1] + M[9] * v[2];
  const z = M[2] * v[0] + M[6] * v[1] + M[10] * v[2];
  const len = Math.hypot(x, y, z) || 1;
  out[0] = x / len;
  out[1] = y / len;
  out[2] = z / len;
  return out;
}
