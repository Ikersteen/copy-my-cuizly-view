import { useLanguage } from '@/hooks/useLanguage';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();

  const languageLabels: Record<string, string> = {
    fr: 'Français',
    en: 'English'
  };

  const languageFlags: Record<string, string> = {
    fr: '🇫🇷',
    en: '🇺🇸'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 px-2 gap-1.5">
          <Globe className="h-5 w-5" />
          <span className="text-sm font-medium uppercase">{currentLanguage}</span>
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border-border">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => changeLanguage(lang)}
            className="hover:bg-transparent focus:bg-transparent cursor-pointer hover:text-cuizly-primary transition-colors"
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
