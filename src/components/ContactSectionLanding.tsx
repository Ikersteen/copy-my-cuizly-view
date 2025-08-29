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
    const email = `mailto:cuizlycanada@gmail.com?subject=${encodeURIComponent(formData.get('subject') as string)}&body=${encodeURIComponent(`De: ${formData.get('firstName')} ${formData.get('lastName')} (${formData.get('email')})\n\nMessage:\n${formData.get('message')}`)}`;
    window.location.href = email;
  };

  return (
    <section id="contact" className="py-16 sm:py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            {t('contactForm.title')}
          </h2>
          <p className="text-lg sm:text-xl text-cuizly-neutral px-2 sm:px-0">
            {t('contactForm.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          <div>
            <Card className="shadow-card border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">{t('contact.form.send')}</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {t('contactForm.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm">{t('contactForm.firstName')}</Label>
                      <Input id="firstName" name="firstName" placeholder="Iker" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm">{t('contact.form.name')}</Label>
                      <Input id="lastName" name="lastName" placeholder="Steen" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">{t('contact.form.email')}</Label>
                    <Input id="email" name="email" type="email" placeholder="votre@courriel.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm">Sujet</Label>
                    <Input id="subject" name="subject" placeholder="Comment pouvons-nous vous aider ?" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm">{t('contactForm.message')}</Label>
                    <Textarea 
                      id="message" 
                      name="message"
                      placeholder={t('contactForm.messagePlaceholder')}
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
                Informations de contact
              </h3>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cuizly-surface rounded-lg flex items-center justify-center">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-cuizly-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm sm:text-base">{t('contact.form.email')}</h4>
                    <p className="text-cuizly-neutral text-sm sm:text-base">cuizlycanada@gmail.com</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cuizly-surface rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-cuizly-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm sm:text-base">Adresse</h4>
                    <p 
                      className="text-cuizly-neutral text-sm sm:text-base"
                      dangerouslySetInnerHTML={{ __html: t('contactForm.address') }}
                    />
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cuizly-surface rounded-lg flex items-center justify-center">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-cuizly-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm sm:text-base">{t('contactForm.phone')}</h4>
                    <p className="text-cuizly-neutral text-sm sm:text-base">+1 (514) 465-4783</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                {t('contactForm.hours.title')}
              </h3>
              <div className="space-y-1 sm:space-y-2 text-cuizly-neutral text-sm sm:text-base">
                <p>{t('contactForm.hours.monday')}</p>
                <p>{t('contactForm.hours.weekend')}</p>
                <p>{t('contactForm.hours.sunday')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSectionLanding;