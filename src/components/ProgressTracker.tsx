import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

interface ProgressTrackerProps {
  source: 'riksdagen' | 'regeringskansliet';
}

const ProgressTracker = ({ source }: ProgressTrackerProps) => {
  const { data: progressItems, isLoading } = useQuery({
    queryKey: ['progress', source],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_fetch_progress')
        .select('*')
        .eq('source', source)
        .order('last_fetched_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Uppdatera var 5:e sekund
  });

  if (isLoading || !progressItems || progressItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Hämtningsframsteg</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {progressItems.map((item) => {
          const progress = item.total_items ? (item.items_fetched / item.total_items) * 100 : 0;
          const statusIcon = item.status === 'completed' ? CheckCircle2 : 
                            item.status === 'failed' ? AlertCircle :
                            Loader2;
          const statusColor = item.status === 'completed' ? 'text-green-600' :
                             item.status === 'failed' ? 'text-red-600' :
                             'text-blue-600';
          
          return (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{item.data_type}</CardTitle>
                  {item.status === 'completed' && <CheckCircle2 className={`h-4 w-4 ${statusColor}`} />}
                  {item.status === 'failed' && <AlertCircle className={`h-4 w-4 ${statusColor}`} />}
                  {item.status === 'in_progress' && <Loader2 className={`h-4 w-4 ${statusColor} animate-spin`} />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{item.items_fetched} / {item.total_items || '?'}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                  {item.total_pages && (
                    <p className="text-xs text-muted-foreground">
                      Sida {item.current_page} / {item.total_pages}
                    </p>
                  )}
                  {item.last_fetched_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(item.last_fetched_at), { 
                        addSuffix: true, 
                        locale: sv 
                      })}
                    </div>
                  )}
                  {item.error_message && (
                    <p className="text-xs text-red-600">{item.error_message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTracker;
