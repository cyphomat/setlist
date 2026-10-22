// Ausfuehren: jsc --module-file=tests/sicherung.test.js
import * as SI from '../js/sicherung.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const einheit = (date, extra = {}) => ({ date, type: 'strength', workout: 'A', finished: `${date}T18:00:00.000Z`, lifts: [], ...extra });

print('\n--- Erlaubte Pfade ---');
ok('Programm', SI.erlaubt('config.json'));
ok('Einheit', SI.erlaubt('einheiten/2026-10-01.json'));
ok('alter Ordnername', SI.erlaubt('log/2026-01-01.json'));
ok('Soundcheck', SI.erlaubt('soundcheck/2026-W40.json'));
ok('kein Zustand', !SI.erlaubt('state.json'));
ok('kein Unterordner', !SI.erlaubt('einheiten/x/y.json'));
ok('kein Weg nach oben', !SI.erlaubt('einheiten/../config.json'));
ok('nichts Fremdes', !SI.erlaubt('index.html') && !SI.erlaubt('soundcheck/notiz.json'));

print('\n--- Paket ---');
const p = SI.paket([
  { path: 'config.json', data: { bar: 20 } },
  { path: 'state.json', data: { next: 'A' } },
  { path: 'einheiten/2026-10-01.json', data: einheit('2026-10-01') },
  { path: 'einheiten/kaputt.json', data: null }
], new Date('2026-10-17T08:00:00Z'));
eq('Kennung', `${p.app}/${p.format}`, 'setlist/1');
eq('Zeitpunkt', p.erstellt, '2026-10-17T08:00:00.000Z');
eq('ohne Zustand und Kaputtes', Object.keys(p.dateien).join(','), 'config.json,einheiten/2026-10-01.json');

print('\n--- Pruefen ---');
eq('fremde Datei', SI.pruefe({ app: 'riffforge', format: 1, dateien: {} }).fehler, 'fremd');
eq('kein Objekt', SI.pruefe([1, 2]).fehler, 'fremd');
eq('aus einer neueren Fassung', SI.pruefe({ app: 'setlist', format: 99, dateien: {} }).fehler, 'neuer');
eq('ohne Dateien', SI.pruefe({ app: 'setlist', format: 1 }).fehler, 'leer');
const g = SI.pruefe({ app: 'setlist', format: 1, erstellt: 'x', dateien: {
  'config.json': { bar: 20 }, 'state.json': {}, 'einheiten/a.json': { date: 'gestern' },
  'einheiten/2026-10-01.json': einheit('2026-10-01'), 'soundcheck/2026-W40.json': { woche: '2026-W40' }, '../x.json': {} } });
ok('gueltig', g.ok);
eq('drei uebrig', g.dateien.map(f => f.path).join(','), 'config.json,einheiten/2026-10-01.json,soundcheck/2026-W40.json');
eq('drei verworfen', g.verworfen, 3);
eq('Rundreise', SI.pruefe(JSON.parse(JSON.stringify(p))).dateien.length, 2);

