import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MapPin, Calendar, AlertTriangle } from "lucide-react";

type Mission = any;

interface MissionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mission: Mission | null;
}

const statusColors: Record<string, string> = {
  Planlagt: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
  Pågående: "bg-status-yellow/20 text-yellow-700 dark:text-yellow-300 border-status-yellow/30",
  Fullført: "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30",
};

const riskColors: Record<string, string> = {
  Lav: "bg-status-green/20 text-green-700 dark:text-green-300 border-status-green/30",
  Middels: "bg-status-yellow/20 text-yellow-700 dark:text-yellow-300 border-status-yellow/30",
  Høy: "bg-status-red/20 text-red-700 dark:text-red-300 border-status-red/30",
};

export const MissionDetailDialog = ({ open, onOpenChange, mission }: MissionDetailDialogProps) => {
  if (!mission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{mission.tittel}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className={`${statusColors[mission.status] || ""} border`}>
              {mission.status}
            </Badge>
            <Badge className={`${riskColors[mission.risk_nivå] || ""} border`}>
              Risiko: {mission.risk_nivå}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lokasjon</p>
                <p className="text-base">{mission.lokasjon}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tidspunkt</p>
                <p className="text-base">
                  {format(new Date(mission.tidspunkt), "dd. MMMM yyyy, HH:mm", { locale: nb })}
                </p>
              </div>
            </div>
          </div>

          {mission.beskrivelse && (
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Beskrivelse</p>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{mission.beskrivelse}</p>
            </div>
          )}

          {mission.merknader && (
            <div className="border border-amber-500/30 bg-amber-500/10 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Merknader</p>
                  <p className="text-sm mt-1 text-amber-900 dark:text-amber-100">{mission.merknader}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};