import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";
import { ConsumerRestaurantProfileModal } from "@/components/ConsumerRestaurantProfileModal";

const RestaurantsSection = () => {
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const restaurants = [
    {
      id: 1,
      name: "Cuizly food (bêta test)",
      location: "Montréal",
      rating: 4.3,
      cuisine: "Cuisine ouverte au monde",
      category: "Cuisine variée",
      description: "🌍 ✨ Cuisine ouverte au monde ✨ 🌍\n✈️ Un voyage culinaire sans frontières.\n🥘 Saveurs d'Asie, 🌶️ épices d'Orient, 🥗 fraîcheur méditerranéenne et 🍔 gourmandise d'Amérique.\n❤️ Chaque plat est une escale, une rencontre, une invitation à savourer le monde... en un seul coup de fourchette.\n🍴 ||",
      phone: "+1 514-123-4567",
      email: "contact@cuizlyfood.com",
      address: "123 Rue Saint-Laurent, Montréal, QC",
      cuisine_types: ["Africaine", "Mexicaine", "Italienne", "Marocaine", "Chinoise", "Turque", "Libanaise", "Indienne", "Coréenne"],
      service_types: ["Livraison", "À emporter", "Sur place", "Réservation", "Commande en ligne", "Service traiteur", "Événements", "Groupes"],
      specialties: ["Plats végétariens", "Plats végétaliens", "Sans gluten", "Plats bio", "Spécialités locales", "Épices authentiques", "Fusion cuisine"],
      opening_hours: {
        monday: { open: "11:00", close: "22:00", closed: false },
        tuesday: { open: "11:00", close: "22:00", closed: false },
        wednesday: { open: "11:00", close: "22:00", closed: false },
        thursday: { open: "11:00", close: "23:00", closed: false },
        friday: { open: "11:00", close: "23:00", closed: false },
        saturday: { open: "10:00", close: "23:00", closed: false },
        sunday: { open: "10:00", close: "22:00", closed: false }
      },
      instagram_url: "https://instagram.com/cuizlyfood",
      facebook_url: "https://facebook.com/cuizlyfood",
      cover_image_url: "/lovable-uploads/aec94d9d-796a-45f9-a55c-b439c25eef80.png"
    },
    {
      id: 2,
      name: "Le Bernardin",
      location: "Montréal",
      rating: 4.9,
      cuisine: "Fruits de mer",
      category: "Cuisine française"
    },
    {
      id: 3,
      name: "Toqué!",
      location: "Montréal",
      rating: 4.7,
      cuisine: "Gastronomie",
      category: "Cuisine moderne"
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-cuizly-primary mb-4">
            Restaurants populaires
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {restaurants.map((restaurant) => (
            <Card 
              key={restaurant.id} 
              className="p-4 sm:p-6 bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer group"
              onClick={() => {
                setSelectedRestaurant(restaurant);
                setShowModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base sm:text-lg text-cuizly-primary mb-1 group-hover:text-cuizly-accent transition-colors truncate">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{restaurant.location}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 bg-cuizly-accent/10 px-2 py-1 rounded-full ml-2">
                  <Star className="h-4 w-4 fill-cuizly-accent text-cuizly-accent" />
                  <span className="text-sm font-medium text-cuizly-accent">{restaurant.rating}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-foreground font-medium text-sm sm:text-base truncate">{restaurant.cuisine}</p>
                <Badge variant="secondary" className="text-xs">
                  {restaurant.category}
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        <ConsumerRestaurantProfileModal
          open={showModal}
          onOpenChange={setShowModal}
          restaurant={selectedRestaurant}
        />
      </div>
    </section>
  );
};

export default RestaurantsSection;