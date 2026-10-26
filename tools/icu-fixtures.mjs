// Echte intervals.icu-Antworten als Testdaten ziehen.
//
//   ICU_KEY=... deno run -A tools/icu-fixtures.mjs [--tage 84] [--fahrten 5]
//   ICU_KEY=... node tools/icu-fixtures.mjs
//
// Der Schluessel kommt nur ueber die Umgebung (nie als Argument: der landet
// im Shell-Verlauf) und wird weder gedruckt noch geschrieben. Das Repo ist
// oeffentlich, deshalb gilt:
//   - Positivliste: nur Felder, die js/intervals.js liest. Alles andere
//     (Namen, Notizen, GPS, Geraete, Wetter ...) wird gar nicht erst kopiert.
//   - Kennungen und Namen werden ersetzt.
//   - Werte werden verfremdet. Die FORM bleibt echt (Feldnamen, Skalen,
//     Einheiten), das ist es, was die Tests pruefen.
//     Fahrten: wenige Prozent. Watt, Puls und FTP einer Fahrt skalieren
//     gemeinsam, damit Effizienz und Intensitaet stimmig bleiben; Zeit und
//     Strecke ebenso.
//     Koerperwerte (Gewicht, Ruhepuls, Schlaf, HRV): bis zu 10 %, ein
//     fester Faktor fuer die ganze Datei, damit der Verlauf stimmt.
// Ausgabe: tests/fixtures/icu-fahrten.js und icu-wellness.js, dazu ein
// Feldbericht im Terminal (Wertebereiche, damit die "ungeprueft"-Felder
// in intervals.js endlich Belege bekommen).

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://intervals.icu/api/v1';
const RIDE_TYPES = ['Ride', 'VirtualRide', 'GravelRide', 'MountainBikeRide', 'EBikeRide'];

/** Felder einer Aktivitaet, die alsFahrt() liest. */
export const FAHRT_FELDER = [
  'id', 'external_id', 'type', 'start_date_local', 'name',
  'moving_time', 'distance', 'total_elevation_gain', 'icu_training_load',
  'icu_intensity', 'icu_weighted_avg_watts', 'icu_average_watts',
  'average_heartrate', 'max_heartrate', 'icu_efficiency_factor', 'decoupling',
  'icu_power_hr_z2', 'icu_power_hr_z2_mins', 'icu_ftp', 'average_cadence',
  'calories', 'icu_rpe', 'feel', 'icu_achievements', 'trainer', 'icu_zone_times'
];

/** Felder eines Wellness-Tages, die alsWellness() liest. */
// `sportInfo` (Liste je Sportart mit `eftp`) und `hrvSDNN` stehen drin, weil
// die echte Antwort die eFTP und die Apple-Health-HRV dort ablegt — nicht in
// `eftp` und `hrv`. Aus `sportInfo` bleiben nur `type` und `eftp` (pMax,
// wPrime liest niemand).
export const WELLNESS_FELDER = [
  'id', 'weight', 'eftp', 'sportInfo', 'ctl', 'atl', 'restingHR', 'hrv', 'hrvSDNN',
  'sleepSecs', 'soreness', 'fatigue', 'stress', 'mood', 'motivation',
  'sleepQuality', 'sleepScore', 'rampRate'
];

/** Kleiner, wiederholbarer Zufall: gleicher Lauf, gleiche Verfremdung. */
export function zufall(seed = 20261023) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const zwischen = (r, von, bis) => von + (bis - von) * r();
const istZahl = v => typeof v === 'number' && Number.isFinite(v);
/** Zahl mit Faktor skalieren; ganze Zahlen bleiben ganz, Kommazahlen auf 2 Stellen. */
const skaliere = (v, f) => !istZahl(v) ? v : (Number.isInteger(v) ? Math.round(v * f) : Math.round(v * f * 100) / 100);

/**
 * Eine Aktivitaet auf die Positivliste reduzieren und verfremden.
 * `ids` ist ein Gedaechtnis (Map), damit dieselbe echte Kennung immer
 * dieselbe falsche bekommt und Doppelte als Doppelte erkennbar bleiben.
 */
