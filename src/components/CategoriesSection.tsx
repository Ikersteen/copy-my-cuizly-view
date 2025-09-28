import { Button } from "@/components/ui/button";
import { 
  UtensilsCrossed, 
  Pizza, 
  Coffee, 
  Wine, 
  Fish, 
  Cookie,
  Salad,
  MapPin
} from "lucide-react";
import { useTranslation } from "react-i18next";

const CategoriesSection = () => {
  const { t } = useTranslation();

  const categories = [
    { name: "Pizza", icon: Pizza, color: "bg-red-100 text-red-700" },
    { name: "Café", icon: Coffee, color: "bg-amber-100 text-amber-700" },
    { name: "Sushi", icon: Fish, color: "bg-blue-100 text-blue-700" },
    { name: "Bar", icon: Wine, color: "bg-purple-100 text-purple-700" },
    { name: "Desserts", icon: Cookie, color: "bg-pink-100 text-pink-700" },
    { name: "Santé", icon: Salad, color: "bg-green-100 text-green-700" },
    { name: "Gastronomie", icon: UtensilsCrossed, color: "bg-indigo-100 text-indigo-700" },
    { name: "À proximité", icon: MapPin, color: "bg-orange-100 text-orange-700" }
  ];

  return (
    <section className="py-8 sm:py-12 bg-background border-b border-border/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Parcourir par catégorie
          </h2>
          <p className="text-muted-foreground">
            Trouvez exactement ce que vous cherchez
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Button
                key={category.name}
                variant="ghost"
                className="h-auto flex flex-col items-center p-4 sm:p-6 hover:bg-muted/50 transition-all duration-300 rounded-xl border border-transparent hover:border-border/30 hover:shadow-sm group"
              >
                <div className={`p-3 sm:p-4 rounded-full mb-2 sm:mb-3 ${category.color} group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground text-center leading-tight">
                  {category.name}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;