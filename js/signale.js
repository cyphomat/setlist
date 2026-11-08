// Signale im Kurs — fuer den Keller, wo das Handy an der Anlage haengt und der
// Bildschirm nicht im Blick ist: jeder Schritt hat seinen eigenen Ton und sein
// eigenes Vibrationsmuster, sodass man ihn hoert statt liest. Keine Sprache:
// die Sprachausgabe von iOS haelt laufende Musik an, Web Audio mischt sich.
//
// Reine Funktionen, ohne Browser pruefbar. `signal(a)` nimmt einen Schritt des
// Kurs-Ablaufs (js/kurs.js) und liefert { ton: [Hz…], vib: [ms…] }.

/** Die Legende: Reihenfolge wie in der Oberflaeche (Schluessel in i18n: ku.sig.*). */
export const ARTEN = ['satz', 'takt', 'zeit', 'pause', 'links', 'rechts', 'umbau', 'locker', 'antritt', 'ende'];

const TABELLE = {
  satz: { ton: [880], vib: [120] },
  takt: { ton: [880, 880], vib: [80, 60, 80] },
  taktKurz: { ton: [880], vib: [60] },
  zeit: { ton: [660, 880], vib: [200] },
  pause: { ton: [440], vib: [300] },
  links: { ton: [520, 740], vib: [100, 80, 100] },
  rechts: { ton: [740, 520], vib: [100, 80, 100, 80, 100] },
  umbau: { ton: [440, 330, 440], vib: [400, 100, 400] },
  locker: { ton: [330], vib: [500] },
  antritt: { ton: [988, 988, 988], vib: [60, 40, 60, 40, 60] },
  ende: { ton: [660, 880, 1175], vib: [180, 90, 180, 90, 400] },
};

/** Welches Signal gehoert zu diesem Schritt? Schluessel in TABELLE oder null. */
export function art(a) {
  if (!a) return null;
  switch (a.art) {
    case 'satz': return 'satz';
    case 'takt': return a.nr === 1 || a.seite ? 'takt' : 'taktKurz';
    case 'zeit': return 'zeit';
    case 'umbau': return 'umbau';
    case 'rad': return a.phase === 'antritt' ? 'antritt' : 'locker';
    case 'pause': return a.grund === 'wechsel' ? (a.seite === 1 ? 'links' : 'rechts') : 'pause';
    case 'ende': return 'ende';
    default: return null;
  }
}

export function signal(a) {
  const k = art(a);
  return k ? { art: k, ...TABELLE[k] } : null;
}

/**
 * Sagt dem Geraet, dass der Ton neben anderer Wiedergabe laufen darf (Musik,
 * Hoerbuch), statt sie anzuhalten. Erst nach dem Anlegen des AudioContext
 * aufrufen. Nicht jeder Browser kennt das; dann bleibt alles, wie es war.
 */
export function mischen(g = globalThis) {
  try {
    const s = g.navigator && g.navigator.audioSession;
    if (!s) return false;
    s.type = 'ambient';
    return true;
  } catch { return false; }
}
