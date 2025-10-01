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
            {t('cookies.lastUpdated')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('cookies.sections.what.title')}</h2>
            {(t('cookies.sections.what.paragraphs', { returnObjects: true }) as string[]).map((paragraph: string, index: number) => (
              <p key={index} className="text-cuizly-neutral mb-4">
                {paragraph}
              </p>
            ))}
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('cookies.sections.types.title')}</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">{t('cookies.sections.types.essential.title')}</h3>
              <p className="text-cuizly-neutral mb-2">
                {t('cookies.sections.types.essential.content')}
              </p>
              <ul className="list-disc pl-6 space-y-1 text-cuizly-neutral">
                {(t('cookies.sections.types.essential.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">{t('cookies.sections.types.performance.title')}</h3>
              <p className="text-cuizly-neutral mb-2">
                {t('cookies.sections.types.performance.content')}
              </p>
              <p className="text-cuizly-neutral italic">
                {t('cookies.sections.types.performance.objective')}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">{t('cookies.sections.types.functionality.title')}</h3>
              <p className="text-cuizly-neutral mb-2">
                {t('cookies.sections.types.functionality.content')}
              </p>
              <p className="text-cuizly-neutral italic">
                {t('cookies.sections.types.functionality.objective')}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">{t('cookies.sections.types.thirdParty.title')}</h3>
              <p className="text-cuizly-neutral mb-2">
                {t('cookies.sections.types.thirdParty.content')}
              </p>
              <ul className="list-disc pl-6 space-y-1 text-cuizly-neutral mb-2">
                {(t('cookies.sections.types.thirdParty.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="text-cuizly-neutral">
                {t('cookies.sections.types.thirdParty.footer')}
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('cookies.sections.management.title')}</h2>
            <p className="text-cuizly-neutral mb-3">
              {t('cookies.sections.management.content')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral mb-3">
              {(t('cookies.sections.management.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-cuizly-neutral">
              {t('cookies.sections.management.warning')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('cookies.sections.disable.title')}</h2>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral">
              <li><strong>Chrome</strong> : {t('cookies.sections.disable.chrome')}</li>
              <li><strong>Firefox</strong> : {t('cookies.sections.disable.firefox')}</li>
              <li><strong>Safari</strong> : {t('cookies.sections.disable.safari')}</li>
              <li><strong>Edge</strong> : {t('cookies.sections.disable.edge')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('cookies.sections.retention.title')}</h2>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral">
              {(t('cookies.sections.retention.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('cookies.sections.editor.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('cookies.sections.editor.company')}
              <br />{t('cookies.sections.editor.form')}
              <br />{t('cookies.sections.editor.address')}
              <br /><br />{t('cookies.sections.editor.director')}
              <br />{t('cookies.sections.editor.directorName')}
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