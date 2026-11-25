// Zbraně (N-201, zkušební formát): hodnota podle nabití, odhození a poškození výbuchem.
// Jediné místo těchto vzorců pro běh (sešna A) i nástroje (sešna B); čisté funkce bez alokací.

import { PUSH_MASS } from './formats.js';

/**
 * Hodnota pole zbraně při nabití k (0 až 1, ořízne se). Číslo platí pro každé nabití; { min, max, curve }
 * dává min + (max − min) · k, u curve 'square' · k². Počty (munice) zaokrouhluje běh na celé (Math.round).
 */
export function rampValue(v, k = 0) {
  if (typeof v === 'number') return v;
  if (!v || typeof v !== 'object') return 0;
  const t = k <= 0 ? 0 : k >= 1 ? 1 : k;
  const f = v.curve === 'square' ? t * t : t;
  return v.min + (v.max - v.min) * f;
}

/** Podíl účinku výbuchu ve vzdálenosti d od středu při poloměru r: 1 − d/r, za okrajem 0. */
export function splashFalloff(d, r) {
  return r > 0 && d < r ? 1 - d / r : 0;
}

/** Změna rychlosti tělesa o hmotnosti m (kg) ve vzdálenosti d: push · (1 − d/r) / (1 + m / PUSH_MASS), m/s. */
export function pushDelta(push, d, r, m) {
  return (push * splashFalloff(d, r)) / (1 + Math.max(0, m) / PUSH_MASS);
}
