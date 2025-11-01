import { useLanguage } from '@/hooks/useLanguage';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  const handleToggleLanguage = () => {
    const newLanguage = currentLanguage === 'fr' ? 'en' : 'fr';
    changeLanguage(newLanguage);
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleToggleLanguage}
      className="h-9 px-2 gap-1.5 !bg-transparent hover:!bg-transparent focus:!bg-transparent active:!bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 transition-none hover:scale-100"
    >
      <Globe className="h-5 w-5" />
      <span className="text-sm font-medium uppercase">{currentLanguage}</span>
      <span className="sr-only">Change language</span>
    </Button>
  );
};

export default LanguageSwitcher;
