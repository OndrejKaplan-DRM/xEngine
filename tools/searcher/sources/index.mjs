// Seznam zdrojů xSearcheru. Používají se jen zdroje se strojovým rozhraním a jedinou doloženou licencí CC0.
import * as polyhaven from './polyhaven.mjs';
import * as ambientcg from './ambientcg.mjs';

export const SOURCES = {
  polyhaven: { ...polyhaven.SOURCE, api: polyhaven },
  ambientcg: { ...ambientcg.SOURCE, api: ambientcg },
};

/** Zdroje ze zadání, které nástroj nepoužívá, a proč (měření v ZDROJE.md). */
export const NOT_USED = {
  kenney: 'Kenney: ze sandboxu nedosažitelný (403, 22. 11. 2026)',
  opengameart: 'OpenGameArt: jen stránky, licence se liší asset od assetu; nástroj ho nepoužívá',
  quaternius: 'Quaternius: jen stránky a stylizované modely; nástroj ho nepoužívá',
  sketchfab: 'Sketchfab: ze sandboxu neprojde (22. 11. 2026)',
  freesound: 'Freesound: stahování chce účet',
};

/** Druhy assetů. Ondřej 24. 11. 2026 (volba 2 a): z webu jen materiály a textury, tvary vlastní. */
export const TYPES = {
  texture: { ok: true },
  model: { ok: false, why: 'modely z webu nestahuju: Ondřej 24. 11. 2026 zvolil „z webu jen materiály a textury, tvary vlastní“ (otázka 2 a)' },
  sound: { ok: false, why: 'žádný zdroj se strojovým rozhraním bez účtu a s licencí CC0 jsem zatím nenašla (ZDROJE.md)' },
};

export function sourceList(names) {
  const list = names ? names.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) : Object.keys(SOURCES);
  const use = [];
  const skipped = [];
  for (const n of list) {
    if (SOURCES[n]) use.push(SOURCES[n]);
    else skipped.push(NOT_USED[n] ?? `${n}: neznámý zdroj`);
  }
  return { use, skipped };
}
