// Hva mangler? - bildedatasett
// Hvert bilde har en liste med gjenstander
// For demo bruker vi emoji-baserte "bilder" som kan genereres dynamisk

const imageSets = [
  {
    id: 'skolesaker',
    name: 'Skolesaker',
    objects: ['blyant', 'viskelær', 'linjal', 'saks', 'limstift', 'penn', 'blyantspiser', 'markeringstusj'],
    emojis: {
      'blyant': '✏️',
      'viskelær': '🧽',
      'linjal': '📏',
      'saks': '✂️',
      'limstift': '🪬',
      'penn': '🖊️',
      'blyantspiser': '🔧',
      'markeringstusj': '🖍️'
    }
  },
  {
    id: 'frukt',
    name: 'Frukt',
    objects: ['eple', 'banan', 'appelsin', 'druer', 'jordbær', 'kirsebær', 'vannmelon', 'sitron'],
    emojis: {
      'eple': '🍎',
      'banan': '🍌',
      'appelsin': '🍊',
      'druer': '🍇',
      'jordbær': '🍓',
      'kirsebær': '🍒',
      'vannmelon': '🍉',
      'sitron': '🍋'
    }
  },
  {
    id: 'dyr',
    name: 'Dyr',
    objects: ['hund', 'katt', 'kanin', 'fugl', 'fisk', 'hamster', 'skilpadde', 'frosk'],
    emojis: {
      'hund': '🐕',
      'katt': '🐱',
      'kanin': '🐰',
      'fugl': '🐦',
      'fisk': '🐟',
      'hamster': '🐹',
      'skilpadde': '🐢',
      'frosk': '🐸'
    }
  },
  {
    id: 'transport',
    name: 'Transport',
    objects: ['bil', 'buss', 'tog', 'fly', 'sykkel', 'båt', 'helikopter', 'motorsykkel'],
    emojis: {
      'bil': '🚗',
      'buss': '🚌',
      'tog': '🚂',
      'fly': '✈️',
      'sykkel': '🚲',
      'båt': '⛵',
      'helikopter': '🚁',
      'motorsykkel': '🏍️'
    }
  },
  {
    id: 'sport',
    name: 'Sport',
    objects: ['fotball', 'basketball', 'tennis', 'ishockey', 'ski', 'svømming', 'golf', 'volleyball'],
    emojis: {
      'fotball': '⚽',
      'basketball': '🏀',
      'tennis': '🎾',
      'ishockey': '🏒',
      'ski': '⛷️',
      'svømming': '🏊',
      'golf': '⛳',
      'volleyball': '🏐'
    }
  },
  {
    id: 'mat',
    name: 'Mat',
    objects: ['pizza', 'hamburger', 'is', 'kake', 'brød', 'ost', 'pølse', 'popcorn'],
    emojis: {
      'pizza': '🍕',
      'hamburger': '🍔',
      'is': '🍦',
      'kake': '🎂',
      'brød': '🍞',
      'ost': '🧀',
      'pølse': '🌭',
      'popcorn': '🍿'
    }
  },
  {
    id: 'vaer',
    name: 'Vær',
    objects: ['sol', 'sky', 'regn', 'snø', 'lyn', 'regnbue', 'vind', 'tåke'],
    emojis: {
      'sol': '☀️',
      'sky': '☁️',
      'regn': '🌧️',
      'snø': '❄️',
      'lyn': '⚡',
      'regnbue': '🌈',
      'vind': '💨',
      'tåke': '🌫️'
    }
  },
  {
    id: 'musikk',
    name: 'Musikk',
    objects: ['gitar', 'piano', 'trommer', 'fiolin', 'trompet', 'mikrofon', 'note', 'hodetelefoner'],
    emojis: {
      'gitar': '🎸',
      'piano': '🎹',
      'trommer': '🥁',
      'fiolin': '🎻',
      'trompet': '🎺',
      'mikrofon': '🎤',
      'note': '🎵',
      'hodetelefoner': '🎧'
    }
  }
];

/**
 * Get all available image sets
 */
export function getImageSets() {
  return imageSets;
}

/**
 * Get a specific image set by ID
 */
export function getImageSet(id) {
  return imageSets.find(set => set.id === id);
}

/**
 * Get a random image set
 */
export function getRandomImageSet() {
  return imageSets[Math.floor(Math.random() * imageSets.length)];
}

/**
 * Generate a round with a random object removed
 * @param {string} setId - The image set ID
 * @param {number} objectCount - Number of objects to show (default: 6)
 */
export function generateRound(setId, objectCount = 6) {
  const set = getImageSet(setId) || getRandomImageSet();

  // Shuffle and pick objects
  const shuffled = [...set.objects].sort(() => Math.random() - 0.5);
  const selectedObjects = shuffled.slice(0, Math.min(objectCount, shuffled.length));

  // Pick one to remove
  const removedIndex = Math.floor(Math.random() * selectedObjects.length);
  const removedObject = selectedObjects[removedIndex];
  const remainingObjects = selectedObjects.filter((_, i) => i !== removedIndex);

  return {
    setName: set.name,
    allObjects: selectedObjects,
    remainingObjects,
    removedObject,
    emojis: set.emojis
  };
}

/**
 * Shuffle array
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default imageSets;
