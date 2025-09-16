import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Eye, Star, BarChart3 } from "lucide-react";

const PerformanceDashboardSection = () => {
  const analyticsData = [
    {
      icon: BarChart3,
      value: "0",
      label: "Offres totales",
      sublabel: "0 actives",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
    },
    {
      icon: Calendar,
      value: "1",
      label: "Menus ajoutés",
      sublabel: "1 actifs",
      color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
    },
    {
      icon: Eye,
      value: "17",
      label: "Vues du profil",
      sublabel: "Vues totales",
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
    },
    {
      icon: Star,
      value: "2.0",
      label: "Note moyenne",
      sublabel: "Sur 5 étoiles",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Tableau de performance en temps réel
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Suivez vos données en temps réel et boostez les performances de votre restaurant.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="p-6 shadow-lg border border-border">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-foreground">
                Aperçus sur les performances par segment (Mise à jour en temps réel)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {analyticsData.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Card key={index} className={`p-6 ${item.color} border-0`}>
                      <div className="flex flex-col items-center text-center">
                        <Icon className="h-6 w-6 mb-3" />
                        <div className="text-3xl font-bold mb-2">{item.value}</div>
                        <div className="font-medium text-sm mb-1">{item.label}</div>
                        <div className="text-xs opacity-80">{item.sublabel}</div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-foreground">Tendances cette semaine</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">+100% de vues par rapport à la semaine dernière</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium rounded-full">
                    Tendance positive
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PerformanceDashboardSection;