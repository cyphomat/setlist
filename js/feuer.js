// Pixelfeuer — der Feuer-Algorithmus aus dem PSX-Doom, eigene Umsetzung.
//
// Die unterste Reihe glueht, jedes Pixel steigt nach oben, kuehlt dabei
// zufaellig ab und weht ein wenig seitlich. Mehr ist es nicht; die Palette
// macht aus Zahlen zwischen 0 und 36 Glut, Flamme und weisse Spitze.
//
// Eingesetzt sparsam: klein hinter dem Tageswort SCHWER und kurz am unteren
// Rand, wenn auf dem Geschafft-Screen etwas Grosses passiert. Wer im System
// "Bewegung reduzieren" eingestellt hat, bekommt kein Feuer.

/** 37 Stufen von durchsichtig ueber Rot und Gelb bis Weiss, je [r, g, b, a]. */
export const PALETTE = (() => {
  const stops = [[0, 0, 0, 0], [31, 7, 7, 90], [71, 15, 7, 150], [143, 39, 7, 200], [191, 71, 7, 230], [223, 87, 7, 245],
    [215, 111, 15, 255], [207, 135, 23, 255], [199, 151, 31, 255], [191, 167, 39, 255], [223, 223, 159, 255], [255, 255, 255, 255]];
  const pal = [];
  for (let i = 0; i < 37; i++) {
    const f = i / 36 * (stops.length - 1), a = Math.floor(f), b = Math.min(a + 1, stops.length - 1), t = f - a;
    pal.push(stops[a].map((v, k) => Math.round(v + (stops[b][k] - v) * t)));
  }
  return pal;
})();
export const HEISS = PALETTE.length - 1;

/** Ein leeres Feld: Breite, Hoehe, je Pixel eine Hitze 0..36. */
export const feld = (w, h) => ({ w, h, px: new Uint8Array(w * h) });

/**
 * Ein Schritt. `an`: unten nachlegen oder ausgehen lassen. Gibt zurueck,
 * ob noch irgendwo etwas glueht — sonst darf die Schleife enden.
 */
export function schritt(f, an, kuehlung = 2, zufall = Math.random) {
  const { w, h, px } = f;
  for (let x = 0; x < w; x++) {
    const i = (h - 1) * w + x;
    px[i] = an ? HEISS - ((zufall() * 4) | 0) : Math.max(0, px[i] - 4);
  }
  for (let x = 0; x < w; x++) for (let y = 1; y < h; y++) {
    const quelle = y * w + x, p = px[quelle];
    if (!p) { px[quelle - w] = 0; continue; }
    const ziel = quelle - ((zufall() * 3) | 0) + 1 - w;
    if (ziel >= 0 && ziel < px.length) px[ziel] = Math.max(0, p - ((zufall() * (kuehlung + 1)) | 0));
  }
  let glueht = 0;
  for (let i = 0; i < px.length; i++) glueht |= px[i];
  return glueht > 0;
}

/** Ob das System um weniger Bewegung bittet. */
export const ruhig = () => {
  try { return !!(globalThis.matchMedia && globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  catch { return false; }
};

/**
 * Feuer auf einer Canvas. start() legt nach, stop() laesst ausbrennen.
 * Ohne Canvas-Kontext oder bei reduzierter Bewegung tut es nichts.
 */
export function feuer(canvas, { breite = 90, hoehe = 34, kuehlung = 2 } = {}) {
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  if (!ctx || ruhig()) return { start() {}, stop() {}, get an() { return false; } };
  canvas.width = breite; canvas.height = hoehe;
  const f = feld(breite, hoehe), bild = ctx.createImageData(breite, hoehe);
  let an = false, laeuft = false, zuletzt = 0;
  const male = () => {
    for (let i = 0; i < f.px.length; i++) bild.data.set(PALETTE[f.px[i]], i * 4);
    ctx.putImageData(bild, 0, 0);
  };
  const schleife = zeit => {
    if (document.hidden) { laeuft = false; return; }        // verborgen: anhalten, nicht weiterrechnen
    if (zeit - zuletzt > 33) {
      zuletzt = zeit;
      const glueht = schritt(f, an, kuehlung);
      male();
      if (!an && !glueht) { laeuft = false; return; }
    }
    requestAnimationFrame(schleife);
  };
  const los = () => { if (!laeuft) { laeuft = true; requestAnimationFrame(schleife); } };
  document.addEventListener('visibilitychange', () => { if (!document.hidden && an) los(); });
  return {
    start() { an = true; los(); },
    stop() { an = false; },
    get an() { return an; }
  };
}
