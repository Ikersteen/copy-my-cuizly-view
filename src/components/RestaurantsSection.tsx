import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";
import { ConsumerRestaurantProfileModal } from "@/components/ConsumerRestaurantProfileModal";

const RestaurantsSection = () => {
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const restaurants = [
    {
      id: "1",
      name: "Cuizly food (bêta test)",
      location: "Montréal",
      rating: 4.3,
      price_range: "$$",
      cuisine: "Cuisine ouverte au monde",
      category: "World-Inspired Cuisine",
      cuisine_type: ["Africaine", "Mexicaine", "Italienne", "Marocaine", "Chinoise", "Turque", "Libanaise"],
      service_types: ["Sur place", "Livraison", "À emporter"],
      restaurant_specialties: ["Plats végétariens", "Cuisine épicée", "Desserts maison"],
      description_fr: "🌍 ✨ Cuisine ouverte au monde ✨ 🌍\n✈️ Un voyage culinaire sans frontières.\n🥘 Saveurs d'Asie, 🌶️ épices d'Orient, 🥗 fraîcheur méditerranéenne et 🍔 gourmandise d'Amérique.\n❤️ Chaque plat est une escale, une rencontre, une invitation à découvrir le monde... en un seul coup de fourchette.\n✏️ 🍴",
      description_en: "🌍 ✨ World-Inspired Cuisine ✨ 🌍\n✈️ A culinary journey without borders.\n🥘 Asian flavors, 🌶️ Oriental spices, 🥗 Mediterranean freshness, and 🍔 American indulgence.\n❤️ Each dish is a stopover, a meeting, an invitation to taste the world... one bite at a time. ✏️ 🍴",
      phone: "5149999999",
      email: "cuizlycanada@gmail.com",
      instagram_url: "https://instagram.com/cuizly",
      facebook_url: "https://facebook.com/cuizly",
      opening_hours: {
        monday: { open: "11:00", close: "22:00", closed: false },
        tuesday: { open: "11:00", close: "22:00", closed: false },
        wednesday: { open: "11:00", close: "22:00", closed: false },
        thursday: { open: "11:00", close: "23:00", closed: false },
        friday: { open: "11:00", close: "23:00", closed: false },
        saturday: { open: "10:00", close: "23:00", closed: false },
        sunday: { open: "10:00", close: "21:00", closed: false }
      }
    },
    {
      id: "2",
      name: "Le Bernardin",
      location: "Montréal",
      rating: 4.9,
      price_range: "$$$",
      cuisine: "Fruits de mer",
      category: "Cuisine française",
      cuisine_type: ["Française", "Fruits de mer"],
      service_types: ["Sur place", "Réservation"],
      restaurant_specialties: ["Poisson frais", "Plateaux de fruits de mer", "Vins français"],
      description_fr: "Restaurant de fruits de mer haut de gamme offrant une cuisine française raffinée avec les meilleurs produits de la mer.",
      phone: "5141234567",
      email: "contact@lebernardim.ca",
      opening_hours: {
        monday: { open: "00:00", close: "00:00", closed: true },
        tuesday: { open: "17:00", close: "22:00", closed: false },
        wednesday: { open: "17:00", close: "22:00", closed: false },
        thursday: { open: "17:00", close: "22:00", closed: false },
        friday: { open: "17:00", close: "23:00", closed: false },
        saturday: { open: "17:00", close: "23:00", closed: false },
        sunday: { open: "17:00", close: "21:00", closed: false }
      }
    },
    {
      id: "3",
      name: "Toqué!",
      location: "Montréal",
      rating: 4.7,
      price_range: "$$$$",
      cuisine: "Gastronomie",
      category: "Cuisine moderne",
      cuisine_type: ["Française", "Moderne", "Gastronomique"],
      service_types: ["Sur place", "Réservation", "Menu dégustation"],
      restaurant_specialties: ["Menu saisonnier", "Produits locaux", "Accords mets-vins"],
      description_fr: "Restaurant gastronomique reconnu mondialement pour sa cuisine créative utilisant les meilleurs ingrédients du Québec.",
      phone: "5149876543",
      email: "reservation@toque.com",
      website_url: "https://www.toque.com",
      opening_hours: {
        monday: { open: "00:00", close: "00:00", closed: true },
        tuesday: { open: "00:00", close: "00:00", closed: true },
        wednesday: { open: "17:30", close: "21:30", closed: false },
        thursday: { open: "17:30", close: "21:30", closed: false },
        friday: { open: "17:30", close: "21:30", closed: false },
        saturday: { open: "17:30", close: "21:30", closed: false },
        sunday: { open: "00:00", close: "00:00", closed: true }
      }
    }
  ];

  const handleRestaurantClick = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setModalOpen(true);
  };

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
              onClick={() => handleRestaurantClick(restaurant)}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base sm:text-lg text-cuizly-primary mb-1 group-hover:text-cuizly-accent transition-colors truncate">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{restaurant.location}</span>
                    {restaurant.price_range && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{restaurant.price_range}</span>
                      </>
                    )}
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
          open={modalOpen}
          onOpenChange={setModalOpen}
          restaurant={selectedRestaurant}
        />
      </div>
    </section>
  );
};

export default RestaurantsSection;