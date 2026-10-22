# Setlist — Hinweise für die Arbeit an diesem Repo

## Arbeitsweise (Kontingent)

Privates Abo, das Kontingent ist schnell leer. Daniel neigt dazu, überall Opus zu nehmen, weil er es von der Arbeit gewohnt ist.

- Sag zu Beginn jeder neuen Aufgabe in einem Satz, welches Modell reicht (Haiku, Sonnet oder Opus). Standard ist Sonnet. Opus nur bei wirklich schwerer Aufgabe oder nach zwei gescheiterten Sonnet-Versuchen. Läuft er auf einem größeren Modell als nötig, sag es.
- Weise auf den Plan-Modus hin, wenn die Aufgabe mehrere Dateien oder Schritte betrifft oder schwer rückgängig zu machen ist. Erst Plan, Freigabe, dann Umsetzung. Bei kleinen Änderungen an einer Datei kein Plan nötig.
- Lies nur die Dateien, die du für die Aufgabe brauchst. Keine Subagents ohne Aufforderung. Sag Bescheid, wenn die Session so lang ist, dass ein Neustart mit /clear sinnvoll wäre.
- Kommunikation auf Deutsch, kurz und konkret.

## Lizenz und Autor
- Lizenz: **MIT** (`LICENSE`). Copyright-Zeile „Copyright (c) <erstes Jahr>[–<aktuelles Jahr>] cyphomat“; ein Bereich erst, wenn die Jahre verschieden sind.
- Autor erscheint **nur** als „@cyphomat“, verlinkt auf https://github.com/cyphomat.
- **Kein Klarname, keine E-Mail-Adresse**: nirgends, weder in Lizenz, README, App-Texten, Code-Kommentaren, Tests noch im CHANGELOG. Statt eines Namens „der Autor“ oder „@cyphomat“.
- Feedback geht als Issue ans Original: https://github.com/cyphomat/setlist/issues. Im Fork zeigt der Quelltext-Link auf den Fork (`js/aktualisierung.js`).

## Daten
- Private Datenrepos (z. B. `cyphomat/setlist-data`) nie anfassen.
- Zwei Betriebsarten mit denselben Pfaden: lokal (IndexedDB, `js/lokal.js`) oder GitHub-Repo. Jeder Datenzugriff läuft über `js/store.js` (`readFile`, `writeFile`, `readAllLogs`, `listeOrdner`, `alleDateien`), nie direkt.
- Der Zustand wird aus den Logs abgeleitet (`deriveState`). Änderungen am Programm laufen als Log-Eintrag (`type: 'anpassung'`), nie durch Überschreiben von `state.json`.

## Oberfläche
- Zweisprachig: jeder sichtbare Text über `js/i18n.js`, deutsch und englisch, mit gleichen Platzhaltern. `t()` maskiert nicht: Werte aus Daten mit `escHtml`, Links mit `sicherLink`.
- Externe Links mit `target="_blank" rel="noopener noreferrer"`. Keine Abrufe an neue Hosts; die CSP in `index.html` bleibt, wie sie ist.
- Nur vorhandene Farbtokens (`--fg`, `--muted`, `--akzent` …). Neue Texte und Links in beiden Themen auf Kontrast ≥ 4,5:1 prüfen.
- Prüfen bei 320, 390 und 1280 px, in beiden Themen und mit „Sehr groß“: kein Querlauf.
- Jeder Aufnäher hat ein eigenes Motiv (auch jede Stufe). Ein neuer Aufnäher braucht ein Motiv in `tools/pixel.mjs` und einen Eintrag in `BILDER` (`js/merch.js`); der Bau bricht bei fehlendem oder doppeltem Bild ab.
- Pixel-Grafiken nur über `tools/pixel.mjs` (Quellen in `tools/pixel/`), nie die Bögen in `assets/pixel/` von Hand ändern; `node tools/pixel.mjs --pruefe` muss grün sein. Bewegung (Feuer, Ansager) respektiert `prefers-reduced-motion`.

## Dokumentation
- Beide READMEs (`README.md`, `README.en.md`) gleich gliedern; Abzeichen in beiden.
- Jede Auslieferung bekommt einen CHANGELOG-Eintrag.

## Release
- `version.json` und `CACHE` in `sw.js` immer gemeinsam setzen (entspricht dem obersten CHANGELOG-Eintrag); nur wenn sich ausgelieferter Code ändert. Neue Module in die `SHELL`-Liste von `sw.js`.
- Vor jedem Push: `node tools/tests.mjs` (muss grün sein) und `node tools/proben.mjs` (Browserproben, braucht Playwright).
- Testzahl im Abzeichen und im Abschnitt „Tests“ beider READMEs aktuell halten.
