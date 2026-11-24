// xForge, sítě: registr sítí dílů mesh. Díl prefabu nese jen odkaz „meshes/<soubor>.glb#<uzel>“ (formát xSpace);
// síť samotnou drží registr, dokud ji make-pack nezapíše do .glb. Z registru bere knihovna prefabů počet
// trojúhelníků a obal, galerie síť ke kreslení a buildTheme obsah souborů balíku.

import { bounds, tris } from './geo.mjs';
import { writeGlb } from './glb.mjs';
import { sha256Hex } from './sha256.mjs';

const REG = new Map();

/**
 * Díl tvaru mesh. file = jméno souboru bez přípony v adresáři meshes/ balíku (třeba 'glass'), name = jméno uzlu
 * (jedinečné v souboru), geom = síť v prostoru uzlu kostry prefabu.
 */
export function meshPart(node, file, name, geom, mat) {
  if (!geom || !geom.indices.length) throw new Error(`mesh ${file}#${name}: prázdná síť`);
  const ref = `meshes/${file}.glb#${name}`;
  REG.set(ref, geom);
  return { node, shape: 'mesh', mesh: ref, mat };
}

export const meshGeom = (ref) => REG.get(ref) || null;
export const meshTris = (part) => (part.shape === 'mesh' && REG.has(part.mesh) ? tris(REG.get(part.mesh)) : null);
/** Osm rohů obalu sítě dílu (pro obal prefabu), nebo null. */
export function meshCorners(part) {
  const g = part.shape === 'mesh' ? REG.get(part.mesh) : null;
  if (!g) return null;
  const b = bounds(g);
  const out = [];
  for (const x of [b.min[0], b.max[0]]) for (const y of [b.min[1], b.max[1]]) for (const z of [b.min[2], b.max[2]]) out.push([x, y, z]);
  return out;
}

/**
 * Soubory sítí pro prefaby sady: { 'meshes/glass.glb': Uint8Array } v pořadí prvního výskytu, a položky
 * pack.json.assets k nim (otisk, velikost, licence own, zdroj).
 */
export function meshFiles(prefabs, sourceOf = () => 'tools/forge') {
  const byFile = new Map();
  const src = new Map();
  for (const p of prefabs) {
    for (const part of p.parts) {
      if (part.shape !== 'mesh') continue;
      const [file, name] = part.mesh.split('#');
      if (!byFile.has(file)) byFile.set(file, new Map());
      const list = byFile.get(file);
      if (!list.has(name)) list.set(name, REG.get(part.mesh));
      if (!src.has(file)) src.set(file, sourceOf(p));
    }
  }
  const files = {};
  const assets = [];
  for (const [file, list] of byFile) {
    const bytes = writeGlb([...list].map(([name, geom]) => ({ name, geom })));
    files[file] = bytes;
    assets.push({ path: file, bytes: bytes.length, sha256: sha256Hex(bytes), license: 'own', source: src.get(file), author: 'xForge (sešna B)' });
  }
  return { files, assets };
}

/** Díl mesh posunutý o (dx, dy, dz): nový uzel s posunutou kopií sítě (jméno nese posun v mm). */
export function shiftMeshPart(part, dx, dy, dz, mapPos = null) {
  const g = REG.get(part.mesh);
  const [file, name] = part.mesh.split('#');
  const tag = `${name}_s${Math.round(dx * 1000)}_${Math.round(dy * 1000)}_${Math.round(dz * 1000)}${mapPos ? '_m' : ''}`;
  const ref = `${file}#${tag}`;
  if (!REG.has(ref)) {
    const out = { positions: g.positions.slice(), normals: g.normals.slice(), uvs: g.uvs.slice(), indices: g.indices.slice() };
    for (let i = 0; i < out.positions.length; i += 3) {
      const q = mapPos ? mapPos([out.positions[i], out.positions[i + 1], out.positions[i + 2]]) : [out.positions[i] + dx, out.positions[i + 1] + dy, out.positions[i + 2] + dz];
      out.positions[i] = q[0];
      out.positions[i + 1] = q[1];
      out.positions[i + 2] = q[2];
    }
    REG.set(ref, out);
  }
  return { ...part, mesh: ref };
}
