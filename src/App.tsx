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
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import MagicLinkAuth from "./pages/MagicLinkAuth";
import Organizations from "./pages/Organizations";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SupabaseAuthProvider>
            <OrganizationProvider>
              <LanguageProvider>
                <YearProvider>
                  <FestivalProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <Routes>
                        <Route path="/auth" element={<MagicLinkAuth />} />
                        <Route path="/organizations" element={
                          <ProtectedRoute>
                            <Organizations />
                          </ProtectedRoute>
                        } />
                        <Route path="/" element={
                          <ProtectedRoute>
                            <FestivalSelection />
                          </ProtectedRoute>
                        } />
                        <Route path="/dashboard" element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="/chandas" element={
                          <ProtectedRoute>
                            <Chandas />
                          </ProtectedRoute>
                        } />
                        <Route path="/expenses" element={
                          <ProtectedRoute>
                            <Expenses />
                          </ProtectedRoute>
                        } />
                        <Route path="/images" element={
                          <ProtectedRoute>
                            <Images />
                          </ProtectedRoute>
                        } />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </FestivalProvider>
                </YearProvider>
              </LanguageProvider>
            </OrganizationProvider>
          </SupabaseAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
