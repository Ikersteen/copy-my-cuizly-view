// Configuration multi-ville pour le système d'adresses
export interface CityConfig {
  id: string;
  name: string;
  nameEn: string;
  province: string;
  country: string;
  postalCodePatterns: string[];
  neighborhoods: string[];
  streets: string[];
  defaultCoordinates: {
    lat: number;
    lng: number;
  };
}

export const TORONTO_CONFIG: CityConfig = {
  id: 'toronto',
  name: 'Toronto',
  nameEn: 'Toronto',
  province: 'ON',
  country: 'Canada',
  postalCodePatterns: ['M1B', 'M1C', 'M1E', 'M1G', 'M1H', 'M1J', 'M1K', 'M1L', 'M1M', 'M1N', 'M1P', 'M1R', 'M1S', 'M1T', 'M1V', 'M1W', 'M1X', 'M2H', 'M2J', 'M2K', 'M2L', 'M2M', 'M2N', 'M2P', 'M2R', 'M3A', 'M3B', 'M3C', 'M3H', 'M3J', 'M3K', 'M3L', 'M3M', 'M3N', 'M4A', 'M4B', 'M4C', 'M4E', 'M4G', 'M4H', 'M4J', 'M4K', 'M4L', 'M4M', 'M4N', 'M4P', 'M4R', 'M4S', 'M4T', 'M4V', 'M4W', 'M4X', 'M4Y', 'M5A', 'M5B', 'M5C', 'M5E', 'M5G', 'M5H', 'M5J', 'M5K', 'M5L', 'M5M', 'M5N', 'M5P', 'M5R', 'M5S', 'M5T', 'M5V', 'M5W', 'M5X', 'M6A', 'M6B', 'M6C', 'M6E', 'M6G', 'M6H', 'M6J', 'M6K', 'M6L', 'M6M', 'M6N', 'M6P', 'M6R', 'M6S', 'M7A', 'M7R', 'M7Y', 'M8V', 'M8W', 'M8X', 'M8Y', 'M8Z', 'M9A', 'M9B', 'M9C', 'M9L', 'M9M', 'M9N', 'M9P', 'M9R', 'M9V', 'M9W'],
  neighborhoods: [
    'Downtown Toronto',
    'The Annex',
    'Yorkville',
    'Chinatown',
    'Little Italy',
    'Kensington Market',
    'The Beaches',
    'High Park',
    'Leslieville',
    'Roncesvalles',
    'Liberty Village',
    'Distillery District',
    'Queen West',
    'King West',
    'Entertainment District',
    'Financial District',
    'Harbourfront',
    'The Danforth',
    'Junction Triangle',
    'Corso Italia',
    'St. Lawrence',
    'Cabbagetown',
    'Riverside',
    'Parkdale',
    'Trinity Bellwoods',
    'Little Portugal',
    'Forest Hill',
    'Rosedale',
    'North York',
    'Scarborough',
    'Etobicoke'
  ],
  streets: [
    'Yonge Street',
    'Queen Street West',
    'King Street West',
    'Bloor Street',
    'Dundas Street',
    'College Street',
    'Spadina Avenue',
    'Bay Street',
    'University Avenue',
    'Ossington Avenue',
    'Queen Street East',
    'King Street East',
    'Danforth Avenue',
    'St. Clair Avenue',
    'Eglinton Avenue',
    'Lawrence Avenue',
    'Sheppard Avenue',
    'Finch Avenue',
    'Steeles Avenue',
    'Front Street',
    'Adelaide Street',
    'Richmond Street',
    'Wellington Street',
    'Harbord Street',
    'Bloor Street West',
    'Bloor Street East',
    'Avenue Road',
    'Bathurst Street',
    'Dufferin Street',
    'Keele Street',
    'Jane Street',
    'Roncesvalles Avenue',
    'Broadview Avenue',
    'Carlaw Avenue',
    'Pape Avenue',
    'Woodbine Avenue',
    'Victoria Park Avenue',
    'Warden Avenue',
    'Kennedy Road',
    'McCowan Road',
    'Markham Road',
    'The Esplanade',
    'Parliament Street',
    'Church Street',
    'Jarvis Street',
    'Sherbourne Street',
    'Gerrard Street',
    'Carlton Street'
  ],
  defaultCoordinates: {
    lat: 43.6532,
    lng: -79.3832
  }
};

export const REPENTIGNY_CONFIG: CityConfig = {
  id: 'repentigny',
  name: 'Repentigny',
  nameEn: 'Repentigny',
  province: 'QC',
  country: 'Canada',
  postalCodePatterns: ['J5Y', 'J6A', 'J6B'],
  neighborhoods: [
    'Centre-ville Repentigny',
    'Le Gardeur',
    'Charlemagne',
    'Village Repentigny',
    'Secteur Iberville',
    'Secteur Notre-Dame',
    'Secteur Le Gardeur',
    'Domaine de la Presqu\'île',
    'Les Promenades Repentigny',
    'Parc industriel Repentigny'
  ],
  streets: [
    'Boulevard Iberville',
    'Rue Notre-Dame',
    'Boulevard Lacombe',
    'Rue Brien',
    'Boulevard Industriel',
    'Rue Saint-Jean-Baptiste',
    'Avenue Papineau',
    'Rue Le Gardeur',
    'Boulevard Forest',
    'Rue de la Station',
    'Avenue de la Gare',
    'Rue des Érables',
    'Boulevard Anjou',
    'Rue Commerciale',
    'Avenue des Muriers',
    'Rue Principale',
    'Boulevard des Entreprises',
    'Rue Frontenac',
    'Avenue du Domaine',
    'Rue Saint-Pierre',
    'Boulevard Manseau',
    'Rue des Ormes',
    'Avenue Victoria',
    'Rue Dandurand',
    'Boulevard Marie-Victorin',
    'Rue des Peupliers',
    'Avenue Sylvain',
    'Rue Cusson',
    'Boulevard de L\'Assomption',
    'Rue Cartier',
    'Avenue des Cèdres',
    'Rue des Pins',
    'Boulevard Laurier',
    'Rue de la Cathédrale',
    'Avenue du Centenaire',
    'Rue des Bouleaux',
    'Boulevard de la Rive',
    'Rue Sainte-Anne',
    'Avenue du Parc',
    'Rue Saint-Louis'
  ],
  defaultCoordinates: {
    lat: 45.7606,
    lng: -73.4500
  }
};

export const SUPPORTED_CITIES: CityConfig[] = [
  TORONTO_CONFIG,
  REPENTIGNY_CONFIG
];

export const getCityByPostalCode = (postalCode: string): CityConfig | null => {
  const cleanPostalCode = postalCode.toUpperCase().replace(/\s/g, '').substring(0, 3);
  
  for (const city of SUPPORTED_CITIES) {
    if (city.postalCodePatterns.some(pattern => cleanPostalCode.startsWith(pattern))) {
      return city;
    }
  }
  
  return null;
};

export const getCityById = (cityId: string): CityConfig | null => {
  return SUPPORTED_CITIES.find(city => city.id === cityId) || null;
};

export const detectCityFromAddress = (formattedAddress: string): CityConfig => {
  const address = formattedAddress.toLowerCase();
  
  // Check for Repentigny indicators
  if (address.includes('repentigny') || 
      address.includes('j5y') || 
      address.includes('j6a') || 
      address.includes('j6b') ||
      address.includes('le gardeur') ||
      address.includes('charlemagne')) {
    return REPENTIGNY_CONFIG;
  }
  
  // Default to Toronto
  return TORONTO_CONFIG;
};