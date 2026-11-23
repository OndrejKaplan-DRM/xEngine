// Zámek kurzoru podle protokolu Shellu (Level 1, 02_SHELL, oddíl 3):
// 1. žádá se jen z kliknutí, 2. ztráta zámku = pauza, 3. po uvolnění klávesou Esc prohlížeč nový zámek
// krátce odmítá (odmítnutí se zachytí a hráč klikne znovu), 4. režim bez zámku pro testy a prostředí,
// kde zámek není povolen (vložený rámec bez oprávnění): pohled se pak řídí tažením myši.

export function createLock({ target, doc = document, onLost }) {
  let enabled = true;
  let wanted = false; // hra zámek chce a drží
  let expected = false; // právě probíhající uvolnění je záměrné (pauza z menu, klidný režim)
  let everLocked = false;

  const locked = () => doc.pointerLockElement === target;

  doc.addEventListener('pointerlockchange', () => {
    if (locked()) {
      everLocked = true;
      return;
    }
    const was = wanted;
    wanted = false;
    if (expected) expected = false;
    else if (was) onLost();
  });

  function request() {
    // novější prohlížeče vracejí slib, starší nic a ohlásí se událostí
    return new Promise((resolve, reject) => {
      let done = false;
      const finish = (ok, err) => {
        if (done) return;
        done = true;
        doc.removeEventListener('pointerlockchange', onChange);
        doc.removeEventListener('pointerlockerror', onError);
        if (ok) resolve();
        else reject(err || new Error('zámek kurzoru odmítnut'));
      };
      const onChange = () => finish(locked());
      const onError = () => finish(false);
      doc.addEventListener('pointerlockchange', onChange);
      doc.addEventListener('pointerlockerror', onError);
      let p;
      try {
        p = target.requestPointerLock();
      } catch (e) {
        finish(false, e);
        return;
      }
      if (p && typeof p.then === 'function') p.then(() => finish(true), (e) => finish(false, e));
    });
  }

  return {
    get locked() {
      return locked();
    },
    get enabled() {
      return enabled;
    },
    /** Režim bez zámku (testy, prostředí bez oprávnění). */
    disable() {
      enabled = false;
      wanted = false;
    },
    /**
     * Volat jen z obsluhy kliknutí nebo klávesy.
     * @returns {Promise<'ok' | 'off' | 'retry' | 'denied'>} retry = prohlížeč dočasně odmítá (po Esc), klikni znovu;
     *   denied = zámek tu nejde získat vůbec (nikdy se nepovedl).
     */
    async acquire() {
      if (!enabled) return 'off';
      if (locked()) {
        wanted = true;
        return 'ok';
      }
      if (typeof target.requestPointerLock !== 'function') return 'denied';
      try {
        await request();
        wanted = true;
        return 'ok';
      } catch {
        return everLocked ? 'retry' : 'denied';
      }
    },
    /** Záměrné uvolnění: nevyvolá onLost. */
    release() {
      wanted = false;
      if (locked()) {
        expected = true;
        doc.exitPointerLock();
      }
    },
  };
}
