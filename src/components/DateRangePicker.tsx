import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { CalendarIcon, X } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  maxDays?: number;
  minDate?: Date;
  label?: string;
  placeholder?: string;
}

export const DateRangePicker = ({
  value,
  onChange,
  maxDays = 3,
  minDate = new Date(),
  label = "Période de validité",
  placeholder = "Sélectionner les dates"
}: DateRangePickerProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState<Date | undefined>();

  const formatDateRange = (range: DateRange) => {
    if (!range.from) return placeholder;
    if (!range.to) return `${format(range.from, "dd MMM", { locale: fr })} - ${t('dateRangePicker.selectEnd')}`;
    return `${format(range.from, "dd MMM", { locale: fr })} - ${format(range.to, "dd MMM", { locale: fr })}`;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!value?.from || (value?.from && value?.to)) {
      // Start new selection
      onChange({ from: date, to: undefined });
      setHoverDate(undefined);
    } else if (value?.from && !value?.to) {
      // Complete the range
      const daysDiff = differenceInDays(date, value.from);
      
      if (daysDiff < 0) {
        // Selected date is before start date, swap them
        onChange({ from: date, to: value.from });
      } else if (daysDiff > maxDays - 1) {
        // Selected date is too far, set to max allowed
        onChange({ from: value.from, to: addDays(value.from, maxDays - 1) });
      } else {
        // Valid range
        onChange({ from: value.from, to: date });
      }
      setOpen(false);
    }
  };

  const handleMouseEnter = (date: Date) => {
    if (value?.from && !value?.to) {
      const daysDiff = differenceInDays(date, value.from);
      if (daysDiff >= 0 && daysDiff <= maxDays - 1) {
        setHoverDate(date);
      } else if (daysDiff > maxDays - 1) {
        setHoverDate(addDays(value.from, maxDays - 1));
      }
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ from: undefined, to: undefined });
    setHoverDate(undefined);
  };

  const isDateInRange = (date: Date) => {
    if (!value?.from) return false;
    if (value?.to) {
      return date >= value.from && date <= value.to;
    }
    if (hoverDate) {
      const start = value.from;
      const end = hoverDate;
      return date >= start && date <= end;
    }
    return false;
  };

  const isDateDisabled = (date: Date) => {
    if (date < minDate) return true;
    
    if (value?.from && !value?.to) {
      const daysDiff = differenceInDays(date, value.from);
      return daysDiff > maxDays - 1;
    }
    
    return false;
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(value || { from: undefined, to: undefined })}
            {value?.from && (
              <X 
                className="ml-auto h-4 w-4 hover:text-destructive" 
                onClick={clearSelection}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value?.from}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            onDayMouseEnter={handleMouseEnter}
            onDayMouseLeave={() => setHoverDate(undefined)}
            modifiers={{
              range: isDateInRange
            }}
            modifiersStyles={{
              range: { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
            }}
            initialFocus
            className="p-3 pointer-events-auto"
          />
          {value?.from && !value?.to && (
            <div className="p-3 border-t text-xs text-muted-foreground">
              {t('dateRangePicker.selectEndDate', { maxDays })}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};