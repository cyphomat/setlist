// Browserprobe · Songbook: Gruppen, Übung des Tages, Notiz, Filter und Suche.
// Aufruf ueber tools/proben.mjs.

import { CONFIG, BILDER, verlauf, kontext, ueberlauf } from './gemeinsam.mjs';

export default async function ({ browser, pruefe }) {
  const logs = verlauf('2026-09-28');
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
