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
    if (!currentUser) return;
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
          <div className="p-4 border rounded bg-amber-50 dark:bg-amber-950/20">
            <p className="text-sm text-amber-900 dark:text-amber-100 mb-2">
              <strong>Första gången?</strong> Logga in först för att kunna ge dig själv admin-rättigheter.
            </p>
          </div>
        )}

        {currentUser && (
          <div className="p-4 border rounded bg-muted/50">
            <p className="text-sm mb-2">
              Inloggad som: <strong>{currentUser.email}</strong>
            </p>
            <Button onClick={makeSelfAdmin} size="sm" variant="outline">
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