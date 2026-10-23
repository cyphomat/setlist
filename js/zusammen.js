// Zusammen trainieren: eine Verabredung als eigene Datei im Datenrepo
// (zusammen/JJJJ-MM-TT-<id>.json), getrennt von den Einheiten — sie ist
// kein Training und aendert am Programm nichts. Wie beim Wochen-Soundcheck
// muss deshalb nichts, was Einheiten liest, etwas davon wissen.
//
// Jede Person fuehrt nur ihre eigene Seite: wer mit wem, an welchem Tag, und
// ob der Handschlag zustande kam. Daten der anderen Person werden nie
// gefuehrt. Die Aufnaeher werden daraus abgeleitet, nirgends gespeichert.
//
// Eine gemeinsame Einheit ist eine Verabredung PLUS ein Gig-Log am selben
// Tag — wer eincheckt und dann nicht trainiert, bekommt nichts. Welche Tage
// Gigs waren, reicht merch.js als Menge herein; so bleibt dieses Modul frei
// von Abhaengigkeiten auf die Einheiten.
//
// Reine Funktionen, kein I/O.

import { wochenKey } from './soundcheck.js';

export const ORDNER = 'zusammen';
export const NAME_MAX = 24;
export const ROLLEN = ['einlader', 'gast'];

const ID = /^[a-z2-7]{10}$/;
const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

export const istId = s => ID.test(String(s == null ? '' : s));
export const istDatum = s => DATUM.test(String(s == null ? '' : s));

export const pfad = (datum, id) => `${ORDNER}/${datum}-${id}.json`;

/** { datum, id } aus einem Pfad im Datenrepo, sonst null. */
export function ausPfad(path) {
  const m = /^zusammen\/(\d{4}-\d{2}-\d{2})-([a-z2-7]{10})\.json$/.exec(String(path || ''));
  return m ? { datum: m[1], id: m[2] } : null;
}
export const istPfad = p => ausPfad(p) !== null;

// Steuerzeichen, unsichtbare Zeichen und die, die die Schreibrichtung
// umdrehen: ein Name kommt auch aus einem fremden Link.
const UNSICHTBAR = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g;

/** Ein Name, wie er gespeichert und gezeigt wird — oder null, wenn nichts uebrig bleibt. */
export function bereinigeName(s) {
  const n = String(s == null ? '' : s).replace(UNSICHTBAR, ' ').replace(/\s+/g, ' ').trim()
    .slice(0, NAME_MAX).trim();
  return n || null;
}

/**
 * Eine neue Kennung, zehn Zeichen aus 32. 256 ist durch 32 teilbar, deshalb
 * ist jedes Byte gleich wahrscheinlich — kein Modulo-Fehler. `bytes` kommt
 * nur fuer die Tests von aussen.
 */
export function neueId(bytes = null) {
  let b = bytes;
  if (!b) {
    b = new Uint8Array(10);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b);
    else for (let i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256);
  }
  return Array.from({ length: 10 }, (_, i) => ALPHABET[(b[i] || 0) % 32]).join('');
}

/** Was geschrieben wird: nur die bekannten Felder. Null bei Unsinn. */
export function eintrag({ id, datum, mit, rolle, bestaetigt = false } = {}) {
  if (!istId(id) || !istDatum(datum) || !ROLLEN.includes(rolle)) return null;
  return { id, datum, mit: bereinigeName(mit) || '', rolle, bestaetigt: bestaetigt === true };
}

/** Eine gelesene Datei pruefen; so wie `eintrag`, aber aus fremden Daten. */
export function ausDatei(data) {
  return data && typeof data === 'object' ? eintrag(data) : null;
}

/**
 * Die Tage, an denen verabredet war UND trainiert wurde, aufsteigend, ohne
 * Doppel. `bestaetigt` ist wahr, wenn an dem Tag mindestens ein Handschlag
 * zustande kam. `gigTage` ist eine Menge von 'JJJJ-MM-TT'.
 */
export function gemeinsameTage(eintraege = [], gigTage = new Set()) {
  const tage = new Map();
  for (const e of eintraege) {
    if (!e || !istDatum(e.datum) || !gigTage.has(e.datum)) continue;
    tage.set(e.datum, (tage.get(e.datum) || false) || e.bestaetigt === true);
  }
  return [...tage.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    .map(([datum, bestaetigt]) => ({ datum, bestaetigt }));
}

/** An welchem Tag die n-te gemeinsame Einheit war, je Stufe. */
export function tageMarken(tage = [], stufen = []) {
  const out = {};
  for (const n of stufen) if (tage.length >= n) out[n] = tage[n - 1].datum;
  return out;
}

/** Die Kalenderwochen der gemeinsamen Tage, fuer `serienMarken`. */
export const wochen = (tage = []) => [...new Set(tage.map(t => wochenKey(t.datum)))];

/** Die Verabredungen eines Tages. */
export const amTag = (eintraege = [], datum) => eintraege.filter(e => e && e.datum === datum);

/**
 * Mit wem zuletzt trainiert wurde, juengste zuerst, ohne Doppel und ohne
 * leere Namen. Fuer die Schnellwahl — abgeleitet, nicht gepflegt.
 */
export function zuletztMit(eintraege = [], n = 3) {
  const sortiert = eintraege.filter(e => e && e.mit).sort((a, b) => b.datum.localeCompare(a.datum));
  const out = [];
  for (const e of sortiert) {
    if (!out.some(x => x.toLowerCase() === e.mit.toLowerCase())) out.push(e.mit);
    if (out.length >= n) break;
  }
  return out;
}
