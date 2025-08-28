const MissionSection = () => {
  return (
    <section className="py-20 sm:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-background to-muted/20 border border-border/50 rounded-3xl p-12 sm:p-16 lg:p-20 shadow-2xl backdrop-blur-sm">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-8">
              Notre Mission
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl sm:text-2xl lg:text-3xl text-foreground/90 leading-relaxed font-light">
              Connecter les gens aux meilleures offres culinaires à Montréal, tout en aidant les restaurants à attirer plus de clients.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;