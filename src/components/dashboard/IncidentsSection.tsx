import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { mockIncidents, mockFollowUps } from "@/data/mockData";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

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
  Pågår: "bg-status-yellow/20 text-yellow-700 dark:text-yellow-300",
  Utført: "bg-status-green/20 text-green-700 dark:text-green-300",
  Forsinket: "bg-status-red/20 text-red-700 dark:text-red-300",
};

export const IncidentsSection = () => {
  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h2 className="text-xl font-semibold">Hendelser & Oppfølging</h2>
        </div>
        <Button size="sm" variant="destructive" className="gap-2">
          <AlertTriangle className="w-4 h-4" />
          Rapporter hendelse
        </Button>
      </div>

      <Tabs defaultValue="incidents" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="incidents" className="flex-1">
            Hendelser ({mockIncidents.length})
          </TabsTrigger>
          <TabsTrigger value="followups" className="flex-1">
            Oppfølging ({mockFollowUps.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-2 mt-4">
          {mockIncidents.slice(0, 4).map((incident) => (
            <div
              key={incident.id}
              className="p-3 bg-card/30 rounded-lg hover:bg-card/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">{incident.tittel}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge className={severityColors[incident.alvorlighet]}>
                      {incident.alvorlighet}
                    </Badge>
                    <Badge variant="outline">{incident.kategori}</Badge>
                    <span className="text-muted-foreground">
                      {format(incident.tidspunkt, "dd. MMM yyyy", { locale: nb })}
                    </span>
                  </div>
                </div>
                <Badge className={statusColors[incident.status]}>{incident.status}</Badge>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="followups" className="space-y-2 mt-4">
          {mockFollowUps.map((followUp) => {
            const incident = mockIncidents.find((i) => i.id === followUp.hendelse_id);
            return (
              <div
                key={followUp.id}
                className="p-3 bg-card/30 rounded-lg hover:bg-card/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-1">{incident?.tittel}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {followUp.tiltak}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Frist: {format(followUp.frist, "dd. MMM", { locale: nb })}</span>
                      </div>
                      {followUp.ansvarlig && (
                        <span className="text-muted-foreground">• {followUp.ansvarlig}</span>
                      )}
                    </div>
                  </div>
                  <Badge className={statusColors[followUp.status]}>{followUp.status}</Badge>
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </GlassCard>
  );
};
