// xRender: průhlednost materiálu (N-005, D-033). Samostatně, bez three.js: čte ji i stavba světa v Node.

/** Průhledný materiál: opacity pod 1 (výchozí 1). */
export const isTransparent = (d) => !!d && d.opacity !== undefined && d.opacity < 1;
