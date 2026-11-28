// Pixelbilder fuer die Kuttenansicht im Merch-Stand: die Weste von vorne und von
// hinten, je 130x150, in dieser Reihenfolge: 0 vorne, 1 hinten.
//
// Nur die Weste selbst: Jeans-Twill, Naht als Treppe, Nieten, vorn das Hemd in der
// Mitte, hinten das Band fuer den Rocker. Aufnaeher und Rueckenpatch kommen als
// eigene Bilder darueber (js/kuttenansicht.js, app.js) — hier ist nichts davon doppelt.
//
// Gezeichnet wird hier, nicht von Hand im PNG (siehe CLAUDE.md). Die Plaetze der
// Aufnaeher stehen in js/kuttenansicht.js und liegen alle auf dem Stoff.

export const B = 130;
export const H = 150;

export const PALETTE = {
  T: '1f2a36',   // Jeans
  t: '243241',   // Jeans, Twill
  O: '0b0f14',   // Kontur
  S: '45627a',   // Naht
  K: '141216',   // Hemd, vorne in der Mitte
  C: 'c0c6cc',   // Niete
  B: '0e0c09'    // Rockerband
};

const OBEN = 8, UNTEN = 144;

/** Aussenkante links: oben die Armausschnitte, dann gerade runter. */
const aussen = y => {
  if (y < OBEN) return null;
  const k = Math.max(0, 1 - (y - OBEN) / 40);
  let x = 6 + Math.round(16 * k * k);
  if (y > UNTEN - 5) x += 5 - (UNTEN - y);   // Saum: Ecken abgerundet
  return x;
};
/** Innenkante der linken Haelfte vorne: ein V-Ausschnitt, dann gerade. */
const innen = y => y < 40 ? Math.round(44 + (y - OBEN) * 14 / 32) : 58;

const gespiegelt = x => B - 1 - x;

const vorneIn = (x, y) => {
  if (y < OBEN || y > UNTEN) return false;
  const xo = aussen(y), xi = innen(y);
  return (x >= xo && x < xi) || (x > gespiegelt(xi) && x <= gespiegelt(xo));
};
const hintenIn = (x, y) => {
  if (y < OBEN || y > UNTEN) return false;
  const xo = aussen(y);
  if (x < xo || x > gespiegelt(xo)) return false;
  const m = Math.abs(x - (B - 1) / 2), tief = m < 19 ? Math.round(4 * (1 - (m / 19) ** 2)) : 0;
  return y >= OBEN + tief;
};

/** Das Band fuer den Rocker, quer ueber den Ruecken. */
const BAND = { x0: 22, x1: 107, y0: 14, y1: 31 };
const bandIn = (x, y) => {
  if (x < BAND.x0 || x > BAND.x1 || y < BAND.y0 || y > BAND.y1) return false;
  const ex = Math.min(x - BAND.x0, BAND.x1 - x), ey = Math.min(y - BAND.y0, BAND.y1 - y);
  return !(ex < 2 && ey < 2 - ex);   // Ecken abgeschnitten
};

function zeichne(seite) {
  const innenTest = seite === 'vorne' ? vorneIn : hintenIn;
  const raus = (f, x, y, d) => !f(x - d, y) || !f(x + d, y) || !f(x, y - d) || !f(x, y + d);
  const zeilen = [];
  for (let y = 0; y < H; y++) {
    let z = '';
    for (let x = 0; x < B; x++) {
      if (!innenTest(x, y)) {
        // Vorne scheint zwischen den Haelften das Hemd durch.
        const hemd = seite === 'vorne' && y >= OBEN && y <= UNTEN && x >= innen(y) && x <= gespiegelt(innen(y));
        z += hemd ? 'K' : '.';
        continue;
      }
      if (raus(innenTest, x, y, 1)) { z += 'O'; continue; }
      if (raus(innenTest, x, y, 3) && (x + y) % 4 < 2) { z += 'S'; continue; }
      if (seite === 'hinten' && bandIn(x, y)) {
        const rand = !bandIn(x - 1, y) || !bandIn(x + 1, y) || !bandIn(x, y - 1) || !bandIn(x, y + 1);
        const naht = !bandIn(x - 3, y) || !bandIn(x + 3, y) || !bandIn(x, y - 3) || !bandIn(x, y + 3);
        z += rand ? 'O' : naht && (x + y) % 4 < 2 ? 'S' : 'B';
        continue;
      }
      z += ((x + y) >> 1) % 3 === 0 ? 't' : 'T';
    }
    zeilen.push(z);
  }
  if (seite === 'vorne') {
    // Nieten an den Innenkanten, je 2x2
    const g = zeilen.map(z => [...z]);
    for (let y = 52; y < UNTEN - 4; y += 14) {
      const xl = innen(y) - 5, xr = gespiegelt(xl) - 1;
      for (const x0 of [xl, xr]) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) g[y + dy][x0 + dx] = 'C';
    }
    return g.map(z => z.join(''));
  }
  return zeilen;
}

/** Die beiden Raster: [vorne, hinten], je H Zeilen zu B Zeichen. */
export const raster = () => ['vorne', 'hinten'].map(zeichne);
