// Ausfuehren: jsc --module-file=tests/aktualisierung.test.js
import * as A from '../js/aktualisierung.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

print('\n--- Versionen vergleichen ---');
eq('gleich', A.vergleiche('2026-09-01.75', '2026-09-01.75'), 0);
eq('spaeteres Datum ist neuer', A.vergleiche('2026-09-01.1', '2026-09-02.1'), -1);
eq('frueheres Datum ist aelter', A.vergleiche('2026-09-02.1', '2026-09-01.9'), 1);
eq('gleiche Datum, hoehere Nummer', A.vergleiche('2026-09-01.4', '2026-09-01.5'), -1);

// Der Grund fuer die Zerlegung: als Zeichenkette waere '.100' kleiner als
// '.75', weil '1' vor '7' kommt. Genau dann faende ein Fork sein Update nicht.
eq('dreistellige Nummer schlaegt zweistellige', A.vergleiche('2026-09-01.75', '2026-09-01.100'), -1);
eq('und andersherum', A.vergleiche('2026-09-01.100', '2026-09-01.75'), 1);
eq('fehlende Nummer zaehlt als null', A.vergleiche('2026-09-01', '2026-09-01.1'), -1);
eq('Jahreswechsel', A.vergleiche('2026-12-31.9', '2027-01-01.1'), -1);

print('\n--- Unbrauchbare Angaben behaupten nichts ---');
eq('leer', A.vergleiche('', '2026-09-01.1'), 0);
eq('null', A.vergleiche(null, '2026-09-01.1'), 0);
eq('Unsinn', A.vergleiche('demo', '2026-09-01.1'), 0);
eq('Gedankenstrich als Platzhalter', A.vergleiche('—', '2026-09-01.1'), 0);
eq('unvollstaendiges Datum', A.vergleiche('2026-9-1.1', '2026-09-01.1'), 0);
eq('beide unbrauchbar', A.vergleiche('a', 'b'), 0);
ok('unbekannt gilt nie als veraltet', !A.istVeraltet('demo', '2026-09-01.99'));

print('\n--- istVeraltet ---');
ok('aelter ist veraltet', A.istVeraltet('2026-09-01.1', '2026-09-05.2'));
ok('gleich ist nicht veraltet', !A.istVeraltet('2026-09-05.2', '2026-09-05.2'));
ok('neuer ist nicht veraltet', !A.istVeraltet('2026-09-06.1', '2026-09-05.2'));

print('\n--- Fork erkennen ---');
ok('fremde GitHub-Pages sind ein Fork', A.istFork('jens.github.io'));
ok('das Original selbst nicht', !A.istFork('cyphomat.github.io'));
ok('Grossschreibung aendert nichts', !A.istFork('CyphoMat.github.io'));
// Beim Entwickeln gibt es kein Original zum Vergleichen — der Hinweis waere
// dort nur Rauschen.
ok('localhost ist kein Fork', !A.istFork('localhost'));
ok('leerer Host ist kein Fork', !A.istFork(''));
ok('eigene Domain zaehlt nicht als Fork', !A.istFork('setlist.example.com'));
ok('anderer Ursprung ist einstellbar', A.istFork('cyphomat.github.io', 'jemand'));

print('\n--- Ursprung ---');
eq('Besitzer', A.URSPRUNG.owner, 'cyphomat');
eq('Repo', A.URSPRUNG.repo, 'setlist');

print('\n--- Autor, Issues, Quelltext ---');
eq('Autor nur als Handle', A.AUTOR.name, '@cyphomat');
eq('Autor verlinkt aufs Profil', A.AUTOR.url, 'https://github.com/cyphomat');
eq('Issues im Original', A.ISSUES, 'https://github.com/cyphomat/setlist/issues');
eq('Original: Quelltext im Original', A.quelltext('cyphomat.github.io', '/setlist/'), 'https://github.com/cyphomat/setlist');
eq('Fork: Quelltext im Fork', A.quelltext('jens.github.io', '/setlist/index.html'), 'https://github.com/jens/setlist');
eq('Fork mit umbenanntem Repo', A.quelltext('jens.github.io', '/training/'), 'https://github.com/jens/training');
eq('Fork auf der Wurzel: Nutzerseite', A.quelltext('jens.github.io', '/'), 'https://github.com/jens/jens.github.io');
eq('Fork auf der Wurzel mit Datei', A.quelltext('jens.github.io', '/index.html'), 'https://github.com/jens/jens.github.io');
eq('Grossschreibung im Host', A.quelltext('Jens.GitHub.io', '/setlist/'), 'https://github.com/jens/setlist');
eq('localhost: Original', A.quelltext('localhost', '/setlist/'), 'https://github.com/cyphomat/setlist');
eq('eigene Domain: Original', A.quelltext('setlist.example.com', '/'), 'https://github.com/cyphomat/setlist');
eq('seltsamer Pfad: Original', A.quelltext('jens.github.io', '/a"b/'), 'https://github.com/cyphomat/setlist');
eq('ohne Pfad', A.quelltext('jens.github.io'), 'https://github.com/jens/jens.github.io');
eq('Lizenz neben dem Quelltext', A.lizenz('jens.github.io', '/setlist/'), 'https://github.com/jens/setlist/blob/main/LICENSE');
eq('Lizenz im Original', A.lizenz('localhost', '/'), 'https://github.com/cyphomat/setlist/blob/main/LICENSE');

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
