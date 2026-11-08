// Curls for the Girls: die Spasseinheit fuer die Arme, Hair-Metal-Fassung.
//
// Acht Tracks, rund 15 Minuten, jedes Mal dieselbe Setlist. Das Gewicht
// waehlst du frei, es gibt keine Leiter, keinen Bestwert und keine Folgen
// fuer die Arbeitsgewichte: Die Einheit steht im Log und in der Historie,
// mehr nicht. Sie zaehlt bewusst nicht als Gig und nicht fuer den
// Wochenregler (merch.js). Eine Pump-Einheit ersetzt keinen Krafttag, und
// das Soll der Woche soll nicht an ihr haengen. Als Training zaehlt sie
// wie jedes Beiwerk fuer die Wochenserie und die Wochenlast (istTraining).
//
// Welche Uebung hinter einem Track steckt, folgt aus dem Ort: Jeder Track
// nennt seine Geraete in der Reihenfolge, die er bevorzugt, und genommen
// wird das erste, das am gewaehlten Ort da ist. Gibt es keins, springt ein
// Koerpergewicht-Ersatz ein. So laeuft die Show auch im Wohnzimmer.
//
// Das Haar-o-Meter ist ein Spiel: Jeder Track bringt feste Zentimeter
// Toupierhoehe, abgehakte Saetze zaehlen anteilig. Es ist keine Messung.
//
// Reine Funktionen, kein I/O.

import { hash, mische } from './coach.js';

export const TYP = 'curls';

/**
 * Die Setlist. `muster` ist die Bewegung, `werkzeug` die Geraete in der
 * Reihenfolge der Vorliebe, `ersatz` die Uebung ohne Geraet. `ziel` ist
 * eine von: reps (n, optional seiten), halten (s), einundzwanzig, drop.
 * `haar` sind die Zentimeter bei vollen Saetzen; zusammen 36.
 */
export const TRACKS = [
  { id: 'aquanet',  muster: 'curl',           werkzeug: ['baender', 'kurzhantel', 'festhanteln', 'langhantel'], ersatz: 'handtuch', saetze: 2, ziel: { typ: 'reps', n: 20 }, pause: 45, haar: 3 },
  { id: 'spandex',  muster: 'curl',           werkzeug: ['langhantel', 'kurzhantel', 'festhanteln', 'baender'], ersatz: 'handtuch', saetze: 3, ziel: { typ: 'reps', n: 10 }, pause: 60, haar: 5 },
  { id: 'single',   muster: 'hammer',         werkzeug: ['kurzhantel', 'festhanteln', 'baender'],               ersatz: 'handtuch', saetze: 3, ziel: { typ: 'reps', n: 12 }, pause: 60, haar: 4 },
  { id: 'bassist',  muster: 'trizeps',        werkzeug: ['kurzhantel', 'festhanteln', 'baender'],               ersatz: 'diamant',  saetze: 3, ziel: { typ: 'reps', n: 12 }, pause: 60, haar: 3 },
  { id: 'ballade',  muster: 'konzentration',  werkzeug: ['kurzhantel', 'festhanteln', 'baender'],               ersatz: 'handtuch', saetze: 2, ziel: { typ: 'reps', n: 8, seiten: true }, pause: 60, haar: 6 },
  { id: 'solo',     muster: 'einundzwanzig',  werkzeug: ['langhantel', 'kurzhantel', 'festhanteln', 'baender'], ersatz: 'handtuch', saetze: 1, ziel: { typ: 'einundzwanzig' }, pause: 90, haar: 7 },
  { id: 'zugabe',   muster: 'curl',           werkzeug: ['langhantel', 'kurzhantel', 'festhanteln', 'baender'], ersatz: 'handtuch', saetze: 2, ziel: { typ: 'drop' }, pause: 60, haar: 8 },
  { id: 'posedown', muster: 'pose',           werkzeug: [],                                                     ersatz: 'pose',     saetze: 3, ziel: { typ: 'halten', s: 10 }, pause: 20, haar: 0 }
];

/** Zentimeter bei vollen Saetzen: Pose-Down ist der Spiegel, kein Haar. */
export const HAAR_MAX = TRACKS.reduce((s, t) => s + t.haar, 0);

