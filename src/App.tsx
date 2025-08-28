import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import Header from "@/components/Header";
import CookieBanner from "@/components/CookieBanner";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import Legal from "./pages/Legal";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Mentions from "./pages/Mentions";
import Cookies from "./pages/Cookies";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
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
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showScrollToTop && <ScrollToTopButton />}
      <CookieBanner />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
