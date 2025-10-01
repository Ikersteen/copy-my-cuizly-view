import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { useTranslation } from "react-i18next";

const Terms = () => {
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
          {t('terms.title')}
        </h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-cuizly-neutral mb-6">
            {t('terms.lastUpdated')}
          </p>

          <p className="text-cuizly-neutral mb-8">
            {t('terms.intro')}
          </p>

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.acceptance.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.acceptance.content')}
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.service.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.service.content')}
            </p>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.eligibility.title')}</h2>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral">
              {(t('terms.sections.eligibility.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.acceptable.title')}</h2>
            <p className="text-cuizly-neutral mb-2">{t('terms.sections.acceptable.intro')}</p>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral">
              {(t('terms.sections.acceptable.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.intellectual.title')}</h2>
            {(t('terms.sections.intellectual.paragraphs', { returnObjects: true }) as string[]).map((para: string, index: number) => (
              <p key={index} className="text-cuizly-neutral mb-4">{para}</p>
            ))}
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.userContent.title')}</h2>
            {(t('terms.sections.userContent.paragraphs', { returnObjects: true }) as string[]).map((para: string, index: number) => (
              <p key={index} className="text-cuizly-neutral mb-4">{para}</p>
            ))}
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.thirdParty.title')}</h2>
            {(t('terms.sections.thirdParty.paragraphs', { returnObjects: true }) as string[]).map((para: string, index: number) => (
              <p key={index} className="text-cuizly-neutral mb-4">{para}</p>
            ))}
          </section>

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.payment.title')}</h2>
            {(t('terms.sections.payment.paragraphs', { returnObjects: true }) as string[]).map((para: string, index: number) => (
              <p key={index} className="text-cuizly-neutral mb-4">{para}</p>
            ))}
          </section>

          {/* Section 9 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.privacy.title')}</h2>
            {(t('terms.sections.privacy.paragraphs', { returnObjects: true }) as string[]).map((para: string, index: number) => (
              <p key={index} className="text-cuizly-neutral mb-4">{para}</p>
            ))}
          </section>

          {/* Section 10 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.thirdPartyServices.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.thirdPartyServices.content')}
            </p>
          </section>

          {/* Section 11 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.warranties.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.warranties.content')}
            </p>
          </section>

          {/* Section 12 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.liability.title')}</h2>
            {(t('terms.sections.liability.paragraphs', { returnObjects: true }) as string[]).map((para: string, index: number) => (
              <p key={index} className="text-cuizly-neutral mb-4">{para}</p>
            ))}
          </section>

          {/* Section 13 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.indemnification.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.indemnification.content')}
            </p>
          </section>

          {/* Section 14 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.modifications.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.modifications.content')}
            </p>
          </section>

          {/* Section 15 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.termination.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.termination.content')}
            </p>
          </section>

          {/* Section 16 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.law.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.law.content')}
            </p>
          </section>

          {/* Section 17 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.communications.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.communications.content')}
            </p>
          </section>

          {/* Section 18 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.reporting.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.reporting.content')}
            </p>
          </section>

          {/* Section 19 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.sections.general.title')}</h2>
            <p className="text-cuizly-neutral">
              {t('terms.sections.general.content')}
            </p>
          </section>

          {/* Section 20 */}
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
      <CTASection />
      <Footer />
    </div>
  );
};

export default Terms;