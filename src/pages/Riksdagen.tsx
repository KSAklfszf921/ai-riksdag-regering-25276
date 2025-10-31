import { Link } from "react-router-dom";
import { FileText, Users, MessageSquare, Vote } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Riksdagen = () => {
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
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Sveriges Riksdag
          </h1>
          <div className="w-20 h-1 bg-secondary mx-auto mb-6"></div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Utforska data från riksdagens öppna API:er med hjälp av AI
          </p>
        </header>

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
