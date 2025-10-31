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
import Regeringskansliet from "./pages/Regeringskansliet";
import Pressmeddelanden from "./pages/Pressmeddelanden";
import RegeringskanslientPropositioner from "./pages/RegeringskanslientPropositioner";
import RegeringskanslientDokument from "./pages/RegeringskanslientDokument";
import RegeringskanslientKategorier from "./pages/RegeringskanslientKategorier";
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
          <Route path="/regeringskansliet" element={<Regeringskansliet />} />
          <Route path="/regeringskansliet/pressmeddelanden" element={<Pressmeddelanden />} />
          <Route path="/regeringskansliet/propositioner" element={<RegeringskanslientPropositioner />} />
          <Route path="/regeringskansliet/dokument" element={<RegeringskanslientDokument />} />
          <Route path="/regeringskansliet/kategorier" element={<RegeringskanslientKategorier />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
