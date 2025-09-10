import { useTranslation } from 'react-i18next';

const MissionSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            {t('mission.title')}
          </h2>
        </div>
        
        <div className="bg-muted/30 border border-border rounded-2xl p-4 sm:p-8 lg:p-10 max-w-4xl mx-auto shadow-lg">
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
            {t('mission.description')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;