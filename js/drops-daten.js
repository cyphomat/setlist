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
        quelle: HALL }
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
        quelle: SABBATH }
    ],
    zugabe: { id: 'z-lemmy', stufe: 'z', farbe: '#d6a92e', form: 'std', material: 'metall',
      name: { de: 'Für Lemmy', en: 'For Lemmy' },
      text: { de: 'Eine Kerze, ein Riff, kein Wort zu viel.', en: 'One candle, one riff, not a word too many.' },
      fakt: {
        de: 'Lemmy Kilmister von Motörhead starb am 28. Dezember 2015.',
        en: 'Lemmy Kilmister of Motörhead died on 28 December 2015.'
      },
      quelle: LEMMY }
  }
];
