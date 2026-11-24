// xRender: materiály z dat xSpace. Světlo se počítá po vrcholech (D-022): model 'lit' je materiál bez výpočtu
// světel, který barvu násobí barvou vrcholů; 'unlit' a 'emissive' na světlo nereagují. Varianta „:off“ je zhasnutý
// svítící povrch (lampa).
//
// Textura barvy (A2.6, D-030): pole `albedo` (cesta vůči kořeni balíku) se čte ze souborů balíku (assets.bytes).
// Barva materiálu s texturou je její PRŮMĚRNÁ barva (návrh N-009, varianta a sešny B; rozhoduje svodná): kreslí se
// textura × (color / průměr textury) × světlo vrcholu. Průměr bere z pole `albedoMean` (N-009 a1), jinak ho spočítá
// z dekódovaného obrázku (a2). Bez textury i s ní je tak průměr povrchu týž (stupeň 0, xBake, xView kreslí `color`).
// Obrázek se dekóduje asynchronně; do té doby kreslí bílá 1 × 1, tedy samotná `color`.
// Stupeň low (T460): textura nejvýš 512 px na delší straně (zmenšení při dekódování, data nesou plnou kvalitu, D-029).

import * as THREE from 'three';
import { isTransparent } from './opacity.js';

const OFF_FACTOR = 0.08;
/** Nejdelší strana textury na stupni low (zadání A2.6). */
export const TEXTURE_MAX_LOW = 512;
/** N-009 varianta a: `color` materiálu s texturou je průměr povrchu (false = glTF: color násobí texturu). */
export const COLOR_IS_MEAN = true;

const SRGB_TO_LINEAR = Float32Array.from({ length: 256 }, (_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});

/** Průměrná barva obrázku lineárně (N-009 a2): ze všech bodů dekódovaného obrázku, ne ze zmenšeniny na 1 bod. */
function linearMean(img) {
  const c = new OffscreenCanvas(img.width, img.height);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  const m = [0, 0, 0];
  for (let i = 0; i < d.length; i += 4) {
    m[0] += SRGB_TO_LINEAR[d[i]];
    m[1] += SRGB_TO_LINEAR[d[i + 1]];
    m[2] += SRGB_TO_LINEAR[d[i + 2]];
  }
  const n = d.length / 4;
  return m.map((v) => v / n);
}

/** Barva materiálu, která s texturou dá průměr `color`. */
function colorOver(color, mean) {
  return color.map((c, i) => c / Math.max(mean[i], 1e-3));
}

function whiteTexture() {
  const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
}

export function createMaterials({ onChange = null } = {}) {
  let defs = {};
  let assets = null;
  const cache = new Map();
  const variants = []; // odvozené materiály (textura světla, N-110); uvolní se s levelem
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
    const rec = { tex: white, users: new Set(), w: 0, h: 0, src: null, mean: null };
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
        Object.assign(rec, { tex: t, w: img.width, h: img.height, src, mean: COLOR_IS_MEAN ? linearMean(img) : null });
        for (const m of rec.users) {
          m.map = t;
          if (COLOR_IS_MEAN) m.color.setRGB(...colorOver(m.userData.color, m.userData.albedoMean || rec.mean));
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
    if (tex) {
      m.userData.color = d.color;
      m.userData.albedoMean = Array.isArray(d.albedoMean) ? d.albedoMean : null; // N-009 a1, když ho data nesou
      tex.users.add(m);
      if (COLOR_IS_MEAN && tex.mean) m.color.setRGB(...colorOver(d.color, m.userData.albedoMean || tex.mean));
    }
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
      for (const m of variants) m.dispose();
      variants.length = 0;
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
    /** Načtené textury: [{ path, w, h, src, mean }] (src = rozměr v datech, w × h po zmenšení na stupeň, mean lineárně). */
    textures() {
      return [...textures].filter(([, r]) => r && r.src).map(([path, r]) => ({ path, w: r.w, h: r.h, src: r.src, mean: r.mean }));
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
    /**
     * Varianta materiálu s texturou světla (zkouška N-110): bez barvy vrcholů, světlo z lightMap (kanál UV 1).
     * Když materiál čeká na texturu barvy, dostane ji varianta taky.
     */
    withLightMap(id, lightMap) {
      const base = sys.get(id);
      const m = base.clone();
      m.name = `${id}|lightmap`;
      m.vertexColors = false;
      m.lightMap = lightMap;
      for (const rec of textures.values()) if (rec && rec.users.has(base)) rec.users.add(m);
      variants.push(m);
      return m;
    },
  };
  return sys;
}
