// Die Drops, ein Datensatz je Monat, der neueste unten. Texte in eigenen Worten,
// deutsch und englisch; jeder Fakt ab "selten" steht mit Quelle da und wird von
// tests/drops.test.js auf Vollstaendigkeit geprueft (pruefeDrop in drops.js).
//
// Ein neuer Monat: Eintrag anhaengen, Test laufen lassen, version.json und
// CACHE in sw.js setzen. Vor dem Eintragen jeden Fakt an der Quelle nachlesen;
// was sich nicht belegen laesst, kommt nicht rein. Farben der Plektren sind
// Material, keine App-Palette.

const BARBELL = 'https://iwf.sport/weightlifting_/equipment/';
const POWERLIFTING = 'https://www.powerlifting.sport/about-ipf/disciplines';
const HALL = 'https://www.guinnessworldrecords.com/world-records/441064-heaviest-strongman-deadlift';
const MILO = 'https://www.britannica.com/biography/Milo-of-Croton';
// Quellen gegengelesen am 21.11.2026 (Hall, Sabbath, Ace of Spades, Lemmy, Baum, Hantel, Dreikampf, Milo):
const SABBATH = 'https://en.wikipedia.org/wiki/Black_Sabbath_(album)';
const ACE = 'https://en.wikipedia.org/wiki/Ace_of_Spades_(song)';
const BAUM = 'https://www.christianitytoday.com/history/issues/issue-92/o-tannenbaum-o-tannenbaum.html';
const LEMMY = 'https://en.wikipedia.org/wiki/Lemmy';
// Januar (Quellen am 21.11.2026 gegengelesen):
const IOMMI = 'https://en.wikipedia.org/wiki/Tony_Iommi';
const GIRYA = 'https://us.humankinetics.com/blogs/excerpt/history-of-kettlebell-and-kettlebell-sport';
const FAREWELL = 'https://news.pollstar.com/2025/07/07/ozzy-osbourne-bids-farewell-plays-final-show-with-black-sabbath-special-guests/';
const SABBATH_BAND = 'https://www.britannica.com/topic/Black-Sabbath';

