// xRender: materiály z dat xSpace. Světlo se počítá po vrcholech (D-022): model 'lit' je materiál bez výpočtu
// světel, který barvu násobí barvou vrcholů; 'unlit' a 'emissive' na světlo nereagují. Varianta „:off“ je zhasnutý
// svítící povrch (lampa).
//
// Textura barvy (A2.6, D-030): pole `albedo` (cesta vůči kořeni balíku) se čte ze souborů balíku (assets.bytes).
// Výsledek = barva materiálu × textura × světlo vrcholu, takže zapečené i počítané světlo texturu násobí.
// Obrázek se dekóduje asynchronně; do té doby kreslí bílá 1 × 1 (vypadá jako materiál bez textury).
// Stupeň low (T460): textura nejvýš 512 px na delší straně (zmenšení při dekódování, data nesou plnou kvalitu, D-029).

import * as THREE from 'three';
import { isTransparent } from './opacity.js';

const OFF_FACTOR = 0.08;
/** Nejdelší strana textury na stupni low (zadání A2.6). */
export const TEXTURE_MAX_LOW = 512;

function whiteTexture() {
  const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
}

export function createMaterials({ onChange = null } = {}) {
  let defs = {};
  let assets = null;
  const cache = new Map();
  const textures = new Map(); // cesta → { tex, users: Set(materiál), w, h, src: [w, h] }
  const white = whiteTexture();
  let gen = 0; // načtení levelu: dekódování ze starého levelu se zahodí
  const stat = { textures: 0, pending: 0, failed: 0, texels: 0, missing: 0 };
  const warned = new Set();
  const warn = (msg) => {
    if (warned.has(msg)) return;
    warned.add(msg);
    console.info(`xRender: ${msg}`);
  };

  async function decode(bytes, max) {
    const blob = new Blob([bytes]);
    // obraz se převrací při dekódování (ImageBitmap nebere flipY z WebGL): v = 0 dole jako u UV z geom.js a glb.js
    const full = await createImageBitmap(blob, { imageOrientation: 'flipY' });
    const k = Math.min(1, max / Math.max(full.width, full.height));
    if (k >= 1) return { img: full, src: [full.width, full.height] };
    const w = Math.max(1, Math.round(full.width * k));
    const h = Math.max(1, Math.round(full.height * k));
    const img = await createImageBitmap(full, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' });
    const src = [full.width, full.height];
    full.close();
    return { img, src };
  }

  /** Záznam textury pro cestu; dekódování běží na pozadí a po dokončení vymění mapu všem uživatelům. */
  function texture(path) {
    if (textures.has(path)) return textures.get(path);
    const bytes = assets?.bytes(path);
    if (!bytes) {
      stat.missing++;
      warn(`textura „${path}“ ve hře není (pack.files); materiál se kreslí jen barvou`);
      textures.set(path, null);
      return null;
    }
    const rec = { tex: white, users: new Set(), w: 0, h: 0, src: null };
    textures.set(path, rec);
    stat.pending++;
    const g = gen;
    decode(bytes, sys.maxSize)
      .then(({ img, src }) => {
        if (g !== gen) return img.close();
        const t = new THREE.Texture(img);
        t.flipY = false;
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.generateMipmaps = true;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.needsUpdate = true;
        Object.assign(rec, { tex: t, w: img.width, h: img.height, src });
        for (const m of rec.users) {
          m.map = t;
          m.needsUpdate = true;
        }
        stat.pending--;
        stat.textures++;
        stat.texels += img.width * img.height;
        onChange?.(path);
      })
      .catch((e) => {
        if (g !== gen) return;
        stat.pending--;
        stat.failed++;
        warn(`textura „${path}“ se nedekódovala: ${e.message}`);
      });
    return rec;
  }

  function make(id) {
    const off = id.endsWith(':off');
    const d = defs[off ? id.slice(0, -4) : id];
    if (!d) throw new Error(`Materiál „${id}“ v balíku není.`);
    const side = d.twoSided ? THREE.DoubleSide : THREE.FrontSide;
    // průhlednost (N-005): kreslí se po neprůhledných (three řadí průhledné zvlášť) a nezapisuje do hloubky
    const glass = isTransparent(d) ? { transparent: true, opacity: d.opacity, depthWrite: false } : {};
    const tex = d.albedo && d.model !== 'emissive' ? texture(d.albedo) : null;
    const map = tex ? { map: tex.tex } : {};
    let m;
    if (d.model === 'lit') m = new THREE.MeshBasicMaterial({ color: new THREE.Color(...d.color), side, vertexColors: true, ...glass, ...map });
    else if (d.model === 'unlit') m = new THREE.MeshBasicMaterial({ color: new THREE.Color(...d.color), side, ...glass, ...map });
    else {
      // emissive: barva svitu krát síla; převod do rozsahu displeje udělá expozice a tónová křivka
      const k = off ? OFF_FACTOR : (d.emissiveStrength ?? 1);
      const e = d.emissive || d.color;
      m = new THREE.MeshBasicMaterial({ color: new THREE.Color(e[0] * k, e[1] * k, e[2] * k), side, ...glass });
    }
    tex?.users.add(m);
    return m;
  }

  const sys = {
    stat,
    /** Nejdelší strana textury po dekódování (px). Mění se před načtením levelu; low = TEXTURE_MAX_LOW. */
    maxSize: TEXTURE_MAX_LOW,
    /** Nová sada definic (při načtení levelu) a zdroj souborů balíku. Staré materiály a textury se uvolní. */
    setDefs(next, files = null) {
      for (const m of cache.values()) m.dispose();
      cache.clear();
      for (const rec of textures.values()) if (rec && rec.tex !== white) rec.tex.dispose();
      textures.clear();
      gen++;
      Object.assign(stat, { textures: 0, pending: 0, failed: 0, texels: 0, missing: 0 });
      defs = next || {};
      assets = files;
    },
    has: (id) => id in defs,
    def: (id) => defs[id],
    isEmissive: (id) => defs[id]?.model === 'emissive',
    /** Materiál reaguje na světlo: jeho síť nese barvu vrcholů. */
    isLit: (id) => defs[id]?.model === 'lit',
    /** Materiál je průhledný (opacity pod 1). */
    isTransparent: (id) => isTransparent(defs[id]),
    /** Načtené textury: [{ path, w, h, src }] (src = rozměr v datech, w × h = po zmenšení na stupeň). */
    textures() {
      return [...textures].filter(([, r]) => r && r.src).map(([path, r]) => ({ path, w: r.w, h: r.h, src: r.src }));
    },
    get(id) {
      let m = cache.get(id);
      if (!m) {
        m = make(id);
        m.name = id;
        cache.set(id, m);
      }
      return m;
    },
    get count() {
      return cache.size;
    },
  };
  return sys;
}
