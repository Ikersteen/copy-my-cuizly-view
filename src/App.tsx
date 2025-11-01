import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";

import Index from "./pages/Index";
import Team from "./pages/Team";
import Legal from "./pages/Legal";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Mentions from "./pages/Mentions";
import Cookies from "./pages/Cookies";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      <Routes>
        {/* Homepage */}
        <Route path="/" element={
          <>
            <Header />
            <Index />
          </>
        } />
        
        {/* English routes */}
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

        {/* French routes */}
        <Route path="/equipe" element={
          <>
            <Header />
            <Team />
          </>
        } />
        <Route path="/mentions-legales" element={
          <>
            <Header />
            <Mentions />
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
        <Route path="/politique-de-cookies" element={
          <>
            <Header />
            <Cookies />
          </>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
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
