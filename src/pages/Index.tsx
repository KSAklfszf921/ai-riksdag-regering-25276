import { Link } from "react-router-dom";
import { InstitutionCard } from "@/components/InstitutionCard";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import riksdagenLogo from "@/assets/riksdagen-logo.svg";
import regeringskanslientLogo from "@/assets/regeringskansliet-logo.svg";

const Index = () => {
  const { isAdmin } = useIsAdmin();

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="w-full bg-primary py-1"></div>

      <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
        {isAdmin && (
          <div className="flex justify-end mb-4">
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
          </div>
        )}

        <header className="text-center mb-16 md:mb-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-4 tracking-tight">
            Riksdag & Regering
          </h1>
          <div className="w-20 h-1 bg-secondary mx-auto mb-6"></div>
        </header>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto mb-16">
          <InstitutionCard
            title="Riksdagen"
            description="Utforska Sveriges riksdag med AI. Få insikter om propositioner, debatter och beslutsprocesser."
            href="/riksdagen"
            image={riksdagenLogo}
          />

          <InstitutionCard
            title="Regeringskansliet"
            description="Upptäck regeringens arbete och organisation. AI-driven information om departement och policy."
            href="/regeringskansliet"
            image={regeringskanslientLogo}
          />
        </div>

        <footer className="border-t border-border pt-8 mt-12">
          <div className="text-center space-y-3">
            <p className="text-xs text-muted-foreground">
              Denna tjänst tillhandahålls i informationssyfte och är inte en
              officiell myndighetstjänst
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;