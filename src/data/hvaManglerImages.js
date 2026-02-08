// Hva mangler? - bildedatasett
// Hvert bilde har en liste med gjenstander
// For demo bruker vi emoji-baserte "bilder" som kan genereres dynamisk

const imageSets = [
  {
    id: 'skolesaker',
    name: 'Skolesaker',
    objects: ['blyant', 'viskelær', 'linjal', 'saks', 'limstift', 'penn', 'markeringstusj', 'bok', 'kalkulator', 'passer', 'mappe', 'stiftemaskin', 'klips', 'notatblokk', 'tavle'],
    emojis: {
      'blyant': '✏️',
      'viskelær': '🧽',
      'linjal': '📏',
      'saks': '✂️',
      'limstift': '🧴',
      'penn': '🖊️',
      'markeringstusj': '🖍️',
      'bok': '📚',
      'kalkulator': '🧮',
      'passer': '📐',
      'mappe': '📁',
      'stiftemaskin': '🗜️',
      'klips': '📎',
      'notatblokk': '📒',
      'tavle': '📋'
    }
  },
  {
    id: 'frukt',
    name: 'Frukt',
    objects: ['eple', 'banan', 'appelsin', 'druer', 'jordbær', 'kirsebær', 'vannmelon', 'sitron', 'pære', 'ananas', 'mango', 'kiwi', 'fersken', 'plomme', 'blåbær'],
    emojis: {
      'eple': '🍎',
      'banan': '🍌',
      'appelsin': '🍊',
      'druer': '🍇',
      'jordbær': '🍓',
      'kirsebær': '🍒',
      'vannmelon': '🍉',
      'sitron': '🍋',
      'pære': '🍐',
      'ananas': '🍍',
      'mango': '🥭',
      'kiwi': '🥝',
      'fersken': '🍑',
      'plomme': '🍑',
      'blåbær': '🫐'
    }
  },
  {
    id: 'dyr',
    name: 'Dyr',
    objects: ['hund', 'katt', 'kanin', 'fugl', 'fisk', 'hamster', 'skilpadde', 'frosk', 'elefant', 'løve', 'bjørn', 'mus', 'gris', 'ku', 'hest'],
    emojis: {
      'hund': '🐕',
      'katt': '🐱',
      'kanin': '🐰',
      'fugl': '🐦',
      'fisk': '🐟',
      'hamster': '🐹',
      'skilpadde': '🐢',
      'frosk': '🐸',
      'elefant': '🐘',
      'løve': '🦁',
      'bjørn': '🐻',
      'mus': '🐭',
      'gris': '🐷',
      'ku': '🐄',
      'hest': '🐴'
    }
  },
  {
    id: 'transport',
    name: 'Transport',
    objects: ['bil', 'buss', 'tog', 'fly', 'sykkel', 'båt', 'helikopter', 'motorsykkel', 'lastebil', 'taxi', 'ambulanse', 'brannbil', 'sparkesykkel', 'trikk', 'ferge'],
    emojis: {
      'bil': '🚗',
      'buss': '🚌',
      'tog': '🚂',
      'fly': '✈️',
      'sykkel': '🚲',
      'båt': '⛵',
      'helikopter': '🚁',
      'motorsykkel': '🏍️',
      'lastebil': '🚚',
      'taxi': '🚕',
      'ambulanse': '🚑',
      'brannbil': '🚒',
      'sparkesykkel': '🛴',
      'trikk': '🚃',
      'ferge': '⛴️'
    }
  },
  {
    id: 'sport',
    name: 'Sport',
    objects: ['fotball', 'basketball', 'tennis', 'ishockey', 'ski', 'svømming', 'golf', 'volleyball', 'rugby', 'baseball', 'boksing', 'skateboard', 'bowling', 'dart', 'badminton'],
    emojis: {
      'fotball': '⚽',
      'basketball': '🏀',
      'tennis': '🎾',
      'ishockey': '🏒',
      'ski': '⛷️',
      'svømming': '🏊',
      'golf': '⛳',
      'volleyball': '🏐',
      'rugby': '🏉',
      'baseball': '⚾',
      'boksing': '🥊',
      'skateboard': '🛹',
      'bowling': '🎳',
      'dart': '🎯',
      'badminton': '🏸'
    }
  },
  {
    id: 'mat',
    name: 'Mat',
    objects: ['pizza', 'hamburger', 'is', 'kake', 'brød', 'ost', 'pølse', 'popcorn', 'taco', 'sushi', 'salat', 'suppe', 'pasta', 'egg', 'bacon'],
    emojis: {
      'pizza': '🍕',
      'hamburger': '🍔',
      'is': '🍦',
      'kake': '🎂',
      'brød': '🍞',
      'ost': '🧀',
      'pølse': '🌭',
      'popcorn': '🍿',
      'taco': '🌮',
      'sushi': '🍣',
      'salat': '🥗',
      'suppe': '🍲',
      'pasta': '🍝',
      'egg': '🥚',
      'bacon': '🥓'
    }
  },
  {
    id: 'vaer',
    name: 'Vær',
    objects: ['sol', 'sky', 'regn', 'snø', 'lyn', 'regnbue', 'vind', 'tåke', 'storm', 'måne', 'stjerne', 'paraply', 'termometer', 'solbriller', 'snømann'],
    emojis: {
      'sol': '☀️',
      'sky': '☁️',
      'regn': '🌧️',
      'snø': '❄️',
      'lyn': '⚡',
      'regnbue': '🌈',
      'vind': '💨',
      'tåke': '🌫️',
      'storm': '🌪️',
      'måne': '🌙',
      'stjerne': '⭐',
      'paraply': '☂️',
      'termometer': '🌡️',
      'solbriller': '🕶️',
      'snømann': '⛄'
    }
  },
  {
    id: 'musikk',
    name: 'Musikk',
    objects: ['gitar', 'piano', 'trommer', 'fiolin', 'trompet', 'mikrofon', 'note', 'hodetelefoner', 'saxofon', 'radio', 'høyttaler', 'banjo', 'harpe', 'fløyte', 'maracas'],
    emojis: {
      'gitar': '🎸',
      'piano': '🎹',
      'trommer': '🥁',
      'fiolin': '🎻',
      'trompet': '🎺',
      'mikrofon': '🎤',
      'note': '🎵',
      'hodetelefoner': '🎧',
      'saxofon': '🎷',
      'radio': '📻',
      'høyttaler': '🔊',
      'banjo': '🪗',
      'harpe': '🪕',
      'fløyte': '🪈',
      'maracas': '🪇'
    }
  },
  {
    id: 'hjem',
    name: 'I hjemmet',
    objects: ['sofa', 'bord', 'stol', 'lampe', 'tv', 'seng', 'skap', 'klokke', 'speil', 'vaskemaskin', 'kjøleskap', 'ovn', 'støvsuger', 'dusj', 'toalett'],
    emojis: {
      'sofa': '🛋️',
      'bord': '🪵',
      'stol': '🪑',
      'lampe': '💡',
      'tv': '📺',
      'seng': '🛏️',
      'skap': '🗄️',
      'klokke': '🕐',
      'speil': '🪞',
      'vaskemaskin': '🧺',
      'kjøleskap': '🧊',
      'ovn': '🔥',
      'støvsuger': '🧹',
      'dusj': '🚿',
      'toalett': '🚽'
    }
  },
  {
    id: 'klær',
    name: 'Klær',
    objects: ['t-skjorte', 'bukse', 'kjole', 'jakke', 'sko', 'lue', 'hansker', 'sokker', 'skjerf', 'dress', 'bikini', 'shorts', 'genser', 'støvler', 'caps'],
    emojis: {
      't-skjorte': '👕',
      'bukse': '👖',
      'kjole': '👗',
      'jakke': '🧥',
      'sko': '👟',
      'lue': '🧢',
      'hansker': '🧤',
      'sokker': '🧦',
      'skjerf': '🧣',
      'dress': '🤵',
      'bikini': '👙',
      'shorts': '🩳',
      'genser': '🧶',
      'støvler': '🥾',
      'caps': '👒'
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
