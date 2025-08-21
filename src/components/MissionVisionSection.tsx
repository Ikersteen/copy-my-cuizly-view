import { Target } from "lucide-react";

const MissionVisionSection = () => {
  return (
    <div className="py-12 sm:py-16 md:py-20">
      {/* Mission Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <Target className="h-6 w-6 sm:h-8 sm:w-8 text-cuizly-accent" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cuizly-primary">
              Notre Mission
            </h2>
          </div>
          
          <p className="text-lg sm:text-xl text-cuizly-neutral mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
            Connecter les gens aux meilleures offres culinaires à Montréal, 
            tout en aidant les restaurants à attirer plus de clients.
          </p>
          
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 max-w-2xl mx-auto px-4 sm:px-0">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-cuizly-accent rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-cuizly-neutral text-left text-sm sm:text-base">
                Des recommandations personnalisées grâce à l'IA
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-cuizly-accent rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-cuizly-neutral text-left text-sm sm:text-base">
                Un écosystème gagnant-gagnant pour tous
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-cuizly-accent rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-cuizly-neutral text-left text-sm sm:text-base">
                La découverte culinaire réinventée
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MissionVisionSection;