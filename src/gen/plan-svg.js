// Půdorys levelu jako SVG, po patrech. Kreslí jen to, co je v datech (buňky, kvádry v řezu 1,2 m nad podlahou,
// portály, půdorysy entit v klidové poloze, světla, výchozí místa), takže slouží i ke kontrole okem.
// Čistá funkce: level + katalog sady → text SVG.

const ROLE_FILL = { hall: '#2b3a4a', corr: '#2f3440', lab: '#24454a', office: '#3d3a2c', store: '#3a3229', tech: '#3b2f3f', niche: '#33302b', crypt: '#3a2d2d', cellar: '#3a3327', chamber: '#2f3a33' };
const CAT_FILL = [
  ['arch.door', '#ef9f27'],
  ['arch.railing', '#d8c24a'],
  ['arch.', '#8b93a5'],
  ['device.', '#e06c5a'],
  ['prop.light', '#ffe9a8'],
  ['prop.container', '#b08a55'],
  ['prop.', '#9aa3b5'],
];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Výšky podlah jednotlivých pater (zapuštěné místnosti patří k přízemí). */
export function floorLevels(level) {
  const ys = [...new Set(level.cells.map((c) => Math.max(0, Math.round(c.bounds.min[1] * 10) / 10)))].sort((a, b) => a - b);
  return ys.filter((y, i) => i === 0 || y - ys[i - 1] > 1.5);
}

/**
 * @param level level xSpace
 * @param catalog katalog sady (kvůli půdorysům entit); smí chybět
 * @param {{ scale?: number, labels?: boolean }} o měřítko v pixelech na metr
 */
