// Tidslinje - Historiske hendelser å sortere
// Omfattende samling fra ulike epoker og temaer

const EVENT_PACKS = {
  ALLMENN_HISTORIE: {
    id: 'allmenn-historie',
    name: 'Allmenn historie',
    events: [
      { id: 'pyramider', text: 'Pyramidene i Egypt bygges', year: -2500 },
      { id: 'kristi-fodsel', text: 'Kristi fødsel', year: 0 },
      { id: 'vestromerske-fall', text: 'Det vestromerske riket faller', year: 476 },
      { id: 'vikingtid-start', text: 'Vikingtiden begynner', year: 793 },
      { id: 'harald-harfagre', text: 'Harald Hårfagre samler Norge', year: 872 },
      { id: 'kristendom-norge', text: 'Kristendommen innføres i Norge', year: 1000 },
      { id: 'stiklestad', text: 'Slaget på Stiklestad', year: 1030 },
      { id: 'forste-korstog', text: 'Første korstog', year: 1095 },
      { id: 'svartedauden-norge', text: 'Svartedauden kom til Norge', year: 1349 },
      { id: 'union-danmark', text: 'Den norske union med Danmark begynner', year: 1380 },
      { id: 'boktrykk', text: 'Gutenberg finner opp boktrykkerkunsten', year: 1440 },
      { id: 'columbus', text: 'Columbus "oppdager" Amerika', year: 1492 },
      { id: 'mona-lisa', text: 'Leonardo da Vinci maler Mona Lisa', year: 1503 },
      { id: 'magellan', text: 'Magellan starter første verdensomseiling', year: 1519 },
      { id: 'shakespeare-dod', text: 'Shakespeares død', year: 1616 },
      { id: 'principia', text: 'Isaac Newton publiserer Principia', year: 1687 },
      { id: 'franske-rev', text: 'Den franske revolusjon begynner', year: 1789 },
      { id: 'grunnlov-1814', text: 'Norge får egen grunnlov på Eidsvoll', year: 1814 },
      { id: 'waterloo', text: 'Napoleon tapte ved Waterloo', year: 1815 },
      { id: 'forste-jernbane', text: 'Den første jernbanen åpnes', year: 1825 },
      { id: 'darwin', text: 'Darwin publiserer Om artenes opprinnelse', year: 1859 },
      { id: 'telefon', text: 'Alexander Graham Bell finner opp telefonen', year: 1876 },
      { id: 'lyspere', text: 'Edison finner opp lyspæra', year: 1879 },
      { id: 'eiffel', text: 'Eiffeltårnet bygges', year: 1889 },
      { id: 'wright', text: 'Brødrene Wright flyr første gang', year: 1903 },
      { id: 'union-opplost', text: 'Union med Sverige oppløses', year: 1905 },
      { id: 'amundsen-sydpolen', text: 'Roald Amundsen når Sydpolen', year: 1911 },
      { id: 'titanic', text: 'Titanic synker', year: 1912 },
      { id: 'stemmerett-kvinner', text: 'Kvinner får stemmerett i Norge', year: 1913 },
      { id: 'ww1-start', text: 'Første verdenskrig begynner', year: 1914 },
      { id: 'ww1-slutt', text: 'Første verdenskrig slutter', year: 1918 },
      { id: 'penicillin', text: 'Alexander Fleming oppdager penicillin', year: 1928 },
      { id: 'borsfall', text: 'Børskrakket på Wall Street', year: 1929 },
      { id: 'hitler-makt', text: 'Hitler kommer til makten i Tyskland', year: 1933 },
      { id: 'ww2-start', text: 'Andre verdenskrig begynner', year: 1939 },
      { id: 'norge-okkupert', text: 'Tyskland invaderer Norge', year: 1940 },
      { id: 'pearl-harbor', text: 'Japan angriper Pearl Harbor', year: 1941 },
      { id: 'd-dag', text: 'D-dagen: Normandie-landgangen', year: 1944 },
      { id: 'hiroshima', text: 'Atombomber slippes over Japan', year: 1945 },
      { id: 'ww2-slutt', text: 'Andre verdenskrig slutter', year: 1945 },
      { id: 'fn', text: 'FN etableres', year: 1945 },
      { id: 'israel', text: 'Israel etableres som stat', year: 1948 },
      { id: 'nato', text: 'NATO etableres', year: 1949 },
      { id: 'koreakrig', text: 'Korean-krigen begynner', year: 1950 },
      { id: 'dna', text: 'DNA-strukturen oppdages', year: 1953 },
      { id: 'sputnik', text: 'Sputnik sendes opp', year: 1957 },
      { id: 'berlinmur-opp', text: 'Berlinmuren bygges', year: 1961 },
      { id: 'jfk-skutt', text: 'John F. Kennedy skutt', year: 1963 },
      { id: 'mlk-tale', text: 'Martin Luther King holder I have a dream-talen', year: 1963 },
      { id: 'manen', text: 'Neil Armstrong går på månen', year: 1969 },
      { id: 'olje-nordsjoen', text: 'Olje oppdages i Nordsjøen', year: 1969 },
      { id: 'vietnam-slutt', text: 'Vietnam-krigen slutter', year: 1975 },
      { id: 'apple', text: 'Apple lanserer første datamaskin', year: 1976 },
      { id: 'tsjernobyl', text: 'Tsjernobyl-ulykken', year: 1986 },
      { id: 'berlinmur-ned', text: 'Berlinmuren faller', year: 1989 },
      { id: 'sovjet-oppløst', text: 'Sovjetunionen oppløses', year: 1991 },
      { id: 'www', text: 'Internett (www) oppfinnes', year: 1991 },
      { id: 'mandela', text: 'Nelson Mandela blir president i Sør-Afrika', year: 1994 },
      { id: 'ol-lillehammer', text: 'OL i Lillehammer', year: 1994 },
      { id: 'diana', text: 'Prinsesse Diana dør', year: 1997 },
      { id: '11-sept', text: 'Terrorangrepet 11. september', year: 2001 },
      { id: 'iphone', text: 'iPhone lanseres', year: 2007 },
      { id: 'obama', text: 'Barack Obama blir USAs president', year: 2009 },
      { id: '22-juli', text: '22. juli-angrepene', year: 2011 },
      { id: 'fb-milliard', text: 'Facebook når 1 milliard brukere', year: 2012 },
      { id: 'brexit', text: 'Brexit-avstemningen', year: 2016 },
      { id: 'trump-1', text: 'Donald Trump blir USAs president første gang', year: 2017 },
      { id: 'covid', text: 'COVID-19 pandemien begynner', year: 2020 },
      { id: 'biden', text: 'Joe Biden blir USAs president', year: 2021 }
    ]
  },

  WW2: {
    id: 'ww2',
    name: '2. verdenskrig',
    events: [
      { id: 'ww2-polen', text: 'Tyskland invaderer Polen', year: 1939, month: 9 },
      { id: 'ww2-storbritannia-krig', text: 'Storbritannia og Frankrike erklærer krig', year: 1939, month: 9 },
      { id: 'ww2-vinterkrig', text: 'Vinterkrigen starter (Finland-Sovjet)', year: 1939, month: 11 },
      { id: 'ww2-norge-inv', text: 'Tyskland invaderer Norge', year: 1940, month: 4 },
      { id: 'ww2-frankrike-inv', text: 'Tyskland invaderer Frankrike', year: 1940, month: 5 },
      { id: 'ww2-dunkirk', text: 'Evakueringen fra Dunkirk', year: 1940, month: 5 },
      { id: 'ww2-italia-krig', text: 'Italia erklærer krig', year: 1940, month: 6 },
      { id: 'ww2-frankrike-kap', text: 'Frankrike kapitulerer', year: 1940, month: 6 },
      { id: 'ww2-konge-london', text: 'Norges konge flykter til London', year: 1940, month: 6 },
      { id: 'ww2-luftslag', text: 'Luftslaget om Storbritannia', year: 1940, month: 7 },
      { id: 'ww2-aksen', text: 'Tyskland og Italia danner Aksen', year: 1940, month: 9 },
      { id: 'ww2-barbarossa', text: 'Tyskland invaderer Sovjetunionen', year: 1941, month: 6 },
      { id: 'ww2-leningrad', text: 'Beleiringen av Leningrad begynner', year: 1941, month: 9 },
      { id: 'ww2-pearl', text: 'Japan angriper Pearl Harbor', year: 1941, month: 12 },
      { id: 'ww2-usa-krig', text: 'USA erklærer krig mot Japan', year: 1941, month: 12 },
      { id: 'ww2-stalingrad', text: 'Tyske styrker kapitulerer i Stalingrad', year: 1943, month: 2 },
      { id: 'ww2-italia-kap', text: 'Italia kapitulerer', year: 1943, month: 9 },
      { id: 'ww2-ddag', text: 'D-dagen: Landgangen i Normandie', year: 1944, month: 6 },
      { id: 'ww2-anne-frank', text: 'Anne Frank arresteres', year: 1944, month: 8 },
      { id: 'ww2-paris', text: 'Paris befris', year: 1944, month: 8 },
      { id: 'ww2-ardenner', text: 'Ardenneroffensiven begynner', year: 1944, month: 12 },
      { id: 'ww2-auschwitz', text: 'Auschwitz befris av sovjetiske styrker', year: 1945, month: 1 },
      { id: 'ww2-roosevelt', text: 'President Roosevelt dør', year: 1945, month: 4 },
      { id: 'ww2-berlin', text: 'Den røde armé når Berlin', year: 1945, month: 4 },
      { id: 'ww2-hitler', text: 'Hitler begår selvmord', year: 1945, month: 4 },
      { id: 'ww2-tyskland-kap', text: 'Tyskland kapitulerer', year: 1945, month: 5 },
      { id: 'ww2-frigjoring', text: 'Frigjøringsdagen i Norge', year: 1945, month: 5 },
      { id: 'ww2-hiroshima', text: 'Atombomben over Hiroshima', year: 1945, month: 8 },
      { id: 'ww2-nagasaki', text: 'Atombomben over Nagasaki', year: 1945, month: 8 },
      { id: 'ww2-japan-kap', text: 'Japan kapitulerer', year: 1945, month: 8 },
      { id: 'ww2-nurnberg', text: 'Nürnberg-rettsakene begynner', year: 1945, month: 11 }
    ]
  },

  COLD_WAR: {
    id: 'kalde-krigen',
    name: 'Den kalde krigen',
    events: [
      { id: 'cw-truman', text: 'Truman-doktrinen kunngjøres', year: 1947 },
      { id: 'cw-marshall', text: 'Marshall-planen kunngjøres', year: 1947 },
      { id: 'cw-india', text: 'India blir uavhengig', year: 1947 },
      { id: 'cw-berlinblokade', text: 'Berlinblokaden starter', year: 1948 },
      { id: 'cw-kina', text: 'Folkerepublikken Kina utropes', year: 1949 },
      { id: 'cw-nato', text: 'NATO etableres', year: 1949 },
      { id: 'cw-sovjet-atom', text: 'Sovjetunionen tester atombombe', year: 1949 },
      { id: 'cw-korea-start', text: 'Koreakrigen bryter ut', year: 1950 },
      { id: 'cw-korea-slutt', text: 'Koreakrigen avsluttes', year: 1953 },
      { id: 'cw-rosa-parks', text: 'Rosa Parks nekter å gi fra seg setet', year: 1955 },
      { id: 'cw-warsaw', text: 'Warsawapakten opprettes', year: 1955 },
      { id: 'cw-nasa', text: 'NASA opprettes', year: 1958 },
      { id: 'cw-cuba-castro', text: 'Fidel Castro tar makten på Cuba', year: 1959 },
      { id: 'cw-gagarin', text: 'Jurij Gagarin i rommet', year: 1961 },
      { id: 'cw-berlinmur', text: 'Berlinmuren bygges', year: 1961 },
      { id: 'cw-cubakrisen', text: 'Cubakrisen', year: 1962 },
      { id: 'cw-jfk', text: 'President Kennedy skutt', year: 1963 },
      { id: 'cw-seksdager', text: 'Seks-dagerskrigen', year: 1967 },
      { id: 'cw-mlk', text: 'Martin Luther King Jr. skutt', year: 1968 },
      { id: 'cw-rfk', text: 'Robert F. Kennedy skutt', year: 1968 },
      { id: 'cw-manen', text: 'Første månelanding', year: 1969 },
      { id: 'cw-woodstock', text: 'Woodstock-festivalen', year: 1969 },
      { id: 'cw-yom-kippur', text: 'Yom Kippur-krigen', year: 1973 },
      { id: 'cw-vietnam-slutt', text: 'Vietnamkrigen avsluttes', year: 1975 },
      { id: 'cw-lennon', text: 'John Lennon skutt', year: 1980 },
      { id: 'cw-gorbatsjov', text: 'Gorbatsjov blir leder av Sovjet', year: 1985 },
      { id: 'cw-tsjernobyl', text: 'Tsjernobyl-ulykken', year: 1986 },
      { id: 'cw-mur-faller', text: 'Berlinmuren faller', year: 1989 },
      { id: 'cw-floyel', text: 'Fløyelrevolusjonen i Tsjekkoslovakia', year: 1989 },
      { id: 'cw-mandela-fri', text: 'Mandela løslates fra fengsel', year: 1990 },
      { id: 'cw-gjenforening', text: 'Tyskland gjenforenes', year: 1990 },
      { id: 'cw-gulf', text: 'Gulfkrigen begynner', year: 1991 },
      { id: 'cw-jugoslavia', text: 'Jugoslavia oppløses', year: 1991 },
      { id: 'cw-jeltsin', text: 'Boris Jeltsin blir president', year: 1991 },
      { id: 'cw-sovjet-slutt', text: 'Sovjetunionen oppløses', year: 1991 }
    ]
  },

  POST_2000: {
    id: 'etter-2000',
    name: 'Etter år 2000',
    events: [
      { id: 'p2k-putin', text: 'Putin blir president i Russland', year: 2000 },
      { id: 'p2k-ps2', text: 'PlayStation 2 lanseres i Europa', year: 2000 },
      { id: 'p2k-wikipedia', text: 'Wikipedia lanseres', year: 2001 },
      { id: 'p2k-911', text: 'Terrorangrepet 11. september', year: 2001 },
      { id: 'p2k-euro', text: 'Euroen innføres', year: 2002 },
      { id: 'p2k-irak', text: 'Irak-krigen begynner', year: 2003 },
      { id: 'p2k-facebook', text: 'Facebook lanseres', year: 2004 },
      { id: 'p2k-youtube', text: 'YouTube lanseres', year: 2005 },
      { id: 'p2k-katrina', text: 'Orkanen Katrina', year: 2005 },
      { id: 'p2k-twitter', text: 'Twitter lanseres', year: 2006 },
      { id: 'p2k-roblox', text: 'Roblox lanseres', year: 2006 },
      { id: 'p2k-iphone', text: 'iPhone lanseres', year: 2007 },
      { id: 'p2k-spotify', text: 'Spotify lanseres', year: 2008 },
      { id: 'p2k-obama', text: 'Barack Obama blir president', year: 2009 },
      { id: 'p2k-minecraft', text: 'Minecraft lanseres', year: 2009 },
      { id: 'p2k-ipad', text: 'iPad lanseres', year: 2010 },
      { id: 'p2k-arab', text: 'Den arabiske våren begynner', year: 2010 },
      { id: 'p2k-bin-laden', text: 'Osama bin Laden drept', year: 2011 },
      { id: 'p2k-22juli', text: '22. juli-angrepene i Norge', year: 2011 },
      { id: 'p2k-london-ol', text: 'OL i London', year: 2012 },
      { id: 'p2k-snowden', text: 'Edward Snowden lekker NSA-dokumenter', year: 2013 },
      { id: 'p2k-ps4', text: 'PlayStation 4 lanseres', year: 2013 },
      { id: 'p2k-carlsen', text: 'Magnus Carlsen blir verdensmester i sjakk', year: 2013 },
      { id: 'p2k-mandela-dod', text: 'Nelson Mandela dør', year: 2013 },
      { id: 'p2k-krim', text: 'Russland annekterer Krim', year: 2014 },
      { id: 'p2k-is', text: 'IS utroper kalifat', year: 2014 },
      { id: 'p2k-charlie', text: 'Charlie Hebdo-angrepet', year: 2015 },
      { id: 'p2k-odegaard', text: 'Martin Ødegaard i Real Madrid', year: 2015 },
      { id: 'p2k-pokemon-go', text: 'Pokémon GO lanseres', year: 2016 },
      { id: 'p2k-brexit', text: 'Brexit-avstemningen', year: 2016 },
      { id: 'p2k-trump', text: 'Donald Trump velges til president', year: 2016 },
      { id: 'p2k-castro-dod', text: 'Fidel Castro dør', year: 2016 },
      { id: 'p2k-fortnite', text: 'Fortnite Battle Royale lanseres', year: 2017 },
      { id: 'p2k-metoo', text: 'MeToo-bevegelsen tar fart', year: 2017 },
      { id: 'p2k-hawking', text: 'Stephen Hawking dør', year: 2018 },
      { id: 'p2k-tiktok', text: 'TikTok blir verdens mest nedlastede app', year: 2020 },
      { id: 'p2k-covid', text: 'COVID-19 pandemien begynner', year: 2020 },
      { id: 'p2k-george-floyd', text: 'George Floyd-protestene', year: 2020 },
      { id: 'p2k-biden', text: 'Joe Biden velges til president', year: 2020 },
      { id: 'p2k-capitol', text: 'Stormingen av Capitol Hill', year: 2021 },
      { id: 'p2k-warholm', text: 'Warholm setter verdensrekord 400m hekk', year: 2021 },
      { id: 'p2k-tokyo-ol', text: 'OL i Tokyo', year: 2021 },
      { id: 'p2k-meta', text: 'Facebook endrer navn til Meta', year: 2021 },
      { id: 'p2k-taliban', text: 'Taliban tar kontroll over Afghanistan', year: 2021 },
      { id: 'p2k-ukraina', text: 'Russlands invasjon av Ukraina', year: 2022 },
      { id: 'p2k-queen', text: 'Dronning Elizabeth II dør', year: 2022 },
      { id: 'p2k-messi-vm', text: 'Messi vinner VM med Argentina', year: 2022 },
      { id: 'p2k-musk-twitter', text: 'Elon Musk kjøper Twitter', year: 2022 },
      { id: 'p2k-chatgpt', text: 'ChatGPT lanseres', year: 2022 },
      { id: 'p2k-hamas', text: 'Hamas-angrepet på Israel', year: 2023 },
      { id: 'p2k-paris-ol', text: 'OL i Paris', year: 2024 }
    ]
  },

  SPORT: {
    id: 'sport',
    name: 'Sportshistorie',
    events: [
      { id: 'sp-ol-modern', text: 'Første moderne OL i Athen', year: 1896 },
      { id: 'sp-tour', text: 'Første Tour de France', year: 1903 },
      { id: 'sp-vm-fotball', text: 'Første VM i fotball', year: 1930 },
      { id: 'sp-owens', text: 'Jesse Owens vinner 4 gull i Berlin-OL', year: 1936 },
      { id: 'sp-jackie', text: 'Jackie Robinson bryter farrebarrieren', year: 1947 },
      { id: 'sp-bannister', text: 'Roger Bannister løper mila under 4 min', year: 1954 },
      { id: 'sp-pele', text: 'Pelé vinner VM (17 år gammel)', year: 1958 },
      { id: 'sp-wilt', text: 'Wilt Chamberlain scorer 100 poeng', year: 1962 },
      { id: 'sp-ali', text: 'Muhammed Ali vinner tungvektstittel', year: 1964 },
      { id: 'sp-superbowl', text: 'Første Super Bowl spilles', year: 1967 },
      { id: 'sp-nadia', text: 'Nadia Comăneci får perfekt 10', year: 1976 },
      { id: 'sp-borg', text: 'Bjørn Borg vinner 5. Wimbledon', year: 1980 },
      { id: 'sp-miracle', text: 'Miracle on Ice - USA slår Sovjet', year: 1980 },
      { id: 'sp-maradona', text: 'Maradona og Guds hånd', year: 1986 },
      { id: 'sp-tyson', text: 'Tyson blir yngste tungvektsmester', year: 1986 },
      { id: 'sp-jordan', text: 'Michael Jordan vinner første NBA-tittel', year: 1991 },
      { id: 'sp-dream-team', text: 'Dream Team vinner OL-gull', year: 1992 },
      { id: 'sp-lillehammer', text: 'OL i Lillehammer', year: 1994 },
      { id: 'sp-koss', text: 'Johan Olav Koss vinner 3 gull', year: 1994 },
      { id: 'sp-tiger', text: 'Tiger Woods vinner Masters (21 år)', year: 1997 },
      { id: 'sp-zidane', text: 'Zidanes headbutt i VM-finalen', year: 2006 },
      { id: 'sp-bolt', text: 'Usain Bolt setter verdensrekord 100m', year: 2009 },
      { id: 'sp-carlsen', text: 'Magnus Carlsen blir sjakkverdensmester', year: 2013 },
      { id: 'sp-bjorndalen', text: 'Bjørndalen - tidenes vinterolympier', year: 2014 },
      { id: 'sp-leicester', text: 'Leicester City vinner Premier League', year: 2016 },
      { id: 'sp-liverpool', text: 'Liverpool vinner Champions League', year: 2019 },
      { id: 'sp-haaland', text: 'Haaland scorer 9 mål i U20-kamp', year: 2019 },
      { id: 'sp-maradona-dod', text: 'Diego Maradona dør', year: 2020 },
      { id: 'sp-warholm', text: 'Karsten Warholm verdensrekord', year: 2021 },
      { id: 'sp-messi-vm', text: 'Lionel Messi vinner VM', year: 2022 }
    ]
  },

  MUSIKK: {
    id: 'musikk',
    name: 'Musikkhistorie',
    events: [
      { id: 'mu-mozart', text: 'Mozart blir født', year: 1756 },
      { id: 'mu-beethoven', text: 'Beethoven blir født', year: 1770 },
      { id: 'mu-grieg', text: 'Edvard Grieg blir født', year: 1843 },
      { id: 'mu-armstrong', text: 'Louis Armstrong gjør første opptak', year: 1923 },
      { id: 'mu-elvis-fodt', text: 'Elvis Presley blir født', year: 1935 },
      { id: 'mu-chuck', text: 'Chuck Berry Johnny B. Goode', year: 1958 },
      { id: 'mu-beatles-dannet', text: 'The Beatles dannes', year: 1960 },
      { id: 'mu-dylan', text: 'Bob Dylan Blowin in the Wind', year: 1962 },
      { id: 'mu-stones', text: 'The Rolling Stones dannes', year: 1962 },
      { id: 'mu-sgt-pepper', text: 'The Beatles Sgt. Peppers', year: 1967 },
      { id: 'mu-hendrix', text: 'Jimi Hendrix Purple Haze', year: 1967 },
      { id: 'mu-woodstock', text: 'Woodstock-festivalen', year: 1969 },
      { id: 'mu-beatles-slutt', text: 'The Beatles splittes', year: 1970 },
      { id: 'mu-stairway', text: 'Led Zeppelin Stairway to Heaven', year: 1971 },
      { id: 'mu-abba', text: 'ABBA vinner Eurovision med Waterloo', year: 1974 },
      { id: 'mu-bohemian', text: 'Queen Bohemian Rhapsody', year: 1975 },
      { id: 'mu-punk', text: 'Sex Pistols Anarchy in the UK', year: 1976 },
      { id: 'mu-elvis-dod', text: 'Elvis Presley dør', year: 1977 },
      { id: 'mu-mtv', text: 'MTV lanseres', year: 1981 },
      { id: 'mu-thriller', text: 'Michael Jackson Thriller', year: 1982 },
      { id: 'mu-madonna', text: 'Madonna Like a Virgin', year: 1984 },
      { id: 'mu-live-aid', text: 'Live Aid-konserten', year: 1985 },
      { id: 'mu-aha', text: 'a-ha Take On Me', year: 1985 },
      { id: 'mu-nwa', text: 'N.W.A. Straight Outta Compton', year: 1988 },
      { id: 'mu-nirvana', text: 'Nirvana Nevermind', year: 1991 },
      { id: 'mu-cobain', text: 'Kurt Cobain dør', year: 1994 },
      { id: 'mu-oasis', text: 'Oasis Wonderwall', year: 1995 },
      { id: 'mu-spice', text: 'Spice Girls Wannabe', year: 1996 },
      { id: 'mu-napster', text: 'Napster lanseres', year: 1999 },
      { id: 'mu-ipod', text: 'iPod lanseres', year: 2001 },
      { id: 'mu-spotify', text: 'Spotify lanseres', year: 2008 },
      { id: 'mu-mj-dod', text: 'Michael Jackson dør', year: 2009 },
      { id: 'mu-kygo', text: 'Kygo gjennombrudd med Firestone', year: 2014 },
      { id: 'mu-bowie', text: 'David Bowie dør', year: 2016 },
      { id: 'mu-avicii', text: 'Avicii dør', year: 2018 },
      { id: 'mu-billie', text: 'Billie Eilish vinner 5 Grammy', year: 2020 }
    ]
  },

  VITENSKAP: {
    id: 'vitenskap',
    name: 'Vitenskap og teknologi',
    events: [
      { id: 'vit-galileo', text: 'Galileo oppdager Jupiters måner', year: 1610 },
      { id: 'vit-newton', text: 'Newton publiserer Principia', year: 1687 },
      { id: 'vit-franklin', text: 'Franklin oppdager lynet er elektrisitet', year: 1752 },
      { id: 'vit-damp', text: 'Første dampmaskin', year: 1769 },
      { id: 'vit-vaksine', text: 'Første vaksine (kukopper)', year: 1796 },
      { id: 'vit-batteri', text: 'Første batteri oppfinnes', year: 1800 },
      { id: 'vit-darwin', text: 'Darwin publiserer evolusjonsteorien', year: 1859 },
      { id: 'vit-periode', text: 'Mendeleev lager periodesystemet', year: 1869 },
      { id: 'vit-telefon', text: 'Telefonen oppfinnes', year: 1876 },
      { id: 'vit-lyspere', text: 'Lyspæren oppfinnes', year: 1879 },
      { id: 'vit-rontgen', text: 'Røntgenstråler oppdages', year: 1895 },
      { id: 'vit-curie', text: 'Marie Curie oppdager radium', year: 1898 },
      { id: 'vit-fly', text: 'Wright-brødrene flyr', year: 1903 },
      { id: 'vit-einstein', text: 'Einsteins relativitetsteori', year: 1905 },
      { id: 'vit-penicillin', text: 'Fleming oppdager penicillin', year: 1928 },
      { id: 'vit-pluto', text: 'Pluto oppdages', year: 1930 },
      { id: 'vit-atom', text: 'Første atomspaltning', year: 1938 },
      { id: 'vit-eniac', text: 'Første datamaskin (ENIAC)', year: 1946 },
      { id: 'vit-transistor', text: 'Transistoren oppfinnes', year: 1947 },
      { id: 'vit-dna', text: 'DNA-strukturen oppdages', year: 1953 },
      { id: 'vit-sputnik', text: 'Sputnik sendes opp', year: 1957 },
      { id: 'vit-gagarin', text: 'Gagarin i rommet', year: 1961 },
      { id: 'vit-hjerte', text: 'Første hjertetransplantasjon', year: 1967 },
      { id: 'vit-manen', text: 'Apollo 11 på månen', year: 1969 },
      { id: 'vit-email', text: 'Første e-post sendes', year: 1971 },
      { id: 'vit-mri', text: 'MRI-scanneren oppfinnes', year: 1977 },
      { id: 'vit-provror', text: 'Første prøverørsbaby', year: 1978 },
      { id: 'vit-hiv', text: 'HIV-viruset identifiseres', year: 1983 },
      { id: 'vit-ozon', text: 'Ozonhullet oppdages', year: 1985 },
      { id: 'vit-www', text: 'World Wide Web oppfinnes', year: 1989 },
      { id: 'vit-hubble', text: 'Hubble-teleskopet sendes opp', year: 1990 },
      { id: 'vit-dolly', text: 'Sauen Dolly klones', year: 1996 },
      { id: 'vit-higgs', text: 'Higgs-partikkelen oppdages', year: 2012 },
      { id: 'vit-blackhole', text: 'Første bilde av svart hull', year: 2019 },
      { id: 'vit-covid-vax', text: 'COVID-19 vaksiner utvikles', year: 2020 },
      { id: 'vit-jwst', text: 'James Webb-teleskopet sendes opp', year: 2021 }
    ]
  },

  BARN: {
    id: 'barn',
    name: 'For barn (enklere)',
    events: [
      { id: 'ba-dino', text: 'Dinosaurene dør ut', year: -65000000 },
      { id: 'ba-pyramider', text: 'Pyramidene bygges', year: -2500 },
      { id: 'ba-jesus', text: 'Jesus blir født', year: 0 },
      { id: 'ba-viking', text: 'Vikingtiden begynner', year: 793 },
      { id: 'ba-columbus', text: 'Columbus reiser til Amerika', year: 1492 },
      { id: 'ba-jernbane', text: 'Første jernbane', year: 1825 },
      { id: 'ba-telefon', text: 'Telefonen oppfinnes', year: 1876 },
      { id: 'ba-lyspere', text: 'Lyspæren oppfinnes', year: 1879 },
      { id: 'ba-bil', text: 'Første bil lages', year: 1886 },
      { id: 'ba-fly', text: 'Første fly', year: 1903 },
      { id: 'ba-titanic', text: 'Titanic synker', year: 1912 },
      { id: 'ba-mickey', text: 'Mickey Mouse blir til', year: 1928 },
      { id: 'ba-donald', text: 'Donald Duck blir til', year: 1934 },
      { id: 'ba-ww2', text: 'Andre verdenskrig', year: 1939 },
      { id: 'ba-datamaskin', text: 'Første datamaskin', year: 1946 },
      { id: 'ba-lego', text: 'LEGO-klossen finnes opp', year: 1958 },
      { id: 'ba-tv-norge', text: 'Første TV-sending i Norge', year: 1960 },
      { id: 'ba-manen', text: 'Første menneske på månen', year: 1969 },
      { id: 'ba-mario', text: 'Super Mario blir til', year: 1985 },
      { id: 'ba-internett', text: 'Internett blir tilgjengelig', year: 1991 },
      { id: 'ba-lovenes', text: 'Løvenes konge på kino', year: 1994 },
      { id: 'ba-toy-story', text: 'Toy Story på kino', year: 1995 },
      { id: 'ba-pokemon', text: 'Pokémon lages', year: 1996 },
      { id: 'ba-harry', text: 'Første Harry Potter-bok', year: 1997 },
      { id: 'ba-google', text: 'Google startes', year: 1998 },
      { id: 'ba-youtube', text: 'YouTube startes', year: 2005 },
      { id: 'ba-roblox', text: 'Roblox lages', year: 2006 },
      { id: 'ba-minecraft', text: 'Minecraft lages', year: 2009 },
      { id: 'ba-frozen', text: 'Frost på kino', year: 2013 },
      { id: 'ba-fortnite', text: 'Fortnite lages', year: 2017 },
      { id: 'ba-tiktok', text: 'TikTok blir populært', year: 2018 },
      { id: 'ba-corona', text: 'Corona-pandemien', year: 2020 },
      { id: 'ba-chatgpt', text: 'ChatGPT lages', year: 2022 }
    ]
  }
};

