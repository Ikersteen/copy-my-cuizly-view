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

export const MONTREAL_CONFIG: CityConfig = {
  id: 'montreal',
  name: 'Montréal',
  nameEn: 'Montreal',
  province: 'QC',
  country: 'Canada',
  postalCodePatterns: ['H1A', 'H1B', 'H1C', 'H1E', 'H1G', 'H1H', 'H1J', 'H1K', 'H1L', 'H1M', 'H1N', 'H1P', 'H1R', 'H1S', 'H1T', 'H1V', 'H1W', 'H1X', 'H1Y', 'H1Z', 'H2A', 'H2B', 'H2C', 'H2E', 'H2G', 'H2H', 'H2J', 'H2K', 'H2L', 'H2M', 'H2N', 'H2P', 'H2R', 'H2S', 'H2T', 'H2V', 'H2W', 'H2X', 'H2Y', 'H2Z', 'H3A', 'H3B', 'H3C', 'H3E', 'H3G', 'H3H', 'H3J', 'H3K', 'H3L', 'H3M', 'H3N', 'H3P', 'H3R', 'H3S', 'H3T', 'H3V', 'H3W', 'H3X', 'H3Y', 'H3Z', 'H4A', 'H4B', 'H4C', 'H4E', 'H4G', 'H4H', 'H4J', 'H4K', 'H4L', 'H4M', 'H4N', 'H4P', 'H4R', 'H4S', 'H4T', 'H4V', 'H4W', 'H4X', 'H4Y', 'H4Z'],
  neighborhoods: [
    'Vieux-Montréal',
    'Plateau-Mont-Royal',
    'Mile End',
    'Outremont',
    'Westmount',
    'NDG',
    'Côte-des-Neiges',
    'Rosemont',
    'Villeray',
    'Hochelaga-Maisonneuve',
    'Verdun',
    'LaSalle',
    'Lachine',
    'Pointe-Claire',
    'Dollard-des-Ormeaux',
    'Saint-Laurent',
    'Ahuntsic',
    'Cartierville',
    'Anjou',
    'Saint-Léonard',
    'Montréal-Nord',
    'Rivière-des-Prairies',
    'Pointe-aux-Trembles',
    'Mercier',
    'Tétreaultville',
    'Centre-ville',
    'Quartier Latin',
    'Quartier des Spectacles',
    'Little Italy',
    'Little Burgundy'
  ],
  streets: [
    'Rue Saint-Catherine',
    'Boulevard Saint-Laurent',
    'Rue Sainte-Catherine Ouest',
    'Avenue du Mont-Royal',
    'Rue Saint-Denis',
    'Avenue Papineau',
    'Rue Ontario',
    'Boulevard René-Lévesque',
    'Rue Sherbrooke',
    'Avenue du Parc',
    'Rue Saint-Hubert',
    'Boulevard Pie-IX',
    'Rue Jean-Talon',
    'Avenue Laurier',
    'Rue Beaubien',
    'Boulevard Décarie',
    'Rue Notre-Dame',
    'Avenue de l\'Esplanade',
    'Rue Saint-Urbain',
    'Boulevard de Maisonneuve',
    'Rue Hutchison',
    'Avenue Christophe-Colomb',
    'Rue Saint-Dominique',
    'Avenue Henri-Julien',
    'Rue Clark',
    'Boulevard Saint-Joseph',
    'Rue Drolet',
    'Avenue de Gaspé',
    'Rue Saint-Viateur',
    'Avenue Fairmount',
    'Rue Bernard',
    'Avenue Outremont',
    'Chemin de la Côte-Sainte-Catherine',
    'Avenue Van Horne',
    'Rue Jean-Brillant',
    'Boulevard Édouard-Montpetit',
    'Avenue Côte-des-Neiges',
    'Chemin Queen-Mary',
    'Boulevard de l\'Acadie',
    'Rue Fleury',
    'Boulevard Gouin',
    'Rue Jarry',
    'Boulevard Henri-Bourassa',
    'Avenue Christophe-Colomb',
    'Rue de Bellechasse',
    'Avenue des Pins',
    'Rue Prince-Arthur',
    'Rue Crescent',
    'Rue Peel',
    'Rue McGill'
  ],
  defaultCoordinates: {
    lat: 45.5017,
    lng: -73.5673
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
  MONTREAL_CONFIG,
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
  
  // Default to Montreal
  return MONTREAL_CONFIG;
};