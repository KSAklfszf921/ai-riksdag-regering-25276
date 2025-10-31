import { Link } from "react-router-dom";
import { FileText, Users, MessageSquare, Vote } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StatsCard from "@/components/StatsCard";
import DataFetchButton from "@/components/DataFetchButton";
import { Skeleton } from "@/components/ui/skeleton";

const Riksdagen = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['riksdagen-stats'],
    queryFn: async () => {
      const [dokument, ledamoter, anforanden, voteringar] = await Promise.all([
        supabase.from('riksdagen_dokument').select('id', { count: 'exact', head: true }),
        supabase.from('riksdagen_ledamoter').select('id', { count: 'exact', head: true }),
        supabase.from('riksdagen_anforanden').select('id', { count: 'exact', head: true }),
        supabase.from('riksdagen_voteringar').select('id', { count: 'exact', head: true }),
      ]);
      
      return {
        dokument: dokument.count || 0,
        ledamoter: ledamoter.count || 0,
        anforanden: anforanden.count || 0,
        voteringar: voteringar.count || 0,
      };
    },
  });

  const sections = [
    {
      title: "Ledamöter",
      description: "Utforska riksdagens ledamöter, deras roller och partitillhörighet",
      icon: Users,
      href: "/riksdagen/ledamoter",
      color: "text-blue-600"
    },
    {
      title: "Dokument",
      description: "Sök och läs propositioner, betänkanden och andra riksdagsdokument",
      icon: FileText,
      href: "/riksdagen/dokument",
      color: "text-green-600"
    },
    {
      title: "Anföranden",
      description: "Följ debatter och läs anföranden från riksdagens kammare",
      icon: MessageSquare,
      href: "/riksdagen/anforanden",
      color: "text-purple-600"
    },
    {
      title: "Voteringar",
      description: "Se resultat från omröstningar och hur ledamöter röstat",
      icon: Vote,
      href: "/riksdagen/voteringar",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full bg-primary py-1"></div>
      
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
        <header className="text-center mb-16">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1" />
            <div className="flex-1 flex justify-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
                  Sveriges Riksdag
                </h1>
                <div className="w-20 h-1 bg-secondary mx-auto mb-6"></div>
              </div>
            </div>
            <div className="flex-1 flex justify-end">
              <DataFetchButton />
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Utforska data från riksdagens öppna API:er med hjälp av AI
          </p>
        </header>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {statsLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-20" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Dokument"
                value={stats?.dokument || 0}
                icon={FileText}
                iconColor="text-green-600"
              />
              <StatsCard
                title="Ledamöter"
                value={stats?.ledamoter || 0}
                icon={Users}
                iconColor="text-blue-600"
              />
              <StatsCard
                title="Anföranden"
                value={stats?.anforanden || 0}
                icon={MessageSquare}
                iconColor="text-purple-600"
              />
              <StatsCard
                title="Voteringar"
                value={stats?.voteringar || 0}
                icon={Vote}
                iconColor="text-orange-600"
              />
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {sections.map((section) => (
            <Link key={section.href} to={section.href}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <section.icon className={`h-8 w-8 ${section.color}`} />
                    <CardTitle className="text-2xl">{section.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {section.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link 
            to="/" 
            className="text-primary hover:underline inline-flex items-center gap-2"
          >
            ← Tillbaka till startsidan
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Riksdagen;