print('\n--- Zusammenfuehren ---');
const hier = [
  { path: 'config.json', data: { bar: 20 } },
  { path: 'einheiten/2026-10-01.json', data: einheit('2026-10-01') },
  { path: 'soundcheck/2026-W40.json', data: { woche: '2026-W40', lief: 'hier' } }
];
const rein = [
  { path: 'config.json', data: { bar: 15 } },
  { path: 'stimme.json', data: { zeilen: [] } },
  { path: 'einheiten/2026-10-01.json', data: einheit('2026-10-01') },                              // dieselbe
  { path: 'einheiten/2026-10-01-2.json', data: einheit('2026-10-01', { finished: '2026-10-01T20:00:00.000Z' }) },
  { path: 'einheiten/2026-10-02.json', data: einheit('2026-10-02') },
  { path: 'log/2026-10-01.json', data: einheit('2026-10-01', { workout: 'B', finished: '2026-10-01T07:00:00.000Z' }) },
  { path: 'soundcheck/2026-W40.json', data: { woche: '2026-W40', lief: 'dort' } },
  { path: 'soundcheck/2026-W41.json', data: { woche: '2026-W41' } },
  { path: 'state.json', data: {} }
];
const z = SI.zusammenfuehren(hier, rein);
eq('neue Einheiten', z.einheiten, 3);
eq('dieselbe Einheit kommt nicht doppelt', z.schreiben.filter(f => f.path === 'einheiten/2026-10-01.json').length, 0);
ok('Pfadkonflikt bekommt einen freien Namen', z.schreiben.some(f => f.path === 'einheiten/2026-10-01-import-2.json'), z.schreiben.map(f => f.path).join());
ok('alter Ordner landet unter einheiten/', !z.schreiben.some(f => f.path.startsWith('log/')));
eq('nur der neue Soundcheck', z.soundchecks, 1);
ok('lokaler Soundcheck bleibt', !z.schreiben.some(f => f.path === 'soundcheck/2026-W40.json'));
ok('Stimme fehlte hier: kommt dazu', z.schreiben.some(f => f.path === 'stimme.json'));
eq('anderes Programm: nur nach Rueckfrage', z.ersetzbar.map(f => f.path).join(), 'config.json');
ok('Zustand nie', !z.schreiben.some(f => f.path === 'state.json'));
eq('gleich gezaehlt', z.gleich, 2);
const zwei = SI.zusammenfuehren(hier.concat(z.schreiben), rein);
eq('zweites Einlesen bringt nichts Neues', zwei.einheiten + zwei.soundchecks + zwei.schreiben.length, 0);
eq('in die leere Ablage: alles', SI.zusammenfuehren([], rein).schreiben.length, 8);

print('\n--- Erinnerung ---');
const heute = new Date('2026-10-17T10:00:00Z');
ok('nie gesichert, aber trainiert', SI.sicherungFaellig({ lokal: true, neuesteEinheit: '2026-10-16', heute }));
ok('nicht im GitHub-Modus', !SI.sicherungFaellig({ lokal: false, neuesteEinheit: '2026-10-16', heute }));
ok('ohne Einheit nicht', !SI.sicherungFaellig({ lokal: true, heute }));
ok('vor drei Tagen gesichert: nein', !SI.sicherungFaellig({ lokal: true, letzte: '2026-10-14T08:00:00Z', neuesteEinheit: '2026-10-16', heute }));
ok('vor drei Wochen, seitdem trainiert: ja', SI.sicherungFaellig({ lokal: true, letzte: '2026-09-26T08:00:00Z', neuesteEinheit: '2026-10-16', heute }));
ok('vor drei Wochen, seitdem nichts: nein', !SI.sicherungFaellig({ lokal: true, letzte: '2026-09-26T08:00:00Z', neuesteEinheit: '2026-09-20', heute }));
eq('Dateiname', SI.dateiname(new Date(2026, 9, 7)), 'setlist-sicherung-2026-10-07.json');

print('\n--- Felder mit falschem Typ ---');
{
  const roh = (extra, name = 'einheiten/2026-10-01.json') => ({ app: 'setlist', format: 1,
    dateien: { [name]: einheit('2026-10-01', extra), 'einheiten/gut.json': einheit('2026-10-02') } });
  const mit = extra => SI.pruefe(roh(extra));
  eq('workout als Objekt: verworfen', mit({ workout: {} }).dateien.length, 1);
  eq('und gezaehlt', mit({ workout: {} }).verworfen, 1);
  eq('lifts als Text: verworfen', mit({ lifts: 'x' }).dateien.length, 1);
  eq('type als Zahl: verworfen', mit({ type: 7 }).dateien.length, 1);
  eq('Unsinn in lift: verworfen', mit({ lift: ['squat'] }).dateien.length, 1);
  eq('angesagt als Objekt: verworfen', mit({ angesagt: { a: 1 } }).dateien.length, 1);
  eq('workout als Text mit HTML bleibt (maskiert wird bei der Anzeige)', mit({ workout: '<b>A</b>' }).dateien.length, 2);
  eq('null zaehlt als nicht vorhanden', mit({ grund: null }).dateien.length, 2);
  eq('alte Einheit ohne die Felder bleibt', SI.pruefe(roh({ lifts: undefined })).dateien.length, 2);
  eq('Programm bleibt ohne diese Pruefung', SI.pruefe({ app: 'setlist', format: 1, dateien: { 'config.json': { workout: {} } } }).dateien.length, 1);
}

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
