// Browserprobe · Songbook: Gruppen, Übung des Tages, Notiz, Filter, Suche und Mobility.
// Aufruf ueber tools/proben.mjs.

import { CONFIG, BILDER, verlauf, kontext, ueberlauf } from './gemeinsam.mjs';

export default async function ({ browser, pruefe }) {
  const logs = verlauf('2026-09-28');
  // Zwei Mobility-Tage in der laufenden Woche (Mo 28.09., Di 29.09.)
  for (const d of ['2026-09-28', '2026-09-29']) logs.push({ date: d, type: 'mobility', uebung: 'couch', finished: `${d}T07:00:00.000Z` });
  const NAME = 'bib';
  for (const [theme, breite, schrift] of [['dunkel', 390, null], ['hell', 390, null], ['dunkel', 360, 'sehr'], ['dunkel', 1280, null]]) {
    const { ctx, p, fehler, geschrieben } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01', breite, hoehe: 900, schrift, theme });
    await p.click('#go-bibliothek');
    await p.waitForTimeout(400);
    if (theme === 'dunkel' && breite === 390) {
      const gruppen = await p.$$eval('#bib-liste .bib-gruppe h2', l => l.map(x => x.textContent.trim()));
      pruefe('fünf Gruppen in fester Reihenfolge', gruppen.length === 5 && gruppen[0].startsWith('Kraft'), gruppen.join(' | '));
      pruefe('Übung des Tages ohne offenes Formular', !!(await p.$('#bib-random .bib-tag')) && !(await p.$('#bib-random textarea')));
      const name = (await p.textContent('#bib-random .bt-kopf .name')).trim();
      await p.click('#bib-tag-auf');
      await p.waitForTimeout(500);
      const offen = await p.$$eval('#bib-liste details.uebung[open] .u-name', l => l.map(x => x.textContent.trim()));
      pruefe('Ansehen klappt die Übung in der Liste auf', offen.includes(name), offen.join() + ' / ' + name);
      pruefe('Formular erst auf Wunsch', await p.locator('#bib-liste details.uebung[open] .bib-form').first().isHidden());
      await p.locator('#bib-liste details.uebung[open] .bib-notiz-auf').first().click();
      pruefe('Notiz-Knopf öffnet das Formular', await p.locator('#bib-liste details.uebung[open] .bib-form').first().isVisible());
      await p.locator('#bib-liste details.uebung[open] .bib-notiz').first().fill('Ellbogen hoch halten');
      await p.locator('#bib-liste details.uebung[open] .bib-speichern').first().click();
      await p.waitForTimeout(1200);
      const notiz = await p.$$eval('#bib-liste details.uebung[open] .bib-notiz-text p', l => l.map(x => x.textContent));
      pruefe('gespeicherte Notiz steht als Text da, Übung bleibt offen', notiz.includes('Ellbogen hoch halten'), notiz.join());
      const neu = geschrieben.find(g => g.path === 'bibliothek.json');
      pruefe('bibliothek.json geschrieben', !!neu);
      await p.click('#bib-kategorien [data-k="Mobility"]');
      const nurMob = await p.$$eval('#bib-liste .bib-gruppe', l => l.length);
      pruefe('Filter Mobility: eine Gruppe, keine Tageskarte', nurMob === 1 && !(await p.$('#bib-random .bib-tag')));
      const vorher = (await p.textContent('#bib-liste .mob-woche')).trim();
      pruefe('Zähler: zwei Tage in dieser Woche', /2× Mobility/.test(vorher), vorher);
      // Zwei Tage Mobility in dieser Woche stehen schon da, heute macht drei: Gelenkig
      await p.locator('#bib-liste details.uebung').first().locator('summary').click();
      await p.locator('#bib-liste details.uebung[open] .bib-mobility').click();
      await p.waitForTimeout(1200);
      const mlog = geschrieben.find(g => /^einheiten\/2026-10-01-mobility/.test(g.path));
      pruefe('Heute gemacht: eigener Mobility-Log', mlog && mlog.data.type === 'mobility' && mlog.data.uebung && !/:/.test(mlog.data.uebung), JSON.stringify(mlog && mlog.data));
      pruefe('kein Zustand geschrieben', !geschrieben.some(g => g.path === 'state.json'));
      const woche = (await p.textContent('#bib-liste .mob-woche').catch(() => '')).trim();
      pruefe('Zähler der Woche', /3× Mobility/.test(woche), woche);
      const ans = (await p.textContent('#ansager').catch(() => '')).replace(/\s+/g, ' ');
      pruefe('Ansager: Gelenkig', /Gelenkig/.test(ans), ans);
      const knopf = p.locator('#bib-liste details.uebung').nth(1);
      await knopf.locator('summary').click();
      pruefe('zweite Übung: schon erledigt', await knopf.locator('.bib-mobility').isDisabled());
      await p.locator('#bib-liste .bib-gruppe').screenshot({ path: BILDER + 'bib-mobility.png' });
      await p.click('#bib-kategorien [data-k="Alle"]');
      await p.fill('#bib-suche', 'Lockout');
      await p.dispatchEvent('#bib-suche', 'input');
      await p.waitForTimeout(200);
      const such = await p.$$eval('#bib-liste .uebung .u-name', l => l.map(x => x.textContent));
      pruefe('Suche findet über das Problem', such.some(n => /Press/.test(n)), such.join(' | '));
      await p.fill('#bib-suche', '');
      await p.dispatchEvent('#bib-suche', 'input');
      await p.evaluate(() => window.scrollTo(0, 0));
    }
    const tag = `${theme}/${breite}${schrift ? '/sehr' : ''}`;
    await p.screenshot({ path: BILDER + `${NAME}-${theme}-${breite}${schrift ? '-sehr' : ''}.png`, fullPage: true });
    const u = await ueberlauf(p);
    pruefe(`${tag}: kein Überlauf`, !u.scroll, JSON.stringify(u));
    pruefe(`${tag}: keine Seitenfehler`, !fehler.length, fehler.join(' | '));
    await ctx.close();
  }
}
