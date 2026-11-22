// Talentpunkte: woher sie kommen und wie viele noch frei sind.
//
// Alles aus dem Log, nichts gespeichert. Quellen:
//   Quest      erfuellte epische Quest 1 Punkt, legendaere 2 (drops.js, quests.js)
//   Advent     jedes Fundstueck-Tuerchen 1 Punkt, der komplette Kalender 3 (advent.js)
//   Glueckstag selten nach einem Training: jeder SELTEN-te Trainingstag, gewaehlt
//              ueber einen Hash des Datums — nicht gewuerfelt, auf jedem Geraet gleich
//
// Reine Funktionen, kein I/O.

import { istTraining } from './program.js';
import { hash } from './roadie.js';
import { SELTEN } from './talente.js';
import { dropsBis, dropStand } from './drops.js';
import { erledigt as adventErledigt, komplettAm, FUND_TUEREN } from './advent.js';

export const PUNKTE_QUEST = { e: 1, l: 2 };
export const PUNKTE_ADVENT_FUND = 1;
export const PUNKTE_ADVENT_KOMPLETT = 3;

/** Trainingstage, an denen es einen Punkt gab. */
export function glueckstage(logs = []) {
  const tage = [...new Set(logs.filter(istTraining).map(l => l.date))].sort();
  return tage.filter(d => hash(`talent-${d}`) % SELTEN === 0);
}

/**
 * Alle Punkte bis heute: { gesamt, liste: [{ art, datum, punkte, ref }] }, nach Datum.
 * `wirkungen` geht an die Quests (ein Talent kann ein Ziel erleichtern).
 */
export function punkte(logs = [], heute = new Date(), wirkungen = {}) {
  const liste = [];
  for (const d of dropsBis(heute)) {
    for (const q of dropStand(d, logs, { wirkungen }).quests) {
      if (q.erledigt) liste.push({ art: 'quest', datum: q.erledigt, punkte: PUNKTE_QUEST[q.stufe] || 1, ref: q.id });
    }
  }
  const jahre = new Set(logs.filter(l => l && l.date && l.date.slice(5, 7) === '12').map(l => +l.date.slice(0, 4)));
  for (const j of jahre) {
    const e = adventErledigt(logs, j);
    for (const n of FUND_TUEREN) if (e[n]) liste.push({ art: 'advent', datum: e[n], punkte: PUNKTE_ADVENT_FUND, ref: `tuer-${n}` });
    const k = komplettAm(logs, j);
    if (k) liste.push({ art: 'advent', datum: k, punkte: PUNKTE_ADVENT_KOMPLETT, ref: `komplett-${j}` });
  }
  for (const d of glueckstage(logs)) liste.push({ art: 'glueck', datum: d, punkte: 1, ref: d });
  liste.sort((a, b) => a.datum.localeCompare(b.datum) || a.art.localeCompare(b.art));
  return { gesamt: liste.reduce((s, p) => s + p.punkte, 0), liste };
}

/** Frei verfuegbar: verdient minus ausgegeben (nie unter null). */
export const verfuegbar = (gesamt, haben = []) => Math.max(0, gesamt - haben.reduce((s, h) => s + (h.kosten || 1), 0));
