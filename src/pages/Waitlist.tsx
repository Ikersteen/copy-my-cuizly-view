import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useLanguage } from "@/hooks/useLanguage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";

const Waitlist = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const hcaptchaRef = useRef<HCaptcha>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    company_name: "",
    phone: "",
    address: "",
    restaurant_type: "",
    message: ""
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Vérification hCaptcha
    if (!hcaptchaToken) {
      toast.error(t('waitlist.messages.captchaRequired'));
      setIsSubmitting(false);
      return;
    }

    try {
      // Pour l'instant, on sauvegarde en localStorage
      // TODO: Intégrer avec Supabase quand les types seront mis à jour
      const waitlistEntry = {
        ...formData,
        captcha_verified: true,
        created_at: new Date().toISOString(),
        id: crypto.randomUUID()
      };
      
      const existingEntries = JSON.parse(localStorage.getItem('waitlist_analytics') || '[]');
      existingEntries.push(waitlistEntry);
      localStorage.setItem('waitlist_analytics', JSON.stringify(existingEntries));

      setIsSubmitted(true);
      toast.success(t('waitlist.messages.success'));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('waitlist.messages.error'));
    } finally {
      setIsSubmitting(false);
      // Reset hCaptcha
      setHcaptchaToken(null);
      setCaptchaError(null);
      hcaptchaRef.current?.resetCaptcha();
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <Card className="text-center shadow-2xl border-border">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-foreground">
                  {t('waitlist.success.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  {t('waitlist.success.message')}
                </p>
                <Link to="/">
                  <Button className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('waitlist.success.backHome')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center bg-gradient-to-r from-primary/8 to-primary/12 border border-primary/15 px-4 py-2 rounded-full text-sm font-semibold text-primary mb-4">
              <Users className="mr-2 h-4 w-4" />
              {t('waitlist.badge')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {t('waitlist.title')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" dangerouslySetInnerHTML={{ __html: t('waitlist.subtitle') }}>
            </p>
          </div>

          {/* Form */}
          <Card className="shadow-2xl border-border">
            <CardHeader>
              <CardTitle className="text-xl text-foreground">
                {t('waitlist.form.title')}
              </CardTitle>
              <p className="text-muted-foreground">
                {t('waitlist.form.description')}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('waitlist.form.fullName')} {t('waitlist.form.required')}</Label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder={t('waitlist.form.fullNamePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('waitlist.form.email')} {t('waitlist.form.required')}</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder={t('waitlist.form.emailPlaceholder')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">{t('waitlist.form.restaurantName')} {t('waitlist.form.required')}</Label>
                    <Input
                      id="company"
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      placeholder={t('waitlist.form.restaurantNamePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('waitlist.form.phone')} {t('waitlist.form.required')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder={t('waitlist.form.phonePlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t('waitlist.form.address')} {t('waitlist.form.required')}</Label>
                  <Input
                    id="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder={t('waitlist.form.addressPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurant-type">{t('waitlist.form.restaurantType')} {t('waitlist.form.required')}</Label>
                  <Select value={formData.restaurant_type} onValueChange={(value) => handleChange('restaurant_type', value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t('waitlist.form.restaurantTypePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fine-dining">{t('waitlist.restaurantTypes.fineDining')}</SelectItem>
                      <SelectItem value="casual-dining">{t('waitlist.restaurantTypes.casualDining')}</SelectItem>
                      <SelectItem value="fast-casual">{t('waitlist.restaurantTypes.fastCasual')}</SelectItem>
                      <SelectItem value="cafe-bistro">{t('waitlist.restaurantTypes.cafeBistro')}</SelectItem>
                      <SelectItem value="food-truck">{t('waitlist.restaurantTypes.foodTruck')}</SelectItem>
                      <SelectItem value="bar-pub">{t('waitlist.restaurantTypes.barPub')}</SelectItem>
                      <SelectItem value="bakery">{t('waitlist.restaurantTypes.bakery')}</SelectItem>
                      <SelectItem value="other">{t('waitlist.restaurantTypes.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t('waitlist.form.message')}</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder={t('waitlist.form.messagePlaceholder')}
                    rows={3}
                  />
                </div>

                {/* hCaptcha */}
                <div className="space-y-2">
                  <Label>{t('waitlist.form.security')} {t('waitlist.form.required')}</Label>
                  <div className="captcha-container">
                     <HCaptcha
                       ref={hcaptchaRef}
                       sitekey="30de45b6-4d34-4bd6-99b0-4cea109482b8"
                       languageOverride={currentLanguage === 'fr' ? 'fr' : 'en'}
                       onVerify={(token) => {
                         setHcaptchaToken(token);
                         setCaptchaError(null);
                       }}
                       onExpire={() => {
                         setHcaptchaToken(null);
                         setCaptchaError(t('waitlist.messages.captchaExpired'));
                       }}
                       onError={() => {
                         setHcaptchaToken(null);
                         setCaptchaError(t('waitlist.messages.captchaError'));
                       }}
                     />
                  </div>
                  {captchaError && (
                    <p className="text-sm text-red-600">
                      {captchaError}
                    </p>
                  )}
                  {hcaptchaToken && (
                    <div className="flex items-center text-xs text-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {t('waitlist.form.verified')}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t('waitlist.form.back')}
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isSubmitting || !formData.email || !formData.name || !formData.company_name || !formData.phone || !formData.address || !formData.restaurant_type || !hcaptchaToken}
                  >
                    {isSubmitting ? t('waitlist.form.submitting') : t('waitlist.form.submit')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="mt-12 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('waitlist.benefits.title')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">{t('waitlist.benefits.priority.title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('waitlist.benefits.priority.description')}
                </p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">{t('waitlist.benefits.discount.title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('waitlist.benefits.discount.description')}
                </p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">{t('waitlist.benefits.training.title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('waitlist.benefits.training.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CTASection />
      <Footer />
    </>
  );
};

export default Waitlist;