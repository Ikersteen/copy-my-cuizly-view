import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Clock, Search, Trash2 } from "lucide-react";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from 'react-i18next';
import { CUISINE_TRANSLATIONS } from '@/constants/cuisineTypes';

interface HistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HistoryModal = ({ open, onOpenChange }: HistoryModalProps) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as 'fr' | 'en';
  const { searchHistory, clearHistory, removeSearchItem } = useSearchHistory();

  const getSearchTypeText = (type: string) => {
    switch (type) {
      case 'restaurant': return t('history.searchTypes.restaurant');
      case 'cuisine': return 'cuisine';
      case 'location': return t('history.searchTypes.location');
      default: return type;
    }
  };

  const getSearchTypeVariant = (type: string) => {
    switch (type) {
      case 'restaurant': return 'default';
      case 'cuisine': return 'secondary';
      case 'location': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{t('history.title')}</DialogTitle>
            {searchHistory.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearHistory}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('history.clearAll')}
              </Button>
            )}
          </div>
        </DialogHeader>

        {searchHistory.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t('history.noSearches')}</h3>
            <p className="text-muted-foreground">{t('history.searchesAppear')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {searchHistory.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {item.query}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(item.timestamp, 'dd MMM yyyy à HH:mm', { locale: fr })}
                        </span>
                      </div>
                      {item.restaurant && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Restaurant: {item.restaurant.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSearchTypeVariant(item.searchType)}>
                        {getSearchTypeText(item.searchType)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSearchItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {item.restaurant?.cuisine_type && (
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {item.restaurant.cuisine_type.map((cuisine, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || cuisine}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};