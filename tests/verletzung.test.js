// Ausfuehren: jsc --module-file=tests/verletzung.test.js
import * as V from '../js/verletzung.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

/* Die zwei echten Faelle, die das Feature ausgeloest haben. */
const PLANTAR = {
  id: 'plantarfaszie-links', was: 'Plantarfaszie links', art: 'wiederkehrend',
  status: 'aktiv', seit: '2026-08-01',
  behandlung: 'Morgens vor dem ersten Schritt Igelball, vor der Einheit Fuß aufwärmen.',
  sperrt: ['squatjump', 'boxjump', 'du']
};
const SCHULTER = {
  id: 'schulter-rechts', was: 'Rechte Schulter, Kalkablagerung', art: 'strukturell',
  status: 'aktiv', seit: '2025-03-01',
  behandlung: 'Kein Reißen über Kopf.',
  sperrt: ['snatch-balance', 'snatch-high-pull', 'sots-press', 'hspu', 'dbsnatch']
};
const cfg = { injuries: [PLANTAR, SCHULTER] };

print('\n--- Was eingetragen ist ---');
eq('beide werden gelesen', V.alle(cfg).length, 2);
eq('beide sind aktiv', V.aktive(cfg).length, 2);
eq('ohne Konfiguration nichts', V.alle({}).length, 0);
eq('und auch nicht bei Unsinn', V.alle({ injuries: 'kaputt' }).length, 0);
eq('ein Eintrag ohne Bezeichnung zaehlt nicht',
   V.alle({ injuries: [{ id: 'x' }, PLANTAR] }).length, 1);

print('\n--- Nur Aktives greift ein ---');
{
  const ruhend = { injuries: [{ ...PLANTAR, status: 'ruhend' }, SCHULTER] };
  eq('eine ruhende ist nicht aktiv', V.aktive(ruhend).length, 1);
  ok('und sperrt nichts mehr', !V.gesperrt(ruhend).has('boxjump'));
  ok('die andere sperrt weiter', V.gesperrt(ruhend).has('hspu'));
  const heil = { injuries: [{ ...PLANTAR, status: 'ausgeheilt' }] };
  eq('Ausgeheiltes bleibt sichtbar', V.alle(heil).length, 1);
  eq('greift aber nicht ein', V.gesperrt(heil).size, 0);
}

print('\n--- Nach dem Verlauf wird nur bei Wiederkehrendem gefragt ---');
{
  // Eine Kalkablagerung jeden Abend zu bewerten erzeugt eine Kurve ohne
  // Inhalt und eine Frage, die man wegtippt statt zu lesen.
  const z = V.zuVerfolgen(cfg);
  eq('nur eine wird verfolgt', z.length, 1);
  eq('und zwar die wiederkehrende', z[0].id, 'plantarfaszie-links');
  eq('ruhende auch nicht', V.zuVerfolgen({ injuries: [{ ...PLANTAR, status: 'ruhend' }] }).length, 0);
}

print('\n--- Sperren ---');
{
  const s = V.gesperrt(cfg);
  eq('acht Uebungen zusammen', s.size, 8);
  ok('Sprungkniebeugen wegen der Ferse', s.has('squatjump'));
  ok('Snatch Balance wegen der Schulter', s.has('snatch-balance'));
  ok('Kniebeugen nicht', !s.has('airsquat'));

  eq('man erfaehrt, wer sperrt', V.wegen(cfg, 'hspu')[0].id, 'schulter-rechts');
  eq('und bei mehreren alle',
     V.wegen({ injuries: [PLANTAR, { ...SCHULTER, sperrt: ['boxjump'] }] }, 'boxjump').length, 2);
  eq('bei einer freien Uebung niemand', V.wegen(cfg, 'pushup').length, 0);
}

print('\n--- Filtern, mit Notbremse ---');
{
  const uebungen = [{ id: 'squatjump' }, { id: 'boxjump' }, { id: 'pushup' }, { id: 'airsquat' }];
  const rest = V.ohneGesperrte(uebungen, cfg);
  eq('zwei bleiben', rest.length, 2);
  ok('und zwar die freien', rest.every(u => u.id === 'pushup' || u.id === 'airsquat'));
  eq('ohne Verletzung bleibt alles', V.ohneGesperrte(uebungen, {}).length, 4);

  // Ein leerer Bildschirm waere keine Ruecksicht, sondern ein Fehler.
  const fastAlles = { injuries: [{ ...PLANTAR, sperrt: ['squatjump','boxjump','pushup','airsquat'] }] };
  eq('bleibt nichts uebrig, greift die Notbremse',
     V.ohneGesperrte(uebungen, fastAlles).length, 4);
  eq('das Minimum ist einstellbar',
     V.ohneGesperrte(uebungen, cfg, 3).length, 4);
}

print('\n--- Grundlifts werden nicht gesperrt, nur angemerkt ---');
{
  // Fehlt ein Grundlift, hat die 5x5-Mechanik nichts mehr zu rechnen:
  // A/B-Wechsel, Progression und Deload haengen alle daran.
  const mitLift = { injuries: [{ ...SCHULTER, sperrt: ['ohp', 'snatch-balance'] }] };
  const lifts = ['squat', 'bench', 'row', 'ohp', 'deadlift'];
  eq('der betroffene Lift wird benannt', V.betroffeneLifts(mitLift, lifts).join(), 'ohp');
  eq('ohne Treffer leer', V.betroffeneLifts(cfg, lifts).length, 0);
  // Und er steht trotzdem in der Sperrliste — das Filtern der
  // Uebungslisten darf ihn treffen, der Trainingsplan nicht.
  ok('in der Sperre steht er weiterhin', V.gesperrt(mitLift).has('ohp'));
}

