// Uebungsfiguren aus Gelenkwinkeln, als Pixelbild fuer den Bogen assets/pixel/figuren.png
// (gebaut von tools/pixel.mjs). Seitenansicht, Blick nach rechts, Bilder 76 x 82.
//
// Statt Pixel von Hand zu setzen, stehen hier die Winkel der Gelenke. Der Boden wird aus den
// Stuetzpunkten (Fuss, Hand, Knie) berechnet; schwebt einer, bricht der Bau ab.
// Seitenansicht heisst: was nur von vorn zu sehen ist (Knie nach innen, Ellbogen zwischen den Knien), zeigen die Bilder nicht.
//
// Winkel in Grad, mathematisch (0 = rechts, 90 = oben, 180 = links, 270 = unten),
// jeweils die Richtung vom Gelenk zum naechsten. Laengen sind Pixel, Anteile
// nach einem Erwachsenen von 38 px Hoehe.

const B = 76, H = 82, BODEN = 76;      // Bildgroesse und Bodenlinie
const SK = 1.3;                        // Massstab gegenueber 38 px Koerperhoehe
const KUGEL = 4.6;                     // Radius der Kugel
const L = Object.fromEntries(Object.entries({ thigh: 9.3, shin: 8.7, foot: 3.5, torso: 11.4, neck: 2, head: 3.1, ua: 7.2, fa: 5.6, hand: 2.4 }).map(([k, v]) => [k, v * SK]));
const R = Object.fromEntries(Object.entries({ thigh: 2.1, shin: 1.7, foot: 1.2, torso: 3.2, ua: 1.6, fa: 1.4, neck: 1.6 }).map(([k, v]) => [k, v * SK]));
const FARBE = {
  rand: [20, 18, 22], haut: [236, 204, 174], hautF: [172, 138, 114], shirt: [48, 48, 58], shirtF: [34, 34, 42],
  jeans: [82, 102, 156], jeansF: [52, 64, 104], schuh: [226, 226, 232], schuhF: [150, 150, 160], haar: [70, 44, 30],
  kugel: [200, 44, 48], kugelLicht: [238, 110, 100], griff: [40, 38, 38], boden: [40, 36, 40]
};

const rad = g => g * Math.PI / 180;
const dir = g => [Math.cos(rad(g)), Math.sin(rad(g))];
const plus = (p, g, laenge) => { const d = dir(g); return [p[0] + d[0] * laenge, p[1] + d[1] * laenge]; };

/** Haltung -> Punkte (Hueft-Ursprung, y nach oben). */
export function gelenke(p) {
  const hip = [0, 0];
  const sh = plus(hip, p.torso, L.torso);
  const kopf = plus(sh, p.kopf ?? p.torso, L.neck + L.head);
  const knie = plus(hip, p.thigh, L.thigh), knoechel = plus(knie, p.shin, L.shin), zeh = plus(knoechel, p.foot, L.foot);
  const fKnie = plus(hip, p.fThigh, L.thigh), fKnoechel = plus(fKnie, p.fShin, L.shin), fZeh = plus(fKnoechel, p.fFoot, L.foot);
  const ell = plus(sh, p.ua, L.ua), hand = plus(ell, p.fa, L.fa), faust = plus(hand, p.fa, L.hand);
  const fEll = plus(sh, p.fUa, L.ua), fHand = plus(fEll, p.fFa, L.fa);
  // boden: Kugel steht auf dem Boden, die Faust greift den Henkel; frei: sie steht zwischen den Fuessen, die Haende hängen
  const kugel = p.kugel === 'boden' ? [faust[0], faust[1] - KUGEL - 1.9]
    : p.kugel === 'frei' ? [knoechel[0] + 5, knoechel[1] - R.foot + KUGEL] : null;
  return { hip, sh, kopf, knie, knoechel, zeh, fKnie, fKnoechel, fZeh, ell, hand, faust, fEll, fHand, ...(kugel && { kugel }) };
}

/* ---------------- Haltungen ---------------- */

const STEHEN = { torso: 90, thigh: 270, shin: 270, foot: 0, fThigh: 270, fShin: 270, fFoot: 0 };

