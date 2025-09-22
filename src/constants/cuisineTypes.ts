export const CUISINE_OPTIONS = [
  "african", "mexican", "italian", "moroccan", "chinese", "turkish", "lebanese", "indian",
  "korean", "vietnamese", "thai", "japanese", "greek", "quebecois", "french",
  "american", "spanish"
];

export const CUISINE_TRANSLATIONS = {
  french: { fr: "Française", en: "French" },
  italian: { fr: "Italienne", en: "Italian" },
  japanese: { fr: "Japonaise", en: "Japanese" },
  chinese: { fr: "Chinoise", en: "Chinese" },
  mexican: { fr: "Mexicaine", en: "Mexican" },
  indian: { fr: "Indienne", en: "Indian" },
  thai: { fr: "Thaïlandaise", en: "Thai" },
  lebanese: { fr: "Libanaise", en: "Lebanese" },
  greek: { fr: "Grecque", en: "Greek" },
  american: { fr: "Américaine", en: "American" },
  quebecois: { fr: "Québécoise", en: "Quebecois" },
  korean: { fr: "Coréenne", en: "Korean" },
  vietnamese: { fr: "Vietnamienne", en: "Vietnamese" },
  spanish: { fr: "Espagnole", en: "Spanish" },
  moroccan: { fr: "Marocaine", en: "Moroccan" },
  turkish: { fr: "Turque", en: "Turkish" },
  african: { fr: "Africaine", en: "African" }
};

export const DIETARY_RESTRICTIONS_OPTIONS = [
  "vegetarian", "vegan", "gluten_free", "halal", "kosher", "paleo",
  "ketogenic", "lactose_free", "pescatarian", "low_sodium",
  "fruitarian", "carnivore", "detox", "spicy", "not_spicy", "low_sugar"
];

export const DIETARY_RESTRICTIONS_TRANSLATIONS = {
  vegetarian: { fr: "Végétarien", en: "Vegetarian" },
  vegan: { fr: "Végan", en: "Vegan" },
  gluten_free: { fr: "Sans gluten", en: "Gluten-free" },
  halal: { fr: "Halal", en: "Halal" },
  kosher: { fr: "Casher", en: "Kosher" },
  paleo: { fr: "Paléo", en: "Paleo" },
  ketogenic: { fr: "Cétogène", en: "Ketogenic" },
  lactose_free: { fr: "Sans lactose", en: "Lactose-free" },
  pescatarian: { fr: "Pescétarien", en: "Pescatarian" },
  low_sodium: { fr: "Faible en sodium", en: "Low sodium" },
  fruitarian: { fr: "Frugivore", en: "Fruitarian" },
  carnivore: { fr: "Carnivore", en: "Carnivore" },
  detox: { fr: "Détox", en: "Detox" },
  spicy: { fr: "Épicé", en: "Spicy" },
  not_spicy: { fr: "Non épicé", en: "Not spicy" },
  low_sugar: { fr: "Faible en sucre", en: "Low sugar" }
};

export const ALLERGENS_OPTIONS = [
  "peanuts", "nuts", "milk", "eggs", "wheat", "soy", "fish",
  "seafood", "sesame_seeds", "sulfites", "mustard",
  "lupin", "celery", "gluten", "corn", "peas_legumes",
  "kiwi", "banana", "stone_fruits"
];

export const ALLERGENS_TRANSLATIONS = {
  peanuts: { fr: "Arachides", en: "Peanuts" },
  nuts: { fr: "Noix", en: "Nuts" },
  milk: { fr: "Lait", en: "Milk" },
  eggs: { fr: "Œufs", en: "Eggs" },
  wheat: { fr: "Blé", en: "Wheat" },
  soy: { fr: "Soja", en: "Soy" },
  fish: { fr: "Poisson", en: "Fish" },
  seafood: { fr: "Fruits de mer", en: "Seafood" },
  sesame_seeds: { fr: "Graines de sésame", en: "Sesame seeds" },
  sulfites: { fr: "Sulfites", en: "Sulfites" },
  mustard: { fr: "Moutarde", en: "Mustard" },
  lupin: { fr: "Lupin", en: "Lupin" },
  celery: { fr: "Céleri", en: "Celery" },
  gluten: { fr: "Gluten", en: "Gluten" },
  corn: { fr: "Maïs", en: "Corn" },
  peas_legumes: { fr: "Pois / légumineuses", en: "Peas/Legumes" },
  kiwi: { fr: "Kiwi", en: "Kiwi" },
  banana: { fr: "Banane", en: "Banana" },
  stone_fruits: { fr: "Fruits à noyau", en: "Stone fruits" }
};

// Legacy arrays for backward compatibility
export const DIETARY_RESTRICTIONS = [
  "Végétarien", "Végan", "Sans gluten", "Halal", "Casher", "Paléo",
  "Cétogène", "Sans lactose", "Pescétarien", "Faible en sodium",
  "Frugivore", "Carnivore", "Détox", "Épicé", "Non épicé", "Faible en sucre"
];

export const ALLERGENS = [
  "Arachides", "Noix", "Lait", "Œufs", "Blé", "Soja", "Poisson", 
  "Fruits de mer", "Graines de sésame", "Sulfites", "Moutarde",
  "Lupin", "Céleri", "Gluten", "Maïs", "Pois / légumineuses",
  "Kiwi", "Banane", "Fruits à noyau"
];

export const SERVICE_TYPES_OPTIONS = [
  "breakfast_brunch", "quick_lunch", "dinner_supper", "cafe_snack", 
  "specialized_detox_health", "late_night"
];

export const SERVICE_TYPES_TRANSLATIONS = {
  breakfast_brunch: { fr: "Déjeuner / Brunch", en: "Breakfast / Brunch" },
  quick_lunch: { fr: "Déjeuner rapide", en: "Quick Lunch" },
  dinner_supper: { fr: "Dîner / Souper", en: "Dinner / Supper" },
  cafe_snack: { fr: "Café & Snack", en: "Cafe & Snack" },
  specialized_detox_health: { fr: "Spécialisés Détox / Santé", en: "Specialized Detox / Health" },
  late_night: { fr: "Tard le soir", en: "Late Night" }
};

export const PRICE_RANGE_OPTIONS = [
  "$", "$$", "$$$", "$$$$"
];

export const PRICE_RANGE_TRANSLATIONS = {
  "$": { fr: "Économique ($)", en: "Budget ($)" },
  "$$": { fr: "Modéré ($$)", en: "Moderate ($$)" },
  "$$$": { fr: "Cher ($$$)", en: "Expensive ($$$)" },
  "$$$$": { fr: "Luxe ($$$$)", en: "Luxury ($$$$)" }
};

// Legacy exports for compatibility
export const DIETARY_OPTIONS = DIETARY_RESTRICTIONS;
export const ALLERGEN_OPTIONS = ALLERGENS;