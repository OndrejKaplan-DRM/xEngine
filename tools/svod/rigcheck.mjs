// Porovná rigMatrices / rigSolve s původním rekurzivním výpočtem na všech prefabech balíků.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [root, ...dirs] = process.argv.slice(2);
const X = await import(pathToFileURL(path.join(root, 'src/xspace/index.js')).href);
const { readPackDir } = await import(pathToFileURL(path.join(root, 'tools/lib/read-pack.mjs')).href);
const ref = (prefab, values = {}) => {
  const jointOf = new Map((prefab.rig.joints || []).map((j) => [j.node, j]));
  const nodes = new Map(prefab.rig.nodes.map((n) => [n.id, n]));
  const out = {};
  const solve = (id) => {
    if (out[id]) return out[id];
    const n = nodes.get(id);
    let local = X.mat4Mul(X.mat4Translate(n.pos || [0, 0, 0]), X.mat4Euler(n.rot));
    const j = jointOf.get(id);
    if (j) { const v = X.jointClamp(j, values[j.id] ?? j.rest ?? j.min); local = X.mat4Mul(local, j.type === 'hinge' ? X.mat4AxisAngle(j.axis, v) : X.mat4Translate([j.axis[0] * v, j.axis[1] * v, j.axis[2] * v])); }
    out[id] = n.parent === undefined ? local : X.mat4Mul(solve(n.parent), local);
    return out[id];
  };
  for (const n of prefab.rig.nodes) solve(n.id);
  return out;
};
let n = 0, cases = 0, worst = 0;
for (const d of dirs) {
  const pack = await readPackDir(path.resolve(d));
  for (const { data: pf } of pack.prefabs) {
    n++;
    for (const vals of [{}, ...(pf.rig.joints || []).flatMap((j) => [{ [j.id]: j.min }, { [j.id]: j.max }, { [j.id]: (j.min + 2 * j.max) / 3 }])]) {
      const a = ref(pf, vals), b = X.rigMatrices(pf, vals);
      for (const id of Object.keys(a)) for (let e = 0; e < 16; e++) worst = Math.max(worst, Math.abs(a[id][e] - b[id][e]));
      cases++;
    }
  }
}
console.log(`prefabů ${n}, případů ${cases}, největší rozdíl ${worst}`);