// stuetz: Punkte, die den Boden beruehren; passt: [Punkt, [Winkel]] — diese Winkel werden
// so gedreht, dass der Punkt auf dem Boden der festen Stuetzen liegt (statt Winkel zu raten).

/** Hip Hinge: Kugel zwischen den Fuessen. Huefte zurueck, Ruecken lang, Knie kaum gebeugt. */
export const HINGE = [
  { name: 'Stand', ...STEHEN, ua: 270, fa: 270, fUa: 270, fFa: 270, kugel: 'frei', stuetz: ['zeh'] },
  { name: 'Hinge', torso: 30, kopf: 40, thigh: 297, shin: 260, foot: 0, fThigh: 297, fShin: 260, fFoot: 0,
    ua: 255, fa: 255, fUa: 255, fFa: 255, kugel: 'boden', stuetz: ['knoechel', 'kugel'], passt: [['kugel', ['torso', 'kopf']]] }
];

/** Turkish Get-up, von der Seite, Kugel in der nahen (rechten) Hand. */
export const GETUP = [
  { name: '1 Liegen', torso: 180, kopf: 180, thigh: 55, shin: 290, foot: 0, fThigh: 352, fShin: 352, fFoot: 90,
    ua: 90, fa: 90, fUa: 200, fFa: 200, kugel: 'oben', stuetz: ['hip', 'sh', 'knoechel'], passt: [['knoechel', ['shin']]] },
  { name: '2 Ellbogen', torso: 150, kopf: 135, thigh: 55, shin: 290, foot: 0, fThigh: 352, fShin: 352, fFoot: 90,
    ua: 90, fa: 90, fUa: 275, fFa: 185, kugel: 'oben', stuetz: ['hip', 'knoechel', 'fEll', 'fHand'],
    passt: [['fEll', ['fUa']], ['fHand', ['fFa']], ['knoechel', ['shin']]] },
  { name: '3 Hand', torso: 100, kopf: 95, thigh: 55, shin: 290, foot: 0, fThigh: 352, fShin: 352, fFoot: 90,
    ua: 90, fa: 90, fUa: 262, fFa: 262, kugel: 'oben', stuetz: ['hip', 'knoechel', 'fHand'],
    passt: [['fHand', ['fUa', 'fFa']], ['knoechel', ['shin']]] },
  { name: '4 Bruecke', torso: 188, kopf: 170, thigh: 355, shin: 270, foot: 0, fThigh: 322, fShin: 322, fFoot: 80,
    ua: 90, fa: 90, fUa: 268, fFa: 268, kugel: 'oben', stuetz: ['knoechel', 'fHand', 'fKnoechel'],
    passt: [['fHand', ['fUa', 'fFa']], ['fKnoechel', ['fThigh', 'fShin']]] },
  { name: '5 Beinschwung', torso: 162, kopf: 148, thigh: 355, shin: 270, foot: 0, fThigh: 262, fShin: 180, fFoot: 215,
    ua: 90, fa: 90, fUa: 270, fFa: 270, kugel: 'oben', stuetz: ['knoechel', 'fKnie', 'fKnoechel', 'fHand'],
    passt: [['fKnie', ['fThigh']], ['fKnoechel', ['fShin']], ['fHand', ['fUa', 'fFa']]] },
  { name: '6 Halbkniend', torso: 90, kopf: 90, thigh: 355, shin: 270, foot: 0, fThigh: 262, fShin: 180, fFoot: 215,
    ua: 90, fa: 90, fUa: 270, fFa: 270, kugel: 'oben', stuetz: ['knoechel', 'fKnie', 'fKnoechel'],
    passt: [['fKnie', ['fThigh']], ['fKnoechel', ['fShin']]] },
  { name: '7 Stand', ...STEHEN, ua: 90, fa: 90, fUa: 270, fFa: 270, kugel: 'oben', stuetz: ['zeh'] }
];

