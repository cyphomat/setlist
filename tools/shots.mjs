// Aufnahmen fuer die README — die Fassung mit abgefangener GitHub-API.
//
// tools/shot.html reicht fuer alles, was aus dem Zwischenspeicher lebt. Ein
// paar Bildschirme haengen aber daran, was die API *antwortet*: der
// Einrichte-Bildschirm erscheint nur, wenn config.json mit 404 zurueckkommt,
// der Fork-Hinweis nur, wenn im Original eine neuere Version steht. Das
// laesst sich nicht aus dem Zwischenspeicher stellen, also wird hier
// geantwortet statt geladen.
//
// Aufruf:
//   python3 -m http.server 8765 &
//   node tools/shots.mjs            (alle)
//   node tools/shots.mjs orte       (einzeln)
//
// Braucht playwright und einen Chromium. Auf dem Mac:
//   npx playwright install chromium

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = join(WURZEL, 'assets', 'screens');
const PORT = process.env.PORT || 8765;
const BASIS = `http://localhost:${PORT}`;

// Die laufende Version mitgeben. Steht dort etwas anderes, haelt die App
// sich fuer veraltet und laedt sich mitten in der Aufnahme neu — der
// Bildschirm springt dann zurueck auf den Start.
const VERSION = JSON.parse(readFileSync(join(WURZEL, 'version.json'), 'utf8')).version;

/* ---------- Beispieldaten ----------
   Erfunden, aber plausibel: ein Wiedereinstieg im dritten Monat.        */

const CONFIG = {
  version: 1, bar: 20, rounding: 2.5, motto: 'Lift Heavy Shit',
  plates: [25, 20, 15, 10, 5, 2.5, 1.25],
  deload: { afterFails: 3, factor: 0.9 },
  lifts: {
    squat:    { name: 'Back Squat',   increment: 2.5, start: 47.5, reference: 100 },
    bench:    { name: 'Bench Press',  increment: 2.5, start: 35,   reference: 75 },
    row:      { name: 'Barbell Row',  increment: 2.5, start: 32.5, reference: 70 },
    ohp:      { name: 'Strict Press', increment: 2.5, start: 25,   reference: 50 },
    deadlift: { name: 'Deadlift',     increment: 5,   start: 60,   reference: 130 }
  },
  workouts: {
    A: [{ lift: 'squat', sets: 5, reps: 5 }, { lift: 'bench', sets: 5, reps: 5 }, { lift: 'row', sets: 5, reps: 5 }],
    B: [{ lift: 'squat', sets: 5, reps: 5 }, { lift: 'ohp', sets: 5, reps: 5 }, { lift: 'deadlift', sets: 1, reps: 5 }]
  },
  firstWorkout: 'A',
  rest: { normal: 90, afterFail: 180 },
  week: { slots: [{ day: 1, type: 'strength' }, { day: 2, type: 'ride' },
                  { day: 4, type: 'strength' }, { day: 6, type: 'ride' }] },
  rides: [
    { label: 'Grundlage Z2', detail: '90 Min ruhig, Zone 2, Gespräch möglich' },
    { label: 'Sweet Spot', detail: '3x12 Min @ 88-93% FTP, 6 Min locker dazwischen' }
  ],
  ziele: { warum: 'Damit ich mit siebzig noch meine Enkel hochheben kann.' },
  records: {
    quelle: 'altes Trainingstagebuch',
    programm: {
      squat:    { datum: '2021-03-04', bestesEinzel: 140, bestes5er: 120 },
      bench:    { datum: '2021-02-11', bestesEinzel: 95,  bestes5er: 80 },
      deadlift: { datum: '2021-04-22', bestesEinzel: 170, bestes5er: 145 }
    }
  },
  gyms: [
    { id: 'home', name: 'Homegym', geraete: ['kurzhantel', 'kettlebell', 'springseil'] },
    { id: 'box', name: 'Crossfit Box', geraete: [
      'langhantel','kurzhantel','kettlebell','klimmzugstange','latzug','box',
      'wandball','springseil','battlerope','rudergeraet','bikeerg','assaultbike'] },
    { id: 'studio', name: 'Studio', geraete: [
      'langhantel','kurzhantel','kettlebell','klimmzugstange','latzug','box',
      'rudergeraet','assaultbike'] }
  ]
};

