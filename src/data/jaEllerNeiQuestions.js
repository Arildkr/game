// Ja/Nei-spørsmål med vanskelighetsgrad
// easy = barneskole/oppvarming, medium = ungdomsskole, hard = vanskelig/voksen
// Kopiert fra original Ja eller Nei app

const questions = [
  // ==================== GEOGRAFI ====================
  { question: "Er Oslo hovedstaden i Norge?", answer: true, difficulty: "easy" },
  { question: "Er Sahara den største ørkenen i verden?", answer: false, explanation: "Antarktis er faktisk større!", difficulty: "medium" },
  { question: "Ligger Egypt i Afrika?", answer: true, explanation: "Egypt ligger nordøst i Afrika", difficulty: "easy" },
  { question: "Er Mount Everest det høyeste fjellet i verden?", answer: true, explanation: "8 849 meter over havet", difficulty: "easy" },
  { question: "Grenser Norge til Russland?", answer: true, explanation: "En 196 km lang grense i Finnmark", difficulty: "medium" },
  { question: "Er Australia både et land og et kontinent?", answer: true, explanation: "Det eneste landet som dekker et helt kontinent", difficulty: "medium" },
  { question: "Er Amazonas den lengste elven i verden?", answer: false, explanation: "Nilen er lengst med 6 650 km", difficulty: "medium" },
  { question: "Ligger Island i EU?", answer: false, explanation: "Island er ikke EU-medlem", difficulty: "medium" },
  { question: "Er Tokyo den mest folkerike byen i verden?", answer: true, explanation: "Over 37 millioner innbyggere i storbyområdet", difficulty: "hard" },
  { question: "Har Indonesia flere øyer enn Norge?", answer: false, explanation: "Norge har ca. 50 000 øyer, Indonesia har ca. 17 000", difficulty: "hard" },
  { question: "Er Grønland en del av Danmark?", answer: true, explanation: "Selvstyrende område under Danmark", difficulty: "medium" },
  { question: "Ligger New Zealand nord for Australia?", answer: false, explanation: "New Zealand ligger sørøst for Australia", difficulty: "medium" },
  { question: "Er Stillehavet det største havet?", answer: true, explanation: "Dekker over 30% av jordas overflate", difficulty: "easy" },
  { question: "Grenser Brasil til alle andre land i Sør-Amerika?", answer: false, explanation: "Brasil grenser ikke til Chile og Ecuador", difficulty: "hard" },
  { question: "Er Finland et skandinavisk land?", answer: false, explanation: "Finland er nordisk, men ikke skandinavisk", difficulty: "hard" },
  { question: "Er Galdhøpiggen Norges høyeste fjell?", answer: true, explanation: "2 469 meter over havet", difficulty: "medium" },
  { question: "Er Vatikanstaten det minste landet i verden?", answer: true, explanation: "Kun 0,44 km²", difficulty: "medium" },
  { question: "Er Stockholm hovedstaden i Sverige?", answer: true, explanation: "Ca. 1 million innbyggere", difficulty: "easy" },
  { question: "Ligger Italia i Europa?", answer: true, explanation: "Sør-Europa, formet som en støvel", difficulty: "easy" },
  { question: "Er Island et varmt land?", answer: false, explanation: "Island har kaldt klima tross navnet", difficulty: "easy" },
  { question: "Ligger Paris i Frankrike?", answer: true, explanation: "Frankrikes hovedstad", difficulty: "easy" },
  { question: "Har Norge grense til Sverige?", answer: true, explanation: "Norges lengste grense", difficulty: "easy" },
  { question: "Er London hovedstaden i Storbritannia?", answer: true, explanation: "Over 8 millioner innbyggere", difficulty: "easy" },

  // ==================== HISTORIE ====================
  { question: "Varte andre verdenskrig i 6 år?", answer: true, explanation: "1939-1945", difficulty: "medium" },
  { question: "Var Kleopatra egypter?", answer: false, explanation: "Hun var gresk-makedonsk", difficulty: "hard" },
  { question: "Ble Norge selvstendig i 1905?", answer: true, explanation: "Unionen med Sverige ble oppløst 7. juni 1905", difficulty: "medium" },
  { question: "Bygde vikingene pyramidene?", answer: false, explanation: "Pyramidene ble bygd tusenvis av år før vikingene", difficulty: "easy" },
  { question: "Fantes dinosaurer og mennesker samtidig?", answer: false, explanation: "Dinosaurene døde ut 65 millioner år før mennesker", difficulty: "easy" },
  { question: "Var Roald Amundsen den første til Sydpolen?", answer: true, explanation: "14. desember 1911", difficulty: "medium" },
  { question: "Startet første verdenskrig i 1914?", answer: true, explanation: "Skuddet i Sarajevo 28. juni 1914", difficulty: "medium" },
  { question: "Var vikingene kjent for å ha hjelmer med horn?", answer: false, explanation: "Hornhjelmer er en myte", difficulty: "medium" },
  { question: "Sank Titanic på sin første reise?", answer: true, explanation: "15. april 1912", difficulty: "medium" },
  { question: "Ble Berlin-muren revet i 1989?", answer: true, explanation: "9. november 1989", difficulty: "medium" },
  { question: "Oppdaget Columbus Amerika i 1492?", answer: true, explanation: "12. oktober 1492", difficulty: "medium" },
  { question: "Eksisterte Romerriket før Jesu fødsel?", answer: true, explanation: "Romerriket ble grunnlagt i 27 f.Kr.", difficulty: "medium" },
  { question: "Var Albert Einstein vitenskapsmann?", answer: true, explanation: "Kjent for relativitetsteorien", difficulty: "easy" },
  { question: "Fantes det riddere i middelalderen?", answer: true, explanation: "Ca. 500-1500 e.Kr.", difficulty: "easy" },

  // ==================== NATURFAG ====================
  { question: "Er vann H2O?", answer: true, explanation: "To hydrogenatomer og ett oksygenatom", difficulty: "easy" },
  { question: "Er lysets hastighet raskere enn lydens?", answer: true, explanation: "Lys: 300 000 km/s, lyd: 343 m/s", difficulty: "easy" },
  { question: "Kretser månen rundt jorden?", answer: true, explanation: "En runde tar ca. 27 dager", difficulty: "easy" },
  { question: "Er solen en planet?", answer: false, explanation: "Solen er en stjerne", difficulty: "easy" },
  { question: "Fryser vann ved 0 grader Celsius?", answer: true, difficulty: "easy" },
  { question: "Er Mars nærmere solen enn jorden?", answer: false, explanation: "Mars er lenger unna solen", difficulty: "medium" },
  { question: "Er Jupiter den største planeten i solsystemet?", answer: true, explanation: "Over 1 300 jordkloder får plass inni Jupiter", difficulty: "easy" },
  { question: "Er blod blått inne i kroppen?", answer: false, explanation: "Blod er alltid rødt", difficulty: "medium" },
  { question: "Har Saturn ringer?", answer: true, explanation: "Ringene består hovedsakelig av is og stein", difficulty: "easy" },
  { question: "Går jorden rundt solen?", answer: true, explanation: "En runde tar ett år", difficulty: "easy" },
  { question: "Koker vann ved 100 grader Celsius?", answer: true, explanation: "Ved havnivå", difficulty: "easy" },
  { question: "Er jern et metall?", answer: true, explanation: "Et av de vanligste metallene", difficulty: "easy" },
  { question: "Kan vann eksistere som gass, væske og fast stoff?", answer: true, explanation: "Damp, vann og is", difficulty: "easy" },
  { question: "Er Venus den varmeste planeten i solsystemet?", answer: true, explanation: "Tross at Merkur er nærmere solen", difficulty: "medium" },

  // ==================== NORGE ====================
  { question: "Er 17. mai Norges nasjonaldag?", answer: true, explanation: "Grunnloven ble undertegnet 17. mai 1814", difficulty: "easy" },
  { question: "Er Bergen Norges nest største by?", answer: true, explanation: "Ca. 285 000 innbyggere", difficulty: "easy" },
  { question: "Er Mjøsa Norges største innsjø?", answer: true, explanation: "362 km² og 468 meter dyp", difficulty: "medium" },
  { question: "Har Norge vunnet fotball-VM for herrer?", answer: false, explanation: "Norge har aldri vunnet fotball-VM", difficulty: "medium" },
  { question: "Er Stortinget Norges parlament?", answer: true, explanation: "169 representanter", difficulty: "easy" },
  { question: "Er Norge medlem av EU?", answer: false, explanation: "Norge er ikke EU-medlem, men er med i EØS", difficulty: "medium" },
  { question: "Ble Vinter-OL arrangert i Lillehammer i 1994?", answer: true, explanation: "Norges andre vinter-OL etter Oslo 1952", difficulty: "medium" },
  { question: "Har Norge midnattssol om sommeren i nord?", answer: true, explanation: "Nord for polarsirkelen", difficulty: "easy" },
  { question: "Ligger Tromsø nord for polarsirkelen?", answer: true, explanation: "På 69° nord", difficulty: "medium" },
  { question: "Er Trondheim en by i Norge?", answer: true, explanation: "Norges tredje største by", difficulty: "easy" },
  { question: "Har Norge en konge?", answer: true, explanation: "Kong Harald V siden 1991", difficulty: "easy" },
  { question: "Er norsk krone Norges valuta?", answer: true, explanation: "NOK", difficulty: "easy" },
  { question: "Feirer vi julaften 24. desember i Norge?", answer: true, explanation: "Hovedfeiringen av jul", difficulty: "easy" },
  { question: "Er Norge kjent for fjorder?", answer: true, explanation: "Over 1000 fjorder", difficulty: "easy" },

  // ==================== SPORT ====================
  { question: "Spilles fotball med 11 spillere på hvert lag?", answer: true, explanation: "10 utespillere + 1 keeper", difficulty: "easy" },
  { question: "Ble FIFA World Cup arrangert i Qatar i 2022?", answer: true, explanation: "Argentina vant mot Frankrike i finalen", difficulty: "easy" },
  { question: "Er Magnus Carlsen fra Norge?", answer: true, explanation: "Verdensmester i sjakk fra 2013", difficulty: "easy" },
  { question: "Holdes Sommer-OL hvert 4. år?", answer: true, explanation: "Neste er i Los Angeles 2028", difficulty: "easy" },
  { question: "Er håndball populært i Norge?", answer: true, explanation: "Norge har vunnet flere VM- og OL-medaljer", difficulty: "easy" },
  { question: "Er Cristiano Ronaldo fra Portugal?", answer: true, explanation: "Født på Madeira", difficulty: "easy" },
  { question: "Har Erling Haaland spilt for Manchester City?", answer: true, explanation: "Signerte i 2022", difficulty: "easy" },
  { question: "Varer en fotballkamp 90 minutter?", answer: true, explanation: "2 omganger á 45 minutter", difficulty: "easy" },
  { question: "Er ski en populær idrett i Norge?", answer: true, explanation: "Både langrenn og alpint", difficulty: "easy" },
  { question: "Spilles tennis med en racket?", answer: true, explanation: "Og en tennisball", difficulty: "easy" },
  { question: "Kan man vinne gullmedalje i OL?", answer: true, explanation: "For førsteplass", difficulty: "easy" },
  { question: "Spilles basketball med hendene?", answer: true, explanation: "Man kan ikke sparke ballen", difficulty: "easy" },

  // ==================== DYR ====================
  { question: "Er hvalen et pattedyr?", answer: true, explanation: "Puster luft og føder levende unger", difficulty: "easy" },
  { question: "Kan strutser fly?", answer: false, explanation: "Strutser kan ikke fly, men løper opptil 70 km/t", difficulty: "easy" },
  { question: "Kan kameleoner endre farge?", answer: true, explanation: "For kommunikasjon og temperaturregulering", difficulty: "easy" },
  { question: "Er sjiraffen det høyeste dyret i verden?", answer: true, explanation: "Opptil 5,5 meter høy", difficulty: "easy" },
  { question: "Legger pingviner egg?", answer: true, explanation: "Alle fugler legger egg", difficulty: "easy" },
  { question: "Er delfiner fisker?", answer: false, explanation: "Delfiner er pattedyr", difficulty: "easy" },
  { question: "Har edderkopper seks bein?", answer: false, explanation: "Edderkopper har åtte bein", difficulty: "easy" },
  { question: "Er hunden et kjæledyr?", answer: true, explanation: "Menneskets beste venn", difficulty: "easy" },
  { question: "Kan fisker puste under vann?", answer: true, explanation: "De bruker gjeller", difficulty: "easy" },
  { question: "Har skilpadder skall?", answer: true, explanation: "Det er en del av skjelettet", difficulty: "easy" },
  { question: "Kan kaniner hoppe?", answer: true, explanation: "Bakbeina er laget for hopping", difficulty: "easy" },
  { question: "Er pingviner fugler?", answer: true, explanation: "Selv om de ikke kan fly", difficulty: "easy" },
  { question: "Er blåhval større enn elefant?", answer: true, explanation: "Blåhval er verdens største dyr", difficulty: "easy" },
  { question: "Har edderkopper vinger?", answer: false, explanation: "De har åtte bein, men ingen vinger", difficulty: "easy" },
  { question: "Legger krokodiller egg?", answer: true, explanation: "Som alle krypdyr", difficulty: "easy" },
  { question: "Er en hai et pattedyr?", answer: false, explanation: "Hai er en fisk", difficulty: "easy" },

  // ==================== MAT OG DRIKKE ====================
  { question: "Kommer sjokolade fra kakaobønner?", answer: true, explanation: "Kakaobønner vokser i tropiske områder", difficulty: "easy" },
  { question: "Er tomat botanisk sett en frukt?", answer: true, explanation: "Inneholder frø, så det er en frukt", difficulty: "medium" },
  { question: "Er pizza opprinnelig fra Italia?", answer: true, explanation: "Moderne pizza fra Napoli på 1800-tallet", difficulty: "easy" },
  { question: "Kommer melk fra kuer?", answer: true, explanation: "Også fra geiter og sauer", difficulty: "easy" },
  { question: "Er eple en frukt?", answer: true, explanation: "En av de vanligste fruktene", difficulty: "easy" },
  { question: "Er brød laget av mel?", answer: true, explanation: "Vanligvis hvetemel", difficulty: "easy" },
  { question: "Kommer appelsinjuice fra appelsiner?", answer: true, explanation: "Presset fra sitrusfrukten", difficulty: "easy" },

  // ==================== TEKNOLOGI ====================
  { question: "Er Bitcoin en kryptovaluta?", answer: true, explanation: "Skapt i 2009 av 'Satoshi Nakamoto'", difficulty: "easy" },
  { question: "Er Google et amerikansk selskap?", answer: true, explanation: "Grunnlagt i California i 1998", difficulty: "easy" },
  { question: "Står AI for Artificial Intelligence?", answer: true, explanation: "Kunstig intelligens på norsk", difficulty: "easy" },
  { question: "Ble Facebook grunnlagt av Mark Zuckerberg?", answer: true, explanation: "På Harvard i 2004", difficulty: "easy" },
  { question: "Er 5G raskere enn 4G?", answer: true, explanation: "Opptil 100 ganger raskere", difficulty: "easy" },
  { question: "Kan man ringe med en smarttelefon?", answer: true, explanation: "Pluss mye mer", difficulty: "easy" },
  { question: "Brukes tastatur for å skrive på PC?", answer: true, explanation: "Standard inndataenhet", difficulty: "easy" },
  { question: "Kan man se videoer på YouTube?", answer: true, explanation: "Verdens største videoplattform", difficulty: "easy" },
  { question: "Kan man spille spill på PlayStation?", answer: true, explanation: "Spillkonsoll fra Sony", difficulty: "easy" },

  // ==================== KROPP OG HELSE ====================
  { question: "Har mennesker unike fingeravtrykk?", answer: true, explanation: "Selv eneggede tvillinger har forskjellige", difficulty: "easy" },
  { question: "Pumper hjertet blod rundt i kroppen?", answer: true, explanation: "Ca. 100 000 slag per dag", difficulty: "easy" },
  { question: "Trenger kroppen søvn?", answer: true, explanation: "For å hvile og reparere seg", difficulty: "easy" },
  { question: "Er skjelettet laget av bein?", answer: true, explanation: "206 bein hos voksne", difficulty: "easy" },
  { question: "Trenger kroppen mat for energi?", answer: true, explanation: "Kalorier = energi", difficulty: "easy" },
  { question: "Ligger hjertet på venstre side?", answer: true, explanation: "Litt til venstre i brystet", difficulty: "easy" },
  { question: "Er det flere ben i kroppen enn 100?", answer: true, explanation: "Voksne har 206 ben", difficulty: "easy" },

  // ==================== KURIOSA ====================
  { question: "Kan lynet slå ned på samme sted to ganger?", answer: true, explanation: "Empire State Building treffes ca. 20 ganger årlig", difficulty: "medium" },
  { question: "Kan man høre lyd i verdensrommet?", answer: false, explanation: "Det er ingen luft, så lyd kan ikke bevege seg", difficulty: "medium" },
  { question: "Har jorden mer enn én naturlig måne?", answer: false, explanation: "Jorden har bare én måne", difficulty: "medium" },
  { question: "Kan man se nordlys fra Norge?", answer: true, explanation: "Spesielt i Nord-Norge", difficulty: "medium" },
  { question: "Sover mennesker ca. en tredjedel av livet?", answer: true, explanation: "Ca. 8 timer om dagen", difficulty: "medium" },

  // ==================== EKSTRA LETTE ====================
  { question: "Har Norge flere enn 10 fylker?", answer: true, explanation: "Norge har 15 fylker", difficulty: "easy" },
  { question: "Har et firkløver fire blader?", answer: true, explanation: "Vanlige kløver har tre", difficulty: "easy" },
  { question: "Kan flaggermus se?", answer: true, explanation: "De er ikke blinde", difficulty: "easy" },
  { question: "Er Merkur den minste planeten i solsystemet?", answer: true, explanation: "Etter at Pluto ble dvergplanet", difficulty: "easy" },
  { question: "Er København hovedstaden i Danmark?", answer: true, difficulty: "easy" },
  { question: "Har sommerfugler fire vinger?", answer: true, explanation: "To par vinger", difficulty: "easy" },
  { question: "Er det kaldere på Nordpolen enn på Sydpolen?", answer: false, explanation: "Sydpolen er kaldest", difficulty: "easy" },
  { question: "Har Norge kyst mot Atlanterhavet?", answer: true, explanation: "Hele vestkysten", difficulty: "easy" },
  { question: "Er en sel et pattedyr?", answer: true, explanation: "Den føder levende unger", difficulty: "easy" },
  { question: "Var dinosaurene krypdyr?", answer: true, explanation: "De var reptiler", difficulty: "easy" },
  { question: "Er Helsinki hovedstaden i Finland?", answer: true, difficulty: "easy" },
  { question: "Kan kameler lagre vann i pukkelene?", answer: false, explanation: "De lagrer fett, ikke vann", difficulty: "easy" },
  { question: "Har Norge landegrense til Island?", answer: false, explanation: "Island er en øy", difficulty: "easy" },
  { question: "Kommer ull fra sauer?", answer: true, explanation: "Sauer klippes for ull", difficulty: "easy" },
  { question: "Er Eiffeltårnet i London?", answer: false, explanation: "Det er i Paris", difficulty: "easy" },
  { question: "Har mus hale?", answer: true, explanation: "Lang, tynn hale", difficulty: "easy" },
  { question: "Er Mars kjent som den røde planeten?", answer: true, explanation: "På grunn av jernoksid", difficulty: "easy" },
  { question: "Spiser kaniner kjøtt?", answer: false, explanation: "De er planteetere", difficulty: "easy" },
  { question: "Har et piano flere enn 50 tangenter?", answer: true, explanation: "88 tangenter", difficulty: "easy" },
  { question: "Er en kiwi en fugl?", answer: true, explanation: "En fugl fra New Zealand som ikke kan fly", difficulty: "easy" },
  { question: "Kan struts fly?", answer: false, explanation: "Den løper i stedet - opptil 70 km/t", difficulty: "easy" },
  { question: "Er Grønland større enn Australia?", answer: false, explanation: "Australia er mye større", difficulty: "easy" },
  { question: "Har snegler skall?", answer: true, explanation: "De bærer huset på ryggen", difficulty: "easy" },
  { question: "Er det flere enn 100 land i verden?", answer: true, explanation: "Ca. 195 land", difficulty: "easy" },
  { question: "Er Middelhavet et hav?", answer: true, explanation: "Mellom Europa og Afrika", difficulty: "easy" },
  { question: "Er det flere enn 20 bokstaver i det norske alfabetet?", answer: true, explanation: "29 bokstaver", difficulty: "easy" },
  { question: "Lever sjøhester i havet?", answer: true, explanation: "Til tross for navnet", difficulty: "easy" },
  { question: "Er lørdag en ukedag?", answer: true, explanation: "Den sjette dagen i uken", difficulty: "easy" },
  { question: "Er Nilen en elv i Asia?", answer: false, explanation: "Den er i Afrika", difficulty: "easy" },
  { question: "Er et kontinent større enn et land?", answer: true, explanation: "Vanligvis ja", difficulty: "easy" },
  { question: "Har leoparder flekker?", answer: true, explanation: "Svarte flekker på gul pels", difficulty: "easy" },
  { question: "Er Reykjavik en by i Norge?", answer: false, explanation: "Det er hovedstaden i Island", difficulty: "easy" },
  { question: "Kan blekksprut sprute blekk?", answer: true, explanation: "For å forvirre fiender", difficulty: "easy" },
  { question: "Er januar den første måneden?", answer: true, explanation: "Måneden etter desember", difficulty: "easy" },
];

export default questions;

// Hjelpefunksjon for å filtrere på vanskelighetsgrad
// For ungdomsskole: Kun medium og hard spørsmål
export function getQuestionsByDifficulty(difficulty) {
  if (difficulty === 'all') {
    // Kombiner medium og hard for ungdomsskole
    return questions.filter(q => q.difficulty === 'medium' || q.difficulty === 'hard');
  }
  return questions.filter(q => q.difficulty === difficulty);
}

// Hjelpefunksjon for å blande spørsmål
export function shuffleQuestions(questionsArray) {
  const shuffled = [...questionsArray];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
