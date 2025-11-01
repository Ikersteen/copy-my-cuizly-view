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
    <>
      {/* SVG Gradient Definition */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="language-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#42c2f4" />
            <stop offset="33%" stopColor="#cb44e3" />
            <stop offset="66%" stopColor="#f9566e" />
            <stop offset="100%" stopColor="#ffbala" />
          </linearGradient>
        </defs>
      </svg>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 px-2 gap-1.5 bg-transparent hover:bg-transparent group">
            <Globe className="h-5 w-5 group-hover:[stroke:url(#language-gradient)]" />
            <span className="text-sm font-medium uppercase group-hover:bg-clip-text group-hover:text-transparent group-hover:[background-image:linear-gradient(90deg,#42c2f4,#cb44e3,#f9566e,#ffbala)]">{currentLanguage}</span>
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
              <span className="bg-clip-text text-transparent [background-image:linear-gradient(90deg,#42c2f4,#cb44e3,#f9566e,#ffbala)]">
                {languageLabels[lang]}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default LanguageSwitcher;
