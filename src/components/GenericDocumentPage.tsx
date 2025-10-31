import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Calendar, User, Download, ArrowLeft } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ProgressTracker from "@/components/ProgressTracker";
import { format } from "date-fns";

interface GenericDocumentPageProps {
  tableName: string;
  title: string;
  description: string;
  source: "riksdagen" | "regeringskansliet";
  backLink?: string;
  dataType?: string;
  dateColumn?: string;
  titleColumn?: string;
}

export const GenericDocumentPage = ({
  tableName,
  title,
  description,
  source,
  backLink = source === "riksdagen" ? "/riksdagen" : "/regeringskansliet",
  dataType,
  dateColumn = "publicerad_datum",
  titleColumn = "titel",
}: GenericDocumentPageProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("datum");

  const { data: documents, isLoading } = useQuery({
    queryKey: [tableName, searchQuery, sortBy],
    queryFn: async () => {
      let query = supabase.from(tableName as any).select("*");

      if (searchQuery) {
        query = query.or(`titel.ilike.%${searchQuery}%,document_id.ilike.%${searchQuery}%,beteckningsnummer.ilike.%${searchQuery}%`);
      }

      const sortColumn = sortBy === "datum" ? dateColumn : titleColumn;
      query = query.order(sortColumn, { ascending: sortBy === "datum" ? false : true, nullsFirst: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const renderLocalFiles = (localFiles: any) => {
    if (!localFiles) return null;

    const files = Array.isArray(localFiles) ? localFiles : [localFiles];
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {files.map((file: any, idx: number) => {
          const fileName = file.name || file.filename || `Fil ${idx + 1}`;
          const fileUrl = file.url || file.local_url || file;
          
          if (typeof fileUrl === 'string' && fileUrl) {
            return (
              <a
                key={idx}
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Download className="h-3 w-3" />
                {fileName}
              </a>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Link to={backLink}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
          </Link>
          
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-muted-foreground text-lg mb-6">{description}</p>

          <ProgressTracker source={source} />

          <div className="flex gap-4 items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Sök efter titel, dokumentnummer eller beteckning..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-md bg-background"
            >
              <option value="datum">Sortera efter datum</option>
              <option value="titel">Sortera efter titel</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : !documents || documents.length === 0 ? (
          <EmptyState
            message={`Inga ${title.toLowerCase()} hittades`}
            suggestion={searchQuery ? "Prova att ändra din sökning" : `Använd knappen ovan för att hämta ${title.toLowerCase()}`}
          />
        ) : (
          <div className="space-y-4">
            {documents.map((doc: any) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {doc.titel || doc.document_id}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        {doc.beteckningsnummer && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{doc.beteckningsnummer}</span>
                          </div>
                        )}
                        {doc.publicerad_datum && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(doc.publicerad_datum), "d MMMM yyyy")}
                            </span>
                          </div>
                        )}
                        {(doc.avsandare || doc.departement) && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{doc.avsandare || doc.departement}</span>
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    {doc.kategorier && doc.kategorier.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-4">
                        {doc.kategorier.slice(0, 3).map((kat: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {kat}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {doc.innehall && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                      {doc.innehall}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Visa original
                        </Button>
                      </a>
                    )}
                    {doc.local_pdf_url && (
                      <a href={doc.local_pdf_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Ladda ner PDF
                        </Button>
                      </a>
                    )}
                    {doc.markdown_url && (
                      <a href={doc.markdown_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Markdown
                        </Button>
                      </a>
                    )}
                  </div>
                  {(doc.local_files || doc.local_bilagor) && renderLocalFiles(doc.local_files || doc.local_bilagor)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};