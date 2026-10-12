// Browserprobe · Merch-Stand: Einheit bis zum Aufnäher, Serienpause bei Verletzung, Rad, große Schrift.
// Aufruf ueber tools/proben.mjs.

import { P, CONFIG, BILDER, verlauf, kontext, ueberlauf } from './gemeinsam.mjs';

export default async function ({ browser, pruefe }) {
  /* 1 · Home, Einheit, Zettel, neuer Aufnaeher */
  {
    // Neun Jams an eigenen Tagen: die heutige Einheit ist dann der 50. Gig.
    const dienstag = i => P.ymd(new Date(2026, 5, 2 + 7 * i));
    const logs = verlauf('2026-09-28').concat(Array.from({ length: 9 }, (_, i) =>
      ({ date: dienstag(i), type: 'wod', label: 'Jam', finished: `${dienstag(i)}T09:00:00.000Z` })));
    const { ctx, p, fehler, geschrieben } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01' });
    const plan = await p.textContent('#today');
    pruefe('Home: bei 100 % kein Reunion-Kopf mehr', !(await p.$('#weights .reunion-kopf')));
    const amp = await p.textContent('#amp');
    pruefe('Verstaerker: eine von zwei Einheiten', /1 von 2/.test(amp), amp.replace(/\s+/g, ' ').trim());
    await p.screenshot({ path: BILDER + 'p1-home.png', fullPage: true });
    pruefe('Home kein Ueberlauf', !(await ueberlauf(p)).scroll, JSON.stringify(await ueberlauf(p)));

    // Einheit: alle Saetze antippen, Zugabe abhaken
    await p.click('#start');
    await p.waitForSelector('#view-session:not([hidden])');
    const pause = await p.$('#pause-dialog[open]');
    if (pause) await p.click('#pause-nein');
    const n = await p.locator('#session-body .set').count();
    for (let i = 0; i < n; i++) {
      await p.locator('#session-body .set').nth(i).click();
      await p.evaluate(() => { const r = document.getElementById('rest'); if (r) r.hidden = true; });
    }
    await p.click('#finisher summary');
    await p.check('#zugabe-gespielt');
    await p.click('#finish');
    await p.waitForSelector('#view-done:not([hidden])');
    await p.waitForSelector('#done-aufnaeher .patch', { timeout: 6000 }).catch(() => {});
    await p.waitForTimeout(500);
    const zettel = await p.textContent('.zettel');
    pruefe('Zettel mit Ort und Zugabe', zettel.includes('Crossfit Box') && zettel.includes('Zugabe'), zettel.replace(/\s+/g, ' ').trim());
    const gestrichen = await p.$$eval('.zettel li.gespielt', l => l.length);
    pruefe('alle Lifts plus Zugabe gestrichen', gestrichen === 4, String(gestrichen));
    const neu = await p.$$eval('#done-aufnaeher .patch b', l => l.map(x => x.textContent));
    pruefe('neuer Aufnaeher erscheint: 50 Gigs', neu.join() === '50 Gigs', neu.join(' | '));
    const log = geschrieben.find(g => g.path.startsWith('einheiten/2026-10-01'));
    pruefe('Log traegt zugabe und ort', log && log.data.zugabe && log.data.ort === 'Crossfit Box', JSON.stringify(log && { z: log.data.zugabe, o: log.data.ort }));
    await p.screenshot({ path: BILDER + 'p1-done.png', fullPage: true });
    pruefe('Done kein Ueberlauf', !(await ueberlauf(p)).scroll, JSON.stringify(await ueberlauf(p)));

    // zurueck: Verstaerker auf 11
    await p.click('#done-ok');
    await p.waitForSelector('#view-home:not([hidden])');
    await p.waitForTimeout(300);
    const amp2 = await p.textContent('#amp');
    pruefe('Verstaerker nach der zweiten sauberen Einheit: 11', amp2.includes('11') && amp2.includes('elf'), amp2.replace(/\s+/g, ' ').trim());

    // Merch
    await p.click('#go-merch');
    await p.waitForSelector('#merch-kutte .patch');
    await p.waitForTimeout(500);
    const rang = await p.textContent('#merch-rang');
    pruefe('Rang sichtbar', /Vorband|Proberaum|Support/.test(rang), rang.replace(/\s+/g, ' ').trim());
    pruefe('ohne intervals.icu kein Rad-Abschnitt', !(await p.$('#merch-kutte .patch.k-rad')));
    const offenJeGruppe = await p.$$eval('#merch-kutte .patch.offen b', l => l.map(x => x.textContent));
    pruefe('Umrisse: je Leiter nur einer', offenJeGruppe.filter(x => x.startsWith('Back Squat')).length === 1, offenJeGruppe.join(' | '));
    const platten = await p.textContent('#merch-platten');
    pruefe('Schallplatten mit Stand', /t bewegt/.test(platten), platten.replace(/\s+/g, ' ').trim().slice(0, 160));
    const shirts = await p.$$eval('#merch-shirts details', l => l.length);
    pruefe('Tourshirts: Q2, Q3, Q4', shirts === 3, String(shirts));
    const rueck = await p.textContent('#merch-shirts details[open] .termine');
    pruefe('laufende Tour mit heutigem Gig', rueck.includes('01.10'), rueck.replace(/\s+/g, ' ').trim());
    const bilanz = await p.textContent('#merch-bilanz');
    pruefe('Tour-Bilanz 2026', bilanz.includes('Tour-Bilanz 2026'), '');
    await p.screenshot({ path: BILDER + 'p1-merch.png', fullPage: true });
    pruefe('Merch kein Ueberlauf', !(await ueberlauf(p)).scroll, JSON.stringify(await ueberlauf(p)));
    await p.click('#merch-back');
    await p.waitForSelector('#view-home:not([hidden])');
    pruefe('keine Seitenfehler (1)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 2 · Verletzung: Serie pausiert, Kalender schraffiert, Ende gestempelt */
  {
    const logs = verlauf('2026-09-17');
    const config = { ...CONFIG, injuries: [{ id: 'finger', was: 'Finger links eingequetscht', art: 'wiederkehrend', status: 'aktiv', seit: '2026-09-20' }] };
    const { ctx, p, fehler, geschrieben } = await kontext(browser, { logs, config, heute: '2026-10-01' });
    const prog = await p.textContent('#amp');
    pruefe('Serie steht still statt zu reissen', /verschoben, nicht abgesagt: Finger links/.test(prog), prog.replace(/\s+/g, ' ').trim());
    await p.screenshot({ path: BILDER + 'p2-home.png', fullPage: true });
    await p.click('#go-history');
    await p.waitForSelector('#hist-kalender .zelle');
    const pausen = await p.$$eval('#hist-kalender .zelle.pause', l => l.length);
    pruefe('Kalender: Pausentage schraffiert', pausen >= 10, String(pausen));
    const angeben = await p.textContent('#hist-angeben');
    pruefe('Rekordserie zaehlt die Pausenwochen nicht', /Längste Serie\s*16/.test(angeben.replace(/\s+/g, ' ')), angeben.replace(/\s+/g, ' ').trim());
    // Status auf ruhend, speichern — der Injury Report steht jetzt im Backstage
    await p.click('#go-backstage');
    await p.click('#bs-tab-persoenlich');
    await p.waitForSelector('#pers-verletzungen .inj');
    const sel = await p.$('.inj .inj-status');
    await sel.selectOption('ruhend');
    await p.waitForTimeout(200);
    pruefe('Bis-Feld erscheint', !!(await p.$('.inj .inj-bis')));
    await p.click('#pers-speichern');
    await p.waitForTimeout(1500);
    const conf = [...geschrieben].reverse().find(g => g.path === 'config.json');
    pruefe('Ende auf heute gestempelt', conf && conf.data.injuries[0].bis === '2026-10-01', JSON.stringify(conf && conf.data.injuries));
    await p.screenshot({ path: BILDER + 'p2-tour.png', fullPage: false });
    pruefe('keine Seitenfehler (2)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 4 · Rad: Fahrten seit Juni, eine reine Radwoche */
  {
    // Kraft bis 31.08., dann zwei Wochen nur Rad, dann wieder Kraft.
    const logs = verlauf('2026-09-28').filter(l => !(l.type === 'strength' && l.date >= '2026-09-01' && l.date < '2026-09-14'));
    const fahrten = [];
    for (let i = 0; i < 36; i++) {
      const d = new Date(2026, 5, 2 + i * 3.5);               // Di und Fr/Sa
      const tag = P.ymd(d);
      if (tag > '2026-09-30') break;
      fahrten.push({ id: 'a' + i, type: i % 5 === 0 ? 'Ride' : 'VirtualRide', start_date_local: `${tag}T07:00:00`,
        moving_time: 3600 + (i % 4) * 900, distance: (i === 20 ? 104000 : 30000 + i * 500),
        total_elevation_gain: 350, icu_training_load: 55, icu_intensity: 68, trainer: i % 5 !== 0 });
    }
    const { ctx, p, fehler, icuAufrufe } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01', fahrten });
    await p.waitForTimeout(800);
    const homeSerie = (await p.textContent('#amp')).match(/(\d+) Wochen am Stück/);
    pruefe('Home: die Radwochen halten die Serie', homeSerie && +homeSerie[1] >= 17, homeSerie && homeSerie[0]);
    await p.click('#go-merch');
    await p.waitForSelector('#merch-kutte .patch');
    await p.waitForTimeout(1200);
    const voll = icuAufrufe.filter(a => a.includes('/activities') && a.includes('oldest=2026-06-01'));
    pruefe('Fahrten ab der ersten Einheit geladen', voll.length === 1, icuAufrufe.filter(a => a.includes('activities')).join(' | '));
    const cache = await p.evaluate(() => (JSON.parse(localStorage.getItem('setlist.cache') || '{}').merchFahrten || []).length);
    pruefe('schlank zwischengespeichert', cache === fahrten.length, `${cache} von ${fahrten.length}`);
    const rad = await p.$$eval('#merch-kutte .patch.k-rad b', l => l.map(x => x.textContent));
    pruefe('Kutte: Abschnitt Rad', rad.length >= 4, rad.join(' | '));
    const radVerdient = await p.$$eval('#merch-kutte .patch.k-rad:not(.offen) b', l => l.map(x => x.textContent));
    pruefe('Highway Star, Stairway, Crossover verdient', ['Highway Star', 'Stairway to Heaven'].every(n => radVerdient.includes(n)) && radVerdient.some(n => n.startsWith('Crossover')), radVerdient.join(' | '));
    const shirt = await p.textContent('#merch-shirts details[open]');
    pruefe('Tourshirt: Rad auf dem Rücken, km im Kopf', shirt.includes('Rad') && / km/.test(shirt), shirt.replace(/\s+/g, ' ').trim().slice(0, 200));
    const bil = await p.textContent('#merch-bilanz');
    pruefe('Bilanz mit Kilometern', bil.includes('Kilometer'), '');
    const rang = await p.textContent('#merch-rang');
    pruefe('Rang zählt Radwochen', /1[7-9] Wochen auf Tour/.test(rang), rang.replace(/\s+/g, ' ').trim().slice(0, 60));
    await p.screenshot({ path: BILDER + 'p4-merch.png', fullPage: true });
    pruefe('Merch mit Rad kein Überlauf', !(await ueberlauf(p)).scroll, JSON.stringify(await ueberlauf(p)));
    pruefe('keine Seitenfehler (Rad)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 3 · Sehr gross, schmal, beide Themen */
  for (const theme of ['dunkel', 'hell']) {
    const logs = verlauf('2026-09-28');
    const { ctx, p, fehler } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01', breite: 360, schrift: 'sehr', theme });
    const kopf = await p.evaluate(() => {
      const h = document.querySelector('#view-home header').getBoundingClientRect();
      return [...document.querySelectorAll('#view-home header > *')].filter(e => !e.hidden)
        .every(e => e.getBoundingClientRect().right <= h.right + 1);
    });
    pruefe(`Kopfzeile passt (${theme}, sehr gross, 360)`, kopf);
    pruefe(`Home kein Ueberlauf (${theme})`, !(await ueberlauf(p)).scroll, JSON.stringify(await ueberlauf(p)));
    await p.screenshot({ path: BILDER + `p3-home-${theme}.png` });
    await p.click('#go-merch');
    await p.waitForSelector('#merch-kutte .patch');
    await p.waitForTimeout(400);
    pruefe(`Merch kein Ueberlauf (${theme}, sehr gross)`, !(await ueberlauf(p)).scroll, JSON.stringify(await ueberlauf(p)));
    await p.screenshot({ path: BILDER + `p3-merch-${theme}.png`, fullPage: true });
    pruefe(`keine Seitenfehler (${theme})`, !fehler.length, fehler.join(' | '));
    await ctx.close();
  }
}
