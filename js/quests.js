// Quests: langfristige Ziele im Monat eines Drops, aus dem Log gerechnet.
//
// Eine Quest steht im Drop (drops-daten.js): Name, Text, Stufe (episch oder
// legendaer) und eine Regel. Die Regeln liegen hier als Funktionen; ein Drop
// verweist nur mit Typ und Zahl darauf, damit ein Datensatz nichts ausfuehren
// kann. Erfuellt wird von selbst aus dem Log, nichts wird gespeichert. Nur Tage
// im Monat des Drops zaehlen — ein verpasster Monat laesst sich nicht nachholen.
// Der Lohn ist ein Quest-Plektrum, das es sonst nirgends gibt (drops.js).
//
// Reine Funktionen, kein I/O.

import { istTraining } from './program.js';
import { tonnage } from './stats.js';

export const REGELN = ['tage', 'wochen', 'tonnen', 'lift'];
export const STUFEN = ['e', 'l'];

const typ = l => l.type || 'strength';
const tageSortiert = ls => [...new Set(ls.map(l => l.date))].sort();

/** Der Montag der Woche, in der `iso` liegt (JJJJ-MM-TT, UTC). */
export function montag(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
const naechsteWoche = m => { const d = new Date(`${m}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 7); return d.toISOString().slice(0, 10); };

/** Was an einer Regel nicht stimmt: leere Liste = in Ordnung. */
export function pruefeRegel(r) {
  const f = [];
  if (!r || !REGELN.includes(r.typ)) return ['regel: unbekannter Typ'];
  if (!Number.isInteger(r.n) || r.n < 1 || r.n > 1000) f.push('regel: n muss eine ganze Zahl von 1 bis 1000 sein');
  if (r.typ === 'lift' && (typeof r.lift !== 'string' || !r.lift || !(r.kg > 0))) f.push('regel lift: lift und kg noetig');
  return f;
}

const istMobility = l => l.type === 'mobility' || (typ(l) === 'strength' && l.mobility);
const vortagVon = monat => { const d = new Date(`${monat}-01T12:00:00Z`); d.setUTCDate(0); return d.toISOString().slice(0, 10); };
const wochenZwischen = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / (7 * 86400000));

/**
 * Der Stand einer Quest im Monat `monat` ('JJJJ-MM'): `ist` von `ziel`
 * (ist wird bei der Zielzahl gekappt) und `erledigt`, der Tag, an dem sie
 * erreicht war, oder null.
 *   tage    n verschiedene Trainingstage
 *   wochen  n Wochen (Mo bis So) in Folge, in jeder mindestens ein Trainingstag im Monat
 *   tonnen  n Tonnen bewegtes Gewicht
 *   lift    n Tage, an denen der Lift mit mindestens kg alle Saetze geschafft wurde
 * `w` sind die Wirkungen der Talente (talente.js); ohne sie gilt die Regel wie geschrieben:
 *   tonnenFaktor, liftMinus, kugelDoppelt, mobilitaetZaehlt, mobilitaetWoche, lueckeWoche, vortag
 */
export function stand(quest, logs = [], monat, w = {}) {
  const r = quest.regel;
  const vortag = w.vortag ? vortagVon(monat) : null;
  const ls = logs.filter(l => l && l.date && (l.date.startsWith(monat) || l.date === vortag));
  const fertig = (ziel, ist, tag) => ({ ist: Math.min(ist, ziel), ziel, erledigt: ist >= ziel ? tag : null });
  // Tage, die als Training gelten: dazu bei Bedarf Mobility
  const trainiert = () => tageSortiert(ls.filter(l => istTraining(l) || (w.mobilitaetZaehlt && istMobility(l))));
  if (r.typ === 'tage') {
    const t = trainiert();
    return fertig(r.n, t.length, t[r.n - 1] || null);
  }
  if (r.typ === 'wochen') {
    const erste = new Map();   // Montag -> erster Tag, der in dieser Woche zaehlt
    for (const d of trainiert()) { const m = montag(d); if (!erste.has(m)) erste.set(m, d); }
    if (w.mobilitaetWoche) {
      const proWoche = new Map();
      for (const d of tageSortiert(ls.filter(istMobility))) { const m = montag(d); proWoche.set(m, [...(proWoche.get(m) || []), d]); }
      for (const [m, tage] of proWoche) if (tage.length >= 2 && !erste.has(m)) erste.set(m, tage[1]);
    }
    const luecke = w.lueckeWoche || 0;
    let lauf = 0, best = 0, tag = null, vor = null;
    for (const m of [...erste.keys()].sort()) {
      lauf = vor && wochenZwischen(vor, m) - 1 <= luecke ? lauf + 1 : 1;
      vor = m;
      best = Math.max(best, lauf);
      if (lauf >= r.n && !tag) tag = erste.get(m);
    }
    return fertig(r.n, best, tag);
  }
  if (r.typ === 'tonnen') {
    const ziel = Math.max(1, Math.ceil(r.n * (w.tonnenFaktor || 1)));
    let kg = 0, tag = null;
    for (const l of [...ls].sort((a, b) => a.date.localeCompare(b.date))) {
      kg += tonnage(l) * (w.kugelDoppelt && (typ(l) === 'kurs' || typ(l) === 'moshpit') ? 2 : 1);
      if (!tag && kg / 1000 >= ziel) tag = l.date;
    }
    return { ist: Math.min(Math.round(kg / 100) / 10, ziel), ziel, erledigt: tag };
  }
  // lift
  const kg = r.kg - (w.liftMinus || 0);
  const t = tageSortiert(ls.filter(l => typ(l) === 'strength' && Array.isArray(l.lifts) &&
    l.lifts.some(e => e && e.lift === r.lift && e.success === true && (e.weight || 0) >= kg)));
  return fertig(r.n, t.length, t[r.n - 1] || null);
}
