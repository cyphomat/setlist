// Das Gitarrenrack: zehn Gitarren, die du dir nicht kaufst, sondern spielst.
//
// Nichts hier wird gespeichert. Jede Gitarre haengt an einer Stufe, die
// merch.js ohnehin rechnet — sieben an den Raengen (Wochen mit Training),
// drei an den Schallplatten (bewegte Tonnen). Wer state.json neu ableitet,
// hat danach dasselbe Rack. Belohnt wird, was auch sonst belohnt wird:
// Regelmaessigkeit, nicht Menge um jeden Preis.
//
// Die Bilder liegen als Bogen in assets/pixel/gitarren.png, gebaut von
// tools/pixel.mjs in derselben Reihenfolge wie GITARREN.
//
// Reine Funktionen, kein I/O.

import { rang, schallplatten, RAENGE, PLATTEN } from './merch.js';

/**
 * Reihenfolge = Reihenfolge im Bogen und im Rack. `quelle` sagt, wo die
 * Gitarre freigeschaltet wird, `key` an welcher Stufe dort. Die Gold-Platte
 * (50 t) hat bewusst keine Gitarre: sie ist die erste Stufe, die Gitarren
 * sind die spaeten.
 */
export const GITARREN = [
  { id: 'brett',   quelle: 'rang',   key: 'garage' },
  { id: 'keller',  quelle: 'rang',   key: 'proberaum' },
  { id: 'offset',  quelle: 'rang',   key: 'vorband' },
  { id: 'falke',   quelle: 'rang',   key: 'support' },
  { id: 'zacke',   quelle: 'rang',   key: 'headliner' },
  { id: 'stern',   quelle: 'rang',   key: 'festival' },
  { id: 'siegel',  quelle: 'rang',   key: 'halloffame' },
  { id: 'hohl',    quelle: 'platte', key: 'platin' },
  { id: 'kopflos', quelle: 'platte', key: 'doppelplatin' },
  { id: 'axt',     quelle: 'platte', key: 'diamant' }
];

/** Je Gitarre das Datum, an dem sie freigespielt wurde — oder null. */
export function gitarren(logs = [], fahrten = []) {
  const r = rang(logs, fahrten);
  const s = schallplatten(logs);
  return GITARREN.map(g => {
    let datum = null;
    if (g.quelle === 'rang') {
      const i = RAENGE.findIndex(x => x.id === g.key);
      datum = i >= 0 ? r.freigespielt[i] : null;
    } else {
      const p = s.stufen.find(x => x.id === g.key);
      datum = p ? p.verdient : null;
    }
    return { ...g, verdient: datum || null };
  });
}

/** Was nach dieser Einheit neu dazukam, vorher gegen nachher — wie bei den Aufnaehern. */
export function neueGitarren(vorherLogs = [], nachherLogs = [], fahrten = []) {
  const alt = new Set(gitarren(vorherLogs, fahrten).filter(g => g.verdient).map(g => g.id));
  return gitarren(nachherLogs, fahrten).filter(g => g.verdient && !alt.has(g.id));
}

/**
 * Das Rack: was haengt (nach Datum, bei gleichem Tag in Listenreihenfolge) und
 * die naechste, die fehlt. An der Wand steht nur die naechste, keine Reihe
 * leerer Plaetze.
 */
export function rack(logs = [], fahrten = []) {
  const liste = gitarren(logs, fahrten);
  const haengt = liste.map((g, i) => ({ ...g, i })).filter(g => g.verdient)
    .sort((a, b) => a.verdient.localeCompare(b.verdient) || a.i - b.i)
    .map(({ i, ...g }) => g);
  const naechste = liste.find(g => !g.verdient) || null;
  return { haengt, naechste, n: haengt.length, gesamt: GITARREN.length };
}

/**
 * Was zur Freischaltung fehlt, fuer die Anzeige: bei Raengen die Wochen,
 * bei Platten die Tonnen. Garage heisst "die erste Einheit".
 */
export function bedingung(g) {
  if (!g) return null;
  if (g.quelle === 'rang') {
    const r = RAENGE.find(x => x.id === g.key);
    return r ? { art: 'rang', id: r.id, wochen: Math.max(1, r.wochen) } : null;
  }
  const p = PLATTEN.find(x => x.id === g.key);
  return p ? { art: 'platte', id: p.id, tonnen: p.tonnen } : null;
}

/** Der Platz im Bogen, oder -1. */
export const bildIndex = id => GITARREN.findIndex(g => g.id === id);
