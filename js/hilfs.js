// Hilfsuebungen nach dem Hauptprogramm: Klimmzuege, Dips, Face Pulls …
//
// Bewusst ohne Steigerungslogik. Das Programm sind die fuenf Lifts; was
// danach kommt, ist Beiwerk und wird nur mitgeschrieben — Wiederholungen je
// Satz, sonst nichts. Es dreht weder Gewichte noch den A/B-Wechsel, und es
// zaehlt nicht in die Tonnage. Im Log steht es als
//   hilfs: [{ id: 'pullup', reps: [8, 7, 6] }]
//
// Reine Funktionen, kein I/O.

/** Der Katalog. Namen kommen aus der Uebersetzung (hilfs.<id>). */
export const HILFS = [
  { id: 'pullup', zug: true },
  { id: 'chinup', zug: true },
  { id: 'dip' },
  { id: 'pushup' },
  { id: 'facepull' },
  { id: 'curl' },
  { id: 'hlr' }
];
const BEKANNT = new Set(HILFS.map(h => h.id));

/** Mehr als das in einem Satz ist ein Vertipper, kein Satz. */
export const MAX_WDH = 50;

/** Welche Uebungen zur Wahl stehen: config.hilfs schraenkt ein, sonst alle. */
export function auswahl(config = {}) {
  const nur = Array.isArray(config.hilfs) ? config.hilfs.filter(id => BEKANNT.has(id)) : null;
  return nur && nur.length ? HILFS.filter(h => nur.includes(h.id)) : HILFS;
}

/**
 * Fuer das Log: nur bekannte Uebungen, nur ganze Wiederholungen zwischen 1
 * und MAX_WDH, keine leeren Eintraege, jede Uebung einmal.
 */
export function bereinige(hilfs) {
  if (!Array.isArray(hilfs)) return [];
  const out = [];
  for (const h of hilfs) {
    if (!h || !BEKANNT.has(h.id) || out.some(x => x.id === h.id)) continue;
    const reps = (Array.isArray(h.reps) ? h.reps : [])
      .map(Number).filter(r => Number.isInteger(r) && r >= 1 && r <= MAX_WDH);
    if (reps.length) out.push({ id: h.id, reps });
  }
  return out;
}

const mitHilfs = logs => (logs || []).filter(l => l && l.date && Array.isArray(l.hilfs) && l.hilfs.length)
  .sort((a, b) => a.date.localeCompare(b.date) || String(a.finished || '').localeCompare(String(b.finished || '')));

/** Was beim letzten Mal ging — als Anhalt fuer heute. Oder null. */
export function letztesMal(logs, id) {
  const l = mitHilfs(logs).reverse().find(x => bereinige(x.hilfs).some(h => h.id === id));
  if (!l) return null;
  return { date: l.date, reps: bereinige(l.hilfs).find(h => h.id === id).reps };
}

/**
 * Je Uebung: bester Satz (mit Datum), in wie vielen Einheiten gemacht,
 * und das letzte Mal. Nur Uebungen, die vorkommen.
 */
export function bilanz(logs) {
  const out = {};
  for (const l of mitHilfs(logs)) {
    for (const h of bereinige(l.hilfs)) {
      const b = out[h.id] || (out[h.id] = { id: h.id, einheiten: 0, bester: 0, besterAm: null, letzte: null });
      b.einheiten++;
      const top = Math.max(...h.reps);
      if (top > b.bester) { b.bester = top; b.besterAm = l.date; }
      b.letzte = { date: l.date, reps: h.reps };
    }
  }
  return out;
}

/** Wie viele Einheiten mit Hilfsarbeit — fuer den Aufnaeher "Roadcrew". */
export const einheitenMitHilfs = logs => mitHilfs(logs).filter(l => bereinige(l.hilfs).length).length;

/** "8 · 7 · 6" */
export const repsText = reps => (reps || []).join(' · ');
