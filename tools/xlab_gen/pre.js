// Před startem hry: ?level=N (pořadí) nebo ?level=<id> přesune zvolený level balíku na první místo.
// Hra sešny A spouští první level balíku; tenhle obal ji nemění, jen jí podá balík v jiném pořadí.
const pack = globalThis.__PACK__;
const want = new URLSearchParams(location.search).get('level');
const n = /^\d+$/.test(want || '') ? Number(want) : pack.levels.findIndex((l) => l.data.id === want);
if (n > 0 && n < pack.levels.length) pack.levels.unshift(...pack.levels.splice(n, 1));
globalThis.__levels = pack.levels.map((l) => l.data.id);
