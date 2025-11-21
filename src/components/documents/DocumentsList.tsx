import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Document } from "@/pages/Documents";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const openUrl = (url: string) => {
  let finalUrl = url;
  if (!url.match(/^https?:\/\//i)) {
    finalUrl = `https://${url}`;
  }
  window.open(finalUrl, "_blank");
};
interface DocumentsListProps {
  documents: Document[];
  isLoading: boolean;
  onDocumentClick: (document: Document) => void;
}
const CATEGORY_LABELS: Record<string, string> = {
  regelverk: "Regelverk",
  prosedyrer: "Prosedyrer",
  sjekklister: "Sjekklister",
  rapporter: "Rapporter",
  nettsider: "Nettsider",
  annet: "Annet"
};
const DocumentsList = ({
  documents,
  isLoading,
  onDocumentClick
}: DocumentsListProps) => {
  const handleOpenFile = async (filUrl: string) => {
    try {
      // Check if it's an external URL
      if (filUrl.startsWith('http://') || filUrl.startsWith('https://')) {
        window.open(filUrl, '_blank');
        return;
      }
      
      // It's a storage path - generate signed URL
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filUrl, 3600); // Valid for 1 hour

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      toast.error('Kunne ikke åpne dokumentet');
    }
  };

  const handleDownloadFile = async (filUrl: string, originalFileName?: string) => {
    try {
      if (filUrl.startsWith('http://') || filUrl.startsWith('https://')) {
        // External URL - just open it
        window.open(filUrl, '_blank');
        return;
      }
      
      // Storage path - download with original filename
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filUrl);

      if (error) throw error;
      
      if (data) {
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = originalFileName || filUrl.split('/').pop() || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Kunne ikke laste ned dokumentet');
    }
  };

  if (isLoading) {
    return <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>;
  }
  if (documents.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">
        Ingen dokumenter funnet
      </div>;
  }
  return <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="bg-slate-200 text-slate-950 opacity-100">Tittel</TableHead>
            <TableHead className="bg-slate-200 text-slate-950 shadow-sm">Kategori</TableHead>
            <TableHead className="bg-slate-200 text-slate-950">Utløpsdato</TableHead>
            <TableHead className="bg-slate-200 text-slate-950">Opprettet</TableHead>
            <TableHead className="bg-slate-200 text-slate-950 text-right">Handlinger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map(doc => <TableRow key={doc.id} className="cursor-pointer hover:bg-accent" onClick={() => onDocumentClick(doc)}>
              <TableCell className="font-medium bg-slate-200/50 text-slate-950 shadow-sm rounded-none">{doc.tittel}</TableCell>
              <TableCell className="bg-slate-200/50 text-slate-950">
                <Badge variant="secondary">
                  {CATEGORY_LABELS[doc.kategori] || doc.kategori}
                </Badge>
              </TableCell>
              <TableCell className="bg-slate-200/50 text-slate-950">
                {doc.gyldig_til ? format(new Date(doc.gyldig_til), "dd.MM.yyyy", {
              locale: nb
            }) : "Ingen utløpsdato"}
              </TableCell>
              <TableCell className="bg-slate-200/50 text-slate-950">
                {format(new Date(doc.opprettet_dato), "dd.MM.yyyy", {
              locale: nb
            })}
              </TableCell>
              <TableCell className="bg-slate-200/50 text-slate-950 text-right">
                <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                  {doc.fil_url && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Vis alternativ for dokument"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background">
                        <DropdownMenuItem onClick={() => handleOpenFile(doc.fil_url!)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Åpne
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadFile(doc.fil_url!, doc.fil_navn || undefined)}>
                          <Download className="h-4 w-4 mr-2" />
                          Last ned
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {doc.nettside_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUrl(doc.nettside_url!)}
                      title="Åpne nettside"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>;
};
export default DocumentsList;