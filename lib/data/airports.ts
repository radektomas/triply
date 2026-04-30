// Generated/seeded airport dataset.
// To expand to ~500 entries from the OurAirports open dataset:
//   1. curl https://davidmegginson.github.io/ourairports-data/airports.csv -o data/ourairports.csv
//   2. node scripts/build-airports.mjs
// The script overwrites this file with a deterministic transform of the CSV.

export type Airport = {
  iata: string;
  city: string;
  name: string;
  country: string;
  countryCode: string;
  aka?: string[]; // alternate spellings (e.g. "Praha" for Prague)
};

export const AIRPORTS: Airport[] = [
  // Europe — major hubs
  { iata: "LHR", city: "London", name: "Heathrow Airport", country: "United Kingdom", countryCode: "GB" },
  { iata: "LGW", city: "London", name: "Gatwick Airport", country: "United Kingdom", countryCode: "GB" },
  { iata: "STN", city: "London", name: "Stansted Airport", country: "United Kingdom", countryCode: "GB" },
  { iata: "CDG", city: "Paris", name: "Charles de Gaulle Airport", country: "France", countryCode: "FR" },
  { iata: "ORY", city: "Paris", name: "Orly Airport", country: "France", countryCode: "FR" },
  { iata: "AMS", city: "Amsterdam", name: "Schiphol Airport", country: "Netherlands", countryCode: "NL" },
  { iata: "FRA", city: "Frankfurt", name: "Frankfurt Airport", country: "Germany", countryCode: "DE" },
  { iata: "MUC", city: "Munich", name: "Munich Airport", country: "Germany", countryCode: "DE", aka: ["München"] },
  { iata: "BER", city: "Berlin", name: "Berlin Brandenburg Airport", country: "Germany", countryCode: "DE" },
  { iata: "MAD", city: "Madrid", name: "Adolfo Suárez Madrid–Barajas Airport", country: "Spain", countryCode: "ES" },
  { iata: "BCN", city: "Barcelona", name: "Barcelona–El Prat Airport", country: "Spain", countryCode: "ES" },
  { iata: "FCO", city: "Rome", name: "Leonardo da Vinci International Airport", country: "Italy", countryCode: "IT", aka: ["Roma"] },
  { iata: "MXP", city: "Milan", name: "Malpensa Airport", country: "Italy", countryCode: "IT", aka: ["Milano"] },
  { iata: "ZRH", city: "Zurich", name: "Zurich Airport", country: "Switzerland", countryCode: "CH", aka: ["Zürich"] },
  { iata: "VIE", city: "Vienna", name: "Vienna International Airport", country: "Austria", countryCode: "AT", aka: ["Wien"] },
  { iata: "CPH", city: "Copenhagen", name: "Copenhagen Airport", country: "Denmark", countryCode: "DK", aka: ["København"] },
  { iata: "ARN", city: "Stockholm", name: "Arlanda Airport", country: "Sweden", countryCode: "SE" },
  { iata: "OSL", city: "Oslo", name: "Oslo Gardermoen Airport", country: "Norway", countryCode: "NO" },
  { iata: "HEL", city: "Helsinki", name: "Helsinki Airport", country: "Finland", countryCode: "FI" },
  { iata: "DUB", city: "Dublin", name: "Dublin Airport", country: "Ireland", countryCode: "IE" },
  { iata: "LIS", city: "Lisbon", name: "Humberto Delgado Airport", country: "Portugal", countryCode: "PT", aka: ["Lisboa"] },
  { iata: "OPO", city: "Porto", name: "Francisco Sá Carneiro Airport", country: "Portugal", countryCode: "PT" },
  { iata: "FAO", city: "Faro", name: "Faro Airport", country: "Portugal", countryCode: "PT" },
  { iata: "BRU", city: "Brussels", name: "Brussels Airport", country: "Belgium", countryCode: "BE" },
  { iata: "WAW", city: "Warsaw", name: "Warsaw Chopin Airport", country: "Poland", countryCode: "PL", aka: ["Warszawa"] },
  { iata: "KRK", city: "Kraków", name: "John Paul II International Airport", country: "Poland", countryCode: "PL", aka: ["Krakow"] },
  { iata: "PRG", city: "Prague", name: "Václav Havel Airport Prague", country: "Czechia", countryCode: "CZ", aka: ["Praha"] },
  { iata: "BUD", city: "Budapest", name: "Budapest Ferenc Liszt Airport", country: "Hungary", countryCode: "HU" },
  { iata: "ATH", city: "Athens", name: "Athens International Airport", country: "Greece", countryCode: "GR", aka: ["Athína"] },
  { iata: "IST", city: "Istanbul", name: "Istanbul Airport", country: "Turkey", countryCode: "TR" },
  { iata: "EDI", city: "Edinburgh", name: "Edinburgh Airport", country: "United Kingdom", countryCode: "GB" },
  { iata: "MAN", city: "Manchester", name: "Manchester Airport", country: "United Kingdom", countryCode: "GB" },
  { iata: "RIX", city: "Riga", name: "Riga International Airport", country: "Latvia", countryCode: "LV" },
  { iata: "TLL", city: "Tallinn", name: "Tallinn Airport", country: "Estonia", countryCode: "EE" },
  { iata: "VNO", city: "Vilnius", name: "Vilnius Airport", country: "Lithuania", countryCode: "LT" },
  { iata: "OTP", city: "Bucharest", name: "Henri Coandă International Airport", country: "Romania", countryCode: "RO", aka: ["București"] },
  { iata: "SOF", city: "Sofia", name: "Sofia Airport", country: "Bulgaria", countryCode: "BG" },
  { iata: "ZAG", city: "Zagreb", name: "Franjo Tuđman Airport", country: "Croatia", countryCode: "HR" },
  { iata: "SPU", city: "Split", name: "Split Airport", country: "Croatia", countryCode: "HR" },
  { iata: "DBV", city: "Dubrovnik", name: "Dubrovnik Airport", country: "Croatia", countryCode: "HR" },
  { iata: "LJU", city: "Ljubljana", name: "Ljubljana Jože Pučnik Airport", country: "Slovenia", countryCode: "SI" },
  { iata: "BTS", city: "Bratislava", name: "M. R. Štefánik Airport", country: "Slovakia", countryCode: "SK" },
  { iata: "BEG", city: "Belgrade", name: "Nikola Tesla Airport", country: "Serbia", countryCode: "RS", aka: ["Beograd"] },
  { iata: "TXL", city: "Tirana", name: "Tirana International Airport", country: "Albania", countryCode: "AL" },
  { iata: "MLA", city: "Malta", name: "Malta International Airport", country: "Malta", countryCode: "MT" },
  { iata: "KEF", city: "Reykjavik", name: "Keflavík International Airport", country: "Iceland", countryCode: "IS", aka: ["Reykjavík"] },

  // Worldwide — major hubs
  { iata: "JFK", city: "New York", name: "John F. Kennedy International Airport", country: "United States", countryCode: "US" },
  { iata: "EWR", city: "Newark", name: "Newark Liberty International Airport", country: "United States", countryCode: "US" },
  { iata: "LAX", city: "Los Angeles", name: "Los Angeles International Airport", country: "United States", countryCode: "US" },
  { iata: "ORD", city: "Chicago", name: "O'Hare International Airport", country: "United States", countryCode: "US" },
  { iata: "SFO", city: "San Francisco", name: "San Francisco International Airport", country: "United States", countryCode: "US" },
  { iata: "MIA", city: "Miami", name: "Miami International Airport", country: "United States", countryCode: "US" },
  { iata: "BOS", city: "Boston", name: "Logan International Airport", country: "United States", countryCode: "US" },
  { iata: "SEA", city: "Seattle", name: "Seattle–Tacoma International Airport", country: "United States", countryCode: "US" },
  { iata: "YYZ", city: "Toronto", name: "Toronto Pearson International Airport", country: "Canada", countryCode: "CA" },
  { iata: "YVR", city: "Vancouver", name: "Vancouver International Airport", country: "Canada", countryCode: "CA" },
  { iata: "MEX", city: "Mexico City", name: "Benito Juárez International Airport", country: "Mexico", countryCode: "MX" },
  { iata: "GRU", city: "São Paulo", name: "São Paulo–Guarulhos International Airport", country: "Brazil", countryCode: "BR", aka: ["Sao Paulo"] },
  { iata: "EZE", city: "Buenos Aires", name: "Ministro Pistarini International Airport", country: "Argentina", countryCode: "AR" },
  { iata: "DXB", city: "Dubai", name: "Dubai International Airport", country: "United Arab Emirates", countryCode: "AE" },
  { iata: "DOH", city: "Doha", name: "Hamad International Airport", country: "Qatar", countryCode: "QA" },
  { iata: "AUH", city: "Abu Dhabi", name: "Zayed International Airport", country: "United Arab Emirates", countryCode: "AE" },
  { iata: "SIN", city: "Singapore", name: "Singapore Changi Airport", country: "Singapore", countryCode: "SG" },
  { iata: "HKG", city: "Hong Kong", name: "Hong Kong International Airport", country: "Hong Kong", countryCode: "HK" },
  { iata: "NRT", city: "Tokyo", name: "Narita International Airport", country: "Japan", countryCode: "JP" },
  { iata: "HND", city: "Tokyo", name: "Haneda Airport", country: "Japan", countryCode: "JP" },
  { iata: "ICN", city: "Seoul", name: "Incheon International Airport", country: "South Korea", countryCode: "KR" },
  { iata: "PEK", city: "Beijing", name: "Beijing Capital International Airport", country: "China", countryCode: "CN" },
  { iata: "PVG", city: "Shanghai", name: "Shanghai Pudong International Airport", country: "China", countryCode: "CN" },
  { iata: "BKK", city: "Bangkok", name: "Suvarnabhumi Airport", country: "Thailand", countryCode: "TH" },
  { iata: "KUL", city: "Kuala Lumpur", name: "Kuala Lumpur International Airport", country: "Malaysia", countryCode: "MY" },
  { iata: "DEL", city: "Delhi", name: "Indira Gandhi International Airport", country: "India", countryCode: "IN" },
  { iata: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj International Airport", country: "India", countryCode: "IN" },
  { iata: "JNB", city: "Johannesburg", name: "O. R. Tambo International Airport", country: "South Africa", countryCode: "ZA" },
  { iata: "CPT", city: "Cape Town", name: "Cape Town International Airport", country: "South Africa", countryCode: "ZA" },
  { iata: "CAI", city: "Cairo", name: "Cairo International Airport", country: "Egypt", countryCode: "EG" },
  { iata: "SYD", city: "Sydney", name: "Sydney Kingsford Smith Airport", country: "Australia", countryCode: "AU" },
  { iata: "MEL", city: "Melbourne", name: "Melbourne Airport", country: "Australia", countryCode: "AU" },
  { iata: "AKL", city: "Auckland", name: "Auckland Airport", country: "New Zealand", countryCode: "NZ" },
];
