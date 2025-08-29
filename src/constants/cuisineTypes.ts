export const CUISINE_OPTIONS = [
  "french", "italian", "japanese", "chinese", "mexican", "indian",
  "thai", "lebanese", "greek", "american", "quebecois", "korean",
  "vietnamese", "spanish", "moroccan", "turkish", "african"
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

// Legacy exports for compatibility
export const DIETARY_OPTIONS = DIETARY_RESTRICTIONS;
export const ALLERGEN_OPTIONS = ALLERGENS;