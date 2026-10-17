// Browserprobe · Lokal: ohne Konto starten, einrichten, trainieren, neu laden,
// sichern, alles löschen, Sicherung einlesen — und der Umzug vom Datenrepo
// aufs Gerät. Dabei geht keine Anfrage an GitHub.
// Aufruf ueber tools/proben.mjs.

import { readFileSync } from 'node:fs';
import { CONFIG, BILDER, verlauf, kontext, ueberlauf, kontraste } from './gemeinsam.mjs';

/** Was in der IndexedDB der App liegt: Pfade. */
const ablage = p => p.evaluate(() => new Promise(ok => {
  const req = indexedDB.open('setlist', 1);
  req.onupgradeneeded = () => req.result.createObjectStore('dateien');
  req.onsuccess = () => {
    const r = req.result.transaction('dateien', 'readonly').objectStore('dateien').getAllKeys();
    r.onsuccess = () => { ok(r.result.map(String).sort()); req.result.close(); };
  };
  req.onerror = () => ok(['FEHLER']);
}));

async function einheitDurch(p) {
  await p.click('#start');
  await p.waitForSelector('#view-session:not([hidden])');
  const n = await p.locator('#session-body .set').count();
  for (let i = 0; i < n; i++) {
    await p.locator('#session-body .set').nth(i).click();
    await p.evaluate(() => { const r = document.getElementById('rest'); if (r) r.hidden = true; });
  }
  await p.click('#finish');
  await p.waitForSelector('#view-done:not([hidden])');
  await p.waitForTimeout(600);
  await p.click('#done-ok');
  await p.waitForSelector('#view-home:not([hidden])');
}

const zurBackstage = async p => {
  await p.click('#go-history');
  await p.click('#go-backstage');
  await p.click('#bs-tab-app');
  await p.waitForTimeout(200);
};

