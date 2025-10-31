import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export const AdminSetup = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: userRoles, refetch } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*, user:auth.users(email)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const makeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: "admin",
      });

      if (error) throw error;

      toast({
        title: "Admin-rättigheter tillagda",
        description: "Användaren har nu admin-åtkomst",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Fel vid tillägg av admin",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const makeSelfAdmin = async () => {
    if (!currentUser) {
      toast({
        title: "Inte inloggad",
        description: "Du måste logga in först",
        variant: "destructive",
      });
      return;
    }
    await makeAdmin(currentUser.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin-hantering
        </CardTitle>
        <CardDescription>
          Ge användare admin-rättigheter för att komma åt admin-panelen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentUser && (
          <div className="p-4 border rounded bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <p className="text-sm text-red-900 dark:text-red-100 mb-2">
              <strong>⚠️ Du är inte inloggad!</strong>
            </p>
            <p className="text-xs text-red-700 dark:text-red-300">
              Gå till startsidan och klicka på "Logga in" först. Använd Magic Link för enklast inloggning.
            </p>
          </div>
        )}

        {currentUser && (
          <div className="p-4 border rounded bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <p className="text-sm mb-2 text-green-900 dark:text-green-100">
              ✅ Inloggad som: <strong>{currentUser.email}</strong>
            </p>
            <p className="text-xs mb-3 text-green-700 dark:text-green-300">
              Klicka nedan för att ge dig själv admin-rättigheter (första användaren kan alltid bli admin)
            </p>
            <Button onClick={makeSelfAdmin} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Ge mig admin-rättigheter
            </Button>
          </div>
        )}

        {userRoles && userRoles.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Nuvarande admins:</h3>
            <div className="space-y-2">
              {userRoles.map((role: any) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="text-sm">{role.user?.email || role.user_id}</span>
                  <span className="text-xs text-muted-foreground uppercase">
                    {role.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};