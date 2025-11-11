import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { mockFollowUps } from "@/data/mockData";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useState, useEffect } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { IncidentDetailDialog } from "./IncidentDetailDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const severityColors = {
  Lav: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  Middels: "bg-status-yellow/20 text-yellow-700 dark:text-yellow-300",
  Høy: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
  Kritisk: "bg-status-red/20 text-red-700 dark:text-red-300",
};

const statusColors = {
  Ny: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  "Under utredning": "bg-status-yellow/20 text-yellow-700 dark:text-yellow-300",
  "Tiltak iverksatt": "bg-green-500/20 text-green-700 dark:text-green-300",
  Lukket: "bg-gray-500/20 text-gray-700 dark:text-gray-300",
  Åpen: "bg-status-red/20 text-red-700 dark:text-red-300",
  "Under behandling": "bg-status-yellow/20 text-yellow-700 dark:text-yellow-300",
  Ferdigbehandlet: "bg-green-500/20 text-green-700 dark:text-green-300",
  Pågår: "bg-status-yellow/20 text-yellow-700 dark:text-yellow-300",
  Utført: "bg-status-green/20 text-green-700 dark:text-green-300",
  Forsinket: "bg-status-red/20 text-red-700 dark:text-red-300",
};

type Incident = Tables<"incidents">;

