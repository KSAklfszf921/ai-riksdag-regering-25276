import { Link } from "react-router-dom";
import { FileText, Newspaper, Scale, Database } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StatsCard from "@/components/StatsCard";
import DataFetchButton from "@/components/DataFetchButton";
import ProgressTracker from "@/components/ProgressTracker";
import { Skeleton } from "@/components/ui/skeleton";

const Regeringskansliet = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['regeringskansliet-stats'],
    queryFn: async () => {
      const [dokument, pressmeddelanden, propositioner, kategorier] = await Promise.all([
        supabase.from('regeringskansliet_dokument').select('id', { count: 'exact', head: true }),
        supabase.from('regeringskansliet_pressmeddelanden').select('id', { count: 'exact', head: true }),
        supabase.from('regeringskansliet_propositioner').select('id', { count: 'exact', head: true }),
        supabase.from('regeringskansliet_kategorier').select('id', { count: 'exact', head: true }),
      ]);
      
      return {
        dokument: dokument.count || 0,
        pressmeddelanden: pressmeddelanden.count || 0,
        propositioner: propositioner.count || 0,
        kategorier: kategorier.count || 0,
      };
    },
  });

  const sections = [
    {
      title: "Pressmeddelanden",
      description: "Senaste pressmeddelanden från regeringen och departementen",
      icon: Newspaper,
      href: "/regeringskansliet/pressmeddelanden",
      color: "text-blue-600"
    },
    {
      title: "Propositioner",
      description: "Lagförslag och propositioner från regeringen",
      icon: Scale,
      href: "/regeringskansliet/propositioner",
      color: "text-purple-600"
    },
    {
      title: "Dokument",
      description: "Alla dokument från regeringen.se i strukturerad form",
      icon: FileText,
      href: "/regeringskansliet/dokument",
      color: "text-green-600"
    },
    {
      title: "Kategorier",
      description: "Dokumentkategorier och klassificeringar",
      icon: Database,
      href: "/regeringskansliet/kategorier",
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
                  Regeringskansliet
                </h1>
                <div className="w-20 h-1 bg-secondary mx-auto mb-6"></div>
              </div>
            </div>
            <div className="flex-1 flex justify-end">
              <DataFetchButton type="regeringskansliet" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Utforska data från regeringen.se via g0v.se öppna data
          </p>
        </header>

        {/* Statistics */}
        <ProgressTracker source="regeringskansliet" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {statsLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-20" />
                  </CardHeader>
                  <Skeleton className="h-8 w-16 mx-6 mb-6" />
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
                title="Pressmeddelanden"
                value={stats?.pressmeddelanden || 0}
                icon={Newspaper}
                iconColor="text-blue-600"
              />
              <StatsCard
                title="Propositioner"
                value={stats?.propositioner || 0}
                icon={Scale}
                iconColor="text-purple-600"
              />
              <StatsCard
                title="Kategorier"
                value={stats?.kategorier || 0}
                icon={Database}
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

export default Regeringskansliet;