/**
 * Die Einheit fuer einen Ort. `geraete`: Kennungen aus geraete.js oder null
 * fuer "alles da". Jeder Track bekommt Werkzeug und Uebung: `uebung` ist
 * 'muster:werkzeug' (z. B. 'curl:langhantel') oder der Ersatz ('handtuch').
 */
export function einheit(geraete = null) {
  const da = Array.isArray(geraete) ? geraete : null;
  return {
    tracks: TRACKS.map(t => {
      const werkzeug = t.werkzeug.find(w => !da || da.includes(w)) || null;
      return {
        id: t.id, muster: werkzeug ? t.muster : t.ersatz, werkzeug,
        uebung: werkzeug ? `${t.muster}:${werkzeug}` : t.ersatz,
        saetze: t.saetze, ziel: t.ziel, pause: t.pause, haar: t.haar
      };
    })
  };
}

/** Toupierhoehe in cm: je Track anteilig nach abgehakten Saetzen. */
export function haarHoehe(tracks = []) {
  let cm = 0;
  for (const e of Array.isArray(tracks) ? tracks : []) {
    const t = TRACKS.find(x => x.id === (e && e.id));
    if (!t) continue;
    const n = Math.max(0, Math.min(t.saetze, Math.round(Number(e.erledigt)) || 0));
    cm += t.haar * n / t.saetze;
  }
  return Math.round(cm);
}

/**
 * Die Maehne im Bogen assets/pixel/curls.png (tools/pixel-curls.mjs):
 * fuenf Stufen, danach zwei Flammenbilder fuer das Feuerzeug. Die Zahlen
 * muessen mit dem Bogen uebereinstimmen; tools/pixel.mjs bricht sonst ab.
 */
export const MAEHNE_BILDER = 5;
export const FEUERZEUG_BILDER = 2;
export const BILD_KANTE = 24;

/** Welche Maehne zu dieser Hoehe gehoert: 0 = kahl bis 4 = Hallenformat. */
export function maehneStufe(cm) {
  const h = Number(cm);
  if (!(h >= 1)) return 0;
  const viertel = HAAR_MAX / 4;
  return Math.min(MAEHNE_BILDER - 1, 1 + Math.floor((h - 1) / viertel));
}

/** Nur gueltige Tracks und Zahlen ins Log. Saetze und Uebung kommen aus der Setlist, nicht aus der Oberflaeche. */
export function bereinige(roh) {
  const aus = [];
  for (const e of Array.isArray(roh) ? roh : []) {
    const t = e && TRACKS.find(x => x.id === e.id);
    if (!t || aus.some(a => a.id === t.id)) continue;
    const n = Math.max(0, Math.min(t.saetze, Math.round(Number(e.erledigt)) || 0));
    aus.push({
      id: t.id, uebung: typeof e.uebung === 'string' ? e.uebung.slice(0, 40) : '',
      saetze: t.saetze, erledigt: n, geschafft: n === t.saetze
    });
  }
  return aus;
}

/** Eine Zeile Klartext fuer Log und Historie. */
export function label(tracks = []) {
  const ok = tracks.filter(x => x.geschafft).length;
  return `Curls for the Girls · ${ok}/${TRACKS.length} Tracks · Frisurhöhe ${haarHoehe(tracks)} cm`;
}

/** Nur die Logs dieser Einheit, nach Abschluss sortiert. */
export function curlsLogs(logs = []) {
  return (logs || [])
    .filter(l => l && l.type === TYP && l.date)
    .sort((a, b) => String(a.finished || a.date).localeCompare(String(b.finished || b.date)));
}

/** Wie viele Zeilen es zum Abschluss gibt (i18n 'cu.fin.N' und 'cu.voll.N'). */
export const FIN_N = 4;
export const VOLL_N = 3;

/**
 * Schluessel der Schlusszeile. Der Tag entscheidet, nicht der Zufall bei
 * jedem Neuzeichnen: derselbe Abend, dieselbe Zeile. Wer alle Tracks
 * geschafft hat, bekommt eine aus der Zugabe-Reihe.
 */
export function schluss(datum, alleGeschafft) {
  const h = mische(hash(`curls-${datum}`));
  return alleGeschafft ? `cu.voll.${h % VOLL_N}` : `cu.fin.${h % FIN_N}`;
}
