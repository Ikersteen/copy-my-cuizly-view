import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Phone, Heart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface IOSRestaurantCardProps {
  restaurant: {
    id: string;
    name: string;
    cuisine: string;
    rating: number;
    reviewCount: number;
    priceRange: string;
    distance: string;
    image: string;
    address: string;
    isOpen: boolean;
    phone?: string;
    delivery: boolean;
    takeout: boolean;
  };
  onTap?: (restaurant: any) => void;
}

const IOSRestaurantCard = ({ restaurant, onTap }: IOSRestaurantCardProps) => {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };

  const handleCardTap = () => {
    onTap?.(restaurant);
  };

  return (
    <Card 
      className="group bg-card border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 active:scale-95 cursor-pointer"
      onClick={handleCardTap}
    >
      <CardContent className="p-0">
        {/* Restaurant Image */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={restaurant.image} 
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          
          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white/90 active:scale-90 transition-all duration-200"
            onClick={handleFavoriteToggle}
          >
            <Heart 
              className={`h-4 w-4 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-600'}`} 
            />
          </Button>

          {/* Status Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            <Badge 
              variant={restaurant.isOpen ? "default" : "secondary"}
              className="bg-white/90 text-black font-medium rounded-full px-3 py-1"
            >
              {restaurant.isOpen ? 'Ouvert' : 'Fermé'}
            </Badge>
            {restaurant.delivery && (
              <Badge className="bg-green-500/90 text-white font-medium rounded-full px-3 py-1">
                Livraison
              </Badge>
            )}
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="p-4 space-y-3">
          {/* Name and Cuisine */}
          <div>
            <h3 className="text-lg font-semibold text-foreground truncate mb-1">
              {restaurant.name}
            </h3>
            <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
          </div>

          {/* Rating and Reviews */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-foreground">{restaurant.rating}</span>
              <span className="text-sm text-muted-foreground">({restaurant.reviewCount})</span>
            </div>
            <div className="text-sm font-medium text-foreground">
              {restaurant.priceRange}
            </div>
          </div>

          {/* Location and Distance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 flex-1 min-w-0">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground truncate">{restaurant.address}</span>
            </div>
            <span className="text-sm font-medium text-primary ml-2">
              {restaurant.distance}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            {restaurant.phone && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl font-medium active:scale-95 transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`tel:${restaurant.phone}`);
                }}
              >
                <Phone className="h-4 w-4 mr-2" />
                Appeler
              </Button>
            )}
            <Button
              size="sm"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium active:scale-95 transition-all duration-200"
            >
              Voir le menu
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IOSRestaurantCard;