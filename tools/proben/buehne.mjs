// Browserprobe · Bühne: Pixel-Aufnäher und Rangszenen im Merch, Glut hinter
// SCHWER, Ansager nach der Einheit — an, aus, und ruhig bei reduzierter Bewegung.
// Aufruf ueber tools/proben.mjs.

import { P, CONFIG, verlauf, kontext, ueberlauf } from './gemeinsam.mjs';
import * as M from '../../js/merch.js';

/** Verlauf, nach dem heute B dran ist — dann sagt der Coach SCHWER. */
function mitNaechstem(workout) {
  const logs = verlauf('2026-09-28');
  const s = P.deriveState(CONFIG, logs);
  if (s.next !== workout) {
    const plan = P.planWorkout(s, CONFIG, s.next);
    logs.push({ date: '2026-09-30', workout: plan.workout, type: 'strength', finished: '2026-09-30T18:00:00.000Z',
      lifts: plan.lifts.map(l => ({ lift: l.lift, weight: l.weight, sets: l.sets, target: l.reps, reps: Array(l.sets).fill(l.reps), success: true })) });
  }
  return logs;
}

const glutPixel = p => p.evaluate(() => {
  const c = document.querySelector('#today .tageswort .glut');
  if (!c || !c.width) return c ? 0 : -1;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let a = 0; for (let i = 3; i < d.length; i += 4) a += d[i];
  return a;
});

async function einheitDurch(p) {
  await p.click('#start');
  await p.waitForSelector('#view-session:not([hidden])');
  if (await p.$('#pause-dialog[open]')) await p.click('#pause-nein');
  const n = await p.locator('#session-body .set').count();
  for (let i = 0; i < n; i++) {
    await p.locator('#session-body .set').nth(i).click();
    await p.evaluate(() => { const r = document.getElementById('rest'); if (r) r.hidden = true; });
  }
  await p.click('#finish');
  await p.waitForSelector('#view-done:not([hidden])');
}

