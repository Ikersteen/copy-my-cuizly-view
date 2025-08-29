import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

const Terms = () => {
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
          {t('terms.title')}
        </h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-cuizly-neutral mb-6">
            {t('terms.lastUpdated')}{new Date().toLocaleDateString('fr-CA')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.acceptance.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.acceptance.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.service.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.service.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.responsibilities.title')}</h2>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral">
              {(t('terms.sections.responsibilities.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.intellectual.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.intellectual.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.liability.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.liability.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.modifications.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.modifications.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.contact.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.contact.content')}
              <br />{t('terms.sections.contact.email')}
              <br />{t('terms.sections.contact.address')}
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;