import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Linkedin, Mail } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Team = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-6 sm:py-8 bg-gradient-to-br from-background to-muted/30">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              {t('team.title')}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('team.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Team Member Section */}
      <section className="py-6 sm:py-8 lg:py-12 bg-background">
        <div className="max-w-3xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <Card className="max-w-3xl mx-auto shadow-lg border-0 bg-gradient-to-br from-card to-card/80">
            <CardContent className="space-y-6 sm:space-y-8 pt-6">
              {/* Immigration Story */}
              <div className="bg-muted/30 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cuizly-pro/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl sm:text-2xl">🛬</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-2">{t('team.journey')}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">{t('team.journeyDetails')}</p>
                  </div>
                </div>
              </div>

              {/* Vision & Mission */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl sm:text-2xl">🚀</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-2">{t('team.vision')}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">{t('team.visionDetails')}</p>
                  </div>
                </div>
              </div>

              {/* Location & Contact */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 justify-center items-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{t('team.location')}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                    asChild
                  >
                    <a 
                      href="https://www.linkedin.com/in/ikrlnd" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                    asChild
                  >
                    <a href="mailto:support@cuizly.ca">
                      <Mail className="h-4 w-4" />
                      {t('team.contact')}
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-6 sm:py-8 bg-muted/30">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">2025</div>
              <p className="text-sm sm:text-base text-muted-foreground">{t('team.foundingYear')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">2</div>
              <p className="text-sm sm:text-base text-muted-foreground">{t('team.teamSize')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">🇨🇦</div>
              <p className="text-sm sm:text-base text-muted-foreground">{t('team.location')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Team;