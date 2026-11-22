// Společný základ testů sešny B v Node: počítadlo kontrol ve stejném tvaru výpisu jako testy základu.
export function makeChecker(label) {
  let pass = 0;
  let fail = 0;
  return {
    ok(cond, name, detail = '') {
      if (cond) pass++;
      else fail++;
      console.log(`${cond ? '  ok  ' : 'CHYBA '} ${name}${detail ? '  [' + detail + ']' : ''}`);
      return Boolean(cond);
    },
    finish() {
      console.log(`\n${label}: ${pass} prošlo, ${fail} selhalo`);
      return fail ? 1 : 0;
    },
  };
}
export const median = (a) => [...a].sort((p, q) => p - q)[Math.floor(a.length / 2)];
export const span = (a, d = 0) => `${Math.min(...a).toFixed(d)} až ${Math.max(...a).toFixed(d)}, medián ${median(a).toFixed(d)}`;
