// Ausfuehren: jsc --module-file=tests/merch.test.js
import * as M from '../js/merch.js';
import * as P from '../js/program.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const config = {
  bar: 20, rounding: 2.5, firstWorkout: 'A',
  deload: { afterFails: 3, factor: 0.9 },
  lifts: {
    squat:    { name: 'Back Squat',  increment: 2.5, start: 95, reference: 100 },
    bench:    { name: 'Bench Press', increment: 2.5, start: 57.5 },
    row:      { name: 'Row',         increment: 2.5, start: 50 },
    ohp:      { name: 'OHP',         increment: 2.5, start: 40 },
    deadlift: { name: 'Deadlift',    increment: 5,   start: 120 }
  },
  workouts: {
    A: [{ lift: 'squat', sets: 5, reps: 5 }, { lift: 'bench', sets: 5, reps: 5 }, { lift: 'row', sets: 5, reps: 5 }],
    B: [{ lift: 'squat', sets: 5, reps: 5 }, { lift: 'ohp', sets: 5, reps: 5 }, { lift: 'deadlift', sets: 1, reps: 5 }]
  },
  week: { slots: [{ day: 1, type: 'strength' }, { day: 3, type: 'ride' }, { day: 4, type: 'strength' }] }
};
const satz = (lift, weight, success = true) =>
  ({ lift, weight, sets: 5, reps: success ? [5, 5, 5, 5, 5] : [5, 5, 5, 4, 3], success });
const kraft = (date, lifts, extra = {}) => ({ date, type: 'strength', workout: 'A', lifts, ...extra });
const HEUTE = new Date(2026, 9, 3);  // Sa, 03.10.2026
const hat = (liste, id) => (liste.find(a => a.id === id) || {}).verdient || null;

print('\n--- Katalog ---');
{
  const k = M.katalog(config);
  ok('Plattenclub fuer jeden Grundlift, vier Stufen', k.filter(a => a.gruppe === 'platten-squat').length === 4);
  ok('1000-lb-Club, wenn Squat, Bank und Kreuzheben da sind', k.some(a => a.id === 'club'));
  ok('ohne Kreuzheben kein Club', !M.katalog({ ...config, lifts: { squat: config.lifts.squat, bench: config.lifts.bench } }).some(a => a.id === 'club'));
  ok('Koerpergewicht-Marken nur mit Waagendaten', !k.some(a => a.kategorie === 'kraft' && a.id.startsWith('koerper')));
  ok('mit Waage: Bank, Squat, Kreuzheben, OHP', M.katalog(config, { mitGewicht: true }).filter(a => a.id.startsWith('koerper')).length === 4);
  ok('Reunion nur mit Referenzgewichten', k.some(a => a.id === 'reunion'));
  ok('ohne Referenz keine Reunion', !M.katalog({ ...config, lifts: { squat: { name: 'S', start: 40 } } }).some(a => a.id === 'reunion'));
  const zwei = M.katalog(config).find(a => a.id === 'platten-squat-2');
  eq('zwei Platten: Stange plus 4 x 20', zwei.vars.kg, 100);
  ok('es gibt keinen Aufnaeher fuer viele Max-Outs', M.katalog(config).filter(a => a.gruppe === 'maxout').length === 1);
}

print('\n--- Plattenclub ---');
{
  const knapp = M.aufnaeher([kraft('2026-09-01', [satz('squat', 97.5)])], config, [], HEUTE);
  eq('97,5 kg sind noch keine zwei Platten', hat(knapp, 'platten-squat-2'), null);
  eq('aber eine', hat(knapp, 'platten-squat-1'), '2026-09-01');
  const drauf = M.aufnaeher([
    kraft('2026-09-01', [satz('squat', 97.5)]),
    kraft('2026-09-04', [satz('squat', 100, false)]),
    kraft('2026-09-08', [satz('squat', 100)])
  ], config, [], HEUTE);
  eq('ein Fehlversuch mit 100 kg zaehlt nicht', hat(drauf, 'platten-squat-2'), '2026-09-08');
  const mo = M.aufnaeher([{ date: '2026-09-02', type: 'maxout', lift: 'squat', weight: 105, reps: 1 }], config, [], HEUTE);
  eq('ein Max-Out-Lift zaehlt als gehoben', hat(mo, 'platten-squat-2'), '2026-09-02');
  const pw = M.aufnaeher([{ date: '2026-09-02', type: 'maxout', check: 'klimmzug', weight: 120, reps: 1 }], config, [], HEUTE);
  eq('ein Pruefwert ist kein Grundlift', hat(pw, 'platten-squat-2'), null);
}