/** Radius des Gliedes, das am Stuetzpunkt endet (Mittelpunkt liegt um so viel ueber dem Boden). */
const RADIUS = { zeh: R.foot, knoechel: R.shin, fKnie: R.thigh, fKnoechel: R.shin, fHand: R.fa, fEll: R.ua, hip: R.torso, sh: R.torso, kugel: KUGEL };
const bodenHoehe = (g, punkte) => Math.min(...punkte.map(k => g[k][1] - RADIUS[k]));

/** Passt die Winkel aus `passt` an, bis jeder Stuetzpunkt auf dem Boden der festen Stuetzen liegt. */
export function loese(p) {
  const q = { ...p };
  const ziele = new Set((p.passt || []).map(([k]) => k));
  const fest = (p.stuetz || []).filter(k => !ziele.has(k));
  for (const [punkt, winkel] of p.passt || []) {
    let beste = 0, abw = Infinity;
    for (let d = -60; d <= 60; d += 0.25) {
      const t = { ...q }; for (const w of winkel) t[w] = q[w] + d;
      const g = gelenke(t);
      const a = Math.abs((g[punkt][1] - RADIUS[punkt]) - bodenHoehe(g, fest));
      if (a < abw - 1e-9 || (Math.abs(a - abw) < 1e-9 && Math.abs(d) < Math.abs(beste))) { abw = a; beste = d; }
    }
    for (const w of winkel) q[w] = q[w] + beste;
  }
  return q;
}

/* ---------------- Pixelfeld ---------------- */

function feld() { return { b: B, h: H, px: new Array(B * H).fill(null) }; }
function setze(f, x, y, c) { if (x >= 0 && x < f.b && y >= 0 && y < f.h) f.px[y * f.b + x] = c; }

function abstandStrecke(px, py, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], q = dx * dx + dy * dy;
  const t = q ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / q)) : 0;
  return Math.hypot(px - (a[0] + dx * t), py - (a[1] + dy * t));
}

/** Teile als Kapseln (Strecke + Radius, Farbe je Teil); spaetere Teile liegen vorn. */
function malen(f, teile) {
  const maske = new Array(f.b * f.h).fill(false);
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.b; x++) {
    const wx = x + 0.5, wy = y + 0.5;
    for (const t of teile) if (abstandStrecke(wx, wy, t.a, t.b) <= t.r) { maske[y * f.b + x] = true; f.px[y * f.b + x] = t.farbe; }
  }
  return maske;
}

function umrandung(f, maske, farbe) {
  const raus = [];
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.b; x++) {
    if (maske[y * f.b + x]) continue;
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && nx < f.b && ny >= 0 && ny < f.h && maske[ny * f.b + nx];
    });
    if (nb) raus.push([x, y]);
  }
  for (const [x, y] of raus) setze(f, x, y, farbe);
}

/** Kugel in Akzentrot mit Griff oben. */
function kugelMalen(f, mitte) {
  umrandung(f, malen(f, [{ a: mitte, b: mitte, r: KUGEL, farbe: FARBE.kugel }]), FARBE.rand);
  setze(f, Math.round(mitte[0] - 1.5), Math.round(mitte[1] - 1.5), FARBE.kugelLicht);
  for (const dx of [-1, 0, 1]) setze(f, Math.round(mitte[0]) + dx, Math.round(mitte[1] - KUGEL - 1.2), FARBE.griff);
}

