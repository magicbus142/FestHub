import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import OrganizationsList from "./pages/OrganizationsList";
import OrganizationHome from "./pages/OrganizationHome";
import NotFound from "./pages/NotFound";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <OrganizationProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<OrganizationsList />} />
                <Route path="/org/:slug/*" element={<OrganizationHome />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </OrganizationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
