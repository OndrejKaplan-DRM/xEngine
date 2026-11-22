// Seedovaný generátor mulberry32 v bezstavové podobě: stav je jedno celé číslo,
// takže se dá uložit spolu s herním stavem. Hra, generátory obsahu a efekty mají každý svůj stav.

/** @returns {[number, number]} [hodnota v intervalu 0–1, nový stav] */
export function rngNext(state) {
  const a = (state + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}
