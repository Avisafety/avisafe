import { GlassCard } from "@/components/GlassCard";
import { mockDrones, mockEquipment, mockPersonnel } from "@/data/mockData";
import { Plane, Gauge, Users } from "lucide-react";
import { Status } from "@/types";
import { useState } from "react";
import { DroneListDialog } from "./DroneListDialog";
import { EquipmentListDialog } from "./EquipmentListDialog";
import { PersonnelListDialog } from "./PersonnelListDialog";
interface StatusCounts {
  Grønn: number;
  Gul: number;
  Rød: number;
}
const countByStatus = (items: {
  status: Status;
}[]): StatusCounts => {
  return items.reduce((acc, item) => {
    acc[item.status]++;
    return acc;
  }, {
    Grønn: 0,
    Gul: 0,
    Rød: 0
  });
};
const StatusCard = ({
  title,
  icon: Icon,
  counts,
  onClick
}: {
  title: string;
  icon: any;
  counts: StatusCounts;
  onClick: () => void;
}) => {
  const total = counts.Grønn + counts.Gul + counts.Rød;
  const primaryStatus = counts.Rød > 0 ? "Rød" : counts.Gul > 0 ? "Gul" : "Grønn";
  const bgColors = {
    Grønn: "bg-status-green/20",
    Gul: "bg-status-yellow/20",
    Rød: "bg-status-red/20"
  };
  const borderColors = {
    Grønn: "border-status-green",
    Gul: "border-status-yellow",
    Rød: "border-status-red"
  };
  return <div onClick={onClick} className={`${bgColors[primaryStatus]} ${borderColors[primaryStatus]} border-2 rounded p-2 sm:p-3 transition-all hover:scale-105 cursor-pointer`}>
      <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        <h3 className="font-semibold text-xs sm:text-sm">{title}</h3>
      </div>
      
      <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{total}</div>
      
      <div className="flex flex-wrap gap-1 sm:gap-2 text-[10px] sm:text-xs">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-status-green flex-shrink-0" />
          <span className="whitespace-nowrap">{counts.Grønn}</span>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-status-yellow flex-shrink-0" />
          <span className="whitespace-nowrap">{counts.Gul}</span>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-status-red flex-shrink-0" />
          <span className="whitespace-nowrap">{counts.Rød}</span>
        </div>
      </div>
    </div>;
};
export const StatusPanel = () => {
  const [droneDialogOpen, setDroneDialogOpen] = useState(false);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [personnelDialogOpen, setPersonnelDialogOpen] = useState(false);
  const droneStatus = countByStatus(mockDrones);
  const equipmentStatus = countByStatus(mockEquipment);
  const personnelStatus = countByStatus(mockPersonnel);
  return <>
      <GlassCard className="overflow-hidden">
        <h2 className="text-sm sm:text-base font-semibold mb-3">Ressursstatus </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full">
          <StatusCard title="Droner" icon={Plane} counts={droneStatus} onClick={() => setDroneDialogOpen(true)} />
          <StatusCard title="Utstyr" icon={Gauge} counts={equipmentStatus} onClick={() => setEquipmentDialogOpen(true)} />
          <StatusCard title="Personell" icon={Users} counts={personnelStatus} onClick={() => setPersonnelDialogOpen(true)} />
        </div>
      </GlassCard>
      
      <DroneListDialog open={droneDialogOpen} onOpenChange={setDroneDialogOpen} drones={mockDrones} />
      <EquipmentListDialog open={equipmentDialogOpen} onOpenChange={setEquipmentDialogOpen} equipment={mockEquipment} />
      <PersonnelListDialog open={personnelDialogOpen} onOpenChange={setPersonnelDialogOpen} personnel={mockPersonnel} />
    </>;
};