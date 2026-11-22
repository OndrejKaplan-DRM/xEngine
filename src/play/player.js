// xPlay: hráč. Tělo je kinematická kapsle s kontrolérem postavy v Rapieru; řidičem je záměr ze systému input
// (klávesnice, test, později záznam). Profil pohybu jsou data (profiles.js) a jde přepnout za běhu.
// Kamera jsou dvě čísla: yaw a pitch ve stupních, pořadí otočení YXZ, pitch omezený na ±89° (invariant F4).

import { friction, accelerate, clipVelocity } from './move.js';
import { PLAYER_GROUPS, SIGHT_RAY } from '../phys/phys.js';

const RAD = Math.PI / 180;
const PITCH_MAX = 89;
const STEP_SMOOTH = 8; // 1/s: jak rychle kamera dožene skok nohou na schodu
// Rychlost do zdi se neodebírá celá: kontrolér Rapieru 0.21 vystoupí na schod jen při vodorovném posunu aspoň
// asi 7 mm na krok (změřeno: 0,75 m/s nestačí, 0,9 m/s ano). Kdyby se rychlost o čelo schodu vynulovala,
// postava by ze stoje u schodu nikdy nevyšla. Tolik m/s tedy smí „tlačit“ do zdi.
const WALL_KEEP = 1.5;

