import { OpenAIPMap } from "@/components/OpenAIPMap";
import { MissionDetailDialog } from "@/components/dashboard/MissionDetailDialog";
import { Header } from "@/components/Header";
import { useState } from "react";

export default function KartPage() {
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [missionDialogOpen, setMissionDialogOpen] = useState(false);

  const handleMissionClick = (mission: any) => {
    setSelectedMission(mission);
    setMissionDialogOpen(true);
  };

  return (
    <div className="h-screen flex flex-col w-full overflow-hidden">
      <Header />

      {/* Map Content */}
      <div className="flex-1 relative overflow-hidden">
        <OpenAIPMap onMissionClick={handleMissionClick} />
      </div>

      {/* Mission Detail Dialog */}
      <MissionDetailDialog
        open={missionDialogOpen}
        onOpenChange={setMissionDialogOpen}
        mission={selectedMission}
      />
    </div>
  );
}
