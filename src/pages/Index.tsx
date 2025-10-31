import { Link } from "react-router-dom";
import { InstitutionCard } from "@/components/InstitutionCard";
import { Button } from "@/components/ui/button";
import { Shield, LogIn, LogOut } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import riksdagenLogo from "@/assets/riksdagen-logo.svg";
import regeringskanslientLogo from "@/assets/regeringskansliet-logo.svg";

const Index = () => {
  const { isAdmin } = useIsAdmin();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Utloggad",
      description: "Du är nu utloggad",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="w-full bg-primary py-1"></div>

      <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
        <div className="flex justify-end gap-2 mb-4">
          {/* Admin button - show for logged in users */}
          {user && (
            <Link to="/admin">
              <Button variant={isAdmin ? "default" : "outline"} size="sm">
                <Shield className="h-4 w-4 mr-2" />
                {isAdmin ? "Admin Panel" : "Admin Setup"}
              </Button>
            </Link>
          )}
          
          {/* Auth buttons */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logga ut
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Logga in för Admin
              </Button>
            </Link>
          )}
        </div>

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