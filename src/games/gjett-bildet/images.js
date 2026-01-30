// Bildedatabase for Gjett bildet
// Bruker lokale bilder fra /assets/images/
// Flere varianter av hvert bilde - slett de som er feil

const BASE_PATH = '/assets/images/';

const IMAGES = {
  dyr: [
    // Hund (3 varianter)
    { url: `${BASE_PATH}hund-1.jpg`, answers: ["hund", "dog"], difficulty: "easy" },
    { url: `${BASE_PATH}hund-2.jpg`, answers: ["hund", "dog"], difficulty: "easy" },
    { url: `${BASE_PATH}hund-3.jpg`, answers: ["hund", "dog"], difficulty: "easy" },
    // Katt (3 varianter)
    { url: `${BASE_PATH}katt-1.jpg`, answers: ["katt", "cat"], difficulty: "easy" },
    { url: `${BASE_PATH}katt-2.jpg`, answers: ["katt", "cat"], difficulty: "easy" },
    { url: `${BASE_PATH}katt-3.jpg`, answers: ["katt", "cat"], difficulty: "easy" },
    // Løve (2 varianter)
    { url: `${BASE_PATH}love-1.jpg`, answers: ["løve", "lion"], difficulty: "easy" },
    { url: `${BASE_PATH}love-2.jpg`, answers: ["løve", "lion"], difficulty: "easy" },
    // Tiger (2 varianter)
    { url: `${BASE_PATH}tiger-1.jpg`, answers: ["tiger"], difficulty: "medium" },
    { url: `${BASE_PATH}tiger-2.jpg`, answers: ["tiger"], difficulty: "medium" },
    // Elefant (2 varianter)
    { url: `${BASE_PATH}elefant-1.jpg`, answers: ["elefant", "elephant"], difficulty: "easy" },
    { url: `${BASE_PATH}elefant-2.jpg`, answers: ["elefant", "elephant"], difficulty: "easy" },
    // Sjiraff (2 varianter)
    { url: `${BASE_PATH}sjiraff-1.jpg`, answers: ["sjiraff", "giraff", "giraffe"], difficulty: "easy" },
    { url: `${BASE_PATH}sjiraff-2.jpg`, answers: ["sjiraff", "giraff", "giraffe"], difficulty: "easy" },
    // Panda (2 varianter)
    { url: `${BASE_PATH}panda-1.jpg`, answers: ["panda", "pandabjørn"], difficulty: "medium" },
    { url: `${BASE_PATH}panda-2.jpg`, answers: ["panda", "pandabjørn"], difficulty: "medium" },
    // Kanin (2 varianter)
    { url: `${BASE_PATH}kanin-1.jpg`, answers: ["kanin", "rabbit"], difficulty: "easy" },
    { url: `${BASE_PATH}kanin-2.jpg`, answers: ["kanin", "rabbit"], difficulty: "easy" },
    // Isbjørn (2 varianter)
    { url: `${BASE_PATH}isbjorn-1.jpg`, answers: ["isbjørn", "polar bear"], difficulty: "medium" },
    { url: `${BASE_PATH}isbjorn-2.jpg`, answers: ["isbjørn", "polar bear"], difficulty: "medium" },
    // Skilpadde (2 varianter)
    { url: `${BASE_PATH}skilpadde-1.jpg`, answers: ["skilpadde", "turtle"], difficulty: "medium" },
    { url: `${BASE_PATH}skilpadde-2.jpg`, answers: ["skilpadde", "turtle"], difficulty: "medium" },
    // Delfin (2 varianter)
    { url: `${BASE_PATH}delfin-1.jpg`, answers: ["delfin", "dolphin"], difficulty: "medium" },
    { url: `${BASE_PATH}delfin-2.jpg`, answers: ["delfin", "dolphin"], difficulty: "medium" },
    // Fisk (2 varianter)
    { url: `${BASE_PATH}fisk-1.jpg`, answers: ["fisk", "fish", "klovnefisk"], difficulty: "easy" },
    { url: `${BASE_PATH}fisk-2.jpg`, answers: ["fisk", "fish", "gullfisk"], difficulty: "easy" },
    // Fugl (2 varianter)
    { url: `${BASE_PATH}fugl-1.jpg`, answers: ["fugl", "bird"], difficulty: "easy" },
    { url: `${BASE_PATH}fugl-2.jpg`, answers: ["fugl", "bird"], difficulty: "easy" },
    // Sommerfugl (2 varianter)
    { url: `${BASE_PATH}sommerfugl-1.jpg`, answers: ["sommerfugl", "butterfly"], difficulty: "medium" },
    { url: `${BASE_PATH}sommerfugl-2.jpg`, answers: ["sommerfugl", "butterfly"], difficulty: "medium" },
    // --- NYE DYR ---
    // Hest
    { url: `${BASE_PATH}hest-1.jpg`, answers: ["hest", "horse"], difficulty: "easy" },
    // Ku
    { url: `${BASE_PATH}ku-1.jpg`, answers: ["ku", "cow"], difficulty: "easy" },
    { url: `${BASE_PATH}ku-2.jpg`, answers: ["ku", "cow"], difficulty: "easy" },
    // Gris
    { url: `${BASE_PATH}gris-1.jpg`, answers: ["gris", "pig"], difficulty: "easy" },
    { url: `${BASE_PATH}gris-2.jpg`, answers: ["gris", "pig"], difficulty: "easy" },
    // Sau
    { url: `${BASE_PATH}sau-1.jpg`, answers: ["sau", "sheep"], difficulty: "easy" },
    { url: `${BASE_PATH}sau-2.jpg`, answers: ["sau", "sheep"], difficulty: "easy" },
    // Ugle
    { url: `${BASE_PATH}ugle-1.jpg`, answers: ["ugle", "owl"], difficulty: "medium" },
    { url: `${BASE_PATH}ugle-2.jpg`, answers: ["ugle", "owl"], difficulty: "medium" },
    // Ørn
    { url: `${BASE_PATH}orn-1.jpg`, answers: ["ørn", "eagle"], difficulty: "medium" },
    { url: `${BASE_PATH}orn-2.jpg`, answers: ["ørn", "eagle"], difficulty: "medium" },
    // Hai
    { url: `${BASE_PATH}hai-1.jpg`, answers: ["hai", "shark"], difficulty: "medium" },
    { url: `${BASE_PATH}hai-2.jpg`, answers: ["hai", "shark"], difficulty: "medium" },
    // Frosk
    { url: `${BASE_PATH}frosk-1.jpg`, answers: ["frosk", "frog"], difficulty: "easy" },
    // Koala
    { url: `${BASE_PATH}koala-1.jpg`, answers: ["koala"], difficulty: "medium" },
    { url: `${BASE_PATH}koala-2.jpg`, answers: ["koala"], difficulty: "medium" },
    // Gorilla
    { url: `${BASE_PATH}gorilla-1.jpg`, answers: ["gorilla", "ape"], difficulty: "medium" },
    { url: `${BASE_PATH}gorilla-2.jpg`, answers: ["gorilla", "ape"], difficulty: "medium" },
    // --- ENDA FLERE DYR ---
    // Pingvin
    { url: `${BASE_PATH}pingvin-1.jpg`, answers: ["pingvin", "penguin"], difficulty: "easy" },
    // Flamingo
    { url: `${BASE_PATH}flamingo-1.jpg`, answers: ["flamingo"], difficulty: "easy" },
    { url: `${BASE_PATH}flamingo-2.jpg`, answers: ["flamingo"], difficulty: "easy" },
    // Kamel
    { url: `${BASE_PATH}kamel-1.jpg`, answers: ["kamel", "camel"], difficulty: "medium" },
    // Papegøye
    { url: `${BASE_PATH}papegøye-1.jpg`, answers: ["papegøye", "parrot"], difficulty: "medium" },
    // Blekksprut
    { url: `${BASE_PATH}blekksprut-1.jpg`, answers: ["blekksprut", "octopus"], difficulty: "medium" },
    { url: `${BASE_PATH}blekksprut-2.jpg`, answers: ["blekksprut", "octopus"], difficulty: "medium" },
    // Sjøhest
    { url: `${BASE_PATH}sjohest-1.jpg`, answers: ["sjøhest", "seahorse"], difficulty: "medium" },
    // Påfugl
    { url: `${BASE_PATH}pafugl-1.jpg`, answers: ["påfugl", "peacock"], difficulty: "medium" },
    { url: `${BASE_PATH}pafugl-2.jpg`, answers: ["påfugl", "peacock"], difficulty: "medium" },
    // Edderkopp
    { url: `${BASE_PATH}edderkopp-1.jpg`, answers: ["edderkopp", "spider"], difficulty: "easy" },
    // Bie
    { url: `${BASE_PATH}bie-1.jpg`, answers: ["bie", "bee"], difficulty: "easy" },
    // Krabbe
    { url: `${BASE_PATH}krabbe-1.jpg`, answers: ["krabbe", "crab"], difficulty: "easy" },
    // Flodhest
    { url: `${BASE_PATH}flodhest-1.jpg`, answers: ["flodhest", "hippo"], difficulty: "medium" },
    // --- NYE ENKLE DYR ---
    // And
    { url: `${BASE_PATH}and-1.jpg`, answers: ["and", "duck"], difficulty: "easy" },
    // Høne/Kylling
    { url: `${BASE_PATH}hone-1.jpg`, answers: ["høne", "kylling", "chicken", "hen"], difficulty: "easy" },
    { url: `${BASE_PATH}hone-2.jpg`, answers: ["høne", "kylling", "chicken", "hen"], difficulty: "easy" },
    // Esel
    { url: `${BASE_PATH}esel-1.jpg`, answers: ["esel", "donkey"], difficulty: "easy" },
    { url: `${BASE_PATH}esel-2.jpg`, answers: ["esel", "donkey"], difficulty: "easy" },
    // Slange
    { url: `${BASE_PATH}slange-1.jpg`, answers: ["slange", "snake"], difficulty: "easy" },
    { url: `${BASE_PATH}slange-2.jpg`, answers: ["slange", "snake"], difficulty: "easy" },
    // --- NYE MEDIUM DYR ---
    // Ulv
    { url: `${BASE_PATH}ulv-1.jpg`, answers: ["ulv", "wolf"], difficulty: "medium" },
    { url: `${BASE_PATH}ulv-2.jpg`, answers: ["ulv", "wolf"], difficulty: "medium" },
    // Bjørn (brunbjørn)
    { url: `${BASE_PATH}bjorn-1.jpg`, answers: ["bjørn", "bear", "brunbjørn"], difficulty: "medium" },
    { url: `${BASE_PATH}bjorn-2.jpg`, answers: ["bjørn", "bear", "brunbjørn"], difficulty: "medium" },
    // Hval
    { url: `${BASE_PATH}hval-1.jpg`, answers: ["hval", "whale"], difficulty: "medium" },
    // Krokodille
    { url: `${BASE_PATH}krokodille-1.jpg`, answers: ["krokodille", "alligator", "crocodile"], difficulty: "medium" },
    // --- NYE VANSKELIGE DYR ---
    // Gepard
    { url: `${BASE_PATH}gepard-1.jpg`, answers: ["gepard", "cheetah"], difficulty: "hard" },
    // Sjimpanse
    { url: `${BASE_PATH}sjimpanse-1.jpg`, answers: ["sjimpanse", "chimpanzee", "ape"], difficulty: "hard" },
    // --- ENDA FLERE DYR ---
    // Elg
    { url: `${BASE_PATH}elg-1.jpg`, answers: ["elg", "moose"] },
    // Manet
    { url: `${BASE_PATH}manet-1.jpg`, answers: ["manet", "jellyfish"] },
    { url: `${BASE_PATH}manet-2.jpg`, answers: ["manet", "jellyfish"] },
    // Skjære
    { url: `${BASE_PATH}skjaere-1.jpg`, answers: ["skjære", "magpie"] },
    // Gresshoppe
    { url: `${BASE_PATH}gresshoppe-1.jpg`, answers: ["gresshoppe", "grasshopper"] },
    // Flue
    { url: `${BASE_PATH}flue-1.jpg`, answers: ["flue", "fly"] },
    // Sjøløve
    { url: `${BASE_PATH}sjolove-1.jpg`, answers: ["sjøløve", "sea lion"] },
    // Hvalross
    { url: `${BASE_PATH}hvalross-1.jpg`, answers: ["hvalross", "walrus"] },
    // Gribb
    { url: `${BASE_PATH}gribb-1.jpg`, answers: ["gribb", "vulture"] },
    // Stork
    { url: `${BASE_PATH}stork-1.jpg`, answers: ["stork"] },
  ],

  steder: [
    // Eiffeltårnet (3 varianter)
    { url: `${BASE_PATH}eiffel-1.jpg`, answers: ["eiffeltårnet", "eiffel tower", "paris"], difficulty: "easy" },
    { url: `${BASE_PATH}eiffel-2.jpg`, answers: ["eiffeltårnet", "eiffel tower", "paris"], difficulty: "easy" },
    { url: `${BASE_PATH}eiffel-3.jpg`, answers: ["eiffeltårnet", "eiffel tower", "paris"], difficulty: "easy" },
    // Colosseum (2 varianter)
    { url: `${BASE_PATH}colosseum-1.jpg`, answers: ["colosseum", "kolosseum", "roma", "rome"], difficulty: "easy" },
    { url: `${BASE_PATH}colosseum-2.jpg`, answers: ["colosseum", "kolosseum", "roma", "rome"], difficulty: "easy" },
    // Frihetsgudinnen (2 varianter)
    { url: `${BASE_PATH}frihetsgudinnen-1.jpg`, answers: ["frihetsgudinnen", "statue of liberty", "new york"], difficulty: "easy" },
    { url: `${BASE_PATH}frihetsgudinnen-2.jpg`, answers: ["frihetsgudinnen", "statue of liberty", "new york"], difficulty: "easy" },
    // Taj Mahal (2 varianter)
    { url: `${BASE_PATH}taj-mahal-1.jpg`, answers: ["taj mahal", "india"], difficulty: "medium" },
    { url: `${BASE_PATH}taj-mahal-2.jpg`, answers: ["taj mahal", "india"], difficulty: "medium" },
    // Sydney Opera (2 varianter)
    { url: `${BASE_PATH}sydney-1.jpg`, answers: ["sydney", "operahuset", "opera house", "australia"], difficulty: "medium" },
    { url: `${BASE_PATH}sydney-2.jpg`, answers: ["sydney", "operahuset", "opera house", "australia"], difficulty: "medium" },
    // Golden Gate (2 varianter)
    { url: `${BASE_PATH}golden-gate-1.jpg`, answers: ["golden gate", "san francisco", "bro", "bridge"], difficulty: "medium" },
    { url: `${BASE_PATH}golden-gate-2.jpg`, answers: ["golden gate", "san francisco", "bro", "bridge"], difficulty: "medium" },
    // New York (2 varianter)
    { url: `${BASE_PATH}new-york-1.jpg`, answers: ["new york", "manhattan", "skyline"], difficulty: "medium" },
    { url: `${BASE_PATH}new-york-2.jpg`, answers: ["new york", "manhattan", "skyline"], difficulty: "medium" },
    // Mount Fuji (2 varianter)
    { url: `${BASE_PATH}fuji-1.jpg`, answers: ["fuji", "mount fuji", "japan", "fjell"], difficulty: "hard" },
    { url: `${BASE_PATH}fuji-2.jpg`, answers: ["fuji", "mount fuji", "japan", "fjell"], difficulty: "hard" },
    // London / Big Ben (2 varianter)
    { url: `${BASE_PATH}london-1.jpg`, answers: ["london", "big ben", "england"], difficulty: "easy" },
    { url: `${BASE_PATH}london-2.jpg`, answers: ["london", "big ben", "england"], difficulty: "easy" },
    // Kinesiske muren (2 varianter)
    { url: `${BASE_PATH}kinesiske-muren-1.jpg`, answers: ["kinesiske muren", "great wall", "kina", "china"], difficulty: "medium" },
    { url: `${BASE_PATH}kinesiske-muren-2.jpg`, answers: ["kinesiske muren", "great wall", "kina", "china"], difficulty: "medium" },
    // --- NYE STEDER ---
    // Pyramidene
    { url: `${BASE_PATH}pyramidene-1.jpg`, answers: ["pyramidene", "pyramider", "giza", "egypt"], difficulty: "easy" },
    { url: `${BASE_PATH}pyramidene-2.jpg`, answers: ["pyramidene", "pyramider", "giza", "egypt"], difficulty: "easy" },
    // Akropolis
    { url: `${BASE_PATH}akropolis-1.jpg`, answers: ["akropolis", "parthenon", "athen", "hellas"], difficulty: "hard" },
    { url: `${BASE_PATH}akropolis-2.jpg`, answers: ["akropolis", "parthenon", "athen", "hellas"], difficulty: "hard" },
    // Machu Picchu
    { url: `${BASE_PATH}machu-picchu-1.jpg`, answers: ["machu picchu", "peru"], difficulty: "hard" },
    { url: `${BASE_PATH}machu-picchu-2.jpg`, answers: ["machu picchu", "peru"], difficulty: "hard" },
    // Stonehenge
    { url: `${BASE_PATH}stonehenge-1.jpg`, answers: ["stonehenge", "england"], difficulty: "medium" },
    // Niagara Falls
    { url: `${BASE_PATH}niagara-1.jpg`, answers: ["niagara", "foss", "waterfall"], difficulty: "medium" },
    // Grand Canyon
    { url: `${BASE_PATH}grand-canyon-1.jpg`, answers: ["grand canyon", "canyon", "usa"], difficulty: "medium" },
    { url: `${BASE_PATH}grand-canyon-2.jpg`, answers: ["grand canyon", "canyon", "usa"], difficulty: "medium" },
    // Venezia
    { url: `${BASE_PATH}venezia-1.jpg`, answers: ["venezia", "venice", "italia"], difficulty: "medium" },
    { url: `${BASE_PATH}venezia-2.jpg`, answers: ["venezia", "venice", "italia"], difficulty: "medium" },
    // Rio / Cristo Redentor
    { url: `${BASE_PATH}rio-1.jpg`, answers: ["rio", "cristo", "brasil", "brazil"], difficulty: "medium" },
    { url: `${BASE_PATH}rio-2.jpg`, answers: ["rio", "cristo", "brasil", "brazil"], difficulty: "medium" },
    // Tower Bridge
    { url: `${BASE_PATH}tower-bridge-1.jpg`, answers: ["tower bridge", "london", "bro"], difficulty: "medium" },
    { url: `${BASE_PATH}tower-bridge-2.jpg`, answers: ["tower bridge", "london", "bro"], difficulty: "medium" },
    // Dubai
    { url: `${BASE_PATH}dubai-1.jpg`, answers: ["dubai", "burj khalifa"], difficulty: "medium" },
    { url: `${BASE_PATH}dubai-2.jpg`, answers: ["dubai", "burj khalifa"], difficulty: "medium" },
    // --- NYE ENKLE STEDER ---
    // Brandenburger Tor (Berlin)
    { url: `${BASE_PATH}berlin-1.jpg`, answers: ["berlin", "brandenburger tor", "germany"], difficulty: "easy" },
    // Det skjeve tårn i Pisa
    { url: `${BASE_PATH}pisa-1.jpg`, answers: ["pisa", "det skjeve tårn", "leaning tower", "italia"], difficulty: "easy" },
    // --- NYE MEDIUM STEDER ---
    // Santorini
    { url: `${BASE_PATH}santorini-1.jpg`, answers: ["santorini", "hellas", "greece"], difficulty: "medium" },
    { url: `${BASE_PATH}santorini-2.jpg`, answers: ["santorini", "hellas", "greece"], difficulty: "medium" },
    // Nordlys
    { url: `${BASE_PATH}nordlys-1.jpg`, answers: ["nordlys", "aurora", "northern lights"], difficulty: "medium" },
    { url: `${BASE_PATH}nordlys-2.jpg`, answers: ["nordlys", "aurora", "northern lights"], difficulty: "medium" },
    // Amsterdam
    { url: `${BASE_PATH}amsterdam-1.jpg`, answers: ["amsterdam", "nederland", "netherlands"], difficulty: "medium" },
    { url: `${BASE_PATH}amsterdam-2.jpg`, answers: ["amsterdam", "nederland", "netherlands"], difficulty: "medium" },
    // --- NYE VANSKELIGE STEDER ---
    // Sagrada Familia
    { url: `${BASE_PATH}sagrada-1.jpg`, answers: ["sagrada familia", "barcelona", "spania"], difficulty: "hard" },
    // --- NORSKE STEDER ---
    // Bryggen (Bergen)
    { url: `${BASE_PATH}bryggen-1.jpg`, answers: ["bryggen", "bergen"] },
    // Ulrikken (Bergen)
    { url: `${BASE_PATH}ulrikken-1.jpg`, answers: ["ulrikken", "ulriken", "bergen"] },
  ],

  ting: [
    // Gitar (3 varianter)
    { url: `${BASE_PATH}gitar-1.jpg`, answers: ["gitar", "guitar"], difficulty: "easy" },
    { url: `${BASE_PATH}gitar-2.jpg`, answers: ["gitar", "guitar"], difficulty: "easy" },
    { url: `${BASE_PATH}gitar-3.jpg`, answers: ["gitar", "guitar"], difficulty: "easy" },
    // Piano (2 varianter)
    { url: `${BASE_PATH}piano-1.jpg`, answers: ["piano", "flygel"], difficulty: "easy" },
    { url: `${BASE_PATH}piano-2.jpg`, answers: ["piano", "flygel"], difficulty: "easy" },
    // Hodetelefoner (3 varianter)
    { url: `${BASE_PATH}hodetelefoner-1.jpg`, answers: ["hodetelefoner", "headphones"], difficulty: "easy" },
    { url: `${BASE_PATH}hodetelefoner-2.jpg`, answers: ["hodetelefoner", "headphones"], difficulty: "easy" },
    { url: `${BASE_PATH}hodetelefoner-3.jpg`, answers: ["hodetelefoner", "headphones"], difficulty: "easy" },
    // Kamera (2 varianter)
    { url: `${BASE_PATH}kamera-1.jpg`, answers: ["kamera", "camera"], difficulty: "easy" },
    { url: `${BASE_PATH}kamera-2.jpg`, answers: ["kamera", "camera"], difficulty: "easy" },
    // Sykkel (2 varianter)
    { url: `${BASE_PATH}sykkel-1.jpg`, answers: ["sykkel", "bike", "bicycle"], difficulty: "easy" },
    { url: `${BASE_PATH}sykkel-2.jpg`, answers: ["sykkel", "bike", "bicycle"], difficulty: "easy" },
    // Bil (3 varianter)
    { url: `${BASE_PATH}bil-1.jpg`, answers: ["bil", "car"], difficulty: "easy" },
    { url: `${BASE_PATH}bil-2.jpg`, answers: ["bil", "car"], difficulty: "easy" },
    { url: `${BASE_PATH}bil-3.jpg`, answers: ["bil", "car"], difficulty: "easy" },
    // Mobil (2 varianter)
    { url: `${BASE_PATH}mobil-1.jpg`, answers: ["mobil", "telefon", "iphone", "smartphone"], difficulty: "easy" },
    { url: `${BASE_PATH}mobil-2.jpg`, answers: ["mobil", "telefon", "iphone", "smartphone"], difficulty: "easy" },
    // Klokke (2 varianter)
    { url: `${BASE_PATH}klokke-1.jpg`, answers: ["klokke", "watch", "armbåndsur"], difficulty: "easy" },
    { url: `${BASE_PATH}klokke-2.jpg`, answers: ["klokke", "watch", "armbåndsur"], difficulty: "easy" },
    // Solbriller (2 varianter)
    { url: `${BASE_PATH}solbriller-1.jpg`, answers: ["solbriller", "sunglasses"], difficulty: "easy" },
    { url: `${BASE_PATH}solbriller-2.jpg`, answers: ["solbriller", "sunglasses"], difficulty: "easy" },
    // Laptop (2 varianter)
    { url: `${BASE_PATH}laptop-1.jpg`, answers: ["laptop", "datamaskin", "pc", "computer"], difficulty: "medium" },
    { url: `${BASE_PATH}laptop-2.jpg`, answers: ["laptop", "datamaskin", "pc", "computer"], difficulty: "medium" },
    // Sko (3 varianter)
    { url: `${BASE_PATH}sko-1.jpg`, answers: ["sko", "joggesko", "sneakers"], difficulty: "easy" },
    { url: `${BASE_PATH}sko-2.jpg`, answers: ["sko", "joggesko", "sneakers"], difficulty: "easy" },
    { url: `${BASE_PATH}sko-3.jpg`, answers: ["sko", "joggesko", "sneakers"], difficulty: "easy" },
    // Kaffe (2 varianter)
    { url: `${BASE_PATH}kaffe-1.jpg`, answers: ["kaffe", "kaffekopp", "coffee"], difficulty: "easy" },
    { url: `${BASE_PATH}kaffe-2.jpg`, answers: ["kaffe", "kaffekopp", "coffee"], difficulty: "easy" },
    // Fotball (2 varianter)
    { url: `${BASE_PATH}fotball-1.jpg`, answers: ["fotball", "soccer ball", "ball"], difficulty: "easy" },
    { url: `${BASE_PATH}fotball-2.jpg`, answers: ["fotball", "soccer ball", "ball"], difficulty: "easy" },
    // Basketball (2 varianter)
    { url: `${BASE_PATH}basketball-1.jpg`, answers: ["basketball", "ball"], difficulty: "medium" },
    { url: `${BASE_PATH}basketball-2.jpg`, answers: ["basketball", "ball"], difficulty: "medium" },
    // Bok (2 varianter)
    { url: `${BASE_PATH}bok-1.jpg`, answers: ["bok", "book"], difficulty: "easy" },
    { url: `${BASE_PATH}bok-2.jpg`, answers: ["bok", "book"], difficulty: "easy" },
    // Ryggsekk (2 varianter)
    { url: `${BASE_PATH}ryggsekk-1.jpg`, answers: ["ryggsekk", "backpack", "sekk"], difficulty: "medium" },
    { url: `${BASE_PATH}ryggsekk-2.jpg`, answers: ["ryggsekk", "backpack", "sekk"], difficulty: "medium" },
    // Skateboard (1 variant)
    { url: `${BASE_PATH}skateboard-1.jpg`, answers: ["skateboard", "brett"], difficulty: "medium" },
    // Vannflaske (1 variant)
    { url: `${BASE_PATH}vannflaske-1.jpg`, answers: ["vannflaske", "flaske", "water bottle"], difficulty: "easy" },
    // --- NYE TING ---
    // TV
    { url: `${BASE_PATH}tv-1.jpg`, answers: ["tv", "fjernsyn", "television"], difficulty: "easy" },
    { url: `${BASE_PATH}tv-2.jpg`, answers: ["tv", "fjernsyn", "television"], difficulty: "easy" },
    // Trommer
    { url: `${BASE_PATH}trommer-1.jpg`, answers: ["trommer", "drums", "trommesett"], difficulty: "easy" },
    { url: `${BASE_PATH}trommer-2.jpg`, answers: ["trommer", "drums", "trommesett"], difficulty: "easy" },
    // Briller
    { url: `${BASE_PATH}briller-1.jpg`, answers: ["briller", "glasses"], difficulty: "easy" },
    { url: `${BASE_PATH}briller-2.jpg`, answers: ["briller", "glasses"], difficulty: "easy" },
    // Eple
    { url: `${BASE_PATH}eple-1.jpg`, answers: ["eple", "apple"], difficulty: "easy" },
    { url: `${BASE_PATH}eple-2.jpg`, answers: ["eple", "apple"], difficulty: "easy" },
    // Banan
    { url: `${BASE_PATH}banan-1.jpg`, answers: ["banan", "banana"], difficulty: "easy" },
    { url: `${BASE_PATH}banan-2.jpg`, answers: ["banan", "banana"], difficulty: "easy" },
    // Is/Iskrem
    { url: `${BASE_PATH}is-1.jpg`, answers: ["is", "iskrem", "ice cream"], difficulty: "easy" },
    { url: `${BASE_PATH}is-2.jpg`, answers: ["is", "iskrem", "ice cream"], difficulty: "easy" },
    // Lampe
    { url: `${BASE_PATH}lampe-1.jpg`, answers: ["lampe", "lamp"], difficulty: "easy" },
    { url: `${BASE_PATH}lampe-2.jpg`, answers: ["lampe", "lamp"], difficulty: "easy" },
    // Stol
    { url: `${BASE_PATH}stol-1.jpg`, answers: ["stol", "chair"], difficulty: "easy" },
    { url: `${BASE_PATH}stol-2.jpg`, answers: ["stol", "chair"], difficulty: "easy" },
    // Paraply
    { url: `${BASE_PATH}paraply-1.jpg`, answers: ["paraply", "umbrella"], difficulty: "easy" },
    // Pizza
    { url: `${BASE_PATH}pizza-1.jpg`, answers: ["pizza"], difficulty: "easy" },
    { url: `${BASE_PATH}pizza-2.jpg`, answers: ["pizza"], difficulty: "easy" },
    // Hamburger
    { url: `${BASE_PATH}hamburger-1.jpg`, answers: ["hamburger", "burger"], difficulty: "easy" },
    { url: `${BASE_PATH}hamburger-2.jpg`, answers: ["hamburger", "burger"], difficulty: "easy" },
    // --- ENDA FLERE TING ---
    // MUSIKKINSTRUMENTER
    // Fiolin
    { url: `${BASE_PATH}fiolin-1.jpg`, answers: ["fiolin", "violin"], difficulty: "medium" },
    { url: `${BASE_PATH}fiolin-2.jpg`, answers: ["fiolin", "violin"], difficulty: "medium" },
    // Trompet
    { url: `${BASE_PATH}trompet-1.jpg`, answers: ["trompet", "trumpet"], difficulty: "medium" },
    // Saksofon
    { url: `${BASE_PATH}saksofon-1.jpg`, answers: ["saksofon", "saxophone"], difficulty: "medium" },
    { url: `${BASE_PATH}saksofon-2.jpg`, answers: ["saksofon", "saxophone"], difficulty: "medium" },
    // Mikrofon
    { url: `${BASE_PATH}mikrofon-1.jpg`, answers: ["mikrofon", "microphone"], difficulty: "easy" },
    { url: `${BASE_PATH}mikrofon-2.jpg`, answers: ["mikrofon", "microphone"], difficulty: "easy" },
    // SPORT
    // Tennis
    { url: `${BASE_PATH}tennis-1.jpg`, answers: ["tennis", "tennisracket"], difficulty: "easy" },
    // Golf
    { url: `${BASE_PATH}golf-1.jpg`, answers: ["golf", "golfkølle"], difficulty: "medium" },
    // Ski
    { url: `${BASE_PATH}ski-1.jpg`, answers: ["ski"], difficulty: "easy" },
    { url: `${BASE_PATH}ski-2.jpg`, answers: ["ski"], difficulty: "easy" },
    // Surfebrett
    { url: `${BASE_PATH}surf-1.jpg`, answers: ["surfebrett", "surfboard", "surf"], difficulty: "medium" },
    // Boksehansker
    { url: `${BASE_PATH}boksehansker-1.jpg`, answers: ["boksehansker", "boxing gloves"], difficulty: "medium" },
    // UVENTEDE TING
    // Terning
    { url: `${BASE_PATH}terning-1.jpg`, answers: ["terning", "dice"], difficulty: "easy" },
    // Ballonger
    { url: `${BASE_PATH}ballonger-1.jpg`, answers: ["ballonger", "balloon"], difficulty: "easy" },
    { url: `${BASE_PATH}ballonger-2.jpg`, answers: ["ballonger", "balloon"], difficulty: "easy" },
    // Kake
    { url: `${BASE_PATH}kake-1.jpg`, answers: ["kake", "cake"], difficulty: "easy" },
    { url: `${BASE_PATH}kake-2.jpg`, answers: ["kake", "cake"], difficulty: "easy" },
    // Sjokolade
    { url: `${BASE_PATH}sjokolade-1.jpg`, answers: ["sjokolade", "chocolate"], difficulty: "easy" },
    { url: `${BASE_PATH}sjokolade-2.jpg`, answers: ["sjokolade", "chocolate"], difficulty: "easy" },
    // Popcorn
    { url: `${BASE_PATH}popcorn-1.jpg`, answers: ["popcorn"], difficulty: "easy" },
    // Donut
    { url: `${BASE_PATH}donut-1.jpg`, answers: ["donut", "smultring"], difficulty: "easy" },
    { url: `${BASE_PATH}donut-2.jpg`, answers: ["donut", "smultring"], difficulty: "easy" },
    // Taco
    { url: `${BASE_PATH}taco-1.jpg`, answers: ["taco"], difficulty: "easy" },
    // Sushi
    { url: `${BASE_PATH}sushi-1.jpg`, answers: ["sushi"], difficulty: "easy" },
    { url: `${BASE_PATH}sushi-2.jpg`, answers: ["sushi"], difficulty: "easy" },
    // Nøkler
    { url: `${BASE_PATH}nokler-1.jpg`, answers: ["nøkler", "keys"], difficulty: "easy" },
    // Kompass
    { url: `${BASE_PATH}kompass-1.jpg`, answers: ["kompass", "compass"], difficulty: "medium" },
    // Kikkert
    { url: `${BASE_PATH}kikkert-1.jpg`, answers: ["kikkert", "binoculars"], difficulty: "medium" },
    // Globus
    { url: `${BASE_PATH}globus-1.jpg`, answers: ["globus", "globe", "jordklode"], difficulty: "easy" },
    // Teddybjørn
    { url: `${BASE_PATH}teddybjorn-1.jpg`, answers: ["teddybjørn", "teddy bear", "bamse"], difficulty: "easy" },
    // Rubiks kube
    { url: `${BASE_PATH}rubiks-1.jpg`, answers: ["rubiks kube", "rubiks", "rubik"], difficulty: "easy" },
    // Spillkontroller
    { url: `${BASE_PATH}spillkontroller-1.jpg`, answers: ["spillkontroller", "controller", "joystick"], difficulty: "easy" },
    { url: `${BASE_PATH}spillkontroller-2.jpg`, answers: ["spillkontroller", "controller", "joystick"], difficulty: "easy" },
    // --- NYE ENKLE TING ---
    // Blyant
    { url: `${BASE_PATH}blyant-1.jpg`, answers: ["blyant", "pencil"], difficulty: "easy" },
    { url: `${BASE_PATH}blyant-2.jpg`, answers: ["blyant", "pencil"], difficulty: "easy" },
    // Penn
    { url: `${BASE_PATH}penn-1.jpg`, answers: ["penn", "kulepenn", "pen"], difficulty: "easy" },
    // Jordbær
    { url: `${BASE_PATH}jordbaer-1.jpg`, answers: ["jordbær", "strawberry"], difficulty: "easy" },
    { url: `${BASE_PATH}jordbaer-2.jpg`, answers: ["jordbær", "strawberry"], difficulty: "easy" },
    // Appelsin
    { url: `${BASE_PATH}appelsin-1.jpg`, answers: ["appelsin", "orange"], difficulty: "easy" },
    { url: `${BASE_PATH}appelsin-2.jpg`, answers: ["appelsin", "orange"], difficulty: "easy" },
    // Druer
    { url: `${BASE_PATH}druer-1.jpg`, answers: ["druer", "grapes", "vindrue"], difficulty: "easy" },
    // Croissant
    { url: `${BASE_PATH}croissant-1.jpg`, answers: ["croissant"], difficulty: "easy" },
    { url: `${BASE_PATH}croissant-2.jpg`, answers: ["croissant"], difficulty: "easy" },
    // Vaffel
    { url: `${BASE_PATH}vaffel-1.jpg`, answers: ["vaffel", "waffle"], difficulty: "easy" },
    // Pære
    { url: `${BASE_PATH}paere-1.jpg`, answers: ["pære", "pear"], difficulty: "easy" },
    // --- NYE MEDIUM TING ---
    // Motorsykkel
    { url: `${BASE_PATH}motorsykkel-1.jpg`, answers: ["motorsykkel", "motorcycle", "mc"], difficulty: "medium" },
    { url: `${BASE_PATH}motorsykkel-2.jpg`, answers: ["motorsykkel", "motorcycle", "mc"], difficulty: "medium" },
    // Tog
    { url: `${BASE_PATH}tog-1.jpg`, answers: ["tog", "train"], difficulty: "medium" },
    { url: `${BASE_PATH}tog-2.jpg`, answers: ["tog", "train"], difficulty: "medium" },
    // Fly
    { url: `${BASE_PATH}fly-1.jpg`, answers: ["fly", "airplane", "plane"], difficulty: "medium" },
    { url: `${BASE_PATH}fly-2.jpg`, answers: ["fly", "airplane", "plane"], difficulty: "medium" },
    // Båt
    { url: `${BASE_PATH}bat-1.jpg`, answers: ["båt", "boat", "skip"], difficulty: "medium" },
    { url: `${BASE_PATH}bat-2.jpg`, answers: ["båt", "boat", "skip"], difficulty: "medium" },
    // Vekkerklokke
    { url: `${BASE_PATH}vekkerklokke-1.jpg`, answers: ["vekkerklokke", "alarm clock", "alarm"], difficulty: "medium" },
    // --- NYE VANSKELIGE TING ---
    // Mikroskop
    { url: `${BASE_PATH}mikroskop-1.jpg`, answers: ["mikroskop", "microscope"], difficulty: "hard" },
    // Maracas
    { url: `${BASE_PATH}maracas-1.jpg`, answers: ["maracas"], difficulty: "hard" },
    // Harpe
    { url: `${BASE_PATH}harpe-1.jpg`, answers: ["harpe", "harp"], difficulty: "hard" },
    // Klarinett
    { url: `${BASE_PATH}klarinett-1.jpg`, answers: ["klarinett", "clarinet"], difficulty: "hard" },
    // --- ENDA FLERE TING ---
    // Munnharpe
    { url: `${BASE_PATH}munnharpe-1.jpg`, answers: ["munnharpe", "jaw harp", "munnspill"] },
    // Tuba
    { url: `${BASE_PATH}tuba-1.jpg`, answers: ["tuba"] },
    // Viskelær
    { url: `${BASE_PATH}viskelaer-1.jpg`, answers: ["viskelær", "eraser"] },
    // Ananas
    { url: `${BASE_PATH}ananas-1.jpg`, answers: ["ananas", "pineapple"] },
    { url: `${BASE_PATH}ananas-2.jpg`, answers: ["ananas", "pineapple"] },
    // Kiwi
    { url: `${BASE_PATH}kiwi-1.jpg`, answers: ["kiwi"] },
    // Tomat
    { url: `${BASE_PATH}tomat-1.jpg`, answers: ["tomat", "tomato"] },
    // Blåbær
    { url: `${BASE_PATH}blabaer-1.jpg`, answers: ["blåbær", "blueberry"] },
    // Bringebær
    { url: `${BASE_PATH}bringebaer-1.jpg`, answers: ["bringebær", "raspberry"] },
    // Gulrot
    { url: `${BASE_PATH}gulrot-1.jpg`, answers: ["gulrot", "carrot"] },
    { url: `${BASE_PATH}gulrot-2.jpg`, answers: ["gulrot", "carrot"] },
    // Paprika
    { url: `${BASE_PATH}paprika-1.jpg`, answers: ["paprika", "bell pepper"] },
    // Chili
    { url: `${BASE_PATH}chili-1.jpg`, answers: ["chili", "chili pepper"] },
    // Spaghetti
    { url: `${BASE_PATH}spaghetti-1.jpg`, answers: ["spaghetti", "pasta"] },
    // Egg
    { url: `${BASE_PATH}egg-1.jpg`, answers: ["egg"] },
    { url: `${BASE_PATH}egg-2.jpg`, answers: ["egg"] },
    // Tuba
    { url: `${BASE_PATH}tuba-2.jpg`, answers: ["tuba"] },
    // Trekkspill
    { url: `${BASE_PATH}trekkspill-1.jpg`, answers: ["trekkspill", "accordion"] },
    // Pannekake
    { url: `${BASE_PATH}pannekake-1.jpg`, answers: ["pannekake", "pancake"] },
    { url: `${BASE_PATH}pannekake-2.jpg`, answers: ["pannekake", "pancake"] },
    // Månen
    { url: `${BASE_PATH}manen-1.jpg`, answers: ["månen", "måne", "moon"] },
    { url: `${BASE_PATH}manen-2.jpg`, answers: ["månen", "måne", "moon"] },
    // Hoppetau
    { url: `${BASE_PATH}hoppetau-1.jpg`, answers: ["hoppetau", "jump rope"] },
    // Ishockey
    { url: `${BASE_PATH}ishockey-1.jpg`, answers: ["ishockey", "hockey"] },
    { url: `${BASE_PATH}ishockey-2.jpg`, answers: ["ishockey", "hockey"] },
    // Tyggegummi
    { url: `${BASE_PATH}tyggegummi-1.jpg`, answers: ["tyggegummi", "bubblegum", "gum"] },
  ],

  personer: [
    // Superhelter
    { url: `${BASE_PATH}superman-1.jpg`, answers: ["superman", "supermann"] },
    { url: `${BASE_PATH}batman-1.jpg`, answers: ["batman"] },
    { url: `${BASE_PATH}spiderman-1.jpg`, answers: ["spider-man", "spiderman", "edderkopp-mannen"] },
    { url: `${BASE_PATH}hulken-1.jpg`, answers: ["hulken", "hulk"] },
    { url: `${BASE_PATH}captain-america-1.jpg`, answers: ["captain america", "kaptein amerika"] },
    { url: `${BASE_PATH}iron-man-1.jpg`, answers: ["iron man", "jernmannen"] },
    { url: `${BASE_PATH}wonder-woman-1.jpg`, answers: ["wonder woman"] },
    { url: `${BASE_PATH}thor-1.jpg`, answers: ["thor"] },
    // Kunstnere
    { url: `${BASE_PATH}mona-lisa-1.jpg`, answers: ["mona lisa", "leonardo da vinci"] },
    { url: `${BASE_PATH}van-gogh-1.jpg`, answers: ["van gogh", "vincent van gogh", "stjernenatten"] },
    { url: `${BASE_PATH}skrik-1.jpg`, answers: ["skrik", "edvard munch", "munch"] },
    // Astronauter
    { url: `${BASE_PATH}astronaut-1.jpg`, answers: ["astronaut", "romfarer"] },
    // Musiker-ikoner
    { url: `${BASE_PATH}elvis-1.jpg`, answers: ["elvis", "elvis presley"] },
    { url: `${BASE_PATH}beatles-1.jpg`, answers: ["beatles", "the beatles"] },
    { url: `${BASE_PATH}michael-jackson-1.jpg`, answers: ["michael jackson"] },
    // Fotballspillere
    { url: `${BASE_PATH}messi-1.jpg`, answers: ["messi", "lionel messi"] },
    { url: `${BASE_PATH}ronaldo-1.jpg`, answers: ["ronaldo", "cristiano ronaldo"] },
    { url: `${BASE_PATH}haaland-1.jpg`, answers: ["haaland", "erling haaland", "erling braut haaland"] },
    // Tegneseriefigurer (statuer/installasjoner)
    { url: `${BASE_PATH}mikke-mus-1.jpg`, answers: ["mikke mus", "mickey mouse", "disney"] },
    // Historiske figurer
    { url: `${BASE_PATH}napoleon-1.jpg`, answers: ["napoleon", "napoleon bonaparte"] },
    // Moderne ikoner
    { url: `${BASE_PATH}charlie-chaplin-1.jpg`, answers: ["charlie chaplin", "chaplin"] },
  ],
};

