// xPhys: jediná fyzikální autorita (Rapier). Kolize, paprsky, postava i tuhá tělesa jdou jen tudy;
// vedle Rapieru není Octree ani vlastní kolizní mřížka. Fáze 'physics': v kroku se tu děje jen world.step().
// Svět fyziky patří levelu: open() ho založí, close() uvolní. Kontrakt: docs/02_KONTRAKTY.md.

import RAPIER from '@dimforge/rapier3d-compat';
import { axisQuat } from './xform.js';

/** Kolizní skupiny (bity). QUERY nemá žádné těleso: je to „člen“ pro paprsky a dotazy. */
export const GROUP = { WORLD: 1, PLAYER: 2, PROP: 4, DEBRIS: 8, TRIGGER: 16, QUERY: 32, SOLID: 64 };
/** Číslo skupin pro Rapier: členství v horních 16 bitech, filtr v dolních. */
export const groups = (member, filter) => ((member << 16) | filter) >>> 0;

const G = GROUP;
/** Skupina z dat prefabu (pole group u kolideru) → členství a filtr. */
const DATA_GROUPS = {
  world: groups(G.WORLD, G.WORLD | G.PLAYER | G.PROP | G.DEBRIS | G.QUERY),
  // stavba levelu z kvádrů: chová se jako svět a navíc stíní světlo (SOLID)
  brush: groups(G.WORLD | G.SOLID, G.WORLD | G.PLAYER | G.PROP | G.DEBRIS | G.QUERY),
  prop: groups(G.PROP, G.WORLD | G.PLAYER | G.PROP | G.DEBRIS | G.QUERY),
  debris: groups(G.DEBRIS, G.WORLD | G.PROP | G.DEBRIS),
  trigger: groups(G.TRIGGER, G.QUERY), // nic do něj nenarazí, ale paprsek „použít“ ho najde
};
export const PLAYER_GROUPS = groups(G.PLAYER, G.WORLD | G.PROP);
/** Paprsek „použít“: vidí svět, rekvizity i sebratelné předměty. */
export const USE_RAY = groups(G.QUERY, G.WORLD | G.PROP | G.TRIGGER);
/** Paprsek viditelnosti: jen pevný svět a rekvizity. */
export const SIGHT_RAY = groups(G.QUERY, G.WORLD | G.PROP);
/** Paprsek světla: zastaví ho jen stavba levelu (kvádry). Prefaby ve vlně 1 stín nevrhají. */
export const LIGHT_RAY = groups(G.QUERY, G.SOLID);

/**
 * Odstup, který kontrolér postavy drží od překážek (i od podlahy). Postava se musí umístit o tento odstup nad
 * podlahu: uvnitř odstupu kontrolér občas vrátí krok s nulovým pohybem (změřeno: 6 takových kroků na 15 m běhu).
 */
export const CHARACTER_SKIN = 0.02;

const IDENTITY = { x: 0, y: 0, z: 0, w: 1 };

