import { GlassCard } from "@/components/GlassCard";
import { mockDrones, mockEquipment, mockPersonnel } from "@/data/mockData";
import { Plane, Gauge, Users } from "lucide-react";
import { Status } from "@/types";

interface StatusCounts {
  Grønn: number;
  Gul: number;
  Rød: number;
}

const countByStatus = (items: { status: Status }[]): StatusCounts => {
  return items.reduce(
    (acc, item) => {
      acc[item.status]++;
      return acc;
    },
    { Grønn: 0, Gul: 0, Rød: 0 }
  );
};

const StatusCard = ({
  title,
  icon: Icon,
  counts,
}: {
  title: string;
  icon: any;
  counts: StatusCounts;
}) => {
  const total = counts.Grønn + counts.Gul + counts.Rød;
  const primaryStatus = counts.Rød > 0 ? "Rød" : counts.Gul > 0 ? "Gul" : "Grønn";
  
  const bgColors = {
    Grønn: "bg-status-green/20",
    Gul: "bg-status-yellow/20",
    Rød: "bg-status-red/20",
  };
  
  const borderColors = {
    Grønn: "border-status-green",
    Gul: "border-status-yellow",
    Rød: "border-status-red",
  };

  return (
    <div
      className={`${bgColors[primaryStatus]} ${borderColors[primaryStatus]} border-2 rounded p-2 transition-all hover:scale-105 cursor-pointer`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <h3 className="font-semibold text-xs">{title}</h3>
      </div>
      
      <div className="text-2xl font-bold mb-1">{total}</div>
      
      <div className="flex gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-status-green" />
          <span>{counts.Grønn}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-status-yellow" />
          <span>{counts.Gul}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-status-red" />
          <span>{counts.Rød}</span>
        </div>
      </div>
    </div>
  );
};

export const StatusPanel = () => {
  const droneStatus = countByStatus(mockDrones);
  const equipmentStatus = countByStatus(mockEquipment);
  const personnelStatus = countByStatus(mockPersonnel);

  return (
    <GlassCard>
      <h2 className="text-sm font-semibold mb-2">Ressursstatus (RAG)</h2>
      <div className="grid grid-cols-3 gap-2">
        <StatusCard title="Droner" icon={Plane} counts={droneStatus} />
        <StatusCard title="Utstyr" icon={Gauge} counts={equipmentStatus} />
        <StatusCard title="Personell" icon={Users} counts={personnelStatus} />
      </div>
    </GlassCard>
  );
};
