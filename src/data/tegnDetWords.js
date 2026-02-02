// Tegn det! ordliste
// Ord som passer godt for tegning i klasserom

const words = {
  easy: [
    // Dyr
    'hund', 'katt', 'fisk', 'fugl', 'kanin', 'mus', 'elefant', 'løve',
    'giraff', 'ape', 'slange', 'frosk', 'skilpadde', 'ku', 'gris', 'sau',
    // Mat
    'eple', 'banan', 'pizza', 'is', 'kake', 'hamburger', 'pølse', 'egg',
    // Gjenstander
    'bil', 'hus', 'tre', 'sol', 'måne', 'stjerne', 'blomst', 'ball',
    'bok', 'stol', 'bord', 'seng', 'dør', 'vindu', 'klokke', 'lampe',
    // Kropp
    'hånd', 'fot', 'øye', 'nese', 'munn', 'øre', 'hjerte',
  ],
  medium: [
    // Aktiviteter
    'svømme', 'løpe', 'sove', 'spise', 'lese', 'skrive', 'tegne', 'synge',
    'danse', 'hoppe', 'klatre', 'sykle', 'kjøre bil',
    // Steder
    'skole', 'sykehus', 'butikk', 'restaurant', 'kirke', 'slott', 'strand',
    'fjell', 'skog', 'innsjø',
    // Mer avanserte gjenstander
    'paraply', 'briller', 'sko', 'hatt', 'veske', 'nøkkel', 'telefon',
    'datamaskin', 'fjernkontroll', 'saks', 'hammer', 'stige',
    // Dyr
    'pingvin', 'hai', 'hval', 'blekksprut', 'sommerfugl', 'bie', 'edderkopp',
    'snegl', 'krokodille', 'kamel', 'isbjørn',
  ],
  hard: [
    // Abstrakte konsepter (tegnes gjennom handling)
    'drøm', 'latter', 'vennskap', 'sjalusi', 'forelsket', 'redd',
    // Komplekse handlinger
    'fotografere', 'jogge', 'meditere', 'surfe', 'snowboard',
    // Yrker
    'lege', 'brannmann', 'politi', 'kokk', 'lærer', 'pilot', 'astronaut',
    // Komplekse objekter
    'romskip', 'vulkan', 'tornado', 'regnbue', 'vannfall', 'pyramide',
    'skateboard', 'helikopter', 'ubåt', 'traktor', 'motorsykkel',
    // Eventyr/fantasi
    'drage', 'enhjørning', 'trollmann', 'havfrue', 'vampyr', 'robot',
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
