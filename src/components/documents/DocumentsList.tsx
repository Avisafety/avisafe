import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Document } from "@/pages/Documents";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
  annet: "Annet",
};

const DocumentsList = ({ documents, isLoading, onDocumentClick }: DocumentsListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Ingen dokumenter funnet
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tittel</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Utløpsdato</TableHead>
            <TableHead>Opprettet</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow
              key={doc.id}
              className="cursor-pointer hover:bg-accent"
              onClick={() => onDocumentClick(doc)}
            >
              <TableCell className="font-medium">{doc.tittel}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {CATEGORY_LABELS[doc.kategori] || doc.kategori}
                </Badge>
              </TableCell>
              <TableCell>
                {doc.gyldig_til
                  ? format(new Date(doc.gyldig_til), "dd.MM.yyyy", { locale: nb })
                  : "Ingen utløpsdato"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(doc.opprettet_dato), "dd.MM.yyyy", { locale: nb })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentsList;
