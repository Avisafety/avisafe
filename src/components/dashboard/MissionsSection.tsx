import { GlassCard } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { mockMissions } from "@/data/mockData";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const statusColors = {
  Planlagt: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  Tildelt: "bg-status-yellow/20 text-yellow-700 dark:text-yellow-300",
  Pågår: "bg-status-green/20 text-green-700 dark:text-green-300",
  Fullført: "bg-gray-500/20 text-gray-700 dark:text-gray-300",
  Avlyst: "bg-status-red/20 text-red-700 dark:text-red-300",
};

const riskColors = {
  Lav: "bg-status-green/20 text-green-700 dark:text-green-300",
  Middels: "bg-status-yellow/20 text-yellow-700 dark:text-yellow-300",
  Høy: "bg-status-red/20 text-red-700 dark:text-red-300",
};

export const MissionsSection = () => {
  return (
    <GlassCard className="h-[500px] flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold">Kommende oppdrag</h2>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {mockMissions.map((mission) => (
          <div
            key={mission.id}
            className="p-3 bg-card/30 rounded hover:bg-card/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-semibold text-sm">{mission.tittel}</h3>
              <Badge className={`${statusColors[mission.status]} text-xs px-1.5 py-0.5`}>{mission.status}</Badge>
            </div>
            
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5">
              <MapPin className="w-4 h-4" />
              <span>{mission.lokasjon}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {format(mission.start, "dd. MMM HH:mm", { locale: nb })}
              </Badge>
              <Badge className={`${riskColors[mission.risk_nivå]} text-xs px-1.5 py-0.5`}>
                {mission.risk_nivå}
              </Badge>
              <span className="text-muted-foreground">• {mission.kunde}</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
