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

/** Der erste Name, der heute eingetragen ist — oder null. Fuer die Pause, die zum Satz der anderen Person wird. */
export const partnerHeute = (eintraege = [], datum) => (amTag(eintraege, datum).find(e => e.mit) || {}).mit || null;

/** Ein Name fuer enge Stellen (Pausenleiste): gekuerzt, mit Auslassungszeichen. */
export const kurz = (name, max = 10) => {
  const n = [...String(name == null ? '' : name)];
  return n.length > max ? `${n.slice(0, max - 1).join('')}…` : n.join('');
};

/* ---------------------------------------------------------------
   Der Handschlag. Zwei Links, die sich die Personen selbst schicken;
   kein Server dazwischen, und im Link steht nur Kennung, Schritt und
   Name — nichts aus dem Datenrepo.

     Schritt 1  die einladende Person teilt ihn
     Schritt 2  die eingeladene Person schickt ihn zurueck

   Beide Seiten fuehren nur ihre eigene Datei. "Bestaetigt" heisst:
   beide Telefone waren am Handschlag beteiligt. Fälschungssicher ist
   das nicht und soll es nicht sein.                                  */

export const LINK_MAX = 500;

/** Der Link, der geteilt wird. `basis` ist die Adresse der App; was dahinter steht, faellt weg. */
export function einladungsLink(basis, { id, schritt, von } = {}) {
  if (!istId(id) || (schritt !== 1 && schritt !== 2)) return null;
  const name = bereinigeName(von);
  const b = String(basis == null ? '' : basis).split('#')[0];
  return `${b}#zusammen=${id}&schritt=${schritt}${name ? `&von=${encodeURIComponent(name)}` : ''}`;
}

const AM_RAND = '(?:^|[#&?\\s])';

/**
 * Aus Text eine Einladung lesen: der volle Link, nur der Teil hinter dem #,
 * oder die Parameter allein — so wie man sie aus einer Nachricht kopiert.
 * Null bei allem, was nicht genau passt. Der Name ist gesaeubert, kann
 * aber null sein.
 */
export function lies(text) {
  const t = String(text == null ? '' : text);
  if (t.length > LINK_MAX) return null;
  const id = new RegExp(`${AM_RAND}zusammen=([a-z2-7]{10})(?![a-z2-7])`).exec(t);
  const schritt = new RegExp(`${AM_RAND}schritt=([12])(?![0-9])`).exec(t);
  if (!id || !schritt) return null;
  const von = new RegExp(`${AM_RAND}von=([^&#\\s]*)`).exec(t);
  let name = null;
  if (von) { try { name = bereinigeName(decodeURIComponent(von[1])); } catch { name = null; } }
  return { id: id[1], schritt: Number(schritt[1]), von: name };
}

/**
 * Was mit einer Einladung geschaehe, ohne etwas zu schreiben:
 *   neu        — kann uebernommen werden
 *   schon      — gibt es hier schon (nochmal annehmen schadet nicht, aendert nichts)
 *   eigene     — die eigene Einladung, nicht annehmbar
 *   unbekannt  — eine Antwort ohne Einladung von diesem Geraet
 *   falsch     — eine Antwort, wo eine Einladung gebraucht wird
 *   ungueltig  — keine Einladung
 */
export function pruefe(einladung, eintraege = []) {
  if (!einladung) return { art: 'ungueltig', eintrag: null };
  const da = eintraege.find(e => e && e.id === einladung.id) || null;
  if (einladung.schritt === 1) {
    if (!da) return { art: 'neu', eintrag: null };
    return { art: da.rolle === 'einlader' ? 'eigene' : 'schon', eintrag: da };
  }
  if (!da) return { art: 'unbekannt', eintrag: null };
  if (da.rolle !== 'einlader') return { art: 'falsch', eintrag: da };
  return { art: da.bestaetigt ? 'schon' : 'neu', eintrag: da };
}

/**
 * Der Eintrag, der zu schreiben ist — oder null, wenn nichts zu tun ist.
 * Schritt 1 legt die Seite der eingeladenen Person an, noch nicht bestaetigt:
 * bestaetigt ist sie, wenn sie die Antwort losgeschickt hat (antwortGesendet).
 * Schritt 2 bestaetigt die Seite der einladenden Person. So hat jede Seite
 * etwas getan, bevor der Handschlag zaehlt.
 */
export function uebernehme(einladung, eintraege = [], datum) {
  const p = pruefe(einladung, eintraege);
  if (p.art !== 'neu') return null;
  if (einladung.schritt === 1) {
    return eintrag({ id: einladung.id, datum, mit: einladung.von, rolle: 'gast', bestaetigt: false });
  }
  return eintrag({ ...p.eintrag, mit: p.eintrag.mit || einladung.von, bestaetigt: true });
}

/** Die eingeladene Person hat die Antwort geteilt oder kopiert — ihre Seite ist bestaetigt. Sonst null. */
export function antwortGesendet(e) {
  if (!e || e.rolle !== 'gast' || e.bestaetigt) return null;
  return eintrag({ ...e, bestaetigt: true });
}
