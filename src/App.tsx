import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import OrganizationsList from "./pages/OrganizationsList";
import OrganizationHome from "./pages/OrganizationHome";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import VotingLogin from "./pages/voting/VotingLogin";
import VotingGallery from "./pages/voting/VotingGallery";
import ResetPasscodePage from "./pages/ResetPasscodePage";
import SuperAdmin from "./pages/SuperAdmin";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FestivalProvider } from "@/contexts/FestivalContext";
import { YearProvider } from "@/contexts/YearContext";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SupabaseAuthProvider>
          <OrganizationProvider>
            <AuthProvider>
              <LanguageProvider>
                <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<OrganizationsList />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/org/:slug/*" element={<OrganizationHome />} />
                  {/* Voting Routes */}
                  <Route path="/org/:slug/vote/:competitionId/login" element={
                    <YearProvider><FestivalProvider><VotingLogin /></FestivalProvider></YearProvider>
                  } />
                  <Route path="/org/:slug/vote/:competitionId/gallery" element={
                    <YearProvider><FestivalProvider><VotingGallery /></FestivalProvider></YearProvider>
                  } />
                  <Route path="/reset-passcode" element={<ResetPasscodePage />} />
                  <Route path="/super-admin" element={<SuperAdmin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              </LanguageProvider>
            </AuthProvider>
          </OrganizationProvider>
        </SupabaseAuthProvider>
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
