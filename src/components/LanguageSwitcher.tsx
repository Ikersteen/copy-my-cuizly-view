import { useLanguage } from '@/hooks/useLanguage';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const languageLabels: Record<string, string> = {
    en: 'English',
    fr: 'Français'
  };

  const languageFlags: Record<string, string> = {
    en: '🇺🇸',
    fr: '🇫🇷'
  };

  // Order: English first, then French
  const orderedLanguages = ['en', 'fr'] as const;

  const handleLanguageChange = useCallback((lang: string) => {
    // Get current path without language prefix
    const currentPath = location.pathname.replace(/^\/(en|fr)/, '');
    
    // Change language
    changeLanguage(lang as 'en' | 'fr');
    
    // Navigate to same page with new language prefix
    const newPath = `/${lang}${currentPath || ''}`;
    navigate(newPath);
  }, [location.pathname, changeLanguage, navigate]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {orderedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={currentLanguage === lang ? 'bg-accent' : ''}
          >
            <span className="mr-2">{languageFlags[lang]}</span>
            {languageLabels[lang]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