// Konverter til event sets for bruk i spillet
function createEventSets() {
  const sets = [];

  for (const [key, pack] of Object.entries(EVENT_PACKS)) {
    // Del opp store pakker i mindre sett på 5 hendelser
    const events = [...pack.events];

    // Shuffle events først
    for (let i = events.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [events[i], events[j]] = [events[j], events[i]];
    }

    // Lag sett på 5 hendelser
    let setIndex = 1;
    for (let i = 0; i < events.length; i += 5) {
      const setEvents = events.slice(i, i + 5);
      if (setEvents.length >= 4) { // Minimum 4 hendelser
        // Sorter etter år for korrekt rekkefølge
        setEvents.sort((a, b) => a.year - b.year);

        sets.push({
          id: `${pack.id}-${setIndex}`,
          name: pack.name,
          category: key,
          events: setEvents
        });
        setIndex++;
      }
    }
  }

  return sets;
}

// Eksporter kategorier for UI
export const TIDSLINJE_CATEGORIES = [
  { id: 'blanding', name: 'Blanding', icon: '🎲', description: 'Tilfeldige hendelser' },
  { id: 'ALLMENN_HISTORIE', name: 'Allmenn historie', icon: '📜', description: 'Historiske hendelser' },
  { id: 'WW2', name: '2. verdenskrig', icon: '⚔️', description: 'Hendelser fra WW2' },
  { id: 'COLD_WAR', name: 'Den kalde krigen', icon: '🧊', description: 'Etter 1945' },
  { id: 'POST_2000', name: 'Etter 2000', icon: '📱', description: 'Moderne tid' },
  { id: 'SPORT', name: 'Sport', icon: '⚽', description: 'Sportshistorie' },
  { id: 'MUSIKK', name: 'Musikk', icon: '🎵', description: 'Musikkhistorie' },
  { id: 'VITENSKAP', name: 'Vitenskap', icon: '🔬', description: 'Vitenskapelige oppdagelser' },
  { id: 'BARN', name: 'For barn', icon: '🎮', description: 'Barnevennlige hendelser' }
];

