// Der Adventskalender: 24 Tuerchen, die sich aus dem Log selbst erledigen.
//
// Vom 1. bis 24.12. geht jeden Tag ein Tuerchen auf; nachholen geht bis Silvester.
// Hinter jedem steckt eine kleine Mission, und erledigt ist sie, sobald der Log
// sie zeigt: ab dem Tag des Tuerchens bis zum 31.12. Es gibt nichts abzuhaken,
// nichts wird gespeichert, und wer ein zweites Geraet einrichtet, sieht denselben
// Kalender. Nur "aufgemacht" merkt sich die Anzeige — pro Geraet, siehe auf/setzeAuf.
//
// Alle 24 erledigt: der Aufnaeher "Advent". Fuenf Tuerchen (FUND_TUEREN) legen
// ausserdem ein Plektrum im Dezember-Drop frei (drops.js, Feld `tuer`).
//
// Reine Funktionen, kein I/O (bis auf auf/setzeAuf unten).

import { istTraining } from './program.js';

export const TUEREN = 24;
export const FUND_TUEREN = [6, 11, 15, 19, 22];
export const SCHLUESSEL = 'setlist.adventAuf';

const typ = l => l.type || 'strength';
const EINHEITEN = ['strength', 'wod', 'unplugged', 'kurs', 'moshpit', 'curls', 'maxout'];
const zwei = n => String(n).padStart(2, '0');

/**
 * Die Missionen, in Tuerchen-Reihenfolge. `art` sagt, was der Log zeigen muss:
 *   typ         k Tage mit einer Einheit dieser Art (`typ`)
 *   mobility    k Tage mit Mobility
 *   training    k Trainingstage, egal welche
 *   verschieden k verschiedene Arten von Einheiten
 *   folge       k Trainingstage in Folge
 *   sauber      k Tage mit einer Krafteinheit, in der jeder Satz klappte
 *   wochenende  k Trainingstage am Samstag oder Sonntag
 * Jede Mission muss in dem Fenster zu schaffen sein, das nach ihrem Tuerchen
 * bleibt; advent.test.js prueft das gegen die Tage bis Silvester.
 */
export const MISSIONEN = [
  { n: 1,  art: 'typ', typ: 'strength', k: 1 },
  { n: 2,  art: 'mobility', k: 1 },
  { n: 3,  art: 'training', k: 2 },
  { n: 4,  art: 'typ', typ: 'unplugged', k: 1 },
  { n: 5,  art: 'typ', typ: 'curls', k: 1 },
  { n: 6,  art: 'sauber', k: 1 },
  { n: 7,  art: 'typ', typ: 'wod', k: 1 },
  { n: 8,  art: 'folge', k: 2 },
  { n: 9,  art: 'typ', typ: 'kurs', k: 1 },
  { n: 10, art: 'wochenende', k: 1 },
  { n: 11, art: 'verschieden', k: 3 },
  { n: 12, art: 'mobility', k: 2 },
  { n: 13, art: 'training', k: 4 },
  { n: 14, art: 'typ', typ: 'maxout', k: 1 },
  { n: 15, art: 'folge', k: 3 },
  { n: 16, art: 'sauber', k: 2 },
  { n: 17, art: 'training', k: 5 },
  { n: 18, art: 'typ', typ: 'unplugged', k: 2 },
  { n: 19, art: 'sauber', k: 3 },
  { n: 20, art: 'wochenende', k: 2 },
  { n: 21, art: 'mobility', k: 3 },
  { n: 22, art: 'typ', typ: 'strength', k: 3 },
  { n: 23, art: 'typ', typ: 'wod', k: 1 },
  { n: 24, art: 'mobility', k: 1 }
];

/** Wie weit der Kalender ist: 0 vor dem 1.12., sonst das heutige Tuerchen (ab dem 24.12. die 24). */
export function tag(heute = new Date()) {
  const iso = typeof heute === 'string' ? heute : `${heute.getFullYear()}-${zwei(heute.getMonth() + 1)}-${zwei(heute.getDate())}`;
  if (iso.slice(5, 7) !== '12') return 0;
  return Math.min(TUEREN, +iso.slice(8, 10));
}

/** Gemischte Reihenfolge der Tuerchen im Raster, pro Jahr fest; die 24 sitzt immer am Ende. */
export function reihenfolge(jahr) {
  let s = jahr * 9301 + 49297;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const a = Array.from({ length: TUEREN - 1 }, (_, i) => i + 1);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return [...a, TUEREN];
}

const wochentag = iso => new Date(`${iso}T12:00:00Z`).getUTCDay();
const naechster = iso => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };

/** Das Fenster eines Tuerchens: Logs ab seinem Tag bis zum 31.12. */
function fenster(logs, jahr, n) {
  const von = `${jahr}-12-${zwei(n)}`, bis = `${jahr}-12-31`;
  return logs.filter(l => l && l.date && l.date >= von && l.date <= bis);
}