print('\n--- 1000-lb-Club ---');
{
  const logs = [
    kraft('2026-09-01', [satz('squat', 130), satz('bench', 95)]),
    kraft('2026-09-03', [satz('deadlift', 225)])   // 130 + 95 + 225 = 450
  ];
  eq('450 kg reichen nicht', hat(M.aufnaeher(logs, config, [], HEUTE), 'club'), null);
  const mehr = logs.concat([kraft('2026-09-08', [satz('bench', 100)])]);   // 455
  eq('mit den Bestwerten verschiedener Tage', hat(M.aufnaeher(mehr, config, [], HEUTE), 'club'), '2026-09-08');
}

print('\n--- Koerpergewicht ---');
{
  const wellness = [{ date: '2026-08-30', weight: 80 }, { date: '2026-09-01', weight: 80 }];
  const logs = [kraft('2026-09-01', [satz('bench', 77.5)]), kraft('2026-09-05', [satz('bench', 80)])];
  const a = M.aufnaeher(logs, config, wellness, HEUTE);
  eq('Bank mit Koerpergewicht, sobald gehoben', hat(a, 'koerper-bench'), '2026-09-05');
  eq('ohne Waage gibt es den Aufnaeher gar nicht', M.aufnaeher(logs, config, [], HEUTE).some(x => x.id === 'koerper-bench'), false);
  const alt = M.aufnaeher([kraft('2026-12-01', [satz('bench', 80)])], config, wellness, HEUTE);
  eq('ein drei Monate alter Waagenwert gilt nicht', hat(alt, 'koerper-bench'), null);
}

print('\n--- Buehne ---');
{
  const logs = [];
  for (let i = 0; i < 10; i++) {
    const d = `2026-07-${String(1 + i * 2).padStart(2, '0')}`;
    logs.push(kraft(d, [satz('squat', 60)], i < 9 ? { zugabe: 'fin' } : {}));
  }
  logs.push({ date: '2026-07-01', type: 'wod', label: 'AMRAP' });            // derselbe Tag
  logs.push({ date: '2026-07-25', type: 'anpassung', gewichte: { squat: 60 } });
  const a = M.aufnaeher(logs, config, [], HEUTE);
  eq('Debuet am ersten Tag', hat(a, 'debuet'), '2026-07-01');
  eq('zehn Gigs: Tage, nicht Logs — Jam am selben Abend zaehlt nicht doppelt', hat(a, 'gigs-10'), '2026-07-19');
  eq('erster Jam', hat(a, 'jam'), '2026-07-01');
  eq('neun Zugaben sind noch keine zehn', hat(a, 'zugaben'), null);
  eq('zehn saubere Einheiten: tight', hat(a, 'tight'), '2026-07-19');
  eq('kein Max-Out, kein Aufnaeher', hat(a, 'maxout'), null);
  const unp = Array.from({ length: 10 }, (_, i) => ({ date: `2026-06-${String(i + 1).padStart(2, '0')}`, type: 'unplugged' }));
  eq('MTV Unplugged nach zehn', hat(M.aufnaeher(unp, config, [], HEUTE), 'unplugged'), '2026-06-10');
}

