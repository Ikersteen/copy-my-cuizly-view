import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { useTranslation } from "react-i18next";

const Cookies = () => {
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
          {t('cookies.title')}
        </h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-cuizly-neutral mb-6">
            {t('cookies.lastUpdated')}{new Date().toLocaleDateString('fr-CA')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('cookies.sections.what.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('cookies.sections.what.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('cookies.sections.types.title')}</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">{t('cookies.sections.types.essential.title')}</h3>
              <p className="text-cuizly-neutral">
                {t('cookies.sections.types.essential.content')}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">{t('cookies.sections.types.performance.title')}</h3>
              <p className="text-cuizly-neutral">
                {t('cookies.sections.types.performance.content')}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">{t('cookies.sections.types.functionality.title')}</h3>
              <p className="text-cuizly-neutral">
                {t('cookies.sections.types.functionality.content')}
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('cookies.sections.management.title')}</h2>
            <p className="text-cuizly-neutral mb-4">
              {t('cookies.sections.management.content1')}
            </p>
            
            <p className="text-cuizly-neutral mb-4">
              {t('cookies.sections.management.content2')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('cookies.sections.disable.title')}</h2>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral">
              <li><strong>{t('cookies.sections.disable.chrome')}</strong></li>
              <li><strong>{t('cookies.sections.disable.firefox')}</strong></li>
              <li><strong>{t('cookies.sections.disable.safari')}</strong></li>
              <li><strong>{t('cookies.sections.disable.edge')}</strong></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('cookies.sections.third.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('cookies.sections.third.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('cookies.sections.editor.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('cookies.sections.editor.company')}
              <br />{t('cookies.sections.editor.form')}
              <br />{t('cookies.sections.editor.address')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('cookies.sections.director.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('cookies.sections.director.name')}
              <br />{t('cookies.sections.director.email')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('cookies.sections.contact.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('cookies.sections.contact.content')}
              <br />{t('cookies.sections.contact.email')}
              <br />{t('cookies.sections.contact.address')}
            </p>
          </section>
        </div>
      </div>
      <CTASection />
      <Footer />
    </div>
  );
};

export default Cookies;