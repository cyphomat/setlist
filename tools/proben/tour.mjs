// Browserprobe · Tour mit Reitern und Backstage: Panels, Tastatur, gemerkter Reiter, Speichern.
// Aufruf ueber tools/proben.mjs.

import { CONFIG, BILDER, verlauf, kontext, ueberlauf, kontraste } from './gemeinsam.mjs';

export default async function ({ browser, pruefe }) {
  const sichtbar = p => p.$$eval('#view-history .reiter-panel', l => l.filter(x => !x.hidden).map(x => x.id));
  const logs = verlauf('2026-09-28');

  {
    const { ctx, p, fehler, geschrieben } = await kontext(browser, { logs, config: { ...CONFIG,
      injuries: [{ id: 'finger', was: 'Finger', art: 'wiederkehrend', status: 'aktiv', seit: '2026-09-20' }] }, heute: '2026-10-01' });
    await p.click('#go-history');
    await p.waitForSelector('#hist-kalender .zelle');
    pruefe('Tour öffnet auf Überblick', (await sichtbar(p)).join() === 'tour-ueberblick', (await sichtbar(p)).join());
    pruefe('Überblick: Kalender und Merch-Link', !!(await p.$('#tour-ueberblick #hist-kalender .zelle')) && !!(await p.$('#tour-ueberblick #hist-merch')));
    for (const [r, sel] of [['kraft', '#hist-prs .pr'], ['koerper', '#hist-koerper'], ['rad', '#hist-rad'], ['einheiten', '#history-body .hist']]) {
      await p.click(`#tour-tab-${r}`);
      await p.waitForTimeout(120);
      const s = await sichtbar(p);
      pruefe(`Reiter ${r}: genau sein Panel`, s.join() === `tour-${r}`, s.join());
      pruefe(`Reiter ${r}: Inhalt da`, !!(await p.$(`#tour-${r} ${sel}`)), sel);
      pruefe(`Reiter ${r}: aria-selected`, (await p.getAttribute(`#tour-tab-${r}`, 'aria-selected')) === 'true');
    }
    await p.focus('#tour-tab-einheiten');
    await p.keyboard.press('ArrowRight');
    pruefe('Pfeil rechts springt von Einheiten auf Überblick', (await sichtbar(p)).join() === 'tour-ueberblick');
    await p.keyboard.press('ArrowLeft');
    pruefe('Pfeil links zurück auf Einheiten', (await sichtbar(p)).join() === 'tour-einheiten');
    await p.click('#tour-tab-kraft');
    // Merch hin und zurueck
    await p.click('#tour-tab-ueberblick');
    await p.click('#hist-merch');
    await p.waitForSelector('#merch-kutte .patch');
    await p.click('#merch-back');
    pruefe('Merch zurück in die Tour', !(await p.isHidden('#view-history')));
    await p.click('#tour-tab-kraft');
    // Backstage
    await p.click('#go-backstage');
    pruefe('⚙ öffnet Backstage auf Persönlich', !(await p.isHidden('#view-backstage')) && !(await p.isHidden('#bs-persoenlich')));
    pruefe('Persönlich: Bestleistungen, Injury, Prüfwerte', !!(await p.$('#bs-persoenlich #pers-rekorde')) && !!(await p.$('#bs-persoenlich #pers-verletzungen .inj')) && !!(await p.$('#bs-persoenlich #pers-checks')));
    await p.click('#bs-tab-orte');
    pruefe('Orte: Liste', !!(await p.$('#bs-orte #gym-liste details')));
    await p.click('#bs-tab-verbindungen');
    pruefe('Verbindungen: Status', !!(await p.$('#bs-verbindungen #conn-box .conn')));
    await p.click('#bs-tab-app');
    await p.click('#bs-app [data-thema="hell"]');
    pruefe('App: Thema hell wirkt', (await p.getAttribute('html', 'data-theme')) === 'light');
    await p.click('#bs-app [data-thema="dunkel"]');
    await p.screenshot({ path: BILDER + 'bs-app.png', fullPage: true });
    await p.click('#bs-back');
    pruefe('‹ führt in die Tour, Reiter Kraft gemerkt', !(await p.isHidden('#view-history')) && (await sichtbar(p)).join() === 'tour-kraft');
    await p.click('#hist-back');
    await p.click('#go-history');
    await p.waitForTimeout(400);
    pruefe('erneut geöffnet: Reiter gemerkt', (await sichtbar(p)).join() === 'tour-kraft');
    // Injury speichern ueber den Backstage
    await p.click('#go-backstage');
    await p.click('#bs-tab-persoenlich');
    await p.selectOption('#pers-verletzungen .inj .inj-status', 'ruhend');
    await p.click('#pers-speichern');
    await p.waitForTimeout(1500);
    const conf = [...geschrieben].reverse().find(g => g.path === 'config.json');
    pruefe('Speichern im Backstage schreibt config.json', conf && conf.data.injuries[0].bis === '2026-10-01');
    pruefe('keine Seitenfehler', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  for (const theme of ['dunkel', 'hell']) {
    for (const [breite, schrift] of [[390, null], [360, 'sehr'], [1280, null]]) {
      const { ctx, p, fehler } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01', breite, hoehe: 900, schrift, theme });
      await p.click('#go-history');
      await p.waitForSelector('#hist-kalender .zelle');
      const tag = `${theme}/${breite}${schrift ? '/sehr' : ''}`;
      for (const r of ['ueberblick', 'kraft', 'koerper', 'rad', 'einheiten']) {
        await p.click(`#tour-tab-${r}`);
        await p.waitForTimeout(150);
        const u = await ueberlauf(p);
        if (u.scroll) pruefe(`${tag} Tour/${r}: kein Überlauf`, false, JSON.stringify(u));
      }
      await p.click('#tour-tab-ueberblick');
      await p.evaluate(() => window.scrollTo(0, 600));
      await p.waitForTimeout(150);
      const klebt = await p.evaluate(() => {
        const k = document.querySelector('#view-history .head').getBoundingClientRect();
        const l = document.querySelector('#tour-reiter').getBoundingClientRect();
        return k.top <= 1 && Math.abs(l.bottom - k.bottom) <= 1;
      });
      pruefe(`${tag}: Kopf mit Reiterleiste klebt oben`, klebt);
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.screenshot({ path: BILDER + `tour-${theme}-${breite}${schrift ? '-sehr' : ''}.png` });
      await p.click('#go-backstage');
      for (const r of ['persoenlich', 'orte', 'verbindungen', 'app']) {
        await p.click(`#bs-tab-${r}`);
        await p.waitForTimeout(150);
        const u = await ueberlauf(p);
        if (u.scroll) pruefe(`${tag} Backstage/${r}: kein Überlauf`, false, JSON.stringify(u));
      }
      await p.click('#bs-tab-persoenlich');
      await p.screenshot({ path: BILDER + `bs-${theme}-${breite}${schrift ? '-sehr' : ''}.png` });
      pruefe(`${tag}: kein Überlauf, keine Seitenfehler`, !fehler.length, fehler.join(' | '));
      await ctx.close();
    }
  }

  /* Rad-Reiter: Kopfzahlen, Kadenz gegen das Ziel, Ø gegen NP, Werte je Fahrt */
  {
    const KADENZ = [72, 63, 78, 64, 71, 78, 79, 81];
    const WATT = [125, 97, 99, 117, 133, 130, 115, 116];
    const NP = [131, 101, 103, 131, 143, 143, 126, 124];
    const fahrten = KADENZ.map((k, i) => ({ id: 'z' + i, type: 'VirtualRide', name: `Zwift ${i + 1}`,
      start_date_local: `2026-09-${String(10 + i * 2).padStart(2, '0')}T18:00:00`, moving_time: 1800 + i * 300, distance: 15000,
      icu_training_load: 40 + i * 3, icu_intensity: Math.round(NP[i] / 142 * 100), icu_average_watts: WATT[i], icu_weighted_avg_watts: NP[i],
      average_heartrate: 110 + i, average_cadence: k, calories: 200 + i * 20, icu_ftp: 142,
      icu_zone_times: [{ id: i % 3 ? 'Z2' : 'Z4', secs: 1200 }, { id: 'Z3', secs: 300 }],
      icu_rpe: [4, 3, 5, 7, 8, 7, 5, 4][i], feel: [2, 3, 2, 4, 4, 3, 2, 1][i],
      icu_achievements: i === 7 ? [{ type: 'BEST_POWER', secs: 1200, watts: 135, message: 'Neuer 20-min-Bestwert: 135 W' }, { secs: 5, watts: 410 }]
        : i === 4 ? [{ message: '<b>fett</b>' }] : undefined }));
    // Fitness mit steiler Rampe zuletzt
    const wellness = Array.from({ length: 20 }, (_, i) => ({ id: `2026-09-${String(10 + i).padStart(2, '0')}`, ctl: 30 + i, atl: 32 + i, rampRate: i === 19 ? 9.2 : 4 }));
    // Die Reiterleiste scrollt absichtlich seitlich; gezaehlt wird nur der Rad-Bereich
    const querlauf = async p => {
      const w = await p.evaluate(() => document.documentElement.clientWidth);
      const raus = await p.$$eval('#tour-rad *', (l, w) => l.filter(el => el.getClientRects().length && el.getBoundingClientRect().right > w + 1)
        .map(el => el.tagName).slice(0, 5), w);
      const scroll = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      return { scroll, raus };
    };
    const zurRad = async p => {
      await p.click('#go-history');
      await p.click('#tour-tab-rad');
      await p.waitForSelector('#hist-rad .fahrt .werte', { timeout: 8000 });
    };
    for (const [breite, schrift, theme] of [[390, null, 'dunkel'], [320, 'sehr', 'hell'], [1280, null, 'hell']]) {
      const tag = `Rad ${breite}${schrift ? '/sehr' : ''}/${theme}`;
      const { ctx, p, fehler } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01', breite, schrift, theme, fahrten, wellness });
      await zurRad(p);
      const kopf = await p.$$eval('#hist-rad .stats .stat', l => l.map(s => s.querySelector('.n').textContent + '=' + s.querySelector('.v').textContent.replace(/\s+/g, ' ').trim()));
      pruefe(`${tag}: Kopfzahlen mit Last, Energie, Ø Leistung`, kopf.some(x => x.startsWith('Last gesamt=')) && kopf.includes('Energie=2.160 kcal')
        && kopf.some(x => /^Ø Leistung=\d+ W$/.test(x)), kopf.join(' | '));
      pruefe(`${tag}: Anteil an der FTP`, /% der FTP \(142 W\)/.test(await p.textContent('#hist-rad .stats')));
      const satz = (await p.textContent('#hist-rad .kadenz .fine')).trim();
      pruefe(`${tag}: Kadenz — die letzten drei am Ziel`, satz === 'Die letzten 3 Fahrten am Ziel — ab 78 rpm zählt.', satz);
      pruefe(`${tag}: Kadenz-Punkte, drei grün`, (await p.$$eval('#hist-rad .kadenz circle', l => l.length)) === 8
        && (await p.$$eval('#hist-rad .kadenz circle.am', l => l.length)) === 4);
      pruefe(`${tag}: Ø gegen NP — acht Paare`, (await p.$$eval('#hist-rad .np rect.watt', l => l.length)) === 8
        && (await p.$$eval('#hist-rad .np rect.np', l => l.length)) === 8);
      const np = (await p.textContent('#hist-rad .np .fine')).trim();
      pruefe(`${tag}: NP-Satz`, /^NP liegt im Schnitt \d+ % über Ø — (gleichmäßig|wechselhaft)/.test(np), np);
      const erste = (await p.textContent('#hist-rad .fahrt .werte')).replace(/\s+/g, ' ');
      pruefe(`${tag}: Werte der jüngsten Fahrt`, /Z2/.test(erste) && /Ø 116 W/.test(erste) && /NP 124 W/.test(erste) && /IF 0,87/.test(erste)
        && /♥ 117/.test(erste) && /81 rpm/.test(erste) && /RPE 4/.test(erste) && /Gefühl stark/.test(erste) && /★ Bestwert/.test(erste), erste);
      const best = await p.$$eval('#hist-rad .bestliste li .best-was', l => l.map(x => x.textContent.trim()));
      pruefe(`${tag}: Bestwerte — Text, Dauer und Watt, neueste zuerst`, best.join(' | ') === 'Neuer 20-min-Bestwert: 135 W | 5 s: 410 W | <b>fett</b>', best.join(' | '));
      pruefe(`${tag}: Bestwerte ohne eingeschleustes HTML`, !(await p.$('#hist-rad .bestliste b')));
      const rpe = (await p.textContent('#hist-intensitaet').catch(() => '')).replace(/\s+/g, ' ');
      pruefe(`${tag}: Plan gegen Ist ohne Plan — keine RPE-Zeile erfunden`, !/Gefühlt: $/.test(rpe));
      await p.click('#tour-tab-koerper');
      await p.waitForSelector('#hist-form .rampe', { timeout: 6000 }).catch(() => {});
      const rampe = (await p.textContent('#hist-form .rampe').catch(() => '')).trim();
      pruefe(`${tag}: Rampe zu steil`, rampe === 'Rampe +9,2 pro Woche — zu steil. Über 8 kommen Sehnen und Gelenke nicht mehr mit.', rampe);
      const kr = (await kontraste(p, '#hist-form .rampe')).filter(x => x.wert < 4.5);
      pruefe(`${tag}: Rampe Kontrast ≥ 4,5`, !kr.length, JSON.stringify(kr));
      await p.click('#tour-tab-rad');
      const k = (await kontraste(p, '#hist-rad .stat .n, #hist-rad .stat .s, #hist-rad .radbar .t, #hist-rad .radbar .r, #hist-rad .legende span, #hist-rad .radbar .fine, #hist-rad .chip, #hist-rad .zone, #hist-rad .bestliste span'))
        .filter(x => x.wert < 4.5);
      pruefe(`${tag}: Kontrast ≥ 4,5`, !k.length, JSON.stringify(k.slice(0, 4)));
      const u = await querlauf(p);
      pruefe(`${tag}: kein Querlauf`, !u.scroll && !u.raus.length, JSON.stringify(u));
      await p.locator('#tour-rad').screenshot({ path: BILDER + `rad-${breite}-${theme}${schrift ? '-sehr' : ''}.png` });
      pruefe(`keine Seitenfehler (${tag})`, !fehler.length, fehler.join(' | '));
      await ctx.close();
    }
    // Eigenes Ziel aus der Konfiguration, im Backstage gespeichert
    {
      const { ctx, p, fehler, geschrieben } = await kontext(browser, { logs, config: { ...CONFIG, rad: { kadenzZiel: 82 } }, heute: '2026-10-01', fahrten });
      await zurRad(p);
      const satz = (await p.textContent('#hist-rad .kadenz .fine')).trim();
      pruefe('Rad: Ziel 82 aus der Konfiguration', satz === 'Die letzte Fahrt am Ziel — ab 80 rpm zählt.', satz);
      await p.click('#go-backstage');
      await p.click('#bs-tab-persoenlich');
      pruefe('Backstage: Ziel steht im Feld', (await p.inputValue('#pers-kadenz')) === '82');
      await p.fill('#pers-kadenz', '85');
      await p.click('#pers-speichern');
      await p.waitForTimeout(600);
      const cfg = geschrieben.filter(g => g.path === 'config.json').pop();
      pruefe('Backstage: Ziel in config.json', cfg && cfg.data.rad && cfg.data.rad.kadenzZiel === 85, JSON.stringify(cfg && cfg.data.rad));
      pruefe('keine Seitenfehler (Rad-Ziel)', !fehler.length, fehler.join(' | '));
      await ctx.close();
    }
    // Englisch
    {
      const { ctx, p } = await kontext(browser, { logs, config: CONFIG, heute: '2026-10-01', breite: 360, schrift: 'sehr', fahrten,
        vorher: c => c.addInitScript(() => localStorage.setItem('setlist.sprache', 'en')) });
      await zurRad(p);
      const text = (await p.textContent('#hist-rad')).replace(/\s+/g, ' ');
      pruefe('EN: Rad auf Englisch', /Total load/.test(text) && /The last 3 rides on target/.test(text) && /Avg watts vs NP/.test(text) && /IF 0.87/.test(text), text.slice(0, 200));
      const u = await querlauf(p);
      pruefe('EN 360/sehr: Rad kein Querlauf', !u.scroll && !u.raus.length, JSON.stringify(u));
      await ctx.close();
    }
  }
}
