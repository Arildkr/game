// Gjett Bildet - Image database
// Images are stored in /assets/images/

const BASE_PATH = '/assets/images/';

const IMAGES = {
  dyr: [
    { url: `${BASE_PATH}hund-1.jpg`, answers: ["hund", "dog"] },
    { url: `${BASE_PATH}katt-1.jpg`, answers: ["katt", "cat"] },
    { url: `${BASE_PATH}love-1.jpg`, answers: ["løve", "lion"] },
    { url: `${BASE_PATH}tiger-1.jpg`, answers: ["tiger"] },
    { url: `${BASE_PATH}elefant-1.jpg`, answers: ["elefant", "elephant"] },
    { url: `${BASE_PATH}sjiraff-1.jpg`, answers: ["sjiraff", "giraff", "giraffe"] },
    { url: `${BASE_PATH}panda-1.jpg`, answers: ["panda", "pandabjørn"] },
    { url: `${BASE_PATH}kanin-1.jpg`, answers: ["kanin", "rabbit"] },
    { url: `${BASE_PATH}isbjorn-1.jpg`, answers: ["isbjørn", "polar bear"] },
    { url: `${BASE_PATH}delfin-1.jpg`, answers: ["delfin", "dolphin"] },
    { url: `${BASE_PATH}fugl-1.jpg`, answers: ["fugl", "bird"] },
    { url: `${BASE_PATH}hest-1.jpg`, answers: ["hest", "horse"] },
    { url: `${BASE_PATH}ku-1.jpg`, answers: ["ku", "cow"] },
    { url: `${BASE_PATH}gris-1.jpg`, answers: ["gris", "pig"] },
    { url: `${BASE_PATH}sau-1.jpg`, answers: ["sau", "sheep"] },
    { url: `${BASE_PATH}ugle-1.jpg`, answers: ["ugle", "owl"] },
    { url: `${BASE_PATH}hai-1.jpg`, answers: ["hai", "shark"] },
    { url: `${BASE_PATH}frosk-1.jpg`, answers: ["frosk", "frog"] },
    { url: `${BASE_PATH}koala-1.jpg`, answers: ["koala"] },
    { url: `${BASE_PATH}pingvin-1.jpg`, answers: ["pingvin", "penguin"] },
    { url: `${BASE_PATH}flamingo-1.jpg`, answers: ["flamingo"] },
    { url: `${BASE_PATH}ulv-1.jpg`, answers: ["ulv", "wolf"] },
    { url: `${BASE_PATH}bjorn-1.jpg`, answers: ["bjørn", "bear", "brunbjørn"] },
    { url: `${BASE_PATH}elg-1.jpg`, answers: ["elg", "moose"] },
    { url: `${BASE_PATH}and-1.jpg`, answers: ["and", "duck"] },
    { url: `${BASE_PATH}slange-1.jpg`, answers: ["slange", "snake"] },
  ],

  steder: [
    { url: `${BASE_PATH}eiffel-1.jpg`, answers: ["eiffeltårnet", "eiffel tower", "paris"] },
    { url: `${BASE_PATH}colosseum-1.jpg`, answers: ["colosseum", "kolosseum", "roma", "rome"] },
    { url: `${BASE_PATH}frihetsgudinnen-1.jpg`, answers: ["frihetsgudinnen", "statue of liberty", "new york"] },
    { url: `${BASE_PATH}taj-mahal-1.jpg`, answers: ["taj mahal", "india"] },
    { url: `${BASE_PATH}sydney-1.jpg`, answers: ["sydney", "operahuset", "opera house", "australia"] },
    { url: `${BASE_PATH}golden-gate-1.jpg`, answers: ["golden gate", "san francisco", "bro", "bridge"] },
    { url: `${BASE_PATH}london-1.jpg`, answers: ["london", "big ben", "england"] },
    { url: `${BASE_PATH}kinesiske-muren-1.jpg`, answers: ["kinesiske muren", "great wall", "kina", "china"] },
    { url: `${BASE_PATH}pyramidene-1.jpg`, answers: ["pyramidene", "pyramider", "giza", "egypt"] },
    { url: `${BASE_PATH}stonehenge-1.jpg`, answers: ["stonehenge", "england"] },
    { url: `${BASE_PATH}grand-canyon-1.jpg`, answers: ["grand canyon", "canyon", "usa"] },
    { url: `${BASE_PATH}venezia-1.jpg`, answers: ["venezia", "venice", "italia"] },
    { url: `${BASE_PATH}rio-1.jpg`, answers: ["rio", "cristo", "brasil", "brazil"] },
    { url: `${BASE_PATH}dubai-1.jpg`, answers: ["dubai", "burj khalifa"] },
    { url: `${BASE_PATH}berlin-1.jpg`, answers: ["berlin", "brandenburger tor", "germany"] },
    { url: `${BASE_PATH}pisa-1.jpg`, answers: ["pisa", "det skjeve tårn", "leaning tower", "italia"] },
    { url: `${BASE_PATH}nordlys-1.jpg`, answers: ["nordlys", "aurora", "northern lights"] },
    { url: `${BASE_PATH}bryggen-1.jpg`, answers: ["bryggen", "bergen"] },
  ],

  ting: [
    { url: `${BASE_PATH}gitar-1.jpg`, answers: ["gitar", "guitar"] },
    { url: `${BASE_PATH}piano-1.jpg`, answers: ["piano", "flygel"] },
    { url: `${BASE_PATH}hodetelefoner-1.jpg`, answers: ["hodetelefoner", "headphones"] },
    { url: `${BASE_PATH}kamera-1.jpg`, answers: ["kamera", "camera"] },
    { url: `${BASE_PATH}sykkel-1.jpg`, answers: ["sykkel", "bike", "bicycle"] },
    { url: `${BASE_PATH}bil-1.jpg`, answers: ["bil", "car"] },
    { url: `${BASE_PATH}mobil-1.jpg`, answers: ["mobil", "telefon", "iphone", "smartphone"] },
    { url: `${BASE_PATH}klokke-1.jpg`, answers: ["klokke", "watch", "armbåndsur"] },
    { url: `${BASE_PATH}laptop-1.jpg`, answers: ["laptop", "datamaskin", "pc", "computer"] },
    { url: `${BASE_PATH}fotball-1.jpg`, answers: ["fotball", "soccer ball", "ball"] },
    { url: `${BASE_PATH}basketball-1.jpg`, answers: ["basketball", "ball"] },
    { url: `${BASE_PATH}bok-1.jpg`, answers: ["bok", "book"] },
    { url: `${BASE_PATH}tv-1.jpg`, answers: ["tv", "fjernsyn", "television"] },
    { url: `${BASE_PATH}trommer-1.jpg`, answers: ["trommer", "drums", "trommesett"] },
    { url: `${BASE_PATH}eple-1.jpg`, answers: ["eple", "apple"] },
    { url: `${BASE_PATH}banan-1.jpg`, answers: ["banan", "banana"] },
    { url: `${BASE_PATH}pizza-1.jpg`, answers: ["pizza"] },
    { url: `${BASE_PATH}hamburger-1.jpg`, answers: ["hamburger", "burger"] },
    { url: `${BASE_PATH}is-1.jpg`, answers: ["is", "iskrem", "ice cream"] },
    { url: `${BASE_PATH}kaffe-1.jpg`, answers: ["kaffe", "kaffekopp", "coffee"] },
    { url: `${BASE_PATH}ski-1.jpg`, answers: ["ski"] },
    { url: `${BASE_PATH}kake-1.jpg`, answers: ["kake", "cake"] },
    { url: `${BASE_PATH}globus-1.jpg`, answers: ["globus", "globe", "jordklode"] },
    { url: `${BASE_PATH}spillkontroller-1.jpg`, answers: ["spillkontroller", "controller", "joystick"] },
  ],

  personer: [
    { url: `${BASE_PATH}superman-1.jpg`, answers: ["superman", "supermann"] },
    { url: `${BASE_PATH}batman-1.jpg`, answers: ["batman"] },
    { url: `${BASE_PATH}spiderman-1.jpg`, answers: ["spider-man", "spiderman", "edderkopp-mannen"] },
    { url: `${BASE_PATH}hulken-1.jpg`, answers: ["hulken", "hulk"] },
    { url: `${BASE_PATH}iron-man-1.jpg`, answers: ["iron man", "jernmannen"] },
    { url: `${BASE_PATH}thor-1.jpg`, answers: ["thor"] },
    { url: `${BASE_PATH}mona-lisa-1.jpg`, answers: ["mona lisa", "leonardo da vinci"] },
    { url: `${BASE_PATH}skrik-1.jpg`, answers: ["skrik", "edvard munch", "munch"] },
    { url: `${BASE_PATH}astronaut-1.jpg`, answers: ["astronaut", "romfarer"] },
    { url: `${BASE_PATH}messi-1.jpg`, answers: ["messi", "lionel messi"] },
    { url: `${BASE_PATH}ronaldo-1.jpg`, answers: ["ronaldo", "cristiano ronaldo"] },
    { url: `${BASE_PATH}haaland-1.jpg`, answers: ["haaland", "erling haaland", "erling braut haaland"] },
    { url: `${BASE_PATH}mikke-mus-1.jpg`, answers: ["mikke mus", "mickey mouse", "disney"] },
  ],
};