export default async function ({ browser, pruefe }) {
  /* 1 · Setup: zwei Wege, lesbar, kein Querlauf */
  for (const [breite, schrift, theme] of [[320, 'sehr', 'hell'], [390, null, 'dunkel'], [1280, null, 'hell']]) {
    const tag = `${breite}${schrift ? '/sehr' : ''}/${theme}`;
    const { ctx, p, fehler } = await kontext(browser, { logs: [], config: CONFIG, heute: '2026-10-01', breite, schrift, theme, ohneToken: true });
    const knoepfe = await p.$$eval('#view-setup button', l => l.filter(b => b.offsetParent).map(b => b.id));
    pruefe(`${tag}: Lokal starten zuerst, GitHub eingeklappt`, knoepfe[0] === 'lokal-start' && !(await p.isVisible('#token')), knoepfe.join());
    const k = (await kontraste(p, '#view-setup .lead, #view-setup .fine, #view-setup summary, #view-setup .btn')).filter(x => x.wert < 4.5);
    pruefe(`${tag}: Kontrast ≥ 4,5`, !k.length, JSON.stringify(k));
    await p.screenshot({ path: BILDER + `lokal-setup-${breite}-${theme}.png`, fullPage: true });
    const u = await ueberlauf(p);
    pruefe(`${tag}: kein Querlauf`, !u.scroll && !u.raus.length, JSON.stringify(u));
    pruefe(`keine Seitenfehler (Setup ${tag})`, !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 2 · Lokal: einrichten, trainieren, neu laden, sichern, löschen, einlesen */
  {
    const github = [];
    const { ctx, p, fehler } = await kontext(browser, { logs: [], config: CONFIG, heute: '2026-10-01', ohneToken: true,
      vorher: async c => c.on('request', r => { if (new URL(r.url()).hostname === 'api.github.com') github.push(r.url()); }) });
    await p.click('#lokal-start');
    await p.waitForSelector('#view-einrichten:not([hidden])');
    pruefe('Lokal starten führt in den Einrichte-Assistenten', true);
    await p.click('#ein-anlegen');
    await p.waitForSelector('#today .name', { timeout: 8000 });
    pruefe('Programm angelegt, Home steht', (await p.evaluate(() => localStorage.getItem('setlist.modus'))) === 'lokal');
    pruefe('Programm liegt im Browser', (await ablage(p)).includes('config.json'), (await ablage(p)).join());
    await einheitDurch(p);
    const nachEinheit = await ablage(p);
    pruefe('Einheit und Zustand liegen im Browser', nachEinheit.some(x => x.startsWith('einheiten/2026-10-01')) && nachEinheit.includes('state.json'), nachEinheit.join());
    const vorher = (await p.textContent('#today .name')).trim();
    await p.reload();
    await p.waitForSelector('#today .name');
    await p.waitForTimeout(500);
    pruefe('nach dem Neuladen: derselbe Stand', (await p.textContent('#today .name')).trim() === vorher, vorher);
    await p.click('#go-history');
    await p.click('#tour-tab-einheiten');
    await p.waitForSelector('#history-body .hist');
    pruefe('Tour zeigt die Einheit', (await p.$$eval('#history-body .hist', l => l.length)) === 1);
    await p.click('#go-backstage');
    await p.click('#bs-tab-app');
    const daten = (await p.textContent('#daten-box')).replace(/\s+/g, ' ');
    pruefe('Daten: auf diesem Gerät, noch keine Sicherung', /auf diesem Gerät/.test(daten) && /Noch keine Sicherung/.test(daten), daten);
    pruefe('Daten: kein Umzug, Löschen heißt Löschen', await p.isHidden('#umzug') && (await p.textContent('#logout')).trim() === 'Alles löschen');
    await p.locator('#bs-app').screenshot({ path: BILDER + 'lokal-daten.png' });
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#sichern')]);
    const sicherung = JSON.parse(readFileSync(await dl.path(), 'utf8'));
    pruefe('Sicherung: Setlist-Format mit Programm und Einheit, ohne Zustand', sicherung.app === 'setlist' && sicherung.dateien['config.json']
      && Object.keys(sicherung.dateien).some(x => x.startsWith('einheiten/')) && !sicherung.dateien['state.json'], Object.keys(sicherung.dateien).join());
    pruefe('Dateiname mit Datum', dl.suggestedFilename() === 'setlist-sicherung-2026-10-01.json', dl.suggestedFilename());
    await p.waitForTimeout(300);
    pruefe('Letzte Sicherung vermerkt', /Letzte Sicherung/.test(await p.textContent('#daten-box')));
    p.once('dialog', d => { pruefe('Löschen fragt mit Zahl', /1 Einheiten/.test(d.message()), d.message()); d.accept(); });
    await p.click('#logout');
    await p.waitForSelector('#view-setup:not([hidden])');
    pruefe('gelöscht: zurück im Setup, Browser leer', !(await ablage(p)).length && !(await p.evaluate(() => localStorage.getItem('setlist.modus'))));
    await p.setInputFiles('#setup-einlesen', { name: 'sicherung.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(sicherung)) });
    await p.waitForSelector('#today .name', { timeout: 8000 });
    await p.waitForTimeout(500);
    pruefe('eingelesen: Home mit demselben Stand', (await p.textContent('#today .name')).trim() === vorher, await p.textContent('#today .name'));
    const zurueck = await ablage(p);
    pruefe('eingelesen: Programm, Einheit, Zustand neu berechnet', zurueck.includes('config.json') && zurueck.includes('state.json') && zurueck.some(x => x.startsWith('einheiten/')), zurueck.join());
    // Dieselbe Sicherung noch einmal: nichts Neues
    await zurBackstage(p);
    await p.setInputFiles('#einlesen', { name: 'sicherung.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(sicherung)) });
    await p.waitForTimeout(600);
    pruefe('zweites Einlesen: nichts Neues, nichts doppelt', /Nichts Neues/.test(await p.textContent('#banner')) && (await ablage(p)).filter(x => x.startsWith('einheiten/')).length === 1);
    await p.setInputFiles('#einlesen', { name: 'quatsch.json', mimeType: 'application/json', buffer: Buffer.from('{"app":"riffforge"}') });
    await p.waitForTimeout(300);
    pruefe('fremde Datei wird abgelehnt', /keine Setlist-Sicherung/.test(await p.textContent('#banner')));
    pruefe('lokal: keine einzige Anfrage an GitHub', !github.length, github.slice(0, 3).join(' | '));
    pruefe('keine Seitenfehler (lokal)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 3 · Umzug vom Datenrepo aufs Gerät */
  {
    const logs = verlauf('2026-09-28');
    const { ctx, p, fehler } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01' });
    await zurBackstage(p);
    pruefe('GitHub-Modus: Umzug angeboten', await p.isVisible('#umzug'));
    const daten = (await p.textContent('#daten-box')).replace(/\s+/g, ' ');
    pruefe('GitHub-Modus: Repo genannt', /setlist-data/.test(daten), daten);
    p.once('dialog', d => d.accept());
    await p.click('#umzug');
    await p.waitForEvent('load', { timeout: 15000 });
    await p.waitForSelector('#today .name', { timeout: 15000 });
    await p.waitForTimeout(500);
    // Den Token setzt die Probe bei jedem Laden neu; am Repo-Ziel sieht man, dass GitHub getrennt ist.
    const nachher = await p.evaluate(() => ({ modus: localStorage.getItem('setlist.modus'), owner: localStorage.getItem('setlist.owner') }));
    pruefe('umgezogen: lokal, GitHub getrennt', nachher.modus === 'lokal' && !nachher.owner, JSON.stringify(nachher));
    const da = await ablage(p);
    pruefe('alle Einheiten auf dem Gerät', da.filter(x => x.startsWith('einheiten/')).length === logs.length && da.includes('config.json') && da.includes('state.json'),
      `${da.filter(x => x.startsWith('einheiten/')).length} von ${logs.length}`);
    pruefe('keine Seitenfehler (Umzug)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 4 · Englisch */
  {
    const { ctx, p } = await kontext(browser, { logs: [], config: CONFIG, heute: '2026-10-01', ohneToken: true, breite: 360, schrift: 'sehr',
      vorher: c => c.addInitScript(() => localStorage.setItem('setlist.sprache', 'en')) });
    const text = (await p.textContent('#view-setup')).replace(/\s+/g, ' ');
    pruefe('EN: Setup', /Start locally/.test(text) && /Restore a backup/.test(text) && /Or: with your own GitHub data repo/.test(text), text.slice(0, 200));
    const u = await ueberlauf(p);
    pruefe('EN 360/sehr: kein Querlauf', !u.scroll && !u.raus.length, JSON.stringify(u));
    await ctx.close();
  }
}
