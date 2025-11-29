import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Chandas from "./pages/Chandas";
import Images from "./pages/Images";
import NotFound from "./pages/NotFound";
import FestivalSelection from "./pages/FestivalSelection";
import { YearProvider } from "@/contexts/YearContext";
import { FestivalProvider } from "@/contexts/FestivalContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <LanguageProvider>
            <YearProvider>
              <FestivalProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<FestivalSelection />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/chandas" element={<Chandas />} />
                    <Route path="/images" element={<Images />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </FestivalProvider>
            </YearProvider>
          </LanguageProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
