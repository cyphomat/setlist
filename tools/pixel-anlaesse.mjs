// Die Motive der Anlass-Banner, als Zeichenraster. tools/pixel.mjs macht
// daraus assets/pixel/anlaesse.png.
//
// Eigene Pixel-Art. Jedes Motiv ist 15 x 15 und hat zwei Bilder, die der
// Banner per CSS steps(2) umschaltet. Reihenfolge und Namen sind MOTIVE in
// js/anlaesse.js; pixel.mjs prueft, dass beides zusammenpasst.

export const KANTE = 15;

/** Zeichen im Raster → Farbe. '.' ist durchsichtig. */
export const PALETTE = {
  G: '2f8a43', g: '1d5c2e', h: '5fbf6a', T: '7a4a22', t: '4f2f14',
  Y: 'f2c14e', W: 'f6f2e8', R: 'd2423a', r: 'e8645a', o: '8e2a25', B: '4aa3df'
};

const leerZeile = () => '.'.repeat(KANTE);
const raster = () => Array.from({ length: KANTE }, () => leerZeile().split(''));
const setze = (r, y, x, c) => { r[y][x] = c; };
const zeilen = r => r.map(z => z.join(''));

/* Tannenbaum: Reihen mit wachsender Breite, aussen dunkel, innen hell.
   Die Lichterkette wechselt von Bild zu Bild die Farben, der Stern blinkt. */
const BAUM = [1, 3, 5, 3, 5, 7, 9, 7, 9, 11, 13];     // Reihe 2 bis 12
const LICHTER = [[4, 7], [6, 6], [7, 9], [8, 5], [8, 10], [10, 4], [10, 9], [11, 6], [12, 3], [12, 8], [12, 11]];
const LICHT_FARBEN = ['R', 'Y', 'B'];

function tannenbaum(bild) {
  const r = raster();
  setze(r, 0, 7, bild ? 'W' : 'Y');
  for (const x of [6, 7, 8]) setze(r, 1, x, 'Y');
  BAUM.forEach((breite, i) => {
    const y = 2 + i, links = 7 - (breite - 1) / 2;
    for (let k = 0; k < breite; k++) {
      const rand = k === 0 || k === breite - 1;
      setze(r, y, links + k, rand ? 'g' : (k === 1 && breite > 3 ? 'h' : 'G'));
    }
  });
  LICHTER.forEach(([y, x], i) => {
    if (r[y][x] === '.') throw new Error(`Tannenbaum: Licht (${y},${x}) sitzt neben dem Baum`);
    setze(r, y, x, LICHT_FARBEN[(i + bild) % 3]);
  });
  for (const y of [13, 14]) for (const x of [6, 7, 8]) setze(r, y, x, x === 8 ? 't' : 'T');
  return zeilen(r);
}

/* Geschenk: rote Kiste mit gelbem Band, die Schleife wippt, ein Funke blitzt. */
function geschenk(bild) {
  const r = raster();
  const schleife = bild
    ? ['.'.repeat(KANTE), '....YYY.YYY....', '...Y...Y...Y...', '....YYYYYYY....']
    : ['....YYY.YYY....', '...Y...Y...Y...', '....YYY.YYY....', '......YYY......'];
  schleife.forEach((z, i) => { for (let x = 0; x < KANTE; x++) if (z[x] !== '.') setze(r, 2 + i, x, z[x]); });
  setze(r, bild ? 3 : 1, bild ? 1 : 12, 'W');
  // Deckel: Reihen 6 bis 8, Spalten 1 bis 13
  for (let x = 1; x <= 13; x++) { setze(r, 6, x, 'o'); setze(r, 8, x, 'o'); }
  for (let x = 2; x <= 12; x++) setze(r, 7, x, 'R');
  setze(r, 7, 1, 'o'); setze(r, 7, 13, 'o');
  // Kiste: Reihen 9 bis 14, Spalten 2 bis 12
  for (let y = 9; y <= 13; y++) { setze(r, y, 2, 'o'); setze(r, y, 12, 'o'); for (let x = 3; x <= 11; x++) setze(r, y, x, 'R'); }
  for (let x = 2; x <= 12; x++) setze(r, 14, x, 'o');
  for (let y = 10; y <= 12; y++) setze(r, y, 3, 'r');
  setze(r, 7, 3, 'r');
  // Band: senkrecht in der Mitte, ueber Deckel und Kiste
  for (let y = 6; y <= 14; y++) for (const x of [6, 7, 8]) setze(r, y, x, 'Y');
  return zeilen(r);
}

const BAUER = { tannenbaum, geschenk };

/** Je Motiv zwei Raster (Bild 1, Bild 2), in der Reihenfolge von MOTIVE. */
export function motivRaster(ids) {
  return ids.map(id => {
    if (!BAUER[id]) throw new Error(`Kein Motiv fuer ${id} in tools/pixel-anlaesse.mjs`);
    const bilder = [BAUER[id](0), BAUER[id](1)];
    for (const b of bilder) {
      if (b.length !== KANTE || b.some(z => z.length !== KANTE)) throw new Error(`${id}: Raster nicht ${KANTE} x ${KANTE}`);
      for (const z of b) for (const c of z) if (c !== '.' && !PALETTE[c]) throw new Error(`${id}: unbekanntes Zeichen ${c}`);
    }
    if (bilder[0].join() === bilder[1].join()) throw new Error(`${id}: beide Bilder gleich, dann bewegt sich nichts`);
    return bilder;
  });
}
