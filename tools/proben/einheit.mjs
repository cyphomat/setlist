// Browserprobe · Einheit: Bildschirm bleibt wach, Plateau-Ausstieg nach 5×5, Aftershow, Mobility.
// Aufruf ueber tools/proben.mjs.

import { P, CONFIG, BILDER, verlauf, kontext, ueberlauf } from './gemeinsam.mjs';

/** Bis Mitte Juli sauber, dann zweimal am selben Gewicht im Strict Press gescheitert. */
function festgefahren() {
  const logs = verlauf('2026-07-12');
  let s = P.deriveState(CONFIG, logs);
  const hoch = s.lifts.ohp.weight;
  const tage = [];
  for (let d = new Date(2026, 6, 13); P.ymd(d) < '2026-10-01'; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 1 || d.getDay() === 4) tage.push(P.ymd(d));
  }
  let fehl = 0, runde = 0;
  for (const tag of tage) {
    if (runde >= 2) break;
    const plan = P.planWorkout(s, CONFIG, s.next);
    const log = { date: tag, workout: plan.workout, type: 'strength',
      started: `${tag}T17:00:00.000Z`, finished: `${tag}T18:00:00.000Z`,
      lifts: plan.lifts.map(l => {
        const scheitert = l.lift === 'ohp' && l.weight >= hoch;
        return { lift: l.lift, weight: l.weight, sets: l.sets, target: l.reps,
          reps: scheitert ? [5, 5, 4, 3, 3] : Array(l.sets).fill(l.reps), success: !scheitert };
      }) };
    if (log.lifts.some(e => e.lift === 'ohp' && !e.success) && ++fehl % 3 === 0) runde++;
    logs.push(log);
    s = P.applyLog(s, CONFIG, log);
  }
  // Heute soll B dran sein, damit der Strict Press in der Einheit steht.
  if (s.next !== 'B') {
    const plan = P.planWorkout(s, CONFIG, 'A');
    const log = { date: '2026-09-30', workout: 'A', type: 'strength', finished: '2026-09-30T18:00:00.000Z',
      lifts: plan.lifts.map(l => ({ lift: l.lift, weight: l.weight, sets: l.sets, target: l.reps, reps: Array(l.sets).fill(l.reps), success: true })) };
    logs.push(log);
    s = P.applyLog(s, CONFIG, log);
  }
  return { logs, s };
}

// Wake Lock zum Mitzaehlen: Chromium ohne Anzeige lehnt die echte ab.
const wachAttrappe = ctx => ctx.addInitScript(() => {
  window.__wach = { an: 0, aus: 0 };
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => {
    window.__wach.an++;
    const fertig = [];
    return { addEventListener: (e, f) => e === 'release' && fertig.push(f),
      release: async () => { window.__wach.aus++; fertig.forEach(f => f()); } };
  } } });
});

