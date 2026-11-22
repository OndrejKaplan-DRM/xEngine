// Před startem xView: ?level=N přesune N-tý level balíku na první místo,
// ?eye=x,y,z posune výchozí místo hráče (pohled „Start“ se dívá ve směru −Z; slouží ke kontrole okem).
const pack = globalThis.__PACK__;
const q = new URLSearchParams(location.search);
globalThis.__xgen = { levels: pack.levels.map((l) => ({ id: l.data.id, title: l.data.title })), current: 0 };
const n = Number(q.get('level') || 0);
if (Number.isInteger(n) && n > 0 && n < pack.levels.length) {
  pack.levels.unshift(...pack.levels.splice(n, 1));
  globalThis.__xgen.current = n;
}
const eye = (q.get('eye') || '').split(',').map(Number);
if (eye.length === 3 && eye.every(Number.isFinite)) pack.levels[0].data.spawns.find((s) => s.kind === 'player').pos = eye;
