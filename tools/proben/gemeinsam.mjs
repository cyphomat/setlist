// Gemeinsames Geruest der Browserproben (tools/proben.mjs).
//
// Die App laeuft echt im Chromium, nur die Aussenwelt ist gestellt: die
// GitHub-API antwortet aus Beispieldaten, intervals.icu auf Wunsch auch, und
// die Uhr steht auf einem festen Tag. So sind die Proben wiederholbar.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, sep, extname } from 'node:path';
import { tmpdir } from 'node:os';
import * as P from '../../js/program.js';

export { P };

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Die laufende Version mitgeben, sonst haelt die App sich fuer veraltet
// und laedt sich mitten in der Probe neu.
export const VERSION = JSON.parse(readFileSync(join(WURZEL, 'version.json'), 'utf8')).version;

// Bilder der Proben zum Nachsehen — bewusst ausserhalb des Repos.
export const BILDER = (process.env.PROBEN_BILDER || join(tmpdir(), 'setlist-proben')) + sep;

/* ---------- Server ---------- */

const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};

let BASIS = '';
/** Adresse des laufenden Servers, z. B. http://localhost:51234 */
export const basis = () => BASIS;

/** Liefert die Repo-Wurzel statisch aus, auf einem freien Port. */
export async function starteServer() {
  const server = createServer(async (req, res) => {
    const pfad = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const datei = join(WURZEL, pfad.endsWith('/') ? pfad + 'index.html' : pfad);
    if (req.method !== 'GET' || !datei.startsWith(WURZEL + sep)) { res.writeHead(404).end(); return; }
    try {
      const inhalt = await readFile(datei);
      res.writeHead(200, { 'Content-Type': TYPEN[extname(datei)] || 'application/octet-stream' }).end(inhalt);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok));
  BASIS = `http://localhost:${server.address().port}`;
  return server;
}

/** Chromium von Playwright; CHROMIUM=/pfad/zu/chrome nimmt einen eigenen. */
export const starteBrowser = () =>
  chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

/* ---------- Beispieldaten ---------- */

export const CONFIG = {
  version: 1, bar: 20, rounding: 2.5, motto: 'Lift Heavy Shit',
  plates: [25, 20, 15, 10, 5, 2.5, 1.25],
  deload: { afterFails: 3, factor: 0.9 },
  lifts: {
    squat:    { name: 'Back Squat',   increment: 2.5, start: 70,   reference: 110 },
    bench:    { name: 'Bench Press',  increment: 2.5, start: 50,   reference: 80 },
    row:      { name: 'Barbell Row',  increment: 2.5, start: 45,   reference: 70 },
    ohp:      { name: 'Strict Press', increment: 2.5, start: 32.5, reference: 50 },
    deadlift: { name: 'Deadlift',     increment: 5,   start: 90,   reference: 150 }
  },
  workouts: {
    A: [{ lift: 'squat', sets: 5, reps: 5 }, { lift: 'bench', sets: 5, reps: 5 }, { lift: 'row', sets: 5, reps: 5 }],
    B: [{ lift: 'squat', sets: 5, reps: 5 }, { lift: 'ohp', sets: 5, reps: 5 }, { lift: 'deadlift', sets: 1, reps: 5 }]
  },
  firstWorkout: 'A',
  rest: { normal: 90, afterFail: 180 },
  week: { slots: [{ day: 1, type: 'strength' }, { day: 2, type: 'ride' }, { day: 4, type: 'strength' }] },
  rides: [{ label: 'Grundlage Z2', detail: '90 Min ruhig' }],
  gyms: [{ id: 'box', name: 'Crossfit Box', geraete: ['langhantel', 'kettlebell', 'springseil', 'box'] }]
};

/** Zwei Krafteinheiten je Woche, jede Steigerung sauber, ab Juni; dazu Jam, Unplugged, Max-Out. */
export function verlauf(bis) {
  const logs = [];
  let s = P.initialState(CONFIG);
  const d = new Date('2026-06-01T12:00:00');
  while (P.ymd(d) <= bis) {
    for (const off of [0, 3]) {
      const tag = new Date(d); tag.setDate(d.getDate() + off);
      if (P.ymd(tag) > bis) break;
      const plan = P.planWorkout(s, CONFIG, s.next);
      const log = { date: P.ymd(tag), workout: plan.workout, type: 'strength',
        started: `${P.ymd(tag)}T17:00:00.000Z`, finished: `${P.ymd(tag)}T18:00:00.000Z`,
        lifts: plan.lifts.map(l => ({ lift: l.lift, weight: l.weight, sets: l.sets, target: l.reps,
          reps: Array(l.sets).fill(l.reps), success: true })) };
      if (logs.length % 3 === 0) log.zugabe = 'burpees';
      if (logs.length % 4 === 1) log.ort = 'Crossfit Box';
      logs.push(log);
      s = P.applyLog(s, CONFIG, log);
    }
    d.setDate(d.getDate() + 7);
  }
  logs.push({ date: '2026-07-11', type: 'wod', label: 'AMRAP 12', dauerSekunden: 720, finished: '2026-07-11T10:00:00.000Z' });
  for (const t of ['2026-07-05', '2026-07-19', '2026-08-02']) logs.push({ date: t, type: 'unplugged', label: 'Unplugged', dauerSekunden: 900, finished: `${t}T09:00:00.000Z` });
  logs.push({ date: '2026-08-15', type: 'maxout', lift: 'deadlift', weight: 140, reps: 1, finished: '2026-08-15T10:00:00.000Z' });
  return logs;
}

/* ---------- Seite mit gestellter Aussenwelt ---------- */

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64');

/**
 * Oeffnet die App mit Token, Logs und Config aus den Beispieldaten.
 * fahrten: intervals.icu verbinden und diese Aktivitaeten liefern.
 * vorher:  eigener Haken auf dem Kontext, bevor die Seite laedt.
 * adresse: die App unter dieser Adresse ausliefern statt unter localhost,
 *          etwa 'http://jens.github.io/setlist/' fuer einen Fork.
 * Gibt die Seite, gesammelte Seitenfehler und alles Geschriebene zurueck.
 */
export async function kontext(browser, { logs, config, heute, breite = 390, hoehe = 900, schrift = null, theme = 'dunkel', fahrten = null, vorher = null, adresse = null, ohneToken = false, dateien = {}, touch = false, wellness = null }) {
  const state = P.deriveState(config, logs);
  const geschrieben = [];
  const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe }, deviceScaleFactor: 1, ...(touch ? { hasTouch: true, isMobile: true } : {}) });
  if (vorher) await vorher(ctx);
  if (adresse) await unterAdresse(ctx, adresse);
  const icuAufrufe = [];
  if (fahrten) {
    await ctx.addInitScript(() => {
      localStorage.setItem('setlist.icu.key', 'demo');
      localStorage.setItem('setlist.icu.athlete', 'i1');
    });
    await ctx.route('**/intervals.icu/**', r => {
      const u = new URL(r.request().url());
      icuAufrufe.push(u.pathname + u.search);
      let body = [];
      if (u.pathname.endsWith('/activities')) {
        const von = u.searchParams.get('oldest'), bis = u.searchParams.get('newest');
        body = fahrten.filter(f => f.start_date_local.slice(0, 10) >= von && f.start_date_local.slice(0, 10) <= bis);
      }
      if (u.pathname.endsWith('/wellness') && wellness) body = wellness;
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
  }
  await ctx.addInitScript(([v, th, sch, ohne]) => {
    if (!ohne) localStorage.setItem('setlist.token', 'demo');
    localStorage.setItem('setlist.theme', th);
    localStorage.setItem('setlist.version', v);
    localStorage.setItem('setlist.gym', 'box');
    if (sch) localStorage.setItem('setlist.schrift', sch);
  }, [VERSION, theme, schrift, ohneToken]);
  const alle = () => logs.concat(geschrieben.filter(g => g.path.startsWith('einheiten/')).map(g => g.data));
  // Weitere Dateien im Datenrepo (etwa soundcheck/): vorgegebene plus dort geschriebene
  const extra = () => {
    const m = new Map(Object.entries(dateien));
    for (const g of geschrieben) if (g.path.startsWith('soundcheck/')) m.set(g.path, g.data);
    return m;
  };
  await ctx.route('**/api.github.com/**', async r => {
    const u = r.request().url(), m = r.request().method();
    const j = (o, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(o) });
    if (m === 'PUT') {
      const body = JSON.parse(r.request().postData());
      const path = decodeURIComponent(new URL(u).pathname.split('/contents/')[1]);
      geschrieben.push({ path, data: JSON.parse(Buffer.from(body.content, 'base64').toString()) });
      return j({ content: { sha: 'neu' + geschrieben.length } });
    }
    if (u.includes('/cyphomat/setlist/contents/version.json')) return r.fulfill({ status: 404, body: '' });
    if (u.includes('contents/config.json')) {
      const neu = [...geschrieben].reverse().find(g => g.path === 'config.json');
      return j({ content: b64(neu ? neu.data : config), sha: 'c1' });
    }
    if (u.includes('contents/state.json')) return j({ content: b64(state), sha: 'st1' });
    if (u.includes('contents/')) {
      const path = decodeURIComponent(new URL(u).pathname.split('/contents/')[1]);
      return extra().has(path) ? j({ content: b64(extra().get(path)), sha: 'x1' }) : r.fulfill({ status: 404, body: '' });
    }
    if (u.includes('git/trees'))
      return j({ tree: [{ path: 'config.json', type: 'blob', sha: 'cfg' }, { path: 'state.json', type: 'blob', sha: 'st' }]
        .concat(alle().map((l, i) => ({ path: `einheiten/${l.date}-${i}.json`, type: 'blob', sha: `s${i}` })))
        .concat([...extra().keys()].map((path, i) => ({ path, type: 'blob', sha: `x${i}` }))) });
    if (u.endsWith('git/blobs/cfg')) return j({ content: b64(config), encoding: 'base64' });
    if (u.endsWith('git/blobs/st')) return j({ content: b64(state), encoding: 'base64' });
    const xblob = u.match(/git\/blobs\/x(\d+)$/);
    if (xblob) { const e = [...extra().values()][+xblob[1]]; if (e) return j({ content: b64(e), encoding: 'base64' }); }
    const blob = u.match(/git\/blobs\/s(\d+)/);
    if (blob && alle()[+blob[1]]) return j({ content: b64(alle()[+blob[1]]), encoding: 'base64' });
    if (/\/repos\/[^/]+\/[^/]+$/.test(new URL(u).pathname)) return j({ private: true });
    return r.fulfill({ status: 404, body: '' });
  });
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(`${heute}T10:00:00`));
  const fehler = [];
  p.on('pageerror', e => fehler.push(e.message));
  p.on('console', msg => { if (msg.type() === 'error' && !/404|Failed to load/.test(msg.text())) fehler.push('console: ' + msg.text()); });
  await p.goto(adresse ? `${adresse}index.html` : `${BASIS}/index.html`);
  await p.waitForSelector(ohneToken ? '#view-setup:not([hidden])' : '#today .name');
  await p.waitForTimeout(600);
  return { ctx, p, fehler, geschrieben, icuAufrufe };
}

