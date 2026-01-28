// Quiz-spørsmål med tekstsvar
// Tilpasset ungdomsskole
// Bruker Levenshtein-distanse for toleranse

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
      if (lengthRatio >= 0.6) return true;
    }

    // Allow typos based on word length
    const maxDistance = correct.length <= 4 ? 1 : correct.length <= 8 ? 2 : 3;
    const distance = levenshteinDistance(normalized, correct);

    return distance <= maxDistance;
  });
}

const questions = [
  // ==================== GEOGRAFI ====================
  {
    question: "Hva er hovedstaden i Australia?",
    answers: ["Canberra"],
    category: "geografi"
  },
  {
    question: "Hvilket land har flest innbyggere i verden?",
    answers: ["India", "Kina"],
    category: "geografi"
  },
  {
    question: "Hva heter den lengste elva i verden?",
    answers: ["Nilen", "Amazonas"],
    category: "geografi"
  },
  {
    question: "Hvilket hav ligger mellom Europa og Amerika?",
    answers: ["Atlanterhavet", "Atlanteren"],
    category: "geografi"
  },
  {
    question: "Hva er Norges nest største by?",
    answers: ["Bergen"],
    category: "geografi"
  },
  {
    question: "Hvilket land er kjent som 'den stigende sols land'?",
    answers: ["Japan"],
    category: "geografi"
  },
  {
    question: "Hvor mange kontinenter er det?",
    answers: ["7", "syv", "sju"],
    category: "geografi"
  },
  {
    question: "I hvilket land ligger verdens høyeste fjell?",
    answers: ["Nepal", "Kina"],
    category: "geografi"
  },
  {
    question: "Hva heter det største landet i verden (areal)?",
    answers: ["Russland"],
    category: "geografi"
  },
  {
    question: "Hvilken by er kjent som 'Den evige stad'?",
    answers: ["Roma", "Rome"],
    category: "geografi"
  },
  {
    question: "Hva heter Norges lengste fjord?",
    answers: ["Sognefjorden"],
    category: "geografi"
  },
  {
    question: "Hva er navnet på verdens høyeste fjell?",
    answers: ["Mount Everest", "Everest", "Sagarmatha", "Chomolungma"],
    category: "geografi"
  },
  {
    question: "Hva heter den største øya i verden?",
    answers: ["Grønland", "Greenland"],
    category: "geografi"
  },
  {
    question: "Hva er hovedstaden i Japan?",
    answers: ["Tokyo"],
    category: "geografi"
  },
  {
    question: "Hva heter den lengste elva i Norge?",
    answers: ["Glomma"],
    category: "geografi"
  },
  {
    question: "Hva er hovedstaden i Frankrike?",
    answers: ["Paris"],
    category: "geografi"
  },
  {
    question: "Hva heter verdens nest største hav?",
    answers: ["Atlanterhavet", "Atlanteren"],
    category: "geografi"
  },
  {
    question: "Hva heter den største innsjøen i Norge?",
    answers: ["Mjøsa"],
    category: "geografi"
  },
  {
    question: "Hva er hovedstaden i Canada?",
    answers: ["Ottawa"],
    category: "geografi"
  },
  {
    question: "Hva heter den største verdensdelen?",
    answers: ["Asia"],
    category: "geografi"
  },

  // ==================== HISTORIE ====================
  {
    question: "Når startet andre verdenskrig?",
    answers: ["1939"],
    category: "historie"
  },
  {
    question: "Hvem oppdaget Amerika i 1492?",
    answers: ["Christopher Columbus", "Columbus", "Kristoffer Columbus"],
    category: "historie"
  },
  {
    question: "Når ble Norge selvstendig fra Sverige?",
    answers: ["1905"],
    category: "historie"
  },
  {
    question: "Hvem var den første mannen på månen?",
    answers: ["Neil Armstrong", "Armstrong"],
    category: "historie"
  },
  {
    question: "Hvilken mur falt i 1989?",
    answers: ["Berlinmuren", "Berlin-muren"],
    category: "historie"
  },
  {
    question: "Hvem malte Mona Lisa?",
    answers: ["Leonardo da Vinci", "Da Vinci", "Leonardo"],
    category: "historie"
  },
  {
    question: "Hvilket skip sank i 1912 på sin jomfrutur?",
    answers: ["Titanic"],
    category: "historie"
  },
  {
    question: "Hvem var Norges konge under andre verdenskrig?",
    answers: ["Haakon VII", "Haakon 7", "Haakon den syvende", "Kong Haakon"],
    category: "historie"
  },
  {
    question: "Når ble grunnloven undertegnet på Eidsvoll?",
    answers: ["1814"],
    category: "historie"
  },
  {
    question: "Hvilket imperium bygde Colosseum i Roma?",
    answers: ["Det romerske", "Romerriket", "Roma", "Romerske riket"],
    category: "historie"
  },
  {
    question: "Hvilken norsk konge ble drept i slaget på Stiklestad i 1030?",
    answers: ["Olav den Hellige", "Olav Haraldsson", "Olav II", "Sankt Olav"],
    category: "historie"
  },

  // ==================== NATURFAG ====================
  {
    question: "Hva er det kjemiske symbolet for gull?",
    answers: ["Au"],
    category: "naturfag"
  },
  {
    question: "Hvor mange planeter er det i vårt solsystem?",
    answers: ["8", "åtte"],
    category: "naturfag"
  },
  {
    question: "Hva kalles prosessen der planter lager mat fra sollys?",
    answers: ["Fotosyntese", "Fotosyntesen"],
    category: "naturfag"
  },
  {
    question: "Hvilket grunnstoff puster vi inn mest av?",
    answers: ["Nitrogen", "Kvelstoff"],
    category: "naturfag"
  },
  {
    question: "Hvilket organ pumper blod gjennom kroppen?",
    answers: ["Hjertet", "Hjerte"],
    category: "naturfag"
  },
  {
    question: "Hva kalles den minste enheten i et grunnstoff?",
    answers: ["Atom", "Atomet"],
    category: "naturfag"
  },
  {
    question: "Hvilken planet er nærmest solen?",
    answers: ["Merkur", "Mercury"],
    category: "naturfag"
  },
  {
    question: "Hva er H2O?",
    answers: ["Vann", "Water"],
    category: "naturfag"
  },
  {
    question: "Hvilket dyr er kjent som 'kongen av jungelen'?",
    answers: ["Løve", "Løven", "Lion"],
    category: "naturfag"
  },
  {
    question: "Hvilket element har det kjemiske symbolet O?",
    answers: ["Oksygen", "Oxygen"],
    category: "naturfag"
  },
  {
    question: "Hva er det største dyret i verden?",
    answers: ["Blåhval", "Blåhvalen", "Blue whale"],
    category: "naturfag"
  },
  {
    question: "Hvilken planet er kjent som den røde planeten?",
    answers: ["Mars"],
    category: "naturfag"
  },
  {
    question: "Hva kalles en vinkel på 90 grader?",
    answers: ["Rett vinkel", "Rettvinklet"],
    category: "naturfag"
  },
  {
    question: "Hva er det hardeste naturlige stoffet?",
    answers: ["Diamant", "Diamond"],
    category: "naturfag"
  },
  {
    question: "Hvor mange ben har en edderkopp?",
    answers: ["8", "åtte"],
    category: "naturfag"
  },
  {
    question: "Hva er Norges nasjonalfugl?",
    answers: ["Fossekallen", "Fossekall"],
    category: "naturfag"
  },
  {
    question: "Hva er den minste knokkelen i menneskekroppen?",
    answers: ["Stigbøylen", "Stigbøyle"],
    category: "naturfag"
  },
  {
    question: "Hva kalles læren om jordskjelv?",
    answers: ["Seismologi"],
    category: "naturfag"
  },
  {
    question: "Hvilket metall har det kjemiske symbolet Au?",
    answers: ["Gull", "Gold"],
    category: "naturfag"
  },
  {
    question: "Hvilken enhet måles elektrisk strøm i?",
    answers: ["Ampere", "A"],
    category: "naturfag"
  },
  {
    question: "Hva kalles studien av stjerner og planeter?",
    answers: ["Astronomi"],
    category: "naturfag"
  },
  {
    question: "Hvilket grunnstoff har det kjemiske symbolet Fe?",
    answers: ["Jern", "Iron"],
    category: "naturfag"
  },

  // ==================== KULTUR & UNDERHOLDNING ====================
  {
    question: "Hvem skrev Harry Potter-bøkene?",
    answers: ["J.K. Rowling", "JK Rowling", "Rowling", "Joanne Rowling"],
    category: "kultur"
  },
  {
    question: "Hvilket land kommer pizza opprinnelig fra?",
    answers: ["Italia", "Italy"],
    category: "kultur"
  },
  {
    question: "Hvilket band sang 'Bohemian Rhapsody'?",
    answers: ["Queen"],
    category: "kultur"
  },
  {
    question: "Hva heter hovedpersonen i Minecraft?",
    answers: ["Steve", "Alex"],
    category: "kultur"
  },
  {
    question: "Hvilket land vant fotball-VM for menn i 2022?",
    answers: ["Argentina"],
    category: "kultur"
  },
  {
    question: "Hva heter den lille grønne figuren i Star Wars?",
    answers: ["Yoda", "Grogu", "Baby Yoda"],
    category: "kultur"
  },
  {
    question: "Hvilket sosialt medium er kjent for korte videoer og ble startet i Kina?",
    answers: ["TikTok"],
    category: "kultur"
  },
  {
    question: "Hvem er skaperen av Tesla og SpaceX?",
    answers: ["Elon Musk", "Musk"],
    category: "kultur"
  },
  {
    question: "Hvilket spill er kjent for 'Victory Royale'?",
    answers: ["Fortnite"],
    category: "kultur"
  },
  {
    question: "Hvem malte det berømte maleriet 'Skrik'?",
    answers: ["Edvard Munch", "Munch"],
    category: "kultur"
  },

  // ==================== MATEMATIKK ====================
  {
    question: "Hva er 15% av 200?",
    answers: ["30", "tretti"],
    category: "matte"
  },
  {
    question: "Hva er kvadratroten av 144?",
    answers: ["12", "tolv"],
    category: "matte"
  },
  {
    question: "Hvor mange grader er det i en trekant?",
    answers: ["180", "hundreogåtti"],
    category: "matte"
  },
  {
    question: "Hva er 7 x 8?",
    answers: ["56", "femtiseks"],
    category: "matte"
  },
  {
    question: "Hva kalles en firkant med fire like sider og fire rette vinkler?",
    answers: ["Kvadrat"],
    category: "matte"
  },
  {
    question: "Hva er verdien av pi (de to første sifrene)?",
    answers: ["3.14", "3,14"],
    category: "matte"
  },
  {
    question: "Hva er 2 opphøyd i 5?",
    answers: ["32", "trettito"],
    category: "matte"
  },
  {
    question: "Hva er 1000 delt på 25?",
    answers: ["40", "førti"],
    category: "matte"
  },
  {
    question: "Hva er 12 x 8?",
    answers: ["96", "nittiseks"],
    category: "matte"
  },
  {
    question: "Hvor mange timer er det i en uke?",
    answers: ["168"],
    category: "matte"
  },
  {
    question: "Hvor mange gram er det i et kilogram?",
    answers: ["1000", "tusen"],
    category: "matte"
  },
  {
    question: "Hvor mange dager er det i et skuddår?",
    answers: ["366"],
    category: "matte"
  },
  {
    question: "Hvor mange grader er det i en sirkel?",
    answers: ["360", "tre hundre og seksti"],
    category: "matte"
  },

  // ==================== SPRÅK & LITTERATUR ====================
  {
    question: "Hvilket språk snakkes i Brasil?",
    answers: ["Portugisisk", "Portuguese"],
    category: "sprak"
  },
  {
    question: "Hvem skrev 'Romeo og Julie'?",
    answers: ["William Shakespeare", "Shakespeare"],
    category: "sprak"
  },
  {
    question: "Hvilket land kommer eventyret om 'Den stygge andungen' fra?",
    answers: ["Danmark", "Denmark"],
    category: "sprak"
  },
  {
    question: "Hvem skrev 'Sofies verden'?",
    answers: ["Jostein Gaarder", "Gaarder"],
    category: "sprak"
  },
  {
    question: "Hva betyr 'carpe diem' på latin?",
    answers: ["Grip dagen"],
    category: "sprak"
  },
  {
    question: "Hvilket alfabet brukes i Russland?",
    answers: ["Kyrillisk", "Det kyrilliske"],
    category: "sprak"
  },

  // ==================== SPORT ====================
  {
    question: "Hvor mange spillere er det på et fotballag på banen?",
    answers: ["11", "elleve"],
    category: "sport"
  },
  {
    question: "Hvilket land arrangerte sommer-OL i 2021?",
    answers: ["Japan"],
    category: "sport"
  },
  {
    question: "Hva kalles tre strokes under par i golf?",
    answers: ["Albatross", "Double eagle"],
    category: "sport"
  },
  {
    question: "Hvor lenge varer en ordinær fotballkamp (i minutter)?",
    answers: ["90", "nitti"],
    category: "sport"
  },
  {
    question: "Hvilket land har vunnet flest fotball-VM for menn?",
    answers: ["Brasil", "Brazil"],
    category: "sport"
  },
  {
    question: "Hva kalles det når en bowler slår ned alle 10 kjegler på første kast?",
    answers: ["Strike"],
    category: "sport"
  },
  {
    question: "Hvilken idrett forbindes med Wimbledon?",
    answers: ["Tennis"],
    category: "sport"
  },
  {
    question: "Hvilken sport er Lionel Messi kjent for?",
    answers: ["Fotball", "Football", "Soccer"],
    category: "sport"
  },

  // ==================== TEKNOLOGI ====================
  {
    question: "Hva står HTML for?",
    answers: ["Hyper Text Markup Language", "HyperText Markup Language"],
    category: "teknologi"
  },
  {
    question: "Hvilket selskap laget iPhone?",
    answers: ["Apple"],
    category: "teknologi"
  },
  {
    question: "Hva kalles hjernen i en datamaskin?",
    answers: ["CPU", "Prosessor", "Prosessoren"],
    category: "teknologi"
  },
  {
    question: "Hvilket år ble den første iPhone lansert?",
    answers: ["2007"],
    category: "teknologi"
  },
  {
    question: "Hva står AI for (på engelsk)?",
    answers: ["Artificial Intelligence"],
    category: "teknologi"
  },
  {
    question: "Hvem grunnla Microsoft?",
    answers: ["Bill Gates", "Gates", "Bill Gates og Paul Allen"],
    category: "teknologi"
  },
  {
    question: "Hvilket programmeringsspråk er oppkalt etter en slange?",
    answers: ["Python"],
    category: "teknologi"
  },

  // ==================== DYRERIKET ====================
  {
    question: "Hvilket dyr kalles 'skogens konge' i Norge?",
    answers: ["Elg", "Elgen"],
    category: "naturfag"
  }
];

export default questions;

// Hjelpefunksjon for å blande spørsmål
export function shuffleQuestions(questionsArray) {
  const shuffled = [...questionsArray];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Hjelpefunksjon for å filtrere på kategori
export function getQuestionsByCategory(category) {
  if (category === 'all') return questions;
  return questions.filter(q => q.category === category);
}

// Alle kategorier
export const categories = [
  { id: 'all', name: 'Alle kategorier' },
  { id: 'geografi', name: 'Geografi' },
  { id: 'historie', name: 'Historie' },
  { id: 'naturfag', name: 'Naturfag' },
  { id: 'kultur', name: 'Kultur & Underholdning' },
  { id: 'matte', name: 'Matematikk' },
  { id: 'sprak', name: 'Språk & Litteratur' },
  { id: 'sport', name: 'Sport' },
  { id: 'teknologi', name: 'Teknologi' }
];