export const DROPS = [
  {
    id: '2026-11',
    datum: '2026-11-01',
    thema: { de: 'Eisen', en: 'Iron' },
    titel: { de: 'Stahl und Stange', en: 'Steel and Bar' },
    text: {
      de: 'Vier Kleinigkeiten aus dem Gym-Koffer und drei Geschichten, warum die Stange so ist, wie sie ist.',
      en: 'Four small things from the gym bag and three stories on why the bar is the way it is.'
    },
    sprueche: [
      { de: 'Magnesia an die Hände, Kopf frei. Der Rest ist Eisen.', en: 'Chalk on the hands, head clear. The rest is iron.' },
      { de: 'Die Stange lügt nicht. Deshalb mag ich sie.', en: 'The bar does not lie. That is why I like it.' },
      { de: 'Wer die Scheiben sauber lädt, spielt sauber.', en: 'Load the plates clean, play it clean.' }
    ],
    plektren: [
      { id: 'g-magnesia', stufe: 'g', farbe: '#d9d2c0', form: 'std',
        name: { de: 'Magnesia', en: 'Chalk' },
        text: { de: 'Trockene Hände, sicherer Griff.', en: 'Dry hands, safe grip.' } },
      { id: 'g-gurt', stufe: 'g', farbe: '#7a3b8c', form: 'jazz',
        name: { de: 'Hebegurt', en: 'Lifting belt' },
        text: { de: 'Fest, aber nicht als Ausrede.', en: 'Tight, but not an excuse.' } },
      { id: 'g-kreide', stufe: 'g', farbe: '#e8c23a', form: 'tri',
        name: { de: 'Kreidestift', en: 'Chalk marker' },
        text: { de: 'Wer aufschreibt, was er hebt, hebt mehr.', en: 'Write down what you lift, lift more.' } },
      { id: 'g-klemme', stufe: 'g', farbe: '#6c7377', form: 'std',
        name: { de: 'Hantelklemme', en: 'Barbell collar' },
        text: { de: 'Klein, schwer, hält alles zusammen.', en: 'Small, heavy, holds it together.' } },
      { id: 's-zwanzig', stufe: 's', farbe: '#b9c0c6', form: 'std', material: 'metall',
        name: { de: 'Zwanzig Kilo', en: 'Twenty kilos' },
        text: { de: 'Die olympische Männerstange wiegt zwanzig Kilo.', en: 'The Olympic men\'s bar weighs twenty kilos.' },
        fakt: {
          de: 'Die Langhantel der Männer wiegt im Gewichtheber-Wettkampf 20 kg.',
          en: 'The men\'s barbell in weightlifting competition weighs 20 kg.'
        },
        quelle: BARBELL },
      { id: 's-drei', stufe: 's', farbe: '#2f6fa3', form: 'jazz', material: 'metall',
        name: { de: 'Drei Lifts', en: 'Three lifts' },
        text: { de: 'Kniebeuge, Bankdrücken, Kreuzheben — mehr braucht der Wettkampf nicht.', en: 'Squat, bench, deadlift — the sport needs no more.' },
        fakt: {
          de: 'Kraftdreikampf besteht aus Kniebeuge, Bankdrücken und Kreuzheben.',
          en: 'Powerlifting consists of the squat, the bench press and the deadlift.'
        },
        quelle: POWERLIFTING },
      { id: 'e-fuenfhundert', stufe: 'e', farbe: '#c8322b', form: 'tri', material: 'metall',
        name: { de: 'Fünfhundert', en: 'Five hundred' },
        text: { de: 'Eine Zahl, an der lange niemand vorbeikam.', en: 'A number nobody got past for a long time.' },
        fakt: {
          de: 'Eddie Hall hob am 9. Juli 2016 in Leeds 500 kg im Kreuzheben, ein Strongman-Rekord laut Guinness.',
          en: 'On 9 July 2016 in Leeds Eddie Hall deadlifted 500 kg, a strongman record according to Guinness.'
        },
        quelle: HALL },
      { id: 'q-p-nov-fuenf', quest: 'q-nov-fuenf', stufe: 'q', farbe: '#b9c0c6', form: 'std', material: 'metall',
        name: { de: 'Fünferpack', en: 'Five-pack' },
        text: { de: 'Fünf Tage im November, Scheibe für Scheibe.', en: 'Five days in November, plate by plate.' } },
      { id: 'q-p-nov-pause', quest: 'q-nov-pause', stufe: 'q', farbe: '#2f6fa3', form: 'tri', material: 'metall',
        name: { de: 'Durchhalter', en: 'Stayer' },
        text: { de: 'Zwei Wochen in Folge, kein Tag Ausrede.', en: 'Two weeks in a row, not one day of excuses.' } }
    ],
    quests: [
      { id: 'q-nov-fuenf', stufe: 'e',
        name: { de: 'Fünf im November', en: 'Five in November' },
        text: { de: 'Fünf Trainingstage im November.', en: 'Five training days in November.' },
        regel: { typ: 'tage', n: 5 } },
      { id: 'q-nov-pause', stufe: 'l',
        name: { de: 'Ohne Pause', en: 'No pause' },
        text: { de: 'Zwei Wochen in Folge trainiert, jede mit mindestens einer Einheit.', en: 'Two weeks in a row, each with at least one session.' },
        regel: { typ: 'wochen', n: 2 } }
    ],
    zugabe: { id: 'z-milo', stufe: 'z', farbe: '#d6a92e', form: 'std', material: 'metall',
      name: { de: 'Milos Kalb', en: 'Milo\'s calf' },
      text: { de: 'Jeden Tag ein bisschen mehr — so geht die Legende.', en: 'A little more every day — so goes the legend.' },
      fakt: {
        de: 'Der Legende nach trug der Ringer Milon von Kroton ein Kalb täglich, bis es ausgewachsen war — das klassische Bild für steigende Last.',
        en: 'Legend has it the wrestler Milo of Croton carried a calf every day until it was fully grown — the classic picture of progressive load.'
      },
      quelle: MILO }
  },
  {
    id: '2026-12',
    datum: '2026-12-01',
    thema: { de: 'Winter', en: 'Winter' },
    titel: { de: 'Kerzen und Kabel', en: 'Candles and Cables' },
    text: {
      de: 'Der Dezember hängt an den Türchen des Adventskalenders: fünf Plektren öffnen sich dort, der Rest kommt über Übungstage.',
      en: 'December hangs on the advent calendar doors: five picks open there, the rest come with training days.'
    },
    sprueche: [
      { de: 'Draußen Schnee, drinnen Eisen. Die Mischung stimmt.', en: 'Snow outside, iron inside. The mix is right.' },
      { de: 'Ich hab die Lichterkette am Verstärker festgemacht. Kein Wort dazu.', en: 'I hung the fairy lights on the amp. Not a word.' },
      { de: 'Plätzchen sind auch Ladung. Nur kein Ersatz für Aufwärmen.', en: 'Cookies are load too. Just no replacement for a warm-up.' }
    ],
    plektren: [
      { id: 'g-lichterkette', stufe: 'g', farbe: '#e8c23a', form: 'jazz',
        name: { de: 'Lichterkette', en: 'Fairy lights' },
        text: { de: 'Warmes Licht im Proberaum.', en: 'Warm light in the rehearsal room.' } },
      { id: 'g-waermflasche', stufe: 'g', farbe: '#c8322b', form: 'std',
        name: { de: 'Wärmflasche', en: 'Hot water bottle' },
        text: { de: 'Erst die Finger, dann die Stange.', en: 'Fingers first, bar second.' } },
      { id: 'g-thermos', stufe: 'g', farbe: '#6c7377', form: 'tri',
        name: { de: 'Thermoskanne', en: 'Thermos flask' },
        text: { de: 'Heißer Tee zwischen den Sätzen.', en: 'Hot tea between the sets.' } },
      { id: 'g-socken', stufe: 'g', farbe: '#4a8a4b', form: 'std',
        name: { de: 'Wollsocken', en: 'Wool socks' },
        text: { de: 'Warme Füße, sicherer Stand.', en: 'Warm feet, steady stance.' } },
      { id: 't-stiefel', tuer: 6, stufe: 'g', farbe: '#7a3b8c', form: 'std',
        name: { de: 'Nikolausstiefel', en: 'Nicholas boot' },
        text: { de: 'Gefüllt wird er mit sauberen Sätzen.', en: 'It gets filled with clean sets.' } },
      { id: 't-plaetzchen', tuer: 11, stufe: 'g', farbe: '#d6a92e', form: 'jazz',
        name: { de: 'Plätzchen', en: 'Cookies' },
        text: { de: 'Drei Sorten, alle verdient.', en: 'Three kinds, all earned.' } },
      { id: 't-kerze', tuer: 15, stufe: 'g', farbe: '#d9d2c0', form: 'tri',
        name: { de: 'Kerze', en: 'Candle' },
        text: { de: 'Brennt langsam und gleichmäßig. Wie ein gutes Tempo.', en: 'Burns slow and steady. Like a good tempo.' } },
      { id: 't-zuckerstange', tuer: 19, stufe: 'g', farbe: '#c8322b', form: 'std',
        name: { de: 'Zuckerstange', en: 'Candy cane' },
        text: { de: 'Eine Stange, die man essen darf.', en: 'A bar you may eat.' } },
      { id: 't-schneekugel', tuer: 22, stufe: 'g', farbe: '#2f6fa3', form: 'jazz',
        name: { de: 'Schneekugel', en: 'Snow globe' },
        text: { de: 'Kurz schütteln, tief durchatmen.', en: 'Shake once, breathe deep.' } },
      { id: 's-ace', stufe: 's', farbe: '#1f1f22', form: 'std', material: 'metall',
        name: { de: 'Pik-Ass', en: 'Ace of spades' },
        text: { de: 'Laut, schnell, kein Schnickschnack.', en: 'Loud, fast, no frills.' },
        fakt: {
          de: 'Motörheads „Ace of Spades“ erschien 1980.',
          en: 'Motörhead\'s “Ace of Spades” was released in 1980.'
        },
        quelle: ACE },
      { id: 's-baum', stufe: 's', farbe: '#4a8a4b', form: 'tri', material: 'metall',
        name: { de: 'Tannenbaum', en: 'Fir tree' },
        text: { de: 'Der Brauch ist älter, als er aussieht.', en: 'The custom is older than it looks.' },
        fakt: {
          de: 'Aus Straßburg stammt um 1605 die früheste ausführliche Beschreibung eines geschmückten Weihnachtsbaums.',
          en: 'Around 1605 Strasbourg gave us the earliest detailed written description of a decorated Christmas tree.'
        },
        quelle: BAUM },
      { id: 'e-sabbath', stufe: 'e', farbe: '#7a3b8c', form: 'std', material: 'metall',
        name: { de: 'Freitag, der 13.', en: 'Friday the 13th' },
        text: { de: 'Der Tag, an dem ein Genre anfing.', en: 'The day a genre began.' },
        fakt: {
          de: 'Das erste Black-Sabbath-Album erschien am Freitag, dem 13. Februar 1970.',
          en: 'Black Sabbath\'s debut album came out on Friday 13 February 1970.'
        },
        quelle: SABBATH },
      { id: 'q-p-zwoelf', quest: 'q-zwoelf', stufe: 'q', farbe: '#c8322b', form: 'tri', material: 'metall',
        name: { de: 'Zwölfte Nacht', en: 'Twelfth night' },
        text: { de: 'Zwölf Tage im Dezember, und keiner war leicht.', en: 'Twelve days in December, and none of them easy.' } },
      { id: 'q-p-winter', quest: 'q-winter', stufe: 'q', farbe: '#8fd3ef', form: 'jazz', material: 'metall',
        name: { de: 'Eisblume', en: 'Frost flower' },
        text: { de: 'Wächst am Fenster, wenn man dranbleibt.', en: 'Grows on the window when you keep at it.' } }
    ],
    aeste: [
      { id: 'disziplin', knoten: [
        { id: 'disziplin-4', kosten: 4, name: { de: 'Weihnachtsfrieden', en: 'Christmas truce' },
          text: { de: 'Eine weitere Lücke in einer Wochen-Folge wird verziehen.', en: 'One more gap in a weeks-in-a-row quest is forgiven.' },
          wirkung: { typ: 'lueckeWoche', wert: 1 } }
      ] },
      { id: 'winter', name: { de: 'Winter', en: 'Winter' }, knoten: [
        { id: 'winter-1', name: { de: 'Frostfest', en: 'Frostproof' },
          text: { de: 'Draußen kalt, drinnen Eisen.', en: 'Cold outside, iron inside.' }, wirkung: { typ: 'titel' } },
        { id: 'winter-2', kosten: 2, name: { de: 'Winterspeck', en: 'Winter coat' },
          text: { de: 'Tonnen-Quests brauchen 5 % weniger.', en: 'Tonnage quests need 5 % less.' }, wirkung: { typ: 'tonnenFaktor', wert: 0.95 } }
      ] }
    ],
    quests: [
      { id: 'q-zwoelf', stufe: 'e',
        name: { de: 'Die zwölf Nächte', en: 'The twelve nights' },
        text: { de: 'Zwölf Trainingstage im Dezember.', en: 'Twelve training days in December.' },
        regel: { typ: 'tage', n: 12 } },
      { id: 'q-winter', stufe: 'l',
        name: { de: 'Ohne Winterpause', en: 'No winter break' },
        text: { de: 'Vier Wochen in Folge trainiert, jede mit mindestens einer Einheit.', en: 'Four weeks in a row, each with at least one session.' },
        regel: { typ: 'wochen', n: 4 } }
    ],
    zugabe: { id: 'z-lemmy', stufe: 'z', farbe: '#d6a92e', form: 'std', material: 'metall',
      name: { de: 'Für Lemmy', en: 'For Lemmy' },
      text: { de: 'Eine Kerze, ein Riff, kein Wort zu viel.', en: 'One candle, one riff, not a word too many.' },
      fakt: {
        de: 'Lemmy Kilmister von Motörhead starb am 28. Dezember 2015.',
        en: 'Lemmy Kilmister of Motörhead died on 28 December 2015.'
      },
      quelle: LEMMY }
  },
  {
    id: '2027-01',
    datum: '2027-01-01',
    thema: { de: 'Neustart', en: 'Fresh start' },
    titel: { de: 'Neues Jahr, neue Last', en: 'New Year, New Load' },
    text: {
      de: 'Der Januar gehört den Anfängen: vier kleine Dinge fürs Training und drei Geschichten von Leuten, die trotzdem weitergemacht haben.',
      en: 'January belongs to beginnings: four small things for training and three stories of people who carried on anyway.'
    },
    sprueche: [
      { de: 'Vorsätze sind billig. Der zweite Trainingstag im Januar ist der teure.', en: 'Resolutions are cheap. The second training day in January is the expensive one.' },
      { de: 'Kein neuer Plan nötig. Der alte, nur öfter.', en: 'No new plan needed. The old one, just more often.' },
      { de: 'Ich hab den Kalender aufgehängt. Du musst nur noch kommen.', en: 'I hung the calendar. You only have to show up.' }
    ],
    plektren: [
      { id: 'g-vorsatz', stufe: 'g', farbe: '#e8c23a', form: 'std',
        name: { de: 'Vorsatz', en: 'Resolution' },
        text: { de: 'Klein genug, um ihn wirklich zu halten.', en: 'Small enough to actually keep.' } },
      { id: 'g-wandkalender', stufe: 'g', farbe: '#c8322b', form: 'jazz',
        name: { de: 'Wandkalender', en: 'Wall calendar' },
        text: { de: 'Jeder Trainingstag ein Kreuz.', en: 'Every training day a cross.' } },
      { id: 'g-stoppuhr', stufe: 'g', farbe: '#6c7377', form: 'tri',
        name: { de: 'Stoppuhr', en: 'Stopwatch' },
        text: { de: 'Pausen sind Teil des Plans. Auch die kurzen.', en: 'Rests are part of the plan. The short ones too.' } },
      { id: 'g-trinkflasche', stufe: 'g', farbe: '#2f6fa3', form: 'std',
        name: { de: 'Trinkflasche', en: 'Water bottle' },
        text: { de: 'Voll vor dem ersten Satz, leer nach dem letzten.', en: 'Full before the first set, empty after the last.' } },
      { id: 's-fingerkappen', stufe: 's', farbe: '#d9d2c0', form: 'tri', material: 'metall',
        name: { de: 'Fingerkappen', en: 'Fingertips' },
        text: { de: 'Aus einer Waschmittelflasche geschmolzen.', en: 'Melted down from a detergent bottle.' },
        fakt: {
          de: 'Tony Iommi verlor als Teenager in einer Blechfabrik die Spitzen zweier Finger der rechten Hand und baute sich Kappen aus Plastik.',
          en: 'As a teenager in a sheet-metal factory Tony Iommi lost the tips of two fingers on his right hand and made himself plastic caps.'
        },
        quelle: IOMMI },
      { id: 's-girya', stufe: 's', farbe: '#1f1f22', form: 'std', material: 'metall',
        name: { de: 'Girja', en: 'Girya' },
        text: { de: 'Erst Marktgewicht, dann Sportgerät.', en: 'Market weight first, sports gear later.' },
        fakt: {
          de: 'Das Wort „girya“ für die Kettlebell soll 1704 erstmals in einem russischen Wörterbuch stehen; die Jahreszahl wird so häufig zitiert, ist aber nur schwach belegt.',
          en: 'The word “girya” for the kettlebell is said to first appear in a Russian dictionary in 1704; the date is widely cited but thinly documented.'
        },
        quelle: GIRYA },
      { id: 'e-villapark', stufe: 'e', farbe: '#7a3b8c', form: 'std', material: 'metall',
        name: { de: 'Villa Park', en: 'Villa Park' },
        text: { de: 'Ein letzter Abend, in dem alles zusammenkam.', en: 'One last evening where it all came together.' },
        fakt: {
          de: 'Am 5. Juli 2025 spielte Black Sabbath beim Konzert „Back to the Beginning“ im Villa Park in Birmingham zum letzten Mal, Ozzy Osbourne sang sitzend.',
          en: 'On 5 July 2025 Black Sabbath played their last show at “Back to the Beginning” at Villa Park in Birmingham, with Ozzy Osbourne singing seated.'
        },
        quelle: FAREWELL },
      { id: 'q-p-zehn', quest: 'q-zehn', stufe: 'q', farbe: '#e8c23a', form: 'std', material: 'metall',
        name: { de: 'Zehnerkarte', en: 'Ten-punch card' },
        text: { de: 'Zehn Tage im ersten Monat des Jahres.', en: 'Ten days in the first month of the year.' } },
      { id: 'q-p-last', quest: 'q-last', stufe: 'q', farbe: '#7a3b8c', form: 'tri', material: 'metall',
        name: { de: 'Schwergewicht', en: 'Heavyweight' },
        text: { de: 'Vierzig Tonnen bewegt, Scheibe für Scheibe.', en: 'Forty tonnes moved, plate by plate.' } }
    ],
    aeste: [
      { id: 'kugel', knoten: [
        { id: 'kugel-3', kosten: 3, name: { de: 'Rundum schwer', en: 'Heavy all round' },
          text: { de: 'Tonnen-Quests brauchen 5 % weniger.', en: 'Tonnage quests need 5 % less.' }, wirkung: { typ: 'tonnenFaktor', wert: 0.95 } }
      ] }
    ],
    quests: [
      { id: 'q-zehn', stufe: 'e',
        name: { de: 'Zehn im Januar', en: 'Ten in January' },
        text: { de: 'Zehn Trainingstage im Januar.', en: 'Ten training days in January.' },
        regel: { typ: 'tage', n: 10 } },
      { id: 'q-last', stufe: 'l',
        name: { de: 'Vierzig Tonnen', en: 'Forty tonnes' },
        text: { de: 'Vierzig Tonnen bewegtes Gewicht im Januar.', en: 'Forty tonnes of moved weight in January.' },
        regel: { typ: 'tonnen', n: 40 } }
    ],
    zugabe: { id: 'z-birmingham', stufe: 'z', farbe: '#d6a92e', form: 'std', material: 'metall',
      name: { de: 'Birmingham 1968', en: 'Birmingham 1968' },
      text: { de: 'Jeder Anfang ist erst mal ein Proberaum.', en: 'Every beginning is first a rehearsal room.' },
      fakt: {
        de: 'Black Sabbath entstand 1968 in Birmingham, zunächst unter anderen Namen, bis sich die Band 1969 so nannte.',
        en: 'Black Sabbath formed in Birmingham in 1968 under other names before settling on the name in 1969.'
      },
      quelle: SABBATH_BAND }
  }
];
