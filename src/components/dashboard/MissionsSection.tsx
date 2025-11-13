import { GlassCard } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Plus } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useState, useEffect } from "react";
import { MissionDetailDialog } from "./MissionDetailDialog";
import { AddMissionDialog } from "./AddMissionDialog";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Mission = Tables<"missions">;

const statusColors: Record<string, string> = {
  Planlagt: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  Pågående: "bg-status-yellow/20 text-yellow-700 dark:text-yellow-300",
  Fullført: "bg-gray-500/20 text-gray-700 dark:text-gray-300",
};

const riskColors: Record<string, string> = {
  Lav: "bg-status-green/20 text-green-700 dark:text-green-300",
  Middels: "bg-status-yellow/20 text-yellow-700 dark:text-yellow-300",
  Høy: "bg-status-red/20 text-red-700 dark:text-red-300",
};

export const MissionsSection = () => {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    fetchMissions();

    const channel = supabase
      .channel('missions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'missions',
        },
        () => {
          fetchMissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMissions = async () => {
    const { data, error } = await supabase
      .from("missions")
      .select("*")
      .neq("status", "Fullført")
      .order("tidspunkt", { ascending: true });

    if (error) {
      console.error("Error fetching missions:", error);
    } else {
      setMissions(data || []);
    }
  };

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission);
    setDialogOpen(true);
  };

  return (
    <>
      <GlassCard className="h-[400px] flex flex-col">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <h2 className="text-sm sm:text-base font-semibold">Kommende oppdrag</h2>
          </div>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-1.5 sm:space-y-2 flex-1 overflow-y-auto">
          {missions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Ingen kommende oppdrag</p>
          ) : (
            missions.map((mission) => (
              <div
                key={mission.id}
                onClick={() => handleMissionClick(mission)}
                className="p-2 sm:p-3 bg-card/30 rounded hover:bg-card/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-1 sm:mb-1.5">
                  <h3 className="font-semibold text-xs sm:text-sm">{mission.tittel}</h3>
                  <Badge className={`${statusColors[mission.status] || ""} text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 whitespace-nowrap`}>
                    {mission.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-1.5">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate">{mission.lokasjon}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                  <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5">
                    {format(new Date(mission.tidspunkt), "dd. MMM HH:mm", { locale: nb })}
                  </Badge>
                  <Badge className={`${riskColors[mission.risk_nivå] || ""} text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5`}>
                    {mission.risk_nivå}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
    </GlassCard>
    
      <MissionDetailDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mission={selectedMission}
      />
      
      <AddMissionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onMissionAdded={fetchMissions}
      />
    </>
  );
};
