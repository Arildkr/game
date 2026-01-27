// Quiz-spørsmål med flervalg
// Tilpasset ungdomsskole

const questions = [
  // ==================== GEOGRAFI ====================
  {
    question: "Hva er hovedstaden i Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
    correct: 2,
    category: "geografi"
  },
  {
    question: "Hvilket land har flest innbyggere?",
    options: ["USA", "India", "Kina", "Indonesia"],
    correct: 2,
    category: "geografi"
  },
  {
    question: "Hvilken elv er verdens lengste?",
    options: ["Amazonas", "Nilen", "Yangtze", "Mississippi"],
    correct: 1,
    category: "geografi"
  },
  {
    question: "Hvilket hav ligger mellom Europa og Amerika?",
    options: ["Stillehavet", "Det indiske hav", "Atlanterhavet", "Nordishavet"],
    correct: 2,
    category: "geografi"
  },
  {
    question: "Hva er Norges nest største by?",
    options: ["Trondheim", "Bergen", "Stavanger", "Drammen"],
    correct: 1,
    category: "geografi"
  },
  {
    question: "Hvilket land er kjent som 'den stigende sols land'?",
    options: ["Kina", "Korea", "Japan", "Vietnam"],
    correct: 2,
    category: "geografi"
  },
  {
    question: "Hvor mange kontinenter er det?",
    options: ["5", "6", "7", "8"],
    correct: 2,
    category: "geografi"
  },
  {
    question: "Hvilket land har verdens høyeste fjell?",
    options: ["Kina", "Nepal", "India", "Pakistan"],
    correct: 1,
    category: "geografi"
  },
  {
    question: "Hva heter det største landet i verden (areal)?",
    options: ["Kina", "USA", "Canada", "Russland"],
    correct: 3,
    category: "geografi"
  },
  {
    question: "Hvilken by er kjent som 'Den evige stad'?",
    options: ["Athen", "Roma", "Jerusalem", "Kairo"],
    correct: 1,
    category: "geografi"
  },

  // ==================== HISTORIE ====================
  {
    question: "Når startet andre verdenskrig?",
    options: ["1914", "1939", "1941", "1945"],
    correct: 1,
    category: "historie"
  },
  {
    question: "Hvem oppdaget Amerika i 1492?",
    options: ["Vasco da Gama", "Ferdinand Magellan", "Christopher Columbus", "Leiv Eiriksson"],
    correct: 2,
    category: "historie"
  },
  {
    question: "Når ble Norge selvstendig fra Sverige?",
    options: ["1814", "1905", "1920", "1945"],
    correct: 1,
    category: "historie"
  },
  {
    question: "Hvem var den første mannen på månen?",
    options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"],
    correct: 1,
    category: "historie"
  },
  {
    question: "Hvilken mur falt i 1989?",
    options: ["Den kinesiske mur", "Berlinmuren", "Hadrians mur", "Muren i Jerusalem"],
    correct: 1,
    category: "historie"
  },
  {
    question: "Hvem malte Mona Lisa?",
    options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Botticelli"],
    correct: 2,
    category: "historie"
  },
  {
    question: "Hvilket skip sank i 1912 på sin jomfrutur?",
    options: ["Lusitania", "Britannic", "Olympic", "Titanic"],
    correct: 3,
    category: "historie"
  },
  {
    question: "Hvem var Norges konge under andre verdenskrig?",
    options: ["Olav V", "Haakon VII", "Harald V", "Oscar II"],
    correct: 1,
    category: "historie"
  },
  {
    question: "Når ble grunnloven undertegnet på Eidsvoll?",
    options: ["1814", "1905", "1810", "1820"],
    correct: 0,
    category: "historie"
  },
  {
    question: "Hvilket imperium bygde Colosseum i Roma?",
    options: ["Det greske", "Det persiske", "Det romerske", "Det bysantinske"],
    correct: 2,
    category: "historie"
  },

  // ==================== NATURFAG ====================
  {
    question: "Hva er det kjemiske symbolet for gull?",
    options: ["Go", "Gd", "Au", "Ag"],
    correct: 2,
    category: "naturfag"
  },
  {
    question: "Hvor mange planeter er det i vårt solsystem?",
    options: ["7", "8", "9", "10"],
    correct: 1,
    category: "naturfag"
  },
  {
    question: "Hva kalles prosessen der planter lager mat fra sollys?",
    options: ["Respirasjon", "Fotosyntese", "Fermentering", "Osmose"],
    correct: 1,
    category: "naturfag"
  },
  {
    question: "Hvilket grunnstoff puster vi inn mest av?",
    options: ["Oksygen", "Karbondioksid", "Nitrogen", "Hydrogen"],
    correct: 2,
    category: "naturfag"
  },
  {
    question: "Hva er lysets hastighet (ca.)?",
    options: ["300 km/s", "3 000 km/s", "300 000 km/s", "3 000 000 km/s"],
    correct: 2,
    category: "naturfag"
  },
  {
    question: "Hvilket organ pumper blod gjennom kroppen?",
    options: ["Lungene", "Leveren", "Hjertet", "Nyrene"],
    correct: 2,
    category: "naturfag"
  },
  {
    question: "Hva kalles den minste enheten i et grunnstoff?",
    options: ["Molekyl", "Atom", "Elektron", "Celle"],
    correct: 1,
    category: "naturfag"
  },
  {
    question: "Hvilken planet er nærmest solen?",
    options: ["Venus", "Mars", "Merkur", "Jorden"],
    correct: 2,
    category: "naturfag"
  },
  {
    question: "Hva er H2O?",
    options: ["Oksygen", "Hydrogen", "Vann", "Salt"],
    correct: 2,
    category: "naturfag"
  },
  {
    question: "Hvilket dyr er kjent som 'kongen av jungelen'?",
    options: ["Tiger", "Elefant", "Løve", "Gorilla"],
    correct: 2,
    category: "naturfag"
  },

  // ==================== KULTUR & UNDERHOLDNING ====================
  {
    question: "Hvem skrev Harry Potter-bøkene?",
    options: ["Stephen King", "J.R.R. Tolkien", "J.K. Rowling", "Roald Dahl"],
    correct: 2,
    category: "kultur"
  },
  {
    question: "Hvilket land kommer pizza opprinnelig fra?",
    options: ["USA", "Frankrike", "Spania", "Italia"],
    correct: 3,
    category: "kultur"
  },
  {
    question: "Hva heter verdens mest solgte spillkonsoll (2024)?",
    options: ["Xbox", "PlayStation 2", "Nintendo Switch", "Wii"],
    correct: 1,
    category: "kultur"
  },
  {
    question: "Hvilket band sang 'Bohemian Rhapsody'?",
    options: ["The Beatles", "Led Zeppelin", "Queen", "Pink Floyd"],
    correct: 2,
    category: "kultur"
  },
  {
    question: "Hva heter hovedpersonen i Minecraft?",
    options: ["Alex", "Steve", "Herobrine", "Notch"],
    correct: 1,
    category: "kultur"
  },
  {
    question: "Hvilket land vant fotball-VM for menn i 2022?",
    options: ["Brasil", "Frankrike", "Argentina", "Tyskland"],
    correct: 2,
    category: "kultur"
  },
  {
    question: "Hva heter den lille grønne figuren i Star Wars?",
    options: ["Yoda", "Grogu", "Jabba", "Ewok"],
    correct: 0,
    category: "kultur"
  },
  {
    question: "Hvilket sosialt medium er kjent for korte videoer og ble startet i Kina?",
    options: ["Instagram", "Snapchat", "TikTok", "YouTube"],
    correct: 2,
    category: "kultur"
  },
  {
    question: "Hvem er skaperen av Tesla og SpaceX?",
    options: ["Jeff Bezos", "Bill Gates", "Elon Musk", "Mark Zuckerberg"],
    correct: 2,
    category: "kultur"
  },
  {
    question: "Hvilket spill er kjent for 'Victory Royale'?",
    options: ["PUBG", "Fortnite", "Apex Legends", "Call of Duty"],
    correct: 1,
    category: "kultur"
  },

  // ==================== MATEMATIKK ====================
  {
    question: "Hva er 15% av 200?",
    options: ["15", "20", "30", "35"],
    correct: 2,
    category: "matte"
  },
  {
    question: "Hva er kvadratroten av 144?",
    options: ["11", "12", "13", "14"],
    correct: 1,
    category: "matte"
  },
  {
    question: "Hvor mange grader er det i en trekant?",
    options: ["90", "180", "270", "360"],
    correct: 1,
    category: "matte"
  },
  {
    question: "Hva er 7 x 8?",
    options: ["54", "56", "58", "64"],
    correct: 1,
    category: "matte"
  },
  {
    question: "Hva kalles en firkant med fire like sider?",
    options: ["Rektangel", "Kvadrat", "Trapes", "Parallellogram"],
    correct: 1,
    category: "matte"
  },
  {
    question: "Hva er verdien av pi (ca.)?",
    options: ["2.14", "3.14", "4.14", "3.41"],
    correct: 1,
    category: "matte"
  },
  {
    question: "Hva er 2^5 (2 opphøyd i 5)?",
    options: ["10", "16", "32", "64"],
    correct: 2,
    category: "matte"
  },
  {
    question: "Hvilket tall er et primtall?",
    options: ["9", "15", "17", "21"],
    correct: 2,
    category: "matte"
  },
  {
    question: "Hva er 1000 delt på 25?",
    options: ["40", "45", "50", "55"],
    correct: 0,
    category: "matte"
  },
  {
    question: "Hva er arealet av en sirkel med radius 3? (bruk pi = 3)",
    options: ["18", "27", "9", "36"],
    correct: 1,
    category: "matte"
  },

  // ==================== SPRÅK & LITTERATUR ====================
  {
    question: "Hvilket språk snakkes i Brasil?",
    options: ["Spansk", "Portugisisk", "Italiensk", "Fransk"],
    correct: 1,
    category: "sprak"
  },
  {
    question: "Hvem skrev 'Romeo og Julie'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correct: 1,
    category: "sprak"
  },
  {
    question: "Hva betyr det engelske ordet 'enormous'?",
    options: ["Liten", "Rask", "Enorm/Kjempestor", "Farlig"],
    correct: 2,
    category: "sprak"
  },
  {
    question: "Hvilket land kommer eventyret om 'Den stygge andungen' fra?",
    options: ["Norge", "Sverige", "Danmark", "Finland"],
    correct: 2,
    category: "sprak"
  },
  {
    question: "Hva er flertall av 'barn' på nynorsk?",
    options: ["Barner", "Barn", "Borna", "Barnene"],
    correct: 2,
    category: "sprak"
  },
  {
    question: "Hvem skrev 'Sofies verden'?",
    options: ["Jo Nesbø", "Jostein Gaarder", "Erlend Loe", "Lars Saabye Christensen"],
    correct: 1,
    category: "sprak"
  },
  {
    question: "Hva betyr 'carpe diem' på latin?",
    options: ["Lev livet", "Grip dagen", "Evig liv", "God morgen"],
    correct: 1,
    category: "sprak"
  },
  {
    question: "Hvilket alfabet brukes i Russland?",
    options: ["Latinsk", "Gresk", "Kyrillisk", "Arabisk"],
    correct: 2,
    category: "sprak"
  },

  // ==================== SPORT ====================
  {
    question: "Hvor mange spillere er det på et fotballag på banen?",
    options: ["9", "10", "11", "12"],
    correct: 2,
    category: "sport"
  },
  {
    question: "Hvilket land arrangerte sommer-OL i 2021?",
    options: ["Kina", "Brasil", "Japan", "Frankrike"],
    correct: 2,
    category: "sport"
  },
  {
    question: "Hva kalles tre strokes under par i golf?",
    options: ["Birdie", "Eagle", "Albatross", "Bogey"],
    correct: 2,
    category: "sport"
  },
  {
    question: "Hvilken norsk skiløper har flest VM-gull?",
    options: ["Bjørn Dæhlie", "Marit Bjørgen", "Petter Northug", "Johannes Høsflot Klæbo"],
    correct: 1,
    category: "sport"
  },
  {
    question: "Hvor lenge varer en ordinær fotballkamp?",
    options: ["60 minutter", "80 minutter", "90 minutter", "120 minutter"],
    correct: 2,
    category: "sport"
  },
  {
    question: "Hvilket land har vunnet flest fotball-VM for menn?",
    options: ["Tyskland", "Argentina", "Brasil", "Italia"],
    correct: 2,
    category: "sport"
  },
  {
    question: "Hva kalles det når en bowler slår ned alle 10 kjegler på første kast?",
    options: ["Spare", "Strike", "Split", "Gutter"],
    correct: 1,
    category: "sport"
  },
  {
    question: "Hvilken idrett forbindes med Wimbledon?",
    options: ["Golf", "Cricket", "Tennis", "Polo"],
    correct: 2,
    category: "sport"
  },

  // ==================== TEKNOLOGI ====================
  {
    question: "Hva står HTML for?",
    options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyper Transfer Markup Language"],
    correct: 0,
    category: "teknologi"
  },
  {
    question: "Hvilket selskap laget iPhone?",
    options: ["Samsung", "Google", "Apple", "Microsoft"],
    correct: 2,
    category: "teknologi"
  },
  {
    question: "Hva kalles hjernen i en datamaskin?",
    options: ["RAM", "CPU", "GPU", "SSD"],
    correct: 1,
    category: "teknologi"
  },
  {
    question: "Hvilket år ble det første iPhone lansert?",
    options: ["2005", "2007", "2009", "2010"],
    correct: 1,
    category: "teknologi"
  },
  {
    question: "Hva står AI for?",
    options: ["Automatic Intelligence", "Artificial Intelligence", "Advanced Internet", "Auto Information"],
    correct: 1,
    category: "teknologi"
  },
  {
    question: "Hvem grunnla Microsoft?",
    options: ["Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Jeff Bezos"],
    correct: 1,
    category: "teknologi"
  },
  {
    question: "Hva er 1 gigabyte (GB)?",
    options: ["1000 megabyte", "1024 megabyte", "100 megabyte", "10000 megabyte"],
    correct: 1,
    category: "teknologi"
  },
  {
    question: "Hvilket programmeringsspråk er oppkalt etter en slange?",
    options: ["Java", "Ruby", "Python", "Swift"],
    correct: 2,
    category: "teknologi"
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
