// Browserprobe · Englischer Modus: keine deutschen Reste, englische Fehler, Deutsch unverändert.
// Aufruf ueber tools/proben.mjs.

import { CONFIG, VERSION, BILDER, basis, verlauf, kontext } from './gemeinsam.mjs';

export default async function ({ browser, pruefe }) {
  const DEUTSCH = /\b(Tage|Einheit|Einheiten|Sätze|Sätzen|geschafft|Rechnung|Jahren|gefahren|Heute|heute|nicht|weg|Stunden|Woche|Wochen|bewegt|Schlaf|Zuletzt|Gestern)\b|[äöüß]/;
  const englisch = ctx => ctx.addInitScript(() => localStorage.setItem('setlist.sprache', 'en'));
  const sprech = (name, text) => pruefe(`${name}: englisch`, !!text.trim() && !DEUTSCH.test(text), text.replace(/\s+/g, ' ').trim().slice(0, 140));

  // Logs mit Ansage und Gefuehl, damit "Ansage gegen Gefuehl" etwas zeigt
  const logs = verlauf('2026-09-28').map((l, i) => l.type === 'strength'
    ? { ...l, angesagt: ['SOLIDE', 'HART', 'TECHNIK', 'SCHWER'][i % 4], gefuehlt: ['normal', 'hart', 'leicht', 'extrem'][i % 4] } : l);

  /* 1 · Comeback mit Verletzung: Plakat, Einheit, Geschafft-Screen, Tour */
  {
    const config = { ...CONFIG, injuries: [{ id: 'finger', was: 'Finger', art: 'wiederkehrend', status: 'aktiv', seit: '2026-09-25' }] };
    const { ctx, p, fehler } = await kontext(browser, { logs: logs.filter(l => l.date <= '2026-09-14'), config, heute: '2026-10-01', vorher: englisch });
    await p.waitForTimeout(500);
    sprech('Plakat-Kopf', await p.textContent('#today > .kicker'));
    sprech('Tageswort', await p.textContent('#today .tageswort'));
    sprech('Tagessatz', await p.textContent('#today .tagessatz'));
    const hinweise = await p.$$eval('#today .hinweis', l => l.map(x => x.textContent).join(' | '));
    sprech('Ausnahmen (ohne Verletzungsname)', hinweise.replace(/Finger/g, ''));
    sprech('Wochenkopf', await p.textContent('#amp'));
    await p.screenshot({ path: BILDER + 'en-home.png', fullPage: true });
    // Einheit
    p.on('dialog', d => d.accept());
    await p.click('#start');
    if (await p.$('#pause-dialog[open]')) await p.click('#pause-nein');
    await p.waitForSelector('#view-session:not([hidden])');
    sprech('Ansage in der Einheit', await p.textContent('#session-intent .directive'));
    const n = await p.locator('#session-body .set').count();
    for (let i = 0; i < n; i++) {
      await p.locator('#session-body .set').nth(i).click();
      await p.evaluate(() => { const r = document.getElementById('rest'); if (r) r.hidden = true; });
    }
    await p.click('#finish');
    await p.waitForSelector('#view-done:not([hidden])');
    await p.waitForTimeout(600);
    sprech('Minierfolg (Kopf)', (await p.textContent('.erfolg-kopf .gross')).replace(/Back Squat|Strict Press|Deadlift|Bench Press|Barbell Row/g, ''));
    sprech('Minierfolge', (await p.textContent('.erfolge')).replace(/Back Squat|Strict Press|Deadlift|Bench Press|Barbell Row/g, ''));
    await p.screenshot({ path: BILDER + 'en-done.png', fullPage: true });
    await p.click('#done-ok');
    await p.click('#go-history');
    await p.click('#tour-tab-kraft');
    await p.waitForFunction(() => document.querySelector('#hist-ansage .tone'), null, { timeout: 8000 }).catch(() => {});
    const toene = await p.$$eval('#hist-ansage .tone', l => [...new Set(l.map(x => x.textContent.trim()))]);
    pruefe('Ansage gegen Gefühl: Tageswörter englisch', toene.length > 0 && toene.every(x => ['TECHNIQUE', 'SOLID', 'HARD', 'HEAVY'].includes(x)), toene.join(', '));
    pruefe('keine Seitenfehler (1)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 2 · Englischer Fehlerfall: Token abgelehnt */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
    await ctx.addInitScript(v => {
      localStorage.setItem('setlist.token', 'falsch'); localStorage.setItem('setlist.version', v);
      localStorage.setItem('setlist.sprache', 'en');
    }, VERSION);
    await ctx.route('**/api.github.com/**', r => r.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Bad credentials"}' }));
    const p = await ctx.newPage();
    await p.goto(`${basis()}/index.html`);
    await p.waitForTimeout(2500);
    const text = await p.evaluate(() => document.body.innerText);
    pruefe('Token-Fehler auf Englisch', /Token invalid, expired or without write access/.test(text), (text.match(/Token[^\n]*/) || [''])[0]);
    await ctx.close();
  }

  /* 3 · Deutsch unverändert */
  {
    const { ctx, p, fehler } = await kontext(browser, { logs: logs.filter(l => l.date <= '2026-09-14'), config: CONFIG, heute: '2026-10-01' });
    await p.waitForTimeout(500);
    pruefe('Deutsch: Kopf wie vorher', /17 Tage weg/i.test(await p.textContent('#today > .kicker')), await p.textContent('#today > .kicker'));
    pruefe('Deutsch: Tageswort TECHNIK', (await p.textContent('#today .tageswort')).trim() === 'TECHNIK');
    pruefe('keine Seitenfehler (3)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }
}
