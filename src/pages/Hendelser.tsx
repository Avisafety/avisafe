import { useState, useEffect } from "react";
import droneBackground from "@/assets/drone-background.png";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddIncidentDialog } from "@/components/dashboard/AddIncidentDialog";
import { IncidentDetailDialog } from "@/components/dashboard/IncidentDetailDialog";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

type Incident = {
  id: string;
  tittel: string;
  beskrivelse: string | null;
  hendelsestidspunkt: string;
  alvorlighetsgrad: string;
  status: string;
  kategori: string | null;
  lokasjon: string | null;
  rapportert_av: string | null;
  opprettet_dato: string | null;
  oppdatert_dato: string | null;
  user_id: string | null;
};

const statusOptions = ["Alle", "Åpen", "Under behandling", "Ferdigbehandlet", "Lukket"];

const severityColors: Record<string, string> = {
  Kritisk: "bg-red-500/20 text-red-300 border-red-500/30",
  Høy: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Middels: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Lav: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

const statusColors: Record<string, string> = {
  Åpen: "bg-red-500/20 text-red-300 border-red-500/30",
  "Under behandling": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Ferdigbehandlet: "bg-green-500/20 text-green-300 border-green-500/30",
  Lukket: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const Hendelser = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Alle");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();

    const channel = supabase
      .channel('incidents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents'
        },
        () => {
          fetchIncidents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterIncidents();
  }, [incidents, searchQuery, selectedStatus]);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('opprettet_dato', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterIncidents = () => {
    let filtered = [...incidents];

    // Filter by status
    if (selectedStatus !== "Alle") {
      filtered = filtered.filter(incident => incident.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(incident =>
        incident.tittel.toLowerCase().includes(query) ||
        incident.beskrivelse?.toLowerCase().includes(query) ||
        incident.kategori?.toLowerCase().includes(query) ||
        incident.rapportert_av?.toLowerCase().includes(query) ||
        incident.lokasjon?.toLowerCase().includes(query)
      );
    }

    setFilteredIncidents(filtered);
  };

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setDetailDialogOpen(true);
  };

  return (
    <div className="min-h-screen relative w-full overflow-x-hidden">
      {/* Background with gradient overlay */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url(${droneBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Hendelser</h1>
          <p className="text-muted-foreground">Oversikt over alle rapporterte hendelser</p>
        </div>

        <GlassCard className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Søk i hendelser..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Legg til hendelse
            </Button>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            {statusOptions.map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </GlassCard>

        {loading ? (
          <GlassCard>
            <p className="text-center text-muted-foreground py-8">Laster hendelser...</p>
          </GlassCard>
        ) : filteredIncidents.length === 0 ? (
          <GlassCard>
            <p className="text-center text-muted-foreground py-8">
              {searchQuery || selectedStatus !== "Alle" 
                ? "Ingen hendelser funnet med valgte filtre" 
                : "Ingen hendelser rapportert ennå"}
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-4">
            {filteredIncidents.map((incident) => (
              <GlassCard key={incident.id}>
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleIncidentClick(incident)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{incident.tittel}</h3>
                        <Badge className={statusColors[incident.status] || ""}>
                          {incident.status}
                        </Badge>
                        <Badge className={severityColors[incident.alvorlighetsgrad] || ""}>
                          {incident.alvorlighetsgrad}
                        </Badge>
                        {incident.kategori && (
                          <Badge variant="outline">{incident.kategori}</Badge>
                        )}
                      </div>
                      
                      {incident.beskrivelse && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {incident.beskrivelse}
                        </p>
                      )}
                      
                      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                        {incident.lokasjon && (
                          <span>📍 {incident.lokasjon}</span>
                        )}
                        <span>
                          📅 {format(new Date(incident.hendelsestidspunkt), "d. MMM yyyy HH:mm", { locale: nb })}
                        </span>
                        {incident.rapportert_av && (
                          <span>👤 {incident.rapportert_av}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
        </main>
      </div>

      <AddIncidentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      <IncidentDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        incident={selectedIncident}
      />
    </div>
  );
};

export default Hendelser;
