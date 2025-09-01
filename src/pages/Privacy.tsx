import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import MissionSection from "@/components/MissionSection";
import { useTranslation } from "react-i18next";

const Privacy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-cuizly-neutral hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('navigation.back_home')}
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold text-foreground mb-8">
          {t('privacy.title')}
        </h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-cuizly-neutral mb-6">
            {t('privacy.lastUpdated')}{new Date().toLocaleDateString('fr-CA')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.sections.introduction.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('privacy.sections.introduction.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.sections.collection.title')}</h2>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral">
              {(t('privacy.sections.collection.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.sections.usage.title')}</h2>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral">
              {(t('privacy.sections.usage.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.sections.sharing.title')}</h2>
            <p className="text-cuizly-neutral mb-4">
              {t('privacy.sections.sharing.content')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral">
              {(t('privacy.sections.sharing.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.sections.rights.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('privacy.sections.rights.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.sections.contact.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('privacy.sections.contact.content')}
              <br />{t('privacy.sections.contact.email')}
              <br />{t('privacy.sections.contact.address')}
            </p>
          </section>
        </div>
      </div>
      <MissionSection />
      <Footer />
    </div>
  );
};

export default Privacy;