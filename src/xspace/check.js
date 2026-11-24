// Pomocné funkce validátoru xSpace: sběrač nálezů a vrstva 1 (tvar hodnoty podle popisu ve formats.js).
// Odděleno z validate.js kvůli mezi 600 řádků (25. 11. 2026); kódy nálezů se nemění.

import { LIMITS, RAMP_CURVES } from './formats.js';

export const ID = /^[a-z][a-z0-9_]*$/;
export const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
export const isVec = (v, n) => Array.isArray(v) && v.length === n && v.every(isNum);

/** Sběrač nálezů. */
export function collector() {
  const items = [];
  return {
    items,
    err: (code, path, msg) => items.push({ level: 'error', code, path, msg }),
    warn: (code, path, msg) => items.push({ level: 'warn', code, path, msg }),
  };
}

/** Vrstva 1: tvar hodnoty podle popisu. */
export function checkShape(d, v, path, c) {
  switch (d.t) {
    case 'const':
      if (v !== d.value) c.err('shape.const', path, `má být ${JSON.stringify(d.value)}, je ${JSON.stringify(v)}`);
      return;
    case 'any':
      return;
    case 'id':
    case 'ref':
      if (typeof v !== 'string' || !v) return c.err('shape.type', path, 'má být neprázdný řetězec');
      if (d.t === 'id' && (!ID.test(v) || v.length > LIMITS.idMax)) {
        c.err('shape.id', path, `id „${v}“ má být malými písmeny, číslicemi a podtržítkem, nejvýš ${LIMITS.idMax} znaků`);
      }
      return;
    case 'str':
      if (typeof v !== 'string' || !v) c.err('shape.type', path, 'má být neprázdný řetězec');
      return;
    case 'bool':
      if (typeof v !== 'boolean') c.err('shape.type', path, 'má být true nebo false');
      return;
    case 'num':
    case 'int':
      if (!isNum(v)) return c.err('shape.type', path, 'má být číslo');
      if (d.t === 'int' && !Number.isInteger(v)) return c.err('shape.type', path, 'má být celé číslo');
      if (d.min !== undefined && v < d.min) c.err('shape.range', path, `${v} je pod mezí ${d.min}`);
      if (d.max !== undefined && v > d.max) c.err('shape.range', path, `${v} je nad mezí ${d.max}`);
      return;
    case 'ramp': {
      // číslo, nebo { min, max, curve? } podle nabití zbraně (N-201)
      if (isNum(v)) return checkShape({ ...d, t: 'num' }, v, path, c);
      if (!v || typeof v !== 'object' || Array.isArray(v)) return c.err('shape.type', path, 'má být číslo, nebo { min, max, curve? }');
      for (const k of ['min', 'max']) {
        if (v[k] === undefined) c.err('shape.required', `${path}.${k}`, 'povinné pole chybí');
        else checkShape({ t: 'num', min: d.min, max: d.max }, v[k], `${path}.${k}`, c);
      }
      if (v.curve !== undefined && !RAMP_CURVES.includes(v.curve)) c.err('shape.enum', `${path}.curve`, `„${v.curve}“ není z výčtu: ${RAMP_CURVES.join(', ')}`);
      for (const k of Object.keys(v)) if (!['min', 'max', 'curve'].includes(k)) c.warn('shape.unknown', `${path}.${k}`, 'neznámé pole (překlep, nebo pole z novější verze formátu)');
      return;
    }
    case 'vec2':
      if (!isVec(v, 2)) c.err('shape.type', path, 'má být pole dvou čísel');
      return;
    case 'vec3':
      if (!isVec(v, 3)) return c.err('shape.type', path, 'má být pole tří čísel');
      if (v.some((x) => Math.abs(x) > LIMITS.coordMax)) c.err('shape.range', path, `souřadnice mimo ±${LIMITS.coordMax} m`);
      return;
    case 'color':
      if (!isVec(v, 3)) return c.err('shape.type', path, 'má být pole tří čísel [r, g, b]');
      if (v.some((x) => x < 0 || x > 1)) c.err('shape.range', path, 'složky barvy mají být 0–1');
      return;
    case 'enum':
      if (!d.values.includes(v)) c.err('shape.enum', path, `„${v}“ není z výčtu: ${d.values.join(', ')}`);
      return;
    case 'arr':
      if (!Array.isArray(v)) return c.err('shape.type', path, 'má být pole');
      if (d.minLen !== undefined && v.length < d.minLen) c.err('shape.length', path, `má mít aspoň ${d.minLen} položek`);
      if (d.maxLen !== undefined && v.length > d.maxLen) c.err('shape.length', path, `má mít nejvýš ${d.maxLen} položek`);
      v.forEach((item, i) => checkShape(d.of, item, `${path}[${i}]`, c));
      return;
    case 'map':
      if (!v || typeof v !== 'object' || Array.isArray(v)) return c.err('shape.type', path, 'má být objekt id → hodnota');
      for (const [k, item] of Object.entries(v)) checkShape(d.of, item, `${path}.${k}`, c);
      return;
    case 'obj':
      if (d.orList && Array.isArray(v)) {
        // objekt, nebo neprázdný seznam takových objektů (components.interact, N-010)
        if (!v.length) return c.err('shape.length', path, 'seznam má mít aspoň jednu položku');
        return v.forEach((item, i) => checkShape({ ...d, orList: false }, item, `${path}[${i}]`, c));
      }
      if (!v || typeof v !== 'object' || Array.isArray(v)) return c.err('shape.type', path, d.orList ? 'má být objekt nebo seznam objektů' : 'má být objekt');
      for (const [k, fd] of Object.entries(d.fields)) {
        if (v[k] === undefined) {
          if (fd.req) c.err('shape.required', `${path}.${k}`, 'povinné pole chybí');
        } else checkShape(fd, v[k], `${path}.${k}`, c);
      }
      for (const k of Object.keys(v)) {
        if (!(k in d.fields)) c.warn('shape.unknown', `${path}.${k}`, 'neznámé pole (překlep, nebo pole z novější verze formátu)');
      }
      return;
    default:
      throw new Error(`Neznámý typ v popisu formátu: ${d.t}`);
  }
}

export function dupes(list, path, code, c) {
  const seen = new Set();
  list.forEach((x, i) => {
    if (!x || typeof x.id !== 'string') return;
    if (seen.has(x.id)) c.err(code, `${path}[${i}].id`, `id „${x.id}“ se opakuje`);
    seen.add(x.id);
  });
  return seen;
}

export function boxOk(min, max, path, c, minSize = LIMITS.brushMinSize) {
  if (!isVec(min, 3) || !isVec(max, 3)) return false;
  let ok = true;
  for (let i = 0; i < 3; i++) {
    if (max[i] - min[i] < minSize) {
      c.err('geom.box', path, `rozměr v ose ${'xyz'[i]} je ${(max[i] - min[i]).toFixed(4)} m; min musí být menší než max aspoň o ${minSize} m`);
      ok = false;
    }
  }
  return ok;
}
