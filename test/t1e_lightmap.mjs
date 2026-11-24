// T1e: textura světla (N-112, D-050, zkušební). Atlas ploch ze vzorků levelu je opakovatelný, mapy se nepřekrývají,
// vrchol leží ve středu bodu na své ploše, okraje map se plní ze sousedů; soubor XLM1 projde zápisem a čtením
// (i přes gzip) a skládání vrstev dává součet světel a bran.

import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { checkPackDir } from '../tools/lib/read-pack.mjs';
import * as X from '../src/xspace/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { pack } = await checkPackDir(path.join(root, 'packs/golden'));

let pass = 0;
let fail = 0;
function ok(cond, name, detail = '') {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? '  ok  ' : 'CHYBA '} ${name}${detail ? '  [' + detail + ']' : ''}`);
}
const clone = (x) => JSON.parse(JSON.stringify(x));

const level = pack.levels[0].data;
const prefabs = new Map(pack.prefabs.map((p) => [p.data.id, p.data]));
const S = X.levelSamples(level, prefabs, pack.materials.materials, X.LIGHT_CELL);

// ---- atlas
const t0 = performance.now();
const A = X.lightmapLayout(S, 0.1);
const T = X.lightmapTexels(A);
const ms = performance.now() - t0;
{
  const B = X.lightmapLayout(X.levelSamples(level, prefabs, pack.materials.materials, X.LIGHT_CELL), 0.1);
  ok(A.hash === B.hash && A.width === B.width && A.height === B.height, 'atlas je opakovatelný (stejný otisk ze stejných dat)', `${A.width} × ${A.height}, ${A.charts.length} map, otisk ${A.hash}`);
  ok(A.hash !== X.lightmapLayout(S, 0.05).hash, 'jiná velikost bodu dá jiný otisk');
  const pow2 = (v) => v >= 64 && (v & (v - 1)) === 0;
  ok(pow2(A.width) && pow2(A.height) && A.width <= X.LIGHTMAP_MAX && A.height <= X.LIGHTMAP_MAX, 'strany atlasu jsou mocniny dvou pod stropem');
  const used = new Uint8Array(A.width * A.height);
  let overlap = 0;
  let outside = 0;
  for (const c of A.charts) {
    if (c.x < 0 || c.y < 0 || c.x + c.w > A.width || c.y + c.h > A.height) outside++;
    for (let j = c.y; j < c.y + c.h; j++) for (let i = c.x; i < c.x + c.w; i++) overlap += used[j * A.width + i]++ ? 1 : 0;
  }
  ok(overlap === 0 && outside === 0, 'mapy se nepřekrývají a leží v atlasu (i s okrajem)', `${overlap} společných bodů`);
  ok(A.uv.length === S.count * 2 && A.inAtlas > 0 && A.inAtlas < S.count, 'UV pro každý vzorek; část vzorků je mimo atlas', `${A.inAtlas} z ${S.count} vzorků v atlasu`);
}
{
  // vzorky mimo atlas: jen nerovinné trojúhelníky (pláště válců pevných dílů prefabů)
  let brushOut = 0;
  for (const M of A.meshes) {
    if (M.kind !== 'brush') continue;
    for (let v = 0; v < M.mesh.positions.length / 3; v++) if (Number.isNaN(A.uv[(M.offset + v) * 2])) brushOut++;
  }
  ok(brushOut === 0, 'každý vzorek kvádru je v atlasu (kvádry a klíny mají rovinné stěny)');
}
{
  // čtyři body kolem UV vrcholu (bilineární filtr) jsou na ploše nebo v okraji mapy a v její obdélníku
  const D0 = X.lightmapDilation(A.width, A.height, T.index);
  const filled = new Uint8Array(A.width * A.height);
  for (const k of T.index) filled[k] = 1;
  for (const k of D0.target) filled[k] = 1;
  let empty = 0;
  let far = 0;
  for (const c of A.charts) {
    const M = A.meshes[c.mesh];
    const I = M.mesh.indices;
    for (const t of c.tris) {
      for (let r = 0; r < 3; r++) {
        const v = I[t * 3 + r];
        const o = (M.offset + v) * 2;
        const fx = A.uv[o] * A.width - 0.5;
        const fy = A.uv[o + 1] * A.height - 0.5;
        if (fx < c.x + A.pad - 1e-6 || fy < c.y + A.pad - 1e-6 || fx > c.x + c.w - A.pad - 1 + 1e-6 || fy > c.y + c.h - A.pad - 1 + 1e-6) far++;
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (!filled[(Math.floor(fy) + dy) * A.width + Math.floor(fx) + dx]) empty++;
      }
    }
  }
  ok(empty === 0 && far === 0, 'UV vrcholu leží uvnitř jeho mapy a čtyři body filtru kolem mají hodnotu', `${empty} prázdných, ${far} mimo mapu`);
  let off = 0;
  for (let i = 0; i < T.index.length; i++) {
    const c = A.charts[T.chart[i]];
    const d = T.positions[i * 3] * c.n[0] + T.positions[i * 3 + 1] * c.n[1] + T.positions[i * 3 + 2] * c.n[2];
    off = Math.max(off, Math.abs(d - c.d), Math.abs(T.normals[i * 3] - c.n[0]) + Math.abs(T.normals[i * 3 + 1] - c.n[1]) + Math.abs(T.normals[i * 3 + 2] - c.n[2]));
  }
  let up = true;
  for (let i = 1; i < T.index.length; i++) if (T.index[i] <= T.index[i - 1]) up = false;
  ok(off < 1e-4 && up, 'body na ploše leží v rovině své mapy s její normálou, indexy vzestupně', `${T.index.length} bodů po 10 cm, ${ms.toFixed(0)} ms v sandboxu`);
  const T5 = X.lightmapTexels(X.lightmapLayout(S, 0.05));
  const ratio = T5.index.length / T.index.length;
  ok(ratio > 3.5 && ratio < 4.5, 'po 5 cm je bodů asi čtyřikrát víc než po 10 cm', `${T5.index.length} / ${T.index.length} = ${ratio.toFixed(2)}`);
}
{
  const D = X.lightmapDilation(A.width, A.height, T.index);
  const covered = new Uint8Array(A.width * A.height);
  for (const k of T.index) covered[k] = 1;
  let bad = 0;
  const done = Uint8Array.from(covered);
  for (let i = 0; i < D.target.length; i++) {
    if (covered[D.target[i]] || D.start[i + 1] === D.start[i]) bad++;
    for (let q = D.start[i]; q < D.start[i + 1]; q++) if (!done[D.src[q]]) bad++;
    done[D.target[i]] = 1;
  }
  // okraj každé mapy (do LIGHTMAP_PAD bodů od plochy) je plný
  let hole = 0;
  for (const k of T.index) {
    const x = k % A.width;
    const y = (k - x) / A.width;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < A.width && yy < A.height && !done[yy * A.width + xx]) hole++;
    }
  }
  ok(bad === 0 && hole === 0 && D.target.length > 0, 'okraj map: body mimo plochu berou jen sousedy s hodnotou; vedle plochy nezůstane díra', `${D.target.length} bodů okraje`);
}

// ---- half float
{
  const vals = [0, 1, 0.5, 2, 1000, 65504, 0.001, 123.456, 3.3e-5];
  let worst = 0;
  for (const v of vals) worst = Math.max(worst, Math.abs(X.fromHalf(X.toHalf(v)) - v) / Math.max(v, 6.1e-5));
  ok(worst < 1e-3 && X.fromHalf(X.toHalf(1e9)) === 65504 && X.toHalf(0) === 0, 'half float: chyba pod 0,1 %, strop 65 504', worst.toExponential(2));
}

// ---- soubor XLM1
{
  const index = T.index;
  const n = index.length;
  const pick = (every, shift) => Uint32Array.from({ length: Math.floor((n - shift) / every) }, (_, i) => shift + i * every);
  const i1 = pick(3, 0);
  const i2 = pick(5, 2);
  const g1 = pick(7, 1);
  const e = (idx, f) => Float32Array.from(idx, (k) => f(k));
  const layers = [
    { kind: 'light', id: 'l_a', idx: i1, e: e(i1, (k) => (k % 97) / 9), gates: [{ gate: ['e_door_lab'], idx: g1, e: e(g1, (k) => 0.5 + (k % 13)) }] },
    { kind: 'entity', id: 'e_lamp', idx: i2, e: e(i2, (k) => 1 + (k % 31)) },
  ];
  const raw = X.encodeLightmap({ texel: A.texel, width: A.width, height: A.height, atlas: A.hash, index, layers });
  const gz = zlib.gzipSync(raw, { level: 9 });
  const back = X.decodeLightmap(zlib.gunzipSync(gz));
  let same = back.index.length === n && back.header.atlas === A.hash && back.header.texel === A.texel;
  for (let i = 0; same && i < n; i++) if (back.index[i] !== index[i]) same = false;
  let rel = 0;
  layers.forEach((L, li) => {
    const B = back.layers[li];
    if (B.id !== L.id || B.kind !== L.kind || B.idx.length !== L.idx.length) same = false;
    for (let i = 0; i < L.idx.length; i++) {
      if (B.idx[i] !== L.idx[i]) same = false;
      rel = Math.max(rel, Math.abs(B.e[i] - L.e[i]) / Math.max(L.e[i], 1e-3));
    }
  });
  const G = back.layers[0].gates[0];
  ok(same && rel < 1e-3 && G.gate[0] === 'e_door_lab' && G.idx.length === g1.length, 'XLM1: zápis a čtení přes gzip vrátí body, vrstvy, úseky s bránou; hodnoty v half float', `${n} bodů: rozbaleno ${(raw.length / 1024).toFixed(0)} kB, gzip ${(gz.length / 1024).toFixed(0)} kB, chyba ${rel.toExponential(1)}`);
  let threw = '';
  try {
    X.decodeLightmap(gz);
  } catch (err) {
    threw = err.message;
  }
  let threw2 = '';
  try {
    X.decodeLightmap(new Uint8Array([88, 76, 86, 49, 0, 0, 0, 0]));
  } catch (err) {
    threw2 = err.message;
  }
  ok(/gzip/.test(threw) && /XLM1/.test(threw2), 'čtení odmítne nerozbalený soubor i cizí značku');
  // skládání: lampa naplno, světlo a na půl, dveře na čtvrt
  const lights = new Map([['l_a', { color: [1, 0.5, 0.25], base: true }], ['e_lamp', { color: [0, 1, 0], base: false }]]);
  const rgb = X.composeLightmap(back, lights, { l_a: 0.5, e_lamp: 1 }, { e_door_lab: 0.25 });
  const exp = new Float32Array(n * 3);
  const add = (idx, ev, k, col) => idx.forEach((o, i) => col.forEach((c, r) => (exp[o * 3 + r] += ev[i] * k * c)));
  add(back.layers[0].idx, back.layers[0].e, 0.5, [1, 0.5, 0.25]);
  add(G.idx, G.e, 0.5 * 0.25, [1, 0.5, 0.25]);
  add(back.layers[1].idx, back.layers[1].e, 1, [0, 1, 0]);
  let d = 0;
  for (let i = 0; i < n * 3; i++) d = Math.max(d, Math.abs(rgb[i] - exp[i]));
  const onlyBase = X.composeLightmap(back, lights);
  ok(d < 1e-5 && onlyBase.some((v) => v > 0) && back.layers[1].idx.every((o) => onlyBase[o * 3 + 1] === 0.5 * onlyBase[o * 3]), 'skládání: úroveň × barva × (E + otevření brány × E úseku); bez údaje svítí jen základní světla', `rozdíl ${d.toExponential(1)}`);
}

// ---- level s texturou světla
{
  const m = clone(pack);
  m.levels[0].data.baked = { file: 'levels/xlab.light.bin', method: 'vertex', hash: 'x', lightmap: { file: 'levels/xlab.lightmap.bin', texel: 0.05, atlas: A.hash } };
  const codes = X.validatePack(m).errors.filter((e) => e.code === 'ref.asset').map((e) => e.path);
  ok(codes.length === 2 && codes.some((p) => p.endsWith('baked.lightmap.file')), 'zapečené soubory, které nejsou v assets manifestu, hlásí ref.asset', codes.join(', '));
  m.levels[0].data.baked.lightmap.texel = 2;
  ok(X.validatePack(m).errors.some((e) => e.code === 'shape.range' && e.path.endsWith('lightmap.texel')), 'velikost bodu mimo 0,01 až 0,5 m hlásí shape.range');
}

console.log(`\nT1e textura světla: ${pass} prošlo, ${fail} selhalo`);
process.exit(fail ? 1 : 0);
