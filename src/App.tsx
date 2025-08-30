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
import { YearProvider } from "@/contexts/YearContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <YearProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chandas" element={<Chandas />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/images" element={<Images />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </YearProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
