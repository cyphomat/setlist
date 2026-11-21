// Der Roadie sagt einen Satz — aus dem Tag, nicht aus dem Zufall.
//
// Wer die Seite zweimal oeffnet, liest denselben Satz; erst der naechste Tag
// bringt einen neuen. Auf Home kann der Satz auf die letzte Kraft-Einheit
// eingehen, im Abschluss auf das, was gerade gespielt wurde. Nichts wird
// gespeichert, und die Saetze der Satzpause (lagerfeuer.js) bleiben dort.
//
// Reine Funktionen, kein I/O. Die Texte stehen in i18n.js (rd.*), nur die der
// Drops bringen ihre eigene Uebersetzung mit (drops-daten.js).

/** FNV-1a, 32 Bit. Auf jedem Geraet dasselbe Ergebnis, ohne Zufall. */
export function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/** Grundsaetze: i18n-Schluessel rd.g.1 … rd.g.N. */
export const GRUND = 6;
export const LAGERFEUER_ALLG = 8;   // lf.s.allg.1 … lf.s.allg.8, siehe lagerfeuer.js

const grundSchluessel = () => {
  const l = [];
  for (let i = 1; i <= GRUND; i++) l.push(`rd.g.${i}`);
  for (let i = 1; i <= LAGERFEUER_ALLG; i++) l.push(`lf.s.allg.${i}`);
  return l;
};

/** Die letzte Kraft-Einheit mit mindestens einem Lift, oder null. */
export function letzteKraft(logs = []) {
  const k = logs.filter(l => l && l.date && (l.type || 'strength') === 'strength' && Array.isArray(l.lifts) && l.lifts.length);
  k.sort((a, b) => a.date.localeCompare(b.date) || (a.finished || '').localeCompare(b.finished || ''));
  return k.length ? k[k.length - 1] : null;
}

/** Der Lift der Einheit, ueber den der Roadie spricht: der schwerste. */
export function fokusLift(log) {
  if (!log || !Array.isArray(log.lifts) || !log.lifts.length) return null;
  return [...log.lifts].sort((a, b) => (b.weight || 0) - (a.weight || 0))[0];
}

/**
 * Was der Roadie auf Home sagt. Rueckgabe: { schluessel, werte } fuer t(), oder
 * { roh: {de, en} } fuer Saetze aus den Drops. `drops` sind die Drops bis heute,
 * `namen` bildet eine Lift-Kennung auf ihren Namen ab.
 */
export function heuteSpruch(logs = [], tag = '', { drops = [], namen = {} } = {}) {
  const pool = grundSchluessel().map(s => ({ schluessel: s }));
  for (const d of drops) for (const s of d.sprueche || []) pool.push({ roh: s });
  const l = letzteKraft(logs), f = fokusLift(l);
  if (f && namen[f.lift] && f.weight > 0) {
    pool.push({ schluessel: 'rd.zuletzt', werte: { lift: namen[f.lift], kg: f.weight } });
  }
  return pool[hash(`heute-${tag}`) % pool.length];
}

/**
 * Der Satz zum Abschluss einer Kraft-Einheit: mal zum Lift selbst, mal ein
 * allgemeiner. Ein Lift ohne Erfolg bekommt einen ruhigen Satz, keinen Tadel.
 */
export function abschlussSpruch(log, tag = '', { drops = [], namen = {} } = {}) {
  const allg = heuteSpruch([], `abschluss-${tag}`, { drops });
  const f = fokusLift(log);
  if (!f || !namen[f.lift] || hash(`art-${tag}`) % 2 === 0) return allg;
  const werte = { lift: namen[f.lift], kg: f.weight || 0 };
  if (f.success === true) return { schluessel: 'rd.ok', werte };
  return { schluessel: 'rd.zaeh', werte };
}
