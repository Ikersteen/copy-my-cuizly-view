import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from 'react-i18next';
import { Mail, MapPin, Phone } from "lucide-react";

const ContactSectionLanding = () => {
  const { t } = useTranslation();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = `mailto:Iker-ceo@cuizly.ca?subject=${encodeURIComponent(formData.get('subject') as string)}&body=${encodeURIComponent(`De: ${formData.get('firstName')} ${formData.get('lastName')} (${formData.get('email')})\n\nMessage:\n${formData.get('message')}`)}`;
    window.location.href = email;
  };

  return (
    <section id="contact" className="py-12 sm:py-16 lg:py-12 bg-background">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            {t('contact.title')}
          </h2>
          <p className="text-lg sm:text-xl text-cuizly-neutral px-2 sm:px-0">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-12">
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
                      <Input id="firstName" name="firstName" placeholder={t('contact.form.firstNamePlaceholder')} autoComplete="off" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm">{t('contact.form.lastName')}</Label>
                      <Input id="lastName" name="lastName" placeholder={t('contact.form.lastNamePlaceholder')} autoComplete="off" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">{t('contact.form.email')}</Label>
                    <Input id="email" name="email" type="email" placeholder={t('contact.form.emailPlaceholder')} autoComplete="off" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm">{t('contact.form.subject')}</Label>
                    <Input id="subject" name="subject" placeholder={t('contact.form.subjectPlaceholder')} autoComplete="off" required />
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
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-4 sm:mb-6">
                {t('contact.info.title')}
              </h3>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cuizly-surface rounded-lg flex items-center justify-center">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm sm:text-base">{t('contact.info.email.label')}</h4>
                    <p className="text-cuizly-neutral text-sm sm:text-base">{t('contact.info.email.value')}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cuizly-surface rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm sm:text-base">{t('contact.info.address.label')}</h4>
                    <p 
                      className="text-cuizly-neutral text-sm sm:text-base"
                      dangerouslySetInnerHTML={{ __html: t('contact.info.address.value') }}
                    />
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cuizly-surface rounded-lg flex items-center justify-center">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm sm:text-base">{t('contact.info.phone.label')}</h4>
                    <p className="text-cuizly-neutral text-sm sm:text-base">{t('contact.info.phone.value')}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSectionLanding;