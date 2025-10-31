import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Riksdagen from "./pages/Riksdagen";
import Ledamoter from "./pages/Ledamoter";
import Dokument from "./pages/Dokument";
import Anforanden from "./pages/Anforanden";
import Voteringar from "./pages/Voteringar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/riksdagen" element={<Riksdagen />} />
          <Route path="/riksdagen/ledamoter" element={<Ledamoter />} />
          <Route path="/riksdagen/dokument" element={<Dokument />} />
          <Route path="/riksdagen/anforanden" element={<Anforanden />} />
          <Route path="/riksdagen/voteringar" element={<Voteringar />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