export function reduziereFahrt(a, nr, r, ids) {
  const f = zwischen(r, 0.95, 1.05);  // Leistung, Puls, FTP, Energie
  const g = zwischen(r, 0.93, 1.07);  // Zeit, Strecke, Hoehe, Last
  const neueId = (alt, vorsilbe) => {
    if (alt == null) return null;
    const k = vorsilbe + alt;
    if (!ids.has(k)) ids.set(k, `${vorsilbe}${100000 + ids.size + 1}`);
    return ids.get(k);
  };
  const out = {
    id: neueId(a.id, 'i'),
    external_id: a.external_id ? neueId(a.external_id, 'x') : null,
    type: a.type,
    start_date_local: a.start_date_local,
    name: `Fahrt ${nr}`,
    moving_time: skaliere(a.moving_time, g),
    distance: skaliere(a.distance, g),
    total_elevation_gain: skaliere(a.total_elevation_gain, g),
    icu_training_load: skaliere(a.icu_training_load, g),
    // Verhaeltnisse und Skalen: unveraendert, das ist der Pruefgegenstand.
    icu_intensity: a.icu_intensity,
    icu_efficiency_factor: a.icu_efficiency_factor,
    decoupling: a.decoupling,
    icu_power_hr_z2: a.icu_power_hr_z2,
    icu_power_hr_z2_mins: a.icu_power_hr_z2_mins,
    icu_rpe: a.icu_rpe,
    feel: a.feel,
    trainer: a.trainer,
    // Gemeinsamer Faktor f: NP/HF und NP/FTP bleiben stimmig.
    icu_weighted_avg_watts: skaliere(a.icu_weighted_avg_watts, f),
    icu_average_watts: skaliere(a.icu_average_watts, f),
    average_heartrate: skaliere(a.average_heartrate, f),
    max_heartrate: skaliere(a.max_heartrate, f),
    icu_ftp: skaliere(a.icu_ftp, f),
    average_cadence: a.average_cadence,
    calories: skaliere(a.calories, f * g),
    icu_zone_times: Array.isArray(a.icu_zone_times)
      ? a.icu_zone_times.map(z => ({ id: z.id, secs: skaliere(z.secs, g) }))
      : a.icu_zone_times,
    // Bestwerte: nur Art, Dauer und Wert. Der Freitext (`message`) bleibt
    // draussen, er enthaelt Zahlen und koennte mehr enthalten.
    icu_achievements: Array.isArray(a.icu_achievements)
      ? a.icu_achievements.filter(x => x && typeof x === 'object').map(x => ({
          type: x.type, secs: x.secs,
          ...(x.watts != null ? { watts: skaliere(x.watts, f) } : {}),
          ...(x.value != null ? { value: skaliere(x.value, f) } : {})
        }))
      : a.icu_achievements
  };
  // Fehlende Felder bleiben fehlend (nicht null): auch das ist echte Form.
  for (const k of Object.keys(out)) if (!(k in a) && k !== 'name') delete out[k];
  return out;
}

/** Ein Wellness-Tag: gleiche Faktoren fuer die ganze Datei, damit der Verlauf stimmt. */
export function reduziereWellness(w, fak) {
  const out = { id: w.id };
  const mal = { weight: fak.gewicht, eftp: fak.leistung, restingHR: fak.puls, hrv: fak.hrv, hrvSDNN: fak.hrv, sleepSecs: fak.schlaf };
  for (const k of WELLNESS_FELDER) {
    if (k === 'id' || !(k in w)) continue;
    if (k === 'sportInfo') {
      out.sportInfo = Array.isArray(w.sportInfo)
        ? w.sportInfo.filter(s => s && typeof s === 'object').map(s => ({
            type: s.type,
            ...(s.eftp != null ? { eftp: skaliere(s.eftp, fak.leistung) } : {})
          }))
        : w.sportInfo;
      continue;
    }
    out[k] = k in mal ? skaliere(w[k], mal[k]) : w[k];
  }
  return out;
}

/** Bis zu n Fahrten waehlen: die mit den meisten belegten Feldern, dann nach Datum. */
export function waehleFahrten(liste, n) {
  const belegt = a => FAHRT_FELDER.filter(k => a[k] != null).length;
  return liste
    .filter(a => RIDE_TYPES.includes(a.type))
    .sort((x, y) => belegt(y) - belegt(x))
    .slice(0, n)
    .sort((x, y) => (x.start_date_local || '').localeCompare(y.start_date_local || ''));
}

/** Wertebereich je Feld, ohne Namen oder Kennungen. */
export function feldbericht(zeilen, felder) {
  const out = [];
  for (const k of felder) {
    const werte = zeilen.map(z => z[k]).filter(v => v != null);
    const zahlen = werte.filter(istZahl);
    let info = `${werte.length}/${zeilen.length} belegt`;
    if (zahlen.length) info += `, Bereich ${Math.min(...zahlen)} .. ${Math.max(...zahlen)}`;
    else if (werte.length) info += `, Typ ${Array.isArray(werte[0]) ? 'Liste' : typeof werte[0]}`;
    out.push(`  ${k.padEnd(24)} ${info}`);
  }
  return out.join('\n');
}

