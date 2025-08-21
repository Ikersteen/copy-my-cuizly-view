const StatsSection = () => {
  const stats = [
    {
      number: "500+",
      label: "Restaurants partenaires",
      icon: "🍽️"
    },
    {
      number: "IA",
      label: "Recommandations personnalisées",
      icon: "🤖"
    },
    {
      number: "MTL",
      label: "Montréal & environs",
      icon: "🏙️"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="mb-4 text-4xl">{stat.icon}</div>
              <div className="text-3xl font-bold text-cuizly-primary mb-2">{stat.number}</div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;