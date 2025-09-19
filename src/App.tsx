import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Chandas from "./pages/Chandas";
import Expenses from "./pages/Expenses";
import Images from "./pages/Images";
import NotFound from "./pages/NotFound";
import FestivalSelection from "./pages/FestivalSelection";
import { YearProvider } from "@/contexts/YearContext";
import { FestivalProvider } from "@/contexts/FestivalContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SupabaseAuthProvider>
          <LanguageProvider>
          <YearProvider>
            <FestivalProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<FestivalSelection />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/chandas" element={<Chandas />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/images" element={<Images />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </FestivalProvider>
          </YearProvider>
        </LanguageProvider>
        </SupabaseAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
