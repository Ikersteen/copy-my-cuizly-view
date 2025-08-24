import { Target } from "lucide-react";

const MissionSection = () => {
  return (
    <section className="py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
          <Target className="h-6 w-6 sm:h-8 sm:w-8 text-cuizly-accent" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cuizly-primary">
            Notre Mission
          </h2>
        </div>
        
        <div className="bg-cuizly-light/10 border border-cuizly-accent/20 rounded-lg p-6 sm:p-8 max-w-3xl mx-auto">
          <p className="text-base sm:text-lg text-cuizly-neutral leading-relaxed">
            Connecter les gens aux meilleures offres culinaires à Montréal, tout en aidant les restaurants à attirer plus de clients.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;