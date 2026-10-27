# Changelog

Alle nennenswerten Änderungen an Setlist. Neueste zuerst.

Die Versionsnummer ist das Datum plus eine laufende Zahl (`2026-09-01.73`). Sie steht
in `version.json` und im Cache-Namen von `sw.js` — beide werden gemeinsam gesetzt,
sonst merkt die installierte App nichts von einer neuen Fassung.

<sub>Deutsch · <a href="README.en.md">English README</a></sub>

---

## 2026-10-27.6

### Behoben
- **Das Kugel-Feld zeigt kein Auf/Ab-Rädchen mehr.** Der Browser legte es über das „kg" und doppelte − und +.
  Gilt für den Kurs und für Mosh Pit.

## 2026-10-27.5

### Neu
- **Kugel-Platten.** Eine zweite Reihe an der Studiowand, nur aus dem Gewicht von Kurs und Mosh Pit:
  Eisen (10 t), Stahl (25 t), Titan (50 t) und Meteorit (100 t). Die Reihe erscheint erst nach der ersten
  Kurs- oder Mosh-Pit-Einheit. Über Diamant gibt es jetzt eine Top-Stufe: **Adamant** bei 1000 t.
- **Kugel-Rang.** Vier Stufen nach Wochen mit Kurs oder Mosh Pit (1, 4, 12, 26): Eisenkind, Lehrling,
  Schmied, Eisenmeister, mit je einem Aufnäher. Der normale Rang bleibt, wie er ist.
- **Kurs-Endgegner: der Kugel-Titan.** Jeder geschaffte Check (Woche 4, 8, 12) nimmt ein Drittel der
  Lebensleiste; sind alle drei geschafft, ist er besiegt. Eigenes Pixelbild, Karte im Merch-Stand, Ansage
  „ENDGEGNER BESIEGT" und ein Aufnäher.
- **Zu zweit mit der Kugel.** Drei Aufnäher für Kurs, Check und Mosh Pit an einem Tag mit Verabredung.

## 2026-10-27.4

