import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import { useTranslation, I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import ScrollToTop from "@/components/ScrollToTop";
import Header from "@/components/Header";
import CookieBanner from "@/components/CookieBanner";
import LanguageRouter from "@/components/LanguageRouter";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import Team from "./pages/Team";
import Legal from "./pages/Legal";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Mentions from "./pages/Mentions";
import Cookies from "./pages/Cookies";
import Waitlist from "./pages/Waitlist";
import VoiceChat from "./pages/VoiceChat";
import RestaurantMenu from "./pages/RestaurantMenu";
import EmailConfirmed from "./pages/EmailConfirmed";
import RestaurantReservations from "./pages/RestaurantReservations";
import ConsumerReservations from "./pages/ConsumerReservations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const showScrollToTop = !location.pathname.includes('/auth') && 
                          !location.pathname.includes('/connexion') &&
                          !location.pathname.includes('/dashboard') && 
                          !location.pathname.includes('/tableau-de-bord') && 
                          !location.pathname.includes('/voice') &&
                          !location.pathname.includes('/assistant-vocal');

  return (
    <LanguageRouter>
      <div className="min-h-screen bg-background">
        <ScrollToTop />
        <Routes>
          {/* Root redirect - handled by LanguageRouter */}
          <Route path="/" element={
            <>
              <Header />
              <Index />
            </>
          } />

          {/* English routes with /en/ prefix */}
          <Route path="/en" element={
            <>
              <Header />
              <Index />
            </>
          } />
          <Route path="/en/auth" element={<Auth />} />
          <Route path="/en/dashboard" element={
            <>
              <Header />
              <Dashboard />
            </>
          } />
          <Route path="/en/dashboard/:slug" element={
            <>
              <Header />
              <Dashboard />
            </>
          } />
          <Route path="/en/pricing" element={
            <>
              <Header />
              <Pricing />
            </>
          } />
          <Route path="/en/features" element={
            <>
              <Header />
              <Features />
            </>
          } />
          <Route path="/en/contact" element={
            <>
              <Header />
              <Contact />
            </>
          } />
          <Route path="/en/team" element={
            <>
              <Header />
              <Team />
            </>
          } />
          <Route path="/en/legal" element={
            <>
              <Header />
              <Legal />
            </>
          } />
          <Route path="/en/privacy" element={
            <>
              <Header />
              <Privacy />
            </>
          } />
          <Route path="/en/terms" element={
            <>
              <Header />
              <Terms />
            </>
          } />
          <Route path="/en/mentions" element={
            <>
              <Header />
              <Mentions />
            </>
          } />
          <Route path="/en/cookies" element={
            <>
              <Header />
              <Cookies />
            </>
          } />
          <Route path="/en/waitlist" element={<Waitlist />} />
          <Route path="/en/voice" element={
            <>
              <Header />
              <VoiceChat />
            </>
          } />
          <Route path="/en/restaurant/:id" element={<RestaurantMenu />} />
          <Route path="/en/restaurant/reservations" element={
            <>
              <Header />
              <RestaurantReservations />
            </>
          } />
          <Route path="/en/my-reservations" element={
            <>
              <Header />
              <ConsumerReservations />
            </>
          } />
          <Route path="/en/email-confirmed" element={<EmailConfirmed />} />

          {/* French routes with /fr/ prefix */}
          <Route path="/fr" element={
            <>
              <Header />
              <Index />
            </>
          } />
          <Route path="/fr/connexion" element={<Auth />} />
          <Route path="/fr/tableau-de-bord" element={
            <>
              <Header />
              <Dashboard />
            </>
          } />
          <Route path="/fr/tableau-de-bord/:slug" element={
            <>
              <Header />
              <Dashboard />
            </>
          } />
          <Route path="/fr/tarifs" element={
            <>
              <Header />
              <Pricing />
            </>
          } />
          <Route path="/fr/fonctionnalites" element={
            <>
              <Header />
              <Features />
            </>
          } />
          <Route path="/fr/contact" element={
            <>
              <Header />
              <Contact />
            </>
          } />
          <Route path="/fr/equipe" element={
            <>
              <Header />
              <Team />
            </>
          } />
          <Route path="/fr/mentions-legales" element={
            <>
              <Header />
              <Mentions />
            </>
          } />
          <Route path="/fr/politique-confidentialite" element={
            <>
              <Header />
              <Privacy />
            </>
          } />
          <Route path="/fr/confidentialite" element={
            <>
              <Header />
              <Privacy />
            </>
          } />
          <Route path="/fr/conditions-utilisation" element={
            <>
              <Header />
              <Terms />
            </>
          } />
          <Route path="/fr/conditions" element={
            <>
              <Header />
              <Terms />
            </>
          } />
          <Route path="/fr/politique-de-cookies" element={
            <>
              <Header />
              <Cookies />
            </>
          } />
          <Route path="/fr/liste-attente" element={<Waitlist />} />
          <Route path="/fr/assistant-vocal" element={
            <>
              <Header />
              <VoiceChat />
            </>
          } />
          <Route path="/fr/restaurant/:id" element={<RestaurantMenu />} />
          <Route path="/fr/restaurant/reservations" element={
            <>
              <Header />
              <RestaurantReservations />
            </>
          } />
          <Route path="/fr/mes-reservations" element={
            <>
              <Header />
              <ConsumerReservations />
            </>
          } />
          <Route path="/fr/courriel-confirme" element={<EmailConfirmed />} />

          {/* Legacy routes without prefix - will be redirected by LanguageRouter */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/connexion" element={<Auth />} />
          <Route path="/dashboard" element={<><Header /><Dashboard /></>} />
          <Route path="/dashboard/:slug" element={<><Header /><Dashboard /></>} />
          <Route path="/tableau-de-bord" element={<><Header /><Dashboard /></>} />
          <Route path="/tableau-de-bord/:slug" element={<><Header /><Dashboard /></>} />
          <Route path="/pricing" element={<><Header /><Pricing /></>} />
          <Route path="/tarifs" element={<><Header /><Pricing /></>} />
          <Route path="/features" element={<><Header /><Features /></>} />
          <Route path="/fonctionnalites" element={<><Header /><Features /></>} />
          <Route path="/contact" element={<><Header /><Contact /></>} />
          <Route path="/team" element={<><Header /><Team /></>} />
          <Route path="/equipe" element={<><Header /><Team /></>} />
          <Route path="/legal" element={<><Header /><Legal /></>} />
          <Route path="/mentions" element={<><Header /><Mentions /></>} />
          <Route path="/mentions-legales" element={<><Header /><Mentions /></>} />
          <Route path="/privacy" element={<><Header /><Privacy /></>} />
          <Route path="/politique-confidentialite" element={<><Header /><Privacy /></>} />
          <Route path="/confidentialite" element={<><Header /><Privacy /></>} />
          <Route path="/terms" element={<><Header /><Terms /></>} />
          <Route path="/conditions-utilisation" element={<><Header /><Terms /></>} />
          <Route path="/conditions" element={<><Header /><Terms /></>} />
          <Route path="/cookies" element={<><Header /><Cookies /></>} />
          <Route path="/politique-de-cookies" element={<><Header /><Cookies /></>} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/liste-attente" element={<Waitlist />} />
          <Route path="/voice" element={<><Header /><VoiceChat /></>} />
          <Route path="/assistant-vocal" element={<><Header /><VoiceChat /></>} />
          <Route path="/restaurant/:id" element={<RestaurantMenu />} />
          <Route path="/restaurant/reservations" element={<><Header /><RestaurantReservations /></>} />
          <Route path="/my-reservations" element={<><Header /><ConsumerReservations /></>} />
          <Route path="/mes-reservations" element={<><Header /><ConsumerReservations /></>} />
          <Route path="/email-confirmed" element={<EmailConfirmed />} />
          <Route path="/courriel-confirme" element={<EmailConfirmed />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        {showScrollToTop && <ScrollToTopButton />}
        <CookieBanner />
      </div>
    </LanguageRouter>
  );
};

const App = () => (
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </I18nextProvider>
);

export default App;