print('\n--- Comeback und Rueckweg ---');
{
  const anp = { date: '2026-09-20', type: 'anpassung', grund: 'pause', gewichte: { squat: 90 }, ziele: { squat: 95 } };
  const logs = [kraft('2026-09-01', [satz('squat', 95)]), anp];
  eq('eine Anpassung allein ist noch kein Comeback', hat(M.aufnaeher(logs, config, [], HEUTE), 'comeback'), null);
  const zurueck = logs.concat([kraft('2026-09-22', [satz('squat', 90)])]);
  const a = M.aufnaeher(zurueck, config, [], HEUTE);
  eq('Comeback mit der ersten Einheit danach', hat(a, 'comeback'), '2026-09-22');
  eq('90 + doppelter Schritt = 95: Rueckweg geschafft', hat(a, 'rueckweg'), '2026-09-22');
  const scheitern = logs.concat([kraft('2026-09-22', [satz('squat', 90, false)])]);
  eq('ein Fehlversuch beendet den Rueckweg ohne Aufnaeher', hat(M.aufnaeher(scheitern, config, [], HEUTE), 'rueckweg'), null);
  const andere = [kraft('2026-09-01', [satz('squat', 95)]),
    { date: '2026-09-21', type: 'anpassung', gewichte: { squat: 80 } }, kraft('2026-09-23', [satz('squat', 80)])];
  eq('eine Anpassung ohne Pause-Grund ist kein Comeback', hat(M.aufnaeher(andere, config, [], HEUTE), 'comeback'), null);
}

print('\n--- Reunion ---');
{
  const cfg = { ...config, lifts: { squat: { ...config.lifts.squat, start: 95, reference: 100 } },
    workouts: { A: [{ lift: 'squat' }], B: [{ lift: 'squat' }] } };
  const logs = [kraft('2026-09-01', [satz('squat', 95)]), kraft('2026-09-03', [satz('squat', 97.5)])];
  eq('alle Lifts auf dem alten Stand: Originalbesetzung', hat(M.aufnaeher(logs, cfg, [], HEUTE), 'reunion'), '2026-09-03');
  const zwei = { ...config, lifts: { ...config.lifts, bench: { ...config.lifts.bench, reference: 70 } } };
  eq('einer reicht nicht, wenn mehrere eine Referenz haben', hat(M.aufnaeher(logs, zwei, [], HEUTE), 'reunion'), null);
}

print('\n--- Serien mit Verletzungspause ---');
{
  const logs = ['2026-07-06', '2026-07-13', '2026-07-20', '2026-08-17'].map(d => kraft(d, [satz('row', 50)]));
  eq('Luecke ohne Verletzung: keine vier Wochen', hat(M.aufnaeher(logs, config, [], HEUTE), 'serie-4'), null);
  const cfg = { ...config, injuries: [{ id: 'finger', was: 'Finger', art: 'wiederkehrend', status: 'ruhend', seit: '2026-07-22', bis: '2026-08-14' }] };
  eq('Luecke in der Verletzungspause: vier Wochen am ersten Tag der vierten', hat(M.aufnaeher(logs, cfg, [], HEUTE), 'serie-4'), '2026-08-17');
}

print('\n--- Die Weste ---');
{
  const a = M.aufnaeher([kraft('2026-09-01', [satz('squat', 62.5)])], config, [], HEUTE);
  const w = M.kutte(a);
  ok('verdient: Debuet und eine Platte Squat', ['debuet', 'platten-squat-1'].every(id => w.verdient.some(x => x.id === id)));
  eq('je Leiter nur der naechste Umriss', w.naechste.filter(x => x.gruppe === 'platten-squat').length, 1);
  eq('und zwar der naechste', w.naechste.find(x => x.gruppe === 'platten-squat').id, 'platten-squat-2');
  eq('bei den Gigs: zehn', w.naechste.find(x => x.gruppe === 'gigs').id, 'gigs-10');
  const vorher = [kraft('2026-09-01', [satz('squat', 97.5)])];
  const neu = M.neueAufnaeher(vorher, vorher.concat([kraft('2026-09-04', [satz('squat', 100)])]), config, [], HEUTE);
  eq('neue Aufnaeher einer Einheit: genau zwei Platten', neu.map(x => x.id).join(), 'platten-squat-2');
}

