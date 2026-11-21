// Der Gurt: ein Plektrum je Uebung, das du dir nicht kaufst, sondern spielst.
//
// Nichts hier wird gespeichert. Ein Lift gilt als geuebt, wenn er an
// SAUBER_TAGE verschiedenen Tagen alle Saetze geschafft hat; das Plektrum traegt
// das Datum des dritten sauberen Tages und wandert mit den Logs — wer state.json
// neu ableitet oder ein zweites Geraet einrichtet, hat danach denselben Gurt.
// Farbe und Form fallen aus einem Hash der Lift-Kennung, es wird nichts gewuerfelt.
//
// Leise Eigenschaften, nirgends beworben und alle aus dem Log:
//   Metall  ab METALL_TAGE sauberen Tagen
//   Patina  Spieltage ab PATINA[0] und PATINA[1] machen das Plektrum abgegriffener
//   Staub   ein verdientes Plektrum, das laenger als STAUB_TAGE nicht gespielt
//           wurde, wird matt; einmal wieder gespielt, glaenzt es
//
// Reine Funktionen, kein I/O.

import { hash } from './roadie.js';

export const SAUBER_TAGE = 3;
export const METALL_TAGE = 10;
export const PATINA = [10, 25];
export const STAUB_TAGE = 30;

export const FORMEN = ['std', 'jazz', 'tri'];
export const FARBEN = ['#c8322b', '#e8c23a', '#1f1f22', '#6c7377', '#2f6fa3', '#4a8a4b', '#d9d2c0', '#7a3b8c'];

const tageZwischen = (von, bis) => Math.round((Date.parse(bis) - Date.parse(von)) / 86400000);
const ymdVon = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Farbe und Form einer Uebung, auf jedem Geraet gleich. */
export function aussehen(id) {
  const h = hash(`plektrum-${id}`);
  return { farbe: FARBEN[h % FARBEN.length], form: FORMEN[Math.floor(h / FARBEN.length) % FORMEN.length] };
}

/**
 * Je Uebung: Spieltage und saubere Tage. Es zaehlen Kraft-Einheiten
 * (`type` fehlt oder 'strength'); sauber ist ein Lift mit success === true.
 */
export function uebungen(logs = []) {
  const m = new Map();
  for (const l of logs) {
    if (!l || !l.date || (l.type || 'strength') !== 'strength' || !Array.isArray(l.lifts)) continue;
    for (const e of l.lifts) {
      if (!e || !e.lift) continue;
      const u = m.get(e.lift) || { id: e.lift, gespielt: new Set(), sauber: new Set() };
      u.gespielt.add(l.date);
      if (e.success === true) u.sauber.add(l.date);
      m.set(e.lift, u);
    }
  }
  return m;
}

/** Alle Plektren der Uebungen, die schon im Log stehen — verdient oder noch offen. */
export function plektren(logs = [], heute = new Date()) {
  const jetzt = typeof heute === 'string' ? heute : ymdVon(heute);
  return [...uebungen(logs).values()].map(u => {
    const sauber = [...u.sauber].sort();
    const spiel = [...u.gespielt].sort();
    const verdient = sauber.length >= SAUBER_TAGE ? sauber[SAUBER_TAGE - 1] : null;
    const letzter = spiel[spiel.length - 1];
    return {
      id: u.id, ...aussehen(u.id),
      sauber: sauber.length, gespielt: spiel.length,
      verdient,
      metall: sauber.length >= METALL_TAGE,
      patina: spiel.length >= PATINA[1] ? 2 : spiel.length >= PATINA[0] ? 1 : 0,
      staub: !!verdient && tageZwischen(letzter, jetzt) > STAUB_TAGE,
      fehlt: Math.max(0, SAUBER_TAGE - sauber.length)
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
}

/** Der Gurt: was haengt (nach Datum, bei gleichem Tag nach Kennung) und was noch fehlt. */
export function gurt(logs = [], heute = new Date()) {
  const alle = plektren(logs, heute);
  const haengt = alle.filter(p => p.verdient).sort((a, b) => a.verdient.localeCompare(b.verdient) || a.id.localeCompare(b.id));
  const offen = alle.filter(p => !p.verdient).sort((a, b) => a.fehlt - b.fehlt || a.id.localeCompare(b.id));
  return { haengt, offen, n: haengt.length };
}

/** Was nach dieser Einheit neu dazukam — vorher gegen nachher, wie bei den Gitarren. */
export function neuePlektren(vorherLogs = [], nachherLogs = [], heute = new Date()) {
  const alt = new Set(plektren(vorherLogs, heute).filter(p => p.verdient).map(p => p.id));
  return plektren(nachherLogs, heute).filter(p => p.verdient && !alt.has(p.id));
}
