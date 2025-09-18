import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Users, Search } from "lucide-react";
import { useTranslation } from 'react-i18next';

const MissionVisionSection = () => {
  const { t } = useTranslation();

  const missions = [
    {
      title: t('mission.personalized.title'),
      description: t('mission.personalized.description'),
      icon: Sparkles,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: t('mission.ecosystem.title'),
      description: t('mission.ecosystem.description'),
      icon: Users,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: t('mission.discovery.title'),
      description: t('mission.discovery.description'),
      icon: Search,
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <div className="pt-4 pb-12 sm:pt-6 sm:pb-16 md:pt-8 md:pb-20">
      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-12">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cuizly-primary">
              {t('features.title')}
            </h2>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
          {missions.map((mission, index) => {
            const IconComponent = mission.icon;
            return (
              <div key={index} className="bg-white/5 backdrop-blur-sm border border-cuizly-accent/10 rounded-xl p-4 sm:p-6 md:p-8 hover:shadow-lg transition-all duration-300 hover:border-cuizly-accent/20">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-cuizly-light/20 rounded-full flex items-center justify-center">
                    <IconComponent className={`h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-r ${mission.gradient} bg-clip-text text-transparent`} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-cuizly-primary leading-tight">
                    {mission.title}
                  </h3>
                  <p className="text-cuizly-neutral leading-relaxed text-sm sm:text-base">
                    {mission.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default MissionVisionSection;