const STIMME = { sprueche: { alle: [
  'Keine Ausreden. Nur Sätze.',
  'Die Stange ist ehrlich. Sie lügt nie über deinen Tag.',
  'Nicht schneller werden. Nicht aufhören.'
] } };

/* Ein Verlauf ueber zwoelf Wochen. Ohne ihn haetten Hochrechnung und
   Plateaus nichts zu sagen, und die Verhaeltnisse stuenden auf den
   Startgewichten — bei denen zufaellig alles stimmt. Ein Bildschirm, auf
   dem nichts auffaellt, zeigt nicht, wozu der Bildschirm da ist.

   Die Schieflage ist absichtlich: das Bankdruecken bleibt zurueck. Genau
   der Fall, den die Diagnose finden soll.                              */
function verlauf() {
  const logs = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date('2026-06-15'); d.setDate(d.getDate() + i * 7);
    const A = i % 2 === 0;
    logs.push({
      date: d.toISOString().slice(0, 10), workout: A ? 'A' : 'B', type: 'strength',
      lifts: A
        ? [{ lift: 'squat', weight: 60 + i * 1.5, sets: 5, target: 5, reps: [5,5,5,5,5], success: true },
           { lift: 'bench', weight: 40 + i * 0.2, sets: 5, target: 5, reps: i > 7 ? [5,5,5,5,4] : [5,5,5,5,5], success: i <= 7 },
           { lift: 'row',   weight: 37.5 + i,     sets: 5, target: 5, reps: [5,5,5,5,5], success: true }]
        : [{ lift: 'squat', weight: 60 + i * 1.5, sets: 5, target: 5, reps: [5,5,5,5,5], success: true },
           { lift: 'ohp',   weight: 32.5 + i * 0.8, sets: 5, target: 5, reps: [5,5,5,5,5], success: true },
           { lift: 'deadlift', weight: 80 + i * 2,  sets: 1, target: 5, reps: [5], success: true }]
    });
  }
  return logs;
}
const LOGS = verlauf();
const STATE = {
  version: 1, next: 'A', updated: '2026-09-10T08:00:00.000Z',
  lifts: { squat: { weight: 77.5, fails: 0 }, bench: { weight: 42.5, fails: 2 },
           row: { weight: 48.5, fails: 0 }, ohp: { weight: 41.5, fails: 0 },
           deadlift: { weight: 102, fails: 0 } }
};
// Die Waage liefert das Koerpergewicht, das Klimmzug und Dip brauchen —
// und ueber den ganzen Verlauf, damit jede Uebung genug Punkte fuer ihre
// Relativkraft-Kurve hat. Eine Wiegung zaehlt nur, wenn sie hoechstens
// vierzehn Tage von der Einheit entfernt liegt.
const WELLNESS = Array.from({ length: 95 }, (_, i) => {
  const d = new Date('2026-06-10'); d.setDate(d.getDate() + i);
  return { id: d.toISOString().slice(0, 10), weight: Math.round((88 - i * 0.045) * 10) / 10,
           eftp: 232, ctl: 44 + i * 0.05, atl: 41 + i * 0.06 };
});
const CHECKS = {
  pullup: { gewicht: 0, wdh: 7 }, dip: { gewicht: 12.5, wdh: 6 },
  frontsquat: { gewicht: 62.5, wdh: 5 }, sapress: { gewicht: 22.5, wdh: 5 },
  stepup: { gewicht: 40, wdh: 5 }, sldl: { gewicht: 32.5, wdh: 5 }, farmer: { gewicht: 40 }
};

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64');

