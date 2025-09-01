import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { useTranslation } from 'react-i18next';

const Contact = () => {
  const { t } = useTranslation();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = `mailto:cuizlycanada@gmail.com?subject=${encodeURIComponent(formData.get('subject') as string)}&body=${encodeURIComponent(`De: ${formData.get('firstName')} ${formData.get('lastName')} (${formData.get('email')})\n\nMessage:\n${formData.get('message')}`)}`;
    window.location.href = email;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-4 sm:mb-6">
          <Link to="/" className="inline-flex items-center text-cuizly-neutral hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('navigation.back_home')}
          </Link>
        </div>
        
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-lg sm:text-xl text-cuizly-neutral px-2 sm:px-0">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          <div>
            <Card className="shadow-card border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">{t('contact.form.title')}</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {t('contact.form.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm">{t('contact.form.firstName')}</Label>
                      <Input id="firstName" name="firstName" placeholder={t('contact.form.firstNamePlaceholder')} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm">{t('contact.form.lastName')}</Label>
                      <Input id="lastName" name="lastName" placeholder={t('contact.form.lastNamePlaceholder')} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">{t('contact.form.email')}</Label>
                    <Input id="email" name="email" type="email" placeholder={t('contact.form.emailPlaceholder')} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm">{t('contact.form.subject')}</Label>
                    <Input id="subject" name="subject" placeholder={t('contact.form.subjectPlaceholder')} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm">{t('contact.form.message')}</Label>
                    <Textarea 
                      id="message" 
                      name="message"
                      placeholder={t('contact.form.messagePlaceholder')}
                      className="min-h-[100px] sm:min-h-[120px]"
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full bg-foreground hover:bg-foreground/90 text-background text-sm sm:text-base">
                    {t('contact.form.send')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4 sm:mb-6">
                {t('contact.info.title')}
              </h2>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cuizly-surface rounded-lg flex items-center justify-center">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm sm:text-base">{t('contact.info.email.label')}</h3>
                    <p className="text-cuizly-neutral text-sm sm:text-base">{t('contact.info.email.value')}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cuizly-surface rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm sm:text-base">{t('contact.info.address.label')}</h3>
                    <p className="text-cuizly-neutral text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: t('contact.info.address.value') }} />
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cuizly-surface rounded-lg flex items-center justify-center">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm sm:text-base">{t('contact.info.phone.label')}</h3>
                    <p className="text-cuizly-neutral text-sm sm:text-base">{t('contact.info.phone.value')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                {t('contact.hours.title')}
              </h2>
              <div className="space-y-1 sm:space-y-2 text-cuizly-neutral text-sm sm:text-base">
                <p>{t('contact.hours.weekdays')}</p>
                <p>{t('contact.hours.saturday')}</p>
                <p>{t('contact.hours.sunday')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CTASection />
      <Footer />
    </div>
  );
};

export default Contact;