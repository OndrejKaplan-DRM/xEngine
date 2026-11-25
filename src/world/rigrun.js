// xWorld: kostra entity v kroku (N-102). rigCompile jednou na prefab (výsledek jen pro čtení, sdílí ho všechny
// entity téhož prefabu), pole hodnot a matic jednou na entitu; v kroku rigFollow (svázané klouby, N-002) a
// rigSolve bez alokací. Matice uzlu i je v ent.rig.mats od 16 i (pohyblivé díly mají pohled rec.view).

import { rigCompile, rigValues, rigFollow, rigSolve } from '../xspace/index.js';

export function createRigRun() {
  const compiled = new WeakMap();
  return {
    /** Přeloží kostru prefabu (jednou) a dá entitě ent.rig = { C, vals, mats }. Vrací C. */
    attachRig(ent, prefab) {
      let C = compiled.get(prefab);
      if (!C) compiled.set(prefab, (C = rigCompile(prefab)));
      ent.rig = { C, vals: rigValues(C, {}), mats: new Float64Array(16 * C.count) };
      return C;
    },
    /**
     * Matice uzlů z hodnot kloubů do ent.rig.mats (o = kloub, jehož hodnotu zkusit místo současné, ov = ta
     * hodnota). Svázané klouby dostanou hodnotu od sledovaného (zapíše se i do j.value). Vrací ent.rig.mats.
     */
    solve(ent, o = null, ov = 0) {
      const R = ent.rig;
      const J = ent.joints; // klouby entity jsou v pořadí prefab.rig.joints = pořadí C.jointIds
      for (let k = 0; k < J.length; k++) R.vals[k] = J[k] === o ? ov : J[k].value;
      const F = R.C.fOrder;
      if (F.length) {
        rigFollow(R.C, R.vals);
        for (let n = 0; n < F.length; n++) if (J[F[n]] !== o) J[F[n]].value = R.vals[F[n]];
      }
      for (let k = 0; k < J.length; k++) ent.values[J[k].def.id] = R.vals[k];
      return rigSolve(R.C, R.vals, R.mats);
    },
  };
}
