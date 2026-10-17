// Sichern und Einlesen — eine JSON-Datei mit allen Dateien der Ablage.
//
// Damit zieht der Stand auf ein anderes Geraet um, und wer lokal trainiert,
// hat eine Kopie ausserhalb des Browsers. Das Format ist schlicht: Pfad ->
// Inhalt, dieselben Pfade wie im Datenrepo. state.json kommt nicht mit —
// der Zustand wird aus den Einheiten abgeleitet, nicht uebertragen.
//
// Einlesen legt dazu statt zu ersetzen (wie bei Riffforge): Einheiten sind
// unveraenderlich, also ist die Vereinigung beider Seiten richtig. Zwei
// Geraete, die getrennt trainiert haben, haben beide recht.
//
// Reine Funktionen, kein I/O.

export const FORMAT = 1;
const LOG = /^(einheiten|log)\/[^/]+\.json$/;
const SOUNDCHECK = /^soundcheck\/\d{4}-W\d{2}\.json$/;
const EINZELN = ['config.json', 'stimme.json', 'bibliothek.json'];

export const istLog = p => LOG.test(p);
/** Nur diese Pfade kommen in eine Sicherung und aus ihr heraus. */
export const erlaubt = p => typeof p === 'string' && !p.includes('..') &&
  (EINZELN.includes(p) || LOG.test(p) || SOUNDCHECK.test(p));

const objekt = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const DATUM = /^\d{4}-\d{2}-\d{2}$/;

/** Die Sicherung aus [{ path, data }]. */
export function paket(dateien = [], jetzt = new Date()) {
  const out = {};
  for (const f of dateien) if (f && erlaubt(f.path) && objekt(f.data)) out[f.path] = f.data;
  return { app: 'setlist', format: FORMAT, erstellt: jetzt.toISOString(), dateien: out };
}

/**
 * Eine eingelesene Datei pruefen. Gibt { ok, fehler, dateien } zurueck;
 * fehler ist ein Schluessel fuer die Uebersetzung. Unbekannte Pfade und
 * kaputte Einheiten fallen still heraus und werden gezaehlt.
 */
export function pruefe(json) {
  if (!objekt(json) || json.app !== 'setlist') return { ok: false, fehler: 'fremd', dateien: [] };
  if (typeof json.format !== 'number' || json.format > FORMAT) return { ok: false, fehler: 'neuer', dateien: [] };
  if (!objekt(json.dateien)) return { ok: false, fehler: 'leer', dateien: [] };
  const dateien = [];
  let verworfen = 0;
  for (const [path, data] of Object.entries(json.dateien)) {
    const gut = erlaubt(path) && objekt(data) && (!istLog(path) || DATUM.test(String(data.date || '')));
    if (gut) dateien.push({ path, data }); else verworfen++;
  }
  dateien.sort((a, b) => a.path.localeCompare(b.path));
  return { ok: true, fehler: null, dateien, verworfen, erstellt: typeof json.erstellt === 'string' ? json.erstellt : null };
}

/** Dieselbe Einheit erkennt man an Tag, Art und Zeitpunkt — nicht am Dateinamen. */
export const kennung = l => [l.date, l.type || 'strength', l.finished || l.started || '', l.workout || '',
  l.grund || '', l.lift || l.check || '', l.uebung || ''].join('|');

/**
 * Was aus einer Sicherung neu dazukommt. `lokal` und `rein` sind
 * [{ path, data }]. Ergebnis:
 *   schreiben  — was ohne Rueckfrage geschrieben wird (neue Einheiten,
 *                neue Soundchecks, Programm/Notizen, wo lokal keine sind)
 *   ersetzbar  — Programm/Notizen, die hier schon anders existieren
 *   einheiten, soundchecks, gleich — Zahlen fuer die Vorschau
 */
export function zusammenfuehren(lokal = [], rein = []) {
  const pfade = new Set(lokal.map(f => f.path));
  const hier = new Map(lokal.map(f => [f.path, f.data]));
  const bekannt = new Set(lokal.filter(f => istLog(f.path)).map(f => kennung(f.data)));
  const schreiben = [], ersetzbar = [];
  let einheiten = 0, soundchecks = 0, gleich = 0;
  for (const f of rein) {
    if (!erlaubt(f.path)) continue;
    if (istLog(f.path)) {
      const k = kennung(f.data);
      if (bekannt.has(k)) { gleich++; continue; }
      bekannt.add(k);
      const basis = f.path.replace(/^log\//, 'einheiten/').replace(/\.json$/, '');
      let path = `${basis}.json`, n = 2;
      while (pfade.has(path)) path = `${basis}-import-${n++}.json`;
      pfade.add(path);
      schreiben.push({ path, data: f.data });
      einheiten++;
    } else if (SOUNDCHECK.test(f.path)) {
      if (pfade.has(f.path)) { gleich++; continue; }
      pfade.add(f.path);
      schreiben.push(f);
      soundchecks++;
    } else if (!pfade.has(f.path)) {
      pfade.add(f.path);
      schreiben.push(f);
    } else if (JSON.stringify(hier.get(f.path)) !== JSON.stringify(f.data)) {
      ersetzbar.push(f);
    }
  }
  return { schreiben, ersetzbar, einheiten, soundchecks, gleich };
}

/** Dateiname der Sicherung. */
export const dateiname = (d = new Date()) =>
  `setlist-sicherung-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;

/** Ist eine Sicherung faellig? Lokal, mindestens eine Einheit seit der letzten, und die liegt 14 Tage zurueck (oder gab es nie). */
export const ERINNERUNG_TAGE = 14;
export function sicherungFaellig({ lokal, letzte = null, neuesteEinheit = null, heute = new Date() }) {
  if (!lokal || !neuesteEinheit) return false;
  if (!letzte) return true;
  const alt = (heute - new Date(letzte)) / 86400000;
  return alt >= ERINNERUNG_TAGE && neuesteEinheit > String(letzte).slice(0, 10);
}
