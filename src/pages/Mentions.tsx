import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { useTranslation } from "react-i18next";

const Mentions = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-cuizly-neutral hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('navigation.back_home')}
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold text-foreground mb-8">
          {t('mentions.title')}
        </h1>
        
        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('mentions.sections.editor.title')}</h2>
            <div className="text-cuizly-neutral space-y-2">
              <p><strong>{t('mentions.sections.editor.companyName')}</strong></p>
              <p><strong>{t('mentions.sections.editor.legalForm')}</strong></p>
              <p><strong>{t('mentions.sections.editor.address')}</strong></p>
              <p><strong>{t('mentions.sections.editor.email')}</strong></p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('mentions.sections.hosting.title')}</h2>
            <div className="text-cuizly-neutral space-y-2">
              <p><strong>{t('mentions.sections.hosting.host')}</strong></p>
              <p><strong>{t('mentions.sections.hosting.address')}</strong></p>
              <p><strong>{t('mentions.sections.hosting.website')}</strong></p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('mentions.sections.director.title')}</h2>
            <div className="text-cuizly-neutral">
              <p>{t('mentions.sections.director.name')}</p>
              <p>{t('mentions.sections.director.email')}</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('mentions.sections.intellectual.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('mentions.sections.intellectual.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('mentions.sections.personal.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('mentions.sections.personal.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('mentions.sections.liability.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('mentions.sections.liability.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('mentions.sections.law.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('mentions.sections.law.content')}
            </p>
          </section>
        </div>
      </div>
      <CTASection />
      <Footer />
    </div>
  );
};

export default Mentions;