export function createPlayer({ phys, world, render, input, session }) {
  let ch = null; // { body, col, cc, halfHeight }
  let P = null; // platný profil
  const pos = [0, 0, 0]; // nohy; drží se tady, ne ve fyzice (translation() platí až po kroku)
  const prev = [0, 0, 0];
  const vel = [0, 0, 0];
  const want = { x: 0, y: 0, z: 0 };
  const got = { x: 0, y: 0, z: 0 };
  const coll = new phys.RAPIER.CharacterCollision();
  const tmp = { x: 0, y: 0, z: 0 };
  let yaw = 0;
  let pitch = 0;
  let grounded = false;
  let eyeDrop = 0; // o kolik je kamera pod očima po výstupu na schod (dobíhá k nule)
  let frozen = false; // klidný režim: tělo stojí, pohled řídí někdo jiný
  const stat = { airSteps: 0, jumps: 0, topSpeed: 0 };

  function place(x, y, z) {
    pos[0] = prev[0] = x;
    pos[1] = prev[1] = y;
    pos[2] = prev[2] = z;
    if (ch) {
      const c = phys.vec(x, y + ch.halfHeight, z);
      ch.body.setTranslation(c, true);
      ch.body.setNextKinematicTranslation(c);
    }
    eyeDrop = 0;
  }
  function spawn() {
    const sp = world.playerSpawn();
    place(sp.pos[0], sp.pos[1], sp.pos[2]);
    yaw = sp.yaw || 0;
    pitch = 0;
    vel[0] = vel[1] = vel[2] = 0;
    grounded = false;
    frozen = false;
    Object.assign(stat, { airSteps: 0, jumps: 0, topSpeed: 0 });
  }
  function build() {
    if (ch) phys.removeCharacter(ch);
    P = session.profile;
    phys.setGravity(P.gravity);
    ch = phys.addCharacter(pos[0], pos[1], pos[2], P);
  }
  function publish() {
    const a = world.actor;
    a.min[0] = pos[0] - P.radius;
    a.min[1] = pos[1];
    a.min[2] = pos[2] - P.radius;
    a.max[0] = pos[0] + P.radius;
    a.max[1] = pos[1] + P.height;
    a.max[2] = pos[2] + P.radius;
    a.active = true;
  }

  const sys = {
    name: 'player',
    phase: 'sim',
    events: ['player:jumped', 'player:landed'],
    pos,
    vel,
    stat,
    get yaw() {
      return yaw;
    },
    get pitch() {
      return pitch;
    },
    get grounded() {
      return grounded;
    },
    get profile() {
      return P;
    },
    get eyeHeight() {
      return P.eye;
    },
    /** Klidný režim: tělo stojí a nečte vstup pohybu ani pohledu. */
    set frozen(v) {
      frozen = v;
      if (v) vel[0] = vel[1] = vel[2] = 0;
    },
    get frozen() {
      return frozen;
    },

    load() {
      P = session.profile;
      const sp = world.playerSpawn();
      pos[0] = sp.pos[0];
      pos[1] = sp.pos[1];
      pos[2] = sp.pos[2];
      ch = null;
      build();
      spawn();
      publish();
    },
    unload() {
      ch = null; // svět fyziky zaniká celý
    },
    reset() {
      if (session.profile !== P) build();
      spawn();
      publish();
    },

    /** Přenese hráče (vývojářský nástroj a testy). Rychlost se nuluje. */
    teleport(x, y, z, yawDeg, pitchDeg) {
      place(x, y, z);
      vel[0] = vel[1] = vel[2] = 0;
      grounded = false;
      if (yawDeg !== undefined) yaw = yawDeg;
      if (pitchDeg !== undefined) pitch = pitchDeg;
      publish();
    },
    setLook(yawDeg, pitchDeg) {
      yaw = yawDeg;
      pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, pitchDeg));
    },
    /** Oko a směr pohledu do předaných polí (pro paprsek „použít“). */
    eye(outPos, outDir) {
      outPos[0] = pos[0];
      outPos[1] = pos[1] + P.eye;
      outPos[2] = pos[2];
      const cp = Math.cos(pitch * RAD);
      outDir[0] = -Math.sin(yaw * RAD) * cp;
      outDir[1] = Math.sin(pitch * RAD);
      outDir[2] = -Math.cos(yaw * RAD) * cp;
    },
    get collider() {
      return ch?.col || null;
    },

    step(dt) {
      if (session.profile !== P) build(); // přepnutí profilu za běhu (vývojářský režim)
      const I = input.intent;
      prev[0] = pos[0];
      prev[1] = pos[1];
      prev[2] = pos[2];
      if (frozen) return;

      // pohled: posun myši se nenásobí dt
      yaw += I.yaw;
      if (yaw > 180) yaw -= 360;
      else if (yaw < -180) yaw += 360;
      pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, pitch + I.pitch));

      // směr přání ve světě: yaw 0 = pohled do −Z, kladný yaw = doleva
      const s = Math.sin(yaw * RAD);
      const c = Math.cos(yaw * RAD);
      let wx = -s * I.fwd + c * I.side;
      let wz = -c * I.fwd - s * I.side;
      const wl = Math.hypot(wx, wz);
      if (wl > 0) {
        wx /= wl;
        wz /= wl;
      }
      const wishSpeed = wl > 0 ? P.maxSpeed : 0;

      // skok: v kroku výskoku se tření nepočítá (proto série výskoků drží rychlost)
      let jumped = false;
      if (grounded && (P.jumpHold ? I.jump : I.jumpPressed)) {
        vel[1] = P.jumpSpeed;
        grounded = false;
        jumped = true;
        stat.jumps++;
      }
      if (grounded) {
        friction(vel, P, dt);
        accelerate(vel, wx, wz, wishSpeed, P.accel, dt);
      } else {
        accelerate(vel, wx, wz, P.airCap === null ? wishSpeed : Math.min(wishSpeed, P.airCap), P.airAccel, dt);
        stat.airSteps++;
      }
      vel[1] -= P.gravity * dt;

      // kolize, schody a skluz: kontrolér postavy
      want.x = vel[0] * dt;
      want.y = vel[1] * dt;
      want.z = vel[2] * dt;
      ch.cc.computeColliderMovement(ch.col, want, undefined, PLAYER_GROUPS);
      ch.cc.computedMovement(got);
      const touching = ch.cc.computedGrounded();

      // zem, po které se dá chodit = dotyk s plochou, jejíž normála míří dost nahoru
      let floorNy = -1;
      let edge = false; // dotyk s něčím šikmým, co není podlaha ani zeď
      const n = ch.cc.numComputedCollisions();
      for (let i = 0; i < n; i++) {
        const k = ch.cc.computedCollision(i, coll);
        if (!k) continue;
        const ny = k.normal1.y;
        if (ny > floorNy) floorNy = ny;
        if (ny > 0.05 && ny < P.walkNormal) edge = true;
      }
      const wasGrounded = grounded;
      let support = touching && (n === 0 || floorNy >= P.walkNormal);
      let steep = false;
      if (!support && edge && !jumped && vel[1] <= 0) {
        // Kapsle se o hranu schodu opírá zaoblením a normála hrany pak vypadá jako strmý svah. Co je pod nohama
        // doopravdy, řekne paprsek dolů ze středu spodní polokoule: schůdná plocha = hrana schodu, šikmá = svah.
        const h = phys.raycast(pos[0] + got.x, pos[1] + got.y + P.radius, pos[2] + got.z, 0, -1, 0, P.radius + P.stepHeight + 0.1, SIGHT_RAY);
        if (h && h.ny >= P.walkNormal) support = true;
        else if (h) {
          steep = true;
          clipVelocity(vel, h.nx, h.ny, h.nz); // strmý svah: rychlost sklouzne po ploše
        }
      }
      grounded = !jumped && support;

      const stepped = got.y > 0.004 && want.y <= 0; // výstup na schod: náraz do jeho čela rychlost nebere
      for (let i = 0; i < n; i++) {
        const k = ch.cc.computedCollision(i, coll);
        if (!k) continue;
        const nx = k.normal1.x;
        const ny = k.normal1.y;
        const nz = k.normal1.z;
        if (ny >= P.walkNormal) continue; // podlaha: svislou rychlost srovná stav „na zemi“ níž
        if (ny < -0.5) clipVelocity(vel, nx, ny, nz); // strop
        else if (!stepped && !steep) {
          // zeď nebo čelo schodu: jen vodorovně a jen to, co přesahuje WALL_KEEP
          const hl = Math.hypot(nx, nz);
          if (hl < 1e-4) continue;
          const hx = nx / hl;
          const hz = nz / hl;
          const into = vel[0] * hx + vel[2] * hz;
          if (into < -WALL_KEEP) {
            vel[0] -= hx * (into + WALL_KEEP);
            vel[2] -= hz * (into + WALL_KEEP);
          }
        }
      }
      if (grounded) {
        if (!wasGrounded) E?.emit('player:landed', vel[1]);
        vel[1] = 0;
      }
      if (jumped) E?.emit('player:jumped', P.jumpSpeed);

      const dy = got.y;
      pos[0] += got.x;
      pos[1] += got.y;
      pos[2] += got.z;
      tmp.x = pos[0];
      tmp.y = pos[1] + ch.halfHeight;
      tmp.z = pos[2];
      ch.body.setNextKinematicTranslation(tmp);

      // schod: nohy skočí nahoru, kamera dobíhá plynule
      if (grounded && wasGrounded && dy > 0.02) eyeDrop = Math.min(eyeDrop + dy, P.stepHeight);
      if (eyeDrop > 0) eyeDrop = Math.max(0, eyeDrop - Math.max(eyeDrop * STEP_SMOOTH, 0.4) * dt);

      const sp = Math.hypot(vel[0], vel[2]);
      if (sp > stat.topSpeed) stat.topSpeed = sp;
      publish();
    },

    frame(real, alpha) {
      if (sys.viewOverride) return; // klidný režim: kameru drží někdo jiný
      const x = prev[0] + (pos[0] - prev[0]) * alpha;
      const y = prev[1] + (pos[1] - prev[1]) * alpha;
      const z = prev[2] + (pos[2] - prev[2]) * alpha;
      render.setView(x, y + P.eye - eyeDrop, z, yaw * RAD, pitch * RAD);
    },
    viewOverride: false,

    snapshot() {
      return { pos: [...pos], vel: [...vel], yaw, pitch, grounded, eyeDrop };
    },
    restore(d) {
      place(d.pos[0], d.pos[1], d.pos[2]);
      vel[0] = d.vel[0];
      vel[1] = d.vel[1];
      vel[2] = d.vel[2];
      yaw = d.yaw;
      pitch = d.pitch;
      grounded = d.grounded;
      eyeDrop = d.eyeDrop || 0;
      publish();
    },

    inspect(path) {
      switch (path[0]) {
        case 'pos':
          return [...pos];
        case 'vel':
          return [...vel];
        case 'speed':
          return Math.hypot(vel[0], vel[2]);
        case 'grounded':
          return grounded;
        case 'yaw':
          return yaw;
        case 'pitch':
          return pitch;
        case 'profile':
          return P.id;
        case 'stat':
          return { ...stat };
        case 'cell':
          return world.cellAt(pos)?.id;
        default:
          return undefined;
      }
    },
  };

  let E = null;
  sys.init = (engine) => {
    E = engine;
  };
  return sys;
}
