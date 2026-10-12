// Browserprobe · Tour mit Reitern und Backstage: Panels, Tastatur, gemerkter Reiter, Speichern.
// Aufruf ueber tools/proben.mjs.

import { CONFIG, BILDER, verlauf, kontext, ueberlauf } from './gemeinsam.mjs';

export default async function ({ browser, pruefe }) {
  const sichtbar = p => p.$$eval('#view-history .reiter-panel', l => l.filter(x => !x.hidden).map(x => x.id));
  const logs = verlauf('2026-09-28');

  {
    const { ctx, p, fehler, geschrieben } = await kontext(browser, { logs, config: { ...CONFIG,
      injuries: [{ id: 'finger', was: 'Finger', art: 'wiederkehrend', status: 'aktiv', seit: '2026-09-20' }] }, heute: '2026-10-01' });
    await p.click('#go-history');
    await p.waitForSelector('#hist-kalender .zelle');
    pruefe('Tour öffnet auf Überblick', (await sichtbar(p)).join() === 'tour-ueberblick', (await sichtbar(p)).join());
    pruefe('Überblick: Kalender und Merch-Link', !!(await p.$('#tour-ueberblick #hist-kalender .zelle')) && !!(await p.$('#tour-ueberblick #hist-merch')));
    for (const [r, sel] of [['kraft', '#hist-prs .pr'], ['koerper', '#hist-koerper'], ['rad', '#hist-rad'], ['einheiten', '#history-body .hist']]) {
      await p.click(`#tour-tab-${r}`);
      await p.waitForTimeout(120);
      const s = await sichtbar(p);
      pruefe(`Reiter ${r}: genau sein Panel`, s.join() === `tour-${r}`, s.join());
      pruefe(`Reiter ${r}: Inhalt da`, !!(await p.$(`#tour-${r} ${sel}`)), sel);
      pruefe(`Reiter ${r}: aria-selected`, (await p.getAttribute(`#tour-tab-${r}`, 'aria-selected')) === 'true');
    }
    await p.focus('#tour-tab-einheiten');
    await p.keyboard.press('ArrowRight');
    pruefe('Pfeil rechts springt von Einheiten auf Überblick', (await sichtbar(p)).join() === 'tour-ueberblick');
    await p.keyboard.press('ArrowLeft');
    pruefe('Pfeil links zurück auf Einheiten', (await sichtbar(p)).join() === 'tour-einheiten');
    await p.click('#tour-tab-kraft');
    // Merch hin und zurueck
    await p.click('#tour-tab-ueberblick');
    await p.click('#hist-merch');
    await p.waitForSelector('#merch-kutte .patch');
    await p.click('#merch-back');
    pruefe('Merch zurück in die Tour', !(await p.isHidden('#view-history')));
    await p.click('#tour-tab-kraft');
    // Backstage
    await p.click('#go-backstage');
    pruefe('⚙ öffnet Backstage auf Persönlich', !(await p.isHidden('#view-backstage')) && !(await p.isHidden('#bs-persoenlich')));
    pruefe('Persönlich: Bestleistungen, Injury, Prüfwerte', !!(await p.$('#bs-persoenlich #pers-rekorde')) && !!(await p.$('#bs-persoenlich #pers-verletzungen .inj')) && !!(await p.$('#bs-persoenlich #pers-checks')));
    await p.click('#bs-tab-orte');
    pruefe('Orte: Liste', !!(await p.$('#bs-orte #gym-liste details')));
    await p.click('#bs-tab-verbindungen');
    pruefe('Verbindungen: Status', !!(await p.$('#bs-verbindungen #conn-box .conn')));
    await p.click('#bs-tab-app');
    await p.click('#bs-app [data-thema="hell"]');
    pruefe('App: Thema hell wirkt', (await p.getAttribute('html', 'data-theme')) === 'light');
    await p.click('#bs-app [data-thema="dunkel"]');
    await p.screenshot({ path: BILDER + 'bs-app.png', fullPage: true });
    await p.click('#bs-back');
    pruefe('‹ führt in die Tour, Reiter Kraft gemerkt', !(await p.isHidden('#view-history')) && (await sichtbar(p)).join() === 'tour-kraft');
    await p.click('#hist-back');
    await p.click('#go-history');
    await p.waitForTimeout(400);
    pruefe('erneut geöffnet: Reiter gemerkt', (await sichtbar(p)).join() === 'tour-kraft');
    // Injury speichern ueber den Backstage
    await p.click('#go-backstage');
    await p.click('#bs-tab-persoenlich');
    await p.selectOption('#pers-verletzungen .inj .inj-status', 'ruhend');
    await p.click('#pers-speichern');
    await p.waitForTimeout(1500);
    const conf = [...geschrieben].reverse().find(g => g.path === 'config.json');
    pruefe('Speichern im Backstage schreibt config.json', conf && conf.data.injuries[0].bis === '2026-10-01');
    pruefe('keine Seitenfehler', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  for (const theme of ['dunkel', 'hell']) {
    for (const [breite, schrift] of [[390, null], [360, 'sehr'], [1280, null]]) {
      const { ctx, p, fehler } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01', breite, hoehe: 900, schrift, theme });
      await p.click('#go-history');
      await p.waitForSelector('#hist-kalender .zelle');
      const tag = `${theme}/${breite}${schrift ? '/sehr' : ''}`;
      for (const r of ['ueberblick', 'kraft', 'koerper', 'rad', 'einheiten']) {
        await p.click(`#tour-tab-${r}`);
        await p.waitForTimeout(150);
        const u = await ueberlauf(p);
        if (u.scroll) pruefe(`${tag} Tour/${r}: kein Überlauf`, false, JSON.stringify(u));
      }
      await p.click('#tour-tab-ueberblick');
      await p.evaluate(() => window.scrollTo(0, 600));
      await p.waitForTimeout(150);
      const klebt = await p.evaluate(() => {
        const k = document.querySelector('#view-history .head').getBoundingClientRect();
        const l = document.querySelector('#tour-reiter').getBoundingClientRect();
        return k.top <= 1 && Math.abs(l.bottom - k.bottom) <= 1;
      });
      pruefe(`${tag}: Kopf mit Reiterleiste klebt oben`, klebt);
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.screenshot({ path: BILDER + `tour-${theme}-${breite}${schrift ? '-sehr' : ''}.png` });
      await p.click('#go-backstage');
      for (const r of ['persoenlich', 'orte', 'verbindungen', 'app']) {
        await p.click(`#bs-tab-${r}`);
        await p.waitForTimeout(150);
        const u = await ueberlauf(p);
        if (u.scroll) pruefe(`${tag} Backstage/${r}: kein Überlauf`, false, JSON.stringify(u));
      }
      await p.click('#bs-tab-persoenlich');
      await p.screenshot({ path: BILDER + `bs-${theme}-${breite}${schrift ? '-sehr' : ''}.png` });
      pruefe(`${tag}: kein Überlauf, keine Seitenfehler`, !fehler.length, fehler.join(' | '));
      await ctx.close();
    }
  }
}
