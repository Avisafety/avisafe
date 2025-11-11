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
    <GlassCard>
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">Kommende oppdrag</h2>
      </div>

      <div className="space-y-2">
        {mockMissions.map((mission) => (
          <div
            key={mission.id}
            className="p-2 bg-card/30 rounded hover:bg-card/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-xs">{mission.tittel}</h3>
              <Badge className={`${statusColors[mission.status]} text-[10px] px-1 py-0`}>{mission.status}</Badge>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <MapPin className="w-3 h-3" />
              <span>{mission.lokasjon}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-1 text-[10px]">
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {format(mission.start, "dd. MMM HH:mm", { locale: nb })}
              </Badge>
              <Badge className={`${riskColors[mission.risk_nivå]} text-[10px] px-1 py-0`}>
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
