import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useLocalizedRoute } from "@/lib/routeTranslations";
import { cn } from "@/lib/utils";

export const PublicNavigationMenu = () => {
  const { t } = useTranslation();
  const pricingRoute = useLocalizedRoute('/pricing');
  const featuresRoute = useLocalizedRoute('/features');
  const contactRoute = useLocalizedRoute('/contact');
  const teamRoute = useLocalizedRoute('/team');
  const legalRoute = useLocalizedRoute('/legal');
  const privacyRoute = useLocalizedRoute('/privacy');
  const termsRoute = useLocalizedRoute('/terms');
  const cookiesRoute = useLocalizedRoute('/cookies');

  return (
    <NavigationMenu skipDelayDuration={0}>
      <NavigationMenuList>
        {/* Produit */}
        <NavigationMenuItem>
          <NavigationMenuTrigger 
            className="text-sm font-medium text-cuizly-neutral hover:text-foreground"
            onPointerEnter={(e) => e.preventDefault()}
            onPointerMove={(e) => e.preventDefault()}
          >
            {t('navigation.product')}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4">
              <ListItem href={featuresRoute} title={t('navigation.features')}>
                {t('navigation.featuresDescription')}
              </ListItem>
              <ListItem href={pricingRoute} title={t('navigation.pricing')}>
                {t('navigation.pricingDescription')}
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Support */}
        <NavigationMenuItem>
          <NavigationMenuTrigger 
            className="text-sm font-medium text-cuizly-neutral hover:text-foreground"
            onPointerEnter={(e) => e.preventDefault()}
            onPointerMove={(e) => e.preventDefault()}
          >
            {t('navigation.support')}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4">
              <ListItem href={contactRoute} title={t('navigation.contact')}>
                {t('navigation.contactDescription')}
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Entreprise */}
        <NavigationMenuItem>
          <NavigationMenuTrigger 
            className="text-sm font-medium text-cuizly-neutral hover:text-foreground"
            onPointerEnter={(e) => e.preventDefault()}
            onPointerMove={(e) => e.preventDefault()}
          >
            {t('navigation.company')}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4">
              <ListItem href={teamRoute} title={t('navigation.team')}>
                {t('navigation.teamDescription')}
              </ListItem>
              <ListItem href={legalRoute} title={t('navigation.legal')}>
                {t('navigation.legalDescription')}
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Légal */}
        <NavigationMenuItem>
          <NavigationMenuTrigger 
            className="text-sm font-medium text-cuizly-neutral hover:text-foreground"
            onPointerEnter={(e) => e.preventDefault()}
            onPointerMove={(e) => e.preventDefault()}
          >
            {t('navigation.legalMenu')}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4">
              <ListItem href={privacyRoute} title={t('navigation.privacy')}>
                {t('navigation.privacyDescription')}
              </ListItem>
              <ListItem href={termsRoute} title={t('navigation.terms')}>
                {t('navigation.termsDescription')}
              </ListItem>
              <ListItem href={cookiesRoute} title={t('navigation.cookies')}>
                {t('navigation.cookiesDescription')}
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

const ListItem = ({
  className,
  title,
  children,
  href,
  ...props
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
}) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};