print('\n--- Ableitbar ---');
{
  const logs = [kraft('2026-09-08', [satz('squat', 100)]), kraft('2026-09-01', [satz('squat', 97.5)])];
  eq('Reihenfolge der Dateien egal', JSON.stringify(M.aufnaeher(logs, config, [], HEUTE)),
    JSON.stringify(M.aufnaeher([...logs].reverse(), config, [], HEUTE)));
  const z = M.zeitleiste(logs, config);
  eq('die Zeitleiste endet beim abgeleiteten Zustand', JSON.stringify(z[z.length - 1].nachher.lifts),
    JSON.stringify(P.deriveState(config, logs).lifts));
  ok('ein kaputter Krafteintrag legt nichts lahm', M.aufnaeher([{ date: '2026-09-01', type: 'strength' }], config, [], HEUTE).length > 0);
}

print('\n--- Schallplatten ---');
{
  // 100 kg x 25 Wiederholungen = 2,5 t je Einheit; 20 Einheiten = 50 t
  const logs = Array.from({ length: 21 }, (_, i) =>
    kraft(P.ymd(new Date(2026, 0, 1 + i * 3)), [satz('squat', 100)]));
  const s = M.schallplatten(logs);
  eq('Gold nach genau 50 Tonnen', s.stufen.find(p => p.id === 'gold').verdient, logs[19].date);
  eq('Platin noch nicht', s.stufen.find(p => p.id === 'platin').verdient, null);
  eq('Tonnen auf eine Stelle', s.tonnen, 52.5);
  eq('naechste Scheibe: Platin', s.naechste.id, 'platin');
  eq('es fehlen 47,5 t', s.naechste.fehlt, 47.5);
  ok('Fortschritt ab Gold gerechnet', Math.abs(s.naechste.anteil - 0.05) < 1e-9, s.naechste.anteil);
  eq('ohne Logs: null Tonnen', M.schallplatten([]).tonnen, 0);
  eq('ein Jam bewegt keine Tonnen', M.schallplatten([{ date: '2026-01-01', type: 'wod' }]).tonnen, 0);
}

print('\n--- Rang ---');
{
  eq('ohne Gigs: Garagenband', M.rang([]).id, 'garage');
  const eineWoche = ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11']
    .map(d => kraft(d, [satz('squat', 60)]));
  eq('fuenf Einheiten in einer Woche sind eine Woche', M.rang(eineWoche).wochen, 1);
  const vier = ['2026-08-03', '2026-08-10', '2026-09-14', '2026-09-21'].map(d => kraft(d, [satz('squat', 60)]));
  eq('vier Wochen, auch mit Luecke: Proberaum', M.rang(vier).id, 'proberaum');
  eq('die naechste Stufe: Vorband', M.rang(vier).naechste.id, 'vorband');
  eq('es fehlen acht Wochen', M.rang(vier).naechste.fehlt, 8);
  eq('Anpassungen sind keine Gigs', M.rang([{ date: '2026-09-01', type: 'anpassung', gewichte: {} }]).wochen, 0);
  const viel = Array.from({ length: 210 }, (_, i) => ({ date: P.ymd(new Date(2020, 0, 6 + i * 7)), type: 'wod' }));
  eq('ganz oben: Hall of Fame', M.rang(viel).id, 'halloffame');
  eq('darueber gibt es nichts', M.rang(viel).naechste, null);
}

