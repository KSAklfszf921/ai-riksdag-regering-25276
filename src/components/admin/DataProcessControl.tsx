import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, StopCircle, RotateCcw, Trash2, CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { BulkOperations } from "./BulkOperations";

interface DataProcessControlProps {
  source: "riksdagen" | "regeringskansliet";
}

export const DataProcessControl = ({ source }: DataProcessControlProps) => {
  const { toast } = useToast();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const { data: progressItems, refetch } = useQuery({
    queryKey: ["admin-progress", source],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_fetch_progress")
        .select("*")
        .eq("source", source)
        .order("data_type");

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 3000,
  });

  const { data: controlData } = useQuery({
    queryKey: ["admin-control", source],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_fetch_control")
        .select("*")
        .eq("source", source);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 3000,
  });

  const getControlStatus = (dataType: string) => {
    return controlData?.find((c: any) => c.data_type === dataType);
  };

  const startFetch = async (dataType: string) => {
    setLoadingStates((prev) => ({ ...prev, [dataType]: true }));
    try {
      const functionName =
        source === "riksdagen"
          ? "fetch-riksdagen-data"
          : "fetch-regeringskansliet-data";

      const { error } = await supabase.functions.invoke(functionName, {
        body: { dataType, paginate: true },
      });

      if (error) throw error;

      toast({
        title: "Hämtning startad",
        description: `${dataType} hämtas i bakgrunden`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Fel vid start",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [dataType]: false }));
    }
  };

  const stopFetch = async (dataType: string) => {
    try {
      const { error } = await supabase
        .from("data_fetch_control")
        .upsert(
          {
            source,
            data_type: dataType,
            should_stop: true,
          },
          { onConflict: "source,data_type" }
        );

      if (error) throw error;

      toast({
        title: "Stoppsignal skickad",
        description: `${dataType} kommer att stoppas`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Fel vid stopp",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetProgress = async (dataType: string) => {
    try {
      const { error } = await supabase
        .from("data_fetch_progress")
        .update({
          status: "pending",
          items_fetched: 0,
          current_page: 1,
          error_message: null,
        })
        .eq("source", source)
        .eq("data_type", dataType);

      if (error) throw error;

      // Reset control
      await supabase
        .from("data_fetch_control")
        .upsert(
          {
            source,
            data_type: dataType,
            should_stop: false,
          },
          { onConflict: "source,data_type" }
        );

      toast({
        title: "Progress återställd",
        description: `${dataType} kan startas igen`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Fel vid återställning",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteProgress = async (dataType: string) => {
    try {
      const { error } = await supabase
        .from("data_fetch_progress")
        .delete()
        .eq("source", source)
        .eq("data_type", dataType);

      if (error) throw error;

      toast({
        title: "Progress raderad",
        description: `${dataType} progress har tagits bort`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Fel vid radering",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!progressItems) return null;

  return (
    <div className="space-y-4">
      <BulkOperations 
        source={source} 
        progressItems={progressItems} 
        onRefetch={refetch} 
      />
      {progressItems.map((item) => {
        const progress = item.total_items
          ? (item.items_fetched / item.total_items) * 100
          : 0;
        const control = getControlStatus(item.data_type);
        const isStopped = item.status === "stopped" || control?.should_stop === true;
        const isLoading = loadingStates[item.data_type];

        return (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {item.data_type}
                    {item.status === "completed" && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    {item.status === "failed" && (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    {item.status === "in_progress" && !isStopped && (
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <Badge
                      variant={
                        item.status === "completed"
                          ? "default"
                          : item.status === "failed"
                          ? "destructive"
                          : isStopped
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {isStopped ? "STOPPAD" : item.status}
                    </Badge>
                    {item.last_fetched_at && (
                      <span className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.last_fetched_at), {
                          addSuffix: true,
                          locale: sv,
                        })}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {item.status !== "in_progress" && (
                    <Button
                      size="sm"
                      onClick={() => startFetch(item.data_type)}
                      disabled={isLoading}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Starta
                    </Button>
                  )}
                  {item.status === "in_progress" && !isStopped && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => stopFetch(item.data_type)}
                    >
                      <StopCircle className="h-4 w-4 mr-1" />
                      Stoppa
                    </Button>
                  )}
                  {(item.status === "stopped" ||
                    item.status === "failed" ||
                    item.status === "completed") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resetProgress(item.data_type)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Återställ
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteProgress(item.data_type)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {item.items_fetched} / {item.total_items || "?"} poster
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
                {item.total_pages && (
                  <p className="text-xs text-muted-foreground">
                    Sida {item.current_page} / {item.total_pages}
                  </p>
                )}
                {item.error_message && (
                  <p className="text-xs text-red-600 mt-2">
                    {item.error_message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};