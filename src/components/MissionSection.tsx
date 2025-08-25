import { Target } from "lucide-react";

const MissionSection = () => {
  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div className="flex items-center justify-center space-x-3 mb-8 sm:mb-10">
          <Target className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            Notre Mission
          </h2>
        </div>
        
        <div className="bg-muted/30 border border-border rounded-2xl p-8 sm:p-10 max-w-4xl mx-auto shadow-lg">
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed">
            Connecter les gens aux meilleures offres culinaires à Montréal, tout en aidant les restaurants à attirer plus de clients.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;