import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  Map
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const RestaurantsDiscoverySection = () => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [sortBy, setSortBy] = useState('distance');

  const restaurants = [
    {
      id: 1,
      name: "Café Olimpico",
      cuisine: "Café • Italien",
      location: "Mile End",
      rating: 4.5,
      reviewCount: 1247,
      priceRange: "$",
      distance: "0.3 km",
      isOpen: true,
      deliveryTime: "15-25 min",
      image: "/lovable-uploads/55cad8e4-4741-42c5-9995-969000769e6f.png",
      tags: ["Café", "Terrasse", "WiFi"]
    },
    {
      id: 2,
      name: "L'Express",
      cuisine: "Française • Bistro",
      location: "Plateau-Mont-Royal",
      rating: 4.8,
      reviewCount: 892,
      priceRange: "$$$",
      distance: "1.1 km",
      isOpen: true,
      deliveryTime: "30-45 min",
      image: "/lovable-uploads/64c3c5b4-0bea-428d-8a44-3f25301da946.png",
      tags: ["Authentique", "Brunch", "Vin"]
    },
    {
      id: 3,
      name: "Pho Lien",
      cuisine: "Vietnamienne • Soupe",
      location: "Chinatown",
      rating: 4.6,
      reviewCount: 654,
      priceRange: "$",
      distance: "2.3 km",
      isOpen: false,
      deliveryTime: "20-30 min",
      image: "/lovable-uploads/66b403fe-8178-4b2f-9737-0506dd1679dd.png",
      tags: ["Halal", "Végétarien", "Familial"]
    },
    {
      id: 4,
      name: "Gus Restaurant",
      cuisine: "Grecque • Méditerranéenne",
      location: "Park Extension",
      rating: 4.7,
      reviewCount: 423,
      priceRange: "$$",
      distance: "3.2 km",
      isOpen: true,
      deliveryTime: "25-35 min",
      image: "/lovable-uploads/6f7cb4c8-65ad-4d17-8773-ca603d754f03.png",
      tags: ["Terrasse", "Groupe", "Spécialités"]
    },
    {
      id: 5,
      name: "Bouillon Bilk",
      cuisine: "Moderne • Gastronomie",
      location: "Centre-ville",
      rating: 4.9,
      reviewCount: 187,
      priceRange: "$$$$",
      distance: "1.8 km",
      isOpen: true,
      deliveryTime: "45-60 min",
      image: "/lovable-uploads/682c5e51-0d17-4441-8054-a2dc04e70342.png",
      tags: ["Fine dining", "Date", "Chef renommé"]
    },
    {
      id: 6,
      name: "Wilensky's Light Lunch",
      cuisine: "Deli • Sandwichs",
      location: "Mile End",
      rating: 4.3,
      reviewCount: 765,
      priceRange: "$",
      distance: "0.7 km",
      isOpen: true,
      deliveryTime: "10-20 min",
      image: "/lovable-uploads/89ae520a-630b-40b2-9591-4e34d4b5eebc.png",
      tags: ["Historique", "Classique", "Rapide"]
    }
  ];

  return (
    <section className="py-8 sm:py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with controls */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                Tous les restaurants à proximité
              </h2>
              <p className="text-muted-foreground">
                {restaurants.length} restaurants trouvés
              </p>
            </div>

            {/* View mode toggles */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="px-3"
              >
                <Map className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filters and sort */}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Prix
            </Button>
            <Button variant="outline" size="sm">
              Ouvert maintenant
            </Button>
            <Button variant="outline" size="sm">
              Livraison
            </Button>
            <select 
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="distance">Distance</option>
              <option value="rating">Note</option>
              <option value="reviews">Avis</option>
              <option value="price">Prix</option>
            </select>
          </div>
        </div>

        {/* Restaurant Grid */}
        <div className={`grid gap-4 sm:gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {restaurants.map((restaurant) => (
            <Card 
              key={restaurant.id} 
              className={`overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white border border-border/20 ${
                viewMode === 'list' ? 'flex flex-row' : ''
              }`}
            >
              {/* Image */}
              <div className={`relative overflow-hidden ${
                viewMode === 'list' 
                  ? 'w-32 sm:w-48 flex-shrink-0' 
                  : 'aspect-[16/10]'
              }`}>
                <img 
                  src={restaurant.image} 
                  alt={restaurant.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
                
                {/* Status badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {restaurant.isOpen && (
                    <Badge className="bg-green-600 text-white text-xs font-medium">
                      <Clock className="h-3 w-3 mr-1" />
                      Ouvert
                    </Badge>
                  )}
                </div>

                {/* Price */}
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="bg-white/90 text-foreground text-xs font-medium">
                    {restaurant.priceRange}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className={`p-4 space-y-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                {/* Title and rating */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors truncate">
                      {restaurant.name}
                    </h3>
                    <p className="text-muted-foreground text-sm truncate">
                      {restaurant.cuisine}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 bg-primary/10 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-xs font-semibold text-primary">
                      {restaurant.rating}
                    </span>
                  </div>
                </div>

                {/* Location and details */}
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{restaurant.location}</span>
                    <span className="mx-2">•</span>
                    <span className="flex-shrink-0">{restaurant.distance}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span>{restaurant.deliveryTime}</span>
                    <span className="mx-2">•</span>
                    <span>{restaurant.reviewCount} avis</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {restaurant.tags.slice(0, viewMode === 'list' ? 2 : 3).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="text-xs px-2 py-0.5 border-border/40 text-muted-foreground"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {restaurant.tags.length > (viewMode === 'list' ? 2 : 3) && (
                    <Badge 
                      variant="outline" 
                      className="text-xs px-2 py-0.5 border-border/40 text-muted-foreground"
                    >
                      +{restaurant.tags.length - (viewMode === 'list' ? 2 : 3)}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Load more */}
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" className="px-8">
            Charger plus de restaurants
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RestaurantsDiscoverySection;