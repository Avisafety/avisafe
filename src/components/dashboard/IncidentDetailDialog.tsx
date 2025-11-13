import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MapPin, Calendar, AlertTriangle, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

type Incident = Tables<"incidents">;

interface IncidentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: Incident | null;
}

const severityColors = {
  Lav: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
  Middels: "bg-status-yellow/20 text-yellow-700 dark:text-yellow-300 border-status-yellow/30",
  Høy: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
  Kritisk: "bg-status-red/20 text-red-700 dark:text-red-300 border-status-red/30",
};

const statusColors = {
  Ny: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
  "Under utredning": "bg-status-yellow/20 text-yellow-700 dark:text-yellow-300 border-status-yellow/30",
  "Tiltak iverksatt": "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
  Lukket: "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30",
  Åpen: "bg-status-red/20 text-red-700 dark:text-red-300 border-status-red/30",
  "Under behandling": "bg-status-yellow/20 text-yellow-700 dark:text-yellow-300 border-status-yellow/30",
  Ferdigbehandlet: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
};

export const IncidentDetailDialog = ({ open, onOpenChange, incident }: IncidentDetailDialogProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });
        setIsAdmin(data || false);
      }
    };
    checkAdmin();
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (!incident) return;
    
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status: newStatus })
        .eq('id', incident.id);

      if (error) throw error;

      toast.success("Status oppdatert");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Kunne ikke oppdatere status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!incident) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{incident.tittel}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="status-select">Endre status (Admin)</Label>
              <Select 
                value={incident.status} 
                onValueChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <SelectTrigger id="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Åpen">Åpen</SelectItem>
                  <SelectItem value="Under behandling">Under behandling</SelectItem>
                  <SelectItem value="Ferdigbehandlet">Ferdigbehandlet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge className={`${statusColors[incident.status as keyof typeof statusColors] || 'bg-gray-500/20'} border`}>
              {incident.status}
            </Badge>
            <Badge className={`${severityColors[incident.alvorlighetsgrad as keyof typeof severityColors] || 'bg-gray-500/20'} border`}>
              Alvorlighetsgrad: {incident.alvorlighetsgrad}
            </Badge>
            {incident.kategori && (
              <Badge variant="outline">
                {incident.kategori}
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hendelsestidspunkt</p>
                <p className="text-base">
                  {format(new Date(incident.hendelsestidspunkt), "dd. MMMM yyyy, HH:mm", { locale: nb })}
                </p>
              </div>
            </div>

            {incident.lokasjon && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lokasjon</p>
                  <p className="text-base">{incident.lokasjon}</p>
                </div>
              </div>
            )}

            {incident.rapportert_av && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rapportert av</p>
                  <p className="text-base">{incident.rapportert_av}</p>
                </div>
              </div>
            )}

            {incident.opprettet_dato && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rapportert dato</p>
                  <p className="text-base">
                    {format(new Date(incident.opprettet_dato), "dd. MMMM yyyy, HH:mm", { locale: nb })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {incident.beskrivelse && (
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Beskrivelse</p>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{incident.beskrivelse}</p>
            </div>
          )}

          {(incident.alvorlighetsgrad === "Høy" || incident.alvorlighetsgrad === "Kritisk") && incident.status === "Åpen" && (
            <div className="border border-destructive/30 bg-destructive/10 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    {incident.alvorlighetsgrad === "Kritisk" ? "Kritisk hendelse" : "Høy alvorlighetsgrad"}
                  </p>
                  <p className="text-sm mt-1 text-destructive/90">
                    Denne hendelsen krever umiddelbar oppmerksomhet og oppfølging.
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