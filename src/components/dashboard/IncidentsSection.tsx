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
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h2 className="text-sm font-semibold">Hendelser</h2>
        </div>
        <Button size="sm" variant="destructive" className="gap-1 h-7 text-xs">
          <AlertTriangle className="w-3 h-3" />
          Rapporter
        </Button>
      </div>

      <Tabs defaultValue="incidents" className="w-full">
        <TabsList className="w-full h-8">
          <TabsTrigger value="incidents" className="flex-1 text-xs">
            Hendelser ({mockIncidents.length})
          </TabsTrigger>
          <TabsTrigger value="followups" className="flex-1 text-xs">
            Oppfølging ({mockFollowUps.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-1.5 mt-2">
          {mockIncidents.slice(0, 4).map((incident) => (
            <div
              key={incident.id}
              className="p-2 bg-card/30 rounded hover:bg-card/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-xs mb-0.5">{incident.tittel}</h3>
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    <Badge className={`${severityColors[incident.alvorlighet]} text-[10px] px-1 py-0`}>
                      {incident.alvorlighet}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">{incident.kategori}</Badge>
                    <span className="text-muted-foreground">
                      {format(incident.tidspunkt, "dd. MMM", { locale: nb })}
                    </span>
                  </div>
                </div>
                <Badge className={`${statusColors[incident.status]} text-[10px] px-1 py-0`}>{incident.status}</Badge>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="followups" className="space-y-1.5 mt-2">
          {mockFollowUps.map((followUp) => {
            const incident = mockIncidents.find((i) => i.id === followUp.hendelse_id);
            return (
              <div
                key={followUp.id}
                className="p-2 bg-card/30 rounded hover:bg-card/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs mb-0.5">{incident?.tittel}</h3>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1">
                      {followUp.tiltak}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <div className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{format(followUp.frist, "dd. MMM", { locale: nb })}</span>
                      </div>
                      {followUp.ansvarlig && (
                        <span className="text-muted-foreground">• {followUp.ansvarlig}</span>
                      )}
                    </div>
                  </div>
                  <Badge className={`${statusColors[followUp.status]} text-[10px] px-1 py-0`}>{followUp.status}</Badge>
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </GlassCard>
  );
};
