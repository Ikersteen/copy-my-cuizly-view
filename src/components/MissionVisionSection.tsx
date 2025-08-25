import { Brain, Users, Search } from "lucide-react";

const MissionVisionSection = () => {
  const features = [
    {
      icon: Brain,
      title: "Des recommandations personnalisées grâce à l'IA",
      description: "Notre intelligence artificielle analyse vos préférences pour vous suggérer les meilleurs restaurants selon vos goûts.",
      color: "text-cuizly-primary"
    },
    {
      icon: Users,
      title: "Un écosystème gagnant-gagnant pour tous",
      description: "Les restaurants augmentent leur visibilité et leurs ventes, tandis que les clients découvrent de nouvelles saveurs.",
      color: "text-cuizly-accent"
    },
    {
      icon: Search,
      title: "La découverte culinaire réinventée",
      description: "Explorez la scène culinaire montréalaise d'une façon complètement nouvelle et intuitive.",
      color: "text-cuizly-secondary"
    }
  ];

  return (
    <div className="pt-4 pb-12 sm:pt-6 sm:pb-16 md:pt-8 md:pb-20">
      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-12">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cuizly-primary">
              Les fonctionnalités
            </h2>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="bg-white/5 backdrop-blur-sm border border-cuizly-accent/10 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-all duration-300 hover:border-cuizly-accent/20">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-cuizly-light/20 rounded-full flex items-center justify-center">
                    <IconComponent className={`h-6 w-6 sm:h-8 sm:w-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-cuizly-primary leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-cuizly-neutral leading-relaxed text-sm sm:text-base">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default MissionVisionSection;