export const IncidentsSection = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    tittel: "",
    beskrivelse: "",
    hendelsestidspunkt: "",
    alvorlighetsgrad: "Middels",
    status: "Åpen",
    kategori: "",
    lokasjon: "",
  });
  
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Fetch incidents from database
  useEffect(() => {
    fetchIncidents();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('incidents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setIncidents((current) => [payload.new as Incident, ...current]);
          } else if (payload.eventType === 'UPDATE') {
            setIncidents((current) =>
              current.map((incident) =>
                incident.id === (payload.new as Incident).id ? (payload.new as Incident) : incident
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setIncidents((current) =>
              current.filter((incident) => incident.id !== (payload.old as Incident).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('hendelsestidspunkt', { ascending: false });

      if (error) throw error;

      setIncidents(data || []);
    } catch (error: any) {
      console.error('Error fetching incidents:', error);
      toast.error('Kunne ikke laste hendelser');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.tittel || !formData.hendelsestidspunkt) {
      toast.error("Vennligst fyll ut alle påkrevde felt");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Du må være logget inn for å rapportere hendelser");
        setSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('incidents')
        .insert({
          user_id: user.id,
          tittel: formData.tittel,
          beskrivelse: formData.beskrivelse,
          hendelsestidspunkt: new Date(formData.hendelsestidspunkt).toISOString(),
          alvorlighetsgrad: formData.alvorlighetsgrad,
          status: formData.status,
          kategori: formData.kategori || null,
          lokasjon: formData.lokasjon || null,
          rapportert_av: user.email || 'Ukjent',
        });

      if (error) throw error;

      toast.success("Hendelse rapportert!");
      setDialogOpen(false);
      setFormData({
        tittel: "",
        beskrivelse: "",
        hendelsestidspunkt: "",
        alvorlighetsgrad: "Middels",
        status: "Åpen",
        kategori: "",
        lokasjon: "",
      });
      
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(`Feil ved rapportering: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setDetailDialogOpen(true);
  };

  return (
    <>
      <GlassCard className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
          <h2 className="text-sm sm:text-base font-semibold">Hendelser</h2>
        </div>
        <Button 
          size="sm" 
          variant="destructive" 
          className="gap-1 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
          onClick={() => setDialogOpen(true)}
        >
          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Rapporter</span>
        </Button>
      </div>

      <Tabs defaultValue="incidents" className="w-full flex-1 flex flex-col">
        <TabsList className="w-full h-8 sm:h-9">
          <TabsTrigger value="incidents" className="flex-1 text-xs sm:text-sm">
            Hendelser ({incidents.length})
          </TabsTrigger>
          <TabsTrigger value="followups" className="flex-1 text-xs sm:text-sm">
            Oppfølging ({mockFollowUps.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-1.5 sm:space-y-2 mt-2 sm:mt-3 flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground">
              Laster hendelser...
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground">
              Ingen hendelser registrert
            </div>
          ) : (
            incidents.slice(0, 4).map((incident) => (
              <div
                key={incident.id}
                onClick={() => handleIncidentClick(incident)}
                className="p-2 sm:p-3 bg-card/30 rounded hover:bg-card/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs sm:text-sm mb-1">{incident.tittel}</h3>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                      <Badge className={`${severityColors[incident.alvorlighetsgrad as keyof typeof severityColors] || 'bg-gray-500/20'} text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5`}>
                        {incident.alvorlighetsgrad}
                      </Badge>
                      {incident.kategori && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5">{incident.kategori}</Badge>
                      )}
                      <span className="text-muted-foreground">
                        {format(new Date(incident.hendelsestidspunkt), "dd. MMM", { locale: nb })}
                      </span>
                    </div>
                  </div>
                  <Badge className={`${statusColors[incident.status as keyof typeof statusColors] || 'bg-gray-500/20'} text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 whitespace-nowrap`}>{incident.status}</Badge>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="followups" className="space-y-1.5 sm:space-y-2 mt-2 sm:mt-3 flex-1 overflow-y-auto">
          {mockFollowUps.map((followUp) => {
            const incident = incidents.find((i) => i.id === followUp.hendelse_id);
            return (
              <div
                key={followUp.id}
                className="p-2 sm:p-3 bg-card/30 rounded hover:bg-card/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs sm:text-sm mb-1">{incident?.tittel}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mb-1 sm:mb-1.5">
                      {followUp.tiltak}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{format(followUp.frist, "dd. MMM", { locale: nb })}</span>
                      </div>
                      {followUp.ansvarlig && (
                        <span className="text-muted-foreground truncate">• {followUp.ansvarlig}</span>
                      )}
                    </div>
                  </div>
                  <Badge className={`${statusColors[followUp.status]} text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 whitespace-nowrap`}>{followUp.status}</Badge>
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Rapporter hendelse</DialogTitle>
            <DialogDescription>
              Fyll ut informasjon om hendelsen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tittel">Tittel *</Label>
              <Input
                id="tittel"
                value={formData.tittel}
                onChange={(e) => setFormData({ ...formData, tittel: e.target.value })}
                placeholder="Kort beskrivelse av hendelsen"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="beskrivelse">Beskrivelse</Label>
              <Textarea
                id="beskrivelse"
                value={formData.beskrivelse}
                onChange={(e) => setFormData({ ...formData, beskrivelse: e.target.value })}
                placeholder="Detaljert beskrivelse av hendelsen..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hendelsestidspunkt">Hendelsestidspunkt *</Label>
              <Input
                id="hendelsestidspunkt"
                type="datetime-local"
                value={formData.hendelsestidspunkt}
                onChange={(e) => setFormData({ ...formData, hendelsestidspunkt: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alvorlighetsgrad">Alvorlighetsgrad</Label>
              <Select
                value={formData.alvorlighetsgrad}
                onValueChange={(value) => setFormData({ ...formData, alvorlighetsgrad: value })}
              >
                <SelectTrigger id="alvorlighetsgrad">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lav">Lav</SelectItem>
                  <SelectItem value="Middels">Middels</SelectItem>
                  <SelectItem value="Høy">Høy</SelectItem>
                  <SelectItem value="Kritisk">Kritisk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Åpen">Åpen</SelectItem>
                  <SelectItem value="Under behandling">Under behandling</SelectItem>
                  <SelectItem value="Ferdigbehandlet">Ferdigbehandlet</SelectItem>
                  <SelectItem value="Lukket">Lukket</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kategori">Kategori (valgfritt)</Label>
              <Input
                id="kategori"
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                placeholder="F.eks. Teknisk, Operasjonell, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lokasjon">Lokasjon (valgfritt)</Label>
              <Input
                id="lokasjon"
                value={formData.lokasjon}
                onChange={(e) => setFormData({ ...formData, lokasjon: e.target.value })}
                placeholder="F.eks. Oslo, Hangar A, etc."
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setFormData({
                    tittel: "",
                    beskrivelse: "",
                    hendelsestidspunkt: "",
                    alvorlighetsgrad: "Middels",
                    status: "Åpen",
                    kategori: "",
                    lokasjon: "",
                  });
                }}
                className="flex-1"
              >
                Avbryt
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !formData.tittel || !formData.hendelsestidspunkt}
                className="flex-1"
              >
                {submitting ? "Rapporterer..." : "Rapporter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <IncidentDetailDialog 
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        incident={selectedIncident}
      />
    </GlassCard>
    </>
  );
};