export default async function ({ browser, pruefe }) {
  const fremde = new Set();

  /* 1 · Merch: Szenen, Tour-Leiste, Pixel-Aufnaeher */
  for (const [breite, schrift, theme] of [[320, 'sehr', 'hell'], [390, null, 'dunkel'], [1280, null, 'dunkel']]) {
    const tag = `${breite}${schrift ? '/sehr' : ''}/${theme}`;
    const { ctx, p, fehler } = await kontext(browser, { logs: verlauf('2026-09-28'), config: CONFIG, heute: '2026-10-01', breite, schrift, theme,
      vorher: async c => c.on('request', r => { const h = new URL(r.url()).hostname; if (!['localhost', 'api.github.com'].includes(h)) fremde.add(h); }) });
    await p.click('#go-merch');
    await p.waitForSelector('#merch-kutte .patch');
    await p.waitForTimeout(400);
    const bogen = await p.evaluate(async () => {
      const lade = src => new Promise(ok => { const i = new Image(); i.onload = () => ok([i.naturalWidth, i.naturalHeight]); i.onerror = () => ok([0, 0]); i.src = src; });
      return { auf: await lade('assets/pixel/aufnaeher.png'), rang: await lade('assets/pixel/raenge.png') };
    });
    pruefe(`${tag}: Aufnäher-Bogen geladen, ein Bild je Aufnäher`, bogen.auf[0] === 24 * M.BILDER.length && bogen.auf[1] === 24, bogen.auf.join('×'));
    pruefe(`${tag}: Rang-Bogen geladen, sieben Szenen`, bogen.rang[0] === 96 * 7 && bogen.rang[1] === 48, bogen.rang.join('×'));
    const rang = await p.evaluate(() => ({
      gross: !!document.querySelector('#merch-rang .szene.gross[role="img"][aria-label]'),
      stationen: [...document.querySelectorAll('#merch-rang .tstop')].map(f => f.className.replace('tstop ', '')),
      grau: getComputedStyle(document.querySelector('#merch-rang .tstop.kommt .szene') || document.body).filter
    }));
    pruefe(`${tag}: große Szene mit Beschriftung`, rang.gross);
    pruefe(`${tag}: sieben Stationen, genau eine jetzt`, rang.stationen.length === 7 && rang.stationen.filter(s => s === 'jetzt').length === 1,
      rang.stationen.join(','));
    pruefe(`${tag}: kommende abgedunkelt`, /grayscale/.test(rang.grau), rang.grau);
    const flicken = await p.evaluate(() => {
      const alle = [...document.querySelectorAll('#merch-kutte .patch')];
      return { n: alle.length, mitBild: alle.filter(x => x.querySelector('.pix')).length,
        offenGrau: alle.filter(x => x.classList.contains('offen')).every(x => /grayscale/.test(getComputedStyle(x.querySelector('.pix')).filter)) };
    });
    pruefe(`${tag}: jeder Aufnäher mit Bild`, flicken.n > 0 && flicken.n === flicken.mitBild, `${flicken.mitBild}/${flicken.n}`);
    const lagen = await p.$$eval('#merch-kutte .patch .pix', l => l.map(x => getComputedStyle(x).backgroundPosition));
    pruefe(`${tag}: keine zwei Aufnäher mit demselben Bild`, new Set(lagen).size === lagen.length, `${new Set(lagen).size}/${lagen.length}`);
    pruefe(`${tag}: offene grau`, flicken.offenGrau);
    const u = await ueberlauf(p);
    pruefe(`${tag}: kein Querlauf`, !u.scroll && !u.raus.length, JSON.stringify(u));
    pruefe(`keine Seitenfehler (Merch ${tag})`, !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 2 · Glut hinter SCHWER */
  {
    const { ctx, p, fehler } = await kontext(browser, { logs: mitNaechstem('B'), config: CONFIG, heute: '2026-10-01' });
    const wort = (await p.textContent('#today .tageswort')).trim();
    pruefe('B-Tag: SCHWER', wort === 'SCHWER', wort);
    await p.waitForTimeout(700);
    pruefe('SCHWER: es glüht', (await glutPixel(p)) > 0);
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.reload();
    await p.waitForSelector('#today .tageswort');
    await p.waitForTimeout(700);
    pruefe('reduzierte Bewegung: keine Glut', (await glutPixel(p)) <= 0);
    pruefe('keine Seitenfehler (Glut)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }
  {
    const { ctx, p } = await kontext(browser, { logs: mitNaechstem('A'), config: CONFIG, heute: '2026-10-01' });
    const wort = (await p.textContent('#today .tageswort')).trim();
    pruefe('A-Tag: kein SCHWER, keine Glut', wort !== 'SCHWER' && (await glutPixel(p)) === -1, wort);
    await ctx.close();
  }

  /* 3 · Ansager nach der Einheit */
  for (const theme of ['dunkel', 'hell']) {
    const { ctx, p, fehler } = await kontext(browser, { logs: mitNaechstem('B'), config: CONFIG, heute: '2026-10-01', breite: 320, theme });
    await einheitDurch(p);
    await p.waitForSelector('#ansager:not([hidden])', { timeout: 8000 }).catch(() => {});
    const a = await p.evaluate(() => { const e = document.getElementById('ansager');
      return { sichtbar: !e.hidden, ruf: (e.querySelector('.ruf') || {}).textContent || '', unter: (e.querySelector('small') || {}).textContent || '' }; });
    const neu = await p.$$eval('#done-aufnaeher .patch b', l => l.map(x => x.textContent));
    const erwartet = neu.length ? 'NEUER AUFNÄHER' : null;
    pruefe(`Ansager (${theme}): erscheint nach der Einheit`, a.sichtbar && !!a.ruf, JSON.stringify(a));
    pruefe(`Ansager (${theme}): Vorrang stimmt`, erwartet ? a.ruf === erwartet : ['FLAWLESS', 'GOES TO ELEVEN', 'WIEDER DA'].includes(a.ruf) || / KG$/.test(a.ruf),
      `${a.ruf} / neu: ${neu.join(', ')}`);
    const u = await ueberlauf(p);
    pruefe(`Ansager (${theme}) 320: kein Querlauf`, !u.scroll, JSON.stringify(u));
    await p.waitForTimeout(2600);
    pruefe(`Ansager (${theme}): verschwindet wieder`, await p.evaluate(() => document.getElementById('ansager').hidden));
    pruefe(`keine Seitenfehler (Ansager ${theme})`, !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 4 · Abgeschaltet: keine Ansage; Einschalten zeigt eine Probe */
  {
    const { ctx, p, fehler } = await kontext(browser, { logs: mitNaechstem('B'), config: CONFIG, heute: '2026-10-01' });
    await p.click('#go-history');
    await p.click('#go-backstage');
    await p.click('#bs-tab-app');
    await p.click('.ansager-wahl [data-ansager="aus"]');
    pruefe('Aus: gespeichert', (await p.evaluate(() => localStorage.getItem('setlist.ansager'))) === 'aus');
    pruefe('Aus: Knopf markiert', await p.$eval('.ansager-wahl [data-ansager="aus"]', b => b.classList.contains('an')));
    await p.click('.ansager-wahl [data-ansager="an"]');
    pruefe('An: Probe-Ansage FLAWLESS', (await p.textContent('#ansager .ruf').catch(() => '')) === 'FLAWLESS'
      && !(await p.evaluate(() => document.getElementById('ansager').hidden)));
    await p.click('.ansager-wahl [data-ansager="aus"]');
    await p.click('#bs-back');
    await p.click('#hist-back');
    await einheitDurch(p);
    await p.waitForTimeout(3500);
    pruefe('Aus: nach der Einheit keine Ansage', await p.evaluate(() => document.getElementById('ansager').hidden));
    pruefe('keine Seitenfehler (Aus)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  pruefe('keine Anfrage an fremde Hosts', !fremde.size, [...fremde].join(', '));
}
