// Der Wochen-Soundcheck: einmal die Woche zurueckschauen, bevor die
// naechste losgeht. Was lief gut, was hakt, drei Vorsaetze.
//
// Faellig ist er am Sonntag fuer die laufende Woche und am Montag und
// Dienstag noch fuer die vergangene. Danach ist die Woche vorbei — ein
// Soundcheck nach dem Konzert hilft keinem mehr. Er liegt als eigene Datei
// im Datenrepo (soundcheck/JJJJ-Www.json), getrennt von den Einheiten:
// er ist kein Training und aendert am Programm nichts.
//
// Die Serie und die Aufnaeher brauchen nur die Dateinamen, nicht den Inhalt.
//
// Reine Funktionen, kein I/O.

import { ymd } from './program.js';

export const ORDNER = 'soundcheck';
export const VORSAETZE = 3;
export const TEXT_MAX = 500;
export const VORSATZ_MAX = 120;

const tag = d => new Date(`${d}T12:00:00`);
const plus = (datum, n) => { const d = tag(datum); d.setDate(d.getDate() + n); return ymd(d); };

/** ISO-Woche als 'JJJJ-Www' — die Woche gehoert zum Jahr ihres Donnerstags. */
export function wochenKey(datum) {
  const d = tag(typeof datum === 'string' ? datum : ymd(datum));
  const donnerstag = new Date(d);
  donnerstag.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const jahr = donnerstag.getFullYear();
  const erster = new Date(jahr, 0, 4, 12);
  const erstenMontag = new Date(erster);
  erstenMontag.setDate(erster.getDate() - ((erster.getDay() + 6) % 7));
  const nr = Math.round((donnerstag - erstenMontag) / (7 * 86400000)) + 1;
  return `${jahr}-W${String(nr).padStart(2, '0')}`;
}

const KEY = /^(\d{4})-W(\d{2})$/;
export const istKey = k => KEY.test(String(k || ''));

/** Montag einer ISO-Woche als 'JJJJ-MM-TT'. */
export function montagVon(key) {
  const m = KEY.exec(String(key || ''));
  if (!m) return null;
  const vierter = new Date(Number(m[1]), 0, 4, 12);
  const montag = new Date(vierter);
  montag.setDate(vierter.getDate() - ((vierter.getDay() + 6) % 7) + (Number(m[2]) - 1) * 7);
  return ymd(montag);
}
export const sonntagVon = key => { const m = montagVon(key); return m ? plus(m, 6) : null; };

export const pfad = key => `${ORDNER}/${key}.json`;
/** Woche aus einem Pfad im Datenrepo, sonst null. */
export function ausPfad(path) {
  const m = new RegExp(`^${ORDNER}/(\\d{4}-W\\d{2})\\.json$`).exec(String(path || ''));
  return m && montagVon(m[1]) ? m[1] : null;
}

/**
 * Welche Woche heute faellig ist — oder null. `ab`: der erste Trainingstag;
 * eine Woche, die davor schon zu Ende war, braucht keinen Rueckblick.
 */
export function faellig(heute = new Date(), erledigt = [], { ab = null } = {}) {
  const h = ymd(heute);
  const wt = (tag(h).getDay() + 6) % 7;            // 0 = Mo … 6 = So
  let key;
  if (wt === 6) key = wochenKey(h);
  else if (wt <= 1) key = wochenKey(plus(h, -7));
  else return null;
  if (!ab || sonntagVon(key) < ab) return null;
  return new Set(erledigt).has(key) ? null : key;
}

/** Die Woche davor und danach. */
export const vorige = key => wochenKey(plus(montagVon(key), -7));
export const naechste = key => wochenKey(plus(montagVon(key), 7));

/**
 * Wochen in Folge mit Soundcheck. Gezaehlt wird ab dieser Woche, wenn sie
 * schon erledigt ist, sonst ab der vorigen — die laufende Woche darf noch
 * offen sein, ohne dass die Serie reisst.
 */
export function serie(erledigt = [], heute = new Date()) {
  const da = new Set(erledigt.filter(istKey));
  let k = wochenKey(heute);
  if (!da.has(k)) k = vorige(k);
  let n = 0;
  while (da.has(k)) { n++; k = vorige(k); }
  return n;
}

/** Fuer die Aufnaeher: an welchem Sonntag eine Serie zum ersten Mal n Wochen lang war. */
export function serienMarken(erledigt = [], stufen = []) {
  const keys = [...new Set(erledigt.filter(istKey))].sort();
  const out = {};
  let lauf = 0, davor = null;
  for (const k of keys) {
    lauf = davor && naechste(davor) === k ? lauf + 1 : 1;
    davor = k;
    for (const n of stufen) if (lauf >= n && !out[n]) out[n] = sonntagVon(k);
  }
  return out;
}

const text = (s, max) => String(s == null ? '' : s).replace(/\r\n?/g, '\n').trim().slice(0, max);

/** Was geschrieben wird: nur die bekannten Felder, gekuerzt, ohne leere Vorsaetze. */
export function bereinige({ woche, lief, hakt, vorsaetze } = {}, jetzt = new Date()) {
  if (!istKey(woche) || !montagVon(woche)) return null;
  return {
    woche,
    lief: text(lief, TEXT_MAX),
    hakt: text(hakt, TEXT_MAX),
    vorsaetze: (Array.isArray(vorsaetze) ? vorsaetze : []).map(v => text(v, VORSATZ_MAX).replace(/\n/g, ' '))
      .filter(Boolean).slice(0, VORSAETZE),
    abgeschlossen: jetzt.toISOString()
  };
}
