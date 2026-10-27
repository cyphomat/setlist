// Kettlebell Mosh Pit: das Folgeprogramm nach dem Kurs.
//
// Drei feste Lifts, jede Einheit dieselben. Die Progression ist doppelt und
// laeuft wie beim 5x5 ueber Erfolg und Fehlversuch: erst mehr Wiederholungen
// (Leiter 10 → 12 → 15 → 17 → 20), dann eine schwerere Kugel und wieder von
// unten. Beispiel: 15 mit 12 kg, naechstes Mal 17, dann 20, dann 10 mit 16 kg.
//
// Nichts hier wird gespeichert ausser dem Log der Einheit. Das naechste Ziel
// folgt aus den Logs: der letzte Eintrag je Lift sagt, womit du gearbeitet
// hast und ob es geklappt hat. Wer state.json neu ableitet, steht wieder am
// selben Punkt. Die Leiter und die Schrittweite sind Planung, nicht aus einer
// Studie: sie bilden nach, wie Kettlebell-Training in der Praxis steigt.
//
// Reine Funktionen, kein I/O.

import { UEBUNGEN, letzteKugel, KUGEL_MAX } from './kurs.js';

export const SAETZE = 3;
export const PAUSE = 90;
export const LEITER = [10, 12, 15, 17, 20];
export const START_REPS = 15;
export const SCHRITT_KG = 4;
export const FEHLER_ZURUECK = 2;
export const MIN_KG = 2;

/** Die drei Lifts. `seiten`: Wiederholungen gelten je Arm. */
export const LIFTS = [
  { id: 'swing2', seiten: false },
  { id: 'goblet', seiten: false },
  { id: 'press', seiten: true }
];
const IDS = LIFTS.map(l => l.id);

/** Nur die Logs dieses Programms, nach Abschluss sortiert. */
export function moshLogs(logs = []) {
  return (logs || [])
    .filter(l => l && l.type === 'moshpit' && l.date)
    .sort((a, b) => String(a.finished || a.date).localeCompare(String(b.finished || b.date)));
}

/** Eintraege dieses Lifts aus einem Log, defensiv gelesen. */
const eintrag = (log, lift) => (Array.isArray(log.uebungen) ? log.uebungen : []).find(e => e && e.lift === lift);

/**
 * Was folgt auf diesen Versuch? `reps` muss nicht auf der Leiter liegen:
 * wer 14 gemacht hat, steigt auf 15 und nicht auf 12.
 * Zwei Fehlversuche am selben Ziel gehen eine Sprosse zurueck; unten
 * angekommen wird die Kugel leichter und es geht oben wieder los.
 */
export function weiter({ kg, reps, geschafft, fails = 0 }) {
  if (geschafft) {
    const hoeher = LEITER.find(x => x > reps);
    return hoeher ? { kg, reps: hoeher, fails: 0 } : { kg: kg + SCHRITT_KG, reps: LEITER[0], fails: 0 };
  }
  if (fails + 1 < FEHLER_ZURUECK) return { kg, reps, fails: fails + 1 };
  const tiefer = [...LEITER].reverse().find(x => x < reps);
  return tiefer ? { kg, reps: tiefer, fails: 0 }
    : { kg: Math.max(MIN_KG, kg - SCHRITT_KG), reps: LEITER[LEITER.length - 1], fails: 0 };
}

/**
 * Das naechste Ziel dieses Lifts: aus den Logs durchgespielt. Ohne Log:
 * die Kugel aus dem Kurs (falls eingetragen) und 15 Wiederholungen.
 */
export function ziel(logs = [], lift, kursLogs = logs) {
  let stand = null;   // { kg, reps, fails } — das Ziel, das als Naechstes ansteht
  for (const l of moshLogs(logs)) {
    const e = eintrag(l, lift);
    const kg = Number(e && e.kg), reps = Number(e && e.reps);
    if (!e || !(kg > 0) || !(reps > 0)) continue;
    // Wer das Ziel selbst aendert, faengt den Fehlerzaehler neu an.
    const fails = stand && stand.kg === kg && stand.reps === reps ? stand.fails : 0;
    stand = weiter({ kg, reps, geschafft: e.geschafft === true, fails });
  }
  if (stand) return { ...stand, neu: false };
  const start = letzteKugel(kursLogs, lift) || (lift === 'press' ? letzteKugel(kursLogs, 'clean+press') : null);
  return { kg: start || null, reps: START_REPS, fails: 0, neu: true };
}

/** Die naechste Einheit: je Lift das Ziel. */
export function naechste(logs = []) {
  return {
    saetze: SAETZE, pause: PAUSE,
    lifts: LIFTS.map(l => ({ ...l, ...ziel(logs, l.id) }))
  };
}

/** Name der Uebung (englisch), aus dem Kurs. */
export const liftName = id => (UEBUNGEN[id] || {}).name || id;

/** Eine Zeile Klartext fuer Log und Historie. */
export const label = e => `Mosh Pit · ${e.lifts.map(l => `${liftName(l.lift)} ${l.saetze || e.saetze}×${l.reps}${l.kg ? ` @ ${l.kg} kg` : ''}`).join(' / ')}`;

/** Nur gueltige Lifts und Zahlen ins Log. */
export function bereinigeLifts(roh) {
  const aus = [];
  for (const e of Array.isArray(roh) ? roh : []) {
    if (!e || !IDS.includes(e.lift)) continue;
    const kg = Math.round(Number(e.kg) * 2) / 2, reps = Math.round(Number(e.reps));
    const sets = Math.round(Number(e.sets)), erledigt = Math.round(Number(e.erledigt));
    if (!(kg > 0 && kg <= KUGEL_MAX) || !(reps > 0 && reps <= 200) || !(sets > 0 && sets <= 20)) continue;
    const n = Number.isFinite(erledigt) ? Math.max(0, Math.min(sets, erledigt)) : 0;
    aus.push({ lift: e.lift, kg, reps, sets, erledigt: n, geschafft: n === sets });
  }
  return aus;
}

/* ---------------------------------------------------------------
   Statistik: alles aus den Logs.                                   */

/** Verlauf eines Lifts: [{ date, kg, reps, geschafft }]. */
export function reihe(logs = [], lift) {
  return moshLogs(logs).map(l => {
    const e = eintrag(l, lift);
    return e && e.kg > 0 ? { date: l.date, kg: Number(e.kg), reps: Number(e.reps), geschafft: e.geschafft === true } : null;
  }).filter(Boolean);
}

/** Je Lift: Einheiten, Erfolge, schwerste geschaffte Kugel, bestes Ergebnis (kg, dann Wdh.). */
export function bestwerte(logs = []) {
  return LIFTS.map(l => {
    const r = reihe(logs, l.id);
    const gut = r.filter(x => x.geschafft);
    const best = gut.reduce((b, x) => (!b || x.kg > b.kg || (x.kg === b.kg && x.reps > b.reps)) ? x : b, null);
    return { lift: l.id, n: r.length, erfolge: gut.length, best, aktuell: r.length ? r[r.length - 1] : null };
  });
}

/** Erfolgsserie: wie viele Einheiten in Folge hat es in allen Lifts geklappt? */
export function serie(logs = []) {
  const liste = moshLogs(logs);
  let n = 0;
  for (let i = liste.length - 1; i >= 0; i--) {
    const e = Array.isArray(liste[i].uebungen) ? liste[i].uebungen : [];
    if (e.length && e.every(x => x && x.geschafft === true)) n++; else break;
  }
  return n;
}
