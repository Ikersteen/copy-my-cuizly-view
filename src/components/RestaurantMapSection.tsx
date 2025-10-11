import React, { useState } from 'react';
import MapboxMap from './MapboxMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Euro } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Restaurant {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  price_level?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: google.maps.places.PlacePhoto[];
}

const RestaurantMapSection = () => {
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const handleRestaurantsLoaded = (loadedRestaurants: Restaurant[]) => {
    setRestaurants(loadedRestaurants);
  };

  const getCuisineTypes = (types: string[]) => {
    const cuisineTypes = types.filter(type => 
      !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(type)
    );
    return cuisineTypes.slice(0, 3);
  };

  const renderPriceLevel = (level?: number) => {
    if (!level) return null;
    return (
      <div className="flex items-center">
        {Array.from({ length: 4 }, (_, i) => (
          <Euro 
            key={i} 
            className={`h-3 w-3 ${i < level ? 'text-green-500' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {t('restaurants.discoverMontreal')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('restaurants.exploreInteractiveMap')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardContent className="p-0 h-full">
                <MapboxMap 
                  center={{ lat: 45.5017, lng: -73.5673 }}
                  zoom={13}
                  onRestaurantsLoaded={handleRestaurantsLoaded}
                />
              </CardContent>
            </Card>
          </div>

          {/* Restaurant List */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] overflow-hidden">
              <CardHeader>
                 <CardTitle className="flex items-center">
                   <MapPin className="h-5 w-5 mr-2 text-primary" />
                   {t('restaurants.nearbyRestaurants')}
                 </CardTitle>
                 <p className="text-sm text-muted-foreground">
                   {restaurants.length} {t('restaurants.restaurantsFound')}
                 </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[480px] overflow-y-auto">
                  {restaurants.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                       <div className="text-center">
                         <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                         <p>{t('googleMap.loadingRestaurants')}</p>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4">
                      {restaurants.map((restaurant) => (
                        <Card 
                          key={restaurant.place_id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedRestaurant?.place_id === restaurant.place_id 
                              ? 'ring-2 ring-primary' 
                              : ''
                          }`}
                          onClick={() => setSelectedRestaurant(restaurant)}
                        >
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-sm mb-2 line-clamp-1">
                              {restaurant.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                              {restaurant.vicinity}
                            </p>
                            
                            <div className="flex items-center justify-between mb-2">
                              {restaurant.rating && (
                                <div className="flex items-center">
                                  <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                  <span className="text-xs font-medium">
                                    {restaurant.rating}
                                  </span>
                                </div>
                              )}
                              {renderPriceLevel(restaurant.price_level)}
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {getCuisineTypes(restaurant.types).map((type) => (
                                <Badge 
                                  key={type} 
                                  variant="secondary" 
                                  className="text-xs px-2 py-1"
                                >
                                  {type.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            💡 <strong>{t('restaurants.tip')}</strong> {t('restaurants.tipDescription')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default RestaurantMapSection;