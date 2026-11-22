// Veřejné rozhraní jádra. Ostatní vrstvy importují odsud, ne z jednotlivých souborů.
export { createEngine, PHASES, TRANSITIONS, KERNEL_EVENTS } from './engine.js';
export { rngNext } from './rng.js';
export { createStore } from './store.js';
