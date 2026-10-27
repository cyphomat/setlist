// Bildschirm wach halten, solange trainiert wird.
//
// In der Satzpause ging das Display aus, und zum Abhaken des naechsten
// Satzes musste man erst entsperren — mit Kreide an den Fingern. Die Screen
// Wake Lock API haelt den Bildschirm an, solange die Seite sichtbar ist.
//
// Zwei Eigenheiten der API bestimmen den Aufbau:
//   - Der Browser gibt die Sperre selbst frei, sobald die Seite verdeckt
//     wird (App-Wechsel, Sperrtaste). Zurueck im Vordergrund muss sie neu
//     angefordert werden — sonst haelt sie nur bis zum ersten Blick aufs
//     Handy-Menue.
//   - Die Anforderung kann scheitern (Akku-Sparmodus, alter Browser). Das ist
//     kein Fehler der Einheit; dann geht das Display eben wie bisher aus.

/** In diesen Ansichten laeuft eine Uhr oder ein Satz wartet aufs Abhaken. */
export const WACH_ANSICHTEN = ['session', 'wod', 'unplugged', 'kurs', 'moshpit', 'maxout'];

/**
 * Ein Halter fuer die Sperre. `nav` und `doc` sind austauschbar, damit sich
 * das ohne Browser pruefen laesst.
 *   setze(true)  — Bildschirm soll wach bleiben
 *   setze(false) — darf wieder ausgehen
 */
export function wachHalter(nav = globalThis.navigator, doc = globalThis.document) {
  let gewollt = false, sperre = null, unterwegs = false;
  const kann = !!(nav && nav.wakeLock && typeof nav.wakeLock.request === 'function');

  async function anfordern() {
    if (!kann || !gewollt || sperre || unterwegs) return;
    if (doc && doc.visibilityState && doc.visibilityState !== 'visible') return;
    unterwegs = true;
    try {
      const s = await nav.wakeLock.request('screen');
      // Waehrend des Wartens kann die Einheit schon vorbei sein.
      if (!gewollt) { s.release().catch(() => {}); return; }
      sperre = s;
      if (typeof s.addEventListener === 'function') s.addEventListener('release', () => { if (sperre === s) sperre = null; });
    } catch { /* abgelehnt — das Display geht dann wie bisher aus */ }
    finally { unterwegs = false; }
  }

  function freigeben() {
    const s = sperre;
    sperre = null;
    if (s) s.release().catch(() => {});
  }

  if (kann && doc && typeof doc.addEventListener === 'function') {
    doc.addEventListener('visibilitychange', () => {
      if (doc.visibilityState === 'visible') anfordern();
    });
  }

  return {
    kann,
    setze(an) {
      gewollt = !!an;
      return gewollt ? anfordern() : (freigeben(), Promise.resolve());
    },
    get aktiv() { return !!sperre; }
  };
}

/** Passend zur Ansicht: wach in den Trainingsansichten, sonst frei. */
export const wachFuerAnsicht = name => WACH_ANSICHTEN.includes(name);
