import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import { useTranslation, I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import { routeTranslations } from "@/lib/routeTranslations";
import Header from "@/components/Header";
import CookieBanner from "@/components/CookieBanner";
import ScrollToTop from "@/components/ScrollToTop";
import HeyLuizlyVoiceAssistant from "@/components/HeyLuizlyVoiceAssistant";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";

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
  const { isAuthenticated } = useSecureAuth();
  const { preferences } = useUserPreferences();

  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      {isAuthenticated && (
        <HeyLuizlyVoiceAssistant 
          enabled={preferences?.voice_activation_enabled || false} 
        />
      )}
      <Routes>
        <Route path="/" element={
          <>
            <Header />
            <Index />
          </>
        } />
        {/* English routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={
          <>
            <Header />
            <Dashboard />
          </>
        } />
        <Route path="/dashboard/:slug" element={
          <>
            <Header />
            <Dashboard />
          </>
        } />
        <Route path="/pricing" element={
          <>
            <Header />
            <Pricing />
          </>
        } />
        <Route path="/features" element={
          <>
            <Header />
            <Features />
          </>
        } />
        <Route path="/contact" element={
          <>
            <Header />
            <Contact />
          </>
        } />
        <Route path="/team" element={
          <>
            <Header />
            <Team />
          </>
        } />
        <Route path="/legal" element={
          <>
            <Header />
            <Legal />
          </>
        } />
        <Route path="/privacy" element={
          <>
            <Header />
            <Privacy />
          </>
        } />
        <Route path="/terms" element={
          <>
            <Header />
            <Terms />
          </>
        } />
        <Route path="/mentions" element={
          <>
            <Header />
            <Mentions />
          </>
        } />
        <Route path="/mentions-legales" element={
          <>
            <Header />
            <Mentions />
          </>
        } />
        <Route path="/cookies" element={
          <>
            <Header />
            <Cookies />
          </>
        } />
        <Route path="/politique-de-cookies" element={
          <>
            <Header />
            <Cookies />
          </>
        } />
        <Route path="/waitlist" element={<Waitlist />} />
        <Route path="/cuizlyassistant" element={
          <>
            <Header />
            <VoiceChat />
          </>
        } />
        <Route path="/restaurant/:id" element={<RestaurantMenu />} />
        <Route path="/restaurant/reservations" element={
          <>
            <Header />
            <RestaurantReservations />
          </>
        } />
        <Route path="/my-reservations" element={
          <>
            <Header />
            <ConsumerReservations />
          </>
        } />
        <Route path="/email-confirmed" element={<EmailConfirmed />} />

        {/* French routes */}
        <Route path="/connexion" element={<Auth />} />
        <Route path="/tableau-de-bord" element={
          <>
            <Header />
            <Dashboard />
          </>
        } />
        <Route path="/tableau-de-bord/:slug" element={
          <>
            <Header />
            <Dashboard />
          </>
        } />
        <Route path="/tarifs" element={
          <>
            <Header />
            <Pricing />
          </>
        } />
        <Route path="/fonctionnalites" element={
          <>
            <Header />
            <Features />
          </>
        } />
        <Route path="/equipe" element={
          <>
            <Header />
            <Team />
          </>
        } />
        <Route path="/politique-confidentialite" element={
          <>
            <Header />
            <Privacy />
          </>
        } />
        <Route path="/confidentialite" element={
          <>
            <Header />
            <Privacy />
          </>
        } />
        <Route path="/conditions-utilisation" element={
          <>
            <Header />
            <Terms />
          </>
        } />
        <Route path="/conditions" element={
          <>
            <Header />
            <Terms />
          </>
        } />
        <Route path="/liste-attente" element={<Waitlist />} />
        <Route path="/assistant-vocal" element={
          <>
            <Header />
            <VoiceChat />
          </>
        } />
        <Route path="/restaurant/reservations" element={
          <>
            <Header />
            <RestaurantReservations />
          </>
        } />
        <Route path="/mes-reservations" element={
          <>
            <Header />
            <ConsumerReservations />
          </>
        } />
        <Route path="/courriel-confirme" element={<EmailConfirmed />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <CookieBanner />
    </div>
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