// Hent bilder basert på kategori
export function getImages(category) {
  let images = [];

  if (category === 'blanding') {
    images = [...IMAGES.dyr, ...IMAGES.steder, ...IMAGES.ting, ...IMAGES.personer];
  } else if (IMAGES[category]) {
    images = IMAGES[category];
  } else {
    return [];
  }

  return images;
}

// Beregn Levenshtein-avstand (antall endringer for å gjøre to strenger like)
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

// Sjekk om svaret er riktig (med toleranse for skrivefeil)
export function checkAnswer(userAnswer, correctAnswers) {
  const normalized = userAnswer.toLowerCase().trim();
  if (!normalized) return false;

  return correctAnswers.some(answer => {
    const correct = answer.toLowerCase();

    // Eksakt match
    if (correct === normalized) return true;

    // Inneholder hverandre
    if (correct.includes(normalized) || normalized.includes(correct)) return true;

    // Tillat skrivefeil basert på ordlengde
    // Korte ord (1-4 tegn): 1 feil tillatt
    // Medium ord (5-8 tegn): 2 feil tillatt
    // Lange ord (9+ tegn): 3 feil tillatt
    const maxDistance = correct.length <= 4 ? 1 : correct.length <= 8 ? 2 : 3;
    const distance = levenshteinDistance(normalized, correct);

    return distance <= maxDistance;
  });
}

export default IMAGES;
