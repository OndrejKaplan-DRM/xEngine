// xWorld: binární soubory balíku (A2.6, D-030). Textury a modely .glb leží v balíku vedle JSON a manifest je
// vyjmenuje v `assets`. Do hry přicházejí v `pack.files`: klíč `<id balíku>/<cesta vůči kořeni balíku>`, hodnota
// Uint8Array, ArrayBuffer nebo řetězec base64 (tak je vloží build, N-111). Bez souboru se díl nekreslí a hra jede dál.
//
// Díl `shape: "mesh"` a kolize `hull` / `mesh` čtou geometrii z .glb (glb.js); ostatní tvary dál počítá
// výhradně src/xspace/geom.js. Souřadnice kořene modelu = souřadnice uzlu prefabu, na který díl visí.

import { partMesh, partCollider } from '../xspace/index.js';
import { parseGlb, glbGeometry, glbBaseColor } from './glb.js';

/** Řetězec base64 na bajty (Node i prohlížeč). */
function fromBase64(s) {
  if (typeof Uint8Array.fromBase64 === 'function') return Uint8Array.fromBase64(s);
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(s, 'base64'));
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const toBytes = (v) => (v instanceof Uint8Array ? v : v instanceof ArrayBuffer ? new Uint8Array(v) : typeof v === 'string' ? fromBase64(v) : null);
const splitRef = (ref) => {
  const i = ref.indexOf('#');
  return i < 0 ? [ref, null] : [ref.slice(0, i), ref.slice(i + 1)];
};

export function createAssets(pack) {
  const files = pack.files || {};
  const main = pack.manifest?.id;
  const deps = Array.isArray(pack.manifest?.requires) ? pack.manifest.requires : [];
  const decoded = new Map();
  const gltfs = new Map();
  const geoms = new Map();
  const problems = new Set();
  const stat = { files: Object.keys(files).length, glb: 0, meshParts: 0, meshTris: 0, hulls: 0, trimeshes: 0, missing: 0 };
  const problem = (msg) => {
    if (problems.has(msg)) return;
    problems.add(msg);
    console.info(`xWorld: ${msg}`);
  };

  /** Klíč souboru: from = id balíku, ze kterého odkaz pochází; bez něj hlavní balík a pak závislosti. */
  function keyOf(path, from) {
    for (const id of from ? [from] : [main, ...deps]) if (`${id}/${path}` in files) return `${id}/${path}`;
    return path in files ? path : null;
  }
  function bytes(path, from) {
    const key = keyOf(path, from);
    if (!key) return null;
    if (!decoded.has(key)) decoded.set(key, toBytes(files[key]));
    return decoded.get(key);
  }
  function gltf(file, from) {
    const key = keyOf(file, from);
    if (!key) {
      stat.missing++;
      problem(`soubor „${file}“${from ? ` (balík ${from})` : ''} ve hře není (pack.files)`);
      return null;
    }
    if (!gltfs.has(key)) {
      try {
        gltfs.set(key, parseGlb(bytes(file, from)));
        stat.glb++;
      } catch (e) {
        problem(`„${file}“: ${e.message}`);
        gltfs.set(key, null);
      }
    }
    return gltfs.get(key);
  }
  /** Síť z odkazu „soubor.glb#uzel“ v souřadnicích kořene modelu (sdílená: neměnit). */
  function geometry(ref, from) {
    const id = `${from || ''}|${ref}`;
    if (geoms.has(id)) return geoms.get(id);
    const [file, node] = splitRef(ref);
    const g = gltf(file, from);
    let geo = null;
    if (g) {
      geo = glbGeometry(g, node);
      if (!geo) problem(`v „${file}“ není síť${node ? ` uzlu „${node}“` : ''}`);
    }
    geoms.set(id, geo);
    return geo;
  }

  return {
    stat,
    /** Bajty souboru balíku, nebo null. */
    bytes,
    /** Je soubor ve hře? */
    has: (path, from) => keyOf(path, from) !== null,
    geometry,
    /** Síť dílu prefabu (tvar jako geom.js), nebo null. from = id balíku prefabu (pack.prefabs[i].from). */
    meshOf(part, from) {
      if (part.shape !== 'mesh') return partMesh(part);
      if (!part.mesh) return null;
      const g = geometry(part.mesh, from);
      if (g) {
        stat.meshParts++;
        stat.meshTris += g.indices.length / 3;
      }
      return g;
    },
    /**
     * Kolize prefabu { shape, center } pro phys.addCollider, nebo null. hull = konvexní obal vrcholů uzlu, mesh =
     * trojúhelníky (jen pro nehybná a kinematická tělesa; dynamickému tělesu Rapier síť nedovolí, dostane obal).
     */
    colliderOf(c, from, dynamic = false) {
      if (c.shape !== 'hull' && c.shape !== 'mesh') return partCollider(c);
      if (!c.mesh) return null;
      const g = geometry(c.mesh, from);
      if (!g) return null;
      if (c.shape === 'mesh' && !dynamic) {
        stat.trimeshes++;
        return { shape: { type: 'trimesh', vertices: g.positions, indices: g.indices }, center: [0, 0, 0] };
      }
      if (c.shape === 'mesh') problem(`kolize mesh u dynamického tělesa (${c.mesh}): použitý konvexní obal`);
      stat.hulls++;
      const points = [];
      for (let i = 0; i < g.positions.length; i += 3) points.push([g.positions[i], g.positions[i + 1], g.positions[i + 2]]);
      return { shape: { type: 'hull', points }, center: [0, 0, 0] };
    },
    /**
     * Materiál dílu mesh bez `mat` (formát: „bere se z glTF“): zatím jen základní barva prvního materiálu sítě,
     * textura z glTF ne (N-111). Vrací { id, def }; def se přidá k materiálům balíku pod id „glb:<soubor#uzel>“.
     */
    materialOf(part, from) {
      if (part.mat || part.shape !== 'mesh' || !part.mesh) return null;
      const [file, node] = splitRef(part.mesh);
      const g = gltf(file, from);
      const color = (g && glbBaseColor(g, node)) || [0.6, 0.6, 0.6];
      problem(`díl ${part.mesh} nemá mat: materiál z glTF zatím jen jako barva`);
      return { id: `glb:${part.mesh}`, def: { model: 'lit', color, surface: 'plastic' } };
    },
    /** Nahlášené problémy (chybějící soubor, vadný model): pro F3 a testy. */
    get problems() {
      return [...problems];
    },
  };
}