/** Antwortet auf die GitHub-API. `configDa: false` heisst "noch nichts eingerichtet". */
function routen(ctx, { configDa = true, versionOben = null, mitVerlauf = false, mitChecks = false } = {}) {
  const conf = mitChecks ? { ...CONFIG, checks: CHECKS } : CONFIG;
  return ctx.route('**/api.github.com/**', r => {
    const u = r.request().url();
    const j = (o, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(o) });
    if (u.includes('/cyphomat/setlist/contents/version.json'))
      return versionOben ? j({ content: b64({ version: versionOben }) }) : r.fulfill({ status: 404, body: '' });
    if (u.includes('contents/config.json'))
      return configDa ? j({ content: b64(conf), sha: 'c1' }) : r.fulfill({ status: 404, body: '' });
    if (u.includes('contents/state.json'))
      return mitVerlauf ? j({ content: b64(STATE), sha: 'st1' }) : r.fulfill({ status: 404, body: '' });
    if (u.includes('contents/stimme.json')) return j({ content: b64(STIMME), sha: 's1' });
    // Die Logs kommen ueber den Baum und dann ueber git/blobs — nicht ueber
    // contents/, wie man vermuten wuerde.
    if (u.includes('git/trees'))
      return j({ tree: mitVerlauf
        ? LOGS.map((l, i) => ({ path: `einheiten/${l.date}-${i}.json`, type: 'blob', sha: `s${i}` }))
        : [] });
    const blob = u.match(/git\/blobs\/s(\d+)/);
    if (blob && LOGS[+blob[1]]) return j({ content: b64(LOGS[+blob[1]]), encoding: 'base64' });
    if (/\/repos\/[^/]+\/[^/]+$/.test(new URL(u).pathname)) return j({ private: true });
    return r.fulfill({ status: 404, body: '' });
  });
}

/** Die Waage, damit Klimmzug und Dip eine Gesamtlast haben. */
const routenIcu = ctx => ctx.route('**/intervals.icu/**', r =>
  r.fulfill({ status: 200, contentType: 'application/json',
              body: JSON.stringify(r.request().url().includes('wellness') ? WELLNESS : []) }));

/* ---------- Die Szenen ---------- */

const SZENEN = {
  // Ersteinrichtung: kommt nur, wenn im Repo noch kein Programm liegt.
  einrichten: {
    optionen: { configDa: false },
    hoehe: 1180,
    async fuehre(p) { await p.waitForSelector('#ein-lifts .ein-lift'); }
  },

  // Orte und Geraete im Backstage, ein Ort aufgeklappt.
  orte: {
    hoehe: 1000,
    async fuehre(p) {
      await p.click('#go-history');
      await p.waitForSelector('#gym-liste details');
      await p.click('#gym-liste details:first-child summary');
      await p.waitForTimeout(250);
      await verstecke(p, '#banner');
      await scrolleZu(p, '#gym-liste', 120);
    }
  },

  // Die Ortsauswahl aus der Kopfzeile.
  ortwahl: {
    async fuehre(p) {
      await p.waitForSelector('#gym-wahl:not([hidden])');
      await p.click('#gym-wahl');
      await p.waitForTimeout(300);
    }
  },

  // Deine Stimme: Grund, eigene Zeilen, alte Bestleistungen.
  stimme: {
    hoehe: 1000,
    async fuehre(p) {
      await p.click('#go-history');
      await p.waitForSelector('#pers-rekorde .pers-rekord');
      await verstecke(p, '#banner');
      await scrolleZu(p, '#pers-grund', 190);
    }
  },

  // Der Analyseteil: wo die Kraft schief steht, samt Diagnose.
  analyse: {
    optionen: { mitVerlauf: true, mitChecks: true },
    icu: true,
    hoehe: 1250,
    async fuehre(p) {
      await p.click('#go-history');
      await p.waitForSelector('#hist-verhaeltnisse .verh');
      await verstecke(p, '#banner');
      await scrolleZu(p, '#hist-verhaeltnisse', 110);
    }
  },

  // Wann du wieder da bist, Kraft je Kilo, wo es klemmt.
  fortschritt: {
    optionen: { mitVerlauf: true, mitChecks: true },
    icu: true,
    hoehe: 1150,
    async fuehre(p) {
      await p.click('#go-history');
      await p.waitForSelector('#hist-hochrechnung .pr');
      await verstecke(p, '#banner');
      await scrolleZu(p, '#hist-hochrechnung', 110);
    }
  },

  // Ein Bewegungsstandard in der Bibliothek: wann die Wiederholung zaehlt.
  standard: {
    hoehe: 900,
    async fuehre(p) {
      await p.click('#go-bibliothek');
      await p.fill('#bib-suche', 'Wall Ball');
      await p.waitForSelector('#bib-liste details');
      await p.click('#bib-liste details:first-child summary');
      await p.waitForTimeout(250);
      await verstecke(p, '#banner');
      await scrolleZu(p, '#bib-liste', 110);
    }
  },

  // Pruefwerte im Max-Out: dieselbe Art zu testen, ohne Progressionsfolge.
  pruefwerte: {
    optionen: { mitVerlauf: true, mitChecks: true },
    icu: true,
    hoehe: 1220,
    async fuehre(p) {
      await p.click('#go-maxout');
      await p.waitForSelector('#mo-checks [data-check]');
      await p.click('#mo-checks [data-check="pullup"]');
      await p.fill('#mo-weight', '0');
      await p.fill('#mo-reps', '7');
      await p.dispatchEvent('#mo-weight', 'input');
      await p.waitForTimeout(350);
      await verstecke(p, '#banner');
      await scrolleZu(p, '#mo-checks', 160);
    }
  },

  // Der Hinweis, dass am Original weitergearbeitet wurde.
  fork: {
    optionen: { versionOben: '2026-11-14.3' },
    host: 'jens.github.io',
    async fuehre(p) {
      await p.click('#go-history');
      await p.waitForSelector('#version-box');
      await verstecke(p, '#banner');
      await scrolleZu(p, '#version-box', 150);
    }
  }
};

