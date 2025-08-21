import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";

const RestaurantsSection = () => {
  const restaurants = [
    {
      id: 1,
      name: "Steen food",
      location: "Montréal",
      rating: 4.8,
      cuisine: "Nganda ntaba",
      category: "Cuisine variée"
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
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-cuizly-primary mb-4">
            Restaurants populaires
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id} className="p-6 bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-cuizly-primary mb-1 group-hover:text-cuizly-accent transition-colors">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {restaurant.location}
                  </div>
                </div>
                <div className="flex items-center space-x-1 bg-cuizly-accent/10 px-2 py-1 rounded-full">
                  <Star className="h-4 w-4 fill-cuizly-accent text-cuizly-accent" />
                  <span className="text-sm font-medium text-cuizly-accent">{restaurant.rating}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-foreground font-medium">{restaurant.cuisine}</p>
                <Badge variant="secondary" className="text-xs">
                  {restaurant.category}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RestaurantsSection;