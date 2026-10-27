// Der Ansager — eine grosse Einblendung nach der Einheit, wie in den alten
// Arena-Shootern. Hoechstens eine je Einheit, und nur fuer das, was wirklich
// zaehlt; sonst wird aus dem Ruf Laerm.
//
// Die Entscheidung ist eine reine Funktion (ansage), die Darstellung macht
// app.js. Abschaltbar im Backstage; die Wahl bleibt auf dem Geraet.

import { t } from './i18n.js';

export const SCHLUESSEL = 'setlist.ansager';

/** An, solange nicht ausdruecklich abgeschaltet. */
export function istAn() {
  try { return localStorage.getItem(SCHLUESSEL) !== 'aus'; } catch { return true; }
}
export function setzeAn(an) {
  try { if (an) localStorage.removeItem(SCHLUESSEL); else localStorage.setItem(SCHLUESSEL, 'aus'); } catch { /* egal */ }
}

/**
 * Was angesagt wird — oder null. Vorrang von oben nach unten:
 *   rang        neuer Rang (Name)                        gold
 *   tour        Endgegner des Monats besiegt (Name)      gold
 *   kursBoss    Endgegner des Kurses besiegt (Name)      gold
 *   gitarre     neue Gitarre im Rack (Name)              gold
 *   aufnaeher   neue Aufnaeher (Namen, erster genannt)   gold
 *   referenz    zurueck auf dem Stand vor der Pause      gold
 *   rund        runde Marke geknackt (kg, Liftname)      rot
 *   elf         Wochenregler auf elf                     gold
 *   sauber      alle Saetze der Einheit sauber           rot
 * Die Namen kommen fertig uebersetzt herein.
 */
export function ansage({ rang = null, tour = null, kursBoss = null, gitarre = null, aufnaeher = [], referenz = null, rund = null, elf = false, sauber = false } = {}) {
  if (rang) return { ruf: t('ans.rang'), unter: rang, art: 'gold' };
  if (tour) return { ruf: t('ans.tour'), unter: t('ans.tourUnter', { boss: tour }), art: 'gold' };
  if (kursBoss) return { ruf: t('ans.kursBoss'), unter: t('ans.tourUnter', { boss: kursBoss }), art: 'gold' };
  if (gitarre) return { ruf: t('ans.gitarre'), unter: gitarre, art: 'gold' };
  if (aufnaeher.length) {
    return { ruf: t('ans.aufnaeher'),
      unter: aufnaeher.length > 1 ? t('ans.aufnaeherMehr', { name: aufnaeher[0], n: aufnaeher.length - 1 }) : aufnaeher[0],
      art: 'gold' };
  }
  if (referenz) return { ruf: t('ans.referenz'), unter: t('ans.referenzUnter', referenz), art: 'gold' };
  if (rund) return { ruf: `${rund.kg} KG`, unter: rund.name, art: 'rot' };
  if (elf) return { ruf: 'GOES TO ELEVEN', unter: t('ans.elf'), art: 'gold' };
  if (sauber) return { ruf: 'FLAWLESS', unter: t('ans.sauber'), art: 'rot' };
  return null;
}
