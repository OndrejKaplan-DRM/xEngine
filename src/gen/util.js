// Společné drobnosti generátorů a nástrojů sešny B: zaokrouhlení, převod centimetrů na metry,
// zápis JSON ve stejném stylu jako zlatý vzorek. Čisté funkce, běží v Node i v prohlížeči.
// Generátory počítají v celých centimetrech (přesné porovnání hran), do dat jdou metry na 4 desetinná místa.

export const GEN_DATE = '2026-11-22';
export const AUTHOR = 'Kristína (Claude) pro Ondřeje Kaplana';

/** Zaokrouhlení na 4 desetinná místa; bez něj se bajty mezi běhy liší. */
export const r4 = (v) => {
  const o = Math.round(v * 1e4) / 1e4;
  return o === 0 ? 0 : o; // záporná nula by se v JSON neprojevila, ale v porovnání ano
};
/** Centimetry → metry. */
export const m = (cm) => r4(cm / 100);
/** Vektor v metrech z metrů. */
export const V = (x, y, z) => [r4(x), r4(y), r4(z)];
/** Vektor v metrech z centimetrů. */
export const Vcm = (x, y, z) => [m(x), m(y), m(z)];
/** Zaokrouhlení na mřížku (v centimetrech). */
export const snap = (v, g = 10) => Math.round(v / g) * g;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const pad = (n, w = 3) => String(n).padStart(w, '0');

/** Zápis JSON: objekty odsazené, pole čísel a krátké ploché objekty na jednom řádku (styl zlatého vzorku). */
export function fmtJson(v, ind = '') {
  if (Array.isArray(v)) {
    if (v.every((x) => x === null || typeof x !== 'object')) return '[' + v.map((x) => JSON.stringify(x)).join(', ') + ']';
    if (v.every((x) => Array.isArray(x) && x.every((y) => typeof y !== 'object'))) return '[' + v.map((x) => fmtJson(x)).join(', ') + ']';
    const inner = ind + '  ';
    return '[\n' + v.map((x) => inner + fmtJson(x, inner)).join(',\n') + '\n' + ind + ']';
  }
  if (v && typeof v === 'object') {
    const keys = Object.keys(v).filter((k) => v[k] !== undefined);
    const flat = keys.every((k) => v[k] === null || typeof v[k] !== 'object' || (Array.isArray(v[k]) && v[k].every((x) => typeof x !== 'object')));
    if (flat) {
      const one = '{ ' + keys.map((k) => JSON.stringify(k) + ': ' + fmtJson(v[k])).join(', ') + ' }';
      if (one.length <= 150) return one;
    }
    const inner = ind + '  ';
    return '{\n' + keys.map((k) => inner + JSON.stringify(k) + ': ' + fmtJson(v[k], inner)).join(',\n') + '\n' + ind + '}';
  }
  return JSON.stringify(v);
}

/** Původ dat pro pole source. */
export const source = (tool, generator, extra = {}) => ({ tool, generator, ...extra, license: 'own', author: AUTHOR, date: GEN_DATE });