// Cache event sets
let cachedEventSets = null;

// Få alle event sets (genereres på nytt ved hver kall for tilfeldighet)
export function getEventSets() {
  return createEventSets();
}

// Få et tilfeldig event set fra en spesifikk kategori
export function getRandomEventSet(usedSetIds = [], category = null) {
  const sets = createEventSets();

  // Filtrer på kategori hvis spesifisert (og ikke 'blanding')
  let filteredSets = sets;
  if (category && category !== 'blanding') {
    filteredSets = sets.filter(s => s.category === category);
  }

  // Filtrer ut brukte sett
  const availableSets = filteredSets.filter(s => !usedSetIds.includes(s.id));

  if (availableSets.length === 0) {
    // Hvis ingen tilgjengelige, velg fra alle i kategorien
    if (filteredSets.length > 0) {
      return filteredSets[Math.floor(Math.random() * filteredSets.length)];
    }
    return sets[Math.floor(Math.random() * sets.length)];
  }

  const selectedSet = availableSets[Math.floor(Math.random() * availableSets.length)];

  // For blanding-modus, skjul kategorinavnet
  if (category === 'blanding') {
    return {
      ...selectedSet,
      name: 'Blandet', // Vis ikke hvilken kategori
      hiddenCategory: selectedSet.name // Behold for debugging
    };
  }

  return selectedSet;
}

// Shuffle events (for player display)
export function shuffleEvents(events) {
  const shuffled = [...events];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Formater årstall for visning
export function formatYear(year) {
  if (year < 0) {
    return `${Math.abs(year).toLocaleString()} fvt.`;
  }
  return year.toString();
}

// Legacy export for bakoverkompatibilitet
const eventSets = createEventSets();
export default eventSets;
