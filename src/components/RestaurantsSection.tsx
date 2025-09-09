import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";
import { useState } from "react";
import { ConsumerRestaurantProfileModal } from "@/components/ConsumerRestaurantProfileModal";

const RestaurantsSection = () => {
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const restaurants = [
    {
      id: "1",
      name: "Steen food",
      address: "Montréal, QC",
      rating: 4.8,
      cuisine_type: ["Africaine", "Grillades"],
      restaurant_specialties: ["Nganda ntaba", "Grillades"],
      description_fr: "Cuisine africaine authentique avec des spécialités de viande grillée et des saveurs traditionnelles.",
      description_en: "Authentic African cuisine with grilled meat specialties and traditional flavors.",
      price_range: "$$",
      service_types: ["Livraison", "À emporter"],
      phone: "+1 (514) 123-4567",
      email: "contact@steenfood.com",
      is_active: true
    },
    {
      id: "2", 
      name: "Le Bernardin",
      address: "Montréal, QC",
      rating: 4.9,
      cuisine_type: ["Française", "Fruits de mer"],
      restaurant_specialties: ["Fruits de mer", "Cuisine gastronomique"],
      description_fr: "Restaurant français raffiné spécialisé dans les fruits de mer frais et la cuisine gastronomique.",
      description_en: "Refined French restaurant specializing in fresh seafood and gourmet cuisine.",
      price_range: "$$$",
      service_types: ["Sur place", "Réservations"],
      phone: "+1 (514) 234-5678",
      email: "info@lebernardين.com",
      is_active: true
    },
    {
      id: "3",
      name: "Toqué!",
      address: "Montréal, QC", 
      rating: 4.7,
      cuisine_type: ["Moderne", "Québécoise"],
      restaurant_specialties: ["Cuisine moderne", "Produits locaux"],
      description_fr: "Restaurant moderne mettant en valeur les produits locaux québécois avec une approche gastronomique contemporaine.",
      description_en: "Modern restaurant showcasing local Quebec products with a contemporary gastronomic approach.",
      price_range: "$$$",
      service_types: ["Sur place", "Événements privés"],
      phone: "+1 (514) 345-6789",
      email: "reservations@toque.com",
      is_active: true
    }
  ];

  const handleRestaurantClick = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setIsModalOpen(true);
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
                    <span className="truncate">{restaurant.address}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 bg-cuizly-accent/10 px-2 py-1 rounded-full ml-2">
                  <Star className="h-4 w-4 fill-cuizly-accent text-cuizly-accent" />
                  <span className="text-sm font-medium text-cuizly-accent">{restaurant.rating}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-1 mb-2">
                  {restaurant.cuisine_type.slice(0, 2).map((cuisine, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {cuisine}
                    </Badge>
                  ))}
                  {restaurant.cuisine_type.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{restaurant.cuisine_type.length - 2}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {restaurant.restaurant_specialties.join(" • ")}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <ConsumerRestaurantProfileModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          restaurant={selectedRestaurant}
        />
      </div>
    </section>
  );
};

export default RestaurantsSection;