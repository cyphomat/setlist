// Browserprobe · Wochen-Soundcheck: faellig am Sonntag, ausfuellen, Datei im
// Datenrepo, Vorsaetze im Wochenkopf, Serie und Aufnaeher, Archiv in der
// Tour, ohne Netz in der Warteschlange — in beiden Sprachen und Breiten.
// Aufruf ueber tools/proben.mjs.

import { CONFIG, BILDER, verlauf, kontext, ueberlauf, kontraste } from './gemeinsam.mjs';

const altSoundcheck = (woche, vorsaetze = []) => ({ woche, lief: `Lief ${woche}`, hakt: '', vorsaetze, abgeschlossen: '2026-09-01T08:00:00.000Z' });
// Drei Wochen in Folge schon erledigt: die vierte bringt den Aufnaeher
const DREI = Object.fromEntries(['2026-W37', '2026-W38', '2026-W39']
  .map(w => [`soundcheck/${w}.json`, altSoundcheck(w, [`Vorsatz aus ${w}`])]));

export default async function ({ browser, pruefe }) {
  const logs = verlauf('2026-10-01')
    .concat([{ date: '2026-09-29', type: 'mobility', uebung: 'couch', finished: '2026-09-29T07:00:00.000Z' }]);

  /* 1 · Sonntag: faellig, ausfuellen, speichern */
  for (const [breite, schrift, theme] of [[390, null, 'dunkel'], [320, 'sehr', 'hell'], [1280, null, 'hell']]) {
    const tag = `${breite}${schrift ? '/sehr' : ''}/${theme}`;
    const { ctx, p, fehler, geschrieben } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-04', breite, schrift, theme, dateien: DREI });
    await p.waitForSelector('#go-soundcheck', { timeout: 6000 }).catch(() => {});
    const knopf = (await p.textContent('#go-soundcheck').catch(() => '')).trim();
    pruefe(`${tag}: Sonntag — Soundcheck KW 40 fällig`, knopf === 'Soundcheck für KW 40 fällig →', knopf);
    await p.click('#go-soundcheck');
    await p.waitForSelector('#view-soundcheck:not([hidden])');
    const kopf = (await p.textContent('#sc-body .kicker')).trim();
    pruefe(`${tag}: Woche mit Daten`, kopf === 'KW 40 · 28.09.–04.10.', kopf);
    const zahlen = await p.$$eval('#sc-body .stat', l => Object.fromEntries(l.map(s => [s.querySelector('.n').textContent, s.querySelector('.v').textContent])));
    pruefe(`${tag}: Zahlen der Woche`, zahlen.Krafteinheiten === '2' && zahlen['Mobility-Tage'] === '1' && zahlen['Saubere Sätze'] === '26/26',
      JSON.stringify(zahlen));
    const serie = (await p.textContent('#sc-body .serie').catch(() => '')).trim();
    pruefe(`${tag}: Serie bisher`, serie === 'Serie: 3 Wochen in Folge', serie);
    await p.fill('#sc-lief', 'Kniebeuge fühlt sich leicht an');
    await p.fill('#sc-hakt', 'Zu spät ins Bett <b>fett</b>');
    const felder = p.locator('#sc-body .sc-vorsatz');
    await felder.nth(0).fill('Zweimal Mobility');
    await felder.nth(2).fill('<img src=x onerror=alert(1)>');
    await p.screenshot({ path: BILDER + `rueckschau-${breite}-${theme}${schrift ? '-sehr' : ''}.png`, fullPage: true });
    const k = (await kontraste(p, '#sc-body .kicker, #sc-body .lead, #sc-body .stat .n, #sc-body .sc-feld > span, #sc-body legend, #sc-body .fine'))
      .filter(x => x.wert < 4.5);
    pruefe(`${tag}: Kontrast ≥ 4,5`, !k.length, JSON.stringify(k));
    const u = await ueberlauf(p);
    pruefe(`${tag}: kein Querlauf`, !u.scroll && !u.raus.length, JSON.stringify(u));
    const randlos = await p.$$eval('#sc-body .stat', l => l.filter(s => [...s.children].some(c => c.scrollWidth > s.clientWidth + 1)).length);
    pruefe(`${tag}: Beschriftungen bleiben in ihrer Kachel`, randlos === 0, String(randlos));
    await p.click('#sc-speichern');
    await p.waitForSelector('#view-home:not([hidden])');
    await p.waitForTimeout(500);
    const datei = geschrieben.find(g => g.path === 'soundcheck/2026-W40.json');
    pruefe(`${tag}: Datei im Datenrepo`, datei && datei.data.woche === '2026-W40' && datei.data.lief === 'Kniebeuge fühlt sich leicht an'
      && datei.data.vorsaetze.length === 2 && !('type' in datei.data), JSON.stringify(datei && datei.data));
    pruefe(`${tag}: kein Zustand, keine Einheit geschrieben`, !geschrieben.some(g => g.path === 'state.json' || g.path.startsWith('einheiten/')));
    pruefe(`${tag}: nicht mehr fällig`, !(await p.$('#go-soundcheck')));
    const vors = await p.$$eval('#amp .sc-vorsaetze li', l => l.map(x => x.textContent));
    pruefe(`${tag}: Vorsätze im Wochenkopf, als Text`, vors.length === 2 && vors[1] === '<img src=x onerror=alert(1)>' && !(await p.$('#amp .sc-vorsaetze img')),
      vors.join(' | '));
    const ans = (await p.textContent('#ansager').catch(() => '')).replace(/\s+/g, ' ');
    pruefe(`${tag}: vier Wochen in Folge — Aufnäher angesagt`, /NEUER AUFNÄHER/.test(ans) && /Soundcheck: 4 Wochen/.test(ans), ans);
    if (breite === 390) await p.locator('.woche-karte').screenshot({ path: BILDER + 'rueckschau-wochenkopf.png' });
    const u2 = await ueberlauf(p);
    pruefe(`${tag}: Home kein Querlauf`, !u2.scroll && !u2.raus.length, JSON.stringify(u2));
    // Archiv in der Tour
    await p.click('#go-history');
    await p.click('#tour-tab-einheiten');
    await p.waitForSelector('#hist-soundcheck details');
    await p.click('#hist-soundcheck summary');
    await p.waitForSelector('#sc-archiv-body .sc-eintrag');
    const archiv = (await p.textContent('#sc-archiv-body')).replace(/\s+/g, ' ');
    pruefe(`${tag}: Archiv mit allen vier Wochen, neueste zuerst`, /^ ?KW 40/.test(archiv) && /KW 37/.test(archiv) && /<b>fett<\/b>/.test(archiv), archiv.slice(0, 160));
    pruefe(`${tag}: Archiv ohne eingeschleustes HTML`, !(await p.$$eval('#sc-archiv-body b', l => l.some(b => b.textContent === 'fett'))));
    const u3 = await ueberlauf(p);
    pruefe(`${tag}: Tour kein Querlauf`, !u3.scroll && !u3.raus.length, JSON.stringify(u3));
    pruefe(`keine Seitenfehler (${tag})`, !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  /* 2 · Montag und Dienstag noch, Mittwoch nicht mehr */
  for (const [heute, faellig] of [['2026-10-05', true], ['2026-10-06', true], ['2026-10-07', false]]) {
    const { ctx, p } = await kontext(browser, { logs, config: CONFIG, heute, dateien: DREI });
    await p.waitForTimeout(600);
    const da = !!(await p.$('#go-soundcheck'));
    pruefe(`${heute}: ${faellig ? 'noch fällig' : 'nicht mehr fällig'}`, da === faellig);
    if (!faellig) {
      const vors = await p.$$eval('#amp .sc-vorsaetze li', l => l.map(x => x.textContent));
      pruefe(`${heute}: ohne Soundcheck der Vorwoche keine alten Vorsätze`, !vors.length, vors.join());
    }
    await ctx.close();
  }

  /* 3 · Ohne Netz: in die Warteschlange, beim naechsten Start nachgetragen */
  {
    const { ctx, p, geschrieben } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-05', dateien: DREI });
    await p.route('**/contents/soundcheck/**', r => r.abort());
    await p.click('#go-soundcheck');
    await p.fill('#sc-lief', 'Offline geschrieben');
    await p.click('#sc-speichern');
    await p.waitForSelector('#view-home:not([hidden])');
    await p.waitForTimeout(400);
    const q = await p.evaluate(() => JSON.parse(localStorage.getItem('setlist.queue') || '[]'));
    pruefe('offline: in der Warteschlange', q.length === 1 && q[0].type === 'soundcheck' && q[0].woche === '2026-W40', JSON.stringify(q));
    pruefe('offline: trotzdem erledigt', !(await p.$('#go-soundcheck')));
    await p.unroute('**/contents/soundcheck/**');
    await p.reload();
    await p.waitForSelector('#today .name');
    await p.waitForTimeout(800);
    const datei = geschrieben.find(g => g.path === 'soundcheck/2026-W40.json');
    pruefe('nachgetragen: Datei ohne Typfeld', datei && datei.data.lief === 'Offline geschrieben' && !('type' in datei.data), JSON.stringify(datei && datei.data));
    pruefe('nachgetragen: Warteschlange leer', (await p.evaluate(() => localStorage.getItem('setlist.queue'))) === null);
    await ctx.close();
  }

  /* 4 · Englisch */
  {
    const { ctx, p, fehler } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-04', breite: 360, schrift: 'sehr', theme: 'dunkel', dateien: DREI,
      vorher: c => c.addInitScript(() => localStorage.setItem('setlist.sprache', 'en')) });
    await p.waitForSelector('#go-soundcheck', { timeout: 6000 }).catch(() => {});
    const knopf = (await p.textContent('#go-soundcheck').catch(() => '')).trim();
    pruefe('EN: due', knopf === 'Soundcheck for week 40 due →', knopf);
    await p.click('#go-soundcheck');
    const text = (await p.textContent('#view-soundcheck')).replace(/\s+/g, ' ');
    pruefe('EN: view in English', /Week 40 · /.test(text) && /Went well/.test(text) && /Three resolutions/.test(text) && !/[äöüß]/.test(text), text.slice(0, 200));
    const u = await ueberlauf(p);
    pruefe('EN 360/sehr: kein Querlauf', !u.scroll && !u.raus.length, JSON.stringify(u));
    pruefe('keine Seitenfehler (EN)', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }
}
