// Die Kuttenansicht im Merch-Stand: die Weste zum Umdrehen. Vorne die zuletzt
// verdienten Aufnaeher, hinten der Rocker, der getragene Rueckenpatch und die
// Szene des Rangs.
//
// Nur die Auswahl und die Plaetze stehen hier; gerechnet wird alles aus den
// Logs (merch.js, backpatches.js) und nirgends gespeichert. Die Weste selbst ist
// ein Pixelbild (assets/pixel/kutte.png, tools/pixel-kutte.mjs), die Plaetze
// liegen in dessen Pixeln: 130x150, die Anzeige verdoppelt.
//
// Reine Funktionen, kein I/O. Texte stehen in i18n.js (kv.*).

/** Kantenlaenge der Weste im Bild, in Pixeln. Die Anzeige zeigt sie doppelt. */
export const BREITE = 130, HOEHE = 150;
/** Ein Aufnaeher im Bogen ist 24x24; angezeigt 48x48 (ganzzahlig, scharf). */
export const PATCH = 24;
/** So viele Aufnaeher haengen vorne. Setlist hat weit mehr: es sind die neuesten. */
export const MAX_VORNE = 12;

// Zwei Spalten links, zwei rechts, drei Reihen. Die Reihenfolge ist die der
// Belegung: aussen links, aussen rechts, innen links, innen rechts.
const SPALTEN = [8, 98, 32, 74];
const REIHEN = [26, 60, 94];
export const PLAETZE = REIHEN.flatMap(y => SPALTEN.map(x => ({ x, y })));

/** Der Rocker hinten, die Mitte fuer den Rueckenpatch und die Szene des Rangs: Lage im Bild. */
export const HINTEN = {
  rocker: { x: 22, y: 14, b: 86, h: 18 },
  patch: { x: 41, y: 36, kante: 48 },
  rang: { x: 17, y: 90, b: 96, h: 48 }
};

/**
 * Die Aufnaeher fuer vorne: die zuletzt verdienten, die neuesten zuerst, hoechstens `max`.
 * `hatBild` sagt, ob ein Aufnaeher ein Pixelbild hat; einer ohne Bild bleibt weg.
 * Gleicher Tag: nach Kennung, damit jedes Geraet dieselbe Weste zeigt.
 * Gibt { ids, gesamt, plaetze } zurueck; `gesamt` ist die Zahl aller verdienten.
 */
export function vorne(liste = [], hatBild = () => true, max = MAX_VORNE) {
  const da = liste.filter(a => a && a.verdient && hatBild(a));
  const neueste = da.slice().sort((a, b) => String(b.verdient).localeCompare(String(a.verdient)) || String(a.id).localeCompare(String(b.id)))
    .slice(0, Math.min(max, PLAETZE.length));
  return { ids: neueste.map(a => a.id), gesamt: da.length, plaetze: neueste.map((a, i) => ({ id: a.id, ...PLAETZE[i] })) };
}
