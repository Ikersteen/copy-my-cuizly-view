import { Code, Brain, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TeamSection = () => {
  const founders = [
    {
      name: "Alexandre Dubois",
      role: "CEO & Co-fondateur",
      background: "Ex-Uber Canada, 8 ans en tech",
      expertise: "Go-to-market & croissance",
      icon: TrendingUp,
      description: "A dirigé l'expansion d'Uber à Montréal. Expert en croissance et marchés locaux.",
      color: "text-cuizly-primary"
    },
    {
      name: "Sarah Chen",
      role: "CTO & Co-fondatrice", 
      background: "Ex-Google AI, PhD McGill",
      expertise: "Intelligence artificielle",
      icon: Brain,
      description: "10 ans en IA/ML. A développé des systèmes de recommandation pour 100M+ utilisateurs.",
      color: "text-cuizly-accent"
    },
    {
      name: "Marc Tremblay",
      role: "Head of Engineering",
      background: "Ex-Shopify, Lead Developer",
      expertise: "Architecture & scalabilité",
      icon: Code,
      description: "Expert en systèmes distribués. A scalé des plateformes à millions d'utilisateurs.",
      color: "text-cuizly-secondary"
    }
  ];

  const advisors = [
    "🍽️ **Jean-François Archambault** - Fondateur de La Tablée des Chefs",
    "🚀 **Marie Poulin** - Ex-VP Investissement Québec, expert fundraising", 
    "🧠 **Dr. Yoshua Bengio** - Pioneer AI, Institut MILA",
    "💼 **David Nault** - Ex-CEO OpenTable Canada"
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cuizly-primary mb-4">
            Une équipe <span className="text-cuizly-accent">d'exception</span>
          </h2>
          <p className="text-base sm:text-lg text-cuizly-neutral max-w-3xl mx-auto">
            Des fondateurs expérimentés, une expertise technique de pointe, 
            et des conseillers stratégiques reconnus dans l'industrie.
          </p>
        </div>

        {/* Founders */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {founders.map((founder, index) => {
            const Icon = founder.icon;
            return (
              <Card key={index} className="border-cuizly-accent/20 bg-background/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-cuizly-light/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className={`h-8 w-8 ${founder.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-cuizly-primary mb-1">
                    {founder.name}
                  </h3>
                  <div className="text-sm font-semibold text-cuizly-accent mb-2">
                    {founder.role}
                  </div>
                  <div className="text-xs text-cuizly-secondary mb-3 font-medium">
                    {founder.background}
                  </div>
                  <p className="text-xs text-cuizly-neutral leading-relaxed mb-3">
                    {founder.description}
                  </p>
                  <div className="inline-block px-3 py-1 bg-cuizly-accent/10 text-cuizly-accent text-xs rounded-full font-medium">
                    {founder.expertise}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Why This Team */}
        <div className="bg-gradient-to-r from-cuizly-primary/10 to-cuizly-accent/10 border border-cuizly-accent/20 rounded-xl p-6 sm:p-8 mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-cuizly-primary mb-4 text-center">
            🎯 Pourquoi cette équipe gagnera
          </h3>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-cuizly-accent mb-2">25+ ans</div>
              <div className="text-sm text-cuizly-neutral">D'expérience combinée en tech</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cuizly-accent mb-2">3 exits</div>
              <div className="text-sm text-cuizly-neutral">Réussies dans l'équipe</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cuizly-accent mb-2">100%</div>
              <div className="text-sm text-cuizly-neutral">Commitment temps plein</div>
            </div>
          </div>
        </div>

        {/* Advisors */}
        <div className="bg-white/5 border border-cuizly-accent/20 rounded-xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-cuizly-primary mb-6 text-center flex items-center justify-center gap-2">
            <Users className="h-5 w-5 text-cuizly-accent" />
            Conseillers stratégiques
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {advisors.map((advisor, index) => (
              <div 
                key={index}
                className="text-sm text-cuizly-neutral p-3 bg-background/30 rounded-lg"
              >
                {advisor}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;