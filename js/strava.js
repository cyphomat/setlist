// Eine Einheit als Text zum Einfuegen in Strava (Krafttraining, Textscan).
//
// Eine Zeile je Satz: "Satz 2: 5 Wdh × 80 kg". Das ist die Form, die man
// auch von Hand in ein Notizfeld schreiben wuerde. Ob Strava den Scan
// damit ohne Nacharbeit annimmt, ist nicht belegt (siehe CHANGELOG) —
// deshalb steht das Format an genau einer Stelle, `satzZeile`.
//
// Was im Log steht, kommt 1:1 raus:
//   - Kraft (A/B): die tatsaechlichen Wiederholungen je Satz, Hilfsuebungen
//     ohne Gewicht.
//   - Mosh Pit: Gewicht und Wiederholungen aus dem Log, so viele Saetze
//     wie abgehakt wurden.
//   - Kettlebell-Kurs und Jam: das Log haelt nur den Plan des Tages und
//     die Kugeln, nicht jeden Satz. Der Plan gilt als gemacht, das
//     Gewicht kommt aus `kugeln` bzw. der Last des Jam-Teils.
// Curls und Unplugged haben im Log kein Gewicht und keine Wiederholungen;
// dort gibt es bewusst keinen Export, statt Werte zu erfinden.
//
// Reine Funktionen, kein I/O. Texte kommen ueber `t` (i18n), Zahlen ueber
// `zahl` (Dezimalkomma je Sprache).

import * as KU from './kurs.js';

const gueltig = n => Number.isFinite(Number(n)) && Number(n) > 0;

/** Eine Satzzeile. `last` in kg oder leer (Koerpergewicht). `einheit`: 'Wdh' oder 's'. */
export function satzZeile(nr, menge, einheit, last, { t, zahl }) {
  const m = einheit === 's' ? `${zahl(menge)} ${t('strava.sek')}` : `${zahl(menge)} ${t('strava.wdh')}`;
  return `${t('strava.satz', { n: nr })}: ${m}${gueltig(last) ? ` × ${zahl(last)} kg` : ''}`;
}

/** Eine Uebung: Name, darunter die Saetze. Ohne Saetze gar nichts. */
function uebung(name, saetze, o) {
  const zeilen = saetze.map((s, i) => satzZeile(i + 1, s.menge, s.einheit || 'Wdh', s.last, o));
  return zeilen.length ? [name, ...zeilen] : [];
}

function kraft(log, o) {
  const liftName = id => (o.config.lifts && o.config.lifts[id] && o.config.lifts[id].name) || id;
  const out = [];
  for (const e of Array.isArray(log.lifts) ? log.lifts : []) {
    const saetze = (e.reps || []).filter(gueltig).map(r => ({ menge: r, last: e.weight }));
    out.push(...uebung(liftName(e.lift), saetze, o));
  }
  for (const h of Array.isArray(log.hilfs) ? log.hilfs : []) {
    const saetze = (h.reps || []).filter(gueltig).map(r => ({ menge: r }));
    out.push(...uebung(o.name('hilfs', h.id), saetze, o));
  }
  return { titel: log.workout ? o.t('strava.kraft', { w: log.workout }) : o.t('strava.kraftOhne'), zeilen: out };
}

function moshpit(log, o) {
  const out = [];
  for (const e of Array.isArray(log.uebungen) ? log.uebungen : []) {
    const n = Math.max(0, Math.min(Number(e.sets) || 0, Number(e.erledigt) || 0));
    const saetze = Array.from({ length: n }, () => ({ menge: e.reps, last: e.kg }));
    out.push(...uebung(o.name('mosh', e.lift), saetze, o));
  }
  return { titel: o.t('strava.mosh'), zeilen: out };
}

function kurs(log, o) {
  const titel = o.t('strava.kurs', { woche: log.woche, tag: log.tag });
  const e = KU.einheit(Number(log.woche), String(log.tag));
  if (!e) return { titel, zeilen: [] };
  const kugeln = log.kugeln && typeof log.kugeln === 'object' ? log.kugeln : {};
  const out = [];
  for (const b of e.bloecke) {
    if (b.warm || b.art === 'rad') continue;
    const last = b.ohneLast ? 0 : Number(kugeln[KU.kugelSchluessel(b)]) || 0;
    let saetze = [];
    if (b.art === 'takt') saetze = Array.from({ length: b.runden }, () => ({ menge: b.wdh, last }));
    else if (b.art === 'zeit') saetze = Array.from({ length: b.saetze }, () => ({ menge: b.sek, einheit: 's', last }));
    else saetze = Array.from({ length: b.saetze }, () => ({ menge: b.wdh, last }));
    out.push(...uebung(KU.blockName(b), saetze, o));
  }
  return { titel, zeilen: out };
}

function jam(log, o) {
  const wod = log.wod || {};
  const runden = Math.max(1, Math.round(Number(wod.runden)) || 1);
  const out = [];
  for (const teil of Array.isArray(wod.teile) ? wod.teile : []) {
    if (!gueltig(teil.menge)) continue;
    // Meter und Sekunden sind keine Wiederholungen: dort steht die Einheit im Namen.
    const zaehlt = !teil.einheit || teil.einheit === 'Wdh';
    const name = zaehlt ? teil.name : `${teil.name} (${teil.einheit})`;
    const saetze = Array.from({ length: runden }, () => ({ menge: teil.menge, last: teil.last }));
    out.push(...uebung(name, saetze, o));
  }
  return { titel: o.t('strava.jam'), zeilen: out };
}

const ART = { strength: kraft, undefined: kraft, moshpit, kurs, wod: jam };

/**
 * Der Text zu einer Einheit, oder '' wenn es dazu nichts Sinnvolles gibt.
 * `name(art, id)` liefert Anzeigenamen (Hilfsuebung, Mosh-Pit-Lift).
 */
export function stravaText(log, { config = {}, t, zahl = String, name = (art, id) => id } = {}) {
  if (!log || typeof log !== 'object' || typeof t !== 'function') return '';
  const f = ART[log.type];
  if (!f) return '';
  const { titel, zeilen } = f(log, { config, t, zahl, name });
  if (!zeilen.length) return '';
  return [`${titel} · ${log.date || ''}`.trim(), '', ...zeilen].join('\n');
}
