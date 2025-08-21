import { Target } from "lucide-react";

const MissionVisionSection = () => {
  return (
    <div className="py-20">
      {/* Mission Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Target className="h-8 w-8 text-cuizly-accent" />
            <h2 className="text-3xl md:text-4xl font-bold text-cuizly-primary">
              Notre Mission
            </h2>
          </div>
          
          <p className="text-xl text-cuizly-neutral mb-8 leading-relaxed">
            Connecter les gens aux meilleures offres culinaires à Montréal, 
            tout en aidant les restaurants à attirer plus de clients.
          </p>
          
          <div className="space-y-4 mb-8 max-w-2xl mx-auto">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-cuizly-accent rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-cuizly-neutral text-left">
                Des recommandations personnalisées grâce à l'IA
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-cuizly-accent rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-cuizly-neutral text-left">
                Un écosystème gagnant-gagnant pour tous
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-cuizly-accent rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-cuizly-neutral text-left">
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