const verstecke = (p, sel) => p.evaluate(s => {
  const el = document.querySelector(s); if (el) el.hidden = true;
}, sel);

const scrolleZu = (p, sel, abstand) => p.evaluate(([s, a]) => {
  const el = document.querySelector(s);
  if (el) window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY - a));
}, [sel, abstand]);

/* ---------- Ablauf ---------- */

const gewaehlt = process.argv.slice(2);
const namen = gewaehlt.length ? gewaehlt : Object.keys(SZENEN);
const unbekannt = namen.filter(n => !SZENEN[n]);
if (unbekannt.length) {
  console.error(`Unbekannte Szene: ${unbekannt.join(', ')}`);
  console.error(`Bekannt: ${Object.keys(SZENEN).join(', ')}`);
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined
});

for (const name of namen) {
  const s = SZENEN[name];
  const ctx = await browser.newContext({
    viewport: { width: 390, height: s.hoehe || 844 },
    deviceScaleFactor: 2
  });
  await ctx.addInitScript(([v, icu]) => {
    localStorage.setItem('setlist.token', 'demo');
    localStorage.setItem('setlist.theme', 'dunkel');
    localStorage.setItem('setlist.version', v);
    if (icu) {
      localStorage.setItem('setlist.icu.key', 'demo');
      localStorage.setItem('setlist.icu.athlete', 'i1');
    }
  }, [VERSION, !!s.icu]);
  await routen(ctx, s.optionen);
  if (s.icu) await routenIcu(ctx);

  // Ein Fork laeuft unter fremder Adresse — nur dann fragt die App beim
  // Original nach. Dafuer wird der lokale Server unter diesem Namen
  // ausgeliefert statt ihn nachzubauen.
  if (s.host) {
    await ctx.route(`https://${s.host}/**`, async r => {
      const pfad = new URL(r.request().url()).pathname.replace(/^\//, '') || 'index.html';
      const res = await fetch(`${BASIS}/${pfad}`);
      if (!res.ok) return r.fulfill({ status: 404, body: '' });
      const typ = pfad.endsWith('.js') ? 'text/javascript'
        : pfad.endsWith('.css') ? 'text/css'
        : pfad.endsWith('.json') ? 'application/json'
        : pfad.endsWith('.woff2') ? 'font/woff2'
        : pfad.endsWith('.png') ? 'image/png' : 'text/html';
      return r.fulfill({ status: 200, contentType: typ, body: Buffer.from(await res.arrayBuffer()) });
    });
  }

  const p = await ctx.newPage();
  const fehler = [];
  p.on('pageerror', e => fehler.push(e.message));
  await p.goto(`${s.host ? `https://${s.host}` : BASIS}/index.html`);
  await p.waitForTimeout(1400);
  await s.fuehre(p);
  await p.waitForTimeout(400);
  await verstecke(p, '#banner');
  await p.screenshot({ path: join(ZIEL, `${name}-dunkel.png`) });
  console.log(`  ${name}-dunkel.png${fehler.length ? `   FEHLER: ${fehler.join(' | ')}` : ''}`);
  await ctx.close();
}

await browser.close();