/** Schluessel der Eintraege in icu_achievements: ihre Form ist in intervals.js "nicht belegt". */
export function achievementSchluessel(fahrten) {
  const s = new Set();
  for (const a of fahrten) if (Array.isArray(a.icu_achievements)) {
    for (const x of a.icu_achievements) if (x && typeof x === 'object') Object.keys(x).forEach(k => s.add(k));
  }
  return [...s].sort();
}

const modul = fahrten => `// Echte Antwortform von intervals.icu, Werte verfremdet (siehe tools/icu-fixtures.mjs).\n// Nicht von Hand aendern: neu erzeugen.\nexport default ${JSON.stringify(fahrten, null, 2)};\n`;

export async function main() {
  const key = process.env.ICU_KEY;
  if (!key) {
    console.error('ICU_KEY fehlt. Beispiel:\n  ICU_KEY=... deno run -A tools/icu-fixtures.mjs');
    process.exit(2);
  }
  const arg = (name, std) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > -1 ? +process.argv[i + 1] : std;
  };
  const tage = arg('tage', 84), anzahl = arg('fahrten', 5);
  const kopf = { Authorization: 'Basic ' + btoa('API_KEY:' + key) };
  const hol = async pfad => {
    const res = await fetch(BASE + pfad, { headers: kopf });
    if (res.status === 401 || res.status === 403) throw new Error('intervals.icu lehnt den Schluessel ab (401/403).');
    if (!res.ok) throw new Error(`intervals.icu ${res.status} bei ${pfad.split('?')[0].replace(/\/athlete\/[^/]+/, '/athlete/…')}`);
    return res.json();
  };

  const tag = d => d.toISOString().slice(0, 10);
  const bis = new Date(), von = new Date(Date.now() - tage * 864e5);
  const ich = await hol('/athlete/0');
  const id = ich && ich.id;
  if (!id) throw new Error('Athleten-ID nicht gefunden.');

  const aktivitaeten = await hol(`/athlete/${id}/activities?oldest=${tag(von)}&newest=${tag(bis)}`);
  const wellnessTage = await hol(`/athlete/${id}/wellness?oldest=${tag(von)}&newest=${tag(bis)}`);
  if (!Array.isArray(aktivitaeten) || !Array.isArray(wellnessTage)) throw new Error('Unerwartete Antwortform (keine Liste).');

  const r = zufall();
  const ids = new Map();
  const gewaehlt = waehleFahrten(aktivitaeten, anzahl);
  if (!gewaehlt.length) throw new Error(`Keine Radfahrten in den letzten ${tage} Tagen.`);
  const fahrten = gewaehlt.map((a, i) => reduziereFahrt(a, i + 1, r, ids));

  // Koerperwerte staerker als Fahrtwerte: sie gehoeren zu einer Person, die
  // ein oeffentliches Repo lesen kann. Ein Faktor je Feld fuer die ganze Datei.
  const fak = {
    gewicht: zwischen(r, 0.90, 1.10), leistung: zwischen(r, 0.95, 1.05),
    puls: zwischen(r, 0.93, 1.07), hrv: zwischen(r, 0.90, 1.10), schlaf: zwischen(r, 0.90, 1.10)
  };
  const wellness = wellnessTage
    .filter(w => w && w.id)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map(w => reduziereWellness(w, fak));

  const ordner = process.env.ICU_FIXTURES_DIR
    || join(dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'fixtures');
  mkdirSync(ordner, { recursive: true });
  writeFileSync(join(ordner, 'icu-fahrten.js'), modul(fahrten));
  writeFileSync(join(ordner, 'icu-wellness.js'), modul(wellness));

  // Feldbericht ueber ALLE geholten Radfahrten, nicht nur die gewaehlten.
  const alle = aktivitaeten.filter(a => RIDE_TYPES.includes(a.type));
  console.log(`\n${alle.length} Radfahrten und ${wellness.length} Wellness-Tage der letzten ${tage} Tage gelesen.`);
  console.log(`Geschrieben: ${fahrten.length} Fahrten, ${wellness.length} Wellness-Tage -> tests/fixtures/\n`);
  console.log('Felder der Radfahrten (echte Werte, alle geholten Fahrten):');
  console.log(feldbericht(alle, FAHRT_FELDER.filter(k => !['id', 'external_id', 'name', 'start_date_local'].includes(k))));
  console.log(`\nSchluessel in icu_achievements: ${achievementSchluessel(alle).join(', ') || '(keine)'}`);
  console.log('\nFelder der Wellness-Tage (echte Werte):');
  console.log(feldbericht(wellnessTage, WELLNESS_FELDER.filter(k => k !== 'id')));
  console.log('\nBitte die Dateien in tests/fixtures/ kurz ansehen, bevor sie committet werden.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(e => { console.error('Fehler:', e.message); process.exit(1); });
}
