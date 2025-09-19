import { useTranslation } from 'react-i18next';
import performanceImage from '@/assets/cuizly-tableau-performances.jpg';
import performanceMobileImage from '@/assets/cuizly-performance-mobile.jpg';

const PerformanceDashboardSection = () => {
  const { t } = useTranslation();

  return (
    <div className="py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 mb-8 sm:mb-12">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t('analytics.title')}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('analytics.subtitle')}
          </p>
        </div>
      </div>
      
      <div className="w-full">
        <div className="w-full rounded-xl overflow-hidden bg-muted">
          {/* Image mobile */}
          <img 
            src={performanceMobileImage} 
            alt="Tableau de performance Cuizly montrant les métriques en temps réel"
            className="w-full h-auto object-contain block md:hidden"
          />
          {/* Image desktop */}
          <img 
            src={performanceImage} 
            alt="Tableau de performance Cuizly montrant les métriques en temps réel"
            className="w-full h-auto object-contain hidden md:block"
          />
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboardSection;