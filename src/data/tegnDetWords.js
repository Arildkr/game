// Tegn det! ordliste
// Ord som passer godt for tegning i klasserom

const words = {
easy: [
    // Dyr
    'hund', 'katt', 'fisk', 'fugl', 'kanin', 'mus', 'elefant', 'løve',
    'giraff', 'ape', 'slange', 'frosk', 'skilpadde', 'ku', 'gris', 'sau',
    'hest', 'and', 'kylling', 'ugle', 'bjørn', 'rev',
    // Mat
    'eple', 'banan', 'pizza', 'is', 'kake', 'hamburger', 'pølse', 'egg',
    'gulrot', 'ost', 'brød', 'brus', 'jordbær', 'druer',
    // Gjenstander
    'bil', 'hus', 'tre', 'sol', 'måne', 'stjerne', 'blomst', 'ball',
    'bok', 'stol', 'bord', 'seng', 'dør', 'vindu', 'klokke', 'lampe',
    'kopp', 'skje', 'kniv', 'gaffel', 'paraply', 'hatt', 'briller',
    // Kropp
    'hånd', 'fot', 'øye', 'nese', 'munn', 'øre', 'hjerte', 'hår',
  ],
  medium: [
    // Aktiviteter
    'svømme', 'løpe', 'sove', 'spise', 'lese', 'skrive', 'tegne', 'synge',
    'danse', 'hoppe', 'klatre', 'sykle', 'kjøre bil', 'fiske', 'børste tenner',
    'vaske hender', 'gå på ski', 'spille gitar', 'sparke fotball',
    // Steder
    'skole', 'sykehus', 'butikk', 'restaurant', 'kirke', 'slott', 'strand',
    'fjell', 'skog', 'innsjø', 'park', 'kino', 'bondegård', 'flyplass', 'tivoli',
    // Mer avanserte gjenstander
    'paraply', 'briller', 'sko', 'hatt', 'veske', 'nøkkel', 'telefon',
    'datamaskin', 'fjernkontroll', 'saks', 'hammer', 'stige', 'tannbørste',
    'ryggsekk', 'koffert', 'speil', 'lommelykt', 'kompass', 'støvsuger',
    // Dyr
    'pingvin', 'hai', 'hval', 'blekksprut', 'sommerfugl', 'bie', 'edderkopp',
    'snegl', 'krokodille', 'kamel', 'isbjørn', 'flaggermus', 'ekorn', 'piggsvin',
  ],
  hard: [
    // Abstrakte konsepter
    'drøm', 'latter', 'vennskap', 'sjalusi', 'forelsket', 'redd', 'sint',
    'tålmodighet', 'flaks', 'hemmelighet', 'tid', 'musikk', 'duft',
    // Komplekse handlinger
    'fotografere', 'jogge', 'meditere', 'surfe', 'snowboard', 'grille',
    'strikke', 'trylle', 'undersøke', 'feire', 'overraske',
    // Yrker
    'lege', 'brannmann', 'politi', 'kokk', 'lærer', 'pilot', 'astronaut',
    'bonde', 'frisør', 'kunstner', 'snekker', 'tannlege', 'forsker',
    // Komplekse objekter
    'romskip', 'vulkan', 'tornado', 'regnbue', 'vannfall', 'pyramide',
    'skateboard', 'helikopter', 'ubåt', 'traktor', 'motorsykkel',
    'mikroskop', 'kikkert', 'statue', 'anker', 'rulleskøyter',
    // Eventyr/fantasi
    'drage', 'enhjørning', 'trollmann', 'havfrue', 'vampyr', 'robot',
    'spøkelse', 'sjørøver', 'romvesen', 'fe', 'troll', 'superhelt',
  ]
};

/**
 * Get all words for a difficulty
 */
export function getWordsByDifficulty(difficulty) {
  return words[difficulty] || words.easy;
}

/**
 * Get a random word
 * @param {string} difficulty - 'easy', 'medium', 'hard', or 'all'
 */
export function getRandomWord(difficulty = 'all') {
  if (difficulty === 'all') {
    const allWords = [...words.easy, ...words.medium, ...words.hard];
    return allWords[Math.floor(Math.random() * allWords.length)];
  }
  const wordList = words[difficulty] || words.easy;
  return wordList[Math.floor(Math.random() * wordList.length)];
}

/**
 * Get multiple random words (for selection)
 */
export function getRandomWords(count = 3, difficulty = 'all') {
  let wordList;
  if (difficulty === 'all') {
    wordList = [...words.easy, ...words.medium, ...words.hard];
  } else {
    wordList = words[difficulty] || words.easy;
  }

  const shuffled = [...wordList].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get all difficulties
 */
export function getDifficulties() {
  return ['easy', 'medium', 'hard'];
}

export default words;
