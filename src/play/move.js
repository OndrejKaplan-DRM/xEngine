// xPlay: pohyb jsou tři funkce, ne posouvání souřadnic (Level 1, 10_CASE_FPS, invariant F3; původ Quake).
// Čisté funkce nad polem rychlosti [x, y, z] v m/s; kolize, schody a skluz řeší kontrolér postavy v xPhys.
// Úkroky ve vzduchu a série výskoků nejsou zvláštní kód: vzniknou z toho, že accelerate omezuje jen průmět
// rychlosti do směru přání.

/** Tření na zemi: ubírá vodorovnou rychlost, pod stopSpeed lineárně (postava nedoklouzává donekonečna). */
export function friction(vel, P, dt) {
  const speed = Math.hypot(vel[0], vel[2]);
  if (speed < 0.01) {
    vel[0] = 0;
    vel[2] = 0;
    return;
  }
  const drop = Math.max(speed, P.stopSpeed) * P.friction * dt;
  const k = Math.max(speed - drop, 0) / speed;
  vel[0] *= k;
  vel[2] *= k;
}

/** Zrychlení ve směru přání (wx, wz je jednotkový vodorovný vektor): přidá jen to, co ve směru přání chybí. */
export function accelerate(vel, wx, wz, wishSpeed, accel, dt) {
  const add = wishSpeed - (vel[0] * wx + vel[2] * wz);
  if (add <= 0) return;
  const a = Math.min(accel * wishSpeed * dt, add);
  vel[0] += wx * a;
  vel[2] += wz * a;
}

/** Odečte z rychlosti složku do plochy s normálou n (Quake: ClipVelocity). Jen když rychlost míří do plochy. */
export function clipVelocity(vel, nx, ny, nz) {
  const into = vel[0] * nx + vel[1] * ny + vel[2] * nz;
  if (into >= 0) return false;
  vel[0] -= nx * into;
  vel[1] -= ny * into;
  vel[2] -= nz * into;
  return true;
}
