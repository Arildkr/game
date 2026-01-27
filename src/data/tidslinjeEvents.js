// Tidslinje - Historiske hendelser å sortere
// Tilpasset ungdomsskole

const eventSets = [
  {
    id: 'norge-1800-1900',
    name: 'Norge 1800-tallet',
    events: [
      { id: 'grunnlov', text: 'Grunnloven ble undertegnet', year: 1814 },
      { id: 'jernbane', text: 'Norges første jernbane åpnet', year: 1854 },
      { id: 'nobel', text: 'Første Nobelpris utdelt', year: 1901 },
      { id: 'unionsopplosning', text: 'Norge ble selvstendig fra Sverige', year: 1905 },
      { id: 'stemmerett-menn', text: 'Alle menn fikk stemmerett', year: 1898 }
    ]
  },
  {
    id: 'norge-1900',
    name: 'Norge 1900-tallet',
    events: [
      { id: 'stemmerett-kvinner', text: 'Kvinner fikk stemmerett', year: 1913 },
      { id: 'ww2-norge', text: 'Tyskland okkuperte Norge', year: 1940 },
      { id: 'frigjoring', text: 'Norge ble frigjort', year: 1945 },
      { id: 'olje', text: 'Olje ble funnet i Nordsjøen', year: 1969 },
      { id: 'ol-lillehammer', text: 'OL på Lillehammer', year: 1994 }
    ]
  },
  {
    id: 'verden-krig',
    name: 'Verdenskrigene',
    events: [
      { id: 'ww1-start', text: 'Første verdenskrig startet', year: 1914 },
      { id: 'ww1-slutt', text: 'Første verdenskrig sluttet', year: 1918 },
      { id: 'ww2-start', text: 'Andre verdenskrig startet', year: 1939 },
      { id: 'd-dag', text: 'D-dagen (landgang i Normandie)', year: 1944 },
      { id: 'ww2-slutt', text: 'Andre verdenskrig sluttet', year: 1945 }
    ]
  },
  {
    id: 'teknologi',
    name: 'Teknologihistorie',
    events: [
      { id: 'telefon', text: 'Telefonen ble oppfunnet', year: 1876 },
      { id: 'radio', text: 'Første radiosending', year: 1920 },
      { id: 'tv-norge', text: 'TV-sendinger startet i Norge', year: 1960 },
      { id: 'internett', text: 'World Wide Web ble lansert', year: 1991 },
      { id: 'iphone', text: 'Første iPhone lansert', year: 2007 }
    ]
  },
  {
    id: 'romfart',
    name: 'Romfart',
    events: [
      { id: 'sputnik', text: 'Sputnik - første satelitt', year: 1957 },
      { id: 'gagarin', text: 'Første menneske i rommet', year: 1961 },
      { id: 'manen', text: 'Første menneske på månen', year: 1969 },
      { id: 'iss', text: 'ISS startet oppbyggingen', year: 1998 },
      { id: 'spacex', text: 'SpaceX sendte astronauter til ISS', year: 2020 }
    ]
  },
  {
    id: 'sport',
    name: 'Sportshistorie',
    events: [
      { id: 'ol-modern', text: 'Moderne OL startet i Athen', year: 1896 },
      { id: 'vm-fotball', text: 'Første fotball-VM', year: 1930 },
      { id: 'ol-oslo', text: 'Vinter-OL i Oslo', year: 1952 },
      { id: 'pele', text: 'Brasil vant VM med Pelé', year: 1958 },
      { id: 'messi-vm', text: 'Messi vant VM med Argentina', year: 2022 }
    ]
  },
  {
    id: 'europa',
    name: 'Europa-historie',
    events: [
      { id: 'napoleon', text: 'Napoleon ble keiser', year: 1804 },
      { id: 'berlinmur-opp', text: 'Berlinmuren ble bygget', year: 1961 },
      { id: 'berlinmur-ned', text: 'Berlinmuren falt', year: 1989 },
      { id: 'eu-grunnlagt', text: 'EU ble grunnlagt', year: 1993 },
      { id: 'euro', text: 'Euro ble innført', year: 2002 }
    ]
  },
  {
    id: 'usa',
    name: 'USA-historie',
    events: [
      { id: 'uavhengighet', text: 'USAs uavhengighetserklæring', year: 1776 },
      { id: 'borgerkrig', text: 'Den amerikanske borgerkrigen startet', year: 1861 },
      { id: 'mlk', text: 'Martin Luther King holdt "I Have a Dream"', year: 1963 },
      { id: 'maanelanding', text: 'USA landet på månen', year: 1969 },
      { id: 'obama', text: 'Obama ble USAs første svarte president', year: 2009 }
    ]
  },
  {
    id: 'oppfinnelser',
    name: 'Store oppfinnelser',
    events: [
      { id: 'dampmaskin', text: 'Dampmaskinen ble forbedret (Watt)', year: 1769 },
      { id: 'lyspere', text: 'Lyspæren ble oppfunnet', year: 1879 },
      { id: 'bil', text: 'Første bensindrevne bil', year: 1886 },
      { id: 'fly', text: 'Brødrene Wright fløy', year: 1903 },
      { id: 'antibiotika', text: 'Penicillin ble oppdaget', year: 1928 }
    ]
  },
  {
    id: 'middelalder',
    name: 'Middelalderen',
    events: [
      { id: 'viking-start', text: 'Vikingtiden begynte (Lindisfarne)', year: 793 },
      { id: 'kristendom', text: 'Norge ble kristnet', year: 1030 },
      { id: 'svartedauden', text: 'Svartedauden kom til Norge', year: 1349 },
      { id: 'kalmarunionen', text: 'Kalmarunionen ble dannet', year: 1397 },
      { id: 'columbus', text: 'Columbus kom til Amerika', year: 1492 }
    ]
  },
  {
    id: 'musikk',
    name: 'Musikkhistorie',
    events: [
      { id: 'beethoven', text: 'Beethovens 9. symfoni', year: 1824 },
      { id: 'elvis', text: 'Elvis Presley debuterte', year: 1954 },
      { id: 'beatles', text: 'Beatles debuterte', year: 1963 },
      { id: 'spotify', text: 'Spotify ble lansert', year: 2008 },
      { id: 'tiktok-musikk', text: 'TikTok endret musikkindustrien', year: 2020 }
    ]
  },
  {
    id: 'gaming',
    name: 'Spillhistorie',
    events: [
      { id: 'pong', text: 'Pong ble lansert', year: 1972 },
      { id: 'nintendo', text: 'Nintendo NES kom ut', year: 1985 },
      { id: 'playstation', text: 'Første PlayStation', year: 1994 },
      { id: 'minecraft', text: 'Minecraft ble lansert', year: 2011 },
      { id: 'fortnite', text: 'Fortnite Battle Royale', year: 2017 }
    ]
  }
];

export default eventSets;

// Get a random event set
export function getRandomEventSet() {
  return eventSets[Math.floor(Math.random() * eventSets.length)];
}

// Shuffle events (for player display)
export function shuffleEvents(events) {
  const shuffled = [...events];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Check how many events are in correct position
export function scoreSubmission(submission, correctOrder) {
  let score = 0;
  const n = correctOrder.length;

  for (let i = 0; i < submission.length; i++) {
    if (submission[i] === correctOrder[i]) {
      score += 2; // Perfect position
    } else {
      // Check if it's adjacent to correct position
      const correctIndex = correctOrder.indexOf(submission[i]);
      if (Math.abs(correctIndex - i) === 1) {
        score += 1; // One off
      }
    }
  }

  return score;
}
