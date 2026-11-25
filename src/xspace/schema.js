// xSpace: stavebnice popisu polí (N-012 a dělení formats.js, 25. 11. 2026). Čisté funkce bez závislostí;
// výsledné objekty čte validátor (check.js) a generátor dokumentu polí (tools/xspace-doc.mjs).

export const id = (doc, o = {}) => ({ t: 'id', doc, ...o });
export const str = (doc, o = {}) => ({ t: 'str', doc, ...o });
export const num = (doc, o = {}) => ({ t: 'num', doc, ...o });
export const int = (doc, o = {}) => ({ t: 'int', doc, ...o });
export const bool = (doc, o = {}) => ({ t: 'bool', doc, ...o });
export const vec3 = (doc, o = {}) => ({ t: 'vec3', doc, ...o });
export const color = (doc, o = {}) => ({ t: 'color', doc, ...o });
export const en = (values, doc, o = {}) => ({ t: 'enum', values, doc, ...o });
export const arr = (of, doc, o = {}) => ({ t: 'arr', of, doc, ...o });
export const obj = (fields, doc, o = {}) => ({ t: 'obj', fields, doc, ...o });
export const map = (of, doc, o = {}) => ({ t: 'map', of, doc, ...o });
export const ref = (to, doc, o = {}) => ({ t: 'ref', to, doc, ...o });
export const konst = (value, doc) => ({ t: 'const', value, doc, req: true });
/** Číslo, nebo { min, max, curve? } podle nabití zbraně (N-201); meze min a max platí pro obě hodnoty. */
export const ramp = (doc, o = {}) => ({ t: 'ramp', doc, ...o });
export const R = (d) => ({ ...d, req: true });
