// Einheiten als CSV — zum Auswerten in Excel, Numbers oder Sheets.
//
// Die Daten liegen ohnehin im eigenen Repo. Das hier ist nur eine Form,
// die Tabellenprogramme ohne Umweg lesen: eine Zeile je Lift, je
// Hilfsuebung, je Jam, Unplugged, Max-Out und Anpassung.
//
// Zwei Dinge sind bewusst so:
//   - Semikolon als Trenner und ein BOM am Anfang: Excel in deutscher
//     Einstellung erwartet das Semikolon und liest Umlaute ohne BOM falsch.
//     Zahlen stehen mit Punkt — die Spaltenformate kann man umstellen, eine
//     falsch gelesene Zahl sieht man dagegen nicht.
//   - Kein Feld darf als Formel ankommen. Ein Ort "=HYPERLINK(…)" aus der
//     eigenen config.json waere sonst in der Tabelle ausfuehrbar. Felder,
//     die mit = + - @ oder einem Steuerzeichen beginnen, bekommen ein
//     Hochkomma davor.
//
// Reine Funktionen, kein I/O.

import { bereinige } from './hilfs.js';

export const TRENNER = ';';
export const BOM = '﻿';

/** Spalten in fester Reihenfolge. Die Ueberschriften kommen von aussen (Sprache). */
export const SPALTEN = ['datum', 'art', 'workout', 'uebung', 'gewicht', 'saetze', 'ziel', 'wdh', 'geschafft',
  'dauer', 'ort', 'angesagt', 'gefuehlt', 'notiz'];

/** Ein Feld, sicher fuer Tabellenprogramme. */
export function feld(wert) {
  if (wert === null || wert === undefined) return '';
  let s = typeof wert === 'number' ? (Number.isFinite(wert) ? String(wert) : '') : String(wert);
  // Formel-Anfaenge entschaerfen. Eine negative Zahl gibt es hier nicht —
  // Zahlen kommen als number und bleiben, wie sie sind.
  if (typeof wert !== 'number' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[;"\n\r,]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

const zeit = l => l.finished || l.started || '';
const sortiert = logs => (logs || []).filter(l => l && l.date)
  .sort((a, b) => a.date.localeCompare(b.date) || zeit(a).localeCompare(zeit(b)));
const minuten = sek => (sek > 0 ? Math.round(sek / 6) / 10 : null);

/**
 * Die Zeilen als Objekte (eine Zeile = ein Objekt mit den SPALTEN).
 * `name(art, id)` liefert den Anzeigenamen — fuer Lifts aus der config,
 * fuer Hilfsuebungen und Pruefwerte aus der Uebersetzung.
 */
export function zeilen(logs, config = {}, { name = (art, id) => id } = {}) {
  const liftName = id => (config.lifts && config.lifts[id] && config.lifts[id].name) || id;
  const out = [];
  for (const l of sortiert(logs)) {
    const basis = { datum: l.date, ort: l.ort || '' };
    const typ = l.type || 'strength';
    if (typ === 'strength') {
      for (const e of Array.isArray(l.lifts) ? l.lifts : []) {
        out.push({ ...basis, art: 'kraft', workout: l.workout || '', uebung: liftName(e.lift),
          gewicht: e.weight, saetze: e.sets, ziel: e.target, wdh: (e.reps || []).join('/'),
          geschafft: e.success ? 'ja' : 'nein', angesagt: l.angesagt || '', gefuehlt: l.gefuehlt || '' });
      }
      for (const h of bereinige(l.hilfs)) {
        out.push({ ...basis, art: 'hilfs', workout: l.workout || '', uebung: name('hilfs', h.id),
          saetze: h.reps.length, wdh: h.reps.join('/') });
      }
      if (l.zugabe) out.push({ ...basis, art: 'zugabe', workout: l.workout || '', uebung: l.zugabe });
    } else if (typ === 'wod' || typ === 'unplugged') {
      out.push({ ...basis, art: typ === 'wod' ? 'jam' : 'unplugged', notiz: l.label || '',
        dauer: minuten(l.dauerSekunden) });
    } else if (typ === 'maxout') {
      out.push({ ...basis, art: 'maxout', uebung: l.check ? name('check', l.check) : liftName(l.lift),
        gewicht: l.weight, saetze: 1, wdh: l.reps, notiz: l.e1rm ? `e1RM ${l.e1rm}` : '' });
    } else if (typ === 'anpassung') {
      const teile = [];
      for (const [id, w] of Object.entries(l.gewichte || {})) teile.push(`${liftName(id)} ${w}`);
      for (const [id, n] of Object.entries(l.schema || {})) teile.push(`${liftName(id)} Stufe ${n}`);
      out.push({ ...basis, art: 'anpassung', notiz: [l.grund, teile.join(', ')].filter(Boolean).join(': ') });
    }
  }
  return out;
}

/** Der ganze Text: BOM, Kopfzeile, Zeilen, CRLF wie es Excel erwartet. */
export function alsCsv(logs, config = {}, { name, kopf = {} } = {}) {
  const kopfzeile = SPALTEN.map(s => feld(kopf[s] || s)).join(TRENNER);
  const daten = zeilen(logs, config, { name }).map(z => SPALTEN.map(s => feld(z[s])).join(TRENNER));
  return BOM + [kopfzeile, ...daten].join('\r\n') + '\r\n';
}

/** setlist-2026-10-13.csv */
export function dateiname(heute = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `setlist-${heute.getFullYear()}-${p(heute.getMonth() + 1)}-${p(heute.getDate())}.csv`;
}
