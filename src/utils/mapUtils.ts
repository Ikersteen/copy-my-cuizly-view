// Fonction pour obtenir l'URL de la carte intégrée
// Cette fonction retourne l'adresse formatée pour être utilisée avec EmbeddedMapModal
export const getEmbeddedMapUrl = (address: string): string => {
  if (!address) return '';
  return address;
};

// Fonction pour ouvrir l'itinéraire vers une adresse (legacy - à remplacer par EmbeddedMapModal)
export const openDirections = (address: string) => {
  if (!address) return;

  // Détecter l'OS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  // Encoder l'adresse pour l'URL
  const encodedAddress = encodeURIComponent(address);
  
  let url: string;
  
  if (isIOS) {
    // Ouvrir Apple Maps sur iOS
    url = `https://maps.apple.com/?address=${encodedAddress}`;
  } else {
    // Ouvrir Google Maps sur Android et Desktop
    url = `https://maps.google.com/?q=${encodedAddress}`;
  }
  
  // Ouvrir dans un nouvel onglet
  window.open(url, '_blank');
};
