import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) throw error;

        // Check if email confirmation is disabled (instant login)
        if (data.session) {
          toast({
            title: "Konto skapat och inloggad!",
            description: "Du är nu inloggad.",
          });
          navigate("/");
        } else {
          toast({
            title: "Konto skapat!",
            description: "E-postbekräftelse krävs. Kontrollera din inkorg eller inaktivera 'Confirm email' i Supabase-inställningarna för snabbare utveckling.",
          });
          setIsSignUp(false); // Switch to login view
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Provide more helpful error message
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Felaktigt e-post eller lösenord. Om du precis registrerade dig, kontrollera om du behöver bekräfta din e-post först.");
          }
          throw error;
        }

        toast({
          title: "Inloggad!",
          description: "Du är nu inloggad.",
        });

        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            {isSignUp ? "Skapa konto" : "Logga in"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Skapa ett konto för att komma åt admin-panelen"
              : "Logga in för att komma åt admin-panelen"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isSignUp && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-sm">
                <p className="text-blue-900 dark:text-blue-100">
                  <strong>Tips:</strong> Om du precis skapat ett konto och e-postbekräftelse är aktiverad, 
                  kontrollera din inkorg för bekräftelselänken först.
                </p>
              </div>
            )}
            
            <div>
              <Input
                type="email"
                placeholder="E-post"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Lösenord (minst 6 tecken)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Laddar..." : isSignUp ? "Skapa konto" : "Logga in"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp
                ? "Har du redan ett konto? Logga in"
                : "Inget konto? Skapa ett"}
            </Button>
          </form>
          
          {isSignUp && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-sm">
              <p className="text-amber-900 dark:text-amber-100">
                <strong>För utveckling:</strong> Inaktivera "Confirm email" i Supabase under 
                Authentication → Providers → Email för att hoppa över e-postbekräftelse.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