export function planSvg(level, catalog, o = {}) {
  const S = o.scale || 22;
  const floors = floorLevels(level);
  const all = level.cells.flatMap((c) => [c.bounds.min, c.bounds.max]);
  const [x0, x1] = [Math.min(...all.map((p) => p[0])) - 0.6, Math.max(...all.map((p) => p[0])) + 0.6];
  const [z0, z1] = [Math.min(...all.map((p) => p[2])) - 0.6, Math.max(...all.map((p) => p[2])) + 0.6];
  const W = (x1 - x0) * S;
  const H = (z1 - z0) * S;
  const pad = 28;
  const out = [];
  const rect = (b, off, fill, extra = '') => `<rect x="${((b.min[0] - x0) * S).toFixed(1)}" y="${((b.min[2] - z0) * S + off).toFixed(1)}" width="${((b.max[0] - b.min[0]) * S).toFixed(1)}" height="${((b.max[2] - b.min[2]) * S).toFixed(1)}" fill="${fill}" ${extra}/>`;
  floors.forEach((F, k) => {
    const off = k * (H + pad) + pad;
    const on = (y0, y1) => y1 > F + 0.5 && y0 < F + 1.9; // řez patrem
    const label = floors.length > 1 ? (k === 0 ? 'přízemí' : `${k}. patro`) : '';
    out.push(`<text x="4" y="${off - 9}" fill="#d8dbe2" font-size="13">${esc(level.title)}${label ? ' · ' + label : ''}</text>`);
    out.push(`<rect x="0" y="${off}" width="${W.toFixed(1)}" height="${H.toFixed(1)}" fill="#0b0d12"/>`);
    for (const c of level.cells) {
      if (!on(c.bounds.min[1], c.bounds.max[1])) continue;
      const key = c.id.replace(/^c_/, '').replace(/_\d+$/, '');
      out.push(rect(c.bounds, off, ROLE_FILL[key] || '#2a2f3a'));
    }
    for (const b of level.brushes) {
      const tag = b.tag;
      const [y0, y1] = [b.min[1], b.max[1]];
      if (tag === 'stair' || tag === 'ramp' || tag === 'platform') {
        if (y1 > F + 0.01 && y0 < F + 1.9 && y1 <= F + 3.5) out.push(rect(b, off, tag === 'ramp' ? '#5a6a4a' : tag === 'platform' ? '#4a5568' : '#56607a', 'stroke="#0b0d12" stroke-width="0.6"'));
      } else if (tag === 'gallery') {
        if (Math.abs(y1 - F) < 0.05) out.push(rect(b, off, '#3d4c66', 'stroke="#56607a" stroke-width="0.6"'));
        else if (y0 > F + 1.9 && y0 < F + 3.6) out.push(rect(b, off, 'none', 'stroke="#56607a" stroke-width="0.8" stroke-dasharray="4 3"'));
      } else if ((tag === 'wall' || tag === 'pillar') && on(y0, y1)) out.push(rect(b, off, tag === 'pillar' ? '#aab2c5' : '#c9ced9'));
    }
    for (const e of catalog ? level.entities : []) {
      if (e.pos[1] < F - 1 || e.pos[1] > F + 2.95) continue;
      const pf = catalog.get(e.prefab);
      const box = catalog.worldBox(e.prefab, e.pos, e.rot ? e.rot[1] : 0, 'rest');
      const fill = (CAT_FILL.find(([p]) => pf.category.startsWith(p)) || [0, '#9aa3b5'])[1];
      out.push(rect(box, off, fill, `fill-opacity="${pf.category === 'prop.light' ? 0.55 : 0.9}"`));
    }
    for (const p of level.portals || []) {
      const ys = p.quad.map((q) => q[1]);
      if (Math.min(...ys) < F - 0.05 || Math.min(...ys) > F + 0.05) continue;
      const xs = p.quad.map((q) => (q[0] - x0) * S);
      const zs = p.quad.map((q) => (q[2] - z0) * S + off);
      out.push(`<line x1="${Math.min(...xs).toFixed(1)}" y1="${Math.min(...zs).toFixed(1)}" x2="${Math.max(...xs).toFixed(1)}" y2="${Math.max(...zs).toFixed(1)}" stroke="${p.door ? '#ef9f27' : '#5dcaa5'}" stroke-width="2.2"/>`);
    }
    for (const l of level.lights || []) {
      if (l.pos[1] < F || l.pos[1] > F + 6.5 || (floors[k + 1] !== undefined && l.pos[1] > floors[k + 1] - 0.3)) continue;
      out.push(`<circle cx="${((l.pos[0] - x0) * S).toFixed(1)}" cy="${((l.pos[2] - z0) * S + off).toFixed(1)}" r="2.2" fill="#fff3b0"/>`);
    }
    for (const s of level.spawns) {
      if (s.pos[1] < F - 1 || s.pos[1] > F + 2.9) continue;
      const [cx, cy] = [(s.pos[0] - x0) * S, (s.pos[2] - z0) * S + off];
      out.push(`<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${-(s.yaw || 0)})"><path d="M0 -8 L5 6 L-5 6 Z" fill="${s.kind === 'player' ? '#5dcaa5' : '#e24b4a'}"/></g>`);
    }
    if (o.labels !== false) {
      for (const c of level.cells) {
        if (!on(c.bounds.min[1], c.bounds.max[1])) continue;
        const cx = ((c.bounds.min[0] + c.bounds.max[0]) / 2 - x0) * S;
        const cy = ((c.bounds.min[2] + c.bounds.max[2]) / 2 - z0) * S + off;
        const name = (c.name || c.id).split(' · ')[0];
        if ((c.bounds.max[0] - c.bounds.min[0]) * S < name.length * 5.2) continue; // popisek by přetekl do sousedů
        const sunk = c.bounds.min[1] < -0.01 ? ` ↓${Math.round(-c.bounds.min[1] * 100)}` : '';
        out.push(`<text x="${cx.toFixed(1)}" y="${(cy + 3).toFixed(1)}" fill="#e8ebf2" fill-opacity="0.75" font-size="9" text-anchor="middle">${esc(name + sunk)}</text>`);
      }
    }
  });
  const total = floors.length * (H + pad) + 6;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(W)}" height="${Math.ceil(total)}" viewBox="0 0 ${Math.ceil(W)} ${Math.ceil(total)}" font-family="system-ui, Segoe UI, Roboto, sans-serif"><rect width="100%" height="100%" fill="#151922"/>${out.join('')}</svg>`;
}
