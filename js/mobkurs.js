// Mobility-Kurs — vier Uebungen, gefuehrt von der Uhr, rund acht Minuten.
//
// Bis hierhin war "Mobility" eine Liste in der Bibliothek mit einem Haken.
// Das hier ist der gefuehrte Weg: die Uhr sagt, was jetzt dran ist, wechselt
// die Seite und gibt zehn Sekunden zum Umsetzen. Die Uebungen selbst bleiben
// die aus `MOBILITY` (js/content.js) — hier steht nur, wie lange jede dauert,
// ob sie je Seite laeuft und ein Satz zur Ausfuehrung.
//
// Die Auswahl ist pro Tag fest und mit dem Wuerfel aenderbar: je eine
// Uebung aus Hueft-, Brust/Schulter- und Fuss/Bein-Gruppe, die vierte aus
// dem Rest. So kommt nicht viermal die Huefte hintereinander.
//
// Reine Funktionen, kein I/O.

import { rng, seedAus } from './wod.js';

/** Sekunden Umsetzen zwischen zwei Uebungen (und vor der ersten). */
export const PAUSE = 10;
/** Sekunden beim Seitenwechsel innerhalb einer Uebung. */
export const WECHSEL = 5;
export const ANZAHL = 4;

/** Standard fuer Uebungen, die jemand selbst in die config gelegt hat. */
const STANDARD = { sek: 45, seiten: false, cue: '' };

/* `sek` gilt je Seite, wenn `seiten` gesetzt ist. Die Dosis in der
   Bibliothek (z. B. "2x 60 Sek") ist die volle Einheit; der Kurs macht
   davon eine Runde, damit er kurz bleibt.                                */
export const ZEITEN = {
  'huefte-couch-stretch': { sek: 60, seiten: true, gruppe: 'huefte',
    cue: 'Hinteres Knie am Boden, Becken nach vorn schieben, Oberkörper aufrecht.' },
  'pigeon-pose': { sek: 60, seiten: true, gruppe: 'huefte',
    cue: 'Vorderes Schienbein quer, die Hüfte Richtung Boden sinken lassen, ruhig atmen.' },
  '90-90-huefte': { sek: 60, seiten: false, gruppe: 'huefte',
    cue: 'Beide Knie 90°, Becken bleibt am Boden, die Knie langsam zur anderen Seite wechseln.' },
  'skorpion': { sek: 40, seiten: true, gruppe: 'huefte',
    cue: 'Auf dem Bauch, ein Bein über den Körper zur Gegenseite, die Schultern bleiben am Boden.' },
  'bws-rotation': { sek: 45, seiten: true, gruppe: 'brust',
    cue: 'Vierfüßlerstand, eine Hand am Kopf, den Ellbogen zur Decke aufdrehen, die Hüfte bleibt ruhig.' },
  'wall-slides': { sek: 60, seiten: false, gruppe: 'brust',
    cue: 'Rücken und Unterarme an der Wand, die Arme langsam nach oben schieben, ohne Hohlkreuz.' },
  'doorway-pec-stretch': { sek: 45, seiten: true, gruppe: 'brust',
    cue: 'Unterarm am Türrahmen, die Brust langsam nach vorn öffnen, die Schulter bleibt unten.' },
  'sprunggelenk': { sek: 40, seiten: true, gruppe: 'fuss',
    cue: 'Fuß flach, das Knie über die Zehenspitze schieben, die Ferse bleibt unten.' },
  'beinbeuger-dehnung': { sek: 45, seiten: true, gruppe: 'fuss',
    cue: 'Liegend, Band um den Fuß, das gestreckte Bein aktiv heranziehen, das Becken bleibt flach.' },
  'handgelenk': { sek: 45, seiten: false, gruppe: 'fuss',
    cue: 'Hände flach auf den Boden, die Finger mal zu dir, mal weg, dann die Handgelenke langsam kreisen.' }
};

export const GRUPPEN = ['huefte', 'brust', 'fuss'];

const zeiten = id => ({ ...STANDARD, ...(ZEITEN[id] || {}) });

/** Eine Uebung mit allem, was der Kurs braucht. */
function teil(u) {
  const z = zeiten(u.id);
  return { id: u.id, name: u.name, dosis: u.dosis || '', warum: u.warum || '', cue: z.cue,
    sek: z.sek, seiten: z.seiten, sekunden: z.sek * (z.seiten ? 2 : 1) };
}

/**
 * Der Kurs eines Tages. `uebungen` sind die erlaubten (ohne Verletzungssperre),
 * `datum` ein ymd-String, `seed` zaehlt beim Wuerfeln hoch. Gleiche Eingabe,
 * gleicher Kurs. Weniger als `anzahl` Uebungen: dann eben weniger.
 */
export function baueKurs({ uebungen = [], datum = '', seed = 0, anzahl = ANZAHL } = {}) {
  const r = rng(seedAus(`${datum}:${seed}:mobkurs`));
  const frei = uebungen.slice();
  const waehle = liste => liste.splice(Math.floor(r() * liste.length), 1)[0];
  const gewaehlt = [];
  for (const g of GRUPPEN) {
    if (gewaehlt.length >= anzahl) break;
    const kandidaten = frei.filter(u => zeiten(u.id).gruppe === g);
    if (!kandidaten.length) continue;
    const u = waehle(kandidaten);
    frei.splice(frei.indexOf(u), 1);
    gewaehlt.push(u);
  }
  while (gewaehlt.length < anzahl && frei.length) gewaehlt.push(waehle(frei));
  const teile = gewaehlt.map(teil);
  const gesamtSekunden = ablauf({ teile }).reduce((s, a) => s + a.sekunden, 0);
  return { datum, seed, teile, gesamtSekunden, minuten: Math.max(1, Math.round(gesamtSekunden / 60)) };
}

/**
 * Die Schritte der Reihe nach, vorab berechnet (wie bei Unplugged): die
 * Uhr zaehlt nur ab. Vor jeder Arbeit steht eine Pause mit dem Hinweis,
 * was als Naechstes kommt — auch vor der allerersten.
 */
export function ablauf(kurs) {
  const schritte = [];
  const n = kurs.teile.length;
  kurs.teile.forEach((tl, i) => {
    const seiten = tl.seiten ? [1, 2] : [0];
    seiten.forEach((seite, k) => {
      schritte.push({ art: 'pause', sekunden: k === 0 ? PAUSE : WECHSEL, nr: i + 1, gesamt: n,
        naechster: { teil: tl, seite } });
      schritte.push({ art: 'arbeit', sekunden: tl.sek, nr: i + 1, gesamt: n, teil: tl, seite });
    });
  });
  return schritte;
}

/** Eine Zeile Klartext fuer Log und Historie. */
export function label(kurs) {
  return `Mobility-Kurs · ${kurs.minuten} Min · ${kurs.teile.map(x => x.name).join(' / ')}`;
}

/**
 * Das Log. `uebung` bleibt die erste Uebung: Zaehler, Aufnaeher und aeltere
 * Auswertungen lesen nur dieses Feld, und sie sollen weiter laufen wie bisher.
 */
export function alsLog(kurs, { jetzt = new Date(), ymd, ort = '' } = {}) {
  const log = {
    date: ymd, type: 'mobility',
    uebung: kurs.teile[0] ? kurs.teile[0].id : '',
    uebungen: kurs.teile.map(x => x.id),
    label: label(kurs),
    dauerSekunden: kurs.gesamtSekunden,
    seed: kurs.seed,
    finished: jetzt.toISOString()
  };
  if (ort) log.ort = ort;
  return log;
}