print('\n--- Formular ---');
{
  const gebaut = V.baueVerletzungen([
    { was: '  Plantarfaszie links  ', art: 'wiederkehrend', status: 'aktiv',
      seit: '2026-08-01', behandlung: ' Igelball ', sperrt: ['boxjump', 'boxjump', ''] },
    { was: '', status: 'aktiv' },
    { was: 'Knie', art: 'quatsch', status: 'quatsch', seit: '01.08.2026' }
  ]);
  eq('zwei von drei', gebaut.length, 2);
  eq('Leerzeichen fliegen raus', gebaut[0].was, 'Plantarfaszie links');
  eq('die Id wird erzeugt', gebaut[0].id, 'plantarfaszie-links');
  eq('Doppelte in der Sperrliste auch', gebaut[0].sperrt.length, 1);
  eq('ein halbes Datum ist keins', 'seit' in gebaut[1], false);
  eq('unbekannte Art wird wiederkehrend', gebaut[1].art, 'wiederkehrend');
  eq('unbekannter Status wird aktiv', gebaut[1].status, 'aktiv');
  ok('leere Felder bleiben weg', !('behandlung' in gebaut[1]) && !('sperrt' in gebaut[1]));

  // Strukturelles heilt nicht aus — das ist der Sinn des Wortes.
  const s = V.baueVerletzungen([{ was: 'Schulter', art: 'strukturell', status: 'ausgeheilt' }]);
  eq('ausgeheilt gibt es dort nicht', s[0].status, 'aktiv');
  eq('ruhend schon', V.baueVerletzungen([{ was: 'S', art: 'strukturell', status: 'ruhend' }])[0].status, 'ruhend');

  eq('gleiche Namen bekommen verschiedene Ids',
     V.baueVerletzungen([{ was: 'Knie' }, { was: 'Knie' }]).map(v => v.id).join(), 'knie,knie-2');
  eq('Umlaute werden umgeschrieben', V.idAus('Füße & Knöchel'), 'fuesse-knoechel');
  eq('ohne Buchstaben ein Rueckfall', V.idAus('!!!'), 'verletzung');

  const e = V.entwurf(cfg);
  eq('der Entwurf hat eine Zeile je Eintrag', e.length, 2);
  eq('mit den gespeicherten Werten', e[1].art, 'strukturell');
  ok('die Sperrliste ist eine Kopie', e[0].sperrt !== PLANTAR.sperrt);

  const neu = V.setzeInConfig({ lifts: {} }, gebaut);
  ok('landet in der config', neu.injuries.length === 2);
  ok('sonst bleibt sie unberuehrt', !!neu.lifts);
  ok('eine leere Liste entfernt den Block', !('injuries' in V.setzeInConfig(cfg, [])));
}

print('\n--- Verlauf ---');
{
  const logs = [
    { date: '2026-09-01', type: 'strength', lifts: [], koerper: { 'plantarfaszie-links': 'schlechter' } },
    { date: '2026-09-04', type: 'strength', lifts: [], koerper: { 'plantarfaszie-links': 'gleich' } },
    { date: '2026-09-08', type: 'strength', lifts: [], koerper: { 'plantarfaszie-links': 'besser' } },
    { date: '2026-09-11', type: 'strength', lifts: [], koerper: { 'plantarfaszie-links': 'besser' } },
    { date: '2026-09-15', type: 'wod' }
  ];
  const r = V.reihe(logs, 'plantarfaszie-links');
  eq('vier Bewertungen', r.length, 4);
  eq('aelteste zuerst', r[0].date, '2026-09-01');
  eq('schlechter ist minus eins', r[0].wert, -1);
  eq('zu einer anderen Verletzung nichts', V.reihe(logs, 'schulter-rechts').length, 0);

  const l = V.lage(logs, 'plantarfaszie-links');
  eq('die Summe ist plus eins', l.summe, 1);
  // Summe statt Mittel: "dreimal besser, einmal schlechter" ist eine
  // andere Lage als "viermal gleich".
  eq('das ist noch kein Trend', l.richtung, 'gleich');
  eq('mit zwei weiteren schon',
     V.lage([...logs, { date: '2026-09-18', type: 'strength', lifts: [], koerper: { 'plantarfaszie-links': 'besser' } }],
            'plantarfaszie-links').richtung, 'besser');
  eq('unter drei Punkten kein Urteil', V.lage(logs.slice(0, 2), 'plantarfaszie-links').richtung, null);
  eq('aber die Zahl steht da', V.lage(logs.slice(0, 2), 'plantarfaszie-links').punkte, 2);
  eq('ohne Logs auch kein Urteil', V.lage([], 'x').richtung, null);
}

print('\n--- Umfeld einer Verschlechterung ---');
{
  // Ausdruecklich keine Ursachenaussage, sondern eine Beobachtung.
  const logs = [
    { date: '2026-09-01', type: 'strength', lifts: [] },
    { date: '2026-09-03', type: 'strength', lifts: [] },
    { date: '2026-09-05', type: 'strength', lifts: [], koerper: { p: 'schlechter' } },
    { date: '2026-09-20', type: 'strength', lifts: [], koerper: { p: 'schlechter' } }
  ];
  const u = V.umfeld(logs, 'p', 7);
  eq('zwei Faelle', u.faelle, 2);
  // Beim ersten lagen drei Einheiten in der Woche davor, beim zweiten eine.
  eq('im Schnitt zwei Einheiten davor', u.schnitt, 2);
  eq('ohne Verschlechterung nichts', V.umfeld(logs, 'unbekannt'), null);
  eq('ohne Logs auch nicht', V.umfeld([], 'p'), null);
}

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
