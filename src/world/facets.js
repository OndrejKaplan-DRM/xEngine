// xWorld: plošky pohyblivého dílu pro světlo po vrcholech. Kontrakt (02_KONTRAKTY, Světlo): pohyblivé díly se
// osvětlují po stěnách dílu, jedna hodnota na stěnu. Stěna = vrcholy jednoho dílu se stejnou normálou
// (kvádr 6 stěn; válec má stěnu na každou normálu pláště a dvě víka).

/**
 * Přidá do seznamu `out` plošky z vrcholů v0 až v1 dávky (rozsah jednoho dílu po appendMesh).
 * Ploška: { cx, cy, cz, nx, ny, nz, verts } v prostoru dávky; střed je průměr jejích vrcholů.
 */
export function addFacets(out, batch, v0, v1) {
  const map = new Map();
  const P = batch.positions;
  const N = batch.normals;
  for (let v = v0; v < v1; v++) {
    const k = v * 3;
    const key = (Math.round(N[k] * 512) + 512) * 1048576 + (Math.round(N[k + 1] * 512) + 512) * 1024 + Math.round(N[k + 2] * 512) + 512;
    let f = map.get(key);
    if (!f) {
      f = { cx: 0, cy: 0, cz: 0, nx: N[k], ny: N[k + 1], nz: N[k + 2], verts: [] };
      map.set(key, f);
      out.push(f);
    }
    f.cx += P[k];
    f.cy += P[k + 1];
    f.cz += P[k + 2];
    f.verts.push(v);
  }
  for (const f of map.values()) {
    const n = f.verts.length;
    f.cx /= n;
    f.cy /= n;
    f.cz /= n;
    f.verts = Uint32Array.from(f.verts);
  }
  return out;
}
