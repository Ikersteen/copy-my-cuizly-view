import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Users, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import restaurantOwnerImage from "@/assets/restaurant-owner.jpg";
import montrealFoodSceneImage from "@/assets/montreal-food-scene.jpg";

const MissionVisionSection = () => {
  return (
    <div className="py-20 space-y-20">
      {/* Mission Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <img 
                src={montrealFoodSceneImage} 
                alt="Scène culinaire de Montréal"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <div className="flex items-center space-x-3 mb-6">
              <Target className="h-8 w-8 text-cuizly-accent" />
              <h2 className="text-3xl md:text-4xl font-bold text-cuizly-primary">
                Notre Mission
              </h2>
            </div>
            
            <p className="text-xl text-cuizly-neutral mb-8 leading-relaxed">
              Connecter les gens aux meilleures offres culinaires à Montréal, 
              tout en aidant les restaurants à attirer plus de clients.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-cuizly-accent rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-cuizly-neutral">
                  Des recommandations personnalisées grâce à l'IA
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-cuizly-accent rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-cuizly-neutral">
                  Un écosystème gagnant-gagnant pour tous
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-cuizly-accent rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-cuizly-neutral">
                  La découverte culinaire réinventée
                </p>
              </div>
            </div>

            <Link to="/auth">
              <Button size="lg" className="bg-cuizly-accent hover:bg-cuizly-accent/90 text-white">
                Rejoignez l'aventure
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="bg-gradient-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Eye className="h-8 w-8 text-cuizly-primary" />
                <h2 className="text-3xl md:text-4xl font-bold text-cuizly-primary">
                  Notre Vision
                </h2>
              </div>
              
              <p className="text-xl text-cuizly-neutral mb-8 leading-relaxed">
                Devenir l'app incontournable au Canada pour découvrir facilement 
                où bien manger, au bon prix, grâce à l'IA.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="bg-background/50 border-primary/10">
                  <CardContent className="p-6">
                    <Users className="h-8 w-8 text-cuizly-accent mb-3" />
                    <h3 className="font-semibold text-cuizly-primary mb-2">Pour les Gourmets</h3>
                    <p className="text-sm text-cuizly-neutral">
                      Découvrez les meilleures promos au bon moment
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-background/50 border-primary/10">
                  <CardContent className="p-6">
                    <TrendingUp className="h-8 w-8 text-cuizly-primary mb-3" />
                    <h3 className="font-semibold text-cuizly-primary mb-2">Pour les Restaurants</h3>
                    <p className="text-sm text-cuizly-neutral">
                      Attirez plus de clients avec nos outils intelligents
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="inline-flex items-center space-x-2 bg-cuizly-primary/10 backdrop-blur-sm rounded-full px-6 py-3">
                <span className="text-lg">🇨🇦</span>
                <span className="text-sm font-medium text-cuizly-primary">Expansion prévue</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-cuizly-accent font-medium">Tout le Canada</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <img 
                  src={restaurantOwnerImage} 
                  alt="Restaurateur utilisant la technologie Cuizly"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-cuizly-primary/20 to-transparent"></div>
              </div>
              
              {/* Floating stats */}
              <div className="absolute -top-6 -right-6 bg-background shadow-lg rounded-xl p-4 border border-primary/20">
                <div className="text-2xl font-bold text-cuizly-primary">500+</div>
                <div className="text-xs text-cuizly-neutral">Restaurants</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MissionVisionSection;