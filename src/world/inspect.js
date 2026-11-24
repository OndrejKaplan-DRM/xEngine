// xWorld: čtení stavu entit pro testy a vývojářský přehled (game.get('entity.<id>.<co>')). Jen čte; hru nemění.

export function inspectEntities(path, { list, byId, active, stat }) {
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
}
