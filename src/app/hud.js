// HUD: zaměřovací bod, nápověda akce, krátká oznámení. Čistý DOM, mění se jen při změně textu
// (žádná práce ve snímku, když se nic neděje). Časování oznámení jde přes snímky, ne přes setTimeout.

export function createHud({ root }) {
  const el = (cls) => {
    const n = document.createElement('div');
    n.className = cls;
    root.append(n);
    return n;
  };
  const cross = el('hud-cross');
  const prompt = el('hud-prompt');
  const notice = el('hud-notice');
  const dev = el('hud-dev');
  const ammo = el('hud-ammo');
  prompt.hidden = notice.hidden = dev.hidden = ammo.hidden = true;
  let ammoText = '';

  let promptText = '';
  let noticeLeft = 0;
  let devText = '';

  return {
    /** Nápověda akce pod zaměřovačem; prázdný text ji schová. */
    setPrompt(text) {
      if (text === promptText) return;
      promptText = text;
      prompt.textContent = text;
      prompt.hidden = !text;
    },
    /** Oznámení na daný počet sekund skutečného času. */
    notify(text, seconds = 3) {
      notice.textContent = text;
      notice.hidden = !text;
      noticeLeft = text ? seconds : 0;
    },
    /** Zbraň a munice vpravo dole (A3.1); prázdný text = bez zbraně. */
    setAmmo(text) {
      if (text === ammoText) return;
      ammoText = text;
      ammo.textContent = text;
      ammo.hidden = !text;
    },
    setCross(on) {
      cross.hidden = !on;
    },
    setDev(text) {
      if (text === devText) return;
      devText = text;
      dev.textContent = text;
      dev.hidden = !text;
    },
    frame(real) {
      if (noticeLeft > 0) {
        noticeLeft -= real;
        if (noticeLeft <= 0) notice.hidden = true;
      }
    },
    get state() {
      return { prompt: promptText, notice: notice.hidden ? '' : notice.textContent, ammo: ammoText };
    },
  };
}
