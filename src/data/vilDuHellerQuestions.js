// Vil du heller? spørsmål
// Dilemmaer som passer for skolebruk

const questions = [
  // ==================== MAT ====================
  { optionA: "Bare kunne spise pizza resten av livet", optionB: "Bare kunne spise taco resten av livet", category: "mat" },
  { optionA: "Aldri kunne spise sjokolade igjen", optionB: "Aldri kunne spise is igjen", category: "mat" },
  { optionA: "Spise frokost til middag hver dag", optionB: "Spise middag til frokost hver dag", category: "mat" },
  { optionA: "Bare kunne drikke vann", optionB: "Bare kunne drikke melk", category: "mat" },
  { optionA: "All maten din smaker salt", optionB: "All maten din smaker søtt", category: "mat" },
  { optionA: "Spise en hel sitron", optionB: "Spise en hel rå løk", category: "mat" },
  { optionA: "Aldri kunne spise godteri igjen", optionB: "Aldri kunne spise kake igjen", category: "mat" },
  { optionA: "Bare kunne spise kald mat", optionB: "Bare kunne spise varm mat", category: "mat" },

  // ==================== SUPERKREFTER ====================
  { optionA: "Kunne fly", optionB: "Kunne bli usynlig", category: "superkrefter" },
  { optionA: "Kunne lese tanker", optionB: "Kunne flytte ting med tankene", category: "superkrefter" },
  { optionA: "Ha superstyrke", optionB: "Ha superspeed", category: "superkrefter" },
  { optionA: "Kunne snakke med dyr", optionB: "Kunne snakke alle språk i verden", category: "superkrefter" },
  { optionA: "Kunne teleportere deg selv", optionB: "Kunne stoppe tiden", category: "superkrefter" },
  { optionA: "Ha røntgensyn", optionB: "Ha superhørsel", category: "superkrefter" },
  { optionA: "Kunne puste under vann", optionB: "Kunne overleve i verdensrommet", category: "superkrefter" },
  { optionA: "Aldri bli trøtt", optionB: "Aldri bli sulten", category: "superkrefter" },

  // ==================== SKOLE ====================
  { optionA: "Ha gym hver dag", optionB: "Ha kunst og håndverk hver dag", category: "skole" },
  { optionA: "Alltid ha lekser", optionB: "Alltid ha prøver", category: "skole" },
  { optionA: "Sitte ved vinduet i klasserommet", optionB: "Sitte ved døren i klasserommet", category: "skole" },
  { optionA: "Ha lengre friminutt", optionB: "Slutte tidligere på skolen", category: "skole" },
  { optionA: "Bare ha matte og norsk", optionB: "Bare ha gym og musikk", category: "skole" },
  { optionA: "Gå på skole hele sommeren", optionB: "Gå på skole hver lørdag", category: "skole" },
  { optionA: "Jobbe alene på alle prosjekter", optionB: "Jobbe i gruppe på alle prosjekter", category: "skole" },
  { optionA: "Kunne alle svarene men ikke rekke opp hånden", optionB: "Alltid bli spurt men ikke vite svaret", category: "skole" },

  // ==================== FRITID ====================
  { optionA: "Spille videospill hele dagen", optionB: "Se på TV hele dagen", category: "fritid" },
  { optionA: "Bo på en øde øy i en måned", optionB: "Bo i en storby i en måned", category: "fritid" },
  { optionA: "Kunne bare høre på én sang resten av livet", optionB: "Aldri kunne høre på musikk igjen", category: "fritid" },
  { optionA: "Ha en svært stor hund", optionB: "Ha tre små katter", category: "fritid" },
  { optionA: "Alltid måtte gå", optionB: "Alltid måtte løpe", category: "fritid" },
  { optionA: "Kunne bare se filmer", optionB: "Kunne bare se serier", category: "fritid" },
  { optionA: "Aldri bruke telefon igjen", optionB: "Aldri bruke datamaskin igjen", category: "fritid" },
  { optionA: "Feriere på fjellet", optionB: "Feriere ved stranden", category: "fritid" },

  // ==================== FANTASIVALG ====================
  { optionA: "Møte en dinosaur", optionB: "Møte et romvesen", category: "fantasi" },
  { optionA: "Kunne reise tilbake i tid", optionB: "Kunne reise fremover i tid", category: "fantasi" },
  { optionA: "Leve i Harry Potter-universet", optionB: "Leve i Marvel-universet", category: "fantasi" },
  { optionA: "Være en berømt youtuber", optionB: "Være en berømt idrettsstjerne", category: "fantasi" },
  { optionA: "Ha en personlig robot", optionB: "Ha et flyvende teppe", category: "fantasi" },
  { optionA: "Kunne forstå alle koder og dataspråk", optionB: "Kunne bygge hva som helst med lego", category: "fantasi" },
  { optionA: "Bo i et slott", optionB: "Bo i et romskip", category: "fantasi" },
  { optionA: "Være en ninja", optionB: "Være en pirat", category: "fantasi" },

  // ==================== VANSKELIGE VALG ====================
  { optionA: "Alltid si det du tenker høyt", optionB: "Aldri kunne snakke igjen", category: "vanskelig" },
  { optionA: "Være den smarteste i rommet", optionB: "Være den morsomste i rommet", category: "vanskelig" },
  { optionA: "Ha mange venner du kjenner litt", optionB: "Ha én bestevenn du kjenner veldig godt", category: "vanskelig" },
  { optionA: "Alltid komme for sent", optionB: "Alltid komme for tidlig", category: "vanskelig" },
  { optionA: "Vite hva som skjer i fremtiden", optionB: "Kunne endre fortiden", category: "vanskelig" },
  { optionA: "Være berømt men alltid stresset", optionB: "Være ukjent men alltid avslappet", category: "vanskelig" },
  { optionA: "Ha 1000 kr nå", optionB: "Ha 10000 kr om ett år", category: "vanskelig" },
  { optionA: "Være veldig god i én ting", optionB: "Være ganske god i alt", category: "vanskelig" },

  // ==================== HVERDAGEN ====================
  { optionA: "Alltid ha på deg den samme fargen", optionB: "Aldri kunne velge hva du har på deg selv", category: "hverdag" },
  { optionA: "Det alltid er sommer", optionB: "Det alltid er vinter", category: "hverdag" },
  { optionA: "Sove i en hengekøye", optionB: "Sove på gulvet", category: "hverdag" },
  { optionA: "Bare kunne dusje", optionB: "Bare kunne bade", category: "hverdag" },
  { optionA: "Våkne opp klokken 5 hver dag", optionB: "Legge deg klokken 8 hver kveld", category: "hverdag" },
  { optionA: "Alltid ha litt for varmt", optionB: "Alltid ha litt for kaldt", category: "hverdag" },
  { optionA: "Aldri kunne bruke heis", optionB: "Aldri kunne bruke trapp", category: "hverdag" },
  { optionA: "Bare kunne hvispe", optionB: "Bare kunne rope", category: "hverdag" },

  // ==================== MORSOMME ====================
  { optionA: "Ha en nese som lyser i mørket", optionB: "Ha ører som kan vifte", category: "morsom" },
  { optionA: "Lukte som nybakt brød", optionB: "Lukte som friske blomster", category: "morsom" },
  { optionA: "Ha fingre av spaghetti", optionB: "Ha hår av gress", category: "morsom" },
  { optionA: "Alltid snakke i rim", optionB: "Alltid synge det du sier", category: "morsom" },
  { optionA: "Ha føtter på hodet og hode på føttene", optionB: "Ha armer som bein og bein som armer", category: "morsom" },
  { optionA: "Kunne sprute vann ut av ørene", optionB: "Kunne blåse såpebobler ut av nesen", category: "morsom" },
  { optionA: "At alt du tar på blir til sjokolade", optionB: "At alt du tar på blir til gull", category: "morsom" },
  { optionA: "Måtte hoppe overalt", optionB: "Måtte krabbe overalt", category: "morsom" }
];

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleQuestions(questionsArray) {
  const shuffled = [...questionsArray];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(category) {
  if (category === 'all') return questions;
  return questions.filter(q => q.category === category);
}

/**
 * Get available categories
 */
export function getCategories() {
  const categories = [...new Set(questions.map(q => q.category))];
  return ['all', ...categories];
}

export default questions;
