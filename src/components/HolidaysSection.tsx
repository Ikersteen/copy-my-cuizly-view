import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useHolidays } from "@/hooks/useHolidays";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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


  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {i18n.language === 'fr' ? 'Jours fériés' : 'Holidays'}
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          {i18n.language === 'fr' 
            ? 'Sélectionnez les jours fériés où votre restaurant sera fermé.'
            : 'Select holidays when your restaurant will be closed.'}
        </p>
      </div>
      <div>
        <div className="space-y-3">
          {/* Country selector */}
          <div className="pb-2">
            <Label className="text-xs font-medium">
              {i18n.language === 'fr' ? 'Pays pour les jours fériés' : 'Country for holidays'}
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Canada
            </p>
          </div>

          {/* Holidays list */}
          <div className="space-y-2">
            {holidays?.map((holiday) => {
              const nextDate = getNextOccurrence(holiday.holiday_date);
              const isPast = new Date(holiday.holiday_date) < new Date();
              
              return (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`holiday-${holiday.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {holiday.holiday_name}
                      </Label>
                    </div>
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
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {i18n.language === 'fr'
                  ? 'Aucun jour férié configuré'
                  : 'No holidays configured'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
