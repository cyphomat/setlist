// Drops: ein Datensatz je Monat mit Plektren, Saetzen fuer den Roadie und
// belegten Fakten. Daten, kein Dienst — Setlist ist eine statische Seite; ein
// neuer Monat ist ein Eintrag in drops-daten.js (und damit ein Commit).
//
// Freigeschaltet wird nach Uebungstagen im Monat des Drops (FREISCHALTUNG:
// gewoehnlich 3, selten 8, episch 14). Ein vergangener Monat bleibt, wie der
// Log ihn hinterlassen hat; nachholen geht nicht, weil nur Tage in diesem Monat
// zaehlen. Nichts wird gespeichert, ausser dass die Karte gesehen wurde — und
// das nur auf dem Geraet.
//
// Ein Drop kann Quests tragen (js/quests.js); ihr Lohn ist ein Plektrum mit Feld `quest` und Stufe 'q'.
// Ein Plektrum kann statt an Uebungstagen an einem Tuerchen des Adventskalenders
// haengen (Feld `tuer`, nur im Dezember-Drop; js/advent.js).
//
// Reine Funktionen, kein I/O (bis auf gesehen/setzeGesehen unten).

import { istTraining } from './program.js';
import { DROPS } from './drops-daten.js';
import { erledigt as adventErledigt, TUEREN } from './advent.js';
import { stand as questStand, pruefeRegel, STUFEN as QUEST_STUFEN } from './quests.js';

export const FREISCHALTUNG = { g: 3, s: 8, e: 14 };
/** Die Zugabe erscheint erst, wenn alle anderen Plektren des Drops verdient sind. */
export const STUFEN = ['g', 's', 'e', 'z', 'q'];   // q: Lohn einer Quest, nur ueber sie zu haben
export const GESEHEN = 'setlist.dropGesehen';

/** Ein Text mit Uebersetzung: { de, en }. Fehlt die Sprache, gilt Deutsch. */
export const lokal = (o, sprache = 'de') => (o && (o[sprache] || o.de)) || '';

/** Was nicht durchkommen darf: leere Liste = Drop ist in Ordnung. */
export function pruefeDrop(d) {
  const f = [];
  const text = (o, n) => { if (!o || !o.de || !o.en) f.push(`${n}: de und en noetig`); };
  if (!d || !/^\d{4}-\d{2}$/.test(d.id || '')) return ['id: YYYY-MM erwartet'];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.datum || '') || !d.datum.startsWith(d.id)) f.push('datum liegt nicht im Monat');
  text(d.titel, 'titel'); text(d.thema, 'thema'); text(d.text, 'text');
  if (!Array.isArray(d.sprueche) || !d.sprueche.length) f.push('sprueche fehlen');
  else d.sprueche.forEach((s, i) => text(s, `spruch ${i + 1}`));
  const alle = [...(d.plektren || []), ...(d.zugabe ? [d.zugabe] : [])];
  if (!(d.plektren || []).some(p => p.stufe === 'g')) f.push('keine gewoehnlichen Plektren');
  const ids = new Set();
  for (const p of alle) {
    if (!p.id || ids.has(p.id)) f.push(`id doppelt oder leer: ${p.id}`);
    ids.add(p.id);
    if (!STUFEN.includes(p.stufe)) f.push(`${p.id}: Stufe ${p.stufe}`);
    text(p.name, `${p.id}.name`); text(p.text, `${p.id}.text`);
    if (!/^#[0-9a-fA-F]{6}$/.test(p.farbe || '')) f.push(`${p.id}: Farbe`);
    if (p.tuer !== undefined && !(Number.isInteger(p.tuer) && p.tuer >= 1 && p.tuer <= TUEREN && d.id.endsWith('-12'))) f.push(`${p.id}: tuer nur 1-${TUEREN} im Dezember-Drop`);
    if (p.stufe === 's' || p.stufe === 'e' || p.stufe === 'z') {
      text(p.fakt, `${p.id}.fakt`);
      if (!/^https:\/\/\S+$/.test(p.quelle || '')) f.push(`${p.id}: https-Quelle fehlt`);
    }
  }
  if (d.zugabe && d.zugabe.stufe !== 'z') f.push('zugabe hat Stufe z');
  const qIds = new Set();
  for (const q of d.quests || []) {
    if (!q.id || qIds.has(q.id)) f.push(`quest: id doppelt oder leer: ${q.id}`);
    qIds.add(q.id);
    if (!QUEST_STUFEN.includes(q.stufe)) f.push(`${q.id}: Quest-Stufe e oder l`);
    text(q.name, `${q.id}.name`); text(q.text, `${q.id}.text`);
    pruefeRegel(q.regel).forEach(x => f.push(`${q.id}: ${x}`));
    if (alle.filter(p => p.quest === q.id).length !== 1) f.push(`${q.id}: genau ein Plektrum als Lohn noetig`);
  }
  for (const p of alle) {
    if (p.quest !== undefined && !qIds.has(p.quest)) f.push(`${p.id}: Quest ${p.quest} gibt es nicht`);
    if (p.stufe === 'q' && p.quest === undefined) f.push(`${p.id}: Stufe q nur mit quest`);
  }
  const tuerIds = alle.filter(p => p.tuer !== undefined).map(p => p.tuer);
  if (new Set(tuerIds).size !== tuerIds.length) f.push('tuer doppelt vergeben');
  return f;
}

