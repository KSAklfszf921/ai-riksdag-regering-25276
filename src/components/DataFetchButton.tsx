import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataFetchButtonProps {
  type?: 'riksdagen' | 'regeringskansliet';
}

const DataFetchButton = ({ type = 'riksdagen' }: DataFetchButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = async (dataType: string, limit: number = 50) => {
    setIsLoading(true);
    const functionName = type === 'riksdagen' ? 'fetch-riksdagen-data' : 'fetch-regeringskansliet-data';
    
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { dataType, limit }
      });

      if (error) throw error;

      toast({
        title: "Data hämtad!",
        description: `${data.inserted} ${dataType} hämtades från Riksdagens API`,
      });
    } catch (error: any) {
      toast({
        title: "Fel vid hämtning",
        description: error.message || "Kunde inte hämta data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Hämta data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {type === 'riksdagen' ? (
          <>
            <DropdownMenuItem onClick={() => fetchData('dokument', 100)}>
              Hämta dokument
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fetchData('ledamoter', 500)}>
              Hämta ledamöter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fetchData('anforanden', 100)}>
              Hämta anföranden
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fetchData('voteringar', 100)}>
              Hämta voteringar
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => fetchData('pressmeddelanden', 100)}>
              Hämta pressmeddelanden
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fetchData('propositioner', 100)}>
              Hämta propositioner
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fetchData('dokument', 100)}>
              Hämta dokument
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fetchData('kategorier', 500)}>
              Hämta kategorier
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DataFetchButton;