export default async function ({ browser, pruefe }) {
  const { logs, s } = festgefahren();
  pruefe('Ausgangslage: zwei Deloads im Strict Press', s.lifts.ohp.deloads === 2, JSON.stringify(s.lifts.ohp));
  pruefe('Ausgangslage: heute B', s.next === 'B', s.next);
  // Saetze je Uebung der Einheit B: Squat, Press, Deadlift
  const ohpSaetze = p => p.$$eval('#session-body .lift', l => l.map(e => e.querySelectorAll('.set').length));

  /* 1 · Wach, Hinweis, Dialog, "Noch nicht" */
  {
    const { ctx, p, fehler } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01', vorher: wachAttrappe });
    const wach = () => p.evaluate(() => window.__wach);
    const hinweis = await p.$$eval('#today .hinweis b', l => l.map(x => x.textContent).join(' | '));
    pruefe('Home: Strict Press steckt fest', /Strict Press steckt fest/.test(hinweis) && /3×5/.test(hinweis), hinweis);
    pruefe('Home: noch keine Wachsperre', (await wach()).an === 0);
    await p.click('#start');
    await p.waitForSelector('#schema-dialog[open]');
    const text = (await p.textContent('#schema-dialog')).replace(/\s+/g, ' ');
    pruefe('Dialog: 5×5 → 3×5 für den Press', /Strict Press\s*5×5 → 3×5/.test(text), text.slice(0, 200));
    pruefe('Dialog: nennt zwei Deloads', /2 Deloads/.test(text));
    await p.screenshot({ path: BILDER + 'einheit-schema-dialog.png' });
    const u = await ueberlauf(p);
    pruefe('Dialog: kein Überlauf', !u.scroll, JSON.stringify(u));
    await p.click('#schema-nein');
    await p.waitForSelector('#view-session:not([hidden])');
    await p.waitForTimeout(200);
    const saetze = await ohpSaetze(p);
    pruefe('Noch nicht: Press bleibt bei 5 Sätzen', saetze.join() === '5,5,1', saetze.join());
    const w = await wach();
    pruefe('Einheit: Bildschirm bleibt an', w.an === 1 && w.aus === 0, JSON.stringify(w));
    p.on('dialog', d => d.accept());
    await p.evaluate(() => document.getElementById('abort').click());
    await p.waitForSelector('#view-home:not([hidden])');
    await p.waitForTimeout(200);
    const w2 = await wach();
    pruefe('Abgebrochen: Bildschirm darf wieder aus', w2.aus === 1, JSON.stringify(w2));
    const hinweis2 = await p.$$eval('#today .hinweis b', l => l.map(x => x.textContent).join(' | '));
    pruefe('abgelehnt: Hinweis weg', !/steckt fest/.test(hinweis2), hinweis2);
    await p.click('#start');
    await p.waitForSelector('#view-session:not([hidden])');
    pruefe('abgelehnt: kein zweiter Dialog', !(await p.$('#schema-dialog[open]')));
    pruefe('keine Seitenfehler (1)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 2 · Wechseln, Gewichte, Tour, zurück */
  {
    const { ctx, p, fehler, geschrieben } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01', vorher: wachAttrappe });
    p.on('dialog', d => d.accept());
    await p.click('#start');
    await p.waitForSelector('#schema-dialog[open]');
    await p.click('#schema-ja');
    await p.waitForSelector('#view-session:not([hidden])');
    await p.waitForTimeout(1200);
    const saetze = await ohpSaetze(p);
    pruefe('Wechseln: Press mit 3 Sätzen', saetze.join() === '5,3,1', saetze.join());
    const knoepfe = await p.$$eval('#session-body .lift:nth-child(2) .set', l => l.map(x => x.textContent).join());
    pruefe('3×5: fünf Wiederholungen je Satz', knoepfe === '5,5,5', knoepfe);
    const anp = geschrieben.find(g => g.path.startsWith('einheiten/') && g.data.grund === 'schema');
    pruefe('Anpassung geschrieben', anp && anp.data.schema.ohp === 1, JSON.stringify(anp && anp.data));
    // Einheit durchspielen und speichern
    const n = await p.locator('#session-body .set').count();
    for (let i = 0; i < n; i++) {
      await p.locator('#session-body .set').nth(i).click();
      await p.evaluate(() => { const r = document.getElementById('rest'); if (r) r.hidden = true; });
    }
    await p.click('#finish');
    await p.waitForSelector('#view-done:not([hidden])');
    const w = await p.evaluate(() => window.__wach);
    pruefe('Fertig: Bildschirm darf wieder aus', w.an === 1 && w.aus === 1, JSON.stringify(w));
    const einheit = [...geschrieben].reverse().find(g => g.path.startsWith('einheiten/') && g.data.workout && g.data.date === '2026-10-01');
    const ohp = einheit && einheit.data.lifts.find(e => e.lift === 'ohp');
    pruefe('Log: Press 3 Sätze, Ziel 5', ohp && ohp.sets === 3 && ohp.target === 5 && ohp.success, JSON.stringify(ohp));
    await p.click('#done-ok');
    await p.waitForSelector('#view-home:not([hidden])');
    const gw = await p.$$eval('#weights .gw .gn', l => l.map(x => x.textContent.trim()));
    await p.locator('#weights').screenshot({ path: BILDER + 'einheit-schema-gewichte.png' });
    pruefe('Gewichte: Press mit 3×5', gw.some(x => /Strict Press\s*3×5/.test(x)) && gw.filter(x => /×/.test(x)).length === 1, gw.join(' | '));
    await p.click('#go-history');
    await p.click('#tour-tab-kraft');
    await p.waitForSelector('#hist-plateaus .schema-zurueck');
    const zeile = (await p.textContent('#hist-plateaus')).replace(/\s+/g, ' ');
    pruefe('Tour: Stufe mit Rückweg', /3×5 statt 5×5/.test(zeile) && /Zurück auf 5×5/.test(zeile), zeile.slice(0, 160));
    await p.locator('#hist-plateaus').screenshot({ path: BILDER + 'einheit-schema-tour.png' });
    await p.click('#tour-tab-einheiten');
    const hist = (await p.textContent('#history-body')).replace(/\s+/g, ' ');
    pruefe('Historie: Satzschema', /SATZSCHEMA/.test(hist) && /Strict Press 3×5/.test(hist), '');
    await p.click('#tour-tab-kraft');
    await p.click('#hist-plateaus .schema-zurueck');
    await p.waitForTimeout(1200);
    const zur = [...geschrieben].reverse().find(g => g.data.grund === 'schema');
    pruefe('Zurück: Anpassung auf 0', zur && zur.data.schema.ohp === 0, JSON.stringify(zur && zur.data.schema));
    pruefe('Zurück: Rückweg-Knopf weg', !(await p.$('#hist-plateaus .schema-zurueck')));
    await p.click('#hist-back');
    const gw2 = await p.$$eval('#weights .gw .gn', l => l.map(x => x.textContent.trim()));
    pruefe('Gewichte: wieder ohne Stufe', !gw2.some(x => /×/.test(x)), gw2.join(' | '));
    pruefe('keine Seitenfehler (2)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 3 · Aftershow: Hilfsuebungen erfassen, speichern, wiederfinden */
  for (const [breite, schrift, theme] of [[390, null, 'dunkel'], [360, 'sehr', 'hell']]) {
    const tag = `${breite}${schrift ? '/sehr' : ''}/${theme}`;
    const alt = verlauf('2026-09-28');
    const letzte = alt.filter(l => l.type === 'strength').pop();
    letzte.hilfs = [{ id: 'pullup', reps: [8, 7] }];
    const { ctx, p, fehler, geschrieben } = await kontext(browser, { logs: alt, config: CONFIG, heute: '2026-10-01', breite, schrift, theme });
    p.on('dialog', d => d.accept());
    await p.click('#start');
    await p.waitForSelector('#view-session:not([hidden])');
    await p.click('#hilfs summary');
    await p.click('#hilfs .hilfs-wahl [data-h="pullup"]');
    const letzt = await p.textContent('#hilfs .hz-letzt');
    pruefe(`${tag}: letztes Mal 8 · 7`, /8 · 7/.test(letzt), letzt);
    const satz = async n => {
      await p.click('#hilfs .hz-plus');
      await p.waitForSelector('#picker[open]');
      await p.click(`#picker-opts button[data-n="${n}"]`);
      await p.evaluate(() => { const r = document.getElementById('rest'); if (r) r.hidden = true; });
    };
    await p.click('#hilfs .hz-plus');
    await p.waitForSelector('#picker[open]');
    const ziel = await p.$eval('#picker-opts .ziel', b => b.textContent).catch(() => '');
    pruefe(`${tag}: Picker hebt den ersten Satz vom letzten Mal hervor`, ziel === '8', ziel);
    await p.click('#picker-opts button[data-n="10"]');
    await p.evaluate(() => { const r = document.getElementById('rest'); if (r) r.hidden = true; });
    await satz(9);
    await p.click('#hilfs .hilfs-zeile .set.done[data-i="1"]');
    await satz(7);
    await p.click('#hilfs .hilfs-wahl [data-h="dip"]');
    await p.click('#hilfs .hilfs-zeile[data-h="dip"] .hz-plus');
    await p.waitForSelector('#picker[open]');
    await p.click('#picker-opts button[data-n="12"]');
    await p.evaluate(() => { const r = document.getElementById('rest'); if (r) r.hidden = true; });
    const saetze = await p.$$eval('#hilfs .hilfs-zeile', l => l.map(z => z.dataset.h + ':' + [...z.querySelectorAll('.set.done')].map(b => b.textContent).join('/')));
    pruefe(`${tag}: erfasst, ein Satz wieder entfernt`, saetze.join(' ') === 'pullup:10/7 dip:12', saetze.join(' '));
    // leere Uebung an- und wieder abwaehlen
    await p.click('#hilfs .hilfs-wahl [data-h="curl"]');
    await p.click('#hilfs .hilfs-wahl [data-h="curl"]');
    pruefe(`${tag}: leere Übung ohne Rückfrage wieder weg`, !(await p.$('#hilfs .hilfs-zeile[data-h="curl"]')));
    if (breite === 360) {
      await p.locator('#hilfs').screenshot({ path: BILDER + 'einheit-aftershow.png' });
      const u = await ueberlauf(p);
      pruefe(`${tag}: Einheit kein Überlauf`, !u.scroll, JSON.stringify(u));
    }
    const n = await p.locator('#session-body .set').count();
    for (let i = 0; i < n; i++) {
      await p.locator('#session-body .set').nth(i).click();
      await p.evaluate(() => { const r = document.getElementById('rest'); if (r) r.hidden = true; });
    }
    await p.click('#finish');
    await p.waitForSelector('#view-done:not([hidden])');
    await p.waitForSelector('#done-aufnaeher .patch', { timeout: 6000 }).catch(() => {});
    await p.waitForTimeout(400);
    const log = [...geschrieben].reverse().find(g => g.path.startsWith('einheiten/') && g.data.date === '2026-10-01' && g.data.workout);
    pruefe(`${tag}: Log trägt die Hilfsübungen`, log && JSON.stringify(log.data.hilfs) === JSON.stringify([{ id: 'pullup', reps: [10, 7] }, { id: 'dip', reps: [12] }]),
      JSON.stringify(log && log.data.hilfs));
    const zettel = (await p.textContent('.zettel')).replace(/\s+/g, ' ');
    pruefe(`${tag}: Zettel mit Aftershow`, /Klimmzüge Aftershow · 10 · 7/.test(zettel) && /Dips Aftershow · 12/.test(zettel), zettel);
    const neu = await p.$$eval('#done-aufnaeher .patch b', l => l.map(x => x.textContent));
    pruefe(`${tag}: zehn Klimmzüge am Stück: Hangar 18`, neu.includes('Hangar 18'), neu.join(' | '));
    if (breite === 360) {
      await p.locator('.zettel').screenshot({ path: BILDER + 'einheit-aftershow-zettel.png' });
      const u = await ueberlauf(p);
      pruefe(`${tag}: Geschafft kein Überlauf`, !u.scroll, JSON.stringify(u));
    }
    await p.click('#done-ok');
    await p.click('#go-history');
    await p.click('#tour-tab-kraft');
    await p.waitForSelector('#hist-hilfs .reihe');
    const bil = (await p.textContent('#hist-hilfs')).replace(/\s+/g, ' ');
    pruefe(`${tag}: Tour: Aftershow-Bilanz`, /Klimmzüge\s*10/.test(bil) && /in 2 Einheiten/.test(bil) && /Dips/.test(bil), bil.slice(0, 200));
    await p.click('#tour-tab-einheiten');
    const hist = (await p.textContent('#history-body')).replace(/\s+/g, ' ');
    pruefe(`${tag}: Historie nennt die Hilfsübungen`, /Klimmzüge \(10\/7\)/.test(hist), '');
    pruefe(`keine Seitenfehler (Aftershow ${tag})`, !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 3b · Mobility in der Einheit abhaken */
  {
    const alt = verlauf('2026-09-25');   // in dieser Woche noch nichts: Mobility ist dran
    const { ctx, p, fehler, geschrieben } = await kontext(browser, { logs: alt, config: CONFIG, heute: '2026-10-01', breite: 360, schrift: 'sehr' });
    p.on('dialog', d => d.accept());
    await p.click('#start');
    await p.waitForSelector('#view-session:not([hidden])');
    const mob = p.locator('#warmup details', { has: p.locator('#mobility-gemacht') });
    pruefe('Mobility-Block mit Häkchen', await mob.count() === 1);
    await mob.locator('summary').click();
    await p.check('#mobility-gemacht');
    await mob.screenshot({ path: BILDER + 'einheit-mobility.png' });
    const n = await p.locator('#session-body .set').count();
    for (let i = 0; i < n; i++) {
      await p.locator('#session-body .set').nth(i).click();
      await p.evaluate(() => { const r = document.getElementById('rest'); if (r) r.hidden = true; });
    }
    await p.click('#finish');
    await p.waitForSelector('#view-done:not([hidden])');
    await p.waitForTimeout(600);
    const log = [...geschrieben].reverse().find(g => g.path.startsWith('einheiten/') && g.data.date === '2026-10-01' && g.data.workout);
    pruefe('Log trägt die Mobility', log && typeof log.data.mobility === 'string' && log.data.mobility.length > 0, JSON.stringify(log && log.data.mobility));
    const zettel = (await p.textContent('.zettel')).replace(/\s+/g, ' ');
    pruefe('Zettel: Mobility gemacht', /Mobility gemacht/.test(zettel), zettel);
    const u = await ueberlauf(p);
    pruefe('Mobility: kein Überlauf', !u.scroll, JSON.stringify(u));
    await p.click('#done-ok');
    await p.click('#go-history');
    await p.click('#tour-tab-einheiten');
    await p.waitForSelector('#history-body .hist');
    const hist = (await p.textContent('#history-body')).replace(/\s+/g, ' ');
    pruefe('Historie: Einheit mit Mobility', /MOBILITY/.test(hist), hist.slice(0, 160));
    pruefe('keine Seitenfehler (Mobility)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 4 · Englisch, schmal, sehr groß, beide Themen */
  for (const theme of ['dunkel', 'hell']) {
    const { ctx, p, fehler } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01', breite: 360, schrift: 'sehr', theme,
      vorher: async c => { await wachAttrappe(c); await c.addInitScript(() => localStorage.setItem('setlist.sprache', 'en')); } });
    const hinweis = await p.$$eval('#today .hinweis b', l => l.map(x => x.textContent).join(' | '));
    pruefe(`EN (${theme}): Home-Hinweis`, /Strict Press is stuck/.test(hinweis), hinweis);
    await p.click('#start');
    await p.waitForSelector('#schema-dialog[open]');
    const text = (await p.textContent('#schema-dialog')).replace(/\s+/g, ' ');
    pruefe(`EN (${theme}): Dialog`, /Beyond 5×5/i.test(text) && /is stuck/.test(text) && /Switch/.test(text) && !/[äöüß]/.test(text), text.slice(0, 160));
    await p.screenshot({ path: BILDER + `einheit-schema-en-${theme}.png` });
    const u = await ueberlauf(p);
    pruefe(`EN (${theme}): kein Überlauf`, !u.scroll, JSON.stringify(u));
    pruefe(`keine Seitenfehler (EN ${theme})`, !fehler.length, fehler.join(' | '));
    await ctx.close();
  }
}
