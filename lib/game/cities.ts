// Curated catalog for the "Guess the City" loading-state mini-game.
// Each entry maps to a Pexels search query that's been hand-picked to bias
// toward the city's iconic landmark. The `fact` is a short trivia line
// (≤100 chars) shown after the user answers.

export interface GuessCity {
  id: string;
  name: string;
  country: string;
  countryCode: string; // ISO-3166-1 alpha-2
  pexelsQuery: string;
  fact: string;
  difficulty: "easy" | "medium" | "hard";
}

export const GUESS_CITIES: GuessCity[] = [
  // EASY — instantly recognizable landmarks
  { id: "paris",     name: "Paris",          country: "France",         countryCode: "FR", pexelsQuery: "Eiffel Tower Paris",                  fact: "The Eiffel Tower grows about 15 cm taller in summer due to thermal expansion.", difficulty: "easy" },
  { id: "rome",      name: "Rome",           country: "Italy",          countryCode: "IT", pexelsQuery: "Colosseum Rome",                      fact: "The Colosseum could hold up to 80,000 spectators in ancient Roman times.",      difficulty: "easy" },
  { id: "newyork",   name: "New York",       country: "USA",            countryCode: "US", pexelsQuery: "New York skyline Statue of Liberty",  fact: "The Statue of Liberty was a gift from France in 1886.",                         difficulty: "easy" },
  { id: "london",    name: "London",         country: "UK",             countryCode: "GB", pexelsQuery: "Big Ben London",                      fact: "Big Ben is the nickname for the bell, not the clock tower itself.",             difficulty: "easy" },
  { id: "tokyo",     name: "Tokyo",          country: "Japan",          countryCode: "JP", pexelsQuery: "Tokyo Shibuya crossing",              fact: "Shibuya Crossing handles up to 2,500 pedestrians per light cycle.",             difficulty: "easy" },
  { id: "sydney",    name: "Sydney",         country: "Australia",      countryCode: "AU", pexelsQuery: "Sydney Opera House",                  fact: "The Sydney Opera House has over one million roof tiles.",                       difficulty: "easy" },
  { id: "rio",       name: "Rio de Janeiro", country: "Brazil",         countryCode: "BR", pexelsQuery: "Christ the Redeemer Rio",             fact: "Christ the Redeemer stands 38 meters tall, including its pedestal.",            difficulty: "easy" },
  { id: "dubai",     name: "Dubai",          country: "UAE",            countryCode: "AE", pexelsQuery: "Burj Khalifa Dubai",                  fact: "Burj Khalifa is the world's tallest building at 828 meters.",                   difficulty: "easy" },
  { id: "moscow",    name: "Moscow",         country: "Russia",         countryCode: "RU", pexelsQuery: "Saint Basil's Cathedral Moscow",      fact: "Saint Basil's Cathedral was built in the 1550s by order of Ivan the Terrible.", difficulty: "easy" },
  { id: "athens",    name: "Athens",         country: "Greece",         countryCode: "GR", pexelsQuery: "Acropolis Athens",                    fact: "The Parthenon was built in just 9 years, from 447 to 438 BC.",                  difficulty: "easy" },

  // MEDIUM — recognizable but not instant
  { id: "prague",    name: "Prague",         country: "Czech Republic", countryCode: "CZ", pexelsQuery: "Prague Castle Charles Bridge",        fact: "Prague Castle is the largest ancient castle complex in the world.",             difficulty: "medium" },
  { id: "barcelona", name: "Barcelona",      country: "Spain",          countryCode: "ES", pexelsQuery: "Sagrada Familia Barcelona",           fact: "Sagrada Familia has been under construction since 1882 and is still unfinished.", difficulty: "medium" },
  { id: "istanbul",  name: "Istanbul",       country: "Turkey",         countryCode: "TR", pexelsQuery: "Hagia Sophia Istanbul",               fact: "Istanbul is the only city in the world that spans two continents.",             difficulty: "medium" },
  { id: "amsterdam", name: "Amsterdam",      country: "Netherlands",    countryCode: "NL", pexelsQuery: "Amsterdam canals",                    fact: "Amsterdam has more bicycles than residents — around 880,000 of them.",          difficulty: "medium" },
  { id: "venice",    name: "Venice",         country: "Italy",          countryCode: "IT", pexelsQuery: "Venice canals gondola",               fact: "Venice is built on 118 small islands connected by 400 bridges.",                difficulty: "medium" },
  { id: "lisbon",    name: "Lisbon",         country: "Portugal",       countryCode: "PT", pexelsQuery: "Lisbon tram yellow",                  fact: "Lisbon is older than Rome, founded around 1200 BC.",                            difficulty: "medium" },
  { id: "budapest",  name: "Budapest",       country: "Hungary",        countryCode: "HU", pexelsQuery: "Budapest Parliament Danube",          fact: "Budapest sits on over 100 thermal springs, hence its famous bathhouses.",       difficulty: "medium" },
  { id: "vienna",    name: "Vienna",         country: "Austria",        countryCode: "AT", pexelsQuery: "Vienna Schönbrunn Palace",            fact: "Vienna has been ranked the world's most livable city multiple times.",          difficulty: "medium" },
  { id: "santorini", name: "Santorini",      country: "Greece",         countryCode: "GR", pexelsQuery: "Santorini white blue",                fact: "Santorini's iconic white houses reflect heat to keep interiors cool.",          difficulty: "medium" },
  { id: "marrakech", name: "Marrakech",      country: "Morocco",        countryCode: "MA", pexelsQuery: "Marrakech medina souk",               fact: "Marrakech's medina is a UNESCO World Heritage site dating to 1070.",            difficulty: "medium" },
  { id: "havana",    name: "Havana",         country: "Cuba",           countryCode: "CU", pexelsQuery: "Havana classic cars",                 fact: "About 60,000 American classic cars from the 1950s still drive Havana's streets.", difficulty: "medium" },
  { id: "bangkok",   name: "Bangkok",        country: "Thailand",       countryCode: "TH", pexelsQuery: "Bangkok Grand Palace temple",         fact: "Bangkok's full ceremonial name is the longest city name in the world.",         difficulty: "medium" },
  { id: "petra",     name: "Petra",          country: "Jordan",         countryCode: "JO", pexelsQuery: "Petra Treasury Jordan",               fact: "Petra was carved directly into rose-red sandstone cliffs over 2,000 years ago.", difficulty: "medium" },
  { id: "kyoto",     name: "Kyoto",          country: "Japan",          countryCode: "JP", pexelsQuery: "Kyoto temple torii gates",            fact: "Kyoto has over 1,600 Buddhist temples and 400 Shinto shrines.",                 difficulty: "medium" },
  { id: "capetown",  name: "Cape Town",      country: "South Africa",   countryCode: "ZA", pexelsQuery: "Cape Town Table Mountain",            fact: "Table Mountain is one of the oldest mountains on Earth at around 260 million years.", difficulty: "medium" },
  { id: "reykjavik", name: "Reykjavik",      country: "Iceland",        countryCode: "IS", pexelsQuery: "Reykjavik colorful houses",           fact: "Reykjavik is the world's northernmost capital of a sovereign state.",           difficulty: "medium" },

  // HARD — regional or less iconic
  { id: "porto",        name: "Porto",       country: "Portugal", countryCode: "PT", pexelsQuery: "Porto Ribeira Douro",          fact: "Port wine can only legally be produced in the Douro Valley near Porto.",                    difficulty: "hard" },
  { id: "ljubljana",    name: "Ljubljana",   country: "Slovenia", countryCode: "SI", pexelsQuery: "Ljubljana dragon bridge",      fact: "Ljubljana means 'the beloved one' in old Slavic.",                                          difficulty: "hard" },
  { id: "tallinn",      name: "Tallinn",     country: "Estonia",  countryCode: "EE", pexelsQuery: "Tallinn old town medieval",    fact: "Tallinn's Old Town is one of the best-preserved medieval cities in Europe.",                difficulty: "hard" },
  { id: "valletta",     name: "Valletta",    country: "Malta",    countryCode: "MT", pexelsQuery: "Valletta Malta harbor",         fact: "Valletta is the smallest capital city in the European Union.",                              difficulty: "hard" },
  { id: "bruges",       name: "Bruges",      country: "Belgium",  countryCode: "BE", pexelsQuery: "Bruges canals belfry",          fact: "Bruges is sometimes called 'the Venice of the North' for its 50+ bridges.",                 difficulty: "hard" },
  { id: "tbilisi",      name: "Tbilisi",     country: "Georgia",  countryCode: "GE", pexelsQuery: "Tbilisi old town sulfur baths", fact: "Tbilisi was founded in the 5th century around its natural sulfur hot springs.",             difficulty: "hard" },
  { id: "luanda",       name: "Luanda",      country: "Angola",   countryCode: "AO", pexelsQuery: "Luanda Angola coastline",       fact: "Luanda has been ranked among the world's most expensive cities for expats.",                difficulty: "hard" },
  { id: "ulaanbaatar",  name: "Ulaanbaatar", country: "Mongolia", countryCode: "MN", pexelsQuery: "Ulaanbaatar Mongolia",          fact: "Ulaanbaatar is the coldest capital city in the world by average temperature.",              difficulty: "hard" },
  { id: "asuncion",     name: "Asunción",    country: "Paraguay", countryCode: "PY", pexelsQuery: "Asuncion Paraguay",             fact: "Asunción is one of the oldest continuously inhabited cities in South America.",            difficulty: "hard" },
  { id: "yerevan",      name: "Yerevan",     country: "Armenia",  countryCode: "AM", pexelsQuery: "Yerevan Armenia Mount Ararat",  fact: "Yerevan is one of the world's oldest continuously inhabited cities, founded 782 BC.",        difficulty: "hard" },
  { id: "thimphu",      name: "Thimphu",     country: "Bhutan",   countryCode: "BT", pexelsQuery: "Thimphu Bhutan dzong",          fact: "Thimphu is one of only two world capitals without traffic lights.",                         difficulty: "hard" },
];
