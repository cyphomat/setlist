// Browserprobe · Startseite: Bühnenplakat, Instrumente, Ausnahmen, Woche und Gewichte in vier Lagen.
// Aufruf ueber tools/proben.mjs.

import { P, CONFIG, BILDER, verlauf, kontext, ueberlauf, kontraste } from './gemeinsam.mjs';

export default async function ({ browser, pruefe }) {
  const wellness = (schlafH, ctl, atl) => Array.from({ length: 60 }, (_, i) => {
    const d = new Date(2026, 7, 3 + i);
    return { id: P.ymd(d), weight: Math.round((92 - i * 0.05) * 10) / 10, ctl, atl, sleepSecs: Math.round(schlafH * 3600) };
  });
  const icu = (w, fahrten) => async ctx => {
    await ctx.addInitScript(() => { localStorage.setItem('setlist.icu.key', 'demo'); localStorage.setItem('setlist.icu.athlete', 'i1'); });
    await ctx.route('**/intervals.icu/**', r => {
      const u = new URL(r.request().url());
      const body = u.pathname.endsWith('wellness') ? w : u.pathname.endsWith('/activities') ? fahrten : [];
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
  };

  const lagen = [
    { name: 'normal', logs: verlauf('2026-09-28'), config: CONFIG, w: wellness(7.4, 40, 38),
      fahrten: [{ id: 'f1', type: 'VirtualRide', start_date_local: '2026-09-30T07:00:00', moving_time: 3600, distance: 30000, icu_training_load: 50, icu_intensity: 68 }] },
    { name: 'comeback', logs: verlauf('2026-09-14'),
      config: { ...CONFIG, injuries: [
        { id: 'finger', was: 'Finger links eingequetscht', art: 'wiederkehrend', status: 'aktiv', seit: '2026-09-20' },
        { id: 'schulter', was: 'Schulter rechts', art: 'strukturell', status: 'aktiv', behandlung: 'Kein Snatch.' }] },
      w: wellness(5.4, 40, 38), fahrten: [] },
    { name: 'ohne-icu', logs: verlauf('2026-09-28'), config: CONFIG, w: null },
    { name: 'unterwegs', logs: verlauf('2026-09-28'), w: wellness(7.4, 40, 38), fahrten: [],
      config: { ...CONFIG, lifts: { ...CONFIG.lifts, squat: { ...CONFIG.lifts.squat, reference: 200 }, deadlift: { ...CONFIG.lifts.deadlift, reference: 220 } } } }
  ];

  for (const L of lagen) {
    for (const theme of ['dunkel', 'hell']) {
      for (const [breite, schrift] of [[390, null], [360, 'sehr'], [1280, null]]) {
        const { ctx, p, fehler } = await kontext(browser, { logs: L.logs, config: L.config, heute: '2026-10-01',
          breite, hoehe: 1000, schrift, theme, vorher: L.w ? icu(L.w, L.fahrten) : null });
        await p.waitForTimeout(900);
        const tag = `${L.name}/${theme}/${breite}${schrift ? '/sehr' : ''}`;
        const hinweise = await p.$$eval('#today .hinweis b', l => l.map(x => x.textContent));
        const instr = await p.$$eval('#instrumente .instr', l => l.map(x => x.textContent.trim()));
        const wende = await p.$('#zitat .meilenstein');
        if (theme === 'dunkel' && breite === 390) {
          pruefe(`${tag}: Tageswort`, !!(await p.textContent('#today .tageswort')).trim(), await p.textContent('#today .tageswort'));
          if (L.name === 'normal') {
            pruefe(`${tag}: keine Ausnahmen`, hinweise.length === 0, hinweise.join(' | '));
            pruefe(`${tag}: Instrumente`, instr.length >= 3, instr.join(' | '));
            pruefe(`${tag}: kein Wendepunkt`, !wende);
          }
          if (L.name === 'comeback') {
            pruefe(`${tag}: Pause und Finger als Ausnahmen, Schlaf nur in der Ansage`, hinweise.length === 2
              && hinweise.some(h => h.includes('Finger')) && hinweise.some(h => h.includes('Pause')), hinweise.join(' | '));
            pruefe(`${tag}: Schulter nur als Instrument`, instr.some(x => x.includes('Schulter'))
              && !hinweise.some(h => h.includes('Schulter')), instr.join(' | '));
            await p.locator('#instrumente .instr').nth(0).click();
            await p.waitForTimeout(150);
            const eins = await p.$$eval('.instr-detail', l => l.length);
            const exp = await p.locator('#instrumente .instr').nth(0).getAttribute('aria-expanded');
            await p.locator('#instrumente .instr').nth(1).click();
            await p.waitForTimeout(150);
            const zwei = await p.$$eval('.instr-detail', l => l.length);
            const erstesZu = await p.locator('#instrumente .instr').nth(0).getAttribute('aria-expanded');
            pruefe(`${tag}: Detail klappt auf, nur eins offen`, eins === 1 && exp === 'true' && zwei === 1 && erstesZu === 'false');
            await p.screenshot({ path: BILDER + `home-comeback-offen.png`, fullPage: true });
            await p.locator('#instrumente .instr').nth(1).click();
            await p.waitForTimeout(150);
            pruefe(`${tag}: zweites Antippen schließt`, (await p.$$eval('.instr-detail', l => l.length)) === 0);
          }
          if (L.name === 'ohne-icu') {
            pruefe(`${tag}: keine Instrumente`, instr.length === 0, instr.join(' | '));
            pruefe(`${tag}: intervals.icu-Hinweis eine Zeile`, (await p.$$eval('#icu-status p', l => l.length)) === 1);
          }
          // Rechte Spalte
          const kopf = await p.$('#weights .reunion-kopf');
          const striche = await p.$$eval('#weights .gs', l => l.length);
          const serie = (await p.textContent('#amp')).replace(/\s+/g, ' ').trim();
          pruefe(`${tag}: Serie im Wochenkopf`, /Wochen am Stück|Woche am Stück|Serie/.test(serie), serie.slice(0, 90));
          pruefe(`${tag}: eine Gewichtszeile je Lift`, (await p.$$eval('#weights .gw', l => l.length)) === 5);
          if (L.name === 'unterwegs') {
            pruefe(`${tag}: Reunion-Kopf unter 100 %`, !!kopf, kopf ? (await kopf.textContent()).replace(/\s+/g, ' ').trim() : '');
            pruefe(`${tag}: Striche nur unter der Referenz`, striche === 2, String(striche));
          } else if (L.name === 'normal') {
            pruefe(`${tag}: ab 100 % kein Reunion-Kopf, keine Striche`, !kopf && striche === 0, String(striche));
            pruefe(`${tag}: intervals.icu ok: keine Statuszeile`, (await p.$$eval('#icu-status p', l => l.length)) === 0);
            const rad = p.locator('#week details.tag').first();
            pruefe(`${tag}: Radtag aufklappbar`, (await rad.count()) === 1);
            await rad.locator('summary').click();
            await p.waitForTimeout(150);
            pruefe(`${tag}: Warum steht unter der Zeile`, await rad.locator('.tag-info').isVisible());
          }
        }
        if (L.name === 'normal') {
          // Flightcase: Edding auf Gaffa muss lesbar bleiben, die Schriften kommen aus dem Repo
          const k = (await kontraste(p, '#view-home h2, #today .tageswort')).filter(x => x.wert < 4.5);
          pruefe(`${tag}: Gaffa und Tageswort Kontrast ≥ 4,5`, !k.length, JSON.stringify(k));
          const gr = await p.$$eval('#view-home h2', l => l.map(h => parseFloat(getComputedStyle(h).fontSize)));
          pruefe(`${tag}: Edding-Schrift ≥ 16 px`, gr.length >= 2 && gr.every(x => x >= 16), gr.join());
          const geladen = await p.evaluate(async () => { await document.fonts.ready;
            return [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')); });
          pruefe(`${tag}: Anton und Permanent Marker geladen`, geladen.includes('Anton') && geladen.includes('Permanent Marker'), geladen.join());
        }
        const u = await ueberlauf(p);
        pruefe(`${tag}: kein Überlauf`, !u.scroll, JSON.stringify(u));
        pruefe(`${tag}: keine Seitenfehler`, !fehler.length, fehler.join(' | '));
        await p.screenshot({ path: BILDER + `home-${L.name}-${theme}-${breite}${schrift ? '-sehr' : ''}.png`, fullPage: breite !== 1280 });
        await ctx.close();
      }
    }
  }
}
