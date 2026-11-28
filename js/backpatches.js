// Die Rueckenpatches: sechs grosse Aufnaeher hinten auf der Kutte.
//
// Selten und gross gedacht, jeder die Spitze einer Leiter, die es als kleiner
// Aufnaeher oder Rang schon gibt. Alles faellt aus den Logs und wird nirgends
// gespeichert — nur welcher Patch getragen wird, gehoert dem Geraet (app.js).
// Belohnt wird Regelmaessigkeit: kein Patch fuer Menge an einem Abend.
//
// Die Reihenfolge ist die der Bilder in assets/pixel/backpatches.png
// (tools/pixel-backpatches.mjs); tools/pixel.mjs bricht ab, wenn beide auseinanderlaufen.
//
// Reine Funktionen, kein I/O. Namen und Bedingungen stehen in i18n.js (bp.*).

import { rang, RAENGE, schallplatten, monatsTouren } from './merch.js';
import { serie, serienMarken } from './soundcheck.js';
import { besitz, meisterschaft, aeste } from './talente.js';

export const BACKPATCHES = ['headliner', 'legende', 'adamant', 'gegnerjaeger', 'dauerbrenner', 'meister'];

export const ZIELE = { gegnerjaeger: 12, dauerbrenner: 26 };

/**
 * Jeder Patch mit dem Tag, an dem er verdient wurde (oder null) und dem Stand
 * `ist` von `ziel` — `einheit` sagt, was gezaehlt wird, damit die Anzeige den Satz bauen kann.
 */
export function rueckenpatches(logs = [], config = {}, { fahrten = [], heute = new Date(), soundchecks = [] } = {}) {
  const r = rang(logs, fahrten);
  const rangPatch = (id, einheit = 'wochen') => {
    const k = RAENGE.findIndex(x => x.id === id);
    return { verdient: r.freigespielt[k] || null, ist: Math.min(r.wochen, RAENGE[k].wochen), ziel: RAENGE[k].wochen, einheit };
  };
  const adamant = schallplatten(logs);
  const stufeAdamant = adamant.stufen.find(s => s.id === 'adamant');
  const bosse = monatsTouren(logs, config, { fahrten, heute }).filter(m => m.besiegtAm).map(m => m.besiegtAm).sort();
  const marken = serienMarken(soundchecks, [ZIELE.dauerbrenner]);
  const lauf = marken[ZIELE.dauerbrenner] || null;
  const meister = meisterschaft(besitz(logs, aeste()));
  const ganz = meister.every(m => m.fertig);
  return BACKPATCHES.map(id => {
    switch (id) {
      case 'headliner': return { id, ...rangPatch('headliner') };
      case 'legende': return { id, ...rangPatch('halloffame') };
      case 'adamant': return { id, verdient: stufeAdamant.verdient, ist: Math.min(adamant.tonnen, stufeAdamant.tonnen), ziel: stufeAdamant.tonnen, einheit: 'tonnen' };
      case 'gegnerjaeger': return { id, verdient: bosse[ZIELE.gegnerjaeger - 1] || null, ist: Math.min(bosse.length, ZIELE.gegnerjaeger), ziel: ZIELE.gegnerjaeger, einheit: 'monate' };
      case 'dauerbrenner': return { id, verdient: lauf, ist: lauf ? ZIELE.dauerbrenner : Math.min(serie(soundchecks, heute), ZIELE.dauerbrenner), ziel: ZIELE.dauerbrenner, einheit: 'folge' };
      default: return { id, verdient: ganz ? meister.map(m => m.datum).sort().pop() : null, ist: meister.filter(m => m.fertig).length, ziel: meister.length, einheit: 'aeste' };
    }
  });
}

/** Der getragene Patch: die Wahl, wenn sie verdient ist, sonst der zuletzt verdiente, sonst keiner. */
export function getragen(liste = [], wahl = null) {
  const da = liste.filter(p => p.verdient);
  if (!da.length) return null;
  const gewaehlt = da.find(p => p.id === wahl);
  if (gewaehlt) return gewaehlt.id;
  return da.slice().sort((a, b) => a.verdient.localeCompare(b.verdient)).pop().id;
}
