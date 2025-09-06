import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Import theme images
import themeGourmandModerne from "@/assets/theme-gourmand-moderne.jpg";
import themeMinuitGastronomique from "@/assets/theme-minuit-gastronomique.jpg";
import themeJardinMediterraneen from "@/assets/theme-jardin-mediterraneen.jpg";
import themeChefPremium from "@/assets/theme-chef-premium.jpg";

const themes = [
  {
    id: 1,
    name: "Gourmand Moderne",
    description: "Orange doré chaud, crème élégant, rouge épicé - évoque la chaleur des cuisines",
    image: themeGourmandModerne,
    colors: ["#FF8A00", "#FFF8F0", "#E53E3E"]
  },
  {
    id: 2,
    name: "Minuit Gastronomique",
    description: "Noir charbon profond, or rose métallique, vert olive sophistiqué",
    image: themeMinuitGastronomique,
    colors: ["#1A1A1A", "#D4A574", "#8B956D"]
  },
  {
    id: 3,
    name: "Jardin Méditerranéen",
    description: "Vert olive authentique, terracotta chaleureux, bleu méditerranéen",
    image: themeJardinMediterraneen,
    colors: ["#6B7B47", "#D2691E", "#4A90B8"]
  },
  {
    id: 4,
    name: "Chef Premium",
    description: "Noir intense, argent métallique, rouge cerise - style haute gastronomie",
    image: themeChefPremium,
    colors: ["#000000", "#C0C0C0", "#DC143C"]
  }
];

const ThemePreview = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Aperçu des Thèmes Cuizly</h1>
            <p className="text-muted-foreground">Choisissez le thème qui vous inspire le plus</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {themes.map((theme) => (
            <Card key={theme.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {theme.name}
                  <div className="flex gap-1">
                    {theme.colors.map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </CardTitle>
                <CardDescription>{theme.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <img
                  src={theme.image}
                  alt={`Aperçu du thème ${theme.name}`}
                  className="w-full h-64 object-cover"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Quel thème souhaitez-vous appliquer à Cuizly ?
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThemePreview;