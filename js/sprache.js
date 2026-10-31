// Ansagen per Sprache im Kurs — fuer den Keller, wo das Handy an der Anlage
// haengt und der Bildschirm nicht im Blick ist: Umbau, Pause, Handwechsel und
// die naechste Uebung werden gesagt, nicht nur gepiept.
//
// Die Texte sind reine Funktionen (sprechtext) und nehmen die Helfer der
// Oberflaeche entgegen, damit sie sich ohne Browser pruefen lassen. Gesprochen
// wird mit der Sprachausgabe des Geraets (speechSynthesis): keine Audiodateien,
// keine neuen Hosts. Aus, solange nicht ausdruecklich angeschaltet; die Wahl
// bleibt auf dem Geraet.

import { t, locale } from './i18n.js';

export const SCHLUESSEL = 'setlist.sprache';

/** Gibt es auf diesem Geraet eine Sprachausgabe? */
export const kann = (g = globalThis) => !!(g.speechSynthesis && g.SpeechSynthesisUtterance);

export function istAn() {
  try { return localStorage.getItem(SCHLUESSEL) === 'an'; } catch { return false; }
}
export function setzeAn(an) {
  try { if (an) localStorage.setItem(SCHLUESSEL, 'an'); else localStorage.removeItem(SCHLUESSEL); } catch { /* egal */ }
}

/**
 * Was zu einem Schritt des Kurs-Ablaufs gesagt wird. `naechster` ist der
 * naechste Baustein nach Pause oder Umbau (oder null). `h` liefert die
 * Texte der Oberflaeche: name(b), seite(a), umbau(a).
 * Leer, wo Sprechen nur Laerm waere: bei Takt-Runden ab der zweiten ohne
 * Seitenwechsel.
 */
export function sprechtext(a, naechster, h) {
  if (!a) return '';
  const name = naechster ? h.name(naechster.b) : '';
  const teile = [];
  switch (a.art) {
    case 'umbau':
      teile.push(`${t('ku.umbau')}.`, h.umbau(a));
      if (name) teile.push(`${t('up.danach', { name })}.`);
      break;
    case 'pause':
      if (a.grund === 'wechsel') teile.push(t('ku.wechselCue', { seite: h.seite(a) }));
      else {
        teile.push(`${t('ku.pauseJetzt')}.`);
        if (name) teile.push(`${t('ku.hilfe.naechste', { name })}.`);
      }
      break;
    case 'rad':
      teile.push(`${t(`ku.rad.${a.phase}`)}.`);
      break;
    case 'zeit':
      teile.push(`${h.name(a.b)}.`, t('ku.jetztGehen', { s: a.sekunden }));
      if (a.seite) teile.push(t(`ku.hand.${a.seite === 1 ? 'links' : 'rechts'}`));
      break;
    case 'takt':
      if (a.nr === 1) teile.push(`${h.name(a.b)}.`);
      if (a.seite) teile.push(`${h.seite(a)}.`);
      if (a.nr === 1) teile.push(t('ku.sp.wdh', { n: a.b.wdh }));
      break;
    default: // satz
      teile.push(`${h.name(a.b)}.`);
      if (a.seite) teile.push(`${h.seite(a)}.`);
      teile.push(t('ku.sp.wdh', { n: a.b.wdh }));
  }
  return teile.filter(Boolean).join(' ');
}

/** Sagt den Text; was noch laeuft, wird abgebrochen, damit nichts hinterherhinkt. */
export function sprich(text, g = globalThis) {
  if (!text || !kann(g)) return;
  try {
    g.speechSynthesis.cancel();
    const u = new g.SpeechSynthesisUtterance(text);
    u.lang = locale();
    g.speechSynthesis.speak(u);
  } catch { /* keine Sprachausgabe — Ton und Vibration bleiben */ }
}

export function schweige(g = globalThis) {
  if (!kann(g)) return;
  try { g.speechSynthesis.cancel(); } catch { /* egal */ }
}
