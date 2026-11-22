// "Neu in Setlist": was sich seit dem letzten Besuch fuer Nutzer geaendert hat.
//
// Eine Karte auf Home, kein Popup: sie steht, bis "Gesehen" gedrueckt wurde, und
// merkt sich nur die Versionsnummer — pro Geraet, nichts im Log. Nie in einer
// Einheit. Wer die App zum ersten Mal oeffnet, hat nichts zu aktualisieren und
// sieht keine Karte.
//
// Gepflegt wird sie hier, nicht im CHANGELOG: der ist fuer Entwickler, lang und
// deutsch. Hier steht je Auslieferung hoechstens das, was ein Nutzer sehen kann —
// eine kurze Zeile deutsch und englisch. Fehlerkorrekturen und Umbauten
// gehoeren nicht hinein. Neueste Version oben; tests/neu.test.js prueft Form
// und Reihenfolge.
//
// Reine Funktionen, kein I/O (bis auf gesehen/setzeGesehen unten).

import { vergleiche } from './aktualisierung.js';

export const SCHLUESSEL = 'setlist.neuGesehen';
export const MAX_ZEILEN = 3;      // so viele Auslieferungen zeigt die Karte hoechstens
export const MAX_LAENGE = 120;    // Zeichen je Zeile

export const NEU = [
  { v: '2026-11-22.2',
    de: ['November-Quests einfacher: „Fünf im November“ (5 Trainingstage) und „Ohne Pause“ (2 Wochen in Folge).'],
    en: ['November quests made easier: “Five in November” (5 training days) and “No pause” (2 weeks in a row).'] },
  { v: '2026-11-22.1',
    de: ['Der November-Drop hat jetzt auch zwei Quests: „Zehn im November“ und „Ohne Pause“.'],
    en: ['The November drop now has two quests as well: “Ten in November” and “No pause”.'] },
  { v: '2026-11-21.8',
    de: ['Quests: jeden Monat zwei, eine epische und eine legendäre, mit eigenem Plektrum als Lohn. Zu sehen im Merch-Stand.'],
    en: ['Quests: two each month, one epic and one legendary, each with its own pick as a reward. See them in the merch stand.'] },
  { v: '2026-11-21.5',
    de: ['Diese Karte: nach einem Update steht hier, was neu ist.'],
    en: ['This card: after an update it tells you what is new.'] },
  { v: '2026-11-21.4',
    de: ['Merch-Stand: alle Drops stehen da, frühere eingeklappt. Der Januar-Drop startet am 1.1.'],
    en: ['Merch stand: all drops are listed, earlier ones folded away. The January drop starts on 1 Jan.'] },
  { v: '2026-11-21.3',
    de: ['Der Gurt zählt jetzt auch Mosh Pit: Swing, Goblet Squat und Press bekommen je ein Plektrum.'],
    en: ['The strap now counts Mosh Pit too: Swing, Goblet Squat and Press each get a pick.'] },
  { v: '2026-11-21.2',
    de: ['Adventskalender ab 1.12. auf Home: 24 Türchen, die sich aus deinen Einheiten selbst erledigen.'],
    en: ['Advent calendar from 1 Dec on Home: 24 doors that complete themselves from your sessions.'] },
  { v: '2026-11-21.1',
    de: ['Der Gurt: ein Plektrum je Übung, dazu Drops des Monats und ein Roadie-Satz des Tages.'],
    en: ['The strap: one pick per exercise, plus drops of the month and a roadie line of the day.'] }
];

/**
 * Die Eintraege nach `gesehen` bis einschliesslich `laufend`, neueste zuerst.
 * `gesehen` null oder leer heisst: nie gesehen, dann gelten alle. Eine Version,
 * die neuer ist als die laufende, kommt nicht vor (Fork hinter dem Original).
 * `max` begrenzt die Zahl der Auslieferungen.
 */
export function seit(gesehen, laufend, max = MAX_ZEILEN, liste = NEU) {
  return liste
    .filter(e => vergleiche(e.v, laufend) <= 0 && (!gesehen || vergleiche(e.v, gesehen) > 0))
    .slice(0, max);
}

/** Was nicht durchkommen darf: leere Liste = in Ordnung. */
export function pruefe(liste = NEU) {
  const f = [];
  const ok = /^\d{4}-\d{2}-\d{2}\.\d+$/;
  liste.forEach((e, i) => {
    if (!ok.test(e.v || '')) f.push(`${e && e.v}: Version JJJJ-MM-TT.N erwartet`);
    if (i && vergleiche(liste[i - 1].v, e.v) <= 0) f.push(`${e.v}: nicht absteigend sortiert`);
    for (const sp of ['de', 'en']) {
      if (!Array.isArray(e[sp]) || !e[sp].length) { f.push(`${e.v}: ${sp} fehlt`); continue; }
      e[sp].forEach(z => { if (typeof z !== 'string' || !z.trim() || z.length > MAX_LAENGE) f.push(`${e.v}: ${sp}-Zeile leer oder laenger als ${MAX_LAENGE}`); });
    }
    if (e.de && e.en && e.de.length !== e.en.length) f.push(`${e.v}: de und en verschieden lang`);
  });
  return f;
}

/** "Gesehen" pro Geraet: die Version, bis zu der die Karte weggeklickt wurde. */
export function gesehen() { try { return localStorage.getItem(SCHLUESSEL); } catch { return null; } }
export function setzeGesehen(v) { try { localStorage.setItem(SCHLUESSEL, v); } catch { /* egal */ } }
