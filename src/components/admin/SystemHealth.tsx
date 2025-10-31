import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Database, HardDrive, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

export const SystemHealth = () => {
  const { data: healthData } = useQuery({
    queryKey: ["system-health"],
    queryFn: async () => {
      // Check database connectivity
      const dbCheck = await supabase
        .from("data_fetch_progress")
        .select("count", { count: "exact", head: true });

      // Check storage
      const storageCheck = await supabase.storage.listBuckets();

      // Check latest activity
      const latestActivity = await supabase
        .from("data_fetch_progress")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      return {
        database: !dbCheck.error,
        storage: !storageCheck.error,
        lastActivity: latestActivity.data?.updated_at || null,
      };
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  const getLastActivityStatus = () => {
    if (!healthData?.lastActivity) return "unknown";
    const timeSinceActivity = Date.now() - new Date(healthData.lastActivity).getTime();
    const minutesSinceActivity = timeSinceActivity / 1000 / 60;

    if (minutesSinceActivity < 5) return "active";
    if (minutesSinceActivity < 30) return "recent";
    return "idle";
  };

  const activityStatus = getLastActivityStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Systemhälsa
        </CardTitle>
        <CardDescription>
          Realtidsstatus för backend-tjänster
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 border rounded bg-card">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Databas</span>
          </div>
          {healthData?.database ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Aktiv
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Otillgänglig
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between p-3 border rounded bg-card">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Storage</span>
          </div>
          {healthData?.storage ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Aktiv
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Otillgänglig
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between p-3 border rounded bg-card">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Senaste aktivitet</span>
          </div>
          {healthData?.lastActivity ? (
            <Badge 
              variant={
                activityStatus === "active" ? "default" :
                activityStatus === "recent" ? "secondary" : "outline"
              } 
              className="gap-1"
            >
              {formatDistanceToNow(new Date(healthData.lastActivity), {
                addSuffix: true,
                locale: sv,
              })}
            </Badge>
          ) : (
            <Badge variant="outline">Ingen data</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
