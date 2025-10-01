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
              <p>{t('mentions.sections.editor.companyName')}</p>
              <p>{t('mentions.sections.editor.legalForm')}</p>
              <p>{t('mentions.sections.editor.address')}</p>
              <p>{t('mentions.sections.editor.email')}</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('mentions.sections.hosting.title')}</h2>
            <div className="text-cuizly-neutral space-y-2">
              <p>{t('mentions.sections.hosting.host')}</p>
              <p>{t('mentions.sections.hosting.address')}</p>
              <p>{t('mentions.sections.hosting.website')}</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('mentions.sections.director.title')}</h2>
            <div className="text-cuizly-neutral space-y-2">
              <p>{t('mentions.sections.director.name')}</p>
              <p>{t('mentions.sections.director.function')}</p>
              <p>{t('mentions.sections.director.email')}</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('mentions.sections.intellectual.title')}</h2>
            <div className="text-cuizly-neutral space-y-4">
              <p>{t('mentions.sections.intellectual.intro')}</p>
              <p>{t('mentions.sections.intellectual.p1')}</p>
              <p>{t('mentions.sections.intellectual.p2')}</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('mentions.sections.userContent.title')}</h2>
            <div className="text-cuizly-neutral space-y-4">
              <p>{t('mentions.sections.userContent.intro')}</p>
              <p className="font-semibold">{t('mentions.sections.userContent.guarantee')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('mentions.sections.userContent.guaranteeItems.0')}</li>
                <li>{t('mentions.sections.userContent.guaranteeItems.1')}</li>
                <li>{t('mentions.sections.userContent.guaranteeItems.2')}</li>
              </ul>
              <p>{t('mentions.sections.userContent.rights')}</p>
              <p>{t('mentions.sections.userContent.moderation')}</p>
              <p>{t('mentions.sections.userContent.responsibility')}</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('mentions.sections.personal.title')}</h2>
            <div className="text-cuizly-neutral space-y-4">
              <p>{t('mentions.sections.personal.content')}</p>
              <p>{t('mentions.sections.personal.contact')}</p>
              <p>{t('mentions.sections.personal.link')}</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('mentions.sections.liability.title')}</h2>
            <div className="text-cuizly-neutral space-y-4">
              <p>{t('mentions.sections.liability.availability')}</p>
              <p>{t('mentions.sections.liability.usage')}</p>
              <p>{t('mentions.sections.liability.equipment')}</p>
              <p>{t('mentions.sections.liability.externalLinks')}</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('mentions.sections.law.title')}</h2>
            <div className="text-cuizly-neutral space-y-4">
              <p>{t('mentions.sections.law.applicableLaw')}</p>
              <p>{t('mentions.sections.law.jurisdiction')}</p>
            </div>
          </section>
        </div>
      </div>
      <CTASection />
      <Footer />
    </div>
  );
};

export default Mentions;