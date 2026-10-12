// Browserprobe · Sicherheit: eigener Text bleibt Text, Abmelden räumt auf, keine fremden Rahmen.
// Aufruf ueber tools/proben.mjs.

import { CONFIG, VERSION, basis, verlauf, kontext } from './gemeinsam.mjs';

export default async function ({ browser, pruefe }) {
  const logs = verlauf('2026-09-28');
  const BOESE = '<img src=x onerror="window.__xss=1">';

  /* 1 · Eigener Text bleibt Text */
  {
    const config = { ...CONFIG,
      lifts: { ...CONFIG.lifts, ohp: { ...CONFIG.lifts.ohp, name: '<b>Press</b>' } },
      records: { quelle: BOESE, programm: { squat: { datum: '2021-03-04', bestesEinzel: 140, bestes5er: 120 } }, weitere: [{ name: 'Snatch', wert: 80, datum: '2019-05-01' }] },
      injuries: [{ id: 'finger', was: `Finger ${BOESE}`, art: 'wiederkehrend', status: 'aktiv', seit: '2026-09-25', behandlung: `Tapen ${BOESE}` }] };
    const { ctx, p, fehler } = await kontext(browser, { logs, config, heute: '2026-10-01' });
    const xss = () => p.evaluate(() => window.__xss === 1);
    pruefe('Home: kein Code ausgeführt', !(await xss()));
    pruefe('Home: Verletzungsname als Text', (await p.textContent('#today')).includes('<img src=x'));
    await p.click('#start');
    await p.waitForSelector('#view-session:not([hidden])');
    if (await p.$('#pause-dialog[open]')) await p.click('#pause-nein');
    await p.waitForTimeout(300);
    const warm = await p.textContent('#warmup');
    pruefe('Aufwärmliste: Behandlung als Text', warm.includes(`Tapen ${BOESE}`), warm.replace(/\s+/g, ' ').slice(0, 120));
    pruefe('Aufwärmliste: kein <img> im DOM', !(await p.$('#warmup img')));
    const warum = await p.$$eval('#session-body details.info summary', l => l.map(x => x.textContent));
    pruefe('„Warum …“: Liftname als Text', warum.some(x => x.includes('<b>Press</b>')), warum.join(' | ').slice(0, 160));
    pruefe('„Warum …“: kein <b> aus dem Namen', !(await p.$('#session-body details.info summary b')));
    await p.click('#abort').catch(() => {});
    p.on('dialog', d => d.accept());
    await p.evaluate(() => document.getElementById('abort').click());
    await p.click('#go-history');
    await p.click('#tour-tab-kraft');
    await p.waitForFunction(() => /Snatch/.test(document.getElementById('hist-prs').textContent), null, { timeout: 8000 }).catch(() => {});
    pruefe('Bestwerte-Quelle als Text', (await p.textContent('#hist-prs')).includes('<img src=x'));
    await p.click('#go-backstage');
    await p.waitForTimeout(300);
    pruefe('nirgends Code ausgeführt', !(await xss()));
    pruefe('keine Seitenfehler (1)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 2 · Abmelden räumt auf und warnt vor ungesendeten Einheiten */
  {
    const { ctx, p, fehler } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01' });
    await p.click('#go-history');
    await p.waitForTimeout(500);
    await p.evaluate(() => {
      localStorage.setItem('setlist.queue', JSON.stringify([{ date: '2026-10-01', type: 'wod' }, { date: '2026-10-01', type: 'unplugged' }]));
      localStorage.setItem('setlist.schrift', 'gross');
    });
    let frage = '';
    p.once('dialog', d => { frage = d.message(); d.accept(); });
    await p.click('#go-backstage');
    await p.click('#bs-tab-app');
    // Das Testgeruest setzt den Token bei jedem Laden neu — deshalb die
    // Schluessel im Moment des Neuladens festhalten, nicht danach.
    await p.evaluate(() => addEventListener('beforeunload', () =>
      sessionStorage.setItem('probe.keys', JSON.stringify(Object.keys(localStorage)))));
    await Promise.all([p.waitForEvent('load'), p.click('#logout')]);
    pruefe('Rückfrage nennt ungesendete Einheiten', /2 Einheiten sind noch nicht gespeichert/.test(frage), frage.replace(/\n/g, ' '));
    const keys = await p.evaluate(() => JSON.parse(sessionStorage.getItem('probe.keys') || '[]').filter(k => k.startsWith('setlist.')).sort());
    pruefe('danach nur Einstellungen im Speicher', keys.every(k => ['setlist.theme', 'setlist.schrift', 'setlist.sprache', 'setlist.version', 'setlist.up.leise', 'setlist.up.minuten'].includes(k)), keys.join(', '));
    pruefe('Schriftgröße blieb erhalten', keys.includes('setlist.schrift'));
    await ctx.close();
  }

  /* 3 · Nicht in fremden Seiten */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
    await ctx.addInitScript(v => { localStorage.setItem('setlist.token', 'demo'); localStorage.setItem('setlist.version', v); }, VERSION);
    let apiAufrufe = 0;
    await ctx.route('**/api.github.com/**', r => { apiAufrufe++; return r.fulfill({ status: 404, body: '' }); });
    await ctx.route(u => u.hostname === 'fremd.example', r => r.fulfill({ status: 200, contentType: 'text/html',
      body: `<html><body><iframe id="f" src="http://app.example/index.html" style="width:390px;height:600px"></iframe></body></html>` }));
    // Die App unter einer zweiten Adresse — localhost darf eine fremde Seite nicht einbetten.
    await ctx.route(u => u.hostname === 'app.example', async r => {
      const pfad = new URL(r.request().url()).pathname;
      const res = await fetch(`${basis()}${pfad}`);
      const typ = pfad.endsWith('.js') ? 'text/javascript' : pfad.endsWith('.css') ? 'text/css'
        : pfad.endsWith('.json') ? 'application/json' : pfad.endsWith('.woff2') ? 'font/woff2' : 'text/html';
      return r.fulfill({ status: res.status, contentType: typ, body: Buffer.from(await res.arrayBuffer()) });
    });
    const p = await ctx.newPage();
    await p.goto('http://fremd.example/', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2500);
    const f = p.frames().find(x => x.url().startsWith('http://app.example'));
    const text = f ? await f.evaluate(() => document.body.innerText) : '';
    pruefe('fremde Seite: Hinweis statt App', /nicht eingebettet/.test(text), text.slice(0, 80));
    pruefe('fremde Seite: kein Aufruf an GitHub', apiAufrufe === 0, String(apiAufrufe));
    pruefe('fremde Seite: Link öffnet oben', f && (await f.getAttribute('a', 'target')) === '_top');
    await ctx.close();

    // Gleiche Herkunft (tools/shot.html) bleibt erlaubt
    const c2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await c2.route(/^https:\/\/(api\.github\.com|intervals\.icu)\//, r => r.abort());
    const p2 = await c2.newPage();
    await p2.goto(`${basis()}/tools/shot.html?szene=home&thema=dunkel`);
    await p2.waitForTimeout(6000);
    const f2 = p2.frames()[1];
    pruefe('eigener Rahmen (shot.html) zeigt die App', !!(await f2.$('#today .tageswort')));
    await c2.close();
  }
}
