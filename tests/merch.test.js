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
  const f = M.rang(vier).freigespielt;
  eq('Garage ab dem ersten Gig', f[0], '2026-08-03');
  eq('Proberaum am Tag der vierten Woche', f[1], '2026-09-21');
  eq('Vorband noch nicht', f[2], null);
  eq('ein Datum je Rang', f.length, M.RAENGE.length);
  eq('ohne Gigs nichts freigespielt', M.rang([]).freigespielt.every(x => x === null), true);
  const mitRad = M.rang(vier.slice(0, 3), [{ date: '2026-09-25', km: 30 }]);
  eq('eine Radwoche zaehlt mit', mitRad.freigespielt[1], '2026-09-25');
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

print('\n--- Tourshirt-Stil ---');
{
  const st = M.tourStil(2026, 3);
  eq('Name aus Stil', M.tourName(2026, 3), `${M.ADJ[st.farbe]} ${M.NOMEN[st.motiv]} Tour`);
  ok('Stoff und Emblem im Bereich', st.farbe >= 0 && st.farbe < M.ADJ.length && st.motiv >= 0 && st.motiv < M.NOMEN.length);
  eq('je zwoelf', `${M.ADJ.length}/${M.NOMEN.length}`, '12/12');
  const tr = M.touren([kraft('2026-08-03', [satz('squat', 95)])], HEUTE)[0];
  eq('Tour traegt ihren Stil', `${tr.farbe}/${tr.motiv}`, `${st.farbe}/${st.motiv}`);
  const alle = new Set();
  for (let j = 2026; j < 2036; j++) for (let q = 1; q <= 4; q++) { const x = M.tourStil(j, q); alle.add(x.farbe); }
  ok('ueber zehn Jahre kommen viele Stoffe vor', alle.size >= 8, String(alle.size));
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


print('\n--- Rad ---');
{
  const fahrt = (date, km, extra = {}) => ({ id: `${date}-${km}`, date, zeit: `${date}T07:00:00`, minutes: 60, km, hm: null, trainer: true, ...extra });
  const kraftLog = kraft('2026-09-01', [satz('squat', 60)]);
  eq('ohne Fahrten keine Rad-Reihe', M.aufnaeher([kraftLog], config, [], HEUTE).some(a => a.kategorie === 'rad'), false);

  const knapp = [fahrt('2026-09-02', 60), fahrt('2026-09-04', 39.9)];
  const a1 = M.aufnaeher([kraftLog], config, [], HEUTE, { fahrten: knapp });
  eq('99,9 km sind noch keine 100', hat(a1, 'km-100'), null);
  const a2 = M.aufnaeher([kraftLog], config, [], HEUTE, { fahrten: knapp.concat([fahrt('2026-09-06', 0.1)]) });
  eq('100 km: der Tourbus am Tag der Fahrt', hat(a2, 'km-100'), '2026-09-06');
  eq('100 km als Summe sind kein Highway Star', hat(a2, 'century'), null);
  eq('Highway Star: 100 km am Stueck', hat(M.aufnaeher([kraftLog], config, [], HEUTE, { fahrten: [fahrt('2026-09-05', 101.2)] }), 'century'), '2026-09-05');

  eq('ohne Hoehenmeter-Daten kein Stairway-Aufnaeher', a2.some(a => a.id === 'hoehe'), false);
  const berg = [fahrt('2026-09-02', 40, { hm: 5000 }), fahrt('2026-09-09', 40, { hm: 3848 })];
  eq('Stairway to Heaven bei 8848 hm insgesamt', hat(M.aufnaeher([kraftLog], config, [], HEUTE, { fahrten: berg }), 'hoehe'), '2026-09-09');

  const draussen = Array.from({ length: 10 }, (_, i) => fahrt(P.ymd(new Date(2026, 6, 1 + i)), 30, { trainer: i === 4 }));
  const a3 = M.aufnaeher([kraftLog], config, [], HEUTE, { fahrten: draussen.concat([fahrt('2026-07-20', 30, { trainer: false })]) });
  eq('Open Air zaehlt die Rolle nicht mit', hat(a3, 'openair'), '2026-07-20');

  // Doom: zehn Fahrten im Plan. Der Plan sagt 0,60-0,75.
  const plan = () => ({ label: 'Z2', ftp: [0.60, 0.75] });
  const locker = Array.from({ length: 11 }, (_, i) => fahrt(P.ymd(new Date(2026, 7, 1 + i)), 30, { intensitaet: i === 3 ? 0.9 : 0.68 }));
  const mitRadPlan = { ...config, rides: [{ label: 'Z2' }] };
  const a4 = M.aufnaeher([kraftLog], mitRadPlan, [], HEUTE, { fahrten: locker, planFuer: plan });
  eq('Doom nach zehn Fahrten im Ziel — die zu harte zaehlt nicht', hat(a4, 'doom'), '2026-08-11');
  eq('ohne Plan kein Doom-Aufnaeher', M.aufnaeher([kraftLog], config, [], HEUTE, { fahrten: locker }).some(a => a.id === 'doom'), false);
  const ohneRadPlan = { ...config, rides: [], week: { slots: [{ day: 1, type: 'strength' }] } };
  eq('ohne geplante Radeinheiten kein Doom', M.aufnaeher([kraftLog], ohneRadPlan, [], HEUTE, { fahrten: locker, planFuer: plan }).some(a => a.id === 'doom'), false);
  ok('mit Radplan gibt es Doom', M.aufnaeher([kraftLog], mitRadPlan, [], HEUTE, { fahrten: locker, planFuer: plan }).some(a => a.id === 'doom'));

  // Crossover: Kraft Di, Rad Do derselben Woche; Woche danach nur Rad
  const cross = M.aufnaeher([kraft('2026-09-08', [satz('squat', 60)])], config, [], HEUTE,
    { fahrten: [fahrt('2026-09-10', 30), fahrt('2026-09-16', 30)] });
  eq('Crossover am spaeteren Tag der Woche', hat(cross, 'crossover-1'), '2026-09-10');
  eq('eine Woche nur mit Rad zaehlt nicht', hat(cross, 'crossover-10'), null);

  // Gigs, Rang und Serie mit Fahrten
  const nurRad = Array.from({ length: 9 }, (_, i) => fahrt(P.ymd(new Date(2026, 5, 2 + i * 7)), 30));
  const a5 = M.aufnaeher([kraft('2026-08-04', [satz('squat', 60)])], config, [], HEUTE, { fahrten: nurRad.concat([fahrt('2026-06-02', 20)]) });
  eq('zwei Fahrten am selben Tag sind ein Gig: zehn Gigs am Krafttag', hat(a5, 'gigs-10'), '2026-08-04');
  eq('Debuet: die erste Fahrt', hat(a5, 'debuet'), '2026-06-02');
  eq('Serie aus Radwochen und Kraftwoche', hat(a5, 'serie-4'), '2026-06-23');
  eq('Rang zaehlt Radwochen', M.rang([kraft('2026-08-04', [satz('squat', 60)])], nurRad).wochen, 10);
  eq('ohne Fahrten bleibt es bei einer Woche', M.rang([kraft('2026-08-04', [satz('squat', 60)])]).wochen, 1);

  // Tourshirt und Bilanz
  const tr = M.touren([kraft('2026-09-08', [satz('squat', 60)])], HEUTE, [], [fahrt('2026-09-08', 42.4), fahrt('2026-09-12', 30)]);
  eq('Kraft und Rad am selben Tag: ein Gig, beide Arten', tr[0].gigs[0].arten.join('+'), 'kraft+rad');
  eq('ein reiner Radtag steht auch drauf', tr[0].gigs[1].arten.join('+'), 'rad');
  eq('km je Tour', tr[0].km, 72);
  const bil = M.jahresBilanz([], config, 2026, { heute: HEUTE, fahrten: [fahrt('2026-09-12', 30.4)] });
  eq('ein Jahr nur mit Rad hat eine Bilanz', bil && bil.gigs, 1);
  eq('mit Kilometern', bil.km, 30);
}

print('\n--- Aftershow: Roadcrew und Hangar 18 ---');
{
  ok('beide im Katalog', ['roadcrew', 'hangar'].every(id => M.katalog(config).some(a => a.id === id)));
  const tage = Array.from({ length: 10 }, (_, i) => `2026-08-${String(3 + i * 2).padStart(2, '0')}`);
  const mitHilfs = tage.map((d, i) => kraft(d, [satz('squat', 95)], { hilfs: [{ id: i === 9 ? 'chinup' : 'dip', reps: i === 9 ? [10, 6] : [8] }] }));
  const neun = M.aufnaeher(mitHilfs.slice(0, 9), config, [], HEUTE);
  eq('neun Einheiten mit Hilfsarbeit: noch keine Roadcrew', hat(neun, 'roadcrew'), null);
  const zehn = M.aufnaeher(mitHilfs, config, [], HEUTE);
  eq('zehnte: Roadcrew', hat(zehn, 'roadcrew'), tage[9]);
  eq('zehn Chin-ups am Stueck: Hangar 18', hat(zehn, 'hangar'), tage[9]);
  const leer = tage.map(d => kraft(d, [satz('squat', 95)], { hilfs: [{ id: 'dip', reps: [] }] }));
  eq('leere Eintraege zaehlen nicht', hat(M.aufnaeher(leer, config, [], HEUTE), 'roadcrew'), null);
  const dips = M.aufnaeher([kraft('2026-09-01', [satz('squat', 95)], { hilfs: [{ id: 'dip', reps: [25] }] })], config, [], HEUTE);
  eq('25 Dips sind kein Klimmzug', hat(dips, 'hangar'), null);
  const summe = M.aufnaeher([kraft('2026-09-01', [satz('squat', 95)], { hilfs: [{ id: 'pullup', reps: [5, 5, 5] }] })], config, [], HEUTE);
  eq('dreimal fuenf sind keine zehn am Stueck', hat(summe, 'hangar'), null);
}

print('\n--- Mobility und Gelenkig ---');
{
  const mob = (date, uebung = 'couch') => ({ date, type: 'mobility', uebung, finished: `${date}T07:00:00Z` });
  ok('drei Stufen im Katalog', [1, 4, 12].every(n => M.katalog(config).some(a => a.id === `gelenkig-${n}`)));
  const woche = [mob('2026-09-07'), kraft('2026-09-08', [satz('squat', 95)], { mobility: 'hips' }), mob('2026-09-08'), mob('2026-09-10')];
  eq('Tage zusammengefasst, doppelt zaehlt einmal', M.mobilityTage(woche).join(','), '2026-09-07,2026-09-08,2026-09-10');
  eq('dritter Tag macht die Woche voll', M.gelenkigeWochen(woche).join(','), '2026-09-10');
  eq('Gelenkig am dritten Tag', hat(M.aufnaeher(woche, config, [], HEUTE), 'gelenkig-1'), '2026-09-10');
  const zwei = [mob('2026-09-06'), mob('2026-09-07'), mob('2026-09-08')];   // So | Mo, Di
  eq('ueber die Wochengrenze: noch nicht', M.gelenkigeWochen(zwei).length, 0);
  eq('ohne Mobility kein Gelenkig', hat(M.aufnaeher([kraft('2026-09-08', [satz('squat', 95)])], config, [], HEUTE), 'gelenkig-1'), null);
  const vier = [];
  for (const mo of ['2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24'])
    for (let i = 0; i < 3; i++) { const d = new Date(mo + 'T12:00:00'); d.setDate(d.getDate() + i * 2); vier.push(mob(P.ymd(d))); }
  const a4 = M.aufnaeher(vier, config, [], HEUTE);
  eq('vier Wochen: Stufe 4', hat(a4, 'gelenkig-4'), '2026-08-28');
  eq('zwoelf noch nicht', hat(a4, 'gelenkig-12'), null);
  eq('Mobility ist kein Gig', M.GIG_TYPEN.includes('mobility'), false);
  eq('Mobility zaehlt nicht zum Rang', M.rang(vier, []).wochen || 0, 0);
  eq('diese Woche zwei Tage', M.mobilityWoche([mob('2026-09-28'), mob('2026-09-30'), mob('2026-10-05')], new Date(2026, 9, 1)), 2);
  eq('Zukunft zaehlt nicht', M.mobilityWoche([mob('2026-10-02')], new Date(2026, 9, 1)), 0);
  const st = P.applyLog(P.initialState(config), config, mob('2026-09-07'));
  eq('Historie: als Mobility, nicht als WOD', `${st.history[0].type}/${st.history[0].label}`, 'mobility/undefined');
  eq('A/B-Wechsel unberuehrt', st.next, P.initialState(config).next);
  ok('kein Training', !P.istTraining(st.history[0]) && P.istTraining({ date: '2026-09-07', type: 'wod' }));
}

print('\n--- Monats-Tour ---');
{
  // Plan: Mo Kraft, Mi Rad, Do Kraft. September 2026: 4 Montage, 4 Donnerstage, 5 Mittwoche.
  const mob = d => ({ date: d, type: 'mobility', uebung: 'couch' });
  const tage = ['03', '07', '10', '14', '17', '21', '24', '28'].map(t => `2026-09-${t}`);
  const sept = [kraft('2026-08-03', [satz('squat', 95)])]
    .concat(tage.map((d, i) => kraft(d, [satz('squat', 95, i < 4)])))
    .concat(['02', '09', '16', '23'].map(t => mob(`2026-09-${t}`)));
  const mt = M.monatsTour(sept, config, '2026-09', { heute: HEUTE });
  const z = id => mt.ziele.find(x => x.id === id);
  eq('Kraft-Soll aus dem Plan', z('kraft').soll, 8);
  eq('sauber: halb so viele', z('sauber').soll, 4);
  eq('ohne Rad: Ersatzziel', `${z('neben').soll} ${!!z('rad')}`, '4 false');
  ok('komplett', mt.komplett && !mt.laufend);
  eq('besiegt am Tag des letzten erfuellten Ziels', mt.besiegtAm, '2026-09-28');
  eq('sauber war schon frueher erfuellt', z('sauber').am, '2026-09-14');
  const sieben = M.monatsTour(sept.filter(l => l.date !== '2026-09-28'), config, '2026-09', { heute: HEUTE });
  ok('eine Einheit fehlt: nicht komplett', !sieben.komplett && sieben.besiegtAm === null && sieben.ziele[0].ist === 7);
  const extra = M.monatsTour(sept.concat([kraft('2026-09-29', [satz('squat', 95)])]), config, '2026-09', { heute: HEUTE });
  eq('mehr als geplant: Soll bleibt', extra.ziele[0].soll, 8);
  const spaet = M.monatsTour(sept.filter(l => l.date >= '2026-09-15'), config, '2026-09', { heute: HEUTE });
  eq('Start Mitte Monat: Soll ab dem ersten Tag', `${spaet.ziele[0].soll}/${spaet.ziele[1].soll}/${spaet.ziele[2].soll}`, '4/2/2');
  const verletzt = { ...config, injuries: [{ id: 'knie', was: 'Knie', art: 'akut', status: 'ruhend', seit: '2026-09-01', bis: '2026-09-13' }] };
  eq('Pausenfenster zaehlt nicht zum Soll', M.monatsTour(sept, verletzt, '2026-09', { heute: HEUTE }).ziele[0].soll, 5);
  const ganz = { ...config, injuries: [{ id: 'knie', was: 'Knie', art: 'akut', status: 'ruhend', seit: '2026-09-01', bis: '2026-09-30' }] };
  const pause = M.monatsTour(sept, ganz, '2026-09', { heute: HEUTE });
  ok('ganzer Monat Pause: kein Gegner', pause.pause && !pause.komplett);
  const mitRad = { ...config, rides: [{ id: 'z2', name: 'Z2' }] };
  const fahrten = ['02', '09', '16', '23'].map(t => ({ date: `2026-09-${t}`, km: 30 }));
  const r = M.monatsTour(sept, mitRad, '2026-09', { heute: HEUTE, fahrten });
  eq('mit Rad: geplante Mittwoche', `${r.ziele[1].id} ${r.ziele[1].ist}/${r.ziele[1].soll}`, 'rad 4/5');
  ok('eine Fahrt fehlt', !r.komplett);
  eq('Rad geplant, aber keine Fahrten: Ersatzziel', M.monatsTour(sept, mitRad, '2026-09', { heute: HEUTE }).ziele[1].id, 'neben');
  eq('vor der ersten Einheit: keine Tour', M.monatsTour(sept, config, '2026-07', { heute: HEUTE }), null);
  eq('Zukunft: keine Tour', M.monatsTour(sept, config, '2026-11', { heute: HEUTE }), null);
  const alle = M.monatsTouren(sept, config, { heute: HEUTE });
  eq('alle Monate, der juengste zuerst', alle.map(m => m.monat).join(','), '2026-10,2026-09,2026-08');
  ok('laufender Monat', alle[0].laufend);
  eq('Tour komplett: Aufnaeher am Siegtag', hat(M.aufnaeher(sept, config, [], HEUTE), 'tour-1'), '2026-09-28');
  eq('drei Monate noch nicht', hat(M.aufnaeher(sept, config, [], HEUTE), 'tour-3'), null);
  const ohnePlan = { ...config, week: { slots: [{ day: 3, type: 'ride' }] } };
  ok('ohne Krafttage: keine Tour, kein Aufnaeher', M.monatsTour(sept, ohnePlan, '2026-09', { heute: HEUTE }) === null &&
    !M.katalog(ohnePlan).some(a => a.gruppe === 'tour'));
}

print('\n--- Soundcheck-Serie ---');
{
  const wochen = ['2026-W33', '2026-W34', '2026-W35', '2026-W36'];
  const a = M.aufnaeher([], config, [], HEUTE, { soundchecks: wochen });
  eq('vier Wochen in Folge: am Sonntag der vierten', hat(a, 'soundcheck-4'), '2026-09-06');
  eq('zwoelf noch nicht', hat(a, 'soundcheck-12'), null);
  eq('mit Luecke nicht', hat(M.aufnaeher([], config, [], HEUTE, { soundchecks: ['2026-W33', '2026-W34', '2026-W36', '2026-W37'] }), 'soundcheck-4'), null);
  eq('ohne Soundchecks nicht', hat(M.aufnaeher([], config, [], HEUTE), 'soundcheck-4'), null);
}

print('\n--- Zusammen trainiert ---');
{
  const ID = 'abcdefgh23';
  const v = (datum, extra = {}) => ({ id: ID, datum, mit: 'Max', rolle: 'einlader', bestaetigt: false, ...extra });
  const mo = ['2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31'];   // W32 bis W36
  const logs = ds => ds.map(d => kraft(d, [satz('squat', 100)]));
  const gruppen = ['duett', 'faustgruss', 'partner', 'verabredung'];

  eq('allein: keine Kreise dafuer', M.katalog(config).filter(a => gruppen.includes(a.gruppe)).length, 0);
  eq('mit Verabredung: acht Aufnaeher', M.katalog(config, { mitZusammen: true }).filter(a => gruppen.includes(a.gruppe)).length, 8);
  eq('ein Verabredungsdatum reicht, damit sie erscheinen',
    M.aufnaeher([], config, [], HEUTE, { zusammen: [v('2026-08-03')] }).filter(a => gruppen.includes(a.gruppe)).length, 8);
  eq('ohne Verabredung fehlt auch die Gruppe', M.aufnaeher(logs(mo), config, [], HEUTE).filter(a => gruppen.includes(a.gruppe)).length, 0);

  eq('eingecheckt, aber nicht trainiert: kein Duett',
    hat(M.aufnaeher([], config, [], HEUTE, { zusammen: [v('2026-08-03')] }), 'duett'), null);
  eq('eingecheckt und trainiert: Duett am Tag',
    hat(M.aufnaeher(logs(['2026-08-03']), config, [], HEUTE, { zusammen: [v('2026-08-03')] }), 'duett'), '2026-08-03');
  eq('Training an einem anderen Tag zaehlt nicht',
    hat(M.aufnaeher(logs(['2026-08-04']), config, [], HEUTE, { zusammen: [v('2026-08-03')] }), 'duett'), null);
  eq('Handschlag nur bestaetigt',
    hat(M.aufnaeher(logs(['2026-08-03']), config, [], HEUTE, { zusammen: [v('2026-08-03')] }), 'faustgruss'), null);
  eq('bestaetigt: Handschlag am Tag',
    hat(M.aufnaeher(logs(['2026-08-03']), config, [], HEUTE, { zusammen: [v('2026-08-03', { bestaetigt: true })] }), 'faustgruss'), '2026-08-03');

  const fuenf = M.aufnaeher(logs(mo), config, [], HEUTE, { zusammen: mo.map(d => v(d)) });
  eq('fuenf gemeinsame Tage: Partner 5 am fuenften', hat(fuenf, 'partner-5'), '2026-08-31');
  eq('15 noch nicht', hat(fuenf, 'partner-15'), null);
  eq('zwei Wochen in Folge: am Sonntag der zweiten', hat(fuenf, 'verabredung-2'), '2026-08-16');
  eq('vier Wochen in Folge: am Sonntag der vierten', hat(fuenf, 'verabredung-4'), '2026-08-30');
  eq('acht noch nicht', hat(fuenf, 'verabredung-8'), null);
  const luecke = ['2026-08-03', '2026-08-10', '2026-08-24', '2026-08-31'];
  eq('mit Wochenluecke keine Serie von vier',
    hat(M.aufnaeher(logs(luecke), config, [], HEUTE, { zusammen: luecke.map(d => v(d)) }), 'verabredung-4'), null);
  const zweiAmTag = M.aufnaeher(logs(['2026-08-03']), config, [], HEUTE,
    { zusammen: [v('2026-08-03'), v('2026-08-03', { id: 'zyxwvuts77', mit: 'Anna' })] });
  eq('zwei Verabredungen am selben Tag zaehlen einmal', hat(zweiAmTag, 'partner-5'), null);
  const neu = M.neueAufnaeher([], logs(['2026-08-03']), config, [], HEUTE, { zusammen: [v('2026-08-03')] });
  ok('das Duett ist nach der Einheit neu', neu.some(a => a.id === 'duett'));
}

print('\n--- Kettlebell: Kurs und Mosh Pit ---');
{
  const kl = (n, extra = i => ({})) => Array.from({ length: n }, (_, i) => ({ date: new Date(Date.UTC(2026, 7, 1 + i)).toISOString().slice(0, 10),
    type: 'kurs', kurs: 'kettlebell', woche: Math.floor(i / 3) + 1, tag: 'ABC'[i % 3], finished: new Date(Date.UTC(2026, 7, 1 + i, 10)).toISOString(), ...extra(i) }));
  const KG = ['kurs-start', 'kurs-fundament', 'kurs-grundlage', 'kurs-ausbau', 'check-1', 'check-2', 'check-3', 'kugel-1', 'kugel-5', 'pit-start', 'pit-sprung', 'pit-serie-3', 'pit-serie-6'];
  const gibt = a => a.filter(x => KG.includes(x.id)).length;
  eq('ohne Kurs und Pit: keiner dieser Aufnaeher', gibt(M.aufnaeher([], config, [], HEUTE)), 0);
  eq('mit Kurs: neun, ohne Pit', gibt(M.aufnaeher(kl(1), config, [], HEUTE)), 9);
  eq('Katalog mit beiden: dreizehn', gibt(M.katalog(config, { mitKurs: true, mitPit: true })), 13);
  eq('Kurs-Debuet am ersten Tag', hat(M.aufnaeher(kl(1), config, [], HEUTE), 'kurs-start'), '2026-08-01');
  eq('Fundament nach zwoelf', hat(M.aufnaeher(kl(12), config, [], HEUTE), 'kurs-fundament'), '2026-08-12');
  eq('elf reichen nicht', hat(M.aufnaeher(kl(11), config, [], HEUTE), 'kurs-fundament'), null);
  eq('Ausbau nach 36', hat(M.aufnaeher(kl(36), config, [], HEUTE), 'kurs-ausbau'), '2026-09-05');
  eq('Check nur mit geschafft', hat(M.aufnaeher(kl(12, i => i === 11 ? { test: 'w4', geschafft: false } : {}), config, [], HEUTE), 'check-1'), null);
  eq('Check geschafft', hat(M.aufnaeher(kl(12, i => i === 11 ? { test: 'w4', geschafft: true } : {}), config, [], HEUTE), 'check-1'), '2026-08-12');
  eq('Check 3 gehoert zu Woche 12', hat(M.aufnaeher(kl(36, i => i === 35 ? { test: 'w12', geschafft: true } : {}), config, [], HEUTE), 'check-3'), '2026-09-05');
  const ks = [{ hinge: 12 }, { hinge: 12 }, { hinge: 14 }, { hinge: 10 }, { hinge: 14 }, { hinge: 16 }];
  const a = M.aufnaeher(kl(6, i => ({ kugeln: ks[i] })), config, [], HEUTE);
  eq('erste Erhoehung am dritten Tag', hat(a, 'kugel-1'), '2026-08-03');
  eq('zurueck und wieder hoch zaehlt nicht doppelt', hat(a, 'kugel-5'), null);
  const mo = (i, geschafft = true, kg = 12) => ({ date: `2026-09-${String(i + 1).padStart(2, '0')}`, type: 'moshpit', finished: `2026-09-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
    uebungen: [{ lift: 'swing2', kg, reps: 15, sets: 3, erledigt: geschafft ? 3 : 2, geschafft }] });
  eq('Mosh-Pit-Debuet', hat(M.aufnaeher([mo(0)], config, [], HEUTE), 'pit-start'), '2026-09-01');
  eq('Mosh Pit ohne Kurs: kein Kurs-Debuet', hat(M.aufnaeher([mo(0)], config, [], HEUTE), 'kurs-start'), null);
  eq('Kugelsprung', hat(M.aufnaeher([mo(0), mo(1, true, 16)], config, [], HEUTE), 'pit-sprung'), '2026-09-02');
  eq('gleiche Kugel: kein Sprung', hat(M.aufnaeher([mo(0), mo(1)], config, [], HEUTE), 'pit-sprung'), null);
  eq('Serie 3', hat(M.aufnaeher([mo(0), mo(1), mo(2)], config, [], HEUTE), 'pit-serie-3'), '2026-09-03');
  eq('Fehlversuch unterbricht die Serie', hat(M.aufnaeher([mo(0), mo(1, false), mo(2), mo(3)], config, [], HEUTE), 'pit-serie-3'), null);
  const neu = M.neueAufnaeher([], kl(1), config, [], HEUTE);
  ok('Kurs-Debuet ist nach der ersten Einheit neu', neu.some(x => x.id === 'kurs-start'));
}

print('\n--- Pixelbilder ---');
{
  const voll = M.katalog({ ...config, lifts: { ...config.lifts, squat: { ...config.lifts.squat, reference: 100 } } },
    { mitGewicht: true, mitRad: true, mitHoehe: true, mitPlan: true, mitZusammen: true, mitKurs: true, mitPit: true });
  const ohne = voll.filter(a => M.bildIndex(a) < 0).map(a => a.id);
  eq('jeder Aufnaeher hat ein Bild', ohne.join(), '');
  const indizes = voll.map(a => M.bildIndex(a));
  eq('keine zwei Aufnaeher teilen sich ein Bild', new Set(indizes).size, voll.length);
  ok('jede Stufe einer Leiter ein eigenes', M.bildIndex({ id: 'gigs-10' }) !== M.bildIndex({ id: 'gigs-25' })
    && M.bildIndex({ id: 'platten-squat-1' }) !== M.bildIndex({ id: 'platten-squat-2' })
    && M.bildIndex({ id: 'platten-squat-1' }) !== M.bildIndex({ id: 'platten-bench-1' }));
  eq('eigener Lift: neutrale Figur derselben Stufe', M.bildIndex({ id: 'platten-frontsquat-3' }), M.BILDER.indexOf('platten-figur-3'));
  eq('eigener Lift, Koerpergewicht: neutrale Figur', M.bildIndex({ id: 'koerper-frontsquat' }), M.BILDER.indexOf('koerper-figur'));
  eq('unbekannter Aufnaeher: kein Bild', M.bildIndex({ id: 'gibtsnicht' }), -1);
  eq('ohne Aufnaeher: kein Bild', M.bildIndex(null), -1);
  eq('keine ID doppelt im Bogen', new Set(M.BILDER).size, M.BILDER.length);
  eq('jeder Aufnaeher plus 5 neutrale Figuren', M.BILDER.length, voll.length + 5);
  const ids = new Set(voll.map(a => a.id));
  eq('kein Bild ohne Aufnaeher (ausser den Figuren)', M.BILDER.filter(b => !ids.has(b) && !/-figur/.test(b)).join(), '');
  eq('sieben Raenge, sieben Szenen', M.RAENGE.length, 7);
}

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
