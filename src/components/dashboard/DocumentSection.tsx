import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Search, AlertCircle } from "lucide-react";
import { mockDocuments } from "@/data/mockData";
import { Document } from "@/types";

const getDocumentStatus = (doc: Document) => {
  if (!doc.gyldig_til) return "Grønn";
  
  const today = new Date();
  const daysUntilExpiry = Math.floor(
    (doc.gyldig_til.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysUntilExpiry < 0) return "Rød";
  if (daysUntilExpiry <= doc.varsel_dager_for_utløp) return "Gul";
  return "Grønn";
};

const StatusDot = ({ status }: { status: string }) => {
  const colors = {
    Grønn: "bg-status-green",
    Gul: "bg-status-yellow",
    Rød: "bg-status-red",
  };
  return <div className={`w-2 h-2 rounded-full ${colors[status as keyof typeof colors]}`} />;
};

export const DocumentSection = () => {
  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Dokumenter</h2>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Legg til
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Søk i dokumenter..." className="pl-9" />
      </div>

      <div className="space-y-3">
        {mockDocuments.map((doc) => {
          const status = getDocumentStatus(doc);
          return (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-card/30 rounded-lg hover:bg-card/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1">
                <StatusDot status={status} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{doc.tittel}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                      {doc.kategori}
                    </span>
                    <span>v{doc.versjon}</span>
                  </div>
                </div>
              </div>
              
              {status !== "Grønn" && doc.gyldig_til && (
                <div className="flex items-center gap-1 text-xs">
                  <AlertCircle className="w-3 h-3 text-destructive" />
                  <span className={status === "Rød" ? "text-destructive font-medium" : "text-status-yellow"}>
                    {status === "Rød" ? "Utløpt" : "Utgår snart"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
