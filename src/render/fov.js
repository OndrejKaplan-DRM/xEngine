// xRender: zorné pole. Číslo z nastavení je vodorovný úhel při poměru stran 4 : 3 (zvyk Quake a Source: 90 je
// na obrazovce 16 : 9 asi 106°). Svislý úhel z něj plyne a s oknem se nemění; širší okno vidí víc do stran
// („Hor+“). Kamera three.js chce svislý úhel, proto převod tady, na jednom místě.
//
// Proč strop: běžné promítání na rovinu (všechny rovné čáry zůstanou rovné) roztahuje věci tím víc, čím dál jsou
// od středu obrazu. Pod úhlem θ od osy pohledu je předmět roztažený ve směru od středu 1 / cos²θ krát a napříč
// 1 / cos θ krát, takže koule je šišatá 1 / cos θ krát. Při vodorovném úhlu 120° je to na kraji dvakrát, při 144°
// víc než třikrát a mění se to při každém otočení: odtud ztráta orientace.

const RAD = Math.PI / 180;
/** Poměr stran, ke kterému se číslo z nastavení vztahuje. */
export const FOV_REF_ASPECT = 4 / 3;
/** Největší vodorovný úhel, který hra na jakémkoli okně nastaví (stupně). */
export const HFOV_MAX = 120;

/** Svislý úhel z vodorovného při daném poměru stran (šířka / výška). */
export const vfovOf = (h, aspect) => (2 * Math.atan(Math.tan((h * RAD) / 2) / aspect)) / RAD;
/** Vodorovný úhel ze svislého. */
export const hfovOf = (v, aspect) => (2 * Math.atan(Math.tan((v * RAD) / 2) * aspect)) / RAD;
/** Svislý úhel kamery pro číslo z nastavení a okno s poměrem stran aspect, se stropem vodorovného úhlu. */
export const cameraVfov = (setting, aspect) => Math.min(vfovOf(setting, FOV_REF_ASPECT), vfovOf(HFOV_MAX, aspect));
/** Kolikrát je koule na kraji obrazu širší než vyšší (zkreslení tvaru při vodorovném úhlu h). */
export const edgeStretch = (h) => 1 / Math.cos((h * RAD) / 2);
