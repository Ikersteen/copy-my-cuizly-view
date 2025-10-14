import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useHolidays } from "@/hooks/useHolidays";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface HolidaysSectionProps {
  restaurantId: string;
}

export const HolidaysSection = ({ restaurantId }: HolidaysSectionProps) => {
  const { t, i18n } = useTranslation();
  const { holidays, isLoading, toggleHoliday } = useHolidays(restaurantId);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const locale = i18n.language === 'fr' ? fr : enUS;
    return format(date, 'PPP', { locale });
  };

  const getNextOccurrence = (dateStr: string) => {
    const holidayDate = new Date(dateStr);
    const today = new Date();
    
    // If the holiday hasn't passed this year, return it
    if (holidayDate >= today) {
      return holidayDate;
    }
    
    // Otherwise, return next year's date
    const nextYear = new Date(holidayDate);
    nextYear.setFullYear(today.getFullYear() + 1);
    return nextYear;
  };

  const translateHolidayName = (name: string) => {
    const translations: Record<string, Record<string, string>> = {
      "New Year's Day": { fr: "Jour de l'An", en: "New Year's Day" },
      "Good Friday": { fr: "Vendredi saint", en: "Good Friday" },
      "Easter Monday": { fr: "Lundi de Pâques", en: "Easter Monday" },
      "Victoria Day": { fr: "Fête de la Reine", en: "Victoria Day" },
      "Canada Day": { fr: "Fête du Canada", en: "Canada Day" },
      "Civic Holiday": { fr: "Congé civique", en: "Civic Holiday" },
      "Labour Day": { fr: "Fête du Travail", en: "Labour Day" },
      "National Day for Truth and Reconciliation": { 
        fr: "Journée nationale de la vérité et de la réconciliation", 
        en: "National Day for Truth and Reconciliation" 
      },
      "Thanksgiving": { fr: "Action de grâces", en: "Thanksgiving" },
      "Remembrance Day": { fr: "Jour du Souvenir", en: "Remembrance Day" },
      "Christmas Day": { fr: "Noël", en: "Christmas Day" },
      "Boxing Day": { fr: "Lendemain de Noël", en: "Boxing Day" },
    };

    return translations[name]?.[i18n.language] || name;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
          {i18n.language === 'fr' ? 'Jours fériés' : 'Holidays'}
        </p>
      </div>
      
      <p className="text-xs text-muted-foreground">
        {i18n.language === 'fr' 
          ? 'Sélectionnez les jours fériés où votre restaurant sera fermé'
          : 'Select holidays when your restaurant will be closed'}
      </p>

      <Separator className="my-3" />

      {/* Country */}
      <div className="mb-3">
        <Label className="text-xs text-muted-foreground">
          {i18n.language === 'fr' ? 'Pays pour les jours fériés' : 'Country for holidays'}
        </Label>
        <p className="text-sm font-medium mt-1">Canada</p>
      </div>

      {/* Holidays list */}
      <div className="space-y-2">
        {holidays?.map((holiday) => {
          const nextDate = getNextOccurrence(holiday.holiday_date);
          
          return (
            <div
              key={holiday.id}
              className="flex items-center justify-between py-2 px-3 rounded-md border hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`holiday-${holiday.id}`}
                  className="text-sm font-medium cursor-pointer block"
                >
                  {translateHolidayName(holiday.holiday_name)}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {i18n.language === 'fr' ? 'Prochain : ' : 'Next: '}
                  {formatDate(nextDate.toISOString())}
                </p>
              </div>
              <Switch
                id={`holiday-${holiday.id}`}
                checked={holiday.is_enabled}
                onCheckedChange={(checked) =>
                  toggleHoliday.mutate({ id: holiday.id, is_enabled: checked })
                }
              />
            </div>
          );
        })}
      </div>

      {holidays?.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">
            {i18n.language === 'fr'
              ? 'Aucun jour férié configuré'
              : 'No holidays configured'}
          </p>
        </div>
      )}
    </div>
  );
};