print('\n--- Tourshirts ---');
{
  eq('derselbe Name fuer dasselbe Quartal', M.tourName(2026, 4), M.tourName(2026, 4));
  ok('Name endet auf Tour', /^\w+ \w+ Tour$/.test(M.tourName(2026, 3)), M.tourName(2026, 3));
  const namen = new Set([1, 2, 3, 4].map(q => M.tourName(2026, q)));
  ok('verschiedene Quartale klingen verschieden', namen.size >= 3, [...namen].join(' / '));
  const logs = [
    kraft('2026-09-29', [satz('squat', 60)], { ort: 'Studio Nord' }),
    { date: '2026-09-29', type: 'wod', label: 'AMRAP' },
    kraft('2026-10-01', [satz('squat', 62.5)]),
    { date: '2026-10-01', type: 'anpassung', gewichte: {} }
  ];
  const t = M.touren(logs, HEUTE);
  eq('zwei Quartale, zwei Touren', t.length, 2);
  eq('die neueste zuerst', t[0].quartal, 4);
  ok('das laufende Quartal ist markiert', t[0].laufend && !t[1].laufend);
  eq('Kraft und Jam am selben Tag: ein Gig', t[1].gigs.length, 1);
  eq('mit beiden Arten', t[1].gigs[0].arten.join('+'), 'kraft+jam');
  eq('und dem Ort, wo einer steht', t[1].gigs[0].ort, 'Studio Nord');
  eq('Anpassungen stehen nicht auf dem Shirt', t[0].gigs.length, 1);
  eq('Tonnen je Tour', t[1].tonnen, 1.5);
}

print('\n--- Jahresbilanz ---');
{
  const logs = [
    kraft('2025-12-20', [satz('squat', 95)]),
    kraft('2026-01-05', [satz('squat', 97.5)]),
    kraft('2026-01-08', [satz('squat', 100)]),
    { date: '2026-01-09', type: 'wod' }
  ];
  const b = M.jahresBilanz(logs, config, 2026, { heute: HEUTE });
  eq('Gigs im Jahr', b.gigs, 3);
  eq('Wochen im Jahr', b.wochen, 1);
  eq('Squat am Jahresanfang', b.lifts.squat.von, 97.5);
  eq('und am Ende', b.lifts.squat.bis, 102.5);
  eq('ein Lift, der nie vorkam, steht nicht drin', b.lifts.ohp, undefined);
  eq('ein Jahr ohne Gigs hat keine Bilanz', M.jahresBilanz(logs, config, 2024, { heute: HEUTE }), null);
}

print('\n--- Goes to eleven ---');
{
  // Woche ab Mo 28.09.2026, zwei Krafteinheiten geplant
  const heute = new Date(2026, 9, 1);
  eq('nichts erledigt: null', M.verstaerker([], config, heute).stufe, 0);
  const eine = [kraft('2026-09-28', [satz('squat', 60)])];
  eq('eine von zwei: fuenf', M.verstaerker(eine, config, heute).stufe, 5);
  const beide = eine.concat([kraft('2026-10-01', [satz('squat', 62.5)])]);
  eq('Plan erfuellt und alles sauber: elf', M.verstaerker(beide, config, heute).stufe, 11);
  const unsauber = eine.concat([kraft('2026-10-01', [satz('squat', 62.5, false)])]);
  eq('Plan erfuellt mit Fehlversuch: zehn', M.verstaerker(unsauber, config, heute).stufe, 10);
  const mehr = beide.concat([kraft('2026-09-30', [satz('bench', 40)])]);
  eq('mehr als geplant dreht nicht weiter', M.verstaerker(mehr, config, heute).stufe, 11);
  eq('letzte Woche zaehlt nicht', M.verstaerker([kraft('2026-09-25', [satz('squat', 60)])], config, heute).stufe, 0);
  const hist = [{ date: '2026-09-28', type: 'strength' }, { date: '2026-10-01', type: 'strength' }];
  eq('nur aus der Historie: Plan erfuellt, Sauberkeit unbekannt: zehn', M.verstaerker([], config, heute, hist).stufe, 10);
  eq('Historie und Logs decken sich: elf', M.verstaerker(beide, config, heute, hist).stufe, 11);
  eq('ein Tag ohne Log: keine geschenkte Elf', M.verstaerker(eine, config, heute, hist).stufe, 10);
  eq('ohne Krafttage im Plan kein Regler', M.verstaerker([], { week: { slots: [] } }, heute), null);
}

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
