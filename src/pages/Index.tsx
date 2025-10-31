import { InstitutionCard } from "@/components/InstitutionCard";
import { Building2, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <header className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight">
            Svenska AI-tjänster
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Välj den institution du vill utforska med hjälp av artificiell intelligens
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <InstitutionCard
            title="Riksdagen"
            description="Utforska Sveriges riksdag med AI. Få insikter om propositioner, debatter och beslutsprocesser."
            href="https://riksdagen.ai"
            icon={<Users className="w-12 h-12" />}
          />
          
          <InstitutionCard
            title="Regeringskansliet"
            description="Upptäck regeringens arbete och organisation. AI-driven information om departement och policy."
            href="https://regeringskansliet.ai"
            icon={<Building2 className="w-12 h-12" />}
          />
        </div>

        <footer className="text-center mt-20 text-sm text-muted-foreground">
          <p>AI-baserade informationstjänster för svenska politiska institutioner</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
