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
          <span 
            className="text-sm font-medium uppercase text-cuizly-primary"
            style={{
              background: 'linear-gradient(90deg, #42c2f4, #cb44e3, #f9566e, #ffbala)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block'
            }}
          >
            {currentLanguage}
          </span>
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => changeLanguage(lang)}
            className="cursor-pointer bg-transparent hover:bg-transparent focus:bg-transparent"
          >
            <span className="mr-2">{languageFlags[lang]}</span>
            <span
              className="text-cuizly-primary"
              style={{
                background: 'linear-gradient(90deg, #42c2f4, #cb44e3, #f9566e, #ffbala)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block'
              }}
            >
              {languageLabels[lang]}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
