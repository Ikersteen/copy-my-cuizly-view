import { useTranslation } from 'react-i18next';
import performanceImage from '@/assets/cuizly-tableau-performances.jpg';

const PerformanceDashboardSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Tableau de performance en temps réel
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Suivez vos données en temps réel et boostez les performances de votre restaurant.
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="w-full max-w-5xl">
            <img 
              src={performanceImage} 
              alt="Tableau de performance Cuizly montrant les métriques en temps réel"
              className="w-full h-auto rounded-2xl shadow-lg border border-border"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PerformanceDashboardSection;