/** Eine Haltung -> Pixelfeld; Rueckgabe auch die Bodenabweichung je Stuetzpunkt. */
export function zeichne(p0) {
  const p = loese(p0);
  const g = gelenke(p);
  const boden = bodenHoehe(g, p.stuetz);
  const xs = [g.sh[0], g.kopf[0], g.zeh[0], g.fZeh[0], g.faust[0], g.fHand[0]];
  const mitte = (Math.min(...xs) + Math.max(...xs)) / 2;
  const T = q => [q[0] - mitte + B / 2, BODEN + 1 - (q[1] - boden)];   // y nach unten
  const t = {};
  for (const [k, q] of Object.entries(g)) t[k] = T(q);

  const f = feld();
  // Boden
  for (let x = 0; x < B; x++) setze(f, x, BODEN + 1, FARBE.boden);

  // ferne Glieder (dunkel), dann nahe: Beine, Rumpf, Hals; Kugel; Arme und Kopf vorn
  const fern = [
    { a: t.hip, b: t.fKnie, r: R.thigh, farbe: FARBE.jeansF }, { a: t.fKnie, b: t.fKnoechel, r: R.shin, farbe: FARBE.jeansF },
    { a: t.fKnoechel, b: t.fZeh, r: R.foot, farbe: FARBE.schuhF },
    { a: t.sh, b: t.fEll, r: R.ua, farbe: FARBE.shirtF }, { a: t.fEll, b: t.fHand, r: R.fa, farbe: FARBE.hautF }
  ];
  const nah = [
    { a: t.hip, b: t.knie, r: R.thigh, farbe: FARBE.jeans }, { a: t.knie, b: t.knoechel, r: R.shin, farbe: FARBE.jeans },
    { a: t.knoechel, b: t.zeh, r: R.foot, farbe: FARBE.schuh },
    { a: t.hip, b: t.sh, r: R.torso, farbe: FARBE.shirt }, { a: t.sh, b: t.kopf, r: R.neck, farbe: FARBE.haut }
  ];
  const arme = [
    { a: t.sh, b: t.ell, r: R.ua, farbe: FARBE.shirt }, { a: t.ell, b: t.hand, r: R.fa, farbe: FARBE.haut },
    { a: t.hand, b: t.faust, r: R.fa * 0.95, farbe: FARBE.haut },
    { a: t.kopf, b: t.kopf, r: L.head, farbe: FARBE.haut }
  ];
  umrandung(f, malen(f, fern), FARBE.rand);
  umrandung(f, malen(f, nah), FARBE.rand);
  // Kugel am Boden zwischen den Fuessen: vor den Beinen, damit man sie sieht, hinter den Armen
  if (t.kugel) kugelMalen(f, t.kugel);
  umrandung(f, malen(f, arme), FARBE.rand);

  // Kopf: Haare hinten, Nase vorn (zeigt, wohin die Figur schaut)
  const kd = dir((p.kopf ?? p.torso) - 90), blick = [kd[0], -kd[1]];   // Bildkoordinaten, y nach unten
  const kr = L.head;
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.b; x++) {
    const ox = x + 0.5 - t.kopf[0], oy = y + 0.5 - t.kopf[1];
    if (Math.hypot(ox, oy) <= kr && (ox * blick[0] + oy * blick[1]) < -0.22 * kr) setze(f, x, y, FARBE.haar);
  }
  const nase = [t.kopf[0] + blick[0] * (kr + 0.6), t.kopf[1] + blick[1] * (kr + 0.6)];
  setze(f, Math.floor(nase[0]), Math.floor(nase[1]), FARBE.haut);
  setze(f, Math.floor(t.kopf[0] + blick[0] * (kr + 1.6)), Math.floor(t.kopf[1] + blick[1] * (kr + 1.6)), FARBE.rand);

  if (p.kugel === 'oben') kugelMalen(f, [t.faust[0], t.faust[1] - KUGEL - 0.2]);

  // Bodenabweichung: wie weit die Unterkante jedes Stuetzpunkts ueber dem Boden schwebt (0 = Kontakt)
  const abw = {};
  for (const k of p.stuetz) abw[k] = +((g[k][1] - RADIUS[k]) - boden).toFixed(1);
  return { f, abw };
}

/* ---------------- Bogen ---------------- */

export const FIGUR_B = B, FIGUR_H = H;

/** Bilder fuer den Bogen (RGBA-Leinwaende wie in pixel.mjs). Schwebt ein Stuetzpunkt, bricht der Bau ab. */
export function figurBilder(haltungen) {
  return haltungen.map(p => {
    const { f, abw } = zeichne(p);
    const schwebt = Object.entries(abw).filter(([, v]) => Math.abs(v) > 1);
    if (schwebt.length) throw new Error(`Figur ${p.name}: ${schwebt.map(([k, v]) => `${k} ${v} px`).join(', ')} ueber dem Boden`);
    const px = new Uint8Array(B * H * 4);
    f.px.forEach((c, i) => { if (c) px.set([c[0], c[1], c[2], 255], i * 4); });
    return { w: B, h: H, px };
  });
}