export function createPhys() {
  let world = null;
  let ray = null;
  const refs = new Map(); // handle kolideru → { kind, … } (komu kolider patří)
  const v = { x: 0, y: 0, z: 0 };
  const hit = { dist: 0, ref: null, collider: null, nx: 0, ny: 0, nz: 0 };
  const stat = { fixedColliders: 0 };

  function shapeDesc(shape, scale = 1) {
    switch (shape.type) {
      case 'box':
        return RAPIER.ColliderDesc.cuboid(shape.half[0] * scale, shape.half[1] * scale, shape.half[2] * scale);
      case 'cyl':
        return RAPIER.ColliderDesc.cylinder((shape.height / 2) * scale, shape.radius * scale);
      case 'ball':
        return RAPIER.ColliderDesc.ball(shape.radius * scale);
      case 'hull': {
        const pts = new Float32Array(shape.points.length * 3);
        shape.points.forEach((p, i) => pts.set([p[0] * scale, p[1] * scale, p[2] * scale], i * 3));
        const d = RAPIER.ColliderDesc.convexHull(pts);
        if (!d) throw new Error('Konvexní obal se nepodařilo sestavit (body leží v rovině?).');
        return d;
      }
      default:
        throw new Error(`Neznámý kolizní tvar „${shape.type}“.`);
    }
  }

  const sys = {
    name: 'phys',
    phase: 'physics',
    RAPIER,
    stat,
    get world() {
      return world;
    },

    async init() {
      await RAPIER.init();
    },

    // ---- život světa
    open(gravity) {
      sys.close();
      world = new RAPIER.World({ x: 0, y: -gravity, z: 0 });
      world.timestep = 1 / 120;
      ray = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 });
      stat.fixedColliders = 0;
    },
    close() {
      if (!world) return;
      world.free();
      world = null;
      refs.clear();
    },
    setGravity(g) {
      world.gravity.y = -g;
    },
    /** Jeden krok po postavení světa: bez něj první dotazy svět nevidí a postava propadne. */
    settle() {
      world.step();
    },
    step() {
      world.step();
    },

    // ---- tvary
    /**
     * Kolider. shape: { type: 'box', half } | { type: 'cyl', radius, height, axis } | { type: 'ball', radius } | { type: 'hull', points }.
     * body = null → pevný kolider světa; pos a rot jsou pak světové, jinak místní vůči tělesu.
     * opts: { group: 'world' | 'brush' | 'prop' | 'debris' | 'trigger', friction, restitution, mass, scale }; ref = komu patří.
     */
    addCollider(body, shape, pos, rot, opts, ref) {
      const scale = opts?.scale ?? 1;
      const desc = shapeDesc(shape, scale).setTranslation(pos[0], pos[1], pos[2]);
      let q = rot || IDENTITY;
      if (shape.type === 'cyl' && shape.axis && shape.axis !== 'y') {
        // válec Rapieru stojí podél Y: přidat místní otočení na osu z dat
        const a = axisQuat(shape.axis);
        q = { x: q.w * a.x + q.x * a.w + q.y * a.z - q.z * a.y, y: q.w * a.y - q.x * a.z + q.y * a.w + q.z * a.x, z: q.w * a.z + q.x * a.y - q.y * a.x + q.z * a.w, w: q.w * a.w - q.x * a.x - q.y * a.y - q.z * a.z };
      }
      desc.setRotation(q);
      desc.setCollisionGroups(DATA_GROUPS[opts?.group || 'world']);
      if (opts?.friction !== undefined) desc.setFriction(opts.friction);
      if (opts?.restitution !== undefined) desc.setRestitution(opts.restitution);
      if (opts?.mass !== undefined) desc.setMass(opts.mass);
      const col = body ? world.createCollider(desc, body) : world.createCollider(desc);
      if (ref) refs.set(col.handle, ref);
      if (!body) stat.fixedColliders++;
      return col;
    },
    /**
     * Těleso. kind: 'dynamic' | 'kinematic' | 'fixed'.
     * Pohyblivé uzly prefabů (křídlo dveří) jsou v klidu 'fixed' a kinematické jen po dobu pohybu (setMoving):
     * kontrolér postavy bere každé kinematické těleso v dotyku jako plošinu a ruší pohyb postavy ve směru jeho
     * normály, takže od stojících kinematických dveří se nedalo odejít (změřeno: 0,2 s bez pohybu).
     */
    addBody(kind, x, y, z, q, opts) {
      const desc = kind === 'dynamic' ? RAPIER.RigidBodyDesc.dynamic() : kind === 'fixed' ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.kinematicPositionBased();
      desc.setTranslation(x, y, z).setRotation(q || IDENTITY);
      if (kind === 'dynamic') {
        desc.setLinearDamping(opts?.linDamp ?? 0.05).setAngularDamping(opts?.angDamp ?? 0.3);
        if (opts?.ccd) desc.setCcdEnabled(true);
      }
      return world.createRigidBody(desc);
    },
    /** Přepne těleso uzlu mezi pevným (klid) a kinematickým (pohyb). */
    setMoving(body, on) {
      body.setBodyType(on ? RAPIER.RigidBodyType.KinematicPositionBased : RAPIER.RigidBodyType.Fixed, true);
    },
    setColliderEnabled(col, on) {
      col.setEnabled(on);
    },
    refOf: (col) => refs.get(col.handle) || null,

    // ---- postava
    /** Kinematická kapsle s kontrolérem. Poloha se drží mimo fyziku (translation() platí až po kroku). */
    addCharacter(feetX, feetY, feetZ, P) {
      const half = Math.max(P.height / 2 - P.radius, 0.01);
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(feetX, feetY + P.height / 2, feetZ));
      const col = world.createCollider(RAPIER.ColliderDesc.capsule(half, P.radius).setCollisionGroups(PLAYER_GROUPS), body);
      const cc = world.createCharacterController(CHARACTER_SKIN);
      cc.enableAutostep(P.stepHeight, P.stepMinWidth, false);
      cc.enableSnapToGround(P.snap);
      const slope = Math.acos(P.walkNormal);
      cc.setMaxSlopeClimbAngle(slope);
      cc.setMinSlopeSlideAngle(slope);
      cc.setApplyImpulsesToDynamicBodies(true);
      cc.setCharacterMass(P.mass);
      return { body, col, cc, halfHeight: P.height / 2 };
    },
    removeCharacter(ch) {
      world.removeCharacterController(ch.cc);
      world.removeRigidBody(ch.body);
    },

    // ---- dotazy
    /**
     * Paprsek. Vrací sdílený objekt { dist, ref, collider, nx, ny, nz } (platí do dalšího volání), nebo null.
     * Zásah nese timeOfImpact (ne toi).
     */
    raycast(ox, oy, oz, dx, dy, dz, max, mask, excludeCollider) {
      ray.origin.x = ox;
      ray.origin.y = oy;
      ray.origin.z = oz;
      ray.dir.x = dx;
      ray.dir.y = dy;
      ray.dir.z = dz;
      const h = world.castRayAndGetNormal(ray, max, true, undefined, mask, excludeCollider);
      if (!h) return null;
      hit.dist = h.timeOfImpact;
      hit.collider = h.collider;
      hit.ref = refs.get(h.collider.handle) || null;
      hit.nx = h.normal.x;
      hit.ny = h.normal.y;
      hit.nz = h.normal.z;
      return hit;
    },

    bodyCount: () => (world ? world.bodies.len() : 0),
    colliderCount: () => (world ? world.colliders.len() : 0),
    inspect(path) {
      if (path[0] === 'bodies') return sys.bodyCount();
      if (path[0] === 'colliders') return sys.colliderCount();
      if (path[0] === 'fixedColliders') return stat.fixedColliders;
      return undefined;
    },
    /** Pomocný vektor pro volání Rapieru bez alokace. */
    vec(x, y, z) {
      v.x = x;
      v.y = y;
      v.z = z;
      return v;
    },
  };
  return sys;
}