/** Verschiedene Trainingstage im Monat ('YYYY-MM'), sortiert. */
export function tageImMonat(logs = [], monat) {
  return [...new Set(logs.filter(l => istTraining(l) && l.date.startsWith(monat)).map(l => l.date))].sort();
}

/**
 * Der Stand eines Drops: je Plektrum das Datum der Freischaltung oder null.
 * Die Zugabe gibt es erst, wenn alle anderen verdient sind, und zaehlt in
 * `n` von `gesamt` vorher nicht mit.
 */
export function dropStand(drop, logs = []) {
  const tage = tageImMonat(logs, drop.id);
  const tueren = (drop.plektren || []).some(p => p.tuer) ? adventErledigt(logs, +drop.id.slice(0, 4)) : {};
  const quests = (drop.quests || []).map(q => ({ ...q, ...questStand(q, logs, drop.id) }));
  const qErledigt = Object.fromEntries(quests.map(q => [q.id, q.erledigt]));
  const mit = p => ({ ...p, verdient: p.quest ? (qErledigt[p.quest] || null) : p.tuer ? (tueren[p.tuer] || null) : tage.length >= FREISCHALTUNG[p.stufe] ? tage[FREISCHALTUNG[p.stufe] - 1] : null });
  const normal = (drop.plektren || []).map(mit);
  let zugabe = null;
  // Die Zugabe haengt nicht an den Quests: sie waere sonst nur mit dem Schwersten zu haben.
  const ohneQuest = normal.filter(p => !p.quest);
  if (drop.zugabe && ohneQuest.length && ohneQuest.every(p => p.verdient)) {
    zugabe = { ...drop.zugabe, verdient: ohneQuest.map(p => p.verdient).sort().pop() };
  }
  const liste = zugabe ? [...normal, zugabe] : normal;
  return { drop, tage: tage.length, plektren: liste, n: liste.filter(p => p.verdient).length, gesamt: normal.length,
    komplett: ohneQuest.length > 0 && ohneQuest.every(p => p.verdient), zugabeDa: !!zugabe, quests };
}

/** Der Drop dieses Monats — oder der juengste davor, bis ein neuer kommt. */
export function aktuellerDrop(heute = new Date(), drops = DROPS) {
  const iso = typeof heute === 'string' ? heute : `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, '0')}-${String(heute.getDate()).padStart(2, '0')}`;
  return [...drops].filter(d => d.datum <= iso).sort((a, b) => a.datum.localeCompare(b.datum)).pop() || null;
}

/** Alle Drops bis heute, aeltester zuerst. */
export const dropsBis = (heute = new Date(), drops = DROPS) => {
  const iso = typeof heute === 'string' ? heute : `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, '0')}-${String(heute.getDate()).padStart(2, '0')}`;
  return drops.filter(d => d.datum <= iso).sort((a, b) => a.datum.localeCompare(b.datum));
};

/** Neu dazugekommen: vorher gegen nachher ueber alle Drops. */
export function neueDropPlektren(vorherLogs = [], nachherLogs = [], heute = new Date(), drops = DROPS) {
  const neu = [];
  for (const d of dropsBis(heute, drops)) {
    const alt = new Set(dropStand(d, vorherLogs).plektren.filter(p => p.verdient).map(p => p.id));
    for (const p of dropStand(d, nachherLogs).plektren) if (p.verdient && !alt.has(p.id)) neu.push({ ...p, drop: d.id });
  }
  return neu;
}

/** Quests, die am Tag `iso` erfuellt wurden, ueber alle Drops bis heute: { id, name, drop }. */
export function questsErledigtAm(logs = [], iso, heute = new Date(), drops = DROPS) {
  return dropsBis(heute, drops).flatMap(d => dropStand(d, logs).quests.filter(q => q.erledigt === iso).map(q => ({ id: q.id, name: q.name, drop: d.id })));
}

/** Schon angesagte Quests, pro Geraet: damit eine zweite Einheit am selben Tag nichts doppelt feiert. */
export const ANGESAGT = 'setlist.questAngesagt';
export function questAngesagt(id) { try { return (JSON.parse(localStorage.getItem(ANGESAGT) || '[]')).includes(id); } catch { return false; } }
export function setzeQuestAngesagt(id) {
  try { const l = JSON.parse(localStorage.getItem(ANGESAGT) || '[]'); if (!l.includes(id)) localStorage.setItem(ANGESAGT, JSON.stringify([...l, id])); } catch { /* egal */ }
}

/** "Gesehen" pro Geraet: nur die Kennung des zuletzt gesehenen Drops. */
export function gesehen() { try { return localStorage.getItem(GESEHEN); } catch { return null; } }
export function setzeGesehen(id) { try { localStorage.setItem(GESEHEN, id); } catch { /* egal */ } }