/** Der Tag, an dem die k-te Bedingung erfuellt war, oder null. */
function ab(tage, k) { const t = [...new Set(tage)].sort(); return t.length >= k ? t[k - 1] : null; }

/** Datum, an dem die Mission des Tuerchens erfuellt wurde, oder null. */
export function erledigtAm(logs = [], jahr, n) {
  const m = MISSIONEN.find(x => x.n === n);
  if (!m) return null;
  const fl = fenster(logs, jahr, n);
  switch (m.art) {
    case 'typ': return ab(fl.filter(l => typ(l) === m.typ).map(l => l.date), m.k);
    case 'mobility': return ab(fl.filter(l => l.type === 'mobility' || (typ(l) === 'strength' && l.mobility)).map(l => l.date), m.k);
    case 'training': return ab(fl.filter(istTraining).map(l => l.date), m.k);
    case 'wochenende': return ab(fl.filter(istTraining).map(l => l.date).filter(d => [0, 6].includes(wochentag(d))), m.k);
    case 'sauber': return ab(fl.filter(l => typ(l) === 'strength' && Array.isArray(l.lifts) && l.lifts.length && l.lifts.every(e => e && e.success === true)).map(l => l.date), m.k);
    case 'verschieden': {
      const gesehen = new Set(); let tag = null;
      for (const l of [...fl].sort((a, b) => a.date.localeCompare(b.date))) {
        if (!EINHEITEN.includes(typ(l))) continue;
        gesehen.add(typ(l));
        if (gesehen.size >= m.k) { tag = l.date; break; }
      }
      return tag;
    }
    case 'folge': {
      const tage = [...new Set(fl.filter(istTraining).map(l => l.date))].sort();
      let lauf = 0, vor = null;
      for (const d of tage) {
        lauf = vor && naechster(vor) === d ? lauf + 1 : 1;
        vor = d;
        if (lauf >= m.k) return d;
      }
      return null;
    }
    default: return null;
  }
}

/** Je Tuerchen das Datum der Erledigung (oder null). Schluessel 1 bis 24. */
export function erledigt(logs = [], jahr) {
  const out = {};
  for (let n = 1; n <= TUEREN; n++) out[n] = erledigtAm(logs, jahr, n);
  return out;
}

/** Datum, an dem alle 24 erledigt waren, oder null: der Tag des letzten. */
export function komplettAm(logs = [], jahr) {
  const e = Object.values(erledigt(logs, jahr));
  return e.every(Boolean) ? e.sort().pop() : null;
}

/** Fuer alle Jahre im Log: Datum des ersten komplett erledigten Kalenders, oder null. */
export function ersterKomplett(logs = []) {
  const jahre = [...new Set(logs.filter(l => l && l.date && l.date.slice(5, 7) === '12').map(l => +l.date.slice(0, 4)))].sort();
  for (const j of jahre) { const d = komplettAm(logs, j); if (d) return d; }
  return null;
}

/** Der Stand fuer die Anzeige: je Tuerchen bereit/zu/erledigt, dazu die Zahlen. */
export function stand(logs = [], heute = new Date(), jahr = null) {
  const iso = typeof heute === 'string' ? heute : `${heute.getFullYear()}-${zwei(heute.getMonth() + 1)}-${zwei(heute.getDate())}`;
  const j = jahr || +iso.slice(0, 4);
  const t = tag(iso), e = erledigt(logs, j);
  const tueren = Array.from({ length: TUEREN }, (_, i) => {
    const n = i + 1;
    return { n, bereit: n <= t, erledigt: e[n], fund: FUND_TUEREN.includes(n), heute: t > 0 && n === +iso.slice(8, 10) };
  });
  const n = tueren.filter(x => x.erledigt).length;
  return { jahr: j, tag: t, tueren, erledigt: n, komplett: n === TUEREN, wartet: tueren.filter(x => x.bereit && !x.erledigt).length };
}

/** Was nach dieser Einheit neu erledigt ist — vorher gegen nachher. */
export function neuErledigt(vorherLogs = [], nachherLogs = [], jahr) {
  const alt = erledigt(vorherLogs, jahr), neu = erledigt(nachherLogs, jahr);
  return Object.keys(neu).map(Number).filter(n => neu[n] && !alt[n]);
}

/** "Aufgemacht" pro Geraet: die Nummern, die angetippt wurden. Rein kosmetisch. */
export function auf(jahr) {
  try { const o = JSON.parse(localStorage.getItem(SCHLUESSEL) || '{}'); return Array.isArray(o[jahr]) ? o[jahr] : []; } catch { return []; }
}
export function setzeAuf(jahr, n) {
  try {
    const o = JSON.parse(localStorage.getItem(SCHLUESSEL) || '{}');
    o[jahr] = [...new Set([...(Array.isArray(o[jahr]) ? o[jahr] : []), n])];
    localStorage.setItem(SCHLUESSEL, JSON.stringify(o));
  } catch { /* egal */ }
}
