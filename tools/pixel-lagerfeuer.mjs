// Pixelbilder fuer Lagerfeuer und Tagesgegner, fuer assets/pixel/lagerfeuer.png
// (gebaut von tools/pixel.mjs). Eigene Pixel-Art, keine fremden Grafiken.
//
// Ein Bogen, 96 x 24:
//   0..23    der Gegner des Tages, lebendig: ein Verstaerker mit Augen und Zaehnen
//   24..47   derselbe, besiegt (Kreuzaugen, Riss, Kegel kaputt)
//   48..63   der Roadie, steht (16 x 18)
//   64..79   der Roadie jubelt
//   80..95   der Roadie sitzt am Feuer und doest
// Das eine Gegnerbild wird in der Oberflaeche je Wochentag umgefaerbt.

export const KANTE = 24;
export const FIGUR_B = 16, FIGUR_H = 18;
export const BOGEN_B = 96, BOGEN_H = 24;

export const GEGNER_FARBE = {
  K: '141216', B: '3a3a46', b: '565664', D: '24242c', G: '1b1b22', g: '747484',
  R: 'e0483a', Y: 'f2c94c', W: 'eeeae0', C: '8a2a24'
};

/** Ein Raster aus Zeichenketten, gebaut aus Rechtecken und Punkten, damit die Breite stimmt. */
function raster(b, h, zeichne) {
  const g = Array.from({ length: h }, () => Array(b).fill('.'));
  const p = (x, y, c) => { if (y >= 0 && y < h && x >= 0 && x < b) g[y][x] = c; };
  const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) p(x, y, c); };
  zeichne({ p, rect });
  return g.map(z => z.join(''));
}

function gegner(besiegt) {
  return raster(KANTE, KANTE, ({ p, rect }) => {
    // Hoerner (Kabel), links und rechts
    for (const [x, y] of [[4, 1], [3, 2], [4, 2], [2, 3], [3, 3], [19, 1], [20, 2], [19, 2], [21, 3], [20, 3]]) p(x, y, 'K');
    for (const [x, y] of [[4, 3], [19, 3]]) p(x, y, 'b');
    // Gehaeuse mit Rand
    rect(2, 4, 21, 22, 'K');
    rect(3, 5, 20, 21, besiegt ? 'D' : 'B');
    rect(3, 5, 20, 5, besiegt ? 'D' : 'b');             // Lichtkante oben
    // Augen
    if (!besiegt) {
      rect(6, 8, 9, 11, 'R'); rect(14, 8, 17, 11, 'R');
      rect(7, 9, 8, 10, 'Y'); rect(15, 9, 16, 10, 'Y');
      rect(5, 7, 9, 7, 'K'); rect(14, 7, 18, 7, 'K');   // finstere Brauen
      p(10, 8, 'K'); p(13, 8, 'K');
    } else {
      for (const ox of [6, 14]) { for (let i = 0; i < 4; i++) { p(ox + i, 8 + i, 'K'); p(ox + 3 - i, 8 + i, 'K'); } }
    }
    // Lautsprecher-Maul mit Schlitzen
    rect(5, 13, 18, 19, 'G');
    for (let x = 6; x <= 17; x += 2) rect(x, 14, x, 18, besiegt && x % 4 === 2 ? 'G' : 'g');
    // Zaehne (Regler)
    if (!besiegt) for (const x of [6, 10, 14]) { rect(x, 20, x + 1, 21, 'W'); }
    else for (const x of [6, 14]) p(x, 20, 'W');
    // Riss
    if (besiegt) for (const [x, y] of [[12, 5], [11, 6], [12, 7], [13, 8], [12, 9], [11, 10], [12, 11], [13, 12], [12, 13], [11, 14], [12, 15]]) p(x, y, 'K');
    // Fuesse
    rect(3, 23, 7, 23, 'K'); rect(16, 23, 20, 23, 'K');
  });
}

export const GEGNER_LEBENDIG = gegner(false);
export const GEGNER_BESIEGT = gegner(true);

/* ---------------- Roadie ---------------- */

export const FIGUR_FARBE = {
  k: '17171c', s: 'f1c08e', h: 'd64534', H: 'a8302a', b: '7a4a2a', t: '26262e', w: 'e9e9ee',
  j: '3d5f9a', y: 'f2c94c'
};

const BASIS = [
  '................',
  '.....hhhhhh.....',
  '....hhhhhhhh....',
  '....HHHHHHHH....',
  '....ssssssss....',
  '....ssssssss....',
  '....ssssssss....',
  '....sbbbbbbs....',
  '.....bbbbbb.....',
  '...tttttttttt...',
  '..sttttwwtttts..',
  '..sttwwwwwwtts..',
  '..stttwwwwttts..',
  '...tttttttttt...',
  '....jjjjjjjj....',
  '....jjj..jjj....',
  '....jjj..jjj....',
  '...kkkk..kkkk...'
];

/** Augen sind zwei Punkte in Reihe 5 bei Spalte 5 und 10. */
function figur(art) {
  const g = BASIS.map(z => z.split(''));
  const p = (y, x, c) => { if (g[y] && x >= 0 && x < FIGUR_B) g[y][x] = c; };
  p(5, 5, 'k'); p(5, 10, 'k');
  if (art === 'jubel') {
    // Arme hoch, Mund auf
    for (const y of [10, 11, 12]) { p(y, 2, 't'); p(y, 13, 't'); }
    for (const [y, x] of [[4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [4, 13], [5, 13], [6, 13], [7, 13], [8, 13], [9, 13]]) p(y, x, 's');
    p(6, 7, 'k'); p(6, 8, 'k');
  }
  if (art === 'sitzt') {
    // Augen zu, breiter Stand
    p(5, 5, 'k'); p(5, 6, 'k'); p(5, 9, 'k'); p(5, 10, 'k');
    for (const x of [4, 5, 6, 9, 10, 11]) p(16, x, 'j');
    for (let x = 3; x <= 12; x++) p(17, x, 'k');
  }
  return g.map(z => z.join(''));
}

export const FIGUR_STEHT = figur('steht');
export const FIGUR_JUBEL = figur('jubel');
export const FIGUR_SITZT = figur('sitzt');
