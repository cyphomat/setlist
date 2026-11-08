// Ausfuehren: jsc --module-file=tests/pit-thema.test.js
//
// Mosh Pit auf der Buehne: Ansagen, Schlusszeilen und der Weg zur naechsten
// Flamme. Alles reine Texte und Rechnung, die Leiter bleibt, wie sie ist.
const speicher = new Map();
globalThis.localStorage = {
  getItem: k => (speicher.has(k) ? speicher.get(k) : null),
  setItem: (k, v) => speicher.set(k, String(v)),
  removeItem: k => speicher.delete(k)
};
globalThis.document = { documentElement: {}, querySelectorAll: () => [] };

const MP = await import('../js/moshpit.js');
const M = await import('../js/merch.js');
const I = await import('../js/i18n.js');

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

print('\n--- Schlusszeile ---');
eq('derselbe Tag, dieselbe Zeile', MP.schluss('2026-11-08', true), MP.schluss('2026-11-08', true));
ok('alles geschafft: aus der fin-Reihe', /^mp\.fin\.\d$/.test(MP.schluss('2026-11-08', true)));
ok('nicht alles: aus der rest-Reihe', /^mp\.rest\.\d$/.test(MP.schluss('2026-11-08', false)));
{
  const fin = new Set(), rest = new Set();
  for (let i = 0; i < 90; i++) {
    const d = `2026-${i < 30 ? '09' : i < 60 ? '10' : '11'}-${String(i % 30 + 1).padStart(2, '0')}`;
    fin.add(MP.schluss(d, true)); rest.add(MP.schluss(d, false));
  }
  eq('ueber 90 Tage kommen alle fin-Zeilen vor', fin.size, MP.FIN_N);
  eq('ueber 90 Tage kommen alle rest-Zeilen vor', rest.size, MP.REST_N);
}

print('\n--- Weg zur naechsten Flamme ---');
const stufen = M.PIT_SERIE_STUFEN;
eq('Stufen der Pit-Serie: 3 und 6', stufen.join(','), '3,6');
eq('Serie 1: noch zwei bis zur dritten', MP.serieZiel(1, stufen).noch, 2);
eq('Serie 1: Ziel ist Stufe 3', MP.serieZiel(1, stufen).stufe, 3);
eq('Serie 3: dann die sechste', MP.serieZiel(3, stufen).stufe, 6);
eq('Serie 3: noch drei', MP.serieZiel(3, stufen).noch, 3);
eq('Serie 5: noch eine', MP.serieZiel(5, stufen).noch, 1);
eq('Serie 6: alle Flammen da', MP.serieZiel(6, stufen), null);
eq('Serie 20: alle Flammen da', MP.serieZiel(20, stufen), null);
eq('Serie 0: noch drei', MP.serieZiel(0, stufen).noch, 3);
eq('Muell zaehlt als 0', MP.serieZiel('x', stufen).noch, 3);
eq('negativ zaehlt als 0', MP.serieZiel(-4, stufen).noch, 3);
eq('ohne Stufen nichts', MP.serieZiel(2, []), null);
eq('unsortierte Stufen gehen auch', MP.serieZiel(2, [6, 3]).stufe, 3);

print('\n--- Texte: beide Sprachen, gleiche Platzhalter ---');
{
  const keys = MP.LIFTS.map(l => `mp.a.${l.id}`).concat(['mp.serieStand', 'mp.serieNoch']);
  for (let i = 0; i < MP.FIN_N; i++) keys.push(`mp.fin.${i}`);
  for (let i = 0; i < MP.REST_N; i++) keys.push(`mp.rest.${i}`);
  const platz = s => (String(s).match(/\{\w+\}/g) || []).sort().join(',');
  const fehlt = [], anders = [];
  for (const k of keys) {
    I.setSprache('de'); const de = I.t(k);
    I.setSprache('en'); const en = I.t(k);
    if (de === k || en === k) fehlt.push(k); else if (platz(de) !== platz(en)) anders.push(k);
  }
  I.setSprache('de');
  eq('kein Schluessel fehlt', fehlt.join(' '), '');
  eq('Platzhalter in beiden Sprachen gleich', anders.join(' '), '');
  I.setSprache('de'); const a = I.t('mp.serieNoch', { noch: 2 }); I.setSprache('en'); const b = I.t('mp.serieNoch', { noch: 2 }); I.setSprache('de');
  ok('Platzhalter wird ersetzt', a.includes('2') && b.includes('2') && !a.includes('{') && !b.includes('{'));
}

print('\n--- Die Leiter bleibt ---');
eq('Leiter unveraendert', MP.LEITER.join(','), '10,12,15,17,20');
eq('Schrittweite unveraendert', MP.SCHRITT_KG, 4);
eq('Auf 15 folgt 17', MP.weiter({ kg: 12, reps: 15, geschafft: true }).reps, 17);

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
