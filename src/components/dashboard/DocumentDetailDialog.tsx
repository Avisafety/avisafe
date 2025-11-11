import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Document } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar, AlertCircle, FileText, User } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

interface DocumentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  status: string;
}

export const DocumentDetailDialog = ({ open, onOpenChange, document, status }: DocumentDetailDialogProps) => {
  if (!document) return null;

  const getDaysUntilExpiry = () => {
    if (!document.gyldig_til) return null;
    const today = new Date();
    return Math.floor(
      (document.gyldig_til.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="text-xl">{document.tittel}</DialogTitle>
            <StatusBadge status={status as any} />
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {document.kategori}
            </Badge>
            <Badge variant="outline">
              Versjon {document.versjon}
            </Badge>
            {document.synlighet && (
              <Badge variant="outline">
                {document.synlighet}
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            {document.utsteder && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Utsteder</p>
                  <p className="text-base">{document.utsteder}</p>
                </div>
              </div>
            )}

            {document.gyldig_til && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Gyldig til</p>
                  <p className="text-base">
                    {format(document.gyldig_til, "dd. MMMM yyyy", { locale: nb })}
                  </p>
                  {daysUntilExpiry !== null && (
                    <p className={`text-sm mt-1 ${
                      daysUntilExpiry < 0 
                        ? "text-destructive font-medium"
                        : daysUntilExpiry <= document.varsel_dager_for_utløp
                        ? "text-status-yellow"
                        : "text-muted-foreground"
                    }`}>
                      {daysUntilExpiry < 0 
                        ? `Utløpt for ${Math.abs(daysUntilExpiry)} dager siden`
                        : daysUntilExpiry === 0
                        ? "Utløper i dag"
                        : `${daysUntilExpiry} dager igjen`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {document.sist_endret && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sist endret</p>
                  <p className="text-base">
                    {format(document.sist_endret, "dd. MMMM yyyy, HH:mm", { locale: nb })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {document.merknader && (
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Merknader</p>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{document.merknader}</p>
            </div>
          )}

          {status === "Rød" && (
            <div className="border border-destructive/30 bg-destructive/10 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Dokumentet har utløpt</p>
                  <p className="text-sm mt-1 text-destructive/90">
                    Dette dokumentet må fornyes umiddelbart for å opprettholde compliance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === "Gul" && (
            <div className="border border-amber-500/30 bg-amber-500/10 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Dokumentet nærmer seg utløp
                  </p>
                  <p className="text-sm mt-1 text-amber-900 dark:text-amber-100">
                    Vennligst sørg for fornyelse innen utløpsdato.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};