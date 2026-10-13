// Browserprobe · Über Setlist: Autor, Issues, Lizenz und Quelltext im Backstage
// und als Fußzeile im Setup — Links, Fork, Kontrast, Breiten, Englisch.
// Aufruf ueber tools/proben.mjs.

import { CONFIG, BILDER, verlauf, kontext, ueberlauf, kontraste } from './gemeinsam.mjs';

const ORIGINAL = 'https://github.com/cyphomat/setlist';
const ISSUES = `${ORIGINAL}/issues`;
const AUTOR = 'https://github.com/cyphomat';

/** Jeder Link: neuer Tab, ohne Opener und ohne Referrer. */
const linkPruefung = (p, sel) => p.$$eval(`${sel} a`, l => l.map(a => ({
  href: a.href, text: a.textContent.trim(), target: a.target,
  rel: (a.getAttribute('rel') || '').split(/\s+/)
})));
const sauber = l => l.target === '_blank' && l.rel.includes('noopener') && l.rel.includes('noreferrer');

export default async function ({ browser, pruefe }) {
  const logs = verlauf('2026-09-28');
  const fremdeHosts = new Set();
  const merke = ctx => ctx.on('request', r => {
    const h = new URL(r.url()).hostname;
    if (!['localhost', 'jens.github.io', 'api.github.com', 'intervals.icu'].includes(h)) fremdeHosts.add(h);
  });

  /* 1 · Backstage → App, in allen Breiten und Themen */
  for (const [breite, schrift, theme] of [[320, null, 'dunkel'], [320, 'sehr', 'hell'], [390, null, 'dunkel'], [390, null, 'hell'], [1280, null, 'dunkel']]) {
    const tag = `${breite}${schrift ? '/sehr' : ''}/${theme}`;
    const { ctx, p, fehler } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01', breite, schrift, theme, vorher: async c => merke(c) });
    await p.click('#go-history');
    await p.click('#go-backstage');
    await p.click('#bs-tab-app');
    await p.waitForSelector('#ueber-box a');
    const links = await linkPruefung(p, '#ueber-box');
    const hrefs = links.map(l => l.href);
    pruefe(`${tag}: vier Links`, links.length === 4, links.map(l => l.text).join(' | '));
    pruefe(`${tag}: alle in neuem Tab, ohne Opener/Referrer`, links.every(sauber), JSON.stringify(links.filter(l => !sauber(l))));
    pruefe(`${tag}: Autor, Issues, Lizenz, Quelltext`, hrefs[0] === AUTOR && hrefs[1] === ISSUES
      && hrefs[2] === `${ORIGINAL}/blob/main/LICENSE` && hrefs[3] === ORIGINAL, hrefs.join(' '));
    const text = (await p.textContent('#ueber-box')).replace(/\s+/g, ' ');
    pruefe(`${tag}: Inhalt`, /Gebaut von @cyphomat/.test(text) && /MIT-Lizenz/.test(text) && /ausdrücklich erwünscht/.test(text) && /Ohne Gewähr/.test(text), text.slice(0, 120));
    const k = await kontraste(p, '#ueber-box p, #ueber-box a');
    const schwach = k.filter(x => x.wert < 4.5);
    pruefe(`${tag}: Kontrast ≥ 4,5:1`, !schwach.length, JSON.stringify(schwach.length ? schwach : k.slice(0, 2)));
    const u = await ueberlauf(p);
    pruefe(`${tag}: kein Querlauf`, !u.scroll && !u.raus.length, JSON.stringify(u));
    await p.locator('#ueber-box').scrollIntoViewIfNeeded();
    await p.screenshot({ path: BILDER + `ueber-${breite}${schrift ? '-sehr' : ''}-${theme}.png`, fullPage: breite !== 1280 });
    pruefe(`keine Seitenfehler (${tag})`, !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 2 · Fußzeile auf dem Einrichtungsbildschirm */
  for (const [breite, theme] of [[320, 'dunkel'], [390, 'hell'], [1280, 'dunkel']]) {
    const { ctx, p, fehler } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01', breite, theme, ohneToken: true, vorher: async c => merke(c) });
    const links = await linkPruefung(p, '#setup-fuss');
    pruefe(`Setup ${breite}/${theme}: Autor, Lizenz, Issues`, links.length === 3 && links[0].href === AUTOR
      && links[1].href === `${ORIGINAL}/blob/main/LICENSE` && links[2].href === ISSUES, links.map(l => l.href).join(' '));
    pruefe(`Setup ${breite}/${theme}: neue Tabs`, links.every(sauber));
    const k = await kontraste(p, '#setup-fuss, #setup-fuss a');
    pruefe(`Setup ${breite}/${theme}: Kontrast ≥ 4,5:1`, k.every(x => x.wert >= 4.5), JSON.stringify(k));
    const u = await ueberlauf(p);
    pruefe(`Setup ${breite}/${theme}: kein Querlauf`, !u.scroll && !u.raus.length, JSON.stringify(u));
    if (breite === 320) await p.locator('#setup-fuss').screenshot({ path: BILDER + `ueber-setup-${theme}.png` });
    pruefe(`keine Seitenfehler (Setup ${breite})`, !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 3 · Im Fork: Quelltext beim Fork, Feedback beim Original */
  {
    const { ctx, p, fehler } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01',
      adresse: 'http://jens.github.io/setlist/', vorher: async c => merke(c) });
    await p.click('#go-history');
    await p.click('#go-backstage');
    await p.click('#bs-tab-app');
    await p.waitForSelector('#ueber-box a');
    const hrefs = (await linkPruefung(p, '#ueber-box')).map(l => l.href);
    pruefe('Fork: Issues ans Original', hrefs[1] === ISSUES, hrefs[1]);
    pruefe('Fork: Lizenz im Fork', hrefs[2] === 'https://github.com/jens/setlist/blob/main/LICENSE', hrefs[2]);
    pruefe('Fork: Quelltext im Fork', hrefs[3] === 'https://github.com/jens/setlist', hrefs[3]);
    pruefe('Fork: als Fork beschriftet', /deines Forks/.test(await p.textContent('#ueber-box')));
    pruefe('keine Seitenfehler (Fork)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 4 · Englisch */
  {
    const { ctx, p, fehler } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01', breite: 320,
      vorher: async c => { merke(c); await c.addInitScript(() => localStorage.setItem('setlist.sprache', 'en')); } });
    await p.click('#go-history');
    await p.click('#go-backstage');
    await p.click('#bs-tab-app');
    await p.waitForSelector('#ueber-box a');
    const kopf = await p.$$eval('#bs-app h2', l => l.map(x => x.textContent.trim()));
    const text = (await p.textContent('#ueber-box')).replace(/\s+/g, ' ');
    pruefe('EN: Überschrift', kopf.includes('About Setlist'), kopf.join(' | '));
    pruefe('EN: ohne deutsche Reste', /Built by @cyphomat/.test(text) && /MIT License/.test(text) && /No warranty/.test(text) && !/[äöüß]/.test(text), text.slice(0, 160));
    const u = await ueberlauf(p);
    pruefe('EN 320: kein Querlauf', !u.scroll && !u.raus.length, JSON.stringify(u));
    pruefe('keine Seitenfehler (EN)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  pruefe('keine Anfrage an fremde Hosts (Links werden nicht geladen)', !fremdeHosts.size, [...fremdeHosts].join(', '));
}