// Get images by category
export function getImages(category) {
  if (category === 'blanding') {
    return [...IMAGES.dyr, ...IMAGES.steder, ...IMAGES.ting, ...IMAGES.personer];
  }
  return IMAGES[category] || [];
}

// Shuffle array
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Levenshtein distance for typo tolerance
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Check if answer is correct (with typo tolerance)
export function checkAnswer(userAnswer, correctAnswers) {
  const normalized = userAnswer.toLowerCase().trim();
  if (!normalized) return false;

  return correctAnswers.some(answer => {
    const correct = answer.toLowerCase();

    // Exact match
    if (correct === normalized) return true;

    // Contains each other
    if (correct.includes(normalized) || normalized.includes(correct)) {
      const lengthRatio = Math.min(normalized.length, correct.length) / Math.max(normalized.length, correct.length);
      if (lengthRatio >= 0.5) return true;
    }

    // Allow typos based on word length
    const maxDistance = correct.length <= 4 ? 1 : correct.length <= 8 ? 2 : 3;
    const distance = levenshteinDistance(normalized, correct);

    return distance <= maxDistance;
  });
}

export const categories = [
  { id: 'dyr', name: 'Dyr', icon: '🐾' },
  { id: 'steder', name: 'Steder', icon: '🌍' },
  { id: 'ting', name: 'Ting', icon: '📦' },
  { id: 'personer', name: 'Personer', icon: '👤' },
  { id: 'blanding', name: 'Blanding', icon: '🎲' },
];

export default IMAGES;
