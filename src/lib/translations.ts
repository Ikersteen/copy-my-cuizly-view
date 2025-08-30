import { SupportedLanguage } from '@/hooks/useLanguage';

interface TranslatableText {
  description?: string;
  description_fr?: string;
  description_en?: string;
}

export const getTranslatedDescription = (
  item: TranslatableText,
  language: SupportedLanguage
): string => {
  if (language === 'en') {
    return item.description_en || item.description_fr || item.description || '';
  } else {
    return item.description_fr || item.description || '';
  }
};