// Sada kit_home, druhá iterace tvarů (Ondřej 25. 11. 2026 v 17:00: „vana, ať má výduť na vodu; zrcadlo, ať se
// leskne; polštář, ať není jen kostka másla … přidej o 25 % trojúhelníků víc tak, abys získala dalších 100 % efektu“).
// Vana a umyvadlo jako jedna skořepina (zástěra, okraj, mísa, dno), zrcadlo s odleskem a světlejším pruhem nahoře,
// měkké díly (polštář, sedák, opěrka, matrace, peřina) z měkkého kvádru s propadnutím a pokrčením.

import { A, merge, flatBox, cylinder, moved, mTranslate, mRotate, at } from '../lab/appliance.mjs';
import { newGeom, vert, quad, tri } from '../mesh/geo.mjs';
import { softBox, seedOf, weldNormals } from '../mesh/noise.mjs';

/** Obrys zaobleného obdélníku (poloosy a, b, poloměr rohu r) v rovině xz: 4 × (n + 1) bodů proti směru hodin. */
function rrect(a, b, r, n = 4) {
  const rr = Math.max(0.002, Math.min(r, a * 0.99, b * 0.99));
  const out = [];
  for (const [cx, cz, a0] of [[a - rr, b - rr, 0], [-(a - rr), b - rr, 90], [-(a - rr), -(b - rr), 180], [a - rr, -(b - rr), 270]]) {
    for (let i = 0; i <= n; i++) {
      const t = ((a0 + (90 * i) / n) * Math.PI) / 180;
      out.push([cx + rr * Math.cos(t), cz + rr * Math.sin(t)]);
    }
  }
  return out;
}

/**
 * Skořepina vany nebo umyvadla: zástěra od podlahy (y0) k okraji (top), plochý okraj, mísa dolů o depth s oblým
 * přechodem do dna. Obrysy sdílejí počet bodů, takže je spojí pásy čtyřúhelníků; dno je vějíř. Střed [cx, cz].
 * outer = [a, b, r] vnějšího obrysu, rim = [a, b, r] okraje mísy, wall = zúžení mísy ke dnu (m).
 */
export function tubShell(cx, cz, outer, rim, y0, top, depth, wall = 0.08, n = 4) {
  const rings = [
    [outer, y0],
    [outer, top - 0.012],
    [[outer[0] - 0.006, outer[1] - 0.006, outer[2]], top],
    [[rim[0] + 0.008, rim[1] + 0.008, rim[2] + 0.008], top],
    [rim, top - 0.012],
  ];
  // mísa: čtvrtkruh od okraje ke dnu
  for (let i = 1; i <= 4; i++) {
    const t = (Math.PI / 2) * (i / 4);
    const d = wall * (1 - Math.cos(t));
    rings.push([[rim[0] - d, rim[1] - d, Math.max(0.01, rim[2] - d)], top - 0.012 - (depth - 0.012) * Math.sin(t)]);
  }
  const g = newGeom();
  const ids = rings.map(([[a, b, r], y]) => rrect(a, b, r, n).map(([x, z]) => vert(g, [cx + x, y, cz + z], [0, 1, 0])));
  const m = ids[0].length;
  for (let k = 0; k + 1 < ids.length; k++) {
    for (let i = 0; i < m; i++) {
      const j = (i + 1) % m;
      quad(g, ids[k][i], ids[k + 1][i], ids[k + 1][j], ids[k][j]); // líc ven a nahoru (zástěra ven, mísa dovnitř)
    }
  }
  const last = ids[ids.length - 1];
  const yb = rings[rings.length - 1][1];
  const c = vert(g, [cx, yb, cz], [0, 1, 0]);
  for (let i = 0; i < m; i++) tri(g, last[(i + 1) % m], last[i], c);
  return weldNormals(g);
}

/** Hladina v míse tubShell v hloubce h pod okrajem (plochý zaoblený obdélník). */
export function waterIn(cx, cz, rim, top, depth, h, wall = 0.08, n = 4) {
  // zúžení mísy v hloubce h podle čtvrtkruhu
  const s = Math.min(1, (h - 0.012) / (depth - 0.012));
  const d = wall * (1 - Math.cos(Math.asin(Math.max(0, s)))) + 0.004;
  // hladina a 2 mm pod ní spodní strana (síť nesmí být placatá)
  const g = newGeom();
  for (const [y, up] of [[top - h, true], [top - h - 0.002, false]]) {
    const ring = rrect(rim[0] - d, rim[1] - d, Math.max(0.01, rim[2] - d), n).map(([x, z]) => vert(g, [cx + x, y, cz + z], [0, up ? 1 : -1, 0]));
    const c = vert(g, [cx, y, cz], [0, up ? 1 : -1, 0]);
    for (let i = 0; i < ring.length; i++) {
      if (up) tri(g, ring[(i + 1) % ring.length], ring[i], c);
      else tri(g, ring[i], ring[(i + 1) % ring.length], c);
    }
  }
  return g;
}

/**
 * Zrcadlová plocha v rovině z (obdélník x0…x1, y0…y1, nebo kruh se středem [x0, y0] a poloměrem x1, je-li y1 null):
 * zrcadlo, světlejší pruh odrazu v horní třetině a dva šikmé odlesky (z obou stran). Díly mají jména od key.
 */
export function mirrorFace(n, key, x0, x1, y0, y1, z, M = null) {
  const round = y1 === null;
  const [cx, cy, w, h] = round ? [x0, y0, 2 * x1, 2 * x1] : [(x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0];
  // kruh: tenký válec osou do +Z
  const disc = (x, y, r, z0, t) => moved(cylinder(r, 0, t, { seg: 24 }), at(mTranslate(x, y, z0), mRotate('x', 90)));
  const pane = round ? disc(cx, cy, x1, z + 0.003, 0.003) : flatBox([x0, y0, z], [x1, y1, z + 0.003]);
  // odraz: světlejší pruh v horní třetině (u kruhu menší kruh posunutý nahoru)
  const band = round ? disc(cx, cy + x1 * 0.35, x1 * 0.55, z + 0.0065, 0.0015) : flatBox([x0 + 0.004, y0 + h * 0.66, z + 0.003], [x1 - 0.004, y1 - 0.004, z + 0.0035]);
  const L = Math.min(w, h) * 0.7;
  const glint = [[-0.18, 0.06], [0.02, 0.025]].map(([dx, d]) => moved(flatBox([-d / 2, -L / 2, -0.0008], [d / 2, L / 2, 0.0008]), at(mTranslate(cx + dx * w, cy, z + 0.0045), mRotate('z', -32))));
  const tf = (g) => (M ? moved(g, M) : g);
  return [
    A(n, `${key}_mirror`, tf(pane), 'mirror_glass'),
    A(n, `${key}_reflect`, tf(band), 'mirror_bright'),
    A(n, `${key}_glint`, tf(merge(glint)), 'glass_glint'),
  ];
}
/** Měkký díl (polštář, sedák, opěrka): softBox se semínkem z klíče, natočení a posun volitelně. */
export function soft(key, min, max, o = {}, M = null) {
  const g = softBox(min, max, { seed: seedOf(key), ...o });
  return M ? moved(g, M) : g;
}
