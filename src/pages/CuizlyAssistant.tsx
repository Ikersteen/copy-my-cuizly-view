import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";

const CuizlyAssistant = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center mb-8">
            Cuizly Assistant
          </h1>
          <p className="text-center text-lg text-muted-foreground">
            {t('common.comingSoon', 'Coming Soon')}
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CuizlyAssistant;
