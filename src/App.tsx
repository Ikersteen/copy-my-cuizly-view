import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useTranslation } from "react-i18next";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import Header from "@/components/Header";
import CookieBanner from "@/components/CookieBanner";

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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const showScrollToTop = !location.pathname.includes('/auth') && !location.pathname.includes('/dashboard');

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={
          <>
            <Header />
            <Index />
          </>
        } />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={
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
        <Route path="/cookies" element={
          <>
            <Header />
            <Cookies />
          </>
        } />
        <Route path="/waitlist" element={<Waitlist />} />
        <Route path="/voice" element={<VoiceChat />} />
        <Route path="/restaurant/:id" element={<RestaurantMenu />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showScrollToTop && <ScrollToTopButton />}
      <CookieBanner />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem={true}
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
