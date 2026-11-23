// Náhoda generátorů: jen přes rngNext z jádra (stav je jedno celé číslo, žádné Math.random).
// makeRng drží stav v uzávěru a nabízí pohodlné tvary; fork dá nezávislý proud (patro, vybavení…),
// takže přidání jednoho tahu v jedné části nerozhodí zbytek levelu.

import { rngNext } from '../kernel/index.js';

const mix = (a, b) => (Math.imul((a ^ (a >>> 15)) >>> 0, 0x2c1b3c6d) ^ Math.imul((b + 0x9e3779b9) >>> 0, 0x297a2d39)) >>> 0;

/** Text → číslo (pro sůl podle jména předvolby). */
export function hashText(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

export function makeRng(seed, salt = 0) {
  let state = mix(seed >>> 0, salt >>> 0);
  const next = () => {
    const [v, s] = rngNext(state);
    state = s;
    return v;
  };
  const api = {
    next,
    /** Celé číslo od a do b včetně. */
    int: (a, b) => a + Math.floor(next() * (b - a + 1)),
    range: (a, b) => a + next() * (b - a),
    chance: (p) => next() < p,
    pick: (list) => list[Math.floor(next() * list.length)],
    /** Výběr podle vah: items = [[hodnota, váha], …]. */
    weighted(items) {
      const total = items.reduce((s, it) => s + it[1], 0);
      let t = next() * total;
      for (const [v, w] of items) {
        t -= w;
        if (t < 0) return v;
      }
      return items[items.length - 1][0];
    },
    shuffle(list) {
      const out = [...list];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    /** Nezávislý proud odvozený ze seedu a soli, ne z aktuálního stavu. */
    fork: (s) => makeRng(seed, mix(salt >>> 0, typeof s === 'string' ? hashText(s) : s >>> 0)),
  };
  return api;
}
