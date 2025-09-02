import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Linkedin, Mail, User } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import CTASection from "@/components/CTASection";

const Team = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-background to-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <Badge variant="outline" className="mx-auto">
              {t('team.badge')}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              {t('team.title')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('team.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Team Member Section */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{t('team.meetFounder')}</h2>
            <p className="text-muted-foreground text-lg">{t('team.founderIntro')}</p>
          </div>

          <Card className="max-w-4xl mx-auto shadow-lg border-0 bg-gradient-to-br from-card to-card/80">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-4 border-primary/20">
                    <User className="h-16 w-16 text-primary" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🇨🇩</span>
                  </div>
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
                {t('team.founderName')}
              </CardTitle>
              <CardDescription className="text-lg font-medium text-primary">
                {t('team.founderTitle')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Academic Background */}
              <div className="bg-muted/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('team.education')}</h3>
                    <p className="text-muted-foreground">{t('team.educationDetails')}</p>
                  </div>
                </div>
              </div>

              {/* Immigration Story */}
              <div className="bg-muted/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🛫</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('team.journey')}</h3>
                    <p className="text-muted-foreground">{t('team.journeyDetails')}</p>
                  </div>
                </div>
              </div>

              {/* Vision & Mission */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('team.vision')}</h3>
                    <p className="text-muted-foreground">{t('team.visionDetails')}</p>
                  </div>
                </div>
              </div>

              {/* Location & Contact */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{t('team.location')}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('team.contact')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">2025</div>
              <p className="text-muted-foreground">{t('team.foundingYear')}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1</div>
              <p className="text-muted-foreground">{t('team.teamSize')}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">🇨🇦</div>
              <p className="text-muted-foreground">{t('team.basedIn')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />
    </div>
  );
};

export default Team;