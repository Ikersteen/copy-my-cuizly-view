import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, DollarSign, Heart, Share, Camera } from "lucide-react";
import { useTranslation } from "react-i18next";

const FeaturedRestaurantsSection = () => {
  const { t } = useTranslation();

  const featuredRestaurants = [
    {
      id: 1,
      name: "Chez Laurent",
      cuisine: "Française • Bistro",
      location: "Plateau-Mont-Royal",
      rating: 4.7,
      reviewCount: 342,
      priceRange: "$$",
      image: "/lovable-uploads/445208fa-be94-455a-a45d-46fe6bf37d41.png",
      isOpen: true,
      distance: "0.8 km",
      specialOffer: "15% de rabais",
      tags: ["Terrasse", "Brunch", "Végane"]
    },
    {
      id: 2,
      name: "Sushi Zen",
      cuisine: "Japonaise • Sushi",
      location: "Centre-ville",
      rating: 4.9,
      reviewCount: 567,
      priceRange: "$$$",
      image: "/lovable-uploads/4b5fb4e2-d15a-4234-89cd-83d22982ea9a.png",
      isOpen: true,
      distance: "1.2 km",
      tags: ["Livraison", "Frais", "Omakase"]
    },
    {
      id: 3,
      name: "Trattoria Bella",
      cuisine: "Italienne • Pizza",
      location: "Little Italy",
      rating: 4.6,
      reviewCount: 298,
      priceRange: "$$",
      image: "/lovable-uploads/4faf2783-b898-4e3b-965d-0de5459e27ab.png",
      isOpen: false,
      distance: "2.1 km",
      tags: ["Famille", "Authentique", "Four à bois"]
    }
  ];

  return (
    <section className="py-8 sm:py-12 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Restaurants en vedette
            </h2>
            <p className="text-muted-foreground">
              Les coups de cœur de notre communauté
            </p>
          </div>
          <Button variant="outline" className="hidden sm:flex">
            Voir tout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {featuredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white border border-border/20">
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <img 
                  src={restaurant.image} 
                  alt={restaurant.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Image overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
                
                {/* Top badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {restaurant.specialOffer && (
                    <Badge className="bg-red-600 text-white font-medium shadow-md">
                      {restaurant.specialOffer}
                    </Badge>
                  )}
                  {restaurant.isOpen && (
                    <Badge className="bg-green-600 text-white font-medium shadow-md">
                      <Clock className="h-3 w-3 mr-1" />
                      Ouvert
                    </Badge>
                  )}
                </div>

                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                {/* Price indicator */}
                <div className="absolute bottom-3 left-3">
                  <Badge variant="secondary" className="bg-white/90 text-foreground font-medium">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {restaurant.priceRange}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5 space-y-3">
                {/* Title and rating */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                      {restaurant.name}
                    </h3>
                    <p className="text-muted-foreground text-sm truncate">
                      {restaurant.cuisine}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 bg-primary/10 px-2 py-1 rounded-full ml-3 flex-shrink-0">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {restaurant.rating}
                    </span>
                  </div>
                </div>

                {/* Location and reviews */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="truncate">{restaurant.location}</span>
                  </div>
                  <span className="flex-shrink-0">
                    {restaurant.reviewCount} avis
                  </span>
                </div>

                {/* Distance */}
                <div className="text-sm text-muted-foreground">
                  À {restaurant.distance} • Estimation 15-25 min
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {restaurant.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="text-xs px-2 py-0.5 border-border/40 text-muted-foreground"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* View all button for mobile */}
        <div className="text-center mt-6 sm:hidden">
          <Button variant="outline" className="w-full">
            Voir tous les restaurants
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedRestaurantsSection;