// Ausfuehren: jsc --module-file=tests/gitarren.test.js
import * as G from '../js/gitarren.js';
import * as M from '../js/merch.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);
const gleich = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b),
  `(${JSON.stringify(a)} != ${JSON.stringify(b)})`);

// Eine Einheit mit n Tonnen (ein Lift, ein Satz): weight x reps
const einheit = (date, tonnen = 1) => ({ date, type: 'strength', workout: 'A',
  lifts: [{ lift: 'squat', weight: tonnen * 1000, sets: 1, target: 1, reps: [1], success: true }] });
// Montage hintereinander: je eine Woche
const montage = n => Array.from({ length: n }, (_, i) => {
  const d = new Date(2026, 0, 5 + i * 7, 12);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});
const wochenLogs = n => montage(n).map(d => einheit(d, 1));
const hat = (liste, id) => (liste.find(g => g.id === id) || {}).verdient || null;

print('\n--- Die Liste ---');
eq('zehn Gitarren', G.GITARREN.length, 10);
eq('keine Kennung doppelt', new Set(G.GITARREN.map(g => g.id)).size, 10);
ok('sieben an Raengen, drei an Platten',
  G.GITARREN.filter(g => g.quelle === 'rang').length === 7 && G.GITARREN.filter(g => g.quelle === 'platte').length === 3);
ok('jede Rang-Gitarre hat einen Rang, den es gibt', G.GITARREN.filter(g => g.quelle === 'rang').every(g => M.RAENGE.some(r => r.id === g.key)));
ok('jede Platten-Gitarre hat eine Platte, die es gibt', G.GITARREN.filter(g => g.quelle === 'platte').every(g => M.PLATTEN.some(p => p.id === g.key)));
ok('jeder Rang hat genau eine Gitarre', M.RAENGE.every(r => G.GITARREN.filter(g => g.quelle === 'rang' && g.key === r.id).length === 1));
ok('keine Platte hat zwei Gitarren', M.PLATTEN.every(p => G.GITARREN.filter(g => g.quelle === 'platte' && g.key === p.id).length <= 1));
eq('Gold bleibt ohne Gitarre', G.GITARREN.filter(g => g.key === 'gold').length, 0);
eq('Bildplatz ist die Listenstelle', G.bildIndex('falke'), 3);
eq('unbekannte Kennung: kein Bild', G.bildIndex('gibtsnicht'), -1);

print('\n--- Freischaltung ueber Raenge ---');
eq('ohne Einheit keine Gitarre', G.gitarren([]).filter(g => g.verdient).length, 0);
eq('ohne Einheit leeres Rack', G.rack([]).n, 0);
const eins = G.gitarren(wochenLogs(1));
eq('die erste Einheit: das Brett', hat(eins, 'brett'), '2026-01-05');
eq('aber noch kein Kellerkind', hat(eins, 'keller'), null);
eq('vier Wochen: Kellerkind am vierten Tag', hat(G.gitarren(wochenLogs(4)), 'keller'), '2026-01-26');
eq('drei Wochen: noch nicht', hat(G.gitarren(wochenLogs(3)), 'keller'), null);
eq('zwoelf Wochen: Offset am zwoelften Tag', hat(G.gitarren(wochenLogs(12)), 'offset'), montage(12)[11]);
eq('26 Wochen: Nachtfalke', hat(G.gitarren(wochenLogs(26)), 'falke'), montage(26)[25]);
eq('zwei Einheiten in einer Woche zaehlen einmal',
  hat(G.gitarren([einheit('2026-01-05'), einheit('2026-01-06'), einheit('2026-01-07'), einheit('2026-01-08')]), 'keller'), null);
eq('Fahrten zaehlen fuer den Rang, wie beim Rang selbst',
  hat(G.gitarren([], [{ date: '2026-01-05' }]), 'brett'), '2026-01-05');

print('\n--- Freischaltung ueber Platten ---');
const ohneT = G.gitarren([einheit('2026-01-05', 99)]);
eq('99 Tonnen: noch kein Hohlkoerper', hat(ohneT, 'hohl'), null);
eq('100 Tonnen: Hohlkoerper', hat(G.gitarren([einheit('2026-01-05', 100)]), 'hohl'), '2026-01-05');
eq('250 Tonnen: Kopflos', hat(G.gitarren([einheit('2026-01-05', 250)]), 'kopflos'), '2026-01-05');
eq('500 Tonnen: Goldene Axt', hat(G.gitarren([einheit('2026-01-05', 500)]), 'axt'), '2026-01-05');
eq('Tonnen addieren sich ueber Einheiten',
  hat(G.gitarren([einheit('2026-01-05', 60), einheit('2026-01-12', 60)]), 'hohl'), '2026-01-12');
eq('50 Tonnen (Gold) bringen keine Gitarre ausser dem Brett',
  G.gitarren([einheit('2026-01-05', 50)]).filter(g => g.verdient).length, 1);
eq('Jam und Unplugged bewegen keine Tonnen',
  hat(G.gitarren([{ date: '2026-01-05', type: 'wod', wod: {}, finished: '2026-01-05T10:00:00Z' }]), 'hohl'), null);

print('\n--- Das Rack ---');
{
  const logs = wochenLogs(12).concat([einheit('2026-06-01', 100)]);
  const r = G.rack(logs);
  gleich('haengt nach Datum', r.haengt.map(g => g.id), ['brett', 'keller', 'offset', 'hohl']);
  eq('Zaehler', `${r.n}/${r.gesamt}`, '4/10');
  eq('die naechste fehlende steht an der Liste', r.naechste.id, 'falke');
  const alle = G.rack([einheit('2026-01-05', 500)].concat(wochenLogs(208)));
  eq('alle zehn: keine naechste', alle.naechste, null);
  eq('alle zehn haengen', alle.n, 10);
  const gleichTag = G.rack([einheit('2026-01-05', 500)]);
  gleich('gleicher Tag: Listenreihenfolge', gleichTag.haengt.map(g => g.id), ['brett', 'hohl', 'kopflos', 'axt']);
}

print('\n--- Was fehlt noch ---');
gleich('Garage: die erste Einheit', G.bedingung(G.GITARREN[0]), { art: 'rang', id: 'garage', wochen: 1 });
gleich('Vorband: zwoelf Wochen', G.bedingung(G.GITARREN[2]), { art: 'rang', id: 'vorband', wochen: 12 });
gleich('Platin: 100 t', G.bedingung(G.GITARREN[7]), { art: 'platte', id: 'platin', tonnen: 100 });
eq('nichts', G.bedingung(null), null);
eq('unbekannter Rang', G.bedingung({ quelle: 'rang', key: 'x' }), null);

print('\n--- Neue Gitarren nach einer Einheit ---');
{
  const vor = wochenLogs(3);
  const nach = vor.concat([einheit(montage(4)[3], 1)]);
  gleich('vierte Woche: Kellerkind ist neu', G.neueGitarren(vor, nach).map(g => g.id), ['keller']);
  gleich('nichts Neues, nichts gemeldet', G.neueGitarren(nach, nach), []);
  gleich('eine grosse Einheit kann zwei auf einmal bringen',
    G.neueGitarren([], [einheit('2026-01-05', 300)]).map(g => g.id), ['brett', 'hohl', 'kopflos']);
  gleich('die erste Einheit bringt das Brett', G.neueGitarren([], wochenLogs(1)).map(g => g.id), ['brett']);
  ok('Eingaben bleiben unveraendert', vor.length === 3 && nach.length === 4);
}

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
