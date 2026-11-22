// xForge: přehled sady jako dokument (tools/forge/KIT.md). Čistá funkce; zapisuje ji make-kit.mjs, hlídá test b_t2.

/** Dokument: tabulka prefabů a zdůvodnění mezí. Generuje se, neupravuje se ručně. */
export function kitDoc(k) {
  const num = (v) => String(v).replace('.', ',');
  const dims = (p) => [0, 1, 2].map((i) => num(Math.round((p.bounds.max[i] - p.bounds.min[i]) * 100) / 100)).join(' × ');
  const lines = ['# Sada kit_base: přehled', '', 'Generováno příkazem `node tools/forge/make-kit.mjs`. Neupravovat ručně; zdroj je `tools/forge/kit/*.mjs`.', ''];
  lines.push(`Prefabů: ${k.prefabs.length} · materiálů: ${Object.keys(k.materials.materials).length} · trojúhelníků celkem: ${k.prefabs.reduce((s, p) => s + p.tris, 0)}`, '');
  lines.push('| Prefab | Název | Kategorie | Obal š × v × h (m) | △ | Klouby | Interakce |', '|---|---|---|---|---|---|---|');
  for (const p of k.prefabs) {
    const joints = (p.rig.joints || []).map((j) => `${j.id}: ${j.type === 'hinge' ? `${num(j.min)}° až ${num(j.max)}°` : `${num(j.min)} až ${num(j.max)} m`}`).join('; ');
    lines.push(`| \`${p.id}\` | ${p.title} | ${p.category} | ${dims(p)} | ${p.tris} | ${joints || '—'} | ${p.components?.interact?.kind || '—'} |`);
  }
  lines.push('', '## Meze kloubů: zdroj nebo úvaha', '', 'Žádná z mezí nebyla změřena na skutečném předmětu. Kde je uvedeno „úvaha“, jde o odhad z obecné znalosti předmětu.', '');
  lines.push('| Prefab | Kloub | Meze | Zdůvodnění |', '|---|---|---|---|');
  for (const p of k.prefabs) {
    for (const j of p.rig.joints || []) {
      const range = j.type === 'hinge' ? `${num(j.min)}° až ${num(j.max)}°` : `${num(j.min)} až ${num(j.max)} m`;
      lines.push(`| \`${p.id}\` | ${j.id} | ${range} | ${k.notes[p.id][j.id]} |`);
    }
  }
  return lines.join('\n') + '\n';
}