/** Die App unter einer anderen Adresse ausliefern: Pfad dort -> Repo-Wurzel hier. */
export async function unterAdresse(ctx, adresse) {
  const ziel = new URL(adresse);
  await ctx.route(u => u.origin === ziel.origin, async r => {
    const pfad = new URL(r.request().url()).pathname;
    const hier = pfad.startsWith(ziel.pathname) ? '/' + pfad.slice(ziel.pathname.length) : pfad;
    const res = await fetch(`${BASIS}${hier}`);
    return r.fulfill({ status: res.status, contentType: res.headers.get('content-type') || 'text/html',
      body: Buffer.from(await res.arrayBuffer()) });
  });
}

/**
 * Kontrast einer Textstelle gegen ihren tatsaechlichen Hintergrund (WCAG).
 * Laeuft im Browser; der Hintergrund ist die erste deckende Farbe darunter.
 */
export const kontraste = (p, selektor) => p.$$eval(selektor, els => {
  const rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => {
    const k = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * k(r) + 0.7152 * k(g) + 0.0722 * k(b);
  };
  const grund = el => {
    for (let e = el; e; e = e.parentElement) {
      const c = rgb(getComputedStyle(e).backgroundColor);
      if (c.length >= 3 && (c.length < 4 || c[3] > 0.9)) return c;
    }
    return [255, 255, 255];
  };
  return els.map(el => {
    const a = lum(rgb(getComputedStyle(el).color)), b = lum(grund(el));
    return { text: el.textContent.trim().slice(0, 30), wert: Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100 };
  });
});

/** Sichtbare Eingabefelder unter 16px: auf dem iPhone zoomt das beim Antippen. */
export const kleineFelder = p => p.evaluate(() => [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]), textarea, select')]
  .filter(el => el.getClientRects().length && !el.closest('[hidden]') && parseFloat(getComputedStyle(el).fontSize) < 16)
  .map(el => `${el.tagName}.${el.className || el.id} ${getComputedStyle(el).fontSize}`));

/** Ragt etwas sichtbar ueber den rechten Rand? */
export const ueberlauf = p => p.evaluate(() => {
  const w = document.documentElement.clientWidth;
  const raus = [...document.querySelectorAll('body *')].filter(el => {
    if (el.closest('[hidden]') || !el.getClientRects().length) return false;
    const r = el.getBoundingClientRect();
    return r.right > w + 1 && getComputedStyle(el).position !== 'fixed';
  }).map(el => el.tagName + '.' + el.className).slice(0, 5);
  return { scroll: document.documentElement.scrollWidth > w, raus };
});
