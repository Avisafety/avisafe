import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Person } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface PersonnelListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personnel: Person[];
}

export const PersonnelListDialog = ({ open, onOpenChange, personnel }: PersonnelListDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Personell ({personnel.length})</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {personnel.map((person) => (
            <div key={person.id} className="border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{person.navn}</h3>
                  <p className="text-sm text-muted-foreground">{person.rolle}</p>
                </div>
                <StatusBadge status={person.status} />
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{person.telefon}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{person.epost}</span>
                </div>
              </div>
              
              {person.kompetanse && person.kompetanse.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Kompetanse:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {person.kompetanse.map((komp, idx) => (
                      <span key={idx} className="px-2 py-1 bg-muted rounded text-xs">
                        {komp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {person.tilgjengelig_fra && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Tilgjengelig fra:</span>
                  <span className="ml-2 font-medium">
                    {format(person.tilgjengelig_fra, "dd.MM.yyyy", { locale: nb })}
                  </span>
                </div>
              )}
              
              {person.merknader && (
                <div className="text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Merknader:</span>
                  <p className="mt-1">{person.merknader}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};