### Neu
- **Belohnungen für Kettlebell-Kurs und Mosh Pit.** Dreizehn neue Aufnäher mit eigenem Pixelbild:
  Kurs-Debüt, Fundament, Grundlage und Ausbau (12, 24, 36 Einheiten), Check 1 bis 3 (nur mit
  „geschafft"), Schwerere Kugel (erste und fünfte Erhöhung im selben Baustein), Mosh-Pit-Debüt,
  Kugelsprung und Pit-Serie (3 und 6 Einheiten in Folge, alle Lifts geschafft). Sie erscheinen erst,
  wenn es einen Kurs- oder Mosh-Pit-Log gibt.
- **Bewegtes Gewicht zählt auch bei der Kugel.** Kurs (aus Plan und eingetragener Kugel) und Mosh Pit
  (Kugel × Wiederholungen × erledigte Sätze, einarmig doppelt) fließen in die Tonnen. Damit laufen
  Gold, Platin, Doppelplatin und Diamant sowie Hohlkörper, Kopflos und Goldene Axt auch über die Kettlebell.

## 2026-10-27.3

### Neu
- **Kettlebell Mosh Pit.** Das Folgeprogramm nach dem Kurs: drei feste Lifts (Swing, Goblet Squat,
  einarmiges Drücken), je drei Sätze, doppelte Progression wie beim 5x5. Die Leiter läuft 10 → 12 → 15 → 17 → 20
  Wiederholungen; wer alle Sätze schafft, steigt eine Sprosse, nach 20 folgt eine um 4 kg schwerere Kugel
  und es geht bei 10 weiter. Zweimal nicht geschafft: eine Stufe zurück. Das nächste Ziel folgt aus den
  Logs (`type: 'moshpit'`), gespeichert wird nur die Einheit. Der Knopf erscheint, sobald der Kurs fertig ist.
  Pausenuhr zwischen den Sätzen; Verlauf, Bestwert, Erfolge und Serie stehen in Tour › Kugel.
  Leiter und Schrittweite sind Planung, nicht aus einer Studie.

## 2026-10-27.2

### Neu
- **Kettlebell-Kurs mit Kugel in kg.** Vor jeder Einheit trägst du je Baustein ein, mit welcher
  Kugel du arbeitest (Schritt 2 kg, Eingabe frei). Die letzte Kugel ist vorbelegt. Das Log
  speichert sie (`kugeln`), der neue Reiter **Tour › Kugel** zeigt Verlauf, höchste Kugel und
  Zahl der Einheiten je Übung.
- **Uhren.** Die Führung zeigt oben die Gesamtzeit, bei Sätzen eine Stoppuhr, bei Takt, Pause
  und Tragen einen Countdown. Tragen läuft je Seite mit Signal beim Wechsel.
- **Zwischentests.** Woche 4 (Check 1: 100 beidarmige Swings in fünf Minuten, zwei Get-ups je Seite) und
  Woche 8 (Check 2: 100 einarmige Swings, vier Get-ups je Seite) ersetzen den Tag C; Woche 12
  bleibt der Abschlusstest. Am Ende fragt die App, ob alles im Takt geschafft wurde; die Checks
  stehen mit Datum, Kugel und Ergebnis im Reiter Kugel.
- Übungsnamen und Cues stehen jetzt auf Englisch (Hip Hinge, Swing, Goblet Squat …), Erklärung,
  Standard und Varianten bleiben deutsch.

## 2026-10-27.1

### Neu
- **Kettlebell-Kurs.** Zwölf Wochen, drei Einheiten pro Woche, in drei Phasen: Fundament (Hüfte,
  Swing, Goblet, Get-up), Grundlage (einarmig, Clean, Drücken) und Ausbau (Dichte, Komplexe,
  Test in Woche 12). Die vierte Woche jeder Phase ist Entlastung. Die Einheit führt durch: Sätze
  hakst du selbst ab, Takt und Pausen laufen nach der Uhr. Am Ende sagst du, wie die Kugel war;
  zweimal „zu leicht“ in Folge schlägt die schwerere Kugel vor, zweimal „zäh“ die leichtere.
  Woche und Tag folgen aus den Logs (`type: 'kurs'`), gespeichert wird nur die Einheit. Der Plan
  ist eigene Planung nach gängigen Prinzipien, keine einzelne Studie; belegt ist nur, dass Swings
  Maximal- und Schnellkraft steigern (Lake & Lauder 2012, kleine Studie). Die Einheit zählt als
  Gig für Rang, Abzeichen und Gitarren und geht wie der Jam an intervals.icu.
- Die Einheit steht im Export (`art: kurs`), in der Historie und in der Tour.

## 2026-10-26.3

### Behoben
- **Zahlen folgen jetzt überall der Sprache.** In der Detailzeile der Erholung stand „Schlaf 7.9 h“, im Chip darüber „7,9 h“; ähnlich in der W/kg-Kurve („−0.01“), beim Gewicht, bei der
  Tonnage, beim Effizienzfaktor und in den Verhältnissen. Alle sichtbaren Zahlen laufen nun über
  `dez()` in `js/i18n.js`: Komma auf Deutsch, Punkt auf Englisch, feste Nachkommastellen.
  Koordinaten in den Grafiken bleiben bewusst bei `toFixed`.

## 2026-10-26.2

### Behoben
- **eFTP und HRV kamen bei Konten mit Apple-Health-Quelle nie an.** Die App las `eftp` und
  `hrv` vom Wellness-Tag, die echte Antwort trägt die eFTP aber je Sportart in `sportInfo`
  und die Apple-Health-HRV in `hrvSDNN`. Folge: keine W/kg-Kurve, keine Wattziele aus der
  eFTP, kein HRV-Hinweis. Jetzt wird die eFTP aus `sportInfo` gelesen (Ride vor VirtualRide
  und den anderen Rad-Arten, sonst das Feld am Tag) und die HRV aus der Reihe, die mehr
  Werte hat.
- **SDNN und RMSSD werden nicht mehr gemischt.** Beide Reihen haben eigene Basiswerte. Weil
  SDNN stärker schwankt, warnt die App erst unter 75 % des eigenen Schnitts (RMSSD: wie
  bisher unter 85 %). An einem Konto über 61 Tage gemessen hätte 85 % an jedem fünften Tag
  Alarm gegeben, 75 % an etwa jedem zwanzigsten. Die Anzeige sagt „HRV (SDNN)“, wenn es
  SDNN ist.

## 2026-10-26.1

### Neu
- **Gitarrenrack im Merch-Stand.** Zehn Pixel-Gitarren — Proberaum-Brett, Kellerkind, Offset
  Blues, Nachtfalke, Eiszacke, Stahlstern, Sieben Siegel, Hohlkörper, Kopflos und die Goldene
  Axt — hängen auf einer Schiene, mit dem Tag, an dem sie dazukamen. Gekauft wird nichts:
  sieben schalten sich mit den Rängen frei (erste Einheit, 4, 12, 26, 52, 104 und 208 Wochen),
  drei mit den Schallplatten (Platin, Doppelplatin, Diamant). Es gibt keinen Kontostand und
  keine neue Datei im Datenrepo; wie bei den Aufnähern wird alles aus den Einheiten
  abgeleitet. Zu sehen sind nur die, die hängen, und die nächste fehlende als dunkle
  Silhouette mit ihrer Bedingung.
- **Neue Gitarre nach der Einheit.** Das Abschlussbild zeigt sie in einem eigenen Block, auch
  wenn dabei kein Aufnäher dazukam; der Ansager ruft „NEUE GITARRE“ aus (nach Rang und
  Endgegner, vor dem Aufnäher).
- Die Gitarren sind eigene, generische Formen ohne Marken- oder Modellnamen. Gezeichnet
  werden sie von `tools/pixel-gitarren.mjs` in den Bogen `assets/pixel/gitarren.png`
  (24 × 56 Pixel je Gitarre, am Boden ausgerichtet).

### Hinweise
- Wer schon viele Wochen oder Tonnen hat, bekommt beim ersten Öffnen mehrere Gitarren auf
  einmal im Rack; die Meldung nach der Einheit erscheint nur für die, die diese Einheit
  neu brachte.
- Zwei Prüfungen halten die Texte offen: Für jede Gitarre müssen Name, Typ und Bedingung in
  beiden Sprachen da sein, und der Bogen wird beim Bau gegen die Liste in `js/gitarren.js`
  geprüft.

## 2026-10-23.3

### Neu
- **Jam zu zweit (I go, you go).** Im Jam schaltet ein Chip „Zu zweit“ das Wechseltraining
  ein, an einem Gerät und ohne Check-in. Eine Person arbeitet, die andere ruht: groß steht,
  wer dran ist, vor dem ersten Wechsel wählt man, wer anfängt, und mit „Wechsel“ in der
  Uhrleiste tauscht man; die Uhr läuft durch. Gezählt wird beim Wechsel, getrennt für „du“
  und „Partner“. Das passt zu jedem Format: ein Durchgang ist bei AMRAP und Chipper eine
  Runde, bei EMOM und Tabata ein Intervall. Ins Log kommt am Ende nur die Bilanz
  (`zuZweit`: Durchgänge je Person und Zahl der Wechsel, als gedeckelte ganze Zahlen); das
  Abschlussbild zeigt sie in einer Zeile. Es entsteht keine Datei unter `zusammen/` und
  kein Aufnäher.

### Behoben
- **„Abschließen“ lag im Jam unter der Uhrleiste.** Die feste Leiste ist rund 100 Pixel
  hoch, unter dem Knopf blieben aber nur 28 Pixel Platz; am Seitenende war er vollständig
  verdeckt. Jetzt ist genug Abstand da.

## 2026-10-23.2

### Neu
- **Zusammen trainieren.** In der Einheit gibt es unter der Ansage „Zu zweit trainieren?“:
  einchecken, mit wem man heute trainiert. Das ist eine Datei im Datenrepo
  (`zusammen/JJJJ-MM-TT-<Kennung>.json`), getrennt von den Einheiten; sie ändert nichts am
  Programm. Eine gemeinsame Einheit ist eine Verabredung **plus** eine Einheit am selben Tag.
  Wer nur eincheckt und nicht trainiert, bekommt nichts. Auch ohne Netz: der Check-in wird
  nachgetragen.
- **I go, you go.** Wer eingecheckt hat, sieht in der Pause „Max ist dran“, der Knopf heißt
  „Fertig“, und läuft die Zeit ab, steht dort „Du bist dran“. Nur Beschriftung der
  bestehenden Pausenleiste, nichts wird gespeichert.
- **Handschlag.** Beide bestätigen die Verabredung über zwei Links, die sie sich selbst
  schicken (Teilen-Menü oder Kopieren) und in der App einfügen — oder öffnen. Es gibt keinen
  Server dazwischen; im Link stehen nur Kennung, Schritt und Name. Eine Einladung wird nie
  ungefragt angenommen. „Bestätigt“ heißt: beide Telefone waren beteiligt, nicht
  fälschungssicher. Einladungen aus fremden Links werden streng geprüft (Kennung, Schritt,
  Namenslänge, Steuer- und Richtungszeichen) und nur als Text angezeigt.
- **Acht neue Aufnäher** mit eigenem Pixelbild je Stufe: Duett (erste gemeinsame Einheit),
  Faustgruß (von beiden bestätigt), Tourpartner (5, 15, 30 gemeinsame Tage) und feste
  Verabredung (2, 4, 8 Wochen in Folge). Sie erscheinen erst, wenn es eine Verabredung gibt —
  wer allein trainiert, sieht keine leeren Kreise. Gezählt werden Tage und Wochen; es gibt
  keinen Vergleich zwischen Personen.
- **Minierfolg** „Zu zweit trainiert, mit …“ auf dem Abschlussbild.
- Unter Backstage → Persönlich: der eigene Name für Trainingspartner.
- Die Sicherung nimmt `zusammen/` mit; beim Einlesen geht eine Verabredung nur von offen auf
  bestätigt, nie zurück.

### Hinweise
- Ein Check-in lässt sich nicht zurücknehmen; die App kann Dateien im Datenrepo nicht löschen.
  Ohne Einheit am selben Tag zählt er aber nicht.
- Ein neuer Test prüft für jeden Aufnäher im Katalog, dass Name und Bedingung in beiden
  Sprachen existieren.

## 2026-10-23.1

### Neu
- **Eigener Einstieg im Warm-up.** Unter Backstage → Persönlich steht jetzt ein Abschnitt
  „Warm-up": Art und Minuten, zum Beispiel „Rudern, 15". Der Einstieg ersetzt die erste
  Zeile des Soundchecks (die Cardio-Zeile „3 Min Rudergerät, Seil oder Fahrrad"); alles
  andere im Soundcheck bleibt. Ohne Eintrag ändert sich nichts. Gespeichert wird er pro
  Person in der `config.json` unter `warmup.einstieg`. Art höchstens 40 Zeichen, Minuten
  von 1 bis 60; alles andere wird beim Speichern verworfen. Die Zeit zählt zur Dauer der
  Einheit wie bisher (Start bis Ende).

## 2026-10-22.2

### Behoben — Sicherheit
- **Felder aus eingelesenen Sicherungen werden überall maskiert.** Seit man Sicherungen
  einlesen kann, können Einheiten aus einer fremden Datei stammen. An vier Stellen
  (Ansage gegen Gefühl in der Tour, Fertig-Ansicht, WOD-Abschluss, Programm auf Home)
  standen Workout-Name und Datum ohne Maskierung im HTML. Code konnte darüber wegen der
  Content-Security-Policy nie laufen, aber fremdes HTML wäre sichtbar gewesen. Jetzt
  erscheint es als Text.
- **Einheiten mit falschen Feldtypen werden beim Einlesen verworfen.** Ein Workout-Name,
  der kein Text ist, oder `lifts`, das keine Liste ist, ließ die Tour früher beim
  Anzeigen scheitern. Solche Einheiten fallen jetzt heraus und werden als verworfen
  gezählt, wie schon bei einem kaputten Datum.

Abhängigkeiten gibt es nach wie vor keine, die Actions sind auf Commits festgelegt.

---

## 2026-10-22.1

### Neu
- **Ruhepuls und Befinden fließen in die Ansage ein.** Liegt der Ruhepuls 7 Schläge über
  deinem Schnitt der Tage davor, oder hast du in intervals.icu starken Muskelkater oder
  große Müdigkeit eingetragen, sagt die App TECHNIK an und nennt den Grund. Das Instrument
  „Erholung“ auf Home zeigt Ruhepuls, Schlafwert, Muskelkater und Müdigkeit.
- **Rampe unter Fitness und Ermüdung.** Wie schnell deine Fitness je Woche steigt, mit
  Einordnung: ruhiger Aufbau, steil, oder über 8 zu steil für Sehnen und Gelenke.
- **RPE und Gefühl je Fahrt.** Was du in intervals.icu einträgst, steht an jeder Fahrt;
  bei *Plan gegen Ist* steht der Ø RPE der Fahrten im Ziel und daneben.
- **Rad-Bestwerte.** Neue Leistungs-Bestwerte, die intervals.icu je Fahrt meldet, stehen
  gesammelt unter *Tour → Rad*, und die Fahrt trägt einen Stern.

Die neuen Feldnamen stammen nicht aus der offiziellen API-Beschreibung, sondern aus
Community-Quellen. Fehlt ein Feld oder kommt es anders, fällt die Anzeige still weg.

---

## 2026-10-21.2

### Neu
- **Mehr aus intervals.icu unter *Tour → Rad*.** Zu Fahrten und Zeit im Sattel kommen
  die Last gesamt, die Energie in kcal und die Ø Leistung, nach Minuten gewichtet und mit
  dem Anteil an der FTP.
- **Trittfrequenz gegen ein Ziel.** Ein Verlauf der Ø-Kadenz je Fahrt mit dem Ziel als
  gestrichelter Linie. Fahrten am Ziel leuchten grün, darunter steht, wie viele der
  letzten Fahrten es geschafft haben oder wie viel noch fehlt. Das Ziel stellst du unter
  *Backstage → Persönlich* ein; ohne Eintrag gilt 80 rpm, und 2 rpm darunter zählen noch.
- **Ø Watt gegen NP.** Je Fahrt ein Balkenpaar und der mittlere Aufschlag der NP. Bis
  5 % gilt die Fahrt als gleichmäßig, darüber als wechselhaft.
- **Jede Fahrt mit ihren Werten.** Ø Watt, NP, IF, Last, Puls, Kadenz und ein Abzeichen
  für die Zone mit der meisten Zeit.

Neu abgefragt werden nur zwei Felder: die mittlere Trittfrequenz und die Energie. Bei
Fahrten aus einem älteren Zwischenspeicher fehlen sie, bis die Fahrten neu geladen sind.

---

## 2026-10-21.1

### Geändert
- **Metallwinkel an den Cases.** Die Karten haben statt der kleinen Dreiecke jetzt
  Eckschoner aus zwei Schenkeln mit Lichtkante, dazu einen kräftigeren Rand und einen
  Schatten, der sie vom Boden hebt. In beiden Themen.
- **Der Wochen-Soundcheck ist ein Mischpult.** Jede Zahl der Woche hat einen Kanalzug:
  oben der Wert, darunter ein Fader. Der Fader steht gegen die eigene Bestmarke der acht
  Wochen davor; wer eine neue Bestmarke hat, schiebt ihn ganz nach oben. Die Serie
  leuchtet als Reihe von LEDs.
- **„Lief gut“ und „Hakt“ als kleine Cases.** Die Überschrift klebt als Gaffa-Streifen
  über der Kante, die Kante links ist grün bzw. rostrot.
- **Vorsätze auf einer Setlist aus Papier.** Nummeriert, mit Edding, für die nächste
  Kalenderwoche. Im Wochenkopf hängt danach derselbe Zettel, klein.
- **Archiv mit Stempel.** Frühere Soundchecks in der Tour stehen je Woche in einem Case
  mit Gaffa-Titel, die Vorsätze als Zettel, und jede Woche ist „Erledigt“ gestempelt.

### Behoben
- **Kein Zoom mehr beim Antippen auf dem iPhone.** Auswahllisten standen auf der
  Browservorgabe von etwa 13 px, und iOS zoomte beim Antippen hinein. Auf Touch-Geräten
  hat jetzt jedes Feld mindestens 16 px; größere Felder und „Sehr groß“ bleiben, wie sie sind.

---

## 2026-10-19.2

### Behoben
- **Abstand unter dem Motto auf breiten Bildschirmen.** In der zweispaltigen Ansicht
  klebte das Plakat direkt unter „Lift Heavy Shit“. Jetzt hat es dieselbe Luft wie die
  Überschrift rechts und beginnt auf einer Linie mit ihr. Auf dem Handy bleibt alles,
  wie es war.

## 2026-10-19.1

### Neu
- **Freigespielte Ränge lassen sich wieder ansehen.** Im Merch sind die schon erreichten
  Stationen der Tour-Leiste Knöpfe. Antippen zeigt die Szene groß, mit Namen und dem Tag,
  an dem der Rang freigespielt wurde. Beim aktuellen Rang steht „Dein Rang seit …“.
  Kommende Ränge bleiben dunkel und gesperrt.
- `M.rang()` liefert dazu je Rang das Datum. Es ist der Gig, mit dem die Zahl der Wochen
  die Schwelle erreichte; Fahrten zählen mit.

### Werkzeuge
- Die Probe `buehne` prüft Knöpfe, Klick, Datum, Rückweg und Kontrast.
- 1867 Tests.

## 2026-10-17.3

### Behoben
- **App-Icon: die Scheiben sitzen richtig.** Die großen Scheiben stehen jetzt innen am Bund,
  die kleinen außen, wie an einer echten Stange. Bisher war es umgekehrt. Dasselbe gilt für
  das Hantel-Emblem auf den Tourshirts und im README.

## 2026-10-17.2

### Neu
- **Setlist ohne GitHub.** Im Setup steht jetzt zuerst **Lokal starten**: kein Konto,
  kein Token, kein Repo.
  - Programm, Einheiten, Soundchecks und Notizen liegen in der IndexedDB dieses Browsers,
    mit denselben Pfaden wie im Datenrepo.
  - Die App bittet den Browser, den Speicher dauerhaft zu halten. Der Tipp „Zum
    Home-Bildschirm“ steht gleich dabei, weil Safari sonst nach sieben Tagen aufräumt.
- **Sichern und Einlesen** unter *Backstage → App → Daten*, auch im Setup:
  - Die Sicherung ist eine JSON-Datei mit allen Dateien außer `state.json`.
  - Einlesen legt dazu statt zu ersetzen. Dieselbe Einheit kommt nicht doppelt, und ein
    anderes Programm wird nur nach Rückfrage übernommen.
  - Der Zustand wird danach aus allen Einheiten neu berechnet.
  - Im lokalen Modus erinnert der Wochenkopf an eine Sicherung, wenn die letzte zwei
    Wochen her ist und seitdem trainiert wurde.
- **Aufs Gerät umziehen.** Wer mit Datenrepo trainiert, holt mit einem Knopf alles auf
  dieses Gerät und trennt GitHub. Im Repo bleibt alles liegen.

### Geändert
- Die GitHub-Betriebsart bleibt unverändert, im Setup eingeklappt unter „Oder: mit eigenem
  GitHub-Datenrepo“.
- Im lokalen Modus heißt „Zugänge entfernen“ **Alles löschen**. Die Rückfrage nennt die
  Zahl der Einheiten.
- Anfragen an GitHub ohne Token schicken keinen leeren `Authorization`-Header mehr.

### Werkzeuge
- Neu: `js/lokal.js`, `js/sicherung.js` und die Probe `lokal`. Sie prüft, dass im lokalen
  Modus keine einzige Anfrage an GitHub geht.
- Die GitHub-Attrappe der Proben liefert jetzt auch `config.json` und `state.json` im
  Dateibaum.
- 1861 Tests, 558 Probenprüfungen.

## 2026-10-17.1

### Geändert
- **Neues Logo und App-Icon aus der Pixel-Art.**
  - Der Schriftzug SETLIST ist jetzt Pixel-Blech in Bernstein mit schwarzer Kontur. Er
    steht im Kopf von Home und Setup, scharf auf doppelter Größe.
  - Das App-Icon ist eine Pixel-Hantel über einem Pixelfeuer (derselbe Algorithmus wie
    hinter SCHWER, eingefroren). Es ist ganzzahlig vergrößert und bleibt deshalb auch
    auf dem Homescreen scharf.
- **README im Pixel-Stil.**
  - Das Banner zeigt eine Bühne bei Nacht mit Stacks, Pyro, Feuerwand und Publikum, in
    der Mitte den Schriftzug.
  - Die Hauptabschnitte tragen kleine Pixel-Embleme.
  - Neu sind zwei Bildstreifen: die sieben Rangszenen und das Merch-Regal mit Shirts,
    Gold und Platin und einer Reihe Aufnäher.

### Werkzeuge
- `tools/pixel.mjs` baut jetzt alle Pixel-Grafiken, auch Logo, Icons und README-Bilder;
  `--pruefe` deckt sie in der Action mit ab. `tools/icon-gen.py` und
  `assets/banner.svg` entfallen.
- Die Probe `start` prüft Schriftzug und App-Icons.
- 1796 Tests, 520 Probenprüfungen.

## 2026-10-16.3

### Geändert
- **Tourshirts als echte Bandshirts.** Statt einer Liste mit einem flachen Icon hängt
  jedes Quartal als Pixel-Shirt im Merch.
  - Der Tourname macht das Shirt: das erste Wort die Stofffarbe (Molten bordeaux,
    Electric navy, Savage oliv …), das zweite das Emblem auf der Brust (Hantel,
    Scheibe, Amboss, Gitarre, Flammen, Verstärker … zwölf Motive).
  - Vorne steht ein Siebdruck mit SETLIST, Emblem, Tourname und Quartal, die laufende
    Tour trägt einen „Live“-Sticker. Hinten stehen die Tourdaten wie auf jedem
    Tourshirt. „Rückseite zeigen“ dreht das Shirt um, ohne Animation bei „Bewegung
    reduzieren“.
  - Die volle Liste mit Art und Ort lässt sich darunter aufklappen.
- **Gold und Platin als gerahmte Auszeichnungen.** Jede Stufe ist eine eigene Plakette
  an der Studiowand: schwarzer Rahmen, Samtgrund, die Scheibe mit Rillen und farbigem
  Label, darunter ein Messingschild. Doppelplatin trägt zwei Scheiben, Diamant einen
  Stein. Was noch fehlt, hängt schon da, nur abgedunkelt.

### Werkzeuge
- `tools/pixel.mjs` baut dazu `shirts.png` (12 Stoffe, vorne und hinten),
  `embleme.png` (12 Motive, alle verschieden) und `platten.png`.
- Die Probe `merch` prüft Shirt und Wand: Druck vom Tournamen, Wenden, Kontrast der
  Tinte gegen den hellsten Stoffpixel jedes Shirts, abgedunkelte offene Plaketten.
- 1796 Tests, 518 Probenprüfungen.

## 2026-10-16.2

### Neu
- **Monats-Tour mit Endgegner.** Jeden Monat drei Ziele aus dem eigenen Wochenplan:
  - die geplanten Krafteinheiten;
  - die geplanten Fahrten, ohne Rad stattdessen vier Tage Jam, Unplugged oder Mobility;
  - halb so viele saubere Einheiten.

  Am Ende wartet der Endgegner des Monats (Frostriese, Eisgeist, … Krampus), ein
  gehörnter Pixelschädel mit einer Lebensleiste in drei Teilen. Tage vor der ersten
  Einheit und in einer Verletzungspause zählen nicht zum Soll; ein Monat ganz in der
  Pause hat keinen Gegner. Die Karte steht im Merch über der Kutte, frühere Monate
  lassen sich aufklappen. Im Wochenkopf steht „Oktober-Tour: 2 von 3“. Fällt der
  Gegner, sagt der Ansager **TOUR KOMPLETT** (Vorrang direkt nach dem Rang). Dazu gibt
  es Aufnäher für 1, 3, 6 und 12 besiegte Monate, in einer neuen Kategorie „Tour“ mit
  lila Rahmen.
- **Wochen-Soundcheck.** Fällig sonntags für die laufende Woche, montags und dienstags
  noch für die vergangene. Ein Knopf im Wochenkopf führt hin:
  - die Zahlen der Woche: Einheiten, Jams, Mobility-Tage, Fahrten und Kilometer,
    Tonnen, saubere Sätze;
  - „Lief gut“, „Hakt“ und drei Vorsätze.

  Gespeichert wird er als `soundcheck/JJJJ-Www.json` im Datenrepo, ohne Netz kommt er
  in die Warteschlange. Er ist kein Training und ändert am Programm nichts. Die
  Vorsätze stehen danach im Wochenkopf, frühere Soundchecks in der Tour unter
  Einheiten. Aufnäher für 4 und 12 Wochen in Folge.
- **Mobility zählen.**
  - In der Einheit lässt sich „Mobility gemacht“ abhaken (Feld `mobility` am Eintrag).
  - In der Bibliothek trägt **Heute gemacht** einen eigenen Mobility-Eintrag ein
    (`einheiten/<datum>-mobility.json`, kein Zustand), einmal je Tag.
  - Mobility ist kein Training: keine Serie, kein Rang, keine Tonnage, keine
    Übertragung zu intervals.icu, und eine Pause endet dadurch nicht. Historie und
    CSV-Export führen sie mit.
  - Den Aufnäher **Gelenkig** gibt es für drei Mobility-Tage in einer Woche, als
    Leiter 1, 4 und 12 solcher Wochen.
  - Über der Mobility-Gruppe der Bibliothek steht, wie oft es diese Woche schon war.

### Geändert
- **Flightcase-Look.**
  - Karten tragen Kantenschutz aus Metall an allen vier Ecken.
  - Überschriften sind schief geklebte Gaffa-Streifen mit Edding-Schrift (Permanent
    Marker, ab 16 px).
  - Das Tageswort steht in Anton.
  - Beide Schriften liegen im Repo (`assets/fonts/`, Lizenzen OFL und Apache 2.0
    daneben); die CSP bleibt unverändert.
- Neue Pixelmotive: Tourplakat, Nightliner, Lorbeerkranz, Mischpult, der Endgegner
  (`assets/pixel/boss.png`). Dazu aus „Roadie“ (vormals „Orga privat“): Gelenkig, Tour komplett,
  Soundcheck.
- Ohne zwischengespeicherte Einheiten (etwa auf einem neuen Gerät) lädt Home sie
  einmal im Hintergrund nach.

### Werkzeuge
- Neue Probe `rueckschau` für den Soundcheck: fällig, ausfüllen, Datei, Serie,
  Aufnäher, Archiv, offline, Englisch.
- Die Probe `buehne` prüft die Monats-Tour, `einheit` und `bibliothek` prüfen
  Mobility, `start` prüft Gaffa-Kontrast, Schriftgröße und die geladenen Schriften.
- 1791 Tests, 500 Probenprüfungen.

## 2026-10-16.1

### Geändert
- **Jeder Aufnäher hat ein eigenes Motiv.** Bisher teilten sich 57 Aufnäher 22 Bilder:
  Alle Stufen einer Leiter zeigten dasselbe, und alle 20 Plattenclub-Aufnäher dieselbe
  Hantel. Jetzt wächst jede Leiter sichtbar mit:
  - **Gigs:** Setlist-Zettel, Ticket, Plakat, Amp, hochgehaltenes Feuerzeug.
  - **Tourbus:** Fahrrad, Kettenblatt, Bus, Straße, Weltkugel.
  - **Serie:** Kette, Kalender, Flamme, Krone.
  - **Crossover:** Kreuzrad, Rad mit Hantel, gekreuzte Klingen.
  - **Plattenclub:** Jeder Lift ist eine eigene Figur (Kniebeuge, Bankdrücken,
    Rudern, Drücken, Kreuzheben), mit 1–4 Scheiben an der Stange.
  - **Körpergewicht-Marken:** dieselbe Figur auf der Waage.
  - Eigene Lift-IDs in der config bekommen eine neutrale Figur derselben Stufe.
- **Kraft-Aufnäher sind achteckig statt rautenförmig.** Die Farben bleiben, aber die
  Raute ließ für Figur und Hantel zu wenig Platz. Stange und Scheiben sind orange, so
  lassen sie sich zählen.

### Werkzeuge
- `tools/pixel.mjs` baut ein Bild je Aufnäher-ID und bricht ab, wenn zwei Kacheln
  gleich aussehen. Was über den Innenraum eines Rahmens hinausragt, wird abgeschnitten.
- Die Probe `buehne` prüft, dass auf der Kutte keine zwei Aufnäher dasselbe Bild
  tragen.
- 1694 Tests.

## 2026-10-15.1

### Neu
- **Pixel-Aufnäher.** Jeder Aufnäher auf der Kutte hat ein eigenes 24×24-Pixelbild.
  - Die Rahmenform zeigt die Kategorie: Bühne rund, Kraft Raute, Rad eckig, Comeback
    Wappen, Serie Stern.
  - Die Symbole stammen aus der Pixel-Art von „Orga privat“ (eigene Arbeit, keine
    fremden Grafiken), z. B. Blutstropfen fürs Debüt, Hantel für den Plattenclub,
    Tourbus für die Kilometer, Totenkopf für Doom. Klimmzug und Treppe sind neu
    gezeichnet.
  - Offene Aufnäher erscheinen grau, neu verdiente auch auf dem Geschafft-Screen.
- **Rangszenen.**
  - Jeder Rang hat eine Pixel-Szene: Garage, Proberaum, Klub, Halle, Arena,
    Goldbühne und eine neue Hall of Fame mit Vitrine und Goldplatten.
  - Darunter steht die Tour mit allen sieben Stationen: erreichte in Farbe, die
    aktuelle mit Rahmen, kommende abgedunkelt.
- **Pixelfeuer** (Doom-Algorithmus, eigene Umsetzung, `js/feuer.js`).
  - Es brennt klein hinter dem Tageswort SCHWER.
  - Bei einer goldenen Ansage gibt es einen kurzen Feuerstoß am unteren Rand.
  - Mit „Bewegung reduzieren“ im System gibt es kein Feuer; bei verborgener Seite
    hält es an.
- **Ansager** nach der Einheit (`js/ansager.js`). Höchstens eine Ansage, nach Vorrang:
  1. neuer Rang;
  2. neuer Aufnäher;
  3. wieder auf dem Stand vor der Pause;
  4. runde Marke („160 KG“);
  5. Wochenregler auf elf;
  6. „FLAWLESS“.

  Unter *Backstage → App* lässt er sich abschalten; beim Einschalten kommt eine
  Probe. Die Wahl bleibt beim Abmelden erhalten.

### Werkzeuge
- `tools/pixel.mjs` baut die Bildbögen `assets/pixel/aufnaeher.png` und `raenge.png`
  aus den Quellbildern in `tools/pixel/`, ohne Abhängigkeit (PNG über `node:zlib`).
  `--pruefe` vergleicht die Bögen mit den Quellen und läuft jetzt in der GitHub Action.
- Neue Browserprobe `buehne`:
  - Bögen geladen, Szene und Tour-Leiste, jeder Aufnäher mit Bild, offene grau;
  - Glut nur bei SCHWER und nicht bei reduzierter Bewegung;
  - Ansager mit richtigem Vorrang, verschwindet wieder, abschaltbar.
- 39 neue Tests (1690 in 23 Dateien).

## 2026-10-13.2

### Neu
- **MIT-Lizenz.** Bisher lag keine Lizenz im Repo. Rechtlich hieß das „alle Rechte
  vorbehalten“: forken per Knopf ging, anpassen und selbst betreiben nicht. Jetzt steht
  der Quelltext unter MIT (`LICENSE`), Forken und Anpassen ist ausdrücklich erwünscht.
- **Über Setlist** unter *Backstage → App*:
  - gebaut von @cyphomat;
  - Fehler und Wünsche als Issue im Original-Repo;
  - Lizenz und Quelltext;
  - ein ehrlicher Satz „ohne Gewähr“.
  - Im Fork zeigt der Quelltext-Link auf den Fork, Feedback geht weiter ans Original.
  - Alles nur Links: kein Abruf, die CSP bleibt unverändert.
- **Fußzeile** auf dem Einrichtungsbildschirm mit Autor, Lizenz und Issues.
- **READMEs:** Lizenz-Abzeichen und ein Abschnitt „Mitmachen“ / „Contributing“.
- **READMEs: Loslegen oben.** Der Link zur App ging zwischen den Abzeichen unter. Jetzt
  steht gleich unter dem Untertitel „Loslegen → cyphomat.github.io/setlist“ mit drei
  Schritten: privates Repo, Token, App öffnen. „Selbst einrichten“ sagt vorab, dass zum
  Benutzen die gehostete App reicht. Fork und Pages braucht es nur für eine eigene
  Fassung.
- `CLAUDE.md` mit den Regeln für dieses Repo. Der Autor erscheint nur als @cyphomat.

### Geändert
- Kommentare, Tests und der CHANGELOG nennen keinen Vornamen mehr.

### Werkzeuge
- Neue Browserprobe `ueber`:
  - Links, neue Tabs ohne Opener und Referrer;
  - Fork-Fall unter `jens.github.io/setlist/`;
  - Kontrast ≥ 4,5:1 bei 320/390/1280 px in beiden Themen;
  - Englisch;
  - keine Anfrage an fremde Hosts.
- `kontext()` kann die App jetzt unter einer anderen Adresse und ohne Token öffnen.
- 15 neue Tests (1643).

## 2026-10-13.1

### Neu
- **Bildschirm bleibt an.** Während Einheit, Jam, Unplugged und Max-Out geht das
  Display nicht mehr aus. Zum Abhaken des nächsten Satzes muss also nicht mehr
  entsperrt werden.
  - Beim Verlassen der Ansicht gibt die App den Bildschirm wieder frei, egal ob über
    Fertig, Abbrechen oder Zurück.
  - Nach dem Wechsel in eine andere App holt sie die Sperre neu.
  - Ohne Unterstützung im Browser bleibt alles wie bisher (`js/wach.js`).
- **Nach 5×5.** Muss ein Lift zweimal ohne neues Hoch dazwischen in den Deload,
  steckt er fest.
  - Ein Deload an einem höheren Gewicht als der vorige zählt wieder als erster.
  - Beim Start schlägt die App für diesen Lift die nächste Stufe vor: 5×5 → 3×5 → 3×3,
    beim Kreuzheben 1×5 → 1×3. Das Gewicht bleibt und steigt weiter wie bisher.
  - Wechseln geht nur mit deiner Zustimmung und steht als Anpassung
    (`grund: 'schema'`) im Log, der Zustand bleibt also ableitbar.
  - „Noch nicht“ gilt bis zum nächsten Deload.
  - Die Startseite kündigt den Vorschlag an. Die Gewichtsliste zeigt die laufende
    Stufe, und unter *Tour → Kraft → Wo es klemmt* geht es zurück.
  - Ein Schemawechsel verschluckt keinen fälligen Pausen-Deload.
- **Aftershow: Hilfsübungen.** Nach dem Hauptprogramm lassen sich Klimmzüge, Chin-ups,
  Dips, Liegestütze, Face Pulls, Curls und hängendes Beinheben mitschreiben.
  - Je Satz die Wiederholungen über den bekannten Auswahldialog. Hervorgehoben ist, was
    beim letzten Mal ging.
  - Ohne Steigerung: keine Gewichte, kein A/B-Wechsel, keine Tonnage.
  - Sie stehen auf dem Setlist-Zettel, in der Historie, in der Beschreibung für
    intervals.icu und als Bilanz unter *Tour → Kraft*.
  - Zwei neue Aufnäher: **Roadcrew** für zehn Einheiten mit Hilfsarbeit und
    **Hangar 18** für zehn Klimmzüge oder Chin-ups am Stück.
- **Export als CSV** unter *Backstage → App*.
  - Eine Zeile je Lift, Hilfsübung, Zugabe, Jam, Unplugged, Max-Out und Anpassung.
  - Semikolon und BOM, damit Excel die Datei direkt öffnet.
  - Die Datei entsteht im Browser und geht an keinen Dienst. Als Home-Bildschirm-App
    auf iOS öffnet sich das Teilen-Blatt („In Dateien sichern“).
  - Text aus den eigenen Daten kommt nie als Formel an: Ein Ort `=HYPERLINK(…)` landet
    als Text in der Zelle (`js/export.js`).

### Behoben
- **Abbrechen zeigt den aktuellen Stand.** Wer vor der Einheit einen Pausen-Deload
  übernommen und dann abgebrochen hat, sah auf der Startseite noch die alten Gewichte.
- **Einheiten im Hintergrund nachladen.** Ohne Zwischenspeicher, also frisch
  eingerichtet und die Tour nie geöffnet, kannte die Einheit die bisherigen Logs nicht.
  Jetzt lädt sie sie im Hintergrund nach.

### Werkzeuge
- Neue Browserprobe `einheit`: Wachsperre, Schemadialog, Wechsel und Rückweg,
  Aftershow bis zum Aufnäher. `sicherheit` prüft jetzt auch den CSV-Export samt
  Formelschutz. Zusammen 265 Prüfungen.
- 162 neue Tests (1628 in 21 Dateien).

## 2026-10-12.2

### Geändert
- **Der englische Modus ist fertig.** Bisher erschien auch im englischen Modus
  Deutsch, weil `js/coach.js`, `js/store.js` und `js/intervals.js` ihre Texte selbst
  zusammensetzten. Jetzt laufen sie über die Übersetzung:
  - die Ansage: Kopf („17 days away“, „Unfinished business: Back Squat“), Satz und
    **Tageswort** (TECHNIQUE, SOLID, HARD, HEAVY);
  - Form und die Warnung vor einer Fahrt kurz vor dem Eisen;
  - Meilensteine (Jahrestage, alter Stand) und die Minierfolge nach der Einheit;
  - Fehlermeldungen von GitHub und intervals.icu.
- **Das Tageswort bleibt in den Daten deutsch.** Es steht als `angesagt` in jeder
  Einheit, und „Ansage gegen Gefühl“ vergleicht damit. Übersetzt wird nur die
  Anzeige, damit eine englische Einheit dort genauso zählt.
- Auf Deutsch ist alles wortgleich geblieben, mit zwei kleinen Korrekturen: „Vor einer
  Stunde … gefahren“ statt „Vor 1 Stunden“ und „Heute vor einem Jahr“ statt „vor 1
  Jahren“.
- Deutsch bleiben bewusst nur die Übungsinhalte, die Sprüche, die Jam-Bewegungen und
  die Rad-Begründungen. Das ist Fachtext, der eine echte Übersetzung braucht.
- **Testlauf gehärtet wie bei Riffforge:** Die GitHub Actions hängen an Commits statt an
  Versions-Tags (`actions/checkout` v7.0.1, `actions/setup-node` v7.1.0, die Fassung als
  Kommentar daneben), weil ein Tag sich nachträglich verschieben lässt. Beim Checkout
  bleibt das Git-Token nicht im Arbeitsverzeichnis liegen (`persist-credentials:
  false`). Dependabot aktualisiert die gepinnten Commits wie bisher.
- **Browserproben im Repo:** `node tools/proben.mjs` öffnet die echte App in Chromium,
  mit gestellter GitHub-API und festem Datum. Sechs Bereiche mit 202 Prüfungen:
  - Start, Tour mit Backstage, Merch, Songbook, Sicherheit und Englisch;
  - jeweils beide Themen, „Sehr groß“, 360 bis 1280 px;
  - kein Überlauf, keine Seitenfehler.

  Die Proben sind optional und brauchen Playwright. Sie laufen nicht in der GitHub
  Action, und am ausgelieferten Code ändert sich nichts.
- `sprache()` kommt ohne localStorage aus (dann Deutsch). Damit können auch die reinen
  Module übersetzen, und ihre Tests laufen unverändert. 26 neue Tests prüfen die
  englischen Texte und dass das Tageswort in den Daten deutsch bleibt.

## 2026-10-12.1

### Sicherheit
- **Eigener Text wird überall maskiert.** An drei Stellen ging Text aus der
  `config.json` ungeprüft ins HTML: Verletzungsname und Behandlung in der
  Aufwärmliste, der Liftname bei „Warum …“ in der Einheit und die Quellenangabe der
  alten Bestleistungen. Ein Eintrag mit HTML darin wäre auf derselben Herkunft wie Token
  und Key ausgeführt worden. Die Übersetzungsfunktion setzt Werte roh ein; maskiert wird
  deshalb beim Aufrufer.
- **Abmelden räumt das Gerät leer.** „Zugänge entfernen“ löschte bisher nur Token,
  Repo und Key. Einheiten, Injury Report, Gewicht, Schlaf, Fahrten und sogar ungesendete
  Einheiten blieben im Browser. Jetzt geht alles, was Daten sind (`S.alleDatenEntfernen`,
  getestet); nur Thema, Schrift, Sprache und Unplugged-Einstellungen bleiben. Liegen noch
  ungesendete Einheiten in der Warteschlange, nennt die Rückfrage ihre Zahl.
- **Nicht in fremden Seiten.** Lädt eine andere Adresse die App in einem Rahmen, zeigt
  sie nur einen Hinweis mit Link und startet nicht, ruft also auch GitHub nicht auf.
  `frame-ancestors` geht weder per Meta-Tag noch auf GitHub Pages per Header, deshalb
  prüft `js/boot.js` das vor dem ersten Bild. Der eigene Screenshot-Rahmen (gleiche
  Herkunft) bleibt erlaubt. Dazu `referrer: no-referrer` für die ganze Seite.
- **Abgelaufener Token** heißt jetzt auch so: „Token ungültig, abgelaufen oder ohne
  Schreibrecht …“. Die Anleitung empfiehlt eine Laufzeit von etwa einem Jahr.

### Neu
- **Tests mit Node und als GitHub Action.** `node tools/tests.mjs` führt alle 18
  Testdateien aus, zeigt je Datei das Ergebnis und endet mit Fehlercode, sobald etwas
  fehlschlägt. `.github/workflows/tests.yml` macht das bei jedem Push und Pull Request,
  ohne Abhängigkeiten und mit nur lesenden Rechten. Sie nutzt `actions/checkout@v7`,
  `actions/setup-node@v7` und Node 24 (aktuelle LTS). Damit die Actions nicht still
  veralten, meldet Dependabot neue Versionen als Pull Request (`.github/dependabot.yml`).
  Die App selbst hat weiterhin keine Abhängigkeiten.

### Doku
- READMEs: Abschnitt **Tests** (beide Wege, aktuelle Zahl, vollständige Liste),
  **Bibliothek** (Kategorien, Übung des Tages, Notiz auf Wunsch), **App** (Startseite
  als Plakat, Tour mit Reitern, Backstage), **Sicherheit** (Gesundheitsdaten im Repo,
  Abmelden, Einbett-Sperre, Token-Laufzeit), Aufbau-Tabelle.

## 2026-10-04.4

### Geändert
- **Die Bibliothek als Songbook.** Vorher standen dort eine immer offene Zufallskarte mit
  Notizformular und darunter rund siebzig gleich aussehende Zeilen in Großbuchstaben,
  alphabetisch über alle Kategorien gemischt. Gleichnamige Übungen (Battle Ropes als
  Finisher und als Jam) waren kaum auseinanderzuhalten.
  - **Nach Kategorien gegliedert:** Kraft, Technik, Mobility, Finisher, Jam, jede mit
    eigener Farbe, Überschrift und Anzahl. Die Filter zeigen die Zahlen ebenfalls; im
    Englischen heißen die Kategorien jetzt auch englisch.
  - **Ruhige Zeilen:** Name in normaler Schrift, Dosis rechts, der Cue leise darunter.
    Aufgeklappt folgen Erklärung, Cue, Bewegungsstandard, typischer Fehler und „Wenn es
    klemmt“ in einer sauberen Spalte.
  - **Übung des Tages** statt Zufall bei jedem Öffnen: kompakt mit erstem Satz,
    „Ansehen“ klappt sie in der Liste auf, ↻ würfelt neu. Während einer Suche oder mit
    Filter tritt sie zurück.
  - **Notizen nur auf Wunsch:** „Notiz hinzufügen“ öffnet das Formular. Eine
    gespeicherte Notiz steht danach als Text bei der Übung, und die Übung bleibt offen.

## 2026-10-04.3

### Geändert
- **Tour mit Reitern, Backstage als eigener Bildschirm.** Die Tour war eine einzige
  lange Seite: rund zwanzig Auswertungen und darunter noch alle Einstellungen. Jetzt
  sind Daten und Einstellungen getrennt.
  - **Tour:** fünf Reiter im Kopf. *Überblick* (Zahlen, Zum Angeben, Kalender,
    Wochenlast, Merch-Stand), *Kraft* (Bestwerte, Verhältnisse, Hochrechnung,
    Relativkraft, Plateaus, Ansage gegen Gefühl, Verläufe, Volumen), *Körper* (Form,
    Gewicht, Injury-Verlauf), *Rad* (W/kg, Plan gegen Ist, Aerobe Basis, 90 Tage) und
    *Einheiten*. Der zuletzt gewählte Reiter wird gemerkt.
  - **Backstage:** eigener Bildschirm hinter dem ⚙ in der Tour, mit den Reitern
    *Persönlich* (Stimme, Bestleistungen, Injury Report, Prüfwerte), *Orte*,
    *Verbindungen* und *App* (Darstellung, Sprache, Version, Update, Neuberechnung,
    Zugänge).
  - Die Reiterleiste sitzt im Kopf und klebt mit ihm, auch wenn ein Banner den Kopf
    höher macht. Passt sie nicht in die Breite (große Schrift, schmales Handy), lässt
    sie sich wischen; eine Blende am Rand zeigt das an. Pfeiltasten wechseln den
    Reiter, die Leiste ist als Tabliste ausgezeichnet.
  - Hinweise, die auf „≡“ verwiesen, nennen jetzt den Weg in den Backstage.

## 2026-10-04.2

### Geändert
- **Home, rechte Spalte aufgeräumt.** Dieselbe Idee wie beim Plakat: eine Karte je
  Thema, Normales leise, nichts doppelt.
  - **Eine Wochenkarte.** Regler und Woche sind eine Karte. Im Kopf stehen der
    (kleinere) Regler mit „x von y Krafteinheiten“ und darunter die Serie, auch als
    „verschoben, nicht abgesagt“. Die Tage sind Zeilen statt einzelner Karten.
    „Warum diese Einheit“ ist kein eigener Kasten mehr zwischen den Tagen: Die Radzeile
    selbst klappt auf.
  - **Eine Gewichtskarte.** Die fünf Kacheln sind eine Liste: Name, offene
    Fehlversuche, Gewicht. Die Reunion-Tour ist ihr Kopf (Prozent und Balken), und unter
    jedem Lift, der noch unter seinem alten Stand liegt, steht ein dünner Strich.
    **Bei 100 % verschwindet beides.** Die große Karte „100 % · Originalbesetzung
    wieder vereint“ stand vorher jeden Tag unverändert da; gefeiert wird das beim
    Erreichen auf dem Geschafft-Screen und mit dem Aufnäher.
  - **intervals.icu spricht nur bei Bedarf.** Läuft die Anbindung und die letzte Fahrt
    ist frisch, steht dort nichts mehr; die Woche zeigt ohnehin, was gefahren wurde.
    Ein Hinweis kommt, wenn das Rad über drei Wochen ruht, Doppel zusammengefasst
    wurden, nichts verbunden ist oder keine Fahrten ankommen.
  - Im Plakat steht die Serie nicht mehr zusätzlich im Kopf, sie hat ihren Platz in der
    Wochenkarte.

## 2026-10-04.1

### Geändert
- **Home als Bühnenplakat.** Die Startseite war ein Textblock: bis zu acht gleich
  gewichtete Zeilen im selben Kasten, die meisten davon mit der Botschaft „alles
  normal, ändere nichts“. Erst darunter kamen Workout und Startknopf. Jetzt gilt:
  **Nur Ausnahmen sprechen, Normales wird zum Instrument.**
  - **Ein Plakat statt zwei Karten.** Oben stehen Wochentag, Datum und die Lage,
    darunter riesig das Tageswort (TECHNIK, SOLIDE, HART, SCHWER) in seiner Farbe, mit
    leichtem Bühnenlicht dahinter. Es folgen ein Satz, das Workout und der Startknopf.
  - **Ausnahmen im Plakat**, je eine Zeile mit ▲ und nur der erste Satz: Pausen-Deload,
    eine aktive wiederkehrende Verletzung (mit Trend), müde oder platte Form, Rad zu kurz
    vor dem Eisen, Abnehmen zu schnell, zu teuer oder nach oben. Knapper Schlaf und
    niedrige HRV stehen nicht doppelt da, weil das schon die Ansage selbst sagt. Welche
    Lage spricht, entscheidet eine getestete Funktion (`coach.ausnahmen`).
  - **Instrumente** unter dem Plakat: Form, Schlaf, Gewicht pro Woche, Rad und eine
    strukturelle Verletzung, je mit farbigem Punkt und Wert. Antippen klappt die
    ausführliche Zeile von früher auf; offen ist höchstens eine.
  - **Der Spruch wird ein Zitat** ohne Kasten. An schweren Tagen steht dein eigener
    Grund da, mit „— dein Grund“ darunter (vorher fest auf Deutsch „DEIN GRUND“).
  - **Der „Wendepunkt“ ist weg von Home.** Dass ein Lift über dem Stand vor der Pause
    liegt, feiern der Geschafft-Screen und der Aufnäher „Originalbesetzung“. Täglich
    wiederholt war es nur noch Rauschen. Jahrestage alter Bestleistungen bleiben, sie
    kommen und gehen mit dem Kalender.
- `tools/screens.sh` nimmt einen anderen Browser über `CHROME=…`.

## 2026-10-03.2

### Neu
- **Das Rad im Merch-Stand.** Bisher kannte die Kutte nur das Eisen. Jetzt hat sie eine
  eigene Reihe in Stahlblau, wie das Rad überall in der App:
  - **Tourbus:** 100, 500, 1.000, 2.500 und 5.000 km insgesamt.
  - **Stairway to Heaven:** 8.848 Höhenmeter insgesamt, einmal den Everest hoch. Den
    Wert liefert intervals.icu (`total_elevation_gain`, neu im Abruf). Ohne
    Höhenmeter-Daten gibt es den Aufnäher gar nicht erst.
  - **Highway Star:** 100 km in **einer** Fahrt; zwei Fahrten zu je fünfzig zählen nicht.
  - **Doom:** zehn Fahrten mit der Intensität im geplanten Bereich, derselbe Abgleich
    wie in der Tour. Langsam und schwer, wenn es so geplant ist. Belohnt wird die
    Disziplin, locker zu bleiben, nicht die Härte.
  - **Open Air:** zehn Fahrten draußen statt auf der Rolle.
  - **Crossover:** 1, 10 und 26 Wochen mit Krafteinheit **und** Fahrt. Kraft und Rad am
    selben Tag werden bewusst nicht belohnt, davor warnt die App an anderer Stelle.
- **Fahrten zählen als Gig**, seit deiner ersten Einheit in Setlist:
  - für die Gig-Leiter, den Rang und die Serien im Merch;
  - für die Serie auf Home (eine Woche nur auf dem Rad reißt sie nicht mehr). Home,
    Tour-Rekord und Merch rechnen damit gleich;
  - auf dem Tourshirt: an einem Tag mit Kraft steht „Kraft + Rad“, oben die Kilometer
    der Tour;
  - in der Tour-Bilanz mit eigener Kachel „Kilometer“.
- **Fahrten seit Setlist-Start.** Die App lädt von intervals.icu sonst nur 90 Tage.
  Der Merch-Stand holt beim Öffnen einmal alles seit der ersten Einheit und legt es
  schlank im Zwischenspeicher ab, nur die Felder, die er rechnet. Ohne intervals.icu
  gibt es keine Rad-Reihe, auch keine Umrisse.

## 2026-10-03.1

### Neu
- **Der Merch-Stand.** Ein bisschen Spiel, passend zu Bühne und Eisen, erreichbar über
  das Schallplatten-Symbol oben auf Home und über einen Link in der Tour. Alles wird aus
  den Logs berechnet und nirgends gespeichert: wer `state.json` neu berechnet, hat danach
  dieselbe Kutte. Die Leitregel: **belohnt wird Regelmäßigkeit und Qualität, nie Menge.**
  Es gibt keinen Aufnäher fürs Trainieren trotz Verletzung, für mehr Einheiten als
  geplant oder für viele Max-Outs.
  - **Die Kutte.** Aufnäher mit dem Tag, an dem sie verdient wurden: Debüt, 10 bis 250
    Gigs (Tage, nicht Logs), erster Jam, MTV Unplugged, Gitarrensolo (erstes Max-Out),
    zehn Zugaben, *Tight* (zehn Einheiten mit lauter sauberen Sätzen), der
    **Plattenclub** je Grundlift (1 bis 4 Platten je Seite), der **1000-lb-Club**,
    Körpergewicht-Marken (nur mit Waagendaten von intervals.icu), Comeback, Rückweg,
    Originalbesetzung und Serien von 4 bis 52 Wochen. Je Reihe steht nur der nächste
    fehlende Aufnäher als Umriss da, nicht eine Weste voller leerer Kreise.
  - **Gold und Platin** für das bewegte Gewicht: 50, 100, 250 und 500 Tonnen.
  - **Der Rang**, von der Garagenband bis zur Hall of Fame. Gezählt werden Wochen mit
    mindestens einer Einheit, nicht Einheiten, und er fällt nie.
  - **Tourshirts.** Jedes Quartal ist eine Tour mit eigenem Namen, auf dem Rücken alle
    Trainingstage samt Studio. Dazu die **Tour-Bilanz** des Jahres.
- **Bühnenmomente.**
  - Nach der Einheit kommt die **Setlist als Zettel** mit Gaffa-Tape: Geschafftes ist
    durchgestrichen, ein Fehlversuch bekommt den Stempel *nochmal*, darunter die Zugabe.
  - Was die Einheit an **neuen Aufnähern** gebracht hat, steht direkt darunter. Das gilt
    auch nach Jam und Unplugged. Gerechnet wird erst nach dem Speichern mit frisch
    geladenen Logs. Ein veralteter Zwischenspeicher würde längst Verdientes ein zweites
    Mal feiern, deshalb bleibt der Platz dann lieber leer.
  - **Goes to eleven:** ein Wochenregler auf Home. Zehn heißt Plan erfüllt; auf elf geht
    er nur, wenn dabei auch jeder Satz sauber war. Mehr Einheiten als geplant drehen ihn
    nicht weiter.
  - **Reunion-Tour:** so heißt jetzt der Weg zurück zu den alten Arbeitsgewichten. Bei
    100 % ist die Originalbesetzung wieder vereint.
  - Der Finisher in der Einheit hat ein Häkchen **Zugabe gespielt**. Neue Einheiten
    merken sich außerdem das gewählte Studio (`ort`), für den Rückendruck des Shirts.
    Beides bleibt im privaten Repo; an intervals.icu geht davon nichts.
- **Verletzt: die Serie wird eingefroren, nicht gerissen.** Eine Woche ohne Einheit,
  die in die Zeit einer eingetragenen Verletzung fällt, beendet die Serie nicht, zählt
  aber auch nicht mit. Home sagt dann „verschoben, nicht abgesagt“, der Kalender in der
  Tour zeigt die Tage schraffiert. Damit das kein Freifahrtschein wird:
  - Strukturelles zählt nicht. Die Schulter bleibt und würde sonst jede Lücke
    entschuldigen.
  - Ohne „seit“ gibt es kein Fenster.
  - Höchstens sechs Wochen je Eintrag, so weit wie die größte Stufe des Pausen-Deloads.
  - Das Ende stempelt sich selbst: Wer eine Verletzung auf „ruhend“ oder „ausgeheilt“
    stellt, bekommt heute als **Bis**-Datum. Es steht dann im Formular und lässt sich
    korrigieren.

### Behoben
- Eine Anpassung (etwa der Pausen-Deload) zählte als Trainingswoche und hielt damit
  eine Serie am Leben. Jetzt zählt sie nicht mehr, weder in der laufenden Serie noch
  im Rekord.
- `js/verletzung.js` fehlte seit dem Injury Report in der Offline-Liste des Service
  Workers. Es ist jetzt wie `js/merch.js` von Anfang an im Cache.

## 2026-09-24.1

### Neu
- **Deload nach einer Pause.** Bisher passierte bei einer Pause nichts mit den
  Gewichten: die Ansage erkannte ab drei Wochen ein Comeback, aber an der Stange hing
  dieselbe Last wie vorher — und der Deload nach Fehlversuchen hätte erst nach drei
  verlorenen Einheiten gegriffen. Anlass war ein eingequetschter Finger.

  | Pause | Rückschritt |
  |---|---|
  | unter 14 Tage | keiner — bei zweimal pro Woche ist eine verpasste Einheit schon 7–10 Tage |
  | 14–20 Tage | −10 % (derselbe Faktor wie der Deload nach Fehlversuchen) |
  | 21–41 Tage | −20 % |
  | ab 42 Tagen | −30 % |

  Gezählt ab der letzten **Krafteinheit** — Jam, Unplugged und Max-Out halten das
  Gewicht an der Stange nicht. Gerundet wird abwärts: ein Deload, der durch Rundung
  kleiner ausfällt als angesagt, ist keiner.

  **Ein Vorschlag, keine stille Änderung.** Beim Tippen auf „Training starten" kommt
  zuerst eine Karte mit den neuen Gewichten je Übung. *Übernehmen* schreibt eine
  Anpassung ins Log, *Wie vorher* behält die Gewichte und fragt für diese Pause nicht
  noch einmal — erst wieder, wenn sie in die nächste Stufe rutscht. Ist im Injury
  Report etwas eingetragen, das während der Pause begann, steht es auf der Karte.

  **Der Rückweg geht doppelt so schnell.** Verlorene Kraft kommt schneller zurück, als
  sie entstanden ist. Bis zum Gewicht vor der Pause steigt jede erfolgreiche Einheit um
  das doppelte Inkrement (Squat +5, Kreuzheben +10), gedeckelt am alten Stand. Ein
  Fehlversuch beendet die Abkürzung, danach gilt die normale Mechanik. Bei −10 % heißt
  das: zwei Einheiten statt vier zurück.

### Bewusst so
- **Alles liegt im Log.** Der Rückweg steht als `ziele` in der Anpassung, der Zustand
  leitet ihn nur ab. Ein Test prüft, dass `deriveState` über Pause, doppelte Schritte
  und einen Fehlversuch hinweg exakt denselben Zustand liefert — sonst hätte
  „state.json neu berechnen" den Rückweg stillschweigend gelöscht.
- **Nur einmal je Pause.** Wer übernimmt und die Einheit dann abbricht, steht beim
  nächsten Start vor derselben Pause. Ohne Gegenregel gäbe es ein zweites Mal −10 %.
  Eine Anpassung nach der letzten Krafteinheit gilt deshalb als erledigte Pause.
- **Faustregeln, keine Messwerte.** Die Stufen folgen dem, was sich in der Praxis
  bewährt hat: in den ersten zwei Wochen hält sich Maximalkraft weitgehend, danach geht
  es spürbar bergab, nach sechs Wochen sind auch Technik und Sehnen wieder ein Thema.
  Die Karte sagt das so.

### Geändert
- Die Comeback-Schwelle der Ansage liegt jetzt bei **14 statt 21 Tagen** und nutzt
  dieselbe Konstante wie der Deload — die erste Einheit nach einer echten Pause ist
  TECHNIK, egal ob um 10 oder 20 % zurückgenommen wurde.
- Eine Testvorlage in `tests/coach.test.js` hängte den 25.08. hinter den 15.09. an und
  lief nur, weil 21 Tage zufällig genau unter der alten Schwelle lagen. Jetzt
  chronologisch, wie die echte Historie.

---

## 2026-09-18.2

### Neu
- **Eine zweite Scheibenzeile.** Der Rechner zeigt gern `25 + 15` — und an der Stange
  liegen in vielen Studios nur 20er, 10er und 5er. Darunter steht jetzt dieselbe Last
  **nur aus 20/10/5/2,5/1,25**: die durchgehend halbierbare Reihe, die jedes Studio
  vollständig hat. Aus `25 + 15` wird `2×20`, aus `25` wird `20 + 5`, aus `15` wird
  `10 + 5`. Auch bei den Aufwärmsätzen, dort kompakt in derselben Zeile.

  **Bewusst nicht je Studio einstellbar.** Welche Scheiben gerade herumliegen, sieht man
  schneller, als man es pflegen würde — und eine Einstellung, die niemand pflegt, ist
  schlechter als keine.

### Bewusst so
- **Kein Schwellenwert, ab dem sich die zweite Zeile „lohnt".** Sie erscheint genau dann,
  wenn sie etwas anderes sagt: kommt die Hauptlösung ohnehin ohne 25er und 15er aus, wäre
  die Alternative dieselbe Zeile und entfällt von selbst. Bei 14 von 47 geprüften
  Gewichten ist das der Fall. Ein erster Entwurf ließ stattdessen die größte verwendete
  Scheibe weg — der schlug bis 77,5 kg `2,5 + 2,5` statt `5` vor, also Kleinkram, den
  jedes Studio hat.
- **Die Alternative ist leiser gesetzt.** Sie führt nicht, sie steht daneben — auf einen
  Blick muss klar bleiben, was der Plan ist und was das Ausweichen. Beide Farben bleiben
  über dem AA-Kontrast (5,04:1 und 7,39:1 auf der Karte).
- Wer keine gängigen Scheiben im Vorrat hat, bekommt keine Alternative statt einer, die
  sich nicht laden lässt.

---

## 2026-09-18.1

### Neu
- **Injury Report.** Kleine Verletzungen, die wiederkommen, und solche, die bleiben —
  beide mit deiner eigenen Behandlung daneben. Einzutragen unter
  *Backstage → Persönliches*.

  **Zwei Arten, und der Unterschied ist nicht kosmetisch.** *Wiederkehrend* kommt und
  geht: die Plantarfaszie meldet sich, wird behandelt, wird ruhig, meldet sich wieder.
  Sie hat einen Verlauf, der sich zu verfolgen lohnt, und wird nach jeder Einheit kurz
  abgefragt. *Strukturell* bleibt: eine Kalkablagerung im Schultergelenk geht nicht weg,
  weil man sie gut behandelt. Sie sperrt eine Bewegung, und das bleibt so — deshalb wird
  hier **nicht** nach dem Verlauf gefragt. Eine tägliche Frage nach etwas, das sich nicht
  ändert, ist Lärm.

  **Was gesperrt ist, kommt nicht mehr vor.** Der Jam würfelt es nicht, das Unplugged
  nimmt es nicht, Technik, Mobility und Finisher lassen es weg. Eine Einschränkung, die
  man jedes Mal von Hand wegklicken muss, klickt man irgendwann nicht mehr weg. Bleibt zu
  wenig übrig, greift eine Notbremse und die volle Auswahl gilt wieder — ein leerer
  Bildschirm wäre keine Rücksicht, sondern ein Fehler.

  **Deine Behandlung steht da, wo du sie brauchst:** in der Ansage auf dem
  Startbildschirm und als abhakbarer Punkt im Soundcheck. Der Igelball hilft nur, wenn
  man an ihn denkt, bevor man losgeht — und eine Erinnerung, die man nicht wegklicken
  kann, liest man nach dem dritten Mal nicht mehr.

  **In der Tour** ein Punktband je wiederkehrender Sache: besser, gleich, schlechter je
  Einheit. Bewusst ein Band und keine Kurve — es sind drei Stufen, keine Messwerte, und
  eine Linie würde eine Genauigkeit vortäuschen, die es nicht gibt.

### Bewusst so
- **Die App stellt keine Diagnose und schlägt keine Behandlung vor.** Sie weiß nichts
  über Plantarfaszien. Was als Behandlung dasteht, hast du eingetragen — von deinem Arzt,
  deiner Physiotherapie oder aus eigener Erfahrung. Die App merkt sich das und hält sich
  daran. Das ist, was eine App leisten kann: nicht vergessen.
- **Grundübungen werden nur angemerkt, nie weggelassen.** Kniebeuge, Bankdrücken, Rudern,
  Drücken und Kreuzheben *sind* das Programm — an ihnen hängen A/B-Wechsel, Steigerung
  und Deload. Fehlt eine, hat die 5×5-Mechanik nichts mehr zu rechnen. Wer eine
  Grundübung wirklich nicht machen kann, ändert sein Programm und nicht seinen
  Verletzungseintrag. Die Oberfläche sagt das auch so.
- **Die Beobachtung zur Trainingslast ist keine Ursachenaussage.** Wie viele
  Krafteinheiten in der Woche vor einer Verschlechterung lagen, steht in der Tour — mit
  dem ausdrücklichen Hinweis, dass dafür mehr nötig wäre als ein paar Datenpunkte.
  Deuten musst du es selbst.

### Geändert
- **`tn()` für Singular und Plural.** Nach dem vierten „1 Einheiten" in der Oberfläche
  gibt es jetzt eine Mechanik statt vier handverzweigter Zeilen: bei `n === 1` greift
  `<schlüssel>.eins`, falls hinterlegt, sonst bleibt es beim Plural. Ein Test hält fest,
  dass jede Singularform auch ihre Pluralform hat — sonst stünde bei zwei Stück ein
  Schlüsselname statt eines Satzes.

---

## 2026-09-12.5

### Behoben
- **„Steht seit 1 Einheiten."** Falscher Plural — und bei einer Einheit war die
  Aussage ohnehin leer: das ist schlicht die letzte. Der Satzteil erscheint jetzt
  erst ab zwei. Dasselbe beim Deload-Zähler: „noch ein Fehlversuch" statt
  „1 offene Fehlversuche".
- **Die Kurven bei *Kraft je Kilo* waren nicht eindeutig zuzuordnen.** Eine Übung
  ohne genug Wiegungen bekommt keine Kurve — dadurch sah die nächste so aus, als
  gehöre sie zur vorherigen. Zeile und Kurve stehen jetzt in einer Gruppe mit
  Trennlinie dazwischen.

### Dokumentation
- **Vier neue Screenshots in beiden READMEs**: die Kraftverhältnisse mit Diagnose,
  Hochrechnung samt Relativkraft und Plateaus, die Prüfwerte im Max-Out und ein
  Bewegungsstandard in der Bibliothek. Echte Bildschirme, keine Mockups.
- `tools/shots.mjs` kann jetzt auch Szenen aufnehmen, die einen **Verlauf**
  brauchen: Logs über den Baum und `git/blobs`, dazu Zustand, Prüfwerte und
  Wiegedaten. Ohne das standen die Analyse-Bildschirme auf den Startgewichten —
  bei denen zufällig alles stimmt, und ein Bildschirm, auf dem nichts auffällt,
  zeigt nicht, wozu er da ist.

---

## 2026-09-12.4

### Neu
- **Prüfwerte lassen sich im Max-Out messen.** Bisher tippte man sie im Backstage
  ein. Aber genau so testet man sie ohnehin — aufwärmen, herantasten, ein schwerer
  Satz —, und ein Test ist ein Ereignis mit Datum. Der Max-Out hat deshalb eine
  zweite Gruppe: Klimmzug, Dip, Front Squat, einarmiges Drücken, Step-Up,
  einbeiniges Kreuzheben und Farmer's Carry.

  **Gemessen schlägt eingetragen** — dieselbe Rangfolge wie bei den Bestwerten, wo
  ein Max-Out ein `Maximum` liefert und ein Arbeitssatz nur eine `Untergrenze`. Die
  Tour weist aus, woher der Wert kommt. Statt eines Arbeitsgewicht-Vorschlags zeigt
  die Ergebniskarte direkt, was der Wert für die Verhältnisse bedeutet; bei
  Klimmzug und Dip zusätzlich die bewegte Gesamtlast, damit nachvollziehbar bleibt,
  woraus sich das Verhältnis ergibt.

### Bewusst so
- **Ein Prüfwert-Test kann die Progression per Bauart nicht anfassen.** Er trägt im
  Log `check` statt `lift` — nicht `lift` mit einer Sonderbehandlung. Diese
  Übungen haben kein Arbeitsgewicht, das steigen könnte, und ein Feldname, der das
  ausdrückt, ist verlässlicher als eine Abfrage, die jemand später übersieht.
  Arbeitsgewichte, A/B-Wechsel und Fehlversuchszähler bleiben unberührt.

### Behoben
- **Ein Klimmzug ohne Zusatzgewicht ließ sich nicht speichern.** Der Speichern-Knopf
  blieb gesperrt, weil die Gültigkeitsprüfung am geschätzten Maximum hing und
  `e1rm(0, 8)` nichts ergibt. Dieselbe Null-Regel hatte zuvor schon beide
  Klimmzug-Verhältnisse lautlos verschwinden lassen — sie stand an drei Stellen im
  Code und steht jetzt an einer (`pruefwertGueltig`).
- Ein Prüfwert-Test erschien im Verlauf ohne Namen, weil dort ein Eintrag aus
  `config.lifts` gesucht wurde, den es für ihn nicht gibt.

---

## 2026-09-12.3

### Neu
- **Prüfwerte: acht weitere Kraftverhältnisse.** Die Verhältnis-Tabelle enthält
  mehr, als sich aus dem 5×5 ableiten lässt — Klimmzug zu Dip zu Drücken und die
  einseitige Arbeit. Diese Übungen erzeugt das Programm nicht selbst, also werden
  sie unter *Backstage → Persönliches* eingetragen: Klimmzug, Dip, Front Squat,
  einarmiges Drücken, Step-Up im Frontrack, einbeiniges Kreuzheben und
  Farmer's Carry. Damit wächst die Tour von vier auf **zwölf Verhältnisse**.

  Erfasst wird **Gewicht und Wiederholungszahl**, nicht nur ein Gewicht. Das ist
  keine Bequemlichkeitsfrage: fünf Klimmzüge mit zehn Kilo sind etwas anderes als
  einer mit dreißig, und ohne die Wiederholungszahl ließen sich beide nicht auf
  dieselbe Basis bringen wie die Arbeitsgewichte.

  Bei Klimmzug und Dip trägt man nur den **Zusatz** ein — der eigene Körper zählt
  mit und kommt aus der Waage oder, ohne intervals.icu, aus einem Feld daneben.
  Ohne bekanntes Körpergewicht entfallen genau die drei Paare, die es brauchen.

### Geändert
- **Gerechnet wird jetzt durchgehend auf e1RM-Basis.** Solange alle Lifts mit
  derselben Wiederholungszahl laufen, ist das Verhältnis zweier Arbeitsgewichte
  identisch mit dem ihrer geschätzten Maxima — der Formelfaktor kürzt sich heraus.
  Sobald aber ein Prüfwert mit einer anderen Wiederholungszahl dazukommt, stimmt
  das nicht mehr: 82,5 zu 105 sind 0,79, aber ein Fünfersatz gegen einen
  gemessenen Einzelversuch sind 0,88. **Zwölf Prozent Unterschied**, und niemand
  sieht der Zahl an, woher sie kommt. Für die vier bisherigen Verhältnisse ändert
  sich dadurch nichts.
- **Die Diagnose bleibt bei den Grundlifts.** Drei der neuen Paare hängen am
  Kreuzheben und zwei an der Kniebeuge. Wer einseitige Arbeit nie trainiert, hätte
  dort reihenweise „Kreuzheben ist voraus" erzeugt — eine Diagnose über den
  falschen Lift. Für die Prüfwerte gibt es stattdessen eine eigene, vorsichtigere
  Aussage: genannt wird nur, was selbst die schwache Seite eines Paars ist.

### Bewusst so
- **Ein Zusatz von null ist eine Angabe, kein fehlender Wert.** Klimmzüge ohne
  Zusatzgewicht sind trotzdem eine Last, nämlich der eigene Körper. Die erste
  Fassung verwarf die Null — beide Klimmzug-Paare fielen lautlos weg.
- **Klimmzug zu Dip ist als Faustregel ausgewiesen, nicht als belegt.** Die
  Tabelle vergleicht diese beiden über Wiederholungen, nicht über Last; der Wert
  1,25 ist aus ihren Gewichtsangaben gebildet und damit eine Ableitung, keine
  Aussage der Quelle. Alle anderen Zielwerte dieser Gruppe stehen dort direkt.

---

## 2026-09-12.2

### Neu
- **Ein Analyseteil in der Tour.** Vier Blöcke, die eine Frage beantworten, die
  man sich selbst nicht beantworten kann — beim eigenen Training sieht man immer
  nur den Lift, an dem man gerade steht.

  **Wo du schief stehst.** Vier Kraftverhältnisse mit Ist-Wert, Zielwert und
  Abweichung. Der Zielwert für Back Squat zu Kreuzheben stammt aus einer
  Verhältnis-Tabelle, der Rest sind gängige Faustregeln — beides ist in der
  Anzeige unterschieden, nicht vermischt. Daneben steht ein zweiter Maßstab: dein
  eigener Stand vor der Pause aus den `reference`-Werten. Beim Wiederaufbau ist
  der aussagekräftiger als ein Durchschnitt über alle Körper.

  Entscheidend ist aber nicht die Liste, sondern was daraus folgt: **fällt derselbe
  Lift in mehreren Paaren auf, nennt die App ihn als Ursache.** Ein einzelnes
  schiefes Verhältnis ist mehrdeutig — liegt es am Zähler oder am Nenner? Erst zwei
  Stimmen sind eine Aussage. Dazu ein Vorschlag, was zu tun wäre, mit den Übungen,
  die ohnehin schon in der Bibliothek stehen.

  **Wann du wieder da bist.** Hochrechnung je Übung aus der tatsächlichen
  Steigerungsrate (Ausgleichsgerade über acht Wochen, nicht zwei Einheiten
  verglichen) bis zum Gewicht vor der Pause. Drei Lagen: erreicht, läuft, steht —
  und bei einer Rate von null oder darunter *keine* Hochrechnung, denn „in null
  Wochen" wäre schlimmer als nichts.

  **Kraft je Kilo.** Arbeitsgewicht geteilt durch Körpergewicht, mit Verlaufskurve.
  Im Defizit die ehrlichere Zahl: absolut zu halten ist dort schon Fortschritt.
  Ohne Waagendaten entfällt der Block ganz statt eine leere Karte zu zeigen.

  **Wo es klemmt.** Plateaus, bevor der Deload-Zähler sie meldet. Neu daran ist die
  Satzquote: sie zählt einzelne Sätze statt Einheiten. Vier von fünf ist eine andere
  Lage als zwei von fünf, und beides zählt als genau ein Fehlversuch.

### Bewusst so
- **Verglichen wird nur, was dieselbe Güte hat.** Ein Verhältnis aus einem
  gemessenen und einem geschätzten Wert beschreibt die Testhistorie, nicht die
  Kraft. Basis sind deshalb die Arbeitsgewichte — alle aus derselben Progression.
  Ein Vergleich aus Max-Outs erscheint zusätzlich, aber nur wenn für **beide** Lifts
  einer vorliegt. Gemischt wird nie.
- **„Erreicht" heißt gehoben, nicht zugeteilt.** Der Automat kann ein Gewicht
  vergeben, das noch unter der Stange bewiesen werden muss. Wer sich sagen lässt, er
  sei wieder bei seinem alten Bestwert, ohne ihn gehoben zu haben, bekommt ein Lob
  für nichts.
- **Das Kreuzheben läuft mit einem Satz statt fünf.** Ein Einzelsatz lässt sich
  schwerer machen, das Verhältnis Squat zu Kreuzheben fällt dadurch etwas zu
  freundlich für die Stange aus. Das steht so in der Oberfläche, statt weggerechnet
  zu werden.

### Behoben
- **Ein Wellness-Satz ohne Datum riss vier Auswertungen mit.** `gewichtsReihe`
  prüfte die Waage, aber nicht das Datum, und warf beim Sortieren. Weil der ganze
  Wellness-Block in einem `try` hängt, fielen damit Gewichtskurve, Abnehmrate,
  Watt pro Kilo und Form gleichzeitig aus — ein fehlendes Feld in einer Zeile.
  Beim Bauen des Relativkraft-Blocks aufgefallen, der dieselbe Funktion nutzt.
- **Die Tour listete ihre Renderer zweimal** — einmal für den Normalfall, einmal
  für den Offline-Stand aus dem Zwischenspeicher. Jeder neue Block wären zwei
  Zeilen an zwei Stellen gewesen; eine davon vergisst man, und dann zeigt die Tour
  ohne Netz etwas anderes als mit. Jetzt eine Funktion, die beide Pfade aufrufen,
  und ein Durchlauf, der online gegen offline vergleicht.
- Zwischensummen in `tests/stats.test.js` und `tests/wod.test.js` lasen sich wie
  das Ende des Laufs, obwohl danach noch Hunderte Zeilen Tests kamen.

---

## 2026-09-12.1

### Neu
- **Bewegungsstandards: wann die Wiederholung zählt.** Zu jeder Übung stand bisher
  ein *Cue* („Ellbogen hoch halten") und eine Erklärung, warum sie im Programm ist.
  Beides sagt, wie es sich anfühlen soll. Keines sagt, **ob der Satz gültig war** —
  und genau das fragt man sich mitten in der Einheit, und beim Jam bei jeder
  Bewegung, die man selten macht.

  Neues Feld `standard` an **60 Übungen**, formuliert als Prüfkriterium statt als
  Hinweis. Nicht „tief in die Hocke", sondern „Hüftfalte unter der Kniescheibe,
  oben Hüfte und Knie ganz gestreckt". Sichtbar in der Bibliothek, im Jam-Aufklapper,
  im Unplugged-Plan und in der laufenden Einheit — überall dort, wo Cue und
  Erklärung schon stehen. Die Volltextsuche greift mit: wer *Lockout*, *Hüftfalte*
  oder *Abpraller* eingibt, findet die Übung über ihr Kriterium.

  **Bewusst nicht überall.** Eine Dehnung hat keine gültige Wiederholung, und bei
  Erg und Battle Ropes zählt die Uhr. Alle zehn Mobility-Übungen, die vier
  Mono-Geräte und die drei Seil-Einträge bleiben deshalb ohne Standard. Ein Feld,
  das dort trotzdem stünde, sähe nach Sorgfalt aus und wäre das Gegenteil — dieselbe
  Überlegung wie bei den Quellenangaben. Tests halten diese Entscheidung fest,
  damit sie beim nächsten Nachtragen nicht verloren geht.

### Behoben
- **Jede Unplugged-Übung hätte denselben Standard angezeigt** — den der
  Sprungkniebeuge, auch bei Liegestützen. Ursache war ein fest verdrahteter Text in
  `baueSession` statt der Durchreichung aus der Übung; im Jam fiel das Feld beim
  Bauen sogar ganz weg. Beim Gegenlesen im Browser aufgefallen, bevor es jemand
  gesehen hat. Beide Bau-Funktionen reichen das Feld jetzt durch, und je ein Test
  vergleicht über mehrere hundert gebaute Teile den Standard mit seiner Quelle —
  ein falscher Standard ist schlimmer als gar keiner.
- `tests/wod.test.js` gab mitten im Lauf eine Zwischensumme aus, die sich wie das
  Ende las, obwohl danach noch Tests kamen.

---

## 2026-09-10.1

### Geändert
- **Erklärender Text war zu leise.** `--dim` trägt fast alle Hinweiszeilen der App
  und stand bei **2,40:1** auf `--panel` — WCAG AA verlangt für kleine Schrift
  4,5:1. Ausgerechnet die kleinsten Stellen hingen daran: die Rekord-Beschriftung
  (9,5 px), die Korrektur-Knöpfe (10,5 px), die *Danach*-Zeile im Unplugged, die man
  vom Boden aus liest.

  Nachgemessen und neu gesetzt, Farbton behalten, Hierarchie `fg > muted > dim`
  bleibt erhalten:

  | Variable | vorher | nachher | Kontrast (bg / panel) |
  |---|---|---|---|
  | `--dim` dunkel | `#57535c` | `#8a848e` | 5,37 / 4,95 |
  | `--dim` hell | `#8b8580` | `#736d68` | 4,52 / 5,10 |
  | `--rot` | `#c4443c` | `#d2564e` | 4,82 / 4,44 |
  | `--line` | `#2c2a30` | `#3a373f` | Kartenkanten sichtbarer |

  Zwei bewusste Ausnahmen: `--rot` bleibt auf `--panel` mit 4,44:1 knapp unter AA —
  strikt wäre `#dd6a62`, das wirkt ausgewaschen, und Rot steht überwiegend im Banner
  auf `--bg`. Und `--line` bleibt leise: echte 3:1 für Rahmen würde die App
  vergittern, das ist eine Design- und keine Lesbarkeitsfrage.

### Neu
- **Schriftgröße umschaltbar** unter *Backstage → Darstellung*: Normal, Groß (+10 %),
  Sehr groß (+20 %). Die Wahl liegt lokal (`setlist.schrift`) und gilt nur auf diesem
  Gerät — sie geht nicht ins Repo, weil sie zum Bildschirm gehört und nicht zum
  Training.

  Dafür sind **108 feste Pixelgrößen auf `rem` umgestellt** (101 in `css/style.css`,
  7 inline in `js/app.js`); skaliert wird an einer einzigen Stelle über
  `html{font-size}`, gesetzt aus `js/boot.js` **vor dem ersten Bild** — sonst
  flackert die App beim Start kurz in der falschen Größe. Dieselbe Mechanik wie beim
  Thema.

  Bei *Normal* ist `1rem = 16px`: die Darstellung ist pixelgleich zu vorher. Das ist
  nicht behauptet, sondern geprüft — acht Bildschirme vor und nach der Umstellung
  aufgenommen und byteweise verglichen, alle acht identisch.

### Behoben
- Der Würfelknopf im Unplugged zeigte auf einen i18n-Schlüssel, den es nicht gibt
  (`aria.wuerfeln`) — sein Vorlese-Text blieb dadurch beim Sprachwechsel deutsch.

---

## 2026-09-09.1

### Behoben
- **Ein abgewählter Satz wurde stillschweigend wieder mitgezählt.** Alle fünf Sätze
  abgehakt, dann einen wieder abgewählt — die Übung galt trotzdem als fertig,
  *Einheit abschließen* blieb aktiv, und die Pausenuhr stoppte.

  Ursache: `delete` hinterlässt in `done` ein **Loch**, ohne die Länge zu ändern.
  `Array.prototype.every` und `map` überspringen solche Löcher — die Prüfung
  `done.length === sets && done.every(v => v !== undefined)` war deshalb grün, obwohl
  ein Satz fehlte. Beim Abschließen blieb das Loch als `null` im Log stehen und ging
  dort als erfüllt durch: **das Gewicht stieg für einen Satz, den man gerade
  ausdrücklich zurückgenommen hatte.**

  Die Vollständigkeitsprüfung läuft jetzt als Schleife über die Indizes
  (`saetzeVollstaendig`), und die Wiederholungen gehen als dichte Liste ins Log
  (`saetzeAlsListe`) — ein nicht erfasster Satz wird zur echten Null und fällt damit
  als Fehlversuch auf, statt sich als Erfolg zu tarnen. Beide Richtungen im Browser
  nachgestellt: vorher „immer noch abschließbar", nachher richtig gesperrt.

---

## 2026-09-02.6

### Neu
- **Unplugged.** Fünfzehn Minuten, nur Körpergewicht, im Zweifel leise. Der Jam braucht
  Platz, Gerät und meist zwanzig Minuten — das hier ist die andere Lage: morgens im
  Wohnzimmer, die Familie schläft noch, in einer Viertelstunde muss es vorbei sein.
  - 22 Übungen, nichts davon braucht Gerät. Stuhl und Sofa stehen ohnehin da.
  - Feste Intervalle statt Wiederholungszahlen — bei Zeitdruck zählt niemand mit.
  - Eine geführte Uhr, die selbst durch die Abschnitte läuft: große Zahl, aktueller Cue,
    Vorschau auf das Nächste. Lesbar vom Boden aus, mitten im Liegestütz.
  - 10, 15 oder 20 Minuten. Pause, Überspringen, Abbrechen.

### Bewusst so
- **„Leise" ist Voreinstellung, nicht Zusatz.** Wer um sechs Uhr Burpees springt, weckt das
  halbe Haus — und macht es genau einmal. Im Leise-Modus fällt alles Springende weg, und
  die App gibt beim Wechsel **keinen Ton**, nur Vibration.
- **Ausgewogen statt zufällig.** Jede Runde nimmt eine Übung je Muskelrichtung (Druck,
  Beine, Rumpf, Puls). Ohne das kämen vier Beinsachen hintereinander und Runde drei wäre
  nur noch Verwaltung. Über 60 Seeds geprüft.
- **Ehrlich beim Ziehen.** Ohne Stange gibt es keinen vertikalen Zug. Der Rücken bekommt
  Streckarbeit am Boden, und genau das steht auch auf dem Bildschirm — statt so zu tun,
  als wäre Superman ein Klimmzug.
- Unplugged rührt weder Arbeitsgewichte noch den A/B-Wechsel an, taucht aber in Historie,
  Kalender und Wochenlast auf — wie der Jam.

### Nebenbei
- Commit-Nachrichten für Einheiten ohne `workout` lauteten „Einheit undefined am …".

---

## 2026-09-01.81

### Dokumentation
- **README beider Sprachen mit Screenshots der neuen Bildschirme**: Ersteinrichtung,
  „Deine Stimme", Orte und Geräte, die Ortswahl aus der Kopfzeile und der Fork-Hinweis.
  Echte Bildschirme mit Beispieldaten, keine Mockups.
- Neue Tabelle **Einrichten und anpassen** in den Funktionen. „Deine Stimme" und „Orte und
  Geräte" standen bis jetzt unter *Rad und Kondition* — dort gehörten sie nie hin.
- `tools/shots.mjs` ergänzt `tools/screens.sh`: ein paar Bildschirme hängen daran, was die
  API *antwortet* (fehlende `config.json`, neuere Version im Original) und lassen sich
  nicht aus dem Zwischenspeicher stellen. Playwright statt Chrome-unter-macOS, damit es
  überall läuft.

### Nebenbei
- Ankreuzfelder tragen jetzt die Bernsteinfarbe der App statt des Browser-Blaus.

---

## 2026-09-01.80

### Behoben — Datenverlust
- **Orte konnten verschwinden (schwerwiegend, von mir eingebaut).** Wer die Tour öffnete,
  *bevor* die Konfiguration geladen war, bekam einen leeren Orte-Entwurf. Der blieb in
  einer Modulvariable hängen und wurde auch dann nicht erneuert, wenn die Konfiguration
  kurz darauf ankam — die Liste zeigte weiter „Noch keine Orte eingerichtet". Ein Klick auf
  *Orte speichern* schrieb daraufhin `gyms: []` in die `config.json`, mit einem fröhlichen
  „ORTE GESPEICHERT" dazu. Nachgestellt und Zeile für Zeile belegt.

  Vier Stellen repariert:
  - Ohne geladene Konfiguration entsteht **kein** Entwurf mehr; es steht „Lädt…" und der
    Speichern-Knopf ist gesperrt.
  - Ein Entwurf wird verworfen, sobald eine Konfiguration geladen ist — auch aus dem
    Zwischenspeicher. Ein veralteter Entwurf kann keine frische Konfiguration überdauern.
  - Steht die Tour beim Fertigladen schon offen, wird sie aufgefrischt statt stehen zu
    bleiben (und der Mensch nicht auf den Startbildschirm zurückgerissen).
  - Letzte Sicherung beim Speichern: ein leerer Entwurf gegen eine Datei, in der Orte
    stehen, wird nur geschrieben, wenn wirklich etwas geändert wurde. Ausdrückliches
    Löschen aller Orte bleibt damit möglich, versehentliches Leerschreiben nicht.
- Der Ort-Knopf in der Kopfzeile blieb nach der Rückkehr aus der Tour auf altem Stand.

### Falls es dich getroffen hat
`config.json` liegt in einem Git-Repo — jede Änderung ist ein Commit. Unter
`setlist-data` → `config.json` → **History** steht der Stand von vor dem Überschreiben,
inklusive `gyms`-Block zum Zurückkopieren.

---

## 2026-09-01.79

### Neu
- **Der Ort steht jetzt im Kopf.** Ein Knopf in der Kopfzeile zeigt, wo du gerade
  trainierst, und öffnet die Auswahl — auf dem Startbildschirm wie im Jam. Vorher ging das
  nur im Jam, und man musste erst dorthin navigieren, um umzustellen.
- In der Auswahl steht je Ort, wie viele Jam-Bewegungen dort möglich sind (`14/31`) —
  sonst wählt man einen Ort und merkt erst danach, dass kaum etwas übrig bleibt.
- Im Jam ersetzt der Knopf die alte Chipreihe. Ein Umstellen dort würfelt weiterhin sofort
  neu, mit gleichem Seed und anderem Vorrat; der Hinweis unter der Kopfzeile bleibt.

### Bewusst so
- **Ohne eingerichtete Orte bleibt der Knopf weg.** Ein Schalter mit genau einer Stellung
  ist kein Schalter — und alles verhält sich dann exakt wie vorher.
- Lange Ortsnamen werden in der Kopfzeile beschnitten statt sie zu sprengen; im Dialog
  steht der volle Name.

---

## 2026-09-01.78

Die Schicht, die aus einem Programm *deine* App macht — bisher lag sie nur in
handgeschriebenem JSON und war damit faktisch für genau eine Person erreichbar.

### Neu
- **Tour → Backstage → Deine Stimme.** Drei Dinge sind jetzt in der App eintragbar:
  - **Dein Grund** — erscheint an den harten Tagen, und nur dann, damit er sich nicht
    abnutzt.
  - **Eigene Zeilen** — eine pro Zeile, gemischt mit den 52 mitgelieferten.
  - **Bestleistungen von früher** — je Übung Datum, bestes Einzel, bester 5er. Mit Datum
    erinnert die App an Jahrestagen daran:

    > **Aus deiner Geschichte** — Heute vor 5 Jahren: 140 kg Back Squat. Heute stehst du
    > bei 40 kg — nicht weil du weniger kannst, sondern weil du wieder anfängst.

### Bewusst so
- **Was von Hand gepflegt wurde, überlebt.** Nach Situation getrennte Sprüche
  (`comeback`, `leicht`, …) bleiben erhalten, auch wenn das Textfeld geleert wird — die
  Oberfläche schreibt nur unter `alle`. Ebenso bleiben `records.quelle` und
  `records.weitere` unangetastet.
- **Ein Datum allein ist keine Bestleistung.** Ohne Gewicht fällt der Eintrag weg, sonst
  stünde ein Jahrestag im Kalender, zu dem es nichts zu sagen gibt. Umgekehrt geht ein
  Gewicht ohne Datum durch — es zählt dann bei den Bestwerten, nur ohne Jahrestag.
- **Leere Felder räumen auf** statt leere Hüllen stehen zu lassen: kein Grund heißt kein
  `ziele`-Block, keine Rekorde heißt kein `records.programm`.
- **Zwei Dateien, beide vorher frisch gelesen** — `config.json` und `stimme.json`.
  `stimme.json` wird nur angefasst, wenn sich dort auch wirklich etwas ändert.

### Testabdeckung
Von 696 auf **745**. `persoenlich.test.js` prüft vor allem die Fälle, in denen etwas
verloren gehen könnte: handgepflegte Situationszeilen, `quelle` und `weitere` neben den
ersetzten Rekorden, halbe Daten, unsinnige Gewichte.

---

## 2026-09-01.77

Der erste Schritt weg von „das ist die App ihres Autors" hin zu „das kann jemand anderes auch
benutzen". Die höchste Hürde war nicht das Training, sondern eine JSON-Datei.

### Behoben
- **Drei Abstürze bei unvollständiger `config.json`.** Fehlte `week`, fehlte `week.slots`
  oder stand ein Radslot ohne `rides`-Array da, starb der komplette Startbildschirm — ohne
  Meldung, ohne Hinweis, was fehlt. Wer die Datei von Hand schrieb, lief mit hoher
  Wahrscheinlichkeit hinein. Jetzt bleibt die Wochenübersicht in diesen Fällen leer und
  alles andere läuft weiter.

### Neu
- **Geführte Ersteinrichtung.** Findet die App kein Programm im Repo, kommt kein Fehler
  mehr, sondern ein Bildschirm: Stangengewicht, die fünf Übungen mit Startgewicht,
  Krafttage, optional Radtage. Daraus schreibt sie eine gültige `config.json`. Ein neues
  Repo braucht damit **keine einzige Datei von Hand**.
- „Überall mit der leeren Stange anfangen" als ein Klick — die ehrlichste Antwort auf
  „welches Startgewicht?", wenn man es nicht weiß.
- Ein Tag kann nicht Kraft- und Radtag zugleich sein; das Umschalten räumt den anderen
  automatisch ab.
- Wochentagskürzel sind jetzt übersetzt — vorher stand auch im englischen Modus
  „MO DI MI DO FR SA SO", auf dem Startbildschirm wie im Einrichten.

### Bewusst so
- **Die Aufteilung bleibt fest.** A/B, 5×5, Deadlift 1×5 — das ist das Programm, keine
  Einstellung. Wer daran dreht, hat am Ende eine beliebige Gym-App.
- **Vor dem Schreiben wird frisch nachgesehen.** Liegt inzwischen doch eine `config.json`
  da, wird sie nicht überschrieben.
- `rides` wird nur angelegt, wenn es auch Radtage gibt — ein leeres Array war genau die
  Falle, die den Startbildschirm sterben ließ.

### Testabdeckung
Von 644 auf **696**. `einrichten.test.js` prüft neben der Baulogik vor allem das, worauf es
ankommt: dass jede erzeugte Konfiguration ohne Nacharbeit durch `initialState`,
`planWeek` und `planWorkout` geht — für nur Kraft, Kraft und Rad, einen einzigen Tag und
alle sieben. Dazu die drei Absturzfälle in `program.test.js`.

---

## 2026-09-01.76

### Neu
- **Ein Fork merkt jetzt, dass es etwas Neues gibt.** Wer die App selbst betreibt, hat das
  Repo geforkt — und ein Fork bleibt stehen, wo er abgezweigt ist, ohne dass es jemandem
  auffällt. Die App vergleicht ihre Version beim Start mit der des Originals und sagt
  einmalig Bescheid; unter *Backstage → App* steht dann, welche Version oben liegt und
  welche hier läuft, samt Weg zum Aktualisieren (**Sync fork → Update branch**).
- Beide READMEs bekommen einen Schritt „Updates holen", auch für den Fall eigener
  Code-Änderungen über `upstream`-Remote.

### Bewusst so
- **Nur ein Hinweis, keine Selbstaktualisierung.** Ein Fork, der sich selbst überschreibt,
  wäre eine Fernsteuerung fremder Repos.
- **Höchstens einmal je neuer Version.** Ein Hinweis bei jedem Start wird nach dem dritten
  Mal weggeklickt statt gelesen.
- **Auf der Seite des Originals wird gar nicht erst gefragt** — dort ist man selbst die
  Quelle. Ebenso wenig beim lokalen Entwickeln.
- Versionen werden in Datum und laufende Nummer zerlegt verglichen. Als Zeichenkette wäre
  `.100` kleiner als `.75`, und genau dann fände ein Fork sein Update nicht.

---

## 2026-09-01.75

Ergebnis eines Sicherheits- und Datenschutz-Durchgangs.

### Behoben — Sicherheit
- **Fremdtext wurde ungeprüft ins DOM geschrieben (schwerwiegend).** Aktivitätsnamen aus
  intervals.icu setzt nicht der Nutzer, sondern Strava, Zwift oder eine Gruppenfahrt. Ein
  Name mit HTML darin führte Code aus — nachgestellt und reproduziert: drei Ausführungen
  auf Start- und Tour-Ansicht. Aus diesem Kontext sind GitHub-Token und intervals.icu-Key
  im `localStorage` lesbar, das Risiko war also der vollständige Verlust beider Zugänge.
  Sämtlicher Fremdtext wird jetzt maskiert (`js/sicher.js`): intervals.icu-Daten,
  Fehlermeldungen der GitHub-API, Namen und Freitexte aus `config.json`, `stimme.json`,
  `bibliothek.json` und den Log-Dateien.
- **Strikte Content-Security-Policy** als zweite Verteidigungslinie. `script-src 'self'`
  macht eingeschleuste `onerror`-Handler wirkungslos, `connect-src` begrenzt ausgehende
  Verbindungen auf GitHub und intervals.icu. Dafür ist das Inline-Skript nach `js/boot.js`
  gewandert — die Seite kommt damit ohne `unsafe-inline` aus.
- **Selbst eingetragene Videolinks** werden auf `http`/`https` begrenzt. Ein Link der Form
  `javascript:…` hätte sonst beim Antippen Code ausgeführt.
- **`tools/shot.html` läuft nur noch lokal.** Die Datei liegt im öffentlichen App-Repo und
  wird von GitHub Pages mit ausgeliefert — sie ruft aber `localStorage.clear()` auf. Wer
  sie versehentlich auf der eigenen Installation öffnete, verlor Token, Key und vor allem
  die Warteschlange mit noch nicht übertragenen Einheiten.
- Der YouTube-Link schickt keinen Referrer mehr — er verriet die Adresse der eigenen
  Installation und damit den GitHub-Nutzernamen.

### Neu — Datenschutz
- **Warnung, wenn das Datenrepo öffentlich steht.** Die App fragt die Sichtbarkeit beim
  Start ab und sagt es deutlich an. Vorher wäre das nie aufgefallen: ein öffentliches Repo
  funktioniert genauso gut wie ein privates, nur liest es die ganze Welt mit.
- README beider Sprachen bekommen einen Abschnitt, der belegbar aufführt, was wohin geht.

### Testabdeckung
Von 500 auf **617 Tests**. Vier neue Dateien für Bereiche, die vorher gar nicht oder nur
indirekt abgedeckt waren:
- `sicher.test.js` — Maskierung und Adressprüfung, inklusive des konkreten Angriffsstrings.
- `store.test.js` — die Speicherschicht hatte bisher **keine** Testdatei. Jetzt: Repo-Ziel
  samt Rückfallwerten, Token, Offline-Puffer und Lesecache, jeweils auch mit kaputten
  Daten.
- `grundlagen.test.js` — `isoWeek`, `mondayOf`, `ymd`, `isSuccess`, `fmtWeight`,
  `planWorkout`. Datumsrechnung inklusive der Stellen, an denen sie üblicherweise bricht:
  Sonntag, Jahreswechsel, Schalttag.
- `icu-queue.test.js` — die Warteschlange nach intervals.icu, besonders der Fall, dass eine
  Übertragung scheitert und die andere klappt.

---

## 2026-09-01.74

### Neu
- **Orte und Geräte.** Unter *Tour → Backstage → Orte und Geräte* legst du Gyms an —
  Homegym, Box, Studio — und hakst ab, was dort steht. Im Jam wählst du oben aus, wo du
  gerade bist; gewürfelt wird nur aus dem, was dieser Ort hergibt. Damit ist ein Jam
  daheim kein Glücksspiel mehr, bei dem Rudergerät und Langhantel auftauchen.
- Jede der 31 Jam-Bewegungen nennt jetzt ihre nötige Ausstattung. Reine
  Körpergewichtsübungen gehen überall.
- „Vorschläge übernehmen" legt die drei üblichen Orte grob ausgestattet an, als
  Startpunkt zum Anpassen.

### Bewusst so
- **Voreinstellung ist alles an.** Wer nichts einrichtet, bekommt exakt das Verhalten
  von vorher. Die Einschränkung ist eine Entscheidung, die man trifft, keine, in die
  man hineinstolpert.
- **Die Orte liegen im Repo, die aktuelle Wahl im Browser.** Wo du trainierst, gilt auf
  jedem Gerät; *wo du gerade stehst*, ist Sache des Geräts, das mitgeht.
- Bleiben an einem Ort weniger als zwei Bewegungen übrig, würfelt der Jam trotzdem aus
  allem — und sagt in der Ansicht, dass er das tut. Ein leerer Bildschirm wäre die
  schlechtere Antwort.

---

## 2026-09-01.73

### Neu
- **Sprachumschalter** unter *Tour → Backstage → Sprache*: Deutsch und Englisch.
  Betrifft die Oberfläche — Beschriftungen, Knöpfe, Meldungen, Hinweise. Die
  Trainingsinhalte (Ansage, Übungserklärungen, Cues, Jam-Bewegungen, Rad-Begründungen)
  bleiben vorerst deutsch: das ist Fachtext, der inhaltlich übersetzt gehört und nicht
  Wort für Wort.
- **Englische README** (`README.en.md`), beidseitig mit der deutschen verlinkt.
- **Dieser Changelog.**
- `js/i18n.js` als neue Textschicht mit 18 eigenen Tests — darunter ein Abgleich, dass
  beide Sprachen dieselben Schlüssel *und* dieselben Platzhalter haben. Ein vertipptes
  `{kg}` fiele sonst erst im Studio auf.

### Geändert
- `aria-label` der Icon-Knöpfe werden mitübersetzt statt fest deutsch zu bleiben.
- Zahlformate folgen der gewählten Sprache (`1.234` gegen `1,234`).

---

## 2026-09-01.72

### Behoben
- Die Token-Anleitung ließ offen, ob die Einstellungen im Repo oder im eigenen Konto
  liegen. Setup-Screen und README verweisen jetzt ausdrücklich auf *Profilbild →
  Settings* und grenzen das von den Repo-Settings ab. (Rückmeldung des ersten
  Selbsteinrichters.)

---

## 2026-08-31.71

### Neu
- **Repo-Ziel im Setup-Screen einstellbar.** GitHub-Nutzername und Name des Datenrepos
  werden in der App eingetragen statt in `js/store.js` einkompiliert — eine eigene
  Instanz braucht damit keinen Code-Editor mehr. Bestehende Installationen laufen über
  einen Rückfallwert unverändert weiter.
- **Anleitung zum Selbst-Einrichten** in der README, mit geprüftem Minimalbeispiel für
  `config.json`.

### Geändert
- **Körpergewicht von der Startseite in die Tour** verschoben. Es steht jetzt bei
  Fitness und Ermüdung statt auf dem Bildschirm, den man anderen zeigt.

---

## 2026-08-31.70

### Neu
- **Erholung aus HRV und Schlaf**, gelesen aus intervals.icu (meist über HealthFit aus
  Apple Health). Die HRV wird nur relativ zur eigenen Basis der letzten Tage bewertet,
  nie absolut — absolute Schwellen sagen zwischen zwei Menschen nichts.
- Fällt die Erholung ab, **sagt die App TECHNIK an** und überstimmt damit Trainingsplan
  und offene Fehlversuche. Beides sieht etwas, das reine Trainingslast nicht erfasst.

---

## 2026-08-30

### Neu
- **Bibliothek**: alle Übungen an einem Ort — Grundlifts, Technik, Mobility, Finisher
  und Jam-Bewegungen, durchsuchbar und nach Kategorie filterbar. Eigene Notizen und
  Videolinks landen in `bibliothek.json` und wachsen mit.
- **Frage nach dem Gefühl** auf dem Geschafft-Screen (Leicht / Normal / Hart / Extrem)
  und **Ansage gegen Gefühl** in der Tour. Damit wird die Vorhersage überprüfbar statt
  bloß behauptet.
- **Mobility** als eigener Block und eigener Knopf, einmal pro Kalenderwoche fällig —
  bei der ersten Einheit, egal ob Kraft oder Jam.
- **Ton** bei Pausenende und Einheitsabschluss, zusätzlich zur Vibration.
- Zwölf neue Jam-Bewegungen (Kettlebell, Kurzhantel, Toes-to-Bar, Air Squats, HSPU,
  Devil's Press …) und fünf neue Mobility-Dränge.
- Soundcheck-Zeilen sind abhakbar.

### Behoben
- **Pausentimer lief nach dem letzten Satz weiter.** Nach dem letzten Satz der Einheit
  gibt es nichts mehr, wofür man pausieren würde.
- **Doppelte Einträge in intervals.icu.** Die Apple Watch erkennt Krafttraining oft
  selbst über die Herzfrequenz und reicht es verzögert über Strava nach. Der eigene
  Push wartet deshalb bis zum nächsten App-Start, statt dem zuvorzukommen.
- **Echter Zufallsfehler bei kurzen Listen.** Der rohe Hashwert modulo Listenlänge ist
  bei fünf Einträgen nicht zufällig, weil 31 ≡ 1 (mod 5) — dieselbe Auswahl kam
  systematisch zu oft. Jetzt läuft der Wert erst durch eine Durchmischung.
- Zweiter Squat-Fehler ergänzt (abhebende Fersen), nach Abgleich mit der Fachliteratur.

---

## 2026-08-28

### Neu
- **Aus lifty wird Setlist.** Neuer Name, neues Gesicht: die App sieht aus wie eine
  Backline, die Woche ist eine Setlist.
- **Die Tour** wird zur Übersicht: Trainingskalender über 26 Wochen, gestapelte
  Wochenlast aus Kraft und Rad, Wochenvolumen, Fitness gegen Ermüdung, Gewichtskurve.
- **Sektion „Zum Angeben"** — bewegtes Gewicht in Marshall-Halfstacks, Wiederholungen
  seit dem ersten Log, Lieblingstag, längste Serie.
- **Zwei Spalten** ab 900 px, für den Mac.
- **Eigene Stimme**: Zeilen aus `stimme.json` werden mit 52 mitgelieferten gemischt
  statt sie zu ersetzen. Dazu Meilensteine aus den alten Bestleistungen.
- **Minierfolge** stehen nach jeder Einheit ganz oben — erst der Erfolg, dann der
  Bericht.
- **Log-Typ `anpassung`** für von Hand gesetzte Arbeitsgewichte. `state.json` bleibt
  damit durchgängig abgeleitet und wird nie direkt gepflegt.
- Erklärtexte für alle Jam-Übungen.

### Behoben
- Bestwerte-Karten sprengten auf dem Handy das Layout — die Zeilen brechen jetzt um.
- „vor 1 Tagen" bei der letzten Fahrt.
- Regelmäßigkeits-Quote zählt ab dem ersten aktiven Tag statt gegen ein halbes Jahr,
  in dem man noch gar nicht angefangen hatte.
- Münzwurf und Zeilenauswahl zogen aus denselben Bits und waren dadurch gekoppelt.
- Grammatik in den erzeugten Sätzen: falsche Artikel, doppeltes „Geschafft",
  „Woche(n)".
- Übungsnamen durchgängig englisch, auch in der Prosa.
